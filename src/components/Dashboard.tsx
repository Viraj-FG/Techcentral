import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Icon } from "./ui/icon";
import { Shield } from "lucide-react";
import { kaevaTransition, kaevaEntranceVariants } from "@/hooks/useKaevaMotion";
import PulseHeader from "./dashboard/PulseHeader";
import SmartCartWidget from "./dashboard/SmartCartWidget";
import InventoryMatrix from "./dashboard/InventoryMatrix";
import ShieldStatus from "./dashboard/ShieldStatus";
import FloatingActionButton from "./dashboard/FloatingActionButton";
import ConfigurationBanner from "./dashboard/ConfigurationBanner";
import VoiceAssistant from "./voice/VoiceAssistant";
import InventoryMatrixSkeleton from "./dashboard/InventoryMatrixSkeleton";
import AuroraBackground from "./AuroraBackground";

interface DashboardProps {
  profile: any;
}

// Mock inventory data
const mockInventoryData = {
  fridge: [
    { name: "Milk", fillLevel: 20, unit: "gallon", status: "low", autoOrdering: true },
    { name: "Eggs", fillLevel: 80, unit: "dozen", status: "good", autoOrdering: false },
    { name: "Butter", fillLevel: 45, unit: "lb", status: "medium", autoOrdering: false }
  ],
  pantry: [
    { name: "Rice", fillLevel: 60, unit: "lb", status: "good", autoOrdering: false },
    { name: "Olive Oil", fillLevel: 15, unit: "L", status: "low", autoOrdering: true },
    { name: "Pasta", fillLevel: 75, unit: "boxes", status: "good", autoOrdering: false }
  ],
  beauty: [
    { name: "Face Serum", fillLevel: 10, unit: "ml", status: "critical", autoOrdering: true },
    { name: "Shampoo", fillLevel: 55, unit: "oz", status: "good", autoOrdering: false },
    { name: "Moisturizer", fillLevel: 30, unit: "oz", status: "medium", autoOrdering: false }
  ],
  pets: [
    { name: "Dog Food", fillLevel: 25, unit: "lb", status: "low", autoOrdering: true },
    { name: "Cat Litter", fillLevel: 70, unit: "lb", status: "good", autoOrdering: false },
    { name: "Dog Treats", fillLevel: 40, unit: "bags", status: "medium", autoOrdering: false }
  ]
};

const Dashboard = ({ profile }: DashboardProps) => {
  const [inventoryData, setInventoryData] = useState(mockInventoryData);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase.functions.invoke("check-admin", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (data?.isAdmin) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Admin check error:", error);
      }
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
          // Group inventory by category
          const grouped = {
            fridge: inventory.filter(i => i.category === 'fridge').map(i => ({
              name: i.name,
              fillLevel: i.fill_level || 0,
              unit: i.unit || '',
              status: i.fill_level && i.fill_level <= 20 ? 'low' : i.fill_level && i.fill_level <= 50 ? 'medium' : 'good',
              autoOrdering: i.auto_order_enabled
            })),
            pantry: inventory.filter(i => i.category === 'pantry').map(i => ({
              name: i.name,
              fillLevel: i.fill_level || 0,
              unit: i.unit || '',
              status: i.fill_level && i.fill_level <= 20 ? 'low' : i.fill_level && i.fill_level <= 50 ? 'medium' : 'good',
              autoOrdering: i.auto_order_enabled
            })),
            beauty: inventory.filter(i => i.category === 'beauty').map(i => ({
              name: i.name,
              fillLevel: i.fill_level || 0,
              unit: i.unit || '',
              status: i.fill_level && i.fill_level <= 20 ? 'low' : i.fill_level && i.fill_level <= 50 ? 'medium' : 'good',
              autoOrdering: i.auto_order_enabled
            })),
            pets: inventory.filter(i => i.category === 'pets').map(i => ({
              name: i.name,
              fillLevel: i.fill_level || 0,
              unit: i.unit || '',
              status: i.fill_level && i.fill_level <= 20 ? 'low' : i.fill_level && i.fill_level <= 50 ? 'medium' : 'good',
              autoOrdering: i.auto_order_enabled
            }))
          };
          setInventoryData(grouped);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
    fetchInventory();
  }, []);

  // Get all items that need auto-ordering (fillLevel < 20%)
  const lowStockItems = Object.values(inventoryData)
    .flat()
    .filter(item => item.fillLevel <= 20);

  const dashboardVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* LAYER 0: The Atmosphere (Fixed Background) */}
      <AuroraBackground vertical="food" />
      
      {/* LAYER 10: The Scrollable Content (The Safe Zone) */}
      <main className="relative z-10 max-w-7xl mx-auto space-y-6 pb-[160px] p-4 sm:p-8">
        {/* Voice Assistant - always active */}
        <VoiceAssistant userProfile={profile} onProfileUpdate={setInventoryData} />
        
        <ConfigurationBanner />
        
        {isAdmin && (
          <motion.div variants={kaevaEntranceVariants} className="flex justify-end">
            <Button variant="glass" onClick={() => navigate("/admin")} className="gap-2">
              <Icon icon={Shield} size="sm" />
              <span className="text-micro">Admin Dashboard</span>
            </Button>
          </motion.div>
        )}

        <PulseHeader profile={profile} />
        <SmartCartWidget cartItems={lowStockItems} />
        
        {isLoading ? (
          <InventoryMatrixSkeleton />
        ) : (
          <InventoryMatrix inventory={inventoryData} />
        )}
        
        <ShieldStatus profile={profile} />
      </main>

      {/* LAYER 20: The Bottom Mask (Fade Out) */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0F172A] to-transparent pointer-events-none z-20" />

      {/* LAYER 50: The Navigation Dock (Fixed Capsule) */}
      <div className="z-50">
        <FloatingActionButton />
      </div>
    </div>
  );
};

export default Dashboard;
