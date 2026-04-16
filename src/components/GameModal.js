import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import logger from '../utils/logger';

export default function GameModal({ game, onClose, onNavigate }) {
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [settings, setSettings] = useState({ maxLives: 3, turnTimer: 15, maxPlayers: 8 });
  const [loading, setLoading] = useState(false);
  const { socket, stableId } = useSocket();
  const overlayRef = useRef();

  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = ({ roomCode, playerId }) => {
      logger.info('Room created successfully', { roomCode, stableId, playerName });
      setLoading(false);
      localStorage.setItem('playerId', stableId);
      localStorage.setItem('playerName', playerName);
      onNavigate(`/room/${roomCode}`);
    };

    const handleRoomJoined = ({ roomCode, playerId }) => {
      logger.info('Room joined successfully', { roomCode, stableId, playerName });
      setLoading(false);
      localStorage.setItem('playerId', stableId);
      localStorage.setItem('playerName', playerName);
      onNavigate(`/room/${roomCode}`);
    };

    const handleError = ({ message }) => {
      logger.error('Socket error in GameModal', { message });
      setLoading(false);
      toast.error(message);
    };

    socket.on('room_created', handleRoomCreated);
    socket.on('room_joined', handleRoomJoined);
    socket.on('error', handleError);

    return () => {
      socket.off('room_created', handleRoomCreated);
      socket.off('room_joined', handleRoomJoined);
      socket.off('error', handleError);
    };
  }, [socket, playerName, onNavigate, stableId]);

  const handleCreate = () => {
    if (!playerName.trim()) return toast.error('Enter your name first!');
    logger.info('Emitting create_room', { playerName, settings, stableId });
    setLoading(true);
    logger.socket.emit('create_room', { playerName: playerName.trim(), settings, playerId: stableId });
    socket.emit('create_room', { playerName: playerName.trim(), settings, playerId: stableId });
  };

  const handleJoin = () => {
    if (!playerName.trim()) return toast.error('Enter your name first!');
    if (!roomCode.trim()) return toast.error('Enter a room code!');
    logger.info('Emitting join_room', { roomCode, playerName, stableId });
    setLoading(true);
    logger.socket.emit('join_room', { roomCode: roomCode.trim().toUpperCase(), playerName: playerName.trim(), playerId: stableId });
    socket.emit('join_room', { roomCode: roomCode.trim().toUpperCase(), playerName: playerName.trim(), playerId: stableId });
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: `1px solid ${game.border}`,
        borderRadius: '20px',
        padding: '32px',
        width: '100%',
        maxWidth: '460px',
        animation: 'bounce-in 0.3s ease',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            borderRadius: '8px', color: 'var(--text-muted)', width: '32px', height: '32px',
            fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>{game.emoji}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: game.color }}>{game.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Enter your name to play</p>
        </div>

        {/* Player Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>
            YOUR NAME
          </label>
          <input
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="e.g. Khushal"
            maxLength={20}
            style={{
              width: '100%', padding: '12px 14px',
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${playerName ? game.border : 'var(--border)'}`,
              borderRadius: '10px', color: 'var(--text)', fontSize: '15px',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* Mode Select */}
        {!mode ? (
          <div style={{ display: 'flex', gap: '12px' }}>
            <ModeBtn label="+ Create Room" sub="Be the host" color={game.color} onClick={() => { logger.debug('Mode selected: create'); setMode('create'); }} />
            <ModeBtn label="→ Join Room" sub="Enter a code" color="#888" onClick={() => { logger.debug('Mode selected: join'); setMode('join'); }} />
          </div>
        ) : mode === 'create' ? (
          <CreateForm
            settings={settings}
            setSettings={setSettings}
            onSubmit={handleCreate}
            onBack={() => setMode(null)}
            loading={loading}
            color={game.color}
          />
        ) : (
          <JoinForm
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            onSubmit={handleJoin}
            onBack={() => setMode(null)}
            loading={loading}
            color={game.color}
          />
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
        flex: 1, padding: '16px 12px', textAlign: 'center',
        background: `${color}12`, border: `1px solid ${color}30`,
        borderRadius: '12px', color, transition: 'all 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = `${color}20`}
      onMouseLeave={e => e.currentTarget.style.background = `${color}12`}
    >
      <div style={{ fontSize: '14px', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '3px' }}>{sub}</div>
    </button>
  );
}

function CreateForm({ settings, setSettings, onSubmit, onBack, loading, color }) {
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>SETTINGS</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <SettingField
            label="Lives" min={1} max={10}
            value={settings.maxLives}
            onChange={v => setSettings(s => ({ ...s, maxLives: v }))}
          />
          <SettingField
            label="Timer (s)" min={5} max={60}
            value={settings.turnTimer}
            onChange={v => setSettings(s => ({ ...s, turnTimer: v }))}
          />
          <SettingField
            label="Max Players" min={2} max={12}
            value={settings.maxPlayers}
            onChange={v => setSettings(s => ({ ...s, maxPlayers: v }))}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={backBtnStyle}>← Back</button>
        <button
          onClick={onSubmit}
          disabled={loading}
          style={{
            flex: 1, padding: '13px', background: color, border: 'none',
            borderRadius: '10px', color: '#fff', fontWeight: 800, fontSize: '14px',
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Creating...' : '🎮 Create Room'}
        </button>
      </div>
    </div>
  );
}

function JoinForm({ roomCode, setRoomCode, onSubmit, onBack, loading, color }) {
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>ROOM CODE</label>
        <input
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          placeholder="e.g. AB3XY"
          maxLength={6}
          style={{
            width: '100%', padding: '12px 14px', textAlign: 'center',
            background: 'rgba(255,255,255,0.05)', border: `1px solid var(--border)`,
            borderRadius: '10px', color: 'var(--text)', fontSize: '22px',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.15em',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={backBtnStyle}>← Back</button>
        <button
          onClick={onSubmit}
          disabled={loading}
          style={{
            flex: 1, padding: '13px', background: color, border: 'none',
            borderRadius: '10px', color: '#fff', fontWeight: 800, fontSize: '14px',
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Joining...' : '→ Join Room'}
        </button>
      </div>
    </div>
  );
}

function SettingField({ label, min, max, value, onChange }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', color: '#fff', width: '24px', height: '24px', fontSize: '14px' }}
        >−</button>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: '24px', textAlign: 'center', fontSize: '14px' }}>{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', color: '#fff', width: '24px', height: '24px', fontSize: '14px' }}
        >+</button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '11px', color: 'var(--text-muted)',
  marginBottom: '10px', fontWeight: 600, letterSpacing: '0.06em',
};

const backBtnStyle = {
  padding: '13px 16px', background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)', borderRadius: '10px',
  color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px',
};
