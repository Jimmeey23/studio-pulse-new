
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Users, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { LeadsData } from '@/types/leads';

interface LeadConversionAnalyticsTableProps {
  data: LeadsData[];
}

export const LeadConversionAnalyticsTable: React.FC<LeadConversionAnalyticsTableProps> = ({ data }) => {
  const analyticsData = useMemo(() => {
    // Group by source and calculate conversion metrics
    const sourceMetrics = data.reduce((acc, lead) => {
      const source = lead.source || 'Unknown';
      
      if (!acc[source]) {
        acc[source] = {
          source,
          totalLeads: 0,
          trialsCompleted: 0,
          conversions: 0,
          totalRevenue: 0,
          avgLTV: 0,
          conversionRate: 0,
          trialCompletionRate: 0,
          revenuePerLead: 0
        };
      }

      acc[source].totalLeads++;
      acc[source].totalRevenue += lead.ltv || 0;

      if (lead.trialStatus === 'Completed') {
        acc[source].trialsCompleted++;
      }

      if (lead.conversionStatus === 'Converted') {
        acc[source].conversions++;
      }

      return acc;
    }, {} as Record<string, any>);

    // Calculate derived metrics
    Object.values(sourceMetrics).forEach((metrics: any) => {
      metrics.conversionRate = metrics.totalLeads > 0 ? (metrics.conversions / metrics.totalLeads) * 100 : 0;
      metrics.trialCompletionRate = metrics.totalLeads > 0 ? (metrics.trialsCompleted / metrics.totalLeads) * 100 : 0;
      metrics.avgLTV = metrics.conversions > 0 ? metrics.totalRevenue / metrics.conversions : 0;
      metrics.revenuePerLead = metrics.totalLeads > 0 ? metrics.totalRevenue / metrics.totalLeads : 0;
    });

    return Object.values(sourceMetrics).sort((a: any, b: any) => b.totalLeads - a.totalLeads);
  }, [data]);

  const columns = [
    {
      key: 'source',
      header: 'Lead Source',
      render: (value: string) => (
        <div className="flex items-center gap-2 font-medium">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
          <span className="text-slate-800">{value}</span>
        </div>
      ),
      className: 'min-w-[200px]'
    },
    {
      key: 'totalLeads',
      header: 'Total Leads',
      render: (value: number) => (
        <div className="text-center font-bold text-blue-600">
          {formatNumber(value)}
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'trialsCompleted',
      header: 'Trials Completed',
      render: (value: number) => (
        <div className="text-center font-bold text-purple-600">
          {formatNumber(value)}
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'conversions',
      header: 'Conversions',
      render: (value: number) => (
        <div className="text-center font-bold text-green-600">
          {formatNumber(value)}
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'conversionRate',
      header: 'Conversion Rate',
      render: (value: number) => (
        <Badge variant="secondary" className={`${value >= 20 ? 'bg-green-100 text-green-700' : value >= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
          {value.toFixed(1)}%
        </Badge>
      ),
      align: 'center' as const
    },
    {
      key: 'trialCompletionRate',
      header: 'Trial Rate',
      render: (value: number) => (
        <Badge variant="outline" className="text-purple-600">
          {value.toFixed(1)}%
        </Badge>
      ),
      align: 'center' as const
    },
    {
      key: 'avgLTV',
      header: 'Avg LTV',
      render: (value: number) => (
        <div className="text-center font-bold text-emerald-600">
          {formatCurrency(value)}
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'totalRevenue',
      header: 'Total Revenue',
      render: (value: number) => (
        <div className="text-center font-bold text-emerald-700">
          {formatCurrency(value)}
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'revenuePerLead',
      header: 'Revenue/Lead',
      render: (value: number) => (
        <div className="text-center font-medium text-slate-700">
          {formatCurrency(value)}
        </div>
      ),
      align: 'center' as const
    }
  ];

  const totals = useMemo(() => {
    return analyticsData.reduce((acc, item: any) => ({
      totalLeads: acc.totalLeads + item.totalLeads,
      totalTrials: acc.totalTrials + item.trialsCompleted,
      totalConversions: acc.totalConversions + item.conversions,
      totalRevenue: acc.totalRevenue + item.totalRevenue
    }), { totalLeads: 0, totalTrials: 0, totalConversions: 0, totalRevenue: 0 });
  }, [analyticsData]);

  return (
    <Card className="bg-white shadow-xl border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <CardTitle className="text-white flex items-center gap-2 text-xl font-bold">
          <Target className="w-6 h-6" />
          Lead Source Conversion Analytics
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <ModernDataTable
          data={analyticsData}
          columns={columns}
          showFooter={true}
          footerData={{
            source: 'TOTAL',
            totalLeads: totals.totalLeads,
            trialsCompleted: totals.totalTrials,
            conversions: totals.totalConversions,
            conversionRate: totals.totalLeads > 0 ? (totals.totalConversions / totals.totalLeads) * 100 : 0,
            trialCompletionRate: totals.totalLeads > 0 ? (totals.totalTrials / totals.totalLeads) * 100 : 0,
            avgLTV: totals.totalConversions > 0 ? totals.totalRevenue / totals.totalConversions : 0,
            totalRevenue: totals.totalRevenue,
            revenuePerLead: totals.totalLeads > 0 ? totals.totalRevenue / totals.totalLeads : 0
          }}
          maxHeight="500px"
          stickyHeader={true}
        />

        <div className="p-6 bg-slate-50 border-t">
          <h4 className="font-semibold text-slate-800 mb-4">Key Insights</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-slate-700">Total Leads</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{formatNumber(totals.totalLeads)}</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-600" />
                <span className="font-medium text-slate-700">Conversions</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{formatNumber(totals.totalConversions)}</div>
              <div className="text-sm text-slate-500">
                {totals.totalLeads > 0 ? ((totals.totalConversions / totals.totalLeads) * 100).toFixed(1) : '0.0'}% rate
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-slate-700">Trials</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{formatNumber(totals.totalTrials)}</div>
              <div className="text-sm text-slate-500">
                {totals.totalLeads > 0 ? ((totals.totalTrials / totals.totalLeads) * 100).toFixed(1) : '0.0'}% rate
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-slate-700">Revenue</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.totalRevenue)}</div>
              <div className="text-sm text-slate-500">
                {formatCurrency(totals.totalLeads > 0 ? totals.totalRevenue / totals.totalLeads : 0)} per lead
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
