import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutiveSectionCardProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  borderColor?: 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'sky' | 'indigo' | 'pink';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const borderColorMap = {
  emerald: 'border-l-emerald-500',
  blue: 'border-l-blue-500',
  purple: 'border-l-purple-500',
  rose: 'border-l-rose-500',
  amber: 'border-l-amber-500',
  sky: 'border-l-sky-500',
  indigo: 'border-l-indigo-500',
  pink: 'border-l-pink-500',
};

const iconBgMap = {
  emerald: 'bg-emerald-500/15 text-emerald-700',
  blue: 'bg-blue-500/15 text-blue-700',
  purple: 'bg-purple-500/15 text-purple-700',
  rose: 'bg-rose-500/15 text-rose-700',
  amber: 'bg-amber-500/15 text-amber-700',
  sky: 'bg-sky-500/15 text-sky-700',
  indigo: 'bg-indigo-500/15 text-indigo-700',
  pink: 'bg-pink-500/15 text-pink-700',
};

const gradientMap = {
  emerald: 'from-emerald-50 to-emerald-100/50',
  blue: 'from-blue-50 to-blue-100/50',
  purple: 'from-purple-50 to-purple-100/50',
  rose: 'from-rose-50 to-rose-100/50',
  amber: 'from-amber-50 to-amber-100/50',
  sky: 'from-sky-50 to-sky-100/50',
  indigo: 'from-indigo-50 to-indigo-100/50',
  pink: 'from-pink-50 to-pink-100/50',
};

export const ExecutiveSectionCard: React.FC<ExecutiveSectionCardProps> = ({
  title,
  icon: Icon,
  description,
  children,
  className,
  headerClassName,
  contentClassName,
  borderColor = 'emerald',
  collapsible = false,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'bg-white hover:shadow-md shadow-sm',
        'rounded-lg border-l-4',
        borderColorMap[borderColor],
        className
      )}
    >
      {/* Subtle gradient background overlay */}
      <div
        className={cn(
          'absolute inset-0 opacity-[0.015] group-hover:opacity-[0.025] pointer-events-none',
          `bg-gradient-to-br ${gradientMap[borderColor]}`
        )}
      />

      {/* Header */}
      <CardHeader
        className={cn(
          'pb-3 pt-4 px-5 border-b border-slate-100/60 flex items-center justify-between',
          'group-hover:bg-slate-50/30 transition-colors',
          headerClassName
        )}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={cn('p-2 rounded-lg', iconBgMap[borderColor])}>
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900 truncate">
              {title}
            </CardTitle>
            {description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 ml-2 flex-shrink-0"
          >
            <ChevronDown
              size={16}
              className={cn(
                'transition-transform duration-300',
                isCollapsed && 'rotate-180'
              )}
            />
          </Button>
        )}
      </CardHeader>

      {/* Content */}
      {!isCollapsed && (
        <CardContent
          className={cn(
            'pt-4 px-5 pb-4',
            contentClassName
          )}
        >
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export default ExecutiveSectionCard;
