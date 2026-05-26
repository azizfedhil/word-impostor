'use strict';

// ============================================================
// SUPABASE ONLINE — init
// ============================================================
const SUPABASE_URL      = 'https://rcxaxblhgpauodmcfetb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3xg9qkdYGUoaRdflCW58rg_xRdqg6ox';
const _supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let _myId = sessionStorage.getItem('dakheel_pid');
if (!_myId) { _myId = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); sessionStorage.setItem('dakheel_pid', _myId); }

window.onlineMode = false;
let _room = null, _channel = null, _isHost = false, _myName = '', _onlineTimer = null;
let _timerSyncTicker = null, _timerSyncState = null, _lastOnlineTimerSecond = null;
const ONLINE_NAME_KEY = 'dakheel_online_name';

// Figured-out tracking (broadcast-based, per round)
const _figuredOut = new Set(); // player IDs who announced they figured it out

function _genCode() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join(''); }
function _me(room) { return (room.players||[]).find(p=>p.id===_myId)||null; }
function _err(msg) { const el = document.getElementById('online-setup-error'); if(el) el.innerText = msg; }
function _clearErr() { _err(''); }
function _getLang(room) { return (room.config&&room.config.lang)||'tn'; }
function _getTrans(room) { return i18n[_getLang(room)]; }
function _saveOnlineName(name) {
    const clean = (name || '').trim();
    if (!clean) return;
    try { localStorage.setItem(ONLINE_NAME_KEY, clean); } catch(_) {}
}
function _restoreOnlineName() {
    try {
        const saved = localStorage.getItem(ONLINE_NAME_KEY);
        const input = document.getElementById('online-player-name');
        if (saved && input && !input.value) input.value = saved;
    } catch(_) {}
}

async function _update(code, patch) {
    const {data,error} = await _supa.from('rooms').update(patch).eq('code',code).select().single();
    if (error) throw error; _room = data; return data;
}

function _subscribe(code) {
    if (_channel) _supa.removeChannel(_channel);
    _channel = _supa.channel('room:'+code)
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'rooms',filter:'code=eq.'+code},
            payload => { _room = payload.new; _handleStateChange(payload.new); })
        .on('broadcast', { event: 'reaction' }, ({ payload }) => {
            _showReactionFloat(payload.name + ': ' + payload.msg);
            if (typeof _playReactionSfx === 'function') _playReactionSfx(payload.sfx);
        })
        .on('broadcast', { event: 'timer-sync' }, ({ payload }) => {
            _handleTimerSync(payload);
        })
        .on('broadcast', { event: 'figured-out' }, ({ payload }) => {
            if (payload && payload.pid) {
                _figuredOut.add(payload.pid);
                _refreshRoundPlayerPanel();
                const name = payload.name || '???';
                _showFiguredOutAnnounce(name);
                if (typeof _sfx !== 'undefined') _sfx.notify();
            }
        })
        .subscribe(s => { if(s==='SUBSCRIBED') console.log('[online] subscribed',code); });
}

function _handleStateChange(room) {
    // Sync language for all players (non-host gets host's chosen language)
    const roomLang = _getLang(room);
    if (roomLang && roomLang !== currentLang && i18n[roomLang]) {
        currentLang = roomLang;
        if (currentLang === 'x18') x18Unlocked = true;
        if (typeof applyTranslations === 'function') applyTranslations();
    }
    switch(room.state) {
        case 'lobby':      _renderLobby(room); break;
        case 'reveal':     _showMyCard(room); break;
        case 'discussion': _startClientTimer(room); break;
        case 'voting':     _showOnlineVoting(room); break;
        case 'result':     _showOnlineResult(room); break;
    }
}

function _snapshotConfig() {
    return {
        lang: currentLang, impostors: impostorConfig||1, timer: timerConfig||3,
        randomImpostors: _togActive('t-random'), chaos: _togActive('t-chaos'),
        elimination: _togActive('t-elimination'), noHints: _togActive('t-nohint'),
        allCorrectHints: _togActive('t-allhint')
    };
}

// Save lobby settings to DB (host only)
async function _updateRoomSettings() {
    if (!_isHost || !_room) return;
    const imp = parseInt(document.getElementById('ls-imp-val')?.textContent) || 1;
    const tim = parseInt(document.getElementById('ls-tim-val')?.textContent) || 3;
    const _on = id => document.getElementById(id)?.classList.contains('active') || false;
    const config = {
        ..._room.config,
        impostors:       imp,
        timer:           tim,
        randomImpostors: _on('ls-random'),
        chaos:           _on('ls-chaos'),
        elimination:     _on('ls-elim'),
        noHints:         _on('ls-nohint'),
        allCorrectHints: _on('ls-allhint')
    };
    try {
        await _update(_room.code, { config });
        document.getElementById('lobby-settings-panel')?.classList.remove('open');
        document.getElementById('ls-chevron') && (document.getElementById('ls-chevron').textContent = '▼');
        showToast('✅ تحفظت الإعدادات!');
    } catch(e) { console.error(e); showToast('خطأ في الحفظ'); }
}

