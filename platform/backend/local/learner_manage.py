"""Operate only the independently labelled synthetic learner PostgreSQL."""
import argparse
import json
import socket
import subprocess
from local.manage import IMAGE

NAME = 'mitooni-learner-20261107'
LABEL = 'mitooni-learner-local'
DATABASE_PORT = 55440
API_PORT = 8011


def run(*args):
    return subprocess.run(['docker', *args], check=True, text=True)


def owned(kind):
    result = subprocess.run(['docker', kind, 'inspect', NAME], text=True, capture_output=True)
    if result.returncode:
        if 'no such' not in result.stderr.lower() and f'{NAME} not found' not in result.stderr:
            raise RuntimeError('Docker inspection failed; no resources changed')
        return False
    item = json.loads(result.stdout)[0]
    labels = item.get('Labels') if kind in {'volume', 'network'} else item['Config']['Labels']
    if (labels or {}).get('owner') != LABEL:
        raise RuntimeError('Refusing unrelated resource')
    return True


def verify_port_free(port):
    with socket.socket() as sock:
        try:
            sock.bind(('127.0.0.1', port))
        except OSError:
            raise RuntimeError(f'Port {port} is occupied; no existing service will be stopped') from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['start', 'stop', 'restart', 'status'])
    action = parser.parse_args().action
    exists = owned('container')
    if action == 'start':
        # Refuse collisions rather than changing any existing foundation preview.
        if not exists:
            verify_port_free(DATABASE_PORT)
            verify_port_free(API_PORT)
        if not owned('network'):
            run('network', 'create', '--label', f'owner={LABEL}', NAME)
        if not owned('volume'):
            run('volume', 'create', '--label', f'owner={LABEL}', NAME)
        if exists:
            run('start', NAME)
        else:
            run('run', '-d', '--name', NAME, '--label', f'owner={LABEL}', '--network', NAME,
                '-p', f'127.0.0.1:{DATABASE_PORT}:5432', '-v', NAME + ':/var/lib/postgresql/data',
                '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', '-e', 'POSTGRES_USER=mitooni_admin',
                '-e', 'POSTGRES_DB=mitooni_local', IMAGE)
    elif action in {'stop', 'restart'}:
        if not exists:
            raise RuntimeError('Owned learner container absent')
        run(action, NAME)
    elif exists:
        run('inspect', NAME, '--format', '{{.State.Status}} {{json .NetworkSettings.Ports}}')
    else:
        print('Owned learner container absent')


if __name__ == '__main__':
    main()
