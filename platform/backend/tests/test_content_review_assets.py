"""Actual HTTP binary responses with synthetic files and assignment adapter.

The file registry and repository asset method are real. This suite's authority
adapter is synthetic; PostgreSQL revocation/RLS evidence is separately opt-in.
"""
import base64
from contextlib import contextmanager
from hashlib import sha256
import json
from pathlib import Path
import struct
import zlib
import pytest
from fastapi.testclient import TestClient
from app.config import BackendConfig
from app.dependencies import CurrentUser
from app.main import create_app
from app.media.registry import bind_package_assets
from app.repositories.account import AccountError, LocalPostgresConfig
from app.repositories.postgres_content_review import PostgresContentReviewRepository
from app.services.content_pipeline import canonical, digest
from app.services.content_review import ReviewPackage, ReviewPackageConfiguration, empty_state

UID='00000006-0000-4000-8000-000000000000'
OTHER='00000007-0000-4000-8000-000000000000'
# 100ms synthetic silence generated offline by ffmpeg 8kHz/mono MP3, no voice/data.
MP3=base64.b64decode('SUQzBAAAAAAAIlRTU0UAAAAOAAADTGF2ZjYyLjMuMTAwAAAAAAAAAAAAAAD/4xjEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/4xjEOwAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/4xjEdgAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/4xjEsQAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=')


