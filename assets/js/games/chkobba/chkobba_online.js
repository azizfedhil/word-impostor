'use strict';

// ============================================================
// CHKOBBA — Online game logic
// All Chkobba-specific networking, state, rendering, drag/drop,
// animation, tournament and AI extracted from online.js (Phase 3).
//
// SHARED SCOPE: Same global scope as online.js.  Reads/writes:
//   _room, _myId, _isHost, _channel (online.js state)
//   _supa, _syncedNow, _esc (online.js helpers)
//   ChkobbaLogic (chkobba/logic.js)
//   showScreen, showToast, _sfx (platform)
// ============================================================

let _chkobbaDragData = null;
let _chkobbaPointerDrag = null;
let _chkobbaTableListenersBound = false;
let _chkobbaCapturePileBound = false;
let _lastChkobbaAnnounced = null;
let _chkobbaPlaySession = null;
let _chkobbaLastSnapshot = null;
let _chkobbaExpandedInfoPill = null;
let _chkobbaSkipDealAnim = false;
let _chkobbaOpponentPillEls = new Map();
let _chkobbaScoreboardDismissedRound = -1;

// ─────────────────────────────────────────────────────────────────────────────
// ChkobbaAnimator — strict action → animation → commit pipeline
//
// Design rules:
//
//   1. Server state is NEVER blocked.
//      notifyRoom() always stores the latest snapshot. If the animator is idle
//      it renders immediately. If a ghost flight is running it waits; the
//      moment the flight ends and the commit resolves the server will push a
//      fresh state, triggering notifyRoom() → instant clean render.
//
//   2. Real card DOM nodes are NEVER hidden before their ghost starts flying.
//      Instead the card IDs are added to _inFlightIds. The renderer checks
//      this set and keeps those specific nodes at opacity:0/pointer-events:none
//      only for the duration of the flight. Once the commit resolves and the
//      server removes the card from state, the re-render naturally cleans them.
//
//   3. User input is locked only while our own ghost animation is running.
//      Opponent renders, turn-indicator updates, etc. all go through unblocked.
//
//   4. There is no _chkobbaPendingRoom queue. Only the single latest snapshot
//      is kept. Stale intermediate states are discarded automatically.
//
// Public API:
//   ChkobbaAnimator.notifyRoom(room)   — called by _showOnlineChkobba
//   ChkobbaAnimator.schedule(opts)     — called by commit functions
//   ChkobbaAnimator.isBusy()           — true while ghost is airborne
//   ChkobbaAnimator.isInputLocked()    — true while our own move is in-flight
//   ChkobbaAnimator.getInFlightIds()   — Set<string> of card IDs mid-air
// ─────────────────────────────────────────────────────────────────────────────
const ChkobbaAnimator = (() => {
    let _busy        = false;       // ghost animation is currently running
    let _latestRoom  = null;        // most recent room snapshot from server
    let _inputLocked = false;       // prevents double-submitting our own move
    const _inFlightIds = new Set(); // card IDs whose ghosts are mid-air
    const _persistentGhosts = new Set(); // ghosts that stay until room update
    let _busySince   = 0;           // timestamp (ms) when _busy last became true

    // Hard cap on how long we stay in _busy=true.
    // Background tabs throttle/freeze setTimeout & transitionend, so without this
    // a disconnected player's animation can lock the UI permanently.
    const BUSY_TIMEOUT_MS = 1500;

    /** Force-unlock and render the latest snapshot. */
    function _forceUnlock(reason) {
        if (!_busy) return;
        console.warn('[ChkobbaAnimator] force-unlock:', reason);
        _busy        = false;
        _inputLocked = false;
    }

    /** Always store latest room; render immediately only when idle. */
    function notifyRoom(room) {
        _latestRoom = room;
        // Watchdog: if we have been busy longer than BUSY_TIMEOUT_MS the animation
        // is stuck (tab was backgrounded, transitionend never fired, etc.).
        if (_busy && (Date.now() - _busySince) > BUSY_TIMEOUT_MS) {
            _forceUnlock('busy watchdog on notifyRoom');
        }
        if (!_busy) _flush();
    }

    /** Apply the stored latest room to the actual renderer. */
    function _flush() {
        _inFlightIds.clear();
        _persistentGhosts.forEach(el => el.remove());
        _persistentGhosts.clear();
        if (_latestRoom) _renderChkobbaMain(_latestRoom);
    }

    /**
     * Schedule a ghost-card animation sequence followed by a state commit.
     *
     * opts = {
     *   flights:   Array of flight descriptors (same shape as _animateChkobbaFlight,
     *              minus onDone — do NOT pass onDone here).
     *   cardIds:   string[] — IDs of cards that are "in flight" and should be
     *              kept invisible in the real DOM while the ghost is airborne.
     *   onCommit:  async () => void — the actual Supabase state mutation.
     *              Called AFTER the last ghost has landed.
     * }
     *
     * Calling schedule() while busy is a safety no-op that commits directly
     * (should not happen in normal gameplay).
     */
    function schedule({ flights, cardIds, onCommit }) {
        if (_busy) {
            // Guard: already animating. Skip visual, commit directly.
            onCommit().catch(console.error);
            return;
        }

        _busy        = true;
        _busySince   = Date.now();
        _inputLocked = true;
        cardIds?.forEach(id => _inFlightIds.add(id));

        // Trigger immediate re-render so the 'real' cards whose IDs we just added
        // to _inFlightIds are hidden BEFORE the ghost animation begins.
        if (_latestRoom) _renderChkobbaMain(_latestRoom);

        // Reduced-motion or no flights → skip animation, commit immediately.
        if (_prefersReducedMotion() || !flights?.length) {
            _busy        = false;
            _inputLocked = false;
            _inFlightIds.clear();
            onCommit().catch(console.error);
            return;
        }

        // Hard watchdog: even if transitionend never fires (background tab, etc.)
        // unlock after the animation duration ceiling + generous buffer.
        const totalDuration = flights.reduce((sum, f) => sum + (f.duration || 220) + (f.staggerAfter || 0), 0);
        const watchdogMs = totalDuration + 800;
        const watchdog = setTimeout(() => {
            if (_busy) {
                _forceUnlock('per-schedule watchdog');
                _inFlightIds.clear();
                // Don't call onCommit here — the timer tick will re-trigger
                // _chkobbaTimeout on the next server push.
                if (_latestRoom) _flush();
            }
        }, watchdogMs);

        _animateChkobbaFlightsSequential(flights, async () => {
            clearTimeout(watchdog);
            // Ghost(s) have landed. Unlock, commit, wait for server push.
            _busy        = false;
            _inputLocked = false;
            // _inFlightIds is cleared by _flush(), which fires when the server
            // pushes back the new room state in response to the commit.
            try {
                await onCommit();
            } catch(e) {
                console.error('[ChkobbaAnimator] commit error:', e);
                _inFlightIds.clear(); // safety: don't leave cards invisible forever
            }
            // Fallback: if no server push arrives within 700 ms (e.g. slow network),
            // flush the cached snapshot so the UI never gets permanently stuck.
            setTimeout(() => { if (!_busy && _latestRoom) _flush(); }, 700);
        });
    }

    function isBusy()        { return _busy; }
    function isInputLocked() { return _inputLocked; }
    function getInFlightIds() { return _inFlightIds; }
    function getPersistentGhosts() { return _persistentGhosts; }

    return { notifyRoom, schedule, isBusy, isInputLocked, getInFlightIds, getPersistentGhosts };
})();

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
    document.querySelectorAll('.chkobba-card.is-armed, .chkobba-card.is-selected').forEach(el => {
        el.classList.remove('is-armed', 'is-selected', 'is-invalid');
    });
    // Clear any in-flight card IDs so the next render restores their visibility.
    // (The animator tracks which cards are mid-ghost; clearing on session reset
    //  handles the case where a play was interrupted before commit.)
    ChkobbaAnimator.getInFlightIds().clear();
    document.getElementById('chkobba-table')?.classList.remove('is-drop-target');
    document.getElementById('chkobba-my-capture-pile')?.classList.remove('is-drop-target');
    document.getElementById('chkobba-capture-ready-bar')?.remove();
}

function _setupChkobbaMenuButtons() {
    const menuBtn = document.getElementById('chkobba-menu-btn');
    const menuDropdown = document.getElementById('chkobba-menu-dropdown');
    const voiceToggleBtn = document.getElementById('chkobba-voice-toggle-btn');
    const backToMainBtn = document.getElementById('chkobba-back-to-main-btn');
    const leaveBtn = document.getElementById('chkobba-leave-btn');
    const reconnectBtn = document.getElementById('chkobba-reconnect-btn');

    if (!menuBtn || !menuDropdown) return;

    // Guard: only bind once — cloning+rebinding every render causes memory leaks
    // and makes the button feel sticky on first tap (two listeners fighting).
    if (menuBtn.dataset.chkobbaMenuBound === '1') return;

    // Remove existing listeners to avoid duplicates
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
    newMenuBtn.dataset.chkobbaMenuBound = '1';

    // Menu button toggle
    newMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuDropdown.contains(e.target) && !newMenuBtn.contains(e.target)) {
            menuDropdown.classList.add('hidden');
        }
    });

    // Voice toggle button in dropdown
    if (voiceToggleBtn) {
        voiceToggleBtn.addEventListener('click', () => {
            menuDropdown.classList.add('hidden');
            if (_voiceOn) {
                stopVoice();
                voiceToggleBtn.textContent = '🎙️ تفعيل المايكروفون';
            } else {
                if (_room && _room.code) {
                    initVoice(_room.code);
                    voiceToggleBtn.textContent = '🔊 إيقاف المايكروفون';
                } else {
                    showToast('ما ينجمش تفعيل الصوت في هاد اللعبة');
                }
            }
        });

        // Update voice button state based on current voice status
        if (_voiceOn) {
            voiceToggleBtn.textContent = '🔊 إيقاف المايكروفون';
        }
    }

    // Back to main menu
    if (backToMainBtn) {
        backToMainBtn.addEventListener('click', () => {
            menuDropdown.classList.add('hidden');
            if (confirm('متأكد تبي ترجع للقائمة الرئيسية؟')) {
                _leaveRoom();
                showScreen('mode-select-screen');
            }
        });
    }

    // Leave room
    if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
            menuDropdown.classList.add('hidden');
            if (confirm('متأكد تبي تخرج من الغرفة؟')) {
                _leaveRoom();
                showScreen('online-setup-screen');
            }
        });
    }

    // Reconnect
    if (reconnectBtn) {
        reconnectBtn.addEventListener('click', () => {
            menuDropdown.classList.add('hidden');
            showToast('جاري إعادة الاتصال...');
            _subscribe(_room.code);
        });
    }
}

function _hideChkobbaCaptureReadyBar() {
    // Removed - no longer showing capture confirmation prompt
}

function _showChkobbaCaptureReadyBar() {
    // Removed - auto-confirm capture without prompt
    _commitChkobbaCapture();
}

