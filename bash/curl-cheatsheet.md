# curl cheatsheet — the v1 API in copy-paste commands

Set these once (the examples below reuse the variables):

```bash
export PROCESSMIND_API_KEY="pm-…"           # organization or tenant key
export PROCESSMIND_TENANT_ID="<tenant id>"  # your workspace (context tenant for org calls)
export API="${PROCESSMIND_API_URL:-https://api.processmind.com}"
```

Every request authenticates with `-H "x-api-key: $PROCESSMIND_API_KEY"`. The public OpenAPI document needs no key:

```bash
curl -sS "$API/v1/openapi.json" | jq '.info'
```

The values in `<>` are placeholders — replace them as you go (or export them, like `TENANT_ID` below).

## 1. Read your workspace and processes — scope: read

```bash
curl -sS -H "x-api-key: $PROCESSMIND_API_KEY" "$API/v1/tenant/$PROCESSMIND_TENANT_ID" | jq .

curl -sS -H "x-api-key: $PROCESSMIND_API_KEY" "$API/v1/tenant/$PROCESSMIND_TENANT_ID/processes" | jq .
```

## 2. Provision a customer tenant — organization key, scope: write

`shortName` becomes the subdomain (`https://<shortName>.processmind.com`) and must be unique (406 if reserved or taken).

```bash
curl -sS -X POST "$API/v1/tenant/$PROCESSMIND_TENANT_ID/organization/tenants" \
  -H "x-api-key: $PROCESSMIND_API_KEY" -H "Content-Type: application/json" \
  -d '{"shortName":"acme-demo","displayName":"Acme (demo)"}' | tee /tmp/tenant.json | jq .

TENANT_ID=$(jq -r .id /tmp/tenant.json)
```

## 3. Mint a tenant API key for the new tenant — organization key

The secret is returned **once** — store it in your secret manager, never in a script.

```bash
curl -sS -X POST "$API/v1/tenant/$TENANT_ID/api-keys" \
  -H "x-api-key: $PROCESSMIND_API_KEY" -H "Content-Type: application/json" \
  -d '{"displayName":"acme tenant key"}' | tee /tmp/key.json | jq .

TENANT_KEY=$(jq -r .secret /tmp/key.json)
```

From here on you can use either the organization key or the new tenant key (shown as `$TENANT_KEY`).

## 4. Create a user — scope: write

Seats (`access`): `none`, `portalViewer`, `designer`, `architect`, `intelligence`. `isDashboardViewer` is a separate boolean. No invitation email is sent — hand the user a login link (§8).

```bash
curl -sS -X POST "$API/v1/tenant/$TENANT_ID/users" \
  -H "x-api-key: $TENANT_KEY" -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","firstName":"Demo","lastName":"User","isActiveInTenant":true,"access":"designer","isDashboardViewer":true}' | jq .
```

## 5. Create a process and upload a BPMN model — scope: write

Uploading a model **replaces** the current one — snapshot a version first when overwriting on a schedule (see [docs/recipes.md](../docs/recipes.md)).

```bash
PROCESS_ID=$(curl -sS -X POST "$API/v1/tenant/$TENANT_ID/processes" \
  -H "x-api-key: $TENANT_KEY" -H "Content-Type: application/json" \
  -d '{"displayName":"Order to cash","treeNodeType":"Process"}' | jq -r .id)

curl -sS -X PUT "$API/v1/tenant/$TENANT_ID/processes/$PROCESS_ID/bpmn" \
  -H "x-api-key: $TENANT_KEY" -H "Content-Type: application/json" \
  -d "$(jq -n --rawfile bpmn ./order-to-cash.bpmn '{bpmnXml: $bpmn}')" | jq .
```

## 6. Load data — scope: uploadData

```bash
DATASET_ID=$(curl -sS -X POST "$API/v1/tenant/$TENANT_ID/datasets" \
  -H "x-api-key: $TENANT_KEY" -H "Content-Type: application/json" \
  -d '{"displayName":"Acme event logs","treeNodeType":"Dataset"}' | jq -r .id)

DATATABLE_ID=$(curl -sS -X POST "$API/v1/tenant/$TENANT_ID/datasets/$DATASET_ID/datatables" \
  -H "x-api-key: $TENANT_KEY" -H "Content-Type: application/json" \
  -d '{"displayName":"ERP export"}' | jq -r .id)

FILE=./event-log.csv
PRESIGNED=$(curl -sS -H "x-api-key: $TENANT_KEY" \
  "$API/v1/tenant/$TENANT_ID/datatables/$DATATABLE_ID/uploads/presigned-url?datasetid=$DATASET_ID&filename=$(basename "$FILE")&filesize=$(stat -c%s "$FILE")&filelastmodified=$(date +%s000)" | jq -r .PreSignedUploadUrl)

curl -sS -X PUT -T "$FILE" "$PRESIGNED"
echo "uploaded — the pipeline processes it automatically"
```

The datatable reports progress via `hasDataLoaded` / `metaInfo`; production systems should subscribe to the `data.ready` webhook instead of polling.

## 7. Map the data to the model — scope: write

```bash
curl -sS -X POST "$API/v1/tenant/$TENANT_ID/processes/$PROCESS_ID/mappings" \
  -H "x-api-key: $TENANT_KEY" -H "Content-Type: application/json" \
  -d "{\"dataTableId\":\"$DATATABLE_ID\",\"displayName\":\"ERP actuals\",\"color\":{\"id\":\"data-1\"},\"showByDefault\":true}" | jq .
```

## 8. Mint a one-time login link — scope: sessions

Single use, valid for 60 seconds, password-equivalent: hand it straight to the user's browser, never log it. Requires a key created with the `sessions` scope.

```bash
USER_ID=<user id from §4>

curl -sS -X POST "$API/v1/tenant/$TENANT_ID/users/$USER_ID/login-token" \
  -H "x-api-key: $TENANT_KEY" -H "Content-Type: application/json" \
  -d '{"path":"app"}' | tee /tmp/login.json | jq .

# send the user's browser to:  jq -r .url /tmp/login.json
```

## 9. Offboard and restore — organization key, scope: write

Deletion is **soft**: API access stops immediately and the tenant can be restored inside the safety window.

```bash
curl -sS -X DELETE "$API/v1/tenant/$PROCESSMIND_TENANT_ID/organization/tenants/$TENANT_ID" \
  -H "x-api-key: $PROCESSMIND_API_KEY" | jq .

curl -sS -X POST "$API/v1/tenant/$PROCESSMIND_TENANT_ID/organization/tenants/$TENANT_ID/restore" \
  -H "x-api-key: $PROCESSMIND_API_KEY" -H "Content-Type: application/json" -d '{}' | jq .
```

## More

- Pagination: list endpoints take `limit` (default 100, max 1000 — some lists 250) and `offset` and return a bare array.
- Large files: multipart upload (`uploads/multipart/initiate → parts → complete`); daily increments: `delta=true&partnumber=N` — see [docs/recipes.md](../docs/recipes.md).
- Everything else: `curl -sS "$API/v1/openapi.json"` and the [API reference](https://processmind.com/resources/docs/api).
