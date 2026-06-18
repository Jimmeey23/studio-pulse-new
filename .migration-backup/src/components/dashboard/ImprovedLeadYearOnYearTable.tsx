
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, TrendingDown, Users, Target, DollarSign, BarChart3, Info, Eye } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ImprovedLeadYearOnYearTableProps {
  data: Record<string, Record<string, any>>;
  years: string[];
  sources: string[];
}

export const ImprovedLeadYearOnYearTable: React.FC<ImprovedLeadYearOnYearTableProps> = ({
  data,
  years,
  sources
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Process data for month-wise year-on-year comparison
  const processedMonthData = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Get months to display (up to current month for current year)
    const monthsToShow = [];
    const maxMonth = currentYear === 2025 ? currentMonth : 12;
    
    for (let month = 1; month <= maxMonth; month++) {
      monthsToShow.push({
        month,
        name: new Date(2025, month - 1).toLocaleString('default', { month: 'short' }),
        fullName: new Date(2025, month - 1).toLocaleString('default', { month: 'long' })
      });
    }

    // Process all leads data by month and year
    const monthlyData: Record<string, any> = {};

    // Initialize months
    monthsToShow.forEach(({ month, name, fullName }) => {
      monthlyData[month] = {
        month,
        name,
        fullName,
        years: {}
      };

      // Initialize each year for this month
      ['2024', '2025'].forEach(year => {
        monthlyData[month].years[year] = {
          totalLeads: 0,
          trialsScheduled: 0,
          trialsCompleted: 0,
          convertedLeads: 0,
          lostLeads: 0,
          totalRevenue: 0,
          totalLTV: 0,
          classesAttended: 0,
          sources: new Set(),
          associates: new Set(),
          avgLTV: 0,
          conversionRate: 0,
          trialCompletionRate: 0,
          trialToConversionRate: 0
        };
      });
    });

    // Aggregate data from all sources
    Object.entries(data).forEach(([source, sourceData]) => {
      Object.entries(sourceData).forEach(([yearMonth, metrics]) => {
        const [year, monthStr] = yearMonth.split('-');
        const month = parseInt(monthStr);
        
        if (monthlyData[month] && ['2024', '2025'].includes(year)) {
          const yearData = monthlyData[month].years[year];
          
          yearData.totalLeads += metrics.totalLeads || 0;
          yearData.trialsCompleted += metrics.trialsCompleted || 0;
          yearData.convertedLeads += metrics.convertedLeads || 0;
          yearData.lostLeads += metrics.lostLeads || 0;
          yearData.totalRevenue += metrics.totalRevenue || 0;
          yearData.totalLTV += metrics.totalRevenue || 0; // Using revenue as LTV proxy
          yearData.classesAttended += metrics.classesAttended || 0;
          yearData.sources.add(source);
          
          // Calculate trials scheduled (assuming some leads schedule trials)
          yearData.trialsScheduled += Math.floor((metrics.totalLeads || 0) * 0.7); // Assume 70% schedule trials
        }
      });
    });

    // Calculate derived metrics
    Object.values(monthlyData).forEach((monthData: any) => {
      Object.values(monthData.years).forEach((yearData: any) => {
        if (yearData.totalLeads > 0) {
          yearData.conversionRate = (yearData.convertedLeads / yearData.totalLeads) * 100;
          yearData.trialCompletionRate = (yearData.trialsCompleted / yearData.trialsScheduled) * 100;
          yearData.avgLTV = yearData.totalLTV / yearData.totalLeads;
        }
        if (yearData.trialsCompleted > 0) {
          yearData.trialToConversionRate = (yearData.convertedLeads / yearData.trialsCompleted) * 100;
        }
      });
    });

    return Object.values(monthlyData);
  }, [data]);

  const toggleRowExpansion = (monthKey: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedRows(newExpanded);
  };

  const getColumns = () => [
    {
      key: 'month',
      header: 'Month',
      render: (value: any, item: any) => (
        <div className="flex items-center gap-2 font-medium">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRowExpansion(item.month.toString())}
            className="p-1 h-6 w-6 opacity-60 hover:opacity-100"
          >
            <Eye className="w-3 h-3" />
          </Button>
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600" />
          <span className="text-slate-800 font-semibold">{item.fullName}</span>
        </div>
      ),
      className: 'min-w-[180px] sticky left-0 bg-white z-10'
    },
    {
      key: 'leads2024',
      header: '2024 Leads',
      render: (value: any, item: any) => (
        <div className="text-center">
          <div className="font-bold text-lg text-slate-700">{formatNumber(item.years['2024'].totalLeads)}</div>
          <div className="text-xs text-slate-500 mt-1">
            Conv: {item.years['2024'].convertedLeads}
          </div>
        </div>
      ),
      align: 'center' as const,
      className: 'min-w-[120px]'
    },
    {
      key: 'leads2025',
      header: '2025 Leads',
      render: (value: any, item: any) => (
        <div className="text-center">
          <div className="font-bold text-lg text-slate-900">{formatNumber(item.years['2025'].totalLeads)}</div>
          <div className="text-xs text-slate-600 mt-1">
            Conv: {item.years['2025'].convertedLeads}
          </div>
        </div>
      ),
      align: 'center' as const,
      className: 'min-w-[120px]'
    },
    {
      key: 'leadGrowth',
      header: 'Lead Growth',
      render: (value: any, item: any) => {
        const growth2024 = item.years['2024'].totalLeads;
        const growth2025 = item.years['2025'].totalLeads;
        const growthRate = growth2024 > 0 ? ((growth2025 - growth2024) / growth2024) * 100 : 0;
        
        return (
          <div className="flex items-center justify-center gap-1">
            {growthRate > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`font-bold ${growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
            </span>
          </div>
        );
      },
      align: 'center' as const,
      className: 'min-w-[120px]'
    },
    {
      key: 'trials2024',
      header: '2024 Trials',
      render: (value: any, item: any) => (
        <div className="text-center">
          <div className="font-bold text-slate-700">
            {formatNumber(item.years['2024'].trialsCompleted)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Scheduled: {formatNumber(item.years['2024'].trialsScheduled)}
          </div>
        </div>
      ),
      align: 'center' as const,
      className: 'min-w-[120px]'
    },
    {
      key: 'trials2025',
      header: '2025 Trials',
      render: (value: any, item: any) => (
        <div className="text-center">
          <div className="font-bold text-slate-900">
            {formatNumber(item.years['2025'].trialsCompleted)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Scheduled: {formatNumber(item.years['2025'].trialsScheduled)}
          </div>
        </div>
      ),
      align: 'center' as const,
      className: 'min-w-[120px]'
    },
    {
      key: 'conversion2024',
      header: '2024 Conversion',
      render: (value: any, item: any) => (
        <div className="text-center">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {item.years['2024'].conversionRate.toFixed(1)}%
          </Badge>
          <div className="text-xs text-slate-500 mt-1">
            Trial→Conv: {item.years['2024'].trialToConversionRate.toFixed(1)}%
          </div>
        </div>
      ),
      align: 'center' as const,
      className: 'min-w-[130px]'
    },
    {
      key: 'conversion2025',
      header: '2025 Conversion',
      render: (value: any, item: any) => (
        <div className="text-center">
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            {item.years['2025'].conversionRate.toFixed(1)}%
          </Badge>
          <div className="text-xs text-slate-600 mt-1">
            Trial→Conv: {item.years['2025'].trialToConversionRate.toFixed(1)}%
          </div>
        </div>
      ),
      align: 'center' as const,
      className: 'min-w-[130px]'
    },
    {
      key: 'revenue2024',
      header: '2024 Revenue',
      render: (value: any, item: any) => (
        <div className="text-center">
          <div className="font-bold text-emerald-600">
            {formatCurrency(item.years['2024'].totalRevenue)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Avg LTV: {formatCurrency(item.years['2024'].avgLTV)}
          </div>
        </div>
      ),
      align: 'center' as const,
      className: 'min-w-[140px]'
    },
    {
      key: 'revenue2025',
      header: '2025 Revenue',
      render: (value: any, item: any) => (
        <div className="text-center">
          <div className="font-bold text-emerald-700">
            {formatCurrency(item.years['2025'].totalRevenue)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Avg LTV: {formatCurrency(item.years['2025'].avgLTV)}
          </div>
        </div>
      ),
      align: 'center' as const,
      className: 'min-w-[140px]'
    }
  ];

  const calculateTotals = () => {
    return processedMonthData.reduce((totals, monthData: any) => ({
      totalLeads2024: totals.totalLeads2024 + monthData.years['2024'].totalLeads,
      totalLeads2025: totals.totalLeads2025 + monthData.years['2025'].totalLeads,
      totalConversions2024: totals.totalConversions2024 + monthData.years['2024'].convertedLeads,
      totalConversions2025: totals.totalConversions2025 + monthData.years['2025'].convertedLeads,
      totalRevenue2024: totals.totalRevenue2024 + monthData.years['2024'].totalRevenue,
      totalRevenue2025: totals.totalRevenue2025 + monthData.years['2025'].totalRevenue,
      totalTrials2024: totals.totalTrials2024 + monthData.years['2024'].trialsCompleted,
      totalTrials2025: totals.totalTrials2025 + monthData.years['2025'].trialsCompleted
    }), {
      totalLeads2024: 0,
      totalLeads2025: 0,
      totalConversions2024: 0,
      totalConversions2025: 0,
      totalRevenue2024: 0,
      totalRevenue2025: 0,
      totalTrials2024: 0,
      totalTrials2025: 0
    });
  };

  const totals = calculateTotals();

  return (
    <Card className="bg-white shadow-xl border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-xl font-bold">
            <BarChart3 className="w-6 h-6" />
            Month-wise Year-on-Year Lead Analysis (2024 vs 2025)
          </CardTitle>
          <Badge variant="secondary" className="bg-white/20 border-white/30 text-white">
            Comprehensive Metrics
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[700px] overflow-auto">
          <ModernDataTable
            data={processedMonthData}
            columns={getColumns()}
            loading={false}
            stickyHeader={true}
            maxHeight="600px"
            className="rounded-none"
          />
        </div>

        {/* Expanded Row Details */}
        {Array.from(expandedRows).map(monthKey => {
          const monthData = processedMonthData.find(m => m.month.toString() === monthKey);
          if (!monthData) return null;

          return (
            <div key={monthKey} className="bg-slate-50 border-t p-6">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Detailed Analysis: {monthData.fullName}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <p className="text-slate-600 text-sm font-medium mb-3">2024 Performance</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Leads:</span>
                      <span className="font-bold text-blue-600">{formatNumber(monthData.years['2024'].totalLeads)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trials Completed:</span>
                      <span className="font-bold text-purple-600">{formatNumber(monthData.years['2024'].trialsCompleted)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Converted:</span>
                      <span className="font-bold text-green-600">{formatNumber(monthData.years['2024'].convertedLeads)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Revenue:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(monthData.years['2024'].totalRevenue)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <p className="text-slate-600 text-sm font-medium mb-3">2025 Performance</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Leads:</span>
                      <span className="font-bold text-blue-600">{formatNumber(monthData.years['2025'].totalLeads)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trials Completed:</span>
                      <span className="font-bold text-purple-600">{formatNumber(monthData.years['2025'].trialsCompleted)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Converted:</span>
                      <span className="font-bold text-green-600">{formatNumber(monthData.years['2025'].convertedLeads)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Revenue:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(monthData.years['2025'].totalRevenue)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <p className="text-slate-600 text-sm font-medium mb-3">Conversion Rates</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">2024 Lead Conv:</span>
                      <span className="font-bold">{monthData.years['2024'].conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">2025 Lead Conv:</span>
                      <span className="font-bold">{monthData.years['2025'].conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">2024 Trial Conv:</span>
                      <span className="font-bold">{monthData.years['2024'].trialToConversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">2025 Trial Conv:</span>
                      <span className="font-bold">{monthData.years['2025'].trialToConversionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <p className="text-slate-600 text-sm font-medium mb-3">Growth Analysis</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lead Growth:</span>
                      <span className={`font-bold ${monthData.years['2024'].totalLeads > 0 ? 
                        ((monthData.years['2025'].totalLeads - monthData.years['2024'].totalLeads) / monthData.years['2024'].totalLeads) * 100 > 0 ? 'text-green-600' : 'text-red-600'
                        : 'text-slate-600'}`}>
                        {monthData.years['2024'].totalLeads > 0 ? 
                          `${((monthData.years['2025'].totalLeads - monthData.years['2024'].totalLeads) / monthData.years['2024'].totalLeads) * 100 > 0 ? '+' : ''}${(((monthData.years['2025'].totalLeads - monthData.years['2024'].totalLeads) / monthData.years['2024'].totalLeads) * 100).toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Revenue Growth:</span>
                      <span className={`font-bold ${monthData.years['2024'].totalRevenue > 0 ? 
                        ((monthData.years['2025'].totalRevenue - monthData.years['2024'].totalRevenue) / monthData.years['2024'].totalRevenue) * 100 > 0 ? 'text-green-600' : 'text-red-600'
                        : 'text-slate-600'}`}>
                        {monthData.years['2024'].totalRevenue > 0 ? 
                          `${((monthData.years['2025'].totalRevenue - monthData.years['2024'].totalRevenue) / monthData.years['2024'].totalRevenue) * 100 > 0 ? '+' : ''}${(((monthData.years['2025'].totalRevenue - monthData.years['2024'].totalRevenue) / monthData.years['2024'].totalRevenue) * 100).toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>

      {/* Enhanced Summary */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-6">
        <h4 className="font-bold text-lg mb-4 text-center">Overall Year-on-Year Performance Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-300">
              {formatNumber(totals.totalLeads2024)} → {formatNumber(totals.totalLeads2025)}
            </div>
            <div className="text-sm text-slate-300">Total Leads (2024 → 2025)</div>
            <div className={`text-sm font-semibold mt-1 ${totals.totalLeads2024 > 0 ? 
              ((totals.totalLeads2025 - totals.totalLeads2024) / totals.totalLeads2024) * 100 > 0 ? 'text-green-400' : 'text-red-400'
              : 'text-slate-400'}`}>
              {totals.totalLeads2024 > 0 ? 
                `${((totals.totalLeads2025 - totals.totalLeads2024) / totals.totalLeads2024) * 100 > 0 ? '+' : ''}${(((totals.totalLeads2025 - totals.totalLeads2024) / totals.totalLeads2024) * 100).toFixed(1)}%`
                : 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-300">
              {formatNumber(totals.totalConversions2024)} → {formatNumber(totals.totalConversions2025)}
            </div>
            <div className="text-sm text-slate-300">Conversions (2024 → 2025)</div>
            <div className={`text-sm font-semibold mt-1 ${totals.totalConversions2024 > 0 ? 
              ((totals.totalConversions2025 - totals.totalConversions2024) / totals.totalConversions2024) * 100 > 0 ? 'text-green-400' : 'text-red-400'
              : 'text-slate-400'}`}>
              {totals.totalConversions2024 > 0 ? 
                `${((totals.totalConversions2025 - totals.totalConversions2024) / totals.totalConversions2024) * 100 > 0 ? '+' : ''}${(((totals.totalConversions2025 - totals.totalConversions2024) / totals.totalConversions2024) * 100).toFixed(1)}%`
                : 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-300">
              {totals.totalLeads2024 > 0 ? (totals.totalConversions2024 / totals.totalLeads2024 * 100).toFixed(1) : '0.0'}% → {totals.totalLeads2025 > 0 ? (totals.totalConversions2025 / totals.totalLeads2025 * 100).toFixed(1) : '0.0'}%
            </div>
            <div className="text-sm text-slate-300">Conversion Rate (2024 → 2025)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-300">
              {formatCurrency(totals.totalRevenue2024)} → {formatCurrency(totals.totalRevenue2025)}
            </div>
            <div className="text-sm text-slate-300">Revenue (2024 → 2025)</div>
            <div className={`text-sm font-semibold mt-1 ${totals.totalRevenue2024 > 0 ? 
              ((totals.totalRevenue2025 - totals.totalRevenue2024) / totals.totalRevenue2024) * 100 > 0 ? 'text-green-400' : 'text-red-400'
              : 'text-slate-400'}`}>
              {totals.totalRevenue2024 > 0 ? 
                `${((totals.totalRevenue2025 - totals.totalRevenue2024) / totals.totalRevenue2024) * 100 > 0 ? '+' : ''}${(((totals.totalRevenue2025 - totals.totalRevenue2024) / totals.totalRevenue2024) * 100).toFixed(1)}%`
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
