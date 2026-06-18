const CACHE_NAME = 'p57-app-shell-v3';
const APP_SHELL_KEY = '/__p57_app_shell__';
const OFFLINE_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Studio Pulse</title>
    <style>
      body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8fafc;color:#0f172a}
      main{max-width:420px;padding:32px;text-align:center}
      h1{font-size:22px;margin:0 0 10px}
      p{margin:0;color:#475569;line-height:1.5}
    </style>
  </head>
  <body>
    <main>
      <h1>Studio Pulse is offline</h1>
      <p>Reconnect and refresh this page to load the latest dashboard or report view.</p>
    </main>
  </body>
</html>`;
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
  '/',
  '/index.html',
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
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith('p57-app-shell-') && name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
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
        const cached = await cache.match(request) || await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;
        const shell = await cache.match(APP_SHELL_KEY);
        if (shell) return shell;
        const indexShell = await cache.match('/index.html') || await cache.match('/');
        if (indexShell) return indexShell;
        return new Response(OFFLINE_SHELL, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
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
      if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
        const shell = await cache.match(APP_SHELL_KEY);
        if (shell) return shell;
        const indexShell = await cache.match('/index.html') || await cache.match('/');
        if (indexShell) return indexShell;
        return new Response(OFFLINE_SHELL, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      return new Response('', { status: 504, statusText: 'Gateway Timeout' });
    }
  })());
});
