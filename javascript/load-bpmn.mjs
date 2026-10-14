// Create a process and load a BPMN 2.0 model into it.
//
//   node javascript/load-bpmn.mjs [tenantId] [path/to/model.bpmn]
//
// Without a file path a small sample model is uploaded. Uploading a model
// REPLACES the process's current model — snapshot a version first if you
// overwrite on a schedule (see docs/recipes.md).

import { readFile } from "node:fs/promises";

import { ProcessMindClient, contextTenantId, runWhenMain } from "./lib/processmind.mjs";

export const sampleBpmn = `<?xml version="1.0" encoding="UTF-8"?>
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
</bpmn:definitions>`;

export async function createProcess(client, tenantId, displayName, { treeParentId } = {}) {
	const body = { displayName, treeNodeType: "Process" };
	if (treeParentId) body.treeParentId = treeParentId;
	return await client.post(`/v1/tenant/${tenantId}/processes`, body);
}

export async function uploadBpmn(client, tenantId, processId, bpmnXml) {
	return await client.put(`/v1/tenant/${tenantId}/processes/${processId}/bpmn`, { bpmnXml });
}

export async function downloadBpmn(client, tenantId, processId) {
	return await client.get(`/v1/tenant/${tenantId}/processes/${processId}/bpmn`);
}

runWhenMain(import.meta.url, async () => {
	const client = new ProcessMindClient();
	const tenantId = process.argv[2] ?? contextTenantId();
	const filePath = process.argv[3];

	const process = await createProcess(client, tenantId, "Demo — Order to cash");
	console.log(`Process created: ${process.displayName} (${process.id})`);

	const bpmnXml = filePath ? await readFile(filePath, "utf8") : sampleBpmn;
	await uploadBpmn(client, tenantId, process.id, bpmnXml);
	console.log(filePath ? `Model uploaded from ${filePath}` : "Sample model uploaded");

	const stored = await downloadBpmn(client, tenantId, process.id);
	console.log(`Model stored (${stored.bpmnXml.length} characters).`);
	console.log(`Next: load data and map it — node javascript/load-data.mjs ${tenantId} ${process.id}`);
});
