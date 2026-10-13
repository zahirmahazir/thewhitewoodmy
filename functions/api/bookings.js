// POST /api/bookings
// Creates a pending booking request only after a fresh server-side overlap check.
// Payment is intentionally not implemented here. Pending bookings reserve dates until cancelled/rejected.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SOURCES = new Set(['website', 'whatsapp', 'airbnb', 'agoda', 'private', 'admin']);

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Database binding DB is not configured.' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Request body must be valid JSON.' }, 400); }

  const listingId = clean(body.listingId, 80);
  const checkin = String(body.checkin || '');
  const checkout = String(body.checkout || '');
  const guestName = clean(body.guestName, 120);
  const guestEmail = clean(body.guestEmail, 254) || null;
  const guestPhone = clean(body.guestPhone, 40);
  const guests = Number(body.guests || 1);
  const source = SOURCES.has(body.source) ? body.source : 'website';
  const notes = clean(body.notes, 2000) || null;
  const totalAmount = body.totalAmount == null ? null : Number(body.totalAmount);

  if (!listingId || !validDate(checkin) || !validDate(checkout) || checkout <= checkin) return json({ error: 'Choose valid check-in and check-out dates.' }, 400);
  if (!guestName || !guestPhone || !Number.isInteger(guests) || guests < 1 || guests > 30) return json({ error: 'Guest name, phone number and a valid guest count are required.' }, 400);
  if (totalAmount !== null && (!Number.isFinite(totalAmount) || totalAmount < 0)) return json({ error: 'Invalid totalAmount.' }, 400);

  const nights = dateDiff(checkin, checkout);
  if (nights < 2) return json({ error: 'Minimum stay is 2 nights.', code: 'MINIMUM_STAY', minimumNights: 2 }, 400);

  try {
    const listing = await env.DB.prepare('SELECT id, minimum_nights FROM listings WHERE id = ? AND is_active = 1').bind(listingId).first();
    if (!listing) return json({ error: 'Listing not found.' }, 404);
    if (nights < listing.minimum_nights) return json({ error: `Minimum stay is ${listing.minimum_nights} nights.`, code: 'MINIMUM_STAY', minimumNights: listing.minimum_nights }, 400);

    // Insert only if there is no overlap. D1 serializes writes; the conditional insert is the final guard.
    const id = crypto.randomUUID();
    const reference = `WW${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase()}`;
    const result = await env.DB.prepare(`
      INSERT INTO bookings (id, reference, listing_id, checkin, checkout, nights, guest_name, guest_email, guest_phone, guests, source, status, total_amount, notes)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.listing_id = ? AND b.status IN ('pending', 'confirmed')
          AND b.checkin < ? AND b.checkout > ?
      )
      AND NOT EXISTS (
        SELECT 1 FROM date_blocks d
        WHERE d.listing_id = ? AND d.start_date < ? AND d.end_date > ?
      )
    `).bind(
      id, reference, listingId, checkin, checkout, nights, guestName, guestEmail, guestPhone, guests, source, totalAmount, notes,
      listingId, checkout, checkin, listingId, checkout, checkin
    ).run();

    if (!result.success || result.meta?.changes !== 1) {
      return json({ error: 'Not available', code: 'NOT_AVAILABLE' }, 409);
    }
    return json({ success: true, reference, status: 'pending', listingId, checkin, checkout, nights, message: 'Booking request received. It is not confirmed until reviewed.' }, 201);
  } catch (error) {
    return json({ error: 'Unable to create booking request.' }, 500);
  }
}

function clean(value, max) { return String(value ?? '').trim().slice(0, max); }
function validDate(value) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function dateDiff(start, end) { return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000); }
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
