/**
 * Design-resolution size — the single source of truth.
 *
 * Phaser's Scale Manager (see `config.ts`) fits and centers this virtual
 * resolution into whatever space the browser gives it. Write all
 * gameplay/layout code against these constants, never against
 * `window.innerWidth/innerHeight`.
 *
 * 🔴 **Why this lives in its own module, with no imports at all.**
 *
 * Two very different consumers need these numbers:
 *
 *   - `config.ts` — pulls in Phaser and every scene class. Browser only.
 *   - `debug/state-jump.ts` — the state-jump contract, which must stay
 *     importable by a bare Node process so `tests/state-jump.test.mjs`
 *     can run without a DOM or WebGL.
 *
 * If the constants lived in `config.ts`, the contract would have to either
 * drag Phaser into Node (it does not run there) or keep a hand-copied
 * duplicate. The duplicate was the first attempt, and it is exactly the
 * "same fact stored twice, drifts later" shape this template's other
 * comments keep warning about: nothing would fail if someone changed the
 * design resolution in one place only — the traversal assertion would keep
 * passing while asserting against stale bounds.
 *
 * A leaf module with zero imports serves both without either problem.
 * **Keep it import-free.** Adding any import here can re-break Node
 * importability for the contract and its tests.
 */
export const GAME_WIDTH = 960
export const GAME_HEIGHT = 540
