// Web app (iPhone home screen / browser): the app shell works offline; Supabase and Deezer always go to the network
const CACHE = 'vateko-web-4';
const SHELL = ['./', 'index.html', 'login.html', 'bar.html', 'phone.css', 'phone.js', 'api.js', 'ban.js', 'login.js', 'notify.js', 'notify.css', 'fonts/inter.css', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(fetch(e.request).then(r => { caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request)));
});
