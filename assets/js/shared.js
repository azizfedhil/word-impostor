'use strict';

// ============================================================
// TRANSLATIONS
// ============================================================
const i18n = {
    tn: {
        title:"🕵️‍♂️ شكونو هو؟", settings_title:"ريڨلاج الطرح", players_label:"👥 اساميكم:",
        add_player_btn:"➕ زيد واحد اخر", impostors_label:"🎭 قداش من كذاب", timer_label:"⏱️ وقت الطرح",
        advanced_btn:"🔧 زيد بربش", adv_random:"🎲 كذابين على كيف اللعبة", adv_chaos:"😈 خلوضها",
        adv_elimination:"⚔️ نقص بالواحد بالواحد", adv_nohint:"🙈 سبورة كحلة مع الكذاب",
        adv_allhint:"💡 الكذابين الكل ياخذو نفس التلميح", start_btn:"🚀 انافا",
        reset_confirm:"متأكد تحب تفسّخ الأسامي الكل وترجّع كل شي كيما كان؟",
        reveal_title:"🃏 شكون شنية", reveal_instructions:"اقعد نازل على الكارتة باش تعرف دورك، كي تسيبها تعاود تدور.",
        reveal_player_prefix:"كارطتك يا ", discussion_title:"💬 وقت التقطييع والترييش",
        vote_btn:"🗳️ سكر عليا، عرفنا البلعوط", voting_title:"🗳️ الفرز", who_impostor:"شكونو البلعوط؟",
        result_title:"🏆 شكون طلع؟", next_round_btn:"🔄 عاود انده",
        info_title:"ℹ️ معلومة", close_btn:"فهمت", player_placeholder:"اسم اللاعب",
        card_of:"الكارتة متاع ", pass_to:"هاك عرفت، عدّي للي بعدك ",
        all_seen:"الناس الكل شافت.. ابدا العداد! 🚦", starter_is:"🗣️ الي يبدا يتكلم هو: ",
        starter_continue:"🗣️ الي يكمل يتكلم هو: ", impostor_role:"أنت الكذاب 🤫",
        citizen_role:"جوّك باهي 🤠", hint_label:"التلميح:", word_label:"الكلمة:",
        correct_guess:"يعطيك الصحة! 🎉 {name} طلع هو البلعوط.",
        wrong_guess:"غالط! ❌ {name} خاطيه مسكين.", impostors_were:"البلعوط (البلعوطين):",
        word_was:"الكلمة طلعت:", all_impostors_dead:"خرجتو الكذابين الكل! 🎉 المواطنين ربحو!",
        impostors_win:"الكذابين غلبوكم وسيطرو عالطرح! 😈", eliminated_msg:"طردنا {name} مالطرح!",
        elimination_cliffhanger:"أما الطرح مازال ما وفاش... زعما طلع هو الكذاب ولا؟ مانا قايلينلكم شي! 🤐",
        continue_discussion:"⏱️ ارجعو قطعو وريشو (دقيقة بركا)",
        chkobba_scores:"السكور",
        chkobba_deck:"كوارط مازالت في الكومة",
        chkobba_round:"رقم الطرح الحالي",
        chkobba_winner:"ربح الطرح!",
        chkobba_target_points:"وصلنا لـ",
        chkobba_tournament:"تورنوا"
    },
    x18: {
        title:"🕵️‍♂️ شبيك تحشي فيه؟", settings_title:"ركّح زبورك للطرح", players_label:"👥 اساميكم:",
        add_player_btn:"➕ زيد قحبون آخر", impostors_label:"🎭 قداش من بلعوط؟", timer_label:"⏱️ وقت الطرح",
        advanced_btn:"🔧 زيد بعبص", adv_random:"🎲 اللعبة تنيك روحها أمور كذابين",
        adv_chaos:"😈 نيك حل فترية", adv_elimination:"⚔️ نيك كل واحد وحدو",
        adv_nohint:"🙈 الكذاب عصبة ليه", adv_allhint:"💡 الكذابين الكل ياخذو نفس التلميح",
        start_btn:"🚀 قدّم نيّك", reset_confirm:"متأكد تحب تفسّخ الأسامي الكل وترجّع كل شي كيما كان؟",
        reveal_title:"🃏 شكون شنية", reveal_instructions:"اقعد بعبص في الكارتة باش تعرف دورك، كي تسيبو يرجع عليك",
        reveal_player_prefix:"نمامتك يا", discussion_title:"💬 وقت تنيكلها أمها",
        vote_btn:"🗳️ سكر على زبي، عرفنا البلعوط", voting_title:"🗳️ الفرز", who_impostor:"شكونو هالزبور؟",
        result_title:"🏆 شكون طلع؟", next_round_btn:"🔄 عاود انده",
        info_title:"ℹ️ معلومة", close_btn:"عصبة ليك", player_placeholder:"اسم اللاعب",
        card_of:"الكارتة متاع ", pass_to:"ماك عرفت تحرك، نيك عدي للي بعدك ",
        all_seen:"الناس الكل شافت.. ابدا العداد! 🚦", starter_is:"🗣️ الي يبدا يتكلم هو: ",
        starter_continue:"🗣️ الي يكمل يتكلم هو: ", impostor_role:"يعطك عصبة راك كذاب 🤫",
        citizen_role:"هاك حشيتو 🤠", hint_label:"التلميح:", word_label:"الكلمة:",
        correct_guess:"اوه على الزبي هاك طلعتو! 🎉 {name} طلع هو البلعوط.",
        wrong_guess:"يعطك عصبة راك غالط! ❌ {name} خاطيه مسكين.", impostors_were:"البلعوط (البلعوطين):",
        word_was:"الكلمة طلعت:", all_impostors_dead:"خرجتو الكذابين الكل! 🎉 المواطنين ربحو!",
        impostors_win:"الكذابين غلبوكم وسيطرو عالطرح! 😈", eliminated_msg:"طردنا {name} مالطرح!",
        elimination_cliffhanger:"أما الطرح مازال ما وفاش... زعما طلع هو الكذاب ولا؟ مانا قايلينلكم شي! 🤐",
        continue_discussion:"⏱️ ارجعو قطعو وريشو (دقيقة بركا)"
    }
};

