# Admin calendar mobile fix

This patch fixes the manual-block calendar not opening reliably on mobile Safari and when the admin page is opened at `/admin/`.

## Files
- `admin.html` — uses root-relative asset paths so scripts/styles load from `/admin` and `/admin/`.
- `admin-calendar.js` — opens the custom calendar on pointer/tap, click, or focus, while keeping it hidden on initial load.
- `admin.css` — same existing website-matched styling.

## Deploy
Upload/replace these three files at the repository root, commit to `main`, wait for Cloudflare Pages to deploy, then reload the admin page. No database migration or API changes are required.
