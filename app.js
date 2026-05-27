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
        continue_discussion:"⏱️ ارجعو قطعو وريشو (دقيقة بركا)"
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
    coup: { title: '👑 كول وبوّع', start: '🚀 ابدا الكول', online: '🌐 العب أونلاين مع أصحابك' }
};
const thiefRoles = [
    { key:'thief', label:'سارق', icon:'🗝️', desc:'إنت السارق. حاول ما يفيقوش بيك.' },
    { key:'judge', label:'حاكم', icon:'⚖️', desc:'إنت الحاكم. بعد النقاش تختار شكون السارق.' },
    { key:'executioner', label:'جلّاد', icon:'🪓', desc:'إنت الجلّاد. تستنى حكم الحاكم.' }
];
const coupCards = {
    duke: { name:'الشلغمي', icon:'👑', desc:'ياخو 3 فلوس. وينجم يسكّر المعونة.' },
    assassin: { name:'حفار القبور', icon:'🗡️', desc:'يدفع 3 فلوس ويطيّح كارتة من لاعب.' },
    contessa: { name:'البية', icon:'💃', desc:'تسكّر الاغتيال وتنقذ صاحبها.' },
    ambassador: { name:'السمسار', icon:'🤝', desc:'يبدّل كوارط مع الدكّة وينجم يسكّر سرقة الرايس.' },
    captain: { name:'الرايس', icon:'⚓', desc:'يسرق زوز فلوس من لاعب، وينجم يسكّر السرقة.' }
};
let coupState = null;
let coupFocusedPlayerId = null;
let coupTimerInterval = null;
const COUP_DEFAULT_ACTION_MINUTES = 1;
const COUP_RESPONSE_SECONDS = 45;
let coupResponseInterval = null;
let coupOtherDecksCollapsed = false;
const coupActionHelp = {
    income: { title:'دخل +1', text:'تاخو 1 فلوس من البنك. ما تتسكرش وما حد ينجم يقولك تكذب خاطرها أكشن مفتوحة.' },
    foreignAid: { title:'معونة +2', text:'تاخو 2 فلوس من البنك. أي لاعب ينجم يقول عندو الشلغمي ويسكّرها. بعد البلوك، أي لاعب ينجم يتهمه بالبلوف.' },
    tax: { title:'الشلغمي +3', text:'تقول عندي الشلغمي وتاخو 3 فلوس من البنك. أي لاعب ينجم يقولك تكذب.' },
    steal: { title:'الرايس: اسرق', text:'تقول عندي الرايس وتسرق حتى زوز فلوس من لاعب. الهدف ينجم يسكّر بالرايس أو السمسار، وأي لاعب ينجم يتهم أي claim بالبلوف.' },
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
    if (current === next) return;
    document.querySelectorAll('.screen.exiting').forEach(s => s.classList.remove('exiting'));
    if (current) {
        current.classList.remove('active');
        current.classList.add('exiting');
        setTimeout(() => current.classList.remove('exiting'), 260);
    }
    requestAnimationFrame(() => next.classList.add('active'));
}

