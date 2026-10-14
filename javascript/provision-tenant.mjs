// Provision a customer tenant under your organization, and mint a
// tenant-scoped API key for it.
//
//   node javascript/provision-tenant.mjs "Acme Corp"
//
// Needs an ORGANIZATION key (created in the app under Settings → API Keys).
//
// Notes
// - `shortName` is the tenant's subdomain (https://<shortName>.processmind.com).
//   It must be unique; reserved or duplicate names are rejected with 406. The
//   default below suffixes a timestamp so reruns don't collide.
// - Tenant creation follows your plan allowance (partner organizations are
//   uncapped) and provisions a complete, isolated database.
// - The tenant key's secret is returned ONCE. Store it in a secret manager.

import { ProcessMindClient, contextTenantId, runWhenMain } from "./lib/processmind.mjs";

export async function provisionTenant(client, contextTenantId, { displayName, shortName } = {}) {
	const body = { shortName: shortName ?? `demo-${Date.now().toString(36)}` };
	if (displayName) body.displayName = displayName;
	return await client.post(`/v1/tenant/${contextTenantId}/organization/tenants`, body);
}

export async function createTenantApiKey(client, tenantId, displayName, scope) {
	const body = { displayName };
	// Grant `sessions` only if this tenant's key must mint login links.
	if (scope) body.scope = scope;
	return await client.post(`/v1/tenant/${tenantId}/api-keys`, body);
}

runWhenMain(import.meta.url, async () => {
	const client = new ProcessMindClient();
	const displayName = process.argv[2] ?? "Demo customer";

	const tenant = await provisionTenant(client, contextTenantId(), { displayName });
	console.log(`Tenant created: ${tenant.displayName} (${tenant.id})`);
	console.log(`URL:            ${tenant.url}`);

	const key = await createTenantApiKey(client, tenant.id, "demo tenant key");
	console.log(`Tenant key:     ${key.id}`);
	console.log(`Secret (shown once — save it now): ${key.secret}`);

	console.log(`\nUse the tenant key for tenant-scoped calls, e.g. node javascript/add-users.mjs ${tenant.id}`);
});
