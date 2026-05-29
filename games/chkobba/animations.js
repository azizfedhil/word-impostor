/**
 * Chkobba presentation animations (no gameplay logic).
 */
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const DEFAULT_FLY_MS = 300;

export function prefersReducedMotion() {
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_) {
        return false;
    }
}

function getFlyLayer() {
    return document.getElementById('chkobba-deal-layer');
}

export function cancelFlyLayer() {
    const layer = getFlyLayer();
    if (layer) layer.innerHTML = '';
}

function centerRect(el) {
    const r = el.getBoundingClientRect();
    return {
        left: r.left + r.width / 2,
        top: r.top + r.height / 2,
        width: r.width,
        height: r.height,
    };
}

/**
 * @param {object} opts
 * @param {{ left: number, top: number, width?: number, height?: number }} opts.fromRect center-based
 * @param {{ left: number, top: number }} opts.toRect center-based
 */
export function flyCard(opts = {}) {
    const {
        fromRect,
        toRect,
        imageSrc = '',
        duration = DEFAULT_FLY_MS,
        onDone,
    } = opts;

    if (prefersReducedMotion() || !fromRect || !toRect) {
        onDone?.();
        return Promise.resolve();
    }

    const layer = getFlyLayer();
    if (!layer) {
        onDone?.();
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const flyer = document.createElement('div');
        flyer.className = 'chkobba-fly-card';
        flyer.style.left = `${fromRect.left}px`;
        flyer.style.top = `${fromRect.top}px`;
        flyer.style.transitionDuration = `${duration}ms`;
        if (imageSrc) {
            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = '';
            flyer.appendChild(img);
        }
        layer.appendChild(flyer);

        const done = () => {
            flyer.remove();
            onDone?.();
            resolve();
        };

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                flyer.classList.add('is-flying');
                flyer.style.left = `${toRect.left}px`;
                flyer.style.top = `${toRect.top}px`;
            });
        });

        flyer.addEventListener('transitionend', done, { once: true });
        setTimeout(done, duration + 80);
    });
}

export function flyCardFromElement(fromEl, toEl, opts = {}) {
    if (!fromEl || !toEl) {
        opts.onDone?.();
        return Promise.resolve();
    }
    const img = fromEl.querySelector('img');
    const from = centerRect(fromEl);
    const to = centerRect(toEl);
    return flyCard({
        ...opts,
        imageSrc: img?.src || opts.imageSrc || '',
        fromRect: from,
        toRect: to,
    });
}

/**
 * @param {HTMLElement[]} fromEls
 * @param {HTMLElement} toEl
 */
export function flyCardsStagger(fromEls, toEl, opts = {}) {
    const stagger = opts.staggerMs ?? 50;
    const maxWait = opts.maxWaitMs ?? 450;
    const list = (fromEls || []).filter(Boolean);

    if (prefersReducedMotion() || !list.length || !toEl) {
        opts.onDone?.();
        return Promise.resolve();
    }

    const to = centerRect(toEl);
    let i = 0;

    return new Promise((resolve) => {
        const finish = () => {
            opts.onDone?.();
            resolve();
        };
        const timeout = setTimeout(finish, maxWait);

        const flyNext = () => {
            if (i >= list.length) {
                clearTimeout(timeout);
                setTimeout(finish, DEFAULT_FLY_MS);
                return;
            }
            const el = list[i++];
            const img = el.querySelector('img');
            const from = centerRect(el);
            flyCard({
                imageSrc: img?.src || '',
                fromRect: from,
                toRect: to,
                duration: opts.duration ?? DEFAULT_FLY_MS,
            }).then(flyNext);
        };
        flyNext();
    });
}

export function createDragGhost(fromEl) {
    if (!fromEl) return null;
    const img = fromEl.querySelector('img');
    const ghost = document.createElement('div');
    ghost.className = 'chkobba-drag-ghost';
    const ghostImg = document.createElement('img');
    ghostImg.src = img?.src || '';
    ghostImg.alt = '';
    ghost.appendChild(ghostImg);
    document.body.appendChild(ghost);
    return ghost;
}

const CELEBRATE_COPY = {
    chkobba: { label: 'شكبّة!', sub: 'CHKOBBA!' },
    berria: { label: 'السبعة الحية!', sub: '7 ♦' },
};

export function celebrate({ type = 'chkobba', anchorRect = null, duration = 1400 } = {}) {
    if (prefersReducedMotion()) return;

    const copy = CELEBRATE_COPY[type] || CELEBRATE_COPY.chkobba;
    const overlay = document.createElement('div');
    overlay.className = `chkobba-celebrate-overlay type-${type}`;
    overlay.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('div');
    inner.className = 'chkobba-celebrate-inner';

    const card3d = document.createElement('div');
    card3d.className = 'chkobba-celebrate-card-3d';
    card3d.innerHTML = '<div class="chkobba-celebrate-card-face"></div>';

    const label = document.createElement('div');
    label.className = 'chkobba-celebrate-label';
    label.innerHTML = `<strong>${copy.label}</strong><span>${copy.sub}</span>`;

    inner.appendChild(card3d);
    inner.appendChild(label);
    overlay.appendChild(inner);
    document.body.appendChild(overlay);

    if (typeof window._sfx !== 'undefined') {
        try {
            window._sfx.win();
        } catch (_) {}
    }

    requestAnimationFrame(() => overlay.classList.add('is-active'));

    const remove = () => {
        overlay.classList.add('is-leaving');
        setTimeout(() => overlay.remove(), 280);
    };
    setTimeout(remove, Math.min(duration, 1500));
}

export function pulseCapturePile() {
    const pile = document.getElementById('chkobba-my-capture-pile');
    if (!pile || prefersReducedMotion()) return;
    pile.classList.remove('is-pulse');
    void pile.offsetWidth;
    pile.classList.add('is-pulse');
    setTimeout(() => pile.classList.remove('is-pulse'), 500);
}

export function markCardLanding(cardEl) {
    if (!cardEl || prefersReducedMotion()) return;
    cardEl.classList.add('is-landing');
    setTimeout(() => cardEl.classList.remove('is-landing'), 220);
}

const ChkobbaAnim = {
    prefersReducedMotion,
    cancelFlyLayer,
    flyCard,
    flyCardFromElement,
    flyCardsStagger,
    createDragGhost,
    celebrate,
    pulseCapturePile,
    markCardLanding,
    EASE,
    DEFAULT_FLY_MS,
};

export default ChkobbaAnim;

if (typeof window !== 'undefined') {
    window.ChkobbaAnim = ChkobbaAnim;
}