function setGameMode(mode, goSetup = true) {
    currentGameMode = ['impostor','thief','spyfall','coup'].includes(mode) ? mode : 'impostor';
    try { localStorage.setItem(GAME_MODE_KEY, currentGameMode); } catch(_) {}
    if (currentGameMode !== 'impostor') currentLang = 'tn';
    if (currentGameMode === 'coup') {
        timerConfig = COUP_DEFAULT_ACTION_MINUTES;
        const timerVal = document.getElementById('val-timer');
        if (timerVal) timerVal.innerText = timerConfig;
    }
    document.body.classList.add('game-switching');
    clearTimeout(document.body._gameSwitchTimer);
    document.body._gameSwitchTimer = setTimeout(() => document.body.classList.remove('game-switching'), 520);
    updateGameModeUI();
    if (goSetup) showScreen('setup-screen');
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
    row.innerHTML = `<input type="text" class="player-input" value="${savedName.replace(/"/g,'&quot;')}" placeholder="${i18n[currentLang].player_placeholder}">
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
            : `<strong style="font-size:1.45rem">📍 ${player.locationName}</strong><br><br><span style="font-size:16px;">دورك: ${player.locationRole}</span>`;
    } else if (player.isImpostor) {
        roleText = noHintsMode
            ? i18n[currentLang].impostor_role
            : `${i18n[currentLang].impostor_role}<br><br><span style="font-size:16px;">${i18n[currentLang].hint_label}</span><br>${player.customHint}`;
    } else {
        roleText = `${i18n[currentLang].citizen_role}<br><br><span style="font-size:16px;">${i18n[currentLang].word_label}</span><br>${currentWordObj.word}`;
    }
    const card = document.createElement('div'); card.className = 'flip-card';
    card.innerHTML = `<div class="card-face card-front"><span>${i18n[currentLang].card_of}${player.name}</span></div>
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
    card.addEventListener('mousedown',showCard); card.addEventListener('mouseup',hideCard); card.addEventListener('mouseleave',hideCard);
    card.addEventListener('touchstart',showCard,{passive:false}); card.addEventListener('touchend',hideCard,{passive:false}); card.addEventListener('touchcancel',hideCard,{passive:false});
    container.appendChild(card);
    _updateSeenPanel();
}
function _updateSeenPanel() {
    const panel = document.getElementById('reveal-seen-panel');
    if (!panel) return;
    panel.innerHTML = players.map(p =>
        `<span class="seen-chip ${p.viewedCard ? 'done' : ''}">${p.viewedCard ? '✅' : '⏳'} ${p.name}</span>`
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
        const allImps = players.filter(p=>p.isImpostor).map(p=>p.name).join(' و ');
        revealBox.innerHTML = `${trans.impostors_were}<br><strong style="color:var(--primary-color);">${allImps}</strong><br><br>${trans.word_was} <strong>${currentWordObj.word}</strong>`;
        nextBtn.innerText = trans.next_round_btn; nextBtn.onclick = () => showScreen('setup-screen');
    } else {
        votedPlayer.eliminated = true;
        const rI = players.filter(p=>p.isImpostor&&!p.eliminated);
        const rR = players.filter(p=>!p.isImpostor&&!p.eliminated);
        if (rI.length===0) {
            triggerAnimation('win'); resultMsg.innerText = trans.all_impostors_dead;
            revealBox.innerHTML = `${trans.word_was} <strong>${currentWordObj.word}</strong>`;
            nextBtn.innerText = trans.next_round_btn; nextBtn.onclick = () => showScreen('setup-screen');
        } else if (rI.length>=rR.length) {
            triggerAnimation('lose'); resultMsg.innerText = trans.impostors_win;
            const allImps = players.filter(p=>p.isImpostor).map(p=>p.name).join(' و ');
            revealBox.innerHTML = `${trans.impostors_were}<br><strong style="color:var(--primary-color);">${allImps}</strong><br><br>${trans.word_was} <strong>${currentWordObj.word}</strong>`;
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
    revealBox.innerHTML = `الspy: <strong style="color:var(--primary-color)">${spy?.name || '?'}</strong><br>البلاصة: <strong>${spy?.locationName || '?'}</strong>`;
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
    revealBox.innerHTML = `السارق: <strong>${thief?.name || '?'}</strong><br>الحاكم: <strong>${judge?.name || '?'}</strong><br>الجلّاد: <strong>${executioner?.name || '?'}</strong>`;
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
    state.turnEndsAt = Date.now() + (_coupActionMinutes(state) * 60000);
}

function _coupSetResponseDeadline(pending) {
    pending.expiresAt = Date.now() + COUP_RESPONSE_SECONDS * 1000;
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

function _renderCoupRoleHelp(cards = coupCards) {
    const help = document.getElementById('coup-role-help');
    if (!help) return;
    help.innerHTML = Object.values(cards).map(c =>
        `<div class="coup-help-item">${c.icon} <strong>${_escapeHtml(c.name)}</strong><span>${_escapeHtml(c.desc)}</span></div>`
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
    document.body.appendChild(overlay);
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
            const left = Math.max(0, Math.ceil((parseInt(node.dataset.deadline, 10) - Date.now()) / 1000));
            node.textContent = `${left}s`;
            node.classList.toggle('urgent', left <= 10);
        };
        tick();
    });
}

function _closeCoupModal() {
    const overlay = document.querySelector('.coup-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    _sfx.modalClose();
    setTimeout(() => overlay.remove(), 220);
}

function _showCoupCardInfo(type, cards = coupCards) {
    const meta = cards[type] || cards.duke;
    _showCoupModal(`${meta.icon} ${meta.name}`, `<p class="coup-card-desc">${_escapeHtml(meta.desc)}</p>`);
}

function _showCoupEvent(text, kind = 'notice') {
    if (!text) return;
    document.querySelector('.coup-event-toast')?.remove();
    const el = document.createElement('div');
    el.className = `coup-event-toast ${kind}`;
    el.innerHTML = `<div class="coup-event-icon">${kind === 'bad' ? '💥' : kind === 'good' ? '✨' : '🎭'}</div><div>${_escapeHtml(text)}</div>`;
    document.body.appendChild(el);
    _sfx.reaction(kind === 'bad' ? 'caught' : 'fire');
    setTimeout(() => el.remove(), 2600);
}
window.CoupUI = {
    escapeHtml: _escapeHtml,
    formatSeconds: _formatSeconds,
    renderRoleHelp: _renderCoupRoleHelp,
    showModal: _showCoupModal,
    closeModal: _closeCoupModal,
    showCardInfo: _showCoupCardInfo,
    showEvent: _showCoupEvent
};

function startCoupOffline() {
    saveSettings();
    const namesInput = Array.from(document.querySelectorAll('.player-input'))
        .map((inp,idx)=>inp.value.trim()||`لاعب ${idx+1}`);
    if (namesInput.length < 2) {
        document.getElementById('setup-error').innerText='يلزم زوز لاعبين على الأقل باش تلعب كول وبوّع.';
        _sfx.error();
        return;
    }
    const deck = _coupBuildDeck();
    coupState = {
        online:false,
        deck,
        turnIndex:0,
        pending:null,
        actionMinutes:_coupActionMinutes(),
        turnEndsAt:Date.now() + (_coupActionMinutes() * 60000),
        log:'كل واحد بدا بزوز فلوس وزوز كوارط. بلوف قد ما تحب، أما كان قالولك "تكذب!" حضّر روحك.',
        players:namesInput.map((name, idx) => ({
            id:'local_'+idx,
            name,
            coins:2,
            hand:[{type:deck.pop(),lost:false},{type:deck.pop(),lost:false}]
        }))
    };
    document.getElementById('setup-error').innerText='';
    renderCoupScreen();
    showScreen('coup-screen');
    _sfx.gameStart();
}

function startCoupTurnTimer(state = coupState, myId = null) {
    clearInterval(coupTimerInterval);
    const timerEl = document.getElementById('coup-action-timer');
    if (!timerEl || !state) return;
    const tick = () => {
        if (!state.turnEndsAt) _coupSetTurnDeadline(state);
        const left = Math.ceil((state.turnEndsAt - Date.now()) / 1000);
        timerEl.textContent = _formatSeconds(left);
        timerEl.classList.toggle('urgent', left <= 10);
        if (left <= 0 && !state.pending && _coupAlive(state).length > 1) coupHandleTimeout();
    };
    tick();
    coupTimerInterval = setInterval(tick, 1000);
}

function coupHandleTimeout() {
    if (!coupState || coupState.pending || coupState._timingOut) return;
    coupState._timingOut = true;
    const actor = coupState.players[coupState.turnIndex];
    if (actor && actor.hand.some(c=>!c.lost)) {
        actor.coins += 1;
        coupState.log = `${actor.name} فات الوقت، خذا دخل +1 وعدّى الدور.`;
        _showCoupEvent('الوقت وفى، تعدّى الدور', 'notice');
    }
    _coupNextTurn();
    coupState._timingOut = false;
    renderCoupScreen();
}

function renderCoupScreen(state = coupState, myId = null) {
    if (!state) return;
    const alive = _coupAlive(state);
    const current = state.players[state.turnIndex];
    document.getElementById('coup-deck-pill').innerText = `🂠 ${state.deck.length}`;
    document.getElementById('coup-status').innerText = alive.length <= 1
        ? `🏆 ${alive[0]?.name || ''} ربح الطرح!`
        : (state.pending ? state.log : `الدور على ${current.name}. ${state.log || ''}`);
    const board = document.getElementById('coup-player-board');
    board.innerHTML = '';
    const myIndex = myId ? state.players.findIndex(p => p.id === myId) : state.turnIndex;
    const orderedPlayers = [
        ...state.players.map((p, idx) => ({p, idx})).filter(x => x.idx === myIndex),
        ...state.players.map((p, idx) => ({p, idx})).filter(x => x.idx !== myIndex)
    ];
    const renderPlayerCard = (p, idx) => {
        const isMe = myId ? p.id === myId : idx === state.turnIndex;
        const visible = isMe || !myId;
        const focused = coupFocusedPlayerId === p.id || (!coupFocusedPlayerId && isMe);
        const dimmed = !!coupFocusedPlayerId && coupFocusedPlayerId !== p.id;
        const out = !p.hand.some(c=>!c.lost);
        const div = document.createElement('div');
        div.className = 'coup-player-card' + (idx===state.turnIndex?' is-turn':'') + (isMe?' is-me':'') + (focused?' is-focused':'') + (dimmed?' is-dimmed':'') + (out?' is-out':'');
        div.dataset.playerId = p.id;
        div.innerHTML = `<div class="coup-player-head"><span>${_escapeHtml(p.name)}${isMe && myId?' <span class="you-tag">أنا</span>':''}</span><span class="coup-coins">🪙 ${p.coins}</span></div>
            <div class="coup-influence-row">${p.hand.map(c => {
                const meta = coupCards[c.type] || coupCards.duke;
                const label = visible || c.lost ? `${meta.icon} ${meta.name}` : '🂠 مخبية';
                const info = (visible || c.lost) ? `<button class="coup-card-info" type="button" data-card-type="${c.type}" aria-label="info">ℹ️</button>` : '';
                return `<div class="coup-influence ${c.lost?'lost':''}"><span>${label}</span>${info}</div>`;
            }).join('')}</div>`;
        div.addEventListener('click', e => {
            if (e.target.closest('.coup-card-info')) return;
            coupFocusedPlayerId = coupFocusedPlayerId === p.id ? null : p.id;
            renderCoupScreen(state, myId);
        });
        div.querySelectorAll('.coup-card-info').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                _showCoupCardInfo(btn.dataset.cardType);
            });
        });
        return div;
    };
    if (state.pending) board.appendChild(_renderCoupPendingBanner(state));
    const mine = orderedPlayers[0];
    if (mine) {
        const label = document.createElement('div');
        label.className = 'coup-my-deck-label';
        label.textContent = 'كوارطي';
        board.appendChild(label);
        board.appendChild(renderPlayerCard(mine.p, mine.idx));
    }
    const othersHeader = document.createElement('button');
    othersHeader.type = 'button';
    othersHeader.className = 'coup-other-divider';
    othersHeader.innerHTML = `<span></span><strong>كوارط اللاعبين الأخرين</strong><span></span><em>${coupOtherDecksCollapsed ? '▼' : '▲'}</em>`;
    othersHeader.addEventListener('click', () => {
        coupOtherDecksCollapsed = !coupOtherDecksCollapsed;
        renderCoupScreen(state, myId);
    });
    board.appendChild(othersHeader);
    const othersWrap = document.createElement('div');
    othersWrap.className = 'coup-other-decks' + (coupOtherDecksCollapsed ? ' collapsed' : '');
    orderedPlayers.slice(1).forEach(({p, idx}) => {
        othersWrap.appendChild(renderPlayerCard(p, idx));
    });
    board.appendChild(othersWrap);
    _renderCoupRoleHelp(coupCards);
    startCoupTurnTimer(state, myId);
    renderCoupActions(state, myId);
}

