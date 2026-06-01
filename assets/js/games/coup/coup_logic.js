'use strict';

// ============================================================
// WARNING: THE OFFLINE COUP IS DEPRECATED. IF YOU ARE MAKING CODE EDITS TO THIS FILE YOU HAVE TO CHECK coup_online.js as well. It is no an option.
// COUP (كول وبوّع) — Game logic, card data, and rendering
//
// This file is the single source of truth for:
//   - coupCards data
//   - coupActionHelp data  (was duplicated in shared.js + online.js)
//   - All offline Coup state machine functions
//   - All Coup rendering functions
//   - The guide system
//
// online.js imports the state machine via window.CoupGame.*
// and drives it with server state instead of local state.
// ============================================================

// ── Constants ────────────────────────────────────────────────
const COUP_DEFAULT_ACTION_MINUTES = 1;
const COUP_RESPONSE_SECONDS       = 45;

// ── Card definitions ─────────────────────────────────────────
// Single source of truth — replaces the definitions in both
// shared.js and online.js (_coupCards).

// Resolve asset base path relative to the current page location so that
// coup_logic.js works whether the page is served from the project root
// (e.g. /games/coup.html → ../assets/coup/) or from inside the games/
// folder directly (e.g. /coup.html → assets/coup/).
const _coupAssetBase = (() => {
    const path = window.location.pathname;          // e.g. /games/coup.html or /coup.html
    const inGamesFolder = /\/games\/[^/]*$/.test(path);
    return inGamesFolder ? '../assets/coup/' : 'assets/coup/';
})();

// _coupImgBase: sibling of coup/ inside the same assets tree
const _coupImgBase = _coupAssetBase.replace(/coup\/$/, '') + 'images/';

const coupCards = {
    duke: {
        name: 'الشلغمي', icon: '👑',
        img: _coupAssetBase + 'duke.png', img512: _coupAssetBase + 'duke512.png',
        attack:  'هجوم: ياخو 3 فلوس من البنك.',
        defense: 'دفاع: يسكّر اعانة +2 متاع أي لاعب.',
    },
    assassin: {
        name: 'حفار القبور', icon: '🗡️',
        img: _coupAssetBase + 'assassin.png', img512: _coupAssetBase + 'assassin512.png',
        attack:  'هجوم: يدفع 3 فلوس ويخلي لاعب يختار كارتة يخسرها.',
        defense: 'دفاع: ما عندوش دفاع، أما claim متاعو ينجم يتكذّب.',
    },
    contessa: {
        name: 'البية', icon: '💃',
        img: _coupAssetBase + 'contessa.png', img512: _coupAssetBase + 'contessa512.png',
        attack:  'هجوم: ما عندهاش هجوم.',
        defense: 'دفاع: تسكّر الاغتيال متاع حفار القبور.',
    },
    ambassador: {
        name: 'السمسار', icon: '🤝',
        img: _coupAssetBase + 'ambassador.png', img512: _coupAssetBase + 'ambassador512.png',
        attack:  'هجوم: يبدّل كوارطو الحيّة مع الدكّة، أو يعمل روحو بدّل.',
        defense: 'دفاع: يسكّر سرقة الرايس.',
    },
    captain: {
        name: 'الرايس', icon: '⚓',
        img: _coupAssetBase + 'captain.png', img512: _coupAssetBase + 'captain512.png',
        attack:  'هجوم: يسرق حتى زوز فلوس من لاعب آخر.',
        defense: 'دفاع: يسكّر سرقة الرايس.',
    },
};

// ── Action help text ─────────────────────────────────────────
// Single source of truth — was duplicated in shared.js AND online.js.
const coupActionHelp = {
    income:      { title: 'شهرية +1',           text: 'تاخو 1 فلوس من البنك. ما تتسكرش وما حد ينجم يقولك تكذب خاطرها أكشن مفتوحة.' },
    foreignAid:  { title: 'اعانة +2',            text: 'تاخو 2 فلوس من البنك. أي لاعب ينجم يقول عندو الشلغمي ويسكّرها. بعد البلوك، أي لاعب ينجم يتهمه بالتبلعيط.' },
    tax:         { title: 'الشلغمي +3',          text: 'تقول عندي الشلغمي وتاخو 3 فلوس من البنك. أي لاعب ينجم يقولك تكذب.' },
    steal:       { title: 'الرايس: اسرق',        text: 'تقول عندي الرايس وتسرق حتى زوز فلوس من لاعب. الهدف ينجم يسكّر بالرايس أو السمسار، وأي لاعب ينجم يتهم أي claim بالتبلعيط.' },
    assassinate: { title: 'اغتيال -3',           text: 'تدفع 3 فلوس وتقول عندي حفار القبور باش تطيّح كارتة من لاعب. الهدف ينجم يسكّر بالبية، وأي لاعب ينجم يقول تكذب.' },
    exchange:    { title: 'السمسار: بدّل',       text: 'تقول عندي السمسار وتبدّل كوارطك الحيين مع الدكّة. أي لاعب ينجم يقولك تكذب.' },
    coup:        { title: 'Coup -7',             text: 'تدفع 7 فلوس وتطيّح كارتة من لاعب. ما تتسكرش وما فيهاش تكذيب.' },
};

// ── Offline game state ────────────────────────────────────────
let coupState              = null;
let coupFocusedPlayerId    = null;
let coupTimerInterval      = null;
let coupResponseInterval   = null;
let coupOtherDecksCollapsed = false;
let coupMyCardsHidden       = false;

// ─────────────────────────────────────────────────────────────
// Pure utilities (no DOM, no state mutation)
// ─────────────────────────────────────────────────────────────

