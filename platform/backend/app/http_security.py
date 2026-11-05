"""Request routing/privacy classification uses the ASGI path, never Host URLs."""

from ipaddress import ip_address
import re
from typing import Any


def routing_path(scope: dict[str, Any]) -> str:
    # This is the same server-derived routing path consumed by Starlette's
    # router. Reconstructing a URL from attacker-controlled Host can change it.
    path = scope.get("path", "")
    return path if isinstance(path, str) else ""


def account_or_study_path(scope: dict[str, Any]) -> bool:
    path = routing_path(scope)
    return (
        path == "/api/account"
        or path.startswith("/api/profile")
        or path.startswith("/api/study/")
    )


def private_api_path(scope: dict[str, Any]) -> bool:
    return routing_path(scope) == "/api/me" or account_or_study_path(scope)


def valid_host_authority(scope: dict[str, Any]) -> bool:
    """Validate authority syntax without imposing an invented deployment allowlist.

    Never construct a URL or return the supplied value. International domain
    names must use their ASCII IDNA form; bracketed IPv6 and explicit ports work.
    """
    hosts = [
        value for name, value in scope.get("headers", []) if name.lower() == b"host"
    ]
    if len(hosts) != 1:
        return False
    try:
        host = hosts[0].decode("ascii")
    except (UnicodeDecodeError, AttributeError):
        return False
    if (
        not host
        or len(host) > 261
        or any(char in host for char in "/\\?#@%")
        or any(ord(char) <= 32 or ord(char) == 127 for char in host)
    ):
        return False
    if host.startswith("["):
        match = re.fullmatch(r"\[([^\]]+)\](?::([0-9]{1,5}))?", host)
        if match is None:
            return False
        try:
            if ip_address(match.group(1)).version != 6:
                return False
        except ValueError:
            return False
        port = match.group(2)
    else:
        if host.count(":") > 1:
            return False
        name, separator, port = host.partition(":")
        labels = (name[:-1] if name.endswith(".") else name).split(".")
        if (
            not name
            or len(name) > 253
            or any(
                not re.fullmatch(
                    r"[A-Za-z0-9_](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9_])?", label
                )
                for label in labels
            )
        ):
            return False
        if separator and not port:
            return False
    return not port or bool(
        re.fullmatch(r"[0-9]{1,5}", port) and 1 <= int(port) <= 65535
    )
