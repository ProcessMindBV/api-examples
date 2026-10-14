"""Load an event log and connect it to a process.

    python python/load_data.py [tenantId] [processId]

    1. create a dataset + datatable
    2. upload a CSV through a presigned URL — the pipeline processes it
       automatically (production systems should listen to the ``data.ready``
       webhook instead of polling, see docs/recipes.md)
    3. map the datatable to the process → intended vs actual in the app

Scopes: uploadData (upload) + write (create/map).
"""

import os
import sys
from typing import Any

from processmind.client import (
    ProcessMindClient,
    ProcessMindError,
    context_tenant_id,
    upload_content_to_datatable,
    wait_for_datatable_ready,
)

sample_csv = """case_id,activity,timestamp
case001,Order received,2024-01-01T09:00:00Z
case001,Process order,2024-01-01T10:00:00Z
case001,Ship order,2024-01-01T12:00:00Z
case001,Order fulfilled,2024-01-01T13:00:00Z
case002,Order received,2024-01-02T09:00:00Z
case002,Process order,2024-01-02T11:00:00Z
case002,Ship order,2024-01-02T15:00:00Z
case002,Order fulfilled,2024-01-02T16:00:00Z
"""


def create_dataset(client: ProcessMindClient, tenant_id: str, display_name: str) -> dict[str, Any]:
    return client.post(f"/v1/tenant/{tenant_id}/datasets", {"displayName": display_name, "treeNodeType": "Dataset"})


def create_datatable(client: ProcessMindClient, tenant_id: str, dataset_id: str, display_name: str) -> dict[str, Any]:
    return client.post(f"/v1/tenant/{tenant_id}/datasets/{dataset_id}/datatables", {"displayName": display_name})


def map_data_to_process(
    client: ProcessMindClient,
    tenant_id: str,
    process_id: str,
    *,
    data_table_id: str,
    display_name: str = "Uploaded data",
    color: str = "data-1",
    show_by_default: bool = True,
) -> dict[str, Any]:
    # ``color`` is one of "data-1" … "data-8". The process must have a model.
    # ``mappingRole`` ("primary" | "comparison") defaults to "comparison".
    return client.post(
        f"/v1/tenant/{tenant_id}/processes/{process_id}/mappings",
        {
            "dataTableId": data_table_id,
            "displayName": display_name,
            "color": {"id": color},
            "showByDefault": show_by_default,
        },
    )


def main() -> None:
    client = ProcessMindClient()
    tenant_id = sys.argv[1] if len(sys.argv) > 1 else context_tenant_id()
    process_id = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("PROCESSMIND_PROCESS_ID")

    dataset = create_dataset(client, tenant_id, "Demo — event logs")
    datatable = create_datatable(client, tenant_id, dataset["id"], "Demo CSV")
    print(f"Dataset created:   {dataset.get('id')}")
    print(f"Datatable created: {datatable.get('id')}")

    upload = upload_content_to_datatable(
        client,
        tenant_id=tenant_id,
        data_table_id=datatable["id"],
        dataset_id=dataset["id"],
        file_name="demo-event-log.csv",
        content=sample_csv,
    )
    print(f"Uploaded {upload['file_name']} ({upload['bytes']} bytes) — waiting for the pipeline…")

    wait_for_datatable_ready(client, tenant_id, datatable["id"])
    print("Data processed.")

    if process_id:
        mapping = map_data_to_process(client, tenant_id, process_id, data_table_id=datatable["id"])
        print(f"Mapped to process {process_id} (mapping {mapping.get('id')}) — open the process in the app for intended vs actual.")
    else:
        print("Tip: pass a process id as the second argument (or set PROCESSMIND_PROCESS_ID) to map this data to a model.")


if __name__ == "__main__":
    try:
        main()
    except ProcessMindError as error:
        raise SystemExit(str(error)) from error