function renderCoupActions(state = coupState, myId = null) {
    const panel = document.getElementById('coup-action-panel');
    panel.innerHTML = '';
    const alive = _coupAlive(state);
    if (alive.length <= 1) {
        const btn = document.createElement('button');
        btn.className = 'primary-btn';
        btn.innerText = '🔄 عاود انده';
        btn.onclick = () => showScreen('setup-screen');
        panel.appendChild(btn);
        return;
    }
    const me = myId ? state.players.find(p=>p.id===myId) : state.players[state.turnIndex];
    const isTurn = me && me.id === state.players[state.turnIndex].id;
    if (state.pending) {
        panel.innerHTML = `<div class="coup-panel-card live">${_escapeHtml(state.log)}</div>`;
        return;
    }
    const current = state.players[state.turnIndex];
    if (!isTurn) {
        panel.innerHTML = `<div class="coup-panel-card">استنى دورك. الدور توّة على ${_escapeHtml(current?.name || '')}.</div>`;
    }
    const disabled = isTurn ? '' : 'is-action-disabled';
    const mk = (txt, action, cls='', hint='') => `<button class="coup-action-btn ${cls} ${disabled}" data-action="${action}" aria-disabled="${isTurn ? 'false' : 'true'}"><strong>${txt}<span class="coup-action-info" data-action-info="${action}">ℹ️</span></strong><small>${hint}</small></button>`;
    panel.innerHTML += `<div class="coup-action-grid ${isTurn?'':'is-disabled'}">
        ${mk('🪙 دخل +1','income','','مضمون وما يتكذبش')}
        ${mk('🤲 معونة +2','foreignAid','','ينجم الشلغمي يسكّرها')}
        ${mk('👑 الشلغمي +3','tax','primary-action','قول عندي الشلغمي')}
        ${mk('⚓ الرايس: اسرق','steal','primary-action','اسرق زوز فلوس')}
        ${mk('🗡️ اغتيال -3','assassinate','danger-action','يلزم حفار القبور')}
        ${mk('🤝 السمسار: بدّل','exchange','','بدّل كوارطك مع الدكّة')}
        ${mk('💥 Coup -7','coup','danger-action','ضربة ما تتسكرش')}
    </div>`;
    panel.querySelectorAll('.coup-action-info').forEach(info => info.addEventListener('click', e => {
        e.stopPropagation();
        const meta = coupActionHelp[info.dataset.actionInfo];
        if (meta) _showCoupModal(meta.title, `<p class="coup-card-desc">${_escapeHtml(meta.text)}</p>`);
    }));
    panel.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', e => {
        if (e.target.closest('.coup-action-info')) return;
        if (btn.getAttribute('aria-disabled') === 'true') return;
        coupChooseAction(btn.dataset.action);
    }));
}

