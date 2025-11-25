import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { SyncIndicator } from "@/components/ui/SyncIndicator";
import ErrorBoundary from "./components/ErrorBoundary";
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
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SyncIndicator />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<ProtectedRoute><ErrorBoundary><Index /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/auth" element={<ErrorBoundary><Auth /></ErrorBoundary>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/household" element={<ProtectedRoute><Household /></ProtectedRoute>} />
                <Route path="/join" element={<Join />} />
                <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                <Route path="/recipes" element={<ProtectedRoute><RecipeBook /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><ErrorBoundary><Admin /></ErrorBoundary></AdminRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
