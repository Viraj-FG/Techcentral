import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { SyncIndicator } from "@/components/ui/SyncIndicator";
import { ErrorBoundary } from "@/lib/ErrorBoundary";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Household from "./pages/Household";
import HouseholdInviteAccept from "./pages/HouseholdInviteAccept";
import Inventory from "./pages/Inventory";
import RecipeBook from "./pages/RecipeBook";
import SharedRecipe from "./pages/SharedRecipe";
import MealPlanner from "./pages/MealPlanner";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import { AdminRoute } from "./components/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RealtimeProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <SyncIndicator />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/household" element={<Household />} />
              <Route path="/household/join" element={<HouseholdInviteAccept />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/recipes" element={<RecipeBook />} />
              <Route path="/recipe/:shareToken" element={<SharedRecipe />} />
              <Route path="/meal-planner" element={<MealPlanner />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </RealtimeProvider>
  </QueryClientProvider>
);

export default App;
