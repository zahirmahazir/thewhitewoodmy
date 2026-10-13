// ========================================
// EDIT SECTION: GALLERY / SLIDER BEHAVIOUR
// ========================================
const GALLERY_AUTO_SLIDE_MS = 4000; // Auto-slide every 4 seconds
const GALLERY_PAUSE_AFTER_INTERACTION_MS = 6500;


// ========================================
// EDIT SECTION: GENERAL BOOKING SETTINGS
// ========================================
const MINIMUM_NIGHTS = 2;

/*
=========================================================
THE WHITE WOOD — JAVASCRIPT EDIT GUIDE
Search for "EDIT SECTION" to find the main editable areas.
=========================================================
*/

/*
=========================================================
EDIT GUIDE: EACH LISTING IS INDEPENDENT
---------------------------------------------------------
The White Wood:
  buttons: { availability, details, showAvailability, showDetails }

Rumah Puteh:
  buttons: { availability, details, showAvailability, showDetails }

You can change one listing without changing the other.
Example:
  availability:"Book now"
  details:"View details"
  showAvailability:false
  showDetails:true
=========================================================
*/

/* =====================================================
   EDIT SECTION: HOMESTAY DATA
   - Change name, location, price and gallery labels here.
   - Change amenities here.
   - The White Wood pricing uses the multi-night formula below.
   ===================================================== */
const listings = [
  {
    id:"white-wood",
    name:"The White Wood Homestay",
    location:"Penang, Malaysia",

    // EDIT SECTION: THE WHITE WOOD PRICING
    pricing:{
      firstNight:230,
      nextNight:220,
      discountPerExtraNight:10
    },

    images:["assets/images/white-wood/whitewood1.jpg","assets/images/white-wood/whitewood2.jpg","assets/images/white-wood/whitewood3.jpg"],
    desc:"A bright and comfortable homestay for families, couples and small groups.",
    amenities:["WiFi","Air conditioning","Parking","Kitchen"],

    // EDIT SECTION: THE WHITE WOOD BUTTONS
    buttons:{
      availability:"Check availability",
      details:"Details",
      showAvailability:true,
      showDetails:true
    }
  },

  {
    id:"rumah-puteh",
    name:"Coming Soon",
    location:"Stay Tuned",

    // EDIT SECTION: RUMAH PUTEH PRICING
    pricing:{
      firstNight:150,
      nextNight:150,
      discountPerExtraNight:0
    },

    images:["assets/images/rumah-puteh/rumahputeh1.jpg","assets/images/rumah-puteh/rumahputeh2.jpg","assets/images/rumah-puteh/rumahputeh3.jpg"],
    desc:"Coming soon. For your next stay.",
    amenities:["WiFi","Air conditioning","Parking","Family friendly"],

    // EDIT SECTION: RUMAH PUTEH BUTTONS
    buttons:{
      availability:"Check availability",
      details:"Details",
      showAvailability:true,
      showDetails:true
    }
  }
];

let cart = JSON.parse(localStorage.getItem("ww_cart") || "[]");

function money(n){return "RM " + n.toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}


const amenityIcons = {
  "WiFi": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 8.8a13.5 13.5 0 0 1 17 0M6.7 12.1a8.5 8.5 0 0 1 10.6 0M9.8 15.3a4 4 0 0 1 4.4 0M12 19h.01"/></svg>`,
  "Air conditioning": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M6 5v3M12 5v3M18 5v3M12 8v11M8 13l-2 2M16 13l2 2M9 19h6"/></svg>`,
  "Parking": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20V4h6a4 4 0 0 1 0 8H7M17 20h2M5 20h14"/></svg>`,
  "Kitchen": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4v7M8 4v7M5 8h3M6.5 11v9M13 4v16M17 4v16M13 9h6"/></svg>`,
  "Family friendly": `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="7" r="2.5"/><circle cx="16" cy="7" r="2.5"/><path d="M3.5 19a4.5 4.5 0 0 1 9 0M11.5 19a4.5 4.5 0 0 1 9 0"/></svg>`
};
function amenityHTML(a){
  return `<span class="amenity-icon" title="${a}">${amenityIcons[a] || `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>`}<span>${a}</span></span>`;
}


