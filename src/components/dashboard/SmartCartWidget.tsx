import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Loader2, Sparkles, Camera, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ProductSelector from "./ProductSelector";
import StoreSelector from "./StoreSelector";
import Webcam from "react-webcam";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  category?: 'fridge' | 'pantry' | 'beauty' | 'pets';
}

interface SmartCartWidgetProps {
  cartItems: InventoryItem[];
  showDeliveryEstimate?: boolean;
}

const SmartCartWidget = ({ cartItems, showDeliveryEstimate = true }: SmartCartWidgetProps) => {
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichedItems, setEnrichedItems] = useState<InventoryItem[]>(cartItems);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);
  const [hasStore, setHasStore] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const webcamRef = useRef<Webcam>(null);
  const { toast } = useToast();

  // Check if user has a preferred store
  useEffect(() => {
    const checkStore = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_retailer_id')
        .eq('id', user.id)
        .single();
      
      setHasStore(!!profile?.preferred_retailer_id);
    };
    
    checkStore();
  }, []);

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

            // Silently handle errors - just show what we have
            if (error || !data || data.error) {
              console.log('Enrichment skipped for', item.name);
              return item;
            }

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
            // Silently continue if enrichment fails
            console.log('Enrichment failed for', item.name);
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
    // Check if store is selected first
    if (!hasStore) {
      setStoreSelectorOpen(true);
      toast({
        title: "Store Required",
        description: "Please select your preferred Instacart store first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Brand lock for pets and beauty items
      const items = enrichedItems.map(item => {
        const isPetOrBeauty = item.category === 'pets' || item.category === 'beauty';
        return {
          name: isPetOrBeauty && item.brand_name 
            ? `${item.brand_name} ${item.name}` // Brand lock: "Purina Pro Plan Dog Food"
            : item.name,
          brand: item.brand_name,
          quantity: 1,
          unit: item.unit,
          brand_lock: isPetOrBeauty
        };
      });

      const { data, error } = await supabase.functions.invoke('instacart-service', {
        body: { 
          action: 'create_cart',
          userId: user.id,
          items
        }
      });

      if (error) throw error;

      // Open Instacart link in new tab
      window.open(data.productsLink, '_blank');

      toast({
        title: "Cart Ready!",
        description: "Opening Instacart with your dietary preferences applied..."
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

  const handleCameraCapture = async () => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast({
        title: "Camera Error",
        description: "Failed to capture image. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsIdentifying(true);
    
    try {
      console.log('Identifying product from image...');
      
      const { data, error } = await supabase.functions.invoke('identify-product', {
        body: { image: imageSrc }
      });

      if (error) throw error;

      console.log('Product identified:', data);
      
      setCameraOpen(false);
      
      if (data.enriched) {
        // Product was identified and enriched
        toast({
          title: "Product Identified",
          description: `Found: ${data.enriched.name}${data.brand ? ` by ${data.brand}` : ''}`,
        });
        
        // Add to inventory if user confirms
        // For now, just show the data
        console.log('Enriched product data:', data.enriched);
      } else if (data.name) {
        // Product identified but not enriched
        toast({
          title: "Product Identified",
          description: `${data.name} - Confidence: ${Math.round(data.confidence * 100)}%`,
        });
      } else {
        toast({
          title: "Identification Failed",
          description: "Could not identify the product. Please try again with better lighting.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Product identification error:', error);
      toast({
        title: "Error",
        description: "Failed to identify product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsIdentifying(false);
    }
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

  // Calculate dynamic delivery date based on urgency
  const getNextDeliveryInfo = () => {
    if (enrichedItems.length === 0) return null;
    
    // Get most urgent item (lowest fill level)
    const mostUrgent = enrichedItems.reduce((min, item) => 
      item.fillLevel < min.fillLevel ? item : min
    );
    
    // Calculate days until delivery based on urgency
    const daysUntilDelivery = mostUrgent.fillLevel <= 10 ? 1 : 
                              mostUrgent.fillLevel <= 20 ? 2 : 3;
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + daysUntilDelivery);
    
    return {
      date: deliveryDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      urgency: daysUntilDelivery <= 1 ? 'urgent' : 'normal',
      daysUntil: daysUntilDelivery
    };
  };

  const nextDelivery = getNextDeliveryInfo();

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
        
        <div className="flex items-center justify-between mb-4">
          {enriching && (
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Sparkles className="animate-pulse" size={16} />
              <span>Enriching products...</span>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCameraOpen(true)}
            className="gap-2 ml-auto"
          >
            <Camera className="h-4 w-4" />
            Scan Product
          </Button>
        </div>
        
        {enrichedItems.length > 0 ? (
          <>
            {/* Delivery Status Board */}
            {showDeliveryEstimate && nextDelivery && (
              <div className="mb-4 p-4 rounded-lg bg-slate-800/50 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Next Delivery</p>
                    <p className="text-2xl font-light text-white">
                      {nextDelivery.date}
                    </p>
                    <p className="text-xs text-white/50">
                      {nextDelivery.daysUntil} day{nextDelivery.daysUntil !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className={`text-4xl ${nextDelivery.urgency === 'urgent' ? 'animate-pulse' : ''}`}>
                    🚚
                  </div>
                </div>
              </div>
            )}
            
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
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-white/40">📦</div>';
                        }
                      }}
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

            {/* Price Estimate */}
            <div className="flex items-center justify-between mb-4 pt-4 border-t border-white/10">
              <span className="text-sm text-slate-400">Estimated Total</span>
              <span className="text-xl font-light text-white">
                ${totalValue.toFixed(2)}
              </span>
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
                'Review Cart'
              )}
            </Button>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-white/50 text-sm mb-3">No items need restocking</p>
            {!hasStore && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStoreSelectorOpen(true)}
                className="gap-2 mb-2"
              >
                <Store className="h-4 w-4" />
                Select Your Store
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Refresh Inventory
            </Button>
          </div>
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

      <StoreSelector
        open={storeSelectorOpen}
        onClose={() => setStoreSelectorOpen(false)}
        userId={userId}
        onStoreSelected={() => setHasStore(true)}
      />

      <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Product</DialogTitle>
            <DialogDescription>
              Point your camera at the product to identify it automatically
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                videoConstraints={{
                  facingMode: { ideal: "environment" }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCameraCapture}
                disabled={isIdentifying}
                className="flex-1"
              >
                {isIdentifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Identifying...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Capture & Identify
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCameraOpen(false)}
                disabled={isIdentifying}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SmartCartWidget;