const infoDescriptions = {
    random: { tn:"اللعبة باش تختار قداش من كذاب وحدها زهر، من غير ما تاخو بالرقم الي حطيتو (الماكس شطر الملاعبية).", x18:"اللعبة باش تختار قداش من منيكين وحدها زهر، من غير ما تاخو بالرقم الي حطيتو (الماكس شطر الملاعبية)." },
    chaos: { tn:"فما نسبة صغيرة (حكاية 15%) الي الطرح هذا الناس الكل تطلع كذابة! خلوضة كبيرة.", x18:"فما نسبة صغيرة (حكاية 15%) الي الطرح هذا الناس الكل تطلع كذابة! خلوضة كبيرة." },
    elimination: { tn:"الي نصوتولو يخرج. كان طلع خاطيه، الطرح يكمل والكرونو يرجع يخدم حتى نخرجو الكذابين الكل ولا يغلبونا.", x18:"الي تنيكو يخرج. كان طلع خاطيه، الطرح يكمل والكرونو يرجع يخدم حتى نخرجو البلعوطين الكل ولا يغلبونا." },
    nohint: { tn:"الكذاب ما يجيه حتى تلميح في الكارتة متاعو، سبورة كحلة! يلزمو يدبر راسو ويفهم الكلمة من كلام لخرين.", x18:"الكذاب ما ينيك حتى عصبة من اللعبة، لا تلميح لا زبي. يلزمو يدبر راسو ويفهم الكلمة من كلام لخرين." },
    allhint: { tn:"كان فما برشا كذابين، الكلهم باش يجيهم التلميح الصحيح متاع الكلمة، باش يصعبو الطرح على العاديين.", x18:"كان فما برشا كذابين، الكلهم باش يجيهم التلميح الصحيح متاع الكلمة، باش يصعبو الطرح على العاديين." }
};

