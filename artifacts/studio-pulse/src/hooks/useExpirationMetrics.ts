import { useMemo } from 'react';
import { ExpirationData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';
import { formatNumber, formatPercentage, formatCurrency } from '@/utils/formatters';

type Trend = 'strong' | 'moderate' | 'weak';

export interface ExpirationMetric {
  title: string;
  value: string;
  rawValue: number;
  change: number;
  changeDetails: { rate: number; isSignificant: boolean; trend: Trend };
  previousValue: string;
  previousRawValue: number;
  periodLabel?: string;
  icon: string;
  description: string;
}

interface Options {
  dateRange?: { start?: string | Date; end?: string | Date };
}

const calcGrowth = (current: number, previous: number) => {
  if (previous === 0) return { rate: current > 0 ? 100 : 0, isSignificant: current > 0, trend: current > 0 ? 'moderate' as Trend : 'weak' as Trend };
  const rate = ((current - previous) / previous) * 100;
  const mag = Math.abs(rate);
  
  // Trend should consider direction of change
  let trend: Trend;
  if (rate > 0) {
    // Positive growth
    trend = mag > 20 ? 'strong' : mag > 5 ? 'moderate' : 'weak';
  } else {
    // Negative growth (decline) - should always be weak or moderate at best
    trend = mag > 20 ? 'weak' : mag > 5 ? 'moderate' : 'weak';
  }
  
  return { rate, isSignificant: mag > 2, trend };
};

export function useExpirationMetrics(
  data: ExpirationData[] = [],
  historicalData?: ExpirationData[],
  options?: Options
) {
  return useMemo(() => {
    // Use the filtered data directly for current metrics
    // Don't filter by date again - the data passed in is already filtered
    const current = data;
    
    // For historical comparison, use the historicalData if provided
    const compareEnd = options?.dateRange?.end
      ? (typeof options.dateRange.end === 'string' ? new Date(options.dateRange.end) : (options.dateRange.end as Date))
      : new Date();
    const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const currentStart = monthStart(compareEnd);
    const currentEnd = monthEnd(compareEnd);
    const prevAnchor = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 15);
    const prevStart = monthStart(prevAnchor);
    const prevEnd = monthEnd(prevAnchor);
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    const periodLabel = `${fmt(currentStart)} vs ${fmt(prevStart)}`;

    const within = (d?: Date | null, start?: Date, end?: Date) => !!(d && start && end && d >= start && d <= end);

    // Use historicalData or data for previous period comparison
    const baseForComparison = historicalData && historicalData.length > 0 ? historicalData : data;
    const previous = baseForComparison.filter((it) => within(parseDate((it as any).endDate), prevStart, prevEnd));

    const countByStatus = (list: ExpirationData[], status: string) => list.filter((i) => (i.status || '').toLowerCase() === status).length;

    const totalMembershipsCur = current.length;
    const totalMembershipsPrev = previous.length;

    const activeCur = countByStatus(current, 'active');
    const activePrev = countByStatus(previous, 'active');

    const churnedCur = countByStatus(current, 'churned');
    const churnedPrev = countByStatus(previous, 'churned');

    const frozenCur = countByStatus(current, 'frozen');
    const frozenPrev = countByStatus(previous, 'frozen');

    const churnRateCur = totalMembershipsCur > 0 ? (churnedCur / totalMembershipsCur) * 100 : 0;
    const churnRatePrev = totalMembershipsPrev > 0 ? (churnedPrev / totalMembershipsPrev) * 100 : 0;

    const activeRateCur = totalMembershipsCur > 0 ? (activeCur / totalMembershipsCur) * 100 : 0;
    const activeRatePrev = totalMembershipsPrev > 0 ? (activePrev / totalMembershipsPrev) * 100 : 0;

    const frozenRateCur = totalMembershipsCur > 0 ? (frozenCur / totalMembershipsCur) * 100 : 0;
    const frozenRatePrev = totalMembershipsPrev > 0 ? (frozenPrev / totalMembershipsPrev) * 100 : 0;

    // Revenue impact from churned (using paid field)
    const paidVal = (s: string | undefined) => {
      if (!s) return 0;
      const n = parseFloat(String(s).replace(/[^0-9.-]/g, ''));
      return isNaN(n) ? 0 : n;
    };
    const churnLossCur = current
      .filter((i) => (i.status || '').toLowerCase() === 'churned')
      .reduce((sum, i) => sum + paidVal(i.paid), 0);
    const churnLossPrev = previous
      .filter((i) => (i.status || '').toLowerCase() === 'churned')
      .reduce((sum, i) => sum + paidVal(i.paid), 0);

    const metrics: ExpirationMetric[] = [
      {
        title: 'Total Memberships',
        value: formatNumber(totalMembershipsCur),
        rawValue: totalMembershipsCur,
        change: calcGrowth(totalMembershipsCur, totalMembershipsPrev).rate,
        changeDetails: calcGrowth(totalMembershipsCur, totalMembershipsPrev),
        previousValue: formatNumber(totalMembershipsPrev),
        previousRawValue: totalMembershipsPrev,
        periodLabel,
        icon: 'Users',
        description: 'All tracked membership records',
      },
      {
        title: 'Active Members',
        value: formatNumber(activeCur),
        rawValue: activeCur,
        change: calcGrowth(activeCur, activePrev).rate,
        changeDetails: calcGrowth(activeCur, activePrev),
        previousValue: formatNumber(activePrev),
        previousRawValue: activePrev,
        periodLabel,
        icon: 'CheckCircle',
        description: `${activeRateCur.toFixed(1)}% of total memberships`,
      },
      {
        title: 'Churned Members',
        value: formatNumber(churnedCur),
        rawValue: churnedCur,
        change: calcGrowth(churnedCur, churnedPrev).rate,
        changeDetails: calcGrowth(churnedCur, churnedPrev),
        previousValue: formatNumber(churnedPrev),
        previousRawValue: churnedPrev,
        periodLabel,
        icon: 'AlertTriangle',
        description: `${churnRateCur.toFixed(1)}% churn rate`,
      },
      {
        title: 'Frozen Members',
        value: formatNumber(frozenCur),
        rawValue: frozenCur,
        change: calcGrowth(frozenCur, frozenPrev).rate,
        changeDetails: calcGrowth(frozenCur, frozenPrev),
        previousValue: formatNumber(frozenPrev),
        previousRawValue: frozenPrev,
        periodLabel,
        icon: 'Clock',
        description: `${frozenRateCur.toFixed(1)}% of total memberships`,
      },
      {
        title: 'Revenue Impact',
        value: formatCurrency(churnLossCur),
        rawValue: churnLossCur,
        change: calcGrowth(churnLossCur, churnLossPrev).rate,
        changeDetails: calcGrowth(churnLossCur, churnLossPrev),
        previousValue: formatCurrency(churnLossPrev),
        previousRawValue: churnLossPrev,
        periodLabel,
        icon: 'TrendingUp',
        description: `Loss from churned members`,
      },
    ];

    return { metrics };
  }, [data, historicalData, options?.dateRange?.start, options?.dateRange?.end]);
}
