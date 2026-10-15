const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

function authorized(request, env) {
  const expected = env.ADMIN_API_TOKEN;
  const provided = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  return Boolean(expected && provided && provided === expected);
}

async function ensureTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS booking_payment_transactions (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount >= 0),
    paid_at TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_booking_payment_transactions_booking ON booking_payment_transactions(booking_id)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_booking_payment_transactions_paid_at ON booking_payment_transactions(paid_at)').run();
}

export async function onRequest(context) {
  const { request, env } = context;
  if (!authorized(request, env)) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);

  try {
    await ensureTable(env.DB);
    if (request.method === 'GET') {
      const { results = [] } = await env.DB.prepare(`SELECT id, booking_id AS bookingId, amount AS amountPaid,
        paid_at AS paidAt, note, created_at AS createdAt FROM booking_payment_transactions ORDER BY paid_at DESC, created_at DESC`).all();
      return json({ payments: results });
    }
    if (request.method === 'POST') {
      const body = await request.json();
      const bookingId = String(body.bookingId || '').trim();
      const amount = Number(body.amountPaid);
      const paidAt = String(body.paidAt || '').trim();
      const note = String(body.note || '').trim().slice(0, 250);
      if (!bookingId || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) {
        return json({ error: 'Provide a booking ID, payment amount greater than zero, and valid payment date.' }, 400);
      }
      const id = crypto.randomUUID();
      await env.DB.prepare(`INSERT INTO booking_payment_transactions (id, booking_id, amount, paid_at, note)
        VALUES (?, ?, ?, ?, ?)`).bind(id, bookingId, amount, paidAt, note).run();
      return json({ success: true, payment: { id, bookingId, amountPaid: amount, paidAt, note } }, 201);
    }
    return json({ error: 'Method not allowed' }, 405);
  } catch (error) {
    return json({ error: 'Unable to process earnings data.', details: error?.message || 'Unknown error' }, 500);
  }
}
