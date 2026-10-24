# Troubleshooting

Wrong credentials return 401; an existing email returns 409. Too many attempts require waiting 15 minutes. Save the recovery code privately. A failed connection requires the correct local services/origin or a healthy official deployment; do not try real credentials on a local candidate. Stale edits return 409; review the newest revision and retain your draft. Missing expected revision returns 428 for legacy clients; the coordinated rollout must address this before production.

Passwords are salted PBKDF2-SHA256 hashes; session/recovery tokens are hashed in D1. Production cookies are Secure/HttpOnly/SameSite. Native sessions use user-scoped DPAPI; downloads validate ownership and byte bounds. Image signatures are checked and SVG uploads are rejected. Files are treated as downloads, not executed. Application backup content remains sensitive even though credentials are excluded.

Report reproducible issues without credentials, private backups or real records. See [SECURITY.md](../SECURITY.md), [troubleshooting](troubleshooting.md) and [contributing](../CONTRIBUTING.md). Do not disable TLS validation, origin checks, session ownership, update hashes or local isolation to clear a test.

If local preview fails, identify the intended local listener and avoid running two copies. Close only your own verified development consoles. Do not stop unrelated processes, switch to production, relax origin/cookie checks or reset data to make a test pass. Metadata-only exports are not complete backups. Private provider exports must never be attached to GitHub.
