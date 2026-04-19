import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdBanner from "../components/AdBanner";
import GameModal from "../components/GameModal";
import { HOW_TO_PLAY_GAMES } from "../data/howToPlay";
import { SITE_CONFIG } from "../config/config";
import { LIVE_GAMES, UPCOMING_GAMES } from "../data/games";

export default function Home() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [howToPlayGame, setHowToPlayGame] = useState(null);
  const navigate = useNavigate();
  const liveGames = LIVE_GAMES;
  const upcomingGames = UPCOMING_GAMES;

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Top Ad */}
      {/* <div style={{ padding: '12px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <AdBanner slot="top" />
      </div> */}

      {/* Header */}
      <header style={{ padding: "24px 24px 0", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "32px" }}>🎮</span>
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 800,
              background: "linear-gradient(135deg, #ff4d6d, #ff8c42)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_CONFIG.app_name}
          </h1>
        </div>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "15px",
            maxWidth: "420px",
            margin: "0 auto",
          }}
        >
          Multiplayer party games. Create or join a room and play with friends
          in real time.
        </p>
      </header>

      {/* Games Rows */}
      <main
        style={{
          flex: 1,
          maxWidth: "1100px",
          margin: "0 auto",
          width: "100%",
          padding: "40px 20px",
          overflow: "hidden",
        }}
      >
        <GameRow
          title="Live Games"
          games={liveGames}
          onSelect={(game) => setSelectedGame(game)}
          onHowToPlay={(game) => setHowToPlayGame(game.id)}
        />

        <GameRow
          title="Coming Soon"
          games={upcomingGames}
          onSelect={(game) => game.available && setSelectedGame(game)}
          onHowToPlay={(game) => setHowToPlayGame(game.id)}
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

      {howToPlayGame && (
        <HowToPlayModal
          gameId={howToPlayGame}
          onClose={() => setHowToPlayGame(null)}
        />
      )}
    </div>
  );
}

function GameRow({ title, games, onSelect, onHowToPlay }) {
  return (
    <section style={{ marginBottom: "34px" }}>
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 800,
          marginBottom: "14px",
          color: "var(--text)",
        }}
      >
        {title}
      </h2>

      <div
        style={{
          display: "flex",
          gap: "18px",
          overflowX: "auto",
          overflowY: "hidden",
          padding: "4px 4px 18px",
          scrollSnapType: "x proximity",
          scrollPaddingLeft: "4px",
          WebkitOverflowScrolling: "touch",
        }}
      >
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
        background:
          hovered && game.available ? game.gradient : "var(--bg-card)",
        border: `1px solid ${hovered && game.available ? game.border : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: "24px",
        cursor: game.available ? "pointer" : "default",
        transition: "all 0.25s ease",
        transform: hovered && game.available ? "translateY(-3px)" : "none",
        boxShadow:
          hovered && game.available ? `0 8px 32px rgba(0,0,0,0.4)` : "none",
        animation: "fadeIn 0.4s ease both",
        position: "relative",
        overflow: "hidden",
        flex: "0 0 clamp(260px, 32%, 330px)",
        minHeight: "260px",
        scrollSnapAlign: "start",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Tag */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          background: game.available
            ? `${game.color}22`
            : "rgba(255,255,255,0.06)",
          border: `1px solid ${game.available ? `${game.color}44` : "rgba(255,255,255,0.1)"}`,
          color: game.available ? game.color : "var(--text-muted)",
          fontSize: "10px",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          padding: "3px 8px",
          borderRadius: "20px",
          letterSpacing: "0.08em",
        }}
      >
        {game.tag}
      </div>

      {/* Emoji */}
      <div style={{ fontSize: "40px", marginBottom: "14px" }}>{game.emoji}</div>

      {/* Name */}
      <h2
        style={{
          fontSize: "20px",
          fontWeight: 700,
          marginBottom: "8px",
          color: game.available ? game.color : "var(--text)",
          opacity: game.available ? 1 : 0.6,
        }}
      >
        {game.name}
      </h2>

      {/* Description */}
      <p
        style={{
          fontSize: "13px",
          color: "var(--text-muted)",
          lineHeight: 1.6,
          marginBottom: "20px",
          opacity: game.available ? 1 : 0.6,
        }}
      >
        {game.description}
      </p>

      {/* Buttons */}
      {game.available ? (
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "auto",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              flex: 1,
              padding: "10px",
              background: `${game.color}18`,
              border: `1px solid ${game.color}40`,
              borderRadius: "8px",
              color: game.color,
              fontWeight: 700,
              fontSize: "13px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.target.style.background = `${game.color}28`)
            }
            onMouseLeave={(e) =>
              (e.target.style.background = `${game.color}18`)
            }
          >
            + Create Room
          </button>
          <button
            style={{
              flex: 1,
              padding: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "var(--text)",
              fontWeight: 700,
              fontSize: "13px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.target.style.background = "rgba(255,255,255,0.09)")
            }
            onMouseLeave={(e) =>
              (e.target.style.background = "rgba(255,255,255,0.05)")
            }
          >
            → Join Room
          </button>
          <button
            onClick={onHowToPlay}
            aria-label={`How to play ${game.name}`}
            style={{
              flex: "1 0 100%",
              padding: "10px",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${game.color}30`,
              borderRadius: "8px",
              color: "var(--text-muted)",
              fontWeight: 700,
              fontSize: "13px",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = `${game.color}18`;
              e.target.style.color = game.color;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255,255,255,0.04)";
              e.target.style.color = "var(--text-muted)";
            }}
          >
            How to Play
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: "10px",
            marginTop: "auto",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.05em",
            border: "1px dashed var(--border)",
            borderRadius: "8px",
          }}
        >
          Coming Soon
        </div>
      )}
    </div>
  );
}

