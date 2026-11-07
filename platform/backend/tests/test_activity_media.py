"""Integrity tests use small synthetic fixtures plus exact inspected author data."""
from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import pytest
from pydantic import ValidationError
from app.media.contracts import VisualSpec
from app.media.charts import render_svg,raw_alt
from app.media.registry import canonical,digest,safe_path,validate_bindings,asset_metadata,verified_asset,graph_primitives,load_manifest

ROOT=Path(__file__).resolve().parents[3]
module=importlib.util.spec_from_file_location('render_activity_media',ROOT/'scripts/render_activity_media.py')
renderer=importlib.util.module_from_spec(module);module.loader.exec_module(renderer)

def fixture(tmp_path):
    (tmp_path/'original.pdf').write_bytes(b'SYNTHETIC PRIVATE SOURCE')
    content={'id':'fixture','stimulus':{'cells':[4,8]}}
    (tmp_path/'unit.json').write_bytes(canonical(content))
    source=dict(id='TEST',relativePath='original.pdf',fileSha256=digest(b'SYNTHETIC PRIVATE SOURCE'),excerptSha256='a'*64,pdfPages=[1])
    spec=VisualSpec.model_validate(dict(id='fixture-table',version=1,kind='table',title='Synthetic table',verification='source_verified',sourceRefs=['TEST'],sourceBindings=[dict(sourceRefId='TEST',fileSha256=source['fileSha256'],excerptSha256='a'*64,pdfPages=[1],figure='Synthetic figure')],contentBindings=[dict(contentId='fixture',relativePath='unit.json',jsonPointer='/stimulus',canonicalValueSha256=digest(canonical(content['stimulus'])))],data=dict(categories=['2000','2010'],categoryLabel='Year',unit='people',series=[dict(id='count',label='Count',values=[4,8])],maximum=10,tick=2,timeStatus='recorded')))
    return spec,{'entries':[source]}

def test_actual_inspected_nine_cells_and_stage_order():
    specs,index=renderer.build_specs()
    assert [s.kind for s in specs]==['line_chart','table','process','process','table','table']
    assert specs[0].data.categories==['1990','2000','2010']
    assert [s.values for s in specs[0].data.series]==[[65000,85000,80000],[20000,35000,60000],[20000,30000,40000]]
    assert specs[0].data.timeStatus=='recorded'
    assert [len(s.process.stages) for s in specs[2:4]]==[6,9]
    assert specs[2].process.stages[3].materialAfter=='Noodle nests'
    assert specs[3].process.stages[5].inputs==['Sugar','Pectin','Lemon juice']
    assert specs[3].process.stages[6].action=='Check quality'
    assert specs[3].process.stages[6].id==specs[3].process.edges[6].source
    for spec in specs:
        validate_bindings(spec,renderer.CONTENT,ROOT.parent,index)
        assert 'provisional' not in raw_alt(spec)

@pytest.mark.parametrize('width',[360,768,1280])
def test_svg_is_deterministic_safe_and_has_exact_numeric_table_values(tmp_path,width):
    spec,_=fixture(tmp_path);spec.title='<script>alert("X")</script> & test'
    data=render_svg(spec,width)
    assert data==render_svg(spec,width)
    doc=ET.fromstring(data)
    assert doc.attrib['width']==str(width)
    assert b'<script>' not in data and b'&lt;script&gt;' in data
    assert b'href' not in data and b'<foreignObject' not in data
    assert len(doc.findall('.//{http://www.w3.org/2000/svg}text'))>=5
    assert '2000: 4; 2010: 8' in raw_alt(spec)
    assert b'>4</text>' in data and b'>8</text>' in data

@pytest.mark.parametrize('mutation', ['nan','outside','length','duplicate','axis','unknown'])
def test_reject_invalid_visual_data(tmp_path,mutation):
    spec,_=fixture(tmp_path);data=spec.model_dump()
    if mutation=='nan':data['data']['series'][0]['values'][0]=float('nan')
    if mutation=='outside':data['data']['series'][0]['values'][0]=20
    if mutation=='length':data['data']['series'][0]['values'].pop()
    if mutation=='duplicate':data['data']['categories']=['2000','2000']
    if mutation=='axis':data['data']['tick']=.000001
    if mutation=='unknown':data['data']['teacherOverview']='PRIVATE ANSWER'
    with pytest.raises(ValidationError):VisualSpec.model_validate(data)

