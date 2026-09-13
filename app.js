/* =====================================================
   مكرونجي — ملف المنطق (app.js)
   لا منطق داخل index.html إطلاقاً
===================================================== */

/* ===== تأمين العمل بدون إنترنت (لقطة localStorage) ===== */
(function(){
  if(window.MENU && window.APP_SETTINGS) return;
  try{
    var m = localStorage.getItem('mk_snap_menu');
    var s = localStorage.getItem('mk_snap_settings');
    if(!window.MENU && m) new Function(m)();
    if(!window.APP_SETTINGS && s) new Function(s)();
  }catch(e){}
})();

/* ===== إيقاف التكبير بالأصابع ===== */
document.addEventListener('touchstart', e=>{ if(e.touches.length > 1) e.preventDefault(); }, {passive:false});
document.addEventListener('touchmove', e=>{ if(e.touches.length > 1) e.preventDefault(); }, {passive:false});
['gesturestart','gesturechange','gestureend'].forEach(ev=> document.addEventListener(ev, e=> e.preventDefault()));
document.addEventListener('dblclick', e=> e.preventDefault());

const t0 = Date.now();
let guardOn = false;

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

/* ===== حارس زر الرجوع ===== */
function pushGuard(){
  if(guardOn) return;
  try{ history.pushState({rb:1}, ''); guardOn = true; }catch(e){}
}
pushGuard();
document.addEventListener('DOMContentLoaded', pushGuard);
window.addEventListener('load', pushGuard);
window.addEventListener('pageshow', pushGuard);

/* ===== مساعدات ===== */
function el(id){ return document.getElementById(id); }
function toast(msg){
  const t = el('toastMsg');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(()=> t.classList.remove('show'), 2600);
}
function welcomeShown(){ return el('welcome').classList.contains('show'); }
function sheetShown(){ return el('installSheet').classList.contains('show'); }
function drawerShown(){ return el('drawer').classList.contains('show'); }
function confirmShown(){ return el('confirmModal').classList.contains('show'); }
function gateShown(){ return el('gate').classList.contains('show'); }
function adShown(){ return el('adModal').classList.contains('show'); }

/* ===== ترجمة محصّنة ===== */
function tt(key, ar, en){
  const v = (window.I18N && T()[key] !== undefined) ? T()[key] : undefined;
  return (v !== undefined && typeof v !== 'function') ? v : (currentLang==='ar' ? ar : en);
}
function tFn(key, arg, arFn, enFn){
  const v = T()[key];
  if(typeof v === 'function') return v(arg);
  return currentLang==='ar' ? arFn(arg) : enFn(arg);
}
function tCall(key, fallbackFn, ...args){
  const v = T()[key];
  if(typeof v === 'function') return v(...args);
  return fallbackFn(...args);
}
function favSlotsArr(){
  const v = T().favSlots;
  return Array.isArray(v) ? v : (currentLang==='ar' ? ['فطور 🌅','غداء ☀️','عشاء 🌙'] : ['Breakfast 🌅','Lunch ☀️','Dinner 🌙']);
}

/* ===== الإعدادات والفروع ===== */
function S(){ return window.APP_SETTINGS; }
function branches(){ return S().branches; }
function savedBranchId(){ return localStorage.getItem('mk_branch'); }
function currentBranch(){ return branches().find(b=>b.id===savedBranchId()) || null; }
function branchName(b){ return (currentLang==='ar') ? b.nameAr : b.nameEn; }
function brandName(){ return (currentLang==='ar') ? S().brand.nameAr : S().brand.nameEn; }
function brandTag(){ return (currentLang==='ar') ? S().brand.tagAr : S().brand.tagEn; }
function brandize(str){
  if(typeof str !== 'string') return str;
  return str.replace(/مكرونجي/g, S().brand.nameAr).replace(/Makaronjy/g, S().brand.nameEn);
}

/* ===== الأكثر مبيعاً من اللوحة ===== */
function bestSellers(){ return Array.isArray(S().bestSellers) ? S().bestSellers : []; }
function bestItems(){ return bestSellers().map(id=> findMenuItem(id)).filter(Boolean); }
function isBestSeller(it){ return bestSellers().includes(it.id); }

