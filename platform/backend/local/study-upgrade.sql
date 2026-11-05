-- Idempotent additive LOCAL receiving upgrade; never truncates account/work data.
CREATE TABLE IF NOT EXISTS mitooni_app.study_packs (
 id text NOT NULL, version integer NOT NULL CHECK(version>0),
 content_hash text NOT NULL CHECK(length(content_hash)=64),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=65536),
 PRIMARY KEY(id,version)
);
-- Upgrade the initial local draft single-edition key without changing records.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='mitooni_app.study_packs'::regclass AND conname='study_packs_pkey' AND array_length(conkey,1)=1) THEN
 ALTER TABLE mitooni_app.study_packs DROP CONSTRAINT study_packs_pkey;
 ALTER TABLE mitooni_app.study_packs ADD PRIMARY KEY(id,version);
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS mitooni_app.study_states (
 product_id text NOT NULL CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL,
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=1048576),
 revision integer NOT NULL CHECK(revision>0),
 PRIMARY KEY(product_id,issuer,subject_id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
CREATE TABLE IF NOT EXISTS mitooni_app.study_operations (
 product_id text NOT NULL CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL,
 route text NOT NULL, operation_id uuid NOT NULL, request_hash text NOT NULL CHECK(length(request_hash)=64),
 outcome jsonb NOT NULL CHECK(pg_column_size(outcome)<=131072), created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id,route,operation_id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
-- Dispatcher metadata only, never work/model text. No browser grants.
CREATE TABLE IF NOT EXISTS mitooni_app.study_queue (
 turn_id uuid PRIMARY KEY, issuer text NOT NULL, subject_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mitooni_app.study_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.study_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.study_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.study_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS study_owner ON mitooni_app.study_states;
CREATE POLICY study_owner ON mitooni_app.study_states TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true))
 WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
DROP POLICY IF EXISTS study_operation_owner ON mitooni_app.study_operations;
CREATE POLICY study_operation_owner ON mitooni_app.study_operations TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true))
 WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
DROP POLICY IF EXISTS published_read ON mitooni_app.study_packs;
CREATE POLICY published_read ON mitooni_app.study_packs FOR SELECT TO mitooni_api USING(true);
DROP POLICY IF EXISTS dispatcher_service ON mitooni_app.study_queue;
CREATE POLICY dispatcher_service ON mitooni_app.study_queue TO mitooni_api USING(true) WITH CHECK(issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.study_states,mitooni_app.study_operations,mitooni_app.study_packs,mitooni_app.study_queue FROM PUBLIC,mitooni_browser;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.study_states TO mitooni_api;
GRANT SELECT,INSERT,DELETE ON mitooni_app.study_operations,mitooni_app.study_queue TO mitooni_api;
GRANT SELECT ON mitooni_app.study_packs TO mitooni_api;
-- Publication is mutable trusted authority, never an editable pack/body field.
ALTER TABLE mitooni_app.study_packs ADD COLUMN IF NOT EXISTS manifest_hash text;
ALTER TABLE mitooni_app.study_packs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','withdrawn'));
ALTER TABLE mitooni_app.study_packs ADD COLUMN IF NOT EXISTS fixture boolean NOT NULL DEFAULT true;
ALTER TABLE mitooni_app.study_packs ADD COLUMN IF NOT EXISTS allowed_uses text[] NOT NULL DEFAULT '{}';
-- SELECT FOR SHARE requires a column UPDATE grant; immutable data and mutable
-- publication columns remain non-writable by the API role.
ALTER TABLE mitooni_app.study_packs ADD COLUMN IF NOT EXISTS lock_revision integer NOT NULL DEFAULT 1;
GRANT UPDATE(lock_revision) ON mitooni_app.study_packs TO mitooni_api;
DROP POLICY IF EXISTS publication_lock ON mitooni_app.study_packs;
CREATE POLICY publication_lock ON mitooni_app.study_packs FOR UPDATE TO mitooni_api
 USING(status='approved' AND manifest_hash IS NOT NULL AND 'learner_delivery'=ANY(allowed_uses))
 WITH CHECK(status='approved' AND manifest_hash IS NOT NULL AND 'learner_delivery'=ANY(allowed_uses));
