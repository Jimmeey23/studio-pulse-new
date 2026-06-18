import { useMemo } from 'react';
import { SalesData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

type Trend = 'strong' | 'moderate' | 'weak';

export interface DiscountMetric {
  title: string;
  value: string;
  rawValue: number;
  change: number; // percent
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

const num = (v: any): number => {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  return 0;
};

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

export function useDiscountMetrics(
  data: SalesData[] = [],
  historicalData?: SalesData[],
  options?: Options
) {
  return useMemo(() => {

    // Current period metrics come directly from `data` (which is already filtered)
    // Historical/previous period comes from `historicalData` filtered by previous month
    
    // Determine comparison end date for period labeling
    let compareEnd: Date;
    if (options?.dateRange?.end) {
      compareEnd = typeof options.dateRange.end === 'string' 
        ? new Date(options.dateRange.end) 
        : (options.dateRange.end as Date);
    } else {
      compareEnd = new Date();
    }
    
    const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const currentStart = monthStart(compareEnd);
    const prevAnchor = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 15);
    const prevStart = monthStart(prevAnchor);
    const prevEnd = monthEnd(prevAnchor);
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    const periodLabel = `${fmt(currentStart)} vs ${fmt(prevStart)}`;

    const within = (d?: Date | null, start?: Date, end?: Date) => !!(d && start && end && d >= start && d <= end);

    // Current period: use data directly (it's already filtered by the dashboard)
    const current = data;
    
    // Previous period: filter historicalData by the previous month
    const histBase = (historicalData && historicalData.length > 0) ? historicalData : [];
    const previous = histBase.filter((it) => within(parseDate((it as any).paymentDate), prevStart, prevEnd));
    


    // Compute metrics for a list
    // Note: totalRevenue here = paymentValue (net revenue after discount, before VAT)
    const totals = (list: SalesData[]) => {
      const totalDiscounts = list.reduce((s, it) => s + num(it.discountAmount), 0);
      const totalRevenue = list.reduce((s, it) => s + num(it.paymentValue), 0);
      const totalTransactions = list.length;
      const discountedTransactions = list.filter((it) => num(it.discountAmount) > 0).length;
      const uniqueCustomers = new Set(list.map((it) => it.memberId || it.customerEmail).filter(Boolean)).size;
      const customersWithDiscounts = new Set(
        list.filter((it) => num(it.discountAmount) > 0).map((it) => it.memberId || it.customerEmail).filter(Boolean)
      ).size;

      // Calculate discount rate: Total Discounts / Gross Revenue (before discount) * 100
      const grossRevenue = totalRevenue + totalDiscounts;
      const discountRate = grossRevenue > 0 ? (totalDiscounts / grossRevenue) * 100 : 0;
      const discountPenetration = totalTransactions > 0 ? (discountedTransactions / totalTransactions) * 100 : 0;
      const customerDiscountPenetration = uniqueCustomers > 0 ? (customersWithDiscounts / uniqueCustomers) * 100 : 0;
      const avgDiscountPerTransaction = discountedTransactions > 0 ? totalDiscounts / discountedTransactions : 0;
      const avgDiscountPerCustomer = customersWithDiscounts > 0 ? totalDiscounts / customersWithDiscounts : 0;

      return {
        totalDiscounts,
        totalRevenue,
        discountRate,
        discountedTransactions,
        customersWithDiscounts,
        avgDiscountPerTransaction,
        avgDiscountPerCustomer,
        discountPenetration,
        customerDiscountPenetration,
        totalTransactions,
      };
    };

    const cur = totals(current);
    const prev = totals(previous);
    


    const m: DiscountMetric[] = [
      {
        title: 'Total Discounts',
        value: formatCurrency(cur.totalDiscounts),
        rawValue: cur.totalDiscounts,
        change: calcGrowth(cur.totalDiscounts, prev.totalDiscounts).rate,
        changeDetails: calcGrowth(cur.totalDiscounts, prev.totalDiscounts),
        previousValue: formatCurrency(prev.totalDiscounts),
        previousRawValue: prev.totalDiscounts,
        periodLabel,
        icon: 'DollarSign',
        description: 'Total amount discounted this month',
      },
      {
        title: 'Discount Rate',
        value: formatPercentage(cur.discountRate),
        rawValue: cur.discountRate,
        change: calcGrowth(cur.discountRate, prev.discountRate).rate,
        changeDetails: calcGrowth(cur.discountRate, prev.discountRate),
        previousValue: formatPercentage(prev.discountRate),
        previousRawValue: prev.discountRate,
        periodLabel,
        icon: 'Percent',
        description: 'Discounts as % of gross (pre-discount) revenue',
      },
      {
        title: 'Transactions with Discounts',
        value: formatNumber(cur.discountedTransactions),
        rawValue: cur.discountedTransactions,
        change: calcGrowth(cur.discountedTransactions, prev.discountedTransactions).rate,
        changeDetails: calcGrowth(cur.discountedTransactions, prev.discountedTransactions),
        previousValue: formatNumber(prev.discountedTransactions),
        previousRawValue: prev.discountedTransactions,
        periodLabel,
        icon: 'ShoppingCart',
        description: 'Number of transactions where a discount was applied',
      },
      {
        title: 'Customers with Discounts',
        value: formatNumber(cur.customersWithDiscounts),
        rawValue: cur.customersWithDiscounts,
        change: calcGrowth(cur.customersWithDiscounts, prev.customersWithDiscounts).rate,
        changeDetails: calcGrowth(cur.customersWithDiscounts, prev.customersWithDiscounts),
        previousValue: formatNumber(prev.customersWithDiscounts),
        previousRawValue: prev.customersWithDiscounts,
        periodLabel,
        icon: 'Users',
        description: 'Unique customers receiving discounts',
      },
      {
        title: 'Avg Discount per Transaction',
        value: formatCurrency(cur.avgDiscountPerTransaction),
        rawValue: cur.avgDiscountPerTransaction,
        change: calcGrowth(cur.avgDiscountPerTransaction, prev.avgDiscountPerTransaction).rate,
        changeDetails: calcGrowth(cur.avgDiscountPerTransaction, prev.avgDiscountPerTransaction),
        previousValue: formatCurrency(prev.avgDiscountPerTransaction),
        previousRawValue: prev.avgDiscountPerTransaction,
        periodLabel,
        icon: 'Target',
        description: 'Average discount per discounted transaction',
      },
      {
        title: 'Avg Discount per Customer',
        value: formatCurrency(cur.avgDiscountPerCustomer),
        rawValue: cur.avgDiscountPerCustomer,
        change: calcGrowth(cur.avgDiscountPerCustomer, prev.avgDiscountPerCustomer).rate,
        changeDetails: calcGrowth(cur.avgDiscountPerCustomer, prev.avgDiscountPerCustomer),
        previousValue: formatCurrency(prev.avgDiscountPerCustomer),
        previousRawValue: prev.avgDiscountPerCustomer,
        periodLabel,
        icon: 'Activity',
        description: 'Average discount per customer receiving discounts',
      },
      {
        title: 'Discount Penetration',
        value: formatPercentage(cur.discountPenetration),
        rawValue: cur.discountPenetration,
        change: calcGrowth(cur.discountPenetration, prev.discountPenetration).rate,
        changeDetails: calcGrowth(cur.discountPenetration, prev.discountPenetration),
        previousValue: formatPercentage(prev.discountPenetration),
        previousRawValue: prev.discountPenetration,
        periodLabel,
        icon: 'PieChart',
        description: 'Percentage of transactions that received discounts',
      },
      {
        title: 'Customer Discount Rate',
        value: formatPercentage(cur.customerDiscountPenetration),
        rawValue: cur.customerDiscountPenetration,
        change: calcGrowth(cur.customerDiscountPenetration, prev.customerDiscountPenetration || 0).rate,
        changeDetails: calcGrowth(cur.customerDiscountPenetration, prev.customerDiscountPenetration || 0),
        previousValue: formatPercentage(prev.customerDiscountPenetration || 0),
        previousRawValue: prev.customerDiscountPenetration || 0,
        periodLabel,
        icon: 'UserCheck',
        description: 'Percentage of unique customers who received discounts',
      },
    ];

    return { metrics: m };
  }, [data, historicalData, options?.dateRange?.start, options?.dateRange?.end]);
}
