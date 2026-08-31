import React, { useState, useEffect } from 'react';
import './SubmissionList.css';

const API_URL = '/api/favorites';  // Vite proxy forwards this to http://localhost:5000/api/favorites

const COLOR_MAP = {
  'Royal Purple': '#7c3aed',
  'Ocean Blue':   '#0ea5e9',
  'Emerald Green':'#10b981',
  'Crimson Red':  '#ef4444',
  'Sunset Orange':'#f97316',
  'Golden Yellow':'#f59e0b',
  'Hot Pink':     '#ec4899',
  'Teal Cyan':    '#06b6d4',
};

function SubmissionList({ newEntry }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data.success) setEntries(data.data);
    } catch {
      setError('❌ Could not fetch data. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const clearEntries = async () => {
    try {
      await fetch(API_URL, { method: 'DELETE' });
      setEntries([]);
    } catch {
      setError('❌ Could not clear entries.');
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchEntries();
  }, []);

  // Append new entry when parent notifies
  useEffect(() => {
    if (newEntry) {
      setEntries((prev) => [newEntry, ...prev]);
    }
  }, [newEntry]);

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="list-panel">
      <div className="list-header">
        <h2>📋 Submissions</h2>
        <span className="list-count">{entries.length} saved</span>
      </div>

      <div className="fetch-controls">
        <button
          id="refresh-btn"
          className="fetch-btn"
          onClick={fetchEntries}
          disabled={loading}
        >
          {loading ? '⏳' : '🔄'} Refresh
        </button>
        {entries.length > 0 && (
          <button id="clear-btn" className="fetch-btn clear-btn" onClick={clearEntries}>
            🗑️ Clear
          </button>
        )}
      </div>

      {error && <div className="error-state">{error}</div>}

      {entries.length === 0 && !loading && !error ? (
        <div className="empty-state">
          <span className="empty-icon">🗂️</span>
          <p>No submissions yet</p>
          <p className="hint">Fill the form on the left and hit Save!</p>
        </div>
      ) : (
        <div className="entries-list">
          {entries.map((entry) => (
            <div key={entry.id} className="entry-card">
              <div className="entry-top">
                <span className="entry-name">{entry.name}</span>
                <span className="entry-time">{formatTime(entry.createdAt)}</span>
              </div>
              <div className="entry-details">
                <span className="entry-badge color-badge">
                  <span
                    className="badge-dot"
                    style={{ background: COLOR_MAP[entry.favColor] || '#8b5cf6' }}
                  />
                  {entry.favColor}
                </span>
                <span className="entry-badge food-badge">🍴 {entry.favFood}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SubmissionList;
