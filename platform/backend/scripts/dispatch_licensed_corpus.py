#!/usr/bin/env python3
"""Private Batch dispatcher; local prepare/status by default. Never reads .env files."""
import argparse
from dataclasses import fields
import json
import logging
import os
from pathlib import Path
import sys

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from app.corpus import dispatch as d,store,synthesis as s


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--db',required=True)
    p.add_argument('--approval',required=True,help='Owner-only JSON containing an actually approved single-batch scope')
    sub=p.add_subparsers(dest='command',required=True)
    a=sub.add_parser('prepare');a.add_argument('--batch-key',required=True);a.add_argument('--requests',required=True)
    for command in ('status','upload','submit','retrieve','reconcile-upload','reconcile-submit','recover-unknown'):
        a=sub.add_parser(command);a.add_argument('--dispatch-id',required=True)
        if command!='status':
            a.add_argument('--execute-approved',action='store_true',help='Execute only under the already approved scope/cap')
            a.add_argument('--credential-fd',type=int,required=True,help='Readable pipe FD; never command-line key or env file')
        if command=='recover-unknown':a.add_argument('--reason',required=True);a.add_argument('--extension-seconds',type=int,default=86400)
        if command=='retrieve':a.add_argument('--output',required=True);a.add_argument('--max-bytes',type=int,default=d.MAX_RESULT_BYTES)
        if command in {'reconcile-upload','reconcile-submit'}:a.add_argument('--remote-id',required=True)
    args=p.parse_args()
    values=s.read_json(d.read_private(args.approval,16384).decode())
    if set(values)!={f.name for f in fields(d.Approval)}:raise s.CorpusError('invalid_approval_artifact')
    approval=d.Approval(**values);approval.validate()
    import stat
    dbpath=d._private_path(args.db)
    fd=os.open(dbpath,os.O_RDONLY|os.O_NOFOLLOW)
    metadata=os.fstat(fd);os.close(fd)
    if not stat.S_ISREG(metadata.st_mode) or metadata.st_mode & 0o077 or metadata.st_uid!=os.getuid():raise s.CorpusError('private_database_required')
    conn=store.connect(args.db);d.initialize(conn)
    if args.command=='prepare':result={'dispatch_id':d.prepare(conn,args.batch_key,args.requests,approval),'network_executed':False}
    elif args.command=='status':
        row=conn.execute('SELECT state,file_id,batch_id,result_hash FROM corpus_dispatch WHERE dispatch_id=? AND approval_json=?',(args.dispatch_id,s.canonical(values))).fetchone()
        if not row:raise s.CorpusError('unknown_dispatch')
        result=dict(row)
    else:
        if not args.execute_approved:raise s.CorpusError('explicit_approved_execution_required')
        if args.credential_fd<3:raise s.CorpusError('dedicated_credential_pipe_required')
        import stat
        if not stat.S_ISFIFO(os.fstat(args.credential_fd).st_mode):raise s.CorpusError('credential_pipe_required')
        credential=os.read(args.credential_fd,4097)
        if not 1<=len(credential)<=4096:raise s.CorpusError('invalid_credential_pipe')
        d.silence_provider_logs()
        from openai import OpenAI
        import httpx
        with OpenAI(api_key=credential.decode().strip(),base_url=d.BASE_URL,project=approval.project,organization=approval.organization,max_retries=0,timeout=60,http_client=d.bounded_http_client(timeout=60)) as client:
            transport=d.Dispatcher(conn,client,approval)
            if args.command=='recover-unknown':result=transport.recover_unknown(args.dispatch_id,reason=args.reason,extension_seconds=args.extension_seconds)
            elif args.command=='upload':result={'file_id':transport.upload(args.dispatch_id)}
            elif args.command=='submit':result={'batch_id':transport.submit(args.dispatch_id)}
            elif args.command=='retrieve':result=transport.retrieve(args.dispatch_id,args.output,max_bytes=args.max_bytes)
            elif args.command=='reconcile-upload':transport.reconcile_upload(args.dispatch_id,args.remote_id);result={'reconciled':True}
            else:transport.reconcile_submit(args.dispatch_id,args.remote_id);result={'reconciled':True}
    print(json.dumps(result,sort_keys=True))

if __name__=='__main__':
    try:main()
    except s.CorpusError as exc:raise SystemExit(str(exc)) from None
    except Exception:raise SystemExit('private_dispatch_failed_no_details_logged') from None
