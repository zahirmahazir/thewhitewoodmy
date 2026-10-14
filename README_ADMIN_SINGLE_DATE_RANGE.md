# Admin single date-range picker update

This patch updates only `admin.html` and `admin.css`.

- One visible date-range box for Manual Blocks.
- Calendar opens when the box is tapped/clicked.
- Select a start date, then an end/checkout date; the calendar closes automatically.
- Start/end values still submit through the existing `startDate` and `endDate` form fields, preserving the existing API contract.
- White/black/gold styling and responsive layout are retained.

## Deploy
Replace `admin.html` and `admin.css` in the repository root and commit to `main`. Keep `admin.js`, API files, and database unchanged. After deployment, close and reopen the admin page or hard-refresh.
