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
let _serverTimeOffset = 0;
let _hasSynced = false;

async function _syncServerTime() {
    try {
        const before = performance.now();
        const { data: serverTime, error } = await _supa.rpc('get_server_time');
        if (error) throw error;
        const after = performance.now();

        // Round-trip latency
        const latency = (after - before) / 2;

        // Adjust server timestamp
        const adjustedServerTime = Number(serverTime) + latency;

        // New calculated offset
        const newOffset = adjustedServerTime - Date.now();

        // Smooth correction instead of snapping
        if (_hasSynced) {
            _serverTimeOffset = (_serverTimeOffset * 0.9) + (newOffset * 0.1);
        } else {
            _serverTimeOffset = newOffset;
            _hasSynced = true;
        }

        console.log(
            '[timer-sync]',
            'offset:', Math.round(_serverTimeOffset),
            'latency:', Math.round(latency)
        );
    } catch (e) {
        console.error('[timer-sync] failed:', e);
    }
}

// Initial sync
_syncServerTime();
// Periodic re-sync every 30 seconds
setInterval(_syncServerTime, 30000);

function _syncedNow() {
    return Date.now() + _serverTimeOffset;
}

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
let _playerPatchReconcileTimers = {};
let _lastHandledState = null;
let _movingToVoting = false, _processingVotes = false;
let _localCardRevealed = false;
let _startingOnlineGame = false;
let _onlineCoupTimer = null, _onlineCoupTimingOut = false;
let _onlineCoupFocusedPlayerId = null, _onlineCoupSummaryExpandedId = null, _lastCoupEventId = null, _lastCoupLossEventId = null, _lastCoupPendingKey = null, _lastCoupPromptId = null, _onlineCoupResponseTimer = null;
const ONLINE_COUP_RESPONSE_SECONDS = 45;
let _onlineCoupOtherDecksCollapsed = false;
let _onlineCoupResponseSync = null, _onlineCoupTurnSync = null;
const _onlineCoupActionHelp = {
    income: { title:'شهرية +1', text:'تاخو 1 فلوس من البنك. ما تتسكرش وما حد ينجم يقولك تكذب خاطرها أكشن مفتوحة.' },
    foreignAid: { title:'اعانة +2', text:'تاخو 2 فلوس من البنك. أي لاعب ينجم يقول عندو الشلغمي ويسكّرها. بعد البلوك، أي لاعب ينجم يتهمه بالتبلعيط.' },
    tax: { title:'الشلغمي +3', text:'تقول عندي الشلغمي وتاخو 3 فلوس من البنك. أي لاعب ينجم يقولك تكذب.' },
    steal: { title:'الرايس: اسرق', text:'تقول عندي الرايس وتسرق حتى زوز فلوس من لاعب. الهدف ينجم يسكّر بالرايس أو السمسار، وأي لاعب ينجم يتهم أي claim بالتبلعيط.' },
    assassinate: { title:'اغتيال -3', text:'تدفع 3 فلوس وتقول عندي حفار القبور باش تطيّح كارتة من لاعب. الهدف ينجم يسكّر بالبية، وأي لاعب ينجم يقول تكذب.' },
    exchange: { title:'السمسار: بدّل', text:'تقول عندي السمسار وتبدّل كوارطك الحيين مع الدكّة. أي لاعب ينجم يقولك تكذب.' },
    coup: { title:'Coup -7', text:'تدفع 7 فلوس وتطيّح كارتة من لاعب. ما تتسكرش وما فيهاش تكذيب.' }
};

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
function _esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function _err(msg) { const el = document.getElementById('online-setup-error'); if(el) el.innerText = msg; }
function _clearErr() { _err(''); }
function _getLang(room) { return (room.config&&room.config.lang)||'tn'; }
function _getTrans(room) { return i18n[_getLang(room)]; }
function _getRoomGameMode(room) { return ['thief','spyfall','coup','chkobba'].includes(room?.config?.gameMode) ? room.config.gameMode : 'impostor'; }
function _isThiefRoom(room) { return _getRoomGameMode(room) === 'thief'; }
function _isSpyfallRoom(room) { return _getRoomGameMode(room) === 'spyfall'; }
function _isCoupRoom(room) { return _getRoomGameMode(room) === 'coup'; }
function _isChkobbaRoom(room) { return _getRoomGameMode(room) === 'chkobba'; }

function _chkobbaMinPlayers(room) {
    const mode = room?.config?.chkobbaMode || '1v1';
    if (mode === '1v1') return 2;
    if (mode === '1v1v1') return 3;
    return 4;
}

function _lobbyMinPlayers(room) {
    if (_isChkobbaRoom(room)) return _chkobbaMinPlayers(room);
    if (_isCoupRoom(room)) return 2;
    return 3;
}
const _coupCards = {
    duke: { name:'الشلغمي', icon:'👑', img:'assets/coup/duke.png', img512:'assets/coup/duke512.png', attack:'هجوم: ياخو 3 فلوس من البنك.', defense:'دفاع: يسكّر اعانة +2 متاع أي لاعب.' },
    assassin: { name:'حفار القبور', icon:'🗡️', img:'assets/coup/assassin.png', img512:'assets/coup/assassin512.png', attack:'هجوم: يدفع 3 فلوس ويخلي لاعب يختار كارتة يخسرها.', defense:'دفاع: ما عندوش دفاع، أما claim متاعو ينجم يتكذّب.' },
    contessa: { name:'البية', icon:'💃', img:'assets/coup/contessa.png', img512:'assets/coup/contessa512.png', attack:'هجوم: ما عندهاش هجوم.', defense:'دفاع: تسكّر الاغتيال متاع حفار القبور.' },
    ambassador: { name:'السمسار', icon:'🤝', img:'assets/coup/ambassador.png', img512:'assets/coup/ambassador512.png', attack:'هجوم: يبدّل كوارطو الحيّة مع الدكّة، أو يعمل روحو بدّل.', defense:'دفاع: يسكّر سرقة الرايس.' },
    captain: { name:'الرايس', icon:'⚓', img:'assets/coup/captain.png', img512:'assets/coup/captain512.png', attack:'هجوم: يسرق حتى زوز فلوس من لاعب آخر.', defense:'دفاع: يسكّر سرقة الرايس.' }
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
    const updated = await _mutatePlayers(
        code,
        players => players.some(p => p.id === _myId)
            ? players.map(p => p.id === _myId ? {...p, ...patch} : p)
            : null,
        room => _playerHasPatch(room, _myId, patch)
    );
    _schedulePlayerPatchReconcile(code, patch);
    return updated;
}

function _schedulePlayerPatchReconcile(code, patch) {
    const key = Object.keys(patch).sort().map(k => `${k}:${patch[k]}`).join('|');
    clearTimeout(_playerPatchReconcileTimers[key]);
    _playerPatchReconcileTimers[key] = setTimeout(async () => {
        try {
            if (!_room || _room.code !== code) return;
            const fresh = await _fetchRoom(code);
            if (!fresh || ['result'].includes(fresh.state)) return;
            if (_playerHasPatch(fresh, _myId, patch)) return;
            const repaired = await _mutatePlayers(
                code,
                players => players.some(p => p.id === _myId)
                    ? players.map(p => p.id === _myId ? {...p, ...patch} : p)
                    : null,
                room => _playerHasPatch(room, _myId, patch)
            );
            if (repaired) _handleStateChange(repaired);
        } catch(e) {
            console.error(e);
        } finally {
            delete _playerPatchReconcileTimers[key];
        }
    }, 850);
}

function _clearPlayerPatchReconciles() {
    Object.values(_playerPatchReconcileTimers).forEach(timer => clearTimeout(timer));
    _playerPatchReconcileTimers = {};
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

async function _handleKickedFromLobby(room) {
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
    _clearPlayerPatchReconciles();
    _room = null;
    _isHost = false;
    window.onlineMode = false;
    showScreen('online-setup-screen');
    _err('مولى الروم خرجك من اللوبي.');
    showToast('تطردت من الروم.');
}

function _handleStateChange(room) {
    if (room?.state !== 'coup' && room?.state !== 'chkobba' && room?.state !== 'chkobba_tournament') {
        document.getElementById('coup-turn-indicator')?.classList.add('hidden');
    }
    if (window.onlineMode && room?.state === 'lobby' && room.host_id !== _myId && !(room.players || []).some(p => p.id === _myId)) {
        _handleKickedFromLobby(room);
        return;
    }
    if (typeof setGameMode === 'function') setGameMode(_getRoomGameMode(room), false);
    if (_lastHandledState !== room.state) {
        if (room.state === 'reveal' || room.state === 'lobby' || room.state === 'chkobba') {
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
        case 'chkobba':    _showOnlineChkobba(room); break;
        case 'chkobba_tournament': _showTournamentBracket(room); break;
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

async function _checkAutoJoin() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
        // Clear the URL parameter to avoid re-joining on refresh if they leave
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        const savedName = localStorage.getItem(ONLINE_NAME_KEY);
        if (savedName) {
            const nameInput = document.getElementById('online-player-name');
            const roomInput = document.getElementById('room-code-input');
            if (nameInput) nameInput.value = savedName;
            if (roomInput) roomInput.value = roomCode;

            // Wait a bit to ensure everything is initialized
            setTimeout(() => {
                _joinRoom();
            }, 800);
        } else {
            // If no name, just pre-fill the room code
            const roomInput = document.getElementById('room-code-input');
            if (roomInput) roomInput.value = roomCode;
            showScreen('online-setup-screen');
            _err('حط اسمك باش تدخل للروم');
        }
    }
}
// Initial check for auto-join
setTimeout(_checkAutoJoin, 500);

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

async function _kickLobbyPlayer(playerId) {
    if (!_isHost || !_room || _room.state !== 'lobby' || playerId === _myId) return;
    const target = (_room.players || []).find(p => p.id === playerId);
    if (!target || target.isHost) return;
    if (!confirm(`تحب تطرد ${target.name} من الروم؟`)) return;
    try {
        const updated = await _mutatePlayers(
            _room.code,
            players => players.filter(p => p.id !== playerId),
            room => !(room.players || []).some(p => p.id === playerId)
        );
        _room = updated;
        _renderLobby(updated);
        showToast(`${target.name} خرج من الروم.`);
    } catch(e) {
        console.error(e);
        showToast('ما نجّمش نطرد اللاعب، عاود جرّب.');
    }
}

function _generateQRCode(code) {
    const container = document.getElementById('qrcode-container');
    const qrEl = document.getElementById('qrcode');
    if (!container || !qrEl || typeof QRCode === 'undefined') return;

    if (qrEl.dataset.renderedCode === code) return;
    qrEl.dataset.renderedCode = code;

    qrEl.innerHTML = '';
    const url = new URL(window.location.href);
    url.searchParams.set('room', code);

    new QRCode(qrEl, {
        text: url.toString(),
        width: 160,
        height: 160,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
    });
    container.style.display = 'flex';
}

let _chkobbaDragData = null;
let _chkobbaPointerDrag = null;
let _chkobbaTableListenersBound = false;
let _chkobbaCapturePileBound = false;
let _lastChkobbaAnnounced = null;
let _chkobbaPlaySession = null;
let _chkobbaLastSnapshot = null;
let _chkobbaExpandedInfoPill = null;
let _chkobbaSkipDealAnim = false;
let _chkobbaAnimating = false;
let _chkobbaOpponentPillEls = new Map();

function _bindChkobbaCardImg(img, card) {
    const logic = window.ChkobbaLogic;
    if (!logic) return;
    if (card) logic.bindCardImage(img, card);
    else {
        img.src = logic.ASSETS.BACK;
        logic.bindCardImage(img, null);
    }
}

function _resetChkobbaPlaySession() {
    _chkobbaPlaySession?.stackEl?.remove();
    _chkobbaPlaySession = null;
    _chkobbaDragData = null;
    document.querySelectorAll('.chkobba-card.is-armed, .chkobba-card.is-selected, .chkobba-card.is-capture-candidate').forEach(el => {
        el.classList.remove('is-armed', 'is-selected', 'is-capture-candidate', 'is-invalid');
    });
    document.getElementById('chkobba-table')?.classList.remove('is-drop-target');
    document.getElementById('chkobba-my-capture-pile')?.classList.remove('is-drop-target');
    document.getElementById('chkobba-capture-ready-bar')?.remove();
}

function _hideChkobbaCaptureReadyBar() {
    document.getElementById('chkobba-capture-ready-bar')?.remove();
}

function _showChkobbaCaptureReadyBar() {
    _hideChkobbaCaptureReadyBar();
    const wrap = document.querySelector('.chkobba-table-wrap');
    if (!wrap) return;
    const bar = document.createElement('div');
    bar.id = 'chkobba-capture-ready-bar';
    bar.className = 'chkobba-capture-ready-bar';
    bar.innerHTML = `
        <p>اختارتو الكوارط — أكّدو الماكلة</p>
        <button type="button" class="primary-btn" id="chkobba-confirm-capture-btn">✅ ماكّل الكوارط</button>
    `;
    bar.querySelector('#chkobba-confirm-capture-btn').onclick = () => _commitChkobbaCapture();
    wrap.appendChild(bar);
}

function _prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function _tableCardRotation(index, cardId) {
    const hash = (cardId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return ((index * 17 + hash) % 11) - 5;
}

function _handCardTilt(index, total) {
    const mid = (total - 1) / 2;
    return (index - mid) * 4.5;
}

/** GPU-friendly card flight; calls onDone when finished (or immediately if reduced motion). */
function _animateChkobbaFlight({ fromRect, toRect, imgSrc, duration = 260, rotate = 6, withGhost = false, onDone }) {
    if (_prefersReducedMotion() || !fromRect || !toRect) {
        onDone?.();
        return;
    }
    const layer = document.getElementById('chkobba-deal-layer');
    if (!layer) { onDone?.(); return; }

    const flyer = document.createElement('div');
    flyer.className = 'chkobba-flight-card';

    // Calculate offsets based on top-left anchor
    const fx = fromRect.left + fromRect.width / 2;
    const fy = fromRect.top + fromRect.height / 2;
    const tx = toRect.left + toRect.width / 2;
    const ty = toRect.top + toRect.height / 2;

    // Start position
    flyer.style.transform = `translate3d(${fx}px, ${fy}px, 0) scale(1) rotate(${rotate}deg) translate(-50%, -50%)`;

    const img = document.createElement('img');
    img.src = imgSrc;
    flyer.appendChild(img);
    layer.appendChild(flyer);

    // Optional Ghost Trail
    let ghost;
    if (withGhost) {
        ghost = document.createElement('div');
        ghost.className = 'chkobba-ghost-trail';
        ghost.style.transform = flyer.style.transform;
        const gImg = document.createElement('img');
        gImg.src = imgSrc;
        ghost.appendChild(gImg);
        layer.appendChild(ghost);
    }

    // Trigger GPU animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const endTransform = `translate3d(${tx}px, ${ty}px, 0) scale(0.85) rotate(${rotate * 0.35}deg) translate(-50%, -50%)`;
            flyer.style.transform = endTransform;

            if (ghost) {
                // Ghost lags slightly behind visually via timing
                setTimeout(() => {
                    ghost.style.transform = endTransform;
                    ghost.style.opacity = '0';
                }, 60);
            }
        });
    });

    const finish = () => {
        flyer.remove();
        if (ghost) setTimeout(() => ghost.remove(), 500);
        onDone?.();
    };
    flyer.addEventListener('transitionend', finish, { once: true });
    // Safety fallback
    setTimeout(finish, duration + 50);
}

function _animateChkobbaFlightsSequential(flights, onDone) {
    if (!flights.length || _prefersReducedMotion()) {
        onDone?.();
        return;
    }
    let started = 0;
    let finished = 0;
    const total = flights.length;

    const startNext = () => {
        if (started >= total) return;
        const { staggerAfter, ...flightOpts } = flights[started++];

        _animateChkobbaFlight({
            ...flightOpts,
            onDone: () => {
                finished++;
                if (finished >= total) onDone?.();
            }
        });

        if (started < total) {
            setTimeout(startNext, staggerAfter || 0);
        }
    };
    startNext();
}

function _chkobbaHandCardEl(handIndex) {
    return document.querySelector(`#chkobba-my-hand .hand-card[data-index="${handIndex}"]`)
        || document.querySelectorAll('#chkobba-my-hand .hand-card')[handIndex];
}

function _renderChkobbaCard(card, opts = {}) {
    const { zone = 'table', index = 0, total = 1, interactive = false } = opts;
    const div = document.createElement('div');
    div.className = `chkobba-card ${zone === 'hand' ? 'hand-card' : 'table-card'}`;
    if (zone === 'table') div.classList.add('is-table');
    div.dataset.cardId = card.id;
    div.dataset.index = String(index);

    if (zone === 'table') {
        div.style.setProperty('--rot', `${_tableCardRotation(index, card.id)}deg`);
        if (interactive) {
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                _onChkobbaTableCardTap(div);
            });
        }
    } else {
        const tilt = _handCardTilt(index, total);
        div.style.setProperty('--tilt', `${tilt}deg`);
        div.style.setProperty('--stack-offset', `${tilt * 0.45}px`);
        div.style.setProperty('--hand-z', String(10 + index));
        if (index > 0) div.style.setProperty('--stack-overlap', '20');
        if (interactive) {
            div.draggable = true;
            div.addEventListener('dragstart', _onChkobbaDragStart);
            div.addEventListener('dragend', _onChkobbaDragEnd);
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                _armChkobbaHandCard(div);
            });
            div.addEventListener('pointerdown', () => div.classList.add('is-lifted'));
            div.addEventListener('pointerup', () => div.classList.remove('is-lifted'));
            div.addEventListener('pointercancel', () => div.classList.remove('is-lifted'));
            div.addEventListener('pointerleave', () => div.classList.remove('is-lifted'));
            _bindChkobbaPointerDrag(div);
        }
    }

    const img = document.createElement('img');
    img.alt = '';
    _bindChkobbaCardImg(img, card);
    div.appendChild(img);
    return div;
}

