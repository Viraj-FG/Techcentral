import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Image, Loader2 } from "lucide-react";

export const PWAIconGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateIcons = async () => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-app-icons');
      
      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: "Icons Generated Successfully",
          description: "PWA icons have been generated and uploaded. Users will see the KAEVA K logo when adding the app to their home screen.",
        });
      } else {
        throw new Error(data?.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Icon generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate PWA icons. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="glass-card border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Image size={20} strokeWidth={1.5} className="text-primary" />
          PWA Icon Generator
        </CardTitle>
        <CardDescription className="text-white/60">
          Generate app icons using AI for home screen installation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-body text-white/80 text-sm space-y-2">
          <p>
            This generates the KAEVA K logo with Autumn Gold gradient as PWA icons in multiple sizes.
          </p>
          <p className="text-white/60">
            Icons will be uploaded to storage and referenced in the manifest.
          </p>
        </div>
        
        <Button
          onClick={handleGenerateIcons}
          disabled={isGenerating}
          className="w-full"
          variant="default"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Icons...
            </>
          ) : (
            <>
              <Image className="mr-2 h-4 w-4" />
              Generate PWA Icons
            </>
          )}
        </Button>

        {isGenerating && (
          <div className="text-micro text-white/60 text-center">
            This may take 30-60 seconds to generate 4 icon sizes...
          </div>
        )}
      </CardContent>
    </Card>
  );
};