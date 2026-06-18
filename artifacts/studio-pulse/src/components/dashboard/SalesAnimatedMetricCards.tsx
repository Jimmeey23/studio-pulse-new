import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, CreditCard, Target, Users, Calendar, ArrowDownRight, Activity, ArrowUpRight, Minus } from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { useSalesMetrics } from '@/hooks/useSalesMetrics';
import { shallowEqual } from '@/utils/performanceUtils';

interface SalesAnimatedMetricCardsProps {
  data: SalesData[];
  historicalData?: SalesData[];
  dateRange?: { start: string | Date; end: string | Date };
  onMetricClick?: (metricData: any) => void;
  locationId?: string;
}

const iconMap = {
  DollarSign,
  ShoppingCart,
  CreditCard,
  Target,
  Users,
  Calendar,
  ArrowDownRight,
  Activity,
};

export const SalesAnimatedMetricCardsComponent: React.FC<SalesAnimatedMetricCardsProps> = ({ 
  data,
  historicalData,
  dateRange,
  onMetricClick,
  locationId
}) => {
  const { metrics } = useSalesMetrics(data, historicalData, { dateRange });

  // Take the first 8 metrics for the cards (was 4, now 8)
  const displayMetrics = metrics.slice(0, 8);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {displayMetrics.map((metric, index) => {
        const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || DollarSign;
        const isPositive = metric.change > 0;
        const isNegative = metric.change < 0;

        return (
          <Card
            key={metric.title}
            className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-500",
              "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
              "border border-slate-200 hover:border-slate-800 border-t-4",
              "shadow-md hover:shadow-2xl hover:shadow-slate-950/60",
              "hover:-translate-y-1 hover:scale-[1.01]",
              index % 4 === 0 && "border-t-emerald-500",
              index % 4 === 1 && "border-t-blue-500",
              index % 4 === 2 && "border-t-purple-500",
              index % 4 === 3 && "border-t-rose-500",
              onMetricClick && "hover:cursor-pointer"
            )}
            onClick={() => onMetricClick?.({
              ...metric,
              metricType: metric.title.toLowerCase().replace(/\s+/g, '-'),
              specificData: metric,
              drillDownType: 'metric'
            })}
          >
            <CardContent className="p-5 relative">
              {/* Decorative gradient overlay */}
              <div className={cn(
                "absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500",
                index % 4 === 0 && "bg-gradient-to-br from-emerald-500 to-teal-500",
                index % 4 === 1 && "bg-gradient-to-br from-blue-500 to-cyan-500",
                index % 4 === 2 && "bg-gradient-to-br from-purple-500 to-pink-500",
                index % 4 === 3 && "bg-gradient-to-br from-rose-500 to-orange-500"
              )} />
              
              {/* Background Icon - Enhanced */}
              <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
                <IconComponent className="w-20 h-20 text-slate-900 group-hover:text-white" />
              </div>
              
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-500" 
                   style={{backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px'}} />
              
              {/* Main Content */}
              <div className="relative z-10 space-y-2.5">
                {/* Header Section - Icon and Title */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "p-2.5 rounded-xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md",
                      index % 4 === 0 && "bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 text-emerald-700 group-hover:from-emerald-500/25 group-hover:to-emerald-600/20 group-hover:text-emerald-400 group-hover:shadow-emerald-500/20",
                      index % 4 === 1 && "bg-gradient-to-br from-blue-500/15 to-blue-600/10 text-blue-700 group-hover:from-blue-500/25 group-hover:to-blue-600/20 group-hover:text-blue-400 group-hover:shadow-blue-500/20",
                      index % 4 === 2 && "bg-gradient-to-br from-purple-500/15 to-purple-600/10 text-purple-700 group-hover:from-purple-500/25 group-hover:to-purple-600/20 group-hover:text-purple-400 group-hover:shadow-purple-500/20",
                      index % 4 === 3 && "bg-gradient-to-br from-rose-500/15 to-rose-600/10 text-rose-700 group-hover:from-rose-500/25 group-hover:to-rose-600/20 group-hover:text-rose-400 group-hover:shadow-rose-500/20"
                    )}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={cn(
                        "font-bold text-sm text-slate-700 transition-all duration-500 leading-tight",
                        "group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2",
                        index % 4 === 0 && "group-hover:decoration-emerald-400",
                        index % 4 === 1 && "group-hover:decoration-blue-400",
                        index % 4 === 2 && "group-hover:decoration-purple-400",
                        index % 4 === 3 && "group-hover:decoration-rose-400"
                      )}>
                        {metric.title}
                      </h3>
                      <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-500 mt-0.5 uppercase tracking-wide font-semibold">
                        Current Period
                      </p>
                    </div>
                  </div>
                </div>

                {/* Value with Background Card */}
                <div className={cn(
                  "p-2.5 rounded-lg transition-all duration-500",
                  "bg-slate-50 group-hover:bg-slate-800/30",
                  "border border-slate-100 group-hover:border-slate-700/50"
                )}>
                  <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 tracking-tight">
                    {metric.value}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={cn(
                      "h-0.5 flex-1 rounded-full transition-all duration-500",
                      metric.change > 0 && "bg-emerald-200 group-hover:bg-emerald-500/40",
                      metric.change < 0 && "bg-rose-200 group-hover:bg-rose-500/40",
                      metric.change === 0 && "bg-slate-200 group-hover:bg-slate-500/40"
                    )} />
                    <div className="flex items-center gap-1">
                      {metric.change > 0 && <ArrowUpRight className="w-3 h-3 text-emerald-600 group-hover:text-emerald-400" />}
                      {metric.change < 0 && <ArrowDownRight className="w-3 h-3 text-rose-600 group-hover:text-rose-400" />}
                      {metric.change === 0 && <Minus className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />}
                      <span className={cn(
                        "text-[10px] font-bold transition-colors duration-500",
                        metric.change > 0 && "text-emerald-600 group-hover:text-emerald-400",
                        metric.change < 0 && "text-rose-600 group-hover:text-rose-400",
                        metric.change === 0 && "text-slate-600 group-hover:text-slate-400"
                      )}>
                        {metric.changeDetails.trend}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comparison Metrics - Enhanced Cards */}
                <div className="grid grid-cols-2 gap-2">
                  {/* MoM Card */}
                  <div className={cn(
                    "p-2.5 rounded-lg border transition-all duration-500",
                    "bg-white/50 group-hover:bg-slate-800/20",
                    "border-slate-200 group-hover:border-slate-700/50"
                  )}>
                    <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                      Month over Month
                    </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {metric.previousValue ?? '—'}
                        </span>
                      <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">prev</span>
                    </div>
                      <div className={cn(
                      "inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] tabular-nums transition-all duration-500 min-w-[65px]",
                      metric.change > 0 && "bg-emerald-900/90 text-white group-hover:bg-emerald-800 group-hover:shadow-lg group-hover:shadow-emerald-900/40",
                      metric.change < 0 && "bg-rose-900/90 text-white group-hover:bg-rose-800 group-hover:shadow-lg group-hover:shadow-rose-900/40",
                      metric.change === 0 && "bg-slate-700/90 text-white group-hover:bg-slate-600 group-hover:shadow-lg"
                    )}>
                      {metric.change > 0 && <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />}
                      {metric.change < 0 && <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />}
                      {metric.change === 0 && <Minus className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span>{typeof metric.change === 'number' ? (metric.change > 0 ? '+' : '') + Math.round(metric.change) + '%' : 'N/A'}</span>
                    </div>
                  </div>
                  
                  {/* YoY Card */}
                  {metric.yoyPreviousValue != null ? (
                    <div className={cn(
                      "p-2.5 rounded-lg border transition-all duration-500",
                      "bg-white/50 group-hover:bg-slate-800/20",
                      "border-slate-200 group-hover:border-slate-700/50"
                    )}>
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Year over Year
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {metric.yoyPreviousValue ?? '—'}
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">prev</span>
                      </div>
                      {typeof metric.yoyChange === 'number' && (
                        <div className={cn(
                          "inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] tabular-nums transition-all duration-500 min-w-[65px]",
                          metric.yoyChange > 0 && "bg-emerald-900/90 text-white group-hover:bg-emerald-800 group-hover:shadow-lg group-hover:shadow-emerald-900/40",
                          metric.yoyChange < 0 && "bg-rose-900/90 text-white group-hover:bg-rose-800 group-hover:shadow-lg group-hover:shadow-rose-900/40",
                          metric.yoyChange === 0 && "bg-slate-700/90 text-white group-hover:bg-slate-600 group-hover:shadow-lg"
                        )}>
                          {metric.yoyChange > 0 && <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />}
                          {metric.yoyChange < 0 && <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />}
                          {metric.yoyChange === 0 && <Minus className="w-3.5 h-3.5 flex-shrink-0" />}
                          <span>{typeof metric.yoyChange === 'number' ? (metric.yoyChange > 0 ? '+' : '') + Math.round(metric.yoyChange) + '%' : 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={cn(
                      "p-2.5 rounded-lg border transition-all duration-500 flex items-center justify-center",
                      "bg-slate-50/50 group-hover:bg-slate-800/10",
                      "border-slate-200 group-hover:border-slate-700/30"
                    )}>
                      <span className="text-[9px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500 font-semibold">
                        No YoY Data
                      </span>
                    </div>
                  )}
                </div>

                {/* Description Footer with Enhanced Side Border */}
                <div className={cn(
                  "relative pt-1.5 border-l-3 pl-3 transition-all duration-500",
                  "before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:rounded-r-full before:transition-all before:duration-500",
                  index % 4 === 0 && "border-l-emerald-500/50 group-hover:border-l-emerald-400 before:bg-emerald-500/20 group-hover:before:bg-emerald-400/30",
                  index % 4 === 1 && "border-l-blue-500/50 group-hover:border-l-blue-400 before:bg-blue-500/20 group-hover:before:bg-blue-400/30",
                  index % 4 === 2 && "border-l-purple-500/50 group-hover:border-l-purple-400 before:bg-purple-500/20 group-hover:before:bg-purple-400/30",
                  index % 4 === 3 && "border-l-rose-500/50 group-hover:border-l-rose-400 before:bg-rose-500/20 group-hover:before:bg-rose-400/30"
                )}>
                  <p className="text-xs text-slate-600 group-hover:text-slate-300 leading-snug transition-colors duration-500 line-clamp-2 font-medium">
                    {metric.description}
                  </p>
                </div>

                {/* Additional Info - Hidden by default, shown on hover */}
                <div className={cn(
                  "pt-2 space-y-2 border-t transition-all duration-500 overflow-hidden",
                  "max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100",
                  index % 4 === 0 && "border-emerald-200 group-hover:border-emerald-500/30",
                  index % 4 === 1 && "border-blue-200 group-hover:border-blue-500/30",
                  index % 4 === 2 && "border-purple-200 group-hover:border-purple-500/30",
                  index % 4 === 3 && "border-rose-200 group-hover:border-rose-500/30"
                )}>
                  {/* Trend Info */}
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Trend:</span>
                      <span className="text-white font-semibold">{metric.changeDetails.trend}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Difference:</span>
                      <span className="text-white font-semibold">{formatCurrency(Math.abs(metric.comparison.difference))}</span>
                    </div>
                    {metric.yoyChangeDetails && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">YoY Trend:</span>
                        <span className="text-white font-semibold">{metric.yoyChangeDetails.trend}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Memoized export with custom comparison function
export const SalesAnimatedMetricCards = React.memo(
  SalesAnimatedMetricCardsComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      shallowEqual(prevProps.historicalData, nextProps.historicalData) &&
      shallowEqual(prevProps.dateRange, nextProps.dateRange) &&
      prevProps.onMetricClick === nextProps.onMetricClick &&
      prevProps.locationId === nextProps.locationId
    );
  }
);

export default SalesAnimatedMetricCards;
