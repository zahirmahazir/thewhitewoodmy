# The White Wood Homestay — GitHub Package

This is the current clean website package for deployment through Cloudflare Pages + GitHub.

## Included
- `index.html` — main website
- `style.css` — website styling
- `script.js` — gallery, booking UI, pricing and listing settings
- `google-review.js` — frontend Google Reviews loader
- `functions/api/reviews.js` — Cloudflare Pages Function for Google Places API
- `assets/images/` — hero, listing and background images
- `robots.txt` and `sitemap.xml` — basic SEO files

## Not included yet
- `worker.js` / `_worker.js`
- `sw.js`
- admin dashboard
- D1 booking database
- payment gateway

Those should be added when we move to the backend/database/payment stage. A service worker is intentionally not included so it does not cache old website assets while the site is being updated.

## Google Reviews setup
In Cloudflare Pages, add these environment variables/secrets:
- `GOOGLE_PLACES_API_KEY`
- `GOOGLE_PLACE_ID`

The API key must stay in Cloudflare and should not be committed to GitHub.


## Social Links
The compact "Follow us" box is located directly below the preferred booking platforms.

Edit the links in `index.html` under:
`EDIT SECTION: SOCIAL MEDIA / QUICK LINKS`

The five links are kept separately editable:
- Instagram
- TikTok
- Airbnb
- Email
- Google Maps


## Booking Date Range Calendar
The booking modal now uses one range calendar. Check-in and check-out are highlighted, with a soft gold highlight between them. The minimum two-night stay is enforced during selection. Flatpickr is loaded from jsDelivr, so the live website needs internet access for the calendar library.
