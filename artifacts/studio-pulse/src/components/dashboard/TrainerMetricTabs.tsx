
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrainerMetricType } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface TrainerMetricTabsProps {
  value: TrainerMetricType;
  onValueChange: (value: TrainerMetricType) => void;
  className?: string;
}

export const TrainerMetricTabs: React.FC<TrainerMetricTabsProps> = ({
  value,
  onValueChange,
  className = ""
}) => {
  const triggerClassName = "rounded-lg border border-transparent px-3 py-3 h-auto flex-col gap-1 font-medium text-slate-700 transition-all duration-200 data-[state=active]:border-slate-800/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:via-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-slate-100";

  const tabs: { value: TrainerMetricType; label: string; sub: string }[] = [
    { value: 'totalSessions',       label: 'Total',       sub: 'Sessions' },
    { value: 'totalCustomers',      label: 'Total',       sub: 'Members' },
    { value: 'totalPaid',           label: 'Total',       sub: 'Revenue' },
    { value: 'classAverageExclEmpty', label: 'Class',     sub: 'Average' },
    { value: 'emptySessions',       label: 'Empty',       sub: 'Sessions' },
    { value: 'nonEmptySessions',    label: 'Active',      sub: 'Classes' },
    { value: 'fillRate',            label: 'Fill',        sub: 'Rate' },
    { value: 'utilizationRate',     label: 'Utilisation', sub: 'Rate' },
    { value: 'conversionRate',      label: 'Conversion',  sub: 'Rate' },
    { value: 'retentionRate',       label: 'Retention',   sub: 'Rate' },
    { value: 'newMembers',          label: 'New',         sub: 'Members' },
    { value: 'convertedMembers',    label: 'Converted',   sub: 'Members' },
    { value: 'retainedMembers',     label: 'Retained',    sub: 'Members' },
    { value: 'revenuePerSession',   label: 'Rev /',       sub: 'Session' },
    { value: 'revenuePerCustomer',  label: 'Rev /',       sub: 'Member' },
    { value: 'cycleSessions',       label: 'Cycle',       sub: 'Sessions' },
    { value: 'barreSessions',       label: 'Barre',       sub: 'Sessions' },
    { value: 'strengthSessions',    label: 'Strength',    sub: 'Sessions' },
  ];

  return (
    <Tabs value={value} onValueChange={onValueChange} className={className}>
      <TabsList className={cn("flex flex-wrap w-full gap-1 h-auto rounded-lg border border-slate-300 bg-white p-2 shadow-sm", className)}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={triggerClassName}
          >
            <span className="font-semibold">{tab.label}</span>
            <span className="text-[10px] opacity-80">{tab.sub}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
