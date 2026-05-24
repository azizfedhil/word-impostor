// ===== TRANSLATIONS DICTIONARY =====
const i18n = {
    ar: {
        title: "🕵️‍♂️ من هو الدخيل؟",
        settings_title: "إعدادات الجولة",
        players_label: "👥 أسماء اللاعبين:",
        add_player_btn: "➕ إضافة لاعب آخر",
        impostors_label: "🎭 عدد الدخلاء",
        timer_label: "⏱️ مدة الجولة",
        advanced_btn: "🔧 خيارات متقدمة",
        adv_random: "🎲 عدد عشوائي من الدخلاء",
        adv_chaos: "😈 وضع الفوضى",
        adv_elimination: "⚔️ وضع الاستبعاد",
        adv_nohint: "🙈 إخفاء التلميح عن الدخيل",
        adv_allhint: "💡 منح جميع الدخلاء التلميح الصحيح",
        start_btn: "🚀 بدء اللعبة",
        reset_btn: "🔄 إعادة الإعدادات الافتراضية",
        reset_confirm: "هل أنت متأكد أنك تريد مسح جميع الأسماء وإعادة الإعدادات إلى وضعها الافتراضي؟",
        reveal_title: "🃏 توزيع الأدوار",
        reveal_instructions: "اضغط مطولاً على البطاقة لمعرفة دورك، عند إفلات الضغط ستختفي البطاقة.",
        discussion_title: "💬 وقت النقاش",
        vote_btn: "🗳️ إنهاء النقاش والتصويت",
        voting_title: "🗳️ التصويت",
        who_impostor: "من تعتقدون أنه الدخيل؟",
        result_title: "🏆 النتيجة",
        next_round_btn: "🔄 جولة جديدة",
        done_btn: "تم",
        info_title: "ℹ️ معلومة",
        close_btn: "حسناً",
        player_placeholder: "اسم اللاعب",
        card_of: "بطاقة ",
        pass_to: "تمت الرؤية.. مرر الهاتف لـ ",
        all_seen: "الجميع رأى دوره.. ابدأ العداد! 🚦",
        starter_is: "🗣️ يبدأ النقاش: ",
        starter_continue: "🗣️ يكمل النقاش: ",
        impostor_role: "أنت الدخيل 🤫",
        citizen_role: "أنت مواطن 🤠",
        hint_label: "التلميح:",
        word_label: "الكلمة:",
        edit_impostors_title: "تعديل عدد الدخلاء",
        edit_timer_title: "تعديل وقت الجولة (بالدقائق)",
        correct_guess: "إجابة صحيحة! 🎉 {name} كان الدخيل.",
        wrong_guess: "إجابة خاطئة! ❌ {name} ليس الدخيل.",
        impostors_were: "الدخيل (الدخلاء):",
        word_was: "الكلمة كانت:",
        all_impostors_dead: "لقد قضيتم على جميع الدخلاء! 🎉 فاز المواطنون!",
        impostors_win: "سيطر الدخلاء على اللعبة! 😈 فاز الدخلاء!",
        eliminated_msg: "تم استبعاد {name}!",
        elimination_cliffhanger: "لكن اللعبة لم تنتهِ بعد... هل كان هو الدخيل أم لا؟ لن نخبركم! 🤐",
        continue_discussion: "⏱️ متابعة النقاش والتصويت (دقيقة واحدة)"
    },
    tn: {
        title: "🕵️‍♂️ شكونو هو؟",
        settings_title: "ريڨلاج الطرح",
        players_label: "👥 اساميكم:",
        add_player_btn: "➕ زيد واحد اخر",
        impostors_label: "🎭 قداش من كذاب",
        timer_label: "⏱️ وقت الطرح",
        advanced_btn: "🔧 زيد بربش",
        adv_random: "🎲 كذابين على كيف اللعبة",
        adv_chaos: "😈 خلوضها",
        adv_elimination: "⚔️ نقص بالواحد بالواحد",
        adv_nohint: "🙈 سبورة كحلة مع الكذاب",
        adv_allhint: "💡 الكذابين الكل ياخذو نفس التلميح",
        start_btn: "🚀 انافا",
        reset_btn: "🔄 فسّخ ورجّع كيما كان",
        reset_confirm: "متأكد تحب تفسّخ الأسامي الكل وترجّع كل شي كيما كان؟",
        reveal_title: "🃏 شكون شنية",
        reveal_instructions: "اقعد نازل على الكارتة باش تعرف دورك، كي تسيبها تعاود تدور.",
        discussion_title: "💬 وقت التقطييع والترييش",
        vote_btn: "🗳️ سكر عليا، عرفنا البلعوط",
        voting_title: "🗳️ الفرز",
        who_impostor: "شكونو البلعوط؟",
        result_title: "🏆 شكون طلع؟",
        next_round_btn: "🔄 عاود انده",
        done_btn: "مريڨل",
        info_title: "ℹ️ معلومة",
        close_btn: "فهمت",
        player_placeholder: "اسم اللاعب",
        card_of: "الكارتة متاع ",
        pass_to: "هاك عرفت، عدّي للي بعدك ",
        all_seen: "الناس الكل شافت.. ابدا العداد! 🚦",
        starter_is: "🗣️ الي يبدا يتكلم هو: ",
        starter_continue: "🗣️ الي يكمل يتكلم هو: ",
        impostor_role: "أنت الكذاب 🤫",
        citizen_role: "أنت مواطن 🤠",
        hint_label: "التلميح:",
        word_label: "الكلمة:",
        edit_impostors_title: "بدّل قداش من كذاب",
        edit_timer_title: "بدّل وقت الطرح (بالدقيقة)",
        correct_guess: "يعطيك الصحة! 🎉 {name} طلع هو البلعوط.",
        wrong_guess: "غالط! ❌ {name} خاطيه مسكين.",
        impostors_were: "البلعوط (البلعوطين):",
        word_was: "الكلمة طلعت:",
        all_impostors_dead: "خرجتو الكذابين الكل! 🎉 المواطنين ربحو!",
        impostors_win: "الكذابين غلبوكم وسيطرو عالطرح! 😈",
        eliminated_msg: "طردنا {name} مالطرح!",
        elimination_cliffhanger: "أما الطرح مازال ما وفاش... زعما طلع هو الكذاب ولا؟ مانا قايلينلكم شي! 🤐",
        continue_discussion: "⏱️ ارجعو قطعو وريشو (دقيقة بركا)"
    }
};

