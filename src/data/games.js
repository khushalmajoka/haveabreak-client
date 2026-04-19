// ── Game registry ─────────────────────────────────────────────────────────────
// Single source of truth for every game in the app.
//
// Adding a new game:
//   1. Add an entry here
//   2. Add routes in App.js using the id field
//   3. Add socket handlers on the server
//
// To temporarily disable a game without deleting its route:
//   set enabled: false — Home.js hides it, App.js can guard the route

const GAMES = [
  {
    id:          'wordbomb',
    name:        'Word Bomb',
    emoji:       '💣',
    description: 'Race against the clock! Type a word containing the given substring before time runs out.',
    tag:         'Live',
    enabled:     true,
    color:       '#ff4d6d',
    gradient:    'linear-gradient(135deg, rgba(255,77,109,0.15), rgba(255,140,66,0.1))',
    border:      'rgba(255,77,109,0.3)',
    // Routing — used in App.js and ShareButton
    routes: {
      join:  '/wordbomb/:roomCode',
      lobby: '/wordbomb/room/:roomCode',
      game:  '/wordbomb/game/:roomCode',
    },
  },
  {
    id:          'cardsbluff',
    name:        'Cards Bluff',
    emoji:       '🃏',
    description: "Play cards face-down and claim any rank you want. Bluff your opponents — or get caught trying.",
    tag:         'Live',
    enabled:     true,
    color:       '#7c3aed',
    gradient:    'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(91,33,182,0.1))',
    border:      'rgba(124,58,237,0.3)',
    routes: {
      join:  '/cardsbluff/:roomCode',
      lobby: '/cardsbluff/room/:roomCode',
      game:  null, // Cards Bluff has no separate game route — lobby handles playing
    },
  },
  {
    id:          'trivia',
    name:        'Trivia Blitz',
    emoji:       '🧠',
    description: 'Answer trivia questions faster than your opponents. Knowledge is power.',
    tag:         'Soon',
    enabled:     false,
    color:       '#7c3aed',
    gradient:    'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(91,33,182,0.1))',
    border:      'rgba(124,58,237,0.25)',
    routes:      null, // no routes until enabled
  },
  {
    id:          'drawing',
    name:        'Sketch & Guess',
    emoji:       '🎨',
    description: "Draw and let your friends guess what you're creating under pressure.",
    tag:         'Soon',
    enabled:     false,
    color:       '#22d3a0',
    gradient:    'linear-gradient(135deg, rgba(34,211,160,0.12), rgba(16,185,129,0.08))',
    border:      'rgba(34,211,160,0.2)',
    routes:      null,
  },
  {
    id:          'chess',
    name:        'Speed Chess',
    emoji:       '♟️',
    description: 'Play lightning-fast chess against friends with custom time controls.',
    tag:         'Soon',
    enabled:     false,
    color:       '#f59e0b',
    gradient:    'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.08))',
    border:      'rgba(245,158,11,0.2)',
    routes:      null,
  },
];

// Pre-filtered lists — import these directly instead of filtering every time
export const LIVE_GAMES     = GAMES.filter(g => g.enabled);
export const UPCOMING_GAMES = GAMES.filter(g => !g.enabled);

export default GAMES;