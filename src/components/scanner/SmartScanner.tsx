import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Video, StopCircle, Loader2, PackageOpen, ChefHat, Sparkles, Utensils, ScanLine, PawPrint, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ScanResults, { type ScanResultsProps } from './ScanResults';

type Intent = 'INVENTORY_SWEEP' | 'APPLIANCE_SCAN' | 'VANITY_SWEEP' | 'NUTRITION_TRACK' | 'PRODUCT_ANALYSIS' | 'PET_ID' | 'EMPTY_PACKAGE';

interface DetectedItem {
  name: string;
  brand?: string;
  category: 'fridge' | 'pantry' | 'beauty' | 'pets' | 'appliance' | 'meal';
  confidence: number;
  metadata?: {
    barcode?: string;
    pao_symbol?: string;
    species?: string;
    breed?: string;
    size?: string;
    estimated_shelf_life_days?: number;
  };
}

interface IntentResponse {
  intent: Intent;
  confidence: number;
  subtype?: 'raw' | 'cooked';
  items: DetectedItem[];
  suggestion: string;
}

interface SmartScannerProps {
  userId: string;
  onClose: () => void;
  onItemsAdded?: () => void;
  isOpen?: boolean;
  onSocialImport?: () => void;
}

const SmartScanner = ({ userId, onClose, onItemsAdded, isOpen, onSocialImport }: SmartScannerProps) => {
  if (!isOpen) return null;
  const webcamRef = useRef<Webcam>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [detectedIntent, setDetectedIntent] = useState<Intent | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoFrames, setVideoFrames] = useState<string[]>([]);
  const [resultData, setResultData] = useState<Omit<ScanResultsProps, 'isOpen' | 'onClose'> | null>(null);

  const getMealType = (hour: number): string => {
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 19) return 'snack';
    return 'dinner';
  };

  const captureAndAnalyze = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      toast.error('Failed to capture image');
      return;
    }

    setIsScanning(true);
    try {
      // Call detect-intent edge function
      const { data, error } = await supabase.functions.invoke('detect-intent', {
        body: { image: imageSrc }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error, {
          description: data.suggestion
        });
        setIsScanning(false);
        return;
      }

      const intentData: IntentResponse = data;
      setDetectedIntent(intentData.intent);
      setConfidence(intentData.confidence);
      setDetectedItems(intentData.items);

      // Route to appropriate handler
      await handleIntent(intentData, imageSrc);

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze image');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleIntent = async (intentData: IntentResponse, image: string) => {
    switch (intentData.intent) {
      case 'INVENTORY_SWEEP':
        await handleInventorySweep(intentData.items);
        break;
      case 'APPLIANCE_SCAN':
        await handleApplianceScan(intentData.items);
        break;
      case 'VANITY_SWEEP':
        await handleVanitySweep(intentData.items);
        break;
      case 'NUTRITION_TRACK':
        await handleNutritionTrack(intentData.items, intentData.subtype || 'cooked', image);
        break;
      case 'PRODUCT_ANALYSIS':
        await handleProductAnalysis(intentData.items[0]);
        break;
      case 'PET_ID':
        await handlePetId(intentData.items[0]);
        break;
      case 'EMPTY_PACKAGE':
        await handleEmptyPackage(intentData.items);
        break;
    }
  };

  const handleInventorySweep = async (items: DetectedItem[]) => {
    // Filter out non-inventory categories
    const inventoryItems = items.filter(item => 
      item.category === 'fridge' || item.category === 'pantry' || item.category === 'beauty' || item.category === 'pets'
    );

    // Show results modal immediately with items
    setResultData({
      intent: 'INVENTORY_SWEEP',
      confidence,
      items: inventoryItems,
      onConfirm: async () => {
        toast.loading(`Adding ${inventoryItems.length} items to inventory...`);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_household_id')
          .eq('id', userId)
          .single();

        if (!profile?.current_household_id) {
          toast.error('No household found');
          return;
        }

        const householdId = profile.current_household_id;
        
        const enrichedItems = await Promise.all(
          inventoryItems.map(async (item) => {
            try {
              const { data } = await supabase.functions.invoke('enrich-product', {
                body: {
                  name: item.name,
                  brand: item.brand,
                  category: item.category
                }
              });

              return {
                name: item.name,
                brand_name: item.brand || data?.brand,
                category: item.category as 'fridge' | 'pantry' | 'beauty' | 'pets',
                product_image_url: data?.image_url,
                nutrition_data: data?.nutrition,
                allergens: data?.allergens,
                dietary_flags: data?.dietary_flags,
                household_id: householdId,
                quantity: 1,
                status: 'sufficient' as const
              };
            } catch (error) {
              console.error('Enrichment failed for', item.name, error);
              return {
                name: item.name,
                brand_name: item.brand,
                category: item.category as 'fridge' | 'pantry' | 'beauty' | 'pets',
                household_id: householdId,
                quantity: 1,
                status: 'sufficient' as const
              };
            }
          })
        );

        const { error } = await supabase.from('inventory').insert(enrichedItems);

        toast.dismiss();

        if (error) {
          console.error('Failed to add items:', error);
          toast.error('Failed to add items to inventory');
        } else {
          toast.success(`Added ${enrichedItems.length} items to inventory`);
          onItemsAdded?.();
          setResultData(null);
        }
      }
    });
  };

  const handleApplianceScan = async (items: DetectedItem[]) => {
    const appliances = items.filter(i => i.category === 'appliance');

    setResultData({
      intent: 'APPLIANCE_SCAN',
      confidence,
      items: appliances,
      onConfirm: async () => {
        const applianceNames = appliances.map(i => i.name);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('lifestyle_goals')
          .eq('id', userId)
          .single();

        const lifestyleGoals = (profile?.lifestyle_goals as any) || {};
        const existingAppliances = lifestyleGoals.appliances || [];
        const newAppliances = [...new Set([...existingAppliances, ...applianceNames])];

        await supabase
          .from('profiles')
          .update({
            lifestyle_goals: {
              ...lifestyleGoals,
              appliances: newAppliances
            }
          })
          .eq('id', userId);

        toast.success(`${applianceNames.length} Appliance${applianceNames.length > 1 ? 's' : ''} Added`, {
          description: `New recipe capabilities unlocked!`
        });
        
        setResultData(null);
      }
    });
  };

  const handleVanitySweep = async (items: DetectedItem[]) => {
    setResultData({
      intent: 'VANITY_SWEEP',
      confidence,
      items,
      onConfirm: async () => {
        toast.loading(`Adding ${items.length} beauty products...`);

        const { data: profile } = await supabase
          .from('profiles')
          .select('current_household_id')
          .eq('id', userId)
          .single();

        if (!profile?.current_household_id) {
          toast.error('No household found');
          return;
        }

        const beautyItems = items.map(item => {
          const paoMonths = item.metadata?.pao_symbol
            ? parseInt(item.metadata.pao_symbol.replace('M', ''))
            : 12;

          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + paoMonths);

          return {
            name: item.name,
            brand_name: item.brand,
            category: 'beauty' as const,
            expiry_date: expiryDate.toISOString(),
            household_id: profile.current_household_id,
            quantity: 1,
            status: 'sufficient' as const
          };
        });

        const enrichedBeautyItems = await Promise.all(
          beautyItems.map(async (item) => {
            try {
              const { data } = await supabase.functions.invoke('enrich-product', {
                body: {
                  name: item.name,
                  brand: item.brand_name,
                  category: 'beauty'
                }
              });

              return {
                ...item,
                product_image_url: data?.image_url
              };
            } catch {
              return item;
            }
          })
        );

        const { error } = await supabase.from('inventory').insert(enrichedBeautyItems);

        toast.dismiss();

        if (error) {
          toast.error('Failed to add beauty products');
        } else {
          toast.success('Beauty Products Added', {
            description: `${beautyItems.length} items added to your vanity inventory`
          });
          onItemsAdded?.();
          setResultData(null);
        }
      }
    });
  };

  const handleNutritionTrack = async (items: DetectedItem[], subtype: 'raw' | 'cooked', image: string) => {
    if (subtype === 'raw') {
      // Raw ingredients -> Recipe suggestions
      const ingredients = items.map(i => i.name);

      const { data: profile } = await supabase
        .from('profiles')
        .select('lifestyle_goals, dietary_preferences')
        .eq('id', userId)
        .single();

      const lifestyleGoals = (profile?.lifestyle_goals as any) || {};
      const dietaryPreferences = (profile?.dietary_preferences as any) || {};

      toast.loading('Finding recipes...');

      const { data: recipes, error } = await supabase.functions.invoke('suggest-recipes', {
        body: {
          ingredients,
          appliances: lifestyleGoals.appliances || [],
          dietary_preferences: dietaryPreferences
        }
      });

      toast.dismiss();

      if (error || !recipes) {
        toast.error('Failed to get recipe suggestions');
      } else {
        setResultData({
          intent: 'NUTRITION_TRACK',
          confidence,
          items,
          subtype: 'raw',
          additionalData: {
            recipes
          },
          onConfirm: () => {
            toast.success('Recipes saved!');
            setResultData(null);
          }
        });
      }

    } else {
      // Cooked meal -> Get enriched items + totals from analyze-meal
      toast.loading('Analyzing meal nutrition...');

      const { data: mealData, error } = await supabase.functions.invoke('analyze-meal', {
        body: {
          image
        }
      });

      toast.dismiss();

      if (error || !mealData) {
        toast.error('Failed to analyze meal');
        return;
      }

      // mealData contains: { items: [...], totals: {...} }
      const enrichedItems = mealData.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        nutrition: item.nutrition
      }));

      setResultData({
        intent: 'NUTRITION_TRACK',
        confidence,
        items: enrichedItems,
        subtype: 'cooked',
        imageUrl: image,
        additionalData: {
          totals: mealData.totals
        },
        onConfirm: () => {
          toast.success('Meal logged!');
          setResultData(null);
          onItemsAdded?.();
        }
      });
    }
  };

  const handleProductAnalysis = async (item: DetectedItem) => {
    toast.loading('Analyzing product...');

    const { data: productData } = await supabase.functions.invoke('enrich-product', {
      body: {
        name: item.name,
        brand: item.brand,
        barcode: item.metadata?.barcode,
        category: item.category
      }
    });

    const { data: profile } = await supabase
      .from('profiles')
      .select('allergies, dietary_preferences')
      .eq('id', userId)
      .single();

    toast.dismiss();

    const userAllergies = (profile?.allergies as any) || [];
    const allergenWarnings = (productData?.allergens || [])
      .filter((allergen: string) => Array.isArray(userAllergies) && userAllergies.includes(allergen))
      .map((allergen: string) => ({
        allergen,
        severity: 'high' as const,
        message: `Contains ${allergen} - You are allergic!`
      }));

    // Calculate truth score (simplified)
    const truthScore = allergenWarnings.length === 0 ? 85 : 45;

    setResultData({
      intent: 'PRODUCT_ANALYSIS',
      confidence,
      items: [item],
      additionalData: {
        productTruth: {
          name: productData?.name || item.name,
          brand: productData?.brand || item.brand,
          image_url: productData?.image_url,
          truthScore,
          allergenWarnings,
          dietaryConflicts: [],
          deceptionFlags: []
        }
      },
      onConfirm: () => {
        toast.success('Analysis complete');
        setResultData(null);
      }
    });
  };

  const handlePetId = async (item: DetectedItem) => {
    const petData = {
      species: item.metadata?.species || 'Unknown',
      breed: item.metadata?.breed || undefined,
      size: item.metadata?.size || undefined
    };

    setResultData({
      intent: 'PET_ID',
      confidence,
      items: [item],
      additionalData: {
        petData
      },
      onConfirm: async () => {
        const petName = prompt(`Name your ${petData.breed || petData.species}:`);
        if (!petName) return;

        const { error } = await supabase.from('pets').insert({
          user_id: userId,
          name: petName,
          species: petData.species,
          breed: petData.breed,
          notes: petData.size ? `Size: ${petData.size}` : null,
          toxic_flags_enabled: true
        });

        if (error) {
          toast.error('Failed to add pet');
        } else {
          toast.success(`${petName} Added!`);
          setResultData(null);
        }
      }
    });
  };

  const handleEmptyPackage = async (items: DetectedItem[]) => {
    if (!items || items.length === 0) {
      toast.error("No item identified");
      return;
    }

    const item = items[0];
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please sign in");
      return;
    }

    try {
      // Find matching inventory item
      const { data: inventory, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', `%${item.name}%`)
        .limit(1)
        .single();

      if (fetchError || !inventory) {
        toast.error(`${item.name} not found in inventory`);
        return;
      }

      // Set quantity to 0 and mark as out of stock
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity: 0,
          status: 'out_of_stock'
        })
        .eq('id', inventory.id);

      if (updateError) throw updateError;

      // Add to shopping list
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profile?.current_household_id) return;

      await supabase
        .from('shopping_list')
        .insert({
          household_id: profile.current_household_id,
          item_name: inventory.name,
          quantity: 1,
          unit: inventory.unit,
          source: 'replenishment',
          priority: 'high',
          inventory_id: inventory.id
        });

      toast.success(`${inventory.name} empty. Added to Smart Cart.`, {
        duration: 4000
      });
      
      onItemsAdded?.();
      
    } catch (error) {
      console.error('Error handling empty package:', error);
      toast.error("Failed to update inventory");
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setVideoFrames([]);
    const interval = setInterval(() => {
      const frame = webcamRef.current?.getScreenshot();
      if (frame) {
        setVideoFrames(prev => [...prev, frame]);
      }
    }, 500);
    recordingIntervalRef.current = interval;
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    if (videoFrames.length === 0) return;

    toast.loading('Processing video frames...');

    // Process frames and deduplicate items
    const allItems: DetectedItem[] = [];

    for (const frame of videoFrames) {
      try {
        const { data } = await supabase.functions.invoke('detect-intent', {
          body: { image: frame }
        });

        if (data && !data.error && data.items) {
          allItems.push(...data.items);
        }
      } catch (error) {
        console.error('Frame processing error:', error);
      }
    }

    // Deduplicate by name
    const uniqueItems = Array.from(
      new Map(allItems.map(item => [item.name.toLowerCase(), item])).values()
    );

    toast.dismiss();

    if (uniqueItems.length > 0) {
      setDetectedItems(uniqueItems);
      setDetectedIntent('INVENTORY_SWEEP');
      await handleInventorySweep(uniqueItems);
    } else {
      toast.error('No items detected in video');
    }

    setVideoFrames([]);
  };

  const renderIntentIcon = (intent: Intent) => {
    const iconClass = "w-12 h-12";
    const icons = {
      INVENTORY_SWEEP: <PackageOpen className={cn(iconClass, "text-blue-400")} />,
      APPLIANCE_SCAN: <ChefHat className={cn(iconClass, "text-orange-400")} />,
      VANITY_SWEEP: <Sparkles className={cn(iconClass, "text-pink-400")} />,
      NUTRITION_TRACK: <Utensils className={cn(iconClass, "text-green-400")} />,
      PRODUCT_ANALYSIS: <ScanLine className={cn(iconClass, "text-purple-400")} />,
      PET_ID: <PawPrint className={cn(iconClass, "text-emerald-400")} />
    };
    return icons[intent];
  };

  const renderIntentMessage = (intent: Intent) => {
    const messages = {
      INVENTORY_SWEEP: 'Scanning multiple items...',
      APPLIANCE_SCAN: 'Detecting kitchen appliances...',
      VANITY_SWEEP: 'Analyzing beauty products...',
      NUTRITION_TRACK: 'Tracking meal nutrition...',
      PRODUCT_ANALYSIS: 'Analyzing product details...',
      PET_ID: 'Identifying your pet...'
    };
    return messages[intent];
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background to-transparent">
        <h2 className="text-xl font-bold text-foreground">Smart Scanner</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full">
        <Webcam
          ref={webcamRef}
          className="w-full h-full object-cover"
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: 'environment' }}
        />

        {/* Scanning animation */}
        {!detectedIntent && !resultData && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 48%, rgba(34, 197, 94, 0.3) 50%, transparent 52%)',
            }}
            animate={{ y: ['0%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Intent overlay */}
        <AnimatePresence>
          {detectedIntent && !resultData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-20 left-4 right-4 bg-background/80 backdrop-blur-md p-6 rounded-2xl border border-border"
            >
              <div className="flex flex-col items-center gap-3">
                {renderIntentIcon(detectedIntent)}
                <p className="text-foreground text-center font-medium">{renderIntentMessage(detectedIntent)}</p>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-kaeva-sage"
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Item count overlay */}
        {detectedItems.length > 0 && !resultData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-32 left-4 right-4 bg-kaeva-sage/90 backdrop-blur-sm p-4 rounded-xl text-foreground text-center"
          >
            <p className="font-semibold">{detectedItems.length} items detected</p>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="absolute bottom-6 left-4 right-4 flex gap-3">
          <Button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isScanning}
            className={cn(
              "flex-1 h-14",
              isRecording && "bg-red-500 hover:bg-red-600"
            )}
          >
            {isRecording ? (
              <>
                <StopCircle className="mr-2 animate-pulse" />
                Recording...
              </>
            ) : (
              <>
                <Video className="mr-2" />
                Hold to Record
              </>
            )}
          </Button>

          <Button
            onClick={captureAndAnalyze}
            disabled={isScanning || isRecording}
            className="flex-1 h-14"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Camera className="mr-2" />
                Capture
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Modal */}
      {resultData && (
        <ScanResults
          isOpen={!!resultData}
          onClose={() => setResultData(null)}
          {...resultData}
        />
      )}
    </div>
  );
};

export default SmartScanner;
