(() => {
  const root = document.getElementById('adminCalendar');
  if (!root) return;
  const form = document.getElementById('blockForm');
  const startInput = document.getElementById('adminStartDate');
  const endInput = document.getElementById('adminEndDate');
  const today = new Date(); today.setHours(0,0,0,0);
  let shown = new Date(today.getFullYear(), today.getMonth(), 1);
  let start = null, end = null;
  let isOpen = false;
  root.hidden = true;
  const pad = n => String(n).padStart(2,'0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parse = s => { if(!s)return null; const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
  const fmt = d => d ? d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'Choose date';
  const same = (a,b) => a && b && iso(a)===iso(b);
  function render(){
    const months = [new Date(shown),new Date(shown.getFullYear(),shown.getMonth()+1,1)];
    root.innerHTML = `<div class="admin-calendar-head"><button class="admin-calendar-nav" type="button" data-move="-1" aria-label="Previous month">‹</button><span style="font-size:12px;color:#8a6420;letter-spacing:.12em">SELECT BLOCK DATES</span><button class="admin-calendar-nav" type="button" data-move="1" aria-label="Next month">›</button></div><div class="admin-calendar-months">${months.map(monthHTML).join('')}</div><div class="admin-calendar-foot"><span>${start ? `START: ${fmt(start)}${end ? `  →  END: ${fmt(end)}` : '  →  Choose checkout'}` : 'Select start date, then end date'}</span><div class="admin-calendar-actions"><button type="button" class="admin-calendar-clear">Clear dates</button><button type="button" class="admin-calendar-done">Done</button></div></div>`;
    root.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>{shown.setMonth(shown.getMonth()+Number(b.dataset.move));render();}));
    root.querySelectorAll('[data-date]').forEach(b=>b.addEventListener('click',()=>choose(parse(b.dataset.date))));
    root.querySelector('.admin-calendar-clear').addEventListener('click',()=>{start=end=null;sync();render();});
    root.querySelector('.admin-calendar-done').addEventListener('click',closeCalendar);
  }
  function monthHTML(month){
    const first = new Date(month.getFullYear(),month.getMonth(),1);
    const offset=(first.getDay()+6)%7;
    const daysInMonth=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
    const weekdays=['MON','TUE','WED','THU','FRI','SAT','SUN'];
    let cells=Array(offset).fill('<span></span>');
    for(let day=1;day<=daysInMonth;day++){
      const d=new Date(month.getFullYear(),month.getMonth(),day), key=iso(d);
      const isStart=same(d,start), isEnd=same(d,end), inRange=start&&end&&d>start&&d<end;
      const disabled=d<today;
      const cls=['admin-day',isStart||isEnd?'selected':'',inRange?'in-range':'',isStart||isEnd?'range-edge':'',same(d,today)?'today':''].filter(Boolean).join(' ');
      cells.push(`<button type="button" class="${cls}" data-date="${key}" ${disabled?'disabled':''} aria-label="${key}">${day}</button>`);
    }
    return `<section class="admin-month"><div class="admin-month-title">${month.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</div><div class="admin-weekdays">${weekdays.map(x=>`<span>${x}</span>`).join('')}</div><div class="admin-days">${cells.join('')}</div></section>`;
  }
  function choose(d){
    if(!start || end || d<start){start=d;end=null;}
    else {end=d;}
    sync();render();
  }
  function sync(){startInput.value=start?iso(start):'';endInput.value=end?iso(end):'';}
  function openCalendar(){ isOpen=true; root.hidden=false; render(); }
  function closeCalendar(){ isOpen=false; root.hidden=true; }
  [startInput,endInput].forEach(input=>{ input.addEventListener('click',openCalendar); input.addEventListener('focus',openCalendar); });
  document.addEventListener('click',event=>{ if(isOpen && !root.contains(event.target) && event.target!==startInput && event.target!==endInput) closeCalendar(); });
  form.addEventListener('reset',()=>{start=end=null;sync();closeCalendar();render();});
  render();
})();