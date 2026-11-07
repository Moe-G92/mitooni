"""Synthetic trusted-review fixtures; no real admission/backfill or teacher approval."""
from pathlib import Path
import json
import tempfile
import unittest
from unittest.mock import patch
import sqlite3
from app.corpus import admission as a
from app.corpus.contracts import canonical,digest,VERSION
from app.corpus.ingestion import Ingestor,file_hash
from app.corpus.store import connect,read_chunks

class AdmissionTests(unittest.TestCase):
    def setUp(self):
        try:import pymupdf
        except ImportError:self.skipTest('local extraction runtime needed')
        app=Path(__file__).resolve().parents[3]
        self.tmp=tempfile.TemporaryDirectory(dir=app/'review'/'corpus-20261106');self.addCleanup(self.tmp.cleanup)
        base=Path(self.tmp.name);self.root=base/'source';folder=self.root/'Mindset for IELTs Books';folder.mkdir(parents=True);pdf=folder/'synthetic.pdf'
        doc=pymupdf.open();page=doc.new_page();page.insert_textbox(pymupdf.Rect(40,40,550,750),'Synthetic selected evidence with independently checked scope. '*12);doc.new_page();doc.save(pdf);doc.close()
        runner=Ingestor(self.root,base/'private');result=runner.process(pdf,'Mindset for IELTs Books/synthetic.pdf',expected_sha256=file_hash(pdf));self.assertEqual(result['status'],'partial')
        self.conn=connect(runner.db);self.addCleanup(self.conn.close);self.asset=result['asset_id'];self.rev=self.conn.execute('SELECT revision_id FROM corpus_assets').fetchone()[0]
        manifest=[{'path':'Mindset for IELTs Books/synthetic.pdf','sha256':self.asset,'bytes':pdf.stat().st_size}]
        self.conn.execute('INSERT INTO corpus_runs(run_id,manifest_sha256,extraction_version,started_at,completed_at,status,manifest_json,tool_config_sha256,snapshot_json) VALUES(?,?,?,?,?,?,?,?,?)',('run',digest(canonical(manifest)),VERSION,'fixture','fixture','partial',canonical(manifest),runner.policy_hash,canonical({'terminal':True,'semantic_completion':False})))
        occurrence=self.conn.execute('SELECT * FROM corpus_source_occurrences').fetchone();self.occ=occurrence['occurrence_id']
        self.conn.execute('INSERT INTO corpus_run_extractions VALUES(?,?,?,?,?)',('run',self.asset,self.rev,'partial',None));self.conn.execute('INSERT INTO corpus_run_files VALUES(?,?,?,?,?,?)',('run',manifest[0]['path'],self.asset,self.occ,self.rev,'partial'))
        self.conn.execute('INSERT INTO corpus_integrity_audits VALUES(?,?,?,?,?,?,?,?)',('audit','run',runner.policy_hash,digest(canonical(manifest)),'report','synthetic independently checked page','fixture','{}'))
        self.index={'entries':[{'id':'MS1-R01','relativePath':manifest[0]['path'],'fileSha256':self.asset,'pdfPages':[1]}]};self.indexpath=base/'source-index.json';self.indexpath.write_text(json.dumps(self.index))
        self.payload={'id':'fnd-reading-train','version':1,'provenance':{'sourceRefs':['MS1-R01']},'teacherReview':{'status':'pending'}};self.targethash=digest(canonical(self.payload))
        self.conn.execute('CREATE TABLE authored_imports(import_id TEXT PRIMARY KEY,content_id TEXT,version INTEGER,kind TEXT,author_agent TEXT,content_hash TEXT,payload_json TEXT,source_index_hash TEXT,source_index_json TEXT)')
        self.conn.execute('INSERT INTO authored_imports VALUES(?,?,?,?,?,?,?,?,?)',('import','fnd-reading-train',1,'unit','author_worker',self.targethash,canonical(self.payload),digest(canonical(self.index)),canonical({'MS1-R01':self.index['entries'][0]})))
        self.conn.commit();a.initialize(self.conn)
        self.review={'schemaVersion':1,'reviewerId':'/root/sqe_machinery','reviewerKind':'independent_engineering_agent','teacherApproval':'pending','runId':'run','assetSha256':self.asset,'revisionId':self.rev,'policySha256':runner.policy_hash,'integrityAuditReportSha256':'report','sourceIndexSha256':file_hash(self.indexpath),'purpose':a.PURPOSE,'withheld':sorted(a.WITHHELD),'anchors':{'MS1-R01':{'pages':[1],'evidenceSha256':digest(canonical(a.evidence(self.conn,self.rev,[1])))}}}
        authority=self.conn.execute('SELECT o.*,a.territory,a.processing_scope,a.distribution_scope,a.evidence FROM corpus_source_occurrences o JOIN corpus_authorities a USING(authority_id) WHERE occurrence_id=?',(self.occ,)).fetchone()
        self.review.update({'occurrenceId':self.occ,'occurrenceAuthoritySha256':digest(canonical(dict(authority))),'integrityStateSha256':a.integrity_state_sha256(self.conn,'run')})
        # A test-only trusted coordinator manifest replaces the fixed production digest.
        patched=patch.object(a,'TRUSTED_REVIEW_SHA256',digest(canonical(self.review)));patched.start();self.addCleanup(patched.stop)
        self.scope={'import_id':'import','anchor_id':'MS1-R01','occurrence_id':self.occ,'target_pointer':'/provenance/sourceRefs/0','target_content_sha256':self.targethash,'source_root':self.root,'source_index_path':self.indexpath,'dependency_declarations':{x:'not_claimed' for x in a.WITHHELD}}
        self.target={k:self.scope[k] for k in ['import_id','target_pointer','target_content_sha256']}

    def test_opt_in_exact_scope_works_default_stays_held_and_immutable(self):
        self.assertEqual(read_chunks(self.conn),[])
        aid=a.create_admission(self.conn,self.review,**self.scope);self.conn.commit()
        proof=a.validate_admission(self.conn,aid,**self.target);self.assertFalse(proof['semantic_completion']);self.assertEqual(proof['teacher_approval'],'pending');self.assertTrue(proof['image_entity_ids'])
        chunk=a.resolve_admitted_chunk(self.conn,aid,proof['chunk_ids'][0],**self.target);self.assertEqual(chunk['page_start'],1)
        self.assertEqual(a.create_admission(self.conn,self.review,**self.scope),aid)
        self.assertEqual(read_chunks(self.conn),[]);self.assertEqual(self.conn.execute('SELECT status FROM corpus_extractions').fetchone()[0],'partial')
        with self.assertRaises(sqlite3.IntegrityError):self.conn.execute('DELETE FROM corpus_selected_admissions')

    def test_unreviewed_claim_target_pointer_and_dependencies_refused(self):
        for key,value in [('target_pointer','/teacherReview/status'),('target_content_sha256','0'*64),('anchor_id','MS1-W01')]:
            args={**self.scope,key:value}
            with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,self.review,**args)
        deps={**self.scope['dependency_declarations'],'source_keys':'required'}
        with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,self.review,**{**self.scope,'dependency_declarations':deps})
        review={**self.review,'teacherApproval':'approved'}
        with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,review,**self.scope)

    def test_held_selected_or_global_scope_refused(self):
        page=a.evidence(self.conn,self.rev,[1])[0]['page']['page_id']
        for pid in (page,None):
            hold='hold'+str(pid)
            self.conn.execute('INSERT INTO corpus_integrity_holds VALUES(?,?,?,?,?,?,?,?,?)',(hold,'audit',self.asset,self.rev,pid,'synthetic-held',1,'unresolved','{}'));self.conn.commit()
            with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,self.review,**self.scope)

    def test_stale_source_target_evidence_and_new_audit_refused(self):
        aid=a.create_admission(self.conn,self.review,**self.scope);self.conn.commit()
        self.conn.execute('INSERT INTO corpus_integrity_audits VALUES(?,?,?,?,?,?,?,?)',('new-audit','run',self.review['policySha256'],'manifest','newreport','fixture','later','{}'));self.conn.commit()
        with self.assertRaises(a.AdmissionError):a.validate_admission(self.conn,aid,**self.target)
        page=a.evidence(self.conn,self.rev,[1])[0]['page'];self.conn.execute("UPDATE corpus_pages SET page_sha256=? WHERE page_id=?",('0'*64,page['page_id']));self.conn.commit()
        with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,self.review,**self.scope)

    def test_authored_reviewer_and_changed_original_refused(self):
        self.conn.execute("UPDATE authored_imports SET author_agent='/ROOT/SQE_MACHINERY'");self.conn.commit()
        with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,self.review,**self.scope)
        self.conn.execute("UPDATE authored_imports SET author_agent='author_worker'");self.conn.commit()
        path=self.root/'Mindset for IELTs Books'/'synthetic.pdf';path.write_bytes(path.read_bytes()+b'drift')
        with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,self.review,**self.scope)

    def test_global_hold_without_selected_page_hold_refused(self):
        self.conn.execute('INSERT INTO corpus_integrity_holds VALUES(?,?,?,?,?,?,?,?,?)',('global','audit',self.asset,self.rev,None,'global-held',1,'unresolved','{}'));self.conn.commit()
        with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,self.review,**self.scope)

    def test_image_tampering_out_of_scope_chunk_and_index_drift_refused(self):
        aid=a.create_admission(self.conn,self.review,**self.scope);self.conn.commit()
        with self.assertRaises(a.AdmissionError):a.resolve_admitted_chunk(self.conn,aid,'not-in-selected-scope',**self.target)
        self.indexpath.write_text(self.indexpath.read_text()+' ')
        with self.assertRaises(a.AdmissionError):a.validate_admission(self.conn,aid,**self.target)
        self.indexpath.write_text(json.dumps(self.index))
        entity=self.conn.execute("SELECT entity_id FROM corpus_entities WHERE kind='page-image' LIMIT 1").fetchone()[0]
        self.conn.execute('UPDATE corpus_entities SET raw_image_sha256=? WHERE entity_id=?',('0'*64,entity));self.conn.commit()
        with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,self.review,**self.scope)

    def test_actual_cached_image_tamper_and_missing_image_entity_refused(self):
        item=a.evidence(self.conn,self.rev,[1])[0];image=next(x for x in item['regions'] if x['kind']=='page-image');metadata=json.loads(image['metadata_json']);cache=Path(self.conn.execute('PRAGMA database_list').fetchone()[2]).parent;path=cache/metadata['image_path'];original=path.read_bytes();path.write_bytes(b'corrupt cached source image')
        with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,self.review,**self.scope)
        path.write_bytes(original);path.unlink() # pruned valid cache is reconstructible without writing a substitute
        self.assertTrue(a.create_admission(self.conn,self.review,**self.scope));self.conn.rollback()
        self.conn.execute("UPDATE corpus_entities SET kind='missing-image' WHERE kind='page-image'");self.conn.commit()
        with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,self.review,**self.scope)

    def test_forged_nonempty_authority_and_fresh_create_after_audit_refused(self):
        original=self.conn.execute('SELECT * FROM corpus_source_occurrences WHERE occurrence_id=?',(self.occ,)).fetchone();authority='forged-authority';self.conn.execute('INSERT INTO corpus_authorities VALUES(?,?,?,?,?,?)',(authority,'Elsewhere','NOT PERMITTED','none','later','arbitrary'))
        vals=list(original);vals[0]='forged-occurrence';vals[5]=authority
        self.conn.execute('INSERT INTO corpus_source_occurrences VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',vals);self.conn.execute('UPDATE corpus_run_files SET occurrence_id=?',('forged-occurrence',));self.conn.commit()
        with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,self.review,**{**self.scope,'occurrence_id':'forged-occurrence'})
        self.conn.execute('UPDATE corpus_run_files SET occurrence_id=?',(self.occ,));self.conn.execute('INSERT INTO corpus_integrity_audits VALUES(?,?,?,?,?,?,?,?)',('changed-audit','run',self.review['policySha256'],'manifest','later-report','fixture','later','{}'));self.conn.commit()
        with self.assertRaises(a.AdmissionError):a.create_admission(self.conn,self.review,**self.scope)

if __name__=='__main__':unittest.main()
