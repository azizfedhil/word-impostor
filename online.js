// ============================================================
// online.js — Supabase Multiplayer for لعبة الدخيل
// ============================================================
// 🔧 STEP 1: Replace these two values with your Supabase project details
//    Dashboard → Settings → API → Project URL / anon public key
// ============================================================

const SUPABASE_URL      = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// ---- Init ----
const _supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Stable identity for this browser tab/session
let _myId = sessionStorage.getItem('dakheel_pid');
if (!_myId) {
    _myId = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem('dakheel_pid', _myId);
}

// ---- State ----
window.onlineMode  = false;   // read by app.js go-to-vote-btn guard
let _room          = null;    // latest full room object
let _channel       = null;    // Supabase Realtime channel
let _isHost        = false;
let _myName        = '';
let _onlineTimer   = null;    // setInterval handle for discussion timer

// ============================================================
// UTILITIES
// ============================================================

function _genCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function _me(room) {
    return (room.players || []).find(p => p.id === _myId) || null;
}

function _err(msg) {
    const el = document.getElementById('online-setup-error');
    if (el) el.innerText = msg;
}

function _clearErr() { _err(''); }

function _getLang(room) { return (room.config && room.config.lang) || 'tn'; }

function _getTrans(room) { return i18n[_getLang(room)]; }

// Wrapper so _update never resolves with a stale object
async function _update(code, patch) {
    const { data, error } = await _supa
        .from('rooms')
        .update(patch)
        .eq('code', code)
        .select()
        .single();
    if (error) throw error;
    _room = data;
    return data;
}

// ============================================================
// REALTIME SUBSCRIPTION
// ============================================================

function _subscribe(code) {
    if (_channel) _supa.removeChannel(_channel);

    _channel = _supa
        .channel('room:' + code)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'rooms', filter: 'code=eq.' + code },
            payload => {
                _room = payload.new;
                _handleStateChange(payload.new);
            }
        )
        .subscribe(status => {
            if (status === 'SUBSCRIBED') console.log('[online] subscribed to', code);
        });
}

function _handleStateChange(room) {
    switch (room.state) {
        case 'lobby':      _renderLobby(room);        break;
        case 'reveal':     _showMyCard(room);          break;
        case 'discussion': _startClientTimer(room);    break;
        case 'voting':     _showOnlineVoting(room);    break;
        case 'result':     _showOnlineResult(room);    break;
    }
}

// ============================================================
// CREATE / JOIN ROOM
// ============================================================

async function _createRoom() {
    _clearErr();
    const nameEl = document.getElementById('online-player-name');
    _myName = (nameEl && nameEl.value.trim()) || '';
    if (!_myName) { _err('حط اسمك أولاً!'); return; }

    // Snapshot current setup-screen config
    const config = _snapshotConfig();

    const code = _genCode();
    const hostPlayer = _mkPlayer(true);

    try {
        const { data, error } = await _supa
            .from('rooms')
            .insert({
                code,
                host_id:      _myId,
                state:        'lobby',
                config,
                word_obj:     null,
                players:      [hostPlayer],
                starter_player: null,
                timer_end_at: null,
                result:       null
            })
            .select()
            .single();

        if (error) throw error;

        _room    = data;
        _isHost  = true;
        window.onlineMode = true;

        _subscribe(code);
        showScreen('online-lobby-screen');
        _renderLobby(data);

    } catch (e) {
        console.error(e);
        _err('خطأ في إنشاء الغرفة — جرب مجدداً');
    }
}

async function _joinRoom() {
    _clearErr();
    const nameEl = document.getElementById('online-player-name');
    const codeEl = document.getElementById('room-code-input');
    _myName = (nameEl && nameEl.value.trim()) || '';
    const code = (codeEl && codeEl.value.trim().toUpperCase()) || '';

    if (!_myName) { _err('حط اسمك أولاً!'); return; }
    if (code.length < 4) { _err('أدخل كود الغرفة!'); return; }

    try {
        const { data: room, error } = await _supa
            .from('rooms')
            .select()
            .eq('code', code)
            .single();

        if (error || !room) { _err('ما لقيناش الغرفة!'); return; }
        if (room.state !== 'lobby') { _err('اللعبة بدأت بالفعل!'); return; }

        // Reconnect if already in room
        const existing = room.players.find(p => p.id === _myId);
        if (existing) {
            _room   = room;
            _isHost = room.host_id === _myId;
            _myName = existing.name;
            window.onlineMode = true;
            _subscribe(code);
            showScreen('online-lobby-screen');
            _renderLobby(room);
            return;
        }

        const newPlayer = _mkPlayer(false);
        const updated   = await _update(code, { players: [...room.players, newPlayer] });

        _room   = updated;
        _isHost = false;
        window.onlineMode = true;

        _subscribe(code);
        showScreen('online-lobby-screen');
        _renderLobby(updated);

    } catch (e) {
        console.error(e);
        _err('خطأ في الانضمام — جرب مجدداً');
    }
}

