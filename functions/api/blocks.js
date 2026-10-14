// /api/blocks — authenticated manual date-block management.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SOURCES = new Set(['airbnb', 'agoda', 'whatsapp', 'private', 'maintenance', 'admin']);

export async function onRequestGet({ request, env }) {
  const auth = authorize(request, env); if (auth) return auth;
  if (!env.DB) return json({ error: 'Database binding DB is not configured.' }, 500);
  const url = new URL(request.url);
  const listingId = url.searchParams.get('listingId') || '';
  try {
    const query = listingId
      ? env.DB.prepare(`SELECT d.id, d.listing_id AS listingId, l.name AS listingName, d.start_date AS startDate, d.end_date AS endDate, d.source, d.label, d.notes, d.created_at AS createdAt FROM date_blocks d JOIN listings l ON l.id=d.listing_id WHERE d.listing_id=? ORDER BY d.start_date`).bind(listingId)
      : env.DB.prepare(`SELECT d.id, d.listing_id AS listingId, l.name AS listingName, d.start_date AS startDate, d.end_date AS endDate, d.source, d.label, d.notes, d.created_at AS createdAt FROM date_blocks d JOIN listings l ON l.id=d.listing_id ORDER BY d.start_date`);
    const result = await query.all();
    return json({ success: true, blocks: result.results || [] });
  } catch { return json({ error: 'Unable to load date blocks.' }, 500); }
}

export async function onRequestPost({ request, env }) {
  const auth = authorize(request, env); if (auth) return auth;
  if (!env.DB) return json({ error: 'Database binding DB is not configured.' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Request body must be valid JSON.' }, 400); }
  const listingId = String(body.listingId || '').trim();
  const startDate = String(body.startDate || '');
  const endDate = String(body.endDate || '');
  const source = SOURCES.has(body.source) ? body.source : '';
  const label = clean(body.label, 120) || null;
  const notes = clean(body.notes, 2000) || null;
  if (!listingId || !validDate(startDate) || !validDate(endDate) || endDate <= startDate || !source) return json({ error: 'Provide listingId, valid startDate/endDate, and a supported source.' }, 400);
  try {
    const listing = await env.DB.prepare('SELECT id FROM listings WHERE id = ? AND is_active = 1').bind(listingId).first();
    if (!listing) return json({ error: 'Listing not found.' }, 404);
    const id = crypto.randomUUID();
    const result = await env.DB.prepare(`
      INSERT INTO date_blocks (id, listing_id, start_date, end_date, source, label, notes)
      SELECT ?, ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.listing_id = ? AND b.status IN ('pending', 'confirmed') AND b.checkin < ? AND b.checkout > ?)
      AND NOT EXISTS (SELECT 1 FROM date_blocks d WHERE d.listing_id = ? AND d.start_date < ? AND d.end_date > ?)
    `).bind(id, listingId, startDate, endDate, source, label, notes, listingId, endDate, startDate, listingId, endDate, startDate).run();
    if (!result.success || result.meta?.changes !== 1) return json({ error: 'Not available: these dates overlap an existing booking or block.' }, 409);
    return json({ success: true, id, listingId, startDate, endDate, source }, 201);
  } catch { return json({ error: 'Unable to create date block.' }, 500); }
}

export async function onRequestDelete({ request, env }) {
  const auth = authorize(request, env); if (auth) return auth;
  if (!env.DB) return json({ error: 'Database binding DB is not configured.' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Request body must be valid JSON.' }, 400); }
  const id = clean(body.id, 80);
  if (!id) return json({ error: 'Block id is required.' }, 400);
  try {
    const result = await env.DB.prepare('DELETE FROM date_blocks WHERE id = ?').bind(id).run();
    if (!result.success || result.meta?.changes !== 1) return json({ error: 'Block not found.' }, 404);
    return json({ success: true, deletedId: id });
  } catch { return json({ error: 'Unable to delete date block.' }, 500); }
}

function authorize(request, env) {
  if (!env.ADMIN_API_TOKEN) return json({ error: 'ADMIN_API_TOKEN secret is not configured.' }, 503);
  if (request.headers.get('Authorization') !== `Bearer ${env.ADMIN_API_TOKEN}`) return json({ error: 'Unauthorized.' }, 401);
  return null;
}
function clean(value, max) { return String(value ?? '').trim().slice(0, max); }
function validDate(value) { if (!DATE_RE.test(value)) return false; const d = new Date(`${value}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value; }
function json(body, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }); }
