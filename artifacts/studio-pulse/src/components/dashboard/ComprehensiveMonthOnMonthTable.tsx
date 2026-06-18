import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMonthOnMonthMetricsWithLocation, MonthlyMetrics } from '@/hooks/useMonthOnMonthMetricsWithLocation';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { BrandSpinner } from '@/components/ui/BrandSpinner';

/**
 * Comprehensive Month-On-Month Metrics Table
 * 
 * Displays a table with one row per month, showing key metrics across all business dimensions.
 * Data is filtered by location but independent of date range filters.
 */

export const ComprehensiveMonthOnMonthTable: React.FC = () => {
  const { metrics, loading } = useMonthOnMonthMetricsWithLocation();

  const columns = useMemo(() => [
    { key: 'monthLabel', label: 'Month', width: '12%' },
    { key: 'totalRevenue', label: 'Revenue', format: 'currency', width: '12%' },
    { key: 'totalSalesCount', label: 'Sales', format: 'number', width: '10%' },
    { key: 'totalSessions', label: 'Sessions', format: 'number', width: '10%' },
    { key: 'totalAttendance', label: 'Attendance', format: 'number', width: '10%' },
    { key: 'newClients', label: 'New Clients', format: 'number', width: '10%' },
    { key: 'totalLeads', label: 'Leads', format: 'number', width: '10%' },
    { key: 'convertedLeads', label: 'Converted', format: 'number', width: '10%' },
    { key: 'totalPayroll', label: 'Payroll', format: 'currency', width: '12%' },
    { key: 'totalDiscounts', label: 'Discounts', format: 'currency', width: '12%' },
    { key: 'totalExpirations', label: 'Expirations', format: 'number', width: '10%' },
  ], []);

  const formatValue = (value: number, format: string): string => {
    if (format === 'currency') {
      return formatCurrency(value);
    } else if (format === 'number') {
      return formatNumber(value);
    }
    return String(value);
  };

  if (loading) {
    return (
      <Card className="border border-slate-200">
        <CardContent className="p-8 flex items-center justify-center">
          <BrandSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Card className="border border-slate-200">
        <CardContent className="p-8 text-center text-slate-500">
          No historical data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 pb-3">
        <CardTitle className="text-lg font-bold text-slate-900">
          Complete Month-On-Month Metrics (All Time)
        </CardTitle>
        <p className="text-xs text-slate-600 mt-1">
          Historical data independent of current filters. Total: {metrics.length} months
        </p>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap text-xs uppercase tracking-wide"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((monthData, index) => (
              <tr
                key={monthData.monthKey}
                className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                {columns.map((col) => {
                  const value = monthData[col.key as keyof MonthlyMetrics];
                  let displayValue: string;

                  if (col.key === 'monthLabel') {
                    displayValue = String(value);
                  } else {
                    displayValue = formatValue(Number(value), col.format || 'number');
                  }

                  return (
                    <td
                      key={`${monthData.monthKey}-${col.key}`}
                      style={{ width: col.width }}
                      className={`px-4 py-3 text-slate-700 whitespace-nowrap font-mono text-xs ${
                        col.key === 'monthLabel' ? 'font-semibold text-slate-900' : ''
                      }`}
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>

      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
        <p>
          💡 Tip: This table shows complete historical data regardless of your current date range or location filters. Use it to compare performance across all periods.
        </p>
      </div>
    </Card>
  );
};
