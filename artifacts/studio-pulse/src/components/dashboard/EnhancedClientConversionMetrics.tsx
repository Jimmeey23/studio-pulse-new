import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, TrendingUp, DollarSign, Percent, Clock, UserCheck, Award, UserPlus, ArrowRight, CalendarCheck } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';

interface EnhancedClientConversionMetricsProps {
  data: NewClientData[];
}

export const EnhancedClientConversionMetrics: React.FC<EnhancedClientConversionMetricsProps> = ({ data }) => {
  const totalClients = data.length;

  const newMembers = data.filter(client => {
    const isNewValue = String(client.isNew || '');
    return isNewValue.includes('New');
  }).length;

  const convertedMembers = data.filter(client => client.conversionStatus === 'Converted').length;
  const retainedMembers = data.filter(client => client.retentionStatus === 'Retained').length;
  const trialsCompleted = data.filter(client => client.visitsPostTrial > 0).length;

  const leadToTrialConversion = totalClients > 0 ? (trialsCompleted / totalClients) * 100 : 0;
  const trialToMemberConversion = trialsCompleted > 0 ? (convertedMembers / trialsCompleted) * 100 : 0;
  const overallConversionRate = newMembers > 0 ? (convertedMembers / newMembers) * 100 : 0;
  const retentionRate = convertedMembers > 0 ? (retainedMembers / convertedMembers) * 100 : 0;

  const totalLTV = data.reduce((sum, client) => sum + (client.ltv || 0), 0);
  const avgLTV = totalClients > 0 ? totalLTV / totalClients : 0;

  // 30 / 45 / 60 day conversion windows
  const windows = [30, 45, 60] as const;

  const windowMetrics = windows.map(days => {
    // Converted within N days: conversionStatus === 'Converted' AND conversionSpan <= days
    const convertedWithin = data.filter(
      c => c.conversionStatus === 'Converted' && typeof c.conversionSpan === 'number' && c.conversionSpan <= days
    );
    const conversionRate = newMembers > 0 ? (convertedWithin.length / newMembers) * 100 : 0;

    // Retained among those converted within N days
    const retainedWithin = convertedWithin.filter(c => c.retentionStatus === 'Retained');
    const retentionRateWithin = convertedWithin.length > 0 ? (retainedWithin.length / convertedWithin.length) * 100 : 0;

    return {
      days,
      converted: convertedWithin.length,
      conversionRate,
      retained: retainedWithin.length,
      retentionRate: retentionRateWithin,
    };
  });

  const metrics = [
    {
      title: 'New Members',
      value: formatNumber(newMembers),
      icon: UserPlus,
      gradient: 'from-blue-500 to-indigo-600',
      description: 'Recently acquired clients',
    },
    {
      title: 'Converted Members',
      value: formatNumber(convertedMembers),
      icon: Award,
      gradient: 'from-green-500 to-teal-600',
      description: 'Trial to paid conversions',
    },
    {
      title: 'Retention Rate',
      value: `${retentionRate.toFixed(1)}%`,
      icon: UserCheck,
      gradient: 'from-purple-500 to-violet-600',
      description: 'Converted to retained rate',
    },
    {
      title: 'Trials Completed',
      value: formatNumber(trialsCompleted),
      icon: Target,
      gradient: 'from-orange-500 to-red-600',
      description: 'Trial sessions completed',
    },
    {
      title: 'Lead → Trial Conv',
      value: `${leadToTrialConversion.toFixed(1)}%`,
      icon: ArrowRight,
      gradient: 'from-cyan-500 to-blue-600',
      description: 'Lead to trial conversion',
    },
    {
      title: 'Conversion Rate',
      value: `${overallConversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      gradient: 'from-pink-500 to-rose-600',
      description: 'Converted/New Members',
    },
  ];

  const windowColors = [
    { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-400' },
    { bg: 'bg-violet-50', border: 'border-violet-200', accent: 'text-violet-700', badge: 'bg-violet-100 text-violet-800', bar: 'bg-violet-400' },
    { bg: 'bg-teal-50', border: 'border-teal-200', accent: 'text-teal-700', badge: 'bg-teal-100 text-teal-800', bar: 'bg-teal-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Core metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="bg-white shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-all duration-300 group cursor-pointer">
            <CardContent className="p-0">
              <div className={`bg-gradient-to-r ${metric.gradient} p-6 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-20 h-20 transform translate-x-8 -translate-y-8 opacity-20">
                  <metric.icon className="w-20 h-20" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <metric.icon className="w-5 h-5" />
                    <h3 className="font-semibold text-xs">{metric.title}</h3>
                  </div>
                  <p className="text-2xl font-bold mb-1">{metric.value}</p>
                  <p className="text-xs opacity-90">{metric.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 30 / 45 / 60 day conversion & retention windows */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-6">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <CalendarCheck className="w-4 h-4 text-slate-600" />
            Conversion &amp; Retention Windows
            <span className="text-xs text-slate-400 font-normal ml-1">— how quickly new clients convert and stay</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {windowMetrics.map((wm, idx) => {
              const col = windowColors[idx];
              return (
                <div key={wm.days} className={`rounded-2xl border ${col.border} ${col.bg} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold uppercase tracking-widest ${col.accent}`}>{wm.days}-Day Window</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${col.badge}`}>
                      {wm.converted} of {newMembers} new clients
                    </span>
                  </div>

                  {/* Conversion */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500 font-medium">Conversion Rate</span>
                    </div>
                    <div className="flex items-end gap-3 mb-1.5">
                      <span className="text-2xl font-black text-slate-900 leading-none">{wm.conversionRate.toFixed(1)}%</span>
                      <div className="flex flex-col pb-0.5">
                        <span className={`text-lg font-bold leading-none ${col.accent}`}>{wm.converted}</span>
                        <span className="text-[10px] text-slate-400 leading-tight">converted</span>
                      </div>
                      <div className="flex flex-col pb-0.5 text-slate-400">
                        <span className="text-xs leading-none">of {newMembers}</span>
                        <span className="text-[10px] leading-tight">new clients</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${col.bar} transition-all`}
                        style={{ width: `${Math.min(wm.conversionRate, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">within {wm.days} days of first class</p>
                  </div>

                  {/* Retention */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500 font-medium">Retention Rate</span>
                    </div>
                    <div className="flex items-end gap-3 mb-1.5">
                      <span className="text-2xl font-black text-slate-900 leading-none">{wm.retentionRate.toFixed(1)}%</span>
                      <div className="flex flex-col pb-0.5">
                        <span className={`text-lg font-bold leading-none ${col.accent}`}>{wm.retained}</span>
                        <span className="text-[10px] text-slate-400 leading-tight">retained</span>
                      </div>
                      <div className="flex flex-col pb-0.5 text-slate-400">
                        <span className="text-xs leading-none">of {wm.converted}</span>
                        <span className="text-[10px] leading-tight">converters</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${col.bar} opacity-60 transition-all`}
                        style={{ width: `${Math.min(wm.retentionRate, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">among {wm.days}-day converters</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] text-slate-400">
            Conversion window = days between a new client's first class and their first membership purchase.
            Retention rate is calculated among clients who converted within that window.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
