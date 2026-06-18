import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Standardized Executive Metric Display
 * 
 * Ensures consistent styling and layout across all Executive sections.
 * Handles number formatting, tooltips, and interactive drill-down capability.
 */

interface MetricItem {
  label: string;
  value: string | number;
  unit?: string;
  color?: 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'sky' | 'indigo' | 'pink';
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  tooltip?: string;
  onClick?: () => void;
}

interface ExecutiveMetricsContainerProps {
  title: string;
  metrics: MetricItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const colorBgMap = {
  emerald: 'from-emerald-50/50 to-emerald-100/30',
  blue: 'from-blue-50/50 to-blue-100/30',
  purple: 'from-purple-50/50 to-purple-100/30',
  rose: 'from-rose-50/50 to-rose-100/30',
  amber: 'from-amber-50/50 to-amber-100/30',
  sky: 'from-sky-50/50 to-sky-100/30',
  indigo: 'from-indigo-50/50 to-indigo-100/30',
  pink: 'from-pink-50/50 to-pink-100/30',
};

const colorBorderMap = {
  emerald: 'border-emerald-500/30 hover:border-emerald-500/60',
  blue: 'border-blue-500/30 hover:border-blue-500/60',
  purple: 'border-purple-500/30 hover:border-purple-500/60',
  rose: 'border-rose-500/30 hover:border-rose-500/60',
  amber: 'border-amber-500/30 hover:border-amber-500/60',
  sky: 'border-sky-500/30 hover:border-sky-500/60',
  indigo: 'border-indigo-500/30 hover:border-indigo-500/60',
  pink: 'border-pink-500/30 hover:border-pink-500/60',
};

const colorIconMap = {
  emerald: 'text-emerald-700',
  blue: 'text-blue-700',
  purple: 'text-purple-700',
  rose: 'text-rose-700',
  amber: 'text-amber-700',
  sky: 'text-sky-700',
  indigo: 'text-indigo-700',
  pink: 'text-pink-700',
};

const colorTextMap = {
  emerald: 'text-emerald-900',
  blue: 'text-blue-900',
  purple: 'text-purple-900',
  rose: 'text-rose-900',
  amber: 'text-amber-900',
  sky: 'text-sky-900',
  indigo: 'text-indigo-900',
  pink: 'text-pink-900',
};

export const ExecutiveMetricsContainer: React.FC<ExecutiveMetricsContainerProps> = ({
  title,
  metrics,
  columns = 4,
  className,
}) => {
  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6',
  }[columns];

  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-semibold text-slate-700 mb-4 px-1">
          {title}
        </h3>
      )}
      
      <div className={cn('grid gap-4', gridClass)}>
        {metrics.map((metric, idx) => {
          const bgGradient = metric.color ? colorBgMap[metric.color as keyof typeof colorBgMap] : colorBgMap['blue'];
          const borderColor = metric.color ? colorBorderMap[metric.color as keyof typeof colorBorderMap] : colorBorderMap['blue'];
          const iconColor = metric.color ? colorIconMap[metric.color as keyof typeof colorIconMap] : colorIconMap['blue'];
          const textColor = metric.color ? colorTextMap[metric.color as keyof typeof colorTextMap] : colorTextMap['blue'];

          return (
            <TooltipProvider key={`metric-${idx}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    className={cn(
                      'group relative overflow-hidden transition-all duration-300',
                      'border-l-4 bg-white',
                      'hover:shadow-md hover:scale-[1.02]',
                      borderColor,
                      metric.onClick && 'cursor-pointer'
                    )}
                    onClick={metric.onClick}
                  >
                    {/* Background gradient */}
                    <div
                      className={cn(
                        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                        `bg-gradient-to-br ${bgGradient}`
                      )}
                    />

                    <CardContent className="p-4 relative z-10">
                      {/* Label + Tooltip Icon */}
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          {metric.label}
                        </p>
                        {metric.tooltip && (
                          <HelpCircle className={cn('h-3.5 w-3.5 opacity-50 group-hover:opacity-100', iconColor)} />
                        )}
                      </div>

                      {/* Value */}
                      <div className="mb-3">
                        <p className={cn('text-2xl font-bold', textColor)}>
                          {metric.value}
                        </p>
                        {metric.unit && (
                          <p className="text-xs text-slate-500 mt-1">{metric.unit}</p>
                        )}
                      </div>

                      {/* Trend indicator */}
                      {metric.trend !== undefined && (
                        <div
                          className={cn(
                            'text-xs font-semibold',
                            metric.trendDirection === 'up' && 'text-emerald-600',
                            metric.trendDirection === 'down' && 'text-rose-600',
                            metric.trendDirection === 'neutral' && 'text-slate-500'
                          )}
                        >
                          {metric.trendDirection === 'up' && '↑'}{' '}
                          {metric.trendDirection === 'down' && '↓'}{' '}
                          {metric.trend.toFixed(1)}%{' '}
                          {metric.trendDirection === 'neutral' && 'no change'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                {metric.tooltip && (
                  <TooltipContent side="top" className="max-w-xs">
                    <p>{metric.tooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};
