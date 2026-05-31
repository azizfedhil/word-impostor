'use strict';

// ============================================================
// GAME REGISTRY — Phase 5 + Phase 6 Online Contracts
//
// Every game registers a contract here. The platform (shared.js,
// online.js) interacts ONLY through this contract — no game
// names appear in platform code.
//
// Full contract shape:
// {
//   // ── Identity ───────────────────────────────────────────
//   firstScreen:          string    — screen to show on init
//   defaultTimerConfig:   number    — timer default (minutes)
//   supportsLangVariants: boolean   — whether +18 mode is allowed
//
//   // ── Offline UI ─────────────────────────────────────────
//   voteBtnLabel:   string|null  — "go to vote" button label
//   voteBtnPrefix:  string       — prefix on each vote candidate
//   whoLabel:       string|null  — voting screen header
//   votingTitle:    string|null  — voting screen title
//   timerLabel:     string|null  — timer counter label
//   excludeFromVote: fn(player) → bool  — hide player from vote list
//
//   // ── Lifecycle ──────────────────────────────────────────
//   start()
//     Called when the player presses "Start Game" (offline mode).
//
//   teardown()
//     Called before navigating away or starting a new round.
//
//   // ── Rendering ──────────────────────────────────────────
//   renderCardContent(player, lang) → HTML string
//     Returns inner HTML for the offline flip-card face.
//
//   // ── Vote handling ──────────────────────────────────────
//   handleVote(votedPlayer)
//     Called when offline vote is cast.
//
//   // ── Online round lifecycle ─────────────────────────────
//   buildOnlineRound(players, config, db) → roundData | null
//     Called by the coordinator on the host before writing
//     state:'reveal' to Supabase.
//
//   // ── Online rendering contracts (Phase 6) ───────────────
//   onlineCardConfig(player, room) → { roleText: string }
//     Returns the role card HTML for the online reveal screen.
//     Coordinator calls this instead of branching on game mode.
//
//   onlineVotingConfig(room) → {
//     title:           string,   — voting screen title
//     whoLabel:        string,   — "who is the X?" label
//     voteBtnPrefix:   string,   — emoji prefix per candidate
//     excludePlayer:   fn(p) → bool,  — skip from vote list
//     judgeOnly:       bool,     — only judge can vote
//     isVotingComplete: fn(room) → bool,
//   }
//     Returns everything _showOnlineVoting needs.
//
//   onlineResultConfig(room) → {
//     resultMsg:  string,   — headline message
//     revealHTML: string,   — detail reveal box HTML
//     animation:  'win'|'lose',
//   } | null
//     Returns result screen content.  Return null if the
//     game uses a completely custom result screen.
//
//   onlineTimerConfig(room) → {
//     supportsFiguredOut: bool,  — show "عرفت الكذاب!" button
//     figuredOutLabel:    string,
//     figuredOutAnnounce: string,
//   }
// }
// ============================================================

window.GameRegistry = (() => {
    const _registry = {};

    function register(name, contract) {
        _registry[name] = {
            firstScreen:          'setup-screen',
            defaultTimerConfig:   3,
            supportsLangVariants: false,
            voteBtnLabel:         null,
            voteBtnPrefix:        '🗳️ ',
            whoLabel:             null,
            votingTitle:          null,
            timerLabel:           null,
            excludeFromVote:      null,
            renderCardContent:    null,
            handleVote:           null,
            start:                null,
            teardown:             () => {},
            buildOnlineRound:     () => null,
            handleOnlineEvent:    () => false,
            processOnlineVotes:   null,   // fn(room, alive) → {result, players?} | null
            // Online rendering contracts
            onlineCardConfig:     null,
            onlineVotingConfig:   null,
            onlineResultConfig:   null,
            onlineTimerConfig:    () => ({
                supportsFiguredOut: false,
                figuredOutLabel:    'عرفت الكذاب!',
                figuredOutAnnounce: 'عرف الكذاب!',
            }),
            ...contract,
        };
    }

    return new Proxy({ register }, {
        get(target, prop) {
            if (prop in target) return target[prop];
            return _registry[prop];
        }
    });
})();


