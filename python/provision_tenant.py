"""Provision a customer tenant under your organization, and mint a
tenant-scoped API key for it.

    python python/provision_tenant.py "Acme Corp"

Needs an ORGANIZATION key (created in the app under Settings → API Keys).

Notes
- ``shortName`` is the tenant's subdomain (https://<shortName>.processmind.com).
  It must be unique; reserved or duplicate names are rejected with 406. The
  default below suffixes a timestamp so reruns don't collide.
- Tenant creation follows your plan allowance (partner organizations are
  uncapped) and provisions a complete, isolated database.
- The tenant key's secret is returned ONCE. Store it in a secret manager.
"""

import sys
import time
from typing import Any

from processmind.client import ProcessMindClient, ProcessMindError, context_tenant_id


def provision_tenant(
    client: ProcessMindClient,
    context_tenant: str,
    *,
    display_name: str | None = None,
    short_name: str | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {"shortName": short_name or f"demo-{int(time.time()):x}"}
    if display_name:
        body["displayName"] = display_name
    return client.post(f"/v1/tenant/{context_tenant}/organization/tenants", body)


def create_tenant_api_key(
    client: ProcessMindClient,
    tenant_id: str,
    display_name: str,
    scope: dict[str, bool] | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {"displayName": display_name}
    # Grant ``sessions`` only if this tenant's key must mint login links.
    if scope:
        body["scope"] = scope
    return client.post(f"/v1/tenant/{tenant_id}/api-keys", body)


def main() -> None:
    client = ProcessMindClient()
    display_name = sys.argv[1] if len(sys.argv) > 1 else "Demo customer"

    tenant = provision_tenant(client, context_tenant_id(), display_name=display_name)
    print(f"Tenant created: {tenant.get('displayName')} ({tenant.get('id')})")
    print(f"URL:            {tenant.get('url')}")

    key = create_tenant_api_key(client, tenant["id"], "demo tenant key")
    print(f"Tenant key:     {key.get('id')}")
    print(f"Secret (shown once — save it now): {key.get('secret')}")

    print(f"\nUse the tenant key for tenant-scoped calls, e.g. python python/add_users.py {tenant['id']}")


if __name__ == "__main__":
    try:
        main()
    except ProcessMindError as error:
        raise SystemExit(str(error)) from error
