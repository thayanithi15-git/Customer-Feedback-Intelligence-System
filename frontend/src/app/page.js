'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5050/api/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch dashboard data. Make sure backend is running and data is uploaded.');
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Analyzing feedback and compiling insights...</p>
        <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error || !data || data.totalCount === 0) {
    return (
      <div className="glass-panel-elevated" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--sentiment-negative))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h2 style={{ marginBottom: '16px' }}>No Data Available</h2>
        <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '24px' }}>
          {error || 'The feedback database is currently empty. Please upload the raw CSV file to clean and enrich the dataset.'}
        </p>
        <a href="/upload" className="btn btn-primary">Go to Upload Page</a>
      </div>
    );
  }

  const positivePct = data.sentimentBreakdown.find(s => s.sentiment === 'positive')?.percentage || 0;
  const negativePct = data.sentimentBreakdown.find(s => s.sentiment === 'negative')?.percentage || 0;
  const neutralPct = data.sentimentBreakdown.find(s => s.sentiment === 'neutral')?.percentage || 0;

  // Custom SVG Trend Line Chart Generator
  const renderTrendChart = () => {
    if (!data.trendData || data.trendData.length === 0) return <p>No historical trend data available.</p>;

    const points = data.trendData;
    const width = 600;
    const height = 200;
    const padding = 30;

    // Find min and max for scaling
    const maxVal = Math.max(...points.map(p => p.volume));
    const minVal = 0;
    const maxPosRatio = Math.max(...points.map(p => p.positiveRatio));

    const getX = (index) => padding + (index / (points.length - 1)) * (width - 2 * padding);
    const getY = (val) => height - padding - ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding);
    const getYPos = (ratio) => height - padding - (ratio / 100) * (height - 2 * padding);

    // Build SVG Path strings
    let volumePath = '';
    let positivePath = '';
    let volumeAreaPath = '';

    points.forEach((p, i) => {
      const x = getX(i);
      const yVol = getY(p.volume);
      const yPos = getYPos(p.positiveRatio);

      if (i === 0) {
        volumePath = `M ${x} ${yVol}`;
        positivePath = `M ${x} ${yPos}`;
        volumeAreaPath = `M ${x} ${height - padding} L ${x} ${yVol}`;
      } else {
        volumePath += ` L ${x} ${yVol}`;
        positivePath += ` L ${x} ${yPos}`;
        volumeAreaPath += ` L ${x} ${yVol}`;
      }

      if (i === points.length - 1) {
        volumeAreaPath += ` L ${x} ${height - padding} Z`;
      }
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg" style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.05)" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />

        {/* Volume Area (Filled) */}
        {points.length > 1 && <path d={volumeAreaPath} fill="url(#volGrad)" />}

        {/* Line Paths */}
        {points.length > 1 && (
          <>
            <path d={volumePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            <path d={positivePath} fill="none" stroke="hsl(var(--accent))" strokeWidth="2.5" strokeDasharray="4 2" />
          </>
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(p.volume)} r="4" fill="hsl(var(--primary))" />
            <circle cx={getX(i)} cy={getYPos(p.positiveRatio)} r="3" fill="hsl(var(--accent))" />
          </g>
        ))}

        {/* X Axis Labels */}
        <text x={padding} y={height - 10} fill="hsl(var(--text-muted))" fontSize="10" textAnchor="start">
          {points[0].date}
        </text>
        <text x={width - padding} y={height - 10} fill="hsl(var(--text-muted))" fontSize="10" textAnchor="end">
          {points[points.length - 1].date}
        </text>
      </svg>
    );
  };

  return (
    <div>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Feedback Dashboard</h1>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          Real-time customer sentiment analysis, categories distribution, and resolution trends.
        </p>
      </header>

      {/* KPI Cards Grid */}
      <section className="metrics-grid">
        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">Total Feedbacks</span>
            <div className="metric-icon-wrapper" style={{ color: 'hsl(var(--primary))' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
          </div>
          <div className="metric-value">{data.totalCount}</div>
          <span className="metric-subtext">Cleaned & AI enriched entries</span>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">Average Rating</span>
            <div className="metric-icon-wrapper" style={{ color: 'hsl(var(--category-billing))' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
          </div>
          <div className="metric-value">{data.averageRating || 'N/A'} <span style={{ fontSize: '1.25rem', color: 'hsl(var(--text-muted))' }}>/ 5</span></div>
          <span className="metric-subtext">From reviews with ratings</span>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">Negative Sentiment</span>
            <div className="metric-icon-wrapper" style={{ color: 'hsl(var(--sentiment-negative))' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </div>
          </div>
          <div className="metric-value" style={{ color: 'hsl(var(--sentiment-negative))' }}>{negativePct}%</div>
          <span className="metric-subtext">Needs support attention</span>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">Sarcasm Detected</span>
            <div className="metric-icon-wrapper" style={{ color: 'rgb(236, 72, 153)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20"/><path d="M20 12v8H4v-8"/><path d="m15 5-3-3-3 3"/><path d="M12 2v10"/></svg>
            </div>
          </div>
          <div className="metric-value" style={{ color: 'rgb(236, 72, 153)' }}>{data.sarcasmCount}</div>
          <span className="metric-subtext">Sarcastic comments identified</span>
        </div>
      </section>

      {/* Main Charts & Categories Distribution */}
      <section className="charts-grid">
        {/* Trend analysis chart */}
        <div className="chart-card glass-panel">
          <div className="chart-card-header">
            <h3 className="chart-title">Timeline Feedback Trend</h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '4px', background: 'hsl(var(--primary))', display: 'inline-block' }} />
                Volume
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '4px', borderTop: '2px dashed hsl(var(--accent))', display: 'inline-block' }} />
                Positive Sentiment %
              </span>
            </div>
          </div>
          <div style={{ position: 'relative', height: '240px' }}>
            {renderTrendChart()}
          </div>
        </div>

        {/* Sentiment breakdown ring gauge */}
        <div className="chart-card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-card-header">
            <h3 className="chart-title">Sentiment Breakdown</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', flex: 1 }}>
            {/* Custom visual progress bars for Sentiment */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'hsl(var(--sentiment-positive))' }} />
                  Positive
                </span>
                <span style={{ fontWeight: '600' }}>{positivePct}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${positivePct}%`, backgroundColor: 'hsl(var(--sentiment-positive))' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'hsl(var(--sentiment-negative))' }} />
                  Negative
                </span>
                <span style={{ fontWeight: '600' }}>{negativePct}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${negativePct}%`, backgroundColor: 'hsl(var(--sentiment-negative))' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'hsl(var(--sentiment-neutral))' }} />
                  Neutral
                </span>
                <span style={{ fontWeight: '600' }}>{neutralPct}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${neutralPct}%`, backgroundColor: 'hsl(var(--sentiment-neutral))' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category breakdown (Meters) & Examples */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Category breakdown */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Categories Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {data.categoryVolume.map((item, index) => {
              let color = 'hsl(var(--category-other))';
              if (item.category === 'Billing') color = 'hsl(var(--category-billing))';
              else if (item.category === 'App Bug') color = 'hsl(var(--category-bug))';
              else if (item.category === 'Delivery') color = 'hsl(var(--category-delivery))';
              else if (item.category === 'Staff/Support') color = 'hsl(var(--category-staff))';

              return (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '500' }}>{item.category}</span>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>{item.count} complaints ({item.percentage}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.percentage}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Representative Complaint Examples */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Critical Action Items (Sample Negative Feedback)</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '320px', paddingRight: '4px' }}>
            {Object.keys(data.representativeExamples || {}).map(cat => (
              (data.representativeExamples[cat] || []).length > 0 && (
                <div key={cat} style={{ borderBottom: '1px solid hsl(var(--border-light))', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span className={`badge badge-cat-${cat.toLowerCase().replace('/', '')}`}>{cat}</span>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Latest Complaints</span>
                  </div>
                  
                  <ul style={{ listStyle: 'none', paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(data.representativeExamples[cat] || []).map((ex, i) => (
                      <li key={i} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid hsl(var(--sentiment-negative))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'hsl(var(--text-muted))' }}>ID: #{ex.rawId}</span>
                          {ex.isSarcastic && <span className="badge badge-sarcasm">Sarcasm</span>}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-primary))', fontStyle: 'italic', marginBottom: '4px' }}>
                          "{ex.feedbackText}"
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--accent))', fontWeight: '500' }}>
                          🔑 Summary: {ex.summary}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
