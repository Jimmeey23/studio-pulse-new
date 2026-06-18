import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { BarChart3, Users, CreditCard, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { shallowEqual } from '@/utils/performanceUtils';

export interface MetricCardData {
  title: string;
  value: string | number;
  change?: number;
  description?: string;
  icon?: 'revenue' | 'members' | 'transactions' | 'target';
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
}

interface MetricCardProps {
  data: MetricCardData;
  onClick?: () => void;
}

const MetricCardComponent: React.FC<MetricCardProps> = ({ 
  data, 
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [animatedValue, setAnimatedValue] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const delay = data.delay || 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof data.value === 'number') {
        setIsAnimating(true);
        const duration = 1500;
        const steps = 60;
        const stepValue = data.value / steps;
        let current = 0;

        const interval = setInterval(() => {
          current += stepValue;
          if (current >= (data.value as number)) {
            setAnimatedValue(data.value as number);
            setIsAnimating(false);
            clearInterval(interval);
          } else {
            setAnimatedValue(current);
          }
        }, duration / steps);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [data.value, delay]);

  const isPositiveChange = data.change && data.change > 0;
  const isNegativeChange = data.change && data.change < 0;

  const getIcon = () => {
    switch (data.icon) {
      case 'revenue':
        return <BarChart3 className="w-5 h-5 text-emerald-600 group-hover:text-white transition-all duration-700 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />;
      case 'members':
        return <Users className="w-5 h-5 text-blue-600 group-hover:text-white transition-all duration-700 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />;
      case 'transactions':
        return <CreditCard className="w-5 h-5 text-cyan-600 group-hover:text-white transition-all duration-700 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />;
      default:
        return <Target className="w-5 h-5 text-orange-600 group-hover:text-white transition-all duration-700 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={cn(
              "relative overflow-hidden transition-all duration-700 cursor-pointer group",
              "bg-gradient-to-br from-white via-slate-50/30 to-white backdrop-blur-sm",
              "border border-slate-200/60 shadow-lg hover:shadow-2xl hover:shadow-slate-900/10",
              "hover:scale-[1.02] hover:-translate-y-3 transform-gpu",
              "rounded-2xl hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-800 hover:to-black",
              "hover:border-slate-700/50 hover:text-white",
              "before:absolute before:inset-0 before:bg-gradient-to-br before:from-transparent before:via-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-700",
              isAnimating && "animate-pulse"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
          >
            <CardContent className="p-0">
              {/* Decorative blue gradient top border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 group-hover:from-blue-400 group-hover:via-white group-hover:to-blue-400 transition-all duration-500" />
              
              {/* Main content area */}
              <div className="p-6 relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "p-3 rounded-2xl transition-all duration-700 border backdrop-blur-sm",
                      "bg-gradient-to-br from-blue-50/80 via-white/50 to-slate-100/80 border-blue-200/50 shadow-sm",
                      "group-hover:bg-gradient-to-br group-hover:from-white/20 group-hover:via-white/10 group-hover:to-white/5",
                      "group-hover:border-white/30 group-hover:shadow-lg group-hover:shadow-white/20"
                    )}>
                      {getIcon()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-700 group-hover:text-white/95 transition-colors duration-700 tracking-wide">
                        {data.title}
                      </h3>
                    </div>
                  </div>
                </div>
                
                {/* Premium trend badge */}
                {data.change !== undefined && (
                  <div className={cn(
                    "flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-700 border backdrop-blur-sm shadow-sm mt-5",
                    isPositiveChange
                      ? "bg-gradient-to-r from-emerald-50/90 via-emerald-100/60 to-green-50/90 text-emerald-700 border-emerald-300/60 group-hover:bg-gradient-to-r group-hover:from-emerald-400/30 group-hover:to-green-400/20 group-hover:text-emerald-100 group-hover:border-emerald-300/40 group-hover:shadow-emerald-400/20"
                      : isNegativeChange
                      ? "bg-gradient-to-r from-red-50/90 via-red-100/60 to-rose-50/90 text-red-700 border-red-300/60 group-hover:bg-gradient-to-r group-hover:from-red-400/30 group-hover:to-rose-400/20 group-hover:text-red-100 group-hover:border-red-300/40 group-hover:shadow-red-400/20"
                      : "bg-gradient-to-r from-blue-50/90 via-blue-100/60 to-slate-50/90 text-blue-700 border-blue-300/60 group-hover:bg-gradient-to-r group-hover:from-blue-400/30 group-hover:to-slate-400/20 group-hover:text-blue-100 group-hover:border-blue-300/40 group-hover:shadow-blue-400/20"
                  )}>
                    {isPositiveChange && <TrendingUp className="w-3 h-3" />}
                    {isNegativeChange && <TrendingDown className="w-3 h-3" />}
                    <span>
                      {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
                    </span>
                  </div>
                )}

                {/* Premium value display */}
                <div className="space-y-3 mt-6">
                  <p className={cn(
                    "text-4xl font-light text-transparent bg-clip-text transition-all duration-700",
                    "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900",
                    "group-hover:from-white group-hover:via-slate-100 group-hover:to-white",
                    "group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] tracking-tight leading-none"
                  )}>
                    {typeof data.value === 'number' 
                      ? Math.round(animatedValue).toLocaleString() 
                      : data.value
                    }
                  </p>
                </div>

                {/* Subtle background accent */}
                <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-15 transition-all duration-700">
                  <div className="w-10 h-10 text-slate-300 group-hover:text-white/40">
                    {getIcon()}
                  </div>
                </div>
              </div>
              
              {/* Premium description section */}
              {data.description && (
                <div className={cn(
                  "p-5 border-t border-slate-200/50 transition-all duration-700 border-l-4 backdrop-blur-sm",
                  "bg-gradient-to-br from-slate-100/80 via-slate-200/40 to-slate-100/60",
                  "group-hover:bg-gradient-to-br group-hover:from-slate-800/90 group-hover:via-slate-700/80 group-hover:to-slate-900/90",
                  "group-hover:border-t-white/10",
                  // Dynamic left border colors with glow effects
                  data.icon === 'revenue' && "border-l-emerald-400/70 group-hover:border-l-emerald-400 group-hover:shadow-[inset_4px_0_8px_rgba(52,211,153,0.3)]",
                  data.icon === 'members' && "border-l-blue-600/70 group-hover:border-l-blue-500 group-hover:shadow-[inset_4px_0_8px_rgba(59,130,246,0.3)]",
                  data.icon === 'transactions' && "border-l-cyan-400/70 group-hover:border-l-cyan-400 group-hover:shadow-[inset_4px_0_8px_rgba(34,211,238,0.3)]",
                  data.icon === 'target' && "border-l-orange-400/70 group-hover:border-l-orange-400 group-hover:shadow-[inset_4px_0_8px_rgba(251,146,60,0.3)]",
                  !data.icon && "border-l-blue-400/70 group-hover:border-l-blue-400 group-hover:shadow-[inset_4px_0_8px_rgba(59,130,246,0.3)]"
                )}>
                  <p className="text-xs text-slate-600 group-hover:text-slate-100 leading-relaxed transition-colors duration-700 font-medium">
                    {data.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm p-3 bg-white border shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getIcon()}
              <h4 className="font-semibold text-slate-800 text-sm">{data.title}</h4>
            </div>
            <p className="text-xs text-slate-600">{data.description}</p>
            <p className="text-xs text-slate-500 font-medium">Click for detailed analytics</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Memoize component with custom comparison
export const MetricCard = React.memo(
  MetricCardComponent,
  (prevProps, nextProps) => {
    return (
      shallowEqual(prevProps.data, nextProps.data) &&
      prevProps.onClick === nextProps.onClick
    );
  }
);