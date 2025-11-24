import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import KaevaAperture from "../KaevaAperture";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Settings, LogOut } from "lucide-react";
import VisionSpotlight from "./VisionSpotlight";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

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

      {/* Unified Glass Capsule Dock - LAYER 50 */}
      <motion.div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...kaevaTransition, delay: 0.5 }}
      >
        <div className="h-[72px] backdrop-blur-2xl bg-slate-900/80 border-2 border-white/10 rounded-full px-6 py-3 shadow-2xl flex items-center justify-between gap-6">
            {/* Settings Button */}
            <motion.button
              onClick={() => navigate('/settings')}
              className="p-3 rounded-full hover:bg-white/10 transition-kaeva active-press"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={kaevaTransition}
              aria-label="Settings"
            >
              <Settings size={24} strokeWidth={1.5} className="text-white" />
            </motion.button>

            {/* Vision Spotlight - Living Aperture (Center) */}
            <motion.button
              onClick={() => setSpotlightOpen(true)}
              className="relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={kaevaTransition}
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 20px rgba(112,224,152,0.3)",
                  "0 0 40px rgba(112,224,152,0.6)",
                  "0 0 20px rgba(112,224,152,0.3)"
                ]
              }}
              style={{
                transition: 'all 3s ease-in-out',
                animationIterationCount: 'infinite'
              }}
              aria-label="Kaeva Aperture"
            >
              <KaevaAperture state="idle" size="lg" />
            </motion.button>

            {/* Logout Button */}
            <motion.button
              onClick={handleLogout}
              className="p-3 rounded-full hover:bg-white/10 transition-kaeva active-press"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={kaevaTransition}
              aria-label="Logout"
            >
              <LogOut size={24} strokeWidth={1.5} className="text-white" />
            </motion.button>
        </div>
      </motion.div>
    </>
  );
};

export default FloatingActionButton;
