(() => {
  const $ = (s) => document.querySelector(s);
  const loginPanel = $('#loginPanel'), dashboard = $('#dashboard');
  const tokenInput = $('#tokenInput'), loginMessage = $('#loginMessage');
  let token = '';
  const headers = () => ({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });
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
  document.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===btn));
    $('#bookingsTab').classList.toggle('hidden',btn.dataset.tab!=='bookings'); $('#blocksTab').classList.toggle('hidden',btn.dataset.tab!=='blocks');
  }));
  $('#refreshBtn').addEventListener('click', refreshAll);
  $('#bookingListing').addEventListener('change', loadBookings); $('#bookingStatus').addEventListener('change', loadBookings);
  async function refreshAll() { message($('#globalMessage'),'Refreshing…'); try { await Promise.all([loadBookings(),loadBlocks()]); message($('#globalMessage'),'Data is up to date.','success'); } catch(err) { message($('#globalMessage'),err.message,'error'); } }
  async function loadBookings() {
    const params=new URLSearchParams(); if($('#bookingListing').value)params.set('listingId',$('#bookingListing').value); if($('#bookingStatus').value)params.set('status',$('#bookingStatus').value);
    const host=$('#bookingsList'); host.innerHTML='<p class="muted">Loading bookings…</p>';
    try { const data=await api(`/api/bookings?${params}`); host.innerHTML=''; if(!data.bookings.length){host.innerHTML='<p class="muted">No bookings match these filters.</p>';return;}
      data.bookings.forEach(b=>{const card=document.createElement('article');card.className='item-card';
        const top=document.createElement('div');top.className='item-top';const left=document.createElement('div');const h=document.createElement('h3');h.textContent=b.listingName;const ref=document.createElement('div');ref.className='meta';ref.textContent=`Ref: ${b.reference}`;left.append(h,ref);const pill=document.createElement('span');pill.className=`pill ${b.status}`;pill.textContent=b.status;top.append(left,pill);
        const meta=document.createElement('p');meta.className='meta';meta.textContent=`${b.checkin} → ${b.checkout} · ${b.nights} nights\n${b.guestName} · ${b.guestPhone}${b.guestEmail?' · '+b.guestEmail:''}\n${b.guests} guest(s) · Source: ${b.source}${b.totalAmount!=null?' · RM '+Number(b.totalAmount).toFixed(2):''}${b.notes?'\nNotes: '+b.notes:''}`;meta.style.whiteSpace='pre-line';card.append(top,meta);
        const actions=document.createElement('div');actions.className='item-actions';
        if(b.status==='pending'){actions.append(action('Confirm',()=>updateBooking(b.id,'confirmed')),action('Reject',()=>updateBooking(b.id,'rejected'),'danger'));}
        if(b.status==='pending'||b.status==='confirmed') actions.append(action('Cancel booking',()=>updateBooking(b.id,'cancelled'),'danger'));
        card.append(actions);host.append(card);
      });
    } catch(err){host.innerHTML='';const p=document.createElement('p');p.className='message error';p.textContent=err.message;host.append(p);throw err;}
  }
  function action(text,fn,kind=''){const b=document.createElement('button');b.type='button';b.className=`small-button ${kind}`;b.textContent=text;b.addEventListener('click',fn);return b;}
  async function updateBooking(id,status){if(!confirm(`Change booking status to ${status}?`))return;try{await api('/api/bookings',{method:'PATCH',body:JSON.stringify({id,status})});message($('#globalMessage'),`Booking updated: ${status}.`,'success');await refreshAll();}catch(err){message($('#globalMessage'),err.message,'error');}}
  async function loadBlocks(){const host=$('#blocksList');host.innerHTML='<p class="muted">Loading blocks…</p>';try{const data=await api('/api/blocks');host.innerHTML='';if(!data.blocks.length){host.innerHTML='<p class="muted">No manual blocks.</p>';return;}data.blocks.forEach(b=>{const card=document.createElement('article');card.className='item-card';const top=document.createElement('div');top.className='item-top';const left=document.createElement('div');const h=document.createElement('h3');h.textContent=b.listingName;const meta=document.createElement('div');meta.className='meta';meta.textContent=`${b.startDate} → ${b.endDate}\nReason: ${b.source}${b.label?' · '+b.label:''}${b.notes?'\n'+b.notes:''}`;meta.style.whiteSpace='pre-line';left.append(h,meta);const pill=document.createElement('span');pill.className='pill';pill.textContent=b.source;top.append(left,pill);card.append(top);const actions=document.createElement('div');actions.className='item-actions';actions.append(action('Remove block',async()=>{if(!confirm(`Remove ${b.source} block for ${b.startDate} to ${b.endDate}?`))return;try{await api('/api/blocks',{method:'DELETE',body:JSON.stringify({id:b.id})});message($('#globalMessage'),'Block removed.','success');await refreshAll();}catch(err){message($('#globalMessage'),err.message,'error');}} ,'danger'));card.append(actions);host.append(card);});}catch(err){host.innerHTML='';const p=document.createElement('p');p.className='message error';p.textContent=err.message;host.append(p);throw err;}}
  $('#blockForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;const values=Object.fromEntries(new FormData(form).entries());const msg=$('#blockMessage');message(msg,'Saving block…');const btn=form.querySelector('button[type="submit"]');btn.disabled=true;try{await api('/api/blocks',{method:'POST',body:JSON.stringify(values)});message(msg,'Dates blocked successfully.','success');form.reset();await refreshAll();}catch(err){message(msg,err.message,'error');}finally{btn.disabled=false;}});
  const saved=sessionStorage.getItem('wwAdminToken'); if(saved){token=saved;api('/api/bookings?status=pending').then(()=>{showDashboard();refreshAll();}).catch(()=>lock());}
})();
