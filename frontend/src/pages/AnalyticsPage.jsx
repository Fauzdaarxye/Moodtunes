import React, { useEffect, useRef, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MOOD_COLORS = {
  Happy:     '#f9ca24',
  Sad:       '#6c5ce7',
  Energetic: '#e17055',
  Calm:      '#00b894',
};

/* ── tiny bar helpers ────────────────────────────────────────────────────── */
function HBar({ label, value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="glass" style={{ padding: '28px 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 36, color: color || 'var(--green)', marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{label}</div>
      {sub && <div style={{ color: 'var(--text3)', fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

/* ── Confusion Matrix ────────────────────────────────────────────────────── */
function ConfusionMatrix({ matrix, labels }) {
  if (!matrix || !labels) return null;
  const maxVal = Math.max(...matrix.flat());
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'inline-block' }}>
        {/* col headers */}
        <div style={{ display: 'flex', paddingLeft: 80 }}>
          {labels.map(l => (
            <div key={l} style={{ width: 72, textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase' }}>
              {l.slice(0,5)}
            </div>
          ))}
        </div>
        {matrix.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ width: 80, fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', textAlign: 'right', paddingRight: 12 }}>
              {labels[i]?.slice(0,5)}
            </div>
            {row.map((val, j) => {
              const alpha = maxVal > 0 ? val / maxVal : 0;
              const color = i === j ? `rgba(29,185,84,${0.2 + alpha * 0.75})` : `rgba(231,112,85,${alpha * 0.7})`;
              return (
                <div key={j} style={{
                  width: 72, height: 52,
                  background: color,
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
                  color: alpha > 0.4 ? '#fff' : 'var(--text3)',
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

/* ── Feature radar (SVG) ─────────────────────────────────────────────────── */
function RadarChart({ data }) {
  if (!data) return null;
  const moods = Object.keys(data);
  const features = ['valence','energy','danceability','acousticness'];
  const featureLabels = ['Valence','Energy','Dance','Acoustic'];
  const cx = 160, cy = 160, r = 110;
  const N = features.length;
  const angle = (i) => (Math.PI * 2 * i) / N - Math.PI / 2;

  const point = (val, i) => ({
    x: cx + r * val * Math.cos(angle(i)),
    y: cy + r * val * Math.sin(angle(i)),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const mooodClrs = Object.values(MOOD_COLORS);

  return (
    <svg viewBox="0 0 320 320" width="320" height="320" style={{ overflow: 'visible' }}>
      {/* Grid */}
      {gridLevels.map((lv, gi) => (
        <polygon key={gi}
          points={features.map((_, i) => { const p = point(lv, i); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
        />
      ))}
      {/* Axes */}
      {features.map((_, i) => {
        const p = point(1, i);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}
      {/* Axis labels */}
      {featureLabels.map((lbl, i) => {
        const p = point(1.2, i);
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="var(--text3)" fontSize="11">{lbl}</text>;
      })}
      {/* Mood polygons */}
      {moods.map((mood, mi) => {
        const pts = features.map((f, fi) => {
          const val = data[mood]?.[f] ?? 0;
          const p = point(val, fi);
          return `${p.x},${p.y}`;
        }).join(' ');
        return (
          <polygon key={mood} points={pts}
            fill={mooodClrs[mi] + '30'} stroke={mooodClrs[mi]} strokeWidth="2"
          />
        );
      })}
      {/* Legend */}
      {moods.map((mood, mi) => (
        <g key={mood} transform={`translate(12, ${240 + mi * 18})`}>
          <rect width="10" height="10" rx="2" fill={mooodClrs[mi]} />
          <text x="14" y="9" fill="var(--text2)" fontSize="11">{mood}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── Model comparison bars ───────────────────────────────────────────────── */
function ModelBars({ comparison }) {
  if (!comparison) return null;
  const max = Math.max(...Object.values(comparison));
  return (
    <div>
      {Object.entries(comparison).map(([name, acc]) => (
        <div key={name} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
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

/* ── Feature importance bars ─────────────────────────────────────────────── */
function FeatureBars({ importances }) {
  if (!importances || !Object.keys(importances).length) return (
    <p style={{ color: 'var(--text3)', fontSize: 14 }}>
      Feature importances are only available for tree-based models (Random Forest).
      The best model here is Logistic Regression — its coefficients reflect relative feature weights.
    </p>
  );
  const max = Math.max(...Object.values(importances));
  const sorted = Object.entries(importances).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      {sorted.map(([feat, imp]) => (
        <HBar key={feat} label={feat} value={(imp * 100).toFixed(1) + '%'} max={max * 100} color="var(--teal)" />
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/analytics`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError('Backend not reachable. Run: python app.py'); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div>
        <div className="spinner" style={{ marginBottom: 20 }} />
        <p style={{ color: 'var(--text3)', textAlign: 'center' }}>Loading analytics…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 40px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
      <h2 style={{ fontFamily: 'Syne', marginBottom: 12 }}>Backend Offline</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 20 }}>{error}</p>
      <code style={{ background: 'var(--bg3)', padding: '12px 20px', borderRadius: 8, display: 'block', color: 'var(--green)', fontSize: 14 }}>
        cd backend && python app.py
      </code>
    </div>
  );

  const { accuracy, model_name, model_comparison, confusion_matrix,
          class_labels, mood_distribution, feature_averages,
          feature_importances } = data || {};

  const moodTotal = mood_distribution ? Object.values(mood_distribution).reduce((a, b) => a + b, 0) : 0;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 40px' }}>
      {/* Title */}
      <div style={{ marginBottom: 56, animation: 'fadeUp 0.5s ease both' }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 44, marginBottom: 10 }}>
          Analytics <span style={{ color: 'var(--green)' }}>Dashboard</span>
        </h1>
        <p style={{ color: 'var(--text2)' }}>Model performance, dataset insights, and feature analysis.</p>
      </div>

      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 48 }}>
        <StatCard label="Model Accuracy" value={`${accuracy}%`} sub={model_name} color="var(--green)" />
        <StatCard label="Total Songs"    value={moodTotal}       sub="in dataset"  color="var(--teal)" />
        <StatCard label="Mood Classes"   value={class_labels?.length || 4} sub="categories" color="#f9ca24" />
        <StatCard label="Audio Features" value="6" sub="valence, energy…" color="var(--orange)" />
      </div>

      {/* Row 1: mood dist + model comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Mood Distribution */}
        <div className="glass" style={{ padding: '32px', animation: 'fadeUp 0.5s ease 0.05s both' }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 24 }}>Mood Distribution</h3>
          {mood_distribution && Object.entries(mood_distribution).map(([mood, count]) => (
            <HBar key={mood} label={mood} value={count} max={moodTotal} color={MOOD_COLORS[mood] || 'var(--green)'} />
          ))}
        </div>

        {/* Model comparison */}
        <div className="glass" style={{ padding: '32px', animation: 'fadeUp 0.5s ease 0.1s both' }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 24 }}>Model Comparison</h3>
          <ModelBars comparison={model_comparison} />
          <div style={{
            marginTop: 20, background: 'rgba(29,185,84,0.08)',
            border: '1px solid rgba(29,185,84,0.2)', borderRadius: 10, padding: '14px 18px',
            fontSize: 13, color: 'var(--text2)',
          }}>
            🏆 Best model: <strong style={{ color: 'var(--green)' }}>{model_name}</strong> with {accuracy}% accuracy
          </div>
        </div>
      </div>

      {/* Row 2: radar + confusion matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Feature radar */}
        <div className="glass" style={{ padding: '32px', animation: 'fadeUp 0.5s ease 0.15s both' }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 24 }}>Feature Profile by Mood</h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart data={feature_averages} />
          </div>
        </div>

        {/* Confusion matrix */}
        <div className="glass" style={{ padding: '32px', animation: 'fadeUp 0.5s ease 0.2s both' }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 24 }}>Confusion Matrix</h3>
          <ConfusionMatrix matrix={confusion_matrix} labels={class_labels} />
          <p style={{ marginTop: 16, color: 'var(--text3)', fontSize: 12 }}>
            Rows = actual label · Columns = predicted · Green diagonal = correct
          </p>
        </div>
      </div>

      {/* Feature importances */}
      <div className="glass" style={{ padding: '32px', animation: 'fadeUp 0.5s ease 0.25s both' }}>
        <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 24 }}>Feature Importances</h3>
        <FeatureBars importances={feature_importances} />
      </div>
    </div>
  );
}