@pytest.mark.parametrize('mutation',['dangling','branch','cycle','order'])
def test_reject_invented_or_dangling_process_edges(mutation):
    spec=renderer.build_specs()[0][2].model_dump()
    if mutation=='dangling':spec['process']['edges'][0]['target']='missing'
    if mutation=='branch':spec['process']['edges'].append(dict(source='stage-1',target='stage-3',relation='next'))
    if mutation=='cycle':spec['process']['edges'][-1]['target']='stage-1'
    if mutation=='order':spec['process']['stages'][0]['order']=9
    with pytest.raises(ValidationError):VisualSpec.model_validate(spec)

@pytest.mark.parametrize('mutation',['source_bytes','source_index','source_ref','content','identity'])
def test_hash_boundaries_fail_closed(tmp_path,mutation):
    spec,index=fixture(tmp_path)
    validate_bindings(spec,tmp_path,tmp_path,index)
    if mutation=='source_bytes':(tmp_path/'original.pdf').write_bytes(b'changed')
    if mutation=='source_index':index['entries'][0]['excerptSha256']='b'*64
    if mutation=='source_ref':index['entries']=[]
    if mutation=='content':(tmp_path/'unit.json').write_bytes(canonical({'id':'fixture','stimulus':{'cells':[4,9]}}))
    if mutation=='identity':spec.contentBindings[0].contentId='wrong'
    with pytest.raises(ValueError):validate_bindings(spec,tmp_path,tmp_path,index)

def test_paths_and_serving_gate(tmp_path):
    spec,_=fixture(tmp_path)
    for path in ['../file','/etc/passwd','sub\\file']:
        with pytest.raises(ValueError):safe_path(tmp_path,path)
    (tmp_path/'escape').symlink_to(tmp_path.parent)
    with pytest.raises(ValueError):safe_path(tmp_path,'escape/other')
    spec.verification='provisional'
    with pytest.raises(ValueError):asset_metadata(spec,{})
    spec.verification='source_verified';spec.contentBindings=[]
    with pytest.raises(ValueError):asset_metadata(spec,{})

def test_semantic_graph_cells_stages_and_no_fabricated_source_ids():
    specs,_=renderer.build_specs()
    graph=graph_primitives(specs[0])
    assert len([n for n in graph['nodes'] if n['kind']=='cell'])==9
    assert not any(e['relation']=='derived_from' for e in graph['edges'])
    assert graph['lineageStatus']=='pending_private_entity_resolution'
    graph=graph_primitives(specs[2]);ids={n['id'] for n in graph['nodes']}
    assert len([e for e in graph['edges'] if e['relation']=='next'])==5
    assert all(e['target'] in ids for e in graph['edges'])

def test_rendition_drift(tmp_path):
    p=tmp_path/'test.png';p.write_bytes(b'PNG FIXTURE')
    record=dict(mediaType='image/png',relativePath='test.png',sha256=digest(p.read_bytes()),byteLength=p.stat().st_size)
    assert verified_asset(tmp_path,record)==p
    p.write_bytes(b'drift')
    with pytest.raises(ValueError):verified_asset(tmp_path,record)

def test_source_table_means_are_preserved_without_false_shares():
    specs,_=renderer.build_specs()
    assert [s.values[0] for s in specs[4].data.series]==[181,201,214,45,95]
    assert [s.values[0] for s in specs[5].data.series]==[76,112,137,109,61,97,126]
    assert specs[4].data.unit=='square metres'
    assert specs[4].data.timeStatus=='not_temporal'
    assert specs[4].kind==specs[5].kind=='table'

@pytest.mark.parametrize('width',[360,768,1280])
def test_line_plot_coordinates_and_labels_are_inside_canvas(width):
    spec=renderer.build_specs()[0][0];svg=ET.fromstring(render_svg(spec,width))
    namespace={'s':'http://www.w3.org/2000/svg'}
    circles=svg.findall('.//s:circle',namespace)
    assert len(circles)==9
    coords=[(float(c.attrib['cx']),float(c.attrib['cy'])) for c in circles]
    assert coords[0][1]>coords[1][1] and coords[1][1]<coords[2][1] #65k→85k→80k
    assert coords[3][1]>coords[4][1]>coords[5][1] #20k→35k→60k
    h=int(svg.attrib['height'])
    assert all(0<=x<=width and 0<=y<=h for x,y in coords)
    assert len(svg.findall('.//s:polygon',namespace))==6
    for text in svg.findall('.//s:text',namespace):
        assert 0<=float(text.attrib['x'])<=width
        assert 0<=float(text.attrib['y'])<=h


