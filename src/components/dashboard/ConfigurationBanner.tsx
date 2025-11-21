import { motion } from "framer-motion";
import { Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ConfigurationBanner = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="backdrop-blur-xl bg-gradient-to-r from-emerald-400/10 to-sky-400/10 border border-emerald-400/30 rounded-xl p-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="p-3 rounded-lg bg-emerald-400/20"
          >
            <Settings className="w-6 h-6 text-emerald-400" />
          </motion.div>
          
          <div>
            <h3 className="text-lg font-light tracking-wider text-white mb-1">
              Multi-Vertical Configuration Available
            </h3>
            <p className="text-white/70 text-sm">
              Activate the new 5 Intelligence Clusters for Food, Beauty, and Pets data collection
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-emerald-400/10 border border-emerald-400/30 rounded text-emerald-400 text-xs">
                The Palate (Food)
              </span>
              <span className="px-2 py-1 bg-orange-400/10 border border-orange-400/30 rounded text-orange-400 text-xs">
                The Mirror (Beauty)
              </span>
              <span className="px-2 py-1 bg-sky-400/10 border border-sky-400/30 rounded text-sky-400 text-xs">
                The Tribe (Pets)
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => navigate('/configure-agent')}
          className="bg-emerald-400 hover:bg-emerald-500 text-kaeva-void font-semibold shadow-[0_0_20px_rgba(112,224,152,0.3)] whitespace-nowrap"
        >
          Configure Agent
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default ConfigurationBanner;
