import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Package, Camera, ArrowRight, Heart, Sparkles, PawPrint, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AppShell from "./layout/AppShell";
import { checkAdminStatus } from "@/lib/authUtils";
import { groupInventoryByCategory } from "@/lib/inventoryUtils";
import VoiceAssistant, { VoiceAssistantRef } from "./voice/VoiceAssistant";
import WelcomeBanner from "./dashboard/WelcomeBanner";
import PulseHeader from "./dashboard/PulseHeader";
import SmartCartWidget from "./dashboard/SmartCartWidget";
import RecipeFeed from "./dashboard/RecipeFeed";
import SocialImport from "./dashboard/SocialImport";
import SafetyShield from "./dashboard/SafetyShield";
import HouseholdQuickAccess from "./dashboard/HouseholdQuickAccess";
import { HouseholdActivityFeed } from "./dashboard/HouseholdActivityFeed";
import SmartScanner from "./scanner/SmartScanner";
import InventoryMatrixSkeleton from "./dashboard/InventoryMatrixSkeleton";
import NutritionWidget from "./dashboard/NutritionWidget";
import { WaterTrackingWidget } from "./dashboard/WaterTrackingWidget";
import { StreakWidget } from "./dashboard/StreakWidget";
import GlobalSearch from "./search/GlobalSearch";
import { haptics } from "@/lib/haptics";
import { ShareProgressSheet } from "./analytics/ShareProgressSheet";
import { ExpiringItemsRecipes } from "./dashboard/ExpiringItemsRecipes";
import { DashboardViewIndicator, DashboardViewMode, DASHBOARD_VIEWS } from "./dashboard/DashboardViewIndicator";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { BeautySummaryCard } from "./dashboard/BeautySummaryCard";
import { BeautyInventoryList } from "./dashboard/BeautyInventoryList";
import { PetRosterCard } from "./dashboard/PetRosterCard";
import { PetSuppliesStatus } from "./dashboard/PetSuppliesStatus";
import { ToxicFoodMonitor } from "./dashboard/ToxicFoodMonitor";
import { SwipeEdgeIndicator } from "./dashboard/SwipeEdgeIndicator";
import { MealPlanWidget } from "./dashboard/MealPlanWidget";
import { lazy, Suspense } from "react";
const AIInsightsWidget = lazy(() => import("./dashboard/AIInsightsWidget").then(m => ({ default: m.AIInsightsWidget })));
import AIInsightsWidgetSkeleton from "./dashboard/AIInsightsWidgetSkeleton";
import { QuickActions } from "./dashboard/QuickActions";
import { PetCareTipsWidget } from "./dashboard/PetCareTipsWidget";
import { kaevaStaggerContainer, kaevaStaggerChild } from "@/hooks/useKaevaMotion";
import { useModularOnboarding, OnboardingModule } from "@/hooks/useModularOnboarding";
import { ModularOnboardingPrompt } from "./onboarding/ModularOnboardingPrompt";
import { OnboardingModuleSheet } from "./onboarding/OnboardingModuleSheet";
interface DashboardProps {
  profile: any;
}
const Dashboard = ({
  profile
}: DashboardProps) => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [inventoryData, setInventoryData] = useState({
    fridge: [],
    pantry: [],
    beauty: [],
    pets: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [socialImportOpen, setSocialImportOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<DashboardViewMode>('pulse');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState({});
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('right');

  // Modular onboarding state
  const {
    isModuleComplete,
    isDismissedThisSession,
    dismissPrompt
  } = useModularOnboarding();
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState<{
    module: OnboardingModule;
    open: boolean;
    message: string;
  } | null>(null);
  const [showModuleSheet, setShowModuleSheet] = useState<{
    module: OnboardingModule;
    open: boolean;
  } | null>(null);

  // Voice assistant ref
  const voiceAssistantRef = useRef<VoiceAssistantRef>(null);

  // Gesture navigation
  const dragX = useMotionValue(0);
  const dragConstraints = {
    left: 0,
    right: 0
  };

  // Calculate adjacent views for preview
  const getAdjacentViews = () => {
    const currentIndex = DASHBOARD_VIEWS.findIndex(v => v.id === viewMode);
    const prevIndex = currentIndex === 0 ? DASHBOARD_VIEWS.length - 1 : currentIndex - 1;
    const nextIndex = (currentIndex + 1) % DASHBOARD_VIEWS.length;
    return {
      prev: DASHBOARD_VIEWS[prevIndex].id as DashboardViewMode,
      next: DASHBOARD_VIEWS[nextIndex].id as DashboardViewMode
    };
  };
  const handleDragEnd = (_event: any, info: PanInfo) => {
    const threshold = 100;
    const currentIndex = DASHBOARD_VIEWS.findIndex(v => v.id === viewMode);
    if (info.offset.x > threshold) {
      // Swipe right - go to previous view (circular)
      haptics.selection();
      setSwipeDirection('right');
      const prevIndex = currentIndex === 0 ? DASHBOARD_VIEWS.length - 1 : currentIndex - 1;
      setViewMode(DASHBOARD_VIEWS[prevIndex].id as DashboardViewMode);
    } else if (info.offset.x < -threshold) {
      // Swipe left - go to next view (circular)
      haptics.selection();
      setSwipeDirection('left');
      const nextIndex = (currentIndex + 1) % DASHBOARD_VIEWS.length;
      setViewMode(DASHBOARD_VIEWS[nextIndex].id as DashboardViewMode);
    }
  };
  const handleViewChange = (newView: DashboardViewMode) => {
    const currentIndex = DASHBOARD_VIEWS.findIndex(v => v.id === viewMode);
    const newIndex = DASHBOARD_VIEWS.findIndex(v => v.id === newView);
    setSwipeDirection(newIndex > currentIndex ? 'left' : 'right');
    setViewMode(newView);
  };

  // Add to cart handler for refill buttons
  const handleAddToCart = async (item: any) => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get household_id from profile
      const {
        data: profileData
      } = await supabase.from('profiles').select('current_household_id').eq('id', user.id).single();
      if (!profileData?.current_household_id) {
        toast({
          title: "Error",
          description: "No household found",
          variant: "destructive"
        });
        return;
      }
      await supabase.from('shopping_list').insert({
        item_name: item.name,
        household_id: profileData.current_household_id,
        source: 'auto_refill',
        priority: 'high',
        quantity: 1,
        inventory_id: item.id
      });
      toast({
        title: "Added to Cart",
        description: `${item.name} added to your shopping list`
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  // Cook now handler for expiring items
  const handleCookNow = async (ingredients: string[]) => {
    toast({
      title: "Finding Recipes...",
      description: `Looking for recipes using ${ingredients.join(', ')}`
    });
  };

  // OPTIMIZATION: Parallelize database queries on mount
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setIsLoading(true);
        
        // Parallel queries for faster initial load
        const [adminStatus, inventoryData] = await Promise.all([
          checkAdminStatus(),
          (async () => {
            if (!profile?.current_household_id) return null;
            
            const { data, error } = await supabase
              .from('inventory')
              .select('*')
              .eq('household_id', profile.current_household_id);
            
            if (error) throw error;
            return data;
          })()
        ]);

        setIsAdmin(adminStatus);
        
        if (inventoryData) {
          const grouped = groupInventoryByCategory(inventoryData);
          setInventoryData(grouped);
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [profile?.current_household_id]);

  // Refresh inventory data (used by scanner/social import callbacks)
  const fetchInventory = async () => {
    try {
      if (!profile?.current_household_id) return;
      
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('household_id', profile.current_household_id);
      
      if (error) throw error;
      
      const grouped = groupInventoryByCategory(data || []);
      setInventoryData(grouped);
    } catch (error) {
      console.error('Error refreshing inventory:', error);
    }
  };

  // Contextual onboarding prompts based on current view
  useEffect(() => {
    const checkPrompt = (module: OnboardingModule, message: string) => {
      if (!isModuleComplete(module) && !isDismissedThisSession(module)) {
        setShowOnboardingPrompt({
          module,
          open: true,
          message
        });
      } else {
        setShowOnboardingPrompt(null);
      }
    };
    switch (viewMode) {
      case 'fuel':
        checkPrompt('nutrition', 'Want personalized meal recommendations? Share your nutrition goals.');
        break;
      case 'glow':
        checkPrompt('beauty', 'Get product recommendations tailored to your skin and hair type.');
        break;
      case 'pets':
        checkPrompt('pets', 'Keep your pets safe! Tell us about your furry friends.');
        break;
      case 'home':
        checkPrompt('household', 'Share household members to get personalized meal plans.');
        break;
      case 'pantry':
        checkPrompt('pantry', 'Set your shopping preferences for smarter auto-refills.');
        break;
      default:
        setShowOnboardingPrompt(null);
    }
  }, [viewMode, isModuleComplete, isDismissedThisSession]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+K for voice
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'k') {
        e.preventDefault();
        voiceAssistantRef.current?.startConversation();
      }

      // Cmd+Shift+D to toggle debug mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'd') {
        e.preventDefault();
        const current = localStorage.getItem('kaeva_voice_debug');
        const newValue = current === 'true' ? 'false' : 'true';
        localStorage.setItem('kaeva_voice_debug', newValue);
        toast({
          title: `Voice Debug Mode: ${newValue === 'true' ? 'ON' : 'OFF'}`,
          description: newValue === 'true' ? 'Verbose logging enabled. Check console for detailed voice logs.' : 'Verbose logging disabled.'
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  // Calculate low stock items for Smart Cart
  const lowStockItems = Object.values(inventoryData).flat().filter(item => item.fillLevel <= 20);

  // Check if all categories are empty
  const isInventoryEmpty = Object.values(inventoryData).every(category => category.length === 0);

  // Render functions for each view
  const renderPulseView = () => {
    const hasHealthData = profile?.user_age && profile?.user_weight && profile?.user_height;
    if (!hasHealthData) {
      return <motion.div key="pulse" initial={{
        opacity: 0,
        x: swipeDirection === 'left' ? 100 : -100
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: swipeDirection === 'left' ? -100 : 100
      }} transition={{
        duration: 0.3
      }} className="space-y-4 min-h-[300px]">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-12 text-center overflow-hidden">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
              <Heart className="text-secondary" size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-light text-white mb-3">Start Your Wellness Journey</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Complete your health profile to unlock personalized wellness insights
            </p>
            <Button size="lg" onClick={() => navigate('/settings')} className="gap-2 bg-secondary text-background hover:bg-secondary/90">
              Complete Health Profile
            </Button>
          </div>
        </motion.div>;
    }
    return <motion.div key="pulse" initial={{
      opacity: 0,
      x: swipeDirection === 'left' ? 100 : -100
    }} animate={{
      opacity: 1,
      x: 0
    }} exit={{
      opacity: 0,
      x: swipeDirection === 'left' ? -100 : 100
    }} transition={{
      duration: 0.3
    }} variants={kaevaStaggerContainer} className="space-y-4">
        <motion.div variants={kaevaStaggerChild}><PulseHeader profile={profile} /></motion.div>
        <motion.div variants={kaevaStaggerChild}><WelcomeBanner /></motion.div>
        <motion.div variants={kaevaStaggerChild}>
          <QuickActions onScan={() => setSpotlightOpen(true)} onVoice={() => voiceAssistantRef.current?.startConversation()} onRestock={async () => {
          try {
            const {
              data,
              error
            } = await supabase.functions.invoke('check-auto-restock');
            if (error) throw error;
            if (data.itemsAdded > 0) {
              toast({
                title: "Auto-Restock Complete",
                description: `${data.itemsAdded} items added to your shopping list`
              });
            } else {
              toast({
                title: "All Stocked Up",
                description: "No items need restocking right now"
              });
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to check restock items",
              variant: "destructive"
            });
          }
        }} onPlanWeek={() => navigate('/meal-planner')} />
        </motion.div>
        <motion.div variants={kaevaStaggerChild}>
          <Suspense fallback={<AIInsightsWidgetSkeleton />}>
            <AIInsightsWidget userId={profile.id} />
          </Suspense>
        </motion.div>
        <motion.div variants={kaevaStaggerChild}><SafetyShield profile={profile} /></motion.div>
      </motion.div>;
  };
  const renderFuelView = () => <motion.div key="fuel" initial={{
    opacity: 0,
    x: swipeDirection === 'left' ? 100 : -100
  }} animate={{
    opacity: 1,
    x: 0
  }} exit={{
    opacity: 0,
    x: swipeDirection === 'left' ? -100 : 100
  }} transition={{
    duration: 0.3
  }} variants={kaevaStaggerContainer} className="space-y-4">
      <motion.div variants={kaevaStaggerChild}><NutritionWidget userId={profile.id} /></motion.div>
      <motion.div variants={kaevaStaggerChild}><WaterTrackingWidget userId={profile.id} /></motion.div>
      
    </motion.div>;
  const renderPantryView = () => <motion.div key="pantry" initial={{
    opacity: 0,
    x: swipeDirection === 'left' ? 100 : -100
  }} animate={{
    opacity: 1,
    x: 0
  }} exit={{
    opacity: 0,
    x: swipeDirection === 'left' ? -100 : 100
  }} transition={{
    duration: 0.3
  }} className="space-y-4 min-h-[400px]">
      {isLoading ? <InventoryMatrixSkeleton /> : isInventoryEmpty ? <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-12 text-center overflow-hidden">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
            <Package className="text-secondary" size={40} strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-light text-white mb-3 truncate">
            Your Pantry is Empty
          </h3>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Start building your digital twin by scanning your first item
          </p>
          <Button size="lg" onClick={() => setSpotlightOpen(true)} className="gap-2 bg-secondary text-background hover:bg-secondary/90">
            <Camera size={20} strokeWidth={1.5} />
            Scan Your First Item
          </Button>
        </div> : <>
          <ExpiringItemsRecipes />
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Food Inventory</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} className="text-sm gap-2 text-muted-foreground hover:text-foreground">
                View All Items
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {inventoryData.fridge.length > 0 && <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 overflow-hidden">
                  <h4 className="text-sm font-bold text-white mb-2">Fridge</h4>
                  <p className="text-2xl font-bold text-accent">{inventoryData.fridge.length}</p>
                  <p className="text-xs text-slate-400">items</p>
                </div>}
              {inventoryData.pantry.length > 0 && <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 overflow-hidden">
                  <h4 className="text-sm font-bold text-white mb-2">Pantry</h4>
                  <p className="text-2xl font-bold text-destructive">{inventoryData.pantry.length}</p>
                  <p className="text-xs text-slate-400">items</p>
                </div>}
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Shopping Manifest</h3>
            <SmartCartWidget cartItems={lowStockItems} />
          </section>
        </>}
    </motion.div>;
  const renderGlowView = () => {
    const hasBeautyItems = inventoryData.beauty.length > 0;
    if (!hasBeautyItems) {
      return <motion.div key="glow" initial={{
        opacity: 0,
        x: swipeDirection === 'left' ? 100 : -100
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: swipeDirection === 'left' ? -100 : 100
      }} transition={{
        duration: 0.3
      }} className="space-y-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-12 text-center overflow-hidden">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="text-primary" size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-light text-white mb-3">No Beauty Products Yet</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Start tracking your skincare and beauty routine
            </p>
            <Button size="lg" onClick={() => setSpotlightOpen(true)} className="gap-2 bg-primary text-background hover:bg-primary/90">
              <Camera size={20} strokeWidth={1.5} />
              Scan Beauty Products
            </Button>
          </div>
        </motion.div>;
    }
    return <motion.div key="glow" initial={{
      opacity: 0,
      x: swipeDirection === 'left' ? 100 : -100
    }} animate={{
      opacity: 1,
      x: 0
    }} exit={{
      opacity: 0,
      x: swipeDirection === 'left' ? -100 : 100
    }} transition={{
      duration: 0.3
    }} variants={kaevaStaggerContainer} className="space-y-4">
        <motion.div variants={kaevaStaggerChild}>
          <BeautySummaryCard householdId={profile?.current_household_id || ''} />
        </motion.div>
        <motion.div variants={kaevaStaggerChild}>
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Beauty Products</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} className="text-sm gap-2 text-muted-foreground hover:text-foreground">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <BeautyInventoryList householdId={profile?.current_household_id || ''} />
          </section>
        </motion.div>
      </motion.div>;
  };
  const renderPetsView = () => {
    const hasPets = inventoryData.pets.length > 0;
    if (!hasPets) {
      return <motion.div key="pets" initial={{
        opacity: 0,
        x: swipeDirection === 'left' ? 100 : -100
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: swipeDirection === 'left' ? -100 : 100
      }} transition={{
        duration: 0.3
      }} className="space-y-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-12 text-center overflow-hidden">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
              <PawPrint className="text-secondary" size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-light text-white mb-3">No Pets in Household</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Add your furry friends to enable pet safety monitoring
            </p>
            <Button size="lg" onClick={() => navigate('/household')} className="gap-2 bg-secondary text-background hover:bg-secondary/90">
              <Users size={20} strokeWidth={1.5} />
              Add Your First Pet
            </Button>
          </div>
        </motion.div>;
    }
    return <motion.div key="pets" initial={{
      opacity: 0,
      x: swipeDirection === 'left' ? 100 : -100
    }} animate={{
      opacity: 1,
      x: 0
    }} exit={{
      opacity: 0,
      x: swipeDirection === 'left' ? -100 : 100
    }} transition={{
      duration: 0.3
    }} variants={kaevaStaggerContainer} className="space-y-4">
        <motion.div variants={kaevaStaggerChild}><PetRosterCard userId={profile.id} /></motion.div>
        <motion.div variants={kaevaStaggerChild}><PetCareTipsWidget /></motion.div>
        <motion.div variants={kaevaStaggerChild}><ToxicFoodMonitor userId={profile.id} /></motion.div>
        <motion.div variants={kaevaStaggerChild}>
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Pet Supplies</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} className="text-sm gap-2 text-muted-foreground hover:text-foreground">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <PetSuppliesStatus householdId={profile?.current_household_id || ''} />
          </section>
        </motion.div>
      </motion.div>;
  };
  const renderHomeView = () => <motion.div key="home" initial={{
    opacity: 0,
    x: swipeDirection === 'left' ? 100 : -100
  }} animate={{
    opacity: 1,
    x: 0
  }} exit={{
    opacity: 0,
    x: swipeDirection === 'left' ? -100 : 100
  }} transition={{
    duration: 0.3
  }} variants={kaevaStaggerContainer} className="space-y-4">
      <motion.div variants={kaevaStaggerChild}><HouseholdQuickAccess /></motion.div>
      <motion.div variants={kaevaStaggerChild}><MealPlanWidget /></motion.div>
      <motion.div variants={kaevaStaggerChild}>
        <section className="space-y-3">
          <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Recipe Engine</h3>
          <RecipeFeed userInventory={inventoryData} userProfile={profile} />
        </section>
      </motion.div>
      <motion.div variants={kaevaStaggerChild}>
        <section className="space-y-3">
          <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Household Activity</h3>
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden">
            <HouseholdActivityFeed householdId={profile?.current_household_id || null} maxItems={10} />
          </div>
        </section>
      </motion.div>
    </motion.div>;
  const renderViewByMode = (mode: DashboardViewMode) => {
    switch (mode) {
      case 'pulse':
        return renderPulseView();
      case 'fuel':
        return renderFuelView();
      case 'pantry':
        return renderPantryView();
      case 'glow':
        return renderGlowView();
      case 'pets':
        return renderPetsView();
      case 'home':
        return renderHomeView();
      default:
        return renderPulseView();
    }
  };
  return <>
      <AppShell onScan={() => setSpotlightOpen(true)} onVoiceActivate={() => voiceAssistantRef.current?.startConversation()}>
        {/* Voice Assistant Overlay */}
        <VoiceAssistant ref={voiceAssistantRef} userProfile={profile} onProfileUpdate={setInventoryData} />

        {/* Sticky Search Header */}
        <DashboardHeader onSearchOpen={() => setSearchOpen(true)} />

        {/* View Mode Indicator */}
        <DashboardViewIndicator currentView={viewMode} onViewChange={handleViewChange} />

        {/* Swipe Edge Indicators */}
        <SwipeEdgeIndicator dragX={dragX} currentView={viewMode} />

        {/* Swipeable Container - Single View */}
        <div className="relative -mx-6">
          <motion.div drag="x" dragConstraints={{
          left: 0,
          right: 0
        }} dragElastic={0.2} onDragEnd={handleDragEnd} className="px-6" style={{
          touchAction: 'pan-y',
          x: dragX
        }}>
            <AnimatePresence mode="wait">
              {renderViewByMode(viewMode)}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* End of Stream */}
        <div className="w-full p-6 text-center opacity-30 mt-8">
          <div className="w-2 h-2 rounded-full bg-slate-600 mx-auto mb-2"></div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">End of Stream</p>
        </div>
      </AppShell>

      {/* Smart Scanner Overlay */}
      <SmartScanner userId={profile.id} onClose={() => setSpotlightOpen(false)} isOpen={spotlightOpen} onItemsAdded={fetchInventory} onSocialImport={() => {
      setSpotlightOpen(false);
      setSocialImportOpen(true);
    }} />
      <SocialImport open={socialImportOpen} onClose={() => setSocialImportOpen(false)} userId={profile.id} onItemsAdded={fetchInventory} />
      
      {/* Global Search */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      
      {/* Share Progress Sheet */}
      <ShareProgressSheet open={shareOpen} onClose={() => setShareOpen(false)} data={shareData} />

      {/* Modular Onboarding Components */}
      {showOnboardingPrompt && <ModularOnboardingPrompt open={showOnboardingPrompt.open} module={showOnboardingPrompt.module} message={showOnboardingPrompt.message} onStart={() => {
      setShowOnboardingPrompt(null);
      setShowModuleSheet({
        module: showOnboardingPrompt.module,
        open: true
      });
    }} onDismiss={() => {
      dismissPrompt(showOnboardingPrompt.module);
      setShowOnboardingPrompt(null);
    }} />}

      {showModuleSheet && <OnboardingModuleSheet open={showModuleSheet.open} module={showModuleSheet.module} onClose={() => setShowModuleSheet(null)} onComplete={() => {
      setShowModuleSheet(null);
      fetchInventory(); // Refresh data after onboarding
    }} />}
    </>;
};
export default Dashboard;