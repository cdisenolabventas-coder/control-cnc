/* Service worker OPCIONAL del Centro de Control CNC MX.
   Colócalo junto a index.html para que la app abra sin internet.
   Los datos nunca pasan por aquí: Google Drive y el inicio de sesión siempre van directo a la red. */
const CACHE = 'ccmx-shell-v2';
const SHELL = ['./', './index.html', './simulador.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u =>
    fetch(u, { mode: u.startsWith('http') ? 'no-cors' : 'same-origin' }).then(r => c.put(u, r)).catch(() => {})
  ))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (/googleapis\.com|accounts\.google\.com|gstatic\.com/.test(url.hostname)) return; // siempre red
  // Página: red primero (para recibir actualizaciones), caché si no hay conexión
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Librerías: caché primero
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  })));
});
