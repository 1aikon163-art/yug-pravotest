/**
 * ЮГ-ПРАВО — Shared JavaScript
 * Scroll reveal, counters, particles, nav, theme, modals
 */

/* ========================================
   SCROLL PROGRESS
   ======================================== */
(function() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        bar.style.width = (scrollTop / docHeight * 100) + '%';
    }, { passive: true });
})();

/* ========================================
   HEADER SCROLL EFFECT
   ======================================== */
(function() {
    const header = document.getElementById('main-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
})();

/* ========================================
   SCROLL REVEAL (IntersectionObserver)
   ======================================== */
(function() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right')
        .forEach(el => observer.observe(el));
})();

/* ========================================
   ANIMATED COUNTERS
   ======================================== */
function animateCounter(el, target, duration = 1800) {
    const start = performance.now();
    const isDecimal = target % 1 !== 0;
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const value = eased * target;
        el.textContent = prefix + (isDecimal
            ? value.toFixed(1)
            : Math.round(value).toLocaleString('ru-RU')) + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

(function() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseFloat(el.dataset.counter);
                animateCounter(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
})();

/* ========================================
   MOBILE NAV DRAWER
   ======================================== */
(function() {
    const mobileToggle = document.querySelectorAll('.mobile-toggle');
    const drawer = document.getElementById('nav-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const closeBtn = document.getElementById('drawer-close');

    function openDrawer() {
        drawer?.classList.add('open');
        overlay?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        drawer?.classList.remove('open');
        overlay?.classList.remove('open');
        document.body.style.overflow = '';
    }

    mobileToggle.forEach(btn => btn.addEventListener('click', openDrawer));
    overlay?.addEventListener('click', closeDrawer);
    closeBtn?.addEventListener('click', closeDrawer);

    // Close drawer on link click
    drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
})();

/* ========================================
   CANVAS PARTICLE FIELD
   ======================================== */
function initParticles(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, particles = [], mouse = { x: -9999, y: -9999 };
    const COUNT = 60;
    const MAX_DIST = 120;

    function resize() {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 2 + 1,
            alpha: Math.random() * 0.4 + 0.1
        };
    }

    function init() {
        resize();
        particles = Array.from({ length: COUNT }, createParticle);
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            // Mouse repulsion
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                p.vx += dx / dist * 0.3;
                p.vy += dy / dist * 0.3;
            }

            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.99;
            p.vy *= 0.99;

            // Wrap
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(197, 160, 89, ${p.alpha})`;
            ctx.fill();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i], b = particles[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_DIST) {
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(175, 200, 240, ${(1 - dist / MAX_DIST) * 0.15})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(draw);
    }

    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    window.addEventListener('resize', resize);
    init();
    draw();
}

/* ========================================
   PARALLAX EFFECT
   ======================================== */
(function() {
    const parallaxEls = document.querySelectorAll('[data-parallax]');
    if (!parallaxEls.length) return;

    window.addEventListener('scroll', () => {
        parallaxEls.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.3;
            const rect = el.closest('.parallax-section')?.getBoundingClientRect();
            if (!rect) return;
            const offset = rect.top * speed;
            el.style.transform = `translateY(${offset}px)`;
        });
    }, { passive: true });
})();

/* ========================================
   TILT CARD EFFECT
   ======================================== */
(function() {
    document.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rotateX = (y - cy) / cy * -6;
            const rotateY = (x - cx) / cx * 6;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
})();

/* ========================================
   TOAST NOTIFICATIONS
   ======================================== */
window.showToast = function(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const icons = { success: '✓', info: 'ℹ', error: '✕' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
};

/* ========================================
   MODAL HELPERS
   ======================================== */
window.openModal = function(id) {
    if (typeof window.openModalInternal === 'function') {
        window.openModalInternal(id);
        return;
    }
    let modal = document.getElementById(id);
    if (!modal && typeof createDynamicModal === 'function') {
        modal = createDynamicModal(id);
    }
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('open');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = function(id) {
    if (id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('open');
            modal.classList.remove('active');
        }
    } else {
        document.querySelectorAll('.modal-overlay, .modal-backdrop, [id^="modal-"]').forEach(m => {
            m.classList.remove('open');
            m.classList.remove('active');
        });
    }
    const anyActive = document.querySelector('.modal-overlay.active, .modal-overlay.open, .modal-backdrop.open, [id^="modal-"].active, [id^="modal-"].open');
    if (!anyActive) {
        document.body.style.overflow = '';
    }
};

// Close modal on backdrop click
document.querySelectorAll('.modal-backdrop, .modal-overlay').forEach(backdrop => {
    backdrop.addEventListener('click', e => {
        if (e.target === backdrop) {
            window.closeModal(backdrop.id);
        }
    });
});

/* ========================================
   ACTIVE NAV LINK
   ======================================== */
(function() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .nav-drawer-links a').forEach(a => {
        const href = a.getAttribute('href')?.split('/').pop();
        if (href === path || (path === '' && href === 'index.html') || (path === 'index.html' && href === '')) {
            a.classList.add('active');
        }
    });
})();

/* ========================================
   TABS
   ======================================== */
(function() {
    document.querySelectorAll('.tabs-nav').forEach(nav => {
        nav.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.tab;
                const container = nav.closest('.tabs-container') || document;

                // Toggle buttons
                nav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Toggle panels
                container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                container.querySelector(`#${target}`)?.classList.add('active');
            });
        });
    });
})();

/* ========================================
   SEARCH FILTER
   ======================================== */
window.filterItems = function(inputId, targetClass) {
    const query = document.getElementById(inputId)?.value.toLowerCase() || '';
    document.querySelectorAll('.' + targetClass).forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? '' : 'none';
    });
};

/* ========================================
   FORM PHONE MASK
   ======================================== */
(function() {
    document.querySelectorAll('input[data-phone]').forEach(input => {
        input.addEventListener('input', e => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.startsWith('8')) val = '7' + val.slice(1);
            if (!val.startsWith('7')) val = '7' + val;
            val = val.slice(0, 11);
            let formatted = '+7';
            if (val.length > 1) formatted += ' (' + val.slice(1, 4);
            if (val.length >= 4) formatted += ') ' + val.slice(4, 7);
            if (val.length >= 7) formatted += '-' + val.slice(7, 9);
            if (val.length >= 9) formatted += '-' + val.slice(9, 11);
            e.target.value = formatted;
        });
    });
})();

/* ========================================
   COOKIE BANNER (РКН compliance)
   ======================================== */
(function() {
    if (localStorage.getItem('cookies-accepted')) return;
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
        <div style="position:fixed;bottom:0;left:0;right:0;z-index:999;background:var(--primary);color:rgba(255,255,255,0.9);padding:1rem clamp(1rem,4vw,4rem);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;font-size:0.875rem;border-top:2px solid rgba(197,160,89,0.3);">
            <div style="max-width:700px;line-height:1.5;">
                🍪 Мы используем файлы cookie для корректной работы сайта и аналитики. Продолжая использование сайта, вы соглашаетесь с 
                <a href="privacy.html" style="color:rgba(197,160,89,0.9);text-decoration:underline;">Политикой конфиденциальности</a> (152-ФЗ).
            </div>
            <button id="accept-cookies" style="background:var(--gold);color:white;border:none;border-radius:4px;padding:0.625rem 1.5rem;font-size:0.8rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;white-space:nowrap;">
                Принять
            </button>
        </div>
    `;
    document.body.appendChild(banner);
    document.getElementById('accept-cookies')?.addEventListener('click', () => {
        localStorage.setItem('cookies-accepted', '1');
        banner.remove();
    });
})();
