let wordsDB = [];
let adultWordsDB = [];
let players = [];
let currentWordObj = null;
let timerInterval = null;
let remainingTime = 0;
let isEliminationMode = false;
let noHintsMode = false;
let currentRevealIndex = 0;
let currentLang = 'ar'; // 'ar' | 'tn' | 'adult'
let playerCount = 0;

// ===== TRANSLATIONS =====
const T = {
    ar: {
        appTitle:           '🕵️‍♂️ من هو الدخيل؟',
        setupTitle:         'إعدادات الجولة',
        playerNamesLabel:   '👥 أسماء اللاعبين:',
        addPlayerBtn:       '➕ إضافة لاعب آخر',
        impostorCountLabel: '🎭 عدد الدخلاء:',
        timerLabel:         '⏱️ مدة الجولة (بالدقائق):',
        randomImpostors:    '🎲 عدد عشوائي من الدخلاء (يتجاهل الرقم المحدد أعلاه)',
        allImpostors:       '😈 تفعيل فرصة "الجميع دخلاء" عشوائياً',
        eliminationMode:    '⚔️ وضع الاستبعاد (اللعبة تستمر بعد التصويت الخاطئ)',
        noHints:            '🙈 إخفاء التلميح عن الدخيل',
        allCorrectHints:    '💡 منح جميع الدخلاء التلميح الصحيح',
        startGameBtn:       '🚀 بدء اللعبة',
        revealTitle:        '🃏 توزيع الأدوار',
        revealInstructions: 'اضغط مطولاً على البطاقة لمعرفة دورك، عند إفلات الضغط ستختفي البطاقة.',
        timerTitle:         '💬 وقت النقاش',
        goVoteBtn:          '🗳️ إنهاء النقاش والتصويت',
        votingTitle:        '🗳️ التصويت',
        votingSubtitle:     'من تعتقدون أنه الدخيل؟',
        resultTitle:        '🏆 النتيجة',
        nextRound:          '🔄 متابعة / جولة جديدة',
        currentTurn:        (n) => `الدور الحالي: يا ${n}`,
        cardFront:          (n) => `بطاقة ${n}`,
        impostorCard:       (h) => `أنت الدخيل 🤫<br><br><span style="font-size:16px;">التلميح:</span><br>${h}`,
        impostorCardNoHint: ()  => `أنت الدخيل 🤫`,
        citizenCard:        (w) => `أنت مواطن 🤠<br><br><span style="font-size:16px;">الكلمة:</span><br>${w}`,
        nextPlayerBtn:      (n) => `تمت الرؤية.. مرر الهاتف لـ ${n}`,
        startTimerBtn:      ()  => `الجميع رأى دوره.. ابدأ العداد! 🚦`,
        correctVote:        (n) => `إجابة صحيحة! 🎉 ${n} كان الدخيل.`,
        wrongVote:          (n) => `إجابة خاطئة! ❌ ${n} ليس الدخيل.`,
        impostorsLabel:     'الدخيل (الدخلاء):',
        wordWas:            (w) => `الكلمة كانت: <strong>${w}</strong>`,
        newRound:           '🔄 جولة جديدة',
        continueVoting:     '⏱️ متابعة النقاش والتصويت (دقيقة واحدة)',
        eliminatedMsg:      (n) => `تم استبعاد ${n}!`,
        gameNotOver:        'لكن اللعبة لم تنتهِ بعد... هل كان هو الدخيل أم لا؟ لن نخبركم! 🤐',
        citizensWin:        'لقد قضيتم على جميع الدخلاء! 🎉 فاز المواطنون!',
        impostorsWin:       'سيطر الدخلاء على اللعبة! 😈 فاز الدخلاء!',
        voteFor:            (n) => `🗳️ ${n}`,
        loadingError:       'جاري تحميل الكلمات، يرجى الانتظار والمحاولة مجدداً.',
        minPlayersError:    'يجب أن يكون هناك 3 لاعبين على الأقل.',
        impostorCountError: 'عدد الدخلاء يجب أن يكون أقل من عدد اللاعبين.',
    },

    tn: {
        appTitle:           '🕵️‍♂️ شكونو هو؟',
        setupTitle:         'ريقلاج الطرح',
        playerNamesLabel:   '👥 اساميكم:',
        addPlayerBtn:       '➕ زيد واحد اخر',
        impostorCountLabel: 'قداش من كذاب؟',
        timerLabel:         'وقت الطرح (بالدقايق):',
        randomImpostors:    '🎲 زيد بربش (زهر، من غير ما تاخو بالرقم الي حطيتو - الماكس شطر الملاعبية)',
        allImpostors:       '😈 كذابين على كيف اللعبة (فما نسبة صغيرة - 15%)',
        eliminationMode:    '⚔️ نقص بالواحد بالواحد (الي نصوتولو يخرج، الطرح يكمل)',
        noHints:            '🙈 سبورة كحلة مع الكذاب (ما يجيه حتى تلميح)',
        allCorrectHints:    '💡 الكذاب ما يجيه تلميح - يدبر راسو من كلام لخرين',
        startGameBtn:       'انافا 🚀',
        revealTitle:        '🃏 توزيع الأدوار',
        revealInstructions: 'اقعد نازل على الكارتة باش تعرف دورك، كي تسيبها تعاود تدور.',
        timerTitle:         'وقت التقطييع والترييش 💬',
        goVoteBtn:          '🗳️ سكر عليا ونصوتو',
        votingTitle:        'سكر عليا، عرفنا الكذاب',
        votingSubtitle:     'شكونو البلعوط؟',
        resultTitle:        '🏆 النتيجة',
        nextRound:          '🔄 طرح جديد',
        currentTurn:        (n) => `دالّتك يا ${n}`,
        cardFront:          (n) => `بطاقة ${n}`,
        impostorCard:       (h) => `انت الكذاب 🤫<br><br><span style="font-size:16px;">التلميح:</span><br>${h}`,
        impostorCardNoHint: ()  => `انت الكذاب 🤫`,
        citizenCard:        (w) => `أنت مواطن 🤠<br><br><span style="font-size:16px;">الكلمة:</span><br>${w}`,
        nextPlayerBtn:      (n) => `هاك عرفت، عدي للي بعدك: ${n}`,
        startTimerBtn:      ()  => `هاك عرفت عدي الكل! ابدا العداد 🚦`,
        correctVote:        (n) => `يعطيك الصحة! 🎉 ${n} كان الكذاب.`,
        wrongVote:          (n) => `غالط! ❌ ${n} مش هو.`,
        impostorsLabel:     'الكذاب (الكذابين):',
        wordWas:            (w) => `الكلمة كانت: <strong>${w}</strong>`,
        newRound:           '🔄 طرح جديد',
        continueVoting:     '⏱️ عصبتكم (دقيقة واحدة)',
        eliminatedMsg:      (n) => `خرج ${n}!`,
        gameNotOver:        'اللعبة ما كملتش... هل كان هو الكذاب؟ ما نقولكمش! 🤐',
        citizensWin:        'قضيتو على الكذابين! 🎉 فازو المواطنين!',
        impostorsWin:       'الكذابين غلبونا! 😈 فازو الكذابين!',
        voteFor:            (n) => `🗳️ ${n}`,
        loadingError:       'جاري تحميل الكلمات، إستنو شوية وعاودو.',
        minPlayersError:    'يلزم على الأقل 3 ملاعبية.',
        impostorCountError: 'عدد الكذابين يلزم يكون أقل من عدد الملاعبية.',
    },

    adult: {
        appTitle:           '🔞 شبيك تحشي فيه؟',
        setupTitle:         'ركّح زبورم الطرح',
        playerNamesLabel:   '👥 اساميكم:',
        addPlayerBtn:       '➕ زيد قحبون آخر',
        impostorCountLabel: 'قداش من بلعوط؟',
        timerLabel:         'وقت الطرح (بالدقايق):',
        randomImpostors:    '🎲 زيد بعبص (زهر، من غير ما تاخو بالرقم الي حطيتو - الماكس شطر الملاعبية)',
        allImpostors:       '😈 اللعبة تنيك روحها أمور كذابين (فما نسبة صغيرة - 15%)',
        eliminationMode:    '⚔️ نيك كل واحد وحدو (الي نصوتولو يخرج، الطرح يكمل)',
        noHints:            '🙈 الكذاب عصبة ليه (سبورة كحلة - ما يجيه حتى تلميح)',
        allCorrectHints:    '💡 الكلمة تو (الكذاب ما يجيه تلميح - يدبر راسو)',
        startGameBtn:       'قدّم نيّك 🚀',
        revealTitle:        '🔞 توزيع الأدوار',
        revealInstructions: 'اقعد بعبص في الكارتة باش تعرف دورك، كي تسيبو يرجع عليك.',
        timerTitle:         'وقت تنيكلها أمها 💬',
        goVoteBtn:          '🗳️ سكر على زبي ونصوتو',
        votingTitle:        'سكر على زبي، عرفنا البلعوط',
        votingSubtitle:     'شكونو هالزبور؟',
        resultTitle:        '🏆 النتيجة',
        nextRound:          '🔄 طرح جديد',
        currentTurn:        (n) => `عصبتك يا ${n}`,
        cardFront:          (n) => `بطاقة ${n}`,
        impostorCard:       (_) => `يعطك عصبة راك كذاب 🤫<br><br><span style="font-size:14px;opacity:0.75;">سبورة كحلة! دبّر راسك من كلام لخرين.</span>`,
        impostorCardNoHint: ()  => `يعطك عصبة راك كذاب 🤫`,
        citizenCard:        (w) => `أنت مواطن 🤠<br><br><span style="font-size:16px;">الكلمة:</span><br>${w}`,
        nextPlayerBtn:      (n) => `هاك حشيتو.. زيد الهاتف لـ ${n}`,
        startTimerBtn:      ()  => `ماك عرفت تحرك نيك عدي للي بعدك! 🚦`,
        correctVote:        (n) => `اوه على الزبي هاك طلعتو! 🎉 ${n} كان البلعوط.`,
        wrongVote:          (n) => `يعطك عصبة راك غالط! ❌ ${n} مش هو.`,
        impostorsLabel:     'البلعوط (البلاعيط):',
        wordWas:            (w) => `الكلمة كانت: <strong>${w}</strong>`,
        newRound:           '🔄 طرح جديد',
        continueVoting:     '⏱️ عصبتكم (دقيقة واحدة)',
        eliminatedMsg:      (n) => `خرج ${n}!`,
        gameNotOver:        'اللعبة ما كملتش... هل كان هو البلعوط؟ ما نقولكمش! 🤐',
        citizensWin:        'قضيتو على البلاعيط! 🎉 فازو المواطنين!',
        impostorsWin:       'الكذابين غلبونا! 😈 فازو البلاعيط!',
        voteFor:            (n) => `🗳️ ${n}`,
        loadingError:       'جاري تحميل الكلمات، إستنو شوية وعاودو.',
        minPlayersError:    'يلزم على الأقل 3 ملاعبية.',
        impostorCountError: 'عدد الكذابين يلزم يكون أقل من عدد الملاعبية.',
    }
};

