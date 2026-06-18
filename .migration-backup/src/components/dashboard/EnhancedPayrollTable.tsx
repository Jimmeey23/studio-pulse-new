import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTableHeaderClasses } from '@/utils/colorThemes';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, User, BarChart3,
  ArrowUpDown, Filter, Download, Eye, Percent, Hash, ShrinkIcon, ExpandIcon
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/formatters';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { useTableCopyContext } from '@/hooks/useTableCopyContext';

interface EnhancedPayrollTableProps {
  data: any[];
  sessionsData?: SessionData[];
  location?: string;
}

interface PayrollData {
  trainerName: string;
  monthlyData: {
    [monthKey: string]: {
      sessions: number;
      totalPayroll: number;
      avgPerSession: number;
      hoursWorked: number;
      hourlyRate: number;
    };
  };
  totalSessions: number;
  totalPayroll: number;
  avgPerSession: number;
  totalHours: number;
  avgHourlyRate: number;
  consistency: number;
  trend: 'up' | 'down' | 'stable';
}

type SortColumn = 'trainerName' | 'totalSessions' | 'totalPayroll' | 'avgPerSession' | 'avgHourlyRate' | 'consistency';
type ViewMode = 'summary' | 'detailed' | 'hourly';

export const EnhancedPayrollTable: React.FC<EnhancedPayrollTableProps> = ({ data, sessionsData, location }) => {
  const { filters } = useGlobalFilters();
  const periodId = `${filters.dateRange.start}:${filters.dateRange.end}`;
  const [sortColumn, setSortColumn] = useState<SortColumn>('totalPayroll');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [showTopN, setShowTopN] = useState(10);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  
  // Table ref for copy functionality
  const tableRef = useRef<HTMLTableElement>(null);
  const tableId = 'enhanced-payroll-table';
  
  // Get context information for enhanced table copying
  const copyContext = useTableCopyContext();
  
  // Register with metrics tables registry
  const { registerTable, unregisterTable } = useMetricsTablesRegistry();
  
  useEffect(() => {
    if (tableRef.current) {
      const getTextContent = () => {
        if (tableRef.current) {
          return tableRef.current.innerText || '';
        }
        return '';
      };
      
      registerTable({
        id: tableId,
        getTextContent
      });
      
      return () => unregisterTable(tableId);
    }
  }, [registerTable, unregisterTable]);

  const { processedData, availableMonths } = useMemo(() => {
    if (!data || data.length === 0) {
      return { processedData: [], availableMonths: [] };
    }

    // Get all unique months from the data
    const monthsSet = new Set<string>();
    const trainerPayrollMap = new Map<string, PayrollData>();

    data.forEach(record => {
      const trainerName = record.trainerName || record.trainer || 'Unknown';
      const date = new Date(record.date || record.payrollDate || '');
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthDisplay = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      monthsSet.add(monthKey);

      if (!trainerPayrollMap.has(trainerName)) {
        trainerPayrollMap.set(trainerName, {
          trainerName,
          monthlyData: {},
          totalSessions: 0,
          totalPayroll: 0,
          avgPerSession: 0,
          totalHours: 0,
          avgHourlyRate: 0,
          consistency: 0,
          trend: 'stable'
        });
      }

      const trainerData = trainerPayrollMap.get(trainerName)!;
      
      if (!trainerData.monthlyData[monthKey]) {
        trainerData.monthlyData[monthKey] = {
          sessions: 0,
          totalPayroll: 0,
          avgPerSession: 0,
          hoursWorked: 0,
          hourlyRate: 0
        };
      }

      const sessions = record.sessions || record.classCount || 1;
      const payroll = record.totalPayroll || record.amount || record.salary || 0;
      const hours = record.hoursWorked || record.hours || sessions * 1; // Assume 1 hour per session if not provided

      trainerData.monthlyData[monthKey].sessions += sessions;
      trainerData.monthlyData[monthKey].totalPayroll += payroll;
      trainerData.monthlyData[monthKey].hoursWorked += hours;
      
      trainerData.totalSessions += sessions;
      trainerData.totalPayroll += payroll;
      trainerData.totalHours += hours;
    });

    // Calculate derived metrics for each trainer
    trainerPayrollMap.forEach((trainerData, trainerName) => {
      trainerData.avgPerSession = trainerData.totalSessions > 0 ? trainerData.totalPayroll / trainerData.totalSessions : 0;
      trainerData.avgHourlyRate = trainerData.totalHours > 0 ? trainerData.totalPayroll / trainerData.totalHours : 0;

      // Calculate monthly averages and hourly rates
      Object.keys(trainerData.monthlyData).forEach(monthKey => {
        const monthData = trainerData.monthlyData[monthKey];
        monthData.avgPerSession = monthData.sessions > 0 ? monthData.totalPayroll / monthData.sessions : 0;
        monthData.hourlyRate = monthData.hoursWorked > 0 ? monthData.totalPayroll / monthData.hoursWorked : 0;
      });

      // Calculate consistency (coefficient of variation of monthly payroll)
      const monthlyPayrolls = Object.values(trainerData.monthlyData).map(m => m.totalPayroll).filter(p => p > 0);
      if (monthlyPayrolls.length > 1) {
        const mean = monthlyPayrolls.reduce((a, b) => a + b, 0) / monthlyPayrolls.length;
        const variance = monthlyPayrolls.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyPayrolls.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? stdDev / mean : 0;
        trainerData.consistency = Math.max(0, 100 - (cv * 100)); // Higher consistency = lower coefficient of variation
      } else {
        trainerData.consistency = monthlyPayrolls.length === 1 ? 100 : 0;
      }

      // Calculate trend (comparing first half vs second half of months)
      const sortedMonths = Object.keys(trainerData.monthlyData).sort();
      if (sortedMonths.length >= 2) {
        const midPoint = Math.floor(sortedMonths.length / 2);
        const firstHalf = sortedMonths.slice(0, midPoint);
        const secondHalf = sortedMonths.slice(midPoint);
        
        const firstHalfAvg = firstHalf.reduce((sum, month) => sum + trainerData.monthlyData[month].totalPayroll, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, month) => sum + trainerData.monthlyData[month].totalPayroll, 0) / secondHalf.length;
        
        const trendPercentage = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
        
        if (trendPercentage > 10) trainerData.trend = 'up';
        else if (trendPercentage < -10) trainerData.trend = 'down';
        else trainerData.trend = 'stable';
      }
    });

    const availableMonths = Array.from(monthsSet).sort();
    const processedData = Array.from(trainerPayrollMap.values());

    return { processedData, availableMonths };
  }, [data]);

  const sortedData = useMemo(() => {
    return [...processedData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [processedData, sortColumn, sortDirection]);

  const displayData = sortedData.slice(0, showTopN);

  const displayMonths = selectedMonths.length > 0 ? 
    selectedMonths.filter(month => availableMonths.includes(month)) : 
    availableMonths.slice(-6); // Show last 6 months by default

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    return <ArrowUpDown className={`w-3 h-3 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPerformanceColor = (value: number, type: 'payroll' | 'sessions' | 'consistency') => {
    if (type === 'consistency') {
      if (value >= 80) return 'bg-green-100 text-green-800 border-green-200';
      if (value >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
      if (value >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatMonthHeader = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No payroll data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Enhanced Payroll Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">View Mode</label>
              <Select value={viewMode} onValueChange={(v: ViewMode) => setViewMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="hourly">Hourly Rates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Show Top</label>
              <Select value={String(showTopN)} onValueChange={(v) => setShowTopN(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="15">Top 15</SelectItem>
                  <SelectItem value="25">Top 25</SelectItem>
                  <SelectItem value="50">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Months to Show</label>
              <Select value="last6" onValueChange={(v) => {
                if (v === 'last6') setSelectedMonths(availableMonths.slice(-6));
                else if (v === 'last12') setSelectedMonths(availableMonths.slice(-12));
                else if (v === 'all') setSelectedMonths(availableMonths);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select months..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last6">Last 6 Months</SelectItem>
                  <SelectItem value="last12">Last 12 Months</SelectItem>
                  <SelectItem value="all">All Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Actions</label>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Export Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">
              {formatNumber(processedData.length)}
            </div>
            <div className="text-sm text-blue-600">Active Trainers</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(processedData.reduce((sum, t) => sum + t.totalPayroll, 0))}
            </div>
            <div className="text-sm text-green-600">Total Payroll</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">
              {formatNumber(processedData.reduce((sum, t) => sum + t.totalSessions, 0))}
            </div>
            <div className="text-sm text-purple-600">Total Sessions</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-700">
              {formatCurrency(processedData.reduce((sum, t) => sum + t.avgPerSession, 0) / Math.max(processedData.length, 1))}
            </div>
            <div className="text-sm text-orange-600">Avg Per Session</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Payroll Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-t-lg">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Payroll Details
            </CardTitle>
            <div className="flex items-center gap-2">
              <CopyTableButton 
                tableRef={tableRef} 
                contextInfo={{
                  selectedMetric: sortColumn,
                  dateRange: copyContext.dateRange,
                  filters: copyContext.filters,
                  additionalInfo: {
                    viewMode: viewMode,
                    sortColumn: sortColumn,
                    sortDirection: sortDirection,
                    showTopN: showTopN,
                    location: location,
                    selectedMonths: selectedMonths
                  }
                }}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsTableCollapsed(!isTableCollapsed)}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {isTableCollapsed ? <ExpandIcon className="w-4 h-4" /> : <ShrinkIcon className="w-4 h-4" />}
                {isTableCollapsed ? 'Expand' : 'Collapse'}
              </Button>
            </div>
          </div>
        </CardHeader>
        {!isTableCollapsed && (
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[800px] border rounded-b-lg">
            <Table ref={tableRef} id={tableId}>
              <TableHeader className={`sticky top-0 z-10 border-b-2 ${getTableHeaderClasses('analytics')}`}>
                <TableRow className="hover:bg-transparent">
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 whitespace-nowrap min-w-48 sticky left-0 bg-white z-20"
                    onClick={() => handleSort('trainerName')}
                  >
                    <div className="flex items-center gap-2">
                      Trainer {getSortIcon('trainerName')}
                    </div>
                  </TableHead>
                  
                  {displayMonths.map(monthKey => (
                    <TableHead key={monthKey} className="text-center font-bold whitespace-nowrap min-w-32">
                      <div className="space-y-1">
                        <div>{formatMonthHeader(monthKey)}</div>
                        <div className="text-xs text-gray-500 font-normal">
                          {viewMode === 'hourly' ? 'Rate' : viewMode === 'detailed' ? 'Pay/Sessions' : 'Total'}
                        </div>
                      </div>
                    </TableHead>
                  ))}
                  
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap min-w-24"
                    onClick={() => handleSort('totalSessions')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Hash className="w-3 h-3" />
                      Sessions {getSortIcon('totalSessions')}
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap min-w-32"
                    onClick={() => handleSort('totalPayroll')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Total {getSortIcon('totalPayroll')}
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap min-w-24"
                    onClick={() => handleSort('avgPerSession')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Avg/Session {getSortIcon('avgPerSession')}
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap min-w-24"
                    onClick={() => handleSort('consistency')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Percent className="w-3 h-3" />
                      Consistency {getSortIcon('consistency')}
                    </div>
                  </TableHead>
                  
                  <TableHead className="text-center font-bold whitespace-nowrap min-w-20">
                    Trend
                  </TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {displayData.map((trainer, index) => (
                  <TableRow key={trainer.trainerName} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium whitespace-nowrap sticky left-0 bg-white z-10 border-r">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-800">{trainer.trainerName}</div>
                        <div className="text-xs text-gray-500">Rank #{index + 1}</div>
                      </div>
                    </TableCell>
                    
                    {displayMonths.map(monthKey => {
                      const monthData = trainer.monthlyData[monthKey];
                      if (!monthData || monthData.totalPayroll === 0) {
                        return (
                          <TableCell key={monthKey} className="text-center text-gray-400">
                            -
                          </TableCell>
                        );
                      }
                      
                      return (
                        <TableCell key={monthKey} className="text-center whitespace-nowrap">
                          {viewMode === 'summary' && (
                            <div className="space-y-1">
                              <div className="font-semibold">
                                {formatCurrency(monthData.totalPayroll)}
                              </div>
                            </div>
                          )}
                          
                          {viewMode === 'detailed' && (
                            <div className="space-y-1">
                              <div className="font-semibold">
                                {formatCurrency(monthData.totalPayroll)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatNumber(monthData.sessions)} sessions
                              </div>
                              <div className="text-xs text-gray-600">
                                {formatCurrency(monthData.avgPerSession)}/session
                              </div>
                            </div>
                          )}
                          
                          {viewMode === 'hourly' && (
                            <div className="space-y-1">
                              <div className="font-semibold">
                                {formatCurrency(monthData.hourlyRate)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatNumber(monthData.hoursWorked)}h
                              </div>
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                    
                    <TableCell className="text-center">
                      <div className="font-semibold text-gray-800">
                        {formatNumber(trainer.totalSessions)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="font-semibold text-gray-800">
                        {formatCurrency(trainer.totalPayroll)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="font-semibold text-gray-800">
                        {formatCurrency(trainer.avgPerSession)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Badge className={`px-2 py-1 text-xs font-semibold ${getPerformanceColor(trainer.consistency, 'consistency')}`}>
                        {formatPercentage(trainer.consistency)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {getTrendIcon(trainer.trend)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        )}
      </Card>

      {/* Footer Info */}
      <div className="text-sm text-gray-600 text-center">
        Showing {Math.min(showTopN, processedData.length)} of {processedData.length} trainers • 
        {displayMonths.length} months displayed •
        Data sorted by {sortColumn} ({sortDirection === 'desc' ? 'highest first' : 'lowest first'})
      </div>
    </div>
  );
};