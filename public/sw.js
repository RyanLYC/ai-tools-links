const CACHE_NAME = 'ai-tools-cache-v1'

self.addEventListener('install', (event) => {
  // 缓存入口页（相对于 SW 作用域），失败不阻塞安装
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(['./']).catch(() => undefined))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // 仅处理 GET 请求
  if (request.method !== 'GET') return

  // 页面导航：network-first，离线时回退缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('./', copy))
          return response
        })
        .catch(() => caches.match('./'))
    )
    return
  }

  // 带 hash 的静态资源：cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && new URL(request.url).pathname.includes('/assets/')) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
    })
  )
})
