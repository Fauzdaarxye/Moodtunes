import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MOODS = [
  {
    id: 'Happy', emoji: '😊', color: '#f9ca24',
    desc: 'Joyful, uplifting, feel-good tracks',
    gradient: 'linear-gradient(135deg, rgba(249,202,36,0.2), rgba(249,202,36,0.05))',
    features: 'High valence · High energy · Danceable',
  },
  {
    id: 'Sad', emoji: '😢', color: '#6c5ce7',
    desc: 'Melancholic, reflective, emotional',
    gradient: 'linear-gradient(135deg, rgba(108,92,231,0.2), rgba(108,92,231,0.05))',
    features: 'Low valence · Slow tempo · Acoustic',
  },
  {
    id: 'Energetic', emoji: '⚡', color: '#e17055',
    desc: 'Pumping, intense, workout-ready',
    gradient: 'linear-gradient(135deg, rgba(225,112,85,0.2), rgba(225,112,85,0.05))',
    features: 'High energy · Fast tempo · Loud',
  },
  {
    id: 'Calm', emoji: '🌿', color: '#00b894',
    desc: 'Serene, peaceful, ambient sounds',
    gradient: 'linear-gradient(135deg, rgba(0,184,148,0.2), rgba(0,184,148,0.05))',
    features: 'Low energy · Acoustic · Gentle',
  },
];

export default function MoodPage({ navigate }) {
  const [selected, setSelected] = useState(null);
  const [limit, setLimit]       = useState(10);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const fetchSongs = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API}/recommend?mood=${selected}&limit=${limit}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      navigate('results', { mood: selected, songs: data.songs });
    } catch (e) {
      setError(e.message || 'Could not reach the backend. Make sure Flask is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 40px' }}>
      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: 60, animation: 'fadeUp 0.5s ease both' }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 48, marginBottom: 16 }}>
          How are you <span style={{ color: 'var(--green)' }}>feeling?</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 16 }}>
          Select your current mood and we'll curate the perfect playlist.
        </p>
      </div>

      {/* Mood grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 48 }}>
        {MOODS.map((m, i) => (
          <div
            key={m.id}
            onClick={() => setSelected(m.id)}
            style={{
              background:  selected === m.id ? m.gradient : 'var(--surface)',
              border:      `2px solid ${selected === m.id ? m.color : 'var(--border)'}`,
              borderRadius: 20, padding: '32px 28px',
              cursor: 'pointer', transition: 'all 0.25s',
              transform: selected === m.id ? 'scale(1.02)' : 'none',
              boxShadow: selected === m.id ? `0 0 40px rgba(255,255,255,0.05)` : 'none',
              animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Selected indicator */}
            {selected === m.id && (
              <div style={{
                position: 'absolute', top: 16, right: 16,
                width: 24, height: 24, borderRadius: '50%',
                background: m.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: '#000', fontWeight: 700,
              }}>✓</div>
            )}

            <div style={{ fontSize: 52, marginBottom: 16,
              animation: selected === m.id ? 'float 2s ease-in-out infinite' : 'none' }}>
              {m.emoji}
            </div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 22, marginBottom: 6 }}>
              {m.id}
            </div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
              {m.desc}
            </div>
            <div style={{
              fontSize: 11, color: m.color, fontWeight: 600,
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              {m.features}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="glass" style={{ padding: '28px 32px', marginBottom: 32 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
          Number of recommendations: <span style={{ color: 'var(--green)' }}>{limit}</span>
        </label>
        <input
          type="range" min={5} max={20} step={1}
          value={limit} onChange={e => setLimit(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--green)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: 'var(--text3)', fontSize: 12 }}>
          <span>5</span><span>20</span>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
          borderRadius: 12, padding: '14px 20px', marginBottom: 24,
          color: '#e74c3c', fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <button
          className="btn-primary"
          onClick={fetchSongs}
          disabled={!selected || loading}
          style={{
            opacity: (!selected || loading) ? 0.5 : 1,
            cursor: (!selected || loading) ? 'not-allowed' : 'pointer',
            fontSize: 16, padding: '16px 48px',
          }}
        >
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 18, height: 18, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              Finding songs…
            </span>
          ) : `Get ${selected || 'Mood'} Playlist →`}
        </button>
      </div>
    </div>
  );
}
