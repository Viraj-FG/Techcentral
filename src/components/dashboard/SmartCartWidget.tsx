import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ProductSelector from "./ProductSelector";

interface InventoryItem {
  id?: string;
  name: string;
  fillLevel: number;
  unit: string;
  autoOrdering: boolean;
  product_image_url?: string | null;
  nutrition_data?: any;
  allergens?: string[] | null;
  dietary_flags?: string[] | null;
  brand_name?: string | null;
}

interface SmartCartWidgetProps {
  cartItems: InventoryItem[];
}

const SmartCartWidget = ({ cartItems }: SmartCartWidgetProps) => {
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichedItems, setEnrichedItems] = useState<InventoryItem[]>(cartItems);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const { toast } = useToast();

  const totalValue = cartItems.reduce((sum, item) => {
    const price = (item.nutrition_data?.price_estimate as number) || 8.99;
    return sum + price;
  }, 0);

  // Enrich products on load
  useEffect(() => {
    const enrichProducts = async () => {
      if (cartItems.length === 0) return;
      
      setEnriching(true);
      const enriched = await Promise.all(
        cartItems.map(async (item) => {
          // Skip if already enriched recently
          if (item.product_image_url && item.nutrition_data) {
            return item;
          }

          try {
            const { data, error } = await supabase.functions.invoke('enrich-product', {
              body: { 
                name: item.name,
                brand: item.brand_name
              }
            });

            if (error) throw error;

            // Update inventory with enriched data
            if (item.id) {
              await supabase
                .from('inventory')
                .update({
                  fatsecret_id: data.fatsecret_id,
                  product_image_url: data.image_url,
                  nutrition_data: data.nutrition,
                  allergens: data.allergens,
                  dietary_flags: data.dietary_flags,
                  brand_name: data.brand,
                  last_enriched_at: new Date().toISOString()
                })
                .eq('id', item.id);
            }

            return {
              ...item,
              product_image_url: data.image_url,
              nutrition_data: data.nutrition,
              allergens: data.allergens,
              dietary_flags: data.dietary_flags,
              brand_name: data.brand
            };
          } catch (err) {
            console.error('Enrichment failed for', item.name, err);
            return item;
          }
        })
      );

      setEnrichedItems(enriched);
      setEnriching(false);
    };

    enrichProducts();
  }, [cartItems]);

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

  const handleVerifyProduct = (item: InventoryItem, alts: any[]) => {
    setSelectedItem(item);
    setAlternatives(alts);
    setSelectorOpen(true);
  };

  const handleProductSelect = async (product: any) => {
    // Update the enriched items
    setEnrichedItems(prev =>
      prev.map(item =>
        item.id === selectedItem.id
          ? {
              ...item,
              product_image_url: product.image_url,
              nutrition_data: product.nutrition,
              allergens: product.allergens,
              dietary_flags: product.dietary_flags,
              brand_name: product.brand
            }
          : item
      )
    );

    // Update database
    if (selectedItem.id) {
      await supabase
        .from('inventory')
        .update({
          fatsecret_id: product.fatsecret_id,
          product_image_url: product.image_url,
          nutrition_data: product.nutrition,
          allergens: product.allergens,
          dietary_flags: product.dietary_flags,
          brand_name: product.brand,
          last_enriched_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);
    }

    toast({
      title: "Product Updated",
      description: `Now using ${product.brand || 'selected'} ${product.name}`
    });
  };

  return (
    <>
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
        
        {enriching && (
          <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
            <Sparkles className="animate-pulse" size={16} />
            <span>Enriching products...</span>
          </div>
        )}
        
        {enrichedItems.length > 0 ? (
          <>
            <p className="text-white/70 text-sm mb-4">
              Next Delivery: <span className="text-white">Friday, Dec 27</span>
            </p>
            
            <div className="space-y-2 mb-4">
              {enrichedItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-3 py-2 border-b border-white/10"
                >
                  {item.product_image_url ? (
                    <img
                      src={item.product_image_url}
                      alt={item.name}
                      className="w-10 h-10 rounded object-cover bg-white/5"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-white/40">
                      📦
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/90 text-sm truncate">{item.name}</span>
                      {item.dietary_flags && item.dietary_flags.length > 0 && (
                        <span className="text-emerald-400 text-xs">🌱</span>
                      )}
                    </div>
                    {item.nutrition_data && (
                      <span className="text-white/50 text-xs font-mono">
                        {item.nutrition_data.calories} cal
                      </span>
                    )}
                  </div>

                  <span className="text-white/50 text-xs">{item.fillLevel}%</span>
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
                `Review Cart ($${totalValue.toFixed(2)})`
              )}
            </Button>
          </>
        ) : (
          <p className="text-white/50 text-sm">All items stocked sufficiently</p>
        )}
      </motion.div>

      {selectedItem && (
        <ProductSelector
          open={selectorOpen}
          onClose={() => setSelectorOpen(false)}
          alternatives={alternatives}
          currentProduct={selectedItem}
          onSelect={handleProductSelect}
        />
      )}
    </>
  );
};

export default SmartCartWidget;
