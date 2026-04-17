import React from 'react';
import PageLayout from '../components/PageLayout';
import AdBanner from '../components/AdBanner';
import { SITE_CONFIG } from '../config/config';

const FEATURES = [
  { emoji: '💣', title: 'Word Bomb', desc: 'Real-time multiplayer word game. Type a word containing the given substring before the timer runs out or lose a life.' },
  { emoji: '🧠', title: 'Trivia Blitz', desc: 'Fast-paced trivia rounds against friends. Answer correctly and quickly to outscore your opponents.' },
  { emoji: '🎨', title: 'Sketch & Guess', desc: 'Draw and let your friends guess what you\'re creating — Pictionary-style, under pressure.' },
  { emoji: '♟️', title: 'Speed Chess', desc: 'Lightning-fast chess with custom time controls. Play against friends in real time.' },
];

const TEAM = [
  { emoji: '👨‍💻', role: 'Founder & Developer', desc: `Built ${SITE_CONFIG.app_name_without_space} as a fun side project to bring people together through casual multiplayer games.` },
];

export default function About() {
  return (
    <PageLayout
      title={`About ${SITE_CONFIG.app_name}`}
      subtitle="A real-time multiplayer game platform where you can play with friends instantly — no account needed."
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Mission */}
        <Section label="Our Mission">
          <p style={bodyText}>
            {SITE_CONFIG.app_name_without_space} was built with one simple goal — make it effortless to play fun party games with
            friends online. No sign-ups, no downloads, no complicated setup. Just create a room,
            share the code, and start playing in seconds.
          </p>
          <p style={{ ...bodyText, marginTop: '12px' }}>
            Whether you're killing time with coworkers, playing with friends in different cities,
            or hosting a casual game night — {SITE_CONFIG.app_name_without_space} has you covered.
          </p>
        </Section>

        <AdBanner slot="inline" style={{ marginBottom: '40px' }} />

        {/* Games */}
        <Section label="Our Games">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {FEATURES.map(f => (
              <div key={f.title} style={card}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{f.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{f.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* How it works */}
        <Section label="How It Works">
          {[
            ['1', 'Pick a game from the homepage'],
            ['2', 'Create a room — you\'ll get a 5-letter code'],
            ['3', 'Share the code with friends'],
            ['4', 'Host adjusts settings and starts the game'],
            ['5', 'Last one standing wins 🏆'],
          ].map(([num, text]) => (
            <div key={num} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '14px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,77,109,0.12)',
                border: '1px solid rgba(255,77,109,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 800, color: '#ff4d6d',
                fontFamily: 'var(--font-mono)',
              }}>{num}</div>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{text}</span>
            </div>
          ))}
        </Section>

        {/* Tech */}
        <Section label="Built With">
          <p style={bodyText}>
            {SITE_CONFIG.app_name_without_space} is built on the MERN stack — MongoDB, Express, React, and Node.js — with
            Socket.io powering all real-time multiplayer communication. It's fast, lightweight,
            and designed to work smoothly even on slow connections.
          </p>
        </Section>

      </div>
    </PageLayout>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '48px' }}>
      <div style={{
        fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
        color: '#ff4d6d', marginBottom: '16px', fontFamily: 'var(--font-mono)',
      }}>
        {label.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

const bodyText = {
  color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.8,
};

const card = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '20px',
};
