let wordsDB = [];
let players = [];
let currentWordObj = null;
let timerInterval = null;
let remainingTime = 0;
let isEliminationMode = false;
let noHintsMode = false;
let currentRevealIndex = 0;

// إدارة حقول اللاعبين
let playerCount = 0;

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
    // تهيئة 4 لاعبين افتراضيين
    for (let i = 1; i <= 4; i++) addPlayerInput(`لاعب ${i}`);

    // ===== تبديل لوحة الخيارات المتقدمة =====
    const advBtn   = document.getElementById('advanced-toggle-btn');
    const advPanel = document.getElementById('advanced-panel');
    const chevron  = document.getElementById('advanced-chevron');

    advBtn.addEventListener('click', () => {
        const isOpen = advPanel.classList.toggle('open');
        chevron.classList.toggle('open', isOpen);
    });

    // ===== تعطيل حقل عدد الدخلاء عند تفعيل الخيار العشوائي =====
    const randomToggle   = document.getElementById('random-impostors-toggle');
    const impostorInput  = document.getElementById('impostor-count');
    const impostorLabel  = document.querySelector('label[for="impostor-count"]');

    randomToggle.addEventListener('change', function () {
        const isRandom = this.checked;
        impostorInput.disabled = isRandom;
        impostorInput.classList.toggle('input-disabled', isRandom);
        if (impostorLabel) impostorLabel.classList.toggle('label-disabled', isRandom);
    });

    // ===== تعطيل خيار "إخفاء التلميح" عند تفعيل "منح الجميع التلميح الصحيح" والعكس =====
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

// زر إضافة لاعب جديد
document.getElementById('add-player-btn').addEventListener('click', () => { addPlayerInput(); });

// جلب قاعدة بيانات الكلمات
fetch('word list.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => { wordsDB = data; })
    .catch(err => console.error("Error loading words:", err));

// التنقل بين الشاشات
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ===== بدء اللعبة =====
document.getElementById('start-game-btn').addEventListener('click', () => {
    const namesInput = Array.from(document.querySelectorAll('.player-input'))
                           .map(i => i.value.trim())
                           .filter(n => n !== '');

    let impostorCount        = parseInt(document.getElementById('impostor-count').value);
    const isRandomImpostors  = document.getElementById('random-impostors-toggle').checked;
    const allImpostorsToggle = document.getElementById('all-impostors-toggle').checked;
    const timeMins           = parseInt(document.getElementById('timer-minutes').value);
    isEliminationMode        = document.getElementById('elimination-mode').checked;
    noHintsMode              = document.getElementById('no-hints-toggle').checked;
    const allCorrectHints    = document.getElementById('all-correct-hints-toggle').checked;

    if (namesInput.length < 3) {
        document.getElementById('setup-error').innerText = "يجب أن يكون هناك 3 لاعبين على الأقل.";
        return;
    }

    if (isRandomImpostors) {
        // الحد الأقصى هو نصف عدد اللاعبين لضمان بقاء المواطنين أكثر
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

    // تحديد الدخلاء
    const isAllImpostorRound = allImpostorsToggle && Math.random() < 0.15;

    if (isAllImpostorRound) {
        players.forEach(p => p.isImpostor = true);
    } else {
        const shuffled = [...Array(players.length).keys()].sort(() => 0.5 - Math.random());
        for (let i = 0; i < impostorCount; i++) players[shuffled[i]].isImpostor = true;
    }

    // ===== توزيع التلميحات =====
    const impostorPlayers = players.filter(p => p.isImpostor);

    if (allCorrectHints) {
        // جميع الدخلاء يحصلون على التلميح الصحيح
        impostorPlayers.forEach(p => { p.customHint = currentWordObj.hint; });

    } else if (impostorPlayers.length <= 1) {
        // دخيل واحد: يحصل دائماً على التلميح الصحيح
        if (impostorPlayers.length === 1) {
            impostorPlayers[0].customHint = currentWordObj.hint;
        }

    } else {
        // أكثر من دخيل: واحد عشوائي يأخذ التلميح الصحيح، الباقون يأخذون تلميحات خاطئة
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

// ===== رسم بطاقة اللاعب الحالي =====
function renderSingleCard() {
    const container = document.getElementById('single-card-container');
    const titleMsg  = document.getElementById('current-player-turn-msg');
    const nextBtn   = document.getElementById('next-player-btn');

    container.innerHTML = '';
    nextBtn.classList.add('hidden');

    const player = players[currentRevealIndex];
    titleMsg.innerText = `الدور الحالي: يا ${player.name}`;

    const card = document.createElement('div');
    card.className = 'flip-card';

    let roleText;
    if (player.isImpostor) {
        roleText = noHintsMode
            ? `أنت الدخيل 🤫`
            : `أنت الدخيل 🤫<br><br><span style="font-size:16px;">التلميح:</span><br>${player.customHint}`;
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
        nextBtn.innerText = currentRevealIndex < players.length - 1
            ? `تمت الرؤية.. مرر الهاتف لـ ${players[currentRevealIndex + 1].name}`
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

// زر اللاعب التالي أو بدء العداد
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

    if (!isEliminationMode) {
        resultMsg.innerText = votedPlayer.isImpostor
            ? `إجابة صحيحة! 🎉 ${votedPlayer.name} كان الدخيل.`
            : `إجابة خاطئة! ❌ ${votedPlayer.name} ليس الدخيل.`;

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
