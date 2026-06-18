
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, TrendingDown, BarChart3, Target, Users, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { LeadsData } from '@/types/leads';

interface LeadMonthOnMonthAnalyticsProps {
  data: LeadsData[];
  filters?: any;
}

export const LeadMonthOnMonthAnalytics: React.FC<LeadMonthOnMonthAnalyticsProps> = ({
  data,
  filters
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('totalLeads');

  const processedData = useMemo(() => {
    // Apply filters to data
    let filteredData = data;
    if (filters) {
      filteredData = data.filter(lead => {
        // Month-on-month analytics intentionally ignore date range filters so historical columns remain visible.
        if (filters.location?.length > 0 && !filters.location.includes(lead.center)) return false;
        if (filters.source?.length > 0 && !filters.source.includes(lead.source)) return false;
        if (filters.stage?.length > 0 && !filters.stage.includes(lead.stage)) return false;
        if (filters.status?.length > 0 && !filters.status.includes(lead.status)) return false;
        if (filters.associate?.length > 0 && !filters.associate.includes(lead.associate)) return false;
        if (filters.channel?.length > 0 && !filters.channel.includes(lead.channel)) return false;
        if (filters.trialStatus?.length > 0 && !filters.trialStatus.includes(lead.trialStatus)) return false;
        if (filters.conversionStatus?.length > 0 && !filters.conversionStatus.includes(lead.conversionStatus)) return false;
        if (filters.retentionStatus?.length > 0 && !filters.retentionStatus.includes(lead.retentionStatus)) return false;
        if (filters.minLTV !== undefined && (lead.ltv || 0) < filters.minLTV) return false;
        if (filters.maxLTV !== undefined && (lead.ltv || 0) > filters.maxLTV) return false;
        return true;
      });
    }

    // Group by month
    const monthlyData = filteredData.reduce((acc, lead) => {
      if (!lead.createdAt) return acc;
      
      const date = new Date(lead.createdAt);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          monthKey,
          totalLeads: 0,
          trialsCompleted: 0,
          trialsScheduled: 0,
          convertedLeads: 0,
          lostLeads: 0,
          totalLTV: 0,
          totalRevenue: 0,
          uniqueSources: new Set(),
          uniqueAssociates: new Set(),
          uniqueLocations: new Set(),
          stageBreakdown: {},
          sourceBreakdown: {},
          associateBreakdown: {},
          locationBreakdown: {}
        };
      }

      const monthData = acc[monthKey];
      monthData.totalLeads += 1;
      monthData.totalLTV += lead.ltv || 0;
      monthData.totalRevenue += lead.ltv || 0;
      
      // Count trials completed
      if (lead.stage === 'Trial Completed') {
        monthData.trialsCompleted += 1;
      }
      
      // Count scheduled trials (assuming some logic based on stage or status)
      if (lead.stage && (lead.stage.includes('Trial') || lead.stage.includes('Scheduled'))) {
        monthData.trialsScheduled += 1;
      }
      
      // Count conversions
      if (lead.conversionStatus === 'Converted' || lead.status === 'Won') {
        monthData.convertedLeads += 1;
      }
      
      // Count lost leads
      if (lead.status === 'Lost' || lead.conversionStatus === 'Lost') {
        monthData.lostLeads += 1;
      }
      
      // Track unique values
      monthData.uniqueSources.add(lead.source);
      monthData.uniqueAssociates.add(lead.associate);
      monthData.uniqueLocations.add(lead.center);
      
      // Track breakdowns
      monthData.stageBreakdown[lead.stage] = (monthData.stageBreakdown[lead.stage] || 0) + 1;
      monthData.sourceBreakdown[lead.source] = (monthData.sourceBreakdown[lead.source] || 0) + 1;
      monthData.associateBreakdown[lead.associate] = (monthData.associateBreakdown[lead.associate] || 0) + 1;
      monthData.locationBreakdown[lead.center] = (monthData.locationBreakdown[lead.center] || 0) + 1;
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate derived metrics and MoM changes
    const months = Object.keys(monthlyData).sort();
    return months.map((monthKey, index) => {
      const current = monthlyData[monthKey];
      const previous = index > 0 ? monthlyData[months[index - 1]] : null;

      // Calculate conversion rates
      const leadToTrialRate = current.totalLeads > 0 ? (current.trialsCompleted / current.totalLeads) * 100 : 0;
      const trialToConversionRate = current.trialsCompleted > 0 ? (current.convertedLeads / current.trialsCompleted) * 100 : 0;
      const overallConversionRate = current.totalLeads > 0 ? (current.convertedLeads / current.totalLeads) * 100 : 0;
      const avgLTV = current.totalLeads > 0 ? current.totalLTV / current.totalLeads : 0;

      // Calculate MoM changes
      const calculateChange = (currentVal: number, previousVal: number) => {
        if (!previous || previousVal === 0) return 0;
        return ((currentVal - previousVal) / previousVal) * 100;
      };

      return {
        ...current,
        leadToTrialRate,
        trialToConversionRate,
        overallConversionRate,
        avgLTV,
        uniqueSourcesCount: current.uniqueSources.size,
        uniqueAssociatesCount: current.uniqueAssociates.size,
        uniqueLocationsCount: current.uniqueLocations.size,
        // MoM changes
        totalLeadsChange: previous ? calculateChange(current.totalLeads, previous.totalLeads) : 0,
        trialsCompletedChange: previous ? calculateChange(current.trialsCompleted, previous.trialsCompleted) : 0,
        convertedLeadsChange: previous ? calculateChange(current.convertedLeads, previous.convertedLeads) : 0,
        revenueChange: previous ? calculateChange(current.totalRevenue, previous.totalRevenue) : 0,
        conversionRateChange: previous ? calculateChange(overallConversionRate, 
          previous.totalLeads > 0 ? (previous.convertedLeads / previous.totalLeads) * 100 : 0) : 0
      };
    }).reverse(); // Most recent first
  }, [data, filters]);

  const metricOptions = [
    { value: 'totalLeads', label: 'Total Leads', icon: Users },
    { value: 'trialsCompleted', label: 'Trials Completed', icon: Target },
    { value: 'convertedLeads', label: 'Conversions', icon: TrendingUp },
    { value: 'overallConversionRate', label: 'Conversion Rate', icon: BarChart3 },
    { value: 'totalRevenue', label: 'Revenue', icon: DollarSign },
    { value: 'avgLTV', label: 'Average LTV', icon: TrendingUp }
  ];

  const columns = [
    {
      key: 'month',
      header: 'Month',
      render: (value: string) => <span className="font-semibold text-slate-800">{value}</span>,
      className: 'min-w-[150px] sticky left-0 bg-white z-10'
    },
    {
      key: 'totalLeads',
      header: 'Total Leads',
      render: (value: number, item: any) => (
        <div className="text-center">
          <div className="font-bold text-lg">{formatNumber(value)}</div>
          {item.totalLeadsChange !== 0 && (
            <Badge variant={item.totalLeadsChange > 0 ? "default" : "destructive"} className="text-xs mt-1">
              {item.totalLeadsChange > 0 ? '+' : ''}{item.totalLeadsChange.toFixed(1)}%
            </Badge>
          )}
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'trialsCompleted',
      header: 'Trials Completed',
      render: (value: number, item: any) => (
        <div className="text-center">
          <div className="font-bold text-lg text-blue-600">{formatNumber(value)}</div>
          {item.trialsCompletedChange !== 0 && (
            <Badge variant={item.trialsCompletedChange > 0 ? "default" : "destructive"} className="text-xs mt-1">
              {item.trialsCompletedChange > 0 ? '+' : ''}{item.trialsCompletedChange.toFixed(1)}%
            </Badge>
          )}
          <div className="text-xs text-slate-500 mt-1">
            {item.leadToTrialRate.toFixed(1)}% of leads
          </div>
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'convertedLeads',
      header: 'Conversions',
      render: (value: number, item: any) => (
        <div className="text-center">
          <div className="font-bold text-lg text-green-600">{formatNumber(value)}</div>
          {item.convertedLeadsChange !== 0 && (
            <Badge variant={item.convertedLeadsChange > 0 ? "default" : "destructive"} className="text-xs mt-1">
              {item.convertedLeadsChange > 0 ? '+' : ''}{item.convertedLeadsChange.toFixed(1)}%
            </Badge>
          )}
          <div className="text-xs text-slate-500 mt-1">
            {item.overallConversionRate.toFixed(1)}% rate
          </div>
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'totalRevenue',
      header: 'Revenue',
      render: (value: number, item: any) => (
        <div className="text-center">
          <div className="font-bold text-lg text-emerald-600">{formatCurrency(value)}</div>
          {item.revenueChange !== 0 && (
            <Badge variant={item.revenueChange > 0 ? "default" : "destructive"} className="text-xs mt-1">
              {item.revenueChange > 0 ? '+' : ''}{item.revenueChange.toFixed(1)}%
            </Badge>
          )}
          <div className="text-xs text-slate-500 mt-1">
            Avg: {formatCurrency(item.avgLTV)}
          </div>
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'uniqueSourcesCount',
      header: 'Sources',
      render: (value: number) => (
        <div className="text-center">
          <Badge variant="outline" className="text-purple-600 border-purple-200">
            {value} sources
          </Badge>
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'uniqueAssociatesCount',
      header: 'Associates',
      render: (value: number) => (
        <div className="text-center">
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            {value} associates
          </Badge>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <Card className="bg-white shadow-xl border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-xl font-bold">
            <Calendar className="w-6 h-6" />
            Month-on-Month Lead Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="w-4 h-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-auto">
          <ModernDataTable
            data={processedData}
            columns={columns}
            loading={false}
            stickyHeader={true}
            maxHeight="500px"
            className="rounded-none"
          />
        </div>
      </CardContent>
    </Card>
  );
};