function _mkPlayer(isHost) {
    return {
        id:         _myId,
        name:       _myName,
        isHost,
        isImpostor: false,
        customHint: '',
        eliminated: false,
        hasSeenCard: false,
        vote:       null
    };
}

// ============================================================
// LOBBY
// ============================================================

function _renderLobby(room) {
    // Only navigate here if we're in the lobby/online screens
    const cur = document.querySelector('.screen.active');
    const onOnlineScreen = cur && ['online-lobby-screen','online-setup-screen'].includes(cur.id);
    if (!onOnlineScreen) showScreen('online-lobby-screen');

    document.getElementById('display-room-code').innerText = room.code;

    const list = document.getElementById('lobby-players-list');
    list.innerHTML = '';
    room.players.forEach(p => {
        const div = document.createElement('div');
        div.className = 'lobby-player-item';
        div.innerHTML =
            (p.isHost ? '<span class="player-crown">👑</span>' : '<span class="player-icon">👤</span>') +
            '<span class="player-name-lbl">' + p.name + '</span>' +
            (p.id === _myId ? '<span class="you-tag">(أنا)</span>' : '');
        list.appendChild(div);
    });

    const startBtn  = document.getElementById('online-start-btn');
    const waitMsg   = document.getElementById('lobby-wait-msg');

    if (_isHost) {
        startBtn.classList.remove('hidden');
        const n = room.players.length;
        if (n < 3) {
            startBtn.disabled = true;
            startBtn.style.opacity = '0.5';
            waitMsg.innerText = `⏳ نستنا لاعبين... (${n}/3 على الأقل)`;
        } else {
            startBtn.disabled = false;
            startBtn.style.opacity = '';
            waitMsg.innerText = `✅ ${n} لاعبين — يمكن تبدأ!`;
        }
    } else {
        startBtn.classList.add('hidden');
        waitMsg.innerText = `⏳ نستنا على الهوست يبدأ... (${room.players.length} لاعبين)`;
    }
}

// ============================================================
// START GAME (Host only)
// ============================================================

async function _startOnlineGame() {
    if (!_isHost || !_room) return;

    const config     = _room.config;
    const lang       = config.lang || 'tn';
    const wordList   = lang === 'x18' ? adultWordsDB : regularWordsDB;

    if (!wordList || wordList.length === 0) {
        alert('الكلمات لسا ما اتحملتش. حاول مجدداً.');
        return;
    }

    const allPlayers  = _room.players;
    let impostorCount = config.impostors || 1;

    if (config.randomImpostors) {
        impostorCount = Math.floor(Math.random() * Math.floor(allPlayers.length / 2)) + 1;
    }

    const wordObj = wordList[Math.floor(Math.random() * wordList.length)];
    const noHints = config.noHints || lang === 'x18';

    // Reset player game state
    let players = allPlayers.map(p => ({
        ...p,
        isImpostor:  false,
        customHint:  '',
        eliminated:  false,
        hasSeenCard: false,
        vote:        null
    }));

    // Assign impostors
    const isAllImpostorRound = config.chaos && Math.random() < 0.15;
    if (isAllImpostorRound) {
        players.forEach(p => { p.isImpostor = true; });
    } else {
        const idx = [...Array(players.length).keys()].sort(() => 0.5 - Math.random());
        for (let i = 0; i < impostorCount; i++) players[idx[i]].isImpostor = true;
    }

    // Assign hints
    if (!noHints) {
        const impostors = players.filter(p => p.isImpostor);
        if (config.allCorrectHints) {
            impostors.forEach(p => { p.customHint = wordObj.hint || ''; });
        } else if (impostors.length === 1) {
            impostors[0].customHint = wordObj.hint || '';
        } else {
            const lucky = Math.floor(Math.random() * impostors.length);
            const wrongHints = wordList
                .filter(w => w.word !== wordObj.word)
                .map(w => w.hint)
                .sort(() => 0.5 - Math.random());
            let hi = 0;
            impostors.forEach((p, i) => {
                p.customHint = (i === lucky) ? (wordObj.hint || '') : (wrongHints[hi++ % wrongHints.length] || '');
            });
        }
    }

    try {
        await _update(_room.code, {
            state:    'reveal',
            word_obj: wordObj,
            players,
            timer_end_at: null,
            result:   null
        });
    } catch (e) {
        console.error(e);
        alert('خطأ في بدء اللعبة!');
    }
}

