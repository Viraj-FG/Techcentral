import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { kaevaEntranceVariants } from "@/hooks/useKaevaMotion";
import { differenceInDays, isPast, parseISO, format } from "date-fns";

interface BeautyInventoryListProps {
  householdId: string;
}

export const BeautyInventoryList = ({ householdId }: BeautyInventoryListProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBeautyItems = async () => {
      if (!householdId) return;

      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .eq('household_id', householdId)
          .eq('category', 'beauty')
          .order('expiry_date', { ascending: true, nullsFirst: false })
          .limit(8);

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error('Error fetching beauty items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBeautyItems();
  }, [householdId]);

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { text: 'No expiry', color: 'text-slate-500' };
    
    const expiry = parseISO(expiryDate);
    const now = new Date();
    
    if (isPast(expiry)) {
      return { text: 'Expired', color: 'text-destructive' };
    }
    
    const days = differenceInDays(expiry, now);
    if (days <= 7) {
      return { text: `${days}d left`, color: 'text-destructive' };
    } else if (days <= 30) {
      return { text: `${days}d left`, color: 'text-primary' };
    }
    
    return { text: format(expiry, 'MMM d'), color: 'text-slate-400' };
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse overflow-hidden">
            <div className="h-16 bg-slate-700/20 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        variants={kaevaEntranceVariants}
        initial="hidden"
        animate="visible"
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-8 text-center overflow-hidden"
      >
        <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-slate-400 mb-4">No beauty products yet</p>
        <Button
          onClick={() => navigate('/inventory')}
          className="gap-2"
        >
          Add Beauty Items
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const expiryStatus = getExpiryStatus(item.expiry_date);
        
        return (
          <motion.div
            key={item.id}
            variants={kaevaEntranceVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.05 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer overflow-hidden"
            onClick={() => navigate('/inventory')}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate">{item.name}</h4>
                {item.brand_name && (
                  <p className="text-xs text-slate-400 truncate">{item.brand_name}</p>
                )}
              </div>
              
              <div className="flex items-center gap-3 ml-3">
                {item.fill_level !== null && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{item.fill_level}%</p>
                  </div>
                )}
                
                <div className="text-right min-w-[60px]">
                  <p className={`text-xs font-medium ${expiryStatus.color}`}>
                    {expiryStatus.text}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      {items.length >= 8 && (
        <Button
          variant="ghost"
          onClick={() => navigate('/inventory')}
          className="w-full text-slate-400 hover:text-white"
        >
          View All Beauty Products
        </Button>
      )}
    </div>
  );
};
