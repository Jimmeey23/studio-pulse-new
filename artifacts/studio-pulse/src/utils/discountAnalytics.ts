import { SalesData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';

export interface DiscountSummary {
  totalTransactions: number;
  discountedTransactions: number;
  totalNetRevenue: number;
  totalGrossRevenue: number;
  totalDiscountAmount: number;
  discountRate: number;
  discountPenetration: number;
  uniqueCustomers: number;
  customersWithDiscounts: number;
  averageDiscountAmount: number;
  averageDiscountPercent: number;
  averageGrossTicket: number;
}

export interface DiscountMonthlyTrend {
  monthKey: string;
  monthLabel: string;
  discountedTransactions: number;
  totalTransactions: number;
  grossRevenue: number;
  netRevenue: number;
  discountAmount: number;
  discountRate: number;
  discountPenetration: number;
  averageDiscountPercent: number;
}

export interface DiscountForecastPoint {
  monthKey: string;
  monthLabel: string;
  grossRevenue: number;
  netRevenue: number;
  discountAmount: number;
  discountRate: number;
  discountedTransactions: number;
  confidence: number;
}

export interface DiscountRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  impact: string;
  detail: string;
}

export interface DiscountScenarioInput {
  coverageRate: number;
  targetDiscountRate: number;
  transactionLift: number;
  ticketChange: number;
}

export interface DiscountScenarioOutput {
  baselineNetRevenue: number;
  projectedNetRevenue: number;
  projectedGrossRevenue: number;
  projectedDiscountAmount: number;
  incrementalNetRevenue: number;
  incrementalGrossRevenue: number;
  breakEvenTransactionLift: number;
  impactedRevenueShare: number;
}

const round = (value: number) => Math.round(value * 100) / 100;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const getDiscountAmount = (item: SalesData) => Number(item.discountAmount || 0);
const getGrossRevenue = (item: SalesData) => Number(item.paymentValue || 0) + getDiscountAmount(item);
const getCustomerKey = (item: SalesData) => item.memberId || item.customerEmail || '';

export const isDiscountedSale = (item: SalesData) => getDiscountAmount(item) > 0 || Number(item.discountPercentage || 0) > 0;

export const summarizeDiscountPerformance = (data: SalesData[]): DiscountSummary => {
  const totalTransactions = data.length;
  const discountedRows = data.filter(isDiscountedSale);
  const discountedTransactions = discountedRows.length;
  const totalNetRevenue = data.reduce((sum, item) => sum + Number(item.paymentValue || 0), 0);
  const totalDiscountAmount = data.reduce((sum, item) => sum + getDiscountAmount(item), 0);
  const totalGrossRevenue = data.reduce((sum, item) => sum + getGrossRevenue(item), 0);
  const uniqueCustomers = new Set(data.map(getCustomerKey).filter(Boolean)).size;
  const customersWithDiscounts = new Set(discountedRows.map(getCustomerKey).filter(Boolean)).size;
  const discountPercentRows = discountedRows.filter((item) => Number(item.discountPercentage || 0) > 0);

  return {
    totalTransactions,
    discountedTransactions,
    totalNetRevenue: round(totalNetRevenue),
    totalGrossRevenue: round(totalGrossRevenue),
    totalDiscountAmount: round(totalDiscountAmount),
    discountRate: totalGrossRevenue > 0 ? round((totalDiscountAmount / totalGrossRevenue) * 100) : 0,
    discountPenetration: totalTransactions > 0 ? round((discountedTransactions / totalTransactions) * 100) : 0,
    uniqueCustomers,
    customersWithDiscounts,
    averageDiscountAmount: discountedTransactions > 0 ? round(totalDiscountAmount / discountedTransactions) : 0,
    averageDiscountPercent: discountPercentRows.length > 0
      ? round(discountPercentRows.reduce((sum, item) => sum + Number(item.discountPercentage || 0), 0) / discountPercentRows.length)
      : 0,
    averageGrossTicket: totalTransactions > 0 ? round(totalGrossRevenue / totalTransactions) : 0,
  };
};

