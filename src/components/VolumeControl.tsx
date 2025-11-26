import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const VolumeControl = ({ volume, onVolumeChange }: VolumeControlProps) => {
  const isMuted = volume === 0;

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 bg-background/40 backdrop-blur-sm border border-muted/30 rounded-lg">
      <button
        onClick={() => onVolumeChange(isMuted ? 0.7 : 0)}
        className="p-2 text-muted-foreground hover:text-muted-foreground/70 transition-colors"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>
      
      <div className="flex-1 min-w-[80px] sm:min-w-[120px] max-w-[140px] sm:max-w-[200px]">
        <Slider
          value={[volume * 100]}
          onValueChange={([value]) => onVolumeChange(value / 100)}
          max={100}
          step={1}
          className="cursor-pointer"
          aria-label="Volume control"
        />
      </div>
      
      <span className="text-muted-foreground text-sm font-mono min-w-[3ch] text-right">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
};

export default VolumeControl;