// ============================================================
// GLOBAL STATE
// ============================================================
let currentLang = 'tn';
let x18Unlocked = false;
let wordsDB = [], regularWordsDB = [], adultWordsDB = [], spyfallDB = [];
let players = [], currentWordObj = null;
let timerInterval = null, remainingTime = 0;
let isEliminationMode = false, noHintsMode = false;
let currentRevealIndex = 0;
let impostorConfig = 1, timerConfig = 3, playerCount = 0;
const X18_REMEMBER_KEY = 'dakheel_x18_unlocked';
const GAME_MODE_KEY = 'dakheel_game_mode';
let currentGameMode = 'impostor';

const gameModes = {
    impostor: { title: '🕵️‍♂️ شكونو هو؟', start: '🚀 انافا', online: '🌐 العب أونلاين مع أصحابك' },
    thief:    { title: '🗝️ سارق، حاكم، جلّاد', start: '🚀 وزّع الكوارط', online: '🌐 العب أونلاين مع أصحابك' },
    spyfall:  { title: 'ماناش هوني', start: '🚀 وزّع الكوارط', online: '🌐 العب أونلاين مع أصحابك' },
    coup:     { title: '👑 كول وبوّع', start: '🚀 ابدا الكول', online: '🌐 العب أونلاين مع أصحابك' },
    chkobba:  { title: '🃏 شكبّة', start: '🚀 ابدا الشكبّة', online: '🌐 العب أونلاين مع أصحابك' }
};

const thiefRoles = [
    { key:'thief', label:'سارق', icon:'🗝️', desc:'إنت السارق. حاول ما يفيقوش بيك.' },
    { key:'judge', label:'حاكم', icon:'⚖️', desc:'إنت الحاكم. بعد النقاش تختار شكون السارق.' },
    { key:'executioner', label:'جلّاد', icon:'🪓', desc:'إنت الجلّاد. تستنى حكم الحاكم.' }
];

// Unified relative path mappings for full-scope subdirectory or domain compatibility
const coupCards = {
    duke:       { name:'الشلغمي',      icon:'👑', img:'assets/coup/duke.png',       img512:'assets/coup/duke512.png',       attack:'هجوم: ياخو 3 فلوس من البنك.',                              defense:'دفاع: يسكّر اعانة +2 متاع أي لاعب.' },
    assassin:   { name:'حفار القبور',  icon:'🗡️', img:'assets/coup/assassin.png',   img512:'assets/coup/assassin512.png',   attack:'هجوم: يدفع 3 فلوس ويخلي لاعب يختار كارتة يخسرها.',       defense:'دفاع: ما عندوش دفاع، أما claim متاعو ينجم يتكذّب.' },
    contessa:   { name:'البية',        icon:'💃', img:'assets/coup/contessa.png',   img512:'assets/coup/contessa512.png',   attack:'هجوم: ما عندهاش هجوم.',                                   defense:'دفاع: تسكّر الاغتيال متاع حفار القبور.' },
    ambassador: { name:'السمسار',      icon:'🤝', img:'assets/coup/ambassador.png', img512:'assets/coup/ambassador512.png', attack:'هجوم: يبدّل كوارطو الحيّة مع الدكّة، أو يعمل روحو بدّل.', defense:'دفاع: يسكّر سرقة الرايس.' },
    captain:    { name:'الرايس',       icon:'⚓', img:'assets/coup/captain.png',    img512:'assets/coup/captain512.png',    attack:'هجوم: يسرق حتى زوز فلوس من لاعب آخر.',                   defense:'دفاع: يسكّر سرقة الرايس.' }
};

let coupState = null;
let coupFocusedPlayerId = null;
let coupTimerInterval = null;
const COUP_DEFAULT_ACTION_MINUTES = 1;
const COUP_RESPONSE_SECONDS = 45;
let coupResponseInterval = null;
let coupOtherDecksCollapsed = false;

function _now() {
    return (window.onlineMode && typeof window._syncedNow === 'function') ? window._syncedNow() : Date.now();
}

