import React, { useEffect, useState } from 'react';

export default function Navbar({ page, navigate, user, onSignOut }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { id: 'home',      label: 'Home'      },
    { id: 'mood',      label: 'Get Songs' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <nav style={{
      position:   'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(10,10,15,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : 'none',
      transition: 'all 0.3s ease',
      padding:    '0 40px',
      height:     60,
      display:    'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <button
        onClick={() => navigate('home')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <span style={{ fontSize: 22 }}>🎵</span>
        <span style={{
          fontFamily: 'Syne', fontWeight: 800, fontSize: 20,
          color: 'var(--text)', letterSpacing: '-0.5px',
        }}>
          Mood<span style={{ color: 'var(--green)' }}>spot</span>
        </span>
      </button>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {links.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              style={{
                background:   page === id ? 'rgba(29,185,84,0.12)' : 'transparent',
                border:       page === id ? '1px solid rgba(29,185,84,0.3)' : '1px solid transparent',
                color:        page === id ? 'var(--green)' : 'var(--text2)',
                borderRadius: 50,
                padding:      '6px 18px',
                cursor:       'pointer',
                fontFamily:   'DM Sans',
                fontWeight:   page === id ? 600 : 400,
                fontSize:     14,
                transition:   'all 0.2s',
              }}
              onMouseEnter={e => { if (page !== id) e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { if (page !== id) e.currentTarget.style.color = 'var(--text2)'; }}
            >
              {label}
            </button>
          ))}
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
            <button
              type="button"
              onClick={() => navigate('mood')}
              title={user.email}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid rgba(29,185,84,0.35)',
                background: 'rgba(29,185,84,0.14)',
                color: 'var(--green)',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {user.name.slice(0, 1).toUpperCase()}
            </button>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text2)',
                borderRadius: 50,
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('login')}
            style={{
              background: page === 'login' ? 'var(--green)' : 'rgba(255,255,255,0.06)',
              border: page === 'login' ? '1px solid var(--green)' : '1px solid var(--border)',
              color: page === 'login' ? '#000' : 'var(--text)',
              borderRadius: 50,
              padding: '7px 18px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              marginLeft: 8,
            }}
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
