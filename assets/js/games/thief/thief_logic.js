'use strict';

// ============================================================
// THIEF (سارق، حاكم، جلّاد) — Game logic
// Role assignment, card reveal, and judgement result.
// ============================================================

// ── Role definitions (single source of truth) ───────────────
const thiefRoles = [
    { key: 'thief',       label: 'سارق',  icon: '🗝️', desc: 'إنت السارق. حاول ما يفيقوش بيك.' },
    { key: 'judge',       label: 'حاكم',  icon: '⚖️', desc: 'إنت الحاكم. بعد النقاش تختار شكون السارق.' },
    { key: 'executioner', label: 'جلّاد', icon: '🪓', desc: 'إنت الجلّاد. تستنى حكم الحاكم.' },
];
const thiefWitnessRole = { key: 'witness', label: 'شاهد', icon: '👁️', desc: 'إنت شاهد. عاون الحاكم بالكلام وما تكشفش برشة.' };

/**
 * Returns the role meta object for a given role key.
 * Used by online.js (via window.ThiefGame.roleMeta) to render cards.
 */
function thiefRoleMeta(role) {
    return [...thiefRoles, thiefWitnessRole].find(r => r.key === role) || thiefWitnessRole;
}

// ─────────────────────────────────────────────────────────────
// startThiefOffline — main entry point
// ─────────────────────────────────────────────────────────────
function startThiefOffline() {
    if (typeof _cleanupOnlineGameUI === 'function') _cleanupOnlineGameUI();
    saveSettings();

    const namesInput = Array.from(document.querySelectorAll('.player-input'))
        .map((inp, idx) => inp.value.trim() || `لاعب ${idx + 1}`);

    if (namesInput.length < 3) {
        document.getElementById('setup-error').innerText = 'يلزم 3 لاعبين على الأقل: سارق، حاكم، وجلّاد.';
        _sfx.error();
        return;
    }
    document.getElementById('setup-error').innerText = '';

    // Shuffle names and build extended role list (3 fixed + witnesses for extras)
    const shuffled    = [...namesInput].sort(() => 0.5 - Math.random());
    const extraCount  = Math.max(0, shuffled.length - 3);
    const extendedRoles = [
        ...thiefRoles,
        ...Array(extraCount).fill(null).map(() => ({ ...thiefWitnessRole })),
    ].sort(() => 0.5 - Math.random());

    const players = shuffled.map((name, idx) => {
        const role = extendedRoles[idx];
        return {
            name,
            role:      role.key,
            roleLabel: role.label,
            roleIcon:  role.icon,
            roleDesc:  role.desc,
            eliminated: false,
            viewedCard: false,
        };
    });

    GameState.setPlayers(players);
    GameState.setRemainingTime(GameState.getTimerConfig() * 60);
    GameState.setCurrentRevealIndex(0);

    renderSingleCard();
    showScreen('reveal-screen');
    _sfx.gameStart();
}

// ─────────────────────────────────────────────────────────────
// handleThiefJudgement — called when the judge votes
// ─────────────────────────────────────────────────────────────
function handleThiefJudgement(votedPlayer) {
    const resultMsg = document.getElementById('result-message');
    const revealBox = document.getElementById('impostors-reveal');
    const nextBtn   = document.getElementById('next-round-btn');
    const players   = GameState.getPlayers();

    const thief       = players.find(p => p.role === 'thief');
    const judge       = players.find(p => p.role === 'judge');
    const executioner = players.find(p => p.role === 'executioner');
    const caught      = votedPlayer.role === 'thief';

    if (caught) {
        triggerAnimation('win');
        resultMsg.innerText = `الحاكم فقسها! ${votedPlayer.name} هو السارق.`;
    } else {
        triggerAnimation('lose');
        resultMsg.innerText = `السارق هرب! ${votedPlayer.name} طلع خاطيه.`;
    }

    revealBox.innerHTML = `السارق: <strong>${_escapeHtml(thief?.name || '?')}</strong><br>الحاكم: <strong>${_escapeHtml(judge?.name || '?')}</strong><br>الجلّاد: <strong>${_escapeHtml(executioner?.name || '?')}</strong>`;
    nextBtn.innerText = '🔄 عاود انده';
    nextBtn.onclick   = () => showScreen('setup-screen');

    showScreen('result-screen');
}

// ─────────────────────────────────────────────────────────────
// Expose as platform game contract
// ─────────────────────────────────────────────────────────────
window.ThiefGame = {
    roles:          thiefRoles,
    witnessRole:    thiefWitnessRole,
    roleMeta:       thiefRoleMeta,
    startOffline:   startThiefOffline,
    handleJudgement: handleThiefJudgement,
};

// Backward-compatibility aliases used by thief_init.js and shared.js
window.startThiefOffline      = startThiefOffline;
window.handleThiefJudgement   = handleThiefJudgement;
window.thiefRoles             = thiefRoles;
