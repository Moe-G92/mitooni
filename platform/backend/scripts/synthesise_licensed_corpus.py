#!/usr/bin/env python3
"""Private corpus CLI; no network submission path."""
import argparse
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from app.corpus import store,synthesis

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--db',required=True)
    sub=p.add_subparsers(dest='command',required=True)
    a=sub.add_parser('seed-source-curriculum'); a.add_argument('--syllabus',required=True); a.add_argument('--source-index',required=True)
    a=sub.add_parser('plan'); a.add_argument('--model',required=True); a.add_argument('--window-chars',type=int,default=6000); a.add_argument('--context-chars',type=int,default=800); a.add_argument('--corpus-run-id')
    for name in ('coverage','estimate'):
        a=sub.add_parser(name); a.add_argument('--run-id',required=True)
    a=sub.add_parser('prepare-batch'); a.add_argument('--run-id',required=True); a.add_argument('--phase',default='classify'); a.add_argument('--output',required=True); a.add_argument('--limit',type=int,default=10000); a.add_argument('--model'); a.add_argument('--job-ids',help='Owner-only0600JSON array of exact planned job IDs for a bounded pilot')
    a=sub.add_parser('bind-batch'); a.add_argument('--batch-key',required=True); a.add_argument('--provider-id',required=True)
    a=sub.add_parser('collect-batch'); a.add_argument('--batch-key',required=True); a.add_argument('--provider-id',required=True); a.add_argument('--results',required=True); a.add_argument('--lease-manifest',required=True)
    a=sub.add_parser('recover-collection'); a.add_argument('--batch-key',required=True); a.add_argument('--provider-id',required=True); a.add_argument('--lease-manifest',required=True); a.add_argument('--reason',required=True)
    a=sub.add_parser('retry'); a.add_argument('--job-id',required=True); a.add_argument('--reason',required=True)
    args=p.parse_args()
    if not Path(args.db).is_file() or Path(args.db).is_symlink(): p.error('existing private corpus database required')
    conn=store.connect(args.db); synthesis.initialize(conn)
    if args.command=='seed-source-curriculum': result=synthesis.seed_source_curriculum(conn,synthesis.read_json(Path(args.syllabus).read_text()),synthesis.read_json(Path(args.source_index).read_text()))
    elif args.command=='plan': result=synthesis.plan_classification(conn,model=args.model,window_chars=args.window_chars,context_chars=args.context_chars,corpus_run_id=args.corpus_run_id)
    elif args.command=='coverage': result=synthesis.coverage(conn,args.run_id)
    elif args.command=='estimate': result=synthesis.estimate(conn,args.run_id)
    elif args.command=='prepare-batch':
        result=synthesis.prepare_batch(conn,args.run_id,args.phase,args.output,limit=args.limit,model=args.model,job_ids=synthesis.read_job_selector(args.job_ids) if args.job_ids else None)
        lease_path=Path(str(args.output)+'.leases.json')
        synthesis.private_write(lease_path,synthesis.canonical(result.pop('lease_tokens'))+'\n')
        result['lease_manifest']=str(lease_path.absolute())
    elif args.command=='bind-batch': result=synthesis.bind_provider_batch(conn,args.batch_key,args.provider_id)
    elif args.command=='recover-collection': result=synthesis.recover_collection(conn,args.batch_key,batch_id=args.provider_id,lease_tokens=synthesis.read_json(Path(args.lease_manifest).read_text()),reason=args.reason)
    elif args.command=='collect-batch': result=synthesis.collect_batch(conn,args.batch_key,args.results,batch_id=args.provider_id,lease_tokens=synthesis.read_json(Path(args.lease_manifest).read_text()))
    else: result=synthesis.retry(conn,args.job_id,reason=args.reason)
    print(json.dumps(result,ensure_ascii=False,sort_keys=True))
if __name__=='__main__':
    try:
        main()
    except synthesis.CorpusError as exc:
        raise SystemExit(str(exc)) from None
    except (ValueError,TypeError,KeyError):
        raise SystemExit('invalid_private_artifact') from None