def test_immutable_manifest_and_spec_tampering(tmp_path):
    spec,index=fixture(tmp_path);specraw=canonical(spec.model_dump());svg=render_svg(spec,360)
    (tmp_path/'spec.json').write_bytes(specraw);(tmp_path/'visual.svg').write_bytes(svg)
    record=dict(id='fixture-table-svg',visualId=spec.id,kind=spec.kind,mediaType='image/svg+xml',relativePath='visual.svg',sha256=digest(svg),byteLength=len(svg),width=360,height=int(ET.fromstring(svg).attrib['height']),specPath='spec.json',specSha256=digest(specraw),sourceRefs=spec.sourceRefs,contentBindings=[b.model_dump() for b in spec.contentBindings],verification='source_verified')
    data=canonical(dict(schemaVersion=1,rendererVersion='test',assets=[record]));path=tmp_path/('manifest.'+digest(data)+'.json');path.write_bytes(data)
    assert len(load_manifest(tmp_path,path,tmp_path,tmp_path,index)['assets'])==1
    (tmp_path/'spec.json').write_bytes(specraw+b' ')
    with pytest.raises(ValueError,match='Spec hash drift'):load_manifest(tmp_path,path,tmp_path,tmp_path,index)
    (tmp_path/'spec.json').write_bytes(specraw);path.write_bytes(data+b' ')
    with pytest.raises(ValueError,match='immutable'):load_manifest(tmp_path,path,tmp_path,tmp_path,index)

def test_curated_runtime_needs_no_source_files_and_rejects_cross_target(tmp_path):
    from app.media.registry import bind_package_assets
    spec,index=fixture(tmp_path);specraw=canonical(spec.model_dump())
    (tmp_path/'spec.json').write_bytes(specraw)
    # Synthetic binary fixture; this test exercises binding/hash authorization.
    png=b'PNG SYNTHETIC CURATED FIXTURE'
    (tmp_path/'visual.png').write_bytes(png)
    binding=spec.contentBindings[0]
    record=dict(id='fixture-png',path='visual.png',mediaType='image/png',sha256=digest(png),sizeBytes=len(png),width=1280,height=50,specPath='spec.json',specSha256=digest(specraw),alt=None,contentBindings=[dict(targetId=binding.contentId,targetPointer=binding.jsonPointer,targetValueSha256=binding.canonicalValueSha256)])
    target=json.loads((tmp_path/'unit.json').read_bytes());package=dict(units={'fixture':target,'other':{'id':'other'}},companions={},assets=[record])
    (tmp_path/'original.pdf').unlink()
    reg=bind_package_assets(tmp_path,package,digest(canonical(package)))
    assert reg.assets_for('fixture')[0]['alt'].startswith('Synthetic table.')
    assert reg.read_asset('fixture','fixture-png')[0]==png
    assert reg.assets_for('other')==[]
    with pytest.raises(KeyError):reg.read_asset('other','fixture-png')
    with pytest.raises(KeyError):reg.read_asset('different-target','fixture-png')
    with pytest.raises(KeyError):reg.read_asset('fixture','different-asset')
    (tmp_path/'visual.png').write_bytes(b'changed')
    with pytest.raises(ValueError):reg.read_asset('fixture','fixture-png')
    with pytest.raises(ValueError):bind_package_assets(tmp_path,package,'0'*64)
    package['units']['fixture']['stimulus']['cells'][0]=9
    with pytest.raises(ValueError,match='target value drift'):bind_package_assets(tmp_path,package,digest(canonical(package)))

@pytest.mark.parametrize('mime',['audio/mpeg','audio/wav'])
def test_package_audio_is_bound_and_size_limited(tmp_path,mime):
    from app.media.registry import bind_package_assets
    payload=b'SYNTHETIC AUDIO';(tmp_path/'audio.bin').write_bytes(payload)
    target={'id':'listening','stimulus':{'kind':'script','text':'PRIVATE_SCRIPT'}}
    asset=dict(id='audio',path='audio.bin',mediaType=mime,sha256=digest(payload),sizeBytes=len(payload),width=None,height=None,specPath=None,specSha256=None,alt=None,durationSeconds=1,sampleRateHz=24000,channels=1,contentBindings=[dict(targetId='listening',targetPointer='/stimulus',targetValueSha256=digest(canonical(target['stimulus'])))])
    package=dict(units={'listening':target},companions={},assets=[asset])
    registry=bind_package_assets(tmp_path,package,digest(canonical(package)))
    assert registry.read_asset('listening','audio')[0]==payload
    assert 'PRIVATE_SCRIPT' not in str(registry.assets_for('listening'))
    asset['sizeBytes']=32*1024*1024+1
    with pytest.raises(ValueError,match='32 MiB'):bind_package_assets(tmp_path,package,digest(canonical(package)))