const coupActionHelp = {
    income:      { title:'شهرية +1',            text:'تاخو 1 فلوس من البنك. ما تتسكرش وما حد ينجم يقولك تكذب خاطرها أكشن مفتوحة.' },
    foreignAid:  { title:'اعانة +2',             text:'تاخو 2 فلوس من البنك. أي لاعب ينجم يقول عندو الشلغمي ويسكّرها. بعد البلوك، أي لاعب ينجم يتهمه بالتبلعيط.' },
    tax:         { title:'الشلغمي +3',           text:'تقول عندي الشلغمي وتاخو 3 فلوس من البنك. أي لاعب ينجم يقولك تكذب.' },
    steal:       { title:'الرايس: اسرق',         text:'تقول عندي الرايس وتسرق حتى زوز فلوس من لاعب. الهدف ينجم يسكّر بالرايس أو السمسار، وأي لاعب ينجم يتهم أي claim بالتبلعيط.' },
    assassinate: { title:'اغتيال -3',            text:'تدفع 3 فلوس وتقول عندي حفار القبور باش تطيّح كارتة من لاعب. الهدف ينجم يسكّر بالبية، وأي لاعب ينجم يقول تكذب.' },
    exchange:    { title:'السمسار: بدّل',        text:'تقول عندي السمسار وتبدّل كوارطك الحيين مع الدكّة. أي لاعب ينجم يقولك تكذب.' },
    coup:        { title:'Coup -7',              text:'تدفع 7 فلوس وتطيّح كارتة من لاعب. ما تتسكرش وما فيهاش تكذيب.' }
};

// ============================================================
// INDEXED DB — settings persistence
// ============================================================
const dbPromise = new Promise((resolve) => {
    try {
        const req = indexedDB.open('DakheelLocalDB', 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore('settingsStore');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    } catch(e) { resolve(null); }
});

async function saveSettings() {
    const settings = {
        players: Array.from(document.querySelectorAll('.player-input')).map(i => i.value),
        impostors: impostorConfig, timer: timerConfig, lang: currentLang,
        randomImpostors: _togActive('t-random'), chaos: _togActive('t-chaos'),
        elimination: _togActive('t-elimination'), noHints: _togActive('t-nohint'),
        allCorrect: _togActive('t-allhint')
    };
    try {
        const db = await dbPromise; if (!db) return;
        db.transaction('settingsStore','readwrite').objectStore('settingsStore').put(settings,'game_settings');
    } catch(e) {}
}

async function loadSettings() {
    try {
        const db = await dbPromise; if (!db) return null;
        return new Promise(resolve => {
            const req = db.transaction('settingsStore','readonly').objectStore('settingsStore').get('game_settings');
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    } catch(e) { return null; }
}

function rememberX18Unlock() { try { localStorage.setItem(X18_REMEMBER_KEY, '1'); } catch (_) {} }
function hasRememberedX18Unlock() { try { return localStorage.getItem(X18_REMEMBER_KEY) === '1'; } catch (_) { return false; } }
function _togActive(id) { return document.getElementById(id)?.classList.contains('active') || false; }
function _togSet(id, val) { document.getElementById(id)?.classList.toggle('active', !!val); }

// ============================================================
// UTILITIES
// ============================================================
function showScreen(id) {
    const next = document.getElementById(id);
    if (!next) return;
    const current = document.querySelector('.screen.active');
    if (current === next) {
        next.hidden = false;
        next.removeAttribute('aria-hidden');
        try { next.inert = false; } catch(_) {}
        return;
    }
    document.querySelectorAll('.screen').forEach(screen => {
        const isNext = screen === next;
        if (isNext) screen.removeAttribute('aria-hidden');
        else screen.setAttribute('aria-hidden', 'true');
        try { screen.inert = !isNext; } catch(_) {}
        if (isNext) screen.hidden = false;
    });
    document.querySelectorAll('.screen.exiting').forEach(s => s.classList.remove('exiting'));
    if (current) {
        current.classList.remove('active');
        current.classList.add('exiting');
        setTimeout(() => { current.classList.remove('exiting'); if (!current.classList.contains('active')) current.hidden = true; }, 260);
    }
    requestAnimationFrame(() => next.classList.add('active'));
}
window.showScreen = showScreen;

function showToast(msg) {
    const t = document.getElementById('toast-msg');
    t.innerText = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3000);
}
window._showToast = showToast;

function openModal(id) {
    const m = document.getElementById(id);
    m.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => { m.classList.add('active'); _sfx.modalOpen(); }));
}
function closeModal(id) {
    const m = document.getElementById(id);
    m.classList.remove('active'); _sfx.modalClose();
    setTimeout(() => m.classList.add('hidden'), 300);
}

