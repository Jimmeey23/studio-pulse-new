import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedTable } from '@/components/ui/OptimizedTable';
import { TrendingUp, TrendingDown, Target, Users, Percent, DollarSign, Activity, ArrowRight, Eye, BarChart3, Info } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
interface LeadSourcePerformanceTableProps {
  data: any[];
  title?: string;
}
export const ImprovedLeadSourcePerformanceTable: React.FC<LeadSourcePerformanceTableProps> = ({
  data,
  title = "Lead Source Performance Analytics"
}) => {
  const [sortBy, setSortBy] = useState<string>('totalLeads');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const safeToFixed = (value: any, decimals: number = 1): string => {
    const num = Number(value);
    return isNaN(num) || num === null || num === undefined ? '0.0' : num.toFixed(decimals);
  };
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) || num === null || num === undefined ? 0 : num;
  };
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const sourceMap = new Map();
    data.forEach(lead => {
      const source = lead.source || 'Unknown';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          source,
          totalLeads: 0,
          totalTrials: 0,
          totalMembers: 0,
          totalRevenue: 0,
          totalLost: 0,
          leadToTrialConversion: 0,
          trialToMemberConversion: 0,
          trialsCompleted: 0,
          converted: 0,
          lostRate: 0
        });
      }
      const sourceData = sourceMap.get(source);
      sourceData.totalLeads += 1;
      if (lead.stage === 'Trial Completed' || lead.trialStatus === 'Completed') {
        sourceData.totalTrials += 1;
        sourceData.trialsCompleted += 1;
      }
      if (lead.conversionStatus === 'Converted') {
        sourceData.totalMembers += 1;
        sourceData.converted += 1;
      }
      if (lead.conversionStatus === 'Lost' || lead.stage === 'Lost') {
        sourceData.totalLost += 1;
      }
      sourceData.totalRevenue += safeNumber(lead.ltv);
    });
    return Array.from(sourceMap.values()).map(source => ({
      ...source,
      leadToTrialConversion: source.totalLeads > 0 ? source.totalTrials / source.totalLeads * 100 : 0,
      trialToMemberConversion: source.totalTrials > 0 ? source.totalMembers / source.totalTrials * 100 : 0,
      overallConversion: source.totalLeads > 0 ? source.totalMembers / source.totalLeads * 100 : 0,
      lostRate: source.totalLeads > 0 ? source.totalLost / source.totalLeads * 100 : 0
    })).sort((a, b) => {
      const aValue = safeNumber(a[sortBy]);
      const bValue = safeNumber(b[sortBy]);
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [data, sortBy, sortOrder]);
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  const handleSourceClick = (source: string) => {
    setSelectedSource(selectedSource === source ? null : source);
  };
  const toggleRowExpansion = (source: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(source)) {
      newExpanded.delete(source);
    } else {
      newExpanded.add(source);
    }
    setExpandedRows(newExpanded);
  };
  const columns = [{
    key: 'source' as keyof typeof processedData[0],
    header: 'Lead Source',
    align: 'left' as const,
    render: (value: any, item: any) => <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div onClick={() => toggleRowExpansion(value)} className="flex items-center gap-2 cursor-pointer text-white ">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" />
                <span className="text-gray-900 font-bold text-base">{value}</span>
                <Button variant="ghost" size="sm" className="ml-2 opacity-60 hover:opacity-100 p-1 h-6 w-6">
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-semibold">{value} Overview</p>
                <p>Total Leads: {safeNumber(item.totalLeads)}</p>
                <p>Conversion Rate: {safeToFixed(item.overallConversion)}%</p>
                <p>Revenue per Lead: {formatCurrency(safeNumber(item.totalRevenue) / Math.max(safeNumber(item.totalLeads), 1))}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
  }, {
    key: 'totalLeads' as keyof typeof processedData[0],
    header: 'Total Leads',
    align: 'center' as const,
    render: (value: any) => <div className="text-center">
          <div className="font-bold text-slate-100">{formatNumber(safeNumber(value))}</div>
          <Badge variant="secondary" className="text-xs mt-1">
            <Users className="w-3 h-3 mr-1" />
            Leads
          </Badge>
        </div>
  }, {
    key: 'trialsCompleted' as keyof typeof processedData[0],
    header: 'Trials Completed',
    align: 'center' as const,
    render: (value: any) => <div className="text-center">
          <div className="font-bold text-slate-100">{formatNumber(safeNumber(value))}</div>
          <Badge variant="outline" className="text-xs mt-1 border-green-200 text-green-300 bg-slate-950">
            <Activity className="w-3 h-3 mr-1" />
            Trials
          </Badge>
        </div>
  }, {
    key: 'converted' as keyof typeof processedData[0],
    header: 'Converted',
    align: 'center' as const,
    render: (value: any) => <div className="text-center">
          <div className="font-bold text-slate-100">{formatNumber(safeNumber(value))}</div>
          <Badge variant="outline" className="text-xs mt-1 border-purple-200 text-purple-200 bg-slate-900">
            <Target className="w-3 h-3 mr-1" />
            Members
          </Badge>
        </div>
  }, {
    key: 'totalLost' as keyof typeof processedData[0],
    header: 'Lost',
    align: 'center' as const,
    render: (value: any) => <div className="text-center">
          <div className="font-bold text-slate-100">{formatNumber(safeNumber(value))}</div>
          <Badge variant="outline" className="text-xs mt-1 border-red-700 text-red-100 bg-slate-950">
            Lost
          </Badge>
        </div>
  }, {
    key: 'leadToTrialConversion' as keyof typeof processedData[0],
    header: 'Lead → Trial',
    align: 'center' as const,
    render: (value: any) => <div className="text-center">
          <div className="font-bold text-slate-100">{safeToFixed(value)}%</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {safeNumber(value) > 20 ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
            <ArrowRight className="w-3 h-3 text-blue-500" />
          </div>
        </div>
  }, {
    key: 'trialToMemberConversion' as keyof typeof processedData[0],
    header: 'Trial → Member',
    align: 'center' as const,
    render: (value: any) => <div className="text-center">
          <div className="font-bold text-slate-100">{safeToFixed(value)}%</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {safeNumber(value) > 30 ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
            <ArrowRight className="w-3 h-3 text-purple-500" />
          </div>
        </div>
  }, {
    key: 'totalRevenue' as keyof typeof processedData[0],
    header: 'Revenue Generated',
    align: 'right' as const,
    render: (value: any) => <div className="text-right">
          <div className="font-bold text-slate-100">{formatCurrency(safeNumber(value))}</div>
          <Badge variant="outline" className="text-xs mt-1 border-yellow-200 text-yellow-700">
            <DollarSign className="w-3 h-3 mr-1" />
            Revenue
          </Badge>
        </div>
  }];
  const calculateTotals = () => {
    return processedData.reduce((totals, source) => ({
      totalLeads: totals.totalLeads + safeNumber(source.totalLeads),
      trialsCompleted: totals.trialsCompleted + safeNumber(source.trialsCompleted),
      converted: totals.converted + safeNumber(source.converted),
      totalLost: totals.totalLost + safeNumber(source.totalLost),
      totalRevenue: totals.totalRevenue + safeNumber(source.totalRevenue)
    }), {
      totalLeads: 0,
      trialsCompleted: 0,
      converted: 0,
      totalLost: 0,
      totalRevenue: 0
    });
  };
  const totals = calculateTotals();
  if (!data || data.length === 0) {
    return <Card className="bg-white shadow-xl border-0">
        <CardContent className="p-6 text-center">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No lead source data available</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white shadow-xl border-0">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-800 to-indigo-900">
        <CardTitle className="font-bold flex items-center gap-2 text-slate-50 text-3xl">
          <BarChart3 className="w-6 h-6 text-yellow-200" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <OptimizedTable data={processedData} columns={columns} maxHeight="500px" stickyHeader={true} stickyFirstColumn={true} showFooter={true} footerData={{
          source: 'TOTAL',
          totalLeads: totals.totalLeads,
          trialsCompleted: totals.trialsCompleted,
          converted: totals.converted,
          totalLost: totals.totalLost,
          leadToTrialConversion: totals.totalLeads > 0 ? totals.trialsCompleted / totals.totalLeads * 100 : 0,
          trialToMemberConversion: totals.trialsCompleted > 0 ? totals.converted / totals.trialsCompleted * 100 : 0,
          totalRevenue: totals.totalRevenue
        }} />
        </div>

        {/* Expanded Row Details */}
        {Array.from(expandedRows).map(source => {
        const sourceData = processedData.find(item => item.source === source);
        if (!sourceData) return null;
        return <div key={source} className="bg-slate-50 border-t p-6">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Detailed Analytics: {source}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h5 className="text-sm font-medium text-slate-600 mb-2">Lead Volume</h5>
                  <p className="text-2xl font-bold text-blue-600">{safeNumber(sourceData.totalLeads)}</p>
                  <p className="text-xs text-slate-500 mt-1">Total leads generated</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h5 className="text-sm font-medium text-slate-600 mb-2">Conversion Funnel</h5>
                  <div className="space-y-1">
                    <p className="text-sm">Trials: <span className="font-bold text-green-600">{safeNumber(sourceData.trialsCompleted)}</span></p>
                    <p className="text-sm">Converted: <span className="font-bold text-purple-600">{safeNumber(sourceData.converted)}</span></p>
                    <p className="text-sm">Lost: <span className="font-bold text-red-600">{safeNumber(sourceData.totalLost)}</span></p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h5 className="text-sm font-medium text-slate-600 mb-2">Performance Rates</h5>
                  <div className="space-y-1">
                    <p className="text-sm">Trial Rate: <span className="font-bold">{safeToFixed(sourceData.leadToTrialConversion)}%</span></p>
                    <p className="text-sm">Conversion: <span className="font-bold">{safeToFixed(sourceData.trialToMemberConversion)}%</span></p>
                    <p className="text-sm">Lost Rate: <span className="font-bold text-red-600">{safeToFixed(sourceData.lostRate)}%</span></p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h5 className="text-sm font-medium text-slate-600 mb-2">Revenue Metrics</h5>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(safeNumber(sourceData.totalRevenue))}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Per Lead: {formatCurrency(safeNumber(sourceData.totalRevenue) / Math.max(safeNumber(sourceData.totalLeads), 1))}
                  </p>
                </div>
              </div>
            </div>;
      })}

        {/* Enhanced Summary Footer with better visibility */}
        <div className="mt-6 p-6 bg-white border-t">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Performance Summary & Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg shadow-sm border">
              <h5 className="text-sm font-medium text-slate-600 mb-2">Overall Conversion</h5>
              <p className="text-2xl font-bold text-slate-900">
                {safeToFixed(totals.totalLeads > 0 ? totals.converted / totals.totalLeads * 100 : 0)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">End-to-end conversion rate</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg shadow-sm border">
              <h5 className="text-sm font-medium text-slate-600 mb-2">Average Revenue per Lead</h5>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(totals.totalLeads > 0 ? totals.totalRevenue / totals.totalLeads : 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Revenue efficiency metric</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg shadow-sm border">
              <h5 className="text-sm font-medium text-slate-600 mb-2">Trial Success Rate</h5>
              <p className="text-2xl font-bold text-slate-900">
                {safeToFixed(totals.trialsCompleted > 0 ? totals.converted / totals.trialsCompleted * 100 : 0)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Trial to membership conversion</p>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-slate-700 space-y-2">
            <p>• <strong>{processedData.length}</strong> lead sources tracked with <strong>{formatNumber(totals.totalLeads)}</strong> total leads</p>
            <p>• <strong>{formatNumber(totals.trialsCompleted)}</strong> trials completed, resulting in <strong>{formatNumber(totals.converted)}</strong> new members</p>
            <p>• Total revenue generated: <strong>{formatCurrency(totals.totalRevenue)}</strong></p>
            <p>• Top performing source: <strong>{processedData[0]?.source || 'N/A'}</strong> with {safeNumber(processedData[0]?.totalLeads)} leads</p>
          </div>
        </div>
      </CardContent>
    </Card>;
};