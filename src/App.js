import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';

import Home          from './pages/Home';
import RoomPage      from './pages/RoomPage';
import GamePage      from './pages/GamePage';
import JoinPage      from './pages/JoinPage';
import BluffGamePage from './pages/BluffGamePage';
import About         from './pages/About';
import Contact       from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms         from './pages/Terms';
import NotFound      from './pages/NotFound';

import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background:  '#1a1a24',
              color:       '#f0f0f5',
              border:      '1px solid rgba(255,255,255,0.1)',
              fontFamily:  'Syne, sans-serif',
              fontSize:    '14px',
            },
            success: { iconTheme: { primary: '#22d3a0', secondary: '#0a0a0f' } },
            error:   { iconTheme: { primary: '#ff4d6d', secondary: '#0a0a0f' } },
          }}
        />

        {/*
          OUTER boundary — catches any crash that slips past the per-page
          boundaries below (e.g. a broken route, a bad import, etc.).
          Shows the full-screen "something went wrong" screen.
        */}
        <ErrorBoundary>
          <Routes>
            {/* Home */}
            <Route path="/" element={<Home />} />

            {/* ── Word Bomb ── */}
            <Route path="/wordbomb/:roomCode" element={<JoinPage game="wordbomb" />} />
            <Route
              path="/wordbomb/room/:roomCode"
              element={
                /*
                  INNER boundary — if RoomPage crashes, only this route
                  shows the error screen. Other routes keep working.
                  The `isolate` prop adjusts the UI ("rest of the app
                  is still running") and `pageName` labels the error.
                */
                <ErrorBoundary isolate pageName="Word Bomb lobby">
                  <RoomPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/wordbomb/game/:roomCode"
              element={
                <ErrorBoundary isolate pageName="Word Bomb">
                  <GamePage />
                </ErrorBoundary>
              }
            />

            {/* ── Cards Bluff ── */}
            <Route path="/cardsbluff/:roomCode" element={<JoinPage game="cardsbluff" />} />
            <Route
              path="/cardsbluff/room/:roomCode"
              element={
                <ErrorBoundary isolate pageName="Cards Bluff">
                  <BluffGamePage />
                </ErrorBoundary>
              }
            />

            {/* ── Static pages ── */}
            <Route path="/about"          element={<About />} />
            <Route path="/contact"        element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms"          element={<Terms />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>

      </SocketProvider>
    </BrowserRouter>
  );
}