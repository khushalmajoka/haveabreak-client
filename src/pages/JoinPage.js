import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import logger from "../utils/logger";
import { BASE_URL, SITE_CONFIG } from "../config/config";
import STORAGE_KEYS from "../config/storageKeys";
import useLocalStorage from "../hooks/useLocalStorage";

/**
 * JoinPage — shareable room link landing page.
 *
 * Fixes:
 *  - WordBomb: server now always returns `status`, so the badge shows the
 *    correct value (waiting / live / ended) instead of a stale "Ended".
 *  - Join button is disabled when game is in progress or room is finished.
 *  - Spectate button is disabled when game has finished.
 *  - Cards Bluff: same status badge logic via bluff_check_result.
 */
export default function JoinPage({ game = "wordbomb" }) {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket, stableId } = useSocket();

  const isBluff = game === "cardsbluff";
  const gameEmoji = isBluff ? "🃏" : "💣";
  const gameMeta = isBluff
    ? { name: "Cards Bluff", color: "#7c3aed" }
    : { name: "Word Bomb", color: "#ff4d6d" };

  const [roomInfo, setRoomInfo] = useState(null);
  const [checking, setChecking] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mode, setMode] = useState(null); // 'join' | 'spectate'
  const [playerName, setPlayerName] = useLocalStorage(
    STORAGE_KEYS.PLAYER_NAME,
    "",
  );
  const [loading, setLoading] = useState(false);

  // ── 1. Check room on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return;
    logger.info("JoinPage: checking room", { roomCode, game });

    if (isBluff) {
      if (!socket) return;

      const onCheckResult = (data) => {
        logger.info("JoinPage: bluff room check result", data);
        if (!data.exists) setNotFound(true);
        else setRoomInfo(data);
        setChecking(false);
      };

      setChecking(true);
      setNotFound(false);
      socket.on("bluff_check_result", onCheckResult);
      socket.emit("bluff_check_room", { roomCode });

      return () => socket.off("bluff_check_result", onCheckResult);
    }

    // WordBomb — HTTP check
    fetch(`${BASE_URL}/api/rooms/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode }),
    })
      .then((r) => r.json())
      .then((data) => {
        logger.info("JoinPage: wordbomb room check result", data);
        if (!data.exists) setNotFound(true);
        else setRoomInfo(data);
        setChecking(false);
      })
      .catch(() => {
        setNotFound(true);
        setChecking(false);
      });
  }, [roomCode, isBluff, socket, game]);

  // ── 2. Socket join/error listeners ───────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onRoomJoined = ({ roomCode: rc }) => {
      setLoading(false);
      localStorage.setItem(STORAGE_KEYS.PLAYER_ID, stableId); // ← consistent key
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, playerName); // ← consistent key
      logger.info("Joined room, navigating to lobby", { roomCode: rc });
      navigate(`/${game}/room/${rc}`);
    };

    const onSpectateJoined = ({ roomCode: rc, status }) => {
      setLoading(false);
      logger.info("Spectating room", { roomCode: rc, status });
      if (isBluff) {
        navigate(`/cardsbluff/room/${rc}`, { state: { spectator: true } });
        return;
      }
      if (status === "playing")
        navigate(`/wordbomb/game/${rc}`, { state: { spectator: true } });
      else navigate(`/wordbomb/room/${rc}`, { state: { spectator: true } });
    };

    const onError = ({ message }) => {
      setLoading(false);
      toast.error(message);
      logger.error("JoinPage socket error", { message });
    };

    const joinEvent = isBluff ? "bluff_room_joined" : "room_joined";
    const spectateEvent = isBluff ? "bluff_spectate_joined" : "spectate_joined";
    const errorEvent = isBluff ? "bluff_error" : "error";

    socket.on(joinEvent, onRoomJoined);
    socket.on(spectateEvent, onSpectateJoined);
    socket.on(errorEvent, onError);

    return () => {
      socket.off(joinEvent, onRoomJoined);
      socket.off(spectateEvent, onSpectateJoined);
      socket.off(errorEvent, onError);
    };
  }, [socket, playerName, stableId, navigate, game, isBluff]);

  // ── 3. Handlers ──────────────────────────────────────────────────────────
  const handleJoin = () => {
    if (!playerName.trim()) return toast.error("Enter your name first!");
    setLoading(true);
    logger.info("Joining room from JoinPage", {
      roomCode,
      playerName,
      stableId,
    });
    socket.emit(isBluff ? "bluff_join_room" : "join_room", {
      roomCode: roomCode.toUpperCase(),
      playerName: playerName.trim(),
      playerId: stableId,
    });
  };

  const handleSpectate = () => {
    setLoading(true);
    logger.info("Spectating room", { roomCode, stableId });
    socket.emit(isBluff ? "bluff_spectate" : "spectate_room", {
      roomCode: roomCode.toUpperCase(),
      playerId: stableId,
    });
  };

  // ── 4. Derived state ──────────────────────────────────────────────────────
  const status = roomInfo?.status; // 'waiting' | 'playing' | 'finished'
  const isWaiting = status === "waiting";
  const isPlaying = status === "playing";
  const isFinished = status === "finished";
  const isFull = roomInfo?.joinable === false && isWaiting;
  const canJoin = isWaiting && roomInfo?.joinable;
  const canSpectate = !isFinished;

  // ── 5. Render ─────────────────────────────────────────────────────────────

  if (checking) {
    return (
      <Screen gameEmoji={gameEmoji}>
        <div
          style={{
            fontSize: "36px",
            marginBottom: "16px",
            animation: "pulse-ring 1.2s ease infinite",
          }}
        >
          {gameEmoji}
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
          Finding room{" "}
          <Code color={gameMeta.color}>{roomCode?.toUpperCase()}</Code>…
        </p>
      </Screen>
    );
  }

  if (notFound) {
    return (
      <Screen gameEmoji={gameEmoji}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
        <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>
          Room Not Found
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            marginBottom: "28px",
          }}
        >
          No room with code{" "}
          <Code color={gameMeta.color}>{roomCode?.toUpperCase()}</Code> exists,
          or it has expired.
        </p>
        <Btn onClick={() => navigate("/")} primary color={gameMeta.color}>
          Back to Home
        </Btn>
      </Screen>
    );
  }

  return (
    <Screen gameEmoji={gameEmoji}>
      {/* ── Room badge ── */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          background: `${gameMeta.color}12`,
          border: `1px solid ${gameMeta.color}30`,
          borderRadius: "12px",
          padding: "8px 18px",
          marginBottom: "16px",
        }}
      >
        <span style={{ fontSize: "20px" }}>{gameEmoji}</span>
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          {gameMeta.name}
        </span>
        <Code color={gameMeta.color}>{roomCode?.toUpperCase()}</Code>
        <StatusBadge status={status} />
      </div>

      {/* ── Player count + status message ── */}
      <div style={{ marginBottom: "28px" }}>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            marginBottom: "4px",
          }}
        >
          {roomInfo?.playerCount ?? 0} player
          {roomInfo?.playerCount !== 1 ? "s" : ""} in room
          {roomInfo?.maxPlayers && ` · max ${roomInfo.maxPlayers}`}
        </p>
        {isPlaying && (
          <p style={{ color: "#ff8c42", fontSize: "12px", fontWeight: 600 }}>
            🔴 Game is live — you can spectate but not join
          </p>
        )}
        {isFinished && (
          <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            This game has ended
          </p>
        )}
        {isFull && (
          <p style={{ color: "#ff8c42", fontSize: "12px", fontWeight: 600 }}>
            🔒 Room is full
          </p>
        )}
      </div>

      {/* ── Mode picker ── */}
      {!mode && (
        <div style={{ width: "100%", maxWidth: "450px" }}>
          {/* Join — only when waiting + joinable */}
          {canJoin ? (
            <ModeCard
              emoji="🎮"
              title="Join & Play"
              desc="Enter the lobby and play with others"
              color={gameMeta.color}
              onClick={() => setMode("join")}
            />
          ) : (
            <ModeCard
              emoji="🎮"
              title="Join & Play"
              desc={
                isPlaying
                  ? "Game is already in progress"
                  : isFinished
                    ? "This game has ended"
                    : isFull
                      ? "Room is full"
                      : "Joining unavailable"
              }
              color="#555"
              disabled
            />
          )}

          {/* Spectate */}
          {canSpectate ? (
            <ModeCard
              emoji="👁️"
              title="Spectate"
              desc={isPlaying ? "Watch the live game" : "Watch from the lobby"}
              color="#7c3aed"
              onClick={() => setMode("spectate")}
              style={{ marginTop: "12px" }}
            />
          ) : (
            <ModeCard
              emoji="👁️"
              title="Spectate"
              desc="Game has ended, nothing to watch"
              color="#555"
              disabled
              style={{ marginTop: "12px" }}
            />
          )}

          <button
            onClick={() => navigate("/")}
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "11px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              color: "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Back to Home
          </button>
        </div>
      )}

      {/* ── Join form ── */}
      {mode === "join" && (
        <div style={{ width: "100%", maxWidth: "450px" }}>
          <label style={labelStyle}>YOUR NAME</label>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
            style={inputStyle}
          />
          <Btn
            onClick={handleJoin}
            primary
            color={gameMeta.color}
            disabled={loading}
            style={{ marginTop: "12px" }}
          >
            {loading ? "Joining…" : "🎮 Join Room"}
          </Btn>
          <Btn onClick={() => setMode(null)} style={{ marginTop: "8px" }}>
            ← Back
          </Btn>
        </div>
      )}

      {/* ── Spectate confirm ── */}
      {mode === "spectate" && (
        <div style={{ width: "100%", maxWidth: "450px", textAlign: "center" }}>
          <div
            style={{
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.2)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "rgba(167,139,250,0.9)",
              lineHeight: 1.6,
            }}
          >
            👁️ As a spectator you can <strong>watch the game live</strong> but
            cannot play.
          </div>
          <Btn
            onClick={handleSpectate}
            color="#7c3aed"
            primary
            disabled={loading}
          >
            {loading ? "Joining…" : "👁️ Watch as Spectator"}
          </Btn>
          <Btn onClick={() => setMode(null)} style={{ marginTop: "8px" }}>
            ← Back
          </Btn>
        </div>
      )}
    </Screen>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Screen({ children, gameEmoji }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          width: "100%",
          maxWidth: "440px",
          animation: "fadeIn 0.3s ease",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <span style={{ fontSize: "28px" }}>🎮</span>
          <span
            style={{
              display: "block",
              fontWeight: 800,
              fontSize: "20px",
              marginTop: "6px",
              background: "linear-gradient(135deg, #ff4d6d, #ff8c42)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {SITE_CONFIG.app_name}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Code({ children, color = "#ff4d6d" }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 800,
        color,
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
  );
}

/**
 * StatusBadge — shows the real-time room status.
 * waiting  → green  "Waiting"
 * playing  → orange "Live"
 * finished → grey   "Ended"
 */
function StatusBadge({ status }) {
  const map = {
    waiting: { color: "#22d3a0", label: "● Waiting" },
    playing: { color: "#ff8c42", label: "🔴 Live" },
    finished: { color: "#6b6b82", label: "Ended" },
  };
  const { color, label } = map[status] || {
    color: "#6b6b82",
    label: "Unknown",
  };
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 700,
        color,
        background: `${color}18`,
        border: `1px solid ${color}33`,
        borderRadius: "20px",
        padding: "2px 8px",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </span>
  );
}

function ModeCard({ emoji, title, desc, color, onClick, disabled, style }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "18px 20px",
        background: `${color}0d`,
        border: `1px solid ${color}30`,
        borderRadius: "14px",
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
      onMouseEnter={(e) =>
        !disabled && (e.currentTarget.style.background = `${color}1a`)
      }
      onMouseLeave={(e) =>
        !disabled && (e.currentTarget.style.background = `${color}0d`)
      }
    >
      <span style={{ fontSize: "28px", flexShrink: 0 }}>{emoji}</span>
      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: "15px",
            color: disabled ? "var(--text-muted)" : color,
            marginBottom: "3px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          {desc}
        </div>
      </div>
      {!disabled && (
        <span
          style={{ marginLeft: "auto", color, opacity: 0.5, fontSize: "18px" }}
        >
          →
        </span>
      )}
    </button>
  );
}

function Btn({
  children,
  onClick,
  primary,
  color = "#ff4d6d",
  disabled,
  style,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "block",
        width: "100%",
        padding: "13px",
        background: primary
          ? `linear-gradient(135deg, ${color}, ${color}cc)`
          : "rgba(255,255,255,0.05)",
        border: primary ? "none" : "1px solid var(--border)",
        borderRadius: "10px",
        cursor: disabled ? "not-allowed" : "pointer",
        color: primary ? "#fff" : "var(--text-muted)",
        fontWeight: 700,
        fontSize: "14px",
        opacity: disabled ? 0.6 : 1,
        transition: "opacity 0.2s",
        fontFamily: "var(--font-display)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const labelStyle = {
  display: "block",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  marginBottom: "7px",
};

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--text)",
  fontSize: "15px",
  fontFamily: "var(--font-display)",
  boxSizing: "border-box",
  outline: "none",
};
