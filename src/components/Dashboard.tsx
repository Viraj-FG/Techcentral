import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import AppShell from "./layout/AppShell";
import VoiceAssistant from "./voice/VoiceAssistant";
import ConfigurationBanner from "./dashboard/ConfigurationBanner";
import PulseHeader from "./dashboard/PulseHeader";
import SmartCartWidget from "./dashboard/SmartCartWidget";
import InventoryMatrix from "./dashboard/InventoryMatrix";
import SafetyShield from "./dashboard/SafetyShield";
import RecentActivity from "./dashboard/RecentActivity";
import SmartScanner from "./scanner/SmartScanner";
import InventoryMatrixSkeleton from "./dashboard/InventoryMatrixSkeleton";
import { kaevaEntranceVariants } from "@/hooks/useKaevaMotion";

interface DashboardProps {
  profile: any;
}

// Mock inventory data
const mockInventory = {
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
  const navigate = useNavigate();
  const [inventoryData, setInventoryData] = useState(mockInventory);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);

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
              fillLevel: i.fill_level || 50,
              unit: i.unit || '',
              status: i.fill_level && i.fill_level <= 20 ? 'low' : i.fill_level && i.fill_level <= 50 ? 'medium' : 'good',
              autoOrdering: i.auto_order_enabled
            })),
            pantry: inventory.filter(i => i.category === 'pantry').map(i => ({
              name: i.name,
              fillLevel: i.fill_level || 50,
              unit: i.unit || '',
              status: i.fill_level && i.fill_level <= 20 ? 'low' : i.fill_level && i.fill_level <= 50 ? 'medium' : 'good',
              autoOrdering: i.auto_order_enabled
            })),
            beauty: inventory.filter(i => i.category === 'beauty').map(i => ({
              name: i.name,
              fillLevel: i.fill_level || 50,
              unit: i.unit || '',
              status: i.fill_level && i.fill_level <= 20 ? 'low' : i.fill_level && i.fill_level <= 50 ? 'medium' : 'good',
              autoOrdering: i.auto_order_enabled
            })),
            pets: inventory.filter(i => i.category === 'pets').map(i => ({
              name: i.name,
              fillLevel: i.fill_level || 50,
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

  // Calculate low stock items for Smart Cart
  const lowStockItems = Object.values(inventoryData)
    .flat()
    .filter(item => item.fillLevel <= 20);


  // Determine inventory status for cards
  const getInventoryStatus = (items: any[]): 'good' | 'warning' | 'normal' => {
    if (items.length === 0) return 'normal';
    const avgFill = items.reduce((acc, item) => acc + item.fillLevel, 0) / items.length;
    if (avgFill >= 60) return 'good';
    if (avgFill <= 30) return 'warning';
    return 'normal';
  };

  return (
    <>
      <AppShell onScan={() => setSpotlightOpen(true)}>
        {/* Voice Assistant - always active */}
        <VoiceAssistant userProfile={profile} onProfileUpdate={setInventoryData} />

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
        
        {/* Smart Cart */}
        <SmartCartWidget cartItems={lowStockItems} />
        
        {/* Inventory Matrix with Status */}
        {isLoading ? (
          <InventoryMatrixSkeleton />
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
                  const categorized = {
                    fridge: data.filter(i => i.category === 'fridge').map(i => ({
                      name: i.name,
                      fillLevel: i.fill_level || 50,
                      unit: i.unit || '',
                      status: i.status || 'sufficient',
                      autoOrdering: i.auto_order_enabled
                    })),
                    pantry: data.filter(i => i.category === 'pantry').map(i => ({
                      name: i.name,
                      fillLevel: i.fill_level || 50,
                      unit: i.unit || '',
                      status: i.status || 'sufficient',
                      autoOrdering: i.auto_order_enabled
                    })),
                    beauty: data.filter(i => i.category === 'beauty').map(i => ({
                      name: i.name,
                      fillLevel: i.fill_level || 50,
                      unit: i.unit || '',
                      status: i.status || 'sufficient',
                      autoOrdering: i.auto_order_enabled
                    })),
                    pets: data.filter(i => i.category === 'pets').map(i => ({
                      name: i.name,
                      fillLevel: i.fill_level || 50,
                      unit: i.unit || '',
                      status: i.status || 'sufficient',
                      autoOrdering: i.auto_order_enabled
                    }))
                  };
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
