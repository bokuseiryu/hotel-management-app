// ==================================================================
// Service Worker - オフラインキャッシュとパフォーマンス最適化
// Service Worker - Offline Cache and Performance Optimization
// ==================================================================

const CACHE_NAME = 'hotel-daily-report-v1';
const STATIC_CACHE_NAME = 'hotel-static-v1';

// キャッシュするリソース
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo192.png',
    '/logo512.png',
    '/icon.svg'
];

// インストール時にキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: キャッシュを開きました');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
                        console.log('Service Worker: 古いキャッシュを削除:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// フェッチリクエストの処理
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // APIリクエストはネットワーク優先
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    return response;
                })
                .catch(() => {
                    // オフライン時はキャッシュから取得を試みる
                    return caches.match(request);
                })
        );
        return;
    }

    // 静的リソースはキャッシュ優先
    event.respondWith(
        caches.match(request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(request).then((response) => {
                    // 有効なレスポンスのみキャッシュ
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches.open(STATIC_CACHE_NAME)
                        .then((cache) => {
                            cache.put(request, responseToCache);
                        });

                    return response;
                });
            })
    );
});
