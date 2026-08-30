/**
 * 타이밍 측정 + Service Worker 등록
 */
(function() {
  // Service Worker 등록
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../sw.js').catch(() => {});
  }

  const t0 = performance.now();
  let raf = null, load = null;

  const panel = document.createElement('div');
  panel.id = 'dbg';
  panel.innerHTML = '<b>RAF</b> -<br><b>Load</b> -<br><b>Diff</b> -';
  Object.assign(panel.style, {
    position: 'fixed', top: '8px', right: '8px',
    background: '#fff', padding: '8px 12px',
    borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,.15)',
    fontSize: '13px', fontFamily: 'system-ui', lineHeight: '1.6'
  });
  document.body.appendChild(panel);

  function update() {
    if (raf === null || load === null) return;
    const diff = Math.abs(raf - load);
    const ok = diff >= 100;
    panel.innerHTML =
      `<b>RAF</b> ${raf}ms<br>` +
      `<b>Load</b> ${load}ms<br>` +
      `<b>Diff</b> ${diff}ms ` +
      (ok ? '🟢' : '🔴');
    panel.style.background = ok ? '#e8f8ec' : '#ffebea';
  }

  requestAnimationFrame(() => {
    raf = Math.round(performance.now() - t0);
    update();
  });

  window.addEventListener('load', () => {
    load = Math.round(performance.now() - t0);
    update();
  });
})();