function _mkPlayer(isHost) {
    return { id:_myId, name:_myName, isHost, isImpostor:false, customHint:'', eliminated:false, hasSeenCard:false, vote:null };
}

async function _createRoom() {
    _clearErr();
    _myName = (document.getElementById('online-player-name').value||'').trim();
    if (!_myName) { _err('لازم تحط اسمك!'); _sfx.error(); return; }
    _saveOnlineName(_myName);
    const config = _snapshotConfig(), code = _genCode();
    try {
        const {data,error} = await _supa.from('rooms').insert({
            code, host_id:_myId, state:'lobby', config,
            word_obj:null, players:[_mkPlayer(true)], starter_player:null, timer_end_at:null, result:null
        }).select().single();
        if (error) throw error;
        _room = data; _isHost = true; window.onlineMode = true;
        _subscribe(code); showScreen('online-lobby-screen'); _renderLobby(data);
        _sfx.notify();
    } catch(e) { console.error(e); _err('خطأ في إنشاء الغرفة — جرب مجدداً'); _sfx.error(); }
}

async function _joinRoom() {
    _clearErr();
    _myName = (document.getElementById('online-player-name').value||'').trim();
    const code = (document.getElementById('room-code-input').value||'').trim().toUpperCase();
    if (!_myName) { _err('لازم تحط اسمك!'); _sfx.error(); return; }
    if (code.length < 4) { _err('أدخل كود الغرفة!'); _sfx.error(); return; }
    _saveOnlineName(_myName);
    try {
        const {data:room,error} = await _supa.from('rooms').select().eq('code',code).single();
        if (error||!room) { _err('ما لقيناش الغرفة!'); _sfx.error(); return; }
        if (room.state!=='lobby') { _err('اللعبة ديجا بدات'); _sfx.error(); return; }
        const existing = room.players.find(p=>p.id===_myId);
        if (existing) {
            _room = room; _isHost = room.host_id===_myId; _myName = existing.name;
            _saveOnlineName(_myName);
            const nameInput = document.getElementById('online-player-name');
            if (nameInput) nameInput.value = _myName;
            window.onlineMode = true; _subscribe(code); showScreen('online-lobby-screen'); _renderLobby(room); return;
        }
        const updated = await _update(code,{players:[...room.players,_mkPlayer(false)]});
        _room = updated; _isHost = false; window.onlineMode = true;
        _subscribe(code); showScreen('online-lobby-screen'); _renderLobby(updated); _sfx.notify();
    } catch(e) { console.error(e); _err('خطأ في الانضمام — جرب مجدداً'); _sfx.error(); }
}

