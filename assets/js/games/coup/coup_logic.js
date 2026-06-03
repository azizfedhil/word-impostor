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
    // ── Expansion roles ──────────────────────────────────────────
    bureaucrat: {
        name: 'الشيخ', icon: '📋',
        img: _coupAssetBase + 'bureaucrat.webp', img512: _coupAssetBase + 'bureaucrat512.webp',
        attack:  'هجوم: يخذ 3 فلوس من البنك ويعطي 1 لأي لاعب تختاره (صافيك +2).',
        defense: 'دفاع: يسكّر اعانة +2 كيما الشلغمي.',
    },
    speculator: {
        name: 'الكُلّاب', icon: '🎲',
        img: _coupAssetBase + 'speculator.webp', img512: _coupAssetBase + 'speculator512.webp',
        attack:  'هجوم: يخذ من البنك نفس عدد فلوسو (حتى 5).',
        defense: 'دفاع: يسكّر اعانة +2 كيما الشلغمي.',
    },
    inquisitor: {
        name: 'البحّاث', icon: '🔍',
        img: _coupAssetBase + 'inquisitor.webp', img512: _coupAssetBase + 'inquisitor512.webp',
        attack:  'هجوم: يبدّل كارطة واحدة مع الدكة، أو يشوف كارطة لاعب آخر وينجم يجبره يبدّلها.',
        defense: 'دفاع: يسكّر سرقة الرايس.',
    },
    jester: {
        name: 'العمدة', icon: '🃏',
        img: _coupAssetBase + 'jester.webp', img512: _coupAssetBase + 'jester512.webp',
        attack:  'هجوم: يجيب كارطة من الدكة وكارطة عشوائية من لاعب آخر ويختار واحدة يبقى بيها.',
        defense: 'دفاع: يسكّر سرقة الرايس وفوضى العمدة.',
    },
    socialist: {
        name: 'المدير', icon: '✊',
        img: _coupAssetBase + 'socialist.webp', img512: _coupAssetBase + 'socialist512.webp',
        attack:  'هجوم: من كل لاعب يختار: يخذ فلوس أو يخذ كارطة (يبقى بكارطة واحدة بالأقصى).',
        defense: 'دفاع: يسكّر سرقة الرايس.',
    },
    lawyer: {
        name: 'الكبران', icon: '⚖️',
        img: _coupAssetBase + 'lawyer.webp', img512: _coupAssetBase + 'lawyer512.webp',
        attack:  'هجوم: يبعث فاتورة لاعب ويأخذ حتى زوز فلوس.',
        defense: 'دفاع: يسكّر سرقة الرايس. كان لاعب يخرج، ينجم يطالب بميراثه (ياخذ كل فلوسو ويخسر كارطة).',
    },
    customsOfficer: {
        name: 'سي فلان', icon: '🛃',
        img: _coupAssetBase + 'customsOfficer.webp', img512: _coupAssetBase + 'customsOfficer512.webp',
        attack:  'هجوم: يفرض ضريبة على دور موجود في اللعبة. أي حد يدعي الدور يدفع 1 فلوس لسي فلان.',
        defense: 'دفاع: يسكّر سرقة الرايس.',
    },
};

// ── Role-family helpers ───────────────────────────────────────
const _DUKE_FAMILY      = ['duke', 'bureaucrat', 'speculator'];
const _AMB_FAMILY       = ['ambassador', 'inquisitor', 'jester', 'socialist'];
const _CAPTAIN_FAMILY   = ['captain', 'lawyer', 'customsOfficer'];

function _coupSelectRoles() {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    return ['assassin', pick(_CAPTAIN_FAMILY), 'contessa', pick(_DUKE_FAMILY), pick(_AMB_FAMILY)];
}

function _coupGetDynamic(state = coupState) {
    const roles     = state?.rolesInPlay || ['assassin', 'captain', 'contessa', 'duke', 'ambassador'];
    const dukeRole  = roles.find(r => _DUKE_FAMILY.includes(r)) || 'duke';
    const ambRole   = roles.find(r => _AMB_FAMILY.includes(r))  || 'ambassador';
    const captainRole = roles.find(r => _CAPTAIN_FAMILY.includes(r)) || 'captain';
    return {
        dukeRole,
        ambRole,
        captainRole,
        aidBlockRoles:    [dukeRole],
        stealBlockRoles:  [captainRole, ambRole],
        invoiceBlockRoles: ambRole === 'ambassador' ? ['ambassador', 'inquisitor', 'jester', 'socialist'] : [ambRole],
        jesterBlockRoles: ['jester'],
    };
}

function _coupActionClaim(action, state = coupState) {
    const dyn = _coupGetDynamic(state);
    return ({
        tax:              dyn.dukeRole,
        bureaucratTax:    'bureaucrat',
        speculatorGamble: 'speculator',
        assassinate:      'assassin',
        exchange:         'ambassador',
        inquireExchange:  'inquisitor',
        inquireInspect:   'inquisitor',
        jesterDisorder:   'jester',
        socialistShare:   'socialist',
        steal:            dyn.captainRole,
        invoice:          'lawyer',
        taxAssignment:    'customsOfficer',
    })[action] || null;
}

function _coupActionBlockRoles(action, state = coupState) {
    const dyn = _coupGetDynamic(state);
    return ({
        foreignAid:      dyn.aidBlockRoles,
        assassinate:     ['contessa'],
        steal:           dyn.stealBlockRoles,
        jesterDisorder:  dyn.jesterBlockRoles,
        invoice:         dyn.invoiceBlockRoles,
    })[action] || [];
}

