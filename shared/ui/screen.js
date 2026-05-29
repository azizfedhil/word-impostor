import _sfx from '../audio/sounds.js';

export function showScreen(id) {
    const next = document.getElementById(id);
    if (!next) return;
    const current = document.querySelector('.screen.active');
    if (current === next) {
        next.hidden = false;
        next.removeAttribute('aria-hidden');
        try { next.inert = false; } catch (_) {}
        return;
    }
    document.querySelectorAll('.screen').forEach((screen) => {
        const isNext = screen === next;
        if (isNext) screen.removeAttribute('aria-hidden');
        else screen.setAttribute('aria-hidden', 'true');
        try { screen.inert = !isNext; } catch (_) {}
        if (isNext) screen.hidden = false;
    });
    document.querySelectorAll('.screen.exiting').forEach((s) => s.classList.remove('exiting'));
    if (current) {
        current.classList.remove('active');
        current.classList.add('exiting');
        setTimeout(() => {
            current.classList.remove('exiting');
            if (!current.classList.contains('active')) current.hidden = true;
        }, 260);
    }
    requestAnimationFrame(() => next.classList.add('active'));
}

export function showToast(msg) {
    const t = document.getElementById('toast-msg');
    if (!t) return;
    t.innerText = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 3000);
}

export function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('hidden');
    requestAnimationFrame(() =>
        requestAnimationFrame(() => {
            m.classList.add('active');
            _sfx.modalOpen();
        })
    );
}

export function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('active');
    _sfx.modalClose();
    setTimeout(() => m.classList.add('hidden'), 300);
}

export function installScreenGlobals() {
    window.showScreen = showScreen;
    window._showToast = showToast;
    window.showToast = showToast;
}
