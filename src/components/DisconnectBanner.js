import React from 'react';

// Shows a fixed banner at the top when the socket is disconnected.
// Disappears automatically when connected is restored.
export default function DisconnectBanner({ connected }) {
  if (connected) return null;

  return (
    <div style={{
      position:        'fixed',
      top:             0,
      left:            0,
      right:           0,
      zIndex:          9999,
      background:      'rgba(255, 140, 66, 0.95)',
      backdropFilter:  'blur(8px)',
      padding:         '10px 16px',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             '10px',
      fontSize:        '13px',
      fontWeight:      600,
      color:           '#fff',
      fontFamily:      'var(--font-display)',
    }}>
      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>
        ⟳
      </span>
      Reconnecting… your game is saved, hang tight.
    </div>
  );
}