'use strict';

// ============================================================
// CORE — Internationalization (i18n)
// Single source of truth for all UI strings and info descriptions.
// Game-specific strings live alongside their game modules.
// ============================================================

const i18n = {
    tn: {
        // Platform / shared UI
        title:                  '🕵️‍♂️ شكونو هو؟',
        settings_title:         'ريڨلاج الطرح',
        players_label:          '👥 اساميكم:',
        add_player_btn:         '➕ زيد واحد اخر',
        impostors_label:        '🎭 قداش من كذاب',
        timer_label:            '⏱️ وقت الطرح',
        advanced_btn:           '🔧 زيد بربش',
        adv_random:             '🎲 كذابين على كيف اللعبة',
        adv_chaos:              '😈 خلوضها',
        adv_elimination:        '⚔️ نقص بالواحد بالواحد',
        adv_nohint:             '🙈 سبورة كحلة مع الكذاب',
        adv_allhint:            '💡 الكذابين الكل ياخذو نفس التلميح',
        start_btn:              '🚀 انافا',
        reset_confirm:          'متأكد تحب تفسّخ الأسامي الكل وترجّع كل شي كيما كان؟',
        info_title:             'ℹ️ معلومة',
        close_btn:              'فهمت',
        player_placeholder:     'اسم اللاعب',

        // Card reveal screen
        reveal_title:           '🃏 شكون شنية',
        reveal_instructions:    'اقعد نازل على الكارتة باش تعرف دورك، كي تسيبها تعاود تدور.',
        reveal_player_prefix:   'كارطتك يا ',
        card_of:                'الكارتة متاع ',
        pass_to:                'هاك عرفت، عدّي للي بعدك ',
        all_seen:               'الناس الكل شافت.. ابدا العداد! 🚦',

        // Role strings
        impostor_role:          'أنت الكذاب 🤫',
        citizen_role:           'جوّك باهي 🤠',
        hint_label:             'التلميح:',
        word_label:             'الكلمة:',

        // Discussion / timer screen
        discussion_title:       '💬 وقت التقطييع والترييش',
        starter_is:             '🗣️ الي يبدا يتكلم هو: ',
        starter_continue:       '🗣️ الي يكمل يتكلم هو: ',
        vote_btn:               '🗳️ سكر عليا، عرفنا البلعوط',
        continue_discussion:    '⏱️ ارجعو قطعو وريشو (دقيقة بركا)',

        // Voting screen
        voting_title:           '🗳️ الفرز',
        who_impostor:           'شكونو البلعوط؟',

        // Result screen
        result_title:           '🏆 شكون طلع؟',
        next_round_btn:         '🔄 عاود انده',
        correct_guess:          'يعطيك الصحة! 🎉 {name} طلع هو البلعوط.',
        wrong_guess:            'غالط! ❌ {name} خاطيه مسكين.',
        impostors_were:         'البلعوط (البلعوطين):',
        word_was:               'الكلمة طلعت:',
        all_impostors_dead:     'خرجتو الكذابين الكل! 🎉 المواطنين ربحو!',
        impostors_win:          'الكذابين غلبوكم وسيطرو عالطرح! 😈',
        eliminated_msg:         'طردنا {name} مالطرح!',
        elimination_cliffhanger:'أما الطرح مازال ما وفاش... زعما طلع هو الكذاب ولا؟ مانا قايلينلكم شي! 🤐',

        // Chkobba strings (shared UI)
        chkobba_scores:         'السكور',
        chkobba_deck:           'كوارط مازالت في الكومة',
        chkobba_round:          'رقم الطرح الحالي',
        chkobba_winner:         'ربح الطرح!',
        chkobba_target_points:  'وصلنا لـ',
        chkobba_tournament:     'تورنوا',
    },

    x18: {
        // Platform / shared UI (+18 variant)
        title:                  '🕵️‍♂️ شبيك تحشي فيه؟',
        settings_title:         'ركّح زبورك للطرح',
        players_label:          '👥 اساميكم:',
        add_player_btn:         '➕ زيد قحبون آخر',
        impostors_label:        '🎭 قداش من بلعوط؟',
        timer_label:            '⏱️ وقت الطرح',
        advanced_btn:           '🔧 زيد بعبص',
        adv_random:             '🎲 اللعبة تنيك روحها أمور كذابين',
        adv_chaos:              '😈 نيك حل فترية',
        adv_elimination:        '⚔️ نيك كل واحد وحدو',
        adv_nohint:             '🙈 الكذاب عصبة ليه',
        adv_allhint:            '💡 الكذابين الكل ياخذو نفس التلميح',
        start_btn:              '🚀 قدّم نيّك',
        reset_confirm:          'متأكد تحب تفسّخ الأسامي الكل وترجّع كل شي كيما كان؟',
        info_title:             'ℹ️ معلومة',
        close_btn:              'عصبة ليك',
        player_placeholder:     'اسم اللاعب',

        // Card reveal screen
        reveal_title:           '🃏 شكون شنية',
        reveal_instructions:    'اقعد بعبص في الكارتة باش تعرف دورك، كي تسيبو يرجع عليك',
        reveal_player_prefix:   'نمامتك يا',
        card_of:                'الكارتة متاع ',
        pass_to:                'ماك عرفت تحرك، نيك عدي للي بعدك ',
        all_seen:               'الناس الكل شافت.. ابدا العداد! 🚦',

        // Role strings
        impostor_role:          'يعطك عصبة راك كذاب 🤫',
        citizen_role:           'هاك حشيتو 🤠',
        hint_label:             'التلميح:',
        word_label:             'الكلمة:',

        // Discussion / timer screen
        discussion_title:       '💬 وقت تنيكلها أمها',
        starter_is:             '🗣️ الي يبدا يتكلم هو: ',
        starter_continue:       '🗣️ الي يكمل يتكلم هو: ',
        vote_btn:               '🗳️ سكر على زبي، عرفنا البلعوط',
        continue_discussion:    '⏱️ ارجعو قطعو وريشو (دقيقة بركا)',

        // Voting screen
        voting_title:           '🗳️ الفرز',
        who_impostor:           'شكونو هالزبور؟',

        // Result screen
        result_title:           '🏆 شكون طلع؟',
        next_round_btn:         '🔄 عاود انده',
        correct_guess:          'اوه على الزبي هاك طلعتو! 🎉 {name} طلع هو البلعوط.',
        wrong_guess:            'يعطك عصبة راك غالط! ❌ {name} خاطيه مسكين.',
        impostors_were:         'البلعوط (البلعوطين):',
        word_was:               'الكلمة طلعت:',
        all_impostors_dead:     'خرجتو الكذابين الكل! 🎉 المواطنين ربحو!',
        impostors_win:          'الكذابين غلبوكم وسيطرو عالطرح! 😈',
        eliminated_msg:         'طردنا {name} مالطرح!',
        elimination_cliffhanger:'أما الطرح مازال ما وفاش... زعما طلع هو الكذاب ولا؟ مانا قايلينلكم شي! 🤐',
    }
};