function _renderLobby(room) {
    const cur = document.querySelector('.screen.active');
    if (cur && !['online-lobby-screen','online-setup-screen'].includes(cur.id)) showScreen('online-lobby-screen');
    else showScreen('online-lobby-screen');

    document.getElementById('display-room-code').innerText = room.code;
    const list = document.getElementById('lobby-players-list');
    list.innerHTML = '';
    room.players.forEach(p => {
        const div = document.createElement('div'); div.className = 'lobby-item';
        div.innerHTML = (p.isHost ? '👑 ' : '👤 ') + p.name +
            (p.id===_myId ? ' <span class="you-tag">أنا</span>' : '');
        list.appendChild(div);
    });
    const n = room.players.length;
    const startBtn = document.getElementById('online-start-btn');
    const waitMsg  = document.getElementById('lobby-wait-msg');

    // Remove stale settings UI before re-rendering
    document.getElementById('lobby-settings-btn')?.remove();
    document.getElementById('lobby-settings-panel')?.remove();

    if (_isHost) {
        startBtn.classList.remove('hidden');
        if (n < 3) { startBtn.disabled = true; startBtn.style.opacity = '0.5'; waitMsg.innerText = `⏳ نستنا لاعبين... (${n}/3 على الأقل)`; }
        else { startBtn.disabled = false; startBtn.style.opacity = ''; waitMsg.innerText = `✅ ${n} لاعبين — يمكن تبدأ!`; }

        // ── Settings button ───────────────────────────────
        const cfg = room.config || {};
        const maxImps = Math.max(1, Math.floor(n / 2));
        const curImps = Math.min(cfg.impostors || 1, maxImps);
        const curTim  = cfg.timer || 3;

        const settBtn = document.createElement('button');
        settBtn.id = 'lobby-settings-btn';
        settBtn.className = 'secondary-btn';
        settBtn.style.cssText = 'margin-top:10px; width:100%;';
        settBtn.innerText = '⚙️ عدّل إعدادات الجولة';
        startBtn.after(settBtn);

        // ── Settings panel — identical structure to main-menu surface-card + advanced ──
        const panel = document.createElement('div');
        panel.id = 'lobby-settings-panel';
        panel.style.cssText = 'margin-top:12px;';

        const _tog = (id, active) =>
            `<div class="toggle-switch${active ? ' active' : ''}" id="${id}"><div class="toggle-thumb"></div></div>`;

        panel.innerHTML = `
            <div class="surface-card" style="padding:10px 24px;">
                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-title">🎭 قداش من كذاب</span>
                    </div>
                    <div class="counter-group">
                        <button class="counter-btn" id="ls-imp-minus">−</button>
                        <span class="counter-value" id="ls-imp-val">${curImps}</span>
                        <button class="counter-btn" id="ls-imp-plus">+</button>
                    </div>
                </div>
                <div class="setting-row" style="border-bottom:none;">
                    <div class="setting-info">
                        <span class="setting-title">⏱️ وقت الطرح</span>
                    </div>
                    <div class="counter-group">
                        <button class="counter-btn" id="ls-tim-minus">−</button>
                        <span class="counter-value" id="ls-tim-val">${curTim}</span>
                        <button class="counter-btn" id="ls-tim-plus">+</button>
                    </div>
                </div>
            </div>
            <div class="advanced-header" id="ls-adv-header">
                <span>🔧 زيد بربش</span>
                <span id="ls-chevron">▼</span>
            </div>
            <div class="advanced-content" id="ls-adv-content">
                <div class="toggle-row">
                    <span class="toggle-label">🎲 كذابين على كيف اللعبة</span>
                    ${_tog('ls-random', cfg.randomImpostors)}
                </div>
                <div class="toggle-row">
                    <span class="toggle-label">😈 خلوضها</span>
                    ${_tog('ls-chaos', cfg.chaos)}
                </div>
                <div class="toggle-row">
                    <span class="toggle-label">⚔️ نقص بالواحد بالواحد</span>
                    ${_tog('ls-elim', cfg.elimination)}
                </div>
                <div class="toggle-row">
                    <span class="toggle-label">🙈 سبورة كحلة مع الكذاب</span>
                    ${_tog('ls-nohint', cfg.noHints)}
                </div>
                <div class="toggle-row" style="border-bottom:none;">
                    <span class="toggle-label">💡 الكذابين الكل ياخذو نفس التلميح</span>
                    ${_tog('ls-allhint', cfg.allCorrectHints)}
                </div>
                <div style="display:flex; gap:10px; padding:16px 16px 8px;">
                    <button type="button" id="ls-save"   class="primary-btn"   style="flex:1; margin:0; padding:12px;">💾 حفظ</button>
                    <button type="button" id="ls-cancel" class="secondary-btn" style="flex:1; margin:0; padding:12px;">إلغاء</button>
                </div>
            </div>
        `;
        settBtn.after(panel);

        // Counter helpers — read/write counter-value span directly
        const _counter = (dispId, minusId, plusId, minV, maxV) => {
            const disp = () => document.getElementById(dispId);
            document.getElementById(minusId)?.addEventListener('click', () => {
                disp().textContent = Math.max(minV, parseInt(disp().textContent) - 1);
            });
            document.getElementById(plusId)?.addEventListener('click', () => {
                disp().textContent = Math.min(maxV, parseInt(disp().textContent) + 1);
            });
        };
        _counter('ls-imp-val', 'ls-imp-minus', 'ls-imp-plus', 1, maxImps);
        _counter('ls-tim-val', 'ls-tim-minus', 'ls-tim-plus', 1, 10);

        // Toggle switches
        panel.querySelectorAll('.toggle-switch').forEach(sw => {
            sw.addEventListener('click', () => sw.classList.toggle('active'));
        });

        // Advanced section collapse
        const advContent = panel.querySelector('#ls-adv-content');
        const chevron    = panel.querySelector('#ls-chevron');
        panel.querySelector('#ls-adv-header').addEventListener('click', () => {
            const open = advContent.classList.toggle('open');
            chevron.textContent = open ? '▲' : '▼';
        });

        // Outer button: show / hide whole panel
        panel.style.display = 'none';
        settBtn.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? '' : 'none';
        });

        document.getElementById('ls-save')  ?.addEventListener('click', _updateRoomSettings);
        document.getElementById('ls-cancel')?.addEventListener('click', () => { panel.style.display = 'none'; });

    } else {
        startBtn.classList.add('hidden');
        waitMsg.innerText = `⏳ نستناو مولى الروم يبدا... (${n} لاعبين)`;
    }
}

