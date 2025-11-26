import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { X, Camera, Mic, MicOff, Scan, Package, PawPrint, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVisionCapture, CaptureMode, DetectedObject } from '@/hooks/useVisionCapture';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { TetheredTag } from './TetheredTag';
import { kaevaTransition, kaevaEntranceVariants } from '@/hooks/useKaevaMotion';

interface VisionSpotlightProps {
  isOpen: boolean;
  onClose: () => void;
  onItemsAdded?: () => void;
}

const VisionSpotlight = ({ isOpen, onClose, onItemsAdded }: VisionSpotlightProps) => {
  const webcamRef = useRef<Webcam>(null);
  const [mode, setMode] = useState<CaptureMode>('quick_scan');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { analyzeImage, isAnalyzing, result, reset: resetVision } = useVisionCapture();
  const { isListening, transcript, command, startListening, stopListening, reset: resetVoice } = useVoiceCommand();
  const { toast } = useToast();

  // Auto-start voice listening when spotlight opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => startListening(), 500);
    } else {
      stopListening();
      resetVision();
      resetVoice();
      setCapturedImage(null);
      setSelectedItems(new Set());
      setShowSuccess(false);
    }
  }, [isOpen, startListening, stopListening, resetVision, resetVoice]);

  // Detect mode from voice command
  useEffect(() => {
    if (command) {
      const lowerCommand = command.toLowerCase();
      if (lowerCommand.includes('scan shelf') || lowerCommand.includes('pantry sweep') || lowerCommand.includes('multiple')) {
        setMode('pantry_sweep');
      } else if (lowerCommand.includes('pet') || lowerCommand.includes('dog') || lowerCommand.includes('cat')) {
        setMode('pet_id');
      } else {
        setMode('quick_scan');
      }
    }
  }, [command]);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast({
        title: 'Capture Failed',
        description: 'Unable to capture image from camera',
        variant: 'destructive'
      });
      return;
    }

    setCapturedImage(imageSrc);
    stopListening();

    // Analyze the image
    const visionResult = await analyzeImage(imageSrc, mode, command || undefined);
    
    if (visionResult && visionResult.objects.length > 0) {
      // Auto-select all items for quick_scan and pet_id modes
      if (mode !== 'pantry_sweep') {
        setSelectedItems(new Set(visionResult.objects.map((_, idx) => idx)));
      } else {
        // For pantry sweep, select first 3 items by default
        setSelectedItems(new Set(visionResult.objects.slice(0, 3).map((_, idx) => idx)));
      }
    }
  }, [mode, command, analyzeImage, stopListening, toast]);

  const saveToInventory = useCallback(async () => {
    if (!result || selectedItems.size === 0) return;

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Not authenticated');
      }

      const itemsToSave = result.objects.filter((_, idx) => selectedItems.has(idx));

      // Check for empty items and handle Smart Cart integration
      const emptyItems = itemsToSave.filter(item => item.isEmpty);
      const nonEmptyItems = itemsToSave.filter(item => !item.isEmpty);

      // Get household_id from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_household_id')
        .eq('id', session.user.id)
        .single();

      if (!profileData?.current_household_id) {
        throw new Error('No household found');
      }

      // Save non-empty items to inventory
      if (nonEmptyItems.length > 0) {
        const inventoryInserts = nonEmptyItems.map(obj => ({
          household_id: profileData.current_household_id,
          name: obj.name,
          category: obj.category,
          fill_level: 100,
          quantity: 1,
          unit: obj.category === 'pets' ? 'bag' : obj.category === 'beauty' ? 'unit' : 'item',
          auto_order_enabled: false,
          status: 'sufficient' as const
        }));

        const { error: invError } = await supabase
          .from('inventory')
          .insert(inventoryInserts);

        if (invError) throw invError;
      }

      // Handle pet identification
      const petItems = itemsToSave.filter(item => item.category === 'pets' && item.metadata?.species);
      if (petItems.length > 0) {
        const petInserts = petItems.map(pet => ({
          user_id: session.user.id,
          name: pet.name,
          species: pet.metadata!.species!,
          breed: pet.metadata?.breed || null,
          notes: pet.metadata?.size ? `Size: ${pet.metadata.size}` : null,
          toxic_flags_enabled: true
        }));

        const { error: petError } = await supabase
          .from('pets')
          .insert(petInserts);

        if (petError) throw petError;
      }

      // Show success feedback
      setShowSuccess(true);
      toast({
        title: 'Items Added',
        description: `Successfully added ${itemsToSave.length} item${itemsToSave.length > 1 ? 's' : ''} to your inventory`,
      });

      // Handle empty items suggestion
      if (emptyItems.length > 0) {
        toast({
          title: 'Empty Containers Detected',
          description: `${emptyItems.length} empty item${emptyItems.length > 1 ? 's' : ''} detected. Add to shopping cart?`,
        });
      }

      setTimeout(() => {
        onItemsAdded?.();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Unable to save items. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [result, selectedItems, onClose, onItemsAdded, toast]);

  const retryCapture = useCallback(() => {
    setCapturedImage(null);
    resetVision();
    resetVoice();
    setSelectedItems(new Set());
    setShowSuccess(false);
    startListening();
  }, [resetVision, resetVoice, startListening]);

  const toggleItemSelection = useCallback((idx: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={kaevaTransition}
          className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-[#0F172A]/90 backdrop-blur-xl p-4"
        >
          {/* Close Button */}
          <Button
            variant="glass"
            size="icon"
            onClick={onClose}
            className="absolute top-6 right-6 z-10"
          >
            <X size={24} strokeWidth={1.5} />
          </Button>

          <motion.div
            initial={{ y: 100, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 100, scale: 0.95 }}
            transition={kaevaTransition}
            className="w-full max-w-md bg-slate-900/80 border border-emerald-500/50 rounded-3xl shadow-[0_0_40px_rgba(112,224,152,0.15)] overflow-hidden space-y-0"
          >
            {/* Search Input Area */}
            <div className="flex items-center gap-4 p-4 border-b border-white/10">
              <Camera className="text-emerald-400" size={24} strokeWidth={1.5} />
              <input 
                type="text" 
                placeholder="Ask Kaeva or scan an item..." 
                value={transcript}
                readOnly
                className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-500 font-light truncate"
              />
              <motion.div 
                className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"
                animate={{
                  scale: isListening ? [1, 1.2, 1] : 1,
                  opacity: isListening ? [0.5, 1, 0.5] : 0.5
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {isListening ? <Mic size={18} strokeWidth={1.5} /> : <MicOff size={18} strokeWidth={1.5} />}
              </motion.div>
            </div>

            {/* Mode Selector Pills */}
            <div className="flex gap-2 p-2 border-b border-white/10">
              <button
                onClick={() => setMode('quick_scan')}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  mode === 'quick_scan' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                Quick Scan
              </button>
              <button
                onClick={() => setMode('pantry_sweep')}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  mode === 'pantry_sweep' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                Pantry Sweep
              </button>
              <button
                onClick={() => setMode('pet_id')}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  mode === 'pet_id' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                Pet ID
              </button>
            </div>

            {/* Camera/Image Display */}
            {!capturedImage ? (
              <div className="relative h-48 bg-slate-800 w-full overflow-hidden group cursor-pointer" onClick={capture}>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: 'user'
                  }}
                />
                
                {/* Scanning Line Animation */}
                <motion.div
                  className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent h-[20%] w-full"
                  animate={isAnalyzing ? { y: ['0%', '400%', '0%'] } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <div className="flex flex-col items-center gap-2">
                    <Camera size={32} className="text-white drop-shadow-lg" strokeWidth={1.5} />
                    <span className="text-xs font-bold tracking-widest text-white uppercase">
                      {isAnalyzing ? 'Analyzing...' : 'Tap to Scan Item'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-48 w-full overflow-hidden">
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Quick Actions (shown when no capture) */}
            {!capturedImage && !isAnalyzing && (
              <div className="p-2 grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setMode('quick_scan')}
                  className="p-3 rounded-xl hover:bg-white/5 text-left transition-colors group"
                >
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Recent
                  </span>
                  <div className="flex items-center justify-between text-slate-300 group-hover:text-white text-sm">
                    <span>Add Item to Fridge</span>
                  </div>
                </button>
                <button 
                  onClick={() => setMode('pet_id')}
                  className="p-3 rounded-xl hover:bg-white/5 text-left transition-colors group"
                >
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Suggestion
                  </span>
                  <div className="flex items-center justify-between text-slate-300 group-hover:text-white text-sm">
                    <span>Identify Your Pet</span>
                  </div>
                </button>
              </div>
            )}

            {/* Results Display */}
            {result && capturedImage && !showSuccess && (
                <motion.div
                  variants={kaevaEntranceVariants}
                  initial="hidden"
                  animate="visible"
                  transition={kaevaTransition}
                  className="w-full max-w-2xl space-y-4"
                >
                  {/* Suggestion */}
                  <div className="glass-card p-4 text-center">
                    <p className="text-white text-body">{result.suggestion}</p>
                  </div>

                  {/* Detected Items List */}
                  {result.objects.length > 0 ? (
                    <div className="glass-card p-4 space-y-3 max-h-48 overflow-y-auto">
                      {result.objects.map((obj, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-kaeva active-press">
                          <Checkbox
                            checked={selectedItems.has(idx)}
                            onCheckedChange={() => toggleItemSelection(idx)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{obj.name}</span>
                              {obj.isEmpty && (
                                <span className="text-micro bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
                                  Empty
                                </span>
                              )}
                            </div>
                            <div className="text-micro text-kaeva-oatmeal">
                              {obj.category} • {Math.round(obj.confidence * 100)}% confidence
                              {obj.metadata?.species && ` • ${obj.metadata.species}`}
                              {obj.metadata?.breed && ` (${obj.metadata.breed})`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card p-4 flex items-center justify-center gap-2 text-white/50">
                      <AlertCircle size={20} strokeWidth={1.5} />
                      <span className="text-body">No items detected. Try adjusting lighting or getting closer.</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center">
                    <Button variant="glass" onClick={retryCapture}>
                      <Scan size={20} strokeWidth={1.5} />
                      <span className="text-micro ml-2">Retry Scan</span>
                    </Button>
                    
                    {result.objects.length > 0 && selectedItems.size > 0 && (
                      <Button variant="primary" onClick={saveToInventory} disabled={isSaving}>
                        <CheckCircle2 size={20} strokeWidth={1.5} />
                        <span className="text-micro ml-2">Add Selected ({selectedItems.size})</span>
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VisionSpotlight;
