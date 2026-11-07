"""Immutable artifact integrity and source/content binding validation."""
from hashlib import sha256
import json
from pathlib import Path
from app.media.contracts import VisualSpec
from app.media.charts import raw_alt, render_svg

def canonical(value):
    return json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode()

def digest(value):
    return sha256(value).hexdigest()

def safe_path(root: Path, relative: str) -> Path:
    if not relative or '\\' in relative:
        raise ValueError('Invalid relative asset path')
    p=Path(relative)
    if p.is_absolute() or '..' in p.parts:
        raise ValueError('Asset path escapes root')
    resolved=(root/p).resolve()
    if not resolved.is_relative_to(root.resolve()):
        raise ValueError('Asset symlink escapes root')
    return resolved

def pointer(value, path):
    if path=='':return value
    if not path.startswith('/'):raise ValueError('Invalid JSON pointer')
    for token in path[1:].split('/'):
        token=token.replace('~1','/').replace('~0','~')
        value=value[int(token)] if isinstance(value,list) else value[token]
    return value

def validate_bindings(spec: VisualSpec, content_root: Path, source_root: Path, source_index: dict):
    sources={s['id']:s for s in source_index['entries']}
    for b in spec.sourceBindings:
        entry=sources.get(b.sourceRefId)
        if not entry or b.fileSha256!=entry['fileSha256'] or b.excerptSha256!=entry['excerptSha256'] or not set(b.pdfPages)<=set(entry['pdfPages']):
            raise ValueError('Source index hash/page drift or unknown source')
        if digest(safe_path(source_root,entry['relativePath']).read_bytes())!=b.fileSha256:
            raise ValueError('Actual source file hash drift')
    for b in spec.contentBindings:
        data=json.loads(safe_path(content_root,b.relativePath).read_bytes())
        if digest(canonical(pointer(data,b.jsonPointer)))!=b.canonicalValueSha256:
            raise ValueError('Content binding hash drift')
        if data.get('id')!=b.contentId:
            raise ValueError('Wrong bound content identity')
    return spec

def asset_metadata(spec: VisualSpec, record: dict) -> dict:
    """Only sanitized display metadata; callers provide an authorized bound URL."""
    if spec.verification!='source_verified' or not spec.contentBindings:
        raise ValueError('Provisional or unbound visual cannot be served')
    return dict(id=record['id'],kind=spec.kind,mediaType=record['mediaType'],sha256=record['sha256'],width=record['width'],height=record['height'],alt=raw_alt(spec))

def verified_asset(root: Path, record: dict) -> Path:
    mime=record['mediaType'];suffix={ 'image/png':'.png','image/svg+xml':'.svg' }.get(mime)
    p=safe_path(root,record['relativePath'])
    if suffix is None or p.suffix!=suffix or digest(p.read_bytes())!=record['sha256'] or p.stat().st_size!=record['byteLength']:
        raise ValueError('Invalid rendition type or hash')
    return p

def graph_primitives(spec: VisualSpec) -> dict:
    """Authored semantic nodes; ingestion owns all private source entity IDs."""
    base='visual:'+spec.id+':v'+str(spec.version)
    nodes=[dict(id=base,kind='authored_visual',specSha256=digest(canonical(spec.model_dump())))];edges=[]
    for entity in spec.corpusEntityIds:edges.append(dict(source=base,target=entity,relation='derived_from'))
    for b in spec.contentBindings:edges.append(dict(source=b.contentId,target=base,relation='uses_visual'))
    if spec.data:
        for s in spec.data.series:
            sid=base+':series:'+s.id;nodes.append(dict(id=sid,kind='series',label=s.label));edges.append(dict(source=base,target=sid,relation='has_series'))
            for i,(category,value) in enumerate(zip(spec.data.categories,s.values,strict=True)):
                cid=sid+':cell:'+str(i);nodes.append(dict(id=cid,kind='cell',category=category,value=value,unit=spec.data.unit));edges.append(dict(source=sid,target=cid,relation='has_cell'))
    else:
        for s in spec.process.stages:
            sid=base+':stage:'+s.id;nodes.append(dict(id=sid,kind='stage',**s.model_dump(exclude={'id'})));edges.append(dict(source=base,target=sid,relation='has_stage'))
        for e in spec.process.edges:edges.append(dict(source=base+':stage:'+e.source,target=base+':stage:'+e.target,relation=e.relation))
    return dict(nodes=nodes,edges=edges,lineageStatus='resolved' if spec.corpusEntityIds else 'pending_private_entity_resolution')

