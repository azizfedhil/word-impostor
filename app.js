'use strict';

// ============================================================
// TRANSLATIONS — FULL (tn + x18 with original dialect)
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
        vote_btn:"🗳️ سكر على زبي، عرفنا البلعوط", voting_title:"🗳️ الفرز",
        who_impostor:"شكونو هالزبور؟", result_title:"🏆 شكون طلع؟", next_round_btn:"🔄 عاود انده",
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
    thief: { title: '🗝️ سارق، حاكم، جلّاد', start: '🚀 وزّع الكوارط', online: '🌐 العب أونلاين مع أصحابك' },
    spyfall: { title: 'ماناش هوني', start: '🚀 وزّع الكوارط', online: '🌐 العب أونلاين مع أصحابك' },
    coup: { title: '👑 كول وبوّع', start: '🚀 ابدا الكول', online: '🌐 العب أونلاين مع أصحابك' },
    chkobba: { title: '🃏 شكبّة', start: '🚀 ابدا الشكبّة', online: '🌐 العب أونلاين مع أصحابك' }
};
const thiefRoles = [
    { key:'thief', label:'سارق', icon:'🗝️', desc:'إنت السارق. حاول ما يفيقوش بيك.' },
    { key:'judge', label:'حاكم', icon:'⚖️', desc:'إنت الحاكم. بعد النقاش تختار شكون السارق.' },
    { key:'executioner', label:'جلّاد', icon:'🪓', desc:'إنت الجلّاد. تستنى حكم الحاكم.' }
];
const coupCards = {
    duke: { name:'الشلغمي', icon:'👑', img:'assets/coup/duke.png', img512:'assets/coup/duke512.png', attack:'هجوم: ياخو 3 فلوس من البنك.', defense:'دفاع: يسكّر اعانة +2 متاع أي لاعب.' },
    assassin: { name:'حفار القبور', icon:'🗡️', img:'assets/coup/assassin.png', img512:'assets/coup/assassin512.png', attack:'هجوم: يدفع 3 فلوس ويخلي لاعب يختار كارتة يخسرها.', defense:'دفاع: ما عندوش دفاع، أما claim متاعو ينجم يتكذّب.' },
    contessa: { name:'البية', icon:'💃', img:'assets/coup/contessa.png', img512:'assets/coup/contessa512.png', attack:'هجوم: ما عندهاش هجوم.', defense:'دفاع: تسكّر الاغتيال متاع حفار القبور.' },
    ambassador: { name:'السمسار', icon:'🤝', img:'assets/coup/ambassador.png', img512:'assets/coup/ambassador512.png', attack:'هجوم: يبدّل كوارطو الحيّة مع الدكّة، أو يعمل روحو بدّل.', defense:'دفاع: يسكّر سرقة الرايس.' },
    captain: { name:'الرايس', icon:'⚓', img:'assets/coup/captain.png', img512:'assets/coup/captain512.png', attack:'هجوم: يسرق حتى زوز فلوس من لاعب آخر.', defense:'دفاع: يسكّر سرقة الرايس.' }
};
let coupState = null;
let coupFocusedPlayerId = null;
let coupTimerInterval = null;
const COUP_DEFAULT_ACTION_MINUTES = 1;
const COUP_RESPONSE_SECONDS = 45;
let coupResponseInterval = null;

