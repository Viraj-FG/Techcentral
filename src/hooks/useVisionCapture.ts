import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type CaptureMode = 'quick_scan' | 'pantry_sweep' | 'pet_id';

export interface DetectedObject {
  name: string;
  category: 'fridge' | 'pantry' | 'beauty' | 'pets';
  confidence: number;
  isEmpty: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
  metadata?: {
    species?: string;
    breed?: string;
    size?: string;
    productType?: string;
  };
}

export interface VisionResult {
  objects: DetectedObject[];
  suggestion: string;
}

export const useVisionCapture = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzeImage = useCallback(async (
    imageBase64: string,
    mode: CaptureMode,
    voiceCommand?: string
  ): Promise<VisionResult | null> => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Cancel previous request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      console.log('Analyzing image...', { mode, voiceCommand });

      const { data, error } = await supabase.functions.invoke('analyze-vision', {
        body: {
          image: imageBase64,
          voiceCommand,
          mode
        }
      });

      if (error) {
        console.error('Vision analysis error:', error);
        toast({
          title: 'Analysis Failed',
          description: 'Unable to analyze the image. Please try again.',
          variant: 'destructive'
        });
        return null;
      }

      console.log('Vision result:', data);
      setResult(data);
      return data;

    } catch (error) {
      console.error('Vision capture error:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze image. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  const reset = useCallback(() => {
    setResult(null);
    setIsAnalyzing(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    analyzeImage,
    isAnalyzing,
    result,
    reset
  };
};
