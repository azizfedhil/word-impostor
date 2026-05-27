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
let wordsDB = [], regularWordsDB = [], adultWordsDB = [];
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
    thief: { title: '🗝️ سارق، حاكم، جلّاد', start: '🚀 وزّع الكوارط', online: '🌐 العب أونلاين مع أصحابك' }
};
const thiefRoles = [
    { key:'thief', label:'سارق', icon:'🗝️', desc:'إنت السارق. حاول ما يفيقوش بيك.' },
    { key:'judge', label:'حاكم', icon:'⚖️', desc:'إنت الحاكم. بعد النقاش تختار شكون السارق.' },
    { key:'executioner', label:'جلّاد', icon:'🪓', desc:'إنت الجلّاد. تستنى حكم الحاكم.' }
];

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
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function setGameMode(mode, goSetup = true) {
    currentGameMode = mode === 'thief' ? 'thief' : 'impostor';
    try { localStorage.setItem(GAME_MODE_KEY, currentGameMode); } catch(_) {}
    if (currentGameMode === 'thief') currentLang = 'tn';
    updateGameModeUI();
    if (goSetup) showScreen('setup-screen');
}
window.setGameMode = setGameMode;
window.getCurrentGameMode = () => currentGameMode;

function updateGameModeUI() {
    const meta = gameModes[currentGameMode];
    document.body.classList.toggle('game-thief', currentGameMode === 'thief');
    document.body.classList.toggle('game-impostor', currentGameMode === 'impostor');
    const title = document.querySelector('header h1');
    if (title) title.innerText = currentGameMode === 'impostor' ? i18n[currentLang].title : meta.title;
    document.querySelectorAll('.game-switch-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gameMode === currentGameMode);
    });
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) startBtn.innerText = meta.start;
    const onlineBtn = document.getElementById('open-online-btn');
    if (onlineBtn) onlineBtn.innerText = meta.online;
    const voteBtn = document.getElementById('go-to-vote-btn');
    if (voteBtn) voteBtn.innerText = currentGameMode === 'thief' ? '⚖️ يا حاكم، احكم' : i18n[currentLang].vote_btn;
    const who = document.querySelector('[data-i18n="who_impostor"]');
    if (who) who.innerText = currentGameMode === 'thief' ? 'يا حاكم، شكون السارق؟' : i18n[currentLang].who_impostor;
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
    document.querySelector('[data-i18n="voting_title"]').innerText = currentGameMode === 'thief' ? '⚖️ حكم الحاكم' : i18n[currentLang].voting_title;
    document.querySelector('[data-i18n="who_impostor"]').innerText = currentGameMode === 'thief' ? 'يا حاكم، شكون السارق؟' : i18n[currentLang].who_impostor;
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



// ============================================================
// DOM READY — wire everything up
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {

    try { currentGameMode = localStorage.getItem(GAME_MODE_KEY) || 'impostor'; } catch(_) { currentGameMode = 'impostor'; }
    if (!['impostor','thief'].includes(currentGameMode)) currentGameMode = 'impostor';
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