// ══════════════════════════════════════════════════════════════
// IMPOSTOR
// ══════════════════════════════════════════════════════════════
window.GameRegistry.register('impostor', {
    firstScreen:          'setup-screen',
    defaultTimerConfig:   3,
    supportsLangVariants: true,
    voteBtnLabel:         null,
    voteBtnPrefix:        '🗳️ ',
    whoLabel:             null,
    votingTitle:          null,
    timerLabel:           null,

    start() {
        if (typeof window.ImpostorGame?.startOffline === 'function')
            window.ImpostorGame.startOffline();
    },

    teardown() {},

    renderCardContent(player, lang) {
        const t    = window.i18n?.[lang] || {};
        const esc  = window._escapeHtml || (v => v);
        const noH  = window.GameState?.isNoHintsMode?.() || window.noHintsMode;
        if (player.isImpostor) {
            return noH
                ? (t.impostor_role || 'الكذاب 🤫')
                : `${t.impostor_role || 'الكذاب 🤫'}<br><br>`
                  + `<span style="font-size:16px;">${t.hint_label || 'التلميح:'}</span>`
                  + `<br>${esc(player.customHint)}`;
        }
        const wordObj = window.GameState?.getCurrentWordObj?.() || window.currentWordObj;
        return `${t.citizen_role || 'جوّك باهي 🤠'}<br><br>`
             + `<span style="font-size:16px;">${t.word_label || 'الكلمة:'}</span>`
             + `<br>${esc(wordObj?.word || '')}`;
    },

    handleVote(votedPlayer) {
        window.ImpostorGame?.handleVote?.(votedPlayer);
    },

    buildOnlineRound(players, config, db) {
        const lang    = config.lang || 'tn';
        const wordList = lang === 'x18' ? (window.adultWordsDB || []) : (window.regularWordsDB || db || []);
        if (!wordList.length) return null;

        let impCount = Math.min(config.impostors || 1, players.length - 1);
        if (config.randomImpostors)
            impCount = Math.floor(Math.random() * Math.floor(players.length / 2)) + 1;

        const wordObj   = wordList[Math.floor(Math.random() * wordList.length)];
        const noHints   = config.noHints || lang === 'x18';
        const enriched  = players.map(p => ({
            ...p,
            isImpostor: false, customHint: '', eliminated: false,
            hasSeenCard: false, vote: null, figuredOut: false, askedQuestion: false,
        }));

        const isChaos = config.chaos && Math.random() < 0.15;
        if (isChaos) {
            enriched.forEach(p => { p.isImpostor = true; });
        } else {
            const idx = [...Array(enriched.length).keys()].sort(() => 0.5 - Math.random());
            for (let i = 0; i < impCount; i++) enriched[idx[i]].isImpostor = true;
        }

        if (!noHints) {
            const imps = enriched.filter(p => p.isImpostor);
            if (config.allCorrectHints) {
                imps.forEach(p => { p.customHint = wordObj.hint || ''; });
            } else if (imps.length === 1) {
                imps[0].customHint = wordObj.hint || '';
            } else {
                const lucky = Math.floor(Math.random() * imps.length);
                const wrong = wordList
                    .filter(w => w.word !== wordObj.word)
                    .map(w => w.hint)
                    .sort(() => 0.5 - Math.random());
                let hi = 0;
                imps.forEach((p, i) => {
                    p.customHint = (i === lucky) ? (wordObj.hint || '') : (wrong[hi++ % wrong.length] || '');
                });
            }
        }

        return { players: enriched, wordObj, extraConfig: { currentVoteReason: null } };
    },

    onlineCardConfig(player, room) {
        const lang = room.config?.lang || 'tn';
        const t    = window.i18n?.[lang] || {};
        const esc  = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        const noHints = room.config?.noHints || lang === 'x18';
        let roleText;
        if (player.isImpostor) {
            roleText = noHints
                ? t.impostor_role
                : `${t.impostor_role}<br><br><span style="font-size:16px;">${t.hint_label}</span><br>${esc(player.customHint)}`;
        } else {
            roleText = `${t.citizen_role}<br><br><span style="font-size:16px;">${t.word_label}</span><br>${esc(room.word_obj?.word || '')}`;
        }
        return { roleText };
    },

    onlineVotingConfig(room) {
        const trans = (window.i18n || {})[room.config?.lang || 'tn'] || {};
        return {
            title:            trans.voting_title || '🗳️ الفرز',
            whoLabel:         trans.who_impostor || 'شكونو البلعوط؟',
            voteBtnPrefix:    '🗳️ ',
            excludePlayer:    null,
            judgeOnly:        false,
            isVotingComplete: (r) => {
                const alive = r.players.filter(p => !p.eliminated);
                return alive.length > 0 && alive.every(p => p.vote !== null);
            },
        };
    },

    onlineResultConfig(room) {
        const trans  = (window.i18n || {})[room.config?.lang || 'tn'] || {};
        const esc    = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        const result = room.result;
        if (!result) return null;
        const voted   = room.players.find(p => p.id === result.votedPlayerId);
        const name    = voted ? voted.name : '?';
        const allImps = room.players.filter(p => p.isImpostor).map(p => esc(p.name)).join(' و ');
        const wordLine = `${trans.word_was} <strong>${room.word_obj ? esc(room.word_obj.word) : '?'}</strong>`;
        const impReveal = `${trans.impostors_were}<br><strong style="color:var(--primary-color)">${allImps}</strong><br><br>${wordLine}`;
        switch (result.outcome) {
            case 'correct_guess':
                return { animation: 'win',  resultMsg: trans.correct_guess?.replace('{name}', name), revealHTML: impReveal };
            case 'wrong_guess':
                return { animation: 'lose', resultMsg: trans.wrong_guess?.replace('{name}', name),   revealHTML: impReveal };
            case 'all_impostors_dead':
                return { animation: 'win',  resultMsg: trans.all_impostors_dead,                      revealHTML: wordLine };
            case 'impostors_win':
                return { animation: 'lose', resultMsg: trans.impostors_win,                           revealHTML: impReveal };
            case 'continue':
                return {
                    animation:  'none',
                    resultMsg:  trans.eliminated_msg?.replace('{name}', name),
                    revealHTML: trans.elimination_cliffhanger,
                    isContinue: true,
                };
            default:
                return null;
        }
    },

    onlineTimerConfig() {
        return {
            supportsFiguredOut: true,
            figuredOutLabel:    'عرفت الكذاب!',
            figuredOutAnnounce: 'عرف الكذاب!',
        };
    },
});


