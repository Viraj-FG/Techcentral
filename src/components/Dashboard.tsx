import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Shield } from "lucide-react";
import PulseHeader from "./dashboard/PulseHeader";
import SmartCartWidget from "./dashboard/SmartCartWidget";
import InventoryMatrix from "./dashboard/InventoryMatrix";
import ShieldStatus from "./dashboard/ShieldStatus";
import FloatingActionButton from "./dashboard/FloatingActionButton";
import ConfigurationBanner from "./dashboard/ConfigurationBanner";

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
    <motion.div
      className="min-h-screen bg-kaeva-seattle-slate p-4 sm:p-8"
      variants={dashboardVariants}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <ConfigurationBanner />
        
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <Button
              variant="outline"
              onClick={() => navigate("/admin")}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Admin Dashboard
            </Button>
          </motion.div>
        )}

        <PulseHeader profile={profile} />
        <SmartCartWidget cartItems={lowStockItems} />
        {!isLoading && <InventoryMatrix inventory={inventoryData} />}
        <ShieldStatus profile={profile} />
      </div>

      <FloatingActionButton />
    </motion.div>
  );
};

export default Dashboard;
