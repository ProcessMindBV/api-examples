const { addTenantUser } = require("./lib/ProcessMindApi.js");

async function main() {
	const config = {
		apiKey: "",      // Your API key
		tenantId: "",    // Your tenant ID
	};

	// Add a user to the tenant
	// The API generates and returns the user ID
	const result = await addTenantUser({
		...config,
		email: "user@example.com",
		firstName: "John",               // Optional
		lastName: "Doe",                 // Optional
		isActiveInTenant: true,          // User is active in this tenant
		isAdminInTenant: false,          // User is not an admin
		isDeveloperInTenant: false       // User is not a developer
	});
	console.log("User added:", result);
	console.log("New user ID:", result.id);
}

main().catch(console.error);