function t(key) {
    return (T[currentLang] && T[currentLang][key] !== undefined) ? T[currentLang][key] : (T.ar[key] || '');
}

// ===== APPLY TRANSLATIONS TO DOM =====
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const val = T[currentLang][key];
        if (val !== undefined && typeof val !== 'function') el.innerHTML = val;
    });

    const noHintsToggle    = document.getElementById('no-hints-toggle');
    const allCorrectToggle = document.getElementById('all-correct-hints-toggle');
    const noHintsLabel     = noHintsToggle ? noHintsToggle.nextElementSibling : null;
    const allCorrectLabel  = allCorrectToggle ? allCorrectToggle.nextElementSibling : null;

    if (currentLang === 'adult') {
        // Force-lock hint toggles in adult mode
        if (noHintsToggle) {
            noHintsToggle.checked  = true;
            noHintsToggle.disabled = true;
            noHintsToggle.classList.add('input-disabled');
            if (noHintsLabel) noHintsLabel.classList.add('label-disabled');
        }
        if (allCorrectToggle) {
            allCorrectToggle.checked  = false;
            allCorrectToggle.disabled = true;
            allCorrectToggle.classList.add('input-disabled');
            if (allCorrectLabel) allCorrectLabel.classList.add('label-disabled');
        }
    } else {
        // Restore hint toggles for ar / tn
        if (noHintsToggle && !noHintsToggle.checked) {
            noHintsToggle.disabled = false;
            noHintsToggle.classList.remove('input-disabled');
            if (noHintsLabel) noHintsLabel.classList.remove('label-disabled');
        }
        if (allCorrectToggle && !noHintsToggle.checked) {
            allCorrectToggle.disabled = false;
            allCorrectToggle.classList.remove('input-disabled');
            if (allCorrectLabel) allCorrectLabel.classList.remove('label-disabled');
        }
        // If switching away from adult, uncheck no-hints
        if (noHintsToggle) {
            noHintsToggle.checked  = false;
            noHintsToggle.disabled = false;
            noHintsToggle.classList.remove('input-disabled');
            if (noHintsLabel) noHintsLabel.classList.remove('label-disabled');
        }
        if (allCorrectToggle) {
            allCorrectToggle.disabled = false;
            allCorrectToggle.classList.remove('input-disabled');
            if (allCorrectLabel) allCorrectLabel.classList.remove('label-disabled');
        }
    }
}

