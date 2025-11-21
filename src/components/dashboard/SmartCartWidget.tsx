import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InventoryItem {
  name: string;
  fillLevel: number;
  unit: string;
  autoOrdering: boolean;
}

interface SmartCartWidgetProps {
  cartItems: InventoryItem[];
}

const SmartCartWidget = ({ cartItems }: SmartCartWidgetProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const totalValue = cartItems.length * 10; // Mock calculation

  const handleReviewCart = async () => {
    setLoading(true);

    try {
      const items = cartItems.map(item => ({
        name: item.name,
        quantity: 1,
        unit: item.unit
      }));

      const { data, error } = await supabase.functions.invoke('instacart-create-cart', {
        body: { items }
      });

      if (error) throw error;

      // Open Instacart link in new tab
      window.open(data.productsLink, '_blank');

      toast({
        title: "Cart Ready!",
        description: "Opening Instacart shopping list..."
      });
    } catch (error) {
      console.error('Error creating cart:', error);
      toast({
        title: "Error",
        description: "Failed to create shopping cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-400/10">
            <ShoppingCart className="text-emerald-400" size={24} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-light tracking-wider text-white">Smart Cart</h2>
        </div>
        <span className="text-emerald-400 text-sm tracking-widest">AUTO-ORDERING</span>
      </div>
      
      {cartItems.length > 0 ? (
        <>
          <p className="text-white/70 text-sm mb-4">
            Next Delivery: <span className="text-white">Friday, Dec 27</span>
          </p>
          
          <div className="space-y-2 mb-4">
            {cartItems.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between py-2 border-b border-white/10"
              >
                <span className="text-white/90 text-sm">{item.name}</span>
                <span className="text-white/50 text-xs">{item.fillLevel}% remaining</span>
              </motion.div>
            ))}
          </div>

          <Button
            onClick={handleReviewCart}
            disabled={loading}
            className="w-full bg-emerald-400 hover:bg-emerald-500 text-kaeva-void font-semibold shadow-[0_0_20px_rgba(112,224,152,0.3)]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Generating...
              </>
            ) : (
              `Review Cart ($${totalValue})`
            )}
          </Button>
        </>
      ) : (
        <p className="text-white/50 text-sm">All items stocked sufficiently</p>
      )}
    </motion.div>
  );
};

export default SmartCartWidget;
