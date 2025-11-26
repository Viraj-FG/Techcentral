import { Skeleton } from "@/components/ui/skeleton";

const AIInsightsWidgetSkeleton = () => {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 min-h-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      {/* Insight cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIInsightsWidgetSkeleton;
