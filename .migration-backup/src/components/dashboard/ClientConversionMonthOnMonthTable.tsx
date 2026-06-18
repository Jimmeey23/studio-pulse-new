
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { motion } from 'framer-motion';
import { parseDate } from '@/utils/dateUtils';
import { logger } from '@/utils/logger';

interface ClientConversionMonthOnMonthTableProps {
  data: NewClientData[];
  visitsSummary?: Record<string, number>;
  onRowClick?: (monthData: any) => void;
}

export const ClientConversionMonthOnMonthTable: React.FC<ClientConversionMonthOnMonthTableProps> = ({ data, visitsSummary, onRowClick }) => {
  logger.debug('MonthOnMonth data:', data.length, 'records');
  const [sortField, setSortField] = React.useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  const monthlyData = React.useMemo(() => {
    // Generate all months from Jan 2024 to current month regardless of data
    const generateAllMonths = () => {
      const months = [];
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Start from current month and go back to Jan 2024
      for (let year = currentYear; year >= 2024; year--) {
        const startMonth = year === currentYear ? currentMonth : 11;
        const endMonth = year === 2024 ? 0 : 0;
        
        for (let month = startMonth; month >= endMonth; month--) {
          const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
          const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          months.push({ key: monthKey, name: monthName });
        }
      }
      
      return months;
    };

    const allMonths = generateAllMonths();
    
    // Initialize all months with empty data
    const monthlyStats = allMonths.reduce((acc, month) => {
      acc[month.key] = {
        month: month.name,
        sortKey: month.key,
        totalMembers: 0,
        newMembers: 0,
        converted: 0,
        retained: 0,
        totalLTV: 0,
        conversionIntervals: [],
        visitsPostTrial: [],
        clients: []
      };
      return acc;
    }, {} as Record<string, any>);

    // Process actual data into the pre-initialized months
    data.forEach(client => {
      const date = parseDate(client.firstVisitDate || '');
      if (!date) return;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Only process if this month exists in our pre-defined range
      if (monthlyStats[monthKey]) {
        monthlyStats[monthKey].totalMembers++;
        monthlyStats[monthKey].clients.push(client);
        
        // Count new members - case-insensitive contains 'new'
        if ((client.isNew || '').toLowerCase().includes('new')) {
          monthlyStats[monthKey].newMembers++;
        }
        
        // Count converted - when conversionStatus is exactly "Converted"
        if (client.conversionStatus === 'Converted') {
          monthlyStats[monthKey].converted++;
        }
        
        // Count retained - exact equality
        if (client.retentionStatus === 'Retained') {
          monthlyStats[monthKey].retained++;
        }
        
        // Sum LTV
        monthlyStats[monthKey].totalLTV += client.ltv || 0;
        
        // Use conversionSpan field for conversion interval
        if (client.conversionSpan && client.conversionSpan > 0) {
          monthlyStats[monthKey].conversionIntervals.push(client.conversionSpan);
        }
        
        if (client.visitsPostTrial && client.visitsPostTrial > 0) {
          monthlyStats[monthKey].visitsPostTrial.push(client.visitsPostTrial);
        }
      }
    });

    // Populate visits data from visitsSummary
    if (visitsSummary) {
      Object.keys(monthlyStats).forEach(monthKey => {
        const stat = monthlyStats[monthKey];
        // Convert monthKey format from "2024-01" to "Jan 2024" to match visitsSummary format
        const [year, month] = monthKey.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[parseInt(month) - 1];
        const summaryKey = `${monthName} ${year}`;
        
        stat.visits = visitsSummary[summaryKey] || 0;
      });
    }

    const processed = Object.values(monthlyStats)
      .map((stat: any) => ({
        ...stat,
        trialsCompleted: stat.visitsPostTrial.length, // trials completed = actual trials with visits
        conversionRate: stat.newMembers > 0 ? (stat.converted / stat.newMembers) * 100 : 0, // Converted from new members
        retentionRate: stat.newMembers > 0 ? (stat.retained / stat.newMembers) * 100 : 0, // Retained from new members (corrected)
        avgLTV: stat.totalMembers > 0 ? stat.totalLTV / stat.totalMembers : 0,
        avgConversionInterval: stat.conversionIntervals.length > 0 
          ? stat.conversionIntervals.reduce((a: number, b: number) => a + b, 0) / stat.conversionIntervals.length 
          : 0,
        avgVisitsPostTrial: stat.visitsPostTrial.length > 0
          ? stat.visitsPostTrial.reduce((a: number, b: number) => a + b, 0) / stat.visitsPostTrial.length
          : 0
      }))
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey));

    logger.debug('Monthly data processed:', processed);
    return processed;
  }, [data]);

  const columns = [
    {
      key: 'month',
      header: 'Month',
      className: 'font-semibold min-w-[100px] text-slate-900',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm font-medium text-slate-900">{value}</span>
      )
    },
    {
      key: 'totalMembers',
      header: 'Trials',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{formatNumber(value)}</span>
      )
    },
    {
      key: 'newMembers',
      header: 'New Members',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{formatNumber(value)}</span>
      )
    },
    {
      key: 'retained',
      header: 'Retained',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{formatNumber(value)}</span>
      )
    },
    {
      key: 'retentionRate',
      header: 'Retention %',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{value.toFixed(1)}%</span>
      )
    },
    {
      key: 'converted',
      header: 'Converted',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{formatNumber(value)}</span>
      )
    },
    {
      key: 'conversionRate',
      header: 'Conversion %',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{value.toFixed(1)}%</span>
      )
    },
    {
      key: 'avgLTV',
      header: 'Avg LTV',
      align: 'right' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'totalLTV',
      header: 'Total LTV',
      align: 'right' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'avgConversionInterval',
      header: 'Avg Conv Days',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{Math.round(value)}</span>
      )
    },
    {
      key: 'avgVisitsPostTrial',
      header: 'Avg Visits',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{value.toFixed(1)}</span>
      )
    }
  ];

  // Calculate totals
  const totals = {
    month: 'TOTAL',
    totalMembers: monthlyData.reduce((sum, row) => sum + row.totalMembers, 0),
    newMembers: monthlyData.reduce((sum, row) => sum + row.newMembers, 0),
    converted: monthlyData.reduce((sum, row) => sum + row.converted, 0),
    conversionRate: 0,
    retained: monthlyData.reduce((sum, row) => sum + row.retained, 0),
    retentionRate: 0,
    totalLTV: monthlyData.reduce((sum, row) => sum + row.totalLTV, 0),
    avgLTV: monthlyData.reduce((sum, row) => sum + row.totalLTV, 0) / Math.max(monthlyData.reduce((sum, row) => sum + row.totalMembers, 0), 1),
    avgConversionInterval: monthlyData.reduce((sum, row) => sum + (row.avgConversionInterval * row.totalMembers), 0) / Math.max(monthlyData.reduce((sum, row) => sum + row.totalMembers, 0), 1),
    avgVisitsPostTrial: monthlyData.reduce((sum, row) => sum + (row.avgVisitsPostTrial * row.totalMembers), 0) / Math.max(monthlyData.reduce((sum, row) => sum + row.totalMembers, 0), 1)
  };
  totals.conversionRate = totals.newMembers > 0 ? (totals.converted / totals.newMembers) * 100 : 0;
  totals.retentionRate = totals.newMembers > 0 ? (totals.retained / totals.newMembers) * 100 : 0;

  // Sorting
  const displayedData = React.useMemo(() => {
    if (!sortField) return monthlyData;
    const arr = [...monthlyData];
    return arr.sort((a: any, b: any) => {
      const av = a[sortField];
      const bv = b[sortField];
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [monthlyData, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDirection('desc'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-all duration-300">
  <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-700 to-cyan-800 text-white">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Month-on-Month Client Conversion Analysis
          <Badge variant="secondary" className="bg-white/20 text-white">
            {monthlyData.length} Months
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ModernDataTable
          data={displayedData}
          columns={columns}
          headerGradient="from-slate-800 via-slate-900 to-slate-800"
          showFooter={true}
          footerData={totals}
          maxHeight="600px"
          onRowClick={onRowClick}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
        />
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
            <li>Highest conversion: {(() => {
              const withNew = monthlyData.filter(r => r.newMembers > 0);
              if (withNew.length === 0) return 'N/A';
              const top = [...withNew].sort((a,b) => b.conversionRate - a.conversionRate)[0];
              return `${top.month} at ${top.conversionRate.toFixed(1)}% (${top.converted}/${top.newMembers})`;
            })()}</li>
            <li>Best retention: {(() => {
              const withNew = monthlyData.filter(r => r.newMembers > 0);
              if (withNew.length === 0) return 'N/A';
              const top = [...withNew].sort((a,b) => b.retentionRate - a.retentionRate)[0];
              return `${top.month} at ${top.retentionRate.toFixed(1)}% (${top.retained}/${top.newMembers})`;
            })()}</li>
            <li>Most trials: {(() => {
              if (monthlyData.length === 0) return 'N/A';
              const top = [...monthlyData].sort((a,b) => b.totalMembers - a.totalMembers)[0];
              return `${top.month} with ${formatNumber(top.totalMembers)} trials`;
            })()}</li>
            <li>Avg conversion time: {Math.round(totals.avgConversionInterval)} days; Avg visits: {totals.avgVisitsPostTrial.toFixed(1)}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
};
