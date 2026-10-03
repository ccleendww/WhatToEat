// Service Worker - 食物转盘 PWA
const CACHE_NAME = 'food-wheel-v1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icons/icon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// 安装事件 - 缓存应用资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('缓存已打开');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果缓存中有，直接返回缓存
                if (response) {
                    return response;
                }

                // 否则发起网络请求
                return fetch(event.request).then(response => {
                    // 检查是否是有效的响应
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // 克隆响应（因为响应流只能读取一次）
                    const responseToCache = response.clone();

                    // 将新资源加入缓存
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            // 只缓存同源的GET请求
                            if (event.request.method === 'GET' && 
                                event.request.url.startsWith(self.location.origin)) {
                                cache.put(event.request, responseToCache);
                            }
                        });

                    return response;
                }).catch(() => {
                    // 网络失败时，可以返回一个离线页面
                    // 这里我们直接返回缓存的首页
                    return caches.match('./index.html');
                });
            })
    );
});

// 处理推送通知（如果以后需要的话）
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: 'icons/icon-192.png',
            badge: 'icons/icon-72.png'
        });
    }
});

// 处理通知点击
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('./')
    );
});
