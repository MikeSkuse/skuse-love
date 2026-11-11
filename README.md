# Mike & Anna's wedding companion

A mobile-first React and Cloudflare Workers app for 29 November 2026. Seating assignments are supplied in `TablePlan.csv` and seeded by a database migration.

## Local development

Install Node.js 22 or later and npm, then run `npm install` (this also updates the lockfile). For local development, apply the schema locally with `npx wrangler d1 migrations apply skuse-love --local`. Copy `.dev.vars.example` to `.dev.vars` and replace the example with a long random admin token. Run `npm run dev`. Use `npm run build` and `npm run lint` to verify.

## Deploy

Authenticate Wrangler and run `npm run build` followed by `npm run deploy`. Wrangler can provision the D1 database and R2 bucket automatically. Once provisioned, find the D1 database ID in the Cloudflare dashboard or with `npx wrangler d1 list`, add it as `database_id` to the D1 binding in `wrangler.json`, and run `npx wrangler d1 migrations apply skuse-love --remote` before using database-backed features. Set the admin secret with `npx wrangler secret put ADMIN_TOKEN` and redeploy with the database ID committed. If you already have a D1 database you intend to use, specify its ID before the first deployment instead of relying on automatic provisioning. Protect `/admin` and `/api/admin/*` with Cloudflare Access in addition to the application token. Test on a staging Worker first. Never commit `.dev.vars` or share the token in a URL. See `DECISIONS.md` for production gaps and unresolved decisions.

## Admin and seating import

Open `/admin`, enter the secret token, and sign in to moderate pending photos or update venue, FAQ and the current event override. The token is held in memory only. The seating lookup uses the assignments in migration `0002_seating_plan.sql`; apply migrations locally or remotely before using it. Changes to `TablePlan.csv` require a new migration to update the database. Guests can look up a table by name without an access code; there is no guest list endpoint. The legacy admin guest import does not update the seating plan.

## Photo privacy

R2 must stay private. Uploads start pending; only approved files are returned by the public API. The Worker checks JPEG, PNG and WebP signatures and limits upload size and frequency. Images retain metadata, including possible GPS data. Before opening uploads to guests, agree and publish a retention/deletion policy, arrange abuse reporting and malware review, and add metadata removal and stronger anti-spam controls. Service worker caching is limited to the app shell and does not cache API responses or uploaded images. Offline uploads are not queued.

## Integration validation

The integration test targets a running local Worker and writes a test photo to its local D1/R2 state. Use disposable local emulator state, never production. Apply local migrations, start `npx wrangler dev --local --var ADMIN_TOKEN:local-test-admin-token`, then run `npm run test:integration`. Set `TEST_BASE_URL` and `TEST_ADMIN_TOKEN` if using a different address or token. The test covers admin authentication, seating lookup, image signature rejection, and photo moderation.

