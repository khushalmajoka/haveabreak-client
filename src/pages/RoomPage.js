import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import AdBanner from '../components/AdBanner';
import { BASE_URL } from '../config/config';
import ShareButton from '../components/ShareButton';

export default function RoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);

  // Use the stable ID that was set when the player created/joined
  const myStableId = localStorage.getItem('stablePlayerId');

  useEffect(() => {
    if (!socket) return;

    // Fetch room info
    fetch(`${BASE_URL}/api/rooms/${roomCode}`)
      .then(r => r.json())
      .then(data => {
        if (data.room) setRoom(data.room);
        else navigate('/');
      })
      .catch(() => navigate('/'));

    const onPlayerJoined = ({ players }) => {
      setRoom(r => r ? { ...r, players } : r);
      toast.success('A player joined!');
    };
    const onPlayerLeft = ({ playerName, players }) => {
      setRoom(r => r ? { ...r, players } : r);
      toast(`${playerName} left the room`, { icon: '👋' });
    };
    const onSettingsUpdated = ({ settings, players }) => {
      setRoom(r => r ? { ...r, settings, players } : r);
    };
    const onGameStarted = (data) => {
      navigate(`/wordbomb/game/${roomCode}`, { state: data });
    };
    const onError = ({ message }) => toast.error(message);

    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('settings_updated', onSettingsUpdated);
    socket.on('game_started', onGameStarted);
    socket.on('error', onError);

    return () => {
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('settings_updated', onSettingsUpdated);
      socket.off('game_started', onGameStarted);
      socket.off('error', onError);
    };
  }, [socket, roomCode, navigate]);

  const isHost = room?.players?.find(p => p.id === myStableId)?.isHost;

  const startGame = () => socket.emit('start_game', { roomCode });

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!room) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          Loading room...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', maxWidth: '700px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Top Ad */}
      {/* <AdBanner slot="top" style={{ marginBottom: '24px' }} /> */}

      {/* Room Header */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        marginBottom: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '8px' }}>ROOM CODE</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '36px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: '#ff4d6d',
          }}>
            {roomCode}
          </span>
        </div>
        <div style={{ marginTop: '14px' }}>
          <ShareButton roomCode={roomCode} game="wordbomb" />
        </div>
      </div>

      {/* Settings (host view) */}
      {isHost && room.settings && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: 'var(--radius)',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: 600 }}>
            ⚙️ GAME SETTINGS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <SettingControl
              label="Lives" value={room.settings.maxLives} min={1} max={10}
              onChange={v => socket.emit('update_settings', { roomCode, settings: { ...room.settings, maxLives: v } })}
            />
            <SettingControl
              label="Timer (s)" value={room.settings.turnTimer} min={5} max={60}
              onChange={v => socket.emit('update_settings', { roomCode, settings: { ...room.settings, turnTimer: v } })}
            />
            <SettingControl
              label="Max Players" value={room.settings.maxPlayers} min={2} max={12}
              onChange={v => socket.emit('update_settings', { roomCode, settings: { ...room.settings, maxPlayers: v } })}
            />
          </div>
        </div>
      )}

      {/* Players List */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: 600 }}>
          👥 PLAYERS ({room.players.length}/{room.settings.maxPlayers})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {room.players.map((player, i) => (
            <div key={player.id || i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
              padding: '12px 14px', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: `hsl(${(i * 60) % 360}, 70%, 50%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 700,
                }}>
                  {player.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{player.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {player.isHost && (
                  <span style={{ fontSize: '10px', background: 'rgba(255,77,109,0.15)', color: '#ff4d6d', border: '1px solid rgba(255,77,109,0.3)', borderRadius: '20px', padding: '2px 8px', fontWeight: 700 }}>
                    HOST
                  </span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {'❤️'.repeat(Math.min(player.lives, 5))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start / Waiting */}
      {isHost ? (
        <button
          onClick={startGame}
          disabled={room.players.length < 2}
          style={{
            width: '100%', padding: '16px',
            background: room.players.length >= 2
              ? 'linear-gradient(135deg, #ff4d6d, #ff8c42)'
              : 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: '12px',
            color: '#fff', fontWeight: 800, fontSize: '16px',
            opacity: room.players.length < 2 ? 0.5 : 1,
            cursor: room.players.length < 2 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {room.players.length < 2 ? 'Waiting for more players...' : '🚀 Start Game'}
        </button>
      ) : (
        <div style={{
          textAlign: 'center', padding: '16px',
          color: 'var(--text-muted)', fontSize: '14px',
          border: '1px dashed var(--border)', borderRadius: '12px',
        }}>
          ⏳ Waiting for host to start the game...
        </div>
      )}

      {/* Bottom Ad */}
      {/* <div style={{ marginTop: '24px' }}>
        <AdBanner slot="inline" />
      </div> */}
    </div>
  );
}

function SettingControl({ label, value, min, max, onChange }) {
  return (
    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 8px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
        <button onClick={() => onChange(Math.max(min, value - 1))}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', color: '#fff', width: '26px', height: '26px', fontSize: '16px', cursor: 'pointer' }}>
          −
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: '28px', textAlign: 'center' }}>{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', color: '#fff', width: '26px', height: '26px', fontSize: '16px', cursor: 'pointer' }}>
          +
        </button>
      </div>
    </div>
  );
}
