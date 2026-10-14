# Changelog

## v1.0.0 — 2026-10-14

Full refresh for the versioned `/v1` API (the previous examples targeted the pre-`/v1` path shape).

**Added**

- **Multi-tenant onboarding, end to end** (`javascript/full-onboarding.mjs`, `python/full_onboarding.py`): provision a customer tenant, mint a tenant-scoped API key, create a seat-aware user, load a BPMN model, upload an event log, map it to the process, and mint a one-time login link.
- Focused single-purpose examples: `quickstart`, `provision-tenant`, `add-users`, `load-bpmn`, `load-data`, `login-link` — mirrored in JavaScript and Python.
- `bash/curl-cheatsheet.md` — every journey step as a copy-paste curl command.
- `docs/recipes.md` — key rotation, model versioning before overwrite, delta and multipart uploads, offboarding/restore, seat-gate errors.
- README: scope table (including `sessions`), organization vs tenant keys, error table and an honest “what this API does not do” section.
- CI: weekly documentation link check; weekly OpenAPI drift watch that opens a pull request when the public spec changes.

**Changed**

- All examples now use `https://api.processmind.com/v1/...` and read `PROCESSMIND_API_KEY`, `PROCESSMIND_TENANT_ID` and `PROCESSMIND_API_URL` from the environment instead of constants in the files.
- User examples use the seat model: `access` (`none | portalViewer | designer | architect | intelligence`) plus the `isDashboardViewer` boolean.
- The JavaScript examples are dependency-free (Node 18+ `fetch`); the Python examples only need `requests`.

**Removed**

- The pre-`/v1` per-endpoint scripts (`javascript/*.js`, `python/*.py`, `bash/*.sh`) and the full-surface `ProcessMindApi.js` client library. Superseded by the focused examples above; still available in git history.