// ── Action help text ─────────────────────────────────────────
// Single source of truth — includes all expansion role actions.
const coupActionHelp = {
    income:          { title: 'شهرية +1',              text: 'تاخو 1 فلوس من البنك. ما تتسكرش وما حد ينجم يقولك تكذب.' },
    foreignAid:      { title: 'اعانة +2',               text: 'تاخو 2 فلوس من البنك. أي لاعب ينجم يسكّرها بكارطة الدكة الموجودة في الطرح. بعد البلوك أي لاعب ينجم يتهمه.' },
    tax:             { title: 'الشلغمي +3',             text: 'تقول عندي الشلغمي وتاخو 3 فلوس من البنك. أي لاعب ينجم يقولك تكذب.' },
    bureaucratTax:   { title: 'الشيخ: تعاون +2',       text: 'تقول عندي الشيخ وتاخو 3 فلوس من البنك وتعطي 1 لأي لاعب تختاره (صافيك +2، للهدف +1). أي لاعب ينجم يقولك تكذب.' },
    speculatorGamble:{ title: 'الكلاب: قامبل',         text: 'تقول عندي الكلاب وتاخو فلوس تساوي فلوسك الحالية (أكثر 5). كان عندك صفر، ما تاخوش. أي لاعب ينجم يقولك تكذب.' },
    steal:           { title: 'الرايس: اسرق',           text: 'تقول عندي الرايس وتسرق حتى زوز فلوس من لاعب. الهدف ينجم يسكّر بالرايس أو الكارطة الموجودة من عيلة السمسار. أي لاعب ينجم يقول تكذب.' },
    invoice:         { title: 'الكبران: فاتورة',        text: 'تقول عندي الكبران وتبعث فاتورة لاعب وتاخو حتى زوز فلوس. الهدف ينجم يسكّر بأي كارطة من عيلة السمسار. أي لاعب ينجم يقول تكذب.' },
    taxAssignment:   { title: 'سي فلان: ضريبة',         text: 'تقول عندي سي فلان وتفرض ضريبة على دور موجود في اللعبة. أي حد يدعي الدور يدفع 1 فلوس لسي فلان. أي لاعب ينجم يقولك تكذب.' },
    assassinate:     { title: 'اغتيال -3',              text: 'تدفع 3 فلوس وتقول عندي حفار القبور باش تطيّح كارتة من لاعب. الهدف ينجم يسكّر بالبية، وأي لاعب ينجم يقول تكذب.' },
    exchange:        { title: 'السمسار: بدّل',          text: 'تقول عندي السمسار وتبدّل كوارطك الحيين مع الدكّة. أي لاعب ينجم يقولك تكذب.' },
    inquireExchange: { title: 'البحاث: بدّل كارطة',    text: 'تقول عندي البحاث وتجيب كارطة واحدة من الدكة وتختار شنوة تبقى معاك. أي لاعب ينجم يقولك تكذب.' },
    inquireInspect:  { title: 'البحاث: فحص',           text: 'تقول عندي البحاث وتشوف كارطة لاعب آخر. إما تخلّيه يبدّلها بكارطة عشوائية من الدكة، أو ما تعمل شي. أي لاعب ينجم يقولك تكذب.' },
    jesterDisorder:  { title: 'العمدة: فوضى',          text: 'تقول عندي العمدة، تجيب كارطة من الدكة وتاخو عشوائي كارطة من لاعب. من الاثنتين اختار واحدة تبقى معاك وبدّلها مع كارطة من كوارطك. أي لاعب ينجم يقولك تكذب.' },
    socialistShare:  { title: 'المدير: وزّع',          text: 'تقول عندي المدير ومن كل لاعب تختار: تاخو فلوس أو كارطة. كان خذيت أكثر من كارطة، تبقى بواحدة وترجع الباقي لأصحابهم. الفلوس ما ترجعوش.' },
    coup:            { title: 'Coup -7',                text: 'تدفع 7 فلوس وتطيّح كارتة من لاعب. ما تتسكرش وما فيهاش تكذيب.' },
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

function _coupBuildDeck(rolesInPlay) {
    const roles = rolesInPlay || _coupSelectRoles();
    return roles.flatMap(k => Array(3).fill(k)).sort(() => 0.5 - Math.random());
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
    return ({
        income:'شهرية', foreignAid:'اعانة',
        tax:'ضريبة الشلغمي', bureaucratTax:'تعاون الشيخ', speculatorGamble:'قامبل الكلاب',
        assassinate:'اغتيال', exchange:'تبديل السمسار',
        inquireExchange:'تبديل البحاث', inquireInspect:'فحص البحاث',
        jesterDisorder:'فوضى العمدة', socialistShare:'توزيع المدير',
        steal:'سرقة الرايس', invoice:'فاتورة الكبران', taxAssignment:'ضريبة سي فلان',
        coup:'Coup'
    })[action] || action;
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
    const cardType = type;
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

function _showCoupLossAnimation(playerName, cardMeta, out = false, cardType = null) {
    document.querySelector('.coup-loss-overlay')?.remove();
    const ct = cardType || Object.keys(coupCards).find(k => coupCards[k] === cardMeta) || 'duke';
    const fullCardSrc = _coupImgBase + ct + '_full_card.webp';
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

function _renderCoupRoleHelp(cards = coupCards) {
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
    if (state.pending) { panel.innerHTML = `<div class="coup-panel-card live">${_escHtml(state.log || '')}</div>`; return; }
    const current = state.players[state.turnIndex];
    if (!isTurn) { panel.innerHTML = `<div class="coup-panel-card">استنى دورك. الدور توّة على ${_escHtml(current?.name || '')}.</div>`; }
    const mustCoup = isTurn && (me?.coins || 0) >= 10;
    const _actionBgMap = { income:'plusone', foreignAid:'plustwo', tax:'tax', steal:'steal', assassinate:'assassinate', exchange:'exchange', coup:'coup', bureaucratTax:'bureaucrattax', speculatorGamble:'speculatorgamble', invoice:'invoice', taxAssignment:'taxAssignment', inquireExchange:'inquireexchange', inquireInspect:'inquireinspect', jesterDisorder:'jesterDisorder', socialistShare:'socialistshare' };
    const mk = (txt, action, cls = '', hint = '') => {
        const actionLocked = !isTurn || (mustCoup && action !== 'coup');
        const disabled     = actionLocked ? 'is-action-disabled' : '';
        const finalHint    = mustCoup && action !== 'coup' ? 'عندك 10+ فلوس، لازم Coup' : hint;
        const bgFile       = _actionBgMap[action];
        const bgStyle      = bgFile ? ` style="--action-img:url('${_coupImgBase}${bgFile}.webp')" data-has-bg="1"` : '';
        return `<button class="coup-action-btn ${cls} ${disabled}" data-action="${action}"${bgStyle} aria-disabled="${actionLocked ? 'true' : 'false'}"><strong>${txt}<span class="coup-action-info" data-action-info="${action}">ℹ️</span></strong><small>${finalHint}</small></button>`;
    };
    const dyn      = _coupGetDynamic(state);
    const dukeCard = coupCards[dyn.dukeRole] || coupCards.duke;
    const ambCard  = coupCards[dyn.ambRole]  || coupCards.ambassador;
    // Duke-family action
    let dukeBtn = '';
    if (dyn.dukeRole === 'duke') {
        dukeBtn = mk(`${_coupCardLabelHtml(dukeCard)} +3`, 'tax', 'primary-action', 'قول عندي الشلغمي');
    } else if (dyn.dukeRole === 'bureaucrat') {
        dukeBtn = mk(`${_coupCardLabelHtml(dukeCard)} +2`, 'bureaucratTax', 'primary-action', 'خذ 3، اعطي 1 للهدف');
    } else {
        const gain = Math.min((me?.coins || 0), 5);
        dukeBtn = mk(`${_coupCardLabelHtml(dukeCard)}: قامبل`, 'speculatorGamble', 'primary-action', `تضاعف فلوسك (${gain})`);
    }
    // Ambassador-family action(s)
    let ambBtns = '';
    if (dyn.ambRole === 'ambassador') {
        ambBtns = mk(`${_coupCardLabelHtml(ambCard)}: بدّل`, 'exchange', '', 'بدّل كوارطك مع الدكّة');
    } else if (dyn.ambRole === 'inquisitor') {
        ambBtns = mk(`${_coupCardLabelHtml(ambCard)}: بدّل`, 'inquireExchange', '', 'بدّل كارطة مع الدكة') +
                  mk(`${_coupCardLabelHtml(ambCard)}: فحص`, 'inquireInspect', '', 'فحص كارطة لاعب');
    } else if (dyn.ambRole === 'jester') {
        ambBtns = mk(`${_coupCardLabelHtml(ambCard)}: فوضى`, 'jesterDisorder', 'primary-action', 'اختلط كوارط لاعب');
    } else {
        ambBtns = mk(`${_coupCardLabelHtml(ambCard)}: وزّع`, 'socialistShare', 'primary-action', 'خذ من الكل');
    }
    panel.innerHTML += `<div class="coup-action-grid ${isTurn ? '' : 'is-disabled'}">
        ${mk('🪙 شهرية +1','income','','مضمون وما يتكذبش')}
        ${mk('🤲 اعانة +2','foreignAid','','ينجم يتسكر')}
        ${dukeBtn}
        ${mk(`${_coupCardLabelHtml(coupCards.captain)}: اسرق`,'steal','primary-action','اسرق زوز فلوس')}
        ${mk(`${_coupCardLabelHtml(coupCards.assassin)} -3`,'assassinate','danger-action','يلزم حفار القبور')}
        ${ambBtns}
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
    const actor = coupState.players[coupState.turnIndex];
    const needsTarget = ['assassinate', 'coup', 'steal', 'invoice', 'bureaucratTax', 'inquireInspect', 'jesterDisorder'].includes(action);
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
    const titles  = { steal:'اختار شكون تسرق', assassinate:'اختار شكون تضرب', coup:'اختار الهدف', bureaucratTax:'اختار شكون يخذ +1', inquireInspect:'اختار شكون تفحص كارطتو', jesterDisorder:'اختار شكون تعمل فيه فوضى' };
    const hints   = { steal:'الرايس يسرق حتى زوز فلوس من لاعب.', assassinate:'حفار القبور يحتاج هدف واضح.', coup:'Coup ضربة مباشرة وما تتسكرش.', bureaucratTax:'الشيخ يعطي +1 لأي لاعب تختاره.', inquireInspect:'البحاث يشوف كارطة لاعب ويحتمل يجبره يبدّلها.', jesterDisorder:'العمدة يخذ كارطة عشوائية من الهدف.' };
    _showCoupModal(
        titles[action] || 'اختار هدف',
        `<p>${_escHtml(hints[action] || '')}</p><div class="coup-target-grid">${targets.map(p => `<button class="coup-target-btn" data-target-id="${p.id}">${_escHtml(p.name)}</button>`).join('')}</div>`,
        overlay => {
            overlay.querySelectorAll('[data-target-id]').forEach(btn => btn.addEventListener('click', () => {
                _closeCoupModal();
                coupStartPending(action, btn.dataset.targetId);
            }));
        }
    );
}

function coupStartPending(action, targetId) {
    const actor      = coupState.players[coupState.turnIndex];
    const claim      = _coupActionClaim(action);
    const blockRoles = _coupActionBlockRoles(action);
    const blockable  = blockRoles.length > 0;
    
    // Check for Customs Officer tax
    if (coupState.taxAssignment && claim) {
        const officer = coupState.players.find(p => p.id === coupState.taxAssignment.officerId);
        const officerAlive = officer && officer.hand.some(c => !c.lost);
        if (officerAlive && claim === coupState.taxAssignment.taxedRole) {
            if (actor.coins < 1) {
                coupState.log = `${actor.name} ما يقدرش يدعي ${coupCards[claim]?.name || claim} عشان لازم يدفع ضريبة 1 فلوس لسي فلان وما عندوش.`;
                _showCoupEvent(coupState.log, 'bad');
                return;
            }
            actor.coins -= 1;
            officer.coins += 1;
            coupState.log = `${actor.name} دفع 1 فلوس ضريبة لسي فلان (${officer.name}) باش يدعي ${coupCards[claim]?.name || claim}.`;
            _showCoupEvent(coupState.log, 'notice');
        }
    }
    
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
        // Rulebook: "If an action is successfully challenged the entire action fails,
        // and any coins paid as the cost of the action are returned to the player."
        if (p.action === 'assassinate') {
            actor.coins += 3;
            _coupTakeFromBank(coupState, 3);
        }
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
    // ── Expansion: Bureaucrat ────────────────────────────────────
    if (action === 'bureaucratTax' && target) {
        actor.coins += 2; _coupTakeFromBank(coupState, 3); target.coins += 1;
        coupState.log = `${actor.name} كول بالشيخ: خذا 3 وعطى 1 لـ${target.name}. البنك نقص 3.`;
    }
    // ── Expansion: Speculator ────────────────────────────────────
    if (action === 'speculatorGamble') {
        const gain = Math.min(actor.coins, 5);
        actor.coins += gain; _coupTakeFromBank(coupState, gain);
        coupState.log = gain > 0 ? `${actor.name} قامبل بـ${gain} فلوس وكسب نفسهم من البنك!` : `${actor.name} حاول يقامبل أما فلوسو صفر.`;
    }
    // ── Standard exchange ────────────────────────────────────────
    if (action === 'exchange') {
        coupState.log = `${actor.name} يشوف زوز كوارط من الدكّة ويختار شنوّة يخلي.`;
        _showCoupEvent(coupState.log, 'notice');
        return coupStartExchangeChoice(actor, () => {
            coupState.log = `${actor.name} بدّل كوارطو مع الدكّة. السمسار خدم خدمتو.`;
            _showCoupEvent(coupState.log, 'good');
            _coupNextTurn(); renderCoupScreen();
        }, 2);
    }
    // ── Expansion: Inquisitor exchange (1 drawn) ─────────────────
    if (action === 'inquireExchange') {
        coupState.log = `${actor.name} يشوف كارطة من الدكة ويختار شنوة يبدّل.`;
        _showCoupEvent(coupState.log, 'notice');
        return coupStartExchangeChoice(actor, () => {
            coupState.log = `${actor.name} بدّل كارطة مع الدكة. البحاث خدم خدمتو.`;
            _showCoupEvent(coupState.log, 'good');
            _coupNextTurn(); renderCoupScreen();
        }, 1);
    }
    // ── Expansion: Inquisitor inspect ────────────────────────────
    if (action === 'inquireInspect' && target) {
        return coupStartInquisitorInspect(actor, target, () => { _coupNextTurn(); renderCoupScreen(); });
    }
    // ── Expansion: Jester disorder ───────────────────────────────
    if (action === 'jesterDisorder' && target) {
        return coupStartJesterDisorder(actor, target, () => { _coupNextTurn(); renderCoupScreen(); });
    }
    // ── Expansion: Socialist share ───────────────────────────────
    if (action === 'socialistShare') {
        return coupStartSocialistShare(actor, () => { _coupNextTurn(); renderCoupScreen(); });
    }
    if (action === 'steal' && target) {
        const amount = Math.min(2, target.coins || 0);
        target.coins -= amount; actor.coins += amount;
        coupState.log = amount > 0 ? `${actor.name} سرق ${amount} فلوس من ${target.name}. الرايس دخل للمرسى.` : `${actor.name} حاول يسرق ${target.name} أما ما لقى شي.`;
    }
    // ── Expansion: Lawyer invoice ───────────────────────────────────
    if (action === 'invoice' && target) {
        const amount = Math.min(2, target.coins || 0);
        target.coins -= amount; actor.coins += amount;
        coupState.log = amount > 0 ? `${actor.name} بعث فاتورة لـ${target.name} وخذا ${amount} فلوس. الكبران أخد حقو.` : `${actor.name} بعث فاتورة لـ${target.name} أما ما عندوش فلوس.`;
    }
    // ── Expansion: Customs Officer tax assignment ────────────────────
    if (action === 'taxAssignment') {
        coupState.log = `${actor.name} فرض ضريبة على دور. سي فلان يراقب.`;
        _showCoupEvent(coupState.log, 'notice');
        return coupStartTaxAssignmentChoice(actor, () => {
            coupState.log = `${actor.name} فرض ضريبة. سي فلان ياخو 1 فلوس من كل حد يدعي الدور المضروب.`;
            _showCoupEvent(coupState.log, 'good');
            _coupNextTurn(); renderCoupScreen();
        });
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
    
    // Check if Customs Officer is eliminated - clear tax
    if (coupState.taxAssignment && coupState.taxAssignment.officerId === playerId) {
        coupState.taxAssignment = null;
        coupState.log = `سي فلان (${player.name}) خرج. الضريبة تلغيت.`;
        _showCoupEvent(coupState.log, 'notice');
    }
    
    // Trigger Lawyer Estate Claim if player is eliminated with coins AND lawyer is in this game's role pool
    if (liveCards.length === 1) {
        const card    = liveCards[0]; card.lost = true;
        const cardMeta = coupCards[card.type] || coupCards.duke;
        const out      = !player.hand.some(c => !c.lost);
        _showCoupLossAnimation(player.name, cardMeta, out, card.type);
        
        if (out && (player.coins || 0) > 0 && (coupState.rolesInPlay || []).includes('lawyer')) {
            const lockedCoins = player.coins;
            player.coins = 0; // lock now so they can't be spent before claim resolves
            setTimeout(() => coupStartEstateClaimChoice(player, lockedCoins, onDone), 500);
            return;
        }
        
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
            _showCoupLossAnimation(player.name, cardMeta, out, btn.dataset.loseType);
            
            if (out && (player.coins || 0) > 0 && (coupState.rolesInPlay || []).includes('lawyer')) {
                const lockedCoins = player.coins;
                player.coins = 0;
                setTimeout(() => coupStartEstateClaimChoice(player, lockedCoins, onDone), 500);
                return;
            }
            
            onDone?.();
        }));
    });
}

function coupStartEstateClaimChoice(eliminatedPlayer, coinsToClaim, onDone) {
    const alivePlayers = _coupAlive().filter(p => p.id !== eliminatedPlayer.id);
    const claimButtons = alivePlayers.map(p => 
        `<button class="coup-target-btn" data-estate-claim="${p.id}">${_escHtml(p.name)}: أنا الكبران، أطالب بالميراث</button>`
    ).join('');
    const skipButton = `<button class="coup-target-btn quiet-action" data-estate-skip="1">ما حد يطالب بالميراث</button>`;
    
    _showCoupModal('الكبران: ميراث',
        `<p><strong>${_escHtml(eliminatedPlayer.name)}</strong> خرج وعندو <strong>${coinsToClaim} فلوس</strong>. أي لاعب ينجم يدعي الكبران ويطالب بالميراث — ياخذ الفلوس ويخسر كارطة. اللاعبين الآخرين ينجموا يكذّبوه.</p>
         <div class="coup-target-grid">${claimButtons}${skipButton}</div>`,
        overlay => {
            overlay.querySelectorAll('[data-estate-claim]').forEach(btn => btn.addEventListener('click', () => {
                _closeCoupModal();
                const claimantId = btn.dataset.estateClaim;
                const claimant = coupState.players.find(p => p.id === claimantId);
                if (!claimant) { onDone?.(); return; }
                
                coupState.pending = {
                    id: `estate_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    type: 'estateClaim',
                    action: 'estateClaim',
                    actorId: claimantId,
                    claimantId,
                    eliminatedId: eliminatedPlayer.id,
                    coinsToClaim,
                    claim: 'lawyer',
                    blockable: false,
                    blockRoles: [],
                    passes: []
                };
                _coupSetResponseDeadline(coupState.pending);
                renderCoupEstateClaimPanel(eliminatedPlayer, coinsToClaim, onDone);
            }));
            overlay.querySelector('[data-estate-skip]')?.addEventListener('click', () => {
                _closeCoupModal();
                coupState.log = `${eliminatedPlayer.name} خرج وفلوسو ضاعت.`;
                _showCoupEvent(coupState.log, 'notice');
                onDone?.();
            });
        }
    );
}

