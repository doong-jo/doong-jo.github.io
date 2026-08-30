// Service Worker: 리소스 로딩 지연 시뮬레이션
const TINY_PNG = Uint8Array.from(atob(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
), c => c.charCodeAt(0));

// 즉시 활성화
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 이미지 지연: /delay/{ms}/image
  const imgMatch = url.pathname.match(/\/delay\/(\d+)\/image/);
  if (imgMatch) {
    const delayMs = parseInt(imgMatch[1]);
    event.respondWith(
      new Promise(resolve => {
        setTimeout(() => {
          resolve(new Response(TINY_PNG, {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'no-cache'
            }
          }));
        }, delayMs);
      })
    );
    return;
  }

  // 스크립트 지연: /delay/{ms}/script
  const scriptMatch = url.pathname.match(/\/delay\/(\d+)\/script/);
  if (scriptMatch) {
    const delayMs = parseInt(scriptMatch[1]);
    event.respondWith(
      new Promise(resolve => {
        setTimeout(() => {
          resolve(new Response('/* delayed script */', {
            headers: {
              'Content-Type': 'application/javascript',
              'Cache-Control': 'no-cache'
            }
          }));
        }, delayMs);
      })
    );
  }
});
