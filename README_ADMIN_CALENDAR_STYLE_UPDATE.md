# Admin calendar style update

This patch replaces the browser-native date picker in the manual-block form with a responsive custom calendar styled to match the public booking calendar: Josefin Sans-style typography, white/black/gold palette, two months on desktop and one month on mobile, selected dates and highlighted range.

## Install
1. Upload/replace `admin.html` and `admin.css` in the repository.
2. Add `admin-calendar.js` at the repository root.
3. Commit to `main` and wait for Cloudflare Pages deployment.
4. Hard-refresh `/admin.html` with Ctrl+F5.

`admin.js`, APIs, authentication, and database schema are unchanged. The calendar handles date selection; the existing API continues to validate overlaps when a block is submitted. Past dates are disabled.