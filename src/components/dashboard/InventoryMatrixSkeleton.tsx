import { motion } from "framer-motion";
import InventoryCardSkeleton from "./InventoryCardSkeleton";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

const InventoryMatrixSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={kaevaTransition}
    >
      <h2 className="text-display text-2xl text-white mb-4">
        INVENTORY STATUS
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <InventoryCardSkeleton key={i} />
        ))}
      </div>
    </motion.div>
  );
};

export default InventoryMatrixSkeleton;
