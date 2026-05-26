// ===== TRANSLATIONS DICTIONARY =====
const i18n = {
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
        reveal_player_prefix: "كارطتك يا ",
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
        citizen_role: "جوّك باهي 🤠",
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
    random: { tn: "اللعبة باش تختار قداش من كذاب وحدها زهر، من غير ما تاخو بالرقم الي حطيتو (الماكس شطر الملاعبية)." },
    chaos: { tn: "فما نسبة صغيرة (حكاية 15%) الي الطرح هذا الناس الكل تطلع كذابة! خلوضة كبيرة." },
    elimination: { tn: "الي نصوتولو يخرج. كان طلع خاطيه، الطرح يكمل والكرونو يرجع يخدم حتى نخرجو الكذابين الكل ولا يغلبونا." },
    nohint: { tn: "الكذاب ما يجيه حتى تلميح في الكارتة متاعو، سبورة كحلة! يلزمو يدبر راسو ويفهم الكلمة من كلام لخرين." },
    allhint: { tn: "كان فما برشا كذابين، الكلهم باش يجيهم التلميح الصحيح متاع الكلمة، باش يصعبو الطرح على العاديين." }
};

// ============================================
// +18 OBFUSCATED DICTIONARY AND UI DECODER
// ============================================
(function _decodeUI() {
    function d(s) { return JSON.parse(decodeURIComponent(escape(atob(s)))); }
    try {
        i18n.x18 = d('eyJ0aXRsZSI6ICLwn5W177iP4oCN4pmC77iPINi02KjZitmDINiq2K3YtNmKINmB2YrZh9ifIiwgInNldHRpbmdzX3RpdGxlIjogItix2YPZkditINiy2KjZiNix2YMg2YTZhNi32LHYrSIsICJwbGF5ZXJzX2xhYmVsIjogIvCfkaUg2KfYs9in2YXZitmD2YU6IiwgImFkZF9wbGF5ZXJfYnRuIjogIuKelSDYstmK2K8g2YLYrdio2YjZhiDYotiu2LEiLCAiaW1wb3N0b3JzX2xhYmVsIjogIvCfjq0g2YLYr9in2LQg2YXZhiDYqNmE2LnZiNi32J8iLCAidGltZXJfbGFiZWwiOiAi4o+x77iPINmI2YLYqiDYp9mE2LfYsditIiwgImFkdmFuY2VkX2J0biI6ICLwn5SnINiy2YrYryDYqNi52KjYtSIsICJhZHZfcmFuZG9tIjogIvCfjrIg2KfZhNmE2LnYqNipINiq2YbZitmDINix2YjYrdmH2Kcg2KPZhdmI2LEg2YPYsNin2KjZitmGIiwgImFkdl9jaGFvcyI6ICLwn5iIINmG2YrZgyDYrdmEINmB2KrYsdmK2KkiLCAiYWR2X2VsaW1pbmF0aW9uIjogIuKalO+4jyDZhtmK2YMg2YPZhCDZiNin2K3YryDZiNit2K/ZiCIsICJhZHZfbm9oaW50IjogIvCfmYgg2KfZhNmD2LDYp9ioINi52LXYqNipINmE2YrZhyIsICJhZHZfYWxsaGludCI6ICLwn5KhINin2YTZg9iw2KfYqNmK2YYg2KfZhNmD2YQg2YrYp9iu2LDZiCDZhtmB2LMg2KfZhNiq2YTZhdmK2K0iLCAic3RhcnRfYnRuIjogIvCfmoAg2YLYr9mR2YUg2YbZitmR2YMiLCAicmVzZXRfYnRuIjogIvCflIQg2YHYs9mR2K4g2YjYsdis2ZHYuSDZg9mK2YXYpyDZg9in2YYiLCAicmVzZXRfY29uZmlybSI6ICLZhdiq2KPZg9ivINiq2K3YqCDYqtmB2LPZkdiuINin2YTYo9iz2KfZhdmKINin2YTZg9mEINmI2KrYsdis2ZHYuSDZg9mEINi02Yog2YPZitmF2Kcg2YPYp9mG2J8iLCAicmV2ZWFsX3RpdGxlIjogIvCfg48g2LTZg9mI2YYg2LTZhtmK2KkiLCAicmV2ZWFsX2luc3RydWN0aW9ucyI6ICLYp9mC2LnYryDYqNi52KjYtSDZgdmKINin2YTZg9in2LHYqtipINio2KfYtCDYqti52LHZgSDYr9mI2LHZg9iMINmD2Yog2KrYs9mK2KjZiCDZitix2KzYuSDYudmE2YrZgyIsICJyZXZlYWxfcGxheWVyX3ByZWZpeCI6ICLZhtmF2KfZhdiq2YMg2YrYpyIsICJkaXNjdXNzaW9uX3RpdGxlIjogIvCfkqwg2YjZgtiqINiq2YbZitmD2YTZh9inINij2YXZh9inIiwgInZvdGVfYnRuIjogIvCfl7PvuI8g2LPZg9ixINi52YTZiSDYstio2YrYjCDYudix2YHZhtinINin2YTYqNmE2LnZiNi3IiwgInZvdGluZ190aXRsZSI6ICLwn5ez77iPINin2YTZgdix2LIiLCAid2hvX2ltcG9zdG9yIjogIti02YPZiNmG2Ygg2YfYp9mE2LLYqNmI2LHYnyIsICJyZXN1bHRfdGl0bGUiOiAi8J+PhiDYtNmD2YjZhiDYt9mE2LnYnyIsICJuZXh0X3JvdW5kX2J0biI6ICLwn5SEINi52KfZiNivINin2YbYr9mHIiwgImRvbmVfYnRuIjogIti52LXYqNipINmE2YrZhyIsICJpbmZvX3RpdGxlIjogIuKEue+4jyDZhdi52YTZiNmF2KkiLCAiY2xvc2VfYnRuIjogIti52LXYqNipINmE2YrZgyIsICJwbGF5ZXJfcGxhY2Vob2xkZXIiOiAi2KfYs9mFINin2YTZhNin2LnYqCIsICJjYXJkX29mIjogItin2YTZg9in2LHYqtipINmF2KrYp9i5ICIsICJwYXNzX3RvIjogItmF2KfZgyDYudix2YHYqiDYqtit2LHZg9iMINmG2YrZgyDYudiv2Yog2YTZhNmKINio2LnYr9mDICIsICJhbGxfc2VlbiI6ICLYp9mE2YbYp9izINin2YTZg9mEINi02KfZgdiqLi4g2KfYqNiv2Kcg2KfZhNi52K/Yp9ivISDwn5qmIiwgInN0YXJ0ZXJfaXMiOiAi8J+Xo++4jyDYp9mE2Yog2YrYqNiv2Kcg2YrYqtmD2YTZhSDZh9mIOiAiLCAic3RhcnRlcl9jb250aW51ZSI6ICLwn5ej77iPINin2YTZiiDZitmD2YXZhCDZitiq2YPZhNmFINmH2Yg6ICIsICJpbXBvc3Rvcl9yb2xlIjogItmK2LnYt9mDINi52LXYqNipINix2KfZgyDZg9iw2KfYqCDwn6SrIiwgImNpdGl6ZW5fcm9sZSI6ICLZh9in2YMg2K3YtNmK2KrZiCDwn6SgIiwgImhpbnRfbGFiZWwiOiAi2KfZhNiq2YTZhdmK2K06IiwgIndvcmRfbGFiZWwiOiAi2KfZhNmD2YTZhdipOiIsICJlZGl0X2ltcG9zdG9yc190aXRsZSI6ICLYqNiv2ZHZhCDZgtiv2KfYtCDZhdmGINmD2LDYp9ioIiwgImVkaXRfdGltZXJfdGl0bGUiOiAi2KjYr9mR2YQg2YjZgtiqINin2YTYt9ix2K0gKNio2KfZhNiv2YLZitmC2KkpIiwgImNvcnJlY3RfZ3Vlc3MiOiAi2KfZiNmHINi52YTZiSDYp9mE2LLYqNmKINmH2KfZgyDYt9mE2LnYqtmIISDwn46JIHtuYW1lfSDYt9mE2Lkg2YfZiCDYp9mE2KjZhNi52YjYty4iLCAid3JvbmdfZ3Vlc3MiOiAi2YrYudi32YMg2LnYtdio2Kkg2LHYp9mDINi62KfZhNi3ISDinYwge25hbWV9INiu2KfYt9mK2Ycg2YXYs9mD2YrZhi4iLCAiaW1wb3N0b3JzX3dlcmUiOiAi2KfZhNio2YTYudmI2LcgKNin2YTYqNmE2LnZiNi32YrZhik6IiwgIndvcmRfd2FzIjogItin2YTZg9mE2YXYqSDYt9mE2LnYqjoiLCAiYWxsX2ltcG9zdG9yc19kZWFkIjogItiu2LHYrNiq2Ygg2KfZhNmD2LDYp9io2YrZhiDYp9mE2YPZhCEg8J+OiSDYp9mE2YXZiNin2LfZhtmK2YYg2LHYqNit2YghIiwgImltcG9zdG9yc193aW4iOiAi2KfZhNmD2LDYp9io2YrZhiDYutmE2KjZiNmD2YUg2YjYs9mK2LfYsdmIINi52KfZhNi32LHYrSEg8J+YiCIsICJlbGltaW5hdGVkX21zZyI6ICLYt9ix2K/ZhtinIHtuYW1lfSDZhdin2YTYt9ix2K0hIiwgImVsaW1pbmF0aW9uX2NsaWZmaGFuZ2VyIjogItij2YXYpyDYp9mE2LfYsditINmF2KfYstin2YQg2YXYpyDZiNmB2KfYtC4uLiDYsti52YXYpyDYt9mE2Lkg2YfZiCDYp9mE2YPYsNin2Kgg2YjZhNin2J8g2YXYp9mG2Kcg2YLYp9mK2YTZitmG2YTZg9mFINi02YohIPCfpJAiLCAiY29udGludWVfZGlzY3Vzc2lvbiI6ICLij7HvuI8g2KfYsdis2LnZiCDZgti32LnZiCDZiNix2YrYtNmIICjYr9mC2YrZgtipINio2LHZg9inKSJ9');
        const infos = d('eyJyYW5kb20iOiAi2KfZhNmE2LnYqNipINio2KfYtCDYqtiu2KrYp9ixINmC2K/Yp9i0INmF2YYg2YXZhtmK2YPZitmGINmI2K3Yr9mH2Kcg2LLZh9ix2Iwg2YXZhiDYutmK2LEg2YXYpyDYqtin2K7ZiCDYqNin2YTYsdmC2YUg2KfZhNmKINit2LfZitiq2YggKNin2YTZhdin2YPYsyDYtNi32LEg2KfZhNmF2YTYp9i52KjZitipKS4iLCAiY2hhb3MiOiAi2YHZhdinINmG2LPYqNipINi12LrZitix2KkgKNit2YPYp9mK2KkgMTUlKSDYp9mE2Yog2KfZhNi32LHYrSDZh9iw2Kcg2KfZhNmG2KfYsyDYp9mE2YPZhCDYqti32YTYuSDZg9iw2KfYqNipISDYrtmE2YjYttipINmD2KjZitix2KkuIiwgImVsaW1pbmF0aW9uIjogItin2YTZiiDYqtmG2YrZg9mIINmK2K7YsdisLiDZg9in2YYg2LfZhNi5INiu2KfYt9mK2YfYjCDYp9mE2LfYsditINmK2YPZhdmEINmI2KfZhNmD2LHZiNmG2Ygg2YrYsdis2Lkg2YrYrtiv2YUg2K3YqtmJINmG2K7Ysdis2Ygg2KfZhNio2YTYudmI2LfZitmGINin2YTZg9mEINmI2YTYpyDZiti62YTYqNmI2YbYpy4iLCAibm9oaW50IjogItin2YTZg9iw2KfYqCDZhdinINmK2YbZitmDINit2KrZiSDYudi12KjYqSDZhdmGINin2YTZhNi52KjYqdiMINmE2Kcg2KrZhNmF2YrYrSDZhNinINiy2KjZii4g2YrZhNiy2YXZiCDZitiv2KjYsSDYsdin2LPZiCDZiNmK2YHZh9mFINin2YTZg9mE2YXYqSDZhdmGINmD2YTYp9mFINmE2K7YsdmK2YYuIiwgImFsbGhpbnQiOiAi2YPYp9mGINmB2YXYpyDYqNix2LTYpyDZg9iw2KfYqNmK2YbYjCDYp9mE2YPZhNmH2YUg2KjYp9i0INmK2KzZitmH2YUg2KfZhNiq2YTZhdmK2K0g2KfZhNi12K3ZititINmF2KrYp9i5INin2YTZg9mE2YXYqdiMINio2KfYtCDZiti12LnYqNmIINin2YTYt9ix2K0g2LnZhNmJINin2YTYudin2K/ZitmK2YYuIn0=');
        Object.keys(infos).forEach(k => { if (infoDescriptions[k]) infoDescriptions[k].x18 = infos[k]; });
        const ui = d('eyJidG4iOiAi8J+UniArMTgiLCAibW9kYWxfaWNvbiI6ICLwn5SeIiwgIm1vZGFsX3RpdGxlIjogItmF2K3YqtmI2Ykg2YTZhNmD2KjYp9ixINmB2YLYtyIsICJtb2RhbF9kZXNjIjogItij2K/YrtmEINin2YTZg9mE2YXYqSDYp9mE2LPYsdmK2Kkg2KjYp9i0INiq2YPZhdmEIiwgIm1vZGFsX3BsYWNlaG9sZGVyIjogIvCflJEg2KfZhNmD2YTZhdipINin2YTYs9ix2YrYqSIsICJtb2RhbF9lcnIiOiAi4p2MINmD2YTZhdipINiz2LHZitipINi62YTYtyEiLCAibW9kYWxfcmVtIjogItin2KjZgtin2YTZiiDZgdin2KrYrSArMTgifQ==');
        
        function applyUI() {
            const x18Btn = document.getElementById('x18-btn-ui'); if(x18Btn) x18Btn.innerText = ui.btn;
            const pwIcon = document.getElementById('pw-icon-ui'); if(pwIcon) pwIcon.innerText = ui.modal_icon;
            const pwTitle = document.getElementById('pw-title-ui'); if(pwTitle) pwTitle.innerText = ui.modal_title;
            const pwDesc = document.getElementById('pw-desc-ui'); if(pwDesc) pwDesc.innerText = ui.modal_desc;
            const pwInput = document.getElementById('password-input'); if(pwInput) pwInput.placeholder = ui.modal_placeholder;
            const pwErr = document.getElementById('password-error'); if(pwErr) pwErr.innerText = ui.modal_err;
            const pwRem = document.getElementById('pw-rem-ui'); if(pwRem) pwRem.innerText = ui.modal_rem;
        }
        
        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', applyUI); } else { applyUI(); }
    } catch(e) { console.warn("UI sync failed"); }
})();

