import React, { useMemo, useState } from 'react';
import { ModernTableWrapper } from './ModernTableWrapper';
import { ProcessedTrainerData } from './TrainerDataProcessor';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrainerNameCell } from '@/components/ui/TrainerAvatar';
import { cn } from '@/lib/utils';
interface TrainerYearOnYearTableProps {
  data: ProcessedTrainerData[];
  onRowClick?: (trainer: string, data: any) => void;
}
export const TrainerYearOnYearTable: React.FC<TrainerYearOnYearTableProps> = ({
  data,
  onRowClick
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'revenueGrowth',
    direction: 'desc'
  });
  const yearOnYearData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Group data by trainer and year
    const trainerStats = data.reduce((acc, record) => {
      const label = record.monthLabel || record.monthYear || '';
      let yearNum = NaN;
      if (record.monthKey && record.monthKey.includes('-')) {
        yearNum = parseInt(record.monthKey.split('-')[0]);
      } else {
        const parts = label.replace('-', ' ').split(' ').filter(Boolean);
        yearNum = parseInt(parts[1]);
      }
      const trainerKey = record.trainerName;
      if (!isNaN(yearNum) && (yearNum === currentYear || yearNum === previousYear)) {
        if (!acc[trainerKey]) {
          acc[trainerKey] = {
            trainerName: record.trainerName,
            location: record.location,
            currentYear: {
              sessions: 0,
              revenue: 0,
              customers: 0,
              monthsActive: 0
            },
            previousYear: {
              sessions: 0,
              revenue: 0,
              customers: 0,
              monthsActive: 0
            }
          };
        }
        const yearData = yearNum === currentYear ? acc[trainerKey].currentYear : acc[trainerKey].previousYear;
        yearData.sessions += record.totalSessions;
        yearData.revenue += record.totalPaid;
        yearData.customers += record.totalCustomers;
        yearData.monthsActive += 1;
      }
      return acc;
    }, {} as Record<string, any>);
  return Object.values(trainerStats).map((trainer: any) => {
      const currentAvgClassSize = trainer.currentYear.sessions > 0 ? trainer.currentYear.customers / trainer.currentYear.sessions : 0;
      const previousAvgClassSize = trainer.previousYear.sessions > 0 ? trainer.previousYear.customers / trainer.previousYear.sessions : 0;
      const currentRevenuePerSession = trainer.currentYear.sessions > 0 ? trainer.currentYear.revenue / trainer.currentYear.sessions : 0;
      const previousRevenuePerSession = trainer.previousYear.sessions > 0 ? trainer.previousYear.revenue / trainer.previousYear.sessions : 0;
      return {
        trainerName: trainer.trainerName,
        location: trainer.location,
        currentSessions: trainer.currentYear.sessions,
        previousSessions: trainer.previousYear.sessions,
        sessionsGrowth: trainer.previousYear.sessions > 0 ? (trainer.currentYear.sessions - trainer.previousYear.sessions) / trainer.previousYear.sessions * 100 : 0,
        currentRevenue: trainer.currentYear.revenue,
        previousRevenue: trainer.previousYear.revenue,
        revenueGrowth: trainer.previousYear.revenue > 0 ? (trainer.currentYear.revenue - trainer.previousYear.revenue) / trainer.previousYear.revenue * 100 : 0,
        currentCustomers: trainer.currentYear.customers,
        previousCustomers: trainer.previousYear.customers,
        customersGrowth: trainer.previousYear.customers > 0 ? (trainer.currentYear.customers - trainer.previousYear.customers) / trainer.previousYear.customers * 100 : 0,
        currentAvgClassSize,
        previousAvgClassSize,
        classSizeGrowth: previousAvgClassSize > 0 ? (currentAvgClassSize - previousAvgClassSize) / previousAvgClassSize * 100 : 0,
        currentRevenuePerSession,
        previousRevenuePerSession,
        revenuePerSessionGrowth: previousRevenuePerSession > 0 ? (currentRevenuePerSession - previousRevenuePerSession) / previousRevenuePerSession * 100 : 0,
        currentMonthsActive: trainer.currentYear.monthsActive,
        previousMonthsActive: trainer.previousYear.monthsActive
      };
    }).filter(trainer => trainer.currentSessions > 0 || trainer.previousSessions > 0).sort((a, b) => b.revenueGrowth - a.revenueGrowth);
  }, [data]);

  const sortedYoY = useMemo(() => {
    const rows = [...yearOnYearData];
    const key = sortConfig.key as keyof (typeof rows)[number];
    return rows.sort((a: any, b: any) => {
      const av = a[key] ?? 0;
      const bv = b[key] ?? 0;
      if (typeof av === 'string' || typeof bv === 'string') {
        return sortConfig.direction === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      }
      return sortConfig.direction === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [yearOnYearData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };
  const handleRowClick = (rowData: any) => {
    if (onRowClick) {
      onRowClick(rowData.trainerName, {
        ...rowData,
        monthYear: rowData.monthYear || '',
        location: rowData.location || '',
        type: 'year-on-year-comparison'
      });
    }
  };
  const columns = [{
    key: 'trainerName' as const,
    header: (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">Trainer</TooltipTrigger>
          <TooltipContent>Trainer name</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    className: 'min-w-[240px]',
    sortable: true,
    render: (value: string, row: any) => (
      <div className="flex items-center gap-2 min-h-6 overflow-hidden">
        <TrainerNameCell name={value} className="text-nowrap" />
        <span className="truncate text-xs text-slate-500">• {row.location}</span>
      </div>
    )
  }, {
    key: 'currentSessions' as const,
    header: (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">{`${new Date().getFullYear()} Sessions`}</TooltipTrigger>
          <TooltipContent>Total sessions conducted this year</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    align: 'center' as const,
    sortable: true,
    render: (value: number) => <span className="font-medium text-slate-800 text-sm leading-none">{formatNumber(value)}</span>
  }, {
    key: 'previousSessions' as const,
    header: (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">{`${new Date().getFullYear() - 1} Sessions`}</TooltipTrigger>
          <TooltipContent>Total sessions conducted last year</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    align: 'center' as const,
    sortable: true,
    render: (value: number) => <span className="font-medium text-slate-800 text-sm leading-none">{formatNumber(value)}</span>
  }, {
    key: 'sessionsGrowth' as const,
    header: (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">Sessions Growth</TooltipTrigger>
          <TooltipContent>Year-over-year change in sessions</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    align: 'center' as const,
    sortable: true,
    render: (value: number) => <div className="flex items-center justify-center gap-1 leading-none">
          {value > 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> : value < 0 ? <TrendingDown className="w-3 h-3 text-red-500" /> : null}
      <span className={`font-semibold text-sm ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-slate-600'}`}>
            {value.toFixed(1)}%
          </span>
        </div>
  }, {
    key: 'currentRevenue' as const,
    header: (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">{`${new Date().getFullYear()} Revenue`}</TooltipTrigger>
          <TooltipContent>Total revenue generated this year</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    align: 'center' as const,
    sortable: true,
    render: (value: number) => <span className="font-medium text-slate-800 text-sm leading-none">{formatCurrency(value)}</span>
  }, {
    key: 'previousRevenue' as const,
    header: (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">{`${new Date().getFullYear() - 1} Revenue`}</TooltipTrigger>
          <TooltipContent>Total revenue generated last year</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    align: 'center' as const,
    sortable: true,
    render: (value: number) => <span className="font-medium text-slate-800 text-sm leading-none">{formatCurrency(value)}</span>
  }, {
    key: 'revenueGrowth' as const,
    header: (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">Revenue Growth</TooltipTrigger>
          <TooltipContent>Year-over-year change in revenue</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    align: 'center' as const,
    sortable: true,
    render: (value: number) => <div className="flex items-center justify-center gap-1 leading-none">
          {value > 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> : value < 0 ? <TrendingDown className="w-3 h-3 text-red-500" /> : null}
      <span className={`font-semibold text-sm ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-slate-600'}`}>
            {value.toFixed(1)}%
          </span>
        </div>
  }, {
    key: 'currentAvgClassSize' as const,
    header: (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">{`${new Date().getFullYear()} Avg Size`}</TooltipTrigger>
          <TooltipContent>Average customers per session this year</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    align: 'center' as const,
    sortable: true,
    render: (value: number) => <span className="font-medium text-slate-800 text-sm leading-none">{value.toFixed(1)}</span>
  }, {
    key: 'previousAvgClassSize' as const,
    header: (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">{`${new Date().getFullYear() - 1} Avg Size`}</TooltipTrigger>
          <TooltipContent>Average customers per session last year</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    align: 'center' as const,
    sortable: true,
    render: (value: number) => <span className="font-medium text-slate-800 text-sm leading-none">{value.toFixed(1)}</span>
  }, {
    key: 'classSizeGrowth' as const,
    header: (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">Size Growth</TooltipTrigger>
          <TooltipContent>Year-over-year change in average class size</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    align: 'center' as const,
    sortable: true,
    render: (value: number) => <div className="flex items-center justify-center gap-1 leading-none">
          {value > 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> : value < 0 ? <TrendingDown className="w-3 h-3 text-red-500" /> : null}
      <span className={`font-semibold text-sm ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-slate-600'}`}>
            {value.toFixed(1)}%
          </span>
        </div>
  }];

  // Calculate totals
  const totals = {
    trainerName: 'TOTAL',
    location: 'All Locations',
    currentSessions: yearOnYearData.reduce((sum, row) => sum + row.currentSessions, 0),
    previousSessions: yearOnYearData.reduce((sum, row) => sum + row.previousSessions, 0),
    sessionsGrowth: 0,
    currentRevenue: yearOnYearData.reduce((sum, row) => sum + row.currentRevenue, 0),
    previousRevenue: yearOnYearData.reduce((sum, row) => sum + row.previousRevenue, 0),
    revenueGrowth: 0,
    currentCustomers: yearOnYearData.reduce((sum, row) => sum + row.currentCustomers, 0),
    previousCustomers: yearOnYearData.reduce((sum, row) => sum + row.previousCustomers, 0),
    customersGrowth: 0,
    currentAvgClassSize: 0,
    previousAvgClassSize: 0,
    classSizeGrowth: 0
  };
  totals.sessionsGrowth = totals.previousSessions > 0 ? (totals.currentSessions - totals.previousSessions) / totals.previousSessions * 100 : 0;
  totals.revenueGrowth = totals.previousRevenue > 0 ? (totals.currentRevenue - totals.previousRevenue) / totals.previousRevenue * 100 : 0;
  totals.customersGrowth = totals.previousCustomers > 0 ? (totals.currentCustomers - totals.previousCustomers) / totals.previousCustomers * 100 : 0;
  totals.currentAvgClassSize = totals.currentSessions > 0 ? totals.currentCustomers / totals.currentSessions : 0;
  totals.previousAvgClassSize = totals.previousSessions > 0 ? totals.previousCustomers / totals.previousSessions : 0;
  totals.classSizeGrowth = totals.previousAvgClassSize > 0 ? (totals.currentAvgClassSize - totals.previousAvgClassSize) / totals.previousAvgClassSize * 100 : 0;
  return (
    <ModernTableWrapper
      title="Trainer Year-on-Year Performance Comparison"
      description={`Performance comparison for ${sortedYoY.length} trainers: ${new Date().getFullYear()} vs ${new Date().getFullYear() - 1}`}
      icon={<BarChart3 className="w-5 h-5" />}
      totalItems={sortedYoY.length}
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table data-table="trainer-year-on-year" data-table-name="Trainer Year-on-Year Performance Comparison" className="w-full">
            <thead className="sticky top-0 z-30 text-white">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    className={cn(`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                      column.className || ''
                    } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`,
                      index === 0
                        ? 'sticky left-0 z-40 border-r border-white/20 bg-gradient-to-r from-slate-800 to-slate-900 hover:bg-slate-800'
                        : 'border-l border-white/20 bg-slate-900 hover:bg-slate-800'
                    )}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                    style={{ height: '35px', maxHeight: '35px' }}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {sortConfig.key === column.key && (
                        sortConfig.direction === 'asc' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedYoY.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 bg-white cursor-pointer transition-all duration-200 hover:bg-slate-50"
                  onClick={() => handleRowClick(row)}
                  style={{ height: '35px', maxHeight: '35px' }}
                >
                  {columns.map((column, columnIndex) => (
                    <td
                      key={column.key}
                      className={cn(`px-4 py-2 text-sm whitespace-nowrap ${
                        column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                      }`, columnIndex === 0 ? 'sticky left-0 z-20 border-r border-gray-200 bg-white hover:bg-slate-50' : 'border-l border-gray-200')}
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-400">
                <td className="sticky left-0 z-30 border-r border-slate-400 bg-slate-800 px-4 py-2 text-sm font-bold text-white">TOTALS</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{formatNumber(totals.currentSessions)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{formatNumber(totals.previousSessions)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totals.sessionsGrowth.toFixed(1)}%</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{formatCurrency(totals.currentRevenue)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{formatCurrency(totals.previousRevenue)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totals.revenueGrowth.toFixed(1)}%</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totals.currentAvgClassSize.toFixed(1)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totals.previousAvgClassSize.toFixed(1)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totals.classSizeGrowth.toFixed(1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </ModernTableWrapper>
  );
};
