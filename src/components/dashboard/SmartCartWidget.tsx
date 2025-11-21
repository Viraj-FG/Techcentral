import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2 } from "lucide-react";
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
      className="glass-card p-6 border-2 border-kaeva-sage/30"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-kaeva-sage/20">
            <ShoppingBag className="text-kaeva-sage" size={32} />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-kaeva-slate-200">
              Smart Cart
            </h3>
            <p className="text-kaeva-slate-400">
              Next Delivery: Tuesday, 5 PM
            </p>
            <p className="text-sm text-kaeva-sage">
              ({cartItems.length} Items Queued)
            </p>
          </div>
        </div>

        <Button
          onClick={handleReviewCart}
          disabled={loading || cartItems.length === 0}
          className="bg-kaeva-sage hover:bg-kaeva-sage/80 text-kaeva-void font-semibold px-6 py-3 shadow-[0_0_20px_rgba(112,224,152,0.3)]"
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
      </div>
    </motion.div>
  );
};

export default SmartCartWidget;
