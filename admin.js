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
  let completedPath = { listing: '', year: '', month: '' };
  let expandedCompletedKey = '';

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

  // Keep the front-page toolbar clean: move Manual block beside the main tabs.
  const manualBlockControl = $('#manualBlockDetails');
  const bookingToolbar = $('.booking-toolbar');
  const mainTabs = $('.tabs');
  const earningsTabButton = $('[data-view="earnings"]');
  if (manualBlockControl && bookingToolbar && mainTabs && earningsTabButton) {
    // Keep filter inputs in the DOM for existing rendering logic, but remove them from the visible front page.
    [...bookingToolbar.children].forEach(child => {
      if (child !== manualBlockControl) child.classList.add('admin-front-filter-hidden');
    });
    earningsTabButton.insertAdjacentElement('afterend', manualBlockControl);
    manualBlockControl.classList.add('manual-block-tab-control');
  }

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
    const status = String(b.status || '').toLowerCase();
    if (status === 'cancelled') return 'cancelled';
    if (status === 'completed') return 'completed';
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
    if (activeCategory === 'completed') {
      const completedRecords = allRecords().filter(r => r.category === 'completed');
      renderCompletedHierarchy(completedRecords);
      return;
    }
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
    host.classList.remove('completed-archive-host');
    host.classList.add('cards');
    host.style.display = '';
    host.style.gridTemplateColumns = '';
    host.style.width = '';
    host.style.maxWidth = '';
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
  function recordListingKey(record) {
    const d = record.data || {};
    const raw = String(d.listingId || d.listing_id || '').toLowerCase();
    const name = String(d.listingName || d.listing_name || '').toLowerCase();
    if (raw.includes('rumah-puteh') || raw.includes('rumah_puteh') || name.includes('rumah puteh')) return 'rumah-puteh';
    if (raw.includes('white-wood') || raw.includes('white_wood') || name.includes('white wood')) return 'white-wood';
    return raw || (name ? name.replace(/[^a-z0-9]+/g, '-') : 'white-wood');
  }
  function recordDate(record) {
    const d = record.data || {};
    return String(record.kind === 'block' ? (d.startDate || d.start_date || '') : (d.checkin || d.check_in || d.createdAt || d.created_at || '')).slice(0,10);
  }
  function completedRecordsForPath(records) {
    return records.filter(r => !completedPath.listing || recordListingKey(r) === completedPath.listing)
      .filter(r => !completedPath.year || recordDate(r).slice(0,4) === completedPath.year)
      .filter(r => !completedPath.month || recordDate(r).slice(0,7) === completedPath.month)
      .sort((a,b) => recordDate(b).localeCompare(recordDate(a)));
  }
  function listingTitle(key) {
    return key === 'rumah-puteh' ? 'Rumah Puteh' : key === 'white-wood' ? 'The White Wood Homestay' : key.replace(/-/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
  }
  function navButton(label, onClick) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'small-button completed-back'; b.textContent = label; b.addEventListener('click', onClick); return b;
  }
  function renderCompletedHierarchy(records) {
    const host = $('#bookingsList');
    // Force Completed archive out of the generic two-column .cards grid.
    // Inline styles are intentional: they remain reliable if cached CSS overrides are present.
    host.classList.remove('cards');
    host.classList.add('completed-archive-host');
    host.style.display = 'block';
    host.style.gridTemplateColumns = 'none';
    host.style.width = '100%';
    host.style.maxWidth = 'none';
    host.innerHTML = '';
    const available = records.filter(r => { const key = recordListingKey(r); return key === 'white-wood' || key === 'rumah-puteh' || key; });
    const selected = completedRecordsForPath(available);
    $('#recordsHeading').textContent = completedPath.listing ? `Completed · ${listingTitle(completedPath.listing)}` : 'Completed';
    $('#recordsCount').textContent = `${selected.length} record${selected.length === 1 ? '' : 's'}`;
    const nav = document.createElement('div'); nav.className = 'completed-breadcrumb';
    nav.append(navButton('Completed', () => { completedPath = {listing:'',year:'',month:''}; expandedCompletedKey=''; renderRecords(); }));
    if (completedPath.listing) nav.append(navButton(listingTitle(completedPath.listing), () => { completedPath.year=''; completedPath.month=''; expandedCompletedKey=''; renderRecords(); }));
    if (completedPath.year) nav.append(navButton(completedPath.year, () => { completedPath.month=''; expandedCompletedKey=''; renderRecords(); }));
    if (completedPath.month) nav.append(navButton(new Date(Number(completedPath.month.slice(0,4)), Number(completedPath.month.slice(5,7))-1, 1).toLocaleDateString('en-GB',{month:'long',year:'numeric'}), () => { completedPath.month=''; expandedCompletedKey=''; renderRecords(); }));
    if (completedPath.listing || completedPath.year || completedPath.month) host.append(nav);
    if (!completedPath.listing) {
      const grid = document.createElement('div'); grid.className='completed-listing-grid';
      [
        {key:'white-wood', title:'The White Wood', image:'/images/completed-white-wood-placeholder.svg'},
        {key:'rumah-puteh', title:'Rumah Puteh', image:'/images/completed-rumah-puteh-placeholder.svg'}
      ].forEach(item => {
        const count=available.filter(r=>recordListingKey(r)===item.key).length;
        const card=document.createElement('button'); card.type='button'; card.className='completed-listing-tile';
        const img=document.createElement('img'); img.src=item.image; img.alt=`${item.title} mockup`; 
        const title=document.createElement('strong'); title.textContent=item.title;
        const countText=document.createElement('span'); countText.textContent=`${count} completed record${count===1?'':'s'}`;
        card.append(img,title,countText); card.addEventListener('click',()=>{completedPath={listing:item.key,year:'',month:''};expandedCompletedKey='';renderRecords();}); grid.append(card);
      }); host.append(grid); return;
    }
    if (!completedPath.year) {
      const years = [...new Set(available.filter(r=>recordListingKey(r)===completedPath.listing).map(recordDate).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).map(d=>d.slice(0,4)))].sort().reverse();
      const grid=document.createElement('div'); grid.className='completed-period-grid';
      if (!years.length) { const p=document.createElement('p');p.className='muted';p.textContent='No completed records for this listing yet.';host.append(p);return; }
      years.forEach(year=>{const count=available.filter(r=>recordListingKey(r)===completedPath.listing&&recordDate(r).startsWith(year)).length;const b=document.createElement('button');b.type='button';b.className='completed-period-tile';b.innerHTML=`<strong>${year}</strong><span>${count} record${count===1?'':'s'}</span>`;b.addEventListener('click',()=>{completedPath.year=year;completedPath.month='';expandedCompletedKey='';renderRecords();});grid.append(b);});host.append(grid);return;
    }
    if (!completedPath.month) {
      const months=[...new Set(available.filter(r=>recordListingKey(r)===completedPath.listing&&recordDate(r).startsWith(completedPath.year)).map(recordDate).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).map(d=>d.slice(0,7)))].sort().reverse();
      const grid=document.createElement('div');grid.className='completed-period-grid';
      if(!months.length){const p=document.createElement('p');p.className='muted';p.textContent='No completed records for this year.';host.append(p);return;}
      months.forEach(month=>{const label=new Date(Number(month.slice(0,4)),Number(month.slice(5,7))-1,1).toLocaleDateString('en-GB',{month:'long'});const count=available.filter(r=>recordListingKey(r)===completedPath.listing&&recordDate(r).startsWith(month)).length;const b=document.createElement('button');b.type='button';b.className='completed-period-tile';const h=document.createElement('strong');h.textContent=label;const sub=document.createElement('span');sub.textContent=`${count} record${count===1?'':'s'}`;b.append(h,sub);b.addEventListener('click',()=>{completedPath.month=month;expandedCompletedKey='';renderRecords();});grid.append(b);});host.append(grid);return;
    }
    const monthRecords=selected;
    if(!monthRecords.length){const p=document.createElement('p');p.className='muted';p.textContent='No completed records for this month.';host.append(p);return;}
    const list=document.createElement('div');list.className='completed-record-list';
    monthRecords.forEach(record=>{
      const d=record.data; const key=`${record.kind}:${d.id}`; const summary=document.createElement('article');summary.className='completed-record-card';
      const row=document.createElement('button');row.type='button';row.className='completed-record-summary';
      const main=document.createElement('span');main.className='completed-record-main';
      const status=document.createElement('span');status.className='pill completed';status.textContent='Completed';
      const price=document.createElement('strong');price.className='completed-record-price';price.textContent=money(d.totalAmount ?? d.total_amount ?? 0);
      const top=document.createElement('span');top.className='completed-record-top';top.append(status,price);
      const title=document.createElement('strong');title.className='completed-record-date';title.textContent=stayDateTitle(d.checkin||d.check_in||d.startDate,d.checkout||d.check_out||d.endDate,d.nights);
      const subtitle=document.createElement('span');subtitle.className='completed-record-listing';subtitle.textContent=d.listingName||d.listing_name||listingTitle(completedPath.listing);
      const ref=document.createElement('span');ref.className='completed-record-meta';ref.textContent=`Ref: ${d.reference||d.id||'—'}`;
      const guest=document.createElement('span');guest.className='completed-record-meta';guest.textContent=`${d.guestName||d.guest_name||d.label||'Guest'}${(d.guestPhone||d.guest_phone)?' · '+(d.guestPhone||d.guest_phone):''}${(d.guestEmail||d.guest_email)?' · '+(d.guestEmail||d.guest_email):''}`;
      main.append(top,title,subtitle,ref,guest);row.append(main);const hint=document.createElement('span');hint.className='completed-expand-hint';hint.textContent='View details';row.append(hint);row.addEventListener('click',()=>openCompletedDetails(record));summary.append(row);
      list.append(summary);
    });host.append(list);
  }

  function openCompletedDetails(record) {
    closeCompletedDetails();
    const d = record.data || {};
    const overlay = document.createElement('div'); overlay.className = 'completed-modal-overlay'; overlay.setAttribute('role','presentation');
    const dialog = document.createElement('section'); dialog.className = 'completed-modal'; dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true'); dialog.setAttribute('aria-labelledby','completedModalTitle');
    const head = document.createElement('header'); head.className = 'completed-modal-header';
    const heading = document.createElement('h2'); heading.id = 'completedModalTitle'; heading.textContent = 'Stay details';
    const close = document.createElement('button'); close.type='button'; close.className='completed-modal-close'; close.setAttribute('aria-label','Close details'); close.textContent='×'; close.addEventListener('click',closeCompletedDetails);
    head.append(heading,close);
    const body = document.createElement('div'); body.className='completed-modal-body';
    const summary = document.createElement('div'); summary.className='completed-modal-summary';
    const statusPrice = document.createElement('div'); statusPrice.className='completed-modal-status-price';
    const pill = document.createElement('span'); pill.className='pill completed'; pill.textContent='Completed';
    const price = document.createElement('strong'); price.textContent=money(d.totalAmount ?? d.total_amount ?? 0);
    statusPrice.append(pill,price);
    const dateTitle = document.createElement('h3'); dateTitle.textContent=stayDateTitle(d.checkin||d.check_in||d.startDate,d.checkout||d.check_out||d.endDate,d.nights);
    const listing = document.createElement('strong'); listing.className='completed-modal-listing'; listing.textContent=d.listingName||d.listing_name||listingTitle(completedPath.listing);
    const ref = document.createElement('p'); ref.className='meta'; ref.textContent=`Ref: ${d.reference||d.id||'—'}`;
    const guest = document.createElement('p'); guest.className='meta'; guest.textContent=`${d.guestName||d.guest_name||d.label||'Guest'}${(d.guestPhone||d.guest_phone)?' · '+(d.guestPhone||d.guest_phone):''}${(d.guestEmail||d.guest_email)?' · '+(d.guestEmail||d.guest_email):''}`;
    summary.append(statusPrice,dateTitle,listing,ref,guest); body.append(summary);
    const payments = paymentsFor(d.id);
    if (payments.length) {
      const section = document.createElement('section'); section.className='completed-modal-section';
      const title = document.createElement('h3'); title.textContent='Payment history'; section.append(title);
      payments.slice().sort((a,b)=>String(b.paidAt||b.paid_at||'').localeCompare(String(a.paidAt||a.paid_at||''))).forEach(payment=>{
        const line=document.createElement('div'); line.className='completed-modal-payment';
        const date=document.createElement('span'); date.textContent=payment.paidAt||payment.paid_at||'—';
        const amount=document.createElement('strong'); amount.textContent=money(payment.amountPaid ?? payment.amount_paid ?? 0);
        line.append(date,amount); if(payment.note){const note=document.createElement('small');note.className='completed-modal-payment-note';note.textContent=payment.note;line.append(note);} section.append(line);
      });
      const total=document.createElement('div');total.className='completed-modal-total';const label=document.createElement('strong');label.textContent='Total received';const value=document.createElement('strong');value.textContent=money(paidTotal(d.id));total.append(label,value);section.append(total);body.append(section);
    }
    if(d.notes){const section=document.createElement('section');section.className='completed-modal-section';const title=document.createElement('h3');title.textContent='Notes';const notes=document.createElement('p');notes.textContent=d.notes;section.append(title,notes);body.append(section);}
    const detailHost=document.createElement('div');detailHost.className='completed-modal-extra';
    if(record.kind==='booking') renderBookingCard(detailHost,d); else renderBlockCard(detailHost,d);
    // The modal summary already contains the date, listing and reference. Keep only useful details/actions/attachments.
    const renderedCard=detailHost.querySelector('.item-card');
    if(renderedCard){
      renderedCard.querySelector('.item-top')?.remove();
      renderedCard.querySelector('.stay-date-title')?.remove();
      renderedCard.querySelector('.stay-listing-subtitle')?.remove();
      renderedCard.querySelector('.meta')?.remove();
      const paymentNote=renderedCard.querySelector('.payment-note'); if(paymentNote) paymentNote.remove();
      const actionBlock=renderedCard.querySelector('.item-actions');
      if(actionBlock || renderedCard.querySelector('.attachment-tools')) body.append(detailHost);
    }
    const footer=document.createElement('footer');footer.className='completed-modal-footer';const done=document.createElement('button');done.type='button';done.className='small-button';done.textContent='Close';done.addEventListener('click',closeCompletedDetails);footer.append(done);
    dialog.append(head,body,footer);overlay.append(dialog);overlay.addEventListener('click',e=>{if(e.target===overlay)closeCompletedDetails();});document.body.append(overlay);document.addEventListener('keydown',completedModalEscape);close.focus();
  }
  function completedModalEscape(event){if(event.key==='Escape')closeCompletedDetails();}
  function closeCompletedDetails(){const overlay=document.querySelector('.completed-modal-overlay');if(overlay)overlay.remove();document.removeEventListener('keydown',completedModalEscape);}

  function action(text, fn, kind='') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `small-button ${kind}`.trim();
    b.textContent = text;
    b.addEventListener('click', fn);
    return b;
  }
  function renderAttachmentTools(card, recordType, recordId) {
    const wrap = document.createElement('section'); wrap.className = 'attachment-tools';
    const title = document.createElement('strong'); title.textContent = 'Attachments';
    const list = document.createElement('div'); list.className = 'attachment-list';
    const form = document.createElement('form'); form.className = 'attachment-form';
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*,application/pdf'; input.multiple = true; input.setAttribute('aria-label','Upload image or PDF reference');
    const submit = document.createElement('button'); submit.type = 'submit'; submit.className = 'small-button'; submit.textContent = '＋ Attach image / PDF';
    form.append(input,submit);
    async function load(){
      try {
        const data = await api(`/api/attachments?recordType=${encodeURIComponent(recordType)}&recordId=${encodeURIComponent(recordId)}`);
        list.innerHTML='';
        (data.attachments||[]).forEach(a=>{
          const row=document.createElement('div'); row.className='attachment-row';
          const link=document.createElement('a'); link.href='#'; link.className='attachment-link'; const isImage=String(a.mimeType||a.mime_type||'').startsWith('image/'); link.textContent=isImage?'🖼️ Image':'📄 PDF'; link.title=a.fileName||'Open attachment'; link.setAttribute('aria-label', `${isImage?'Image':'PDF'} attachment: ${a.fileName||''}`); link.addEventListener('click',async ev=>{ev.preventDefault();try{const full=await api(`/api/attachments?recordType=${encodeURIComponent(recordType)}&recordId=${encodeURIComponent(recordId)}&attachmentId=${encodeURIComponent(a.id)}&include=content`);const blob=await (await fetch(full.attachment.dataUrl)).blob();const url=URL.createObjectURL(blob);const opener=document.createElement('a');opener.href=url;opener.target='_blank';opener.rel='noopener';opener.download=a.fileName;document.body.append(opener);opener.click();opener.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(err){message($('#globalMessage'),err.message,'error');}});
          const del=action('Remove',async()=>{if(!confirm(`Delete attachment ${a.fileName}?`))return;try{await api('/api/attachments',{method:'DELETE',body:JSON.stringify({id:a.id})});await load();}catch(err){message($('#globalMessage'),err.message,'error');}},'danger');
          row.append(link,del);list.append(row);
        });
        if(!list.children.length){const empty=document.createElement('small');empty.className='muted';empty.textContent='No attachments yet.';list.append(empty);}
      } catch(err){list.textContent='Unable to load attachments: '+err.message;}
    }
    form.addEventListener('submit',async e=>{
      e.preventDefault(); const files=Array.from(input.files||[]); if(!files.length)return;
      if(files.length>5){message($('#globalMessage'),'Attach up to 5 files at a time.','error');return;}
      submit.disabled=true;
      try {
        for(const file of files){
          if(!(file.type.startsWith('image/')||file.type==='application/pdf')) throw new Error('Only image and PDF files are allowed.');
          if(file.size>1024*1024) throw new Error(`${file.name} is over 1 MB. Please use a smaller file.`);
          const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Could not read file.'));r.readAsDataURL(file);});
          await api('/api/attachments',{method:'POST',body:JSON.stringify({recordType,recordId:String(recordId),fileName:file.name,mimeType:file.type,dataUrl})});
        }
        input.value=''; message($('#globalMessage'),'Attachment uploaded.','success'); await load();
      }catch(err){message($('#globalMessage'),err.message,'error');}finally{submit.disabled=false;}
    });
    wrap.append(title,list,form);card.append(wrap);load();
  }

  function stayDateTitle(start, end, explicitNights) {
    const startText = String(start || '').slice(0, 10);
    const endText = String(end || '').slice(0, 10);
    let nights = Number(explicitNights);
    if (!Number.isFinite(nights) || nights <= 0) {
      const a = Date.parse(`${startText}T00:00:00Z`);
      const z = Date.parse(`${endText}T00:00:00Z`);
      nights = Number.isFinite(a) && Number.isFinite(z) ? Math.max(0, Math.round((z-a)/86400000)) : 0;
    }
    const dates = startText && endText ? `${startText} → ${endText}` : (startText || endText || 'Stay dates not set');
    return `${dates}${nights > 0 ? ` · ${nights} night${nights === 1 ? '' : 's'}` : ''}`;
  }

  function renderBookingCard(host, b) {
    const card = document.createElement('article');
    card.className = 'item-card';
    const top = document.createElement('div');
    top.className = 'item-top';
    const left = document.createElement('div');
    const h = document.createElement('h3');
    h.className = 'stay-date-title';
    h.textContent = stayDateTitle(b.checkin || b.check_in, b.checkout || b.check_out, b.nights);
    const listing = document.createElement('div');
    listing.className = 'stay-listing-subtitle';
    listing.textContent = b.listingName || b.listing_name || 'Homestay';
    const ref = document.createElement('div');
    ref.className = 'meta';
    ref.textContent = `Ref: ${b.reference || b.id || '—'}`;
    left.append(h, listing, ref);
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
    renderAttachmentTools(card, 'booking', b.id);
    host.append(card);
  }
  function renderBlockCard(host, b) {
    const card = document.createElement('article');
    card.className = 'item-card';
    const top = document.createElement('div');
    top.className = 'item-top';
    const left = document.createElement('div');
    const h = document.createElement('h3');
    h.className = 'stay-date-title';
    h.textContent = stayDateTitle(b.startDate, b.endDate, b.nights);
    const listing = document.createElement('div');
    listing.className = 'stay-listing-subtitle';
    listing.textContent = b.listingName || b.listing_name || 'Homestay';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${b.startDate || ''} → ${b.endDate || ''}\nReason: ${b.source || 'admin'}${b.label ? ' · '+b.label : ''}${b.guestPhone ? '\nPhone: '+b.guestPhone : ''}${b.guestEmail ? '\nEmail: '+b.guestEmail : ''}${b.totalAmount != null ? '\nBooking value: '+money(b.totalAmount) : ''}${b.notes ? '\n'+b.notes : ''}`;
    meta.style.whiteSpace = 'pre-line';
    left.append(h, listing, meta);
    const status = String(b.status || 'confirmed').toLowerCase();
    const pill = document.createElement('span');
    pill.className = `pill ${status}`;
    pill.textContent = status === 'cancelled' || status === 'completed' || status === 'pending' || status === 'confirmed'
      ? status
      : (sourceOf(b) === 'agoda' ? 'Airbnb / Agoda' : (b.source || 'block'));
    top.append(left, pill);
    card.append(top);
    const actions = document.createElement('div');
    actions.className = 'item-actions';
    const externalStay = ['whatsapp', 'airbnb', 'agoda', 'private'].includes(sourceOf(b));
    if (externalStay && status === 'pending') {
      actions.append(action('Confirm', () => updateBlock(b.id, 'confirmed')));
    }
    if (externalStay && ['pending', 'confirmed'].includes(status)) {
      actions.append(action('Cancel booking', () => updateBlock(b.id, 'cancelled'), 'danger'));
      actions.append(action('✓ Mark completed', () => updateBlock(b.id, 'completed'), 'complete-button'));
    }
    if (status === 'cancelled') {
      actions.append(action('Delete cancelled booking', async () => {
        if (!confirm(`Permanently delete cancelled ${b.source} stay ${b.startDate} to ${b.endDate}? This cannot be undone.`)) return;
        try {
          await api('/api/blocks', { method: 'DELETE', body: JSON.stringify({ id: b.id }) });
          message($('#globalMessage'), 'Cancelled external stay deleted.', 'success');
          await refreshAll();
        } catch(err) { message($('#globalMessage'), err.message, 'error'); }
      }, 'danger'));
    } else if (!externalStay || status === 'completed') {
      actions.append(action('Remove block', async () => {
        if (!confirm(`Remove ${b.source} block for ${b.startDate} to ${b.endDate}?`)) return;
        try {
          await api('/api/blocks', { method: 'DELETE', body: JSON.stringify({ id: b.id }) });
          message($('#globalMessage'), 'Block removed.', 'success');
          await refreshAll();
        } catch(err) { message($('#globalMessage'), err.message, 'error'); }
      }, 'danger'));
    }
    if (actions.childElementCount) card.append(actions);
    renderAttachmentTools(card, 'block', b.id);
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

  async function updateBlock(id, status) {
    if (!confirm(`Change external stay status to ${status}?`)) return;
    try {
      await api('/api/blocks', { method: 'PATCH', body: JSON.stringify({ id, status }) });
      message($('#globalMessage'), `External stay updated: ${status}.`, 'success');
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
    [...allBookings,...allBlocks].forEach(b => { const d = String(b.checkout || b.endDate || b.checkin || b.startDate || '').slice(0,4); if (/^\d{4}$/.test(d)) years.add(d); });
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
    const earningsRecords = [...allBookings, ...allBlocks.filter(b => ['whatsapp','airbnb','agoda','private'].includes(sourceOf(b))).map(b => ({...b, _externalBlock:true, checkin:b.startDate, checkout:b.endDate, totalAmount:b.totalAmount, guestName:b.label || 'External stay'}))];
    let completed = earningsRecords.filter(b => String(b.status).toLowerCase() === 'completed');
    if (source) completed = completed.filter(b => bookingSource(b) === source);
    const payments = allPayments.filter(p => {
      const b = earningsRecords.find(x => String(x.id) === String(p.bookingId || p.booking_id));
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
    const external=allBlocks.filter(x=>['whatsapp','airbnb','agoda','private'].includes(sourceOf(x))).map(x=>({...x,_externalBlock:true,checkin:x.startDate,checkout:x.endDate,totalAmount:x.totalAmount,guestName:x.label||'External stay',listingName:x.listingName}));
    const list=[...allBookings,...external].filter(b=>!['cancelled','rejected','completed'].includes(String(b.status).toLowerCase())).filter(b=>!source||bookingSource(b)===source).sort((a,b)=>String(b.checkin||'').localeCompare(String(a.checkin||'')));
    if(!list.length){host.innerHTML='<p class="muted">No bookings available for payment records.</p>';return;}
    list.forEach(b=>{
      const paidRecords=paymentsFor(b.id);const paid=paidTotal(b.id);const card=document.createElement('article');card.className='item-card';
      const title=document.createElement('h3');title.className='stay-date-title';title.textContent=stayDateTitle(b.checkin||b.startDate,b.checkout||b.endDate,b.nights);
      const subtitle=document.createElement('div');subtitle.className='stay-listing-subtitle';subtitle.textContent=b.listingName||b.listing_name||'Homestay';
      const meta=document.createElement('p');meta.className='meta';meta.textContent=`${b.guestName||b.guest_name||b.label||'Guest'} · ${b.guestPhone||b.guest_phone||''}${(b.guestEmail||b.guest_email)?' · '+(b.guestEmail||b.guest_email):''}\nSource: ${b.source||'website'} · Booking value: ${money(amountFor(b))}\nTotal actually paid: ${money(paid)} · Balance: ${money(Math.max(0,amountFor(b)-paid))}`;meta.style.whiteSpace='pre-line';
      const history=document.createElement('div');history.className='payment-history';
      if(paidRecords.length){const historyTitle=document.createElement('strong');historyTitle.textContent='Payment history';history.append(historyTitle);paidRecords.slice().sort((a,b)=>String(b.paidAt||b.paid_at||'').localeCompare(String(a.paidAt||a.paid_at||''))).forEach(p=>{const line=document.createElement('p');line.className='meta';line.textContent=`${p.paidAt||p.paid_at} · ${money(p.amountPaid ?? p.amount_paid)}${p.note?' · '+p.note:''}`;history.append(line);});}
      const completeBtn = (amountFor(b)>0 && paid>=amountFor(b) && String(b.status).toLowerCase()!=='completed') ? action('✓ Mark completed',()=>b._externalBlock?updateBlock(b.id,'completed'):updateBooking(b.id,'completed'),'complete-button') : null;
      const form=document.createElement('form');form.className='payment-form';
      const amountLabel=document.createElement('label');amountLabel.textContent='New payment received (RM)';const amount=document.createElement('input');amount.type='number';amount.min='0.01';amount.step='0.01';amount.required=true;amount.placeholder='e.g. 100.00';amountLabel.append(amount);
      const dateLabel=document.createElement('label');dateLabel.textContent='Payment date';const date=document.createElement('input');date.type='date';date.required=true;date.value=new Date().toISOString().slice(0,10);dateLabel.append(date);
      const noteLabel=document.createElement('label');noteLabel.textContent='Payment note (optional)';const note=document.createElement('input');note.type='text';note.maxLength=250;note.placeholder='e.g. deposit / balance';noteLabel.append(note);
      const save=document.createElement('button');save.type='submit';save.className='small-button';save.textContent='＋ Add payment';form.append(amountLabel,dateLabel,noteLabel,save);
      form.addEventListener('submit',async e=>{e.preventDefault();save.disabled=true;try{await api('/api/earnings',{method:'POST',body:JSON.stringify({bookingId:String(b.id),amountPaid:Number(amount.value),paidAt:date.value,note:note.value})});message($('#globalMessage'),'Payment recorded.','success');const result=await api('/api/earnings');allPayments=result.payments||[];renderRecords();renderEarnings();}catch(err){message($('#globalMessage'),err.message,'error');}finally{save.disabled=false;}});
      card.append(title,subtitle,meta);if(paidRecords.length)card.append(history);if(completeBtn)card.append(completeBtn);card.append(form);renderAttachmentTools(card,b._externalBlock?'block':'booking',b.id);host.append(card);
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