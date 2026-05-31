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
    document.querySelectorAll('.chkobba-card.is-armed, .chkobba-card.is-selected').forEach(el => {
        el.classList.remove('is-armed', 'is-selected', 'is-invalid');
    });
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

    // Remove existing listeners to avoid duplicates
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);

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
    return ((index * 17 + hash) % 11) - 5;
}

function _handCardTilt(index, total) {
    const mid = (total - 1) / 2;
    return (index - mid) * 4.5;
}

/** GPU-friendly card flight; calls onDone when finished (or immediately if reduced motion). */
function _animateChkobbaFlight({ fromRect, toRect, imgSrc, duration = 600, rotate = 6, withGhost = false, onDone }) {
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

    // Start position with opacity 0 for smooth fade-in
    flyer.style.transform = `translate3d(${fx}px, ${fy}px, 0) scale(1) rotate(${rotate}deg) translate(-50%, -50%)`;
    flyer.style.opacity = '0';
    flyer.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${duration * 0.2}ms ease-out`;

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
        ghost.style.opacity = '0';
        ghost.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${duration * 0.2}ms ease-out`;
        const gImg = document.createElement('img');
        gImg.src = imgSrc;
        ghost.appendChild(gImg);
        layer.appendChild(ghost);
    }

    // Trigger GPU animation with fade-in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Fade in first
            flyer.style.opacity = '1';
            
            // Then animate to target position
            requestAnimationFrame(() => {
                const endTransform = `translate3d(${tx}px, ${ty}px, 0) scale(1) rotate(${rotate * 0.35}deg) translate(-50%, -50%)`;
                flyer.style.transform = endTransform;

                if (ghost) {
                    // Ghost lags slightly behind visually via timing
                    setTimeout(() => {
                        ghost.style.opacity = '0.5';
                        ghost.style.transform = endTransform;
                        setTimeout(() => {
                            ghost.style.opacity = '0';
                        }, duration * 0.5);
                    }, 60);
                }
            });
        });
    });

    const finish = () => {
        flyer.style.opacity = '0';
        setTimeout(() => {
            flyer.remove();
            if (ghost) setTimeout(() => ghost.remove(), 200);
            onDone?.();
        }, 150);
    };
    flyer.addEventListener('transitionend', finish, { once: true });
    // Safety fallback
    setTimeout(finish, duration + 200);
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
            
            // Double-tap handler
            let lastTap = 0;
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                const now = Date.now();
                if (now - lastTap < 300) {
                    // Double-tap detected
                    _playCardToTable(div, card, index);
                    lastTap = 0;
                } else {
                    // Single tap - arm the card
                    _armChkobbaHandCard(div);
                    lastTap = now;
                }
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

