// Firebase Messaging (recebe a notificação mesmo com o app fechado)
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBnEAVClDE_DyyySWcHiAcJDFZORTwnQZQ",
  authDomain: "extrair-e21be.firebaseapp.com",
  projectId: "extrair-e21be",
  storageBucket: "extrair-e21be.firebasestorage.app",
  messagingSenderId: "289176438073",
  appId: "1:289176438073:web:f7d6d799ae7cd6db44d4e8"
});
firebase.messaging();

const CACHE_NAME = "comprovantes-v1";
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
