import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ImagePlus, PackageX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ScanResults, { type ScanResultsProps } from './ScanResults';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ModeSelector, type CaptureMode } from './ModeSelector';
import { CaptureButton } from './CaptureButton';
import { ScannerToolbar } from './ScannerToolbar';
import { BarcodeOverlay } from './BarcodeOverlay';
import { IntentPresetPicker, type IntentPreset } from './IntentPresetPicker';
import ToxicityAlert from './ToxicityAlert';
import { ScannerHUD } from './ScannerHUD';
import { haptics } from '@/lib/haptics';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scanner State
  const [captureMode, setCaptureMode] = useState<CaptureMode>('auto');
  const [intentPreset, setIntentPreset] = useState<IntentPreset>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  // Detection State
  const [detectedIntent, setDetectedIntent] = useState<Intent | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoFrames, setVideoFrames] = useState<string[]>([]);
  const [resultData, setResultData] = useState<Omit<ScanResultsProps, 'isOpen' | 'onClose'> | null>(null);
  const [lastScanImage, setLastScanImage] = useState<string | null>(null);
  const [toxicityWarnings, setToxicityWarnings] = useState<Array<{ type: 'pet' | 'human'; name: string; allergen: string }>>([]);
  const [showToxicityAlert, setShowToxicityAlert] = useState(false);
  const [pendingToxicProduct, setPendingToxicProduct] = useState<string>('');
  const [showHint, setShowHint] = useState(true);
  const [showEmptyPackageConfirm, setShowEmptyPackageConfirm] = useState(false);
  const [pendingEmptyPackageData, setPendingEmptyPackageData] = useState<{ item: any; householdId: string } | null>(null);

  // Hide hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const getMealType = (hour: number): string => {
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 19) return 'snack';
    return 'dinner';
  };

  const checkItemToxicity = async (itemName: string): Promise<Array<{ type: 'pet' | 'human'; name: string; allergen: string }>> => {
    const warnings: Array<{ type: 'pet' | 'human'; name: string; allergen: string }> = [];
    const ingredient = itemName.toLowerCase();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return warnings;

      // Check user allergies
      const { data: profile } = await supabase
        .from('profiles')
        .select('allergies')
        .eq('id', user.id)
        .single();

      const userAllergies = (profile?.allergies as string[]) || [];
      userAllergies.forEach((allergen) => {
        if (ingredient.includes(allergen.toLowerCase())) {
          warnings.push({ type: 'human', name: 'You', allergen });
        }
      });

      // Check household member allergies
      const { data: householdMembers } = await supabase
        .from('household_members')
        .select('name, allergies')
        .eq('user_id', user.id);

      householdMembers?.forEach((member) => {
        const allergies = (member.allergies as string[]) || [];
        allergies.forEach((allergen) => {
          if (ingredient.includes(allergen.toLowerCase())) {
            warnings.push({ type: 'human', name: member.name || 'Household member', allergen });
          }
        });
      });

      // Check pet toxic foods
      const { data: pets } = await supabase
        .from('pets')
        .select('name, species')
        .eq('user_id', user.id)
        .eq('toxic_flags_enabled', true);

      if (pets && pets.length > 0) {
        const toxicFoods = [
          'chocolate', 'xylitol', 'grape', 'raisin',
          'onion', 'garlic', 'avocado', 'macadamia',
        ];
        toxicFoods.forEach((toxic) => {
          if (ingredient.includes(toxic)) {
            pets.forEach((pet) => {
              warnings.push({ type: 'pet', name: pet.name || pet.species, allergen: toxic });
            });
          }
        });
      }

      return warnings;
    } catch (error) {
      console.error('Toxicity check failed:', error);
      return warnings;
    }
  };

  const captureAndAnalyze = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      toast.error('Failed to capture image');
      return;
    }

    setLastScanImage(imageSrc);
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // File size validation (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large', { description: 'Please upload an image under 10MB' });
      return;
    }
    
    setIsScanning(true);
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Image = e.target?.result as string;
      
      try {
        // Use same detect-intent pipeline
        const { data, error } = await supabase.functions.invoke('detect-intent', {
          body: { image: base64Image }
        });

        if (error) throw error;

        if (data.error) {
          toast.error(data.error, { description: data.suggestion });
          setIsScanning(false);
          return;
        }

        const intentData: IntentResponse = data;
        setDetectedIntent(intentData.intent);
        setConfidence(intentData.confidence);
        setDetectedItems(intentData.items);

        // Route to appropriate handler
        await handleIntent(intentData, base64Image);

      } catch (error) {
        console.error('Upload analysis error:', error);
        toast.error('Failed to analyze uploaded image');
      } finally {
        setIsScanning(false);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read image file');
      setIsScanning(false);
    };
    
    reader.readAsDataURL(file);
    
    // Reset input to allow same file to be selected again
    event.target.value = '';
  };

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

    // Check all items for toxicity
    const allWarnings: Array<{ type: 'pet' | 'human'; name: string; allergen: string }> = [];
    for (const item of inventoryItems) {
      const itemWarnings = await checkItemToxicity(item.name);
      if (itemWarnings.length > 0) {
        allWarnings.push(...itemWarnings);
        // Show alert for first toxic item and stop
        haptics.warning(); // Double heavy vibration for toxicity warning
        setPendingToxicProduct(item.name);
        setToxicityWarnings(itemWarnings);
        setShowToxicityAlert(true);
        return;
      }
    }

    // Show results modal immediately with items
    setResultData({
      intent: 'INVENTORY_SWEEP',
      confidence,
      items: inventoryItems,
      onConfirm: async () => {
        toast.loading(`Adding ${inventoryItems.length} items to inventory...`);
        
        // Get household_id from profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.dismiss();
          toast.error('Not authenticated');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('current_household_id')
          .eq('id', user.id)
          .single();

        if (!profileData?.current_household_id) {
          toast.dismiss();
          toast.error('No household found');
          return;
        }
        
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
                household_id: profileData.current_household_id,
                quantity: 1,
                status: 'sufficient' as const
              };
            } catch (error) {
              console.error('Enrichment failed for', item.name, error);
              return {
                name: item.name,
                brand_name: item.brand,
                category: item.category as 'fridge' | 'pantry' | 'beauty' | 'pets',
                household_id: profileData.current_household_id,
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
          haptics.success(); // Success vibration
          toast.success(`Added ${enrichedItems.length} items to inventory`);
          onItemsAdded?.();
          setResultData(null);
        }
      }
    });
  };

  const handleApplianceScan = async (items: DetectedItem[]) => {
    const appliances = items.filter(i => i.category === 'appliance');
    const applianceNames = appliances.map(i => i.name);

    // Fetch recipes that use these appliances
    toast.loading('Finding recipes for your appliances...');
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('lifestyle_goals, dietary_preferences, current_household_id')
      .eq('id', userId)
      .single();

    const lifestyleGoals = (profile?.lifestyle_goals as any) || {};
    const dietaryPreferences = (profile?.dietary_preferences as any) || {};
    const existingAppliances = lifestyleGoals.appliances || [];
    const allAppliances = [...new Set([...existingAppliances, ...applianceNames])];

    // Fetch inventory to suggest recipes
    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('name')
      .eq('household_id', profile?.current_household_id)
      .gt('quantity', 0);

    const availableIngredients = inventoryData?.map(item => item.name) || [];

    const { data: recipes, error: recipeError } = await supabase.functions.invoke('suggest-recipes', {
      body: {
        ingredients: availableIngredients.slice(0, 15), // Limit to prevent huge prompts
        appliances: applianceNames,
        dietary_preferences: dietaryPreferences,
        inventory_match: availableIngredients.length > 0
      }
    });

    toast.dismiss();

    if (recipeError) {
      console.error('Failed to fetch recipes:', recipeError);
    }

    setResultData({
      intent: 'APPLIANCE_SCAN',
      confidence,
      items: appliances,
      additionalData: {
        unlockedRecipes: recipes || []
      },
      onConfirm: async () => {
        await supabase
          .from('profiles')
          .update({
            lifestyle_goals: {
              ...lifestyleGoals,
              appliances: allAppliances
            }
          })
          .eq('id', userId);

        toast.success(`${applianceNames.length} Appliance${applianceNames.length > 1 ? 's' : ''} Added`, {
          description: `${recipes?.length || 0} recipes unlocked!`
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

        // Get household_id from profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.dismiss();
          toast.error('Not authenticated');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('current_household_id')
          .eq('id', user.id)
          .single();

        if (!profileData?.current_household_id) {
          toast.dismiss();
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
            household_id: profileData.current_household_id,
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
      // Get household_id from profile first
      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.current_household_id) {
        toast.error('No household found');
        return;
      }

      // Find matching inventory item
      const { data: inventory, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('household_id', profileData.current_household_id)
        .ilike('name', `%${item.name}%`)
        .limit(1)
        .single();

      if (fetchError || !inventory) {
        toast.error(`${item.name} not found in inventory`);
        return;
      }

      // Show confirmation modal via state
      setPendingEmptyPackageData({
        item: inventory,
        householdId: profileData.current_household_id
      });
      setShowEmptyPackageConfirm(true);
      
    } catch (error) {
      console.error('Error handling empty package:', error);
      toast.error("Failed to update inventory");
    }
  };

  const confirmEmptyPackage = async () => {
    if (!pendingEmptyPackageData) return;

    const { item, householdId } = pendingEmptyPackageData;

    try {
      // Set quantity to 0 and mark as out of stock
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity: 0,
          status: 'out_of_stock'
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      // Add to shopping list
      await supabase
        .from('shopping_list')
        .insert({
          household_id: householdId,
          item_name: item.name,
          quantity: 1,
          unit: item.unit,
          source: 'replenishment',
          priority: 'high',
          inventory_id: item.id
        });

      toast.success(`${item.name} marked empty. Added to Smart Cart.`, {
        duration: 4000
      });
      
      setShowEmptyPackageConfirm(false);
      setPendingEmptyPackageData(null);
      onItemsAdded?.();
      
    } catch (error) {
      console.error('Error confirming empty package:', error);
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

  // Handler functions for new UI
  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleFlashToggle = () => {
    setIsFlashOn(prev => !prev);
  };

  const handleCapture = () => {
    if (captureMode === 'photo' || captureMode === 'auto') {
      captureAndAnalyze();
    }
  };

  const handleRecordingStart = () => {
    if (captureMode === 'video') {
      startRecording();
    }
  };

  const handleRecordingEnd = () => {
    if (captureMode === 'video' && isRecording) {
      stopRecording();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

        {/* Camera View */}
        <div className="relative w-full h-full">
          <Webcam
            ref={webcamRef}
            className="w-full h-full object-cover"
            screenshotFormat="image/jpeg"
            videoConstraints={{ 
              facingMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }}
          />

          {/* Scanner HUD Overlay */}
          <ScannerHUD 
            mode={captureMode === 'auto' ? 'inventory' : captureMode as any} 
            isScanning={isScanning} 
          />

          {/* Barcode Overlay */}
          {captureMode === 'barcode' && <BarcodeOverlay />}
        
        {/* Fleeting Hint Text */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="absolute top-24 left-0 right-0 flex justify-center pointer-events-none z-10"
            >
              <div className="bg-background/80 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <p className="text-white/90 text-sm">
                  Point at a product, barcode, or shelf
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanning Loader */}
        {isScanning && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-secondary animate-spin" />
              <p className="text-white font-medium">Analyzing...</p>
            </div>
          </div>
        )}

        {/* Right Side Toolbar */}
        <ScannerToolbar
          isFlashOn={isFlashOn}
          onFlashToggle={handleFlashToggle}
          onFlipCamera={handleFlipCamera}
          onGalleryOpen={() => fileInputRef.current?.click()}
          lastScanThumbnail={lastScanImage}
          onLastScanClick={() => lastScanImage && resultData && setResultData(resultData)}
        />

        {/* Mode Selector - Top Left */}
        <ModeSelector mode={captureMode} onChange={setCaptureMode} />

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
          <div className="flex flex-col items-center gap-3">
            {/* Intent Carousel (shows in Auto mode) */}
            <IntentPresetPicker
              preset={intentPreset}
              onChange={setIntentPreset}
              isVisible={captureMode === 'auto'}
            />
            
            {/* Capture Button */}
            <CaptureButton
              mode={captureMode}
              intentPreset={intentPreset}
              isRecording={isRecording}
              isScanning={isScanning}
              onPress={handleCapture}
              onLongPressStart={handleRecordingStart}
              onLongPressEnd={handleRecordingEnd}
            />
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Results Modal */}
      {resultData && (
        <ScanResults
          isOpen={!!resultData}
          onClose={() => setResultData(null)}
          {...resultData}
        />
      )}

      {/* Toxicity Alert Modal */}
      <ToxicityAlert
        isOpen={showToxicityAlert}
        onClose={() => {
          setShowToxicityAlert(false);
          setToxicityWarnings([]);
          setPendingToxicProduct('');
        }}
        productName={pendingToxicProduct}
        warnings={toxicityWarnings}
      />

      {/* Empty Package Confirmation Modal */}
      <AlertDialog open={showEmptyPackageConfirm} onOpenChange={setShowEmptyPackageConfirm}>
        <AlertDialogContent className="bg-slate-900/95 backdrop-blur-xl border border-destructive/30">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <PackageX className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl text-white">
                Mark as Empty?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-300">
              This will mark <span className="font-semibold text-white">{pendingEmptyPackageData?.item?.name}</span> as out of stock and add it to your Smart Cart for replenishment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowEmptyPackageConfirm(false);
                setPendingEmptyPackageData(null);
              }}
              className="bg-slate-800 text-white hover:bg-slate-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEmptyPackage}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Confirm Empty
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SmartScanner;
