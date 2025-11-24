import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { SyncIndicator } from "@/components/ui/SyncIndicator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { logger } from "@/lib/logger";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Household from "./pages/Household";
import Join from "./pages/Join";
import Inventory from "./pages/Inventory";
import RecipeBook from "./pages/RecipeBook";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import { AdminRoute } from "./components/AdminRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Log React Query errors globally
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === 'updated' && event?.action?.type === 'error') {
    logger.error('React Query error', event.action.error as Error, { 
      type: 'query',
      queryHash: event.query.queryHash,
    });
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event?.type === 'updated' && event?.action?.type === 'error') {
    logger.error('React Query mutation error', event.action.error as Error, {
      type: 'mutation',
      mutationId: event.mutation.mutationId,
    });
  }
});

const App = () => {
  logger.info('App initialized');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SyncIndicator />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/household" element={<Household />} />
                <Route path="/join" element={<Join />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/recipes" element={<RecipeBook />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RealtimeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
