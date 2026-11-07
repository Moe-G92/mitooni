#!/usr/bin/env python3
"""Private offline workload evidence. No model submission."""
import argparse
import json
import os
from pathlib import Path
import sqlite3
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from app.corpus.multimodal import canonical,plan_multimodal,read_segmentation_manifest,segment_source_audio

def main():
    p=argparse.ArgumentParser();p.add_argument('--database',type=Path,required=True);p.add_argument('--source-run-id',required=True)
    p.add_argument('--vision-model',default='gpt-6-astra');p.add_argument('--asr-model',choices=['whisper-1','gpt-transcribe'],default='whisper-1')
    p.add_argument('--segmentation-manifest',type=Path,action='append',default=[]);p.add_argument('--segment-oversized',action='store_true');p.add_argument('--source-root',type=Path);p.add_argument('--segment-root',type=Path);p.add_argument('--max-output-tokens',type=int,default=12000);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    output=a.output.absolute()
    if output.exists() or output.is_symlink() or not output.parent.is_dir() or output.parent.resolve()!=output.parent:raise ValueError('existing_or_unsafe_output')
    c=sqlite3.connect(a.database.resolve(strict=True).as_uri()+'?mode=ro',uri=True);c.row_factory=sqlite3.Row
    try:
        c.execute('BEGIN');plan=plan_multimodal(c,a.source_run_id,vision_model=a.vision_model,asr_model=a.asr_model,max_output_tokens=a.max_output_tokens)
        manifests=[read_segmentation_manifest(path) for path in a.segmentation_manifest]
        if a.segment_oversized:
            if not a.source_root or not a.segment_root:p.error('segmentation requires --source-root and --segment-root')
            for task in plan['tasks']:
                if task['kind']=='source_asr' and 'audio_segmentation_required' in task['blocked_reasons'] and task['inputs']['payload']['asset']['asset_id'] not in {m['source_asset_id'] for m in manifests}:
                    path=segment_source_audio(task,source_root=a.source_root,output_root=a.segment_root)
                    manifests.append(read_segmentation_manifest(path))
        if manifests:
            plan=plan_multimodal(c,a.source_run_id,vision_model=a.vision_model,asr_model=a.asr_model,max_output_tokens=a.max_output_tokens,segmentations=manifests)
        output=a.output.absolute()
        if output.is_symlink() or output.parent.resolve()!=output.parent:raise ValueError('unsafe_output_parent')
        fd=os.open(output,os.O_WRONLY|os.O_CREAT|os.O_EXCL|getattr(os,'O_NOFOLLOW',0),0o600)
        with os.fdopen(fd,'w') as f:f.write(canonical(plan)+'\n')
        print(json.dumps(dict(plan_id=plan['plan_id'],plan_hash=plan['plan_hash'],summary=plan['summary'],coverage_holds=len(plan['coverage_holds']),blocked_tasks=sum(t['state']=='blocked' for t in plan['tasks']),output=str(output)),sort_keys=True))
    finally:c.close()
if __name__=='__main__':main()
