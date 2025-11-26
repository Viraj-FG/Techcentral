import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route prefetch map - defines which routes to prefetch based on current location
 * This reduces navigation latency by loading likely next pages in the background
 */
const PREFETCH_MAP: Record<string, string[]> = {
  '/': ['/auth'], // Landing → Auth
  '/auth': ['/app'], // Auth → Dashboard
  '/app': ['/inventory', '/recipes', '/settings'], // Dashboard → Common routes
  '/inventory': ['/app', '/recipes'],
  '/recipes': ['/app', '/meal-planner'],
  '/settings': ['/app', '/household'],
};

/**
 * Prefetch routes by injecting hidden link tags with rel="prefetch"
 * This tells the browser to fetch and cache these routes in the background
 */
const prefetchRoute = (path: string) => {
  // Check if already prefetched
  if (document.querySelector(`link[rel="prefetch"][href*="${path}"]`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'document';
  link.href = path;
  document.head.appendChild(link);
};

/**
 * Hook to automatically prefetch likely next routes based on current location
 * Improves perceived performance by preloading routes user is likely to navigate to
 * 
 * @example
 * ```tsx
 * function Auth() {
 *   usePrefetch(); // Automatically prefetches /app when on /auth
 *   return <div>Login page</div>;
 * }
 * ```
 */
export const usePrefetch = () => {
  const location = useLocation();

  useEffect(() => {
    const routesToPrefetch = PREFETCH_MAP[location.pathname];
    
    if (routesToPrefetch) {
      // Delay prefetch to avoid interfering with current page load
      const timeoutId = setTimeout(() => {
        routesToPrefetch.forEach(prefetchRoute);
      }, 2000); // Wait 2s after page load

      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname]);
};
