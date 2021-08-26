const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/styles.css",
    "db.js",
    "/manifest.webmanifest",
    "/service-worker.js",
    "index.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

self.addEventListener("install", function(evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache =>{
            console.log("installed")
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting()
});


self.addEventListener("install", function(evt) {
  evt.waitUntil(
    caches.open(DATA_CACHE_NAME).then((cache) =>cache.add("/api/transaction"))
  );
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache =>{
      console.log("Files were successfully cached");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});


self.addEventListener("fetch", function(evt) {
    if (evt.request.url.includes("/api/")) {
      evt.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(evt.request)
            .then(response => {
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
              return response;
            })
            .catch(err => {
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
      return;
    }
    evt.respondWith(
      caches.match(evt.request).then(function(response) {
        return response || fetch(evt.request);
      })
    );
  });

  self.addEventListener("activate", function (evt){
    evt.waitUntil(caches.keys().then(keyList =>{
      return Promise.all(
        keyList.map(key=>{
          if (key !==CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Old cache data removed", key);
            return caches.delete(key);
          }
        })
      );
    })
    );
    self.clients.claim();
  });