/* =====================================================
   PRICING CALCULATION
   Each listing has its own pricing section above.
   Edit "THE WHITE WOOD PRICING" or "RUMAH PUTEH PRICING"
   without affecting the other listing.
   ===================================================== */
function getStayPricing(x, nights){
  if(!nights || nights <= 0) return {gross:0, discount:0, total:0};

  const p = x.pricing;
  const gross = p.firstNight + Math.max(0, nights - 1) * p.nextNight;
  const discount = Math.max(0, nights - 1) * p.discountPerExtraNight;

  return {
    gross,
    discount,
    total:gross - discount
  };
}

function renderListings(){
  document.getElementById("listingGrid").innerHTML = listings.map(x=>`
    <article class="card">
      <div class="gallery listing-gallery" data-gallery="${x.id}">
        <div class="gallery-track">
          ${x.images.map((img,i)=>`<div class="gallery-slide card-img"><img src="${img}" alt="${x.name} image ${i+1}" loading="lazy"></div>`).join("")}
        </div>
        <button class="gallery-prev" aria-label="Previous image">‹</button>
        <button class="gallery-next" aria-label="Next image">›</button>
        <div class="gallery-counter">1 / ${x.images.length}</div>
        <div class="gallery-dots"></div>
      </div>
      <div class="card-body">
        <div class="card-top"><div><h3>${x.name}</h3><div class="location">${x.location}</div></div><div class="price">${money(x.pricing.firstNight)}<small>/1st night</small></div></div>
        <p class="desc">${x.desc}</p>
        <div class="amenities">${x.amenities.map(amenityHTML).join("")}</div>
        <div class="card-actions">
          ${x.buttons?.showAvailability !== false ? `<button class="gold-btn" onclick="openBooking('${x.id}')">${x.buttons?.availability || "Check availability"}</button>` : ""}
          ${x.buttons?.showDetails !== false ? `<button class="outline-btn" onclick="openDetails('${x.id}')">${x.buttons?.details || "Details"}</button>` : ""}
        </div>
      </div>
    </article>`).join("");
}
function openModal(html){document.getElementById("modalContent").innerHTML=html;document.getElementById("modal").classList.remove("hidden")}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
function getListing(id){return listings.find(x=>x.id===id)}

function openDetails(id){
 const x=getListing(id);
 openModal(`<p class="eyebrow">LISTING</p><h3>${x.name}</h3><p class="location">${x.location}</p>
 <div class="gallery modal-gallery" data-gallery="details-${x.id}">
   <div class="gallery-track">${x.images.map((img,i)=>`<div class="gallery-slide card-img"><img src="${img}" alt="${x.name} image ${i+1}" loading="lazy"></div>`).join("")}</div>
   <button class="gallery-prev" aria-label="Previous image">‹</button>
   <button class="gallery-next" aria-label="Next image">›</button>
   <div class="gallery-counter">1 / ${x.images.length}</div>
   <div class="gallery-dots"></div>
 </div>
 <p class="desc">${x.desc}</p><div class="amenities">${x.amenities.map(amenityHTML).join("")}</div><button class="gold-btn" onclick="openBooking('${id}')">Check availability & book</button>`);
 initGalleries(document.getElementById("modalContent"));
}

/* EDIT SECTION: AVAILABILITY + BOOKING MODAL */
/* EDIT SECTION: RESPONSIVE BOOKING DATE-RANGE CALENDAR */
let calendarViewDate = new Date();
calendarViewDate.setDate(1);
calendarViewDate.setHours(0,0,0,0);

