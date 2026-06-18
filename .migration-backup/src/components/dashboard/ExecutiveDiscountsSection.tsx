import React, { useMemo } from 'react';
import { Percent, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { StandardizedMetricCard } from './StandardizedMetricCard';
import { StandardizedTable } from './StandardizedTable';
import { useDiscountAnalysis } from '@/hooks/useDiscountAnalysis';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/formatters';
import { parseDate } from '@/utils/dateUtils';

interface ExecutiveDiscountsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveDiscountsSection: React.FC<ExecutiveDiscountsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: discountData, loading: discountLoading } = useDiscountAnalysis();
  const { filters } = useGlobalFilters();

  // Filter discounts by date range and location
  const filteredDiscounts = useMemo(() => {
    if (!discountData) return [];

    return discountData.filter(discount => {
      // Apply date range filter
      if (filters.dateRange?.start && filters.dateRange?.end) {
        const discountDate = parseDate(discount.paymentDate);
        const filterStart = new Date(filters.dateRange.start);
        const filterEnd = new Date(filters.dateRange.end);
        filterEnd.setHours(23, 59, 59, 999);

        if (!discountDate || discountDate < filterStart || discountDate > filterEnd) {
          return false;
        }
      }

      // Apply location filter
      if (filters.location && filters.location.length > 0) {
        const locations = Array.isArray(filters.location) ? filters.location : [filters.location];
        if (!locations.includes('all') && !locations.some(loc => discount.location?.includes(loc))) {
          return false;
        }
      }

      return true;
    });
  }, [discountData, filters.dateRange, filters.location]);

  // Calculate discount metrics
  const discountMetrics = useMemo(() => {
    if (!filteredDiscounts || filteredDiscounts.length === 0) {
      return {
        totalDiscounts: 0,
        avgDiscount: 0,
        maxDiscount: 0,
        minDiscount: 0,
        discountCount: 0,
      };
    }

    const discounts = filteredDiscounts.map((d: any) => d.discountAmount || 0);
    const totalDiscounts = discounts.reduce((sum, d) => sum + d, 0);
    const discountCount = filteredDiscounts.length;

    return {
      totalDiscounts,
      avgDiscount: discountCount > 0 ? totalDiscounts / discountCount : 0,
      maxDiscount: Math.max(...discounts),
      minDiscount: Math.min(...discounts),
      discountCount,
    };
  }, [filteredDiscounts]);

  // Group discounts by category
  const discountsByCategory = useMemo(() => {
    if (!filteredDiscounts || filteredDiscounts.length === 0) return [];

    const map = new Map<string, { count: number; total: number }>();
    filteredDiscounts.forEach((d: any) => {
      const category = d.category || d.discountType || 'General';
      if (!map.has(category)) {
        map.set(category, { count: 0, total: 0 });
      }
      const data = map.get(category)!;
      data.count += 1;
      data.total += d.discountAmount || 0;
    });

    return Array.from(map.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        total: data.total,
        avg: data.total / data.count,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredDiscounts]);

  if (discountLoading) {
    return (
      <ExecutiveSectionCard
        title="Discounts & Promotions"
        icon={Percent}
        borderColor="amber"
        description="Discount trends, impact analysis, and ROI"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <ExecutiveSectionCard
      title="Discounts & Promotions"
      icon={Percent}
      borderColor="amber"
      description="Discount trends, impact analysis, and ROI"
      contentClassName="space-y-6"
    >
      {/* Metric Cards */}
      <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StandardizedMetricCard
            title="Total Discounts"
            value={formatCurrency(discountMetrics.totalDiscounts)}
            icon={DollarSign}
            color="amber"
            subtitle="Revenue reduced"
          />
          <StandardizedMetricCard
            title="Discount Count"
            value={discountMetrics.discountCount}
            icon={Percent}
            color="blue"
            subtitle="Transactions"
          />
          <StandardizedMetricCard
            title="Avg Discount"
            value={formatCurrency(discountMetrics.avgDiscount)}
            icon={TrendingUp}
            color="emerald"
            subtitle="Per transaction"
          />
          <StandardizedMetricCard
            title="Max Discount"
            value={formatCurrency(discountMetrics.maxDiscount)}
            icon={AlertCircle}
            color="rose"
            subtitle="Highest value"
          />
        </div>
      </div>

      {/* Discount Categories Breakdown */}
      {discountsByCategory.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Discounts by Category</h4>
          <StandardizedTable
            data={discountsByCategory}
            columns={[
              { key: 'category', header: 'Category', align: 'left' },
              { key: 'count', header: 'Count', align: 'center', render: (val) => formatNumber(val) },
              { key: 'total', header: 'Total Discount', align: 'center', render: (val) => formatCurrency(val) },
              { key: 'avg', header: 'Avg Discount', align: 'center', render: (val) => formatCurrency(val) },
            ]}
            headerColor="slate"
            footerData={{
              category: 'TOTAL',
              count: discountsByCategory.reduce((sum, item) => sum + item.count, 0),
              total: discountsByCategory.reduce((sum, item) => sum + item.total, 0),
              avg: discountsByCategory.reduce((sum, item) => sum + item.avg, 0) / discountsByCategory.length,
            }}
            striped
          />
        </div>
      )}
    </ExecutiveSectionCard>
  );
};

export default ExecutiveDiscountsSection;
