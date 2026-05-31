'use strict';

// ============================================================
// IMPOSTOR — Game logic
// All Impostor-specific state transitions, role assignment,
// word loading, and result handling live here.
// No DOM manipulation beyond what is strictly game-rendering.
// ============================================================

// ── Embedded fallback word list (used if fetch fails) ────────
const _embeddedRegular = [
    {word:'كسكسي',hint:'تقليدي'},{word:'لبلابي',hint:'شعبية'},{word:'بريك',hint:'مقرمش'},
    {word:'هريسة',hint:'حار'},{word:'ملوخية',hint:'مطبوخ'},{word:'مقرونة',hint:'شائعة'},
    {word:'بيتزا',hint:'مخبوزة'},{word:'جامع',hint:'راحة'},{word:'قهوة',hint:'جلوس'},
    {word:'شاطئ',hint:'ساحلي'},{word:'سوق',hint:'تجارة'},{word:'مدرسة',hint:'تعلم'},
    {word:'ملعب',hint:'رياضية'},{word:'هاتف',hint:'اتصال'},{word:'مفتاح',hint:'دخول'},
    {word:'لواج',hint:'خلاص'},{word:'مترو',hint:'تونس'},{word:'تاكسي',hint:'عداد'},
    {word:'شمس',hint:'مضيء'},{word:'قمر',hint:'سماوي'},{word:'بحر',hint:'مائي'},
    {word:'قطة',hint:'شعر'},{word:'كلب',hint:'حارس'},{word:'طبيب',hint:'رعاية'},
    {word:'معلم',hint:'تعليمي'},{word:'كرة قدم',hint:'شعبية'},{word:'تلفزيون',hint:'ترفيه'},
    {word:'مطعم',hint:'أكل'},{word:'مستشفى',hint:'صحة'},{word:'عروسة',hint:'احتفال'},
    {word:'ساعة',hint:'وقت'},{word:'سيارة',hint:'نقل'},{word:'قرطاج',hint:'أثري'},
    {word:'سيدي بوسعيد',hint:'ازرق'}
];

// ── Word databases (populated by loadWordLists) ──────────────
// These are module-level so they survive across rounds.
let regularWordsDB = [];
let adultWordsDB   = [];

// Track whether lists have been loaded to avoid re-fetching
let _wordListsLoaded = false;

/**
 * Load all word lists from the server.
 * Called once on init; falls back to embedded list on failure.
 * Populates the global wordsDB variable used by startImpostorOffline.
 */
function loadWordLists() {
    if (_wordListsLoaded) return;
    _wordListsLoaded = true;

    fetch('../assets/images/word_list.json', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { regularWordsDB = d; _syncWordsDB(); })
        .catch(() => { regularWordsDB = _embeddedRegular; _syncWordsDB(); });

    // Adult words come from a pre-decoded global set by adult_words_data.js
    if (window._adultWordsDecoded && window._adultWordsDecoded.length) {
        adultWordsDB = window._adultWordsDecoded;
    }
    // Also watch for late-loading adult word data
    const _origDefine = Object.getOwnPropertyDescriptor(window, '_adultWordsDecoded');
    if (!_origDefine) {
        Object.defineProperty(window, '_adultWordsDecoded', {
            set(val) {
                adultWordsDB = val || [];
                _syncWordsDB();
                delete window._adultWordsDecoded;
                window._adultWordsDecoded = val;
            },
            configurable: true,
        });
    }
}

function _syncWordsDB() {
    // Keep the old global wordsDB in sync for any legacy references
    window.regularWordsDB = regularWordsDB;
    window.adultWordsDB   = adultWordsDB;
    // Active DB depends on current language
    window.wordsDB = GameState.getLang() === 'x18' ? adultWordsDB : regularWordsDB;
}

function getWordsDB() {
    return GameState.getLang() === 'x18' ? adultWordsDB : regularWordsDB;
}

