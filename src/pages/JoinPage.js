import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import logger from '../utils/logger';
import { BASE_URL, SITE_CONFIG } from '../config/config';

export default function JoinPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket, stableId } = useSocket();

  const [roomInfo, setRoomInfo]   = useState(null);   // { playerCount, status, joinable }
  const [checking, setChecking]   = useState(true);   // fetching room info
  const [notFound, setNotFound]   = useState(false);
  const [mode, setMode]           = useState(null);   // 'join' | 'spectate'
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading]     = useState(false);

  // ── 1. Fetch room info on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return;
    logger.info('JoinPage: checking room', { roomCode });

    fetch(`${BASE_URL}/api/rooms/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode }),
    })
      .then(r => r.json())
      .then(data => {
        logger.info('JoinPage: room check result', data);
        if (!data.exists) { setNotFound(true); }
        else { setRoomInfo(data); }
        setChecking(false);
      })
      .catch(() => { setNotFound(true); setChecking(false); });
  }, [roomCode]);

  // ── 2. Socket listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onRoomJoined = ({ roomCode: rc }) => {
      setLoading(false);
      localStorage.setItem('playerId', stableId);
      localStorage.setItem('playerName', playerName);
      logger.info('Joined room, navigating to lobby', { roomCode: rc });
      navigate(`/wordbomb/room/${rc}`);
    };

    const onSpectateJoined = ({ roomCode: rc, status }) => {
      setLoading(false);
      logger.info('Spectating room', { roomCode: rc, status });
      // Spectators go straight to the appropriate page
      if (status === 'playing') navigate(`/wordbomb/game/${rc}`, { state: { spectator: true } });
      else navigate(`/wordbomb/room/${rc}`, { state: { spectator: true } });
    };

    const onError = ({ message }) => {
      setLoading(false);
      toast.error(message);
      logger.error('JoinPage socket error', { message });
    };

    socket.on('room_joined',    onRoomJoined);
    socket.on('spectate_joined', onSpectateJoined);
    socket.on('error',          onError);

    return () => {
      socket.off('room_joined',    onRoomJoined);
      socket.off('spectate_joined', onSpectateJoined);
      socket.off('error',          onError);
    };
  }, [socket, playerName, stableId, navigate]);

  // ── 3. Handlers ──────────────────────────────────────────────────────────
  const handleJoin = () => {
    if (!playerName.trim()) return toast.error('Enter your name first!');
    setLoading(true);
    logger.info('Joining room from JoinPage', { roomCode, playerName, stableId });
    socket.emit('join_room', {
      roomCode: roomCode.toUpperCase(),
      playerName: playerName.trim(),
      playerId: stableId,
    });
  };

  const handleSpectate = () => {
    setLoading(true);
    logger.info('Spectating room', { roomCode, stableId });
    socket.emit('spectate_room', {
      roomCode: roomCode.toUpperCase(),
      playerId: stableId,
    });
  };

  // ── 4. Render states ─────────────────────────────────────────────────────

  if (checking) {
    return (
      <Screen>
        <div style={{ fontSize: '36px', marginBottom: '16px', animation: 'pulse-ring 1.2s ease infinite' }}>💣</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Finding room <Code>{roomCode}</Code>…</p>
      </Screen>
    );
  }

  if (notFound) {
    return (
      <Screen>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Room Not Found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>
          No room with code <Code>{roomCode}</Code> exists, or it has expired.
        </p>
        <Btn onClick={() => navigate('/')} primary>Back to Home</Btn>
      </Screen>
    );
  }

  const isInProgress = roomInfo?.status === 'playing';
  const isFull       = !roomInfo?.joinable && !isInProgress;

  return (
    <Screen>
      {/* Room badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'rgba(255,77,109,0.08)',
        border: '1px solid rgba(255,77,109,0.2)',
        borderRadius: '12px', padding: '8px 18px',
        marginBottom: '28px',
      }}>
        <span style={{ fontSize: '20px' }}>💣</span>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Word Bomb</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontWeight: 800,
          fontSize: '15px', color: '#ff4d6d', letterSpacing: '0.1em',
        }}>{roomCode}</span>
        <StatusDot status={roomInfo?.status} />
      </div>

      {/* Players count */}
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '32px' }}>
        {roomInfo?.playerCount} player{roomInfo?.playerCount !== 1 ? 's' : ''} in lobby
        {isInProgress && ' · Game in progress'}
        {isFull && ' · Room is full'}
      </p>

      {/* ── Mode picker ── */}
      {!mode && (
        <div style={{ width: '100%', maxWidth: '450px' }}>
          {/* Join — only if waiting and not full */}
          {!isInProgress && !isFull && (
            <ModeCard
              emoji="🎮"
              title="Join & Play"
              desc="Enter the lobby and play with others"
              color="#ff4d6d"
              onClick={() => setMode('join')}
            />
          )}

          {/* Spectate — always available */}
          <ModeCard
            emoji="👁️"
            title="Spectate"
            desc={isInProgress ? 'Watch the live game without playing' : 'Watch from the lobby'}
            color="#7c3aed"
            onClick={() => setMode('spectate')}
            style={{ marginTop: '12px' }}
          />

          {/* If game in progress and not full — can still join next round info */}
          {isInProgress && (
            <p style={{
              marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)',
              textAlign: 'center', lineHeight: 1.6,
            }}>
              Game is in progress. You can spectate now<br />or wait for the next round.
            </p>
          )}

          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '20px', width: '100%', padding: '11px',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: '10px', color: 'var(--text-muted)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            ← Back to Home
          </button>
        </div>
      )}

      {/* ── Join form ── */}
      {mode === 'join' && (
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <label style={labelStyle}>YOUR NAME</label>
          <input
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
            style={inputStyle}
          />
          <Btn onClick={handleJoin} primary disabled={loading} style={{ marginTop: '12px' }}>
            {loading ? 'Joining…' : '🎮 Join Room'}
          </Btn>
          <Btn onClick={() => setMode(null)} style={{ marginTop: '8px' }}>← Back</Btn>
        </div>
      )}

      {/* ── Spectate confirm ── */}
      {mode === 'spectate' && (
        <div style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '12px', padding: '16px',
            marginBottom: '16px', fontSize: '13px',
            color: 'rgba(167,139,250,0.9)', lineHeight: 1.6,
          }}>
            👁️ As a spectator you can <strong>watch the game live</strong> but cannot submit words or affect gameplay.
          </div>
          <Btn onClick={handleSpectate} color="#7c3aed" primary disabled={loading}>
            {loading ? 'Joining…' : '👁️ Watch as Spectator'}
          </Btn>
          <Btn onClick={() => setMode(null)} style={{ marginTop: '8px' }}>← Back</Btn>
        </div>
      )}
    </Screen>
  );
}

// ── Small sub-components ─────────────────────────────────────────────────────

function Screen({ children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: '440px', animation: 'fadeIn 0.3s ease' }}>
        {/* Logo */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '28px' }}>🎮</span>
          <span style={{
            display: 'block', fontWeight: 800, fontSize: '20px', marginTop: '6px',
            background: 'linear-gradient(135deg, #ff4d6d, #ff8c42)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{SITE_CONFIG.app_name}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Code({ children }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontWeight: 700,
      color: '#ff4d6d', letterSpacing: '0.08em',
    }}>{children}</span>
  );
}

function StatusDot({ status }) {
  const color = status === 'playing' ? '#ff8c42' : status === 'waiting' ? '#22d3a0' : '#6b6b82';
  const label = status === 'playing' ? 'Live' : status === 'waiting' ? 'Waiting' : 'Ended';
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700,
      color, background: `${color}18`,
      border: `1px solid ${color}33`,
      borderRadius: '20px', padding: '2px 8px',
      letterSpacing: '0.06em',
    }}>{label}</span>
  );
}

function ModeCard({ emoji, title, desc, color, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '18px 20px',
        background: `${color}0d`, border: `1px solid ${color}30`,
        borderRadius: '14px', cursor: 'pointer',
        textAlign: 'left', transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', gap: '14px',
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}1a`; e.currentTarget.style.borderColor = `${color}55`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}0d`; e.currentTarget.style.borderColor = `${color}30`; }}
    >
      <span style={{ fontSize: '28px', flexShrink: 0 }}>{emoji}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: '15px', color, marginBottom: '3px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <span style={{ marginLeft: 'auto', color, opacity: 0.5, fontSize: '18px' }}>→</span>
    </button>
  );
}

function Btn({ children, onClick, primary, color = '#ff4d6d', disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'block', width: '100%', padding: '13px',
        background: primary ? `linear-gradient(135deg, ${color}, ${color}cc)` : 'rgba(255,255,255,0.05)',
        border: primary ? 'none' : '1px solid var(--border)',
        borderRadius: '10px', cursor: disabled ? 'not-allowed' : 'pointer',
        color: primary ? '#fff' : 'var(--text-muted)',
        fontWeight: 700, fontSize: '14px',
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity 0.2s',
        fontFamily: 'var(--font-display)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const labelStyle = {
  display: 'block', textAlign: 'left',
  fontSize: '11px', fontWeight: 700,
  color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '7px',
};

const inputStyle = {
  width: '100%', padding: '13px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)',
  borderRadius: '10px', color: 'var(--text)',
  fontSize: '15px', fontFamily: 'var(--font-display)',
  boxSizing: 'border-box', outline: 'none',
};