function triggerAnimation(type) {
    const overlay = document.createElement('div');
    if (type === 'win') {
        overlay.className = 'anim-win-overlay';
        document.body.appendChild(overlay);
        const emojis = ['🎉','🏆','🎊','⭐','✨','🎈','🥳','🌟','💫','🎆','🎇','🏅','🌈','💥'];
        for (let i = 0; i < 14; i++) {
            const p = document.createElement('div'); p.className = 'win-particle';
            p.innerText = emojis[i % emojis.length];
            const angle = (i / 14) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
            const dist = 100 + Math.random() * 130;
            p.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
            p.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
            p.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
            p.style.setProperty('--delay', (Math.random() * 0.28).toFixed(2) + 's');
            overlay.appendChild(p);
        }
        const center = document.createElement('div'); center.className = 'win-center'; center.innerText = '🎉';
        overlay.appendChild(center);
        _sfx.win();
    } else {
        overlay.className = 'anim-lose-overlay';
        document.body.appendChild(overlay);
        const center = document.createElement('div'); center.className = 'lose-center'; center.innerText = '💀';
        overlay.appendChild(center);
        const cont = document.querySelector('.container');
        cont.classList.add('shake-container');
        setTimeout(() => cont.classList.remove('shake-container'), 600);
        _sfx.lose();
    }
    setTimeout(() => overlay.parentNode && overlay.parentNode.removeChild(overlay), 2800);
}
window.triggerAnimation = triggerAnimation;

function triggerNotLyingAnimation(playerName) {
    const overlay = document.createElement('div');
    overlay.className = 'anim-win-overlay not-lying-announcement';
    document.body.appendChild(overlay);
    const content = document.createElement('div');
    content.className = 'not-lying-content';
    content.innerHTML = `<div class="not-lying-icon">🛡️</div><div class="not-lying-name">${_escapeHtml(playerName)}</div><div class="not-lying-label">ما طلعش يكذب!</div><div class="not-lying-sub">الكارتة تبدلت بوحدة جديدة من الدكة.</div>`;
    overlay.appendChild(content);
    _sfx.win();
    setTimeout(() => { overlay.classList.add('fade-out'); setTimeout(() => overlay.remove(), 600); }, 2800);
}
window.triggerNotLyingAnimation = triggerNotLyingAnimation;

function triggerWinnerAnnouncement(winnerName) {
    const overlay = document.createElement('div');
    overlay.className = 'anim-win-overlay winner-announcement';
    document.body.appendChild(overlay);
    const emojis = ['🎉','🏆','🎊','⭐','✨','🎈','🥳','🌟','💫','🎆','🎇','🏅','🌈','💥'];
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div'); p.className = 'win-particle'; p.innerText = emojis[i % emojis.length];
        const angle = Math.random() * 2 * Math.PI; const dist = 50 + Math.random() * 250;
        p.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
        p.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
        p.style.setProperty('--rot', (Math.random() * 1080 - 540).toFixed(0) + 'deg');
        p.style.setProperty('--delay', (Math.random() * 0.5).toFixed(2) + 's');
        overlay.appendChild(p);
    }
    const content = document.createElement('div'); content.className = 'winner-content';
    content.innerHTML = `<div class="winner-trophy">🏆</div><div class="winner-name">${_escapeHtml(winnerName)}</div><div class="winner-label">ربح الطرح!</div>`;
    overlay.appendChild(content);
    _sfx.win();
    document.getElementById('coup-turn-indicator')?.classList.add('hidden');
    setTimeout(() => { overlay.classList.add('fade-out'); setTimeout(() => overlay.remove(), 800); }, 4000);
}
window.triggerWinnerAnnouncement = triggerWinnerAnnouncement;

