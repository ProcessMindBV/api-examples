# Contributing

Thanks for helping keep these examples accurate! They are the first thing developers run before building on the ProcessMind API.

## Requirements

- Node.js 18+ for the JavaScript examples (no `npm install` needed)
- Python 3.10+ with `pip install -r python/requirements.txt`
- `curl` and `jq` for the [cheatsheet](bash/curl-cheatsheet.md) (optional)

## Running an example

All examples read configuration from environment variables (see the README):

```bash
export PROCESSMIND_API_KEY="pm-…"           # organization or tenant key
export PROCESSMIND_TENANT_ID="<tenant id>"  # your workspace (context tenant for org calls)

node javascript/quickstart.mjs
python python/quickstart.py
```

## Verifying a change

The examples are deliberately thin wrappers around documented API calls, so “does it still work” means running it against a **scratch workspace** — never a customer’s:

1. Create a throwaway tenant under your own organization (or use a sandbox tenant) and a key for it.
2. Run the example you changed with that key. `full-onboarding.mjs` covers the whole journey and prints every id it creates.
3. Clean up: `node javascript/full-onboarding.mjs --cleanup <tenantId>` soft-deletes the tenant it provisioned (restorable for a while afterwards). Note that tenant creation may consume your plan’s tenant allowance and can be billable on partner contracts.
4. Syntax-check before committing: `node --check <file>` (JavaScript) and `python -m py_compile <file>` (Python).

If the public spec changed (`GET /v1/openapi.json`), the weekly [OpenAPI watch](.github/workflows/openapi-watch.yml) opens a pull request — please review whether the affected examples need an update.

## Style

- JavaScript: tabs, double quotes, no dependencies (Node’s built-in `fetch`).
- Python: 4 spaces, PEP 8, only `requests`.
- Keep files standalone-runnable, print the ids you create, and prefer clarity over cleverness — these are samples.

## Pull requests

- Imperative commit subject lines (“Add login-link example for Node”).
- Say which examples you ran and against what kind of workspace.
- No secrets, tokens or real customer ids in commits — ever.
