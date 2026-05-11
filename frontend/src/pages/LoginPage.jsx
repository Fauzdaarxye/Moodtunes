import React, { useState } from 'react';

const FIELD_STYLE = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--text)',
  fontSize: 15,
  padding: '13px 14px',
  outline: 'none',
};

const GoogleMark = () => (
  <span
    aria-hidden
    style={{
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: '#fff',
      color: '#4285f4',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: 15,
      flex: '0 0 auto',
    }}
  >
    G
  </span>
);

export default function LoginPage({ onAuth, navigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const createAccount = (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Add your name to create your personal recommendation account.');
      return;
    }

    if (!/^[^\s@]+@gmail\.com$/.test(trimmedEmail)) {
      setError('Use a Gmail address to continue.');
      return;
    }

    setError('');
    onAuth({ name: trimmedName, email: trimmedEmail, provider: 'gmail' });
  };

  const continueWithGmail = () => {
    onAuth({
      name: 'Moodtunes Listener',
      email: 'listener@gmail.com',
      provider: 'gmail',
    });
  };

  return (
    <section
      style={{
        minHeight: '100vh',
        padding: '112px 40px 56px',
        background:
          'linear-gradient(145deg, rgba(29,185,84,0.12) 0%, rgba(10,10,15,0) 34%), var(--bg)',
      }}
    >
      <div
        className="auth-grid"
        style={{
          width: '100%',
          maxWidth: 1080,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(340px, 0.95fr)',
          gap: 28,
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            padding: '44px 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              width: 'fit-content',
              alignItems: 'center',
              gap: 8,
              border: '1px solid rgba(29,185,84,0.35)',
              background: 'rgba(29,185,84,0.09)',
              color: 'var(--green)',
              borderRadius: 50,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.4px',
              marginBottom: 26,
            }}
          >
            PERSONAL MUSIC ACCOUNT
          </div>

          <h1
            style={{
              fontSize: 'clamp(38px, 6vw, 66px)',
              maxWidth: 620,
              marginBottom: 22,
              fontWeight: 800,
            }}
          >
            Save your mood history and tune recommendations around you.
          </h1>

          <p
            style={{
              color: 'var(--text2)',
              fontSize: 18,
              maxWidth: 560,
              lineHeight: 1.7,
              marginBottom: 34,
            }}
          >
            Sign up with Gmail to create a private Moodtunes profile for faster
            access to recommendations, saved moods, and listening patterns.
          </p>

          <div
            className="auth-benefits"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
              maxWidth: 620,
            }}
          >
            {[
              ['Saved moods', 'Keep track of the moods you return to most.'],
              ['Personal picks', 'Shape future song lists around your taste.'],
              ['Quick access', 'Jump back into recommendations instantly.'],
            ].map(([title, copy]) => (
              <div key={title} className="glass" style={{ borderRadius: 12, padding: 18 }}>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.5 }}>{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass" style={{ borderRadius: 18, padding: 28, alignSelf: 'center' }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 28, marginBottom: 8 }}>Create account</h2>
            <p style={{ color: 'var(--text2)' }}>
              Use Gmail to access your personal recommendation account.
            </p>
          </div>

          <button
            type="button"
            onClick={continueWithGmail}
            style={{
              width: '100%',
              minHeight: 50,
              border: '1px solid rgba(255,255,255,0.16)',
              background: '#f7f7fb',
              color: '#141418',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              marginBottom: 18,
            }}
          >
            <GoogleMark />
            Continue with Gmail
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <span style={{ height: 1, flex: 1, background: 'var(--border)' }} />
            <span style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 700 }}>OR</span>
            <span style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          </div>

          <form onSubmit={createAccount}>
            <label style={{ display: 'block', color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>
              Name
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              style={{ ...FIELD_STYLE, marginBottom: 16 }}
            />

            <label style={{ display: 'block', color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>
              Gmail address
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@gmail.com"
              style={{ ...FIELD_STYLE, marginBottom: error ? 10 : 18 }}
            />

            {error && (
              <p style={{ color: '#ff8b8b', fontSize: 13, marginBottom: 16 }}>{error}</p>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: 14 }}>
              Create personal account
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate('home')}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid transparent',
              color: 'var(--text2)',
              cursor: 'pointer',
              padding: 10,
              fontSize: 14,
            }}
          >
            Continue without an account
          </button>
        </div>
      </div>
    </section>
  );
}
