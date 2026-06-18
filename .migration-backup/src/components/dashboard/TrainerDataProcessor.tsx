import { PayrollData } from '@/types/dashboard';

export interface ProcessedTrainerData {
  trainerId: string;
  trainerName: string;
  trainerEmail: string;
  location: string;
  monthYear: string;
  monthKey?: string; // YYYY-MM
  monthLabel?: string; // Mon YYYY

  // Session breakdown
  totalSessions: number;
  emptySessions: number;
  nonEmptySessions: number;
  totalCustomers: number;
  totalPaid: number;

  cycleSessions: number;
  emptyCycleSessions: number;
  nonEmptyCycleSessions: number;
  cycleCustomers: number;
  cycleRevenue: number;

  strengthSessions: number;
  emptyStrengthSessions: number;
  nonEmptyStrengthSessions: number;
  strengthCustomers: number;
  strengthRevenue: number;

  barreSessions: number;
  emptyBarreSessions: number;
  nonEmptyBarreSessions: number;
  barreCustomers: number;
  barreRevenue: number;

  // Calculated metrics
  classAverageExclEmpty: number;
  classAverageInclEmpty: number;
  conversion: number;
  retention: number;

  // Enhanced metrics
  fillRate: number;
  capacity: number;
  utilizationRate: number;
  topFormat: string;
  formatDistribution: { [format: string]: number };
  revenuePerSession: number;
  revenuePerCustomer: number;
  growthRate: number;
  consistencyScore: number;

  // New data points
  uniqueKey: string;
  newMembers: number;
  convertedMembers: number;
  retainedMembers: number;
  conversionRate: number;
  retentionRate: number;
}

