'use strict';

// Note: coup_online.js must only appear once in the HTML script list.
window.__coupOnlineLoaded = true;

// ============================================================
// COUP — Online game logic
// All Coup-specific networking, state machine, rendering and
// AI functions extracted from online.js (Phase 3).
//
// SHARED SCOPE: Same global scope as online.js.  Reads/writes:
//   _room, _myId, _isHost, _channel, _supa (online.js)
//   _syncedNow, _esc, _update, _mutatePlayers (online.js)
//   window.coupCards / window.CoupGame.cards (coup/logic.js)
//   showScreen, showToast, triggerWinnerAnnouncement, _sfx (platform)
// ============================================================

// ── Coup-specific state vars ─────────────────────────────────
let _onlineCoupTimer = null, _onlineCoupTimingOut = false;
let _onlineCoupFocusedPlayerId = null, _onlineCoupSummaryExpandedId = null;
let _lastCoupEventId = null, _lastCoupLossEventId = null;
let _lastCoupPendingKey = null, _lastCoupPromptId = null;
let _onlineCoupResponseTimer = null;
let _onlineCoupOtherDecksCollapsed = false;
let _onlineCoupResponseSync = null, _onlineCoupTurnSync = null;
let _coupWinnerAnnounced = false;

const ONLINE_COUP_RESPONSE_SECONDS = 30;
// COUP_DEFAULT_ACTION_MINUTES is declared in coup_logic.js — do not re-declare here.

// ── Tunisian names for AI players ─────────────────────────────
const _TUNISIAN_NAMES = ["حمادي", "فوزية", "بلقاسم", "منجي", "نجاة", "مبروكة", "الصادق", "بشيرة", "عياشي", "زهيرة", "فرحات", "لطيفة", "توفيق", "منيرة", "الشاذلي", "عزيزة"];
function _getRandomTunisianName() { return _TUNISIAN_NAMES[Math.floor(Math.random() * _TUNISIAN_NAMES.length)]; }

function _onlineCoupDeck() {
    return ['duke','assassin','contessa','ambassador','captain'].flatMap(k=>Array(3).fill(k)).sort(()=>0.5-Math.random());
}

