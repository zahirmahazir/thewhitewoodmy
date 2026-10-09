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


## Responsive Booking Calendar
The booking modal includes a built-in date-range calendar (no external calendar library required). On laptop it shows two months side by side; on mobile it uses a compact single-month view. The selected check-in and checkout are highlighted, dates between them are shaded gold, and checkout must be at least two nights after check-in. Mobile booking modal typography and spacing are reduced for smaller screens.


## Listing Card Responsive Layout
Listing cards now use more balanced heading and price sizing. On mobile, the price sits on its own top row and the listing title uses the full card width below it, avoiding narrow awkward line breaks. Description, amenities and action buttons are slightly smaller on mobile.


## Mobile Listing + Minimum Stay Warning Fix
This update applies high-specificity responsive rules to the actual `.listing-grid .card` markup so the mobile listing title and price stay compact even if older CSS is still loaded. If a guest selects a checkout that gives only one night, the selection remains visible and a red minimum-two-night warning is shown; the guest can reopen the calendar and choose a later checkout.


## Mobile Listing Title and Price
On mobile, the listing title is kept on one line, with the nightly price directly below it and the location below the price. Desktop layout is unchanged.
