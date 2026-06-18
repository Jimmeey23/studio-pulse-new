
// Date utility functions for the dashboard
import { logger } from './logger';

export const getDashboardDefaultDateRange = () => getPreviousMonthDateRange();

export const getDashboardDefaultDateRangeAsDates = () => {
  const defaultRange = getDashboardDefaultDateRange();
  return {
    start: new Date(`${defaultRange.start}T00:00:00`),
    end: new Date(`${defaultRange.end}T00:00:00`),
  };
};

export const getPreviousMonthDateRange = () => {
  const now = new Date();
  // Get the first day of the previous month
  const firstDayPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // Get the last day of the previous month  
  const lastDayPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  // Format dates as YYYY-MM-DD using local timezone
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const result = {
    start: formatDate(firstDayPreviousMonth),
    end: formatDate(lastDayPreviousMonth)
  };
  
  logger.debug('Previous month date range:', result, { 
    firstDay: firstDayPreviousMonth.toDateString(), 
    lastDay: lastDayPreviousMonth.toDateString(),
    currentMonth: now.getMonth() + 1,
    previousMonth: firstDayPreviousMonth.getMonth() + 1
  });
  
  return result;
};

export const getCurrentMonthDateRange = () => {
  const now = new Date();
  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    start: firstDayCurrentMonth.toISOString().split('T')[0],
    end: lastDayCurrentMonth.toISOString().split('T')[0]
  };
};

export const getDateRangeForMonths = (monthsBack: number) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
};

/**
 * Generate a standard month range from Jan 2024 to current month.
 * Returns months in ascending order (oldest -> newest), with fields:
 * { key: 'YYYY-MM', display: 'Mon YYYY', year, month, quarter, sortOrder }
 */
export const generateStandardMonthRange = () => {
  const months = [] as Array<{ key: string; display: string; year: number; month: number; quarter: number; sortOrder: number }>;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), 1); // current month
  const start = new Date(2024, 0, 1); // January 2024

  let iterYear = start.getFullYear();
  let iterMonth = start.getMonth();

  while (iterYear < end.getFullYear() || (iterYear === end.getFullYear() && iterMonth <= end.getMonth())) {
    months.push({
      key: `${iterYear}-${String(iterMonth + 1).padStart(2, '0')}`,
      display: `${monthNames[iterMonth]} ${iterYear}`,
      year: iterYear,
      month: iterMonth + 1,
      quarter: Math.ceil((iterMonth + 1) / 3),
      sortOrder: iterYear * 100 + (iterMonth + 1)
    });

    iterMonth++;
    if (iterMonth > 11) {
      iterMonth = 0;
      iterYear++;
    }
  }

  return months;
};

export const generateDynamicMonths = (monthCount: number = 18) => {
  const months = [];
  const now = new Date();
  
  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    months.push({
      key: `${year}-${month.toString().padStart(2, '0')}`,
      display: `${date.toLocaleDateString('en-US', { month: 'short' })} ${year}`,
      year,
      month
    });
  }
  
  return months;
};

export const parseDate = (dateString: string): Date | null => {
  if (!dateString || dateString.trim() === '') return null;
  
  try {
    // Handle comma-separated timestamp e.g., "2020-01-01, 17:30:00" by taking the date part
    if (dateString.includes(',')) {
      const datePart = dateString.split(',')[0].trim();
      // Parse YYYY-MM-DD as local midnight to avoid UTC offset issues
      const dashParts = datePart.split('-');
      if (dashParts.length === 3) {
        const y = parseInt(dashParts[0]), m = parseInt(dashParts[1]), d = parseInt(dashParts[2]);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m - 1, d);
      }
      const d = new Date(datePart);
      if (!isNaN(d.getTime())) return d;
    }
    
    // Handle DD/MM/YYYY or D/M/YY format with optional time (e.g., "14/09/2025 10:00:00", "4/3/22")
    if (dateString.includes('/')) {
      // Split by space to separate date and time, take only date part
      const datePart = dateString.split(' ')[0].trim();
      const parts = datePart.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const rawYear = parseInt(parts[2]);
        const year = rawYear < 100 ? 2000 + rawYear : rawYear;

        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month - 1, day);
        }
      }
    }
    
    // Handle YYYY-MM-DD (and YYYY-MM-DD HH:MM:SS) format — parse as local midnight
    // to avoid UTC-offset date-shifting in timezones like IST (+5:30)
    if (dateString.includes('-')) {
      const datePart = dateString.split(' ')[0].trim();
      const parts = datePart.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month - 1, day);
        }
      }
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try direct parsing
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch (error) {
    logger.warn('Failed to parse date:', dateString, error);
    return null;
  }
};

// New function to get previous month as period string for filters that use period instead of date range
export const getPreviousMonthPeriod = () => {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = previousMonth.getFullYear();
  const month = previousMonth.getMonth() + 1;
  
  return `${year}-${month.toString().padStart(2, '0')}`;
};

// Function to get previous month display name
export const getPreviousMonthDisplay = () => {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  return `${previousMonth.toLocaleDateString('en-US', { month: 'long' })} ${previousMonth.getFullYear()}`;
};