// ============================================================
// CARD REVEAL (each player on their own device)
// ============================================================

function _showMyCard(room) {
    showScreen('online-card-screen');

    const me = _me(room);
    if (!me) return;

    const lang    = _getLang(room);
    const trans   = i18n[lang];
    const noHints = room.config.noHints || lang === 'x18';

    // Already confirmed → go straight to waiting view
    if (me.hasSeenCard) {
        _renderCardWaiting(room);
        return;
    }

    // Build the flip card
    const container = document.getElementById('online-card-container');
    container.innerHTML = '';
    document.getElementById('online-seen-btn').classList.add('hidden');
    document.getElementById('online-waiting-zone').classList.add('hidden');

    let roleText;
    if (me.isImpostor) {
        roleText = noHints
            ? trans.impostor_role
            : `${trans.impostor_role}<br><br><span style="font-size:16px;">${trans.hint_label}</span><br>${me.customHint}`;
    } else {
        roleText = `${trans.citizen_role}<br><br><span style="font-size:16px;">${trans.word_label}</span><br>${room.word_obj.word}`;
    }

    const card = document.createElement('div');
    card.className = 'flip-card';
    card.innerHTML = `
        <div class="flip-card-inner">
            <div class="flip-card-front"><span>${trans.card_of}${me.name}</span></div>
            <div class="flip-card-back"><span>${roleText}</span></div>
        </div>`;

    const seenBtn = document.getElementById('online-seen-btn');

    const showCard = e => { e.preventDefault(); card.classList.add('flipped'); };
    const hideCard = e => {
        e.preventDefault();
        if (!card.classList.contains('flipped')) return;
        card.classList.remove('flipped');
        seenBtn.classList.remove('hidden');
    };

    card.addEventListener('mousedown', showCard);
    card.addEventListener('mouseup',   hideCard);
    card.addEventListener('mouseleave', hideCard);
    card.addEventListener('touchstart', showCard, { passive: false });
    card.addEventListener('touchend',   hideCard, { passive: false });
    card.addEventListener('touchcancel', hideCard, { passive: false });

    container.appendChild(card);
}

async function _confirmSeen() {
    if (!_room) return;
    const players = _room.players.map(p =>
        p.id === _myId ? { ...p, hasSeenCard: true } : p
    );

    document.getElementById('online-seen-btn').classList.add('hidden');

    try {
        const updated = await _update(_room.code, { players });
        _renderCardWaiting(updated);

        // If host and everyone has seen, enable the start-discussion button
        _checkAllSeen(updated);
    } catch (e) {
        console.error(e);
    }
}

function _renderCardWaiting(room) {
    const container = document.getElementById('online-card-container');
    container.innerHTML = '<div class="card-done-badge">✅</div>';

    const zone = document.getElementById('online-waiting-zone');
    zone.classList.remove('hidden');

    const statusEl = document.getElementById('online-seen-status');
    statusEl.innerHTML = '';
    room.players.filter(p => !p.eliminated).forEach(p => {
        const div = document.createElement('div');
        div.className = 'seen-status-item';
        div.innerHTML = (p.hasSeenCard ? '✅ ' : '⏳ ') + p.name;
        statusEl.appendChild(div);
    });

    _checkAllSeen(room);
}

function _checkAllSeen(room) {
    const alive   = room.players.filter(p => !p.eliminated);
    const allSeen = alive.every(p => p.hasSeenCard);
    const discBtn = document.getElementById('start-discussion-btn');

    if (_isHost) {
        discBtn.classList.toggle('hidden', !allSeen);
        document.getElementById('online-waiting-text').innerText =
            allSeen ? '✅ كل الناس شافت كراتيبها!' : '⏳ نستنا الكل يشوف كارطتو...';
    } else {
        discBtn.classList.add('hidden');
        document.getElementById('online-waiting-text').innerText =
            allSeen ? '⏳ نستنا الهوست يبدأ النقاش...' : '⏳ نستنا الكل يشوف كارطتو...';
    }
}