// ══════════════════════════════════════════════════════════════
// THIEF  (سارق، حاكم، جلّاد)
// ══════════════════════════════════════════════════════════════
window.GameRegistry.register('thief', {
    firstScreen:          'setup-screen',
    defaultTimerConfig:   3,
    supportsLangVariants: false,
    voteBtnLabel:         '⚖️ يا حاكم، احكم',
    voteBtnPrefix:        '⚖️ ',
    whoLabel:             'يا حاكم، شكون السارق؟',
    votingTitle:          '⚖️ حكم الحاكم',
    timerLabel:           null,

    excludeFromVote(player) { return player.role === 'judge'; },

    start() { window.ThiefGame?.startOffline?.(); },
    teardown() {},

    renderCardContent(player) {
        const esc = window._escapeHtml || (v => v);
        return `<strong style="font-size:1.7rem">${esc(player.roleIcon)} ${esc(player.roleLabel)}</strong>`
             + `<br><br><span style="font-size:16px;">${esc(player.roleDesc)}</span>`;
    },

    handleVote(votedPlayer) {
        window.ThiefGame?.handleJudgement?.(votedPlayer)
            ?? window.handleThiefJudgement?.(votedPlayer);
    },

    buildOnlineRound(players) {
        const roleKeys = [
            'thief', 'judge', 'executioner',
            ...Array(Math.max(0, players.length - 3)).fill('witness'),
        ].sort(() => 0.5 - Math.random());

        const enriched = players.map((p, idx) => ({
            ...p,
            role: roleKeys[idx],
            isImpostor: false, customHint: '', eliminated: false,
            hasSeenCard: false, vote: null, figuredOut: false, askedQuestion: false,
        }));

        return {
            players:     enriched,
            wordObj:     null,
            extraConfig: { gameMode: 'thief', lang: 'tn', currentVoteReason: null },
        };
    },

    onlineCardConfig(player) {
        const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        const meta = (typeof window.ThiefGame?.roleMeta === 'function')
            ? window.ThiefGame.roleMeta(player.role)
            : { label: 'شاهد', icon: '👁️', desc: 'إنت شاهد. عاون الحاكم.' };
        return {
            roleText: `<strong style="font-size:1.7rem">${meta.icon} ${meta.label}</strong><br><br><span style="font-size:16px;">${esc(meta.desc)}</span>`,
        };
    },

    onlineVotingConfig(room) {
        return {
            title:         '⚖️ حكم الحاكم',
            whoLabel:      'يا حاكم، شكون السارق؟',
            voteBtnPrefix: '⚖️ ',
            excludePlayer: (p) => p.role === 'judge',
            judgeOnly:     true,
            isVotingComplete: (r) => !!r.players.find(p => p.role === 'judge' && p.vote !== null),
        };
    },

    onlineResultConfig(room) {
        const esc    = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        const result = room.result;
        if (!result) return null;
        const voted       = room.players.find(p => p.id === result.votedPlayerId);
        const thief       = room.players.find(p => p.id === result.thiefId)       || room.players.find(p => p.role === 'thief');
        const judge       = room.players.find(p => p.id === result.judgeId)       || room.players.find(p => p.role === 'judge');
        const executioner = room.players.find(p => p.id === result.executionerId) || room.players.find(p => p.role === 'executioner');
        const revealHTML  = `السارق: <strong style="color:var(--primary-color)">${esc(thief?.name || '?')}</strong><br>الحاكم: <strong>${esc(judge?.name || '?')}</strong><br>الجلّاد: <strong>${esc(executioner?.name || '?')}</strong>`;
        if (result.outcome === 'thief_caught') {
            return { animation: 'win',  resultMsg: `الحاكم فقسها! ${voted?.name || '?'} هو السارق.`, revealHTML };
        }
        return { animation: 'lose', resultMsg: `السارق هرب! ${voted?.name || '?'} طلع خاطيه.`, revealHTML };
    },

    onlineTimerConfig() {
        return { supportsFiguredOut: false, figuredOutLabel: '', figuredOutAnnounce: '' };
    },

    processOnlineVotes(room, alive) {
        const judge       = room.players.find(p => p.role === 'judge');
        const thief       = room.players.find(p => p.role === 'thief');
        const executioner = room.players.find(p => p.role === 'executioner');
        const votedId     = judge?.vote || alive.find(p => p.role !== 'judge')?.id;
        const votedPlayer = room.players.find(p => p.id === votedId);
        if (!votedPlayer || !thief) return null;
        return {
            result: {
                votedPlayerId: votedId,
                outcome:       votedPlayer.role === 'thief' ? 'thief_caught' : 'thief_escaped',
                thiefId:       thief.id,
                judgeId:       judge?.id || null,
                executionerId: executioner?.id || null,
            }
        };
    },
});


