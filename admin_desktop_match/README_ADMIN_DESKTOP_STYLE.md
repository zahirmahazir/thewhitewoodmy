# The White Wood Admin — Desktop style update

This patch aligns the admin page's desktop layout with the public booking UI: white background, gold eyebrow text, serif display headings, Josefin Sans body typography, thin warm-grey borders, and compact date summary/calendar styling. Admin-specific tabs, forms, lists, authentication, API routes, and data behavior remain intact.

## Install
1. Replace `admin.html` and `admin.css` in the repository root with the files in this ZIP.
2. Keep `admin.js`, `admin-calendar.js` (if present), API files, and all other assets unchanged.
3. Commit to `main` and wait for Cloudflare Pages deployment.
4. Hard-refresh desktop with Ctrl+F5; on mobile, close and reopen the admin tab.