function _renderCoupPendingBanner(state = coupState) {
    const p = state.pending;
    const claimantId = _coupPendingClaimantId(p);
    const isBlockStage = p.stage === 'block';
    const actor = state.players.find(x=>x.id===p.actorId);
    const blocker = state.players.find(x=>x.id===p.blockerId);
    const target = state.players.find(x=>x.id===p.targetId);
    const wrap = document.createElement('div');
    wrap.className = 'coup-pending-banner';
    const responders = _coupPendingResponders(state, p);
    const challengeButtons = responders.map(player =>
        `<button class="coup-target-btn danger-action" data-banner-challenge="${player.id}">${_escapeHtml(player.name)}: تكذب!</button>`
    ).join('');
    const passButtons = responders.filter(player => !(p.passes || []).includes(player.id)).map(player =>
        `<button class="coup-target-btn quiet-action" data-banner-pass="${player.id}">${_escapeHtml(player.name)}: ما عندي حتى اعتراض</button>`
    ).join('');
    const blockButtons = !isBlockStage && p.blockable
        ? (p.action === 'foreignAid' ? responders : responders.filter(x => x.id === p.targetId)).map(player =>
            _coupBlockOptions(p).map(opt => `<button class="coup-target-btn" data-banner-block="${player.id}" data-block-role="${opt.role}">${_escapeHtml(player.name)}: نسكّرها ب${opt.label}</button>`).join('')
        ).join('')
        : '';
    wrap.innerHTML = `
        <div class="coup-pending-title">قرار مباشر</div>
        <strong>${_escapeHtml(state.log || '')}</strong>
        <p>${isBlockStage ? `${_escapeHtml(blocker?.name || '')} قال يسكّر. أي لاعب ينجم يقول تكذب.` : `${target ? `${_escapeHtml(target.name)} مستهدف. ` : ''}أي لاعب ينجم يقول تكذب أو ما عنديش اعتراض.`}</p>
        ${_coupPendingTimerHtml(p)}
        <div class="coup-pass-progress">${_coupPassCount(state, p)}/${responders.length} قالو ما عندهم حتى اعتراض</div>
        <div class="coup-pending-actions">${challengeButtons}${blockButtons}${passButtons}</div>
    `;
    wrap.querySelectorAll('[data-banner-challenge]').forEach(btn => btn.addEventListener('click', () => {
        isBlockStage ? coupChallengeBlock(btn.dataset.bannerChallenge) : coupChallenge(btn.dataset.bannerChallenge);
    }));
    wrap.querySelectorAll('[data-banner-block]').forEach(btn => btn.addEventListener('click', () => coupBlock(btn.dataset.bannerBlock, btn.dataset.blockRole)));
    wrap.querySelectorAll('[data-banner-pass]').forEach(btn => btn.addEventListener('click', () => coupPassPending(btn.dataset.bannerPass)));
    return wrap;
}

function coupChooseAction(action) {
    const actor = coupState.players[coupState.turnIndex];
    const needsTarget = ['assassinate','coup','steal'].includes(action);
    if (action === 'assassinate' && actor.coins < 3) return showToast('يلزمك 3 فلوس للاغتيال.');
    if (action === 'coup' && actor.coins < 7) return showToast('يلزمك 7 فلوس للCoup.');
    if (needsTarget) return coupPickTarget(action);
    const actionName = coupActionName(action);
    _showCoupModal(actionName, `
        <p>باش تعمل <strong>${_escapeHtml(actionName)}</strong>. كان فيها بلوف، اللاعبين ينجموا يقولو "تكذب!".</p>
        <button class="primary-btn" id="coup-confirm-action">كمّل</button>
    `, overlay => {
        overlay.querySelector('#coup-confirm-action')?.addEventListener('click', () => {
            _closeCoupModal();
            coupStartPending(action, null);
        });
    });
}

function coupPickTarget(action) {
    const actor = coupState.players[coupState.turnIndex];
    const targets = _coupAlive().filter(p=>p.id!==actor.id);
    _showCoupModal(action === 'steal' ? 'اختار شكون تسرق' : 'اختار شكون تضرب', `
        <p>${action === 'steal' ? 'الرايس يسرق حتى زوز فلوس من لاعب.' : action === 'assassinate' ? 'حفار القبور يحتاج هدف واضح.' : 'Coup ضربة مباشرة وما تتسكرش.'}</p>
        <div class="coup-target-grid">${targets.map(p => `<button class="coup-target-btn" data-target-id="${p.id}">${_escapeHtml(p.name)}</button>`).join('')}</div>
    `, overlay => {
        overlay.querySelectorAll('[data-target-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                _closeCoupModal();
                coupStartPending(action, btn.dataset.targetId);
            });
        });
    });
}

function coupStartPending(action, targetId) {
    const actor = coupState.players[coupState.turnIndex];
    const claims = { tax:'duke', assassinate:'assassin', exchange:'ambassador', steal:'captain' };
    const blockRoles = action === 'foreignAid' ? ['duke'] : action === 'assassinate' ? ['contessa'] : action === 'steal' ? ['captain','ambassador'] : [];
    const blockable = blockRoles.length > 0;
    const claim = claims[action] || null;
    if (!claim && !blockable) return coupResolveAction(action, targetId);
    coupState.pending = { id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, action, actorId:actor.id, targetId, claim, blockable, blockRoles, passes:[] };
    _coupSetResponseDeadline(coupState.pending);
    coupState.log = `${actor.name} قال يعمل ${coupActionName(action)}. تنجمو تقولو "تكذب!"${blockable?' ولا تسكروها.':''}`;
    _showCoupEvent(`${actor.name} عمل ${coupActionName(action)}`, 'notice');
    renderCoupChallengePanel();
}

function coupActionName(action) {
    return {income:'دخل',foreignAid:'معونة',tax:'ضريبة الشلغمي',assassinate:'اغتيال',exchange:'تبديل السمسار',steal:'سرقة الرايس',coup:'Coup'}[action] || action;
}

function _coupStartResponseTimer(onExpire) {
    clearInterval(coupResponseInterval);
    const tick = () => {
        _wireCoupModalCountdown(document);
        const p = coupState?.pending;
        if (!p?.expiresAt) return;
        if (Date.now() >= p.expiresAt) {
            clearInterval(coupResponseInterval);
            coupResponseInterval = null;
            _closeCoupModal();
            onExpire?.();
        }
    };
    tick();
    coupResponseInterval = setInterval(tick, 500);
}

function _coupPendingTimerHtml(p) {
    return `<div class="coup-decision-timer">وقت القرار <strong class="coup-pending-countdown" data-deadline="${p.expiresAt}">${COUP_RESPONSE_SECONDS}s</strong></div>`;
}

