// Service Worker: 리소스 로딩 지연 시뮬레이션

// 지정된 크기의 PNG 생성 (회색 사각형)
function createPNG(width, height) {
  // 간단한 회색 SVG를 PNG 대신 사용 (Service Worker에서 Canvas 사용 불가)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect fill="#ddd" width="100%" height="100%"/></svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

// 1x1 PNG (지연 전용)
const TINY_PNG = Uint8Array.from(atob(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
), c => c.charCodeAt(0));

// 즉시 활성화
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 크기 지정 이미지: /delay/{ms}/image/{size} (예: /delay/0/image/32)
  const sizedImgMatch = url.pathname.match(/\/delay\/(\d+)\/image\/(\d+)/);
  if (sizedImgMatch) {
    const delayMs = parseInt(sizedImgMatch[1]);
    const size = parseInt(sizedImgMatch[2]);
    event.respondWith(
      new Promise(resolve => {
        setTimeout(() => {
          resolve(new Response(createPNG(size, size), {
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'no-cache'
            }
          }));
        }, delayMs);
      })
    );
    return;
  }

  // 이미지 지연: /delay/{ms}/image (1x1 PNG)
  const imgMatch = url.pathname.match(/\/delay\/(\d+)\/image$/);
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