function renderCoupEstateClaimPanel(eliminatedPlayer, coinsToClaim, onDone) {
    renderCoupScreen();
    const p = coupState.pending;
    const claimant = coupState.players.find(x => x.id === p.claimantId);
    const challengers = _coupAlive().filter(x => x.id !== claimant.id);
    const challengeButtons = challengers.map(c => 
        `<button class="coup-target-btn danger-action" data-estate-challenge="${c.id}">${_escHtml(c.name)}: تكذب!</button>`
    ).join('');
    const passButtons = challengers.filter(c => !(p.passes || []).includes(c.id))
        .map(c => `<button class="coup-target-btn quiet-action" data-estate-pass="${c.id}">${_escHtml(c.name)}: ما عندي حتى اعتراض</button>`).join('');
    const passCount = (p.passes || []).length;
    
    _showCoupModal('الكبران: طالب بالميراث',
        `<p><strong>${_escHtml(claimant.name)}</strong> يدعي الكبران ويطالب بميراث <strong>${_escHtml(eliminatedPlayer.name)}</strong> (${coinsToClaim} فلوس). أي لاعب ينجم يقوللو تكذب!</p>
         ${_coupPendingTimerHtml(p)}
         <div class="coup-pass-progress">${passCount}/${challengers.length} قالو ما عندهم حتى اعتراض</div>
         <div class="coup-target-grid">${challengeButtons}${passButtons}</div>`,
        overlay => {
            overlay.querySelectorAll('[data-estate-challenge]').forEach(btn => btn.addEventListener('click', () => {
                _closeCoupModal();
                coupEstateChallenge(btn.dataset.estateChallenge, eliminatedPlayer, coinsToClaim, onDone);
            }));
            overlay.querySelectorAll('[data-estate-pass]').forEach(btn => btn.addEventListener('click', () => {
                _closeCoupModal();
                coupEstatePass(btn.dataset.estatePass, eliminatedPlayer, coinsToClaim, onDone);
            }));
        }
    );
}

