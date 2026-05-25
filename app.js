let wordsDB = [];
let players = [];
let currentWordObj = null;
let timerInterval = null;
let remainingTime = 0;
let isEliminationMode = false;
let noHintsMode = false;
let currentRevealIndex = 0;
let playerCount = 0;

// Language Management
let currentLang = 'standard';
const uiTranslations = {
    title: { standard: "🕵️‍♂️ من هو الدخيل؟", plus18: "🕵️‍♂️ شبيك تحشي فيه؟" },
    setupTitle: { standard: "إعدادات الجولة", plus18: "ركّح زبورم الطرح" },
    playersLabel: { standard: "👥 أسماء اللاعبين:", plus18: "👥 اساميكم" },
    addPlayerBtn: { standard: "➕ إضافة لاعب آخر", plus18: "➕ زيد قحبون آخر" },
    impostorLabel: { standard: "🎭 عدد الدخلاء:", plus18: "🎭 قداش من بلعوط؟" },
    timerLabel: { standard: "⏱️ مدة الجولة (بالدقائق):", plus18: "⏱️ وقت الطرح" },
    advBtn: { standard: "🔧 خيارات متقدمة", plus18: "🔧 زيد بعبص" },
    randImpLabel: { standard: "🎲 عدد عشوائي من الدخلاء (يتجاهل الرقم المحدد أعلاه)", plus18: "🎲 اللعبة تنيك روحها وتحط منيكين قد ما تحب" },
    allImpLabel: { standard: "😈 تفعيل فرصة 'الجميع دخلاء' عشوائياً", plus18: "😈 نيك حل فترية" },
    elimLabel: { standard: "⚔️ وضع الاستبعاد (اللعبة تستمر بعد التصويت الخاطئ)", plus18: "⚔️ نيك كل واحد وحدو - الي تنيكو يخرج حتى كان طلع خاطيه عصبة ليه الطرح يكمل" },
    noHintLabel: { standard: "🙈 إخفاء التلميح عن الدخيل", plus18: "🙈 الكذاب عصبة ليه - ما ينيك حتى عصبة من اللعبة" },
    allCorrectLabel: { standard: "💡 منح جميع الدخلاء التلميح الصحيح", plus18: "💡 منح جميع الدخلاء التلميح الصحيح" },
    startBtn: { standard: "🚀 بدء اللعبة", plus18: "🚀 قدّم نيّك" },
    revealInstructions: { standard: "اضغط مطولاً على البطاقة لمعرفة دورك، عند إفلات الضغط ستختفي البطاقة.", plus18: "اقعد بعبص في الكارتة باش تعرف دوركك، كي تسيبو يرجع عليك" },
    timerScreenTitle: { standard: "💬 وقت النقاش", plus18: "💬 وقت تنيكلها أمها" },
    goToVoteBtn: { standard: "🗳️ إنهاء النقاش والتصويت", plus18: "🗳️ سكر على زبي، عرفنا البلعوط" },
    voteDesc: { standard: "من تعتقدون أنه الدخيل؟", plus18: "شكونو هالزبور" }
};

function applyTranslations() {
    const t = (key) => uiTranslations[key][currentLang];
    document.getElementById('ui-title').innerText = t('title');
    document.getElementById('ui-setup-title').innerText = t('setupTitle');
    document.getElementById('ui-players-label').innerText = t('playersLabel');
    document.getElementById('add-player-btn').innerText = t('addPlayerBtn');
    document.getElementById('ui-impostor-label').innerText = t('impostorLabel');
    document.getElementById('ui-timer-label').innerText = t('timerLabel');
    document.getElementById('ui-adv-btn').innerText = t('advBtn');
    document.getElementById('ui-rand-imp-label').innerText = t('randImpLabel');
    document.getElementById('ui-all-imp-label').innerText = t('allImpLabel');
    document.getElementById('ui-elim-label').innerText = t('elimLabel');
    document.getElementById('ui-no-hint-label').innerText = t('noHintLabel');
    document.getElementById('ui-all-correct-label').innerText = t('allCorrectLabel');
    document.getElementById('start-game-btn').innerText = t('startBtn');
    document.getElementById('reveal-instructions').innerText = t('revealInstructions');
    document.getElementById('ui-timer-screen-title').innerText = t('timerScreenTitle');
    document.getElementById('go-to-vote-btn').innerText = t('goToVoteBtn');
    document.getElementById('ui-vote-desc').innerText = t('voteDesc');
}

