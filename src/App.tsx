import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { VoiceAssistantProvider } from "@/contexts/VoiceAssistantContext";
import { SyncIndicator } from "@/components/ui/SyncIndicator";
import { ErrorBoundary } from "@/lib/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import { AdminRoute } from "./components/AdminRoute";
import { lazy, Suspense } from "react";

// Lazy load route components for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Household = lazy(() => import("./pages/Household"));
const HouseholdInviteAccept = lazy(() => import("./pages/HouseholdInviteAccept"));
const Inventory = lazy(() => import("./pages/Inventory"));
const RecipeBook = lazy(() => import("./pages/RecipeBook"));
const SharedRecipe = lazy(() => import("./pages/SharedRecipe"));
const MealPlanner = lazy(() => import("./pages/MealPlanner"));
const Analytics = lazy(() => import("./pages/Analytics"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback for lazy routes
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

/**
 * Route Configuration:
 * 
 * PUBLIC ROUTES (no auth required):
 * - / (Landing) - Marketing page, redirects to /app if authenticated
 * - /auth - Login/signup, redirects to /app if authenticated
 * - /recipe/:shareToken - Public shared recipes
 * - /household/join - Invite acceptance (handles both auth states)
 * 
 * PROTECTED ROUTES (auth required):
 * - /app - Main dashboard (handles first-time vs returning user)
 * - /settings - User settings
 * - /household - Household management
 * - /inventory - Inventory management
 * - /recipes - Recipe book
 * - /meal-planner - Meal planning
 * - /analytics - Analytics dashboard
 * - /admin - Admin panel (requires admin role)
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <RealtimeProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <SyncIndicator />
          <BrowserRouter>
            <VoiceAssistantProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* PUBLIC ROUTES - Redirect authenticated users */}
                  <Route path="/" element={
                    <PublicRoute redirectIfAuthenticated>
                      <Landing />
                    </PublicRoute>
                  } />
                  <Route path="/auth" element={
                    <PublicRoute redirectIfAuthenticated>
                      <Auth />
                    </PublicRoute>
                  } />
                  
                  {/* PUBLIC ROUTES - Accessible to everyone */}
                  <Route path="/recipe/:shareToken" element={<SharedRecipe />} />
                  <Route path="/household/join" element={<HouseholdInviteAccept />} />
                  
                  {/* PROTECTED ROUTES - Require authentication */}
                  <Route path="/app" element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/household" element={
                    <ProtectedRoute>
                      <Household />
                    </ProtectedRoute>
                  } />
                  <Route path="/inventory" element={
                    <ProtectedRoute>
                      <Inventory />
                    </ProtectedRoute>
                  } />
                  <Route path="/recipes" element={
                    <ProtectedRoute>
                      <RecipeBook />
                    </ProtectedRoute>
                  } />
                  <Route path="/meal-planner" element={
                    <ProtectedRoute>
                      <MealPlanner />
                    </ProtectedRoute>
                  } />
                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  } />
                  
                  {/* ADMIN ROUTE - Requires admin role */}
                  <Route path="/admin" element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  } />
                  
                  {/* CATCH-ALL - 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </VoiceAssistantProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </RealtimeProvider>
  </QueryClientProvider>
);

export default App;