function _showFiguredOutAnnounce(name) {
    // Remove any existing announcement
    document.querySelector('.figured-center-announce')?.remove();
    const el = document.createElement('div');
    el.className = 'figured-center-announce';
    el.innerHTML = `
        <div class="figured-center-announce-inner">
            <span class="figured-center-announce-icon">🎯</span>
            <span class="figured-center-announce-name">${name}</span>
            <span class="figured-center-announce-sub">عرف الكذاب!</span>
        </div>
    `;
    document.body.appendChild(el);
    // Auto-remove after animation completes (2.4s in + 0.4s out)
    setTimeout(() => el.remove(), 2900);
}

// Refreshes all visible round-player panels without a full re-render
function _refreshRoundPlayerPanel() {
    const screens = ['online-card-screen','timer-screen','voting-screen','result-screen'];
    screens.forEach(sid => {
        const panel = document.getElementById(sid)?.querySelector('.online-round-players');
        if (panel && _room) _rebuildChips(panel, _room, sid);
    });
}

const CHIPS_COLLAPSE = 4; // max chips shown before "show more"

function _rebuildChips(panel, room, screenId) {
    const list = panel.querySelector('.online-round-list');
    if (!list) return;
    list.innerHTML = '';

    // Sort: figured-out first, then rest
    const sorted = [...room.players].sort((a, b) => {
        const aF = _figuredOut.has(a.id) ? 0 : 1;
        const bF = _figuredOut.has(b.id) ? 0 : 1;
        return aF - bF;
    });

    sorted.forEach((p, idx) => {
        const chip = document.createElement('div');
        chip.className = 'online-player-chip';
        if (p.id === _myId)   chip.classList.add('is-me');
        if (p.eliminated)     chip.classList.add('is-out');
        if (p.hasSeenCard)    chip.classList.add('has-seen');
        if (p.vote !== null)  chip.classList.add('has-voted');
        if (_figuredOut.has(p.id)) chip.classList.add('figured-out');

        // Hide extras past collapse threshold
        if (idx >= CHIPS_COLLAPSE && !panel.dataset.expanded) chip.classList.add('chip-hidden');

        const status = p.eliminated ? '🚫' : p.vote !== null ? '🗳️' : p.hasSeenCard ? '✅' : '👤';
        chip.innerHTML = `${p.isHost ? '👑' : status} <span>${p.name}</span>${p.id===_myId?' <span class="you-tag">أنا</span>':''}${_figuredOut.has(p.id)?'<span class="figured-badge">🎯</span>':''}`;
        list.appendChild(chip);
    });

    // Remove old show-more btn
    panel.querySelector('.show-more-btn')?.remove();

    const extra = room.players.length - CHIPS_COLLAPSE;
    if (extra > 0) {
        const btn = document.createElement('button');
        btn.className = 'show-more-btn';
        if (panel.dataset.expanded) {
            btn.textContent = `▲ إخفاء`;
            btn.onclick = () => {
                delete panel.dataset.expanded;
                _rebuildChips(panel, room, screenId);
            };
        } else {
            btn.textContent = `▼ عرض ${extra} لاعبين`;
            btn.onclick = () => {
                panel.dataset.expanded = '1';
                _rebuildChips(panel, room, screenId);
            };
        }
        list.after(btn);
    }
}

