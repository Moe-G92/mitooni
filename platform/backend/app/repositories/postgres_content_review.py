"""Assignment-scoped durable reviewer work. No learner publication methods."""
from datetime import datetime, timezone
import psycopg
from psycopg.types.json import Jsonb
from app.repositories.postgres_account import PostgresAccountRepository
from app.repositories.account import AccountError
from app.services.content_pipeline import digest
from app.services.content_review import empty_state, fail

OWNER = "product_id='mitooni' AND issuer=%s AND subject_id=%s"

class PostgresContentReviewRepository(PostgresAccountRepository):
    def __init__(self, config, package_configuration):
        super().__init__(config)
        self.package_configuration = package_configuration

    def _assignment(self, c, owner, package_hash):
        row = c.execute(f"SELECT * FROM mitooni_app.content_review_assignments WHERE {OWNER} AND package_hash=%s FOR SHARE", (*owner, package_hash)).fetchone()
        if not row or row['status'] != 'active' or 'review:use' not in row['permissions']:
            fail('review_denied', 403)
        return row

    def _snapshot(self, package, target, state, assignment):
        result = package.snapshot(target, state)
        if package.get(target).get('skill') == 'speaking':
            permission = 'review:speaking-evaluate' in assignment['permissions']
            result['task']['speaking'] = dict(permissionGranted=permission,
                available=permission and getattr(self, 'speaking_available', False) is True)
        return result

    def call(self, user, action, body=None, key=None, target=None):
        # Never serve replay or metadata from a changed/unvalidated author package.
        package = self.package_configuration.load()
        try:
            with self._connect() as c:
                owner = self._scope(c, user)
                assignment = self._assignment(c, owner, package.hash)
                if action in {'catalog', 'export'}:
                    rows = c.execute(f"SELECT target_id,target_hash,data FROM mitooni_app.content_review_states WHERE {OWNER} AND package_hash=%s ORDER BY target_id", (*owner, package.hash)).fetchall()
                    states = {}
                    for row in rows:
                        if row['target_hash'] != digest(package.get(row['target_id'])):
                            fail('content_unavailable', 503)
                        states[row['target_id']] = row['data']
                    if action == 'catalog':
                        return dict(packageHash=package.hash, title=package.package['manifest']['title'], targets=[package.metadata(t, states.get(t)) for t in package.targets])
                    return dict(schemaVersion=1, packageHash=package.hash, reviewerId=user.id,
                        exportedAt=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                        evidenceKind='reviewer_editorial_feedback', learnerPublicationAuthorized=False,
                        records=[dict(targetId=t, targetHash=digest(package.get(t)), targetVersion=package.get(t)['version'], revision=s['revision'], submission=s['submission'], revealedAt=s['revealedAt'], review=s['review']) for t, s in states.items()])
                package.get(target)
                target_hash = digest(package.get(target))
                # Assignment lock is shared across readers/writers; serialize each target
                # using an owner/package lock before its first state exists. This
                # also makes the operation budget atomic across target writes.
                c.execute("SELECT pg_advisory_xact_lock(hashtextextended(%s,0))", ('|'.join((*owner, package.hash)),))
                row = c.execute(f"SELECT target_hash,data FROM mitooni_app.content_review_states WHERE {OWNER} AND package_hash=%s AND target_id=%s FOR UPDATE", (*owner, package.hash, target)).fetchone()
                if row and row['target_hash'] != target_hash:
                    fail('content_unavailable', 503)
                state = row['data'] if row else empty_state()
                if action == 'target':
                    return self._snapshot(package, target, state, assignment)
                payload = body.model_dump()
                if payload['packageHash'] != package.hash or payload['targetHash'] != target_hash:
                    fail('content_changed')
                route = action + ':' + target
                request_hash = digest(payload)
                previous = c.execute(f"SELECT request_hash,outcome FROM mitooni_app.content_review_operations WHERE {OWNER} AND package_hash=%s AND route=%s AND operation_id=%s", (*owner, package.hash, route, key)).fetchone()
                if previous:
                    if previous['request_hash'] != request_hash:
                        fail('idempotency_conflict')
                    # Stored outcome is only the original state; secrets are projected
                    # under current assignment/content authority on every replay.
                    return self._snapshot(package, target, previous['outcome'], assignment)
                count = c.execute(f"SELECT count(*) AS n FROM mitooni_app.content_review_operations WHERE {OWNER} AND package_hash=%s", (*owner, package.hash)).fetchone()['n']
                if count >= 4096:
                    fail('operation_limit', 429)
                state = package.apply(target, state, action, payload)
                c.execute("INSERT INTO mitooni_app.content_review_states(product_id,issuer,subject_id,package_hash,target_id,target_hash,data) VALUES('mitooni',%s,%s,%s,%s,%s,%s) ON CONFLICT(product_id,issuer,subject_id,package_hash,target_id) DO UPDATE SET data=excluded.data,updated_at=now()", (*owner, package.hash, target, target_hash, Jsonb(state)))
                c.execute("INSERT INTO mitooni_app.content_review_operations(product_id,issuer,subject_id,package_hash,route,operation_id,request_hash,outcome) VALUES('mitooni',%s,%s,%s,%s,%s,%s,%s)", (*owner, package.hash, route, key, request_hash, Jsonb(state)))
                return self._snapshot(package, target, state, assignment)
        except AccountError:
            raise
        except (psycopg.Error, KeyError, TypeError, ValueError):
            fail('store_unavailable', 503)

    def asset(self, user, target, asset_id, package_hash, target_hash, *, has_range=False):
        package = self.package_configuration.load()
        try:
            with self._connect() as c:
                owner = self._scope(c, user)
                self._assignment(c, owner, package.hash)
                package.get(target)
                if package_hash != package.hash or target_hash != digest(package.get(target)):
                    fail('content_changed')
                if has_range:
                    fail('range_unsupported', 416)
                # Read and verify complete bytes while the assignment read lock is
                # held. No FileResponse path is reopened after authority/integrity.
                return package.asset_bytes(target, asset_id)
        except AccountError:
            raise
        except (psycopg.Error, KeyError, TypeError, ValueError):
            fail('store_unavailable', 503)
