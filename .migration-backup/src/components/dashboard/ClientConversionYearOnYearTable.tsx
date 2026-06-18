import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { ModernDataTable } from '@/components/ui/ModernDataTable';

interface ClientConversionYearOnYearTableProps {
  data: NewClientData[];
  visitsSummary?: Record<string, number>;
  onRowClick?: (monthData: any) => void;
}

export const ClientConversionYearOnYearTable: React.FC<ClientConversionYearOnYearTableProps> = ({ data, visitsSummary, onRowClick }) => {
  const [sortField, setSortField] = React.useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const yearOnYearData = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Generate all 12 months regardless of data
    const allMonths = Array.from({ length: 12 }, (_, i) => {
      const monthNumber = i + 1;
      const monthName = new Date(2024, i).toLocaleDateString('en-US', { month: 'short' });
      return {
        monthName,
        monthNumber,
        key: monthName
      };
    });

    // Initialize all months with empty data
    const monthlyStats = allMonths.reduce((acc, month) => {
      acc[month.key] = {
        month: month.monthName,
        sortOrder: month.monthNumber,
        currentYear: { totalMembers: 0, visits: 0, newMembers: 0, converted: 0, retained: 0, totalLTV: 0, clients: [] },
        previousYear: { totalMembers: 0, visits: 0, newMembers: 0, converted: 0, retained: 0, totalLTV: 0, clients: [] }
      };
      return acc;
    }, {} as Record<string, any>);

    // Process actual data into the pre-initialized months
    data.forEach(client => {
      const dateStr = client.firstVisitDate;
      let date: Date;
      
      // Handle different date formats consistently  
      if (dateStr.includes('/')) {
        const parts = dateStr.split(' ')[0].split('/');
        if (parts.length === 3) {
          // Try DD/MM/YYYY format first
          const [day, month, year] = parts;
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          
          // If invalid, try MM/DD/YYYY format
          if (isNaN(date.getTime())) {
            date = new Date(parseInt(year), parseInt(day) - 1, parseInt(month));
          }
        } else {
          date = new Date(dateStr);
        }
      } else {
        date = new Date(dateStr);
      }
      
      if (isNaN(date.getTime())) return;
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      if ((year === currentYear || year === previousYear) && monthlyStats[monthName]) {
        const yearData = year === currentYear ? monthlyStats[monthName].currentYear : monthlyStats[monthName].previousYear;
        yearData.totalMembers++;
        yearData.clients.push(client);
        
        // Count new members - when isNew contains "new" (case insensitive)
        if ((client.isNew || '').toLowerCase().includes('new')) {
          yearData.newMembers++;
        }
        
        // Count converted - when conversionStatus is exactly "Converted"
        if (client.conversionStatus === 'Converted') {
          yearData.converted++;
        }
        
        // Count retained - when retentionStatus is exactly "Retained"
        if (client.retentionStatus === 'Retained') {
          yearData.retained++;
        }
        
        yearData.totalLTV += client.ltv || 0;
      }
    });

    // Populate visits data from visitsSummary
    if (visitsSummary) {
      Object.values(monthlyStats).forEach((stat: any) => {
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;
        
        // Format: "Jan 2024", "Jan 2023", etc.
        const currentYearKey = `${stat.month} ${currentYear}`;
        const previousYearKey = `${stat.month} ${previousYear}`;
        
        stat.currentYear.visits = visitsSummary[currentYearKey] || 0;
        stat.previousYear.visits = visitsSummary[previousYearKey] || 0;
      });
    }

    return Object.values(monthlyStats)
      .map((stat: any) => {
        const currentConversionRate = stat.currentYear.newMembers > 0 ? (stat.currentYear.converted / stat.currentYear.newMembers) * 100 : 0;
        const previousConversionRate = stat.previousYear.newMembers > 0 ? (stat.previousYear.converted / stat.previousYear.newMembers) * 100 : 0;
        const currentRetentionRate = stat.currentYear.newMembers > 0 ? (stat.currentYear.retained / stat.currentYear.newMembers) * 100 : 0;
        const previousRetentionRate = stat.previousYear.newMembers > 0 ? (stat.previousYear.retained / stat.previousYear.newMembers) * 100 : 0;
        const currentAvgLTV = stat.currentYear.totalMembers > 0 ? stat.currentYear.totalLTV / stat.currentYear.totalMembers : 0;
        const previousAvgLTV = stat.previousYear.totalMembers > 0 ? stat.previousYear.totalLTV / stat.previousYear.totalMembers : 0;

        return {
          month: stat.month,
          sortOrder: stat.sortOrder,
          currentVisits: stat.currentYear.visits,
          previousVisits: stat.previousYear.visits,
          visitsGrowth: stat.previousYear.visits > 0 ? ((stat.currentYear.visits - stat.previousYear.visits) / stat.previousYear.visits) * 100 : 0,
          currentTotalMembers: stat.currentYear.totalMembers,
          previousTotalMembers: stat.previousYear.totalMembers,
          totalMembersGrowth: stat.previousYear.totalMembers > 0 ? ((stat.currentYear.totalMembers - stat.previousYear.totalMembers) / stat.previousYear.totalMembers) * 100 : 0,
          currentNewMembers: stat.currentYear.newMembers,
          previousNewMembers: stat.previousYear.newMembers,
          newMembersGrowth: stat.previousYear.newMembers > 0 ? ((stat.currentYear.newMembers - stat.previousYear.newMembers) / stat.previousYear.newMembers) * 100 : 0,
          currentConverted: stat.currentYear.converted,
          previousConverted: stat.previousYear.converted,
          currentConversionRate,
          previousConversionRate,
          conversionRateGrowth: previousConversionRate > 0 ? currentConversionRate - previousConversionRate : 0,
          currentRetained: stat.currentYear.retained,
          previousRetained: stat.previousYear.retained,
          currentRetentionRate,
          previousRetentionRate,
          retentionRateGrowth: previousRetentionRate > 0 ? currentRetentionRate - previousRetentionRate : 0,
          currentTotalLTV: stat.currentYear.totalLTV,
          previousTotalLTV: stat.previousYear.totalLTV,
          currentAvgLTV,
          previousAvgLTV,
          avgLTVGrowth: previousAvgLTV > 0 ? ((currentAvgLTV - previousAvgLTV) / previousAvgLTV) * 100 : 0,
          currentClients: stat.currentYear.clients,
          previousClients: stat.previousYear.clients
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [data]);

  const columns = [
    {
      key: 'month' as const,
      header: 'Month',
      className: 'font-semibold min-w-[80px] text-slate-900',
      sortable: true
    },
    {
      key: 'currentTotalMembers' as const,
      header: `${new Date().getFullYear()} Trials`,
      align: 'center' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-900">{formatNumber(value)}</span>
    },
    {
      key: 'previousTotalMembers' as const,
      header: `${new Date().getFullYear() - 1} Trials`,
      align: 'center' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-900">{formatNumber(value)}</span>
    },
    {
      key: 'totalMembersGrowth' as const,
      header: 'Trials Growth %',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{((value || 0) > 0 ? '+' : '') + (value || 0).toFixed(1)}%</span>
      )
    },
    {
      key: 'currentNewMembers' as const,
      header: `${new Date().getFullYear()} New Members`,
      align: 'center' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-900">{formatNumber(value)}</span>
    },
    {
      key: 'previousNewMembers' as const,
      header: `${new Date().getFullYear() - 1} New Members`,
      align: 'center' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-900">{formatNumber(value)}</span>
    },
    {
      key: 'newMembersGrowth' as const,
      header: 'New Members Growth %',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{((value || 0) > 0 ? '+' : '') + (value || 0).toFixed(1)}%</span>
      )
    },
    {
      key: 'currentConversionRate' as const,
      header: `${new Date().getFullYear()} Conversion %`,
      align: 'center' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-900">{(value || 0).toFixed(1)}%</span>
    },
    {
      key: 'previousConversionRate' as const,
      header: `${new Date().getFullYear() - 1} Conversion %`,
      align: 'center' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-900">{(value || 0).toFixed(1)}%</span>
    },
    {
      key: 'conversionRateGrowth' as const,
      header: 'Conv. Growth',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className={`text-base font-bold ${(value || 0) > 0 ? 'text-green-600' : (value || 0) < 0 ? 'text-red-600' : 'text-slate-600'}`}>
          {(value || 0) > 0 ? '+' : ''}{(value || 0).toFixed(1)}pp
        </span>
      )
    },
    {
      key: 'currentAvgLTV' as const,
      header: `${new Date().getFullYear()} Avg LTV`,
      align: 'right' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-900">{formatCurrency(value || 0)}</span>
    },
    {
      key: 'previousAvgLTV' as const,
      header: `${new Date().getFullYear() - 1} Avg LTV`,
      align: 'right' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-900">{formatCurrency(value || 0)}</span>
    },
    {
      key: 'currentTotalLTV' as const,
      header: `${new Date().getFullYear()} Total LTV`,
      align: 'right' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-900">{formatCurrency(value || 0)}</span>
    },
    {
      key: 'previousTotalLTV' as const,
      header: `${new Date().getFullYear() - 1} Total LTV`,
      align: 'right' as const,
      sortable: true,
      render: (value: number) => <span className="text-sm font-medium text-slate-900">{formatCurrency(value || 0)}</span>
    },
    {
      key: 'avgLTVGrowth' as const,
      header: 'LTV Growth %',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-slate-900">{((value || 0) > 0 ? '+' : '') + (value || 0).toFixed(1)}%</span>
      )
    }
  ];

  const displayedData = React.useMemo(() => {
    if (!sortField) return yearOnYearData;
    const arr = [...yearOnYearData];
    return arr.sort((a: any, b: any) => {
      const av = a[sortField as any];
      const bv = b[sortField as any];
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [yearOnYearData, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDirection('asc'); }
  };

  // Calculate totals with proper null handling
  const totals = {
    month: 'TOTAL',
    currentTotalMembers: yearOnYearData.reduce((sum, row) => sum + (row.currentTotalMembers || 0), 0),
    previousTotalMembers: yearOnYearData.reduce((sum, row) => sum + (row.previousTotalMembers || 0), 0),
    totalMembersGrowth: 0,
    currentNewMembers: yearOnYearData.reduce((sum, row) => sum + (row.currentNewMembers || 0), 0),
    previousNewMembers: yearOnYearData.reduce((sum, row) => sum + (row.previousNewMembers || 0), 0),
    newMembersGrowth: 0,
    currentConversionRate: 0,
    previousConversionRate: 0,
    conversionRateGrowth: 0,
    currentAvgLTV: yearOnYearData.reduce((sum, row) => sum + (row.currentTotalLTV || 0), 0) / Math.max(yearOnYearData.reduce((sum, row) => sum + (row.currentTotalMembers || 0), 0), 1),
    previousAvgLTV: yearOnYearData.reduce((sum, row) => sum + (row.previousTotalLTV || 0), 0) / Math.max(yearOnYearData.reduce((sum, row) => sum + (row.previousTotalMembers || 0), 0), 1),
    avgLTVGrowth: 0
  };

  const totalCurrentConverted = yearOnYearData.reduce((sum, row) => sum + (row.currentConverted || 0), 0);
  const totalPreviousConverted = yearOnYearData.reduce((sum, row) => sum + (row.previousConverted || 0), 0);

  totals.totalMembersGrowth = totals.previousTotalMembers > 0 ? ((totals.currentTotalMembers - totals.previousTotalMembers) / totals.previousTotalMembers) * 100 : 0;
  totals.newMembersGrowth = totals.previousNewMembers > 0 ? ((totals.currentNewMembers - totals.previousNewMembers) / totals.previousNewMembers) * 100 : 0;
  totals.currentConversionRate = totals.currentNewMembers > 0 ? (totalCurrentConverted / totals.currentNewMembers) * 100 : 0;
  totals.previousConversionRate = totals.previousNewMembers > 0 ? (totalPreviousConverted / totals.previousNewMembers) * 100 : 0;
  totals.conversionRateGrowth = totals.previousConversionRate > 0 ? totals.currentConversionRate - totals.previousConversionRate : 0;
  totals.avgLTVGrowth = totals.previousAvgLTV > 0 ? ((totals.currentAvgLTV - totals.previousAvgLTV) / totals.previousAvgLTV) * 100 : 0;

  return (
    <Card className="bg-white shadow-lg border-0">
  <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Year-on-Year Client Conversion Comparison
          <Badge variant="secondary" className="bg-white/20 text-white">
            {new Date().getFullYear()} vs {new Date().getFullYear() - 1}
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
            <li>Largest YoY trials growth month: {(() => {
              const withPrev = yearOnYearData.filter(r => (r.previousTotalMembers || 0) > 0);
              if (withPrev.length === 0) return 'N/A';
              const top = [...withPrev].sort((a,b) => (b.totalMembersGrowth||0)-(a.totalMembersGrowth||0))[0];
              return `${top.month} at ${((top.totalMembersGrowth||0) > 0 ? '+' : '') + (top.totalMembersGrowth||0).toFixed(1)}%`;
            })()}</li>
            <li>Conversion rate change leader: {(() => {
              const withPrev = yearOnYearData.filter(r => (r.previousConversionRate || 0) > 0);
              if (withPrev.length === 0) return 'N/A';
              const top = [...withPrev].sort((a,b) => (b.conversionRateGrowth||0)-(a.conversionRateGrowth||0))[0];
              return `${top.month} at ${((top.conversionRateGrowth||0) > 0 ? '+' : '') + (top.conversionRateGrowth||0).toFixed(1)}pp`;
            })()}</li>
            <li>Avg LTV YoY improvement leader: {(() => {
              const withPrev = yearOnYearData.filter(r => (r.previousAvgLTV || 0) > 0);
              if (withPrev.length === 0) return 'N/A';
              const top = [...withPrev].sort((a,b) => (b.avgLTVGrowth||0)-(a.avgLTVGrowth||0))[0];
              return `${top.month} at ${((top.avgLTVGrowth||0) > 0 ? '+' : '') + (top.avgLTVGrowth||0).toFixed(1)}%`;
            })()}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
