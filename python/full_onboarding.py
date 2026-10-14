"""End-to-end: provision a customer tenant and hand it back ready to use.

    1. provision the tenant under your organization        (organization key)
    2. mint a tenant-scoped API key for it
    3. create the first user (seat: designer)
    4. load a BPMN model
    5. upload an event log and map it to the model
    6. mint a one-time login link for the user

    python python/full_onboarding.py "Acme Corp"
    python python/full_onboarding.py --cleanup <tenantId>   # soft delete

The organization key needs read + write + uploadData. The tenant key created
in step 2 gets read + write + uploadData + sessions so the demo can finish
with a login link — in production, scope keys to exactly what they need.
"""

import sys
import time

from add_users import add_user
from load_bpmn import create_process, sample_bpmn, upload_bpmn
from load_data import create_dataset, create_datatable, map_data_to_process, sample_csv
from login_link import mint_login_link
from processmind.client import (
    ProcessMindClient,
    ProcessMindError,
    context_tenant_id,
    upload_content_to_datatable,
    wait_for_datatable_ready,
)
from provision_tenant import create_tenant_api_key, provision_tenant


def main() -> None:
    context = context_tenant_id()
    org_client = ProcessMindClient()

    # Soft-delete a tenant this walkthrough created:
    #   python python/full_onboarding.py --cleanup <tenantId>
    if "--cleanup" in sys.argv:
        index = sys.argv.index("--cleanup")
        if index + 1 >= len(sys.argv):
            raise SystemExit("Usage: python python/full_onboarding.py --cleanup <tenantId>")
        tenant_id = sys.argv[index + 1]
        org_client.delete(f"/v1/tenant/{context}/organization/tenants/{tenant_id}")
        print(f"Tenant {tenant_id} deleted (soft). Restore inside the safety window:")
        print(f"  POST /v1/tenant/{context}/organization/tenants/{tenant_id}/restore")
        return

    display_name = sys.argv[1] if len(sys.argv) > 1 else "Demo customer"
    email = f"demo-user-{int(time.time())}@example.com"

    print("1. Provisioning the tenant…")
    tenant = provision_tenant(org_client, context, display_name=display_name)
    print(f"   {tenant.get('displayName')} ({tenant.get('id')}) — {tenant.get('url')}")

    print("2. Minting a tenant-scoped API key…")
    key = create_tenant_api_key(
        org_client,
        tenant["id"],
        "onboarding demo key",
        {"read": True, "write": True, "uploadData": True, "sessions": True},  # sessions: demo only
    )
    print(f"   Key {key.get('id')} (secret received — shown once)")

    # From here on, act as the customer's tenant with its own key.
    client = ProcessMindClient(api_key=key["secret"])

    print("3. Creating the first user…")
    user = add_user(client, tenant["id"], email=email, first_name="Demo", last_name="User", access="designer")
    print(f"   {email} ({user.get('id')})")

    print("4. Loading a BPMN model…")
    process = create_process(client, tenant["id"], "Order to cash")
    upload_bpmn(client, tenant["id"], process["id"], sample_bpmn)
    print(f"   Process {process.get('id')}")

    print("5. Loading data and mapping it to the model…")
    dataset = create_dataset(client, tenant["id"], "Demo — event logs")
    datatable = create_datatable(client, tenant["id"], dataset["id"], "Demo CSV")
    upload_content_to_datatable(
        client,
        tenant_id=tenant["id"],
        data_table_id=datatable["id"],
        dataset_id=dataset["id"],
        file_name="demo-event-log.csv",
        content=sample_csv,
    )
    wait_for_datatable_ready(client, tenant["id"], datatable["id"])
    mapping = map_data_to_process(client, tenant["id"], process["id"], data_table_id=datatable["id"])
    print(f"   Datatable {datatable.get('id')} mapped to {process.get('id')} (mapping {mapping.get('id')})")

    print("6. Minting a one-time login link…")
    link = mint_login_link(client, tenant["id"], user["id"], "app")
    print(f"   {link.get('url')}")
    print(f"   Open it within {link.get('expiresInSeconds')} seconds (single use).")

    print(f"\nDone. The customer workspace is ready at {tenant.get('url')}")
    print(f"Teardown: python python/full_onboarding.py --cleanup {tenant.get('id')}")


if __name__ == "__main__":
    try:
        main()
    except ProcessMindError as error:
        raise SystemExit(str(error)) from error
