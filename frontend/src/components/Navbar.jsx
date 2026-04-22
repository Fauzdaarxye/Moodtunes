import React from 'react';

const links = [
  { id: 'home', label: 'Home' },
  { id: 'mood', label: 'Pick Mood' },
  { id: 'analytics', label: 'Analytics' },
];

export default function Navbar({ page, navigate }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '64px',
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('home')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'glow 3s ease-in-out infinite',
          fontSize: 18,
        }}>🎵</div>
        <span style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: 18, letterSpacing: '-0.5px',
        }}>
          Mood<span style={{ color: 'var(--green)' }}>tunes</span>
        </span>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', gap: 8 }}>
        {links.map(l => (
          <button
            key={l.id}
            onClick={() => navigate(l.id)}
            style={{
              background: page === l.id ? 'rgba(29,185,84,0.15)' : 'transparent',
              color: page === l.id ? 'var(--green)' : 'var(--text2)',
              border: page === l.id ? '1px solid rgba(29,185,84,0.3)' : '1px solid transparent',
              borderRadius: '8px',
              padding: '6px 16px',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500,
              fontSize: 14,
              transition: 'all 0.2s',
            }}
          >
            {l.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
