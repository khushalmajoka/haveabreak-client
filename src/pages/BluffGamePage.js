import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import ShareButton from "../components/ShareButton";
import logger from "../utils/logger";
import DisconnectBanner from "../components/DisconnectBanner";

import { RANKS, SUIT_COLOR } from "../constants/cardConstants";
const RANK_ORDER = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

// ── Animation keyframes injected once ────────────────────────────────────────
const ANIM_CSS = `
@keyframes cardDeal {
  0%   { opacity: 0; transform: translate(-50%, -120%) rotate(var(--rot)) scale(0.7); }
  60%  { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1.05); }
  100% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
}
@keyframes cardShuffle {
  0%   { transform: translateX(0) rotate(0deg); }
  20%  { transform: translateX(-8px) rotate(-4deg); }
  40%  { transform: translateX(8px) rotate(4deg); }
  60%  { transform: translateX(-5px) rotate(-2deg); }
  80%  { transform: translateX(5px) rotate(2deg); }
  100% { transform: translateX(0) rotate(0deg); }
}
@keyframes cardPlay {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  40%  { transform: translateY(-24px) scale(1.12); opacity: 1; }
  100% { transform: translateY(80px) scale(0.85); opacity: 0; }
}
@keyframes cardPickup {
  0%   { transform: translateX(0) rotate(0deg); opacity: 1; }
  100% { transform: translateX(-60px) rotate(-15deg); opacity: 0; }
}
@keyframes pilePulse {
  0%   { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
  70%  { box-shadow: 0 0 0 12px rgba(124,58,237,0); }
  100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
}
@keyframes revealFlip {
  0%   { transform: rotateY(0deg); }
  50%  { transform: rotateY(90deg); }
  100% { transform: rotateY(0deg); }
}
@keyframes bluffCaught {
  0%, 100% { transform: translateX(0); }
  15%  { transform: translateX(-8px) rotate(-2deg); }
  30%  { transform: translateX(8px)  rotate(2deg); }
  45%  { transform: translateX(-6px); }
  60%  { transform: translateX(6px); }
  75%  { transform: translateX(-3px); }
}
`;

function injectStyles() {
  if (document.getElementById("bluff-animations")) return;
  const el = document.createElement("style");
  el.id = "bluff-animations";
  el.textContent = ANIM_CSS;
  document.head.appendChild(el);
}

