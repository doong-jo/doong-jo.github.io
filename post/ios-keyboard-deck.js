// "iOS 웹뷰 키보드 화면 밀림" 덱. 원본 발표 덱 스크립트를 블로그용으로 옮겼다.
// 덱 내비게이션
(() => {
  const root = document.getElementById('ikDeck')
  const slides = [...root.querySelectorAll('.slide')]
  const track = document.getElementById('track')
  const count = document.getElementById('count')
  const prev = document.getElementById('prev')
  const next = document.getElementById('next')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let cur = 0

  const dots = slides.map((s, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.setAttribute('aria-label', `${i + 1}. ${s.getAttribute('aria-label')}`)
    b.title = `${s.dataset.sec} · ${s.getAttribute('aria-label')}`
    b.addEventListener('click', () => go(i))
    track.append(b)
    return b
  })

  function go(i, init = false) {
    i = Math.max(0, Math.min(slides.length - 1, i))
    if (i === cur && !init) return
    slides[cur].hidden = true
    const s = slides[i]
    s.hidden = false
    s.scrollTop = 0
    s.style.setProperty('--dir', i >= cur ? '16px' : '-16px')
    s.classList.remove('enter')
    if (!reduce) { void s.offsetWidth; s.classList.add('enter') }
    cur = i
    dots.forEach((d, k) => {
      d.classList.toggle('done', k < i)
      if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current')
    })
    count.textContent = `${i + 1} / ${slides.length}`
    prev.disabled = i === 0
    next.disabled = i === slides.length - 1
    try { history.replaceState(null, '', `#s${i + 1}`) } catch {}
    document.dispatchEvent(new CustomEvent('slideshow', { detail: s }))
  }

  prev.addEventListener('click', () => go(cur - 1))
  next.addEventListener('click', () => go(cur + 1))
  // 전체 화면: Fullscreen API가 없으면(iOS Safari 등) 뷰포트를 덮는 클래스로 대신한다
  const fsBtn = document.getElementById('fsBtn')
  const isFull = () => document.fullscreenElement === root || root.classList.contains('is-max')
  const syncFs = () => {
    const on = isFull()
    fsBtn.setAttribute('aria-pressed', String(on))
    fsBtn.setAttribute('aria-label', on ? '전체 화면 나가기' : '전체 화면')
  }
  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else if (root.classList.contains('is-max')) root.classList.remove('is-max')
    else if (root.requestFullscreen) root.requestFullscreen().catch(() => root.classList.add('is-max'))
    else root.classList.add('is-max')
    syncFs()
  }
  fsBtn.addEventListener('click', toggleFs)
  document.addEventListener('fullscreenchange', syncFs)

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('is-max')) { root.classList.remove('is-max'); syncFs(); return }
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input, textarea, select')) return
    const r = root.getBoundingClientRect()
    if (!isFull() && (r.bottom < window.innerHeight * 0.3 || r.top > window.innerHeight / 2)) return
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(cur + 1) }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(cur - 1) }
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(slides.length - 1)
    else if (e.code === 'KeyF') toggleFs()
  })
  // 스와이프: 가로로 충분히 밀면 슬라이드를 넘긴다. 가로 스크롤 영역·입력 위에서 시작하면 그쪽에 양보한다
  const scrollsX = (el) => {
    for (; el && el !== root; el = el.parentElement) {
      if (el.matches('input, select, textarea')) return true
      if (el.scrollWidth > el.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return true
    }
    return false
  }
  let touch = null
  const deck = document.getElementById('deck')
  deck.addEventListener('touchstart', (e) => {
    const t = e.touches[0]
    touch = e.touches.length === 1 && !scrollsX(e.target) ? { x: t.clientX, y: t.clientY } : null
  }, { passive: true })
  deck.addEventListener('touchend', (e) => {
    if (!touch) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touch.x, dy = t.clientY - touch.y
    touch = null
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1))
  }, { passive: true })

  const m = /^#s(\d+)$/.exec(location.hash)
  go(m ? +m[1] - 1 : 0, true)
})()

