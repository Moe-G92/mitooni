"""Synthetic adversarial checks: source bytes never resemble licensed material."""
import io
import sqlite3
import tempfile
import unittest
from pathlib import Path
import zipfile

from app.corpus.contracts import chunks, digest
from app.corpus.ingestion import Ingestor, safe_zip_entries
from app.corpus.store import connect, initialize, read_chunks

class CorpusTests(unittest.TestCase):
    def test_chunks_lossless_overlap_and_deterministic(self):
        text=('Synthetic paragraph.\n'*300)+'FINAL'
        first=list(chunks(text)); self.assertEqual(first,list(chunks(text)))
        self.assertTrue(first[-1].endswith('FINAL'))
        self.assertTrue(all(0<len(x)<=1600 for x in first))
        self.assertEqual(''.join([first[0]]+[x[160:] for x in first[1:]]),text)
        with self.assertRaises(ValueError): list(chunks('x',2,2))

    def test_archive_traversal_absolute_backslash_symlink_and_duplicate(self):
        for name in ('../escape.mp3','/escape.mp3','dir\\escape.mp3','C:/escape.mp3'):
            stream=io.BytesIO()
            with zipfile.ZipFile(stream,'w') as archive: archive.writestr(name,b'synthetic')
            with zipfile.ZipFile(stream) as archive:
                with self.assertRaises(ValueError): safe_zip_entries(archive)
        stream=io.BytesIO()
        with zipfile.ZipFile(stream,'w') as archive:
            info=zipfile.ZipInfo('link.mp3');info.external_attr=0o120777<<16;archive.writestr(info,b'x')
        with zipfile.ZipFile(stream) as archive:
            with self.assertRaises(ValueError): safe_zip_entries(archive)

    def test_archive_bomb_and_unknown_type(self):
        for name,data in [('huge.mp3',b'0'*1000000),('code.py',b'print(1)')]:
            stream=io.BytesIO()
            with zipfile.ZipFile(stream,'w',compression=zipfile.ZIP_DEFLATED) as archive:archive.writestr(name,data)
            with zipfile.ZipFile(stream) as archive:
                with self.assertRaises(ValueError):safe_zip_entries(archive)

    def test_store_idempotent_no_reset_and_foreign_keys(self):
        with tempfile.TemporaryDirectory() as tmp:
            conn=connect(Path(tmp)/'private.sqlite');initialize(conn)
            conn.execute('CREATE TABLE synthesis_owned(id TEXT)');conn.execute("INSERT INTO synthesis_owned VALUES('kept')");conn.commit()
            initialize(conn)
            self.assertEqual(conn.execute('SELECT id FROM synthesis_owned').fetchone()[0],'kept')
            self.assertEqual(read_chunks(conn),[])
            self.assertEqual(conn.execute('PRAGMA foreign_keys').fetchone()[0],1)
            with self.assertRaises(sqlite3.IntegrityError):conn.execute("INSERT INTO corpus_extractions(revision_id,asset_id,tool_config_sha256,extraction_version,metadata_json) VALUES('r','missing','hash','v','{}')")
            conn.close()

    def test_private_output_boundary(self):
        # Validation does not create files outside ignored review/.
        try: import pymupdf
        except ImportError:self.skipTest('PyMuPDF only required by local ingestion runner')
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):Ingestor(tmp,Path(tmp)/'public')

    def test_pdf_resumption_dedupe_corruption_and_ocr_missing(self):
        try: import pymupdf
        except ImportError:self.skipTest('PyMuPDF only required by local ingestion runner')
        app=Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory(dir=app/'review'/'corpus-20261106') as tmp:
            base=Path(tmp);sources=base/'sources';sources.mkdir()
            out=base/'output'
            pdf=sources/'test.pdf'
            doc=pymupdf.open();page=doc.new_page();page.insert_text((40,40),'Synthetic source for extraction tests. '*8);doc.new_page();doc.save(pdf);doc.close()
            runner=Ingestor(sources,out,ocr_binary=None)
            result=runner.process(pdf,'Cambridge Questions/Cambridge 11/Academic.pdf')
            self.assertEqual(result['status'],'partial')
            conn=connect(runner.db)
            rows=conn.execute('SELECT page_number,status FROM corpus_pages ORDER BY page_number').fetchall()
            self.assertEqual([r['status'] for r in rows],['extracted','failed'])
            self.assertEqual(read_chunks(conn),[]) # complete page in partial source stays held
            first=conn.execute('SELECT chunk_id FROM corpus_chunks').fetchone()[0]
            runner.process(pdf,'Cambridge Questions/Cambridge 11/General.pdf')
            self.assertEqual(conn.execute('SELECT COUNT(*) FROM corpus_assets').fetchone()[0],1)
            self.assertEqual(conn.execute('SELECT COUNT(*) FROM corpus_aliases').fetchone()[0],2)
            self.assertEqual(conn.execute('SELECT chunk_id FROM corpus_chunks').fetchone()[0],first)
            conn.close()
            corrupt=sources/'broken.pdf';corrupt.write_bytes(b'not a pdf')
            self.assertEqual(runner.process(corrupt,'Cambridge Questions/broken.pdf')['status'],'failed')

    def test_immutable_page_conflict_and_source_drift(self):
        try: import pymupdf
        except ImportError:self.skipTest('local runner dependency')
        app=Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory(dir=app/'review'/'corpus-20261106') as tmp:
            base=Path(tmp);source=base/'source';source.mkdir()
            pdf=source/'test.pdf';doc=pymupdf.open();p=doc.new_page();p.insert_text((40,40),'Synthetic immutable extraction evidence. '*8);doc.save(pdf);doc.close()
            runner=Ingestor(source,base/'out')
            result=runner.process(pdf,'Cambridge Questions/test.pdf')
            self.assertEqual(result['status'],'complete')
            conn=connect(runner.db)
            page=conn.execute('SELECT * FROM corpus_pages').fetchone()
            with self.assertRaises(ValueError):runner.save_page(conn,page['asset_id'],page['revision_id'],1,'conflicting changed text',page['method'],page['page_sha256'],page['width'],page['height'],[])
            self.assertEqual(conn.execute('SELECT text FROM corpus_pages').fetchone()[0],page['text'])
            old_revision=page['revision_id']
            mismatch=runner.process(pdf,'Cambridge Questions/test.pdf',expected_sha256='0'*64)
            self.assertEqual(mismatch['status'],'failed')
            self.assertEqual(conn.execute('SELECT status FROM corpus_extractions WHERE revision_id=?',(old_revision,)).fetchone()[0],'complete')
            self.assertGreater(len(read_chunks(conn)),0)
            runner.policy_hash='new-policy'
            runner.admit(conn,pdf,'Cambridge Questions/test.pdf')
            self.assertEqual(conn.execute('SELECT revision_id FROM corpus_assets').fetchone()[0],old_revision)
            self.assertGreater(len(read_chunks(conn)),0)
            original_pdf=runner.pdf
            def drift(connection,path,asset,revision):
                status=original_pdf(connection,path,asset,revision)
                path.write_bytes(path.read_bytes()+b'changed')
                return status
            runner.pdf=drift
            expected=digest(pdf.read_bytes())
            changed=runner.process(pdf,'Cambridge Questions/test.pdf',expected_sha256=expected)
            self.assertEqual(changed['status'],'failed')
            self.assertIn('source changed',changed['error'])
            conn.close()

    def test_source_occurrences_preserve_changed_path_identity(self):
        try: import pymupdf
        except ImportError:self.skipTest('local runner dependency')
        app=Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory(dir=app/'review'/'corpus-20261106') as tmp:
            base=Path(tmp);source=base/'source';source.mkdir();p=source/'item.url';p.write_text('synthetic first')
            runner=Ingestor(source,base/'out');first=runner.process(p,'Cambridge Questions/item.url')
            p.write_text('synthetic second');second=runner.process(p,'Cambridge Questions/item.url')
            self.assertNotEqual(first['asset_id'],second['asset_id'])
            conn=connect(runner.db)
            self.assertEqual(conn.execute('SELECT COUNT(*) FROM corpus_source_occurrences').fetchone()[0],2)
            self.assertEqual(conn.execute('SELECT asset_id FROM corpus_aliases').fetchone()[0],second['asset_id'])
            conn.close()

    def test_verified_page_reuse_cache_regeneration_and_refusal(self):
        try: import pymupdf
        except ImportError:self.skipTest('local runner dependency')
        from app.corpus.contracts import canonical
        app=Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory(dir=app/'review'/'corpus-20261106') as tmp:
            base=Path(tmp);source=base/'source';folder=source/'Cambridge Questions';folder.mkdir(parents=True)
            pdf=folder/'test.pdf';doc=pymupdf.open()
            for _ in range(2):p=doc.new_page();p.insert_text((40,40),'Synthetic reusable native passage evidence. '*8)
            doc.save(pdf);doc.close()
            runner=Ingestor(source,base/'out');first=runner.process(pdf,'Cambridge Questions/test.pdf');self.assertEqual(first['status'],'complete')
            conn=connect(runner.db);old_revision=conn.execute('SELECT revision_id FROM corpus_assets').fetchone()[0]
            region=conn.execute("SELECT r.region_id FROM corpus_regions r JOIN corpus_pages p ON p.page_id=r.page_id WHERE p.page_number=2 AND r.kind='page-image'").fetchone()[0]
            regenerated=runner.ensure_region_image(conn,region);self.assertTrue(regenerated.exists())
            regenerated.write_bytes(b'tampered')
            with self.assertRaises(ValueError):runner.ensure_region_image(conn,region)
            regenerated.unlink() # this test's intentionally corrupt generated file
            runner.policy['extractor_code_sha256']='state-only-fix';runner.policy_hash=digest(canonical(runner.policy))
            second=runner.process(pdf,'Cambridge Questions/test.pdf');self.assertEqual(second['status'],'complete')
            self.assertEqual(conn.execute('SELECT COUNT(*) FROM corpus_page_derivations').fetchone()[0],2)
            self.assertEqual(conn.execute('SELECT COUNT(*) FROM corpus_pages WHERE revision_id=?',(old_revision,)).fetchone()[0],2)
            # Corrupted old text or different semantic extraction config cannot be reused.
            old_page=conn.execute('SELECT page_id FROM corpus_pages WHERE revision_id=? AND page_number=1',(old_revision,)).fetchone()[0]
            conn.execute("UPDATE corpus_pages SET text='tampered' WHERE page_id=?",(old_page,));conn.commit()
            runner.policy['ocr']='different-semantic-policy';runner.policy_hash=digest(canonical(runner.policy))
            third=runner.process(pdf,'Cambridge Questions/test.pdf');self.assertEqual(third['status'],'complete')
            self.assertEqual(conn.execute('SELECT COUNT(*) FROM corpus_page_derivations').fetchone()[0],2)
            # Free-space guard fails before bytes/admission when reserve is unavailable.
            runner.minimum_free_bytes=10**30
            self.assertEqual(runner.process(pdf,'Cambridge Questions/test.pdf')['status'],'failed')
            conn.close()

    def test_terminal_snapshot_stays_bound_to_original_revision(self):
        try: import pymupdf
        except ImportError:self.skipTest('local runner dependency')
        from app.corpus.contracts import canonical,VERSION
        from app.corpus.store import bind_run_snapshot
        app=Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory(dir=app/'review'/'corpus-20261106') as tmp:
            base=Path(tmp);source=base/'source';source.mkdir();p=source/'item.url';p.write_text('synthetic shortcut')
            runner=Ingestor(source,base/'out');item=runner.process(p,'Cambridge Questions/item.url')
            conn=connect(runner.db);manifest=[{'path':'Cambridge Questions/item.url','sha256':item['asset_id'],'bytes':p.stat().st_size}]
            conn.execute('INSERT INTO corpus_runs(run_id,manifest_sha256,extraction_version,started_at,status,manifest_json) VALUES(?,?,?,?,?,?)',('test-run',digest(canonical(manifest)),VERSION,'synthetic','running',canonical(manifest)));conn.commit()
            snapshot=bind_run_snapshot(conn,'test-run',runner.policy_hash,terminal=True)
            runner.policy_hash='new-code-state';runner.process(p,'Cambridge Questions/item.url')
            self.assertEqual(bind_run_snapshot(conn,'test-run',snapshot['tool_config_sha256'],terminal=True),snapshot)
            with self.assertRaises(ValueError):bind_run_snapshot(conn,'test-run','different-policy')
            conn.close()

    def test_reuse_rejects_text_and_chunk_integrity_damage(self):
        try: import pymupdf
        except ImportError:self.skipTest('local runner dependency')
        from app.corpus.contracts import canonical
        app=Path(__file__).resolve().parents[3]
        for damaged_table in ('corpus_pages','corpus_chunks'):
            with tempfile.TemporaryDirectory(dir=app/'review'/'corpus-20261106') as tmp:
                base=Path(tmp);source=base/'source';source.mkdir();pdf=source/'test.pdf';doc=pymupdf.open();p=doc.new_page();p.insert_text((40,40),'Synthetic integrity-rejection source. '*8);doc.save(pdf);doc.close()
                runner=Ingestor(source,base/'out');runner.process(pdf,'Cambridge Questions/test.pdf');conn=connect(runner.db)
                conn.execute(f"UPDATE {damaged_table} SET text='accidental damage'");conn.commit()
                runner.policy['extractor_code_sha256']='state-only-fixed';runner.policy_hash=digest(canonical(runner.policy))
                self.assertEqual(runner.process(pdf,'Cambridge Questions/test.pdf')['status'],'complete')
                self.assertEqual(conn.execute('SELECT COUNT(*) FROM corpus_page_derivations').fetchone()[0],0)
                conn.close()

    def test_successful_scanned_page_ocr_uses_real_generated_image(self):
        try: import pymupdf
        except ImportError:self.skipTest('local runner dependency')
        app=Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory(dir=app/'review'/'corpus-20261106') as tmp:
            base=Path(tmp);source=base/'source';source.mkdir();pdf=source/'scan.pdf';doc=pymupdf.open();page=doc.new_page();page.draw_rect(pymupdf.Rect(50,50,200,200),color=(0,0,0));doc.save(pdf);doc.close()
            runner=Ingestor(source,base/'out');seen=[]
            def local_ocr(image):
                self.assertTrue(Path(image).is_file());seen.append(image)
                return 'Synthetic recognized source text.',[{'text':'Synthetic recognized source text.','bbox':[0.1,0.7,0.8,0.9],'confidence':0.9}]
            runner.ocr=local_ocr
            self.assertEqual(runner.process(pdf,'Cambridge Questions/scan.pdf')['status'],'complete')
            self.assertEqual(len(seen),1)
            conn=connect(runner.db)
            self.assertEqual(conn.execute('SELECT method FROM corpus_pages').fetchone()[0],'apple-vision-ocr');conn.close()

    def test_full_synthetic_run_uses_spawned_processes(self):
        try: import pymupdf
        except ImportError:self.skipTest('local runner dependency')
        from app.corpus.ingestion import ROOTS
        app=Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory(dir=app/'review'/'corpus-20261106') as tmp:
            base=Path(tmp);source=base/'source'
            for root in ROOTS:(source/root).mkdir(parents=True)
            for root in (ROOTS[0],ROOTS[2]):
                doc=pymupdf.open();page=doc.new_page();page.insert_text((40,40),'Synthetic parallel isolated process source. '*8);doc.save(source/root/'test.pdf');doc.close()
            (source/ROOTS[1]/'pointer.url').write_text('synthetic-only-no-fetch')
            runner=Ingestor(source,base/'out',workers=2);summary=runner.run()
            self.assertEqual(summary['original_files'],3);self.assertEqual(summary['failed_originals'],0)
            self.assertEqual(summary['page_statuses'],{'extracted':2})
            self.assertTrue(summary['terminal']);self.assertFalse(summary['semantic_completion'])

    def test_rotated_source_geometry_render_and_original_bytes(self):
        try: import pymupdf
        except ImportError:self.skipTest('local runner dependency')
        from app.corpus.ingestion import file_hash
        app=Path(__file__).resolve().parents[3]
        expected={0:[10,20,70,80],90:[220,10,280,70],180:[130,220,190,280],270:[20,130,80,190]}
        with tempfile.TemporaryDirectory(dir=app/'review'/'corpus-20261106') as tmp:
            base=Path(tmp);source=base/'source';source.mkdir();runner=Ingestor(source,base/'out')
            for angle in (0,90,180,270):
                pdf=source/f'rotated-{angle}.pdf';doc=pymupdf.open();page=doc.new_page(width=200,height=300);page.draw_rect(pymupdf.Rect(10,20,70,80),fill=(1,0,0));page.insert_textbox(pymupdf.Rect(10,100,190,280),'Synthetic coordinate evidence. '*8,fontsize=10);page.set_rotation(angle);doc.save(pdf);doc.close();before=file_hash(pdf)
                with pymupdf.open(pdf) as original:pixel_hash=digest(original[0].get_pixmap(matrix=pymupdf.Matrix(2,2),alpha=False).samples)
                result=runner.process(pdf,f'Cambridge Questions/rotated-{angle}.pdf');self.assertEqual(result['status'],'complete');self.assertEqual(file_hash(pdf),before)
                conn=connect(runner.db);row=conn.execute('SELECT * FROM corpus_pages WHERE asset_id=?',(result['asset_id'],)).fetchone();self.assertEqual(row['page_sha256'],pixel_hash)
                region=conn.execute("SELECT bbox_json FROM corpus_regions WHERE page_id=? AND kind='vector-graphic'",(row['page_id'],)).fetchone()
                import json
                self.assertEqual(json.loads(region[0]),expected[angle]);conn.close()

    def test_nonzero_cropbox_rotation_keeps_original_raster_and_visible_crop(self):
        try: import pymupdf
        except ImportError:self.skipTest('local runner dependency')
        from app.corpus.ingestion import file_hash
        from PIL import Image
        import json
        app=Path(__file__).resolve().parents[3]
        expected={0:[5,10,65,70],90:[210,5,270,65],180:[125,210,185,270],270:[10,125,70,185]}
        with tempfile.TemporaryDirectory(dir=app/'review'/'corpus-20261106') as tmp:
            base=Path(tmp);source=base/'source';folder=source/'Cambridge Questions';folder.mkdir(parents=True);runner=Ingestor(source,base/'out')
            for angle in (0,90,180,270):
                pdf=folder/f'cropped-{angle}.pdf';doc=pymupdf.open();page=doc.new_page(width=200,height=300);page.draw_rect(pymupdf.Rect(10,20,70,80),fill=(1,0,0));page.insert_textbox(pymupdf.Rect(10,100,190,270),'Synthetic cropped source geometry. '*8,fontsize=9);page.set_cropbox(pymupdf.Rect(5,10,195,290));page.set_rotation(angle);doc.save(pdf);doc.close();original_sha=file_hash(pdf)
                with pymupdf.open(pdf) as doc:pixel_sha=digest(doc[0].get_pixmap(matrix=pymupdf.Matrix(2,2),alpha=False).samples)
                result=runner.process(pdf,f'Cambridge Questions/cropped-{angle}.pdf');self.assertEqual(result['status'],'complete');self.assertEqual(file_hash(pdf),original_sha)
                conn=connect(runner.db);page=conn.execute('SELECT * FROM corpus_pages WHERE asset_id=?',(result['asset_id'],)).fetchone();self.assertEqual(page['page_sha256'],pixel_sha)
                region=conn.execute("SELECT * FROM corpus_regions WHERE page_id=? AND kind='vector-graphic'",(page['page_id'],)).fetchone();self.assertEqual(json.loads(region['bbox_json']),expected[angle])
                image=runner.ensure_region_image(conn,region['region_id'])
                with Image.open(image) as crop:self.assertGreater(crop.getpixel((crop.width//2,crop.height//2))[0],200)
                image.unlink();self.assertTrue(runner.ensure_region_image(conn,region['region_id']).exists());conn.close()

    def test_integrity_overlay_is_append_only_and_blocks_default_without_raw_rewrite(self):
        try: import pymupdf
        except ImportError:self.skipTest('local runner dependency')
        from app.corpus.contracts import canonical,VERSION
        app=Path(__file__).resolve().parents[3]
        with tempfile.TemporaryDirectory(dir=app/'review'/'corpus-20261106') as tmp:
            base=Path(tmp);source=base/'source';source.mkdir();pdf=source/'test.pdf';doc=pymupdf.open();page=doc.new_page();page.insert_textbox(pymupdf.Rect(40,40,550,750),'Synthetic integrity-overlay source. '*20);doc.save(pdf);doc.close();runner=Ingestor(source,base/'out');result=runner.process(pdf,'Cambridge Questions/test.pdf');conn=connect(runner.db)
            self.assertGreater(len(read_chunks(conn)),0);raw_page=dict(conn.execute('SELECT * FROM corpus_pages').fetchone());revision=raw_page['revision_id']
            conn.execute('INSERT INTO corpus_runs(run_id,manifest_sha256,extraction_version,started_at,status,manifest_json) VALUES(?,?,?,?,?,?)',('overlay-run','hash',VERSION,'synthetic','terminal','[]'))
            conn.execute('INSERT INTO corpus_integrity_audits VALUES(?,?,?,?,?,?,?,?)',('audit','overlay-run',runner.policy_hash,'hash','report','synthetic-audit','synthetic','{}'))
            conn.execute('INSERT INTO corpus_integrity_holds VALUES(?,?,?,?,?,?,?,?,?)',('hold','audit',result['asset_id'],revision,raw_page['page_id'],'source-render-warning-needs-review',1,'synthetic warning','{}'));conn.commit()
            self.assertEqual(read_chunks(conn),[])
            self.assertEqual(dict(conn.execute('SELECT * FROM corpus_pages').fetchone()),raw_page)
            self.assertEqual(conn.execute('SELECT status FROM corpus_extractions').fetchone()[0],'complete')
            with self.assertRaises(sqlite3.IntegrityError):conn.execute("UPDATE corpus_integrity_holds SET blocks_default=0")
            with self.assertRaises(sqlite3.IntegrityError):conn.execute("DELETE FROM corpus_integrity_holds")
            conn.close()

    def test_private_store_creation_modes_and_link_refusal(self):
        import os,stat
        with tempfile.TemporaryDirectory() as tmp:
            base=Path(tmp);existing=base/'existing';existing.mkdir(mode=0o755);existing.chmod(0o755)
            path=existing/'new-private'/'store.sqlite3';conn=connect(path);initialize(conn)
            self.assertEqual(stat.S_IMODE(path.stat().st_mode),0o600)
            self.assertEqual(stat.S_IMODE(path.parent.stat().st_mode),0o700)
            self.assertEqual(stat.S_IMODE(existing.stat().st_mode),0o755)
            for suffix in ('-wal','-shm'):
                side=Path(str(path)+suffix)
                if side.exists():self.assertEqual(stat.S_IMODE(side.stat().st_mode),0o600)
            conn.close();link=base/'linked.sqlite';link.symlink_to(path)
            with self.assertRaises(OSError):connect(link)
            hard=base/'hard.sqlite';os.link(path,hard)
            with self.assertRaises(ValueError):connect(hard)

if __name__=='__main__':unittest.main()
