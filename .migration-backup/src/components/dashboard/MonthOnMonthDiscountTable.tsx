import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, Filter } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "@/utils/formatters";
import { SalesData } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

interface MonthOnMonthDiscountTableProps {
  data: SalesData[];
}

type GroupKey = 'product' | 'category' | 'location' | 'soldBy';
type MetricType = 'totalDiscounts' | 'discountedTransactions' | 'avgDiscount' | 'discountRate' | 'uniqueCustomers' | 'totalValue';

interface MonthData {
  totalDiscounts: number;
  discountedTransactions: number;
  totalTransactions: number;
  totalValue: number;
  uniqueCustomers: number;
  customersWithDiscounts: number;
}

const emptyMonthData = (): MonthData => ({
  totalDiscounts: 0,
  discountedTransactions: 0,
  totalTransactions: 0,
  totalValue: 0,
  uniqueCustomers: 0,
  customersWithDiscounts: 0,
});

export const MonthOnMonthDiscountTable: React.FC<MonthOnMonthDiscountTableProps> = ({ data }) => {
  const [groupKey, setGroupKey] = useState<GroupKey>('product');
  const [metric, setMetric] = useState<MetricType>('totalDiscounts');
  const [viewMode, setViewMode] = useState<'values' | 'growth'>('values');
  const registry = useMetricsTablesRegistry();

  const months = useMemo(() => {
    // Get last 6 months including current month
    const now = new Date();
    const arr: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return arr;
  }, []);

  const processedData = useMemo(() => {
    const map = new Map<string, { group: string; months: Map<string, MonthData>; totals: MonthData }>();

    const addToMonthData = (monthData: MonthData, item: SalesData) => {
      const discountAmount = (item.discountAmount || 0);
      const paymentValue = (item.paymentValue || 0);
      const hasDiscount = discountAmount > 0 || (item.discountPercentage || 0) > 0;
      
      monthData.totalDiscounts += discountAmount;
      monthData.totalTransactions += 1;
      monthData.totalValue += paymentValue;
      
      if (hasDiscount) {
        monthData.discountedTransactions += 1;
      }
      
      // Track unique customers (simplified - in reality you'd want to dedupe properly)
      if (item.memberId || item.customerEmail) {
        monthData.uniqueCustomers += 1; // This is simplified, should be proper deduplication
        if (hasDiscount) {
          monthData.customersWithDiscounts += 1;
        }
      }
    };

    data.forEach(item => {
      if (!item.paymentDate) return;
      
      const itemDate = new Date(item.paymentDate);
      if (isNaN(itemDate.getTime())) return;
      
      const monthKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
      
      let groupValue = '';
      switch (groupKey) {
        case 'product':
          groupValue = item.cleanedProduct || 'Unknown Product';
          break;
        case 'category':
          groupValue = item.cleanedCategory || 'Uncategorized';
          break;
        case 'location':
          groupValue = item.calculatedLocation || 'Unknown Location';
          break;
        case 'soldBy':
          groupValue = item.soldBy === '-' ? 'Online/System' : (item.soldBy || 'Unknown');
          break;
      }

      if (!map.has(groupValue)) {
        map.set(groupValue, { 
          group: groupValue, 
          months: new Map(), 
          totals: emptyMonthData() 
        });
      }

      const entry = map.get(groupValue)!;
      
      if (!entry.months.has(monthKey)) {
        entry.months.set(monthKey, emptyMonthData());
      }

      addToMonthData(entry.months.get(monthKey)!, item);
      addToMonthData(entry.totals, item);
    });

    // Convert to array and sort by total metric value
    const rows = Array.from(map.values()).map(entry => {
      let totalValue = 0;
      switch (metric) {
        case 'totalDiscounts':
          totalValue = entry.totals.totalDiscounts;
          break;
        case 'discountedTransactions':
          totalValue = entry.totals.discountedTransactions;
          break;
        case 'avgDiscount':
          totalValue = entry.totals.discountedTransactions > 0 
            ? entry.totals.totalDiscounts / entry.totals.discountedTransactions 
            : 0;
          break;
        case 'discountRate':
          totalValue = (entry.totals.totalValue + entry.totals.totalDiscounts) > 0 
            ? (entry.totals.totalDiscounts / (entry.totals.totalValue + entry.totals.totalDiscounts)) * 100 
            : 0;
          break;
        case 'uniqueCustomers':
          totalValue = entry.totals.customersWithDiscounts;
          break;
        case 'totalValue':
          totalValue = entry.totals.totalValue;
          break;
      }
      
      return { ...entry, totalValue };
    });

    return rows.sort((a, b) => b.totalValue - a.totalValue);
  }, [data, groupKey, metric, months]);

  const formatMetricValue = (monthData: MonthData | undefined, metricType: MetricType): string => {
    if (!monthData) return '0';
    
    switch (metricType) {
      case 'totalDiscounts':
      case 'totalValue':
        return formatCurrency(monthData.totalDiscounts);
      case 'discountedTransactions':
        return formatNumber(monthData.discountedTransactions);
      case 'avgDiscount':
        return monthData.discountedTransactions > 0 
          ? formatCurrency(monthData.totalDiscounts / monthData.discountedTransactions)
          : '₹0';
      case 'discountRate':
        return (monthData.totalValue + monthData.totalDiscounts) > 0 
          ? formatPercentage((monthData.totalDiscounts / (monthData.totalValue + monthData.totalDiscounts)) * 100)
          : '0%';
      case 'uniqueCustomers':
        return formatNumber(monthData.customersWithDiscounts);
      default:
        return '0';
    }
  };

  const getMetricValue = (monthData: MonthData | undefined): number => {
    if (!monthData) return 0;
    
    switch (metric) {
      case 'totalDiscounts':
        return monthData.totalDiscounts;
      case 'discountedTransactions':
        return monthData.discountedTransactions;
      case 'avgDiscount':
        return monthData.discountedTransactions > 0 
          ? monthData.totalDiscounts / monthData.discountedTransactions 
          : 0;
      case 'discountRate':
        return (monthData.totalValue + monthData.totalDiscounts) > 0 
          ? (monthData.totalDiscounts / (monthData.totalValue + monthData.totalDiscounts)) * 100 
          : 0;
      case 'uniqueCustomers':
        return monthData.customersWithDiscounts;
      case 'totalValue':
        return monthData.totalValue;
      default:
        return 0;
    }
  };

  const columns = [
    {
      key: 'group',
      header: groupKey.charAt(0).toUpperCase() + groupKey.slice(1),
      align: 'left' as const,
      className: 'min-w-[200px] sticky left-0 bg-white',
      render: (value: string) => (
        <div className="font-semibold text-slate-800 truncate pr-4">
          {groupKey === 'location' 
            ? value.replace('Kwality House, Kemps Corner', 'Kwality')
                   .replace('Supreme HQ, Bandra', 'Supreme')
                   .replace('Kenkere House', 'Kenkere')
            : value}
        </div>
      )
    },
    ...months.map((monthKey, idx) => ({
      key: monthKey,
      header: new Date(monthKey + '-01').toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      align: 'center' as const,
      className: 'min-w-[100px]',
      render: (_: any, row: any) => {
        const monthData = row.months.get(monthKey);
        
        if (viewMode === 'values') {
          return (
            <div className="text-sm font-medium text-slate-800">
              {formatMetricValue(monthData, metric)}
            </div>
          );
        }
        
        // Growth mode
        const prevMonthKey = months[idx - 1];
        if (!prevMonthKey) {
          return <span className="text-slate-400 text-xs">-</span>;
        }
        
        const current = getMetricValue(monthData);
        const previous = getMetricValue(row.months.get(prevMonthKey));
        
        if (previous === 0 && current === 0) {
          return <span className="text-slate-400 text-xs">0%</span>;
        }
        
        const growth = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
        
        return (
          <div className={cn(
            'text-xs font-semibold',
            growth > 0 ? 'text-emerald-600' : growth < 0 ? 'text-red-600' : 'text-slate-500'
          )}>
            {growth === 0 ? '0%' : `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`}
          </div>
        );
      }
    }))
  ];

  // Generate text content for copy functionality
  const generateTextContent = () => {
    const lines = ['Month-on-Month Discount Analysis'];
    lines.push(`Group: ${groupKey.charAt(0).toUpperCase() + groupKey.slice(1)}, Metric: ${metric}`);
    lines.push(`View Mode: ${viewMode}`);
    lines.push(''); // Empty line

    // Headers
    const headers = ['Group', ...months.map(monthKey => 
      new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    )];
    lines.push(headers.join('\t'));

    // Data rows
    processedData.forEach(row => {
      const dataRow = [row.group];
      months.forEach((monthKey, idx) => {
        const monthData = row.months.get(monthKey);
        
        if (viewMode === 'values') {
          dataRow.push(formatMetricValue(monthData, metric));
        } else {
          // Growth mode
          const prevMonthKey = months[idx - 1];
          if (!prevMonthKey) {
            dataRow.push('-');
          } else {
            const current = getMetricValue(monthData);
            const previous = getMetricValue(row.months.get(prevMonthKey));
            
            if (previous === 0 && current === 0) {
              dataRow.push('0%');
            } else if (previous === 0) {
              dataRow.push('+100%');
            } else {
              const growth = ((current - previous) / previous * 100).toFixed(1);
              dataRow.push(`${growth}%`);
            }
          }
        }
      });
      lines.push(dataRow.join('\t'));
    });

    return lines.join('\n');
  };

  // Register with MetricsTablesRegistry for "Copy All Tabs" functionality
  useEffect(() => {
    if (registry) {
      const tableId = 'Month-on-Month Discount Analysis';
      registry.register({
        id: tableId,
        getTextContent: generateTextContent,
      });
      
      return () => {
        registry.unregister(tableId);
      };
    }
  }, [registry, processedData, groupKey, metric, viewMode, months]);

  // Calculate totals row
  const totalsMap = new Map<string, MonthData>();
  processedData.forEach(row => {
    months.forEach(monthKey => {
      const monthData = row.months.get(monthKey);
      if (!totalsMap.has(monthKey)) {
        totalsMap.set(monthKey, emptyMonthData());
      }
      
      const acc = totalsMap.get(monthKey)!;
      if (monthData) {
        acc.totalDiscounts += monthData.totalDiscounts;
        acc.discountedTransactions += monthData.discountedTransactions;
        acc.totalTransactions += monthData.totalTransactions;
        acc.totalValue += monthData.totalValue;
        acc.uniqueCustomers += monthData.uniqueCustomers;
        acc.customersWithDiscounts += monthData.customersWithDiscounts;
      }
    });
  });
  
  // Pre-format footer data for display
  const footerData: Record<string, any> = { group: 'TOTALS' };
  months.forEach((monthKey, idx) => {
    const monthData = totalsMap.get(monthKey);
    if (viewMode === 'values') {
      footerData[monthKey] = formatMetricValue(monthData, metric);
    } else {
      // Growth mode
      const prevMonthKey = months[idx - 1];
      if (!prevMonthKey) {
        footerData[monthKey] = '-';
      } else {
        const current = getMetricValue(monthData);
        const previous = getMetricValue(totalsMap.get(prevMonthKey));
        if (previous === 0 && current === 0) {
          footerData[monthKey] = '0%';
        } else if (previous === 0) {
          footerData[monthKey] = '+100%';
        } else {
          const growth = ((current - previous) / previous) * 100;
          footerData[monthKey] = `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
        }
      }
    }
  });

  const tableVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
  const headerVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.2 } } };

  return (
    <motion.div 
      variants={tableVariants} 
      initial="hidden" 
      animate="visible" 
      className="w-full"
    >
      <Card className="w-full bg-white/95 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <motion.div variants={headerVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-lg shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Month-on-Month Discount Analysis</h3>
                <p className="text-sm text-gray-600">Historical discount trends by group and metric</p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 border-indigo-300/50 backdrop-blur-sm"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Last 6 Months
            </Badge>
          </motion.div>
          
          <motion.div variants={headerVariants} className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-2">
            <Filter className="w-3 h-3" />
            <span>Showing {processedData.length} groups across {months.length} months</span>
            <div className="flex items-center gap-2 ml-auto">
              <select 
                className="border rounded-md px-2 py-1 text-xs bg-white"
                value={groupKey} 
                onChange={e => setGroupKey(e.target.value as GroupKey)}
              >
                <option value="product">Group: Product</option>
                <option value="category">Group: Category</option>
                <option value="location">Group: Location</option>
                <option value="soldBy">Group: Sales Rep</option>
              </select>
              
              <select 
                className="border rounded-md px-2 py-1 text-xs bg-white"
                value={metric} 
                onChange={e => setMetric(e.target.value as MetricType)}
              >
                <option value="totalDiscounts">Metric: Total Discounts</option>
                <option value="discountedTransactions">Metric: Discounted Transactions</option>
                <option value="avgDiscount">Metric: Avg Discount</option>
                <option value="discountRate">Metric: Discount Rate</option>
                <option value="uniqueCustomers">Metric: Customers w/ Discounts</option>
                <option value="totalValue">Metric: Total Value</option>
              </select>
              
              <div className="flex items-center gap-1 text-xs">
                <span className="font-medium">View:</span>
                <Button 
                  size="sm" 
                  variant={viewMode === 'values' ? 'default' : 'outline'} 
                  onClick={() => setViewMode('values')}
                  className="h-7 px-2"
                >
                  Values
                </Button>
                <Button 
                  size="sm" 
                  variant={viewMode === 'growth' ? 'default' : 'outline'} 
                  onClick={() => setViewMode('growth')}
                  className="h-7 px-2"
                >
                  Growth%
                </Button>
              </div>
            </div>
          </motion.div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <motion.div 
            className="overflow-x-auto" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.3 }}
          >
            <ModernDataTable
              data={processedData}
              columns={columns}
              loading={false}
              stickyHeader={true}
              showFooter={true}
              footerData={footerData}
              maxHeight="500px"
              className="rounded-lg"
              headerGradient="from-slate-800 via-slate-900 to-slate-800"
              tableId="month-on-month-discount-analysis"
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};