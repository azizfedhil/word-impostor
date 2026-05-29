import { bootstrapGamePage } from '../../shared/bootstrap/game-bootstrap.js';
import { initSocialDeductionGame } from '../../shared/social-deduction/init.js';

bootstrapGamePage({
    slug: 'shkounou-houa',
    gameMode: 'impostor',
    title: '🕵️‍♂️ شكونو هو؟',
    afterScripts: async () => {
        initSocialDeductionGame({ mode: 'impostor', title: '🕵️‍♂️ شكونو هو؟' });
    },
}).catch((err) => {
    console.error('[bootstrap]', err);
    const t = document.getElementById('toast-msg');
    if (t) { t.innerText = 'خطأ في تحميل اللعبة — حدّث الصفحة.'; t.classList.add('show'); }
});
