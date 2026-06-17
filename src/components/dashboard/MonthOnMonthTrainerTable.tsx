
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ModernTableWrapper } from './ModernTableWrapper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, ChevronDown, ChevronRight, Info, BarChart3, Star } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { TrainerMetricType } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { TrainerMetricTabs } from './TrainerMetricTabs';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { ProcessedTrainerData, getMetricValue } from './TrainerDataProcessor';
import { TrainerNameCell } from '@/components/ui/TrainerAvatar';

interface MonthOnMonthTrainerTableProps {
  data: ProcessedTrainerData[];
  defaultMetric?: TrainerMetricType;
  onRowClick?: (trainer: string, data: any) => void;
}

export const MonthOnMonthTrainerTable = ({ 
  data, 
  defaultMetric = 'totalSessions',
  onRowClick 
}: MonthOnMonthTrainerTableProps) => {
  const [selectedMetric, setSelectedMetric] = useState<TrainerMetricType>(defaultMetric);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const processedData = useMemo(() => {
    const trainerGroups: Record<string, Record<string, ProcessedTrainerData>> = {};
    
    // Group data by trainer
    data.forEach(record => {
      if (!trainerGroups[record.trainerName]) {
        trainerGroups[record.trainerName] = {};
      }
      trainerGroups[record.trainerName][record.monthYear] = record;
    });

    // Generate all months from Jan 2024 to current month
    const months: string[] = [];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    
    // Start from January 2024
    for (let year = 2024; year <= currentYear; year++) {
      const startMonth = year === 2024 ? 0 : 0; // Start from January for all years
      const endMonth = year === currentYear ? currentMonth : 11;
      
      for (let month = startMonth; month <= endMonth; month++) {
        const monthKey = `${monthNames[month]}-${year}`;
        months.push(monthKey);
      }
    }
    
    // Keep in ascending order (Jan 2024 first) to match sales table styling

    return { trainerGroups, months };
  }, [data]);

  const formatValue = (value: number, metric: TrainerMetricType) => {
    switch (metric) {
      case 'totalPaid':
      case 'cycleRevenue':
      case 'barreRevenue':
      case 'revenuePerSession':
      case 'revenuePerCustomer':
        return formatCurrency(value);
      case 'retentionRate':
      case 'conversionRate':
      case 'fillRate':
      case 'utilizationRate':
      case 'consistencyScore':
        return `${value.toFixed(1)}%`;
      case 'classAverageExclEmpty':
      case 'classAverageInclEmpty':
        return value.toFixed(1);
      default:
        return formatNumber(Math.round(value));
    }
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const toggleRowExpansion = (trainer: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(trainer)) {
      newExpanded.delete(trainer);
    } else {
      newExpanded.add(trainer);
    }
    setExpandedRows(newExpanded);
  };

  const handleRowClick = (trainer: string) => {
    const trainerData = processedData.trainerGroups[trainer];
    const months = processedData.months;
    const recs = Object.values(trainerData || {}) as any[];
    const totalSessions = recs.reduce((s, r) => s + (r.totalSessions || 0), 0);
    const totalRevenue = recs.reduce((s, r) => s + (r.totalPaid || 0), 0);
    const totalCustomers = recs.reduce((s, r) => s + (r.totalCustomers || 0), 0);
    const cycleSessions = recs.reduce((s, r) => s + (r.cycleSessions || 0), 0);
    const barreSessions = recs.reduce((s, r) => s + (r.barreSessions || 0), 0);
    const strengthSessions = recs.reduce((s, r) => s + (r.strengthSessions || 0), 0);
  const lastRec: any = (trainerData as any)[months[0]] || {};
  const prevRec: any = (trainerData as any)[months[1]] || {};
  const previousSessions = (prevRec as any).totalSessions || 0;
  const previousRevenue = (prevRec as any).totalPaid || 0;
  const previousCustomers = (prevRec as any).totalCustomers || 0;
  const location = (lastRec as any).location || (recs[0] as any)?.location || '';

    if (onRowClick) {
      onRowClick(trainer, {
        name: trainer,
        location,
        // Monthly mapping and order for trend charts
        monthlyData: trainerData,
        months,
        // Aggregates used by the drill-down modal
        totalSessions,
        totalRevenue,
        totalCustomers,
        previousSessions,
        previousRevenue,
        previousCustomers,
        cycleSessions,
        barreSessions,
        strengthSessions
      });
    }
  };

  // Calculate totals for each month (for class averages, compute weighted average by sessions)
  const monthlyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const isClassAvg = selectedMetric === 'classAverageExclEmpty' || selectedMetric === 'classAverageInclEmpty';
    const isConvRate = selectedMetric === 'conversionRate';
    const isRetRate = selectedMetric === 'retentionRate';
    const isFillRate = selectedMetric === 'fillRate' || selectedMetric === 'utilizationRate' || selectedMetric === 'consistencyScore';
    const isRate = isConvRate || isRetRate;

    processedData.months.forEach(month => {
      if (!isClassAvg && !isRate && !isFillRate) {
        let sum = 0;
        Object.values(processedData.trainerGroups).forEach(trainerData => {
          if (trainerData[month]) sum += getMetricValue(trainerData[month], selectedMetric);
        });
        totals[month] = sum;
      } else if (isClassAvg) {
        let numerator = 0;
        let denom = 0;
        Object.values(processedData.trainerGroups).forEach(trainerData => {
          const rec = trainerData[month];
          if (!rec) return;
          const sessions = selectedMetric === 'classAverageExclEmpty' ? (rec.nonEmptySessions || 0) : (rec.totalSessions || 0);
          numerator += rec.totalCustomers || 0;
          denom += sessions;
        });
        totals[month] = denom > 0 ? numerator / denom : 0;
      } else if (isConvRate) {
        let num = 0, den = 0;
        Object.values(processedData.trainerGroups).forEach(trainerData => {
          const rec: any = trainerData[month];
          if (!rec) return;
          num += rec.convertedMembers || 0;
          den += rec.newMembers || 0;
        });
        totals[month] = den > 0 ? (num / den) * 100 : 0;
      } else if (isRetRate) {
        let num = 0, den = 0;
        Object.values(processedData.trainerGroups).forEach(trainerData => {
          const rec: any = trainerData[month];
          if (!rec) return;
          num += rec.retainedMembers || 0;
          den += rec.newMembers || 0;
        });
        totals[month] = den > 0 ? (num / den) * 100 : 0;
      } else if (isFillRate) {
        // Simple average across trainers active that month
        let sum = 0, count = 0;
        Object.values(processedData.trainerGroups).forEach(trainerData => {
          const rec = trainerData[month];
          if (!rec) return;
          sum += getMetricValue(rec, selectedMetric);
          count++;
        });
        totals[month] = count > 0 ? sum / count : 0;
      }
    });
    return totals;
  }, [processedData, selectedMetric]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const allValues = Object.values(monthlyTotals);
    const isClassAvg = selectedMetric === 'classAverageExclEmpty' || selectedMetric === 'classAverageInclEmpty';
    const isRate = selectedMetric === 'conversionRate' || selectedMetric === 'retentionRate';
    const isAvgMetric = isClassAvg || isRate || selectedMetric === 'fillRate' || selectedMetric === 'utilizationRate' || selectedMetric === 'consistencyScore';
    let total = 0;
    if (!isAvgMetric) {
      total = allValues.reduce((sum, val) => sum + val, 0);
    } else if (isClassAvg) {
      let num = 0, den = 0;
      processedData.months.forEach(month => {
        Object.values(processedData.trainerGroups).forEach(trainerData => {
          const rec: any = (trainerData as any)[month];
          if (!rec) return;
          const sessions = selectedMetric === 'classAverageExclEmpty' ? (rec.nonEmptySessions || 0) : (rec.totalSessions || 0);
          num += rec.totalCustomers || 0;
          den += sessions;
        });
      });
      total = den > 0 ? num / den : 0;
    } else if (isRate) {
      let num = 0, den = 0;
      processedData.months.forEach(month => {
        Object.values(processedData.trainerGroups).forEach(trainerData => {
          const rec: any = (trainerData as any)[month];
          if (!rec) return;
          if (selectedMetric === 'conversionRate') { num += rec.convertedMembers || 0; den += rec.newMembers || 0; }
          else { num += rec.retainedMembers || 0; den += rec.newMembers || 0; }
        });
      });
      total = den > 0 ? (num / den) * 100 : 0;
    } else {
      // fillRate / utilizationRate — simple average of monthly totals
      total = allValues.length > 0 ? allValues.reduce((s, v) => s + v, 0) / allValues.length : 0;
    }
    const average = !isAvgMetric && allValues.length > 0 ? total / allValues.length : total;
    const growth = allValues.length >= 2 ? getChangePercentage(allValues[0], allValues[1]) : 0;
    return { total, average, growth };
  }, [monthlyTotals, processedData, selectedMetric]);

  if (!data.length) {
    return (
      <ModernTableWrapper
        title="Month-on-Month Trainer Analysis"
        description="No trainer data available for month-on-month comparison"
        icon={<BarChart3 className="w-5 h-5" />}
        totalItems={0}
      >
        <div className="p-8 text-center text-slate-600">
          No trainer data available for analysis
        </div>
      </ModernTableWrapper>
    );
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const tableId = 'Month-on-Month Trainer Analysis';
  useEffect(() => {
    if (!registry) return;
    const el = containerRef.current;
    if (!el) return;
    const getTextContent = () => {
      const table = el.querySelector('table') || el;
      let text = `${tableId}\n`;
      const headerCells = table.querySelectorAll('thead th');
      const headers: string[] = [];
      headerCells.forEach(cell => { const t = cell.textContent?.trim(); if (t) headers.push(t); });
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(() => '---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData: string[] = [];
        cells.forEach(c => rowData.push((c.textContent || '').trim()));
        if (rowData.length) text += rowData.join('\t') + '\n';
      });
      return text.trim();
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry]);

  // Generate "All Tabs" content across all trainer metrics, regardless of the active tab
  const generateAllTabsContent = useMemo(() => {
    const allMetrics: TrainerMetricType[] = [
      'totalSessions',
      'totalCustomers',
      'totalPaid',
      'classAverageExclEmpty',
      'emptySessions',
      'nonEmptySessions',
      'fillRate',
      'utilizationRate',
      'conversionRate',
      'retentionRate',
      'newMembers',
      'convertedMembers',
      'retainedMembers',
      'revenuePerSession',
      'revenuePerCustomer',
      'cycleSessions',
      'barreSessions',
      'strengthSessions',
    ];

    const metricLabel = (m: TrainerMetricType) => {
      switch (m) {
        case 'totalSessions': return 'Total Sessions';
        case 'totalCustomers': return 'Total Members';
        case 'totalPaid': return 'Total Revenue';
        case 'classAverageExclEmpty': return 'Class Average (Excl Empty)';
        case 'classAverageInclEmpty': return 'Class Average (Incl Empty)';
        case 'emptySessions': return 'Empty Sessions';
        case 'nonEmptySessions': return 'Active Classes';
        case 'fillRate': return 'Fill Rate';
        case 'utilizationRate': return 'Utilisation Rate';
        case 'conversionRate': return 'Conversion Rate';
        case 'retentionRate': return 'Retention Rate';
        case 'newMembers': return 'New Members';
        case 'convertedMembers': return 'Converted Members';
        case 'retainedMembers': return 'Retained Members';
        case 'revenuePerSession': return 'Revenue / Session';
        case 'revenuePerCustomer': return 'Revenue / Member';
        case 'cycleSessions': return 'Cycle Sessions';
        case 'barreSessions': return 'Barre Sessions';
        case 'strengthSessions': return 'Strength Sessions';
        default: return m;
      }
    };

    const lines: string[] = [];
    lines.push(`${tableId} — All Metrics`);
    lines.push(`Trainers: ${Object.keys(processedData.trainerGroups).length} | Months: ${processedData.months.length}`);

    allMetrics.forEach(metric => {
      lines.push('');
      lines.push(`=== ${metricLabel(metric)} ===`);
      // Header row
      const headers = ['Trainer', ...processedData.months, 'MoM Change', metric === 'classAverageExclEmpty' || metric === 'classAverageInclEmpty' || metric === 'conversionRate' || metric === 'retentionRate' ? 'Weighted Avg' : 'Total'];
      lines.push(headers.join('\t'));

      // Totals row (for class avg / rates use weighted average)
      const isClassAvg = metric === 'classAverageExclEmpty' || metric === 'classAverageInclEmpty';
      const isRate = metric === 'conversionRate' || metric === 'retentionRate';

      const monthlyTotals = processedData.months.map(month => {
        if (!isClassAvg && !isRate) {
          let sum = 0;
          Object.values(processedData.trainerGroups).forEach(trainerData => {
            if ((trainerData as any)[month]) sum += getMetricValue((trainerData as any)[month], metric);
          });
          return sum;
        } else if (isClassAvg) {
          let num = 0; let den = 0;
          Object.values(processedData.trainerGroups).forEach(trainerData => {
            const rec: any = (trainerData as any)[month];
            if (!rec) return;
            const sessions = metric === 'classAverageExclEmpty' ? (rec.nonEmptySessions || 0) : (rec.totalSessions || 0);
            const customers = rec.totalCustomers || 0;
            num += customers;
            den += sessions;
          });
          return den > 0 ? (num / den) : 0;
        } else { // isRate
          let num = 0; let den = 0;
          Object.values(processedData.trainerGroups).forEach(trainerData => {
            const rec: any = (trainerData as any)[month];
            if (!rec) return;
            if (metric === 'conversionRate') { num += (rec.convertedMembers || 0); den += (rec.newMembers || 0); }
            else { num += (rec.retainedMembers || 0); den += (rec.newMembers || 0); }
          });
          return den > 0 ? (num / den) * 100 : 0;
        }
      });
      const totalsAllValues = monthlyTotals;
      const totalsGrowth = totalsAllValues.length >= 2 ? getChangePercentage(totalsAllValues[0], totalsAllValues[1]) : 0;
      const totalsOverall = (() => {
        if (!isClassAvg && !isRate) return totalsAllValues.reduce((s, v) => s + v, 0);
        // weighted avg across all months
        if (isClassAvg) {
          let num = 0; let den = 0;
          processedData.months.forEach(month => {
            Object.values(processedData.trainerGroups).forEach(trainerData => {
              const rec: any = (trainerData as any)[month];
              if (!rec) return;
              const sessions = metric === 'classAverageExclEmpty' ? (rec.nonEmptySessions || 0) : (rec.totalSessions || 0);
              const customers = rec.totalCustomers || 0;
              num += customers; den += sessions;
            });
          });
          return den > 0 ? (num / den) : 0;
        }
        // isRate
        let num = 0; let den = 0;
        processedData.months.forEach(month => {
          Object.values(processedData.trainerGroups).forEach(trainerData => {
            const rec: any = (trainerData as any)[month];
            if (!rec) return;
            if (metric === 'conversionRate') { num += (rec.convertedMembers || 0); den += (rec.newMembers || 0); }
            else { num += (rec.retainedMembers || 0); den += (rec.newMembers || 0); }
          });
        });
        return den > 0 ? (num / den) * 100 : 0;
      })();

      const totalsRow = [
        'TOTAL',
        ...monthlyTotals.map(v => formatValue(v, metric)),
        `${totalsGrowth >= 0 ? '' : ''}${Math.abs(totalsGrowth).toFixed(1)}%`,
        formatValue(totalsOverall as number, metric)
      ];
      lines.push(totalsRow.join('\t'));

      // Trainer rows
      Object.entries(processedData.trainerGroups).forEach(([trainer, trainerData]) => {
        const values = processedData.months.map(month => (trainerData as any)[month] ? getMetricValue((trainerData as any)[month], metric) : 0);
        const growth = values.length >= 2 ? getChangePercentage(values[0], values[1]) : 0;
        const total = (() => {
          if (!isClassAvg && !isRate) return values.reduce((s, v) => s + v, 0);
          if (isClassAvg) {
            let num = 0; let den = 0;
            processedData.months.forEach(month => {
              const rec: any = (trainerData as any)[month];
              if (!rec) return;
              const sessions = metric === 'classAverageExclEmpty' ? (rec.nonEmptySessions || 0) : (rec.totalSessions || 0);
              const customers = rec.totalCustomers || 0;
              num += customers; den += sessions;
            });
            return den > 0 ? (num / den) : 0;
          }
          // isRate
          let num = 0; let den = 0;
          processedData.months.forEach(month => {
            const rec: any = (trainerData as any)[month];
            if (!rec) return;
            if (metric === 'conversionRate') { num += (rec.convertedMembers || 0); den += (rec.newMembers || 0); }
            else { num += (rec.retainedMembers || 0); den += (rec.newMembers || 0); }
          });
          return den > 0 ? (num / den) * 100 : 0;
        })();

        const row = [
          trainer,
          ...values.map(v => formatValue(v, metric)),
          `${growth >= 0 ? '' : ''}${Math.abs(growth).toFixed(1)}%`,
          formatValue(total as number, metric)
        ];
        lines.push(row.join('\t'));
      });
    });

    return lines.join('\n');
  }, [processedData]);

  return (
    <ModernTableWrapper
      title="Month-on-Month Trainer Analysis"
      description={`Individual month performance for ${Object.keys(processedData.trainerGroups).length} trainers • ${processedData.months.length} months tracked • Sorted by most recent`}
      icon={<BarChart3 className="w-5 h-5" />}
      totalItems={Object.keys(processedData.trainerGroups).length}
    >
      <div ref={containerRef} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Metrics Tabs and Controls Header */}
        <div className="border-b border-slate-200 bg-white p-4 pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="border-blue-200 bg-blue-100 text-blue-800">
                  Individual Monthly Columns
                </Badge>
              </div>
            </div>
            <TrainerMetricTabs value={selectedMetric} onValueChange={setSelectedMetric} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table data-table="trainer-month-on-month" data-table-name="Month-on-Month Trainer Analysis">
            <TableHeader className="sticky top-0 z-20">
              <TableRow className="border-none bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800" style={{ height: '35px', maxHeight: '35px' }}>
                <TableHead className="font-bold text-white sticky left-0 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 z-30 min-w-[240px] border-r border-white/20" style={{ height: '35px' }}>
                  <div className="flex items-center justify-center">
                    <span className="text-white font-bold">Trainer</span>
                  </div>
                </TableHead>
                {processedData.months.map((month, index) => {
                  // Get the current previous month for highlighting - fix logic to properly identify main month
                  const now = new Date();
                  const currentMonth = now.getMonth(); // 0-indexed (0=Jan, 11=Dec)
                  const currentYear = now.getFullYear();
                  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  
                  // Previous month calculation
                  let prevMonth = currentMonth - 1;
                  let prevYear = currentYear;
                  if (prevMonth < 0) {
                    prevMonth = 11;
                    prevYear = currentYear - 1;
                  }
                  
                  const previousMonthKey = `${monthNames[prevMonth]}-${prevYear}`;
                  const isMainMonth = month === previousMonthKey;
                  
                  return (
                    <TableHead 
                      key={month} 
                      className={cn(
                        "text-center font-bold min-w-[140px] whitespace-nowrap text-white bg-slate-900 border-l border-white/20",
                        isMainMonth ? "bg-blue-800" : ""
                      )}
                      style={{ height: '35px' }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {isMainMonth && <Star className="w-3 h-3 text-white" />}
                        <span className="text-sm font-bold">
                          {month.split('-')[0]}
                        </span>
                        <span className="text-slate-300 text-xs">
                          {month.split('-')[1]}
                        </span>
                      </div>
                    </TableHead>
                  );
                })}
                <TableHead className="text-center font-bold text-white bg-slate-900 min-w-[120px] border-l border-white/20" style={{ height: '35px' }}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">MoM Change</TooltipTrigger>
                      <TooltipContent>Month-over-month change for the selected metric</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-center font-bold text-white min-w-[140px] bg-slate-900 border-l border-white/20" style={{ height: '35px' }}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">Total</TooltipTrigger>
                      <TooltipContent>
                        {selectedMetric === 'classAverageExclEmpty' || selectedMetric === 'classAverageInclEmpty'
                          ? 'Weighted average across visible months (by sessions)'
                          : selectedMetric === 'conversionRate' || selectedMetric === 'retentionRate'
                            ? 'Weighted average across visible months (by new members)'
                            : 'Sum across all visible months for each trainer'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Trainer Rows */}
              {Object.entries(processedData.trainerGroups).map(([trainer, trainerData]) => {
                const isExpanded = expandedRows.has(trainer);
                const values = processedData.months.map(month => 
                  trainerData[month] ? getMetricValue(trainerData[month], selectedMetric) : 0
                );
                
                const trainerTotal = (() => {
                  if (selectedMetric === 'classAverageExclEmpty' || selectedMetric === 'classAverageInclEmpty') {
                    // Weighted average across months per trainer
                    let num = 0; let den = 0;
                    processedData.months.forEach((month, i) => {
                      const rec: any = (trainerData as any)[month];
                      if (!rec) return;
                      const sessions = selectedMetric === 'classAverageExclEmpty' ? (rec.nonEmptySessions || 0) : (rec.totalSessions || 0);
                      const customers = rec.totalCustomers || 0;
                      num += customers;
                      den += sessions;
                    });
                    return den > 0 ? (num / den) : 0;
                  } else if (selectedMetric === 'conversionRate' || selectedMetric === 'retentionRate') {
                    // Weighted average of rates by new members across months for this trainer
                    let num = 0; let den = 0;
                    processedData.months.forEach((month) => {
                      const rec: any = (trainerData as any)[month];
                      if (!rec) return;
                      if (selectedMetric === 'conversionRate') {
                        num += (rec.convertedMembers || 0);
                        den += (rec.newMembers || 0);
                      } else {
                        num += (rec.retainedMembers || 0);
                        den += (rec.newMembers || 0);
                      }
                    });
                    return den > 0 ? (num / den) * 100 : 0;
                  }
                  return values.reduce((sum, val) => sum + val, 0);
                })();
                const growth = values.length >= 2 ? getChangePercentage(values[0], values[1]) : 0;
                
                return (
                  <React.Fragment key={trainer}>
                    <TableRow 
                      className="border-b border-gray-200 bg-white transition-all duration-200 hover:bg-slate-50 cursor-pointer h-9 max-h-9"
                      onClick={() => handleRowClick(trainer)}
                      style={{ height: '35px' }}
                    >
                      <TableCell className="sticky left-0 z-20 min-w-[240px] overflow-hidden whitespace-nowrap border-r border-gray-200 bg-white font-medium text-slate-800 text-ellipsis" style={{ height: '35px' }}>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(trainer);
                            }}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </Button>
                          <TrainerNameCell name={trainer} className="text-nowrap" />
                        </div>
                      </TableCell>
                      {values.map((value, index) => (
                        <TableCell 
                          key={`${trainer}-${index}`} 
                          className="border-l border-gray-200 text-center text-sm font-medium text-slate-800 hover:bg-slate-100 cursor-pointer transition-all duration-200" 
                          style={{ height: '35px', maxHeight: '35px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!onRowClick) return;
                            const month = processedData.months[index];
                            const trainerMonthMap = (processedData.trainerGroups as any)[trainer] || {};
                            const rec = trainerMonthMap[month] || {};
                            const payload = {
                              ...rec,
                              trainerName: trainer,
                              monthYear: month,
                              location: rec.location || (values.length ? (trainerMonthMap[processedData.months[0]]?.location || '') : ''),
                              type: 'trainer-month-cell'
                            };
                            onRowClick(trainer, payload);
                          }}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help">{formatValue(value, selectedMetric)}</TooltipTrigger>
                              <TooltipContent>
                                {processedData.months[index]} • {selectedMetric}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 w-fit mx-auto text-xs font-semibold",
                            growth >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          )}
                        >
                          {growth >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {Math.abs(growth).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-700">
                        {formatValue(trainerTotal, selectedMetric)}
                      </TableCell>
                    </TableRow>
                    
                     {/* Expanded Row Drill-Down */}
                     {isExpanded && (() => {
                       const recs = Object.values(trainerData as any) as any[];
                       const totSess = recs.reduce((s, r) => s + (r.totalSessions || 0), 0);
                       const totRev = recs.reduce((s, r) => s + (r.totalPaid || 0), 0);
                       const totCust = recs.reduce((s, r) => s + (r.totalCustomers || 0), 0);
                       const totNew = recs.reduce((s, r) => s + (r.newMembers || 0), 0);
                       const totConv = recs.reduce((s, r) => s + (r.convertedMembers || 0), 0);
                       const totRet = recs.reduce((s, r) => s + (r.retainedMembers || 0), 0);
                       const totEmpty = recs.reduce((s, r) => s + (r.emptySessions || 0), 0);
                       const totNonEmpty = recs.reduce((s, r) => s + (r.nonEmptySessions || 0), 0);
                       const totCyc = recs.reduce((s, r) => s + (r.cycleSessions || 0), 0);
                       const totBar = recs.reduce((s, r) => s + (r.barreSessions || 0), 0);
                       const totStr = recs.reduce((s, r) => s + (r.strengthSessions || 0), 0);
                       const convRate = totNew > 0 ? (totConv / totNew) * 100 : 0;
                       const retRate = totConv > 0 ? (totRet / totConv) * 100 : 0;
                       const revPerSess = totSess > 0 ? totRev / totSess : 0;
                       const revPerCust = totCust > 0 ? totRev / totCust : 0;
                       const avgClassExcl = totNonEmpty > 0 ? totCust / totNonEmpty : 0;
                       const nonZeroMonths = values.filter(v => v > 0).length;
                       const avgPerActiveMonth = nonZeroMonths > 0 ? trainerTotal / nonZeroMonths : 0;
                       const bestVal = values.length > 0 ? Math.max(...values) : 0;
                       const worstVal = values.filter(v => v > 0).length > 0 ? Math.min(...values.filter(v => v > 0)) : 0;
                       const bestMonthIdx = values.indexOf(bestVal);
                       const bestMonthLabel = bestMonthIdx >= 0 ? processedData.months[bestMonthIdx] : '—';

                       return (
                         <TableRow className="bg-slate-50/60 hover:bg-slate-50/80">
                           <TableCell colSpan={processedData.months.length + 4} className="p-5">
                             <div className="space-y-4">
                               {/* Top KPI strip */}
                               <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                                 {[
                                   { label: 'Total Sessions', val: formatNumber(totSess), color: 'text-slate-800' },
                                   { label: 'Active Classes', val: formatNumber(totNonEmpty), color: 'text-slate-800' },
                                   { label: 'Empty Classes', val: formatNumber(totEmpty), color: 'text-rose-600' },
                                   { label: 'Total Revenue', val: formatCurrency(totRev), color: 'text-emerald-700' },
                                   { label: 'Rev / Session', val: formatCurrency(revPerSess), color: 'text-blue-700' },
                                   { label: 'Rev / Member', val: formatCurrency(revPerCust), color: 'text-blue-700' },
                                   { label: 'Avg Class Excl', val: avgClassExcl.toFixed(1), color: 'text-slate-800' },
                                   { label: 'MoM Change', val: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`, color: growth >= 0 ? 'text-emerald-600' : 'text-rose-600' },
                                 ].map(({ label, val, color }) => (
                                   <div key={label} className="bg-white rounded-lg border border-slate-200 px-3 py-2.5 shadow-sm">
                                     <p className="text-[10px] text-slate-500 font-medium leading-tight">{label}</p>
                                     <p className={`font-bold text-sm mt-0.5 ${color}`}>{val}</p>
                                   </div>
                                 ))}
                               </div>

                               {/* Three panels */}
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                 {/* Member funnel */}
                                 <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                   <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Member Funnel</h5>
                                   <div className="space-y-2 text-sm">
                                     {[
                                       { label: 'New Members', val: formatNumber(totNew) },
                                       { label: 'Converted', val: formatNumber(totConv) },
                                       { label: 'Retained', val: formatNumber(totRet) },
                                       { label: 'Conv. Rate', val: `${convRate.toFixed(1)}%` },
                                       { label: 'Ret. Rate', val: `${retRate.toFixed(1)}%` },
                                     ].map(({ label, val }) => (
                                       <div key={label} className="flex justify-between items-center">
                                         <span className="text-slate-500">{label}</span>
                                         <span className="font-semibold text-slate-800">{val}</span>
                                       </div>
                                     ))}
                                   </div>
                                 </div>

                                 {/* Format breakdown */}
                                 <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                   <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Class Formats</h5>
                                   <div className="space-y-2 text-sm">
                                     {[
                                       { label: 'Cycle', val: formatNumber(totCyc), pct: totSess > 0 ? (totCyc / totSess * 100).toFixed(0) : '0' },
                                       { label: 'Barre', val: formatNumber(totBar), pct: totSess > 0 ? (totBar / totSess * 100).toFixed(0) : '0' },
                                       { label: 'Strength', val: formatNumber(totStr), pct: totSess > 0 ? (totStr / totSess * 100).toFixed(0) : '0' },
                                     ].map(({ label, val, pct }) => (
                                       <div key={label} className="flex justify-between items-center">
                                         <span className="text-slate-500">{label}</span>
                                         <span className="font-semibold text-slate-800">{val} <span className="text-slate-400 font-normal text-xs">({pct}%)</span></span>
                                       </div>
                                     ))}
                                   </div>
                                 </div>

                                 {/* Trend stats */}
                                 <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                   <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Trend — {selectedMetric}</h5>
                                   <div className="space-y-2 text-sm">
                                     {[
                                       { label: 'Best Month', val: `${formatValue(bestVal, selectedMetric)} (${bestMonthLabel})` },
                                       { label: 'Lowest Active', val: formatValue(worstVal, selectedMetric) },
                                       { label: 'Avg / Month', val: formatValue(avgPerActiveMonth, selectedMetric) },
                                       { label: 'Active Months', val: `${nonZeroMonths} / ${processedData.months.length}` },
                                     ].map(({ label, val }) => (
                                       <div key={label} className="flex justify-between items-center">
                                         <span className="text-slate-500">{label}</span>
                                         <span className="font-semibold text-slate-800">{val}</span>
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </TableCell>
                         </TableRow>
                       );
                     })()}
                  </React.Fragment>
                );
              })}

              {/* Totals Row */}
              <TableRow className="retention-totals-row bg-slate-800 text-white font-bold border-t-2 border-slate-400 h-9 max-h-9 hover:bg-slate-700" style={{ height: '35px', maxHeight: '35px' }}>
                <TableCell className="sticky left-0 z-20 whitespace-nowrap border-r border-slate-400 bg-slate-800 font-bold text-white" style={{ height: '35px', maxHeight: '35px' }}>
                  TOTALS
                </TableCell>
                {processedData.months.map((month) => (
                  <TableCell key={`total-${month}`} className="border-l border-slate-400 text-center font-bold whitespace-nowrap text-white" style={{ height: '35px', maxHeight: '35px' }}>
                    {formatValue(monthlyTotals[month] || 0, selectedMetric)}
                  </TableCell>
                ))}
                <TableCell className="border-l border-slate-400 text-center text-white">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold",
                    summaryStats.growth >= 0 ? 'text-emerald-200' : 'text-rose-200'
                  )}>
                    {summaryStats.growth >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(summaryStats.growth).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="border-l border-slate-400 text-center font-bold text-white">
                  {formatValue(summaryStats.total, selectedMetric)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Footer Summary Section */}
        <div className="bg-gradient-to-r from-slate-50 to-white border-t p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Monthly Performance Summary
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(processedData.trainerGroups).length}
              </div>
              <div className="text-sm text-slate-600">Active Trainers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {formatValue(summaryStats.total, selectedMetric)}
              </div>
              <div className="text-sm text-slate-600">Total {selectedMetric}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">
                {formatValue(summaryStats.average, selectedMetric)}
              </div>
              <div className="text-sm text-slate-600">Monthly Average</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold",
                summaryStats.growth >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {summaryStats.growth >= 0 ? '+' : ''}{summaryStats.growth.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600">Recent Growth</div>
            </div>
          </div>
        </div>
      </div>
    </ModernTableWrapper>
  );
};