// ============================================================
// Info-icon descriptions (Advanced panel tooltips)
// These are Impostor-game specific but live here because the
// Advanced panel is rendered by the shared setup form.
// ============================================================
const infoDescriptions = {
    random: {
        tn:  'اللعبة باش تختار قداش من كذاب وحدها زهر، من غير ما تاخو بالرقم الي حطيتو (الماكس شطر الملاعبية).',
        x18: 'اللعبة باش تختار قداش من منيكين وحدها زهر، من غير ما تاخو بالرقم الي حطيتو (الماكس شطر الملاعبية).'
    },
    chaos: {
        tn:  'فما نسبة صغيرة (حكاية 15%) الي الطرح هذا الناس الكل تطلع كذابة! خلوضة كبيرة.',
        x18: 'فما نسبة صغيرة (حكاية 15%) الي الطرح هذا الناس الكل تطلع كذابة! خلوضة كبيرة.'
    },
    elimination: {
        tn:  'الي نصوتولو يخرج. كان طلع خاطيه، الطرح يكمل والكرونو يرجع يخدم حتى نخرجو الكذابين الكل ولا يغلبونا.',
        x18: 'الي تنيكو يخرج. كان طلع خاطيه، الطرح يكمل والكرونو يرجع يخدم حتى نخرجو البلعوطين الكل ولا يغلبونا.'
    },
    nohint: {
        tn:  'الكذاب ما يجيه حتى تلميح في الكارتة متاعو، سبورة كحلة! يلزمو يدبر راسو ويفهم الكلمة من كلام لخرين.',
        x18: 'الكذاب ما ينيك حتى عصبة من اللعبة، لا تلميح لا زبي. يلزمو يدبر راسو ويفهم الكلمة من كلام لخرين.'
    },
    allhint: {
        tn:  'كان فما برشا كذابين، الكلهم باش يجيهم التلميح الصحيح متاع الكلمة، باش يصعبو الطرح على العاديين.',
        x18: 'كان فما برشا كذابين، الكلهم باش يجيهم التلميح الصحيح متاع الكلمة، باش يصعبو الطرح على العاديين.'
    }
};

// ============================================================
// Apply translations to the DOM
// ============================================================
function applyTranslations() {
    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if (i18n[currentLang]?.[k]) el.innerText = i18n[currentLang][k];
    });
    // Update player input placeholders
    document.querySelectorAll('.player-input').forEach(inp => {
        inp.placeholder = i18n[currentLang].player_placeholder;
    });
    // Toggle active state on language pill buttons
    document.querySelectorAll('.lang-pill-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-lang') === currentLang);
    });
    // Toggle +18 body class for CSS-driven styling
    document.body.classList.toggle('lang-x18', currentLang === 'x18');
    // Keep game-mode-specific UI in sync
    if (typeof updateGameModeUI === 'function') updateGameModeUI();
}

// Expose globally for backward compatibility
window.i18n = i18n;
window.infoDescriptions = infoDescriptions;
window.applyTranslations = applyTranslations;