// ============================================================
// DISCUSSION TIMER
// ============================================================

async function _startDiscussion() {
    if (!_isHost || !_room) return;

    const seconds    = (_room.config.timer || 3) * 60;
    const timerEndAt = new Date(Date.now() + seconds * 1000).toISOString();
    const alive      = _room.players.filter(p => !p.eliminated);
    const starter    = alive[Math.floor(Math.random() * alive.length)];

    try {
        await _update(_room.code, {
            state:         'discussion',
            starter_player: starter.name,
            timer_end_at:  timerEndAt
        });
    } catch (e) {
        console.error(e);
    }
}

function _startClientTimer(room) {
    showScreen('timer-screen');

    const lang  = _getLang(room);
    const trans = i18n[lang];

    document.getElementById('starter-player').innerText =
        `${trans.starter_is}${room.starter_player}`;

    if (_onlineTimer) clearInterval(_onlineTimer);

    const endTime = new Date(room.timer_end_at).getTime();

    const tick = () => {
        const left = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        const m = Math.floor(left / 60).toString().padStart(2, '0');
        const s = (left % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').innerText = `${m}:${s}`;

        if (left <= 0) {
            clearInterval(_onlineTimer);
            if (_isHost) _moveToVoting();
        }
    };

    tick();
    _onlineTimer = setInterval(tick, 500);

    // Override the "skip to vote" button
    document.getElementById('go-to-vote-btn').onclick = () => {
        if (!_isHost) {
            _showToast('بس الهوست يقدر يوقف الوقت!');
            return;
        }
        clearInterval(_onlineTimer);
        _moveToVoting();
    };
}

async function _moveToVoting() {
    if (!_isHost || !_room) return;
    try {
        await _update(_room.code, { state: 'voting' });
    } catch (e) { console.error(e); }
}

// ============================================================
// VOTING
// ============================================================

function _showOnlineVoting(room) {
    showScreen('voting-screen');

    const votingList = document.getElementById('voting-list');
    votingList.innerHTML = '';

    const me       = _me(room);
    const hasVoted = me && me.vote !== null;

    room.players.filter(p => !p.eliminated).forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'vote-btn';

        const voteCount = room.players.filter(p => p.vote === player.id).length;
        const voteBadge = voteCount > 0 ? ` <span class="vote-count">(${voteCount})</span>` : '';
        btn.innerHTML = `🗳️ ${player.name}${voteBadge}`;

        if (hasVoted) {
            btn.disabled = true;
            if (me.vote === player.id) btn.classList.add('my-vote');
        } else if (player.id === _myId) {
            btn.disabled = true;
            btn.title = 'ما تقدرش تصوت على روحك';
        } else {
            btn.addEventListener('click', () => _castVote(player.id));
        }

        votingList.appendChild(btn);
    });

    // Check if voting is complete (host processes result)
    const alive    = room.players.filter(p => !p.eliminated);
    const allVoted = alive.length > 0 && alive.every(p => p.vote !== null);
    if (allVoted && _isHost) {
        setTimeout(() => _processVotes(room), 800);
    }
}

async function _castVote(targetId) {
    if (!_room) return;
    const players = _room.players.map(p =>
        p.id === _myId ? { ...p, vote: targetId } : p
    );

    try {
        const updated = await _update(_room.code, { players });

        // Re-render voting immediately with new vote counts
        _showOnlineVoting(updated);

        // Host checks if all voted
        const alive    = updated.players.filter(p => !p.eliminated);
        const allVoted = alive.length > 0 && alive.every(p => p.vote !== null);
        if (allVoted && _isHost) {
            setTimeout(() => _processVotes(updated), 800);
        }
    } catch (e) {
        console.error(e);
    }
}