function setLanguage(lang) {
    currentLang = lang;
    document.getElementById('lang-ar-btn').classList.toggle('lang-active', lang === 'ar');
    document.getElementById('lang-tn-btn').classList.toggle('lang-active', lang === 'tn');
    document.getElementById('lang-adult-btn').classList.toggle('lang-active', lang === 'adult');
    applyTranslations();
}

// ===== PLAYER INPUTS =====
function addPlayerInput(defaultName = '') {
    const container = document.getElementById('players-inputs-container');
    if (!container) return;
    playerCount++;
    const row = document.createElement('div');
    row.className = 'player-input-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'player-input';
    input.value = defaultName || `لاعب ${playerCount}`;
    input.placeholder = 'اسم اللاعب';
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-player-btn danger-btn';
    removeBtn.innerHTML = '✖';
    removeBtn.addEventListener('click', () => row.remove());
    row.appendChild(input);
    row.appendChild(removeBtn);
    container.appendChild(row);
}

// ===== DOMContentLoaded =====
window.addEventListener('DOMContentLoaded', () => {
    for (let i = 1; i <= 4; i++) addPlayerInput(`لاعب ${i}`);

    // Advanced panel
    const advBtn   = document.getElementById('advanced-toggle-btn');
    const advPanel = document.getElementById('advanced-panel');
    const chevron  = document.getElementById('advanced-chevron');
    advBtn.addEventListener('click', () => {
        const isOpen = advPanel.classList.toggle('open');
        chevron.classList.toggle('open', isOpen);
    });

    // Random impostors toggle
    const randomToggle  = document.getElementById('random-impostors-toggle');
    const impostorInput = document.getElementById('impostor-count');
    const impostorLabel = document.querySelector('label[for="impostor-count"]');
    randomToggle.addEventListener('change', function () {
        impostorInput.disabled = this.checked;
        impostorInput.classList.toggle('input-disabled', this.checked);
        if (impostorLabel) impostorLabel.classList.toggle('label-disabled', this.checked);
    });

    // noHints ↔ allCorrectHints mutual exclusion (only in non-adult mode)
    const noHintsToggle    = document.getElementById('no-hints-toggle');
    const allCorrectToggle = document.getElementById('all-correct-hints-toggle');
    noHintsToggle.addEventListener('change', function () {
        if (currentLang === 'adult') return;
        allCorrectToggle.checked  = false;
        allCorrectToggle.disabled = this.checked;
        allCorrectToggle.classList.toggle('input-disabled', this.checked);
        allCorrectToggle.nextElementSibling.classList.toggle('label-disabled', this.checked);
    });
    allCorrectToggle.addEventListener('change', function () {
        if (currentLang === 'adult') return;
        noHintsToggle.checked  = false;
        noHintsToggle.disabled = this.checked;
        noHintsToggle.classList.toggle('input-disabled', this.checked);
        noHintsToggle.nextElementSibling.classList.toggle('label-disabled', this.checked);
    });

    // ===== LANGUAGE BUTTONS =====
    document.getElementById('lang-ar-btn').addEventListener('click', () => setLanguage('ar'));
    document.getElementById('lang-tn-btn').addEventListener('click', () => setLanguage('tn'));
    document.getElementById('lang-adult-btn').addEventListener('click', () => {
        openPasswordModal();
    });

    // ===== PASSWORD MODAL =====
    const pwModal  = document.getElementById('pw-modal');
    const pwInput  = document.getElementById('pw-input');
    const pwError  = document.getElementById('pw-error');
    const pwSubmit = document.getElementById('pw-submit');
    const pwCancel = document.getElementById('pw-cancel');

    function openPasswordModal() {
        pwInput.value = '';
        pwError.textContent = '';
        pwModal.classList.remove('hidden');
        setTimeout(() => pwInput.focus(), 80);
    }

    function closePasswordModal() {
        pwModal.classList.add('hidden');
    }

    function tryUnlock() {
        if (pwInput.value === 'simba') {
            closePasswordModal();
            setLanguage('adult');
        } else {
            pwError.textContent = '❌ كلمة السر غلط';
            pwInput.value = '';
            pwInput.classList.add('pw-shake');
            setTimeout(() => pwInput.classList.remove('pw-shake'), 500);
        }
    }

    pwSubmit.addEventListener('click', tryUnlock);
    pwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryUnlock(); });
    pwCancel.addEventListener('click', closePasswordModal);
    pwModal.addEventListener('click', (e) => { if (e.target === pwModal) closePasswordModal(); });
});

