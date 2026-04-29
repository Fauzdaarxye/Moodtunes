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
      <div style={{ height: '100%', width: `${Math.round((value||0) * 100)}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
    </div>
  );
}

export default function SongCard({ song, index }) {
  const [hovered, setHovered] = useState(false);
  const [imgErr,  setImgErr]  = useState(false);
  const m = MOOD_COLORS[song.mood] || MOOD_COLORS.Happy;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? m.bg : 'var(--surface)',
        border: `1px solid ${hovered ? m.border : 'var(--border)'}`,
        borderRadius: 16, overflow: 'hidden',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? `0 12px 40px ${m.bg}` : 'none',
        animation: `fadeUp 0.4s ease ${index * 0.05}s both`,
      }}
    >
      {song.image && !imgErr ? (
        <div style={{ position: 'relative', paddingTop: '60%', overflow: 'hidden' }}>
          <img src={song.image} alt={song.track_name} onError={() => setImgErr(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                     objectFit: 'cover', filter: hovered ? 'brightness(.85)' : 'brightness(.7)',
                     transition: 'filter .3s' }} />
          <div style={{ position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(10,10,15,.9) 0%, transparent 60%)' }} />
          {song.spotify_url && (
            <a href={song.spotify_url} target="_blank" rel="noopener noreferrer"
              style={{ position: 'absolute', top: 10, right: 10, background: '#1db954', color: '#000',
                       borderRadius: 50, padding: '5px 12px', fontSize: 11, fontWeight: 700,
                       textDecoration: 'none', opacity: hovered ? 1 : 0, transition: 'opacity .2s' }}>
              ▶ Open
            </a>
          )}
          <div style={{ position: 'absolute', bottom: 10, left: 12, background: m.bg, color: m.accent,
                        border: `1px solid ${m.border}`, borderRadius: 20, padding: '2px 10px',
                        fontSize: 10, fontWeight: 600, letterSpacing: '.5px', backdropFilter: 'blur(8px)' }}>
            {m.emoji} {song.mood?.toUpperCase()}
          </div>
        </div>
      ) : (
        <div style={{ height: 80, background: `linear-gradient(135deg, ${m.bg}, transparent)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 36, position: 'relative' }}>
          {m.emoji}
          <div style={{ position: 'absolute', bottom: 8, left: 12, background: m.bg, color: m.accent,
                        border: `1px solid ${m.border}`, borderRadius: 20, padding: '2px 10px',
                        fontSize: 10, fontWeight: 600 }}>
            {song.mood?.toUpperCase()}
          </div>
        </div>
      )}

      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.track_name}
        </div>
        <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 12,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.artists}
        </div>

        <div style={{ display: 'grid', gap: 7 }}>
          {[['Valence',song.valence],['Energy',song.energy],['Danceability',song.danceability]].map(([lbl,val]) => (
            <div key={lbl}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.5px' }}>{lbl}</span>
                <span style={{ fontSize:10, color:m.accent }}>{((val||0)*100).toFixed(0)}%</span>
              </div>
              <Bar value={val||0} color={m.accent} />
            </div>
          ))}
        </div>

        <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid var(--border)',
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      color:'var(--text3)', fontSize:11 }}>
          <span>🎚 {song.tempo?.toFixed(0)} BPM</span>
          {song.preview_url
            ? <a href={song.preview_url} target="_blank" rel="noopener noreferrer"
                 style={{ color:m.accent, fontSize:11, fontWeight:600, textDecoration:'none' }}>▶ Preview</a>
            : <span>🎸 {((song.acousticness||0)*100).toFixed(0)}% acoustic</span>
          }
        </div>
      </div>
    </div>
  );
}
