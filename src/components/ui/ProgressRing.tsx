import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  unit?: string;
  className?: string;
}

export const ProgressRing = ({
  value,
  max,
  label,
  color = "hsl(var(--accent))",
  size = 'md',
  showPercentage = false,
  unit = "",
  className
}: ProgressRingProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  const sizes = {
    sm: { dimension: 80, stroke: 6, fontSize: "text-sm" },
    md: { dimension: 120, stroke: 8, fontSize: "text-lg" },
    lg: { dimension: 180, stroke: 10, fontSize: "text-2xl" }
  };
  
  const { dimension, stroke, fontSize } = sizes[size];
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={dimension} height={dimension} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          opacity={0.2}
        />
        {/* Progress circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-kaeva"
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={cn("font-bold text-foreground", fontSize)}>
          {showPercentage ? `${Math.round(percentage)}%` : `${Math.round(value)}${unit}`}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
};
