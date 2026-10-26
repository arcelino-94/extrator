const CACHE_NAME = "comprovantes-v25";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first pro app shell; nunca intercepta chamadas ao backend (Apps Script)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // deixa passar chamadas externas (Apps Script)

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
      );
    })
  );
});

// ===== Notificações push (aviso diário de contas) =====
self.addEventListener('push', (event) => {
  let dados = { title: 'Contas', body: 'Abra o app para ver suas contas.' };
  try { if (event.data) dados = event.data.json(); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(dados.title || 'Contas', {
      body: dados.body || '',
      tag: 'contas-dia',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      if (lista.length) return lista[0].focus();
      return self.clients.openWindow('./');
    })
  );
});
