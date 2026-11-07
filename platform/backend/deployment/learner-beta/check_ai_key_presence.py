"""Read only names/sealed metadata; never request environment variable values.

Operator-only, not shipped. Presence does not establish nonblank/valid credentials.
"""
import argparse
import json
import subprocess
import sys

PROJECT = '6687f485-a208-49d9-a6da-e9cd323ce14e'
ENVIRONMENT = '54ed21ac-3ceb-44b9-a791-591747debfcb'
SERVICE = '775a8fd8-9f44-443b-bb0b-58b8344c8a87'
KEY = 'MITOONI_AI_API_KEY'
QUERY = '''query CandidateKeyMetadata($project: String!, $environment: String!, $after: String) {
 environment(id: $environment, projectId: $project) {
  variables(first:100,after:$after) {
   edges { node { name serviceId environmentId isSealed } }
   pageInfo { hasNextPage endCursor }
  }
 }
}'''


def check(cli):
    after = None
    found = []
    for _ in range(10):
        variables = json.dumps({'project':PROJECT,'environment':ENVIRONMENT,'after':after})
        try:
            result = subprocess.run([cli,'api',QUERY,'--variables',variables,'--compact'],
                text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=45,check=False)
            if result.returncode:
                raise ValueError()
            response = json.loads(result.stdout)
            if response.get('errors'):
                raise ValueError()
            connection = response['data']['environment']['variables']
            for edge in connection['edges']:
                node = edge['node']
                # Never accept an unrequested server field that might carry data.
                if set(node) != {'name','serviceId','environmentId','isSealed'}:
                    raise ValueError()
                if node['name'] == KEY and node['serviceId'] == SERVICE and node['environmentId'] == ENVIRONMENT:
                    if type(node['isSealed']) is not bool:
                        raise ValueError()
                    found.append(node['isSealed'])
            page = connection['pageInfo']
            if page['hasNextPage'] is False:
                if len(found) > 1:
                    raise ValueError()
                return {'keyPresent':bool(found),'keySealed':found[0] if found else None,
                        'valuesRequested':False,'validCredentialProven':False}
            next_cursor = page['endCursor']
            if not isinstance(next_cursor,str) or not next_cursor or next_cursor == after:
                raise ValueError()
            after = next_cursor
        except Exception:
            raise ValueError('Key metadata check unavailable') from None
    raise ValueError('Key metadata check unavailable')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cli',required=True)
    args = parser.parse_args()
    try:
        result = check(args.cli)
    except Exception:
        print('Key metadata check unavailable',file=sys.stderr)
        return 1
    print(json.dumps(result))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