def load_manifest(root: Path, manifest_path: Path, content_root: Path, source_root: Path, source_index: dict) -> dict:
    """Verify all references before a caller makes any metadata available."""
    if not manifest_path.resolve().is_relative_to(root.resolve()):
        raise ValueError('Manifest escapes asset root')
    raw=manifest_path.read_bytes();manifest=json.loads(raw)
    if manifest_path.name!='manifest.'+digest(raw)+'.json':
        raise ValueError('Manifest must have immutable content hash name')
    if manifest.get('schemaVersion')!=1 or not isinstance(manifest.get('assets'),list):
        raise ValueError('Unsupported asset manifest')
    ids=set()
    for record in manifest['assets']:
        if record['id'] in ids:raise ValueError('Duplicate asset ID')
        ids.add(record['id'])
        specbytes=safe_path(root,record['specPath']).read_bytes()
        if digest(specbytes)!=record['specSha256']:raise ValueError('Spec hash drift')
        spec=VisualSpec.model_validate_json(specbytes)
        validate_bindings(spec,content_root,source_root,source_index)
        if record['visualId']!=spec.id or record['kind']!=spec.kind or record['contentBindings']!=[b.model_dump() for b in spec.contentBindings]:
            raise ValueError('Manifest/spec binding mismatch')
        asset_metadata(spec,record)
        path=verified_asset(root,record)
        rendered=render_svg(spec,record['width'])
        import re
        expected_height=int(re.search(rb'height="(\d+)"',rendered).group(1))
        if record['height']!=expected_height:
            raise ValueError('Rendition dimensions mismatch')
        if record['mediaType']=='image/svg+xml' and path.read_bytes()!=rendered:
            raise ValueError('SVG does not match trusted renderer')
        if record['mediaType']=='image/png':
            png=path.read_bytes()
            if png[:8]!=b'\x89PNG\r\n\x1a\n' or len(png)<24 or int.from_bytes(png[16:20],'big')!=record['width'] or int.from_bytes(png[20:24],'big')!=record['height']:
                raise ValueError('Invalid PNG header/dimensions')
    return manifest

class PackageAssets:
    """Read-only media view over a pipeline-validated self-contained edition."""
    def __init__(self, root: Path, package: dict, package_hash: str):
        if digest(canonical(package))!=package_hash:
            raise ValueError('Asset package hash mismatch')
        self.root=root.resolve()
        self.package=json.loads(canonical(package))
        self.targets=self.package['units'] | self.package['companions']
        self.records={}
        self.metadata_by_id={}
        for record in self.package.get('assets',[]):
            mime=record['mediaType']
            if not (mime=='image/png' and record['width']==1280 or mime in {'audio/mpeg','audio/wav'}):
                continue
            aid=record['id']
            if aid in self.records:raise ValueError('Duplicate package asset ID')
            bindings=record['contentBindings']
            if not bindings:raise ValueError('Unbound package asset')
            for binding in bindings:
                target=self.targets.get(binding['targetId'])
                if target is None or digest(canonical(pointer(target,binding['targetPointer'])))!=binding['targetValueSha256']:
                    raise ValueError('Package asset target value drift')
            kind='audio';alt=record.get('alt')
            if mime=='image/png':
                if not record['specPath'] or not record['specSha256']:
                    raise ValueError('Visual requires editable hashed spec')
                specbytes=safe_path(self.root,record['specPath']).read_bytes()
                if digest(specbytes)!=record['specSha256']:
                    raise ValueError('Package visual spec hash drift')
                spec=VisualSpec.model_validate_json(specbytes)
                if spec.verification!='source_verified':raise ValueError('Provisional visual cannot be served')
                authored={(b.contentId,b.jsonPointer,b.canonicalValueSha256) for b in spec.contentBindings}
                actual={(b['targetId'],b['targetPointer'],b['targetValueSha256']) for b in bindings}
                if authored!=actual:raise ValueError('Package/spec target binding mismatch')
                kind=spec.kind;alt=raw_alt(spec)
            metadata=dict(id=aid,kind=kind,mediaType=mime,sha256=record['sha256'],width=record.get('width'),height=record.get('height'),alt=alt)
            if mime in {'audio/mpeg','audio/wav'}:
                metadata.update(durationSeconds=record.get('durationSeconds'),sampleRateHz=record.get('sampleRateHz'),channels=record.get('channels'))
            self.records[aid]=record;self.metadata_by_id[aid]=metadata
            self._bytes(record)

    def _bytes(self, record):
        path=safe_path(self.root,record['path'])
        if record['sizeBytes']>32*1024*1024 or path.stat().st_size>32*1024*1024:
            raise ValueError('Review asset exceeds 32 MiB limit')
        payload=path.read_bytes()
        if len(payload)!=record['sizeBytes'] or digest(payload)!=record['sha256']:
            raise ValueError('Package asset bytes drift')
        return payload

    def assets_for(self,target_id: str) -> list[dict]:
        if target_id not in self.targets:raise KeyError('Unknown content target')
        return [dict(self.metadata_by_id[aid]) for aid,r in self.records.items() if any(b['targetId']==target_id for b in r['contentBindings'])]

    def read_asset(self,target_id: str,asset_id: str) -> tuple[bytes,dict]:
        if target_id not in self.targets:raise KeyError('Unknown content target')
        record=self.records.get(asset_id)
        if record is None or not any(b['targetId']==target_id for b in record['contentBindings']):
            raise KeyError('Asset is not bound to content target')
        return self._bytes(record),dict(self.metadata_by_id[asset_id])


def bind_package_assets(root: Path, package: dict, package_hash: str) -> PackageAssets:
    return PackageAssets(root,package,package_hash)