function _getChkobbaPlayContext() {
    if (!_room?.word_obj) return null;
    const state = _room.word_obj;
    const me = state.players.find(p => p.id === _myId);
    if (!me || state.players[state.turnIndex].id !== _myId) return null;
    return { state, me, logic: window.ChkobbaLogic };
}

function _armChkobbaHandCard(cardEl) {
    const ctx = _getChkobbaPlayContext();
    if (!ctx) return;
    const handIndex = parseInt(cardEl.dataset.index, 10);
    if (Number.isNaN(handIndex) || !ctx.me.hand[handIndex]) return;

    _resetChkobbaPlaySession();
    const playedCard = ctx.me.hand[handIndex];
    const captures = ctx.logic.getValidCaptures(playedCard, ctx.state.table);

    _chkobbaPlaySession = {
        phase: captures.length > 0 ? 'selecting' : 'armed',
        handIndex,
        playedCard,
        selectedTableIds: new Set()
    };
    _chkobbaDragData = { cardId: cardEl.dataset.cardId, index: String(handIndex) };
    cardEl.classList.add('is-armed');
    _refreshChkobbaCaptureHighlights();
    if (captures.length === 0) {
        document.getElementById('chkobba-table')?.classList.add('is-drop-target');
    }
}

function _onChkobbaTableCardTap(tableCardEl) {
    const ctx = _getChkobbaPlayContext();
    if (!ctx || !_chkobbaPlaySession) return;

    const { playedCard, selectedTableIds } = _chkobbaPlaySession;
    const cardId = tableCardEl.dataset.cardId;
    const captures = ctx.logic.getValidCaptures(playedCard, ctx.state.table);
    if (!captures.length) return;

    // Allow editing selection after a full match is ready (no floating stack on body).
    if (_chkobbaPlaySession.phase === 'readyCapture') {
        _chkobbaPlaySession.phase = 'selecting';
        delete _chkobbaPlaySession.captureSet;
        document.getElementById('chkobba-my-capture-pile')?.classList.remove('is-drop-target');
        _hideChkobbaCaptureReadyBar();
    }

    if (selectedTableIds.has(cardId)) {
        selectedTableIds.delete(cardId);
    } else {
        const trial = [...selectedTableIds, cardId];
        if (!ctx.logic.isSubsetOfSomeCapture(playedCard, ctx.state.table, trial)) {
            tableCardEl.classList.add('is-invalid');
            setTimeout(() => tableCardEl.classList.remove('is-invalid'), 400);
            return;
        }
        selectedTableIds.add(cardId);
    }

    _chkobbaPlaySession.phase = 'selecting';
    _refreshChkobbaCaptureHighlights();

    const match = ctx.logic.findMatchingCapture(playedCard, ctx.state.table, selectedTableIds);
    if (match) {
        _chkobbaPlaySession.phase = 'readyCapture';
        _chkobbaPlaySession.captureSet = match;
        document.getElementById('chkobba-my-capture-pile')?.classList.add('is-drop-target');
        _showChkobbaCaptureReadyBar();
    }
}

function _refreshChkobbaCaptureHighlights() {
    const ctx = _getChkobbaPlayContext();
    if (!ctx || !_chkobbaPlaySession) return;
    const { playedCard, selectedTableIds } = _chkobbaPlaySession;
    const captures = ctx.logic.getValidCaptures(playedCard, ctx.state.table);
    const candidateIds = new Set();
    captures.forEach(set => set.forEach(c => candidateIds.add(c.id)));

    document.querySelectorAll('#chkobba-table .table-card').forEach(el => {
        el.classList.remove('is-capture-candidate', 'is-selected', 'is-invalid');
        const id = el.dataset.cardId;
        if (selectedTableIds.has(id)) el.classList.add('is-selected');
        else if (candidateIds.has(id)) el.classList.add('is-capture-candidate');
    });
}

function _ensureChkobbaTableListeners() {
    const tableCont = document.getElementById('chkobba-table');
    if (!tableCont || _chkobbaTableListenersBound) return;
    _chkobbaTableListenersBound = true;
    tableCont.addEventListener('dragover', e => {
        if (!_chkobbaPlaySession) return;
        e.preventDefault();
        if (_chkobbaPlaySession.phase === 'armed') tableCont.classList.add('is-drop-target');
    });
    tableCont.addEventListener('dragleave', e => {
        if (!tableCont.contains(e.relatedTarget)) tableCont.classList.remove('is-drop-target');
    });
    tableCont.addEventListener('drop', _onChkobbaTableDrop);
    tableCont.addEventListener('click', (e) => {
        if (_chkobbaPlaySession?.phase === 'armed' && !e.target.closest('.table-card')) {
            _commitChkobbaPlayToTable();
        }
    });

    const capPile = document.getElementById('chkobba-my-capture-pile');
    if (capPile && !_chkobbaCapturePileBound) {
        _chkobbaCapturePileBound = true;
        capPile.addEventListener('dragover', e => {
            if (_chkobbaPlaySession?.phase === 'readyCapture') {
                e.preventDefault();
                capPile.classList.add('is-drop-target');
            }
        });
        capPile.addEventListener('dragleave', () => capPile.classList.remove('is-drop-target'));
        capPile.addEventListener('drop', e => {
            e.preventDefault();
            _commitChkobbaCapture();
        });
        capPile.addEventListener('click', () => {
            if (_chkobbaPlaySession?.phase === 'readyCapture') _commitChkobbaCapture();
        });
    }
}

function _bindChkobbaPointerDrag(cardEl) {
    cardEl.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        _onChkobbaPointerDown(e);
    });
}

function _onChkobbaPointerDown(e) {
    const cardEl = e.currentTarget;
    if (!cardEl.classList.contains('hand-card')) return;
    const rect = cardEl.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    _chkobbaPointerDrag = {
        cardEl,
        pointerId: e.pointerId,
        startX,
        startY,
        offsetX: e.clientX - rect.left - rect.width / 2,
        offsetY: e.clientY - rect.top - rect.height / 2,
        ghost: null,
        moved: false
    };

    const move = (ev) => {
        if (!_chkobbaPointerDrag) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!moved && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
            moved = true;
            _chkobbaPointerDrag.moved = true;
            if (!_chkobbaPlaySession) _armChkobbaHandCard(cardEl);
            const img = cardEl.querySelector('img');
            const ghost = document.createElement('div');
            ghost.className = 'chkobba-drag-ghost';
            const ghostImg = document.createElement('img');
            ghostImg.src = img?.src || '';
            ghost.appendChild(ghostImg);
            document.body.appendChild(ghost);
            _chkobbaPointerDrag.ghost = ghost;
            cardEl.classList.add('is-dragging');
        }
        if (moved) _onChkobbaPointerMove(ev);
    };

    const up = (ev) => {
        cardEl.removeEventListener('pointermove', move);
        cardEl.removeEventListener('pointerup', up);
        cardEl.removeEventListener('pointercancel', up);
        _onChkobbaPointerUp(ev, moved);
    };

    cardEl.addEventListener('pointermove', move);
    cardEl.addEventListener('pointerup', up);
    cardEl.addEventListener('pointercancel', up);
    e.preventDefault();
}

function _onChkobbaPointerMove(e) {
    if (!_chkobbaPointerDrag || e.pointerId !== _chkobbaPointerDrag.pointerId) return;
    const { ghost, offsetX, offsetY, moved } = _chkobbaPointerDrag;
    if (!moved || !ghost) return;

    const tilt = (e.clientX - (ghost._lastX || e.clientX)) * 0.15;
    ghost._lastX = e.clientX;
    ghost.style.left = `${e.clientX - offsetX}px`;
    ghost.style.top = `${e.clientY - offsetY}px`;
    ghost.style.setProperty('--ghost-tilt', `${Math.max(-12, Math.min(12, tilt))}deg`);

    const cap = document.getElementById('chkobba-my-capture-pile');
    const under = document.elementFromPoint(e.clientX, e.clientY);
    if (_chkobbaPlaySession?.phase === 'readyCapture' && cap && (cap === under || cap.contains(under))) {
        cap.classList.add('is-drop-target');
    } else {
        cap?.classList.remove('is-drop-target');
    }

    if (_chkobbaPlaySession?.phase === 'armed') {
        const table = document.getElementById('chkobba-table');
        if (table && (table.contains(under) || under === table)) table.classList.add('is-drop-target');
        else table?.classList.remove('is-drop-target');
    }
}

async function _onChkobbaPointerUp(e, moved) {
    if (!_chkobbaPointerDrag) return;
    const { cardEl, ghost, pointerId } = _chkobbaPointerDrag;
    if (e.pointerId !== pointerId) return;

    ghost?.remove();
    cardEl.classList.remove('is-dragging');
    document.getElementById('chkobba-table')?.classList.remove('is-drop-target');
    document.getElementById('chkobba-my-capture-pile')?.classList.remove('is-drop-target');

    const target = document.elementFromPoint(e.clientX, e.clientY);

    if (!moved) {
        if (cardEl.classList.contains('hand-card')) _armChkobbaHandCard(cardEl);
        _chkobbaPointerDrag = null;
        return;
    }

    if (_chkobbaPlaySession?.phase === 'readyCapture') {
        if (target?.closest?.('#chkobba-my-capture-pile')) await _commitChkobbaCapture();
    } else if (_chkobbaPlaySession?.phase === 'armed') {
        if (target?.closest?.('#chkobba-table') && !target?.closest?.('.table-card')) {
            await _commitChkobbaPlayToTable();
        }
    } else if (_chkobbaPlaySession?.phase === 'selecting') {
        const tableCard = target?.closest?.('.table-card');
        if (tableCard) _onChkobbaTableCardTap(tableCard);
    }

    _chkobbaPointerDrag = null;
}

function _renderLobby(room) {
    const cur = document.querySelector('.screen.active');
    if (cur && !['online-lobby-screen','online-setup-screen'].includes(cur.id)) showScreen('online-lobby-screen');
    else showScreen('online-lobby-screen');

    document.getElementById('display-room-code').innerText = room.code;
    _generateQRCode(room.code);
    const list = document.getElementById('lobby-players-list');
    list.innerHTML = '';
    const frag = document.createDocumentFragment();
    room.players.forEach(p => {
        const online = _playerOnline(p);
        const div = document.createElement('div');
        div.className = 'lobby-item' + (online ? '' : ' player-offline');
        const isMe = p.id === _myId;
        div.innerHTML = (p.isHost ? '👑 ' : '👤 ') + _esc(p.name) +
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
        if (_isHost && !isMe && !p.isHost) {
            const kickBtn = document.createElement('button');
            kickBtn.className = 'lobby-kick-btn';
            kickBtn.type = 'button';
            kickBtn.textContent = 'طرد';
            kickBtn.addEventListener('click', e => {
                e.stopPropagation();
                _kickLobbyPlayer(p.id);
            });
            div.appendChild(kickBtn);
        }
        frag.appendChild(div);
    });
    list.appendChild(frag);
    const n = room.players.length;
    const startBtn = document.getElementById('online-start-btn');
    const waitMsg  = document.getElementById('lobby-wait-msg');

    // Remove stale settings UI before re-rendering
    document.getElementById('lobby-settings-btn')?.remove();
    document.getElementById('lobby-settings-panel')?.remove();

    if (_isHost) {
        startBtn.classList.remove('hidden');
        const minPlayers = _lobbyMinPlayers(room);
        if (n < minPlayers) { startBtn.disabled = true; startBtn.style.opacity = '0.5'; waitMsg.innerText = `⏳ نستنا لاعبين... (${n}/${minPlayers} على الأقل)`; }
        else { startBtn.disabled = false; startBtn.style.opacity = ''; waitMsg.innerText = `✅ ${n} لاعبين — يمكن تبدأ!`; }
        startBtn.innerText = _isChkobbaRoom(room) ? '🚀 ابدا الشكبّة' : _isCoupRoom(room) ? '🚀 ابدا كول وبوّع' : _isThiefRoom(room) ? '🚀 وزّع كوارط سارق حاكم جلاد' : _isSpyfallRoom(room) ? '🚀 وزّع كوارط ماناش هوني' : '🚀 ابدأ اللعبة';
        if (_isChkobbaRoom(room)) {
            _renderChkobbaLobbySettings(startBtn, room);
            return;
        }
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

    const frag = document.createDocumentFragment();
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
        chip.innerHTML = `${p.isHost ? '👑' : status} <span>${_esc(p.name)}</span>${p.id===_myId?' <span class="you-tag">أنا</span>':''}${_playerFigured(p)?'<span class="figured-badge">🎯</span>':''}`;
        frag.appendChild(chip);
    });
    list.appendChild(frag);

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
    } catch(e) {
        console.error(e);
        delete _localPlayerDesired.askedQuestion;
        showToast('السؤال ما تسجّلش، تنجم تعاود.');
    }
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
    if (!_isHost||!_room || _startingOnlineGame) return;
    _startingOnlineGame = true;
    const startBtn = document.getElementById('online-start-btn');
    if (startBtn) startBtn.disabled = true;
    try {
    if (_isChkobbaRoom(_room)) {
        if (_room.config?.chkobbaTournament) { await _startTournament(_room); }
        else { await _startOnlineChkobbaGame(); }
        return;
    }
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
    } finally {
        _startingOnlineGame = false;
        if (startBtn) startBtn.disabled = false;
    }
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
        revision:0,
        turnIndex: Math.floor(Math.random() * allP.length),
        pending:null,
        actionMinutes,
        turnEndsAt:_syncedNow() + actionMinutes * 60000,
        bankCoins:50 - (allP.length * 2),
        log:'كل واحد بدا بزوز فلوس وزوز كوارط. التبلعيط محلول، أما "تكذب!" تستنى.',
        players: allP.map(p=>({
            id:p.id,
            name:p.name,
            coins:2,
            hand:[{type:deck.pop(),lost:false},{type:deck.pop(),lost:false}], lastAction: null
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
            : `<strong style="font-size:1.45rem">📍 ${_esc(me.locationName)}</strong><br><br><span style="font-size:16px;">دورك: ${_esc(me.locationRole || 'حريف')}</span>`;
    } else {
        roleText = me.isImpostor
            ? (noHints ? trans.impostor_role : `${trans.impostor_role}<br><br><span style="font-size:16px;">${trans.hint_label}</span><br>${_esc(me.customHint)}`)
            : `${trans.citizen_role}<br><br><span style="font-size:16px;">${trans.word_label}</span><br>${_esc(room.word_obj.word)}`;
    }
    const card = document.createElement('div'); card.className = 'flip-card';
    card.innerHTML = `<div class="card-face card-front"><span>${trans.card_of}${_esc(me.name)}</span></div>
                      <div class="card-face card-back"><span>${roleText}</span></div>`;
    const seenBtn = document.getElementById('online-seen-btn');
    const showCard = e => { e.preventDefault(); card.classList.add('flipped'); _sfx.cardFlip(); };
    const hideCard = e => { e.preventDefault(); if(!card.classList.contains('flipped')) return; card.classList.remove('flipped'); _localCardRevealed = true; seenBtn.classList.remove('hidden'); };
    card.addEventListener('pointerdown', showCard);
    card.addEventListener('pointerup', hideCard);
    card.addEventListener('pointerleave', hideCard);
    card.addEventListener('pointercancel', hideCard);
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
    catch(e) {
        console.error(e);
        delete _localPlayerDesired.hasSeenCard;
        document.getElementById('online-seen-btn')?.classList.remove('hidden');
        showToast('ما تسجّلش، عاود اضغط شفت كارطتي.');
    }
}

function _renderCardWaiting(room) {
    _renderOnlineRoundPlayers(room, 'online-card-screen');
    const container = document.getElementById('online-card-container');
    container.classList.add('online-card-done-compact');
    container.innerHTML = '<div class="card-done-badge">✅</div>';
    const zone = document.getElementById('online-waiting-zone'); zone.classList.remove('hidden');
    const statusEl = document.getElementById('online-seen-status'); statusEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    room.players.filter(p=>!p.eliminated).forEach(p=>{
        const online = _playerOnline(p);
        const div = document.createElement('div'); div.className = 'seen-status-item' + (online ? '' : ' player-offline');
        div.textContent = (online ? (p.hasSeenCard?'✅ ':'⏳ ') : '○ ') + (p.name || '');
        frag.appendChild(div);
    });
    statusEl.appendChild(frag);
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
    const timerEndAt = new Date(_syncedNow() + seconds * 1000).toISOString();
    const alive = _room.players.filter(p=>!p.eliminated);
    const starter = alive[Math.floor(Math.random()*alive.length)];
    try { await _update(_room.code,{state:'discussion',starter_player:starter.name,timer_end_at:timerEndAt}); }
    catch(e) { console.error(e); }
}

function _timerNow() {
    return _syncedNow();
}

function _stopOnlineTimer() {
    if (_onlineTimer) { clearInterval(_onlineTimer); _onlineTimer = null; }
    if (_onlineCoupResponseTimer) { clearInterval(_onlineCoupResponseTimer); _onlineCoupResponseTimer = null; }
    if (_timerSyncTicker) { clearInterval(_timerSyncTicker); _timerSyncTicker = null; }
    if (_onlineCoupTimer) { clearInterval(_onlineCoupTimer); _onlineCoupTimer = null; }
    _lastOnlineTimerSecond = null;
}

function _stopVotingTimer() {
    if (_votingTimer) { clearInterval(_votingTimer); _votingTimer = null; }
    if (_votingSyncTicker) { clearInterval(_votingSyncTicker); _votingSyncTicker = null; }
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
    const endAt = new Date(room.timer_end_at || _syncedNow() + 60000).getTime();
    if (!Number.isFinite(endAt)) return 60;
    return Math.max(0, Math.ceil((endAt - _syncedNow()) / 1000));
}

function _broadcastVotingTimerSync(room) {
    if (!_isHost || !_channel || !room || room.state !== 'voting') return;
    const payload = { phase:'voting', timerEndAt: room.timer_end_at, left: _votingSecondsLeftForRoom(room) };
    const sent = _channel.send({ type:'broadcast', event:'timer-sync', payload });
    if (sent && typeof sent.catch === 'function') sent.catch(() => {});
}

function _secondsLeftForRoom(room) {
    const endTime = new Date(room.timer_end_at).getTime();
    if (!Number.isFinite(endTime)) return 0;
    return Math.max(0, Math.ceil((endTime - _syncedNow()) / 1000));
}

function _broadcastTimerSync(room) {
    if (!_isHost || !_channel || !room || room.state !== 'discussion') return;
    const payload = { phase:'discussion', timerEndAt: room.timer_end_at, left: _hostSecondsLeft(room) };
    const sent = _channel.send({ type:'broadcast', event:'timer-sync', payload });
    if (sent && typeof sent.catch === 'function') sent.catch(() => {});
}

function _handleTimerSync(payload) {
    if (_isHost || !_room || !payload) return;
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
        const votingEndAt = new Date(_syncedNow() + 60 * 1000).toISOString();
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
    const frag = document.createDocumentFragment();
    room.players.filter(p=>!p.eliminated).forEach(player=>{
        if (_isThiefRoom(room) && player.role === 'judge') return;
        const btn = document.createElement('button'); btn.className = 'vote-item';
        const vc = room.players.filter(p=>p.vote===player.id).length;
        btn.innerHTML = (_isThiefRoom(room) ? '⚖️ ' : _isSpyfallRoom(room) ? '🕶️ ' : '🗳️ ') + _esc(player.name) + (vc>0?` <span class="vote-count">(${vc})</span>`:'');
        if (_isThiefRoom(room) && me?.role !== 'judge') { btn.disabled = true; btn.title = 'نستناو الحاكم يحكم'; }
        else if (hasVoted) { btn.disabled=true; if(me.vote===player.id) btn.classList.add('my-vote'); }
        else if (player.id===_myId) { btn.disabled=true; btn.title='ما تنجمش تصوت على روحك'; }
        else { btn.addEventListener('click',()=>_castVote(player.id)); }
        frag.appendChild(btn);
    });
    list.appendChild(frag);
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
    } catch(e) {
        console.error(e);
        delete _localPlayerDesired.vote;
        showToast('التصويت ما تسجّلش، عاود جرّب.');
        if (_room) _showOnlineVoting(_room);
    }
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
        revealBox.innerHTML = `السارق: <strong style="color:var(--primary-color)">${_esc(thief?.name || '?')}</strong><br>الحاكم: <strong>${_esc(judge?.name || '?')}</strong><br>الجلّاد: <strong>${_esc(executioner?.name || '?')}</strong>`;
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
        revealBox.innerHTML = `الspy: <strong style="color:var(--primary-color)">${_esc(spy?.name || '?')}</strong><br>البلاصة: <strong>${_esc(result.locationName || spy?.locationName || '?')}</strong>`;
        if (_isHost) { nextBtn.innerText='🔄 عاود انده'; nextBtn.disabled=false; nextBtn.onclick=()=>_resetToLobby(); }
        else { nextBtn.innerText='⏳ نستناو مولى الروم...'; nextBtn.disabled=true; }
        return;
    }
    const voted = room.players.find(p=>p.id===result.votedPlayerId);
    const name = voted?voted.name:'?';
    const allImps = room.players.filter(p=>p.isImpostor).map(p=>_esc(p.name)).join(' و ');
    const wordLine = `${trans.word_was} <strong>${room.word_obj?_esc(room.word_obj.word):'?'}</strong>`;
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
    const seconds = 60, timerEndAt = new Date(_syncedNow() + seconds * 1000).toISOString();
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

