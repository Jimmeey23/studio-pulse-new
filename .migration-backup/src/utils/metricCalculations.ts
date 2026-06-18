import { SalesData } from '@/types/dashboard';

export type YearOnYearMetricType = 
  | 'revenue' 
  | 'transactions' 
  | 'members' 
  | 'units' 
  | 'atv' 
  | 'auv' 
  | 'asv' 
  | 'upt' 
  | 'vat' 
  | 'netRevenue' 
  | 'discountValue' 
  | 'discountPercentage';

/**
 * Standardized metric calculation to ensure consistency across all tables
 */
export const calculateMetricValue = (items: SalesData[], metric: YearOnYearMetricType): number => {
  if (!items.length) return 0;
  
  const totalRevenue = items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
  const totalTransactions = items.length;
  const uniqueMembers = new Set(items.map(item => item.memberId)).size;
  const totalUnits = items.length; // Each transaction represents 1 unit
  
  // Use actual VAT from data, not calculated percentage
  const totalVat = items.reduce((sum, item) => sum + (item.paymentVAT || item.vat || 0), 0);
  
  // Use actual discount data from the items
  const totalDiscount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  
  // Calculate average discount percentage from actual data
  const itemsWithDiscount = items.filter(item => (item.discountAmount || 0) > 0);
  const avgDiscountPercentage = itemsWithDiscount.length > 0 
    ? itemsWithDiscount.reduce((sum, item) => sum + (item.discountPercentage || 0), 0) / itemsWithDiscount.length
    : 0;

  switch (metric) {
    case 'revenue': 
      return totalRevenue;
    case 'transactions': 
      return totalTransactions;
    case 'members': 
      return uniqueMembers;
    case 'units': 
      return totalUnits;
    case 'atv': // Average Transaction Value
      return totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    case 'auv': // Average Unit Value
      return totalUnits > 0 ? totalRevenue / totalUnits : 0;
    case 'asv': // Average Spend per Member
      return uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0;
    case 'upt': // Units Per Transaction
      return totalTransactions > 0 ? totalUnits / totalTransactions : 0;
    case 'vat': 
      return totalVat;
    case 'netRevenue': 
      return totalRevenue - totalVat;
    case 'discountValue': 
      return totalDiscount;
    case 'discountPercentage': 
      return avgDiscountPercentage;
    default: 
      return 0;
  }
};

/**
 * Standardized metric formatting to ensure consistency across all tables
 */
export const formatMetricValue = (value: number, metric: YearOnYearMetricType): string => {
  switch (metric) {
    case 'revenue':
    case 'auv':
    case 'atv':
    case 'asv':
    case 'vat':
    case 'netRevenue':
    case 'discountValue':
      return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    case 'transactions':
    case 'members':
    case 'units':
      return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    case 'upt':
      return value.toFixed(1);
    case 'discountPercentage':
      return `${value.toFixed(1)}%`;
    default:
      return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
};

/**
 * Helper function to parse date strings consistently
 */
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  // Handle various date formats
  const cleanDateStr = dateStr.toString().trim();
  if (!cleanDateStr) return null;
  
  // Try different date formats
  const formats = [
    () => new Date(cleanDateStr),
    () => new Date(cleanDateStr.replace(/\//g, '-')),
    () => {
      // Handle DD/MM/YYYY format
      const parts = cleanDateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return new Date(`${year}-${month}-${day}`);
      }
      return null;
    }
  ];
  
  for (const format of formats) {
    try {
      const date = format();
      if (date && !isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
};

/**
 * Filter items by year and month
 */
export const filterByYearMonth = (items: SalesData[], year: number, month: number): SalesData[] => {
  return items.filter(item => {
    const date = parseDate(item.paymentDate);
    if (!date) return false;
    
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });
};