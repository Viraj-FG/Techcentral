import { motion } from "framer-motion";
import KaevaAperture from "../KaevaAperture";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Settings, LogOut } from "lucide-react";

const FloatingActionButton = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "Come back soon!",
    });
    navigate('/auth');
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4">
      {/* Logout Button */}
      <motion.button
        className="p-4 rounded-full bg-kaeva-void/80 backdrop-blur-sm border-2 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", delay: 0.7 }}
        onClick={handleLogout}
      >
        <LogOut className="w-6 h-6 text-white" />
      </motion.button>

      {/* Settings Button */}
      <motion.button
        className="p-4 rounded-full bg-kaeva-void/80 backdrop-blur-sm border-2 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", delay: 0.8 }}
        onClick={() => navigate('/settings')}
      >
        <Settings className="w-6 h-6 text-white" />
      </motion.button>

      {/* Kaeva Button */}
      <motion.button
        className="p-4 rounded-full bg-kaeva-void/80 backdrop-blur-sm border-2 border-kaeva-sage/50 shadow-[0_0_30px_rgba(112,224,152,0.3)]"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", delay: 0.9 }}
        onClick={() => {
          toast({
            title: "Coming Soon",
            description: "Voice interaction feature in development"
          });
        }}
      >
        <KaevaAperture state="idle" size="sm" />
      </motion.button>
    </div>
  );
};

export default FloatingActionButton;