function _renderOnlineCoupPlayersSummary(state) {
    const wrapper = document.createElement("div");
    wrapper.className = "coup-summary-wrapper";

    const container = document.createElement("div");
    container.className = "coup-pills-container";
    
    const leftInd = document.createElement("div");
    leftInd.className = "scroll-indicator left";
    leftInd.innerHTML = "◀";
    const rightInd = document.createElement("div");
    rightInd.className = "scroll-indicator right";
    rightInd.innerHTML = "▶";

    // Only other players
    const others = state.players.filter(p => p.id !== _myId);
    others.forEach(p => {
        const isDead = !p.hand.some(c => !c.lost);
        const isTurn = state.players[state.turnIndex || 0]?.id === p.id;
        const pill = document.createElement("div");
        pill.className = `coup-player-pill ${isDead ? "is-dead" : ""} ${isTurn ? "is-turn" : ""}`;
        
        const dots = p.hand.map(c => `<span class="pill-dot ${!c.lost ? "active" : ""}"></span>`).join("");
        const skull = isDead ? "💀 " : "";
        
        pill.innerHTML = `
            <div class="pill-influence-dots">${dots}</div>
            <div class="pill-coins">🪙 ${p.coins}</div>
            <div class="pill-name">${skull}${_esc(p.name)}</div>
        `;
        
        pill.onclick = () => {
            _onlineCoupSummaryExpandedId = _onlineCoupSummaryExpandedId === p.id ? null : p.id;
            _showOnlineCoup(_room);
        };
        container.appendChild(pill);
    });

    const updateIndicators = () => {
        const buffer = 5;
        leftInd.classList.toggle("visible", container.scrollLeft > buffer);
        rightInd.classList.toggle("visible", container.scrollLeft < (container.scrollWidth - container.clientWidth - buffer));
    };
    
    container.onscroll = updateIndicators;
    setTimeout(updateIndicators, 100);

    wrapper.appendChild(leftInd);
    wrapper.appendChild(container);
    wrapper.appendChild(rightInd);

    // Expanded Panel
    if (_onlineCoupSummaryExpandedId) {
        const expPlayer = state.players.find(p => p.id === _onlineCoupSummaryExpandedId);
        if (expPlayer) {
            const panel = document.createElement("div");
            panel.className = "coup-detail-panel";
            
            const closeBtn = document.createElement("div");
            closeBtn.className = "detail-close-btn";
            closeBtn.innerHTML = "×";
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                _onlineCoupSummaryExpandedId = null;
                _showOnlineCoup(_room);
            };

            const liveCount = expPlayer.hand.filter(c => !c.lost).length;
            const lastMoveText = expPlayer.lastAction ? `آخر حركة: ${expPlayer.lastAction}` : "مازال ما عمل حتى حركة";
            
            panel.innerHTML = `
                <div class="detail-info">
                    <div class="detail-name-row"><span class="detail-name">${_esc(expPlayer.name)}</span></div>
                    <div class="detail-stats"><span>🪙 ${expPlayer.coins} فلوس</span><span>🃏 ${liveCount} كوارط</span></div>
                    <div class="detail-last-move">${lastMoveText}</div>
                </div>
                <div class="detail-profile-wrap"><span class="detail-profile-img">👤</span></div>
            `;
            panel.prepend(closeBtn);
            wrapper.appendChild(panel);
        }
    }

    return wrapper;
}

function _onlineCoupAlive(state) {
    return (state?.players || []).filter(p => p.hand.some(c=>!c.lost));
}

function _onlineCoupActionMinutes(state) {
    return Math.max(1, Math.min(5, parseInt(state?.actionMinutes || _room?.config?.actionTimer || 1, 10) || 1));
}

function _onlineCoupSetDeadline(state) {
    state.turnEndsAt = _syncedNow() + _onlineCoupActionMinutes(state) * 60000;
}

function _onlineCoupTakeFromBank(state, amount) {
    if (!state || !Number.isFinite(state.bankCoins)) return;
    state.bankCoins = Math.max(0, state.bankCoins - Math.max(0, amount || 0));
}

function _onlineCoupPayBank(state, amount) {
    if (!state || !Number.isFinite(state.bankCoins)) return;
    state.bankCoins += Math.max(0, amount || 0);
}

function _onlineCoupResourceHtml(state) {
    const bank = Number.isFinite(state?.bankCoins) ? state.bankCoins : '∞';
    return `<span>🏦 البنك <strong>${bank}</strong></span><span>🂠 الدكّة <strong>${state?.deck?.length || 0}</strong></span>`;
}

function _onlineCoupStatusHtml(state) {
    const alive = _onlineCoupAlive(state);
    const esc = window.CoupUI?.escapeHtml || (x => x);
    const current = state.players[state.turnIndex || 0];
    if (alive.length <= 1) return `<span class="coup-status-line">🏆 <bdi>${esc(alive[0]?.name || '')}</bdi> ربح الطرح!</span>`;
    if (state.pendingLoss) return `<span class="coup-status-line">${esc(state.log || '')}</span>`;
    if (state.pending) return `<span class="coup-status-line">${esc(state.log || '')}</span>`;
    return `<span class="coup-status-line">الدور على <bdi>${esc(current?.name || '?')}.</bdi></span>${state.log ? `<span class="coup-status-line">${esc(state.log)}</span>` : ''}`;
}

function _onlineCoupTimerHtml(left) {
    const fmt = window.CoupUI?.formatSeconds || (s => `00:${String(Math.max(0,s)).padStart(2,'0')}`);
    return `<span>وقت الدور</span><strong>${fmt(left)}</strong>`;
}

function _onlineCoupProveAndReplace(state, player, role) {
    const idx = player?.hand?.findIndex(c => !c.lost && c.type === role);
    if (idx < 0) return;
    state.deck.unshift(role);
    state.deck.sort(()=>0.5-Math.random());
    player.hand[idx] = { type: state.deck.pop() || role, lost:false };
}

function _onlineCoupResumeBlockNext(pending, actorName) {
    return {
        type:'resumeBlock',
        pending:{...pending, claim:null, challengeClosed:true, passes:[], hostSynced:false},
        log:`${actorName} ورّى الكارتة الصحيحة. مازال تنجم تتسكر كان عندكم الكارتة المناسبة.`
    };
}

function _onlineCoupSetResponseDeadline(pending) {
    pending.expiresAt = _syncedNow() + ONLINE_COUP_RESPONSE_SECONDS * 1000;
}

function _onlineCoupBlockRoleLabel(role) {
    const meta = _coupCards[role] || _coupCards.duke;
    return `${meta.icon} ${meta.name}`;
}

function _onlineCoupBlockOptions(pending) {
    return (pending?.blockRoles || []).map(role => ({ role, label:_onlineCoupBlockRoleLabel(role) }));
}

function _onlineCoupPendingClaimantId(pending) {
    return pending?.stage === 'block' ? pending.blockerId : pending?.actorId;
}

function _onlineCoupPendingResponders(state, pending = state?.pending) {
    const claimantId = _onlineCoupPendingClaimantId(pending);
    return _onlineCoupAlive(state).filter(p => p.id !== claimantId);
}

function _onlineCoupPassCount(state, pending = state?.pending) {
    const passes = new Set(pending?.passes || []);
    return _onlineCoupPendingResponders(state, pending).filter(p => passes.has(p.id)).length;
}

function _onlineCoupAllPassed(state, pending = state?.pending) {
    const responders = _onlineCoupPendingResponders(state, pending);
    return responders.length > 0 && _onlineCoupPassCount(state, pending) >= responders.length;
}

function _onlineCoupPendingTimerHtml(p) {
    const left = Math.max(0, Math.ceil(((p.expiresAt || 0) - _syncedNow()) / 1000));
    return `<div class="coup-decision-timer">وقت القرار <strong class="coup-pending-countdown" data-deadline="${p.expiresAt || 0}" data-pending-id="${p.id || ''}">${left}s</strong></div>`;
}

function _onlineCoupTickResponseCountdown() {
    document.querySelectorAll('.coup-pending-countdown').forEach(node => {
        const pendingId = node.dataset.pendingId || '';
        let left;
        if (!_isHost && _onlineCoupResponseSync && _onlineCoupResponseSync.id === pendingId) {
            left = Math.max(0, Math.ceil(_onlineCoupResponseSync.left - ((_timerNow() - _onlineCoupResponseSync.receivedAt) / 1000)));
        } else {
            left = Math.max(0, Math.ceil((parseInt(node.dataset.deadline, 10) - _syncedNow()) / 1000));
        }
        node.textContent = `${left}s`;
        node.classList.toggle('urgent', left <= 10);
    });
}

function _onlineCoupTurnSecondsLeft(state) {
    return Math.max(0, Math.ceil(((state.turnEndsAt || _syncedNow()) - _syncedNow()) / 1000));
}

