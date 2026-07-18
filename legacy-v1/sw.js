// Zeeyus Service Worker - enables Android PWA install + caching
const CACHE='zeeyus-v1';
const STATIC=['./','/index.html','assets/logo.png','assets/icon.png','assets/splash.mp4','assets/bg.jpg'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC.filter(u=>!u.includes('splash')))).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  // Cache-first for static assets
  if(e.request.url.match(/\.(png|jpg|svg|ico|mp4)$/)){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
      const clone=res.clone();
      caches.open(CACHE).then(c=>c.put(e.request,clone));
      return res;
    })).catch(()=>fetch(e.request)));
    return;
  }
  // Network-first for HTML/JS/API
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