// 2장: 반복 측정 점
document.querySelectorAll('.dots[data-n]').forEach((d) => {
  d.setAttribute('aria-label', `${d.dataset.n}회 모두 변화 0`)
  d.innerHTML = '<i></i>'.repeat(+d.dataset.n)
})

// 4장: 뒤늦은 보정 그래프
;(() => {
  const svg = document.getElementById('lagChart')
  const W = 760, H = 300, L = 64, R = 24, T = 20, B = 44, TMAX = 600, YMAX = 240
  const X = (t) => L + (t / TMAX) * (W - L - R)
  const Y = (v) => T + (1 - v / YMAX) * (H - T - B)
  const ease = (p) => 1 - Math.pow(1 - p, 3)
  const off = (t) => (t < 40 ? 0 : t > 340 ? YMAX : YMAX * ease((t - 40) / 300))
  // 보정은 rAF 한 프레임(17ms) 늦게 시작해 transition처럼 천천히 따라간다
  const pts = []
  let comp = 0
  for (let t = 0; t <= TMAX; t += 2) {
    comp += (off(Math.max(0, t - 17)) - comp) * (1 - Math.exp(-2 / 70))
    pts.push([t, off(t), comp])
  }
  const line = (k) => pts.map(([t, ...v], i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${Y(v[k]).toFixed(1)}`).join(' ')
  const area = pts.map(([t, o], i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${Y(o).toFixed(1)}`).join(' ')
    + ' ' + pts.slice().reverse().map(([t, , c]) => `L${X(t).toFixed(1)} ${Y(c).toFixed(1)}`).join(' ') + ' Z'
  let g = ''
  for (const v of [0, 120, 240]) {
    g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/>`
    g += `<text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" fill="var(--muted)">${v}px</text>`
  }
  for (let t = 0; t <= TMAX; t += 100) g += `<text x="${X(t)}" y="${H - B + 18}" text-anchor="middle" fill="var(--muted)">${t}ms</text>`
  const peak = pts.reduce((a, p) => (p[1] - p[2] > a[1] - a[2] ? p : a))
  svg.innerHTML = `<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11">${g}
    <path d="${area}" fill="var(--warn-soft)"/>
    <path d="${line(0)}" fill="none" stroke="var(--warn)" stroke-width="2.5"/>
    <path d="${line(1)}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
    <line x1="${X(peak[0])}" x2="${X(peak[0])}" y1="${Y(peak[1])}" y2="${Y(peak[2])}" stroke="var(--ink)" stroke-dasharray="3 3"/>
    <text x="${X(peak[0]) + 8}" y="${(Y(peak[1]) + Y(peak[2])) / 2 + 4}" fill="var(--ink)" font-family="Pretendard Variable, Pretendard, sans-serif" font-size="13" font-weight="700">헤더가 화면 밖 ${Math.round(peak[1] - peak[2])}px</text>
    <text x="${X(40)}" y="${Y(0) - 10}" fill="var(--muted)" font-family="Pretendard Variable, Pretendard, sans-serif" font-size="12">WebKit이 밀기 시작</text>
  </g>`
})()

// 6장: opacity 곱 실험
;(() => {
  const $ = (id) => document.getElementById(id)
  const ins = { i: $('olIn'), p: $('olPar'), a: $('olAnc') }
  const outs = { i: $('olInV'), p: $('olParV'), a: $('olAncV') }
  const fmt = (v) => (v === 0 || v === 1 ? String(v) : v.toFixed(2).replace(/0+$/, ''))
  function update() {
    const v = { i: ins.i.value / 100, p: ins.p.value / 100, a: ins.a.value / 100 }
    for (const k in v) outs[k].textContent = v[k].toFixed(2)
    $('olI').style.opacity = v.i
    $('olP').style.opacity = v.p
    $('olA').style.opacity = v.a
    const prod = v.i * v.p * v.a
    const shown = prod === 0 ? '0' : prod < 0.0001 ? prod.toExponential(1) : String(+prod.toPrecision(3))
    $('olEq').textContent = `${fmt(v.i)} × ${fmt(v.p)} × ${fmt(v.a)} = ${shown}`
    const transparent = prod < 0.01
    const vd = $('olVerdict')
    vd.textContent = transparent ? '투명 → 화면 안 밀림' : '보임 → 화면 밀림'
    vd.className = `verdict ${transparent ? 'ok' : 'bad'}`
    // 로그 눈금: 0.0001(0%) ~ 1(100%), 0.01이 가운데
    const pos = prod <= 0 ? 0 : Math.max(0, Math.min(100, ((Math.log10(prod) + 4) / 4) * 100))
    $('olDot').style.left = `${pos}%`
    $('olDot').style.background = transparent ? 'var(--ok)' : 'var(--warn)'
  }
  Object.values(ins).forEach((el) => el.addEventListener('input', update))
  document.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
    const [i, p, a] = b.dataset.p.split(',')
    ins.i.value = i; ins.p.value = p; ins.a.value = a
    update()
  }))
  update()
})()

