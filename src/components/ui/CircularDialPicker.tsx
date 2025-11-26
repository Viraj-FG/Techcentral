import { useState, useRef, useEffect } from "react";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

interface CircularDialPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  step?: number;
  label?: string;
  precision?: number;
  className?: string;
}

export const CircularDialPicker = ({
  min,
  max,
  value,
  onChange,
  unit,
  step = 1,
  label,
  precision = 0,
  className
}: CircularDialPickerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);
  const startAngleRef = useRef<number>(0);
  const startValueRef = useRef<number>(value);

  const normalizedValue = ((value - min) / (max - min)) * 360;
  const rotation = normalizedValue - 90; // Start from top

  const handleStart = (clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    
    setIsDragging(true);
    haptics.selection();
    
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    startAngleRef.current = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    startValueRef.current = value;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !dialRef.current) return;
    
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const currentAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    let deltaAngle = currentAngle - startAngleRef.current;
    
    // Handle angle wrap-around
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    
    const deltaValue = (deltaAngle / 360) * (max - min);
    let newValue = startValueRef.current + deltaValue;
    
    // Snap to step
    newValue = Math.round(newValue / step) * step;
    
    // Clamp to min/max
    newValue = Math.max(min, Math.min(max, newValue));
    
    if (newValue !== value) {
      onChange(parseFloat(newValue.toFixed(precision)));
      haptics.selection();
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    haptics.impact();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, value]);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {label && (
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
      )}
      
      <div className="relative">
        {/* Dial container */}
        <div
          ref={dialRef}
          className="relative w-48 h-48 rounded-full bg-background/40 backdrop-blur-xl border-2 border-border/20"
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onTouchStart={(e) => {
            if (e.touches.length > 0) {
              handleStart(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {/* Tick marks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) - 90;
            const isMajor = i % 3 === 0;
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 origin-left"
                style={{
                  transform: `rotate(${angle}deg) translateX(85px)`,
                  width: isMajor ? '8px' : '4px',
                  height: '2px',
                  background: 'hsl(var(--muted-foreground))',
                  opacity: isMajor ? 0.6 : 0.3
                }}
              />
            );
          })}

          {/* Value display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-foreground">
              {value.toFixed(precision)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{unit}</div>
          </div>

          {/* Knob */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-100"
            style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
          >
            <div
              className="w-2 h-20 origin-center"
              style={{ transform: 'translateY(-40px)' }}
            >
              <div className="w-6 h-6 rounded-full bg-primary shadow-glow border-2 border-background" />
            </div>
          </div>
        </div>
      </div>

      {/* Value range indicator */}
      <div className="flex items-center justify-between w-48 text-xs text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};
