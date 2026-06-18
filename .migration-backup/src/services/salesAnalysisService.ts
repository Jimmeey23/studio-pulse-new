import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

interface MonthlyAnalysis {
  month: string;
  year: number;
  totalRevenue: number;
  transactions: number;
  uniqueMembers: number;
  avgSpendPerMember: number;
  avgTransactionValue: number;
  discountAmount: number;
  discountPercentage: number;
  categoryBreakdown: Record<string, { revenue: number; percentage: number; transactions: number }>;
  topProducts: Array<{ product: string; revenue: number; transactions: number }>;
  bottomProducts: Array<{ product: string; revenue: number; transactions: number }>;
}

interface ComparisonAnalysis {
  current: MonthlyAnalysis;
  previous: MonthlyAnalysis;
  revenueChange: number;
  revenueChangePercent: number;
  transactionsChange: number;
  transactionsChangePercent: number;
  membersChange: number;
  membersChangePercent: number;
  asvChange: number;
  asvChangePercent: number;
  atvChange: number;
  atvChangePercent: number;
}

export interface DetailedSummary {
  current: MonthlyAnalysis;
  previous: MonthlyAnalysis;
  analysis: ComparisonAnalysis;
  insights: string[];
  topGainer?: {
    category: string;
    current: { revenue: number; percentage: number };
    previous?: { revenue: number; percentage: number };
    change: number;
    changePercent: number;
  };
  topDecliner?: {
    category: string;
    current: { revenue: number; percentage: number };
    previous?: { revenue: number; percentage: number };
    change: number;
    changePercent: number;
  };
  categoryChanges: Array<{
    category: string;
    current: { revenue: number; percentage: number };
    previous?: { revenue: number; percentage: number };
    change: number;
    changePercent: number;
  }>;
}