// ============================================================
// TRANSLATIONS APPLY
// ============================================================
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if (i18n[currentLang]?.[k]) el.innerText = i18n[currentLang][k];
    });
    document.querySelectorAll('.player-input').forEach(inp => inp.placeholder = i18n[currentLang].player_placeholder);
    document.querySelectorAll('.lang-pill-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-lang') === currentLang));
    document.body.classList.toggle('lang-x18', currentLang === 'x18');
    updateGameModeUI();
}

// ============================================================
// GAME MODE
// ============================================================
function setGameMode(mode, goSetup = true) {
    currentGameMode = ['impostor','thief','spyfall','coup','chkobba'].includes(mode) ? mode : 'impostor';
    try { localStorage.setItem(GAME_MODE_KEY, currentGameMode); } catch(_) {}
    if (currentGameMode !== 'impostor') currentLang = 'tn';
    if (currentGameMode === 'coup' || currentGameMode === 'chkobba') {
        timerConfig = currentGameMode === 'coup' ? COUP_DEFAULT_ACTION_MINUTES : 1;
        const timerVal = document.getElementById('val-timer');
        if (timerVal) timerVal.innerText = timerConfig;
    }
    document.body.classList.add('game-switching');
    clearTimeout(document.body._gameSwitchTimer);
    document.body._gameSwitchTimer = setTimeout(() => document.body.classList.remove('game-switching'), 520);
    updateGameModeUI();
    if (goSetup) {
        if (currentGameMode === 'coup' || currentGameMode === 'chkobba') showScreen('online-setup-screen');
        else showScreen('setup-screen');
    }
}
window.setGameMode = setGameMode;
window.getCurrentGameMode = () => currentGameMode;

function showModeSelect() {
    document.getElementById('game-switch-menu')?.classList.add('hidden');
    document.body.classList.add('game-switching');
    clearTimeout(document.body._gameSwitchTimer);
    document.body._gameSwitchTimer = setTimeout(() => document.body.classList.remove('game-switching'), 520);
    showScreen('mode-select-screen');
}
window.showModeSelect = showModeSelect;

function updateGameModeUI() {
    const meta = gameModes[currentGameMode];
    if (currentGameMode !== 'coup') document.getElementById('coup-turn-indicator')?.classList.add('hidden');
    document.body.classList.toggle('game-chkobba', currentGameMode === 'chkobba');
    document.body.classList.toggle('game-thief', currentGameMode === 'thief');
    document.body.classList.toggle('game-spyfall', currentGameMode === 'spyfall');
    document.body.classList.toggle('game-coup', currentGameMode === 'coup');
    document.body.classList.toggle('game-impostor', currentGameMode === 'impostor');
    const title = document.querySelector('header h1');
    if (title) { title.innerText = currentGameMode === 'impostor' ? i18n[currentLang].title : meta.title; }
    document.querySelectorAll('.game-switch-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gameMode === currentGameMode);
    });
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) startBtn.innerText = meta.start;
    const onlineBtn = document.getElementById('open-online-btn');
    if (onlineBtn) onlineBtn.innerText = meta.online;
    const voteBtn = document.getElementById('go-to-vote-btn');
    if (voteBtn) voteBtn.innerText = currentGameMode === 'thief' ? '⚖️ يا حاكم، احكم' : currentGameMode === 'spyfall' ? '🕶️ عرفنا الspy' : i18n[currentLang].vote_btn;
    const who = document.querySelector('[data-i18n="who_impostor"]');
    if (who) who.innerText = currentGameMode === 'thief' ? 'يا حاكم، شكون السارق؟' : currentGameMode === 'spyfall' ? 'شكون الspy؟' : i18n[currentLang].who_impostor;
    const timerLabel = document.querySelector('[data-i18n="timer_label"]');
    if (timerLabel) timerLabel.innerText = currentGameMode === 'coup' ? '⏱️ وقت الدور' : i18n[currentLang].timer_label;
}

