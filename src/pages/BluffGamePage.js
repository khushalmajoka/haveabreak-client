import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import ShareButton from '../components/ShareButton';
import logger from '../utils/logger';

const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUIT_COLOR = { '♠': '#e0e0f0', '♣': '#e0e0f0', '♥': '#ff6b6b', '♦': '#ff6b6b' };

export default function BluffGamePage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, stableId } = useSocket();
  const isSpectator = location.state?.spectator === true;

  const [gameState, setGameState] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [claimedRank, setClaimedRank] = useState('');
  const [showReveal, setShowReveal] = useState(null); // challenge reveal overlay
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const logRef = useRef(null);

  const myId = stableId;

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Join room on mount
    if (isSpectator) {
      socket.emit('bluff_spectate', { roomCode });
    } else {
      socket.emit('bluff_join_room', { roomCode, playerName: localStorage.getItem('playerName') || 'Player', playerId: stableId });
    }

    const onState = (state) => {
      logger.debug('[Bluff] State update', { status: state.status, pile: state.pileCount });
      setGameState(state);
      // Auto-scroll log
      setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
    };

    const onGameStarted = ({ firstPlayer }) => {
      toast.success(`Game started! ${firstPlayer} goes first.`);
      setSelectedCards([]);
      setClaimedRank('');
    };

    const onCardsPlayed = ({ playerName, count, claimedRank }) => {
      if (playerName !== getMyPlayer()?.name) {
        toast(`${playerName} played ${count} card${count>1?'s':''}, claiming ${count}× ${claimedRank}`, { icon: '🃏' });
      }
    };

    const onChallengeResult = (data) => {
      setShowReveal(data);
      setTimeout(() => setShowReveal(null), 4000);
    };

    const onPileClear = () => toast('Pile cleared — new round!', { icon: '🔄' });
    const onPassed = ({ playerName }) => {
      if (playerName !== getMyPlayer()?.name) toast(`${playerName} passed`, { icon: '⏭️' });
    };

    const onGameOver = ({ winner }) => {
      logger.info('[Bluff] Game over', { winner: winner?.name });
    };

    const onPlayerJoined = ({ playerName }) => toast(`${playerName} joined!`, { icon: '👋' });
    const onPlayerLeft = ({ playerName }) => toast(`${playerName} left`, { icon: '🚪' });

    const onError = ({ message }) => {
      toast.error(message);
      logger.error('[Bluff] Error', { message });
    };

    socket.on('bluff_state', onState);
    socket.on('bluff_game_started', onGameStarted);
    socket.on('bluff_cards_played', onCardsPlayed);
    socket.on('bluff_challenge_result', onChallengeResult);
    socket.on('bluff_pile_cleared', onPileClear);
    socket.on('bluff_passed', onPassed);
    socket.on('bluff_game_over', onGameOver);
    socket.on('bluff_player_joined', onPlayerJoined);
    socket.on('bluff_player_left', onPlayerLeft);
    socket.on('bluff_error', onError);

    return () => {
      socket.off('bluff_state', onState);
      socket.off('bluff_game_started', onGameStarted);
      socket.off('bluff_cards_played', onCardsPlayed);
      socket.off('bluff_challenge_result', onChallengeResult);
      socket.off('bluff_pile_cleared', onPileClear);
      socket.off('bluff_passed', onPassed);
      socket.off('bluff_game_over', onGameOver);
      socket.off('bluff_player_joined', onPlayerJoined);
      socket.off('bluff_player_left', onPlayerLeft);
      socket.off('bluff_error', onError);
    };
  }, [socket, roomCode, stableId, isSpectator]);

  const getMyPlayer = useCallback(() =>
    gameState?.players?.find(p => p.id === myId), [gameState, myId]);

  const isMyTurn = !isSpectator &&
    gameState?.status === 'playing' &&
    gameState?.players?.[gameState.currentPlayerIndex]?.id === myId;

  const canChallenge = !isSpectator &&
    gameState?.status === 'playing' &&
    gameState?.lastClaim &&
    gameState?.lastClaim?.playerId !== myId &&
    gameState?.players?.[gameState.currentPlayerIndex]?.id === myId;

  const toggleCard = (cardId) => {
    setSelectedCards(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const handlePlay = () => {
    if (!selectedCards.length) return toast.error('Select at least 1 card');
    if (!claimedRank) return toast.error('Choose a rank to claim');
    logger.info('[Bluff] Playing cards', { cards: selectedCards, claimedRank });
    socket.emit('bluff_play_cards', { roomCode, cardIds: selectedCards, claimedRank });
    setSelectedCards([]);
    setClaimedRank('');
  };

  const handleChallenge = () => {
    logger.info('[Bluff] Challenging');
    socket.emit('bluff_challenge', { roomCode });
  };

  const handlePass = () => {
    logger.info('[Bluff] Passing');
    socket.emit('bluff_pass', { roomCode });
  };

  const handleStart = () => socket.emit('bluff_start_game', { roomCode });

  const myPlayer = getMyPlayer();
  const isHost = myPlayer?.isHost;

  // ── Game Over screen ───────────────────────────────────────────────────────
  if (gameState?.status === 'finished') {
    return <GameOverScreen gameState={gameState} myId={myId} onHome={() => navigate('/')} />;
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!gameState) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🃏</div>
          Connecting to room…
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: '900px', margin: '0 auto', padding: '16px' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Room: <span style={{ color: '#7c3aed' }}>{roomCode}</span>
          </span>
          {isSpectator && <SpectatorBadge />}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setShowHowToPlay(true)} style={ghostBtn}>❓ How to Play</button>
          <ShareButton roomCode={roomCode} game="cardsbluff" />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🃏 Cards Bluff</span>
        </div>
      </div>

      {/* ── Players row ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
        {gameState.players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            isActive={gameState.status === 'playing' && gameState.currentPlayerIndex === i}
            isMe={p.id === myId}
            colorIndex={i}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'flex-start' }}>

        {/* ── Left: Main play area ── */}
        <div style={{ flex: 1 }}>

          {/* Pile + last claim */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '20px', marginBottom: '12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>PILE</div>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🃏</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800,
              color: '#7c3aed', marginBottom: '6px',
            }}>
              {gameState.pileCount} card{gameState.pileCount !== 1 ? 's' : ''}
            </div>
            {gameState.lastClaim ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: '20px', padding: '6px 14px', fontSize: '13px',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Last claim:</span>
                <span style={{ fontWeight: 800, color: '#a78bfa' }}>
                  {gameState.lastClaim.playerName} → {gameState.lastClaim.count}× {gameState.lastClaim.rank}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No claims yet — play to start</div>
            )}
          </div>

          {/* ── Waiting lobby ── */}
          {gameState.status === 'waiting' && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
                {gameState.players.length} player{gameState.players.length !== 1 ? 's' : ''} in lobby
                {gameState.players.length < 2 && ' — need at least 2'}
              </p>
              {isHost ? (
                <button
                  onClick={handleStart}
                  disabled={gameState.players.length < 2}
                  style={{
                    padding: '13px 32px',
                    background: gameState.players.length >= 2
                      ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                      : 'rgba(255,255,255,0.06)',
                    border: 'none', borderRadius: '12px',
                    color: '#fff', fontWeight: 800, fontSize: '15px',
                    opacity: gameState.players.length < 2 ? 0.5 : 1,
                    cursor: gameState.players.length < 2 ? 'not-allowed' : 'pointer',
                  }}
                >🚀 Start Game</button>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Waiting for host to start…</div>
              )}
            </div>
          )}

          {/* ── Action area — my turn ── */}
          {gameState.status === 'playing' && isMyTurn && !canChallenge && (
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
          {gameState.status === 'playing' && isMyTurn && canChallenge && (
            <ChallengeArea
              lastClaim={gameState.lastClaim}
              myPlayer={myPlayer}
              selectedCards={selectedCards}
              claimedRank={claimedRank}
              lastClaimState={gameState.lastClaim}
              onToggleCard={toggleCard}
              onClaimRank={setClaimedRank}
              onPlay={handlePlay}
              onChallenge={handleChallenge}
              onPass={handlePass}
            />
          )}

          {/* ── Waiting for others ── */}
          {gameState.status === 'playing' && !isMyTurn && !isSpectator && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '20px', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: '14px',
            }}>
              ⏳ Waiting for <strong style={{ color: '#fff' }}>{gameState.currentPlayer?.name}</strong> to play…
            </div>
          )}

          {/* ── Spectator ── */}
          {isSpectator && gameState.status === 'playing' && (
            <div style={{
              background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: '16px', padding: '16px', textAlign: 'center',
              color: 'rgba(167,139,250,0.8)', fontSize: '13px',
            }}>
              👁️ Spectating — {gameState.currentPlayer?.name}'s turn
            </div>
          )}
        </div>

        {/* ── Right: Game log ── */}
        <div style={{
          width: '220px', flexShrink: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '14px',
          display: 'flex', flexDirection: 'column',
          maxHeight: '480px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>GAME LOG</div>
          <div ref={logRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(gameState.log || []).map((entry, i) => (
              <div key={i} style={{
                fontSize: '11px', lineHeight: 1.5,
                color: entry.type === 'caught' ? '#ff4d6d'
                  : entry.type === 'safe' ? '#22d3a0'
                  : entry.type === 'win' ? '#ff8c42'
                  : entry.type === 'start' ? '#a78bfa'
                  : 'var(--text-muted)',
                borderLeft: `2px solid ${
                  entry.type === 'caught' ? 'rgba(255,77,109,0.4)'
                  : entry.type === 'safe' ? 'rgba(34,211,160,0.4)'
                  : entry.type === 'win' ? 'rgba(255,140,66,0.4)'
                  : 'rgba(255,255,255,0.08)'
                }`,
                paddingLeft: '8px',
              }}>
                {entry.msg}
              </div>
            ))}
            {(!gameState.log || gameState.log.length === 0) && (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                Game events will appear here…
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Challenge Reveal Overlay ── */}
      {showReveal && <ChallengeReveal data={showReveal} />}

      {/* ── How to Play Modal ── */}
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
}

// ── Play Area (my turn, no pending challenge) ──────────────────────────────

function PlayArea({ myPlayer, selectedCards, claimedRank, lastClaim, onToggleCard, onClaimRank, onPlay, onPass }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa', marginBottom: '14px', textAlign: 'center' }}>
        🎯 Your turn — select cards to play
      </div>

      {/* Hand */}
      <HandDisplay hand={myPlayer?.hand || []} selectedCards={selectedCards} onToggle={onToggleCard} />

      {selectedCards.length > 0 && (
        <>
          {/* Rank picker */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.06em' }}>
              CLAIM RANK (must be ≥ {lastClaim?.rank || '2'})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {RANKS.map(r => {
                const RANK_ORDER = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };
                const minOrder = lastClaim ? RANK_ORDER[lastClaim.rank] : 2;
                const disabled = RANK_ORDER[r] < minOrder;
                return (
                  <button
                    key={r}
                    onClick={() => !disabled && onClaimRank(r)}
                    disabled={disabled}
                    style={{
                      width: '34px', height: '34px',
                      borderRadius: '8px', border: 'none',
                      background: claimedRank === r ? '#7c3aed' : disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
                      color: claimedRank === r ? '#fff' : disabled ? 'rgba(255,255,255,0.2)' : 'var(--text)',
                      fontWeight: 700, fontSize: '12px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >{r}</button>
                );
              })}
            </div>
          </div>

          <button
            onClick={onPlay}
            disabled={!claimedRank}
            style={{
              width: '100%', padding: '12px',
              background: claimedRank ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: '10px',
              color: '#fff', fontWeight: 800, fontSize: '14px',
              opacity: claimedRank ? 1 : 0.5,
              cursor: claimedRank ? 'pointer' : 'not-allowed',
              marginBottom: '8px',
            }}
          >
            Play {selectedCards.length} card{selectedCards.length > 1 ? 's' : ''} as {selectedCards.length}× {claimedRank || '?'}
          </button>
        </>
      )}

      {lastClaim && (
        <button onClick={onPass} style={{ ...ghostBtn, width: '100%', marginTop: '8px' }}>
          ⏭️ Pass
        </button>
      )}
    </div>
  );
}

// ── Challenge Area (pending claim, my turn to act) ─────────────────────────

function ChallengeArea({ lastClaim, myPlayer, selectedCards, claimedRank, lastClaimState, onToggleCard, onClaimRank, onPlay, onChallenge, onPass }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ff6b8a', marginBottom: '4px', textAlign: 'center' }}>
        🎯 Your turn
      </div>
      <div style={{
        textAlign: 'center', marginBottom: '16px', padding: '10px',
        background: 'rgba(255,77,109,0.08)', borderRadius: '10px',
        fontSize: '13px', color: 'var(--text-muted)',
      }}>
        {lastClaim.playerName} claimed <strong style={{ color: '#ff6b8a' }}>{lastClaim.count}× {lastClaim.rank}</strong> — do you believe them?
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <button
          onClick={onChallenge}
          style={{
            padding: '14px 10px',
            background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.35)',
            borderRadius: '12px', color: '#ff6b8a', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,109,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,77,109,0.12)'}
        >
          🎯 Challenge!<br />
          <span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.7 }}>I think they're bluffing</span>
        </button>
        <button
          onClick={onPass}
          style={{
            padding: '14px 10px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
            borderRadius: '12px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          ⏭️ Pass & Play<br />
          <span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.7 }}>I believe them</span>
        </button>
      </div>

      {/* Also show hand to play if passing */}
      <HandDisplay hand={myPlayer?.hand || []} selectedCards={selectedCards} onToggle={onToggleCard} />
      {selectedCards.length > 0 && (
        <>
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {RANKS.map(r => {
              const RANK_ORDER = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };
              const minOrder = lastClaimState ? RANK_ORDER[lastClaimState.rank] : 2;
              const disabled = RANK_ORDER[r] < minOrder;
              return (
                <button key={r} onClick={() => !disabled && onClaimRank(r)} disabled={disabled}
                  style={{
                    width: '32px', height: '32px', borderRadius: '7px', border: 'none',
                    background: claimedRank === r ? '#7c3aed' : disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
                    color: claimedRank === r ? '#fff' : disabled ? 'rgba(255,255,255,0.2)' : 'var(--text)',
                    fontWeight: 700, fontSize: '11px', cursor: disabled ? 'not-allowed' : 'pointer',
                  }}>{r}</button>
              );
            })}
          </div>
          {claimedRank && (
            <button onClick={onPlay} style={{
              marginTop: '10px', width: '100%', padding: '11px',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              border: 'none', borderRadius: '10px',
              color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            }}>
              Play {selectedCards.length} card{selectedCards.length > 1 ? 's' : ''} as {selectedCards.length}× {claimedRank}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Hand Display ───────────────────────────────────────────────────────────

function HandDisplay({ hand, selectedCards, onToggle }) {
  if (!hand.length) return (
    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
      No cards in hand
    </div>
  );

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.06em' }}>
        YOUR HAND ({hand.length} cards) — tap to select
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {hand.map(card => {
          const selected = selectedCards.includes(card.id);
          const isRed = card.suit === '♥' || card.suit === '♦';
          return (
            <button
              key={card.id}
              onClick={() => onToggle(card.id)}
              style={{
                width: '44px', height: '60px',
                background: selected ? (isRed ? 'rgba(255,107,107,0.2)' : 'rgba(124,58,237,0.2)') : 'rgba(255,255,255,0.06)',
                border: `2px solid ${selected ? (isRed ? '#ff6b6b' : '#7c3aed') : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '8px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '2px', transition: 'all 0.15s',
                transform: selected ? 'translateY(-6px) scale(1.05)' : 'none',
                boxShadow: selected ? `0 4px 16px ${isRed ? 'rgba(255,107,107,0.3)' : 'rgba(124,58,237,0.3)'}` : 'none',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800, color: isRed ? '#ff6b6b' : '#e0e0f0', lineHeight: 1 }}>
                {card.rank}
              </span>
              <span style={{ fontSize: '14px', color: SUIT_COLOR[card.suit] }}>
                {card.suit}
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: `2px solid ${data.wasBluff ? 'rgba(255,77,109,0.5)' : 'rgba(34,211,160,0.5)'}`,
        borderRadius: '20px', padding: '32px', maxWidth: '420px', width: '90%',
        textAlign: 'center', animation: 'bounce-in 0.3s ease',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>{data.wasBluff ? '🎯' : '😤'}</div>
        <h2 style={{
          fontSize: '22px', fontWeight: 800, marginBottom: '8px',
          color: data.wasBluff ? '#ff4d6d' : '#22d3a0',
        }}>
          {data.wasBluff ? 'BLUFF CAUGHT!' : 'HONEST PLAY!'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
          {data.challengerName} challenged {data.claimedPlayerName}'s claim of{' '}
          <strong style={{ color: '#fff' }}>{data.actualCards.length}× {data.claimedRank}</strong>
        </p>

        {/* Reveal actual cards */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {data.actualCards.map(card => {
            const isRed = card.suit === '♥' || card.suit === '♦';
            return (
              <div key={card.id} style={{
                width: '44px', height: '60px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: isRed ? '#ff6b6b' : '#e0e0f0' }}>{card.rank}</span>
                <span style={{ fontSize: '14px' }}>{card.suit}</span>
              </div>
            );
          })}
        </div>

        <p style={{ fontWeight: 700, color: data.wasBluff ? '#ff4d6d' : '#22d3a0', fontSize: '15px' }}>
          {data.loserName} picks up {data.pileCount} cards!
        </p>
      </div>
    </div>
  );
}

// ── Player chip ────────────────────────────────────────────────────────────

function PlayerChip({ player, isActive, isMe, colorIndex }) {
  const hue = (colorIndex * 60) % 360;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      padding: '10px 12px', minWidth: '80px',
      background: isActive ? `hsla(${hue},70%,50%,0.15)` : 'var(--bg-card)',
      border: `1.5px solid ${isActive ? `hsla(${hue},70%,50%,0.5)` : 'var(--border)'}`,
      borderRadius: '12px',
      opacity: player.isAlive ? 1 : 0.3,
      transition: 'all 0.3s',
      transform: isActive ? 'scale(1.05)' : 'scale(1)',
      boxShadow: isActive ? `0 0 16px hsla(${hue},70%,50%,0.2)` : 'none',
    }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: `hsl(${hue},70%,50%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 700, color: '#fff', position: 'relative',
      }}>
        {player.name?.[0]?.toUpperCase()}
        {isMe && <div style={{
          position: 'absolute', bottom: '-2px', right: '-2px',
          width: '10px', height: '10px', borderRadius: '50%',
          background: '#22d3a0', border: '1.5px solid var(--bg-card)',
        }} />}
      </div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: isActive ? '#fff' : 'var(--text-muted)' }}>
        {player.name?.length > 7 ? player.name.slice(0, 7) + '…' : player.name}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        {player.isAlive ? `🃏 ${player.cardCount}` : '💀'}
      </div>
    </div>
  );
}

// ── Game Over Screen ───────────────────────────────────────────────────────

function GameOverScreen({ gameState, myId, onHome }) {
  const iWon = gameState.winner?.id === myId;
  const sorted = [...gameState.players].sort((a, b) => a.cardCount - b.cardCount);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '40px 32px', maxWidth: '440px', width: '100%',
        textAlign: 'center', animation: 'bounce-in 0.4s ease',
      }}>
        <div style={{ fontSize: '56px', marginBottom: '12px' }}>{iWon ? '🏆' : '🃏'}</div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: iWon ? '#ff8c42' : 'var(--text)' }}>
          {iWon ? 'You Won!' : 'Game Over'}
        </h1>
        {gameState.winner && !iWon && (
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            🏆 <strong style={{ color: '#ff8c42' }}>{gameState.winner.name}</strong> wins!
          </p>
        )}
        <div style={{ marginBottom: '28px' }}>
          {sorted.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', marginBottom: '6px',
              background: i === 0 ? 'rgba(255,140,66,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${i === 0 ? 'rgba(255,140,66,0.25)' : 'var(--border)'}`,
              borderRadius: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{['🥇','🥈','🥉'][i] || `${i+1}.`}</span>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{p.name}</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {p.isAlive ? `🃏 ${p.cardCount} cards left` : '💀 out'}
              </span>
            </div>
          ))}
        </div>
        <button onClick={onHome} style={{
          width: '100%', padding: '14px',
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          border: 'none', borderRadius: '12px',
          color: '#fff', fontWeight: 800, fontSize: '15px', cursor: 'pointer',
        }}>🏠 Back to Home</button>
      </div>
    </div>
  );
}