function coupEstateChallenge(challengerId, eliminatedPlayer, coinsToClaim, onDone) {
    const p = coupState.pending;
    const claimant = coupState.players.find(x => x.id === p.claimantId);
    const challenger = coupState.players.find(x => x.id === challengerId);
    
    const hasLawyer = claimant.hand.some(c => !c.lost && c.type === 'lawyer');
    
    if (hasLawyer) {
        // Prove the Lawyer (shuffle it back, draw new card), challenger loses influence
        _coupProveAndReplace(claimant, 'lawyer');
        coupState.log = `${challenger.name} كذّب الكبران وطلع غلط! ${claimant.name} ورّى الكارتة.`;
        _showCoupNotLyingAnimation(claimant.name, 'lawyer');
        _showCoupEvent(coupState.log, 'bad');
        coupLoseInfluence(challengerId, () => {
            // After challenger loses, claimant takes coins and loses a card (the cost)
            claimant.coins += coinsToClaim;
            coupState.log = `${claimant.name} أخد ${coinsToClaim} فلوس من ${eliminatedPlayer.name} بالميراث. يخسر كارطة.`;
            _showCoupEvent(coupState.log, 'good');
            coupState.pending = null;
            coupLoseInfluence(p.claimantId, () => { onDone?.(); }, 'الكبران يأخذ الميراث لكن يخسر كارطة. اختار كارطة تخسرها.');
        }, 'كذّبت الكبران غلط. اختار كارطة تخسرها.');
    } else {
        // Claimant was bluffing — loses influence, coins are gone (already zeroed)
        coupState.log = `${claimant.name} ادعى الكبران وما عندوش! ${challenger.name} كشف الكذبة.`;
        _showCoupEvent(coupState.log, 'bad');
        coupState.pending = null;
        coupLoseInfluence(p.claimantId, () => {
            coupState.log = `${eliminatedPlayer.name} خرج وفلوسو ضاعت.`;
            _showCoupEvent(coupState.log, 'notice');
            onDone?.();
        }, 'ادعيت الكبران وما عندكش. اختار كارطة تخسرها.');
    }
}

