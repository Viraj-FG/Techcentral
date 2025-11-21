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

      // Save non-empty items to inventory
      if (nonEmptyItems.length > 0) {
        const inventoryInserts = nonEmptyItems.map(obj => ({
          user_id: session.user.id,
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-kaeva-seattle-slate/95 backdrop-blur-xl"
        >
          {/* Camera overlay gradient - Seattle Solstice */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-kaeva-seattle-slate/80 to-transparent pointer-events-none z-10" />

          <motion.div
            variants={kaevaEntranceVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={kaevaTransition}
            className="relative w-full max-w-5xl h-[90vh] glass-card p-8 mx-4 z-20"
          >
            {/* Close Button */}
            <Button
              variant="glass"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 z-10"
            >
              <X size={24} strokeWidth={1.5} />
            </Button>

            {/* Mode Selector */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Button
                variant={mode === 'quick_scan' ? 'primary' : 'glass'}
                size="sm"
                onClick={() => setMode('quick_scan')}
                className="gap-2"
              >
                <Camera size={20} strokeWidth={1.5} />
                <span className="text-micro">Quick Scan</span>
              </Button>
              <Button
                variant={mode === 'pantry_sweep' ? 'primary' : 'glass'}
                size="sm"
                onClick={() => setMode('pantry_sweep')}
                className="gap-2"
              >
                <Package size={20} strokeWidth={1.5} />
                <span className="text-micro">Pantry Sweep</span>
              </Button>
              <Button
                variant={mode === 'pet_id' ? 'primary' : 'glass'}
                size="sm"
                onClick={() => setMode('pet_id')}
                className="gap-2"
              >
                <PawPrint size={20} strokeWidth={1.5} />
                <span className="text-micro">Pet ID</span>
              </Button>
            </div>

            {/* Main Content */}
            <div className="h-full flex flex-col items-center justify-center pt-16">
              {/* Camera/Image Display */}
              <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden border-2 border-white/20 mb-6">
                {!capturedImage ? (
                  <>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover"
                      videoConstraints={{
                        width: 1280,
                        height: 720,
                        facingMode: 'user'
                      }}
                    />
                    
                    {/* Scanning Animation */}
                    {isAnalyzing && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(180deg, transparent 0%, rgba(112,224,152,0.3) 50%, transparent 100%)',
                          height: '4px'
                        }}
                        animate={{ y: [0, 720, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    )}

                    {/* Success Ring */}
                    {showSuccess && (
                      <motion.div
                        className="absolute inset-0 border-8 border-kaeva-sage rounded-3xl"
                        animate={{
                          scale: [1, 1.05, 1],
                          opacity: [1, 0.5, 1]
                        }}
                        transition={kaevaTransition}
                      />
                    )}
                  </>
                ) : (
                  <div className="relative w-full h-full">
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                    
                    {/* Tethered Tags for pantry sweep - Seattle Solstice */}
                    {result && mode === 'pantry_sweep' && result.objects.map((obj, idx) => {
                      if (!obj.boundingBox) return null;
                      
                      const centerX = obj.boundingBox.x + obj.boundingBox.width / 2;
                      const centerY = obj.boundingBox.y + obj.boundingBox.height / 2;
                      
                      return (
                        <TetheredTag
                          key={idx}
                          label={obj.name}
                          position={{ 
                            x: (centerX / 100) * 640 + 100, 
                            y: (centerY / 100) * 360 - 40 
                          }}
                          targetPosition={{ 
                            x: (centerX / 100) * 640, 
                            y: (centerY / 100) * 360 
                          }}
                          confidence={obj.confidence}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Voice Indicator */}
              <div className="flex items-center gap-4 mb-6">
                <motion.div
                  animate={{
                    scale: isListening ? [1, 1.2, 1] : 1,
                    opacity: isListening ? [0.5, 1, 0.5] : 0.5
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`p-3 rounded-full ${isListening ? 'bg-kaeva-sage/20' : 'bg-white/10'}`}
                >
                  {isListening ? <Mic size={24} strokeWidth={1.5} className="text-kaeva-sage" /> : <MicOff size={24} strokeWidth={1.5} className="text-white/50" />}
                </motion.div>
                
                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={kaevaTransition}
                    className="text-white/80 text-body"
                  >
                    "{transcript}"
                  </motion.div>
                )}
              </div>

              {/* Capture Button */}
              {!capturedImage && !isAnalyzing && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={capture}
                  className="gap-2"
                >
                  <Camera size={20} strokeWidth={1.5} />
                  <span className="text-micro">Capture & Analyze</span>
                </Button>
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

              {/* Analyzing State */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={kaevaTransition}
                  className="text-center space-y-2"
                >
                  <div className="text-display text-kaeva-sage">Analyzing...</div>
                  <div className="text-body text-white/50">Using Gemini Vision AI</div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VisionSpotlight;
