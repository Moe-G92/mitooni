-- NEW synthetic-only Mitooni database. Not a Supabase production migration.
CREATE ROLE mitooni_api LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE ROLE mitooni_browser NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE SCHEMA mitooni_app;
REVOKE ALL ON SCHEMA mitooni_app FROM PUBLIC;
CREATE TABLE mitooni_app.memberships (
 product_id text NOT NULL CHECK(product_id='mitooni'), issuer text NOT NULL,
 subject_id uuid NOT NULL, status text NOT NULL CHECK(status IN ('active','inactive')),
 roles text[] NOT NULL DEFAULT '{}', entitlements text[] NOT NULL DEFAULT '{}',
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 PRIMARY KEY(product_id,issuer,subject_id)
);
CREATE TABLE mitooni_app.profiles (
 product_id text NOT NULL CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL,
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND pg_column_size(data)<=8192),
 revision integer NOT NULL CHECK(revision>0), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
CREATE TABLE mitooni_app.operations (
 product_id text NOT NULL CHECK(product_id='mitooni'), issuer text NOT NULL, subject_id uuid NOT NULL,
 route text NOT NULL CHECK(route IN ('onboarding','profile')), operation_id uuid NOT NULL,
 request_hash text NOT NULL CHECK(length(request_hash)=64), outcome jsonb NOT NULL CHECK(pg_column_size(outcome)<=16384),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(product_id,issuer,subject_id,route,operation_id),
 FOREIGN KEY(product_id,issuer,subject_id) REFERENCES mitooni_app.memberships
);
GRANT USAGE ON SCHEMA mitooni_app TO mitooni_api;
GRANT SELECT ON mitooni_app.memberships TO mitooni_api;
-- Row locking requires UPDATE privilege; no grant to status/roles/entitlements.
GRANT UPDATE(revision) ON mitooni_app.memberships TO mitooni_api;
GRANT SELECT,INSERT,UPDATE ON mitooni_app.profiles TO mitooni_api;
GRANT SELECT,INSERT,DELETE ON mitooni_app.operations TO mitooni_api;
ALTER TABLE mitooni_app.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitooni_app.operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY scoped_member ON mitooni_app.memberships TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true))
 WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
CREATE POLICY scoped_profile ON mitooni_app.profiles TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true))
 WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
CREATE POLICY scoped_operation ON mitooni_app.operations TO mitooni_api
 USING(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true))
 WITH CHECK(product_id='mitooni' AND issuer=current_setting('mitooni.issuer',true) AND subject_id::text=current_setting('mitooni.subject',true));
REVOKE ALL ON ALL TABLES IN SCHEMA mitooni_app FROM PUBLIC,mitooni_browser;
