'use strict';
// ============================================================
// COUP (كول وبوّع) — game-specific initializer
// ============================================================
async function initCoup() {
    await initSharedSetup('coup');

    document.getElementById('coup-guide-from-setup-btn')?.classList.remove('hidden');

    document.getElementById('start-game-btn')?.addEventListener('click', () => {
        showScreen('online-setup-screen');
    });

    document.getElementById('coup-guide-btn')?.addEventListener('click', showCoupGuide);
    document.getElementById('coup-guide-from-setup-btn')?.addEventListener('click', showCoupGuide);
    document.getElementById('coup-guide-back-btn')?.addEventListener('click', () => {
        showScreen(coupState ? 'coup-screen' : 'setup-screen');
    });
}

document.addEventListener('DOMContentLoaded', initCoup);
