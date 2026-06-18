import React, { useMemo, useRef, useState } from 'react';
import { BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import { SalesData, FilterOptions, YearOnYearMetricType } from '@/types/dashboard';
import { ModernTableWrapper, STANDARD_METRICS } from './ModernTableWrapper';
import { TABLE_STYLES } from '@/styles/tableStyles';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { parseDate } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';

interface ProductCategoryMetricsTableProps {
  /** Raw sales rows (can be already filtered). The table will re-apply the provided dateRange. */
  data: SalesData[];
  /** Date range context (defaults to previous-month range provided by parent Sales tab). */
  filters?: FilterOptions;
  onReady?: () => void;
}

type MetricDef = { key: YearOnYearMetricType; label: string };

const METRICS: MetricDef[] = STANDARD_METRICS.map((m) => ({
  key: m.key as YearOnYearMetricType,
  label: m.label,
}));

const toDateRange = (filters?: FilterOptions) => {
  const start = filters?.dateRange?.start ? new Date(filters.dateRange.start) : null;
  const end = filters?.dateRange?.end
    ? (() => {
        const d = new Date(filters.dateRange.end);
        d.setHours(23, 59, 59, 999);
        return d;
      })()
    : null;
  return { start, end };
};

const withinRange = (dateStr: string | undefined, start: Date | null, end: Date | null) => {
  if (!dateStr) return false;
  const d = parseDate(dateStr);
  if (!d) return false;
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};

const getPeriodLabel = (filters?: FilterOptions) => {
  const start = filters?.dateRange?.start ? parseDate(filters.dateRange.start) : null;
  const end = filters?.dateRange?.end ? parseDate(filters.dateRange.end) : null;

  const base = start || end;
  if (base) {
    return base.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  // Fallback: previous month
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return prevMonth.toLocaleString('en-US', { month: 'short', year: 'numeric' });
};

const num = (v: any): number => {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[\s,]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  return 0;
};

const getMetricValue = (items: SalesData[], metric: YearOnYearMetricType) => {
  if (!items.length) return 0;

  // NET revenue: paymentValue - VAT
  const totalRevenue = items.reduce((sum, item) => {
    const payment = num((item as any).paymentValue);
    const vat = num((item as any).paymentVAT) || num((item as any).vat);
    return sum + (payment - vat);
  }, 0);

  const transactionIds = new Set(
    items
      .map((item) => (item as any).paymentTransactionId || (item as any).paymentTransactionID || (item as any).transactionId)
      .filter(Boolean)
  );
  const totalTransactions = transactionIds.size > 0 ? transactionIds.size : items.length;

  const uniqueMembers = new Set(items.map((item) => item.memberId || item.customerEmail).filter(Boolean)).size;

  const unitIds = new Set(
    items
      .map((item) => (item as any).salesItemId || (item as any).saleItemId || (item as any).saleItemID || (item as any).itemId)
      .filter(Boolean)
  );
  const totalUnits = unitIds.size > 0 ? unitIds.size : items.length;

  const totalDiscountAmount = items.reduce((sum, item) => sum + num((item as any).discountAmount), 0);
  const totalVat = items.reduce((sum, item) => sum + (num((item as any).paymentVAT) || num((item as any).vat)), 0);

  const totalGrossRevenue = items.reduce((sum, item) => sum + num((item as any).paymentValue), 0);
  const discountPercentage = totalGrossRevenue > 0 ? (totalDiscountAmount / totalGrossRevenue) * 100 : 0;

  // Purchase Frequency in Days
  const dates = items
    .map((item) => parseDate(item.paymentDate))
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime());

  let purchaseFrequency = 0;
  if (dates.length > 1) {
    const totalDays = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
    purchaseFrequency = totalDays / (dates.length - 1);
  }

  switch (metric) {
    case 'revenue':
      return totalRevenue;
    case 'units':
      return totalUnits;
    case 'transactions':
      return totalTransactions;
    case 'members':
      return uniqueMembers;
    case 'auv':
      return uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0;
    case 'atv':
      return totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    case 'asv':
      return uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0;
    case 'upt':
      return totalTransactions > 0 ? totalUnits / totalTransactions : 0;
    case 'vat':
      return totalVat;
    case 'discountAmount':
    case 'discountValue':
      return totalDiscountAmount;
    case 'discountPercentage':
      return discountPercentage;
    case 'purchaseFrequency':
      return purchaseFrequency;
    default:
      return 0;
  }
};

const formatMetricValue = (value: number, metric: YearOnYearMetricType) => {
  switch (metric) {
    case 'revenue':
    case 'auv':
    case 'atv':
    case 'asv':
    case 'vat':
    case 'discountValue':
    case 'discountAmount':
      return formatCurrency(value);
    case 'transactions':
    case 'members':
    case 'units':
      return formatNumber(value);
    case 'upt':
      return value.toFixed(1);
    case 'discountPercentage':
      return `${value.toFixed(1)}%`;
    case 'purchaseFrequency':
      return `${value.toFixed(1)} days`;
    default:
      return formatNumber(value);
  }
};

type CategoryBlock = {
  category: string;
  products: Array<{ product: string; items: SalesData[] }>;
};

export const ProductCategoryMetricsTable: React.FC<ProductCategoryMetricsTableProps> = ({
  data,
  filters,
  onReady,
}) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const periodLabel = useMemo(() => getPeriodLabel(filters), [filters]);

  const { start, end } = useMemo(() => toDateRange(filters), [filters]);

  const periodData = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    // Re-apply date-range so this table is always “previous month/current selected period”
    return rows.filter((r) => withinRange(r.paymentDate, start, end));
  }, [data, start, end]);

  const grouped = useMemo<CategoryBlock[]>(() => {
    const byCategory = new Map<string, Map<string, SalesData[]>>();

    for (const row of periodData) {
      const category = row.cleanedCategory || 'Uncategorized';
      const product = row.cleanedProduct || 'Unspecified';
      if (!byCategory.has(category)) byCategory.set(category, new Map());
      const byProduct = byCategory.get(category)!;
      if (!byProduct.has(product)) byProduct.set(product, []);
      byProduct.get(product)!.push(row);
    }

    const blocks: CategoryBlock[] = [];
    for (const [category, byProduct] of byCategory.entries()) {
      const products = Array.from(byProduct.entries())
        .map(([product, items]) => ({ product, items }))
        .sort((a, b) => getMetricValue(b.items, 'revenue') - getMetricValue(a.items, 'revenue'));
      blocks.push({ category, products });
    }

    // Sort categories by revenue descending
    blocks.sort((a, b) => {
      const aRev = getMetricValue(a.products.flatMap((p) => p.items), 'revenue');
      const bRev = getMetricValue(b.products.flatMap((p) => p.items), 'revenue');
      return bRev - aRev;
    });

    return blocks;
  }, [periodData]);

  const totals = useMemo(() => {
    const totalByMetric = new Map<YearOnYearMetricType, number>();
    for (const m of METRICS) {
      totalByMetric.set(m.key, getMetricValue(periodData, m.key));
    }
    return totalByMetric;
  }, [periodData]);

  const totalProducts = useMemo(() => grouped.reduce((sum, g) => sum + g.products.length, 0), [grouped]);

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const collapseAll = () => setCollapsedCategories(new Set(grouped.map((g) => g.category)));
  const expandAll = () => setCollapsedCategories(new Set());

  React.useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <ModernTableWrapper
      title="Product × Category Metrics (Previous Month)"
      description={`Each metric is a column; rows are products grouped by category for ${periodLabel}.`}
      icon={<BarChart3 className="w-5 h-5 text-white" />}
      totalItems={totalProducts}
      headerControls={
        <Badge variant="secondary" className="bg-white/20 text-white font-semibold">
          {periodLabel}
        </Badge>
      }
      showCollapseControls={true}
      onCollapseAll={collapseAll}
      onExpandAll={expandAll}
      tableRef={tableRef}
      contextInfo={{
        selectedMetric: 'all',
        dateRange: filters?.dateRange?.start && filters?.dateRange?.end ? filters.dateRange : undefined,
        filters: {
          category: filters?.category,
          product: filters?.product,
          soldBy: filters?.soldBy,
          paymentMethod: filters?.paymentMethod,
        },
      }}
    >
      <div className={TABLE_STYLES.container}>
        <table ref={tableRef} className={TABLE_STYLES.table}>
          <thead className={TABLE_STYLES.header.wrapper}>
            <tr className={TABLE_STYLES.header.row}>
              <th
                className={cn(
                  TABLE_STYLES.header.cell,
                  TABLE_STYLES.header.cellSticky,
                  'min-w-[280px]'
                )}
              >
                Product
              </th>
              {METRICS.map((m) => (
                <th
                  key={m.key}
                  className={cn(TABLE_STYLES.header.cell, TABLE_STYLES.header.monthCell)}
                >
                  <div className={TABLE_STYLES.header.monthDisplay}>
                    <span className={TABLE_STYLES.header.monthText}>{m.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {grouped.length === 0 ? (
              <tr className={TABLE_STYLES.body.row}>
                <td className={cn(TABLE_STYLES.body.cell, 'text-center text-slate-500')} colSpan={METRICS.length + 1}>
                  No records found for the selected period.
                </td>
              </tr>
            ) : (
              grouped.map((group, groupIndex) => {
                const isCollapsed = collapsedCategories.has(group.category);
                const categoryItems = group.products.flatMap((p) => p.items);
                return (
                  <React.Fragment key={group.category}>
                    <tr className={TABLE_STYLES.group.row}>
                      <td className={cn(TABLE_STYLES.group.cell, TABLE_STYLES.group.cellSticky)}>
                        <button
                          type="button"
                          onClick={() => toggleCategory(group.category)}
                          className="flex items-center gap-2 w-full text-left"
                        >
                          {isCollapsed ? (
                            <ChevronRight className={TABLE_STYLES.group.expandIcon} />
                          ) : (
                            <ChevronDown className={TABLE_STYLES.group.expandIcon} />
                          )}
                          <span className="font-bold">{group.category}</span>
                        </button>
                      </td>

                      {METRICS.map((m) => {
                        const val = getMetricValue(categoryItems, m.key);
                        return (
                          <td
                            key={`${group.category}::group::${m.key}`}
                            className={cn(TABLE_STYLES.group.cell, TABLE_STYLES.body.cellCenter, 'tabular-nums')}
                          >
                            {formatMetricValue(val, m.key)}
                          </td>
                        );
                      })}
                    </tr>

                    {!isCollapsed &&
                      group.products.map((p, productIndex) => {
                        const rowAlt = (groupIndex + productIndex) % 2 === 1;
                        return (
                          <tr
                            key={`${group.category}::${p.product}`}
                            className={cn(TABLE_STYLES.body.row, rowAlt && TABLE_STYLES.body.rowAlternate)}
                          >
                            <td
                              className={cn(
                                TABLE_STYLES.body.cell,
                                TABLE_STYLES.body.cellSticky,
                                TABLE_STYLES.body.cellBold
                              )}
                            >
                              {p.product}
                            </td>
                            {METRICS.map((m) => {
                              const val = getMetricValue(p.items, m.key);
                              return (
                                <td
                                  key={`${group.category}::${p.product}::${m.key}`}
                                  className={cn(TABLE_STYLES.body.cell, TABLE_STYLES.body.cellCenter, 'tabular-nums')}
                                >
                                  {formatMetricValue(val, m.key)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })
            )}

            {/* Totals footer row */}
            {grouped.length > 0 && (
              <tr className={TABLE_STYLES.footer.row}>
                <td className={cn(TABLE_STYLES.footer.cell, TABLE_STYLES.footer.cellSticky)}>
                  <span className={TABLE_STYLES.footer.label}>TOTALS</span>
                </td>
                {METRICS.map((m) => (
                  <td key={`totals::${m.key}`} className={cn(TABLE_STYLES.footer.cell, TABLE_STYLES.footer.cellCenter)}>
                    {formatMetricValue(totals.get(m.key) || 0, m.key)}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModernTableWrapper>
  );
};