let currentLang = 'tn'; // Default Language
let x18Unlocked = false;  // Tracks whether +18 was authenticated this session

let currentLang = 'tn'; // Default Language
let x18Unlocked = false;  // Tracks whether +18 was authenticated this session
// ============================================

let wordsDB = [];
let regularWordsDB = [];
let adultWordsDB = [];
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
        if (i18n[currentLang] && i18n[currentLang][key]) el.innerText = i18n[currentLang][key];
    });
    
    document.querySelectorAll('.player-input').forEach(input => {
        input.placeholder = i18n[currentLang].player_placeholder;
    });

    // Update pill selector active state
    document.querySelectorAll('.lang-pill-btn').forEach(b => {
        if (b.getAttribute('data-lang') === currentLang) b.classList.add('active');
        else b.classList.remove('active');
    });

    // Apply +18 body class for theming
    document.body.classList.toggle('lang-x18', currentLang === 'x18');

    const modalTitle = document.getElementById('modal-title');
    if (modalTitle && (modalTitle.innerText.includes("تعديل") || modalTitle.innerText.includes("بدّل"))) {
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
        // Restore +18 only if user explicitly chose to remember it
        currentLang = parsed.lang || 'tn';
        if (currentLang === 'x18') x18Unlocked = true;
        
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

    // Language Pill Selector Logic
    document.querySelectorAll('.lang-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            if (lang === 'x18') {
                if (x18Unlocked) {
                    // Already authenticated this session — switch directly
                    currentLang = 'x18';
                    applyTranslations();
                    return;
                }
                // Show password modal
                const pwModal = document.getElementById('password-modal');
                const pwInput = document.getElementById('password-input');
                const pwError = document.getElementById('password-error');
                pwInput.value = '';
                pwError.style.display = 'none';
                pwModal.classList.remove('hidden');
                setTimeout(() => { pwModal.classList.add('active'); pwInput.focus(); }, 10);
            } else {
                currentLang = lang;
                applyTranslations();
                saveSettings(); // clears any remembered x18
            }
        });
    });

    // Password modal logic
    const pwModal = document.getElementById('password-modal');
    const pwInput = document.getElementById('password-input');
    const pwError = document.getElementById('password-error');

    function closePwModal() {
        pwModal.classList.remove('active');
        setTimeout(() => pwModal.classList.add('hidden'), 300);
    }

    document.getElementById('password-confirm-btn').addEventListener('click', () => {
        if (pwInput.value === 'simba') {
            x18Unlocked = true;
            currentLang = 'x18';
            applyTranslations();
            // Only persist if "remember me" is checked
            if (document.getElementById('pw-remember-toggle').checked) {
                saveSettings();
            } else {
                // Save everything except the lang (keep previous lang in DB)
                saveSettings();
                // Overwrite the lang key back to 'tn' in DB silently
                (async () => {
                    try {
                        const db = await dbPromise;
                        if (!db) return;
                        const tx = db.transaction('settingsStore', 'readwrite');
                        const store = tx.objectStore('settingsStore');
                        const req = store.get('game_settings');
                        req.onsuccess = () => {
                            const existing = req.result || {};
                            existing.lang = 'tn';
                            store.put(existing, 'game_settings');
                        };
                    } catch(e) {}
                })();
            }
            closePwModal();
        } else {
            pwError.style.display = 'block';
            pwInput.value = '';
            pwInput.focus();
            pwInput.classList.add('shake-input');
            setTimeout(() => pwInput.classList.remove('shake-input'), 400);
        }
    });

    document.getElementById('password-cancel-btn').addEventListener('click', closePwModal);

    pwInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('password-confirm-btn').click();
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
    .then(data => { regularWordsDB = data; })
    .catch(err => console.error("Error loading regular words:", err));

