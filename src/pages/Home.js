import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdBanner from '../components/AdBanner';
import GameModal from '../components/GameModal';
import { SITE_CONFIG } from "../config/config";

const GAMES = [
  {
    id: 'wordbomb',
    name: 'Word Bomb',
    emoji: '💣',
    description: 'Race against the clock! Type a word containing the given substring before time runs out.',
    tag: 'Live',
    available: true,
    color: '#ff4d6d',
    gradient: 'linear-gradient(135deg, rgba(255,77,109,0.15), rgba(255,140,66,0.1))',
    border: 'rgba(255,77,109,0.3)',
  },
  {
    id: 'cardsbluff',
    name: 'Cards Bluff',
    emoji: '🃏',
    description: 'Play cards face-down and claim any rank you want. Bluff your opponents — or get caught trying.',
    tag: 'Live',
    available: true,
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(91,33,182,0.1))',
    border: 'rgba(124,58,237,0.3)',
  },
  {
    id: "trivia",
    name: "Trivia Blitz",
    emoji: "🧠",
    description:
      "Answer trivia questions faster than your opponents. Knowledge is power.",
    tag: "Soon",
    available: false,
    color: "#7c3aed",
    gradient:
      "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(91,33,182,0.1))",
    border: "rgba(124,58,237,0.25)",
  },
  {
    id: 'drawing',
    name: 'Sketch & Guess',
    emoji: '🎨',
    description: 'Draw and let your friends guess what you\'re creating under pressure.',
    tag: 'Soon',
    available: false,
    color: '#22d3a0',
    gradient: 'linear-gradient(135deg, rgba(34,211,160,0.12), rgba(16,185,129,0.08))',
    border: 'rgba(34,211,160,0.2)',
  },
  {
    id: 'chess',
    name: 'Speed Chess',
    emoji: '♟️',
    description: 'Play lightning-fast chess against friends with custom time controls.',
    tag: 'Soon',
    available: false,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.08))',
    border: 'rgba(245,158,11,0.2)',
  },
];

export default function Home() {
  const [selectedGame, setSelectedGame] = useState(null);
  const navigate = useNavigate();
  const liveGames = GAMES.filter((game) => game.available);
  const upcomingGames = GAMES.filter((game) => !game.available);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Ad */}
      {/* <div style={{ padding: '12px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <AdBanner slot="top" />
      </div> */}

      {/* Header */}
      <header style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>🎮</span>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #ff4d6d, #ff8c42)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            {SITE_CONFIG.app_name}
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '420px', margin: '0 auto' }}>
          Multiplayer party games. Create or join a room and play with friends in real time.
        </p>
      </header>

      {/* Games Rows */}
      <main style={{
        flex: 1,
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
        padding: '40px 20px',
        overflow: 'hidden',
      }}>
        <GameRow
          title="Live Games"
          games={liveGames}
          onSelect={(game) => setSelectedGame(game)}
          onHowToPlay={(game) => navigate(`/how-to-play/${game.id}`)}
        />

        <GameRow
          title="Coming Soon"
          games={upcomingGames}
          onSelect={(game) => game.available && setSelectedGame(game)}
          onHowToPlay={(game) => navigate(`/how-to-play/${game.id}`)}
        />

        {/* Inline Ad between content */}
        {/* <div style={{ marginTop: '40px' }}>
          <AdBanner slot="inline" />
        </div> */}
      </main>

      {/* Bottom Ad */}
      {/* <div style={{ padding: '12px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <AdBanner slot="bottom" />
      </div> */}

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "24px 20px",
          color: "var(--text-muted)",
          fontSize: "13px",
          borderTop: "1px solid var(--border)",
          marginTop: "auto",
        }}
      >
        {/* Links */}
        <div style={{ marginBottom: "10px" }}>
          <Link
            to="/about"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.color = "#ff4d6d")}
            onMouseLeave={(e) => (e.target.style.color = "var(--text-muted)")}
          >
            About
          </Link>{" "}
          |{" "}
          <Link
            to="/contact"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.color = "#ff4d6d")}
            onMouseLeave={(e) => (e.target.style.color = "var(--text-muted)")}
          >
            Contact
          </Link>{" "}
          |{" "}
          <Link
            to="/privacy-policy"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.color = "#ff4d6d")}
            onMouseLeave={(e) => (e.target.style.color = "var(--text-muted)")}
          >
            Privacy Policy
          </Link>{" "}
          |{" "}
          <Link
            to="/terms"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.color = "#ff4d6d")}
            onMouseLeave={(e) => (e.target.style.color = "var(--text-muted)")}
          >
            Terms
          </Link>
        </div>

        {/* Branding */}
        <div style={{ fontSize: "12px", opacity: 0.8 }}>
          haveabreak © {new Date().getFullYear()} · Play fair, have fun 🎮
        </div>
      </footer>

      {/* Modal */}
      {selectedGame && (
        <GameModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onNavigate={(path) => navigate(path)}
        />
      )}
    </div>
  );
}

