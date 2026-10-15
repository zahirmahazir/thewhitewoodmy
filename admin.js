(() => {
  const $ = (s) => document.querySelector(s);
  const loginPanel = $('#loginPanel'), dashboard = $('#dashboard');
  const tokenInput = $('#tokenInput'), loginMessage = $('#loginMessage');
  let token = '';
  let allBookings = [];
  let allBlocks = [];
  let allPayments = [];
  let activeCategory = 'booking';
  let activeView = 'bookings';

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

  document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
  document.querySelectorAll('[data-category]').forEach(btn => btn.addEventListener('click', () => {
    activeCategory = btn.dataset.category;
    document.querySelectorAll('[data-category]').forEach(b => b.classList.toggle('active', b === btn));
    renderRecords();
  }));
  $('#bookingListing').addEventListener('change', renderRecords);
  $('#recordSource').addEventListener('change', renderRecords);
  $('#recordMonth').addEventListener('change', renderRecords);
  $('#bookingStatus').addEventListener('change', () => {
    if ($('#bookingStatus').value === 'cancelled') setCategory('cancelled');
    else if (activeCategory === 'cancelled') setCategory('booking');
    renderRecords();
  });
  $('#recordSort').addEventListener('change', renderRecords);
  $('#earningsPeriod').addEventListener('change', renderEarnings);
  $('#earningsSource').addEventListener('change', renderEarnings);
  $('#earningsYear').addEventListener('change', renderEarnings);

  function setView(view) {
    activeView = view;
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $('#bookingsTab').classList.toggle('hidden', view !== 'bookings');
    $('#earningsTab').classList.toggle('hidden', view !== 'earnings');
    if (view === 'earnings') renderEarnings();
  }

  function setCategory(category) {
    activeCategory = category;
    document.querySelectorAll('[data-category]').forEach(b => b.classList.toggle('active', b.dataset.category === category));
  }
  function sourceOf(item) { return String(item.source || '').trim().toLowerCase(); }
  function isCancelled(b) { return String(b.status || '').toLowerCase() === 'cancelled'; }
  function bookingCategory(b) {
    if (isCancelled(b)) return 'cancelled';
    if (String(b.status || '').toLowerCase() === 'completed') return 'completed';
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
  function populateRecordMonths() {
    const select=$('#recordMonth'); if(!select)return; const current=select.value; const months=new Set(allRecords().map(r=>(r.date||'').slice(0,7)).filter(v=>/^\d{4}-\d{2}$/.test(v)));
    select.innerHTML='<option value="">All months</option>'+[...months].sort().reverse().map(v=>{const [y,m]=v.split('-').map(Number);const label=new Date(y,m-1,1).toLocaleDateString('en-GB',{month:'long',year:'numeric'});return `<option value="${v}">${label}</option>`;}).join('');
    if(months.has(current))select.value=current;
  }
  function updateCounts() {
    const records = allRecords();
    const counts = {
      booking: records.filter(r => r.category === 'booking').length,
      whatsapp: records.filter(r => r.category === 'whatsapp').length,
      airbnb: records.filter(r => r.category === 'airbnb').length,
      maintenance: records.filter(r => r.category === 'maintenance').length,
      cancelled: records.filter(r => r.category === 'cancelled').length,
      completed: records.filter(r => r.category === 'completed').length
    };
    Object.entries(counts).forEach(([key, value]) => {
      const el = $(`#count${key[0].toUpperCase()}${key.slice(1)}`);
      if (el) el.textContent = value;
    });
  }
  async function refreshAll() {
    message($('#globalMessage'), 'Refreshing…');
    try {
      const [bookingData, blockData, paymentData] = await Promise.all([api('/api/bookings'), api('/api/blocks'), api('/api/earnings')]);
      allBookings = Array.isArray(bookingData.bookings) ? bookingData.bookings : [];
      allBlocks = Array.isArray(blockData.blocks) ? blockData.blocks : [];
      allPayments = Array.isArray(paymentData.payments) ? paymentData.payments : [];
      populateEarningsYears();
      populateRecordMonths();
      updateCounts();
      renderRecords();
      renderEarnings();
      message($('#globalMessage'), 'Data is up to date.', 'success');
    } catch(err) {
      message($('#globalMessage'), err.message, 'error');
    }
  }
  function renderRecords() {
    const listing = $('#bookingListing').value;
    const status = $('#bookingStatus').value;
    const selectedSource = $('#recordSource').value;
    const selectedMonth = $('#recordMonth').value;
    const sort = $('#recordSort').value;
    let records = allRecords().filter(r => r.category === activeCategory);
    if (listing) records = records.filter(r => (r.data.listingId || r.data.listing_id) === listing);
    if (status) records = records.filter(r => r.kind === 'booking' && String(r.data.status || '').toLowerCase() === status);
    if (selectedSource) records = records.filter(r => { const src=sourceOf(r.data); if(selectedSource==='airbnb') return src.includes('airbnb')||src.includes('agoda'); if(selectedSource==='private') return !src.includes('website')&&!src.includes('whatsapp')&&!src.includes('airbnb')&&!src.includes('agoda')&&!src.includes('maintenance'); return src.includes(selectedSource); });
    if (selectedMonth) records = records.filter(r => (r.date || '').slice(0,7) === selectedMonth);
    records.sort((a, b) => {
      const da = a.date || '', db = b.date || '';
      if (sort === 'month-asc') return da.slice(0, 7).localeCompare(db.slice(0, 7)) || da.localeCompare(db);
      if (sort === 'month-desc') return db.slice(0, 7).localeCompare(da.slice(0, 7)) || db.localeCompare(da);
      return db.localeCompare(da);
    });
    const titles = { booking: 'Booking', whatsapp: 'WhatsApp', airbnb: 'Airbnb / Agoda', maintenance: 'Maintenance', cancelled: 'Cancelled', completed: 'Completed' };
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
    // Keep the completion action visible for every active booking, not only confirmed cards.
    // This also covers records whose status casing/transition differs from the expected value.
    if (!['completed', 'cancelled', 'rejected'].includes(status)) {
      actions.append(action('✓ Mark completed', () => updateBooking(b.id, 'completed'), 'complete-button'));
    }
    if (status === 'cancelled') {
      actions.append(action('Delete cancelled booking', () => deleteCancelledBooking(b.id, b.reference || b.id), 'danger'));
    }
    const paid = paidTotal(b.id);
    if (paid > 0) {
      const paidLine = document.createElement('p');
      paidLine.className = 'payment-note';
      paidLine.textContent = `Actual paid to date: ${money(paid)}`;
      card.append(paidLine);
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
  async function deleteCancelledBooking(id, reference) {
    if (!confirm(`Permanently delete cancelled booking ${reference}? This cannot be undone.`)) return;
    try {
      await api('/api/booking-delete', { method: 'DELETE', body: JSON.stringify({ id }) });
      message($('#globalMessage'), 'Cancelled booking deleted.', 'success');
      await refreshAll();
    } catch(err) { message($('#globalMessage'), err.message, 'error'); }
  }

  async function updateBooking(id, status) {
    if (!confirm(`Change booking status to ${status}?`)) return;
    try {
      await api('/api/bookings', { method: 'PATCH', body: JSON.stringify({ id, status }) });
      message($('#globalMessage'), `Booking updated: ${status}.`, 'success');
      await refreshAll();
    } catch(err) { message($('#globalMessage'), err.message, 'error'); }
  }

  function paymentsFor(bookingId) {
    return allPayments.filter(p => String(p.bookingId ?? p.booking_id) === String(bookingId));
  }
  function paidTotal(bookingId) { return paymentsFor(bookingId).reduce((sum,p)=>sum+(Number(p.amountPaid ?? p.amount_paid ?? 0)||0),0); }
  function amountFor(b) { return Number(b.totalAmount ?? b.total_amount ?? 0) || 0; }
  function bookingSource(b) {
    const s = sourceOf(b);
    if (s.includes('whatsapp')) return 'whatsapp';
    if (s.includes('airbnb') || s.includes('agoda')) return 'airbnb';
    return 'website';
  }
  function populateEarningsYears() {
    const select = $('#earningsYear');
    if (!select) return;
    const years = new Set([String(new Date().getFullYear())]);
    allBookings.forEach(b => { const d = String(b.checkout || b.checkin || '').slice(0,4); if (/^\d{4}$/.test(d)) years.add(d); });
    allPayments.forEach(p => { const d = String(p.paidAt || p.paid_at || '').slice(0,4); if (/^\d{4}$/.test(d)) years.add(d); });
    const current = select.value || String(new Date().getFullYear());
    select.innerHTML = [...years].sort((a,b)=>Number(b)-Number(a)).map(y=>`<option value="${y}">${y}</option>`).join('');
    select.value = years.has(current) ? current : String(new Date().getFullYear());
  }
  function periodBounds() {
    const period = $('#earningsPeriod').value;
    const year = Number($('#earningsYear').value || new Date().getFullYear());
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === 'week') {
      const start = new Date(end); start.setDate(start.getDate()-6);
      return {start, end, year, period};
    }
    if (period === 'month') {
      const start = new Date(year, now.getFullYear() === year ? now.getMonth() : 0, 1);
      const finish = new Date(year, now.getFullYear() === year ? now.getMonth()+1 : 12, 0);
      return {start, end: finish, year, period};
    }
    return {start:new Date(year,0,1), end:new Date(year,11,31), year, period};
  }
  const isoDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function renderEarnings() {
    if (!$('#earningsChart')) return;
    const period = $('#earningsPeriod').value;
    const source = $('#earningsSource').value;
    const year = Number($('#earningsYear').value || new Date().getFullYear());
    let completed = allBookings.filter(b => String(b.status).toLowerCase() === 'completed');
    if (source) completed = completed.filter(b => bookingSource(b) === source);
    const payments = allPayments.filter(p => {
      const b = allBookings.find(x => String(x.id) === String(p.bookingId || p.booking_id));
      return !source || (b && bookingSource(b) === source);
    });
    const bounds = periodBounds();
    const completedInPeriod = completed.filter(b => {
      const d = String(b.checkout || b.checkin || '').slice(0,10);
      return d >= isoDate(bounds.start) && d <= isoDate(bounds.end);
    });
    const paidInPeriod = payments.filter(p => {
      const d = String(p.paidAt || p.paid_at || '').slice(0,10);
      return d && d >= isoDate(bounds.start) && d <= isoDate(bounds.end);
    });
    const revenue = completedInPeriod.reduce((sum,b)=>sum+amountFor(b),0);
    const paid = paidInPeriod.reduce((sum,p)=>sum+(Number(p.amountPaid ?? p.amount_paid ?? 0)||0),0);
    const outstanding = completedInPeriod.reduce((sum,b)=>sum+Math.max(0, amountFor(b)-paidTotal(b.id)),0);
    $('#completedRevenue').textContent = money(revenue);
    $('#actualPaid').textContent = money(paid);
    $('#outstandingRevenue').textContent = money(outstanding);
    $('#earningsChartTitle').textContent = period === 'week' ? 'Daily earnings · last 7 days' : period === 'month' ? 'Daily earnings · selected month' : `Monthly earnings · ${year}`;
    $('#earningsChartCaption').textContent = `${completedInPeriod.length} completed stay(s) · ${paidInPeriod.length} payment record(s)`;
    renderEarningsChart(completedInPeriod, paidInPeriod, period, year);
    renderPaymentBookings(source);
  }
  function money(n) { return 'RM ' + Number(n || 0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function renderEarningsChart(completed, payments, period, year) {
    const host = $('#earningsChart'); host.innerHTML = '';
    const now = new Date(); let buckets = [];
    if (period === 'week') {
      for (let i=6;i>=0;i--) { const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i); buckets.push({key:isoDate(d),label:d.toLocaleDateString('en-GB',{weekday:'short'}),revenue:0,paid:0}); }
    } else if (period === 'month') {
      const y = Number($('#earningsYear').value || now.getFullYear());
      const m = y === now.getFullYear() ? now.getMonth() : 0;
      const days = new Date(y,m+1,0).getDate();
      for(let i=1;i<=days;i++){const d=new Date(y,m,i);buckets.push({key:isoDate(d),label:String(i),revenue:0,paid:0});}
    } else {
      for(let m=0;m<12;m++) buckets.push({key:`${year}-${String(m+1).padStart(2,'0')}`,label:new Date(year,m,1).toLocaleDateString('en-GB',{month:'short'}),revenue:0,paid:0});
    }
    const keyFor = (date) => period === 'year' ? String(date).slice(0,7) : String(date).slice(0,10);
    completed.forEach(b=>{const k=keyFor(b.checkout || b.checkin || '');const bucket=buckets.find(x=>x.key===k);if(bucket)bucket.revenue+=amountFor(b);});
    payments.forEach(p=>{const k=keyFor(p.paidAt || p.paid_at || '');const bucket=buckets.find(x=>x.key===k);if(bucket)bucket.paid+=Number(p.amountPaid ?? p.amount_paid ?? 0)||0;});
    const max=Math.max(1,...buckets.map(b=>Math.max(b.revenue,b.paid)));
    const chart=document.createElement('div');chart.className='chart-bars';
    buckets.forEach(b=>{const col=document.createElement('div');col.className='chart-column';const vals=document.createElement('div');vals.className='chart-value';vals.textContent=`${b.label}\n${Math.round(b.revenue)} / ${Math.round(b.paid)}`;const bars=document.createElement('div');bars.className='bar-pair';const rev=document.createElement('span');rev.className='bar revenue-bar';rev.style.height=`${Math.max(2,b.revenue/max*100)}%`;rev.title=`Completed Revenue: ${money(b.revenue)}`;const actual=document.createElement('span');actual.className='bar paid-bar';actual.style.height=`${Math.max(2,b.paid/max*100)}%`;actual.title=`Actual Paid: ${money(b.paid)}`;bars.append(rev,actual);const label=document.createElement('small');label.textContent=b.label;col.append(bars,label);col.title=`${b.label}: Revenue ${money(b.revenue)} · Paid ${money(b.paid)}`;chart.append(col);});
    host.append(chart);
    const legend=document.createElement('div');legend.className='chart-legend';legend.innerHTML='<span><i class="legend-swatch revenue-swatch"></i> Completed Revenue</span><span><i class="legend-swatch paid-swatch"></i> Actual Paid</span>';host.append(legend);
  }
  function renderPaymentBookings(source) {
    const host=$('#paymentBookings');host.innerHTML='';
    const list=allBookings.filter(b=>!['cancelled','rejected'].includes(String(b.status).toLowerCase())).filter(b=>!source||bookingSource(b)===source).sort((a,b)=>String(b.checkin||'').localeCompare(String(a.checkin||'')));
    if(!list.length){host.innerHTML='<p class="muted">No bookings available for payment records.</p>';return;}
    list.forEach(b=>{
      const paidRecords=paymentsFor(b.id);const paid=paidTotal(b.id);const card=document.createElement('article');card.className='item-card';
      const title=document.createElement('h3');title.textContent=b.listingName||b.listing_name||'Homestay';
      const meta=document.createElement('p');meta.className='meta';meta.textContent=`${b.guestName||b.guest_name||'Guest'} · ${b.checkin||''} → ${b.checkout||''}\nSource: ${b.source||'website'} · Booking value: ${money(amountFor(b))}\nTotal actually paid: ${money(paid)} · Balance: ${money(Math.max(0,amountFor(b)-paid))}`;meta.style.whiteSpace='pre-line';
      const history=document.createElement('div');history.className='payment-history';
      if(paidRecords.length){const historyTitle=document.createElement('strong');historyTitle.textContent='Payment history';history.append(historyTitle);paidRecords.slice().sort((a,b)=>String(b.paidAt||b.paid_at||'').localeCompare(String(a.paidAt||a.paid_at||''))).forEach(p=>{const line=document.createElement('p');line.className='meta';line.textContent=`${p.paidAt||p.paid_at} · ${money(p.amountPaid ?? p.amount_paid)}${p.note?' · '+p.note:''}`;history.append(line);});}
      const form=document.createElement('form');form.className='payment-form';
      const amountLabel=document.createElement('label');amountLabel.textContent='New payment received (RM)';const amount=document.createElement('input');amount.type='number';amount.min='0.01';amount.step='0.01';amount.required=true;amount.placeholder='e.g. 100.00';amountLabel.append(amount);
      const dateLabel=document.createElement('label');dateLabel.textContent='Payment date';const date=document.createElement('input');date.type='date';date.required=true;date.value=new Date().toISOString().slice(0,10);dateLabel.append(date);
      const noteLabel=document.createElement('label');noteLabel.textContent='Payment note (optional)';const note=document.createElement('input');note.type='text';note.maxLength=250;note.placeholder='e.g. deposit / balance';noteLabel.append(note);
      const save=document.createElement('button');save.type='submit';save.className='small-button';save.textContent='＋ Add payment';form.append(amountLabel,dateLabel,noteLabel,save);
      form.addEventListener('submit',async e=>{e.preventDefault();save.disabled=true;try{await api('/api/earnings',{method:'POST',body:JSON.stringify({bookingId:String(b.id),amountPaid:Number(amount.value),paidAt:date.value,note:note.value})});message($('#globalMessage'),'Payment recorded.','success');const result=await api('/api/earnings');allPayments=result.payments||[];renderRecords();renderEarnings();}catch(err){message($('#globalMessage'),err.message,'error');}finally{save.disabled=false;}});
      card.append(title,meta);if(paidRecords.length)card.append(history);card.append(form);host.append(card);
    });
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