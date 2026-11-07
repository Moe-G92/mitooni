-- Additive receiving schema artifact; apply only through separately authorized admin deployment.
-- Review assignments are independent of learner publication and are never self-enrolled.
CREATE TABLE IF NOT EXISTS mitooni_app.content_review_assignments (
 product_id text NOT NULL CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL,
 package_hash text NOT NULL CHECK(package_hash ~ '^[a-f0-9]{64}$'),
 status text NOT NULL CHECK(status IN ('active','revoked')),
 permissions text[] NOT NULL CHECK(permissions <@ ARRAY['review:use']::text[]),
 lock_revision integer NOT NULL DEFAULT 1,
 PRIMARY KEY(product_id,issuer,subject_id,package_hash)
);
CREATE TABLE IF NOT EXISTS mitooni_app.content_review_states (
 product_id text NOT NULL CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL,
 package_hash text NOT NULL, target_id text NOT NULL CHECK(length(target_id)<=128),
 target_hash text NOT NULL CHECK(target_hash ~ '^[a-f0-9]{64}$'),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=1048576),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id,package_hash,target_id),
 FOREIGN KEY(product_id,issuer,subject_id,package_hash) REFERENCES mitooni_app.content_review_assignments
);
CREATE TABLE IF NOT EXISTS mitooni_app.content_review_operations (
 product_id text NOT NULL CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL,
 package_hash text NOT NULL, route text NOT NULL CHECK(length(route)<=160), operation_id uuid NOT NULL,
 request_hash text NOT NULL CHECK(request_hash ~ '^[a-f0-9]{64}$'),
 outcome jsonb NOT NULL CHECK(jsonb_typeof(outcome)='object' AND pg_column_size(outcome)<=1048576),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id,package_hash,route,operation_id),
 FOREIGN KEY(product_id,issuer,subject_id,package_hash) REFERENCES mitooni_app.content_review_assignments
);
ALTER TABLE mitooni_app.content_review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.content_review_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.content_review_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reviewer_assignment_owner ON mitooni_app.content_review_assignments;
CREATE POLICY reviewer_assignment_owner ON mitooni_app.content_review_assignments FOR SELECT TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
DROP POLICY IF EXISTS reviewer_assignment_lock ON mitooni_app.content_review_assignments;
CREATE POLICY reviewer_assignment_lock ON mitooni_app.content_review_assignments FOR UPDATE TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true))
 WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
DROP POLICY IF EXISTS reviewer_state_owner ON mitooni_app.content_review_states;
CREATE POLICY reviewer_state_owner ON mitooni_app.content_review_states TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)
 AND EXISTS(SELECT 1 FROM mitooni_app.content_review_assignments a WHERE a.product_id=content_review_states.product_id AND a.issuer=content_review_states.issuer AND a.subject_id=content_review_states.subject_id AND a.package_hash=content_review_states.package_hash AND a.status='active' AND 'review:use'=ANY(a.permissions)))
 WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)
 AND EXISTS(SELECT 1 FROM mitooni_app.content_review_assignments a WHERE a.product_id=content_review_states.product_id AND a.issuer=content_review_states.issuer AND a.subject_id=content_review_states.subject_id AND a.package_hash=content_review_states.package_hash AND a.status='active' AND 'review:use'=ANY(a.permissions)));
DROP POLICY IF EXISTS reviewer_operation_owner ON mitooni_app.content_review_operations;
CREATE POLICY reviewer_operation_owner ON mitooni_app.content_review_operations TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)
 AND EXISTS(SELECT 1 FROM mitooni_app.content_review_assignments a WHERE a.product_id=content_review_operations.product_id AND a.issuer=content_review_operations.issuer AND a.subject_id=content_review_operations.subject_id AND a.package_hash=content_review_operations.package_hash AND a.status='active' AND 'review:use'=ANY(a.permissions)))
 WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true)
 AND EXISTS(SELECT 1 FROM mitooni_app.content_review_assignments a WHERE a.product_id=content_review_operations.product_id AND a.issuer=content_review_operations.issuer AND a.subject_id=content_review_operations.subject_id AND a.package_hash=content_review_operations.package_hash AND a.status='active' AND 'review:use'=ANY(a.permissions)));
REVOKE ALL ON mitooni_app.content_review_assignments,mitooni_app.content_review_states,mitooni_app.content_review_operations FROM PUBLIC,mitooni_browser,mitooni_api;
GRANT SELECT ON mitooni_app.content_review_assignments TO mitooni_api;
GRANT UPDATE(lock_revision) ON mitooni_app.content_review_assignments TO mitooni_api;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.content_review_states TO mitooni_api;
GRANT SELECT,INSERT ON mitooni_app.content_review_operations TO mitooni_api;
