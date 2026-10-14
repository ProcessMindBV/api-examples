// Mint a one-time login link ("Open in ProcessMind").
//
//   node javascript/login-link.mjs [userId] [app/path]
//
// Requires a key with the `sessions` scope (off by default). The returned URL
// logs the user in WITHOUT a password: single use, valid for 60 seconds,
// audited, and void as soon as the key is disabled or the user is deactivated.
// Treat it as a password: hand it straight to the user's browser, never log
// or store it, and never mint it from browser-side code.

import { ProcessMindClient, contextTenantId, requiredEnv, runWhenMain } from "./lib/processmind.mjs";

export async function mintLoginLink(client, tenantId, userId, path) {
	return await client.post(`/v1/tenant/${tenantId}/users/${userId}/login-token`, path ? { path } : {});
}

runWhenMain(import.meta.url, async () => {
	const client = new ProcessMindClient();
	const userId = process.argv[2] ?? requiredEnv("PROCESSMIND_USER_ID");
	const path = process.argv[3] ?? "app";

	const link = await mintLoginLink(client, contextTenantId(), userId, path);
	console.log(`Login URL (single use, expires in ${link.expiresInSeconds} seconds):`);
	console.log(link.url);
	console.log("Send the user's browser there now — do not log or store this URL.");
});
