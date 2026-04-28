// Service Worker — 缓存核心资源，支持离线打开
const CACHE_NAME = 'env-monitor-v1';

// 需要缓存的文件（离线也能打开 App 壳）
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安装：缓存核心文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：
//   本地文件 → 优先缓存（离线可用）
//   API 请求 → 优先网络（实时数据）
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // API 请求直接走网络，不缓存
  if (url.includes('heclouds.com') || url.includes('cdn.jsdelivr.net')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 本地资源：缓存优先
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // 顺手缓存新资源
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});