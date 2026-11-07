-- OPERATOR REVIEW ARTIFACT. NEW PROJECT syczumdwgabypxkopkpn ONLY.
-- Never shipped in runtime context. Contains no password generation or credential.
-- Root must pin the MCP project, inspect this file, then authorize each phase.
-- Preconditions: pg_cron 1.6.4 available/preloaded, cron.database_name=postgres;
-- all seven CONFIG_NAMES below ABSENT from postgres.rolconfig.
-- Installation does not arm a lease or change any logging setting.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE SCHEMA mitooni_bootstrap AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA mitooni_bootstrap FROM PUBLIC,anon,authenticated,service_role,mitooni_api,mitooni_browser;
CREATE TABLE mitooni_bootstrap.leases (
 nonce uuid PRIMARY KEY,
 project_ref text NOT NULL CHECK(project_ref='syczumdwgabypxkopkpn'),
 purpose text NOT NULL CHECK(purpose IN ('proof','credential')),
 phase text NOT NULL DEFAULT 'prepared' CHECK(phase IN ('prepared','armed','restored','restore_mismatch')),
 original_roleconfig_hash text NOT NULL,
 baseline jsonb NOT NULL,
 deadline timestamptz,
 job_id bigint UNIQUE,
 expected_command text NOT NULL,
 heartbeat_at timestamptz,
 heartbeat_backend_pid integer,
 armed_at timestamptz,
 restored_backend_pid integer,
 restored_at timestamptz,
 cleanup_failed boolean NOT NULL DEFAULT false
);
ALTER TABLE mitooni_bootstrap.leases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE mitooni_bootstrap.leases FROM PUBLIC,anon,authenticated,service_role,mitooni_api,mitooni_browser;
CREATE UNIQUE INDEX one_armed_credential_guard ON mitooni_bootstrap.leases((phase)) WHERE phase='armed';

CREATE FUNCTION mitooni_bootstrap.require_owner() RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $body$
BEGIN
 IF current_user<>'postgres' OR current_database()<>'postgres' THEN
  RAISE EXCEPTION 'Credential guard owner mismatch';
 END IF;
END $body$;

CREATE FUNCTION mitooni_bootstrap.config_names() RETURNS text[]
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $body$
 SELECT ARRAY['log_statement','log_min_error_statement','log_min_messages',
  'pg_stat_statements.track','pgaudit.log','auto_explain.log_min_duration','log_parameter_max_length']::text[]
$body$;
CREATE FUNCTION mitooni_bootstrap.hardened() RETURNS jsonb
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $body$
 SELECT '{"log_statement":"none","log_min_error_statement":"panic","log_min_messages":"fatal","pg_stat_statements.track":"none","pgaudit.log":"none","auto_explain.log_min_duration":"-1","log_parameter_max_length":"0"}'::jsonb
$body$;

CREATE FUNCTION mitooni_bootstrap.restore(p_nonce uuid,p_force boolean DEFAULT false) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $body$
DECLARE l mitooni_bootstrap.leases%ROWTYPE; actual_hash text;
BEGIN
 PERFORM mitooni_bootstrap.require_owner();
 IF p_force IS NULL THEN RAISE EXCEPTION 'Credential guard force rejected'; END IF;
 SELECT * INTO STRICT l FROM mitooni_bootstrap.leases
  WHERE nonce=p_nonce AND project_ref='syczumdwgabypxkopkpn' FOR UPDATE;
 -- A stale callback from an older lease must NEVER reset a newer lease.
 IF l.phase='restored' THEN RETURN true; END IF;
 UPDATE mitooni_bootstrap.leases SET heartbeat_at=clock_timestamp(),heartbeat_backend_pid=pg_backend_pid() WHERE nonce=p_nonce;
 IF l.phase='prepared' AND NOT p_force THEN RETURN false; END IF;
 IF l.phase='armed' AND NOT p_force AND clock_timestamp()<l.deadline THEN RETURN false; END IF;
 -- Exact restoration of seven previously ABSENT overrides. Preserve search_path.
 ALTER ROLE postgres RESET log_statement;
 ALTER ROLE postgres RESET log_min_error_statement;
 ALTER ROLE postgres RESET log_min_messages;
 ALTER ROLE postgres RESET "pg_stat_statements.track";
 ALTER ROLE postgres RESET "pgaudit.log";
 ALTER ROLE postgres RESET "auto_explain.log_min_duration";
 ALTER ROLE postgres RESET log_parameter_max_length;
 SELECT md5(COALESCE(array_to_string(rolconfig,E'\n'),'')) INTO actual_hash
  FROM pg_roles WHERE rolname='postgres';
 UPDATE mitooni_bootstrap.leases SET
  phase=CASE WHEN actual_hash=l.original_roleconfig_hash THEN 'restored' ELSE 'restore_mismatch' END,
  restored_at=clock_timestamp(),restored_backend_pid=pg_backend_pid() WHERE nonce=p_nonce;
 IF actual_hash=l.original_roleconfig_hash THEN
  -- Cleanup is not allowed to roll back restoration; retryable on later calls.
  BEGIN
   PERFORM cron.unschedule(l.job_id);
  EXCEPTION WHEN OTHERS THEN
   UPDATE mitooni_bootstrap.leases SET cleanup_failed=true WHERE nonce=p_nonce;
  END;
 END IF;
 RETURN actual_hash=l.original_roleconfig_hash;
