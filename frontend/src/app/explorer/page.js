'use client';

import { useState, useEffect } from 'react';

export default function Explorer() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [isSarcastic, setIsSarcastic] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const fetchFeedback = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      limit,
      search,
      sentiment,
      category,
      source,
    });
    if (isSarcastic) {
      params.append('isSarcastic', isSarcastic);
    }

    fetch(`http://localhost:5050/api/feedback?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setFeedbacks(data.data);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching feedbacks:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFeedback();
  }, [page, sentiment, category, source, isSarcastic]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFeedback();
  };

  const downloadCSV = () => {
    window.open('http://localhost:5050/api/export');
  };

  return (
    <div>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Feedback Explorer</h1>
          <p style={{ color: 'hsl(var(--text-secondary))' }}>
            Browse, search, and audit cleaned and enriched customer feedback entries.
          </p>
        </div>
        <button className="btn btn-primary" onClick={downloadCSV}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Cleaned CSV
        </button>
      </header>

      {/* Filter and Search Bar */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
          
          {/* Search text input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>Search Text / ID</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Search feedback..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Sentiment Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>Sentiment</label>
            <select 
              className="input select"
              value={sentiment}
              onChange={e => { setSentiment(e.target.value); setPage(1); }}
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>Category</label>
            <select 
              className="input select"
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              <option value="Billing">Billing</option>
              <option value="App Bug">App Bug</option>
              <option value="Delivery">Delivery</option>
              <option value="Staff/Support">Staff/Support</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Source Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>Source</label>
            <select 
              className="input select"
              value={source}
              onChange={e => { setSource(e.target.value); setPage(1); }}
            >
              <option value="">All Sources</option>
              <option value="support_ticket">Support Ticket</option>
              <option value="app_store_review">App Store Review</option>
              <option value="survey_comment">Survey Comment</option>
            </select>
          </div>

          {/* Sarcasm Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>Sarcasm</label>
            <select 
              className="input select"
              value={isSarcastic}
              onChange={e => { setIsSarcastic(e.target.value); setPage(1); }}
            >
              <option value="">All Comments</option>
              <option value="true">Sarcasm Only</option>
            </select>
          </div>

          {/* Search Action Button */}
          <button type="submit" className="btn btn-secondary">
            Apply Filters
          </button>
        </form>
      </section>

      {/* Main Table Grid */}
      <section className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>
          <span>Showing {feedbacks.length} of {totalCount} records</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : feedbacks.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>No matching records found.</p>
        ) : (
          <div className="table-container">
            <table className="feedback-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Source</th>
                  <th>Category</th>
                  <th>Sentiment</th>
                  <th>Summary</th>
                  <th>Rating</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((f, i) => (
                  <tr key={i} onClick={() => setSelectedFeedback(f)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 'bold' }}>#{f.rawId}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                        {f.source.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-cat-${f.category.toLowerCase().replace('/', '')}`}>
                        {f.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-sentiment-${f.sentiment}`}>
                        {f.sentiment}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.summary}
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {f.rating ? '⭐ '.repeat(f.rating) : '-'}
                    </td>
                    <td>
                      {f.timestamp ? new Date(f.timestamp).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              style={{ padding: '6px 12px' }}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9rem' }}>
              Page {page} of {totalPages}
            </span>
            <button 
              className="btn btn-secondary" 
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              style={{ padding: '6px 12px' }}
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Side Sliding Detailed view Drawer */}
      {selectedFeedback && (
        <div className="drawer-backdrop" onClick={() => setSelectedFeedback(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border-light))', paddingBottom: '16px' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Feedback Details</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setSelectedFeedback(null)}>✕ Close</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className={`badge badge-cat-${selectedFeedback.category.toLowerCase().replace('/', '')}`}>{selectedFeedback.category}</span>
              <span className={`badge badge-sentiment-${selectedFeedback.sentiment}`}>{selectedFeedback.sentiment}</span>
              <span className="badge badge-sentiment-neutral" style={{ textTransform: 'uppercase' }}>{selectedFeedback.source.replace('_', ' ')}</span>
              {selectedFeedback.isSarcastic && <span className="badge badge-sarcasm">Sarcasm Detected</span>}
              {selectedFeedback.language !== 'en' && <span className="badge badge-sentiment-neutral">Lang: {selectedFeedback.language}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '4px' }}>SUMMARY</p>
                <p style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'hsl(var(--accent))' }}>{selectedFeedback.summary}</p>
              </div>

              <div>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '4px' }}>RAW FEEDBACK TEXT</p>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontStyle: 'italic', borderLeft: '3px solid hsl(var(--border-light))' }}>
                  "{selectedFeedback.rawFeedbackText}"
                </div>
              </div>

              <div>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '4px' }}>CLEANED TEXT</p>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', borderLeft: '3px solid hsl(var(--primary))' }}>
                  "{selectedFeedback.feedbackText}"
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid hsl(var(--border-light))', paddingTop: '16px' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>RATING</p>
                  <p style={{ fontWeight: 'bold' }}>{selectedFeedback.rating ? '⭐'.repeat(selectedFeedback.rating) : 'None'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>DATE</p>
                  <p style={{ fontWeight: 'bold' }}>
                    {selectedFeedback.timestamp ? new Date(selectedFeedback.timestamp).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
