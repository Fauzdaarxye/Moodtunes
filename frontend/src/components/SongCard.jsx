import React, { useState } from 'react';

const MOOD_COLORS = {
  Happy:     { bg: 'rgba(249,202,36,0.1)',  border: 'rgba(249,202,36,0.3)',  accent: '#f9ca24', emoji: '😊' },
  Sad:       { bg: 'rgba(108,92,231,0.1)',  border: 'rgba(108,92,231,0.3)',  accent: '#6c5ce7', emoji: '😢' },
  Energetic: { bg: 'rgba(225,112,85,0.1)',  border: 'rgba(225,112,85,0.3)',  accent: '#e17055', emoji: '⚡' },
  Calm:      { bg: 'rgba(0,184,148,0.1)',   border: 'rgba(0,184,148,0.3)',   accent: '#00b894', emoji: '🌿' },
};

function Bar({ value, color }) {
  return (
    <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${Math.round(value * 100)}%`,
        background: color, borderRadius: 2,
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

export default function SongCard({ song, index }) {
  const [hovered, setHovered] = useState(false);
  const m = MOOD_COLORS[song.mood] || MOOD_COLORS.Happy;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? m.bg : 'var(--surface)',
        border: `1px solid ${hovered ? m.border : 'var(--border)'}`,
        borderRadius: 16,
        padding: '20px',
        cursor: 'default',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? `0 12px 40px ${m.bg}` : 'none',
        animation: `fadeUp 0.4s ease ${index * 0.05}s both`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: 15, marginBottom: 4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {song.track_name}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>{song.artists}</div>
        </div>
        <div style={{
          marginLeft: 12, fontSize: 20,
          animation: hovered ? 'float 2s ease-in-out infinite' : 'none',
        }}>
          {m.emoji}
        </div>
      </div>

      {/* Mood badge */}
      <div style={{
        display: 'inline-block',
        background: m.bg, color: m.accent,
        border: `1px solid ${m.border}`,
        borderRadius: 20, padding: '2px 10px',
        fontSize: 11, fontWeight: 600,
        marginBottom: 14,
        letterSpacing: '0.5px',
      }}>
        {song.mood.toUpperCase()}
      </div>

      {/* Feature bars */}
      <div style={{ display: 'grid', gap: 8 }}>
        {[
          { label: 'Valence',      val: song.valence },
          { label: 'Energy',       val: song.energy },
          { label: 'Danceability', val: song.danceability },
        ].map(({ label, val }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
              <span style={{ fontSize: 11, color: m.accent }}>{(val * 100).toFixed(0)}%</span>
            </div>
            <Bar value={val} color={m.accent} />
          </div>
        ))}
      </div>

      {/* Tempo */}
      <div style={{
        marginTop: 14, paddingTop: 12,
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between',
        color: 'var(--text3)', fontSize: 12,
      }}>
        <span>🎚 {song.tempo?.toFixed(0)} BPM</span>
        <span>🎸 {(song.acousticness * 100).toFixed(0)}% acoustic</span>
      </div>
    </div>
  );
}
