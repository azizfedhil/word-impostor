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
let _onlineCoupMyCardsHidden = false;
let _onlineCoupResponseSync = null, _onlineCoupTurnSync = null;
let _coupWinnerAnnounced = false;

const ONLINE_COUP_RESPONSE_SECONDS = 30;
// CONTESSA_DEFLECT_COST and COUP_DEFAULT_ACTION_MINUTES are declared in coup_logic.js — do not re-declare here.

function _pulseScreenRed() {
    document.querySelector('.coup-red-pulse-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'coup-red-pulse-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,0,0,0.4);pointer-events:none;z-index:9999;opacity:0;transition:opacity 0.2s ease-in-out;';
    document.body.appendChild(overlay);
    let pulses = 0;
    const pulse = () => {
        if (pulses >= 3) {
            overlay.remove();
            return;
        }
        overlay.style.opacity = '1';
        setTimeout(() => {
            overlay.style.opacity = '0';
            pulses++;
            if (pulses < 3) {
                setTimeout(pulse, 200);
            } else {
                setTimeout(() => overlay.remove(), 200);
            }
        }, 200);
    };
    pulse();
}

function _pulseScreenGreen() {
    document.querySelector('.coup-green-pulse-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'coup-green-pulse-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,200,80,0.35);pointer-events:none;z-index:9999;opacity:0;transition:opacity 0.2s ease-in-out;';
    document.body.appendChild(overlay);
    let pulses = 0;
    const pulse = () => {
        if (pulses >= 3) { overlay.remove(); return; }
        overlay.style.opacity = '1';
        setTimeout(() => {
            overlay.style.opacity = '0';
            pulses++;
            if (pulses < 3) setTimeout(pulse, 200);
            else setTimeout(() => overlay.remove(), 200);
        }, 200);
    };
    pulse();
}

function _showCardUseAnimation(playerName, cardType) {
    document.querySelector('.coup-card-use-animation')?.remove();
    const meta = window.coupCards[cardType] || window.coupCards.duke;
    const _onlineImgBase = (window.CoupGame?.cards?.duke?.img || '').replace(/coup\/[^/]+$/, '') + 'images/';
    const fullCardSrc = _onlineImgBase + cardType + '_full_card.webp';

    const container = document.createElement('div');
    container.className = 'coup-card-use-animation';
    container.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;pointer-events:none;';

    const card = document.createElement('div');
    card.className = 'coup-use-card';
    card.style.cssText = 'width:120px;height:180px;position:relative;perspective:1000px;transition:transform 0.5s ease-in-out;';

    const cardInner = document.createElement('div');
    cardInner.className = 'coup-use-card-inner';
    cardInner.style.cssText = 'width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform 0.5s;transform:rotateY(0deg);';

    const cardFront = document.createElement('div');
    cardFront.className = 'coup-use-card-front';
    cardFront.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    cardFront.innerHTML = `<img src="${fullCardSrc}" style="width:100%;height:100%;object-fit:cover;" alt="${meta.name}">`;

    const cardBack = document.createElement('div');
    cardBack.className = 'coup-use-card-back';
    cardBack.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;transform:rotateY(180deg);border-radius:8px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    cardBack.innerHTML = `<span style="font-size:48px;">${meta.icon}</span>`;

    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    card.appendChild(cardInner);
    container.appendChild(card);

    const messageBox = document.createElement('div');
    messageBox.className = 'coup-modal-card';
    messageBox.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);opacity:0;transition:all 0.4s ease-out;padding:20px 30px;text-align:center;';
    messageBox.innerHTML = `<div class="coup-modal-spark">✦</div><h3 style="margin:0 0 10px 0;"><span style="color:#ffd700;">${playerName}</span></h3><div class="coup-modal-body" style="color:#fff;">استعمل <span style="color:#ffd700;">${meta.name}</span></div>`;

    container.appendChild(messageBox);
    document.body.appendChild(container);

    setTimeout(() => {
        cardInner.style.transform = 'rotateY(180deg)';
    }, 100);

    setTimeout(() => {
        cardInner.style.transform = 'rotateY(360deg)';
    }, 600);

    setTimeout(() => {
        const isMobile = window.innerWidth < 768;
        card.style.transform = isMobile ? 'translateX(80px)' : 'translateX(200px)';
    }, 1100);

    setTimeout(() => {
        messageBox.style.transform = 'translate(-50%,-50%) scale(1)';
        messageBox.style.opacity = '1';
    }, 1600);

    setTimeout(() => {
        container.style.transition = 'opacity 0.3s ease-out';
        container.style.opacity = '0';
        setTimeout(() => container.remove(), 300);
    }, 3500);
}

// ── Tunisian names for AI players ─────────────────────────────
const _TUNISIAN_NAMES = ["حمادي", "فوزية", "بلقاسم", "منجي", "نجاة", "مبروكة", "الصادق", "بشيرة", "عياشي", "زهيرة", "فرحات", "لطيفة", "توفيق", "منيرة", "الشاذلي", "عزيزة"];
function _getRandomTunisianName() { return _TUNISIAN_NAMES[Math.floor(Math.random() * _TUNISIAN_NAMES.length)]; }

function _getOnlineCoupThresholds(state) {
    const ext = !!(state?.extendedMode || _room?.config?.extendedMode);
    return {
        coup: ext ? 14 : 7,
        assassinate: ext ? 6 : 3,
        mustCoup: ext ? 20 : 10
    };
}

function _onlineCoupDynamic(state) {
    const dyn = window.CoupGame?.getDynamic?.(state);
    if (dyn) return dyn;
    // Fallback (when CoupGame not loaded): match the same logic as _coupGetDynamic
    const roles = state?.rolesInPlay || ['assassin','captain','contessa','duke','ambassador'];
    const captainRole = ['captain','lawyer','customsOfficer'].find(r => roles.includes(r)) || 'captain';
    return {
        dukeRole:'duke', ambRole:'ambassador', captainRole,
        aidBlockRoles:['duke'],
        stealBlockRoles: captainRole === 'customsOfficer' ? ['customsOfficer'] : ['captain','lawyer','ambassador'].filter(r=>roles.includes(r)),
        invoiceBlockRoles:['ambassador'],
        jesterBlockRoles:['jester'],
        taxAssignmentBlockRoles: [],
    };
}

function _onlineCoupActionClaim(action, state) {
    const dyn = _onlineCoupDynamic(state);
    return ({
        tax: dyn.dukeRole, bureaucratTax: 'bureaucrat', speculatorGamble: 'speculator',
        assassinate: 'assassin', exchange: dyn.ambRole, inquireExchange: 'inquisitor',
        inquireInspect: 'inquisitor', jesterDisorder: 'jester', socialistShare: 'socialist',
        steal: dyn.captainRole, invoice: 'lawyer', taxAssignment: 'customsOfficer'
    })[action] || null;
}

function _onlineCoupTaxAmount(taxType) {
    return 1; // role-based pre-placed taxes are always +1
}

// Returns { total, officers: [{officer, amount}] } for all active role-based taxes matching the claim
function _onlineCoupComputeTotalTax(state, claim, action) {
    const taxes = state.taxAssignments || [];
    let total = 0;
    const officers = [];
    for (const tax of taxes) {
        const officer = state.players.find(p => p.id === tax.officerId);
        const officerAlive = officer && officer.hand.some(c => !c.lost);
        if (!officerAlive) continue;
        // Only role-based taxes with a specific taxedRole that matches the claim
        if (tax.taxType === 'role' && tax.taxedRole && claim && tax.taxedRole === claim) {
            total += 1;
            officers.push({ officer, amount: 1 });
        }
    }
    return { total, officers };
}