function _renderOnlineRoundPlayers(room, screenId) {
    const screen = document.getElementById(screenId);
    if (!screen || !room || !room.players) return;
    screen.querySelector('.online-round-players')?.remove();

    const alive = room.players.filter(p=>!p.eliminated);
    const panel = document.createElement('div');
    panel.className = 'online-round-players';

    // ── Voice + figured-out controls row ─────────────────────
    const isTimerScreen = screenId === 'timer-screen';
    const myFiguredOut  = _figuredOut.has(_myId);
    const voiceActive   = typeof _voiceOn !== 'undefined' && _voiceOn;

    panel.innerHTML = `
        <div class="online-round-players-title">
            <span>👥 اللاعبين في الروم</span>
            <span class="online-round-count">${alive.length}/${room.players.length}</span>
        </div>
        <div class="round-actions-bar">
            <button class="voice-round-btn${voiceActive?' voice-round-active':''}" id="voice-round-btn-${screenId}">
                ${voiceActive ? '🔴 قطع الصوت' : '🎙️ انضم للصوت'}
            </button>
            ${isTimerScreen && !myFiguredOut ? `<button class="figured-btn" id="figured-out-btn">🎯 عرفت الكذاب!</button>` : ''}
            ${isTimerScreen && myFiguredOut  ? `<div class="figured-announced">✅ أعلنت أنك عرفت الكذاب</div>` : ''}
        </div>
        <div class="online-round-list"></div>
    `;

    // Wire voice button
    panel.querySelector(`#voice-round-btn-${screenId}`)?.addEventListener('click', () => {
        if (typeof _voiceOn !== 'undefined' && _voiceOn) {
            stopVoice();
        } else {
            if (_room) initVoice(_room.code);
        }
        // Re-render all panels to update button state
        setTimeout(() => _refreshRoundPlayerPanel(), 100);
    });

    // Wire figured-out button
    panel.querySelector('#figured-out-btn')?.addEventListener('click', () => {
        if (_figuredOut.has(_myId)) return;
        _figuredOut.add(_myId);
        _channel?.send({ type:'broadcast', event:'figured-out', payload:{ pid:_myId, name:_myName } });
        _refreshRoundPlayerPanel();
        _showFiguredOutAnnounce(_myName);
        if (typeof _sfx !== 'undefined') _sfx.notify();
    });

    _rebuildChips(panel, room, screenId);

    const anchors = {
        'online-card-screen': '#online-card-container',
        'timer-screen': '#reaction-bar',
        'voting-screen': '#voting-list',
        'result-screen': '#next-round-btn'
    };
    const anchor = screen.querySelector(anchors[screenId] || '');
    if (anchor) anchor.before(panel);
    else screen.appendChild(panel);
}

async function _startOnlineGame() {
    if (!_isHost||!_room) return;
    const config = _room.config, lang = config.lang||'tn';
    const wordList = lang==='x18' ? adultWordsDB : regularWordsDB;
    if (!wordList||wordList.length===0) { showToast('الكلمات مازال ما جاتش، حاول مرة اخرى.'); return; }
    const allP = _room.players;
    let impCount = config.impostors||1;
    if (config.randomImpostors) impCount = Math.floor(Math.random()*Math.floor(allP.length/2))+1;
    const wordObj = wordList[Math.floor(Math.random()*wordList.length)];
    const noHints = config.noHints||lang==='x18';
    let players = allP.map(p=>({...p,isImpostor:false,customHint:'',eliminated:false,hasSeenCard:false,vote:null}));
    const isChaosRound = config.chaos && Math.random()<0.15;
    if (isChaosRound) { players.forEach(p=>{p.isImpostor=true;}); }
    else {
        const idx = [...Array(players.length).keys()].sort(()=>0.5-Math.random());
        for(let i=0;i<impCount;i++) players[idx[i]].isImpostor=true;
    }
    if (!noHints) {
        const imps = players.filter(p=>p.isImpostor);
        if (config.allCorrectHints) { imps.forEach(p=>{p.customHint=wordObj.hint||'';}); }
        else if (imps.length===1) { imps[0].customHint=wordObj.hint||''; }
        else {
            const lucky = Math.floor(Math.random()*imps.length);
            const wrong = wordList.filter(w=>w.word!==wordObj.word).map(w=>w.hint).sort(()=>0.5-Math.random());
            let hi=0; imps.forEach((p,i)=>{p.customHint=(i===lucky)?(wordObj.hint||''):(wrong[hi++%wrong.length]||'');});
        }
    }
    try { await _update(_room.code,{state:'reveal',word_obj:wordObj,players,timer_end_at:null,result:null});
          _figuredOut.clear(); }  // reset per round
    catch(e) { console.error(e); showToast('خطأ في بدء اللعبة!'); }
}

