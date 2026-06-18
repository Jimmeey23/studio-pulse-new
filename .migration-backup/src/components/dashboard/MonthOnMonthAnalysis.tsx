import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PayrollData } from '@/types/dashboard';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { FormatFilters } from './FormatAnalysisFilters';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Minus
} from 'lucide-react';

interface MonthOnMonthAnalysisProps {
  data: PayrollData[];
  filters: FormatFilters;
}

interface MonthlyMetrics {
  monthYear: string;
  cycle: {
    sessions: number;
    emptySessions: number;
    visits: number;
    revenue: number;
    fillRate: number;
  };
  barre: {
    sessions: number;
    emptySessions: number;
    visits: number;
    revenue: number;
    fillRate: number;
  };
  strength: {
    sessions: number;
    emptySessions: number;
    visits: number;
    revenue: number;
    fillRate: number;
  };
}

export const MonthOnMonthAnalysis: React.FC<MonthOnMonthAnalysisProps> = ({ data, filters }) => {
  const monthlyData = useMemo(() => {
    const monthlyMap = new Map<string, MonthlyMetrics>();

    // Filter data based on filters
    let filteredData = data;
    if (filters.locations.length > 0) {
      filteredData = filteredData.filter(item => filters.locations.includes(item.location));
    }

    filteredData.forEach(row => {
      const month = row.monthYear;
      if (!month) return;

      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {
          monthYear: month,
          cycle: { sessions: 0, emptySessions: 0, visits: 0, revenue: 0, fillRate: 0 },
          barre: { sessions: 0, emptySessions: 0, visits: 0, revenue: 0, fillRate: 0 },
          strength: { sessions: 0, emptySessions: 0, visits: 0, revenue: 0, fillRate: 0 }
        });
      }

      const monthData = monthlyMap.get(month)!;

      // PowerCycle
      monthData.cycle.sessions += row.cycleSessions || 0;
      monthData.cycle.emptySessions += row.emptyCycleSessions || 0;
      monthData.cycle.visits += row.cycleCustomers || 0;
      monthData.cycle.revenue += row.cyclePaid || 0;

      // Barre
      monthData.barre.sessions += row.barreSessions || 0;
      monthData.barre.emptySessions += row.emptyBarreSessions || 0;
      monthData.barre.visits += row.barreCustomers || 0;
      monthData.barre.revenue += row.barrePaid || 0;

      // Strength
      monthData.strength.sessions += row.strengthSessions || 0;
      monthData.strength.emptySessions += row.emptyStrengthSessions || 0;
      monthData.strength.visits += row.strengthCustomers || 0;
      monthData.strength.revenue += row.strengthPaid || 0;
    });

    // Calculate fill rates
    Array.from(monthlyMap.values()).forEach(month => {
      month.cycle.fillRate = month.cycle.sessions > 0 
        ? ((month.cycle.sessions - month.cycle.emptySessions) / month.cycle.sessions) * 100 
        : 0;
      month.barre.fillRate = month.barre.sessions > 0 
        ? ((month.barre.sessions - month.barre.emptySessions) / month.barre.sessions) * 100 
        : 0;
      month.strength.fillRate = month.strength.sessions > 0 
        ? ((month.strength.sessions - month.strength.emptySessions) / month.strength.sessions) * 100 
        : 0;
    });

    return Array.from(monthlyMap.values()).sort((a, b) => a.monthYear.localeCompare(b.monthYear));
  }, [data, filters]);





  const MonthOnMonthTable = () => {
    const metrics = [
      { key: 'sessions', label: 'Sessions', format: 'number' as const },
      { key: 'emptySessions', label: 'Empty Sessions', format: 'number' as const },
      { key: 'visits', label: 'Visits', format: 'number' as const },
      { key: 'revenue', label: 'Revenue', format: 'currency' as const },
      { key: 'fillRate', label: 'Fill Rate', format: 'percentage' as const }
    ];

    const formatValue = (value: number, format: 'number' | 'currency' | 'percentage') => {
      switch (format) {
        case 'currency': return formatCurrency(value);
        case 'percentage': return formatPercentage(value);
        default: return formatNumber(value);
      }
    };

    const getChangeIcon = (current: number, previous: number) => {
      if (previous === 0) return <Minus className="h-3 w-3 text-gray-400" />;
      const change = ((current - previous) / previous) * 100;
      if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
      if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
      return <Minus className="h-3 w-3 text-gray-400" />;
    };

    const getChangeValue = (current: number, previous: number) => {
      if (previous === 0) return '0%';
      const change = ((current - previous) / previous) * 100;
      const isPositive = change > 0;
      return `${isPositive ? '+' : ''}${formatPercentage(Math.abs(change))}`;
    };

    return (
      <div className="space-y-8">
        {filters.formats.map((format) => {
          const formatConfig = {
            cycle: { name: 'PowerCycle', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-900' },
            barre: { name: 'Barre', color: 'pink', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', textColor: 'text-pink-900' },
            strength: { name: 'Strength', color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-900' }
          }[format];

          return (
            <Card key={format} className={`border-2 ${formatConfig.borderColor} shadow-lg bg-gradient-to-br from-white to-gray-50`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${
                    format === 'cycle' ? 'from-blue-500 to-blue-600' :
                    format === 'barre' ? 'from-pink-500 to-pink-600' :
                    'from-orange-500 to-orange-600'
                  }`}>
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <span className={`font-bold text-xl ${formatConfig.textColor}`}>
                    {formatConfig.name} - Month on Month
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`${formatConfig.bgColor} border-b-2 ${formatConfig.borderColor}`}>
                        <th className="text-left p-3 font-semibold">Metric</th>
                        {monthlyData.map((month, index) => (
                          <th key={month.monthYear} className="text-center p-3 font-semibold min-w-[120px]">
                            <div className="space-y-1">
                              <div>{month.monthYear}</div>
                              {index > 0 && (
                                <div className="text-xs text-gray-500 font-normal">
                                  vs {monthlyData[index - 1].monthYear}
                                </div>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((metric) => (
                        <tr key={metric.key} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-3 font-medium">{metric.label}</td>
                          {monthlyData.map((month, index) => {
                            const currentValue = (month as any)[format][metric.key];
                            const previousValue = index > 0 ? (monthlyData[index - 1] as any)[format][metric.key] : 0;
                            
                            return (
                              <td key={month.monthYear} className="text-center p-3">
                                <div className="space-y-1">
                                  <div className="font-semibold">
                                    {formatValue(currentValue, metric.format)}
                                  </div>
                                  {index > 0 && (
                                    <div className="flex items-center justify-center gap-1 text-xs">
                                      {getChangeIcon(currentValue, previousValue)}
                                      <span className={`${
                                        previousValue === 0 ? 'text-gray-500' :
                                        currentValue > previousValue ? 'text-green-600' : 
                                        currentValue < previousValue ? 'text-red-600' : 'text-gray-500'
                                      }`}>
                                        {getChangeValue(currentValue, previousValue)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Month-on-Month Analysis
        </h3>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {monthlyData.length} months
        </Badge>
      </div>

      {monthlyData.length === 0 ? (
        <Card className="p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm">Try adjusting your filters to see monthly analysis</p>
          </div>
        </Card>
      ) : (
        <MonthOnMonthTable />
      )}
    </div>
  );
};