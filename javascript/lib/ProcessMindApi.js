/**
 * Uploads a local CSV file to ProcessMind using a presigned URL.
 *
 * Steps:
 * 1. Fetch a presigned upload URL from the API.
 * 2. Read the local file from disk.
 * 3. Upload the file to the presigned URL using HTTP PUT.
 *
 * Configuration:
 * - Provide your API key, tenantId, datatableId, and filePath when calling uploadFileToProcessMind().
 * - The API base URL is set to https://api.processmind.com
 */

const fs = require("node:fs");

/**
 * Uploads a file to ProcessMind datatable using a presigned URL.
 * @param {string} apiKey - Your API key for authentication.
 * @param {string} tenantId - Your tenant identifier.
 * @param {string} datatableId - Your datatable identifier.
 * @param {string} filePath - Path to the file to upload.
 */

async function getApi({path, apiKey, apiUrl = "https://api.processmind.com"}) {
	try {
        const response = await fetch(`${apiUrl}${path}`, {
            method: "GET",
            headers: {
                "x-api-key": apiKey
            }
        });
        const body = await response.json();
        if (!response.ok) {
            console.error(`Error loading from API: ${response.status}, ${response.statusText}: ${body.message}`);
            return;
        }
        return body;
    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

async function getPresignedUploadUrl({apiKey, tenantId, datatableId, apiUrl = "https://api.processmind.com"}) {
	return (await getApi({apiKey, path: `/tenant/${tenantId}/datatable/${datatableId}/uploads/presignedurl`, apiUrl})).PreSignedUploadUrl;
}

async function getDatasets({apiKey, tenantId, apiUrl = "https://api.processmind.com"}) {
	return await getApi({apiKey, path: `/tenant/${tenantId}/datasets`, apiUrl});
}

async function getTenant({apiKey, tenantId, apiUrl = "https://api.processmind.com"}) {
	return await getApi({apiKey, path: `/tenant/${tenantId}`, apiUrl});
}

async function getOrganization({apiKey, tenantId, apiUrl = "https://api.processmind.com"}) {
	return await getApi({apiKey, path: `/tenant/${tenantId}/organization`, apiUrl});
}

async function uploadFile({apiKey, tenantId, datatableId, filePath, apiUrl = "https://api.processmind.com"}) {
    try {
        const uploadUrl = await getPresignedUploadUrl({apiKey, tenantId, datatableId, apiUrl});

		console.log("Uploading file...");
        fs.readFile(filePath, async (err, data) => {
            if (err) {
                console.error("Error reading file:", err);
                return;
            }
            try {
                const uploadRes = await fetch(uploadUrl, {
                    method: "PUT",
                    body: data
                });
                if (!uploadRes.ok) {
                    console.error("Upload failed:", uploadRes.status, uploadRes.statusText);
                } else {
                    console.log("File uploaded successfully.");
                }
            } catch (uploadErr) {
                console.error("Error uploading file:", uploadErr);
            }
        });
    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

// Export the function for use in other modules
module.exports = { 
	getPresignedUploadUrl,
	getDatasets,
	getTenant,
	getOrganization,
	uploadFile 
};