function _playCardToTable(cardEl, card, index) {
    const ctx = _getChkobbaPlayContext();
    if (!ctx) return;
    
    const logic = ctx.logic;
    const state = ctx.state;
    const me = ctx.me;
    
    // Arm the card first to set up the play session
    _resetChkobbaPlaySession();
    
    const captures = logic.getValidCaptures(card, state.table);
    
    if (captures.length > 0) {
        // If a capture is possible, we must perform it!
        // We'll automatically pick the first capture set (which prioritizes direct matches if available)
        _chkobbaPlaySession = {
            phase: 'readyCapture',
            handIndex: index,
            playedCard: card,
            captureSet: captures[0],
            selectedTableIds: new Set(captures[0].map(c => c.id))
        };
        _commitChkobbaCapture();
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
    if (_chkobbaAnimating) return;
    const ctx = _getChkobbaPlayContext();
    if (!ctx || !_chkobbaPlaySession) return;

    const handIndex = _chkobbaPlaySession.handIndex;
    const playedCard = _chkobbaPlaySession.playedCard;

    const handEl = _chkobbaHandCardEl(handIndex);
    const tableEl = document.getElementById('chkobba-table');
    const imgSrc = ctx.logic.getCardAsset(playedCard);

    const tableRect = tableEl?.getBoundingClientRect();
    const targetRect = tableRect ? {
        left: tableRect.left + (tableRect.width / 2),
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
        duration: 658.5,
        onDone: () => {
            _chkobbaAnimating = false;
            runMutate();
        }
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
    let allP = [...(_room.players || [])];
    const cfg = _room.config || {};
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
    const firstLetter = me.name ? me.name.charAt(0).toUpperCase() : '?';

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
        <div class="chkobba-player-circle ${isMyTurn ? 'is-turn' : ''}">${firstLetter}</div>
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
    
    // Get existing cards to preserve them for animation
    const existingCards = Array.from(tableCont.querySelectorAll('.table-card'));
    const existingCardIds = new Set(existingCards.map(el => el.dataset.cardId));
    
    // Clear only cards that are no longer on the table
    const newCardIds = new Set(state.table.map(c => c.id));
    existingCards.forEach(el => {
        if (!newCardIds.has(el.dataset.cardId)) {
            el.remove();
        }
    });
    
    // Add or update cards
    state.table.forEach((card, idx) => {
        let cardEl = tableCont.querySelector(`.table-card[data-card-id="${card.id}"]`);
        if (!cardEl) {
            // New card - render it
            cardEl = _renderChkobbaCard(card, {
                zone: 'table',
                index: idx,
                interactive: canInteract
            });
            tableCont.appendChild(cardEl);
        } else {
            // Existing card - update its index/rotation
            cardEl.dataset.index = String(idx);
            cardEl.style.setProperty('--rot', `${_tableCardRotation(idx, card.id)}deg`);
        }
    });

    // Check total cards on table and apply appropriate size reduction
    const tableCards = tableCont.querySelectorAll('.table-card');
    const totalCards = tableCards.length;
    
    // Remove all stacking classes first
    tableCont.classList.remove('is-stacked-30', 'is-stacked-60');
    
    // Apply appropriate class based on total cards
    if (totalCards > 6) {
        tableCont.classList.add('is-stacked-60');
    } else if (totalCards > 4) {
        tableCont.classList.add('is-stacked-30');
    }

    // Setup menu and voice button event listeners
    _setupChkobbaMenuButtons();

    // Render player info box
    _renderChkobbaPlayerInfo(state, me, isMyTurn);

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
let _chkobbaSetupAIBusy = false;

function _startOnlineChkobbaTimer(room) {
    clearInterval(_chkobbaTimer);
    const timerEl = document.getElementById('chkobba-turn-timer');
    if (!timerEl) return;

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
        const endTime = new Date(room.timer_end_at).getTime();
        const left = Math.max(0, Math.ceil((endTime - _syncedNow()) / 1000));

        const m = Math.floor(left / 60).toString().padStart(2, '0');
        const sec = (left % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${sec}`;

        if (left <= 10) timerEl.style.color = 'var(--danger-color)';
        else timerEl.style.color = '';

        const s = room.word_obj;
        if (!s) return;

        const p = s?.players?.[s.turnIndex];
        const isAI = p?.isAI;

        if (_isHost && !_chkobbaTimingOut && s?.phase === 'playing') {
            if (left <= 0) {
                _chkobbaTimeout();
            } else if (isAI) {
                // AI move after a short delay
                const totalTurn = (new Date(room.timer_end_at).getTime() - endTime + (left*1000)); // approximate
                const elapsed = (new Date(room.timer_end_at).getTime() - (left*1000)) - _syncedNow(); // this is not right
                // Let's use a simpler logic: AI moves when left is less than (TurnTime - random(2,4))
                const turnTime = room.config?.chkobbaTurnTime || 45;
                if (left < (turnTime - 2 - Math.random() * 2)) {
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
    _chkobbaTimingOut = true;
    try {
        const s = _room.word_obj;
        if (!s || s.phase !== 'playing') return;
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
            await _mutatePlayers(_room.code, (players, room) => {
                const rs = room.word_obj;
                if (rs.phase !== 'playing') return null;
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
                    if (rs.table.length === 0 && rs.deck.length > 0) {
                        rp.chkobbas++;
                        rs.chkobbaEvent = { type: 'chkobba', playerId: rp.id, name: rp.name };
                    } else if (allCaptured.some(c => c.id === 'diamonds_7')) {
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
            } else if (allCaptured.some(c => c.id === 'diamonds_7')) {
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
