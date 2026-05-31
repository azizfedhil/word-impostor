'use strict';
// ============================================================
// SPYFALL (ماناش هوني) — game-specific initializer
// ============================================================
async function initSpyfall() {
    await initSharedSetup('spyfall');

    document.getElementById('start-game-btn')?.addEventListener('click', startSpyfallOffline);
    document.getElementById('coup-guide-from-setup-btn')?.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', initSpyfall);
