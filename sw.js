const CACHE='gan-attendance-v3';

const ASSETS=[
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './logo.png',
  './app-background.png'
];

self.addEventListener('install', event=>{
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event=>{
  event.waitUntil(
    caches.keys().then(keys=>
      Promise.all(
        keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event=>{
  if(new URL(event.request.url).origin===location.origin){
    event.respondWith(
      caches.match(event.request).then(cached=>cached||fetch(event.request))
    );
  }
});