function _showMyCard(room) {
    showScreen('online-card-screen');
    const me = _me(room); if (!me) return;
    const lang = _getLang(room), trans = i18n[lang], noHints = room.config.noHints||lang==='x18';
    _renderOnlineRoundPlayers(room, 'online-card-screen');
    if (me.hasSeenCard) { _renderCardWaiting(room); return; }
    const container = document.getElementById('online-card-container');
    container.innerHTML = '';
    document.getElementById('online-seen-btn').classList.add('hidden');
    document.getElementById('online-waiting-zone').classList.add('hidden');
    let roleText = me.isImpostor
        ? (noHints ? trans.impostor_role : `${trans.impostor_role}<br><br><span style="font-size:16px;">${trans.hint_label}</span><br>${me.customHint}`)
        : `${trans.citizen_role}<br><br><span style="font-size:16px;">${trans.word_label}</span><br>${room.word_obj.word}`;
    const card = document.createElement('div'); card.className = 'flip-card';
    card.innerHTML = `<div class="card-face card-front"><span>${trans.card_of}${me.name}</span></div>
                      <div class="card-face card-back"><span>${roleText}</span></div>`;
    const seenBtn = document.getElementById('online-seen-btn');
    const showCard = e => { e.preventDefault(); card.classList.add('flipped'); _sfx.cardFlip(); };
    const hideCard = e => { e.preventDefault(); if(!card.classList.contains('flipped')) return; card.classList.remove('flipped'); seenBtn.classList.remove('hidden'); };
    card.addEventListener('mousedown',showCard); card.addEventListener('mouseup',hideCard); card.addEventListener('mouseleave',hideCard);
    card.addEventListener('touchstart',showCard,{passive:false}); card.addEventListener('touchend',hideCard,{passive:false}); card.addEventListener('touchcancel',hideCard,{passive:false});
    container.appendChild(card);
}

async function _confirmSeen() {
    if (!_room) return;
    const players = _room.players.map(p=>p.id===_myId?{...p,hasSeenCard:true}:p);
    document.getElementById('online-seen-btn').classList.add('hidden');
    try { const updated = await _update(_room.code,{players}); _renderCardWaiting(updated); _checkAllSeen(updated); }
    catch(e) { console.error(e); }
}

function _renderCardWaiting(room) {
    _renderOnlineRoundPlayers(room, 'online-card-screen');
    const container = document.getElementById('online-card-container');
    container.innerHTML = '<div class="card-done-badge">✅</div>';
    const zone = document.getElementById('online-waiting-zone'); zone.classList.remove('hidden');
    const statusEl = document.getElementById('online-seen-status'); statusEl.innerHTML = '';
    room.players.filter(p=>!p.eliminated).forEach(p=>{
        const div = document.createElement('div'); div.className = 'seen-status-item';
        div.innerHTML = (p.hasSeenCard?'✅ ':'⏳ ')+p.name; statusEl.appendChild(div);
    });
    _checkAllSeen(room);
}

function _checkAllSeen(room) {
    const alive = room.players.filter(p=>!p.eliminated);
    const allSeen = alive.every(p=>p.hasSeenCard);
    const discBtn = document.getElementById('start-discussion-btn');
    if (_isHost) {
        discBtn.classList.toggle('hidden',!allSeen);
        document.getElementById('online-waiting-text').innerText = allSeen?'✅ الناس الكل شافت كوارتها!':'⏳ نستنا الكل يشوف كارطتو...';
    } else {
        discBtn.classList.add('hidden');
        document.getElementById('online-waiting-text').innerText = allSeen?'⏳ نستنا الهوست يبدأ النقاش...':'⏳ نستنا الكل يشوف كارطتو...';
    }
}

async function _startDiscussion() {
    if (!_isHost||!_room) return;
    const seconds = (_room.config.timer||3)*60;
    const timerEndAt = new Date(Date.now()+seconds*1000).toISOString();
    const alive = _room.players.filter(p=>!p.eliminated);
    const starter = alive[Math.floor(Math.random()*alive.length)];
    try { await _update(_room.code,{state:'discussion',starter_player:starter.name,timer_end_at:timerEndAt}); }
    catch(e) { console.error(e); }
}

function _timerNow() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
}

function _stopOnlineTimer() {
    if (_onlineTimer) { clearInterval(_onlineTimer); _onlineTimer = null; }
    if (_timerSyncTicker) { clearInterval(_timerSyncTicker); _timerSyncTicker = null; }
    _timerSyncState = null;
    _lastOnlineTimerSecond = null;
}

function _hostSecondsLeft(room) {
    const endTime = new Date(room.timer_end_at).getTime();
    return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
}

function _secondsLeftForRoom(room) {
    if (!_isHost && _timerSyncState && _timerSyncState.timerEndAt === room.timer_end_at) {
        const elapsed = (_timerNow() - _timerSyncState.receivedAt) / 1000;
        return Math.max(0, Math.ceil(_timerSyncState.left - elapsed));
    }
    return _hostSecondsLeft(room);
}

function _broadcastTimerSync(room) {
    if (!_isHost || !_channel || !room || room.state !== 'discussion') return;
    const payload = { timerEndAt: room.timer_end_at, left: _hostSecondsLeft(room) };
    const sent = _channel.send({ type:'broadcast', event:'timer-sync', payload });
    if (sent && typeof sent.catch === 'function') sent.catch(() => {});
}

