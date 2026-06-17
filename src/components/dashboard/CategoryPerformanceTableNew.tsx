import React, { useMemo, useState, useCallback, useRef } from 'react';
import { SalesData, YearOnYearMetricType } from '@/types/dashboard';
import { ModernTableWrapper, ModernGroupBadge, ModernMetricTabs, STANDARD_METRICS } from './ModernTableWrapper';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ChevronDown, ChevronRight, FolderOpen, TrendingUp, TrendingDown, BarChart3, DollarSign, Users, ShoppingCart, Target, Layers, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shallowEqual } from '@/utils/performanceUtils';
import { useTableCopyContext } from '@/hooks/useTableCopyContext';

interface CategoryPerformanceTableNewProps {
  data: SalesData[];
  onRowClick: (row: any) => void;
  selectedMetric?: YearOnYearMetricType;
  onReady?: () => void;
}

export const CategoryPerformanceTableNewComponent: React.FC<CategoryPerformanceTableNewProps> = ({
  data,
  onRowClick,
  selectedMetric: initialMetric = 'revenue',
  onReady
}) => {
  const [selectedMetric, setSelectedMetric] = useState<YearOnYearMetricType>(initialMetric);
  const tableRef = useRef<HTMLTableElement>(null);
  const [localCollapsedGroups, setLocalCollapsedGroups] = useState<Set<string>>(new Set());
  const [displayMode, setDisplayMode] = useState<'values' | 'growth'>('values');
  const [sortKey, setSortKey] = useState<string>('total');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // Get context information for enhanced table copying
  const copyContext = useTableCopyContext();
  
  const getPreviousMonthKey = () => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  };
  const previousMonthKey = getPreviousMonthKey();

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const getMetricValue = (items: SalesData[], metric: YearOnYearMetricType) => {
    if (!items.length) return 0;
    // Use NET revenue: paymentValue - VAT
    const totalRevenue = items.reduce((sum, item) => {
      const payment = item.paymentValue || 0;
      const vat = item.paymentVAT || item.vat || 0;
      return sum + (payment - vat);
    }, 0);
    
    // Transactions = unique count of payment transaction ID
    const uniqueTransactionIds = new Set(items.map(item => item.paymentTransactionId || item.transactionId).filter(Boolean));
    const totalTransactions = uniqueTransactionIds.size > 0 ? uniqueTransactionIds.size : items.length;
    
    // Members = unique count of member ID
    const uniqueMembers = new Set(items.map(item => item.memberId).filter(Boolean)).size;
    
    // Units Sold = unique count of sales item ID
    const uniqueSalesItemIds = new Set(items.map(item => item.salesItemId || item.itemId).filter(Boolean));
    const totalUnits = uniqueSalesItemIds.size > 0 ? uniqueSalesItemIds.size : items.length;
    
    // VAT and Discount
    const totalVat = items.reduce((sum, item) => sum + (item.paymentVAT || item.vat || 0), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    
    // Calculate discount percentage correctly: Total Discounts / (Total Gross Revenue) * 100
    const totalGrossRevenue = items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const avgDiscountPercentage = totalGrossRevenue > 0
      ? (totalDiscount / totalGrossRevenue) * 100
      : 0;
    
    // Purchase Frequency in Days
    const dates = items.map(item => {
      const dateStr = item.paymentDate;
      if (!dateStr) return null;
      const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      return new Date(dateStr);
    }).filter((date): date is Date => date !== null && !isNaN(date.getTime())).sort((a, b) => a.getTime() - b.getTime());
    
    let purchaseFrequency = 0;
    if (dates.length > 1) {
      const totalDays = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
      purchaseFrequency = totalDays / (dates.length - 1);
    }

    switch (metric) {
      case 'revenue': return totalRevenue;
      case 'transactions': return totalTransactions;
      case 'members': return uniqueMembers;
      case 'units': return totalUnits;
      case 'atv': return totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      case 'auv': return uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0;
      case 'asv': return uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0; // ASV = Gross Sales / Unique Members
      case 'upt': return totalTransactions > 0 ? totalUnits / totalTransactions : 0;
      case 'vat': return totalVat;
      case 'discountAmount': return totalDiscount;
      case 'discountPercentage': return avgDiscountPercentage;
      case 'purchaseFrequency': return purchaseFrequency;
      default: return 0;
    }
  };

  const formatMetricValue = (value: number, metric: YearOnYearMetricType) => {
    switch (metric) {
      case 'revenue':
      case 'auv':
      case 'atv':
      case 'asv':
      case 'vat':
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

  const monthlyData = useMemo(() => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Generate months from Jan 2024 to current month in ASCENDING order
    const startDate = new Date(2024, 0, 1); // January 2024
    const endDate = new Date(currentYear, currentMonth, 1);
    
    let date = new Date(startDate);
    while (date <= endDate) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthName = monthNames[date.getMonth()];
      months.push({
        key: `${year}-${String(month).padStart(2, '0')}`,
        display: `${monthName} ${year}`,
        year: year,
        month: month,
        quarter: Math.ceil(month / 3)
      });
      date = new Date(year, date.getMonth() + 1, 1);
    }
    return months;
  }, []);

  const processedData = useMemo(() => {
    // Group by category
    const categoryGroups = data.reduce((acc: Record<string, SalesData[]>, item) => {
      const category = item.cleanedCategory || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

  const categoryData = Object.entries(categoryGroups).map(([category, items]) => {
      const monthlyValues: Record<string, number> = {};
      
      monthlyData.forEach(({ key, year, month }) => {
        const monthItems = items.filter(item => {
          const itemDate = parseDate(item.paymentDate);
          return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
        });
        monthlyValues[key] = getMetricValue(monthItems, selectedMetric);
      });

      // Get unique products in this category
      const uniqueProducts = new Set(items.map(item => item.cleanedProduct || 'Unknown')).size;

      return {
        category,
        monthlyValues,
        totalValue: getMetricValue(items, selectedMetric),
        totalRevenue: items.reduce((sum, item) => {
          const payment = item.paymentValue || 0;
          const vat = item.paymentVAT || item.vat || 0;
          return sum + (payment - vat);
        }, 0),
        totalTransactions: items.length,
        uniqueMembers: new Set(items.map(item => item.memberId)).size,
        uniqueProducts,
        rawData: items
      };
    });

    const comparator = (a: any, b: any) => {
      const byMonth = (obj: any, key: string) => obj.monthlyValues?.[key] || 0;
      let av: number, bv: number;
      if (sortKey === 'total') { av = a.totalValue; bv = b.totalValue; }
      else { av = byMonth(a, sortKey); bv = byMonth(b, sortKey); }
      return sortDir === 'desc' ? bv - av : av - bv;
    };
    return categoryData.sort(comparator);
  }, [data, selectedMetric, monthlyData, sortKey, sortDir]);

  // monthlyData here is built in descending order (current back); show the entire range to Jan 2024
  const visibleMonths = useMemo(() => monthlyData, [monthlyData]);

  // Notify parent when ready
  const [readySent, setReadySent] = React.useState(false);
  React.useEffect(() => {
    if (!readySent && processedData.length > 0 && visibleMonths.length > 0) {
      setReadySent(true);
      onReady?.();
    }
  }, [readySent, processedData, visibleMonths, onReady]);

  const getGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return '+100';
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Function to generate content for all metric tabs
  const generateAllTabsContent = useCallback(async () => {
    let allContent = `Category Performance Analysis - All Metrics\n`;
    allContent += `Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`;
    allContent += `\n${'='.repeat(80)}\n\n`;

    // Loop through all metrics from STANDARD_METRICS
    for (const metricInfo of STANDARD_METRICS) {
      const metric = metricInfo.key as YearOnYearMetricType;

      allContent += `\n${metricInfo.label.toUpperCase()}\n`;
      allContent += `${'-'.repeat(metricInfo.label.length + 10)}\n\n`;

      // Add table headers
      const headers = ['Category', 'Total'];
      visibleMonths.forEach(month => headers.push(month.display));
      allContent += headers.join('\t') + '\n';
      allContent += headers.map(() => '---').join('\t') + '\n';

      // Reprocess data specifically for this metric
      const categoryData = data.reduce((acc: Record<string, SalesData[]>, item) => {
        const category = item.cleanedCategory || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
      }, {});

      const metricProcessedData = Object.entries(categoryData).map(([category, items]) => {
        const monthlyValues: Record<string, number> = {};
        
        monthlyData.forEach(({ key, year, month }) => {
          const monthItems = items.filter(item => {
            const itemDate = parseDate(item.paymentDate);
            return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
          });
          monthlyValues[key] = getMetricValue(monthItems, metric);
        });

        return {
          category,
          monthlyValues,
          totalValue: getMetricValue(items, metric)
        };
      });

      // Add data rows
      metricProcessedData.forEach(categoryData => {
        const categoryRow = [categoryData.category, formatMetricValue(categoryData.totalValue, metric)];
        
        visibleMonths.forEach(month => {
          const value = categoryData.monthlyValues[month.key] || 0;
          categoryRow.push(formatMetricValue(value, metric));
        });
        allContent += categoryRow.join('\t') + '\n';
      });

      allContent += `\n`;
    }

    return allContent;
  }, [data, visibleMonths, monthlyData]);

  // Prepare data and columns for AI analysis
  const aiTableData = useMemo(() => {
    return processedData.map(category => ({
      category: category.category,
      totalRevenue: category.totalRevenue,
      totalTransactions: category.totalTransactions,
      uniqueMembers: category.uniqueMembers,
      uniqueProducts: category.uniqueProducts,
      avgTransactionValue: category.totalTransactions > 0 ? category.totalRevenue / category.totalTransactions : 0,
      avgRevenuePerMember: category.uniqueMembers > 0 ? category.totalRevenue / category.uniqueMembers : 0,
      ...Object.fromEntries(
        visibleMonths.map(({ key }) => [
          `month_${key}`, category.monthlyValues[key] || 0
        ])
      )
    }));
  }, [processedData, monthlyData, visibleMonths]);

  const aiTableColumns = useMemo(() => {
    const baseColumns = [
      { key: 'category', header: 'Category', type: 'text' as const },
      { key: 'totalRevenue', header: 'Total Revenue', type: 'currency' as const },
      { key: 'totalTransactions', header: 'Total Transactions', type: 'number' as const },
      { key: 'uniqueMembers', header: 'Unique Members', type: 'number' as const },
      { key: 'uniqueProducts', header: 'Unique Products', type: 'number' as const },
      { key: 'avgTransactionValue', header: 'Avg Transaction Value', type: 'currency' as const },
      { key: 'avgRevenuePerMember', header: 'Avg Revenue per Member', type: 'currency' as const }
    ];

    const monthColumns = visibleMonths.map(({ key, display }) => ({
      key: `month_${key}`,
      header: `${display}`,
      type: selectedMetric === 'revenue' || selectedMetric === 'atv' || selectedMetric === 'auv' ? 'currency' as const : 'number' as const
    }));

    return [...baseColumns, ...monthColumns];
  }, [monthlyData, selectedMetric, visibleMonths]);



  return (
    <div className="space-y-6">
      {/* Modern Metric Selector */}
      <ModernMetricTabs
        metrics={STANDARD_METRICS}
        selectedMetric={selectedMetric}
        onMetricChange={(metric) => setSelectedMetric(metric as YearOnYearMetricType)}
      />

      <ModernTableWrapper
        title="Category Performance Analysis"
        description="High-level category performance overview with comprehensive metrics and trends"
        icon={<Layers className="w-6 h-6 text-white" />}
        totalItems={processedData.length}
        showDisplayToggle={true}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        className="animate-in slide-in-from-bottom-8 fade-in duration-1000"
        tableRef={tableRef}
        showCopyButton={true}
        onCopyAllTabs={generateAllTabsContent}
        contextInfo={{
          selectedMetric: selectedMetric,
          dateRange: copyContext.dateRange,
          filters: copyContext.filters,
          additionalInfo: {
            displayMode: displayMode,
            totalItems: processedData.length,
            sortBy: sortKey,
            sortDirection: sortDir
          }
        }}
      >
        <div className="overflow-x-auto" data-table="category-performance-analysis">
          <table ref={tableRef} className="min-w-full bg-white">
            <thead className="sticky top-0 z-30">
              <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <th
                  className="w-[30rem] px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide sticky left-0 z-40 border-r border-white/20 cursor-pointer select-none"
                  onClick={() => {
                    if (sortKey !== 'total') { setSortKey('total'); setSortDir('desc'); }
                    else setSortDir(d => d === 'desc' ? 'asc' : 'desc');
                  }}
                  title={`Sort by total (${sortDir})`}
                >
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="w-4 h-4 text-white" />
                    <span>Category</span>
                  </div>
                </th>
                
                {visibleMonths.map(({ key, display }) => {
                  const isPreviousMonth = key === previousMonthKey;
                  return (
                  <th
                    key={key}
                    className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wider border-l border-white/20 min-w-[90px] cursor-pointer select-none ${
                      isPreviousMonth 
                        ? 'bg-blue-800 text-white' 
                        : 'text-white'
                    }`}
                    onClick={() => {
                      if (sortKey !== key) { setSortKey(key); setSortDir('desc'); }
                      else setSortDir(d => d === 'desc' ? 'asc' : 'desc');
                    }}
                    title={`Sort by ${display} (${sortDir})${isPreviousMonth ? ' - Main Month' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex items-center space-x-1">
                        {isPreviousMonth && <Star className="w-3 h-3" />}
                        <span className="text-xs font-bold whitespace-nowrap">{display.split(' ')[0]}</span>
                      </div>
                      <span className="text-slate-300 text-xs">{display.split(' ')[1]}</span>
                    </div>
                  </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {processedData.map((category, categoryIndex) => (
                <tr 
                  key={category.category}
                  className="bg-white hover:bg-slate-50 border-b border-gray-200 transition-all duration-200 h-9 max-h-9"
                  onClick={() => onRowClick?.({
                    ...category,
                    contextType: 'category',
                    drillDownContext: 'category-performance',
                    filterCriteria: {
                      category: category.category
                    },
                    clickedItemName: category.category,
                    contextDescription: `Complete performance analysis for ${category.category} category`
                  })}
                >
                  <td className="w-[30rem] px-4 py-2 text-left sticky left-0 bg-white hover:bg-slate-50 border-r border-gray-200 z-20 cursor-pointer transition-all duration-200 whitespace-nowrap overflow-hidden text-ellipsis">
                    <div className="flex items-center space-x-2 min-h-8">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="text-slate-700 font-medium text-sm whitespace-nowrap">{category.category}</span>
                      </div>
                    </div>
                  </td>
                  
                  {visibleMonths.map(({ key }, monthIndex) => {
                    const current = category.monthlyValues[key] || 0;
                    const previousMonthKey = visibleMonths[monthIndex + 1]?.key;
                    const previous = previousMonthKey ? (category.monthlyValues[previousMonthKey] || 0) : 0;
                    const growthPercentage = monthIndex < visibleMonths.length - 1 ? getGrowthPercentage(current, previous) : null;
                    
                    return (
                      <td 
                        key={key} 
                        className="px-2 py-2 text-center text-sm font-mono text-slate-700 border-l border-gray-200 hover:bg-slate-100 cursor-pointer transition-all duration-200"
                        title={growthPercentage ? `${growthPercentage}% vs previous month` : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick?.({
                            ...category,
                            contextType: 'category-month',
                            filterCriteria: {
                              category: category.category,
                              month: key,
                              specificValue: current
                            },
                            drillDownContext: {
                              type: 'category-month',
                              itemName: category.category,
                              month: key,
                              value: current,
                              metric: selectedMetric
                            },
                            clickedItemName: category.category,
                            contextDescription: `${category.category} performance in ${key}: ${formatMetricValue(current, selectedMetric)}`
                          });
                        }}
                      >
                        <div className="flex flex-col items-center space-y-0.5 min-h-6 justify-center">
                          {displayMode === 'values' ? (
                            <span className="text-xs whitespace-nowrap">{formatMetricValue(current, selectedMetric)}</span>
                          ) : (
                            growthPercentage && (
                              <div className={`flex items-center space-x-1 text-xs ${
                                parseFloat(growthPercentage) > 0 ? 'text-emerald-500' : 'text-red-400'
                              }`}>
                                {parseFloat(growthPercentage) > 0 ? 
                                  <TrendingUp className="w-2 h-2" /> : 
                                  <TrendingDown className="w-2 h-2" />
                                }
                                <span className="font-mono">{Math.abs(parseFloat(growthPercentage))}%</span>
                              </div>
                            )
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr 
                className="bg-slate-800 text-white font-bold border-t-2 border-slate-400 h-10 max-h-10 cursor-pointer hover:bg-slate-700"
                onClick={() => onRowClick?.({
                  drillDownContext: 'category-grand-total',
                  filterCriteria: {},
                  name: 'Grand Total (All Categories)',
                  rawData: data,
                  isGroup: true,
                })}
              >
                <td className="w-80 px-4 py-2 text-left sticky left-0 bg-slate-800 group-hover:bg-slate-700 border-r border-slate-400 z-20">
                  <div className="flex items-center space-x-2 min-h-6">
                    <span className="font-bold text-sm text-white">TOTALS</span>
                  </div>
                </td>
                
                {visibleMonths.map(({ key }) => {
                  const totalValue = processedData.reduce((sum, category) => {
                    return sum + (category.monthlyValues[key] || 0);
                  }, 0);
                  
                  return (
                    <td 
                      key={key} 
                      className="px-2 py-2 text-center text-sm font-bold text-white border-l border-slate-400 group-hover:bg-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick?.({
                          drillDownContext: 'category-total-month',
                          filterCriteria: { month: key },
                          name: `Grand Total (${key})`,
                          month: key,
                        })
                      }}
                    >
                      <div className="flex flex-col items-center space-y-0.5 min-h-6 justify-center">
                        <span className="font-mono text-xs whitespace-nowrap">{formatMetricValue(totalValue, selectedMetric)}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </ModernTableWrapper>
      
      {/* Persistent Footer */}
      <PersistentTableFooter
        tableId="category-performance-analysis"
        initialText="• Category-level performance insights across all product lines\n• Revenue distribution and market share analysis by category\n• Growth trends and seasonal patterns identification"
        className="animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300"
        tableData={aiTableData}
        tableColumns={aiTableColumns}
        tableName="Category Performance Analysis"
        tableContext={`Performance analysis by product category showing ${selectedMetric} trends across ${visibleMonths.length} months`}
      />
    </div>
  );
};

// Memoized export with custom comparison function
export const CategoryPerformanceTableNew = React.memo(
  CategoryPerformanceTableNewComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.selectedMetric === nextProps.selectedMetric &&
      prevProps.onRowClick === nextProps.onRowClick &&
      prevProps.onReady === nextProps.onReady
    );
  }
);