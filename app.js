
let wordsDB = [];
let players = [];
let currentWordObj = null;
let timerInterval = null;
let remainingTime = 0;
let isEliminationMode = false;
let noHintsMode = false;
let currentRevealIndex = 0;
let roundMinutes = 3;

// ===== إدارة حقول اللاعبين =====
let playerCount = 0;

function addPlayerInput() {
    const playersContainer = document.getElementById('players-inputs-container');
    if (!playersContainer) return;
    playerCount++;
    const num = playerCount;
    const row = document.createElement('div');
    row.className = 'player-input-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'player-input';
    input.value = '';
    input.placeholder = `لاعب ${num}`;
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

function updateTimeDisplay() {
    const label = document.getElementById('time-display-label');
    const val   = document.getElementById('time-value-display');
    if (label) label.textContent = `${roundMinutes} دق`;
    if (val)   val.textContent   = roundMinutes;
}

window.addEventListener('DOMContentLoaded', () => {
    for (let i = 0; i < 4; i++) addPlayerInput();

    const advBtn   = document.getElementById('advanced-toggle-btn');
    const advPanel = document.getElementById('advanced-panel');
    const chevron  = document.getElementById('advanced-chevron');
    advBtn.addEventListener('click', () => {
        const isOpen = advPanel.classList.toggle('open');
        chevron.classList.toggle('open', isOpen);
    });

    const randomToggle  = document.getElementById('random-impostors-toggle');
    const impostorInput = document.getElementById('impostor-count');
    const impostorLabel = document.querySelector('label[for="impostor-count"]');
    randomToggle.addEventListener('change', function () {
        const isRandom = this.checked;
        impostorInput.disabled = isRandom;
        impostorInput.classList.toggle('input-disabled', isRandom);
        if (impostorLabel) impostorLabel.classList.toggle('label-disabled', isRandom);
    });

    const noHintsToggle    = document.getElementById('no-hints-toggle');
    const allCorrectToggle = document.getElementById('all-correct-hints-toggle');
    noHintsToggle.addEventListener('change', function () {
        if (this.checked) {
            allCorrectToggle.checked = false; allCorrectToggle.disabled = true;
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
            noHintsToggle.checked = false; noHintsToggle.disabled = true;
            noHintsToggle.classList.add('input-disabled');
            noHintsToggle.nextElementSibling.classList.add('label-disabled');
        } else {
            noHintsToggle.disabled = false;
            noHintsToggle.classList.remove('input-disabled');
            noHintsToggle.nextElementSibling.classList.remove('label-disabled');
        }
    });

    // ===== مُختار الوقت =====
    const timeTrigger = document.getElementById('time-trigger');
    const timePopup   = document.getElementById('time-picker-popup');
    timeTrigger.addEventListener('click', (e) => { e.stopPropagation(); timePopup.classList.toggle('hidden'); });
    document.getElementById('time-minus').addEventListener('click', (e) => {
        e.stopPropagation();
        if (roundMinutes > 1) { roundMinutes--; updateTimeDisplay(); }
    });
    document.getElementById('time-plus').addEventListener('click', (e) => {
        e.stopPropagation(); roundMinutes++; updateTimeDisplay();
    });
    document.addEventListener('click', (e) => {
        if (!timePopup.classList.contains('hidden') &&
            !timeTrigger.contains(e.target) && !timePopup.contains(e.target)) {
            timePopup.classList.add('hidden');
        }
    });
    updateTimeDisplay();
});

document.getElementById('add-player-btn').addEventListener('click', () => { addPlayerInput(); });

fetch('word list.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => { wordsDB = data; })
    .catch(err => console.error("Error loading words:", err));

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ===== بدء اللعبة =====
document.getElementById('start-game-btn').addEventListener('click', () => {
    const playerInputs = Array.from(document.querySelectorAll('.player-input'));
    const namesInput = playerInputs.map((input, idx) =>
        input.value.trim() || input.placeholder || `لاعب ${idx + 1}`
    );

    let impostorCount        = parseInt(document.getElementById('impostor-count').value);
    const isRandomImpostors  = document.getElementById('random-impostors-toggle').checked;
    const allImpostorsToggle = document.getElementById('all-impostors-toggle').checked;
    isEliminationMode        = document.getElementById('elimination-mode').checked;
    noHintsMode              = document.getElementById('no-hints-toggle').checked;
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
    document.getElementById('time-picker-popup').classList.add('hidden');

    players = namesInput.map(name => ({ name, isImpostor: false, customHint: "", eliminated: false, viewedCard: false }));
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
        const wrongHints = wordsDB.filter(w => w.word !== currentWordObj.word).map(w => w.hint).sort(() => 0.5 - Math.random());
        let hIndex = 0;
        for (let i = 0; i < impostorPlayers.length; i++) {
            if (i === luckyIndex) { impostorPlayers[i].customHint = currentWordObj.hint; }
            else { impostorPlayers[i].customHint = wrongHints[hIndex % wrongHints.length]; hIndex++; }
        }
    }

    remainingTime = roundMinutes * 60;
    currentRevealIndex = 0;
    renderSingleCard();
    showScreen('reveal-screen');
});

// ===== بطاقة اللاعب الحالي =====
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
            : `أنت الدخيل 🤫<br><br><span style="font-size:14px;opacity:0.7;">التلميح:</span><br>${player.customHint}`;
    } else {
        roleText = `أنت مواطن 🤠<br><br><span style="font-size:14px;opacity:0.7;">الكلمة:</span><br>${currentWordObj.word}`;
    }
    card.innerHTML = `
        <div class="flip-card-inner">
            <div class="flip-card-front"><span>بطاقة ${player.name}</span></div>
            <div class="flip-card-back"><span>${roleText}</span></div>
        </div>`;

    const showCard = (e) => { e.preventDefault(); card.classList.add('flipped'); player.viewedCard = true; };
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

