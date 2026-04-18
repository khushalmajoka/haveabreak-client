import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

const GAMES = {
  wordbomb: {
    name: 'Word Bomb',
    emoji: '💣',
    color: '#ff4d6d',
    tagline: 'A fast-paced word game where one wrong move costs you a life.',
    sections: [
      {
        title: '🎯 Objective',
        body: 'Be the last player standing. Every player starts with 3 lives (adjustable). Lose all your lives and you\'re eliminated.',
      },
      {
        title: '🏠 Setting Up',
        steps: [
          'One player creates a room and shares the 5-letter room code with friends.',
          'Up to 8 players can join. The host can adjust lives (1–10), timer (5–60s), and max players.',
          'Once everyone is in, the host presses Start Game.',
        ],
      },
      {
        title: '▶️ Gameplay',
        steps: [
          'Players take turns in order.',
          'Each turn, a random substring appears on screen — e.g. "OU", "TH", "STR".',
          'The active player must type any valid English word that contains that substring.',
          'Example: substring "OU" → valid answers include "count", "flour", "compound", "cloud".',
          'Press Enter or tap Submit to lock in your answer.',
          'If your word is valid, play passes to the next player with a new substring.',
        ],
      },
      {
        title: '💀 Losing a Life',
        steps: [
          'You lose 1 life if the timer runs out before you answer.',
          'You also lose a life if you submit an invalid word (not a real word, or doesn\'t contain the substring).',
          'Words already used in the current game cannot be reused.',
          'Once you lose all your lives, you\'re eliminated.',
        ],
      },
      {
        title: '🏆 Winning',
        body: 'The last player alive wins the round. Short, sharp, and brutal — rematches are encouraged.',
      },
      {
        title: '💡 Tips',
        steps: [
          'Common substrings like "TH", "IN", "ER" have hundreds of valid words — stay calm.',
          'Harder substrings like "XY" or "QU" are rarer but memorable words exist.',
          'Don\'t overthink — short words like "thing" or "other" are perfectly valid.',
          'Watch the timer bar at the top — it turns red when time is almost up.',
        ],
      },
    ],
    example: {
      title: 'Example Round',
      steps: [
        { player: 'Player 1', substring: 'OU', word: 'compound ✓', note: 'Valid — contains "ou"' },
        { player: 'Player 2', substring: 'MP', word: 'example ✗', note: 'Invalid — "example" has no "mp"' },
        { player: 'Player 2', note: 'Loses 1 life! ❤️❤️💔' },
        { player: 'Player 3', substring: 'ST', word: 'castle ✓', note: 'Valid — contains "st"' },
      ],
    },
  },

  cardsbluff: {
    name: 'Cards Bluff',
    emoji: '🃏',
    color: '#7c3aed',
    tagline: 'A card game of deception. Bluff your way out — or get caught trying.',
    sections: [
      {
        title: '🎯 Objective',
        body: 'Be the first player to get rid of all your cards. A full standard deck of 52 cards is used.',
      },
      {
        title: '🏠 Setting Up',
        steps: [
          'One player creates a room and shares the room code.',
          '2–6 players join the lobby.',
          'The host presses Start Game — all 52 cards are automatically dealt equally to all players.',
          'Only you can see your own hand. Other players only see how many cards each person has.',
        ],
      },
      {
        title: '▶️ Your Turn',
        steps: [
          'Select one or more cards from your hand by tapping them (they rise up when selected).',
          'Choose a rank to claim — e.g. "I\'m playing 2 Kings".',
          'The claimed rank must be equal to or higher than the previous claim.',
          'Your selected cards go face-down into the pile. No one sees what you actually played — you could be lying!',
          'Play passes to the next player.',
        ],
      },
      {
        title: '🎯 Challenging',
        steps: [
          'When it\'s your turn, if you think the previous player lied, press Challenge.',
          'The last played cards are revealed to everyone.',
          'If they were BLUFFING — they pick up the entire pile.',
          'If they were HONEST — you pick up the entire pile.',
          'The player who picks up the pile goes next, and a fresh round starts (no rank requirement).',
        ],
      },
      {
        title: '⏭️ Passing',
        steps: [
          'If you believe the last claim and don\'t want to challenge, you can Pass.',
          'You can also play cards instead of challenging or passing.',
          'If all other players pass in sequence, the pile is cleared. The player who made the last claim starts fresh.',
        ],
      },
      {
        title: '🏆 Winning',
        body: 'The first player to successfully play their last card wins — even if the next player challenges them. Empty hand = victory.',
      },
      {
        title: '💡 Strategy',
        steps: [
          'You don\'t have to bluff. Playing honestly makes challenges risky for opponents.',
          'Bluffing is most powerful when you\'re stuck with cards that don\'t match the required rank.',
          'Watch how many cards opponents have — a player with 1 card will likely bluff.',
          'The pile getting large means challenging becomes high-stakes.',
          'Claiming a high rank (like Ace) limits what future players can claim.',
        ],
      },
    ],
    example: {
      title: 'Example Round',
      steps: [
        { player: 'Aarav', action: 'Plays 2 cards', claim: 'Claims 2× Jacks', note: 'Might be lying!' },
        { player: 'Priya', action: 'Her turn', claim: 'Must claim ≥ Jack', note: 'Plays 3 cards claiming 3× Queens (bluff?)' },
        { player: 'Rohan', action: 'Challenges Priya!', claim: 'Cards revealed', note: 'Priya had 2× Queens and 1× 5 — BLUFF! Priya picks up the pile 😬' },
        { player: 'Priya', action: 'Goes next', claim: 'Fresh round starts', note: 'No rank requirement now' },
      ],
    },
  },
};

