import React, { useEffect, useRef } from 'react';

const FEATURES = [
  { icon: '🎭', title: 'Mood Detection', desc: 'Pick your emotional state and let AI do the rest.' },
  { icon: '🤖', title: 'ML-Powered', desc: 'Random Forest & Logistic Regression classify music features.' },
  { icon: '📊', title: 'Analytics', desc: 'Visualise mood distributions, feature heatmaps, and model accuracy.' },
  { icon: '🎵', title: '1000+ Songs', desc: 'Curated Spotify-style dataset with rich audio features.' },
];

const MOODS = [
  { id: 'Happy',     emoji: '😊', color: '#f9ca24', desc: 'Uplifting & joyful vibes' },
  { id: 'Sad',       emoji: '😢', color: '#6c5ce7', desc: 'Melancholic & reflective' },
  { id: 'Energetic', emoji: '⚡', color: '#e17055', desc: 'High-energy & pumping' },
  { id: 'Calm',      emoji: '🌿', color: '#00b894', desc: 'Chill & serene sounds' },
];

export default function HomePage({ navigate }) {
  const canvasRef = useRef(null);

  // Animated background particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(29,185,84,${p.alpha})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '92vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }} />

        {/* Glow orbs */}
        <div style={{
          position: 'absolute', width: 600, height: 600,
          borderRadius: '50%', top: '-150px', left: '-150px',
          background: 'radial-gradient(circle, rgba(29,185,84,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%', bottom: '-100px', right: '10%',
          background: 'radial-gradient(circle, rgba(0,201,167,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(29,185,84,0.1)',
            border: '1px solid rgba(29,185,84,0.3)',
            borderRadius: 50, padding: '6px 20px',
            fontSize: 13, color: 'var(--green)', marginBottom: 32,
            fontWeight: 600, letterSpacing: '1px',
            animation: 'fadeUp 0.5s ease both',
          }}>
            ✦ AI-POWERED MUSIC DISCOVERY
          </div>

          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 'clamp(42px, 7vw, 80px)',
            lineHeight: 1.1, marginBottom: 24,
            animation: 'fadeUp 0.5s ease 0.1s both',
          }}>
            Music that matches<br />
            <span style={{
              background: 'linear-gradient(135deg, var(--green), var(--teal))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              your mood
            </span>
          </h1>

          <p style={{
            fontSize: 18, color: 'var(--text2)', maxWidth: 520, margin: '0 auto 48px',
            lineHeight: 1.7,
            animation: 'fadeUp 0.5s ease 0.2s both',
          }}>
            Tell us how you feel. Our machine learning model analyses audio features — valence, energy, danceability — to find songs perfectly tuned to your emotional state.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeUp 0.5s ease 0.3s both' }}>
            <button className="btn-primary" onClick={() => navigate('mood')} style={{ fontSize: 16, padding: '14px 40px' }}>
              Discover Your Soundtrack →
            </button>
            <button
              onClick={() => navigate('analytics')}
              style={{
                background: 'transparent', color: 'var(--text2)',
                border: '1px solid var(--border)',
                borderRadius: 50, padding: '14px 32px',
                cursor: 'pointer', fontSize: 15, fontFamily: 'DM Sans',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--green)'; e.target.style.color = 'var(--green)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)'; }}
            >
              View Analytics
            </button>
          </div>
        </div>
      </section>

      {/* Quick mood preview */}
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, marginBottom: 48, fontWeight: 800 }}>
          How are you feeling <span style={{ color: 'var(--green)' }}>today?</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {MOODS.map((m, i) => (
            <div
              key={m.id}
              onClick={() => navigate('mood')}
              style={{
                background: `linear-gradient(135deg, rgba(${hexToRgb(m.color)},0.15) 0%, transparent 100%)`,
                border: `1px solid rgba(${hexToRgb(m.color)},0.25)`,
                borderRadius: 20, padding: '32px 24px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.25s',
                animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 16px 48px rgba(${hexToRgb(m.color)},0.2)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 14 }}>{m.emoji}</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>{m.id}</div>
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '40px 40px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, marginBottom: 48, fontWeight: 700, color: 'var(--text2)' }}>
          Built with <span style={{ color: 'var(--text)' }}>machine learning</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="glass" style={{ padding: '28px 24px', animation: `fadeUp 0.5s ease ${i * 0.07}s both` }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{f.title}</div>
              <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
