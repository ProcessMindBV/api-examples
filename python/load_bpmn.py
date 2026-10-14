"""Create a process and load a BPMN 2.0 model into it.

    python python/load_bpmn.py [tenantId] [path/to/model.bpmn]

Without a file path a small sample model is uploaded. Uploading a model
REPLACES the process's current model — snapshot a version first if you
overwrite on a schedule (see docs/recipes.md).
"""

import sys
from pathlib import Path
from typing import Any

from processmind.client import ProcessMindClient, ProcessMindError, context_tenant_id

sample_bpmn = """<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_Demo">
	<bpmn:process id="Process_Demo" isExecutable="false">
		<bpmn:startEvent id="Start" name="Order received"/>
		<bpmn:task id="Task1" name="Process order"/>
		<bpmn:task id="Task2" name="Ship order"/>
		<bpmn:endEvent id="End" name="Order fulfilled"/>
		<bpmn:sequenceFlow id="Flow1" sourceRef="Start" targetRef="Task1"/>
		<bpmn:sequenceFlow id="Flow2" sourceRef="Task1" targetRef="Task2"/>
		<bpmn:sequenceFlow id="Flow3" sourceRef="Task2" targetRef="End"/>
	</bpmn:process>
</bpmn:definitions>"""


def create_process(
    client: ProcessMindClient,
    tenant_id: str,
    display_name: str,
    *,
    tree_parent_id: str | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {"displayName": display_name, "treeNodeType": "Process"}
    if tree_parent_id:
        body["treeParentId"] = tree_parent_id
    return client.post(f"/v1/tenant/{tenant_id}/processes", body)


def upload_bpmn(client: ProcessMindClient, tenant_id: str, process_id: str, bpmn_xml: str) -> dict[str, Any]:
    return client.put(f"/v1/tenant/{tenant_id}/processes/{process_id}/bpmn", {"bpmnXml": bpmn_xml})


def download_bpmn(client: ProcessMindClient, tenant_id: str, process_id: str) -> dict[str, Any]:
    return client.get(f"/v1/tenant/{tenant_id}/processes/{process_id}/bpmn")


def main() -> None:
    client = ProcessMindClient()
    tenant_id = sys.argv[1] if len(sys.argv) > 1 else context_tenant_id()
    file_path = sys.argv[2] if len(sys.argv) > 2 else None

    process = create_process(client, tenant_id, "Demo — Order to cash")
    print(f"Process created: {process.get('displayName')} ({process.get('id')})")

    bpmn_xml = Path(file_path).read_text(encoding="utf-8") if file_path else sample_bpmn
    upload_bpmn(client, tenant_id, process["id"], bpmn_xml)
    print(f"Model uploaded from {file_path}" if file_path else "Sample model uploaded")

    stored = download_bpmn(client, tenant_id, process["id"])
    print(f"Model stored ({len(stored['bpmnXml'])} characters).")
    print(f"Next: load data and map it — python python/load_data.py {tenant_id} {process['id']}")


if __name__ == "__main__":
    try:
        main()
    except ProcessMindError as error:
        raise SystemExit(str(error)) from error