function loadWords(filename) {
    fetch(filename, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => { 
            // .flat() handles nested arrays like the one in your adult word list.json
            wordsDB = data.flat(); 
        })
        .catch(err => console.error("Error loading words:", err));
}

function addPlayerInput(defaultName = '') {
    const playersContainer = document.getElementById('players-inputs-container');
    if (!playersContainer) return;

    playerCount++;
    const row = document.createElement('div');
    row.className = 'player-input-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'player-input';
    input.value = defaultName || `لاعب ${playerCount}`;
    input.placeholder = `اسم اللاعب`;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-player-btn danger-btn';
    removeBtn.innerHTML = '✖';
    removeBtn.title = 'إزالة اللاعب';
    removeBtn.addEventListener('click', () => { row.remove(); });

    row.appendChild(input);
    row.appendChild(removeBtn);
    playersContainer.appendChild(row);
}

window.addEventListener('DOMContentLoaded', () => {
    // Initial Load
    loadWords('word list.json');
    for (let i = 1; i <= 4; i++) addPlayerInput(`لاعب ${i}`);

    // Language Toggle Listener
    document.getElementById('lang-selector').addEventListener('change', (e) => {
        if (e.target.value === 'plus18') {
            const confirmed = confirm("Are you sure? This contains explicit +18 language.");
            if (!confirmed) {
                e.target.value = 'standard';
                return;
            }
            currentLang = 'plus18';
            loadWords('adult word list.json');
        } else {
            currentLang = 'standard';
            loadWords('word list.json');
        }
        applyTranslations();
    });

    // Toggle Advanced Panel
    const advBtn   = document.getElementById('advanced-toggle-btn');
    const advPanel = document.getElementById('advanced-panel');
    const chevron  = document.getElementById('advanced-chevron');

    advBtn.addEventListener('click', () => {
        const isOpen = advPanel.classList.toggle('open');
        chevron.classList.toggle('open', isOpen);
    });

    const randomToggle   = document.getElementById('random-impostors-toggle');
    const impostorInput  = document.getElementById('impostor-count');
    const impostorLabel  = document.getElementById('ui-impostor-label');

    randomToggle.addEventListener('change', function () {
        const isRandom = this.checked;
        impostorInput.disabled = isRandom;
        impostorInput.classList.toggle('input-disabled', isRandom);
        if (impostorLabel) impostorLabel.classList.toggle('label-disabled', isRandom);
    });

    const noHintsToggle       = document.getElementById('no-hints-toggle');
    const allCorrectToggle    = document.getElementById('all-correct-hints-toggle');

    noHintsToggle.addEventListener('change', function () {
        if (this.checked) {
            allCorrectToggle.checked = false;
            allCorrectToggle.disabled = true;
            allCorrectToggle.classList.add('input-disabled');
            allCorrectToggle.nextElementSibling.classList.add('label-disabled');
        } else {
            allCorrectToggle.disabled = false;
            allCorrectToggle.classList.remove('input-disabled');
            allCorrectToggle.nextElementSibling.classList.remove('label-disabled');
        }
    });

    allCorrectToggle.addEventListener('change', function () {
        if (this.checked) {
            noHintsToggle.checked = false;
            noHintsToggle.disabled = true;
            noHintsToggle.classList.add('input-disabled');
            noHintsToggle.nextElementSibling.classList.add('label-disabled');
        } else {
            noHintsToggle.disabled = false;
            noHintsToggle.classList.remove('input-disabled');
            noHintsToggle.nextElementSibling.classList.remove('label-disabled');
        }
    });
});

