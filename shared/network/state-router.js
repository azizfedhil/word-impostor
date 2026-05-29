/** Room state delegation by game mode (used as games split further). */
const ALLOWED_MODES = ['impostor', 'thief', 'spyfall', 'coup', 'chkobba'];

export function getRoomGameMode(room) {
    const mode = room?.config?.gameMode;
    return ALLOWED_MODES.includes(mode) ? mode : 'impostor';
}

const handlersByMode = new Map();

export function registerModeHandlers(mode, handlers) {
    handlersByMode.set(mode, handlers);
}

export function routeRoomState(room) {
    const mode = getRoomGameMode(room);
    const h = handlersByMode.get(mode) || handlersByMode.get('impostor');
    if (!h) return;
    const fn = h.byState?.[room.state] || h.fallback;
    if (typeof fn === 'function') fn(room);
}
