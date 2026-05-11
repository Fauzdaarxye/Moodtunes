import React from 'react';

const FEATURES = [
  { icon: '🤖', title: 'ML-Powered',    desc: 'Random Forest model trained on 1200 synthetic audio-feature samples' },
  { icon: '🎵', title: 'Live Spotify',  desc: 'Real songs fetched from Spotify Search API, filtered by audio features' },
  { icon: '📊', title: 'Analytics',     desc: 'Confusion matrix, feature importance, model comparison and mood radar' },
  { icon: '⚡', title: 'Instant',       desc: 'Results in seconds — no login, no playlist needed' },
];

const MOODS = [
  { id: 'Happy',     emoji: '😊', color: '#f9ca24' },
  { id: 'Sad',       emoji: '😢', color: '#6c5ce7' },
  { id: 'Energetic', emoji: '⚡', color: '#e17055' },
  { id: 'Calm',      emoji: '🌿', color: '#00b894' },
];

export default function HomePage({ navigate }) {
  return (
    <div>
      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '80px 40px 60px',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(29,185,84,0.08) 0%, transparent 70%)',
      }}>
        <div style={{ maxWidth: 720, animation: 'fadeUp 0.6s ease both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(29,185,84,0.08)', border: '1px solid rgba(29,185,84,0.25)',
            borderRadius: 50, padding: '6px 16px', marginBottom: 32,
            fontSize: 12, color: 'var(--green)', fontWeight: 600, letterSpacing: '0.5px',
          }}>
            <span style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: '50%', animation: 'pulse 2s ease infinite' }} />
            MOOD-BASED MUSIC RECOMMENDER
          </div>

          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 1.1, marginBottom: 24 }}>
            Music that matches{' '}
            <span style={{ color: 'var(--green)' }}>how you feel</span>
          </h1>

          <p style={{ color: 'var(--text2)', fontSize: 18, maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Pick a mood. Our ML model + Spotify API finds songs with matching
            audio fingerprints — valence, energy, tempo, and more.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('mood')} style={{ fontSize: 16, padding: '14px 40px' }}>
              Get My Playlist →
            </button>
            <button
              onClick={() => navigate('analytics')}
              style={{
                background: 'transparent', color: 'var(--text2)',
                border: '1px solid var(--border)', borderRadius: 50,
                padding: '14px 32px', cursor: 'pointer',
                fontFamily: 'DM Sans', fontSize: 16, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text2)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
            >
              View Analytics
            </button>
          </div>

          {/* Mood pills */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
            {MOODS.map((m, i) => (
              <button
                key={m.id}
                onClick={() => navigate('mood')}
                style={{
                  background: `${m.color}15`, color: m.color,
                  border: `1px solid ${m.color}40`,
                  borderRadius: 50, padding: '8px 20px',
                  cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 14, fontWeight: 600,
                  transition: 'all 0.2s',
                  animation: `fadeUp 0.5s ease ${0.1 + i * 0.07}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${m.color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${m.color}15`; }}
              >
                {m.emoji} {m.id}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 40px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 36, textAlign: 'center', marginBottom: 56 }}>
          How it <span style={{ color: 'var(--green)' }}>works</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass"
              style={{ padding: '28px 24px', animation: `fadeUp 0.5s ease ${i * 0.08}s both` }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{f.title}</div>
              <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
