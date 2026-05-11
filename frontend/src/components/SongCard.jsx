import React, { useState } from 'react';

const MOOD_COLORS = {
  Happy:     { bg: 'rgba(249,202,36,0.10)', border: 'rgba(249,202,36,0.30)', accent: '#f9ca24', emoji: '😊' },
  Sad:       { bg: 'rgba(108,92,231,0.10)', border: 'rgba(108,92,231,0.30)', accent: '#6c5ce7', emoji: '😢' },
  Energetic: { bg: 'rgba(225,112,85,0.10)', border: 'rgba(225,112,85,0.30)', accent: '#e17055', emoji: '⚡' },
  Calm:      { bg: 'rgba(0,184,148,0.10)',  border: 'rgba(0,184,148,0.30)',  accent: '#00b894', emoji: '🌿' },
  Unknown:   { bg: 'rgba(100,100,120,0.10)',border: 'rgba(100,100,120,0.30)',accent: '#888',    emoji: '🎵' },
};

function AudioBar({ value, color }) {
  return (
    <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${Math.round((value || 0) * 100)}%`,
        background: color, borderRadius: 2, transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

export default function SongCard({ song, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [imgErr,  setImgErr]  = useState(false);
  const m = MOOD_COLORS[song.mood] || MOOD_COLORS.Unknown;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:    hovered ? m.bg : 'var(--surface)',
        border:        `1px solid ${hovered ? m.border : 'var(--border)'}`,
        borderRadius:  16,
        overflow:      'hidden',
        transition:    'all 0.25s ease',
        transform:     hovered ? 'translateY(-4px)' : 'none',
        boxShadow:     hovered ? `0 16px 48px ${m.bg}` : 'none',
        animation:     `fadeUp 0.4s ease ${Math.min(index, 10) * 0.04}s both`,
        cursor:        'default',
      }}
    >
      {/* Album art */}
      {song.image && !imgErr ? (
        <div style={{ position: 'relative', paddingTop: '62%', overflow: 'hidden' }}>
          <img
            src={song.image}
            alt={song.track_name}
            onError={() => setImgErr(true)}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
              filter:    hovered ? 'brightness(0.8)' : 'brightness(0.65)',
              transition: 'filter 0.3s',
            }}
          />
          {/* gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, transparent 55%)',
          }} />

          {/* Open in Spotify button — visible on hover */}
          {song.spotify_url && (
            <a
              href={song.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                position:       'absolute', top: 10, right: 10,
                background:     '#1db954', color: '#000',
                borderRadius:   50, padding: '5px 13px',
                fontSize:       11, fontWeight: 700,
                textDecoration: 'none',
                opacity:        hovered ? 1 : 0,
                transition:     'opacity 0.2s',
                display:        'flex', alignItems: 'center', gap: 4,
              }}
            >
              ▶ Spotify
            </a>
          )}

          {/* Mood badge */}
          <div style={{
            position: 'absolute', bottom: 10, left: 12,
            background: m.bg, color: m.accent,
            border: `1px solid ${m.border}`,
            borderRadius: 20, padding: '2px 10px',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          }}>
            <span>{m.emoji} {(song.mood || 'UNKNOWN').toUpperCase()}</span>
            {song.feature_source === 'profile' && (
              <span style={{
                fontSize: 8, fontWeight: 800, opacity: 0.95,
                background: 'rgba(0,0,0,0.35)', padding: '2px 6px', borderRadius: 8,
              }}>PROFILE</span>
            )}
          </div>

          {/* Confidence badge */}
          {song.confidence > 0 && (
            <div style={{
              position: 'absolute', bottom: 10, right: 12,
              color: 'var(--text3)', fontSize: 10,
            }}>
              {song.confidence}%
            </div>
          )}
        </div>
      ) : (
        /* Fallback when no image */
        <div style={{
          height: 80,
          background: `linear-gradient(135deg, ${m.bg}, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, position: 'relative',
        }}>
          {m.emoji}
          <div style={{
            position: 'absolute', bottom: 8, left: 12,
            background: m.bg, color: m.accent,
            border: `1px solid ${m.border}`,
            borderRadius: 20, padding: '2px 10px',
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          }}>
            <span>{(song.mood || '').toUpperCase()}</span>
            {song.feature_source === 'profile' && (
              <span style={{ fontSize: 8, opacity: 0.9 }}>PROFILE</span>
            )}
          </div>
        </div>
      )}

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
          marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {song.track_name}
        </div>
        <div style={{
          color: 'var(--text2)', fontSize: 12, marginBottom: 14,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {song.artists}
          {song.album && (
            <span style={{ color: 'var(--text3)' }}> · {song.album}</span>
          )}
        </div>

        {/* Audio feature bars */}
        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          {[
            ['Valence',      song.valence],
            ['Energy',       song.energy],
            ['Danceability', song.danceability],
            ['Acousticness', song.acousticness],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: 3,
              }}>
                <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {label}
                </span>
                <span style={{ fontSize: 10, color: m.accent, fontWeight: 600 }}>
                  {((val || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <AudioBar value={val || 0} color={m.accent} />
            </div>
          ))}
        </div>

        {/* Footer: tempo, loudness, preview */}
        <div style={{
          paddingTop: 10, borderTop: '1px solid var(--border)',
          display: 'flex', flexWrap: 'wrap', gap: '8px 14px', justifyContent: 'space-between', alignItems: 'center',
          color: 'var(--text3)', fontSize: 11,
        }}>
          <span>🎚 {(song.tempo || 0).toFixed(0)} BPM</span>
          <span>🔉 {(song.loudness ?? 0).toFixed(1)} dB</span>
          {song.preview_url ? (
            <a
              href={song.preview_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: m.accent, fontWeight: 700, fontSize: 11, textDecoration: 'none', marginLeft: 'auto' }}
            >
              ▶ Preview
            </a>
          ) : (
            <span style={{ marginLeft: 'auto' }}>No preview</span>
          )}
        </div>

        {/* Popularity */}
        {song.popularity > 0 && (
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text3)' }}>
            ⭐ Popularity: {song.popularity}/100
          </div>
        )}
      </div>
    </div>
  );
}