function _now() {
    return (window.onlineMode && typeof window._syncedNow === 'function') ? window._syncedNow() : Date.now();
}
let coupOtherDecksCollapsed = false;
const coupActionHelp = {
    income: { title:'شهرية +1', text:'تاخو 1 فلوس من البنك. ما تتسكرش وما حد ينجم يقولك تكذب خاطرها أكشن مفتوحة.' },
    foreignAid: { title:'اعانة +2', text:'تاخو 2 فلوس من البنك. أي لاعب ينجم يقول عندو الشلغمي ويسكّرها. بعد البلوك، أي لاعب ينجم يتهمه بالتبلعيط.' },
    tax: { title:'الشلغمي +3', text:'تقول عندي الشلغمي وتاخو 3 فلوس من البنك. أي لاعب ينجم يقولك تكذب.' },
    steal: { title:'الرايس: اسرق', text:'تقول عندي الرايس وتسرق حتى زوز فلوس من لاعب. الهدف ينجم يسكّر بالرايس أو السمسار، وأي لاعب ينجم يتهم أي claim بالتبلعيط.' },
    assassinate: { title:'اغتيال -3', text:'تدفع 3 فلوس وتقول عندي حفار القبور باش تطيّح كارتة من لاعب. الهدف ينجم يسكّر بالبية، وأي لاعب ينجم يقول تكذب.' },
    exchange: { title:'السمسار: بدّل', text:'تقول عندي السمسار وتبدّل كوارطك الحيين مع الدكّة. أي لاعب ينجم يقولك تكذب.' },
    coup: { title:'Coup -7', text:'تدفع 7 فلوس وتطيّح كارتة من لاعب. ما تتسكرش وما فيهاش تكذيب.' }
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

function rememberX18Unlock() {
    try { localStorage.setItem(X18_REMEMBER_KEY, '1'); }
    catch (_) {}
}

function hasRememberedX18Unlock() {
    try { return localStorage.getItem(X18_REMEMBER_KEY) === '1'; }
    catch (_) { return false; }
}

function _togActive(id) { return document.getElementById(id).classList.contains('active'); }
function _togSet(id, val) { document.getElementById(id).classList.toggle('active', !!val); }

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
        setTimeout(() => {
            current.classList.remove('exiting');
            if (!current.classList.contains('active')) current.hidden = true;
        }, 260);
    }
    requestAnimationFrame(() => next.classList.add('active'));
}

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
    if (title) {
        title.innerText = currentGameMode === 'impostor' ? i18n[currentLang].title : meta.title;
        title.classList.toggle('spyfall-title', false);
    }
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
        document.getElementById("game-inner").appendChild(overlay);
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
        document.getElementById("game-inner").appendChild(overlay);
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
    document.getElementById("game-inner").appendChild(overlay);

    const content = document.createElement('div');
    content.className = 'not-lying-content';
    content.innerHTML = `
        <div class="not-lying-icon">🛡️</div>
        <div class="not-lying-name">${_escapeHtml(playerName)}</div>
        <div class="not-lying-label">ما طلعش يكذب!</div>
        <div class="not-lying-sub">الكارتة تبدلت بوحدة جديدة من الدكة.</div>
    `;
    overlay.appendChild(content);

    _sfx.win();
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 600);
    }, 2800);
}
window.triggerNotLyingAnimation = triggerNotLyingAnimation;

function triggerWinnerAnnouncement(winnerName) {
    const overlay = document.createElement('div');
    overlay.className = 'anim-win-overlay winner-announcement';
    document.getElementById("game-inner").appendChild(overlay);

    const emojis = ['🎉','🏆','🎊','⭐','✨','🎈','🥳','🌟','💫','🎆','🎇','🏅','🌈','💥'];
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'win-particle';
        p.innerText = emojis[i % emojis.length];
        const angle = Math.random() * 2 * Math.PI;
        const dist = 50 + Math.random() * 250;
        p.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
        p.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
        p.style.setProperty('--rot', (Math.random() * 1080 - 540).toFixed(0) + 'deg');
        p.style.setProperty('--delay', (Math.random() * 0.5).toFixed(2) + 's');
        overlay.appendChild(p);
    }

    const content = document.createElement('div');
    content.className = 'winner-content';
    content.innerHTML = `
        <div class="winner-trophy">🏆</div>
        <div class="winner-name">${_escapeHtml(winnerName)}</div>
        <div class="winner-label">ربح الطرح!</div>
    `;
    overlay.appendChild(content);

    _sfx.win();
    document.getElementById('coup-turn-indicator')?.classList.add('hidden');
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 800);
    }, 4000);
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
// GAME RULES / TOGGLE INTERLOCK
// ============================================================
function checkRules() {
    // Random impostors → disable impostor count
    document.getElementById('imp-control').classList.toggle('disabled-ui', _togActive('t-random'));

    const noHint = _togActive('t-nohint'), allHint = _togActive('t-allhint');
    const nohintRow = document.getElementById('nohint-row');
    const allhintRow = document.getElementById('allhint-row');

    if (noHint) { _togSet('t-allhint', false); allhintRow.classList.add('disabled-ui'); } else { allhintRow.classList.remove('disabled-ui'); }
    if (allHint) { _togSet('t-nohint', false); nohintRow.classList.add('disabled-ui'); } else { nohintRow.classList.remove('disabled-ui'); }
    saveSettings();
}