function renderCoupChallengePanel() {
    renderCoupScreen();
    const p = coupState.pending;
    const actor = coupState.players.find(x=>x.id===p.actorId);
    const target = coupState.players.find(x=>x.id===p.targetId);
    const challengers = _coupAlive().filter(x=>x.id!==actor.id);
    const blockers = p.action === 'foreignAid' ? challengers : challengers.filter(x => x.id === p.targetId);
    const challengeButtons = p.claim ? challengers.map(c =>
        `<button class="coup-target-btn danger-action" data-challenge-id="${c.id}">${_escapeHtml(c.name)}: تكذب!</button>`
    ).join('') : '';
    const passButtons = _coupPendingResponders(coupState, p).filter(c => !(p.passes || []).includes(c.id)).map(c =>
        `<button class="coup-target-btn quiet-action" data-pass-id="${c.id}">${_escapeHtml(c.name)}: ما عندي حتى اعتراض</button>`
    ).join('');
    const blockButtons = p.blockable ? blockers.map(c => _coupBlockOptions(p).map(opt =>
        `<button class="coup-target-btn" data-block-id="${c.id}" data-block-role="${opt.role}">${_escapeHtml(c.name)}: نسكّرها ب${opt.label}</button>`
    ).join('')).join('') : '';
    const targetLine = target ? `<p class="coup-decision-hint">${_escapeHtml(target.name)}، تنجم تسكّر الأكشن كان عندك الكارتة المناسبة، ولا تقول للّي هاجمك "تكذب!".</p>` : '';
    _showCoupModal('بوّع ولا صحيح؟', `
        <p>${_escapeHtml(coupState.log)}</p>
        ${targetLine}
        ${_coupPendingTimerHtml(p)}
        <div class="coup-pass-progress">${_coupPassCount(coupState, p)}/${_coupPendingResponders(coupState, p).length} قالو ما عندهم حتى اعتراض</div>
        <div class="coup-target-grid">${challengeButtons}${blockButtons}${passButtons}</div>
    `, overlay => {
        overlay.querySelectorAll('[data-challenge-id]').forEach(btn => btn.addEventListener('click', () => { _closeCoupModal(); coupChallenge(btn.dataset.challengeId); }));
        overlay.querySelectorAll('[data-block-id]').forEach(btn => btn.addEventListener('click', () => { _closeCoupModal(); coupBlock(btn.dataset.blockId, btn.dataset.blockRole); }));
        overlay.querySelectorAll('[data-pass-id]').forEach(btn => btn.addEventListener('click', () => { _closeCoupModal(); coupPassPending(btn.dataset.passId); }));
    });
    _coupStartResponseTimer(() => coupResolveAction(p.action, p.targetId));
}

function coupLoseInfluence(playerId) {
    const p = coupState.players.find(x=>x.id===playerId);
    const card = _coupPublicCard(p);
    if (card) {
        card.lost = true;
        const meta = coupCards[card.type] || coupCards.duke;
        _showCoupEvent(`${p.name} خسر ${meta.name}`, 'bad');
    }
}

function coupChallenge(challengerId) {
    const p = coupState.pending;
    const actor = coupState.players.find(x=>x.id===p.actorId);
    const challenger = coupState.players.find(x=>x.id===challengerId);
    const hasIt = actor.hand.some(c=>!c.lost && c.type===p.claim);
    if (hasIt) {
        coupLoseInfluence(challengerId);
        coupState.log = `${challenger.name} طلع غالط! ${actor.name} ورّى الكارتة و${funWrongAccuser()}`;
        _showCoupEvent(coupState.log, 'bad');
        _sfx.lose();
        coupResolveAction(p.action, p.targetId);
    } else {
        coupLoseInfluence(actor.id);
        coupState.log = `${actor.name} تڨبض يبوّع! ${funCaughtBluff()}`;
        coupState.pending = null;
        _coupNextTurn();
        triggerAnimation('lose');
        renderCoupScreen();
    }
}

function coupPassPending(playerId) {
    const p = coupState.pending;
    if (!p) return;
    const claimantId = _coupPendingClaimantId(p);
    if (playerId === claimantId) return;
    p.passes = Array.from(new Set([...(p.passes || []), playerId]));
    if (_coupAllPassed(coupState, p)) {
        _closeCoupModal();
        if (p.stage === 'block') coupAcceptBlock();
        else coupResolveAction(p.action, p.targetId);
    } else {
        renderCoupScreen();
        if (p.stage === 'block') renderCoupBlockChallengePanel();
        else renderCoupChallengePanel();
    }
}

function coupBlock(blockerId, blockRole = null) {
    const p = coupState.pending;
    const blocker = coupState.players.find(x=>x.id===blockerId);
    const blockRoles = p.blockRoles || (p.action === 'assassinate' ? ['contessa'] : p.action === 'steal' ? ['captain','ambassador'] : ['duke']);
    const role = blockRole && blockRoles.includes(blockRole) ? blockRole : blockRoles[0];
    coupState.pending = {...p, id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, stage:'block', blockerId, blockRole:role, passes:[]};
    _coupSetResponseDeadline(coupState.pending);
    coupState.log = `${blocker.name} قال يسكّرها ب${_coupBlockRoleLabel(role)}. ${coupState.players.find(x=>x.id===p.actorId)?.name || ''} ينجم يقوللو "تكذب!".`;
    renderCoupBlockChallengePanel();
}

function renderCoupBlockChallengePanel() {
    renderCoupScreen();
    const p = coupState.pending;
    const actor = coupState.players.find(x=>x.id===p.actorId);
    const blocker = coupState.players.find(x=>x.id===p.blockerId);
    const challengeButtons = _coupPendingResponders(coupState, p).map(c =>
        `<button class="coup-target-btn danger-action" data-challenge-block-id="${c.id}">${_escapeHtml(c.name)}: تكذب على البلوك!</button>`
    ).join('');
    const passButtons = _coupPendingResponders(coupState, p).filter(c => !(p.passes || []).includes(c.id)).map(c =>
        `<button class="coup-target-btn quiet-action" data-pass-id="${c.id}">${_escapeHtml(c.name)}: ما عندي حتى اعتراض</button>`
    ).join('');
    _showCoupModal('سكّرها، أما صحيح؟', `
        <p>${_escapeHtml(coupState.log)}</p>
        <p class="coup-decision-hint">أي لاعب غير ${_escapeHtml(blocker?.name || '')} ينجم يتهم البلوك بالبلوف، ولا يعمل ما عندي حتى اعتراض.</p>
        ${_coupPendingTimerHtml(p)}
        <div class="coup-pass-progress">${_coupPassCount(coupState, p)}/${_coupPendingResponders(coupState, p).length} قالو ما عندهم حتى اعتراض</div>
        <div class="coup-target-grid">${challengeButtons}${passButtons}</div>
    `, overlay => {
        overlay.querySelectorAll('[data-challenge-block-id]').forEach(btn => btn.addEventListener('click', () => { _closeCoupModal(); coupChallengeBlock(btn.dataset.challengeBlockId); }));
        overlay.querySelectorAll('[data-pass-id]').forEach(btn => btn.addEventListener('click', () => { _closeCoupModal(); coupPassPending(btn.dataset.passId); }));
    });
    _coupStartResponseTimer(coupAcceptBlock);
}

