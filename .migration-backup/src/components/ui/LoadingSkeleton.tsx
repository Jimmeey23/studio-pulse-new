
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  type: 'metric-cards' | 'table' | 'chart' | 'full-page';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type, count = 4 }) => {
  switch (type) {
    case 'metric-cards':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <Card key={i} className="bg-white/95 backdrop-blur-md shadow-2xl border-0 overflow-hidden group hover:shadow-3xl transition-all duration-500" style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            }}>
              {/* Subtle shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000 ease-out" />
              
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24 bg-gradient-to-r from-slate-200 to-slate-300" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-16 bg-gradient-to-r from-slate-300 to-slate-400" />
                <Skeleton className="h-3 w-full bg-gradient-to-r from-slate-200 to-slate-300" />
                <Skeleton className="h-3 w-3/4 bg-gradient-to-r from-slate-200 to-slate-300" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
      
    case 'table':
      return (
        <Card className="bg-white/95 backdrop-blur-md shadow-2xl border-0 overflow-hidden group" style={{
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
        }}>
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000 ease-out" />
          
          <CardHeader>
            <Skeleton className="h-6 w-48 bg-gradient-to-r from-slate-300 to-slate-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex space-x-3">
                <Skeleton className="h-8 w-full bg-gradient-to-r from-slate-200 to-slate-300" style={{ animationDelay: `${i * 0.1}s` }} />
              </div>
            ))}
          </CardContent>
        </Card>
      );
      
    case 'chart':
      return (
        <Card className="bg-white/95 backdrop-blur-md shadow-2xl border-0 overflow-hidden group" style={{
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
        }}>
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000 ease-out" />
          
          <CardHeader>
            <Skeleton className="h-6 w-32 bg-gradient-to-r from-slate-300 to-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Skeleton className="h-64 w-full bg-gradient-to-br from-slate-200 via-slate-250 to-slate-300 rounded-lg" />
              {/* Simulated chart elements */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end space-x-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    className="w-8 bg-gradient-to-t from-blue-200 to-indigo-300" 
                    style={{ 
                      height: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '2s'
                    }} 
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
      
    case 'full-page':
      return (
        <div className="space-y-8">
          <LoadingSkeleton type="metric-cards" count={8} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton type="chart" />
            <LoadingSkeleton type="chart" />
          </div>
          <LoadingSkeleton type="table" />
        </div>
      );
      
    default:
      return <Skeleton className="h-32 w-full" />;
  }
};