// Add player button
document.getElementById('add-player-btn').addEventListener('click', () => addPlayerInput());

// ===== LOAD WORD LISTS =====
fetch('word_list.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => { wordsDB = data; })
    .catch(err => console.error('Error loading word list:', err));

fetch('adult_word_list.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
        adultWordsDB = data.flat().filter(item => item && typeof item === 'object' && item.word);
    })
    .catch(err => console.error('Error loading adult word list:', err));

// ===== SCREEN NAV =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// ===== START GAME =====
document.getElementById('start-game-btn').addEventListener('click', () => {
    const namesInput = Array.from(document.querySelectorAll('.player-input'))
                           .map(i => i.value.trim()).filter(n => n !== '');

    let impostorCount        = parseInt(document.getElementById('impostor-count').value);
    const isRandomImpostors  = document.getElementById('random-impostors-toggle').checked;
    const allImpostorsToggle = document.getElementById('all-impostors-toggle').checked;
    const timeMins           = parseInt(document.getElementById('timer-minutes').value);
    isEliminationMode        = document.getElementById('elimination-mode').checked;
    noHintsMode              = document.getElementById('no-hints-toggle').checked;
    const allCorrectHints    = document.getElementById('all-correct-hints-toggle').checked;

    const effectiveNoHints = noHintsMode || currentLang === 'adult';
    const activeDB         = currentLang === 'adult' ? adultWordsDB : wordsDB;

    if (namesInput.length < 3) {
        document.getElementById('setup-error').innerText = t('minPlayersError'); return;
    }
    if (isRandomImpostors) {
        impostorCount = Math.floor(Math.random() * Math.floor(namesInput.length / 2)) + 1;
    } else {
        if (impostorCount >= namesInput.length) {
            document.getElementById('setup-error').innerText = t('impostorCountError'); return;
        }
    }
    if (activeDB.length === 0) {
        document.getElementById('setup-error').innerText = t('loadingError'); return;
    }
    document.getElementById('setup-error').innerText = '';

    players = namesInput.map(name => ({
        name, isImpostor: false, customHint: '', eliminated: false, viewedCard: false
    }));

    currentWordObj = activeDB[Math.floor(Math.random() * activeDB.length)];

    const isAllImpostorRound = allImpostorsToggle && Math.random() < 0.15;
    if (isAllImpostorRound) {
        players.forEach(p => p.isImpostor = true);
    } else {
        const shuffled = [...Array(players.length).keys()].sort(() => 0.5 - Math.random());
        for (let i = 0; i < impostorCount; i++) players[shuffled[i]].isImpostor = true;
    }

    const impostorPlayers = players.filter(p => p.isImpostor);
    if (!effectiveNoHints) {
        if (allCorrectHints) {
            impostorPlayers.forEach(p => { p.customHint = currentWordObj.hint; });
        } else if (impostorPlayers.length <= 1) {
            if (impostorPlayers.length === 1) impostorPlayers[0].customHint = currentWordObj.hint;
        } else {
            const luckyIndex = Math.floor(Math.random() * impostorPlayers.length);
            const wrongHints = activeDB.filter(w => w.word !== currentWordObj.word)
                                       .map(w => w.hint).sort(() => 0.5 - Math.random());
            let hIdx = 0;
            for (let i = 0; i < impostorPlayers.length; i++) {
                impostorPlayers[i].customHint = (i === luckyIndex)
                    ? currentWordObj.hint
                    : wrongHints[hIdx++ % wrongHints.length];
            }
        }
    }

    remainingTime = timeMins * 60;
    currentRevealIndex = 0;
    renderSingleCard();
    showScreen('reveal-screen');
});

