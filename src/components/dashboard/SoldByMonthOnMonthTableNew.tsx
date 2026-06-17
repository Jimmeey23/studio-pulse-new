import React, { useMemo, useState, useCallback, useRef } from 'react';
import { SalesData, YearOnYearMetricType } from '@/types/dashboard';
import { ModernTableWrapper, ModernGroupBadge, ModernMetricTabs, STANDARD_METRICS } from './ModernTableWrapper';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ChevronDown, ChevronRight, Users, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRankingDisplay } from '@/utils/rankingUtils';
import { shallowEqual } from '@/utils/performanceUtils';
import { useTableCopyContext } from '@/hooks/useTableCopyContext';
import { generateStandardMonthRange } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface SoldByMonthOnMonthTableNewProps {
  data: SalesData[];
  onRowClick?: (row: any) => void;
  selectedMetric?: YearOnYearMetricType;
  onReady?: () => void;
}

export const SoldByMonthOnMonthTableNewComponent: React.FC<SoldByMonthOnMonthTableNewProps> = ({
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
    const totalUnits = items.length; // Each transaction is 1 unit
    
    // Use actual VAT from data, not calculated percentage
    const totalVat = items.reduce((sum, item) => sum + (item.paymentVAT || item.vat || 0), 0);
    
    // Use actual discount data from the items
    const totalDiscount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    
    // Calculate discount percentage correctly: Total Discounts / (Total Gross Revenue) * 100
    const totalGrossRevenue = items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const avgDiscountPercentage = totalGrossRevenue > 0 
      ? (totalDiscount / totalGrossRevenue) * 100
      : 0;

    // Calculate purchase frequency (average days between purchases)
    const calculatePurchaseFrequency = () => {
      if (uniqueMembers <= 1) return 0;
      
      const memberPurchases: Record<string, Date[]> = {};
      items.forEach(item => {
        const date = parseDate(item.paymentDate);
        if (date && item.memberId) {
          if (!memberPurchases[item.memberId]) {
            memberPurchases[item.memberId] = [];
          }
          memberPurchases[item.memberId].push(date);
        }
      });
      
      let totalDaysBetweenPurchases = 0;
      let intervalCount = 0;
      
      Object.values(memberPurchases).forEach(dates => {
        if (dates.length > 1) {
          dates.sort((a, b) => a.getTime() - b.getTime());
          for (let i = 1; i < dates.length; i++) {
            const daysDiff = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
            totalDaysBetweenPurchases += daysDiff;
            intervalCount++;
          }
        }
      });
      
      return intervalCount > 0 ? totalDaysBetweenPurchases / intervalCount : 0;
    };

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
      case 'purchaseFrequency': return calculatePurchaseFrequency();
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

  // Get previous month key for highlighting
  const getPreviousMonthKey = () => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  };
  const previousMonthKey = getPreviousMonthKey();

  const processedData = useMemo(() => {
    // Group by soldBy
    const soldByGroups = data.reduce((acc: Record<string, SalesData[]>, item) => {
      const seller = item.soldBy || 'Unknown';
      if (!acc[seller]) {
        acc[seller] = [];
      }
      acc[seller].push(item);
      return acc;
    }, {});

    const sellerData = Object.entries(soldByGroups).map(([seller, items]) => {
  const monthlyValues: Record<string, number> = {};
      
      visibleMonths.forEach(({ key, year, month }) => {
        const monthItems = items.filter(item => {
          const itemDate = parseDate(item.paymentDate);
          return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
        });
        monthlyValues[key] = getMetricValue(monthItems, selectedMetric);
      });

      return {
        seller,
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
    return sellerData.sort(comparator);
  }, [data, selectedMetric, visibleMonths, sortKey, sortDir]);

  // monthlyData here is descending (current back). Use full range to Jan 2024.
  // visibleMonths is already defined above and reversed properly

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
    let allContent = `Sales Team Performance - All Metrics\n`;
    allContent += `Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`;
    allContent += `\n${'='.repeat(80)}\n\n`;

    // Loop through all metrics from STANDARD_METRICS
    for (const metricInfo of STANDARD_METRICS) {
      const metric = metricInfo.key as YearOnYearMetricType;

      allContent += `\n${metricInfo.label.toUpperCase()}\n`;
      allContent += `${'-'.repeat(metricInfo.label.length + 10)}\n\n`;

      // Add table headers
      const headers = ['Sold By', 'Total'];
      visibleMonths.forEach(month => headers.push(month.display));
      allContent += headers.join('\t') + '\n';
      allContent += headers.map(() => '---').join('\t') + '\n';

      // Reprocess data specifically for this metric
      const soldByGroups = data.reduce((acc: Record<string, SalesData[]>, item) => {
        const soldBy = item.soldBy || 'Unknown';
        if (!acc[soldBy]) acc[soldBy] = [];
        acc[soldBy].push(item);
        return acc;
      }, {});

      const metricProcessedData = Object.entries(soldByGroups).map(([soldBy, items]) => {
        const monthlyValues: Record<string, number> = {};
        
        monthlyData.forEach(({ key, year, month }) => {
          const monthItems = items.filter(item => {
            const itemDate = parseDate(item.paymentDate);
            return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
          });
          monthlyValues[key] = getMetricValue(monthItems, metric);
        });

        return {
          soldBy,
          monthlyValues,
          totalValue: getMetricValue(items, metric)
        };
      });

      // Add data rows
      metricProcessedData.forEach(sellerData => {
        const sellerRow = [sellerData.soldBy, formatMetricValue(sellerData.totalValue, metric)];
        
        visibleMonths.forEach(month => {
          const value = sellerData.monthlyValues[month.key] || 0;
          sellerRow.push(formatMetricValue(value, metric));
        });
        allContent += sellerRow.join('\t') + '\n';
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
        title="Sales Team Performance"
        description="Individual seller performance analysis across all metrics and timeframes"
        icon={<Users className="w-5 h-5 text-white" />}
        totalItems={processedData.length}
        showDisplayToggle={true}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        showCollapseControls={false}
        tableRef={tableRef}
        showCopyButton={true}
        onCopyAllTabs={generateAllTabsContent}
        contextInfo={{
          ...copyContext.contextInfo,
          selectedMetric: selectedMetric,
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
                    <Users className="w-4 h-4 text-white" />
                    <span>Sales Representative</span>
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
              {processedData.map((seller, sellerIndex) => (
                <tr 
                  key={seller.seller}
                  className="bg-white hover:bg-slate-50 border-b border-gray-200 transition-all duration-200 h-10 max-h-10"
                  onClick={() => onRowClick?.({
                    ...seller,
                    contextType: 'soldBy',
                    drillDownContext: 'soldby-analysis',
                    filterCriteria: {
                      soldBy: seller.seller
                    }
                  })}
                >
                  <td className="w-80 px-4 py-2 text-left sticky left-0 bg-white hover:bg-slate-50 border-r border-gray-200 z-20 cursor-pointer transition-all duration-200">
                    <div className="flex items-center space-x-2 min-h-6">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="text-slate-700 font-medium text-sm truncate">{seller.seller}</span>
                      </div>
                    </div>
                  </td>
                  
                  {visibleMonths.map(({ key }, monthIndex) => {
                    const current = seller.monthlyValues[key] || 0;
                    const isPreviousMonth = key === previousMonthKey;
                    const previousMonthKeyLocal = visibleMonths[monthIndex + 1]?.key;
                    const previous = previousMonthKeyLocal ? (seller.monthlyValues[previousMonthKeyLocal] || 0) : 0;
                    const growthPercentage = monthIndex < visibleMonths.length - 1 ? getGrowthPercentage(current, previous) : null;
                    
                    return (
                      <td 
                        key={key} 
                        className="px-2 py-2 text-center text-sm font-mono text-slate-700 border-l border-gray-200 hover:bg-slate-100 cursor-pointer transition-all duration-200"
                        title={growthPercentage ? `${growthPercentage}% vs previous month${isPreviousMonth ? ' - Main Month' : ''}` : (isPreviousMonth ? 'Main Month' : '')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick?.({
                            ...seller,
                            contextType: 'soldBy-month',
                            filterCriteria: {
                              soldBy: seller.seller,
                              month: key,
                              specificValue: current
                            },
                            drillDownContext: {
                              type: 'soldBy-month',
                              itemName: seller.seller,
                              month: key,
                              value: current,
                              metric: selectedMetric
                            },
                            clickedItemName: seller.seller,
                            contextDescription: `${seller.seller} performance in ${key}: ${formatMetricValue(current, selectedMetric)}`
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
                  drillDownContext: 'soldby-grand-total',
                  filterCriteria: {},
                  name: 'Grand Total (All Sellers)',
                  rawData: data,
                  isGroup: true,
                })}
              >
                <td className="w-80 px-4 py-2 text-left sticky left-0 bg-slate-800 group-hover:bg-slate-700 border-r border-slate-400 z-20">
                  <div className="flex items-center space-x-2 min-h-6">
                    <span className="font-bold text-sm text-white">TOTALS</span>
                  </div>
                </td>
                
                {visibleMonths.map(({ key, year, month }) => {
                  const monthItems = (data as SalesData[]).filter(item => {
                    const itemDate = parseDate(item.paymentDate);
                    return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
                  });
                  const totalValue = getMetricValue(monthItems, selectedMetric);
                  const isPreviousMonth = key === previousMonthKey;
                  
                  return (
                    <td 
                      key={key} 
                      className="px-2 py-2 text-center text-sm font-bold text-white border-l border-slate-400 group-hover:bg-slate-700 cursor-pointer transition-all duration-200"
                      title={isPreviousMonth ? 'Main Month - Grand Total' : ''}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick?.({
                          drillDownContext: 'soldby-total-month',
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
        tableId="sales-team-performance"
        initialText="• Sales team performance analysis by individual seller • Consistent performers identified for recognition • Training opportunities highlighted for underperformers"
      />
    </div>
  );
};

// Memoized export with custom comparison function
export const SoldByMonthOnMonthTableNew = React.memo(
  SoldByMonthOnMonthTableNewComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.selectedMetric === nextProps.selectedMetric &&
      prevProps.onRowClick === nextProps.onRowClick &&
      prevProps.onReady === nextProps.onReady
    );
  }
);