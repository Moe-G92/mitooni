-- Operator template only. Replace public context markers after validation.
-- Fixed new Mitooni project syczumdwgabypxkopkpn; no plaintext secret is input.
-- Execute as ONE implicit transaction with the final SELECT last.
-- Require a proven active restore watchdog and fresh effective logging gates.
SET LOCAL statement_timeout = '5s';
DO $issue$
DECLARE
 secret_value text;
 encrypted_value text;
 expiry_value text;
 expiry_timestamp timestamptz;
BEGIN
 PERFORM mitooni_bootstrap.assert_ready('__NONCE__'::uuid);
 IF current_setting('password_encryption') <> 'scram-sha-256' THEN
  RAISE EXCEPTION 'Credential encryption guard unavailable';
 END IF;
 IF '__NONCE__' !~ '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
  OR '__ENCRYPTION_FINGERPRINT__' !~ '^[A-F0-9]{40}$' THEN
  RAISE EXCEPTION 'Credential public context rejected';
 END IF;
 -- Root pins this public expiry BEFORE arming; the local helper receives the
 -- same independently supplied value, never a value trusted from this result.
 expiry_value := '__EXPIRES_AT__';
 IF expiry_value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' THEN
  RAISE EXCEPTION 'Credential public expiry rejected';
 END IF;
 expiry_timestamp := expiry_value::timestamptz;
 IF to_char(expiry_timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') <> expiry_value
  OR expiry_timestamp <= clock_timestamp() + interval '70 seconds'
  OR expiry_timestamp > clock_timestamp() + interval '300 seconds' THEN
  RAISE EXCEPTION 'Credential public expiry rejected';
 END IF;
 secret_value := encode(extensions.gen_random_bytes(48),'hex');
 encrypted_value := replace(encode(extensions.pgp_pub_encrypt(
  jsonb_build_object('schemaVersion',1,'projectRef','syczumdwgabypxkopkpn',
   'role','mitooni_api','nonce','__NONCE__','expiresAt',expiry_value,
   'password',secret_value)::text,
  extensions.dearmor($publickey$__PUBLIC_KEY__$publickey$),
  'cipher-algo=aes256,compress-algo=0'),'base64'),E'\n','');
 EXECUTE format('ALTER ROLE mitooni_api LOGIN PASSWORD %L',secret_value);
 secret_value := NULL;
 PERFORM set_config('mitooni.credential_handoff',jsonb_build_object(
  'schemaVersion',1,'projectRef','syczumdwgabypxkopkpn','role','mitooni_api',
  'nonce','__NONCE__','expiresAt',expiry_value,
  'recipientFingerprint','__ENCRYPTION_FINGERPRINT__',
  'ciphertextBase64',encrypted_value)::text,true);
EXCEPTION
 WHEN assert_failure OR query_canceled OR OTHERS THEN
  -- Entire block rolls back, including LOGIN/password, before this handler.
  -- Never emit SQLERRM, context, detail, or the constructed password statement.
  secret_value := NULL;
  encrypted_value := NULL;
  PERFORM set_config('mitooni.credential_handoff','{"status":"failed"}',true);
END $issue$;
SELECT current_setting('mitooni.credential_handoff',true)::jsonb AS envelope;
