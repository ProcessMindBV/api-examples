"""Mint a one-time login link ("Open in ProcessMind").

    python python/login_link.py [userId] [app/path]

Requires a key with the ``sessions`` scope (off by default). The returned URL
logs the user in WITHOUT a password: single use, valid for 60 seconds,
audited, and void as soon as the key is disabled or the user is deactivated.
Treat it as a password: hand it straight to the user's browser, never log
or store it, and never mint it from browser-side code.
"""

import os
import sys
from typing import Any

from processmind.client import ProcessMindClient, ProcessMindError, context_tenant_id


def mint_login_link(client: ProcessMindClient, tenant_id: str, user_id: str, path: str | None = None) -> dict[str, Any]:
    return client.post(f"/v1/tenant/{tenant_id}/users/{user_id}/login-token", {"path": path} if path else {})


def main() -> None:
    client = ProcessMindClient()
    user_id = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PROCESSMIND_USER_ID")
    if not user_id:
        raise SystemExit("Missing user id. Pass it as an argument or set PROCESSMIND_USER_ID.")
    path = sys.argv[2] if len(sys.argv) > 2 else "app"

    link = mint_login_link(client, context_tenant_id(), user_id, path)
    print(f"Login URL (single use, expires in {link.get('expiresInSeconds')} seconds):")
    print(link.get("url"))
    print("Send the user's browser there now — do not log or store this URL.")


if __name__ == "__main__":
    try:
        main()
    except ProcessMindError as error:
        raise SystemExit(str(error)) from error
