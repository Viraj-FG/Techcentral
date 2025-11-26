import { Drawer, DrawerContent, DrawerHeader, DrawerFooter } from '@/components/ui/drawer';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ListChecks, Zap, Sparkles, Activity, ShieldCheck, PawPrint } from 'lucide-react';
import InventorySweepResult from './result-modes/InventorySweepResult';
import ApplianceScanResult from './result-modes/ApplianceScanResult';
import VanitySweepResult from './result-modes/VanitySweepResult';
import NutritionTrackResult from './result-modes/NutritionTrackResult';
import ProductAnalysisResult from './result-modes/ProductAnalysisResult';
import PetIdResult from './result-modes/PetIdResult';
import { ScannerSummaryCard } from './ScannerSummaryCard';

type Intent = 'INVENTORY_SWEEP' | 'APPLIANCE_SCAN' | 'VANITY_SWEEP' | 'NUTRITION_TRACK' | 'PRODUCT_ANALYSIS' | 'PET_ID';

interface DetectedItem {
  name: string;
  brand?: string;
  category: 'fridge' | 'pantry' | 'beauty' | 'pets' | 'appliance' | 'meal';
  confidence: number;
  product_image_url?: string;
  metadata?: {
    barcode?: string;
    pao_symbol?: string;
    species?: string;
    breed?: string;
    size?: string;
    estimated_shelf_life_days?: number;
  };
}

export interface Recipe {
  name: string;
  cookingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  requiredAppliances: string[];
  instructions: string[];
  calories: number;
}

export interface AllergenWarning {
  allergen: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface DeceptionFlag {
  type: 'misleading_name' | 'hidden_ingredients' | 'false_claims';
  detected: string;
  actualTerm: string;
  reason: string;
  severity: 'warning' | 'critical';
}

export interface ProductTruthData {
  name: string;
  brand?: string;
  image_url?: string;
  truthScore: number;
  allergenWarnings: AllergenWarning[];
  dietaryConflicts: string[];
  deceptionFlags: DeceptionFlag[];
  betterAlternative?: {
    name: string;
    reason: string;
    instacartLink?: string;
  };
}

export interface PetData {
  species: string;
  breed?: string;
  size?: string;
  detectedImage?: string;
}

export interface ScanResultsProps {
  isOpen: boolean;
  onClose: () => void;
  intent: Intent;
  confidence: number;
  items: DetectedItem[];
  subtype?: 'raw' | 'cooked';
  imageUrl?: string;
  additionalData?: {
    macros?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
    };
    totals?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
    };
    recipes?: Recipe[];
    unlockedRecipes?: Recipe[];
    productTruth?: ProductTruthData;
    petData?: PetData;
  };
  onConfirm: () => void;
}

const ScanResults = ({
  isOpen,
  onClose,
  intent,
  confidence,
  items,
  subtype,
  imageUrl,
  additionalData,
  onConfirm
}: ScanResultsProps) => {
  
  const renderIcon = () => {
    const iconProps = { className: "w-12 h-12", strokeWidth: 1.5 };
    const icons = {
      INVENTORY_SWEEP: <ListChecks {...iconProps} className="text-blue-400" />,
      APPLIANCE_SCAN: <Zap {...iconProps} className="text-orange-400" />,
      VANITY_SWEEP: <Sparkles {...iconProps} className="text-pink-400" />,
      NUTRITION_TRACK: <Activity {...iconProps} className="text-green-400" />,
      PRODUCT_ANALYSIS: <ShieldCheck {...iconProps} className="text-purple-400" />,
      PET_ID: <PawPrint {...iconProps} className="text-emerald-400" />
    };
    return icons[intent];
  };

  const renderTitle = () => {
    const titles = {
      INVENTORY_SWEEP: 'Pantry Scan Complete',
      APPLIANCE_SCAN: 'Kitchen Upgrade Detected',
      VANITY_SWEEP: 'Vanity Audit',
      NUTRITION_TRACK: subtype === 'raw' ? 'Recipe Suggestions' : 'Meal Analysis',
      PRODUCT_ANALYSIS: 'Product Verdict',
      PET_ID: 'New Friend Detected'
    };
    return titles[intent];
  };

  const calculateSummary = () => {
    const expiringSoon = items.filter(item => {
      const days = item.metadata?.estimated_shelf_life_days || 30;
      return days < 14 && days >= 0;
    }).length;

    const allergenAlerts = items.filter(item => 
      item.metadata && 'allergens' in item.metadata
    ).length;

    const lowStock = items.filter(item => 
      item.metadata && 'fill_level' in item.metadata && 
      typeof item.metadata.fill_level === 'number' && 
      item.metadata.fill_level <= 20
    ).length;

    return {
      totalItems: items.length,
      expiringSoon,
      allergenAlerts,
      lowStock
    };
  };

  const renderContent = () => {
    const summary = calculateSummary();
    
    switch (intent) {
      case 'INVENTORY_SWEEP':
        return (
          <>
            <ScannerSummaryCard summary={summary} />
            <div className="mt-4">
              <InventorySweepResult items={items} />
            </div>
          </>
        );
      case 'APPLIANCE_SCAN':
        return <ApplianceScanResult items={items} unlockedRecipes={additionalData?.unlockedRecipes} />;
      case 'VANITY_SWEEP':
        return (
          <>
            <ScannerSummaryCard summary={summary} />
            <div className="mt-4">
              <VanitySweepResult items={items} />
            </div>
          </>
        );
      case 'NUTRITION_TRACK':
        return <NutritionTrackResult 
          subtype={subtype} 
          items={items} 
          macros={additionalData?.totals || additionalData?.macros}
          recipes={additionalData?.recipes}
          imageUrl={imageUrl}
          onMealLogged={onConfirm}
        />;
      case 'PRODUCT_ANALYSIS':
        return <ProductAnalysisResult data={additionalData?.productTruth} />;
      case 'PET_ID':
        return <PetIdResult data={additionalData?.petData} />;
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh] bg-slate-900/90 backdrop-blur-xl border-t-2 border-primary/30">
        {/* Glow effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        <DrawerHeader className="border-b border-slate-800/50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              {renderIcon()}
              <motion.div
                className="absolute inset-0 rounded-full blur-xl opacity-50"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.3, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ background: 'currentColor' }}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{renderTitle()}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-400">Confidence:</span>
                <div className="flex-1 max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-secondary to-secondary/70"
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span className="text-sm font-semibold text-secondary">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        </DrawerHeader>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={intent}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Fixed action button */}
        <DrawerFooter className="border-t border-slate-800/50">
          <Button
            onClick={onConfirm}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-secondary to-secondary/80 hover:opacity-90"
          >
            Confirm & Continue
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ScanResults;