// 13장: 시뮬레이터 · 12장: 목록 보정 데모
;(() => {
  const H = 520, K = 220, BAR = 68, TH = 150, FRAME_MS = 1000 / 60
  const $ = (id) => document.getElementById(id)
  const el = {
    page: $('page'), frame: $('frame'), hdr: $('hdr'), listVp: $('listVp'), list: $('list'),
    field: $('field'), fieldWrap: $('fieldWrap'), ghost: $('ghostTag'), kb: $('kb'), log: $('log'),
    tap: $('tapBtn'), close: $('closeBtn'), reset: $('resetBtn'), slow: $('slowChk'),
    rVv: $('rVv'), rOff: $('rOff'), rHdr: $('rHdr'), rOp: $('rOp'), rAe: $('rAe'), rFr: $('rFr'),
    plot: $('plot'), maxDev: $('maxDev'), board: $('board'), status: $('status'),
  }
  const MODE = { before: 'Before', mid: '중간 시도', after: 'After' }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let mode = 'before'
  let s, anim = null, samples = [], prevPage = 0, prevKb = 0, kbShown = false, tapCount = 0, raf = 0, last = 0

  const initial = () => ({ kb: 0, page: 0, hdrComp: 0, frameComp: 0, frameH: H, listScroll: 0, opacity: 1, focused: false })
  const maxScroll = () => Math.max(0, el.list.offsetHeight - (s.frameH - BAR))
  const headerY = () => -s.page + s.frameComp + s.hdrComp
  const easeOut = (p) => 1 - Math.pow(1 - p, 3)
  const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)

  function render() {
    el.page.style.transform = `translateY(${-s.page}px)`
    el.frame.style.height = `${s.frameH}px`
    el.frame.style.transform = s.frameComp ? `translateY(${s.frameComp}px)` : ''
    el.hdr.style.transform = s.hdrComp ? `translateY(${s.hdrComp}px)` : ''
    el.list.style.transform = `translateY(${-s.listScroll}px)`
    el.field.style.opacity = s.opacity
    el.field.classList.toggle('focused', s.focused)
    el.fieldWrap.classList.toggle('ghost', s.opacity < 1)
    el.ghost.hidden = s.opacity >= 1
    el.kb.style.transform = `translateY(${K - s.kb}px)`
    el.rVv.textContent = Math.round(H - s.kb)
    el.rOff.textContent = Math.round(s.page)
    const y = Math.round(headerY())
    el.rHdr.textContent = y
    el.rHdr.style.color = Math.abs(y) > 1 ? 'var(--warn)' : ''
    el.rOp.textContent = s.opacity
    el.rAe.textContent = s.focused ? 'textarea' : 'body'
    el.rFr.textContent = Math.round(s.frameH)
    // disabled는 키보드 포커스를 잃게 해서 aria-disabled로 상태만 알린다
    el.tap.setAttribute('aria-disabled', String(!!anim || s.kb > 0))
    el.close.setAttribute('aria-disabled', String(!!anim || s.kb === 0))
  }

  function clearEmpty(list) {
    const empty = list.querySelector('.empty')
    if (empty) empty.remove()
  }
  function log(text, cls) {
    clearEmpty(el.log)
    const li = document.createElement('li')
    const t = document.createElement('time')
    t.textContent = anim ? `+${Math.round(anim.t)}ms` : ''
    const span = document.createElement('span')
    span.textContent = text
    if (cls) span.className = cls
    li.append(t, span)
    el.log.append(li)
    el.log.scrollTop = el.log.scrollHeight
  }
  function sep(text) {
    clearEmpty(el.log)
    const li = document.createElement('li')
    li.className = 'sep'
    li.textContent = text
    el.log.append(li)
  }

  function start(label, end) {
    anim = { t: 0, end, label, tweens: [], events: [] }
    samples = []
    prevPage = s.page
    prevKb = s.kb
  }
  const tween = (key, to, t0, dur, ease = easeOut) => anim.tweens.push({ key, to, t0, dur, ease, from: null })
  const at = (t0, fn) => anim.events.push({ t0, fn, done: false })

  // visualViewport resize: 키보드 열림/닫힘 판정이 바뀌는 순간
  function onKeyboardChange(shown) {
    if (shown) {
      log('visualViewport resize: 높이가 150px 이상 줄어듦 (키보드 표시)')
      if (s.opacity < 1) { s.opacity = 1; log('① hideUntilKeyboardShown: opacity 복구', 'o') }
      if (mode !== 'before') {
        log('③ 프레임 height = visualViewport.height', 'o')
        log('④ 목록이 줄어든 만큼 scrollTop 올림 (anchorShift 누적)', 'o')
      }
    } else {
      log('visualViewport resize: 높이 복구 (키보드 내려감)')
      if (mode === 'after' && s.focused) { s.focused = false; log('② blurWhenKeyboardHides: textarea.blur()', 'o') }
      if (mode !== 'before') log('③④ 프레임 높이 복구, anchorShift만큼 scrollTop 되돌림', 'o')
    }
  }

  function tap() {
    if (anim || s.kb > 0) return
    const fresh = !s.focused
    tapCount += 1
    sep(`${MODE[mode]} · ${tapCount}회차 열기`)
    start(`${MODE[mode]} ${tapCount}회차 열기`, mode === 'before' ? 750 : 650)
    if (mode === 'before') {
      at(0, () => { s.focused = true; log(fresh ? 'focus 이벤트' : '탭 (포커스가 남아 있는 상태)') })
      tween('kb', K, 0, 320)
      at(40, () => log('WebKit: 입력창이 키보드에 가림 → 화면을 민다 (offsetTop 증가)', 'w'))
      tween('page', K, 40, 300)
      at(60, () => log('useStickyToVisualViewport: rAF + transition 200ms로 헤더를 뒤따라 내림', 'w'))
    } else if (fresh) {
      at(0, () => {
        s.focused = true
        log('focus 이벤트')
        s.opacity = 0
        log('① hideUntilKeyboardShown: 키보드가 닫혀 있으니 opacity 0', 'o')
      })
      tween('kb', K, 0, 320)
      at(40, () => log('WebKit: 키보드가 뜨는 순간, 입력창이 투명 → 화면을 밀지 않음', 'o'))
    } else {
      at(0, () => log('포커스가 남아 있어 focus 이벤트 없음 → ① 투명 처리가 걸리지 않음', 'w'))
      tween('kb', K, 0, 320)
      at(140, () => log('WebKit: 키보드가 뜬 뒤(resize 약 50ms 후) 화면을 밀기로 결정', 'w'))
      tween('page', 120, 140, 260)
      at(160, () => log('③ offsetTop > 0 → rAF로 프레임 translateY (뒤늦게 따라감)', 'w'))
    }
    run()
  }

  function close() {
    if (anim || s.kb === 0) return
    sep(`${MODE[mode]} · 닫기`)
    start(`${MODE[mode]} ${tapCount}회차 닫기`, mode === 'before' ? 700 : 550)
    at(0, () => log('네이티브가 키보드를 내림 (DOM 포커스는 그대로)'))
    tween('kb', 0, 0, 300, easeInOut)
    if (s.page > 0) tween('page', 0, 0, 300, easeInOut)
    if (mode === 'before') at(20, () => log('헤더 보정이 200ms 늦게 따라와 아래로 튀었다가 복귀', 'w'))
    run()
  }

  function finish() {
    if (mode === 'before') s.hdrComp = s.page
    else { s.frameComp = s.page; s.listScroll = maxScroll() }
    if (s.kb === 0 && s.page === 0) { s.hdrComp = 0; s.frameComp = 0 }
    for (const e of anim.events) if (!e.done) e.fn()
    const dev = Math.round(samples.reduce((m, [, y]) => Math.max(m, Math.abs(y)), 0))
    addResult(anim.label, dev)
    el.status.textContent = `${anim.label}: 헤더 최대 이탈 ${dev}px`
    const closing = s.kb === 0
    anim = null
    if (mode === 'mid' && closing && s.focused) log('→ 포커스가 남았다. 이제 입력창을 다시 탭해 보자', 'h')
    render()
    drawPlot()
  }

  // 시뮬레이션 시간 dt(ms)만큼 진행. 끝나면 true
  function step(dt) {
    anim.t += dt
    const t = anim.t
    for (const e of anim.events) if (!e.done && e.t0 <= t) { e.done = true; e.fn() }
    for (const w of anim.tweens) {
      if (t < w.t0) continue
      if (w.from === null) w.from = s[w.key]
      const p = Math.min(1, (t - w.t0) / w.dur)
      s[w.key] = w.from + (w.to - w.from) * w.ease(p)
    }

    // 보정 로직은 이전 프레임 값을 본다 (rAF 한 프레임 지연)
    const k = (tau) => 1 - Math.exp(-dt / tau)
    if (mode === 'before') {
      s.hdrComp += (prevPage - s.hdrComp) * k(70)
    } else {
      s.frameH = H - prevKb
      s.frameComp += (prevPage - s.frameComp) * k(45)
      s.listScroll = maxScroll()
    }
    prevPage = s.page
    prevKb = s.kb

    const shown = s.kb > TH
    if (shown !== kbShown) { kbShown = shown; onKeyboardChange(shown) }
    samples.push([t, headerY()])

    const tweensDone = anim.tweens.every((w) => t >= w.t0 + w.dur)
    const settled = mode === 'before'
      ? Math.abs(s.hdrComp - s.page) < 0.5
      : Math.abs(s.frameComp - s.page) < 0.5 && s.frameH === H - s.kb
    return t >= anim.end && tweensDone && settled
  }

  function run() {
    if (reduce) {
      // 움직임을 줄인 환경: 같은 타임라인을 한 번에 계산하고 결과만 그린다
      let guard = 0
      while (anim && guard++ < 1000) if (step(FRAME_MS)) finish()
      return
    }
    cancelAnimationFrame(raf)
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }
  function frame(now) {
    if (!anim) return
    const dt = Math.min(50, Math.max(0, now - last)) / (el.slow.checked ? 3 : 1)
    last = now
    const done = step(dt)
    render()
    drawPlot()
    if (done) finish()
    else raf = requestAnimationFrame(frame)
  }

  function addResult(label, dev) {
    clearEmpty(el.board)
    const li = document.createElement('li')
    li.className = dev > 1 ? 'bad' : 'good'
    li.textContent = `${label} ${dev}px`
    el.board.append(li)
  }

  const css = (name) => getComputedStyle(document.getElementById('ikDeck')).getPropertyValue(name).trim()
  function drawPlot() {
    const c = el.plot, dpr = window.devicePixelRatio || 1
    const w = c.clientWidth, h = c.clientHeight
    if (!w || !h) return
    const W = Math.round(w * dpr), HH = Math.round(h * dpr)
    if (c.width !== W || c.height !== HH) { c.width = W; c.height = HH }
    const g = c.getContext('2d')
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, w, h)
    g.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
    g.fillStyle = css('--muted')
    if (!samples.length) {
      el.maxDev.textContent = '–'
      el.maxDev.style.color = ''
      g.fillText('입력창을 탭하면 헤더 위치를 기록한다', 12, h / 2 + 4)
      return
    }
    const maxAbs = samples.reduce((m, [, y]) => Math.max(m, Math.abs(y)), 0)
    const range = Math.max(20, Math.ceil(maxAbs / 20) * 20)
    const t1 = Math.max(samples[samples.length - 1][0], 1)
    const padL = 58, padR = 8, padT = 10, padB = 18
    const X = (t) => padL + (t / t1) * (w - padL - padR)
    // 화면 Y가 음수(위로 밀림)면 그래프에서도 위로 그린다
    const Y = (y) => padT + ((y + range) / (2 * range)) * (h - padT - padB)
    g.strokeStyle = css('--line')
    g.lineWidth = 1
    const labels = [[-range, `↑ ${range}`], [0, '0'], [range, `↓ ${range}`]]
    for (const [v, text] of labels) {
      g.beginPath(); g.moveTo(padL, Y(v)); g.lineTo(w - padR, Y(v)); g.stroke()
      g.fillText(text, 6, Y(v) + 4)
    }
    g.fillText(`${Math.round(t1)}ms`, w - padR - 44, h - 4)
    const bad = maxAbs > 1
    g.strokeStyle = bad ? css('--warn') : css('--ok')
    g.lineWidth = 2
    g.beginPath()
    samples.forEach(([t, y], i) => (i ? g.lineTo(X(t), Y(y)) : g.moveTo(X(t), Y(y))))
    g.stroke()
    el.maxDev.textContent = `${Math.round(maxAbs)}px`
    el.maxDev.style.color = bad ? 'var(--warn)' : 'var(--ok)'
  }

  function reset() {
    cancelAnimationFrame(raf)
    anim = null
    s = initial()
    kbShown = false
    tapCount = 0
    samples = []
    s.listScroll = maxScroll()
    el.log.innerHTML = '<li class="empty">입력창을 탭하면 이벤트 순서가 여기에 쌓인다.</li>'
    render()
    drawPlot()
  }

  el.tap.addEventListener('click', tap)
  el.close.addEventListener('click', close)
  el.reset.addEventListener('click', () => {
    el.board.innerHTML = '<li class="empty">동작별 최대 이탈이 여기 쌓인다</li>'
    reset()
  })
  el.field.addEventListener('click', tap)
  el.field.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap() } })
  el.listVp.addEventListener('click', close)
  document.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener('change', () => { mode = r.value; reset() }))
  window.addEventListener('resize', drawPlot)
  new ResizeObserver(() => { if (!anim) { s.listScroll = maxScroll(); render() } }).observe(el.list)
  if (document.fonts) document.fonts.ready.then(() => { drawPlot(); adUpdate() })

  // 목록 위치 보정 데모
  const ad = { vp: $('adVp'), list: $('adList'), down: $('adDown'), range: $('adRange'), anchor: $('adAnchor'), val: $('adVal'), shift: $('adShift'), hidden: $('adHidden') }
  const AD_H = 250
  function adUpdate() {
    const v = +ad.range.value
    const vpH = AD_H - v
    const listH = ad.list.offsetHeight
    if (!listH) return
    const base = Math.max(0, listH - AD_H)
    const top = ad.anchor.checked ? Math.min(base + v, Math.max(0, listH - vpH)) : base
    ad.vp.style.height = `${vpH}px`
    ad.list.style.transform = `translateY(${-top}px)`
    const hidden = Math.max(0, listH - top - vpH)
    ad.down.hidden = hidden < 2
    ad.val.textContent = `${v}px`
    ad.shift.textContent = `${Math.round(top - base)}px`
    ad.hidden.textContent = `${Math.round(hidden)}px`
    ad.hidden.style.color = hidden >= 2 ? 'var(--warn)' : 'var(--ok)'
  }
  ad.range.addEventListener('input', adUpdate)
  ad.anchor.addEventListener('change', adUpdate)

  // 숨은 슬라이드는 크기가 0이라 보일 때 다시 잰다
  document.addEventListener('slideshow', (e) => {
    if (e.detail.contains(el.plot)) { s.listScroll = maxScroll(); render(); drawPlot() }
    if (e.detail.contains(ad.list)) adUpdate()
  })

  reset()
  adUpdate()
})()
