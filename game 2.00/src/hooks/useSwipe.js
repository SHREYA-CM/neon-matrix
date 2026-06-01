// src/hooks/useSwipe.js
import { useState } from 'react';

export const useSwipe = (onSwipe) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 40;

  const onTouchStart = (e) => {
    setTouchEnd(null); 
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe) onSwipe('LEFT');
      if (isRightSwipe) onSwipe('RIGHT');
    } else {
      if (isUpSwipe) onSwipe('UP');
      if (isDownSwipe) onSwipe('DOWN');
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd: onTouchEndEvent };
};