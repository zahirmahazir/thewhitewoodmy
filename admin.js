(() => {
  const $ = (s) => document.querySelector(s);
  const loginPanel = $('#loginPanel'), dashboard = $('#dashboard');
  const tokenInput = $('#tokenInput'), loginMessage = $('#loginMessage');
  let token = '';
  let allBookings = [];
  let allBlocks = [];
  let activeCategory = 'booking';

  const headers = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
  function message(el, text, kind='') {
    if (!el) return;
    el.textContent = text || '';
    el.className = `message ${kind}`.trim();
  }
  async function api(path, options={}) {
    const response = await fetch(path, { ...options, headers: { ...headers(), ...(options.headers || {}) }, cache: 'no-store' });
    let data = {};
    try { data = await response.json(); } catch { data = { error: 'Server returned an unreadable response.' }; }
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }
  function showDashboard() {
    loginPanel.classList.add('hidden');
    dashboard.classList.remove('hidden');
    $('#logoutBtn').classList.remove('hidden');
  }
  function lock() {
    token = '';
    tokenInput.value = '';
    sessionStorage.removeItem('wwAdminToken');
    dashboard.classList.add('hidden');
    loginPanel.classList.remove('hidden');
    $('#logoutBtn').classList.add('hidden');
  }
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    token = tokenInput.value.trim();
    message(loginMessage, 'Checking token…');
    try {
      await api('/api/bookings?status=pending');
      sessionStorage.setItem('wwAdminToken', token);
      showDashboard();
      await refreshAll();
      message(loginMessage, '');
    } catch(err) {
      token = '';
      message(loginMessage, err.message, 'error');
    }
  });
  $('#logoutBtn').addEventListener('click', lock);
  $('#refreshBtn').addEventListener('click', refreshAll);

  document.querySelectorAll('[data-category]').forEach(btn => btn.addEventListener('click', () => {
    activeCategory = btn.dataset.category;
    document.querySelectorAll('[data-category]').forEach(b => b.classList.toggle('active', b === btn));
    renderRecords();
  }));
  $('#bookingListing').addEventListener('change', renderRecords);
  $('#bookingStatus').addEventListener('change', () => {
    if ($('#bookingStatus').value === 'cancelled') setCategory('cancelled');
    else if (activeCategory === 'cancelled') setCategory('booking');
    renderRecords();
  });
  $('#recordSort').addEventListener('change', renderRecords);

  function setCategory(category) {
    activeCategory = category;
    document.querySelectorAll('[data-category]').forEach(b => b.classList.toggle('active', b.dataset.category === category));
  }
  function sourceOf(item) { return String(item.source || '').trim().toLowerCase(); }
  function isCancelled(b) { return String(b.status || '').toLowerCase() === 'cancelled'; }
  function bookingCategory(b) {
    if (isCancelled(b)) return 'cancelled';
    const source = sourceOf(b);
    if (source === 'whatsapp' || source.includes('whatsapp')) return 'whatsapp';
    if (source === 'airbnb' || source === 'agoda' || source.includes('airbnb') || source.includes('agoda')) return 'airbnb';
    if (source === 'maintenance' || source.includes('maintenance')) return 'maintenance';
    return 'booking';
  }
  function blockCategory(b) {
    const source = sourceOf(b);
    if (source === 'whatsapp' || source.includes('whatsapp')) return 'whatsapp';
    if (source === 'airbnb' || source === 'agoda' || source.includes('airbnb') || source.includes('agoda')) return 'airbnb';
    if (source === 'maintenance' || source.includes('maintenance')) return 'maintenance';
    return 'booking';
  }
  function dateFor(item, isBlock=false) {
    const value = isBlock ? item.startDate : (item.checkin || item.createdAt || item.created_at || '');
    if (!value) return '';
    return String(value).slice(0, 10);
  }
  function allRecords() {
    return [
      ...allBookings.map(data => ({ kind: 'booking', data, category: bookingCategory(data), date: dateFor(data) })),
      ...allBlocks.map(data => ({ kind: 'block', data, category: blockCategory(data), date: dateFor(data, true) }))
    ];
  }
  function updateCounts() {
    const records = allRecords();
    const counts = {
      booking: records.filter(r => r.category === 'booking').length,
      whatsapp: records.filter(r => r.category === 'whatsapp').length,
      airbnb: records.filter(r => r.category === 'airbnb').length,
      maintenance: records.filter(r => r.category === 'maintenance').length,
      cancelled: records.filter(r => r.category === 'cancelled').length
    };
    Object.entries(counts).forEach(([key, value]) => {
      const el = $(`#count${key[0].toUpperCase()}${key.slice(1)}`);
      if (el) el.textContent = value;
    });
  }
  async function refreshAll() {
    message($('#globalMessage'), 'Refreshing…');
    try {
      const [bookingData, blockData] = await Promise.all([api('/api/bookings'), api('/api/blocks')]);
      allBookings = Array.isArray(bookingData.bookings) ? bookingData.bookings : [];
      allBlocks = Array.isArray(blockData.blocks) ? blockData.blocks : [];
      updateCounts();
      renderRecords();
      message($('#globalMessage'), 'Data is up to date.', 'success');
    } catch(err) {
      message($('#globalMessage'), err.message, 'error');
    }
  }
  function renderRecords() {
    const listing = $('#bookingListing').value;
    const status = $('#bookingStatus').value;
    const sort = $('#recordSort').value;
    let records = allRecords().filter(r => r.category === activeCategory);
    if (listing) records = records.filter(r => (r.data.listingId || r.data.listing_id) === listing);
    if (status) records = records.filter(r => r.kind === 'booking' && String(r.data.status || '').toLowerCase() === status);
    records.sort((a, b) => {
      const da = a.date || '', db = b.date || '';
      if (sort === 'month-asc') return da.slice(0, 7).localeCompare(db.slice(0, 7)) || da.localeCompare(db);
      if (sort === 'month-desc') return db.slice(0, 7).localeCompare(da.slice(0, 7)) || db.localeCompare(da);
      return db.localeCompare(da);
    });
    const titles = { booking: 'Booking', whatsapp: 'WhatsApp', airbnb: 'Airbnb / Agoda', maintenance: 'Maintenance', cancelled: 'Cancelled' };
    $('#recordsHeading').textContent = titles[activeCategory] || 'Booking';
    $('#recordsCount').textContent = `${records.length} record${records.length === 1 ? '' : 's'}`;
    const host = $('#bookingsList');
    host.innerHTML = '';
    if (!records.length) {
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = 'No records in this category match these filters.';
      host.append(p);
      return;
    }
    records.forEach(record => {
      if (record.kind === 'booking') renderBookingCard(host, record.data);
      else renderBlockCard(host, record.data);
    });
  }
  function action(text, fn, kind='') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `small-button ${kind}`.trim();
    b.textContent = text;
    b.addEventListener('click', fn);
    return b;
  }
  function renderBookingCard(host, b) {
    const card = document.createElement('article');
    card.className = 'item-card';
    const top = document.createElement('div');
    top.className = 'item-top';
    const left = document.createElement('div');
    const h = document.createElement('h3');
    h.textContent = b.listingName || b.listing_name || 'Homestay';
    const ref = document.createElement('div');
    ref.className = 'meta';
    ref.textContent = `Ref: ${b.reference || b.id || '—'}`;
    left.append(h, ref);
    const pill = document.createElement('span');
    pill.className = `pill ${String(b.status || '').toLowerCase()}`;
    pill.textContent = b.status || 'booking';
    top.append(left, pill);
    const meta = document.createElement('p');
    meta.className = 'meta';
    const checkin = b.checkin || '';
    const checkout = b.checkout || '';
    const nights = b.nights != null ? ` · ${b.nights} nights` : '';
    meta.textContent = `${checkin} → ${checkout}${nights}\n${b.guestName || b.guest_name || 'Guest'} · ${b.guestPhone || b.guest_phone || ''}${(b.guestEmail || b.guest_email) ? ' · '+(b.guestEmail || b.guest_email) : ''}\n${b.guests ?? '—'} guest(s) · Source: ${b.source || 'website'}${b.totalAmount != null ? ' · RM '+Number(b.totalAmount).toFixed(2) : ''}${b.notes ? '\nNotes: '+b.notes : ''}`;
    meta.style.whiteSpace = 'pre-line';
    card.append(top, meta);
    const actions = document.createElement('div');
    actions.className = 'item-actions';
    const status = String(b.status || '').toLowerCase();
    if (status === 'pending') {
      actions.append(action('Confirm', () => updateBooking(b.id, 'confirmed')), action('Reject', () => updateBooking(b.id, 'rejected'), 'danger'));
    }
    if (status === 'pending' || status === 'confirmed') {
      actions.append(action('Cancel booking', () => updateBooking(b.id, 'cancelled'), 'danger'));
    }
    if (actions.childElementCount) card.append(actions);
    host.append(card);
  }
  function renderBlockCard(host, b) {
    const card = document.createElement('article');
    card.className = 'item-card';
    const top = document.createElement('div');
    top.className = 'item-top';
    const left = document.createElement('div');
    const h = document.createElement('h3');
    h.textContent = b.listingName || b.listing_name || 'Homestay';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${b.startDate || ''} → ${b.endDate || ''}\nReason: ${b.source || 'admin'}${b.label ? ' · '+b.label : ''}${b.notes ? '\n'+b.notes : ''}`;
    meta.style.whiteSpace = 'pre-line';
    left.append(h, meta);
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = sourceOf(b) === 'agoda' ? 'Airbnb / Agoda' : (b.source || 'block');
    top.append(left, pill);
    card.append(top);
    const actions = document.createElement('div');
    actions.className = 'item-actions';
    actions.append(action('Remove block', async () => {
      if (!confirm(`Remove ${b.source} block for ${b.startDate} to ${b.endDate}?`)) return;
      try {
        await api('/api/blocks', { method: 'DELETE', body: JSON.stringify({ id: b.id }) });
        message($('#globalMessage'), 'Block removed.', 'success');
        await refreshAll();
      } catch(err) { message($('#globalMessage'), err.message, 'error'); }
    }, 'danger'));
    card.append(actions);
    host.append(card);
  }
  async function updateBooking(id, status) {
    if (!confirm(`Change booking status to ${status}?`)) return;
    try {
      await api('/api/bookings', { method: 'PATCH', body: JSON.stringify({ id, status }) });
      message($('#globalMessage'), `Booking updated: ${status}.`, 'success');
      await refreshAll();
    } catch(err) { message($('#globalMessage'), err.message, 'error'); }
  }

  $('#blockForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const msg = $('#blockMessage');
    message(msg, 'Saving block…');
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await api('/api/blocks', { method: 'POST', body: JSON.stringify(values) });
      message(msg, 'Dates blocked successfully.', 'success');
      form.reset();
      $('#manualBlockDetails').open = false;
      await refreshAll();
    } catch(err) {
      message(msg, err.message, 'error');
    } finally { btn.disabled = false; }
  });

  const saved = sessionStorage.getItem('wwAdminToken');
  if (saved) {
    token = saved;
    api('/api/bookings?status=pending').then(() => { showDashboard(); refreshAll(); }).catch(() => lock());
  }
})();