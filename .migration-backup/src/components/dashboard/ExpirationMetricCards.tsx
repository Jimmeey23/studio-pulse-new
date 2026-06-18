import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { ExpirationData } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { useExpirationMetrics } from '@/hooks/useExpirationMetrics';

interface ExpirationMetricCardsProps {
  data: ExpirationData[];
  historicalData?: ExpirationData[];
  dateRange?: { start?: string | Date; end?: string | Date };
  onMetricClick?: (data: ExpirationData[], type: string) => void;
}

const iconMap = {
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
};

export const ExpirationMetricCards: React.FC<ExpirationMetricCardsProps> = ({ 
  data,
  historicalData,
  dateRange,
  onMetricClick 
}) => {
  const { metrics } = useExpirationMetrics(data, historicalData, { dateRange });

  const getFilteredData = (metric: any) => {
    if (metric.title === 'Active Members') return data.filter(item => item.status === 'Active');
    if (metric.title === 'Churned Members') return data.filter(item => item.status === 'Churned');
    if (metric.title === 'Frozen Members') return data.filter(item => item.status === 'Frozen');
    return data;
  };

  // Take the first 8 metrics for the cards (matching Sales tab layout)
  const displayMetrics = metrics.slice(0, 8);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {displayMetrics.map((metric, index) => {
        const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || Users;
        const isPositive = metric.change > 0;
        const isNegative = metric.change < 0;

        return (
          <Card
            key={metric.title}
            className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-700",
              "bg-white hover:bg-gradient-to-br hover:from-gray-900 hover:via-slate-900 hover:to-slate-900",
              index % 4 === 0 && "border-t-4 border-green-700 hover:border-green-700 shadow-lg",
              index % 4 === 1 && "border-t-4 border-blue-700 hover:border-blue-700 shadow-lg",
              index % 4 === 2 && "border-t-4 border-pink-700 hover:border-pink-700 shadow-lg", 
              index % 4 === 3 && "border-t-4 border-red-700 hover:border-red-700 shadow-lg",
              "hover:shadow-2xl hover:shadow-slate-900/30",
              "hover:-translate-y-2 hover:scale-[1.02]",
              onMetricClick && "hover:cursor-pointer"
            )}
            onClick={() => {
              const filteredData = getFilteredData(metric);
              onMetricClick?.(filteredData, metric.title.toLowerCase());
            }}
          >
            <CardContent className="p-6 relative">
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-all duration-700">
                <IconComponent className={cn(
                  "w-12 h-12 transition-all duration-700",
                  index % 4 === 0 && "text-green-700",
                  index % 4 === 1 && "text-blue-700",
                  index % 4 === 2 && "text-pink-700",
                  index % 4 === 3 && "text-red-700",
                  "group-hover:text-white/40"
                )} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "p-4 rounded-2xl transition-all duration-700 border-1 shadow-md",
                      index % 4 === 0 && "bg-gradient-to-br from-green-700 to-green-600 border-green-900 text-white shadow-green-200",
                      index % 4 === 1 && "bg-gradient-to-br from-blue-700 to-blue-600 border-blue-900 text-white shadow-blue-200",
                      index % 4 === 2 && "bg-gradient-to-br from-pink-700 to-pink-600 border-pink-900 text-white shadow-pink-200",
                      index % 4 === 3 && "bg-gradient-to-br from-red-700 to-red-600 border-red-900 text-white shadow-red-200",
                      "group-hover:bg-white/20 group-hover:border-white/40 group-hover:text-white group-hover:shadow-white/20"
                    )}>
                      <IconComponent className="w-6 h-6 drop-shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-slate-900 group-hover:text-white/95 transition-colors duration-700">
                        {metric.title}
                      </h3>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-700",
                    isPositive
                      ? "bg-green-50 text-green-700 group-hover:bg-green-400/30 group-hover:text-green-100"
                      : isNegative
                      ? "bg-red-50 text-red-700 group-hover:bg-red-400/30 group-hover:text-red-100"
                      : "bg-blue-50 text-blue-700 group-hover:bg-blue-400/30 group-hover:text-blue-100"
                  )}>
                    {isPositive && <TrendingUp className="w-3 h-3" />}
                    {isNegative && <TrendingDown className="w-3 h-3" />}
                    <span>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className={cn(
                    "text-4xl font-bold transition-all duration-700 text-slate-900 group-hover:text-white"
                  )}>
                    {metric.value}
                  </p>
                  <p className={cn(
                    "text-xs text-slate-500 group-hover:text-slate-200 transition-colors"
                  )}>
                    {metric.periodLabel ? (
                      <>
                        {metric.periodLabel}: <span className="font-medium">{metric.previousValue}</span>
                      </>
                    ) : (
                      <>vs previous month: <span className="font-medium">{metric.previousValue}</span></>
                    )}
                  </p>
                </div>
              </div>
              
              <div className={cn(
                "mt-4 p-3 border-t border-l-4 transition-all duration-700",
                "bg-slate-50 group-hover:bg-slate-800/50 border-t-slate-200 group-hover:border-t-white/10",
                index % 4 === 0 && "border-l-green-700",
                index % 4 === 1 && "border-l-blue-700",
                index % 4 === 2 && "border-l-pink-700",
                index % 4 === 3 && "border-l-red-700"
              )}>
                <p className="text-xs text-slate-900 group-hover:text-white transition-colors duration-700">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};