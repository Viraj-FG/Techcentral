import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Shield, AlertCircle, Package, Camera, Settings, ArrowRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import AppShell from "./layout/AppShell";
import { checkAdminStatus } from "@/lib/authUtils";
import { groupInventoryByCategory, getInventoryStatus } from "@/lib/inventoryUtils";
import VoiceAssistant, { VoiceAssistantRef } from "./voice/VoiceAssistant";
import WelcomeBanner from "./dashboard/WelcomeBanner";
import PulseHeader from "./dashboard/PulseHeader";
import SmartCartWidget from "./dashboard/SmartCartWidget";
import InventoryMatrix from "./dashboard/InventoryMatrix";
import RecipeFeed from "./dashboard/RecipeFeed";
import SocialImport from "./dashboard/SocialImport";
import SafetyShield from "./dashboard/SafetyShield";
import HouseholdQuickAccess from "./dashboard/HouseholdQuickAccess";
import { HouseholdActivityFeed } from "./dashboard/HouseholdActivityFeed";
import SmartScanner from "./scanner/SmartScanner";
import InventoryMatrixSkeleton from "./dashboard/InventoryMatrixSkeleton";
import NutritionWidget from "./dashboard/NutritionWidget";
import { kaevaEntranceVariants } from "@/hooks/useKaevaMotion";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import GlobalSearch from "./search/GlobalSearch";
import { haptics } from "@/lib/haptics";

interface DashboardProps {
  profile: any;
}

type ViewMode = 'dashboard' | 'cart';

const Dashboard = ({ profile }: DashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Voice assistant ref
  const voiceAssistantRef = useRef<VoiceAssistantRef>(null);

  // Gesture navigation
  const dragX = useMotionValue(0);
  const dragConstraints = { left: 0, right: 0 };

  const handleDragEnd = (_event: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold && viewMode === 'cart') {
      haptics.selection();
      setViewMode('dashboard');
    } else if (info.offset.x < -threshold && viewMode === 'dashboard') {
      haptics.selection();
      setViewMode('cart');
    }
  };

  // Add to cart handler for refill buttons
  const handleAddToCart = async (item: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get household_id from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

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
        description: `${item.name} added to your shopping list`,
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
      description: `Looking for recipes using ${ingredients.join(', ')}`,
    });
    // Recipe feed will auto-load with these ingredients
  };

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get household_id from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.current_household_id) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('household_id', profileData.current_household_id);

      if (error) throw error;

      const grouped = groupInventoryByCategory(data || []);
      setInventoryData(grouped);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const isAdmin = await checkAdminStatus();
      setIsAdmin(isAdmin);
    };
    checkAdmin();
    fetchInventory();
  }, []);

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
          description: newValue === 'true' 
            ? 'Verbose logging enabled. Check console for detailed voice logs.' 
            : 'Verbose logging disabled.',
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  // Calculate low stock items for Smart Cart
  const lowStockItems = Object.values(inventoryData)
    .flat()
    .filter(item => item.fillLevel <= 20);

  // Check if all categories are empty
  const isInventoryEmpty = Object.values(inventoryData).every(
    category => category.length === 0
  );


  return (
    <>
      <AppShell 
        onScan={() => setSpotlightOpen(true)} 
        onVoiceActivate={() => voiceAssistantRef.current?.startConversation()}
      >
        {/* Voice Assistant Overlay */}
        <VoiceAssistant ref={voiceAssistantRef} userProfile={profile} onProfileUpdate={setInventoryData} />

        {/* View Mode Indicator */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => { setViewMode('dashboard'); haptics.selection(); }}
            className={`w-2 h-2 rounded-full transition-all ${
              viewMode === 'dashboard' ? 'bg-kaeva-sage w-6' : 'bg-slate-600'
            }`}
            aria-label="Dashboard view"
          />
          <button
            onClick={() => { setViewMode('cart'); haptics.selection(); }}
            className={`w-2 h-2 rounded-full transition-all ${
              viewMode === 'cart' ? 'bg-kaeva-sage w-6' : 'bg-slate-600'
            }`}
            aria-label="Cart view"
          />
        </div>

        {/* Swipeable Container */}
        <motion.div
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ x: dragX }}
          className="relative"
        >
          <AnimatePresence mode="wait">
            {viewMode === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Dashboard Content */}
                <WelcomeBanner />

                {/* Search Trigger Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-slate-900/60 transition-all"
                  onClick={() => setSearchOpen(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-400 text-sm flex-1">
                      Search inventory, recipes, pets...
                    </span>
                    <kbd className="px-2 py-1 bg-slate-800/50 border border-white/10 rounded text-xs text-slate-400">
                      ⌘K
                    </kbd>
                  </div>
                </motion.div>
                
                {isAdmin && (
                  <motion.div 
                    variants={kaevaEntranceVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex justify-end"
                  >
                    <Button
                      variant="glass"
                      onClick={() => navigate("/admin")}
                      className="gap-2"
                    >
                      <Icon icon={Shield} size="sm" />
                      <span className="text-micro">Admin Dashboard</span>
                    </Button>
                  </motion.div>
                )}

                <PulseHeader profile={profile} />
                <SafetyShield profile={profile} />
                <HouseholdQuickAccess />
                <NutritionWidget userId={profile.id} />
                
                {isLoading ? (
                  <InventoryMatrixSkeleton />
                ) : isInventoryEmpty ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-12 text-center"
                  >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-kaeva-sage/10 flex items-center justify-center">
                      <Package className="text-kaeva-sage" size={40} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-light text-white mb-3">
                      Your Pantry is Empty
                    </h3>
                    <p className="text-white/60 mb-6 max-w-md mx-auto">
                      Start building your digital twin by scanning your first item
                    </p>
                    <Button
                      size="lg"
                      onClick={() => setSpotlightOpen(true)}
                      className="gap-2 bg-kaeva-sage text-kaeva-seattle-slate hover:bg-kaeva-sage/90"
                    >
                      <Camera size={20} strokeWidth={1.5} />
                      Scan Your First Item
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Inventory Command</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate('/inventory')}
                        className="text-sm gap-2 text-muted-foreground hover:text-foreground"
                      >
                        View All Items
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <InventoryMatrix inventory={inventoryData} onRefill={handleAddToCart} onCookNow={handleCookNow} />
                    <section>
                      <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">Recipe Engine</h3>
                      <RecipeFeed userInventory={inventoryData} userProfile={profile} />
                    </section>
                  </>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">Household Activity</h3>
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <HouseholdActivityFeed householdId={profile?.current_household_id || null} maxItems={10} />
                  </div>
                </motion.div>
                
                <div className="w-full p-6 text-center opacity-30">
                  <div className="w-2 h-2 rounded-full bg-slate-600 mx-auto mb-2"></div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">End of Stream</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="cart"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Shopping Cart View */}
                <h2 className="text-2xl text-display text-white mb-4">Shopping Manifest</h2>
                <SmartCartWidget cartItems={lowStockItems} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AppShell>

      {/* Smart Scanner Overlay */}
      <SmartScanner
        userId={profile.id}
        onClose={() => setSpotlightOpen(false)}
        isOpen={spotlightOpen}
        onItemsAdded={fetchInventory}
        onSocialImport={() => { setSpotlightOpen(false); setSocialImportOpen(true); }}
      />
      <SocialImport open={socialImportOpen} onClose={() => setSocialImportOpen(false)} userId={profile.id} onItemsAdded={fetchInventory} />
      
      {/* Global Search */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default Dashboard;
