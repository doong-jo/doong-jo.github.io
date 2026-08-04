(function () {
  const canvas = document.getElementById('perf-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // 데이터
  const data = [
    { label: 'p50', before: 6.5, after: 1.7 },
    { label: 'p95', before: 19, after: 3.2 },
    { label: '빠른 네트워크', before: 3.3, after: 0.3 },
  ];

  const maxValue = 19;

  // 색상 (CSS 변수에서 가져오기)
  const style = getComputedStyle(document.documentElement);
  const colors = {
    gray300: style.getPropertyValue('--gray300').trim() || '#b0b8c1',
    gray400: style.getPropertyValue('--gray400').trim() || '#8b95a1',
    gray500: style.getPropertyValue('--gray500').trim() || '#6b7684',
    gray600: style.getPropertyValue('--gray600').trim() || '#4e5968',
    gray700: style.getPropertyValue('--gray700').trim() || '#333d4b',
    primary: style.getPropertyValue('--primary').trim() || '#2d6a4f',
    primaryLight: '#52b788',
    white: '#ffffff',
  };

  // 레이아웃
  const config = {
    labelWidth: 90,
    barHeight: 20,
    barGap: 8,
    rowGap: 28,
    barRadius: 10,
    rightPadding: 60,
    topPadding: 10,
    bottomPadding: 50,
  };

  // 캔버스 크기 설정
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width - 48; // padding 제외
    const height =
      config.topPadding +
      data.length * (config.barHeight * 2 + config.barGap + config.rowGap) -
      config.rowGap +
      config.bottomPadding;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    return { width, height };
  }

  // 둥근 막대 그리기
  function drawRoundedBar(x, y, width, height, radius, color1, color2) {
    if (width < radius * 2) {
      radius = width / 2;
    }

    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // easeOutExpo
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  // 애니메이션
  let animationProgress = 0;
  let animationStartTime = null;
  const animationDuration = 1200;
  let isAnimating = false;

  function draw(size, progress) {
    ctx.clearRect(0, 0, size.width, size.height);

    const barAreaWidth = size.width - config.labelWidth - config.rightPadding;

    data.forEach((item, index) => {
      const rowY =
        config.topPadding +
        index * (config.barHeight * 2 + config.barGap + config.rowGap);

      // 라벨
      ctx.font = '600 14px Pretendard, -apple-system, sans-serif';
      ctx.fillStyle = colors.gray700;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        item.label,
        config.labelWidth - 12,
        rowY + config.barHeight + config.barGap / 2
      );

      // before 막대
      const beforeWidth =
        (item.before / maxValue) * barAreaWidth * easeOutExpo(progress);
      drawRoundedBar(
        config.labelWidth,
        rowY,
        beforeWidth,
        config.barHeight,
        config.barRadius,
        colors.gray300,
        colors.gray400
      );

      // before 값 텍스트
      if (progress > 0.3) {
        ctx.font = '600 12px Pretendard, -apple-system, sans-serif';
        ctx.fillStyle = colors.gray600;
        ctx.textAlign = 'left';
        const beforeTextX = config.labelWidth + beforeWidth + 8;
        ctx.fillText(item.before + '초', beforeTextX, rowY + config.barHeight / 2);
      }

      // after 막대
      const afterY = rowY + config.barHeight + config.barGap;
      const afterWidth =
        (item.after / maxValue) * barAreaWidth * easeOutExpo(progress);
      drawRoundedBar(
        config.labelWidth,
        afterY,
        afterWidth,
        config.barHeight,
        config.barRadius,
        colors.primaryLight,
        colors.primary
      );

      // after 값 텍스트
      if (progress > 0.3) {
        ctx.font = '600 12px Pretendard, -apple-system, sans-serif';
        ctx.fillStyle = colors.white;
        ctx.textAlign = 'right';
        const afterTextX = config.labelWidth + afterWidth - 8;
        if (afterWidth > 50) {
          ctx.fillText(item.after + '초', afterTextX, afterY + config.barHeight / 2);
        } else {
          ctx.fillStyle = colors.primary;
          ctx.textAlign = 'left';
          ctx.fillText(
            item.after + '초',
            config.labelWidth + afterWidth + 8,
            afterY + config.barHeight / 2
          );
        }
      }

      // 개선율
      if (progress > 0.5) {
        const changePercent = Math.round(
          ((item.before - item.after) / item.before) * 100
        );
        ctx.font = '700 14px Pretendard, -apple-system, sans-serif';
        ctx.fillStyle = colors.primary;
        ctx.textAlign = 'right';
        ctx.fillText(
          '−' + changePercent + '%',
          size.width - 8,
          rowY + config.barHeight + config.barGap / 2
        );
      }
    });

    // 범례
    if (progress > 0.7) {
      const legendY = size.height - 20;
      const centerX = size.width / 2;

      // before 범례
      ctx.beginPath();
      ctx.arc(centerX - 70, legendY, 6, 0, Math.PI * 2);
      ctx.fillStyle = colors.gray400;
      ctx.fill();
      ctx.font = '500 13px Pretendard, -apple-system, sans-serif';
      ctx.fillStyle = colors.gray600;
      ctx.textAlign = 'left';
      ctx.fillText('개선 전', centerX - 58, legendY + 1);

      // after 범례
      ctx.beginPath();
      ctx.arc(centerX + 30, legendY, 6, 0, Math.PI * 2);
      ctx.fillStyle = colors.primary;
      ctx.fill();
      ctx.fillStyle = colors.gray600;
      ctx.fillText('개선 후', centerX + 42, legendY + 1);
    }
  }

  function animate(timestamp) {
    if (!animationStartTime) animationStartTime = timestamp;
    const elapsed = timestamp - animationStartTime;
    animationProgress = Math.min(elapsed / animationDuration, 1);

    const size = { width: canvas.width / dpr, height: canvas.height / dpr };
    draw(size, animationProgress);

    if (animationProgress < 1) {
      requestAnimationFrame(animate);
    } else {
      isAnimating = false;
    }
  }

  function startAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    animationStartTime = null;
    animationProgress = 0;
    requestAnimationFrame(animate);
  }

  // Intersection Observer로 뷰포트 진입 시 애니메이션 시작
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const size = resize();
          startAnimation();
          observer.unobserve(canvas);
        }
      });
    },
    { threshold: 0.3 }
  );

  // 초기화
  const size = resize();
  draw(size, 0);
  observer.observe(canvas);

  // 리사이즈 대응
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const size = resize();
      draw(size, animationProgress);
    }, 100);
  });
})();