export default function BluffGamePage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, stableId, connected } = useSocket();
  const isSpectator = location.state?.spectator === true;

  const [gameState, setGameState] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [claimedRank, setClaimedRank] = useState("");
  const [showReveal, setShowReveal] = useState(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [dealAnim, setDealAnim] = useState(false); // dealing animation flag
  const [shuffleAnim, setShuffleAnim] = useState(false); // shuffling animation flag
  const [playedAnim, setPlayedAnim] = useState(null); // { playerName, count }
  const logRef = useRef(null);
  const prevStatus = useRef(null);

  const myId = stableId;

  useEffect(() => {
    injectStyles();
  }, []);

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    if (isSpectator) {
      socket.emit("bluff_spectate", { roomCode });
    } else {
      socket.emit("bluff_join_room", {
        roomCode,
        playerName: localStorage.getItem("playerName") || "Player",
        playerId: stableId,
      });
    }

    // Auto-rejoin after reconnect so server has the updated socketId
    const handleReconnect = () => {
      logger.info("[Bluff] Rejoining room after reconnect", {
        roomCode,
        stableId,
      });
      socket.emit("bluff_join_room", {
        roomCode,
        playerName: localStorage.getItem("playerName") || "Player",
        playerId: stableId,
      });
    };

    window.addEventListener("socket:reconnected", handleReconnect);

    const onState = (state) => {
      logger.debug("[Bluff] State update", {
        status: state.status,
        pile: state.pileCount,
      });

      // Detect transition from waiting → playing to trigger deal animation
      if (prevStatus.current === "waiting" && state.status === "playing") {
        setShuffleAnim(true);
        setTimeout(() => {
          setShuffleAnim(false);
          setDealAnim(true);
        }, 900);
        setTimeout(() => setDealAnim(false), 2600);
      }
      prevStatus.current = state.status;

      setGameState(state);
      setTimeout(() => {
        if (logRef.current)
          logRef.current.scrollTop = logRef.current.scrollHeight;
      }, 50);
    };

    const onGameStarted = ({ firstPlayer }) => {
      toast.success(`Game started! ${firstPlayer} goes first.`);
      setSelectedCards([]);
      setClaimedRank("");
    };

    const onCardsPlayed = ({ playerName, count, claimedRank }) => {
      if (playerName !== getMyPlayerStatic()?.name) {
        toast(
          `${playerName} played ${count} card${count > 1 ? "s" : ""}, claiming ${count}× ${claimedRank}`,
          { icon: "🃏" },
        );
      }
      setPlayedAnim({ playerName, count });
      setTimeout(() => setPlayedAnim(null), 700);
    };

    const onChallengeResult = (data) => {
      setShowReveal(data);
      setTimeout(() => setShowReveal(null), 4500);
    };

    const onPileClear = () =>
      toast("Pile cleared — new round!", { icon: "🔄" });
    const onPassed = ({ playerName }) => {
      if (playerName !== getMyPlayerStatic()?.name)
        toast(`${playerName} passed`, { icon: "⏭️" });
    };
    const onGameOver = ({ winner }) =>
      logger.info("[Bluff] Game over", { winner: winner?.name });
    const onPlayerJoined = ({ playerName }) =>
      toast(`${playerName} joined!`, { icon: "👋" });
    const onPlayerLeft = ({ playerName }) =>
      toast(`${playerName} left`, { icon: "🚪" });
    const onError = ({ message }) => {
      toast.error(message);
      logger.error("[Bluff] Error", { message });
    };
    const onSettingsUpdated = () => {}; // state broadcast will follow

    socket.on("bluff_state", onState);
    socket.on("bluff_game_started", onGameStarted);
    socket.on("bluff_cards_played", onCardsPlayed);
    socket.on("bluff_challenge_result", onChallengeResult);
    socket.on("bluff_pile_cleared", onPileClear);
    socket.on("bluff_passed", onPassed);
    socket.on("bluff_game_over", onGameOver);
    socket.on("bluff_player_joined", onPlayerJoined);
    socket.on("bluff_player_left", onPlayerLeft);
    socket.on("bluff_error", onError);
    socket.on("bluff_settings_updated", onSettingsUpdated);

    return () => {
      socket.off("bluff_state", onState);
      socket.off("bluff_game_started", onGameStarted);
      socket.off("bluff_cards_played", onCardsPlayed);
      socket.off("bluff_challenge_result", onChallengeResult);
      socket.off("bluff_pile_cleared", onPileClear);
      socket.off("bluff_passed", onPassed);
      socket.off("bluff_game_over", onGameOver);
      socket.off("bluff_player_joined", onPlayerJoined);
      socket.off("bluff_player_left", onPlayerLeft);
      socket.off("bluff_error", onError);
      socket.off("bluff_settings_updated", onSettingsUpdated);
      window.removeEventListener("socket:reconnected", handleReconnect);
    };
  }, [socket, roomCode, stableId, isSpectator]);

  // Need a non-stale reference for the onCardsPlayed handler above
  const getMyPlayerStatic = () =>
    gameState?.players?.find((p) => p.id === myId);

  const getMyPlayer = useCallback(
    () => gameState?.players?.find((p) => p.id === myId),
    [gameState, myId],
  );

  const isMyTurn =
    !isSpectator &&
    gameState?.status === "playing" &&
    gameState?.players?.[gameState.currentPlayerIndex]?.id === myId;

  const canChallenge =
    !isSpectator &&
    gameState?.status === "playing" &&
    gameState?.lastClaim &&
    gameState?.lastClaim?.playerId !== myId &&
    gameState?.players?.[gameState.currentPlayerIndex]?.id === myId;

  const toggleCard = (cardId) =>
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId],
    );

  const handlePlay = () => {
    if (!connected) return toast.error("Reconnecting — please wait");
    if (!selectedCards.length) return toast.error("Select at least 1 card");
    if (!claimedRank) return toast.error("Choose a rank to claim");
    socket.emit("bluff_play_cards", {
      roomCode,
      cardIds: selectedCards,
      claimedRank,
    });
    setSelectedCards([]);
    setClaimedRank("");
  };

  const handleChallenge = () => {
    if (!connected) return toast.error("Reconnecting — please wait");
    logger.info("[Bluff] Challenging");
    socket.emit("bluff_challenge", { roomCode });
  };

  const handlePass = () => {
    if (!connected) return toast.error("Reconnecting — please wait");
    logger.info("[Bluff] Passing");
    socket.emit("bluff_pass", { roomCode });
  };

  const handleStart = () => socket.emit("bluff_start_game", { roomCode });

  const updateSetting = (key, value) => {
    socket.emit("bluff_update_settings", {
      roomCode,
      settings: { ...gameState.settings, [key]: value },
    });
  };

  const myPlayer = getMyPlayer();
  const isHost = myPlayer?.isHost;

  if (gameState?.status === "finished") {
    return (
      <GameOverScreen
        gameState={gameState}
        myId={myId}
        onHome={() => navigate("/")}
      />
    );
  }

  if (!gameState) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🃏</div>
          Connecting to room…
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "16px",
      }}
    >
      <DisconnectBanner connected={connected} />

      {/* ── Top bar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Room: <span style={{ color: "#7c3aed" }}>{roomCode}</span>
          </span>
          {isSpectator && <SpectatorBadge />}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setShowHowToPlay(true)} className="btn-ghost">
            ❓ How to Play
          </button>
          <ShareButton roomCode={roomCode} game="cardsbluff" />
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            🃏 Cards Bluff
          </span>
        </div>
      </div>

      {/* ── Players row ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
          justifyContent: "center",
        }}
      >
        {gameState.players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            isActive={
              gameState.status === "playing" &&
              gameState.currentPlayerIndex === i
            }
            isMe={p.id === myId}
            colorIndex={i}
          />
        ))}
      </div>

      <div className="bluff-layout">
        {/* ── Left: Main play area ── */}
        <div className="bluff-main">
          {/* Pile + last claim */}
          <PileDisplay
            gameState={gameState}
            shuffleAnim={shuffleAnim}
            dealAnim={dealAnim}
            playedAnim={playedAnim}
          />

          {/* ── Waiting lobby ── */}
          {gameState.status === "waiting" && (
            <WaitingLobby
              gameState={gameState}
              isHost={isHost}
              isSpectator={isSpectator}
              onStart={handleStart}
              onUpdateSetting={updateSetting}
            />
          )}

          {/* ── Action area — my turn ── */}
          {gameState.status === "playing" && isMyTurn && !canChallenge && (
            <PlayArea
              myPlayer={myPlayer}
              selectedCards={selectedCards}
              claimedRank={claimedRank}
              lastClaim={gameState.lastClaim}
              onToggleCard={toggleCard}
              onClaimRank={setClaimedRank}
              onPlay={handlePlay}
              onPass={handlePass}
            />
          )}

          {/* ── Challenge or pass ── */}
          {gameState.status === "playing" && isMyTurn && canChallenge && (
            <ChallengeArea
              lastClaim={gameState.lastClaim}
              myPlayer={myPlayer}
              selectedCards={selectedCards}
              claimedRank={claimedRank}
              onToggleCard={toggleCard}
              onClaimRank={setClaimedRank}
              onPlay={handlePlay}
              onChallenge={handleChallenge}
              onPass={handlePass}
            />
          )}

          {/* ── Waiting for others ── */}
          {gameState.status === "playing" && !isMyTurn && !isSpectator && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "20px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "14px",
              }}
            >
              ⏳ Waiting for{" "}
              <strong style={{ color: "#fff" }}>
                {gameState.currentPlayer?.name}
              </strong>{" "}
              to play…
            </div>
          )}

          {/* ── Spectator ── */}
          {isSpectator && gameState.status === "playing" && (
            <div
              style={{
                background: "rgba(124,58,237,0.06)",
                border: "1px solid rgba(124,58,237,0.2)",
                borderRadius: "16px",
                padding: "16px",
                textAlign: "center",
                color: "rgba(167,139,250,0.8)",
                fontSize: "13px",
              }}
            >
              👁️ Spectating — {gameState.currentPlayer?.name}'s turn
            </div>
          )}
        </div>

        {/* ── Right: Game log ── */}
        <div className="bluff-log">
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              marginBottom: "10px",
            }}
          >
            GAME LOG
          </div>
          <div
            ref={logRef}
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            {(gameState.log || []).map((entry, i) => (
              <div
                key={i}
                style={{
                  fontSize: "11px",
                  lineHeight: 1.5,
                  color:
                    entry.type === "caught"
                      ? "#ff4d6d"
                      : entry.type === "safe"
                        ? "#22d3a0"
                        : entry.type === "win"
                          ? "#ff8c42"
                          : entry.type === "start"
                            ? "#a78bfa"
                            : "var(--text-muted)",
                  borderLeft: `2px solid ${
                    entry.type === "caught"
                      ? "rgba(255,77,109,0.4)"
                      : entry.type === "safe"
                        ? "rgba(34,211,160,0.4)"
                        : entry.type === "win"
                          ? "rgba(255,140,66,0.4)"
                          : "rgba(255,255,255,0.08)"
                  }`,
                  paddingLeft: "8px",
                }}
              >
                {entry.msg}
              </div>
            ))}
            {(!gameState.log || gameState.log.length === 0) && (
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.2)",
                  fontStyle: "italic",
                }}
              >
                Game events will appear here…
              </div>
            )}
          </div>
        </div>
      </div>

      {showReveal && <ChallengeReveal data={showReveal} />}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </div>
  );
}

