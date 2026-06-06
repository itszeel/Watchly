const CACHE = 'watchly-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))))
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  event.respondWith(
    fetch(request)
      .then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(cache => cache.put(request, clone))
        return res
      })
      .catch(() => caches.match(request))
  )
})
