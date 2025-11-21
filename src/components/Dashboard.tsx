import { motion } from "framer-motion";
import PulseHeader from "./dashboard/PulseHeader";
import SmartCartWidget from "./dashboard/SmartCartWidget";
import InventoryMatrix from "./dashboard/InventoryMatrix";
import ShieldStatus from "./dashboard/ShieldStatus";
import FloatingActionButton from "./dashboard/FloatingActionButton";

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
  // Get all items that need auto-ordering (fillLevel < 20%)
  const lowStockItems = Object.values(mockInventoryData)
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
      className="min-h-screen bg-kaeva-void p-4 sm:p-8"
      variants={dashboardVariants}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <PulseHeader profile={profile} />
        <SmartCartWidget cartItems={lowStockItems} />
        <InventoryMatrix inventory={mockInventoryData} />
        <ShieldStatus profile={profile} />
      </div>

      <FloatingActionButton />
    </motion.div>
  );
};

export default Dashboard;
