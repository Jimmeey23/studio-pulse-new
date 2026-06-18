/**
 * Executive Metrics Calculation Utilities
 * Provides real period-over-period comparisons for executive dashboard
 */

interface MetricComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

/**
 * Calculate period-over-period comparison
 * @param current Current period value
 * @param previous Previous period value
 * @param invertPositive If true, decreases are positive (e.g., for churn rate)
 */
export const calculatePeriodComparison = (
  current: number,
  previous: number,
  invertPositive: boolean = false
): MetricComparison => {
  const change = current - previous;
  const changePercent = previous !== 0 
    ? ((change / previous) * 100).toFixed(1)
    : current !== 0 ? '100.0' : '0.0';
  
  let changeType: 'positive' | 'negative' | 'neutral' = 'neutral';
  
  if (change > 0) {
    changeType = invertPositive ? 'negative' : 'positive';
  } else if (change < 0) {
    changeType = invertPositive ? 'positive' : 'negative';
  }
  
  return {
    current,
    previous,
    change,
    changePercent: `${change >= 0 ? '+' : ''}${changePercent}%`,
    changeType
  };
};

/**
 * Filter data by date range (ISO format: YYYY-MM-DD)
 */
export const filterDataByDateRange = <T extends { [key: string]: any }>(
  data: T[],
  dateField: string,
  startDate: string,
  endDate: string
): T[] => {
  return data.filter(item => {
    const itemDate = item[dateField];
    if (!itemDate) return false;
    
    // Parse to ISO date string for consistent comparison
    const dateStr = new Date(itemDate).toISOString().split('T')[0];
    return dateStr >= startDate && dateStr <= endDate;
  });
};

/**
 * Get date range for a specific month
 */
export const getMonthDateRange = (monthsBack: number = 0): { start: string; end: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - monthsBack;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  return {
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0]
  };
};

/**
 * Calculate metrics for current and previous periods
 */
export const calculateMetricsWithComparison = <T>(
  allData: T[],
  dateField: string,
  calculateMetric: (data: T[]) => number,
  invertPositive: boolean = false
): MetricComparison => {
  // Current month (last month completed)
  const currentRange = getMonthDateRange(1);
  const currentData = filterDataByDateRange(allData, dateField, currentRange.start, currentRange.end);
  const currentValue = calculateMetric(currentData);
  
  // Previous month (2 months ago)
  const previousRange = getMonthDateRange(2);
  const previousData = filterDataByDateRange(allData, dateField, previousRange.start, previousRange.end);
  const previousValue = calculateMetric(previousData);
  
  return calculatePeriodComparison(currentValue, previousValue, invertPositive);
};

/**
 * Get display period label
 */
export const getPeriodLabel = (monthsBack: number = 1): string => {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};
