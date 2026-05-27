export function LoadingSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted rounded"></div>
        <div className="h-8 w-64 bg-muted rounded"></div>
      </div>
      
      {/* Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 rounded-2xl bg-muted/60"></div>
        ))}
      </div>
      
      {/* List skeleton */}
      <div className="space-y-3 mt-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-muted/40"></div>
        ))}
      </div>
    </div>
  );
}