function _prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function _tableCardRotation(index, cardId) {
    const hash = (cardId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rot = ((index * 17 + hash) % 11) - 5;
    // Add small random offsets for a more "piled" organic look
    const offsetX = ((hash * 7) % 15) - 7;
    const offsetY = ((hash * 13) % 15) - 7;
    return { rot, offsetX, offsetY };
}

function _handCardTilt(index, total) {
    const mid = (total - 1) / 2;
    return (index - mid) * 4.5;
}

/** GPU-friendly card flight; calls onDone when finished (or immediately if reduced motion). */
function _animateChkobbaFlight({ fromRect, toRect, imgSrc, imgSrcBack, duration = 220, rotate = 6, withGhost = false, persistAtEnd = false, onDone }) {
    if (_prefersReducedMotion() || !fromRect || !toRect) {
        onDone?.();
        return;
    }
    const layer = document.getElementById('chkobba-deal-layer');
    if (!layer) { onDone?.(); return; }

    const flyer = document.createElement('div');
    flyer.className = 'chkobba-flight-card';

    // Match flyer dimensions to the source rect so cards don't "pop" in size
    flyer.style.width = `${fromRect.width}px`;
    flyer.style.height = `${fromRect.height}px`;

    // Subtract the layer's own origin so coords are relative to the layer,
    // not the viewport. This fixes positioning when an ancestor has a CSS
    // transform (e.g. a centered desktop container) that breaks position:fixed.
    const layerRect = layer.getBoundingClientRect();
    const ox = layerRect.left;
    const oy = layerRect.top;

    const fx = fromRect.left + fromRect.width / 2 - ox;
    const fy = fromRect.top + fromRect.height / 2 - oy;
    const tx = toRect.left + toRect.width / 2 - ox;
    const ty = toRect.top + toRect.height / 2 - oy;

    // Set start transform — NO transition yet so browser paints it before animating
    flyer.style.cssText = `
        transform: translate3d(${fx}px, ${fy}px, 0) rotate(${rotate}deg) translate(-50%, -50%);
        opacity: 0;
        transition: none;
    `;

    const img = document.createElement('img');
    img.src = imgSrc;
    img.draggable = false;
    flyer.appendChild(img);
    layer.appendChild(flyer);

    // done-guard: prevents finish() being called twice
    let _done = false;
    const finish = () => {
        if (_done) return;
        _done = true;
        flyer.remove();
        ghost?.remove();
        onDone?.();
    };

    // Optional ghost trail — simpler: just a fading copy that fades out mid-flight
    let ghost;
    if (withGhost) {
        ghost = document.createElement('div');
        ghost.className = 'chkobba-ghost-trail';
        ghost.style.cssText = `
            transform: translate3d(${fx}px, ${fy}px, 0) rotate(${rotate}deg) translate(-50%, -50%);
            opacity: 0;
            transition: none;
        `;
        const gImg = document.createElement('img');
        gImg.src = imgSrc;
        gImg.draggable = false;
        ghost.appendChild(gImg);
        layer.appendChild(ghost);
    }

    // Two-rAF pattern: first rAF paints start state, second rAF starts transition
    // This reliably prevents Safari/Chrome from skipping the start frame.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const endTransform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rotate * 0.2}deg) translate(-50%, -50%)`;

            // Enhanced physics: use a slight back-out overshoot and lift the card via scale
            flyer.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 60ms ease-out`;
            flyer.style.opacity = '1';
            flyer.style.transform = endTransform;
            // Add flight class for CSS scale/shadow enhancement (see chkobba.css)
            flyer.classList.add('is-in-flight');

            // If a back-image is supplied, flip from back→face at the midpoint of the flight
            // This makes captures look like the card is physically scooped and flipped over
            if (imgSrcBack) {
                img.src = imgSrcBack; // start face-down
                setTimeout(() => {
                    // Quick horizontal scale-to-0 then back, swapping image at midpoint
                    img.style.transition = `transform ${duration * 0.18}ms ease-in`;
                    img.style.transform = 'scaleX(0)';
                    setTimeout(() => {
                        img.src = imgSrc; // reveal face
                        img.style.transition = `transform ${duration * 0.18}ms ease-out`;
                        img.style.transform = 'scaleX(1)';
                    }, duration * 0.18);
                }, duration * 0.38);
            }

            if (ghost) {
                // Ghost starts with same position, fades out at 40% of flight
                ghost.style.transition = `transform ${duration * 0.9}ms cubic-bezier(0.22, 0.9, 0.3, 1), opacity ${duration * 0.4}ms ease-in`;
                ghost.style.opacity = '0.4';
                ghost.style.transform = endTransform;
                setTimeout(() => { if (ghost.parentNode) ghost.style.opacity = '0'; }, duration * 0.3);
            }

            // Listen only to transform end on the flyer — once:true prevents leaks
            flyer.addEventListener('transitionend', (e) => {
                if (e.propertyName === 'transform') finish();
            }, { once: true });

            // Safety fallback — fires slightly after expected end
            setTimeout(finish, duration + 60);
        });
    });
}

function _animateChkobbaFlightsSequential(flights, onDone) {
    if (!flights.length || _prefersReducedMotion()) {
        onDone?.();
        return;
    }
    const total = flights.length;
    let started = 0;
    let finished = 0;
    // allStarted ensures we never call onDone before the last stagger fires
    // (fixes premature completion when a fast early flight finishes before the
    // final stagger delay elapses).
    let allStarted = false;

    const maybeFinish = () => {
        finished++;
        if (allStarted && finished >= total) onDone?.();
    };

    const startNext = () => {
        if (started >= total) {
            allStarted = true;
            if (finished >= total) onDone?.();
            return;
        }
        const { staggerAfter, ...flightOpts } = flights[started++];
        _animateChkobbaFlight({ ...flightOpts, onDone: maybeFinish });

        if (started < total) {
            setTimeout(startNext, staggerAfter || 0);
        } else {
            allStarted = true;
            if (finished >= total) onDone?.();
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
        const { rot, offsetX, offsetY } = _tableCardRotation(index, card.id);
        div.style.setProperty('--rot', `${rot}deg`);
        div.style.setProperty('--offset-x', `${offsetX}px`);
        div.style.setProperty('--offset-y', `${offsetY}px`);
        // NOTE: click handling for table cards is done via event delegation
        // on the table container in _ensureChkobbaTableListeners.
        // Per-card listeners are intentionally omitted to allow DOM node reuse.
    } else {
        const tilt = _handCardTilt(index, total);
        div.style.setProperty('--tilt', `${tilt}deg`);
        div.style.setProperty('--stack-offset', `${tilt * 0.45}px`);
        div.style.setProperty('--hand-z', String(10 + index));
        if (index > 0) div.style.setProperty('--stack-overlap', '20');
        // Always attach interactive listeners on hand cards.
        // Actual interactivity is gated at runtime via _getChkobbaPlayContext().
        // This ensures reused DOM nodes from a previous non-interactive render
        // gain full interactivity as soon as it becomes the player's turn,
        // without needing to recreate DOM elements.
        {
            if (interactive) {
                div.draggable = true;
                div.addEventListener('dragstart', _onChkobbaDragStart);
                div.addEventListener('dragend', _onChkobbaDragEnd);
                _bindChkobbaPointerDrag(div);
            }

            // Phase 6 – arm immediately on first tap (no deferred timer).
            // Double-tap within 320 ms commits the play.
            // Index and card are read fresh from dataset/state at event time so
            // reused DOM nodes always act on their current position in hand.
            let lastTap = 0;
            let doubleTapGuard = null;
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                if (ChkobbaAnimator.isInputLocked()) return;
                const ctx = _getChkobbaPlayContext();
                if (!ctx) return;
                const idx = parseInt(div.dataset.index, 10);
                const c = ctx.me.hand[idx];
                if (!c) return;
                const now = Date.now();
                if (now - lastTap < 320) {
                    // Double-tap → play immediately
                    clearTimeout(doubleTapGuard);
                    doubleTapGuard = null;
                    lastTap = 0;
                    _playCardToTable(div, c, idx);
                } else {
                    lastTap = now;
                    // Arm instantly — no 180 ms delay
                    _armChkobbaHandCard(div);
                    clearTimeout(doubleTapGuard);
                    doubleTapGuard = setTimeout(() => { doubleTapGuard = null; }, 320);
                }
            });

            div.addEventListener('pointerdown', () => div.classList.add('is-lifted'));
            div.addEventListener('pointerup',   () => div.classList.remove('is-lifted'));
            div.addEventListener('pointercancel',() => div.classList.remove('is-lifted'));
            div.addEventListener('pointerleave', () => div.classList.remove('is-lifted'));
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

function _playCardToTable(cardEl, card, index) {
    if (ChkobbaAnimator.isInputLocked()) return;
    const ctx = _getChkobbaPlayContext();
    if (!ctx) return;

    const logic = ctx.logic;
    const state = ctx.state;

    _resetChkobbaPlaySession();

    const captures = logic.getValidCaptures(card, state.table);

    if (captures.length > 0) {
        // Must capture — auto-pick the first valid set.
        // If there is only one option, commit immediately.
        // If multiple options exist, arm the card so the player can choose.
        if (captures.length === 1) {
            _chkobbaPlaySession = {
                phase: 'readyCapture',
                handIndex: index,
                playedCard: card,
                captureSet: captures[0],
                selectedTableIds: new Set(captures[0].map(c => c.id))
            };
            _commitChkobbaCapture();
        } else {
            // Multiple capture options — arm so player can pick table cards
            _chkobbaPlaySession = {
                phase: 'selecting',
                handIndex: index,
                playedCard: card,
                selectedTableIds: new Set()
            };
            cardEl.classList.add('is-armed');
            _refreshChkobbaCaptureHighlights();
        }
    } else {
        // No capture possible, play to table
        _chkobbaPlaySession = {
            phase: 'armed',
            handIndex: index,
            playedCard: card,
            selectedTableIds: new Set()
        };
        _commitChkobbaPlayToTableSkipCaptureCheck();
    }
}

async function _commitChkobbaPlayToTableSkipCaptureCheck() {
    if (ChkobbaAnimator.isInputLocked()) return;
    const ctx = _getChkobbaPlayContext();
    if (!ctx || !_chkobbaPlaySession) return;

    const handIndex  = _chkobbaPlaySession.handIndex;
    const playedCard = _chkobbaPlaySession.playedCard;

    const handEl  = _chkobbaHandCardEl(handIndex);
    const tableEl = document.getElementById('chkobba-table');
    const imgSrc  = ctx.logic.getCardAsset(playedCard);

    // Dynamic landing detection: create a probe to find the card's future spot
    let toRect = null;
    if (tableEl) {
        const probe = document.createElement('div');
        probe.className = 'chkobba-card table-card';
        probe.style.visibility = 'hidden';
        tableEl.appendChild(probe);
        toRect = probe.getBoundingClientRect();
        probe.remove();
    }

    // Measure fromRect BEFORE any DOM changes (the card is still fully visible)
    const fromRect = handEl?.getBoundingClientRect();

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

    ChkobbaAnimator.schedule({
        flights: (fromRect && (toRect || tableRect)) ? [{
            fromRect,
            toRect: toRect || tableEl.getBoundingClientRect(),
            imgSrc,
            duration: 240,
            rotate: -5,
            withGhost: false,
            persistAtEnd: true
        }] : [],
        cardIds: [playedCard.id],
        onCommit: runMutate
    });
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
        el.classList.remove('is-selected', 'is-invalid');
        const id = el.dataset.cardId;
        if (selectedTableIds.has(id)) el.classList.add('is-selected');
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

    // Phase 2 – delegated click handler covers both table-card taps and
    // "play to empty table" clicks.  The canInteract flag is stored as a
    // data attribute on the container so it stays current across renders
    // without recreating card DOM nodes.
    tableCont.addEventListener('click', (e) => {
        const tableCard = e.target.closest('.table-card');
        if (tableCard && tableCont.dataset.canInteract === 'true' && _chkobbaPlaySession) {
            e.stopPropagation();
            _onChkobbaTableCardTap(tableCard);
            return;
        }
        if (_chkobbaPlaySession?.phase === 'armed' && !tableCard) {
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
            // Always re-arm to the card being dragged.
            // Without this, if card A was tapped first (session = card A) and the
            // player then drags card B, the session stays on card A and the wrong
            // card gets played on drop.
            _armChkobbaHandCard(cardEl);
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
    // Lobby rendering is handled by the platform coordinator (online.js)
    // Chkobba-specific lobby settings are injected via _renderChkobbaLobbySettings
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

// NOTE: _handleStateChange is exported by online.js; _syncedNow by room.js.
// Do not re-export here — those files load after this one.

/**
 * CHKOBBA MULTIPLAYER
 */

function _renderChkobbaLobbySettings(anchorBtn, room) {
    const cfg = room.config || {};
    const mode = cfg.chkobbaMode || '1v1';
    const target = cfg.chkobbaTarget || 21;
    const tournament = !!cfg.chkobbaTournament;
    const versusAI = !!cfg.versusAI;
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

            <div class="toggle-row" style="margin-top:16px;">
                <span class="toggle-label">🏆 نظام تورنوا</span>
                <div class="toggle-switch ${tournament?'active':''}" id="chk-tournament-tog">
                    <div class="toggle-thumb"></div>
                </div>
            </div>

            <div class="toggle-row" style="border-bottom:none;">
                <span class="toggle-label">🤖 اللعب ضد الذكاء الاصطناعي</span>
                <div class="toggle-switch ${versusAI?'active':''}" id="chk-ai-tog">
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

    wrap.querySelector('#chk-ai-tog').onclick = () => {
        updateConfig({ versusAI: !versusAI });
    };
}

const _TUNISIAN_NAMES = ["حمادي", "فوزية", "بلقاسم", "منجي", "نجاة", "مبروكة", "الصادق", "بشيرة", "عياشي", "زهيرة", "فرحات", "لطيفة", "توفيق", "منيرة", "الشاذلي", "عزيزة"];
function _getRandomTunisianName() { return _TUNISIAN_NAMES[Math.floor(Math.random() * _TUNISIAN_NAMES.length)]; }

async function _startOnlineChkobbaGame() {
    if (!_isHost || !_room) return;
    const cfg = _room.config || {};

    // Delegate to tournament flow if enabled
    if (cfg.chkobbaTournament) {
        return _startTournament(_room);
    }

    let allP = [...(_room.players || [])];
    const mode = cfg.chkobbaMode || '1v1';
    const turnTime = cfg.chkobbaTurnTime || 45;

    // Validate player count for mode
    const needed = mode === '1v1' ? 2 : mode === '1v1v1' ? 3 : 4;
    if (allP.length < needed && !cfg.chkobbaTournament && !cfg.versusAI) {
        showToast(`يلزم ${needed} لاعبين للمود هذا.`);
        return;
    }

    if (cfg.versusAI && allP.length < needed) {
        const usedNames = new Set(allP.map(p => p.name));
        while (allP.length < needed) {
            let name = _getRandomTunisianName();
            while (usedNames.has(name)) name = _getRandomTunisianName();
            usedNames.add(name);
            allP.push({ id: 'ai_' + Math.random().toString(36).substr(2, 9), name, isAI: true });
        }
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
            isAI: !!p.isAI,
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
    const deckEl = document.getElementById('chkobba-deck-pile');
    const capEl = document.getElementById('chkobba-my-capture-pile');
    if (!deckEl || !capEl) return;

    deckEl.style.backgroundImage = "url('cardpile-right.webp')";
    let deckBadge = deckEl.querySelector('.pile-count');
    if (!deckBadge) {
        deckBadge = document.createElement('span');
        deckBadge.className = 'pile-count';
        deckEl.appendChild(deckBadge);
    }
    deckBadge.textContent = state.deck.length;

    const capCount = me?.captured?.length || 0;
    capEl.classList.toggle('has-cards', capCount > 0);
    capEl.style.backgroundImage = "url('cardpile-left.webp')";
    capEl.style.backgroundSize = 'cover';
    let capBadge = capEl.querySelector('.pile-count');
    if (!capBadge) {
        capBadge = document.createElement('span');
        capBadge.className = 'pile-count';
        capEl.appendChild(capBadge);
    }
    capBadge.textContent = capCount;
}

function _renderChkobbaPlayerInfo(state, me, isMyTurn) {
    const infoBox = document.getElementById('chkobba-player-info');
    if (!infoBox || !me) return;

    const capturedCount = me.captured?.length || 0;
    const diamondCount = me.captured?.filter(c => c.suit === 'diamonds').length || 0;
    const chkobbaCount = me.chkobbas || 0;
    const totalScore = me.totalScore ?? 0;

    const details = `
        <div class="chkobba-stat-item">
            <span class="chkobba-stat-value">${capturedCount}🃏</span>
            <span class="chkobba-stat-label">الماكول</span>
        </div>
        <div class="chkobba-stat-separator"></div>
        <div class="chkobba-stat-item">
            <span class="chkobba-stat-value">${diamondCount}♦️</span>
            <span class="chkobba-stat-label">ديناري</span>
        </div>
        <div class="chkobba-stat-separator"></div>
        <div class="chkobba-stat-item">
            <span class="chkobba-stat-value">${chkobbaCount}⭐</span>
            <span class="chkobba-stat-label">شكبة</span>
        </div>
    `;

    infoBox.innerHTML = `
        <div class="chkobba-player-info-content">
            <span class="chkobba-player-name">${me.name}</span>
            <div class="chkobba-player-details">${details}</div>
        </div>
        <div class="chkobba-player-circle ${isMyTurn ? 'is-turn' : ''}">${totalScore}</div>
    `;
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

    // Dynamic landing detection: create a probe to find the card's future spot
    let toRect = null;
    if (tableEl) {
        const probe = document.createElement('div');
        probe.className = 'chkobba-card table-card';
        probe.style.visibility = 'hidden';
        tableEl.appendChild(probe);
        toRect = probe.getBoundingClientRect();
        probe.remove();
    }

    const runMutate = async () => {
        await _mutatePlayers(_room.code, (players, room) => {
            const s = room.word_obj;
            if (!logic.declineStarterCard(s)) return null;
            return players;
        }, null, (room, players) => ({ word_obj: room.word_obj }));
        _chkobbaLastSnapshot = null;
    };

    const fromRect = starterSlot?.getBoundingClientRect();

    ChkobbaAnimator.schedule({
        flights: (fromRect && toRect && cardImg) ? [{
            fromRect,
            toRect,
            imgSrc: cardImg,
            rotate: -8,
            persistAtEnd: false
        }] : [],
        cardIds: state.starterCard ? [state.starterCard.id] : [],
        onCommit: runMutate
    });
}

async function _chkobbaPerformCutAI() {
    if (!_room?.word_obj) return;
    const logic = window.ChkobbaLogic;
    const s = _room.word_obj;
    const cutIndex = 5 + Math.floor(Math.random() * Math.max(1, s.deck.length - 10));
    await _mutatePlayers(_room.code, (players, room) => {
        if (!logic.performDeckCut(room.word_obj, cutIndex)) return null;
        return players;
    }, null, (room) => ({ word_obj: room.word_obj }));
}

async function _chkobbaAcceptStarterAI() {
    if (!_room?.word_obj) return;
    const logic = window.ChkobbaLogic;
    await _mutatePlayers(_room.code, (players, room) => {
        if (!logic.acceptStarterCard(room.word_obj)) return null;
        return players;
    }, null, (room) => ({ word_obj: room.word_obj }));
}

async function _chkobbaDeclineStarterAI() {
    if (!_room?.word_obj) return;
    const logic = window.ChkobbaLogic;
    await _mutatePlayers(_room.code, (players, room) => {
        if (!logic.declineStarterCard(room.word_obj)) return null;
        return players;
    }, null, (room) => ({ word_obj: room.word_obj }));
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

function _maybeShowChkobbaAnnouncement(state, duringDeal) {
    if (!state?.chkobbaEvent) return;
    const key = `${state.chkobbaEvent.playerId}-${state.round}-${state.chkobbaEvent.type}-${state.chkobbaEvent.seq ?? 0}`;
    if (_lastChkobbaAnnounced === key) return;
    _lastChkobbaAnnounced = key;
    // Wait for any in-flight ghost animations (or a deal) to settle before
    // showing the celebration overlay, so it doesn't pop over a flying card.
    if (ChkobbaAnimator.isBusy() || duringDeal) {
        setTimeout(() => _handleChkobbaBroadcastEvent(state.chkobbaEvent), 250);
    } else {
        _handleChkobbaBroadcastEvent(state.chkobbaEvent);
    }
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

    // Brief deck pulse
    deckEl.classList.add('is-dealing');
    setTimeout(() => deckEl.classList.remove('is-dealing'), 400);

    const from = deckEl.getBoundingClientRect();
    const back = window.ChkobbaLogic.ASSETS.BACK;
    let finished = 0;

    // Pre-populate the hand with invisible face-down placeholder slots.
    // Each slot becomes the ghost's landing target AND flips face-up when the
    // ghost arrives, so there's never a flash of empty space or sudden appearance.
    const placeholders = [];
    for (let i = 0; i < count; i++) {
        const ph = document.createElement('div');
        ph.className = 'chkobba-card hand-card chkobba-deal-placeholder';
        // Mirror the tilt CSS vars so placeholders sit in their real fan position
        const fakeTilt = _handCardTilt(i, count);
        ph.style.setProperty('--tilt', `${fakeTilt}deg`);
        ph.style.setProperty('--stack-offset', `${fakeTilt * 0.45}px`);
        ph.style.setProperty('--hand-z', String(10 + i));
        if (i > 0) ph.style.setProperty('--stack-overlap', '20');
        ph.style.opacity = '0'; // invisible until the ghost arrives
        const phImg = document.createElement('img');
        phImg.src = back;
        phImg.alt = '';
        ph.appendChild(phImg);
        handEl.appendChild(ph);
        placeholders.push(ph);
    }

    // Phase 4 – target feel: 350–500ms travel, ease-out, slight stagger between cards.
    // Tight stagger — entire sequence ≤ 600ms even for 4+ cards.
    const staggerMs = count > 2 ? 55 : 70;

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            // Measure placeholder position now (it's already in the DOM at its fan slot)
            const ph = placeholders[i];
            const to = ph.getBoundingClientRect();
            const targetRect = {
                left: to.left,
                top: to.top,
                width: to.width || from.width,
                height: to.height || from.height
            };

            _animateChkobbaFlight({
                fromRect: from,
                toRect: targetRect,
                imgSrc: back,
                rotate: (Math.random() - 0.5) * 8,
                duration: 220,
                onDone: () => {
                    // Ghost landed — flip the placeholder face-down → visible
                    // The actual face image is set by renderHand() after all arrive,
                    // but for now show the card back so there's no blank frame.
                    ph.style.transition = 'opacity 80ms ease-out';
                    ph.style.opacity = '1';
                    ph.classList.add('chkobba-deal-arrived');
                    finished++;
                    if (finished >= count) {
                        // All cards arrived — remove placeholders and run the real render
                        // with a tiny delay so the last card's fade-in finishes first
                        setTimeout(() => {
                            placeholders.forEach(p => p.remove());
                            onDone?.();
                        }, 60);
                    }
                }
            });
        }, i * staggerMs);
    }
}

/**
 * Render an overlay scoreboard (round_score or finished phase).
 */
function _renderChkobbaScoreboard(state, isFinal, onContinue) {
    document.getElementById('chkobba-scoreboard-overlay')?.remove();

    const scores = state.roundScores || {};
    const winner = isFinal
        ? state.players.reduce((best, p) => (!best || p.totalScore > best.totalScore ? p : best), null)
        : null;

    const overlay = document.createElement('div');
    overlay.id = 'chkobba-scoreboard-overlay';
    overlay.style.cssText = `
        position:fixed;inset:0;z-index:9999;
        display:flex;align-items:center;justify-content:center;
        background:rgba(0,0,0,0.78);backdrop-filter:blur(6px);
        font-family:var(--font-arabic,sans-serif);direction:rtl;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
        background:rgba(255,255,255,0.15);
        backdrop-filter:blur(20px) saturate(180%);
        -webkit-backdrop-filter:blur(20px) saturate(180%);
        border:1px solid rgba(255,255,255,0.25);
        border-radius:20px;padding:28px 24px 20px;
        min-width:min(90vw,380px);max-width:92vw;
        box-shadow:0 8px 40px rgba(0,0,0,0.4),0 0 24px rgba(255,255,255,0.08);
        color:#fff;text-align:center;
    `;

    const titleIcon = isFinal ? '🏆' : '📊';
    const titleText = isFinal
        ? `نهاية اللعبة — الفائز: ${_esc(winner?.name || '؟')}`
        : `نهاية الطرح ${state.round || ''}`;

    let rowsHtml = '';
    const sorted = [...state.players].sort((a, b) => b.totalScore - a.totalScore);
    sorted.forEach(p => {
        const rs = scores[p.id];
        const details = rs?.details || {};
        const roundPts = rs?.total ?? 0;
        const isWinnerRow = isFinal && winner && p.id === winner.id;

        const detailItems = [
            details.carti   ? 'الكارطة ✅'            : '',
            details.dinari  ? 'الديناري ✅'           : '',
            details.berria  ? 'السبعة الحية ✅'       : '',
            details.basila  ? 'الباسيلة ✅'           : '',
            details.chkobba ? `شكبّة ×${details.chkobba}` : '',
        ].filter(Boolean).join(' · ') || '—';

        rowsHtml += `
        <div style="
            display:flex;align-items:center;gap:10px;
            padding:10px 12px;margin-bottom:8px;
            background:${isWinnerRow ? 'rgba(241,192,81,0.22)' : 'rgba(255,255,255,0.1)'};
            border-radius:12px;
            border:${isWinnerRow ? '1.5px solid rgba(241,192,81,0.7)' : '1px solid rgba(255,255,255,0.15)'};
        ">
            <div style="font-size:1.5rem;">${isWinnerRow ? '👑' : '🃏'}</div>
            <div style="flex:1;text-align:right;">
                <div style="font-weight:700;font-size:1.05rem;">${_esc(p.name)}</div>
                <div style="font-size:.75rem;opacity:.65;margin-top:2px;">${detailItems}</div>
            </div>
            <div style="text-align:left;min-width:80px;">
                ${rs ? `<div style="font-size:.85rem;opacity:.7;">+${roundPts} نقطة</div>` : ''}
                <div style="font-size:1.15rem;font-weight:800;color:var(--gold,#f1c051);">${p.totalScore} / ${state.targetScore}</div>
            </div>
        </div>`;
    });

    card.innerHTML = `
        <div style="font-size:1.6rem;margin-bottom:4px;">${titleIcon}</div>
        <h2 style="margin:0 0 16px;font-size:1.15rem;color:var(--gold,#f1c051);">${titleText}</h2>
        <div style="margin-bottom:16px;">${rowsHtml}</div>
        ${isFinal
            ? `<button id="chkobba-sb-newgame" style="
                margin-top:4px;padding:12px 32px;border-radius:12px;border:none;cursor:pointer;
                background:var(--gold,#f1c051);color:#1e1e2e;font-weight:800;font-size:1rem;
              ">لعبة جديدة</button>`
            : `<button id="chkobba-sb-continue" style="
                margin-top:4px;padding:12px 32px;border-radius:12px;border:none;cursor:pointer;
                background:var(--gold,#f1c051);color:#1e1e2e;font-weight:800;font-size:1rem;
              ">${_isHost ? 'واصل ▶' : 'فهمت'} </button>`
        }
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    if (isFinal) {
        card.querySelector('#chkobba-sb-newgame')?.addEventListener('click', () => {
            overlay.remove();
            if (typeof _leaveRoom === 'function') _leaveRoom();
            if (typeof showScreen === 'function') showScreen('mode-select-screen');
        });
    } else {
        const btn = card.querySelector('#chkobba-sb-continue');
        if (btn) {
            if (_isHost) {
                btn.addEventListener('click', async () => {
                    btn.disabled = true;
                    btn.textContent = 'جاري التحضير…';
                    overlay.remove();
                    await _chkobbaStartNextRound();
                    onContinue?.();
                });
                // Auto-advance after 15 s
                setTimeout(() => {
                    if (document.body.contains(btn) && !btn.disabled) btn.click();
                }, 15000);
            } else {
                btn.addEventListener('click', () => {
                    overlay.remove();
                    _chkobbaScoreboardDismissedRound = state.round;
                });
            }
        }
    }
}

let _chkobbaLastRenderedState = null;

/**
 * Entry point for all external callers (server updates, online.js, etc.).
 * Delegates to ChkobbaAnimator which decides whether to render now or after
 * the current ghost animation completes.
 */
function _showOnlineChkobba(room) {
    if (!room?.word_obj) return;
    
    // Performance: shallow check to avoid redundant renders if state hasn't changed
    const state = room.word_obj;
    const stateKey = `${state.phase}-${state.turnIndex}-${state.table.length}-${state.players.map(p => p.hand.length).join(',')}-${state.deck.length}`;
    if (_chkobbaLastRenderedState === stateKey && !ChkobbaAnimator.getInFlightIds().size) {
        return;
    }
    _chkobbaLastRenderedState = stateKey;

    ChkobbaAnimator.notifyRoom(room);
}

/**
 * The actual renderer. Called by ChkobbaAnimator._flush() — never directly.
 * Assumes no ghost animation is in flight (ChkobbaAnimator guarantees this).
 */
function _renderChkobbaMain(room) {
    showScreen('chkobba-screen');
    const state = room.word_obj;

    // Sync: Remove scoreboard if we are no longer in a phase that requires it
    if (state && state.phase !== 'round_score' && state.phase !== 'finished') {
        document.getElementById('chkobba-scoreboard-overlay')?.remove();
    }

    // ── TOURNAMENT OVER: show bracket with champion ────────────────────
    if (room.state === 'chkobba_tournament_over' || !state) {
        _showTournamentBracket(room);
        clearInterval(_chkobbaTimer);
        return;
    }

    // ── FINISHED phase: show final scoreboard overlay ──────────────────
    if (state.phase === 'finished') {
        _renderChkobbaOpponentPills(
            room, state,
            state.players.find(p => p.id === _myId),
            state.mode || '1v1',
            (_room?.players || []).reduce((m, p) => { m[p.id] = p; return m; }, {})
        );
        _renderChkobbaScoreboard(state, true, null);
        clearInterval(_chkobbaTimer);
        // If this is a tournament match, the host advances the bracket
        if (_isHost && room.config?.chkobbaTournament) {
            setTimeout(() => _updateChkobbaTournament(room), 800);
        }
        return;
    }

    // ── ROUND_SCORE phase: show round scoreboard overlay ───────────────
    if (state.phase === 'round_score') {
        _renderChkobbaOpponentPills(
            room, state,
            state.players.find(p => p.id === _myId),
            state.mode || '1v1',
            (_room?.players || []).reduce((m, p) => { m[p.id] = p; return m; }, {})
        );
        // Only show one overlay even if _showOnlineChkobba is called multiple times
        // AND only if it hasn't been manually dismissed for this specific round.
        if (!document.getElementById('chkobba-scoreboard-overlay') && _chkobbaScoreboardDismissedRound !== state.round) {
            _renderChkobbaScoreboard(state, false, null);
        }
        clearInterval(_chkobbaTimer);
        return;
    }

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

    _maybeShowChkobbaAnnouncement(state, shouldDealAnim);

    _renderChkobbaOpponentPills(room, state, me, mode, roomPlayerMeta);

    const tableCont = document.getElementById('chkobba-table');
    const handCont = document.getElementById('chkobba-my-hand');

    // Phase 2 – track whether interactivity changed since last render.
    const prevHandInteract = handCont.dataset.canInteract === 'true';
    const handInteractChanged = prevHandInteract !== canInteract;

    // --- BATCHED DOM READS (Pre-pass) ---
    const tableFlipOldRects = new Map();
    const handFlipOldRects = new Map();

    if (!_prefersReducedMotion()) {
        const existingTableEls = tableCont.querySelectorAll('.table-card');
        const newTableIds = new Set(state.table.map(c => c.id));
        existingTableEls.forEach(el => {
            if (newTableIds.has(el.dataset.cardId)) {
                tableFlipOldRects.set(el.dataset.cardId, el.getBoundingClientRect());
            }
        });

        const existingHandEls = handCont.querySelectorAll('.hand-card');
        const newHandIds = me ? new Set(me.hand.map(c => c.id)) : new Set();
        existingHandEls.forEach(el => {
            if (newHandIds.has(el.dataset.cardId)) {
                handFlipOldRects.set(el.dataset.cardId, {
                    rect: el.getBoundingClientRect(),
                    tilt: parseFloat(el.style.getPropertyValue('--tilt')) || 0
                });
            }
            // FREEZE: Disable all transitions immediately to prevent ongoing 
            // movements from skewing our 'new' measurements later.
            el.style.transition = 'none';
        });
    }
    // ------------------------------------

    // DOM WRITE: Interactivity state
    tableCont.dataset.canInteract = String(canInteract);
    handCont.dataset.canInteract = String(canInteract);

    // DOM WRITE: Table Cleanup
    const newTableIds = new Set(state.table.map(c => c.id));
    Array.from(tableCont.querySelectorAll('.table-card')).forEach(el => {
        if (!newTableIds.has(el.dataset.cardId)) el.remove();
    });

    // DOM WRITE: Table Update/Add
    const tableInFlightIds = ChkobbaAnimator.getInFlightIds();
    state.table.forEach((card, idx) => {
        let cardEl = tableCont.querySelector(`.table-card[data-card-id="${card.id}"]`);
        if (!cardEl) {
            cardEl = _renderChkobbaCard(card, { zone: 'table', index: idx, interactive: false });
            tableCont.appendChild(cardEl);
        } else {
            cardEl.dataset.index = String(idx);
            const { rot, offsetX, offsetY } = _tableCardRotation(idx, card.id);
            cardEl.style.setProperty('--rot', `${rot}deg`);
            cardEl.style.setProperty('--offset-x', `${offsetX}px`);
            cardEl.style.setProperty('--offset-y', `${offsetY}px`);
        }

        if (tableInFlightIds.has(card.id)) {
            cardEl.style.opacity = '0';
            cardEl.style.pointerEvents = 'none';
        } else {
            cardEl.style.opacity = '';
            cardEl.style.pointerEvents = '';
        }
    });

    // DOM WRITE: Table Stacking Classes
    const totalTableCards = state.table.length;
    tableCont.classList.remove('is-stacked-30', 'is-stacked-60');
    if (totalTableCards > 6)      tableCont.classList.add('is-stacked-60');
    else if (totalTableCards > 4) tableCont.classList.add('is-stacked-30');

    // Setup menu and voice button event listeners
    _setupChkobbaMenuButtons();

    // Render player info box
    _renderChkobbaPlayerInfo(state, me, isMyTurn);

    const renderHand = () => {
        const total = me ? me.hand.length : 0;
        const existingHandEls = Array.from(handCont.querySelectorAll('.hand-card'));
        const existingHandById = new Map(existingHandEls.map(el => [el.dataset.cardId, el]));
        const newHandIds = me ? new Set(me.hand.map(c => c.id)) : new Set();

        // Remove cards that are no longer in hand
        existingHandEls.forEach(el => {
            if (!newHandIds.has(el.dataset.cardId)) el.remove();
        });

        if (me) {
            const inFlightIds = ChkobbaAnimator.getInFlightIds();
            me.hand.forEach((card, idx) => {
                const tilt = _handCardTilt(idx, total);
                let cardEl = existingHandById.get(card.id);

                if (!cardEl) {
                    cardEl = _renderChkobbaCard(card, { zone: 'hand', index: idx, total, interactive: canInteract });
                    if (shouldDealAnim) {
                        cardEl.style.opacity = '0';
                        cardEl.style.transition = 'opacity 120ms ease-out';
                        handCont.appendChild(cardEl);
                        const delay = idx * 40;
                        setTimeout(() => { cardEl.style.opacity = '1'; }, delay);
                    } else {
                        handCont.appendChild(cardEl);
                    }
                } else {
                    // Reuse element: update data and properties
                    cardEl.dataset.index = String(idx);
                    // Update interactivity if it changed
                    if (handInteractChanged) {
                        // Re-render internally if needed or just update listeners
                        // For now, we assume _renderChkobbaCard set up delegation or we update it.
                        // Actually, hand cards have direct listeners in _renderChkobbaCard.
                        // We must re-setup listeners if interactivity changed.
                        const newEl = _renderChkobbaCard(card, { zone: 'hand', index: idx, total, interactive: canInteract });
                        cardEl.replaceWith(newEl);
                        cardEl = newEl;
                    } else {
                        cardEl.style.setProperty('--tilt', `${tilt}deg`);
                        cardEl.style.setProperty('--stack-offset', `${tilt * 0.45}px`);
                        cardEl.style.setProperty('--hand-z', String(10 + idx));
                        if (idx > 0) cardEl.style.setProperty('--stack-overlap', '20');
                        else         cardEl.style.removeProperty('--stack-overlap');
                        handCont.appendChild(cardEl); 
                    }
                }

                if (!shouldDealAnim || existingHandById.has(card.id)) {
                    if (inFlightIds.has(card.id)) {
                        cardEl.style.opacity = '0';
                        cardEl.style.pointerEvents = 'none';
                    } else {
                        cardEl.style.opacity = '';
                        cardEl.style.pointerEvents = '';
                    }
                }
            });
        }
    };

    _renderChkobbaPiles(state, me);

    if (playLocked) {
        _renderChkobbaInfoPills(state, me);
        _ensureChkobbaTableListeners();
        return;
    }

    // Force a full layout reflow before FLIP measurements if we have old rects
    if (handFlipOldRects.size || tableFlipOldRects.size) {
        void document.body.offsetWidth;
    }

    if (shouldDealAnim) {
        _chkobbaSkipDealAnim = true;
        Array.from(handCont.querySelectorAll('.hand-card')).forEach(el => {
            el.style.transition = 'opacity 60ms ease';
            el.style.opacity = '0';
        });
        setTimeout(() => {
            handCont.innerHTML = '';
            _animateChkobbaDeal(
                document.getElementById('chkobba-deck-pile'),
                handCont,
                dealCount,
                () => {
                    _chkobbaSkipDealAnim = false;
                    renderHand();
                    _applyFlipAnimations(tableFlipOldRects, handFlipOldRects, state, me);
                }
            );
        }, 40);
    } else {
        renderHand();
        _applyFlipAnimations(tableFlipOldRects, handFlipOldRects, state, me);
    }

    _renderChkobbaInfoPills(state, me);
    _ensureChkobbaTableListeners();

    if (_chkobbaPlaySession) {
        const armedIdx = _chkobbaPlaySession.handIndex;
        handCont.querySelectorAll('.hand-card').forEach((el, i) => {
            if (i === armedIdx) el.classList.add('is-armed');
        });
        _refreshChkobbaCaptureHighlights();
        if (_chkobbaPlaySession.phase === 'readyCapture') _showChkobbaCaptureReadyBar();
    }

    // ── Turn indicator pill ─────────────────────────────────────────────
    const indicator = document.getElementById('coup-turn-indicator');
    if (indicator) {
        indicator.classList.remove('hidden');
        const nameEl = document.getElementById('cti-player-name');
        if (nameEl) nameEl.innerText = state.players[state.turnIndex].name;
        _startOnlineChkobbaTimer(room);
    }
}

/**
 * Optimized FLIP animations for both table and hand.
 */
function _applyFlipAnimations(tableRects, handRects, state, me) {
    if (_prefersReducedMotion()) return;

    requestAnimationFrame(() => {
        // Table FLIP
        if (tableRects.size) {
            const tableCont = document.getElementById('chkobba-table');
            state.table.forEach((card) => {
                const oldR = tableRects.get(card.id);
                if (!oldR) return;
                const el = tableCont.querySelector(`.table-card[data-card-id="${card.id}"]`);
                if (!el) return;
                const newR = el.getBoundingClientRect();
                const dx = oldR.left - newR.left;
                const dy = oldR.top - newR.top;
                if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

                // Snap to old position instantly (disable transition)
                el.style.transition = 'none';
                el.style.setProperty('--flip-dx', `${dx}px`);
                el.style.setProperty('--flip-dy', `${dy}px`);
                el.classList.add('is-flip-animating');

                // Force reflow to ensure the snap is applied before we start the glide
                void el.offsetWidth;

                requestAnimationFrame(() => {
                    // Table shifting glide: fast snap
                    el.style.transition = 'transform 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    el.style.setProperty('--flip-dx', '0px');
                    el.style.setProperty('--flip-dy', '0px');
                    el.addEventListener('transitionend', () => {
                        el.classList.remove('is-flip-animating');
                        el.style.transition = '';
                        el.style.removeProperty('--flip-dx');
                        el.style.removeProperty('--flip-dy');
                    }, { once: true });
                });

            });
        }

        // Hand FLIP
        if (handFlipOldRects.size && me) {
            const handCont = document.getElementById('chkobba-my-hand');
            const handCards = me.hand || [];
            handCards.forEach((card, idx) => {
                const oldData = handFlipOldRects.get(card.id);
                if (!oldData) return;
                const el = handCont.querySelector(`.hand-card[data-card-id="${card.id}"]`);
                if (!el) return;
                
                const oldR = oldData.rect;
                const oldTilt = oldData.tilt;
                const newR = el.getBoundingClientRect();
                
                const dx = oldR.left - newR.left;
                const dy = oldR.top - newR.top;
                
                // Get new tilt to calculate the delta
                const newTilt = parseFloat(el.style.getPropertyValue('--tilt')) || 0;
                const dtilt = oldTilt - newTilt;

                if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(dtilt) < 0.1) return;

                // Snap to old position AND old rotation instantly
                el.style.transition = 'none';
                el.style.setProperty('--flip-dx', `${dx}px`);
                el.style.setProperty('--flip-dy', `${dy}px`);
                el.style.setProperty('--tilt-extra', `${dtilt}deg`);
                el.classList.add('is-flip-animating');

                // Force layout reflow
                void el.offsetWidth;

                requestAnimationFrame(() => {
                    // Double-check offsetWidth just to be extra sure the snap is committed
                    void el.offsetWidth;

                    // Intelligent staggering: cards closest to the 'gap' lead.
                    // When a card is played, remaining cards shift to close the gap.
                    // We stagger based on their index relative to the played card's position.
                    let staggerDelay = 0;
                    // No stagger — just animate all cards simultaneously for snappy feel
                    
                    setTimeout(() => {
                        // Hand re-centering: fast and clean
                        el.style.transition = `transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
                        
                        // Glide both position and rotation deltas to 0
                        el.style.setProperty('--flip-dx', '0px');
                        el.style.setProperty('--flip-dy', '0px');
                        el.style.setProperty('--tilt-extra', '0deg');

                        el.addEventListener('transitionend', () => {
                            // Only cleanup if we are still at target (no interrupted moves)
                            if (el.style.getPropertyValue('--flip-dx') === '0px') {
                                el.classList.remove('is-flip-animating');
                                el.style.transition = '';
                                el.style.removeProperty('--flip-dx');
                                el.style.removeProperty('--flip-dy');
                                el.style.removeProperty('--tilt-extra');
                            }
                        }, { once: true });
                    }, staggerDelay);
                });
            });
        }
    });
}

let _chkobbaTimer = null;
let _chkobbaTimingOut = false;
let _chkobbaLastTimedOutTurn = -1; // turnIndex+round key of the last timeout commit
let _chkobbaSetupAIBusy = false;

function _startOnlineChkobbaTimer(room) {
    clearInterval(_chkobbaTimer);
    const timerEl = document.getElementById('chkobba-turn-timer');
    if (!timerEl) return;

    // If the server pushed a fresh timer_end_at that is still in the future,
    // it means another client already handled the previous timeout.
    // Release any stale _chkobbaTimingOut lock so this client can act normally.
    if (_chkobbaTimingOut && room.timer_end_at) {
        const freshEnd = new Date(room.timer_end_at).getTime();
        if (freshEnd > _syncedNow() + 500) {
            _chkobbaTimingOut = false;
        }
    }

    // Reset the per-turn timeout guard when the turn or round changes so the
    // next player's timeout can fire normally.
    const curState = room.word_obj;
    if (curState) {
        const curTurnKey = `${curState.turnIndex}-${curState.round || 0}`;
        if (_chkobbaLastTimedOutTurn !== curTurnKey) {
            _chkobbaLastTimedOutTurn = -1; // allow timeout for this new turn
        }
    }

    // Setup AI must run even when there is no timer (timer_end_at is null during setup phase)
    if (_isHost && !_chkobbaSetupAIBusy) {
        const s = room.word_obj;
        if (s?.phase === 'setup') {
            const cutter = s.players[s.cutterIndex];
            if (cutter?.isAI) {
                if (s.setupPhase === window.ChkobbaLogic.SETUP_PHASES.SHUFFLED) {
                    _chkobbaSetupAIBusy = true;
                    setTimeout(async () => {
                        try { await _chkobbaPerformCutAI(); } finally { _chkobbaSetupAIBusy = false; }
                    }, 800 + Math.random() * 800);
                } else if (s.setupPhase === window.ChkobbaLogic.SETUP_PHASES.REVEALED) {
                    _chkobbaSetupAIBusy = true;
                    setTimeout(async () => {
                        try {
                            if (Math.random() > 0.5) await _chkobbaAcceptStarterAI();
                            else await _chkobbaDeclineStarterAI();
                        } finally { _chkobbaSetupAIBusy = false; }
                    }, 800 + Math.random() * 800);
                }
            }
        }
    }

    if (!room.timer_end_at) {
        timerEl.classList.add('hidden');
        return;
    }

    const isPlaying = room.word_obj?.phase === 'playing';
    timerEl.classList.toggle('hidden', !isPlaying);

    const tick = () => {
        // Always read timer and state from the live _room, not the stale closure.
        // The closure `room` is only used for initial config — after any commit the
        // server pushes a new room which _startOnlineChkobbaTimer closes over; but
        // until that push arrives the interval is still running with the old `room`.
        // Reading _room here ensures the display and guard checks are always current.
        const liveRoom = _room || room;
        const endTime = new Date(liveRoom.timer_end_at).getTime();
        const left = Math.max(0, Math.ceil((endTime - _syncedNow()) / 1000));

        const m = Math.floor(left / 60).toString().padStart(2, '0');
        const sec = (left % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${sec}`;

        if (left <= 10) timerEl.style.color = 'var(--danger-color)';
        else timerEl.style.color = '';

        const s = liveRoom.word_obj;
        if (!s) return;

        const p = s?.players?.[s.turnIndex];
        const isAI = p?.isAI;

        if (!_chkobbaTimingOut && s?.phase === 'playing') {
            if (left <= 0) {
                // Anyone can trigger timeout now (decentralized authoritative timer).
                // We stagger based on role to reduce mutation collisions:
                // 1. Host (0ms)
                // 2. Current player (400ms)
                // 3. Others (800ms + player index * 100ms)
                const myIdx = s.players.findIndex(px => px.id === _myId);
                const isMyTurn = (myIdx === s.turnIndex);
                const stagger = _isHost ? 0 : (isMyTurn ? 400 : 800 + (myIdx >= 0 ? myIdx * 100 : 2000));

                if (stagger === 0) {
                    _chkobbaTimeout();
                } else {
                    setTimeout(() => {
                        if (!_room) return;
                        if (_chkobbaTimingOut) return; // already being handled
                        const reEnd = new Date(_room.timer_end_at).getTime();
                        const reLeft = Math.max(0, Math.ceil((reEnd - _syncedNow()) / 1000));
                        if (reLeft <= 0) _chkobbaTimeout();
                    }, stagger);
                }
            } else if (isAI && _isHost) {
                // AI move: trigger once when the remaining time drops below the
                // threshold. Use a per-turn random offset stored on the room so
                // the same threshold is not re-evaluated every 500ms tick.
                const turnTime = liveRoom.config?.chkobbaTurnTime || 45;
                const aiThresholdKey = `_aiThreshold_${s.turnIndex}_${s.round || 0}`;
                if (!liveRoom[aiThresholdKey]) {
                    liveRoom[aiThresholdKey] = turnTime - 2 - Math.random() * 3;
                }
                if (left <= liveRoom[aiThresholdKey]) {
                    _chkobbaTimeout();
                }
            }
        }
    };

    tick();
    _chkobbaTimer = setInterval(tick, 500);
}

async function _chkobbaTimeout() {
    if (!_room || _chkobbaTimingOut) return;
    const s = _room.word_obj;
    if (!s || s.phase !== 'playing') return;
    // Per-turn guard: don't commit a timeout for the same turn+round twice.
    // This prevents the loop where the interval fires again after _chkobbaTimingOut
    // is released in the finally block but before the server push arrives.
    const turnKey = `${s.turnIndex}-${s.round || 0}`;
    if (_chkobbaLastTimedOutTurn === turnKey) return;
    _chkobbaTimingOut = true;
    _chkobbaLastTimedOutTurn = turnKey;
    // Safety net: if the network call or animation never completes, release the
    // guard after 6 s so the timer loop can retry on the next server push.
    const timingOutGuard = setTimeout(() => {
        if (_chkobbaTimingOut) {
            console.warn('[chkobbaTimeout] safety timeout — releasing _chkobbaTimingOut');
            _chkobbaTimingOut = false;
            // Don't reset _chkobbaLastTimedOutTurn — if we timed out once for this
            // turn, we don't want to commit a second timeout on retry. The server
            // push (or reconnect) will install a new turnIndex which resets it.
        }
    }, 6000);
    try {
        const p = s.players[s.turnIndex];
        if (!p || p.hand.length === 0) return;

        const logic = window.ChkobbaLogic;
        let chosenCardIndex = -1;
        let bestMatch = null;

        // Better AI logic:
        // 1. Can we capture the 7 of diamonds?
        // 2. Can we capture a 7?
        // 3. Can we capture more than one card?
        // 4. Capture highest value card.

        const candidates = [];
        for (let i = 0; i < p.hand.length; i++) {
            const captures = logic.getValidCaptures(p.hand[i], s.table);
            if (captures.length > 0) {
                captures.forEach(match => {
                    let score = match.length; // base score: number of cards captured
                    if (match.some(c => c.id === 'diamonds_7') || p.hand[i].id === 'diamonds_7') score += 10;
                    if (match.some(c => c.value === 7)) score += 5;
                    if (match.some(c => c.suit === 'diamonds')) score += 2;
                    candidates.push({ handIdx: i, match, score });
                });
            }
        }

        if (candidates.length > 0) {
            candidates.sort((a, b) => b.score - a.score);
            chosenCardIndex = candidates[0].handIdx;
            bestMatch = candidates[0].match;
        }

        if (chosenCardIndex === -1) chosenCardIndex = 0;
        const cardToPlay = p.hand[chosenCardIndex];

        const runActualMutate = async () => {
            const bestMatchIds = bestMatch ? bestMatch.map(c => c.id) : null;
            // _chkobbaTimingOut stays true until this mutation resolves so the
            // 500 ms tick loop cannot queue another autoplay while we are still
            // mid-animation or waiting for the Supabase round-trip.
            try {
            await _mutatePlayers(_room.code, (players, room) => {
                const rs = room.word_obj;
                if (rs.phase !== 'playing') return null;

                // Authoritative check: has the timer actually expired?
                // We allow a small 500ms grace period for network jitter.
                const now = _syncedNow();
                const end = new Date(room.timer_end_at || 0).getTime();
                if (now < end - 500) return null; 

                const rp = rs.players[rs.turnIndex];
                if (!rp || rp.hand.length === 0) return null;

                let cIdx = rp.hand.findIndex(c => c.id === cardToPlay.id);
                if (cIdx === -1) cIdx = 0;
                const card = rp.hand.splice(cIdx, 1)[0];

                // Prefer the pre-scored best match; fall back to first valid capture
                let match = null;
                if (bestMatchIds) {
                    const allCaptures = logic.getValidCaptures(card, rs.table);
                    match = allCaptures.find(set =>
                        set.length === bestMatchIds.length &&
                        set.every(c => bestMatchIds.includes(c.id))
                    ) || allCaptures[0] || null;
                } else {
                    const allCaptures = logic.getValidCaptures(card, rs.table);
                    match = allCaptures.length > 0 ? allCaptures[0] : null;
                }

                if (match) {
                    const capturedIds = match.map(c => c.id);
                    const capturedCards = rs.table.filter(c => capturedIds.includes(c.id));
                    rs.table = rs.table.filter(c => !capturedIds.includes(c.id));
                    const allCaptured = [card, ...capturedCards];
                    rp.captured.push(...allCaptured);
                    rs.lastCaptureId = rp.id;

                    // CHKOBBA detection: Clearing the table counts except on the very last move of the game.
                    // The last move is when the deck is empty AND all players have played their last cards.
                    const isLastMove = rs.deck.length === 0 && players.every(pl => pl.hand.length === 0);
                    
                    if (rs.table.length === 0 && !isLastMove) {
                        rp.chkobbas++;
                        rs.chkobbaEvent = { type: 'chkobba', playerId: rp.id, name: rp.name, seq: Date.now() };
                    }

                    // SEBBA HAYA (7 of Diamonds) detection: Trigger announcement if captured.
                    if (allCaptured.some(c => c.id === 'diamonds_7')) {
                        if (rs.chkobbaEvent) {
                            // Dual event!
                            rs.chkobbaEvent.type = 'chkobba_berria';
                        } else {
                            rs.chkobbaEvent = { type: 'berria', playerId: rp.id, name: rp.name, seq: Date.now() };
                        }
                    }
                } else {
                    rs.table.push(card);
                }
                _advanceChkobbaTurn(rs, room);
                room.word_obj = rs;
                return players;
            }, null, (room, players) => ({ word_obj: room.word_obj, timer_end_at: room.timer_end_at }));
            } finally {
                clearTimeout(timingOutGuard);
                // Release the guard now that the network round-trip is done.
                // The server push that follows will install a fresh timer_end_at,
                // so the tick loop will no longer see left <= 0.
                _chkobbaTimingOut = false;
            }
        };

        const isMe    = p.id === _myId;
        const fromEl  = isMe ? _chkobbaHandCardEl(chosenCardIndex) : _chkobbaOpponentPillEls.get(p.id);
        const toEl    = bestMatch
            ? (_chkobbaOpponentPillEls.get(p.id) || document.getElementById('chkobba-my-capture-pile'))
            : document.getElementById('chkobba-table');

        // Measure ALL rects now; real elements stay visible throughout.
        const fromRect = fromEl?.getBoundingClientRect();
        const toRect   = toEl?.getBoundingClientRect();

        const flights      = [];
        const inFlightIds  = [];

        if (fromRect && toRect) {
            flights.push({
                fromRect,
                toRect,
                imgSrc:       logic.getCardAsset(cardToPlay),
                rotate:       bestMatch ? 4 : -5,
                withGhost:    false,
                staggerAfter: bestMatch ? 30 : 0,
                duration:     200
            });
            if (isMe) inFlightIds.push(cardToPlay.id);
        }

        if (bestMatch) {
            bestMatch.forEach((c, i) => {
                const tEl = document.querySelector(`#chkobba-table .table-card[data-card-id="${c.id}"]`);
                if (tEl && toRect) {
                    flights.push({
                        fromRect:     tEl.getBoundingClientRect(),
                        toRect,
                        imgSrc:       logic.getCardAsset(c),
                        rotate:       (i % 2 === 0 ? 1 : -1) * (4 + i * 2),
                        withGhost:    false,
                        staggerAfter: 30
                    });
                    inFlightIds.push(c.id);
                }
            });
        }

        ChkobbaAnimator.schedule({
            flights,
            cardIds:  inFlightIds,
            onCommit: runActualMutate
        });
        // _chkobbaTimingOut is released by runActualMutate's own finally block
        // after the network round-trip completes.  Do NOT reset it here.
    } catch(e) {
        // An unexpected exception escaped before schedule() could be called —
        // release the guard so the game isn't permanently locked.
        console.error(e);
        clearTimeout(timingOutGuard);
        _chkobbaTimingOut = false;
    }
}

function _onChkobbaDragStart(e) {
    const cardEl = e.target.closest('.chkobba-card.hand-card');
    if (!cardEl) return;
    if (_chkobbaPlaySession?.phase === 'readyCapture') {
        e.preventDefault();
        return;
    }
    // Always re-arm to the card being dragged, not just when no session exists.
    // Fixes: click card A, then drag card B — without this the session stays on A.
    _armChkobbaHandCard(cardEl);
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
    if (ChkobbaAnimator.isInputLocked()) return;
    const ctx = _getChkobbaPlayContext();
    if (!ctx || !_chkobbaPlaySession || _chkobbaPlaySession.phase !== 'readyCapture') return;

    const handIndex  = _chkobbaPlaySession.handIndex;
    const playedCard = _chkobbaPlaySession.playedCard;
    const capturedIds = (_chkobbaPlaySession.captureSet || []).map(c => c.id);
    const logic      = ctx.logic;

    // Validate against current local state before doing anything visual
    const valid = logic.findMatchingCapture(playedCard, ctx.state.table, capturedIds);
    if (!valid) {
        showToast('ماكلة غير صالحة.');
        _resetChkobbaPlaySession();
        return;
    }

    const pileEl  = _chkobbaOpponentPillEls.get(_myId) || document.getElementById('chkobba-my-capture-pile');
    const handEl  = _chkobbaHandCardEl(handIndex);
    const pileRect = pileEl?.getBoundingClientRect();

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

            // CHKOBBA detection: Clearing the table counts except on the very last move of the game.
            // The last move is when the deck is empty AND all players have played their last cards.
            const isLastMove = s.deck.length === 0 && players.every(pl => pl.hand.length === 0);

            if (s.table.length === 0 && !isLastMove) {
                p.chkobbas++;
                s.chkobbaEvent = { type: 'chkobba', playerId: _myId, name: p.name, seq: Date.now() };
            }

            // SEBBA HAYA (7 of Diamonds) detection: Trigger announcement if captured.
            if (allCaptured.some(c => c.id === 'diamonds_7')) {
                if (s.chkobbaEvent) {
                    // Dual event!
                    s.chkobbaEvent.type = 'chkobba_berria';
                } else {
                    s.chkobbaEvent = { type: 'berria', playerId: _myId, name: p.name, seq: Date.now() };
                }
            }

            _advanceChkobbaTurn(s, room);
            return players;
        }, null, (room, players) => ({ word_obj: room.word_obj, timer_end_at: room.timer_end_at }));

        _resetChkobbaPlaySession();
    };

    // ── Build flight list ──────────────────────────────────────────────
    // Measure ALL rects NOW, before any DOM or state changes.
    // Real elements stay fully visible — ghosts do the flying.
    const flights    = [];
    const inFlightCardIds = [];

    if (handEl && pileRect) {
        flights.push({
            fromRect:     handEl.getBoundingClientRect(),
            toRect:       pileRect,
            imgSrc:       logic.getCardAsset(playedCard),
            imgSrcBack:   logic.ASSETS.BACK,
            rotate:       4,
            withGhost:    false,
            staggerAfter: 30
        });
        inFlightCardIds.push(playedCard.id);
    }

    capturedIds.forEach((id, i) => {
        const tableEl = document.querySelector(`#chkobba-table .table-card[data-card-id="${id}"]`);
        const card    = ctx.state.table.find(c => c.id === id);
        if (tableEl && pileRect && card) {
            flights.push({
                fromRect:     tableEl.getBoundingClientRect(),
                toRect:       pileRect,
                imgSrc:       logic.getCardAsset(card),
                imgSrcBack:   logic.ASSETS.BACK,
                rotate:       (i % 2 === 0 ? 1 : -1) * (4 + i * 2),
                withGhost:    false,
                staggerAfter: 30
            });
            inFlightCardIds.push(id);
        }
    });

    ChkobbaAnimator.schedule({
        flights,
        cardIds:  inFlightCardIds,
        onCommit: runMutate
    });
}

async function _commitChkobbaPlayToTable() {
    if (ChkobbaAnimator.isInputLocked()) return;
    const ctx = _getChkobbaPlayContext();
    if (!ctx || !_chkobbaPlaySession) return;

    const handIndex  = _chkobbaPlaySession.handIndex;
    const playedCard = _chkobbaPlaySession.playedCard;
    const captures   = ctx.logic.getValidCaptures(playedCard, ctx.state.table);
    if (captures.length > 0) {
        showToast('لازم تاكل! فما كوارط تنجم تاخذهم.');
        return;
    }

    const handEl  = _chkobbaHandCardEl(handIndex);
    const tableEl = document.getElementById('chkobba-table');
    const imgSrc  = ctx.logic.getCardAsset(playedCard);

    // Measure fromRect and toRect BEFORE any DOM or state changes.
    // Real card stays fully visible until the commit resolves.
    const fromRect       = handEl?.getBoundingClientRect();
    const tableRect      = tableEl?.getBoundingClientRect();
    const tableCardsCount = ctx.state.table.length;
    const toRect = tableRect ? {
        left:   tableRect.left + (tableRect.width / 2) + (tableCardsCount * 10) - 30,
        top:    tableRect.top  + (tableRect.height / 2),
        width:  tableRect.width / 4,
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

    ChkobbaAnimator.schedule({
        flights: (fromRect && (toRect || tableRect)) ? [{
            fromRect,
            toRect:   toRect || tableRect,
            imgSrc,
            duration: 200,
            rotate:   -5,
            withGhost: false
        }] : [],
        cardIds:  [playedCard.id],
        onCommit: runMutate
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

    // Apply round scores to totalScore but keep captured/chkobbas for the scoreboard
    state.players.forEach(p => {
        p.totalScore += scores[p.id].total;
    });

    // Store round scores so the scoreboard overlay can display them
    state.roundScores = scores;

    // Check game over
    let gameOver = false;
    state.players.forEach(p => {
        if (p.totalScore >= state.targetScore) gameOver = true;
    });

    if (gameOver) {
        // Show final scoreboard first, then mark finished
        state.phase = 'finished';
        state.log = 'الطرح وفى!';
        // Clear captures/chkobbas after we've stored scores above
        state.players.forEach(p => { p.captured = []; p.chkobbas = 0; });
    } else {
        // Pause at round_score phase — a continue button will advance to next round
        state.phase = 'round_score';
        state.log = 'نهاية الطرح — شوف النقاط!';
    }
}

/**
 * Called by the host (or auto-timeout) after the round scoreboard is acknowledged.
 * Deals a fresh deck and resumes playing.
 */
async function _chkobbaStartNextRound(roomObj) {
    const actualRoom = roomObj || _room;
    if (!actualRoom || !_isHost) return;
    await _mutatePlayers(actualRoom.code, (players, room) => {
        const s = room.word_obj;
        if (s.phase !== 'round_score') return null;

        const logic = window.ChkobbaLogic;
        // Clear accumulated per-round data now that scoreboard was shown
        s.players.forEach(p => { p.captured = []; p.chkobbas = 0; });

        const deck = logic.createDeck();
        s.deck = deck;
        s.table = [s.deck.pop(), s.deck.pop(), s.deck.pop(), s.deck.pop()];
        s.players.forEach(p => {
            p.hand = [s.deck.pop(), s.deck.pop(), s.deck.pop()];
        });
        s.round++;
        s.turnIndex = 0;
        s.roundScores = null;
        s.chkobbaEvent = null;   // prevent last round's event from re-animating at round start
        s.phase = 'playing';
        s.log = 'طرح جديد — بالتوفيق!';

        const turnTime = room.config?.chkobbaTurnTime || 45;
        room.timer_end_at = new Date(_syncedNow() + turnTime * 1000).toISOString();
        return players;
    }, null, (room, players) => ({ word_obj: room.word_obj, timer_end_at: room.timer_end_at }));
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
    const isBerria = event.type === 'berria' || event.type === 'chkobba_berria';
    const isChkobba = event.type === 'chkobba' || event.type === 'chkobba_berria';

    if (!isBerria && !isChkobba) return;

    // If both happen, we chain them: show Chkobba then show Berria
    if (event.type === 'chkobba_berria') {
        _handleChkobbaBroadcastEvent({ ...event, type: 'chkobba' });
        setTimeout(() => {
            _handleChkobbaBroadcastEvent({ ...event, type: 'berria' });
        }, 2100);
        return;
    }

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

// (exported in the block at the bottom of this file)

// ============================================================
// TOURNAMENT SYSTEM
//
// Architecture: Sequential bracket stored in room.config.tournamentBracket.
// Each match runs as a normal state:'chkobba' game in room.word_obj.
// When a match ends (phase:'finished') the host advances the bracket,
// starts the next match, and updates word_obj with the new game state.
// A full-screen bracket overlay renders over the game UI and auto-dismisses
// when the next match begins.
//
// Bracket format (stored in room.config.tournamentBracket):
// {
//   rounds: [ [ { players:[{id,name}], winnerId:null }, … ], … ],
//   currentRound: 0,
//   currentMatch: 0,
//   status: 'ongoing' | 'finished',
//   champion: { id, name } | null
// }
// ============================================================

/**
 * Build the initial single-elimination bracket from the player list and
 * write it + the first match into the room.
 */
async function _startTournament(room) {
    if (!_isHost || !room) return;
    const cfg = room.config || {};
    const mode = cfg.chkobbaMode || '1v1';
    const playersPerMatch = mode === '1v1' ? 2 : mode === '1v1v1' ? 3 : 4;
    const turnTime = cfg.chkobbaTurnTime || 45;
    const targetScore = cfg.chkobbaTarget || 21;

    let allP = [...(room.players || [])];
    if (allP.length < playersPerMatch) {
        showToast(`يلزم على الأقل ${playersPerMatch} لاعبين للتورنوا.`);
        return;
    }

    // Shuffle and pad to the next power-of-match-size with byes
    const shuffled = [...allP].sort(() => 0.5 - Math.random());
    while (shuffled.length % playersPerMatch !== 0) {
        shuffled.push({ id: `bye_${shuffled.length}`, name: 'BYE', isBye: true });
    }

    // Build round-1 match list
    const firstRoundMatches = [];
    for (let i = 0; i < shuffled.length; i += playersPerMatch) {
        firstRoundMatches.push({
            players: shuffled.slice(i, i + playersPerMatch).map(p => ({
                id: p.id, name: p.name, isBye: !!p.isBye
            })),
            winnerId: null,
            winnerName: null
        });
    }

    const bracket = {
        rounds: [firstRoundMatches],
        currentRound: 0,
        currentMatch: 0,
        status: 'ongoing',
        champion: null,
        playersPerMatch,
        targetScore,
        mode
    };

    // Auto-advance past BYE matches
    _resolveByes(bracket);

    // Start the first non-BYE match
    const firstMatch = _currentBracketMatch(bracket);
    if (!firstMatch) {
        showToast('خطأ في التورنوا: ما لقيناش مباراة.');
        return;
    }

    const logic = window.ChkobbaLogic;
    const gameState = _buildMatchGameState(firstMatch, bracket, cfg, logic);
    if (!gameState) return;

    try {
        const timerEndAt = new Date(_syncedNow() + turnTime * 1000).toISOString();
        await _update(room.code, {
            state: 'chkobba',
            timer_end_at: timerEndAt,
            word_obj: gameState,
            config: { ...cfg, tournamentBracket: bracket }
        });
    } catch(e) { console.error(e); }
}

/** Return the match object for (currentRound, currentMatch). */
function _currentBracketMatch(bracket) {
    return bracket.rounds[bracket.currentRound]?.[bracket.currentMatch] || null;
}

/** Resolve any BYE matches synchronously (no card game needed). */
function _resolveByes(bracket) {
    let m = _currentBracketMatch(bracket);
    while (m && m.players.every(p => p.isBye)) {
        // All-BYE match — skip, no winner
        m.winnerId = 'bye';
        m.winnerName = 'BYE';
        _advanceBracketPointer(bracket);
        m = _currentBracketMatch(bracket);
    }
    // Also resolve matches with only one real player
    while (m && m.players.filter(p => !p.isBye).length === 1) {
        const real = m.players.find(p => !p.isBye);
        m.winnerId = real.id;
        m.winnerName = real.name;
        _advanceBracketPointer(bracket);
        m = _currentBracketMatch(bracket);
    }
}

/**
 * Move bracket pointer to next match; build next round if current round is done.
 * Returns true if there are more matches, false if tournament is over.
 */
function _advanceBracketPointer(bracket) {
    const round = bracket.rounds[bracket.currentRound];
    bracket.currentMatch++;

    if (bracket.currentMatch >= round.length) {
        // Current round finished — build next round
        const winners = round
            .filter(m => m.winnerId && m.winnerId !== 'bye')
            .map(m => ({ id: m.winnerId, name: m.winnerName }));

        if (winners.length <= 1) {
            bracket.status = 'finished';
            bracket.champion = winners[0] || null;
            return false;
        }

        // Pad to multiple of playersPerMatch with byes if needed
        while (winners.length % bracket.playersPerMatch !== 0) {
            winners.push({ id: `bye_${winners.length}`, name: 'BYE', isBye: true });
        }

        const nextRound = [];
        for (let i = 0; i < winners.length; i += bracket.playersPerMatch) {
            nextRound.push({
                players: winners.slice(i, i + bracket.playersPerMatch),
                winnerId: null,
                winnerName: null
            });
        }
        bracket.rounds.push(nextRound);
        bracket.currentRound++;
        bracket.currentMatch = 0;
    }
    return true;
}

/** Build a ready-to-play (phase:'playing') game state for a bracket match. */
function _buildMatchGameState(match, bracket, cfg, logic) {
    const realPlayers = match.players.filter(p => !p.isBye);
    if (realPlayers.length < 2) return null;

    const deck = logic.createDeck();
    const table = [deck.pop(), deck.pop(), deck.pop(), deck.pop()];
    const players = realPlayers.map(p => ({
        id: p.id,
        name: p.name,
        hand: [deck.pop(), deck.pop(), deck.pop()],
        captured: [],
        chkobbas: 0,
        totalScore: 0
    }));

    return {
        deck,
        table,
        players,
        teams: null,
        dealerIndex: 0,
        cutterIndex: 0,
        cutIndex: null,
        starterCard: null,
        setupPhase: logic.SETUP_PHASES.DEAL_COMPLETE,
        turnIndex: 0,
        lastCaptureId: null,
        round: 1,
        phase: 'playing',
        targetScore: bracket.targetScore || cfg.chkobbaTarget || 21,
        mode: bracket.mode || cfg.chkobbaMode || '1v1',
        tournament: true,
        log: 'بدا الطرح — بالتوفيق!'
    };
}

/**
 * Called (by host) when a tournament match game ends (phase:'finished').
 * Records the winner, advances the bracket, and starts the next match or
 * announces the champion.
 */
async function _updateChkobbaTournament(room) {
    if (!_isHost || !room?.config?.chkobbaTournament) return;
    const state = room.word_obj;
    if (!state || state.phase !== 'finished') return;
    const bracket = room.config.tournamentBracket;
    if (!bracket || bracket.status === 'finished') return;

    // Identify winner of the just-completed match
    const winnerPlayer = state.players.reduce(
        (best, p) => (!best || p.totalScore > best.totalScore ? p : best), null
    );
    if (!winnerPlayer) return;

    const currentMatch = _currentBracketMatch(bracket);
    if (!currentMatch) return;
    currentMatch.winnerId   = winnerPlayer.id;
    currentMatch.winnerName = winnerPlayer.name;

    const hasMore = _advanceBracketPointer(bracket);
    _resolveByes(bracket);

    const cfg = room.config;
    const logic = window.ChkobbaLogic;
    const turnTime = cfg.chkobbaTurnTime || 45;

    if (!hasMore || bracket.status === 'finished') {
        // Tournament over
        bracket.status = 'finished';
        try {
            await _update(room.code, {
                state: 'chkobba_tournament_over',
                config: { ...cfg, tournamentBracket: bracket }
            });
        } catch(e) { console.error(e); }
        return;
    }

    // Start next match
    const nextMatch = _currentBracketMatch(bracket);
    if (!nextMatch) return;
    const gameState = _buildMatchGameState(nextMatch, bracket, cfg, logic);
    if (!gameState) return;

    try {
        const timerEndAt = new Date(_syncedNow() + turnTime * 1000).toISOString();
        await _update(room.code, {
            state: 'chkobba',
            timer_end_at: timerEndAt,
            word_obj: gameState,
            config: { ...cfg, tournamentBracket: bracket }
        });
    } catch(e) { console.error(e); }
}

/**
 * Show the tournament bracket overlay.
 * Renders over the existing chkobba-screen without touching chkobba-table.
 * Automatically removes itself when a new match starts (state change).
 */
function _showTournamentBracket(room) {
    // Remove existing bracket overlay if any
    document.getElementById('chkobba-tournament-overlay')?.remove();

    const bracket = room.config?.tournamentBracket;
    const isOver  = room.state === 'chkobba_tournament_over';

    const overlay = document.createElement('div');
    overlay.id = 'chkobba-tournament-overlay';
    overlay.style.cssText = `
        position:fixed;inset:0;z-index:9990;
        display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
        padding:20px 12px;overflow-y:auto;
        background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);
        font-family:var(--font-arabic,sans-serif);direction:rtl;color:var(--text-1,#fff);
    `;

    const champion = bracket?.champion;
    const titleHtml = isOver && champion
        ? `<div style="font-size:2rem;margin-bottom:4px;">🏆</div>
           <h2 style="margin:0 0 4px;color:var(--gold,#f1c051);">البطل: ${_esc(champion.name)}</h2>`
        : `<h2 style="margin:0 0 4px;color:var(--gold,#f1c051);">🏆 جدول التورنوا</h2>`;

    let roundsHtml = '';
    if (bracket) {
        bracket.rounds.forEach((round, rIdx) => {
            const isCurrentRound = rIdx === bracket.currentRound;
            roundsHtml += `<div style="margin-bottom:20px;width:100%;max-width:440px;">
                <div style="font-weight:700;font-size:.9rem;opacity:.6;margin-bottom:8px;text-align:center;">
                    ${bracket.rounds.length > 1
                        ? (rIdx === bracket.rounds.length - 1 ? 'النهائي' : `الدور ${rIdx + 1}`)
                        : 'الدور الأول'}
                </div>`;
            round.forEach((m, mIdx) => {
                const isCurrentMatch = isCurrentRound && mIdx === bracket.currentMatch && !isOver;
                const rowBg = isCurrentMatch ? 'rgba(241,192,81,0.15)' : 'rgba(255,255,255,0.04)';
                const rowBorder = isCurrentMatch ? '1.5px solid var(--gold,#f1c051)' : '1px solid rgba(255,255,255,0.08)';
                const realPlayers = m.players.filter(p => !p.isBye);
                roundsHtml += `<div style="
                    display:flex;align-items:center;gap:10px;
                    padding:10px 14px;margin-bottom:6px;
                    background:${rowBg};border-radius:12px;border:${rowBorder};
                ">
                    <div style="flex:1;">
                        ${realPlayers.map(p => `
                            <div style="
                                font-weight:${m.winnerId === p.id ? '800' : '400'};
                                color:${m.winnerId === p.id ? 'var(--gold,#f1c051)' : 'inherit'};
                                font-size:.95rem;
                            ">${m.winnerId === p.id ? '👑 ' : ''}${_esc(p.name)}</div>
                        `).join('<div style="font-size:.7rem;opacity:.4;text-align:center;">ضد</div>')}
                    </div>
                    <div style="font-size:.8rem;opacity:.55;white-space:nowrap;">
                        ${isCurrentMatch ? '▶ جاري' : m.winnerId ? (m.winnerId === 'bye' ? 'بای' : 'وفى') : '—'}
                    </div>
                </div>`;
            });
            roundsHtml += '</div>';
        });
    }

    const myMatchNow = bracket && !isOver && (() => {
        const m = _currentBracketMatch(bracket);
        return m && m.players.some(p => p.id === _myId);
    })();

    overlay.innerHTML = `
        ${titleHtml}
        <div style="width:100%;max-width:440px;margin-bottom:16px;">${roundsHtml}</div>
        ${myMatchNow
            ? `<div style="background:rgba(241,192,81,0.12);border:1.5px solid var(--gold,#f1c051);
                border-radius:14px;padding:14px 20px;text-align:center;margin-bottom:16px;max-width:440px;width:100%;">
                <div style="font-weight:700;margin-bottom:6px;">دورك في الملعب! 🎯</div>
                <button id="chk-tourn-play-btn" style="
                    padding:12px 32px;border-radius:12px;border:none;cursor:pointer;
                    background:var(--gold,#f1c051);color:#1e1e2e;font-weight:800;font-size:1rem;
                ">العب</button>
               </div>`
            : (isOver ? '' : `<div style="opacity:.55;font-size:.9rem;margin-bottom:16px;">انتظر دورك…</div>`)
        }
        ${isOver
            ? `<button id="chk-tourn-done-btn" style="
                padding:12px 32px;border-radius:12px;border:none;cursor:pointer;
                background:var(--gold,#f1c051);color:#1e1e2e;font-weight:800;font-size:1rem;
              ">العب مجددًا</button>`
            : `<button id="chk-tourn-close-btn" style="
                margin-top:4px;padding:10px 24px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);
                background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;font-size:.9rem;
              ">إخفاء الجدول</button>`
        }
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#chk-tourn-play-btn')?.addEventListener('click', () => {
        overlay.remove();
        _showOnlineChkobba(room);
    });
    overlay.querySelector('#chk-tourn-close-btn')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('#chk-tourn-done-btn')?.addEventListener('click', () => {
        overlay.remove();
        if (typeof _leaveRoom === 'function') _leaveRoom();
        if (typeof showScreen === 'function') showScreen('mode-select-screen');
    });
}

function _renderMatchmakingQueue(room) {
    // placeholder — matchmaking not used in sequential bracket mode
}

// ── Expose for shared scope ────────────────────────────────────
window._showOnlineChkobba           = _showOnlineChkobba;
window._startOnlineChkobbaGame      = _startOnlineChkobbaGame;
window._renderChkobbaLobbySettings  = _renderChkobbaLobbySettings;
window._initChkobbaReactions        = _initChkobbaReactions;
window._showTournamentBracket       = _showTournamentBracket;
window._updateChkobbaTournament     = _updateChkobbaTournament;
window._startTournament             = _startTournament;
window._setupChkobbaMenuButtons     = _setupChkobbaMenuButtons;
window._commitChkobbaCapture        = _commitChkobbaCapture;
window._commitChkobbaPlayToTable    = _commitChkobbaPlayToTable;
window._chkobbaStartNextRound       = _chkobbaStartNextRound;
