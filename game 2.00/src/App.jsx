// src/App.jsx
import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useGame } from './hooks/useGame';
import { useSwipe } from './hooks/useSwipe';
import GameBoard from './components/GameBoard';

function App() {
  const { 
    board, score, bestScore, highestTile, gameState, history, leaderboard, 
    soundEnabled, setSoundEnabled, stats, achievements, recentAchievement, 
    restart, continueGame, undo, saveToLeaderboard, handleMove 
  } = useGame();
  
  const swipeHandlers = useSwipe(handleMove);
  
  // 🔐 PROFILE SESSIONS
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('neonPlayerAlias') || '');
  const [password, setPassword] = useState('');
  const [hasStarted, setHasStarted] = useState(() => !!localStorage.getItem('neonPlayerAlias'));
  const [authTab, setAuthTab] = useState('LOGIN'); 
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showStats, setShowStats] = useState(false); 

  // 📱 NATIVE PWA INTERCEPT DEFERRED PROMPT STATE
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [theme, setTheme] = useState(0);
  const themeClasses = ['hue-rotate-0', 'hue-rotate-90', 'hue-rotate-[-45deg]'];
  const themeNames = ['NEON', 'HACKER', 'SYNTH'];

  // Intercept beforeinstallprompt hook
  useEffect(() => {
    const captureInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e); // Store event to trigger custom UI button
    };
    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
  }, []);

  useEffect(() => {
    if ((gameState === 'GAME_OVER' || gameState === 'WON') && hasStarted) {
      saveToLeaderboard(playerName);
    }
  }, [gameState, hasStarted, playerName, saveToLeaderboard]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); // Show standard browser prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null); // Clear prompt state on success
    }
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const usernameClean = playerName.trim();
    if (!usernameClean || !password) {
      setAuthError('ALL FIELDS REQUIRED');
      return;
    }

    const localUsers = JSON.parse(localStorage.getItem('neonMatrixUsers')) || [];

    if (authTab === 'REGISTER') {
      const userExists = localUsers.some(u => u.username.toLowerCase() === usernameClean.toLowerCase());
      if (userExists) {
        setAuthError('ALIAS ALREADY ACCESS-DENIED (TAKEN)');
        return;
      }

      localUsers.push({ username: usernameClean, password: btoa(password) });
      localStorage.setItem('neonMatrixUsers', JSON.stringify(localUsers));
      
      setAuthSuccess('REGISTRATION SUCCESSFUL! SWITCHING TO LOGIN...');
      setTimeout(() => {
        setAuthTab('LOGIN');
        setPassword('');
        setAuthSuccess('');
      }, 1500);

    } else {
      const userFound = localUsers.find(u => u.username.toLowerCase() === usernameClean.toLowerCase() && u.password === btoa(password));
      if (!userFound) {
        setAuthError('INVALID ALIAS OR ENCRYPTION KEY (PASSWORD)');
        return;
      }

      localStorage.setItem('neonPlayerAlias', userFound.username);
      setPlayerName(userFound.username);
      setHasStarted(true);
      restart();
    }
  };

  const handleReset = () => {
    if (score > 0) saveToLeaderboard(playerName);
    restart();
  };

  const handleLogout = () => {
    localStorage.removeItem('neonPlayerAlias');
    setPlayerName('');
    setPassword('');
    setHasStarted(false);
    setAuthTab('LOGIN');
  };

  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if (!hasStarted || gameState !== 'PLAYING') return;
      if (e.key.toLowerCase() === 'u') if (history.length > 0) undo();
      if (e.key.toLowerCase() === 'r') handleReset();
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [hasStarted, gameState, history, undo]);

  const shareScore = () => {
    const text = `I scored ${score} in NEON MATRIX! 🚀 My highest tile was ${highestTile}. Can you beat me?`;
    if (navigator.share) {
      navigator.share({ title: 'Neon Matrix High Score', text, url: window.location.href }).catch(console.error);
    } else {
      alert("Sharing not supported on this browser.");
    }
  };

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-center p-4 relative z-10 transition-all duration-500 ${themeClasses[theme]} overflow-hidden`} {...swipeHandlers}>
      <div className="cyber-bg"></div>

      {recentAchievement && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] glass-panel px-6 py-3 rounded-full border border-[#bc13fe] animate-pop shadow-[0_0_20px_rgba(188,19,254,0.5)]">
          <p className="text-white font-black tracking-widest text-sm">{recentAchievement}</p>
        </div>
      )}

      {gameState === 'WON' && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={true} numberOfPieces={300} />}

      {/* Top Navbar */}
      <div className="w-full max-w-md flex justify-between mb-4 z-10 absolute top-4 px-2 sm:px-0">
        <div className="flex gap-2">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-[10px] font-bold tracking-widest text-[#00f3ff] border border-[#00f3ff]/30 px-3 py-1 rounded bg-[#1f2833]/80 hover:bg-[#00f3ff] hover:text-black transition-colors backdrop-blur-md">
            {soundEnabled ? '🔊 ON' : '🔈 OFF'}
          </button>
          <button onClick={() => setTheme((prev) => (prev + 1) % 3)} className="text-[10px] font-bold tracking-widest text-[#bc13fe] border border-[#bc13fe]/30 px-3 py-1 rounded bg-[#1f2833]/80 hover:bg-[#bc13fe] hover:text-white transition-colors backdrop-blur-md">
            🎨 {themeNames[theme]}
          </button>
        </div>
        
        <div className="flex gap-2 items-center">
          {/* 📥 IN-APP EXTRA SYSTEM UPGRADE INSTALLER ACTION BUTTON */}
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="text-[9px] font-black text-[#00f3ff] border border-[#00f3ff] px-2 py-1 rounded bg-black/50 hover:bg-[#00f3ff] hover:text-black transition-all backdrop-blur-md animate-pulse tracking-widest">
              📥 INSTALL APP
            </button>
          )}

          {hasStarted ? (
            <button onClick={handleLogout} className="text-[10px] font-black text-red-400 border border-red-500/30 px-2 py-1 rounded bg-[#1f2833]/80 hover:bg-red-500 hover:text-white transition-all backdrop-blur-md">
              👤 {playerName} [LOGOUT]
            </button>
          ) : (
            <span className="text-[10px] font-black text-amber-400 border border-amber-500/40 px-2 py-1 rounded bg-black/40 tracking-widest animate-pulse">
              🔐 SECURE NODE
            </span>
          )}
          <button onClick={() => setShowStats(true)} className="text-[12px] font-black text-white border border-gray-500 w-7 h-7 rounded-full bg-[#1f2833]/80 hover:bg-white hover:text-black transition-all flex items-center justify-center">📊</button>
          <button onClick={() => setShowInfo(true)} className="text-[12px] font-black text-white border border-gray-500 w-7 h-7 rounded-full bg-[#1f2833]/80 hover:bg-white hover:text-black transition-all flex items-center justify-center">?</button>
        </div>
      </div>

      {/* Stats Dashboard */}
      {showStats && (
        <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center z-[60] backdrop-blur-sm p-4 animate-pop">
          <div className="glass-panel p-6 rounded-xl w-[90vw] max-w-sm border border-[#bc13fe]">
            <h2 className="text-[#bc13fe] text-xl sm:text-2xl font-black mb-4 tracking-widest text-center">DATA LOGS</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#0b0c10] p-3 rounded border border-gray-700 text-center"><p className="text-[9px] text-gray-400 font-bold">GAMES PLAYED</p><p className="text-xl text-white font-black">{stats.gamesPlayed}</p></div>
              <div className="bg-[#0b0c10] p-3 rounded border border-gray-700 text-center"><p className="text-[9px] text-gray-400 font-bold">WIN RATE</p><p className="text-xl text-[#00f3ff] font-black">{stats.gamesPlayed > 0 ? Math.round((stats.winCount / stats.gamesPlayed) * 100) : 0}%</p></div>
              <div className="bg-[#0b0c10] p-3 rounded border border-gray-700 text-center"><p className="text-[9px] text-gray-400 font-bold">TOTAL MOVES</p><p className="text-xl text-white font-black">{stats.totalMoves}</p></div>
              <div className="bg-[#0b0c10] p-3 rounded border border-gray-700 text-center"><p className="text-[9px] text-gray-400 font-bold">HIGHEST TILE</p><p className="text-xl text-[#ff0055] font-black">{Math.max(stats.highestTile || 0, highestTile || 0)}</p></div>
            </div>
            <h3 className="text-[#00f3ff] text-xs font-black tracking-widest mb-2 text-center">ACHIEVEMENTS</h3>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <span className={`text-[10px] px-2 py-1 rounded font-bold ${achievements.firstMerge ? 'bg-[#00f3ff] text-black' : 'bg-gray-800 text-gray-500'}`}>FIRST MERGE</span>
              <span className={`text-[10px] px-2 py-1 rounded font-bold ${achievements.reach128 ? 'bg-[#bc13fe] text-white' : 'bg-gray-800 text-gray-500'}`}>128 TILE</span>
              <span className={`text-[10px] px-2 py-1 rounded font-bold ${achievements.reach512 ? 'bg-[#ff0055] text-white' : 'bg-gray-800 text-gray-500'}`}>512 TILE</span>
              <span className={`text-[10px] px-2 py-1 rounded font-bold ${achievements.reach2048 ? 'bg-[#ffaa00] text-black shadow-[0_0_10px_#ffaa00]' : 'bg-gray-800 text-gray-500'}`}>CYBER MASTER</span>
            </div>
            <button onClick={() => setShowStats(false)} className="w-full bg-[#bc13fe] text-white font-bold tracking-widest py-2 rounded hover:bg-white hover:text-black transition-colors">CLOSE</button>
          </div>
        </div>
      )}

      {showInfo && (
        <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center z-[60] backdrop-blur-sm p-4 animate-pop">
          <div className="glass-panel p-6 rounded-xl w-[90vw] max-w-sm border border-[#00f3ff]">
            <h2 className="text-[#00f3ff] text-xl sm:text-2xl font-black mb-4 tracking-widest text-center">SYSTEM MANUAL</h2>
            <ul className="text-gray-300 text-xs sm:text-sm space-y-3 font-medium mb-6">
              <li><strong className="text-white">OBJECTIVE:</strong> Merge identical data nodes to reach the <span className="text-[#bc13fe] font-bold">2048</span> mainframe.</li>
              <li><strong className="text-white">CONTROLS:</strong> Swipe on mobile or use <span className="text-[#00f3ff]">Arrow Keys</span> on desktop.</li>
              <li><strong className="text-white">SHORTCUTS:</strong> Press <span className="bg-gray-800 px-2 py-0.5 rounded text-white border border-gray-600">U</span> to Undo and <span className="bg-gray-800 px-2 py-0.5 rounded text-white border border-gray-600">R</span> to Reset.</li>
            </ul>
            <button onClick={() => setShowInfo(false)} className="w-full bg-[#00f3ff] text-black font-bold tracking-widest py-2 rounded hover:bg-white transition-colors">ACKNOWLEDGE</button>
          </div>
        </div>
      )}

      {/* AUTH SCREENS */}
      {!hasStarted ? (
        <div className="glass-panel p-6 sm:p-8 rounded-xl w-[90vw] max-w-md border-2 border-[#00f3ff] shadow-[0_0_40px_rgba(0,243,255,0.3)] animate-pop mt-8 sm:mt-10">
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#bc13fe] text-center leading-none">NEON</h1>
          <h1 className="text-3xl sm:text-4xl font-black text-white text-center mb-6">MATRIX</h1>
          
          <div className="flex border-b border-gray-800 mb-6 font-bold tracking-widest text-xs">
            <button type="button" onClick={() => { setAuthTab('LOGIN'); setAuthError(''); }} className={`flex-1 text-center pb-2 transition-all ${authTab === 'LOGIN' ? 'text-[#00f3ff] border-b-2 border-[#00f3ff]' : 'text-gray-500'}`}>USER LOGIN</button>
            <button type="button" onClick={() => { setAuthTab('REGISTER'); setAuthError(''); }} className={`flex-1 text-center pb-2 transition-all ${authTab === 'REGISTER' ? 'text-[#bc13fe] border-b-2 border-[#bc13fe]' : 'text-gray-500'}`}>CREATE UPLINK</button>
          </div>

          {authTab === 'LOGIN' ? (
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[9px] font-bold text-gray-400 tracking-widest uppercase block mb-1">HACKER ALIAS</label>
                <input type="text" name="username" autocomplete="username" placeholder="ENTER ALIAS" maxLength="12" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="bg-[#050505] border border-gray-700 text-[#00f3ff] px-4 py-3 rounded focus:outline-none focus:border-[#00f3ff] text-center font-bold tracking-widest w-full" required />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 tracking-widest uppercase block mb-1">ENCRYPTION ACCESS KEY</label>
                <input type="password" name="password" autocomplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#050505] border border-gray-700 text-[#bc13fe] px-4 py-3 rounded focus:outline-none focus:border-[#bc13fe] text-center font-mono tracking-widest w-full" required />
              </div>
              {authError && <p className="text-red-500 text-[10px] font-black tracking-wider text-center animate-pulse">❌ {authError}</p>}
              <button type="submit" className="w-full font-black tracking-widest py-3 rounded transition-all text-black mt-2 bg-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:bg-white">INITIALIZE UPLINK</button>
            </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[9px] font-bold text-gray-400 tracking-widest uppercase block mb-1">NEW HACKER ALIAS</label>
                <input type="text" name="username" autocomplete="username" placeholder="CREATE ALIAS" maxLength="12" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="bg-[#050505] border border-gray-700 text-[#00f3ff] px-4 py-3 rounded focus:outline-none focus:border-[#00f3ff] text-center font-bold tracking-widest w-full" required />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 tracking-widest uppercase block mb-1">NEW ENCRYPTION ACCESS KEY</label>
                <input type="password" name="password" autocomplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#050505] border border-gray-700 text-[#bc13fe] px-4 py-3 rounded focus:outline-none focus:border-[#bc13fe] text-center font-mono tracking-widest w-full" required />
              </div>
              {authError && <p className="text-red-500 text-[10px] font-black tracking-wider text-center animate-pulse">❌ {authError}</p>}
              {authSuccess && <p className="text-green-400 text-[10px] font-black tracking-wider text-center">✔ {authSuccess}</p>}
              <button type="submit" className="w-full font-black tracking-widest py-3 rounded transition-all text-black mt-2 bg-[#bc13fe] shadow-[0_0_15px_rgba(188,19,254,0.4)] hover:bg-white">REGISTER ACCESS CODE</button>
            </form>
          )}
        </div>
      ) : (
        /* ACTIVE GAME INTERFACE */
        <div className="w-full flex flex-col items-center mt-12 sm:mt-16">
          <div className="flex justify-between items-end w-[90vw] max-w-md mb-6 z-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#bc13fe]">NEON</h1>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-none">MATRIX</h1>
              <p className="text-[10px] sm:text-xs text-[#00f3ff] tracking-widest mt-1">OPERATOR: {playerName}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <div className="glass-panel px-2 sm:px-3 py-1 rounded-lg text-center min-w-[60px] sm:min-w-[70px]">
                  <p className="text-[8px] sm:text-[9px] text-[#00f3ff] font-bold tracking-widest">SCORE</p>
                  <p className="text-sm sm:text-lg font-bold text-white leading-tight">{score}</p>
                </div>
                <div className="glass-panel px-2 sm:px-3 py-1 rounded-lg text-center min-w-[60px] sm:min-w-[70px]">
                  <p className="text-[8px] sm:text-[9px] text-[#bc13fe] font-bold tracking-widest">BEST</p>
                  <p className="text-sm sm:text-lg font-bold text-white leading-tight">{bestScore}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <button onClick={undo} disabled={history.length === 0} className={`flex-1 border py-1 rounded-lg font-bold transition-all text-[10px] sm:text-xs ${history.length === 0 ? 'border-gray-700 text-gray-700' : 'bg-transparent border-[#bc13fe] text-[#bc13fe] hover:bg-[#bc13fe] hover:text-white'}`}>UNDO</button>
                <button onClick={handleReset} className="flex-1 bg-transparent border border-[#00f3ff] text-[#00f3ff] py-1 rounded-lg hover:bg-[#00f3ff] hover:text-black font-bold transition-all text-[10px] sm:text-xs">RESET</button>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 w-full flex justify-center">
            <GameBoard board={board} />
            
            {gameState !== 'PLAYING' && (
              <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center z-50 backdrop-blur-sm rounded-xl border border-gray-700 animate-pop p-4">
                <div className={`text-center p-4 sm:p-6 bg-[#0b0c10] border-2 rounded-xl w-full max-w-[90%] sm:max-w-sm ${gameState === 'WON' ? 'border-[#00f3ff]' : 'border-[#ff0055]'}`}>
                  <h2 className={`text-2xl sm:text-3xl font-black mb-1 ${gameState === 'WON' ? 'text-[#00f3ff]' : 'text-[#ff0055]'}`}>
                    {gameState === 'WON' ? 'YOU WIN! 🎉' : 'GAME OVER'}
                  </h2>
                  <p className="text-gray-300 mb-4 sm:mb-6 tracking-widest text-[10px] sm:text-xs font-bold">
                    {gameState === 'WON' ? 'CRACKED THE MATRIX!' : 'NO MOVES LEFT'}
                  </p>
                  
                  <div className="mb-4 sm:mb-6">
                    <p className="text-gray-400 text-[10px] sm:text-xs tracking-widest">FINAL SCORE</p>
                    <p className="text-3xl sm:text-4xl font-black text-white">{score}</p>
                    {score >= bestScore && score > 0 ? (
                      <p className="text-[#00f3ff] text-[10px] sm:text-xs font-black mt-2 animate-pulse">🔥 NEW HIGH SCORE! 🔥</p>
                    ) : (
                      <p className="text-gray-500 text-[10px] sm:text-xs font-bold mt-2">💔 COULDN'T BEAT BEST...</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:gap-3">
                    <button onClick={shareScore} className="w-full bg-[#bc13fe] text-white font-bold tracking-widest py-2 rounded hover:bg-white hover:text-black text-xs sm:text-sm transition-colors">📲 SHARE SCORE</button>
                    {gameState === 'WON' && (
                      <button onClick={continueGame} className="w-full bg-white text-black font-bold tracking-widest py-2 rounded text-xs sm:text-sm hover:bg-gray-200">KEEP PLAYING</button>
                    )}
                    <button onClick={handleReset} className={`w-full font-black tracking-widest py-2 rounded text-xs sm:text-sm transition-colors text-black ${gameState === 'WON' ? 'bg-[#00f3ff] hover:bg-white' : 'bg-[#ff0055] hover:bg-white'}`}>TRY AGAIN</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 sm:mt-8 z-10 w-[90vw] max-w-md">
            <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="w-full text-center text-gray-500 text-[10px] sm:text-xs font-bold tracking-widest hover:text-[#00f3ff] transition-colors">
              {showLeaderboard ? 'HIDE LEADERBOARD' : 'VIEW LEADERBOARD'}
            </button>
            {showLeaderboard && (
              <div className="mt-3 sm:mt-4 glass-panel p-3 sm:p-4 rounded-xl mb-6 sm:mb-10">
                <h3 className="text-[#bc13fe] text-center font-black tracking-widest text-xs sm:text-sm mb-3">GLOBAL RANKINGS</h3>
                {leaderboard.length === 0 ? <p className="text-center text-gray-500 text-xs sm:text-sm">No data found.</p> : (
                  <ul className="flex flex-col gap-2 sm:gap-3">
                    {leaderboard.map((entry, idx) => (
                      <li key={idx} className="flex items-center justify-between text-xs sm:text-sm border-b border-gray-800 pb-2">
                        <div className="flex flex-col">
                          <span className="text-white font-bold tracking-wider">{idx + 1}. {entry.name}</span>
                          <span className="text-gray-500 text-[8px] sm:text-[10px]">HIGHEST: <span className="text-[#ff0055]">{entry.highestTile}</span></span>
                        </div>
                        <span className="text-[#00f3ff] font-mono text-lg font-bold">{entry.score}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;