END $body$;

CREATE FUNCTION mitooni_bootstrap.prepare(p_nonce uuid,p_purpose text) RETURNS bigint
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $body$
DECLARE base jsonb; base_hash text; command text; job_name text; jid bigint; count_names integer;
BEGIN
 PERFORM mitooni_bootstrap.require_owner();
 IF p_purpose NOT IN ('proof','credential') THEN RAISE EXCEPTION 'Credential guard purpose rejected'; END IF;
 IF EXISTS(SELECT 1 FROM mitooni_bootstrap.leases WHERE phase IN ('prepared','armed','restore_mismatch')) THEN
  RAISE EXCEPTION 'An unfinished credential guard exists';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles r CROSS JOIN LATERAL unnest(r.rolconfig) AS entry
  WHERE r.rolname='postgres' AND split_part(entry,'=',1)=ANY(mitooni_bootstrap.config_names())) THEN
  RAISE EXCEPTION 'Credential guard requires absent role overrides';
 END IF;
 SELECT jsonb_object_agg(name,setting),count(*) INTO base,count_names FROM pg_settings
  WHERE name=ANY(mitooni_bootstrap.config_names());
 IF count_names<>7 THEN RAISE EXCEPTION 'Credential guard settings unavailable'; END IF;
 SELECT md5(COALESCE(array_to_string(rolconfig,E'\n'),'')) INTO base_hash FROM pg_roles WHERE rolname='postgres';
 IF p_purpose='credential' AND NOT EXISTS(SELECT 1 FROM mitooni_bootstrap.leases
  WHERE purpose='proof' AND phase='restored' AND armed_at IS NOT NULL
   AND original_roleconfig_hash=base_hash AND NOT cleanup_failed
   AND EXISTS(SELECT 1 FROM cron.job_run_details d WHERE d.jobid=leases.job_id
    AND d.job_pid=leases.restored_backend_pid AND d.status='succeeded'
    AND d.start_time>=leases.armed_at AND d.end_time>=leases.restored_at)) THEN
  RAISE EXCEPTION 'Independent restoration proof required';
 END IF;
 job_name:='mitooni-credential-guard-'||p_nonce::text;
 IF EXISTS(SELECT 1 FROM cron.job WHERE jobname=job_name) THEN RAISE EXCEPTION 'Credential guard job already exists'; END IF;
 command:=format('SET statement_timeout=''5s''; SELECT mitooni_bootstrap.restore(%L::uuid,false);',p_nonce::text);
 INSERT INTO mitooni_bootstrap.leases(nonce,project_ref,purpose,original_roleconfig_hash,baseline,expected_command)
 VALUES(p_nonce,'syczumdwgabypxkopkpn',p_purpose,base_hash,base,command);
 jid:=cron.schedule(job_name,'10 seconds',command);
 UPDATE mitooni_bootstrap.leases SET job_id=jid WHERE nonce=p_nonce;
 RETURN jid;
END $body$;

CREATE FUNCTION mitooni_bootstrap.require_watchdog(p_nonce uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $body$
DECLARE l mitooni_bootstrap.leases%ROWTYPE;
BEGIN
 PERFORM mitooni_bootstrap.require_owner();
 SELECT * INTO STRICT l FROM mitooni_bootstrap.leases
  WHERE nonce=p_nonce AND project_ref='syczumdwgabypxkopkpn';
 IF l.heartbeat_at IS NULL OR l.heartbeat_at<clock_timestamp()-interval '25 seconds' THEN
  RAISE EXCEPTION 'Independent watchdog heartbeat unavailable';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM cron.job_run_details d WHERE d.jobid=l.job_id
  AND d.job_pid=l.heartbeat_backend_pid AND d.status='succeeded'
  AND d.start_time<=l.heartbeat_at AND d.end_time>=l.heartbeat_at) THEN
  RAISE EXCEPTION 'Scheduled heartbeat proof unavailable';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM cron.job j WHERE j.jobid=l.job_id AND j.active
  AND j.username='postgres' AND j.database='postgres' AND j.schedule='10 seconds'
  AND j.command=l.expected_command AND j.jobname='mitooni-credential-guard-'||p_nonce::text) THEN
  RAISE EXCEPTION 'Independent watchdog unavailable';
 END IF;
END $body$;