// ===== اللاعب التالي / بدء العداد =====
document.getElementById('next-player-btn').addEventListener('click', () => {
    currentRevealIndex++;
    if (currentRevealIndex < players.length) {
        renderSingleCard();
    } else {
        showScreen('timer-screen');
        updateTimerDisplay();
        // اختيار لاعب عشوائي يبدأ النقاش
        const activePlayers = players.filter(p => !p.eliminated);
        const firstSpeaker  = activePlayers[Math.floor(Math.random() * activePlayers.length)];
        showFirstSpeakerOverlay(firstSpeaker.name, () => {
            timerInterval = setInterval(() => {
                remainingTime--;
                updateTimerDisplay();
                if (remainingTime <= 0) { clearInterval(timerInterval); goToVoting(); }
            }, 1000);
        });
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

    let animType = null; // 'correct' | 'wrong' | null

    if (!isEliminationMode) {
        if (votedPlayer.isImpostor) {
            resultMsg.innerText = `إجابة صحيحة! 🎉 ${votedPlayer.name} كان الدخيل.`;
            animType = 'correct';
        } else {
            resultMsg.innerText = `إجابة خاطئة! ❌ ${votedPlayer.name} ليس الدخيل.`;
            animType = 'wrong';
        }
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
            animType = 'correct';
        } else if (remainingImpostors.length >= remainingRegulars.length) {
            resultMsg.innerText = `سيطر الدخلاء على اللعبة! 😈 فاز الدخلاء!`;
            const allImpostors = players.filter(p => p.isImpostor).map(p => p.name).join(' و ');
            revealBox.innerHTML = `الدخيل (الدخلاء):<br><strong style="color:var(--accent-color);">${allImpostors}</strong><br><br>الكلمة كانت: <strong>${currentWordObj.word}</strong>`;
            nextBtn.innerText = "🔄 جولة جديدة";
            nextBtn.onclick = () => showScreen('setup-screen');
            animType = 'wrong';
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

    if (animType) {
        triggerResultAnimation(animType, () => showScreen('result-screen'));
    } else {
        showScreen('result-screen');
    }
}

// ============================================================
//  🎙️  أوفرلاي اللاعب الذي يبدأ النقاش
// ============================================================
function showFirstSpeakerOverlay(name, onDone) {
    const overlay = document.createElement('div');
    overlay.className = 'fs-overlay first-speaker-overlay';
    overlay.innerHTML = `
        <div class="fso-card">
            <div class="fso-icon">🎙️</div>
            <div class="fso-label">يبدأ النقاش</div>
            <div class="fso-name">${name}</div>
            <div class="fso-hint">ابدأ بتقديم نفسك أو وصف ما تعرفه</div>
        </div>`;
    document.body.appendChild(overlay);

    // اضغط للإغلاق المبكر
    overlay.addEventListener('click', dismiss);

    const autoTimer = setTimeout(dismiss, 3000);

    function dismiss() {
        clearTimeout(autoTimer);
        overlay.removeEventListener('click', dismiss);
        overlay.classList.add('fs-fade-out');
        setTimeout(() => {
            overlay.remove();
            if (onDone) onDone();
        }, 600);
    }
}

// ============================================================
//  🎊 / 😈  أنيميشن نتيجة اللعبة (شاشة كاملة)
// ============================================================
function triggerResultAnimation(type, onDone) {
    const isCorrect = type === 'correct';

    const overlay = document.createElement('div');
    overlay.className = `fs-overlay result-anim-overlay ${isCorrect ? 'ra-correct' : 'ra-wrong'}`;

    // Canvas for particles
    const canvas = document.createElement('canvas');
    canvas.className = 'ra-canvas';
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    overlay.appendChild(canvas);

    // Central label
    const label = document.createElement('div');
    label.className = 'ra-label';
    label.innerHTML = isCorrect
        ? `<span class="ra-emoji">🎯</span><span class="ra-text">أصبتم!</span>`
        : `<span class="ra-emoji">😈</span><span class="ra-text">فاز الدخيل!</span>`;
    overlay.appendChild(label);

    document.body.appendChild(overlay);

    const ctx = canvas.getContext('2d');
    let rafId;

    if (isCorrect) {
        rafId = runConfetti(ctx, canvas.width, canvas.height);
    } else {
        rafId = runImpostorParticles(ctx, canvas.width, canvas.height);
    }

    // Screen-shake on wrong
    if (!isCorrect) {
        overlay.classList.add('ra-shake');
    }

    const HOLD = 2800;
    setTimeout(() => {
        cancelAnimationFrame(rafId);
        overlay.classList.add('fs-fade-out');
        setTimeout(() => {
            overlay.remove();
            if (onDone) onDone();
        }, 700);
    }, HOLD);
}

// ---- Confetti (صحيح) ----
function runConfetti(ctx, W, H) {
    const COLORS = ['#ffd700','#ff6b6b','#51cf66','#74c0fc','#f06595','#ff922b','#ffffff','#a9e34b'];
    const particles = Array.from({ length: 140 }, () => ({
        x:  Math.random() * W,
        y: -30 - Math.random() * 220,
        w:  7 + Math.random() * 9,
        h:  3 + Math.random() * 5,
        vx: (Math.random() - 0.5) * 3.5,
        vy:  1.8 + Math.random() * 3.5,
        angle: Math.random() * Math.PI * 2,
        av:   (Math.random() - 0.5) * 0.14,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: 1,
    }));

    function draw() {
        ctx.clearRect(0, 0, W, H);
        for (const p of particles) {
            p.x  += p.vx;
            p.y  += p.vy;
            p.vy += 0.07;
            p.angle += p.av;
            if (p.y > H * 0.75) p.opacity -= 0.02;
            if (p.opacity <= 0) continue;
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
        return requestAnimationFrame(draw);
    }
    return draw();
}

// ---- Impostor particles (خاطئ) ----
function runImpostorParticles(ctx, W, H) {
    const cx = W / 2, cy = H / 2;
    const bursts = [];

    function addBurst() {
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 7;
            bursts.push({
                x: cx + (Math.random() - 0.5) * 60,
                y: cy + (Math.random() - 0.5) * 60,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 9,
                opacity: 0.9 + Math.random() * 0.1,
                hue: 345 + Math.random() * 25,
                lit: 25 + Math.random() * 25,
            });
        }
    }

    addBurst();
    let burstCount = 1;
    const burstTimer = setInterval(() => {
        if (burstCount < 3) { addBurst(); burstCount++; }
        else clearInterval(burstTimer);
    }, 600);

    function draw() {
        ctx.clearRect(0, 0, W, H);
        for (const p of bursts) {
            p.x  += p.vx;
            p.y  += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.opacity -= 0.006;
            p.size    *= 0.995;
            if (p.opacity <= 0) continue;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fillStyle = `hsl(${p.hue},80%,${p.lit}%)`;
            ctx.shadowBlur  = 12;
            ctx.shadowColor = `hsl(${p.hue},90%,40%)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        return requestAnimationFrame(draw);
    }
    return draw();
}
