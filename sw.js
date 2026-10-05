const CACHE = "gan-attendance-v8";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./logo.png",
  "./app-background.png"
];

/*
  המטרה:
  - HTML ו-CSS מתעדכנים מיד מהרשת.
  - אם אין אינטרנט, משתמשים בעותק האחרון.
  - תמונות ואייקונים נשמרים בקאש.
  - גרסאות קאש ישנות נמחקות אוטומטית.
*/

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(APP_FILES);
    })
  );

  self.skipWaiting();
});


self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});


self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // רק קבצים של האתר עצמו.
  if (url.origin !== self.location.origin) {
    return;
  }

  // ניווט / HTML / CSS:
  // תמיד מנסים קודם את הגרסה העדכנית מהרשת.
  // אם אין אינטרנט — משתמשים בגרסה מהקאש.
  if (
    request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".css")
  ) {
    event.respondWith(
      fetch(request, {
        cache: "no-store"
      })
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      })
      .catch(() => {
        return caches.match(request).then(cached => {
          return cached || caches.match("./index.html");
        });
      })
    );

    return;
  }

  // תמונות, אייקונים וקבצים סטטיים:
  // קודם קאש, ואם אין — רשת.
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      });
    })
  );
});
