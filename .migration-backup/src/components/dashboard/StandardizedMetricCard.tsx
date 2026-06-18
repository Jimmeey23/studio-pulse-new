import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface StandardizedMetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  color?: 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'sky' | 'indigo' | 'pink';
  subtitle?: string;
}

const colorMap = {
  emerald: {
    bg: 'from-emerald-500 to-teal-500',
    text: 'text-emerald-700',
    icon: 'bg-emerald-500/15',
    badge: 'text-emerald-600',
    hover: 'hover:from-emerald-600 hover:to-teal-600'
  },
  blue: {
    bg: 'from-blue-500 to-cyan-500',
    text: 'text-blue-700',
    icon: 'bg-blue-500/15',
    badge: 'text-blue-600',
    hover: 'hover:from-blue-600 hover:to-cyan-600'
  },
  purple: {
    bg: 'from-purple-500 to-pink-500',
    text: 'text-purple-700',
    icon: 'bg-purple-500/15',
    badge: 'text-purple-600',
    hover: 'hover:from-purple-600 hover:to-pink-600'
  },
  rose: {
    bg: 'from-rose-500 to-orange-500',
    text: 'text-rose-700',
    icon: 'bg-rose-500/15',
    badge: 'text-rose-600',
    hover: 'hover:from-rose-600 hover:to-orange-600'
  },
  amber: {
    bg: 'from-amber-500 to-orange-500',
    text: 'text-amber-700',
    icon: 'bg-amber-500/15',
    badge: 'text-amber-600',
    hover: 'hover:from-amber-600 hover:to-orange-600'
  },
  sky: {
    bg: 'from-sky-500 to-blue-500',
    text: 'text-sky-700',
    icon: 'bg-sky-500/15',
    badge: 'text-sky-600',
    hover: 'hover:from-sky-600 hover:to-blue-600'
  },
  indigo: {
    bg: 'from-indigo-500 to-purple-500',
    text: 'text-indigo-700',
    icon: 'bg-indigo-500/15',
    badge: 'text-indigo-600',
    hover: 'hover:from-indigo-600 hover:to-purple-600'
  },
  pink: {
    bg: 'from-pink-500 to-rose-500',
    text: 'text-pink-700',
    icon: 'bg-pink-500/15',
    badge: 'text-pink-600',
    hover: 'hover:from-pink-600 hover:to-rose-600'
  }
};

export const StandardizedMetricCard: React.FC<StandardizedMetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = 'blue',
  subtitle
}) => {
  const colors = colorMap[color];
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card className={cn(
      'group relative overflow-hidden cursor-pointer transition-all duration-500',
      'bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950',
      'border border-slate-200 hover:border-slate-800 border-t-4',
      'shadow-md hover:shadow-2xl hover:shadow-slate-950/60',
      'hover:-translate-y-1 hover:scale-[1.01]',
      color === 'emerald' && 'border-t-emerald-500',
      color === 'blue' && 'border-t-blue-500',
      color === 'purple' && 'border-t-purple-500',
      color === 'rose' && 'border-t-rose-500',
      color === 'amber' && 'border-t-amber-500',
      color === 'sky' && 'border-t-sky-500',
      color === 'indigo' && 'border-t-indigo-500',
      color === 'pink' && 'border-t-pink-500'
    )}>
      <CardContent className="p-5 relative">
        {/* Decorative gradient overlay */}
        <div className={cn(
          'absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500',
          `bg-gradient-to-br ${colors.bg}`
        )} />

        {/* Background Icon */}
        <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
          {Icon && <Icon className="w-20 h-20 text-slate-900 group-hover:text-white" />}
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-2.5">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              {Icon && (
                <div className={cn(
                  'p-2.5 rounded-xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md',
                  colors.icon,
                  colors.text,
                  'group-hover:text-white group-hover:shadow-lg'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className={cn(
                  'font-bold text-sm text-slate-700 transition-all duration-500 leading-tight',
                  'group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2'
                )}>
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-500 mt-0.5 uppercase tracking-wide font-semibold">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Value with Background Card */}
          <div className={cn(
            'p-2.5 rounded-lg transition-all duration-500',
            'bg-slate-50 group-hover:bg-slate-800/30',
            'border border-slate-100 group-hover:border-slate-700/50'
          )}>
            <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 tracking-tight font-mono">
              {value}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  'h-0.5 flex-1 rounded-full transition-all duration-500',
                  isPositive && 'bg-emerald-200 group-hover:bg-emerald-500/40',
                  isNegative && 'bg-rose-200 group-hover:bg-rose-500/40',
                  !isPositive && !isNegative && 'bg-slate-200 group-hover:bg-slate-500/40'
                )} />
                <div className="flex items-center gap-1">
                  {isPositive && <TrendingUp className="w-3 h-3 text-emerald-600 group-hover:text-emerald-400" />}
                  {isNegative && <TrendingDown className="w-3 h-3 text-rose-600 group-hover:text-rose-400" />}
                  {!isPositive && !isNegative && <Minus className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />}
                  <span className={cn(
                    'text-[10px] font-bold transition-colors duration-500',
                    isPositive && 'text-emerald-600 group-hover:text-emerald-400',
                    isNegative && 'text-rose-600 group-hover:text-rose-400',
                    !isPositive && !isNegative && 'text-slate-600 group-hover:text-slate-400'
                  )}>
                    {Math.abs(change).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