// ===== RENDER PLAYER CARD =====
function renderSingleCard() {
    const container = document.getElementById('single-card-container');
    const titleMsg  = document.getElementById('current-player-turn-msg');
    const nextBtn   = document.getElementById('next-player-btn');
    container.innerHTML = '';
    nextBtn.classList.add('hidden');

    const player = players[currentRevealIndex];
    const effectiveNoHints = noHintsMode || currentLang === 'adult';

    titleMsg.innerText = t('currentTurn')(player.name);
    const instrEl = document.getElementById('reveal-instructions');
    if (instrEl) instrEl.innerText = t('revealInstructions');

    let roleText;
    if (player.isImpostor) {
        roleText = effectiveNoHints ? t('impostorCardNoHint')() : t('impostorCard')(player.customHint);
    } else {
        roleText = t('citizenCard')(currentWordObj.word);
    }

    const card = document.createElement('div');
    card.className = 'flip-card';
    card.innerHTML = `
        <div class="flip-card-inner">
            <div class="flip-card-front"><span>${t('cardFront')(player.name)}</span></div>
            <div class="flip-card-back"><span>${roleText}</span></div>
        </div>`;

    const showCard = (e) => { e.preventDefault(); card.classList.add('flipped'); player.viewedCard = true; };
    const hideCard = (e) => {
        e.preventDefault();
        if (!card.classList.contains('flipped')) return;
        card.classList.remove('flipped');
        nextBtn.innerText = currentRevealIndex < players.length - 1
            ? t('nextPlayerBtn')(players[currentRevealIndex + 1].name)
            : t('startTimerBtn')();
        nextBtn.classList.remove('hidden');
    };

    card.addEventListener('mousedown',   showCard);
    card.addEventListener('mouseup',     hideCard);
    card.addEventListener('mouseleave',  hideCard);
    card.addEventListener('touchstart',  showCard, { passive: false });
    card.addEventListener('touchend',    hideCard, { passive: false });
    card.addEventListener('touchcancel', hideCard, { passive: false });
    container.appendChild(card);
}