function _escHtml(v = '') {
    return String(v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

function _fmtSeconds(totalSeconds) {
    const safe = Math.max(0, parseInt(totalSeconds, 10) || 0);
    return `${Math.floor(safe / 60).toString().padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}

function _now() {
    return (window.onlineMode && typeof window._syncedNow === 'function')
        ? window._syncedNow()
        : Date.now();
}

function _coupAlive(state = coupState) {
    return state.players.filter(p => p.hand.some(c => !c.lost));
}

function _coupBuildDeck() {
    const keys = ['duke', 'assassin', 'contessa', 'ambassador', 'captain'];
    return keys.flatMap(k => Array(3).fill(k)).sort(() => 0.5 - Math.random());
}

function _coupNextTurn(state = coupState) {
    const alive = _coupAlive(state);
    if (alive.length <= 1) return;
    let idx = state.turnIndex;
    for (let i = 0; i < state.players.length; i++) {
        idx = (idx + 1) % state.players.length;
        if (state.players[idx].hand.some(c => !c.lost)) {
            state.turnIndex = idx;
            _coupSetTurnDeadline(state);
            return;
        }
    }
}

function _coupPublicCard(player) {
    return player.hand.find(c => !c.lost) || player.hand[0];
}

function _coupTakeFromBank(state, amount) {
    if (!state || !Number.isFinite(state.bankCoins)) return;
    state.bankCoins = Math.max(0, state.bankCoins - Math.max(0, amount || 0));
}

function _coupPayBank(state, amount) {
    if (!state || !Number.isFinite(state.bankCoins)) return;
    state.bankCoins += Math.max(0, amount || 0);
}

function _coupActionMinutes(state = coupState) {
    const raw = state?.actionMinutes || GameState.getTimerConfig() || COUP_DEFAULT_ACTION_MINUTES;
    return Math.max(1, Math.min(10, parseInt(raw, 10) || COUP_DEFAULT_ACTION_MINUTES));
}

function _coupSetTurnDeadline(state = coupState) {
    if (!state) return;
    state.turnEndsAt = _now() + (_coupActionMinutes(state) * 60000);
}

function _coupSetResponseDeadline(pending) {
    pending.expiresAt = _now() + COUP_RESPONSE_SECONDS * 1000;
}

function _coupBlockRoleLabel(role) {
    const meta = coupCards[role] || coupCards.duke;
    return `${meta.icon} ${meta.name}`;
}

function _coupBlockOptions(pending) {
    return (pending?.blockRoles || []).map(role => ({ role, label: _coupBlockRoleLabel(role) }));
}

function _coupPendingClaimantId(pending) {
    return pending?.stage === 'block' ? pending.blockerId : pending?.actorId;
}

function _coupPendingResponders(state = coupState, pending = state?.pending) {
    const claimantId = _coupPendingClaimantId(pending);
    return _coupAlive(state).filter(p => p.id !== claimantId);
}

function _coupPassCount(state = coupState, pending = state?.pending) {
    const passes = new Set(pending?.passes || []);
    return _coupPendingResponders(state, pending).filter(p => passes.has(p.id)).length;
}

function _coupAllPassed(state = coupState, pending = state?.pending) {
    const responders = _coupPendingResponders(state, pending);
    return responders.length > 0 && _coupPassCount(state, pending) >= responders.length;
}

function _coupProveAndReplace(player, role, state = coupState) {
    const idx = player?.hand?.findIndex(c => !c.lost && c.type === role);
    if (idx < 0) return;
    state.deck.unshift(role);
    state.deck.sort(() => 0.5 - Math.random());
    player.hand[idx] = { type: state.deck.pop() || role, lost: false };
}

// ── Flavor text ───────────────────────────────────────────────
function funCaughtBluff()  { return ['يا ساتر عالبهامة!','الكذبة طلعت بريحة الهريسة.','قالها بثقة أما الكارتة خانتو.','تقصّت عليه كي ورقة كاشفة.'][Math.floor(Math.random()*4)]; }
function funWrongAccuser() { return ['اكلها في عوضو.','عمل روحو كونان وطلع غلط.','قال تكذب، طلعت هو الي يحلم.','دخل روحو في حيط.'][Math.floor(Math.random()*4)]; }

// ── Action name map ───────────────────────────────────────────
function coupActionName(action) {
    return { income:'شهرية', foreignAid:'اعانة', tax:'ضريبة الشلغمي', assassinate:'اغتيال', exchange:'تبديل السمسار', steal:'سرقة الرايس', coup:'Coup' }[action] || action;
}

// ─────────────────────────────────────────────────────────────
// HTML builders (pure functions — no side effects)
// ─────────────────────────────────────────────────────────────

function _coupCardIconHtml(card, cls = 'coup-card-avatar') {
    if (!card) return '';
    if (card.img) return `<img class="${cls}" src="${_escHtml(card.img)}" alt="${_escHtml(card.name || '')}" loading="lazy">`;
    return `<span class="${cls}">${card.icon || ''}</span>`;
}
function _coupCardLargeHtml(card, cls = 'coup-card-portrait') {
    if (!card) return '';
    const src = card.img512 || card.img;
    if (src) return `<img class="${cls}" src="${_escHtml(src)}" alt="${_escHtml(card.name || '')}" loading="lazy">`;
    return `<span class="${cls}">${card.icon || ''}</span>`;
}
function _coupCardLabelHtml(card, cls = 'coup-card-avatar') {
    return `${_coupCardIconHtml(card, cls)}<span>${_escHtml(card?.name || '')}</span>`;
}
function _coupCardDescHtml(card) {
    const attack  = card.attack || card.desc || '';
    const defense = card.defense || '';
    return `<span class="coup-card-desc-line">${_escHtml(attack)}</span>${defense ? `<span class="coup-card-desc-line">${_escHtml(defense)}</span>` : ''}`;
}

function _coupResourceHtml(state = coupState) {
    const bank      = Number.isFinite(state?.bankCoins) ? state.bankCoins : '∞';
    const deckCount = state?.deck?.length || 0;
    const maxDeck   = 15;
    const deckClass = deckCount <= 3 ? 'deck-critical' : deckCount <= 7 ? 'deck-low' : '';
    const coinDots  = Math.max(0, Math.min(5, Math.ceil((typeof bank === 'number' ? bank : 50) / 12)));
    const coinBar   = typeof bank === 'number'
        ? `<span class="coup-coin-bar">${Array(5).fill(0).map((_,i) => `<span class="${i < coinDots ? 'coin-dot filled' : 'coin-dot'}"></span>`).join('')}</span>`
        : '';
    return `<div class="coup-bank-display"><span class="coup-bank-icon">🪙</span><strong class="coup-bank-val">${bank}</strong>${coinBar}</div><div class="coup-deck-display ${deckClass}"><div class="coup-deck-stack-vis"><span class="cds-back2"></span><span class="cds-back1"></span><span class="cds-front">🂠</span></div><strong class="coup-deck-val">${deckCount}</strong><span class="coup-deck-label">/${maxDeck}</span></div>`;
}

function _coupStatusHtml(state = coupState) {
    const alive   = _coupAlive(state);
    const current = state.players[state.turnIndex];
    if (alive.length <= 1) return `<span class="coup-status-line">🏆 <bdi>${_escHtml(alive[0]?.name || '')}</bdi> ربح الطرح!</span>`;
    if (state.pending) return `<span class="coup-status-line">${_escHtml(state.log || '')}</span>`;
    return `<span class="coup-status-line">الدور على <bdi>${_escHtml(current?.name || '?')}.</bdi></span>${state.log ? `<span class="coup-status-line">${_escHtml(state.log)}</span>` : ''}`;
}

function _coupTimerHtml(left) {
    return `<span>وقت الدور</span><strong>${_fmtSeconds(left)}</strong>`;
}

function _coupPendingTimerHtml(p) {
    const left = Math.max(0, Math.ceil((p.expiresAt - _now()) / 1000));
    return `<div class="coup-decision-timer">وقت القرار <strong class="coup-pending-countdown" data-deadline="${p.expiresAt}">${left}s</strong></div>`;
}

// ─────────────────────────────────────────────────────────────
// Modal system
// ─────────────────────────────────────────────────────────────

function _wireCoupModalCountdown(root = document) {
    const nodes = root.querySelectorAll?.('.coup-pending-countdown') || [];
    nodes.forEach(node => {
        const tick = () => {
            const left = Math.max(0, Math.ceil((parseInt(node.dataset.deadline, 10) - _now()) / 1000));
            node.textContent = `${left}s`;
            node.classList.toggle('urgent', left <= 10);
            if (left <= 0 && node._tickInterval) { clearInterval(node._tickInterval); delete node._tickInterval; }
        };
        tick();
        if (node._tickInterval) clearInterval(node._tickInterval);
        node._tickInterval = setInterval(tick, 500);
    });
}

function _showCoupModal(title, bodyHtml, setup) {
    document.querySelector('.coup-modal-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'coup-modal-overlay';
    overlay.innerHTML = `<div class="coup-modal-card" role="dialog" aria-modal="true"><button class="coup-modal-close" type="button" aria-label="close">×</button><div class="coup-modal-spark">✦</div><h3>${_escHtml(title)}</h3><div class="coup-modal-body">${bodyHtml}</div></div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    overlay.querySelector('.coup-modal-close')?.addEventListener('click', () => _closeCoupModal());
    overlay.addEventListener('click', e => { if (e.target === overlay) _closeCoupModal(); });
    _sfx.modalOpen();
    if (typeof setup === 'function') setup(overlay);
    _wireCoupModalCountdown(overlay);
    return overlay;
}

function _closeCoupModal() {
    const overlay = document.querySelector('.coup-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    _sfx.modalClose();
    setTimeout(() => overlay.remove(), 220);
    document.querySelectorAll('.coup-action-btn').forEach(btn => {
        if (btn.getAttribute('aria-disabled') !== 'true') btn.disabled = false;
    });
}

function _showCoupCardInfo(type, cards = coupCards) {
    const meta = cards[type] || cards.duke;
    const cardType = type || Object.keys(coupCards).find(k => coupCards[k] === meta) || 'duke';
    const fullCardSrc = _coupImgBase + cardType + '_full_card.webp';

    // Show full-card flip overlay for 1 second, then open the info modal
    const flipEl = document.createElement('div');
    flipEl.className = 'coup-card-info-flip-overlay';
    flipEl.innerHTML = `
        <div class="coup-card-info-flip-scene">
            <div class="coup-card-info-flip-inner">
                <div class="coup-card-info-flip-front">
                    <img src="${_escHtml(fullCardSrc)}" alt="${_escHtml(meta?.name || '')}">
                </div>
                <div class="coup-card-info-flip-back">
                    ${_coupCardLargeHtml(meta)}
                    <p class="coup-card-desc">${_coupCardDescHtml(meta)}</p>
                </div>
            </div>
        </div>`;
    document.body.appendChild(flipEl);
    // After 1s the CSS flip triggers; remove overlay at ~2.1s and open the real modal
    setTimeout(() => {
        flipEl.remove();
        _showCoupModal(meta.name, `<div class="coup-modal-card-info">${_coupCardLargeHtml(meta)}<p class="coup-card-desc">${_coupCardDescHtml(meta)}</p></div>`);
    }, 2000);
}

function _showCoupEvent(text, kind = 'notice') {
    if (!text) return;
    document.querySelector('.coup-event-toast')?.remove();
    const el = document.createElement('div');
    el.className = `coup-event-toast ${kind}`;
    el.innerHTML = `<div class="coup-event-icon">${kind === 'bad' ? '💥' : kind === 'good' ? '✨' : '🎭'}</div><div>${_escHtml(text)}</div>`;
    document.body.appendChild(el);
    _sfx.reaction(kind === 'bad' ? 'caught' : 'fire');
    setTimeout(() => el.remove(), 2600);
}

function _showCoupLossAnimation(playerName, cardMeta, out = false) {
    document.querySelector('.coup-loss-overlay')?.remove();
    const cardType = Object.keys(coupCards).find(k => coupCards[k] === cardMeta) || 'duke';
    const fullCardSrc = _coupImgBase + cardType + '_full_card.webp';
    const el = document.createElement('div');
    el.className = 'coup-loss-overlay';
    el.innerHTML = `
        <div class="coup-loss-card">
            <div class="coup-loss-card-face">
                <img class="coup-loss-card-img" src="${_escHtml(fullCardSrc)}" alt="${_escHtml(cardMeta?.name || '')}">
                <div class="coup-loss-overlay-red"></div>
                <div class="coup-loss-slash-1"></div>
                <div class="coup-loss-slash-2"></div>
            </div>
        </div>
        <div class="coup-loss-text">${_escHtml(playerName || '')} خسر كارتة${out ? '<br><strong>خرج من الطرح! 💀</strong>' : ''}</div>`;
    document.body.appendChild(el);
    _sfx.lose();
    setTimeout(() => el.remove(), 3000);
}

function _showCoupNotLyingAnimation(playerName, cardType) {
    document.querySelector('.coup-not-lying-overlay')?.remove();
    const ct = cardType || 'duke';
    const fullCardSrc = _coupImgBase + ct + '_full_card.webp';
    const el = document.createElement('div');
    el.className = 'coup-not-lying-overlay';
    el.innerHTML = `
        <div class="coup-not-lying-card">
            <img src="${_escHtml(fullCardSrc)}" alt="">
            <div class="coup-not-lying-card-glow"></div>
        </div>
        <div class="coup-not-lying-banner">
            <span class="coup-nly-player">✅ ${_escHtml(playerName || '')}</span>
            <span class="coup-nly-label">ما كانش يبوّع! 🎉</span>
        </div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// Exposed globally so online.js can call it
window.triggerNotLyingAnimation = function(playerName, cardType) {
    _showCoupNotLyingAnimation(playerName, cardType);
};
    const help = document.getElementById('coup-role-help');
    if (!help) return;
    help.innerHTML = Object.values(cards).map(c =>
        `<div class="coup-help-item"><div class="coup-help-head">${_coupCardIconHtml(c)}<strong>${_escHtml(c.name)}</strong></div>${_coupCardDescHtml(c)}</div>`
    ).join('');
    const toggle  = document.getElementById('coup-help-toggle');
    const chevron = document.getElementById('coup-help-chevron');
    if (toggle && !toggle.dataset.bound) {
        toggle.dataset.bound = '1';
        toggle.addEventListener('click', () => {
            const open = help.classList.toggle('open');
            if (chevron) chevron.textContent = open ? '▲' : '▼';
            _sfx.tap();
        });
    }
}

// ─────────────────────────────────────────────────────────────
// Main screen render
// ─────────────────────────────────────────────────────────────

function renderCoupScreen(state = coupState, myId = null) {
    if (!state) return;
    document.getElementById('coup-deck-pill').innerHTML  = _coupResourceHtml(state);
    document.getElementById('coup-status').innerHTML     = _coupStatusHtml(state);
    const myBoard     = document.getElementById('coup-my-board');
    const othersBoard = document.getElementById('coup-others-board');
    if (myBoard)     myBoard.innerHTML = '';
    if (othersBoard) othersBoard.innerHTML = '';

    const myIndex = myId
        ? state.players.findIndex(p => p.id === myId)
        : state.turnIndex;

    const orderedPlayers = [
        ...state.players.map((p, idx) => ({ p, idx })).filter(x => x.idx === myIndex),
        ...state.players.map((p, idx) => ({ p, idx })).filter(x => x.idx !== myIndex),
    ];

    const renderPlayerCard = (p, idx) => {
        const isMe    = myId ? p.id === myId : idx === state.turnIndex;
        const hidden  = isMe && coupMyCardsHidden;
        const visible = isMe && !hidden;
        const focused = coupFocusedPlayerId === p.id || (!coupFocusedPlayerId && isMe);
        const dimmed  = !!coupFocusedPlayerId && coupFocusedPlayerId !== p.id;
        const out     = !p.hand.some(c => !c.lost);
        const div     = document.createElement('div');
        div.className = 'coup-player-card'
            + (idx === state.turnIndex ? ' is-turn' : '')
            + (isMe    ? ' is-me'      : '')
            + (focused ? ' is-focused' : '')
            + (dimmed  ? ' is-dimmed'  : '')
            + (out     ? ' is-out'     : '');
        div.dataset.playerId = p.id;
        const toggleBtn = isMe && !out
            ? `<button class="coup-hide-cards-btn" type="button" data-hide-toggle="1">${hidden ? '👁 ورّي كوارطك' : '🙈 خبي كوارطك'}</button>`
            : '';
        div.innerHTML = `<div class="coup-player-head"><span>${_escHtml(p.name)}${isMe && myId ? ' <span class="you-tag">أنا</span>' : ''}</span><span class="coup-coins">🪙 ${p.coins}</span></div>
            <div class="coup-influence-row">${p.hand.map(c => {
                const meta  = coupCards[c.type] || coupCards.duke;
                const label = (visible || c.lost) ? _coupCardLabelHtml(meta) : '<span>🂠 مخبية</span>';
                const info  = (visible || c.lost) ? `<button class="coup-card-info" type="button" data-card-type="${c.type}" aria-label="info">ℹ️</button>` : '';
                const bgStyle = (visible || c.lost) ? ` style="--card-img:url('${_coupImgBase}${c.type}_horizontal.webp')" data-has-bg="1"` : '';
                return `<div class="coup-influence ${c.lost ? 'lost' : ''}" data-card-type="${c.type}"${bgStyle}><span>${label}</span>${info}</div>`;
            }).join('')}</div>${toggleBtn}`;
        div.addEventListener('click', e => {
            if (e.target.closest('.coup-card-info')) return;
            if (e.target.closest('[data-hide-toggle]')) {
                coupMyCardsHidden = !coupMyCardsHidden;
                renderCoupScreen(state, myId);
                return;
            }
            coupFocusedPlayerId = coupFocusedPlayerId === p.id ? null : p.id;
            renderCoupScreen(state, myId);
        });
        div.querySelectorAll('.coup-card-info').forEach(btn =>
            btn.addEventListener('click', e => { e.stopPropagation(); _showCoupCardInfo(btn.dataset.cardType); })
        );
        return div;
    };

    if (state.pending && myBoard) myBoard.appendChild(_renderCoupPendingBanner(state));
    const mine = orderedPlayers[0];
    if (mine && myBoard) {
        const label = document.createElement('div');
        label.className = 'coup-my-deck-label';
        label.innerHTML = '<span></span><strong>كوارطي</strong><span></span>';
        myBoard.appendChild(label);
        myBoard.appendChild(renderPlayerCard(mine.p, mine.idx));
        const warningEl = document.getElementById('coup-10-coin-warning');
        if (warningEl) warningEl.classList.toggle('hidden', mine.p.coins < 10);
    }
    if (othersBoard) {
        const othersHeader = document.createElement('button');
        othersHeader.type = 'button';
        othersHeader.className = 'coup-other-divider';
        othersHeader.innerHTML = `<span></span><strong>كوارط اللاعبين الأخرين</strong><span></span><em>${coupOtherDecksCollapsed ? '▼' : '▲'}</em>`;
        othersHeader.addEventListener('click', () => {
            coupOtherDecksCollapsed = !coupOtherDecksCollapsed;
            renderCoupScreen(state, myId);
        });
        othersBoard.appendChild(othersHeader);
        const othersWrap = document.createElement('div');
        othersWrap.className = 'coup-other-decks' + (coupOtherDecksCollapsed ? ' collapsed' : '');
        orderedPlayers.slice(1).forEach(({ p, idx }) => { othersWrap.appendChild(renderPlayerCard(p, idx)); });
        othersBoard.appendChild(othersWrap);
    }
    _renderCoupRoleHelp(coupCards);
    startCoupTurnTimer(state, myId);
    renderCoupActions(state, myId);
}

function renderCoupActions(state = coupState, myId = null) {
    const panel = document.getElementById('coup-action-panel');
    panel.innerHTML = '';
    const alive = _coupAlive(state);
    if (alive.length <= 1) {
        const btn = document.createElement('button');
        btn.className = 'primary-btn';
        btn.innerText = '🔄 عاود انده';
        btn.onclick = () => showScreen('setup-screen');
        panel.appendChild(btn);
        return;
    }
    const me     = myId ? state.players.find(p => p.id === myId) : state.players[state.turnIndex];
    const isTurn = me && me.id === state.players[state.turnIndex].id;
    if (state.pending) { panel.innerHTML = `<div class="coup-panel-card live">${_escHtml(state.log)}</div>`; return; }
    const current = state.players[state.turnIndex];
    if (!isTurn) { panel.innerHTML = `<div class="coup-panel-card">استنى دورك. الدور توّة على ${_escHtml(current?.name || '')}.</div>`; }
    const mustCoup = isTurn && (me?.coins || 0) >= 10;
    const _actionBgMap = { income:'plusone', foreignAid:'plustwo', tax:'tax', steal:'steal', assassinate:'assassinate', exchange:'exchange', coup:'coup' };
    const mk = (txt, action, cls = '', hint = '') => {
        const actionLocked = !isTurn || (mustCoup && action !== 'coup');
        const disabled     = actionLocked ? 'is-action-disabled' : '';
        const finalHint    = mustCoup && action !== 'coup' ? 'عندك 10+ فلوس، لازم Coup' : hint;
        const bgFile       = _actionBgMap[action];
        const bgStyle      = bgFile ? ` style="--action-img:url('${_coupImgBase}${bgFile}.webp')" data-has-bg="1"` : '';
        return `<button class="coup-action-btn ${cls} ${disabled}" data-action="${action}"${bgStyle} aria-disabled="${actionLocked ? 'true' : 'false'}"><strong>${txt}<span class="coup-action-info" data-action-info="${action}">ℹ️</span></strong><small>${finalHint}</small></button>`;
    };
    panel.innerHTML += `<div class="coup-action-grid ${isTurn ? '' : 'is-disabled'}">
        ${mk('🪙 شهرية +1','income','','مضمون وما يتكذبش')}
        ${mk('🤲 اعانة +2','foreignAid','','ينجم الشلغمي يسكّرها')}
        ${mk(`${_coupCardLabelHtml(coupCards.duke)} +3`,'tax','primary-action','قول عندي الشلغمي')}
        ${mk(`${_coupCardLabelHtml(coupCards.captain)}: اسرق`,'steal','primary-action','اسرق زوز فلوس')}
        ${mk(`${_coupCardLabelHtml(coupCards.assassin)} -3`,'assassinate','danger-action','يلزم حفار القبور')}
        ${mk(`${_coupCardLabelHtml(coupCards.ambassador)}: بدّل`,'exchange','','بدّل كوارطك مع الدكّة')}
        ${mk('💥 Coup -7','coup','danger-action','ضربة ما تتسكرش')}
    </div>`;
    panel.querySelectorAll('.coup-action-info').forEach(info => info.addEventListener('click', e => {
        e.stopPropagation();
        const meta = coupActionHelp[info.dataset.actionInfo];
        if (meta) _showCoupModal(meta.title, `<p class="coup-card-desc">${_escHtml(meta.text)}</p>`);
    }));
    panel.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', e => {
        if (e.target.closest('.coup-action-info')) return;
        if (btn.getAttribute('aria-disabled') === 'true') return;
        coupChooseAction(btn.dataset.action);
    }));
}

function _renderCoupPendingBanner(state = coupState) {
    const p            = state.pending;
    const claimantId   = _coupPendingClaimantId(p);
    const isBlockStage = p.stage === 'block';
    const actor        = state.players.find(x => x.id === p.actorId);
    const blocker      = state.players.find(x => x.id === p.blockerId);
    const target       = state.players.find(x => x.id === p.targetId);
    const wrap         = document.createElement('div');
    wrap.className = 'coup-pending-banner';
    const responders      = _coupPendingResponders(state, p);
    const challengeButtons = (p.claim || isBlockStage)
        ? responders.map(player => `<button class="coup-target-btn danger-action" data-banner-challenge="${player.id}">${_escHtml(player.name)}: تكذب!</button>`).join('') : '';
    const passButtons = responders.filter(player => !(p.passes || []).includes(player.id))
        .map(player => `<button class="coup-target-btn quiet-action" data-banner-pass="${player.id}">${_escHtml(player.name)}: ما عندي حتى اعتراض</button>`).join('');
    const blockButtons = !isBlockStage && p.blockable
        ? (p.action === 'foreignAid' ? responders : responders.filter(x => x.id === p.targetId))
            .map(player => _coupBlockOptions(p).map(opt =>
                `<button class="coup-target-btn" data-banner-block="${player.id}" data-block-role="${opt.role}">${_escHtml(player.name)}: نسكّرها ب${opt.label}</button>`
            ).join('')).join('') : '';
    wrap.innerHTML = `<div class="coup-pending-title">قرار مباشر</div><strong>${_escHtml(state.log || '')}</strong><p>${isBlockStage ? `${_escHtml(blocker?.name || '')} قال يسكّر. أي لاعب ينجم يقول تكذب.` : `${target ? `${_escHtml(target.name)} مستهدف. ` : ''}${p.claim ? 'أي لاعب ينجم يقول تكذب أو ما عنديش اعتراض.' : 'أي لاعب ينجم يسكّرها أو يقول ما عندو اعتراض.'}`}</p>${_coupPendingTimerHtml(p)}<div class="coup-pass-progress">${_coupPassCount(state, p)}/${responders.length} قالو ما عندهم حتى اعتراض</div><div class="coup-pending-actions">${challengeButtons}${blockButtons}${passButtons}</div>`;
    wrap.querySelectorAll('[data-banner-challenge]').forEach(btn => btn.addEventListener('click', () => {
        isBlockStage ? coupChallengeBlock(btn.dataset.bannerChallenge) : coupChallenge(btn.dataset.bannerChallenge);
    }));
    wrap.querySelectorAll('[data-banner-block]').forEach(btn => btn.addEventListener('click', () => coupBlock(btn.dataset.bannerBlock, btn.dataset.blockRole)));
    wrap.querySelectorAll('[data-banner-pass]').forEach(btn => btn.addEventListener('click', () => coupPassPending(btn.dataset.bannerPass)));
    return wrap;
}

// ─────────────────────────────────────────────────────────────
// Timer
// ─────────────────────────────────────────────────────────────

function startCoupTurnTimer(state = coupState, myId = null) {
    clearInterval(coupTimerInterval);
    const timerEl = document.getElementById('coup-action-timer');
    if (!timerEl || !state) return;
    const tick = () => {
        if (!state.turnEndsAt) _coupSetTurnDeadline(state);
        const left = Math.ceil((state.turnEndsAt - _now()) / 1000);
        timerEl.innerHTML = _coupTimerHtml(left);
        timerEl.classList.toggle('urgent', left <= 10);
        if (left <= 0 && !state.pending && _coupAlive(state).length > 1) coupHandleTimeout();
    };
    tick();
    coupTimerInterval = setInterval(tick, 1000);
}

function _coupStartResponseTimer(onExpire) {
    clearInterval(coupResponseInterval);
    const tick = () => {
        _wireCoupModalCountdown(document);
        const p = coupState?.pending;
        if (!p?.expiresAt) return;
        if (_now() >= p.expiresAt) {
            clearInterval(coupResponseInterval);
            coupResponseInterval = null;
            _closeCoupModal();
            onExpire?.();
        }
    };
    tick();
    coupResponseInterval = setInterval(tick, 500);
}

function coupHandleTimeout() {
    if (!coupState || coupState.pending || coupState._timingOut) return;
    coupState._timingOut = true;
    const actor = coupState.players[coupState.turnIndex];
    if (actor && actor.hand.some(c => !c.lost)) {
        actor.coins += 1;
        _coupTakeFromBank(coupState, 1);
        coupState.log = `${actor.name} فات الوقت، خذا شهرية +1 وعدّى الدور.`;
        _showCoupEvent('الوقت وفى، تعدّى الدور', 'notice');
    }
    _coupNextTurn();
    coupState._timingOut = false;
    renderCoupScreen();
}

// ─────────────────────────────────────────────────────────────
// Action state machine
// ─────────────────────────────────────────────────────────────

function coupChooseAction(action) {
    const actor      = coupState.players[coupState.turnIndex];
    const needsTarget = ['assassinate', 'coup', 'steal'].includes(action);
    if ((actor.coins || 0) >= 10 && action !== 'coup') return showToast('عندك 10 فلوس ولا أكثر، لازم تعمل Coup.');
    if (action === 'assassinate' && actor.coins < 3)  return showToast('يلزمك 3 فلوس للاغتيال.');
    if (action === 'coup'        && actor.coins < 7)  return showToast('يلزمك 7 فلوس للCoup.');
    if (needsTarget) return coupPickTarget(action);
    const actionName = coupActionName(action);
    _showCoupModal(actionName,
        `<p>باش تعمل <strong>${_escHtml(actionName)}</strong>. كان فيها تبلعيط، اللاعبين ينجموا يقولو "تكذب!".</p><button class="primary-btn" id="coup-confirm-action">كمّل</button>`,
        overlay => {
            overlay.querySelector('#coup-confirm-action')?.addEventListener('click', () => {
                _closeCoupModal();
                coupStartPending(action, null);
            });
        }
    );
}

function coupPickTarget(action) {
    const actor   = coupState.players[coupState.turnIndex];
    const targets = _coupAlive().filter(p => p.id !== actor.id);
    _showCoupModal(
        action === 'steal' ? 'اختار شكون تسرق' : 'اختار شكون تضرب',
        `<p>${action === 'steal' ? 'الرايس يسرق حتى زوز فلوس من لاعب.' : action === 'assassinate' ? 'حفار القبور يحتاج هدف واضح.' : 'Coup ضربة مباشرة وما تتسكرش.'}</p><div class="coup-target-grid">${targets.map(p => `<button class="coup-target-btn" data-target-id="${p.id}">${_escHtml(p.name)}</button>`).join('')}</div>`,
        overlay => {
            overlay.querySelectorAll('[data-target-id]').forEach(btn => btn.addEventListener('click', () => {
                _closeCoupModal();
                coupStartPending(action, btn.dataset.targetId);
            }));
        }
    );
}

function coupStartPending(action, targetId) {
    const actor    = coupState.players[coupState.turnIndex];
    const claims   = { tax: 'duke', assassinate: 'assassin', exchange: 'ambassador', steal: 'captain' };
    const blockRoles = action === 'foreignAid' ? ['duke'] : action === 'assassinate' ? ['contessa'] : action === 'steal' ? ['captain', 'ambassador'] : [];
    const blockable  = blockRoles.length > 0;
    const claim      = claims[action] || null;
    if (!claim && !blockable) return coupResolveAction(action, targetId);
    if (action === 'assassinate') { actor.coins -= 3; _coupPayBank(coupState, 3); }
    coupState.pending = { id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, action, actorId: actor.id, targetId, claim, blockable, blockRoles, passes: [] };
    _coupSetResponseDeadline(coupState.pending);
    coupState.log = `${actor.name} قال يعمل ${coupActionName(action)}. تنجمو تقولو "تكذب!"${blockable ? ' ولا تسكروها.' : ''}`;
    _showCoupEvent(`${actor.name} عمل ${coupActionName(action)}`, 'notice');
    renderCoupChallengePanel();
}

function renderCoupChallengePanel() {
    renderCoupScreen();
    const p            = coupState.pending;
    const isBlockStage = p.stage === 'block';
    const actor        = coupState.players.find(x => x.id === p.actorId);
    const target       = coupState.players.find(x => x.id === p.targetId);
    const challengers  = _coupAlive().filter(x => x.id !== actor.id);
    const blockers     = p.action === 'foreignAid' ? challengers : challengers.filter(x => x.id === p.targetId);
    const challengeButtons = (p.claim || isBlockStage)
        ? challengers.map(c => `<button class="coup-target-btn danger-action" data-challenge-id="${c.id}">${_escHtml(c.name)}: تكذب!</button>`).join('') : '';
    const passButtons = _coupPendingResponders(coupState, p).filter(c => !(p.passes || []).includes(c.id))
        .map(c => `<button class="coup-target-btn quiet-action" data-pass-id="${c.id}">${_escHtml(c.name)}: ما عندي حتى اعتراض</button>`).join('');
    const blockButtons = p.blockable
        ? blockers.map(c => _coupBlockOptions(p).map(opt =>
            `<button class="coup-target-btn" data-block-id="${c.id}" data-block-role="${opt.role}">${_escHtml(c.name)}: نسكّرها ب${opt.label}</button>`
          ).join('')).join('') : '';
    const targetLine = target ? `<p class="coup-decision-hint">${_escHtml(target.name)}، تنجم تسكّر الأكشن كان عندك الكارتة المناسبة، ولا تقول للّي هاجمك "تكذب!".</p>` : '';
    _showCoupModal('قرار مباشر 🎭',
        `<p>${_escHtml(coupState.log)}</p>${targetLine}${_coupPendingTimerHtml(p)}<div class="coup-pass-progress">${_coupPassCount(coupState, p)}/${_coupPendingResponders(coupState, p).length} قالو ما عندهم حتى اعتراض</div><div class="coup-target-grid">${challengeButtons}${blockButtons}${passButtons}</div>`,
        overlay => {
            overlay.querySelectorAll('[data-challenge-id]').forEach(btn => btn.addEventListener('click', () => { _closeCoupModal(); coupChallenge(btn.dataset.challengeId); }));
            overlay.querySelectorAll('[data-block-id]').forEach(btn => btn.addEventListener('click', () => { _closeCoupModal(); coupBlock(btn.dataset.blockId, btn.dataset.blockRole); }));
            overlay.querySelectorAll('[data-pass-id]').forEach(btn => btn.addEventListener('click', () => { _closeCoupModal(); coupPassPending(btn.dataset.passId); }));
        }
    );
    _coupStartResponseTimer(() => coupPassPending(_coupPendingResponders(coupState, coupState.pending)?.[0]?.id || ''));
}

function coupChallenge(challengerId) {
    const p          = coupState.pending;
    const actor      = coupState.players.find(x => x.id === p.actorId);
    const challenger = coupState.players.find(x => x.id === challengerId);
    const hasIt      = actor.hand.some(c => !c.lost && c.type === p.claim);
    if (hasIt) {
        const originalPending = { ...p };
        _coupProveAndReplace(actor, p.claim);
        coupState.log = `${challenger.name} طلع غالط! ${actor.name} ورّى الكارتة و${funWrongAccuser()}`;
        _showCoupNotLyingAnimation(actor.name, p.claim);
        _showCoupEvent(coupState.log, 'bad');
        coupLoseInfluence(challengerId, () => {
            if (originalPending.blockable) _coupOpenBlockWindowAfterChallenge(originalPending, actor);
            else coupResolveAction(originalPending.action, originalPending.targetId);
        }, 'طلعت غالط في التكذيب. اختار كارتة تخسرها.');
    } else {
        coupState.log = `${actor.name} تڨبض يبوّع! ${funCaughtBluff()}`;
        coupState.pending = null;
        coupLoseInfluence(actor.id, () => { _coupNextTurn(); renderCoupScreen(); }, 'تكذّبت وما عندكش الكارتة. اختار كارتة تكشفها.');
    }
}

function _coupOpenBlockWindowAfterChallenge(pending, actor) {
    coupState.pending = { ...pending, id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, claim: null, challengeClosed: true, passes: [] };
    _coupSetResponseDeadline(coupState.pending);
    coupState.log = `${actor.name} ورّى الكارتة الصحيحة. مازال تنجم تتسكر كان عندكم الكارتة المناسبة.`;
    renderCoupChallengePanel();
}

function coupPassPending(playerId) {
    const p = coupState.pending;
    if (!p) return;
    const claimantId = _coupPendingClaimantId(p);
    if (playerId === claimantId) return;
    p.passes = Array.from(new Set([...(p.passes || []), playerId]));
    if (_coupAllPassed(coupState, p)) {
        _closeCoupModal();
        if (p.stage === 'block') coupAcceptBlock();
        else coupResolveAction(p.action, p.targetId);
    } else {
        renderCoupScreen();
        if (p.stage === 'block') renderCoupBlockChallengePanel();
        else renderCoupChallengePanel();
    }
}

function coupBlock(blockerId, blockRole = null) {
    const p          = coupState.pending;
    const blocker    = coupState.players.find(x => x.id === blockerId);
    const blockRoles = p.blockRoles || (p.action === 'assassinate' ? ['contessa'] : p.action === 'steal' ? ['captain', 'ambassador'] : ['duke']);
    const role       = blockRole && blockRoles.includes(blockRole) ? blockRole : blockRoles[0];
    coupState.pending = { ...p, id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, stage: 'block', blockerId, blockRole: role, passes: [] };
    _coupSetResponseDeadline(coupState.pending);
    coupState.log = `${blocker.name} قال يسكّرها ب${_coupBlockRoleLabel(role)}. ${coupState.players.find(x => x.id === p.actorId)?.name || ''} ينجم يقوللو "تكذب!".`;
    renderCoupBlockChallengePanel();
}

function renderCoupBlockChallengePanel() {
    renderCoupScreen();
    const p               = coupState.pending;
    const blocker         = coupState.players.find(x => x.id === p.blockerId);
    const challengeButtons = _coupPendingResponders(coupState, p)
        .map(c => `<button class="coup-target-btn danger-action" data-challenge-block-id="${c.id}">${_escHtml(c.name)}: تكذب على البلوك!</button>`).join('');
    const passButtons = _coupPendingResponders(coupState, p).filter(c => !(p.passes || []).includes(c.id))
        .map(c => `<button class="coup-target-btn quiet-action" data-pass-id="${c.id}">${_escHtml(c.name)}: ما عندي حتى اعتراض</button>`).join('');
    _showCoupModal('سكّرها، أما صحيح؟',
        `<p>${_escHtml(coupState.log)}</p><p class="coup-decision-hint">أي لاعب غير ${_escHtml(blocker?.name || '')} ينجم يتهم البلوك بالتبلعيط، ولا يعمل ما عندي حتى اعتراض.</p>${_coupPendingTimerHtml(p)}<div class="coup-pass-progress">${_coupPassCount(coupState, p)}/${_coupPendingResponders(coupState, p).length} قالو ما عندهم حتى اعتراض</div><div class="coup-target-grid">${challengeButtons}${passButtons}</div>`,
        overlay => {
            overlay.querySelectorAll('[data-challenge-block-id]').forEach(btn => btn.addEventListener('click', () => { _closeCoupModal(); coupChallengeBlock(btn.dataset.challengeBlockId); }));
            overlay.querySelectorAll('[data-pass-id]').forEach(btn => btn.addEventListener('click', () => { _closeCoupModal(); coupPassPending(btn.dataset.passId); }));
        }
    );
    _coupStartResponseTimer(coupAcceptBlock);
}

function coupAcceptBlock() {
    const p      = coupState.pending;
    const blocker = coupState.players.find(x => x.id === p?.blockerId);
    coupState.log = `${blocker?.name || ''} سكّر الأكشن. تعدّت بسلام.`;
    coupState.pending = null;
    _coupNextTurn();
    _showCoupEvent(coupState.log, 'good');
    _sfx.notify();
    renderCoupScreen();
}

function coupChallengeBlock(challengerId = null) {
    const p           = coupState.pending;
    const actor       = coupState.players.find(x => x.id === p.actorId);
    const challenger  = coupState.players.find(x => x.id === challengerId) || actor;
    const blocker     = coupState.players.find(x => x.id === p.blockerId);
    const hasIt       = blocker.hand.some(c => !c.lost && c.type === p.blockRole);
    if (hasIt) {
        _coupProveAndReplace(blocker, p.blockRole);
        coupState.log = `${challenger.name} اتهم البلوك وطلع غالط. ${blocker.name} عندو ${_coupBlockRoleLabel(p.blockRole)}.`;
        coupState.pending = null;
        _showCoupNotLyingAnimation(blocker.name, p.blockRole);
        _showCoupEvent(coupState.log, 'bad');
        coupLoseInfluence(challenger.id, () => { _coupNextTurn(); renderCoupScreen(); }, 'طلعت غالط في تكذيب البلوك. اختار كارتة تخسرها.');
    } else {
        coupState.log = `${blocker.name} حاول يسكّرها وطلع يبوّع! الأكشن يكمل.`;
        _showCoupEvent(coupState.log, 'bad');
        coupLoseInfluence(blocker.id, () => coupResolveAction(p.action, p.targetId), 'البلوك كان تبلعيط. اختار كارتة تكشفها.');
    }
}

function coupResolveAction(action, targetId) {
    const actor  = coupState.players.find(p => p.id === coupState.pending?.actorId) || coupState.players[coupState.turnIndex];
    const target = coupState.players.find(p => p.id === targetId);
    coupState.pending = null;
    if (action === 'income')     { actor.coins += 1; _coupTakeFromBank(coupState, 1); coupState.log = `${actor.name} خذا دينار. رزق بارد.`; }
    if (action === 'foreignAid') { actor.coins += 2; _coupTakeFromBank(coupState, 2); coupState.log = `${actor.name} خذا اعانة. ما فماش شلغمي سكّرها.`; }
    if (action === 'tax')        { actor.coins += 3; _coupTakeFromBank(coupState, 3); coupState.log = `${actor.name} كول بالشلغمي وخذا 3 فلوس.`; }
    if (action === 'exchange') {
        coupState.log = `${actor.name} يشوف زوز كوارط من الدكّة ويختار شنوّة يخلي.`;
        _showCoupEvent(coupState.log, 'notice');
        return coupStartExchangeChoice(actor, () => {
            coupState.log = `${actor.name} بدّل كوارطو مع الدكّة. السمسار خدم خدمتو.`;
            _showCoupEvent(coupState.log, 'good');
            _coupNextTurn();
            renderCoupScreen();
        });
    }
    if (action === 'steal' && target) {
        const amount = Math.min(2, target.coins || 0);
        target.coins -= amount; actor.coins += amount;
        coupState.log = amount > 0 ? `${actor.name} سرق ${amount} فلوس من ${target.name}. الرايس دخل للمرسى.` : `${actor.name} حاول يسرق ${target.name} أما ما لقى شي.`;
    }
    if (action === 'assassinate' && target) {
        coupState.log = `${target.name} تضرّب من حفار القبور. ${target.name} يختار كارتة يخسرها.`;
        _showCoupEvent(coupState.log, 'bad');
        return coupLoseInfluence(target.id, () => { _coupNextTurn(); renderCoupScreen(); }, 'تضرّبت من حفار القبور. اختار شنية الكارتة الي تخسرها.');
    }
    if (action === 'coup' && target) {
        actor.coins -= 7; _coupPayBank(coupState, 7);
        coupState.log = `${actor.name} عمل Coup على ${target.name}. ${target.name} يختار كارتة يخسرها.`;
        _showCoupEvent(coupState.log, 'bad');
        return coupLoseInfluence(target.id, () => { _coupNextTurn(); renderCoupScreen(); }, 'تضرّبت بCoup. اختار شنية الكارتة الي تخسرها.');
    }
    _showCoupEvent(coupState.log, ['assassinate', 'coup'].includes(action) ? 'bad' : 'good');
    _coupNextTurn();
    renderCoupScreen();
}

function coupLoseInfluence(playerId, onDone, promptMsg = 'اختار كارتة تخسرها.') {
    const player  = coupState.players.find(p => p.id === playerId);
    if (!player) { onDone?.(); return; }
    const liveCards = player.hand.filter(c => !c.lost);
    if (liveCards.length === 0) { onDone?.(); return; }
    if (liveCards.length === 1) {
        const card    = liveCards[0]; card.lost = true;
        const cardMeta = coupCards[card.type] || coupCards.duke;
        const out      = !player.hand.some(c => !c.lost);
        _showCoupLossAnimation(player.name, cardMeta, out);
        onDone?.();
        return;
    }
    _showCoupModal(promptMsg, `<div class="coup-target-grid">${liveCards.map(c => { const meta = coupCards[c.type] || coupCards.duke; return `<button class="coup-target-btn danger-action" data-lose-type="${c.type}">${_coupCardLabelHtml(meta)}</button>`; }).join('')}</div>`, overlay => {
        overlay.querySelectorAll('[data-lose-type]').forEach(btn => btn.addEventListener('click', () => {
            _closeCoupModal();
            const chosen = player.hand.find(c => !c.lost && c.type === btn.dataset.loseType);
            if (chosen) { chosen.lost = true; }
            const cardMeta = coupCards[btn.dataset.loseType] || coupCards.duke;
            const out      = !player.hand.some(c => !c.lost);
            _showCoupLossAnimation(player.name, cardMeta, out);
            onDone?.();
        }));
    });
}

function coupStartExchangeChoice(actor, onDone) {
    const drawn = [coupState.deck.pop(), coupState.deck.pop()].filter(Boolean);
    const pool  = [...actor.hand.filter(c => !c.lost).map(c => c.type), ...drawn];
    const keep  = actor.hand.filter(c => !c.lost).length;
    let chosen  = [];
    const render = () => {
        _showCoupModal('اختار شنية تخلّي',
            `<p>عندك ${pool.length} كوارط، اختار ${keep} تخلّيهم.</p><div class="coup-target-grid">${pool.map((type, i) => { const meta = coupCards[type] || coupCards.duke; const sel = chosen.includes(i); return `<button class="coup-target-btn${sel ? ' selected' : ''}" data-pool-i="${i}">${_coupCardLabelHtml(meta)}</button>`; }).join('')}</div>${chosen.length === keep ? `<button class="primary-btn" id="coup-exchange-confirm" style="margin-top:10px;">تأكيد</button>` : ''}`,
            overlay => {
                overlay.querySelectorAll('[data-pool-i]').forEach(btn => btn.addEventListener('click', () => {
                    const i = +btn.dataset.poolI;
                    if (chosen.includes(i)) chosen = chosen.filter(x => x !== i);
                    else if (chosen.length < keep) chosen.push(i);
                    render();
                }));
                overlay.querySelector('#coup-exchange-confirm')?.addEventListener('click', () => {
                    _closeCoupModal();
                    const kept    = chosen.map(i => pool[i]);
                    const returned = pool.filter((_, i) => !chosen.includes(i));
                    actor.hand = actor.hand.filter(c => !c.lost).map((_, j) => ({ type: kept[j], lost: false }));
                    coupState.deck.push(...returned);
                    coupState.deck.sort(() => 0.5 - Math.random());
                    onDone?.();
                });
            }
        );
    };
    render();
}

// ─────────────────────────────────────────────────────────────
// Guide system
// ─────────────────────────────────────────────────────────────

const coupGuideSections = [
    { key:'goal',  title:'الهدف',            icon:'🎯', body:'آخر لاعب يبقى عندو كوارط حيّة يربح. كي تخسر زوز كوارطك تخرج من الطرح وتتفرج.', tips:['كل لاعب يبدأ بزوز كوارط مخبيين وزوز فلوس.', 'الكوارط الي تخسرها تتكشف للناس الكل.'] },
    { key:'turn',  title:'دورتك',            icon:'🎲', body:'في دورتك تختار أكشن واحدة: شهرية، اعانة، Coup، ولا claim بكارتة. تنجم تكذب، أما أي لاعب ينجم يقولك تكذب.', tips:['الشهرية +1 ما يتسكرش وما يتكذّبش.', 'اعانة +2 تتسكر بالشلغمي.', 'كان عندك 10 فلوس ولا أكثر لازم تعمل Coup.'] },
    { key:'cards', title:'الكوارط',          icon:'🂠', cards:['duke','assassin','contessa','captain','ambassador'] },
    { key:'bluff', title:'التكذيب والبلوك', icon:'🔥', body:'أي claim بكارتة ينجم يتكذّب. كان صاحب الclaim عندو الكارتة، يوريها، يرجّعها للدكّة ويجبد وحدة جديدة، والمتّهم يخسر كارتة. كان ما عندوش، هو يخسر كارتة.', tips:['بعد claim صحيح متاع حفار القبور ولا الرايس، البلوك مازال ينجم يصير.', 'كان البلوك تتبلعيط، يتكذّب زادة: الغالط هو الي يخسر كارتة.'] },
    { key:'money', title:'الفلوس',           icon:'🪙', body:'الفلوس هي السلاح. دخّل فلوس، استعملها للاغتيال، ولا خلّيها للCoup كي تحب تضرب ضربة ما تتسكرش.', tips:['الاغتيال يكلّف 3 فلوس.', 'Coup يكلّف 7 فلوس وما فيه لا بلوك لا تكذيب.', 'الرايس يسرق حتى زوز فلوس من لاعب.'] },
];

function renderCoupGuide(activeKey = 'goal') {
    const tabs    = document.getElementById('coup-guide-tabs');
    const content = document.getElementById('coup-guide-content');
    if (!tabs || !content) return;
    const active = coupGuideSections.find(s => s.key === activeKey) || coupGuideSections[0];
    tabs.innerHTML = coupGuideSections.map(section =>
        `<button class="coup-guide-tab ${section.key === active.key ? 'active' : ''}" data-guide-tab="${section.key}" type="button">${section.icon}<span>${_escHtml(section.title)}</span></button>`
    ).join('');
    if (active.cards) {
        content.innerHTML = `<div class="coup-guide-card-grid">${active.cards.map(type => {
            const card = coupCards[type];
            return `<button class="coup-guide-role-card" data-guide-card="${type}" type="button">${_coupCardLargeHtml(card)}<strong>${_escHtml(card.name)}</strong><span>${_escHtml(card.attack)}</span><span>${_escHtml(card.defense)}</span></button>`;
        }).join('')}</div>`;
        content.querySelectorAll('[data-guide-card]').forEach(btn =>
            btn.addEventListener('click', () => _showCoupCardInfo(btn.dataset.guideCard))
        );
    } else {
        content.innerHTML = `<div class="coup-guide-box"><div class="coup-guide-big-icon">${active.icon}</div><h3>${_escHtml(active.title)}</h3><p>${_escHtml(active.body || '')}</p><div class="coup-guide-tip-grid">${(active.tips || []).map(tip => `<div class="coup-guide-tip">${_escHtml(tip)}</div>`).join('')}</div></div>`;
    }
    tabs.querySelectorAll('[data-guide-tab]').forEach(btn =>
        btn.addEventListener('click', () => { _sfx.tap(); renderCoupGuide(btn.dataset.guideTab); })
    );
}

function showCoupGuide() { renderCoupGuide(); showScreen('coup-guide-screen'); }

// ─────────────────────────────────────────────────────────────
// Offline game initializer
// ─────────────────────────────────────────────────────────────

function startCoupOffline(playerNames) {
    if (!playerNames || playerNames.length < 2) return;
    const deck    = _coupBuildDeck();
    const players = playerNames.map((name, i) => ({
        id:    `offline_${i}`,
        name,
        coins: 2,
        hand:  [{ type: deck.pop(), lost: false }, { type: deck.pop(), lost: false }],
    }));
    coupState = {
        players,
        deck,
        bankCoins:  50 - players.length * 2,
        turnIndex:  0,
        pending:    null,
        log:        '',
        actionMinutes: GameState.getTimerConfig() || COUP_DEFAULT_ACTION_MINUTES,
    };
    _coupSetTurnDeadline();
    showScreen('coup-screen');
    renderCoupScreen();
}

// ─────────────────────────────────────────────────────────────
// Expose as platform game contract + global backward compat
// ─────────────────────────────────────────────────────────────
window.CoupGame = {
    cards:              coupCards,
    actionHelp:         coupActionHelp,
    guideSections:      coupGuideSections,
    // State (read by online.js)
    getState:           () => coupState,
    setState:           (s) => { coupState = s; },
    // Utilities (used by online.js to build online Coup)
    buildDeck:          _coupBuildDeck,
    alive:              _coupAlive,
    nextTurn:           _coupNextTurn,
    setTurnDeadline:    _coupSetTurnDeadline,
    setResponseDeadline: _coupSetResponseDeadline,
    passCount:          _coupPassCount,
    allPassed:          _coupAllPassed,
    proveAndReplace:    _coupProveAndReplace,
    actionName:         coupActionName,
    // Rendering (called by online.js after receiving server state)
    renderScreen:       renderCoupScreen,
    renderGuide:        renderCoupGuide,
    showGuide:          showCoupGuide,
    loseInfluence:      coupLoseInfluence,
    startExchangeChoice: coupStartExchangeChoice,
    handleTimeout:      coupHandleTimeout,
    // UI helpers (used by online.js)
    UI: {
        escapeHtml:         _escHtml,
        formatSeconds:      _fmtSeconds,
        renderRoleHelp:     _renderCoupRoleHelp,
        showModal:          _showCoupModal,
        closeModal:         _closeCoupModal,
        showCardInfo:       _showCoupCardInfo,
        showEvent:          _showCoupEvent,
        showLossAnimation:  _showCoupLossAnimation,
        cardIconHtml:       _coupCardIconHtml,
        cardLabelHtml:      _coupCardLabelHtml,
        cardLargeHtml:      _coupCardLargeHtml,
        resourceHtml:       _coupResourceHtml,
        statusHtml:         _coupStatusHtml,
        timerHtml:          _coupTimerHtml,
        pendingTimerHtml:   _coupPendingTimerHtml,
        renderPendingBanner: _renderCoupPendingBanner,
        wireModalCountdown: _wireCoupModalCountdown,
    },
    startOffline: startCoupOffline,
};

// Backward-compatibility aliases used by shared.js and online.js
window.coupState           = null; // managed via CoupGame.getState/setState proxies below
window.coupCards           = coupCards;
window.coupActionHelp      = coupActionHelp;
window.renderCoupScreen    = renderCoupScreen;
window.renderCoupGuide     = renderCoupGuide;
window.showCoupGuide       = showCoupGuide;
window.startCoupTurnTimer  = startCoupTurnTimer;
window.coupHandleTimeout   = coupHandleTimeout;
window.coupLoseInfluence   = coupLoseInfluence;
window.coupStartExchangeChoice = coupStartExchangeChoice;
window.coupChooseAction    = coupChooseAction;
window.coupChallenge       = coupChallenge;
window.coupBlock           = coupBlock;
window.coupPassPending     = coupPassPending;
window.coupChallengeBlock  = coupChallengeBlock;
window.coupResolveAction   = coupResolveAction;
window.renderCoupChallengePanel     = renderCoupChallengePanel;
window.renderCoupBlockChallengePanel = renderCoupBlockChallengePanel;
window.CoupUI              = window.CoupGame.UI;

// Proxy window.coupState so legacy code reading/writing it directly still works
Object.defineProperty(window, 'coupState', {
    get: () => coupState,
    set: (v) => { coupState = v; },
    enumerable: true,
    configurable: true,
});