document.getElementById('add-player-btn').addEventListener('click', () => { addPlayerInput(); });

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ===== Start Game =====
document.getElementById('start-game-btn').addEventListener('click', () => {
    const namesInput = Array.from(document.querySelectorAll('.player-input'))
                           .map(i => i.value.trim())
                           .filter(n => n !== '');

    let impostorCount        = parseInt(document.getElementById('impostor-count').value);
    const isRandomImpostors  = document.getElementById('random-impostors-toggle').checked;
    const allImpostorsToggle = document.getElementById('all-impostors-toggle').checked;
    const timeMins           = parseInt(document.getElementById('timer-minutes').value);
    isEliminationMode        = document.getElementById('elimination-mode').checked;
    
    // Force No Hints mode if +18 language is selected
    noHintsMode = currentLang === 'plus18' ? true : document.getElementById('no-hints-toggle').checked;
    const allCorrectHints    = document.getElementById('all-correct-hints-toggle').checked;

    if (namesInput.length < 3) {
        document.getElementById('setup-error').innerText = "يجب أن يكون هناك 3 لاعبين على الأقل.";
        return;
    }

    if (isRandomImpostors) {
        const maxImpostors = Math.floor(namesInput.length / 2);
        impostorCount = Math.floor(Math.random() * maxImpostors) + 1;
    } else {
        if (impostorCount >= namesInput.length) {
            document.getElementById('setup-error').innerText = "عدد الدخلاء يجب أن يكون أقل من عدد اللاعبين.";
            return;
        }
    }

    if (wordsDB.length === 0) {
        document.getElementById('setup-error').innerText = "جاري تحميل الكلمات، يرجى الانتظار والمحاولة مجدداً.";
        return;
    }

    document.getElementById('setup-error').innerText = "";

    players = namesInput.map(name => ({
        name,
        isImpostor: false,
        customHint: "",
        eliminated: false,
        viewedCard: false
    }));

    currentWordObj = wordsDB[Math.floor(Math.random() * wordsDB.length)];

    const isAllImpostorRound = allImpostorsToggle && Math.random() < 0.15;

    if (isAllImpostorRound) {
        players.forEach(p => p.isImpostor = true);
    } else {
        const shuffled = [...Array(players.length).keys()].sort(() => 0.5 - Math.random());
        for (let i = 0; i < impostorCount; i++) players[shuffled[i]].isImpostor = true;
    }

    const impostorPlayers = players.filter(p => p.isImpostor);

    if (allCorrectHints) {
        impostorPlayers.forEach(p => { p.customHint = currentWordObj.hint; });
    } else if (impostorPlayers.length <= 1) {
        if (impostorPlayers.length === 1) impostorPlayers[0].customHint = currentWordObj.hint;
    } else {
        const luckyIndex = Math.floor(Math.random() * impostorPlayers.length);
        const wrongHints = wordsDB
            .filter(w => w.word !== currentWordObj.word)
            .map(w => w.hint)
            .sort(() => 0.5 - Math.random());

        let hIndex = 0;
        for (let i = 0; i < impostorPlayers.length; i++) {
            if (i === luckyIndex) {
                impostorPlayers[i].customHint = currentWordObj.hint;
            } else {
                impostorPlayers[i].customHint = wrongHints[hIndex % wrongHints.length];
                hIndex++;
            }
        }
    }

    remainingTime = timeMins * 60;
    currentRevealIndex = 0;
    renderSingleCard();
    showScreen('reveal-screen');
});

// ===== Render Card =====
function renderSingleCard() {
    const container = document.getElementById('single-card-container');
    const titleMsg  = document.getElementById('current-player-turn-msg');
    const nextBtn   = document.getElementById('next-player-btn');

    container.innerHTML = '';
    nextBtn.classList.add('hidden');

    const player = players[currentRevealIndex];
    titleMsg.innerText = currentLang === 'plus18' ? `عصبتك يا ${player.name}` : `الدور الحالي: يا ${player.name}`;

    const card = document.createElement('div');
    card.className = 'flip-card';

    let roleText;
    if (player.isImpostor) {
        let impTitle = currentLang === 'plus18' ? `يعطك عصبة راك كذاب 🤫` : `أنت الدخيل 🤫`;
        roleText = noHintsMode
            ? impTitle
            : `${impTitle}<br><br><span style="font-size:16px;">التلميح:</span><br>${player.customHint}`;
    } else {
        roleText = `أنت مواطن 🤠<br><br><span style="font-size:16px;">الكلمة:</span><br>${currentWordObj.word}`;
    }

    card.innerHTML = `
        <div class="flip-card-inner">
            <div class="flip-card-front"><span>بطاقة ${player.name}</span></div>
            <div class="flip-card-back"><span>${roleText}</span></div>
        </div>`;

    const showCard = (e) => {
        e.preventDefault();
        card.classList.add('flipped');
        player.viewedCard = true;
    };

    const hideCard = (e) => {
        e.preventDefault();
        if (!card.classList.contains('flipped')) return;
        card.classList.remove('flipped');
        
        let nextPlayerName = currentRevealIndex < players.length - 1 ? players[currentRevealIndex + 1].name : "";
        let standardMsg = `تمت الرؤية.. مرر الهاتف لـ ${nextPlayerName}`;
        let plus18Msg = `ماك عرفت تحرك نيك عدي للي بعدك لـ ${nextPlayerName}`;
        
        nextBtn.innerText = currentRevealIndex < players.length - 1
            ? (currentLang === 'plus18' ? plus18Msg : standardMsg)
            : "الجميع رأى دوره.. ابدأ العداد! 🚦";
        nextBtn.classList.remove('hidden');
    };

    card.addEventListener('mousedown', showCard);
    card.addEventListener('mouseup', hideCard);
    card.addEventListener('mouseleave', hideCard);
    card.addEventListener('touchstart', showCard, { passive: false });
    card.addEventListener('touchend', hideCard, { passive: false });
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
        btn.innerText = `🗳️ ${player.name}`;
        btn.onclick = () => handleVote(player);
        votingList.appendChild(btn);
    });
}

