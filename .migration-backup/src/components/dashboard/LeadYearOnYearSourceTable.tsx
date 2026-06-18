import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react';
import { LeadMetricTabs } from './LeadMetricTabs';
import { LeadsMetricType, LeadsData } from '@/types/leads';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
interface LeadYearOnYearSourceTableProps {
  allData: LeadsData[]; // Use unfiltered data for year-on-year comparison
  activeMetric: LeadsMetricType;
  onMetricChange: (metric: LeadsMetricType) => void;
}
export const LeadYearOnYearSourceTable: React.FC<LeadYearOnYearSourceTableProps> = ({
  allData,
  activeMetric,
  onMetricChange
}) => {
  const [sortField, setSortField] = useState<string>('growth');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Process data for year-on-year comparison by source using ALL data (ignoring filters)
  const processedData = useMemo(() => {
    const sourceStats = allData.reduce((acc, item) => {
      if (!item.createdAt || !item.source) return acc;
      const date = new Date(item.createdAt);
      if (isNaN(date.getTime())) return acc;
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const source = item.source;

      // Only include 2024 and 2025 data
      if (year !== 2024 && year !== 2025) return acc;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      if (!acc[source]) {
        acc[source] = {};
      }
      if (!acc[source][key]) {
        acc[source][key] = {
          totalLeads: 0,
          trialsCompleted: 0,
          membershipsSold: 0,
          ltvSum: 0,
          visits: 0,
          revenue: 0
        };
      }
      acc[source][key].totalLeads++;
      if (item.stage === 'Trial Completed') {
        acc[source][key].trialsCompleted++;
      }
      if (item.conversionStatus === 'Converted') {
        acc[source][key].membershipsSold++;
      }
      acc[source][key].ltvSum += item.ltv || 0;
      acc[source][key].visits += item.visits || 0;
      acc[source][key].revenue += item.ltv || 0;
      return acc;
    }, {} as Record<string, Record<string, any>>);

    // Generate month pairs (2024, 2025) dynamically based on current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const months = [];
    // Show up to current month for current year, and all 12 months for previous year
    const endMonth = currentYear === 2025 ? currentMonth : 12;
    for (let month = endMonth; month >= 1; month--) {
      const monthKey = String(month).padStart(2, '0');
      months.push({
        month,
        display: new Date(2025, month - 1).toLocaleString('default', {
          month: 'short'
        }),
        key2024: `2024-${monthKey}`,
        key2025: `2025-${monthKey}`
      });
    }
    const result = Object.entries(sourceStats).map(([source, monthData]) => {
      const sourceResult = {
        source,
        months: {} as any,
        totals: {
          total2024: 0,
          total2025: 0,
          growth: 0
        }
      };
      months.forEach(({
        month,
        display,
        key2024,
        key2025
      }) => {
        const data2024 = monthData[key2024] || {
          totalLeads: 0,
          trialsCompleted: 0,
          membershipsSold: 0,
          ltvSum: 0,
          visits: 0,
          revenue: 0
        };
        const data2025 = monthData[key2025] || {
          totalLeads: 0,
          trialsCompleted: 0,
          membershipsSold: 0,
          ltvSum: 0,
          visits: 0,
          revenue: 0
        };
        let value2024 = 0;
        let value2025 = 0;
        switch (activeMetric) {
          case 'totalLeads':
            value2024 = data2024.totalLeads;
            value2025 = data2025.totalLeads;
            break;
          case 'leadToTrialConversion':
            value2024 = data2024.totalLeads > 0 ? data2024.trialsCompleted / data2024.totalLeads * 100 : 0;
            value2025 = data2025.totalLeads > 0 ? data2025.trialsCompleted / data2025.totalLeads * 100 : 0;
            break;
          case 'trialToMembershipConversion':
            value2024 = data2024.trialsCompleted > 0 ? data2024.membershipsSold / data2024.trialsCompleted * 100 : 0;
            value2025 = data2025.trialsCompleted > 0 ? data2025.membershipsSold / data2025.trialsCompleted * 100 : 0;
            break;
          case 'ltv':
            value2024 = data2024.totalLeads > 0 ? data2024.ltvSum / data2024.totalLeads : 0;
            value2025 = data2025.totalLeads > 0 ? data2025.ltvSum / data2025.totalLeads : 0;
            break;
          case 'totalRevenue':
            value2024 = data2024.revenue;
            value2025 = data2025.revenue;
            break;
          case 'visitFrequency':
            value2024 = data2024.totalLeads > 0 ? data2024.visits / data2024.totalLeads : 0;
            value2025 = data2025.totalLeads > 0 ? data2025.visits / data2025.totalLeads : 0;
            break;
          default:
            value2024 = data2024.totalLeads;
            value2025 = data2025.totalLeads;
        }
        const growth = value2024 > 0 ? (value2025 - value2024) / value2024 * 100 : 0;
        sourceResult.months[month] = {
          display,
          value2024,
          value2025,
          growth
        };
        sourceResult.totals.total2024 += value2024;
        sourceResult.totals.total2025 += value2025;
      });
      sourceResult.totals.growth = sourceResult.totals.total2024 > 0 ? (sourceResult.totals.total2025 - sourceResult.totals.total2024) / sourceResult.totals.total2024 * 100 : 0;
      return sourceResult;
    });

    // Calculate totals row
    const totalsRow = {
      source: 'TOTAL',
      months: {} as any,
      totals: {
        total2024: 0,
        total2025: 0,
        growth: 0
      }
    };
    const monthNumbers = [];
    for (let month = endMonth; month >= 1; month--) {
      monthNumbers.push(month);
    }
    monthNumbers.forEach(month => {
      const monthTotals2024 = result.reduce((sum, item) => sum + (item.months[month]?.value2024 || 0), 0);
      const monthTotals2025 = result.reduce((sum, item) => sum + (item.months[month]?.value2025 || 0), 0);
      const monthGrowth = monthTotals2024 > 0 ? (monthTotals2025 - monthTotals2024) / monthTotals2024 * 100 : 0;
      totalsRow.months[month] = {
        display: new Date(2025, month - 1).toLocaleString('default', {
          month: 'short'
        }),
        value2024: monthTotals2024,
        value2025: monthTotals2025,
        growth: monthGrowth
      };
      totalsRow.totals.total2024 += monthTotals2024;
      totalsRow.totals.total2025 += monthTotals2025;
    });
    totalsRow.totals.growth = totalsRow.totals.total2024 > 0 ? (totalsRow.totals.total2025 - totalsRow.totals.total2024) / totalsRow.totals.total2024 * 100 : 0;
    const sortedResult = result.sort((a, b) => {
      if (sortField === 'source') {
        return sortDirection === 'asc' ? a.source.localeCompare(b.source) : b.source.localeCompare(a.source);
      }
      if (sortField === 'growth') {
        return sortDirection === 'asc' ? a.totals.growth - b.totals.growth : b.totals.growth - a.totals.growth;
      }
      return sortDirection === 'asc' ? a.totals.total2025 - b.totals.total2025 : b.totals.total2025 - a.totals.total2025;
    });
    return [...sortedResult, totalsRow];
  }, [allData, activeMetric, sortField, sortDirection]);
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  const formatValue = (value: number) => {
    if (activeMetric === 'ltv' || activeMetric === 'totalRevenue') return formatCurrency(value);
    if (activeMetric.includes('Conversion')) return `${value.toFixed(1)}%`;
    if (activeMetric === 'visitFrequency') return value.toFixed(1);
    return formatNumber(value);
  };
  const SortIcon = ({
    field
  }: {
    field: string;
  }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };
  const handleExport = () => {

  };

  // Get current date info for dynamic month display
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const endMonth = currentYear === 2025 ? currentMonth : 12;
  return <Card className="bg-white shadow-xl border-0 overflow-hidden rounded-2xl">
      <CardHeader className="bg-gradient-to-br from-indigo-800 to-pink-900 border-b border-slate-200 space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-xl font-bold">
            <Calendar className="w-6 h-6 text-white" />
            Year-on-Year Source Performance (2024 vs 2025)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport} className="gap-2 bg-white/20 border-white/30 text-white hover:bg-white/30">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Badge variant="secondary" className="text-indigo-600 border-white bg-white/90">
              {processedData.length - 1} Sources
            </Badge>
          </div>
        </div>
        
        <LeadMetricTabs value={activeMetric} onValueChange={onMetricChange} className="w-full" />
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
          <Table className="rounded-lg">
            <TableHeader className="sticky top-0 z-20">
              <TableRow className="bg-gradient-to-r from-gray-900 via-gray-900 to-black text-white hover:bg-gradient-to-r hover:from-gray-900 hover:to-black">
                <TableHead className="cursor-pointer hover:bg-slate-700 transition-colors font-bold text-white sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-30 min-w-[200px] p-4" onClick={() => handleSort('source')}>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    Lead Source <SortIcon field="source" />
                  </div>
                </TableHead>
                {Array.from({
                length: endMonth
              }, (_, i) => endMonth - i).map(month => {
                const monthName = new Date(2025, month - 1).toLocaleString('default', {
                  month: 'short'
                });
                return <React.Fragment key={month}>
                      <TableHead className="text-center font-bold text-slate-300 min-w-[100px] p-3 border-r border-slate-600">
                        <div className="text-xs">
                          <div>{monthName} 2024</div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold text-white min-w-[100px] p-3 border-r border-slate-600">
                        <div className="text-xs">
                          <div>{monthName} 2025</div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold text-amber-300 min-w-[90px] p-3 border-r-2 border-slate-500">
                        <div className="text-xs">Growth %</div>
                      </TableHead>
                    </React.Fragment>;
              })}
                <TableHead className="cursor-pointer hover:bg-slate-700 transition-colors text-center font-bold text-amber-200 min-w-[120px] p-3" onClick={() => handleSort('growth')}>
                  <div className="flex items-center justify-center gap-1 text-sm font-bold">
                    Total Growth <SortIcon field="growth" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map(sourceData => {
              const isTotal = sourceData.source === 'TOTAL';
              if (isTotal) return null; // Skip the totals row in the body

              return <TableRow key={sourceData.source} className="border-b border-gray-200">
                    <TableCell className="font-medium sticky left-0 z-10 border-r border-slate-200 min-w-[200px] p-4 bg-white text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0"></div>
                        <span className="truncate text-sm font-semibold">
                          {sourceData.source}
                        </span>
                      </div>
                    </TableCell>
                    {Array.from({
                  length: endMonth
                }, (_, i) => endMonth - i).map(month => {
                  const monthData = sourceData.months[month];
                  return <React.Fragment key={month}>
                          <TableCell className="text-center font-mono p-3 border-r border-slate-100 text-sm">
                            <span className="text-slate-600">{formatValue(monthData?.value2024 || 0)}</span>
                          </TableCell>
                          <TableCell className="text-center font-mono p-3 border-r border-slate-100 text-sm">
                            <span className="font-semibold text-slate-800">
                              {formatValue(monthData?.value2025 || 0)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center p-3 border-r-2 border-slate-100">
                            <div className={`flex items-center justify-center gap-1 font-bold text-xs ${(monthData?.growth || 0) > 0 ? 'text-emerald-600' : (monthData?.growth || 0) < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                              {(monthData?.growth || 0) > 0 ? <TrendingUp className="w-3 h-3" /> : (monthData?.growth || 0) < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                              {(monthData?.growth || 0).toFixed(1)}%
                            </div>
                          </TableCell>
                        </React.Fragment>;
                })}
                    <TableCell className="text-center p-3">
                      <div className={`flex items-center justify-center gap-1 font-bold text-sm ${sourceData.totals.growth > 0 ? 'text-emerald-600' : sourceData.totals.growth < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                        {sourceData.totals.growth > 0 ? <TrendingUp className="w-4 h-4" /> : sourceData.totals.growth < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                        {sourceData.totals.growth.toFixed(1)}%
                      </div>
                    </TableCell>
                  </TableRow>;
            })}
            </TableBody>
            <TableFooter className="sticky bottom-0 z-20">
              {processedData.filter(data => data.source === 'TOTAL').map(totalsData => <TableRow key="totals" className="bg-black text-white border-t-4 border-indigo-600">
                  <TableCell className="font-bold text-white sticky left-0 bg-black z-30 min-w-[200px] p-4">
                    <span className="text-lg font-bold">TOTAL</span>
                  </TableCell>
                  {Array.from({
                length: endMonth
              }, (_, i) => endMonth - i).map(month => {
                const monthData = totalsData.months[month];
                return <React.Fragment key={month}>
                        <TableCell className="text-center font-mono p-3 border-r border-gray-600 font-bold text-base">
                          <span className="text-gray-300">{formatValue(monthData?.value2024 || 0)}</span>
                        </TableCell>
                        <TableCell className="text-center font-mono p-3 border-r border-gray-600 font-bold text-base">
                          <span className="text-white">
                            {formatValue(monthData?.value2025 || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center p-3 border-r-2 border-gray-600">
                          <div className={`flex items-center justify-center gap-1 font-bold text-base ${(monthData?.growth || 0) > 0 ? 'text-emerald-400' : (monthData?.growth || 0) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                            {(monthData?.growth || 0) > 0 ? <TrendingUp className="w-4 h-4" /> : (monthData?.growth || 0) < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                            {(monthData?.growth || 0).toFixed(1)}%
                          </div>
                        </TableCell>
                      </React.Fragment>;
              })}
                  <TableCell className="text-center p-3">
                    <div className={`flex items-center justify-center gap-1 font-bold text-lg ${totalsData.totals.growth > 0 ? 'text-emerald-400' : totalsData.totals.growth < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {totalsData.totals.growth > 0 ? <TrendingUp className="w-5 h-5" /> : totalsData.totals.growth < 0 ? <TrendingDown className="w-5 h-5" /> : null}
                      {totalsData.totals.growth.toFixed(1)}%
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableFooter>
          </Table>
        </div>
        
        {processedData.length <= 1 && <div className="text-center py-12 text-slate-500">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="font-medium">No year-on-year data available</p>
            <p className="text-sm">Data comparison requires leads from both 2024 and 2025</p>
          </div>}
      </CardContent>
    </Card>;
};