export class SalesAnalysisService {
  private static getPreviousMonth(): { month: number; year: number } {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      month: prevMonth.getMonth() + 1,
      year: prevMonth.getFullYear()
    };
  }

  private static parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Try DD/MM/YYYY format
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  private static filterDataByMonth(data: SalesData[], month: number, year: number): SalesData[] {
    const filtered = data.filter(item => {
      const date = this.parseDate(item.paymentDate);
      if (!date) return false;
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });
    
    // Filtering data by month
    
    return filtered;
  }

  private static analyzeMonth(data: SalesData[], month: number, year: number): MonthlyAnalysis {
    const monthData = this.filterDataByMonth(data, month, year);
    
    const totalRevenue = monthData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const transactions = monthData.length;
    const uniqueMembers = new Set(monthData.map(item => item.memberId || item.customerEmail)).size;
    const avgSpendPerMember = uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0;
    const avgTransactionValue = transactions > 0 ? totalRevenue / transactions : 0;
    const discountAmount = monthData.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    // Calculate discount percentage correctly: discounts as % of gross revenue (before discount)
    // Gross revenue = Net revenue (paymentValue) + Discounts given
    const grossRevenue = totalRevenue + discountAmount;
    const discountPercentage = grossRevenue > 0 ? (discountAmount / grossRevenue) * 100 : 0;

    // Category breakdown
    const categoryMap = new Map<string, { revenue: number; transactions: number }>();
    monthData.forEach(item => {
      const category = item.cleanedCategory || 'Uncategorized';
      const current = categoryMap.get(category) || { revenue: 0, transactions: 0 };
      categoryMap.set(category, {
        revenue: current.revenue + (item.paymentValue || 0),
        transactions: current.transactions + 1
      });
    });

    const categoryBreakdown: Record<string, { revenue: number; percentage: number; transactions: number }> = {};
    categoryMap.forEach((value, key) => {
      categoryBreakdown[key] = {
        revenue: value.revenue,
        percentage: totalRevenue > 0 ? (value.revenue / totalRevenue) * 100 : 0,
        transactions: value.transactions
      };
    });

    // Top and bottom products
    const productMap = new Map<string, { revenue: number; transactions: number }>();
    monthData.forEach(item => {
      const product = item.cleanedProduct || 'Unspecified';
      const current = productMap.get(product) || { revenue: 0, transactions: 0 };
      productMap.set(product, {
        revenue: current.revenue + (item.paymentValue || 0),
        transactions: current.transactions + 1
      });
    });

    const products = Array.from(productMap.entries())
      .map(([product, data]) => ({ product, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });

    return {
      month: monthName,
      year,
      totalRevenue,
      transactions,
      uniqueMembers,
      avgSpendPerMember,
      avgTransactionValue,
      discountAmount,
      discountPercentage,
      categoryBreakdown,
      topProducts: products.slice(0, 5),
      bottomProducts: products.slice(-5).reverse()
    };
  }

  public static generateComparisonAnalysis(data: SalesData[]): ComparisonAnalysis {
    const { month: prevMonth, year: prevYear } = this.getPreviousMonth();
    
    // Debug logs removed for production performance
    // Get previous month (e.g., October)
    let currentMonth = prevMonth;
    let currentYear = prevYear;
    
    // Get month before that (e.g., September)
    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear -= 1;
    }

    // Debug logs removed for production performance
    const current = this.analyzeMonth(data, currentMonth, currentYear);
    const previous = this.analyzeMonth(data, previousMonth, previousYear);

    // Debug logs removed for production performance

    return {
      current,
      previous,
      revenueChange: current.totalRevenue - previous.totalRevenue,
      revenueChangePercent: previous.totalRevenue > 0 
        ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100 
        : 0,
      transactionsChange: current.transactions - previous.transactions,
      transactionsChangePercent: previous.transactions > 0 
        ? ((current.transactions - previous.transactions) / previous.transactions) * 100 
        : 0,
      membersChange: current.uniqueMembers - previous.uniqueMembers,
      membersChangePercent: previous.uniqueMembers > 0 
        ? ((current.uniqueMembers - previous.uniqueMembers) / previous.uniqueMembers) * 100 
        : 0,
      asvChange: current.avgSpendPerMember - previous.avgSpendPerMember,
      asvChangePercent: previous.avgSpendPerMember > 0 
        ? ((current.avgSpendPerMember - previous.avgSpendPerMember) / previous.avgSpendPerMember) * 100 
        : 0,
      atvChange: current.avgTransactionValue - previous.avgTransactionValue,
      atvChangePercent: previous.avgTransactionValue > 0 
        ? ((current.avgTransactionValue - previous.avgTransactionValue) / previous.avgTransactionValue) * 100 
        : 0
    };
  }

  public static generateDetailedSummary(analysis: ComparisonAnalysis): DetailedSummary {
    const { current, previous } = analysis;
    const isPositiveRevenue = analysis.revenueChangePercent > 0;
    const isPositiveMembers = analysis.membersChangePercent > 0;
    const isPositiveASV = analysis.asvChangePercent > 0;

    // Determine primary drivers
    const categoryChanges = Object.entries(current.categoryBreakdown).map(([category, data]) => {
      const prevData = previous.categoryBreakdown[category];
      const change = prevData ? data.revenue - prevData.revenue : data.revenue;
      const changePercent = prevData && prevData.revenue > 0 
        ? ((data.revenue - prevData.revenue) / prevData.revenue) * 100 
        : 0;
      return { category, current: data, previous: prevData, change, changePercent };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    const topGainer = categoryChanges.find(c => c.change > 0);
    const topDecliner = categoryChanges.find(c => c.change < 0);

    // Generate insights
    const insights: string[] = [];
    
    if (isPositiveRevenue && !isPositiveMembers && isPositiveASV) {
      insights.push('Revenue growth driven by higher spend per customer, but member count declined - unsustainable high-value, low-volume model');
    } else if (isPositiveRevenue && isPositiveMembers) {
      insights.push('Healthy growth with both revenue and member base expanding');
    } else if (!isPositiveRevenue && !isPositiveMembers) {
      insights.push('Critical: Both revenue and member base declining - urgent intervention needed');
    }

    if (Math.abs(analysis.membersChangePercent) > 15) {
      insights.push(`Significant ${isPositiveMembers ? 'surge' : 'drop'} in unique members (${analysis.membersChangePercent.toFixed(1)}%) requires immediate attention`);
    }

    if (current.discountPercentage > 2 || (current.discountAmount - previous.discountAmount) / previous.discountAmount > 0.3) {
      insights.push('Discount strategy showing concerning trends - may be eroding margins');
    }

    return { current, previous, analysis, insights, topGainer, topDecliner, categoryChanges };
  }
}
