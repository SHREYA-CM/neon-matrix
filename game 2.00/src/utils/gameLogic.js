// src/utils/gameLogic.js

export const initializeBoard = () => {
  let board = Array(16).fill(0);
  board = addRandomTile(board);
  board = addRandomTile(board);
  return board;
};

export const addRandomTile = (board) => {
  const emptyIndices = board.map((v, i) => v === 0 ? i : null).filter(v => v !== null);
  if (emptyIndices.length === 0) return board;
  
  const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  const newBoard = [...board];
  newBoard[randomIdx] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
};

const slideLine = (line) => {
  let filtered = line.filter(val => val !== 0);
  let score = 0;
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      score += filtered[i];
      filtered[i + 1] = 0;
    }
  }
  filtered = filtered.filter(val => val !== 0);
  while (filtered.length < 4) filtered.push(0);
  return { newLine: filtered, score };
};

export const moveBoard = (board, direction) => {
  let newBoard = Array(16).fill(0);
  let scoreToAdd = 0;
  let hasChanged = false;

  const getLine = (i) => {
    if(direction === 'LEFT') return [board[i*4], board[i*4+1], board[i*4+2], board[i*4+3]];
    if(direction === 'RIGHT') return [board[i*4+3], board[i*4+2], board[i*4+1], board[i*4]];
    if(direction === 'UP') return [board[i], board[i+4], board[i+8], board[i+12]];
    if(direction === 'DOWN') return [board[i+12], board[i+8], board[i+4], board[i]];
  };

  const setLine = (i, line) => {
    if(direction === 'LEFT') line.forEach((v, j) => newBoard[i*4+j] = v);
    if(direction === 'RIGHT') line.forEach((v, j) => newBoard[i*4+3-j] = v);
    if(direction === 'UP') line.forEach((v, j) => newBoard[i+j*4] = v);
    if(direction === 'DOWN') line.forEach((v, j) => newBoard[i+(3-j)*4] = v);
  };

  for (let i = 0; i < 4; i++) {
    const line = getLine(i);
    const { newLine, score } = slideLine(line);
    setLine(i, newLine);
    scoreToAdd += score;
    if (line.join(',') !== newLine.join(',')) hasChanged = true;
  }

  if (hasChanged) newBoard = addRandomTile(newBoard);
  return { newBoard, scoreToAdd, hasChanged };
};

// Proper Game Over Logic (Checks for adjacent valid moves)
export const checkGameOver = (board) => {
  if (board.includes(0)) return false; 
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i * 4 + j] === board[i * 4 + j + 1]) return false;
    }
  }
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 3; i++) {
      if (board[i * 4 + j] === board[(i + 1) * 4 + j]) return false;
    }
  }
  return true; 
};

export const checkWin = (board) => board.includes(2048);
export const getHighestTile = (board) => Math.max(...board);