async function _startOnlineCoupGame() {
    if (!_isHost||!_room) return;
    let allP = [...(_room.players || [])];
    const cfg = _room.config || {};
    if (allP.length < 2 && !cfg.versusAI) { showToast('يلزم زوز لاعبين على الأقل.'); return; }

    if (cfg.versusAI && allP.length < 2) {
        const usedNames = new Set(allP.map(p => p.name));
        while (allP.length < 2) {
            let name = _getRandomTunisianName();
            while (usedNames.has(name)) name = _getRandomTunisianName();
            usedNames.add(name);
            allP.push({ id: 'ai_' + Math.random().toString(36).substr(2, 9), name, isAI: true });
        }
    }

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
            isAI: !!p.isAI,
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
    const _gameMode = _getRoomGameMode(room);
    const _reg = window.GameRegistry?.[_gameMode];
    let roleText;
    if (_reg?.onlineCardConfig) {
        roleText = _reg.onlineCardConfig(me, room).roleText;
    } else {
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

function _renderOnlineCoupPlayersSummary(state) {
    const wrapper = document.createElement("div");
    wrapper.className = "coup-summary-wrapper";
    wrapper.style.cssText = "max-width:100%; overflow:hidden; box-sizing:border-box;";

    const container = document.createElement("div");
    container.className = "coup-pills-container";
    container.style.cssText = "overflow-x:auto; overflow-y:visible; max-width:100%; box-sizing:border-box; -webkit-overflow-scrolling:touch; scrollbar-width:none;";
    
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

        // AI Logic for active turn
        if (_isHost && !state.pending && !state.pendingLoss && !state.pendingExchange && !_onlineCoupTimingOut) {
            const actor = state.players[state.turnIndex];
            if (actor?.isAI) {
                const elapsed = (state.actionMinutes * 60) - left;
                if (elapsed > (2 + Math.random() * 2)) {
                    _onlineCoupAIAction(state, actor);
                }
            }
        }
    };
    // Handle AI Loss / AI Exchange
    if (_isHost && !_onlineCoupTimingOut) {
        if (state.pendingLoss) {
            const victim = state.players.find(p => p.id === state.pendingLoss.playerId);
            if (victim?.isAI) setTimeout(() => _onlineCoupAILoss(state, victim), 1500 + Math.random() * 1500);
        } else if (state.pendingExchange) {
            const exchanger = state.players.find(p => p.id === state.pendingExchange.playerId);
            if (exchanger?.isAI) setTimeout(() => _onlineCoupAIExchange(state, exchanger), 2000 + Math.random() * 2000);
        }
    }

    tick();
    _onlineCoupTimer = setInterval(tick, 500);
    if (state.pending?.expiresAt) {
        const responseTick = () => {
            _onlineCoupTickResponseCountdown();

            // AI Responses
            if (_isHost && !_onlineCoupTimingOut && state.pending) {
                const responders = _onlineCoupPendingResponders(state, state.pending);
                const aiResponders = responders.filter(p => p.isAI && !state.pending.passes.includes(p.id));
                if (aiResponders.length > 0) {
                    const elapsed = (ONLINE_COUP_RESPONSE_SECONDS) - Math.max(0, Math.ceil((state.pending.expiresAt - _syncedNow()) / 1000));
                    if (elapsed > (1.5 + Math.random() * 2)) {
                        _onlineCoupAIResponse(state, aiResponders[0]);
                    }
                }
            }

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
    const actor = _room.word_obj.players[_room.word_obj.turnIndex];
    const isAI = actor?.isAI;
    _onlineCoupTimingOut = true;
    try {
        await _onlineCoupMutateState(async state => {
            if (!isAI && (state.pending || state.pendingLoss || state.pendingExchange || Math.ceil(((state.turnEndsAt || _syncedNow()) - _syncedNow()) / 1000) > 0)) return null;
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

async function _onlineCoupAIStartPending(action, aiId, targetId) {
    await _onlineCoupMutateState(async state => {
        if (state.pending || state.pendingLoss || state.pendingExchange) return null;
        const actor = state.players[state.turnIndex || 0];
        if (!actor || actor.id !== aiId || !_onlineCoupLiveCards(actor).length) return null;
        if ((actor.coins || 0) >= 10 && action !== 'coup') return null;
        if (action === 'assassinate' && actor.coins < 3) return null;
        if (action === 'coup' && actor.coins < 7) return null;
        if (['assassinate', 'coup', 'steal'].includes(action)) {
            const target = _onlineCoupAlive(state).find(p => p.id === targetId && p.id !== actor.id);
            if (!target) return null;
        }
        const claims = { tax: 'duke', assassinate: 'assassin', exchange: 'ambassador', steal: 'captain' };
        const blockRoles = action === 'foreignAid' ? ['duke'] : action === 'assassinate' ? ['contessa'] : action === 'steal' ? ['captain', 'ambassador'] : [];
        const blockable = blockRoles.length > 0;
        const claim = claims[action] || null;
        if (!claim && !blockable) return _onlineCoupApplyActionLocal(state, action, targetId);
        if (action === 'assassinate') {
            actor.coins -= 3;
            _onlineCoupPayBank(state, 3);
        }
        state.pending = { id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, action, actorId: actor.id, targetId, claim, blockable, blockRoles, passes: [] };
        _onlineCoupSetResponseDeadline(state.pending);
        state.log = `${actor.name} قال يعمل ${_onlineCoupActionName(action)}. قولولو "تكذب!" كان شاكين.`;
        _onlineCoupEvent(state, `${actor.name} عمل ${_onlineCoupActionName(action)}`, 'notice');
        return state;
    });
}

async function _onlineCoupAIAction(state, ai) {
    if (!ai || ai.hand.every(c => c.lost)) return;
    if (_onlineCoupTimingOut) return;
    _onlineCoupTimingOut = true;
    try {
        const aliveOpponents = state.players.filter(p => p.id !== ai.id && p.hand.some(c => !c.lost));
        if (!aliveOpponents.length) return;
        const randomOpponent = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];

        if (ai.coins >= 10) {
            await _onlineCoupAIStartPending('coup', ai.id, randomOpponent.id);
            return;
        }

        const possible = ['income', 'foreignAid', 'tax', 'exchange'];
        if (ai.coins >= 3) possible.push('assassinate');
        if (aliveOpponents.some(p => p.coins > 0)) possible.push('steal');
        if (ai.coins >= 7) possible.push('coup');

        const weights = { income: 10, foreignAid: 15, tax: 25, steal: 20, assassinate: 15, exchange: 5, coup: 10 };
        const pool = [];
        possible.forEach(act => { for (let i = 0; i < (weights[act] || 10); i++) pool.push(act); });
        const action = pool[Math.floor(Math.random() * pool.length)];

        if (['coup', 'assassinate', 'steal'].includes(action)) {
            let targetId = randomOpponent.id;
            if (action === 'steal') {
                const hasMoney = aliveOpponents.filter(p => p.coins > 0);
                if (hasMoney.length) targetId = hasMoney[Math.floor(Math.random() * hasMoney.length)].id;
            }
            await _onlineCoupAIStartPending(action, ai.id, targetId);
        } else {
            await _onlineCoupMutateState(async state => {
                if (state.pending || state.pendingLoss || state.pendingExchange) return null;
                const actor = state.players[state.turnIndex || 0];
                if (!actor || actor.id !== ai.id) return null;
                return _onlineCoupApplyActionLocal(state, action, null);
            });
        }
    } finally {
        _onlineCoupTimingOut = false;
    }
}

async function _onlineCoupAIResponse(state, ai) {
    const p = state.pending;
    if (!p || p.passes.includes(ai.id)) return;

    const roll = Math.random();
    const isTarget = p.targetId === ai.id;
    const canBlock = !p.stage || p.stage === 'action';

    if (p.stage === 'action') {
        // Target can block with an appropriate role
        if (isTarget && p.blockRoles?.length && roll < 0.3) {
            await _onlineCoupBlock(ai.id, p.blockRoles[0], p.id);
        // Any player can block foreignAid with duke
        } else if (canBlock && p.action === 'foreignAid' && !isTarget && roll < 0.15) {
            await _onlineCoupBlock(ai.id, 'duke', p.id);
        // Challenge the claim (not on income/foreignAid/coup which have no claim)
        } else if (roll < 0.1 && p.claim && p.action !== 'income' && p.action !== 'foreignAid' && p.action !== 'coup') {
            await _onlineCoupChallenge(ai.id, p.id);
        } else {
            await _onlineCoupPass(ai.id, p.id);
        }
    } else if (p.stage === 'block') {
        if (roll < 0.15) {
            await _onlineCoupChallengeBlock(ai.id, p.id);
        } else {
            await _onlineCoupPass(ai.id, p.id);
        }
    }
}

async function _onlineCoupAILoss(state, ai) {
    const p = state.pendingLoss;
    if (!p || p.playerId !== ai.id) return;
    const live = ai.hand.map((c, i) => ({ c, i })).filter(x => !x.c.lost);
    if (!live.length) return;
    const chosenIndex = live[Math.floor(Math.random() * live.length)].i;
    const lossId = p.id;
    // AI bypasses the _myId guard by running its own mutation
    await _onlineCoupMutateState(async state => {
        const loss = state.pendingLoss;
        if (!loss || loss.playerId !== ai.id) return null;
        if (lossId && loss.id !== lossId) return null;
        if (!_onlineCoupMarkLoss(state, loss.playerId, chosenIndex)) return null;
        const next = loss.next || { type: 'nextTurn' };
        _onlineCoupContinueAfterLoss(state, next);
        return state;
    });
}

async function _onlineCoupAIExchange(state, ai) {
    const p = state.pendingExchange;
    if (!p || p.playerId !== ai.id) return;
    const exchangeId = p.id;
    // Pick the first `keep` cards from the pool (AI bypasses _myId guard)
    const finalIndices = Array.from({ length: p.keep }, (_, i) => i);
    await _onlineCoupMutateState(async state => {
        const exchange = state.pendingExchange;
        if (!exchange || exchange.playerId !== ai.id) return null;
        if (exchangeId && exchange.id !== exchangeId) return null;
        const chosen = finalIndices;
        if (chosen.length !== exchange.keep) return null;
        const player = state.players.find(pl => pl.id === exchange.playerId);
        if (!player) return null;
        const liveSlots = player.hand.map((card, index) => ({ card, index })).filter(x => !x.card.lost);
        const chosenSet = new Set(chosen);
        const kept = chosen.map(idx => exchange.pool[idx]).filter(Boolean);
        if (kept.length !== exchange.keep) return null;
        liveSlots.forEach((slot, idx) => { slot.card.type = kept[idx].type; slot.card.lost = false; });
        exchange.pool.filter((_, idx) => !chosenSet.has(idx)).forEach(item => state.deck.unshift(item.type));
        state.deck.sort(() => 0.5 - Math.random());
        state.pendingExchange = null;
        state.log = `${player.name} بدّل كوارطو مع الدكّة.`;
        _onlineCoupEvent(state, state.log, 'good');
        _onlineCoupNextTurn(state);
        return state;
    });
}


// ── Expose for shared scope ────────────────────────────────────
window._showOnlineCoup               = _showOnlineCoup;
window._startOnlineCoupGame          = _startOnlineCoupGame;
window._renderOnlineCoupPlayersSummary = _renderOnlineCoupPlayersSummary;
window._onlineCoupMutateState        = _onlineCoupMutateState;
window._onlineCoupSave               = _onlineCoupSave;
window._onlineCoupChoose             = _onlineCoupChoose;
window._onlineCoupPickTarget         = _onlineCoupPickTarget;
window._onlineCoupChallenge          = _onlineCoupChallenge;
window._onlineCoupPass               = _onlineCoupPass;
window._onlineCoupBlock              = _onlineCoupBlock;
window._onlineCoupAcceptBlock        = _onlineCoupAcceptBlock;
window._onlineCoupChallengeBlock     = _onlineCoupChallengeBlock;
window._onlineCoupChooseLoss         = _onlineCoupChooseLoss;
window._onlineCoupChooseExchange     = _onlineCoupChooseExchange;
window._onlineCoupStartPending       = _onlineCoupStartPending;
window._onlineCoupTimeout            = _onlineCoupTimeout;
window._onlineCoupPendingTimeout     = _onlineCoupPendingTimeout;
window._startOnlineCoupTimer         = _startOnlineCoupTimer;
window._onlineCoupDeck               = _onlineCoupDeck;
window.COUP_DEFAULT_ACTION_MINUTES   = COUP_DEFAULT_ACTION_MINUTES;
window._getRandomTunisianName        = _getRandomTunisianName;
