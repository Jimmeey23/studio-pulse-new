import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Chart skeleton component
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <Card className="w-full">
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className="w-full rounded-lg" style={{ height }} />
    </CardContent>
  </Card>
);

// Table skeleton component
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number;
  showHeader?: boolean;
}> = ({ 
  rows = 5, 
  columns = 4, 
  showHeader = true 
}) => (
  <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
    {showHeader && (
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-4 border-b">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 bg-slate-700" />
          ))}
        </div>
      </div>
    )}
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Metric card skeleton
export const MetricCardSkeleton: React.FC = () => (
  <Card className="p-6">
    <div className="flex items-center space-x-2">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-24" />
    </div>
    <Skeleton className="h-8 w-20 mt-2" />
    <Skeleton className="h-4 w-16 mt-2" />
  </Card>
);

// Dashboard grid skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    {/* Metrics Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Charts Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <ChartSkeleton key={i} />
      ))}
    </div>
    
    {/* Large Chart */}
    <ChartSkeleton height={400} />
    
    {/* Data Table */}
    <TableSkeleton rows={8} columns={6} />
  </div>
);

// Progressive loading wrapper
export const ProgressiveLoader: React.FC<{
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}> = ({ isLoading, skeleton, children, delay = 0 }) => {
  const [showSkeleton, setShowSkeleton] = React.useState(isLoading);

  React.useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true);
    } else {
      const timer = setTimeout(() => setShowSkeleton(false), delay);
      return () => clearTimeout(timer);
    }
  }, [isLoading, delay]);

  return (
    <div className="relative">
      {showSkeleton ? skeleton : children}
    </div>
  );
};

// Staggered loading animation
export const StaggeredLoader: React.FC<{
  items: React.ReactNode[];
  isLoading: boolean;
  staggerDelay?: number;
}> = ({ items, isLoading, staggerDelay = 100 }) => {
  const [visibleItems, setVisibleItems] = React.useState<number>(0);

  React.useEffect(() => {
    if (!isLoading) {
      const timer = setInterval(() => {
        setVisibleItems(prev => {
          const next = prev + 1;
          if (next >= items.length) {
            clearInterval(timer);
            return items.length;
          }
          return next;
        });
      }, staggerDelay);

      return () => clearInterval(timer);
    } else {
      setVisibleItems(0);
    }
  }, [isLoading, items.length, staggerDelay]);

  return (
    <>
      {items.map((item, index) => (
        <div
          key={index}
          className={`transition-all duration-300 ${
            index < visibleItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: `${index * staggerDelay}ms` }}
        >
          {item}
        </div>
      ))}
    </>
  );
};