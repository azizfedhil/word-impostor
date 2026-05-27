'use strict';

// ============================================================
// SUPABASE ONLINE — init
// ============================================================
const SUPABASE_URL      = 'https://rcxaxblhgpauodmcfetb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3xg9qkdYGUoaRdflCW58rg_xRdqg6ox';
const _supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ONLINE_PLAYER_ID_KEY = 'dakheel_pid';
const ONLINE_NAME_KEY = 'dakheel_online_name';
const ONLINE_LAST_ROOM_KEY = 'dakheel_last_room';

let _myId = null;
try { _myId = localStorage.getItem(ONLINE_PLAYER_ID_KEY) || sessionStorage.getItem(ONLINE_PLAYER_ID_KEY); } catch(_) {}
if (!_myId) _myId = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
function _storeMyId(id) {
    _myId = id;
    try { sessionStorage.setItem(ONLINE_PLAYER_ID_KEY, id); } catch(_) {}
    try { localStorage.setItem(ONLINE_PLAYER_ID_KEY, id); } catch(_) {}
}
_storeMyId(_myId);

window.onlineMode = false;
let _room = null, _channel = null, _isHost = false, _myName = '', _onlineTimer = null;
let _timerSyncTicker = null, _timerSyncState = null, _lastOnlineTimerSecond = null;
let _votingTimer = null, _lastVotingTimerSecond = null;
let _votingSyncTicker = null, _votingSyncState = null;
let _onlinePresenceIds = new Set();
let _localPlayerDesired = {};
let _lastHandledState = null;
let _movingToVoting = false, _processingVotes = false;
let _localCardRevealed = false;
let _onlineCoupTimer = null, _onlineCoupTimingOut = false;
let _onlineCoupFocusedPlayerId = null, _lastCoupEventId = null, _lastCoupPendingKey = null;

// Figured-out tracking (broadcast-based, per round)
const _figuredOut = new Set(); // player IDs who announced they figured it out

const QUESTION_CHALLENGES = [
    'كان الكلمة بلاصة في تونس، شنوة أول حاجة تلقاها غادي؟',
    'قولنا ثلاثة كلمات يوصفو الكلمة من غير ما تقولها.',
    'كان الكلمة تتباع في السوق، شنية الصنعة متاعها؟',
    'شنوة أكثر حاجة تنجم تعملها بالكلمة هاذي؟',
    'كان الكلمة إنسان، شكون من اللاعبين تشبه؟ وعلاش؟',
    'عطينا موقف يصير فيه الشي هذا في نهار عادي.',
    'كان الكلمة عندها ريحة، كيفاش توصفها؟',
    'شنية حاجة قريبة للكلمة أما موش هي بالضبط؟',
    'كان باش ترسم الكلمة في خمس ثواني، شنوة ترسم؟',
    'في أي بلاصة تلقى الكلمة هاذي أكثر شي؟',
    'شنوة عكس الكلمة هاذي ولا أبعد حاجة عليها؟',
    'كان الكلمة صوت، شنوة الصوت الي تعملو؟',
    'علاش واحد ينجم يحتاج الكلمة هاذي؟',
    'شنية أول ذكرى جاتك في بالك مع الكلمة؟',
    'كان الكلمة ممنوعة، علاش تتمنع؟'
];

const SPYFALL_QUESTIONS = [
    'شنوة أكثر حاجة تتسمع في البلاصة هاذي؟',
    'شنوة أول حاجة تعملها كي توصل غادي؟',
    'في البلاصة هاذي، الناس يقعدو والا يتحركو برشة؟',
    'شنوة حاجة تنجم تشريها ولا تستعملها غادي؟',
    'كان تمشي غادي وحدك، عادي ولا غريب؟',
    'شنوة اللبسة الي تناسب البلاصة هاذي؟',
    'البلاصة هاذي فيها ريحة معيّنة؟ كيفاش؟',
    'شنوة نوع الناس الي تلقاهم غادي أكثر؟',
    'في أي وقت من النهار البلاصة هاذي تعيش أكثر؟',
    'كان صار مشكل غادي، شكون أول واحد يتدخل؟',
    'شنوة حاجة ممنوعة تعملها في البلاصة هاذي؟',
    'البلاصة هاذي تقعد فيها شوية والا برشة؟',
    'شنوة صوت يفضح البلاصة هاذي؟',
    'كان باش تصور سيلفي غادي، شنوة يبان وراك؟',
    'شنوة أكثر كلمة تتقال في البلاصة هاذي؟'
];

let _spyfallDB = [];

fetch('spyfall_tunisia_100_locations.json', { cache:'no-store' })
    .then(r => r.json())
    .then(d => { _spyfallDB = d.spyfall_data || d || []; })
    .catch(() => { _spyfallDB = []; });

// Host's in-progress lobby settings (preserved across re-renders)
let _pendingConfig = null;

function _genCode() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join(''); }
function _me(room) { return (room.players||[]).find(p=>p.id===_myId)||null; }
function _err(msg) { const el = document.getElementById('online-setup-error'); if(el) el.innerText = msg; }
function _clearErr() { _err(''); }
function _getLang(room) { return (room.config&&room.config.lang)||'tn'; }
function _getTrans(room) { return i18n[_getLang(room)]; }
function _getRoomGameMode(room) { return ['thief','spyfall','coup'].includes(room?.config?.gameMode) ? room.config.gameMode : 'impostor'; }
function _isThiefRoom(room) { return _getRoomGameMode(room) === 'thief'; }
function _isSpyfallRoom(room) { return _getRoomGameMode(room) === 'spyfall'; }
function _isCoupRoom(room) { return _getRoomGameMode(room) === 'coup'; }
const _coupCards = {
    duke: { name:'الشلغمي', icon:'👑', desc:'ياخو 3 فلوس. وينجم يسكّر المعونة.' },
    assassin: { name:'حفار القبور', icon:'🗡️', desc:'يدفع 3 فلوس ويطيّح كارتة من لاعب.' },
    contessa: { name:'البية', icon:'💃', desc:'تسكّر الاغتيال وتنقذ صاحبها.' },
    ambassador: { name:'السمسار', icon:'🤝', desc:'يبدّل كوارط مع الدكّة وينجم يسكّر سرقة الرايس.' },
    captain: { name:'الرايس', icon:'⚓', desc:'يسرق زوز فلوس من لاعب، وينجم يسكّر السرقة.' }
};
function _thiefRoleMeta(role) {
    return {
        thief: { label:'سارق', icon:'🗝️', desc:'إنت السارق. حاول ما يفيقوش بيك.' },
        judge: { label:'حاكم', icon:'⚖️', desc:'إنت الحاكم. بعد النقاش تختار شكون السارق.' },
        executioner: { label:'جلّاد', icon:'🪓', desc:'إنت الجلّاد. تستنى حكم الحاكم.' },
        witness: { label:'شاهد', icon:'👁️', desc:'إنت شاهد. عاون الحاكم بالكلام وما تكشفش برشة.' }
    }[role] || { label:'شاهد', icon:'👁️', desc:'إنت شاهد. عاون الحاكم.' };
}
function _saveOnlineName(name) {
    const clean = (name || '').trim();
    if (!clean) return;
    try { localStorage.setItem(ONLINE_NAME_KEY, clean); } catch(_) {}
}
function _rememberLastRoom(code) {
    if (!code) return;
    try { localStorage.setItem(ONLINE_LAST_ROOM_KEY, code); } catch(_) {}
}
function _restoreOnlineName() {
    try {
        const saved = localStorage.getItem(ONLINE_NAME_KEY);
        const input = document.getElementById('online-player-name');
        if (saved && input && !input.value) input.value = saved;
        const code = localStorage.getItem(ONLINE_LAST_ROOM_KEY);
        const codeInput = document.getElementById('room-code-input');
        if (code && codeInput && !codeInput.value) codeInput.value = code;
    } catch(_) {}
}

function _sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function _fetchRoom(code) {
    const {data,error} = await _supa.from('rooms').select().eq('code',code).single();
    if (error) throw error;
    return data;
}

async function _update(code, patch) {
    const {data,error} = await _supa.from('rooms').update(patch).eq('code',code).select().single();
    if (error) throw error; _room = data; return data;
}

function _playerHasPatch(room, pid, patch) {
    const player = (room?.players || []).find(p => p.id === pid);
    return !!player && Object.entries(patch).every(([key, value]) => player[key] === value);
}

function _applyLocalPlayerOverrides(room) {
    if (!room || !room.players || !Object.keys(_localPlayerDesired).length) return room;
    if ((room.state === 'reveal' || room.state === 'lobby') && _lastHandledState !== room.state) return room;
    const me = room.players.find(p => p.id === _myId);
    if (!me) return room;

    Object.keys(_localPlayerDesired).forEach(key => {
        if (me[key] === _localPlayerDesired[key]) delete _localPlayerDesired[key];
    });
    if (!Object.keys(_localPlayerDesired).length) return room;

    return {
        ...room,
        players: room.players.map(p => p.id === _myId ? {...p, ..._localPlayerDesired} : p)
    };
}

async function _mutatePlayers(code, mutate, verify, extraPatch) {
    let lastRoom = null;
    for (let attempt = 0; attempt < 5; attempt++) {
        const fresh = await _fetchRoom(code);
        const players = (fresh.players || []).map(p => ({...p}));
        const nextPlayers = mutate(players, fresh);
        if (!nextPlayers) {
            _room = _applyLocalPlayerOverrides(fresh);
            return _room;
        }

        const patch = { players: nextPlayers, ...(typeof extraPatch === 'function' ? extraPatch(fresh, nextPlayers) : (extraPatch || {})) };
        const {data,error} = await _supa.from('rooms').update(patch).eq('code',code).select().single();
        if (error) throw error;
        lastRoom = data;

        await _sleep(140 + attempt * 120);
        const confirmed = await _fetchRoom(code);
        if (!verify || verify(confirmed)) {
            _room = _applyLocalPlayerOverrides(confirmed);
            return _room;
        }
    }
    _room = _applyLocalPlayerOverrides(lastRoom || _room);
    return _room;
}

