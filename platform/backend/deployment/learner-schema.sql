-- Additive candidate MVP schema. Apply after receiving-schema.sql. No identities or provider allocation.

CREATE TABLE IF NOT EXISTS mitooni_app.learner_journeys (
 product_id text NOT NULL DEFAULT 'mitooni' CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=65536),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
ALTER TABLE mitooni_app.learner_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.learner_journeys FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_owner ON mitooni_app.learner_journeys;
CREATE POLICY candidate_owner ON mitooni_app.learner_journeys TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)) WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.learner_journeys FROM PUBLIC,mitooni_browser;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.learner_journeys TO mitooni_api;

CREATE TABLE IF NOT EXISTS mitooni_app.learner_plan_versions (
 product_id text NOT NULL DEFAULT 'mitooni' CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL, id uuid NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=262144),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id,id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
ALTER TABLE mitooni_app.learner_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.learner_plan_versions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_owner ON mitooni_app.learner_plan_versions;
CREATE POLICY candidate_owner ON mitooni_app.learner_plan_versions TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)) WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.learner_plan_versions FROM PUBLIC,mitooni_browser;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.learner_plan_versions TO mitooni_api;

CREATE TABLE IF NOT EXISTS mitooni_app.learner_sessions (
 product_id text NOT NULL DEFAULT 'mitooni' CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL, id uuid NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=262144),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id,id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
ALTER TABLE mitooni_app.learner_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.learner_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_owner ON mitooni_app.learner_sessions;
CREATE POLICY candidate_owner ON mitooni_app.learner_sessions TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)) WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.learner_sessions FROM PUBLIC,mitooni_browser;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.learner_sessions TO mitooni_api;

CREATE TABLE IF NOT EXISTS mitooni_app.learner_workspaces (
 product_id text NOT NULL DEFAULT 'mitooni' CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL, id uuid NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=262144),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id,id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
ALTER TABLE mitooni_app.learner_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.learner_workspaces FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_owner ON mitooni_app.learner_workspaces;
CREATE POLICY candidate_owner ON mitooni_app.learner_workspaces TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)) WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.learner_workspaces FROM PUBLIC,mitooni_browser;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.learner_workspaces TO mitooni_api;

CREATE TABLE IF NOT EXISTS mitooni_app.learner_attempts (
 product_id text NOT NULL DEFAULT 'mitooni' CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL, id uuid NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0), status text NOT NULL CHECK(status IN ('open','submitted','expired')), body_hash text CHECK(body_hash IS NULL OR body_hash ~ '^[a-f0-9]{64}$'), CHECK(status='open' OR body_hash IS NOT NULL),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=262144),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id,id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
ALTER TABLE mitooni_app.learner_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.learner_attempts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_owner ON mitooni_app.learner_attempts;
CREATE POLICY candidate_owner ON mitooni_app.learner_attempts TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)) WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.learner_attempts FROM PUBLIC,mitooni_browser;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.learner_attempts TO mitooni_api;

CREATE TABLE IF NOT EXISTS mitooni_app.learner_evidence (
 product_id text NOT NULL DEFAULT 'mitooni' CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL, id uuid NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=65536),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id,id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
ALTER TABLE mitooni_app.learner_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.learner_evidence FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_owner ON mitooni_app.learner_evidence;
CREATE POLICY candidate_owner ON mitooni_app.learner_evidence TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)) WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.learner_evidence FROM PUBLIC,mitooni_browser;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.learner_evidence TO mitooni_api;

CREATE TABLE IF NOT EXISTS mitooni_app.learner_jobs (
 product_id text NOT NULL DEFAULT 'mitooni' CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL, id uuid NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0), status text NOT NULL CHECK(status IN ('queued','running','cancel-requested','canceled','completed','failed','dispatch-unknown')),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=262144),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id,id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
ALTER TABLE mitooni_app.learner_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.learner_jobs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_owner ON mitooni_app.learner_jobs;
CREATE POLICY candidate_owner ON mitooni_app.learner_jobs TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)) WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.learner_jobs FROM PUBLIC,mitooni_browser;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.learner_jobs TO mitooni_api;

CREATE TABLE IF NOT EXISTS mitooni_app.learner_recordings (
 product_id text NOT NULL DEFAULT 'mitooni' CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL, id uuid NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0), audio bytea NOT NULL CHECK(octet_length(audio)<=18874368), sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=65536),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id,id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
ALTER TABLE mitooni_app.learner_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.learner_recordings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_owner ON mitooni_app.learner_recordings;
CREATE POLICY candidate_owner ON mitooni_app.learner_recordings TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)) WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.learner_recordings FROM PUBLIC,mitooni_browser;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.learner_recordings TO mitooni_api;

