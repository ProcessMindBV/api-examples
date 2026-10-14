// Load an event log and connect it to a process.
//
//   node javascript/load-data.mjs [tenantId] [processId]
//
//   1. create a dataset + datatable
//   2. upload a CSV through a presigned URL — the pipeline processes it
//      automatically (production systems should listen to the `data.ready`
//      webhook instead of polling, see docs/recipes.md)
//   3. map the datatable to the process → intended vs actual in the app
//
// Scopes: uploadData (upload) + write (create/map).

import {
	ProcessMindClient,
	contextTenantId,
	runWhenMain,
	uploadContentToDatatable,
	waitForDatatableReady,
} from "./lib/processmind.mjs";

export const sampleCsv = `case_id,activity,timestamp
case001,Order received,2024-01-01T09:00:00Z
case001,Process order,2024-01-01T10:00:00Z
case001,Ship order,2024-01-01T12:00:00Z
case001,Order fulfilled,2024-01-01T13:00:00Z
case002,Order received,2024-01-02T09:00:00Z
case002,Process order,2024-01-02T11:00:00Z
case002,Ship order,2024-01-02T15:00:00Z
case002,Order fulfilled,2024-01-02T16:00:00Z
`;

export async function createDataset(client, tenantId, displayName) {
	return await client.post(`/v1/tenant/${tenantId}/datasets`, { displayName, treeNodeType: "Dataset" });
}

export async function createDatatable(client, tenantId, datasetId, displayName) {
	return await client.post(`/v1/tenant/${tenantId}/datasets/${datasetId}/datatables`, { displayName });
}

export async function mapDataToProcess(client, tenantId, processId, { dataTableId, displayName = "Uploaded data", color = "data-1", showByDefault = true }) {
	// `color` is one of "data-1" … "data-8". The process must have a model.
	// `mappingRole` ("primary" | "comparison") defaults to "comparison".
	return await client.post(`/v1/tenant/${tenantId}/processes/${processId}/mappings`, {
		dataTableId,
		displayName,
		color: { id: color },
		showByDefault,
	});
}

runWhenMain(import.meta.url, async () => {
	const client = new ProcessMindClient();
	const tenantId = process.argv[2] ?? contextTenantId();
	const processId = process.argv[3] ?? process.env.PROCESSMIND_PROCESS_ID;

	const dataset = await createDataset(client, tenantId, "Demo — event logs");
	const datatable = await createDatatable(client, tenantId, dataset.id, "Demo CSV");
	console.log(`Dataset created:   ${dataset.id}`);
	console.log(`Datatable created: ${datatable.id}`);

	const upload = await uploadContentToDatatable(client, {
		tenantId,
		dataTableId: datatable.id,
		datasetId: dataset.id,
		fileName: "demo-event-log.csv",
		content: sampleCsv,
	});
	console.log(`Uploaded ${upload.fileName} (${upload.bytes} bytes) — waiting for the pipeline…`);

	await waitForDatatableReady(client, tenantId, datatable.id);
	console.log("Data processed.");

	if (processId) {
		const mapping = await mapDataToProcess(client, tenantId, processId, { dataTableId: datatable.id });
		console.log(`Mapped to process ${processId} (mapping ${mapping.id}) — open the process in the app for intended vs actual.`);
	} else {
		console.log("Tip: pass a process id as the second argument (or set PROCESSMIND_PROCESS_ID) to map this data to a model.");
	}
});
