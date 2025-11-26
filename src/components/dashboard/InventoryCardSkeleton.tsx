import { Skeleton } from "@/components/ui/skeleton";

const InventoryCardSkeleton = () => {
  return (
    <div className="aspect-square min-h-[180px] rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 p-4 flex flex-col">
      {/* Icon skeleton */}
      <Skeleton className="w-10 h-10 rounded-lg mb-3" />
      
      {/* Title skeleton */}
      <Skeleton className="h-5 w-20 mb-3" />
      
      {/* Item skeletons */}
      <div className="space-y-2 flex-1">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryCardSkeleton;
