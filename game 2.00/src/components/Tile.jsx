import React from 'react';

const Tile = ({ value }) => {
  // Dynamic styling based on tile value
  let styleClass = "bg-[#1f2833] shadow-inner text-transparent"; 
  
  if (value > 0) {
    if (value === 2) styleClass = "bg-cyan-950/40 text-[#00f3ff] border border-[#00f3ff]/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]";
    else if (value === 4) styleClass = "bg-purple-950/40 text-[#bc13fe] border border-[#bc13fe]/50 shadow-[0_0_10px_rgba(188,19,254,0.2)]";
    else if (value <= 32) styleClass = "bg-pink-950/40 text-[#ff0055] border border-[#ff0055]/60 shadow-[0_0_15px_rgba(255,0,85,0.4)]";
    else if (value <= 256) styleClass = "bg-yellow-950/40 text-[#ffff00] border border-[#ffff00]/60 shadow-[0_0_20px_rgba(255,255,0,0.4)]";
    else styleClass = "bg-[#00f3ff] text-black shadow-[0_0_30px_rgba(0,243,255,0.8)]"; // 512+ high value tiles
  }

  return (
    <div className={`w-full h-full flex justify-center items-center rounded-lg text-2xl sm:text-4xl font-black transition-all duration-150 ${styleClass} ${value > 0 ? 'animate-pop' : ''}`}>
      {value !== 0 ? value : ''}
    </div>
  );
};

export default Tile;