// ============================================================
// WORD LISTS — load from external JSON, fallback to embedded
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

fetch('word list.json', { cache: 'no-store' })
    .then(r => r.json()).then(d => { regularWordsDB = d; })
    .catch(() => { regularWordsDB = _embeddedRegular; });

fetch('spyfall_tunisia_100_locations.json', { cache: 'no-store' })
    .then(r => r.json()).then(d => { spyfallDB = d.spyfall_data || d || []; })
    .catch(() => { spyfallDB = []; });

// Adult word list is decoded from adult_words_data.js (obfuscated, loaded before this script)
if (window._adultWordsDecoded && window._adultWordsDecoded.length) {
    adultWordsDB = window._adultWordsDecoded;
}



// ============================================================
// OFFLINE GAME LOGIC
// ============================================================
function renderSingleCard() {
    const container = document.getElementById('single-card-container');
    const nextBtn = document.getElementById('next-player-btn');
    container.innerHTML = ''; nextBtn.classList.add('hidden');
    const player = players[currentRevealIndex];
    document.getElementById('current-player-turn-msg').innerText = i18n[currentLang].reveal_player_prefix + player.name;
    let roleText;
    if (currentGameMode === 'thief') {
        roleText = `<strong style="font-size:1.7rem">${player.roleIcon} ${player.roleLabel}</strong><br><br><span style="font-size:16px;">${player.roleDesc}</span>`;
    } else if (currentGameMode === 'spyfall') {
        roleText = player.isSpy
            ? `<strong style="font-size:1.7rem">🕶️ spy</strong><br><br><span style="font-size:16px;">إنت الspy. حاول تعرف البلاصة من كلامهم.</span>`
            : `<strong style="font-size:1.45rem">📍 ${_escapeHtml(player.locationName)}</strong><br><br><span style="font-size:16px;">دورك: ${_escapeHtml(player.locationRole)}</span>`;
    } else if (player.isImpostor) {
        roleText = noHintsMode
            ? i18n[currentLang].impostor_role
            : `${i18n[currentLang].impostor_role}<br><br><span style="font-size:16px;">${i18n[currentLang].hint_label}</span><br>${_escapeHtml(player.customHint)}`;
    } else {
        roleText = `${i18n[currentLang].citizen_role}<br><br><span style="font-size:16px;">${i18n[currentLang].word_label}</span><br>${_escapeHtml(currentWordObj.word)}`;
    }
    const card = document.createElement('div'); card.className = 'flip-card';
    card.innerHTML = `<div class="card-face card-front"><span>${i18n[currentLang].card_of}${_escapeHtml(player.name)}</span></div>
                      <div class="card-face card-back"><span>${roleText}</span></div>`;
    const showCard = e => { e.preventDefault(); card.classList.add('flipped'); _sfx.cardFlip(); };
    const hideCard = e => {
        e.preventDefault(); if (!card.classList.contains('flipped')) return;
        card.classList.remove('flipped');
        player.viewedCard = true;
        _updateSeenPanel();
        nextBtn.innerText = currentRevealIndex < players.length-1
            ? `${i18n[currentLang].pass_to}${players[currentRevealIndex+1].name}`
            : i18n[currentLang].all_seen;
        nextBtn.classList.remove('hidden');
    };
    card.addEventListener('pointerdown', showCard);
    card.addEventListener('pointerup', hideCard);
    card.addEventListener('pointerleave', hideCard);
    card.addEventListener('pointercancel', hideCard);
    container.appendChild(card);
    _updateSeenPanel();
}
function _updateSeenPanel() {
    const panel = document.getElementById('reveal-seen-panel');
    if (!panel) return;
    panel.innerHTML = players.map(p =>
        `<span class="seen-chip ${p.viewedCard ? 'done' : ''}">${p.viewedCard ? '✅' : '⏳'} ${_escapeHtml(p.name)}</span>`
    ).join('');
}
window.renderSingleCard = renderSingleCard;

