'use strict';
// ============================================================
// THIEF (سارق، حاكم، جلّاد) — game-specific initializer
// ============================================================
async function initHakem() {
    await initSharedSetup('thief');

    document.getElementById('start-game-btn')?.addEventListener('click', startThiefOffline);
    document.getElementById('coup-guide-from-setup-btn')?.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', initHakem);
