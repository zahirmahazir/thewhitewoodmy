// GET /api/availability?listingId=white-wood&checkin=YYYY-MM-DD&checkout=YYYY-MM-DD
// Availability is checked server-side against active bookings and manual date blocks.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'Database binding DB is not configured.' }, 500);
  const url = new URL(request.url);
  const listingId = (url.searchParams.get('listingId') || '').trim();
  const checkin = url.searchParams.get('checkin') || '';
  const checkout = url.searchParams.get('checkout') || '';
  const mode = url.searchParams.get('mode') || '';

  if (!listingId) return json({ error: 'Provide listingId.' }, 400);

  try {
    const listing = await env.DB.prepare(
      'SELECT id, name, minimum_nights FROM listings WHERE id = ? AND is_active = 1'
    ).bind(listingId).first();
    if (!listing) return json({ error: 'Listing not found.' }, 404);

    // Calendar mode returns occupied night ranges so the UI can cross out dates.
    // `end` is exclusive, matching booking checkout semantics.
    if (mode === 'calendar') {
      const start = url.searchParams.get('start') || '';
      const end = url.searchParams.get('end') || '';
      if (!validDate(start) || !validDate(end) || end <= start) {
        return json({ error: 'Provide valid start and end dates for calendar mode.' }, 400);
      }
      const bookingRows = await env.DB.prepare(`
        SELECT checkin AS start_date, checkout AS end_date FROM bookings
        WHERE listing_id = ? AND status IN ('pending', 'confirmed')
          AND checkin < ? AND checkout > ?
      `).bind(listingId, end, start).all();
      const blockRows = await env.DB.prepare(`
        SELECT start_date, end_date FROM date_blocks
        WHERE listing_id = ? AND start_date < ? AND end_date > ?
      `).bind(listingId, end, start).all();
      return json({
        listingId, start, end, minimumNights: listing.minimum_nights,
        ranges: [...(bookingRows.results || []), ...(blockRows.results || [])]
      });
    }

    if (!validDate(checkin) || !validDate(checkout) || checkout <= checkin) {
      return json({ error: 'Provide listingId, valid checkin and checkout dates.' }, 400);
    }

    const nights = dateDiff(checkin, checkout);
    if (nights < listing.minimum_nights) {
      return json({ available: false, reason: 'minimum_stay', minimumNights: listing.minimum_nights, nights });
    }

    const bookingConflict = await env.DB.prepare(`
      SELECT reference AS conflict FROM bookings
      WHERE listing_id = ? AND status IN ('pending', 'confirmed')
        AND checkin < ? AND checkout > ? LIMIT 1
    `).bind(listingId, checkout, checkin).first();
    const blockConflict = await env.DB.prepare(`
      SELECT source AS conflict FROM date_blocks
      WHERE listing_id = ? AND start_date < ? AND end_date > ? LIMIT 1
    `).bind(listingId, checkout, checkin).first();

    const available = !bookingConflict && !blockConflict;
    return json({ available, listingId, checkin, checkout, nights, minimumNights: listing.minimum_nights, reason: available ? null : 'not_available' });
  } catch (error) {
    return json({ error: 'Availability check failed.' }, 500);
  }
}

function validDate(value) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function dateDiff(start, end) { return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000); }
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
