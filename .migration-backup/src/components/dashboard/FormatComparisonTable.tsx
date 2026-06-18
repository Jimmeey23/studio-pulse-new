import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PayrollData } from '@/types/dashboard';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormatFilters } from './FormatAnalysisFilters';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  DollarSign,
  ShrinkIcon,
  ExpandIcon
} from 'lucide-react';

interface FormatComparisonTableProps {
  data: PayrollData[];
  filters?: FormatFilters;
}

export const FormatComparisonTable: React.FC<FormatComparisonTableProps> = ({ data, filters }) => {
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  
  // Table ref for copy functionality
  const tableRef = useRef<HTMLTableElement>(null);
  const tableId = 'format-comparison-table';
  
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
  
  const comparisonData = useMemo(() => {
    // Apply filters to data first
    let filteredData = data;
    if (filters?.locations && filters.locations.length > 0) {
      filteredData = filteredData.filter(item => filters.locations.includes(item.location));
    }
    
    // Filter by formats if specified
    const activeFormats = filters?.formats || ['cycle', 'barre', 'strength'];
    const formats = {
      cycle: {
        name: 'PowerCycle',
        sessions: 0,
        emptySessions: 0,
        visits: 0,
        revenue: 0,
        color: 'blue'
      },
      barre: {
        name: 'Barre',
        sessions: 0,
        emptySessions: 0,
        visits: 0,
        revenue: 0,
        color: 'pink'
      },
      strength: {
        name: 'Strength',
        sessions: 0,
        emptySessions: 0,
        visits: 0,
        revenue: 0,
        color: 'orange'
      }
    };

    filteredData.forEach(row => {
      // PowerCycle - only if format is active
      if (activeFormats.includes('cycle')) {
        formats.cycle.sessions += row.cycleSessions || 0;
        formats.cycle.emptySessions += row.emptyCycleSessions || 0;
        formats.cycle.visits += row.cycleCustomers || 0;
        formats.cycle.revenue += row.cyclePaid || 0;
      }

      // Barre - only if format is active
      if (activeFormats.includes('barre')) {
        formats.barre.sessions += row.barreSessions || 0;
        formats.barre.emptySessions += row.emptyBarreSessions || 0;
        formats.barre.visits += row.barreCustomers || 0;
        formats.barre.revenue += row.barrePaid || 0;
      }

      // Strength - only if format is active
      if (activeFormats.includes('strength')) {
        formats.strength.sessions += row.strengthSessions || 0;
        formats.strength.emptySessions += row.emptyStrengthSessions || 0;
        formats.strength.visits += row.strengthCustomers || 0;
        formats.strength.revenue += row.strengthPaid || 0;
      }
    });

    // Calculate derived metrics
    const calculateMetrics = (format: typeof formats.cycle) => {
      const nonEmptySessions = format.sessions - format.emptySessions;
      const fillRate = format.sessions > 0 ? (nonEmptySessions / format.sessions) * 100 : 0;
      const avgPerSession = format.sessions > 0 ? format.visits / format.sessions : 0;
      const avgPerNonEmpty = nonEmptySessions > 0 ? format.visits / nonEmptySessions : 0;
      const revenuePerVisit = format.visits > 0 ? format.revenue / format.visits : 0;
      const revenuePerSession = format.sessions > 0 ? format.revenue / format.sessions : 0;
      
      // Capacity utilization (assuming 20 capacity per session)
      const totalCapacity = format.sessions * 20;
      const capacityUtilization = totalCapacity > 0 ? (format.visits / totalCapacity) * 100 : 0;

      return {
        ...format,
        nonEmptySessions,
        fillRate,
        avgPerSession,
        avgPerNonEmpty,
        revenuePerVisit,
        revenuePerSession,
        capacityUtilization,
        totalCapacity
      };
    };

    return {
      cycle: calculateMetrics(formats.cycle),
      barre: calculateMetrics(formats.barre),
      strength: calculateMetrics(formats.strength)
    };
  }, [data, filters]);

  const formatsList = [comparisonData.cycle, comparisonData.barre, comparisonData.strength]
    .filter(format => filters?.formats?.includes(format.name.toLowerCase() as any) !== false);

  // Find best performing format for each metric
  const getBestFormat = (metricKey: string) => {
    return formatsList.reduce((best, current) => 
      (current as any)[metricKey] > (best as any)[metricKey] ? current : best
    );
  };

  const getColorClass = (formatName: string) => {
    switch (formatName.toLowerCase()) {
      case 'powercycle': return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'barre': return 'bg-pink-50 border-pink-200 text-pink-900';
      case 'strength': return 'bg-orange-50 border-orange-200 text-orange-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const MetricRow = ({ 
    label, 
    values, 
    format = 'number',
    bestMetric 
  }: {
    label: string;
    values: number[];
    format?: 'number' | 'currency' | 'percentage';
    bestMetric?: string;
  }) => {
    const formatValue = (value: number) => {
      switch (format) {
        case 'currency': return formatCurrency(value);
        case 'percentage': return formatPercentage(value);
        default: return formatNumber(value);
      }
    };

    const maxValue = Math.max(...values);

    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50/50">
        <td className="px-4 py-3 font-medium text-gray-900">{label}</td>
        {values.map((value, index) => (
          <td key={index} className="px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className={`font-semibold ${value === maxValue && maxValue > 0 ? 'text-green-600' : ''}`}>
                {formatValue(value)}
              </span>
              {value === maxValue && maxValue > 0 && (
                <Trophy className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </td>
        ))}
      </tr>
    );
  };

  return (
    <Card className="w-full bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-t-lg">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-blue-400" />
            Format Performance Comparison
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
      <CardContent className="pt-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {formatsList.map((format, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${getColorClass(format.name)}`}>
              <h3 className="font-semibold text-lg mb-2">{format.name}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Sessions:</span>
                  <span className="font-medium">{formatNumber(format.sessions)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue:</span>
                  <span className="font-medium">{formatCurrency(format.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fill Rate:</span>
                  <span className="font-medium">{formatPercentage(format.fillRate)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Comparison Table */}
        <div className="overflow-x-auto">
          <table ref={tableRef} id={tableId} className="w-full unified-table">
            <thead className="unified-table-header">
              <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <th className="px-4 py-3 text-left font-bold text-white uppercase text-xs tracking-wide">Metric</th>
                <th className="px-4 py-3 text-center font-bold text-white uppercase text-xs tracking-wide border-l border-white/20">PowerCycle</th>
                <th className="px-4 py-3 text-center font-bold text-white uppercase text-xs tracking-wide border-l border-white/20">Barre</th>
                <th className="px-4 py-3 text-center font-bold text-white uppercase text-xs tracking-wide border-l border-white/20">Strength</th>
              </tr>
            </thead>
            <tbody>
              <MetricRow 
                label="Sessions Scheduled"
                values={[comparisonData.cycle.sessions, comparisonData.barre.sessions, comparisonData.strength.sessions]}
              />
              <MetricRow 
                label="Empty Sessions"
                values={[comparisonData.cycle.emptySessions, comparisonData.barre.emptySessions, comparisonData.strength.emptySessions]}
              />
              <MetricRow 
                label="Non-Empty Sessions"
                values={[comparisonData.cycle.nonEmptySessions, comparisonData.barre.nonEmptySessions, comparisonData.strength.nonEmptySessions]}
              />
              <MetricRow 
                label="Total Visits"
                values={[comparisonData.cycle.visits, comparisonData.barre.visits, comparisonData.strength.visits]}
              />
              <MetricRow 
                label="Total Capacity"
                values={[comparisonData.cycle.totalCapacity, comparisonData.barre.totalCapacity, comparisonData.strength.totalCapacity]}
              />
              <MetricRow 
                label="Revenue Earned"
                values={[comparisonData.cycle.revenue, comparisonData.barre.revenue, comparisonData.strength.revenue]}
                format="currency"
              />
              <MetricRow 
                label="Fill Rate"
                values={[comparisonData.cycle.fillRate, comparisonData.barre.fillRate, comparisonData.strength.fillRate]}
                format="percentage"
              />
              <MetricRow 
                label="Capacity Utilization"
                values={[comparisonData.cycle.capacityUtilization, comparisonData.barre.capacityUtilization, comparisonData.strength.capacityUtilization]}
                format="percentage"
              />
              <MetricRow 
                label="Avg Customers/Session (All)"
                values={[comparisonData.cycle.avgPerSession, comparisonData.barre.avgPerSession, comparisonData.strength.avgPerSession]}
              />
              <MetricRow 
                label="Avg Customers/Session (Non-Empty)"
                values={[comparisonData.cycle.avgPerNonEmpty, comparisonData.barre.avgPerNonEmpty, comparisonData.strength.avgPerNonEmpty]}
              />
              <MetricRow 
                label="Revenue per Visit"
                values={[comparisonData.cycle.revenuePerVisit, comparisonData.barre.revenuePerVisit, comparisonData.strength.revenuePerVisit]}
                format="currency"
              />
              <MetricRow 
                label="Revenue per Session"
                values={[comparisonData.cycle.revenuePerSession, comparisonData.barre.revenuePerSession, comparisonData.strength.revenuePerSession]}
                format="currency"
              />
            </tbody>
          </table>
        </div>

        {/* Performance Insights */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Performance Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-600">Top Revenue:</span>
              <div>{getBestFormat('revenue').name} - {formatCurrency(getBestFormat('revenue').revenue)}</div>
            </div>
            <div>
              <span className="font-medium text-blue-600">Best Fill Rate:</span>
              <div>{getBestFormat('fillRate').name} - {formatPercentage(getBestFormat('fillRate').fillRate)}</div>
            </div>
            <div>
              <span className="font-medium text-purple-600">Most Sessions:</span>
              <div>{getBestFormat('sessions').name} - {formatNumber(getBestFormat('sessions').sessions)}</div>
            </div>
          </div>
        </div>
      </CardContent>
      )}
    </Card>
  );
};