function coupEstatePass(playerId, eliminatedPlayer, coinsToClaim, onDone) {
    const p = coupState.pending;
    if (!p) return;
    const claimantId = p.claimantId;
    if (playerId === claimantId) return;
    p.passes = Array.from(new Set([...(p.passes || []), playerId]));
    
    const challengers = _coupAlive().filter(x => x.id !== claimantId);
    const allPassed = challengers.length > 0 && challengers.every(c => p.passes.includes(c.id));
    
    if (allPassed) {
        _closeCoupModal();
        const claimant = coupState.players.find(x => x.id === claimantId);
        // Prove-and-replace if they actually hold the Lawyer
        if (claimant.hand.some(c => !c.lost && c.type === 'lawyer')) {
            _coupProveAndReplace(claimant, 'lawyer');
        }
        claimant.coins += coinsToClaim;
        coupState.log = `${claimant.name} أخد ${coinsToClaim} فلوس من ${eliminatedPlayer.name} بالميراث. يخسر كارطة.`;
        _showCoupEvent(coupState.log, 'good');
        coupState.pending = null;
        coupLoseInfluence(claimantId, () => { onDone?.(); }, 'الكبران يأخذ الميراث لكن يخسر كارطة. اختار كارطة تخسرها.');
    } else {
        renderCoupEstateClaimPanel(eliminatedPlayer, coinsToClaim, onDone);
    }
}

