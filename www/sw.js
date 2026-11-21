// Oflayn ishlash uchun: ilova fayllarini telefon xotirasida saqlaydi
const V="odatlar-v4";
const FILES=["./","index.html","app.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png",
 "fonts/caveat-700.woff2","fonts/nunito-400.woff2","fonts/nunito-600.woff2","fonts/nunito-700.woff2","fonts/nunito-800.woff2"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// Avval internetdan yangisini olishga urinadi, bo'lmasa saqlanganini beradi
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
 e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