function _onlineCoupDeck() {
    const rolesInPlay = window.CoupGame?.selectRoles?.() || ['duke','assassin','contessa','ambassador','captain'];
    const deck = rolesInPlay.flatMap(k => Array(3).fill(k)).sort(() => 0.5 - Math.random());
    return { deck, rolesInPlay };
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

    const { deck, rolesInPlay } = _onlineCoupDeck();
    const actionMinutes = Math.max(1, Math.min(5, parseInt(_room.config?.actionTimer || _pendingConfig?.actionTimer || 1, 10) || 1));
    const state = {
        extendedMode: !!cfg.extendedMode,
        deck,
        rolesInPlay,
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
    const meta = window.coupCards[role] || window.coupCards.duke;
    return `${meta.icon} ${meta.name}`;
}

function _onlineCoupBlockOptions(pending) {
    return (pending?.blockRoles || []).map(role => ({ role, label:_onlineCoupBlockRoleLabel(role) }));
}

function _onlineCoupPendingClaimantId(pending) {
    if (pending?.stage === 'block') return pending.blockerId;
    if (pending?.stage === 'deflect') return pending.deflectorId;
    return pending?.actorId;
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
        if (state.players[idx].hand.some(c=>!c.lost)) {
            state.turnIndex = idx;
            // Clear taxes placed by the player whose turn it now is (expires "until start of their next turn")
            if (state.taxAssignments && state.taxAssignments.length) {
                state.taxAssignments = state.taxAssignments.filter(t => t.officerTurnIndex !== idx);
            }
            _onlineCoupSetDeadline(state);
            return;
        }
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
        state.pendingEstateClaim = null;
        state.pendingReactiveTax = null;
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
    if (next.type === 'acceptDeflect') {
        return _onlineCoupAcceptDeflect(state, next.pending, next.pending.alreadyProven);
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
    const meta = window.coupCards[card.type] || window.coupCards.duke;
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
    // Clear tax assignment if Customs Officer is eliminated
    if (out && state.taxAssignments && state.taxAssignments.some(t => t.officerId === playerId)) {
        state.taxAssignments = state.taxAssignments.filter(t => t.officerId !== playerId);
        state.log = `${p.name} خرج من الطرح، ضرائب سي فلان تلغيت.`;
        _onlineCoupEvent(state, state.log, 'notice');
    }
    // Trigger Lawyer Estate Claim if player is eliminated with coins AND lawyer is in this game's role pool
    if (out && (p.coins || 0) > 0 && (state.rolesInPlay || []).includes('lawyer')) {
        state.pendingEstateClaim = {
            id:`estate_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
            eliminatedId: playerId,
            coinsToClaim: p.coins
        };
        p.coins = 0; // lock coins now so they can't be spent or stolen before claim resolves
        state.log = `${p.name} خرج وعندو فلوس. أي لاعب ينجم يدعي الكبران ويطالب بالميراث!`;
        _onlineCoupEvent(state, state.log, 'notice');
    }
    return true;
}

function _onlineCoupRequestExchange(state, playerId, drawCount = 2) {
    const player = state.players.find(x => x.id === playerId);
    const live = player?.hand?.map((card, index) => ({card, index})).filter(x => !x.card.lost) || [];
    if (!player || !live.length) return false;
    const actualDraw = Math.min(drawCount, state.deck.length);
    const drawn = Array.from({length: actualDraw}, () => state.deck.pop()).filter(Boolean).map(type => ({ type, drawn:true }));
    state.pending = null;
    state.pendingExchange = {
        id:`ex_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        playerId,
        keep: live.length,
        pool:[...live.map(x => ({ type:x.card.type, handIndex:x.index })), ...drawn]
    };
    state.log = drawCount === 1
        ? `${player.name} يشوف كارطة واحدة من الدكّة ويختار شنوّة يخلي.`
        : `${player.name} يشوف زوز كوارط من الدكّة ويختار شنوّة يخلي.`;
    _onlineCoupEvent(state, state.log, 'notice');
    return true;
}


function _onlineCoupActionName(action) {
    return {
        income:'شهرية', foreignAid:'اعانة', tax:'ضريبة الشلغمي',
        bureaucratTax:'تعاون الشيخ', speculatorGamble:'قمّر يا الكُلّاب',
        assassinate:'اغتيال', exchange:'تبديل السمسار',
        inquireExchange:'بدّل يا البحاث', inquireInspect:'تنتس يا البحّاث',
        jesterDisorder:'خربقها يا العمدة', socialistShare:'توزيع المدير',
        steal:'سرقة الرايس', invoice:'فاتورة الكبران', taxAssignment:'خطية سي فلان',
        coup:'Coup'
    }[action] || action;
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

        const chkobbaTimer = document.getElementById('chkobba-turn-timer');
        if (chkobbaTimer) {
            const m = Math.floor(left / 60).toString().padStart(2, '0');
            const sec = (left % 60).toString().padStart(2, '0');
            chkobbaTimer.innerText = `${m}:${sec}`;
            chkobbaTimer.classList.remove('hidden');
            if (left <= 10) chkobbaTimer.style.color = 'var(--danger-color)';
            else chkobbaTimer.style.color = '';
        }

        if (left <= 0 && !state.pending && !state.pendingLoss && !state.pendingExchange && !state.pendingEstateClaim && !state.pendingReactiveTax && !_onlineCoupTimingOut && _onlineCoupAlive(state).length > 1 && _isHost) {
            _onlineCoupTimeout();
        }

        // AI Logic for active turn
        if (_isHost && !state.pending && !state.pendingLoss && !state.pendingExchange && !state.pendingEstateClaim && !state.pendingReactiveTax && !state.pendingInspect && !state.pendingJesterSwap && !state.pendingSocialistShare && !_onlineCoupTimingOut) {
            const actor = state.players[state.turnIndex];
            if (actor?.isAI) {
                const elapsed = (state.actionMinutes * 60) - left;
                if (elapsed > (2 + Math.random() * 2)) {
                    _onlineCoupAIAction(state, actor);
                }
            }
        }
    };
    // Handle AI Loss / AI Exchange / AI pendingEstateClaim / AI pendingReactiveTax / AI pendingInspect / AI pendingJesterSwap / AI pendingSocialistShare
    if (_isHost && !_onlineCoupTimingOut) {
        if (state.pendingLoss) {
            const victim = state.players.find(p => p.id === state.pendingLoss.playerId);
            if (victim?.isAI) setTimeout(() => _onlineCoupAILoss(state, victim), 1500 + Math.random() * 1500);
        } else if (state.pendingExchange) {
            const exchanger = state.players.find(p => p.id === state.pendingExchange.playerId);
            if (exchanger?.isAI) setTimeout(() => _onlineCoupAIExchange(state, exchanger), 2000 + Math.random() * 2000);
        } else if (state.pendingReactiveTax) {
            const rt = state.pendingReactiveTax;
            const aiEligible = state.players.filter(p => p.isAI && p.id !== rt.actorId && p.hand.some(c => !c.lost) && !(rt.respondedIds || []).includes(p.id));
            aiEligible.forEach(ai => setTimeout(() => _onlineCoupAIReactiveTax(state, ai), 1500 + Math.random() * 1500));
        } else if (state.pendingEstateClaim) {
            const estate = state.pendingEstateClaim;
            const alivePlayers = state.players.filter(p => p.id !== estate.eliminatedId && p.hand.some(c => !c.lost));
            if (alivePlayers.length > 0) {
                const randomClaimant = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                if (randomClaimant?.isAI) setTimeout(() => _onlineCoupAIEstateClaim(state, randomClaimant, estate), 2000 + Math.random() * 2000);
            } else {
                setTimeout(() => _onlineCoupSkipEstateClaim(estate.id), 2000);
            }
        } else if (state.pendingInspect) {
            const inspector = state.players.find(p => p.id === state.pendingInspect.actorId);
            if (inspector?.isAI) setTimeout(() => _onlineCoupAIChooseInspect(state), 2000 + Math.random() * 1500);
        } else if (state.pendingJesterSwap) {
            const jesterActor = state.players.find(p => p.id === state.pendingJesterSwap.actorId);
            if (jesterActor?.isAI) setTimeout(() => _onlineCoupAIChooseJesterSwap(state, jesterActor), 2000 + Math.random() * 1500);
        } else if (state.pendingSocialistShare) {
            const s = state.pendingSocialistShare;
            const socActor = state.players.find(p => p.id === s.actorId);
            if (s.phase === 'actor') {
                // Actor phase: AI actor resolves
                if (socActor?.isAI) setTimeout(() => _onlineCoupAIChooseSocialist(state, socActor), 2000 + Math.random() * 1500);
            } else {
                // Opponent phase: any AI opponent who hasn't chosen yet + actor (actor resolves if all chosen)
                const hasUnchosenAIOpponent = (s.opponents || []).some(o => {
                    const ch = (s.opponentChoices || {})[o.playerId];
                    if (ch !== undefined) return false;
                    const pl = state.players.find(p => p.id === o.playerId);
                    return pl?.isAI;
                });
                if (hasUnchosenAIOpponent && socActor?.isAI) {
                    setTimeout(() => _onlineCoupAIChooseSocialist(state, socActor), 1500 + Math.random() * 1000);
                } else if (hasUnchosenAIOpponent) {
                    setTimeout(() => _onlineCoupAIChooseSocialist(state, socActor), 1500 + Math.random() * 1000);
                }
            }
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
            if (p.stage === 'deflect') {
                state.pending = null;
                return _onlineCoupAcceptDeflect(state, p);
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
            if (!isAI && (state.pending || state.pendingLoss || state.pendingExchange || state.pendingEstateClaim || Math.ceil(((state.turnEndsAt || _syncedNow()) - _syncedNow()) / 1000) > 0)) return null;
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

        // Update stats for logged in users
        if (window._userProfile) {
            const me = state.players.find(p => p.id === window._myId);
            if (me) {
                const won = alive[0].id === me.id;
                window._updateStats('coup', won);
            }
        }
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
    const activePromptId = state.pending?.id || state.pendingLoss?.id || state.pendingExchange?.id || state.pendingEstateClaim?.id || null;
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
            window.triggerNotLyingAnimation(state.lastEvent.triggerNotLying, state.lastEvent.notLyingCardType);
        }
    }
    if (state.lastLossEvent?.id && state.lastLossEvent.id !== _lastCoupLossEventId) {
        _lastCoupLossEventId = state.lastLossEvent.id;
        const meta = window.coupCards[state.lastLossEvent.cardType] || { name:state.lastLossEvent.cardName, icon:'🂠' };
        window.CoupUI?.showLossAnimation?.(state.lastLossEvent.playerName, meta, !!state.lastLossEvent.out, state.lastLossEvent.cardType);
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
        const hidden = isMe && _onlineCoupMyCardsHidden;
        const showCard = isMe && !hidden;
        const focused = _onlineCoupFocusedPlayerId === p.id || (!_onlineCoupFocusedPlayerId && isMe);
        const dimmed = !!_onlineCoupFocusedPlayerId && _onlineCoupFocusedPlayerId !== p.id;
        const out = !p.hand.some(c=>!c.lost);
        const imgBase = (window.CoupGame?.cards?.duke?.img || '').replace(/coup\/[^/]+$/, '') + 'images/';
        const div = document.createElement('div');
        div.className = 'coup-player-card' + (idx===(state.turnIndex||0)?' is-turn':'') + (isMe?' is-me':'') + (focused?' is-focused':'') + (dimmed?' is-dimmed':'') + (out?' is-out':'');
        div.dataset.playerId = p.id;
        const toggleBtn = isMe && !out
            ? `<button class="coup-hide-cards-btn" type="button" data-hide-toggle="1">${hidden ? '👁 ورّي كوارطك' : '🙈 خبي كوارطك'}</button>`
            : '';
        div.innerHTML = `<div class="coup-player-head"><span>${window.CoupUI?.escapeHtml?.(p.name) || p.name}${isMe?' <span class="you-tag">أنا</span>':''}</span><span class="coup-coins">🪙 ${p.coins}</span></div>
            <div class="coup-influence-row">${p.hand.map(c => {
                const meta = window.coupCards[c.type] || window.coupCards.duke;
                const label = (showCard || c.lost) ? (window.CoupUI?.cardLabelHtml?.(meta) || `${meta.icon} ${meta.name}`) : '<span>🂠 مخبية</span>';
                const info = (showCard || c.lost) ? `<button class="coup-card-info" type="button" data-card-type="${c.type}" aria-label="info">ℹ️</button>` : '';
                const bgStyle = (showCard || c.lost) ? ` style="--card-img:url('${imgBase}${c.type}_horizontal.webp')" data-has-bg="1"` : '';
                return `<div class="coup-influence ${c.lost?'lost':''}"${bgStyle}><span>${label}</span>${info}</div>`;
            }).join('')}</div>${toggleBtn}`;
        div.addEventListener('click', e => {
            if (e.target.closest('.coup-card-info')) return;
            if (e.target.closest('[data-hide-toggle]')) {
                _onlineCoupMyCardsHidden = !_onlineCoupMyCardsHidden;
                _showOnlineCoup(room);
                return;
            }
            _onlineCoupFocusedPlayerId = _onlineCoupFocusedPlayerId === p.id ? null : p.id;
            _showOnlineCoup(room);
        });
        div.querySelectorAll('.coup-card-info').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                window.CoupUI?.showCardInfo?.(btn.dataset.cardType, window.coupCards);
            });
        });
        if (isMe && idx === state.turnIndex && !state.pending && !state.pendingLoss && !state.pendingExchange && !state.pendingEstateClaim) {
            div.querySelectorAll('.coup-influence:not(.lost)').forEach(cardEl => {
                cardEl.style.cursor = 'pointer';
                cardEl.addEventListener('click', e => {
                    e.stopPropagation();
                    const infoBtn = cardEl.querySelector('.coup-card-info');
                    const cardType = infoBtn?.dataset.cardType;
                    if (cardType) {
                        const actionMap = {
                            duke: 'tax',
                            bureaucrat: 'bureaucratTax',
                            speculator: 'speculatorGamble',
                            assassin: 'assassinate',
                            captain: 'steal',
                            lawyer: 'invoice',
                            customsOfficer: 'taxAssignment',
                            ambassador: 'exchange',
                            inquisitor: 'inquisitor-choose',
                            jester: 'jesterDisorder',
                            socialist: 'socialistShare',
                        };
                        const action = actionMap[cardType];
                        if (action === 'inquisitor-choose') {
                            window.CoupUI?.showModal?.('البحاث: اختار الأكشن',
                                `<div class="coup-target-grid">
                                    <button class="coup-target-btn primary-action" data-inquisitor-action="inquireExchange">بدّل كارطة مع الدكة</button>
                                    <button class="coup-target-btn primary-action" data-inquisitor-action="inquireInspect">فحص كارطة لاعب</button>
                                </div>`,
                                overlay => {
                                    overlay.querySelectorAll('[data-inquisitor-action]').forEach(actionBtn => actionBtn.addEventListener('click', () => {
                                        window.CoupUI.closeModal();
                                        _onlineCoupChoose(actionBtn.dataset.inquisitorAction);
                                    }));
                                }
                            );
                        } else if (action) {
                            _onlineCoupChoose(action);
                        } else if (cardType === 'contessa') showToast("البية للدفاع بركة، ما عندهاش هجوم.");
                    }
                });
            });
        }
        return div;
    };
    if (myBoard) {
        if (state.pendingLoss) myBoard.appendChild(_renderOnlineCoupLossBanner(state, me));
        else if (state.pendingExchange) myBoard.appendChild(_renderOnlineCoupExchangeBanner(state, me));
        else if (state.pendingEstateClaim) myBoard.appendChild(_renderOnlineCoupEstateClaimBanner(state, me));
        else if (state.pendingReactiveTax) myBoard.appendChild(_renderOnlineCoupReactiveTaxBanner(state, me));
        else if (state.pendingInspect) myBoard.appendChild(_renderOnlineCoupInspectBanner(state, me));
        else if (state.pendingJesterSwap) myBoard.appendChild(_renderOnlineCoupJesterSwapBanner(state, me));
        else if (state.pendingSocialistShare) myBoard.appendChild(_renderOnlineCoupSocialistShareBanner(state, me));
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
            const th = _getOnlineCoupThresholds(state);
            if (mine.p.coins >= th.mustCoup) {
                warningEl.classList.remove('hidden');
                warningEl.innerText = `عندك اكثر من ${th.mustCoup} فرنك، لازم تعمل انقلاب`;
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
    window.CoupUI?.renderRoleHelp?.(window.coupCards);
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
                const meta = window.coupCards[card.type] || window.coupCards.duke;
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


function _renderOnlineCoupEstateClaimBanner(state, me) {
    const estate = state.pendingEstateClaim;
    const eliminated = state.players.find(p => p.id === estate?.eliminatedId);
    const esc = window.CoupUI?.escapeHtml || (x => x);
    const wrap = document.createElement('div');
    wrap.className = 'coup-pending-banner';
    wrap.innerHTML = `
        <div class="coup-pending-title">تركة الكبران</div>
        <strong>${esc(eliminated?.name || '')} عند ${(estate?.coinsToClaim || 0)} فلوس</strong>
        <p>${me?.id !== estate?.eliminatedId ? `اختار طالب بالميراث أو تخطي.` : `نستناو لاعب يطالب بالميراث.`}</p>
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
    const isDeflectStage = p.stage === 'deflect';
    const isActionStage = !p.stage;

    const canChallenge = me && !isClaimant && me.hand.some(c=>!c.lost) && (p.claim || isBlockStage || isDeflectStage);
    const isReactiveTax = p.action === 'reactiveTax';
    const canBlock = me && me.hand.some(c=>!c.lost) && p.blockable && (
        isActionStage && me.id !== actor?.id && (p.action === 'foreignAid' || isReactiveTax || !p.targetId || p.targetId === me.id)
    );
    const canDeflect = me && isActionStage && p.action === 'assassinate' && p.targetId === me.id &&
                      (me.coins || 0) >= CONTESSA_DEFLECT_COST && p.canDeflect !== false;

    const canPass = me && !isClaimant && !(p.passes || []).includes(me.id);
    const passCount = _onlineCoupPassCount(state, p);
    const total = _onlineCoupPendingResponders(state, p).length;
    const esc = window.CoupUI?.escapeHtml || (x => x);
    const wrap = document.createElement('div');
    wrap.className = 'coup-pending-banner';

    let blockerLine = '';
    if (isBlockStage) {
        blockerLine = `<p>${esc(state.players.find(x=>x.id===p.blockerId)?.name || '')} قال يسكّر ب${_onlineCoupBlockRoleLabel(p.blockRole)}. أي لاعب ينجم يقول "تكذب".</p>`;
    } else if (isDeflectStage) {
        const deflector = state.players.find(x=>x.id===p.deflectorId);
        const deflectTarget = state.players.find(x=>x.id===p.deflectTargetId);
        blockerLine = `<p>${esc(deflector?.name || '')} حوّل الاغتيال لـ${esc(deflectTarget?.name || '')}. أي لاعب ينجم يقول "تكذب".</p>`;
    } else {
        blockerLine = `<p>${target ? `${esc(target.name)} مستهدف. ` : ''}أي لاعب ينجم يقول "تكذب"${canBlock ? '، وإنت تنجم تسكّر بالكارتة المناسبة' : ''}${canDeflect ? '، ولا تحوّل الضربة' : ''}.</p>`;
    }

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
        btn.onclick = () => {
            if (isBlockStage) _onlineCoupChallengeBlock(me.id, p.id);
            else _onlineCoupChallenge(me.id, p.id);
        };
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
    if (canDeflect) {
        const btn = document.createElement('button');
        btn.className = 'coup-target-btn primary-action';
        btn.textContent = `🛡️ حوّل الاغتيال (${CONTESSA_DEFLECT_COST}🪙)`;
        btn.onclick = () => _onlineCoupDeflectPickTarget(p.id);
        actions.appendChild(btn);
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

function _renderOnlineCoupInspectBanner(state, me) {
    const insp = state.pendingInspect;
    const actor  = state.players.find(p => p.id === insp?.actorId);
    const target = state.players.find(p => p.id === insp?.targetId);
    const esc = window.CoupUI?.escapeHtml || (x => x);
    const wrap = document.createElement('div');
    wrap.className = 'coup-pending-banner';
    const isActor = me?.id === actor?.id;
    const cardMeta = window.coupCards[insp?.revealedCardType];
    const cardLabel = cardMeta ? (window.CoupUI?.cardLabelHtml?.(cardMeta) || `${cardMeta.icon} ${cardMeta.name}`) : '🂠';
    wrap.innerHTML = `
        <div class="coup-pending-title">لوّج يا البحاث 🔍</div>
        <strong>${esc(actor?.name || '')} يفحص كارطة ${esc(target?.name || '')}</strong>
        <p>${isActor
            ? `كارطة ${esc(target?.name || '')}: <strong>${cardLabel}</strong>. تحب تجبرو يبدّلها؟`
            : `نستناو ${esc(actor?.name || '')} يقرر.`
        }</p>
    `;
    if (isActor) {
        const grid = document.createElement('div');
        grid.className = 'coup-target-grid';
        const forceBtn = document.createElement('button');
        forceBtn.className = 'coup-target-btn danger-action';
        forceBtn.textContent = '↩️ اجبرو يبدلها';
        forceBtn.onclick = () => _onlineCoupChooseInspect(true, insp.id);
        const skipBtn = document.createElement('button');
        skipBtn.className = 'coup-target-btn quiet-action';
        skipBtn.textContent = 'ما نعمل شي';
        skipBtn.onclick = () => _onlineCoupChooseInspect(false, insp.id);
        grid.appendChild(forceBtn);
        grid.appendChild(skipBtn);
        wrap.appendChild(grid);
    }
    return wrap;
}

function _renderOnlineCoupJesterSwapBanner(state, me) {
    const jester = state.pendingJesterSwap;
    const actor  = state.players.find(p => p.id === jester?.actorId);
    const target = state.players.find(p => p.id === jester?.targetId);
    const esc = window.CoupUI?.escapeHtml || (x => x);
    const wrap = document.createElement('div');
    wrap.className = 'coup-pending-banner';
    const isActor = me?.id === actor?.id;
    wrap.innerHTML = `
        <div class="coup-pending-title">العمدة: دخلها بعضها 🃏</div>
        <strong>${esc(actor?.name || '')} يختار كارطة يبقى فيها</strong>
        <p>${isActor ? 'اختار واحدة تبقى معاك وبدّلها مع كارطة من كوارطك.' : `نستناو ${esc(actor?.name || '')} يختار.`}</p>
    `;
    if (isActor) {
        const temps = jester.temps || [];
        const grid = document.createElement('div');
        grid.className = 'coup-target-grid';
        temps.forEach((temp, tempIdx) => {
            const meta = window.coupCards[temp.type];
            const label = meta ? (window.CoupUI?.cardLabelHtml?.(meta) || `${meta.icon} ${meta.name}`) : temp.type;
            const srcLabel = temp.src === 'deck' ? 'من الدكة' : `من ${esc(target?.name || '')}`;
            const btn = document.createElement('button');
            btn.className = 'coup-target-btn';
            btn.innerHTML = `${label}<small>${srcLabel}</small>`;
            btn.onclick = () => _onlineCoupPromptJesterActorCard(jester, tempIdx);
            grid.appendChild(btn);
        });
        wrap.appendChild(grid);
    }
    return wrap;
}

function _renderOnlineCoupSocialistShareBanner(state, me) {
    const share = state.pendingSocialistShare;
    const actor  = state.players.find(p => p.id === share?.actorId);
    const esc = window.CoupUI?.escapeHtml || (x => x);
    const wrap = document.createElement('div');
    wrap.className = 'coup-pending-banner';
    const isActor = me?.id === actor?.id;
    wrap.innerHTML = `
        <div class="coup-pending-title">مشكي يا المدير 🤝</div>
        <strong>${esc(actor?.name || '')} يوزّع بالمدير</strong>
        <p>${isActor ? 'نستناو كل لاعب يختار شنوة يعطيك.' : `اختار شنوة تعطي للمدير: فلوس أو كارطة.`}</p>
    `;
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
                    const meta = window.coupCards[card.type] || window.coupCards.duke;
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
                    const meta = window.coupCards[item.type] || window.coupCards.duke;
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
    if (state.pendingEstateClaim) {
        const estate = state.pendingEstateClaim;
        const eliminated = state.players.find(p => p.id === estate.eliminatedId);
        const esc = window.CoupUI?.escapeHtml || (x => x);
        if (me.id !== estate.eliminatedId) {
            const alivePlayers = state.players.filter(p => p.id !== estate.eliminatedId && p.hand.some(c => !c.lost));
            panel.innerHTML = `<div class="coup-panel-card live">${esc(eliminated?.name || '')} عند ${(estate.coinsToClaim || 0)} فلوس. طالب بالميراث؟</div>
                <div class="coup-target-grid">${alivePlayers.map(p => 
                    `<button class="coup-target-btn" data-estate-claim="${p.id}">${esc(p.name)}: طالب بالميراث</button>`
                ).join('')}</div>
                <button class="coup-target-btn" data-estate-skip="true">تخطي</button>`;
            panel.querySelectorAll('[data-estate-claim]').forEach(btn => btn.addEventListener('click', e => {
                const claimantId = e.target.closest('[data-estate-claim]').dataset.estateClaim;
                _onlineCoupChooseEstateClaim(claimantId, estate.id);
            }));
            panel.querySelector('[data-estate-skip]').addEventListener('click', () => {
                _onlineCoupSkipEstateClaim(estate.id);
            });
        } else {
            panel.innerHTML = `<div class="coup-panel-card">نستناو لاعب يطالب بالتركة.</div>`;
        }
        return;
    }
    if (state.pendingReactiveTax) {
        const rt = state.pendingReactiveTax;
        const actor = state.players.find(p => p.id === rt.actorId);
        const esc = window.CoupUI?.escapeHtml || (x => x);
        const hasResponded = (rt.respondedIds || []).includes(me.id);
        const isActor = me.id === rt.actorId;
        if (!isActor && !hasResponded) {
            panel.innerHTML = `<div class="coup-panel-card live">سي فلان: ضريبة على الأكشن (+${rt.amount} فلوس من ${esc(actor?.name || '?')})</div>
                <div class="coup-target-grid">
                    <button class="coup-target-btn primary-action" id="rt-panel-yes">✅ ادعي سي فلان (+${rt.amount})</button>
                    <button class="coup-target-btn quiet-action" id="rt-panel-no">لا، تخطي</button>
                </div>`;
            panel.querySelector('#rt-panel-yes')?.addEventListener('click', e => { e.currentTarget.disabled = true; _onlineCoupReactiveTaxRespond(true, rt.id); });
            panel.querySelector('#rt-panel-no')?.addEventListener('click', e => { e.currentTarget.disabled = true; _onlineCoupReactiveTaxRespond(false, rt.id); });
        } else {
            const alive = _onlineCoupAlive(state);
            const waitingCount = alive.filter(p => p.id !== rt.actorId && !(rt.respondedIds || []).includes(p.id)).length;
            panel.innerHTML = `<div class="coup-panel-card">نستناو ${waitingCount} لاعبين يردّوا على ضريبة سي فلان.</div>`;
        }
        return;
    }
    if (state.pendingInspect) {
        const insp = state.pendingInspect;
        const esc = window.CoupUI?.escapeHtml || (x => x);
        if (me.id === insp.actorId) {
            const cardMeta = window.coupCards[insp.revealedCardType];
            const cardLabel = cardMeta ? (window.CoupUI?.cardLabelHtml?.(cardMeta) || `${cardMeta.icon} ${esc(cardMeta.name)}`) : '🂠';
            const target = state.players.find(p => p.id === insp.targetId);
            panel.innerHTML = `<div class="coup-panel-card live">كارطة ${esc(target?.name || '')}: <strong>${cardLabel}</strong><br>شنوة تعمل؟</div>
                <div class="coup-target-grid">
                    <button class="coup-target-btn danger-action" id="inq-force-online">↩️ جبّره يبدّلها</button>
                    <button class="coup-target-btn quiet-action" id="inq-skip-online">ما نعملش شي</button>
                </div>`;
            panel.querySelector('#inq-force-online')?.addEventListener('click', e => { e.currentTarget.disabled = true; _onlineCoupChooseInspect(true, insp.id); });
            panel.querySelector('#inq-skip-online')?.addEventListener('click', e => { e.currentTarget.disabled = true; _onlineCoupChooseInspect(false, insp.id); });
        } else {
            const inspector = state.players.find(p => p.id === insp.actorId);
            panel.innerHTML = `<div class="coup-panel-card">نستناو ${esc(inspector?.name || '')} يقرر شنوة يعمل.`;
        }
        return;
    }
    if (state.pendingJesterSwap) {
        const jester = state.pendingJesterSwap;
        const esc = window.CoupUI?.escapeHtml || (x => x);
        if (me.id === jester.actorId) {
            const target = state.players.find(p => p.id === jester.targetId);
            const tempsHtml = (jester.temps || []).map((temp, idx) => {
                const meta = window.coupCards[temp.type];
                const label = meta ? (window.CoupUI?.cardLabelHtml?.(meta) || `${meta.icon} ${esc(meta.name)}`) : temp.type;
                const srcLabel = temp.src === 'deck' ? 'من الدكة' : `من ${esc(target?.name || '')}`;
                return `<button class="coup-target-btn" data-jester-temp-idx="${idx}">${label}<small>${srcLabel}</small></button>`;
            }).join('');
            panel.innerHTML = `<div class="coup-panel-card live">اختار واحدة تبقى معاك وبدّلها مع كارطة من كوارطك.</div>
                <div class="coup-target-grid">${tempsHtml}</div>`;
            panel.querySelectorAll('[data-jester-temp-idx]').forEach(btn => {
                btn.addEventListener('click', () => {
                    btn.disabled = true;
                    _onlineCoupPromptJesterActorCard(jester, parseInt(btn.dataset.jesterTempIdx, 10));
                });
            });
        } else {
            const jesterActor = state.players.find(p => p.id === jester.actorId);
            panel.innerHTML = `<div class="coup-panel-card">نستناو ${esc(jesterActor?.name || '')} يختار كارطة.`;
        }
        return;
    }
    if (state.pendingSocialistShare) {
        const share = state.pendingSocialistShare;
        const esc = window.CoupUI?.escapeHtml || (x => x);
        const actor = state.players.find(p => p.id === share.actorId);
        const isActor = me.id === share.actorId;
        const myOppSlot = (share.opponents || []).find(o => o.playerId === me.id);
        const myChoice = share.opponentChoices?.[me.id];
        const allChosen = (share.opponents || []).every(o => (share.opponentChoices || {})[o.playerId] !== undefined);

        if (share.phase === 'opponents' || !share.phase && !allChosen) {
            // PHASE 1: Each opponent makes their choice
            if (isActor) {
                // Actor waits
                const waiting = (share.opponents || []).filter(o => (share.opponentChoices || {})[o.playerId] === undefined);
                const waitNames = waiting.map(o => esc(state.players.find(p => p.id === o.playerId)?.name || o.playerId)).join('، ');
                panel.innerHTML = `<div class="coup-panel-card live">نستناو اللاعبين يختاروا. باقي: ${waitNames || 'لا أحد'}</div>`;
            } else if (myOppSlot) {
                if (myChoice !== undefined) {
                    // Already chose — show what they picked
                    const choiceText = myChoice.take === 'coin' ? '🪙 فلوس' : myChoice.take === null ? 'ما أعطيتش شي' : '🃏 كارطة';
                    panel.innerHTML = `<div class="coup-panel-card">اخترت: <strong>${choiceText}</strong>. نستناو بقية اللاعبين.</div>`;
                } else {
                    // Show this opponent their choice
                    panel.innerHTML = `<div class="coup-panel-card live">المدير ${esc(actor?.name || '')} يوزّع — شنوة تعطي؟</div>`;
                    const grid = document.createElement('div');
                    grid.className = 'coup-target-grid';
                    if (myOppSlot.hasCoins) {
                        const coinBtn = document.createElement('button');
                        coinBtn.className = 'coup-target-btn';
                        coinBtn.textContent = '🪙 أعطي فلوس';
                        coinBtn.onclick = () => _onlineCoupSocialistOpponentChoose(share.id, 'coin', null);
                        grid.appendChild(coinBtn);
                    }
                    (myOppSlot.liveCards || []).forEach(c => {
                        const meta = window.coupCards[c.type];
                        const label = meta ? (window.CoupUI?.cardLabelHtml?.(meta) || `${meta.icon} ${esc(meta.name)}`) : c.type;
                        const cardBtn = document.createElement('button');
                        cardBtn.className = 'coup-target-btn danger-action';
                        cardBtn.innerHTML = label;
                        cardBtn.onclick = () => _onlineCoupSocialistOpponentChoose(share.id, 'card', c.handIdx);
                        grid.appendChild(cardBtn);
                    });
                    // No skip — each player MUST contribute (coin or card) unless they have neither
                    const hasNeither = !myOppSlot.hasCoins && !(myOppSlot.liveCards?.length);
                    if (hasNeither) {
                        panel.innerHTML += `<div class="coup-panel-card">ما عندكش شي تعطي.</div>`;
                        _onlineCoupSocialistOpponentChoose(share.id, null, null); // auto-skip
                    } else {
                        panel.appendChild(grid);
                    }
                }
            } else {
                panel.innerHTML = `<div class="coup-panel-card">نستناو اللاعبين يختاروا عند المدير.</div>`;
            }
        } else {
            // PHASE 2: All opponents have chosen — actor picks 2 cards from pool
            if (isActor) {
                // Build pool locally for display: actor's live cards + cards opponents gave
                // Pool items carry stable identity (actorHandIdx or fromPlayerId) — NOT pool position —
                // so the server can resolve correctly regardless of display order.
                const myLive = me.hand
                    .map((c, handIdx) => ({ c, handIdx }))
                    .filter(x => !x.c.lost);
                const cardChoices = (share.opponents || []).filter(o => {
                    const ch = (share.opponentChoices || {})[o.playerId];
                    return ch && ch.take === 'card';
                });
                // Pool: actor's cards + opponent cards, shuffled for display anonymity.
                // Each entry carries a stable identity key used when sending the choice to the server.
                const pool = [
                    ...myLive.map(({ c, handIdx }) => ({
                        type: c.type,
                        isActorCard: true,
                        actorHandIdx: handIdx   // stable: index in actor's actual hand array
                    })),
                    ...cardChoices.map(o => {
                        const ch = (share.opponentChoices || {})[o.playerId];
                        const lc = (o.liveCards || []).find(lc => lc.handIdx === ch.handIdx) || (o.liveCards || [])[0];
                        return {
                            type: lc?.type || '?',
                            isActorCard: false,
                            fromPlayerId: o.playerId   // stable: identifies which opponent's card this is
                        };
                    })
                ].sort(() => 0.5 - Math.random()); // shuffle display order only
                const mustKeep = Math.min(myLive.length, 2);
                const keptPoolItems = []; // pool entry objects (NOT indices)

                const renderActorPick = () => {
                    panel.innerHTML = '';
                    const remaining = mustKeep - keptPoolItems.length;
                    const title = document.createElement('div');
                    title.className = 'coup-panel-card live';
                    title.textContent = `اختار ${remaining} كارطة تبقى معاك من الحوض:`;
                    panel.appendChild(title);
                    const grid = document.createElement('div');
                    grid.className = 'coup-target-grid';
                    pool.forEach((pc) => {
                        const meta = window.coupCards[pc.type];
                        const label = meta ? (window.CoupUI?.cardLabelHtml?.(meta) || `${meta.icon} ${esc(meta.name)}`) : pc.type;
                        const btn = document.createElement('button');
                        const isKept = keptPoolItems.includes(pc);
                        btn.className = 'coup-target-btn' + (isKept ? ' selected' : '');
                        btn.innerHTML = label;
                        btn.disabled = isKept;
                        btn.onclick = () => {
                            keptPoolItems.push(pc);
                            if (keptPoolItems.length >= mustKeep) {
                                // Send stable identity instead of shuffled pool indices
                                const keptActorHandIndices = keptPoolItems
                                    .filter(p => p.isActorCard)
                                    .map(p => p.actorHandIdx);
                                const keptOpponentPlayerIds = keptPoolItems
                                    .filter(p => !p.isActorCard)
                                    .map(p => p.fromPlayerId);
                                _onlineCoupChooseSocialist({ keptActorHandIndices, keptOpponentPlayerIds }, share.id);
                            } else {
                                renderActorPick();
                            }
                        };
                        grid.appendChild(btn);
                    });
                    panel.appendChild(grid);
                };
                renderActorPick();
            } else {
                panel.innerHTML = `<div class="coup-panel-card">نستناو ${esc(actor?.name || '')} يختار واحدين من الحوض.</div>`;
            }
        }
        return;
    }

    if (state.pending) {
        const p = state.pending;
        const actor = state.players.find(x=>x.id===p.actorId);
        const target = state.players.find(x=>x.id===p.targetId);
        const isBlockStage = p.stage === 'block';
        const canChallenge = !isBlockStage && p.claim && me.id !== actor?.id && me.hand.some(c=>!c.lost);
        const isReactiveTax = p.action === 'reactiveTax';
        const canBlock = !isBlockStage && p.blockable && me.id !== actor?.id && me.hand.some(c=>!c.lost) && (p.action === 'foreignAid' || isReactiveTax || !p.targetId || p.targetId === me.id);
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
            if (me.id === p.targetId && !isBlockStage) {
                if (p.action === 'bureaucratTax') {
                    _pulseScreenGreen();
                } else {
                    _pulseScreenRed();
                }
            }
            const esc = window.CoupUI?.escapeHtml || (x => x);
            const blockButtons = canBlock ? _onlineCoupBlockOptions(p).map(opt => `<button class="coup-target-btn" data-popup-block="${opt.role}">نسكّرها ب${opt.label}</button>`).join('') : '';
            const blockStageButtons = `${canChallengeBlock ? '<button class="coup-target-btn danger-action" data-popup-challenge-block="1">تكذب على البلوك!</button>' : ''}`;
            const targetLine = target && !isBlockStage ? `<p class="coup-decision-hint">${esc(target.name)}، اختياراتك واضحة: سكّر بالكارتة المناسبة، ولا اتهمه بالتبلعيط.</p>` : '';
        const hasContessa = me && me.hand.some(c => !c.lost && c.type === 'contessa');
        const isAssassinationTarget = p.action === 'assassinate' && p.targetId === me?.id && !isBlockStage && !isDeflectStage;
        const isBureaucratTarget = p.action === 'bureaucratTax' && p.targetId === me?.id && !isBlockStage;

        const passButton = canPass ? '<button class="coup-target-btn quiet-action" data-popup-pass="1">ما عندي حتى اعتراض</button>' : '';
        const deflectButton = canDeflect ? `<button class="coup-target-btn primary-action" data-popup-deflect="1">🛡️ حوّل الاغتيال (${CONTESSA_DEFLECT_COST}🪙)</button>` : '';
        const buttons = `${canChallenge ? '<button class="coup-target-btn danger-action" data-popup-challenge="1">تكذب!</button>' : ''}${blockButtons}${deflectButton}${blockStageButtons}${passButton}`;

        let modalTitle = isBlockStage ? 'البلوك صحيح؟' : (isDeflectStage ? 'التحويل صحيح؟' : 'شنوة تعمل؟');
        let modalBody = `<p>${esc(state.log)}</p>${targetLine}${_onlineCoupPendingTimerHtml(p)}<div class="coup-target-grid">${buttons}</div>`;

        if (isBureaucratTarget) {
            const actorName = esc(actor?.name || '');
            modalTitle = '🎁 هدية من الشيخ!';
            modalBody = `
                <p style="font-size:1.1rem;font-weight:700;color:var(--success-color,#22c55e);">
                    ${actorName} اختارك تاخو +1 فلوس بالشيخ 📋
                </p>
                <p style="opacity:0.85;">تقبل الهدية، ولا ترفضها وتحاسبه؟</p>
                ${_onlineCoupPendingTimerHtml(p)}
                <div class="coup-target-grid">
                    <button class="coup-target-btn primary-action" data-popup-pass="1">✅ قبلت، خذلي +1</button>
                    <button class="coup-target-btn danger-action" data-popup-bureaucrat-reject="1">❌ نرفض</button>
                </div>`;
        } else if (isAssassinationTarget && hasContessa) {
            modalTitle = "عندك 'البية'!";
            modalBody = `<p style="font-size:1.2rem; font-weight:800; color:var(--primary-color);">عندك 'البية'، تحب تمنع روحك، تحوّل الضربة، والا تسكت؟</p>
                         ${_onlineCoupPendingTimerHtml(p)}
                         <div class="coup-target-grid">
                            <button class="coup-target-btn primary-action" data-popup-block="contessa">🛡️ سكر بالبية</button>
                            ${(me.coins >= CONTESSA_DEFLECT_COST && p.canDeflect !== false) ? `<button class="coup-target-btn primary-action" data-popup-deflect="1">🛡️ حوّل الاغتيال (${CONTESSA_DEFLECT_COST}🪙)</button>` : ''}
                            <button class="coup-target-btn danger-action" data-popup-challenge="1">تكذب!</button>
                            <button class="coup-target-btn quiet-action" data-popup-pass="1">اسكت</button>
                         </div>`;
        }

        if (isBureaucratTarget || buttons || (isAssassinationTarget && hasContessa)) window.CoupUI?.showModal?.(modalTitle, modalBody, overlay => {
                overlay.querySelector('[data-popup-challenge]')?.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupChallenge(me.id, p.id); });
                overlay.querySelectorAll('[data-popup-block]').forEach(btn => btn.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupBlock(me.id, btn.dataset.popupBlock, p.id); }));
                overlay.querySelector('[data-popup-deflect]')?.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupDeflectPickTarget(p.id); });
                overlay.querySelector('[data-popup-challenge-block]')?.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupChallengeBlock(me.id, p.id); });
                overlay.querySelector('[data-popup-pass]')?.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupPass(me.id, p.id); });
                overlay.querySelector('[data-popup-bureaucrat-reject]')?.addEventListener('click', () => {
                    // Show second modal: challenge or just pass (forfeit the +1 silently)
                    const actorNameEsc = esc(actor?.name || '');
                    window.CoupUI.showModal('رفضت الهدية — شنوة تعمل؟',
                        `<p>رفضت +1 من ${actorNameEsc}. تحب تتهمه بالتبلعيط؟</p>
                        ${_onlineCoupPendingTimerHtml(p)}
                        <div class="coup-target-grid">
                            <button class="coup-target-btn danger-action" data-popup-challenge-after-reject="1">⚔️ تكذب على الشيخ!</button>
                            <button class="coup-target-btn quiet-action" data-popup-pass-after-reject="1">لا، بس ما نقبلش</button>
                        </div>`,
                        overlay2 => {
                            overlay2.querySelector('[data-popup-challenge-after-reject]')?.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupChallenge(me.id, p.id); });
                            overlay2.querySelector('[data-popup-pass-after-reject]')?.addEventListener('click', () => { window.CoupUI.closeModal(); _onlineCoupPass(me.id, p.id); });
                        }
                    );
                });
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
    const th = _getOnlineCoupThresholds(state);
    const mustCoup = isTurn && (me.coins || 0) >= th.mustCoup;
    const _onlineImgBase = (window.CoupGame?.cards?.duke?.img || '').replace(/coup\/[^/]+$/, '') + 'images/';
    const _onlineActionBgMap = { income:'plusone', foreignAid:'plustwo', tax:'tax', bureaucratTax:'bureaucrattax', speculatorGamble:'speculatorgamble', steal:'steal', invoice:'invoice', taxAssignment:'taxAssignment', assassinate:'assassinate', exchange:'exchange', inquireExchange:'inquireexchange', inquireInspect:'inquireinspect', jesterDisorder:'jesterDisorder', socialistShare:'socialistshare', coup:'coup' };
    const mk = (txt, action, cls='', hint='') => {
        const actionLocked = !isTurn || (mustCoup && action !== 'coup');
        const finalHint = mustCoup && action !== 'coup' ? `عندك ${th.mustCoup}+ فلوس، لازم Coup` : hint;
        const bgFile = _onlineActionBgMap[action];
        const bgStyle = bgFile ? ` style="--action-img:url('${_onlineImgBase}${bgFile}.webp')" data-has-bg="1"` : '';
        return `<button class="coup-action-btn ${cls} ${actionLocked ? 'is-action-disabled' : ''}" data-coup-action="${action}"${bgStyle} aria-disabled="${actionLocked ? 'true' : 'false'}"><strong>${txt}<span class="coup-action-info" data-action-info="${action}">ℹ️</span></strong><small>${finalHint}</small></button>`;
    };

    const dyn      = _onlineCoupDynamic(state);
    const dukeCard = window.CoupGame?.cards?.[dyn.dukeRole];
    const ambCard  = window.CoupGame?.cards?.[dyn.ambRole];
    const captainCard = window.CoupGame?.cards?.[dyn.captainRole];
    const gain     = Math.min(me?.coins || 0, 5);

    let dukeBtn;
    if (dyn.dukeRole === 'bureaucrat') {
        dukeBtn = mk(`${window.CoupUI?.cardLabelHtml?.(dukeCard) || '🏛 الشيخ'} +2`, 'bureaucratTax', 'primary-action', 'خوذ 3، اعطي 1 للهدف');
    } else if (dyn.dukeRole === 'speculator') {
        dukeBtn = mk(`${window.CoupUI?.cardLabelHtml?.(dukeCard) || '🎰 الكلاب'}: تقمير`, 'speculatorGamble', 'primary-action', `تدوبلي فلوسك (${gain})`);
    } else {
        dukeBtn = mk(`${window.CoupUI?.cardLabelHtml?.(dukeCard) || '<i class="coup-icon-inline"></i> الشلغمي'} +3`, 'tax', 'primary-action', 'قول عندي الشلغمي');
    }

    let captainBtn;
    if (dyn.captainRole === 'lawyer') {
        captainBtn = mk(`${window.CoupUI?.cardLabelHtml?.(captainCard) || '⚖️ الكبران'}: فاتورة`, 'invoice', 'primary-action', 'بعث فاتورة زوز فلوس');
    } else if (dyn.captainRole === 'customsOfficer') {
        captainBtn = mk(`${window.CoupUI?.cardLabelHtml?.(captainCard) || '🛃 سي فلان'}: ضريبة`, 'taxAssignment', 'primary-action', 'افرض ضريبة (+1/+2/+3)');
    } else {
        captainBtn = mk(`${window.CoupUI?.cardLabelHtml?.(captainCard) || '⚓ الرايس'}: اسرق`, 'steal', 'primary-action', 'اسرق زوز فلوس');
    }

    let ambBtns;
    if (dyn.ambRole === 'inquisitor') {
        ambBtns = `<button class="coup-action-btn" data-inquisitor-choose="1" style="--action-img:url('${_onlineImgBase}inquireExchange.webp')" data-has-bg="1"><strong>${window.CoupUI?.cardLabelHtml?.(ambCard) || '🔍 البحاث'}<span class="coup-action-info" data-action-info="inquireExchange">ℹ️</span></strong><small>اختار: بدّل أو فحص</small></button>`;
    } else if (dyn.ambRole === 'jester') {
        ambBtns = mk(`${window.CoupUI?.cardLabelHtml?.(ambCard) || '🎭 العمدة'}: فوضى`, 'jesterDisorder', 'primary-action', 'اختلط كوارط لاعب');
    } else if (dyn.ambRole === 'socialist') {
        ambBtns = mk(`${window.CoupUI?.cardLabelHtml?.(ambCard) || '🤝 المدير'}: وزّع`, 'socialistShare', 'primary-action', 'خذ من الكل');
    } else {
        ambBtns = mk(`${window.CoupUI?.cardLabelHtml?.(ambCard) || '🤝 السمسار'}: بدّل`, 'exchange', '', 'بدّل كوارطك مع الدكّة');
    }

    panel.innerHTML += `<div class="coup-action-grid ${isTurn?'':'is-disabled'}">
        ${mk('🪙 شهرية +1','income','','مضمون وما يتكذبش')}
        ${mk('🤲 اعانة +2','foreignAid','', dyn.aidBlockRoles.length ? `ينجم ${window.CoupGame?.cards?.[dyn.aidBlockRoles[0]]?.name || 'الشلغمي'} يسكّرها` : 'ما تتسكرش')}
        ${dukeBtn}
        ${captainBtn}
        ${mk(`${window.CoupUI?.cardLabelHtml?.(window.coupCards.assassin) || '🗡️ حفار القبور'} -${th.assassinate}`,'assassinate','danger-action','يلزم حفار القبور')}
        ${ambBtns}
        ${mk(`💥 Coup -${th.coup}`,'coup','danger-action','ضربة ما تتسكرش')}
    </div>`;
    panel.querySelectorAll('.coup-action-info').forEach(info => info.addEventListener('click', e => {
        e.stopPropagation();
        const meta = window.coupActionHelp[info.dataset.actionInfo];
        if (meta) window.CoupUI?.showModal?.(meta.title, `<p class="coup-card-desc">${window.CoupUI.escapeHtml(meta.text)}</p>`);
    }));
    panel.querySelectorAll('[data-coup-action]').forEach(btn => btn.addEventListener('click', e => {
        if (e.target.closest('.coup-action-info')) return;
        if (btn.getAttribute('aria-disabled') === 'true') return;
        btn.disabled = true;
        _onlineCoupChoose(btn.dataset.coupAction);
    }));
    panel.querySelectorAll('[data-inquisitor-choose]').forEach(btn => btn.addEventListener('click', e => {
        if (btn.getAttribute('aria-disabled') === 'true') return;
        window.CoupUI?.showModal?.('البحاث: اختار الأكشن',
            `<div class="coup-target-grid">
                <button class="coup-target-btn primary-action" data-inquisitor-action="inquireExchange">بدّل كارطة مع الدكة</button>
                <button class="coup-target-btn primary-action" data-inquisitor-action="inquireInspect">فحص كارطة لاعب</button>
            </div>`,
            overlay => {
                overlay.querySelectorAll('[data-inquisitor-action]').forEach(actionBtn => actionBtn.addEventListener('click', () => {
                    window.CoupUI.closeModal();
                    _onlineCoupChoose(actionBtn.dataset.inquisitorAction);
                }));
            }
        );
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


async function _onlineCoupChooseEstateClaim(claimantId, estateId = null) {
    await _onlineCoupMutateState(async state => {
        const estate = state.pendingEstateClaim;
        if (!estate) return null;
        if (estateId && estate.id !== estateId) return null;
        const eliminated = state.players.find(p => p.id === estate.eliminatedId);
        const claimant = state.players.find(p => p.id === claimantId);
        if (!eliminated || !claimant) return null;
        if (!claimant.hand.some(c => !c.lost)) return null; // already eliminated
        state.pendingEstateClaim = null;
        // Use the standard pending machinery: actorId = claimant, claim = 'lawyer'
        // so _onlineCoupChallenge and _onlineCoupPass work without modification
        state.pending = {
            id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
            type:'estateClaim',
            action:'estateClaim',
            actorId: claimantId,      // claimant IS the actor for challenge purposes
            claimantId,
            eliminatedId: estate.eliminatedId,
            coinsToClaim: estate.coinsToClaim,
            claim: 'lawyer',          // challengeable
            blockable: false,
            blockRoles: [],
            passes:[]
        };
        _onlineCoupSetResponseDeadline(state.pending);
        state.log = `${claimant.name} يدعي الكبران ويطالب بميراث ${eliminated.name} (${estate.coinsToClaim} فلوس). تقدر تكذّبو!`;
        _onlineCoupEvent(state, state.log, 'notice');
        return state;
    });
}

async function _onlineCoupSkipEstateClaim(estateId = null) {
    await _onlineCoupMutateState(async state => {
        const estate = state.pendingEstateClaim;
        if (!estate) return null;
        if (estateId && estate.id !== estateId) return null;
        const eliminated = state.players.find(p => p.id === estate.eliminatedId);
        state.pendingEstateClaim = null;
        state.log = `${eliminated?.name || ''} حتى واحد ما طالب بالتركة`;
        _onlineCoupEvent(state, state.log, 'notice');
        _onlineCoupNextTurn(state);
        return state;
    });
}

function _onlineCoupChoose(action) {
    const state = structuredClone(_room.word_obj);
    const actor = state.players[state.turnIndex || 0];
    const th = _getOnlineCoupThresholds(state);
    const reenable = () => {
        document.querySelectorAll('.coup-action-btn').forEach(b => {
            if (b.getAttribute('aria-disabled') !== 'true') b.disabled = false;
        });
    };
    if (actor.id !== _myId) { reenable(); return; }
    if ((actor.coins || 0) >= th.mustCoup && action !== 'coup') { reenable(); return showToast(`عندك ${th.mustCoup} فلوس ولا أكثر، لازم تعمل Coup.`); }
    if (action === 'assassinate' && actor.coins < th.assassinate) { reenable(); return showToast(`يلزمك ${th.assassinate} فلوس للاغتيال.`); }
    if (action === 'coup' && actor.coins < th.coup) { reenable(); return showToast(`يلزمك ${th.coup} فلوس للCoup.`); }
    if (['assassinate','coup','steal','invoice','bureaucratTax','inquireInspect','jesterDisorder'].includes(action)) return _onlineCoupPickTarget(action);
    // Customs Officer: pick a specific role to tax (one turn only)
    if (action === 'taxAssignment') {
        const esc = window.CoupUI?.escapeHtml || (x => x);
        const rolesInPlay = _room.word_obj?.rolesInPlay || ['assassin', 'captain', 'contessa', 'duke', 'ambassador'];
        const roleBtns = rolesInPlay.map(role => {
            const meta = window.coupCards?.[role] || { icon: '🂠', name: role };
            return `<button class="coup-target-btn" data-tax-role="${esc(role)}">${meta.icon} ${esc(meta.name)} (+1)</button>`;
        }).join('');
        window.CoupUI?.showModal?.('سي فلان: اختار الدور اللي تفرض عليه ضريبة',
            `<p>اختار دور واحد. أي لاعب يدعيه هذا الدور يدفع لك +1 فلوس. الضريبة تدوم دورة واحدة فقط.</p>
             <div class="coup-target-grid">${roleBtns}</div>`,
            overlay => {
                overlay.querySelectorAll('[data-tax-role]').forEach(btn => btn.addEventListener('click', () => {
                    const taxedRole = btn.dataset.taxRole;
                    window.CoupUI.closeModal();
                    _onlineCoupStartPending(action, null, taxedRole);
                }));
            }
        );
        return;
    }
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
    const titles = {
        steal: 'اختار شكون تسرق',
        invoice: 'اختار شكون تبعثلو فاتورة',
        assassinate: 'اختار شكون تضرب',
        coup: 'اختار الهدف',
        bureaucratTax: 'اختار شكون يخذ +1',
        inquireInspect: 'اختار شكون تفحص كارطتو',
        jesterDisorder: 'اختار شكون تعمل فيه فوضى'
    };
    const hints = {
        steal: 'الرايس يسرق حتى زوز فلوس من لاعب.',
        invoice: 'الكبران يبعث فاتورة لاعب ويأخذ حتى زوز فلوس.',
        assassinate: 'حفار القبور يحتاج هدف واضح.',
        coup: 'Coup ضربة مباشرة وما تتسكرش.',
        bureaucratTax: 'الشيخ يعطي +1 لأي لاعب تختاره.',
        inquireInspect: 'البحاث يشوف كارطة لاعب ويحتمل يجبره يبدّلها.',
        jesterDisorder: 'العمدة يخذ كارطة عشوائية من الهدف.'
    };
    window.CoupUI?.showModal?.(titles[action] || 'اختار الهدف', `
        <p>${hints[action] || ''}</p>
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

async function _onlineCoupStartPending(action, targetId, taxType = null) {
    await _onlineCoupMutateState(async state => {
        if (state.pending || state.pendingLoss || state.pendingExchange) return null;
        const actor = state.players[state.turnIndex || 0];
        const th = _getOnlineCoupThresholds(state);
        if (!actor || actor.id !== _myId || !_onlineCoupLiveCards(actor).length) return null;
        if ((actor.coins || 0) >= th.mustCoup && action !== 'coup') return null;
        if (action === 'assassinate' && actor.coins < th.assassinate) return null;
        if (action === 'coup' && actor.coins < th.coup) return null;
        if (['assassinate','coup','steal','invoice','bureaucratTax','inquireInspect','jesterDisorder'].includes(action)) {
            const target = _onlineCoupAlive(state).find(p => p.id === targetId && p.id !== actor.id);
            if (!target) return null;
        }

        // Check for Customs Officer role-based taxes (matching specific taxedRole)
        const claim = _onlineCoupActionClaim(action, state);
        const taxes = state.taxAssignments || [];
        if (taxes.length > 0 && claim) {
            const { total, officers } = _onlineCoupComputeTotalTax(state, claim, action);
            if (total > 0) {
                if (actor.coins < total) {
                    state.log = `${actor.name} ما يقدرش يكمّل — يلزمه ${total} فلوس ضريبة لسي فلان وما عندوش.`;
                    _onlineCoupEvent(state, state.log, 'bad');
                    return null;
                }
                actor.coins -= total;
                for (const { officer, amount } of officers) officer.coins += amount;
                const detail = officers.map(({ officer, amount }) => `${amount}→${officer.name}`).join('، ');
                state.log = `${actor.name} دفع ضريبة ${total} فلوس (${detail}) لسي فلان.`;
                _onlineCoupEvent(state, state.log, 'notice');
            }
        }

        const dyn = _onlineCoupDynamic(state);
        const claims = {
            tax: dyn.dukeRole, bureaucratTax: 'bureaucrat', speculatorGamble: 'speculator',
            assassinate: 'assassin', exchange: dyn.ambRole, inquireExchange: 'inquisitor',
            inquireInspect: 'inquisitor', jesterDisorder: 'jester', socialistShare: 'socialist',
            steal: dyn.captainRole, invoice: 'lawyer', taxAssignment: 'customsOfficer'
        };
        const blockRoles =
            action === 'foreignAid'    ? dyn.aidBlockRoles :
            action === 'assassinate'   ? ['contessa'] :
            action === 'invoice'       ? dyn.invoiceBlockRoles :
            action === 'taxAssignment' ? dyn.taxAssignmentBlockRoles :
            ['steal','inquireExchange','inquireInspect','socialistShare'].includes(action) ? dyn.stealBlockRoles :
            action === 'jesterDisorder' ? dyn.jesterBlockRoles :
            [];
        const blockable = blockRoles.length > 0;
        const finalClaim = claims[action] || null;
        if (!finalClaim && !blockable) return _onlineCoupApplyActionLocal(state, action, targetId);
        if (action === 'assassinate') {
            actor.coins -= th.assassinate;
            _onlineCoupPayBank(state, th.assassinate);
        }
        state.pending = { id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, stage: null, action, actorId:actor.id, targetId, claim: finalClaim, blockable, blockRoles, passes:[], taxType };
        _onlineCoupSetResponseDeadline(state.pending);
        state.log = `${actor.name} قال يعمل ${_onlineCoupActionName(action)}. قولولو "تكذب!" كان شاكين.`;
        _onlineCoupEvent(state, `${actor.name} عمل ${_onlineCoupActionName(action)}`, 'notice');
        if (finalClaim) {
            _showCardUseAnimation(actor.name, finalClaim);
        }
        return state;
    });
}

async function _onlineCoupChallenge(challengerId, pendingId = null) {
    window.CoupUI?.closeModal?.();
    await _onlineCoupMutateState(async state => {
        const p = state.pending;
        if (!p || p.stage === 'block' || !p.claim || (pendingId && p.id !== pendingId)) return null;
        const isDeflectChallenge = p.stage === 'deflect';
        const claimantId = _onlineCoupPendingClaimantId(p);
        const claimant = state.players.find(x=>x.id===claimantId);
        const challenger = state.players.find(x=>x.id===challengerId);
        const th = _getOnlineCoupThresholds(state);
        if (!claimant || !challenger || challenger.id === claimant.id || !_onlineCoupLiveCards(challenger).length) return null;
        const hasIt = claimant.hand.some(c=>!c.lost && c.type===p.claim);
        if (hasIt) {
            _onlineCoupProveAndReplace(state, claimant, p.claim);
            state.log = `${challenger.name} طلع غالط! ${claimant.name} عندو الكارتة. ${_onlineCoupWrong()}`;
            _onlineCoupEvent(state, state.log, 'bad', { triggerNotLying: claimant.name, notLyingCardType: p.claim });

            let next;
            if (isDeflectChallenge) {
                next = { type: 'acceptDeflect', pending: { ...p, alreadyProven: true } };
            } else {
                next = p.blockable ? _onlineCoupResumeBlockNext(p, claimant.name) : { type: 'applyAction', action: p.action, targetId: p.targetId };
            }
            _onlineCoupRequestLoss(state, challengerId, 'طلعت غالط في التكذيب. اختار كارتة تخسرها.', next);
        } else {
            const actor = state.players.find(x => x.id === p.actorId);
            // Rulebook: "If an action is successfully challenged the entire action fails,
            // and any coins paid as the cost of the action are returned to the player."
            if (p.action === 'assassinate' && !isDeflectChallenge) {
                actor.coins += th.assassinate;
                _onlineCoupTakeFromBank(state, th.assassinate);
            }
            // Speculator penalty: failed bluff transfers ALL of actor's coins to the challenger
            if (p.action === 'speculatorGamble' && claimant.coins > 0) {
                const penalty = claimant.coins;
                challenger.coins += penalty;
                claimant.coins = 0;
                state.log = `${claimant.name} تڨبض يبوّع على الكُلّاب! ${_onlineCoupCaught()} خسر كارتة وكل فلوسو (${penalty}) راحت لـ${challenger.name}!`;
            // taxAssignment bluff penalty: pay challenger the attempted tax amount
            } else if (p.action === 'taxAssignment' && p.taxType) {
                const penalty = Math.min(1, claimant.coins);
                if (penalty > 0) {
                    claimant.coins -= penalty;
                    challenger.coins += penalty;
                    state.log = `${claimant.name} تڨبض يبوّع على سي فلان! ${_onlineCoupCaught()} يدفع ${penalty} فلوس لـ${challenger.name}!`;
                } else {
                    state.log = `${claimant.name} تڨبض يبوّع على سي فلان! ${_onlineCoupCaught()} ما عندوش فلوس يدفعها.`;
                }
            } else if (p.action === 'reactiveTax') {
                state.log = `${claimant.name} تڨبض يبوّع على سي فلان! ${_onlineCoupCaught()}`;
            } else if (isDeflectChallenge) {
                claimant.coins += CONTESSA_DEFLECT_COST;
                _onlineCoupTakeFromBank(state, CONTESSA_DEFLECT_COST);
                state.log = `${claimant.name} حاول يحوّل الاغتيال وطلع يبوّع! ${_onlineCoupCaught()}`;
            } else {
                state.log = `${claimant.name} تڨبض يبوّع! ${_onlineCoupCaught()}`;
            }
            _onlineCoupEvent(state, state.log, 'bad');
            const lossNext = isDeflectChallenge ? { type: 'applyAction', action: 'assassinate', targetId: claimant.id } : (p.next || { type: 'nextTurn' });
            _onlineCoupRequestLoss(state, claimant.id, 'تكذّبت وما عندكش الكارتة. اختار كارتة تكشفها.', lossNext);
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
                const actor = state.players.find(x=>x.id===p.actorId);
                state.pending = null;
                // Reactive tax prompt for contessa block of assassination
                if ((p.action === 'assassination' || p.action === 'assassinate') && p.blockRole === 'contessa') {
                    if ((state.rolesInPlay || []).includes('customsOfficer') && actor) {
                        state.pendingReactiveTax = {
                            id: `rt_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                            eventType: 'contessaBlock', actorId: actor.id, amount: 1,
                            respondedIds: [],
                            next: { type: 'nextTurn' }
                        };
                        state.log = `سي فلان: هل تدعي الضريبة على بلوك البية؟ (+1 فلوس من ${actor.name})`;
                        _onlineCoupEvent(state, state.log, 'notice');
                        return state;
                    }
                }
                if (p.action === 'reactiveTax') {
                    // If reactiveTax is passed/unchallenged, it applies
                    return _onlineCoupApplyActionLocal(state, p.action, p.targetId);
                }
                _onlineCoupNextTurn(state);
            } else if (p.stage === 'deflect') {
                state.pending = null;
                return _onlineCoupAcceptDeflect(state, p);
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
        if (p.action !== 'foreignAid' && p.action !== 'reactiveTax' && p.targetId && p.targetId !== blocker.id) return null;
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
        const actor   = state.players.find(x=>x.id===p.actorId);
        state.log = `${blocker?.name || ''} سكّرها. الأكشن مات غادي.`;
        _onlineCoupEvent(state, state.log, 'good');
        state.pending = null;
        // Reactive tax prompt for contessa block of assassination
        if ((p.action === 'assassination' || p.action === 'assassinate') && p.blockRole === 'contessa') {
            if ((state.rolesInPlay || []).includes('customsOfficer') && actor) {
                state.pendingReactiveTax = {
                    id: `rt_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                    eventType: 'contessaBlock', actorId: actor.id, amount: 1,
                    respondedIds: [],
                    next: { type: 'nextTurn' }
                };
                state.log = `سي فلان: هل تدعي الضريبة على بلوك البية؟ (+1 فلوس من ${actor.name})`;
                _onlineCoupEvent(state, state.log, 'notice');
                return state;
            }
        }
        if (p.action === 'reactiveTax') {
            const next = p.next || { type: 'nextTurn' };
            if (next.type === 'applyLoss') {
                if (!_onlineCoupRequestLoss(state, next.targetId, next.reason || '', { type: 'nextTurn' })) _onlineCoupNextTurn(state);
            } else {
                _onlineCoupNextTurn(state);
            }
            return state;
        }
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
        _onlineCoupEvent(state, state.log, 'bad', { triggerNotLying: blocker.name, notLyingCardType: p.blockRole });
            _onlineCoupRequestLoss(state, challenger.id, 'طلعت غالط في تكذيب البلوك. اختار كارتة تخسرها.', { type:'nextTurn' });
        } else {
            state.log = `${blocker.name} حاول يسكّر وطلع يبوّع. الأكشن يكمل.`;
            _onlineCoupEvent(state, state.log, 'bad');
            _onlineCoupRequestLoss(state, blocker.id, 'البلوك كان تبلعيط. اختار كارتة تكشفها.', { type:'applyAction', action:p.action, targetId:p.targetId });
        }
        return state;
    });
}

// ── Reactive Customs Officer tax (after assassination/coup/contessa block) ──────

function _onlineCoupDeflectPickTarget(pendingId) {
    const state = _room?.word_obj;
    if (!state) return;
    const p = state.pending;
    if (!p || p.id !== pendingId) return;
    const actor = state.players.find(x => x.id === p.actorId);
    const targets = _onlineCoupAlive(state).filter(pl => pl.id !== _myId && pl.id !== actor.id);
    const esc = window.CoupUI?.escapeHtml || (x => x);

    window.CoupUI?.showModal?.('البية: اختار شكون تحوّل له الاغتيال',
        `<p>باش تدفع ${CONTESSA_DEFLECT_COST} فرنك وتحوّل الاغتيال لواحد آخر. اللاعبين ينجموا يقولو "تكذب!" على البية.</p>
         <div class="coup-target-grid">${targets.map(pl => `<button class="coup-target-btn" data-deflect-target="${pl.id}">${esc(pl.name)}</button>`).join('')}</div>`,
        overlay => {
            overlay.querySelectorAll('[data-deflect-target]').forEach(btn => btn.addEventListener('click', () => {
                btn.disabled = true;
                window.CoupUI.closeModal();
                _onlineCoupDeflect(_myId, btn.dataset.deflectTarget, pendingId);
            }));
        }
    );
}

async function _onlineCoupDeflect(deflectorId, deflectTargetId, pendingId) {
    await _onlineCoupMutateState(async state => {
        const p = state.pending;
        if (!p || p.id !== pendingId || p.stage !== null || p.action !== 'assassinate') return null;
        if (p.targetId !== deflectorId) return null;
        const deflector = state.players.find(x => x.id === deflectorId);
        const newTarget = state.players.find(x => x.id === deflectTargetId);
        if (!deflector || !newTarget || (deflector.coins || 0) < CONTESSA_DEFLECT_COST) return null;

        deflector.coins -= CONTESSA_DEFLECT_COST;
        _onlineCoupPayBank(state, CONTESSA_DEFLECT_COST);

        state.pending = {
            ...p,
            id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            stage: 'deflect',
            deflectorId,
            deflectTargetId,
            claim: 'contessa',
            blockable: true,
            blockRoles: ['contessa'],
            passes: [],
            canDeflect: false // cannot deflect a deflected assassination
        };
        _onlineCoupSetResponseDeadline(state.pending);
        state.log = `${deflector.name} دفع ${CONTESSA_DEFLECT_COST} فرنك وقال عندي "البية" وحوّل الاغتيال لـ${newTarget.name}. تقدر تكذّبه!`;
        _onlineCoupEvent(state, state.log, 'notice');
        return state;
    });
}

function _onlineCoupAcceptDeflect(state, p, alreadyProven = false) {
    const deflector = state.players.find(x => x.id === p.deflectorId);
    const newTarget = state.players.find(x => x.id === p.deflectTargetId);
    const actor     = state.players.find(x => x.id === p.actorId);

    // Prove and replace Contessa for deflector if they actually have it and haven't already proven it this turn
    if (!alreadyProven && deflector && deflector.hand.some(c => !c.lost && c.type === 'contessa')) {
        _onlineCoupProveAndReplace(state, deflector, 'contessa');
    }

    state.log = `البية حوّلت الاغتيال بنجاح. ${newTarget?.name || ''} توة هو المستهدف!`;
    _onlineCoupEvent(state, state.log, 'good');

    // Create a new pending for the assassination hitting the new target
    state.pending = {
        ...p,
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        stage: null, // back to action stage (waiting for block/challenge)
        targetId: p.deflectTargetId,
        claim: null, // Original claim was already handled or not relevant now
        blockable: true,
        blockRoles: ['contessa'],
        passes: [],
        canDeflect: false // important: cannot deflect again
    };
    _onlineCoupSetResponseDeadline(state.pending);
    return state;
}

async function _onlineCoupReactiveTaxRespond(claim, taxId = null) {
    // claim: true = claim customsOfficer, false = pass.
    // First valid claim wins — once claimed, the window closes for everyone else.
    await _onlineCoupMutateState(async state => {
        const rt = state.pendingReactiveTax;
        if (!rt) return null;
        if (taxId && rt.id !== taxId) return null;
        const me = state.players.find(p => p.id === _myId);
        if (!me || !me.hand.some(c => !c.lost)) return null;
        if ((rt.respondedIds || []).includes(_myId)) return null;
        if (_myId === rt.actorId) return null; // actor can't tax themselves
        if (!rt.respondedIds) rt.respondedIds = [];

        if (claim) {
            if (rt.claimedById) {
                rt.respondedIds.push(_myId);
            } else {
                rt.claimedById = _myId;
                // Mark all remaining eligible players as responded so the window closes.
                const alive = _onlineCoupAlive(state);
                alive.forEach(p => {
                    if (p.id !== rt.actorId && !rt.respondedIds.includes(p.id)) {
                        rt.respondedIds.push(p.id);
                    }
                });
            }
        } else {
            rt.respondedIds.push(_myId);
        }

        // Check if all eligible players have responded
        const alive = _onlineCoupAlive(state);
        const eligible = alive.filter(p => p.id !== rt.actorId);
        const allResponded = eligible.every(p => rt.respondedIds.includes(p.id));
        if (allResponded) {
            const claimantId = rt.claimedById;
            const rtBackup = { ...rt };
            state.pendingReactiveTax = null;
            if (claimantId) {
                state.pending = {
                    id: `p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                    action: 'reactiveTax',
                    actorId: claimantId,
                    targetId: rtBackup.actorId,
                    amount: rtBackup.amount,
                    next: rtBackup.next,
                    claim: 'customsOfficer',
                    blockable: true,
                    blockRoles: ['customsOfficer'],
                    passes: []
                };
                _onlineCoupSetResponseDeadline(state.pending);
                const claimant = state.players.find(p => p.id === claimantId);
                const originalActor = state.players.find(p => p.id === rtBackup.actorId);
                state.log = `${claimant.name} ادعى سي فلان ويطالب بضريبة من ${originalActor.name}. تقدر تكذّبو ولا تسكّر بسي فلان!`;
                _onlineCoupEvent(state, state.log, 'notice');
            } else {
                const next = rtBackup.next || { type: 'nextTurn' };
                if (next.type === 'applyLoss') {
                    if (!_onlineCoupRequestLoss(state, next.targetId, next.reason || '', { type: 'nextTurn' })) _onlineCoupNextTurn(state);
                } else {
                    _onlineCoupNextTurn(state);
                }
            }
        }
        return state;
    });
}

function _renderOnlineCoupReactiveTaxBanner(state, me) {
    const rt = state.pendingReactiveTax;
    const actor = state.players.find(p => p.id === rt?.actorId);
    const esc = window.CoupUI?.escapeHtml || (x => x);
    const labels = {
        assassination: `اغتيال (+${rt?.amount} فلوس من ${esc(actor?.name || '?')})`,
        coup:          `Coup (+${rt?.amount} فلوس من ${esc(actor?.name || '?')})`,
        contessaBlock: `بلوك البية (+${rt?.amount} فلوس من ${esc(actor?.name || '?')})`,
    };
    const label = labels[rt?.eventType] || `+${rt?.amount} فلوس`;
    const hasResponded = (rt?.respondedIds || []).includes(me?.id);
    const isActor = me?.id === rt?.actorId;
    const alreadyClaimed = !!rt?.claimedById;
    const claimedByMe = rt?.claimedById === me?.id;
    const claimedByPlayer = alreadyClaimed ? state.players.find(p => p.id === rt.claimedById) : null;
    const alive = _onlineCoupAlive(state);
    const eligible = alive.filter(p => p.id !== rt?.actorId);
    const waitingCount = eligible.filter(p => !(rt?.respondedIds || []).includes(p.id)).length;
    const wrap = document.createElement('div');
    wrap.className = 'coup-pending-banner';
    if (alreadyClaimed) {
        // Tax already won — show outcome to everyone.
        const claimedName = esc(claimedByPlayer?.name || '?');
        wrap.innerHTML = `
            <div class="coup-pending-title">سي فلان: ضريبة ردّ فعل</div>
            <strong>${label}</strong>
            <p>${claimedByMe ? `✅ تقبّضت الضريبة.` : `✅ ${claimedName} تقبّض الضريبة. الفرصة راحت.`}</p>
        `;
    } else if (isActor || hasResponded) {
        wrap.innerHTML = `
            <div class="coup-pending-title">سي فلان: ضريبة ردّ فعل</div>
            <strong>${label}</strong>
            <p>${isActor ? `نستناو اللاعبين يردّوا على الضريبة. (${waitingCount} بقيوا)` : `ردّيت. نستناو ${waitingCount} لاعبين.`}</p>
        `;
    } else {
        wrap.innerHTML = `
            <div class="coup-pending-title">سي فلان: ضريبة ردّ فعل</div>
            <strong>${label}</strong>
            <p>تحب تدعي سي فلان وتتقبّض على ${rt?.amount} فلوس من ${esc(actor?.name || '?')}؟ أول واحد يدعي يتقبّض.</p>
            <div class="coup-pending-actions">
                <button class="coup-target-btn primary-action" id="rt-claim-yes">✅ نعم، ادعي سي فلان (+${rt?.amount})</button>
                <button class="coup-target-btn quiet-action" id="rt-claim-no">لا، تخطي</button>
            </div>
        `;
        wrap.querySelector('#rt-claim-yes')?.addEventListener('click', e => {
            e.currentTarget.disabled = true;
            _onlineCoupReactiveTaxRespond(true, rt?.id);
        });
        wrap.querySelector('#rt-claim-no')?.addEventListener('click', e => {
            e.currentTarget.disabled = true;
            _onlineCoupReactiveTaxRespond(false, rt?.id);
        });
    }
    return wrap;
}

async function _onlineCoupAIReactiveTax(state, ai) {
    const rt = state.pendingReactiveTax;
    if (!rt || (rt.respondedIds || []).includes(ai.id) || ai.id === rt.actorId) return;
    const taxId = rt.id;
    // AI only tries to claim if no one has claimed yet; 40% chance otherwise it passes.
    const shouldClaim = !rt.claimedById && Math.random() < 0.4;
    await _onlineCoupMutateState(async state => {
        const rt = state.pendingReactiveTax;
        if (!rt || rt.id !== taxId) return null;
        if ((rt.respondedIds || []).includes(ai.id) || ai.id === rt.actorId) return null;
        if (!rt.respondedIds) rt.respondedIds = [];

        if (shouldClaim && !rt.claimedById) {
            rt.claimedById = ai.id;
            // Mark all remaining eligible players as responded so the window closes.
            const alive = _onlineCoupAlive(state);
            alive.forEach(p => {
                if (p.id !== rt.actorId && !rt.respondedIds.includes(p.id)) {
                    rt.respondedIds.push(p.id);
                }
            });
        } else {
            rt.respondedIds.push(ai.id);
        }

        const alive = _onlineCoupAlive(state);
        const eligible = alive.filter(p => p.id !== rt.actorId);
        const allResponded = eligible.every(p => rt.respondedIds.includes(p.id));
        if (allResponded) {
            const claimantId = rt.claimedById;
            const rtBackup = { ...rt };
            state.pendingReactiveTax = null;
            if (claimantId) {
                state.pending = {
                    id: `p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                    action: 'reactiveTax',
                    actorId: claimantId,
                    targetId: rtBackup.actorId,
                    amount: rtBackup.amount,
                    next: rtBackup.next,
                    claim: 'customsOfficer',
                    blockable: true,
                    blockRoles: ['customsOfficer'],
                    passes: []
                };
                _onlineCoupSetResponseDeadline(state.pending);
                const claimant = state.players.find(p => p.id === claimantId);
                const originalActor = state.players.find(p => p.id === rtBackup.actorId);
                state.log = `${claimant.name} ادعى سي فلان ويطالب بضريبة من ${originalActor.name}. تقدر تكذّبو ولا تسكّر بسي فلان!`;
                _onlineCoupEvent(state, state.log, 'notice');
            } else {
                const next = rtBackup.next || { type: 'nextTurn' };
                if (next.type === 'applyLoss') {
                    if (!_onlineCoupRequestLoss(state, next.targetId, next.reason || '', { type: 'nextTurn' })) _onlineCoupNextTurn(state);
                } else {
                    _onlineCoupNextTurn(state);
                }
            }
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
    const pBackup = state.pending ? { ...state.pending } : null;
    const pendingTaxType = state.pending?.taxType || null;
    state.pending = null;
    if (action === 'income') { actor.coins += 1; _onlineCoupTakeFromBank(state, 1); state.log = `${actor.name} خذا دينار. رزق بارد.`; }
    if (action === 'foreignAid') { actor.coins += 2; _onlineCoupTakeFromBank(state, 2); state.log = `${actor.name} خذا اعانة. ما تسكّرتش.`; }
    if (action === 'tax') { actor.coins += 3; _onlineCoupTakeFromBank(state, 3); state.log = `${actor.name} كول بالشلغمي وخذا 3 فلوس.`; }
    if (action === 'bureaucratTax' && target) {
        actor.coins += 2; _onlineCoupTakeFromBank(state, 3);
        target.coins += 1;
        state.log = `${actor.name} كول بالشيخ، خذا +2 وعطا +1 لـ${target.name}.`;
    }
    if (action === 'speculatorGamble') {
        const gain = Math.min(actor.coins, 5);
        actor.coins += gain; _onlineCoupTakeFromBank(state, gain);
        state.log = gain > 0 ? `${actor.name} قامبل بالكلاب وخذا ${gain} فلوس!` : `${actor.name} قامبل بالكلاب أما ما عندوش فلوس.`;
    }
    if (action === 'exchange') {
        _onlineCoupRequestExchange(state, actor.id);
        return state;
    }
    if (action === 'inquireExchange') {
        _onlineCoupRequestExchange(state, actor.id, 1);
        return state;
    }
    if (action === 'inquireInspect' && target) {
        const liveCards = target.hand.map((c, i) => ({...c, i})).filter(c => !c.lost);
        if (!liveCards.length) {
            state.log = `${actor.name} حاول يفحص ${target.name} أما ما لقى كوارط.`;
        } else {
            const revCard = liveCards[Math.floor(Math.random() * liveCards.length)];
            state.pendingInspect = {
                id: `pi_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                actorId: actor.id, targetId: target.id,
                revealedCardType: revCard.type, targetHandIdx: revCard.i
            };
            state.log = `${actor.name} يفحص كارطة ${target.name}. ينجم يجبره يبدّلها.`;
            _onlineCoupEvent(state, state.log, 'notice');
            return state;
        }
    }
    if (action === 'jesterDisorder' && target) {
        const drawnType = state.deck.pop();
        if (!drawnType) {
            state.log = `${actor.name} حاول يعمل فوضى أما الدكة خاوية.`;
        } else {
            const targetLive = target.hand.map((c, i) => ({...c, i})).filter(c => !c.lost);
            if (!targetLive.length) {
                state.deck.push(drawnType);
                state.log = `${actor.name} حاول يعمل فوضى أما ${target.name} ما عندوش كوارط.`;
            } else {
                const takenSlot = targetLive[Math.floor(Math.random() * targetLive.length)];
                target.hand[takenSlot.i].lost = true;
                state.pendingJesterSwap = {
                    id: `pj_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                    actorId: actor.id, targetId: target.id,
                    temps: [
                        { type: drawnType, src: 'deck' },
                        { type: takenSlot.type, src: 'target', targetHandIdx: takenSlot.i }
                    ]
                };
                state.log = `${actor.name} جاب من الدكة وخذ عشوائي من ${target.name}. يختار شنوة يبقى معاه.`;
                _onlineCoupEvent(state, state.log, 'notice');
                return state;
            }
        }
    }
    if (action === 'socialistShare') {
        const opponents = _onlineCoupAlive(state).filter(p => p.id !== actor.id);
        if (!opponents.length) {
            state.log = `${actor.name} يلعب لوحدو، ما ينجمش يوزّع.`;
        } else {
            state.pendingSocialistShare = {
                id: `ps_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                actorId: actor.id,
                opponents: opponents.map(opp => ({
                    playerId: opp.id,
                    hasCoins: opp.coins > 0,
                    liveCards: opp.hand.map((c, i) => ({type: c.type, handIdx: i})).filter((_, i) => !opp.hand[i].lost)
                })),
                opponentChoices: {}, // playerId → { take: 'coin' | 'card', handIdx? } | { take: null } = skip
                phase: 'opponents' // 'opponents' then 'actor'
            };
            state.log = `${actor.name} يوزّع بالمدير. كل لاعب يختار: يعطي فلوس أو كارطة.`;
            _onlineCoupEvent(state, state.log, 'notice');
            return state;
        }
    }
    if (action === 'steal' && target) {
        const amount = Math.min(2, target.coins || 0);
        target.coins -= amount;
        actor.coins += amount;
        state.log = amount > 0 ? `${actor.name} سرق ${amount} فلوس من ${target.name}. الرايس دخل للمرسى.` : `${actor.name} حاول يسرق ${target.name} أما ما لقى شي.`;
    }
    // ── Expansion: Lawyer invoice ───────────────────────────────────
    if (action === 'invoice' && target) {
        const amount = Math.min(2, target.coins || 0);
        target.coins -= amount;
        actor.coins += amount;
        state.log = amount > 0 ? `${actor.name} بعث فاتورة لـ${target.name} وخذا ${amount} فلوس. الكبران أخد حقو.` : `${actor.name} بعث فاتورة لـ${target.name} أما ما عندوش فلوس.`;
    }
    // ── Expansion: Customs Officer tax assignment ────────────────────
    if (action === 'taxAssignment') {
        const taxedRole = pendingTaxType || 'assassin';
        if (!state.taxAssignments) state.taxAssignments = [];
        state.taxAssignments = state.taxAssignments.filter(t => t.officerId !== actor.id);
        state.taxAssignments.push({ taxType: 'role', taxedRole, officerId: actor.id, officerTurnIndex: state.turnIndex });
        const roleMeta = window.coupCards?.[taxedRole];
        const taxLabel = roleMeta ? `${roleMeta.icon} ${roleMeta.name} (+1)` : taxedRole;
        state.log = `${actor.name} فرض ضريبة على ${taxLabel}. سي فلان يراقب.`;
        _onlineCoupEvent(state, state.log, 'good');
        _onlineCoupNextTurn(state);
        return state;
    }
    // ── Expansion: Reactive Customs Officer tax resolution ───────────
    if (action === 'reactiveTax') {
        const p = pBackup;
        const claimant = state.players.find(x => x.id === p.actorId);
        const originalActor = state.players.find(x => x.id === p.targetId);
        if (claimant && originalActor) {
            const amount = p.amount || 0;
            const actual = Math.min(amount, originalActor.coins);
            originalActor.coins -= actual;
            claimant.coins += actual;
            state.log = `${claimant.name} تقبّض ${actual} فلوس من ${originalActor.name} بسي فلان.`;
            _onlineCoupEvent(state, state.log, 'good');
        }
        const next = p.next || { type: 'nextTurn' };
        if (next.type === 'applyLoss') {
            if (!_onlineCoupRequestLoss(state, next.targetId, next.reason || '', { type: 'nextTurn' })) _onlineCoupNextTurn(state);
        } else {
            _onlineCoupNextTurn(state);
        }
        return state;
    }
    // ── Expansion: Lawyer estate claim resolution (all passed, unchallenged) ────
    if (action === 'estateClaim') {
        const p = state.pending;
        if (p && p.type === 'estateClaim') {
            const claimant = state.players.find(x => x.id === p.claimantId);
            const eliminated = state.players.find(x => x.id === p.eliminatedId);
            if (claimant && eliminated) {
                // Claimant proves Lawyer (prove-and-replace if they actually have it)
                if (claimant.hand.some(c => !c.lost && c.type === 'lawyer')) {
                    _onlineCoupProveAndReplace(state, claimant, 'lawyer');
                }
                // Give coins and take a loss
                claimant.coins += (p.coinsToClaim || 0);
                state.log = `${claimant.name} أخد ${p.coinsToClaim} فلوس من ${eliminated.name} بالميراث. يخسر كارطة.`;
                _onlineCoupEvent(state, state.log, 'good');
                _onlineCoupRequestLoss(state, claimant.id, 'الكبران يأخذ الميراث لكن يخسر كارطة. اختار كارطة تخسرها.', { type: 'nextTurn' });
            }
        }
        return state;
    }
    if (action === 'assassinate' && target) {
        state.log = `${target.name} تضرّب من حفار القبور. ${target.name} يختار كارتة يخسرها.`;
        _onlineCoupEvent(state, state.log, 'bad');
        // Reactive tax prompt if customsOfficer is in play
        if ((state.rolesInPlay || []).includes('customsOfficer')) {
            state.pendingReactiveTax = {
                id: `rt_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                eventType: 'assassination', actorId: actor.id, amount: 2,
                respondedIds: [], // players who have responded (yes or no)
                next: { type: 'applyLoss', targetId: target.id, reason: 'تضرّبت من حفار القبور. اختار شنية الكارتة الي تخسرها.' }
            };
            state.log = `سي فلان: هل تدعي الضريبة على الاغتيال؟ (+2 فلوس من ${actor.name})`;
            _onlineCoupEvent(state, state.log, 'notice');
            return state;
        }
        if (!_onlineCoupRequestLoss(state, target.id, 'تضرّبت من حفار القبور. اختار شنية الكارتة الي تخسرها.', { type:'nextTurn' })) _onlineCoupNextTurn(state);
        return state;
    }
    if (action === 'coup' && target) {
        const th = _getOnlineCoupThresholds(state);
        actor.coins -= th.coup;
        _onlineCoupPayBank(state, th.coup);
        state.log = `${actor.name} عمل Coup على ${target.name}. ${target.name} يختار كارتة يخسرها.`;
        _onlineCoupEvent(state, state.log, 'bad');
        // Reactive tax prompt if customsOfficer is in play
        if ((state.rolesInPlay || []).includes('customsOfficer')) {
            state.pendingReactiveTax = {
                id: `rt_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                eventType: 'coup', actorId: actor.id, amount: 3,
                respondedIds: [],
                next: { type: 'applyLoss', targetId: target.id, reason: 'تضرّبت بCoup. اختار شنية الكارتة الي تخسرها.' }
            };
            state.log = `سي فلان: هل تدعي الضريبة على الCoup؟ (+3 فلوس من ${actor.name})`;
            _onlineCoupEvent(state, state.log, 'notice');
            return state;
        }
        if (!_onlineCoupRequestLoss(state, target.id, 'تضرّبت بCoup. اختار شنية الكارتة الي تخسرها.', { type:'nextTurn' })) _onlineCoupNextTurn(state);
        return state;
    }
    _onlineCoupEvent(state, state.log, ['assassinate','coup'].includes(action) ? 'bad' : 'good');
    _onlineCoupNextTurn(state);
    return state;
}

// ── Expansion action resolvers ─────────────────────────────────

async function _onlineCoupChooseInspect(forceSwap, inspectId = null) {
    await _onlineCoupMutateState(async state => {
        const insp = state.pendingInspect;
        if (!insp) return null;
        if (inspectId && insp.id !== inspectId) return null;
        if (insp.actorId !== _myId) return null;
        const actor  = state.players.find(p => p.id === insp.actorId);
        const target = state.players.find(p => p.id === insp.targetId);
        if (!actor || !target) return null;
        if (forceSwap) {
            const handCard = target.hand[insp.targetHandIdx];
            if (handCard && !handCard.lost) {
                state.deck.unshift(handCard.type);
                state.deck.sort(() => 0.5 - Math.random());
                handCard.type = state.deck.pop() || handCard.type;
            }
            state.log = `${actor.name} خلّى ${target.name} يبدّل كارطتو.`;
            _onlineCoupEvent(state, state.log, 'notice');
        } else {
            state.log = `${actor.name} شاف كارطة ${target.name} وما عملش شي.`;
            _onlineCoupEvent(state, state.log, 'notice');
        }
        state.pendingInspect = null;
        _onlineCoupNextTurn(state);
        return state;
    });
}

function _onlineCoupPromptJesterActorCard(jester, keepTempIdx) {
    const state = _room?.word_obj;
    if (!state) return;
    const actor = state.players.find(p => p.id === jester.actorId);
    if (!actor) return;
    const actorLive = actor.hand.map((c, i) => ({c, i})).filter(x => !x.c.lost);
    if (actorLive.length === 1) {
        _onlineCoupChooseJesterSwap(keepTempIdx, actorLive[0].i, jester.id);
        return;
    }
    const esc = window.CoupUI?.escapeHtml || (x => x);
    const keptMeta = window.coupCards[jester.temps[keepTempIdx]?.type];
    const keptLabel = keptMeta ? (window.CoupUI?.cardLabelHtml?.(keptMeta) || `${keptMeta.icon} ${esc(keptMeta.name)}`) : '?';
    const cardsHtml = actorLive.map(({c, i}) => {
        const meta = window.coupCards[c.type];
        const label = meta ? (window.CoupUI?.cardLabelHtml?.(meta) || `${meta.icon} ${esc(meta.name)}`) : c.type;
        return `<button class="coup-target-btn" data-swap-idx="${i}">${label}</button>`;
    }).join('');
    window.CoupUI?.showModal?.('اختار كارطة تبدّلها',
        `<p>اختار من كوارطك الكارطة الي تبدّلها بـ${keptLabel}:</p>
         <div class="coup-target-grid">${cardsHtml}</div>`,
        overlay => {
            overlay.querySelectorAll('[data-swap-idx]').forEach(btn => btn.addEventListener('click', () => {
                window.CoupUI.closeModal();
                _onlineCoupChooseJesterSwap(keepTempIdx, parseInt(btn.dataset.swapIdx, 10), jester.id);
            }));
        }
    );
}

async function _onlineCoupChooseJesterSwap(keepTempIdx, replaceActorCardIdx, jesterId = null) {
    await _onlineCoupMutateState(async state => {
        const jester = state.pendingJesterSwap;
        if (!jester) return null;
        if (jesterId && jester.id !== jesterId) return null;
        if (jester.actorId !== _myId) return null;
        const actor  = state.players.find(p => p.id === jester.actorId);
        const target = state.players.find(p => p.id === jester.targetId);
        if (!actor || !target) return null;
        const temps = jester.temps;
        const keptType  = temps[keepTempIdx]?.type;
        const otherTemp = temps[1 - keepTempIdx];
        if (!keptType || !otherTemp) return null;
        const actorCard = actor.hand[replaceActorCardIdx];
        if (!actorCard || actorCard.lost) return null;
        const oldType = actorCard.type;
        actorCard.type = keptType;
        const takenTemp = temps.find(t => t.src === 'target');
        if (otherTemp.src === 'target') {
            target.hand[takenTemp.targetHandIdx] = { type: otherTemp.type, lost: false };
            state.deck.unshift(oldType);
        } else {
            state.deck.unshift(otherTemp.type);
            target.hand[takenTemp.targetHandIdx] = { type: oldType, lost: false };
        }
        state.deck.sort(() => 0.5 - Math.random());
        state.pendingJesterSwap = null;
        state.log = `${actor.name} عمل فوضى مع ${target.name}. الكوارط اختلطت!`;
        _onlineCoupEvent(state, state.log, 'notice');
        _onlineCoupNextTurn(state);
        return state;
    });
}

// selections: [{ playerId, take: null|'coin'|cardType, handIdx? }]
// actorHandIdx: index in actor.hand of the card they put into the pool (null if no cards taken)
// Called by each OPPONENT to submit their choice (coin or card)
async function _onlineCoupSocialistOpponentChoose(shareId, take, handIdx = null) {
    await _onlineCoupMutateState(async state => {
        const share = state.pendingSocialistShare;
        if (!share || share.id !== shareId) return null;
        // Accept both 'opponents' phase and missing phase (treat missing as 'opponents')
        if (share.phase && share.phase !== 'opponents') return null;
        const me = state.players.find(p => p.id === _myId);
        if (!me) return null;
        // Must be an opponent (not the actor)
        if (_myId === share.actorId) return null;
        const opp = share.opponents.find(o => o.playerId === _myId);
        if (!opp) return null;
        // Defensive: ensure opponentChoices exists
        if (!share.opponentChoices) share.opponentChoices = {};
        // Already chose — don't overwrite
        if (share.opponentChoices[_myId] !== undefined) return null;
        // Record choice
        share.opponentChoices[_myId] = { take, handIdx: handIdx ?? null };

        // Check if all opponents have chosen
        const allChosen = share.opponents.every(o => share.opponentChoices[o.playerId] !== undefined);
        if (allChosen) {
            share.phase = 'actor';
            state.log = `كل اللاعبين اختاروا. المدير يختار واحدين من الحوض.`;
            _onlineCoupEvent(state, state.log, 'notice');
        }
        return state;
    });
}

// Called by ACTOR to finalize: keptCardTypes is array of 2 card type strings chosen from the pool
// keptChoice = { keptActorHandIndices: number[], keptOpponentPlayerIds: string[] }
// These are stable identifiers that don't depend on any client-side shuffle order.
async function _onlineCoupChooseSocialist(keptChoice, shareId = null) {
    await _onlineCoupMutateState(async state => {
        const share = state.pendingSocialistShare;
        if (!share) return null;
        if (shareId && share.id !== shareId) return null;
        if (share.actorId !== _myId) return null;
        if (share.phase && share.phase !== 'actor') return null;
        const actor = state.players.find(p => p.id === share.actorId);
        if (!actor) return null;

        // Normalise: accept both the new structured format and the legacy index-array format
        // (legacy path kept only for safety; new UI always sends the structured object)
        let keptActorHandIndices, keptOpponentPlayerIds;
        if (Array.isArray(keptChoice)) {
            // Legacy fallback — treat every index < actorLive.length as actor card, rest as opponent
            const actorLiveCount = actor.hand.filter(c => !c.lost).length;
            keptActorHandIndices = keptChoice.filter(i => i < actorLiveCount);
            keptOpponentPlayerIds = []; // best-effort; legacy callers shouldn't reach here anymore
        } else {
            keptActorHandIndices  = keptChoice.keptActorHandIndices  || [];
            keptOpponentPlayerIds = keptChoice.keptOpponentPlayerIds || [];
        }

        // Step 1: Process all opponent choices (coins and cards)
        const collectedCards = []; // { fromId, handCard }
        for (const opp of (share.opponents || [])) {
            const choice = share.opponentChoices[opp.playerId];
            if (!choice || choice.take == null) continue;
            const oppPlayer = state.players.find(p => p.id === opp.playerId);
            if (!oppPlayer) continue;
            if (choice.take === 'coin') {
                if (oppPlayer.coins > 0) { oppPlayer.coins -= 1; actor.coins += 1; }
            } else {
                // card: take a specific handIdx card
                const hIdx = choice.handIdx;
                const handCard = hIdx != null ? oppPlayer.hand[hIdx] : oppPlayer.hand.find(c => !c.lost);
                if (handCard && !handCard.lost) {
                    handCard.lost = true;
                    collectedCards.push({ fromId: oppPlayer.id, handCard });
                }
            }
        }

        if (collectedCards.length === 0) {
            // No cards collected — only coins
            state.pendingSocialistShare = null;
            state.log = `${actor.name} جمع فلوس من اللاعبين بالمدير.`;
            _onlineCoupEvent(state, state.log, 'good');
            _onlineCoupNextTurn(state);
            return state;
        }

        // Step 2: Identify which of the actor's live cards to keep by their hand index.
        // Use only valid, deduplicated indices that point to actual live cards.
        const actorLive = actor.hand
            .map((c, idx) => ({ c, idx }))
            .filter(x => !x.c.lost);

        const validActorSet = new Set(
            keptActorHandIndices
                .filter(hi => hi >= 0 && hi < actor.hand.length && !actor.hand[hi]?.lost)
        );
        // Resolve which collected opponent cards the actor chose to keep (by player ID, deduplicated)
        const keptOpponentSet = new Set(keptOpponentPlayerIds);
        const keptOpponentCards  = collectedCards.filter(cc => keptOpponentSet.has(cc.fromId));
        const unkeptOpponentCards = collectedCards.filter(cc => !keptOpponentSet.has(cc.fromId));

        // Determine actor cards to keep (those whose hand index is in validActorSet)
        const keptActorCards   = actorLive.filter(x => validActorSet.has(x.idx));
        const unkeptActorCards = actorLive.filter(x => !validActorSet.has(x.idx));

        // Actor keeps exactly as many cards as they started with (capped at 2).
        // A player with 1 live card must leave with 1, not 2.
        const mustKeep = Math.min(actorLive.length, 2);
        let keptCards = [...keptActorCards, ...keptOpponentCards].slice(0, mustKeep);

        // Auto-fill if the player somehow didn't select enough
        if (keptCards.length < mustKeep) {
            const allPoolCards = [...actorLive, ...collectedCards.map(cc => ({ c: cc.handCard, idx: -1, fromId: cc.fromId }))];
            for (const pc of allPoolCards) {
                if (keptCards.length >= mustKeep) break;
                const alreadyKept = keptCards.includes(pc) ||
                    keptCards.some(k => k.c === pc.c);
                if (!alreadyKept) keptCards.push(pc);
            }
        }

        // Step 3: Give actor EXACTLY the kept cards (replace entire live portion of hand)
        // Remove all live actor cards first
        actor.hand = actor.hand.filter(c => c.lost); // keep only already-dead cards
        // Add back exactly the kept cards (actor's own or opponent's, both as fresh live slots)
        keptCards.forEach(pc => {
            actor.hand.push({ type: pc.c ? pc.c.type : pc.handCard.type, lost: false });
        });

        // Step 4: Redistribute unkept cards back to opponents' lost slots
        // allOpponentSlots = opponent handCard refs that were marked lost in Step 1
        const allOpponentSlots = collectedCards.map(c => c.handCard); // all grabbed opponent refs
        const unkeptTypes = [
            ...unkeptActorCards.map(x => x.c.type),
            ...unkeptOpponentCards.map(cc => cc.handCard.type)
        ];

        // Shuffle both for randomness
        unkeptTypes.sort(() => 0.5 - Math.random());
        allOpponentSlots.sort(() => 0.5 - Math.random());

        allOpponentSlots.forEach((slot, i) => {
            if (unkeptTypes[i] !== undefined) {
                slot.type = unkeptTypes[i];
                slot.lost = false;
            } else {
                // More opponent slots than unkept types — draw from deck
                const drawn = state.deck?.pop?.();
                if (drawn) { slot.type = drawn; slot.lost = false; }
                else slot.lost = true;
            }
        });
        // Any leftover unkept types return to deck
        for (let i = allOpponentSlots.length; i < unkeptTypes.length; i++) {
            state.deck?.unshift?.(unkeptTypes[i]);
        }

        state.pendingSocialistShare = null;
        state.log = `${actor.name} وزّع الكوارط بالمدير. اختار واحدين وبقى فيهم.`;
        _onlineCoupEvent(state, state.log, 'good');
        _onlineCoupNextTurn(state);
        return state;
    });
}

// ── AI handlers for expansion pending states ───────────────────

async function _onlineCoupAIChooseInspect(state) {
    const insp = state.pendingInspect;
    if (!insp) return;
    const inspectId = insp.id;
    await _onlineCoupMutateState(async fresh => {
        const i = fresh.pendingInspect;
        if (!i || i.id !== inspectId) return null;
        const actor  = fresh.players.find(p => p.id === i.actorId);
        const target = fresh.players.find(p => p.id === i.targetId);
        if (!actor || !target) return null;
        // AI: small chance to force swap
        if (Math.random() < 0.4) {
            const handCard = target.hand[i.targetHandIdx];
            if (handCard && !handCard.lost) {
                fresh.deck.unshift(handCard.type);
                fresh.deck.sort(() => 0.5 - Math.random());
                handCard.type = fresh.deck.pop() || handCard.type;
            }
            fresh.log = `${actor.name} خلّى ${target.name} يبدّل كارطتو.`;
        } else {
            fresh.log = `${actor.name} شاف كارطة ${target.name} وما عملش شي.`;
        }
        _onlineCoupEvent(fresh, fresh.log, 'notice');
        fresh.pendingInspect = null;
        _onlineCoupNextTurn(fresh);
        return fresh;
    });
}

async function _onlineCoupAIChooseJesterSwap(state, ai) {
    const jester = state.pendingJesterSwap;
    if (!jester || jester.actorId !== ai.id) return;
    const jesterId = jester.id;
    await _onlineCoupMutateState(async fresh => {
        const j = fresh.pendingJesterSwap;
        if (!j || j.id !== jesterId) return null;
        const actor  = fresh.players.find(p => p.id === j.actorId);
        const target = fresh.players.find(p => p.id === j.targetId);
        if (!actor || !target) return null;
        const keepTempIdx = Math.floor(Math.random() * j.temps.length);
        const actorLive = actor.hand.map((c, i) => ({c, i})).filter(x => !x.c.lost);
        if (!actorLive.length) return null;
        const replaceIdx = actorLive[Math.floor(Math.random() * actorLive.length)].i;
        const keptType  = j.temps[keepTempIdx]?.type;
        const otherTemp = j.temps[1 - keepTempIdx];
        if (!keptType || !otherTemp) return null;
        const actorCard = actor.hand[replaceIdx];
        if (!actorCard || actorCard.lost) return null;
        const oldType = actorCard.type;
        actorCard.type = keptType;
        const takenTemp = j.temps.find(t => t.src === 'target');
        if (otherTemp.src === 'target') {
            target.hand[takenTemp.targetHandIdx] = { type: otherTemp.type, lost: false };
            fresh.deck.unshift(oldType);
        } else {
            fresh.deck.unshift(otherTemp.type);
            target.hand[takenTemp.targetHandIdx] = { type: oldType, lost: false };
        }
        fresh.deck.sort(() => 0.5 - Math.random());
        fresh.pendingJesterSwap = null;
        fresh.log = `${actor.name} عمل فوضى مع ${target.name}. الكوارط اختلطت!`;
        _onlineCoupEvent(fresh, fresh.log, 'notice');
        _onlineCoupNextTurn(fresh);
        return fresh;
    });
}

async function _onlineCoupAIChooseSocialist(state, ai) {
    const share = state.pendingSocialistShare;
    if (!share || share.actorId !== ai.id) return;
    const shareId = share.id;

    // If still in opponent-choice phase, make AI opponents choose
    if (share.phase === 'opponents' || !share.phase) {
        await _onlineCoupMutateState(async fresh => {
            const s = fresh.pendingSocialistShare;
            if (!s || s.id !== shareId) return null;
            if (!s.opponentChoices) s.opponentChoices = {};
            let changed = false;
            for (const opp of (s.opponents || [])) {
                if (s.opponentChoices[opp.playerId] !== undefined) continue;
                const oppPlayer = fresh.players.find(p => p.id === opp.playerId);
                if (!oppPlayer || !oppPlayer.isAI) continue;
                // AI opponent: prefer giving a coin over a card
                if (opp.hasCoins && oppPlayer.coins > 0) {
                    s.opponentChoices[opp.playerId] = { take: 'coin', handIdx: null };
                } else if (opp.liveCards?.length) {
                    const pick = opp.liveCards[Math.floor(Math.random() * opp.liveCards.length)];
                    s.opponentChoices[opp.playerId] = { take: 'card', handIdx: pick.handIdx };
                } else {
                    s.opponentChoices[opp.playerId] = { take: null, handIdx: null };
                }
                changed = true;
            }
            const allChosen = s.opponents.every(o => s.opponentChoices[o.playerId] !== undefined);
            if (allChosen) { s.phase = 'actor'; fresh.log = `كل اللاعبين اختاروا. المدير يختار واحدين من الحوض.`; _onlineCoupEvent(fresh, fresh.log, 'notice'); }
            return changed ? fresh : null;
        });
        return;
    }

    // Phase 'actor' — AI picks 2 cards from pool and resolves
    await _onlineCoupMutateState(async fresh => {
        const s = fresh.pendingSocialistShare;
        if (!s || s.id !== shareId || s.phase !== 'actor') return null;
        const actor = fresh.players.find(p => p.id === s.actorId);
        if (!actor) return null;

        // Process opponent choices (coins and cards)
        const collectedCards = [];
        for (const opp of (s.opponents || [])) {
            const choice = (s.opponentChoices || {})[opp.playerId];
            if (!choice || choice.take == null) continue;
            const oppPlayer = fresh.players.find(p => p.id === opp.playerId);
            if (!oppPlayer) continue;
            if (choice.take === 'coin') {
                if (oppPlayer.coins > 0) { oppPlayer.coins -= 1; actor.coins += 1; }
            } else {
                const hIdx = choice.handIdx;
                const handCard = hIdx != null ? oppPlayer.hand[hIdx] : oppPlayer.hand.find(c => !c.lost);
                if (handCard && !handCard.lost) {
                    handCard.lost = true;
                    collectedCards.push({ fromId: oppPlayer.id, handCard });
                }
            }
        }

        if (collectedCards.length === 0) {
            fresh.pendingSocialistShare = null;
            fresh.log = `${actor.name} جمع فلوس من اللاعبين بالمدير.`;
            _onlineCoupEvent(fresh, fresh.log, 'good');
            _onlineCoupNextTurn(fresh);
            return fresh;
        }

        // Build pool: actor's live cards + collected cards
        const actorLive = actor.hand.filter(c => !c.lost);
        actorLive.forEach(c => { c.lost = true; });
        const pool = [
            ...actorLive.map(c => ({ type: c.type, isActorCard: true, handRef: c })),
            ...collectedCards.map(c => ({ type: c.handCard.type, isActorCard: false, handRef: c.handCard }))
        ];
        const mustKeep = Math.min(actorLive.length, 2);
        // AI: pick randomly
        const shuffled = pool.map((_, i) => i).sort(() => 0.5 - Math.random());
        const keptIndices = shuffled.slice(0, mustKeep);

        // Give actor the kept cards
        actor.hand = actor.hand.filter(c => !actorLive.includes(c));
        keptIndices.forEach(ki => { actor.hand.push({ type: pool[ki].type, lost: false }); });

        // Redistribute unkept cards
        const allOpponentSlots = collectedCards.map(c => c.handCard);
        const unkeptTypes = pool.filter((_, idx) => !keptIndices.includes(idx)).map(pc => pc.type);
        unkeptTypes.sort(() => 0.5 - Math.random());
        allOpponentSlots.sort(() => 0.5 - Math.random());
        allOpponentSlots.forEach((slot, i) => {
            if (unkeptTypes[i] !== undefined) { slot.type = unkeptTypes[i]; slot.lost = false; }
            else { const drawn = fresh.deck?.pop?.(); if (drawn) { slot.type = drawn; slot.lost = false; } else slot.lost = true; }
        });
        for (let i = allOpponentSlots.length; i < unkeptTypes.length; i++) fresh.deck?.unshift?.(unkeptTypes[i]);

        fresh.pendingSocialistShare = null;
        fresh.log = `${actor.name} وزّع الكوارط بالمدير. اختار واحدين وبقى فيهم.`;
        _onlineCoupEvent(fresh, fresh.log, 'good');
        _onlineCoupNextTurn(fresh);
        return fresh;
    });
}

function _onlineCoupCaught() {
    return ['الكذبة طلعت بريحة اللبلابي.','بوّعها بثقة وطيح في الحفرة.','قالها كبيرة، جاتو أكبر.'][Math.floor(Math.random()*3)];
}
function _onlineCoupWrong() {
    return ['عمل روحو حاكم وطلع غلط.','تكذب؟ لا يا خويا، إنت الي تخلص.','دخل في حيط بيديه.'][Math.floor(Math.random()*3)];
}

async function _onlineCoupAIStartPending(action, aiId, targetId, taxType = null) {
    await _onlineCoupMutateState(async state => {
        if (state.pending || state.pendingLoss || state.pendingExchange) return null;
        const actor = state.players[state.turnIndex || 0];
        const th = _getOnlineCoupThresholds(state);
        if (!actor || actor.id !== aiId || !_onlineCoupLiveCards(actor).length) return null;
        if ((actor.coins || 0) >= th.mustCoup && action !== 'coup') return null;
        if (action === 'assassinate' && actor.coins < th.assassinate) return null;
        if (action === 'coup' && actor.coins < th.coup) return null;
        if (['assassinate', 'coup', 'steal','invoice','bureaucratTax','jesterDisorder'].includes(action)) {
            const target = _onlineCoupAlive(state).find(p => p.id === targetId && p.id !== actor.id);
            if (!target) return null;
        }

        // Check for Customs Officer role-based taxes (AI pays like everyone else)
        const claim = _onlineCoupActionClaim(action, state);
        const taxes = state.taxAssignments || [];
        if (taxes.length > 0 && claim) {
            const { total, officers } = _onlineCoupComputeTotalTax(state, claim, action);
            if (total > 0) {
                if (actor.coins < total) return null; // AI can't afford tax, skip action
                actor.coins -= total;
                for (const { officer, amount } of officers) officer.coins += amount;
            }
        }

        const dyn = _onlineCoupDynamic(state);
        const claims = {
            tax: dyn.dukeRole, bureaucratTax: 'bureaucrat', speculatorGamble: 'speculator',
            assassinate: 'assassin', exchange: dyn.ambRole, inquireExchange: 'inquisitor',
            inquireInspect: 'inquisitor', jesterDisorder: 'jester', socialistShare: 'socialist',
            steal: dyn.captainRole, invoice: 'lawyer', taxAssignment: 'customsOfficer'
        };
        const blockRoles =
            action === 'foreignAid'    ? dyn.aidBlockRoles :
            action === 'assassinate'   ? ['contessa'] :
            action === 'invoice'       ? dyn.invoiceBlockRoles :
            action === 'taxAssignment' ? dyn.taxAssignmentBlockRoles :
            ['steal','inquireExchange','inquireInspect','socialistShare'].includes(action) ? dyn.stealBlockRoles :
            action === 'jesterDisorder' ? dyn.jesterBlockRoles :
            [];
        const blockable = blockRoles.length > 0;
        const finalClaim = claims[action] || null;
        if (!finalClaim && !blockable) return _onlineCoupApplyActionLocal(state, action, targetId);
        if (action === 'assassinate') {
            actor.coins -= th.assassinate;
            _onlineCoupPayBank(state, th.assassinate);
        }
        state.pending = { id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, stage: null, action, actorId: actor.id, targetId, claim: finalClaim, blockable, blockRoles, passes: [], taxType };
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
        const th = _getOnlineCoupThresholds(state);

        if (ai.coins >= th.mustCoup) {
            await _onlineCoupAIStartPending('coup', ai.id, randomOpponent.id);
            return;
        }

        const dyn = _onlineCoupDynamic(state);
        const possible = ['income', 'foreignAid'];
        // Dynamic duke-family action
        if (dyn.dukeRole === 'bureaucrat') possible.push('bureaucratTax');
        else if (dyn.dukeRole === 'speculator') possible.push('speculatorGamble');
        else possible.push('tax');
        // Dynamic captain-family action
        if (dyn.captainRole === 'lawyer') possible.push('invoice');
        else if (dyn.captainRole === 'customsOfficer') possible.push('taxAssignment');
        else possible.push('steal');
        // Dynamic ambassador-family action
        if (dyn.ambRole === 'inquisitor') possible.push('inquireExchange');
        else if (dyn.ambRole === 'jester') possible.push('jesterDisorder');
        else if (dyn.ambRole === 'socialist') possible.push('socialistShare');
        else possible.push('exchange');

        if (ai.coins >= th.assassinate) possible.push('assassinate');
        if (aliveOpponents.some(p => p.coins > 0) && dyn.captainRole === 'captain') possible.push('steal');
        if (ai.coins >= th.coup) possible.push('coup');

        const weights = { income: 10, foreignAid: 15, tax: 25, bureaucratTax: 20, speculatorGamble: 20, steal: 20, invoice: 20, taxAssignment: 15, assassinate: 15, exchange: 5, inquireExchange: 5, inquireInspect: 5, jesterDisorder: 15, socialistShare: 20, coup: 10 };
        const pool = [];
        possible.forEach(act => { for (let i = 0; i < (weights[act] || 10); i++) pool.push(act); });
        const action = pool[Math.floor(Math.random() * pool.length)];

        if (['coup', 'assassinate', 'steal', 'invoice', 'bureaucratTax', 'jesterDisorder'].includes(action)) {
            let targetId = randomOpponent.id;
            if (action === 'steal') {
                const hasMoney = aliveOpponents.filter(p => p.coins > 0);
                if (hasMoney.length) targetId = hasMoney[Math.floor(Math.random() * hasMoney.length)].id;
            }
            await _onlineCoupAIStartPending(action, ai.id, targetId);
        } else if (action === 'taxAssignment') {
            // AI picks a random role from the roles in play to tax
            const rolesInPlay = state.rolesInPlay || ['assassin', 'captain', 'contessa', 'duke', 'ambassador'];
            const taxedRole = rolesInPlay[Math.floor(Math.random() * rolesInPlay.length)];
            await _onlineCoupAIStartPending('taxAssignment', ai.id, null, taxedRole);
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
    if (!p || (p.passes || []).includes(ai.id)) return;

    const roll = Math.random();
    const isTarget = p.targetId === ai.id;
    const isDeflectTarget = p.deflectTargetId === ai.id;
    const isActionStage = !p.stage;

    if (isActionStage) {
        // AI chooses to deflect?
        if (p.action === 'assassinate' && isTarget && p.canDeflect !== false && (ai.coins || 0) >= CONTESSA_DEFLECT_COST && roll < 0.3) {
            const possibleDeflectTargets = _onlineCoupAlive(state).filter(pl => pl.id !== ai.id && pl.id !== p.actorId);
            if (possibleDeflectTargets.length > 0) {
                const target = possibleDeflectTargets[Math.floor(Math.random() * possibleDeflectTargets.length)];
                await _onlineCoupDeflect(ai.id, target.id, p.id);
                return;
            }
        }

        // Target can block with an appropriate role
        if (p.blockRoles?.length && (isTarget || !p.targetId || p.action === 'reactiveTax') && roll < 0.3) {
            await _onlineCoupBlock(ai.id, p.blockRoles[0], p.id);
        // Any player can block foreignAid with the dynamic duke-family role
        } else if (p.action === 'foreignAid' && !isTarget && roll < 0.15) {
            const dyn2 = _onlineCoupDynamic(state);
            await _onlineCoupBlock(ai.id, dyn2.aidBlockRoles[0] || 'duke', p.id);
        // Challenge the claim (not on income/foreignAid/coup which have no claim)
        } else if (roll < 0.1 && p.claim && p.action !== 'income' && p.action !== 'foreignAid' && p.action !== 'coup') {
            await _onlineCoupChallenge(ai.id, p.id);
        } else {
            await _onlineCoupPass(ai.id, p.id);
        }
    } else if (p.stage === 'deflect') {
        // Challenge the deflection?
        const challengeChance = isDeflectTarget ? 0.4 : 0.1;
        if (roll < challengeChance) {
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


async function _onlineCoupAIEstateClaim(state, ai, estate) {
    const estateId = estate.id;
    // AI randomly decides whether to claim (50% chance)
    const shouldClaim = Math.random() > 0.5;
    if (shouldClaim) {
        await _onlineCoupMutateState(async state => {
            const currentEstate = state.pendingEstateClaim;
            if (!currentEstate || currentEstate.id !== estateId) return null;
            const eliminated = state.players.find(p => p.id === currentEstate.eliminatedId);
            const claimant = state.players.find(p => p.id === ai.id);
            if (!eliminated || !claimant) return null;
            state.pendingEstateClaim = null;
            state.pending = {
                id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                type:'estateClaim',
                claimantId: ai.id,
                eliminatedId: currentEstate.eliminatedId,
                coinsToClaim: currentEstate.coinsToClaim,
                action:'estateClaim',
                passes:[]
            };
            state.log = `${claimant.name} يطالب بميراث ${eliminated.name} (${currentEstate.coinsToClaim} فلوس). الكبران يخسر كارطة.`;
            _onlineCoupEvent(state, state.log, 'notice');
            return state;
        });
    } else {
        await _onlineCoupSkipEstateClaim(estateId);
    }
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
window._onlineCoupChooseInspect      = _onlineCoupChooseInspect;
window._onlineCoupChooseJesterSwap   = _onlineCoupChooseJesterSwap;
window._onlineCoupChooseSocialist    = _onlineCoupChooseSocialist;
window._onlineCoupSocialistOpponentChoose = _onlineCoupSocialistOpponentChoose;
window._onlineCoupStartPending       = _onlineCoupStartPending;
window._onlineCoupTimeout            = _onlineCoupTimeout;
window._onlineCoupPendingTimeout     = _onlineCoupPendingTimeout;
window._startOnlineCoupTimer         = _startOnlineCoupTimer;
window._onlineCoupDeck               = _onlineCoupDeck;
window._onlineCoupReactiveTaxRespond = _onlineCoupReactiveTaxRespond;
window._onlineCoupDeflect             = _onlineCoupDeflect;
window._onlineCoupDeflectPickTarget   = _onlineCoupDeflectPickTarget;
window.COUP_DEFAULT_ACTION_MINUTES   = COUP_DEFAULT_ACTION_MINUTES;
window._getRandomTunisianName        = _getRandomTunisianName;