CREATE TABLE IF NOT EXISTS mitooni_app.learner_operations (
 product_id text NOT NULL DEFAULT 'mitooni' CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL, route text NOT NULL CHECK(length(route)<=240), operation_id uuid NOT NULL,
 request_hash text NOT NULL CHECK(request_hash ~ '^[a-f0-9]{64}$'),
 outcome jsonb NOT NULL CHECK(jsonb_typeof(outcome)='object' AND pg_column_size(outcome)<=524288),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id,route,operation_id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
ALTER TABLE mitooni_app.learner_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.learner_operations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_owner ON mitooni_app.learner_operations;
CREATE POLICY candidate_owner ON mitooni_app.learner_operations TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)) WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.learner_operations FROM PUBLIC,mitooni_browser;
GRANT SELECT,INSERT,DELETE ON mitooni_app.learner_operations TO mitooni_api;
CREATE INDEX IF NOT EXISTS learner_operations_created ON mitooni_app.learner_operations(product_id,issuer,subject_id,created_at);
-- Frozen work is append-only. Feedback belongs in jobs/evidence, not its response body.
CREATE OR REPLACE FUNCTION mitooni_app.guard_frozen_learner_attempt() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF OLD.status IN ('submitted','expired') THEN
  RAISE EXCEPTION 'Submitted learner attempts are immutable' USING ERRCODE='23514';
 END IF;
 IF TG_OP='UPDATE' AND NEW.status IN ('submitted','expired') AND NEW.body_hash IS NULL THEN
  RAISE EXCEPTION 'Frozen learner attempts require a body hash' USING ERRCODE='23514';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION mitooni_app.guard_frozen_learner_attempt() FROM PUBLIC,mitooni_browser;
DROP TRIGGER IF EXISTS frozen_learner_attempt ON mitooni_app.learner_attempts;
CREATE TRIGGER frozen_learner_attempt BEFORE UPDATE OR DELETE ON mitooni_app.learner_attempts
FOR EACH ROW EXECUTE FUNCTION mitooni_app.guard_frozen_learner_attempt();
CREATE TABLE IF NOT EXISTS mitooni_app.provider_budget_policies (
 id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 100),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=16384)
);
CREATE TABLE IF NOT EXISTS mitooni_app.provider_usage_totals (
 policy_id text PRIMARY KEY REFERENCES mitooni_app.provider_budget_policies,
 reserved_micros bigint NOT NULL DEFAULT 0 CHECK(reserved_micros>=0),
 settled_micros bigint NOT NULL DEFAULT 0 CHECK(settled_micros>=0),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0)
);
CREATE TABLE IF NOT EXISTS mitooni_app.provider_usage_reservations (
 id uuid PRIMARY KEY, product_id text NOT NULL DEFAULT 'mitooni' CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL,
 policy_id text NOT NULL REFERENCES mitooni_app.provider_budget_policies,
 reserved_micros bigint NOT NULL CHECK(reserved_micros>=0),
 settled_micros bigint NOT NULL DEFAULT 0 CHECK(settled_micros>=0),
 status text NOT NULL CHECK(status IN ('reserved','settled','released','dispatch-unknown')),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=16384),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
