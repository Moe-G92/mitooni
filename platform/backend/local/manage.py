"""Operate only this new labelled synthetic workload, never source containers."""
import argparse
import json
import subprocess
from pathlib import Path

NAME='mitooni-account-20261105'
IMAGE='postgres@sha256:742f40ea20b9ff2ff31db5458d127452988a2164df9e17441e191f3b72252193'


def run(*args,**kwargs):
    return subprocess.run(['docker',*args],check=True,text=True,**kwargs)


def owned(kind):
    result=subprocess.run(['docker',kind,'inspect',NAME],text=True,capture_output=True)
    if result.returncode:
        return False
    item=json.loads(result.stdout)[0]
    labels=item.get('Labels') if kind in {'volume','network'} else item['Config']['Labels']
    if (labels or {}).get('owner')!='mitooni-local':
        raise RuntimeError('Refusing to change an unrelated resource')
    return True


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['start','stop','restart','status','destroy'])
    action=parser.parse_args().action
    exists=owned('container')
    if action=='start':
        if not owned('network'):run('network','create','--label','owner=mitooni-local',NAME)
        if not owned('volume'):run('volume','create','--label','owner=mitooni-local',NAME)
        if exists:run('start',NAME)
        else:run('run','-d','--name',NAME,'--label','owner=mitooni-local','--network',NAME,
                 '-p','127.0.0.1:55439:5432','-v',NAME+':/var/lib/postgresql/data',
                 '-e','POSTGRES_HOST_AUTH_METHOD=trust','-e','POSTGRES_USER=mitooni_admin',
                 '-e','POSTGRES_DB=mitooni_local',IMAGE)
    elif action in {'stop','restart'}:
        if not exists:raise RuntimeError('Mitooni container does not exist')
        run(action,NAME)
    elif action=='status':
        if exists:run('inspect',NAME,'--format','{{.State.Status}} {{json .NetworkSettings.Ports}}')
        else:print('Mitooni container absent')
    else:
        if exists:run('rm','-f',NAME)
        if owned('network'):run('network','rm',NAME)
        if owned('volume'):run('volume','rm',NAME)


if __name__=='__main__':main()