// ============================================================
// PLAYER INPUTS
// ============================================================
function addPlayerInput(savedName = '') {
    const container = document.getElementById('players-inputs-container');
    playerCount++;
    const row = document.createElement('div');
    row.className = 'player-row';
    row.innerHTML = `<input type="text" class="player-input" value="${_escapeHtml(savedName)}" placeholder="${_escapeHtml(i18n[currentLang].player_placeholder)}">
                     <button class="remove-btn" type="button">✖</button>`;
    row.querySelector('.remove-btn').addEventListener('click', () => { row.remove(); saveSettings(); });
    row.querySelector('.player-input').addEventListener('input', saveSettings);
    container.appendChild(row);
}

// ============================================================
// TOGGLE RULES
// ============================================================
function checkRules() {
    document.getElementById('imp-control').classList.toggle('disabled-ui', _togActive('t-random'));
    const noHint = _togActive('t-nohint'), allHint = _togActive('t-allhint');
    const nohintRow = document.getElementById('nohint-row');
    const allhintRow = document.getElementById('allhint-row');
    if (noHint) { _togSet('t-allhint', false); allhintRow?.classList.add('disabled-ui'); } else { allhintRow?.classList.remove('disabled-ui'); }
    if (allHint) { _togSet('t-nohint', false); nohintRow?.classList.add('disabled-ui'); } else { nohintRow?.classList.remove('disabled-ui'); }
    saveSettings();
}

// ============================================================
// WORD LISTS
// ============================================================
const _embeddedRegular = [
    {word:"كسكسي",hint:"تقليدي"},{word:"لبلابي",hint:"شعبية"},{word:"بريك",hint:"مقرمش"},
    {word:"هريسة",hint:"حار"},{word:"ملوخية",hint:"مطبوخ"},{word:"مقرونة",hint:"شائعة"},
    {word:"بيتزا",hint:"مخبوزة"},{word:"جامع",hint:"راحة"},{word:"قهوة",hint:"جلوس"},
    {word:"شاطئ",hint:"ساحلي"},{word:"سوق",hint:"تجارة"},{word:"مدرسة",hint:"تعلم"},
    {word:"ملعب",hint:"رياضية"},{word:"هاتف",hint:"اتصال"},{word:"مفتاح",hint:"دخول"},
    {word:"لواج",hint:"خلاص"},{word:"مترو",hint:"تونس"},{word:"تاكسي",hint:"عداد"},
    {word:"شمس",hint:"مضيء"},{word:"قمر",hint:"سماوي"},{word:"بحر",hint:"مائي"},
    {word:"قطة",hint:"شعر"},{word:"كلب",hint:"حارس"},{word:"طبيب",hint:"رعاية"},
    {word:"معلم",hint:"تعليمي"},{word:"كرة قدم",hint:"شعبية"},{word:"تلفزيون",hint:"ترفيه"},
    {word:"مطعم",hint:"أكل"},{word:"مستشفى",hint:"صحة"},{word:"عروسة",hint:"احتفال"},
    {word:"ساعة",hint:"وقت"},{word:"سيارة",hint:"نقل"},{word:"قرطاج",hint:"أثري"},
    {word:"سيدي بوسعيد",hint:"ازرق"}
];

// Fallback logic normalization handling variant nested/root directory configurations seamlessly
fetch('assets/images/word list.json', { cache: 'no-store' })
    .then(r => r.json()).then(d => { regularWordsDB = d; })
    .catch(() => {
        fetch('../assets/images/word list.json', { cache: 'no-store' })
            .then(r => r.json()).then(d => { regularWordsDB = d; })
            .catch(() => { regularWordsDB = _embeddedRegular; });
    });

fetch('assets/images/spyfall_tunisia_100_locations.json', { cache: 'no-store' })
    .then(r => r.json()).then(d => { spyfallDB = d.spyfall_data || d || []; })
    .catch(() => {
        fetch('../assets/images/spyfall_tunisia_100_locations.json', { cache: 'no-store' })
            .then(r => r.json()).then(d => { spyfallDB = d.spyfall_data || d || []; })
            .catch(() => { spyfallDB = []; });
    });

if (window._adultWordsDecoded && window._adultWordsDecoded.length) {
    adultWordsDB = window._adultWordsDecoded;
}