async function _processVotes(room) {
    if (!_isHost) return;

    const alive = room.players.filter(p => !p.eliminated);

    // Tally votes
    const tally = {};
    alive.forEach(p => {
        if (p.vote) tally[p.vote] = (tally[p.vote] || 0) + 1;
    });

    // Player with most votes
    let maxV = 0, votedId = null;
    Object.entries(tally).forEach(([id, count]) => {
        if (count > maxV) { maxV = count; votedId = id; }
    });

    if (!votedId) return;

    const votedPlayer = room.players.find(p => p.id === votedId);
    if (!votedPlayer) return;

    const isElim  = room.config.elimination;
    let outcome;
    let players   = room.players.map(p =>
        p.id === votedId ? { ...p, eliminated: isElim ? true : p.eliminated } : p
    );

    if (!isElim) {
        outcome = votedPlayer.isImpostor ? 'correct_guess' : 'wrong_guess';
    } else {
        const remImps  = players.filter(p => p.isImpostor && !p.eliminated);
        const remRegs  = players.filter(p => !p.isImpostor && !p.eliminated);
        if (remImps.length === 0)               outcome = 'all_impostors_dead';
        else if (remImps.length >= remRegs.length) outcome = 'impostors_win';
        else                                    outcome = 'continue';
    }

    try {
        await _update(room.code, {
            state:   'result',
            players,
            result:  { votedPlayerId: votedId, outcome }
        });
    } catch (e) { console.error(e); }
}

// ============================================================
// RESULT
// ============================================================

function _showOnlineResult(room) {
    showScreen('result-screen');

    const trans    = _getTrans(room);
    const result   = room.result;
    const resultMsg = document.getElementById('result-message');
    const revealBox = document.getElementById('impostors-reveal');
    const nextBtn   = document.getElementById('next-round-btn');
    revealBox.innerHTML = '';

    if (!result) return;

    const voted = room.players.find(p => p.id === result.votedPlayerId);
    const name  = voted ? voted.name : '?';

    const allImpostors = room.players.filter(p => p.isImpostor).map(p => p.name).join(' و ');
    const wordLine     = `${trans.word_was} <strong>${room.word_obj ? room.word_obj.word : '?'}</strong>`;

    switch (result.outcome) {
        case 'correct_guess':
            triggerAnimation('win');
            resultMsg.innerText = trans.correct_guess.replace('{name}', name);
            revealBox.innerHTML = `${trans.impostors_were}<br><strong style="color:var(--accent-color);">${allImpostors}</strong><br><br>${wordLine}`;
            break;
        case 'wrong_guess':
            triggerAnimation('lose');
            resultMsg.innerText = trans.wrong_guess.replace('{name}', name);
            revealBox.innerHTML = `${trans.impostors_were}<br><strong style="color:var(--accent-color);">${allImpostors}</strong><br><br>${wordLine}`;
            break;
        case 'all_impostors_dead':
            triggerAnimation('win');
            resultMsg.innerText = trans.all_impostors_dead;
            revealBox.innerHTML = wordLine;
            break;
        case 'impostors_win':
            triggerAnimation('lose');
            resultMsg.innerText = trans.impostors_win;
            revealBox.innerHTML = `${trans.impostors_were}<br><strong style="color:var(--accent-color);">${allImpostors}</strong><br><br>${wordLine}`;
            break;
        case 'continue':
            resultMsg.innerText = trans.eliminated_msg.replace('{name}', name);
            revealBox.innerHTML = trans.elimination_cliffhanger;
            if (_isHost) {
                nextBtn.innerText   = trans.continue_discussion;
                nextBtn.onclick     = () => _continueDiscussion(room);
            } else {
                nextBtn.innerText   = '⏳ نستنا على الهوست...';
                nextBtn.disabled    = true;
            }
            return; // early return — don't set the "next round" button
    }

    if (_isHost) {
        nextBtn.innerText = trans.next_round_btn;
        nextBtn.disabled  = false;
        nextBtn.onclick   = () => _resetToLobby();
    } else {
        nextBtn.innerText = '⏳ نستنا على الهوست...';
        nextBtn.disabled  = true;
    }
}

async function _continueDiscussion(room) {
    if (!_isHost) return;

    const seconds    = 60;
    const timerEndAt = new Date(Date.now() + seconds * 1000).toISOString();
    const alive      = room.players.filter(p => !p.eliminated);
    const starter    = alive[Math.floor(Math.random() * alive.length)];

    // Reset votes only
    const players = room.players.map(p => ({ ...p, vote: null }));

    try {
        await _update(room.code, {
            state:          'discussion',
            starter_player: starter.name,
            timer_end_at:   timerEndAt,
            players
        });
    } catch (e) { console.error(e); }
}

