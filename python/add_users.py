"""Create users and assign seats. No invitation email is sent by the API —
hand the user a one-time login link (see login_link.py) or invite them your
own way.

    python python/add_users.py [tenantId]

Seats (``access``): none | portalViewer | designer | architect | intelligence
``isDashboardViewer`` is a boolean for read-only dashboard access — not a seat.

Seat capacity is enforced per contract: organizations with the
``requireCapacity`` policy answer with 409 SEAT_LIMIT_EXCEEDED, 403 FREE_CAP or
403 FREE_USER_CAP instead of silently exceeding the paid seats.
"""

import sys
import time
from typing import Any

from processmind.client import ProcessMindClient, ProcessMindError, context_tenant_id


def add_user(
    client: ProcessMindClient,
    tenant_id: str,
    *,
    email: str,
    first_name: str | None = None,
    last_name: str | None = None,
    access: str = "designer",
    is_dashboard_viewer: bool = False,
    is_admin_in_tenant: bool = False,
) -> dict[str, Any]:
    return client.post(
        f"/v1/tenant/{tenant_id}/users",
        {
            "email": email,
            "firstName": first_name,
            "lastName": last_name,
            "isActiveInTenant": True,
            "isAdminInTenant": is_admin_in_tenant,
            "access": access,
            "isDashboardViewer": is_dashboard_viewer,
        },
    )


def list_users(client: ProcessMindClient, tenant_id: str) -> list[dict[str, Any]]:
    return client.get(f"/v1/tenant/{tenant_id}/users")


def main() -> None:
    client = ProcessMindClient()
    tenant_id = sys.argv[1] if len(sys.argv) > 1 else context_tenant_id()

    email = f"demo-user-{int(time.time())}@example.com"
    user = add_user(client, tenant_id, email=email, first_name="Demo", last_name="User")
    print(f"User created: {email} → {user.get('id')}")

    users = list_users(client, tenant_id)
    print(f"Users in tenant: {len(users)}")


if __name__ == "__main__":
    try:
        main()
    except ProcessMindError as error:
        raise SystemExit(str(error)) from error
