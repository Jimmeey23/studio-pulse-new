import React, { useMemo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { ExecutiveDrillDownModal } from './ExecutiveDrillDownModal';
import { SalesAnimatedMetricCardsComponent } from './SalesAnimatedMetricCards';
import { ModernSalesTable } from './ModernSalesTable';
import { useSalesData } from '@/hooks/useSalesData';
import { useSalesMetrics } from '@/hooks/useSalesMetrics';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface ExecutiveSalesSectionProps {
  locationId?: string;
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveSalesSection: React.FC<ExecutiveSalesSectionProps> = ({
  locationId,
  onMetricClick,
}) => {
  const { filters } = useGlobalFilters();
  const { data: salesData, loading: salesLoading } = useSalesData();
  const { data: previousSalesData } = useSalesData();
  const salesMetrics = useSalesMetrics(salesData, previousSalesData);
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');

  // Prepare table data - top products/categories
  const tableData = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    // Calculate net revenue (paymentValue is already net, excluding VAT)
    return salesData
      .slice(0, 8) // Top 8 items
      .map((item: any, index: number) => {
        // paymentValue is NET revenue (excluding VAT)
        const netRevenue = item.paymentValue || 0;
        const vatAmount = item.paymentVAT || 0;
        const grossRevenue = netRevenue + vatAmount;
        
        return {
          ...item,
          name: item.customerName || item.product || `Item ${index + 1}`,
          revenue: netRevenue, // Use NET revenue for consistency with table
          grossRevenue: grossRevenue,
          netRevenue: netRevenue,
          vatAmount: vatAmount,
          transactions: 1, // Each row is one transaction
          discountAmount: item.paymentDiscount || 0,
          atv: netRevenue, // ATV based on net revenue
          category: item.cleanedProduct || item.cleanedCategory || item.product || item.productCategory || 'General',
          previousRevenue: 0,
          previousTransactions: 0,
        };
      });
  }, [salesData]);

  if (salesLoading) {
    return (
      <ExecutiveSectionCard
        title="Sales Overview"
        icon={ShoppingCart}
        borderColor="emerald"
        description="Revenue, transactions, and ATV metrics"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <>
      <ExecutiveSectionCard
        title="Sales Overview"
        icon={ShoppingCart}
        borderColor="emerald"
        description="Revenue, transactions, and ATV metrics"
        contentClassName="space-y-6"
      >
        {/* Metric Cards */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
          <div className="cursor-pointer" onClick={() => {
            setSelectedMetric('revenue');
            setDrillDownOpen(true);
          }}>
            <SalesAnimatedMetricCardsComponent
              data={salesData || []}
              historicalData={previousSalesData || salesData || []}
              dateRange={filters.dateRange}
              onMetricClick={onMetricClick}
              locationId={locationId}
            />
          </div>
        </div>

        {/* Sales Table */}
        {tableData.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Top Products & Categories</h4>
            <ModernSalesTable
              data={tableData}
              loading={salesLoading}
              title=""
              maxHeight="400px"
              showFooter={true}
              footerData={{
                name: 'TOTAL',
                revenue: tableData.reduce((sum: number, item: any) => sum + item.revenue, 0),
                transactions: tableData.reduce((sum: number, item: any) => sum + item.transactions, 0),
                discountAmount: tableData.reduce((sum: number, item: any) => sum + item.discountAmount, 0),
                atv: tableData.reduce((sum: number, item: any) => sum + item.atv, 0) / tableData.length,
              }}
            />
          </div>
        )}
      </ExecutiveSectionCard>

      {/* Drill-Down Modal */}
      <ExecutiveDrillDownModal
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        title={`${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Analysis`}
        metric="Net Revenue (Excluding VAT)"
        currentValue={formatCurrency(salesMetrics[0]?.rawValue || 0)}
        previousValue={salesMetrics[0] ? formatCurrency(salesMetrics[0].previousRawValue) : undefined}
        description="Detailed breakdown of net sales revenue excluding VAT. All values shown are net amounts."
        borderColor="emerald"
        breakdownData={
          tableData.slice(0, 5).map((item: any) => ({
            label: item.category || item.name,
            value: formatCurrency(item.revenue),
            percentage: (item.revenue / tableData.reduce((sum: number, i: any) => sum + i.revenue, 0)) * 100,
            color: 'bg-emerald-500',
          }))
        }
        analyticsText={`Net revenue analysis shows ${formatCurrency(tableData.reduce((sum: number, i: any) => sum + i.revenue, 0))} in total net sales across ${tableData.length} transactions. All figures exclude VAT (${formatCurrency(tableData.reduce((sum: number, i: any) => sum + (i.vatAmount || 0), 0))} total VAT).`}
        rawData={tableData}
        rawDataColumns={[
          { key: 'name', label: 'Customer/Product', format: 'text' },
          { key: 'category', label: 'Category', format: 'text' },
          { key: 'netRevenue', label: 'Net Revenue', format: 'currency' },
          { key: 'vatAmount', label: 'VAT Amount', format: 'currency' },
          { key: 'grossRevenue', label: 'Gross Revenue', format: 'currency' },
          { key: 'transactions', label: 'Transactions', format: 'number' },
          { key: 'atv', label: 'ATV', format: 'currency' },
        ]}
      />
    </>
  );
};

export default ExecutiveSalesSection;
