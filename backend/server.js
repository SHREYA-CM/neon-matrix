// backend/server.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let leaderboard = [
  { playerName: "MasterChief", score: 2048, date: new Date() },
  { playerName: "NoobSlayer", score: 512, date: new Date() },
  { playerName: "ReactDev", score: 1024, date: new Date() }
];

app.get('/api/leaderboard', (req, res) => {
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 10);
  res.json(sorted);
});

app.post('/api/leaderboard', (req, res) => {
  const { playerName, score } = req.body;
  if (!score) return res.status(400).json({ error: 'Score is required' });

  const newEntry = { 
    playerName: playerName || 'Anonymous', 
    score: score, 
    date: new Date() 
  };
  
  leaderboard.push(newEntry);
  res.status(201).json(newEntry);
});

app.listen(PORT, () => {
  console.log(`🚀 Neon Matrix Backend running at http://localhost:${PORT}`);
});