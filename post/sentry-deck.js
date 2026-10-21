// "에러 한 건이 알림이 되기까지" 덱. 원본 발표 덱 스크립트를 블로그용으로 옮겼다.
(() => {
  const $ = (id) => document.getElementById(id)
  const root = $('sjDeck')

  // ---------- 하이라이트 ----------
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const TOKEN = /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`[^`]*`)|\b(true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b|\b(const|let|if|return|export|async|await|function|import|from|type|throw|new|default)\b|([A-Za-z_$][\w$.-]*)(?=\??\s*:(?!:))/g
  function hl(src) {
    let out = '', last = 0, m
    TOKEN.lastIndex = 0
    while ((m = TOKEN.exec(src))) {
      out += esc(src.slice(last, m.index))
      const [t, c, s, b, num, kw, key] = m
      if (c) out += `<span class="c">${esc(c)}</span>`
      else if (s) out += `<span class="s">${esc(s)}</span>`
      else if (b || num) out += `<span class="n">${esc(t)}</span>`
      else if (kw) out += `<span class="kw">${esc(kw)}</span>`
      else if (key) out += `<span class="k2">${esc(key)}</span>`
      last = m.index + t.length
    }
    return out + esc(src.slice(last))
  }
  document.querySelectorAll('pre.hl').forEach((el) => { el.innerHTML = hl(el.textContent) })

  // ---------- 덱 ----------
  const slides = [...document.querySelectorAll('.slide')]
  const progress = $('progress')
  const tocPanel = $('tocPanel')
  // 슬라이드 안 스테퍼: 방향키가 먼저 단계를 넘기고, 끝에 닿으면 슬라이드를 넘긴다
  const steppers = new Map()
  let cur = 0

  slides.forEach((s, i) => {
    const b = document.createElement('button')
    b.type = 'button'; b.title = `${i + 1}. ${s.dataset.title}`; b.setAttribute('aria-label', b.title)
    b.addEventListener('click', () => go(i))
    progress.appendChild(b)
    const t = document.createElement('button')
    t.type = 'button'; t.innerHTML = `<span>${String(i + 1).padStart(2, '0')}</span><span>${esc(s.dataset.title)}</span>`
    t.addEventListener('click', () => { go(i); closeToc() })
    tocPanel.appendChild(t)
  })

  function go(i) {
    const prev = cur
    cur = Math.max(0, Math.min(slides.length - 1, i))
    slides.forEach((s, j) => { s.hidden = j !== cur })
    ;[...progress.children].forEach((b, j) => b.classList.toggle('on', j <= cur))
    ;[...tocPanel.children].forEach((b, j) => b.classList.toggle('on', j === cur))
    $('count').textContent = `${cur + 1} / ${slides.length}`
    $('nowTitle').textContent = slides[cur].dataset.title
    $('deck').scrollTop = 0
    // 앞으로 넘어와 들어오면 스테퍼를 처음부터
    if (cur > prev) steppers.get(cur)?.enter?.()
    try { history.replaceState(null, '', `#s${cur + 1}`) } catch {}
  }
  const closeToc = () => { $('toc').hidden = true }
  $('prevBtn').addEventListener('click', () => go(cur - 1))
  $('nextBtn').addEventListener('click', () => go(cur + 1))
  $('tocBtn').addEventListener('click', () => { $('toc').hidden = false; tocPanel.querySelector('.on')?.focus() })
  $('toc').addEventListener('click', (e) => { if (e.target.id === 'toc') closeToc() })

  // 전체 화면: Fullscreen API가 없으면(iOS Safari 등) 뷰포트를 덮는 클래스로 대신한다
  const fsBtn = $('fsBtn')
  const isFull = () => document.fullscreenElement === root || root.classList.contains('is-max')
  const syncFs = () => {
    const on = isFull()
    fsBtn.setAttribute('aria-pressed', String(on))
    fsBtn.textContent = on ? '나가기' : '전체 화면'
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

  // 값을 바꾼 select가 방향키를 가로채지 않게 포커스를 푼다
  document.addEventListener('change', (e) => { if (e.target.tagName === 'SELECT') e.target.blur() })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeToc(); $('gloss').hidden = true; hideTip?.(); document.activeElement?.blur?.()
      if (root.classList.contains('is-max')) { root.classList.remove('is-max'); syncFs() }
      return
    }
    if (e.target.matches?.('input[type=text], textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
    const r = root.getBoundingClientRect()
    if (!isFull() && (r.bottom < window.innerHeight * 0.3 || r.top > window.innerHeight / 2)) return
    const fwd = e.key === 'ArrowRight' || e.key === 'PageDown'
    const back = e.key === 'ArrowLeft' || e.key === 'PageUp'
    const stepper = steppers.get(cur)
    if (stepper && (fwd || back)) {
      e.preventDefault()
      if (fwd ? stepper.next() : stepper.prev()) return
    }
    if (stepper?.key && /^Digit\d$/.test(e.code) && stepper.key(Number(e.code.slice(5)))) return
    if (fwd) { e.preventDefault(); go(cur + 1) }
    else if (back) { e.preventDefault(); go(cur - 1) }
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
  $('deck').addEventListener('touchstart', (e) => {
    const t = e.touches[0]
    touch = e.touches.length === 1 && !scrollsX(e.target) ? { x: t.clientX, y: t.clientY } : null
  }, { passive: true })
  $('deck').addEventListener('touchend', (e) => {
    if (!touch) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touch.x, dy = t.clientY - touch.y
    touch = null
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1))
  }, { passive: true })

  // ---------- 쉽게 보기: 한 줄 설명 + 용어 풀이 ----------
  const GLOSSARY = [
    ['Sentry', '에러 기록을 모아 보여 주는 서비스. 응급실로 치면 의무기록실.'],
    ['SDK', '앱에 심는 Sentry 라이브러리(@sentry/nextjs). 에러를 주워 Sentry로 보내는 CCTV.'],
    ['DSN', '에러를 받을 Sentry 프로젝트 주소. 앱이 넘기는 설정값.'],
    ['이벤트', '에러가 한 번 날 때마다 생기는 기록 한 건.'],
    ['이슈', '같은 에러 이벤트들을 한데 묶은 것. Sentry 목록의 한 줄.'],
    ['fingerprint', '이벤트를 어느 이슈로 묶을지 정하는 이름표. 같으면 같은 이슈.'],
    ['level', '급한 정도. fatal > error > warning > info. error 이상만 알림.'],
    ['handled', '우리 코드가 잡아서 직접 보고한 에러.'],
    ['unhandled', '아무도 못 잡아서 SDK가 알아서 주운 에러. SDK를 직접 부른 경우도 같은 길로 간다.'],
    ['beforeSend', 'SDK가 이벤트를 보내기 직전에 부르는 우리 함수. 버리거나 고칠 수 있다.'],
    ['normalize', '1단계. 제각각인 에러를 같은 양식으로 정리한다(문진표).'],
    ['classify', '2단계. 보낼지, 얼마나 급한지(level) 정한다(중증도 분류).'],
    ['enrich', '3단계. 검색용 태그와 디버깅용 메모(context)를 붙인다(차트).'],
    ['record', '4단계. 앞의 결과를 모아 SDK로 보낸다.'],
    ['태그', '이슈를 검색·필터할 때 쓰는 짧은 꼬리표. 예: requestUrl.'],
    ['context', '이벤트 상세 화면에서 펼쳐 보는 메모. 요청 정보 등.'],
    ['ErrorBoundary', '화면을 그리다 에러가 나면, 깨진 화면 대신 대체 화면을 보여 주는 React 컴포넌트.'],
    ['error.tsx', 'Next.js App Router의 에러 화면 파일. ErrorBoundary 역할을 한다.'],
    ['throwOnError', 'React Query 옵션(true/false 또는 함수). 에러를 ErrorBoundary로 던질지 정한다. 우리 앱 기본값은 함수라 그 안에서 Sentry 보고도 한다.'],
    ['meta', '쿼리·뮤테이션에 붙이는 옵션 상자. 예: { sentryOn409: false }.'],
    ['앱 게이트', 'meta를 보고 Sentry에 보낼지 먼저 거르는 함수(shouldSendQueryErrorToSentry).'],
    ['useSuspenseQuery', '데이터가 올 때까지 화면을 기다리게 하는 React Query 훅. 앱 게이트(meta)를 건너뛰고, 바운더리가 잡은 뒤 패키지 분류는 탄다.'],
    ['useMutation', '데이터를 바꾸는 요청(POST 등)용 React Query 훅.'],
    ['Dedupe', '직전과 똑같은 이벤트가 또 오면 SDK가 버리는 기능.'],
    ['scope', 'SDK가 다음 이벤트에 붙일 값(태그·사용자 등)을 담아 두는 바구니.'],
    ['isPreProcessed', '"이미 분류했음" 표시 태그. beforeSend가 두 번 분류하지 않게 한다.'],
    ['ignoreErrors', '이 메시지가 들어간 에러는 SDK가 바로 버린다는 목록.'],
    ['axios', '브라우저에서 API를 부르는 HTTP 라이브러리. 우리 앱의 API 클라이언트.'],
    ['서버 컴포넌트', '브라우저가 아니라 Node 서버에서 그려지는 React 컴포넌트.'],
    ['onRequestError', '서버에서 화면을 그리다 에러가 나면 Next.js가 부르는 함수. 여기서 Sentry로 보낸다.'],
    ['digest', '서버 렌더 에러에 붙는 짧은 해시값. 브라우저 error.tsx는 이게 있으면 서버가 이미 보고했다고 보고 다시 보내지 않는다.'],
    ['릴레이', 'Sentry 알림을 받아 조건을 걸러 Google Chat으로 넘겨 주는 중간 스크립트.'],
    ['sentryCaptureException', '우리 패키지의 보고 함수(래퍼). 분류를 먼저 하고 Sentry로 보낸다. SDK 함수 대신 이걸 쓴다.'],
    ['Route Handler', 'Next.js의 서버 API 파일(route.ts). 서버에서 요청을 받아 응답한다.'],
    ['SSR', '서버에서 화면을 먼저 그려 보내는 것. \'use client\' 컴포넌트도 서버에서 한 번 그려진다.'],
    ['TanStack', 'React Query를 만든 라이브러리 이름(@tanstack/react-query).'],
    ['queryKey', 'React Query가 쿼리를 구분하는 키. 어떤 쿼리가 실패했는지 알려 준다.'],
    ['ServerFetchError', '서버에서 API를 부르다 실패하면 나는 우리 에러 클래스. 상태 코드·주소를 담는다.'],
    ['third_party_code', '"스택에 우리 코드 표시가 없다"는 태그. 남의 스크립트일 가능성이 높다는 뜻.'],
    ['메트릭 알럿', '이슈가 아니라 이벤트 개수(빈도)를 보고 울리는 Sentry 알림. level과 무관.'],
    ['Ownership Rules', 'URL·태그 패턴으로 이슈 담당 팀을 자동 지정하는 Sentry 규칙.'],
    ['Apps Script', 'Google의 서버리스 스크립트. 웹훅을 받는 Web App과 시간 트리거를 지원한다.'],
  ]
  const GLOSS = new Map(GLOSSARY)
  const TERM_RE = new RegExp(GLOSSARY.map(([t]) => t).sort((a, b) => b.length - a.length)
    .map((t) => /^[\x00-\x7f]+$/.test(t) ? `(?<![\\w.-])${t.replace(/[.]/g, '\\.')}(?![\\w])` : `(?<![가-힣])${t}`).join('|'), 'g')
  const SKIP_TAGS = new Set(['CODE', 'PRE', 'KBD', 'SCRIPT', 'STYLE', 'SELECT', 'OPTION', 'TEXTAREA', 'INPUT', 'DFN', 'BUTTON', 'LABEL', 'H1', 'H2', 'SMALL', 'SUMMARY'])
  function annotate(root) {
    const seen = new Set()
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        for (let el = n.parentElement; el && el !== root.parentElement; el = el.parentElement) {
          if (el instanceof SVGElement || SKIP_TAGS.has(el.tagName) || el.classList?.contains('chip') || el.classList?.contains('pill') || el.id === 'tip') return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      },
    })
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    for (const node of nodes) {
      const text = node.nodeValue
      TERM_RE.lastIndex = 0
      let m, last = 0, frag = null
      while ((m = TERM_RE.exec(text))) {
        if (seen.has(m[0])) continue
        seen.add(m[0])
        frag ??= document.createDocumentFragment()
        frag.append(text.slice(last, m.index))
        const d = document.createElement('dfn')
        d.className = 'term'; d.tabIndex = 0; d.dataset.t = m[0]; d.textContent = m[0]
        frag.append(d)
        last = m.index + m[0].length
      }
      if (frag) { frag.append(text.slice(last)); node.replaceWith(frag) }
    }
  }
  slides.forEach((s) => annotate(s))
  // 렌더로 새로 그려지는 패널에도 용어 풀이를 붙인다
  new MutationObserver((muts) => {
    for (const mu of muts) for (const n of mu.addedNodes) {
      if (n.nodeType === 1 && !(n instanceof SVGElement) && n.tagName !== 'DFN' && !n.closest('dfn') && !n.closest('#tip')) annotate(n)
    }
  }).observe($('deck'), { childList: true, subtree: true })

  const tip = $('tip')
  const showTip = (d) => {
    if (root.classList.contains('plain')) return
    tip.innerHTML = `<b>${esc(d.dataset.t)}</b>${esc(GLOSS.get(d.dataset.t) || '')}`
    tip.hidden = false
    const r = d.getBoundingClientRect()
    const w = tip.offsetWidth, h = tip.offsetHeight
    tip.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.left))}px`
    tip.style.top = `${r.bottom + 8 + h > window.innerHeight ? r.top - h - 8 : r.bottom + 8}px`
  }
  const hideTip = () => { tip.hidden = true }
  document.addEventListener('mouseover', (e) => { const d = e.target.closest?.('dfn.term'); if (d) showTip(d) })
  document.addEventListener('mouseout', (e) => { if (e.target.closest?.('dfn.term')) hideTip() })
  document.addEventListener('focusin', (e) => { if (e.target.matches?.('dfn.term')) showTip(e.target) })
  document.addEventListener('focusout', hideTip)
  document.addEventListener('click', (e) => { const d = e.target.closest?.('dfn.term'); if (d) { tip.hidden ? showTip(d) : hideTip() } else hideTip() })
  $('deck').addEventListener('scroll', hideTip)

  const easyBtn = $('easyBtn')
  const setEasy = (on) => {
    root.classList.toggle('plain', !on)
    easyBtn.setAttribute('aria-pressed', String(on))
    try { localStorage.setItem('deck-easy', on ? '1' : '0') } catch {}
  }
  let easyPref = '1'
  try { easyPref = localStorage.getItem('deck-easy') ?? '1' } catch {}
  setEasy(easyPref === '1')
  easyBtn.addEventListener('click', () => setEasy(root.classList.contains('plain')))

  $('glossPanel').innerHTML = '<h3>용어 사전</h3>' + GLOSSARY.map(([t, d]) => `<div class="gi"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('')
  $('glossBtn').addEventListener('click', () => { $('gloss').hidden = false })
  $('gloss').addEventListener('click', (e) => { if (e.target.id === 'gloss') $('gloss').hidden = true })

  // ---------- 스토리: 응급실 비유 ----------
  const STORY = [
    ['사건', '채팅 화면이 갑자기 하얘졌다', '환자가 쓰러졌다.', '렌더 중 TypeError가 났다. (API 실패·망 끊김도 모두 "환자")'],
    ['발견', '누군가 쓰러진 걸 봤다', '구급대가 환자를 발견한다. 못 보고 지나치면 CCTV(SDK)가 대신 찍는다.', 'ErrorBoundary·React Query가 잡는다(handled). 아무도 못 잡으면 SDK가 줍는다(unhandled).'],
    ['문진', '이름과 증상 적기', '문진표에 이름·증상을 같은 양식으로 적는다.', 'normalize: 에러 종류·이름·요청 주소를 정리하고, 주소의 ID는 지운다.'],
    ['중증도', '응급이야, 아니야?', '중증도를 나눈다. 환자가 아닌 오인 신고는 돌려보낸다.', 'classify: 보낼지 버릴지, level(fatal·error·warning·info)을 규칙으로 정한다.', '망 끊김·요청 취소는 여기서 돌려보낸다(전송 안 함).'],
    ['차트', '메모 붙이기', '차트에 검사 결과와 소견을 붙인다.', 'enrich: 검색용 태그와 디버깅용 context를 붙인다.'],
    ['검문', '가짜 환자는 돌려보내기', '병동에 올리기 전 마지막 확인.', 'beforeSend: 알려진 노이즈를 버리고, 앱 정책으로 level을 낮추기도 한다.', '남의 주입 스크립트 노이즈는 여기서 버려진다.'],
    ['기록', '같은 증상끼리 한 파일로', '의무기록실이 같은 병명끼리 한 파일에 모은다.', 'Sentry가 fingerprint가 같은 이벤트를 한 이슈로 묶는다.'],
    ['호출', '위급하면 당직 호출', '위급할 때만 당직 의사를 부른다.', 'stg·prd에서 level이 error 이상이면 Google Chat 알림. 나머지는 기록만.', '대부분은 여기까지 오지 않는다.'],
  ]
  const story = { i: 0 }
  $('story').innerHTML = STORY.map(([who, title], i) =>
    `<button class="frame" type="button" data-i="${i}"><span class="no">${i + 1}</span><span class="who">${esc(who)}</span><b>${esc(title)}</b></button>`).join('')
  $('story').addEventListener('click', (e) => { const f = e.target.closest('.frame'); if (f) { story.i = Number(f.dataset.i); renderStory() } })
  function renderStory() {
    const [who, , ana, real, drop] = STORY[story.i]
    $('story').querySelectorAll('.frame').forEach((f, i) => {
      f.classList.toggle('done', i < story.i)
      f.classList.toggle('cur', i === story.i)
      f.classList.toggle('end', i === STORY.length - 1 && i === story.i)
    })
    $('storyBox').innerHTML = `<div class="side ana"><span class="k">응급실에서는 · ${esc(who)}</span><p>${esc(ana)}</p></div>` +
      `<div class="side real"><span class="k">우리 코드에서는</span><p>${esc(real)}</p>${drop ? `<span class="drop">↳ ${esc(drop)}</span>` : ''}</div>`
  }
  renderStory()
  steppers.set(slides.findIndex((s) => s.querySelector('#story')), {
    next: () => { if (story.i >= STORY.length - 1) return false; story.i++; renderStory(); return true },
    prev: () => { if (story.i <= 0) return false; story.i--; renderStory(); return true },
    enter: () => { story.i = 0; renderStory() },
  })

  // ---------- 노선도 ----------
  const ST = {
    c_src: [60, 110, '발생', ''], c_in: [175, 110, '입구', ''], c_norm: [295, 110, 'normalize', '종류 정리'],
    c_cls: [395, 110, 'classify', '보낼까·급해?'], c_enr: [495, 110, 'enrich', '메모'], c_flt: [615, 110, 'SDK 필터', ''],
    c_bs: [725, 110, 'beforeSend', '마지막 검문'],
    s_src: [60, 310, '발생', ''], s_in: [175, 310, '입구', ''], s_norm: [295, 310, 'normalize', ''],
    s_cls: [395, 310, 'classify', ''], s_enr: [495, 310, 'enrich', ''], s_flt: [615, 310, 'SDK 필터', ''],
    s_bs: [725, 310, 'beforeSend', ''],
    sentry: [845, 210, 'Sentry', '이슈로 기록'], chat: [950, 210, 'Google Chat', '알림'],
    cb1: [235, 45], cb2: [555, 45], sb1: [235, 375], sb2: [555, 375],
    c_cls_x: [395, 168], c_flt_x: [615, 168], c_bs_x: [725, 168],
    s_cls_x: [395, 252], s_flt_x: [615, 252],
  }
  const ROUTES = [
    { side: 'client', label: '렌더 TypeError', path: ['c_src', 'c_in', 'c_norm', 'c_cls', 'c_enr', 'c_flt', 'c_bs', 'sentry', 'chat'], end: 'alert', level: 'fatal',
      notes: { c_src: '채팅 위젯을 그리다 undefined.map', c_in: 'ErrorBoundary가 잡음 (handled)', c_norm: 'kind error · fingerprint [TypeError, 메시지]', c_cls: '규칙: 우리 코드 결함 → fatal', c_enr: '태그 + componentStack 붙여 SDK로 보냄', c_flt: '해당 없음 → 통과', c_bs: '"이미 분류됨" 표시가 있어 통과', sentry: 'fatal 이슈', chat: 'stg·prd면 팀 채팅 알림' } },
    { side: 'client', label: 'suspense 404', path: ['c_src', 'c_in', 'c_norm', 'c_cls', 'c_enr', 'c_flt', 'c_bs', 'sentry'], end: 'record', level: 'warning',
      notes: { c_src: '삭제된 대화의 메시지 조회 → 404', c_in: 'TanStack이 던짐 → ErrorBoundary (앱 게이트 건너뜀)', c_norm: '[404][GET] /api/v1/conversation/{param}/messages', c_cls: '규칙: 예상된 거절(404) → warning', c_enr: '태그·http context 붙여 SDK로 보냄', c_flt: '통과', c_bs: '"이미 분류됨" → 통과', sentry: 'warning 이슈 · 알림 없음' } },
    { side: 'client', label: '망 단절', path: ['c_src', 'c_in', 'c_norm', 'c_cls', 'c_cls_x'], end: 'drop', level: '',
      notes: { c_src: '지하철에서 Network Error', c_in: '복귀 후에도 실패 → ErrorBoundary', c_norm: 'isNetworkError: true', c_cls: '규칙: 망 끊김은 우리가 못 고침 → 버림', c_cls_x: '여기서 하차 · Sentry에 안 감' } },
    { side: 'client', label: '인앱 브라우저 주입 스크립트', by: true, path: ['c_src', 'c_in', 'cb1', 'cb2', 'c_flt', 'c_bs', 'sentry'], end: 'record', level: 'info',
      notes: { c_src: 'health-web · window.__canGoBackResult is not a function', c_in: '아무도 못 잡음 → SDK가 주움 (unhandled)', cb1: '앞단을 건너뜀 (분류는 beforeSend에서)', c_flt: '통과 · third_party_code 태그', c_bs: '여기서 분류(fatal) → 서드파티 표시 → health-web 앱 정책이 info로 낮춤 (chat-web이라면 fatal 유지)', sentry: 'info 이슈 · 알림 없음' } },
    { side: 'client', label: '웹뷰 브릿지 노이즈', by: true, path: ['c_src', 'c_in', 'cb1', 'cb2', 'c_flt', 'c_bs', 'c_bs_x'], end: 'drop', level: '',
      notes: { c_src: '웹뷰가 백그라운드로 갈 때 서드파티 SDK 브릿지 호출 실패 (Java object is gone)', c_in: 'pagehide 리스너 안에서 던짐 → SDK가 주움', cb1: '앞단을 건너뜀', c_flt: '통과', c_bs: '브릿지 노이즈 검사에 걸림', c_bs_x: '여기서 하차 · Sentry에 안 감' } },
    { side: 'server', label: '서버 컴포넌트 500', by: true, path: ['s_src', 's_in', 'sb1', 'sb2', 's_flt', 's_bs', 'sentry', 'chat'], end: 'alert', level: 'error',
      notes: { s_src: 'await consentHistory() → 500 · ServerFetchError', s_in: 'Next.js onRequestError (unhandled)', sb1: '앞단을 건너뜀 (분류는 beforeSend에서)', s_flt: '통과', s_bs: '여기서 분류: server-fetch · 5xx → error', sentry: '[500][GET] /api/v1/me/{param}', chat: '알림 · 브라우저 error.tsx는 digest라 보고 생략' } },
    { side: 'server', label: 'Route Handler 실패', path: ['s_src', 's_in', 's_norm', 's_cls', 's_enr', 's_flt', 's_bs', 'sentry', 'chat'], end: 'alert', level: 'error',
      notes: { s_src: '외부 API 저장 실패', s_in: 'catch에서 직접 sentryCaptureException (handled)', s_norm: 'kind error', s_cls: '맞는 규칙 없음 → 기본 error', s_enr: 'error.kind 등 태그 (+ 호출부 boundary·gate)', s_flt: '통과', s_bs: '"이미 분류됨" → 통과', sentry: 'error 이슈', chat: 'stg·prd면 알림' } },
    { side: 'server', label: 'SSR 중 클라이언트 API', by: true, path: ['s_src', 's_in', 'sb1', 'sb2', 's_flt', 's_flt_x'], end: 'drop', level: '',
      notes: { s_src: "'use client' 화면이 서버에서 한 번 그려지며 API 호출", s_in: 'SsrSkippedApiCallError → onRequestError', sb1: '앞단을 건너뜀', s_flt: '서버 ignoreErrors 목록에 있음', s_flt_x: '여기서 하차 · Sentry에 안 감' } },
  ]
  const metro = $('metro')
  const pt = (id) => ST[id].slice(0, 2).join(',')
  const poly = (ids) => ids.map(pt).join(' ')
  const NS = 'http://www.w3.org/2000/svg'
  function drawBase() {
    const tracks = [
      ['trk', ['c_src', 'c_in', 'c_norm', 'c_cls', 'c_enr', 'c_flt', 'c_bs', 'sentry', 'chat']],
      ['trk by', ['c_in', 'cb1', 'cb2', 'c_flt']],
      ['trk', ['s_src', 's_in', 's_norm', 's_cls', 's_enr', 's_flt', 's_bs', 'sentry']],
      ['trk by', ['s_in', 'sb1', 'sb2', 's_flt']],
    ]
    let h = tracks.map(([cls, ids]) => `<polyline class="${cls}" points="${poly(ids)}"/>`).join('')
    for (const [from, to] of [['c_cls', 'c_cls_x'], ['c_flt', 'c_flt_x'], ['c_bs', 'c_bs_x'], ['s_cls', 's_cls_x'], ['s_flt', 's_flt_x']]) {
      h += `<line class="stub" x1="${ST[from][0]}" y1="${ST[from][1]}" x2="${ST[to][0]}" y2="${ST[to][1]}"/>`
      h += `<circle class="x" cx="${ST[to][0]}" cy="${ST[to][1]}" r="11"/><text class="xt" x="${ST[to][0]}" y="${ST[to][1]}">✕</text>`
    }
    h += '<g id="metroHl"></g>'
    for (const [id, [x, y, name, sub]] of Object.entries(ST)) {
      if (!name) continue
      const hub = id === 'sentry' || id === 'chat'
      const above = y < 210 && !hub
      h += `<circle class="st${hub ? ' hub' : ''}" data-st="${id}" cx="${x}" cy="${y}" r="${hub ? 12 : 9}"/>`
      h += `<text class="lbl" x="${x}" y="${above ? y - 20 : y + 30}">${esc(name)}</text>`
      if (sub && above) h += `<text class="sub" x="${x}" y="${y - 36}">${esc(sub)}</text>`
      if (sub && hub) h += `<text class="sub" x="${x}" y="${y + 46}">${esc(sub)}</text>`
    }
    h += '<text class="line-name client" x="22" y="150">브라우저</text><text class="line-name server" x="22" y="278">Node 서버</text>'
    h += '<line class="trk" x1="40" y1="408" x2="80" y2="408"/><text class="sub" x="86" y="412" style="text-anchor:start">실선 · 우리가 잡음 (handled)</text>'
    h += '<line class="trk by" x1="290" y1="408" x2="330" y2="408"/><text class="sub" x="336" y="412" style="text-anchor:start">점선 · 바로 SDK로 (unhandled)</text>'
    h += '<circle class="x" cx="560" cy="408" r="9"/><text class="xt" x="560" y="408">✕</text><text class="sub" x="576" y="412" style="text-anchor:start">하차 · Sentry에 안 감</text>'
    h += '<g class="dot" id="metroDot"><circle r="11"/></g>'
    metro.innerHTML = h
  }
  drawBase()
  const route = { r: ROUTES[0], i: 0, timer: 0 }
  const routePick = $('routePick')
  for (const [side, label] of [['client', '브라우저'], ['server', '서버']]) {
    const row = document.createElement('div')
    row.className = 'ex-pick'
    row.innerHTML = `<span class="lbl">${label}</span>`
    ROUTES.filter((r) => r.side === side).forEach((r) => {
      const b = document.createElement('button')
      b.type = 'button'; b.className = 'chip'; b.textContent = r.label
      b.addEventListener('click', () => playRoute(r))
      row.appendChild(b)
    })
    routePick.appendChild(row)
  }
  function playRoute(r) {
    clearInterval(route.timer)
    route.r = r; route.i = 0; renderRoute()
    route.timer = setInterval(() => { if (route.i >= route.r.path.length - 1) { clearInterval(route.timer); return } route.i++; renderRoute() }, 650)
  }
  const visible = (id) => ST[id][2] || id.endsWith('_x') || id === 'cb1' || id === 'sb1'
  function renderRoute() {
    const { r, i } = route
    routePick.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === r.label)))
    const done = r.path.slice(0, i + 1)
    const by = (ids) => ids.some((id) => id.startsWith('cb') || id.startsWith('sb'))
    // 지난 구간을 굵게 칠한다
    let segs = ''
    for (let k = 1; k < done.length; k++) {
      const seg = [done[k - 1], done[k]]
      segs += `<polyline class="hl ${r.side}${by(seg) || (seg[0].endsWith('_in') && by([done[k]])) ? ' by' : ''}" points="${poly(seg)}"/>`
    }
    $('metroHl').innerHTML = segs
    metro.querySelectorAll('.st').forEach((c) => c.classList.toggle('on', done.includes(c.dataset.st)))
    const [x, y] = ST[r.path[i]]
    const dot = $('metroDot')
    dot.setAttribute('class', `dot ${r.side}`)
    dot.style.transform = `translate(${x}px, ${y}px)`
    const items = r.path.filter(visible).map((id) => {
      const k = r.path.indexOf(id)
      const name = ST[id][2] || (id.endsWith('_x') ? '하차' : '점선 우회')
      return `<li class="${k <= i ? 'seen' : ''}${k === i ? ' now' : ''}"><b>${esc(name)}</b><span>${esc(r.notes[id] || '')}</span></li>`
    })
    const atEnd = i === r.path.length - 1
    const end = !atEnd ? '<div class="metro-end"><span class="small muted">도착하면 결과가 나옵니다</span></div>'
      : r.end === 'drop' ? '<div class="metro-end drop"><span class="lv lv-drop">하차</span><span class="small">Sentry에 안 감</span></div>'
      : r.end === 'alert' ? `<div class="metro-end alert"><span class="lv lv-${r.level}">${r.level}</span><span class="small">Sentry 기록 + stg·prd 알림</span></div>`
      : `<div class="metro-end"><span class="lv lv-${r.level}">${r.level}</span><span class="small">Sentry 기록만 · 알림 없음</span></div>`
    $('metroLog').innerHTML = `<ol>${items.join('')}</ol>${end}`
  }
  renderRoute()
  steppers.set(slides.findIndex((s) => s.querySelector('#metro')), {
    next: () => { clearInterval(route.timer); if (route.i >= route.r.path.length - 1) return false; route.i++; renderRoute(); return true },
    prev: () => { clearInterval(route.timer); if (route.i <= 0) return false; route.i--; renderRoute(); return true },
    enter: () => { clearInterval(route.timer); route.r = ROUTES[0]; route.i = 0; renderRoute() },
  })

  // ---------- 탐색 패널: 항목을 누르면 상세가 열린다 ----------
  function wireExplore(root) {
    const detail = root.querySelector('.xdetail')
    const srcs = Object.fromEntries([...root.querySelectorAll('.xsrc')].map((s) => [s.dataset.key, s]))
    const items = () => [...root.querySelectorAll('[data-key]:not(.xsrc)')].filter((b) => !b.closest('[hidden]'))
    const show = (btn) => {
      root.querySelectorAll('[data-key]:not(.xsrc)').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)))
      if (btn.classList.contains('ck')) btn.classList.add('done')
      const src = srcs[btn.dataset.key]
      detail.innerHTML = (src ? src.innerHTML : '') || `<h3>${esc(btn.textContent)}</h3>`
      detail.querySelectorAll('pre.hl').forEach((el) => { el.innerHTML = hl(el.textContent) })
    }
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-key]:not(.xsrc)'); if (b && root.contains(b)) show(b) })
    return { show, first: () => { const f = items()[0]; if (f) show(f) } }
  }
  const explorers = {}
  for (const id of ['bsExplore', 'svExplore', 'ckExplore']) { explorers[id] = wireExplore($(id)); explorers[id].first() }

  // beforeSend 브라우저/서버 전환
  const bs = $('bsExplore')
  bs.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
    bs.querySelectorAll('.tab').forEach((x) => {
      x.setAttribute('aria-selected', String(x === t))
      $(x.dataset.pipe).hidden = x !== t
    })
    explorers.bsExplore.first()
  }))

  // React Query 훅별 경로
  const RQ = [
    {
      hook: 'useQuery', who: '앱 기본값을 쓰는 쿼리 (동의 확인 · 사용자 조회). 화면이 직접 처리하는 쿼리는 아래 갈래(throwOnError: false)',
      steps: [
        ['', '재시도', '5xx·망 단절·타임아웃(408)만 최대 2회. 나머지 4xx·취소는 바로 실패.'],
        ['', 'throwOnError()', '앱 기본 옵션(createAppQueryClient). 렌더 중에 불리고 여러 번 불릴 수 있다 → 중복은 Dedupe가 흡수.'],
        ['gate', '앱 게이트', 'shouldSendQueryErrorToSentry: 취소 · skipSentryCapture · 응답 code · 401 정책 · sentryOn400/404/409/429/503.'],
        ['send', '보고 + queryKey', 'sentryCaptureException(error, { contexts: { query: { queryKey } } })'],
        ['warn', 'ErrorBoundary', 'true를 돌려줘 던진다 → 바운더리가 한 번 더 캡처. 같은 이벤트는 SDK Dedupe가 대개 버린다.'],
      ],
      branches: [
        ['bad', 'throwOnError: false면', '호출부 옵션이 캡처가 든 함수를 통째로 대체 → 0건. 화면이 직접 처리하는 쿼리(결과·인증 화면, 통계 화면).'],
        ['warn', 'meta로 끄면', '앱 게이트가 보고를 막아도 true를 돌려줘 바운더리가 다시 보고한다. 400·403·503이면 알림까지.'],
      ],
    },
    {
      hook: 'useSuspenseQuery', who: '대화 목록·메시지(Infinite) · 카드 발급 상태',
      steps: [
        ['', '재시도', '같은 정책.'],
        ['bad', 'throwOnError 교체', 'TanStack이 suspense 훅의 throwOnError를 자체 기본값으로 바꿔 끼운다 → 우리 함수가 안 불린다. 캡처를 throwOnError 안에 둔 대가이고, queryCache.onError로 옮기면 해소된다.'],
        ['skip', '앱 게이트', '건너뜀 → meta로 못 끈다. 400·403·404는 axios config로, 503은 앱 beforeSend로만.'],
        ['send', 'ErrorBoundary · error.tsx', '바운더리가 보고. queryKey context는 없다.'],
      ],
      branches: [
        ['bad', '캐시가 있으면', 'refetch 실패는 던지지도 보고하지도 않는다 → 0건. 화면엔 이전 데이터가 남는다.'],
      ],
    },
    {
      hook: 'useMutation', who: '탈퇴 · 전자서명 · 점수 재계산',
      steps: [
        ['', '재시도', '같은 정책이라 5xx면 POST를 다시 보낸다 → 되돌릴 수 없는 요청은 retry: false (탈퇴·전자서명).'],
        ['', 'MutationCache.onError', '훅에 넘긴 onError보다 먼저 불린다.'],
        ['gate', '앱 게이트', '같은 함수, mutation meta로 판정. 예: 재계산 409는 sentryOn409: false.'],
        ['send', '보고 + variables', 'contexts.mutation.variables (SDK 기본 깊이 3에서 잘림). 요청 바디는 SDK가 config.data로 따로 싣는다.'],
        ['', '전역 토스트 자리', 'onMutationErrorAfterCapture. 두 앱 모두 비워 두었다.'],
        ['', '훅 onError → reject', '바운더리로 안 간다.'],
      ],
      branches: [
        ['warn', 'catch에서 또 보내면', '두 번째는 대개 Dedupe로 사라지고, 거기 붙인 태그·level도 같이 사라진다.'],
      ],
    },
  ]
  const rq = { k: 0 }
  const rqRoot = $('rqExplore')
  RQ.forEach((h, k) => {
    const t = document.createElement('button')
    t.type = 'button'; t.className = 'tab'; t.setAttribute('role', 'tab'); t.textContent = h.hook
    t.addEventListener('click', () => { rq.k = k; renderRq() })
    $('rqTabs').appendChild(t)
  })
  function renderRq() {
    const h = RQ[rq.k]
    $('rqTabs').querySelectorAll('.tab').forEach((t, k) => t.setAttribute('aria-selected', String(k === rq.k)))
    $('rqWho').textContent = h.who
    const all = [...h.steps, ...h.branches]
    $('rqPipe').innerHTML = h.steps.map(([cls, label], i) =>
      `${i ? '<span class="ar">→</span>' : ''}<button class="xbtn ${cls}" type="button" data-i="${i}"><small>${i + 1}</small><span>${esc(label)}</span></button>`).join('') +
      `<div class="branches"><span class="k">갈래</span>${h.branches.map(([cls, label], j) =>
        `<button class="xbtn ${cls} br" type="button" data-i="${h.steps.length + j}"><small>↳</small><span>${esc(label)}</span></button>`).join('')}</div>`
    const firstBad = all.findIndex(([cls]) => cls === 'bad' || cls === 'skip')
    showRq(firstBad === -1 ? 0 : firstBad)
  }
  function showRq(i) {
    const h = RQ[rq.k]
    const [, label, body] = [...h.steps, ...h.branches][i]
    $('rqPipe').querySelectorAll('.xbtn').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === i)))
    rqRoot.querySelector('.xdetail').innerHTML = `<h3>${esc(label)}</h3><p class="small">${esc(body)}</p>`
  }
  $('rqPipe').addEventListener('click', (e) => { const b = e.target.closest('.xbtn'); if (b) showRq(Number(b.dataset.i)) })
  renderRq()
  steppers.set(slides.findIndex((s) => s.querySelector('#rqExplore')), {
    next: () => { if (rq.k >= RQ.length - 1) return false; rq.k++; renderRq(); return true },
    prev: () => { if (rq.k <= 0) return false; rq.k--; renderRq(); return true },
    enter: () => { rq.k = 0; renderRq() },
  })

  // ---------- 규칙 (defaultSeverityRules.ts 그대로) ----------
  const RUNTIME = new Set(['TypeError', 'ReferenceError', 'RangeError', 'SyntaxError'])
  const EXPECTED = new Set([404, 408, 409, 429])
  const RULES = [
    { name: 'caller-opt-out-skip', when: (e) => e.http?.isCallerOptedOut === true, report: false, level: 'info', why: '호출부가 axios 요청 config로 이 응답을 끈다고 명시했습니다. 상태 코드 판정보다 호출부 의도가 우선합니다.' },
    { name: 'operational-report-skip', when: (e) => e.name === 'UserSyncRecoveredError', report: false, level: 'info', why: '사용자 동기화가 한 번 실패했지만 복구에 성공했다는 운영 기록입니다. 복구 실패(UserSyncFailedError)는 계속 보고됩니다.' },
    { name: 'axios-noise-skip', when: (e) => !!(e.http?.isCanceled || e.http?.isTimeout || e.http?.isNetworkError || e.hasAxiosNoiseCause), report: false, level: 'info', why: '취소·타임아웃·망 단절은 우리가 고칠 수 없습니다. 감싼 에러라도 cause 안쪽에 이런 에러가 있으면 같이 버립니다.' },
    { name: 'js-runtime-fault-fatal', when: (e) => e.kind === 'error' && RUNTIME.has(e.name), level: 'fatal', why: '정상 흐름에서는 나올 수 없는 우리 코드 결함이라 바로 대응합니다. 일부러 던진 도메인 에러(error-base)는 제외합니다.' },
    { name: 'http-401-warning', when: (e) => e.http?.status === 401, level: 'warning', why: '토큰 갱신 경로가 먼저 처리하고, 여기까지 온 것만 관측합니다. 이슈는 서버 바디 코드별로 나뉩니다.' },
    { name: 'http-expected-client-warning', when: (e) => e.http?.status !== undefined && EXPECTED.has(e.http.status), level: 'warning', why: '서버가 정상 동작하며 거절한 예상 응답(404·409·429)이거나, 재시도로 흡수되고 남은 망 순단(408)입니다.' },
    { name: 'http-5xx-error', when: (e) => (e.http?.status ?? 0) >= 500, level: 'error', why: '서버 장애입니다. 핵심 흐름이면 호출부가 fatal로 올립니다.' },
  ]
  function classify(e) {
    for (let i = 0; i < RULES.length; i++) {
      const r = RULES[i]
      if (r.when(e)) return { index: i, report: r.report ?? true, level: r.level, reason: r.name }
    }
    return { index: RULES.length, report: true, level: 'error', reason: 'default' }
  }
  function rulesHtml(hitIndex) {
    const rows = RULES.map((r, i) => {
      const cls = i < hitIndex ? 'miss' : i === hitIndex ? 'hit' : 'nr'
      const verdict = r.report === false ? '<span class="lv lv-drop">skip</span>' : `<span class="lv lv-${r.level}">${r.level}</span>`
      return `<div class="rule ${cls}"><span class="ix">${i + 1}</span><span class="nm">${r.name}</span>${verdict}</div>`
    })
    rows.push(`<div class="rule ${hitIndex === RULES.length ? 'hit' : 'nr'}"><span class="ix">–</span><span class="nm">(무매칭) default</span><span class="lv lv-error">error</span></div>`)
    return `<div class="rules">${rows.join('')}</div>`
  }

  // ---------- 놀이터 ----------
  const ALERT_LEVELS = new Set(['fatal', 'error'])
  function renderPlay() {
    const kind = $('pKind').value
    const isHttp = kind === 'http'
    $('pStatusField').hidden = !isHttp
    $('pOptField').hidden = !isHttp
    $('pNameField').hidden = kind !== 'runtime'
    const status = Number($('pStatus').value)
    let e
    const http = (o) => ({ isCanceled: false, isTimeout: false, isNetworkError: false, isCallerOptedOut: false, ...o })
    switch (kind) {
      case 'http': e = { kind: 'axios', http: http({ status, isCallerOptedOut: $('pOpt').checked }) }; break
      case 'network': e = { kind: 'axios', http: http({ isNetworkError: true }) }; break
      case 'timeout': e = { kind: 'axios', http: http({ isTimeout: true }) }; break
      case 'cancel': e = { kind: 'axios', http: http({ isCanceled: true }) }; break
      case 'runtime': e = { kind: 'error', name: $('pName').value }; break
      case 'errorbase': e = { kind: 'error-base', name: 'TypeError' }; break
      case 'wrapped': e = { kind: 'error', name: 'UserSyncFailedError', hasAxiosNoiseCause: true }; break
      case 'recovered': e = { kind: 'error', name: 'UserSyncRecoveredError' }; break
      default: e = { kind: 'error', name: 'Error' }
    }
    const v = classify(e)
    const callerLevel = $('pLevel').value
    const level = v.report ? (callerLevel || v.level) : null
    const matchedBy = !v.report ? '—' : callerLevel ? 'caller' : v.reason === 'default' ? 'default' : 'rule'
    $('pRules').innerHTML = rulesHtml(v.index)
    const alert = level && ALERT_LEVELS.has(level)
    $('pVerdict').innerHTML = [
      `<span class="kv"><b>report</b>${v.report ? '<span class="lv lv-ok">보냄</span>' : '<span class="lv lv-drop">안 보냄</span>'}</span>`,
      `<span class="kv"><b>level</b>${level ? `<span class="lv lv-${level}">${level}</span>` : '—'}</span>`,
      `<span class="kv"><b>classify.reason</b><code>${v.reason}</code></span>`,
      `<span class="kv"><b>matchedBy</b><code>${matchedBy}</code></span>`,
      `<span class="kv"><b>stg·prd 알림</b>${alert ? '<span class="lv lv-error">울림</span>' : '<span class="lv lv-drop">없음</span>'}</span>`,
    ].join('')
    let why = v.index < RULES.length ? RULES[v.index].why : '어떤 규칙에도 맞지 않으면 error로 보냅니다. 400·403이 여기로 옵니다. 잘못된 요청 바디나 권한 배선 실수 같은 프론트 결함이 섞여 있어서 일부러 내리지 않습니다.'
    if (kind === 'errorbase') why = 'error-base는 이름이 TypeError여도 4번 규칙에 걸리지 않습니다. 앱이 일부러 던진 도메인 에러라서입니다. ' + why
    if (kind === 'cancel') why += ' React Query 경로에서는 취소된 요청이 이 단계까지 오기 전에 앱 게이트에서 먼저 걸러집니다.'
    if (callerLevel && v.report) why += ` 호출부가 level을 '${callerLevel}'로 명시해서 규칙 판정(${v.level})보다 우선합니다.`
    if (callerLevel && !v.report) why += ' 스킵 판정은 호출부가 명시한 level보다 우선합니다.'
    $('pWhy').textContent = why
  }
  ;['pKind', 'pStatus', 'pName', 'pOpt', 'pLevel'].forEach((id) => $(id).addEventListener('change', renderPlay))
  renderPlay()

  // ---------- URL 정규화 (normalizeApiUrlForSentry.ts 그대로) ----------
  const VERSION = /^v\d+$/i
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const PCT = /%[0-9a-f]{2}/i, DIGIT = /\d/, HY = /[-_]/, AT = /@/
  function segReason(s) {
    if (s === '' || VERSION.test(s)) return null
    if (UUID.test(s)) return 'UUID'
    if (PCT.test(s)) return '%인코딩'
    if (DIGIT.test(s)) return '숫자'
    if (HY.test(s)) return '하이픈·언더스코어'
    if (AT.test(s)) return '@'
    return null
  }
  function pathnameOf(url) {
    if (/^https?:\/\//i.test(url)) { try { return new URL(url).pathname } catch {} }
    const q = url.indexOf('?'), h = url.indexOf('#')
    const ends = [q, h].filter((i) => i !== -1)
    return ends.length ? url.slice(0, Math.min(...ends)) : url
  }
  function renderUrl() {
    const raw = $('uUrl').value.trim()
    const method = $('uMethod').value
    const status = Number($('uStatus').value)
    $('uCodeField').hidden = status !== 401
    const code = $('uCode').value.trim()
    const path = raw ? pathnameOf(raw) : ''
    const segs = path.split('/')
    const norm = segs.map((s) => (segReason(s) ? '{param}' : s)).join('/')
    $('uSegs').innerHTML = segs.map((s, i) => {
      if (i === 0 && s === '') return ''
      const r = segReason(s)
      return `<span class="sl">/</span><span class="seg-chip${r ? ' mask' : ''}">${esc(s || '∅')}${r ? `<small>${r} → {param}</small>` : ''}</span>`
    }).join('')
    let title, fp
    if (status === 401) {
      if (code) { title = `TokenError(${code})`; fp = ['401', code] }
      else { title = `TokenError [${method}] ${norm} (서버 message)`; fp = ['401', method.toLowerCase(), norm, '(서버 message)'] }
    } else {
      title = `[${status}][${method}] ${norm}`
      fp = [method.toLowerCase(), String(status), norm]
    }
    const v = classify({ kind: 'axios', http: { status } })
    $('uOut').innerHTML = [
      ['requestUrl 태그', `<code>${esc(norm)}</code>`],
      ['이슈 제목', `<code>${esc(title)}</code>`],
      ['fingerprint', `<code>${esc(JSON.stringify(fp))}</code>`],
      ['level', `<span class="lv lv-${v.level}">${v.level}</span> <span class="small muted">${v.reason}</span>`],
    ].map(([k, val]) => `<div class="row"><span>${k}</span><span>${val}</span></div>`).join('')
    let note = '쿼리스트링과 해시는 지웁니다. 절대 URL이면 host는 빼고 경로만 씁니다. 마스킹 전 원본 경로(쿼리 제외)는 http request context의 rawUrl에 남습니다.'
    if (/score-card|withdrawal-user/.test(path)) note = '고정된 경로 이름도 하이픈이 있으면 {param}이 됩니다. 이슈가 쪼개지는 것보다 더 묶이는 쪽을 택한 규칙이라, 같은 모양의 다른 엔드포인트와 한 이슈로 묶일 수 있습니다.'
    else if (/@/.test(path)) note = '이메일은 숫자·하이픈이 없어 다른 규칙을 다 빠져나가므로 @를 따로 잡습니다. fingerprint·제목·태그에서는 지워지지만 context의 rawUrl에는 원본 경로가 그대로 남습니다. 경로에 개인정보를 넣지 않는 게 먼저입니다.'
    else if (status === 401) note = '401은 서버 바디 code(ErrorResponse.code)별로 이슈를 나눕니다. 코드마다 대응(재시도·로그아웃·무처리)이 달라서입니다. code가 없으면 method·경로·서버 message로 나눠 권한 거절 같은 다른 사유가 섞이지 않게 합니다.'
    $('uNote').textContent = note
  }
  ;['uUrl', 'uCode'].forEach((id) => $(id).addEventListener('input', renderUrl))
  ;['uMethod', 'uStatus'].forEach((id) => $(id).addEventListener('change', renderUrl))
  document.querySelectorAll('#uPresets .chip').forEach((b) => b.addEventListener('click', () => {
    $('uUrl').value = b.dataset.u; $('uMethod').value = b.dataset.m; $('uStatus').value = b.dataset.s
    renderUrl()
  }))
  renderUrl()

  // ---------- Core 4단계 ----------
  const KIND_HINT = { axios: '브라우저 API', 'server-fetch': '서버 fetch', 'error-base': '일부러 던진 도메인 에러', error: '일반 Error', unknown: '그 밖' }
  const CORE_EX = [
    {
      label: 'API 404',
      raw: "AxiosError {\n  message: 'Request failed with status code 404',\n  code: 'ERR_BAD_REQUEST',\n  config: {\n    method: 'get',\n    url: 'https://api.example.com/api/v1/conversation/01J9Z4K2QX/messages?cursor=20',\n    headers: {…}, timeout: …, adapter: […],\n  },\n  response: { status: 404, data: { message: '…' }, headers: {…} },\n  request: XMLHttpRequest {…},\n  stack: 'AxiosError: Request failed …',\n}",
      kind: 'axios', name: '[404][GET] /api/v1/conversation/{param}/messages',
      fp: ['get', '404', '/api/v1/conversation/{param}/messages'],
      http: [['status', '404'], ['method', 'get'], ['endpoint', '/api/v1/conversation/{param}/messages'], ['취소·타임아웃·망 단절', 'false']],
      rule: 5,
      tags: [['error.kind', 'axios'], ['classify.reason', 'http-expected-client-warning'], ['http.status_code', '404'], ['requestMethod', 'GET'], ['requestUrl', '/api/v1/conversation/{param}/messages'], ['isAxiosError', 'true']],
      ctx: [['error detail', 'kind · name · message · fingerprint · causeChain'], ['http request', 'method · endpoint · rawUrl'], ['http response', 'status · errorCode · serverMessage · requestId'], ['classification', 'reason · level · matchedBy']],
      send: 'new SentryAxiosError(error)', sendNote: 'axios 에러는 감싸서 보냅니다. 이름은 위 정규화 이름, 스택은 원래 HTTP 실패 지점, 원본은 cause에 남습니다.',
    },
    {
      label: '렌더 TypeError',
      raw: "TypeError: Cannot read properties of undefined (reading 'map')\n    at ChatWidget (app:///_next/static/chunks/…js:1:20345)\n    at renderWithHooks (…)\n    at updateFunctionComponent (…)",
      kind: 'error', name: 'TypeError',
      fp: ['TypeError', "Cannot read properties of undefined (reading 'map')"],
      http: null,
      rule: 3,
      tags: [['error.kind', 'error'], ['classify.reason', 'js-runtime-fault-fatal']],
      ctx: [['error detail', 'kind · name · message · fingerprint · causeChain'], ['classification', 'reason · level · matchedBy']],
      send: 'error', sendNote: 'axios 에러가 아니면 원본 그대로 보냅니다.',
    },
    {
      label: '망 단절',
      raw: "AxiosError {\n  message: 'Network Error',\n  code: 'ERR_NETWORK',\n  config: { method: 'get', url: '…/api/v1/conversation/01J9Z4K2QX/messages' },\n  response: undefined,   // 서버 응답을 못 받음\n  request: XMLHttpRequest {…},\n}",
      kind: 'axios', name: '[NetworkError][GET] /api/v1/conversation/{param}/messages',
      fp: ['get', 'NetworkError', '/api/v1/conversation/{param}/messages'],
      http: [['status', '없음'], ['method', 'get'], ['endpoint', '/api/v1/conversation/{param}/messages'], ['isNetworkError', 'true']],
      rule: 2,
    },
  ]
  const core = { ex: CORE_EX[0], st: 0 }
  const coreEx = $('coreEx')
  CORE_EX.forEach((ex) => {
    const b = document.createElement('button')
    b.type = 'button'; b.className = 'chip'; b.textContent = ex.label
    b.addEventListener('click', () => { core.ex = ex; core.st = 0; renderCore() })
    coreEx.appendChild(b)
  })
  const stations = [...document.querySelectorAll('#coreLine .station')]
  stations.forEach((s) => s.addEventListener('click', () => { core.st = Number(s.dataset.st); renderCore() }))
  const coreLast = () => (RULES[core.ex.rule].report === false ? 1 : 3)
  const coreNext = () => {
    if (core.st < coreLast()) { core.st++; renderCore(); return true }
    const k = CORE_EX.indexOf(core.ex)
    if (k < CORE_EX.length - 1) { core.ex = CORE_EX[k + 1]; core.st = 0; renderCore(); return true }
    return false
  }
  const corePrev = () => {
    if (core.st > 0) { core.st--; renderCore(); return true }
    const k = CORE_EX.indexOf(core.ex)
    if (k > 0) { core.ex = CORE_EX[k - 1]; core.st = coreLast(); renderCore(); return true }
    return false
  }
  $('coreNext').addEventListener('click', coreNext)
  $('corePrev').addEventListener('click', corePrev)
  steppers.set(slides.findIndex((s) => s.querySelector('#coreLine')), {
    next: coreNext, prev: corePrev,
    enter: () => { core.ex = CORE_EX[0]; core.st = 0; renderCore() },
  })

  const frow = (k, v) => `<div class="frow"><span>${esc(k)}</span><span>${v}</span></div>`
  const pills = (arr, on) => `<div class="pills">${arr.map((x) => `<span class="pill${x === on ? ' on' : ''}">${esc(x)}</span>`).join('')}</div>`
  const tagPills = (tags) => `<div class="pills">${tags.map(([k, v]) => `<span class="pill">${esc(k)}: ${esc(v)}</span>`).join('')}</div>`
  function coreNormalized(ex, compact) {
    let h = frow('kind', pills(compact ? [ex.kind] : Object.keys(KIND_HINT), ex.kind) + (compact ? '' : `<span class="small muted">${esc(KIND_HINT[ex.kind])}</span>`)) + frow('name', `<code>${esc(ex.name)}</code>`)
    if (!compact) h += frow('fingerprint', pills(ex.fp))
    h += frow('http', ex.http ? (compact ? `<code>${esc(ex.http[0][0])}: ${esc(ex.http[0][1])}</code> …` : ex.http.map(([k, v]) => `<code>${esc(k)}: ${esc(v)}</code>`).join(' ')) : '<span class="muted">없음 (HTTP 에러가 아님)</span>')
    return h
  }
  function coreVerdict(ex) {
    const r = RULES[ex.rule]
    const sendBadge = r.report === false ? '<span class="lv lv-drop">안 보냄</span>' : '<span class="lv lv-ok">보냄</span>'
    return `<div class="big-verdict">${sendBadge}${r.report === false ? '' : `<span class="lv lv-${r.level}">${r.level}</span>`}<code>${r.name}</code></div>`
  }
  function renderCore() {
    const { ex } = core
    const last = coreLast()
    core.st = Math.min(core.st, last)
    const st = core.st
    coreEx.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === ex.label)))
    stations.forEach((s, i) => {
      s.classList.toggle('done', i < st)
      s.classList.toggle('off', i > last)
      s.disabled = i > last
      if (i === st) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current')
    })
    $('coreRail').style.width = `${((st + 1) / 4) * 100}%`
    $('corePrev').disabled = st === 0 && CORE_EX.indexOf(ex) === 0
    $('coreNext').disabled = st >= last && CORE_EX.indexOf(ex) === CORE_EX.length - 1
    $('coreNext').textContent = st >= last ? '다음 예시' : '다음 단계'
    const r = RULES[ex.rule]
    let inCap, inHtml, outCap, outHtml
    if (st === 0) {
      inCap = '들어오는 것 · unknown — 모양이 제각각'
      inHtml = `<pre>${esc(ex.raw)}</pre>`
      outCap = 'NormalizedError — 모든 에러가 같은 양식'
      outHtml = coreNormalized(ex, false) + '<p class="small muted">kind는 위 순서대로 처음 맞는 쪽으로 정합니다. 경로의 ID는 {param}으로 지워 fingerprint에 씁니다.</p>'
    } else if (st === 1) {
      inCap = 'NormalizedError'
      inHtml = coreNormalized(ex, true)
      outCap = '판정 { report, level, reason }'
      outHtml = coreVerdict(ex) + rulesHtml(ex.rule) + (r.report === false ? '<p class="small muted">report: false라 여기서 끝납니다. enrich와 record는 실행되지 않습니다.</p>' : '')
    } else if (st === 2) {
      inCap = 'NormalizedError + 판정'
      inHtml = coreNormalized(ex, true) + coreVerdict(ex)
      outCap = '태그(검색용) + context(상세 화면용)'
      outHtml = '<div class="k">tags · 검색·필터용 짧은 값</div>' + tagPills(ex.tags) +
        '<div class="k">contexts · 이벤트 상세 화면에 펼쳐 보는 정보</div>' +
        `<div class="folders">${ex.ctx.map(([k, v]) => `<div class="folder"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}</div>` +
        '<p class="small muted">패키지는 요청 바디·헤더를 넣지 않습니다(SDK가 따로 싣는 건 React Query 슬라이드에서). 호출자가 넘긴 태그·context는 여기에 합쳐집니다.</p>'
    } else {
      inCap = '판정 + 태그 + context'
      inHtml = coreVerdict(ex) + tagPills(ex.tags.slice(0, 2))
      outCap = 'Sentry SDK로 전송'
      outHtml = `<pre class="code">${hl(`Sentry.captureException(${ex.send}, {\n  level: '${r.level}',\n  fingerprint: ${JSON.stringify(ex.fp)},\n  tags: { …, isPreProcessed: true },\n  contexts: { … },\n})`)}</pre><p class="small muted">${esc(ex.sendNote)} <code>isPreProcessed</code>를 붙여 beforeSend가 다시 분류하지 않게 합니다.</p>`
    }
    $('coreInCap').textContent = inCap
    $('coreIn').innerHTML = inHtml
    $('coreOutCap').textContent = outCap
    $('coreOut').innerHTML = outHtml
  }
  renderCore()

  // ---------- 시뮬레이터 ----------
  const NODES = [
    ['source', '발생'], ['entry', '입구'], ['gate', '앱 게이트'], ['normalize', 'normalize'], ['classify', 'classify'],
    ['enrich', 'enrich'], ['beforeSend', 'beforeSend'], ['sentry', 'Sentry'], ['alert', 'Google Chat'],
  ]
  const NODE_IX = Object.fromEntries(NODES.map(([id], i) => [id, i]))

  const C = {
    filters: (note) => ({ nm: 'ⓞ ignoreErrors · denyUrls', st: 'pass', note }),
    unhandled: (st, note) => ({ nm: '① beforeSendForUnhandledError', st, note }),
    bridge: (note = '브릿지 노이즈 메시지가 아님') => ({ nm: '② 웹뷰 브릿지 노이즈', st: 'pass', note }),
    third: (st, note) => ({ nm: '③ beforeSendHandleThirdPartyError', st, note }),
    app: (st, note) => ({ nm: '④ 앱 beforeSend', st, note }),
  };
  const PRE = '이벤트에 isPreProcessed가 있어 그대로 통과';
  const HEALTH_APP_PASS = C.app('pass', '인앱 브라우저 노이즈 정책 — 해당 메시지가 아님');
  const CHAT_APP_NONE = C.app('none', 'chat-web은 앱 beforeSend를 넘기지 않음');
  const SUSPENSE_ENTRY =
    '4xx라 재시도하지 않습니다. useSuspenseQuery 계열은 TanStack이 throwOnError를 자체 기본값으로 바꿔 끼우므로 <b>우리 throwOnError가 불리지 않고</b> 바로 던집니다.';

  const SCENARIOS = [
    {
      id: 'chat-404', app: 'chat-web', side: 'client', label: 'suspense 404 · 대화 메시지',
      steps: [
        { node: 'source', title: '삭제된 대화를 열었다', body: '대화 메시지는 <code>useSuspenseInfiniteQuery</code>로 읽습니다. 브라우저 API 클라이언트는 axios입니다.', code: 'GET https://api.example.com\n    /api/v1/conversation/01J9Z4K2QX/messages\n← 404 Not Found' },
        { node: 'entry', title: 'TanStack이 던지고 ErrorBoundary가 잡는다', tag: 'handled', body: SUSPENSE_ENTRY + ' 채팅 화면의 ErrorBoundary가 <code>navigator.onLine</code>을 확인한 뒤 컴포넌트 스택을 붙여 보고합니다.', code: 'sentryCaptureException(error, {\n  contexts: { react: { componentStack } },\n})   // queryKey context 없음' },
        { node: 'gate', skip: true, title: '앱 게이트를 건너뛴다', body: '게이트는 우리 throwOnError 안에 있어서 이 경로에서는 실행되지 않습니다. 쿼리 meta에 <code>sentryOn404: false</code>를 달아도 효과가 없습니다. 끄려면 axios 요청 config를 씁니다.' },
        { node: 'normalize', title: 'axios 에러로 판별, 경로의 ID가 지워진다', body: '절대 URL이어도 경로만 씁니다. 숫자가 섞인 대화 ID는 <code>{param}</code>이 되어 대화마다 이슈가 갈라지지 않습니다.', code: "{\n  kind: 'axios',\n  name: '[404][GET] /api/v1/conversation/{param}/messages',\n  fingerprint: ['get', '404', '/api/v1/conversation/{param}/messages'],\n  http: { method: 'get', status: 404, … },\n}" },
        { node: 'classify', title: '6번 규칙에 걸려 warning', body: '서버가 정상 동작하며 거절한 예상 응답입니다. 알림까지 울릴 일은 아니고, 빈도는 Sentry에서 봅니다.', rules: 5 },
        { node: 'enrich', title: 'SentryAxiosError로 감싸서 보낸다', body: '에러 이름을 정규화한 이름으로 바꾸고, 스택은 원본 HTTP 실패 지점을 유지합니다.', code: "tags: {\n  'error.kind': 'axios',\n  'classify.reason': 'http-expected-client-warning',\n  'http.status_code': '404',\n  requestMethod: 'GET',\n  requestUrl: '/api/v1/conversation/{param}/messages',\n  isPreProcessed: true,\n}" },
      ],
      chain: [C.filters('메시지가 필터 목록에 없음'), C.unhandled('pass', PRE), C.bridge(), C.third('pass', 'third_party_code 태그 없음'), CHAT_APP_NONE],
      level: 'warning', issue: '[404][GET] /api/v1/conversation/{param}/messages',
      tags: [['error.kind', 'axios'], ['classify.reason', 'http-expected-client-warning'], ['http.status_code', '404']],
      after: '화면은 바운더리의 fallback(네트워크 에러 화면)으로 바뀝니다.',
    },
    {
      id: 'health-suspense', app: 'health-web', side: 'client', label: 'suspense 500 · 카드 상태',
      steps: [
        { node: 'source', title: '카드 발급 상태 조회가 500', body: '결과 화면의 배너가 <code>useSuspenseQuery</code>로 상태를 읽습니다.', code: 'GET https://api.example.com/score-card/v1\n← 500 Internal Server Error' },
        { node: 'entry', title: '재시도 뒤 TanStack이 던지고 error.tsx가 잡는다', tag: 'handled', body: '5xx라 2회 재시도합니다. 그래도 실패하면 우리 throwOnError를 부르지 않고 바로 던집니다. <code>error.tsx</code>가 받아 scope에 user를 심은 뒤 보고합니다.', code: '// error.tsx 안에서\nSentry.setUser({ id: userId })\ncaptureBoundaryError(error)   // 클라이언트 에러라 digest 없음 → 보고' },
        { node: 'gate', skip: true, title: '앱 게이트를 건너뛴다', body: '게이트가 실행되지 않으니 쿼리 meta로 이 에러를 끌 수 없습니다. 400·403·404는 axios config로, 503은 앱 beforeSend로만 끌 수 있습니다.' },
        { node: 'normalize', title: '경로가 통째로 {param}이 된다', body: '<code>score-card</code>에 하이픈이 있어 고정 경로인데도 지워집니다.', code: "{\n  kind: 'axios',\n  name: '[500][GET] /{param}/v1',\n  fingerprint: ['get', '500', '/{param}/v1'],\n}" },
        { node: 'classify', title: '7번 규칙에 걸려 error', body: '', rules: 6 },
        { node: 'enrich', title: '사용자와 HTTP 정보가 붙는다', body: '사용자가 붙어서 이슈에 영향 사용자 수가 잡힙니다.', code: "user: { id: '…' },\ntags: {\n  'error.kind': 'axios',\n  'classify.reason': 'http-5xx-error',\n  'http.status_code': '500',\n  requestUrl: '/{param}/v1',\n  isPreProcessed: true,\n}" },
      ],
      chain: [C.filters('메시지가 필터 목록에 없음'), C.unhandled('pass', PRE), C.bridge(), C.third('pass', 'third_party_code 태그 없음'), HEALTH_APP_PASS],
      level: 'error', issue: '[500][GET] /{param}/v1',
      tags: [['error.kind', 'axios'], ['classify.reason', 'http-5xx-error'], ['http.status_code', '500']],
    },
    {
      id: 'health-nothrow', app: 'health-web', side: 'client', label: 'useQuery · throwOnError: false',
      steps: [
        { node: 'source', title: '결과 조회가 실패했다', body: '결과 화면이 404(결과 없음)는 안내 문구로, 그 밖의 실패는 첫 화면으로 되돌리며 직접 처리합니다.', code: 'useGetResult({\n  query: { retry: false, throwOnError: false },\n})' },
        { node: 'entry', title: '호출부 옵션이 앱 기본값을 덮는다', tag: 'handled', body: '<code>throwOnError: false</code>가 앱 기본 throwOnError(캡처가 들어 있는 함수)를 통째로 대신합니다. 그래서 실패해도 캡처 코드가 실행되지 않고, 에러는 <code>isError</code>로만 화면에 전달됩니다.', stop: true },
      ],
      stopNote: '전송 안 함. 화면을 직접 처리하려고 던지기를 끄면 보고도 같이 꺼집니다. 남기고 싶은 실패는 화면 처리 코드에서 직접 sentryCaptureException을 부릅니다.',
    },
    {
      id: 'health-mutation', app: 'health-web', side: 'client', label: 'useMutation 500 · 탈퇴',
      steps: [
        { node: 'source', title: '회원 탈퇴 요청이 500', body: '탈퇴 사유를 고르고(기타면 직접 입력) 제출했습니다.', code: "mutateAsync({\n  data: { reason: 'ETC', detail: '(사용자가 쓴 사유)' },\n})\n\nPOST /api/v1/me/withdrawal-user\n← 500 Internal Server Error" },
        { node: 'entry', title: 'MutationCache.onError가 먼저 받는다', tag: 'handled', body: '되돌릴 수 없는 요청이라 훅이 <code>retry: false</code>를 줘서 재시도하지 않습니다. 실패하면 전역 <code>mutationCache.onError</code>가 훅의 onError보다 먼저 불립니다.' },
        { node: 'gate', title: '앱 게이트를 통과한다', body: '500은 끄는 meta가 없어 그대로 보냅니다.', code: 'captureException(error, {\n  contexts: { mutation: { variables, context } },\n})' },
        { node: 'normalize', title: 'axios 에러, 경로 마지막 조각이 지워진다', body: '<code>withdrawal-user</code>에 하이픈이 있어 <code>{param}</code>이 됩니다.', code: "{\n  kind: 'axios',\n  name: '[500][POST] /api/v1/me/{param}',\n  fingerprint: ['post', '500', '/api/v1/me/{param}'],\n}" },
        { node: 'classify', title: '7번 규칙에 걸려 error', body: '', rules: 6 },
        { node: 'enrich', title: '요청 바디가 다른 길로 실린다', body: '패키지가 만드는 context에는 바디가 없고, <code>mutation.variables</code>는 SDK 기본 깊이 3에서 <code>[Object]</code>로 잘립니다. 하지만 SDK의 extraErrorDataIntegration이 에러 객체의 <code>config.data</code>(요청 바디 JSON 문자열)를 그대로 싣습니다.', code: "contexts: {\n  mutation: { variables: { data: '[Object]' } },\n  '[500][POST] /api/v1/me/{param}': {\n    config: {\n      data: '{\"reason\":\"ETC\",\"detail\":\"(사용자가 쓴 사유)\"}',\n    },\n  },\n}" },
      ],
      chain: [C.filters('메시지가 필터 목록에 없음'), C.unhandled('pass', PRE), C.bridge(), C.third('pass', 'third_party_code 태그 없음'), HEALTH_APP_PASS],
      level: 'error', issue: '[500][POST] /api/v1/me/{param}',
      tags: [['error.kind', 'axios'], ['classify.reason', 'http-5xx-error'], ['requestMethod', 'POST']],
      after: '이어서 훅의 onError가 실패 안내를 띄우고 mutateAsync가 reject됩니다. 이 훅은 Sentry를 다시 부르지 않습니다.',
    },
    {
      id: 'health-409', app: 'health-web', side: 'client', label: 'useMutation 409 · meta로 끔',
      steps: [
        { node: 'source', title: '재계산 버튼을 연타했다', body: '서버가 1초 안의 중복 호출을 409로 막습니다. 버튼 연타로 자연스럽게 생기는 예상 응답입니다.', code: 'POST (점수 재계산)\n← 409 Conflict' },
        { node: 'entry', title: 'MutationCache가 받는다', tag: 'handled', body: '모든 뮤테이션 실패는 <code>mutationCache.onError</code>를 지납니다. 뮤테이션은 ErrorBoundary로 던지지 않아 다시 캡처되는 경로가 없습니다.' },
        { node: 'gate', title: '호출부가 꺼 둔 409라 여기서 멈춘다', body: '뮤테이션 meta의 <code>sentryOn409: false</code> 때문에 앱 게이트가 false를 돌려줍니다. 패키지는 이 에러를 보지도 못합니다.', code: 'useRecalculate({\n  mutation: { meta: { sentryOn409: false } },\n})', stop: true },
      ],
      stopNote: '전송 안 함. 409는 원래 warning이라 끄지 않았어도 알림은 없었습니다. 끈 대가로 빈도만 볼 수 없게 됐습니다.',
    },
    {
      id: 'chat-offline', app: 'chat-web', side: 'client', label: '망 단절 · 대화 메시지',
      steps: [
        { node: 'source', title: '지하철에서 망이 끊겼다', body: '대화 메시지를 불러오는 중에 연결이 끊겼습니다.', code: 'GET …/api/v1/conversation/01J9Z4K2QX/messages\n✕ AxiosError: Network Error (ERR_NETWORK)' },
        { node: 'entry', title: '오프라인이면 멈췄다가, 복귀 후 실패하면 던진다', tag: 'handled', body: "TanStack 기본 <code>networkMode: 'online'</code>은 오프라인이면 재시도를 멈추고 기다립니다. 망이 돌아온 뒤에도 실패하면(게이트웨이 장애 등) 던지고, 이때는 <code>navigator.onLine</code>이 true라 ErrorBoundary가 보고합니다." },
        { node: 'gate', skip: true, title: '앱 게이트를 건너뛴다', body: 'suspense 쿼리라 우리 throwOnError가 불리지 않습니다.' },
        { node: 'normalize', title: '망 단절 플래그가 선다', body: '', code: "{\n  kind: 'axios',\n  name: '[NetworkError][GET] /api/v1/conversation/{param}/messages',\n  http: { status: undefined, isNetworkError: true },\n}" },
        { node: 'classify', title: '3번 규칙에 걸려 스킵', body: '<code>axios-noise-skip</code>이 <code>report: false</code>를 냅니다. 래퍼는 SDK를 부르지 않고 돌아갑니다.', rules: 2, stop: true },
      ],
      stopNote: '전송 안 함. 래퍼를 지나쳤더라도 SDK ignoreErrors의 Network Error가 한 번 더 막습니다. 서버 컴포넌트의 망 단절은 다릅니다(status 없는 ServerFetchError → default error → 알림).',
    },
    {
      id: 'chat-render', app: 'chat-web', side: 'client', label: '렌더 TypeError',
      steps: [
        { node: 'source', title: '채팅 화면을 그리다 TypeError가 났다', body: '위젯 데이터가 비어 있는데 <code>.map</code>을 불렀습니다. 서버 응답 문제가 아니라 정상 흐름에서는 나올 수 없는 우리 코드 결함입니다.', code: "TypeError: Cannot read properties of undefined (reading 'map')" },
        { node: 'entry', title: 'ErrorBoundary가 잡는다', tag: 'handled', body: '<code>componentDidCatch</code>가 먼저 <code>navigator.onLine</code>을 봅니다. 온라인이므로 컴포넌트 스택을 붙여 래퍼를 부릅니다.', code: 'sentryCaptureException(error, {\n  contexts: { react: { componentStack } },\n})' },
        { node: 'gate', skip: true, title: '앱 게이트 없음', body: 'React Query를 거치지 않았습니다.' },
        { node: 'normalize', title: '일반 Error로 판별된다', body: 'fingerprint는 <code>[이름, 메시지]</code>입니다.', code: "{\n  kind: 'error',\n  name: 'TypeError',\n  fingerprint: ['TypeError', \"Cannot read properties of undefined (reading 'map')\"],\n}" },
        { node: 'classify', title: '4번 규칙에 걸려 fatal', body: '1~3번 스킵 규칙은 모두 빗나가고, <code>js-runtime-fault-fatal</code>이 처음 맞는 규칙입니다.', rules: 3 },
        { node: 'enrich', title: '태그와 context를 붙여 SDK로 넘긴다', body: '호출자가 넘긴 <code>react</code> context는 그대로 합쳐지고, 판정 기록 태그는 마지막에 다시 넣어 호출자가 지울 수 없습니다.', code: "tags: {\n  'error.kind': 'error',\n  'classify.reason': 'js-runtime-fault-fatal',\n  isPreProcessed: true,\n},\ncontexts: {\n  classification: { reason: 'js-runtime-fault-fatal', level: 'fatal', matchedBy: 'rule' },\n  react: { componentStack: '…' },\n}" },
      ],
      chain: [C.filters('메시지·URL이 필터 목록에 없음'), C.unhandled('pass', PRE), C.bridge(), C.third('pass', '크래시 프레임이 우리 번들이라 third_party_code 태그가 없음'), CHAT_APP_NONE],
      level: 'fatal', issue: "TypeError: Cannot read properties of undefined (reading 'map')",
      tags: [['error.kind', 'error'], ['classify.reason', 'js-runtime-fault-fatal']],
    },
    {
      id: 'health-inapp', app: 'health-web', side: 'client', label: '인앱 브라우저 브릿지',
      steps: [
        { node: 'source', title: '인앱 브라우저의 브릿지 응답 스크립트가 터졌다', body: '우리 코드가 뒤로 갈 수 있는지 물으면, 네이티브가 결과를 <code>window.__canGoBackResult(…)</code>로 돌려주는 스크립트를 실행합니다. 그 콜백이 페이지에 없어서 터집니다. 계기는 우리 호출이지만 메시지는 우리 코드가 만들 수 없습니다. 화면은 타임아웃 뒤 다음 동작으로 넘어가 사용자 영향은 없습니다.', code: 'TypeError: window.__canGoBackResult is not a function\n    at <anonymous>:1:37' },
        { node: 'entry', title: '아무도 못 잡았다', tag: 'unhandled', body: 'SDK 전역 핸들러(window.onerror)가 이벤트를 만듭니다. 스택에 우리 앱 키가 찍힌 프레임이 없어서 integration이 <code>third_party_code: true</code> 태그를 붙입니다.' },
        { node: 'gate', skip: true, title: '앱 게이트 없음', body: 'React Query나 catch를 거치지 않았습니다.' },
        { node: 'normalize', title: 'beforeSend ① 안에서 정규화한다', body: '<code>hint.originalException</code>을 꺼내 handled와 같은 함수로 정규화합니다.', code: "{\n  kind: 'error',\n  name: 'TypeError',\n  fingerprint: ['TypeError', 'window.__canGoBackResult is not a function'],\n}" },
        { node: 'classify', title: '공용 규칙은 fatal로 올린다', body: '공용 규칙만으로는 우리 코드의 TypeError와 구별할 수 없습니다.', rules: 3 },
        { node: 'enrich', title: '이벤트에 level·fingerprint·태그를 쓴다', body: 'unhandled 경로는 SDK가 만든 이벤트를 직접 고칩니다.', code: "event.level = 'fatal'\nevent.fingerprint = ['TypeError', 'window.__canGoBackResult is not a function']\nevent.tags = { ...buildErrorTags(), ...event.tags, ...buildErrorAuditTags() }" },
      ],
      chain: [
        C.filters('메시지·URL이 필터 목록에 없음'),
        C.unhandled('modify', 'level fatal, fingerprint, 태그를 씀'),
        C.bridge(),
        C.third('modify', '크래시 프레임이 <anonymous>(줄·열 있음)라 확실히 남의 코드 → 제목을 ThirdPartyError (TypeError)로. fingerprint는 ①이 정해 둬서 그룹은 그대로'),
        C.app('modify', "인앱 브라우저 노이즈 정책이 메시지를 알아보고 level을 'info'로 내림"),
      ],
      level: 'info', issue: 'ThirdPartyError (TypeError): window.__canGoBackResult is not a function',
      tags: [['classify.reason', 'js-runtime-fault-fatal'], ['third_party_code', 'true']],
      after: '공용 규칙이 fatal로 올렸어도 앱 beforeSend가 마지막에 info로 내립니다.',
    },
    {
      id: 'health-rsc', app: 'health-web', side: 'server', label: '서버 컴포넌트 500',
      steps: [
        { node: 'source', title: '서버 컴포넌트가 API를 부르다 500을 받았다', body: '동의 이력 화면은 <code>force-dynamic</code> 서버 컴포넌트입니다. 서버 fetch에는 재시도가 없어서 한 번 실패로 바로 <code>ServerFetchError</code>가 납니다.', code: "const response = await consentHistory({ cache: 'no-store' })\n\n// serverFetch 안에서\nthrow new ServerFetchError('서버사이드 fetch 실패: HTTP 500', {\n  status: 500, method: 'GET', url, payload,\n})" },
        { node: 'entry', title: 'Next.js가 onRequestError로 넘긴다', tag: 'unhandled', body: '렌더가 실패하면 Next.js가 <code>instrumentation.ts</code>의 <code>onRequestError</code>(= <code>Sentry.captureRequestError</code>)를 부릅니다. 서버 SDK가 이벤트를 만듭니다.' },
        { node: 'gate', skip: true, title: '앱 게이트 없음', body: '서버에는 React Query가 없습니다.' },
        { node: 'normalize', title: 'server-fetch로 판별된다', body: '<code>consent-history</code>에 하이픈이 있어 <code>{param}</code>이 됩니다.', code: "{\n  kind: 'server-fetch',\n  name: '[500][GET] /api/v1/me/{param}',\n  fingerprint: ['GET', '500', '/api/v1/me/{param}'],\n}" },
        { node: 'classify', title: '7번 규칙에 걸려 error', body: '', rules: 6 },
        { node: 'enrich', title: '이벤트에 level·fingerprint·태그를 쓰고 제목을 바꾼다', body: 'exception type을 정규화한 이름으로 바꿔 이슈 제목에서 엔드포인트가 보이게 합니다. SDK가 ServerFetchError 필드(status·url·method·payload)를 context로, 요청 쿠키를 request로 싣습니다. user 필드는 비어 있습니다.', code: "event.level = 'error'\nevent.fingerprint = ['GET', '500', '/api/v1/me/{param}']\nevent.exception.values[last].type = '[500][GET] /api/v1/me/{param}'" },
      ],
      chain: [C.filters('서버 ignoreErrors에 없음'), C.unhandled('modify', 'server-fetch로 분류, 제목 교체')],
      level: 'error', issue: '[500][GET] /api/v1/me/{param}',
      tags: [['error.kind', 'server-fetch'], ['classify.reason', 'http-5xx-error'], ['isServerFetchError', 'true']],
      after: '같은 순간 브라우저의 <code>error.tsx</code>도 digest만 남은 에러를 받지만, <code>captureBoundaryError</code>가 digest를 보고 보고하지 않습니다.',
    },
    {
      id: 'chat-route', app: 'chat-web', side: 'server', label: 'Route Handler 저장 실패',
      steps: [
        { node: 'source', title: 'Route Handler에서 외부 API 저장이 실패했다', body: '서버(Node)에서 난 에러입니다. 브라우저 SDK가 아니라 서버 SDK가 처리합니다.', code: 'POST /api/feedback\n  → 외부 API 저장 실패' },
        { node: 'entry', title: '502로 바꿔 응답하면서 직접 보고한다', tag: 'handled', body: '실패를 에러 응답으로 흡수하면 Next.js에는 정상 응답입니다. <code>onRequestError</code>가 울리지 않으니 직접 보고합니다. 피드백 본문과 userId는 넣지 않습니다.', code: "sentryCaptureException(cause, {\n  tags: { boundary: 'feedback', gate: 'write' },\n})\nreturn Response.json({ code: 502, message }, { status: 502 })" },
        { node: 'gate', skip: true, title: '앱 게이트 없음', body: '직접 부른 경우라 앞단 게이트가 없습니다.' },
        { node: 'normalize', title: '일반 Error로 판별된다', body: "외부 API 클라이언트가 던진 Error 계열이라 <code>kind: 'error'</code>입니다.", code: "{\n  kind: 'error',\n  name: 'Error',\n  fingerprint: ['Error', '(외부 API가 준 실패 사유)'],\n}" },
        { node: 'classify', title: '어떤 규칙에도 맞지 않아 default', body: 'HTTP 정보도 없고 런타임 결함 이름도 아닙니다. 무매칭이면 <code>error</code>로 보냅니다.', rules: 7 },
        { node: 'enrich', title: '호출자 태그와 판정 기록 태그가 같이 붙는다', body: '', code: "tags: {\n  boundary: 'feedback',\n  gate: 'write',\n  'error.kind': 'error',\n  'classify.reason': 'default',\n  isPreProcessed: true,\n}" },
      ],
      chain: [C.filters('서버 ignoreErrors에 없음'), C.unhandled('pass', PRE)],
      level: 'error', issue: 'Error: (외부 API가 준 실패 사유)',
      tags: [['boundary', 'feedback'], ['gate', 'write'], ['classify.reason', 'default']],
      after: '외부 API가 응답 대신 소켓을 끊으면 <code>TypeError: fetch failed</code>라 런타임 결함 규칙에 걸려 <span class="lv lv-fatal">fatal</span>이 됩니다. 그래서 공용 클라이언트가 조회 요청만 1회 다시 보내 대부분 흡수합니다.',
    },
  ];
  const GROUPS = [
    ['React Query', ['chat-404', 'health-suspense', 'health-nothrow', 'health-mutation', 'health-409', 'chat-offline']],
    ['렌더 · 전역', ['chat-render', 'health-inapp']],
    ['서버', ['health-rsc', 'chat-route']],
  ];
  const ENV_NAME = { local: 'local', dev: 'development', stg: 'staging', prd: 'production' };

  function buildSteps(sc, env) {
    const steps = sc.steps.map((s) => ({ ...s }));
    if (steps[steps.length - 1].stop) {
      steps.stopNote = sc.stopNote;
      return steps;
    }
    const devName = sc.side === 'server' ? '② beforeSendDropDevToConsole' : '⑤ beforeSendDropDevToConsole';
    if (env === 'local' && sc.app === 'chat-web') {
      steps.push({
        node: 'beforeSend', stop: true, title: '로컬에서는 SDK를 초기화하지 않았다',
        body: 'chat-web 로컬 <code>.env</code>는 DSN이 비어 있어 init을 아예 부르지 않습니다. 래퍼가 부른 <code>captureException</code>은 아무 일도 하지 않습니다. DSN을 채우면 <code>enabled: false</code>라 전송은 안 되지만 handled 에러는 beforeSend까지 돌아 콘솔에 찍힙니다.',
      });
      steps.stopNote = '아무 데도 기록되지 않음.';
      return steps;
    }
    const chain = [...sc.chain];
    if (env === 'local') {
      const where = sc.side === 'server' ? 'next dev를 띄운 터미널' : '브라우저 개발자 도구 콘솔';
      chain.push({ nm: devName, st: 'drop', note: "NODE_ENV=development → console.error('[will be sent to Sentry]', 보낼 내용) 후 버림" });
      steps.push({ node: 'beforeSend', chain, stop: true, title: 'beforeSend 체인: 마지막에 콘솔로 돌린다', body: `마지막 단계가 보낼 내용을 콘솔에 찍고 이벤트를 버립니다. ${where}에서 tags·contexts·fingerprint를 그대로 확인할 수 있습니다.` });
      steps.stopNote = '콘솔에만 출력. Sentry로는 가지 않습니다.';
      return steps;
    }
    chain.push({ nm: devName, st: 'pass', note: '배포 빌드는 NODE_ENV=production이라 통과' });
    steps.push({ node: 'beforeSend', chain, title: 'beforeSend 체인을 지난다', body: sc.side === 'server' ? 'Node 서버 체인은 두 단계뿐입니다.' : '순서대로 각 단계가 이벤트를 넘기거나 고칩니다. 버리는 단계는 없었습니다.' });
    steps.push({ node: 'sentry', issue: true, title: 'Sentry에 이슈로 쌓인다', body: `environment <code>${ENV_NAME[env]}</code>로 기록되고 fingerprint가 같은 이벤트끼리 한 이슈로 묶입니다.` + (sc.after ? ' ' + sc.after : '') });
    const alertOn = (env === 'stg' || env === 'prd') && ALERT_LEVELS.has(sc.level);
    let why;
    if (alertOn) why = `environment가 ${ENV_NAME[env]}이고 level이 ${sc.level}이라 릴레이 조건을 통과합니다. 실제로 울리는 시점(새 이슈·회귀 등)은 Sentry 알림 규칙의 발동 조건을 따릅니다.`;
    else if (env === 'dev') why = '릴레이는 staging·production만 보냅니다. dev 이슈는 Sentry에서 직접 봅니다.';
    else why = `level이 ${sc.level}이라 릴레이가 보내지 않습니다. 기록만 남습니다.`;
    steps.push({ node: 'alert', alert: alertOn, title: alertOn ? 'Google Chat 알림 대상' : '알림은 가지 않는다', body: why });
    return steps;
  }

  const byId = Object.fromEntries(SCENARIOS.map((sc) => [sc.id, sc]))
  const ordered = GROUPS.flatMap(([, ids]) => ids.map((id) => byId[id]))
  const sim = { sc: ordered[0], env: 'prd', i: 0, steps: [] }
  const pick = $('simPick')
  GROUPS.forEach(([label, ids]) => {
    const row = document.createElement('div')
    row.className = 'ex-pick'
    row.innerHTML = `<span class="lbl">${esc(label)}</span>`
    ids.forEach((id) => {
      const sc = byId[id]
      const b = document.createElement('button')
      b.type = 'button'; b.className = 'chip'; b.dataset.id = sc.id
      b.innerHTML = `<small>${(ordered.indexOf(sc) + 1) % 10}</small>${esc(sc.label)}`
      b.addEventListener('click', () => pickScenario(sc))
      row.appendChild(b)
    })
    pick.appendChild(row)
  })
  function pickScenario(sc) { sim.sc = sc; sim.i = 0; renderSim() }
  document.querySelectorAll('#simEnv button').forEach((b) => b.addEventListener('click', () => {
    const keep = sim.steps[sim.i]?.node
    sim.env = b.dataset.env
    sim.steps = buildSteps(sim.sc, sim.env)
    const back = sim.steps.findIndex((s) => s.node === keep)
    sim.i = back === -1 ? Math.min(sim.i, sim.steps.length - 1) : back
    renderSim()
  }))
  steppers.set(slides.findIndex((s) => s.querySelector('#sim')), {
    next: () => { if (sim.i >= sim.steps.length - 1) return false; sim.i++; renderSim(); return true },
    prev: () => { if (sim.i <= 0) return false; sim.i--; renderSim(); return true },
    enter: () => { sim.i = 0; renderSim() },
    key: (d) => { const sc = ordered[(d + 9) % 10]; if (!sc) return false; pickScenario(sc); return true },
  })
  $('simReset').addEventListener('click', () => { sim.i = 0; renderSim() })
  $('simPrev').addEventListener('click', () => { sim.i = Math.max(0, sim.i - 1); renderSim() })
  $('simNext').addEventListener('click', () => { sim.i = Math.min(sim.steps.length - 1, sim.i + 1); renderSim() })

  function renderSim() {
    const { sc, env } = sim
    sim.steps = buildSteps(sc, env)
    sim.i = Math.min(sim.i, sim.steps.length - 1)
    const step = sim.steps[sim.i]
    const last = sim.steps[sim.steps.length - 1]
    const endIx = NODE_IX[last.node]
    const curIx = NODE_IX[step.node]

    pick.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === sc.id)))
    document.querySelectorAll('#simEnv button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.env === env)))
    $('simSummary').textContent = `${sc.app} · ${sc.side === 'server' ? 'Node 서버' : '브라우저'}`

    const atEnd = sim.i === sim.steps.length - 1
    const skipped = new Set(sim.steps.filter((s, j) => s.skip && j <= sim.i).map((s) => s.node))
    $('simTrack').innerHTML = NODES.map(([id, nm], k) => {
      let cls = 'tnode'
      if (atEnd && k > endIx) cls += ' dead'
      else if (k < curIx) cls += ' done'
      else if (k === curIx) cls += ' cur'
      if (skipped.has(id)) cls += ' skip'
      if (last.stop && k === endIx && k <= curIx) cls += ' stop'
      return `<div class="${cls}"><span class="dot">${k + 1}</span><span class="nm">${nm}</span></div>`
    }).join('')
    $('simTrack').querySelector('.cur')?.scrollIntoView?.({ inline: 'center', block: 'nearest' })

    $('simStepK').textContent = `${String(curIx + 1).padStart(2, '0')} · ${NODES[curIx][1]}${step.tag ? ` · ${step.tag}` : ''}`
    $('simTitle').textContent = step.title
    $('simBody').innerHTML = step.body || ''
    $('simFile').textContent = step.file || ''
    $('simPos').textContent = `${sim.i + 1} / ${sim.steps.length}`
    $('simPrev').disabled = sim.i === 0
    $('simNext').disabled = sim.i === sim.steps.length - 1

    let side = ''
    if (step.code) side += `<pre class="code">${hl(step.code)}</pre>`
    if (step.rules !== undefined) {
      const v = RULES[step.rules]
      side += rulesHtml(step.rules)
      side += `<pre class="code">${hl(`{ report: ${v ? (v.report ?? true) : true}, level: '${v ? v.level : 'error'}', reason: '${v ? v.name : 'default'}' }`)}</pre>`
    }
    if (step.chain) {
      side += `<div class="chain">${step.chain.map((c) => `<div class="link"><span class="nm">${esc(c.nm)}</span><span class="st st-${c.st}">${{ pass: '통과', modify: '수정', drop: '버림', none: '없음' }[c.st]}</span>${c.note ? `<span class="note">${esc(c.note)}</span>` : ''}</div>`).join('')}</div>`
    }
    if (step.issue) {
      side += `<div class="issue"><div class="top"><span>${sc.app}</span><span>·</span><span>${ENV_NAME[env]}</span><span class="lv lv-${sc.level}">${sc.level}</span></div><div class="ttl">${esc(sc.issue)}</div><div class="tags">${sc.tags.map(([k, v]) => `<span class="tagc"><b>${esc(k)}:</b> ${esc(v)}</span>`).join('')}</div></div>`
    }
    if (step.node === 'alert') {
      side += step.alert
        ? `<div class="alert on"><span class="lv lv-${sc.level}">${sc.level}</span><span class="msg">[${ENV_NAME[env]}] ${esc(sc.app)} · ${esc(sc.issue)}</span><span class="small muted">Sentry 알림 규칙 → Apps Script 릴레이 → Google Chat</span></div>`
        : `<div class="alert off"><span class="small">알림 없음</span><span class="small muted">릴레이 조건: environment staging·production, level error 이상</span></div>`
    }
    if (sim.i === sim.steps.length - 1) {
      const out = last.stop
        ? `<span class="lv lv-drop">끝</span> ${esc(sim.steps.stopNote || sc.stopNote || '')}`
        : last.alert ? `<span class="lv lv-${sc.level}">${sc.level}</span> Sentry 기록 + Google Chat 알림 대상` : `<span class="lv lv-${sc.level}">${sc.level}</span> Sentry 기록만`
      side += `<div class="outcome">${out}</div>`
    }
    $('simSide').innerHTML = side
  }
  renderSim()

  // ---------- 시작 ----------
  const fromHash = () => { const m = /^#s(\d+)$/.exec(location.hash); return m ? Number(m[1]) - 1 : 0 }
  window.addEventListener('hashchange', () => go(fromHash()))
  go(fromHash())
})()
