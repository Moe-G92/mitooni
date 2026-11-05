"""Owner-only manual proof: restarts OUR database; don't run during another test."""
import subprocess
import time
from uuid import uuid4
from fastapi.testclient import TestClient
from local.manage import NAME,owned
from local.seed import admin_connection,seed
from local.fixtures import SUBJECTS
from local.serve import create_local_app


def main():
    if not owned('container'):raise RuntimeError('Isolated Mitooni container required')
    seed()
    with admin_connection() as conn:
        conn.execute('DELETE FROM mitooni_app.operations WHERE subject_id=%s',(SUBJECTS['a'],))
        conn.execute('DELETE FROM mitooni_app.profiles WHERE subject_id=%s',(SUBJECTS['a'],))
    headers={'Authorization':'Bearer local-a','X-Expected-User-Id':SUBJECTS['a'],'Idempotency-Key':str(uuid4())}
    with TestClient(create_local_app()) as c:
        r=c.post('/api/profile/onboarding',headers=headers,json={'expectedRevision':0,'profile':{
            'name':'Synthetic restart proof','targets':{k:6.5 for k in ('overall','listening','reading','writing','speaking')},'weeklyHours':6}})
        assert r.status_code==200,r.text
        expected=r.json()['profile']
    subprocess.run(['docker','restart',NAME],check=True,capture_output=True)
    for _ in range(30):
        try:
            with admin_connection() as conn:
                version=conn.execute("SELECT current_setting('server_version')").fetchone()[0]
            break
        except Exception:
            time.sleep(0.2)
    else:raise RuntimeError('Restart did not recover')
    with TestClient(create_local_app()) as c:
        r=c.get('/api/account',headers=headers)
        assert r.status_code==200 and r.json()['profile']==expected
    print(f'PASS: acknowledged profile survived database restart and new application lifecycle (PostgreSQL {version})')


if __name__=='__main__':main()
