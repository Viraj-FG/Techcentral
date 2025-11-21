import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import KaevaAperture from "../KaevaAperture";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Settings, LogOut } from "lucide-react";
import VisionSpotlight from "./VisionSpotlight";

const FloatingActionButton = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "Come back soon!",
    });
    navigate('/auth');
  };

  // Keyboard shortcut: Cmd/Ctrl + Shift + V
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'v') {
        e.preventDefault();
        setSpotlightOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <VisionSpotlight 
        isOpen={spotlightOpen} 
        onClose={() => setSpotlightOpen(false)}
        onItemsAdded={() => window.location.reload()}
      />

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

        {/* Vision Spotlight Trigger - Living Aperture */}
        <motion.button
          className="p-4 rounded-full bg-kaeva-void/80 backdrop-blur-sm border-2 border-kaeva-sage/50 shadow-[0_0_30px_rgba(112,224,152,0.3)] group relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 0 30px rgba(112,224,152,0.3)",
              "0 0 50px rgba(112,224,152,0.6)",
              "0 0 30px rgba(112,224,152,0.3)"
            ]
          }}
          transition={{ 
            y: { type: "spring", delay: 0.9 },
            opacity: { type: "spring", delay: 0.9 },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
          onClick={() => setSpotlightOpen(true)}
        >
          <KaevaAperture state="idle" size="sm" />
          <div className="absolute inset-0 rounded-full bg-kaeva-sage/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
        </motion.button>
      </div>
    </>
  );
};

export default FloatingActionButton;
