let wordsDB = [];
let players = [];
let currentWordObj = null;
let timerInterval = null;
let remainingTime = 0;
let isEliminationMode = false;
let currentRevealIndex = 0;

// إدارة حقول اللاعبين
let playerCount = 0;

function addPlayerInput(defaultName = '') {
    const playersContainer = document.getElementById('players-inputs-container');
    if (!playersContainer) return;
    
    playerCount++;
    
    // إنشاء الحاوية (الصف) لكل لاعب
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
    
    // حذف حقل اللاعب عند الضغط
    removeBtn.addEventListener('click', () => {
        row.remove();
    });

    row.appendChild(input);
    row.appendChild(removeBtn);
    playersContainer.appendChild(row);
}

// تهيئة 4 حقول افتراضية عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    for(let i = 1; i <= 4; i++) {
        addPlayerInput(`لاعب ${i}`);
    }
});

// زر إضافة لاعب جديد
document.getElementById('add-player-btn').addEventListener('click', () => {
    addPlayerInput();
});

// جلب قاعدة بيانات الكلمات (مع منع التخزين المؤقت)
fetch('word list.json', { cache: 'no-store' })
    .then(response => response.json())
    .then(data => { wordsDB = data; })
    .catch(err => console.error("Error loading words:", err));

// دوال التنقل بين الشاشات
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// بدء اللعبة
document.getElementById('start-game-btn').addEventListener('click', () => {
    // جمع أسماء اللاعبين
    const namesInput = Array.from(document.querySelectorAll('.player-input'))
                            .map(input => input.value.trim())
                            .filter(name => name !== '');
                            
    let impostorCount = parseInt(document.getElementById('impostor-count').value);
    const isRandomImpostors = document.getElementById('random-impostors-toggle').checked;
    const allImpostorsToggle = document.getElementById('all-impostors-toggle').checked;
    const timeMins = parseInt(document.getElementById('timer-minutes').value);
    
    isEliminationMode = document.getElementById('elimination-mode').checked;

    if (namesInput.length < 3) {
        document.getElementById('setup-error').innerText = "يجب أن يكون هناك 3 لاعبين على الأقل.";
        return;
    }
    
    // إذا كان الخيار العشوائي مفعلاً، يتم توليد رقم عشوائي (بين 1 وعدد اللاعبين - 1)
    if (isRandomImpostors) {
        impostorCount = Math.floor(Math.random() * (namesInput.length - 1)) + 1;
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
    
    // تهيئة اللاعبين
    players = namesInput.map(name => ({
        name: name,
        isImpostor: false,
        customHint: "", // تلميح مخصص للدخلاء
        eliminated: false,
        viewedCard: false
    }));

    // اختيار الكلمة الأساسية للمواطنين
    currentWordObj = wordsDB[Math.floor(Math.random() * wordsDB.length)];

    // تحديد الدخلاء
    let isAllImpostorRound = false;
    if (allImpostorsToggle && Math.random() < 0.15) { 
        isAllImpostorRound = true;
    }

    if (isAllImpostorRound) {
        players.forEach(p => p.isImpostor = true);
    } else {
        let shuffledIndexes = [...Array(players.length).keys()].sort(() => 0.5 - Math.random());
        for (let i = 0; i < impostorCount; i++) {
            players[shuffledIndexes[i]].isImpostor = true;
        }
    }

    // --- منطق توزيع التلميحات المحدث ---
    let impostorPlayers = players.filter(p => p.isImpostor);
    
    if (impostorPlayers.length === 1) {
        // إذا كان هناك دخيل واحد فقط، يحصل على التلميح الصحيح
        impostorPlayers[0].customHint = currentWordObj.hint;
    } else if (impostorPlayers.length > 1) {
        // إذا كان هناك أكثر من دخيل
        // 1. نختار أحدهم عشوائياً ليأخذ التلميح الصحيح
        let luckyIndex = Math.floor(Math.random() * impostorPlayers.length);
        impostorPlayers[luckyIndex].customHint = currentWordObj.hint;
        
        // 2. نجلب باقي التلميحات (نستبعد التلميح الصحيح لتجنب التكرار) ونخلطها
        let otherHints = wordsDB
            .filter(w => w.word !== currentWordObj.word)
            .map(w => w.hint)
            .sort(() => 0.5 - Math.random());
            
        let hIndex = 0;
        
        // 3. نوزع التلميحات العشوائية على باقي الدخلاء
        for (let i = 0; i < impostorPlayers.length; i++) {
            if (i !== luckyIndex) {
                impostorPlayers[i].customHint = otherHints[hIndex % otherHints.length];
                hIndex++;
            }
        }
    }

    remainingTime = timeMins * 60;
    currentRevealIndex = 0;
    renderSingleCard();
    showScreen('reveal-screen');
});

// رسم البطاقة للاعب الحالي بالتتابع (تعمل بالضغط المطول فقط)
function renderSingleCard() {
    const container = document.getElementById('single-card-container');
    const titleMsg = document.getElementById('current-player-turn-msg');
    const nextBtn = document.getElementById('next-player-btn');
    
    container.innerHTML = '';
    nextBtn.classList.add('hidden');
    
    let player = players[currentRevealIndex];
    titleMsg.innerText = `الدور الحالي: يا ${player.name}`;
    
    const card = document.createElement('div');
    card.className = 'flip-card';
    
    // استخدام customHint المجهز مسبقاً للدخيل
    let roleText = player.isImpostor ? 
        `أنت الدخيل 🤫<br><br><span style="font-size:16px;">التلميح:</span><br>${player.customHint}` : 
        `أنت مواطن 🤠<br><br><span style="font-size:16px;">الكلمة:</span><br>${currentWordObj.word}`;

    card.innerHTML = `
        <div class="flip-card-inner">
            <div class="flip-card-front">
                <span>بطاقة ${player.name}</span>
            </div>
            <div class="flip-card-back">
                <span>${roleText}</span>
            </div>
        </div>
    `;
    
    // معالجات أحداث الضغط المطول (Hold to reveal)
    const showCard = (e) => {
        e.preventDefault(); // منع تحديد النص أو ظهور قوائم المتصفح
        card.classList.add('flipped');
        player.viewedCard = true;
    };

    const hideCard = (e) => {
        e.preventDefault();
        if (card.classList.contains('flipped')) {
            card.classList.remove('flipped');
            
            // إظهار زر الانتقال فقط بعد إفلات الضغط (بعد رؤية البطاقة وإخفائها)
            if (currentRevealIndex < players.length - 1) {
                nextBtn.innerText = `تمت الرؤية.. مرر الهاتف لـ ${players[currentRevealIndex + 1].name}`;
            } else {
                nextBtn.innerText = "الجميع رأى دوره.. ابدأ العداد!";
            }
            nextBtn.classList.remove('hidden');
        }
    };

    // أحداث الماوس للكمبيوتر
    card.addEventListener('mousedown', showCard);
    card.addEventListener('mouseup', hideCard);
    card.addEventListener('mouseleave', hideCard);
    
    // أحداث اللمس للهواتف
    card.addEventListener('touchstart', showCard, {passive: false});
    card.addEventListener('touchend', hideCard, {passive: false});
    card.addEventListener('touchcancel', hideCard, {passive: false});

    container.appendChild(card);
}

// زر الانتقال للاعب التالي أو بدء العداد
document.getElementById('next-player-btn').addEventListener('click', () => {
    currentRevealIndex++;
    if (currentRevealIndex < players.length) {
        renderSingleCard();
    } else {
        // إذا انتهى الجميع، انتقل لشاشة العداد
        showScreen('timer-screen');
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                goToVoting();
            }
        }, 1000);
    }
});

