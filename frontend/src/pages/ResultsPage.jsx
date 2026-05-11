import React, { useState } from 'react';
import SongCard from '../components/SongCard';

// FIXED: was incorrectly 'localhost:5003' in old version
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MOOD_META = {
  Happy:     { color: '#f9ca24', emoji: '😊', bg: 'rgba(249,202,36,0.07)' },
  Sad:       { color: '#6c5ce7', emoji: '😢', bg: 'rgba(108,92,231,0.07)' },
  Energetic: { color: '#e17055', emoji: '⚡', bg: 'rgba(225,112,85,0.07)' },
  Calm:      { color: '#00b894', emoji: '🌿', bg: 'rgba(0,184,148,0.07)'  },
};

const avg = (arr, key) => arr.length
  ? arr.reduce((s, x) => s + (x[key] || 0), 0) / arr.length
  : 0;

export default function ResultsPage({ mood, songs: initialSongs, navigate }) {
  const [songs,   setSongs]   = useState(initialSongs || []);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const m = MOOD_META[mood] || MOOD_META.Happy;

  const filtered = songs.filter(s =>
    (s.track_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.artists    || '').toLowerCase().includes(search.toLowerCase())
  );

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API}/recommend?mood=${mood}&limit=${songs.length || 10}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSongs(data.songs || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 32px 60px' }}>

      {/* Header banner */}
      <div style={{
        background:   m.bg,
        border:       `1px solid ${m.color}33`,
        borderRadius: 24, padding: '36px 44px', marginBottom: 44,
        animation:    'fadeUp 0.5s ease both',
        display:      'flex', justifyContent: 'space-between',
        alignItems:   'center', flexWrap: 'wrap', gap: 20,
      }}>
        <div>
          <div style={{ fontSize: 52, marginBottom: 10 }}>{m.emoji}</div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(28px,4vw,40px)', marginBottom: 6 }}>
            {mood} <span style={{ color: m.color }}>Playlist</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>
            {songs.length} songs curated for your mood via Spotify
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={refresh}
            style={{
              background: 'transparent', color: 'var(--text2)',
              border: '1px solid var(--border)', borderRadius: 50,
              padding: '9px 22px', cursor: 'pointer',
              fontFamily: 'DM Sans', fontSize: 13, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.color = m.color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
          >
            🔄 Refresh
          </button>
          <button className="btn-primary" onClick={() => navigate('mood')} style={{ fontSize: 13, padding: '9px 22px' }}>
            ← Change Mood
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))',
        gap: 14, marginBottom: 44, animation: 'fadeUp 0.5s ease 0.08s both',
      }}>
        {[
          { label: 'Avg Valence',      val: `${(avg(songs,'valence') * 100).toFixed(0)}%` },
          { label: 'Avg Energy',       val: `${(avg(songs,'energy') * 100).toFixed(0)}%`  },
          { label: 'Avg Danceability', val: `${(avg(songs,'danceability') * 100).toFixed(0)}%` },
          { label: 'Avg Tempo',        val: `${avg(songs,'tempo').toFixed(0)} BPM`        },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: '18px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: m.color }}>
              {s.val}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 11, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 32, animation: 'fadeUp 0.5s ease 0.12s both' }}>
        <div style={{ position: 'relative', maxWidth: 380 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search songs or artists…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 50,
              padding: '11px 18px 11px 40px',
              color: 'var(--text)', fontSize: 13, outline: 'none',
              fontFamily: 'DM Sans', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = m.color}
            onBlur={e  => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        {search && (
          <div style={{ marginTop: 7, color: 'var(--text3)', fontSize: 12 }}>
            Showing {filtered.length} of {songs.length} songs
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)',
          borderRadius: 12, padding: '12px 18px', marginBottom: 24,
          color: '#e74c3c', fontSize: 13,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Song grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text3)', marginTop: 16, fontSize: 14 }}>Refreshing playlist…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '80px 0' }}>
          {search ? `No songs found for "${search}"` : 'No songs found.'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: 18,
          animation: 'fadeUp 0.5s ease 0.16s both',
        }}>
          {filtered.map((song, i) => (
            <SongCard key={song.id || i} song={song} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