function openBooking(id){
 const x=getListing(id);
 calendarViewDate = new Date();
 calendarViewDate.setDate(1);
 calendarViewDate.setHours(0,0,0,0);
 openModal(`<p class="eyebrow">BOOK YOUR STAY</p><h3>${x.name}</h3>
 <div class="booking-grid booking-grid-range">
   <div class="field date-range-field">
     <label>SELECT CHECK-IN &amp; CHECK-OUT</label>
     <button type="button" id="dateRangeToggle" class="date-range-toggle" onclick="toggleDateCalendar()">
       <span id="dateRangeLabel">Choose your dates</span><span aria-hidden="true">▦</span>
     </button>
     <button type="button" class="reselect-checkin-btn" onclick="startReselectCheckin()">Change check-in date</button>
     <input id="checkin" type="hidden">
     <input id="checkout" type="hidden">
     <div class="selected-date-summary" aria-live="polite">
       <span><small>CHECK-IN</small><strong id="checkinDisplay">Choose date</strong></span>
       <span class="date-summary-arrow" aria-hidden="true">→</span>
       <span><small>CHECK-OUT</small><strong id="checkoutDisplay">Choose date</strong></span>
     </div>
     <div id="dateRangeCalendar" class="date-range-calendar" aria-label="Choose stay dates"></div>
   </div>
   <div class="field guests-field"><label>GUESTS</label><select id="guests"><option>1 guest</option><option>2 guests</option><option>3 guests</option><option>4 guests</option><option>5+ guests</option></select></div>
 </div>
 <div id="availability" class="availability">Select your dates to check availability.</div>
 <div class="summary">
   <div id="nightBreakdown"></div>
   <div id="discountRow"></div>
   <div id="estimate" class="summary-row total"><span>Estimated total</span><strong>-</strong></div>
 </div>
 <button id="addBookingBtn" class="gold-btn" style="width:100%;margin-top:20px" onclick="addBooking('${id}')" disabled>Add to booking</button>`);
 renderDateRangeCalendar();
}

