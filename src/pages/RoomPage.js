import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import ShareButton from "../components/ShareButton";
import { HOW_TO_PLAY_GAMES } from "../data/howToPlay";

/**
 * RoomPage — Lobby for Word Bomb.
 * Host can configure all WordBomb settings here before starting.
 * How to Play button added to top bar.
 */
export default function RoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [room, setRoom] = useState(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const myStableId = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);

  useEffect(() => {
    if (!socket) return;

    // Request room state via socket — same channel as all other updates,
    // so there is no race condition between fetch and socket events
    socket.emit("get_room_state", { roomCode });

    const onRoomState = ({ room }) => {
      if (!room) return navigate("/");
      setRoom(room);
    };

    const onPlayerJoined = ({ players }) => {
      setRoom((r) => (r ? { ...r, players } : r));
      toast.success("A player joined!");
    };

    const onPlayerLeft = ({ playerName, players }) => {
      setRoom((r) => (r ? { ...r, players } : r));
      toast(`${playerName} left the room`, { icon: "👋" });
    };

    const onSettingsUpdated = ({ settings, players }) => {
      setRoom((r) => (r ? { ...r, settings, players } : r));
    };

    const onGameStarted = (data) => {
      navigate(`/wordbomb/game/${roomCode}`, { state: data });
    };

    const onError = ({ message }) => toast.error(message);

    socket.on("room_state", onRoomState);
    socket.on("player_joined", onPlayerJoined);
    socket.on("player_left", onPlayerLeft);
    socket.on("settings_updated", onSettingsUpdated);
    socket.on("game_started", onGameStarted);
    socket.on("error", onError);

    return () => {
      socket.off("room_state", onRoomState);
      socket.off("player_joined", onPlayerJoined);
      socket.off("player_left", onPlayerLeft);
      socket.off("settings_updated", onSettingsUpdated);
      socket.off("game_started", onGameStarted);
      socket.off("error", onError);
    };
  }, [socket, roomCode, navigate]);

  const isHost = room?.players?.find((p) => p.id === myStableId)?.isHost;
  const startGame = () => socket.emit("start_game", { roomCode });

  const updateSetting = useCallback(
    (key, value) => {
      socket.emit("update_settings", {
        roomCode,
        settings: { ...room.settings, [key]: value },
      });
    },
    [socket, roomCode, room],
  );

  if (!room) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
          Loading room...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: "700px",
        margin: "0 auto",
        padding: "24px 20px",
      }}
    >

      {/* ── Top bar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>💣</span>
          <span style={{ fontWeight: 800, fontSize: "16px" }}>Word Bomb</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setShowHowToPlay(true)} style={ghostBtn}>
            ❓ How to Play
          </button>
          <ShareButton roomCode={roomCode} game="wordbomb" />
        </div>
      </div>

      {/* ── Room Code Card ── */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "24px",
          marginBottom: "20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          ROOM CODE
        </div>
        <div
          style={{
            fontSize: "36px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "#ff4d6d",
          }}
        >
          {roomCode}
        </div>
        <p
          style={{
            marginTop: "8px",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          Share this code with friends to let them join
        </p>
      </div>

      {/* ── Settings (host only) ── */}
      {isHost && room.settings && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid rgba(255,77,109,0.25)",
            borderRadius: "var(--radius)",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              marginBottom: "14px",
              fontWeight: 600,
            }}
          >
            ⚙️ GAME SETTINGS
          </div>
          <div className="settings-grid">
            <SettingControl
              label="Lives"
              value={room.settings.maxLives}
              min={1}
              max={10}
              onChange={(v) => updateSetting("maxLives", v)}
            />
            <SettingControl
              label="Timer (s)"
              value={room.settings.turnTimer}
              min={5}
              max={60}
              onChange={(v) => updateSetting("turnTimer", v)}
            />
            <SettingControl
              label="Max Players"
              value={room.settings.maxPlayers}
              min={2}
              max={12}
              onChange={(v) => updateSetting("maxPlayers", v)}
            />
          </div>
        </div>
      )}

      {/* Non-host: show current settings read-only */}
      {!isHost && room.settings && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              marginBottom: "10px",
              fontWeight: 600,
            }}
          >
            ⚙️ SETTINGS
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <SettingReadOnly label="Lives" value={room.settings.maxLives} />
            <SettingReadOnly
              label="Timer"
              value={`${room.settings.turnTimer}s`}
            />
            <SettingReadOnly
              label="Max Players"
              value={room.settings.maxPlayers}
            />
          </div>
        </div>
      )}

      {/* ── Players List ── */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            marginBottom: "14px",
            fontWeight: 600,
          }}
        >
          👥 PLAYERS ({room.players.length}/{room.settings?.maxPlayers ?? 8})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {room.players.map((player, i) => (
            <div
              key={player.id || i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "10px",
                padding: "12px 14px",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: `hsl(${(i * 60) % 360}, 70%, 50%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {player.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>
                  {player.name}
                </span>
              </div>
              <div
                style={{ display: "flex", gap: "6px", alignItems: "center" }}
              >
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {"❤️".repeat(Math.min(player.lives, 5))}
                </span>
                {player.isHost && (
                  <span
                    style={{
                      fontSize: "10px",
                      background: "rgba(255,77,109,0.15)",
                      color: "#ff4d6d",
                      border: "1px solid rgba(255,77,109,0.3)",
                      borderRadius: "20px",
                      padding: "2px 8px",
                      fontWeight: 700,
                    }}
                  >
                    HOST
                  </span>
                )}
                {player.id === myStableId && (
                  <span
                    style={{
                      fontSize: "10px",
                      background: "rgba(34,211,160,0.12)",
                      color: "#22d3a0",
                      border: "1px solid rgba(34,211,160,0.25)",
                      borderRadius: "20px",
                      padding: "2px 8px",
                      fontWeight: 700,
                    }}
                  >
                    YOU
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Start / Waiting ── */}
      {isHost ? (
        <button
          onClick={startGame}
          disabled={room.players.length < 2}
          style={{
            width: "100%",
            padding: "16px",
            background:
              room.players.length >= 2
                ? "linear-gradient(135deg, #ff4d6d, #ff8c42)"
                : "rgba(255,255,255,0.06)",
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontWeight: 800,
            fontSize: "16px",
            opacity: room.players.length < 2 ? 0.5 : 1,
            cursor: room.players.length < 2 ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {room.players.length < 2
            ? "⏳ Waiting for more players…"
            : "🚀 Start Game"}
        </button>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "16px",
            color: "var(--text-muted)",
            fontSize: "14px",
            border: "1px dashed var(--border)",
            borderRadius: "12px",
          }}
        >
          ⏳ Waiting for host to start the game…
        </div>
      )}

      {/* ── How to Play Modal ── */}
      {showHowToPlay && (
        <HowToPlayModal
          game={HOW_TO_PLAY_GAMES.wordbomb}
          onClose={() => setShowHowToPlay(false)}
        />
      )}
    </div>
  );
}

// ── Setting Controls ──────────────────────────────────────────────────────────

function SettingControl({ label, value, min, max, onChange }) {
  return (
    <div
      style={{
        textAlign: "center",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "10px",
        padding: "12px 8px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "var(--text-muted)",
          marginBottom: "8px",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: "6px",
            color: "#fff",
            width: "26px",
            height: "26px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          −
        </button>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            minWidth: "28px",
            textAlign: "center",
          }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: "6px",
            color: "#fff",
            width: "26px",
            height: "26px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function SettingReadOnly({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
        {label}:
      </span>
      <span
        style={{
          fontSize: "13px",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── How to Play Modal ─────────────────────────────────────────────────────────

function HowToPlayModal({ game, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        zIndex: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(255,77,109,0.3)",
          borderRadius: "20px",
          padding: "32px",
          maxWidth: "520px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          animation: "bounce-in 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: 800 }}>
            {game.emoji} How to Play {game.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            marginBottom: "20px",
            fontStyle: "italic",
          }}
        >
          {game.tagline}
        </p>
        {game.sections.map((s) => (
          <div key={s.title} style={{ marginBottom: "18px" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "14px",
                color: game.color,
                marginBottom: "8px",
              }}
            >
              {s.title}
            </div>
            {s.body && (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  lineHeight: 1.7,
                }}
              >
                {s.body}
              </p>
            )}
            {s.steps && (
              <ul style={{ paddingLeft: "16px", margin: 0 }}>
                {s.steps.map((step, i) => (
                  <li
                    key={i}
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "13px",
                      lineHeight: 1.8,
                    }}
                  >
                    {step}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const ghostBtn = {
  padding: "7px 14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text-muted)",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-display)",
};
