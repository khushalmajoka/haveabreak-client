import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';

import Home          from './pages/Home';
import RoomPage      from './pages/RoomPage';
import GamePage      from './pages/GamePage';
import JoinPage      from './pages/JoinPage';
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
              background: '#1a1a24',
              color: '#f0f0f5',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: 'Syne, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22d3a0', secondary: '#0a0a0f' } },
            error:   { iconTheme: { primary: '#ff4d6d', secondary: '#0a0a0f' } },
          }}
        />
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* ── Word Bomb routes ── */}
          {/* Direct link share — shows join/spectate screen */}
          <Route path="/wordbomb/:roomCode"        element={<JoinPage />} />
          {/* Lobby (waiting room) */}
          <Route path="/wordbomb/room/:roomCode"   element={<RoomPage />} />
          {/* Live gameplay */}
          <Route path="/wordbomb/game/:roomCode"   element={<GamePage />} />

          {/* Static pages */}
          <Route path="/about"          element={<About />} />
          <Route path="/contact"        element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms"          element={<Terms />} />

          {/* 404 — must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}
