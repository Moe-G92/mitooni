"""Durable local adapter. Shared-issuer identity never creates membership.

BarEx profile/bootstrap separation is retained; transactional CAS and owner
scope replace its source read/merge/write preference path. No source data/SQL.
"""
import hashlib
import json
from uuid import UUID
import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from pydantic import ValidationError
from app.contracts.account import AccountOut, EditableProfile, ProfileOut
from app.dependencies import CurrentUser
from app.repositories.account import AccountError, LocalPostgresConfig

OWNER = "product_id='mitooni' AND issuer=%s AND subject_id=%s"


class PostgresAccountRepository:
    def __init__(self, config: LocalPostgresConfig):
        self.config = config

    def _connect(self):
        return psycopg.connect(**self.config.connection_options(), row_factory=dict_row)

    def _scope(self, conn, user):
        try:
            subject = str(UUID(user.id))
        except ValueError:
            raise AccountError('unauthenticated', 401, 'Invalid authenticated identity') from None
        conn.execute("SELECT set_config('mitooni.issuer',%s,true),set_config('mitooni.subject',%s,true)", (self.config.issuer, subject))
        return self.config.issuer, subject

    def _account(self, user, member, row):
        active = member is not None and member['status'] == 'active'
        profile = (row['data'] | dict(revision=row['revision'], onboarded=True)) if active and row else None
        return AccountOut.model_validate(dict(
            identity=dict(id=user.id, email=user.email),
            membership=dict(status=member['status'] if member else 'none',
                roles=member['roles'] if active else [], entitlements=member['entitlements'] if active else []),
            state='ready' if profile else 'setup-required' if active else 'access-required', profile=profile)).model_dump()

    def get(self, user: CurrentUser):
        try:
            with self._connect() as conn:
                conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY')
                owner = self._scope(conn, user)
                member = conn.execute(f'SELECT * FROM mitooni_app.memberships WHERE {OWNER}', owner).fetchone()
                profile = conn.execute(f'SELECT * FROM mitooni_app.profiles WHERE {OWNER}', owner).fetchone() if member and member['status']=='active' else None
                return self._account(user, member, profile)
        except (psycopg.Error, ValidationError, KeyError, TypeError):
            raise AccountError('store_unavailable', 503, 'Account storage is unavailable') from None

    def mutate(self, user, route, body, operation_id):
        payload = body.model_dump(exclude_unset=True)
        digest = hashlib.sha256(json.dumps(payload,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        try:
            with self._connect() as conn:
                owner = self._scope(conn, user)
                # Lock ordering: membership, operation, profile. Serializes mutations
                # and conflicts with admin revocation; no auth data ever self-enrols.
                member = conn.execute(f'SELECT * FROM mitooni_app.memberships WHERE {OWNER} FOR UPDATE', owner).fetchone()
                if member is None:
                    raise AccountError('membership_required', 403, 'Mitooni membership is required')
                if member['status'] != 'active':
                    raise AccountError('membership_inactive', 403, 'Mitooni membership is inactive')
                if 'profile:write' not in member['entitlements']:
                    raise AccountError('permission_denied', 403, 'Profile changes are unavailable')
                previous = conn.execute(f"SELECT * FROM mitooni_app.operations WHERE {OWNER} AND route=%s AND operation_id=%s AND created_at>=now()-interval '24 hours'", (*owner,route,operation_id)).fetchone()
                if previous:
                    if previous['request_hash'] != digest:
                        raise AccountError('idempotency_conflict',409,'Operation key was already used for different changes')
                    saved=ProfileOut.model_validate(previous['outcome']['profile']).model_dump()
                    replay_row={'data':{k:v for k,v in saved.items() if k not in {'revision','onboarded'}},'revision':saved['revision']}
                    return self._account(user,member,replay_row)
                conn.execute(f"DELETE FROM mitooni_app.operations WHERE {OWNER} AND created_at<now()-interval '24 hours'",owner)
                count = conn.execute(f'SELECT count(*) AS n FROM mitooni_app.operations WHERE {OWNER}',owner).fetchone()['n']
                if count >= 256:
                    raise AccountError('operation_limit',429,'Too many recent profile operations; try again later')
                row=conn.execute(f'SELECT * FROM mitooni_app.profiles WHERE {OWNER} FOR UPDATE',owner).fetchone()
                revision=row['revision'] if row else 0
                if revision != body.expectedRevision or (route=='profile' and row is None):
                    raise AccountError('profile_conflict',409,'Profile changed; reload before saving')
                if route=='onboarding':
                    data=body.profile.model_dump()
                else:
                    # Stored version/corruption failures are storage errors, not
                    # learner validation errors; never emit raw Pydantic inputs.
                    data=EditableProfile.model_validate(row['data']).model_dump()
                    for key,value in payload['changes'].items():
                        data[key]=(dict(data[key])|value) if key in {'targets','notifications'} else value
                    try:
                        data=EditableProfile.model_validate(data).model_dump()
                    except ValidationError:
                        raise AccountError('invalid_request',422,'Profile changes are invalid') from None
                revision+=1
                if row:
                    updated=conn.execute(f'UPDATE mitooni_app.profiles SET data=%s,revision=%s,updated_at=now() WHERE {OWNER} AND revision=%s RETURNING *', (Jsonb(data),revision,*owner,body.expectedRevision)).fetchone()
                    if updated is None:
                        raise AccountError('profile_conflict',409,'Profile changed; reload before saving')
                else:
                    updated=conn.execute('INSERT INTO mitooni_app.profiles(product_id,issuer,subject_id,data,revision) VALUES(\'mitooni\',%s,%s,%s,%s) RETURNING *',(*owner,Jsonb(data),revision)).fetchone()
                outcome=self._account(user,member,updated)
                conn.execute('INSERT INTO mitooni_app.operations(product_id,issuer,subject_id,route,operation_id,request_hash,outcome) VALUES(\'mitooni\',%s,%s,%s,%s,%s,%s)',(*owner,route,operation_id,digest,Jsonb({"profile":outcome["profile"]})))
                return outcome
        except (psycopg.Error, ValidationError, KeyError, TypeError):
            raise AccountError('store_unavailable',503,'Account storage is unavailable') from None