function _handleTimerSync(payload) {
    if (_isHost || !_room || _room.state !== 'discussion' || !payload) return;
    if (payload.timerEndAt !== _room.timer_end_at) return;
    _timerSyncState = {
        timerEndAt: payload.timerEndAt,
        left: Math.max(0, Number(payload.left) || 0),
        receivedAt: _timerNow()
    };
}

function _startClientTimer(room) {
    showScreen('timer-screen');
    document.getElementById('reaction-bar')?.classList.remove('hidden');
    _renderOnlineRoundPlayers(room, 'timer-screen');
    const trans = i18n[_getLang(room)];
    document.getElementById('starter-player').innerText = `${trans.starter_is}${room.starter_player}`;
    _stopOnlineTimer();

    if (_isHost) {
        _broadcastTimerSync(room);
        _timerSyncTicker = setInterval(() => _broadcastTimerSync(room), 1000);
    }

    const tick = () => {
        const left = _secondsLeftForRoom(room);
        const m = Math.floor(left/60).toString().padStart(2,'0');
        const s = (left%60).toString().padStart(2,'0');
        document.getElementById('timer-display').innerText = `${m}:${s}`;
        if (left !== _lastOnlineTimerSecond) {
            _lastOnlineTimerSecond = left;
            if (left <= 10 && left > 0) _sfx.tickUrgent(); else if (left > 10) _sfx.tick();
        }
        if (left <= 0) {
            _stopOnlineTimer();
            _sfx.timerEnd();
            document.getElementById('reaction-bar')?.classList.add('hidden');
            if (_isHost) _moveToVoting();
        }
    };
    tick(); _onlineTimer = setInterval(tick, 500);
    document.getElementById('go-to-vote-btn').onclick = () => {
        if (!_isHost) { showToast('مولى الروم اكهو ينجم يوقف الوقت!'); return; }
        _stopOnlineTimer();
        document.getElementById('reaction-bar')?.classList.add('hidden');
        _moveToVoting();
    };
}

async function _moveToVoting() {
    if (!_isHost||!_room) return;
    try { await _update(_room.code,{state:'voting'}); } catch(e) { console.error(e); }
}

function _showOnlineVoting(room) {
    _stopOnlineTimer();
    showScreen('voting-screen');
    _renderOnlineRoundPlayers(room, 'voting-screen');
    const list = document.getElementById('voting-list'); list.innerHTML = '';
    const me = _me(room), hasVoted = me&&me.vote!==null;
    room.players.filter(p=>!p.eliminated).forEach(player=>{
        const btn = document.createElement('button'); btn.className = 'vote-item';
        const vc = room.players.filter(p=>p.vote===player.id).length;
        btn.innerHTML = '🗳️ '+player.name+(vc>0?` <span class="vote-count">(${vc})</span>`:'');
        if (hasVoted) { btn.disabled=true; if(me.vote===player.id) btn.classList.add('my-vote'); }
        else if (player.id===_myId) { btn.disabled=true; btn.title='ما تنجمش تصوت على روحك'; }
        else { btn.addEventListener('click',()=>_castVote(player.id)); }
        list.appendChild(btn);
    });
    const alive = room.players.filter(p=>!p.eliminated);
    const allVoted = alive.length>0&&alive.every(p=>p.vote!==null);
    if (allVoted&&_isHost) setTimeout(()=>_processVotes(room),800);
}

async function _castVote(targetId) {
    if (!_room) return; _sfx.vote();
    const players = _room.players.map(p=>p.id===_myId?{...p,vote:targetId}:p);
    try {
        const updated = await _update(_room.code,{players});
        _showOnlineVoting(updated);
        const alive = updated.players.filter(p=>!p.eliminated);
        if (alive.length>0&&alive.every(p=>p.vote!==null)&&_isHost) setTimeout(()=>_processVotes(updated),800);
    } catch(e) { console.error(e); }
}

async function _processVotes(room) {
    if (!_isHost) return;
    const alive = room.players.filter(p=>!p.eliminated);
    const tally = {}; alive.forEach(p=>{if(p.vote) tally[p.vote]=(tally[p.vote]||0)+1;});
    let maxV=0, votedId=null;
    Object.entries(tally).forEach(([id,count])=>{if(count>maxV){maxV=count;votedId=id;}});
    if (!votedId) return;
    const votedPlayer = room.players.find(p=>p.id===votedId); if (!votedPlayer) return;
    const isElim = room.config.elimination;
    let outcome;
    let players = room.players.map(p=>p.id===votedId?{...p,eliminated:isElim?true:p.eliminated}:p);
    if (!isElim) { outcome = votedPlayer.isImpostor?'correct_guess':'wrong_guess'; }
    else {
        const rI = players.filter(p=>p.isImpostor&&!p.eliminated);
        const rR = players.filter(p=>!p.isImpostor&&!p.eliminated);
        if (rI.length===0) outcome='all_impostors_dead';
        else if (rI.length>=rR.length) outcome='impostors_win';
        else outcome='continue';
    }
    try { await _update(room.code,{state:'result',players,result:{votedPlayerId:votedId,outcome}}); }
    catch(e) { console.error(e); }
}