const infoDescriptions = {
    random: {
        ar: "سيتم تجاهل الرقم المحدد، وستختار اللعبة عدداً عشوائياً من الدخلاء (لن يتجاوز نصف عدد اللاعبين).",
        tn: "اللعبة باش تختار قداش من كذاب وحدها زهر، من غير ما تاخو بالرقم الي حطيتو (الماكس شطر الملاعبية)."
    },
    chaos: {
        ar: "يوجد احتمال (حوالي 15%) أن يتم تعيين جميع اللاعبين كدخلاء في نفس الجولة! فوضى عارمة.",
        tn: "فما نسبة صغيرة (حكاية 15%) الي الطرح هذا الناس الكل تطلع كذابة! خلوضة كبيرة."
    },
    elimination: {
        ar: "بعد التصويت على لاعب، يتم استبعاده. إذا لم يكن هو الدخيل، تستمر اللعبة والعداد لجولة تصويت أخرى حتى يتم كشف جميع الدخلاء.",
        tn: "الي نصوتولو يخرج. كان طلع خاطيه، الطرح يكمل والكرونو يرجع يخدم حتى نخرجو الكذابين الكل ولا يغلبونا."
    },
    nohint: {
        ar: "الدخيل لن يحصل على أي تلميح للكلمة. سيتعين عليه الارتجال والاعتماد على كلام الآخرين فقط.",
        tn: "الكذاب ما يجيه حتى تلميح في الكارتة متاعو، سبورة كحلة! يلزمو يدبر راسو ويفهم الكلمة من كلام لخرين."
    },
    allhint: {
        ar: "في حال وجود أكثر من دخيل، سيحصل جميعهم على التلميح الصحيح للكلمة، بدلاً من تلميحات خاطئة ومختلفة.",
        tn: "كان فما برشا كذابين، الكلهم باش يجيهم التلميح الصحيح متاع الكلمة، باش يصعبو الطرح عالمواطنين."
    }
};

