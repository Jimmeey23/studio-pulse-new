import React, { useState, useMemo } from 'react';
import { ModernTableWrapper } from './ModernTableWrapper';
import { ProcessedTrainerData } from './TrainerDataProcessor';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Users, Activity, Target, TrendingUp, TrendingDown, UserCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrainerNameCell } from '@/components/ui/TrainerAvatar';
import { cn } from '@/lib/utils';

interface TrainerPerformanceDetailTableProps {
  data: ProcessedTrainerData[];
  onRowClick?: (trainer: string, data: any) => void;
}

export const TrainerPerformanceDetailTable: React.FC<TrainerPerformanceDetailTableProps> = ({ 
  data, 
  onRowClick 
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'totalRevenue',
    direction: 'desc'
  });

  const processedTableData = useMemo(() => {
    // Aggregate data by trainer across all months
    const trainerStats = data.reduce((acc, record) => {
      const key = record.trainerName;
      
      if (!acc[key]) {
        acc[key] = {
          trainerName: record.trainerName,
          location: record.location,
          totalSessions: 0,
          totalCustomers: 0,
          totalRevenue: 0,
          cycleSessions: 0,
          barreSessions: 0,
          strengthSessions: 0,
          cycleRevenue: 0,
          barreRevenue: 0,
          strengthRevenue: 0,
          avgClassSize: 0,
          fillRate: 0,
          utilizationRate: 0,
          conversionRate: 0,
          retentionRate: 0,
          monthsActive: 0,
          revenuePerSession: 0,
          revenuePerCustomer: 0,
          consistencyScore: 0,
          performanceRating: 'Excellent' as const,
          topFormat: 'Cycle' as const,
          growthTrend: 0
        };
      }

      acc[key].totalSessions += record.totalSessions;
      acc[key].totalCustomers += record.totalCustomers;
      acc[key].totalRevenue += record.totalPaid;
      acc[key].cycleSessions += record.cycleSessions;
      acc[key].barreSessions += record.barreSessions;
      acc[key].strengthSessions += record.strengthSessions;
      acc[key].cycleRevenue += record.cycleRevenue;
      acc[key].barreRevenue += record.barreRevenue;
      acc[key].strengthRevenue += record.strengthRevenue;
      acc[key].monthsActive += 1;

      return acc;
    }, {} as Record<string, any>);

    // Calculate derived metrics
    return Object.values(trainerStats).map((trainer: any) => {
      trainer.avgClassSize = trainer.totalSessions > 0 ? trainer.totalCustomers / trainer.totalSessions : 0;
      trainer.revenuePerSession = trainer.totalSessions > 0 ? trainer.totalRevenue / trainer.totalSessions : 0;
      trainer.revenuePerCustomer = trainer.totalCustomers > 0 ? trainer.totalRevenue / trainer.totalCustomers : 0;

      // Compute fill rate and utilization using underlying records by recomputing from 'data'
      const records = data.filter(r => r.trainerName === trainer.trainerName);
      const totalSessions = records.reduce((s, r) => s + (r.totalSessions || 0), 0);
      const nonEmptySessions = records.reduce((s, r) => s + (r.nonEmptySessions || 0), 0);
      const totalCustomers = records.reduce((s, r) => s + (r.totalCustomers || 0), 0);
      const assumedCapacityPerSession = 20; // keep consistent with processor
      const capacity = totalSessions * assumedCapacityPerSession;
      trainer.fillRate = capacity > 0 ? (totalCustomers / capacity) * 100 : 0;
      trainer.utilizationRate = totalSessions > 0 ? (nonEmptySessions / totalSessions) * 100 : 0;

      // Use weighted conversion/retention rates across months
      const totalNew = records.reduce((s, r) => s + (r.newMembers || 0), 0);
      const totalConverted = records.reduce((s, r) => s + (r.convertedMembers || 0), 0);
      const totalRetained = records.reduce((s, r) => s + (r.retainedMembers || 0), 0);
      trainer.conversionRate = totalNew > 0 ? (totalConverted / totalNew) * 100 : 0;
      trainer.retentionRate = totalNew > 0 ? (totalRetained / totalNew) * 100 : 0;

      // Consistency score based on variability in monthly totals for sessions
      const monthlySessions = records.map(r => r.totalSessions || 0);
      if (monthlySessions.length > 1) {
        const avg = monthlySessions.reduce((s, v) => s + v, 0) / monthlySessions.length;
        const variance = monthlySessions.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / monthlySessions.length;
        const stddev = Math.sqrt(variance);
        trainer.consistencyScore = avg > 0 ? Math.max(0, 100 - (stddev / avg) * 100) : 100;
      } else {
        trainer.consistencyScore = 100;
      }

      // Growth trend: last month vs previous month on sessions
      const sortedRecs = [...records].sort((a, b) => (a.monthKey || '').localeCompare(b.monthKey || ''));
      const last = sortedRecs[sortedRecs.length - 1]?.totalSessions || 0;
      const prev = sortedRecs[sortedRecs.length - 2]?.totalSessions || 0;
      trainer.growthTrend = prev > 0 ? ((last - prev) / prev) * 100 : (last > 0 ? 100 : 0);

      // Determine top format
      const formatRevenues = {
        'Cycle': trainer.cycleRevenue,
        'Barre': trainer.barreRevenue,
        'Strength': trainer.strengthRevenue
      };
      trainer.topFormat = Object.entries(formatRevenues).reduce((a, b) => 
        formatRevenues[a[0]] > formatRevenues[b[0]] ? a : b
      )[0];

  // Performance rating (simple revenue thresholds)
      if (trainer.totalRevenue >= 50000) trainer.performanceRating = 'Excellent';
      else if (trainer.totalRevenue >= 30000) trainer.performanceRating = 'Good';
      else if (trainer.totalRevenue >= 15000) trainer.performanceRating = 'Average';
      else trainer.performanceRating = 'Needs Improvement';

      return trainer;
    }).sort((a, b) => {
      if (sortConfig.key === 'trainerName') {
        return sortConfig.direction === 'asc' 
          ? a.trainerName.localeCompare(b.trainerName)
          : b.trainerName.localeCompare(a.trainerName);
      }
      const aValue = a[sortConfig.key] || 0;
      const bValue = b[sortConfig.key] || 0;
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [data, sortConfig]);

  const handleRowClick = (rowData: any) => {
    if (onRowClick) {
      onRowClick(rowData.trainerName, {
        ...rowData,
        monthYear: rowData.monthYear || rowData.month || '',
        location: rowData.location || '',
        type: 'trainer-performance'
      });
    }
  };

  const columns = [
    {
      key: 'trainerName' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Trainer</TooltipTrigger>
            <TooltipContent>Trainer name and location</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      className: 'min-w-[180px]',
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2 min-h-6 overflow-hidden">
          <TrainerNameCell name={value} className="text-nowrap" />
          <span className="truncate text-xs text-slate-500">• {row.location}</span>
        </div>
      )
    },
    {
      key: 'totalSessions' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Sessions</TooltipTrigger>
            <TooltipContent>Total sessions across selected period</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => <span className="text-sm font-medium leading-none text-slate-800">{formatNumber(value)}</span>
    },
    {
      key: 'totalCustomers' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Customers</TooltipTrigger>
            <TooltipContent>Total check-ins across sessions</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => <span className="text-sm font-medium leading-none text-slate-800">{formatNumber(value)}</span>
    },
    {
      key: 'totalRevenue' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Revenue</TooltipTrigger>
            <TooltipContent>Total revenue across selected period</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => <span className="text-sm font-medium leading-none text-slate-800">{formatCurrency(value)}</span>
    },
    {
      key: 'avgClassSize' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Avg Class Size</TooltipTrigger>
            <TooltipContent>Customers per session on average</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <span className="font-medium text-slate-800 text-sm">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'revenuePerSession' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Revenue/Session</TooltipTrigger>
            <TooltipContent>Average revenue per session</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <span className="font-medium text-slate-800 text-sm">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'topFormat' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Top Format</TooltipTrigger>
            <TooltipContent>Format with highest revenue for the trainer</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      align: 'center' as const,
      render: (value: string, row: any) => (
        <div className="flex items-center justify-center gap-1 leading-none">
          <span className={`
            rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide
            ${value === 'Cycle' ? 'bg-blue-100 text-blue-800' : 
              value === 'Barre' ? 'bg-slate-100 text-slate-800' : 
              'bg-emerald-100 text-emerald-800'}
          `}>
            {value}
          </span>
          <span className="text-xs text-slate-500">
            {value === 'Cycle' ? row.cycleSessions : 
             value === 'Barre' ? row.barreSessions : 
             row.strengthSessions} sessions
          </span>
        </div>
      )
    },
    {
      key: 'fillRate' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Fill Rate</TooltipTrigger>
            <TooltipContent>Customers / capacity across sessions (%)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
          <span className={`text-sm font-semibold leading-none ${
            value >= 85 ? 'text-green-600' : 
            value >= 70 ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {value.toFixed(1)}%
          </span>
      )
    },
    {
      key: 'conversionRate' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Conversion</TooltipTrigger>
            <TooltipContent>Converted / new members (%)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <span className={`text-sm font-semibold leading-none ${
          value >= 80 ? 'text-green-600' : 
          value >= 65 ? 'text-yellow-600' : 
          'text-red-600'
        }`}>
          {value.toFixed(1)}%
        </span>
      )
    },
    {
      key: 'performanceRating' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Rating</TooltipTrigger>
            <TooltipContent>Performance rating based on revenue thresholds</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: string, row: any) => (
        <div className="flex items-center justify-center gap-1 leading-none">
          <span className={`
            rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide
            ${value === 'Excellent' ? 'bg-green-100 text-green-800' :
              value === 'Good' ? 'bg-blue-100 text-blue-800' :
              value === 'Average' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'}
          `}>
            {value}
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {row.growthTrend >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
            )}
            {Math.abs(row.growthTrend).toFixed(0)}%
          </div>
        </div>
      )
    }
  ];

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const totalsRow = useMemo(() => {
    const totalSessions = processedTableData.reduce((sum, row) => sum + row.totalSessions, 0);
    const totalCustomers = processedTableData.reduce((sum, row) => sum + row.totalCustomers, 0);
    const totalRevenue = processedTableData.reduce((sum, row) => sum + row.totalRevenue, 0);
    const avgClassSize = totalSessions > 0 ? totalCustomers / totalSessions : 0;
    const revenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
    const fillRate =
      totalSessions > 0 ? (totalCustomers / (totalSessions * 20)) * 100 : 0;
    const avgConversion =
      processedTableData.length > 0
        ? processedTableData.reduce((sum, row) => sum + row.conversionRate, 0) / processedTableData.length
        : 0;

    return {
      totalSessions,
      totalCustomers,
      totalRevenue,
      avgClassSize,
      revenuePerSession,
      fillRate,
      avgConversion,
    };
  }, [processedTableData]);

  return (
    <ModernTableWrapper
      title="Trainer Performance Detail Analysis"
      description={`Comprehensive performance metrics for ${processedTableData.length} trainers`}
      icon={<UserCheck className="w-5 h-5" />}
      totalItems={processedTableData.length}
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table data-table="trainer-performance-detail" data-table-name="Trainer Performance Detail Analysis" className="w-full">
            <thead className="sticky top-0 z-30 text-white">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    className={cn(`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                      column.className || ''
                    }`, index === 0
                      ? 'sticky left-0 z-40 border-r border-white/20 bg-gradient-to-r from-slate-800 to-slate-900 hover:bg-slate-800'
                      : 'border-l border-white/20 bg-slate-900 hover:bg-slate-800')}
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
              {processedTableData.map((row, index) => (
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
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{formatNumber(totalsRow.totalSessions)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{formatNumber(totalsRow.totalCustomers)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{formatCurrency(totalsRow.totalRevenue)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totalsRow.avgClassSize.toFixed(1)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{formatCurrency(totalsRow.revenuePerSession)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">-</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totalsRow.fillRate.toFixed(1)}%</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totalsRow.avgConversion.toFixed(1)}%</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </ModernTableWrapper>
  );
};
