import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [activeTab, setActiveTab] = React.useState<'values' | 'growth'>('values');
  
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const yearOnYearData = React.useMemo(() => {
    // Generate all 12 months regardless of data
    const allMonths = Array.from({ length: 12 }, (_, i) => {
      const monthNumber = i + 1;
      const monthName = new Date(2024, i).toLocaleDateString('en-US', { month: 'short' });
      return { monthName, monthNumber, key: monthName };
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
      
      if (dateStr.includes('/')) {
        const parts = dateStr.split(' ')[0].split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      if ((year === currentYear || year === previousYear) && monthlyStats[monthName]) {
        const yearData = year === currentYear ? monthlyStats[monthName].currentYear : monthlyStats[monthName].previousYear;
        yearData.totalMembers++;
        yearData.clients.push(client);
        
        if ((client.isNew || '').toLowerCase().includes('new')) {
          yearData.newMembers++;
        }
        if (client.conversionStatus === 'Converted') {
          yearData.converted++;
        }
        if (client.retentionStatus === 'Retained') {
          yearData.retained++;
        }
        yearData.totalLTV += client.ltv || 0;
      }
    });

    // Populate visits data from visitsSummary
    if (visitsSummary) {
      Object.values(monthlyStats).forEach((stat: any) => {
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
  }, [data, currentYear, previousYear, visitsSummary]);

  // Side-by-side columns for Values tab
  const valuesColumns = [
    {
      key: 'month' as const,
      header: 'Month',
      className: 'font-semibold min-w-[70px]',
      sortable: true,
      render: (value: string) => <span className="text-sm font-bold text-slate-800">{value}</span>
    },
    {
      key: 'trials' as const,
      header: 'Trials',
      align: 'center' as const,
      render: (_: any, row: any) => (
        <div className="flex items-center justify-center gap-3">
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">{previousYear}</div>
            <div className="text-sm font-semibold text-slate-700">{formatNumber(row.previousTotalMembers)}</div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">{currentYear}</div>
            <div className="text-sm font-semibold text-slate-900">{formatNumber(row.currentTotalMembers)}</div>
          </div>
        </div>
      )
    },
    {
      key: 'newMembers' as const,
      header: 'New Members',
      align: 'center' as const,
      render: (_: any, row: any) => (
        <div className="flex items-center justify-center gap-3">
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">{previousYear}</div>
            <div className="text-sm font-semibold text-slate-700">{formatNumber(row.previousNewMembers)}</div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">{currentYear}</div>
            <div className="text-sm font-semibold text-slate-900">{formatNumber(row.currentNewMembers)}</div>
          </div>
        </div>
      )
    },
    {
      key: 'converted' as const,
      header: 'Converted',
      align: 'center' as const,
      render: (_: any, row: any) => (
        <div className="flex items-center justify-center gap-3">
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">{previousYear}</div>
            <div className="text-sm font-semibold text-slate-700">{formatNumber(row.previousConverted)}</div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">{currentYear}</div>
            <div className="text-sm font-semibold text-slate-900">{formatNumber(row.currentConverted)}</div>
          </div>
        </div>
      )
    },
    {
      key: 'conversionRate' as const,
      header: 'Conversion %',
      align: 'center' as const,
      render: (_: any, row: any) => (
        <div className="flex items-center justify-center gap-3">
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">{previousYear}</div>
            <div className="text-sm font-semibold text-slate-700">{(row.previousConversionRate || 0).toFixed(1)}%</div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">{currentYear}</div>
            <div className="text-sm font-semibold text-slate-900">{(row.currentConversionRate || 0).toFixed(1)}%</div>
          </div>
        </div>
      )
    },
    {
      key: 'avgLTV' as const,
      header: 'Avg LTV',
      align: 'center' as const,
      render: (_: any, row: any) => (
        <div className="flex items-center justify-center gap-3">
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">{previousYear}</div>
            <div className="text-sm font-semibold text-slate-700">{formatCurrency(row.previousAvgLTV || 0)}</div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">{currentYear}</div>
            <div className="text-sm font-semibold text-slate-900">{formatCurrency(row.currentAvgLTV || 0)}</div>
          </div>
        </div>
      )
    },
    {
      key: 'totalLTV' as const,
      header: 'Total LTV',
      align: 'center' as const,
      render: (_: any, row: any) => (
        <div className="flex items-center justify-center gap-3">
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">{previousYear}</div>
            <div className="text-sm font-semibold text-slate-700">{formatCurrency(row.previousTotalLTV || 0)}</div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">{currentYear}</div>
            <div className="text-sm font-semibold text-slate-900">{formatCurrency(row.currentTotalLTV || 0)}</div>
          </div>
        </div>
      )
    }
  ];

  // Growth columns with colored indicators
  const growthColumns = [
    {
      key: 'month' as const,
      header: 'Month',
      className: 'font-semibold min-w-[70px]',
      sortable: true,
      render: (value: string) => <span className="text-sm font-bold text-slate-800">{value}</span>
    },
    {
      key: 'totalMembersGrowth' as const,
      header: 'Trials Growth',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => {
        const v = value || 0;
        const isPositive = v > 0;
        const isNegative = v < 0;
        return (
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${
            isPositive ? 'bg-emerald-50 text-emerald-700' : 
            isNegative ? 'bg-red-50 text-red-700' : 
            'bg-slate-100 text-slate-600'
          }`}>
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {isPositive ? '+' : ''}{v.toFixed(1)}%
          </div>
        );
      }
    },
    {
      key: 'newMembersGrowth' as const,
      header: 'New Members Growth',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => {
        const v = value || 0;
        const isPositive = v > 0;
        const isNegative = v < 0;
        return (
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${
            isPositive ? 'bg-emerald-50 text-emerald-700' : 
            isNegative ? 'bg-red-50 text-red-700' : 
            'bg-slate-100 text-slate-600'
          }`}>
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {isPositive ? '+' : ''}{v.toFixed(1)}%
          </div>
        );
      }
    },
    {
      key: 'conversionRateGrowth' as const,
      header: 'Conversion Growth',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => {
        const v = value || 0;
        const isPositive = v > 0;
        const isNegative = v < 0;
        return (
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${
            isPositive ? 'bg-emerald-50 text-emerald-700' : 
            isNegative ? 'bg-red-50 text-red-700' : 
            'bg-slate-100 text-slate-600'
          }`}>
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {isPositive ? '+' : ''}{v.toFixed(1)}pp
          </div>
        );
      }
    },
    {
      key: 'retentionRateGrowth' as const,
      header: 'Retention Growth',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => {
        const v = value || 0;
        const isPositive = v > 0;
        const isNegative = v < 0;
        return (
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${
            isPositive ? 'bg-emerald-50 text-emerald-700' : 
            isNegative ? 'bg-red-50 text-red-700' : 
            'bg-slate-100 text-slate-600'
          }`}>
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {isPositive ? '+' : ''}{v.toFixed(1)}pp
          </div>
        );
      }
    },
    {
      key: 'avgLTVGrowth' as const,
      header: 'Avg LTV Growth',
      align: 'center' as const,
      sortable: true,
      render: (value: number) => {
        const v = value || 0;
        const isPositive = v > 0;
        const isNegative = v < 0;
        return (
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${
            isPositive ? 'bg-emerald-50 text-emerald-700' : 
            isNegative ? 'bg-red-50 text-red-700' : 
            'bg-slate-100 text-slate-600'
          }`}>
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {isPositive ? '+' : ''}{v.toFixed(1)}%
          </div>
        );
      }
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

  // Calculate totals
  const totals = React.useMemo(() => {
    const t = {
      month: 'TOTAL',
      currentTotalMembers: yearOnYearData.reduce((sum, row) => sum + (row.currentTotalMembers || 0), 0),
      previousTotalMembers: yearOnYearData.reduce((sum, row) => sum + (row.previousTotalMembers || 0), 0),
      totalMembersGrowth: 0,
      currentNewMembers: yearOnYearData.reduce((sum, row) => sum + (row.currentNewMembers || 0), 0),
      previousNewMembers: yearOnYearData.reduce((sum, row) => sum + (row.previousNewMembers || 0), 0),
      newMembersGrowth: 0,
      currentConverted: yearOnYearData.reduce((sum, row) => sum + (row.currentConverted || 0), 0),
      previousConverted: yearOnYearData.reduce((sum, row) => sum + (row.previousConverted || 0), 0),
      currentConversionRate: 0,
      previousConversionRate: 0,
      conversionRateGrowth: 0,
      currentRetained: yearOnYearData.reduce((sum, row) => sum + (row.currentRetained || 0), 0),
      previousRetained: yearOnYearData.reduce((sum, row) => sum + (row.previousRetained || 0), 0),
      currentRetentionRate: 0,
      previousRetentionRate: 0,
      retentionRateGrowth: 0,
      currentTotalLTV: yearOnYearData.reduce((sum, row) => sum + (row.currentTotalLTV || 0), 0),
      previousTotalLTV: yearOnYearData.reduce((sum, row) => sum + (row.previousTotalLTV || 0), 0),
      currentAvgLTV: 0,
      previousAvgLTV: 0,
      avgLTVGrowth: 0
    };

    t.totalMembersGrowth = t.previousTotalMembers > 0 ? ((t.currentTotalMembers - t.previousTotalMembers) / t.previousTotalMembers) * 100 : 0;
    t.newMembersGrowth = t.previousNewMembers > 0 ? ((t.currentNewMembers - t.previousNewMembers) / t.previousNewMembers) * 100 : 0;
    t.currentConversionRate = t.currentNewMembers > 0 ? (t.currentConverted / t.currentNewMembers) * 100 : 0;
    t.previousConversionRate = t.previousNewMembers > 0 ? (t.previousConverted / t.previousNewMembers) * 100 : 0;
    t.conversionRateGrowth = t.previousConversionRate > 0 ? t.currentConversionRate - t.previousConversionRate : 0;
    t.currentRetentionRate = t.currentNewMembers > 0 ? (t.currentRetained / t.currentNewMembers) * 100 : 0;
    t.previousRetentionRate = t.previousNewMembers > 0 ? (t.previousRetained / t.previousNewMembers) * 100 : 0;
    t.retentionRateGrowth = t.previousRetentionRate > 0 ? t.currentRetentionRate - t.previousRetentionRate : 0;
    t.currentAvgLTV = t.currentTotalMembers > 0 ? t.currentTotalLTV / t.currentTotalMembers : 0;
    t.previousAvgLTV = t.previousTotalMembers > 0 ? t.previousTotalLTV / t.previousTotalMembers : 0;
    t.avgLTVGrowth = t.previousAvgLTV > 0 ? ((t.currentAvgLTV - t.previousAvgLTV) / t.previousAvgLTV) * 100 : 0;
    
    return t;
  }, [yearOnYearData]);

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Year-on-Year Client Conversion Comparison
            <Badge variant="secondary" className="bg-white/20 text-white">
              {currentYear} vs {previousYear}
            </Badge>
          </CardTitle>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'values' | 'growth')} className="w-auto">
            <TabsList className="bg-white/10 border border-white/20">
              <TabsTrigger 
                value="values" 
                className="text-white/70 data-[state=active]:bg-white data-[state=active]:text-slate-900 px-4"
              >
                Values
              </TabsTrigger>
              <TabsTrigger 
                value="growth" 
                className="text-white/70 data-[state=active]:bg-white data-[state=active]:text-slate-900 px-4"
              >
                Growth %
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {activeTab === 'values' ? (
          <ModernDataTable
            data={displayedData}
            columns={valuesColumns}
            headerGradient="from-slate-800 via-slate-900 to-slate-800"
            showFooter={false}
            maxHeight="600px"
            onRowClick={onRowClick}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            tableId="YoY Conversion Values"
          />
        ) : (
          <ModernDataTable
            data={displayedData}
            columns={growthColumns}
            headerGradient="from-slate-800 via-slate-900 to-slate-800"
            showFooter={true}
            footerData={totals}
            maxHeight="600px"
            onRowClick={onRowClick}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            tableId="YoY Conversion Growth"
          />
        )}
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
