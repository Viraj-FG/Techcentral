import { motion } from "framer-motion";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

interface TetheredTagProps {
  label: string;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  confidence?: number;
}

export const TetheredTag = ({ label, position, targetPosition, confidence }: TetheredTagProps) => {
  const lineLength = Math.sqrt(
    Math.pow(position.x - targetPosition.x, 2) + 
    Math.pow(position.y - targetPosition.y, 2)
  );

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: targetPosition.x, top: targetPosition.y }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={kaevaTransition}
    >
      {/* Dot at object center */}
      <div className="absolute w-3 h-3 bg-secondary rounded-full shadow-lg shadow-secondary/50 -translate-x-1/2 -translate-y-1/2" />
      
      {/* Connecting line */}
      <svg 
        className="absolute -translate-x-1/2 -translate-y-1/2"
        width={Math.abs(position.x - targetPosition.x) + 20}
        height={Math.abs(position.y - targetPosition.y) + 20}
        style={{
          left: position.x > targetPosition.x ? 0 : -(position.x - targetPosition.x),
          top: position.y > targetPosition.y ? 0 : -(position.y - targetPosition.y),
        }}
      >
        <line 
          x1={position.x > targetPosition.x ? 0 : position.x - targetPosition.x}
          y1={position.y > targetPosition.y ? 0 : position.y - targetPosition.y}
          x2={position.x > targetPosition.x ? position.x - targetPosition.x : 0}
          y2={position.y > targetPosition.y ? position.y - targetPosition.y : 0}
          stroke="rgba(112, 224, 152, 0.5)"
          strokeWidth="1.5"
        />
      </svg>
      
      {/* Glass label pill */}
      <div 
        className="glass-card px-4 py-2 rounded-full flex items-center gap-2 absolute"
        style={{
          left: position.x - targetPosition.x,
          top: position.y - targetPosition.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <span className="text-sm font-medium text-white whitespace-nowrap">{label}</span>
        {confidence && (
          <span className="text-xs text-secondary text-data">
            {Math.round(confidence * 100)}%
          </span>
        )}
      </div>
    </motion.div>
  );
};
