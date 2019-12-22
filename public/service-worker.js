const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/db.js",
    "/style.css"];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// Install service worker
self.addEventListener("install", evt => {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Your files were pre-cached successfully");
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", evt => {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch
self.addEventListener("fetch", evt => {
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
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(evt.request).then(response => {
                return response || fetch(evt.request)
            });
        })
    );
});