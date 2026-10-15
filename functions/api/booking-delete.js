// Permanently delete a cancelled booking only. Protected by the existing admin token.
export async function onRequestDelete({ request, env }) {
  const auth = authorize(request, env);
  if (auth) return auth;
  if (!env.DB) return json({ error: 'Database binding DB is not configured.' }, 500);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Request body must be valid JSON.' }, 400); }
  const id = String(body.id || '').trim().slice(0, 80);
  if (!id) return json({ error: 'Booking id is required.' }, 400);

  try {
    const result = await env.DB.prepare("DELETE FROM bookings WHERE id = ? AND status = 'cancelled'").bind(id).run();
    if (!result.success || result.meta?.changes !== 1) {
      const booking = await env.DB.prepare('SELECT status FROM bookings WHERE id = ?').bind(id).first();
      if (!booking) return json({ error: 'Booking not found.' }, 404);
      return json({ error: 'Only cancelled bookings can be deleted.' }, 409);
    }
    return json({ success: true, id, deleted: true });
  } catch {
    return json({ error: 'Unable to delete cancelled booking.' }, 500);
  }
}

function authorize(request, env) {
  if (!env.ADMIN_API_TOKEN) return json({ error: 'ADMIN_API_TOKEN secret is not configured.' }, 503);
  if (request.headers.get('Authorization') !== `Bearer ${env.ADMIN_API_TOKEN}`) return json({ error: 'Unauthorized.' }, 401);
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