function coupAcceptBlock() {
    const p = coupState.pending;
    const blocker = coupState.players.find(x=>x.id===p?.blockerId);
    coupState.log = `${blocker?.name || ''} سكّر الأكشن. تعدّت بسلام.`;
    coupState.pending = null;
    _coupNextTurn();
    _showCoupEvent(coupState.log, 'good');
    _sfx.notify();
    renderCoupScreen();
}

function coupChallengeBlock(challengerId = null) {
    const p = coupState.pending;
    const actor = coupState.players.find(x=>x.id===p.actorId);
    const challenger = coupState.players.find(x=>x.id===challengerId) || actor;
    const blocker = coupState.players.find(x=>x.id===p.blockerId);
    const hasIt = blocker.hand.some(c=>!c.lost && c.type===p.blockRole);
    if (hasIt) {
        coupLoseInfluence(challenger.id);
        coupState.log = `${challenger.name} اتهم البلوك وطلع غالط. ${blocker.name} عندو ${_coupBlockRoleLabel(p.blockRole)}.`;
        coupState.pending = null;
        _coupNextTurn();
        _showCoupEvent(coupState.log, 'bad');
        renderCoupScreen();
    } else {
        coupLoseInfluence(blocker.id);
        coupState.log = `${blocker.name} حاول يسكّرها وطلع يبوّع! الأكشن يكمل.`;
        _showCoupEvent(coupState.log, 'bad');
        coupResolveAction(p.action, p.targetId);
    }
}

function coupResolveAction(action, targetId) {
    const actor = coupState.players.find(p=>p.id===coupState.pending?.actorId) || coupState.players[coupState.turnIndex];
    const target = coupState.players.find(p=>p.id===targetId);
    coupState.pending = null;
    if (action === 'income') { actor.coins += 1; coupState.log = `${actor.name} خذا دينار. رزق بارد.`; }
    if (action === 'foreignAid') { actor.coins += 2; coupState.log = `${actor.name} خذا معونة. ما فماش شلغمي سكّرها.`; }
    if (action === 'tax') { actor.coins += 3; coupState.log = `${actor.name} كول بالشلغمي وخذا 3 فلوس.`; }
    if (action === 'exchange') {
        const live = actor.hand.filter(c=>!c.lost);
        live.forEach(c => coupState.deck.unshift(c.type));
        coupState.deck.sort(()=>0.5-Math.random());
        actor.hand = actor.hand.map(c => c.lost ? c : {type:coupState.deck.pop(), lost:false});
        coupState.log = `${actor.name} بدل كوارطو مع الدكّة. السمسار خدم خدمتو.`;
    }
    if (action === 'steal' && target) {
        const amount = Math.min(2, target.coins || 0);
        target.coins -= amount;
        actor.coins += amount;
        coupState.log = amount > 0 ? `${actor.name} سرق ${amount} فلوس من ${target.name}. الرايس دخل للمرسى.` : `${actor.name} حاول يسرق ${target.name} أما ما لقى شي.`;
    }
    if (action === 'assassinate' && target) { actor.coins -= 3; coupLoseInfluence(target.id); coupState.log = `${target.name} تضرّب من حفار القبور وخسر كارتة.`; }
    if (action === 'coup' && target) { actor.coins -= 7; coupLoseInfluence(target.id); coupState.log = `${actor.name} عمل Coup على ${target.name}. ما فيها حتى بلوك.`; }
    _showCoupEvent(coupState.log, ['assassinate','coup'].includes(action) ? 'bad' : 'good');
    _coupNextTurn();
    renderCoupScreen();
}

function funCaughtBluff() {
    return ['يا ساتر عالبهامة!','الكذبة طلعت بريحة الهريسة.','قالها بثقة أما الكارتة خانتو.','تقصّت عليه كي ورقة كاشفة.'][Math.floor(Math.random()*4)];
}
function funWrongAccuser() {
    return ['اكلها في عوضو.','عمل روحو كونان وطلع غلط.','قال تكذب، طلعت هو الي يحلم.','دخل روحو في حيط.'][Math.floor(Math.random()*4)];
}



