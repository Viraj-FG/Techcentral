import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { kaevaEntranceVariants } from "@/hooks/useKaevaMotion";

interface PetSuppliesStatusProps {
  householdId: string;
}

export const PetSuppliesStatus = ({ householdId }: PetSuppliesStatusProps) => {
  const [supplies, setSupplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPetSupplies = async () => {
      if (!householdId) return;

      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .eq('household_id', householdId)
          .eq('category', 'pets')
          .order('fill_level', { ascending: true, nullsFirst: false })
          .limit(6);

        if (error) throw error;
        setSupplies(data || []);
      } catch (error) {
        console.error('Error fetching pet supplies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPetSupplies();
  }, [householdId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse overflow-hidden">
            <div className="h-16 bg-slate-700/20 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (supplies.length === 0) {
    return (
      <motion.div
        variants={kaevaEntranceVariants}
        initial="hidden"
        animate="visible"
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-8 text-center overflow-hidden"
      >
        <Package className="w-12 h-12 text-secondary/30 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-slate-400 mb-4">No pet supplies tracked yet</p>
        <Button
          onClick={() => navigate('/inventory')}
          className="gap-2"
        >
          Add Pet Supplies
        </Button>
      </motion.div>
    );
  }

  const lowStockItems = supplies.filter(item => (item.fill_level || 0) <= 20);

  return (
    <div className="space-y-4">
      {lowStockItems.length > 0 && (
        <motion.div
          variants={kaevaEntranceVariants}
          initial="hidden"
          animate="visible"
          className="backdrop-blur-xl bg-destructive/10 border border-destructive/20 rounded-xl p-4 overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="text-destructive" size={20} strokeWidth={1.5} />
            <p className="text-sm font-medium text-destructive">
              {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'} running low
            </p>
          </div>
          
          <div className="space-y-2">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-white truncate">{item.name}</span>
                <span className="text-destructive font-medium ml-2">{item.fill_level}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {supplies.slice(0, 4).map((item, index) => {
          const isLowStock = (item.fill_level || 0) <= 20;
          
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
                
                <div className="flex items-center gap-2 ml-3">
                  {isLowStock && (
                    <AlertTriangle className="text-destructive" size={16} strokeWidth={1.5} />
                  )}
                  {item.fill_level !== null && (
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isLowStock ? 'text-destructive' : 'text-white'}`}>
                        {item.fill_level}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {supplies.length > 4 && (
        <Button
          variant="ghost"
          onClick={() => navigate('/inventory')}
          className="w-full text-slate-400 hover:text-white"
        >
          View All Pet Supplies
        </Button>
      )}
    </div>
  );
};
