import React, { useState } from 'react';
import SongCard from '../components/SongCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const MOOD_META = {
  Happy:     { color: '#f9ca24', emoji: '😊', bg: 'rgba(249,202,36,0.08)' },
  Sad:       { color: '#6c5ce7', emoji: '😢', bg: 'rgba(108,92,231,0.08)' },
  Energetic: { color: '#e17055', emoji: '⚡', bg: 'rgba(225,112,85,0.08)' },
  Calm:      { color: '#00b894', emoji: '🌿', bg: 'rgba(0,184,148,0.08)'  },
};

export default function ResultsPage({ mood, songs: initialSongs, navigate }) {
  const [songs, setSongs]     = useState(initialSongs || []);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(false);
  const m = MOOD_META[mood] || MOOD_META.Happy;

  const filtered = songs.filter(s =>
    s.track_name.toLowerCase().includes(search.toLowerCase()) ||
    s.artists.toLowerCase().includes(search.toLowerCase())
  );

  const refresh = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/recommend?mood=${mood}&limit=${songs.length}`);
      const data = await res.json();
      setSongs(data.songs || []);
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 40px' }}>

      {/* Header */}
      <div style={{
        background: m.bg, border: `1px solid ${m.color}33`,
        borderRadius: 24, padding: '40px 48px', marginBottom: 48,
        animation: 'fadeUp 0.5s ease both',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{m.emoji}</div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 40, marginBottom: 8 }}>
            {mood} <span style={{ color: m.color }}>Playlist</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 16 }}>
            {songs.length} songs curated just for your mood
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={refresh}
            style={{
              background: 'transparent', color: 'var(--text2)',
              border: '1px solid var(--border)', borderRadius: 50,
              padding: '10px 24px', cursor: 'pointer', fontFamily: 'DM Sans',
              transition: 'all 0.2s', fontSize: 14,
            }}
            onMouseEnter={e => { e.target.style.borderColor = m.color; e.target.style.color = m.color; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)'; }}
          >
            🔄 Refresh
          </button>
          <button className="btn-primary" onClick={() => navigate('mood')} style={{ fontSize: 14, padding: '10px 24px' }}>
            ← Change Mood
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 36, animation: 'fadeUp 0.5s ease 0.1s both' }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text3)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search songs or artists…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 50,
              padding: '12px 20px 12px 44px',
              color: 'var(--text)', fontSize: 14, outline: 'none',
              fontFamily: 'DM Sans',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = m.color}
            onBlur={e  => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        {search && (
          <div style={{ marginTop: 8, color: 'var(--text3)', fontSize: 13 }}>
            Showing {filtered.length} of {songs.length} songs
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16, marginBottom: 48, animation: 'fadeUp 0.5s ease 0.15s both',
      }}>
        {[
          { label: 'Avg Valence',      val: avg(songs, 'valence'),      fmt: pct },
          { label: 'Avg Energy',       val: avg(songs, 'energy'),       fmt: pct },
          { label: 'Avg Danceability', val: avg(songs, 'danceability'), fmt: pct },
          { label: 'Avg Tempo',        val: avg(songs, 'tempo'),        fmt: bpm },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, color: m.color }}>
              {s.fmt(s.val)}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Song grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '80px 0' }}>
          No songs found for "{search}"
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filtered.map((song, i) => <SongCard key={i} song={song} index={i} />)}
        </div>
      )}
    </div>
  );
}

const avg = (arr, key) => arr.length ? arr.reduce((s, x) => s + (x[key] || 0), 0) / arr.length : 0;
const pct = v => `${(v * 100).toFixed(0)}%`;
const bpm = v => `${v.toFixed(0)}`;
