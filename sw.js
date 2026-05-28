/**
 * SENNA KIDS ZONE — Service Worker
 * Caches all app assets for full offline gameplay.
 * Place this at root: /sw.js
 */

const CACHE  = 'skz-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/app.js',
  '/src/components/Attendance.js',
  '/src/components/GameEngine.js',
  '/src/components/ParentPortal.js',
  '/src/services/storage.js',
  '/src/services/parent-sync.js',
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Nunito:wght@400;700;800;900&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.map(u => new Request(u, {cache:'reload'}))))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Cache install partial:', err))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first for API calls, cache-first for assets
  if(e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({ok:false,offline:true}), {
        headers:{'Content-Type':'application/json'}
      }))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request).then(res => {
        if(res && res.status===200 && res.type==='basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return res;
      }))
      .catch(() => caches.match('/index.html'))
  );
});
