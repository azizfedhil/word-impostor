'use strict';

// ============================================================
// ONLINE — Coordinator
// Wires the platform together: shared state vars, state machine
// (_handleStateChange), lobby rendering, round screens
// (reveal / discussion / voting / result), and timers.
//
// Infrastructure is in net/room.js (Supabase, room CRUD).
// Game-specific networking is in games/*/online.js.
//
// Load order:
//   core/* → game_registry → games/*/logic →
//   games/coup/online → games/chkobba/online →
//   net/room → [this file] → shared → voice → *_init
// ============================================================

let _startingOnlineGame = false;
let _localCardRevealed = false;
// Coup state vars are declared in coup_online.js (authoritative).
// Keeping references here for IDE clarity only — do NOT re-declare.
// _onlineCoupActionHelp is defined below as an alias to coup_online.js

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

fetch('../assets/images/spyfall_tunisia_100_locations.json', { cache:'no-store' })
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

// ── Aliases to authoritative sources in game logic files ─────────────────
// These are const/function declarations so they're accessible in the same
// scope as the coordinator's round-flow functions.
const _onlineCoupActionHelp = window.coupActionHelp || window.CoupGame?.actionHelp || {};
// Note: _coupCards is defined in net/room.js (shared global scope) — no re-declaration here.
function _thiefRoleMeta(role) {
    if (typeof window.ThiefGame?.roleMeta === 'function') return window.ThiefGame.roleMeta(role);
    return { label:'شاهد', icon:'👁️', desc:'إنت شاهد. عاون الحاكم.' };
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
    } catch(e) { console.error(e); showToast('خطأ في حفظ الإعدادات.'); }
}

