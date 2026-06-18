import React, { useState, useMemo } from 'react';
import { ModernTableWrapper } from './ModernTableWrapper';
import { ProcessedTrainerData } from './TrainerDataProcessor';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Zap, Clock, Target, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrainerNameCell } from '@/components/ui/TrainerAvatar';
import { cn } from '@/lib/utils';

const compactLocationLabel = (location: string) =>
  location
    .replace('Kwality House, Kemps Corner', 'Kwality House')
    .replace('Supreme HQ, Bandra', 'Supreme HQ')
    .replace('Kenkere House', 'Kenkere House');

interface TrainerEfficiencyAnalysisTableProps {
  data: ProcessedTrainerData[];
  onRowClick?: (trainer: string, data: any) => void;
}

export const TrainerEfficiencyAnalysisTable: React.FC<TrainerEfficiencyAnalysisTableProps> = ({ 
  data, 
  onRowClick 
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'efficiencyScore',
    direction: 'desc'
  });

  const efficiencyData = useMemo(() => {
    // Aggregate and calculate efficiency metrics by trainer
    const trainerEfficiency = data.reduce((acc, record) => {
      const key = record.trainerName;
      
      if (!acc[key]) {
        acc[key] = {
          trainerName: record.trainerName,
          location: record.location,
          totalSessions: 0,
          nonEmptySessions: 0,
          emptySessions: 0,
          totalCustomers: 0,
          totalRevenue: 0,
          cycleSessions: 0,
          barreSessions: 0,
          strengthSessions: 0,
          monthsActive: 0,
          capacityUtilization: 0,
          revenuePerHour: 0,
          customerRetention: 0,
          avgClassFill: 0,
          efficiencyScore: 0,
          productivityRank: 'A',
          timeOptimization: 0,
          resourceUtilization: 0,
          impactScore: 0,
          qualityIndex: 0,
          growthMomentum: 0,
          consistencyFactor: 0
        };
      }

      acc[key].totalSessions += record.totalSessions;
      acc[key].nonEmptySessions += record.nonEmptySessions;
      acc[key].emptySessions += record.emptySessions;
      acc[key].totalCustomers += record.totalCustomers;
      acc[key].totalRevenue += record.totalPaid;
      acc[key].cycleSessions += record.cycleSessions;
      acc[key].barreSessions += record.barreSessions;
      acc[key].strengthSessions += record.strengthSessions;
      acc[key].monthsActive += 1;

      return acc;
    }, {} as Record<string, any>);

    // Calculate efficiency metrics
    return Object.values(trainerEfficiency).map((trainer: any) => {
      // Basic efficiency calculations
      trainer.capacityUtilization = trainer.totalSessions > 0 
        ? (trainer.nonEmptySessions / trainer.totalSessions) * 100 
        : 0;
      
      trainer.avgClassFill = trainer.nonEmptySessions > 0 
        ? trainer.totalCustomers / trainer.nonEmptySessions 
        : 0;

      // Data-based metrics
      trainer.revenuePerHour = trainer.totalSessions > 0 
        ? trainer.totalRevenue / trainer.totalSessions // assume 1 hour per session
        : 0;

      // Derive customer retention from aggregated weighted rate across months for this trainer
      const records = data.filter(r => r.trainerName === trainer.trainerName);
      const totalNew = records.reduce((s, r) => s + (r.newMembers || 0), 0);
      const totalRetained = records.reduce((s, r) => s + (r.retainedMembers || 0), 0);
      trainer.customerRetention = totalNew > 0 ? (totalRetained / totalNew) * 100 : 0;

      // Time optimization proxy: ratio of non-empty to total (same as utilization)
      trainer.timeOptimization = trainer.capacityUtilization;
      trainer.resourceUtilization = trainer.capacityUtilization;

      // Impact/quality/consistency: compute simple scaled indices from existing metrics
      // Impact: revenue per session relative to cohort
      const cohort = Object.values(trainerEfficiency) as any[];
      const rpsValues = cohort.map(t => (t.totalSessions > 0 ? t.totalRevenue / t.totalSessions : 0));
      const rpsMax = Math.max(...rpsValues, 1);
      trainer.impactScore = Math.min(100, (trainer.revenuePerHour / rpsMax) * 100);

      // Quality: average class fill normalized to a 0–100 band assuming 20 as a practical ceiling
      trainer.qualityIndex = Math.min(100, (trainer.avgClassFill / 20) * 100);

      // Consistency: based on variability in monthly sessions
      if (records.length > 1) {
        const monthly = records.map(r => r.totalSessions || 0);
        const avg = monthly.reduce((s, v) => s + v, 0) / monthly.length;
        const variance = monthly.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / monthly.length;
        const stddev = Math.sqrt(variance);
        trainer.consistencyFactor = avg > 0 ? Math.max(0, 100 - (stddev / avg) * 100) : 100;
      } else {
        trainer.consistencyFactor = 100;
      }

      // Growth momentum: last vs previous month sessions
      const sortedRecs = [...records].sort((a, b) => (a.monthKey || '').localeCompare(b.monthKey || ''));
      const last = sortedRecs[sortedRecs.length - 1]?.totalSessions || 0;
      const prev = sortedRecs[sortedRecs.length - 2]?.totalSessions || 0;
      trainer.growthMomentum = prev > 0 ? ((last - prev) / prev) * 100 : (last > 0 ? 100 : 0);

      // Overall efficiency score: weighted composite of real metrics
      trainer.efficiencyScore = (
        trainer.capacityUtilization * 0.35 +
        trainer.revenuePerHour * 0.02 + // scale-down factor
        trainer.customerRetention * 0.15 +
        trainer.impactScore * 0.15 +
        trainer.qualityIndex * 0.1 +
        trainer.consistencyFactor * 0.13
      );

  // Determine productivity rank
      if (trainer.efficiencyScore >= 90) trainer.productivityRank = 'S+';
      else if (trainer.efficiencyScore >= 85) trainer.productivityRank = 'A+';
      else if (trainer.efficiencyScore >= 80) trainer.productivityRank = 'A';
      else if (trainer.efficiencyScore >= 75) trainer.productivityRank = 'B+';
      else if (trainer.efficiencyScore >= 70) trainer.productivityRank = 'B';
      else trainer.productivityRank = 'C';

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
      // Find the most recent month data for this trainer to provide specific context
      const trainerRecords = data.filter(r => r.trainerName === rowData.trainerName);
      const mostRecentRecord = trainerRecords.sort((a, b) => 
        (b.monthKey || '').localeCompare(a.monthKey || '')
      )[0];
      
      onRowClick(rowData.trainerName, {
        // Use the most recent month's specific data instead of aggregated totals
        ...mostRecentRecord,
        // Add efficiency metrics from aggregated data
        efficiencyScore: rowData.efficiencyScore,
        capacityUtilization: rowData.capacityUtilization,
        revenuePerHour: rowData.revenuePerHour,
        avgClassFill: rowData.avgClassFill,
        customerRetention: rowData.customerRetention,
        productivityRank: rowData.productivityRank,
        monthYear: mostRecentRecord?.monthYear || mostRecentRecord?.month || '',
        location: mostRecentRecord?.location || rowData.location || '',
        type: 'trainer-efficiency',
        contextFilters: {
          location: mostRecentRecord?.location || rowData.location || '',
          month: mostRecentRecord?.monthYear || mostRecentRecord?.month || ''
        }
      });
    }
  };

  const columns = [
    {
      key: 'trainerName' as const,
      header: 'Trainer',
      sortable: true,
      className: 'min-w-[260px]',
      render: (value: string, row: any) => (
        <div className="flex min-w-0 items-center gap-3">
          <TrainerNameCell name={value} className="min-w-0 flex-1" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] text-slate-500">{compactLocationLabel(row.location || '')}</div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            row.productivityRank === 'S+' ? 'bg-blue-100 text-blue-800' :
            row.productivityRank === 'A+' ? 'bg-green-100 text-green-800' :
            row.productivityRank === 'A' ? 'bg-blue-100 text-blue-800' :
            row.productivityRank === 'B+' ? 'bg-yellow-100 text-yellow-800' :
            row.productivityRank === 'B' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            Rank {row.productivityRank}
          </span>
        </div>
      )
    },
    {
      key: 'efficiencyScore' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Efficiency Score</TooltipTrigger>
            <TooltipContent>Composite score from utilization, retention, impact, quality, and consistency</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <span className={`text-sm font-bold leading-none ${
            value >= 85 ? 'text-green-600' :
            value >= 75 ? 'text-blue-600' :
            value >= 65 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {value.toFixed(0)}
        </span>
      )
    },
    {
      key: 'capacityUtilization' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Capacity Usage</TooltipTrigger>
            <TooltipContent>Non-empty sessions divided by total sessions</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number, row: any) => (
        <div className="flex items-center justify-center gap-1.5 leading-none tabular-nums">
          <span className={`text-sm font-semibold ${
            value >= 90 ? 'text-green-600' :
            value >= 80 ? 'text-blue-600' :
            value >= 70 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {value.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500">({row.nonEmptySessions}/{row.totalSessions})</span>
        </div>
      )
    },
    {
      key: 'revenuePerHour' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Revenue/Hour</TooltipTrigger>
            <TooltipContent>Revenue per session (assumes 1 hour per session)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => <span className="text-sm font-semibold leading-none text-green-600">{formatCurrency(value)}</span>
    },
    {
      key: 'avgClassFill' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Avg Fill</TooltipTrigger>
            <TooltipContent>Average customers per non-empty session</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => <span className="text-sm font-semibold leading-none text-blue-700">{value.toFixed(1)}</span>
    },
    {
      key: 'customerRetention' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Retention</TooltipTrigger>
            <TooltipContent>Weighted retained/new members (%) across months</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
          <span className={`text-sm font-semibold leading-none ${
            value >= 90 ? 'text-green-600' :
            value >= 80 ? 'text-blue-600' :
            value >= 70 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {value.toFixed(1)}%
          </span>
      )
    },
    {
      key: 'timeOptimization' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Time Opt.</TooltipTrigger>
            <TooltipContent>Proxy equals capacity usage (%)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <span className={`text-sm font-semibold leading-none ${
          value >= 90 ? 'text-green-600' :
          value >= 85 ? 'text-blue-600' :
          value >= 80 ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {value.toFixed(0)}%
        </span>
      )
    },
    {
      key: 'qualityIndex' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Quality Index</TooltipTrigger>
            <TooltipContent>Avg fill normalized to 0-100 (20 assumed ceiling)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
          <span className={`text-sm font-semibold leading-none ${
            value >= 90 ? 'text-green-600' :
            value >= 85 ? 'text-blue-600' :
            value >= 80 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {value.toFixed(0)}
          </span>
      )
    },
    {
      key: 'growthMomentum' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Growth</TooltipTrigger>
            <TooltipContent>Last vs previous month sessions (%)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <div className="flex items-center justify-center gap-1 leading-none">
          {value >= 0 ? (
            <TrendingUp className="w-3 h-3 text-green-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span className={`font-semibold ${
            value >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {value >= 0 ? '+' : ''}{value.toFixed(1)}%
          </span>
        </div>
      )
    },
    {
      key: 'impactScore' as const,
      header: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">Impact</TooltipTrigger>
            <TooltipContent>Revenue per session relative to cohort (0-100)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <span className={`text-sm font-bold leading-none ${
            value >= 90 ? 'text-blue-700' :
            value >= 80 ? 'text-blue-600' :
            value >= 70 ? 'text-green-600' :
            'text-yellow-600'
          }`}>
            {value.toFixed(0)}
        </span>
      )
    }
  ];

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const avgEfficiency = efficiencyData.reduce((sum, trainer) => sum + trainer.efficiencyScore, 0) / efficiencyData.length;
    const topPerformers = efficiencyData.filter(trainer => trainer.efficiencyScore >= 85).length;
    const avgCapacityUtilization = efficiencyData.reduce((sum, trainer) => sum + trainer.capacityUtilization, 0) / efficiencyData.length;
    
    return { avgEfficiency, topPerformers, avgCapacityUtilization };
  }, [efficiencyData]);

  const totalsRow = useMemo(() => {
    if (!efficiencyData.length) {
      return {
        efficiencyScore: 0,
        capacityUtilization: 0,
        revenuePerHour: 0,
        avgClassFill: 0,
        customerRetention: 0,
        timeOptimization: 0,
        qualityIndex: 0,
        growthMomentum: 0,
        impactScore: 0,
      };
    }

    const count = efficiencyData.length;
    return {
      efficiencyScore: efficiencyData.reduce((sum, row) => sum + row.efficiencyScore, 0) / count,
      capacityUtilization: efficiencyData.reduce((sum, row) => sum + row.capacityUtilization, 0) / count,
      revenuePerHour: efficiencyData.reduce((sum, row) => sum + row.revenuePerHour, 0) / count,
      avgClassFill: efficiencyData.reduce((sum, row) => sum + row.avgClassFill, 0) / count,
      customerRetention: efficiencyData.reduce((sum, row) => sum + row.customerRetention, 0) / count,
      timeOptimization: efficiencyData.reduce((sum, row) => sum + row.timeOptimization, 0) / count,
      qualityIndex: efficiencyData.reduce((sum, row) => sum + row.qualityIndex, 0) / count,
      growthMomentum: efficiencyData.reduce((sum, row) => sum + row.growthMomentum, 0) / count,
      impactScore: efficiencyData.reduce((sum, row) => sum + row.impactScore, 0) / count,
    };
  }, [efficiencyData]);

  return (
    <ModernTableWrapper
      title="Trainer Efficiency & Productivity Analysis"
      description={`Efficiency analysis for ${efficiencyData.length} trainers with productivity ranking system`}
      icon={<Zap className="w-5 h-5" />}
      totalItems={efficiencyData.length}
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Summary Stats Header */}
        <div className="rounded-t-lg bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 p-4 text-white">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-white/10 bg-white/8 p-3">
              <div className="text-white/80">Avg Efficiency</div>
              <div className="text-xl font-bold">{summaryStats.avgEfficiency.toFixed(0)}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/8 p-3">
              <div className="text-white/80">Top Performers</div>
              <div className="text-xl font-bold">{summaryStats.topPerformers}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/8 p-3">
              <div className="text-white/80">Avg Utilization</div>
              <div className="text-xl font-bold">{summaryStats.avgCapacityUtilization.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table data-table="trainer-efficiency-analysis" data-table-name="Trainer Efficiency & Productivity Analysis" className="w-full">
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
              {efficiencyData.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 bg-white cursor-pointer transition-all duration-200 hover:bg-slate-50"
                  onClick={() => handleRowClick(row)}
                  style={{ height: '40px', maxHeight: '40px' }}
                >
                  {columns.map((column, columnIndex) => (
                    <td
                      key={column.key}
                      className={cn(`px-4 py-2 align-middle text-sm whitespace-nowrap ${
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
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totalsRow.efficiencyScore.toFixed(0)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totalsRow.capacityUtilization.toFixed(1)}%</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{formatCurrency(totalsRow.revenuePerHour)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totalsRow.avgClassFill.toFixed(1)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totalsRow.customerRetention.toFixed(1)}%</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totalsRow.timeOptimization.toFixed(1)}%</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totalsRow.qualityIndex.toFixed(0)}</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totalsRow.growthMomentum.toFixed(1)}%</td>
                <td className="border-l border-slate-400 px-4 py-2 text-sm text-center font-bold text-white">{totalsRow.impactScore.toFixed(0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </ModernTableWrapper>
  );
};
