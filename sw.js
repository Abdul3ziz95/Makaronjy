/* =====================================================
   Service Worker — مكرونجي Makaronjy
   - Precache عند التثبيت وعند التفعيل (يسد فجوة التثبيت أثناء أي تعطل)
   - Network-First للملفات الحيوية (جديد دائماً عند الاتصال + كاش عند الانقطاع)
   - Cache-First للصور (سرعة وعمل بدون إنترنت)
===================================================== */
const CACHE = 'mk-v2';

const CORE = [
  './',
  'index.html',
  'admin.html',
  'i18n.js',
  'menu.js',
  'settings.js',
  'logo.png',
  'welcome.png',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

const STATIC_IMAGES = [
  'img/f1.png',
  'img/f2.png',
  'img/f3.png',
  'img/f4.png'
];

async function precache(){
  const c = await caches.open(CACHE);
  for(const u of [...CORE, ...STATIC_IMAGES]){
    try{
      const hit = await c.match(u);
      if(!hit){ await c.add(u); }
    }catch(e){}
  }
}

self.addEventListener('install', e=>{
  e.waitUntil(precache());
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=> Promise.all(
      keys.filter(k=> k !== CACHE).map(k=> caches.delete(k))
    ))
    .then(()=> self.clients.claim())
    .then(()=> precache())
  );
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;

  const path = url.pathname;
  const isCore = path === '/' || path.endsWith('/') || /\.(html|js)$/i.test(path);

  /* الملفات الحيوية: الشبكة أولاً ثم الكاش (يدعم العمل بدون إنترنت) */
  if(isCore){
    const clean = new Request(url.origin + path);
    e.respondWith(
      fetch(req).then(res=>{
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c=> c.put(clean, copy));
        }
        return res;
      }).catch(()=> caches.match(clean).then(m=> m || caches.match('index.html')))
    );
    return;
  }

  /* الصور والأصول: الكاش أولاً ثم الشبكة */
  e.respondWith(
    caches.match(req).then(m=> m || fetch(req).then(res=>{
      if(res && res.ok){
        const copy = res.clone();
        caches.open(CACHE).then(c=> c.put(req, copy));
      }
      return res;
    }))
  );
});
