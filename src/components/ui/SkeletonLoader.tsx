import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  variant?: "card" | "text" | "circle" | "rect";
  count?: number;
  animated?: boolean;
}

export const SkeletonLoader = ({ 
  className, 
  variant = "rect",
  count = 1,
  animated = true 
}: SkeletonLoaderProps) => {
  const baseClasses = "bg-white/5 relative overflow-hidden";
  
  const variantClasses = {
    card: "rounded-2xl h-32 w-full",
    text: "rounded h-4 w-full",
    circle: "rounded-full h-12 w-12",
    rect: "rounded-lg h-24 w-full"
  };

  const shimmerAnimation = {
    animate: {
      backgroundPosition: ["200% 0", "-200% 0"]
    },
    transition: {
      duration: 2,
      ease: "linear",
      repeat: Infinity
    }
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      className={cn(
        baseClasses,
        variantClasses[variant],
        animated && "skeleton-shimmer",
        className
      )}
      initial={{ opacity: 0.4 }}
      animate={animated ? { opacity: [0.4, 0.6, 0.4] } : { opacity: 0.4 }}
      transition={animated ? {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 0.1
      } : undefined}
    >
      {animated && (
        <motion.div
          className="absolute inset-0 skeleton-gradient"
          animate={shimmerAnimation.animate}
          transition={shimmerAnimation.transition}
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
            backgroundSize: "200% 100%"
          }}
        />
      )}
    </motion.div>
  ));

  return count === 1 ? skeletons[0] : <div className="space-y-4">{skeletons}</div>;
};

export const InventoryCardSkeleton = () => (
  <div className="glass-card p-4 rounded-2xl space-y-3">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <SkeletonLoader variant="text" className="w-3/4 h-5" />
        <SkeletonLoader variant="text" className="w-1/2 h-3" />
      </div>
      <SkeletonLoader variant="circle" className="w-10 h-10" />
    </div>
    <SkeletonLoader variant="rect" className="h-2 w-full rounded-full" />
    <div className="flex gap-2">
      <SkeletonLoader variant="text" className="w-20 h-8 rounded-lg" />
      <SkeletonLoader variant="text" className="w-24 h-8 rounded-lg" />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    {/* Welcome Banner Skeleton */}
    <SkeletonLoader variant="card" className="h-24" />
    
    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-2 gap-4">
      <SkeletonLoader variant="card" className="h-28" />
      <SkeletonLoader variant="card" className="h-28" />
    </div>

    {/* Inventory Cards Skeleton */}
    <div className="space-y-4">
      <SkeletonLoader variant="text" className="w-32 h-6" />
      <InventoryCardSkeleton />
      <InventoryCardSkeleton />
      <InventoryCardSkeleton />
    </div>
  </div>
);