// ══════════════════════════════════════════════════════════════
// SPYFALL  (ماناش هوني)
// ══════════════════════════════════════════════════════════════
window.GameRegistry.register('spyfall', {
    firstScreen:          'setup-screen',
    defaultTimerConfig:   3,
    supportsLangVariants: false,
    voteBtnLabel:         '🕶️ عرفنا الspy',
    voteBtnPrefix:        '🗳️ ',
    whoLabel:             'شكون الspy؟',
    votingTitle:          '🕶️ التصويت على الspy',
    timerLabel:           null,

    start() { window.SpyfallGame?.startOffline?.(); },
    teardown() {},

    renderCardContent(player) {
        const esc = window._escapeHtml || (v => v);
        if (player.isSpy)
            return `<strong style="font-size:1.7rem">🕶️ spy</strong><br><br>`
                 + `<span style="font-size:16px;">إنت الspy. حاول تعرف البلاصة من كلامهم.</span>`;
        return `<strong style="font-size:1.45rem">📍 ${esc(player.locationName)}</strong><br><br>`
             + `<span style="font-size:16px;">دورك: ${esc(player.locationRole)}</span>`;
    },

    handleVote(votedPlayer) {
        window.SpyfallGame?.handleVote?.(votedPlayer)
            ?? window.handleSpyfallVote?.(votedPlayer);
    },

    buildOnlineRound(players, config, db) {
        const locationDB = db || window._spyfallDB || [];
        if (!locationDB.length) return null;

        const location  = locationDB[Math.floor(Math.random() * locationDB.length)];
        const roles     = [...(location.roles_tn || [])].sort(() => 0.5 - Math.random());
        const spyIndex  = Math.floor(Math.random() * players.length);

        const enriched = players.map((p, idx) => ({
            ...p,
            isSpy:        idx === spyIndex,
            locationName: location.location_tn,
            locationRole: roles[idx % Math.max(1, roles.length)] || 'حريف',
            role:         idx === spyIndex ? 'spy' : 'player',
            isImpostor:   idx === spyIndex,
            customHint: '', eliminated: false,
            hasSeenCard: false, vote: null, figuredOut: false, askedQuestion: false,
        }));

        return {
            players:     enriched,
            wordObj:     location,
            extraConfig: { gameMode: 'spyfall', lang: 'tn', currentVoteReason: null },
        };
    },

    onlineCardConfig(player) {
        const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        if (player.isSpy)
            return { roleText: `<strong style="font-size:1.7rem">🕶️ spy</strong><br><br><span style="font-size:16px;">إنت الspy. حاول تعرف البلاصة من كلامهم.</span>` };
        return { roleText: `<strong style="font-size:1.45rem">📍 ${esc(player.locationName)}</strong><br><br><span style="font-size:16px;">دورك: ${esc(player.locationRole || 'حريف')}</span>` };
    },

    onlineVotingConfig() {
        return {
            title:         '🕶️ التصويت على الspy',
            whoLabel:      'شكون الspy؟',
            voteBtnPrefix: '🗳️ ',
            excludePlayer: null,
            judgeOnly:     false,
            isVotingComplete: (r) => {
                const alive = r.players.filter(p => !p.eliminated);
                return alive.length > 0 && alive.every(p => p.vote !== null);
            },
        };
    },

    onlineResultConfig(room) {
        const esc    = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        const result = room.result;
        if (!result) return null;
        const voted = room.players.find(p => p.id === result.votedPlayerId);
        const spy   = room.players.find(p => p.id === result.spyId) || room.players.find(p => p.isSpy);
        const revealHTML = `الspy: <strong style="color:var(--primary-color)">${esc(spy?.name || '?')}</strong><br>البلاصة: <strong>${esc(result.locationName || spy?.locationName || '?')}</strong>`;
        if (result.outcome === 'spy_caught') {
            return { animation: 'win',  resultMsg: `براڨو! ${voted?.name || '?'} هو الspy.`, revealHTML };
        }
        return { animation: 'lose', resultMsg: `غلط! الspy هرب. ${voted?.name || '?'} خاطيه.`, revealHTML };
    },

    onlineTimerConfig() {
        return {
            supportsFiguredOut: true,
            figuredOutLabel:    'عرفت الspy!',
            figuredOutAnnounce: 'عرف الspy!',
        };
    },

    processOnlineVotes(room, alive) {
        const tally = {};
        alive.forEach(p => { if (p.vote) tally[p.vote] = (tally[p.vote] || 0) + 1; });
        let maxV = -1, votedId = alive[0]?.id;
        Object.entries(tally).forEach(([id, count]) => { if (count > maxV) { maxV = count; votedId = id; } });
        const votedPlayer = room.players.find(p => p.id === votedId);
        const spy = room.players.find(p => p.isSpy);
        if (!votedPlayer || !spy) return null;
        return {
            result: {
                votedPlayerId: votedId,
                outcome:       votedPlayer.isSpy ? 'spy_caught' : 'spy_escaped',
                spyId:         spy.id,
                locationName:  spy.locationName || room.word_obj?.location_tn || '?',
            }
        };
    },
});


