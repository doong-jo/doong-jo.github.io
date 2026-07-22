/**
 * 구독 관리 모듈
 * - Railway API와 통신
 * - 모달 및 인라인 폼 핸들링
 * - 상태 피드백 (로딩, 성공, 에러)
 */

const SUBSCRIBE_API = 'https://doong-jo-subscription.up.railway.app/subscribe';

class SubscribeManager {
  constructor() {
    this.dialog = document.getElementById('subscribe-dialog');
    this.init();
  }

  init() {
    // 모달 열기 트리거
    document.querySelectorAll('[data-subscribe-trigger]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal();
      });
    });

    // 폼 제출 (모달 + 인라인)
    document.querySelectorAll('[data-subscribe-form]').forEach(form => {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    });

    // 모달 닫기 버튼
    document.querySelectorAll('[data-subscribe-close]').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });

    // 백드롭 클릭으로 닫기
    if (this.dialog) {
      this.dialog.addEventListener('click', (e) => {
        if (e.target === this.dialog) this.closeModal();
      });
    }
  }

  openModal() {
    if (this.dialog) {
      this.dialog.showModal();
      const input = this.dialog.querySelector('input[type="email"]');
      if (input) input.focus();
    }
  }

  closeModal() {
    if (this.dialog) {
      this.dialog.close();
      const form = this.dialog.querySelector('form');
      if (form) this.resetForm(form);
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput.value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');
    const messageEl = this.getOrCreateMessageEl(form);

    // 유효성 검사
    if (!this.validateEmail(email)) {
      this.showMessage(messageEl, '올바른 이메일 주소를 입력해주세요.', 'error');
      emailInput.focus();
      return;
    }

    // 로딩 상태
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="subscribe-spinner"></span>';

    try {
      const response = await fetch(SUBSCRIBE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        this.showMessage(
          messageEl,
          data.message || '확인 메일을 보냈습니다. 메일함을 확인해주세요!',
          'success'
        );
        emailInput.value = '';

        // 모달인 경우 3초 후 자동 닫기
        if (form.closest('dialog')) {
          setTimeout(() => this.closeModal(), 3000);
        }
      } else {
        this.showMessage(
          messageEl,
          data.message || '구독 처리 중 오류가 발생했습니다.',
          'error'
        );
      }
    } catch (error) {
      this.showMessage(
        messageEl,
        '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        'error'
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getOrCreateMessageEl(form) {
    let messageEl = form.parentElement.querySelector('[data-subscribe-message]');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.setAttribute('data-subscribe-message', '');
      messageEl.className = 'subscribe-message';
      messageEl.style.display = 'none';
      form.after(messageEl);
    }
    return messageEl;
  }

  showMessage(el, text, type) {
    el.textContent = text;
    el.className = `subscribe-message ${type}`;
    el.style.display = 'block';
  }

  resetForm(form) {
    form.reset();
    const messageEl = form.parentElement.querySelector('[data-subscribe-message]');
    if (messageEl) messageEl.style.display = 'none';
  }
}

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  new SubscribeManager();
});