let currentLang = 'tn'; // Default Language
// ============================================

let wordsDB = [];
let players = [];
let currentWordObj = null;
let timerInterval = null;
let remainingTime = 0;
let isEliminationMode = false;
let noHintsMode = false;
let currentRevealIndex = 0;
let impostorConfig = 1;
let timerConfig = 3;
let playerCount = 0;

// ====== LOCAL DB LOGIC (IndexedDB - Strictly Per Device, Prevents Cloud Sync) ======
const dbPromise = new Promise((resolve, reject) => {
    try {
        const request = indexedDB.open('DakheelLocalDB', 1);
        request.onupgradeneeded = (e) => {
            e.target.result.createObjectStore('settingsStore');
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null); // Fallback gracefully if Private Mode blocks it
    } catch (e) {
        resolve(null);
    }
});

async function saveSettings() {
    const playerInputs = Array.from(document.querySelectorAll('.player-input')).map(input => input.value);
    const settings = {
        players: playerInputs,
        impostors: impostorConfig,
        timer: timerConfig,
        lang: currentLang,
        randomImpostors: document.getElementById('random-impostors-toggle').checked,
        chaos: document.getElementById('all-impostors-toggle').checked,
        elimination: document.getElementById('elimination-mode').checked,
        noHints: document.getElementById('no-hints-toggle').checked,
        allCorrect: document.getElementById('all-correct-hints-toggle').checked
    };
    
    try {
        const db = await dbPromise;
        if (!db) return;
        const tx = db.transaction('settingsStore', 'readwrite');
        tx.objectStore('settingsStore').put(settings, 'game_settings');
    } catch (e) { console.warn("Saving to local device failed", e); }
}

async function loadSettings() {
    try {
        const db = await dbPromise;
        if (!db) return null;
        return new Promise((resolve) => {
            const tx = db.transaction('settingsStore', 'readonly');
            const req = tx.objectStore('settingsStore').get('game_settings');
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    } catch (e) {
        return null;
    }
}

// Language Toggle Function
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[currentLang][key]) el.innerText = i18n[currentLang][key];
    });
    
    document.querySelectorAll('.player-input').forEach(input => {
        input.placeholder = i18n[currentLang].player_placeholder;
    });

    document.querySelectorAll('.lang-btn').forEach(b => {
        if (b.getAttribute('data-lang') === currentLang) b.classList.add('active');
        else b.classList.remove('active');
    });

    const modalTitle = document.getElementById('modal-title');
    if (modalTitle.innerText.includes("تعديل") || modalTitle.innerText.includes("بدّل")) {
        modalTitle.innerText = editingWhat === 'impostors' 
            ? i18n[currentLang].edit_impostors_title 
            : i18n[currentLang].edit_timer_title;
    }
}

function addPlayerInput(savedName = '') {
    const playersContainer = document.getElementById('players-inputs-container');
    if (!playersContainer) return;
    playerCount++;
    const row = document.createElement('div');
    row.className = 'player-input-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'player-input';
    input.value = savedName; 
    input.placeholder = i18n[currentLang].player_placeholder;
    
    input.addEventListener('input', saveSettings);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-player-btn danger-btn';
    removeBtn.innerHTML = '✖';
    removeBtn.addEventListener('click', () => { 
        row.remove(); 
        saveSettings(); 
    });
    
    row.appendChild(input);
    row.appendChild(removeBtn);
    playersContainer.appendChild(row);
}

