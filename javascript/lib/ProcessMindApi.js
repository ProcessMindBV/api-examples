/**
 * ProcessMind API Client Library
 */

const fs = require("node:fs");

const DEFAULT_API_URL = "https://api.processmind.com";

async function getApi({ path, apiKey, apiUrl = DEFAULT_API_URL }) {
	try {
		const response = await fetch(`${apiUrl}${path}`, {
			method: "GET",
			headers: { "x-api-key": apiKey }
		});
		const body = await response.json();
		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}: ${body.message || JSON.stringify(body)}`);
		}
		return body;
	} catch (err) {
		if (err.message.startsWith("API Error:")) throw err;
		throw new Error(`Unexpected error: ${err.message}`);
	}
}

async function postApi({ path, apiKey, body, apiUrl = DEFAULT_API_URL }) {
	try {
		const response = await fetch(`${apiUrl}${path}`, {
			method: "POST",
			headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
			body: JSON.stringify(body)
		});
		const responseBody = await response.json();
		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}: ${responseBody.message || JSON.stringify(responseBody)}`);
		}
		return responseBody;
	} catch (err) {
		if (err.message.startsWith("API Error:")) throw err;
		throw new Error(`Unexpected error: ${err.message}`);
	}
}

async function putApi({ path, apiKey, body, apiUrl = DEFAULT_API_URL }) {
	try {
		const response = await fetch(`${apiUrl}${path}`, {
			method: "PUT",
			headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
			body: JSON.stringify(body)
		});
		const responseBody = await response.json();
		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}: ${responseBody.message || JSON.stringify(responseBody)}`);
		}
		return responseBody;
	} catch (err) {
		if (err.message.startsWith("API Error:")) throw err;
		throw new Error(`Unexpected error: ${err.message}`);
	}
}

async function deleteApi({ path, apiKey, body, apiUrl = DEFAULT_API_URL }) {
	try {
		const options = {
			method: "DELETE",
			headers: { "x-api-key": apiKey }
		};
		if (body) {
			options.headers["Content-Type"] = "application/json";
			options.body = JSON.stringify(body);
		}
		const response = await fetch(`${apiUrl}${path}`, options);
		const responseBody = await response.json();
		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}: ${responseBody.message || JSON.stringify(responseBody)}`);
		}
		return responseBody;
	} catch (err) {
		if (err.message.startsWith("API Error:")) throw err;
		throw new Error(`Unexpected error: ${err.message}`);
	}
}

// Tenant Functions
async function getTenant({ apiKey, tenantId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}`, apiUrl });
}

async function updateTenant({ apiKey, tenantId, displayName, apiUrl = DEFAULT_API_URL }) {
	return await putApi({ apiKey, path: `/tenant/${tenantId}`, body: { displayName }, apiUrl });
}

async function getTenantStatistics({ apiKey, tenantId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/statistics`, apiUrl });
}

// Tenant Users Functions
async function getTenantUsers({ apiKey, tenantId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/users`, apiUrl });
}

async function addTenantUser({ apiKey, tenantId, email, firstName = null, lastName = null, isActiveInTenant = true, isAdminInTenant = false, isDeveloperInTenant = false, apiUrl = DEFAULT_API_URL }) {
	// Note: The API generates and returns the user ID
	return await postApi({
		apiKey,
		path: `/tenant/${tenantId}/users`,
		body: { email, firstName, lastName, isActiveInTenant, isAdminInTenant, isDeveloperInTenant },
		apiUrl
	});
}

async function updateTenantUser({ apiKey, tenantId, userId, isActiveInTenant, isAdminInTenant, isDeveloperInTenant, apiUrl = DEFAULT_API_URL }) {
	const body = { userId, tenantId };
	if (isActiveInTenant !== undefined) body.isActiveInTenant = isActiveInTenant;
	if (isAdminInTenant !== undefined) body.isAdminInTenant = isAdminInTenant;
	if (isDeveloperInTenant !== undefined) body.isDeveloperInTenant = isDeveloperInTenant;
	return await putApi({ apiKey, path: `/tenant/${tenantId}/users`, body, apiUrl });
}

async function removeTenantUser({ apiKey, tenantId, userId, apiUrl = DEFAULT_API_URL }) {
	return await deleteApi({ apiKey, path: `/tenant/${tenantId}/users`, body: { userId, tenantId }, apiUrl });
}

// Process Functions
async function getProcesses({ apiKey, tenantId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/processes`, apiUrl });
}