function GameRow({ title, games, onSelect, onHowToPlay }) {
  return (
    <section style={{ marginBottom: '34px' }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 800,
        marginBottom: '14px',
        color: 'var(--text)',
      }}>
        {title}
      </h2>

      <div style={{
        display: 'flex',
        gap: '18px',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '4px 4px 18px',
        scrollSnapType: 'x proximity',
        scrollPaddingLeft: '4px',
        WebkitOverflowScrolling: 'touch',
      }}>
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onSelect={() => onSelect(game)}
            onHowToPlay={(event) => {
              event.stopPropagation();
              onHowToPlay(game);
            }}
          />
        ))}
      </div>
    </section>
  );
}

function GameCard({ game, onSelect, onHowToPlay }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && game.available ? game.gradient : 'var(--bg-card)',
        border: `1px solid ${hovered && game.available ? game.border : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '24px',
        cursor: game.available ? 'pointer' : 'default',
        transition: 'all 0.25s ease',
        transform: hovered && game.available ? 'translateY(-3px)' : 'none',
        boxShadow: hovered && game.available ? `0 8px 32px rgba(0,0,0,0.4)` : 'none',
        animation: 'fadeIn 0.4s ease both',
        position: 'relative',
        overflow: 'hidden',
        flex: '0 0 clamp(260px, 32%, 330px)',
        minHeight: '260px',
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Tag */}
      <div style={{
        position: 'absolute',
        top: '14px',
        right: '14px',
        background: game.available ? `${game.color}22` : 'rgba(255,255,255,0.06)',
        border: `1px solid ${game.available ? `${game.color}44` : 'rgba(255,255,255,0.1)'}`,
        color: game.available ? game.color : 'var(--text-muted)',
        fontSize: '10px',
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        padding: '3px 8px',
        borderRadius: '20px',
        letterSpacing: '0.08em',
      }}>
        {game.tag}
      </div>

      {/* Emoji */}
      <div style={{ fontSize: '40px', marginBottom: '14px' }}>{game.emoji}</div>

      {/* Name */}
      <h2 style={{
        fontSize: '20px',
        fontWeight: 700,
        marginBottom: '8px',
        color: game.available ? game.color : 'var(--text)',
        opacity: game.available ? 1 : 0.6,
      }}>
        {game.name}
      </h2>

      {/* Description */}
      <p style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          marginBottom: '20px',
          opacity: game.available ? 1 : 0.6,
      }}>
        {game.description}
      </p>

      {/* Buttons */}
      {game.available ? (
        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', flexWrap: 'wrap' }}>
          <button
            style={{
              flex: 1,
              padding: '10px',
              background: `${game.color}18`,
              border: `1px solid ${game.color}40`,
              borderRadius: '8px',
              color: game.color,
              fontWeight: 700,
              fontSize: '13px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = `${game.color}28`}
            onMouseLeave={e => e.target.style.background = `${game.color}18`}
          >
            + Create Room
          </button>
          <button
            style={{
              flex: 1,
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'var(--text)',
              fontWeight: 700,
              fontSize: '13px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.09)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
          >
            → Join Room
          </button>
          <button
            onClick={onHowToPlay}
            aria-label={`How to play ${game.name}`}
            style={{
              flex: '1 0 100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${game.color}30`,
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '13px',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              e.target.style.background = `${game.color}18`;
              e.target.style.color = game.color;
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(255,255,255,0.04)';
              e.target.style.color = 'var(--text-muted)';
            }}
          >
            How to Play
          </button>
        </div>
      ) : (
        <div style={{
          padding: '10px',
          marginTop: 'auto',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.05em',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
        }}>
          Coming Soon
        </div>
      )}
    </div>
  );
}

const linkStyle = {
  color: "var(--text-muted)",
  textDecoration: "none",
  margin: "0 6px",
};
