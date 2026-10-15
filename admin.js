(() => {
  const $ = (s) => document.querySelector(s);
  const loginPanel = $('#loginPanel'), dashboard = $('#dashboard');
  const tokenInput = $('#tokenInput'), loginMessage = $('#loginMessage');
  let token = '';
  let allBookings = [], allBlocks = [], activeCategory = 'booking';
  const headers = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
  function message(el, text, kind='') { el.textContent = text || ''; el.className = `message ${kind}`.trim(); }
  async function api(path, options={}) {
    const response = await fetch(path, { ...options, headers: { ...headers(), ...(options.headers || {}) }, cache: 'no-store' });
    let data = {}; try { data = await response.json(); } catch { data = { error: 'Server returned an unreadable response.' }; }
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }
  function showDashboard() { loginPanel.classList.add('hidden'); dashboard.classList.remove('hidden'); $('#logoutBtn').classList.remove('hidden'); }
  function lock() { token=''; tokenInput.value=''; sessionStorage.removeItem('wwAdminToken'); dashboard.classList.add('hidden'); loginPanel.classList.remove('hidden'); $('#logoutBtn').classList.add('hidden'); }
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault(); token=tokenInput.value.trim(); message(loginMessage,'Checking token…');
    try { await api('/api/bookings?status=pending'); sessionStorage.setItem('wwAdminToken', token); showDashboard(); await refreshAll(); message(loginMessage,''); }
    catch(err) { token=''; message(loginMessage, err.message, 'error'); }
  });
  $('#logoutBtn').addEventListener('click', lock);
  $('#refreshBtn').addEventListener('click', refreshAll);
  $('#bookingListing').addEventListener('change', renderRecords);
  $('#bookingStatus').addEventListener('change', renderRecords);
  document.querySelectorAll('[data-category]').forEach(btn => btn.addEventListener('click', () => {
    activeCategory = btn.dataset.category;
    document.querySelectorAll('[data-category]').forEach(b => b.classList.toggle('active', b === btn));
    renderRecords();
  }));

  async function refreshAll() {
    message($('#globalMessage'),'Refreshing…');
    try {
      const [bookingData, blockData] = await Promise.all([api('/api/bookings'), api('/api/blocks')]);
      allBookings = Array.isArray(bookingData.bookings) ? bookingData.bookings : [];
      allBlocks = Array.isArray(blockData.blocks) ? blockData.blocks : [];
      renderRecords();
      message($('#globalMessage'),'Data is up to date.','success');
    } catch(err) { message($('#globalMessage'),err.message,'error'); }
  }

  function sourceCategory(source) {
    const s = String(source || '').toLowerCase().trim();
    if (s.includes('whatsapp') || s === 'wa') return 'whatsapp';
    if (s.includes('airbnb')) return 'airbnb';
    return 'booking';
  }
  function bookingCategory(b) {
    if (String(b.status || '').toLowerCase() === 'cancelled') return 'cancelled';
    return sourceCategory(b.source);
  }
  function allRecords() {
    const bookings = allBookings.map(b => ({ kind:'booking', category:bookingCategory(b), data:b }));
    const blocks = allBlocks.map(b => ({ kind:'block', category:sourceCategory(b.source), data:b }));
    return [...bookings, ...blocks].sort((a,b) => {
      const da = a.kind === 'booking' ? a.data.checkin : a.data.startDate;
      const db = b.kind === 'booking' ? b.data.checkin : b.data.startDate;
      return String(da || '').localeCompare(String(db || ''));
    });
  }
  function renderRecords() {
    const records = allRecords();
    const counts = { booking:0, whatsapp:0, airbnb:0, cancelled:0 };
    records.forEach(r => counts[r.category]++);
    $('#countBooking').textContent = counts.booking;
    $('#countWhatsapp').textContent = counts.whatsapp;
    $('#countAirbnb').textContent = counts.airbnb;
    $('#countCancelled').textContent = counts.cancelled;

    const labels = { booking:'Booking', whatsapp:'WhatsApp', airbnb:'Airbnb', cancelled:'Cancelled' };
    $('#recordsHeading').textContent = labels[activeCategory];
    const listing = $('#bookingListing').value;
    const status = $('#bookingStatus').value;
    const visible = records.filter(r => {
      if (r.category !== activeCategory) return false;
      const d = r.data;
      if (listing && d.listingId !== listing) return false;
      if (status && (r.kind !== 'booking' || d.status !== status)) return false;
      return true;
    });
    const host = $('#bookingsList');
    host.innerHTML = '';
    $('#recordsCount').textContent = `${visible.length} record${visible.length === 1 ? '' : 's'}`;
    if (!visible.length) {
      const p = document.createElement('p'); p.className='muted';
      p.textContent = `No ${labels[activeCategory].toLowerCase()} records match these filters.`;
      host.append(p); return;
    }
    visible.forEach(r => host.append(r.kind === 'booking' ? bookingCard(r.data) : blockCard(r.data)));
  }
  function action(text,fn,kind='') {
    const b=document.createElement('button'); b.type='button'; b.className=`small-button ${kind}`; b.textContent=text; b.addEventListener('click',fn); return b;
  }
  function makeMeta(text) { const el=document.createElement('p'); el.className='meta'; el.textContent=text; el.style.whiteSpace='pre-line'; return el; }
  function bookingCard(b) {
    const card=document.createElement('article'); card.className='item-card';
    const top=document.createElement('div'); top.className='item-top';
    const left=document.createElement('div'), h=document.createElement('h3'); h.textContent=b.listingName || 'Homestay';
    const ref=document.createElement('div'); ref.className='meta'; ref.textContent=`Ref: ${b.reference || '—'}`; left.append(h,ref);
    const pill=document.createElement('span'); pill.className=`pill ${String(b.status||'').toLowerCase()}`; pill.textContent=b.status || 'booking'; top.append(left,pill); card.append(top);
    card.append(makeMeta(`${b.checkin || ''} → ${b.checkout || ''} · ${b.nights ?? '—'} nights\n${b.guestName || 'Guest'} · ${b.guestPhone || ''}${b.guestEmail?' · '+b.guestEmail:''}\n${b.guests ?? '—'} guest(s) · Source: ${b.source || 'website'}${b.totalAmount!=null?' · RM '+Number(b.totalAmount).toFixed(2):''}${b.notes?'\nNotes: '+b.notes:''}`));
    const actions=document.createElement('div'); actions.className='item-actions';
    if(b.status==='pending') actions.append(action('Confirm',()=>updateBooking(b.id,'confirmed')),action('Reject',()=>updateBooking(b.id,'rejected'),'danger'));
    if(b.status==='pending'||b.status==='confirmed') actions.append(action('Cancel booking',()=>updateBooking(b.id,'cancelled'),'danger'));
    if(actions.children.length) card.append(actions);
    return card;
  }
  function blockCard(b) {
    const card=document.createElement('article'); card.className='item-card';
    const top=document.createElement('div'); top.className='item-top';
    const left=document.createElement('div'), h=document.createElement('h3'); h.textContent=b.listingName || 'Homestay';
    const meta=document.createElement('div'); meta.className='meta'; meta.textContent=`${b.startDate} → ${b.endDate}\nReason: ${b.source}${b.label?' · '+b.label:''}${b.notes?'\n'+b.notes:''}`; meta.style.whiteSpace='pre-line'; left.append(h,meta);
    const pill=document.createElement('span'); pill.className='pill source-pill'; pill.textContent=b.source || 'block'; top.append(left,pill); card.append(top);
    const actions=document.createElement('div'); actions.className='item-actions';
    actions.append(action('Remove block',async()=>{
      if(!confirm(`Remove ${b.source} block for ${b.startDate} to ${b.endDate}?`)) return;
      try { await api('/api/blocks',{method:'DELETE',body:JSON.stringify({id:b.id})}); message($('#globalMessage'),'Block removed.','success'); await refreshAll(); }
      catch(err) { message($('#globalMessage'),err.message,'error'); }
    },'danger'));
    card.append(actions); return card;
  }
  async function updateBooking(id,status) {
    if(!confirm(`Change booking status to ${status}?`)) return;
    try { await api('/api/bookings',{method:'PATCH',body:JSON.stringify({id,status})}); message($('#globalMessage'),`Booking updated: ${status}.`,'success'); await refreshAll(); }
    catch(err) { message($('#globalMessage'),err.message,'error'); }
  }
  $('#blockForm').addEventListener('submit',async e=>{
    e.preventDefault(); const form=e.currentTarget, values=Object.fromEntries(new FormData(form).entries()), msg=$('#blockMessage');
    message(msg,'Saving block…'); const btn=form.querySelector('button[type="submit"]'); btn.disabled=true;
    try { await api('/api/blocks',{method:'POST',body:JSON.stringify(values)}); message(msg,'Dates blocked successfully.','success'); form.reset(); await refreshAll(); }
    catch(err) { message(msg,err.message,'error'); }
    finally { btn.disabled=false; }
  });
  const saved=sessionStorage.getItem('wwAdminToken');
  if(saved) { token=saved; api('/api/bookings?status=pending').then(()=>{showDashboard();refreshAll();}).catch(()=>lock()); }
})();
