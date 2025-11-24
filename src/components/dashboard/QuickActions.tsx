import { motion } from "framer-motion";
import { Scan, ShoppingCart, ChefHat, Home, Settings, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  { icon: Scan, label: "Scan", path: "/inventory", color: "bg-blue-500/20 text-blue-400" },
  { icon: ShoppingCart, label: "Shop", path: "/inventory", color: "bg-green-500/20 text-green-400" },
  { icon: ChefHat, label: "Cook", path: "/recipes", color: "bg-orange-500/20 text-orange-400" },
  { icon: Home, label: "Home", path: "/household", color: "bg-purple-500/20 text-purple-400" },
  { icon: Zap, label: "Actions", path: "/admin", color: "bg-yellow-500/20 text-yellow-400" },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-auto pb-4 pt-2 no-scrollbar">
      <div className="flex gap-4 px-1 min-w-max">
        {actions.map((action, index) => (
          <motion.button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 min-w-[72px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`p-4 rounded-full ${action.color} backdrop-blur-sm border border-white/5`}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-400">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
