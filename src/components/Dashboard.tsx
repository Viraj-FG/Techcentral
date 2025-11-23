import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, AlertCircle, Package, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import AppShell from "./layout/AppShell";
import { checkAdminStatus } from "@/lib/authUtils";
import { groupInventoryByCategory, getInventoryStatus } from "@/lib/inventoryUtils";
import VoiceAssistant, { useVoiceAssistant } from "./voice/VoiceAssistant";
import WelcomeBanner from "./dashboard/WelcomeBanner";
import ConfigurationBanner from "./dashboard/ConfigurationBanner";
import PulseHeader from "./dashboard/PulseHeader";
import SmartCartWidget from "./dashboard/SmartCartWidget";
import InventoryMatrix from "./dashboard/InventoryMatrix";
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
  const [inventoryData, setInventoryData] = useState({
    fridge: [],
    pantry: [],
    beauty: [],
    pets: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  // Voice assistant hook
  const { startConversation } = useVoiceAssistant({ 
    userProfile: profile, 
    onProfileUpdate: setInventoryData 
  });

  useEffect(() => {
    const checkAdmin = async () => {
      const isAdmin = await checkAdminStatus();
      setIsAdmin(isAdmin);
    };

    const fetchInventory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: inventory } = await supabase
          .from('inventory')
          .select('*')
          .eq('user_id', session.user.id);

        if (inventory && inventory.length > 0) {
          const grouped = groupInventoryByCategory(inventory);
          setInventoryData(grouped);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      } finally {
        setIsLoading(false);
      }
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
          <div>
            <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3 px-1">
              Digital Twin
            </h3>
            <InventoryMatrix inventory={inventoryData} />
          </div>
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
      {spotlightOpen && (
        <SmartScanner
          userId={profile.id}
          onClose={() => setSpotlightOpen(false)}
          onItemsAdded={() => {
            setIsLoading(true);
            // Refetch inventory after items added
            const refetchInventory = async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                const { data, error } = await supabase
                  .from('inventory')
                  .select('*')
                  .eq('user_id', session.user.id);

                if (!error && data) {
                  const categorized = groupInventoryByCategory(data);
                  setInventoryData(categorized);
                }
              }
              setIsLoading(false);
            };
            refetchInventory();
          }}
        />
      )}
    </>
  );
};

export default Dashboard;