function goToVoting() {
    showScreen('voting-screen');
    const list = document.getElementById('voting-list'); list.innerHTML = '';
    document.querySelector('[data-i18n="voting_title"]').innerText = currentGameMode === 'thief' ? '⚖️ حكم الحاكم' : currentGameMode === 'spyfall' ? '🕶️ التصويت على الspy' : i18n[currentLang].voting_title;
    document.querySelector('[data-i18n="who_impostor"]').innerText = currentGameMode === 'thief' ? 'يا حاكم، شكون السارق؟' : currentGameMode === 'spyfall' ? 'شكون الspy؟' : i18n[currentLang].who_impostor;
    players.filter(p=>!p.eliminated).forEach(player => {
        if (currentGameMode === 'thief' && player.role === 'judge') return;
        const btn = document.createElement('button'); btn.className = 'vote-item';
        btn.innerText = (currentGameMode === 'thief' ? '⚖️ ' : '🗳️ ') + player.name;
        btn.onclick = () => handleVote(player);
        list.appendChild(btn);
    });
}

function handleVote(votedPlayer) {
    if (currentGameMode === 'thief') { handleThiefJudgement(votedPlayer); return; }
    if (currentGameMode === 'spyfall') { handleSpyfallVote(votedPlayer); return; }
    const resultMsg = document.getElementById('result-message');
    const revealBox = document.getElementById('impostors-reveal');
    const nextBtn = document.getElementById('next-round-btn');
    revealBox.innerHTML = '';
    const trans = i18n[currentLang];
    if (!isEliminationMode) {
        if (votedPlayer.isImpostor) { triggerAnimation('win'); resultMsg.innerText = trans.correct_guess.replace('{name}',votedPlayer.name); }
        else { triggerAnimation('lose'); resultMsg.innerText = trans.wrong_guess.replace('{name}',votedPlayer.name); }
        const allImps = players.filter(p=>p.isImpostor).map(p=>_escapeHtml(p.name)).join(' و ');
        revealBox.innerHTML = `${trans.impostors_were}<br><strong style="color:var(--primary-color);">${allImps}</strong><br><br>${trans.word_was} <strong>${_escapeHtml(currentWordObj.word)}</strong>`;
        nextBtn.innerText = trans.next_round_btn; nextBtn.onclick = () => showScreen('setup-screen');
    } else {
        votedPlayer.eliminated = true;
        const rI = players.filter(p=>p.isImpostor&&!p.eliminated);
        const rR = players.filter(p=>!p.isImpostor&&!p.eliminated);
        if (rI.length===0) {
            triggerAnimation('win'); resultMsg.innerText = trans.all_impostors_dead;
            revealBox.innerHTML = `${trans.word_was} <strong>${_escapeHtml(currentWordObj.word)}</strong>`;
            nextBtn.innerText = trans.next_round_btn; nextBtn.onclick = () => showScreen('setup-screen');
        } else if (rI.length>=rR.length) {
            triggerAnimation('lose'); resultMsg.innerText = trans.impostors_win;
            const allImps = players.filter(p=>p.isImpostor).map(p=>_escapeHtml(p.name)).join(' و ');
            revealBox.innerHTML = `${trans.impostors_were}<br><strong style="color:var(--primary-color);">${allImps}</strong><br><br>${trans.word_was} <strong>${_escapeHtml(currentWordObj.word)}</strong>`;
            nextBtn.innerText = trans.next_round_btn; nextBtn.onclick = () => showScreen('setup-screen');
        } else {
            if (!votedPlayer.isImpostor) triggerAnimation('lose');
            resultMsg.innerText = trans.eliminated_msg.replace('{name}',votedPlayer.name);
            revealBox.innerHTML = trans.elimination_cliffhanger;
            nextBtn.innerText = trans.continue_discussion;
            nextBtn.onclick = () => {
                remainingTime = 60;
                const alive = players.filter(p=>!p.eliminated);
                document.getElementById('starter-player').innerText = `${trans.starter_continue}${alive[Math.floor(Math.random()*alive.length)].name}`;
                showScreen('timer-screen'); updateTimerDisplay();
                timerInterval = setInterval(()=>{remainingTime--;updateTimerDisplay();if(remainingTime<=0){clearInterval(timerInterval);goToVoting();}},1000);
            };
        }
    }
    showScreen('result-screen');
}