function localISODate(date){
 const y=date.getFullYear(), m=String(date.getMonth()+1).padStart(2,"0"), d=String(date.getDate()).padStart(2,"0");
 return `${y}-${m}-${d}`;
}
function parseLocalDate(value){
 if(!value) return null;
 const [y,m,d]=value.split("-").map(Number);
 return new Date(y,m-1,d);
}
function formatStayDate(value){
 const date=typeof value==="string" ? parseLocalDate(value) : value;
 return date ? date.toLocaleDateString("en-MY",{day:"numeric",month:"short",year:"numeric"}) : "Choose date";
}
function toggleDateCalendar(){
 const cal=document.getElementById("dateRangeCalendar");
 if(!cal) return;
 cal.classList.toggle("is-open");
 renderDateRangeCalendar();
}
function startReselectCheckin(){
 const checkin=document.getElementById("checkin");
 const checkout=document.getElementById("checkout");
 if(!checkin || !checkout) return;
 // Preserve the current check-in as a visual starting point, but clear checkout
 // so the next calendar tap is interpreted as a new check-in.
 checkout.value="";
 syncSelectedDateSummary();
 const cal=document.getElementById("dateRangeCalendar");
 if(cal) cal.classList.add("is-open");
 renderDateRangeCalendar();
 checkAvailability();
}
function changeCalendarMonth(delta){
 calendarViewDate.setMonth(calendarViewDate.getMonth()+delta);
 renderDateRangeCalendar();
}
function selectCalendarDate(value){
 const checkin=document.getElementById("checkin");
 const checkout=document.getElementById("checkout");
 if(!checkin || !checkout) return;
 const picked=parseLocalDate(value);
 const today=new Date(); today.setHours(0,0,0,0);
 if(picked < today) return;

 if(!checkin.value || !checkout.value){
   // No complete date range yet: first tap is check-in, second tap is checkout.
   // If a checkout was already selected, a fresh calendar session starts with check-in.
   if(!checkin.value){
     checkin.value=value;
     checkout.value="";
   } else {
     const startDate=parseLocalDate(checkin.value);
     if(picked <= startDate){
       checkin.value=value;
       checkout.value="";
     } else {
       // Keep short stays selected so the red minimum-stay warning can be shown.
       checkout.value=value;
       const minCheckout=new Date(startDate);
       minCheckout.setDate(minCheckout.getDate()+MINIMUM_NIGHTS);
       const cal=document.getElementById("dateRangeCalendar");
       if(cal && picked >= minCheckout) cal.classList.remove("is-open");
     }
   }
 } else {
   // Existing range is complete: the next tap begins a NEW check-in selection.
   checkin.value=value;
   checkout.value="";
 }
 syncSelectedDateSummary();
 renderDateRangeCalendar();
 updateCheckoutMinimum();
 checkAvailability();
}
function syncSelectedDateSummary(){
 const a=document.getElementById("checkin")?.value || "";
 const b=document.getElementById("checkout")?.value || "";
 const aDisplay=document.getElementById("checkinDisplay");
 const bDisplay=document.getElementById("checkoutDisplay");
 const label=document.getElementById("dateRangeLabel");
 if(aDisplay) aDisplay.textContent=formatStayDate(a);
 if(bDisplay) bDisplay.textContent=formatStayDate(b);
 if(label) label.textContent=a && b ? `${formatStayDate(a)} → ${formatStayDate(b)}` : a ? `${formatStayDate(a)} → Select checkout` : "Choose your dates";
}
const calendarBlockedDates = new Map();
let calendarAvailabilityRequest = 0;
function dateRangeDays(start, end){
 const out=[]; let d=parseLocalDate(start); const stop=parseLocalDate(end);
 while(d && d<stop && out.length<370){out.push(localISODate(d));d.setDate(d.getDate()+1)}
 return out;
}
function blockedForListing(id){return calendarBlockedDates.get(id) || new Set()}
async function loadCalendarBlockedDates(){
 const id=window.currentBookingId;
 if(!id) return;
 const version=++calendarAvailabilityRequest;
 const first=new Date(calendarViewDate.getFullYear(),calendarViewDate.getMonth(),1);
 const last=new Date(calendarViewDate.getFullYear(),calendarViewDate.getMonth()+2,1);
 const start=localISODate(first), end=localISODate(last);
 try{
  const params=new URLSearchParams({listingId:id,mode:'calendar',start,end});
  const response=await fetch(`/api/availability?${params.toString()}`,{headers:{Accept:'application/json'},cache:'no-store'});
  const data=await response.json();
  if(version!==calendarAvailabilityRequest || !response.ok || !Array.isArray(data.ranges)) return;
  const blocked=new Set();
  for(const range of data.ranges){
   for(const day of dateRangeDays(range.start_date,range.end_date)) blocked.add(day);
  }
  calendarBlockedDates.set(id,blocked);
  renderDateRangeCalendar(false);
 }catch(error){
  // Do not silently mark dates as available if the calendar range lookup fails.
  const cal=document.getElementById('dateRangeCalendar');
  if(cal) cal.dataset.availabilityError='true';
 }
}
function calendarMonthHTML(monthDate){
 const year=monthDate.getFullYear(), month=monthDate.getMonth();
 const first=new Date(year,month,1);
 const daysInMonth=new Date(year,month+1,0).getDate();
 const mondayOffset=(first.getDay()+6)%7;
 const checkin=document.getElementById("checkin")?.value || "";
 const checkout=document.getElementById("checkout")?.value || "";
 const blocked=blockedForListing(window.currentBookingId);
 const today=new Date(); today.setHours(0,0,0,0);
 let days="";
 for(let i=0;i<mondayOffset;i++) days+='<span class="calendar-day empty" aria-hidden="true"></span>';
 for(let day=1;day<=daysInMonth;day++){
   const date=new Date(year,month,day);
   const value=localISODate(date);
   const occupied=blocked.has(value);
   const choosingCheckout=!!checkin && !checkout && value>checkin;
   // Occupied nights cannot be chosen as check-in. A blocked date may still be a
   // valid checkout boundary, so allow it as checkout and let server range-check decide.
   const disabled=date<today || (occupied && !choosingCheckout);
   const isStart=value===checkin, isEnd=value===checkout;
   const inRange=checkin && checkout && value>checkin && value<checkout;
   const classes=["calendar-day",isStart?"range-start":"",isEnd?"range-end":"",inRange?"range-middle":"",occupied?"is-booked":"",disabled?"is-disabled":""].filter(Boolean).join(" ");
   const label=occupied ? `${formatStayDate(value)}, unavailable` : formatStayDate(value);
   days+=`<button type="button" class="${classes}" ${disabled?'disabled':''} onclick="selectCalendarDate('${value}')" aria-label="${label}" title="${occupied?'Booked / blocked':'Available to select'}">${day}</button>`;
 }
 return `<section class="calendar-month"><h4>${monthDate.toLocaleDateString("en-MY",{month:"long",year:"numeric"})}</h4><div class="calendar-weekdays"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div><div class="calendar-days">${days}</div></section>`;
}
function renderDateRangeCalendar(loadAvailability=true){
 const cal=document.getElementById("dateRangeCalendar");
 if(!cal) return;
 const next=new Date(calendarViewDate); next.setMonth(next.getMonth()+1);
 cal.innerHTML=`<div class="calendar-toolbar"><button type="button" aria-label="Previous month" onclick="changeCalendarMonth(-1)">‹</button><button type="button" aria-label="Next month" onclick="changeCalendarMonth(1)">›</button></div><div class="calendar-months">${calendarMonthHTML(calendarViewDate)}${calendarMonthHTML(next)}</div><div class="calendar-footer"><span>${document.getElementById("checkin")?.value && !document.getElementById("checkout")?.value ? `Choose checkout (minimum ${MINIMUM_NIGHTS} nights)` : "Select check-in, then check-out"}</span><button type="button" onclick="document.getElementById('dateRangeCalendar').classList.remove('is-open')">Done</button></div>`;
 if(loadAvailability) loadCalendarBlockedDates();
}
function updateCheckoutMinimum(){
 // Do not erase a checkout under two nights: retain it so checkAvailability()
 // can show the visible red minimum-stay message and let the guest correct it.
 syncSelectedDateSummary();
}
function nights(){
 const a=document.getElementById("checkin")?.value,b=document.getElementById("checkout")?.value;
 if(!a||!b)return 0;
 return Math.max(0,(new Date(b)-new Date(a))/86400000);
}
function cartHasOverlap(listingId, checkin, checkout){
  return cart.some(item =>
    item.listingId === listingId &&
    checkin < item.checkout &&
    checkout > item.checkin
  );
}

