# Recipes

Production-shaped tasks that a single example doesn’t cover. All routes are `/v1` on `https://api.processmind.com` with the usual `x-api-key` header.

Variables used below: `API`, `PROCESSMIND_API_KEY` and `PROCESSMIND_TENANT_ID` are set up in the [cheatsheet](../bash/curl-cheatsheet.md); `TENANT_ID` and `TENANT_KEY` refer to a provisioned **customer** tenant and its key (§2–3 of the cheatsheet).

## Rotate a tenant API key without downtime

```bash
# 1. List the tenant's keys (organization key needed)
curl -sS -H "x-api-key: $PROCESSMIND_API_KEY" "$API/v1/tenant/$TENANT_ID/api-keys" | jq .

# 2. Create the replacement with the same scopes
curl -sS -X POST "$API/v1/tenant/$TENANT_ID/api-keys" \
  -H "x-api-key: $PROCESSMIND_API_KEY" -H "Content-Type: application/json" \
  -d '{"displayName":"integration 2026-10","scope":{"read":true,"write":true,"uploadData":true,"sessions":false}}' | jq .

# 3. Deploy the new secret, then delete the old key — deletion is immediate
curl -sS -X DELETE "$API/v1/tenant/$TENANT_ID/api-keys/$OLD_KEY_ID" \
  -H "x-api-key: $PROCESSMIND_API_KEY" | jq .
```

Organization keys themselves are created and revoked in the app (*Settings → API Keys*).

## Snapshot a model before you overwrite it

`PUT /processes/{processId}/bpmn` **replaces** the current model. Snapshot first:

```bash
curl -sS -X POST "$API/v1/tenant/$TENANT_ID/processes/$PROCESS_ID/versions" \
  -H "x-api-key: $TENANT_KEY" -H "Content-Type: application/json" \
  -d '{"displayName":"before nightly sync","versionType":"manual"}' | jq .
```

The response is `{version, restoredFrom}`. To roll back, create a new version with `restoreFromVersionId` — history is never rewritten.

## Daily delta appends

Keep the datatable and append only new events instead of re-uploading history:

```bash
curl -sS -H "x-api-key: $TENANT_KEY" \
  "$API/v1/tenant/$TENANT_ID/datatables/$DATATABLE_ID/uploads/presigned-url?delta=true&filename=day-2.csv&filesize=123456&filelastmodified=$(date +%s000)" | jq .
```

- Omit `partnumber` to let the server reserve the next one; pass `&partnumber=N` when your pipeline tracks numbering itself — keep it monotonic.
- Delta uploads don’t need `datasetid` — the datatable already exists.

## Large uploads (multipart)

For multi-GB files, replace the single presigned PUT with:

```
POST .../uploads/multipart/initiate   → { uploadId, uploadHandle, partCount, partSizeBytes }
POST .../uploads/multipart/parts      → exchange for presigned part URLs
POST .../uploads/multipart/complete   → finalize; the pipeline starts
POST .../uploads/multipart/abort      → cancel and clean up
```

`initiate` takes `{fileName, fileSize, fileLastModified, datasetId, partCount? (default 10), delta?}` and returns an **opaque** `uploadHandle` + `uploadId` — pass those back, never an internal storage key. The exact part/complete payloads are in the [OpenAPI document](https://api.processmind.com/v1/openapi.json).

## Know when an upload has been processed

- **Production:** subscribe to the `data.ready` webhook (HMAC-signed; dedupe by `deliveryId`) — `POST /v1/tenant/{tenantId}/webhooks`.
- **Ad hoc:** poll `GET /v1/tenant/{tenantId}/datatables/{dataTableId}` and watch `hasDataLoaded` / `metaInfo` (the examples do this).

## Offboard a customer workspace

```bash
# Soft delete — API access stops immediately
curl -sS -X DELETE "$API/v1/tenant/$PROCESSMIND_TENANT_ID/organization/tenants/$TENANT_ID" \
  -H "x-api-key: $PROCESSMIND_API_KEY" | jq .

# Undo, inside the safety window
curl -sS -X POST "$API/v1/tenant/$PROCESSMIND_TENANT_ID/organization/tenants/$TENANT_ID/restore" \
  -H "x-api-key: $PROCESSMIND_API_KEY" -H "Content-Type: application/json" -d '{}' | jq .
```

After the window the automated full delete runs. The context tenant cannot delete itself.

## Seat-gate errors

| Code | Status | Meaning |
|---|---|---|
| `SEAT_LIMIT_EXCEEDED` | 409 | All paid seats are in use (requireCapacity policy) |
| `FREE_CAP` | 403 | The plan’s free capacity is exhausted |
| `FREE_USER_CAP` | 403 | E.g. Process Individual allows a single member |
| `VIEWER_ALLOWANCE` | 403 | The portal-viewer allowance is used up |
| `NO_SUBSCRIPTION` | 409 | The requested seat needs a subscription that isn’t active |

Check the contract’s capacity first: `GET /v1/tenant/{tenantId}/organization/billing/seats` (`contractType`, `freeViewerAllowance`, `inUseFree`, drift explainer).

## Pagination

List endpoints take `limit` (default 100, max 1000 — some lists 250) and `offset`, and return a bare JSON array. Page until the response is shorter than `limit`.