document.getElementById('next-player-btn').addEventListener('click', () => {
    currentRevealIndex++;
    if (currentRevealIndex < players.length) {
        renderSingleCard();
    } else {
        showScreen('timer-screen');
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();
            if (remainingTime <= 0) { clearInterval(timerInterval); goToVoting(); }
        }, 1000);
    }
});

document.getElementById('go-to-vote-btn').addEventListener('click', () => {
    clearInterval(timerInterval);
    goToVoting();
});

function updateTimerDisplay() {
    const m = Math.floor(remainingTime / 60).toString().padStart(2, '0');
    const s = (remainingTime % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;
}

function goToVoting() {
    showScreen('voting-screen');
    const votingList = document.getElementById('voting-list');
    votingList.innerHTML = '';
    players.filter(p => !p.eliminated).forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'vote-btn';
        btn.innerText = t('voteFor')(player.name);
        btn.onclick = () => handleVote(player);
        votingList.appendChild(btn);
    });
}

function handleVote(votedPlayer) {
    const resultMsg = document.getElementById('result-message');
    const revealBox = document.getElementById('impostors-reveal');
    const nextBtn   = document.getElementById('next-round-btn');
    revealBox.innerHTML = '';

    if (!isEliminationMode) {
        resultMsg.innerText = votedPlayer.isImpostor
            ? t('correctVote')(votedPlayer.name)
            : t('wrongVote')(votedPlayer.name);
        const allImpostors = players.filter(p => p.isImpostor).map(p => p.name).join(' و ');
        revealBox.innerHTML = `${t('impostorsLabel')}<br><strong style="color:var(--accent-color);">${allImpostors}</strong><br><br>${t('wordWas')(currentWordObj.word)}`;
        nextBtn.innerText = t('newRound');
        nextBtn.onclick = () => showScreen('setup-screen');
    } else {
        votedPlayer.eliminated = true;
        const remImpostors = players.filter(p => p.isImpostor && !p.eliminated);
        const remRegulars  = players.filter(p => !p.isImpostor && !p.eliminated);

        if (remImpostors.length === 0) {
            resultMsg.innerText = t('citizensWin');
            revealBox.innerHTML = t('wordWas')(currentWordObj.word);
            nextBtn.innerText = t('newRound');
            nextBtn.onclick = () => showScreen('setup-screen');
        } else if (remImpostors.length >= remRegulars.length) {
            resultMsg.innerText = t('impostorsWin');
            const allImpostors = players.filter(p => p.isImpostor).map(p => p.name).join(' و ');
            revealBox.innerHTML = `${t('impostorsLabel')}<br><strong style="color:var(--accent-color);">${allImpostors}</strong><br><br>${t('wordWas')(currentWordObj.word)}`;
            nextBtn.innerText = t('newRound');
            nextBtn.onclick = () => showScreen('setup-screen');
        } else {
            resultMsg.innerText = t('eliminatedMsg')(votedPlayer.name);
            revealBox.innerHTML = t('gameNotOver');
            nextBtn.innerText = t('continueVoting');
            nextBtn.onclick = () => {
                remainingTime = 60;
                showScreen('timer-screen');
                updateTimerDisplay();
                timerInterval = setInterval(() => {
                    remainingTime--;
                    updateTimerDisplay();
                    if (remainingTime <= 0) { clearInterval(timerInterval); goToVoting(); }
                }, 1000);
            };
        }
    }
    showScreen('result-screen');
}
