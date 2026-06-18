import React from 'react';
import { useSalesMetrics } from '@/hooks/useSalesMetrics';
import { SalesData } from '@/types/dashboard';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Target, Calendar, CreditCard, ArrowDownRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesMetricCardsGridProps {
  data: SalesData[];
}

const iconMap: Record<string, any> = {
  'DollarSign': DollarSign,
  'ShoppingCart': ShoppingCart,
  'Activity': Activity,
  'Users': Users,
  'Target': Target,
  'Calendar': Calendar,
  'CreditCard': CreditCard,
  'ArrowDownRight': ArrowDownRight,
};

export const SalesMetricCardsGrid: React.FC<SalesMetricCardsGridProps> = ({ data }) => {
  const { metrics } = useSalesMetrics(data);

  // Select 8 key metrics
  const metricOrder = [
    'Sales Revenue',
    'Units Sold',
    'Transactions',
    'Unique Members',
    'Avg Transaction Value',
    'Avg Spend per Member',
    'Discount Value',
    'Discount Percentage'
  ];
  
  const displayMetrics = metricOrder
    .map(title => metrics.find(metric => metric.title === title))
    .filter(Boolean)
    .slice(0, 8);

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayMetrics.map((metric, index) => {
          const Icon = iconMap[metric!.icon] || Activity;
          const change = metric!.change;
          const isPositive = change > 0;
          const isSignificant = Math.abs(change) >= 5;
          
          return (
            <div
              key={index}
              className={cn(
                "group relative rounded-2xl p-6 transition-all duration-500 ease-out",
                "bg-gradient-to-br from-white via-white to-slate-50/50",
                "border border-slate-200/60 hover:border-slate-300",
                "shadow-lg hover:shadow-2xl",
                "hover:scale-[1.03] hover:-translate-y-1",
                "cursor-pointer overflow-hidden",
                "animate-fade-in"
              )}
              style={{
                animationDelay: `${index * 80}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Top gradient accent */}
              <div className={cn(
                "absolute inset-x-0 top-0 h-1 transition-all duration-500",
                "bg-gradient-to-r",
                index % 4 === 0 && "from-blue-500 via-blue-600 to-blue-500",
                index % 4 === 1 && "from-emerald-500 via-emerald-600 to-emerald-500",
                index % 4 === 2 && "from-purple-500 via-purple-600 to-purple-500",
                index % 4 === 3 && "from-amber-500 via-amber-600 to-amber-500",
                "group-hover:h-1.5"
              )} />
              
              {/* Background glow on hover */}
              <div className={cn(
                "absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10",
                "bg-gradient-to-br",
                index % 4 === 0 && "from-blue-500/20 to-cyan-500/20",
                index % 4 === 1 && "from-emerald-500/20 to-teal-500/20",
                index % 4 === 2 && "from-purple-500/20 to-pink-500/20",
                index % 4 === 3 && "from-amber-500/20 to-orange-500/20"
              )} />

              <div className="space-y-4">
                {/* Header with icon and change badge */}
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-3 rounded-xl transition-all duration-500",
                    "bg-gradient-to-br group-hover:scale-110 group-hover:rotate-3",
                    index % 4 === 0 && "from-blue-100 to-blue-200 text-blue-600",
                    index % 4 === 1 && "from-emerald-100 to-emerald-200 text-emerald-600",
                    index % 4 === 2 && "from-purple-100 to-purple-200 text-purple-600",
                    index % 4 === 3 && "from-amber-100 to-amber-200 text-amber-600"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  {isSignificant && (
                    <div className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                      "backdrop-blur-sm transition-all duration-500 group-hover:scale-110",
                      isPositive 
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                        : "bg-red-100 text-red-700 border border-red-200"
                    )}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{Math.abs(change).toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {/* Metric title */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    {metric!.title}
                  </p>
                  <p className={cn(
                    "text-3xl font-black transition-all duration-500",
                    "bg-gradient-to-br bg-clip-text text-transparent",
                    "group-hover:scale-105 transform-gpu",
                    index % 4 === 0 && "from-blue-600 to-blue-800",
                    index % 4 === 1 && "from-emerald-600 to-emerald-800",
                    index % 4 === 2 && "from-purple-600 to-purple-800",
                    index % 4 === 3 && "from-amber-600 to-amber-800"
                  )}>
                    {metric!.value}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {metric!.description}
                </p>

                {/* Comparison bar */}
                {change !== 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">vs Previous</span>
                      <span className={cn(
                        "font-semibold",
                        isPositive ? "text-emerald-600" : "text-red-600"
                      )}>
                        {metric!.previousValue}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          isPositive ? "bg-emerald-500" : "bg-red-500"
                        )}
                        style={{ 
                          width: `${Math.min(Math.abs(change), 100)}%`,
                          transition: 'width 700ms ease-out'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Corner decoration */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-slate-100/50 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