let availabilityRequestVersion = 0;
function setAddBookingEnabled(enabled){
 const button=document.getElementById('addBookingBtn');
 if(button) button.disabled=!enabled;
}
async function checkAvailability(){
 const n=nights(), box=document.getElementById("availability"), est=document.getElementById("estimate");
 const breakdown=document.getElementById("nightBreakdown"), discountRow=document.getElementById("discountRow");
 if(!n){
   setAddBookingEnabled(false);
   box.className="availability";box.textContent="Select valid check-in and check-out dates.";
   if(est)est.innerHTML="<span>Estimated total</span><strong>-</strong>";
   if(breakdown)breakdown.innerHTML="";
   if(discountRow)discountRow.innerHTML="";
   return;
 }
 if(n < MINIMUM_NIGHTS){
   setAddBookingEnabled(false);
   box.className="availability unavailable";
   box.innerHTML=`❌ Minimum stay is ${MINIMUM_NIGHTS} nights.<br>Please select at least ${MINIMUM_NIGHTS} nights.`;
   if(est)est.innerHTML="<span>Estimated total</span><strong>-</strong>";
   if(breakdown)breakdown.innerHTML="";
   if(discountRow)discountRow.innerHTML="";
   return;
 }
 const id=window.currentBookingId, x=getListing(id);
 const a=document.getElementById("checkin")?.value;
 const b=document.getElementById("checkout")?.value;
 if(cartHasOverlap(id,a,b)){
   setAddBookingEnabled(false);
   box.className="availability unavailable";
   box.innerHTML='❌ These dates overlap with another booking in your cart.<br>Please review your cart.';
   if(est)est.innerHTML="<span>Estimated total</span><strong>-</strong>";
   return;
 }
 const requestVersion=++availabilityRequestVersion;
 setAddBookingEnabled(false);
 box.className="availability";
 box.textContent="Checking availability…";
 try {
   const params=new URLSearchParams({listingId:id,checkin:a,checkout:b});
   const response=await fetch(`/api/availability?${params.toString()}`,{headers:{Accept:'application/json'},cache:'no-store'});
   const result=await response.json();
   if(requestVersion!==availabilityRequestVersion) return;
   if(!response.ok) throw new Error(result.error || 'Availability check failed.');
   if(result.available){
     setAddBookingEnabled(true);
     box.className="availability";
     box.innerHTML='<span class="available">✓ Available</span> — Dates are currently available. Availability is checked again when you submit.';
   } else {
     setAddBookingEnabled(false);
     box.className="availability unavailable";
     box.innerHTML=result.reason==='minimum_stay'
       ? `❌ Minimum stay is ${result.minimumNights} nights.<br>Please select at least ${result.minimumNights} nights.`
       : '<strong>NOT AVAILABLE</strong><br>These dates are already booked or blocked. Please choose other dates.';
   }
 } catch(error) {
   if(requestVersion!==availabilityRequestVersion) return;
   setAddBookingEnabled(false);
   box.className="availability unavailable";
   box.textContent="Unable to check availability. Please try again.";
 }
 const p=getStayPricing(x,n);
 if(breakdown) breakdown.innerHTML = `<div class="summary-row"><span>${n} night${n>1?"s":""}</span><strong>${money(p.gross)}</strong></div>`;
 if(discountRow) discountRow.innerHTML = p.discount > 0 ? `<div class="summary-row discount-row"><span>Multi-night discount</span><strong>− ${money(p.discount)}</strong></div>` : "";
 if(est)est.innerHTML=`<span>Estimated total (${n} night${n>1?"s":""})</span><strong class="gold">${money(p.total)}</strong>`;
}
window.currentBookingId=null;
const oldOpenBooking=openBooking;
openBooking=function(id){window.currentBookingId=id;oldOpenBooking(id)}