async function createProcess({ apiKey, tenantId, displayName, treeParentId = null, apiUrl = DEFAULT_API_URL }) {
	return await postApi({
		apiKey,
		path: `/tenant/${tenantId}/processes`,
		body: { displayName, treeParentId, treeNodeType: "Process" },
		apiUrl
	});
}

async function getProcess({ apiKey, tenantId, processId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/processes/${processId}`, apiUrl });
}

async function updateProcess({ apiKey, tenantId, processId, displayName, treeParentId, apiUrl = DEFAULT_API_URL }) {
	const body = {};
	if (displayName !== undefined) body.displayName = displayName;
	if (treeParentId !== undefined) body.treeParentId = treeParentId;
	return await putApi({ apiKey, path: `/tenant/${tenantId}/processes/${processId}`, body, apiUrl });
}

async function deleteProcess({ apiKey, tenantId, processId, apiUrl = DEFAULT_API_URL }) {
	return await deleteApi({ apiKey, path: `/tenant/${tenantId}/processes/${processId}`, apiUrl });
}

async function uploadBpmn({ apiKey, tenantId, processId, bpmnXml, apiUrl = DEFAULT_API_URL }) {
	return await putApi({
		apiKey,
		path: `/tenant/${tenantId}/processes/${processId}/bpmn`,
		body: { bpmnXml },
		apiUrl
	});
}

async function uploadBpmnFile({ apiKey, tenantId, processId, filePath, apiUrl = DEFAULT_API_URL }) {
	const bpmnXml = fs.readFileSync(filePath, "utf8");
	return await uploadBpmn({ apiKey, tenantId, processId, bpmnXml, apiUrl });
}

// Process Data Mapping Functions
async function getProcessMappings({ apiKey, tenantId, processId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/processes/${processId}/mappings`, apiUrl });
}

async function createProcessMapping({ apiKey, tenantId, processId, dataTableId, displayName = null, color = { id: "data-1" }, showByDefault = true, apiUrl = DEFAULT_API_URL }) {
	return await postApi({
		apiKey,
		path: `/tenant/${tenantId}/processes/${processId}/mappings`,
		body: { dataTableId, displayName, color, showByDefault },
		apiUrl
	});
}

async function updateProcessMapping({ apiKey, tenantId, processId, mappingId, displayName, color, showByDefault, apiUrl = DEFAULT_API_URL }) {
	const body = {};
	if (displayName !== undefined) body.displayName = displayName;
	if (color !== undefined) body.color = color;
	if (showByDefault !== undefined) body.showByDefault = showByDefault;
	return await putApi({ apiKey, path: `/tenant/${tenantId}/processes/${processId}/mappings/${mappingId}`, body, apiUrl });
}

async function deleteProcessMapping({ apiKey, tenantId, processId, mappingId, apiUrl = DEFAULT_API_URL }) {
	return await deleteApi({ apiKey, path: `/tenant/${tenantId}/processes/${processId}/mappings/${mappingId}`, apiUrl });
}

// Dataset Functions
async function getDatasets({ apiKey, tenantId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/datasets`, apiUrl });
}

async function createDataset({ apiKey, tenantId, displayName, treeParentId = null, apiUrl = DEFAULT_API_URL }) {
	return await postApi({
		apiKey,
		path: `/tenant/${tenantId}/datasets`,
		body: { displayName, treeParentId, treeNodeType: "Dataset" },
		apiUrl
	});
}

async function getDataset({ apiKey, tenantId, datasetId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/datasets/${datasetId}`, apiUrl });
}

async function deleteDataset({ apiKey, tenantId, datasetId, apiUrl = DEFAULT_API_URL }) {
	return await deleteApi({ apiKey, path: `/tenant/${tenantId}/datasets/${datasetId}`, apiUrl });
}

// Datatable Functions
async function getDatatables({ apiKey, tenantId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/datatables`, apiUrl });
}

async function createDatatable({ apiKey, tenantId, datasetId, displayName, apiUrl = DEFAULT_API_URL }) {
	return await postApi({
		apiKey,
		path: `/tenant/${tenantId}/datasets/${datasetId}/datatables`,
		body: { displayName },
		apiUrl
	});
}

async function getDatatable({ apiKey, tenantId, datatableId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/datatable/${datatableId}`, apiUrl });
}