function _onlineCoupEvent(state, text, kind = 'notice', extra = {}) {
    state.lastEvent = { id:`${Date.now()}_${Math.random().toString(36).slice(2,6)}`, text, kind, ...extra };
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

function _onlineCoupLiveCards(player) {
    return player?.hand?.map((card, index) => ({card, index})).filter(x => !x.card.lost) || [];
}

function _onlineCoupContinueAfterLoss(state, next = { type:'nextTurn' }) {
    state.pendingLoss = null;
    if (_onlineCoupAlive(state).length <= 1) {
        state.pending = null;
        state.pendingExchange = null;
        return state;
    }
    if (next.type === 'applyAction') {
        return _onlineCoupApplyActionLocal(state, next.action, next.targetId);
    }
    if (next.type === 'resumeBlock') {
        state.pending = {
            ...(next.pending || {}),
            id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
            passes:[]
        };
        _onlineCoupSetResponseDeadline(state.pending);
        state.log = next.log || 'مازال تنجم تتسكر الأكشن.';
        _onlineCoupEvent(state, state.log, 'notice');
        return state;
    }
    _onlineCoupNextTurn(state);
    return state;
}

function _onlineCoupRequestLoss(state, playerId, reason = '', next = { type:'nextTurn' }) {
    const p = state.players.find(x=>x.id===playerId);
    const live = _onlineCoupLiveCards(p);
    if (!live.length) return false;
    state.pending = null;
    if (live.length === 1) {
        _onlineCoupMarkLoss(state, playerId, live[0].index);
        _onlineCoupContinueAfterLoss(state, next);
        return true;
    }
    state.pendingLoss = { id:`loss_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, playerId, reason, next };
    return true;
}

function _onlineCoupMarkLoss(state, playerId, cardIndex) {
    const p = state.players.find(x=>x.id===playerId);
    const card = p?.hand?.[cardIndex];
    if (!p || !card || card.lost) return false;
    card.lost = true;
    const meta = _coupCards[card.type] || _coupCards.duke;
    const out = !p.hand.some(c=>!c.lost);
    const lossEvent = {
        id:`loss_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        eventType:'card-loss',
        playerName:p.name,
        cardType:card.type,
        cardName:meta.name,
        out
    };
    state.lastLossEvent = lossEvent;
    _onlineCoupEvent(state, out ? `${p.name} خسر ${meta.name} وخرج من الطرح` : `${p.name} خسر ${meta.name}`, 'bad', lossEvent);
    return true;
}

function _onlineCoupRequestExchange(state, playerId) {
    const player = state.players.find(x => x.id === playerId);
    const live = player?.hand?.map((card, index) => ({card, index})).filter(x => !x.card.lost) || [];
    if (!player || !live.length) return false;
    const drawn = [state.deck.pop(), state.deck.pop()].filter(Boolean).map(type => ({ type, drawn:true }));
    state.pending = null;
    state.pendingExchange = {
        id:`ex_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        playerId,
        keep:live.length,
        pool:[...live.map(x => ({ type:x.card.type, handIndex:x.index })), ...drawn]
    };
    state.log = `${player.name} يشوف زوز كوارط من الدكّة ويختار شنوّة يخلي.`;
    _onlineCoupEvent(state, state.log, 'notice');
    return true;
}

function _onlineCoupActionName(action) {
    return {income:'شهرية',foreignAid:'اعانة',tax:'ضريبة الشلغمي',assassinate:'اغتيال',exchange:'تبديل السمسار',steal:'سرقة الرايس',coup:'Coup'}[action] || action;
}

function _startOnlineCoupTimer(state) {
    clearInterval(_onlineCoupTimer);
    clearInterval(_onlineCoupResponseTimer);
    const timerEl = document.getElementById('coup-action-timer');
    if (!timerEl || !state) return;
    const tick = () => {
        const left = _onlineCoupTurnSecondsLeft(state);
        timerEl.innerHTML = _onlineCoupTimerHtml(left);
        timerEl.classList.toggle('urgent', left <= 10);
        if (left <= 0 && !state.pending && !state.pendingLoss && !state.pendingExchange && !_onlineCoupTimingOut && _onlineCoupAlive(state).length > 1 && _isHost) {
            _onlineCoupTimeout();
        }
    };
    tick();
    _onlineCoupTimer = setInterval(tick, 500);
    if (state.pending?.expiresAt) {
        const responseTick = () => {
            _onlineCoupTickResponseCountdown();
            if (_syncedNow() < state.pending.expiresAt || _onlineCoupTimingOut) return;
            if (_isHost) _onlineCoupPendingTimeout();
        };
        responseTick();
        _onlineCoupResponseTimer = setInterval(responseTick, 500);
    }
}

async function _onlineCoupPendingTimeout() {
    if (!_room?.word_obj || _onlineCoupTimingOut) return;
    _onlineCoupTimingOut = true;
    try {
        await _onlineCoupMutateState(async state => {
            const p = state.pending;
            if (!p || !p.expiresAt || _syncedNow() < p.expiresAt) return null;
            if (p.stage === 'block') {
                state.log = `${state.players.find(x=>x.id===p.blockerId)?.name || ''} سكّر الأكشن. تعدّت بسلام.`;
                state.pending = null;
                _onlineCoupEvent(state, state.log, 'good');
                _onlineCoupNextTurn(state);
                return state;
            }
            state.pending = null;
            return _onlineCoupApplyActionLocal(state, p.action, p.targetId);
        });
    } catch(e) { console.error(e); }
    finally { _onlineCoupTimingOut = false; }
}

async function _onlineCoupTimeout() {
    if (!_room?.word_obj || _onlineCoupTimingOut) return;
    _onlineCoupTimingOut = true;
    try {
        await _onlineCoupMutateState(async state => {
            if (state.pending || state.pendingLoss || state.pendingExchange || Math.ceil(((state.turnEndsAt || _syncedNow()) - _syncedNow()) / 1000) > 0) return null;
            const actor = state.players[state.turnIndex || 0];
            if (actor?.hand?.some(c=>!c.lost)) {
                actor.coins += 1;
                _onlineCoupTakeFromBank(state, 1);
                state.log = `${actor.name} فات الوقت، خذا شهرية +1 وعدّى الدور.`;
                _onlineCoupEvent(state, 'الوقت وفى، تعدّى الدور', 'notice');
            }
            _onlineCoupNextTurn(state);
            return state;
        });
    } catch(e) { console.error(e); }
    finally { _onlineCoupTimingOut = false; }
}

let _coupWinnerAnnounced = false;

function _showOnlineCoup(room) {
    _stopOnlineTimer();
    _stopVotingTimer();
    showScreen('coup-screen');

    const state = room.word_obj;
    if (!state) return;

    const alive = _onlineCoupAlive(state);
    if (alive.length === 1 && !_coupWinnerAnnounced) {
        _coupWinnerAnnounced = true;
        window.triggerWinnerAnnouncement(alive[0].name);
    } else if (alive.length > 1) {
        _coupWinnerAnnounced = false;
    }

    const indicator = document.getElementById('coup-turn-indicator');
    if (indicator) {
        indicator.classList.remove('hidden');
        const nameEl = document.getElementById('cti-player-name');
        if (nameEl) {
            const currentPlayer = state.players[state.turnIndex || 0];
            nameEl.innerText = currentPlayer?.name || '...';
        }
    }
    if (state.pending && !state.pending.expiresAt) {
        state.pending.expiresAt = _syncedNow() + ONLINE_COUP_RESPONSE_SECONDS * 1000;
    }
    const activePromptId = state.pending?.id || state.pendingLoss?.id || state.pendingExchange?.id || null;
    if (activePromptId !== _lastCoupPromptId) {
        window.CoupUI?.closeModal?.();
        _lastCoupPendingKey = null;
        _lastCoupPromptId = activePromptId;
    }
    if (!activePromptId) window.CoupUI?.closeModal?.();
    if (_isHost && state.pendingLoss) {
        const lossId = state.pendingLoss.id;
        const loser = state.players.find(p => p.id === state.pendingLoss.playerId);
        if (_onlineCoupLiveCards(loser).length <= 1) {
            _onlineCoupMutateState(async fresh => {
                const loss = fresh.pendingLoss;
                if (!loss || loss.id !== lossId) return null;
                const player = fresh.players.find(p => p.id === loss.playerId);
                const live = _onlineCoupLiveCards(player);
                if (!live.length) { fresh.pendingLoss = null; return fresh; }
                _onlineCoupMarkLoss(fresh, loss.playerId, live[0].index);
                _onlineCoupContinueAfterLoss(fresh, loss.next || { type:'nextTurn' });
                return fresh;
            });
            return;
        }
    }
    const current = state.players[state.turnIndex || 0];
    const me = state.players.find(p=>p.id===_myId);
    document.getElementById('coup-deck-pill').innerHTML = _onlineCoupResourceHtml(state);
    document.getElementById('coup-status').innerHTML = _onlineCoupStatusHtml(state);
    _startOnlineCoupTimer(state);
    if (state.lastEvent?.id && state.lastEvent.id !== _lastCoupEventId) {
        _lastCoupEventId = state.lastEvent.id;
        window.CoupUI?.showEvent?.(state.lastEvent.text, state.lastEvent.kind);
        if (state.lastEvent.triggerNotLying) {
            window.triggerNotLyingAnimation(state.lastEvent.triggerNotLying);
        }
    }
    if (state.lastLossEvent?.id && state.lastLossEvent.id !== _lastCoupLossEventId) {
        _lastCoupLossEventId = state.lastLossEvent.id;
        const meta = _coupCards[state.lastLossEvent.cardType] || { name:state.lastLossEvent.cardName, icon:'🂠' };
        window.CoupUI?.showLossAnimation?.(state.lastLossEvent.playerName, meta, !!state.lastLossEvent.out);
    }

    const myBoard = document.getElementById('coup-my-board');
    const othersBoard = document.getElementById('coup-others-board');
    if (myBoard) {
        myBoard.innerHTML = '';
        myBoard.appendChild(_renderOnlineCoupPlayersSummary(state));
    }
    if (othersBoard) othersBoard.innerHTML = '';
    const indexedPlayers = state.players.map((p, idx) => ({p, idx}));
    const orderedPlayers = [
        ...indexedPlayers.filter(x => x.p.id === _myId),
        ...indexedPlayers.filter(x => x.p.id !== _myId)
    ];
    const renderCoupPlayerCard = (p, idx) => {
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
                const label = isMe || c.lost ? (window.CoupUI?.cardLabelHtml?.(meta) || `${meta.icon} ${meta.name}`) : '<span>🂠 مخبية</span>';
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
        if (isMe && idx === state.turnIndex && !state.pending && !state.pendingLoss && !state.pendingExchange) {
            div.querySelectorAll('.coup-influence:not(.lost)').forEach(cardEl => {
                cardEl.style.cursor = 'pointer';
                cardEl.addEventListener('click', e => {
                    e.stopPropagation();
                    const infoBtn = cardEl.querySelector('.coup-card-info');
                    const cardType = infoBtn?.dataset.cardType;
                    if (cardType) {
                        const actionMap = {
                            duke: 'tax',
                            assassin: 'assassinate',
                            captain: 'steal',
                            ambassador: 'exchange'
                        };
                        const action = actionMap[cardType];
                        if (action) _onlineCoupChoose(action);
                        else if (cardType === 'contessa') showToast("البية للدفاع بركة، ما عندهاش هجوم.");
                    }
                });
            });
        }
        return div;
    };
    if (myBoard) {
        if (state.pendingLoss) myBoard.appendChild(_renderOnlineCoupLossBanner(state, me));
        else if (state.pendingExchange) myBoard.appendChild(_renderOnlineCoupExchangeBanner(state, me));
        else if (state.pending) myBoard.appendChild(_renderOnlineCoupPendingBanner(state, me));
    }
    const mine = orderedPlayers[0];
    if (mine && myBoard) {
        const label = document.createElement('div');
        label.className = 'coup-my-deck-label';
        label.innerHTML = '<span></span><strong>كوارطي</strong><span></span>';
        myBoard.appendChild(label);
        myBoard.appendChild(renderCoupPlayerCard(mine.p, mine.idx));

        const warningEl = document.getElementById('coup-10-coin-warning');
        if (warningEl) {
            if (mine.p.coins >= 10) {
                warningEl.classList.remove('hidden');
            } else {
                warningEl.classList.add('hidden');
            }
        }
    }
    if (othersBoard) {
        const othersHeader = document.createElement('button');
        othersHeader.type = 'button';
        othersHeader.className = 'coup-other-divider';
        othersHeader.innerHTML = `<span></span><strong>كوارط اللاعبين الأخرين</strong><span></span><em>${_onlineCoupOtherDecksCollapsed ? '▼' : '▲'}</em>`;
        othersHeader.addEventListener('click', () => {
            _onlineCoupOtherDecksCollapsed = !_onlineCoupOtherDecksCollapsed;
            _showOnlineCoup(room);
        });
        othersBoard.appendChild(othersHeader);
        const othersWrap = document.createElement('div');
        othersWrap.className = 'coup-other-decks' + (_onlineCoupOtherDecksCollapsed ? ' collapsed' : '');
        orderedPlayers.slice(1).forEach(({p, idx}) => othersWrap.appendChild(renderCoupPlayerCard(p, idx)));
        othersBoard.appendChild(othersWrap);
    }
    window.CoupUI?.renderRoleHelp?.(_coupCards);
    _renderOnlineCoupActions(room, state, me);
    _renderOnlineCoupLeaveButton(room);
}

function _renderOnlineCoupLeaveButton(room) {
    document.getElementById('online-coup-leave-btn')?.remove();
    if (!room || !window.onlineMode) return;
    const section = document.getElementById('coup-screen');
    if (!section) return;
    const btn = document.createElement('button');
    btn.id = 'online-coup-leave-btn';
    btn.className = 'round-leave-btn coup-reconnect-btn';
    btn.type = 'button';
    btn.textContent = '🚪 نخرج ونرجع';
    btn.addEventListener('click', _disconnectForReconnect);
    btn.style.marginTop = '20px';
    section.appendChild(btn);
}

function _renderOnlineCoupLossBanner(state, me) {
    const loss = state.pendingLoss;
    const player = state.players.find(p => p.id === loss?.playerId);
    const esc = window.CoupUI?.escapeHtml || (x => x);
    const isMe = me?.id === player?.id;
    const wrap = document.createElement('div');
    wrap.className = 'coup-pending-banner coup-loss-choice-banner';
    const cards = isMe ? (player?.hand || []).map((card, index) => ({card, index})).filter(x => !x.card.lost) : [];
    wrap.innerHTML = `
        <div class="coup-pending-title">اختيار الكارتة</div>
        <strong>${esc(player?.name || '')} لازم يختار كارتة يخسرها</strong>
        <p>${esc(loss?.reason || 'القانون يقول اللاعب هو الي يختار شنية يكشف ويخسر.')}</p>
        <div class="coup-pending-actions">
            ${isMe ? cards.map(({card, index}) => {
                const meta = _coupCards[card.type] || _coupCards.duke;
                return `<button class="coup-target-btn danger-action" data-online-lose-card="${index}" data-loss-id="${loss?.id || ''}">${window.CoupUI?.cardLabelHtml?.(meta) || `${meta.icon} ${esc(meta.name)}`}</button>`;
            }).join('') : `<div class="coup-waiting-note">نستناو ${esc(player?.name || '')} يختار الكارتة.</div>`}
        </div>
    `;
    wrap.querySelectorAll('[data-online-lose-card]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.disabled = true;
            _onlineCoupChooseLoss(parseInt(btn.dataset.onlineLoseCard, 10), btn.dataset.lossId);
        });
    });
    return wrap;
}

function _renderOnlineCoupExchangeBanner(state, me) {
    const exchange = state.pendingExchange;
    const player = state.players.find(p => p.id === exchange?.playerId);
    const esc = window.CoupUI?.escapeHtml || (x => x);
    const wrap = document.createElement('div');
    wrap.className = 'coup-pending-banner';
    wrap.innerHTML = `
        <div class="coup-pending-title">تبديل السمسار</div>
        <strong>${esc(player?.name || '')} يختار كوارطو</strong>
        <p>${me?.id === player?.id ? `اختار ${exchange.keep} كارتة باش تخليها.` : `نستناو ${esc(player?.name || '')} يكمل التبديل.`}</p>
    `;
    return wrap;
}

function _renderOnlineCoupPendingBanner(state, me) {
    const p = state.pending;
    const actor = state.players.find(x=>x.id===p.actorId);
    const target = state.players.find(x=>x.id===p.targetId);
    const claimantId = _onlineCoupPendingClaimantId(p);
    const isClaimant = me?.id === claimantId;
    const isBlockStage = p.stage === 'block';
    const canChallenge = me && !isClaimant && me.hand.some(c=>!c.lost) && (p.claim || isBlockStage);
    const canBlock = me && !isBlockStage && p.blockable && me.id !== actor?.id && me.hand.some(c=>!c.lost) && (p.action === 'foreignAid' || p.targetId === me.id);
    const canPass = me && !isClaimant && !(p.passes || []).includes(me.id);
    const passCount = _onlineCoupPassCount(state, p);
    const total = _onlineCoupPendingResponders(state, p).length;
    const esc = window.CoupUI?.escapeHtml || (x => x);
    const wrap = document.createElement('div');
    wrap.className = 'coup-pending-banner';
    const blockerLine = isBlockStage
        ? `<p>${esc(state.players.find(x=>x.id===p.blockerId)?.name || '')} قال يسكّر ب${_onlineCoupBlockRoleLabel(p.blockRole)}. أي لاعب ينجم يقول "تكذب".</p>`
        : `<p>${target ? `${esc(target.name)} مستهدف. ` : ''}أي لاعب ينجم يقول "تكذب"${canBlock ? '، وإنت تنجم تسكّر بالكارتة المناسبة' : ''}.</p>`;
    wrap.innerHTML = `
        <div class="coup-pending-title">قرار مباشر</div>
        <strong>${esc(state.log || '')}</strong>
        ${blockerLine}
        ${_onlineCoupPendingTimerHtml(p)}
        <div class="coup-pass-progress">${passCount}/${total} قالو ما عندهم حتى اعتراض</div>
        <div class="coup-pending-actions"></div>
    `;
    const actions = wrap.querySelector('.coup-pending-actions');
    if (canChallenge) {
        const btn = document.createElement('button');
        btn.className = 'coup-target-btn danger-action';
        btn.textContent = 'تكذب!';
        btn.onclick = () => isBlockStage ? _onlineCoupChallengeBlock(me.id, p.id) : _onlineCoupChallenge(me.id, p.id);
        actions.appendChild(btn);
    }
    if (canBlock) {
        _onlineCoupBlockOptions(p).forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'coup-target-btn';
            btn.textContent = `نسكّرها ب${opt.label}`;
            btn.onclick = () => _onlineCoupBlock(me.id, opt.role, p.id);
            actions.appendChild(btn);
        });
    }
    if (canPass) {
        const btn = document.createElement('button');
        btn.className = 'coup-target-btn quiet-action';
        btn.textContent = 'ما عندي حتى اعتراض';
        btn.onclick = () => _onlineCoupPass(me.id, p.id);
        actions.appendChild(btn);
    }
    if (!actions.children.length) {
        actions.innerHTML = `<div class="coup-waiting-note">${isClaimant ? 'نستناو ردّ اللاعبين الآخرين.' : 'ردّك تسجّل، نستناو الباقي.'}</div>`;
    }
    return wrap;
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
        panel.innerHTML = '<div class="coup-panel-card">إنت خارج من الطرح. تنجم تتفرج وتضحك عالتبلعيط.</div>';
        return;
    }
    if (state.pendingLoss) {
        const loss = state.pendingLoss;
        const loser = state.players.find(p => p.id === loss.playerId);
        const esc = window.CoupUI?.escapeHtml || (x => x);
        if (me.id === loss.playerId) {
            const live = me.hand.map((card, index) => ({card, index})).filter(x => !x.card.lost);
            panel.innerHTML = `<div class="coup-panel-card live">${esc(loss.reason || 'اختار كارتة تخسرها.')}</div>
                <div class="coup-target-grid">${live.map(({card, index}) => {
                    const meta = _coupCards[card.type] || _coupCards.duke;
                    return `<button class="coup-target-btn danger-action" data-online-lose-card="${index}" data-loss-id="${loss.id || ''}">${window.CoupUI?.cardLabelHtml?.(meta) || `${meta.icon} ${esc(meta.name)}`}</button>`;
                }).join('')}</div>`;
            panel.querySelectorAll('[data-online-lose-card]').forEach(btn => btn.addEventListener('click', () => {
                btn.disabled = true;
                _onlineCoupChooseLoss(parseInt(btn.dataset.onlineLoseCard, 10), btn.dataset.lossId);
            }));
        } else {
            panel.innerHTML = `<div class="coup-panel-card">نستناو ${esc(loser?.name || '')} يختار الكارتة الي يخسرها.</div>`;
        }
        return;
    }
    if (state.pendingExchange) {
        const exchange = state.pendingExchange;
        const esc = window.CoupUI?.escapeHtml || (x => x);
        if (me.id === exchange.playerId) {
            panel.innerHTML = `<div class="coup-panel-card live">اختار ${exchange.keep} كارتة باش تخليها.</div>
                <div class="coup-exchange-count" id="online-coup-exchange-count">0/${exchange.keep}</div>
                <div class="coup-target-grid coup-exchange-grid">${exchange.pool.map((item, index) => {
                    const meta = _coupCards[item.type] || _coupCards.duke;
                    return `<button class="coup-target-btn" data-online-exchange-pick="${index}">${window.CoupUI?.cardLabelHtml?.(meta) || `${meta.icon} ${esc(meta.name)}`}<small>${item.drawn ? 'من الدكّة' : 'من كوارطك'}</small></button>`;
                }).join('')}</div>
                <button id="online-coup-confirm-exchange" class="primary-btn" type="button" disabled>ثبّت الاختيار</button>`;
            const selected = new Set();
            const refresh = () => {
                panel.querySelectorAll('[data-online-exchange-pick]').forEach(btn => btn.classList.toggle('selected', selected.has(parseInt(btn.dataset.onlineExchangePick, 10))));
                panel.querySelector('#online-coup-exchange-count').textContent = `${selected.size}/${exchange.keep}`;
                panel.querySelector('#online-coup-confirm-exchange').disabled = selected.size !== exchange.keep;
            };
            panel.querySelectorAll('[data-online-exchange-pick]').forEach(btn => btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.onlineExchangePick, 10);
                if (selected.has(idx)) selected.delete(idx);
                else if (selected.size < exchange.keep) selected.add(idx);
                refresh();
            }));
            panel.querySelector('#online-coup-confirm-exchange').addEventListener('click', e => {
                e.currentTarget.disabled = true;
                _onlineCoupChooseExchange(Array.from(selected), exchange.id);
            });
            refresh();
        } else {
            const player = state.players.find(p => p.id === exchange.playerId);
            panel.innerHTML = `<div class="coup-panel-card">نستناو ${esc(player?.name || '')} يختار كوارط السمسار.</div>`;
        }
        return;
    }
    if (state.pending) {
        const p = state.pending;
        const actor = state.players.find(x=>x.id===p.actorId);
        const target = state.players.find(x=>x.id===p.targetId);
        const isBlockStage = p.stage === 'block';
        const canChallenge = !isBlockStage && p.claim && me.id !== actor?.id && me.hand.some(c=>!c.lost);
        const canBlock = !isBlockStage && p.blockable && me.id !== actor?.id && me.hand.some(c=>!c.lost) && (p.action === 'foreignAid' || p.targetId === me.id);
        const canChallengeBlock = isBlockStage && me.id !== p.blockerId && me.hand.some(c=>!c.lost);
        const canPass = me.id !== _onlineCoupPendingClaimantId(p) && !(p.passes || []).includes(me.id);
        panel.innerHTML = `<div class="coup-panel-card live">${window.CoupUI?.escapeHtml?.(state.log) || state.log}<br>${_onlineCoupPendingTimerHtml(p)}</div><div class="coup-target-grid"></div>`;
        const grid = panel.querySelector('.coup-target-grid');
        if (canChallenge) {
            const btn = document.createElement('button');
            btn.className = 'coup-target-btn danger-action';
            btn.innerText = 'تكذب!';
            btn.onclick = () => _onlineCoupChallenge(me.id, p.id);
            grid.appendChild(btn);
        }
        if (canBlock) {
            _onlineCoupBlockOptions(p).forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'coup-target-btn';
                btn.innerText = `نسكّرها ب${opt.label}`;
                btn.onclick = () => _onlineCoupBlock(me.id, opt.role, p.id);
                grid.appendChild(btn);
            });
        }
        if (canChallengeBlock) {
            const btn = document.createElement('button');
            btn.className = 'coup-target-btn danger-action';
            btn.innerText = 'تكذب على البلوك!';
            btn.onclick = () => _onlineCoupChallengeBlock(me.id, p.id);
            grid.appendChild(btn);
        }
        if (canPass) {
            const btn = document.createElement('button');
            btn.className = 'coup-target-btn quiet-action';
            btn.innerText = 'ما عندي حتى اعتراض';
            btn.onclick = () => _onlineCoupPass(me.id, p.id);
            grid.appendChild(btn);
        }
        const pendingKey = `${p.id || ''}:${p.actorId}:${p.action}:${p.targetId || ''}:${p.stage || 'action'}:${p.blockerId || ''}`;
        if (_lastCoupPendingKey !== pendingKey) {
            _lastCoupPendingKey = pendingKey;
            const esc = window.CoupUI?.escapeHtml || (x => x);
            const blockButtons = canBlock ? _onlineCoupBlockOptions(p).map(opt => `<button class="coup-target-btn" data-popup-block="${opt.role}">نسكّرها ب${opt.label}</button>`).join('') : '';
            const blockStageButtons = `${canChallengeBlock ? '<button class="coup-target-btn danger-action" data-popup-challenge-block="1">تكذب على البلوك!</button>' : ''}`;
            const targetLine = target && !isBlockStage ? `<p class="coup-decision-hint">${esc(target.name)}، اختياراتك واضحة: سكّر بالكارتة المناسبة، ولا اتهمه بالتبلعيط.</p>` : '';
        const hasContessa = me && me.hand.some(c => !c.lost && c.type === 'contessa');
        const isAssassinationTarget = p.action === 'assassinate' && p.targetId === me?.id && !isBlockStage;

        const passButton = canPass ? '<button class="coup-target-btn quiet-action" data-popup-pass="1">ما عندي حتى اعتراض</button>' : '';
        const buttons = `${canChallenge ? '<button class="coup-target-btn danger-action" data-popup-challenge="1">تكذب!</button>' : ''}${blockButtons}${blockStageButtons}${passButton}`;

        let modalTitle = isBlockStage ? 'البلوك صحيح؟' : 'شنوة تعمل؟';
        let modalBody = `<p>${esc(state.log)}</p>${targetLine}${_onlineCoupPendingTimerHtml(p)}<div class="coup-target-grid">${buttons}</div>`;

        if (isAssassinationTarget && hasContessa) {
            modalTitle = "عندك 'البية'!";
            modalBody = `<p style="font-size:1.2rem; font-weight:800; color:var(--primary-color);">عندك 'البية'، تحب تمنع روحك والا تسكت؟</p>
                         ${_onlineCoupPendingTimerHtml(p)}
                         <div class="coup-target-grid">
                            <button class="coup-target-btn primary-action" data-popup-block="contessa">🛡️ استعمل البية</button>
                            <button class="coup-target-btn danger-action" data-popup-challenge="1">تكذب!</button>
                            <button class="coup-target-btn quiet-action" data-popup-pass="1">اسكت</button>
                         </div>`;
        }

        if (buttons || (isAssassinationTarget && hasContessa)) window.CoupUI?.showModal?.(modalTitle, modalBody, overlay => {
                overlay.querySelector('[data-popup-challenge]')?.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupChallenge(me.id, p.id); });
                overlay.querySelectorAll('[data-popup-block]').forEach(btn => btn.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupBlock(me.id, btn.dataset.popupBlock, p.id); }));
                overlay.querySelector('[data-popup-challenge-block]')?.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupChallengeBlock(me.id, p.id); });
                overlay.querySelector('[data-popup-pass]')?.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupPass(me.id, p.id); });
            });
            else window.CoupUI?.closeModal?.();
        }
        return;
    }
    _lastCoupPendingKey = null;
    const current = state.players[state.turnIndex || 0];
    if (me.id !== current?.id) {
        panel.innerHTML = `<div class="coup-panel-card">استنى دورك. الدور توّة على ${window.CoupUI?.escapeHtml?.(current?.name || '') || current?.name || ''}.</div>`;
    }
    const isTurn = me.id === current?.id;
    const mustCoup = isTurn && (me.coins || 0) >= 10;
    const mk = (txt, action, cls='', hint='') => {
        const actionLocked = !isTurn || (mustCoup && action !== 'coup');
        const finalHint = mustCoup && action !== 'coup' ? 'عندك 10+ فلوس، لازم Coup' : hint;
        return `<button class="coup-action-btn ${cls} ${actionLocked ? 'is-action-disabled' : ''}" data-coup-action="${action}" aria-disabled="${actionLocked ? 'true' : 'false'}"><strong>${txt}<span class="coup-action-info" data-action-info="${action}">ℹ️</span></strong><small>${finalHint}</small></button>`;
    };
    panel.innerHTML += `<div class="coup-action-grid ${isTurn?'':'is-disabled'}">
        ${mk('🪙 شهرية +1','income','','مضمون وما يتكذبش')}
        ${mk('🤲 اعانة +2','foreignAid','','ينجم الشلغمي يسكّرها')}
        ${mk(`${window.CoupUI?.cardLabelHtml?.(_coupCards.duke) || '👑 الشلغمي'} +3`,'tax','primary-action','قول عندي الشلغمي')}
        ${mk(`${window.CoupUI?.cardLabelHtml?.(_coupCards.captain) || '⚓ الرايس'}: اسرق`,'steal','primary-action','اسرق زوز فلوس')}
        ${mk(`${window.CoupUI?.cardLabelHtml?.(_coupCards.assassin) || '🗡️ حفار القبور'} -3`,'assassinate','danger-action','يلزم حفار القبور')}
        ${mk(`${window.CoupUI?.cardLabelHtml?.(_coupCards.ambassador) || '🤝 السمسار'}: بدّل`,'exchange','','بدّل كوارطك مع الدكّة')}
        ${mk('💥 Coup -7','coup','danger-action','ضربة ما تتسكرش')}
    </div>`;
    panel.querySelectorAll('.coup-action-info').forEach(info => info.addEventListener('click', e => {
        e.stopPropagation();
        const meta = _onlineCoupActionHelp[info.dataset.actionInfo];
        if (meta) window.CoupUI?.showModal?.(meta.title, `<p class="coup-card-desc">${window.CoupUI.escapeHtml(meta.text)}</p>`);
    }));
    panel.querySelectorAll('[data-coup-action]').forEach(btn => btn.addEventListener('click', e => {
        if (e.target.closest('.coup-action-info')) return;
        if (btn.getAttribute('aria-disabled') === 'true') return;
        btn.disabled = true;
        _onlineCoupChoose(btn.dataset.coupAction);
    }));
}

async function _onlineCoupSave(state) {
    if (!_room) return;
    state.revision = (parseInt(state.revision || 0, 10) || 0) + 1;
    state.changedAt = _syncedNow();
    const updated = await _update(_room.code, { word_obj: state });
    _showOnlineCoup(updated);
}

async function _onlineCoupMutateState(mutator) {
    if (!_room) return null;
    for (let attempt = 0; attempt < 5; attempt++) {
        const latestRoom = await _fetchRoom(_room.code);
        const state = structuredClone(latestRoom.word_obj);
        if (!state) return latestRoom;
        const hadRevision = state.revision !== undefined && state.revision !== null;
        const baseRevision = parseInt(state.revision || 0, 10) || 0;
        const next = await mutator(state, latestRoom);
        if (!next) return latestRoom;
        next.revision = baseRevision + 1;
        next.changedAt = _syncedNow();
        let query = _supa.from('rooms').update({ word_obj: next }).eq('code', latestRoom.code);
        if (hadRevision) query = query.eq('word_obj->>revision', String(baseRevision));
        let {data, error} = await query.select().maybeSingle();
        if (error && hadRevision) {
            console.warn('[online coup] revision guard unavailable, falling back to normal update', error);
            const fallback = await _supa.from('rooms').update({ word_obj: next }).eq('code', latestRoom.code).select().maybeSingle();
            data = fallback.data;
            error = fallback.error;
        }
        if (error) throw error;
        if (!data) {
            await _sleep(80 + attempt * 70);
            continue;
        }
        const updated = data;
        _showOnlineCoup(updated);
        return updated;
    }
    return null;
}

async function _onlineCoupChooseLoss(cardIndex, lossId = null) {
    await _onlineCoupMutateState(async state => {
        const loss = state.pendingLoss;
        if (!loss || loss.playerId !== _myId) return null;
        if (lossId && loss.id !== lossId) return null;
        if (!_onlineCoupMarkLoss(state, loss.playerId, cardIndex)) return null;
        const next = loss.next || { type:'nextTurn' };
        _onlineCoupContinueAfterLoss(state, next);
        return state;
    });
}

async function _onlineCoupChooseExchange(indices, exchangeId = null) {
    await _onlineCoupMutateState(async state => {
        const exchange = state.pendingExchange;
        if (!exchange || exchange.playerId !== _myId) return null;
        if (exchangeId && exchange.id !== exchangeId) return null;
        const chosen = Array.from(new Set(indices.map(n => parseInt(n, 10)).filter(n => Number.isInteger(n))));
        if (chosen.length !== exchange.keep) return null;
        const player = state.players.find(p => p.id === exchange.playerId);
        const liveSlots = player.hand.map((card, index) => ({card, index})).filter(x => !x.card.lost);
        const chosenSet = new Set(chosen);
        const kept = chosen.map(idx => exchange.pool[idx]).filter(Boolean);
        if (kept.length !== exchange.keep) return null;
        liveSlots.forEach((slot, idx) => { slot.card.type = kept[idx].type; slot.card.lost = false; });
        exchange.pool.filter((_, idx) => !chosenSet.has(idx)).forEach(item => state.deck.unshift(item.type));
        state.deck.sort(()=>0.5-Math.random());
        state.pendingExchange = null;
        state.log = `${player.name} بدّل كوارطو مع الدكّة.`;
        _onlineCoupEvent(state, state.log, 'good');
        _onlineCoupNextTurn(state);
        return state;
    });
}

function _onlineCoupChoose(action) {
    const state = structuredClone(_room.word_obj);
    const actor = state.players[state.turnIndex || 0];
    const reenable = () => {
        document.querySelectorAll('.coup-action-btn').forEach(b => {
            if (b.getAttribute('aria-disabled') !== 'true') b.disabled = false;
        });
    };
    if (actor.id !== _myId) { reenable(); return; }
    if ((actor.coins || 0) >= 10 && action !== 'coup') { reenable(); return showToast('عندك 10 فلوس ولا أكثر، لازم تعمل Coup.'); }
    if (action === 'assassinate' && actor.coins < 3) { reenable(); return showToast('يلزمك 3 فلوس للاغتيال.'); }
    if (action === 'coup' && actor.coins < 7) { reenable(); return showToast('يلزمك 7 فلوس للCoup.'); }
    if (['assassinate','coup','steal'].includes(action)) return _onlineCoupPickTarget(action);
    const actionName = _onlineCoupActionName(action);
    const esc = window.CoupUI?.escapeHtml || (x => x);
    window.CoupUI?.showModal?.(actionName, `
        <p>باش تعمل <strong>${esc(actionName)}</strong>. كان فيها تبلعيط، اللاعبين ينجموا يقولو "تكذب!".</p>
        <button class="primary-btn" id="online-coup-confirm-action">كمّل</button>
    `, overlay => {
        overlay.querySelector('#online-coup-confirm-action')?.addEventListener('click', () => {
            overlay.querySelector('#online-coup-confirm-action').disabled = true;
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
                btn.disabled = true;
                window.CoupUI.closeModal();
                _onlineCoupStartPending(action, btn.dataset.targetId);
            });
        });
    });
}

async function _onlineCoupStartPending(action, targetId) {
    await _onlineCoupMutateState(async state => {
        if (state.pending || state.pendingLoss || state.pendingExchange) return null;
        const actor = state.players[state.turnIndex || 0];
        if (!actor || actor.id !== _myId || !_onlineCoupLiveCards(actor).length) return null;
        if ((actor.coins || 0) >= 10 && action !== 'coup') return null;
        if (action === 'assassinate' && actor.coins < 3) return null;
        if (action === 'coup' && actor.coins < 7) return null;
        if (['assassinate','coup','steal'].includes(action)) {
            const target = _onlineCoupAlive(state).find(p => p.id === targetId && p.id !== actor.id);
            if (!target) return null;
        }
        const claims = { tax:'duke', assassinate:'assassin', exchange:'ambassador', steal:'captain' };
        const blockRoles = action === 'foreignAid' ? ['duke'] : action === 'assassinate' ? ['contessa'] : action === 'steal' ? ['captain','ambassador'] : [];
        const blockable = blockRoles.length > 0;
        const claim = claims[action] || null;
        if (!claim && !blockable) return _onlineCoupApplyActionLocal(state, action, targetId);
        // Deduct assassination fee immediately on declaration (not refunded if caught bluffing or blocked).
        if (action === 'assassinate') {
            actor.coins -= 3;
            _onlineCoupPayBank(state, 3);
        }
        state.pending = { id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, action, actorId:actor.id, targetId, claim, blockable, blockRoles, passes:[] };
        _onlineCoupSetResponseDeadline(state.pending);
        state.log = `${actor.name} قال يعمل ${_onlineCoupActionName(action)}. قولولو "تكذب!" كان شاكين.`;
        _onlineCoupEvent(state, `${actor.name} عمل ${_onlineCoupActionName(action)}`, 'notice');
        return state;
    });
}

async function _onlineCoupChallenge(challengerId, pendingId = null) {
    window.CoupUI?.closeModal?.();
    await _onlineCoupMutateState(async state => {
        const p = state.pending;
        if (!p || p.stage === 'block' || !p.claim || (pendingId && p.id !== pendingId)) return null;
        const actor = state.players.find(x=>x.id===p.actorId);
        const challenger = state.players.find(x=>x.id===challengerId);
        if (!actor || !challenger || challenger.id === actor.id || !_onlineCoupLiveCards(challenger).length) return null;
        const hasIt = actor.hand.some(c=>!c.lost && c.type===p.claim);
        if (hasIt) {
            _onlineCoupProveAndReplace(state, actor, p.claim);
            state.log = `${challenger.name} طلع غالط! ${actor.name} عندو الكارتة. ${_onlineCoupWrong()}`;
        _onlineCoupEvent(state, state.log, 'bad', { triggerNotLying: actor.name });
            const next = p.blockable ? _onlineCoupResumeBlockNext(p, actor.name) : { type:'applyAction', action:p.action, targetId:p.targetId };
            _onlineCoupRequestLoss(state, challengerId, 'طلعت غالط في التكذيب. اختار كارتة تخسرها.', next);
        } else {
            state.log = `${actor.name} تڨبض يبوّع! ${_onlineCoupCaught()}`;
            _onlineCoupEvent(state, state.log, 'bad');
            _onlineCoupRequestLoss(state, actor.id, 'تكذّبت وما عندكش الكارتة. اختار كارتة تكشفها.', { type:'nextTurn' });
        }
        return state;
    });
}

async function _onlineCoupPass(playerId = _myId, pendingId = null) {
    window.CoupUI?.closeModal?.();
    await _onlineCoupMutateState(async state => {
        const p = state.pending; if (!p) return null;
        if (pendingId && p.id !== pendingId) return null;
        const claimantId = _onlineCoupPendingClaimantId(p);
        if (playerId === claimantId) return null;
        if (!_onlineCoupLiveCards(state.players.find(x=>x.id===playerId)).length) return null;
        p.passes = Array.from(new Set([...(p.passes || []), playerId]));
        if (_onlineCoupAllPassed(state, p)) {
            if (p.stage === 'block') {
                state.log = `${state.players.find(x=>x.id===p.blockerId)?.name || ''} سكّرها. الأكشن مات غادي.`;
                _onlineCoupEvent(state, state.log, 'good');
                state.pending = null;
                _onlineCoupNextTurn(state);
            } else {
                return _onlineCoupApplyActionLocal(state, p.action, p.targetId);
            }
        }
        return state;
    });
}

async function _onlineCoupBlock(blockerId, blockRole = null, pendingId = null) {
    window.CoupUI?.closeModal?.();
    await _onlineCoupMutateState(async state => {
        const p = state.pending;
        if (!p || p.stage === 'block' || !p.blockable || (pendingId && p.id !== pendingId)) return null;
        const blocker = state.players.find(x=>x.id===blockerId);
        if (!blocker || blocker.id === p.actorId || !_onlineCoupLiveCards(blocker).length) return null;
        if (p.action !== 'foreignAid' && p.targetId !== blocker.id) return null;
        const blockRoles = p.blockRoles || (p.action === 'assassinate' ? ['contessa'] : p.action === 'steal' ? ['captain','ambassador'] : ['duke']);
        const role = blockRole && blockRoles.includes(blockRole) ? blockRole : blockRoles[0];
        state.pending = {...p, id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, stage:'block', blockerId, blockRole:role, passes:[]};
        _onlineCoupSetResponseDeadline(state.pending);
        state.log = `${blocker.name} قال يسكّرها ب${_onlineCoupBlockRoleLabel(role)}. ${state.players.find(x=>x.id===p.actorId)?.name || ''} ينجم يقوللو "تكذب!".`;
        _onlineCoupEvent(state, state.log, 'notice');
        return state;
    });
}

async function _onlineCoupAcceptBlock() {
    await _onlineCoupMutateState(async state => {
        const p = state.pending; if (!p || p.stage !== 'block') return null;
        const blocker = state.players.find(x=>x.id===p.blockerId);
        state.log = `${blocker?.name || ''} سكّرها. الأكشن مات غادي.`;
        _onlineCoupEvent(state, state.log, 'good');
        state.pending = null;
        _onlineCoupNextTurn(state);
        return state;
    });
}

async function _onlineCoupChallengeBlock(challengerId = _myId, pendingId = null) {
    window.CoupUI?.closeModal?.();
    await _onlineCoupMutateState(async state => {
        const p = state.pending;
        if (!p || p.stage !== 'block' || (pendingId && p.id !== pendingId)) return null;
        const actor = state.players.find(x=>x.id===p.actorId);
        const challenger = state.players.find(x=>x.id===challengerId) || actor;
        const blocker = state.players.find(x=>x.id===p.blockerId);
        if (!blocker || !challenger || challenger.id === blocker.id || !_onlineCoupLiveCards(challenger).length) return null;
        const hasIt = blocker.hand.some(c=>!c.lost && c.type===p.blockRole);
        if (hasIt) {
            _onlineCoupProveAndReplace(state, blocker, p.blockRole);
            state.log = `${challenger.name} اتهم البلوك وطلع غالط. ${blocker.name} عندو ${_onlineCoupBlockRoleLabel(p.blockRole)}.`;
        _onlineCoupEvent(state, state.log, 'bad', { triggerNotLying: blocker.name });
            _onlineCoupRequestLoss(state, challenger.id, 'طلعت غالط في تكذيب البلوك. اختار كارتة تخسرها.', { type:'nextTurn' });
        } else {
            state.log = `${blocker.name} حاول يسكّر وطلع يبوّع. الأكشن يكمل.`;
            _onlineCoupEvent(state, state.log, 'bad');
            _onlineCoupRequestLoss(state, blocker.id, 'البلوك كان تبلعيط. اختار كارتة تكشفها.', { type:'applyAction', action:p.action, targetId:p.targetId });
        }
        return state;
    });
}

async function _onlineCoupResolve(action, targetId) {
    await _onlineCoupMutateState(async state => {
        state.pending = null;
        return _onlineCoupApplyActionLocal(state, action, targetId);
    });
}

async function _onlineCoupApplyAction(state, action, targetId) {
    _onlineCoupApplyActionLocal(state, action, targetId);
    await _onlineCoupSave(state);
}

function _onlineCoupApplyActionLocal(state, action, targetId) {
    const actor = state.players[state.turnIndex || 0];
    const target = state.players.find(p=>p.id===targetId);
    state.pending = null;
    if (action === 'income') { actor.coins += 1; _onlineCoupTakeFromBank(state, 1); state.log = `${actor.name} خذا دينار. رزق بارد.`; }
    if (action === 'foreignAid') { actor.coins += 2; _onlineCoupTakeFromBank(state, 2); state.log = `${actor.name} خذا اعانة. ما تسكّرتش.`; }
    if (action === 'tax') { actor.coins += 3; _onlineCoupTakeFromBank(state, 3); state.log = `${actor.name} كول بالشلغمي وخذا 3 فلوس.`; }
    if (action === 'exchange') {
        _onlineCoupRequestExchange(state, actor.id);
        return state;
    }
    if (action === 'steal' && target) {
        const amount = Math.min(2, target.coins || 0);
        target.coins -= amount;
        actor.coins += amount;
        state.log = amount > 0 ? `${actor.name} سرق ${amount} فلوس من ${target.name}. الرايس دخل للمرسى.` : `${actor.name} حاول يسرق ${target.name} أما ما لقى شي.`;
    }
    if (action === 'assassinate' && target) {
        // Coins were already deducted at declaration time (in the pending creation block).
        state.log = `${target.name} تضرّب من حفار القبور. ${target.name} يختار كارتة يخسرها.`;
        _onlineCoupEvent(state, state.log, 'bad');
        if (!_onlineCoupRequestLoss(state, target.id, 'تضرّبت من حفار القبور. اختار شنية الكارتة الي تخسرها.', { type:'nextTurn' })) _onlineCoupNextTurn(state);
        return state;
    }
    if (action === 'coup' && target) {
        actor.coins -= 7;
        _onlineCoupPayBank(state, 7);
        state.log = `${actor.name} عمل Coup على ${target.name}. ${target.name} يختار كارتة يخسرها.`;
        _onlineCoupEvent(state, state.log, 'bad');
        if (!_onlineCoupRequestLoss(state, target.id, 'تضرّبت بCoup. اختار شنية الكارتة الي تخسرها.', { type:'nextTurn' })) _onlineCoupNextTurn(state);
        return state;
    }
    _onlineCoupEvent(state, state.log, ['assassinate','coup'].includes(action) ? 'bad' : 'good');
    _onlineCoupNextTurn(state);
    return state;
}

function _onlineCoupCaught() {
    return ['الكذبة طلعت بريحة اللبلابي.','بوّعها بثقة وطيح في الحفرة.','قالها كبيرة، جاتو أكبر.'][Math.floor(Math.random()*3)];
}
function _onlineCoupWrong() {
    return ['عمل روحو حاكم وطلع غلط.','تكذب؟ لا يا خويا، إنت الي تخلص.','دخل في حيط بيديه.'][Math.floor(Math.random()*3)];
}

async function _disconnectForReconnect() {
    document.getElementById('coup-turn-indicator')?.classList.add('hidden');
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
    _clearPlayerPatchReconciles();
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
    document.getElementById('coup-turn-indicator')?.classList.add('hidden');
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
    _stopVotingTimer();
    _clearPlayerPatchReconciles();
    document.querySelectorAll('.online-round-players').forEach(el => el.remove());
    _room=null; _isHost=false; window.onlineMode=false;
    showScreen('setup-screen');
}

let _html5QrCode = null;

async function _startScanner() {
    const btn = document.getElementById('open-scanner-btn');
    const container = document.getElementById('reader-container');
    if (!btn || !container) return;

    if (_html5QrCode && _html5QrCode.isScanning) {
        await _html5QrCode.stop();
        container.style.display = 'none';
        btn.innerText = '📷 امسح الكود';
        return;
    }

    container.style.display = 'block';
    btn.innerText = '❌ سكر الكاميرا';

    if (!_html5QrCode) {
        _html5QrCode = new Html5Qrcode("reader");
    }

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    _html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
            // Success
            let code = decodedText;
            try {
                const url = new URL(decodedText);
                const roomParam = url.searchParams.get('room');
                if (roomParam) code = roomParam;
            } catch (e) {
                // Not a URL, use text as is
            }

            if (code && code.length >= 4) {
                document.getElementById('room-code-input').value = code.toUpperCase();
                _stopScanner();
                _joinRoom();
            }
        },
        (errorMessage) => {
            // parse error, ignore
        }
    ).catch((err) => {
        console.error(err);
        let msg = 'خطأ في حلان الكاميرا';
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
            msg = 'لازم تعطي صلاحية الكاميرا باش تنجم تمسح الكود';
        }
        _err(msg);
        container.style.display = 'none';
        btn.innerText = '📷 امسح الكود';
    });
}

async function _stopScanner() {
    if (_html5QrCode && _html5QrCode.isScanning) {
        await _html5QrCode.stop();
    }
    const container = document.getElementById('reader-container');
    const btn = document.getElementById('open-scanner-btn');
    if (container) container.style.display = 'none';
    if (btn) btn.innerText = '📷 امسح الكود';
}

function _initChkobbaReactions() {
    const chkobbaReactBar = document.getElementById('chkobba-reactions');
    const dock = document.querySelector('.chkobba-hand-dock');
    if (chkobbaReactBar && dock) {
        // Show bar when clicking hand dock background
        dock.addEventListener('click', (e) => {
            if(e.target.closest('.chkobba-card')) return;
            chkobbaReactBar.classList.add('show');

            // Auto hide after 3 seconds
            clearTimeout(chkobbaReactBar._hideTimer);
            chkobbaReactBar._hideTimer = setTimeout(() => {
                chkobbaReactBar.classList.remove('show');
            }, 3000);
        });

        chkobbaReactBar.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof _sfx !== 'undefined') _sfx.tap();
                chkobbaReactBar.classList.remove('show');

                // Broadcast reaction
                if (_channel) {
                    _channel.send({
                        type: 'broadcast',
                        event: 'reaction',
                        payload: { name: _myName, msg: btn.innerText, sfx: 'notify' }
                    });
                    _showReactionFloat(_myName + ': ' + btn.innerText);
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const scanBtn = document.getElementById('open-scanner-btn');
    if (scanBtn) scanBtn.addEventListener('click', _startScanner);
    _initChkobbaReactions();
});

// Expose for verification/debugging
window._showOnlineCoup = _showOnlineCoup;
window._handleStateChange = _handleStateChange;
window._syncedNow = _syncedNow;

/**
 * CHKOBBA MULTIPLAYER
 */

function _renderChkobbaLobbySettings(anchorBtn, room) {
    const cfg = room.config || {};
    const mode = cfg.chkobbaMode || '1v1';
    const target = cfg.chkobbaTarget || 21;
    const tournament = !!cfg.chkobbaTournament;
    const turnTime = cfg.chkobbaTurnTime || 45;

    // Mode names map
    const modeLabels = {
        '1v1': '1 ضد 1',
        '2v2': '2 ضد 2 (فِرَق)',
        '1v1v1': 'اللعب الحر (3 لاعبين)',
        '1v1v1v1': 'اللعب الحر (4 لاعبين)'
    };

    const wrap = document.createElement('div');
    wrap.id = 'lobby-settings-panel';
    wrap.className = 'advanced-content open simple-lobby-settings chkobba-lobby-settings';

    wrap.innerHTML = `
        <div class="surface-card" style="padding:10px 24px;">
            <div class="setting-row">
                <div class="setting-info">
                    <span class="setting-title">🎮 نوع الطرح</span>
                </div>
                <div class="dropdown-select" id="chk-mode-dropdown">
                    <div class="dropdown-trigger">
                        <span>${modeLabels[mode] || mode}</span>
                        <span class="dropdown-chevron">▼</span>
                    </div>
                    <div class="dropdown-menu">
                        ${Object.entries(modeLabels).map(([val, label]) => `
                            <div class="dropdown-option ${mode === val ? 'active' : ''}" data-value="${val}">
                                ${label}
                                ${mode === val ? '<span class="option-check">✓</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="setting-row">
                <div class="setting-info">
                    <span class="setting-title">🎯 قداش نوصلو؟</span>
                </div>
                <div class="counter-group">
                    <button class="counter-btn" id="chk-target-minus">−</button>
                    <span class="counter-value" id="chk-target-val">${target}</span>
                    <button class="counter-btn" id="chk-target-plus">+</button>
                </div>
            </div>

            <div class="setting-row">
                <div class="setting-info">
                    <span class="setting-title">⏱️ وقت الدور (ثانية)</span>
                </div>
                <div class="counter-group">
                    <button class="counter-btn" id="chk-time-minus">−</button>
                    <span class="counter-value" id="chk-time-val">${turnTime}</span>
                    <button class="counter-btn" id="chk-time-plus">+</button>
                </div>
            </div>

            <div class="toggle-row" style="border-bottom:none; margin-top:16px;">
                <span class="toggle-label">🏆 نظام تورنوا</span>
                <div class="toggle-switch ${tournament?'active':''}" id="chk-tournament-tog">
                    <div class="toggle-thumb"></div>
                </div>
            </div>
        </div>
    `;
    anchorBtn.after(wrap);

    const updateConfig = async (patch) => {
        const newCfg = { ...room.config, ...patch };
        try { await _update(room.code, { config: newCfg }); } catch(e) { console.error(e); }
    };

    // Wire dropdown
    const dropdown = wrap.querySelector('#chk-mode-dropdown');
    dropdown.querySelector('.dropdown-trigger').onclick = () => dropdown.classList.toggle('open');
    dropdown.querySelectorAll('.dropdown-option').forEach(opt => {
        opt.onclick = async () => {
            dropdown.classList.remove('open');
            const modeVal = opt.dataset.value;
            await updateConfig({ chkobbaMode: modeVal });
            if (_room) {
                _room.config = { ...(_room.config || {}), chkobbaMode: modeVal };
                _renderLobby(_room);
            }
        };
    });

    wrap.querySelector('#chk-target-minus').onclick = () => updateConfig({ chkobbaTarget: Math.max(11, target - 10) });
    wrap.querySelector('#chk-target-plus').onclick = () => updateConfig({ chkobbaTarget: Math.min(101, target + 10) });

    wrap.querySelector('#chk-time-minus').onclick = () => updateConfig({ chkobbaTurnTime: Math.max(15, turnTime - 15) });
    wrap.querySelector('#chk-time-plus').onclick = () => updateConfig({ chkobbaTurnTime: Math.min(120, turnTime + 15) });

    wrap.querySelector('#chk-tournament-tog').onclick = () => {
        updateConfig({ chkobbaTournament: !tournament });
    };
}

async function _startOnlineChkobbaGame() {
    if (!_isHost || !_room) return;
    const allP = _room.players || [];
    const cfg = _room.config || {};
    const mode = cfg.chkobbaMode || '1v1';
    const turnTime = cfg.chkobbaTurnTime || 45;

    // Validate player count for mode
    const needed = mode === '1v1' ? 2 : mode === '1v1v1' ? 3 : 4;
    if (allP.length < needed && !cfg.chkobbaTournament) {
        showToast(`يلزم ${needed} لاعبين للمود هذا.`);
        return;
    }

    const logic = window.ChkobbaLogic;

    let teams = null;
    if (mode === '2v2') {
        teams = [[allP[0].id, allP[2].id], [allP[1].id, allP[3].id]];
    }

    const state = logic.createNewGameState(
        allP.map((p, idx) => ({
            id: p.id,
            name: p.name,
            team: mode === '2v2' ? (idx % 2 === 0 ? 0 : 1) : null
        })),
        {
            teams,
            targetScore: cfg.chkobbaTarget || 21,
            mode,
            tournament: !!cfg.chkobbaTournament
        }
    );

    try {
        const timerEndAt = new Date(_syncedNow() + turnTime * 1000).toISOString();
        await _update(_room.code, {
            state: 'chkobba',
            timer_end_at: timerEndAt,
            word_obj: state,
            config: { ...cfg, gameMode: 'chkobba' }
        });
    } catch(e) { console.error(e); }
}

function _renderChkobbaPiles(state, me) {
    const logic = window.ChkobbaLogic;
    const backUrl = logic.ASSETS.BACK;
    const deckEl = document.getElementById('chkobba-deck-pile');
    const capEl = document.getElementById('chkobba-my-capture-pile');
    if (!deckEl || !capEl) return;

    deckEl.style.backgroundImage = `url('${backUrl}')`;
    let deckBadge = deckEl.querySelector('.pile-count');
    if (!deckBadge) {
        deckBadge = document.createElement('span');
        deckBadge.className = 'pile-count';
        deckEl.appendChild(deckBadge);
    }
    deckBadge.textContent = state.deck.length;

    const capCount = me?.captured?.length || 0;
    capEl.classList.toggle('has-cards', capCount > 0);
    capEl.style.backgroundImage = capCount > 0 ? `url('${backUrl}')` : '';
    capEl.style.backgroundSize = 'cover';
    let capBadge = capEl.querySelector('.pile-count');
    if (!capBadge) {
        capBadge = document.createElement('span');
        capBadge.className = 'pile-count';
        capEl.appendChild(capBadge);
    }
    capBadge.textContent = capCount;
}

function _renderChkobbaOpening(room, state) {
    const panel = document.getElementById('chkobba-opening-panel');
    const tableWrap = document.querySelector('.chkobba-table-wrap');
    const handDock = document.querySelector('.chkobba-hand-dock');
    if (!panel) return;

    const logic = window.ChkobbaLogic;
    const inSetup = logic.isSetupPhase(state);
    panel.hidden = !inSetup;
    tableWrap?.classList.toggle('is-setup-locked', inSetup);
    handDock?.classList.toggle('is-setup-locked', inSetup);

    if (!inSetup) {
        panel.innerHTML = '';
        return;
    }

    const dealer = logic.getDealer(state);
    const cutter = logic.getCutter(state);
    const amCutter = cutter?.id === _myId;
    const amDealer = dealer?.id === _myId;
    const sp = state.setupPhase;

    if (sp === logic.SETUP_PHASES.SHUFFLED) {
        panel.innerHTML = `
            <h3>🂠 بداية الطرح</h3>
            <p>الكومة مخلوطة. <strong>${_esc(dealer?.name || '')}</strong> التاجر، <strong>${_esc(cutter?.name || '')}</strong> يقصّ.</p>
            ${amCutter ? '<button type="button" class="primary-btn" id="chkobba-cut-btn">✂️ قصّ الكومة</button>' : `<p>⏳ نستنا <strong>${_esc(cutter?.name || '')}</strong> يقصّ...</p>`}
        `;
    } else if (sp === logic.SETUP_PHASES.REVEALED && state.starterCard) {
        panel.innerHTML = `
            <h3>🃏 الكارطة الأولى</h3>
            <p>${amCutter ? 'شوف الكارطة — قبلها ولا ارميها على الطاولة.' : `⏳ <strong>${_esc(cutter?.name || '')}</strong> يقرر...`}</p>
            <div class="chkobba-opening-starter" id="chkobba-starter-slot"></div>
            ${amCutter ? `
                <div class="chkobba-opening-actions">
                    <button type="button" class="primary-btn" id="chkobba-accept-starter-btn">✅ قبل الكارطة</button>
                    <button type="button" class="secondary-btn" id="chkobba-decline-starter-btn">🃏 ارميها على الطاولة</button>
                </div>
            ` : ''}
            ${amDealer && !amCutter ? '<p>إذا قبلها، التاجر يعطيه كارتين زيادة. وإلا تبقى على الطاولة.</p>' : ''}
        `;
        const displayCard = amCutter ? state.starterCard : { id: 'hidden', suit: 'back', value: 0 };
        panel.querySelector('#chkobba-starter-slot')?.appendChild(
            _renderChkobbaCard(displayCard, { zone: 'table', index: 0, interactive: false })
        );
    } else {
        panel.innerHTML = `<h3>⏳ تحضير الطرح</h3><p>${_esc(state.log || '')}</p>`;
    }

    panel.querySelector('#chkobba-cut-btn')?.addEventListener('click', () => _chkobbaPerformCut());
    panel.querySelector('#chkobba-accept-starter-btn')?.addEventListener('click', () => _chkobbaAcceptStarter());
    panel.querySelector('#chkobba-decline-starter-btn')?.addEventListener('click', () => _chkobbaDeclineStarter());
}

async function _chkobbaDeclineStarter() {
    if (!_room?.word_obj) return;
    const logic = window.ChkobbaLogic;
    const state = _room.word_obj;
    if (state.players[state.cutterIndex]?.id !== _myId) return;

    const starterSlot = document.getElementById('chkobba-starter-slot');
    const tableEl = document.getElementById('chkobba-table');
    const cardImg = state.starterCard && logic.getCardAsset(state.starterCard);

    const runMutate = async () => {
        await _mutatePlayers(_room.code, (players, room) => {
            const s = room.word_obj;
            if (!logic.declineStarterCard(s)) return null;
            return players;
        }, null, (room, players) => ({ word_obj: room.word_obj }));
        _chkobbaLastSnapshot = null;
    };

    if (_prefersReducedMotion() || !starterSlot || !tableEl || !cardImg) {
        await runMutate();
        return;
    }

    _chkobbaAnimating = true;
    const fromRect = starterSlot.getBoundingClientRect();
    const toRect = tableEl.getBoundingClientRect();
    _animateChkobbaFlight({
        fromRect,
        toRect,
        imgSrc: cardImg,
        rotate: -8,
        onDone: async () => {
            _chkobbaAnimating = false;
            await runMutate();
        }
    });
}

async function _chkobbaPerformCut() {
    if (!_room?.word_obj) return;
    const logic = window.ChkobbaLogic;
    const state = _room.word_obj;
    if (state.players[state.cutterIndex]?.id !== _myId) return;

    const cutIndex = 5 + Math.floor(Math.random() * Math.max(1, state.deck.length - 10));

    await _mutatePlayers(_room.code, (players, room) => {
        const s = room.word_obj;
        if (!logic.performDeckCut(s, cutIndex)) return null;
        return players;
    }, null, (room, players) => ({ word_obj: room.word_obj }));
}

async function _chkobbaAcceptStarter() {
    if (!_room?.word_obj) return;
    const logic = window.ChkobbaLogic;

    await _mutatePlayers(_room.code, (players, room) => {
        const s = room.word_obj;
        if (!logic.acceptStarterCard(s)) return null;
        return players;
    }, null, (room, players) => ({ word_obj: room.word_obj }));

    _chkobbaLastSnapshot = null;
}

function _buildChkobbaOpponentPillHtml(p, state, { active, isTeammate, isExpanded, offline, dinari }) {
    const isMe = p.id === _myId;
    return `
        <div class="pill-main">
            <div class="pill-name">${_esc(p.name)}${isMe ? ' <span class="you-tag">أنا</span>' : ''}${active ? ' ●' : ''}</div>
            <div class="pill-stats-row">
                <div class="pill-stat" title="كوارط في اليد">🃏 ${p.hand.length}</div>
                <div class="pill-stat" title="الماكول">📥 ${p.captured?.length || 0}</div>
                <div class="pill-stat" title="السكور">🏆 ${p.totalScore}</div>
            </div>
            <div class="pill-chevron">${isExpanded ? '▲' : '▼'}</div>
        </div>
        ${isExpanded ? `
            <div class="pill-details">
                <div class="pill-details-grid">
                    <div class="detail-row"><span>الشكبّات</span><strong>${p.chkobbas || 0}</strong></div>
                    <div class="detail-row"><span>الماكول</span><strong>${p.captured?.length || 0}</strong></div>
                    <div class="detail-row"><span>الديناري</span><strong>${dinari}</strong></div>
                    ${offline ? '<div class="detail-row"><span>الاتصال</span><strong>غير متصل</strong></div>' : ''}
                    <div class="detail-row"><span>الطرح</span><strong>${state.round || 1}</strong></div>
                </div>
            </div>
        ` : ''}
    `;
}

function _renderChkobbaOpponentPills(room, state, me, mode, roomPlayerMeta) {
    const oppCont = document.getElementById('chkobba-opponents');
    if (!oppCont) return;

    oppCont.className = `chkobba-opponents mode-${mode}`;
    const playersToRender = state.players; // Render all players including me
    const playerIds = new Set(playersToRender.map(p => p.id));

    for (const [id, el] of _chkobbaOpponentPillEls) {
        if (!playerIds.has(id)) {
            el.remove();
            _chkobbaOpponentPillEls.delete(id);
        }
    }

    playersToRender.forEach(p => {
        const isMe = p.id === _myId;
        const active = state.players[state.turnIndex].id === p.id;
        const isTeammate = mode === '2v2' && p.team === me?.team;
        const isExpanded = _onlineCoupSummaryExpandedId === p.id;
        const meta = roomPlayerMeta[p.id];
        const offline = !isMe && meta && meta.connected === false;
        const dinari = p.captured?.filter(c => c.suit === 'diamonds').length || 0;

        let pill = _chkobbaOpponentPillEls.get(p.id);
        const isNew = !pill;

        if (!pill) {
            pill = document.createElement('div');
            pill.dataset.playerId = p.id;
            pill.className = 'chkobba-player-pill is-entering';
            pill.addEventListener('animationend', (e) => {
                if (e.animationName === 'chkobbaPillDropIn') pill.classList.remove('is-entering');
            });
            _chkobbaOpponentPillEls.set(p.id, pill);
            oppCont.appendChild(pill);
        }

        pill.dataset.expanded = String(isExpanded);
        pill.className = `chkobba-player-pill ${active ? 'is-turn' : ''} ${isMe ? 'is-me' : ''} ${isTeammate ? 'is-teammate' : ''} ${isExpanded ? 'is-expanded' : ''} ${offline ? 'is-offline' : ''}${isNew ? ' is-entering' : ''}`;

        pill.innerHTML = _buildChkobbaOpponentPillHtml(p, state, { active, isTeammate, isExpanded, offline, dinari });

        pill.onclick = () => {
            _onlineCoupSummaryExpandedId = isExpanded ? null : p.id;
            _showOnlineChkobba(room);
        };
    });

    // Maintain order
    playersToRender.forEach(p => {
        const el = _chkobbaOpponentPillEls.get(p.id);
        if (el) oppCont.appendChild(el);
    });
}

function _maybeShowChkobbaAnnouncement(state) {
    if (!state?.chkobbaEvent) return;
    const key = `${state.chkobbaEvent.playerId}-${state.round}-${state.chkobbaEvent.type}`;
    if (_lastChkobbaAnnounced === key) return;
    _lastChkobbaAnnounced = key;
    _handleChkobbaBroadcastEvent(state.chkobbaEvent);
}

function _renderChkobbaInfoPills(state, me) {
    const trans = (typeof i18n !== 'undefined' && i18n[currentLang]) ? i18n[currentLang] : (i18n?.tn || {});
    const pills = [
        { key: 'deck', icon: '🂠', label: 'كومة', value: state.deck.length, hint: trans.chkobba_deck || 'كوارط مازالت في الكومة' },
        { key: 'score', icon: '🏆', label: 'سكور', value: me?.totalScore || 0, hint: trans.chkobba_scores || 'السكور' },
        { key: 'round', icon: '🔁', label: 'طرح', value: state.round || 1, hint: trans.chkobba_round || 'رقم الطرح الحالي' }
    ];
    const infoCont = document.getElementById('chkobba-round-info');
    if (!infoCont) return;
    infoCont.innerHTML = '';
    pills.forEach(p => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = `chkobba-info-pill${_chkobbaExpandedInfoPill === p.key ? ' is-expanded' : ''}`;
        el.dataset.pill = p.key;
        el.innerHTML = `
            <span class="info-pill-collapsed">${p.icon} <span class="info-pill-label">${p.label}</span> <strong>${p.value}</strong></span>
            ${ _chkobbaExpandedInfoPill === p.key ? `<span class="info-pill-hint">${p.hint}</span>` : '' }
        `;
        el.onclick = () => {
            _chkobbaExpandedInfoPill = _chkobbaExpandedInfoPill === p.key ? null : p.key;
            _renderChkobbaInfoPills(state, me);
        };
        infoCont.appendChild(el);
    });

    // Voice Chat Toggle
    const voiceActive = typeof _voiceOn !== 'undefined' && _voiceOn;
    const vBtn = document.createElement('button');
    vBtn.type = 'button';
    vBtn.className = `chkobba-info-pill voice-info-pill ${voiceActive ? 'voice-active' : ''}`;
    vBtn.innerHTML = `<span class="info-pill-collapsed">${voiceActive ? '🔴' : '🎙️'} <span class="info-pill-label">${voiceActive ? 'نقص الصوت' : 'نحل الصوت'}</span></span>`;
    vBtn.onclick = () => {
        if (typeof _voiceOn !== 'undefined' && _voiceOn) {
            stopVoice();
        } else {
            if (_room) initVoice(_room.code);
        }
        setTimeout(() => _renderChkobbaInfoPills(state, me), 200);
    };
    infoCont.appendChild(vBtn);
}

async function _animateChkobbaDeal(deckEl, handEl, count, onDone) {
    if (_prefersReducedMotion() || !deckEl || !handEl || count < 1) {
        onDone?.(); return;
    }

    // 1. Deck Pulse
    deckEl.style.transition = "transform 140ms var(--ease-pop)";
    deckEl.style.transform = "scale(1.06)";
    await new Promise(r => setTimeout(r, 140));
    deckEl.style.transform = "scale(1)";

    const from = deckEl.getBoundingClientRect();
    const to = handEl.getBoundingClientRect();
    const back = window.ChkobbaLogic.ASSETS.BACK;
    let finished = 0;

    // Compress stagger if many cards to keep sequence ≤ 900ms
    const staggerMs = count > 3 ? 40 : 70;

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const targetRect = {
                left: to.left + (i * 12), // Spread slightly in hand
                top: to.top,
                width: from.width, height: from.height
            };

            _animateChkobbaFlight({
                fromRect: from,
                toRect: targetRect,
                imgSrc: back,
                rotate: (Math.random() - 0.5) * 12,
                duration: 260,
                onDone: () => {
                    finished++;
                    if (finished >= count) onDone?.();
                }
            });
        }, i * staggerMs);
    }
}

