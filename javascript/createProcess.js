const { createProcess, uploadBpmnFile } = require("./lib/ProcessMindApi.js");

async function main() {
	const config = {
		apiKey: "",      // Your API key
		tenantId: "",    // Your tenant ID
	};

	// Create a new process
	const process = await createProcess({
		...config,
		displayName: "My New Process"
	});
	console.log("Created process:", process);

	// Optionally upload a BPMN file to the process
	// await uploadBpmnFile({
	// 	...config,
	// 	processId: process.id,
	// 	filePath: "./my-process.bpmn"
	// });
	// console.log("BPMN uploaded successfully");
}

main().catch(console.error);