export const buildMonthlyDiscountTrend = (data: SalesData[], monthCount = 8): DiscountMonthlyTrend[] => {
  const buckets = new Map<string, SalesData[]>();

  data.forEach((item) => {
    const parsed = parseDate(item.paymentDate);
    if (!parsed) return;
    const monthKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets.has(monthKey)) {
      buckets.set(monthKey, []);
    }
    buckets.get(monthKey)!.push(item);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-monthCount)
    .map(([monthKey, rows]) => {
      const summary = summarizeDiscountPerformance(rows);
      const date = new Date(`${monthKey}-01T00:00:00`);
      return {
        monthKey,
        monthLabel: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        discountedTransactions: summary.discountedTransactions,
        totalTransactions: summary.totalTransactions,
        grossRevenue: summary.totalGrossRevenue,
        netRevenue: summary.totalNetRevenue,
        discountAmount: summary.totalDiscountAmount,
        discountRate: summary.discountRate,
        discountPenetration: summary.discountPenetration,
        averageDiscountPercent: summary.averageDiscountPercent,
      };
    });
};

const linearProjection = (values: number[], periods: number) => {
  if (values.length === 0) return Array.from({ length: periods }, () => 0);
  if (values.length === 1) return Array.from({ length: periods }, () => values[0]);

  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;
  values.forEach((value, index) => {
    numerator += (index - xMean) * (value - yMean);
    denominator += (index - xMean) ** 2;
  });

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  return Array.from({ length: periods }, (_, idx) => {
    const x = n + idx;
    return Math.max(0, intercept + slope * x);
  });
};

const calculateForecastConfidence = (series: number[]) => {
  if (series.length <= 2) return 58;
  const mean = series.reduce((sum, value) => sum + value, 0) / series.length;
  if (mean === 0) return 52;
  const variance = series.reduce((sum, value) => sum + (value - mean) ** 2, 0) / series.length;
  const normalizedVariance = Math.sqrt(variance) / mean;
  return Math.round(clamp(88 - normalizedVariance * 45, 46, 86));
};

export const forecastDiscountTrend = (monthlyTrend: DiscountMonthlyTrend[], periods = 3): DiscountForecastPoint[] => {
  if (monthlyTrend.length === 0) {
    return [];
  }

  const lastMonthDate = new Date(`${monthlyTrend[monthlyTrend.length - 1].monthKey}-01T00:00:00`);
  const grossForecast = linearProjection(monthlyTrend.map((item) => item.grossRevenue), periods);
  const discountRateForecast = linearProjection(monthlyTrend.map((item) => item.discountRate), periods);
  const discountedTransactionForecast = linearProjection(monthlyTrend.map((item) => item.discountedTransactions), periods);
  const confidence = calculateForecastConfidence(monthlyTrend.map((item) => item.netRevenue));

  return Array.from({ length: periods }, (_, index) => {
    const date = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + index + 1, 1);
    const grossRevenue = round(grossForecast[index]);
    const discountRate = clamp(round(discountRateForecast[index]), 0, 60);
    const discountAmount = round(grossRevenue * (discountRate / 100));
    return {
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      monthLabel: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      grossRevenue,
      netRevenue: round(grossRevenue - discountAmount),
      discountAmount,
      discountRate,
      discountedTransactions: Math.max(0, Math.round(discountedTransactionForecast[index])),
      confidence,
    };
  });
};

