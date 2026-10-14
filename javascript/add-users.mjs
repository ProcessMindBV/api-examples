// Create users and assign seats. No invitation email is sent by the API —
// hand the user a one-time login link (see login-link.mjs) or invite them
// your own way.
//
//   node javascript/add-users.mjs [tenantId]
//
// Seats (`access`): none | portalViewer | designer | architect | intelligence
// `isDashboardViewer` is a boolean for read-only dashboard access — not a seat.
//
// Seat capacity is enforced per contract: organizations with the
// `requireCapacity` policy answer with 409 SEAT_LIMIT_EXCEEDED, 403 FREE_CAP or
// 403 FREE_USER_CAP instead of silently exceeding the paid seats.

import { ProcessMindClient, contextTenantId, runWhenMain } from "./lib/processmind.mjs";

export async function addUser(client, tenantId, { email, firstName, lastName, access = "designer", isDashboardViewer = false, isAdminInTenant = false }) {
	return await client.post(`/v1/tenant/${tenantId}/users`, {
		email,
		firstName,
		lastName,
		isActiveInTenant: true,
		isAdminInTenant,
		access,
		isDashboardViewer,
	});
}

export async function listUsers(client, tenantId) {
	return await client.get(`/v1/tenant/${tenantId}/users`);
}

runWhenMain(import.meta.url, async () => {
	const client = new ProcessMindClient();
	const tenantId = process.argv[2] ?? contextTenantId();

	const email = `demo-user-${Date.now()}@example.com`;
	const user = await addUser(client, tenantId, { email, firstName: "Demo", lastName: "User" });
	console.log(`User created: ${email} → ${user.id}`);

	const users = await listUsers(client, tenantId);
	console.log(`Users in tenant: ${users.length}`);
});
