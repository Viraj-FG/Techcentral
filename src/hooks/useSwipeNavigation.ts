import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { haptics } from '@/lib/haptics';

interface SwipeNavigationOptions {
  enabled?: boolean;
  threshold?: number; // Minimum swipe distance in pixels
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

const ROUTE_ORDER = ['/app', '/inventory', '/recipes', '/settings'];

export interface SwipeState {
  isActive: boolean;
  progress: number; // 0-1, how far through the swipe
  direction: 'left' | 'right' | null;
  currentIndex: number;
  nextIndex: number | null;
}

export const useSwipeNavigation = (options: SwipeNavigationOptions = {}) => {
  const { enabled = true, threshold = 80, onSwipeStart, onSwipeEnd } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isActive: false,
    progress: 0,
    direction: null,
    currentIndex: ROUTE_ORDER.indexOf(location.pathname),
    nextIndex: null,
  });

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwiping.current = false;
      
      const currentIndex = ROUTE_ORDER.indexOf(location.pathname);
      setSwipeState({
        isActive: false,
        progress: 0,
        direction: null,
        currentIndex,
        nextIndex: null,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const currentX = e.touches[0].clientX;
      const deltaX = currentX - touchStartX.current;
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
      const absDeltaX = Math.abs(deltaX);

      // If horizontal swipe is more dominant than vertical, mark as swiping
      if (absDeltaX > deltaY && absDeltaX > 10) {
        if (!isSwiping.current) {
          isSwiping.current = true;
          onSwipeStart?.();
        }

        const currentIndex = ROUTE_ORDER.indexOf(location.pathname);
        const direction = deltaX > 0 ? 'right' : 'left';
        const progress = Math.min(absDeltaX / window.innerWidth, 1);
        
        let nextIndex: number | null = null;
        if (direction === 'right') {
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) nextIndex = ROUTE_ORDER.length - 1;
        } else {
          nextIndex = currentIndex + 1;
          if (nextIndex >= ROUTE_ORDER.length) nextIndex = 0;
        }

        setSwipeState({
          isActive: true,
          progress,
          direction,
          currentIndex,
          nextIndex,
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || !isSwiping.current) {
        touchStartX.current = null;
        touchStartY.current = null;
        setSwipeState(prev => ({ ...prev, isActive: false, progress: 0, direction: null }));
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX.current;

      // Check if swipe distance exceeds threshold
      if (Math.abs(deltaX) >= threshold) {
        const currentIndex = ROUTE_ORDER.indexOf(location.pathname);
        
        if (currentIndex !== -1) {
          let nextIndex: number;
          
          // Swipe right = previous page (deltaX > 0)
          // Swipe left = next page (deltaX < 0)
          if (deltaX > 0) {
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) nextIndex = ROUTE_ORDER.length - 1; // Wrap to last
          } else {
            nextIndex = currentIndex + 1;
            if (nextIndex >= ROUTE_ORDER.length) nextIndex = 0; // Wrap to first
          }

          haptics.selection();
          navigate(ROUTE_ORDER[nextIndex]);
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
      isSwiping.current = false;
      onSwipeEnd?.();
      
      setSwipeState(prev => ({ ...prev, isActive: false, progress: 0, direction: null }));
    };

    // Add listeners to the document to capture all touch events
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, navigate, location.pathname, onSwipeStart, onSwipeEnd]);

  // Update current index when location changes
  useEffect(() => {
    setSwipeState(prev => ({
      ...prev,
      currentIndex: ROUTE_ORDER.indexOf(location.pathname),
    }));
  }, [location.pathname]);

  return swipeState;
};

export const ROUTE_ORDER_EXPORT = ROUTE_ORDER;
