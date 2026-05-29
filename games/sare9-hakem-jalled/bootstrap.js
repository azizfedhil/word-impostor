import { bootstrapGamePage } from '../../shared/bootstrap/game-bootstrap.js';
import { initSocialDeductionGame } from '../../shared/social-deduction/init.js';

bootstrapGamePage({
    slug: 'sare9-hakem-jalled',
    gameMode: 'thief',
    title: '🗝️ سارق، حاكم، جلّاد',
    afterScripts: async () => {
        initSocialDeductionGame({ mode: 'thief', title: '🗝️ سارق، حاكم، جلّاد' });
    },
});
