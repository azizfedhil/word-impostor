'use strict';

function _now() {
    return (window.onlineMode && typeof window._syncedNow === 'function') ? window._syncedNow() : Date.now();
}


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
        setTimeout(() => { current.classList.remove('exiting'); if (!current.classList.contains('active')) current.hidden = true; }, 260);
    }
    requestAnimationFrame(() => next.classList.add('active'));
}
window.showScreen = showScreen;

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

function triggerNotLyingAnimation(playerName) {
    const overlay = document.createElement('div');
    overlay.className = 'anim-win-overlay not-lying-announcement';
    document.body.appendChild(overlay);
    const content = document.createElement('div');
    content.className = 'not-lying-content';
    content.innerHTML = `<div class="not-lying-icon">🛡️</div><div class="not-lying-name">${_escapeHtml(playerName)}</div><div class="not-lying-label">ما طلعش يكذب!</div><div class="not-lying-sub">الكارتة تبدلت بوحدة جديدة من الدكة.</div>`;
    overlay.appendChild(content);
    _sfx.win();
    setTimeout(() => { overlay.classList.add('fade-out'); setTimeout(() => overlay.remove(), 600); }, 2800);
}
window.triggerNotLyingAnimation = triggerNotLyingAnimation;

function triggerWinnerAnnouncement(winnerName) {
    const overlay = document.createElement('div');
    overlay.className = 'anim-win-overlay winner-announcement';
    document.body.appendChild(overlay);
    const emojis = ['🎉','🏆','🎊','⭐','✨','🎈','🥳','🌟','💫','🎆','🎇','🏅','🌈','💥'];
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div'); p.className = 'win-particle'; p.innerText = emojis[i % emojis.length];
        const angle = Math.random() * 2 * Math.PI; const dist = 50 + Math.random() * 250;
        p.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
        p.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
        p.style.setProperty('--rot', (Math.random() * 1080 - 540).toFixed(0) + 'deg');
        p.style.setProperty('--delay', (Math.random() * 0.5).toFixed(2) + 's');
        overlay.appendChild(p);
    }
    const content = document.createElement('div'); content.className = 'winner-content';
    content.innerHTML = `<div class="winner-trophy">🏆</div><div class="winner-name">${_escapeHtml(winnerName)}</div><div class="winner-label">ربح الطرح!</div>`;
    overlay.appendChild(content);
    _sfx.win();
    document.getElementById('coup-turn-indicator')?.classList.add('hidden');
    setTimeout(() => { overlay.classList.add('fade-out'); setTimeout(() => overlay.remove(), 800); }, 4000);
}
window.triggerWinnerAnnouncement = triggerWinnerAnnouncement;

// ============================================================
// TRANSLATIONS APPLY
// applyTranslations is defined in core/i18n.js (single source of truth).
// shared.js delegates to it.
// ============================================================

