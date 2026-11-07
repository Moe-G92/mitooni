#!/usr/bin/env python3
"""Private manual source-based activity admission; no provider generation implied."""
import argparse
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from app.corpus import store,synthesis,bank

def main():
    p=argparse.ArgumentParser(description=__doc__); p.add_argument('--db',required=True)
    sub=p.add_subparsers(dest='command',required=True)
    a=sub.add_parser('admit'); a.add_argument('--run-id',required=True); a.add_argument('--candidate',required=True); a.add_argument('--author-session',required=True); a.add_argument('--author-model',default='manual'); a.add_argument('--source-mode',choices=['manual','fixture'],required=True)
    a=sub.add_parser('plan'); a.add_argument('--run-id',required=True); a.add_argument('--blueprint',required=True); a.add_argument('--model',required=True)
    a=sub.add_parser('seed-curriculum'); a.add_argument('--input',required=True)
    a=sub.add_parser('admit-pack'); a.add_argument('--run-id',required=True); a.add_argument('--input',required=True); a.add_argument('--source-mode',choices=['manual','fixture'],required=True)
    a=sub.add_parser('lint'); a.add_argument('--candidate-id',required=True); a.add_argument('--version',type=int,required=True)
    a=sub.add_parser('review'); a.add_argument('--input',required=True)
    a=sub.add_parser('export-teacher'); a.add_argument('--run-id',required=True); a.add_argument('--output',required=True)
    a=sub.add_parser('import-authored'); a.add_argument('--package-root',required=True); a.add_argument('--records-root',required=True); a.add_argument('--import-session',required=True)
    a=sub.add_parser('backfill-authored'); a.add_argument('--corpus-run-id'); a.add_argument('--import-ids'); a.add_argument('--selected-admissions')
    a=sub.add_parser('project-authored'); a.add_argument('--import-ids')
    a=sub.add_parser('import-visuals'); a.add_argument('--manifest',required=True); a.add_argument('--graph',required=True); a.add_argument('--import-ids')
    a=sub.add_parser('import-exposure'); a.add_argument('--syllabus',required=True); a.add_argument('--import-ids')
    args=p.parse_args()
    if not Path(args.db).is_file() or Path(args.db).is_symlink(): p.error('existing private corpus database required')
    conn=store.connect(args.db); synthesis.initialize(conn); bank.initialize(conn)
    if args.command=='admit': result=bank.admit_candidate(conn,args.run_id,synthesis.read_json(Path(args.candidate).read_text()),source_mode=args.source_mode,author_session=args.author_session,author_model=args.author_model)
    elif args.command=='plan': result=bank.plan_candidates(conn,args.run_id,synthesis.read_json(Path(args.blueprint).read_text()),model=args.model)
    elif args.command=='seed-curriculum':
        data=synthesis.read_json(Path(args.input).read_text()); result=synthesis.seed_curriculum(conn,data['nodes'],data.get('edges',[]))
    elif args.command=='admit-pack': result=synthesis.admit_pack(conn,args.run_id,synthesis.read_json(Path(args.input).read_text()),source_mode=args.source_mode)
    elif args.command=='lint': result=bank.lint_candidate(conn,args.candidate_id,args.version)
    elif args.command=='review': result=bank.record_review(conn,synthesis.read_json(Path(args.input).read_text()))
    elif args.command=='import-authored': result=bank.import_authored(conn,args.package_root,records_root=args.records_root,import_session=args.import_session)
    elif args.command=='import-visuals': result=bank.import_visual_registry(conn,args.manifest,args.graph,import_ids=synthesis.read_json(Path(args.import_ids).read_text()) if args.import_ids else None)
    elif args.command=='import-exposure': result=bank.import_exposure_registry(conn,args.syllabus,import_ids=synthesis.read_json(Path(args.import_ids).read_text()) if args.import_ids else None)
    elif args.command=='project-authored': result=bank.project_imported_activities(conn,import_ids=synthesis.read_json(Path(args.import_ids).read_text()) if args.import_ids else None)
    elif args.command=='backfill-authored': result=bank.backfill_authored_sources(conn,corpus_run_id=args.corpus_run_id,import_ids=synthesis.read_json(Path(args.import_ids).read_text()) if args.import_ids else None,selected_admissions=synthesis.read_json(Path(args.selected_admissions).read_text()) if args.selected_admissions else None)
    else: result=bank.export_teacher_candidates(conn,args.run_id,args.output)
    print(json.dumps(result,ensure_ascii=False,sort_keys=True))
if __name__=='__main__':
    try:
        main()
    except synthesis.CorpusError as exc:
        raise SystemExit(str(exc)) from None
    except (ValueError,TypeError,KeyError):
        raise SystemExit('invalid_private_artifact') from None
