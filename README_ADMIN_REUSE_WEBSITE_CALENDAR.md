# The White Wood Admin — Website Calendar Update

This patch reuses the public website's date-range calendar visual language for the Admin manual-block form.

## Files to replace
- `admin.html`
- `admin.css`

## Deploy
1. Copy both files to the repository root, replacing the existing files.
2. Commit to `main` and wait for Cloudflare Pages deployment to succeed.
3. Reopen `/admin.html` and hard refresh.

## What changed
- The date selector is a button rather than a text input, avoiding iOS Safari input-focus zoom.
- Calendar remains hidden until the date button is tapped.
- One date-range selector: select start date, then checkout; calendar closes automatically.
- Uses the website's month grid, weekday labels, gold selected dates, soft-gold range, and Done control.
- The selected start/end values are still submitted through the existing hidden `adminStartDate` and `adminEndDate` fields.

## Important
This patch does not change `admin.js`, API endpoints, authentication, database schema, or payment logic. The calendar is visually reused/adapted from the public site's `script.js`/`style.css`; admin date blocking remains handled by the existing admin API.
