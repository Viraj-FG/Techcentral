import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const WelcomeBanner = () => {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Check if user has dismissed the banner
        const dismissed = localStorage.getItem("kaeva_welcome_banner_dismissed");
        if (dismissed === "true") {
          setIsDismissed(true);
          setIsLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();

        // Show banner if onboarding is not completed
        if (profile && !profile.onboarding_completed) {
          setShowBanner(true);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("kaeva_welcome_banner_dismissed", "true");
    setIsDismissed(true);
    setShowBanner(false);
  };

  const handleCompleteProfile = () => {
    // Navigate to Settings page for manual profile editing
    navigate('/settings');
  };

  if (isLoading || isDismissed || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="relative backdrop-blur-xl bg-gradient-to-r from-violet-400/10 to-purple-400/10 border border-violet-400/30 rounded-xl p-6 overflow-hidden"
      >
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          aria-label="Dismiss welcome banner"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-8">
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="p-3 rounded-lg bg-violet-400/20"
          >
            <Sparkles className="w-6 h-6 text-violet-400" />
          </motion.div>
          
          <div className="flex-1">
            <h3 className="text-lg font-light tracking-wider text-white mb-1 truncate">
              Welcome to Kaeva Command Center!
            </h3>
            <p className="text-white/70 text-sm mb-3">
              You skipped onboarding. Complete your profile to unlock personalized recommendations, dietary tracking, and household management features.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleCompleteProfile}
                size="sm"
                className="bg-violet-400 hover:bg-violet-500 text-background font-medium"
              >
                <User className="w-4 h-4 mr-2" />
                Complete Profile Later
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeBanner;
