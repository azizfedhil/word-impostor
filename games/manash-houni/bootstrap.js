import { bootstrapGamePage } from '../../shared/bootstrap/game-bootstrap.js';
import { initSocialDeductionGame } from '../../shared/social-deduction/init.js';

bootstrapGamePage({
    slug: 'manash-houni',
    gameMode: 'spyfall',
    title: '🕶️ ماناش هوني',
    afterScripts: async () => {
        initSocialDeductionGame({ mode: 'spyfall', title: '🕶️ ماناش هوني' });
    },
});