async function getPresignedUploadUrl({ apiKey, tenantId, datatableId, datasetId, fileName, fileSize, fileLastModified, validForSeconds, apiUrl = DEFAULT_API_URL }) {
	const params = new URLSearchParams({
		datasetid: datasetId,
		filename: fileName,
		filesize: String(fileSize),
		filelastmodified: String(fileLastModified)
	});
	if (validForSeconds) params.append("validforseconds", String(validForSeconds));
	const response = await getApi({ apiKey, path: `/tenant/${tenantId}/datatable/${datatableId}/uploads/presignedurl?${params.toString()}`, apiUrl });
	return response.PreSignedUploadUrl;
}

async function uploadFile({ apiKey, tenantId, datatableId, datasetId, filePath, apiUrl = DEFAULT_API_URL }) {
	const stats = fs.statSync(filePath);
	const fileName = require("node:path").basename(filePath);
	const uploadUrl = await getPresignedUploadUrl({
		apiKey,
		tenantId,
		datatableId,
		datasetId,
		fileName,
		fileSize: stats.size,
		fileLastModified: stats.mtimeMs,
		apiUrl
	});
	console.log("Uploading file...");
	const data = fs.readFileSync(filePath);
	const uploadRes = await fetch(uploadUrl, { method: "PUT", body: data });
	if (!uploadRes.ok) {
		throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
	}
	console.log("File uploaded successfully.");
	return { success: true };
}

// Organization Functions
async function getOrganization({ apiKey, tenantId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/organization`, apiUrl });
}

async function getOrganizationStatistics({ apiKey, tenantId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/organization/statistics`, apiUrl });
}

async function getOrganizationTenants({ apiKey, tenantId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/organization/tenants`, apiUrl });
}

async function createOrganizationTenant({ apiKey, tenantId, shortName, displayName, apiUrl = DEFAULT_API_URL }) {
	return await postApi({
		apiKey,
		path: `/tenant/${tenantId}/organization/tenants`,
		body: { shortName, displayName },
		apiUrl
	});
}

async function deleteOrganizationTenant({ apiKey, tenantId, targetTenantId, apiUrl = DEFAULT_API_URL }) {
	return await deleteApi({ apiKey, path: `/tenant/${tenantId}/organization/tenants/${targetTenantId}`, apiUrl });
}

async function getOrganizationUsers({ apiKey, tenantId, apiUrl = DEFAULT_API_URL }) {
	return await getApi({ apiKey, path: `/tenant/${tenantId}/organization/users`, apiUrl });
}

async function updateOrganizationUser({ apiKey, tenantId, userId, isActiveInOrganization, isAdminInOrganization, apiUrl = DEFAULT_API_URL }) {
	const body = { userId };
	if (isActiveInOrganization !== undefined) body.isActiveInOrganization = isActiveInOrganization;
	if (isAdminInOrganization !== undefined) body.isAdminInOrganization = isAdminInOrganization;
	return await putApi({ apiKey, path: `/tenant/${tenantId}/organization/users`, body, apiUrl });
}

async function removeOrganizationUser({ apiKey, tenantId, userId, apiUrl = DEFAULT_API_URL }) {
	return await deleteApi({ apiKey, path: `/tenant/${tenantId}/organization/users`, body: { userId }, apiUrl });
}

module.exports = {
	getTenant, updateTenant, getTenantStatistics,
	getTenantUsers, addTenantUser, updateTenantUser, removeTenantUser,
	getProcesses, createProcess, getProcess, updateProcess, deleteProcess, uploadBpmn, uploadBpmnFile,
	getProcessMappings, createProcessMapping, updateProcessMapping, deleteProcessMapping,
	getDatasets, createDataset, getDataset, deleteDataset,
	getDatatables, createDatatable, getDatatable, getPresignedUploadUrl, uploadFile,
	getOrganization, getOrganizationStatistics, getOrganizationTenants, createOrganizationTenant, deleteOrganizationTenant,
	getOrganizationUsers, updateOrganizationUser, removeOrganizationUser,
	uploadFileToProcessMind: uploadFile
};