function handleSpyfallVote(votedPlayer) {
    const resultMsg = document.getElementById('result-message');
    const revealBox = document.getElementById('impostors-reveal');
    const nextBtn = document.getElementById('next-round-btn');
    const spy = players.find(p => p.isSpy);
    const caught = votedPlayer.isSpy;
    if (caught) {
        triggerAnimation('win');
        resultMsg.innerText = `براڨو! ${votedPlayer.name} هو الspy.`;
    } else {
        triggerAnimation('lose');
        resultMsg.innerText = `غلط! الspy هرب. ${votedPlayer.name} خاطيه.`;
    }
    revealBox.innerHTML = `الspy: <strong style="color:var(--primary-color)">${_escapeHtml(spy?.name || '?')}</strong><br>البلاصة: <strong>${_escapeHtml(spy?.locationName || '?')}</strong>`;
    nextBtn.innerText = '🔄 عاود انده';
    nextBtn.onclick = () => showScreen('setup-screen');
    showScreen('result-screen');
}

function handleThiefJudgement(votedPlayer) {
    const resultMsg = document.getElementById('result-message');
    const revealBox = document.getElementById('impostors-reveal');
    const nextBtn = document.getElementById('next-round-btn');
    const thief = players.find(p => p.role === 'thief');
    const judge = players.find(p => p.role === 'judge');
    const executioner = players.find(p => p.role === 'executioner');
    const caught = votedPlayer.role === 'thief';
    if (caught) {
        triggerAnimation('win');
        resultMsg.innerText = `الحاكم فقسها! ${votedPlayer.name} هو السارق.`;
    } else {
        triggerAnimation('lose');
        resultMsg.innerText = `السارق هرب! ${votedPlayer.name} طلع خاطيه.`;
    }
    revealBox.innerHTML = `السارق: <strong>${_escapeHtml(thief?.name || '?')}</strong><br>الحاكم: <strong>${_escapeHtml(judge?.name || '?')}</strong><br>الجلّاد: <strong>${_escapeHtml(executioner?.name || '?')}</strong>`;
    nextBtn.innerText = '🔄 عاود انده';
    nextBtn.onclick = () => showScreen('setup-screen');
    showScreen('result-screen');
}

