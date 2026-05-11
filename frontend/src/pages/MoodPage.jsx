import React, { useState } from 'react';

// NOTE: VITE_API_URL comes from frontend/.env (local) or from Vercel env vars (production)
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MOODS = [
  {
    id: 'Happy', emoji: '😊', color: '#f9ca24',
    desc: 'Joyful, uplifting, feel-good tracks',
    gradient: 'linear-gradient(135deg, rgba(249,202,36,0.15), rgba(249,202,36,0.03))',
    features: 'High valence · High energy · Danceable',
  },
  {
    id: 'Sad', emoji: '😢', color: '#6c5ce7',
    desc: 'Melancholic, reflective, emotional',
    gradient: 'linear-gradient(135deg, rgba(108,92,231,0.15), rgba(108,92,231,0.03))',
    features: 'Low valence · Slow tempo · Acoustic',
  },
  {
    id: 'Energetic', emoji: '⚡', color: '#e17055',
    desc: 'Pumping, intense, workout-ready',
    gradient: 'linear-gradient(135deg, rgba(225,112,85,0.15), rgba(225,112,85,0.03))',
    features: 'High energy · Fast tempo · Loud',
  },
  {
    id: 'Calm', emoji: '🌿', color: '#00b894',
    desc: 'Serene, peaceful, ambient sounds',
    gradient: 'linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,184,148,0.03))',
    features: 'Low energy · Acoustic · Gentle',
  },
];

export default function MoodPage({ navigate }) {
  const [selected, setSelected] = useState(null);
  const [limit,    setLimit]    = useState(10);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const fetchSongs = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API}/recommend?mood=${selected}&limit=${limit}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      if (!data.songs || data.songs.length === 0) {
        throw new Error('No songs found — Spotify may be slow, try again.');
      }
      navigate('results', { mood: selected, songs: data.songs });
    } catch (e) {
      setError(e.message || 'Could not reach the backend. Make sure Flask is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '90px 32px 60px' }}>
      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: 56, animation: 'fadeUp 0.5s ease both' }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 50px)', marginBottom: 14 }}>
          How are you <span style={{ color: 'var(--green)' }}>feeling?</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 16 }}>
          Pick a mood — we'll find real Spotify tracks that match your vibe.
        </p>
      </div>

      {/* Mood grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 18, marginBottom: 40,
      }}>
        {MOODS.map((m, i) => (
          <div
            key={m.id}
            onClick={() => setSelected(m.id)}
            style={{
              background:   selected === m.id ? m.gradient : 'var(--surface)',
              border:       `2px solid ${selected === m.id ? m.color : 'var(--border)'}`,
              borderRadius: 20, padding: '30px 26px',
              cursor:       'pointer', transition: 'all 0.22s',
              transform:    selected === m.id ? 'scale(1.02)' : 'scale(1)',
              position:     'relative', overflow: 'hidden',
              animation:    `fadeUp 0.5s ease ${i * 0.07}s both`,
            }}
          >
            {/* Checkmark */}
            {selected === m.id && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                width: 22, height: 22, borderRadius: '50%',
                background: m.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#000', fontWeight: 900,
              }}>✓</div>
            )}

            <div style={{
              fontSize: 48, marginBottom: 14,
              animation: selected === m.id ? 'float 2s ease-in-out infinite' : 'none',
            }}>
              {m.emoji}
            </div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, marginBottom: 6 }}>
              {m.id}
            </div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
              {m.desc}
            </div>
            <div style={{ fontSize: 11, color: m.color, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {m.features}
            </div>
          </div>
        ))}
      </div>

      {/* Slider */}
      <div className="glass" style={{ padding: '24px 28px', marginBottom: 28 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
          Number of songs:{' '}
          <span style={{ color: 'var(--green)', fontFamily: 'Syne', fontWeight: 700 }}>{limit}</span>
        </label>
        <input
          type="range" min={5} max={20} step={1}
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--green)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: 'var(--text3)', fontSize: 12 }}>
          <span>5</span><span>20</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)',
          borderRadius: 12, padding: '13px 18px', marginBottom: 22,
          color: '#e74c3c', fontSize: 13, lineHeight: 1.5,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <button
          className="btn-primary"
          onClick={fetchSongs}
          disabled={!selected || loading}
          style={{ fontSize: 16, padding: '15px 48px' }}
        >
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 16, height: 16,
                border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000',
                borderRadius: '50%', display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
              Fetching songs…
            </span>
          ) : (
            `Get ${selected || 'Mood'} Playlist →`
          )}
        </button>
        {!selected && (
          <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 10 }}>Select a mood first</p>
        )}
      </div>
    </div>
  );
}
