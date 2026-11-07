"""Static security-contract checks; actual cron/role effects require root's canary.

No remote SQL, credentials, subprocesses or project mutation are performed here.
These regressions inspect executable function boundaries rather than prose.
"""
from pathlib import Path
import re

SQL=Path(__file__).with_name('credential_guard.sql').read_text()
CODE='\n'.join(line for line in SQL.splitlines() if not line.lstrip().startswith('--'))

def body(name):
    return re.search(r'CREATE FUNCTION mitooni_bootstrap\.'+name+r'\(.*?\$body\$(.*?)\$body\$;',CODE,re.S).group(1)

def test_no_secret_generation_or_password_statement_in_guard():
    assert not re.search(r'\bPASSWORD\b|gen_random_bytes|pgp_pub_encrypt|pg_authid|SECURITY\s+DEFINER',CODE,re.I)
    assert CODE.count('SECURITY INVOKER')==8

def test_exact_restore_matches_only_changed_gucs_and_preserves_other_defaults():
    names=re.findall(r"'([^']+)'",body('config_names'))
    restore=body('restore')
    reset=re.findall(r'ALTER ROLE postgres RESET\s+"?([^";\s]+)"?;',restore)
    assert len(names)==len(reset)==7 and set(names)==set(reset)
    assert 'RESET ALL' not in CODE and 'RESET search_path' not in CODE
    assert restore.index("IF l.phase='restored' THEN RETURN true")<restore.index('ALTER ROLE postgres RESET')

def test_watchdog_ownership_and_actual_scheduler_pid_evidence():
    b=body('require_watchdog')
    for value in ["j.username='postgres'","j.database='postgres'","j.schedule='10 seconds'",'j.command=l.expected_command','j.active','cron.job_run_details','d.job_pid=l.heartbeat_backend_pid',"d.status='succeeded'"]:
        assert value in b
    assert "'10 seconds'" in body('prepare')

def test_proof_cannot_be_manually_faked_or_admit_credentials_before_arm():
    b=body('prepare')
    for value in ["purpose='proof'", "phase='restored'",'armed_at IS NOT NULL','d.job_pid=leases.restored_backend_pid',"d.status='succeeded'",'d.start_time>=leases.armed_at','d.end_time>=leases.restored_at']:
        assert value in b
    assert 'unfinished credential guard' in b

def test_same_call_gate_checks_actual_settings_and_runtime_privileges():
    b=body('assert_ready')
    for value in ['FOR SHARE',"l.purpose<>'credential'","l.phase<>'armed'","interval '10 seconds'","interval '120 seconds'",'FROM pg_settings','current_value IS DISTINCT FROM e.value','rolcanlogin','rolsuper','rolcreatedb','rolcreaterole','rolinherit','rolreplication','rolbypassrls','pg_auth_members','pg_class','pg_namespace']:
        assert value in b
    assert 'auto_explain.log_min_duration' in body('hardened')
    assert 'log_parameter_max_length_on_error' in b

def test_baseline_proof_and_real_lease_are_separate_and_bounded():
    b=body('arm')
    assert "l.purpose='proof' THEN l.baseline ELSE mitooni_bootstrap.hardened()" in b
    assert "interval '20 seconds' ELSE interval '90 seconds'" in b
    assert b.index('require_watchdog')<b.index('EXECUTE format')

def test_cleanup_failure_cannot_rollback_restore_and_private_grants():
    b=body('restore')
    assert b.index('ALTER ROLE postgres RESET')<b.index('BEGIN\n   PERFORM cron.unschedule')
    assert 'EXCEPTION WHEN OTHERS THEN' in b and 'cleanup_failed=true' in b
    assert 'ENABLE ROW LEVEL SECURITY' in CODE
    assert 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA mitooni_bootstrap' in CODE
    for role in ['PUBLIC','anon','authenticated','service_role','mitooni_api','mitooni_browser']:
        assert role in CODE
    assert "project_ref='syczumdwgabypxkopkpn'" in CODE

def test_issuer_gates_before_randomness_encrypts_before_role_change_and_sanitizes():
    raw=Path(__file__).with_name('credential_issue.sql').read_text()
    issue='\n'.join(line for line in raw.splitlines() if not line.lstrip().startswith('--'))
    order=['assert_ready(',"current_setting('password_encryption')", "'__NONCE__' !~", 'gen_random_bytes(48)', 'pgp_pub_encrypt(', "EXECUTE format('ALTER ROLE mitooni_api LOGIN PASSWORD %L'"]
    positions=[issue.index(part) for part in order]
    assert positions==sorted(positions)
    assert 'assert_failure OR query_canceled OR OTHERS' in issue
    assert 'SQLERRM' not in issue and 'GET STACKED DIAGNOSTICS' not in issue
    assert issue.count('secret_value := NULL')==2
    assert '"status":"failed"' in issue
    assert issue.rstrip().endswith("SELECT current_setting('mitooni.credential_handoff',true)::jsonb AS envelope;")
    for name in ['schemaVersion','projectRef','role','nonce','expiresAt','password','recipientFingerprint','ciphertextBase64']:
        assert "'"+name+"'" in issue
    assert "'cipher-algo=aes256,compress-algo=0'" in issue
    assert "expiry_value := '__EXPIRES_AT__'" in issue
    for part in ['expiry_value::timestamptz', "interval '70 seconds'", "interval '300 seconds'", "to_char(expiry_timestamp AT TIME ZONE 'UTC'"]:
        assert issue.index(part)<issue.index('gen_random_bytes(48)')
