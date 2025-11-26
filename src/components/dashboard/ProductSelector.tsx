import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Product {
  fatsecret_id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  allergens: string[];
  dietary_flags: string[];
  serving_size: string | null;
}

interface ProductSelectorProps {
  open: boolean;
  onClose: () => void;
  alternatives: Product[];
  currentProduct: Product;
  onSelect: (product: Product) => void;
}

const ProductSelector = ({
  open,
  onClose,
  alternatives,
  currentProduct,
  onSelect,
}: ProductSelectorProps) => {
  const [selected, setSelected] = useState<string>(currentProduct.fatsecret_id);
  const [loading, setLoading] = useState(false);

  const allProducts = [currentProduct, ...alternatives];

  const handleConfirm = async () => {
    setLoading(true);
    const product = allProducts.find(p => p.fatsecret_id === selected);
    if (product) {
      await onSelect(product);
    }
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl text-white font-light tracking-wider">
            Select Correct Product
          </DialogTitle>
          <DialogDescription className="text-white/60">
            We found multiple matches. Choose the one you want to order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto scroll-smooth pr-2">
          {allProducts.map((product) => (
            <motion.div
              key={product.fatsecret_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                relative p-4 rounded-lg border cursor-pointer transition-all
                ${selected === product.fatsecret_id
                  ? 'border-emerald-400 bg-emerald-400/5'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
                }
              `}
              onClick={() => setSelected(product.fatsecret_id)}
            >
              <div className="flex items-start gap-4">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover bg-white/5"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center">
                    <span className="text-white/40 text-2xl">📦</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">
                    {product.name}
                  </h4>
                  {product.brand && (
                    <p className="text-white/60 text-sm">{product.brand}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/70 font-mono">
                    <span>{product.nutrition.calories} cal</span>
                    <span>{product.nutrition.protein}g protein</span>
                    <span>{product.nutrition.carbs}g carbs</span>
                    <span>{product.nutrition.fat}g fat</span>
                  </div>

                  {product.dietary_flags.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {product.dietary_flags.map((flag) => (
                        <span
                          key={flag}
                          className="text-xs px-2 py-1 rounded bg-emerald-400/10 text-emerald-400"
                        >
                          {flag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {selected === product.fatsecret_id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center"
                    >
                      <Check size={14} className="text-background" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/10 text-white hover:bg-white/5"
            disabled={loading}
          >
            <X className="mr-2" size={16} />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-emerald-400 hover:bg-emerald-500 text-background"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />
                Updating...
              </>
            ) : (
              <>
                <Check className="mr-2" size={16} />
                Confirm Selection
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelector;
