import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Store, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Retailer {
  retailer_id: string;
  name: string;
  address: string;
  distance_miles: number;
}

interface StoreSelectorProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onStoreSelected?: (retailer: Retailer) => void;
}

const StoreSelector = ({ open, onClose, userId, onStoreSelected }: StoreSelectorProps) => {
  const [zipCode, setZipCode] = useState("");
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const { toast } = useToast();

  const fetchRetailers = async (zip: string) => {
    if (!zip || zip.length < 5) {
      toast({
        title: "Invalid Zip Code",
        description: "Please enter a valid 5-digit zip code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('instacart-service', {
        body: { 
          action: 'get_nearby_retailers',
          zipCode: zip
        }
      });

      if (error) throw error;

      setRetailers(data.retailers || []);
      
      if (data.retailers.length === 0) {
        toast({
          title: "No Stores Found",
          description: "No Instacart retailers found in this area",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching retailers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch nearby stores. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = async (retailer: Retailer) => {
    setSelecting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_retailer_id: retailer.retailer_id,
          preferred_retailer_name: retailer.name,
          user_zip_code: zipCode,
          last_retailer_refresh: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Store Selected",
        description: `${retailer.name} is now your preferred store`
      });

      onStoreSelected?.(retailer);
      onClose();
    } catch (error) {
      console.error('Error selecting store:', error);
      toast({
        title: "Error",
        description: "Failed to save store preference",
        variant: "destructive"
      });
    } finally {
      setSelecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-900 text-white border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Store className="text-emerald-400" />
            Select Your Store
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose your preferred Instacart retailer for seamless checkout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zip Code Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                type="text"
                placeholder="Enter zip code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                onKeyDown={(e) => e.key === 'Enter' && fetchRetailers(zipCode)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
                maxLength={5}
              />
            </div>
            <Button
              onClick={() => fetchRetailers(zipCode)}
              disabled={loading || zipCode.length < 5}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {/* Retailers List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-12"
                >
                  <Loader2 className="animate-spin text-emerald-400" size={32} />
                </motion.div>
              ) : retailers.length > 0 ? (
                <motion.div
                  key="retailers"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {retailers.map((retailer, index) => (
                    <motion.div
                      key={retailer.retailer_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-lg transition-all cursor-pointer"
                      onClick={() => handleSelectStore(retailer)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            {retailer.name}
                          </h4>
                          <p className="text-sm text-slate-400 mt-0.5">{retailer.address}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400">
                            {retailer.distance_miles.toFixed(1)} mi
                          </span>
                          {selecting ? (
                            <Loader2 className="animate-spin text-emerald-400" size={18} />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                              <Store className="text-emerald-400" size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : zipCode.length === 5 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 text-slate-400"
                >
                  <Store className="mx-auto mb-3 opacity-50" size={48} />
                  <p>No stores found. Try a different zip code.</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoreSelector;
