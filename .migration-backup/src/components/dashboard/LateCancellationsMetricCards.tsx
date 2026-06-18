import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock3, IndianRupee, MapPin, TimerReset, UserX, Users, Zap } from 'lucide-react';
import { LateCancellationsData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

interface LateCancellationsMetricCardsProps {
  data: LateCancellationsData[];
  onMetricClick?: (metricData: any) => void;
}

const getNumericValues = (values: Array<number | undefined>) =>
  values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

export const LateCancellationsMetricCards: React.FC<LateCancellationsMetricCardsProps> = ({
  data,
  onMetricClick,
}) => {
  const metrics = useMemo(() => {
    if (!data.length) return [];

    const totalCancellations = data.length;
    const uniqueMembers = new Set(data.map((item) => item.memberId || item.email || item.customerName).filter(Boolean)).size;
    const uniqueLocations = new Set(data.map((item) => item.location).filter(Boolean)).size;
    const sameDayCount = data.filter((item) => item.isSameDayCancellation).length;
    const withinOneHourCount = data.filter((item) => (item.timeBeforeClassMinutes ?? Infinity) < 60).length;
    const leadMinutes = getNumericValues(data.map((item) => item.timeBeforeClassMinutes));
    const sortedLeadMinutes = [...leadMinutes].sort((a, b) => a - b);
    const averageLeadHours = leadMinutes.length ? leadMinutes.reduce((sum, value) => sum + value, 0) / leadMinutes.length / 60 : 0;
    const medianLeadHours = sortedLeadMinutes.length
      ? sortedLeadMinutes[Math.floor(sortedLeadMinutes.length / 2)] / 60
      : 0;
    const totalPenalties = data.reduce((sum, item) => sum + (item.chargedPenaltyAmount || 0), 0);
    const penaltyCount = data.filter((item) => item.hasPenalty).length;
    const penaltyRate = totalCancellations ? penaltyCount / totalCancellations : 0;

    const windowCounts = data.reduce((acc, item) => {
      const window = item.cancellationWindow || 'Unknown';
      acc[window] = (acc[window] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topWindow = Object.entries(windowCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    return [
      {
        title: 'Late Cancellations',
        value: formatNumber(totalCancellations),
        detail: `${formatNumber(uniqueLocations)} locations impacted`,
        icon: AlertTriangle,
        accent: 'from-red-700 to-red-600',
      },
      {
        title: 'Affected Members',
        value: formatNumber(uniqueMembers),
        detail: `${formatNumber(totalCancellations / Math.max(uniqueMembers, 1))} avg cancels per member`,
        icon: Users,
        accent: 'from-blue-700 to-blue-600',
      },
      {
        title: 'Avg Lead Time',
        value: `${averageLeadHours.toFixed(1)} hrs`,
        detail: 'Average gap between cancel and class',
        icon: Clock3,
        accent: 'from-pink-700 to-pink-600',
      },
      {
        title: 'Median Lead Time',
        value: `${medianLeadHours.toFixed(1)} hrs`,
        detail: 'Better read on the typical window',
        icon: TimerReset,
        accent: 'from-emerald-700 to-emerald-600',
      },
      {
        title: 'Same-Day Share',
        value: formatPercentage((sameDayCount / Math.max(totalCancellations, 1)) * 100),
        detail: `${formatNumber(sameDayCount)} same-day cancellations`,
        icon: Zap,
        accent: 'from-orange-700 to-orange-600',
      },
      {
        title: 'Under 1 Hour',
        value: formatPercentage((withinOneHourCount / Math.max(totalCancellations, 1)) * 100),
        detail: `${formatNumber(withinOneHourCount)} cancellations very close to class`,
        icon: UserX,
        accent: 'from-violet-700 to-violet-600',
      },
      {
        title: 'Penalties Charged',
        value: formatCurrency(totalPenalties),
        detail: `${formatPercentage(penaltyRate * 100)} of cancellations incurred a fee`,
        icon: IndianRupee,
        accent: 'from-slate-800 to-slate-700',
      },
      {
        title: 'Peak Risk Window',
        value: topWindow,
        detail: 'Most common cancellation lead-time bucket',
        icon: MapPin,
        accent: 'from-cyan-700 to-cyan-600',
      },
    ];
  }, [data]);

  if (!metrics.length) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card
            key={metric.title}
            className="group overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            onClick={() => onMetricClick?.({ title: metric.title, rawData: data, type: 'metric-card' })}
          >
            <CardContent className="p-0">
              <div className={`h-2 w-full bg-gradient-to-r ${metric.accent}`} />
              <div className="p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{metric.title}</p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">{metric.value}</p>
                  </div>
                  <div className={`rounded-2xl bg-gradient-to-br p-3 text-white shadow-lg ${metric.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm text-slate-600">{metric.detail}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};