ALTER TABLE mitooni_app.provider_budget_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.provider_budget_policies FORCE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.provider_usage_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.provider_usage_totals FORCE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.provider_usage_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.provider_usage_reservations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS policy_read ON mitooni_app.provider_budget_policies;
CREATE POLICY policy_read ON mitooni_app.provider_budget_policies FOR SELECT TO mitooni_api USING(true);
DROP POLICY IF EXISTS totals_service ON mitooni_app.provider_usage_totals;
CREATE POLICY totals_service ON mitooni_app.provider_usage_totals TO mitooni_api USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS reservation_owner ON mitooni_app.provider_usage_reservations;
CREATE POLICY reservation_owner ON mitooni_app.provider_usage_reservations TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)) WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.provider_budget_policies,mitooni_app.provider_usage_totals,mitooni_app.provider_usage_reservations FROM PUBLIC,mitooni_browser,mitooni_api;
GRANT SELECT ON mitooni_app.provider_budget_policies TO mitooni_api;
GRANT SELECT,UPDATE ON mitooni_app.provider_usage_totals TO mitooni_api;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.provider_usage_reservations TO mitooni_api;
-- Dispatcher may enumerate identifiers only, never candidate work or provider context.
CREATE TABLE IF NOT EXISTS mitooni_app.learner_job_queue (
 job_id uuid PRIMARY KEY, issuer text NOT NULL, subject_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mitooni_app.learner_job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.learner_job_queue FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS queue_metadata_read ON mitooni_app.learner_job_queue;
CREATE POLICY queue_metadata_read ON mitooni_app.learner_job_queue FOR SELECT TO mitooni_api USING(true);
DROP POLICY IF EXISTS queue_owner_insert ON mitooni_app.learner_job_queue;
CREATE POLICY queue_owner_insert ON mitooni_app.learner_job_queue FOR INSERT TO mitooni_api
 WITH CHECK(issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
DROP POLICY IF EXISTS queue_owner_delete ON mitooni_app.learner_job_queue;
CREATE POLICY queue_owner_delete ON mitooni_app.learner_job_queue FOR DELETE TO mitooni_api
 USING(issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.learner_job_queue FROM PUBLIC,mitooni_browser;
GRANT SELECT,INSERT,DELETE ON mitooni_app.learner_job_queue TO mitooni_api;
-- Publication is trusted admin authority; API can lock but cannot modify admission.
CREATE TABLE IF NOT EXISTS mitooni_app.learner_publications (
 catalog_hash text PRIMARY KEY CHECK(catalog_hash ~ '^[a-f0-9]{64}$'),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=65536
  AND data ?& ARRAY['status','allowedUses','withdrawnTaskIds']
  AND data->>'status' IN ('approved','withdrawn')
  AND jsonb_typeof(data->'allowedUses')='array'
  AND jsonb_typeof(data->'withdrawnTaskIds')='array'),
 lock_revision integer NOT NULL DEFAULT 1 CHECK(lock_revision>0)
);
ALTER TABLE mitooni_app.learner_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.learner_publications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS publication_read ON mitooni_app.learner_publications;
CREATE POLICY publication_read ON mitooni_app.learner_publications FOR SELECT TO mitooni_api USING(true);
DROP POLICY IF EXISTS publication_lock ON mitooni_app.learner_publications;
CREATE POLICY publication_lock ON mitooni_app.learner_publications FOR UPDATE TO mitooni_api USING(true) WITH CHECK(true);
REVOKE ALL ON mitooni_app.learner_publications FROM PUBLIC,mitooni_browser,mitooni_api;
GRANT SELECT ON mitooni_app.learner_publications TO mitooni_api;
GRANT UPDATE(lock_revision) ON mitooni_app.learner_publications TO mitooni_api;
REVOKE UPDATE ON mitooni_app.learner_recordings,mitooni_app.learner_evidence,mitooni_app.learner_plan_versions FROM mitooni_api;
CREATE OR REPLACE FUNCTION mitooni_app.guard_immutable_learner_recording() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 RAISE EXCEPTION 'Learner recordings are immutable' USING ERRCODE='23514';
END $$;
REVOKE ALL ON FUNCTION mitooni_app.guard_immutable_learner_recording() FROM PUBLIC,mitooni_browser;
DROP TRIGGER IF EXISTS immutable_learner_recording ON mitooni_app.learner_recordings;
CREATE TRIGGER immutable_learner_recording BEFORE UPDATE OR DELETE ON mitooni_app.learner_recordings
FOR EACH ROW EXECUTE FUNCTION mitooni_app.guard_immutable_learner_recording();
-- Hosted default grants can differ. Explicitly deny every learner/provider table
-- and helper function to browser/Data API roles when those roles exist.
DO $$
DECLARE denied_role text; table_name text;
BEGIN
 FOREACH denied_role IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=denied_role) THEN
   FOR table_name IN SELECT tablename FROM pg_tables
    WHERE schemaname='mitooni_app' AND (tablename LIKE 'learner_%' OR tablename LIKE 'provider_%') LOOP
    EXECUTE format('REVOKE ALL ON TABLE mitooni_app.%I FROM %I',table_name,denied_role);
   END LOOP;
   EXECUTE format('REVOKE ALL ON FUNCTION mitooni_app.guard_frozen_learner_attempt() FROM %I',denied_role);
   EXECUTE format('REVOKE ALL ON FUNCTION mitooni_app.guard_immutable_learner_recording() FROM %I',denied_role);
  END IF;
 END LOOP;
END $$;
-- Shared cross-owner concurrency counter; dispatch-unknown retains its slot.
ALTER TABLE mitooni_app.provider_usage_totals
 ADD COLUMN IF NOT EXISTS active_jobs integer NOT NULL DEFAULT 0 CHECK(active_jobs>=0);
CREATE INDEX IF NOT EXISTS provider_reservation_policy_owner
 ON mitooni_app.provider_usage_reservations(policy_id,product_id,issuer,subject_id);
-- API policy locking serializes dispatch with admin kill-switch/rate changes.
-- The policy body remains exclusively admin-owned.
ALTER TABLE mitooni_app.provider_budget_policies
 ADD COLUMN IF NOT EXISTS lock_revision integer NOT NULL DEFAULT 1 CHECK(lock_revision>0);
GRANT UPDATE(lock_revision) ON mitooni_app.provider_budget_policies TO mitooni_api;
DROP POLICY IF EXISTS budget_policy_lock ON mitooni_app.provider_budget_policies;
CREATE POLICY budget_policy_lock ON mitooni_app.provider_budget_policies
 FOR UPDATE TO mitooni_api USING(true) WITH CHECK(true);