// ============================================================
// DOM READY — wire everything up
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {

    try { currentGameMode = localStorage.getItem(GAME_MODE_KEY) || 'impostor'; } catch(_) { currentGameMode = 'impostor'; }
    if (!['impostor','thief','spyfall','coup'].includes(currentGameMode)) currentGameMode = 'impostor';
    currentLang = 'tn';
    x18Unlocked = hasRememberedX18Unlock();
    applyTranslations();

    // Load saved settings
    const parsed = await loadSettings();
    if (parsed) {
        currentLang = 'tn';
        _togSet('t-random', parsed.randomImpostors);
        _togSet('t-chaos', parsed.chaos);
        _togSet('t-elimination', parsed.elimination);
        _togSet('t-nohint', parsed.noHints);
        _togSet('t-allhint', parsed.allCorrect);
        impostorConfig = parsed.impostors||1;
        timerConfig = parsed.timer||3;
        if (parsed.players&&parsed.players.length>0) parsed.players.forEach(n=>addPlayerInput(n));
        else for(let i=0;i<4;i++) addPlayerInput();
    } else {
        for(let i=0;i<4;i++) addPlayerInput();
    }
    if (currentGameMode === 'coup') timerConfig = COUP_DEFAULT_ACTION_MINUTES;
    document.getElementById('val-impostors').innerText = impostorConfig;
    document.getElementById('val-timer').innerText = timerConfig;
    applyTranslations();
    checkRules();
    updateGameModeUI();

    document.querySelectorAll('[data-game-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            setGameMode(btn.dataset.gameMode, true);
            document.getElementById('game-switch-menu')?.classList.add('hidden');
        });
    });
    document.getElementById('back-to-mode-select-btn')?.addEventListener('click', showModeSelect);
    document.getElementById('game-title-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        if (document.querySelector('.screen.active')?.id === 'mode-select-screen') return;
        document.getElementById('game-switch-menu')?.classList.toggle('hidden');
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.app-header')) document.getElementById('game-switch-menu')?.classList.add('hidden');
    });

    // ADD PLAYER
    document.getElementById('add-player-btn').addEventListener('click', () => { addPlayerInput(); saveSettings(); });

    // RESET
    document.getElementById('reset-settings-btn').addEventListener('click', async () => {
        if (!confirm(i18n[currentLang].reset_confirm)) return;
        try {
            const db = await dbPromise;
            if(db) db.transaction('settingsStore','readwrite').objectStore('settingsStore').delete('game_settings');
        } catch(e) {}
        impostorConfig=1; timerConfig=3;
        document.getElementById('val-impostors').innerText='1';
        document.getElementById('val-timer').innerText='3';
        ['t-random','t-chaos','t-elimination','t-nohint','t-allhint'].forEach(id=>_togSet(id,false));
        document.getElementById('players-inputs-container').innerHTML='';
        playerCount=0; for(let i=0;i<4;i++) addPlayerInput();
        checkRules(); saveSettings();
    });

    // COUNTERS
    document.getElementById('imp-minus').addEventListener('click',()=>{if(impostorConfig>1){impostorConfig--;document.getElementById('val-impostors').innerText=impostorConfig;saveSettings();}});
    document.getElementById('imp-plus').addEventListener('click',()=>{impostorConfig++;document.getElementById('val-impostors').innerText=impostorConfig;saveSettings();});
    document.getElementById('timer-minus').addEventListener('click',()=>{if(timerConfig>1){timerConfig--;document.getElementById('val-timer').innerText=timerConfig;saveSettings();}});
    document.getElementById('timer-plus').addEventListener('click',()=>{timerConfig++;document.getElementById('val-timer').innerText=timerConfig;saveSettings();});

    // ADVANCED PANEL
    document.getElementById('adv-toggle-btn').addEventListener('click',()=>{
        const p=document.getElementById('adv-panel'); p.classList.toggle('open');
        document.getElementById('adv-chevron').innerText=p.classList.contains('open')?'▲':'▼';
    });

    // TOGGLES
    document.querySelectorAll('.toggle-switch').forEach(t=>{
        t.addEventListener('click',function(){
            if(this.parentElement.classList.contains('disabled-ui')) return;
            this.classList.toggle('active'); checkRules();
        });
    });

    // INFO MODAL
    document.querySelectorAll('.info-icon').forEach(icon=>{
        icon.addEventListener('click',e=>{
            e.stopPropagation();
            const key = e.target.getAttribute('data-info');
            document.getElementById('info-modal-text').innerText = infoDescriptions[key][currentLang];
            openModal('info-modal');
        });
    });
    document.getElementById('close-info-btn').addEventListener('click',()=>closeModal('info-modal'));

    // LANGUAGE / PASSWORD
    document.querySelectorAll('.lang-pill-btn').forEach(btn=>{
        btn.addEventListener('click',function(){
            const lang = this.getAttribute('data-lang');
            if (lang==='x18') {
                if (!x18Unlocked) {
                    document.getElementById('password-input').value='';
                    document.getElementById('password-error').style.display='none';
                    openModal('password-modal');
                    setTimeout(()=>document.getElementById('password-input').focus(),350);
                    return;
                }
            }
            currentLang=lang; applyTranslations(); saveSettings();
        });
    });

    document.getElementById('password-confirm-btn').addEventListener('click',()=>{
        const val = document.getElementById('password-input').value;
        if (val==='simba') {
            x18Unlocked=true; currentLang='x18'; applyTranslations();
            if (document.getElementById('pw-remember-toggle').checked) rememberX18Unlock();
            saveSettings();
            closeModal('password-modal');
        } else {
            document.getElementById('password-error').style.display='block';
            document.getElementById('password-input').value='';
            document.getElementById('password-input').classList.add('shake-input');
            setTimeout(()=>document.getElementById('password-input').classList.remove('shake-input'),400);
            _sfx.error();
        }
    });
    document.getElementById('password-input').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('password-confirm-btn').click();});
    document.getElementById('password-cancel-btn').addEventListener('click',()=>closeModal('password-modal'));

    // START OFFLINE GAME
    document.getElementById('start-game-btn').addEventListener('click',()=>{
        if (currentGameMode === 'thief') { startThiefOffline(); return; }
        if (currentGameMode === 'spyfall') { startSpyfallOffline(); return; }
        if (currentGameMode === 'coup') { startCoupOffline(); return; }
        saveSettings();
        // Fallback names for empty inputs
        const namesInput = Array.from(document.querySelectorAll('.player-input'))
            .map((inp,idx)=>inp.value.trim()||`لاعب ${idx+1}`);

        if (namesInput.length<3) { document.getElementById('setup-error').innerText='يجب أن يكون هناك 3 لاعبين على الأقل.'; _sfx.error(); return; }

        const isRand = _togActive('t-random');
        let impCount = isRand ? Math.floor(Math.random()*Math.floor(namesInput.length/2))+1 : impostorConfig;
        if (!isRand&&impCount>=namesInput.length) { document.getElementById('setup-error').innerText='عدد الكذابين يجب أن يكون أقل من عدد اللاعبين.'; _sfx.error(); return; }

        wordsDB = currentLang==='x18' ? adultWordsDB : regularWordsDB;
        if (wordsDB.length===0) { document.getElementById('setup-error').innerText='جاري تحميل الكلمات، يرجى الانتظار والمحاولة مجدداً.'; _sfx.error(); return; }

        document.getElementById('setup-error').innerText='';
        isEliminationMode = _togActive('t-elimination');
        noHintsMode = _togActive('t-nohint') || currentLang==='x18';
        const allCorrectHints = _togActive('t-allhint');

        players = namesInput.map(name=>({name,isImpostor:false,customHint:'',eliminated:false,viewedCard:false}));
        currentWordObj = wordsDB[Math.floor(Math.random()*wordsDB.length)];

        const isChaosRound = _togActive('t-chaos') && Math.random()<0.15;
        if (isChaosRound) { players.forEach(p=>{p.isImpostor=true;}); }
        else {
            const shuffled = [...Array(players.length).keys()].sort(()=>0.5-Math.random());
            for(let i=0;i<impCount;i++) players[shuffled[i]].isImpostor=true;
        }

        const impostorPlayers = players.filter(p=>p.isImpostor);
        if (allCorrectHints) { impostorPlayers.forEach(p=>{p.customHint=currentWordObj.hint;}); }
        else if (impostorPlayers.length<=1) { if(impostorPlayers.length===1)impostorPlayers[0].customHint=currentWordObj.hint; }
        else {
            const lucky=Math.floor(Math.random()*impostorPlayers.length);
            const wrong=wordsDB.filter(w=>w.word!==currentWordObj.word).map(w=>w.hint).sort(()=>0.5-Math.random());
            let hi=0; for(let i=0;i<impostorPlayers.length;i++){impostorPlayers[i].customHint=(i===lucky)?currentWordObj.hint:(wrong[hi%wrong.length]||'');hi++;}
        }

        remainingTime=timerConfig*60; currentRevealIndex=0;
        renderSingleCard(); showScreen('reveal-screen'); _sfx.gameStart();
    });

    // NEXT PLAYER CARD
    document.getElementById('next-player-btn').addEventListener('click',()=>{
        currentRevealIndex++;
        if(currentRevealIndex<players.length) { renderSingleCard(); }
        else {
            const starter=players[Math.floor(Math.random()*players.length)];
            document.getElementById('starter-player').innerText=`${i18n[currentLang].starter_is}${starter.name}`;
            showScreen('timer-screen'); updateTimerDisplay();
            timerInterval=setInterval(()=>{remainingTime--;updateTimerDisplay();if(remainingTime<=0){clearInterval(timerInterval);goToVoting();}},1000);
        }
    });

    // VOTE BUTTON
    document.getElementById('go-to-vote-btn').addEventListener('click',()=>{
        if (window.onlineMode) return; // handled by online mode override
        clearInterval(timerInterval); goToVoting();
    });

    // Helper — creates a floating reaction visible on this device
    function _showReactionFloat(text) {
        const float = document.createElement('div');
        float.className = 'reaction-float';
        float.textContent = text;
        float.style.top = Math.max(60, window.innerHeight * 0.45) + 'px';
        document.body.appendChild(float);
        setTimeout(() => float.remove(), 1900);
    }
    // Expose for online.js to call
    window._showReactionFloat = _showReactionFloat;
    window._playReactionSfx = kind => {
        if (_sfx && typeof _sfx.reaction === 'function') _sfx.reaction(kind);
        else _sfx.notify();
    };

    // DISCUSSION REACTIONS
    document.getElementById('reaction-bar')?.addEventListener('click', e => {
        const btn = e.target.closest('.reaction-btn');
        if (!btn) return;
        const msg = btn.dataset.msg;
        if (!msg) return;
        const sfx = btn.dataset.sfx || 'notify';
        window._playReactionSfx(sfx);
        if (window.onlineMode && typeof _channel !== 'undefined' && _channel) {
            // Broadcast to all players in the room
            _channel.send({
                type: 'broadcast',
                event: 'reaction',
                payload: { name: typeof _myName !== 'undefined' ? _myName : '?', msg, sfx }
            });
            // Also show locally so sender sees their own reaction
            _showReactionFloat(_myName + ': ' + msg);
        }
        // Offline: no reactions (bar is hidden anyway)
    });

    // ONLINE BUTTONS
    document.getElementById('open-online-btn').addEventListener('click',()=>{showScreen('online-setup-screen');_clearErr();});
    document.getElementById('back-to-setup-btn').addEventListener('click',()=>showScreen('setup-screen'));
    document.getElementById('create-room-btn').addEventListener('click',_createRoom);
    document.getElementById('join-room-btn').addEventListener('click',_joinRoom);
    if (typeof _restoreOnlineName === 'function') _restoreOnlineName();

    const codeInput = document.getElementById('room-code-input');
    codeInput.addEventListener('input',e=>{const pos=e.target.selectionStart;e.target.value=e.target.value.toUpperCase();e.target.setSelectionRange(pos,pos);});
    codeInput.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('join-room-btn').click();});

    document.getElementById('online-start-btn').addEventListener('click',_startOnlineGame);

    document.getElementById('copy-code-btn').addEventListener('click',()=>{
        const code=document.getElementById('display-room-code').innerText;
        navigator.clipboard.writeText(code).then(()=>{
            const btn=document.getElementById('copy-code-btn'); btn.innerText='✅ تكوبي!';
            setTimeout(()=>{btn.innerText='📋 كوبي';},2000);
        }).catch(()=>showToast('كود الغرفة: '+code));
    });

    document.getElementById('share-code-btn').addEventListener('click',()=>{
        const code=document.getElementById('display-room-code').innerText;
        if(navigator.share){navigator.share({title:'لعبة الدخيل',text:`انضم! كود: ${code}`,url:window.location.href}).catch(()=>{});}
        else{navigator.clipboard.writeText(code).then(()=>showToast('تكوبي: '+code)).catch(()=>showToast('كود: '+code));}
    });

    document.getElementById('leave-room-btn').addEventListener('click',()=>{if(confirm('متأكد تحب تخرج من الغرفة؟'))_leaveRoom();});
    document.getElementById('online-seen-btn').addEventListener('click',_confirmSeen);
    document.getElementById('start-discussion-btn').addEventListener('click',_startDiscussion);

    // SOUND HOOKS
    document.addEventListener('pointerdown', e => {
        const btn = e.target.closest('button, .toggle-switch, .lang-pill-btn, .vote-item, .counter-btn');
        if (btn && btn.classList.contains('reaction-btn')) return;
        if (btn) _sfx.tap();
    }, {passive:true});

    document.addEventListener('mousedown', e=>{if(e.target.closest('.flip-card'))_sfx.cardFlip();},{passive:true});
    document.addEventListener('touchstart', e=>{if(e.target.closest('.flip-card'))_sfx.cardFlip();},{passive:true});

    document.getElementById('start-game-btn').addEventListener('click',()=>setTimeout(_sfx.gameStart,80));
    document.getElementById('online-start-btn').addEventListener('click',()=>setTimeout(_sfx.gameStart,80));

    let _lastScreen='';
    const _screenObs=new MutationObserver(()=>{const a=document.querySelector('.screen.active');if(!a||a.id===_lastScreen)return;_lastScreen=a.id;if(a.id==='result-screen')return;_sfx.swoosh();});
    document.querySelectorAll('.screen').forEach(s=>_screenObs.observe(s,{attributes:true,attributeFilter:['class']}));

    const lobbyList=document.getElementById('lobby-players-list');
    if(lobbyList){let prev=0;new MutationObserver(()=>{const n=lobbyList.children.length;if(n>prev)_sfx.notify();prev=n;}).observe(lobbyList,{childList:true});}


    document.getElementById('leave-room-btn').addEventListener('click',()=>{if(_voiceOn)stopVoice();},true);

    // PWA SERVICE WORKER
    if('serviceWorker'in navigator){
        window.addEventListener('load',()=>{
            navigator.serviceWorker.register('./sw.js').then(reg=>reg.update()).catch(err=>console.warn('SW failed:',err));
        });
        let refreshing=false;
        navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;window.location.reload();}});
    }
});
