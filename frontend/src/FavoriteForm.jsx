import React, { useState } from 'react';
import './FavoriteForm.css';

const API_URL = '/api/favorites';  // Vite proxy forwards this to http://localhost:5000/api/favorites

const colorOptions = [
  { label: 'Royal Purple', value: 'Royal Purple', hex: '#7c3aed' },
  { label: 'Ocean Blue',   value: 'Ocean Blue',   hex: '#0ea5e9' },
  { label: 'Emerald Green',value: 'Emerald Green', hex: '#10b981' },
  { label: 'Crimson Red',  value: 'Crimson Red',  hex: '#ef4444' },
  { label: 'Sunset Orange',value: 'Sunset Orange', hex: '#f97316' },
  { label: 'Golden Yellow',value: 'Golden Yellow', hex: '#f59e0b' },
  { label: 'Hot Pink',     value: 'Hot Pink',     hex: '#ec4899' },
  { label: 'Teal Cyan',    value: 'Teal Cyan',    hex: '#06b6d4' },
];

const foodOptions = [
  { label: '🍕 Pizza',    value: 'Pizza' },
  { label: '🍣 Sushi',    value: 'Sushi' },
  { label: '🍔 Burger',   value: 'Burger' },
  { label: '🍜 Ramen',    value: 'Ramen' },
  { label: '🌮 Tacos',    value: 'Tacos' },
  { label: '🍛 Biryani',  value: 'Biryani' },
  { label: '🥗 Salad',    value: 'Salad' },
  { label: '🍝 Pasta',    value: 'Pasta' },
];

function FavoriteForm({ onSubmitSuccess }) {
  const [formData, setFormData] = useState({ name: '', favColor: '', favFood: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.favColor || !formData.favFood) {
      setStatus({ type: 'error', message: 'Please fill in all fields before submitting.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setStatus({ type: 'success', message: '🎉 Your favorites have been saved!' });
        onSubmitSuccess && onSubmitSuccess(data.data);
        setFormData({ name: '', favColor: '', favFood: '' });
      } else {
        setStatus({ type: 'error', message: data.message || 'Something went wrong.' });
      }
    } catch {
      setStatus({ type: 'error', message: '❌ Cannot reach the server. Is the backend running on port 5000?' });
    } finally {
      setLoading(false);
    }
  };

  const selectedColor = colorOptions.find((c) => c.value === formData.favColor);

  return (
    <form className="fav-form" onSubmit={handleSubmit} id="favorites-form">
      <div className="form-header">
        <div className="form-icon">✨</div>
        <h2>Tell Us Your Favorites</h2>
        <p>Fill in your details below</p>
      </div>

      {/* Name */}
      <div className="form-group">
        <label htmlFor="user-name">Your Name</label>
        <div className="input-wrapper">
          <span className="input-icon">👤</span>
          <input
            id="user-name"
            type="text"
            name="name"
            placeholder="e.g. Alex Johnson"
            value={formData.name}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Color */}
      <div className="form-group">
        <label>Favorite Color</label>
        <div className="color-grid">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`color-chip ${formData.favColor === color.value ? 'selected' : ''}`}
              style={{ '--chip-color': color.hex }}
              onClick={() => {
                setFormData((prev) => ({ ...prev, favColor: color.value }));
                setStatus({ type: '', message: '' });
              }}
            >
              <span className="color-dot" style={{ background: color.hex }} />
              <span className="color-label">{color.label}</span>
              {formData.favColor === color.value && <span className="color-check">✓</span>}
            </button>
          ))}
        </div>
        {selectedColor && (
          <div className="selected-preview" style={{ '--preview-color': selectedColor.hex }}>
            <span className="preview-dot" style={{ background: selectedColor.hex }} />
            Selected: <strong>{selectedColor.label}</strong>
          </div>
        )}
      </div>

      {/* Food */}
      <div className="form-group">
        <label>Favorite Food</label>
        <div className="food-grid">
          {foodOptions.map((food) => (
            <button
              key={food.value}
              type="button"
              className={`food-chip ${formData.favFood === food.value ? 'selected' : ''}`}
              onClick={() => {
                setFormData((prev) => ({ ...prev, favFood: food.value }));
                setStatus({ type: '', message: '' });
              }}
            >
              {food.label}
            </button>
          ))}
        </div>
      </div>

      {status.message && (
        <div className={`status-msg status-${status.type}`}>{status.message}</div>
      )}

      <button type="submit" id="submit-favorites" className={`submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
        {loading ? (
          <span className="btn-loader">
            <span className="spinner" />
            Saving...
          </span>
        ) : (
          <>Save My Favorites <span className="btn-arrow">→</span></>
        )}
      </button>
    </form>
  );
}

export default FavoriteForm;