// ── How to Play Modal ──────────────────────────────────────────────────────

function HowToPlayModal({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)', zIndex: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid rgba(124,58,237,0.3)',
        borderRadius: '20px', padding: '32px', maxWidth: '500px', width: '100%',
        maxHeight: '80vh', overflowY: 'auto', animation: 'bounce-in 0.3s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>🃏 How to Play Cards Bluff</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        {HTP_BLUFF.map(s => (
          <div key={s.title} style={{ marginBottom: '18px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#a78bfa', marginBottom: '6px' }}>{s.title}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.7 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const HTP_BLUFF = [
  { title: '🎯 Goal', body: 'Be the first player to get rid of all your cards.' },
  { title: '🃏 Setup', body: 'All 52 cards are dealt equally to all players. Cards are hidden — only you can see your own hand.' },
  { title: '▶️ Your Turn', body: 'Select one or more cards from your hand and claim they are all the same rank (e.g., "3× Kings"). The claimed rank must be equal to or higher than the last claim. Your cards go face-down into the pile — no one sees what you actually played.' },
  { title: '🎯 Challenge', body: 'If you think the previous player lied, press Challenge before making your own play. Cards are revealed — if they were bluffing, they pick up the whole pile. If they were honest, YOU pick up the pile.' },
  { title: '⏭️ Pass', body: 'If you believe the last claim, you can pass your turn without playing. If everyone passes, the pile is cleared and a new round starts from scratch.' },
  { title: '🏆 Winning', body: 'The first player to play their last card wins — even if challenged! (A win is a win.) If you\'re challenged after playing your last card and you were bluffing, you pick up the pile and continue.' },
  { title: '💡 Strategy', body: 'You don\'t have to bluff! Playing honestly makes challenges risky for your opponents. Bluffing is most effective when you need to get rid of cards that don\'t match the current rank.' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function SpectatorBadge() {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
      background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
      color: '#a78bfa', borderRadius: '20px', padding: '2px 8px',
    }}>👁️ SPECTATING</span>
  );
}

const ghostBtn = {
  padding: '7px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)',
  borderRadius: '8px', color: 'var(--text-muted)',
  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};
