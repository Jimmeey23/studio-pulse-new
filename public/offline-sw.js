const CACHE_NAME = 'p57-app-shell-v1';
const APP_SHELL_KEY = '/__p57_app_shell__';
const POPOVER_CONTEXTS = [
  'class-attendance-overview',
  'class-formats-overview',
  'client-retention-overview',
  'discounts-promotions-overview',
  'executive-overview',
  'expiration-analytics-overview',
  'funnel-leads-overview',
  'late-cancellations-overview',
  'outlier-analysis-overview',
  'patterns-trends-overview',
  'sales-overview',
  'sessions-overview',
  'trainer-performance-overview',
];
const POPOVER_LOCATIONS = ['all', 'kwality', 'supreme', 'kenkere'];
const PRECACHE_URLS = [
  '/popovers/default-template.html',
  '/popovers/0/0.html',
  ...POPOVER_CONTEXTS.flatMap((context) =>
    POPOVER_LOCATIONS.map((location) => `/popovers/${context}/${location}.html`)
  ),
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(
      PRECACHE_URLS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'reload' });
          if (response.ok) {
            await cache.put(url, response.clone());
          }
        } catch (error) {
          // Ignore individual precache failures so installation can still complete.
        }
      })
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(APP_SHELL_KEY, response.clone());
          await cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        const shell = await cache.match(APP_SHELL_KEY);
        if (shell) return shell;
        throw error;
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  })());
});
