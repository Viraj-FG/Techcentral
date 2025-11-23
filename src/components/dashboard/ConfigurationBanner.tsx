import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ELEVENLABS_CONFIG } from "@/config/agent";

const ConfigurationBanner = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data } = await supabase
          .from('profiles')
          .select('agent_configured, agent_prompt_version')
          .eq('id', session.user.id)
          .single();

        setProfile(data);
      } catch (error) {
        console.error("Error checking configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConfiguration();
  }, []);

  // Don't show if loading
  if (isLoading) return null;

  const isConfigured = profile?.agent_configured;
  const isUpToDate = profile?.agent_prompt_version === ELEVENLABS_CONFIG.onboarding.promptVersion ||
                     profile?.agent_prompt_version === ELEVENLABS_CONFIG.assistant.promptVersion;

  // Don't show if configured and up to date
  if (isConfigured && isUpToDate) {
    return null;
  }

  // Show warning if outdated
  if (isConfigured && !isUpToDate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-xl bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border border-yellow-400/30 rounded-xl p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-yellow-400/20">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-light tracking-wider text-white mb-1">
                Agent Update Available
              </h3>
              <p className="text-white/70 text-sm">
                Your agent is using prompt version {profile.agent_prompt_version}. Update to latest versions (Onboarding: {ELEVENLABS_CONFIG.onboarding.promptVersion}, Assistant: {ELEVENLABS_CONFIG.assistant.promptVersion}) for the latest features.
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate('/configure-agent')}
            className="bg-yellow-400 hover:bg-yellow-500 text-kaeva-void font-semibold shadow-[0_0_20px_rgba(234,179,8,0.3)] whitespace-nowrap"
          >
            Update Agent
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Show configuration banner if not configured
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
              Voice Assistant Configuration Required
            </h3>
            <p className="text-white/70 text-sm">
              Activate the 5 Intelligence Clusters for Food, Beauty, and Pets data collection
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
