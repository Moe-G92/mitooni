"""Operator-only binding via stdin; no env files, value output or deployments.

Not copied to image/context. Reads a small JSON object from stdin in memory and
passes each value to Railway's stdin facility, suppressing all provider output.
"""
import argparse
import json
import subprocess
import sys

PROJECT = "6687f485-a208-49d9-a6da-e9cd323ce14e"
ENVIRONMENT = "54ed21ac-3ceb-44b9-a791-591747debfcb"
SERVICE = "775a8fd8-9f44-443b-bb0b-58b8344c8a87"
ALLOWED = {"PORT", "MITOONI_BETA_HOST", "MITOONI_AUTH_URL", "MITOONI_AUTH_PROJECT", "MITOONI_AUTH_SERVICE_KEY",
           "MITOONI_DB_HOST", "MITOONI_DB_HOSTADDR", "MITOONI_DB_NAME", "MITOONI_DB_PORT", "MITOONI_DB_PASSWORD",
           "MITOONI_REVIEW_PACKAGE_HASH", "VITE_MITOONI_AUTH_URL", "VITE_MITOONI_AUTH_PUBLISHABLE_KEY"}


def bind(values, cli):
    if not isinstance(values, dict) or not values or not set(values) <= ALLOWED:
        raise ValueError("Binding input rejected")
    if any(not isinstance(value, str) or not value.strip() or len(value) > 16384 for value in values.values()):
        raise ValueError("Binding input rejected")
    completed = []
    for name, value in values.items():
        try:
            result = subprocess.run([cli, "variable", "set", name, "--stdin", "--skip-deploys",
                                     "--project", PROJECT, "--environment", ENVIRONMENT, "--service", SERVICE],
                                    input=value, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                    timeout=45, check=False)
        except (OSError, subprocess.TimeoutExpired):
            raise ValueError("Binding failed for " + name) from None
        if result.returncode != 0:
            raise ValueError("Binding failed for " + name)
        completed.append(name)
    return completed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cli", required=True)
    args = parser.parse_args()
    try:
        raw = sys.stdin.read(65537)
        if len(raw) > 65536:
            raise ValueError()
        keys = bind(json.loads(raw), args.cli)
    except Exception:
        print("Runtime binding failed; inspect named-key operation privately", file=sys.stderr)
        return 1
    print(json.dumps({"projectId": PROJECT, "serviceId": SERVICE, "boundKeys": keys, "deploymentTriggered": False}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
