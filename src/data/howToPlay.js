export const HOW_TO_PLAY_GAMES = {
  wordbomb: {
    name: 'Word Bomb',
    emoji: '💣',
    color: '#ff4d6d',
    tagline: 'A fast-paced word game where one wrong move costs you a life.',
    sections: [
      {
        title: '🎯 Objective',
        body: 'Be the last player standing. Every player starts with 3 lives (adjustable). Lose all your lives and you are eliminated.',
      },
      {
        title: '🏠 Setting Up',
        steps: [
          'One player creates a room and shares the 5-letter room code with friends.',
          'Up to 8 players can join. The host can adjust lives (1-10), timer (5-60s), and max players.',
          'Once everyone is in, the host presses Start Game.',
        ],
      },
      {
        title: '▶️ Gameplay',
        steps: [
          'Players take turns in order.',
          'Each turn, a random substring appears on screen, for example "OU", "TH", or "STR".',
          'The active player must type any valid English word that contains that substring.',
          'Example: substring "OU" means valid answers include "count", "flour", "compound", and "cloud".',
          'Press Enter or tap Submit to lock in your answer.',
          'If your word is valid, play passes to the next player with a new substring.',
        ],
      },
      {
        title: '💀 Losing a Life',
        steps: [
          'You lose 1 life if the timer runs out before you answer.',
          'You also lose a life if you submit an invalid word, meaning it is not a real word or does not contain the substring.',
          'Words already used in the current game cannot be reused.',
          'Once you lose all your lives, you are eliminated.',
        ],
      },
      {
        title: '🏆 Winning',
        body: 'The last player alive wins the round. Short, sharp, and brutal. Rematches are encouraged.',
      },
      {
        title: '💡 Tips',
        steps: [
          'Common substrings like "TH", "IN", and "ER" have hundreds of valid words. Stay calm.',
          'Harder substrings like "XY" or "QU" are rarer, but memorable words exist.',
          'Do not overthink it. Short words like "thing" or "other" are perfectly valid.',
          'Watch the timer bar at the top. It turns red when time is almost up.',
        ],
      },
    ],
    example: {
      title: 'Example Round',
      steps: [
        { player: 'Player 1', substring: 'OU', word: 'compound ✓', note: 'Valid, contains "ou"' },
        { player: 'Player 2', substring: 'MP', word: 'example ✗', note: 'Invalid, "example" has no "mp"' },
        { player: 'Player 2', note: 'Loses 1 life!' },
        { player: 'Player 3', substring: 'ST', word: 'castle ✓', note: 'Valid, contains "st"' },
      ],
    },
  },

  cardsbluff: {
    name: 'Cards Bluff',
    emoji: '🃏',
    color: '#7c3aed',
    tagline: 'A card game of deception. Bluff your way out, or get caught trying.',
    sections: [
      {
        title: '🎯 Objective',
        body: 'Be the first player to get rid of all your cards. A full standard deck of 52 cards is used.',
      },
      {
        title: '🏠 Setting Up',
        steps: [
          'One player creates a room and shares the room code.',
          '2-6 players join the lobby.',
          'The host presses Start Game. All 52 cards are automatically dealt equally to all players.',
          'Only you can see your own hand. Other players only see how many cards each person has.',
        ],
      },
      {
        title: '▶️ Your Turn',
        steps: [
          'Select one or more cards from your hand by tapping them.',
          'Choose a rank to claim, for example "I am playing 2 Kings".',
          'The claimed rank must be equal to or higher than the previous claim.',
          'Your selected cards go face-down into the pile. No one sees what you actually played, so you could be lying.',
          'Play passes to the next player.',
        ],
      },
      {
        title: '🎯 Challenging',
        steps: [
          'When it is your turn, if you think the previous player lied, press Challenge.',
          'The last played cards are revealed to everyone.',
          'If they were bluffing, they pick up the entire pile.',
          'If they were honest, you pick up the entire pile.',
          'The player who picks up the pile goes next, and a fresh round starts with no rank requirement.',
        ],
      },
      {
        title: '⏭️ Passing',
        steps: [
          'If you believe the last claim and do not want to challenge, you can Pass.',
          'You can also play cards instead of challenging or passing.',
          'If all other players pass in sequence, the pile is cleared. The player who made the last claim starts fresh.',
        ],
      },
      {
        title: '🏆 Winning',
        body: 'The first player to successfully play their last card wins, even if the next player challenges them. Empty hand means victory.',
      },
      {
        title: '💡 Strategy',
        steps: [
          'You do not have to bluff. Playing honestly makes challenges risky for opponents.',
          'Bluffing is most powerful when you are stuck with cards that do not match the required rank.',
          'Watch how many cards opponents have. A player with 1 card will likely bluff.',
          'The pile getting large means challenging becomes high-stakes.',
          'Claiming a high rank like Ace limits what future players can claim.',
        ],
      },
    ],
    example: {
      title: 'Example Round',
      steps: [
        { player: 'Aarav', action: 'Plays 2 cards', claim: 'Claims 2x Jacks', note: 'Might be lying!' },
        { player: 'Priya', action: 'Her turn', claim: 'Must claim >= Jack', note: 'Plays 3 cards claiming 3x Queens' },
        { player: 'Rohan', action: 'Challenges Priya!', claim: 'Cards revealed', note: 'Priya had 2 Queens and 1 Five. Bluff caught!' },
        { player: 'Priya', action: 'Goes next', claim: 'Fresh round starts', note: 'No rank requirement now' },
      ],
    },
  },
};
