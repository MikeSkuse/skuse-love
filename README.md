# Mike & Anna's wedding companion

A mobile-first React and Cloudflare Workers app for 29 November 2026. Confirmed schedule and table themes come from `codex/data/confirmed_wedding_details.json`; names, assignments, venue and menu are deliberately empty.

## Local development

Install Node.js 22 or later and npm, then run `npm install` (this also updates the lockfile). Create a D1 database and private R2 bucket with `npx wrangler d1 create skuse-love` and `npx wrangler r2 bucket create skuse-love-photos`. Replace `REPLACE_WITH_D1_ID` in `wrangler.json` with the D1 database ID. Apply the schema locally with `npx wrangler d1 migrations apply skuse-love --local`. Copy `.dev.vars.example` to `.dev.vars` and replace the example with a long random admin token. Run `npm run dev`. Use `npm run build` and `npm run lint` to verify.

## Deploy

Authenticate Wrangler, create the production D1 database and R2 bucket, and set the bindings in `wrangler.json`. Run `npx wrangler d1 migrations apply skuse-love --remote`, then `npx wrangler secret put ADMIN_TOKEN`, and finally `npm run deploy`. Protect `/admin` and `/api/admin/*` with Cloudflare Access in addition to the application token. Test on a staging Worker first. Never commit `.dev.vars` or share the token in a URL. See `DECISIONS.md` for production gaps and unresolved decisions.

## Admin and seating import

Open `/admin`, enter the secret token, and sign in to moderate pending photos or update venue, FAQ and the current event override. The token is held in memory only. Until a CSV interface is added, import guest records via authenticated `POST /api/admin/guests` with JSON `{ "guests": [{ "id": "unique-id", "name": "Guest Name", "table_id": "theme_1", "token_hash": "SHA256_HEX" }] }`. Hash a unique, high-entropy access code with SHA-256 locally; send the code privately to that guest. Table IDs `theme_1` through `theme_6` follow the order in `codex/data/tables.csv`. Existing IDs are updated, not deleted. Do not include internal notes or dietary data. No guest list endpoint exists.

## Photo privacy

R2 must stay private. Uploads start pending; only approved files are returned by the public API. The Worker checks JPEG, PNG and WebP signatures and limits upload size and frequency. Images retain metadata, including possible GPS data. Before opening uploads to guests, agree and publish a retention/deletion policy, arrange abuse reporting and malware review, and add metadata removal and stronger anti-spam controls. Service worker caching is limited to the app shell and does not cache API responses or uploaded images. Offline uploads are not queued.