/* EDIT SECTION: ADD BOOKING TO CART */
async function addBooking(id){
 const a=document.getElementById("checkin").value,b=document.getElementById("checkout").value,n=nights();
 if(!a||!b||n<=0){showToast("Please select valid check-in and check-out dates.");return}
 if(n < MINIMUM_NIGHTS){
   const box=document.getElementById("availability");
   if(box){
     box.className="availability unavailable";
     box.innerHTML=`❌ Minimum stay is ${MINIMUM_NIGHTS} nights.<br>Please select at least ${MINIMUM_NIGHTS} nights.`;
   }
   return;
 }
 if(cartHasOverlap(id,a,b)){
   const box=document.getElementById("availability");
   if(box){
     box.className="availability unavailable";
     box.innerHTML='❌ These dates overlap with another booking in your cart.<br>Please review your cart.';
   }
   setAddBookingEnabled(false);
   return;
 }
 // Re-check on the server at click time; calendar state can be stale.
 setAddBookingEnabled(false);
 try{
   const params=new URLSearchParams({listingId:id,checkin:a,checkout:b});
   const response=await fetch(`/api/availability?${params.toString()}`,{headers:{Accept:'application/json'},cache:'no-store'});
   const result=await response.json();
   if(!response.ok || !result.available){
     const box=document.getElementById("availability");
     if(box){box.className="availability unavailable";box.innerHTML=result.reason==='minimum_stay' ? `❌ Minimum stay is ${result.minimumNights || MINIMUM_NIGHTS} nights.<br>Please select at least ${result.minimumNights || MINIMUM_NIGHTS} nights.` : '<strong>NOT AVAILABLE</strong><br>These dates are already booked or blocked. Please choose other dates.';}
     renderDateRangeCalendar();
     return;
   }
 }catch(error){
   const box=document.getElementById("availability");
   if(box){box.className="availability unavailable";box.textContent="Unable to verify availability. Please try again.";}
   return;
 }
 const x=getListing(id);
 const pricing=getStayPricing(x,n);
 cart=[{id:crypto.randomUUID(),listingId:id,name:x.name,checkin:a,checkout:b,nights:n,guests:document.getElementById("guests").value,total:pricing.total,discount:pricing.discount},...cart];
 saveCart();closeModal();showToast("Stay added to your booking.");
}
function saveCart(){localStorage.setItem("ww_cart",JSON.stringify(cart));document.getElementById("cartCount").textContent=cart.length}
/* EDIT SECTION: CART / BOOKING SUMMARY */
function openCart(){
 if(!cart.length){openModal('<p class="eyebrow">YOUR BOOKING</p><h3>Your cart is empty</h3><p class="desc">Choose a homestay and check your dates to start a booking.</p><a class="gold-btn" href="#listings" onclick="closeModal()">Browse listings</a>');return}
 const total=cart.reduce((s,x)=>s+x.total,0);
 openModal(`<p class="eyebrow">YOUR BOOKING</p><h3>Review your stay</h3>
 <div class="checkout-items">${cart.map(x=>`<div class="summary-row"><span><strong>${x.name}</strong><br><small>${x.checkin} → ${x.checkout} · ${x.guests}${x.discount ? ` · Discount −${money(x.discount)}` : ""}</small></span><strong class="gold">${money(x.total)}</strong></div>`).join("")}</div>
 <div class="summary"><div class="summary-row total"><span>Total</span><strong class="gold">${money(total)}</strong></div></div>
 <button class="gold-btn" style="width:100%;margin-top:20px" onclick="checkout()">Proceed to payment</button>
 <button class="outline-btn" style="width:100%;margin-top:10px" onclick="clearCart()">Clear booking</button>`);
}
/* EDIT SECTION: CHECKOUT / BOOKING REQUEST
   This creates pending booking requests in D1. Payment is not implemented yet. */