function coupStartExchangeChoice(actor, onDone, drawCount = 2) {
    const drawn = [];
    for (let i = 0; i < drawCount; i++) { const c = coupState.deck.pop(); if (c) drawn.push(c); }
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

// ── Expansion offline resolvers ───────────────────────────────

function coupStartInquisitorInspect(inspector, target, onDone) {
    const liveCards = target.hand.filter(c => !c.lost);
    if (!liveCards.length) { onDone?.(); return; }
    // Pass-and-play: target chooses which card to reveal to inspector
    _showCoupModal(
        `${_escHtml(target.name)}: اختار كارطة تريّح للبحاث`,
        `<p class="coup-card-desc">مرّر التلفون لـ<strong>${_escHtml(target.name)}</strong>. هو يختار كارطة يريّحها، البحاث وحدو يشوفها.</p>
         <div class="coup-target-grid">${liveCards.map((c, i) => { const meta = coupCards[c.type] || coupCards.duke; return `<button class="coup-target-btn" data-inq-reveal="${i}">${_coupCardLabelHtml(meta)}</button>`; }).join('')}</div>`,
        overlay => {
            overlay.querySelectorAll('[data-inq-reveal]').forEach(btn => btn.addEventListener('click', () => {
                _closeCoupModal();
                const revIdx = parseInt(btn.dataset.inqReveal, 10);
                const revCard = liveCards[revIdx];
                const meta    = coupCards[revCard.type] || coupCards.duke;
                _showCoupModal(
                    `${_escHtml(inspector.name)}: كارطة ${_escHtml(target.name)}`,
                    `<p>مرّر التلفون لـ<strong>${_escHtml(inspector.name)}</strong>.</p>
                     <div style="text-align:center; margin:16px 0;">${_coupCardLargeHtml(meta)}<br><strong>${_escHtml(meta.name)}</strong></div>
                     <p class="coup-card-desc">شنوة تعمل؟</p>
                     <div class="coup-target-grid">
                         <button class="primary-btn" id="inq-force">↩️ خلّيه يبدّلها</button>
                         <button class="coup-target-btn quiet-action" id="inq-skip">ما نعملش شي</button>
                     </div>`,
                    innerOverlay => {
                        innerOverlay.querySelector('#inq-force')?.addEventListener('click', () => {
                            _closeCoupModal();
                            // Force exchange: put target's revealed card back in deck, draw replacement
                            const handCard = target.hand.find(c => !c.lost && c.type === revCard.type);
                            if (handCard) {
                                coupState.deck.unshift(handCard.type);
                                coupState.deck.sort(() => 0.5 - Math.random());
                                handCard.type = coupState.deck.pop() || handCard.type;
                            }
                            coupState.log = `${inspector.name} خلّى ${target.name} يبدّل ${_escHtml(meta.name)}.`;
                            _showCoupEvent(coupState.log, 'notice');
                            onDone?.();
                        });
                        innerOverlay.querySelector('#inq-skip')?.addEventListener('click', () => {
                            _closeCoupModal();
                            coupState.log = `${inspector.name} شاف كارطة ${target.name} وما عملش شي.`;
                            _showCoupEvent(coupState.log, 'notice');
                            onDone?.();
                        });
                    }
                );
            }));
        }
    );
}

function coupStartJesterDisorder(actor, target, onDone) {
    const drawn = coupState.deck.pop();
    if (!drawn) { onDone?.(); return; }
    const targetLive = target.hand.map((c, i) => ({ ...c, handIdx: i })).filter(c => !c.lost);
    if (!targetLive.length) { coupState.deck.push(drawn); onDone?.(); return; }
    const takenSlot  = targetLive[Math.floor(Math.random() * targetLive.length)];
    const takenType  = takenSlot.type;
    // Temporarily remove the taken card from target
    target.hand[takenSlot.handIdx].lost = true;
    const drawnMeta = coupCards[drawn]     || coupCards.duke;
    const takenMeta = coupCards[takenType] || coupCards.duke;
    _showCoupModal('العمدة: فوضى 🃏',
        `<p>جبت <strong>${_escHtml(drawnMeta.name)}</strong> من الدكة وخذيت <strong>${_escHtml(takenMeta.name)}</strong> عشوائي من ${_escHtml(target.name)}.</p>
         <p class="coup-card-desc">اختار <strong>واحدة</strong> تبقى معاك وتبدّل بكارطة من كوارطك:</p>
         <div class="coup-target-grid">
             <button class="coup-target-btn" data-jester-keep="0">${_coupCardLabelHtml(drawnMeta)}<small>من الدكة</small></button>
             <button class="coup-target-btn" data-jester-keep="1">${_coupCardLabelHtml(takenMeta)}<small>من ${_escHtml(target.name)}</small></button>
         </div>`,
        overlay => {
            overlay.querySelectorAll('[data-jester-keep]').forEach(btn => btn.addEventListener('click', () => {
                _closeCoupModal();
                const keepIdx   = parseInt(btn.dataset.jesterKeep, 10);
                const temps     = [{ type: drawn, src: 'deck' }, { type: takenType, src: 'target' }];
                const keptType  = temps[keepIdx].type;
                const otherType = temps[1 - keepIdx].type;
                const otherSrc  = temps[1 - keepIdx].src;
                const actorLive = actor.hand.filter(c => !c.lost);
                const doSwap = (replaceHandIdx) => {
                    const oldType = actor.hand[replaceHandIdx].type;
                    actor.hand[replaceHandIdx].type = keptType;
                    if (otherSrc === 'target') {
                        // Other (taken) goes back to target; actor's old card goes to deck
                        target.hand[takenSlot.handIdx] = { type: otherType, lost: false };
                        coupState.deck.unshift(oldType);
                    } else {
                        // Other (drawn) goes to deck; actor's old card goes to target
                        coupState.deck.unshift(otherType);
                        target.hand[takenSlot.handIdx] = { type: oldType, lost: false };
                    }
                    coupState.deck.sort(() => 0.5 - Math.random());
                    coupState.log = `${actor.name} عمل فوضى مع ${target.name}. الكوارط اختلطت!`;
                    _showCoupEvent(coupState.log, 'notice');
                    onDone?.();
                };
                if (actorLive.length === 1) {
                    doSwap(actor.hand.findIndex(c => !c.lost));
                } else {
                    _showCoupModal('اختار كارطة تبدّلها',
                        `<p>اختار من كوارطك الكارطة الي تبدّلها بـ${_escHtml(coupCards[keptType]?.name || keptType)}:</p>
                         <div class="coup-target-grid">${actorLive.map(c => { const m = coupCards[c.type] || coupCards.duke; const hi = actor.hand.indexOf(c); return `<button class="coup-target-btn" data-swap-idx="${hi}">${_coupCardLabelHtml(m)}</button>`; }).join('')}</div>`,
                        swapOverlay => {
                            swapOverlay.querySelectorAll('[data-swap-idx]').forEach(sb => sb.addEventListener('click', () => {
                                _closeCoupModal();
                                doSwap(parseInt(sb.dataset.swapIdx, 10));
                            }));
                        }
                    );
                }
            }));
        }
    );
}

function coupStartSocialistShare(actor, onDone) {
    const opponents = _coupAlive().filter(p => p.id !== actor.id);
    const collected = []; // { fromId, type: 'coin' | cardType, handRef? }
    let opIdx = 0;
    const processNext = () => {
        if (opIdx >= opponents.length) return coupResolveSocialistShare(actor, collected, onDone);
        const opp = opponents[opIdx++];
        const hasCoins = opp.coins > 0;
        const liveCards = opp.hand.filter(c => !c.lost);
        if (!hasCoins && !liveCards.length) return processNext();
        const coinBtn = hasCoins
            ? `<button class="coup-target-btn" data-share-take="coin" data-share-from="${opp.id}">🪙 خذ فلوس من ${_escHtml(opp.name)}</button>`
            : '';
        const cardBtns = liveCards.map(c => {
            const meta = coupCards[c.type] || coupCards.duke;
            return `<button class="coup-target-btn danger-action" data-share-take="${c.type}" data-share-from="${opp.id}">${_coupCardLabelHtml(meta)}<small>كارطة مجهولة</small></button>`;
        }).join('');
        _showCoupModal(`المدير: شنوة تاخو من ${_escHtml(opp.name)}؟`,
            `<div class="coup-target-grid">${coinBtn}${cardBtns}<button class="coup-target-btn quiet-action" data-share-skip="${opp.id}">ما تاخوش</button></div>`,
            overlay => {
                overlay.querySelectorAll('[data-share-take]').forEach(btn => btn.addEventListener('click', () => {
                    _closeCoupModal();
                    const takeType = btn.dataset.shareTake;
                    const opp2 = coupState.players.find(p => p.id === btn.dataset.shareFrom);
                    if (!opp2) return processNext();
                    if (takeType === 'coin') {
                        opp2.coins -= 1; actor.coins += 1;
                        collected.push({ fromId: opp2.id, type: 'coin' });
                    } else {
                        const handCard = opp2.hand.find(c => !c.lost && c.type === takeType);
                        if (handCard) { handCard.lost = true; collected.push({ fromId: opp2.id, type: takeType, handRef: handCard }); }
                    }
                    processNext();
                }));
                overlay.querySelector('[data-share-skip]')?.addEventListener('click', () => { _closeCoupModal(); processNext(); });
            }
        );
    };
    processNext();
}

function coupResolveSocialistShare(actor, collected, onDone) {
    const cards = collected.filter(c => c.type !== 'coin');
    if (cards.length === 0) {
        // Only coins taken — no card redistribution needed
        coupState.log = `${actor.name} جمع فلوس من اللاعبين بالمدير.`;
        _showCoupEvent(coupState.log, 'good');
        onDone?.(); return;
    }

    // Actor must add one of their own live cards to the pool
    const actorLive = actor.hand.map((c, i) => ({ c, i })).filter(x => !x.c.lost);
    const ownCardBtns = actorLive.map(({ c, i }) => {
        const meta = coupCards[c.type] || coupCards.duke;
        return `<button class="coup-target-btn danger-action" data-own-idx="${i}">${_coupCardLabelHtml(meta)}</button>`;
    }).join('');

    _showCoupModal('المدير: أضف كارطة من عندك للحوض',
        `<p>خذيت ${cards.length} كارطة. لازم تضيف واحدة من عندك للحوض، بعدها تختار واحدة تبقى معاك.</p>
         <div class="coup-target-grid">${ownCardBtns}</div>`,
        overlay => {
            overlay.querySelectorAll('[data-own-idx]').forEach(btn => btn.addEventListener('click', () => {
                _closeCoupModal();
                const ownIdx = parseInt(btn.dataset.ownIdx, 10);
                const actorContribCard = actor.hand[ownIdx];
                const actorContribType = actorContribCard?.type;
                // Mark contributed card as lost temporarily
                if (actorContribCard) actorContribCard.lost = true;

                // Build the anonymous pool: opponent cards + actor's contributed card, shuffled
                const pool = [
                    ...cards.map(c => ({ type: c.type, isActorOwn: false, handRef: c.handRef })),
                    { type: actorContribType, isActorOwn: true, handRef: actorContribCard }
                ].sort(() => 0.5 - Math.random());

                const keepBtns = pool.map((pc, idx) => {
                    const meta = coupCards[pc.type] || coupCards.duke;
                    return `<button class="coup-target-btn" data-soc-keep="${idx}">${_coupCardLabelHtml(meta)}</button>`;
                }).join('');

                _showCoupModal('المدير: اختار كارطة تبقى معاك',
                    `<p>الحوض فيه ${pool.length} كوارط مخلوطة. اختار <strong>واحدة</strong> تبقى معاك، والباقي يرجعو عشوائياً.</p>
                     <div class="coup-target-grid">${keepBtns}</div>`,
                    overlay2 => {
                        overlay2.querySelectorAll('[data-soc-keep]').forEach(keepBtn => keepBtn.addEventListener('click', () => {
                            _closeCoupModal();
                            const keepIdx = parseInt(keepBtn.dataset.socKeep, 10);
                            const kept = pool[keepIdx];

                            // Resolve keep: restore or add card to actor
                            if (kept.isActorOwn && actorContribCard) {
                                actorContribCard.lost = false; // kept own card — restore in place
                            } else {
                                actor.hand.push({ type: kept.type, lost: false }); // kept opponent's card
                            }

                            // Return remaining cards to opponent slots, shuffled
                            // Slots to fill: all handRefs from cards (opponent lost slots)
                            const lostSlots = [];
                            const returnTypes = [];
                            let keptOppUsed = false;
                            cards.forEach(c => {
                                if (!kept.isActorOwn && !keptOppUsed && c.type === kept.type && c.handRef === kept.handRef) {
                                    keptOppUsed = true;
                                    // This opponent slot gets actor's contributed type
                                    if (actorContribType) { lostSlots.push(c.handRef); returnTypes.push(actorContribType); }
                                } else {
                                    lostSlots.push(c.handRef);
                                    returnTypes.push(c.type);
                                }
                            });
                            // Shuffle types before assigning to break ownership tracking
                            returnTypes.sort(() => 0.5 - Math.random());
                            lostSlots.sort(() => 0.5 - Math.random());
                            returnTypes.forEach((type, i) => {
                                if (lostSlots[i]) { lostSlots[i].type = type; lostSlots[i].lost = false; }
                            });

                            coupState.log = `${actor.name} وزّع الكوارط بالمدير. بقى بواحدة واختار اللي يناسبو.`;
                            _showCoupEvent(coupState.log, 'good');
                            onDone?.();
                        }));
                    }
                );
            }));
        }
    );
}

function coupStartTaxAssignmentChoice(actor, onDone) {
    const rolesInPlay = coupState.rolesInPlay || ['assassin', 'captain', 'contessa', 'duke', 'ambassador'];
    const roleButtons = rolesInPlay.map(role => {
        const meta = coupCards[role] || coupCards.duke;
        return `<button class="coup-target-btn" data-tax-role="${role}">${_coupCardLabelHtml(meta)}</button>`;
    }).join('');
    _showCoupModal('سي فلان: اختار دور تفرض عليه ضريبة',
        `<p>اختار دور من الأدوار الموجودة في اللعبة. أي حد يدعي الدور يدفع 1 فلوس ليك.</p>
         <div class="coup-target-grid">${roleButtons}</div>`,
        overlay => {
            overlay.querySelectorAll('[data-tax-role]').forEach(btn => btn.addEventListener('click', () => {
                _closeCoupModal();
                const taxedRole = btn.dataset.taxRole;
                coupState.taxAssignment = { taxedRole, officerId: actor.id };
                coupState.log = `${actor.name} فرض ضريبة على ${coupCards[taxedRole]?.name || taxedRole}.`;
                _showCoupEvent(coupState.log, 'good');
                onDone?.();
            }));
        }
    );
}

// ─────────────────────────────────────────────────────────────
// Guide system
// ─────────────────────────────────────────────────────────────

function _coupGuideCards() {
    // Show the 5 roles currently in play (or default if no game running)
    const roles = coupState?.rolesInPlay || ['duke','assassin','contessa','captain','ambassador'];
    return roles;
}

const _coupGuideSectionsBase = [
    { key:'goal',  title:'الهدف',            icon:'🎯', body:'آخر لاعب يبقى عندو كوارط حيّة يربح. كي تخسر زوز كوارطك تخرج من الطرح وتتفرج.', tips:['كل لاعب يبدأ بزوز كوارط مخبيين وزوز فلوس.', 'الكوارط الي تخسرها تتكشف للناس الكل.'] },
    { key:'turn',  title:'دورتك',            icon:'🎲', body:'في دورتك تختار أكشن واحدة: شهرية، اعانة، Coup، ولا claim بكارتة. تنجم تكذب، أما أي لاعب ينجم يقولك تكذب.', tips:['الشهرية +1 ما يتسكرش وما يتكذّبش.', 'اعانة +2 تتسكر بالكارطة الدكية.', 'كان عندك 10 فلوس ولا أكثر لازم تعمل Coup.'] },
    { key:'cards', title:'الكوارط',          icon:'🂠', cards: null /* filled dynamically */ },
    { key:'bluff', title:'التكذيب والبلوك', icon:'🔥', body:'أي claim بكارتة ينجم يتكذّب. كان صاحب الclaim عندو الكارتة، يوريها، يرجّعها للدكّة ويجبد وحدة جديدة، والمتّهم يخسر كارتة. كان ما عندوش، هو يخسر كارتة.', tips:['بعد claim صحيح متاع حفار القبور ولا الرايس، البلوك مازال ينجم يصير.', 'كان البلوك تتبلعيط، يتكذّب زادة: الغالط هو الي يخسر كارتة.'] },
    { key:'money', title:'الفلوس',           icon:'🪙', body:'الفلوس هي السلاح. دخّل فلوس، استعملها للاغتيال، ولا خلّيها للCoup كي تحب تضرب ضربة ما تتسكرش.', tips:['الاغتيال يكلّف 3 فلوس.', 'Coup يكلّف 7 فلوس وما فيه لا بلوك لا تكذيب.', 'الرايس يسرق حتى زوز فلوس من لاعب.'] },
];

function _getCoupGuideSections() {
    return _coupGuideSectionsBase.map(s => s.key === 'cards' ? { ...s, cards: _coupGuideCards() } : s);
}

// Backward compat alias
const coupGuideSections = _coupGuideSectionsBase;

function renderCoupGuide(activeKey = 'goal') {
    const tabs    = document.getElementById('coup-guide-tabs');
    const content = document.getElementById('coup-guide-content');
    if (!tabs || !content) return;
    const sections = _getCoupGuideSections();
    const active = sections.find(s => s.key === activeKey) || sections[0];
    tabs.innerHTML = sections.map(section =>
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
    const rolesInPlay = _coupSelectRoles();
    const deck        = _coupBuildDeck(rolesInPlay);
    const players     = playerNames.map((name, i) => ({
        id:    `offline_${i}`,
        name,
        coins: 2,
        hand:  [{ type: deck.pop(), lost: false }, { type: deck.pop(), lost: false }],
    }));
    coupState = {
        players,
        deck,
        rolesInPlay,
        bankCoins:     50 - players.length * 2,
        turnIndex:     0,
        pending:       null,
        log:           '',
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
    selectRoles:        _coupSelectRoles,
    getDynamic:         _coupGetDynamic,
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