// NOTE: _handleKickedFromLobby is the full async implementation in room.js.
// Do not redefine it here — that would replace the real one with this stub.
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
        const _lbMode = _getRoomGameMode(room);
        const _lbStart = window.gameModes?.[_lbMode]?.start || '🚀 ابدأ اللعبة';
        startBtn.innerText = _lbStart;
        if (_isChkobbaRoom(room)) {
            _renderChkobbaLobbySettings(startBtn, room);
            return;
        }
        if (_isCoupRoom(room)) {
            _renderCoupLobbySettings(startBtn, room);
            return;
        }
        if (!_isChkobbaRoom(room) && !_isCoupRoom(room) && _getRoomGameMode(room) !== 'impostor') {
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

function _renderCoupLobbySettings(anchorBtn, room) {
    const cfg = room.config || {};
    const turnTime = cfg.actionTimer || 1;
    const versusAI = !!cfg.versusAI;
    const extendedMode = !!cfg.extendedMode;

    const wrap = document.createElement('div');
    wrap.id = 'lobby-settings-panel';
    wrap.className = 'advanced-content open simple-lobby-settings';
    wrap.innerHTML = `
        <div class="surface-card" style="padding:10px 24px;">
            <div class="setting-row">
                <div class="setting-info"><span class="setting-title">⏱️ وقت الدور</span></div>
                <div class="counter-group">
                    <button class="counter-btn" id="coup-time-minus">−</button>
                    <span class="counter-value" id="coup-time-val">${turnTime}</span>
                    <button class="counter-btn" id="coup-time-plus">+</button>
                </div>
            </div>
            <div class="toggle-row" style="margin-top:16px;">
                <span class="toggle-label">🤖 اللعب ضد الذكاء الاصطناعي</span>
                <div class="toggle-switch ${versusAI?'active':''}" id="coup-ai-tog">
                    <div class="toggle-thumb"></div>
                </div>
            </div>
            <div class="toggle-row" style="border-bottom:none; margin-top:16px;">
                <span class="toggle-label">🏆 كول وبوّع Extended (14 coins)</span>
                <div class="toggle-switch ${extendedMode?'active':''}" id="coup-extended-tog">
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

    wrap.querySelector('#coup-time-minus').onclick = () => updateConfig({ actionTimer: Math.max(1, turnTime - 1) });
    wrap.querySelector('#coup-time-plus').onclick = () => updateConfig({ actionTimer: Math.min(5, turnTime + 1) });
    wrap.querySelector('#coup-ai-tog').onclick = () => updateConfig({ versusAI: !versusAI });
    wrap.querySelector('#coup-extended-tog').onclick = () => updateConfig({ extendedMode: !extendedMode });
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
    const _rMode = _getRoomGameMode(room);
    const _rReg  = window.GameRegistry?.[_rMode];
    const _timerCfg = _rReg?.onlineTimerConfig?.(room) || {};
    const supportsFiguredOut = isTimerScreen && (_timerCfg.supportsFiguredOut !== false);
    const figuredOutLabel    = _timerCfg.figuredOutLabel    || 'عرفت الكذاب!';
    const figuredOutAnnounce = _timerCfg.figuredOutAnnounce || 'عرف الكذاب!';
    const myFiguredOut  = _playerFigured(_me(room) || { id:_myId });
    const canAskQuestion = isTimerScreen && supportsFiguredOut && _canAskQuestion(room);
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
            ${isTimerScreen && supportsFiguredOut && !myFiguredOut ? `<button class="figured-btn" id="figured-out-btn">🎯 ${figuredOutLabel}</button>` : ''}
            ${isTimerScreen && supportsFiguredOut && myFiguredOut  ? `<div class="figured-announced">✅ أعلنت أنك ${figuredOutLabel}</div>` : ''}
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
        _showFiguredOutAnnounce(_myName, figuredOutAnnounce);
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
        if (_room.config?.chkobbaTournament) { await window._startTournament(_room); }
        else { await window._startOnlineChkobbaGame(); }
        return;
    }
    if (_isCoupRoom(_room))    { await window._startOnlineCoupGame();    return; }
    if (_isThiefRoom(_room))   { await _startOnlineThiefGame();   return; }
    if (_isSpyfallRoom(_room)) { await _startOnlineSpyfallGame(); return; }
    // Impostor-mode: needs word list
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
    const _gameMode = _getRoomGameMode(room);
    const _reg = window.GameRegistry?.[_gameMode];
    let roleText;
    if (_reg?.onlineCardConfig) {
        roleText = _reg.onlineCardConfig(me, room).roleText;
    } else {
        // Fallback for impostor (should not be reached with full registry)
        roleText = me.isImpostor
            ? (noHints ? trans.impostor_role : `${trans.impostor_role}<br><br><span style="font-size:16px;">${trans.hint_label}</span><br>${_esc(me.customHint)}`)
            : `${trans.citizen_role}<br><br><span style="font-size:16px;">${trans.word_label}</span><br>${_esc(room.word_obj?.word || '')}`;
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
        const _tMode = _getRoomGameMode(_room || room);
        const _tCfg  = window.GameRegistry?.[_tMode]?.onlineTimerConfig?.(_room || room) || {};
        if (_tCfg.supportsFiguredOut !== false && _figuredThresholdMet(_room || room)) _moveToVoting('figured');
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
    const _vMode = _getRoomGameMode(room);
    const _vReg  = window.GameRegistry?.[_vMode];
    const _vCfg  = _vReg?.onlineVotingConfig?.(room) || {};
    const _vTrans = _getTrans(room);
    document.querySelector('[data-i18n="voting_title"]').innerText = _vCfg.title || _vTrans.voting_title;
    document.querySelector('[data-i18n="who_impostor"]').innerText = _vCfg.whoLabel || _vTrans.who_impostor;
    const frag = document.createDocumentFragment();
    room.players.filter(p=>!p.eliminated).forEach(player=>{
        if (_vCfg.excludePlayer?.(player)) return;
        const btn = document.createElement('button'); btn.className = 'vote-item';
        const vc = room.players.filter(p=>p.vote===player.id).length;
        btn.innerHTML = (_vCfg.voteBtnPrefix || '🗳️ ') + _esc(player.name) + (vc>0?` <span class="vote-count">(${vc})</span>`:'');
        if (_vCfg.judgeOnly && me?.role !== 'judge') { btn.disabled = true; btn.title = 'نستناو الحاكم يحكم'; }
        else if (hasVoted) { btn.disabled=true; if(me.vote===player.id) btn.classList.add('my-vote'); }
        else if (player.id===_myId) { btn.disabled=true; btn.title='ما تنجمش تصوت على روحك'; }
        else { btn.addEventListener('click',()=>_castVote(player.id)); }
        frag.appendChild(btn);
    });
    list.appendChild(frag);
    const allVoted = _vCfg.isVotingComplete ? _vCfg.isVotingComplete(room) : (room.players.filter(p=>!p.eliminated).every(p=>p.vote!==null));
    if (allVoted) setTimeout(()=>_processVotes(room),800);
}

async function _castVote(targetId) {
    if (!_room || _localPlayerDesired.vote) return; _sfx.vote();
    const _cvMode = _getRoomGameMode(_room);
    const _cvCfg  = window.GameRegistry?.[_cvMode]?.onlineVotingConfig?.(_room) || {};
    if (_cvCfg.judgeOnly && _me(_room)?.role !== 'judge') return;
    _localPlayerDesired = {..._localPlayerDesired, vote:targetId};
    _showOnlineVoting(_applyLocalPlayerOverrides(_room));
    try {
    const updated = await _commitMyPlayerPatch({vote:targetId});
        _showOnlineVoting(updated);
        const _cvCfgU = window.GameRegistry?.[_getRoomGameMode(updated)]?.onlineVotingConfig?.(updated) || {};
        const done = _cvCfgU.isVotingComplete ? _cvCfgU.isVotingComplete(updated) : (updated.players.filter(p=>!p.eliminated).every(p=>p.vote!==null));
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
    const _pvMode = _getRoomGameMode(room);
    const _pvReg  = window.GameRegistry?.[_pvMode];
    if (_pvReg?.processOnlineVotes) {
        // Game-owned vote processing (thief, spyfall, future games)
        const result = _pvReg.processOnlineVotes(room, alive);
        if (!result) return;
        const {data,error} = await _supa.from('rooms')
            .update({state:'result',result:result.result,players:result.players||room.players,timer_end_at:null,config:{...(room.config||{}),currentVoteReason:null}})
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
    const _srMode = _getRoomGameMode(room);
    const _srReg  = window.GameRegistry?.[_srMode];
    const _srData = _srReg?.onlineResultConfig?.(room);
    if (_srData) {
        if (_srData.animation && _srData.animation !== 'none') triggerAnimation(_srData.animation);
        resultMsg.innerText  = _srData.resultMsg  || '';
        revealBox.innerHTML  = _srData.revealHTML  || '';
        if (_srData.isContinue) {
            if (_isHost) { nextBtn.innerText=trans.continue_discussion; nextBtn.disabled=false; nextBtn.onclick=()=>_continueDiscussion(room); }
            else { nextBtn.innerText='⏳ نستناو مولى الروم...'; nextBtn.disabled=true; }
            return;
        }
        if (_isHost) { nextBtn.innerText=trans.next_round_btn||'🔄 عاود انده'; nextBtn.disabled=false; nextBtn.onclick=()=>_resetToLobby(); }
        else { nextBtn.innerText='⏳ نستناو مولى الروم...'; nextBtn.disabled=true; }
        return;
    }
    // Fallback: should not be reached if all games register onlineResultConfig
    if (_isHost) { nextBtn.innerText=trans.next_round_btn||'🔄 عاود انده'; nextBtn.disabled=false; nextBtn.onclick=()=>_resetToLobby(); }
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
    _clearErr();
    let modal = document.getElementById('scanner-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'scanner-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; width: 92%; padding: 24px;">
                <h3 style="margin-top:0; color:var(--primary-color); font-size:1.5rem; margin-bottom:16px;">📷 امسح كود QR</h3>
                <div id="scanner-modal-reader" style="width: 100%; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); margin-bottom: 20px; background:#000; aspect-ratio: 1/1;"></div>
                <button id="close-scanner-modal-btn" class="danger-btn" style="background:transparent; color:var(--danger-color); border:none; box-shadow:none; margin:0 auto; font-size:1.1rem; cursor:pointer;">❌ سكر الكاميرا</button>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('close-scanner-modal-btn').addEventListener('click', _stopScanner);
        modal.addEventListener('click', e => {
            if (e.target === modal) _stopScanner();
        });
    }

    if (typeof openModal === 'function') {
        openModal('scanner-modal');
    } else {
        modal.classList.remove('hidden');
        modal.classList.add('active');
    }

    if (!_html5QrCode) {
        _html5QrCode = new Html5Qrcode("scanner-modal-reader");
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
                const codeInput = document.getElementById('room-code-input');
                if (codeInput) codeInput.value = code.toUpperCase();
                _stopScanner();
                if (typeof _joinRoom === 'function') _joinRoom();
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
        _stopScanner();
    });
}

async function _stopScanner() {
    if (_html5QrCode && _html5QrCode.isScanning) {
        try {
            await _html5QrCode.stop();
        } catch(e) {
            console.error(e);
        }
    }
    if (typeof closeModal === 'function') {
        closeModal('scanner-modal');
    } else {
        const modal = document.getElementById('scanner-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    }
}


// ── Window exports ────────────────────────────────────────────
// Top-level `function` declarations are auto-on-window in non-module scripts.
// `const`/`let` declarations are NOT — export them explicitly.
window._figuredOut         = _figuredOut;         // Set — used by room.js reconcile loop
window._pendingConfig      = _pendingConfig;       // null initially, assigned by lobby UI
window._handleStateChange  = _handleStateChange;   // needed by chkobba_online / coup_online
window._renderLobby        = _renderLobby;         // called by room.js _subscribe callback
