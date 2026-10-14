# The White Wood — Admin visual style update

This is a styling-only update for the existing admin dashboard. It changes typography to Josefin Sans and refreshes the white/black/gold palette, forms, date pickers, tabs, booking cards, status labels, buttons, spacing, and mobile layout.

## Upload
1. Extract this ZIP at the root of the existing GitHub repository.
2. Replace **only** `admin.html` and `admin.css`.
3. Do not replace `admin.js`, `functions/api/bookings.js`, `functions/api/blocks.js`, or any payment/database files for this visual-only update.
4. Commit the changes to `main` and wait for Cloudflare Pages to finish deploying.
5. Open `https://thewhitewood.my/admin.html` and check login, filters, booking actions, and manual block actions.

The font is loaded from Google Fonts; if external fonts are blocked, the page falls back to Arial/Helvetica. No API routes, authentication, database schema, or booking behavior are changed.
