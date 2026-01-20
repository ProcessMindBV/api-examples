const { createProcessMapping } = require("./lib/ProcessMindApi.js");

async function main() {
	const config = {
		apiKey: "",       // Your API key
		tenantId: "",     // Your tenant ID
	};

	// Map a datatable to a process
	// Note: The process must have a BPMN model uploaded first
	const mapping = await createProcessMapping({
		...config,
		processId: "",    // The process ID to map to
		dataTableId: "",  // The datatable ID to map
		displayName: "My Data",
		color: { id: "data-1" },  // Color options: "data-1" through "data-8"
		showByDefault: true
	});
	console.log("Mapping created:", mapping);
}

main().catch(console.error);
