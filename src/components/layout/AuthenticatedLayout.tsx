import { Suspense, lazy } from 'react';
import { Outlet } from 'react-router-dom';

// Lazy load the voice provider - only loads when authenticated users access the app
const LazyVoiceProvider = lazy(() => 
  import('@/contexts/VoiceAssistantContext').then(module => ({
    default: module.VoiceAssistantProvider
  }))
);

/**
 * AuthenticatedLayout - Wraps authenticated routes with lazy-loaded voice provider
 * 
 * This layout ensures the @11labs/react SDK (~100KB) only loads for authenticated users,
 * not for public pages like Landing or Auth. Voice provider is dynamically imported
 * when this layout mounts, significantly reducing initial bundle size for public pages.
 */
const AuthenticatedLayout = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <LazyVoiceProvider>
        <Outlet />
      </LazyVoiceProvider>
    </Suspense>
  );
};

export default AuthenticatedLayout;
