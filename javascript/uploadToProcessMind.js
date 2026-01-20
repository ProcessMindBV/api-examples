const { uploadFileToProcessMind } = require("./lib/ProcessMindApi.js");

uploadFileToProcessMind({
	apiKey: "",        // Your API key
	tenantId: "",      // Your tenant ID
	datatableId: "",   // The datatable ID to upload to
	datasetId: "",     // The dataset ID (required for presigned URL)
	filePath: ""       // Path to the file to upload
});

// Call using: node uploadToProcessMind.js