def png():
    def chunk(kind,payload):return struct.pack('>I',len(payload))+kind+payload+struct.pack('>I',zlib.crc32(kind+payload)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',1280,1,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b'\0'+b'\xff\xff\xff'*1280))+chunk(b'IEND',b'')


def media_package(root):
    (root/'media').mkdir();(root/'visual-specs').mkdir()
    target=dict(id='synthetic-review',version=1,skill='listening',examTrack='shared',stage='train',pathwayIds=['fnd'],title='Synthetic',instructions='Listen',stimulus={'kind':'script','text':'PRIVATE_SCRIPT'},questions=[dict(id='synthetic-q',prompt='Answer',responseType='short_text',options=[],wordLimit=2)],assessment={'answerKey':'PRIVATE_KEY'})
    other=dict(target,id='other-target')
    valuehash=digest(target['stimulus'])
    binding=dict(targetId=target['id'],targetPointer='/stimulus',targetValueSha256=valuehash)
    spec=dict(schemaVersion=1,id='synthetic-visual',version=1,kind='table',title='Candidate table',verification='source_verified',sourceRefs=['SYNTHETIC'],sourceBindings=[dict(sourceRefId='SYNTHETIC',fileSha256='a'*64,excerptSha256='b'*64,pdfPages=[1],figure='Synthetic')],contentBindings=[dict(contentId=target['id'],relativePath='units/synthetic-review.json',jsonPointer='/stimulus',canonicalValueSha256=valuehash)],data=dict(categories=['A'],categoryLabel='Category',unit='count',series=[dict(id='x',label='Count',values=[1])],maximum=2,tick=1,timeStatus='not_temporal'))
    specpath=root/'visual-specs/synthetic.json';specpath.write_bytes(canonical(spec))
    (root/'media/synthetic-image.png').write_bytes(png());(root/'media/synthetic-sound.mp3').write_bytes(MP3)
    common=dict(sourceRefs=['SYNTHETIC'],contentBindings=[binding],durationSeconds=None,sampleRateHz=None,channels=None)
    visual=dict(common,id='synthetic-image',path='media/synthetic-image.png',sha256=sha256(png()).hexdigest(),sizeBytes=len(png()),mediaType='image/png',width=1280,height=1,sourceAssetId='synthetic-image',specPath='visual-specs/synthetic.json',specSha256=sha256(specpath.read_bytes()).hexdigest(),alt='Candidate table')
    audio=dict(common,id='synthetic-sound',path='media/synthetic-sound.mp3',sha256=sha256(MP3).hexdigest(),sizeBytes=len(MP3),mediaType='audio/mpeg',width=None,height=None,sourceAssetId='synthetic-sound',specPath=None,specSha256=None,alt=None,durationSeconds=.1,sampleRateHz=8000,channels=1)
    package=dict(manifest={'title':'Synthetic'},units={target['id']:target,other['id']:other},companions={},assets=[visual,audio])
    ph=digest(package)
    def load():return ReviewPackage(package,ph,bind_package_assets(root,package,ph))
    return package,ph,load

class Verifier:
    def verify(self,token):
        if token=='reviewer':return CurrentUser(UID)
        if token=='other':return CurrentUser(OTHER)
        raise ValueError()
class Account:config=LocalPostgresConfig()
class Config:
    def __init__(self,load):self.load=load
class AssetRepo(PostgresContentReviewRepository):
    revoked=False
    @contextmanager
    def _connect(self):yield object()
    def _scope(self,c,user):return self.config.issuer,user.id
    def _assignment(self,c,owner,package_hash):
        if owner[1]!=UID or self.revoked:raise AccountError('review_denied',403,'Reviewer access is unavailable')

@pytest.fixture
def assets(tmp_path,monkeypatch):
    package,ph,_=media_package(tmp_path)
    monkeypatch.setattr('app.services.content_review.load_package',lambda root:(package,ph))
    config=ReviewPackageConfiguration(tmp_path,ph)
    load=config.load
    repo=AssetRepo(LocalPostgresConfig(),config)
    app=create_app(BackendConfig('http://127.0.0.1:54321','local','synthetic',environment='test'),verifier=Verifier(),account_repository=Account(),content_review_repository=repo)
    with TestClient(app) as c:yield c,repo,package,ph,tmp_path,load


def url(ph,package,target='synthetic-review',asset='synthetic-image'):
    return f'/api/content-review/targets/{target}/assets/{asset}?packageHash={ph}&targetHash={digest(package["units"][target])}'


def test_actual_http_png_and_mp3_private_headers_and_transcript_hidden(assets):
    c,r,p,ph,root,load=assets
    for aid,mime,data in [('synthetic-image','image/png',png()),('synthetic-sound','audio/mpeg',MP3)]:
        response=c.get(url(ph,p,asset=aid),headers={'Authorization':'Bearer reviewer'})
        assert response.status_code==200 and response.content==data
        assert response.headers['content-type']==mime
        assert response.headers['cache-control']=='private, no-store' and response.headers['vary']=='Authorization'
        assert response.headers['x-content-type-options']=='nosniff' and response.headers['accept-ranges']=='none'
    snapshot=load().snapshot('synthetic-review',empty_state())
    assert snapshot['target']['deliveryStatus']=='audio_ready'
    assert snapshot['task']['assets'] and all(a['url'].startswith('/api/content-review/targets/synthetic-review/assets/') for a in snapshot['task']['assets'])
    assert 'PRIVATE_SCRIPT' not in json.dumps(snapshot) and 'PRIVATE_KEY' not in json.dumps(snapshot)
    assert snapshot['task']['assets'][1]['alt']=='Listening audio'


def test_actual_http_wrong_owner_revoked_stale_target_and_package(assets):
    c,r,p,ph,*_=assets
    assert c.get(url(ph,p),headers={'Authorization':'Bearer other'}).status_code==403
    assert c.get(url('f'*64,p),headers={'Authorization':'Bearer reviewer'}).status_code==409
    assert c.get(url(ph,p).replace('targetHash='+digest(p['units']['synthetic-review']),'targetHash='+'f'*64),headers={'Authorization':'Bearer reviewer'}).status_code==409
    r.revoked=True
    response=c.get(url(ph,p),headers={'Authorization':'Bearer reviewer'})
    assert response.status_code==403 and response.headers['cache-control']=='private, no-store'
    assert response.headers['x-content-type-options']=='nosniff'


def test_actual_http_wrong_target_missing_asset_range_and_tamper(assets):
    c,r,p,ph,root,_=assets;headers={'Authorization':'Bearer reviewer'}
    assert c.get(url(ph,p,target='other-target'),headers=headers).status_code==404
    response=c.get(url(ph,p,asset='missing'),headers=headers)
    assert response.status_code==404 and response.headers['x-content-type-options']=='nosniff'
    assert c.get(url(ph,p),headers=headers|{'Range':'bytes=0-10'}).status_code==416
    (root/'media/synthetic-image.png').write_bytes(b'TAMPERED')
    response=c.get(url(ph,p),headers=headers)
    assert response.status_code==503 and 'TAMPERED' not in response.text
    assert response.headers['cache-control']=='private, no-store' and response.headers['x-content-type-options']=='nosniff'


def test_binding_drift_rejected_before_response(assets):
    c,r,p,ph,root,_=assets
    p['units']['synthetic-review']['stimulus']['text']='changed'
    # Even if malicious fixture repins outer hash, inner immutable binding fails.
    newhash=digest(p)
    r.package_configuration=Config(lambda:ReviewPackage(p,newhash,bind_package_assets(root,p,newhash)))
    with pytest.raises(ValueError):r.package_configuration.load()


def test_actual_http_invalid_hash_and_auth_errors_are_private(assets):
    c,r,p,ph,*_=assets
    for endpoint,headers,status in [(url(ph,p),{},401),(url(ph,p).replace(ph,'INVALID'),{'Authorization':'Bearer reviewer'},422)]:
        response=c.get(endpoint,headers=headers)
        assert response.status_code==status
        assert response.headers['cache-control']=='private, no-store'
        assert response.headers['x-content-type-options']=='nosniff'


def test_bytes_changed_after_registry_load_are_not_served(assets):
    c,r,p,ph,root,load=assets
    loaded=load()
    (root/'media/synthetic-sound.mp3').write_bytes(b'CHANGED AFTER LOAD')
    with pytest.raises(AccountError) as e:loaded.asset_bytes('synthetic-review','synthetic-sound')
    assert e.value.status==503


def test_actual_http_spec_tamper_fails_closed_without_path_disclosure(assets):
    c,r,p,ph,root,_=assets
    (root/'visual-specs/synthetic.json').write_bytes(b'PRIVATE TAMPERED SPEC')
    response=c.get(url(ph,p),headers={'Authorization':'Bearer reviewer'})
    assert response.status_code==503
    assert 'PRIVATE' not in response.text and str(root) not in response.text
    assert response.headers['x-content-type-options']=='nosniff'
