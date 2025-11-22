import { motion } from "framer-motion";
import { Refrigerator, Package, Sparkles, PawPrint } from "lucide-react";
import InventoryCard from "./InventoryCard";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

interface InventoryItem {
  name: string;
  fillLevel: number;
  unit: string;
  status: string;
  autoOrdering: boolean;
}

interface InventoryMatrixProps {
  inventory: {
    fridge: (InventoryItem & { status?: string })[];
    pantry: (InventoryItem & { status?: string })[];
    beauty: (InventoryItem & { status?: string })[];
    pets: (InventoryItem & { status?: string })[];
  };
}

const InventoryMatrix = ({ inventory }: InventoryMatrixProps) => {
  const getStatus = (items: any[]): 'good' | 'warning' | 'normal' => {
    const avgFill = items.reduce((acc, item) => acc + item.fillLevel, 0) / items.length;
    if (avgFill >= 60) return 'good';
    if (avgFill <= 30) return 'warning';
    return 'normal';
  };

  return (
    <motion.div
      className="grid grid-cols-2 gap-3"
      variants={{
        show: {
          transition: {
            staggerChildren: 0.15
          }
        }
      }}
      initial="hidden"
      animate="show"
    >
      <InventoryCard
        title="Fridge"
        icon={Refrigerator}
        items={inventory.fridge}
        status={getStatus(inventory.fridge)}
      />
      <InventoryCard
        title="Pantry"
        icon={Package}
        items={inventory.pantry}
        status={getStatus(inventory.pantry)}
      />
      <InventoryCard
        title="Beauty"
        icon={Sparkles}
        items={inventory.beauty}
        status={getStatus(inventory.beauty)}
      />
      <InventoryCard
        title="Pets"
        icon={PawPrint}
        items={inventory.pets}
        status={getStatus(inventory.pets)}
      />
    </motion.div>
  );
};

export default InventoryMatrix;