async function _resetToLobby() {
    if (!_isHost || !_room) return;

    const players = _room.players.map(p => ({
        ...p,
        isImpostor:  false,
        customHint:  '',
        eliminated:  false,
        hasSeenCard: false,
        vote:        null
    }));

    try {
        await _update(_room.code, {
            state:          'lobby',
            word_obj:       null,
            players,
            starter_player: null,
            timer_end_at:   null,
            result:         null
        });
    } catch (e) { console.error(e); }
}

// ============================================================
// LEAVE ROOM
// ============================================================

async function _leaveRoom() {
    if (!_room) {
        window.onlineMode = false;
        showScreen('setup-screen');
        return;
    }

    try {
        if (_isHost) {
            await _supa.from('rooms').delete().eq('code', _room.code);
        } else {
            const players = _room.players.filter(p => p.id !== _myId);
            await _supa.from('rooms').update({ players }).eq('code', _room.code);
        }
    } catch (e) { console.error(e); }

    if (_channel) { _supa.removeChannel(_channel); _channel = null; }
    if (_onlineTimer) { clearInterval(_onlineTimer); _onlineTimer = null; }

    _room   = null;
    _isHost = false;
    window.onlineMode = false;
    showScreen('setup-screen');
}

// ============================================================
// CONFIG SNAPSHOT (reads current setup-screen state)
// ============================================================

function _snapshotConfig() {
    const safe = id => {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    };
    return {
        lang:            currentLang,
        impostors:       impostorConfig  || 1,
        timer:           timerConfig     || 3,
        randomImpostors: safe('random-impostors-toggle'),
        chaos:           safe('all-impostors-toggle'),
        elimination:     safe('elimination-mode'),
        noHints:         safe('no-hints-toggle'),
        allCorrectHints: safe('all-correct-hints-toggle')
    };
}

// ============================================================
// SMALL TOAST NOTIFICATION
// ============================================================

function _showToast(msg) {
    let toast = document.getElementById('online-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'online-toast';
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ============================================================
// DOM READY — wire up all online buttons
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // Open online setup from the main setup screen
    document.getElementById('open-online-btn').addEventListener('click', () => {
        showScreen('online-setup-screen');
        _clearErr();
    });

    document.getElementById('back-to-setup-btn').addEventListener('click', () => {
        showScreen('setup-screen');
    });

    document.getElementById('create-room-btn').addEventListener('click', _createRoom);
    document.getElementById('join-room-btn').addEventListener('click', _joinRoom);

    // Room code auto-uppercase
    const codeInput = document.getElementById('room-code-input');
    if (codeInput) {
        codeInput.addEventListener('input', e => {
            const pos = e.target.selectionStart;
            e.target.value = e.target.value.toUpperCase();
            e.target.setSelectionRange(pos, pos);
        });
        codeInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') document.getElementById('join-room-btn').click();
        });
    }

    // Lobby
    document.getElementById('online-start-btn').addEventListener('click', _startOnlineGame);

    document.getElementById('copy-code-btn').addEventListener('click', () => {
        const code = document.getElementById('display-room-code').innerText;
        navigator.clipboard.writeText(code)
            .then(() => {
                const btn = document.getElementById('copy-code-btn');
                btn.innerText = '✅ تكوبي!';
                setTimeout(() => { btn.innerText = '📋 كوبي'; }, 2000);
            })
            .catch(() => _showToast('ما قدرناش ننسخ — انسخ يدوياً: ' + code));
    });

    document.getElementById('share-code-btn').addEventListener('click', () => {
        const code = document.getElementById('display-room-code').innerText;
        if (navigator.share) {
            navigator.share({
                title: 'لعبة الدخيل',
                text: `انضم للعبة الدخيل! كود الغرفة: ${code}`,
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(code)
                .then(() => _showToast('تكوبي: ' + code))
                .catch(() => _showToast('كود الغرفة: ' + code));
        }
    });

    document.getElementById('leave-room-btn').addEventListener('click', () => {
        if (confirm('متأكد تحب تخرج من الغرفة؟')) _leaveRoom();
    });

    // Card reveal
    document.getElementById('online-seen-btn').addEventListener('click', _confirmSeen);

    // Start discussion (host only, shown after all players seen card)
    document.getElementById('start-discussion-btn').addEventListener('click', _startDiscussion);
});
