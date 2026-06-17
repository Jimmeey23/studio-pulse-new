import { useMemo } from 'react';
import { NewClientData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';
import { isConvertedInCohort, isInNewClientCohort, isRetainedInCohort } from '@/utils/clientRetention';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

type Trend = 'strong' | 'moderate' | 'weak';

export interface ClientMetric {
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

export interface ClientMetricWithYoY extends ClientMetric {
  yoyPreviousValue?: string;
  yoyPreviousRawValue?: number;
  yoyChange?: number;
  comparison?: { current: number; previous: number; difference: number };
  filterData?: () => NewClientData[];
  metricType?: string;
  rawValue: number;
  previousRawValue: number;
  icon: string | React.ComponentType<{ className?: string }>;
  yoyChangeDetails?: { trend: string };
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

export function useClientConversionMetrics(
  data: NewClientData[] = [],
  historicalData?: NewClientData[],
  options?: Options
) {
  return useMemo(() => {
    const base = (historicalData && historicalData.length > 0 ? historicalData : data) as NewClientData[];

    const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    const normalizeInputDate = (value?: string | Date, end = false): Date | null => {
      if (!value) return null;
      const date = typeof value === 'string' ? parseDate(value) : value;
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
      return end ? endOfDay(date) : startOfDay(date);
    };
    const within = (d?: Date | null, start?: Date, end?: Date) => !!(d && start && end && d >= start && d <= end);
    const formatPeriodDate = (d: Date) =>
      d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

    const explicitStart = normalizeInputDate(options?.dateRange?.start, false);
    const explicitEnd = normalizeInputDate(options?.dateRange?.end, true);

    const datedCurrent = (data || []).filter(item =>
      within(parseDate((item as any).firstVisitDate), explicitStart || new Date(0), explicitEnd || new Date(8640000000000000)),
    );
    const currentDateCandidates = (datedCurrent.length > 0 ? datedCurrent : data)
      .map(item => parseDate((item as any).firstVisitDate))
      .filter((d): d is Date => Boolean(d));

    const fallbackAnchor = currentDateCandidates.length
      ? new Date(Math.max(...currentDateCandidates.map(d => d.getTime())))
      : new Date();

    const currentStart = explicitStart || monthStart(fallbackAnchor);
    const currentEnd = explicitEnd || monthEnd(fallbackAnchor);

    const current =
      explicitStart && explicitEnd
        ? (data || [])
        : (data || []).filter(item => within(parseDate((item as any).firstVisitDate), currentStart, currentEnd));

    // Use the same window length for previous period comparison.
    const windowMs = Math.max(1, currentEnd.getTime() - currentStart.getTime() + 1);
    const prevEnd = new Date(currentStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - windowMs + 1);

    const previous = base.filter((it) => within(parseDate((it as any).firstVisitDate), prevStart, prevEnd));

    const periodLabel = `${formatPeriodDate(currentStart)} to ${formatPeriodDate(currentEnd)} vs previous period`;

    const isNew = (c: NewClientData) => isInNewClientCohort(c);
    const isConverted = (c: NewClientData) => isConvertedInCohort(c);
    const isRetained = (c: NewClientData) => isRetainedInCohort(c);

    // Calculate current period metrics
    const curNew = current.filter(isNew).length;
    const curConverted = current.filter(isConverted).length;
    const curRetained = current.filter(isRetained).length;

    // Calculate previous period metrics
    const prevNew = previous.filter(isNew).length;
    const prevConverted = previous.filter(isConverted).length;
    const prevRetained = previous.filter(isRetained).length;

    const overallConvCur = curNew > 0 ? (curConverted / curNew) * 100 : 0;
    const overallConvPrev = prevNew > 0 ? (prevConverted / prevNew) * 100 : 0;

    const retentionCur = curNew > 0 ? (curRetained / curNew) * 100 : 0;
    const retentionPrev = prevNew > 0 ? (prevRetained / prevNew) * 100 : 0;

    const totalLTVCur = current.reduce((s, c) => s + (c.ltv || 0), 0);
    const totalLTVPrev = previous.reduce((s, c) => s + (c.ltv || 0), 0);
    const avgLTVCur = current.length > 0 ? totalLTVCur / current.length : 0;
    const avgLTVPrev = previous.length > 0 ? totalLTVPrev / previous.length : 0;

    // Year-over-year: same date window last year.
    const prevYearStart = new Date(currentStart);
    prevYearStart.setFullYear(prevYearStart.getFullYear() - 1);
    const prevYearEnd = new Date(currentEnd);
    prevYearEnd.setFullYear(prevYearEnd.getFullYear() - 1);

    const previousYear = base.filter((it) => within(parseDate((it as any).firstVisitDate), prevYearStart, prevYearEnd));

    const metrics = [
      {
        title: 'New Members',
        value: formatNumber(curNew),
        rawValue: curNew,
        change: calcGrowth(curNew, prevNew).rate,
        changeDetails: calcGrowth(curNew, prevNew),
        previousValue: formatNumber(prevNew),
        previousRawValue: prevNew,
        yoyPreviousValue: formatNumber(previousYear.filter(isNew).length),
        yoyPreviousRawValue: previousYear.filter(isNew).length,
        yoyChange: calcGrowth(curNew, previousYear.filter(isNew).length).rate,
        yoyChangeDetails: { trend: calcGrowth(curNew, previousYear.filter(isNew).length).trend },
        comparison: { current: curNew, previous: previousYear.filter(isNew).length, difference: curNew - previousYear.filter(isNew).length },
        periodLabel,
        icon: 'UserPlus',
        description: 'Recently acquired clients',
      },
      {
        title: 'Converted Members',
        value: formatNumber(curConverted),
        rawValue: curConverted,
        change: calcGrowth(curConverted, prevConverted).rate,
        changeDetails: calcGrowth(curConverted, prevConverted),
        previousValue: formatNumber(prevConverted),
        previousRawValue: prevConverted,
        yoyPreviousValue: formatNumber(previousYear.filter(isConverted).length),
        yoyPreviousRawValue: previousYear.filter(isConverted).length,
        yoyChange: calcGrowth(curConverted, previousYear.filter(isConverted).length).rate,
        yoyChangeDetails: { trend: calcGrowth(curConverted, previousYear.filter(isConverted).length).trend },
        comparison: { current: curConverted, previous: previousYear.filter(isConverted).length, difference: curConverted - previousYear.filter(isConverted).length },
        periodLabel,
        icon: 'Award',
        description: 'Trial to paid conversions',
      },
      {
        title: 'Retained Members',
        value: formatNumber(curRetained),
        rawValue: curRetained,
        change: calcGrowth(curRetained, prevRetained).rate,
        changeDetails: calcGrowth(curRetained, prevRetained),
        previousValue: formatNumber(prevRetained),
        previousRawValue: prevRetained,
        yoyPreviousValue: formatNumber(previousYear.filter(isRetained).length),
        yoyPreviousRawValue: previousYear.filter(isRetained).length,
        yoyChange: calcGrowth(curRetained, previousYear.filter(isRetained).length).rate,
        yoyChangeDetails: { trend: calcGrowth(curRetained, previousYear.filter(isRetained).length).trend },
        comparison: { current: curRetained, previous: previousYear.filter(isRetained).length, difference: curRetained - previousYear.filter(isRetained).length },
        periodLabel,
        icon: 'UserCheck',
        description: 'Active retained clients',
      },
      {
        title: 'Conversion Rate',
        value: formatPercentage(overallConvCur),
        rawValue: overallConvCur,
        change: calcGrowth(overallConvCur, overallConvPrev).rate,
        changeDetails: calcGrowth(overallConvCur, overallConvPrev),
        previousValue: formatPercentage(overallConvPrev),
        previousRawValue: overallConvPrev,
        yoyPreviousValue: formatPercentage(previousYear.filter(isNew).length > 0 ? (previousYear.filter(isConverted).length / previousYear.filter(isNew).length) * 100 : 0),
        yoyPreviousRawValue: previousYear.filter(isNew).length > 0 ? (previousYear.filter(isConverted).length / previousYear.filter(isNew).length) * 100 : 0,
        yoyChange: calcGrowth(overallConvCur, previousYear.filter(isNew).length > 0 ? (previousYear.filter(isConverted).length / previousYear.filter(isNew).length) * 100 : 0).rate,
        yoyChangeDetails: { trend: calcGrowth(overallConvCur, previousYear.filter(isNew).length > 0 ? (previousYear.filter(isConverted).length / previousYear.filter(isNew).length) * 100 : 0).trend },
        comparison: { current: overallConvCur, previous: previousYear.filter(isNew).length > 0 ? (previousYear.filter(isConverted).length / previousYear.filter(isNew).length) * 100 : 0, difference: overallConvCur - (previousYear.filter(isNew).length > 0 ? (previousYear.filter(isConverted).length / previousYear.filter(isNew).length) * 100 : 0) },
        periodLabel,
        icon: 'TrendingUp',
        description: 'New to converted rate',
      },
      {
        title: 'Retention Rate',
        value: formatPercentage(retentionCur),
        rawValue: retentionCur,
        change: calcGrowth(retentionCur, retentionPrev).rate,
        changeDetails: calcGrowth(retentionCur, retentionPrev),
        previousValue: formatPercentage(retentionPrev),
        previousRawValue: retentionPrev,
        yoyPreviousValue: formatPercentage(previousYear.filter(isNew).length > 0 ? (previousYear.filter(isRetained).length / previousYear.filter(isNew).length) * 100 : 0),
        yoyPreviousRawValue: previousYear.filter(isNew).length > 0 ? (previousYear.filter(isRetained).length / previousYear.filter(isNew).length) * 100 : 0,
        yoyChange: calcGrowth(retentionCur, previousYear.filter(isNew).length > 0 ? (previousYear.filter(isRetained).length / previousYear.filter(isNew).length) * 100 : 0).rate,
        yoyChangeDetails: { trend: calcGrowth(retentionCur, previousYear.filter(isNew).length > 0 ? (previousYear.filter(isRetained).length / previousYear.filter(isNew).length) * 100 : 0).trend },
        comparison: { current: retentionCur, previous: previousYear.filter(isNew).length > 0 ? (previousYear.filter(isRetained).length / previousYear.filter(isNew).length) * 100 : 0, difference: retentionCur - (previousYear.filter(isNew).length > 0 ? (previousYear.filter(isRetained).length / previousYear.filter(isNew).length) * 100 : 0) },
        periodLabel,
        icon: 'Target',
        description: 'Member retention rate',
      },
      {
        title: 'Avg LTV',
        value: formatCurrency(avgLTVCur),
        rawValue: avgLTVCur,
        change: calcGrowth(avgLTVCur, avgLTVPrev).rate,
        changeDetails: calcGrowth(avgLTVCur, avgLTVPrev),
        previousValue: formatCurrency(avgLTVPrev),
        previousRawValue: avgLTVPrev,
        yoyPreviousValue: formatCurrency(previousYear.length > 0 ? (previousYear.reduce((s, c) => s + (c.ltv || 0), 0) / previousYear.length) : 0),
        yoyPreviousRawValue: previousYear.length > 0 ? (previousYear.reduce((s, c) => s + (c.ltv || 0), 0) / previousYear.length) : 0,
        yoyChange: calcGrowth(avgLTVCur, previousYear.length > 0 ? (previousYear.reduce((s, c) => s + (c.ltv || 0), 0) / previousYear.length) : 0).rate,
        yoyChangeDetails: { trend: calcGrowth(avgLTVCur, previousYear.length > 0 ? (previousYear.reduce((s, c) => s + (c.ltv || 0), 0) / previousYear.length) : 0).trend },
        comparison: { current: avgLTVCur, previous: previousYear.length > 0 ? (previousYear.reduce((s, c) => s + (c.ltv || 0), 0) / previousYear.length) : 0, difference: avgLTVCur - (previousYear.length > 0 ? (previousYear.reduce((s, c) => s + (c.ltv || 0), 0) / previousYear.length) : 0) },
        periodLabel,
        icon: 'DollarSign',
        description: `Average lifetime value`,
      },
    ];

    return { metrics };
  }, [data, historicalData, options?.dateRange?.start, options?.dateRange?.end]);
}
