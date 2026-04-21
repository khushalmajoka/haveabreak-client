import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import logger from "../utils/logger";

/**
 * GameModal — create or join a room.
 * Settings have been intentionally removed here; the host configures
 * them inside the room lobby once players have joined.
 */
export default function GameModal({
  game,
  initialMode = null,
  onClose,
  onNavigate,
}) {
  const [mode, setMode] = useState(initialMode);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { socket, stableId } = useSocket();
  const overlayRef = useRef();
  const nameInputRef = useRef();

  useEffect(() => {
    if (nameInputRef.current) nameInputRef.current.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = ({ roomCode, playerId }) => {
      logger.info("Room created successfully", {
        roomCode,
        stableId,
        playerName,
      });
      setLoading(false);
      localStorage.setItem("playerId", stableId);
      localStorage.setItem("playerName", playerName);
      onNavigate(`/${game.id}/room/${roomCode}`);
    };

    const handleRoomJoined = ({ roomCode, playerId }) => {
      logger.info("Room joined successfully", {
        roomCode,
        stableId,
        playerName,
      });
      setLoading(false);
      localStorage.setItem("playerId", stableId);
      localStorage.setItem("playerName", playerName);
      onNavigate(`/${game.id}/room/${roomCode}`);
    };

    const handleError = ({ message }) => {
      logger.error("Socket error in GameModal", { message });
      setLoading(false);
      toast.error(message);
    };

    const createEvent =
      game.id === "cardsbluff" ? "bluff_room_created" : "room_created";
    const joinEvent =
      game.id === "cardsbluff" ? "bluff_room_joined" : "room_joined";
    const errorEvent = game.id === "cardsbluff" ? "bluff_error" : "error";

    socket.on(createEvent, handleRoomCreated);
    socket.on(joinEvent, handleRoomJoined);
    socket.on(errorEvent, handleError);

    return () => {
      socket.off(createEvent, handleRoomCreated);
      socket.off(joinEvent, handleRoomJoined);
      socket.off(errorEvent, handleError);
    };
  }, [socket, playerName, onNavigate, stableId, game.id]);

  const isBluff = game.id === "cardsbluff";
  const defaultSettings = { maxLives: 3, turnTimer: 15, maxPlayers: 8 };

  const handleCreate = () => {
    if (!playerName.trim()) return toast.error("Enter your name first!");
    logger.info("Emitting create_room", {
      game: game.id,
      playerName,
      stableId,
    });
    setLoading(true);
    const event = isBluff ? "bluff_create_room" : "create_room";
    logger.socket.emit(event, {
      playerName: playerName.trim(),
      settings: defaultSettings,
      playerId: stableId,
    });
    socket.emit(event, {
      playerName: playerName.trim(),
      settings: defaultSettings,
      playerId: stableId,
    });
  };

  const handleJoin = () => {
    if (!playerName.trim()) return toast.error("Enter your name first!");
    if (!roomCode.trim()) return toast.error("Enter a room code!");
    logger.info("Emitting join_room", {
      game: game.id,
      roomCode,
      playerName,
      stableId,
    });
    setLoading(true);
    const event = isBluff ? "bluff_join_room" : "join_room";
    logger.socket.emit(event, {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
      playerId: stableId,
    });
    socket.emit(event, {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
      playerId: stableId,
    });
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: `1px solid ${game.border}`,
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "420px",
          animation: "bounce-in 0.3s ease",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-muted)",
            width: "32px",
            height: "32px",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>
            {game.emoji}
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: game.color }}>
            {game.name}
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              marginTop: "4px",
            }}
          >
            {mode === null
              ? "Enter your name to play"
              : mode === "create"
                ? "Ready to create your room"
                : "Enter the room code to join"}
          </p>
        </div>

        {/* Name input — always shown */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>YOUR NAME</label>
          <input
            ref={nameInputRef}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && mode === "create" && handleCreate()
            }
            placeholder="e.g. Khushal"
            maxLength={20}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${playerName ? game.border : "var(--border)"}`,
              borderRadius: "10px",
              color: "var(--text)",
              fontSize: "15px",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Step: choose mode */}
        {mode === null && (
          <div style={{ display: "flex", gap: "12px" }}>
            <ModeBtn
              label="+ Create Room"
              sub="Be the host"
              color={game.color}
              onClick={() => setMode("create")}
            />
            <ModeBtn
              label="→ Join Room"
              sub="Enter a code"
              color="#888"
              onClick={() => setMode("join")}
            />
          </div>
        )}

        {/* Step: create — just confirm */}
        {mode === "create" && (
          <>
            <div style={{ display: "flex", gap: "10px" }}>
              {!initialMode && (
                <button onClick={() => setMode(null)} style={backBtnStyle}>
                  ← Back
                </button>
              )}
              <button
                onClick={handleCreate}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "13px",
                  background: loading ? "rgba(255,255,255,0.08)" : game.color,
                  border: "none",
                  borderRadius: "10px",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "14px",
                  opacity: loading ? 0.7 : 1,
                  transition: "all 0.2s",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Creating…" : "🎮 Create Room"}
              </button>
            </div>
            <p
              style={{
                textAlign: "center",
                marginTop: "12px",
                fontSize: "11px",
                color: "var(--text-muted)",
                opacity: 0.55,
              }}
            >
              ⚙️ Configure game settings inside the room
            </p>
          </>
        )}

        {/* Step: join — enter room code */}
        {mode === "join" && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>ROOM CODE</label>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="e.g. AB3XY"
                maxLength={6}
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${roomCode ? game.border : "var(--border)"}`,
                  borderRadius: "10px",
                  color: "var(--text)",
                  fontSize: "22px",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.15em",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {!initialMode && (
                <button onClick={() => setMode(null)} style={backBtnStyle}>
                  ← Back
                </button>
              )}
              <button
                onClick={handleJoin}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "13px",
                  background: loading ? "rgba(255,255,255,0.08)" : game.color,
                  border: "none",
                  borderRadius: "10px",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "14px",
                  opacity: loading ? 0.7 : 1,
                  transition: "all 0.2s",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Joining…" : "→ Join Room"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModeBtn({ label, sub, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "16px 12px",
        textAlign: "center",
        background: `${color}12`,
        border: `1px solid ${color}30`,
        borderRadius: "12px",
        color,
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${color}20`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = `${color}12`)}
    >
      <div style={{ fontSize: "14px", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "3px" }}>
        {sub}
      </div>
    </button>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  color: "var(--text-muted)",
  marginBottom: "6px",
  fontWeight: 600,
  letterSpacing: "0.05em",
};

const backBtnStyle = {
  padding: "13px 16px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--text-muted)",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
};
