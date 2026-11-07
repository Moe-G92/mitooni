"""No external call: ensure secret values cannot enter CLI args or output."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import pytest

SPEC = importlib.util.spec_from_file_location("bind_runtime", Path(__file__).with_name("bind_runtime.py"))
binding = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(binding)


def test_values_only_use_stdin_and_provider_output_is_not_returned(monkeypatch):
    calls = []
    def run(args, **kwargs):
        calls.append((args, kwargs))
        return SimpleNamespace(returncode=0, stdout="SYNTHETIC_SECRET_MARKER", stderr="SYNTHETIC_SECRET_MARKER")
    monkeypatch.setattr(binding.subprocess, "run", run)
    result = binding.bind({"MITOONI_AUTH_SERVICE_KEY": "SYNTHETIC_SECRET_MARKER"}, "/synthetic/railway")
    assert result == ["MITOONI_AUTH_SERVICE_KEY"]
    args, options = calls[0]
    assert "SYNTHETIC_SECRET_MARKER" not in args and options["input"] == "SYNTHETIC_SECRET_MARKER"
    assert "--stdin" in args and "--skip-deploys" in args


def test_invalid_keys_and_failure_do_not_echo_values(monkeypatch):
    with pytest.raises(ValueError, match="Binding input rejected"):
        binding.bind({"MITOONI_SPEAKING_API_KEY": "SYNTHETIC_SECRET_MARKER"}, "/synthetic/railway")
    monkeypatch.setattr(binding.subprocess, "run", lambda *args, **kwargs: SimpleNamespace(returncode=1, stdout="SYNTHETIC_SECRET_MARKER", stderr="SYNTHETIC_SECRET_MARKER"))
    with pytest.raises(ValueError) as error:
        binding.bind({"MITOONI_DB_PASSWORD": "SYNTHETIC_SECRET_MARKER"}, "/synthetic/railway")
    assert "SYNTHETIC_SECRET_MARKER" not in str(error.value)
