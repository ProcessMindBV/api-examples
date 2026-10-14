// End-to-end: provision a customer tenant and hand it back ready to use.
//
//   1. provision the tenant under your organization        (organization key)
//   2. mint a tenant-scoped API key for it
//   3. create the first user (seat: designer)
//   4. load a BPMN model
//   5. upload an event log and map it to the model
//   6. mint a one-time login link for the user
//
//   node javascript/full-onboarding.mjs "Acme Corp"
//   node javascript/full-onboarding.mjs --cleanup <tenantId>   # soft delete
//
// The organization key needs read + write + uploadData. The tenant key created
// in step 2 gets read + write + uploadData + sessions so the demo can finish
// with a login link — in production, scope keys to exactly what they need.

import {
	ProcessMindClient,
	contextTenantId,
	runWhenMain,
	uploadContentToDatatable,
	waitForDatatableReady,
} from "./lib/processmind.mjs";
import { addUser } from "./add-users.mjs";
import { createProcess, sampleBpmn, uploadBpmn } from "./load-bpmn.mjs";
import { createDataset, createDatatable, mapDataToProcess, sampleCsv } from "./load-data.mjs";
import { mintLoginLink } from "./login-link.mjs";
import { createTenantApiKey, provisionTenant } from "./provision-tenant.mjs";

runWhenMain(import.meta.url, async () => {
	const context = contextTenantId();
	const orgClient = new ProcessMindClient();

	// Soft-delete a tenant this walkthrough created:
	//   node javascript/full-onboarding.mjs --cleanup <tenantId>
	const cleanupIndex = process.argv.indexOf("--cleanup");
	if (cleanupIndex !== -1) {
		const tenantId = process.argv[cleanupIndex + 1];
		if (!tenantId) throw new Error("Usage: node javascript/full-onboarding.mjs --cleanup <tenantId>");
		await orgClient.delete(`/v1/tenant/${context}/organization/tenants/${tenantId}`);
		console.log(`Tenant ${tenantId} deleted (soft). Restore inside the safety window:`);
		console.log(`  POST /v1/tenant/${context}/organization/tenants/${tenantId}/restore`);
		return;
	}

	const displayName = process.argv[2] ?? "Demo customer";
	const email = `demo-user-${Date.now()}@example.com`;

	console.log("1. Provisioning the tenant…");
	const tenant = await provisionTenant(orgClient, context, { displayName });
	console.log(`   ${tenant.displayName} (${tenant.id}) — ${tenant.url}`);

	console.log("2. Minting a tenant-scoped API key…");
	const key = await createTenantApiKey(orgClient, tenant.id, "onboarding demo key", {
		read: true,
		write: true,
		uploadData: true,
		sessions: true, // demo only: needed for the login link below
	});
	console.log(`   Key ${key.id} (secret received — shown once)`);

	// From here on, act as the customer's tenant with its own key.
	const client = new ProcessMindClient({ apiKey: key.secret });

	console.log("3. Creating the first user…");
	const user = await addUser(client, tenant.id, { email, firstName: "Demo", lastName: "User", access: "designer" });
	console.log(`   ${email} (${user.id})`);

	console.log("4. Loading a BPMN model…");
	const process = await createProcess(client, tenant.id, "Order to cash");
	await uploadBpmn(client, tenant.id, process.id, sampleBpmn);
	console.log(`   Process ${process.id}`);

	console.log("5. Loading data and mapping it to the model…");
	const dataset = await createDataset(client, tenant.id, "Demo — event logs");
	const datatable = await createDatatable(client, tenant.id, dataset.id, "Demo CSV");
	await uploadContentToDatatable(client, {
		tenantId: tenant.id,
		dataTableId: datatable.id,
		datasetId: dataset.id,
		fileName: "demo-event-log.csv",
		content: sampleCsv,
	});
	await waitForDatatableReady(client, tenant.id, datatable.id);
	const mapping = await mapDataToProcess(client, tenant.id, process.id, { dataTableId: datatable.id });
	console.log(`   Datatable ${datatable.id} mapped to ${process.id} (mapping ${mapping.id})`);

	console.log("6. Minting a one-time login link…");
	const link = await mintLoginLink(client, tenant.id, user.id, "app");
	console.log(`   ${link.url}`);
	console.log(`   Open it within ${link.expiresInSeconds} seconds (single use).`);

	console.log(`\nDone. The customer workspace is ready at ${tenant.url}`);
	console.log(`Teardown: node javascript/full-onboarding.mjs --cleanup ${tenant.id}`);
});
