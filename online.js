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

function _genCode() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join(''); }
function _me(room) { return (room.players||[]).find(p=>p.id===_myId)||null; }
function _err(msg) { const el = document.getElementById('online-setup-error'); if(el) el.innerText = msg; }
function _clearErr() { _err(''); }
function _getLang(room) { return (room.config&&room.config.lang)||'tn'; }
function _getTrans(room) { return i18n[_getLang(room)]; }

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
    const imp = parseInt(document.getElementById('ls-impostors')?.value) || 1;
    const tim = parseInt(document.getElementById('ls-timer')?.value) || 3;
    const config = {
        ..._room.config,
        impostors:       imp,
        timer:           tim,
        randomImpostors: document.getElementById('ls-random')?.checked  || false,
        chaos:           document.getElementById('ls-chaos')?.checked   || false,
        elimination:     document.getElementById('ls-elim')?.checked    || false,
        noHints:         document.getElementById('ls-nohint')?.checked  || false,
        allCorrectHints: document.getElementById('ls-allhint')?.checked || false
    };
    try {
        await _update(_room.code, { config });
        document.getElementById('lobby-settings-panel')?.classList.add('hidden');
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
    try {
        const {data:room,error} = await _supa.from('rooms').select().eq('code',code).single();
        if (error||!room) { _err('ما لقيناش الغرفة!'); _sfx.error(); return; }
        if (room.state!=='lobby') { _err('اللعبة ديجا بدات'); _sfx.error(); return; }
        const existing = room.players.find(p=>p.id===_myId);
        if (existing) {
            _room = room; _isHost = room.host_id===_myId; _myName = existing.name;
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
        const settBtn = document.createElement('button');
        settBtn.id = 'lobby-settings-btn';
        settBtn.className = 'secondary-btn';
        settBtn.style.cssText = 'margin-top:10px; width:100%;';
        settBtn.innerText = '⚙️ عدّل إعدادات الجولة';
        startBtn.after(settBtn);

        // ── Inline settings panel (toggled) ──────────────
        const panel = document.createElement('div');
        panel.id = 'lobby-settings-panel';
        panel.className = 'surface-card hidden';
        panel.style.cssText = 'margin-top:12px; padding:16px; text-align:right;';

        const maxImps = Math.max(1, Math.floor(n / 2));
        const curImps = Math.min(cfg.impostors || 1, maxImps);
        const curTim  = cfg.timer || 3;

        panel.innerHTML = `
            <p style="margin:0 0 14px; font-weight:700; font-size:1rem; color:var(--primary-color);">⚙️ إعدادات الجولة</p>

            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                <span style="font-size:.95rem;">عدد الدخلاء</span>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button type="button" id="ls-imp-minus" class="counter-btn">−</button>
                    <span id="ls-imp-val" style="min-width:22px; text-align:center; font-weight:700;">${curImps}</span>
                    <button type="button" id="ls-imp-plus"  class="counter-btn">+</button>
                    <input type="hidden" id="ls-impostors" value="${curImps}">
                </div>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                <span style="font-size:.95rem;">وقت النقاش (دقائق)</span>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button type="button" id="ls-tim-minus" class="counter-btn">−</button>
                    <span id="ls-tim-val" style="min-width:22px; text-align:center; font-weight:700;">${curTim}</span>
                    <button type="button" id="ls-tim-plus"  class="counter-btn">+</button>
                    <input type="hidden" id="ls-timer" value="${curTim}">
                </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="font-size:.9rem;">دخلاء عشوائيين</span>
                <input type="checkbox" id="ls-random" style="width:20px;height:20px;accent-color:var(--primary-color);cursor:pointer;" ${cfg.randomImpostors?'checked':''}>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="font-size:.9rem;">وضع الفوضى</span>
                <input type="checkbox" id="ls-chaos" style="width:20px;height:20px;accent-color:var(--primary-color);cursor:pointer;" ${cfg.chaos?'checked':''}>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="font-size:.9rem;">وضع الإقصاء</span>
                <input type="checkbox" id="ls-elim" style="width:20px;height:20px;accent-color:var(--primary-color);cursor:pointer;" ${cfg.elimination?'checked':''}>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="font-size:.9rem;">بلا تلميحات</span>
                <input type="checkbox" id="ls-nohint" style="width:20px;height:20px;accent-color:var(--primary-color);cursor:pointer;" ${cfg.noHints?'checked':''}>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <span style="font-size:.9rem;">كل التلميحات صحيحة</span>
                <input type="checkbox" id="ls-allhint" style="width:20px;height:20px;accent-color:var(--primary-color);cursor:pointer;" ${cfg.allCorrectHints?'checked':''}>
            </div>

            <div style="display:flex; gap:10px;">
                <button type="button" id="ls-save"   class="primary-btn"   style="flex:1; margin:0; padding:12px;">💾 حفظ</button>
                <button type="button" id="ls-cancel" class="secondary-btn" style="flex:1; margin:0; padding:12px;">إلغاء</button>
            </div>
        `;
        settBtn.after(panel);

        // Counter helpers
        const _counter = (hiddenId, dispId, minusId, plusId, minV, maxV) => {
            const inp  = () => document.getElementById(hiddenId);
            const disp = () => document.getElementById(dispId);
            document.getElementById(minusId)?.addEventListener('click', () => {
                const v = Math.max(minV, parseInt(inp().value) - 1);
                inp().value = v; disp().innerText = v;
            });
            document.getElementById(plusId)?.addEventListener('click', () => {
                const v = Math.min(maxV, parseInt(inp().value) + 1);
                inp().value = v; disp().innerText = v;
            });
        };
        _counter('ls-impostors','ls-imp-val','ls-imp-minus','ls-imp-plus', 1, maxImps);
        _counter('ls-timer',    'ls-tim-val','ls-tim-minus','ls-tim-plus', 1, 10);

        settBtn.addEventListener('click',  () => panel.classList.toggle('hidden'));
        document.getElementById('ls-save')  ?.addEventListener('click', _updateRoomSettings);
        document.getElementById('ls-cancel')?.addEventListener('click', () => panel.classList.add('hidden'));

    } else {
        startBtn.classList.add('hidden');
        waitMsg.innerText = `⏳ نستناو مولى الروم يبدا... (${n} لاعبين)`;
    }
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
    try { await _update(_room.code,{state:'reveal',word_obj:wordObj,players,timer_end_at:null,result:null}); }
    catch(e) { console.error(e); showToast('خطأ في بدء اللعبة!'); }
}

function _showMyCard(room) {
    showScreen('online-card-screen');
    const me = _me(room); if (!me) return;
    const lang = _getLang(room), trans = i18n[lang], noHints = room.config.noHints||lang==='x18';
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

function _startClientTimer(room) {
    showScreen('timer-screen');
    document.getElementById('reaction-bar')?.classList.remove('hidden');
    const trans = i18n[_getLang(room)];
    document.getElementById('starter-player').innerText = `${trans.starter_is}${room.starter_player}`;
    if (_onlineTimer) clearInterval(_onlineTimer);

    // Use absolute end time so every client stays in sync regardless
    // of when their realtime event arrived.
    const endTime = new Date(room.timer_end_at).getTime();

    const tick = () => {
        const left = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        const m = Math.floor(left/60).toString().padStart(2,'0');
        const s = (left%60).toString().padStart(2,'0');
        document.getElementById('timer-display').innerText = `${m}:${s}`;
        if (left <= 10 && left > 0) _sfx.tickUrgent(); else if (left > 10) _sfx.tick();
        if (left <= 0) {
            clearInterval(_onlineTimer);
            _sfx.timerEnd();
            document.getElementById('reaction-bar')?.classList.add('hidden');
            if (_isHost) _moveToVoting();
        }
    };
    tick(); _onlineTimer = setInterval(tick, 500);
    document.getElementById('go-to-vote-btn').onclick = () => {
        if (!_isHost) { showToast('مولى الروم اكهو ينجم يوقف الوقت!'); return; }
        clearInterval(_onlineTimer);
        document.getElementById('reaction-bar')?.classList.add('hidden');
        _moveToVoting();
    };
}

async function _moveToVoting() {
    if (!_isHost||!_room) return;
    try { await _update(_room.code,{state:'voting'}); } catch(e) { console.error(e); }
}

function _showOnlineVoting(room) {
    showScreen('voting-screen');
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
    showScreen('result-screen');
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
    if (_onlineTimer) { clearInterval(_onlineTimer); _onlineTimer=null; }
    _room=null; _isHost=false; window.onlineMode=false;
    showScreen('setup-screen');
}
