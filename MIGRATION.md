# Multi-game entry migration

## Overview

The app is split into a **launcher** (`/index.html`) and **five isolated game entry points** under `/games/<slug>/`. Each game page sets a fixed `window.__DAKHEEL_GAME_MODE` before loading scripts so runtime state cannot switch to another game on the same page.

## Slug ↔ `config.gameMode`

| URL slug | Folder | Supabase `config.gameMode` |
|----------|--------|----------------------------|
| `shkounou-houa` | `games/shkounou-houa/` | `impostor` |
| `sare9-hakem-jalled` | `games/sare9-hakem-jalled/` | `thief` |
| `manash-houni` | `games/manash-houni/` | `spyfall` |
| `koul-w-bou3` | `games/koul-w-bou3/` | `coup` |
| `chkobba` | `games/chkobba/` | `chkobba` |

**Do not rename** `gameMode` values in the database; only URL paths use slugs.

## Module boundaries

- **`shared/`** — Reusable UI, audio, navigation, network helpers, social-deduction flows. Safe to import from any game.
- **`games/<slug>/`** — That game’s HTML, CSS, `bootstrap.js`, and game-specific logic only.
- **Do not** load another game’s `bootstrap.js` or game CSS on a given page.

## Navigation

- Launcher: plain links to `/games/<slug>/` (works without JS).
- `shared/navigation.js`: `navigateToGame(slug)`, `resolveRoomDeepLink()` for `?room=CODE`.
- Game header: “ارجع للألعاب” → site root launcher (no in-page mode switcher).

## Deep links

- Join: `/games/shkounou-houa/?room=ABCDEF` (or launcher `/?room=` → redirects after fetch).
- Wrong game URL + room: redirect to the slug matching `room.config.gameMode`.

## Social deduction trio

`impostor`, `thief`, and `spyfall` share `shared/social-deduction/` for offline/online round flow. Each game entry passes a **mode plugin** (`renderCard`, `handleVote`, `startOffline`, etc.) so shared code avoids `if (gameMode === …)` branches.

## PWA

`sw.js` caches launcher, `shared/`, and each `games/*/index.html`. Coup card PNGs are lazy-loaded in the Coup entry. Bump `CACHE_NAME` when cached assets change.

## Commit order (suggested)

1. Scaffold + `shared/navigation.js`
2. Shared UI/network extraction
3. Launcher-only root `index.html`
4. Chkobba → Coup → social-deduction package → three word games
5. Remove monolithic `app.js` / `online.js` from game pages