function checkout(){
 const total=cart.reduce((s,x)=>s+x.total,0);
 openModal(`<p class="eyebrow">BOOKING REQUEST</p><h3>Guest details</h3>
 <div class="checkout-items">${cart.map(x=>`<div class="summary-row"><span>${x.name}<br><small>${x.checkin} → ${x.checkout}</small></span><strong class="gold">${money(x.total)}</strong></div>`).join("")}</div>
 <div class="checkout-form">
   <input id="bookingGuestName" autocomplete="name" placeholder="Full name" required>
   <input id="bookingGuestEmail" type="email" autocomplete="email" placeholder="Email address (optional)">
   <input id="bookingGuestPhone" autocomplete="tel" placeholder="Phone number" required>
   <div class="pay-note">This sends a booking request and reserves the dates as pending. It does not take payment or confirm your stay. We will add payment later.</div>
   <button class="gold-btn" id="submitBookingRequest" onclick="submitBookingRequest()">Submit booking request · ${money(total)}</button>
 </div>`);
}
async function submitBookingRequest(){
 const name=document.getElementById('bookingGuestName')?.value.trim();
 const email=document.getElementById('bookingGuestEmail')?.value.trim();
 const phone=document.getElementById('bookingGuestPhone')?.value.trim();
 const button=document.getElementById('submitBookingRequest');
 if(!name||!phone){showToast('Please enter your name and phone number.');return;}
 if(!cart.length){showToast('Your cart is empty.');return;}
 if(button){button.disabled=true;button.textContent='Submitting…';}
 const references=[];
 try {
   for(const item of cart){
     const listingId = item.listingId === 'rumah-puteh' ? 'rumah-puteh' : item.listingId;
     const response=await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({
       listingId,checkin:item.checkin,checkout:item.checkout,guestName:name,guestEmail:email||null,guestPhone:phone,
       guests:Math.max(1,parseInt(String(item.guests).match(/\d+/)?.[0]||'1',10)),source:'website',totalAmount:item.total,
       notes:'Submitted via The White Wood website. Payment not yet implemented.'
     })});
     const result=await response.json();
     if(!response.ok) throw new Error(result.error || (response.status===409?'Not available':'Unable to submit booking request.'));
     references.push(result.reference);
   }
   cart=[];saveCart();
   openModal(`<div style="text-align:center;padding:30px 0"><div style="font-size:45px;color:var(--gold)">✓</div><p class="eyebrow">REQUEST RECEIVED</p><h3>Thank you.</h3><p class="desc">Your booking request is pending review. No payment has been taken and your stay is not confirmed yet.</p><p>Reference${references.length>1?'s':''}: <strong>${references.join(', ')}</strong></p><button class="gold-btn" onclick="closeModal()">Done</button></div>`);
 } catch(error) {
   if(button){button.disabled=false;button.textContent='Try again';}
   const message=error.message==='Not available' ? 'Not available' : (error.message||'Unable to submit booking request.');
   const note=document.createElement('p');note.className='availability unavailable';note.textContent=message;
   document.querySelector('#modalContent .checkout-form')?.appendChild(note);
 }
}
function clearCart(){cart=[];saveCart();closeModal();showToast("Booking cleared.")}
function showToast(t){const e=document.getElementById("toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)}

/* EDIT SECTION: GALLERY / SLIDER BEHAVIOUR */
function initGalleries(root=document){
  root.querySelectorAll(".gallery").forEach(gallery=>{
    if(gallery.dataset.ready==="1") return;
    gallery.dataset.ready="1";

    const track=gallery.querySelector(".gallery-track");
    const slides=[...gallery.querySelectorAll(".gallery-slide")];
    const dots=gallery.querySelector(".gallery-dots");
    const counter=gallery.querySelector(".gallery-counter");
    let current=0, startX=0, deltaX=0;

    slides.forEach((_,i)=>{
      const dot=document.createElement("button");
      dot.type="button";
      dot.className="gallery-dot"+(i===0?" active":"");
      dot.setAttribute("aria-label",`Go to image ${i+1}`);
      dot.onclick=()=>go(i);
      dots.appendChild(dot);
    });

    function go(i){
      current=(i+slides.length)%slides.length;
      track.style.transform=`translate3d(-${current*100}%,0,0)`;
      dots.querySelectorAll(".gallery-dot").forEach((d,n)=>d.classList.toggle("active",n===current));
      if(counter) counter.textContent=`${current+1} / ${slides.length}`;
    }

    gallery.querySelector(".gallery-prev").onclick=()=>go(current-1);
    gallery.querySelector(".gallery-next").onclick=()=>go(current+1);

    track.addEventListener("pointerdown",e=>{
      startX=e.clientX; deltaX=0;
      track.setPointerCapture?.(e.pointerId);
    });
    track.addEventListener("pointermove",e=>{if(startX) deltaX=e.clientX-startX});
    track.addEventListener("pointerup",()=>{
      if(Math.abs(deltaX)>45) go(current+(deltaX<0?1:-1));
      startX=0; deltaX=0;
    });
    track.addEventListener("pointercancel",()=>{startX=0;deltaX=0});
    go(0);
  });
}

renderListings();
initGalleries();
saveCart();


// Minimum-stay validation helper
function validateMinimumNights(nights) {
  if (nights < MINIMUM_NIGHTS) {
    alert(`Minimum stay is ${MINIMUM_NIGHTS} nights.\nPlease select at least ${MINIMUM_NIGHTS} nights.`);
    return false;
  }
  return true;
}


/* ========================================
   AUTO SLIDE GALLERY
   - 4 second interval
   - pauses while hovered/touched
   - resets timer after manual interaction
   ======================================== */
(function initGalleryAutoSlide(){
  const INTERVAL = typeof GALLERY_AUTO_SLIDE_MS !== 'undefined' ? GALLERY_AUTO_SLIDE_MS : 4000;
  const galleries = document.querySelectorAll(
    '.gallery, .hero-gallery, .listing-gallery, [data-gallery], .details-gallery, .modal-gallery'
  );

  galleries.forEach(gallery => {
    let timer = null;
    let resumeTimer = null;
    let paused = false;

    const getNextButton = () =>
      gallery.querySelector(
        '[data-gallery-next], .gallery-next, .next, .slider-next, button[aria-label*="Next"], button[aria-label*="next"]'
      );

    const start = () => {
      clearInterval(timer);
      if (paused) return;
      timer = setInterval(() => {
        const next = getNextButton();
        if (next && !next.disabled) next.click();
      }, INTERVAL);
    };

    const pause = () => {
      paused = true;
      clearInterval(timer);
    };

    const resume = (delay = 0) => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        paused = false;
        start();
      }, delay);
    };

    gallery.addEventListener('mouseenter', pause);
    gallery.addEventListener('mouseleave', () => resume(300));
    gallery.addEventListener('touchstart', pause, {passive:true});
    gallery.addEventListener('touchend', () => resume(6500), {passive:true});

    gallery.addEventListener('click', e => {
      if (e.target.closest('button, [role="button"], .dot, .indicator')) {
        resume(6500);
      }
    });

    start();
  });
})();


// ========================================
// EDIT SECTION: SCROLL PROGRESS METER
// ========================================
(function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  const update = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
