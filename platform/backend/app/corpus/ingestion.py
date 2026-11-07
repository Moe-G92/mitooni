"""Resumable local-only licensed corpus ingestion.

Original bytes remain read-only. SQLite and rendered caches belong in ignored review/.
"""
from __future__ import annotations
from concurrent.futures import ProcessPoolExecutor
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
import hashlib
import json
import os
import multiprocessing
import shutil
import stat
import subprocess
import tempfile
import zipfile

from .contracts import VERSION, canonical, chunks, classify, digest
from .store import bind_run_snapshot, connect, initialize

ROOTS = ('Band Descriptors', 'Cambridge Questions', 'Mindset for IELTs Books')
MAX_ZIP_BYTES = 2_000_000_000
MAX_MEMBER_BYTES = 500_000_000

def now():
    return datetime.now(timezone.utc).isoformat()

def file_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as handle:
        for piece in iter(lambda: handle.read(1024 * 1024), b''):
            h.update(piece)
    return h.hexdigest()

def inventory(root):
    result = []
    for name in ROOTS:
        folder = root / name
        if not folder.is_dir():
            raise ValueError(f'missing source root: {name}')
        for path in sorted(folder.rglob('*')):
            if any(part.startswith('.') for part in path.relative_to(folder).parts):
                continue
            if path.is_symlink():
                raise ValueError('source symlink refused')
            if path.is_file():
                result.append({'path': path.relative_to(root).as_posix(), 'sha256': file_hash(path), 'bytes': path.stat().st_size})
    return result

def safe_zip_entries(archive):
    infos = archive.infolist()
    if len(infos) > 5000:
        raise ValueError('archive member count limit')
    total = 0
    names = set()
    for info in infos:
        name = info.filename
        parts = PurePosixPath(name).parts
        mode = info.external_attr >> 16
        if '\\' in name or name.startswith('/') or '..' in parts or ':' in name or stat.S_ISLNK(mode):
            raise ValueError('unsafe archive path/type')
        if name in names:
            raise ValueError('duplicate archive member')
        names.add(name)
        total += info.file_size
        if info.file_size > MAX_MEMBER_BYTES or total > MAX_ZIP_BYTES or info.file_size / max(1, info.compress_size) > 500:
            raise ValueError('archive expansion limit')
        if not info.is_dir() and Path(name).suffix.lower() != '.mp3':
            raise ValueError('unapproved archive member type')
    return [x for x in infos if not x.is_dir()]

