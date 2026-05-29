import { bootstrapGamePage } from '../../shared/bootstrap/game-bootstrap.js';

bootstrapGamePage({
    slug: 'koul-w-bou3',
    gameMode: 'coup',
    title: '👑 كول وبوّع',
    onlineOnly: true,
}).catch((err) => {
    console.error('[bootstrap]', err);
    const t = document.getElementById('toast-msg');
    if (t) { t.innerText = 'خطأ في تحميل اللعبة — حدّث الصفحة.'; t.classList.add('show'); }
});