function _showOnlineChkobba(room) {
    showScreen('chkobba-screen');
    const state = room.word_obj;
    if (!state) return;

    const me = state.players.find(p => p.id === _myId);
    const isMyTurn = state.players[state.turnIndex].id === _myId;
    const mode = state.mode || '1v1';
    const roomPlayerMeta = (_room?.players || []).reduce((m, p) => { m[p.id] = p; return m; }, {});

    if (!isMyTurn || state.phase === 'setup') _resetChkobbaPlaySession();

    _renderChkobbaOpening(room, state);

    const playLocked = window.ChkobbaLogic.isSetupPhase(state);
    const canInteract = isMyTurn && !playLocked;
    const handDock = document.querySelector('.chkobba-hand-dock');
    handDock?.classList.toggle('is-inactive-turn', state.phase === 'playing' && !isMyTurn);

    const prevSnap = _chkobbaLastSnapshot;
    let dealCount = 0;
    if (me && !_chkobbaSkipDealAnim) {
        if (!prevSnap && me.hand.length > 0) dealCount = me.hand.length;
        else if (prevSnap) dealCount = Math.max(0, me.hand.length - (prevSnap.myHandLen || 0));
    }
    const shouldDealAnim = dealCount > 0 && (!prevSnap || state.deck.length < prevSnap.deckLen);

    _chkobbaLastSnapshot = {
        deckLen: state.deck.length,
        myHandLen: me?.hand.length || 0,
        round: state.round
    };

    _maybeShowChkobbaAnnouncement(state);

    _renderChkobbaOpponentPills(room, state, me, mode, roomPlayerMeta);

    const tableCont = document.getElementById('chkobba-table');
    tableCont.innerHTML = '';
    state.table.forEach((card, idx) => {
        tableCont.appendChild(_renderChkobbaCard(card, {
            zone: 'table',
            index: idx,
            interactive: canInteract
        }));
    });

    const handCont = document.getElementById('chkobba-my-hand');
    const renderHand = () => {
        handCont.innerHTML = '';
        if (me) {
            const total = me.hand.length;
            me.hand.forEach((card, idx) => {
                handCont.appendChild(_renderChkobbaCard(card, {
                    zone: 'hand',
                    index: idx,
                    total,
                    interactive: canInteract
                }));
            });
        }
        if (_chkobbaPlaySession) {
            const armedIdx = _chkobbaPlaySession.handIndex;
            handCont.querySelectorAll('.hand-card').forEach((el, i) => {
                if (i === armedIdx) el.classList.add('is-armed');
            });
            _refreshChkobbaCaptureHighlights();
            if (_chkobbaPlaySession.phase === 'readyCapture') _showChkobbaCaptureReadyBar();
        }
    };

    _renderChkobbaPiles(state, me);

    if (playLocked) {
        _renderChkobbaInfoPills(state, me);
        _ensureChkobbaTableListeners();
        return;
    }

    if (shouldDealAnim) {
        _chkobbaSkipDealAnim = true;
        handCont.innerHTML = '';
        _animateChkobbaDeal(
            document.getElementById('chkobba-deck-pile'),
            handCont,
            dealCount,
            () => {
                _chkobbaSkipDealAnim = false;
                renderHand();
            }
        );
    } else {
        renderHand();
    }

    _renderChkobbaInfoPills(state, me);

    _ensureChkobbaTableListeners();

    const indicator = document.getElementById('coup-turn-indicator');
    if (indicator) {
        indicator.classList.remove('hidden');
        const nameEl = document.getElementById('cti-player-name');
        if (nameEl) nameEl.innerText = state.players[state.turnIndex].name;
        _startOnlineChkobbaTimer(room);
    }
}

