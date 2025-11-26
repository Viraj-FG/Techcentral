import { useState, useRef, useEffect } from "react";
import { Share2, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { generateShareImage, shareToSocial } from "@/lib/shareUtils";

interface ShareProgressSheetProps {
  open: boolean;
  onClose: () => void;
  data: {
    streak?: number;
    weeklyCalories?: number;
    avgDaily?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export const ShareProgressSheet = ({ open, onClose, data }: ShareProgressSheetProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && canvasRef.current) {
      const url = generateShareImage(canvasRef.current, data);
      setImageUrl(url);
    }
  }, [open, data]);

  const handleShare = async () => {
    const success = await shareToSocial(data, imageUrl);
    if (success) {
      toast({
        title: "Shared!",
        description: "Your progress has been shared",
      });
      onClose();
    } else {
      toast({
        title: "Share Failed",
        description: "Could not share. Try copying the link instead.",
        variant: "destructive"
      });
    }
  };

  const handleCopy = () => {
    const text = `🔥 ${data.streak || 0} Day Streak!\n\nThis week: ${data.weeklyCalories || 0} cal\nAvg: ${data.avgDaily || 0}/day\n\nP: ${data.protein || 0}g C: ${data.carbs || 0}g F: ${data.fat || 0}g\n\nTracked with KAEVA`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Progress copied to clipboard",
    });
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.download = `kaeva-progress-${Date.now()}.png`;
    link.href = imageUrl;
    link.click();
    
    toast({
      title: "Downloaded!",
      description: "Image saved to your device",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="backdrop-blur-xl bg-slate-900/95 border-white/10">
        <SheetHeader>
          <SheetTitle className="text-white">Share Your Progress</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pt-6">
          {/* Preview Card */}
          <div className="bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-4">🔥</div>
            <h3 className="text-3xl font-bold text-white mb-2">
              {data.streak || 0} Day Streak!
            </h3>
            
            <div className="space-y-2 mb-4">
              <p className="text-muted-foreground">
                This week: <span className="text-white font-semibold">{data.weeklyCalories || 0} cal</span>
              </p>
              <p className="text-muted-foreground">
                Avg: <span className="text-white font-semibold">{data.avgDaily || 0}/day</span>
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="text-primary font-mono">P: {data.protein || 0}g</span>
              <span className="text-secondary font-mono">C: {data.carbs || 0}g</span>
              <span className="text-accent font-mono">F: {data.fat || 0}g</span>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Tracked with KAEVA
            </p>
          </div>

          {/* Hidden canvas for image generation */}
          <canvas ref={canvasRef} className="hidden" width={800} height={600} />

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex flex-col h-auto py-4 gap-2"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-xs">Share</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex flex-col h-auto py-4 gap-2"
              disabled={!imageUrl}
            >
              <Download className="w-5 h-5" />
              <span className="text-xs">Download</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex flex-col h-auto py-4 gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-secondary" />
                  <span className="text-xs">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span className="text-xs">Copy Text</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};