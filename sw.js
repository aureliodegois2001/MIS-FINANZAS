// Guarda la app en el dispositivo para que funcione sin conexión. No toca tus datos.
const CACHE='misfinanzas-88c276f42cc2';
const FILES=['./','index.html','manifest.webmanifest','apple-touch-icon.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET' || new URL(e.request.url).origin!==location.origin) return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>{
    const red=fetch(e.request).then(res=>{ if(res.ok){ const copia=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copia)); } return res; }).catch(()=>hit);
    return hit || red;
  }));
});
