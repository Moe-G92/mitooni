"""Measurement caching preserves actual file admission on every package load."""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from hashlib import sha256
from threading import Barrier, Event
import pytest
import app.services.content_pipeline as pipeline

META = dict(width=None,height=None,durationSeconds=0.1,sampleRateHz=24000,channels=1)

@pytest.fixture(autouse=True)
def isolated_cache():
    with pipeline._MEDIA_METADATA_LOCK:
        pipeline._MEDIA_METADATA_CACHE.clear()
    yield
    with pipeline._MEDIA_METADATA_LOCK:
        pipeline._MEDIA_METADATA_CACHE.clear()

@pytest.fixture
def asset(tmp_path,monkeypatch):
    root=tmp_path.resolve()
    path=root/'synthetic.mp3';path.write_bytes(b'SYNTHETIC MEDIA ONE')
    record=dict(path=path.name,sha256=sha256(path.read_bytes()).hexdigest(),sizeBytes=path.stat().st_size,
                mediaType='audio/mpeg',specPath=None,**META)
    calls=[]
    def measure(path,mime):
        calls.append((str(path),mime))
        return dict(META)
    monkeypatch.setattr(pipeline,'measured_media',measure)
    return root,path,record,calls


def verify(root,record):
    pipeline.verify_package_assets(root,dict(companions={},assets=[record]))


def test_warm_reuse_still_reads_and_hashes_current_file(asset,monkeypatch):
    root,path,record,calls=asset
    original=type(path).read_bytes;reads=[]
    def read(self):
        if self==path:reads.append(str(self))
        return original(self)
    monkeypatch.setattr(type(path),'read_bytes',read)
    verify(root,record)
    reads_after_cold=len(reads)
    verify(root,record)
    assert len(calls)==1 and len(reads)==reads_after_cold+1


@pytest.mark.parametrize('mutation',['same_size_bytes','missing','symlink'])
def test_warm_cache_cannot_admit_changed_missing_or_symlink_file(asset,mutation):
    root,path,record,calls=asset
    verify(root,record)
    if mutation=='same_size_bytes':path.write_bytes(b'X'*record['sizeBytes'])
    elif mutation=='missing':path.unlink()
    else:
        other=root/'other.mp3';other.write_bytes(path.read_bytes())
        path.unlink();path.symlink_to(other)
    with pytest.raises(pipeline.ContentError):verify(root,record)
    assert len(calls)==1


@pytest.mark.parametrize('field,value',[('durationSeconds',0.2),('sampleRateHz',48000),('channels',2),('width',3),('sizeBytes',1)])
def test_current_declarations_are_checked_after_cached_measurement(asset,field,value):
    root,path,record,calls=asset
    verify(root,record)
    changed=deepcopy(record);changed[field]=value
    with pytest.raises(pipeline.ContentError):verify(root,changed)
    assert len(calls)==1


def test_new_actual_digest_same_path_gets_new_measurement(asset):
    root,path,record,calls=asset
    verify(root,record)
    path.write_bytes(b'SYNTHETIC MEDIA TWO')
    record['sha256']=sha256(path.read_bytes()).hexdigest();record['sizeBytes']=path.stat().st_size
    verify(root,record)
    assert len(calls)==2


def test_path_and_mime_are_part_of_measurement_identity(asset):
    root,path,record,calls=asset
    verify(root,record)
    other=root/'second.mp3';other.write_bytes(path.read_bytes())
    moved=deepcopy(record);moved['path']=other.name
    verify(root,moved)
    moved['mediaType']='audio/wav'
    verify(root,moved)
    assert len(calls)==3


def test_returned_dictionary_cannot_modify_cached_scalars(asset):
    root,path,record,calls=asset
    one=pipeline._cached_asset_measurement(root,record,path,record['sha256'])
    one['channels']=999
    two=pipeline._cached_asset_measurement(root,record,path,record['sha256'])
    assert two==META and len(calls)==1


@pytest.mark.parametrize('mutation',['bytes','symlink'])
def test_change_during_first_measurement_does_not_publish_cache(asset,monkeypatch,mutation):
    root,path,record,calls=asset
    original_bytes=path.read_bytes()
    def changed(path,mime):
        calls.append((str(path),mime))
        if mutation=='bytes':path.write_bytes(b'X'*len(original_bytes))
        else:
            other=root/'other.mp3';other.write_bytes(original_bytes)
            path.unlink();path.symlink_to(other)
        return dict(META)
    monkeypatch.setattr(pipeline,'measured_media',changed)
    with pytest.raises(pipeline.ContentError):verify(root,record)
    assert not pipeline._MEDIA_METADATA_CACHE
    if path.is_symlink():path.unlink()
    path.write_bytes(original_bytes)
    monkeypatch.setattr(pipeline,'measured_media',lambda *_:dict(META))
    verify(root,record)
    assert len(pipeline._MEDIA_METADATA_CACHE)==1


def test_concurrent_cold_requests_measure_once(asset,monkeypatch):
    root,path,record,calls=asset
    started=Event();release=Event();barrier=Barrier(3)
    def slow(path,mime):
        calls.append((str(path),mime));started.set()
        assert release.wait(3)
        return dict(META)
    monkeypatch.setattr(pipeline,'measured_media',slow)
    def run():
        barrier.wait(timeout=3)
        verify(root,record)
    with ThreadPoolExecutor(max_workers=3) as pool:
        tasks=[pool.submit(run) for _ in range(3)]
        assert started.wait(3)
        release.set()
        for task in tasks:task.result(timeout=3)
    assert len(calls)==1


def test_failed_leader_releases_lock_and_waiters_retry_without_negative_cache(asset,monkeypatch):
    root,path,record,calls=asset
    barrier=Barrier(3)
    def first_fails(path,mime):
        calls.append((str(path),mime))
        if len(calls)==1:raise pipeline.ContentError('Synthetic decoder failure')
        return dict(META)
    monkeypatch.setattr(pipeline,'measured_media',first_fails)
    def run():
        barrier.wait(timeout=3)
        try:
            verify(root,record)
            return 'pass'
        except pipeline.ContentError:
            return 'failed'
    with ThreadPoolExecutor(max_workers=3) as pool:
        tasks=[pool.submit(run) for _ in range(3)]
        results=[task.result(timeout=3) for task in tasks]
    assert sorted(results)==['failed','pass','pass'] and len(calls)==2


def test_lru_eviction_is_bounded_and_evicted_measurement_is_retried(asset,monkeypatch):
    root,path,record,calls=asset
    monkeypatch.setattr(pipeline,'_MEDIA_METADATA_LIMIT',2)
    verify(root,record)
    for name in ['second.mp3','third.mp3']:
        (root/name).write_bytes(path.read_bytes())
        item=deepcopy(record);item['path']=name
        verify(root,item)
    assert len(pipeline._MEDIA_METADATA_CACHE)==2
    verify(root,record)
    assert len(calls)==4 and len(pipeline._MEDIA_METADATA_CACHE)==2