let _chkobbaTimer = null;
let _chkobbaTimingOut = false;

function _startOnlineChkobbaTimer(room) {
    clearInterval(_chkobbaTimer);
    const timerEl = document.getElementById('chkobba-turn-timer');
    if (!timerEl) return;

    if (!room.timer_end_at || room.word_obj?.phase !== 'playing') {
        timerEl.classList.add('hidden');
        return;
    }

    timerEl.classList.remove('hidden');

    const tick = () => {
        const endTime = new Date(room.timer_end_at).getTime();
        const left = Math.max(0, Math.ceil((endTime - _syncedNow()) / 1000));

        const m = Math.floor(left / 60).toString().padStart(2, '0');
        const s = (left % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${s}`;

        if (left <= 10) timerEl.style.color = 'var(--danger-color)';
        else timerEl.style.color = '';

        if (left <= 0 && _isHost && !_chkobbaTimingOut && room.word_obj?.phase === 'playing') {
            _chkobbaTimeout();
        }
    };
    tick();
    _chkobbaTimer = setInterval(tick, 500);
}

async function _chkobbaTimeout() {
    if (!_room || _chkobbaTimingOut) return;
    _chkobbaTimingOut = true;
    try {
        const s = _room.word_obj;
        if (!s || s.phase !== 'playing') return;
        const p = s.players[s.turnIndex];
        if (!p || p.hand.length === 0) return;

        const logic = window.ChkobbaLogic;
        let chosenCardIndex = -1;
        let bestMatch = null;

        for (let i = 0; i < p.hand.length; i++) {
            const possible = logic.getValidCaptures(p.hand[i], s.table);
            if (possible.length > 0) {
                chosenCardIndex = i;
                bestMatch = possible[0];
                break;
            }
        }
        if (chosenCardIndex === -1) chosenCardIndex = 0;
        const cardToPlay = p.hand[chosenCardIndex];

        const runActualMutate = async () => {
            await _mutatePlayers(_room.code, (players, room) => {
                const rs = room.word_obj;
                if (rs.phase !== 'playing') return null;
                const rp = rs.players[rs.turnIndex];
                if (!rp || rp.hand.length === 0) return null;

                let cIdx = rp.hand.findIndex(c => c.id === cardToPlay.id);
                if (cIdx === -1) cIdx = 0;
                const card = rp.hand.splice(cIdx, 1)[0];
                const matches = logic.getValidCaptures(card, rs.table);
                const match = matches.length > 0 ? matches[0] : null;

                if (match) {
                    const capturedIds = match.map(c => c.id);
                    const capturedCards = rs.table.filter(c => capturedIds.includes(c.id));
                    rs.table = rs.table.filter(c => !capturedIds.includes(c.id));
                    const allCaptured = [card, ...capturedCards];
                    rp.captured.push(...allCaptured);
                    rs.lastCaptureId = rp.id;
                    if (rs.table.length === 0 && rs.deck.length > 0) {
                        rp.chkobbas++;
                        rs.chkobbaEvent = { type: 'chkobba', playerId: rp.id, name: rp.name };
                    } else if (allCaptured.some(c => c.id === 'diamonds_7') && capturedCards.some(c => c.id === 'diamonds_7')) {
                        rs.chkobbaEvent = { type: 'berria', playerId: rp.id, name: rp.name };
                    }
                } else {
                    rs.table.push(card);
                }
                _advanceChkobbaTurn(rs, room);
                room.word_obj = rs;
                return players;
            }, null, (room, players) => ({ word_obj: room.word_obj, timer_end_at: room.timer_end_at }));
        };

        const isMe = p.id === _myId;
        const fromEl = isMe ? _chkobbaHandCardEl(chosenCardIndex) : _chkobbaOpponentPillEls.get(p.id);
        const toEl = bestMatch ? (_chkobbaOpponentPillEls.get(p.id) || document.getElementById('chkobba-my-capture-pile')) : document.getElementById('chkobba-table');

        if (_prefersReducedMotion() || !fromEl || !toEl) {
            await runActualMutate();
            return;
        }

        _chkobbaAnimating = true;
        if (isMe && fromEl) fromEl.style.opacity = '0';

        if (bestMatch) {
            const flights = [];
            flights.push({
                fromRect: fromEl.getBoundingClientRect(),
                toRect: toEl.getBoundingClientRect(),
                imgSrc: logic.getCardAsset(cardToPlay),
                rotate: 4,
                withGhost: true,
                staggerAfter: 60
            });
            bestMatch.forEach((c, i) => {
                const tEl = document.querySelector(`#chkobba-table .table-card[data-card-id="${c.id}"]`);
                if (tEl) {
                    tEl.style.opacity = '0';
                    flights.push({
                        fromRect: tEl.getBoundingClientRect(),
                        toRect: toEl.getBoundingClientRect(),
                        imgSrc: logic.getCardAsset(c),
                        rotate: (i % 2 === 0 ? 1 : -1) * (6 + i * 2),
                        withGhost: true,
                        staggerAfter: 60
                    });
                }
            });
            _animateChkobbaFlightsSequential(flights, async () => {
                _chkobbaAnimating = false;
                await runActualMutate();
            });
        } else {
            _animateChkobbaFlight({
                fromRect: fromEl.getBoundingClientRect(),
                toRect: toEl.getBoundingClientRect(),
                imgSrc: logic.getCardAsset(cardToPlay),
                rotate: -6,
                onDone: async () => {
                    _chkobbaAnimating = false;
                    await runActualMutate();
                }
            });
        }
    } catch(e) { console.error(e); }
    finally { _chkobbaTimingOut = false; }
}

