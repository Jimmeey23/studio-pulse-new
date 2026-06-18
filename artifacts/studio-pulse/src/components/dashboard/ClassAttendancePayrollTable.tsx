import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus, Info, Download } from 'lucide-react';
import { PayrollData } from '@/types/dashboard';
import { formatNumber } from '@/utils/formatters';
interface ClassAttendancePayrollTableProps {
  data: PayrollData[];
  location?: string;
}
export const ClassAttendancePayrollTable: React.FC<ClassAttendancePayrollTableProps> = ({
  data,
  location
}) => {
  const [sortColumn, setSortColumn] = useState<string>('monthYear');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filter by location if specified
    let filteredData = data;
    if (location && location !== 'all') {
      const locationMap: {
        [key: string]: string;
      } = {
        'Kwality House, Kemps Corner': 'Kwality House, Kemps Corner',
        'Supreme HQ, Bandra': 'Supreme HQ, Bandra',
        'Kenkere House': 'Kenkere House'
      };
      const targetLocation = locationMap[location];
      if (targetLocation) {
        filteredData = data.filter(item => item.location === targetLocation || location === 'Kenkere House' && item.location?.includes('Kenkere'));
      }
    }

    // Group by location, class type, and month
    const grouped = filteredData.reduce((acc, item) => {
      const key = `${item.location}-${item.monthYear}`;
      if (!acc[key]) {
        acc[key] = {
          location: item.location,
          monthYear: item.monthYear,
          teacherName: item.teacherName,
          totalSessions: 0,
          totalCustomers: 0,
          totalPaid: 0,
          cycleSessions: 0,
          barreSessions: 0,
          strengthSessions: 0,
          cycleCustomers: 0,
          barreCustomers: 0,
          strengthCustomers: 0,
          cyclePaid: 0,
          barrePaid: 0,
          strengthPaid: 0,
          emptySession: 0,
          nonEmptySession: 0,
          classAvgWithEmpty: 0,
          classAvgWithoutEmpty: 0,
          fillRate: 0,
          cancelRate: 0
        };
      }
      const entry = acc[key];
      entry.totalSessions += item.totalSessions || 0;
      entry.totalCustomers += item.totalCustomers || 0;
      entry.totalPaid += item.totalPaid || 0;
      entry.cycleSessions += item.cycleSessions || 0;
      entry.barreSessions += item.barreSessions || 0;
      entry.strengthSessions += item.strengthSessions || 0;
      entry.cycleCustomers += item.cycleCustomers || 0;
      entry.barreCustomers += item.barreCustomers || 0;
      entry.strengthCustomers += item.strengthCustomers || 0;
      entry.cyclePaid += item.cyclePaid || 0;
      entry.barrePaid += item.barrePaid || 0;
      entry.strengthPaid += item.strengthPaid || 0;
      entry.emptySession += item.totalEmptySessions || 0;
      entry.nonEmptySession += item.totalNonEmptySessions || 0;
      return acc;
    }, {} as Record<string, any>);

    // Calculate derived metrics
    const results = Object.values(grouped).map(item => {
      const totalCapacity = item.totalSessions * 15; // Assuming average capacity of 15
      item.classAvgWithEmpty = item.totalSessions > 0 ? Number((item.totalCustomers / item.totalSessions).toFixed(1)) : 0;
      item.classAvgWithoutEmpty = item.nonEmptySession > 0 ? Number((item.totalCustomers / item.nonEmptySession).toFixed(1)) : 0;
      item.fillRate = totalCapacity > 0 ? Number((item.totalCustomers / totalCapacity * 100).toFixed(1)) : 0;
      item.cancelRate = item.totalSessions > 0 ? Number((item.emptySession / item.totalSessions * 100).toFixed(1)) : 0;
      return item;
    });

    // Sort data
    return results.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [data, location, sortColumn, sortDirection]);

  // Calculate month-on-month trends
  const trendsData = useMemo(() => {
    const trends = {} as Record<string, any>;
    processedData.forEach(item => {
      const currentMonth = new Date(item.monthYear + '-01');
      const previousMonth = new Date(currentMonth);
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const prevMonthKey = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
      const prevData = processedData.find(p => p.location === item.location && p.monthYear === prevMonthKey);
      if (prevData) {
        const key = `${item.location}-${item.monthYear}`;
        trends[key] = {
          sessionsChange: prevData.totalSessions > 0 ? Number(((item.totalSessions - prevData.totalSessions) / prevData.totalSessions * 100).toFixed(1)) : 0,
          avgChange: prevData.classAvgWithEmpty > 0 ? Number(((item.classAvgWithEmpty - prevData.classAvgWithEmpty) / prevData.classAvgWithEmpty * 100).toFixed(1)) : 0,
          revenueChange: prevData.totalPaid > 0 ? Number(((item.totalPaid - prevData.totalPaid) / prevData.totalPaid * 100).toFixed(1)) : 0,
          fillRateChange: Number((item.fillRate - prevData.fillRate).toFixed(1))
        };
      }
    });
    return trends;
  }, [processedData]);
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  const renderTrendIndicator = (value: number, showPercent = true) => {
    if (value === 0) return <Minus className="w-4 h-4 text-gray-400" />;
    const isPositive = value > 0;
    const Icon = isPositive ? ArrowUp : ArrowDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    return <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="w-3 h-3" />
        <span className="text-xs font-medium">
          {Math.abs(value)}{showPercent ? '%' : ''}
        </span>
      </div>;
  };
  const formatCurrency = (value: number) => `₹${formatNumber(value)}`;
  return <TooltipProvider>
      <Card className="overflow-hidden border-0 shadow-lg bg-white/95 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white" />
                Class Attendance Payroll Analysis
                {location && location !== 'all' && <Badge variant="secondary" className="ml-2">
                    {location}
                  </Badge>}
              </CardTitle>
              <p className="text-sm text-white/80 mt-1">
                Comprehensive month-on-month performance metrics with trend indicators
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 text-gray-800">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="class-attendance-neat-table">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                  <TableHead onClick={() => handleSort('location')} className="cursor-pointer text-xs font-semibold text-slate-100 h-10 px-4">
                    Location
                  </TableHead>
                  <TableHead onClick={() => handleSort('monthYear')} className="cursor-pointer text-xs font-semibold text-slate-100 h-10 px-4">
                    Month/Year
                  </TableHead>
                  <TableHead onClick={() => handleSort('teacherName')} className="cursor-pointer text-xs font-semibold text-slate-100 h-10 px-4">
                    Instructor
                  </TableHead>
                  <TableHead onClick={() => handleSort('totalSessions')} className="cursor-pointer text-xs font-semibold text-slate-100 h-10 px-4 text-center">
                    Sessions
                  </TableHead>
                  <TableHead onClick={() => handleSort('totalCustomers')} className="cursor-pointer text-xs font-semibold text-slate-100 h-10 px-4">
                    Checked In
                  </TableHead>
                  <TableHead onClick={() => handleSort('emptySession')} className="cursor-pointer text-xs font-semibold text-slate-100 h-10 px-4">
                    Late Cancelled
                  </TableHead>
                  <TableHead onClick={() => handleSort('totalPaid')} className="cursor-pointer text-xs font-semibold text-slate-100 h-10 px-4">
                    Paid (₹)
                  </TableHead>
                  <TableHead className="cursor-pointer text-xs font-semibold text-slate-100 h-10 px-4 text-center" onClick={() => handleSort('classAvgWithEmpty')}>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 text-white">
                        Avg w/ Empty
                        <Info className="w-3 h-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Class average including empty sessions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="cursor-pointer text-xs font-semibold text-slate-100 h-10 px-4 text-center" onClick={() => handleSort('classAvgWithoutEmpty')}>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 text-white">
                        Avg w/o Empty
                        <Info className="w-3 h-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Class average excluding empty sessions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead onClick={() => handleSort('fillRate')} className="cursor-pointer text-xs font-semibold text-slate-100 h-10 px-4">
                    Fill Rate (%)
                  </TableHead>
                  <TableHead onClick={() => handleSort('cancelRate')} className="cursor-pointer text-xs font-semibold text-slate-100 h-10 px-4">
                    Cancel Rate (%)
                  </TableHead>
                  <TableHead className="cursor-pointer text-xs font-semibold text-slate-100 h-10 px-4">
                    Trends
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedData.map((row, index) => {
                const trendKey = `${row.location}-${row.monthYear}`;
                const trends = trendsData[trendKey] || {};
                return <TableRow key={index}>
                      <TableCell className="table-cell-compact text-xs font-medium text-slate-800">
                        <div className="table-cell-nowrap min-w-[140px]">
                          {row.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs min-w-32 text-left ">
                        <Badge variant="outline" className="text-xs text-gray-800 bg-none">
                          {row.monthYear}
                        </Badge>
                      </TableCell>
                      <TableCell className="table-cell-compact text-xs text-slate-600">
                        <div className="table-cell-nowrap min-w-[100px]">
                          {row.teacherName}
                        </div>
                      </TableCell>
                      <TableCell className="table-cell-compact text-xs text-center font-medium">
                        <div className="flex flex-col items-center gap-1">
                          <span>{row.totalSessions}</span>
                          {trends.sessionsChange !== undefined && renderTrendIndicator(trends.sessionsChange)}
                        </div>
                      </TableCell>
                      <TableCell className="table-cell-compact text-xs text-center font-medium">
                        {row.totalCustomers}
                      </TableCell>
                      <TableCell className="table-cell-compact text-xs text-center">
                        <Badge variant={row.emptySession > 5 ? "destructive" : "secondary"} className="text-xs">
                          {row.emptySession}
                        </Badge>
                      </TableCell>
                      <TableCell className="table-cell-compact text-xs text-center font-medium">
                        <div className="flex flex-col items-center gap-1">
                          <span className="table-cell-nowrap">{formatCurrency(row.totalPaid)}</span>
                          {trends.revenueChange !== undefined && renderTrendIndicator(trends.revenueChange)}
                        </div>
                      </TableCell>
                      <TableCell className="table-cell-compact text-xs text-center font-medium">
                        <div className="flex flex-col items-center gap-1">
                          <span>{row.classAvgWithEmpty}</span>
                          {trends.avgChange !== undefined && renderTrendIndicator(trends.avgChange)}
                        </div>
                      </TableCell>
                      <TableCell className="table-cell-compact text-xs text-center font-medium text-green-700">
                        {row.classAvgWithoutEmpty}
                      </TableCell>
                      <TableCell className="table-cell-compact text-xs text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={row.fillRate >= 80 ? "default" : row.fillRate >= 60 ? "secondary" : "destructive"} className="text-xs">
                            {row.fillRate}%
                          </Badge>
                          {trends.fillRateChange !== undefined && renderTrendIndicator(trends.fillRateChange, false)}
                        </div>
                      </TableCell>
                      <TableCell className="table-cell-compact text-xs text-center">
                        <Badge variant={row.cancelRate <= 10 ? "default" : row.cancelRate <= 20 ? "secondary" : "destructive"} className="text-xs">
                          {row.cancelRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="table-cell-compact">
                        <div className="flex items-center justify-center gap-2">
                          <Tooltip>
                            <TooltipTrigger>
                              {trends.sessionsChange > 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : trends.sessionsChange < 0 ? <TrendingDown className="w-4 h-4 text-red-600" /> : <Minus className="w-4 h-4 text-gray-400" />}
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1 text-xs">
                                <p>Sessions: {trends.sessionsChange || 0}%</p>
                                <p>Average: {trends.avgChange || 0}%</p>
                                <p>Revenue: {trends.revenueChange || 0}%</p>
                                <p>Fill Rate: {trends.fillRateChange || 0}pp</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>;
              })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>;
};