let editingWhat = '';
let tempVal = 1;

window.addEventListener('DOMContentLoaded', async () => {
    
    // Apply default language first to prevent flashing
    applyTranslations();

    // 1. Load Settings strictly from the local device hardware
    const parsed = await loadSettings();
    
    if (parsed) {
        currentLang = parsed.lang || 'tn';
        
        // Load checkboxes
        document.getElementById('random-impostors-toggle').checked = !!parsed.randomImpostors;
        document.getElementById('all-impostors-toggle').checked = !!parsed.chaos;
        document.getElementById('elimination-mode').checked = !!parsed.elimination;
        document.getElementById('no-hints-toggle').checked = !!parsed.noHints;
        document.getElementById('all-correct-hints-toggle').checked = !!parsed.allCorrect;

        // Load configs
        impostorConfig = parsed.impostors || 1;
        timerConfig = parsed.timer || 3;

        // Load players
        if (parsed.players && parsed.players.length > 0) {
            parsed.players.forEach(name => addPlayerInput(name));
        } else {
            for (let i = 1; i <= 4; i++) addPlayerInput();
        }
    } else {
        // If brand new device, add 4 empty inputs
        for (let i = 1; i <= 4; i++) addPlayerInput();
    }

    document.getElementById('val-impostors').innerText = impostorConfig;
    document.getElementById('val-timer').innerText = timerConfig.toString().padStart(2, '0') + ':00';

    applyTranslations(); // Re-apply in case it was loaded as 'ar' from DB

    // Trigger visual UI rules
    document.getElementById('random-impostors-toggle').dispatchEvent(new Event('change'));
    document.getElementById('no-hints-toggle').dispatchEvent(new Event('change'));
    document.getElementById('all-correct-hints-toggle').dispatchEvent(new Event('change'));

    // Listen to Checkbox changes to save them instantly
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', saveSettings);
    });

    // Language Switcher Logic
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentLang = e.target.getAttribute('data-lang');
            applyTranslations();
            saveSettings();
        });
    });

    // Reset Default Settings Logic
    document.getElementById('reset-settings-btn').addEventListener('click', async () => {
        if (!confirm(i18n[currentLang].reset_confirm)) return;

        // Wipe DB
        try {
            const db = await dbPromise;
            if (db) {
                const tx = db.transaction('settingsStore', 'readwrite');
                tx.objectStore('settingsStore').delete('game_settings');
            }
        } catch (e) { console.warn("Failed to clear DB", e); }

        // Reset JS Variables
        impostorConfig = 1;
        timerConfig = 3;

        // Reset Checkboxes
        document.getElementById('random-impostors-toggle').checked = false;
        document.getElementById('all-impostors-toggle').checked = false;
        document.getElementById('elimination-mode').checked = false;
        document.getElementById('no-hints-toggle').checked = false;
        document.getElementById('all-correct-hints-toggle').checked = false;

        // Reset Config Visuals
        document.getElementById('val-impostors').innerText = '1';
        document.getElementById('val-timer').innerText = '03:00';

        // Trigger visual UI rules
        document.getElementById('random-impostors-toggle').dispatchEvent(new Event('change'));
        document.getElementById('no-hints-toggle').dispatchEvent(new Event('change'));

        // Reset Players
        const playersContainer = document.getElementById('players-inputs-container');
        playersContainer.innerHTML = '';
        playerCount = 0;
        for (let i = 1; i <= 4; i++) addPlayerInput();

        // Save fresh empty state just in case
        saveSettings();
    });

    // Modals
    const editModal = document.getElementById('edit-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalVal = document.getElementById('modal-val');

    const openImpostorsModal = (e) => {
        if(e) e.preventDefault();
        if(document.getElementById('random-impostors-toggle').checked) return;
        editingWhat = 'impostors';
        tempVal = impostorConfig;
        modalTitle.innerText = i18n[currentLang].edit_impostors_title;
        modalVal.innerText = tempVal;
        editModal.classList.remove('hidden');
        setTimeout(() => editModal.classList.add('active'), 10);
    };

    const openTimerModal = (e) => {
        if(e) e.preventDefault();
        editingWhat = 'timer';
        tempVal = timerConfig;
        modalTitle.innerText = i18n[currentLang].edit_timer_title;
        modalVal.innerText = tempVal;
        editModal.classList.remove('hidden');
        setTimeout(() => editModal.classList.add('active'), 10);
    };

    document.getElementById('btn-edit-impostors').addEventListener('click', openImpostorsModal);
    document.getElementById('btn-edit-impostors').addEventListener('touchstart', openImpostorsModal, { passive: false });
    document.getElementById('btn-edit-timer').addEventListener('click', openTimerModal);
    document.getElementById('btn-edit-timer').addEventListener('touchstart', openTimerModal, { passive: false });

    const handleMinus = (e) => { if(e) e.preventDefault(); if (tempVal > 1) tempVal--; modalVal.innerText = tempVal; };
    const handlePlus = (e) => { if(e) e.preventDefault(); tempVal++; modalVal.innerText = tempVal; };
    document.getElementById('btn-minus').addEventListener('click', handleMinus);
    document.getElementById('btn-minus').addEventListener('touchstart', handleMinus, { passive: false });
    document.getElementById('btn-plus').addEventListener('click', handlePlus);
    document.getElementById('btn-plus').addEventListener('touchstart', handlePlus, { passive: false });

    const handleConfirm = (e) => {
        if(e) e.preventDefault();
        if (editingWhat === 'impostors') {
            impostorConfig = tempVal;
            document.getElementById('val-impostors').innerText = impostorConfig;
        } else {
            timerConfig = tempVal;
            document.getElementById('val-timer').innerText = timerConfig.toString().padStart(2, '0') + ':00';
        }
        saveSettings(); // Save configs locally
        editModal.classList.remove('active');
        setTimeout(() => editModal.classList.add('hidden'), 300);
    };
    document.getElementById('btn-confirm').addEventListener('click', handleConfirm);
    document.getElementById('btn-confirm').addEventListener('touchstart', handleConfirm, { passive: false });

    // Advanced Panel toggle
    const advBtn = document.getElementById('advanced-toggle-btn');
    const advPanel = document.getElementById('advanced-panel');
    const chevron = document.getElementById('advanced-chevron');
    advBtn.addEventListener('click', () => {
        const isOpen = advPanel.classList.toggle('open');
        chevron.classList.toggle('open', isOpen);
    });

    // Info Modal Logic
    const infoModal = document.getElementById('info-modal');
    const infoText = document.getElementById('info-modal-text');
    
    document.querySelectorAll('.info-icon').forEach(icon => {
        const openInfo = (e) => {
            if(e) e.preventDefault();
            const infoKey = e.target.getAttribute('data-info');
            infoText.innerText = infoDescriptions[infoKey][currentLang];
            infoModal.classList.remove('hidden');
            setTimeout(() => infoModal.classList.add('active'), 10);
        };
        icon.addEventListener('click', openInfo);
        icon.addEventListener('touchstart', openInfo, { passive: false });
    });

    const closeInfo = (e) => {
        if(e) e.preventDefault();
        infoModal.classList.remove('active');
        setTimeout(() => infoModal.classList.add('hidden'), 300);
    };
    document.getElementById('close-info-btn').addEventListener('click', closeInfo);
    document.getElementById('close-info-btn').addEventListener('touchstart', closeInfo, { passive: false });

    // Rules logic
    const randomToggle = document.getElementById('random-impostors-toggle');
    const impCard = document.getElementById('btn-edit-impostors');
    randomToggle.addEventListener('change', function () { impCard.classList.toggle('input-disabled', this.checked); });

    const noHintsToggle = document.getElementById('no-hints-toggle');
    const allCorrectToggle = document.getElementById('all-correct-hints-toggle');
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

document.getElementById('add-player-btn').addEventListener('click', () => { 
    addPlayerInput(); 
    saveSettings(); 
});

fetch('word list.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => { wordsDB = data; })
    .catch(err => console.error("Error loading words:", err));

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function triggerAnimation(type) {
    const overlay = document.createElement('div');
    overlay.className = type === 'win' ? 'anim-win-overlay' : 'anim-lose-overlay';
    overlay.innerHTML = type === 'win' ? '🎉' : '☠️';
    document.body.appendChild(overlay);
    if (type === 'lose') {
        const container = document.querySelector('.container');
        container.classList.add('shake-container');
        setTimeout(() => container.classList.remove('shake-container'), 500);
    }
    setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 2500);
}

document.getElementById('start-game-btn').addEventListener('click', () => {
    saveSettings(); // Ensure settings are saved right before starting

    const namesInput = Array.from(document.querySelectorAll('.player-input'))
                           .map((input, idx) => input.value.trim() || `لاعب ${idx + 1}`);

    let impostorCount = impostorConfig;
    const isRandomImpostors = document.getElementById('random-impostors-toggle').checked;
    const allImpostorsToggle = document.getElementById('all-impostors-toggle').checked;
    const timeMins = timerConfig;
    
    isEliminationMode = document.getElementById('elimination-mode').checked;
    noHintsMode = document.getElementById('no-hints-toggle').checked;
    const allCorrectHints = document.getElementById('all-correct-hints-toggle').checked;

    if (namesInput.length < 3) {
        document.getElementById('setup-error').innerText = "يجب أن يكون هناك 3 لاعبين على الأقل.";
        return;
    }

    if (isRandomImpostors) {
        const maxImpostors = Math.floor(namesInput.length / 2);
        impostorCount = Math.floor(Math.random() * maxImpostors) + 1;
    } else if (impostorCount >= namesInput.length) {
        document.getElementById('setup-error').innerText = "عدد الدخلاء يجب أن يكون أقل من عدد اللاعبين.";
        return;
    }

    if (wordsDB.length === 0) {
        document.getElementById('setup-error').innerText = "جاري تحميل الكلمات، يرجى الانتظار والمحاولة مجدداً.";
        return;
    }

    document.getElementById('setup-error').innerText = "";

    players = namesInput.map(name => ({
        name, isImpostor: false, customHint: "", eliminated: false, viewedCard: false
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
        const wrongHints = wordsDB.filter(w => w.word !== currentWordObj.word).map(w => w.hint).sort(() => 0.5 - Math.random());
        let hIndex = 0;
        for (let i = 0; i < impostorPlayers.length; i++) {
            if (i === luckyIndex) impostorPlayers[i].customHint = currentWordObj.hint;
            else { impostorPlayers[i].customHint = wrongHints[hIndex % wrongHints.length]; hIndex++; }
        }
    }

    remainingTime = timeMins * 60;
    currentRevealIndex = 0;
    
    renderSingleCard();
    showScreen('reveal-screen');
});

function renderSingleCard() {
    const container = document.getElementById('single-card-container');
    const titleMsg = document.getElementById('current-player-turn-msg');
    const nextBtn = document.getElementById('next-player-btn');

    container.innerHTML = '';
    nextBtn.classList.add('hidden');

    const player = players[currentRevealIndex];
    titleMsg.innerText = (currentLang === 'tn' ? "دالّتك يا " : "الدور الحالي: يا ") + player.name;

    const card = document.createElement('div');
    card.className = 'flip-card';

    let roleText;
    if (player.isImpostor) {
        roleText = noHintsMode
            ? `${i18n[currentLang].impostor_role}`
            : `${i18n[currentLang].impostor_role}<br><br><span style="font-size:16px;">${i18n[currentLang].hint_label}</span><br>${player.customHint}`;
    } else {
        roleText = `${i18n[currentLang].citizen_role}<br><br><span style="font-size:16px;">${i18n[currentLang].word_label}</span><br>${currentWordObj.word}`;
    }

    card.innerHTML = `
        <div class="flip-card-inner">
            <div class="flip-card-front"><span>${i18n[currentLang].card_of}${player.name}</span></div>
            <div class="flip-card-back"><span>${roleText}</span></div>
        </div>`;

    const showCard = (e) => { e.preventDefault(); card.classList.add('flipped'); player.viewedCard = true; };
    const hideCard = (e) => {
        e.preventDefault();
        if (!card.classList.contains('flipped')) return;
        card.classList.remove('flipped');
        nextBtn.innerText = currentRevealIndex < players.length - 1
            ? `${i18n[currentLang].pass_to}${players[currentRevealIndex + 1].name}`
            : i18n[currentLang].all_seen;
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
        const starterPlayer = players[Math.floor(Math.random() * players.length)];
        document.getElementById('starter-player').innerText = `${i18n[currentLang].starter_is}${starterPlayer.name}`;
        
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
    const nextBtn = document.getElementById('next-round-btn');
    revealBox.innerHTML = '';

    const trans = i18n[currentLang];

    if (!isEliminationMode) {
        if (votedPlayer.isImpostor) {
            triggerAnimation('win');
            resultMsg.innerText = trans.correct_guess.replace('{name}', votedPlayer.name);
        } else {
            triggerAnimation('lose');
            resultMsg.innerText = trans.wrong_guess.replace('{name}', votedPlayer.name);
        }

        const allImpostors = players.filter(p => p.isImpostor).map(p => p.name).join(' و ');
        revealBox.innerHTML = `${trans.impostors_were}<br><strong style="color:var(--accent-color);">${allImpostors}</strong><br><br>${trans.word_was} <strong>${currentWordObj.word}</strong>`;
        nextBtn.innerText = trans.next_round_btn;
        nextBtn.onclick = () => showScreen('setup-screen');

    } else {
        votedPlayer.eliminated = true;
        const remainingImpostors = players.filter(p => p.isImpostor && !p.eliminated);
        const remainingRegulars  = players.filter(p => !p.isImpostor && !p.eliminated);

        if (remainingImpostors.length === 0) {
            triggerAnimation('win');
            resultMsg.innerText = trans.all_impostors_dead;
            revealBox.innerHTML = `${trans.word_was} <strong>${currentWordObj.word}</strong>`;
            nextBtn.innerText = trans.next_round_btn;
            nextBtn.onclick = () => showScreen('setup-screen');
        } else if (remainingImpostors.length >= remainingRegulars.length) {
            triggerAnimation('lose');
            resultMsg.innerText = trans.impostors_win;
            const allImpostors = players.filter(p => p.isImpostor).map(p => p.name).join(' و ');
            revealBox.innerHTML = `${trans.impostors_were}<br><strong style="color:var(--accent-color);">${allImpostors}</strong><br><br>${trans.word_was} <strong>${currentWordObj.word}</strong>`;
            nextBtn.innerText = trans.next_round_btn;
            nextBtn.onclick = () => showScreen('setup-screen');
        } else {
            if (!votedPlayer.isImpostor) triggerAnimation('lose');
            
            resultMsg.innerText = trans.eliminated_msg.replace('{name}', votedPlayer.name);
            revealBox.innerHTML = trans.elimination_cliffhanger;
            nextBtn.innerText = trans.continue_discussion;
            nextBtn.onclick = () => {
                remainingTime = 60;
                const alivePlayers = players.filter(p => !p.eliminated);
                const starterPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                document.getElementById('starter-player').innerText = `${trans.starter_continue}${starterPlayer.name}`;

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
