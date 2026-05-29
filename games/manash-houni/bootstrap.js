import { bootstrapGamePage } from '../../shared/bootstrap/game-bootstrap.js';
import { initSocialDeductionGame } from '../../shared/social-deduction/init.js';

bootstrapGamePage({
    slug: 'manash-houni',
    gameMode: 'spyfall',
    title: '🕶️ ماناش هوني',
    afterScripts: async () => {
        initSocialDeductionGame({ mode: 'spyfall', title: '🕶️ ماناش هوني' });
    },
}).catch((err) => {
    console.error('[bootstrap]', err);
    const t = document.getElementById('toast-msg');
    if (t) { t.innerText = 'خطأ في تحميل اللعبة — حدّث الصفحة.'; t.classList.add('show'); }
});