// ============================================================
// GAME MODE
// ============================================================
function setGameMode(mode, goSetup = true) {
    // Teardown the current game before switching
    const prevReg = window.GameRegistry?.[GameState.getCurrentGameMode()];
    if (typeof prevReg?.teardown === 'function') prevReg.teardown();

    GameState.setCurrentGameMode(mode);
    currentGameMode = GameState.getCurrentGameMode();
    // Only games that opt-in to language variants keep non-default lang
    if (!window.GameRegistry?.[currentGameMode]?.supportsLangVariants) currentLang = 'tn';
    // Let each game set its own default timer via registry
    const reg = window.GameRegistry?.[currentGameMode] || {};
    if (typeof reg.defaultTimerConfig === 'number') {
        timerConfig = reg.defaultTimerConfig;
        const timerVal = document.getElementById('val-timer');
        if (timerVal) timerVal.innerText = timerConfig;
    }
    document.body.classList.add('game-switching');
    clearTimeout(document.body._gameSwitchTimer);
    document.body._gameSwitchTimer = setTimeout(() => document.body.classList.remove('game-switching'), 520);
    updateGameModeUI();
    if (goSetup) {
        const firstScreen = reg.firstScreen || 'setup-screen';
        showScreen(firstScreen);
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
    const meta = GameState.getGameMeta(currentGameMode);
    const reg  = window.GameRegistry?.[currentGameMode] || {};
    // CSS game class — drive from registry or fall back to name
    ['impostor','thief','spyfall','coup','chkobba'].forEach(g =>
        document.body.classList.toggle('game-' + g, currentGameMode === g));
    // Turn indicator only shown by coup
    document.getElementById('coup-turn-indicator')
        ?.classList.toggle('hidden', currentGameMode !== 'coup');
    // Header title
    const title = document.querySelector('header h1');
    if (title) title.innerText = meta.title || currentGameMode;
    // Active switcher button
    document.querySelectorAll('.game-switch-option').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.gameMode === currentGameMode));
    // Setup-screen buttons
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) startBtn.innerText = meta.start || '🚀 ابدا';
    const onlineBtn = document.getElementById('open-online-btn');
    if (onlineBtn) onlineBtn.innerText = meta.online || '🌐 العب أونلاين مع أصحابك';
    // Game-specific vote/who labels — read from registry, fall back to i18n
    const voteBtn = document.getElementById('go-to-vote-btn');
    if (voteBtn) voteBtn.innerText = reg.voteBtnLabel || i18n[currentLang].vote_btn || '🗳️ صوّت';
    const who = document.querySelector('[data-i18n="who_impostor"]');
    if (who) who.innerText = reg.whoLabel || i18n[currentLang].who_impostor || 'شكونو؟';
    const timerLabel = document.querySelector('[data-i18n="timer_label"]');
    if (timerLabel) timerLabel.innerText = reg.timerLabel || i18n[currentLang].timer_label || '⏱️ وقت';
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
// TOGGLE RULES
// ============================================================
function checkRules() {
    document.getElementById('imp-control').classList.toggle('disabled-ui', _togActive('t-random'));
    const noHint = _togActive('t-nohint'), allHint = _togActive('t-allhint');
    const nohintRow = document.getElementById('nohint-row');
    const allhintRow = document.getElementById('allhint-row');
    if (noHint) { _togSet('t-allhint', false); allhintRow?.classList.add('disabled-ui'); } else { allhintRow?.classList.remove('disabled-ui'); }
    if (allHint) { _togSet('t-nohint', false); nohintRow?.classList.add('disabled-ui'); } else { nohintRow?.classList.remove('disabled-ui'); }
    saveSettings();
}