export const processTrainerData = (payrollData: PayrollData[]): ProcessedTrainerData[] => {
  const parseMonth = (monthStr: string) => {
    if (!monthStr) return { monthKey: '', monthLabel: '' };
    // Accept formats: "Feb-2024", "Feb 2024", "2/2024"
    let d: Date | null = null;
    if (monthStr.includes('/')) {
      const [m, y] = monthStr.split('/').map(s => s.trim());
      const mi = parseInt(m) - 1;
      const yi = parseInt(y);
      if (!isNaN(mi) && !isNaN(yi)) d = new Date(yi, mi, 1);
    } else if (monthStr.includes('-') || monthStr.includes(' ')) {
      const parts = monthStr.replace('-', ' ').split(' ').filter(Boolean);
      const mon = parts[0];
      const yi = parseInt(parts[1]);
      const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const mi = names.indexOf(mon);
      if (mi >= 0 && !isNaN(yi)) d = new Date(yi, mi, 1);
    }
    if (!d || isNaN(d.getTime())) return { monthKey: '', monthLabel: monthStr };
    const monthKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthLabel = `${names[d.getMonth()]} ${d.getFullYear()}`;
    return { monthKey, monthLabel };
  };

  return payrollData.map(record => {
    const totalSessions = record.totalSessions || 0;
    const emptySessions = record.totalEmptySessions || 0;
    const nonEmptySessions = record.totalNonEmptySessions || 0;
    const totalCustomers = record.totalCustomers || 0;
    const totalPaid = record.totalPaid || 0;

    const cycleSessions = record.cycleSessions || 0;
    const barreSessions = record.barreSessions || 0;
  const strengthSessions = record.strengthSessions || 0;

    // Class averages
    const classAverageExclEmpty = nonEmptySessions > 0 ? totalCustomers / nonEmptySessions : 0;
    const classAverageInclEmpty = totalSessions > 0 ? totalCustomers / totalSessions : 0;

    // Conversion & Retention - extract numeric values from percentage strings
    const conversionRate = typeof record.conversion === 'string' 
      ? parseFloat(record.conversion.replace('%', '')) || 0
      : Number(record.conversion) || 0;
    const retentionRate = typeof record.retention === 'string' 
      ? parseFloat(record.retention.replace('%', '')) || 0
      : Number(record.retention) || 0;

    // Enhanced metrics calculations
  const capacity = totalSessions * 20; // Approximated capacity per session
    const fillRate = capacity > 0 ? (totalCustomers / capacity) * 100 : 0;
    const utilizationRate = totalSessions > 0 ? (nonEmptySessions / totalSessions) * 100 : 0;
    
    // Determine top format
    const formatStats = {
      'Cycle': cycleSessions,
      'Barre': barreSessions,
      'Strength': strengthSessions
    };
    const topFormat = Object.entries(formatStats).reduce((a, b) => formatStats[a[0]] > formatStats[b[0]] ? a : b)[0];
    
    // Format distribution
    const formatDistribution = {
      'Cycle': cycleSessions > 0 ? (cycleSessions / totalSessions) * 100 : 0,
      'Barre': barreSessions > 0 ? (barreSessions / totalSessions) * 100 : 0,
      'Strength': strengthSessions > 0 ? (strengthSessions / totalSessions) * 100 : 0
    };

    // Revenue metrics
    const revenuePerSession = totalSessions > 0 ? totalPaid / totalSessions : 0;
    const revenuePerCustomer = totalCustomers > 0 ? totalPaid / totalCustomers : 0;

    // Growth rate and consistency score calculations
    // Note: These require historical data for accurate calculation
    const growthRate = 0; // Set to 0 until historical data is available
    const consistencyScore = Math.min(100, ((nonEmptySessions / Math.max(totalSessions, 1)) * 100)); // Based on fill rate

    const { monthKey, monthLabel } = parseMonth(record.monthYear || '');
    return {
      trainerId: record.teacherId,
      trainerName: record.teacherName,
      trainerEmail: record.teacherEmail,
      location: record.location,
      monthYear: record.monthYear || '',
      monthKey,
      monthLabel,

      totalSessions,
      emptySessions,
      nonEmptySessions,
      totalCustomers,
      totalPaid,

      cycleSessions,
      emptyCycleSessions: record.emptyCycleSessions || 0,
      nonEmptyCycleSessions: record.nonEmptyCycleSessions || 0,
      cycleCustomers: record.cycleCustomers || 0,
      cycleRevenue: record.cyclePaid || 0,

  strengthSessions,
  emptyStrengthSessions: record.emptyStrengthSessions || 0,
  nonEmptyStrengthSessions: record.nonEmptyStrengthSessions || 0,
  strengthCustomers: record.strengthCustomers || 0,
  strengthRevenue: record.strengthPaid || 0,

      barreSessions,
      emptyBarreSessions: record.emptyBarreSessions || 0,
      nonEmptyBarreSessions: record.nonEmptyBarreSessions || 0,
      barreCustomers: record.barreCustomers || 0,
      barreRevenue: record.barrePaid || 0,

      classAverageExclEmpty,
      classAverageInclEmpty,

      // Enhanced metrics
      fillRate,
      capacity,
      utilizationRate,
      topFormat,
      formatDistribution,
      revenuePerSession,
      revenuePerCustomer,
      growthRate,
      consistencyScore,

  conversion: record.converted || 0,
  retention: record.retained || 0,

      uniqueKey: record.unique || '',
      newMembers: record.new || 0,
      convertedMembers: record.converted || 0,
      retainedMembers: record.retained || 0,
      conversionRate,
      retentionRate,
    };
  });
};

export const getMetricValue = (data: ProcessedTrainerData, metric: string): number => {
  switch (metric) {
    case 'totalSessions': return data.totalSessions;
    case 'totalCustomers': return data.totalCustomers;
    case 'totalPaid': return data.totalPaid;
    case 'classAverageExclEmpty': return data.classAverageExclEmpty;
    case 'classAverageInclEmpty': return data.classAverageInclEmpty;
    case 'emptySessions': return data.emptySessions;
    case 'nonEmptySessions': return data.nonEmptySessions;
    case 'cycleSessions': return data.cycleSessions;
    case 'cycleRevenue': return data.cycleRevenue;
    case 'barreSessions': return data.barreSessions;
    case 'barreRevenue': return data.barreRevenue;
    case 'strengthSessions': return data.strengthSessions;
    case 'strengthRevenue': return data.strengthRevenue;
    case 'conversion': return data.conversion;
    case 'retention': return data.retention;
    case 'conversionRate': return data.conversionRate;
    case 'retentionRate': return data.retentionRate;
    case 'newMembers': return data.newMembers;
    case 'convertedMembers': return data.convertedMembers;
    case 'retainedMembers': return data.retainedMembers;
    case 'fillRate': return data.fillRate;
    case 'capacity': return data.capacity;
    case 'utilizationRate': return data.utilizationRate;
    case 'revenuePerSession': return data.revenuePerSession;
    case 'revenuePerCustomer': return data.revenuePerCustomer;
    case 'growthRate': return data.growthRate;
    case 'consistencyScore': return data.consistencyScore;
    default: return 0;
  }
};
