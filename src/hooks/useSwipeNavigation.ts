import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { haptics } from '@/lib/haptics';

interface SwipeNavigationOptions {
  enabled?: boolean;
  threshold?: number; // Minimum swipe distance in pixels
}

const ROUTE_ORDER = ['/app', '/inventory', '/recipes', '/settings'];

export const useSwipeNavigation = (options: SwipeNavigationOptions = {}) => {
  const { enabled = true, threshold = 80 } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwiping.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);

      // If horizontal swipe is more dominant than vertical, mark as swiping
      if (deltaX > deltaY && deltaX > 10) {
        isSwiping.current = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || !isSwiping.current) {
        touchStartX.current = null;
        touchStartY.current = null;
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
  }, [enabled, threshold, navigate, location.pathname]);
};
