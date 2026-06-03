'use strict';

// ============================================================
// SPYFALL (ماناش هوني) — Game logic
// Location/role assignment, card reveal, and vote result.
// ============================================================

// ── Location database ────────────────────────────────────────
let spyfallDB = [];

function loadSpyfallLocations() {
    if (spyfallDB.length > 0) return; // already loaded

    fetch('../assets/images/spyfall_tunisia_100_locations.json', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { spyfallDB = d.spyfall_data || d || []; window.spyfallDB = spyfallDB; })
        .catch(() => { spyfallDB = []; window.spyfallDB = []; });
}

// ─────────────────────────────────────────────────────────────
// startSpyfallOffline — main entry point
// ─────────────────────────────────────────────────────────────
function startSpyfallOffline() {
    if (typeof _cleanupOnlineGameUI === 'function') _cleanupOnlineGameUI();
    saveSettings();

    const namesInput = Array.from(document.querySelectorAll('.player-input'))
        .map((inp, idx) => inp.value.trim() || `لاعب ${idx + 1}`);

    if (namesInput.length < 3) {
        document.getElementById('setup-error').innerText = 'يلزم 3 لاعبين على الأقل باش تلعب ماناش هوني.';
        _sfx.error();
        return;
    }
    if (!spyfallDB.length) {
        document.getElementById('setup-error').innerText = 'قائمة البلايص مازال ما تحملتش، جرب بعد شوية.';
        _sfx.error();
        return;
    }
    document.getElementById('setup-error').innerText = '';

    // Pick a random location
    const location = spyfallDB[Math.floor(Math.random() * spyfallDB.length)];
    const roles    = [...(location.roles_tn || [])].sort(() => 0.5 - Math.random());
    const spyIndex = Math.floor(Math.random() * namesInput.length);

    const players = namesInput.map((name, idx) => ({
        name,
        isSpy:        idx === spyIndex,
        locationName: location.location_tn,
        locationRole: roles[idx % Math.max(1, roles.length)] || 'حريف',
        eliminated:   false,
        viewedCard:   false,
    }));

    GameState.setPlayers(players);
    GameState.setRemainingTime(GameState.getTimerConfig() * 60);
    GameState.setCurrentRevealIndex(0);

    renderSingleCard();
    showScreen('reveal-screen');
    _sfx.gameStart();
}

// ─────────────────────────────────────────────────────────────
// handleSpyfallVote — called when players vote on the spy
// ─────────────────────────────────────────────────────────────
function handleSpyfallVote(votedPlayer) {
    const resultMsg = document.getElementById('result-message');
    const revealBox = document.getElementById('impostors-reveal');
    const nextBtn   = document.getElementById('next-round-btn');
    const players   = GameState.getPlayers();
    const spy       = players.find(p => p.isSpy);
    const caught    = votedPlayer.isSpy;

    if (caught) {
        triggerAnimation('win');
        resultMsg.innerText = `براڨو! ${votedPlayer.name} هو الspy.`;
    } else {
        triggerAnimation('lose');
        resultMsg.innerText = `غلط! الspy هرب. ${votedPlayer.name} خاطيه.`;
    }

    revealBox.innerHTML = `الspy: <strong style="color:var(--primary-color)">${_escapeHtml(spy?.name || '?')}</strong><br>البلاصة: <strong>${_escapeHtml(spy?.locationName || '?')}</strong>`;
    nextBtn.innerText = '🔄 عاود انده';
    nextBtn.onclick   = () => showScreen('setup-screen');

    showScreen('result-screen');
}

// ─────────────────────────────────────────────────────────────
// Expose as platform game contract
// ─────────────────────────────────────────────────────────────
window.SpyfallGame = {
    loadLocations:  loadSpyfallLocations,
    getDB:          () => spyfallDB,
    startOffline:   startSpyfallOffline,
    handleVote:     handleSpyfallVote,
};

// Backward-compatibility aliases
window.startSpyfallOffline = startSpyfallOffline;
window.handleSpyfallVote   = handleSpyfallVote;
window.spyfallDB           = spyfallDB;

// Kick off location loading immediately
loadSpyfallLocations();
