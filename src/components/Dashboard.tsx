import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, AlertCircle, Package, Camera, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import AppShell from "./layout/AppShell";
import { checkAdminStatus } from "@/lib/authUtils";
import { groupInventoryByCategory, getInventoryStatus } from "@/lib/inventoryUtils";
import VoiceAssistant, { useVoiceAssistant } from "./voice/VoiceAssistant";
import WelcomeBanner from "./dashboard/WelcomeBanner";
import ConfigurationBanner from "./dashboard/ConfigurationBanner";
import PulseHeader from "./dashboard/PulseHeader";
import SmartCartWidget from "./dashboard/SmartCartWidget";
import InventoryMatrix from "./dashboard/InventoryMatrix";
import RecipeFeed from "./dashboard/RecipeFeed";
import SocialImport from "./dashboard/SocialImport";
import SafetyShield from "./dashboard/SafetyShield";
import HouseholdQuickAccess from "./dashboard/HouseholdQuickAccess";
import RecentActivity from "./dashboard/RecentActivity";
import SmartScanner from "./scanner/SmartScanner";
import InventoryMatrixSkeleton from "./dashboard/InventoryMatrixSkeleton";
import NutritionWidget from "./dashboard/NutritionWidget";
import { kaevaEntranceVariants } from "@/hooks/useKaevaMotion";
import { ELEVENLABS_CONFIG } from "@/config/agent";

interface DashboardProps {
  profile: any;
}

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

  // Voice assistant hook
  const { startConversation } = useVoiceAssistant({ 
    userProfile: profile, 
    onProfileUpdate: setInventoryData 
  });

  // Add to cart handler for refill buttons
  const handleAddToCart = async (item: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('shopping_list').insert({
        item_name: item.name,
        user_id: user.id,
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

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);

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
        onVoiceActivate={startConversation}
      >
        {/* Voice Assistant Overlay */}
        <VoiceAssistant userProfile={profile} onProfileUpdate={setInventoryData} />

        {/* Welcome Banner for skipped onboarding */}
        <WelcomeBanner />

        <ConfigurationBanner />
        
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

        {/* Header */}
        <PulseHeader profile={profile} />
        
        {/* Safety Shield */}
        <SafetyShield profile={profile} />
        
        {/* Household Quick Access */}
        <HouseholdQuickAccess />
        
        {/* Smart Cart */}
        <SmartCartWidget cartItems={lowStockItems} />
        
        {/* Nutrition Tracking */}
        <NutritionWidget userId={profile.id} />
        
        {/* Inventory Matrix with Status */}
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
            <div>
              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">Inventory Command</h3>
              <InventoryMatrix inventory={inventoryData} onRefill={handleAddToCart} onCookNow={handleCookNow} />
            </div>
            <section>
              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">Recipe Engine</h3>
              <RecipeFeed userInventory={inventoryData} userProfile={profile} />
            </section>
          </>
        )}
        
        {/* Recent Activity */}
        <RecentActivity />
        
        {/* End of Stream Marker */}
        <div className="w-full p-6 text-center opacity-30">
          <div className="w-2 h-2 rounded-full bg-slate-600 mx-auto mb-2"></div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">End of Stream</p>
        </div>
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
    </>
  );
};

export default Dashboard;