// ── Pile Display with animations ───────────────────────────────────────────

function PileDisplay({ gameState, shuffleAnim, dealAnim, playedAnim }) {
  const isEmpty = gameState.pileCount === 0 && gameState.status === "playing";

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "12px",
        textAlign: "center",
        animation: playedAnim ? "pilePulse 0.6s ease" : "none",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
          marginBottom: "10px",
        }}
      >
        PILE
      </div>

      {/* Card stack visual */}
      <div
        style={{
          position: "relative",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "8px",
        }}
      >
        {shuffleAnim ? (
          /* Shuffle animation — 3 cards fanning and shaking */
          <div style={{ position: "relative", width: "120px", height: "72px" }}>
            {["-12deg", "0deg", "12deg"].map((rot, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${i * 10}px`,
                  top: 0,
                  width: "48px",
                  height: "68px",
                  background: "linear-gradient(135deg, #4c1d95, #7c3aed)",
                  borderRadius: "8px",
                  border: "1.5px solid rgba(167,139,250,0.4)",
                  transform: `rotate(${rot})`,
                  animation: `cardShuffle 0.6s ease ${i * 0.1}s infinite`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    fontSize: "20px",
                  }}
                >
                  🃏
                </div>
              </div>
            ))}
          </div>
        ) : dealAnim ? (
          /* Deal animation — cards flying out */
          <div style={{ position: "relative", width: "60px", height: "72px" }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(135deg, #4c1d95, #7c3aed)",
                  borderRadius: "8px",
                  border: "1.5px solid rgba(167,139,250,0.4)",
                  animation: `cardDeal 0.45s ease ${i * 0.18}s both`,
                  "--rot": `${(i - 1.5) * 8}deg`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}
              />
            ))}
          </div>
        ) : isEmpty ? (
          /* Empty pile */
          <div
            style={{
              width: "52px",
              height: "72px",
              borderRadius: "8px",
              border: "2px dashed rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.2)",
              fontSize: "11px",
            }}
          >
            empty
          </div>
        ) : (
          /* Stacked cards visual */
          <div
            style={{
              position: "relative",
              width: `${Math.min(gameState.pileCount * 3 + 48, 90)}px`,
              height: "72px",
            }}
          >
            {Array.from({ length: Math.min(gameState.pileCount, 6) }).map(
              (_, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${i * Math.min(gameState.pileCount > 1 ? 6 : 0, 8)}px`,
                    top: `${-i * 1}px`,
                    width: "52px",
                    height: "72px",
                    background:
                      i === Math.min(gameState.pileCount, 6) - 1
                        ? "linear-gradient(135deg, #3b0764, #6d28d9)"
                        : `hsl(${260 + i * 10}, 60%, ${18 + i * 3}%)`,
                    borderRadius: "8px",
                    border: `1.5px solid rgba(167,139,250,${0.15 + i * 0.1})`,
                    boxShadow:
                      i === Math.min(gameState.pileCount, 6) - 1
                        ? "0 4px 16px rgba(124,58,237,0.35)"
                        : "0 2px 4px rgba(0,0,0,0.3)",
                    zIndex: i,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize:
                      i === Math.min(gameState.pileCount, 6) - 1
                        ? "20px"
                        : "14px",
                  }}
                >
                  {i === Math.min(gameState.pileCount, 6) - 1 && "🂠"}
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "22px",
          fontWeight: 800,
          color: "#7c3aed",
          marginBottom: "6px",
        }}
      >
        {gameState.pileCount} card{gameState.pileCount !== 1 ? "s" : ""}
      </div>

      {gameState.lastClaim ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: "20px",
            padding: "6px 14px",
            fontSize: "13px",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>Last claim:</span>
          <span style={{ fontWeight: 800, color: "#a78bfa" }}>
            {gameState.lastClaim.playerName} → {gameState.lastClaim.count}×{" "}
            {gameState.lastClaim.rank}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          {gameState.status === "playing"
            ? "No claims yet — play to start"
            : ""}
        </div>
      )}
    </div>
  );
}

