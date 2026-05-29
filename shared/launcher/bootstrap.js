import { mountLauncherHeader } from '../ui/layout.js';
import { registerServiceWorker } from '../bootstrap/register-sw.js';
import { resolveRoomDeepLink, stripRoomFromUrl } from '../navigation.js';

mountLauncherHeader();
registerServiceWorker('./sw.js');

async function initDeepLink() {
    if (!window.supabase) return;
    const SUPABASE_URL = 'https://rcxaxblhgpauodmcfetb.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_3xg9qkdYGUoaRdflCW58rg_xRdqg6ox';
    const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const fetchRoom = async (code) => {
        const { data, error } = await supa.from('rooms').select('*').eq('code', code).maybeSingle();
        if (error || !data) return null;
        return data;
    };

    const { redirected } = await resolveRoomDeepLink({ expectedGameMode: null, fetchRoom });
    if (!redirected) stripRoomFromUrl();
}

initDeepLink();
