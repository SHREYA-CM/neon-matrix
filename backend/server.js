// backend/server.js
require('dotenv').config(); // 👈 Loads environment variables from your .env file for local testing
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // Asli DB library

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 🔌 MONGO_URI setup (Render ke Environment Variables ya local .env se load hoga)
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("🔌 Connected to Real MongoDB Database!"))
  .catch(err => console.error("❌ Database Connection Failed:", err));

// 📝 REAL DATABASE SCHEMA
const scoreSchema = new mongoose.Schema({
  playerName: { type: String, default: 'Anonymous' },
  score: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

// 📥 FETCH RANKINGS FROM REAL DATABASE
app.get('/api/leaderboard', async (req, res) => {
  try {
    const sorted = await Score.find().sort({ score: -1 }).limit(10);
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch database records' });
  }
});

// 📤 SAVE NEW SCORE TO REAL DATABASE (SMART UPDATE LOGIC)
app.post('/api/leaderboard', async (req, res) => {
  const { playerName, score } = req.body;
  if (score === undefined || score === null) return res.status(400).json({ error: 'Score is required' });

  const finalPlayerName = playerName || 'Anonymous';

  try {
    // 1. Check karte hain ki kya player pehle se database mein hai
    const existingPlayer = await Score.findOne({ playerName: finalPlayerName });

    if (existingPlayer) {
      // 2. Agar player mil gaya, toh check karo ki naya score purane se bada hai ya nahi
      if (score > existingPlayer.score) {
        existingPlayer.score = score;
        existingPlayer.date = Date.now(); // Date ko aaj ki date par update kar do
        await existingPlayer.save(); // Naya High Score save ho gaya!
        return res.status(200).json(existingPlayer);
      } else {
        // Agar score kam hai, toh ignore karo aur frontend ko wapas bhej do
        return res.status(200).json({ message: 'Score not high enough to beat personal best.', data: existingPlayer });
      }
    } else {
      // 3. Agar player pehli baar khel raha hai, toh nayi entry banao
      const newEntry = new Score({ 
        playerName: finalPlayerName, 
        score: score 
      });
      await newEntry.save();
      return res.status(201).json(newEntry);
    }
  } catch (err) {
    res.status(500).json({ error: 'Database saving failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Neon Matrix Backend running on port ${PORT}`);
});