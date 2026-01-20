const { uploadBpmnFile } = require("./lib/ProcessMindApi.js");

async function main() {
	const config = {
		apiKey: "",       // Your API key
		tenantId: "",     // Your tenant ID
	};

	// Upload BPMN file to a process
	const result = await uploadBpmnFile({
		...config,
		processId: "",    // The process ID to upload BPMN to
		filePath: ""      // Path to your .bpmn file
	});
	console.log("BPMN uploaded:", result);
}

main().catch(console.error);
