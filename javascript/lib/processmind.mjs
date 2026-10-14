// Minimal zero-dependency client for the ProcessMind External API (v1).
//
// Documentation: https://processmind.com/resources/docs/api
// Public spec:   https://api.processmind.com/v1/openapi.json
//
// Everything here is a thin wrapper around fetch — no packages to install.

import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { pathToFileURL } from "node:url";

export const defaultBaseUrl = "https://api.processmind.com";

export class ProcessMindError extends Error {
	constructor(status, body, method, path) {
		const message = typeof body?.message === "string" ? body.message : typeof body === "string" ? body : "";
		super(`${method} ${path} failed with ${status}${message ? `: ${message}` : ""}`);
		this.name = "ProcessMindError";
		this.status = status;
		this.code = body?.code;
		this.body = body;
	}
}

export class ProcessMindClient {
	constructor({ apiKey, baseUrl } = {}) {
		this.apiKey = apiKey ?? requiredEnv("PROCESSMIND_API_KEY");
		this.baseUrl = (baseUrl ?? process.env.PROCESSMIND_API_URL ?? defaultBaseUrl).replace(/\/+$/, "");
	}

	async request(method, path, body) {
		const response = await fetch(`${this.baseUrl}${path}`, {
			method,
			headers: {
				"x-api-key": this.apiKey,
				...(body === undefined ? {} : { "Content-Type": "application/json" }),
			},
			body: body === undefined ? undefined : JSON.stringify(body),
		});

		const text = await response.text();
		let parsed;
		try {
			parsed = text === "" ? undefined : JSON.parse(text);
		} catch {
			parsed = text;
		}

		if (!response.ok) throw new ProcessMindError(response.status, parsed, method, path);
		return parsed;
	}

	get(path) {
		return this.request("GET", path);
	}

	post(path, body) {
		return this.request("POST", path, body);
	}

	put(path, body) {
		return this.request("PUT", path, body);
	}

	delete(path, body) {
		return this.request("DELETE", path, body);
	}
}

export function requiredEnv(name) {
	const value = process.env[name];
	if (!value) {
		console.error(`Missing environment variable ${name}. See the README → "Configuration".`);
		process.exit(1);
	}
	return value;
}

// The tenant a key acts on: your own workspace, or — for organization calls —
// the context tenant the organization key is used with.
export function contextTenantId() {
	return requiredEnv("PROCESSMIND_TENANT_ID");
}

// Runs `main` only when the file is executed directly (`node file.mjs`), so the
// same file can be imported by the full-onboarding walkthrough.
export function runWhenMain(moduleUrl, main) {
	if (process.argv[1] && moduleUrl === pathToFileURL(process.argv[1]).href) {
		main().catch((error) => {
			console.error(error.message);
			process.exit(1);
		});
	}
}

// Uploads content to a datatable through a presigned URL (uploadData scope).
// For multi-GB files use the multipart endpoints — see docs/recipes.md.
export async function uploadContentToDatatable(client, { tenantId, dataTableId, datasetId, fileName, content, fileLastModified = Date.now() }) {
	const query = new URLSearchParams({
		datasetid: datasetId,
		filename: fileName,
		filesize: String(Buffer.byteLength(content)),
		filelastmodified: String(Math.trunc(fileLastModified)),
	});

	const { PreSignedUploadUrl } = await client.get(
		`/v1/tenant/${tenantId}/datatables/${dataTableId}/uploads/presigned-url?${query}`,
	);

	const upload = await fetch(PreSignedUploadUrl, { method: "PUT", body: content });
	if (!upload.ok) throw new Error(`Upload failed with ${upload.status} ${upload.statusText}`);
	return { fileName, bytes: Buffer.byteLength(content) };
}

export async function uploadFileToDatatable(client, { tenantId, dataTableId, datasetId, filePath }) {
	const [content, info] = await Promise.all([readFile(filePath), stat(filePath)]);
	return await uploadContentToDatatable(client, {
		tenantId,
		dataTableId,
		datasetId,
		fileName: basename(filePath),
		content,
		fileLastModified: info.mtimeMs,
	});
}

// Waits until the datatable pipeline has processed the upload. In production,
// prefer the `data.ready` webhook over polling (see docs/recipes.md).
export async function waitForDatatableReady(client, tenantId, dataTableId, { attempts = 60, delayMs = 2000 } = {}) {
	for (let attempt = 1; attempt <= attempts; attempt++) {
		const datatable = await client.get(`/v1/tenant/${tenantId}/datatables/${dataTableId}`);
		if (datatable.metaInfo?.type === "error") throw new Error(`Data import failed (datatable ${dataTableId})`);
		if (datatable.hasDataLoaded) return datatable;
		await new Promise((resolve) => setTimeout(resolve, delayMs));
	}
	throw new Error(`Timed out waiting for datatable ${dataTableId} to process`);
}
