import React, { useMemo, useState, useCallback, useRef } from 'react';
import { SalesData, YearOnYearMetricType } from '@/types/dashboard';
import { ModernTableWrapper, ModernGroupBadge, ModernMetricTabs, STANDARD_METRICS } from './ModernTableWrapper';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { CreditCard, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { generateStandardMonthRange } from '@/utils/dateUtils';
import { shallowEqual } from '@/utils/performanceUtils';
import { useTableCopyContext } from '@/hooks/useTableCopyContext';

interface PaymentMethodMonthOnMonthTableNewProps {
  data: SalesData[];
  onRowClick?: (row: any) => void;
  selectedMetric?: YearOnYearMetricType;
  onReady?: () => void;
}

export const PaymentMethodMonthOnMonthTableNewComponent: React.FC<PaymentMethodMonthOnMonthTableNewProps> = ({
  data,
  onRowClick,
  selectedMetric: initialMetric = 'revenue',
  onReady
}) => {
  const [selectedMetric, setSelectedMetric] = useState<YearOnYearMetricType>(initialMetric);
  const [displayMode, setDisplayMode] = useState<'values' | 'growth'>('values');
  const [sortKey, setSortKey] = useState<string>('total');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const tableRef = useRef<HTMLTableElement>(null);

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
    const totalTransactions = items.length;
    const uniqueMembers = new Set(items.map(item => item.memberId)).size;
    const totalUnits = items.length;
    
    // Use actual VAT from data, not calculated percentage
    const totalVat = items.reduce((sum, item) => sum + (item.paymentVAT || item.vat || 0), 0);
    
    // Use actual discount data from the items
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
      case 'upt': return totalTransactions > 0 ? totalUnits / totalTransactions : 0;
      case 'asv': return totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      case 'vat': return totalVat;
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

  // Use standard month range from Jan 2024 to current month in ASCENDING order
  const monthlyData = useMemo(() => generateStandardMonthRange(), []);
  const visibleMonths = useMemo(() => monthlyData, [monthlyData]);

  // Notify parent when ready (effect placed after processedData declaration)

  const processedData = useMemo(() => {
    // Group by payment method
    const paymentMethodGroups = data.reduce((acc: Record<string, SalesData[]>, item) => {
      const method = item.paymentMethod || 'Unknown';
      if (!acc[method]) {
        acc[method] = [];
      }
      acc[method].push(item);
      return acc;
    }, {});

    const methodData = Object.entries(paymentMethodGroups).map(([method, items]) => {
      const monthlyValues: Record<string, number> = {};
      
      monthlyData.forEach(({ key, year, month }) => {
        const monthItems = items.filter(item => {
          const itemDate = parseDate(item.paymentDate);
          return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
        });
        monthlyValues[key] = getMetricValue(monthItems, selectedMetric);
      });

      return {
        method,
        monthlyValues,
        totalValue: getMetricValue(items, selectedMetric),
        totalRevenue: items.reduce((sum, item) => {
          const payment = item.paymentValue || 0;
          const vat = item.paymentVAT || item.vat || 0;
          return sum + (payment - vat);
        }, 0),
        totalTransactions: items.length,
        uniqueMembers: new Set(items.map(item => item.memberId)).size,
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
    return methodData.sort(comparator);
  }, [data, selectedMetric, monthlyData, sortKey, sortDir]);

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
    let allContent = `Payment Method Analysis - All Metrics\n`;
    allContent += `Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`;
    allContent += `\n${'='.repeat(80)}\n\n`;

    // Loop through all metrics from STANDARD_METRICS
    for (const metricInfo of STANDARD_METRICS) {
      const metric = metricInfo.key as YearOnYearMetricType;

      allContent += `\n${metricInfo.label.toUpperCase()}\n`;
      allContent += `${'-'.repeat(metricInfo.label.length + 10)}\n\n`;

      // Add table headers
      const headers = ['Payment Method', 'Total'];
      visibleMonths.forEach(month => headers.push(month.display));
      allContent += headers.join('\t') + '\n';
      allContent += headers.map(() => '---').join('\t') + '\n';

      // Reprocess data specifically for this metric
      const paymentMethodGroups = data.reduce((acc: Record<string, SalesData[]>, item) => {
        const method = item.paymentMethod || 'Unknown';
        if (!acc[method]) acc[method] = [];
        acc[method].push(item);
        return acc;
      }, {});

      const metricProcessedData = Object.entries(paymentMethodGroups).map(([method, items]) => {
        const monthlyValues: Record<string, number> = {};
        
        monthlyData.forEach(({ key, year, month }) => {
          const monthItems = items.filter(item => {
            const itemDate = parseDate(item.paymentDate);
            return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
          });
          monthlyValues[key] = getMetricValue(monthItems, metric);
        });

        return {
          method,
          monthlyValues,
          totalValue: getMetricValue(items, metric)
        };
      });

      // Add data rows
      metricProcessedData.forEach(methodData => {
        const methodRow = [methodData.method, formatMetricValue(methodData.totalValue, metric)];
        
        visibleMonths.forEach(month => {
          const value = methodData.monthlyValues[month.key] || 0;
          methodRow.push(formatMetricValue(value, metric));
        });
        allContent += methodRow.join('\t') + '\n';
      });

      allContent += `\n`;
    }

    return allContent;
  }, [data, visibleMonths, monthlyData]);

  return (
    <div className="space-y-4">
      {/* Modern Metric Selector */}
      <ModernMetricTabs
        metrics={STANDARD_METRICS}
        selectedMetric={selectedMetric}
        onMetricChange={(metric) => setSelectedMetric(metric as YearOnYearMetricType)}
      />

      <ModernTableWrapper
        title="Payment Method Analysis"
        description="Performance breakdown by payment method across all metrics and timeframes"
        icon={<CreditCard className="w-5 h-5 text-white" />}
        totalItems={processedData.length}
        showDisplayToggle={true}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        showCollapseControls={false}
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
        <div className="overflow-x-auto">
          <table ref={tableRef} className="min-w-full bg-white">
            <thead className="sticky top-0 z-30">
              <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <th
                  className="w-80 px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-40 border-r border-white/20 cursor-pointer select-none"
                  onClick={() => {
                    if (sortKey !== 'total') { setSortKey('total'); setSortDir('desc'); }
                    else setSortDir(d => d === 'desc' ? 'asc' : 'desc');
                  }}
                  title={`Sort by total (${sortDir})`}
                >
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-white" />
                    <span>Payment Method</span>
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
              {processedData.map((method, methodIndex) => (
                <tr 
                  key={method.method}
                  className="bg-white hover:bg-slate-50 border-b border-gray-200 transition-all duration-200 h-12"
                  onClick={() => onRowClick?.({
                    ...method,
                    contextType: 'paymentMethod',
                    drillDownContext: 'payment-method-analysis',
                    filterCriteria: {
                      paymentMethod: method.method
                    }
                  })}
                >
                  <td className="w-80 px-4 py-2 text-left sticky left-0 bg-white hover:bg-slate-50 border-r border-gray-200 z-20 cursor-pointer transition-all duration-200">
                    <div className="flex items-center space-x-2 min-h-8">
                      <span className="text-slate-400 text-xs">→</span>
                      <span className="text-slate-700 font-medium text-sm truncate">{method.method}</span>
                    </div>
                  </td>
                  
                  {visibleMonths.map(({ key }, monthIndex) => {
                    const current = method.monthlyValues[key] || 0;
                    const previousMonthKey = visibleMonths[monthIndex + 1]?.key;
                    const previous = previousMonthKey ? (method.monthlyValues[previousMonthKey] || 0) : 0;
                    const growthPercentage = monthIndex < visibleMonths.length - 1 ? getGrowthPercentage(current, previous) : null;
                    
                    return (
                      <td 
                        key={key} 
                        className="px-2 py-2 text-center text-sm font-mono text-slate-700 border-l border-gray-200 hover:bg-slate-100 cursor-pointer transition-all duration-200"
                        title={growthPercentage ? `${growthPercentage}% vs previous month` : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick?.({
                            ...method,
                            contextType: 'paymentMethod-month',
                            filterCriteria: {
                              paymentMethod: method.method,
                              month: key,
                              specificValue: current
                            },
                            drillDownContext: {
                              type: 'paymentMethod-month',
                              itemName: method.method,
                              month: key,
                              value: current,
                              metric: selectedMetric
                            },
                            clickedItemName: method.method,
                            contextDescription: `${method.method} performance in ${key}: ${formatMetricValue(current, selectedMetric)}`
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
                  drillDownContext: 'payment-method-grand-total',
                  filterCriteria: {},
                  name: 'Grand Total (All Payment Methods)',
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
                  const totalValue = processedData.reduce((sum, method) => 
                    sum + (method.monthlyValues[key] || 0), 0
                  );
                  
                  return (
                    <td 
                      key={key} 
                      className="px-2 py-2 text-center text-sm font-bold text-white border-l border-slate-400 group-hover:bg-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick?.({
                          drillDownContext: 'payment-method-total-month',
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
        tableId="payment-method-analysis"
        initialText="• Payment method preference analysis across customer base • Transaction distribution and processing efficiency metrics • Revenue optimization opportunities by payment channel"
      />
    </div>
  );
};

// Memoized export with custom comparison function
export const PaymentMethodMonthOnMonthTableNew = React.memo(
  PaymentMethodMonthOnMonthTableNewComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.selectedMetric === nextProps.selectedMetric &&
      prevProps.onRowClick === nextProps.onRowClick &&
      prevProps.onReady === nextProps.onReady
    );
  }
);