// ══════════════════════════════════════════════════════════════
// COUP  (كول وبوّع)
// ══════════════════════════════════════════════════════════════
window.GameRegistry.register('coup', {
    firstScreen:          'online-setup-screen',
    defaultTimerConfig:   1,
    supportsLangVariants: false,
    voteBtnLabel:         null,
    voteBtnPrefix:        '🗳️ ',
    whoLabel:             null,
    votingTitle:          null,
    timerLabel:           '⏱️ وقت الدور',

    start() {
        if (typeof showScreen === 'function') showScreen('online-setup-screen');
    },

    teardown() {
        if (typeof _onlineCoupTimer !== 'undefined' && _onlineCoupTimer)
            clearInterval(_onlineCoupTimer);
    },

    renderCardContent: null,
    handleVote:        null,
    buildOnlineRound:  () => null,
    onlineCardConfig:  null,
    onlineVotingConfig: null,
    onlineResultConfig: null,
});


// ══════════════════════════════════════════════════════════════
// CHKOBBA  (شكبّة)
// ══════════════════════════════════════════════════════════════
window.GameRegistry.register('chkobba', {
    firstScreen:          'online-setup-screen',
    defaultTimerConfig:   1,
    supportsLangVariants: false,
    voteBtnLabel:         null,
    voteBtnPrefix:        '🗳️ ',
    whoLabel:             null,
    votingTitle:          null,
    timerLabel:           null,

    start() {
        if (typeof showScreen === 'function') showScreen('online-setup-screen');
    },

    teardown() {},

    renderCardContent:  null,
    handleVote:         null,
    buildOnlineRound:   () => null,
    onlineCardConfig:   null,
    onlineVotingConfig: null,
    onlineResultConfig: null,
});
