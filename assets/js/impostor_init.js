'use strict';
// ============================================================
// IMPOSTOR — game-specific initializer
// ============================================================
async function initImpostor() {
    await initSharedSetup('impostor');

    document.getElementById('coup-guide-from-setup-btn')?.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', initImpostor);
