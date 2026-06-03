'use strict';
// ============================================================
// CHKOBBA (شكبّة) — game-specific initializer
// ============================================================
async function initChkobba() {
    await initSharedSetup('chkobba');

    document.getElementById('start-game-btn')?.addEventListener('click', () => {
        showScreen('online-setup-screen');
    });

    document.getElementById('coup-guide-from-setup-btn')?.classList.add('hidden');

    document.getElementById('chkobba-menu-btn')?.addEventListener('click', () => {
        document.getElementById('chkobba-menu-dropdown')?.classList.toggle('hidden');
    });

    document.getElementById('chkobba-back-to-main-btn')?.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    document.getElementById('chkobba-leave-btn')?.addEventListener('click', () => {
        if (confirm('متأكد تحب تخرج؟')) {
            if (typeof _leaveRoom === 'function') _leaveRoom();
            showScreen('online-setup-screen');
        }
    });

    document.getElementById('chkobba-reconnect-btn')?.addEventListener('click', () => {
        showScreen('online-setup-screen');
    });

    document.getElementById('chkobba-voice-toggle-btn')?.addEventListener('click', () => {
        if (typeof toggleVoice === 'function') toggleVoice();
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.chkobba-top-controls')) {
            document.getElementById('chkobba-menu-dropdown')?.classList.add('hidden');
        }
    });
}

document.addEventListener('DOMContentLoaded', initChkobba);
