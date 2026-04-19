// ── localStorage key constants ────────────────────────────────────────────────
// Single source of truth for all localStorage keys used across the app.
// Always import from here — never hardcode key strings directly.
//
// Current inconsistency this fixes:
//   'stablePlayerId' (SocketContext) vs 'playerId' (JoinPage) — same value,
//   two different keys, causing silent null reads on reconnect.

const STORAGE_KEYS = {
  PLAYER_ID:   'stablePlayerId', // canonical key — was inconsistently 'playerId' in JoinPage
  PLAYER_NAME: 'playerName',
};

export default STORAGE_KEYS;