// ── Waiting Lobby with settings ────────────────────────────────────────────

function WaitingLobby({
  gameState,
  isHost,
  isSpectator,
  onStart,
  onUpdateSetting,
}) {
  const playerCount = gameState.players.length;
  const canStart = playerCount >= 2;
  const settings = gameState.settings || {};

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "24px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "28px", marginBottom: "10px" }}>⏳</div>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          {playerCount} player{playerCount !== 1 ? "s" : ""} in lobby
          {!canStart && " — need at least 2 to start"}
        </p>
      </div>

      {/* ── Host settings (Cards Bluff relevant only) ── */}
      {isHost && !isSpectator && (
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              marginBottom: "12px",
              fontWeight: 600,
            }}
          >
            ⚙️ GAME SETTINGS
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <BluffSettingControl
              label="Max Players"
              value={settings.maxPlayers ?? 8}
              min={2}
              max={10}
              onChange={(v) => onUpdateSetting("maxPlayers", v)}
            />
            <BluffSettingControl
              label="Cards Per Player"
              value={settings.cardsPerPlayer ?? "Auto"}
              isAuto
              hint="Auto deals equally from 52-card deck"
            />
          </div>
          <p
            style={{
              marginTop: "10px",
              fontSize: "11px",
              color: "var(--text-muted)",
              opacity: 0.6,
            }}
          >
            Note: Lives and turn timer don't apply in Cards Bluff. First to
            empty their hand wins.
          </p>
        </div>
      )}

      {/* Non-host: show read-only settings */}
      {!isHost && !isSpectator && settings.maxPlayers && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: "10px",
            padding: "12px 14px",
            marginBottom: "16px",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          Max players:{" "}
          <strong style={{ color: "#fff" }}>{settings.maxPlayers}</strong>
          {" · "}Cards dealt equally from a 52-card deck
        </div>
      )}

      {/* Start button / waiting message */}
      {isHost && !isSpectator ? (
        <button
          onClick={onStart}
          disabled={!canStart}
          style={{
            width: "100%",
            padding: "13px 32px",
            background: canStart
              ? "linear-gradient(135deg, #7c3aed, #a855f7)"
              : "rgba(255,255,255,0.06)",
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontWeight: 800,
            fontSize: "15px",
            opacity: canStart ? 1 : 0.5,
            cursor: canStart ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          🚀 Start Game
        </button>
      ) : (
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          Waiting for host to start…
        </div>
      )}
    </div>
  );
}

