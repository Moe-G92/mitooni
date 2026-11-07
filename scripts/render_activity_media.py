#!/usr/bin/env python3
"""Render only inspected authored data; never copy a licensed source figure."""
from pathlib import Path
import argparse
import json
import re
import subprocess
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'platform/backend'))
from app.media.contracts import VisualSpec
from app.media.charts import RENDERER_VERSION, render_svg
from app.media.registry import canonical,digest,validate_bindings,graph_primitives

CONTENT=ROOT/'content/ielts-academic/2026-11-06'

def build_specs():
    index=json.loads((CONTENT/'source-index.json').read_text());sources={s['id']:s for s in index['entries']}
    def base(uid,title,kind,ref,pages,pointer='/stimulus',relative=None):
        rel=relative or f'units/{uid}.json';data=json.loads((CONTENT/rel).read_text())
        from app.media.registry import pointer as resolve
        src=sources[ref]
        return dict(schemaVersion=1,id=uid+'-'+kind.replace('_','-'),version=1,kind=kind,title=title,verification='source_verified',sourceRefs=[ref],sourceBindings=[dict(sourceRefId=ref,fileSha256=src['fileSha256'],excerptSha256=src['excerptSha256'],pdfPages=pages,figure=title)],contentBindings=[dict(contentId=data['id'],relativePath=rel,jsonPointer=pointer,canonicalValueSha256=digest(canonical(resolve(data,pointer))))])
    series=[dict(id='cost',label='Rising cost of living',values=[65000,85000,80000]),dict(id='traffic',label='Traffic',values=[20000,35000,60000]),dict(id='lifestyle',label='Lifestyle',values=[20000,30000,40000])]
    d=dict(categories=['1990','2000','2010'],categoryLabel='Year',seriesLabel='Reason',unit='people',series=series,minimum=0,maximum=90000,tick=10000,timeStatus='recorded',footnotes=['The categories are not stated to be mutually exclusive.'])
    specs=[dict(**base('adv-writing-train','Reasons for moving to the countryside','line_chart','MS3-W01',[17]),data=d)]
    mock=json.loads((CONTENT/'mocks/academic-01-writing.json').read_text())
    task=mock['tasks'][0];stim=task['stimulus']
    actual=[[r[c['key']] for c in stim['columns'][1:]] for r in stim['rows']]
    if actual != [s['values'] for s in series]:raise ValueError('Mock cells differ from inspected source values')
    specs.append(dict(**base('academic-01-writing','Reasons for moving to the countryside','table','MS3-W01',[17],'/tasks/0/stimulus','mocks/academic-01-writing.json'),data=d))
    plans=[('fnd-writing-train','Making stringhoppers',[14,15],[
      ('Grind rice','Dry rice','Rice flour',[],[]),('Add water','Rice flour','Flour and water',['Water'],[]),('Mix','Flour and water','Dough',[],[]),('Press onto mats','Dough','Noodle nests',[],[]),('Steam','Noodle nests','Cooked stringhoppers',[],[]),('Serve with curries','Cooked stringhoppers','Served stringhoppers',['Curries'],[])]),
      ('fnd-writing-transfer','Making cherry jam',[16],[
      ('Spread a sheet and shake the tree','Cherries on tree','Cherries on sheet',[],[]),('Collect and transport','Collected cherries','Cherries at processing plant',[],[]),('Remove leaves and stems','Cherries with leaves and stems','Cherries without leaves and stems',[],['Leaves and stems']),('Wash','Unwashed cherries','Washed cherries',['Water'],[]),('Remove stones','Whole cherries','Stoned cherries',[],['Stones']),('Cook and add ingredients','Stoned cherries','Cooked jam',['Sugar','Pectin','Lemon juice'],[]),('Check quality','Cooked jam','Quality-checked jam',[],[]),('Fill jars','Quality-checked jam','Jam in jars',['Jars'],[]),('Label jars','Jam in jars','Labelled jars',['Labels'],[])])]
    for uid,title,pages,steps in plans:
        stages=[dict(id=f'stage-{i}',order=i,action=a,materialBefore=b,materialAfter=c,inputs=ins,removals=outs) for i,(a,b,c,ins,outs) in enumerate(steps,1)]
        specs.append(dict(**base(uid,title,'process','MS1-W01',pages),process=dict(stages=stages,edges=[dict(source=a['id'],target=b['id'],relation='next') for a,b in zip(stages,stages[1:])],footnotes=['No duration or temperature is supplied.'])))
    for uid,rows,title in [
        ('int-writing-train',[('Canada',181),('USA',201),('Australia',214),('Hong Kong',45),('Japan',95)],'Average house size in selected countries'),
        ('int-writing-transfer',[('United Kingdom',76),('France',112),('Denmark',137),('Germany',109),('Italy',61),('Spain',97),('Greece',126)],'Average house size in selected European countries')]:
        payload=dict(categories=['Size'],categoryLabel='Country',seriesLabel='Country',unit='square metres',series=[dict(id='country-'+str(i),label=country,values=[value]) for i,(country,value) in enumerate(rows)],minimum=0,maximum=250,tick=50,timeStatus='not_temporal',footnotes=['Country averages; not shares of a combined total.'])
        specs.append(dict(**base(uid,title,'table','MS2-W01',[16]),data=payload))
    return [VisualSpec.model_validate(s) for s in specs],index

