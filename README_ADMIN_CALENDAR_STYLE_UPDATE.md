# The White Wood — Admin calendar style update

This patch updates the admin date fields to match The White Wood's Josefin Sans and white/black/gold theme. It styles the date input, focus/hover states, selected-date field state, and calendar icon. It does not change booking logic, API routes, authentication, or database/payment behavior.

## Install
1. Extract the ZIP at the root of your existing GitHub repository.
2. Replace **only `admin.css`**.
3. Commit to `main` and wait for Cloudflare Pages to deploy.
4. Open `https://thewhitewood.my/admin.html` and test the manual block date fields.

**Browser limitation:** the popup calendar opened by native `input type="date"` is drawn by the browser/operating system, so website CSS cannot fully recolor each day inside that popup. This patch styles the fields and their selected/focused states. To control individual calendar-day colors and range highlights exactly like the public booking calendar, the admin date picker must be replaced with a custom calendar component; that is a functional UI change rather than CSS-only.