function BluffSettingControl({
  label,
  value,
  min,
  max,
  onChange,
  isAuto,
  hint,
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: "10px",
        padding: "12px 10px",
        textAlign: "center",
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
      {isAuto ? (
        <>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: "14px",
              color: "var(--text-muted)",
            }}
          >
            Auto
          </div>
          {hint && (
            <div
              style={{
                fontSize: "9px",
                color: "var(--text-muted)",
                opacity: 0.6,
                marginTop: "4px",
              }}
            >
              {hint}
            </div>
          )}
        </>
      ) : (
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
              fontSize: "14px",
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
              fontSize: "14px",
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
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

// ── Play Area ──────────────────────────────────────────────────────────────

function PlayArea({
  myPlayer,
  selectedCards,
  claimedRank,
  lastClaim,
  onToggleCard,
  onClaimRank,
  onPlay,
  onPass,
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid rgba(124,58,237,0.3)",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "#a78bfa",
          marginBottom: "14px",
          textAlign: "center",
        }}
      >
        🎯 Your turn — select cards to play
      </div>
      <HandDisplay
        hand={myPlayer?.hand || []}
        selectedCards={selectedCards}
        onToggle={onToggleCard}
      />

      {selectedCards.length > 0 && (
        <>
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "8px",
                letterSpacing: "0.06em",
              }}
            >
              CLAIM RANK{" "}
              {lastClaim ? `(must be ≥ ${lastClaim.rank})` : "(any rank)"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {RANKS.map((r) => {
                const minOrder = lastClaim ? RANK_ORDER[lastClaim.rank] : 2;
                const disabled = RANK_ORDER[r] < minOrder;
                return (
                  <button
                    key={r}
                    onClick={() => !disabled && onClaimRank(r)}
                    disabled={disabled}
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        claimedRank === r
                          ? "#7c3aed"
                          : disabled
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(255,255,255,0.07)",
                      color:
                        claimedRank === r
                          ? "#fff"
                          : disabled
                            ? "rgba(255,255,255,0.2)"
                            : "var(--text)",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: disabled ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={onPlay}
            disabled={!claimedRank}
            style={{
              width: "100%",
              padding: "12px",
              background: claimedRank
                ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                : "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              fontWeight: 800,
              fontSize: "14px",
              opacity: claimedRank ? 1 : 0.5,
              cursor: claimedRank ? "pointer" : "not-allowed",
              marginBottom: "8px",
            }}
          >
            Play {selectedCards.length} card
            {selectedCards.length > 1 ? "s" : ""} as {selectedCards.length}×{" "}
            {claimedRank || "?"}
          </button>
        </>
      )}

      {lastClaim && (
        <button
          onClick={onPass}
          className="btn-ghost"
          style={{ width: "100%", marginTop: "8px" }}
        >
          ⏭️ Pass
        </button>
      )}
    </div>
  );
}

// ── Challenge Area ─────────────────────────────────────────────────────────

function ChallengeArea({
  lastClaim,
  myPlayer,
  selectedCards,
  claimedRank,
  onToggleCard,
  onClaimRank,
  onPlay,
  onChallenge,
  onPass,
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid rgba(255,77,109,0.3)",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "#ff6b8a",
          marginBottom: "4px",
          textAlign: "center",
        }}
      >
        🎯 Your turn
      </div>
      <div
        style={{
          textAlign: "center",
          marginBottom: "16px",
          padding: "10px",
          background: "rgba(255,77,109,0.08)",
          borderRadius: "10px",
          fontSize: "13px",
          color: "var(--text-muted)",
        }}
      >
        {lastClaim.playerName} claimed{" "}
        <strong style={{ color: "#ff6b8a" }}>
          {lastClaim.count}× {lastClaim.rank}
        </strong>{" "}
        — do you believe them?
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        <button
          onClick={onChallenge}
          style={{
            padding: "14px 10px",
            background: "rgba(255,77,109,0.12)",
            border: "1px solid rgba(255,77,109,0.35)",
            borderRadius: "12px",
            color: "#ff6b8a",
            fontWeight: 800,
            fontSize: "13px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,77,109,0.22)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,77,109,0.12)")
          }
        >
          🎯 Challenge!
          <br />
          <span style={{ fontSize: "11px", fontWeight: 400, opacity: 0.7 }}>
            I think they're bluffing
          </span>
        </button>
        <button
          onClick={onPass}
          style={{
            padding: "14px 10px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            color: "var(--text-muted)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.09)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
          }
        >
          ⏭️ Pass & Play
          <br />
          <span style={{ fontSize: "11px", fontWeight: 400, opacity: 0.7 }}>
            I believe them
          </span>
        </button>
      </div>

      <HandDisplay
        hand={myPlayer?.hand || []}
        selectedCards={selectedCards}
        onToggle={onToggleCard}
      />

      {selectedCards.length > 0 && (
        <>
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
            }}
          >
            {RANKS.map((r) => {
              const minOrder = lastClaim ? RANK_ORDER[lastClaim.rank] : 2;
              const disabled = RANK_ORDER[r] < minOrder;
              return (
                <button
                  key={r}
                  onClick={() => !disabled && onClaimRank(r)}
                  disabled={disabled}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "7px",
                    border: "none",
                    background:
                      claimedRank === r
                        ? "#7c3aed"
                        : disabled
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(255,255,255,0.07)",
                    color:
                      claimedRank === r
                        ? "#fff"
                        : disabled
                          ? "rgba(255,255,255,0.2)"
                          : "var(--text)",
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
          {claimedRank && (
            <button
              onClick={onPlay}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "11px",
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Play {selectedCards.length} card
              {selectedCards.length > 1 ? "s" : ""} as {selectedCards.length}×{" "}
              {claimedRank}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Hand Display ───────────────────────────────────────────────────────────

function HandDisplay({ hand, selectedCards, onToggle }) {
  if (!hand.length)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "16px",
          color: "var(--text-muted)",
          fontSize: "13px",
        }}
      >
        No cards in hand
      </div>
    );

  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          marginBottom: "8px",
          letterSpacing: "0.06em",
        }}
      >
        YOUR HAND ({hand.length} cards) — tap to select
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {hand.map((card) => {
          const selected = selectedCards.includes(card.id);
          const isRed = card.suit === "♥" || card.suit === "♦";
          return (
            <button
              key={card.id}
              onClick={() => onToggle(card.id)}
              style={{
                width: "44px",
                height: "64px",
                background: selected
                  ? isRed
                    ? "rgba(255,107,107,0.2)"
                    : "rgba(124,58,237,0.2)"
                  : "rgba(255,255,255,0.06)",
                border: `2px solid ${selected ? (isRed ? "#ff6b6b" : "#7c3aed") : "rgba(255,255,255,0.12)"}`,
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 2px",
                transition: "all 0.15s",
                transform: selected ? "translateY(-8px) scale(1.06)" : "none",
                boxShadow: selected
                  ? `0 6px 18px ${isRed ? "rgba(255,107,107,0.35)" : "rgba(124,58,237,0.35)"}`
                  : "none",
              }}
            >
              {/* Top rank */}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: isRed ? "#ff6b6b" : "#e0e0f0",
                  lineHeight: 1,
                  alignSelf: "flex-start",
                  paddingLeft: "2px",
                }}
              >
                {card.rank}
              </span>
              {/* Centre suit */}
              <span style={{ fontSize: "18px", color: SUIT_COLOR[card.suit] }}>
                {card.suit}
              </span>
              {/* Bottom rank (inverted) */}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: isRed ? "#ff6b6b" : "#e0e0f0",
                  lineHeight: 1,
                  alignSelf: "flex-end",
                  paddingRight: "2px",
                  transform: "rotate(180deg)",
                }}
              >
                {card.rank}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Challenge Reveal overlay ───────────────────────────────────────────────

function ChallengeReveal({ data }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: `2px solid ${data.wasBluff ? "rgba(255,77,109,0.6)" : "rgba(34,211,160,0.6)"}`,
          borderRadius: "20px",
          padding: "32px",
          maxWidth: "420px",
          width: "90%",
          textAlign: "center",
          animation: data.wasBluff
            ? "bluffCaught 0.6s ease 0.2s, bounce-in 0.3s ease"
            : "bounce-in 0.3s ease",
          boxShadow: data.wasBluff
            ? "0 0 40px rgba(255,77,109,0.2)"
            : "0 0 40px rgba(34,211,160,0.2)",
        }}
      >
        <div style={{ fontSize: "52px", marginBottom: "12px" }}>
          {data.wasBluff ? "🎯" : "😤"}
        </div>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 800,
            marginBottom: "8px",
            color: data.wasBluff ? "#ff4d6d" : "#22d3a0",
          }}
        >
          {data.wasBluff ? "BLUFF CAUGHT!" : "HONEST PLAY!"}
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            lineHeight: 1.6,
            marginBottom: "16px",
          }}
        >
          {data.challengerName} challenged {data.claimedPlayerName}'s claim of{" "}
          <strong style={{ color: "#fff" }}>
            {data.actualCards.length}× {data.claimedRank}
          </strong>
        </p>

        {/* Revealed cards with flip animation */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "16px",
          }}
        >
          {data.actualCards.map((card, i) => {
            const isRed = card.suit === "♥" || card.suit === "♦";
            return (
              <div
                key={card.id}
                style={{
                  width: "44px",
                  height: "64px",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 2px",
                  animation: `revealFlip 0.4s ease ${i * 0.1}s both`,
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: isRed ? "#ff6b6b" : "#e0e0f0",
                    alignSelf: "flex-start",
                    paddingLeft: "2px",
                  }}
                >
                  {card.rank}
                </span>
                <span style={{ fontSize: "18px" }}>{card.suit}</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: isRed ? "#ff6b6b" : "#e0e0f0",
                    alignSelf: "flex-end",
                    paddingRight: "2px",
                    transform: "rotate(180deg)",
                  }}
                >
                  {card.rank}
                </span>
              </div>
            );
          })}
        </div>

        <p
          style={{
            fontWeight: 700,
            color: data.wasBluff ? "#ff4d6d" : "#22d3a0",
            fontSize: "15px",
          }}
        >
          {data.loserName} picks up {data.pileCount} card
          {data.pileCount !== 1 ? "s" : ""}!
        </p>
      </div>
    </div>
  );
}