// ─────────────────────────────────────────────────────────────
// startImpostorOffline — main entry point
// Replaces the old startImpostorOffline() in shared.js
// ─────────────────────────────────────────────────────────────
function startImpostorOffline() {
    if (typeof _cleanupOnlineGameUI === 'function') _cleanupOnlineGameUI();
    saveSettings();

    const namesInput = Array.from(document.querySelectorAll('.player-input'))
        .map((inp, idx) => inp.value.trim() || `لاعب ${idx + 1}`);

    if (namesInput.length < 3) {
        document.getElementById('setup-error').innerText = 'يجب أن يكون هناك 3 لاعبين على الأقل.';
        _sfx.error();
        return;
    }

    const isRand    = document.getElementById('t-random')?.classList.contains('active') || false;
    let impCount    = isRand
        ? Math.floor(Math.random() * Math.floor(namesInput.length / 2)) + 1
        : GameState.getImpostorConfig();

    if (!isRand && impCount >= namesInput.length) {
        document.getElementById('setup-error').innerText = 'عدد الكذابين يجب أن يكون أقل من عدد اللاعبين.';
        _sfx.error();
        return;
    }

    const wordsDB = getWordsDB();
    if (wordsDB.length === 0) {
        document.getElementById('setup-error').innerText = 'جاري تحميل الكلمات، يرجى الانتظار والمحاولة مجدداً.';
        _sfx.error();
        return;
    }
    document.getElementById('setup-error').innerText = '';

    // Configure game modes from toggles
    GameState.setEliminationMode(document.getElementById('t-elimination')?.classList.contains('active') || false);
    GameState.setNoHintsMode(
        (document.getElementById('t-nohint')?.classList.contains('active') || false) ||
        GameState.getLang() === 'x18'
    );
    const allCorrectHints = document.getElementById('t-allhint')?.classList.contains('active') || false;

    // Build player list
    let players = namesInput.map(name => ({
        name,
        isImpostor: false,
        customHint: '',
        eliminated: false,
        viewedCard: false,
    }));

    // Pick word
    const wordObj = wordsDB[Math.floor(Math.random() * wordsDB.length)];
    GameState.setCurrentWordObj(wordObj);

    // Assign impostors
    const isChaosRound = (document.getElementById('t-chaos')?.classList.contains('active') || false)
        && Math.random() < 0.15;

    if (isChaosRound) {
        players.forEach(p => { p.isImpostor = true; });
    } else {
        const shuffled = [...Array(players.length).keys()].sort(() => 0.5 - Math.random());
        for (let i = 0; i < impCount; i++) players[shuffled[i]].isImpostor = true;
    }

    // Assign hints to impostors
    const impostorPlayers = players.filter(p => p.isImpostor);
    if (allCorrectHints) {
        impostorPlayers.forEach(p => { p.customHint = wordObj.hint; });
    } else if (impostorPlayers.length <= 1) {
        if (impostorPlayers.length === 1) impostorPlayers[0].customHint = wordObj.hint;
    } else {
        const lucky     = Math.floor(Math.random() * impostorPlayers.length);
        const wrongHints = wordsDB
            .filter(w => w.word !== wordObj.word)
            .map(w => w.hint)
            .sort(() => 0.5 - Math.random());
        let hi = 0;
        for (let i = 0; i < impostorPlayers.length; i++) {
            impostorPlayers[i].customHint = (i === lucky)
                ? wordObj.hint
                : (wrongHints[hi % wrongHints.length] || '');
            hi++;
        }
    }

    // Commit state
    GameState.setPlayers(players);
    GameState.setRemainingTime(GameState.getTimerConfig() * 60);
    GameState.setCurrentRevealIndex(0);

    renderSingleCard();
    showScreen('reveal-screen');
    _sfx.gameStart();
}