function _onChkobbaDragStart(e) {
    const cardEl = e.target.closest('.chkobba-card.hand-card');
    if (!cardEl) return;
    if (_chkobbaPlaySession?.phase === 'readyCapture') {
        e.preventDefault();
        return;
    }
    if (!_chkobbaPlaySession) _armChkobbaHandCard(cardEl);
    e.dataTransfer?.setData('text/plain', cardEl.dataset.index);
    cardEl.classList.add('is-dragging');
}

function _onChkobbaDragEnd(e) {
    const cardEl = e.target.closest('.chkobba-card');
    cardEl?.classList.remove('is-dragging');
    document.getElementById('chkobba-table')?.classList.remove('is-drop-target');
    document.getElementById('chkobba-my-capture-pile')?.classList.remove('is-drop-target');
}

async function _onChkobbaTableDrop(e) {
    e.preventDefault();
    document.getElementById('chkobba-table')?.classList.remove('is-drop-target');
    if (!_chkobbaPlaySession) return;

    const targetCardEl = e.target?.closest?.('.table-card');
    if (targetCardEl && _chkobbaPlaySession.phase === 'selecting') {
        _onChkobbaTableCardTap(targetCardEl);
        return;
    }
    if (_chkobbaPlaySession.phase === 'armed' && !targetCardEl) {
        await _commitChkobbaPlayToTable();
    }
}