// ── Player Chip ────────────────────────────────────────────────────────────

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
        minWidth: "80px",
        background: isActive ? `hsla(${hue},70%,50%,0.15)` : "var(--bg-card)",
        border: `1.5px solid ${isActive ? `hsla(${hue},70%,50%,0.5)` : "var(--border)"}`,
        borderRadius: "12px",
        opacity: player.isAlive ? 1 : 0.3,
        transition: "all 0.3s",
        transform: isActive ? "scale(1.05)" : "scale(1)",
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
      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
        {player.isAlive ? `🃏 ${player.cardCount}` : "💀"}
      </div>
    </div>
  );
}

// ── Game Over Screen ───────────────────────────────────────────────────────

function GameOverScreen({ gameState, myId, onHome }) {
  const iWon = gameState.winner?.id === myId;
  const sorted = [...gameState.players].sort(
    (a, b) => a.cardCount - b.cardCount,
  );
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
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
          {iWon ? "🏆" : "🃏"}
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
        {gameState.winner && !iWon && (
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            🏆{" "}
            <strong style={{ color: "#ff8c42" }}>
              {gameState.winner.name}
            </strong>{" "}
            wins!
          </p>
        )}
        <div style={{ marginBottom: "28px" }}>
          {sorted.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
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
                <span>{["🥇", "🥈", "🥉"][i] || `${i + 1}.`}</span>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>
                  {p.name}
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {p.isAlive ? `🃏 ${p.cardCount} cards left` : "💀 out"}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onHome}
          style={{
            width: "100%",
            padding: "14px",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontWeight: 800,
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
}

// ── How to Play Modal ──────────────────────────────────────────────────────

function HowToPlayModal({ onClose }) {
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
          border: "1px solid rgba(124,58,237,0.3)",
          borderRadius: "20px",
          padding: "32px",
          maxWidth: "500px",
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
            🃏 How to Play Cards Bluff
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
        {HTP_BLUFF.map((s) => (
          <div key={s.title} style={{ marginBottom: "18px" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "14px",
                color: "#a78bfa",
                marginBottom: "6px",
              }}
            >
              {s.title}
            </div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "13px",
                lineHeight: 1.7,
              }}
            >
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const HTP_BLUFF = [
  {
    title: "🎯 Goal",
    body: "Be the first player to get rid of all your cards.",
  },
  {
    title: "🃏 Setup",
    body: "All 52 cards are dealt equally to all players. Cards are hidden — only you can see your own hand.",
  },
  {
    title: "▶️ Your Turn",
    body: 'Select one or more cards and claim they are all the same rank (e.g., "3× Kings"). The claimed rank must be ≥ the last claim. Your cards go face-down into the pile.',
  },
  {
    title: "🎯 Challenge",
    body: "If you think the previous player lied, press Challenge. Cards are revealed — bluffing means they pick up the pile. Honest play means YOU pick up the pile.",
  },
  {
    title: "⏭️ Pass",
    body: "If you believe the last claim, pass your turn. If everyone passes, the pile is cleared and a new round starts.",
  },
  {
    title: "🏆 Winning",
    body: "First player to play their last card wins — even if challenged!",
  },
  {
    title: "💡 Strategy",
    body: "You don't have to bluff! Playing honestly makes challenges risky. Bluffing is most effective when you need to get rid of cards that don't match the current rank.",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function SpectatorBadge() {
  return (
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
  );
}
