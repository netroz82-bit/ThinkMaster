const CACHE_NAME = 'master-jalali-ai-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(SHELL_ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Never intercept cross-origin requests (Gemini / OpenRouter / custom AI APIs) —
  // those must always go straight to the network.
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      const network = fetch(event.request).then(function(res){
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