const topDiscountBuckets = (data: SalesData[], key: 'cleanedCategory' | 'cleanedProduct' | 'calculatedLocation') => {
  const map = new Map<string, { grossRevenue: number; discountAmount: number; transactions: number }>();
  data.forEach((item) => {
    const bucket = (item[key] || 'Unknown').toString();
    if (!map.has(bucket)) {
      map.set(bucket, { grossRevenue: 0, discountAmount: 0, transactions: 0 });
    }
    const entry = map.get(bucket)!;
    entry.grossRevenue += getGrossRevenue(item);
    entry.discountAmount += getDiscountAmount(item);
    entry.transactions += 1;
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({
      name,
      ...value,
      discountRate: value.grossRevenue > 0 ? (value.discountAmount / value.grossRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.discountAmount - a.discountAmount);
};

export const buildDiscountRecommendations = (
  currentData: SalesData[],
  historicalData: SalesData[],
  forecast: DiscountForecastPoint[],
): DiscountRecommendation[] => {
  const currentSummary = summarizeDiscountPerformance(currentData);
  const historyTrend = buildMonthlyDiscountTrend(historicalData, 6);
  const lastHistory = historyTrend[historyTrend.length - 1];
  const previousHistory = historyTrend[historyTrend.length - 2];
  const topCategories = topDiscountBuckets(currentData, 'cleanedCategory').slice(0, 2);
  const topLocations = topDiscountBuckets(currentData, 'calculatedLocation').slice(0, 2);

  const recommendations: DiscountRecommendation[] = [];

  if (currentSummary.discountRate > 12) {
    recommendations.push({
      priority: 'high',
      title: 'Tighten discount guardrails',
      impact: `${currentSummary.discountRate.toFixed(1)}% of gross revenue is currently being given away as discount spend.`,
      detail: 'Audit high-discount transactions first and add approval thresholds for the most discounted products and categories.',
    });
  }

  if (lastHistory && previousHistory && lastHistory.discountRate > previousHistory.discountRate + 1.5) {
    recommendations.push({
      priority: 'high',
      title: 'Investigate rising discount dependency',
      impact: `Discount rate rose from ${previousHistory.discountRate.toFixed(1)}% to ${lastHistory.discountRate.toFixed(1)}% month over month.`,
      detail: 'Check whether discounting is compensating for weak demand, uneven pricing, or over-targeted promotions in the latest month.',
    });
  }

  if (topCategories.length > 0) {
    recommendations.push({
      priority: 'medium',
      title: `Reprice ${topCategories[0].name}`,
      impact: `${topCategories[0].name} accounts for ${topCategories[0].discountRate.toFixed(1)}% discount rate on ${topCategories[0].transactions} transactions.`,
      detail: 'Consider narrower offers, bundle rules, or staff scripting changes for the heaviest-discounted category before scaling future campaigns.',
    });
  }

  if (forecast.length > 0) {
    const forecastAverage = forecast.reduce((sum, item) => sum + item.discountRate, 0) / forecast.length;
    recommendations.push({
      priority: forecastAverage > currentSummary.discountRate ? 'medium' : 'low',
      title: 'Plan next-quarter promotion cadence',
      impact: `Projected discount rate over the next ${forecast.length} months is ${forecastAverage.toFixed(1)}%.`,
      detail: forecastAverage > currentSummary.discountRate
        ? 'Future discounting is forecast to stay elevated, so pre-build margin-safe offers and track ROI weekly.'
        : 'Discount intensity is projected to remain stable, which is a good window to test smaller, higher-conversion offers.',
    });
  }

  if (topLocations.length > 0) {
    recommendations.push({
      priority: 'low',
      title: 'Coach the highest-discount location',
      impact: `${topLocations[0].name} is currently the biggest driver of discount spend in the filtered dataset.`,
      detail: 'Share a location-specific discount mix report with studio leadership so the team can balance conversion wins against margin protection.',
    });
  }

  return recommendations.slice(0, 4);
};

export const simulateDiscountScenario = (
  baselineData: SalesData[],
  input: DiscountScenarioInput,
): DiscountScenarioOutput => {
  const summary = summarizeDiscountPerformance(baselineData);
  const baselineNetRevenue = summary.totalNetRevenue;
  const baselineGrossRevenue = summary.totalGrossRevenue;
  const impactedRevenueShare = clamp(input.coverageRate / 100, 0, 1);
  const baselineImpactedGrossRevenue = baselineGrossRevenue * impactedRevenueShare;
  const baselineUnaffectedNetRevenue = baselineNetRevenue - (baselineImpactedGrossRevenue * (1 - summary.discountRate / 100));
  const volumeMultiplier = 1 + input.transactionLift / 100;
  const ticketMultiplier = 1 + input.ticketChange / 100;
  const projectedGrossRevenue = baselineImpactedGrossRevenue * volumeMultiplier * ticketMultiplier;
  const projectedDiscountAmount = projectedGrossRevenue * (input.targetDiscountRate / 100);
  const projectedImpactedNetRevenue = projectedGrossRevenue - projectedDiscountAmount;
  const projectedNetRevenue = baselineUnaffectedNetRevenue + projectedImpactedNetRevenue;
  const incrementalNetRevenue = projectedNetRevenue - baselineNetRevenue;
  const incrementalGrossRevenue = projectedGrossRevenue - baselineImpactedGrossRevenue;

  const breakEvenMultiplierDenominator = baselineImpactedGrossRevenue * ticketMultiplier * (1 - input.targetDiscountRate / 100);
  const breakEvenTransactionLift = breakEvenMultiplierDenominator > 0
    ? ((baselineImpactedGrossRevenue * (1 - summary.discountRate / 100)) / breakEvenMultiplierDenominator - 1) * 100
    : 0;

  return {
    baselineNetRevenue: round(baselineNetRevenue),
    projectedNetRevenue: round(projectedNetRevenue),
    projectedGrossRevenue: round(projectedGrossRevenue),
    projectedDiscountAmount: round(projectedDiscountAmount),
    incrementalNetRevenue: round(incrementalNetRevenue),
    incrementalGrossRevenue: round(incrementalGrossRevenue),
    breakEvenTransactionLift: round(breakEvenTransactionLift),
    impactedRevenueShare: round(impactedRevenueShare * 100),
  };
};
