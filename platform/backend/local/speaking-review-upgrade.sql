-- Additive bounded private audio pilot; never self-enroll or reactivate assignments.
ALTER TABLE mitooni_app.content_review_assignments DROP CONSTRAINT IF EXISTS content_review_assignments_permissions_check;
ALTER TABLE mitooni_app.content_review_assignments ADD CONSTRAINT content_review_assignments_permissions_check CHECK(permissions <@ ARRAY['review:use','review:speaking-evaluate']::text[]);
CREATE TABLE IF NOT EXISTS mitooni_app.speaking_review_budgets (
 product_id text NOT NULL CHECK(product_id='mitooni'),issuer text NOT NULL,subject_id uuid NOT NULL,package_hash text NOT NULL,
 recordings integer NOT NULL DEFAULT 0 CHECK(recordings BETWEEN 0 AND 8),storage_bytes bigint NOT NULL DEFAULT 0 CHECK(storage_bytes BETWEEN 0 AND 50331648),
 reserved integer NOT NULL DEFAULT 0 CHECK(reserved BETWEEN 0 AND 8),settled integer NOT NULL DEFAULT 0 CHECK(settled BETWEEN 0 AND 8),
 PRIMARY KEY(product_id,issuer,subject_id,package_hash),FOREIGN KEY(product_id,issuer,subject_id,package_hash) REFERENCES mitooni_app.content_review_assignments
);
CREATE TABLE IF NOT EXISTS mitooni_app.speaking_review_records (
 product_id text NOT NULL CHECK(product_id='mitooni'),issuer text NOT NULL,subject_id uuid NOT NULL,package_hash text NOT NULL,
 target_id text NOT NULL CHECK(length(target_id)<=128),target_hash text NOT NULL CHECK(target_hash ~ '^[a-f0-9]{64}$'),
 recording_id uuid NOT NULL UNIQUE,job_id uuid PRIMARY KEY,operation_id uuid NOT NULL,
 operation_hash text NOT NULL CHECK(operation_hash ~ '^[a-f0-9]{64}$'),request_hash text NOT NULL CHECK(request_hash ~ '^[a-f0-9]{64}$'),
 frozen jsonb NOT NULL CHECK(pg_column_size(frozen)<=65536),audio bytea NOT NULL CHECK(octet_length(audio) BETWEEN 44 AND 18874368),
 status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','completed','failed','dispatch_unknown')),
 revision integer NOT NULL DEFAULT 1,fence integer NOT NULL DEFAULT 0,lease_until timestamptz,
 dispatch_candidate uuid NOT NULL,dispatch_id uuid,result jsonb CHECK(pg_column_size(result)<=65536),
 error_code text CHECK(error_code IN ('dispatch_unknown','speaking_unavailable')),created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(product_id,issuer,subject_id,package_hash,target_id,operation_id),
 FOREIGN KEY(product_id,issuer,subject_id,package_hash) REFERENCES mitooni_app.content_review_assignments
);
CREATE TABLE IF NOT EXISTS mitooni_app.speaking_review_queue (
 job_id uuid PRIMARY KEY REFERENCES mitooni_app.speaking_review_records(job_id),issuer text NOT NULL,subject_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mitooni_app.speaking_review_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.speaking_review_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.speaking_review_queue ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['speaking_review_budgets','speaking_review_records'] LOOP
 EXECUTE format('DROP POLICY IF EXISTS speaking_owner ON mitooni_app.%I',t);
 EXECUTE format('CREATE POLICY speaking_owner ON mitooni_app.%I TO mitooni_api USING(product_id=''mitooni'' AND issuer=current_setting(''mitooni.issuer'',true) AND subject_id::text=current_setting(''mitooni.subject'',true) AND EXISTS(SELECT 1 FROM mitooni_app.content_review_assignments a WHERE a.product_id=%I.product_id AND a.issuer=%I.issuer AND a.subject_id=%I.subject_id AND a.package_hash=%I.package_hash AND a.status=''active'' AND a.permissions @> ARRAY[''review:use'',''review:speaking-evaluate'']::text[])) WITH CHECK(product_id=''mitooni'' AND issuer=current_setting(''mitooni.issuer'',true) AND subject_id::text=current_setting(''mitooni.subject'',true) AND EXISTS(SELECT 1 FROM mitooni_app.content_review_assignments a WHERE a.product_id=%I.product_id AND a.issuer=%I.issuer AND a.subject_id=%I.subject_id AND a.package_hash=%I.package_hash AND a.status=''active'' AND a.permissions @> ARRAY[''review:use'',''review:speaking-evaluate'']::text[]))',t,t,t,t,t,t,t,t,t);
 END LOOP; END $$;
DROP POLICY IF EXISTS speaking_dispatcher ON mitooni_app.speaking_review_queue;
CREATE POLICY speaking_dispatcher ON mitooni_app.speaking_review_queue TO mitooni_api USING(true) WITH CHECK(issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON mitooni_app.speaking_review_records,mitooni_app.speaking_review_budgets,mitooni_app.speaking_review_queue FROM PUBLIC,mitooni_browser,mitooni_api;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.speaking_review_records,mitooni_app.speaking_review_budgets TO mitooni_api;
GRANT SELECT,INSERT,DELETE ON mitooni_app.speaking_review_queue TO mitooni_api;
