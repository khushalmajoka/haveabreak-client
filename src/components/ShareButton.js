import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { SITE_CONFIG } from '../config/config';

const SHARE_OPTIONS = [
  {
    id: 'copy',
    label: 'Copy Link',
    emoji: '🔗',
    color: '#22d3a0',
    action: (url) => {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    },
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    emoji: '💬',
    color: '#25d366',
    action: (url, roomCode) => {
      const text = encodeURIComponent(`Join my Word Bomb room on ${SITE_CONFIG.app_name_without_space}! 💣\nRoom code: *${roomCode}*\n${url}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    },
  },
  {
    id: 'telegram',
    label: 'Telegram',
    emoji: '✈️',
    color: '#2aabee',
    action: (url, roomCode) => {
      const text = encodeURIComponent(`Join my Word Bomb room on ${SITE_CONFIG.app_name_without_space}! 💣 Room: ${roomCode}`);
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
    },
  },
  {
    id: 'native',
    label: 'More…',
    emoji: '⬆️',
    color: '#7c3aed',
    action: (url, roomCode) => {
      if (navigator.share) {
        navigator.share({
          title: `Join my ${SITE_CONFIG.app_name_without_space} room!`,
          text: `Join my Word Bomb room! Code: ${roomCode}`,
          url,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      }
    },
  },
];

export default function ShareButton({ roomCode, game = 'wordbomb' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build the shareable URL — points to JoinPage
  const shareUrl = `${window.location.origin}/${game}/${roomCode}`;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '9px 16px',
          background: open ? 'rgba(34,211,160,0.15)' : 'rgba(34,211,160,0.08)',
          border: `1px solid ${open ? 'rgba(34,211,160,0.45)' : 'rgba(34,211,160,0.25)'}`,
          borderRadius: '10px',
          color: '#22d3a0', fontWeight: 700, fontSize: '13px',
          cursor: 'pointer', transition: 'all 0.2s',
          fontFamily: 'var(--font-display)',
        }}
      >
        <span>🔗</span>
        <span>Share Room</span>
        <span style={{
          fontSize: '10px', opacity: 0.7,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
          display: 'inline-block',
        }}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'var(--bg-card2)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '10px',
          minWidth: '220px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          zIndex: 200,
          animation: 'fadeIn 0.15s ease',
        }}>
          {/* Room link preview */}
          <div style={{
            padding: '8px 10px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            marginBottom: '8px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {shareUrl}
          </div>

          {/* Share options */}
          {SHARE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => { opt.action(shareUrl, roomCode); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 12px',
                background: 'transparent',
                border: 'none', borderRadius: '8px',
                cursor: 'pointer', transition: 'background 0.15s',
                color: 'var(--text)', fontSize: '13px', fontWeight: 600,
                fontFamily: 'var(--font-display)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${opt.color}14`}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: `${opt.color}18`,
                border: `1px solid ${opt.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', flexShrink: 0,
              }}>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}

          {/* Room code manual copy */}
          <div style={{
            borderTop: '1px solid var(--border)',
            marginTop: '8px', paddingTop: '10px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '8px 12px',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Room Code</span>
            <button
              onClick={() => { navigator.clipboard.writeText(roomCode); toast.success('Code copied!'); setOpen(false); }}
              style={{
                background: 'rgba(255,77,109,0.12)',
                border: '1px solid rgba(255,77,109,0.3)',
                borderRadius: '8px',
                padding: '4px 12px',
                color: '#ff4d6d',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800, fontSize: '14px',
                letterSpacing: '0.1em', cursor: 'pointer',
              }}
            >
              {roomCode}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
