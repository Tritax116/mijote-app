const CACHE = "mijote-v6"
const FICHIERS = [
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json"
]

self.addEventListener("install", function(e) {
    self.skipWaiting()
    e.waitUntil(
        caches.open(CACHE).then(function(cache) {
            return cache.addAll(FICHIERS)
        })
    )
})

self.addEventListener("activate", function(e) {
    e.waitUntil(
        caches.keys().then(function(clesExistantes) {
            return Promise.all(
                clesExistantes
                    .filter(function(cle) { return cle !== CACHE })
                    .map(function(cle) { return caches.delete(cle) })
            )
        }).then(function() {
            return self.clients.claim()
        })
    )
})

// Stratégie "réseau d'abord" : on essaie toujours de récupérer la dernière
// version en ligne, et on ne retombe sur le cache que si hors-ligne.
self.addEventListener("fetch", function(e) {
    e.respondWith(
        fetch(e.request)
            .then(function(response) {
                const copie = response.clone()
                caches.open(CACHE).then(function(cache) {
                    cache.put(e.request, copie)
                })
                return response
            })
            .catch(function() {
                return caches.match(e.request)
            })
    )
})
