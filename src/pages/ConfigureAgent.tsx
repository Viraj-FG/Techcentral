import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ConfigureAgent = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  
  const AGENT_ID = "agent_0501kakwnx5rffaby5px9y1pskkb";

  const handleConfigure = async () => {
    setIsConfiguring(true);
    
    try {
      console.log("Configuring ElevenLabs agent with multi-vertical prompt...");
      
      const { data, error } = await supabase.functions.invoke('configure-elevenlabs-agent', {
        body: { agentId: AGENT_ID }
      });

      if (error) {
        throw error;
      }

      console.log("Agent configuration response:", data);
      
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
    <div className="min-h-screen bg-kaeva-void flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <motion.div
              animate={isConfiguring ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: isConfiguring ? Infinity : 0, ease: "linear" }}
              className="p-4 rounded-full bg-emerald-400/10"
            >
              {isConfigured ? (
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              ) : (
                <Settings className="w-12 h-12 text-emerald-400" />
              )}
            </motion.div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-light tracking-wider text-white mb-2">
                Configure Voice Agent
              </h1>
              <p className="text-white/60 text-sm">
                Activate the 5 Intelligence Clusters for multi-vertical data collection
              </p>
            </div>

            {/* Features List */}
            <div className="w-full space-y-3 text-left">
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5" />
                <div>
                  <p className="text-white text-sm font-medium">The Palate</p>
                  <p className="text-white/50 text-xs">Food preferences & allergies</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5" />
                <div>
                  <p className="text-white text-sm font-medium">The Mirror</p>
                  <p className="text-white/50 text-xs">Skin type & hair type</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-sky-400 mt-1.5" />
                <div>
                  <p className="text-white text-sm font-medium">The Tribe</p>
                  <p className="text-white/50 text-xs">Household & pet details</p>
                </div>
              </div>
            </div>

            {/* Configure Button */}
            <Button
              onClick={handleConfigure}
              disabled={isConfiguring || isConfigured}
              className="w-full bg-emerald-400 hover:bg-emerald-500 text-kaeva-void font-semibold py-6 shadow-[0_0_20px_rgba(112,224,152,0.3)]"
            >
              {isConfiguring ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Configuring Agent...
                </>
              ) : isConfigured ? (
                <>
                  <CheckCircle2 className="mr-2" size={18} />
                  Configured Successfully!
                </>
              ) : (
                "Configure Agent"
              )}
            </Button>

            {isConfigured && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-emerald-400 text-sm"
              >
                Redirecting to home...
              </motion.p>
            )}

            {/* Back Button */}
            {!isConfiguring && !isConfigured && (
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="text-white/60 hover:text-white"
              >
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfigureAgent;
