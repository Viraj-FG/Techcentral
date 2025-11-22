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
    fridge: InventoryItem[];
    pantry: InventoryItem[];
    beauty: InventoryItem[];
    pets: InventoryItem[];
  };
}

const InventoryMatrix = ({ inventory }: InventoryMatrixProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={kaevaTransition}
    >
      <h2 className="text-display text-2xl text-white mb-4">
        INVENTORY STATUS
      </h2>

    <motion.div
      className="grid grid-cols-2 gap-4"
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
        />
        <InventoryCard
          title="Pantry"
          icon={Package}
          items={inventory.pantry}
        />
        <InventoryCard
          title="Beauty"
          icon={Sparkles}
          items={inventory.beauty}
        />
        <InventoryCard
          title="Pets"
          icon={PawPrint}
          items={inventory.pets}
        />
      </motion.div>
    </motion.div>
  );
};

export default InventoryMatrix;
