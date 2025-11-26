import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { kaevaEntranceVariants } from "@/hooks/useKaevaMotion";
import { differenceInDays, isPast, parseISO } from "date-fns";

interface BeautySummaryCardProps {
  householdId: string;
}

export const BeautySummaryCard = ({ householdId }: BeautySummaryCardProps) => {
  const [stats, setStats] = useState({
    total: 0,
    expiring: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBeautyStats = async () => {
      if (!householdId) return;

      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .eq('household_id', householdId)
          .eq('category', 'beauty');

        if (error) throw error;

        const now = new Date();
        let expiringCount = 0;
        let expiredCount = 0;

        data?.forEach(item => {
          if (item.expiry_date) {
            const expiryDate = parseISO(item.expiry_date);
            if (isPast(expiryDate)) {
              expiredCount++;
            } else if (differenceInDays(expiryDate, now) <= 30) {
              expiringCount++;
            }
          }
        });

        setStats({
          total: data?.length || 0,
          expiring: expiringCount,
          expired: expiredCount,
        });
      } catch (error) {
        console.error('Error fetching beauty stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBeautyStats();
  }, [householdId]);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse overflow-hidden">
        <div className="h-24 bg-slate-700/20 rounded"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={kaevaEntranceVariants}
      initial="hidden"
      animate="visible"
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="text-primary" size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Beauty Station</h3>
            <p className="text-sm text-slate-400">{stats.total} Products</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <Package className="w-5 h-5 text-slate-400 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
        </div>

        <div className="text-center">
          <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-2xl font-bold text-destructive">{stats.expiring}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Expiring</p>
        </div>

        <div className="text-center">
          <AlertTriangle className="w-5 h-5 text-destructive/60 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-2xl font-bold text-destructive/60">{stats.expired}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Expired</p>
        </div>
      </div>
    </motion.div>
  );
};
