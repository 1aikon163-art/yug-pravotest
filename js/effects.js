/**
 * ЮГ-ПРАВО — Эффекты интерфейса, горизонтальный скролл, модальные окна, Cookie-баннер и 152-ФЗ валидация
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initHorizontalScrollTapes();
    initScrollReveal();
    initModals();
    initForms();
    initCookieBanner();
    initFloatingMessengerWidget();
    initMobileNavToggle();
  });

  /* ── 0. UNIVERSAL MOBILE NAV TOGGLE ── */
  function initMobileNavToggle() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    if (!menuBtn || !mobileNav) return;
    if (menuBtn.dataset.bound) return;
    menuBtn.dataset.bound = 'true';

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = mobileNav.classList.toggle('hidden');
      const icon = menuBtn.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.textContent = isHidden ? 'menu' : 'close';
      }
    });

    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !menuBtn.contains(e.target)) {
        mobileNav.classList.add('hidden');
        const icon = menuBtn.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'menu';
      }
    });

    mobileNav.querySelectorAll('a, button').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.add('hidden');
        const icon = menuBtn.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'menu';
      });
    });
  }

  /* ── 1. FROSTED GLASS HEADER SCROLL SHADOW ── */
  function initHeaderScroll() {
    const header = document.querySelector('.glass-header') || document.querySelector('#main-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  /* ── 2. INFINITE SEAMLESS HORIZONTAL SCROLL TAPES ── */
  function initHorizontalScrollTapes() {
    const wrappers = document.querySelectorAll('.horizontal-tape-wrapper');
    if (!wrappers.length) return;

    wrappers.forEach((wrapper) => {
      const container = wrapper.querySelector('.horizontal-scroll-container');
      const prevBtn = wrapper.querySelector('.glass-nav-btn-prev');
      const nextBtn = wrapper.querySelector('.glass-nav-btn-next');

      if (!container) return;

      const originalCards = Array.from(container.children);
      if (originalCards.length === 0) return;

      // Duplicate cards to enable infinite seamless looping
      originalCards.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        container.appendChild(clone);
      });
      originalCards.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        container.appendChild(clone);
      });

      let isDragging = false;
      let startX = 0;
      let startScrollLeft = 0;
      let isAnimating = false;
      let hasDragged = false;

      const getCycleWidth = () => {
        let width = 0;
        for (let i = 0; i < originalCards.length; i++) {
          width += originalCards[i].offsetWidth + 28;
        }
        return width || (container.scrollWidth / 3);
      };

      let cycleWidth = getCycleWidth();
      window.addEventListener('resize', () => {
        cycleWidth = getCycleWidth();
      });

      // Start in middle copy
      if (cycleWidth > 0) {
        container.scrollLeft = cycleWidth;
      }

      const checkInfiniteWrap = () => {
        if (cycleWidth <= 0) return;
        if (container.scrollLeft >= cycleWidth * 2) {
          container.scrollLeft -= cycleWidth;
        } else if (container.scrollLeft <= 10) {
          container.scrollLeft += cycleWidth;
        }
      };

      // Fast, snappy animated scroll for buttons & keyboard
      function fastSmoothScroll(distance, duration = 220) {
        if (isAnimating) return;
        isAnimating = true;
        
        const start = container.scrollLeft;
        const startTime = performance.now();

        function easeOutCubic(t) {
          return (--t) * t * t + 1;
        }

        function step(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = easeOutCubic(progress);

          container.scrollLeft = start + distance * ease;
          checkInfiniteWrap();

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            isAnimating = false;
            checkInfiniteWrap();
          }
        }

        requestAnimationFrame(step);
      }

      const getCardStep = () => {
        const firstCard = container.querySelector('.material-glass-card');
        return firstCard ? (firstCard.offsetWidth + 28) : 380;
      };

      if (prevBtn) {
        prevBtn.style.opacity = '1';
        prevBtn.style.pointerEvents = 'auto';
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          fastSmoothScroll(-getCardStep(), 220);
        });
      }

      if (nextBtn) {
        nextBtn.style.opacity = '1';
        nextBtn.style.pointerEvents = 'auto';
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          fastSmoothScroll(getCardStep(), 220);
        });
      }

      // 1. Mouse Wheel Scrolling over carousel (Fast & responsive horizontal spinning)
      wrapper.addEventListener('wheel', (e) => {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(delta) > 0.5) {
          e.preventDefault();
          container.scrollLeft += delta * 1.6;
          checkInfiniteWrap();
        }
      }, { passive: false });

      // 2. Keyboard Navigation (ArrowLeft / ArrowRight)
      wrapper.setAttribute('tabindex', '0');
      wrapper.style.outline = 'none';

      window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

        // Check if this wrapper is hovered or focused
        const isHovered = wrapper.matches(':hover');
        const isFocused = wrapper.contains(document.activeElement) || wrapper === document.activeElement;

        // Or if it's the most prominent carousel currently visible in viewport
        let isTopVisible = false;
        if (!isHovered && !isFocused) {
          const rect = wrapper.getBoundingClientRect();
          const vCenter = window.innerHeight / 2;
          isTopVisible = (rect.top <= vCenter && rect.bottom >= vCenter);
        }

        if (isHovered || isFocused || isTopVisible) {
          e.preventDefault();
          if (e.key === 'ArrowLeft') {
            fastSmoothScroll(-getCardStep(), 220);
          } else if (e.key === 'ArrowRight') {
            fastSmoothScroll(getCardStep(), 220);
          }
        }
      });

      // 3. Drag-to-scroll with mouse
      container.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || e.target.closest('button, a, input, select, textarea')) return;
        isDragging = true;
        hasDragged = false;
        startX = e.pageX - container.offsetLeft;
        startScrollLeft = container.scrollLeft;
        container.style.cursor = 'grabbing';
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          container.style.cursor = '';
          checkInfiniteWrap();
        }
      });

      container.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.8;
        if (Math.abs(walk) > 4) {
          hasDragged = true;
        }
        e.preventDefault();
        container.scrollLeft = startScrollLeft - walk;
        checkInfiniteWrap();
      });

      // Prevent accidental clicks when dragging
      container.addEventListener('click', (e) => {
        if (hasDragged) {
          e.preventDefault();
          e.stopPropagation();
          hasDragged = false;
        }
      }, true);

      container.addEventListener('scroll', () => {
        if (!isAnimating) {
          checkInfiniteWrap();
        }
      }, { passive: true });
    });
  }

  /* ── 3. SCROLL REVEAL (INTERSECTION OBSERVER) ── */
  function initScrollReveal() {
    const elements = document.querySelectorAll('.scroll-animate');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
  }

  /* ── 4. RESILIENT MODALS SYSTEM ── */
  function createDynamicModal(modalId) {
    let html = '';
    if (modalId === 'modal-constructor') {
      html = `
        <div class="modal-overlay" id="modal-constructor">
          <div class="modal-container p-6 sm:p-8">
            <button class="modal-close-btn" onclick="closeModal('modal-constructor')" aria-label="Закрыть"><span class="material-symbols-outlined">close</span></button>
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-full bg-[#0F2439] text-[#C5A059] flex items-center justify-center">
                <span class="material-symbols-outlined">description</span>
              </div>
              <div>
                <h3 class="font-['Source_Serif_4'] text-xl sm:text-2xl font-bold text-[#0F2439]">Конструктор заявлений</h3>
                <span class="text-xs text-[#8C7A5B] font-semibold uppercase tracking-wider">Правовой модуль</span>
              </div>
            </div>
            <p class="text-xs sm:text-sm text-[#2C3E50] mb-4 leading-relaxed">Онлайн-конструктор процессуальных документов находится в финальной стадии тестирования.</p>
            <form class="space-y-3" onsubmit="event.preventDefault(); showToast('Вы успешно подписаны на уведомление о запуске!'); closeModal('modal-constructor');">
              <div class="flex gap-2">
                <input type="email" placeholder="Ваш e-mail" required class="flex-grow text-xs rounded border border-[#E0E0E0] px-3.5 py-2.5 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none">
                <button type="submit" class="px-5 py-2.5 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded hover:bg-[#1e3a5f] transition-all">Подписаться</button>
              </div>
            </form>
          </div>
        </div>`;
    } else if (modalId === 'modal-calculator') {
      html = `
        <div class="modal-overlay" id="modal-calculator">
          <div class="modal-container p-6 sm:p-8">
            <button class="modal-close-btn" onclick="closeModal('modal-calculator')" aria-label="Закрыть"><span class="material-symbols-outlined">close</span></button>
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-full bg-[#0F2439] text-[#C5A059] flex items-center justify-center">
                <span class="material-symbols-outlined">calculate</span>
              </div>
              <div>
                <h3 class="font-['Source_Serif_4'] text-xl sm:text-2xl font-bold text-[#0F2439]">Калькулятор пошлин</h3>
                <span class="text-xs text-[#8C7A5B] font-semibold uppercase tracking-wider">Ст. 333.19 НК РФ</span>
              </div>
            </div>
            <p class="text-xs sm:text-sm text-[#2C3E50] mb-4 leading-relaxed">Сервис автоматического расчета пошлин по ст. 333.19 НК РФ готовится к релизу.</p>
            <form class="space-y-3" onsubmit="event.preventDefault(); showToast('Вы успешно подписаны на уведомление о запуске!'); closeModal('modal-calculator');">
              <div class="flex gap-2">
                <input type="email" placeholder="Ваш e-mail" required class="flex-grow text-xs rounded border border-[#E0E0E0] px-3.5 py-2.5 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none">
                <button type="submit" class="px-5 py-2.5 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded hover:bg-[#1e3a5f] transition-all">Подписаться</button>
              </div>
            </form>
          </div>
        </div>`;
    } else if (modalId === 'modal-donate') {
      html = `
        <div class="modal-overlay" id="modal-donate">
          <div class="modal-container p-6 sm:p-8">
            <button class="modal-close-btn" onclick="closeModal('modal-donate')" aria-label="Закрыть"><span class="material-symbols-outlined">close</span></button>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-[#0F2439] text-[#C5A059] flex items-center justify-center">
                <span class="material-symbols-outlined">volunteer_activism</span>
              </div>
              <div>
                <h3 class="font-['Source_Serif_4'] text-2xl font-bold text-[#0F2439]">Поддержать проект</h3>
                <span class="text-xs text-[#8C7A5B] font-semibold uppercase tracking-wider">АНО «ЦПЗ ЮГ-ПРАВО»</span>
              </div>
            </div>
            <p class="text-xs text-[#2C3E50] mb-6 leading-relaxed">
              АНО «ЦПЗ ЮГ-ПРАВО» — некоммерческая организация. Ваши пожертвования идут на правовую помощь гражданам, выездные приемы в районах и экспертизу по ЖКХ.
            </p>
            <div class="space-y-3 mb-6 bg-white p-4 rounded-lg border border-[#E0E0E0] text-xs">
              <div class="flex justify-between py-1 border-b border-[#E0E0E0]"><span class="text-[#5f5e5e]">Получатель:</span><span class="font-bold text-[#0F2439]">АНО «ЦПЗ ЮГ-ПРАВО»</span></div>
              <div class="flex justify-between py-1 border-b border-[#E0E0E0]"><span class="text-[#5f5e5e]">ИНН / КПП:</span><span class="font-mono text-[#0F2439]">6317174776 / 631701001</span></div>
              <div class="flex justify-between py-1"><span class="text-[#5f5e5e]">Назначение:</span><span class="text-[#0F2439]">Добровольное пожертвование на уставную деятельность</span></div>
            </div>
            <button class="w-full py-3 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded hover:bg-[#1e3a5f] transition-all" onclick="closeModal('modal-donate')">
              Понятно
            </button>
          </div>
        </div>`;
    }

    if (html) {
      const container = document.createElement('div');
      container.innerHTML = html.trim();
      const el = container.firstElementChild;
      document.body.appendChild(el);
      bindModalEvents(el);
      return el;
    }
    return null;
  }

  function bindModalEvents(modal) {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });

    const closeBtns = modal.querySelectorAll('.modal-close-btn, [data-close-modal]');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => closeModal(modal.id));
    });
  }

  window.openModal = function (modalId) {
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = createDynamicModal(modalId);
    }
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function (modalId) {
    if (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('active');
        modal.classList.remove('open');
      }
    } else {
      document.querySelectorAll('.modal-overlay, .modal-backdrop, [id^="modal-"]').forEach(m => {
        m.classList.remove('active');
        m.classList.remove('open');
      });
    }

    // Always check if any modal is still active; if not, restore body scroll
    const anyActive = document.querySelector('.modal-overlay.active, .modal-overlay.open, [id^="modal-"].active, [id^="modal-"].open');
    if (!anyActive) {
      document.body.style.overflow = '';
    }
  };

  function initModals() {
    document.querySelectorAll('.modal-overlay, .modal-backdrop, [id^="modal-"]').forEach((modal) => {
      bindModalEvents(modal);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  /* ── 5. TOAST NOTIFICATIONS & FORMS ── */
  window.showToast = function (message) {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<span class="material-symbols-outlined text-[#C5A059]">check_circle</span><span>${message}</span>`;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  };

  function initForms() {
    document.querySelectorAll('form').forEach((form) => {
      const submitBtn = form.querySelector('button[type="submit"]');
      const consentCheckbox = form.querySelector('input[type="checkbox"][required]');

      if (consentCheckbox && submitBtn) {
        const updateSubmitState = () => {
          if (!consentCheckbox.checked) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
          } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          }
        };

        consentCheckbox.addEventListener('change', updateSubmitState);
        updateSubmitState();
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (consentCheckbox && !consentCheckbox.checked) {
          alert('Для отправки необходимо дать согласие на обработку персональных данных и принять условия соглашения.');
          return;
        }

        if (submitBtn) {
          const originalText = submitBtn.innerHTML;
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Отправка...';

          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            form.reset();

            if (consentCheckbox) {
              consentCheckbox.checked = true;
              if (submitBtn) submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }

            const parentModal = form.closest('.modal-overlay');
            if (parentModal) {
              closeModal(parentModal.id);
            }

            showToast('Заявка успешно отправлена! Дежурный юрист свяжется с вами.');
          }, 600);
        }
      });
    });
  }

  /* ── 6. SLEEK COOKIE BANNER (152-FZ / LOCALSTORAGE) ── */
  function initCookieBanner() {
    if (localStorage.getItem('cookieConsent') === 'true') {
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.className = 'fixed bottom-4 right-4 max-w-md z-50 p-4 bg-white/95 backdrop-blur-md rounded-lg border border-[#E0E0E0] shadow-2xl text-xs text-[#2C3E50] transition-all duration-500 ease-out translate-y-24 opacity-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3';
    banner.innerHTML = `
      <div class="leading-relaxed">
        Мы используем файлы cookie и аналитику для корректной работы сайта. Подробнее в нашей <a href="doc-viewer.html?doc=politika" target="_blank" class="underline text-[#0F2439] hover:text-[#C5A059] font-medium">Политике конфиденциальности</a>.
      </div>
      <button id="cookie-accept-btn" class="px-4 py-2 bg-[#0F2439] text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#1e3a5f] transition-all flex-shrink-0 shadow-sm">
        Принять
      </button>
    `;

    document.body.appendChild(banner);

    // Animate in
    setTimeout(() => {
      banner.classList.remove('translate-y-24', 'opacity-0');
    }, 400);

    const acceptBtn = banner.querySelector('#cookie-accept-btn');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'true');
        banner.classList.add('translate-y-24', 'opacity-0');
        setTimeout(() => {
          banner.remove();
        }, 500);
      });
    }
  }

  /* ── 7. ORGANIC FLOATING MESSENGER DOCK CAPSULE ── */
  function initFloatingMessengerWidget() {
    if (document.getElementById('floating-messengers')) return;

    const widget = document.createElement('div');
    widget.id = 'floating-messengers';
    widget.className = 'floating-messenger-capsule dock-left';
    widget.setAttribute('aria-label', 'Быстрая связь в мессенджерах');

    widget.innerHTML = `
      <span class="floating-messenger-label">Связь</span>

      <!-- MAX Messenger Group (Monochrome Neoclassical Medallion) -->
      <a href="https://max.ru" target="_blank" rel="noopener noreferrer" class="floating-messenger-btn btn-max" title="Группа в MAX">
        <svg class="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.6 1.4 4.9 3.6 6.4L4.5 21l3.9-1.2c1.1.4 2.3.7 3.6.7 5.5 0 10-3.8 10-8.5S17.5 3 12 3z"/>
          <path d="M8 14.5V9.5L12 12.5L16 9.5V14.5"/>
        </svg>
        <span class="messenger-tooltip">Группа в MAX</span>
      </a>

      <!-- Telegram Channel (Monochrome Neoclassical Medallion) -->
      <a href="https://t.me/yug_pravo" target="_blank" rel="noopener noreferrer" class="floating-messenger-btn btn-tg" title="Telegram-канал">
        <svg class="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 3.5L2.5 10.8c-.8.3-.8 1.1 0 1.4l4.9 1.5 1.8 5.6c.2.6.8.8 1.3.4l2.7-2.3 4.8 3.5c.7.5 1.6.2 1.8-.7l3.2-15.5c.2-.9-.6-1.5-1.5-1.2z"/>
          <path d="M9.2 13.7l8.8-7.7-6.8 8.8"/>
        </svg>
        <span class="messenger-tooltip">Telegram-канал</span>
      </a>

      <!-- VK Community (Monochrome Neoclassical Medallion) -->
      <a href="https://vk.com" target="_blank" rel="noopener noreferrer" class="floating-messenger-btn btn-vk" title="Группа ВКонтакте">
        <svg class="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3.5 7.5c.3 5.5 3.5 10 9 10 2 0 3.5-.8 4.2-2 .6-1 .5-2 1.8-1 1 1 1.5 1.8 3 1.8h1.8c.8 0 1.2-.5 1-1.3-.4-1.5-2.2-3.3-2.4-3.8-.4-.7 0-1.1.5-1.8 1.8-2.6 2.5-4 2.1-4.9-.3-.5-1-.5-1.8-.5h-2.2c-.7 0-1 .4-1.2.9-.8 1.8-2 3.6-2.8 3.6-.4 0-.6-.5-.6-1.5V7.5c0-1.2-.3-1.8-1.5-1.8-1 0-2 .4-2.6 1-.3.3 0 .6.4.6.8.2 1 .7 1 1.8v3.2c0 .8-.3 1-.7 1-.9 0-2.3-2.1-3.2-4.5-.3-.7-.6-1.3-1.4-1.3H4.1C3.3 7.5 3.2 8 3.5 7.5z"/>
        </svg>
        <span class="messenger-tooltip">Группа ВКонтакте</span>
      </a>
    `;

    document.body.appendChild(widget);

    // Smooth scroll reveal controller: shows when scrolled past 140px
    const handleScroll = () => {
      if (window.scrollY > 140) {
        widget.classList.add('is-visible');
      } else {
        widget.classList.remove('is-visible');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }
})();


// Global helper for Stop Commission initiative modal
window.openStopCommissionModal = function() {
  if (typeof openModal === 'function') {
    openModal('modal-stop-commission');
  }
};

// Global helper for Digital Law initiative modal
window.openDigitalLawModal = function() {
  if (typeof openModal === 'function') {
    openModal('modal-digital-law');
  }
};

// Global helper for JKH program modal
window.openJkhProgramModal = function() {
  if (typeof openModal === 'function') {
    openModal('modal-jkh-program');
  }
};

// Global helper for Dog Park initiative modal
window.openDogParkInitiativeModal = function() {
  if (typeof openModal === 'function') {
    openModal('modal-dog-park-initiative');
  }
};

// Global helper for Youth Legal program modal
window.openYouthLegalModal = function() {
  if (typeof openModal === 'function') {
    openModal('modal-youth-legal');
  }
};
