import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshProps {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true
}: UsePullToRefreshProps) => {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false
  });

  const startY = useRef(0);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    let rafId: number;

    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop = container.scrollTop;
      
      // Only allow pull to refresh at the top of the scroll
      if (scrollTop === 0 && !state.isRefreshing) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (state.isRefreshing || startY.current === 0) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      // Only process downward pulls
      if (diff > 0 && container.scrollTop === 0) {
        e.preventDefault();
        
        rafId = requestAnimationFrame(() => {
          const pullDistance = Math.min(diff / resistance, threshold * 1.5);
          setState(prev => ({
            ...prev,
            isPulling: true,
            pullDistance
          }));
        });
      }
    };

    const handleTouchEnd = async () => {
      if (state.isPulling && state.pullDistance >= threshold) {
        setState(prev => ({
          ...prev,
          isRefreshing: true,
          isPulling: false
        }));

        try {
          await onRefresh();
        } finally {
          setState({
            isPulling: false,
            pullDistance: 0,
            isRefreshing: false
          });
        }
      } else {
        setState({
          isPulling: false,
          pullDistance: 0,
          isRefreshing: false
        });
      }

      startY.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled, state.isRefreshing, state.isPulling, state.pullDistance, threshold, resistance, onRefresh]);

  return {
    containerRef,
    ...state,
    pullPercentage: Math.min((state.pullDistance / threshold) * 100, 100)
  };
};