async function _commitMyPlayerPatch(patch) {
    if (!_room) return null;
    _localPlayerDesired = {..._localPlayerDesired, ...patch};
    const code = _room.code;
    return _mutatePlayers(
        code,
        players => players.some(p => p.id === _myId)
            ? players.map(p => p.id === _myId ? {...p, ...patch} : p)
            : null,
        room => _playerHasPatch(room, _myId, patch)
    );
}

function _playerOnline(player) {
    return player.id === _myId || _onlinePresenceIds.has(player.id);
}

function _playerFigured(player) {
    return !!(player?.figuredOut || _figuredOut.has(player.id));
}

function _figuredThresholdMet(room) {
    const alive = (room?.players || []).filter(p => !p.eliminated);
    if (!alive.length) return false;
    const needed = Math.ceil(alive.length * 0.75);
    return alive.filter(_playerFigured).length >= needed;
}

function _canAskQuestion(room) {
    const me = _me(room);
    return room?.state === 'discussion' && me && !me.eliminated && !me.askedQuestion;
}

function _randomQuestion() {
    const list = _room && _isSpyfallRoom(_room) ? SPYFALL_QUESTIONS : QUESTION_CHALLENGES;
    return list[Math.floor(Math.random() * list.length)];
}

function _subscribe(code) {
    if (_channel) _supa.removeChannel(_channel);
    _channel = _supa.channel('room:'+code, { config: { presence: { key: _myId } } })
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'rooms',filter:'code=eq.'+code},
            payload => { _room = _applyLocalPlayerOverrides(payload.new); _handleStateChange(_room); })
        .on('presence', { event: 'sync' }, () => {
            const state = _channel?.presenceState?.() || {};
            _onlinePresenceIds = new Set(Object.keys(state));
            _refreshPresenceViews();
        })
        .on('broadcast', { event: 'reaction' }, ({ payload }) => {
            _showReactionFloat(payload.name + ': ' + payload.msg);
            if (typeof _playReactionSfx === 'function') _playReactionSfx(payload.sfx);
        })
        .on('broadcast', { event: 'timer-sync' }, ({ payload }) => {
            _handleTimerSync(payload);
        })
        .on('broadcast', { event: 'question-challenge' }, ({ payload }) => {
            if (payload && payload.question) _showQuestionChallenge(payload);
        })
        .on('broadcast', { event: 'figured-out' }, ({ payload }) => {
            if (payload && payload.pid) {
                _figuredOut.add(payload.pid);
                _refreshRoundPlayerPanel();
                if (_room && _room.state === 'discussion' && !_isThiefRoom(_room) && _figuredThresholdMet(_room)) _moveToVoting('figured');
                const name = payload.name || '???';
                _showFiguredOutAnnounce(name, _isSpyfallRoom(_room) ? 'عرف الspy!' : 'عرف الكذاب!');
                if (typeof _sfx !== 'undefined') _sfx.notify();
            }
        })
        .subscribe(async s => {
            if(s==='SUBSCRIBED') {
                console.log('[online] subscribed',code);
                try { await _channel.track({ id:_myId, name:_myName, at:new Date().toISOString() }); } catch(_) {}
            }
        });
}

function _refreshPresenceViews() {
    if (!_room) return;
    const active = document.querySelector('.screen.active')?.id;
    if (active === 'online-lobby-screen') _renderLobby(_room);
    else _refreshRoundPlayerPanel();
}

function _handleStateChange(room) {
    if (typeof setGameMode === 'function') setGameMode(_getRoomGameMode(room), false);
    if (_lastHandledState !== room.state) {
        if (room.state === 'reveal' || room.state === 'lobby') {
            _figuredOut.clear();
            _localPlayerDesired = {};
            _localCardRevealed = false;
        }
        if (room.state !== 'voting') delete _localPlayerDesired.vote;
        _lastHandledState = room.state;
    }
    if (room.state !== 'voting') _stopVotingTimer();

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
        case 'coup':       _showOnlineCoup(room); break;
    }
}