export default function HowToPlay() {
  const { game } = useParams();
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState(game || 'wordbomb');

  const g = GAMES[activeGame];

  return (
    <PageLayout title="How to Play" subtitle="Learn the rules for all GameZone games.">
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Game switcher */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '36px' }}>
          {Object.entries(GAMES).map(([id, info]) => (
            <button
              key={id}
              onClick={() => { setActiveGame(id); navigate(`/how-to-play/${id}`, { replace: true }); }}
              style={{
                padding: '10px 20px', borderRadius: '10px',
                background: activeGame === id ? `${info.color}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeGame === id ? `${info.color}44` : 'var(--border)'}`,
                color: activeGame === id ? info.color : 'var(--text-muted)',
                fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                transition: 'all 0.2s', fontFamily: 'var(--font-display)',
              }}
            >
              {info.emoji} {info.name}
            </button>
          ))}
        </div>

        {/* Game header */}
        <div style={{
          background: 'var(--bg-card)', border: `1px solid ${g.color}25`,
          borderRadius: '16px', padding: '24px', marginBottom: '32px',
          display: 'flex', gap: '16px', alignItems: 'center',
        }}>
          <div style={{ fontSize: '48px' }}>{g.emoji}</div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: g.color, marginBottom: '4px' }}>{g.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>{g.tagline}</p>
          </div>
        </div>

        {/* Sections */}
        {g.sections.map(section => (
          <div key={section.title} style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', color: '#f0f0f5' }}>
              {section.title}
            </h3>
            {section.body && (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.8 }}>{section.body}</p>
            )}
            {section.steps && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {section.steps.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)', borderRadius: '10px',
                  }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      background: `${g.color}18`, border: `1px solid ${g.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 800, color: g.color,
                    }}>{i + 1}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>{step}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderBottom: '1px solid var(--border)', marginTop: '24px' }} />
          </div>
        ))}

        {/* Example */}
        {g.example && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px' }}>📖 {g.example.title}</h3>
            <div style={{
              background: 'var(--bg-card)', border: `1px solid ${g.color}20`,
              borderRadius: '14px', overflow: 'hidden',
            }}>
              {g.example.steps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '12px', alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: i < g.example.steps.length - 1 ? '1px solid var(--border)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                }}>
                  {step.player && (
                    <span style={{
                      fontWeight: 700, fontSize: '13px', color: g.color,
                      minWidth: '70px', flexShrink: 0,
                    }}>{step.player}</span>
                  )}
                  {(step.word || step.action) && (
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '13px',
                      background: 'rgba(255,255,255,0.06)', borderRadius: '6px',
                      padding: '2px 8px', color: '#fff', flexShrink: 0,
                    }}>
                      {step.word || step.action}
                    </span>
                  )}
                  {step.claim && (
                    <span style={{ fontSize: '12px', color: '#a78bfa', flexShrink: 0 }}>{step.claim}</span>
                  )}
                  {step.substring && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      substring: <span style={{ fontFamily: 'var(--font-mono)', color: g.color }}>{step.substring}</span>
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto', textAlign: 'right' }}>
                    {step.note}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{
          textAlign: 'center', padding: '28px',
          background: `${g.color}08`,
          border: `1px solid ${g.color}20`,
          borderRadius: '16px',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
            Ready to play?
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '13px 32px',
              background: `linear-gradient(135deg, ${g.color}, ${g.color}cc)`,
              border: 'none', borderRadius: '12px',
              color: '#fff', fontWeight: 800, fontSize: '15px', cursor: 'pointer',
            }}
          >
            {g.emoji} Play {g.name}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
