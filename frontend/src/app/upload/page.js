'use client';

import { useState, useEffect } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({
    status: 'idle',
    progress: 0,
    processed: 0,
    total: 0,
    duplicatesRemoved: 0,
    meaninglessRemoved: 0,
    error: null
  });
  const [dragActive, setDragActive] = useState(false);

  // Poll status when processing
  useEffect(() => {
    let interval;
    if (status.status === 'processing' || status.status === 'enriching') {
      interval = setInterval(() => {
        fetch('http://localhost:5000/api/status')
          .then(res => res.json())
          .then(data => {
            setStatus(data);
          })
          .catch(err => console.error('Error polling status:', err));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [status.status]);

  // Initial fetch status
  useEffect(() => {
    fetch('http://localhost:5000/api/status')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
      })
      .catch(err => console.error('Error getting status:', err));
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    fetch('http://localhost:5000/api/status/reset', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setFile(null);
      });
  };

  const triggerUpload = (useLocal = false) => {
    if (!file && !useLocal) return;

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (useLocal) {
      formData.append('useLocal', 'true');
    }

    setStatus(prev => ({ ...prev, status: 'processing', progress: 0, error: null }));

    fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error || 'Upload failed') });
        return res.json();
      })
      .then(data => {
        setStatus(prev => ({ ...prev, status: 'processing' }));
      })
      .catch(err => {
        setStatus(prev => ({ ...prev, status: 'failed', error: err.message }));
      });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Pipeline Data Ingestion</h1>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          Upload your raw messy CSV feedback file. The pipeline will clean, standardize, and run batch AI enrichment.
        </p>
      </header>

      {/* Main Upload Control Panel */}
      {status.status === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div 
            className={`dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input 
              type="file" 
              id="fileInput" 
              accept=".csv" 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
            />
            <div className="dropzone-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
            </div>
            {file ? (
              <div>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'hsl(var(--accent))', marginBottom: '4px' }}>Selected File:</p>
                <p style={{ fontSize: '1rem', color: 'white' }}>{file.name} ({Math.round(file.size / 1024)} KB)</p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '4px' }}>Drag & drop your CSV file here, or browse</p>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>Supports CSV format up to 10MB</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            {file && (
              <button className="btn btn-primary" onClick={() => triggerUpload(false)}>
                Process Uploaded File
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => triggerUpload(true)}>
              ⚡ Process Local Workspace File (customer_feedback_raw.csv)
            </button>
          </div>
        </div>
      )}

      {/* Active Pipeline Status */}
      {(status.status === 'processing' || status.status === 'enriching' || status.status === 'completed' || status.status === 'failed') && (
        <div className="glass-panel-elevated" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Header State */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className={`badge ${
                status.status === 'completed' ? 'badge-sentiment-positive' : 
                status.status === 'failed' ? 'badge-sentiment-negative' : 'badge-cat-other'
              }`} style={{ marginBottom: '8px' }}>
                Pipeline: {status.status}
              </span>
              <h2 style={{ fontSize: '1.75rem' }}>
                {status.status === 'processing' && 'Ingesting & Cleaning CSV...'}
                {status.status === 'enriching' && 'Running AI Enrichment batching...'}
                {status.status === 'completed' && 'Processing Completed!'}
                {status.status === 'failed' && 'Pipeline Failed'}
              </h2>
            </div>
            {status.status === 'completed' && (
              <div style={{ color: 'hsl(var(--sentiment-positive))' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
            )}
            {status.status === 'failed' && (
              <div style={{ color: 'hsl(var(--sentiment-negative))' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
            )}
          </div>

          {/* Progress Section */}
          {(status.status === 'processing' || status.status === 'enriching') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>
                  Processed {status.processed} of {status.total} rows ({status.progress}%)
                </span>
                <span style={{ fontWeight: 'bold' }}>{status.progress}%</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${status.progress}%` }} />
              </div>
            </div>
          )}

          {/* Error Message */}
          {status.error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid hsl(var(--sentiment-negative))', padding: '16px', borderRadius: 'var(--radius-md)', color: 'hsl(var(--sentiment-negative))', fontSize: '0.9rem' }}>
              <strong>Error:</strong> {status.error}
            </div>
          )}

          {/* Cleaning Statistics Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border-light))' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Duplicates Removed</p>
              <h3 style={{ fontSize: '2rem', color: 'white' }}>{status.duplicatesRemoved}</h3>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Identical IDs / Texts</p>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid hsl(var(--border-light))', borderRight: '1px solid hsl(var(--border-light))' }}>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Noise Rows Dropped</p>
              <h3 style={{ fontSize: '2rem', color: 'white' }}>{status.meaninglessRemoved}</h3>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Punctuation, test rows, etc.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Enriched Rows Ingested</p>
              <h3 style={{ fontSize: '2rem', color: 'hsl(var(--accent))' }}>
                {status.status === 'completed' ? status.total - status.duplicatesRemoved - status.meaninglessRemoved : status.processed}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Stored in database</p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={handleReset}>
              Reset Pipeline & Run Again
            </button>
            {status.status === 'completed' && (
              <a href="/" className="btn btn-primary">
                View Dashboard
              </a>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
