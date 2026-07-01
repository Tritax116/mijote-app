const CACHE = "mijote-v3"
const FICHIERS = [
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json"
]

self.addEventListener("install", function(e) {
    e.waitUntil(
        caches.open(CACHE).then(function(cache) {
            return cache.addAll(FICHIERS)
        })
    )
})

self.addEventListener("fetch", function(e) {
    e.respondWith(
        caches.match(e.request).then(function(response) {
            return response || fetch(e.request)
        })
    )
})
