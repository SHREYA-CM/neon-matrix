// src/components/GameBoard.jsx
import React from 'react';

const GameBoard = ({ board }) => {
  return (
    /* w-[95vw] aur max-w-[400px] se ye phone par screen ke hisaab se fit hoga aur desktop par limit mein rahega */
    <div className="bg-[#1f2833] p-2 sm:p-3 rounded-lg shadow-[0_0_30px_rgba(0,243,255,0.2)] w-[90vw] max-w-[400px] aspect-square mx-auto border-2 border-[#00f3ff]/30">
      <div className="grid grid-cols-4 grid-rows-4 gap-2 sm:gap-3 w-full h-full">
        {board.map((val, index) => (
          <div
            key={index}
            className={`flex items-center justify-center rounded text-2xl sm:text-3xl font-black transition-all duration-200 ${
              val > 0 ? `tile-${val} animate-pop` : 'bg-[#0b0c10]'
            }`}
          >
            {val !== 0 ? val : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;