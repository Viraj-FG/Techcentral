import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Image, Loader2, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const PWAIconGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [iconUrls, setIconUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const iconConfigs = [
    { name: 'icon-192.png', size: '192x192', label: 'Standard 192' },
    { name: 'icon-512.png', size: '512x512', label: 'Standard 512' },
    { name: 'icon-maskable-192.png', size: '192x192', label: 'Maskable 192' },
    { name: 'icon-maskable-512.png', size: '512x512', label: 'Maskable 512' },
  ];

  const loadIconPreviews = async () => {
    setIsLoadingPreview(true);
    try {
      const urls: Record<string, string> = {};
      
      for (const config of iconConfigs) {
        const { data } = supabase.storage
          .from('app-assets')
          .getPublicUrl(config.name);
        
        // Add timestamp to force refresh and avoid cache
        urls[config.name] = `${data.publicUrl}?t=${Date.now()}`;
      }
      
      setIconUrls(urls);
    } catch (error) {
      console.error('Error loading icon previews:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    loadIconPreviews();
  }, []);

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
        
        // Refresh preview after successful generation
        await loadIconPreviews();
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

        <Separator className="bg-white/10" />

        {/* Icon Preview Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-body text-white font-medium">Current Icons</h3>
            <Button
              variant="glass"
              size="sm"
              onClick={loadIconPreviews}
              disabled={isLoadingPreview}
            >
              {isLoadingPreview ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {iconConfigs.map((config) => (
              <div
                key={config.name}
                className="glass-card p-3 sm:p-4 space-y-2 border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="aspect-square bg-background/50 rounded-lg flex items-center justify-center overflow-hidden">
                  {iconUrls[config.name] ? (
                    <img
                      src={iconUrls[config.name]}
                      alt={config.label}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Hide broken images
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Image className="text-white/20" size={48} strokeWidth={1.5} />
                  )}
                </div>
                <div className="text-center space-y-1">
                  <p className="text-micro text-white/80 font-medium">{config.label}</p>
                  <p className="text-micro text-white/40">{config.size}</p>
                </div>
              </div>
            ))}
          </div>

          {Object.keys(iconUrls).length === 0 && !isLoadingPreview && (
            <p className="text-micro text-white/40 text-center py-4">
              No icons found. Generate icons to see them here.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};