import React, { useMemo, useState, useCallback, useRef } from 'react';
import { SalesData, FilterOptions, YearOnYearMetricType, EnhancedYearOnYearTableProps } from '@/types/dashboard';
import { ModernTableWrapper, ModernGroupBadge, ModernMetricTabs, STANDARD_METRICS } from './ModernTableWrapper';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { ChevronDown, ChevronRight, Calendar, TrendingUp, TrendingDown, BarChart3, DollarSign, Users, ShoppingCart, Target, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shallowEqual } from '@/utils/performanceUtils';
import { useTableCopyContext } from '@/hooks/useTableCopyContext';

const groupDataByCategory = (data: SalesData[]) => {
  return data.reduce((acc: Record<string, any>, item) => {
    const category = item.cleanedCategory || 'Uncategorized';
    const product = item.cleanedProduct || 'Unspecified';
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][product]) {
      acc[category][product] = [];
    }
    acc[category][product].push(item);
    return acc;
  }, {});
};

export const EnhancedYearOnYearTableNewComponent: React.FC<EnhancedYearOnYearTableProps & { onReady?: () => void }> = ({
  data,
  filters = {
    dateRange: { start: '', end: '' },
    location: [],
    category: [],
    product: [],
    soldBy: [],
    paymentMethod: []
  },
  onRowClick,
  collapsedGroups = new Set(),
  onGroupToggle = () => {},
  selectedMetric: initialMetric = 'revenue',
  onReady
}) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [selectedMetric, setSelectedMetric] = useState<YearOnYearMetricType>(initialMetric);
  const [localCollapsedGroups, setLocalCollapsedGroups] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [displayMode, setDisplayMode] = useState<'values' | 'growth'>('values');
  const [sortKey, setSortKey] = useState<string>('total');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // Get context information for enhanced table copying
  const copyContext = useTableCopyContext();

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
    const uniqueSalesItemIds = new Set(items.map(item => item.salesItemId || item.itemId || item.saleItemId).filter(Boolean));
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
      case 'discountValue': return totalDiscount;
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
      case 'discountValue':
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



  // Get previous month key for highlighting
  const getPreviousMonthKey = () => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  };
  const previousMonthKey = getPreviousMonthKey();

  const getGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return '+100';
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Get all data for historic comparison (include 2024 data regardless of filters)
  const allHistoricData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(item => {
      if (filters?.location?.length > 0 && !filters.location.includes(item.calculatedLocation)) return false;
      if (filters?.category?.length > 0 && !filters.category.includes(item.cleanedCategory)) return false;
      if (filters?.product?.length > 0 && !filters.product.includes(item.cleanedProduct)) return false;
      if (filters?.soldBy?.length > 0 && !filters.soldBy.includes(item.soldBy)) return false;
      if (filters?.paymentMethod?.length > 0 && !filters.paymentMethod.includes(item.paymentMethod)) return false;
      if (filters?.minAmount !== undefined && item.paymentValue < filters.minAmount) return false;
      if (filters?.maxAmount !== undefined && item.paymentValue > filters.maxAmount) return false;
      return true;
    });
  }, [data, filters]);

  // Generate YoY month pairs sorted by month (Jan-Dec), with year pairs (2024, 2025) for each month
  const monthlyData = useMemo(() => {
    const months: { key: string; display: string; year: number; month: number }[] = [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Generate from Jan 2024 to current month, sorted by month number
    for (let monthNum = 1; monthNum <= 12; monthNum++) {
      const monthName = new Date(2024, monthNum - 1, 1).toLocaleDateString('en-US', { month: 'short' });
      
      // Only include months up to current month in current year
      if (monthNum > currentMonth && currentYear === now.getFullYear()) {
        continue;
      }
      
      // Add 2024 entry
      months.push({
        key: `2024-${String(monthNum).padStart(2, '0')}`,
        display: `${monthName} 2024`,
        year: 2024,
        month: monthNum
      });
      
      // Add 2025 entry if month has occurred
      if (monthNum <= currentMonth) {
        months.push({
          key: `${currentYear}-${String(monthNum).padStart(2, '0')}`,
          display: `${monthName} ${currentYear}`,
          year: currentYear,
          month: monthNum
        });
      }
    }
    return months;
  }, []);

  const visibleMonths = useMemo(() => monthlyData, [monthlyData]);

  const processedData = useMemo(() => {
    const grouped = groupDataByCategory(allHistoricData);
    const categories = Object.entries(grouped).map(([category, products]) => {
      const categoryData = {
        category,
        products: Object.entries(products).map(([product, items]) => {
          const monthlyValues: Record<string, number> = {};

          // Calculate values for each month
          monthlyData.forEach(({ key, year, month }) => {
            const monthItems = (items as SalesData[]).filter(item => {
              const itemDate = parseDate(item.paymentDate);
              return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
            });
            monthlyValues[key] = getMetricValue(monthItems, selectedMetric);
          });

          return {
            product,
            monthlyValues,
            rawData: items,
            totalValue: getMetricValue(items as SalesData[], selectedMetric)
          };
        })
      };

      // Calculate category totals for each month
      const categoryMonthlyValues: Record<string, number> = {};
      monthlyData.forEach(({ key, year, month }) => {
        // Compute from raw items for averaging metrics correctness
        const monthItems = (categoryData as any).products.flatMap((p: any) => p.rawData as SalesData[]).filter((item: SalesData) => {
          const itemDate = parseDate(item.paymentDate);
          return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
        });
        categoryMonthlyValues[key] = getMetricValue(monthItems, selectedMetric);
      });
      
      return {
        ...categoryData,
        monthlyValues: categoryMonthlyValues,
        products: categoryData.products.sort((a, b) => b.totalValue - a.totalValue)
      };
    });

    // Initialize all groups as expanded by default if not already initialized
    if (!isInitialized && categories.length > 0) {
      setLocalCollapsedGroups(new Set());
      setIsInitialized(true);
    }
    
    const comparator = (a: any, b: any) => {
      const byMonth = (obj: any, key: string) => obj.monthlyValues?.[key] || 0;
      let av: number, bv: number;
      if (sortKey === 'total') {
        const sumVals = (obj: any): number => {
          const vals = Object.values(obj?.monthlyValues ?? {}) as number[];
          return vals.reduce((sum: number, val: number) => {
            const n = typeof val === 'number' ? val : Number(val || 0);
            return sum + (isNaN(n) ? 0 : n);
          }, 0);
        };
        av = sumVals(a);
        bv = sumVals(b);
      } else {
        av = byMonth(a, sortKey);
        bv = byMonth(b, sortKey);
      }
      return sortDir === 'desc' ? bv - av : av - bv;
    };
    return categories.sort(comparator);
  }, [allHistoricData, selectedMetric, monthlyData, isInitialized, sortKey, sortDir]);

  const toggleGroup = useCallback((groupKey: string) => {
    setLocalCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  const handleCollapseAll = useCallback(() => {
    const allGroups = new Set(processedData.map(item => item.category));
    setLocalCollapsedGroups(allGroups);
  }, [processedData]);

  const handleExpandAll = useCallback(() => {
    setLocalCollapsedGroups(new Set());
  }, []);

  // Set all categories as collapsed by default on first load
  React.useEffect(() => {
    if (processedData.length > 0 && !isInitialized) {
      const allCategories = new Set(processedData.map(cat => cat.category));
      setLocalCollapsedGroups(allCategories);
      setIsInitialized(true);
    }
  }, [processedData, isInitialized]);

  // Function to generate content for all metric tabs
  const generateAllTabsContent = useCallback(async () => {
    let allContent = `Year-on-Year Analysis - All Metrics\n`;
    allContent += `Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`;
    allContent += `\n${'='.repeat(80)}\n\n`;

    // Loop through all metrics from STANDARD_METRICS
    for (const metricInfo of STANDARD_METRICS) {
      const metric = metricInfo.key as YearOnYearMetricType;

      allContent += `\n${metricInfo.label.toUpperCase()}\n`;
      allContent += `${'-'.repeat(metricInfo.label.length + 10)}\n\n`;

      // Add table headers
      const headers = ['Category / Product', 'Total'];
      visibleMonths.forEach(month => headers.push(month.display));
      allContent += headers.join('\t') + '\n';
      allContent += headers.map(() => '---').join('\t') + '\n';

      // Reprocess data specifically for this metric
      const grouped = groupDataByCategory(allHistoricData);
      const metricProcessedData = Object.entries(grouped).map(([category, products]) => {
        const categoryProducts = Object.entries(products).map(([product, items]) => {
          const monthlyValues: Record<string, number> = {};

          monthlyData.forEach(({ key, year, month }) => {
            const monthItems = (items as SalesData[]).filter(item => {
              const itemDate = parseDate(item.paymentDate);
              return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
            });
            monthlyValues[key] = getMetricValue(monthItems, metric);
          });

          return {
            product,
            monthlyValues,
            totalValue: getMetricValue(items as SalesData[], metric)
          };
        });

        const categoryMonthlyValues: Record<string, number> = {};
        monthlyData.forEach(({ key }) => {
          categoryMonthlyValues[key] = categoryProducts.reduce(
            (sum, product) => sum + (product.monthlyValues[key] || 0),
            0
          );
        });

        return {
          category,
          products: categoryProducts,
          monthlyValues: categoryMonthlyValues,
          totalValue: categoryProducts.reduce((sum, product) => sum + product.totalValue, 0)
        };
      });

      // Add data rows
      metricProcessedData.forEach(categoryGroup => {
        // Category row
        const categoryTotal = categoryGroup.totalValue;
        const categoryRow = [categoryGroup.category, formatMetricValue(categoryTotal, metric)];
        
        visibleMonths.forEach(month => {
          const value = categoryGroup.monthlyValues[month.key] || 0;
          categoryRow.push(formatMetricValue(value, metric));
        });
        allContent += categoryRow.join('\t') + '\n';

        // Product rows (include all products for export)
        categoryGroup.products.forEach(product => {
          const productTotal = product.totalValue;
          const productRow = [`  ${product.product}`, formatMetricValue(productTotal, metric)];
          
          visibleMonths.forEach(month => {
            const value = product.monthlyValues[month.key] || 0;
            productRow.push(formatMetricValue(value, metric));
          });
          allContent += productRow.join('\t') + '\n';
        });
      });

      allContent += `\n`;
    }

    return allContent;
  }, [allHistoricData, visibleMonths, monthlyData]);
  
  // Notify parent when ready
  const [readySent, setReadySent] = React.useState(false);
  React.useEffect(() => {
    if (!readySent && processedData.length > 0 && monthlyData.length > 0) {
      setReadySent(true);
      onReady?.();
    }
  }, [readySent, processedData, monthlyData, onReady]);




  return (
    <div className="space-y-6">
      {/* Modern Metric Selector */}
      <ModernMetricTabs
        metrics={STANDARD_METRICS}
        selectedMetric={selectedMetric}
        onMetricChange={(metric) => setSelectedMetric(metric as YearOnYearMetricType)}
      />

      <ModernTableWrapper
        title="Year-on-Year Analysis"
        description="Comprehensive year-over-year performance comparison across all metrics"
        icon={<Calendar className="w-6 h-6 text-white" />}
        totalItems={processedData.length}
        collapsedGroups={localCollapsedGroups}
        onCollapseAll={handleCollapseAll}
        onExpandAll={handleExpandAll}
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
            collapsedGroups: Array.from(localCollapsedGroups),
            sortBy: sortKey,
            sortDirection: sortDir
          }
        }}
      >
        <div className="overflow-x-auto" data-table="year-on-year-analysis">
          <table ref={tableRef} className="min-w-full bg-white">
            <thead className="sticky top-0 z-30">
              <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <th
                  className="w-[30rem] px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-40 border-r border-white/20 cursor-pointer select-none"
                  onClick={() => {
                    if (sortKey !== 'total') { setSortKey('total'); setSortDir('desc'); }
                    else setSortDir(d => d === 'desc' ? 'asc' : 'desc');
                  }}
                  title={`Sort by total (${sortDir})`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-white" />
                    <span>Category / Product</span>
                  </div>
                </th>
                
                {visibleMonths.map(({ key, display, year, month }, index) => {
                  // Check for month grouping - add borders around groups of same months
                  const prevMonth = index > 0 ? visibleMonths[index - 1] : null;
                  const nextMonth = index < visibleMonths.length - 1 ? visibleMonths[index + 1] : null;
                  
                  const isFirstOfGroup = !prevMonth || prevMonth.month !== month;
                  const isLastOfGroup = !nextMonth || nextMonth.month !== month;
                  
                  const isPreviousMonth = key === previousMonthKey;
                  
                  return (
                    <th
                      key={key}
                      className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wider min-w-[90px] cursor-pointer select-none ${
                        isFirstOfGroup ? 'border-l-2 border-slate-400' : ''
                      } ${
                        isLastOfGroup ? 'border-r-2 border-slate-400' : ''
                      } ${
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
                          <span className="text-xs font-bold whitespace-nowrap leading-tight">{display.split(' ')[0]}</span>
                        </div>
                        <span className="text-slate-300 text-xs leading-tight">{display.split(' ')[1]}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {processedData.map((categoryGroup, categoryIndex) => (
                <React.Fragment key={categoryGroup.category}>
                  {/* Category Row */}
                  <tr 
                    className="group bg-slate-100 border-b border-slate-400 font-semibold hover:bg-slate-200 transition-all duration-200 h-9 max-h-9 cursor-pointer"
                    onClick={() => onRowClick?.({
                      drillDownContext: 'yoy-category-total',
                      filterCriteria: { category: categoryGroup.category },
                      name: `${categoryGroup.category} (YoY Total)`,
                      category: categoryGroup.category,
                      rawData: categoryGroup.products.flatMap(p => p.rawData),
                      isGroup: true,
                    })}
                  >
                    <td 
                      className="w-[30rem] px-4 py-2 text-left sticky left-0 bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-50 group-hover:from-slate-200 group-hover:via-blue-100 group-hover:to-indigo-100 border-r border-slate-200 z-20 transition-all duration-300 shadow-sm whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(categoryGroup.category);
                          }} 
                          className="p-1 h-5 w-5 rounded text-slate-600 hover:text-slate-800 hover:bg-white/50 transition-all duration-200"
                        >
                          {localCollapsedGroups.has(categoryGroup.category) ? 
                            <ChevronRight className="w-5 h-5" /> : 
                            <ChevronDown className="w-5 h-5" />
                          }
                        </Button>
                        <span className="font-bold text-xs text-slate-800">{categoryGroup.category}</span>
                      </div>
                    </td>
                    
                    {visibleMonths.map(({ key }, monthIndex) => {
                      // Calculate grouping borders
                      const prevMonth = monthIndex > 0 ? visibleMonths[monthIndex - 1] : null;
                      const nextMonth = monthIndex < visibleMonths.length - 1 ? visibleMonths[monthIndex + 1] : null;
                      const currentMonth = visibleMonths[monthIndex].month;
                      
                      const isFirstOfGroup = !prevMonth || prevMonth.month !== currentMonth;
                      const isLastOfGroup = !nextMonth || nextMonth.month !== currentMonth;
                      
                      const current = categoryGroup.monthlyValues[key] || 0;
                      // For YoY, compare with same month previous year (dynamic)
                      const [yearStr, monthStr] = key.split('-');
                      const prevYear = String(Number(yearStr) - 1);
                      const previousYearKey = `${prevYear}-${monthStr}`;
                      const previous = categoryGroup.monthlyValues[previousYearKey] || 0;
                      const growthPercentage = getGrowthPercentage(current, previous);
                      
                      return (
                        <td 
                          key={key} 
                          className={`px-2 py-2 text-center text-sm font-bold text-slate-800 hover:bg-blue-100/50 cursor-pointer transition-all duration-200 h-12 ${
                            isFirstOfGroup ? 'border-l-2 border-slate-400' : ''
                          } ${
                            isLastOfGroup ? 'border-r-2 border-slate-400' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const monthItems = (categoryGroup.products.flatMap(p => (p.rawData as SalesData[])) as SalesData[]).filter(item => {
                              const itemDate = parseDate((item as any).paymentDate);
                              return itemDate && `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}` === key;
                            });
                            onRowClick?.({
                              drillDownContext: 'yoy-category-month',
                              filterCriteria: { category: categoryGroup.category, month: key },
                              name: `${categoryGroup.category} (${key})`,
                              category: categoryGroup.category,
                              month: key,
                              rawData: monthItems,
                            })
                          }}
                          title={growthPercentage ? `${growthPercentage}% vs same month last year` : ''}
                        >
                          <div className="flex flex-col items-center space-y-0.5 min-h-6 justify-center">
                            {displayMode === 'values' ? (
                              <span className="font-mono text-xs whitespace-nowrap">{formatMetricValue(current, selectedMetric)}</span>
                            ) : (
                              growthPercentage && (
                                <div className={`flex items-center justify-center space-x-1 text-xs leading-none ${
                                  parseFloat(growthPercentage) > 0 ? 'text-emerald-600' : 'text-red-500'
                                }`}>
                                  {parseFloat(growthPercentage) > 0 ? 
                                    <TrendingUp className="w-3 h-3 shrink-0" /> : 
                                    <TrendingDown className="w-3 h-3 shrink-0" />
                                  }
                                  <span className="font-mono text-xs whitespace-nowrap">
                                    {parseFloat(growthPercentage) > 0 ? '+' : ''}{growthPercentage}%
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {!localCollapsedGroups.has(categoryGroup.category) && 
                    categoryGroup.products.map((product, productIndex) => (
                      <tr 
                        key={`${categoryGroup.category}-${product.product}`}
                        className="bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-200 transition-all duration-300 hover:shadow-lg animate-in slide-in-from-left-2 fade-in duration-300 cursor-pointer h-9 max-h-9"
                        onClick={() => onRowClick?.({
                          drillDownContext: 'yoy-product-total',
                          filterCriteria: { product: product.product },
                          name: `${product.product} (YoY Total)`,
                          product: product.product,
                          rawData: product.rawData,
                        })}
                      >
                        <td className="w-[30rem] px-12 py-3 text-left sticky left-0 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-r border-slate-100 z-10 cursor-pointer transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis">
                          <div className="flex items-center space-x-3">
                            <span className="text-slate-400 text-xs">→</span>
                            <span className="text-slate-700 font-medium text-xs">{product.product}</span>
                          </div>
                        </td>
                        
                        {visibleMonths.map(({ key }, monthIndex) => {
                          // Calculate grouping borders
                          const prevMonth = monthIndex > 0 ? visibleMonths[monthIndex - 1] : null;
                          const nextMonth = monthIndex < visibleMonths.length - 1 ? visibleMonths[monthIndex + 1] : null;
                          const currentMonth = visibleMonths[monthIndex].month;
                          
                          const isFirstOfGroup = !prevMonth || prevMonth.month !== currentMonth;
                          const isLastOfGroup = !nextMonth || nextMonth.month !== currentMonth;
                          
                          const current = product.monthlyValues[key] || 0;
                          const [yearStr, monthStr] = key.split('-');
                          const prevYear = String(Number(yearStr) - 1);
                          const previousYearKey = `${prevYear}-${monthStr}`;
                          const previous = product.monthlyValues[previousYearKey] || 0;
                          const growthPercentage = getGrowthPercentage(current, previous);
                          
                          return (
                            <td 
                              key={key} 
                              className={`px-2 py-2 text-center text-sm font-mono text-slate-700 border-gray-200 hover:bg-blue-100/50 cursor-pointer transition-all duration-200 ${
                                isFirstOfGroup ? 'border-l-2 border-slate-400' : 'border-l'
                              } ${
                                isLastOfGroup ? 'border-r-2 border-slate-400' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                const monthItems = (product.rawData as SalesData[]).filter(item => {
                  const itemDate = parseDate((item as any).paymentDate);
                  return itemDate && `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}` === key;
                });
                                onRowClick?.({
                                  drillDownContext: 'yoy-product-month',
                                  filterCriteria: { product: product.product, month: key },
                                  name: `${product.product} (${key})`,
                                  product: product.product,
                                  month: key,
                                  rawData: monthItems,
                                })
                              }}
                              title={growthPercentage ? `${growthPercentage}% vs same month last year` : ''}
                            >
                              <div className="flex flex-col items-center space-y-0.5 min-h-6 justify-center">
                                {displayMode === 'values' ? (
                                  <span className="text-xs whitespace-nowrap">{formatMetricValue(current, selectedMetric)}</span>
                                ) : (
                                  growthPercentage && (
                                    <div className={`flex items-center justify-center space-x-1 text-xs leading-none ${
                                      parseFloat(growthPercentage) > 0 ? 'text-emerald-600' : 'text-red-500'
                                    }`}>
                                      {parseFloat(growthPercentage) > 0 ? 
                                        <TrendingUp className="w-3 h-3 shrink-0" /> : 
                                        <TrendingDown className="w-3 h-3 shrink-0" />
                                      }
                                      <span className="font-mono text-xs whitespace-nowrap">
                                        {parseFloat(growthPercentage) > 0 ? '+' : ''}{growthPercentage}%
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  }
                </React.Fragment>
              ))}
              
              {/* Totals Row */}
              <tr 
                className="bg-slate-800 text-white font-bold border-t-2 border-slate-400 h-10 max-h-10 cursor-pointer hover:bg-slate-700"
                onClick={() => onRowClick?.({
                  drillDownContext: 'yoy-grand-total',
                  filterCriteria: {},
                  name: 'Grand Total (YoY)',
                  rawData: allHistoricData,
                  isGroup: true,
                })}
              >
                <td className="w-96 px-4 py-2 text-left sticky left-0 bg-slate-800 group-hover:bg-slate-700 border-r border-slate-400 z-20">
                  <div className="flex items-center space-x-2 min-h-6">
                    <span className="font-bold text-sm text-white">TOTALS</span>
                  </div>
                </td>
                
                {visibleMonths.map(({ key, year, month }, monthIndex) => {
                  // Calculate grouping borders
                  const prevMonth = monthIndex > 0 ? visibleMonths[monthIndex - 1] : null;
                  const nextMonth = monthIndex < visibleMonths.length - 1 ? visibleMonths[monthIndex + 1] : null;
                  
                  const isFirstOfGroup = !prevMonth || prevMonth.month !== month;
                  const isLastOfGroup = !nextMonth || nextMonth.month !== month;
                  
                  const isPreviousMonth = key === previousMonthKey;
                  // Use allHistoricData filtered by month to compute totals, preserving averaging
                  const monthItems = allHistoricData.filter(item => {
                    const itemDate = parseDate(item.paymentDate);
                    return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
                  });
                  const totalValue = getMetricValue(monthItems, selectedMetric);
                  
                  return (
                    <td 
                      key={key} 
                      className={`px-2 py-2 text-center text-sm font-bold text-white border-slate-400 group-hover:bg-slate-700 ${
                        isFirstOfGroup ? 'border-l-2' : 'border-l'
                      } ${
                        isLastOfGroup ? 'border-r-2' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const monthItems = allHistoricData.filter(item => {
                            const itemDate = parseDate(item.paymentDate);
                            return itemDate && `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}` === key;
                        });
                        onRowClick?.({
                          drillDownContext: 'yoy-total-month',
                          filterCriteria: { month: key },
                          name: `Grand Total (${key})`,
                          month: key,
                          rawData: monthItems,
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
        tableId="year-on-year-analysis"
        initialText="• Year-on-year analysis reveals growth patterns and seasonal trends\n• Strong quarterly performance indicators with year-over-year improvements\n• Key growth drivers identified across product categories"
        className="animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300"
      />
    </div>
  );
};

// Memoized export with custom comparison function
export const EnhancedYearOnYearTableNew = React.memo(
  EnhancedYearOnYearTableNewComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.selectedMetric === nextProps.selectedMetric &&
      shallowEqual(prevProps.filters, nextProps.filters) &&
      prevProps.collapsedGroups === nextProps.collapsedGroups &&
      prevProps.onRowClick === nextProps.onRowClick &&
      prevProps.onGroupToggle === nextProps.onGroupToggle &&
      prevProps.onReady === nextProps.onReady
    );
  }
);