function updateTimerDisplay() {
    const m = Math.floor(remainingTime/60).toString().padStart(2,'0');
    const s = (remainingTime%60).toString().padStart(2,'0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;
    if (remainingTime===0) _sfx.timerEnd();
    else if (remainingTime<=10) _sfx.tickUrgent();
    else _sfx.tick();
}
window.updateTimerDisplay = updateTimerDisplay;

function startThiefOffline() {
    _cleanupOnlineGameUI();
    saveSettings();
    const namesInput = Array.from(document.querySelectorAll('.player-input'))
        .map((inp,idx)=>inp.value.trim()||`لاعب ${idx+1}`);
    if (namesInput.length < 3) {
        document.getElementById('setup-error').innerText='يلزم 3 لاعبين على الأقل: سارق، حاكم، وجلّاد.';
        _sfx.error();
        return;
    }
    document.getElementById('setup-error').innerText='';
    const shuffled = [...namesInput].sort(()=>0.5-Math.random());
    const roles = [
        ...thiefRoles,
        ...Array(Math.max(0, shuffled.length - 3)).fill(null).map(() => ({ key:'witness', label:'شاهد', icon:'👁️', desc:'إنت شاهد. عاون الحاكم بالكلام وما تكشفش برشة.' }))
    ].sort(()=>0.5-Math.random());
    players = shuffled.map((name, idx) => {
        const role = roles[idx];
        return { name, role:role.key, roleLabel:role.label, roleIcon:role.icon, roleDesc:role.desc, eliminated:false, viewedCard:false };
    });
    remainingTime = timerConfig * 60;
    currentRevealIndex = 0;
    renderSingleCard();
    showScreen('reveal-screen');
    _sfx.gameStart();
}

function startSpyfallOffline() {
    _cleanupOnlineGameUI();
    saveSettings();
    const namesInput = Array.from(document.querySelectorAll('.player-input'))
        .map((inp,idx)=>inp.value.trim()||`لاعب ${idx+1}`);
    if (namesInput.length < 3) {
        document.getElementById('setup-error').innerText='يلزم 3 لاعبين على الأقل باش تلعب ماناش هوني.';
        _sfx.error();
        return;
    }
    if (!spyfallDB.length) {
        document.getElementById('setup-error').innerText='قائمة البلايص مازال ما تحملتش، جرب بعد شوية.';
        _sfx.error();
        return;
    }
    document.getElementById('setup-error').innerText='';
    const location = spyfallDB[Math.floor(Math.random() * spyfallDB.length)];
    const roles = [...(location.roles_tn || [])].sort(()=>0.5-Math.random());
    const spyIndex = Math.floor(Math.random() * namesInput.length);
    players = namesInput.map((name, idx) => ({
        name,
        isSpy: idx === spyIndex,
        locationName: location.location_tn,
        locationRole: roles[idx % Math.max(1, roles.length)] || 'حريف',
        eliminated:false,
        viewedCard:false
    }));
    remainingTime = timerConfig * 60;
    currentRevealIndex = 0;
    renderSingleCard();
    showScreen('reveal-screen');
    _sfx.gameStart();
}

function _coupBuildDeck() {
    const keys = ['duke','assassin','contessa','ambassador','captain'];
    return keys.flatMap(k => Array(3).fill(k)).sort(()=>0.5-Math.random());
}

function _coupAlive(state = coupState) {
    return state.players.filter(p => p.hand.some(c => !c.lost));
}

function _coupNextTurn(state = coupState) {
    const alive = _coupAlive(state);
    if (alive.length <= 1) return;
    let idx = state.turnIndex;
    for (let i=0; i<state.players.length; i++) {
        idx = (idx + 1) % state.players.length;
        if (state.players[idx].hand.some(c=>!c.lost)) { state.turnIndex = idx; _coupSetTurnDeadline(state); return; }
    }
}

function _coupPublicCard(player) {
    const live = player.hand.find(c=>!c.lost);
    return live || player.hand[0];
}

function _coupTakeFromBank(state, amount) {
    if (!state || !Number.isFinite(state.bankCoins)) return;
    state.bankCoins = Math.max(0, state.bankCoins - Math.max(0, amount || 0));
}

function _coupPayBank(state, amount) {
    if (!state || !Number.isFinite(state.bankCoins)) return;
    state.bankCoins += Math.max(0, amount || 0);
}

function _coupResourceHtml(state = coupState) {
    const bank = Number.isFinite(state?.bankCoins) ? state.bankCoins : '∞';
    const deckCount = state?.deck?.length || 0;
    const maxDeck = 15;
    const deckClass = deckCount <= 3 ? 'deck-critical' : deckCount <= 7 ? 'deck-low' : '';
    // Visual coin count: show 1-5 dots representing approximate wealth
    const coinDots = Math.max(0, Math.min(5, Math.ceil((typeof bank === 'number' ? bank : 50) / 12)));
    const coinBar = typeof bank === 'number'
        ? `<span class="coup-coin-bar">${Array(5).fill(0).map((_,i) => `<span class="${i < coinDots ? 'coin-dot filled' : 'coin-dot'}"></span>`).join('')}</span>`
        : '';
    return `<div class="coup-bank-display"><span class="coup-bank-icon">🪙</span><strong class="coup-bank-val">${bank}</strong>${coinBar}</div><div class="coup-deck-display ${deckClass}"><div class="coup-deck-stack-vis"><span class="cds-back2"></span><span class="cds-back1"></span><span class="cds-front">🂠</span></div><strong class="coup-deck-val">${deckCount}</strong><span class="coup-deck-label">/${maxDeck}</span></div>`;
}

function _coupStatusHtml(state = coupState) {
    const alive = _coupAlive(state);
    const current = state.players[state.turnIndex];
    if (alive.length <= 1) return `<span class="coup-status-line">🏆 <bdi>${_escapeHtml(alive[0]?.name || '')}</bdi> ربح الطرح!</span>`;
    if (state.pending) return `<span class="coup-status-line">${_escapeHtml(state.log || '')}</span>`;
    return `<span class="coup-status-line">الدور على <bdi>${_escapeHtml(current?.name || '?')}.</bdi></span>${state.log ? `<span class="coup-status-line">${_escapeHtml(state.log)}</span>` : ''}`;
}

function _coupTimerHtml(left) {
    return `<span>وقت الدور</span><strong>${_formatSeconds(left)}</strong>`;
}

function _coupProveAndReplace(player, role, state = coupState) {
    const idx = player?.hand?.findIndex(c => !c.lost && c.type === role);
    if (idx < 0) return;
    state.deck.unshift(role);
    state.deck.sort(()=>0.5-Math.random());
    player.hand[idx] = { type: state.deck.pop() || role, lost:false };
}

function _coupOpenBlockWindowAfterChallenge(pending, actor) {
    coupState.pending = {
        ...pending,
        id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        claim:null,
        challengeClosed:true,
        passes:[]
    };
    _coupSetResponseDeadline(coupState.pending);
    coupState.log = `${actor.name} ورّى الكارتة الصحيحة. مازال تنجم تتسكر كان عندكم الكارتة المناسبة.`;
    renderCoupChallengePanel();
}

function _escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, ch => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
    }[ch]));
}

