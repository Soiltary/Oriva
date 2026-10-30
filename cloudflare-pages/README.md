# Oriva on Cloudflare Pages — 2026-10-30

Production: https://oriva-library.pages.dev/ and `/iphone/`. Project `oriva-library`, direct upload, production branch `main`, in the same account as Syntra: `f9b1e5fd6056a136b90ced1f00b53bd9` (public identifier, not a credential). Repository: https://github.com/Soiltary/Oriva (existing public repository, privacy unchanged).

## Source and deployment

Use Node 24.22.1 and pnpm 11.25.0. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm pages:test
pnpm pages:build
pnpm exec wrangler login --scopes account:read user:read pages:write
pnpm pages:deploy
```

The owner completes OAuth in the browser; never paste tokens in chat or commit credentials. Deployment guards the fixed account/project. No Git integration or automatic GitHub deployment is configured. Vite builds the existing `app/oriva-app.tsx`, original CSS/components and `public/` into ignored `pages-dist/`. The small `next/link` adapter renders normal anchors. Both routes load the original application, with `mobileView` selected by path. Only the Windows download URL is transformed to the same official Stable v1.0.0 ZIP rather than the generic release listing. Native binaries, updater configuration and original backend source are unchanged.

For a local frontend preview after building: `pnpm exec wrangler pages dev pages-dist --port 5191`. The production-origin guard rejects local API calls deliberately. Do not proxy personal credentials through a casually exposed local development server; use a new test account on a reviewed Pages preview deployment to test the real gateway. Offline UI development can use Vite's static preview without authenticated data.

## Backend status — not a complete backend migration

D1 (`DB`) and R2 (`BUCKET`) remain on the existing Sites deployment at `https://oriva.soltairy.chatgpt.site`. Its published version 18 uses 15 D1 tables. The current GitHub `app/` and `public/` matched the published source before changes. The provider-managed D1/R2 IDs and a complete paired export/restore operation are not available with the present tools. No new empty database, storage reset, schema migration or deletion was performed. No claim of a provider-wide data backup or tested restoration is made.

`gateway.mjs` forwards only `/api` paths to that existing service; the real UI and its assets are served by Pages. It validates same-origin mutations before rewriting the upstream Origin, forwards only the app's host-only session cookie, rejects foreign Origins, disables response caching and preserves the API's secure HttpOnly cookie. No iframe, browser redirect to Sites, OpenAI authentication or session-owned access token is used. The old service must remain online. If it is suspended, the new interface remains hosted but login/data operations fail. Full independence requires provider-exported D1 plus R2 backups, ownership/access to the destination resources, isolated restoration and consistency tests before any production change. An account-level export in the UI is useful but is not a provider-wide D1/R2 backup.

## Sessions, local data and PWA

Sign in again at the new address with the same Oriva credentials. Server data uses the same backend; cookies, sessionStorage drafts, encrypted IndexedDB and installed PWAs do not cross origins. Save pending edits on the old site first. Use the existing account backup/export interface to retain a full account backup; keep encrypted/private archives outside Git. The existing full-backup/import workflow can restore an account into a separately tested account, but no personal account restore was run during this migration. Do not blindly import on top of a live library. Install the PWA anew from the new address. The manifests and Service Worker use relative/same-origin routes, and API/private records are excluded from public SW caches. Existing Windows installations and update feeds keep their original endpoint, so old Sites must not be redirected or deleted.

## Validation and rollback

Test `pages:test` (CSRF, host guard, cookie filtering, redirects), build, then verify production `/`, `/iphone`, refresh, English/Arabic, desktop/mobile, images/fonts, and a separate test account's login, link/file save and readback. Compare downloaded bytes to the official release SHA-256. Do not use an owner's personal library as a test fixture. Browser checks during migration saved a synthetic link and PNG, downloaded the identical PNG, and read both after refreshing the mobile route. New and legacy API logins resolved to the same synthetic user. Five gateway security tests passed, including provider Set-Cookie filtering. All 20 deployed static files matched the build byte-for-byte. Physical iPhone install/offline and the native Windows client's full runtime were not tested.

Latest verified production: `784e2aeb-ba94-4d82-953e-95c8466e97f0`, runtime commit `f0b68edd5faa161fb57449a5814527b71bd8c678`. Only the app session Set-Cookie is returned; upstream provider cookies are filtered.

First known-good Pages deployment: `d7f788e4-13dd-42f6-8c64-24e4d0fa99c8` (use `wrangler pages deployment list --project-name oriva-library` for the full ID). Cloudflare dashboard > Workers & Pages > oriva-library > Deployments > known-good production > Rollback. Record a full deployment ID before every later publish. Alternatively check out the desired Git commit in a separate directory, install frozen dependencies, build and run `pages:deploy` on the same project. This changes the frontend/gateway only; never run DB resets as rollback. Pre-migration GitHub source: `86dab760beb4eaa040ab168c66de45d0720f9b9d`; original Sites source: `8a471f10312802933e08fd25a7ad43630cc65aad`.

Cost: Pages/Workers Free only; no card, subscription or paid resource added. Static assets are free; proxied API calls count against the account's Workers Free daily quota (100,000 requests/day, shared with other Workers/Pages Functions). Free Workers CPU limits also apply. Provider documentation: https://developers.cloudflare.com/pages/functions/pricing/ and https://developers.cloudflare.com/workers/platform/pricing/ . Existing upstream service quotas remain an additional dependency.
