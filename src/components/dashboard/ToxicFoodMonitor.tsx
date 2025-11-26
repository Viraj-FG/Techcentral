import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { kaevaEntranceVariants } from "@/hooks/useKaevaMotion";

interface ToxicFoodMonitorProps {
  userId: string;
}

export const ToxicFoodMonitor = ({ userId }: ToxicFoodMonitorProps) => {
  const [stats, setStats] = useState({
    totalPets: 0,
    protectedPets: 0,
    scansToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToxicityStats = async () => {
      if (!userId) return;

      try {
        const { data: pets, error } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;

        const protectedCount = pets?.filter(pet => pet.toxic_flags_enabled).length || 0;

        setStats({
          totalPets: pets?.length || 0,
          protectedPets: protectedCount,
          scansToday: 0, // This would need scan tracking in the future
        });
      } catch (error) {
        console.error('Error fetching toxicity stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchToxicityStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse overflow-hidden">
        <div className="h-32 bg-slate-700/20 rounded"></div>
      </div>
    );
  }

  const allProtected = stats.totalPets > 0 && stats.protectedPets === stats.totalPets;

  return (
    <motion.div
      variants={kaevaEntranceVariants}
      initial="hidden"
      animate="visible"
      className={`backdrop-blur-xl border rounded-xl p-6 overflow-hidden ${
        allProtected
          ? 'bg-secondary/10 border-secondary/20'
          : 'bg-destructive/10 border-destructive/20'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            allProtected ? 'bg-secondary/20' : 'bg-destructive/20'
          }`}>
            {allProtected ? (
              <Shield className="text-secondary" size={24} strokeWidth={1.5} />
            ) : (
              <AlertTriangle className="text-destructive" size={24} strokeWidth={1.5} />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Toxic Food Monitor</h3>
            <p className="text-sm text-slate-400">
              {allProtected ? 'All pets protected' : 'Protection status'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <span className="text-sm text-slate-400">Protected Pets</span>
          <div className="flex items-center gap-2">
            {allProtected && <CheckCircle className="text-secondary" size={16} strokeWidth={1.5} />}
            <span className={`text-lg font-bold ${allProtected ? 'text-secondary' : 'text-white'}`}>
              {stats.protectedPets}/{stats.totalPets}
            </span>
          </div>
        </div>

        {!allProtected && stats.totalPets > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
          >
            <p className="text-xs text-destructive">
              Enable toxic food monitoring for all pets to ensure their safety
            </p>
          </motion.div>
        )}

        {stats.totalPets === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-slate-400">
              Add pets to your household to enable safety monitoring
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
