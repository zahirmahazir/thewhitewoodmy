# Admin calendar: open on date selection

This patch makes the custom manual-block calendar hidden when the admin page first opens. It appears when either Start date or End date is clicked, keeps the White Wood typography and white/black/gold styling, and closes with Done or when clicking outside the calendar.

## Deploy
1. Replace `admin.html` and `admin.css` in the repository.
2. Replace `admin-calendar.js` in the repository root.
3. Commit to `main` and wait for Cloudflare Pages deployment.
4. Open `/admin.html` and hard-refresh with Ctrl+F5.

No API routes, payment code, or database schema are changed.