CREATE FUNCTION mitooni_bootstrap.arm(p_nonce uuid) RETURNS timestamptz
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $body$
DECLARE l mitooni_bootstrap.leases%ROWTYPE; desired jsonb; n text; actual_hash text; deadline_at timestamptz;
BEGIN
 PERFORM mitooni_bootstrap.require_owner();
 SELECT * INTO STRICT l FROM mitooni_bootstrap.leases
  WHERE nonce=p_nonce AND project_ref='syczumdwgabypxkopkpn' FOR UPDATE;
 IF l.phase<>'prepared' THEN RAISE EXCEPTION 'Credential guard is not prepared'; END IF;
 PERFORM mitooni_bootstrap.require_watchdog(p_nonce);
 SELECT md5(COALESCE(array_to_string(rolconfig,E'\n'),'')) INTO actual_hash FROM pg_roles WHERE rolname='postgres';
 IF actual_hash<>l.original_roleconfig_hash THEN RAISE EXCEPTION 'Role defaults changed'; END IF;
 -- Proof writes harmless baseline-valued overrides. Credential phase is separate.
 desired:=CASE WHEN l.purpose='proof' THEN l.baseline ELSE mitooni_bootstrap.hardened() END;
 FOREACH n IN ARRAY mitooni_bootstrap.config_names() LOOP
  EXECUTE format('ALTER ROLE postgres SET %I TO %L',n,desired->>n);
 END LOOP;
 deadline_at:=clock_timestamp()+CASE WHEN l.purpose='proof' THEN interval '20 seconds' ELSE interval '90 seconds' END;
 UPDATE mitooni_bootstrap.leases SET phase='armed',armed_at=clock_timestamp(),deadline=deadline_at WHERE nonce=p_nonce;
 RETURN deadline_at;
END $body$;

CREATE FUNCTION mitooni_bootstrap.assert_ready(p_nonce uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $body$
DECLARE l mitooni_bootstrap.leases%ROWTYPE; e record; current_value text; r record;
BEGIN
 PERFORM mitooni_bootstrap.require_owner();
 SELECT * INTO STRICT l FROM mitooni_bootstrap.leases
  WHERE nonce=p_nonce AND project_ref='syczumdwgabypxkopkpn' FOR SHARE;
 IF l.purpose<>'credential' OR l.phase<>'armed' OR l.deadline<clock_timestamp()+interval '10 seconds'
  OR l.deadline>clock_timestamp()+interval '120 seconds' THEN RAISE EXCEPTION 'Credential lease unavailable'; END IF;
 PERFORM mitooni_bootstrap.require_watchdog(p_nonce);
 FOR e IN SELECT * FROM jsonb_each_text(mitooni_bootstrap.hardened()) LOOP
  SELECT setting INTO current_value FROM pg_settings WHERE name=e.key;
  IF current_value IS DISTINCT FROM e.value THEN RAISE EXCEPTION 'Effective logging guard unavailable'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_settings WHERE name IN ('log_min_duration_statement','log_min_duration_sample') AND setting<>'-1')
  OR EXISTS(SELECT 1 FROM pg_settings WHERE name IN ('log_statement_stats','log_parser_stats','log_planner_stats','log_executor_stats') AND setting<>'off')
  OR (SELECT setting FROM pg_settings WHERE name='log_parameter_max_length_on_error') IS DISTINCT FROM '0' THEN
  RAISE EXCEPTION 'Additional statement capture is active';
 END IF;
 SELECT * INTO STRICT r FROM pg_roles WHERE rolname='mitooni_api';
 IF r.rolcanlogin OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolinherit OR r.rolreplication OR r.rolbypassrls
  OR EXISTS(SELECT 1 FROM pg_auth_members WHERE member=r.oid)
  OR EXISTS(SELECT 1 FROM pg_class WHERE relowner=r.oid)
  OR EXISTS(SELECT 1 FROM pg_namespace WHERE nspowner=r.oid) THEN
  RAISE EXCEPTION 'Runtime role privilege guard unavailable';
 END IF;
END $body$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA mitooni_bootstrap
 FROM PUBLIC,anon,authenticated,service_role,mitooni_api,mitooni_browser;
COMMIT;

-- OPERATOR PHASES: do not execute automatically; use new validated UUIDs.
-- 1 prepare(PROOF_NONCE,'proof'); observe heartbeat from cron (not manual restore).
-- 2 arm(PROOF_NONCE); writes BASELINE values only. Wait for actual watchdog run.
-- 3 verify phase=restored, cleanup_failed=false, original roleconfig hash and
--   fresh backend settings equal preflight. Only then prepare credential nonce.
-- 4 prepare(CREDENTIAL_NONCE,'credential'); observe independent heartbeat.
-- 5 arm(CREDENTIAL_NONCE); new connection must pass assert_ready(nonce).
-- 6 Nonsecret dynamic-failure/log/stat canary; RSA-PGP/helper tests ready first.
-- 7 SAME SQL call: assert_ready(nonce) BEFORE ANY RANDOM PASSWORD GENERATION.
--   Credential generation/cipher return is a separate root-reviewed operation.
-- 8 ROOT FINALLY: restore(nonce,true), verify exact roleconfig + fresh settings,
--   close bootstrap sessions; verify job inactive. Watchdog is backup only.
-- No DROP EXTENSION or broad cleanup. Delete only owned completed metadata/job.