function _showOnlineResult(room) {
    _stopOnlineTimer();
    showScreen('result-screen');
    _renderOnlineRoundPlayers(room, 'result-screen');
    const trans = _getTrans(room), result = room.result;
    const resultMsg = document.getElementById('result-message');
    const revealBox = document.getElementById('impostors-reveal');
    const nextBtn = document.getElementById('next-round-btn');
    revealBox.innerHTML = ''; if (!result) return;
    const voted = room.players.find(p=>p.id===result.votedPlayerId);
    const name = voted?voted.name:'?';
    const allImps = room.players.filter(p=>p.isImpostor).map(p=>p.name).join(' و ');
    const wordLine = `${trans.word_was} <strong>${room.word_obj?room.word_obj.word:'?'}</strong>`;
    switch(result.outcome) {
        case 'correct_guess': triggerAnimation('win'); resultMsg.innerText=trans.correct_guess.replace('{name}',name); revealBox.innerHTML=`${trans.impostors_were}<br><strong style="color:var(--primary-color)">${allImps}</strong><br><br>${wordLine}`; break;
        case 'wrong_guess': triggerAnimation('lose'); resultMsg.innerText=trans.wrong_guess.replace('{name}',name); revealBox.innerHTML=`${trans.impostors_were}<br><strong style="color:var(--primary-color)">${allImps}</strong><br><br>${wordLine}`; break;
        case 'all_impostors_dead': triggerAnimation('win'); resultMsg.innerText=trans.all_impostors_dead; revealBox.innerHTML=wordLine; break;
        case 'impostors_win': triggerAnimation('lose'); resultMsg.innerText=trans.impostors_win; revealBox.innerHTML=`${trans.impostors_were}<br><strong style="color:var(--primary-color)">${allImps}</strong><br><br>${wordLine}`; break;
        case 'continue':
            resultMsg.innerText=trans.eliminated_msg.replace('{name}',name); revealBox.innerHTML=trans.elimination_cliffhanger;
            if (_isHost) { nextBtn.innerText=trans.continue_discussion; nextBtn.disabled=false; nextBtn.onclick=()=>_continueDiscussion(room); }
            else { nextBtn.innerText='⏳ نستناو مولى الروم...'; nextBtn.disabled=true; }
            return;
    }
    if (_isHost) { nextBtn.innerText=trans.next_round_btn; nextBtn.disabled=false; nextBtn.onclick=()=>_resetToLobby(); }
    else { nextBtn.innerText='⏳ نستناو مولى الروم...'; nextBtn.disabled=true; }
}

async function _continueDiscussion(room) {
    if (!_isHost) return;
    const seconds = 60, timerEndAt = new Date(Date.now()+seconds*1000).toISOString();
    const alive = room.players.filter(p=>!p.eliminated);
    const starter = alive[Math.floor(Math.random()*alive.length)];
    const players = room.players.map(p=>({...p,vote:null}));
    try { await _update(room.code,{state:'discussion',starter_player:starter.name,timer_end_at:timerEndAt,players}); }
    catch(e) { console.error(e); }
}

async function _resetToLobby() {
    if (!_isHost||!_room) return;
    const players = _room.players.map(p=>({...p,isImpostor:false,customHint:'',eliminated:false,hasSeenCard:false,vote:null}));
    try { await _update(_room.code,{state:'lobby',word_obj:null,players,starter_player:null,timer_end_at:null,result:null}); }
    catch(e) { console.error(e); }
}

async function _leaveRoom() {
    if (!_room) { window.onlineMode=false; showScreen('setup-screen'); return; }
    try {
        if (_isHost) { await _supa.from('rooms').delete().eq('code',_room.code); }
        else { const players = _room.players.filter(p=>p.id!==_myId); await _supa.from('rooms').update({players}).eq('code',_room.code); }
    } catch(e) { console.error(e); }
    if (_channel) { _supa.removeChannel(_channel); _channel=null; }
    _stopOnlineTimer();
    document.querySelectorAll('.online-round-players').forEach(el => el.remove());
    _room=null; _isHost=false; window.onlineMode=false;
    showScreen('setup-screen');
}
