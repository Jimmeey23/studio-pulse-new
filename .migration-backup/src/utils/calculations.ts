import type { SessionData, CalculatedMetrics, GroupedRow, GroupBy } from '../types';

export const formatNumber = (n: number, digits = 0) => {
  if (!isFinite(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
};

export const formatPercentage = (n: number, digits = 0) => {
  if (!isFinite(n)) return '—';
  return `${n.toFixed(digits)}%`;
};

export const formatCurrency = (n: number, compact = false) => {
  if (!isFinite(n)) return '—';
  if (compact && Math.abs(n) >= 1000) {
    const k = n / 1000;
    return `₹${k.toFixed(1)}K`;
  }
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Calculate composite score based on attendance, fill rate, and number of sessions
 * Formula: (attendance * 40%) + (fillRate * 35%) + (sessionCount * 25%)
 */
export function calculateCompositeScore(classAvg: number, fillRate: number, totalSessions: number): number {
  // Normalize metrics to 0-100 scale
  const attendanceScore = Math.min(classAvg * 5, 100); // Assume 20 is excellent attendance
  const fillRateScore = Math.min(fillRate, 100); // Already 0-100
  const sessionScore = Math.min(totalSessions * 2, 100); // Assume 50 sessions is excellent
  
  // Weighted combination: 40% attendance, 35% fill rate, 25% sessions
  const compositeScore = (attendanceScore * 0.4) + (fillRateScore * 0.35) + (sessionScore * 0.25);
  
  return Math.round(compositeScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate metrics for a group of sessions
 */
export function calculateMetrics(sessions: SessionData[]): CalculatedMetrics {
  const totalClasses = sessions.length;
  const emptyClasses = sessions.filter(s => (s.checkins || 0) === 0).length;
  const nonEmptyClasses = totalClasses - emptyClasses;
  
  const totalCheckIns = sessions.reduce((sum, s) => sum + (s.checkins || 0), 0);
  const totalBookings = sessions.reduce((sum, s) => sum + (s.bookings || 0), 0);
  const totalBooked = totalBookings;
  const totalCancellations = sessions.reduce((sum, s) => sum + (s.lateCancelled || 0), 0);
  const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
  const totalRevenue = sessions.reduce((sum, s) => sum + (s.revenue || 0), 0);
  const totalWaitlisted = sessions.reduce((sum, s) => sum + (s.waitlisted || 0), 0);
  
  const classAvg = totalClasses > 0 ? totalCheckIns / totalClasses : 0;
  const classAvgNonEmpty = nonEmptyClasses > 0 ? totalCheckIns / nonEmptyClasses : 0;
  
  const fillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
  const cancellationRate = totalBookings > 0 ? (totalCancellations / totalBookings) * 100 : 0;
  const waitlistRate = totalCapacity > 0 ? (totalWaitlisted / totalCapacity) * 100 : 0;
  
  const revPerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const revPerCheckin = totalCheckIns > 0 ? totalRevenue / totalCheckIns : 0;
  const revLostPerCancellation = totalCancellations > 0 ? (totalRevenue / totalCheckIns) * totalCancellations / totalCancellations : 0;
  
  // Calculate weighted average (capacity-weighted fill rate)
  const weightedAverage = totalCapacity > 0 ? fillRate : 0;
  
  // Calculate consistency score (based on variance)
  const avgAttendance = classAvg;
  const variance = sessions.length > 0 ? sessions.reduce((sum, s) => {
    const diff = (s.checkins || 0) - avgAttendance;
    return sum + diff * diff;
  }, 0) / sessions.length : 0;
  const stdDev = Math.sqrt(variance);
  const consistencyScore = avgAttendance > 0 ? Math.max(0, 100 - (stdDev / avgAttendance) * 100) : 0;
  
  // Determine status
  const status: 'Active' | 'Inactive' = sessions.some(s => s.status === 'Active') ? 'Active' : 'Inactive';
  
  // Get most recent date
  const mostRecentDate = sessions.reduce((latest, s) => {
    const sessionDate = new Date(s.date);
    return sessionDate > latest ? sessionDate : latest;
  }, new Date(0));
  
  // Calculate composite score
  const compositeScore = calculateCompositeScore(classAvg, fillRate, totalClasses);
  
  return {
    classes: totalClasses,
    emptyClasses,
    nonEmptyClasses,
    fillRate,
    cancellationRate,
    waitlistRate,
    rank: 0,
    classAvg,
    classAvgNonEmpty,
    revPerBooking,
    revPerCheckin,
    revLostPerCancellation,
    weightedAverage,
    consistencyScore,
    totalRevenue,
    totalCheckIns,
    totalBookings,
    totalCancellations,
    totalCapacity,
    totalBooked,
    totalWaitlisted,
    status,
    mostRecentDate,
    compositeScore,
  };
}

/**
 * Calculate totals row for current view
 */
export function calculateTotalsRow(data: (SessionData | GroupedRow)[]): CalculatedMetrics {
  const sessions: SessionData[] = [];
  
  data.forEach((row) => {
    if ('isGroupRow' in row && row.isGroupRow && row.children) {
      sessions.push(...row.children);
    } else {
      sessions.push(row as SessionData);
    }
  });
  
  return calculateMetrics(sessions);
}