class Ingestor:
    def __init__(self, source_root, output, *, ocr_binary=None, workers=2):
        import pymupdf
        self.source_root = Path(source_root).resolve()
        self.output = Path(output).resolve()
        # A caller cannot accidentally place raw source content in committed/public output.
        app = Path(__file__).resolve().parents[4]
        allowed = app / 'review' / 'corpus-20261106'
        if self.output != allowed and allowed not in self.output.parents:
            raise ValueError('private output must be beneath ignored review/corpus-20261106')
        self.output.mkdir(parents=True, exist_ok=True)
        self.db = self.output / 'store.sqlite3'
        self.ocr_binary = str(Path(ocr_binary).resolve()) if ocr_binary else None
        self.workers = min(4, max(1, workers))
        self.minimum_free_bytes = 6 * 1024**3
        self.policy = {'version': VERSION, 'pymupdf': pymupdf.VersionBind, 'ocr': 'Apple-Vision-accurate-en-US', 'ocr_binary_sha256':file_hash(self.ocr_binary) if self.ocr_binary else None,'chunk_size':1600,'overlap':160,'render_dpi':144,'minimum_native_alnum':60,'source_graph':'typed-visual-region-v1','coordinate_frame':'original-display-transform-native-boxes','executor':'spawned-processes','extractor_code_sha256':file_hash(__file__),'blank_policy':'empty_ocr_is_blank_candidate_not_verified'}
        self.policy_hash = digest(canonical(self.policy))
        self.reuse_keys = ('version','pymupdf','ocr','ocr_binary_sha256','chunk_size','overlap','render_dpi','minimum_native_alnum','source_graph','blank_policy')
        self.authority = digest('Arash-20261106-full-processing-Iran-distribution')
        conn = connect(self.db); initialize(conn)
        conn.execute('INSERT OR IGNORE INTO corpus_authorities VALUES(?,?,?,?,?,?)',(self.authority,'Iran','full internal processing','Iranian audience only',now(),'Arash direct instruction 2026-11-06; no external paid calls/publication authority'))
        conn.commit(); conn.close()
        self.ocr_available = None

    def job(self, conn, asset, revision, kind, reason, page_id=None):
        jid = digest(canonical([revision, kind, page_id]))
        conn.execute('INSERT OR REPLACE INTO corpus_jobs VALUES(?,?,?,?,?,?,?,?)',(jid,asset,revision,page_id,kind,'blocked',reason,1))

    def admit(self, conn, path, relative, parent=None, member=None):
        asset = file_hash(path)
        revision = digest(canonical([asset,self.policy_hash]))
        track, edition, fmt, inferred = classify(relative)
        suffix = path.suffix.lower().lstrip('.') or 'unknown'
        conn.execute('INSERT OR IGNORE INTO corpus_assets VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',(asset,revision,asset,'alias-scoped-no-asset-grant',suffix,path.stat().st_size,VERSION,'pending',None,track,edition,fmt,canonical(inferred)))
        conn.execute('INSERT OR IGNORE INTO corpus_extractions(revision_id,asset_id,tool_config_sha256,extraction_version,metadata_json) VALUES(?,?,?,?,?)',(revision,asset,self.policy_hash,VERSION,canonical(self.policy)))
        conn.execute('INSERT OR IGNORE INTO corpus_aliases VALUES(?,?,?,?,?,?,?,?,?,?)',(digest(relative),asset,relative,relative.split('/')[0],self.authority,track,edition,fmt,parent,member))
        occurrence=digest(canonical([relative,asset,self.authority]))
        conn.execute('INSERT OR IGNORE INTO corpus_source_occurrences VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(occurrence,digest(relative),asset,relative,relative.split('/')[0],self.authority,track,edition,fmt,parent,member,now()))
        conn.commit()
        return asset, revision

    def ocr(self, image):
        if self.ocr_available is False:
            raise RuntimeError('OCR dependency blocked by failed preflight')
        if not self.ocr_binary:
            raise RuntimeError('local OCR unavailable; configure --ocr-binary')
        proc = subprocess.run([self.ocr_binary,str(image)],capture_output=True,text=True,timeout=180)
        if proc.returncode:
            self.ocr_available = False
            raise RuntimeError('OCR failed: '+proc.stderr[:200])
        data = json.loads(proc.stdout)
        rows = data['rows']
        self.ocr_available = True
        return '\n'.join(x['text'] for x in rows), rows

    def save_page(self, conn, asset, revision, number, text, method, rendered_hash, width, height, regions, error=None, blank_verified=False):
        pid = digest(canonical([revision,number]))
        status = 'failed' if error else 'extracted' if text.strip() else 'blank-verified' if blank_verified else 'blank-candidate'
        previous=conn.execute('SELECT * FROM corpus_pages WHERE page_id=?',(pid,)).fetchone()
        if previous and previous['status'] != 'failed':
            if previous['text_sha256'] != digest(text) or previous['page_sha256'] != rendered_hash or previous['method'] != method:
                raise ValueError('immutable page conflict: new extraction policy/revision required')
            return previous['status']
        with conn:
            conn.execute("INSERT INTO corpus_pages VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(page_id) DO UPDATE SET page_sha256=excluded.page_sha256,text_sha256=excluded.text_sha256,text=excluded.text,method=excluded.method,status=excluded.status,width=excluded.width,height=excluded.height,error=excluded.error WHERE corpus_pages.status='failed'",(pid,asset,revision,number,rendered_hash,digest(text),text,method,status,width,height,error))
            if error:
                self.job(conn,asset,revision,'page-extraction',error,pid)
            else:
                prior_entity = None
                for index, region in enumerate(regions):
                    rid = digest(f'{pid}:{index}')
                    metadata = region.get('metadata',{})
                    conn.execute('INSERT OR IGNORE INTO corpus_regions VALUES(?,?,?,?,?,?)',(rid,pid,region['kind'],canonical(region['bbox']),region.get('text',''),canonical(metadata)))
                    entity = digest('entity:'+rid)
                    conn.execute('INSERT OR IGNORE INTO corpus_entities VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',(entity,revision,pid,rid,region['kind'],index,canonical(region['bbox']),metadata.get('image_sha256'),metadata.get('image_path'),digest(region.get('text','')),'proposed',metadata.get('confidence'),canonical(metadata)))
                    if prior_entity:
                        edge=digest(prior_entity+entity+'reading_order')
                        conn.execute('INSERT OR IGNORE INTO corpus_edges VALUES(?,?,?,?,?,?,?,?)',(edge,revision,prior_entity,entity,'reading_order','proposed',None,canonical({'method':'extractor-order','page':number})))
                    if metadata.get('parent_region_index') is not None:
                        parent_region=digest(f"{pid}:{metadata['parent_region_index']}")
                        parent_entity=digest('entity:'+parent_region)
                        conn.execute('INSERT OR IGNORE INTO corpus_edges VALUES(?,?,?,?,?,?,?,?)',(digest(entity+parent_entity+'cell_of'),revision,entity,parent_entity,'cell_of','proposed',None,canonical({'method':'pymupdf-native-grid','page':number})))
                    prior_entity=entity
                    if region['kind'] in ('figure','table','chart','vector-graphic','table-extraction-failure'):
                        self.job(conn,asset,revision,'visual-structure-review','Preserved source image and bounding box; table cells/chart series and semantic links require review',pid)

                for ordinal, part in enumerate(chunks(text)):
                    cid = digest(canonical([revision,pid,ordinal,digest(part)]))
                    conn.execute('INSERT OR IGNORE INTO corpus_chunks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(cid,asset,revision,pid,digest(part),part,number,number,None,None,None,'text',method,VERSION,'machine-extracted-unreviewed','extracted',ordinal))
                conn.execute("UPDATE corpus_jobs SET status='resolved' WHERE page_id=? AND kind='page-extraction'",(pid,))
        return status

    def guard_disk(self):
        if shutil.disk_usage(self.output).free < self.minimum_free_bytes:
            raise RuntimeError('disk safety floor reached: need at least 6 GiB free; extraction paused')

    def prune_page_cache(self, regions, number):
        # All generated images are reproducible from immutable original bytes and bbox.
        # Keep first-page samples, bounded by source count; never touch originals.
        if number == 1: return
        for region in regions:
            metadata=region.get('metadata',{})
            relative=metadata.get('image_path')
            if not relative:continue
            target=(self.output/relative).resolve()
            if target.parent not in (self.output/'renders',self.output/'figures'):continue
            if target.is_file() and not target.is_symlink():target.unlink()

    def reuse_page(self,conn,asset,revision,number,pixel_sha256,width,height,page,pix,source_rotation=0):
        candidates=conn.execute("SELECT p.*,x.metadata_json policy FROM corpus_pages p JOIN corpus_extractions x ON x.revision_id=p.revision_id WHERE p.asset_id=? AND p.page_number=? AND p.revision_id!=? AND p.status IN ('extracted','blank-verified') AND x.status='complete' AND json_extract(x.quality_json,'$.source_hash_verified')=1 ORDER BY p.rowid DESC",(asset,number,revision)).fetchall()
        for old in candidates:
            policy=json.loads(old['policy'])
            if any(policy.get(key)!=self.policy.get(key) for key in self.reuse_keys):continue
            if old['page_sha256']!=pixel_sha256 or digest(old['text'])!=old['text_sha256']:continue
            if old['method']=='pymupdf-native' and digest(page.get_text(sort=True))!=old['text_sha256']:continue
            old_chunks=conn.execute('SELECT text,text_sha256,ordinal FROM corpus_chunks WHERE page_id=? ORDER BY ordinal',(old['page_id'],)).fetchall()
            expected=list(chunks(old['text']))
            if len(old_chunks)!=len(expected):continue
            if any(row['ordinal']!=i or row['text']!=expected[i] or row['text_sha256']!=digest(expected[i]) for i,row in enumerate(old_chunks)):continue
            saved=conn.execute('SELECT r.*,e.reading_order,e.bbox_json entity_bbox,e.text_sha256 entity_text_hash,e.metadata_json entity_metadata FROM corpus_regions r JOIN corpus_entities e ON e.region_id=r.region_id WHERE r.page_id=? ORDER BY e.reading_order',(old['page_id'],)).fetchall()
            if not saved:continue
            valid_geometry=True
            for r in saved:
                box=json.loads(r['bbox_json'])
                if r['bbox_json']!=r['entity_bbox'] or digest(r['text'])!=r['entity_text_hash'] or r['metadata_json']!=r['entity_metadata']:
                    valid_geometry=False;break
                if len(box)!=4 or box[0]<-8 or box[1]<-8 or box[2]>width+8 or box[3]>height+8 or box[2]<box[0] or box[3]<box[1]:
                    valid_geometry=False;break
            if not valid_geometry:continue
            old_regions=[{'kind':r['kind'],'bbox':json.loads(r['bbox_json']),'text':r['text'],'metadata':json.loads(r['metadata_json'])} for r in saved]
            # Every referenced generated image is rebuildable; existing bytes must match.
            valid=True
            for region in old_regions:
                metadata=region['metadata'];image_path=metadata.get('image_path')
                if image_path:
                    target=(self.output/image_path).resolve()
                    if target.exists() and self.output in target.parents and metadata.get('image_sha256') and file_hash(target)!=metadata['image_sha256']:
                        valid=False;break
            if not valid:continue
            # Rebuild graphic/native geometry from source. Legacy OCR line geometry
            # has no immutable creation digest, so only reuse its verified page text.
            regions=self.native_regions(page,pix,revision,number,pixel_sha256,source_rotation)
            regions.append({'kind':'page-level-text','bbox':[0,0,width,height],'text':old['text'],'metadata':{'derived_from_page_id':old['page_id'],'geometry_scope':'whole-page-only','per-line-ocr-geometry':'not-reused'}})
            self.save_page(conn,asset,revision,number,old['text'],old['method'],pixel_sha256,width,height,regions,blank_verified=old['status']=='blank-verified')
            pid=digest(canonical([revision,number]))
            with conn:
                conn.execute('INSERT OR IGNORE INTO corpus_page_derivations VALUES(?,?,?,?,?,?)',(pid,old['page_id'],asset,pixel_sha256,old['text_sha256'],canonical({'source_sha256_verified':True,'pixel_regenerated_and_verified':True,'text_sha256_verified':True,'deterministic_chunks_verified':True,'semantic_output_policy_keys':list(self.reuse_keys),'from_revision':old['revision_id'],'graph_geometry':'regenerated-from-source; legacy OCR line geometry not reused'})))
            self.prune_page_cache(regions,number)
            return True
        return False

    def ensure_region_image(self, conn, region_id):
        """Regenerate a pruned image from source bytes; fail on any hash mismatch."""
        import pymupdf
        row=conn.execute('SELECT r.*,p.asset_id,p.page_number,p.page_sha256,a.media_type FROM corpus_regions r JOIN corpus_pages p ON p.page_id=r.page_id JOIN corpus_assets a ON a.asset_id=p.asset_id WHERE r.region_id=?',(region_id,)).fetchone()
        if row is None:raise ValueError('unknown source region')
        metadata=json.loads(row['metadata_json'])
        image_path=metadata.get('image_path');expected=metadata.get('image_sha256')
        if not image_path or not expected:raise ValueError('region has no image; use its owning page-image entity')
        occurrence=conn.execute('SELECT relative_path FROM corpus_source_occurrences WHERE asset_id=? AND parent_asset_id IS NULL ORDER BY recorded_at LIMIT 1',(row['asset_id'],)).fetchone()
        if occurrence is None:raise ValueError('original source occurrence unavailable')
        original=(self.source_root/occurrence[0]).resolve()
        if self.source_root not in original.parents or not original.is_file() or file_hash(original)!=row['asset_id']:
            raise ValueError('original source hash changed or missing')
        if metadata.get('origin')=='unchanged-source':return original
        target=(self.output/image_path).resolve()
        if target.parent not in (self.output/'renders',self.output/'figures'):raise ValueError('unsafe generated image path')
        if target.exists():
            if file_hash(target)!=expected:raise ValueError('cached image hash changed')
            return target
        self.guard_disk()
        if row['media_type']=='doc':
            converted=list((self.output/'converted'/row['asset_id']).glob('*.pdf'))
            if len(converted)!=1:raise ValueError('DOC derivative unavailable; rerun verified conversion')
            original=converted[0]
        with pymupdf.open(original) as doc:
            page=doc[row['page_number']-1]
            pix=page.get_pixmap(matrix=pymupdf.Matrix(2,2),alpha=False)
            if digest(pix.samples)!=row['page_sha256']:raise ValueError('regenerated page pixel hash differs')
            box=pymupdf.Rect(json.loads(row['bbox_json']))
            target.parent.mkdir(exist_ok=True)
            if row['kind']!='page-image' and metadata.get('image_renderer')=='source-full-rgb-crop-pillow':self.save_display_crop(pix,box,target)
            else:
                if row['kind']!='page-image':pix=page.get_pixmap(matrix=pymupdf.Matrix(2,2),clip=box,alpha=False)
                if target.suffix=='.jpg':pix.pil_save(target,format='JPEG',quality=88)
                else:pix.save(target)
        if file_hash(target)!=expected:
            target.unlink()
            raise ValueError('regenerated image encoding hash differs; extraction policy/version mismatch')
        return target

    def save_display_crop(self,pix,box,target):
        """Crop unchanged original RGB pixels in displayed page coordinates."""
        from PIL import Image
        import math
        bounds=[max(0,math.floor(box.x0*2)-pix.x),max(0,math.floor(box.y0*2)-pix.y),min(pix.width,math.ceil(box.x1*2)-pix.x),min(pix.height,math.ceil(box.y1*2)-pix.y)]
        if bounds[2]<=bounds[0] or bounds[3]<=bounds[1]:raise ValueError('empty display crop')
        target.parent.mkdir(exist_ok=True)
        Image.frombytes('RGB',(pix.width,pix.height),pix.samples).crop(bounds).save(target,format='PNG')
        return bounds

    def native_regions(self,page,pix,revision,number,pagehash,source_rotation=0):
        import pymupdf
        def display(box):return pymupdf.Rect(box)*page.rotation_matrix
        image=self.output/'renders'/f'{revision}-{number}.jpg';image.parent.mkdir(exist_ok=True);pix.pil_save(image,format='JPEG',quality=88)
        regions=[{'kind':'page-image','bbox':[0,0,page.rect.width,page.rect.height],'metadata':{'image_path':str(image.relative_to(self.output)),'image_sha256':file_hash(image),'pixel_sha256':pagehash,'original_rotation':source_rotation,'coordinate_frame':'original-display-points','native_box_transform':list(page.rotation_matrix)}}]
        def visual(kind,box,suffix,extra):
            box &= page.rect
            if box.is_empty:return
            target=self.output/'figures'/f'{revision}-{number}-{suffix}.png'
            pixels=self.save_display_crop(pix,box,target)
            regions.append({'kind':kind,'bbox':list(box),'metadata':{'image_path':str(target.relative_to(self.output)),'image_sha256':file_hash(target),'image_renderer':'source-full-rgb-crop-pillow','pixel_bbox':pixels,'classification':'proposed',**extra}})
        for index,info in enumerate(page.get_image_info()):visual('figure',display(info['bbox']),f'image-{index}',{'semantic_type':'unclassified-image'})
        drawings=page.get_drawings()
        boxes=[display(item['rect']) for item in drawings if not pymupdf.Rect(item['rect']).is_empty]
        if boxes:
            box=boxes[0]
            for extra in boxes[1:]:box |= extra
            visual('vector-graphic',box,'vector',{'semantic_type':'unclassified-vector-art','drawing_count':len(drawings)})
        if len(drawings)>5:
            try:
                tables=page.find_tables().tables
                for table in tables:
                    table_index=len(regions)
                    header=table.header
                    visual('table',display(table.bbox),f'table-{table_index}',{'rows':table.row_count,'columns':table.col_count,'cells':table.extract(),'header':{'bbox':list(display(header.bbox)),'cells':[list(display(b)) if b else None for b in header.cells],'names':header.names,'external':header.external},'classification':'native-grid-candidate-unreviewed'})
                    if len(regions)==table_index:continue
                    for cell_index,cell in enumerate(table.cells):
                        if cell:regions.append({'kind':'table-cell','bbox':list(display(cell)),'text':page.get_textbox(pymupdf.Rect(cell)),'metadata':{'parent_region_index':table_index,'cell_index':cell_index,'classification':'native-grid-candidate-unreviewed'}})
            except Exception as exc:regions.append({'kind':'table-extraction-failure','bbox':[0,0,page.rect.width,page.rect.height],'metadata':{'error_type':type(exc).__name__,'classification':'review-required'}})
        for block in page.get_text('blocks'):regions.append({'kind':'text' if block[6]==0 else 'image','bbox':list(display(block[:4])),'text':block[4] if block[6]==0 else ''})
        return regions

    def pdf(self, conn, path, asset, revision):
        import pymupdf
        pymupdf.TOOLS.mupdf_display_errors(False)
        doc = pymupdf.open(path)
        expected = len(doc)
        if not expected or doc.needs_pass:
            raise ValueError('empty or password protected PDF')
        conn.execute('UPDATE corpus_assets SET expected_pages=? WHERE asset_id=?',(expected,asset)); conn.commit()
        failed = False
        for index in range(expected):
            self.guard_disk()
            previous = conn.execute('SELECT status FROM corpus_pages WHERE revision_id=? AND page_number=?',(revision,index+1)).fetchone()
            if previous and previous['status'] in ('extracted','blank-verified'):
                continue
            try:
                page = doc[index]
                source_rotation=page.rotation
                pix = page.get_pixmap(matrix=pymupdf.Matrix(2,2),alpha=False)
                pagehash = digest(pix.samples)
                if self.reuse_page(conn,asset,revision,index+1,pagehash,page.rect.width,page.rect.height,page,pix,source_rotation):
                    continue
                text = page.get_text(sort=True)
                regions=self.native_regions(page,pix,revision,index+1,pagehash,source_rotation)
                # Native text may be only a watermark: require actual alphanumeric body.
                method='pymupdf-native'
                if sum(ch.isalnum() for ch in text) < 60:
                    image=self.output/regions[0]['metadata']['image_path']
                    text, rows=self.ocr(image); method='apple-vision-ocr'
                    regions.extend({'kind':'ocr-text','bbox':[r['bbox'][0]*page.rect.width,(1-r['bbox'][3])*page.rect.height,r['bbox'][2]*page.rect.width,(1-r['bbox'][1])*page.rect.height],'text':r['text'],'metadata':{'confidence':r['confidence']}} for r in rows)
                blank_verified=False
                if not text.strip():
                    from PIL import Image, ImageStat
                    stats=ImageStat.Stat(Image.frombytes('RGB',(pix.width,pix.height),pix.samples).convert('L'))
                    blank_verified=stats.mean[0]>230 and stats.stddev[0]<2
                self.save_page(conn,asset,revision,index+1,text,method,pagehash,page.rect.width,page.rect.height,regions,blank_verified=blank_verified)
                self.prune_page_cache(regions,index+1)
                if not text.strip() and not blank_verified:
                    self.job(conn,asset,revision,'image-ocr-review','OCR returned no text on nonblank image; preserved visual requires review',digest(canonical([revision,index+1])))
                    conn.commit()
            except Exception as exc:
                failed=True
                self.save_page(conn,asset,revision,index+1,'','failed','',0,0,[],f'{type(exc).__name__}: {str(exc)[:300]}')
        rows=conn.execute('SELECT status,COUNT(*) n FROM corpus_pages WHERE revision_id=? GROUP BY status',(revision,)).fetchall()
        counts={r['status']:r['n'] for r in rows}
        doc.close()
        return 'complete' if sum(counts.values())==expected and not counts.get('failed') and not counts.get('blank-candidate') and not failed else 'partial'

    def audio(self,conn,path,asset,revision):
        proc=subprocess.run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)],capture_output=True,text=True,timeout=60)
        if proc.returncode:
            raise ValueError('ffprobe failed')
        meta=json.loads(proc.stdout); streams=[s for s in meta['streams'] if s.get('codec_type')=='audio']
        if not streams: raise ValueError('audio stream absent')
        stream=streams[0]; duration=float(meta['format']['duration'])
        if duration<=0: raise ValueError('invalid duration')
        conn.execute('INSERT OR REPLACE INTO corpus_media VALUES(?,?,?,?,?,?,?,?,?)',(revision,asset,revision,duration,stream.get('codec_name'),stream.get('channels'),int(stream.get('sample_rate',0)),'metadata-admitted-transcript-pending',canonical(meta)))
        self.job(conn,asset,revision,'transcript-alignment','No local ASR installed; book transcript candidates require exact file/track alignment review')
        conn.commit()
        return 'metadata-admitted'

    def process(self,path,relative,parent=None,member=None,expected_sha256=None):
        conn=connect(self.db)
        asset=revision=None
        try:
            self.guard_disk()
            if expected_sha256 is not None and file_hash(path) != expected_sha256:
                raise ValueError('source differs from frozen run manifest')
            asset,revision=self.admit(conn,path,relative,parent,member)
            existing=conn.execute('SELECT status FROM corpus_assets WHERE asset_id=?',(asset,)).fetchone()['status']
            # Revision-specific pages are checked by PDF handler; metadata assets can resume safely.
            suffix=path.suffix.lower()
            if suffix=='.pdf': status=self.pdf(conn,path,asset,revision)
            elif suffix=='.mp3': status=self.audio(conn,path,asset,revision)
            elif suffix=='.png':
                from PIL import Image
                text,rows=self.ocr(path)
                with Image.open(path) as image: width,height=image.size
                self.save_page(conn,asset,revision,1,text,'apple-vision-ocr',asset,width,height,[{'kind':'page-image','bbox':[0,0,width,height],'metadata':{'image_path':relative,'origin':'unchanged-source','image_sha256':asset}}]+[{'kind':'ocr-text','bbox':r['bbox'],'text':r['text'],'metadata':{'coordinates':'normalised-bottom-left','confidence':r['confidence']}} for r in rows]); status='complete' if text.strip() else 'partial'
                if not text.strip(): self.job(conn,asset,revision,'image-ocr-review','No OCR text; retained image requires blank/visual-only verification')
                conn.execute('UPDATE corpus_assets SET expected_pages=1 WHERE asset_id=?',(asset,))
            elif suffix=='.doc':
                target=self.output/'converted'/asset;target.mkdir(parents=True,exist_ok=True)
                profile=self.output/'lo-profiles'/asset
                proc=subprocess.run(['soffice',f'-env:UserInstallation={profile.as_uri()}','--headless','--convert-to','pdf','--outdir',str(target),str(path)],capture_output=True,text=True,timeout=120)
                converted=target/(path.stem+'.pdf')
                if proc.returncode or not converted.exists(): raise RuntimeError('DOC conversion failed')
                status=self.pdf(conn,converted,asset,revision)
            elif suffix=='.zip':
                with zipfile.ZipFile(path) as archive:
                    infos=safe_zip_entries(archive)
                    for info in infos:
                        mid=digest(asset+info.filename)
                        conn.execute('INSERT OR IGNORE INTO corpus_archive_members VALUES(?,?,?,?,?,?,?,?,?,?)',(mid,asset,info.filename,info.file_size,info.CRC,info.compress_type,int(bool(info.flag_bits & 1)),'blocked-encrypted' if info.flag_bits & 1 else 'pending',None,canonical({'expanded_bytes':info.file_size,'compressed_bytes':info.compress_size})))
                    conn.commit()
                    if any(info.flag_bits & 1 for info in infos):
                        raise RuntimeError('AES/encrypted archive: supplied password and supported local decoder required; all members catalogued')
                    for info in infos:
                        target=self.output/'archive-members'/asset/info.filename
                        target.parent.mkdir(parents=True,exist_ok=True)
                        with archive.open(info) as src, open(target,'wb') as dst: shutil.copyfileobj(src,dst,1024*1024)
                        child=self.process(target,relative+'!/'+info.filename,asset,info.filename)
                        conn.execute('UPDATE corpus_archive_members SET status=?,child_asset_id=? WHERE member_id=?',(child['status'],child['asset_id'],digest(asset+info.filename)));conn.commit()
                        if child['status'] in ('failed','partial'): raise RuntimeError('archive child extraction incomplete')
                status='complete'
            elif suffix=='.url':
                conn.execute('UPDATE corpus_assets SET metadata_json=? WHERE asset_id=?',(canonical({'network_fetch':False,'shortcut_text':path.read_text(errors='replace')}),asset)); status='catalogued-no-fetch'
            else:
                self.job(conn,asset,revision,'unsupported-format','No extraction method for extension');status='blocked'
            if file_hash(path) != asset:
                raise ValueError('source changed during extraction; staged revision not adopted')
            prior=conn.execute('SELECT status FROM corpus_assets WHERE asset_id=?',(asset,)).fetchone()['status']
            if status in ('complete','metadata-admitted','catalogued-no-fetch') or prior not in ('complete','metadata-admitted','catalogued-no-fetch'):
                conn.execute('UPDATE corpus_assets SET revision_id=?,extraction_version=?,status=? WHERE asset_id=?',(revision,VERSION,status,asset))
                conn.execute('UPDATE corpus_aliases SET asset_id=? WHERE relative_path=?',(asset,relative))
            conn.execute('UPDATE corpus_extractions SET status=?,extent_json=?,quality_json=? WHERE revision_id=?',(status,canonical({'pages':conn.execute('SELECT COUNT(*) FROM corpus_pages WHERE revision_id=?',(revision,)).fetchone()[0]}),canonical({'source_hash_verified':True,'manifest_hash_verified':expected_sha256 is not None,'semantic_review':'pending'}),revision));conn.commit()
            return {'asset_id':asset,'status':status,'path':relative,'error':None}
        except Exception as exc:
            error=f'{type(exc).__name__}: {str(exc)[:300]}'
            if asset:
                conn.execute("UPDATE corpus_assets SET status='failed' WHERE asset_id=? AND revision_id=? AND status NOT IN ('complete','metadata-admitted','catalogued-no-fetch')",(asset,revision)); conn.execute("UPDATE corpus_extractions SET status='failed' WHERE revision_id=? AND status NOT IN ('complete','metadata-admitted','catalogued-no-fetch')",(revision,)); self.job(conn,asset,revision,'asset-extraction',error);conn.commit()
            return {'asset_id':asset,'status':'failed','path':relative,'error':error}
        finally: conn.close()

    def link_transcript_candidates(self):
        conn=connect(self.db)
        # Exact edition and source-relative reference retained; no invented track/time alignment.
        for media in conn.execute('SELECT m.media_id,m.asset_id FROM corpus_media m').fetchall():
            aliases=conn.execute('SELECT relative_path FROM corpus_aliases WHERE asset_id=?',(media['asset_id'],)).fetchall()
            for alias in aliases:
                parts=alias['relative_path'].split('/')
                if len(parts)<2: continue
                prefix='/'.join(parts[:2])+'/%'
                candidates=conn.execute("SELECT DISTINCT c.chunk_id,c.text,c.text_sha256 FROM corpus_chunks c JOIN corpus_aliases a ON a.asset_id=c.asset_id WHERE a.relative_path LIKE ? AND (lower(c.text) LIKE '%tapescript%' OR lower(c.text) LIKE '%transcript%' OR lower(c.text) LIKE '%audioscript%')",(prefix,)).fetchall()
                for chunk in candidates:
                    tid=digest(media['media_id']+chunk['chunk_id'])
                    conn.execute('INSERT OR IGNORE INTO corpus_transcripts VALUES(?,?,?,?,?,?,?,?)',(tid,media['media_id'],chunk['chunk_id'],chunk['text'],chunk['text_sha256'],'licensed-book-candidate','unaligned-edition-candidate',canonical({'source_alias':alias['relative_path'],'track_match':'unverified','timecodes':None})))
        conn.commit(); conn.close()

    def run(self):
        manifest=inventory(self.source_root); encoded=canonical(manifest)
        probe=next((self.source_root/x['path'] for x in manifest if x['path'].lower().endswith('.png')),None)
        if probe is not None:
            try: self.ocr(probe)
            except Exception: self.ocr_available=False
        manifest_hash=digest(encoded); run_id=digest(manifest_hash+self.policy_hash+now())
        conn=connect(self.db)
        conn.execute('INSERT OR IGNORE INTO corpus_runs(run_id,manifest_sha256,extraction_version,started_at,completed_at,status,manifest_json) VALUES(?,?,?,?,?,?,?)',(run_id,manifest_hash,VERSION,now(),None,'running',encoded));conn.commit()
        # Originals explicitly hashed before any extraction. No destructive reset on rerun.
        (self.output/'manifest.json').write_text(encoded)
        bind_run_snapshot(conn,run_id,self.policy_hash)
        with ProcessPoolExecutor(max_workers=self.workers,mp_context=multiprocessing.get_context('spawn')) as pool:
            ordered=sorted(manifest,key=lambda item:(0 if item['path'].startswith('Mindset') else 1,0 if Path(item['path']).suffix.lower() in ('.pdf','.png') else 1,item['path']))
            futures=[pool.submit(self.process,self.source_root/item['path'],item['path'],expected_sha256=item['sha256']) for item in ordered]
            results=[]
            for future in futures:
                result=future.result(); results.append(result)
                if result['asset_id']:
                    conn.execute('INSERT OR REPLACE INTO corpus_run_assets VALUES(?,?,?,?)',(run_id,result['asset_id'],result['status'],result['error']));conn.commit()
                print(json.dumps({k:result[k] for k in ('path','status','error')}),flush=True)
        self.link_transcript_candidates()
        failures=[r for r in results if r['status'] in ('failed','partial','blocked')]
        jobs=conn.execute("SELECT kind,COUNT(*) n FROM corpus_jobs WHERE status='blocked' GROUP BY kind").fetchall()
        snapshot=bind_run_snapshot(conn,run_id,self.policy_hash,terminal=all(result['asset_id'] for result in results))
        summary={**snapshot,'failed_originals':len(failures),'all_page_versions':conn.execute('SELECT COUNT(*) FROM corpus_pages').fetchone()[0],'historical_blocked_jobs':{r['kind']:r['n'] for r in jobs},'expected_pdf_pages':conn.execute("SELECT SUM(a.expected_pages) FROM corpus_run_extractions r JOIN corpus_assets a ON a.asset_id=r.asset_id WHERE r.run_id=? AND a.media_type='pdf'",(run_id,)).fetchone()[0]}
        status='partial' if failures or snapshot['blocked_jobs'] else 'extracted-semantic-review-pending'
        conn.execute('UPDATE corpus_runs SET completed_at=?,status=? WHERE run_id=?',(now(),status,run_id));conn.commit();conn.close()
        (self.output/'summary.json').write_text(json.dumps(summary,indent=2))
        return summary
