const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000;

// ── MongoDB connection ───────────────────────────────────────────
// "mongo" is the container name on the Docker network
// When running locally (no Docker), change to: mongodb://localhost:27017/favorites_db
const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/favorites_db';

mongoose.connect(MONGO_URL)
  .then(() => console.log('✅ Connected to MongoDB at', MONGO_URL))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

// ── Mongoose Schema & Model ──────────────────────────────────────
const favoriteSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  favColor:  { type: String, required: true, trim: true },
  favFood:   { type: String, required: true, trim: true },
}, { timestamps: true }); // adds createdAt and updatedAt automatically

const Favorite = mongoose.model('Favorite', favoriteSchema);

// ── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: '*',  // allow all origins (Docker containers + local dev)
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🚀 Favorites API is running', port: PORT });
});

// GET all favorites
app.get('/api/favorites', async (req, res) => {
  try {
    const favorites = await Favorite.find().sort({ createdAt: -1 }); // newest first
    res.json({ success: true, data: favorites, count: favorites.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST a new favorite
app.post('/api/favorites', async (req, res) => {
  const { name, favColor, favFood } = req.body;

  if (!name || !favColor || !favFood) {
    return res.status(400).json({
      success: false,
      message: 'All fields (name, favColor, favFood) are required.',
    });
  }

  try {
    const entry = await Favorite.create({ name, favColor, favFood });
    console.log('✅ Saved to MongoDB:', entry.name);
    res.status(201).json({ success: true, message: 'Favorites saved!', data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE all favorites
app.delete('/api/favorites', async (req, res) => {
  try {
    await Favorite.deleteMany({});
    res.json({ success: true, message: 'All entries cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Start server ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
  console.log(`📋 GET  /api/favorites`);
  console.log(`📋 POST /api/favorites`);
});
