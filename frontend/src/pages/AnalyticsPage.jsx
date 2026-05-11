import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MOOD_COLORS = {
  Happy:     '#f9ca24',
  Sad:       '#6c5ce7',
  Energetic: '#e17055',
  Calm:      '#00b894',
};

/* ── sub-components ──────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color }) {
  return (
    <div className="glass" style={{ padding: '26px 22px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 34, color: color || 'var(--green)', marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{label}</div>
      {sub && <div style={{ color: 'var(--text3)', fontSize: 11 }}>{sub}</div>}
    </div>
  );
}

function HBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function ModelBars({ comparison }) {
  if (!comparison) return null;
  const max = Math.max(...Object.values(comparison));
  return (
    <div>
      {Object.entries(comparison).map(([name, acc]) => (
        <div key={name} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: 14 }}>{name}</span>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--green)', fontSize: 16 }}>{acc}%</span>
          </div>
          <div style={{ height: 10, background: 'var(--bg3)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${acc}%`,
              background: name.includes('Forest') ? 'var(--green)' : 'var(--teal)',
              borderRadius: 5, transition: 'width 1s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfusionMatrix({ matrix, labels }) {
  if (!matrix || !labels) return null;
  const maxVal = Math.max(...matrix.flat(), 1);
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'inline-block' }}>
        <div style={{ display: 'flex', paddingLeft: 80 }}>
          {labels.map(l => (
            <div key={l} style={{ width: 70, textAlign: 'center', fontSize: 10, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase' }}>
              {l.slice(0, 6)}
            </div>
          ))}
        </div>
        {matrix.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ width: 80, fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', textAlign: 'right', paddingRight: 10 }}>
              {labels[i]?.slice(0, 6)}
            </div>
            {row.map((val, j) => {
              const alpha = val / maxVal;
              const bg    = i === j
                ? `rgba(29,185,84,${0.15 + alpha * 0.75})`
                : `rgba(231,112,85,${alpha * 0.65})`;
              return (
                <div key={j} style={{
                  width: 70, height: 52, background: bg,
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
                  color: alpha > 0.3 ? '#fff' : 'var(--text3)',
                  borderRadius: 6,
                }}>
                  {val}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarChart({ data }) {
  if (!data) return null;
  const moods    = Object.keys(data);
  const features = ['valence', 'energy', 'danceability', 'acousticness'];
  const labels   = ['Valence', 'Energy', 'Dance', 'Acoustic'];
  const cx = 160, cy = 160, r = 110;
  const N  = features.length;
  const angle = i => (Math.PI * 2 * i) / N - Math.PI / 2;
  const pt    = (v, i) => ({ x: cx + r * v * Math.cos(angle(i)), y: cy + r * v * Math.sin(angle(i)) });
  const colors = Object.values(MOOD_COLORS);

  return (
    <svg viewBox="0 0 320 320" width="300" height="300" style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}>
      {[0.25, 0.5, 0.75, 1].map((lv, gi) => (
        <polygon key={gi}
          points={features.map((_, i) => { const p = pt(lv, i); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
        />
      ))}
      {features.map((_, i) => {
        const p = pt(1, i);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}
      {labels.map((lbl, i) => {
        const p = pt(1.22, i);
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="var(--text3)" fontSize="11">{lbl}</text>;
      })}
      {moods.map((mood, mi) => {
        const pts = features.map((f, fi) => {
          const p = pt(data[mood]?.[f] ?? 0, fi);
          return `${p.x},${p.y}`;
        }).join(' ');
        return (
          <polygon key={mood} points={pts}
            fill={colors[mi] + '25'} stroke={colors[mi]} strokeWidth="2"
          />
        );
      })}
      {moods.map((mood, mi) => (
        <g key={mood} transform={`translate(10,${240 + mi * 18})`}>
          <rect width="10" height="10" rx="2" fill={colors[mi]} />
          <text x="14" y="9" fill="var(--text2)" fontSize="11">{mood}</text>
        </g>
      ))}
    </svg>
  );
}

function FeatureBars({ importances }) {
  if (!importances || !Object.keys(importances).length) {
    return <p style={{ color: 'var(--text3)', fontSize: 13 }}>Feature importances available for Random Forest model only.</p>;
  }
  const max    = Math.max(...Object.values(importances));
  const sorted = Object.entries(importances).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      {sorted.map(([feat, imp]) => (
        <HBar key={feat} label={feat} value={`${(imp * 100).toFixed(1)}%`} max={max * 100} color="var(--teal)" />
      ))}
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch(`${API}/analytics`)
      .then(r => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
      })
      .then(d  => { setData(d);    setLoading(false); })
      .catch(e => { setError(e.message || 'Backend not reachable.'); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ marginBottom: 16 }} />
        <p style={{ color: 'var(--text3)' }}>Loading analytics…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 560, margin: '100px auto', padding: '0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontFamily: 'Syne', marginBottom: 12 }}>Backend Offline</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 20 }}>{error}</p>
      <code style={{
        background: 'var(--bg3)', padding: '12px 20px', borderRadius: 10,
        display: 'block', color: 'var(--green)', fontSize: 13, textAlign: 'left',
      }}>
        cd backend && python app.py
      </code>
    </div>
  );

  const {
    accuracy, model_name, model_comparison,
    confusion_matrix, class_labels,
    mood_distribution, feature_averages, feature_importances,
  } = data || {};

  const moodTotal = mood_distribution
    ? Object.values(mood_distribution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px 60px' }}>

      <div style={{ marginBottom: 52, animation: 'fadeUp 0.5s ease both' }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(30px,4vw,44px)', marginBottom: 10 }}>
          Analytics <span style={{ color: 'var(--green)' }}>Dashboard</span>
        </h1>
        <p style={{ color: 'var(--text2)' }}>ML model performance, dataset insights, and audio feature analysis.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: 18, marginBottom: 44 }}>
        <StatCard label="Model Accuracy"  value={`${accuracy}%`}              sub={model_name}           color="var(--green)"  />
        <StatCard label="Training Tracks" value={moodTotal}                   sub="synthetic samples"    color="var(--teal)"   />
        <StatCard label="Mood Classes"    value={class_labels?.length || 4}   sub="categories"           color="#f9ca24"       />
        <StatCard label="Audio Features"  value="6"                           sub="valence, energy, …"   color="var(--orange)" />
      </div>

      {/* Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="glass" style={{ padding: '30px', animation: 'fadeUp 0.5s ease 0.06s both' }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 22 }}>Mood Distribution</h3>
          {mood_distribution && Object.entries(mood_distribution).map(([mood, count]) => (
            <HBar key={mood} label={mood} value={count} max={moodTotal} color={MOOD_COLORS[mood] || 'var(--green)'} />
          ))}
        </div>
        <div className="glass" style={{ padding: '30px', animation: 'fadeUp 0.5s ease 0.10s both' }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 22 }}>Model Comparison</h3>
          <ModelBars comparison={model_comparison} />
          <div style={{
            marginTop: 18, background: 'rgba(29,185,84,0.07)',
            border: '1px solid rgba(29,185,84,0.18)', borderRadius: 10, padding: '12px 16px',
            fontSize: 13, color: 'var(--text2)',
          }}>
            🏆 Best: <strong style={{ color: 'var(--green)' }}>{model_name}</strong> — {accuracy}%
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="glass" style={{ padding: '30px', animation: 'fadeUp 0.5s ease 0.14s both' }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 22 }}>Feature Profile by Mood</h3>
          <RadarChart data={feature_averages} />
        </div>
        <div className="glass" style={{ padding: '30px', animation: 'fadeUp 0.5s ease 0.18s both' }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 22 }}>Confusion Matrix</h3>
          <ConfusionMatrix matrix={confusion_matrix} labels={class_labels} />
          <p style={{ marginTop: 14, color: 'var(--text3)', fontSize: 11 }}>
            Rows = actual · Columns = predicted · Green diagonal = correct
          </p>
        </div>
      </div>

      {/* Feature importances */}
      <div className="glass" style={{ padding: '30px', animation: 'fadeUp 0.5s ease 0.22s both' }}>
        <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 22 }}>Feature Importances</h3>
        <FeatureBars importances={feature_importances} />
      </div>
    </div>
  );
}
