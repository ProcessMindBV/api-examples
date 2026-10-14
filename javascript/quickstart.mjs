// Quickstart — prove your key works by reading the workspace and its processes.
//
//   export PROCESSMIND_API_KEY="pm-…"
//   export PROCESSMIND_TENANT_ID="<tenant id>"
//   node javascript/quickstart.mjs

import { ProcessMindClient, contextTenantId, runWhenMain } from "./lib/processmind.mjs";

export async function quickstart(client, tenantId) {
	const tenant = await client.get(`/v1/tenant/${tenantId}`);
	console.log(`Workspace:    ${tenant.displayName} (${tenant.id})`);
	console.log(`Organization: ${tenant.organizationId}`);
	console.log(`URL:          ${tenant.url}`);

	const processes = await client.get(`/v1/tenant/${tenantId}/processes`);
	console.log(`\nProcesses: ${processes.length}`);
	for (const process of processes.slice(0, 5)) {
		console.log(`  · ${process.displayName} — ${process.id}`);
	}
	if (processes.length > 5) console.log(`  … and ${processes.length - 5} more`);

	return { tenant, processes };
}

runWhenMain(import.meta.url, async () => {
	await quickstart(new ProcessMindClient(), contextTenantId());
});
