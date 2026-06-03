// src/hooks/useGame.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeBoard, moveBoard, checkGameOver, checkWin, getHighestTile } from '../utils/gameLogic';
import { playMergeSound, playGameOverSound } from '../utils/audio';

// 🔗 LIVE BACKEND LEADERBOARD ENDPOINT
const LEADERBOARD_API_URL = 'https://neon-matrix.onrender.com/api/leaderboard';

export const useGame = () => {
  const [board, setBoard] = useState(initializeBoard());
  const [score, setScore] = useState(0);
  const [highestTile, setHighestTile] = useState(0);
  
  // 👇 CHANGE 1: Ab local memory se start nahi hoga, zero se start hoga aur DB aate hi update hoga
  const [bestScore, setBestScore] = useState(0); 
  
  const [gameState, setGameState] = useState('PLAYING'); 
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState(() => JSON.parse(localStorage.getItem('neonLeaderboard')) || []);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 👇 YEH RAHA AAPKA LOCK (Double entry rokne ke liye)
  const scoreSubmitted = useRef(false);

  // --- STATS SYSTEM ---
  const [stats, setStats] = useState(() => {
    const savedStats = JSON.parse(localStorage.getItem('neonStats')) || {};
    const savedLeaderboard = JSON.parse(localStorage.getItem('neonLeaderboard')) || [];
    
    let historicalHighest = 0;
    savedLeaderboard.forEach(entry => {
      const tile = entry.highestTile || 0;
      if (tile > historicalHighest) historicalHighest = tile;
    });

    return { 
      gamesPlayed: Math.max(savedStats.gamesPlayed || 0, savedLeaderboard.length), 
      winCount: savedStats.winCount || 0, 
      totalMoves: savedStats.totalMoves || 0,
      highestTile: Math.max(savedStats.highestTile || 0, historicalHighest)
    };
  });
  
  // --- ACHIEVEMENTS SYSTEM ---
  const [achievements, setAchievements] = useState(() => {
    const savedAchievements = JSON.parse(localStorage.getItem('neonAchievements')) || {};
    const savedLeaderboard = JSON.parse(localStorage.getItem('neonLeaderboard')) || [];
    
    let historicalHighest = 0;
    savedLeaderboard.forEach(entry => {
      const tile = entry.highestTile || 0;
      if (tile > historicalHighest) historicalHighest = tile;
    });

    return {
      firstMerge: savedAchievements.firstMerge || historicalHighest > 0, 
      reach128: savedAchievements.reach128 || historicalHighest >= 128, 
      reach512: savedAchievements.reach512 || historicalHighest >= 512, 
      reach2048: savedAchievements.reach2048 || historicalHighest >= 2048, 
      highScoreBreaker: savedAchievements.highScoreBreaker || savedLeaderboard.length > 1
    };
  });
  
  const [recentAchievement, setRecentAchievement] = useState(null);
  const achievementTimeout = useRef(null);

  // 📥 FETCH LIVE RANKINGS FROM RENDER
  const fetchLiveLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(LEADERBOARD_API_URL);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
        localStorage.setItem('neonLeaderboard', JSON.stringify(data));
        
        // 👇 CHANGE 2: Live Database ke Rank 1 ka score 'BEST' mein set karo
        if (data && data.length > 0) {
          setBestScore(data[0].score); 
        }
      }
    } catch (err) {
      console.error("Leaderboard uplink sync failed:", err);
    }
  }, []);

  // Fetch rankings automatically when game loads
  useEffect(() => {
    fetchLiveLeaderboard();
  }, [fetchLiveLeaderboard]);

  const updateStats = useCallback((updater) => {
    setStats(prev => {
      const updates = typeof updater === 'function' ? updater(prev) : updater;
      const newStats = { ...prev, ...updates };
      localStorage.setItem('neonStats', JSON.stringify(newStats));
      return newStats;
    });
  }, []);

  const unlockAchievement = useCallback((key, title) => {
    setAchievements(prev => {
      if (prev[key]) return prev; 
      const newAchievements = { ...prev, [key]: true };
      localStorage.setItem('neonAchievements', JSON.stringify(newAchievements));
      
      setRecentAchievement(title);
      if (achievementTimeout.current) clearTimeout(achievementTimeout.current);
      achievementTimeout.current = setTimeout(() => setRecentAchievement(null), 3000);
      
      return newAchievements;
    });
  }, []);

  const finishGame = useCallback((isWin) => {
    updateStats(prev => ({ 
      gamesPlayed: prev.gamesPlayed + 1, 
      winCount: prev.winCount + (isWin ? 1 : 0) 
    }));
  }, [updateStats]);

  const restart = useCallback(() => {
    setBoard(initializeBoard());
    setScore(0);
    setHighestTile(0);
    setHistory([]);
    setGameState('PLAYING');
    
    // 👇 NAYA GAME SHURU HONE PAR LOCK KHOL DO
    scoreSubmitted.current = false;
  }, []);

  const continueGame = () => setGameState('PLAYING');

  const undo = useCallback(() => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setBoard(lastState.board);
      setScore(lastState.score);
      setHighestTile(getHighestTile(lastState.board));
      setHistory(prev => prev.slice(0, -1));
    }
  }, [history]);

  // 📤 POST HIGH SCORE TO RENDER LIVE SERVER
  const saveToLeaderboard = useCallback(async (playerName) => {
    if (score <= 0) return;
    
    // 👇 YAHAN PE DOUBLE ENTRY ROKNE KA MAIN LOGIC HAI
    if (scoreSubmitted.current) return; // Agar submit ho chuka hai, to wapas mud jao
    scoreSubmitted.current = true;      // Pehli baar aate hi darwaza lock kar do

    try {
      const response = await fetch(LEADERBOARD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, score })
      });

      if (response.ok) {
        // Refresh ranks from server on successful submission
        fetchLiveLeaderboard();
      }
    } catch (err) {
      console.error("Score submission grid failure:", err);
      // Agar error aaye to lock wapas khol do taaki baad mein wapas ja sake
      scoreSubmitted.current = false;
    }
  }, [score, fetchLiveLeaderboard]);

  const handleMove = useCallback((direction) => {
    if (gameState !== 'PLAYING') return;
    
    const { newBoard, scoreToAdd, hasChanged } = moveBoard(board, direction);
    if (hasChanged) {
      if (soundEnabled) playMergeSound();
      
      updateStats(prev => ({ totalMoves: prev.totalMoves + 1 }));
      if (scoreToAdd > 0) unlockAchievement('firstMerge', '🏆 FIRST MERGE');

      setHistory(prev => [...prev, { board, score }]);
      setBoard(newBoard);
      
      const newHighest = getHighestTile(newBoard);
      setHighestTile(newHighest);
      
      updateStats(prev => ({ highestTile: Math.max(prev.highestTile || 0, newHighest) }));

      if (newHighest >= 128) unlockAchievement('reach128', '🏆 REACHED 128');
      if (newHighest >= 512) unlockAchievement('reach512', '🏆 REACHED 512');
      if (newHighest >= 2048) unlockAchievement('reach2048', '🏆 CYBER MASTER (2048)');
      
      setScore(prev => {
        const newScore = prev + scoreToAdd;
        if (newScore > bestScore && bestScore > 0) {
          unlockAchievement('highScoreBreaker', '🏆 HIGH SCORE BREAKER');
        }
        if (newScore > bestScore) {
          setBestScore(newScore); // UI mein instantly update karne ke liye
          // local storage wali line yahan se hata di hai taaki kachra jama na ho
        }
        return newScore;
      });

      if (checkWin(newBoard) && !history.some(h => checkWin(h.board))) {
        finishGame(true);
        setGameState('WON');
      } else if (checkGameOver(newBoard)) {
        if (soundEnabled) playGameOverSound();
        finishGame(false);
        setGameState('GAME_OVER');
      }
    }
  }, [board, gameState, bestScore, score, history, soundEnabled, finishGame, unlockAchievement, updateStats]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
        switch(e.key) {
          case 'ArrowUp': handleMove('UP'); break;
          case 'ArrowDown': handleMove('DOWN'); break;
          case 'ArrowLeft': handleMove('LEFT'); break;
          case 'ArrowRight': handleMove('RIGHT'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  return { 
    board, score, bestScore, highestTile, gameState, history, leaderboard, 
    soundEnabled, setSoundEnabled, stats, achievements, recentAchievement, 
    restart, continueGame, undo, saveToLeaderboard, handleMove 
  };
};