function handleVote(votedPlayer) {
    const resultMsg = document.getElementById('result-message');
    const revealBox = document.getElementById('impostors-reveal');
    const nextBtn   = document.getElementById('next-round-btn');
    revealBox.innerHTML = '';

    let successMsg = currentLang === 'plus18' ? `اوه على الزبي هاك طلعتو! 🎉 ${votedPlayer.name} كان البلعوط.` : `إجابة صحيحة! 🎉 ${votedPlayer.name} كان الدخيل.`;
    let failMsg = currentLang === 'plus18' ? `يعطك عصبة راك غالط! ❌ ${votedPlayer.name} خاطيه.` : `إجابة خاطئة! ❌ ${votedPlayer.name} ليس الدخيل.`;

    if (!isEliminationMode) {
        resultMsg.innerText = votedPlayer.isImpostor ? successMsg : failMsg;

        const allImpostors = players.filter(p => p.isImpostor).map(p => p.name).join(' و ');
        revealBox.innerHTML = `الدخيل (الدخلاء):<br><strong style="color:var(--accent-color);">${allImpostors}</strong><br><br>الكلمة كانت: <strong>${currentWordObj.word}</strong>`;
        nextBtn.innerText = "🔄 جولة جديدة";
        nextBtn.onclick = () => showScreen('setup-screen');

    } else {
        votedPlayer.eliminated = true;
        const remainingImpostors = players.filter(p => p.isImpostor && !p.eliminated);
        const remainingRegulars  = players.filter(p => !p.isImpostor && !p.eliminated);

        if (remainingImpostors.length === 0) {
            resultMsg.innerText = `لقد قضيتم على جميع الدخلاء! 🎉 فاز المواطنون!`;
            revealBox.innerHTML = `الكلمة كانت: <strong>${currentWordObj.word}</strong>`;
            nextBtn.innerText = "🔄 جولة جديدة";
            nextBtn.onclick = () => showScreen('setup-screen');
        } else if (remainingImpostors.length >= remainingRegulars.length) {
            resultMsg.innerText = `سيطر الدخلاء على اللعبة! 😈 فاز الدخلاء!`;
            const allImpostors = players.filter(p => p.isImpostor).map(p => p.name).join(' و ');
            revealBox.innerHTML = `الدخيل (الدخلاء):<br><strong style="color:var(--accent-color);">${allImpostors}</strong><br><br>الكلمة كانت: <strong>${currentWordObj.word}</strong>`;
            nextBtn.innerText = "🔄 جولة جديدة";
            nextBtn.onclick = () => showScreen('setup-screen');
        } else {
            resultMsg.innerText = `تم استبعاد ${votedPlayer.name}!`;
            revealBox.innerHTML = `لكن اللعبة لم تنتهِ بعد... هل كان هو الدخيل أم لا؟ لن نخبركم! 🤐`;
            nextBtn.innerText = "⏱️ متابعة النقاش والتصويت (دقيقة واحدة)";
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