async function _commitChkobbaCapture() {
    if (_chkobbaAnimating) return;
    const ctx = _getChkobbaPlayContext();
    if (!ctx || !_chkobbaPlaySession || _chkobbaPlaySession.phase !== 'readyCapture') return;

    const handIndex = _chkobbaPlaySession.handIndex;
    const playedCard = _chkobbaPlaySession.playedCard;
    const capturedIds = (_chkobbaPlaySession.captureSet || []).map(c => c.id);
    const logic = ctx.logic;

    const valid = logic.findMatchingCapture(playedCard, ctx.state.table, capturedIds);
    if (!valid) {
        showToast('ماكلة غير صالحة.');
        _resetChkobbaPlaySession();
        return;
    }

    const pileEl = _chkobbaOpponentPillEls.get(_myId) || document.getElementById('chkobba-my-capture-pile');
    const handEl = _chkobbaHandCardEl(handIndex);
    const pileRect = pileEl?.getBoundingClientRect();
    const flights = [];

    if (handEl && pileRect) {
        handEl.style.opacity = '0';
        flights.push({
            fromRect: handEl.getBoundingClientRect(),
            toRect: pileRect,
            imgSrc: logic.getCardAsset(playedCard),
            rotate: 4,
            withGhost: true,
            staggerAfter: 60
        });
    }
    capturedIds.forEach((id, i) => {
        const tableEl = document.querySelector(`#chkobba-table .table-card[data-card-id="${id}"]`);
        const card = ctx.state.table.find(c => c.id === id);
        if (tableEl && pileRect && card) {
            tableEl.style.opacity = '0';
            flights.push({
                fromRect: tableEl.getBoundingClientRect(),
                toRect: pileRect,
                imgSrc: logic.getCardAsset(card),
                rotate: (i % 2 === 0 ? 1 : -1) * (6 + i * 2),
                withGhost: true,
                staggerAfter: 60
            });
        }
    });

    const runMutate = async () => {
        await _mutatePlayers(_room.code, (players, room) => {
            const s = room.word_obj;
            const p = s.players.find(x => x.id === _myId);
            if (!p || s.players[s.turnIndex].id !== _myId) return null;

            const card = p.hand[handIndex];
            if (!card) return null;
            const match = logic.findMatchingCapture(card, s.table, capturedIds);
            if (!match) return null;

            p.hand.splice(handIndex, 1);
            const capturedCards = s.table.filter(c => capturedIds.includes(c.id));
            s.table = s.table.filter(c => !capturedIds.includes(c.id));
            const allCaptured = [card, ...capturedCards];
            p.captured.push(...allCaptured);
            s.lastCaptureId = _myId;

            if (s.table.length === 0 && s.deck.length > 0) {
                p.chkobbas++;
                s.chkobbaEvent = { type: 'chkobba', playerId: _myId, name: p.name };
            } else if (allCaptured.some(c => c.id === 'diamonds_7') && capturedCards.some(c => c.id === 'diamonds_7')) {
                // Trigger Berria ONLY if it was taken from the TABLE
                s.chkobbaEvent = { type: 'berria', playerId: _myId, name: p.name };
            }

            _advanceChkobbaTurn(s, room);
            return players;
        }, null, (room, players) => ({ word_obj: room.word_obj, timer_end_at: room.timer_end_at }));

        _resetChkobbaPlaySession();
    };

    if (_prefersReducedMotion() || !flights.length) {
        await runMutate();
        return;
    }

    _chkobbaAnimating = true;
    _animateChkobbaFlightsSequential(flights, async () => {
        _chkobbaAnimating = false;
        await runMutate();
    });
}

async function _commitChkobbaPlayToTable() {
    if (_chkobbaAnimating) return;
    const ctx = _getChkobbaPlayContext();
    if (!ctx || !_chkobbaPlaySession) return;

    const handIndex = _chkobbaPlaySession.handIndex;
    const playedCard = _chkobbaPlaySession.playedCard;
    const captures = ctx.logic.getValidCaptures(playedCard, ctx.state.table);
    if (captures.length > 0) {
        showToast('لازم تاكل! فما كوارط تنجم تاخذهم.');
        return;
    }

    const handEl = _chkobbaHandCardEl(handIndex);
    const tableEl = document.getElementById('chkobba-table');
    const imgSrc = ctx.logic.getCardAsset(playedCard);

    const tableRect = tableEl?.getBoundingClientRect();
    const tableCardsCount = ctx.state.table.length;
    const targetRect = tableRect ? {
        left: tableRect.left + (tableRect.width / 2) + (tableCardsCount * 12) - 40,
        top: tableRect.top + (tableRect.height / 2),
        width: tableRect.width / 4,
        height: tableRect.height / 2
    } : null;

    const runMutate = async () => {
        await _mutatePlayers(_room.code, (players, room) => {
            const s = room.word_obj;
            const p = s.players.find(x => x.id === _myId);
            if (!p || s.players[s.turnIndex].id !== _myId) return null;

            const card = p.hand.splice(handIndex, 1)[0];
            s.table.push(card);
            _advanceChkobbaTurn(s, room);
            return players;
        }, null, (room, players) => ({ word_obj: room.word_obj, timer_end_at: room.timer_end_at }));

        _resetChkobbaPlaySession();
    };

    if (_prefersReducedMotion() || !handEl || !tableEl) {
        await runMutate();
        return;
    }

    _chkobbaAnimating = true;
    if (handEl) handEl.style.opacity = '0';
    _animateChkobbaFlight({
        fromRect: handEl.getBoundingClientRect(),
        toRect: targetRect || tableEl.getBoundingClientRect(),
        imgSrc,
        rotate: -6,
        onDone: async () => {
            _chkobbaAnimating = false;
            await runMutate();
        }
    });
}

function _advanceChkobbaTurn(state, roomObj) {
    state.turnIndex = (state.turnIndex + 1) % state.players.length;

    const actualRoom = roomObj || _room;
    if (actualRoom && _isHost) {
        const turnTime = actualRoom.config?.chkobbaTurnTime || 45;
        const timerEndAt = new Date(_syncedNow() + turnTime * 1000).toISOString();
        actualRoom.timer_end_at = timerEndAt;
    }

    // Check if everyone played their 3 cards
    const allEmpty = state.players.every(p => p.hand.length === 0);
    if (allEmpty) {
        if (state.deck.length > 0) {
            // Deal next 3 cards
            state.players.forEach(p => {
                p.hand = [state.deck.pop(), state.deck.pop(), state.deck.pop()];
            });
        } else {
            // End of round scoring
            _endChkobbaRound(state, roomObj);
        }
    }
}

function _endChkobbaRound(state, roomObj) {
    // Last capture takes leftovers
    if (state.table.length > 0 && state.lastCaptureId) {
        const winner = state.players.find(p => p.id === state.lastCaptureId);
        if (winner) {
            winner.captured.push(...state.table);
        }
        state.table = [];
    }

    const logic = window.ChkobbaLogic;
    const capturedMap = {};
    const chkobbaMap = {};
    state.players.forEach(p => {
        capturedMap[p.id] = p.captured;
        chkobbaMap[p.id] = p.chkobbas;
    });

    const scores = logic.calculateScores(capturedMap, chkobbaMap, state.teams);

    let gameOver = false;
    state.players.forEach(p => {
        const roundScore = scores[p.id].total;
        p.totalScore += roundScore;
        p.captured = [];
        p.chkobbas = 0;
    });

    // Check game over based on team or individual score
    state.players.forEach(p => {
        if (p.totalScore >= state.targetScore) gameOver = true;
    });

    if (gameOver) {
        state.phase = 'finished';
        state.log = 'الطرح وفى!';
    } else {
        // Reset for next round
        const deck = logic.createDeck();
        state.deck = deck;
        state.table = [state.deck.pop(), state.deck.pop(), state.deck.pop(), state.deck.pop()];
        state.players.forEach(p => {
            p.hand = [state.deck.pop(), state.deck.pop(), state.deck.pop()];
        });
        state.round++;
        state.turnIndex = 0; // Usually dealer moves, but we'll keep it simple

        const actualRoom = roomObj || _room;
        if (actualRoom && _isHost) {
            const turnTime = actualRoom.config?.chkobbaTurnTime || 45;
            const timerEndAt = new Date(_syncedNow() + turnTime * 1000).toISOString();
            actualRoom.timer_end_at = timerEndAt;
        }
    }
}

function _spawnChkobbaConfetti(layer, variant = 'gold') {
    if (_prefersReducedMotion() || !layer) return;
    const colors = variant === 'berria'
        ? ['#528c71', '#74b9ff', '#a8e6cf', '#fff']
        : ['#f1c051', '#ffeaa7', '#fdcb6e', '#fff'];
    for (let i = 0; i < 14; i++) {
        const bit = document.createElement('span');
        bit.className = 'chkobba-confetti-bit';
        bit.style.left = `${42 + Math.random() * 16}%`;
        bit.style.top = `${44 + Math.random() * 12}%`;
        bit.style.background = colors[i % colors.length];
        bit.style.setProperty('--confetti-dx', `${(Math.random() - 0.5) * 120}px`);
        bit.style.setProperty('--confetti-dy', `${-40 - Math.random() * 80}px`);
        bit.style.setProperty('--confetti-rot', `${Math.random() * 540}deg`);
        bit.style.animationDelay = `${i * 35}ms`;
        layer.appendChild(bit);
        setTimeout(() => bit.remove(), 1400);
    }
}

function _handleChkobbaBroadcastEvent(event) {
    const layer = document.getElementById('chkobba-deal-layer');
    const isBerria = event.type === 'berria';
    const isChkobba = event.type === 'chkobba';

    if (!isBerria && !isChkobba) return;

    const wrap = document.createElement('div');
    wrap.className = `chkobba-celebration-wrap${isBerria ? ' is-berria' : ''}`;

    const cardFlip = document.createElement('div');
    cardFlip.className = 'chkobba-celebration-card';
    const flipImg = document.createElement('img');
    flipImg.alt = '';
    flipImg.src = isBerria
        ? window.ChkobbaLogic.getCardAsset({ suit: 'diamonds', value: 7 })
        : window.ChkobbaLogic.ASSETS.BACK;
    cardFlip.appendChild(flipImg);
    wrap.appendChild(cardFlip);

    const announce = document.createElement('div');
    announce.className = `chkobba-announcement chkobba-announcement--celebration${isBerria ? ' is-berria' : ''}`;
    announce.innerText = isBerria ? 'السبعة الحية!' : 'شكبّة!';
    wrap.appendChild(announce);

    document.body.appendChild(wrap);
    _spawnChkobbaConfetti(layer, isBerria ? 'berria' : 'gold');
    _sfx.win();

    setTimeout(() => wrap.remove(), isBerria ? 1850 : 2000);
}

// Expose for verification/debugging
window._showOnlineChkobba = _showOnlineChkobba;

/**
 * QUEUE & TOURNAMENT BRACKET SYSTEM
 */

async function _updateChkobbaTournament(room) {
    if (!_isHost || !room.config.chkobbaTournament) return;
    const state = room.word_obj;
    if (state.phase !== 'finished') return;

    // Check if there are other matches in this "Tournament Room"
    // For now, let's assume one room = one tournament bracket.
    // If we have more than 4 players, they should be split into matches.
}

function _renderMatchmakingQueue(room) {
    // Basic queue UI if needed
}

/**
 * SCALABLE TOURNAMENT & MATCHMAKING
 * Handles splitting players into parallel matches and advancing winners.
 */

async function _startTournament(room) {
    if (!_isHost || !room) return;
    const allPlayers = room.players || [];
    if (allPlayers.length < 2) return;

    const matches = [];
    const playersPerMatch = room.config.chkobbaMode === '1v1' ? 2 : room.config.chkobbaMode === '1v1v1' ? 3 : 4;

    const shuffled = [...allPlayers].sort(() => 0.5 - Math.random());
    for (let i = 0; i < shuffled.length; i += playersPerMatch) {
        const matchPlayers = shuffled.slice(i, i + playersPerMatch);
        if (matchPlayers.length < 2 && matches.length > 0) {
            // Add lone player to last match or handle bye
            matches[matches.length-1].players.push(...matchPlayers.map(p => ({id:p.id, name:p.name, totalScore:0, hand:[], captured:[], chkobbas:0})));
        } else {
            matches.push({
                id: `m_${Date.now()}_${i}`,
                players: matchPlayers.map(p => ({ id: p.id, name: p.name, totalScore: 0, hand: [], captured: [], chkobbas: 0 })),
                state: 'playing',
                winner: null
            });
        }
    }

    matches.forEach(m => _initMatch(m, room.config));

    const tournamentState = { matches, round: 1, status: 'ongoing' };
    try {
        await _update(room.code, { state: 'chkobba_tournament', word_obj: tournamentState });
    } catch(e) { console.error(e); }
}

function _showTournamentBracket(room) {
    showScreen('chkobba-screen');
    const state = room.word_obj;
    const container = document.getElementById('chkobba-table');

    // Clear styles that might interfere
    container.style.aspectRatio = 'auto';
    container.style.width = '100%';
    container.style.height = 'auto';
    container.style.borderRadius = 'var(--radius-lg)';

    container.innerHTML = '<div class="tournament-bracket"></div>';
    const bracket = container.querySelector('.tournament-bracket');

    state.matches.forEach((m, idx) => {
        const matchEl = document.createElement('div');
        matchEl.className = 'tournament-match';
        const isMyMatch = m.players.some(p => p.id === _myId);

        matchEl.innerHTML = `
            <div class="match-header">طرح ${idx + 1} - ${m.state === 'finished' ? 'وفى' : 'يخدم'}</div>
            <div class="match-players">
                ${m.players.map(p => `
                    <div class="match-player ${m.winner === p.id ? 'winner' : ''}">
                        <span>${_esc(p.name)}</span>
                        <span>${p.totalScore}</span>
                    </div>
                `).join('')}
            </div>
            ${isMyMatch && m.state === 'playing' ? `<button class="primary-btn join-match-btn" data-mid="${m.id}">ادخل العب</button>` : ''}
        `;

        if (isMyMatch && m.state === 'playing') {
            matchEl.querySelector('.join-match-btn').onclick = () => _enterTournamentMatch(m.id);
        }
        bracket.appendChild(matchEl);
    });
}

async function _enterTournamentMatch(matchId) {
    // Concept: Temporary state swap or sub-room logic
    // For now, let's keep it simple: the UI switches to playing view if your match is active
    _renderActiveTournamentMatch(matchId);
}

function _renderActiveTournamentMatch(matchId) {
    const state = _room.word_obj;
    const match = state.matches.find(m => m.id === matchId);
    if (!match) return;

    // Use _showOnlineChkobba with a proxy object
    const proxyRoom = { ..._room, word_obj: match };
    _showOnlineChkobba(proxyRoom);

    // Add "Back to Bracket" button
    const backBtn = document.createElement('button');
    backBtn.className = 'secondary-btn';
    backBtn.innerText = 'الجدول';
    backBtn.onclick = () => _showTournamentBracket(_room);
    document.getElementById('chkobba-round-info').appendChild(backBtn);
}

function _initMatch(match, config) {
    const logic = window.ChkobbaLogic;
    const gameState = logic.createNewGameState(
        match.players.map(p => ({ id: p.id, name: p.name })),
        { mode: config.chkobbaMode || '1v1', targetScore: config.chkobbaTarget || 21 }
    );
    Object.assign(match, gameState);
}
