import React from 'react';
import logger from '../utils/logger';

// ── ErrorBoundary ─────────────────────────────────────────────────────────────
// React error boundaries MUST be class components — hooks cannot catch
// render-phase errors. This wraps any subtree and catches crashes before
// they propagate up and blank the whole app.
//
// Usage (two patterns):
//
//   1. Global catch-all — wraps the entire <Routes> in App.js
//      <ErrorBoundary>
//        <Routes>...</Routes>
//      </ErrorBoundary>
//
//   2. Isolated per-page — wraps a single game page so one crash only
//      affects that page, not the whole app
//      <ErrorBoundary isolate pageName="Word Bomb">
//        <GamePage />
//      </ErrorBoundary>

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError:  false,
      errorMsg:  '',
      errorInfo: '',
    };
  }

  // Called during the render phase when a descendant throws.
  // Use this to update state so the next render shows the fallback UI.
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMsg: error?.message || 'An unexpected error occurred.',
    };
  }

  // Called after the render phase. Use this for logging — do NOT use it
  // to update state (that causes an infinite loop).
  componentDidCatch(error, info) {
    logger.error('ErrorBoundary caught a render error', {
      message:        error?.message,
      componentStack: info?.componentStack,
      pageName:       this.props.pageName || 'unknown',
    });

    this.setState({ errorInfo: info?.componentStack || '' });
  }

  handleGoHome = () => {
    // Reset state first so the boundary is clear when the user navigates back
    this.setState({ hasError: false, errorMsg: '', errorInfo: '' });
    window.location.href = '/';
  };

  handleReload = () => {
    this.setState({ hasError: false, errorMsg: '', errorInfo: '' });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      // Happy path — render children normally
      return this.props.children;
    }

    const { isolate, pageName } = this.props;

    // ── Fallback UI ───────────────────────────────────────────────────────────
    return (
      <div style={{
        minHeight:      isolate ? '60vh' : '100vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '24px',
        background:     'var(--bg)',
      }}>
        <div style={{
          background:   'var(--bg-card)',
          border:       '1px solid rgba(255,77,109,0.25)',
          borderRadius: '20px',
          padding:      '40px 32px',
          maxWidth:     '440px',
          width:        '100%',
          textAlign:    'center',
        }}>
          {/* Icon */}
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>💥</div>

          {/* Heading */}
          <h1 style={{
            fontSize:     '22px',
            fontWeight:   800,
            color:        'var(--text)',
            marginBottom: '10px',
          }}>
            {pageName ? `${pageName} crashed` : 'Something went wrong'}
          </h1>

          {/* Subtext */}
          <p style={{
            fontSize:     '14px',
            color:        'var(--text-muted)',
            marginBottom: '8px',
            lineHeight:   1.6,
          }}>
            An unexpected error stopped this page from loading.
            {isolate
              ? ' The rest of the app is still running.'
              : ' Try reloading or go back to the home page.'}
          </p>

          {/* Error message (non-production detail) */}
          {process.env.NODE_ENV !== 'production' && this.state.errorMsg && (
            <div style={{
              background:   'rgba(255,77,109,0.07)',
              border:       '1px solid rgba(255,77,109,0.2)',
              borderRadius: '10px',
              padding:      '10px 14px',
              marginBottom: '24px',
              marginTop:    '8px',
              textAlign:    'left',
            }}>
              <div style={{ fontSize: '11px', color: '#ff4d6d', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.05em' }}>
                ERROR DETAIL (dev only)
              </div>
              <code style={{
                fontSize:   '12px',
                color:      'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                wordBreak:  'break-word',
                whiteSpace: 'pre-wrap',
              }}>
                {this.state.errorMsg}
              </code>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
            <button
              onClick={this.handleGoHome}
              style={{
                width:        '100%',
                padding:      '13px',
                background:   'linear-gradient(135deg, #ff4d6d, #ff8c42)',
                border:       'none',
                borderRadius: '12px',
                color:        '#fff',
                fontWeight:   800,
                fontSize:     '15px',
                cursor:       'pointer',
                fontFamily:   'var(--font-display)',
              }}
            >
              🏠 Go to Home
            </button>

            <button
              onClick={this.handleReload}
              style={{
                width:        '100%',
                padding:      '12px',
                background:   'transparent',
                border:       '1px solid var(--border)',
                borderRadius: '12px',
                color:        'var(--text-muted)',
                fontWeight:   600,
                fontSize:     '14px',
                cursor:       'pointer',
                fontFamily:   'var(--font-display)',
              }}
            >
              ↺ Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;