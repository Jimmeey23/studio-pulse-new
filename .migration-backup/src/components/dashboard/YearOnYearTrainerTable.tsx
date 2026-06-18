
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, ChevronDown, ChevronRight, Info, ShrinkIcon, ExpandIcon } from 'lucide-react';
import { TrainerMetricType } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { TrainerDrillDownModal } from './TrainerDrillDownModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

interface YearOnYearTrainerTableProps {
  data: Record<string, Record<string, number>>;
  months: string[];
  trainers: string[];
  defaultMetric: TrainerMetricType;
}

export const YearOnYearTrainerTable = ({ 
  data, 
  months, 
  trainers, 
  defaultMetric 
}: YearOnYearTrainerTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  
  // Table ref for copy functionality
  const tableRef = useRef<HTMLTableElement>(null);
  const tableId = 'year-on-year-trainer-table';
  
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

  const formatValue = (value: number, metric: TrainerMetricType) => {
    switch (metric) {
      case 'totalPaid':
      case 'cycleRevenue':
      case 'barreRevenue':
        return formatCurrency(value);
      case 'retention':
      case 'conversion':
        return `${value.toFixed(1)}%`;
      case 'classAverage':
      case 'classAverageInclEmpty':
      case 'classAverageExclEmpty':
        return value.toFixed(1);
      default:
        return formatNumber(value);
    }
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getMetricTitle = (metric: TrainerMetricType) => {
    switch (metric) {
      case 'totalSessions':
        return 'Total Sessions';
      case 'totalCustomers':
        return 'Total Members';
      case 'totalPaid':
        return 'Total Revenue';
      case 'classAverage':
      case 'classAverageExclEmpty':
        return 'Class Average (Excl Empty)';
      case 'classAverageInclEmpty':
        return 'Class Average (Incl Empty)';
      case 'retention':
        return 'Retention Rate';
      case 'conversion':
        return 'Conversion Rate';
      case 'emptySessions':
        return 'Empty Sessions';
      case 'nonEmptySessions':
        return 'Non-Empty Sessions';
      case 'newMembers':
        return 'New Members';
      case 'retainedMembers':
        return 'Retained Members';
      case 'convertedMembers':
        return 'Converted Members';
      case 'cycleRevenue':
        return 'Cycle Revenue';
      case 'barreRevenue':
        return 'Barre Revenue';
      default:
        return 'Metric';
    }
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
    const trainerData = {
      name: trainer,
      months: months.reduce((acc, month) => {
        acc[month] = data[trainer]?.[month] || 0;
        return acc;
      }, {} as Record<string, number>)
    };
    setSelectedTrainer(trainer);
    setDrillDownData(trainerData);
  };

  // Process months for year-on-year comparison - include all available months
  const processMonthsForYoY = () => {
    const monthsByYear: Record<string, Record<string, string>> = {};
    
    months.forEach(month => {
      const [monthName, year] = month.split('-');
      if (!monthsByYear[year]) {
        monthsByYear[year] = {};
      }
      monthsByYear[year][monthName] = month;
    });

    const years = Object.keys(monthsByYear).sort().reverse();
    
    // Get all unique month names present in data
    const allMonthNames = Array.from(new Set(months.map(month => month.split('-')[0])));
    
    // Sort months chronologically (most recent first)
    const monthOrder = ['Dec', 'Nov', 'Oct', 'Sep', 'Aug', 'Jul', 'Jun', 'May', 'Apr', 'Mar', 'Feb', 'Jan'];
    const sortedMonthNames = monthOrder.filter(month => allMonthNames.includes(month));
    
    // Create alternating structure with all available months
    const alternatingColumns: Array<{monthName: string, year: string, fullMonth: string}> = [];
    
    sortedMonthNames.forEach(monthName => {
      years.forEach(year => {
        const fullMonth = monthsByYear[year]?.[monthName];
        if (fullMonth) {
          alternatingColumns.push({
            monthName,
            year,
            fullMonth
          });
        }
      });
    });

    return { alternatingColumns, years, uniqueMonthNames: sortedMonthNames };
  };

  const { alternatingColumns, years } = processMonthsForYoY();

  const sortedTrainers = [...trainers].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    }
    // Sort by latest month value
    const latestColumn = alternatingColumns[0];
    const aValue = data[a]?.[latestColumn?.fullMonth] || 0;
    const bValue = data[b]?.[latestColumn?.fullMonth] || 0;
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Calculate totals for each column
  const columnTotals = alternatingColumns.reduce((acc, col) => {
    acc[col.fullMonth] = trainers.reduce((sum, trainer) => sum + (data[trainer]?.[col.fullMonth] || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  // Calculate grand total
  const grandTotal = Object.values(columnTotals).reduce((sum, val) => sum + val, 0);

  if (!trainers.length || years.length < 2) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Year-on-Year {getMetricTitle(defaultMetric)} Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-600">Insufficient data for year-on-year comparison (need at least 2 years)</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-t-lg">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Year-on-Year {getMetricTitle(defaultMetric)} Comparison
            </CardTitle>
            <div className="flex items-center gap-2">
              <CopyTableButton tableRef={tableRef} />
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
        <CardContent>
          <div className="overflow-x-auto">
            <TooltipProvider>
              <Table ref={tableRef} id={tableId}>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white border-b-2 border-slate-600">
                    <TableHead className="font-bold text-white sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-10 min-w-[200px] border-r border-slate-600">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSortBy('name');
                          setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="font-bold text-white p-0 h-auto hover:text-slate-200"
                      >
                        Trainer
                        {sortBy === 'name' && (
                          sortOrder === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                        )}
                      </Button>
                    </TableHead>
                    {alternatingColumns.map((col) => (
                      <TableHead key={`${col.monthName}-${col.year}`} className="text-center font-bold text-white min-w-[120px] border-l border-slate-600">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center cursor-help">
                              <div className="font-bold">{col.monthName}</div>
                              <div className={cn(
                                "text-xs font-medium",
                                col.year === years[0] ? 'text-blue-300' : 'text-purple-300'
                              )}>
                                {col.year}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Hover over cells to see YoY growth</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold text-white min-w-[100px] border-l border-slate-600">YoY Change</TableHead>
                    <TableHead className="text-center font-bold text-white min-w-[100px] border-l border-slate-600">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Totals Row */}
                  <TableRow className="bg-slate-100 border-b-2 font-bold">
                    <TableCell className="font-bold text-slate-800 sticky left-0 bg-slate-100 z-10 border-r border-slate-300">
                      TOTAL
                    </TableCell>
                    {alternatingColumns.map((col) => (
                      <TableCell key={`total-${col.monthName}-${col.year}`} className="text-center font-bold text-blue-800">
                        {formatValue(columnTotals[col.fullMonth] || 0, defaultMetric)}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {years.length >= 2 ? 'Total YoY' : 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold text-blue-800">
                      {formatValue(grandTotal, defaultMetric)}
                    </TableCell>
                  </TableRow>

                  {/* Trainer Rows */}
                  {sortedTrainers.map((trainer) => {
                    const trainerData = data[trainer] || {};
                    const isExpanded = expandedRows.has(trainer);
                    
                    // Calculate YoY change (comparing same months across years)
                    const currentYearData = alternatingColumns.filter(col => col.year === years[0]);
                    const previousYearData = alternatingColumns.filter(col => col.year === years[1]);
                    
                    let yoyChange = 0;
                    let trainerTotal = 0;
                    
                    if (currentYearData.length > 0 && previousYearData.length > 0) {
                      const currentTotal = currentYearData.reduce((sum, col) => sum + (trainerData[col.fullMonth] || 0), 0);
                      const previousTotal = previousYearData.reduce((sum, col) => sum + (trainerData[col.fullMonth] || 0), 0);
                      yoyChange = getChangePercentage(currentTotal, previousTotal);
                      trainerTotal = alternatingColumns.reduce((sum, col) => sum + (trainerData[col.fullMonth] || 0), 0);
                    }
                    
                    return (
                      <React.Fragment key={trainer}>
                        <TableRow 
                          className="hover:bg-slate-50/50 transition-colors border-b cursor-pointer" 
                          onClick={() => handleRowClick(trainer)}
                        >
                          <TableCell className="font-medium text-slate-800 sticky left-0 bg-white z-10 border-r">
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
                              {trainer}
                            </div>
                          </TableCell>
                          {alternatingColumns.map((col) => {
                            const currentValue = trainerData[col.fullMonth] || 0;
                            const sameMonthPreviousYear = alternatingColumns.find(
                              c => c.monthName === col.monthName && c.year !== col.year
                            );
                            const previousYearValue = sameMonthPreviousYear ? trainerData[sameMonthPreviousYear.fullMonth] || 0 : 0;
                            const monthYoyChange = getChangePercentage(currentValue, previousYearValue);
                            
                            return (
                              <TableCell key={`${trainer}-${col.monthName}-${col.year}`} className="text-center font-mono">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      {formatValue(currentValue, defaultMetric)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-center">
                                      <p className="font-medium">{col.monthName} {col.year}</p>
                                      <p>Value: {formatValue(currentValue, defaultMetric)}</p>
                                      {sameMonthPreviousYear && (
                                        <>
                                          <p>Previous Year: {formatValue(previousYearValue, defaultMetric)}</p>
                                          <p className={cn(
                                            "font-medium",
                                            monthYoyChange >= 0 ? "text-green-600" : "text-red-600"
                                          )}>
                                            YoY: {monthYoyChange >= 0 ? '+' : ''}{monthYoyChange.toFixed(1)}%
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <Badge
                              variant={yoyChange >= 0 ? "default" : "destructive"}
                              className={cn(
                                "flex items-center gap-1 w-fit mx-auto",
                                yoyChange >= 0 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              )}
                            >
                              {yoyChange >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {Math.abs(yoyChange).toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-700">
                            {formatValue(trainerTotal, defaultMetric)}
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded Row Details */}
                        {isExpanded && (
                          <TableRow className="bg-slate-50">
                            <TableCell colSpan={alternatingColumns.length + 3} className="p-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                {years.map(year => {
                                  const yearData = alternatingColumns.filter(col => col.year === year);
                                  const yearTotal = yearData.reduce((sum, col) => sum + (trainerData[col.fullMonth] || 0), 0);
                                  const yearAverage = yearTotal / Math.max(yearData.length, 1);
                                  const yearBest = Math.max(...yearData.map(col => trainerData[col.fullMonth] || 0));
                                  
                                  return (
                                    <div key={year} className="bg-white p-3 rounded-lg shadow-sm border">
                                      <p className="text-slate-600 text-xs font-medium">{year} Performance</p>
                                      <p className={cn(
                                        "font-bold text-lg",
                                        year === years[0] ? "text-blue-600" : "text-purple-600"
                                      )}>
                                        {formatValue(yearTotal, defaultMetric)}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        Avg: {formatValue(yearAverage, defaultMetric)}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        Best: {formatValue(yearBest, defaultMetric)}
                                      </p>
                                    </div>
                                  );
                                })}
                                <div className="bg-white p-3 rounded-lg shadow-sm border">
                                  <p className="text-slate-600 text-xs font-medium">YoY Growth</p>
                                  <p className={cn(
                                    "font-bold text-lg",
                                    yoyChange >= 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {years[0]} vs {years[1]}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm border">
                                  <p className="text-slate-600 text-xs font-medium">Overall Trend</p>
                                  <p className="font-bold text-slate-800 text-lg">
                                    {yoyChange >= 10 ? 'Excellent' : yoyChange >= 0 ? 'Growing' : yoyChange >= -10 ? 'Declining' : 'Concerning'}
                                  </p>
                                  <p className="text-xs text-slate-500">Performance Rating</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
        </CardContent>
        )}
      </Card>

      {/* Drill Down Modal */}
      {selectedTrainer && (
        <TrainerDrillDownModal
          isOpen={!!selectedTrainer}
          onClose={() => {
            setSelectedTrainer(null);
            setDrillDownData(null);
          }}
          trainerName={selectedTrainer}
          trainerData={drillDownData}
        />
      )}
    </>
  );
};