// العداد اليدوي لتجاوز الوقت
document.getElementById('go-to-vote-btn').addEventListener('click', () => {
    clearInterval(timerInterval);
    goToVoting();
});

function updateTimerDisplay() {
    let m = Math.floor(remainingTime / 60).toString().padStart(2, '0');
    let s = (remainingTime % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;
}

// شاشة التصويت
function goToVoting() {
    showScreen('voting-screen');
    const votingList = document.getElementById('voting-list');
    votingList.innerHTML = '';
    
    let activePlayers = players.filter(p => !p.eliminated);
    
    activePlayers.forEach((player) => {
        const btn = document.createElement('button');
        btn.className = 'vote-btn';
        btn.innerText = `التصويت ضد ${player.name}`;
        btn.onclick = () => handleVote(player);
        votingList.appendChild(btn);
    });
}

// معالجة التصويت
function handleVote(votedPlayer) {
    const resultMsg = document.getElementById('result-message');
    const revealBox = document.getElementById('impostors-reveal');
    const nextBtn = document.getElementById('next-round-btn');
    revealBox.innerHTML = '';

    if (!isEliminationMode) {
        if (votedPlayer.isImpostor) {
            resultMsg.innerText = `إجابة صحيحة! 🎉\n${votedPlayer.name} كان الدخيل.`;
        } else {
            resultMsg.innerText = `إجابة خاطئة! ❌\n${votedPlayer.name} ليس الدخيل.`;
        }
        
        const allImpostors = players.filter(p => p.isImpostor).map(p => p.name).join(' و ');
        revealBox.innerHTML = `الدخيل (الدخلاء): <br><strong style="color:var(--accent-color);">${allImpostors}</strong><br><br>الكلمة كانت: <strong>${currentWordObj.word}</strong>`;
        nextBtn.innerText = "جولة جديدة";
        nextBtn.onclick = () => showScreen('setup-screen');
        
    } else {
        votedPlayer.eliminated = true;
        
        let remainingImpostors = players.filter(p => p.isImpostor && !p.eliminated);
        let remainingRegulars = players.filter(p => !p.isImpostor && !p.eliminated);

        if (remainingImpostors.length === 0) {
            resultMsg.innerText = `لقد قمتم بالقضاء على جميع الدخلاء! 🎉 فاز المواطنون!`;
            revealBox.innerHTML = `الكلمة كانت: <strong>${currentWordObj.word}</strong>`;
            nextBtn.innerText = "جولة جديدة";
            nextBtn.onclick = () => showScreen('setup-screen');
        } 
        else if (remainingImpostors.length >= remainingRegulars.length) {
            resultMsg.innerText = `لقد سيطر الدخلاء على اللعبة! 😈 فاز الدخلاء!`;
            const allImpostors = players.filter(p => p.isImpostor).map(p => p.name).join(' و ');
            revealBox.innerHTML = `الدخيل (الدخلاء): <br><strong style="color:var(--accent-color);">${allImpostors}</strong><br><br>الكلمة كانت: <strong>${currentWordObj.word}</strong>`;
            nextBtn.innerText = "جولة جديدة";
            nextBtn.onclick = () => showScreen('setup-screen');
        } 
        else {
            resultMsg.innerText = `تم استبعاد ${votedPlayer.name}!`;
            revealBox.innerHTML = `لكن اللعبة لم تنتهِ بعد... هل كان هو الدخيل أم لا؟ لن نخبركم! 🤐`;
            nextBtn.innerText = "متابعة النقاش والتصويت (دقيقة واحدة)";
            nextBtn.onclick = () => {
                remainingTime = 60;
                showScreen('timer-screen');
                updateTimerDisplay();
                timerInterval = setInterval(() => {
                    remainingTime--;
                    updateTimerDisplay();
                    if (remainingTime <= 0) {
                        clearInterval(timerInterval);
                        goToVoting();
                    }
                }, 1000);
            };
        }
    }
    
    showScreen('result-screen');
}
