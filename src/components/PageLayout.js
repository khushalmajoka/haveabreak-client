import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SITE_CONFIG } from '../config/config';

const NAV_LINKS = [
  { to: '/',        label: 'Home' },
  { to: '/about',   label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const FOOTER_LINKS = [
  { to: '/about',          label: 'About' },
  { to: '/contact',        label: 'Contact' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms',          label: 'Terms of Service' },
];

export default function PageLayout({ children, title, subtitle }) {
  const { pathname } = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span style={{ fontSize: '22px' }}>🎮</span>
          <span style={{
            fontWeight: 800, fontSize: '18px',
            background: 'linear-gradient(135deg, #ff4d6d, #ff8c42)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{SITE_CONFIG.app_name}</span>
        </Link>
        <div style={{ display: 'flex', gap: '6px' }}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: pathname === to ? '#fff' : 'var(--text-muted)',
              background: pathname === to ? 'rgba(255,77,109,0.12)' : 'transparent',
              border: pathname === to ? '1px solid rgba(255,77,109,0.25)' : '1px solid transparent',
              transition: 'all 0.2s',
              textDecoration: 'none',
            }}>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Page header */}
      {(title || subtitle) && (
        <div style={{
          textAlign: 'center',
          padding: '56px 24px 40px',
          borderBottom: '1px solid var(--border)',
        }}>
          {title && (
            <h1 style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 800,
              marginBottom: '10px',
              background: 'linear-gradient(135deg, #f0f0f5, #6b6b82)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>{title}</h1>
          )}
          {subtitle && (
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '500px', margin: '0 auto' }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '32px 24px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'space-between', alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🎮</span>
              <span style={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #ff4d6d, #ff8c42)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{SITE_CONFIG.app_name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: '8px' }}>
                © {new Date().getFullYear()}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {FOOTER_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} style={{
                  color: 'var(--text-muted)', fontSize: '13px',
                  textDecoration: 'none', transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.target.style.color = '#f0f0f5'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
