"""Quickstart — prove your key works by reading the workspace and its processes.

    export PROCESSMIND_API_KEY="pm-…"
    export PROCESSMIND_TENANT_ID="<tenant id>"
    python python/quickstart.py
"""

from processmind.client import ProcessMindClient, ProcessMindError, context_tenant_id


def quickstart(client: ProcessMindClient, tenant_id: str) -> None:
    tenant = client.get(f"/v1/tenant/{tenant_id}")
    print(f"Workspace:    {tenant.get('displayName')} ({tenant.get('id')})")
    print(f"Organization: {tenant.get('organizationId')}")
    print(f"URL:          {tenant.get('url')}")

    processes = client.get(f"/v1/tenant/{tenant_id}/processes")
    print(f"\nProcesses: {len(processes)}")
    for process in processes[:5]:
        print(f"  · {process.get('displayName')} — {process.get('id')}")
    if len(processes) > 5:
        print(f"  … and {len(processes) - 5} more")


def main() -> None:
    quickstart(ProcessMindClient(), context_tenant_id())


if __name__ == "__main__":
    try:
        main()
    except ProcessMindError as error:
        raise SystemExit(str(error)) from error