function HowToPlayModal({ gameId, onClose }) {
  const game = HOW_TO_PLAY_GAMES[gameId];

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  if (!game) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-title"
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "86vh",
          overflowY: "auto",
          background: "var(--bg-card)",
          border: `1px solid ${game.color}40`,
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
          animation: "bounce-in 0.28s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            alignItems: "flex-start",
            marginBottom: "22px",
          }}
        >
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <div style={{ fontSize: "42px" }}>{game.emoji}</div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                  marginBottom: "5px",
                }}
              >
                HOW TO PLAY
              </div>
              <h2
                id="how-to-play-title"
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: game.color,
                  marginBottom: "4px",
                }}
              >
                {game.name}
              </h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                {game.tagline}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close how to play"
            style={{
              width: "34px",
              height: "34px",
              flexShrink: 0,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-muted)",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            x
          </button>
        </div>

        {game.sections.map((section) => (
          <section key={section.title} style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 800,
                marginBottom: "10px",
                color: "#f0f0f5",
              }}
            >
              {section.title}
            </h3>
            {section.body && (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  lineHeight: 1.75,
                }}
              >
                {section.body}
              </p>
            )}
            {section.steps && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {section.steps.map((step, index) => (
                  <div
                    key={step}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  >
                    <span
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: `${game.color}18`,
                        border: `1px solid ${game.color}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: game.color,
                      }}
                    >
                      {index + 1}
                    </span>
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "14px",
                        lineHeight: 1.55,
                      }}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {game.example && (
          <section style={{ marginBottom: "6px" }}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 800,
                marginBottom: "10px",
              }}
            >
              {game.example.title}
            </h3>
            <div
              style={{
                border: `1px solid ${game.color}25`,
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {game.example.steps.map((step, index) => (
                <div
                  key={`${step.player || "step"}-${index}`}
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    padding: "11px 12px",
                    borderBottom:
                      index < game.example.steps.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    background:
                      index % 2 === 0
                        ? "rgba(255,255,255,0.015)"
                        : "transparent",
                    flexWrap: "wrap",
                  }}
                >
                  {step.player && (
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: "13px",
                        color: game.color,
                      }}
                    >
                      {step.player}
                    </span>
                  )}
                  {(step.word || step.action) && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        color: "#fff",
                      }}
                    >
                      {step.word || step.action}
                    </span>
                  )}
                  {step.claim && (
                    <span style={{ fontSize: "12px", color: game.color }}>
                      {step.claim}
                    </span>
                  )}
                  {step.substring && (
                    <span
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      substring:{" "}
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: game.color,
                        }}
                      >
                        {step.substring}
                      </span>
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginLeft: "auto",
                    }}
                  >
                    {step.note}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const linkStyle = {
  color: "var(--text-muted)",
  textDecoration: "none",
  margin: "0 6px",
};
