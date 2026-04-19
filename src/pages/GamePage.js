import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import ShareButton from "../components/ShareButton";
import logger from "../utils/logger";
import DisconnectBanner from "../components/DisconnectBanner";
import STORAGE_KEYS from '../config/storageKeys';

export default function GamePage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected, stableId } = useSocket();

  const [players, setPlayers] = useState(location.state?.players || []);
  const [currentPlayer, setCurrentPlayer] = useState(
    location.state?.currentPlayer || null,
  );
  const [substring, setSubstring] = useState(location.state?.substring || "");
  const [timerDuration, setTimerDuration] = useState(
    location.state?.timerDuration || 15,
  );
  const [timeLeft, setTimeLeft] = useState(location.state?.timerDuration || 15);
  const [input, setInput] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [lastAction, setLastAction] = useState(null); // { type: 'correct'|'wrong'|'timeout', msg }
  const [shake, setShake] = useState(false);

  const myId = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
  const isSpectator = location.state?.spectator === true;
  const isMyTurn =
    !isSpectator &&
    (currentPlayer?.id === myId || currentPlayer?.socketId === myId);

  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    logger.info("GamePage mounted", {
      roomCode,
      myId,
      initialSubstring: location.state?.substring,
    });
  }, []);

  // Timer countdown
  useEffect(() => {
    if (gameOver) return;
    clearInterval(timerRef.current);
    setTimeLeft(timerDuration);
    logger.debug("Timer reset", {
      timerDuration,
      currentPlayer: currentPlayer?.name,
    });

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentPlayer, timerDuration, gameOver]);

  useEffect(() => {
    if (!socket) return;

    // Auto-rejoin the room after a socket reconnect.
    // Server updates the player's socketId so turn validation works again.
    const handleReconnect = () => {
      logger.info("Rejoining room after reconnect", { roomCode, stableId });
      socket.emit("join_room", {
        roomCode,
        playerName: localStorage.getItem("playerName") || "Player",
        playerId: stableId,
      });
    };

    window.addEventListener("socket:reconnected", handleReconnect);

    const onNextTurn = ({
      currentPlayer,
      substring,
      players,
      timerDuration,
    }) => {
      logger.info("Next turn", {
        player: currentPlayer.name,
        substring,
        timerDuration,
      });
      setCurrentPlayer(currentPlayer);
      setSubstring(substring);
      setPlayers(players);
      setTimerDuration(timerDuration);
      setInput("");
      setLastAction(null);
    };

    const onWordAccepted = ({ playerName, word, substring }) => {
      logger.info("Word accepted", { playerName, word, substring });
      setLastAction({ type: "correct", msg: `${playerName}: "${word}"` });
    };

    const onTimeUp = ({ playerName, livesLeft, isEliminated }) => {
      logger.warn("Time up", { playerName, livesLeft, isEliminated });
      clearInterval(timerRef.current);
      setLastAction({
        type: "timeout",
        msg: `${playerName} ran out of time! ${isEliminated ? "💀 Eliminated!" : `${livesLeft} lives left`}`,
      });
      setPlayers((ps) =>
        ps.map((p) =>
          p.name === playerName
            ? { ...p, lives: livesLeft, isAlive: !isEliminated }
            : p,
        ),
      );
    };

    const onWordResult = ({ success, reason }) => {
      if (!success) {
        logger.warn("Word rejected", { reason });
        toast.error(reason, { duration: 2500 });
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    };

    const onGameOver = ({ winner, players }) => {
      logger.info("Game over", {
        winner: winner?.name,
        totalPlayers: players.length,
      });
      clearInterval(timerRef.current);
      setGameOver(true);
      setWinner(winner);
      setPlayers(players);
    };

    const onPlayerLeft = ({ playerName, players }) => {
      logger.warn("Player left during game", {
        playerName,
        remainingPlayers: players.length,
      });
      setPlayers(players);
      toast(`${playerName} disconnected`, { icon: "👋" });
    };

    const onError = ({ message }) => {
      logger.error("Socket error in GamePage", { message });
      toast.error(message);
    };

    socket.on("next_turn", onNextTurn);
    socket.on("word_accepted", onWordAccepted);
    socket.on("time_up", onTimeUp);
    socket.on("word_result", onWordResult);
    socket.on("game_over", onGameOver);
    socket.on("player_left", onPlayerLeft);
    socket.on("error", onError);

    return () => {
      socket.off("next_turn", onNextTurn);
      socket.off("word_accepted", onWordAccepted);
      socket.off("time_up", onTimeUp);
      socket.off("word_result", onWordResult);
      socket.off("game_over", onGameOver);
      socket.off("player_left", onPlayerLeft);
      socket.off("error", onError);
      window.removeEventListener("socket:reconnected", handleReconnect);
    };
  }, [socket]);

  const submitWord = useCallback(() => {
    if (!input.trim() || !isMyTurn || !connected) return;
    logger.info("Submitting word", { word: input.trim(), substring, roomCode });
    logger.socket.emit("submit_word", { word: input.trim(), roomCode });
    socket.emit("submit_word", { roomCode, word: input.trim().toLowerCase() });
  }, [input, isMyTurn, socket, roomCode, substring]);

  useEffect(() => {
    if (isMyTurn) {
      logger.info("My turn started", { substring, timerDuration });
      inputRef.current?.focus();
    }
  }, [isMyTurn, currentPlayer]);

  const timerPercent = (timeLeft / timerDuration) * 100;
  const timerColor =
    timerPercent > 50 ? "#22d3a0" : timerPercent > 25 ? "#ff8c42" : "#ff4d6d";

  if (gameOver) {
    return (
      <GameOverScreen
        winner={winner}
        players={players}
        myId={myId}
        onHome={() => navigate("/")}
      />
    );
  }

  return (
    <div className="page-wrap">
      <DisconnectBanner connected={connected} />

      {/* Room Code Bar */}
      <div className="top-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Room: <span style={{ color: "#ff4d6d" }}>{roomCode}</span>
          </div>
          {isSpectator && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "#a78bfa",
                borderRadius: "20px",
                padding: "2px 8px",
              }}
            >
              👁️ SPECTATING
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShareButton roomCode={roomCode} game="wordbomb" />
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            💣 Word Bomb
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", flex: 1 }}>
        <div style={{ flex: 1 }}>
          {/* Players */}
          <div className="players-row">
            {players.map((player, i) => (
              <PlayerChip
                key={player.id || i}
                player={player}
                isActive={
                  currentPlayer?.id === player.id ||
                  currentPlayer?.socketId === player.socketId
                }
                isMe={player.id === myId || player.socketId === myId}
                colorIndex={i}
              />
            ))}
          </div>

          {/* Main Game Area */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "28px 24px",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {/* Timer bar */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  height: "4px",
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "2px",
                  overflow: "hidden",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${timerPercent}%`,
                    background: timerColor,
                    transition: "width 1s linear, background 0.5s",
                    boxShadow: `0 0 8px ${timerColor}`,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: timeLeft <= 5 ? "28px" : "20px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color: timerColor,
                  transition: "font-size 0.2s, color 0.5s",
                }}
              >
                {timeLeft}s
              </div>
            </div>

            {/* Current player */}
            <div style={{ marginBottom: "16px" }}>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  padding: "4px 12px",
                }}
              >
                {isMyTurn
                  ? "🎯 Your turn!"
                  : `⏳ ${currentPlayer?.name}'s turn`}
              </span>
            </div>

            {/* Substring */}
            <div style={{ marginBottom: "28px" }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  marginBottom: "8px",
                }}
              >
                TYPE A WORD CONTAINING
              </div>
              <div
                style={{
                  fontSize: "clamp(36px, 8vw, 56px)",
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.1em",
                  background: "linear-gradient(135deg, #ff4d6d, #ff8c42)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "bounce-in 0.3s ease",
                }}
              >
                {substring}
              </div>
            </div>

            {/* Input */}
            {isMyTurn && (
              <div style={{ animation: shake ? "shake 0.4s ease" : "none" }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitWord()}
                  placeholder={`Type a word with "${substring}"...`}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(255,77,109,0.06)",
                    border: "2px solid rgba(255,77,109,0.3)",
                    borderRadius: "12px",
                    color: "var(--text)",
                    fontSize: "18px",
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    marginBottom: "12px",
                  }}
                />
                <button
                  onClick={submitWord}
                  disabled={!connected}
                  className="btn-primary"
                >
                  {connected ? "Submit Word →" : "Reconnecting…"}
                </button>
              </div>
            )}

            {!isMyTurn && (
              <div
                style={{
                  padding: "14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px dashed var(--border)",
                  borderRadius: "12px",
                  color: "var(--text-muted)",
                  fontSize: "14px",
                }}
              >
                Waiting for {currentPlayer?.name} to answer...
              </div>
            )}
          </div>

          {/* Last Action Log */}
          {lastAction && (
            <div
              style={{
                textAlign: "center",
                padding: "10px 16px",
                background:
                  lastAction.type === "correct"
                    ? "rgba(34,211,160,0.1)"
                    : "rgba(255,77,109,0.08)",
                border: `1px solid ${lastAction.type === "correct" ? "rgba(34,211,160,0.3)" : "rgba(255,77,109,0.2)"}`,
                borderRadius: "10px",
                marginBottom: "16px",
                fontSize: "13px",
                color:
                  lastAction.type === "correct" ? "var(--green)" : "#ff8c42",
                animation: "fadeIn 0.3s ease",
              }}
            >
              {lastAction.type === "correct" ? "✓ " : "⚡ "}
              {lastAction.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerChip({ player, isActive, isMe, colorIndex }) {
  const hue = (colorIndex * 60) % 360;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        padding: "10px 12px",
        background: isActive ? `hsla(${hue},70%,50%,0.15)` : "var(--bg-card)",
        border: `1.5px solid ${isActive ? `hsla(${hue},70%,50%,0.5)` : "var(--border)"}`,
        borderRadius: "12px",
        opacity: player.isAlive ? 1 : 0.35,
        transition: "all 0.3s",
        transform: isActive ? "scale(1.05)" : "scale(1)",
        minWidth: "80px",
        boxShadow: isActive ? `0 0 16px hsla(${hue},70%,50%,0.2)` : "none",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: `hsl(${hue},70%,50%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: 700,
          color: "#fff",
          position: "relative",
        }}
      >
        {player.name?.[0]?.toUpperCase()}
        {isMe && (
          <div
            style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#22d3a0",
              border: "1.5px solid var(--bg-card)",
            }}
          />
        )}
      </div>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: isActive ? "#fff" : "var(--text-muted)",
        }}
      >
        {player.name?.length > 7 ? player.name.slice(0, 7) + "…" : player.name}
      </div>
      <div style={{ fontSize: "11px", display: "flex", gap: "1px" }}>
        {player.isAlive ? (
          Array.from({ length: player.lives }).map((_, i) => (
            <span key={i}>❤️</span>
          ))
        ) : (
          <span style={{ fontSize: "14px" }}>💀</span>
        )}
      </div>
    </div>
  );
}

function GameOverScreen({ winner, players, myId, onHome }) {
  const iWon = winner?.id === myId || winner?.socketId === myId;
  const sorted = [...players].sort((a, b) => b.lives - a.lives);

  useEffect(() => {
    logger.info("GameOverScreen shown", { winner: winner?.name, iWon });
  }, []);

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
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "40px 32px",
          maxWidth: "440px",
          width: "100%",
          textAlign: "center",
          animation: "bounce-in 0.4s ease",
        }}
      >
        <div style={{ fontSize: "56px", marginBottom: "12px" }}>
          {iWon ? "🏆" : "😵"}
        </div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            marginBottom: "6px",
            color: iWon ? "#ff8c42" : "var(--text)",
          }}
        >
          {iWon ? "You Won!" : "Game Over"}
        </h1>
        {winner && !iWon && (
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            🏆 <strong style={{ color: "#ff8c42" }}>{winner.name}</strong> wins!
          </p>
        )}

        {/* Leaderboard */}
        <div style={{ marginBottom: "28px" }}>
          {sorted.map((p, i) => (
            <div
              key={p.id || i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                marginBottom: "6px",
                background:
                  i === 0 ? "rgba(255,140,66,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${i === 0 ? "rgba(255,140,66,0.25)" : "var(--border)"}`,
                borderRadius: "10px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span style={{ fontSize: "16px" }}>
                  {["🥇", "🥈", "🥉"][i] || `${i + 1}.`}
                </span>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>
                  {p.name}
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {p.isAlive ? `❤️ ${p.lives} lives` : "💀 eliminated"}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onHome}
          style={{
            width: "100%",
            padding: "14px",
            background: "linear-gradient(135deg, #ff4d6d, #ff8c42)",
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontWeight: 800,
            fontSize: "15px",
          }}
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
}
