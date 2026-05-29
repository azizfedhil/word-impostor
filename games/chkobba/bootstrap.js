import { bootstrapGamePage } from '../../shared/bootstrap/game-bootstrap.js';
import ChkobbaAnim from './animations.js';

window.ChkobbaAnim = ChkobbaAnim;

function patchChkobbaAssets() {
    const L = window.ChkobbaLogic;
    if (!L) return;
    const p = '../../';
    L.ASSETS.BACK = p + 'assets/chkobba/Chkobba_dos.webp';
    L.ASSETS.POINT = p + 'assets/chkobba/Chkobba_point.webp';
    const orig = L.getCardAsset.bind(L);
    L.getCardAsset = (card) => {
        const path = orig(card);
        return path.startsWith('assets/') ? p + path : path;
    };
}

bootstrapGamePage({
    slug: 'chkobba',
    gameMode: 'chkobba',
    title: '🃏 شكبّة',
    onlineOnly: true,
    afterScripts: async () => {
        patchChkobbaAssets();
    },
});