// Adult word list is decoded at runtime from adult_words_data.js (obfuscated)
(function _loadAdultWords() {
    if (window._adultWordsDecoded && window._adultWordsDecoded.length) {
        adultWordsDB = window._adultWordsDecoded;
    } else {
        // Fallback: retry after the script has had time to execute
        document.addEventListener('DOMContentLoaded', () => {
            if (window._adultWordsDecoded) adultWordsDB = window._adultWordsDecoded;
        });
    }
})();

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function triggerAnimation(type) {
    const overlay = document.createElement('div');

    if (type === 'win') {
        overlay.className = 'anim-win-overlay';
        document.body.appendChild(overlay);

        // Burst particles
        const winEmojis = ['🎉','🏆','🎊','⭐','✨','🎈','🥳','🌟','💫','🎆','🎇','🏅','🌈','💥'];
        const count = 14;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'win-particle';
            p.innerText = winEmojis[i % winEmojis.length];
            const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
            const dist  = 100 + Math.random() * 130;
            p.style.setProperty('--dx',    (Math.cos(angle) * dist).toFixed(1) + 'px');
            p.style.setProperty('--dy',    (Math.sin(angle) * dist).toFixed(1) + 'px');
            p.style.setProperty('--rot',   (Math.random() * 720 - 360).toFixed(0) + 'deg');
            p.style.setProperty('--delay', (Math.random() * 0.28).toFixed(2) + 's');
            overlay.appendChild(p);
        }

        // Big center emoji
        const center = document.createElement('div');
        center.className = 'win-center';
        center.innerText = '🎉';
        overlay.appendChild(center);

        setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 2800);

    } else {
        overlay.className = 'anim-lose-overlay';
        document.body.appendChild(overlay);

        // Falling skull
        const center = document.createElement('div');
        center.className = 'lose-center';
        center.innerText = '💀';
        overlay.appendChild(center);

        // Shake the container
        const container = document.querySelector('.container');
        container.classList.add('shake-container');
        setTimeout(() => container.classList.remove('shake-container'), 600);

        setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 2800);
    }
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
    noHintsMode = document.getElementById('no-hints-toggle').checked || currentLang === 'x18';
    const allCorrectHints = document.getElementById('all-correct-hints-toggle').checked;

    // Pick the right word list
    wordsDB = currentLang === 'x18' ? adultWordsDB : regularWordsDB;

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
    titleMsg.innerText = i18n[currentLang].reveal_player_prefix + player.name;

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