function _coupActionMinutes(state = coupState) {
    const raw = state?.actionMinutes || timerConfig || COUP_DEFAULT_ACTION_MINUTES;
    return Math.max(1, Math.min(10, parseInt(raw, 10) || COUP_DEFAULT_ACTION_MINUTES));
}

function _coupSetTurnDeadline(state = coupState) {
    if (!state) return;
    state.turnEndsAt = _now() + (_coupActionMinutes(state) * 60000);
}

function _coupSetResponseDeadline(pending) {
    pending.expiresAt = _now() + COUP_RESPONSE_SECONDS * 1000;
}

function _coupBlockRoleLabel(role) {
    const meta = coupCards[role] || coupCards.duke;
    return `${meta.icon} ${meta.name}`;
}

function _coupBlockOptions(pending) {
    return (pending?.blockRoles || []).map(role => ({ role, label:_coupBlockRoleLabel(role) }));
}

function _coupPendingClaimantId(pending) {
    return pending?.stage === 'block' ? pending.blockerId : pending?.actorId;
}

function _coupPendingResponders(state = coupState, pending = state?.pending) {
    const claimantId = _coupPendingClaimantId(pending);
    return _coupAlive(state).filter(p => p.id !== claimantId);
}

function _coupPassCount(state = coupState, pending = state?.pending) {
    const passes = new Set(pending?.passes || []);
    return _coupPendingResponders(state, pending).filter(p => passes.has(p.id)).length;
}

function _coupAllPassed(state = coupState, pending = state?.pending) {
    const responders = _coupPendingResponders(state, pending);
    return responders.length > 0 && _coupPassCount(state, pending) >= responders.length;
}

