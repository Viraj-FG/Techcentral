import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { kaevaTransition } from "@/hooks/useKaevaMotion";
import { ELEVENLABS_CONFIG } from "@/config/agent";

const ConfigureAgent = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  
  const handleConfigure = async () => {
    setIsConfiguring(true);
    
    try {
      console.log("Configuring ElevenLabs agent with multi-vertical prompt...");
      
      const { data, error } = await supabase.functions.invoke('configure-elevenlabs-agent', {
        body: { agentId: ELEVENLABS_CONFIG.agentId }
      });

      if (error) {
        throw error;
      }

      console.log("Agent configuration response:", data);

      // Mark agent as configured in database
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('profiles')
          .update({
            agent_configured: true,
            agent_configured_at: new Date().toISOString(),
            agent_last_configured_at: data.configured_at || new Date().toISOString(),
            agent_prompt_version: data.prompt_version || ELEVENLABS_CONFIG.promptVersion
          })
          .eq('id', session.user.id);
      }
      
      setIsConfigured(true);
      toast({
        title: "Success!",
        description: "ElevenLabs agent configured with Food + Beauty + Pets intelligence clusters",
      });
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error("Error configuring agent:", error);
      toast({
        title: "Configuration Error",
        description: error instanceof Error ? error.message : "Failed to configure agent",
        variant: "destructive"
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="min-h-screen bg-kaeva-seattle-slate overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={kaevaTransition}
          className="w-full max-w-md my-8"
        >
        <div className="glass-card p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <motion.div
              animate={isConfiguring ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: isConfiguring ? Infinity : 0, ease: "linear" }}
              className="p-4 rounded-full bg-kaeva-sage/10"
            >
              {isConfigured ? (
                <CheckCircle2 size={48} strokeWidth={1.5} className="text-kaeva-sage" />
              ) : (
                <Settings size={48} strokeWidth={1.5} className="text-kaeva-sage" />
              )}
            </motion.div>

            {/* Title */}
            <div>
              <h1 className="text-display text-2xl text-white mb-2">
                Configure Voice Agent
              </h1>
              <p className="text-body text-white/60">
                Activate the 5 Intelligence Clusters for multi-vertical data collection
              </p>
            </div>

            {/* Features List */}
            <div className="w-full space-y-3 text-left">
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg transition-kaeva active-press">
                <div className="w-2 h-2 rounded-full bg-kaeva-sage mt-1.5" />
                <div>
                  <p className="text-white text-body font-medium">The Palate</p>
                  <p className="text-white/50 text-micro">Food preferences & allergies</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg transition-kaeva active-press">
                <div className="w-2 h-2 rounded-full bg-kaeva-terracotta mt-1.5" />
                <div>
                  <p className="text-white text-body font-medium">The Mirror</p>
                  <p className="text-white/50 text-micro">Skin type & hair type</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg transition-kaeva active-press">
                <div className="w-2 h-2 rounded-full bg-kaeva-electric-sky mt-1.5" />
                <div>
                  <p className="text-white text-body font-medium">The Tribe</p>
                  <p className="text-white/50 text-micro">Household & pet details</p>
                </div>
              </div>
            </div>

            {/* Configure Button */}
            <Button
              onClick={handleConfigure}
              disabled={isConfiguring || isConfigured}
              variant="primary"
              className="w-full py-6 shadow-lg shadow-kaeva-sage/20"
            >
              {isConfiguring ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} strokeWidth={1.5} />
                  <span className="text-micro">Configuring Agent...</span>
                </>
              ) : isConfigured ? (
                <>
                  <CheckCircle2 className="mr-2" size={20} strokeWidth={1.5} />
                  <span className="text-micro">Configured Successfully!</span>
                </>
              ) : (
                <span className="text-micro">Configure Agent</span>
              )}
            </Button>

            {isConfigured && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={kaevaTransition}
                className="text-kaeva-sage text-body"
              >
                Redirecting to home...
              </motion.p>
            )}

            {/* Back Button */}
            {!isConfiguring && !isConfigured && (
              <Button
                onClick={() => navigate('/')}
                variant="glass"
                className="text-white/60 hover:text-white"
              >
                <span className="text-micro">Back to Dashboard</span>
              </Button>
            )}
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default ConfigureAgent;
