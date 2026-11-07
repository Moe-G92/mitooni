import importlib.util
from pathlib import Path
from types import SimpleNamespace
import json
import pytest

SPEC=importlib.util.spec_from_file_location('presence',Path(__file__).with_name('check_ai_key_presence.py'))
presence=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(presence)


def response(nodes,more=False,cursor=None):
    return SimpleNamespace(returncode=0,stdout=json.dumps({'data':{'environment':{'variables':{
        'edges':[{'node':n} for n in nodes],'pageInfo':{'hasNextPage':more,'endCursor':cursor}}}}}),stderr='')


def node(**kw):
    return dict(name=presence.KEY,serviceId=presence.SERVICE,environmentId=presence.ENVIRONMENT,isSealed=True)|kw


def test_names_only_query_scopes_presence_and_never_fetches_values(monkeypatch):
    calls=[]
    def run(args,**kwargs):
        calls.append((args,kwargs))
        return response([node(name='UNRELATED_KEY'),node(serviceId='other-service'),node()])
    monkeypatch.setattr(presence.subprocess,'run',run)
    assert presence.check('/synthetic/railway')==dict(keyPresent=True,keySealed=True,valuesRequested=False,validCredentialProven=False)
    assert ' value' not in presence.QUERY and 'variablesForServiceDeployment' not in presence.QUERY
    assert '--compact' in calls[0][0] and calls[0][1]['stderr'] is presence.subprocess.PIPE


def test_absent_key_does_not_mean_safe_to_overwrite_any_existing_value(monkeypatch):
    monkeypatch.setattr(presence.subprocess,'run',lambda *a,**kw:response([]))
    assert presence.check('/synthetic/railway')['keyPresent'] is False


def test_metadata_pagination_and_sanitized_unrequested_fields(monkeypatch):
    results=iter([response([],True,'page-two'),response([node()])])
    monkeypatch.setattr(presence.subprocess,'run',lambda *a,**kw:next(results))
    assert presence.check('/synthetic/railway')['keyPresent'] is True
    monkeypatch.setattr(presence.subprocess,'run',lambda *a,**kw:response([node(value='SENSITIVE_SYNTHETIC_MARKER')]))
    with pytest.raises(ValueError,match='^Key metadata check unavailable$') as exc:
        presence.check('/synthetic/railway')
    assert 'SENSITIVE' not in str(exc.value)
