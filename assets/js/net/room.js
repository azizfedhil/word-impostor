'use strict';

// ============================================================
// NET — Room
// Supabase client, identity, server-time sync, pure DB helpers,
// room CRUD (create / join / kick / subscribe), and presence.
//
// No game logic. No screen rendering beyond error display.
// Everything consumed by online.js coordinator and games/*/online.js
// via shared global scope.
// ============================================================


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


window.onlineMode = false;
let _room = null, _channel = null, _isHost = false, _onlineTimer = null;
let _timerSyncTicker = null, _timerSyncState = null, _lastOnlineTimerSecond = null;
let _votingTimer = null, _lastVotingTimerSecond = null;
let _votingSyncTicker = null, _votingSyncState = null;
let _onlinePresenceIds = new Set();
let _localPlayerDesired = {};
let _playerPatchReconcileTimers = {};
let _lastHandledState = null;
let _movingToVoting = false, _processingVotes = false;
function _clearErr() { _err(''); }
function _getLang(room) { return (room.config&&room.config.lang)||'tn'; }
function _getTrans(room) { return i18n[_getLang(room)]; }

function _chkobbaMinPlayers(room) {
    const mode = room?.config?.chkobbaMode || '1v1';
    if (mode === '1v1') return 2;
    if (mode === '1v1v1') return 3;
    return 4;
}

function _lobbyMinPlayers(room) {
    if (room?.config?.versusAI) return 1;
    if (_isChkobbaRoom(room)) return _chkobbaMinPlayers(room);
    if (_isCoupRoom(room)) return 2;
    return 3;
}
const _coupCards = {
    duke: { name:'الشلغمي', icon:'<i class="coup-icon-inline"></i>', img:'assets/coup/duke.png', img512:'assets/coup/duke512.png', attack:'هجوم: ياخو 3 فلوس من البنك.', defense:'دفاع: يسكّر اعانة +2 متاع أي لاعب.' },
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
function _rememberLastRoom(code) {
    if (!code) return;
    try { localStorage.setItem(ONLINE_LAST_ROOM_KEY, code); } catch(_) {}
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
    const needed = Math.ceil(alive.length * 0.6);
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
            window.onlineMode = true; _subscribe(code); _handleStateChange(room); return;
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


// ============================================================
// Expose on window for backward-compat and cross-file access
// ============================================================
window._supa                       = _supa;
window._syncedNow                  = _syncedNow;
window._syncServerTime             = _syncServerTime;
window._fetchRoom                  = _fetchRoom;
window._update                     = _update;
window._mutatePlayers              = _mutatePlayers;
window._commitMyPlayerPatch        = _commitMyPlayerPatch;
window._clearPlayerPatchReconciles = _clearPlayerPatchReconciles;
window._applyLocalPlayerOverrides  = _applyLocalPlayerOverrides;
window._subscribe                  = _subscribe;
window._createRoom                 = _createRoom;
window._joinRoom                   = _joinRoom;
window._kickLobbyPlayer            = _kickLobbyPlayer;
window._generateQRCode             = _generateQRCode;
window._checkAutoJoin              = _checkAutoJoin;
// NOTE: _me, _esc, _err are top-level functions in online.js (loads after
// this file) — the browser exposes them on window automatically. Do NOT
// export them here or you get "X is not defined" ReferenceErrors.
window._clearErr                   = _clearErr;
window._getLang                    = _getLang;
window._getTrans                   = _getTrans;
window._lobbyMinPlayers            = _lobbyMinPlayers;
window._playerOnline               = _playerOnline;
window._playerFigured              = _playerFigured;
window._figuredThresholdMet        = _figuredThresholdMet;
window._canAskQuestion             = _canAskQuestion;
window._randomQuestion             = _randomQuestion;
window._restoreOnlineName          = _restoreOnlineName;
window._saveOnlineName             = _saveOnlineName;
window._rememberLastRoom           = _rememberLastRoom;
window._refreshPresenceViews       = _refreshPresenceViews;
window._handleKickedFromLobby      = _handleKickedFromLobby;
window._storeMyId                  = _storeMyId;
window._sleep                      = _sleep;