function _snapshotConfig() {
    return {
        gameMode: (typeof getCurrentGameMode === 'function' ? getCurrentGameMode() : 'impostor'),
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
        _rememberLastRoom(code);
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
        let existing = room?.players?.find(p=>p.id===_myId);
        if (!existing && room?.players) {
            const matches = room.players.filter(p => (p.name || '').trim().toLowerCase() === _myName.toLowerCase());
            if (matches.length === 1) {
                existing = matches[0];
                _storeMyId(existing.id);
            }
        }
        if (error||!room) { _err('ما لقيناش الغرفة!'); _sfx.error(); return; }
        if (!existing && room.state!=='lobby') { _err('اللعبة ديجا بدات'); _sfx.error(); return; }
        if (existing) {
            _room = room; _isHost = room.host_id===_myId; _myName = existing.name;
            _saveOnlineName(_myName);
            const nameInput = document.getElementById('online-player-name');
            if (nameInput) nameInput.value = _myName;
            _rememberLastRoom(code);
            window.onlineMode = true; _subscribe(code); showScreen('online-lobby-screen'); _handleStateChange(room); return;
        }
        const updated = await _mutatePlayers(
            code,
            players => players.some(p=>p.id===_myId) ? null : [...players,_mkPlayer(false)],
            updatedRoom => updatedRoom.players.some(p=>p.id===_myId)
        );
        _room = updated; _isHost = false; window.onlineMode = true;
        _rememberLastRoom(code);
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
        const online = _playerOnline(p);
        const div = document.createElement('div');
        div.className = 'lobby-item' + (online ? '' : ' player-offline');
        const isMe = p.id === _myId;
        div.innerHTML = (p.isHost ? '👑 ' : '👤 ') + p.name +
            (isMe ? ' <span class="you-tag">أنا</span>' : '') +
            ` <span class="player-status ${online ? 'online' : 'offline'}" title="${online ? 'online' : 'offline'}">${online ? '●' : '○'}</span>`;
        if (isMe) {
            const voiceActive = typeof _voiceOn !== 'undefined' && _voiceOn;
            const vBtn = document.createElement('button');
            vBtn.id = 'lobby-voice-pill';
            vBtn.className = 'lobby-voice-btn' + (voiceActive ? ' lobby-voice-active' : '');
            vBtn.textContent = voiceActive ? '🔴 صوت شغال' : '🎙️ انضم للصوت';
            vBtn.addEventListener('click', e => {
                e.stopPropagation();
                if (typeof _voiceOn !== 'undefined' && _voiceOn) {
                    stopVoice();
                    vBtn.className = 'lobby-voice-btn';
                    vBtn.textContent = '🎙️ انضم للصوت';
                } else {
                    if (_room) initVoice(_room.code);
                    vBtn.className = 'lobby-voice-btn lobby-voice-active';
                    vBtn.textContent = '🔴 صوت شغال';
                }
            });
            div.appendChild(vBtn);
        }
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
        const minPlayers = _isCoupRoom(room) ? 2 : 3;
        if (n < minPlayers) { startBtn.disabled = true; startBtn.style.opacity = '0.5'; waitMsg.innerText = `⏳ نستنا لاعبين... (${n}/${minPlayers} على الأقل)`; }
        else { startBtn.disabled = false; startBtn.style.opacity = ''; waitMsg.innerText = `✅ ${n} لاعبين — يمكن تبدأ!`; }
        startBtn.innerText = _isCoupRoom(room) ? '🚀 ابدا كول وبوّع' : _isThiefRoom(room) ? '🚀 وزّع كوارط سارق حاكم جلاد' : _isSpyfallRoom(room) ? '🚀 وزّع كوارط ماناش هوني' : '🚀 ابدأ اللعبة';
        if (_isCoupRoom(room)) {
            _renderSimpleLobbyTimerSettings(startBtn, room, { key:'actionTimer', label:'⏱️ وقت الدور', fallback:1, max:5 });
            return;
        }
        if (_isThiefRoom(room) || _isSpyfallRoom(room)) {
            _renderSimpleLobbyTimerSettings(startBtn, room);
            return;
        }

        // ── Settings button ───────────────────────────────
        const cfg = room.config || {};
        const maxImps = Math.max(1, n - 1);
        if (!_pendingConfig) _pendingConfig = {
            impostors:       Math.min(cfg.impostors || 1, maxImps),
            timer:           cfg.timer || 3,
            randomImpostors: !!cfg.randomImpostors,
            chaos:           !!cfg.chaos,
            elimination:     !!cfg.elimination,
            noHints:         !!cfg.noHints,
            allCorrectHints: !!cfg.allCorrectHints
        };
        _pendingConfig.impostors = Math.min(_pendingConfig.impostors, maxImps);
        const curImps = _pendingConfig.impostors;
        const curTim  = _pendingConfig.timer;

        // ── Settings toggle — styled as advanced-header like main menu ──
        const settBtn = document.createElement('div');
        settBtn.id = 'lobby-settings-btn';
        settBtn.className = 'advanced-header';
        settBtn.style.cssText = 'margin-top:10px;';
        settBtn.innerHTML = '<span>⚙️ عدّل إعدادات الجولة</span><span id="ls-outer-chevron">▼</span>';
        startBtn.after(settBtn);

        // ── Wrapper uses advanced-content for the drop-down animation ──
        const panelWrapper = document.createElement('div');
        panelWrapper.id = 'lobby-settings-panel';
        panelWrapper.className = 'advanced-content';

        // ── Inner panel — surface-card + advanced identical to main menu ──
        const panel = document.createElement('div');
        panelWrapper.appendChild(panel);

        const _tog = (id, active) =>
            `<div class="toggle-switch${active ? ' active' : ''}" id="${id}"><div class="toggle-thumb"></div></div>`;
        const pc = _pendingConfig;

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
                    ${_tog('ls-random', pc.randomImpostors)}
                </div>
                <div class="toggle-row">
                    <span class="toggle-label">😈 خلوضها</span>
                    ${_tog('ls-chaos', pc.chaos)}
                </div>
                <div class="toggle-row">
                    <span class="toggle-label">⚔️ نقص بالواحد بالواحد</span>
                    ${_tog('ls-elim', pc.elimination)}
                </div>
                <div class="toggle-row">
                    <span class="toggle-label">🙈 سبورة كحلة مع الكذاب</span>
                    ${_tog('ls-nohint', pc.noHints)}
                </div>
                <div class="toggle-row" style="border-bottom:none;">
                    <span class="toggle-label">💡 الكذابين الكل ياخذو نفس التلميح</span>
                    ${_tog('ls-allhint', pc.allCorrectHints)}
                </div>
            </div>
        `;
        settBtn.after(panelWrapper);

        // Counter helpers
        const _readPanel = () => ({
            impostors:       parseInt(document.getElementById('ls-imp-val')?.textContent) || _pendingConfig.impostors,
            timer:           parseInt(document.getElementById('ls-tim-val')?.textContent) || _pendingConfig.timer,
            randomImpostors: document.getElementById('ls-random')?.classList.contains('active')  || false,
            chaos:           document.getElementById('ls-chaos')?.classList.contains('active')   || false,
            elimination:     document.getElementById('ls-elim')?.classList.contains('active')    || false,
            noHints:         document.getElementById('ls-nohint')?.classList.contains('active')  || false,
            allCorrectHints: document.getElementById('ls-allhint')?.classList.contains('active') || false
        });
        const _counter = (dispId, minusId, plusId, minV, maxV) => {
            const disp = () => document.getElementById(dispId);
            document.getElementById(minusId)?.addEventListener('click', () => {
                disp().textContent = Math.max(minV, parseInt(disp().textContent) - 1);
                _pendingConfig = { ..._pendingConfig, ..._readPanel() };
            });
            document.getElementById(plusId)?.addEventListener('click', () => {
                disp().textContent = Math.min(maxV, parseInt(disp().textContent) + 1);
                _pendingConfig = { ..._pendingConfig, ..._readPanel() };
            });
        };
        _counter('ls-imp-val', 'ls-imp-minus', 'ls-imp-plus', 1, maxImps);
        _counter('ls-tim-val', 'ls-tim-minus', 'ls-tim-plus', 1, 10);

        // Toggle switches
        panel.querySelectorAll('.toggle-switch').forEach(sw => {
            sw.addEventListener('click', () => {
                sw.classList.toggle('active');
                _pendingConfig = { ..._pendingConfig, ..._readPanel() };
            });
        });

        // Advanced section collapse
        const advContent = panel.querySelector('#ls-adv-content');
        const chevron    = panel.querySelector('#ls-chevron');
        panel.querySelector('#ls-adv-header').addEventListener('click', () => {
            const open = advContent.classList.toggle('open');
            chevron.textContent = open ? '▲' : '▼';
        });

        // Outer button: show / hide whole panel
        settBtn.addEventListener('click', () => {
            const open = panelWrapper.classList.toggle('open');
            const outerChev = document.getElementById('ls-outer-chevron');
            if (outerChev) outerChev.textContent = open ? '▲' : '▼';
        });



    } else {
        startBtn.classList.add('hidden');
        waitMsg.innerText = `⏳ نستناو مولى الروم يبدا... (${n} لاعبين)`;
    }
}

function _renderSimpleLobbyTimerSettings(anchorBtn, room, opts = {}) {
    const key = opts.key || 'timer';
    const label = opts.label || '⏱️ وقت الطرح';
    const fallback = opts.fallback || timerConfig || 3;
    const max = opts.max || 20;
    const cfg = room.config || {};
    if (!_pendingConfig) _pendingConfig = { [key]: cfg[key] || fallback };
    const wrap = document.createElement('div');
    wrap.id = 'lobby-settings-panel';
    wrap.className = 'advanced-content open simple-lobby-settings';
    wrap.innerHTML = `
        <div class="surface-card" style="padding:10px 24px;">
            <div class="setting-row" style="border-bottom:none;">
                <div class="setting-info"><span class="setting-title">${label}</span></div>
                <div class="counter-group">
                    <button class="counter-btn" id="ls-tim-minus">−</button>
                    <span class="counter-value" id="ls-tim-val">${_pendingConfig[key] || fallback}</span>
                    <button class="counter-btn" id="ls-tim-plus">+</button>
                </div>
            </div>
        </div>
    `;
    anchorBtn.after(wrap);
    const read = () => parseInt(document.getElementById('ls-tim-val')?.textContent) || _pendingConfig[key] || fallback;
    const commit = async val => {
        _pendingConfig = {..._pendingConfig, [key]:val};
        try { await _update(room.code, { config:{...(room.config||{}), [key]:val} }); }
        catch(e) { console.error(e); }
    };
    document.getElementById('ls-tim-minus')?.addEventListener('click', () => {
        const val = Math.max(1, read() - 1);
        document.getElementById('ls-tim-val').textContent = val;
        commit(val);
    });
    document.getElementById('ls-tim-plus')?.addEventListener('click', () => {
        const val = Math.min(max, read() + 1);
        document.getElementById('ls-tim-val').textContent = val;
        commit(val);
    });
}

function _showFiguredOutAnnounce(name, subtitle = 'عرف الكذاب!') {
    // Remove any existing announcement
    document.querySelector('.figured-center-announce')?.remove();
    const el = document.createElement('div');
    el.className = 'figured-center-announce';
    el.innerHTML = `
        <div class="figured-center-announce-inner">
            <span class="figured-center-announce-icon">🎯</span>
            <span class="figured-center-announce-name">${name}</span>
            <span class="figured-center-announce-sub">${subtitle}</span>
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

const CHIP_VISIBLE_ROWS = 2;

function _rebuildChips(panel, room, screenId) {
    const list = panel.querySelector('.online-round-list');
    if (!list) return;
    list.innerHTML = '';

    // Sort: figured-out first, then rest
    const sorted = [...room.players].sort((a, b) => {
        const aF = _playerFigured(a) ? 0 : 1;
        const bF = _playerFigured(b) ? 0 : 1;
        return aF - bF;
    });

    sorted.forEach(p => {
        const chip = document.createElement('div');
        chip.className = 'online-player-chip';
        if (p.id === _myId)   chip.classList.add('is-me');
        if (p.eliminated)     chip.classList.add('is-out');
        if (p.hasSeenCard)    chip.classList.add('has-seen');
        if (p.vote !== null)  chip.classList.add('has-voted');
        if (!_playerOnline(p)) chip.classList.add('is-offline');
        if (_playerFigured(p)) chip.classList.add('figured-out');

        const status = !_playerOnline(p) ? '○' : p.eliminated ? '🚫' : p.vote !== null ? '🗳️' : p.hasSeenCard ? '✅' : '👤';
        chip.innerHTML = `${p.isHost ? '👑' : status} <span>${p.name}</span>${p.id===_myId?' <span class="you-tag">أنا</span>':''}${_playerFigured(p)?'<span class="figured-badge">🎯</span>':''}`;
        list.appendChild(chip);
    });

    // Remove old show-more btn
    panel.querySelector('.show-more-btn')?.remove();

    const chips = [...list.querySelectorAll('.online-player-chip')];
    chips.forEach(chip => chip.classList.remove('chip-hidden'));
    const rowTops = [];
    chips.forEach(chip => {
        const top = chip.offsetTop;
        if (!rowTops.some(rowTop => Math.abs(rowTop - top) < 4)) rowTops.push(top);
    });
    const hasExtraRows = rowTops.length > CHIP_VISIBLE_ROWS;
    let extra = 0;
    if (hasExtraRows && !panel.dataset.expanded) {
        const visibleRows = rowTops.slice(0, CHIP_VISIBLE_ROWS);
        chips.forEach(chip => {
            const inVisibleRow = visibleRows.some(rowTop => Math.abs(rowTop - chip.offsetTop) < 4);
            if (!inVisibleRow) {
                chip.classList.add('chip-hidden');
                extra++;
            }
        });
    }

    if (extra > 0) {
        const btn = document.createElement('button');
        btn.className = 'show-more-btn';
        btn.textContent = `▼ عرض ${extra} لاعبين`;
        btn.onclick = () => {
            panel.dataset.expanded = '1';
            _rebuildChips(panel, room, screenId);
        };
        list.after(btn);
    } else if (hasExtraRows && panel.dataset.expanded) {
        const btn = document.createElement('button');
        btn.className = 'show-more-btn';
        btn.textContent = `▲ إخفاء`;
        btn.onclick = () => {
            delete panel.dataset.expanded;
            _rebuildChips(panel, room, screenId);
        };
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
    const isThiefGame = _isThiefRoom(room);
    const isSpyfallGame = _isSpyfallRoom(room);
    const myFiguredOut  = _playerFigured(_me(room) || { id:_myId });
    const canAskQuestion = isTimerScreen && !isThiefGame && _canAskQuestion(room);
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
            ${canAskQuestion ? `<button class="ask-question-btn" id="ask-question-btn">❓ اسأل لاعب</button>` : ''}
            ${isTimerScreen && !canAskQuestion && _me(room)?.askedQuestion ? `<div class="question-used">✅ سألت سؤال</div>` : ''}
            ${isTimerScreen && !isThiefGame && !myFiguredOut ? `<button class="figured-btn" id="figured-out-btn">🎯 ${isSpyfallGame ? 'عرفت الspy!' : 'عرفت الكذاب!'}</button>` : ''}
            ${isTimerScreen && !isThiefGame && myFiguredOut  ? `<div class="figured-announced">✅ ${isSpyfallGame ? 'أعلنت أنك عرفت الspy' : 'أعلنت أنك عرفت الكذاب'}</div>` : ''}
            <button class="round-leave-btn" id="round-leave-btn-${screenId}">🚪 نخرج ونرجع</button>
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

    panel.querySelector('#ask-question-btn')?.addEventListener('click', () => {
        _openQuestionTargetPicker(_room || room);
    });

    panel.querySelector(`#round-leave-btn-${screenId}`)?.addEventListener('click', () => {
        _disconnectForReconnect();
    });

    // Wire figured-out button
    panel.querySelector('#figured-out-btn')?.addEventListener('click', async () => {
        if (_playerFigured(_me(_room) || { id:_myId })) return;
        _figuredOut.add(_myId);
        _localPlayerDesired = {..._localPlayerDesired, figuredOut:true};
        _channel?.send({ type:'broadcast', event:'figured-out', payload:{ pid:_myId, name:_myName } });
        _refreshRoundPlayerPanel();
        _showFiguredOutAnnounce(_myName, isSpyfallGame ? 'عرف الspy!' : 'عرف الكذاب!');
        if (typeof _sfx !== 'undefined') _sfx.notify();
        try {
            const updated = await _commitMyPlayerPatch({figuredOut:true});
            if (updated && _figuredThresholdMet(updated)) _moveToVoting('figured');
        } catch(e) { console.error(e); }
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

function _openQuestionTargetPicker(room) {
    if (!_canAskQuestion(room)) return;
    document.querySelector('.question-picker-overlay')?.remove();
    const me = _me(room);
    const targets = room.players.filter(p => !p.eliminated && p.id !== _myId);
    const overlay = document.createElement('div');
    overlay.className = 'question-picker-overlay';
    overlay.innerHTML = `
        <div class="question-picker-card">
            <button class="question-picker-close" type="button">×</button>
            <div class="question-picker-title">اختار شكون تسأل</div>
            <div class="question-picker-list"></div>
        </div>
    `;
    const list = overlay.querySelector('.question-picker-list');
    targets.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'question-target-btn';
        btn.type = 'button';
        btn.textContent = player.name;
        btn.addEventListener('click', () => {
            overlay.remove();
            _askPlayerQuestion(player.id);
        });
        list.appendChild(btn);
    });
    overlay.querySelector('.question-picker-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

async function _askPlayerQuestion(targetId) {
    if (!_room || !_canAskQuestion(_room)) return;
    const target = _room.players.find(p => p.id === targetId && !p.eliminated);
    const me = _me(_room);
    if (!target || !me) return;
    const question = _randomQuestion();
    const payload = {
        fromId: _myId,
        fromName: me.name,
        toId: target.id,
        toName: target.name,
        question
    };

    _localPlayerDesired = {..._localPlayerDesired, askedQuestion:true};
    if (document.querySelector('.screen.active')?.id === 'timer-screen') {
        _renderOnlineRoundPlayers(_applyLocalPlayerOverrides(_room), 'timer-screen');
    }
    _showQuestionChallenge(payload);
    _channel?.send({ type:'broadcast', event:'question-challenge', payload });
    try {
        const updated = await _commitMyPlayerPatch({askedQuestion:true});
        _refreshRoundPlayerPanel();
        if (updated) _room = updated;
    } catch(e) { console.error(e); }
}

function _showQuestionChallenge(payload) {
    document.querySelector('.question-challenge-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'question-challenge-overlay';
    overlay.innerHTML = `
        <div class="question-challenge-card">
            <div class="question-challenge-meta"></div>
            <div class="question-challenge-text"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.question-challenge-meta').textContent = `${payload.fromName} يسأل ${payload.toName}`;
    const textEl = overlay.querySelector('.question-challenge-text');
    _animateQuestionText(textEl, payload.question);
    if (typeof _sfx !== 'undefined') _sfx.notify();
    setTimeout(() => overlay.classList.add('leaving'), 6200);
    setTimeout(() => overlay.remove(), 6800);
}

function _animateQuestionText(el, finalText) {
    const glyphs = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي؟!#@$%';
    const chars = [...finalText];
    let step = 0;
    const maxSteps = 28;
    const ticker = setInterval(() => {
        step++;
        const locked = Math.floor((step / maxSteps) * chars.length);
        el.textContent = chars.map((ch, idx) => {
            if (ch === ' ' || idx < locked) return ch;
            return glyphs[Math.floor(Math.random() * glyphs.length)];
        }).join('');
        if (step >= maxSteps) {
            clearInterval(ticker);
            el.textContent = finalText;
        }
    }, 45);
}

async function _startOnlineGame() {
    if (!_isHost||!_room) return;
    if (_isCoupRoom(_room)) { await _startOnlineCoupGame(); return; }
    if (_isThiefRoom(_room)) { await _startOnlineThiefGame(); return; }
    if (_isSpyfallRoom(_room)) { await _startOnlineSpyfallGame(); return; }
    if (_pendingConfig) { _room.config = { ..._room.config, ..._pendingConfig }; }
    _pendingConfig = null;
    const config = _room.config, lang = config.lang||'tn';
    const wordList = lang==='x18' ? adultWordsDB : regularWordsDB;
    if (!wordList||wordList.length===0) { showToast('الكلمات مازال ما جاتش، حاول مرة اخرى.'); return; }
    const allP = _room.players;
    let impCount = Math.min(config.impostors||1, allP.length - 1);
    if (config.randomImpostors) impCount = Math.floor(Math.random()*Math.floor(allP.length/2))+1;
    const wordObj = wordList[Math.floor(Math.random()*wordList.length)];
    const noHints = config.noHints||lang==='x18';
    let players = allP.map(p=>({...p,isImpostor:false,customHint:'',eliminated:false,hasSeenCard:false,vote:null,figuredOut:false,askedQuestion:false}));
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
    try { await _update(_room.code,{state:'reveal',config:{...config,currentVoteReason:null},word_obj:wordObj,players,timer_end_at:null,result:null});
          _figuredOut.clear(); }  // reset per round
    catch(e) { console.error(e); showToast('خطأ في بدء اللعبة!'); }
}

async function _startOnlineThiefGame() {
    if (!_isHost||!_room) return;
    const config = { ...(_room.config || {}), gameMode:'thief', lang:'tn', currentVoteReason:null };
    const allP = _room.players || [];
    if (allP.length < 3) { showToast('يلزم 3 لاعبين على الأقل.'); return; }
    const roleKeys = ['thief','judge','executioner', ...Array(Math.max(0, allP.length - 3)).fill('witness')].sort(()=>0.5-Math.random());
    const players = allP.map((p, idx)=>({
        ...p,
        role: roleKeys[idx],
        isImpostor:false,
        customHint:'',
        eliminated:false,
        hasSeenCard:false,
        vote:null,
        figuredOut:false,
        askedQuestion:false
    }));
    try {
        await _update(_room.code,{state:'reveal',config,word_obj:null,players,timer_end_at:null,result:null});
        _figuredOut.clear();
    } catch(e) { console.error(e); showToast('خطأ في بدء اللعبة!'); }
}

async function _startOnlineSpyfallGame() {
    if (!_isHost||!_room) return;
    if (!_spyfallDB.length) { showToast('قائمة البلايص مازال ما تحملتش، جرب بعد شوية.'); return; }
    const config = { ...(_room.config || {}), gameMode:'spyfall', lang:'tn', currentVoteReason:null };
    const allP = _room.players || [];
    if (allP.length < 3) { showToast('يلزم 3 لاعبين على الأقل.'); return; }
    const location = _spyfallDB[Math.floor(Math.random() * _spyfallDB.length)];
    const roles = [...(location.roles_tn || [])].sort(()=>0.5-Math.random());
    const spyIndex = Math.floor(Math.random() * allP.length);
    const players = allP.map((p, idx)=>({
        ...p,
        isSpy: idx === spyIndex,
        locationName: location.location_tn,
        locationRole: roles[idx % Math.max(1, roles.length)] || 'حريف',
        role: idx === spyIndex ? 'spy' : 'player',
        isImpostor: idx === spyIndex,
        customHint:'',
        eliminated:false,
        hasSeenCard:false,
        vote:null,
        figuredOut:false,
        askedQuestion:false
    }));
    try {
        await _update(_room.code,{state:'reveal',config,word_obj:location,players,timer_end_at:null,result:null});
        _figuredOut.clear();
    } catch(e) { console.error(e); showToast('خطأ في بدء اللعبة!'); }
}

function _onlineCoupDeck() {
    return ['duke','assassin','contessa','ambassador','captain'].flatMap(k=>Array(3).fill(k)).sort(()=>0.5-Math.random());
}

async function _startOnlineCoupGame() {
    if (!_isHost||!_room) return;
    const allP = _room.players || [];
    if (allP.length < 2) { showToast('يلزم زوز لاعبين على الأقل.'); return; }
    const deck = _onlineCoupDeck();
    const actionMinutes = Math.max(1, Math.min(5, parseInt(_room.config?.actionTimer || _pendingConfig?.actionTimer || 1, 10) || 1));
    const state = {
        deck,
        turnIndex:0,
        pending:null,
        actionMinutes,
        turnEndsAt:Date.now() + actionMinutes * 60000,
        log:'كل واحد بدا بزوز فلوس وزوز كوارط. البلوف محلول، أما "تكذب!" تستنى.',
        players: allP.map(p=>({
            id:p.id,
            name:p.name,
            coins:2,
            hand:[{type:deck.pop(),lost:false},{type:deck.pop(),lost:false}]
        }))
    };
    try {
        await _update(_room.code,{state:'coup',config:{...(_room.config||{}),gameMode:'coup',lang:'tn',actionTimer:actionMinutes},word_obj:state,timer_end_at:null,result:null});
    } catch(e) { console.error(e); showToast('خطأ في بدء اللعبة!'); }
}

function _showMyCard(room) {
    showScreen('online-card-screen');
    const me = _me(room); if (!me) return;
    const lang = _getLang(room), trans = i18n[lang], noHints = room.config.noHints||lang==='x18';
    _renderOnlineRoundPlayers(room, 'online-card-screen');
    if (me.hasSeenCard) { _renderCardWaiting(room); return; }
    const container = document.getElementById('online-card-container');
    container.innerHTML = '';
    container.classList.remove('online-card-done-compact');
    document.getElementById('online-seen-btn').classList.add('hidden');
    const waitingZone = document.getElementById('online-waiting-zone');
    waitingZone.classList.add('hidden');
    waitingZone.classList.remove('all-seen-ready');
    let roleText;
    if (_isThiefRoom(room)) {
        const meta = _thiefRoleMeta(me.role);
        roleText = `<strong style="font-size:1.7rem">${meta.icon} ${meta.label}</strong><br><br><span style="font-size:16px;">${meta.desc}</span>`;
    } else if (_isSpyfallRoom(room)) {
        roleText = me.isSpy
            ? `<strong style="font-size:1.7rem">🕶️ spy</strong><br><br><span style="font-size:16px;">إنت الspy. حاول تعرف البلاصة من كلامهم.</span>`
            : `<strong style="font-size:1.45rem">📍 ${me.locationName}</strong><br><br><span style="font-size:16px;">دورك: ${me.locationRole || 'حريف'}</span>`;
    } else {
        roleText = me.isImpostor
            ? (noHints ? trans.impostor_role : `${trans.impostor_role}<br><br><span style="font-size:16px;">${trans.hint_label}</span><br>${me.customHint}`)
            : `${trans.citizen_role}<br><br><span style="font-size:16px;">${trans.word_label}</span><br>${room.word_obj.word}`;
    }
    const card = document.createElement('div'); card.className = 'flip-card';
    card.innerHTML = `<div class="card-face card-front"><span>${trans.card_of}${me.name}</span></div>
                      <div class="card-face card-back"><span>${roleText}</span></div>`;
    const seenBtn = document.getElementById('online-seen-btn');
    const showCard = e => { e.preventDefault(); card.classList.add('flipped'); _sfx.cardFlip(); };
    const hideCard = e => { e.preventDefault(); if(!card.classList.contains('flipped')) return; card.classList.remove('flipped'); _localCardRevealed = true; seenBtn.classList.remove('hidden'); };
    card.addEventListener('mousedown',showCard); card.addEventListener('mouseup',hideCard); card.addEventListener('mouseleave',hideCard);
    card.addEventListener('touchstart',showCard,{passive:false}); card.addEventListener('touchend',hideCard,{passive:false}); card.addEventListener('touchcancel',hideCard,{passive:false});
    container.appendChild(card);
    if (_localCardRevealed) seenBtn.classList.remove('hidden');
}

async function _confirmSeen() {
    if (!_room) return;
    if (_me(_room)?.hasSeenCard || _localPlayerDesired.hasSeenCard) return;
    _localPlayerDesired = {..._localPlayerDesired, hasSeenCard:true};
    _localCardRevealed = false;
    document.getElementById('online-seen-btn').classList.add('hidden');
    const optimistic = _applyLocalPlayerOverrides(_room);
    _renderCardWaiting(optimistic);
    try {
        const updated = await _commitMyPlayerPatch({hasSeenCard:true});
        _renderCardWaiting(updated);
        _checkAllSeen(updated);
    }
    catch(e) { console.error(e); }
}

function _renderCardWaiting(room) {
    _renderOnlineRoundPlayers(room, 'online-card-screen');
    const container = document.getElementById('online-card-container');
    container.classList.add('online-card-done-compact');
    container.innerHTML = '<div class="card-done-badge">✅</div>';
    const zone = document.getElementById('online-waiting-zone'); zone.classList.remove('hidden');
    const statusEl = document.getElementById('online-seen-status'); statusEl.innerHTML = '';
    room.players.filter(p=>!p.eliminated).forEach(p=>{
        const online = _playerOnline(p);
        const div = document.createElement('div'); div.className = 'seen-status-item' + (online ? '' : ' player-offline');
        div.innerHTML = (online ? (p.hasSeenCard?'✅ ':'⏳ ') : '○ ')+p.name; statusEl.appendChild(div);
    });
    _checkAllSeen(room);
}

function _checkAllSeen(room) {
    const alive = room.players.filter(p=>!p.eliminated);
    const allSeen = alive.every(p=>p.hasSeenCard);
    const discBtn = document.getElementById('start-discussion-btn');
    const zone = document.getElementById('online-waiting-zone');
    zone?.classList.toggle('all-seen-ready', allSeen);
    if (_isHost) {
        discBtn.classList.toggle('hidden',!allSeen);
        if (allSeen && zone && zone.firstElementChild !== discBtn) zone.prepend(discBtn);
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
    if (_onlineCoupTimer) { clearInterval(_onlineCoupTimer); _onlineCoupTimer = null; }
    _timerSyncState = null;
    _lastOnlineTimerSecond = null;
}

function _stopVotingTimer() {
    if (_votingTimer) { clearInterval(_votingTimer); _votingTimer = null; }
    if (_votingSyncTicker) { clearInterval(_votingSyncTicker); _votingSyncTicker = null; }
    _votingSyncState = null;
    _lastVotingTimerSecond = null;
}

function _ensureVotingTimerEl() {
    let el = document.getElementById('voting-timer-display');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'voting-timer-display';
    el.className = 'voting-timer-display';
    const list = document.getElementById('voting-list');
    list?.before(el);
    return el;
}

function _startVotingTimer(room) {
    _stopVotingTimer();
    const timerEl = _ensureVotingTimerEl();
    if (_isHost) {
        _broadcastVotingTimerSync(room);
        _votingSyncTicker = setInterval(() => _broadcastVotingTimerSync(room), 1000);
    }
    const tick = () => {
        const left = _votingSecondsLeftForRoom(room);
        const m = Math.floor(left/60).toString().padStart(2,'0');
        const s = (left%60).toString().padStart(2,'0');
        timerEl.innerText = `${m}:${s}`;
        if (left !== _lastVotingTimerSecond) {
            _lastVotingTimerSecond = left;
            if (left <= 10 && left > 0) _sfx.tickUrgent();
        }
        if (left <= 0) {
            _stopVotingTimer();
            _processVotes(_room || room);
        }
    };
    tick();
    _votingTimer = setInterval(tick, 500);
}

function _votingSecondsLeftForRoom(room) {
    if (!_isHost && _votingSyncState && _votingSyncState.timerEndAt === room.timer_end_at) {
        const elapsed = (_timerNow() - _votingSyncState.receivedAt) / 1000;
        return Math.max(0, Math.ceil(_votingSyncState.left - elapsed));
    }
    const endAt = new Date(room.timer_end_at || Date.now()+60000).getTime();
    if (!Number.isFinite(endAt)) return 60;
    return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
}

function _broadcastVotingTimerSync(room) {
    if (!_isHost || !_channel || !room || room.state !== 'voting') return;
    const payload = { phase:'voting', timerEndAt: room.timer_end_at, left: _votingSecondsLeftForRoom(room) };
    const sent = _channel.send({ type:'broadcast', event:'timer-sync', payload });
    if (sent && typeof sent.catch === 'function') sent.catch(() => {});
}

function _hostSecondsLeft(room) {
    const endTime = new Date(room.timer_end_at).getTime();
    if (!Number.isFinite(endTime)) return 0;
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
    const payload = { phase:'discussion', timerEndAt: room.timer_end_at, left: _hostSecondsLeft(room) };
    const sent = _channel.send({ type:'broadcast', event:'timer-sync', payload });
    if (sent && typeof sent.catch === 'function') sent.catch(() => {});
}

function _handleTimerSync(payload) {
    if (_isHost || !_room || !payload) return;
    if (payload.timerEndAt !== _room.timer_end_at) return;
    if (payload.phase === 'voting') {
        if (_room.state !== 'voting') return;
        _votingSyncState = {
            timerEndAt: payload.timerEndAt,
            left: Math.max(0, Number(payload.left) || 0),
            receivedAt: _timerNow()
        };
        return;
    }
    if (_room.state !== 'discussion') return;
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
            _moveToVoting('timer');
        }
        if (!_isThiefRoom(_room || room) && _figuredThresholdMet(_room || room)) _moveToVoting('figured');
    };
    tick(); _onlineTimer = setInterval(tick, 500);
    document.getElementById('go-to-vote-btn').onclick = () => {
        if (!_isHost) { showToast('مولى الروم اكهو ينجم يوقف الوقت!'); return; }
        _stopOnlineTimer();
        document.getElementById('reaction-bar')?.classList.add('hidden');
        _moveToVoting('manual');
    };
}

async function _moveToVoting(reason = 'timer') {
    if (!_room || _movingToVoting) return;
    _movingToVoting = true;
    try {
        const fresh = await _fetchRoom(_room.code);
        if (!fresh || fresh.state !== 'discussion') return;
        const votingEndAt = new Date(Date.now()+60*1000).toISOString();
        const config = {...(fresh.config || {}), currentVoteReason: reason};
        const {data,error} = await _supa.from('rooms')
            .update({state:'voting',timer_end_at:votingEndAt,config})
            .eq('code',fresh.code)
            .eq('state','discussion')
            .select()
            .maybeSingle();
        if (error) throw error;
        if (data) { _room = data; _handleStateChange(data); }
    } catch(e) { console.error(e); }
    finally { _movingToVoting = false; }
}

function _showOnlineVoting(room) {
    _stopOnlineTimer();
    showScreen('voting-screen');
    _renderOnlineRoundPlayers(room, 'voting-screen');
    _startVotingTimer(room);
    const list = document.getElementById('voting-list'); list.innerHTML = '';
    const me = _me(room), hasVoted = me&&me.vote!==null;
    document.querySelector('[data-i18n="voting_title"]').innerText = _isThiefRoom(room) ? '⚖️ حكم الحاكم' : _isSpyfallRoom(room) ? '🕶️ التصويت على الspy' : _getTrans(room).voting_title;
    document.querySelector('[data-i18n="who_impostor"]').innerText = _isThiefRoom(room) ? 'يا حاكم، شكون السارق؟' : _isSpyfallRoom(room) ? 'شكون الspy؟' : _getTrans(room).who_impostor;
    room.players.filter(p=>!p.eliminated).forEach(player=>{
        if (_isThiefRoom(room) && player.role === 'judge') return;
        const btn = document.createElement('button'); btn.className = 'vote-item';
        const vc = room.players.filter(p=>p.vote===player.id).length;
        btn.innerHTML = (_isThiefRoom(room) ? '⚖️ ' : _isSpyfallRoom(room) ? '🕶️ ' : '🗳️ ')+player.name+(vc>0?` <span class="vote-count">(${vc})</span>`:'');
        if (_isThiefRoom(room) && me?.role !== 'judge') { btn.disabled = true; btn.title = 'نستناو الحاكم يحكم'; }
        else if (hasVoted) { btn.disabled=true; if(me.vote===player.id) btn.classList.add('my-vote'); }
        else if (player.id===_myId) { btn.disabled=true; btn.title='ما تنجمش تصوت على روحك'; }
        else { btn.addEventListener('click',()=>_castVote(player.id)); }
        list.appendChild(btn);
    });
    const alive = room.players.filter(p=>!p.eliminated);
    const allVoted = _isThiefRoom(room)
        ? !!room.players.find(p=>p.role==='judge' && p.vote!==null)
        : alive.length>0&&alive.every(p=>p.vote!==null);
    if (allVoted) setTimeout(()=>_processVotes(room),800);
}

async function _castVote(targetId) {
    if (!_room || _localPlayerDesired.vote) return; _sfx.vote();
    if (_isThiefRoom(_room) && _me(_room)?.role !== 'judge') return;
    _localPlayerDesired = {..._localPlayerDesired, vote:targetId};
    _showOnlineVoting(_applyLocalPlayerOverrides(_room));
    try {
    const updated = await _commitMyPlayerPatch({vote:targetId});
        _showOnlineVoting(updated);
        const alive = updated.players.filter(p=>!p.eliminated);
        const done = _isThiefRoom(updated)
            ? !!updated.players.find(p=>p.role==='judge' && p.vote!==null)
            : alive.length>0&&alive.every(p=>p.vote!==null);
        if (done) setTimeout(()=>_processVotes(updated),800);
    } catch(e) { console.error(e); }
}

async function _processVotes(room) {
    if (_processingVotes) return;
    _processingVotes = true;
    try {
    const fresh = await _fetchRoom(room?.code || _room?.code);
    if (!fresh || fresh.state !== 'voting') return;
    room = fresh;
    const alive = room.players.filter(p=>!p.eliminated);
    if (!alive.length) return;
    if (_isThiefRoom(room)) {
        const judge = room.players.find(p=>p.role==='judge');
        const thief = room.players.find(p=>p.role==='thief');
        const executioner = room.players.find(p=>p.role==='executioner');
        const votedId = judge?.vote || alive.find(p=>p.role!=='judge')?.id;
        const votedPlayer = room.players.find(p=>p.id===votedId);
        if (!votedPlayer || !thief) return;
        const outcome = votedPlayer.role === 'thief' ? 'thief_caught' : 'thief_escaped';
        const result = {
            votedPlayerId:votedId,
            outcome,
            thiefId: thief.id,
            judgeId: judge?.id || null,
            executionerId: executioner?.id || null
        };
        const {data,error} = await _supa.from('rooms')
            .update({state:'result',result,timer_end_at:null,config:{...(room.config||{}),currentVoteReason:null}})
            .eq('code',room.code)
            .eq('state','voting')
            .select()
            .maybeSingle();
        if (error) throw error;
        if (data) { _room = data; _handleStateChange(data); }
        return;
    }
    if (_isSpyfallRoom(room)) {
        const tally = {}; alive.forEach(p=>{if(p.vote) tally[p.vote]=(tally[p.vote]||0)+1;});
        let maxV=-1, votedId=alive[0].id;
        Object.entries(tally).forEach(([id,count])=>{if(count>maxV){maxV=count;votedId=id;}});
        const votedPlayer = room.players.find(p=>p.id===votedId);
        const spy = room.players.find(p=>p.isSpy);
        if (!votedPlayer || !spy) return;
        const result = {
            votedPlayerId:votedId,
            outcome: votedPlayer.isSpy ? 'spy_caught' : 'spy_escaped',
            spyId: spy.id,
            locationName: spy.locationName || room.word_obj?.location_tn || '?'
        };
        const {data,error} = await _supa.from('rooms')
            .update({state:'result',result,timer_end_at:null,config:{...(room.config||{}),currentVoteReason:null}})
            .eq('code',room.code)
            .eq('state','voting')
            .select()
            .maybeSingle();
        if (error) throw error;
        if (data) { _room = data; _handleStateChange(data); }
        return;
    }
    const tally = {}; alive.forEach(p=>{if(p.vote) tally[p.vote]=(tally[p.vote]||0)+1;});
    let maxV=-1, votedId=alive[0].id;
    Object.entries(tally).forEach(([id,count])=>{if(count>maxV){maxV=count;votedId=id;}});
    const votedPlayer = room.players.find(p=>p.id===votedId); if (!votedPlayer) return;
    const isElim = room.config.elimination;
    const isFiguredVote = room.config.currentVoteReason === 'figured';
    let outcome;
    let players = room.players.map(p=>p.id===votedId?{...p,eliminated:(isElim || (isFiguredVote && !votedPlayer.isImpostor))?true:p.eliminated}:p);
    if (!isElim) {
        if (isFiguredVote && !votedPlayer.isImpostor) outcome = 'continue';
        else outcome = votedPlayer.isImpostor?'correct_guess':'wrong_guess';
    }
    else {
        const rI = players.filter(p=>p.isImpostor&&!p.eliminated);
        const rR = players.filter(p=>!p.isImpostor&&!p.eliminated);
        if (rI.length===0) outcome='all_impostors_dead';
        else if (rI.length>=rR.length) outcome='impostors_win';
        else outcome='continue';
    }
    const {data,error} = await _supa.from('rooms')
        .update({state:'result',players,result:{votedPlayerId:votedId,outcome},timer_end_at:null,config:{...(room.config||{}),currentVoteReason:null}})
        .eq('code',room.code)
        .eq('state','voting')
        .select()
        .maybeSingle();
    if (error) throw error;
    if (data) { _room = data; _handleStateChange(data); }
    } catch(e) { console.error(e); }
    finally { _processingVotes = false; }
}

function _showOnlineResult(room) {
    _stopOnlineTimer();
    _stopVotingTimer();
    showScreen('result-screen');
    _renderOnlineRoundPlayers(room, 'result-screen');
    const trans = _getTrans(room), result = room.result;
    const resultMsg = document.getElementById('result-message');
    const revealBox = document.getElementById('impostors-reveal');
    const nextBtn = document.getElementById('next-round-btn');
    revealBox.innerHTML = ''; if (!result) return;
    if (_isThiefRoom(room)) {
        const voted = room.players.find(p=>p.id===result.votedPlayerId);
        const thief = room.players.find(p=>p.id===result.thiefId) || room.players.find(p=>p.role==='thief');
        const judge = room.players.find(p=>p.id===result.judgeId) || room.players.find(p=>p.role==='judge');
        const executioner = room.players.find(p=>p.id===result.executionerId) || room.players.find(p=>p.role==='executioner');
        if (result.outcome === 'thief_caught') {
            triggerAnimation('win');
            resultMsg.innerText = `الحاكم فقسها! ${voted?.name || '?'} هو السارق.`;
        } else {
            triggerAnimation('lose');
            resultMsg.innerText = `السارق هرب! ${voted?.name || '?'} طلع خاطيه.`;
        }
        revealBox.innerHTML = `السارق: <strong style="color:var(--primary-color)">${thief?.name || '?'}</strong><br>الحاكم: <strong>${judge?.name || '?'}</strong><br>الجلّاد: <strong>${executioner?.name || '?'}</strong>`;
        if (_isHost) { nextBtn.innerText='🔄 عاود انده'; nextBtn.disabled=false; nextBtn.onclick=()=>_resetToLobby(); }
        else { nextBtn.innerText='⏳ نستناو مولى الروم...'; nextBtn.disabled=true; }
        return;
    }
    if (_isSpyfallRoom(room)) {
        const voted = room.players.find(p=>p.id===result.votedPlayerId);
        const spy = room.players.find(p=>p.id===result.spyId) || room.players.find(p=>p.isSpy);
        if (result.outcome === 'spy_caught') {
            triggerAnimation('win');
            resultMsg.innerText = `براڨو! ${voted?.name || '?'} هو الspy.`;
        } else {
            triggerAnimation('lose');
            resultMsg.innerText = `غلط! الspy هرب. ${voted?.name || '?'} خاطيه.`;
        }
        revealBox.innerHTML = `الspy: <strong style="color:var(--primary-color)">${spy?.name || '?'}</strong><br>البلاصة: <strong>${result.locationName || spy?.locationName || '?'}</strong>`;
        if (_isHost) { nextBtn.innerText='🔄 عاود انده'; nextBtn.disabled=false; nextBtn.onclick=()=>_resetToLobby(); }
        else { nextBtn.innerText='⏳ نستناو مولى الروم...'; nextBtn.disabled=true; }
        return;
    }
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
    const players = room.players.map(p=>({...p,vote:null,figuredOut:false}));
    _figuredOut.clear();
    try { await _update(room.code,{state:'discussion',config:{...(room.config||{}),currentVoteReason:null},starter_player:starter.name,timer_end_at:timerEndAt,players}); }
    catch(e) { console.error(e); }
}

async function _resetToLobby() {
    if (!_isHost||!_room) return;
    const players = _room.players.map(p=>({...p,isImpostor:false,isSpy:false,role:null,locationName:null,locationRole:null,customHint:'',eliminated:false,hasSeenCard:false,vote:null,figuredOut:false,askedQuestion:false}));
    try { await _update(_room.code,{state:'lobby',config:{...(_room.config||{}),currentVoteReason:null},word_obj:null,players,starter_player:null,timer_end_at:null,result:null}); }
    catch(e) { console.error(e); }
}

function _onlineCoupAlive(state) {
    return (state?.players || []).filter(p => p.hand.some(c=>!c.lost));
}

function _onlineCoupActionMinutes(state) {
    return Math.max(1, Math.min(5, parseInt(state?.actionMinutes || _room?.config?.actionTimer || 1, 10) || 1));
}

function _onlineCoupSetDeadline(state) {
    state.turnEndsAt = Date.now() + _onlineCoupActionMinutes(state) * 60000;
}

function _onlineCoupEvent(state, text, kind = 'notice') {
    state.lastEvent = { id:`${Date.now()}_${Math.random().toString(36).slice(2,6)}`, text, kind };
}

function _onlineCoupNextTurn(state) {
    const alive = _onlineCoupAlive(state);
    if (alive.length <= 1) return;
    let idx = state.turnIndex || 0;
    for (let i=0; i<state.players.length; i++) {
        idx = (idx + 1) % state.players.length;
        if (state.players[idx].hand.some(c=>!c.lost)) { state.turnIndex = idx; _onlineCoupSetDeadline(state); return; }
    }
}

function _onlineCoupLose(state, playerId) {
    const p = state.players.find(x=>x.id===playerId);
    const card = p?.hand.find(c=>!c.lost);
    if (card) {
        card.lost = true;
        const meta = _coupCards[card.type] || _coupCards.duke;
        _onlineCoupEvent(state, `${p.name} خسر ${meta.name}`, 'bad');
    }
}

function _onlineCoupActionName(action) {
    return {income:'دخل',foreignAid:'معونة',tax:'ضريبة الشلغمي',assassinate:'اغتيال',exchange:'تبديل السمسار',steal:'سرقة الرايس',coup:'Coup'}[action] || action;
}

function _startOnlineCoupTimer(state) {
    clearInterval(_onlineCoupTimer);
    const timerEl = document.getElementById('coup-action-timer');
    if (!timerEl || !state) return;
    const tick = () => {
        const left = Math.ceil(((state.turnEndsAt || Date.now()) - Date.now()) / 1000);
        timerEl.textContent = (window.CoupUI?.formatSeconds || (s => `00:${String(Math.max(0,s)).padStart(2,'0')}`))(left);
        timerEl.classList.toggle('urgent', left <= 10);
        const current = state.players?.[state.turnIndex || 0];
        if (left <= 0 && !state.pending && !_onlineCoupTimingOut && _onlineCoupAlive(state).length > 1 && (_isHost || current?.id === _myId)) {
            _onlineCoupTimeout();
        }
    };
    tick();
    _onlineCoupTimer = setInterval(tick, 1000);
}

async function _onlineCoupTimeout() {
    if (!_room?.word_obj || _onlineCoupTimingOut) return;
    _onlineCoupTimingOut = true;
    try {
        const state = structuredClone(_room.word_obj);
        if (state.pending || Math.ceil(((state.turnEndsAt || Date.now()) - Date.now()) / 1000) > 0) return;
        const actor = state.players[state.turnIndex || 0];
        if (actor?.hand?.some(c=>!c.lost)) {
            actor.coins += 1;
            state.log = `${actor.name} فات الوقت، خذا دخل +1 وعدّى الدور.`;
            _onlineCoupEvent(state, 'الوقت وفى، تعدّى الدور', 'notice');
        }
        _onlineCoupNextTurn(state);
        await _onlineCoupSave(state);
    } catch(e) { console.error(e); }
    finally { _onlineCoupTimingOut = false; }
}

function _showOnlineCoup(room) {
    _stopOnlineTimer();
    _stopVotingTimer();
    showScreen('coup-screen');
    const state = room.word_obj;
    if (!state) return;
    const alive = _onlineCoupAlive(state);
    const current = state.players[state.turnIndex || 0];
    const me = state.players.find(p=>p.id===_myId);
    document.getElementById('coup-deck-pill').innerText = `🂠 ${state.deck?.length || 0}`;
    document.getElementById('coup-status').innerText = alive.length <= 1
        ? `🏆 ${alive[0]?.name || ''} ربح الطرح!`
        : (state.pending ? state.log : `الدور على ${current?.name || '?'}. ${state.log || ''}`);
    _startOnlineCoupTimer(state);
    if (state.lastEvent?.id && state.lastEvent.id !== _lastCoupEventId) {
        _lastCoupEventId = state.lastEvent.id;
        window.CoupUI?.showEvent?.(state.lastEvent.text, state.lastEvent.kind);
    }

    const board = document.getElementById('coup-player-board');
    board.innerHTML = '';
    state.players.forEach((p, idx) => {
        const isMe = p.id === _myId;
        const focused = _onlineCoupFocusedPlayerId === p.id || (!_onlineCoupFocusedPlayerId && isMe);
        const dimmed = !!_onlineCoupFocusedPlayerId && _onlineCoupFocusedPlayerId !== p.id;
        const out = !p.hand.some(c=>!c.lost);
        const div = document.createElement('div');
        div.className = 'coup-player-card' + (idx===(state.turnIndex||0)?' is-turn':'') + (isMe?' is-me':'') + (focused?' is-focused':'') + (dimmed?' is-dimmed':'') + (out?' is-out':'');
        div.dataset.playerId = p.id;
        div.innerHTML = `<div class="coup-player-head"><span>${window.CoupUI?.escapeHtml?.(p.name) || p.name}${isMe?' <span class="you-tag">أنا</span>':''}</span><span class="coup-coins">🪙 ${p.coins}</span></div>
            <div class="coup-influence-row">${p.hand.map(c => {
                const meta = _coupCards[c.type] || _coupCards.duke;
                const label = isMe || c.lost ? `${meta.icon} ${meta.name}` : '🂠 مخبية';
                const info = (isMe || c.lost) ? `<button class="coup-card-info" type="button" data-card-type="${c.type}" aria-label="info">ℹ️</button>` : '';
                return `<div class="coup-influence ${c.lost?'lost':''}"><span>${label}</span>${info}</div>`;
            }).join('')}</div>`;
        div.addEventListener('click', e => {
            if (e.target.closest('.coup-card-info')) return;
            _onlineCoupFocusedPlayerId = _onlineCoupFocusedPlayerId === p.id ? null : p.id;
            _showOnlineCoup(room);
        });
        div.querySelectorAll('.coup-card-info').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                window.CoupUI?.showCardInfo?.(btn.dataset.cardType, _coupCards);
            });
        });
        board.appendChild(div);
    });
    window.CoupUI?.renderRoleHelp?.(_coupCards);
    _renderOnlineCoupActions(room, state, me);
    _renderOnlineCoupLeaveButton(room);
}

function _renderOnlineCoupLeaveButton(room) {
    document.getElementById('online-coup-leave-btn')?.remove();
    if (!room || !window.onlineMode) return;
    const panel = document.getElementById('coup-action-panel');
    if (!panel) return;
    const btn = document.createElement('button');
    btn.id = 'online-coup-leave-btn';
    btn.className = 'round-leave-btn coup-reconnect-btn';
    btn.type = 'button';
    btn.textContent = '🚪 نخرج ونرجع';
    btn.addEventListener('click', _disconnectForReconnect);
    panel.after(btn);
}

function _renderOnlineCoupActions(room, state, me) {
    const panel = document.getElementById('coup-action-panel');
    panel.innerHTML = '';
    const alive = _onlineCoupAlive(state);
    if (alive.length <= 1) {
        if (_isHost) {
            const btn = document.createElement('button');
            btn.className = 'primary-btn';
            btn.innerText = '🔄 عاود انده';
            btn.onclick = () => _resetToLobby();
            panel.appendChild(btn);
        } else panel.innerHTML = '<div class="coup-panel-card">نستناو مولى الروم يعاود.</div>';
        return;
    }
    if (!me || !me.hand.some(c=>!c.lost)) {
        panel.innerHTML = '<div class="coup-panel-card">إنت خارج من الطرح. تنجم تتفرج وتضحك عالبلوف.</div>';
        return;
    }
    if (state.pending) {
        const p = state.pending;
        const actor = state.players.find(x=>x.id===p.actorId);
        const canChallenge = p.claim && me.id !== actor?.id && me.hand.some(c=>!c.lost);
        const canBlock = p.blockable && me.id !== actor?.id && me.hand.some(c=>!c.lost) && (p.action === 'foreignAid' || p.targetId === me.id);
        panel.innerHTML = `<div class="coup-panel-card live">${window.CoupUI?.escapeHtml?.(state.log) || state.log}</div><div class="coup-target-grid"></div>`;
        const grid = panel.querySelector('.coup-target-grid');
        if (canChallenge) {
            const btn = document.createElement('button');
            btn.className = 'coup-target-btn danger-action';
            btn.innerText = 'تكذب!';
            btn.onclick = () => _onlineCoupChallenge(me.id);
            grid.appendChild(btn);
        }
        if (canBlock) {
            const btn = document.createElement('button');
            btn.className = 'coup-target-btn';
            btn.innerText = 'نسكّرها';
            btn.onclick = () => _onlineCoupBlock(me.id);
            grid.appendChild(btn);
        }
        if (me.id === actor?.id) {
            const btn = document.createElement('button');
            btn.className = 'primary-btn';
            btn.innerText = 'كمّل الأكشن';
            btn.onclick = () => _onlineCoupResolve(p.action, p.targetId);
            panel.appendChild(btn);
        }
        const pendingKey = `${p.actorId}:${p.action}:${p.targetId || ''}`;
        if (_lastCoupPendingKey !== pendingKey) {
            _lastCoupPendingKey = pendingKey;
            const esc = window.CoupUI?.escapeHtml || (x => x);
            const buttons = `${canChallenge ? '<button class="coup-target-btn danger-action" data-popup-challenge="1">تكذب!</button>' : ''}${canBlock ? '<button class="coup-target-btn" data-popup-block="1">نسكّرها</button>' : ''}${me.id === actor?.id ? '<button class="primary-btn" data-popup-pass="1">كمّل الأكشن</button>' : ''}`;
            if (buttons) window.CoupUI?.showModal?.('بوّع ولا صحيح؟', `<p>${esc(state.log)}</p><div class="coup-target-grid">${buttons}</div>`, overlay => {
                overlay.querySelector('[data-popup-challenge]')?.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupChallenge(me.id); });
                overlay.querySelector('[data-popup-block]')?.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupBlock(me.id); });
                overlay.querySelector('[data-popup-pass]')?.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupResolve(p.action, p.targetId); });
            });
        }
        return;
    }
    _lastCoupPendingKey = null;
    const current = state.players[state.turnIndex || 0];
    if (me.id !== current?.id) {
        panel.innerHTML = `<div class="coup-panel-card">استنى دورك. الدور توّة على ${window.CoupUI?.escapeHtml?.(current?.name || '') || current?.name || ''}.</div>`;
    }
    const isTurn = me.id === current?.id;
    const disabled = isTurn ? '' : 'disabled';
    const mk = (txt, action, cls='', hint='') => `<button class="coup-action-btn ${cls}" data-coup-action="${action}" ${disabled}><strong>${txt}</strong><small>${hint}</small></button>`;
    panel.innerHTML += `<div class="coup-action-grid ${isTurn?'':'is-disabled'}">
        ${mk('🪙 دخل +1','income','','مضمون وما يتكذبش')}
        ${mk('🤲 معونة +2','foreignAid','','ينجم الشلغمي يسكّرها')}
        ${mk('👑 الشلغمي +3','tax','primary-action','قول عندي الشلغمي')}
        ${mk('⚓ الرايس: اسرق','steal','primary-action','اسرق زوز فلوس')}
        ${mk('🗡️ اغتيال -3','assassinate','danger-action','يلزم حفار القبور')}
        ${mk('🤝 السمسار: بدّل','exchange','','بدّل كوارطك مع الدكّة')}
        ${mk('💥 Coup -7','coup','danger-action','ضربة ما تتسكرش')}
    </div>`;
    panel.querySelectorAll('[data-coup-action]').forEach(btn => btn.addEventListener('click', () => _onlineCoupChoose(btn.dataset.coupAction)));
}

async function _onlineCoupSave(state) {
    if (!_room) return;
    const updated = await _update(_room.code, { word_obj: state });
    _showOnlineCoup(updated);
}

function _onlineCoupChoose(action) {
    const state = structuredClone(_room.word_obj);
    const actor = state.players[state.turnIndex || 0];
    if (actor.id !== _myId) return;
    if (action === 'assassinate' && actor.coins < 3) return showToast('يلزمك 3 فلوس للاغتيال.');
    if (action === 'coup' && actor.coins < 7) return showToast('يلزمك 7 فلوس للCoup.');
    if (['assassinate','coup','steal'].includes(action)) return _onlineCoupPickTarget(action);
    const actionName = _onlineCoupActionName(action);
    const esc = window.CoupUI?.escapeHtml || (x => x);
    window.CoupUI?.showModal?.(actionName, `
        <p>باش تعمل <strong>${esc(actionName)}</strong>. كان فيها بلوف، اللاعبين ينجموا يقولو "تكذب!".</p>
        <button class="primary-btn" id="online-coup-confirm-action">كمّل</button>
    `, overlay => {
        overlay.querySelector('#online-coup-confirm-action')?.addEventListener('click', () => {
            window.CoupUI.closeModal();
            _onlineCoupStartPending(action, null);
        });
    });
}

function _onlineCoupPickTarget(action) {
    const state = _room.word_obj;
    const actor = state.players[state.turnIndex || 0];
    const esc = window.CoupUI?.escapeHtml || (x => x);
    const targets = _onlineCoupAlive(state).filter(p=>p.id!==actor.id);
    window.CoupUI?.showModal?.(action === 'steal' ? 'اختار شكون تسرق' : 'اختار شكون تضرب', `
        <p>${action === 'steal' ? 'الرايس يسرق حتى زوز فلوس من لاعب.' : action === 'assassinate' ? 'حفار القبور يحتاج هدف واضح.' : 'Coup ضربة مباشرة وما تتسكرش.'}</p>
        <div class="coup-target-grid">${targets.map(p => `<button class="coup-target-btn" data-target-id="${p.id}">${esc(p.name)}</button>`).join('')}</div>
    `, overlay => {
        overlay.querySelectorAll('[data-target-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                window.CoupUI.closeModal();
                _onlineCoupStartPending(action, btn.dataset.targetId);
            });
        });
    });
}

async function _onlineCoupStartPending(action, targetId) {
    const state = structuredClone(_room.word_obj);
    const actor = state.players[state.turnIndex || 0];
    const claims = { tax:'duke', assassinate:'assassin', exchange:'ambassador', steal:'captain' };
    const blockRoles = action === 'foreignAid' ? ['duke'] : action === 'assassinate' ? ['contessa'] : action === 'steal' ? ['captain','ambassador'] : [];
    const blockable = blockRoles.length > 0;
    const claim = claims[action] || null;
    if (!claim && !blockable) return _onlineCoupResolve(action, targetId);
    state.pending = { action, actorId:actor.id, targetId, claim, blockable, blockRoles };
    state.log = `${actor.name} قال يعمل ${_onlineCoupActionName(action)}. قولولو "تكذب!" كان شاكين.`;
    _onlineCoupEvent(state, `${actor.name} عمل ${_onlineCoupActionName(action)}`, 'notice');
    await _onlineCoupSave(state);
}

async function _onlineCoupChallenge(challengerId) {
    const state = structuredClone(_room.word_obj);
    const p = state.pending; if (!p) return;
    const actor = state.players.find(x=>x.id===p.actorId);
    const challenger = state.players.find(x=>x.id===challengerId);
    const hasIt = actor.hand.some(c=>!c.lost && c.type===p.claim);
    if (hasIt) {
        _onlineCoupLose(state, challengerId);
        state.log = `${challenger.name} طلع غالط! ${actor.name} عندو الكارتة. ${_onlineCoupWrong()}`;
        _onlineCoupEvent(state, state.log, 'bad');
        state.pending = null;
        await _onlineCoupApplyAction(state, p.action, p.targetId);
    } else {
        _onlineCoupLose(state, actor.id);
        state.log = `${actor.name} تڨبض يبوّع! ${_onlineCoupCaught()}`;
        _onlineCoupEvent(state, state.log, 'bad');
        state.pending = null;
        _onlineCoupNextTurn(state);
        await _onlineCoupSave(state);
    }
}

async function _onlineCoupBlock(blockerId) {
    const state = structuredClone(_room.word_obj);
    const p = state.pending; if (!p) return;
    const blocker = state.players.find(x=>x.id===blockerId);
    const blockRoles = p.blockRoles || (p.action === 'assassinate' ? ['contessa'] : p.action === 'steal' ? ['captain','ambassador'] : ['duke']);
    const hasIt = blocker.hand.some(c=>!c.lost && blockRoles.includes(c.type));
    if (hasIt) {
        state.log = `${blocker.name} سكّرها. الأكشن مات غادي.`;
        _onlineCoupEvent(state, state.log, 'good');
        state.pending = null;
        _onlineCoupNextTurn(state);
        await _onlineCoupSave(state);
    } else {
        _onlineCoupLose(state, blockerId);
        state.log = `${blocker.name} حاول يسكّر وطلع يبوّع. الأكشن يكمل.`;
        _onlineCoupEvent(state, state.log, 'bad');
        state.pending = null;
        await _onlineCoupApplyAction(state, p.action, p.targetId);
    }
}

async function _onlineCoupResolve(action, targetId) {
    const state = structuredClone(_room.word_obj);
    state.pending = null;
    await _onlineCoupApplyAction(state, action, targetId);
}

async function _onlineCoupApplyAction(state, action, targetId) {
    const actor = state.players[state.turnIndex || 0];
    const target = state.players.find(p=>p.id===targetId);
    if (action === 'income') { actor.coins += 1; state.log = `${actor.name} خذا دينار. رزق بارد.`; }
    if (action === 'foreignAid') { actor.coins += 2; state.log = `${actor.name} خذا معونة. ما تسكّرتش.`; }
    if (action === 'tax') { actor.coins += 3; state.log = `${actor.name} كول بالشلغمي وخذا 3 فلوس.`; }
    if (action === 'exchange') {
        actor.hand.forEach(c => { if (!c.lost) state.deck.unshift(c.type); });
        state.deck.sort(()=>0.5-Math.random());
        actor.hand = actor.hand.map(c => c.lost ? c : {type:state.deck.pop(), lost:false});
        state.log = `${actor.name} بدّل كوارطو مع الدكّة.`;
    }
    if (action === 'steal' && target) {
        const amount = Math.min(2, target.coins || 0);
        target.coins -= amount;
        actor.coins += amount;
        state.log = amount > 0 ? `${actor.name} سرق ${amount} فلوس من ${target.name}. الرايس دخل للمرسى.` : `${actor.name} حاول يسرق ${target.name} أما ما لقى شي.`;
    }
    if (action === 'assassinate' && target) { actor.coins -= 3; _onlineCoupLose(state, target.id); state.log = `${target.name} تضرّب من حفار القبور وخسر كارتة.`; }
    if (action === 'coup' && target) { actor.coins -= 7; _onlineCoupLose(state, target.id); state.log = `${actor.name} عمل Coup على ${target.name}.`; }
    _onlineCoupEvent(state, state.log, ['assassinate','coup'].includes(action) ? 'bad' : 'good');
    _onlineCoupNextTurn(state);
    await _onlineCoupSave(state);
}

function _onlineCoupCaught() {
    return ['الكذبة طلعت بريحة اللبلابي.','بوّعها بثقة وطيح في الحفرة.','قالها كبيرة، جاتو أكبر.'][Math.floor(Math.random()*3)];
}
function _onlineCoupWrong() {
    return ['عمل روحو حاكم وطلع غلط.','تكذب؟ لا يا خويا، إنت الي تخلص.','دخل في حيط بيديه.'][Math.floor(Math.random()*3)];
}

async function _disconnectForReconnect() {
    if (!_room) { window.onlineMode = false; showScreen('online-setup-screen'); return; }
    const code = _room.code;
    if (!confirm('تحب تخرج توّة وترجع بالكود؟ بلاصتك تبقى محفوظة في الروم.')) return;
    try {
        if (typeof _voiceOn !== 'undefined' && _voiceOn) stopVoice();
        if (_channel) {
            try { await _channel.untrack(); } catch(_) {}
            _supa.removeChannel(_channel);
            _channel = null;
        }
    } catch(e) { console.error(e); }
    _stopOnlineTimer();
    _stopVotingTimer();
    document.querySelectorAll('.online-round-players').forEach(el => el.remove());
    document.getElementById('online-coup-leave-btn')?.remove();
    const codeInput = document.getElementById('room-code-input');
    if (codeInput) codeInput.value = code || '';
    _rememberLastRoom(code);
    _room = null;
    _isHost = false;
    window.onlineMode = false;
    showScreen('online-setup-screen');
    showToast('بلاصتك مازالت محفوظة. عاود ادخل بنفس الكود.');
}

async function _leaveRoom() {
    if (!_room) { window.onlineMode=false; showScreen('setup-screen'); return; }
    try {
        if (_channel) { try { await _channel.untrack(); } catch(_) {} }
        if (_isHost) { await _supa.from('rooms').delete().eq('code',_room.code); }
        else {
            await _mutatePlayers(
                _room.code,
                players => players.filter(p=>p.id!==_myId),
                room => !room.players.some(p=>p.id===_myId)
            );
        }
    } catch(e) { console.error(e); }
    if (_channel) { _supa.removeChannel(_channel); _channel=null; }
    _stopOnlineTimer();
    document.querySelectorAll('.online-round-players').forEach(el => el.remove());
    _room=null; _isHost=false; window.onlineMode=false;
    showScreen('setup-screen');
}