// ─────────────────────────────────────────────────────────────
// handleImpostorVote — called from goToVoting → handleVote
// ─────────────────────────────────────────────────────────────
function handleImpostorVote(votedPlayer) {
    const resultMsg = document.getElementById('result-message');
    const revealBox = document.getElementById('impostors-reveal');
    const nextBtn   = document.getElementById('next-round-btn');
    const trans     = i18n[GameState.getLang()];
    const players   = GameState.getPlayers();
    revealBox.innerHTML = '';

    if (!GameState.isEliminationMode()) {
        // Simple mode: vote once, show result
        if (votedPlayer.isImpostor) {
            triggerAnimation('win');
            resultMsg.innerText = trans.correct_guess.replace('{name}', votedPlayer.name);
        } else {
            triggerAnimation('lose');
            resultMsg.innerText = trans.wrong_guess.replace('{name}', votedPlayer.name);
        }
        const allImps = players.filter(p => p.isImpostor).map(p => _escapeHtml(p.name)).join(' و ');
        revealBox.innerHTML = `${trans.impostors_were}<br><strong style="color:var(--primary-color);">${allImps}</strong><br><br>${trans.word_was} <strong>${_escapeHtml(GameState.getCurrentWordObj().word)}</strong>`;
        nextBtn.innerText = trans.next_round_btn;
        nextBtn.onclick   = () => showScreen('setup-screen');
    } else {
        // Elimination mode: eliminate one player, continue if impostors remain
        votedPlayer.eliminated = true;
        const rI = players.filter(p => p.isImpostor && !p.eliminated);
        const rR = players.filter(p => !p.isImpostor && !p.eliminated);

        if (rI.length === 0) {
            triggerAnimation('win');
            resultMsg.innerText = trans.all_impostors_dead;
            revealBox.innerHTML = `${trans.word_was} <strong>${_escapeHtml(GameState.getCurrentWordObj().word)}</strong>`;
            nextBtn.innerText = trans.next_round_btn;
            nextBtn.onclick   = () => showScreen('setup-screen');
        } else if (rI.length >= rR.length) {
            triggerAnimation('lose');
            resultMsg.innerText = trans.impostors_win;
            const allImps = players.filter(p => p.isImpostor).map(p => _escapeHtml(p.name)).join(' و ');
            revealBox.innerHTML = `${trans.impostors_were}<br><strong style="color:var(--primary-color);">${allImps}</strong><br><br>${trans.word_was} <strong>${_escapeHtml(GameState.getCurrentWordObj().word)}</strong>`;
            nextBtn.innerText = trans.next_round_btn;
            nextBtn.onclick   = () => showScreen('setup-screen');
        } else {
            if (!votedPlayer.isImpostor) triggerAnimation('lose');
            resultMsg.innerText = trans.eliminated_msg.replace('{name}', votedPlayer.name);
            revealBox.innerHTML = trans.elimination_cliffhanger;
            nextBtn.innerText   = trans.continue_discussion;
            nextBtn.onclick     = () => {
                GameState.setRemainingTime(60);
                const alive   = players.filter(p => !p.eliminated);
                const starter = alive[Math.floor(Math.random() * alive.length)];
                document.getElementById('starter-player').innerText =
                    `${trans.starter_continue}${starter.name}`;
                showScreen('timer-screen');
                updateTimerDisplay();
                const interval = setInterval(() => {
                    GameState.setRemainingTime(GameState.getRemainingTime() - 1);
                    updateTimerDisplay();
                    if (GameState.getRemainingTime() <= 0) {
                        clearInterval(interval);
                        GameState.setTimerInterval(null);
                        goToVoting();
                    }
                }, 1000);
                GameState.setTimerInterval(interval);
            };
        }
    }
    showScreen('result-screen');
}

// ─────────────────────────────────────────────────────────────
// Expose as platform game contract
// ─────────────────────────────────────────────────────────────
window.ImpostorGame = {
    loadWordLists,
    getWordsDB,
    startOffline: startImpostorOffline,
    handleVote:   handleImpostorVote,
};

// Backward-compatibility aliases (used by impostor_init.js and online.js)
window.startImpostorOffline = startImpostorOffline;
window.regularWordsDB       = regularWordsDB;
window.adultWordsDB         = adultWordsDB;
window.wordsDB              = regularWordsDB; // default; updated after load
