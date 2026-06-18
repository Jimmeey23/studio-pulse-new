import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, BarChart3, TrendingUp, UserCheck, Users, Sparkles, ShieldCheck } from 'lucide-react';

interface ClientConversionDataTableSelectorProps {
  activeTable: string;
  onTableChange: (table: string) => void;
  dataLength: number;
  isPending?: boolean;
}

type TableOption = {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  activeClass: string;
};

const TABLE_OPTIONS: TableOption[] = [
  {
    key: 'monthonmonthbytype',
    label: 'By Client Type',
    shortLabel: 'Client Type',
    description: 'Retention, revenue, visits, and conversion performance by client cohort.',
    icon: Users,
    activeClass:
      'data-[state=active]:from-blue-600 data-[state=active]:via-blue-700 data-[state=active]:to-blue-800',
  },
  {
    key: 'monthonmonth',
    label: 'Month on Month',
    shortLabel: 'MoM',
    description: 'Monthly client movement and membership mix across the selected studio view.',
    icon: Calendar,
    activeClass:
      'data-[state=active]:from-emerald-600 data-[state=active]:via-emerald-700 data-[state=active]:to-emerald-800',
  },
  {
    key: 'yearonyear',
    label: 'Year on Year',
    shortLabel: 'YoY',
    description: 'Yearly retention comparison for seasonality and growth trend analysis.',
    icon: TrendingUp,
    activeClass:
      'data-[state=active]:from-purple-600 data-[state=active]:via-purple-700 data-[state=active]:to-purple-800',
  },
  {
    key: 'hostedclasses',
    label: 'Hosted Classes',
    shortLabel: 'Hosted',
    description: 'Signature partnership sessions, guest behavior, and conversion signals.',
    icon: Users,
    activeClass:
      'data-[state=active]:from-indigo-600 data-[state=active]:via-indigo-700 data-[state=active]:to-indigo-800',
  },
  {
    key: 'memberships',
    label: 'Memberships',
    shortLabel: 'Memberships',
    description: 'Membership usage, access package preference, and revenue concentration.',
    icon: BarChart3,
    activeClass:
      'data-[state=active]:from-orange-600 data-[state=active]:via-orange-700 data-[state=active]:to-orange-800',
  },
  {
    key: 'teacherperformance',
    label: 'Teacher Performance',
    shortLabel: 'Teachers',
    description: 'Instructor-led retention, first visit conversion, and client consistency.',
    icon: UserCheck,
    activeClass:
      'data-[state=active]:from-teal-600 data-[state=active]:via-teal-700 data-[state=active]:to-teal-800',
  },
  {
    key: 'newclientpurchases',
    label: 'New Client Purchases',
    shortLabel: 'New Purchases',
    description: 'Newcomer purchase behavior, package entry points, and follow-up priorities.',
    icon: Users,
    activeClass:
      'data-[state=active]:from-pink-600 data-[state=active]:via-pink-700 data-[state=active]:to-pink-800',
  },
];

export const ClientConversionDataTableSelector: React.FC<ClientConversionDataTableSelectorProps> = memo(
  ({ activeTable, onTableChange, dataLength, isPending = false }) => {
    const activeOption = TABLE_OPTIONS.find((option) => option.key === activeTable) ?? TABLE_OPTIONS[0];
    const ActiveIcon = activeOption.icon;

    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-slate-700" />
              Retention Intelligence
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Data Analysis Tables</h3>
            <p className="mt-1 max-w-3xl text-sm text-gray-600">
              Choose a populated retention view using the same accent-coded tab system as Sales Analytics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isPending && (
              <Badge className="border-amber-200 bg-amber-50 text-amber-700">Optimizing...</Badge>
            )}
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
              {TABLE_OPTIONS.length} Sections
            </Badge>
            <Badge className="border-slate-200 bg-slate-100 text-slate-800">{dataLength} Records</Badge>
          </div>
        </div>

        <Tabs value={activeTable} onValueChange={onTableChange} className="w-full">
          <TabsList className="bg-white/95 backdrop-blur-sm p-1.5 rounded-2xl shadow-2xl border-2 border-slate-200 flex w-full max-w-7xl mx-auto overflow-x-auto overflow-y-visible relative h-auto">
            {TABLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <TabsTrigger
                  key={option.key}
                  value={option.key}
                  className={`relative flex min-w-[148px] flex-1 items-center justify-center gap-2 border-r border-slate-200 px-3 py-3 text-center text-xs font-semibold text-slate-700 transition-all duration-300 last:border-r-0 hover:bg-gray-50 data-[state=active]:z-50 data-[state=active]:-translate-y-1 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:bg-gradient-to-br ${option.activeClass} data-[state=active]:text-white data-[state=active]:shadow-2xl md:min-h-[52px] md:min-w-0 md:text-sm`}
                  title={option.description}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{option.shortLabel}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-900 p-2.5 text-white shadow-lg">
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{activeOption.label}</div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{activeOption.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Section populated
          </div>
        </div>
      </div>
    );
  }
);

ClientConversionDataTableSelector.displayName = 'ClientConversionDataTableSelector';
