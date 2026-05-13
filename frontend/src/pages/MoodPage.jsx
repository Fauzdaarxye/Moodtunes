import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MOOD_AUDIO_DEFAULTS = {
  Happy:    { valence: 0.75, energy: 0.72, danceability: 0.68, tempo: 118 },
  Sad:      { valence: 0.28, energy: 0.32, danceability: 0.35, tempo: 82  },
  Energetic:{ valence: 0.62, energy: 0.88, danceability: 0.72, tempo: 132 },
  Calm:     { valence: 0.48, energy: 0.22, danceability: 0.28, tempo: 88  },
};

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
  const [selected,   setSelected]   = useState(null);
  const [limit,      setLimit]      = useState(10);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [rare,       setRare]       = useState(false);
  const [audioFeats, setAudioFeats] = useState(() => ({ ...MOOD_AUDIO_DEFAULTS.Happy }));

  useEffect(() => {
    if (selected && MOOD_AUDIO_DEFAULTS[selected]) {
      setAudioFeats({ ...MOOD_AUDIO_DEFAULTS[selected] });
    }
  }, [selected]);

  const fetchSongs = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        mood:         selected,
        limit:        String(limit),
        rare:         String(rare),
        valence:      String(audioFeats.valence),
        energy:       String(audioFeats.energy),
        danceability: String(audioFeats.danceability),
        tempo:        String(audioFeats.tempo),
      });

      const res  = await fetch(`${API}/recommend?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      if (!data.songs || data.songs.length === 0) {
        throw new Error('No songs found — Spotify may be slow, try again.');
      }

      navigate('results', {
        mood:                selected,
        songs:               data.songs,
        audioFeaturesProfile:data.audio_features_profile ?? null,
        recommendLimit:      limit,
        rare,
      });
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, marginBottom: 40 }}>
        {MOODS.map((m, i) => (
          <div
            key={m.id}
            onClick={() => setSelected(m.id)}
            style={{
              background:   selected === m.id ? m.gradient : 'var(--surface)',
              border:       `2px solid ${selected === m.id ? m.color : 'var(--border)'}`,
              borderRadius: 20, padding: '30px 26px',
              cursor: 'pointer', transition: 'all 0.22s',
              transform: selected === m.id ? 'scale(1.02)' : 'scale(1)',
              position: 'relative', overflow: 'hidden',
              animation: `fadeUp 0.5s ease ${i * 0.07}s both`,
            }}
          >
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

      {/* Playlist size */}
      <div className="glass" style={{ padding: '24px 28px', marginBottom: 18 }}>
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

      {/* ── Discovery mode toggle ─────────────────────────────────────────── */}
      <div className="glass" style={{ padding: '22px 28px', marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Discovery mode</div>
        <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 18, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text2)' }}>Popular</strong> prioritizes listenable, well-known songs that still match your audio profile.&nbsp;
          <strong style={{ color: 'var(--teal)' }}>Rare Gems</strong> is optional and intentionally lowers popularity for discovery.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          {/* Popular button */}
          <button
            type="button"
            onClick={() => setRare(false)}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: `2px solid ${!rare ? 'var(--green)' : 'var(--border)'}`,
              background: !rare ? 'rgba(29,185,84,0.10)' : 'transparent',
              color: !rare ? 'var(--green)' : 'var(--text2)',
              fontFamily: 'DM Sans',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            🔥 Popular & Trending
          </button>

          {/* Rare Gems button */}
          <button
            type="button"
            onClick={() => setRare(true)}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: `2px solid ${rare ? 'var(--teal)' : 'var(--border)'}`,
              background: rare ? 'rgba(23,162,184,0.10)' : 'transparent',
              color: rare ? 'var(--teal)' : 'var(--text2)',
              fontFamily: 'DM Sans',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            💎 Rare Gems
          </button>
        </div>

        {rare && (
          <div style={{
            marginTop: 14,
            background: 'rgba(23,162,184,0.07)',
            border: '1px solid rgba(23,162,184,0.25)',
            borderRadius: 10, padding: '10px 14px',
            fontSize: 12, color: 'var(--teal)', lineHeight: 1.5,
          }}>
            💎 Rare Gems mode active — you'll discover songs most people have never heard, perfectly matched to your mood.
          </div>
        )}
      </div>

      {/* Audio feature targets */}
      {selected && (
        <div className="glass" style={{ padding: '22px 28px', marginBottom: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Audio feature targets</div>
          <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 18, lineHeight: 1.5 }}>
            Fine-tune the audio profile for this mood. Songs must stay near these values,
            but exact percentages are not required; popular, listenable matches rank first.
          </p>
          {[
            { key: 'valence',      label: 'Valence (positivity)', min: 0,   max: 1,   step: 0.01, fmt: v => `${(v * 100).toFixed(0)}%` },
            { key: 'energy',       label: 'Energy',               min: 0,   max: 1,   step: 0.01, fmt: v => `${(v * 100).toFixed(0)}%` },
            { key: 'danceability', label: 'Danceability',         min: 0,   max: 1,   step: 0.01, fmt: v => `${(v * 100).toFixed(0)}%` },
            { key: 'tempo',        label: 'Tempo (BPM)',          min: 40,  max: 200, step: 1,    fmt: v => `${Math.round(v)} BPM` },
          ].map(row => (
            <div key={row.key} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{row.label}</span>
                <span style={{ color: 'var(--green)', fontFamily: 'Syne', fontWeight: 700, fontSize: 12 }}>
                  {row.fmt(audioFeats[row.key])}
                </span>
              </div>
              <input
                type="range"
                min={row.min} max={row.max} step={row.step}
                value={audioFeats[row.key]}
                onChange={e => setAudioFeats(prev => ({ ...prev, [row.key]: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--green)', cursor: 'pointer' }}
              />
            </div>
          ))}
        </div>
      )}

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
            `${rare ? '💎 Find Rare ' : '🔥 Get '}${selected || 'Mood'} Playlist →`
          )}
        </button>
        {!selected && (
          <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 10 }}>Select a mood first</p>
        )}
      </div>

    </div>
  );
}