def main(argv=None):
    ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,default=ROOT/'review/content-20261106/visuals');args=ap.parse_args(argv)
    out=args.output.resolve();allowed=(ROOT/'review/content-20261106/visuals').resolve()
    if out!=allowed:raise ValueError('Generated assets must remain in owned ignored visuals directory')
    out.mkdir(parents=True,exist_ok=True);specs,index=build_specs();records=[];graphs=[]
    for spec in specs:
        validate_bindings(spec,CONTENT,ROOT.parent,index)
        raw=canonical(spec.model_dump());sh=digest(raw);specfile=f'{spec.id}.v{spec.version}.{sh}.json';(out/specfile).write_bytes(raw)
        graphs.append(graph_primitives(spec))
        for width in [360,768,1280]:
            svg=render_svg(spec,width);svghash=digest(svg);stem=f'{spec.id}.{width}.{svghash}'
            svgpath=out/(stem+'.svg');svgpath.write_bytes(svg)
            pngpath=out/(stem+'.png')
            subprocess.run(['magick','-font','/System/Library/Fonts/Supplemental/Arial.ttf','-background','white',str(svgpath),'-strip',str(pngpath)],check=True,capture_output=True)
            height=int(re.search(rb'height="(\d+)"',svg).group(1))
            for path,mime in [(svgpath,'image/svg+xml'),(pngpath,'image/png')]:
                payload=path.read_bytes();h=digest(payload)
                if mime=='image/png':
                    final=out/f'{spec.id}.{width}.{h}.png';path.rename(final);path=final
                records.append(dict(id=f'{spec.id}-{width}-{path.suffix[1:]}',visualId=spec.id,kind=spec.kind,mediaType=mime,relativePath=path.name,sha256=h,byteLength=len(payload),width=width,height=height,specPath=specfile,specSha256=sh,sourceRefs=spec.sourceRefs,contentBindings=[b.model_dump() for b in spec.contentBindings],verification=spec.verification))
    manifest=dict(schemaVersion=1,rendererVersion=RENDERER_VERSION,assets=records)
    encoded=canonical(manifest);manifestname=f'manifest.{digest(encoded)}.json';(out/manifestname).write_bytes(encoded)
    graphbytes=canonical(dict(visuals=graphs));graphname='graph-primitives.'+digest(graphbytes)+'.json';(out/graphname).write_bytes(graphbytes)
    print(json.dumps(dict(manifestPath=str(out/manifestname),graphPath=str(out/graphname),visualCount=len(specs),renditionCount=len(records))))
    return 0
if __name__=='__main__':raise SystemExit(main())
