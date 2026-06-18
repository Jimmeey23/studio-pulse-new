import type { SessionData, CalculatedMetrics } from './types';

export function calculateMetrics(sessions: SessionData[]): CalculatedMetrics {
  const totalCheckIns = sessions.reduce((s, r) => s + (r.checkedInCount || 0), 0);
  const totalCapacity = sessions.reduce((s, r) => s + (r.capacity || 0), 0);
  const totalRevenue = sessions.reduce((s, r) => s + (r.totalPaid || 0), 0);
  const sessionCount = sessions.length;
  const avgCheckIns = sessionCount > 0 ? totalCheckIns / sessionCount : 0;
  const fillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;

  const variance = sessionCount > 0
    ? sessions.reduce((sum, s) => {
        const diff = (s.checkedInCount || 0) - avgCheckIns;
        return sum + diff * diff;
      }, 0) / sessionCount
    : 0;

  const consistency = avgCheckIns > 0 ? Math.max(0, 100 - Math.min(Math.sqrt(variance) / (avgCheckIns || 1) * 100, 100)) : 0;

  return {
    totalCheckIns,
    totalCapacity,
    totalRevenue,
    sessionCount,
    avgCheckIns,
    fillRate,
    consistency: Math.round(consistency),
  };
}

export function formatNumber(v: number, decimals = 0) {
  return v.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

export function formatPercentage(v: number) {
  return `${v.toFixed(1)}%`;
}

export function formatCurrency(v: number) {
  if (!isFinite(v)) return '$0.00';
  return `$${v.toFixed(2)}`;
}
