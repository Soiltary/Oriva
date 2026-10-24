/* Public shell/assets only. Authenticated API bodies, account pages and blobs
   are intentionally excluded; private offline records use owner-scoped IDB. */
const CACHE='oriva-public-shell-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/','/iphone/','/oriva-logo.png','/manifest.webmanifest','/mobile.webmanifest'])))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('oriva-public-shell-')&&key!==CACHE)await caches.delete(key);await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/_sites/')||url.search)return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{try{const response=await fetch(request);if(response.ok&&['/','/iphone','/iphone/'].includes(url.pathname)){const cache=await caches.open(CACHE);await cache.put(url.pathname==='/iphone'?'/iphone/':url.pathname,response.clone())}return response}catch{return await caches.match(url.pathname.startsWith('/iphone')?'/iphone/':'/')||Response.error()}})());return;
 }
 if(!/\.(?:js|css|woff2?|png|svg|webmanifest)$/.test(url.pathname)||url.pathname.includes('node_modules')||url.pathname.includes('@vite'))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok&&response.type!=='opaque')await cache.put(request,response.clone());return response})());
});
