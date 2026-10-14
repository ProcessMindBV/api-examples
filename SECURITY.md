# Security

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Email **team@processmind.com** with the subject “Security — api-examples”, including steps to reproduce. We aim to respond within two business days.

## Keys and tokens in these examples

- **Never commit an API key.** All examples read keys from `PROCESSMIND_API_KEY`; treat every file in this repository as public.
- **Key secrets are shown once** at creation (only their hash is stored). If you lose one, revoke it and create a new one in the app under *Settings → API Keys*.
- **Scope keys to the job.** Most integrations need `read`, `write` and `uploadData`; enable `sessions` only for keys that mint login links.
- **Login links are password-equivalent.** A minted token logs the user in without a password prompt, expires after 60 seconds and can be used once. Send it straight to the user’s browser, never log it, and never mint it from browser-side code.
- **If a key leaks:** revoke it first (that stops the leak immediately), then remove it from history and rotate anything else it protected. See [docs/recipes.md](docs/recipes.md) for the rotation flow.