/* ===== صور الأصناف: img/items/<id>.png?v=بصمة ===== */
function itemImgUrl(it){
  return it.imgv ? ('img/items/' + it.id + '.png?v=' + it.imgv) : null;
}
function itemPlaceholder(name){
  const safe = String(name).replace(/[&<>"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#e8a04c"/><rect y="330" width="800" height="80" fill="#8e2a4a"/><text x="400" y="290" font-size="90" text-anchor="middle">🍝</text><text x="400" y="500" font-size="40" text-anchor="middle" fill="#8e2a4a" font-family="Cairo,sans-serif" font-weight="bold">${safe}</text><text x="400" y="555" font-size="24" text-anchor="middle" fill="#f2b95f" font-family="Cairo,sans-serif">مكرونجي ⭐</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}

/* ===== أرقام الفروع ومعرفات الطلب ===== */
function branchNum(b){
  if(b && typeof b.num === 'number' && isFinite(b.num) && b.num >= 1) return b.num;
  const i = branches().indexOf(b);
  return i >= 0 ? i+1 : 1;
}
function branchCode(b){ return 'B' + branchNum(b); }
function generateInvoiceID(code){
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  const randomChar = Math.random().toString(36).substring(2, 3).toUpperCase();
  return `${code}-${hours}${minutes}${milliseconds}-${randomChar}`;
}

/* ===== مسافة Haversine ===== */
function hav(la1,lo1,la2,lo2){
  const R=6371, r=d=>d*Math.PI/180;
  const dLa=r(la2-la1), dLo=r(lo2-lo1);
  const a=Math.sin(dLa/2)**2 + Math.cos(r(la1))*Math.cos(r(la2))*Math.sin(dLo/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

/* ===== المنيو ===== */
function findMenuItem(id){
  for(const s of MENU){ const it = s.items.find(x=>x.id===id); if(it) return it; }
  return null;
}
function findMenuItemByAr(name){
  for(const s of MENU){ const it = s.items.find(x=>x.ar===name); if(it) return it; }
  return null;
}
function findSectionOfItem(id){
  for(const s of MENU){ if(s.items.some(x=>x.id===id)) return s; }
  return null;
}
function itemSoldOut(it, brId){ return Array.isArray(it.so) && it.so.includes(brId); }
function itemPrice(it, sizeIdx){ return it.prices[sizeIdx>=0 ? sizeIdx : 0]; }
function itemDesc(it){
  const d = (currentLang==='ar') ? it.desc : (it.descEn || it.desc);
  return d || '';
}

/* ===== التوفر لكل فرع ===== */
function secAvailAt(sec, brId){ return !Array.isArray(sec.only) || !sec.only.length || sec.only.includes(brId); }
function itAvailAt(it, brId){ return !Array.isArray(it.only) || !it.only.length || it.only.includes(brId); }
function sectionViewState(sec, brId){
  if(secAvailAt(sec, brId)) return 'normal';
  return (sec.miss === 'hide') ? 'hide' : 'gray';
}
function itemViewState(sec, it, brId){
  const sA = secAvailAt(sec, brId);
  const iA = itAvailAt(it, brId);
  if(!sA && !iA) return (it.miss === 'hide') ? 'hide' : 'gray';
  if(!sA) return (sec.miss === 'hide') ? 'hide' : 'gray';
  if(!iA) return (it.miss === 'hide') ? 'hide' : 'gray';
  return 'normal';
}

/* ===== الساعات بدقة الدقائق ===== */
function normHM(t){
  if(t && typeof t === 'object') return { h: (t.h|0), m: (t.m|0) };
  const n = Math.floor(+t) || 0;
  return { h: n, m: 0 };
}
function hmToMin(t){ const o = normHM(t); return o.h*60 + o.m; }
function defaultSchedule(){
  const H = S().hours || { open:{h:13,m:0}, close:{h:2,m:0} };
  const o = normHM(H.open), c = normHM(H.close);
  return [0,1,2,3,4,5,6].map(()=> ({ o: {h:o.h,m:o.m}, c: {h:c.h,m:c.m} }));
}
function branchSchedule(br){
  if(br && Array.isArray(br.hours) && br.hours.length === 7){
    return br.hours.map(d=> ({ o: normHM(d.o), c: normHM(d.c), closed: !!d.closed }));
  }
  return defaultSchedule();
}
function within(tMin, d){
  if(!d || d.closed) return false;
  const o = hmToMin(d.o), c = hmToMin(d.c);
  if(o < c) return tMin >= o && tMin < c;
  if(o > c) return tMin >= o || tMin < c;
  return false;
}
function branchStatus(br){
  const sched = branchSchedule(br);
  const now = new Date();
  const day = now.getDay();
  const tMin = now.getHours()*60 + now.getMinutes();
  const today = sched[day];
  const yest = sched[(day+6)%7];
  if(yest && !yest.closed && hmToMin(yest.o) > hmToMin(yest.c) && tMin < hmToMin(yest.c)) return {open:true, closeMin:hmToMin(yest.c)};
  if(within(tMin, today)) return {open:true, closeMin:hmToMin(today.c)};
  if(today && !today.closed && tMin < hmToMin(today.o)) return {open:false, openMin:hmToMin(today.o), openDay:null};
  for(let i=1;i<=7;i++){
    const d=(day+i)%7;
    const ds=sched[d];
    if(ds && !ds.closed) return {open:false, openMin:hmToMin(ds.o), openDay:d};
  }
  return {open:false, openMin:null, openDay:null};
}
function fmtMin(min, lang){
  let h = Math.floor(min/60) % 24;
  const m = min % 60;
  const ampm = h < 12 ? (lang==='ar'?'ص':'AM') : (lang==='ar'?'م':'PM');
  let h12 = h % 12; if(h12 === 0) h12 = 12;
  const pad = n=> String(n).padStart(2,'0');
  if(lang==='ar'){
    const arDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    const toAr = s=> String(s).split('').map(d=> arDigits[+d]).join('');
    return toAr(h12) + (m ? ':' + toAr(pad(m)) : '') + ' ' + ampm;
  }
  return h12 + (m ? ':' + pad(m) : '') + ' ' + ampm;
}

function goHome(){
  if(welcomeShown()){
    introFinished = true;
    el('welcome').classList.remove('show');
    document.body.style.overflow='';
  }
  if(sheetShown()) closeSheet();
  if(drawerShown()) closeCart();
  if(gateShown()) closeGate();
  if(adShown()) closeAd();
  if(el('favSheet').classList.contains('show')) closeFavSheet();
  if(el('slotPicker').classList.contains('show')) closeSlotPicker();
  if(confirmShown()) resolveConfirm(false);
}

/* ===== اللغة ===== */
let currentLang = localStorage.getItem('mk_lang') || 'ar';
function T(){ return window.I18N[currentLang]; }
function itemName(it){ return (currentLang==='ar') ? it.ar : it.en; }

/* ===== كشف تثبيت التطبيق ===== */
let deferredPrompt = null;
const installBtn = el('installBtn');
const installSheet = el('installSheet');
const sheetBody = el('sheetBody');
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

function runningAsApp(){
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         window.navigator.standalone === true;
}
function refreshInstallBtn(){
  const installed = runningAsApp() || localStorage.getItem('mk_app_installed') === '1';
  installBtn.classList.toggle('show', !installed);
}
if(runningAsApp()){
  localStorage.setItem('mk_app_installed','1');
  document.body.classList.add('is-app');
}
refreshInstallBtn();

window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault();
  deferredPrompt = e;
});
window.addEventListener('appinstalled', ()=>{
  localStorage.setItem('mk_app_installed','1');
  refreshInstallBtn();
  toast(T().installed);
});

function fillSheet(){
  sheetBody.innerHTML = isIOS ? T().iosSteps : T().otherSteps;
}
function installApp(){
  if(deferredPrompt){
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(res=>{
      if(res.outcome==='accepted'){
        localStorage.setItem('mk_app_installed','1');
        refreshInstallBtn();
      }
      deferredPrompt = null;
    });
  } else {
    fillSheet();
    installSheet.classList.add('show');
    pushGuard();
  }
}
function closeSheet(){ installSheet.classList.remove('show'); }

/* ===== السوشيال + شركاء التوصيل ===== */
function renderSocial(){
  const s = S().social || {};
  const links = [];
  if(s.instagram) links.push(`<a href="${s.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.4 5.6 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.6 18.4 4 16.4 4m.9 2.8a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6"/></svg></a>`);
  if(s.tiktok) links.push(`<a href="${s.tiktok}" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><svg viewBox="0 0 24 24"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.83 5.7 3.24 0 5.81-2.35 5.81-5.7l.03-6.14c1.15.82 2.53 1.27 3.97 1.27V7.34c-1.28 0-2.46-.55-3.2-1.52z"/></svg></a>`);
  const box = el('gateSocial');
  box.innerHTML = links.join('');
  box.style.display = links.length ? '' : 'none';
}
function renderDelivery(){
  const d = S().delivery || [];
  const box = el('gateDelivery');
  if(!d.length){ box.innerHTML = ''; box.style.display = 'none'; return; }
  box.style.display = '';
  const name = x=> currentLang==='ar' ? x.nameAr : (x.nameEn || x.nameAr);
  box.innerHTML = `
    <div class="gd-head">
      <b>${tt('deliveryHeadAr','اطلب الآن عبر شركائنا في التوصيل','Order now via our delivery partners')}</b>
      <small>${tt('deliveryHeadEn','Order now via our delivery partners','اطلب الآن عبر شركائنا في التوصيل')}</small>
    </div>
    <div class="gd-tiles">
      ${d.map(x=>`<a class="gd-btn" href="${x.url}" target="_blank" rel="noopener noreferrer" aria-label="${name(x)}">
        <img src="${x.img || 'img/missing.png'}" alt="${name(x)}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <span class="gd-fallback" style="display:none;background:${x.color || '#8e2a4a'}">${name(x).charAt(0)}</span>
        <span class="gd-name">${name(x)}</span>
      </a>`).join('')}
    </div>`;
}

function applyLang(lang){
  currentLang = lang;
  localStorage.setItem('mk_lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang==='ar') ? 'rtl' : 'ltr';
  document.title = brandize(T().docTitle);
  document.querySelectorAll('.lang-seg').forEach(s=> s.classList.toggle('active', s.dataset.lang===lang));
  document.querySelectorAll('[data-i18n]').forEach(elm=>{
    const key = elm.getAttribute('data-i18n');
    const val = T()[key];
    if(val===undefined || typeof val === 'function') return;
    if(elm.hasAttribute('data-i18n-html')) elm.innerHTML = brandize(val);
    else elm.textContent = brandize(val);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(elm=>{
    const val = T()[elm.getAttribute('data-i18n-ph')];
    if(val) elm.placeholder = val;
  });
  const bn = document.querySelector('[data-i18n="brandName"]');
  if(bn) bn.textContent = brandName();
  const bt = document.querySelector('[data-i18n="brandTag"]');
  if(bt) bt.textContent = brandTag();
  el('confirmYes').textContent = tt('favConfirmYes','نعم، استبدال','Yes, Replace');
  el('confirmNo').textContent = tt('favCancel','إلغاء','Cancel');
  el('gateBrand').textContent = brandize(tt('gateBrand','مطاعم مكرونجي','Makaronjy Restaurants'));
  el('gateTagline').textContent = brandize(tt('gateTagline','مكرونة بطعم لا يُقاوم','Irresistible pasta experience'));
  el('gatePickup').textContent = '🛍️ ' + tt('pickupNote','طلبك يكون جاهزاً عند وصولك للفرع','Your order will be ready upon arrival');
  el('gateTitle').textContent = tt('branchGateTitle','اختر فرعك للطلب 📍','Choose Your Branch 📍');
  el('gateNearestLbl').textContent = tt('branchNearestBtn','🎯 حدّد الفرع الأقرب لموقعي','🎯 Find My Nearest Branch');
  el('gateListLbl').textContent = tt('gateListBtn','قائمة الفروع','Branch List');
  el('changeBranchLbl').textContent = tt('changeBranch','تغيير الفرع','Change Branch');
  updateBranchFooter();
  renderSocial();
  renderDelivery();
  if(gateShown()) renderGateList();
  if(installSheet.classList.contains('show')) fillSheet();
  search.value = '';
  isSearching = false;
  cats.classList.remove('searching');
  searchStats.classList.remove('show');
  updateStatus();
  buildMenu();
  showSection(currentSection, false);
  refreshSteps();
  updateCart();
  updateFavBadge();
  if(el('favSheet').classList.contains('show')) renderFavSheet();
  setTimeout(()=>{ catsSign = 0; catsPos = 0; cats.scrollLeft = 0; }, 50);
}
function toggleLang(){ applyLang(currentLang==='ar' ? 'en' : 'ar'); }

/* ===== حالة العمل ===== */
function updateStatus(){
  const pill = el('statusPill');
  const txt = el('statusText');
  const note = el('statusNote');
  const br = currentBranch() || branches()[0] || null;
  if(!br){
    pill.classList.remove('open'); pill.classList.add('closed');
    txt.textContent = T().closed; note.textContent = '';
    return;
  }
  const st = branchStatus(br);
  const lang = currentLang;
  const days = T().days || (lang==='ar' ? ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'] : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']);
  pill.classList.toggle('open', st.open);
  pill.classList.toggle('closed', !st.open);
  txt.textContent = st.open ? T().open : T().closed;
  if(st.open){
    note.textContent = tCall('closesAt', h=> 'يغلق عند الساعة ' + h, fmtMin(st.closeMin, lang));
  } else if(st.openMin !== null && st.openDay === null){
    note.textContent = tCall('opensAt', h=> 'يفتح عند الساعة ' + h, fmtMin(st.openMin, lang));
  } else if(st.openMin !== null){
    note.textContent = tCall('opensOn', (d,h)=> 'يفتح يوم ' + d + ' عند الساعة ' + h, days[st.openDay] || '', fmtMin(st.openMin, lang));
  } else {
    note.textContent = tt('closedWeek','مغلق هذا الأسبوع','Closed this week');
  }
}
updateStatus();
setInterval(updateStatus, 30000);

/* ===== شاشة الترحيب: بدون عداد ===== */
let introFinished = false;
const MIN_INTRO_MS = 7000;
const firstVisit = !localStorage.getItem('mk_welcome_seen');

function afterWelcome(){
  if(!currentBranch()){ openGate('first'); }
}

if(firstVisit){
  localStorage.setItem('mk_welcome_seen','1');
  setTimeout(()=>{
    el('welcome').classList.add('show');
    document.body.style.overflow='hidden';
    pushGuard();
  }, 250);
  const assets = ['img/logo.png','img/welcome.png','img/bg.png',
    ...bestItems().map(it=> itemImgUrl(it)).filter(Boolean)];
  let imgLoaded = 0, done = false;
  const tick = ()=>{
    imgLoaded++;
    if(imgLoaded >= assets.length && !done){ done = true; finishIntro(); }
  };
  assets.forEach(src=>{ const im = new Image(); im.onload = im.onerror = tick; im.src = src; });
  setTimeout(()=>{ if(!done){ done = true; finishIntro(); } }, 25000);
} else {
  setTimeout(()=>{ afterWelcome(); }, 400);
}

function finishIntro(){
  if(introFinished) return;
  introFinished = true;
  const wait = Math.max(0, MIN_INTRO_MS - (Date.now() - t0));
  setTimeout(()=>{
    el('welcome').classList.remove('show');
    document.body.style.overflow='';
    setTimeout(afterWelcome, 400);
  }, wait);
}
function skipIntro(){
  if(introFinished) return;
  introFinished = true;
  el('welcome').classList.remove('show');
  document.body.style.overflow='';
  afterWelcome();
}
el('welcome').addEventListener('click', e=>{ if(e.target.id==='welcome') skipIntro(); });

/* ===== شاشة الفروع ===== */
let nearestId = null;
let gateMode = null;
let dropOpen = false;

function setDrop(open){
  dropOpen = open;
  el('gateDrop').classList.toggle('open', open);
  el('gateListBtn').classList.toggle('open', open);
  el('gateListBtn').setAttribute('aria-expanded', open ? 'true' : 'false');
  if(open) renderGateList();
}
el('gateListBtn').addEventListener('click', ()=> setDrop(!dropOpen));
el('gate').addEventListener('click', e=>{
  if(!dropOpen) return;
  if(e.target.closest('#gateDrop') || e.target.closest('#gateListBtn') || e.target.closest('#gateNearest')) return;
  setDrop(false);
});

function renderGateList(){
  const brs = branches().slice();
  if(nearestId){
    brs.sort((a,b)=> (a.id===nearestId ? -1 : (b.id===nearestId ? 1 : 0)));
  }
  el('gateCount').textContent = brs.length;
  const cur = savedBranchId();
  const chooseTxt = tt('chooseBtn','اختر ✓','Choose ✓');
  const currentTxt = tt('currentBranchFlag','✓ فرعك الحالي','✓ Your Branch');
  const nearestTxt = tt('branchNearestBadge','🎯 الأقرب لك','🎯 Nearest to You');
  const dirTxt = T().getDir || (currentLang==='ar' ? 'التوجه للمطعم' : 'Directions');
  el('gateList').innerHTML = brs.map((b, idx)=>`
    <div class="gate-card ${b.id===nearestId?'is-nearest':''} ${b.id===cur?'is-active':''}" data-b="${b.id}" role="button" style="animation-delay:${0.08 + idx*0.08}s">
      <div class="gc-top">
        <span class="gc-ico">🍝</span>
        <div class="gc-names">
          <b>${branchName(b)}</b>
          <small>${(currentLang==='ar') ? b.addrAr : b.addrEn}</small>
        </div>
        ${b.id===nearestId ? `<span class="gc-flag nearest">${nearestTxt}</span>` : ''}
      </div>
      <div class="gc-actions">
        <button class="gc-choose" data-choose="${b.id}">${b.id===cur ? currentTxt : chooseTxt}</button>
        ${b.map ? `<a class="gc-dir" href="${b.map}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">🧭 ${dirTxt}</a>` : ''}
      </div>
    </div>`).join('');
}

function openGate(mode){
  gateMode = mode;
  pushGuard();
  el('gateClose').classList.toggle('can', mode === 'switch');
  renderGateList();
  el('gate').classList.add('show');
}
function closeGate(){
  el('gate').classList.remove('show');
  gateMode = null;
}

function selectBranch(id){
  const b = branches().find(x=>x.id===id);
  if(!b) return;
  const same = (id === savedBranchId());
  if(!same){
    localStorage.setItem('mk_branch', id);
    updateBranchFooter();
    buildMenu();
    showSection(0, false);
    refreshSteps();
    reconcileCart();
    updateCart();
    updateStatus();
  }
  gateMode = null;
  closeGate();
  if(!same){
    toast(tFn('branchSelected', branchName(b),
      n=>'🍝 تم تحويل طلبك إلى: '+n, n=>'🍝 Your order branch: '+n));
  } else {
    toast(tFn('branchReconfirm', branchName(b),
      n=>'✓ تم تأكيد فرعك: '+n, n=>'✓ Your branch confirmed: '+n));
  }
}

el('gateList').addEventListener('click', e=>{
  const dir = e.target.closest('.gc-dir');
  if(dir) return;
  const chooseBtn = e.target.closest('.gc-choose');
  const card = e.target.closest('.gate-card');
  const id = chooseBtn ? chooseBtn.dataset.choose : (card ? card.dataset.b : null);
  if(id) selectBranch(id);
});

/* ===== زر الأقرب ===== */
let geoBusy = false;
function geoOnce(opts){
  return new Promise((res, rej)=>{
    navigator.geolocation.getCurrentPosition(pos=> res(pos), err=> rej(err), opts);
  });
}
function withWatchdog(promise, ms){
  return new Promise((res, rej)=>{
    const t = setTimeout(()=> rej(new Error('watchdog')), ms);
    promise.then(v=>{ clearTimeout(t); res(v); }, e=>{ clearTimeout(t); rej(e); });
  });
}
async function requestNearest(){
  if(geoBusy) return;
  geoBusy = true;
  const btn = el('gateNearest');
  const lbl = el('gateNearestLbl');
  const oldTxt = tt('branchNearestBtn','🎯 حدّد الفرع الأقرب لموقعي','🎯 Find My Nearest Branch');
  btn.disabled = true;
  lbl.textContent = tt('geoLocating','جارٍ تحديد موقعك...','Locating you...');
  try{
    if(!navigator.geolocation) throw new Error('no-geo');
    let pos;
    try{
      pos = await withWatchdog(geoOnce({enableHighAccuracy:false, maximumAge:60000}), 4000);
    }catch(e1){
      pos = await withWatchdog(geoOnce({enableHighAccuracy:true}), 4000);
    }
    const la = pos.coords.latitude, lo = pos.coords.longitude;
    let best=null, bd=Infinity;
    branches().forEach(b=>{
      const d = hav(la, lo, b.lat, b.lng);
      if(d < bd){ bd = d; best = b.id; }
    });
    nearestId = best;
    setDrop(true);
    setTimeout(()=>{
      const n = el('gateList').querySelector('.is-nearest');
      if(n) n.scrollIntoView({behavior:'smooth', block:'center'});
    }, 300);
    toast(tt('branchGeoOn','🎯 تم إبراز أقرب فرع لك','🎯 Nearest branch highlighted'));
  }catch(err){
    if(err && err.code === 1){
      toast(tt('geoDeniedPerm','لم تمنح إذن الموقع — يمكنك الاختيار يدوياً','Location permission denied — you can choose manually'));
    } else {
      toast(tt('geoOff','لم نتمكن من تحديد موقعك — فعّل خدمة الموقع (GPS) من إعدادات الهاتف ثم أعد المحاولة','Could not locate you — enable location (GPS) in phone settings and retry'));
    }
  }
  btn.disabled = false;
  lbl.textContent = oldTxt;
  geoBusy = false;
}
el('gateNearest').addEventListener('click', requestNearest);

function updateBranchFooter(){
  const b = currentBranch();
  el('branchCurrent').textContent = b ? ('🍝 ' + branchName(b)) : '🍝 —';
}

/* ===== الإعلان ===== */
function showAdOnce(){
  const ad = S().ad;
  if(!ad || !ad.enabled) return;
  if(ad.oncePerDay){
    const today = new Date().toDateString();
    if(localStorage.getItem('mk_ad_day') === today) return;
    localStorage.setItem('mk_ad_day', today);
  }
  const ar = currentLang==='ar';
  el('adMedal').textContent = ad.icon || '🍝';
  el('adTitle').textContent = ar ? ad.titleAr : ad.titleEn;
  el('adText').textContent = ar ? ad.textAr : ad.textEn;
  el('adBtn').textContent = ar ? (ad.btnAr || 'حسناً 🍝') : (ad.btnEn || 'Got it 🍝');
  el('adModal').classList.add('show');
}
function closeAd(){ el('adModal').classList.remove('show'); }

document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && adShown()){ closeAd(); return; }
  if(e.key==='Escape' && confirmShown()){ resolveConfirm(false); return; }
  if(e.key==='Escape' && installSheet.classList.contains('show')){ closeSheet(); return; }
  if(e.key==='Escape' && gateShown() && gateMode==='switch'){ closeGate(); return; }
});

/* ===== زر الرجوع ===== */
let lastBackPress = 0;
window.addEventListener('popstate', ()=>{
  guardOn = false;
  const anyOverlay = welcomeShown() || sheetShown() || drawerShown() || adShown() || gateShown() || el('favSheet').classList.contains('show') || el('slotPicker').classList.contains('show') || confirmShown();
  if(anyOverlay){
    goHome();
    pushGuard();
    return;
  }
  const now = Date.now();
  if(now - lastBackPress < 2500){
    history.back();
  } else {
    lastBackPress = now;
    toast(T().backToExit);
    pushGuard();
  }
});

/* ===== المنيو: RENDER_MENU = قسم الأكثر مبيعاً + أقسام المنيو ===== */
const cats = el('cats'), search = el('search'), main = el('menu');
const searchStats = el('searchStats'), statsCount = el('statsCount');
let currentSection = 0;
let isSearching = false;
let RENDER_MENU = [];

function buildMenu(){
  cats.innerHTML = '';
  main.innerHTML = '';
  const TT = T();
  const soldTxt = tt('soldOut','نفد ❌','Sold out ❌');
  const grayTxt = tt('notAvailableBranch','غير متوفر في هذا الفرع','Not available at this branch');
  const bestTxt = tt('bestBadge','الأكثر مبيعًا','Best Seller');
  const brId = savedBranchId() || '';

  RENDER_MENU = [];
  const best = bestItems();
  if(best.length){
    RENDER_MENU.push({
      id:'sec-best', best:true,
      t: tt('bestSection','الأكثر مبيعاً','Best Sellers'),
      tEn: 'Best Sellers',
      i: '🏆',
      items: best
    });
  }
  MENU.forEach(sec=> RENDER_MENU.push(sec));
  if(currentSection >= RENDER_MENU.length) currentSection = 0;

  RENDER_MENU.forEach((sec, pos)=>{
    if(sec.hidden === true) return;
    const views = sec.items.map(it=>{
      if(it.hidden === true) return 'hide';
      const stSec = sec.best ? (findSectionOfItem(it.id) || sec) : sec;
      return itemViewState(stSec, it, brId);
    });
    const renderable = sec.items.filter((it,idx)=> views[idx] !== 'hide');
    if(!renderable.length) return;
    const secTitle = (currentLang==='ar') ? sec.t : (sec.tEn || sec.t);
    const chip = document.createElement('button');
    chip.className='chip';
    chip.textContent = sec.i+' '+secTitle;
    chip.onclick = ()=> {
      if(isSearching) clearSearch();
      showSection(pos, true);
      pauseCats(3000);
      chip.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
    };
    cats.appendChild(chip);

    const s = document.createElement('section');
    s.className='section'; s.id='sec-'+pos;
    s.innerHTML = `<h3 class="ribbon">${sec.i} ${secTitle}</h3><div class="grid"></div>`;
    const g = s.querySelector('.grid');
    sec.items.forEach((it,ii)=>{
      const view = views[ii];
      if(view === 'hide') return;
      const stSec = sec.best ? (findSectionOfItem(it.id) || sec) : sec;
      const gray = (view === 'gray');
      const sold = !gray && itemSoldOut(it, brId);
      const prices = it.prices, cal = it.cal, multi = prices.length>1;
      const desc = itemDesc(it);
      const imgURL = itemImgUrl(it);
      const ph = itemPlaceholder(it.ar);
      const mode = (it.imgMode === 'full') ? 'full' : '';
      const card = document.createElement('div');
      card.className='card' + (gray?' card-gray':''); card.dataset.name = it.ar;
      const calTxt = cal ? ('🔥 '+cal+' '+TT.cal) : TT.zeroCal;
      const priceTxt = multi ? (TT.from+' '+prices[0]+' '+TT.currency) : (prices[0]+' '+TT.currency);
      const badge = sec.best ? '' : (gray ? `<span class="c-badge grayb">${grayTxt}</span>`
        : (sold ? `<span class="c-badge sold">${soldTxt}</span>`
        : (isBestSeller(it) ? `<span class="c-badge">🏆 ${bestTxt}</span>` : '')));
      card.innerHTML = `
        <div class="c-img">
          <img class="${mode}" src="${imgURL || ph}" alt="${itemName(it)}" loading="lazy"
               onerror="this.onerror=null;this.src='${ph}'">
          ${badge}
          <div class="step ${(sold||gray)?'disabled':''}" data-si="${pos}" data-ii="${ii}">
            <button class="st inc" aria-label="إضافة"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>
            <span class="qnum">0</span>
            <button class="st dec" aria-label="إنقاص"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg></button>
          </div>
        </div>
        <div class="c-body">
          <div class="c-info">
            <h4>${itemName(it)}</h4>
            <p class="c-meta">${calTxt}${desc ? ' | '+desc : ''}</p>
            ${multi? `<select class="size" ${(sold||gray)?'disabled':''}>${prices.map((p,i)=>`<option value="${i}">${TT.sizes[i]} • ${p} ${TT.currency}</option>`).join('')}</select>`:''}
          </div>
          <div class="c-price">${priceTxt}</div>
        </div>`;
      g.appendChild(card);
    });

    const n = RENDER_MENU.length;
    const prev = (pos-1+n)%n, next = (pos+1)%n;
    const nav = document.createElement('div');
    nav.className='sec-nav';
    const pSec = RENDER_MENU[prev], nSec = RENDER_MENU[next];
    const prevT = (currentLang==='ar') ? pSec.t : (pSec.tEn || pSec.t);
    const nextT = (currentLang==='ar') ? nSec.t : (nSec.tEn || nSec.t);
    nav.innerHTML = `
      <button class="nav-btn" data-go="${prev}">
        <span class="arr">→</span>
        <span class="lbl"><small>${TT.prevSec}</small><b>${pSec.i} ${prevT}</b></span>
      </button>
      <button class="nav-btn" data-go="${next}">
        <span class="lbl"><small>${TT.nextSec}</small><b>${nSec.i} ${nextT}</b></span>
        <span class="arr">←</span>
      </button>`;
    s.appendChild(nav);
    main.appendChild(s);
  });

  const calNote = document.createElement('div');
  calNote.className='cal-note';
  calNote.innerHTML = `<span class="cal-icon">🔥</span><span>${TT.calInfo}</span>`;
  main.appendChild(calNote);
}
buildMenu();

document.addEventListener('click', e=>{
  const b = e.target.closest('.st'); if(!b) return;
  const step = b.closest('.step');
  if(step.classList.contains('disabled')) return;
  const si = +step.dataset.si, ii = +step.dataset.ii;
  const sec = RENDER_MENU[si];
  if(!sec) return;
  const it = sec.items[ii];
  const brId = savedBranchId() || '';
  const stSec = sec.best ? (findSectionOfItem(it.id) || sec) : sec;
  if(itemViewState(stSec, it, brId) !== 'normal') return;
  if(itemSoldOut(it, brId)) return;
  const sel = step.closest('.card').querySelector('select');
  const sizeIdx = sel ? +sel.value : -1;
  const key = it.id+'|'+sizeIdx;
  const cur = cart.get(key) || {id:it.id, sizeIdx, qty:0};
  b.classList.contains('inc') ? cur.qty++ : cur.qty--;
  if(cur.qty<=0) cart.delete(key); else cart.set(key,cur);
  updateCart();
});
document.addEventListener('change', e=>{ if(e.target.matches('.size')) refreshSteps(); });

function refreshSteps(){
  document.querySelectorAll('.step').forEach(st=>{
    const sec = RENDER_MENU[+st.dataset.si];
    if(!sec) return;
    const it = sec.items[+st.dataset.ii];
    if(!it) return;
    const sel = st.closest('.card').querySelector('select');
    const sizeIdx = sel ? +sel.value : -1;
    const q = (cart.get(it.id+'|'+sizeIdx)||{}).qty || 0;
    st.querySelector('.qnum').textContent = q;
    st.classList.toggle('on', q>0);
  });
}

main.addEventListener('click', e=>{
  const b = e.target.closest('.nav-btn'); if(!b) return;
  showSection(+b.dataset.go, true);
});

function showSection(si, scroll=false){
  currentSection = si;
  document.querySelectorAll('.section').forEach((s,i)=> s.style.display = (i===si)? '' : 'none');
  document.querySelectorAll('.chip').forEach((c,i)=> c.classList.toggle('active', i===si));
  if(scroll){
    const target = document.getElementById('sec-'+si);
    if(target) requestAnimationFrame(()=>{ target.scrollIntoView({behavior:'smooth', block:'start'}); });
  }
}
showSection(0);

/* ===== البحث ===== */
search.addEventListener('input', e=>{
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll('.card.highlight').forEach(c=>c.classList.remove('highlight'));
  if(!q){ clearSearch(); return; }
  isSearching = true;
  cats.classList.add('searching');
  searchStats.classList.add('show');
  let firstMatch = null, totalMatches = 0;
  document.querySelectorAll('.section').forEach(s=>{
    s.style.display='';
    let sectionHasMatch = false;
    s.querySelectorAll('.card').forEach(c=>{
      const match = c.dataset.name.toLowerCase().includes(q);
      c.style.display = match ? '' : 'none';
      if(match){ sectionHasMatch = true; totalMatches++; if(!firstMatch) firstMatch = c; }
    });
    s.style.display = sectionHasMatch ? '' : 'none';
  });
  statsCount.textContent = T().results(totalMatches);
  if(firstMatch){
    setTimeout(()=>{
      firstMatch.scrollIntoView({behavior:'smooth', block:'center'});
      firstMatch.classList.add('highlight');
    }, 150);
  } else {
    toast(T().noResults);
  }
});

function clearSearch(){
  search.value = '';
  isSearching = false;
  cats.classList.remove('searching');
  searchStats.classList.remove('show');
  statsCount.textContent = T().results(0);
  document.querySelectorAll('.card.highlight').forEach(c=>c.classList.remove('highlight'));
  document.querySelectorAll('.section').forEach(s=>{
    s.style.display='';
    s.querySelectorAll('.card').forEach(c=> c.style.display = '');
  });
  showSection(currentSection);
}

/* ===== السلة ===== */
const cart = new Map();
try{ (JSON.parse(localStorage.getItem('mk_cart'))||[]).forEach(([k,v])=> cart.set(k,v)); }catch(e){}

function reconcileCart(){
  const brId = savedBranchId() || '';
  let removed = 0;
  const rebuilt = new Map();
  cart.forEach((v)=>{
    let id = v.id, sizeIdx = v.sizeIdx, qty = v.qty;
    if(id === undefined){
      const mig = findMenuItemByAr(v.ar);
      if(!mig){ removed++; return; }
      id = mig.id; sizeIdx = v.sizeIdx; qty = v.qty;
    }
    const it = findMenuItem(id);
    const sec = findSectionOfItem(id);
    if(!it || !sec || it.hidden === true || itemSoldOut(it, brId) || itemViewState(sec, it, brId) !== 'normal'){ removed++; return; }
    rebuilt.set(id+'|'+sizeIdx, {id, sizeIdx, qty});
  });
  cart.clear();
  rebuilt.forEach((v,k)=> cart.set(k,v));
  if(removed > 0) toast(tt('reconciled','⚠️ أصناف لم تعد متوفرة أُزيلت من طلبك','⚠️ Unavailable items were removed from your order'));
}

el('dItems').addEventListener('click', e=>{
  const b = e.target.closest('.q'); if(!b) return;
  const item = cart.get(b.dataset.k);
  if(!item) return;
  b.dataset.a==='inc' ? item.qty++ : item.qty--;
  if(item.qty<=0) cart.delete(b.dataset.k);
  updateCart();
});

function updateCart(){
  const TT = T();
  let count=0, total=0;
  cart.forEach(i=>{
    const it = findMenuItem(i.id);
    if(!it) return;
    count+=i.qty; total+=i.qty*itemPrice(it, i.sizeIdx);
  });
  el('cartCount').textContent = count;
  el('dTotal').textContent = total+' '+TT.currency;

  const saveBtn = el('saveFavBtn');
  if(saveBtn) saveBtn.style.display = cart.size ? 'block' : 'none';

  const box = el('dItems');
  box.innerHTML = cart.size ? [...cart.entries()].map(([k,i])=>{
    const it = findMenuItem(i.id);
    if(!it) return '';
    const name = itemName(it);
    const price = itemPrice(it, i.sizeIdx);
    const size = i.sizeIdx>=0 ? TT.sizes[i.sizeIdx] : '';
    return `
    <div class="ci">
      <div class="ci-info"><b>${name}${size?`<span class="ci-size">${size}</span>`:''}</b><span class="ci-price">${price} ${TT.currency}</span></div>
      <div class="ci-ctrl"><button class="q" data-k="${k}" data-a="dec">−</button><span>${i.qty}</span><button class="q" data-k="${k}" data-a="inc">+</button></div>
      <div class="ci-total">${i.qty*price} ${TT.currency}</div>
    </div>`;
  }).join('')
  : `<div class="empty">${TT.emptyCart}</div>`;
  refreshSteps();
  try{ localStorage.setItem('mk_cart', JSON.stringify([...cart.entries()])); }catch(e){}
}
function openCart(){
  pushGuard();
  el('drawer').classList.add('show');
  el('overlay').classList.add('show');
}
function closeCart(){
  el('drawer').classList.remove('show');
  el('overlay').classList.remove('show');
}

/* ===== نافذة التأكيد ===== */
let confirmResolve = null;
function customConfirm(msg, title){
  return new Promise(res=>{
    confirmResolve = res;
    el('confirmMsg').textContent = msg;
    el('confirmTitle').textContent = title || tt('favReplaceTitle','استبدال الوجبة المحفوظة','Replace Saved Meal');
    el('confirmYes').textContent = tt('favConfirmYes','نعم، استبدال','Yes, Replace');
    el('confirmNo').textContent = tt('favCancel','إلغاء','Cancel');
    el('confirmModal').classList.add('show');
  });
}
function resolveConfirm(val){
  if(!el('confirmModal').classList.contains('show')) return;
  el('confirmModal').classList.remove('show');
  if(confirmResolve){ const r = confirmResolve; confirmResolve = null; r(val); }
}

/* ===== الوجبات المفضلة ===== */
const FAV_KEY = 'mk_favs_v1';
const MAX_FAVS = 3;

function getFavs(){
  try {
    let f = JSON.parse(localStorage.getItem(FAV_KEY)) || [];
    while(f.length < MAX_FAVS) f.push(null);
    return f.slice(0, MAX_FAVS);
  } catch(e) { return [null, null, null]; }
}
function persistFavs(list){ localStorage.setItem(FAV_KEY, JSON.stringify(list)); }

function migrateFavs(){
  const favs = getFavs();
  let changed = false;
  const out = favs.map(f=>{
    if(!f) return null;
    const items = (f.items||[]).map(xi=>{
      if(xi && xi.id) return {id:xi.id, sizeIdx:xi.sizeIdx, qty:xi.qty};
      const it = xi ? findMenuItemByAr(xi.ar) : null;
      if(!it){ changed = true; return null; }
      changed = true;
      return {id:it.id, sizeIdx:xi.sizeIdx, qty:xi.qty};
    }).filter(Boolean);
    if(!items.length){ if(f) changed = true; return null; }
    return { items, savedAt: f.savedAt || Date.now() };
  });
  if(changed) persistFavs(out);
}

function updateFavBadge(){
  const n = getFavs().filter(Boolean).length;
  const badge = el('favCount');
  if(badge){
    badge.textContent = n;
    badge.style.display = n ? 'flex' : 'none';
  }
}

function renderFavSheet(){
  const favs = getFavs();
  const TT = T();
  const slots = favSlotsArr();
  let html = '';
  favs.forEach((f, i) => {
    if(f){
      const preview = f.items.map(xi=>{
        const it = findMenuItem(xi.id);
        if(!it) return null;
        const size = xi.sizeIdx >= 0 ? ' (' + TT.sizes[xi.sizeIdx] + ')' : '';
        return xi.qty + '× ' + itemName(it) + size;
      }).filter(Boolean).join('، ');
      let total = 0;
      f.items.forEach(xi=>{
        const it = findMenuItem(xi.id);
        if(it) total += xi.qty * itemPrice(it, xi.sizeIdx);
      });
      html += `
        <div class="fav-card">
          <div class="fav-card-head">
            <span class="fav-slot-name">${slots[i]}</span>
            <span class="fav-total">${total} ${TT.currency}</span>
          </div>
          <p class="fav-items-preview">${preview}</p>
          <div class="fav-actions">
            <button class="fav-order-btn" onclick="orderFav(${i})">${tt('favOrderNow','🛒 اطلبها الآن','🛒 Order Now')}</button>
            <button class="fav-del-btn" onclick="deleteFav(${i})">${tt('favDelete','🗑 حذف','🗑 Delete')}</button>
          </div>
        </div>`;
    } else {
      html += `<div class="fav-empty-slot">💭 ${tt('favEmptySlot','خانة فارغة — احفظ وجبة من السلة','Empty slot — save a meal from the cart')}</div>`;
    }
  });
  el('favList').innerHTML = html;
}

function openFavSheet(){
  pushGuard();
  renderFavSheet();
  el('favSheet').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeFavSheet(){
  el('favSheet').classList.remove('show');
  document.body.style.overflow = '';
}

function openSlotPicker(){
  if(!cart.size){ toast(tt('favCartEmpty','⚠️ السلة فارغة، أضف أصنافاً أولاً','⚠️ Cart is empty, add items first')); return; }
  const favs = getFavs();
  const slots = favSlotsArr();
  document.querySelectorAll('#slotBtns .slot-btn').forEach((b, i) => {
    b.innerHTML = slots[i] + (favs[i] ? `<small>✔ ${currentLang==='ar'?'موجودة':'Saved'}</small>` : '');
  });
  el('slotPicker').classList.add('show');
}
function closeSlotPicker(){
  el('slotPicker').classList.remove('show');
}

async function saveFavToSlot(i){
  const favs = getFavs();
  if(favs[i]){
    const ok = await customConfirm(tt('favOverwrite','هذه الخانة تحتوي على وجبة محفوظة، هل تريد استبدالها؟','This slot already has a saved meal. Replace it?'), favSlotsArr()[i]);
    if(!ok) return;
  }
  const items = [];
  cart.forEach(v=> items.push({id:v.id, sizeIdx:v.sizeIdx, qty:v.qty}));
  favs[i] = { items, savedAt: Date.now() };
  persistFavs(favs);
  closeSlotPicker();
  updateFavBadge();
  toast(tt('favSavedOk','✔ تم حفظ الوجبة بنجاح','✔ Meal saved successfully'));
}

function orderFav(i){
  const f = getFavs()[i];
  if(!f) return;
  const brId = savedBranchId() || '';
  f.items.forEach(xi=>{
    const it = findMenuItem(xi.id);
    const sec = findSectionOfItem(xi.id);
    if(!it || !sec || it.hidden === true || itemSoldOut(it, brId) || itemViewState(sec, it, brId) !== 'normal') return;
    const key = xi.id+'|'+xi.sizeIdx;
    const cur = cart.get(key) || {id:xi.id, sizeIdx:xi.sizeIdx, qty:0};
    cur.qty += xi.qty;
    cart.set(key, cur);
  });
  updateCart();
  closeFavSheet();
  openCart();
  toast(tt('favAddedToCart','🛒 تمت إضافة الوجبة إلى سلتك','🛒 Meal added to your cart'));
}

function deleteFav(i){
  const favs = getFavs();
  favs[i] = null;
  persistFavs(favs);
  renderFavSheet();
  updateFavBadge();
  toast(tt('favDeleted','تم حذف الوجبة','Meal deleted'));
}

el('favFab').addEventListener('click', openFavSheet);
el('saveFavBtn').addEventListener('click', openSlotPicker);
document.querySelectorAll('#slotBtns .slot-btn').forEach(b => {
  b.addEventListener('click', () => saveFavToSlot(+b.dataset.slot));
});

/* ===== إتمام الطلب ===== */
function checkout(){
  const TT = T();
  const br = currentBranch();
  if(!br){ openGate('switch'); return; }
  if(!cart.size){ toast(TT.emptyMsg); return; }

  const invoiceID = generateInvoiceID(branchCode(br));
  const d = new Date();
  const p = n=> String(n).padStart(2,'0');
  const dateStr = `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()}`;
  let hh = d.getHours();
  const ampm = hh>=12 ? (currentLang==='ar' ? 'م' : 'PM') : (currentLang==='ar' ? 'ص' : 'AM');
  hh = hh%12 || 12;
  const timeStr = `${hh}:${p(d.getMinutes())} ${ampm}`;

  let total = 0;
  const lines = [...cart.values()].map(i=>{
    const it = findMenuItem(i.id);
    if(!it) return null;
    const price = itemPrice(it, i.sizeIdx);
    total += i.qty*price;
    const size = i.sizeIdx>=0 ? ' ('+TT.sizes[i.sizeIdx]+')' : '';
    return `▪️ ${i.qty} × ${itemName(it)}${size} = ${i.qty*price} ${TT.currency}`;
  }).filter(Boolean);

  const notes = el('cnotes').value.trim();

  let msg =
`${brandize(TT.waGreeting)}
🧾 ${TT.waOrderTitle} | *${invoiceID}*
📅 ${dateStr} • ⏰ ${timeStr}
🛍️ ${tt('waOrderType','نوع الطلب','Order type')}: *${tt('orderPickup','استلام من الفرع','Branch pickup')}*
⏳ ${tt('pickupNote','طلبك يكون جاهزاً عند وصولك للفرع','Your order will be ready upon arrival')}
🍝 ${tt('waBranch','الفرع','Branch')}: ${branchName(br)}
━━━━━━━━━━━━
${lines.join('\n')}
━━━━━━━━━━━━
*${TT.total}: ${total} ${TT.currency}* ${TT.taxInc}
${notes ? `📝 ${TT.waNote}: ${notes}\n` : ''}━━━━━━━━━━━━
${brandize(TT.waThanks)}`;

  const waUrl = 'https://wa.me/'+br.wa+'?text='+encodeURIComponent(msg);
  const w = window.open(waUrl, '_blank');
  if(!w){ location.href = waUrl; }

  cart.clear();
  el('cnotes').value = '';
  updateCart();
  closeCart();
  toast(TT.orderSent);
  showAdOnce();
}

/* ===== حركة شريط الأقسام ===== */
let catsDir = 1, catsPauseUntil = 0, catsLast = performance.now(), catsSign = 0;
let catsPos = 0, catsSynced = false;
const CATS_SPEED = 28;
function pauseCats(ms){ catsPauseUntil = performance.now() + (ms || 3000); }
(function initCatsMarquee(){
  function tickCats(now){
    const max = cats.scrollWidth - cats.clientWidth;
    if(max > 5){
      if(!catsSign){
        cats.scrollLeft = -1;
        catsSign = (cats.scrollLeft < 0) ? -1 : 1;
        cats.scrollLeft = 0;
        catsPos = 0;
        catsSynced = true;
      }
      if(now >= catsPauseUntil){
        if(!catsSynced){
          catsPos = Math.min(max, Math.abs(cats.scrollLeft));
          catsSynced = true;
        }
        const dt = Math.min(.05, (now - catsLast)/1000);
        catsPos += dt * CATS_SPEED * catsDir;
        if(catsPos >= max){ catsPos = max; catsDir = -1; }
        else if(catsPos <= 0){ catsPos = 0; catsDir = 1; }
        cats.scrollLeft = catsSign * catsPos;
      } else {
        catsSynced = false;
      }
    }
    catsLast = now;
    requestAnimationFrame(tickCats);
  }
  requestAnimationFrame(tickCats);
})();
cats.addEventListener('pointerdown', ()=> pauseCats(3000), {passive:true});
cats.addEventListener('touchstart', ()=> pauseCats(3000), {passive:true});
cats.addEventListener('wheel', ()=> pauseCats(3000), {passive:true});

/* ===== التحديث الحي ===== */
let liveMarks = { 'menu.js': null, 'settings.js': null };
let liveBusy = false;
async function liveCheck(){
  if(liveBusy) return;
  liveBusy = true;
  try{
    const stamps = {};
    for(const f of ['menu.js','settings.js']){
      const r = await fetch(f + '?live=' + Date.now(), { method:'HEAD', cache:'no-store' });
      if(r.ok) stamps[f] = r.headers.get('last-modified') || r.headers.get('etag') || '';
    }
    const changed = [];
    for(const f in stamps){
      if(liveMarks[f] === null){ liveMarks[f] = stamps[f]; }
      else if(liveMarks[f] !== stamps[f]){ changed.push(f); liveMarks[f] = stamps[f]; }
    }
    if(changed.length){
      for(const f of changed){
        const t = await (await fetch(f + '?live=' + Date.now(), { cache:'no-store' })).text();
        const w = {};
        new Function('window', t)(w);
        if(f === 'menu.js'){
          if(w.MENU) window.MENU = w.MENU;
        } else {
          if(w.APP_SETTINGS) window.APP_SETTINGS = w.APP_SETTINGS;
        }
      }
      applyLive();
    }
  }catch(e){}
  liveBusy = false;
}
function applyLive(){
  reconcileCart();
  applyLang(currentLang);
  updateBranchFooter();
  if(gateShown()) renderGateList();
  if(el('favSheet').classList.contains('show')) renderFavSheet();
  toast(tt('liveUpdated','تم تحديث القائمة','Menu updated'));
}
setInterval(liveCheck, 60000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) liveCheck(); });

/* ===== الإقلاع ===== */
(function boot(){
  migrateFavs();
  try{
    const urlB = new URLSearchParams(location.search).get('b');
    if(urlB && branches().some(b=>b.id===urlB)){
      localStorage.setItem('mk_branch', urlB);
      const b = branches().find(x=>x.id===urlB);
      setTimeout(()=> toast(tFn('branchSelected', branchName(b), n=>'🍝 تم تحويل طلبك إلى: '+n, n=>'🍝 Your order branch: '+n)), 600);
    }
  }catch(e){}
  reconcileCart();
  updateBranchFooter();
  updateFavBadge();
  applyLang(currentLang);
  updateCart();
  liveCheck();
  if(!firstVisit && !currentBranch()){
    openGate('first');
  }
  if(navigator.onLine){
    ['menu.js','settings.js'].forEach(function(f){
      fetch(f).then(function(r){ return r.ok ? r.text() : ''; }).then(function(t){
        if(t) localStorage.setItem('mk_snap_' + (f === 'menu.js' ? 'menu' : 'settings'), t);
      }).catch(function(){});
    });
  }
})();
