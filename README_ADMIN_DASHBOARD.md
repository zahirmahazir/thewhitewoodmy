# The White Wood — Admin dashboard patch

## Files in this patch
- `admin.html`, `admin.css`, `admin.js`: standalone admin UI at `/admin.html`
- `functions/api/bookings.js`: keeps public POST booking behavior and adds token-protected GET/PATCH admin endpoints
- `functions/api/blocks.js`: keeps token-protected POST and adds token-protected GET/DELETE endpoints

## Before uploading
1. Make sure Cloudflare Pages has a strong `ADMIN_API_TOKEN` secret configured. If a token was ever exposed in a screenshot or chat, rotate it to a long random value and redeploy.
2. Do not place the token in GitHub, HTML, or JavaScript source.

## Upload to GitHub
Extract this ZIP at the repository root. Add `admin.html`, `admin.css`, `admin.js`, and `README_ADMIN_DASHBOARD.md`. Replace only `functions/api/bookings.js` and `functions/api/blocks.js` with the versions in this patch. Keep `functions/api/reviews.js` and all other website files.
Commit to `main` and wait for Cloudflare Pages deployment to succeed.

## Use
Open `https://thewhitewood.my/admin.html`. Enter the `ADMIN_API_TOKEN` value in the login form. The token is kept in sessionStorage for this browser tab/session and sent only as an Authorization Bearer header to same-origin APIs. Click “Lock dashboard” to clear it.

The dashboard supports viewing/filtering bookings, confirming/rejecting/cancelling bookings, viewing date blocks, adding manual blocks, and removing blocks. Booking confirmation is rejected if dates overlap another pending/confirmed booking or a date block.

## Test carefully
- Test with the existing `Booking Test 2` record only if it still exists; don't create real guest records while testing.
- Create a temporary manual block on an unused date, confirm it appears in `/api/availability`, then remove it from the dashboard and confirm availability returns.
- API endpoints are protected by `ADMIN_API_TOKEN`; the static `/admin.html` page itself is not secret, but without the token its API calls are rejected. Do not share the token.
- Payment processing is not implemented. Booking requests remain `pending` until reviewed.