// ============================================================
// OFFLINE CARD REVEAL — shared platform UI for all role-reveal games
// ============================================================
function renderSingleCard() {
    const container = document.getElementById('single-card-container');
    const nextBtn = document.getElementById('next-player-btn');
    container.innerHTML = ''; nextBtn.classList.add('hidden');
    const player = players[currentRevealIndex];
    document.getElementById('current-player-turn-msg').innerText = i18n[currentLang].reveal_player_prefix + player.name;
    let roleText;
    // Delegate card content to the active game's registry renderer
    const _reg = window.GameRegistry?.[currentGameMode];
    if (_reg?.renderCardContent) {
        roleText = _reg.renderCardContent(player, currentLang);
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

// handleVote — pure registry dispatcher; no game names in platform code
function handleVote(votedPlayer) {
    const handler = window.GameRegistry?.[currentGameMode]?.handleVote;
    if (handler) { handler(votedPlayer); return; }
    // Fallback for backward compat
    ImpostorGame?.handleVote?.(votedPlayer);
}
window.handleVote = handleVote;


function goToVoting() {
    showScreen('voting-screen');
    const list = document.getElementById('voting-list'); list.innerHTML = '';
    const reg = window.GameRegistry?.[currentGameMode] || {};
    const votingTitle = document.querySelector('[data-i18n="voting_title"]');
    if (votingTitle) votingTitle.innerText = reg.votingTitle || i18n[currentLang].voting_title || '🗳️ الفرز';
    const whoEl = document.querySelector('[data-i18n="who_impostor"]');
    if (whoEl) whoEl.innerText = reg.whoLabel || i18n[currentLang].who_impostor || 'شكونو؟';
    players.filter(p => !p.eliminated).forEach(player => {
        if (reg.excludeFromVote?.(player)) return;
        const btn = document.createElement('button'); btn.className = 'vote-item';
        btn.innerText = (reg.voteBtnPrefix || '🗳️ ') + player.name;
        btn.onclick = () => handleVote(player);
        list.appendChild(btn);
    });
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

function _cleanupOnlineGameUI() {
    document.querySelectorAll('.online-round-players').forEach(el => el.remove());
    document.getElementById('online-coup-leave-btn')?.remove();
    document.getElementById('lobby-settings-btn')?.remove();
    document.getElementById('lobby-settings-panel')?.remove();
}





// ============================================================
// HTML ESCAPE
// ============================================================
function _escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}
window._escapeHtml = _escapeHtml;


// ============================================================
// SHARED SETUP WIRING — called by each game's init function
// ============================================================
async function initSharedSetup(gameMode) {
    currentGameMode = gameMode;
    try { localStorage.setItem(GAME_MODE_KEY, currentGameMode); } catch(_) {}
    currentLang = 'tn';
    x18Unlocked = hasRememberedX18Unlock();
    applyTranslations();

    const parsed = await loadSettings();
    if (parsed) {
        _togSet('t-random', parsed.randomImpostors);
        _togSet('t-chaos', parsed.chaos);
        _togSet('t-elimination', parsed.elimination);
        _togSet('t-nohint', parsed.noHints);
        _togSet('t-allhint', parsed.allCorrect);
        impostorConfig = parsed.impostors || 1;
        timerConfig = parsed.timer || 3;
        if (parsed.players && parsed.players.length > 0) parsed.players.forEach(n => addPlayerInput(n));
        else for (let i = 0; i < 4; i++) addPlayerInput();
    } else {
        for (let i = 0; i < 4; i++) addPlayerInput();
    }

    if (currentGameMode === 'coup') timerConfig = window.GameRegistry?.['coup']?.defaultTimerConfig ?? 1;
    const timerValEl = document.getElementById('val-timer');
    if (timerValEl) timerValEl.innerText = timerConfig;
    const impValEl = document.getElementById('val-impostors');
    if (impValEl) impValEl.innerText = impostorConfig;

    applyTranslations();
    checkRules();
    updateGameModeUI();

    // Game switcher header
    document.querySelectorAll('[data-game-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetMode = btn.dataset.gameMode;
            document.getElementById('game-switch-menu')?.classList.add('hidden');
            // Navigate to that game's HTML file
            window.location.href = `${targetMode}.html`;
        });
    });
    document.getElementById('back-to-mode-select-btn')?.addEventListener('click', () => {
        window.location.href = '../index.html';
    });
    document.getElementById('game-title-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('game-switch-menu')?.classList.toggle('hidden');
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.app-header')) document.getElementById('game-switch-menu')?.classList.add('hidden');
    });

    // Player management
    document.getElementById('add-player-btn')?.addEventListener('click', () => { addPlayerInput(); saveSettings(); });
    document.getElementById('reset-settings-btn')?.addEventListener('click', async () => {
        if (!confirm(i18n[currentLang].reset_confirm)) return;
        try { const db = await dbPromise; if(db) db.transaction('settingsStore','readwrite').objectStore('settingsStore').delete('game_settings'); } catch(e) {}
        impostorConfig=1; timerConfig=3;
        const iv = document.getElementById('val-impostors'); if(iv) iv.innerText='1';
        const tv = document.getElementById('val-timer'); if(tv) tv.innerText='3';
        ['t-random','t-chaos','t-elimination','t-nohint','t-allhint'].forEach(id=>_togSet(id,false));
        document.getElementById('players-inputs-container').innerHTML='';
        playerCount=0; for(let i=0;i<4;i++) addPlayerInput();
        checkRules(); saveSettings();
    });

    // Counters
    document.getElementById('imp-minus')?.addEventListener('click',()=>{if(impostorConfig>1){impostorConfig--;document.getElementById('val-impostors').innerText=impostorConfig;saveSettings();}});
    document.getElementById('imp-plus')?.addEventListener('click',()=>{impostorConfig++;document.getElementById('val-impostors').innerText=impostorConfig;saveSettings();});
    document.getElementById('timer-minus')?.addEventListener('click',()=>{if(timerConfig>1){timerConfig--;document.getElementById('val-timer').innerText=timerConfig;saveSettings();}});
    document.getElementById('timer-plus')?.addEventListener('click',()=>{timerConfig++;document.getElementById('val-timer').innerText=timerConfig;saveSettings();});

    // Advanced panel
    document.getElementById('adv-toggle-btn')?.addEventListener('click',()=>{
        const p=document.getElementById('adv-panel'); p.classList.toggle('open');
        document.getElementById('adv-chevron').innerText=p.classList.contains('open')?'▲':'▼';
    });

    // Toggles
    document.querySelectorAll('.toggle-switch').forEach(t=>{
        t.addEventListener('click',function(){ if(this.parentElement.classList.contains('disabled-ui')) return; this.classList.toggle('active'); checkRules(); });
    });

    // Info modal
    document.querySelectorAll('.info-icon').forEach(icon=>{
        icon.addEventListener('click',e=>{
            e.stopPropagation(); const key = e.target.getAttribute('data-info');
            document.getElementById('info-modal-text').innerText = infoDescriptions[key][currentLang];
            openModal('info-modal');
        });
    });
    document.getElementById('close-info-btn')?.addEventListener('click',()=>closeModal('info-modal'));

    // Language / password
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
    document.getElementById('password-confirm-btn')?.addEventListener('click',()=>{
        const val = document.getElementById('password-input').value;
        if (val==='simba') {
            x18Unlocked=true; currentLang='x18'; applyTranslations();
            if (document.getElementById('pw-remember-toggle').checked) rememberX18Unlock();
            saveSettings(); closeModal('password-modal');
        } else {
            document.getElementById('password-error').style.display='block';
            document.getElementById('password-input').value='';
            document.getElementById('password-input').classList.add('shake-input');
            setTimeout(()=>document.getElementById('password-input').classList.remove('shake-input'),400);
            _sfx.error();
        }
    });
    document.getElementById('password-input')?.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('password-confirm-btn').click();});
    document.getElementById('password-cancel-btn')?.addEventListener('click',()=>closeModal('password-modal'));

    // Online setup buttons
    document.getElementById('open-online-btn')?.addEventListener('click',()=>{showScreen('online-setup-screen');});
    document.getElementById('back-to-setup-btn')?.addEventListener('click',()=>showScreen('setup-screen'));
    document.getElementById('create-room-btn')?.addEventListener('click', () => { if(typeof _createRoom==='function') _createRoom(); });
    document.getElementById('join-room-btn')?.addEventListener('click', () => { if(typeof _joinRoom==='function') _joinRoom(); });
    document.getElementById('open-scanner-btn')?.addEventListener('click', () => { if(typeof _startScanner === 'function') _startScanner(); });
    if (typeof _restoreOnlineName === 'function') _restoreOnlineName();

    const codeInput = document.getElementById('room-code-input');
    if (codeInput) {
        codeInput.addEventListener('input',e=>{const pos=e.target.selectionStart;e.target.value=e.target.value.toUpperCase();e.target.setSelectionRange(pos,pos);});
        codeInput.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('join-room-btn').click();});
    }

    document.getElementById('online-start-btn')?.addEventListener('click', () => { if(typeof _startOnlineGame==='function') _startOnlineGame(); });

    document.getElementById('copy-code-btn')?.addEventListener('click',()=>{
        const code=document.getElementById('display-room-code').innerText;
        navigator.clipboard.writeText(code).then(()=>{ const btn=document.getElementById('copy-code-btn'); btn.innerText='✅ تكوبي!'; setTimeout(()=>{btn.innerText='📋 كوبي';},2000); }).catch(()=>showToast('كود الغرفة: '+code));
    });
    document.getElementById('share-code-btn')?.addEventListener('click',()=>{
        const code=document.getElementById('display-room-code').innerText;
        const url = new URL(window.location.href); url.searchParams.set('room', code);
        if(navigator.share) navigator.share({ title:'لعبة شكونو هو؟', text:`انضم للطرح! كود الروم: ${code}`, url:url.toString() }).catch(()=>{});
        else navigator.clipboard.writeText(url.toString()).then(()=>showToast('✅ تكوبي رابط الانضمام!')).catch(()=>showToast('كود: '+code));
    });
    document.getElementById('leave-room-btn')?.addEventListener('click',()=>{ if(confirm('متأكد تحب تخرج من الغرفة؟')) { if(typeof _leaveRoom==='function') _leaveRoom(); } });

    document.getElementById('online-seen-btn')?.addEventListener('click', () => { if(typeof _confirmSeen==='function') _confirmSeen(); });
    document.getElementById('start-discussion-btn')?.addEventListener('click', () => { if(typeof _startDiscussion==='function') _startDiscussion(); });

    // Next player card
    document.getElementById('next-player-btn')?.addEventListener('click',()=>{
        currentRevealIndex++;
        if(currentRevealIndex<players.length) { renderSingleCard(); }
        else {
            const starter=players[Math.floor(Math.random()*players.length)];
            document.getElementById('starter-player').innerText=`${i18n[currentLang].starter_is}${starter.name}`;
            showScreen('timer-screen'); updateTimerDisplay();
            timerInterval=setInterval(()=>{remainingTime--;updateTimerDisplay();if(remainingTime<=0){clearInterval(timerInterval);goToVoting();}},1000);
        }
    });

    // Vote button
    document.getElementById('go-to-vote-btn')?.addEventListener('click',()=>{
        if (window.onlineMode) return;
        clearInterval(timerInterval); goToVoting();
    });

    // Reactions
    function _showReactionFloat(text) {
        const float = document.createElement('div'); float.className = 'reaction-float';
        float.textContent = text; float.style.top = Math.max(60, window.innerHeight * 0.45) + 'px';
        document.body.appendChild(float); setTimeout(() => float.remove(), 1900);
    }
    window._showReactionFloat = _showReactionFloat;
    window._playReactionSfx = kind => { if (_sfx && typeof _sfx.reaction === 'function') _sfx.reaction(kind); else _sfx.notify(); };

    document.getElementById('reaction-bar')?.addEventListener('click', e => {
        const btn = e.target.closest('.reaction-btn'); if (!btn) return;
        const msg = btn.dataset.msg; if (!msg) return;
        const sfx = btn.dataset.sfx || 'notify';
        window._playReactionSfx(sfx);
        if (window.onlineMode && typeof _channel !== 'undefined' && _channel) {
            _channel.send({ type:'broadcast', event:'reaction', payload:{ name:typeof _myName!=='undefined'?_myName:'?', msg, sfx } });
            _showReactionFloat(_myName + ': ' + msg);
        }
    });

    // Sound hooks
    document.addEventListener('pointerdown', e => {
        const btn = e.target.closest('button, .toggle-switch, .lang-pill-btn, .vote-item, .counter-btn');
        if (btn && btn.classList.contains('reaction-btn')) return;
        if (btn) _sfx.tap();
    }, {passive:true});

    // start-game-btn delegates to the active game's registry contract
    document.getElementById('start-game-btn')?.addEventListener('click', () => {
        _sfx.gameStart();
        const reg = window.GameRegistry?.[currentGameMode];
        if (typeof reg?.start === 'function') {
            reg.start();
        }
        // Fallback: if the game hasn't registered a start() yet, try legacy global
        else if (typeof window[`start${currentGameMode.charAt(0).toUpperCase() + currentGameMode.slice(1)}Offline`] === 'function') {
            window[`start${currentGameMode.charAt(0).toUpperCase() + currentGameMode.slice(1)}Offline`]();
        }
    });
    document.getElementById('online-start-btn')?.addEventListener('click',()=>setTimeout(_sfx.gameStart,80));

    let _lastScreen='';
    const _screenObs = new MutationObserver(()=>{ const a=document.querySelector('.screen.active'); if(!a||a.id===_lastScreen)return; _lastScreen=a.id; if(a.id==='result-screen')return; _sfx.swoosh(); });
    document.querySelectorAll('.screen').forEach(s=>_screenObs.observe(s,{attributes:true,attributeFilter:['class']}));

    const lobbyList = document.getElementById('lobby-players-list');
    if(lobbyList){ let prev=0; new MutationObserver(()=>{ const n=lobbyList.children.length; if(n>prev)_sfx.notify(); prev=n; }).observe(lobbyList,{childList:true}); }

    document.getElementById('leave-room-btn')?.addEventListener('click',()=>{ if(typeof _voiceOn!=='undefined'&&_voiceOn&&typeof stopVoice==='function') stopVoice(); },true);

    // PWA
    if('serviceWorker'in navigator){
        window.addEventListener('load',()=>{ navigator.serviceWorker.register('./sw.js').then(reg=>reg.update()).catch(err=>console.warn('SW failed:',err)); });
        let refreshing=false;
        navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(!refreshing){refreshing=true;window.location.reload();} });
    }

    // Show the correct first screen
    const _initReg = window.GameRegistry?.[currentGameMode] || {};
    showScreen(_initReg.firstScreen || 'setup-screen');
}

window.initSharedSetup = initSharedSetup;
