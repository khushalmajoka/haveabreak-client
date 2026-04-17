import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SITE_CONFIG } from '../config/config';

export default function NotFound() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center',
    }}>
      {/* Glowing background blob */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,77,109,0.07) 0%, transparent 70%)',
      }} />

      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        position: 'relative',
      }}>
        {/* 404 big number */}
        <div style={{
          fontSize: 'clamp(80px, 18vw, 140px)',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          background: 'linear-gradient(135deg, rgba(255,77,109,0.3), rgba(255,140,66,0.15))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          marginBottom: '8px',
          letterSpacing: '-0.04em',
          userSelect: 'none',
        }}>
          404
        </div>

        {/* Bomb icon */}
        <div style={{
          fontSize: '52px', marginBottom: '20px',
          animation: 'bounce-in 0.5s ease 0.2s both',
        }}>
          💣
        </div>

        <h1 style={{
          fontSize: 'clamp(20px, 4vw, 28px)',
          fontWeight: 800, marginBottom: '10px',
          letterSpacing: '-0.02em',
        }}>
          Room Not Found
        </h1>

        <p style={{
          color: 'var(--text-muted)', fontSize: '15px',
          maxWidth: '380px', lineHeight: 1.7, marginBottom: '8px',
        }}>
          Looks like this page doesn't exist — or it got blown up.
        </p>

        {/* Show the bad URL */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,77,109,0.08)',
          border: '1px solid rgba(255,77,109,0.2)',
          borderRadius: '8px',
          padding: '6px 14px',
          marginBottom: '32px',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'rgba(255,77,109,0.7)',
          maxWidth: '320px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {pathname}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{
            padding: '13px 28px',
            background: 'linear-gradient(135deg, #ff4d6d, #ff8c42)',
            borderRadius: '12px', color: '#fff',
            fontWeight: 800, fontSize: '14px', textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            🏠 Back to Home
          </Link>
          <Link to="/about" style={{
            padding: '13px 28px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
            borderRadius: '12px', color: 'var(--text-muted)',
            fontWeight: 700, fontSize: '14px', textDecoration: 'none',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            About {SITE_CONFIG.app_name_without_space}
          </Link>
        </div>

        {/* Quick links */}
        <div style={{
          marginTop: '48px',
          display: 'flex', gap: '20px', justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {[
            { to: '/privacy-policy', label: 'Privacy Policy' },
            { to: '/terms', label: 'Terms' },
            { to: '/contact', label: 'Contact' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              color: 'var(--text-muted)', fontSize: '12px',
              textDecoration: 'none', opacity: 0.6,
              transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => e.target.style.opacity = '1'}
              onMouseLeave={e => e.target.style.opacity = '0.6'}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
