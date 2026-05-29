/**
 * Game routing: URL slugs ↔ Supabase config.gameMode values.
 */
export const GAME_ROUTES = {
  chkobba: {
    slug: 'chkobba',
    path: '/games/chkobba/',
    gameMode: 'chkobba',
    title: '🃏 شكبّة',
  },
  'manash-houni': {
    slug: 'manash-houni',
    path: '/games/manash-houni/',
    gameMode: 'spyfall',
    title: '🕶️ ماناش هوني',
  },
  'sare9-hakem-jalled': {
    slug: 'sare9-hakem-jalled',
    path: '/games/sare9-hakem-jalled/',
    gameMode: 'thief',
    title: '🗝️ سارق، حاكم، جلّاد',
  },
  'koul-w-bou3': {
    slug: 'koul-w-bou3',
    path: '/games/koul-w-bou3/',
    gameMode: 'coup',
    title: '👑 كول وبوّع',
  },
  'shkounou-houa': {
    slug: 'shkounou-houa',
    path: '/games/shkounou-houa/',
    gameMode: 'impostor',
    title: '🕵️‍♂️ شكونو هو؟',
  },
};

const MODE_TO_SLUG = Object.fromEntries(
  Object.values(GAME_ROUTES).map((r) => [r.gameMode, r.slug])
);

export function slugForGameMode(gameMode) {
  return MODE_TO_SLUG[gameMode] || 'shkounou-houa';
}

export function routeForSlug(slug) {
  return GAME_ROUTES[slug] || GAME_ROUTES['shkounou-houa'];
}

export function routeForGameMode(gameMode) {
  return routeForSlug(slugForGameMode(gameMode));
}

/** Resolve path relative to site root (works on GitHub Pages subpaths). */
export function siteRoot() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'games') return '/';
  const last = parts[parts.length - 1];
  if (last && last.includes('.')) parts.pop();
  if (parts[parts.length - 1] === 'games') parts.pop();
  const depth = parts.length;
  if (depth === 0) return './';
  return `${'../'.repeat(depth)}`;
}

export function gameHref(slug) {
  const r = routeForSlug(slug);
  const root = siteRoot();
  if (root === '/') return r.path;
  return `${root.replace(/\/?$/, '/')}games/${slug}/`;
}

export function navigateToGame(slug) {
  window.location.href = gameHref(slug);
}

export function launcherHref() {
  const root = siteRoot();
  return root === '/' ? '/' : root;
}

export function getRoomCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const code = (params.get('room') || '').trim().toUpperCase();
  return code.length >= 4 ? code : null;
}

/**
 * If ?room= is present, fetch room and redirect to the correct game entry when needed.
 * @param {object} opts
 * @param {string} opts.expectedGameMode - fixed mode for current page, or null on launcher
 * @param {function} opts.fetchRoom - async (code) => room | null
 */
export async function resolveRoomDeepLink({ expectedGameMode = null, fetchRoom }) {
  const code = getRoomCodeFromUrl();
  if (!code || typeof fetchRoom !== 'function') return { code: null, redirected: false };

  let room;
  try {
    room = await fetchRoom(code);
  } catch (_) {
    return { code, redirected: false, room: null };
  }
  if (!room) return { code, redirected: false, room: null };

  const mode = room.config?.gameMode;
  const allowed = ['impostor', 'thief', 'spyfall', 'coup', 'chkobba'];
  const resolved = allowed.includes(mode) ? mode : 'impostor';

  if (expectedGameMode && resolved !== expectedGameMode) {
    const slug = slugForGameMode(resolved);
    const href = gameHref(slug);
    const url = new URL(href, window.location.origin);
    url.searchParams.set('room', code);
    window.location.replace(url.pathname + url.search);
    return { code, redirected: true, room };
  }

  return { code, redirected: false, room };
}

export function stripRoomFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('room')) return;
  url.searchParams.delete('room');
  window.history.replaceState({}, document.title, url.pathname + url.search);
}