function _formatSeconds(totalSeconds) {
    const safe = Math.max(0, parseInt(totalSeconds, 10) || 0);
    const m = Math.floor(safe / 60).toString().padStart(2, '0');
    const s = (safe % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function _coupCardIconHtml(card, cls = 'coup-card-avatar') {
    if (!card) return '';
    if (card.img) return `<img class="${cls}" src="${_escapeHtml(card.img)}" alt="${_escapeHtml(card.name || '')}" loading="lazy">`;
    return `<span class="${cls}">${card.icon || ''}</span>`;
}

function _coupCardLargeHtml(card, cls = 'coup-card-portrait') {
    if (!card) return '';
    const src = card.img512 || card.img;
    if (src) return `<img class="${cls}" src="${_escapeHtml(src)}" alt="${_escapeHtml(card.name || '')}" loading="lazy">`;
    return `<span class="${cls}">${card.icon || ''}</span>`;
}

function _coupCardLabelHtml(card, cls = 'coup-card-avatar') {
    return `${_coupCardIconHtml(card, cls)}<span>${_escapeHtml(card?.name || '')}</span>`;
}

function _coupCardDescHtml(card) {
    const attack = card.attack || card.desc || '';
    const defense = card.defense || '';
    return `<span class="coup-card-desc-line">${_escapeHtml(attack)}</span>${defense ? `<span class="coup-card-desc-line">${_escapeHtml(defense)}</span>` : ''}`;
}

function _renderCoupRoleHelp(cards = coupCards) {
    const help = document.getElementById('coup-role-help');
    if (!help) return;
    help.innerHTML = Object.values(cards).map(c =>
        `<div class="coup-help-item"><div class="coup-help-head">${_coupCardIconHtml(c)}<strong>${_escapeHtml(c.name)}</strong></div>${_coupCardDescHtml(c)}</div>`
    ).join('');
    const toggle = document.getElementById('coup-help-toggle');
    const chevron = document.getElementById('coup-help-chevron');
    if (toggle && !toggle.dataset.bound) {
        toggle.dataset.bound = '1';
        toggle.addEventListener('click', () => {
            const open = help.classList.toggle('open');
            if (chevron) chevron.textContent = open ? '▲' : '▼';
            _sfx.tap();
        });
    }
}

function _showCoupModal(title, bodyHtml, setup) {
    document.querySelector('.coup-modal-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'coup-modal-overlay';
    overlay.innerHTML = `
        <div class="coup-modal-card" role="dialog" aria-modal="true">
            <button class="coup-modal-close" type="button" aria-label="close">×</button>
            <div class="coup-modal-spark">✦</div>
            <h3>${_escapeHtml(title)}</h3>
            <div class="coup-modal-body">${bodyHtml}</div>
        </div>`;
    document.getElementById("game-inner").appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    overlay.querySelector('.coup-modal-close')?.addEventListener('click', () => _closeCoupModal());
    overlay.addEventListener('click', e => { if (e.target === overlay) _closeCoupModal(); });
    _sfx.modalOpen();
    if (typeof setup === 'function') setup(overlay);
    _wireCoupModalCountdown(overlay);
    return overlay;
}

function _wireCoupModalCountdown(root = document) {
    const nodes = root.querySelectorAll?.('.coup-pending-countdown') || [];
    nodes.forEach(node => {
        const tick = () => {
            const left = Math.max(0, Math.ceil((parseInt(node.dataset.deadline, 10) - _now()) / 1000));
            node.textContent = `${left}s`;
            node.classList.toggle('urgent', left <= 10);
            if (left <= 0 && node._tickInterval) {
                clearInterval(node._tickInterval);
                delete node._tickInterval;
            }
        };
        tick();
        if (node._tickInterval) clearInterval(node._tickInterval);
        node._tickInterval = setInterval(tick, 500);
    });
}

function _closeCoupModal() {
    const overlay = document.querySelector('.coup-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    _sfx.modalClose();
    setTimeout(() => overlay.remove(), 220);

    // Re-enable Coup action buttons if they were disabled
    document.querySelectorAll('.coup-action-btn').forEach(btn => {
        if (btn.getAttribute('aria-disabled') !== 'true') {
            btn.disabled = false;
        }
    });
}

function _showCoupCardInfo(type, cards = coupCards) {
    const meta = cards[type] || cards.duke;
    _showCoupModal(meta.name, `<div class="coup-modal-card-info">${_coupCardLargeHtml(meta)}<p class="coup-card-desc">${_coupCardDescHtml(meta)}</p></div>`);
}

function _showCoupEvent(text, kind = 'notice') {
    if (!text) return;
    document.querySelector('.coup-event-toast')?.remove();
    const el = document.createElement('div');
    el
