import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Target, 
  Clock, 
  DollarSign, 
  Activity, 
  MapPin, 
  AlertTriangle,
  BarChart3,
  Star,
  Users
} from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { isLeadConverted, countConvertedLeads } from '@/utils/leadConversions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import CopyTableButton from '@/components/ui/CopyTableButton';

interface FunnelAnalyticsTablesProps {
  data: LeadsData[];
  onDrillDown?: (title: string, data: LeadsData[], type: string) => void;
}

export const FunnelAnalyticsTables: React.FC<FunnelAnalyticsTablesProps> = ({
  data,
  onDrillDown
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
    table: string;
  }>({
    key: 'totalLeads',
    direction: 'desc',
    table: 'source'
  });

  const sourceTableRef = useRef<HTMLTableElement>(null);
  const stageTableRef = useRef<HTMLTableElement>(null);
  const spanTableRef = useRef<HTMLTableElement>(null);
  const ltvTableRef = useRef<HTMLTableElement>(null);
  const topStagesTableRef = useRef<HTMLTableElement>(null);
  const proximityTableRef = useRef<HTMLTableElement>(null);
  const registry = useMetricsTablesRegistry();

  // Handle sorting
  const handleSort = (key: string, table: string) => {
    setSortConfig(prevConfig => ({
      key,
      table,
      direction: prevConfig.key === key && prevConfig.table === table && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Sort data based on configuration
  const sortData = (data: any[], table: string) => {
    if (sortConfig.table !== table) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'desc' 
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }
      
      return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
    });
  };

  // Handle row click for drill down
  const handleRowClick = (type: string, row: any) => {
    if (onDrillDown) {
      let filteredData: LeadsData[] = [];
      let title = '';

      switch (type) {
        case 'source':
          filteredData = data.filter(lead => (lead.source || 'Unknown') === row.source);
          title = `${row.source} - Source Analysis`;
          break;
        case 'stage':
          filteredData = data.filter(lead => (lead.stage || 'Unknown') === row.stage);
          title = `${row.stage} - Stage Analysis`;
          break;
        case 'ltv':
          title = `${row.ltvRange} - LTV Analysis`;
          break;
        case 'proximity':
          filteredData = data.filter(lead => lead.stage?.includes('Proximity'));
          title = `Proximity Issues - ${row.location}`;
          break;
        default:
          return;
      }

      onDrillDown(title, filteredData, type);
    }
  };

  // Register tables for metrics
  React.useEffect(() => {
    if (sourceTableRef.current) {
      registry.registerTable('funnel-source-analytics', sourceTableRef.current);
    }
    if (stageTableRef.current) {
      registry.registerTable('funnel-stage-analytics', stageTableRef.current);
    }
    return () => {
      registry.unregisterTable('funnel-source-analytics');
      registry.unregisterTable('funnel-stage-analytics');
    };
  }, [registry]);

  // Conversion by Source Analytics
  const conversionBySource = useMemo(() => {
    const sourceStats = data.reduce((acc, lead) => {
      const source = lead.source || 'Unknown';
      if (!acc[source]) {
        acc[source] = {
          totalLeads: 0,
          trialsScheduled: 0,
          trialsCompleted: 0,
          converted: 0,
          totalLTV: 0,
          totalVisits: 0,
          proximityIssues: 0
        };
      }
      
      acc[source].totalLeads += 1;
      const ts = (lead.trialStatus || '').toLowerCase();
      const st = (lead.stage || '').toLowerCase();
      if ((ts.includes('trial') && !ts.includes('completed')) || (st.includes('trial') && !st.includes('completed'))) acc[source].trialsScheduled += 1;
      if (lead.trialStatus === 'Trial Completed' || lead.stage === 'Trial Completed') acc[source].trialsCompleted += 1;
      if (isLeadConverted(lead)) acc[source].converted += 1;
      if (lead.stage?.includes('Proximity')) acc[source].proximityIssues += 1;
      acc[source].totalLTV += lead.ltv || 0;
      acc[source].totalVisits += lead.visits || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(sourceStats).map(([source, stats]) => ({
      source,
      totalLeads: stats.totalLeads,
      trialsScheduled: stats.trialsScheduled,
      trialsCompleted: stats.trialsCompleted,
      converted: stats.converted,
      conversionRate: stats.totalLeads > 0 ? (stats.converted / stats.totalLeads) * 100 : 0,
      trialToMemberRate: stats.trialsCompleted > 0 ? (stats.converted / stats.trialsCompleted) * 100 : 0,
      avgLTV: stats.totalLeads > 0 ? stats.totalLTV / stats.totalLeads : 0,
      avgVisits: stats.totalLeads > 0 ? stats.totalVisits / stats.totalLeads : 0,
      proximityIssues: stats.proximityIssues,
      leadQuality: ((stats.converted * 0.4) + (stats.trialsCompleted * 0.3) + ((stats.totalLeads - stats.proximityIssues) * 0.3)) / stats.totalLeads * 100
    })).sort((a, b) => b.totalLeads - a.totalLeads);
  }, [data]);

  // Conversion by Stage Analytics
  const conversionByStage = useMemo(() => {
    const stageStats = data.reduce((acc, lead) => {
      const stage = lead.stage || 'Unknown';
      if (!acc[stage]) {
        acc[stage] = {
          totalLeads: 0,
          converted: 0,
          totalLTV: 0,
          avgDaysInStage: 0,
          retained: 0
        };
      }
      
      acc[stage].totalLeads += 1;
      if (isLeadConverted(lead)) acc[stage].converted += 1;
      if (lead.retentionStatus === 'Retained') acc[stage].retained += 1;
      acc[stage].totalLTV += lead.ltv || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(stageStats).map(([stage, stats]) => ({
      stage,
      totalLeads: stats.totalLeads,
      converted: stats.converted,
      conversionRate: stats.totalLeads > 0 ? (stats.converted / stats.totalLeads) * 100 : 0,
      retentionRate: stats.totalLeads > 0 ? (stats.retained / stats.totalLeads) * 100 : 0,
      avgLTV: stats.totalLeads > 0 ? stats.totalLTV / stats.totalLeads : 0,
      stageEfficiency: ((stats.converted * 0.5) + (stats.retained * 0.3) + (stats.totalLeads * 0.2)) / stats.totalLeads * 100
    })).sort((a, b) => b.totalLeads - a.totalLeads);
  }, [data]);

  // Conversion Span Analytics
  const conversionSpanAnalytics = useMemo(() => {
    const spanRanges = [
      { label: '0-7 days', min: 0, max: 7 },
      { label: '8-14 days', min: 8, max: 14 },
      { label: '15-30 days', min: 15, max: 30 },
      { label: '31-60 days', min: 31, max: 60 },
      { label: '60+ days', min: 61, max: Infinity }
    ];

    return spanRanges.map(range => {
      const leadsInRange = data.filter(lead => {
        if (!lead.createdAt || !lead.convertedToCustomerAt) return false;
        const created = new Date(lead.createdAt);
        const converted = new Date(lead.convertedToCustomerAt);
        const daysDiff = Math.ceil((converted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= range.min && daysDiff <= range.max;
      });

      const convertedInRange = leadsInRange.filter(isLeadConverted);
      
      return {
        timeRange: range.label,
        totalLeads: leadsInRange.length,
        converted: convertedInRange.length,
        conversionRate: leadsInRange.length > 0 ? (convertedInRange.length / leadsInRange.length) * 100 : 0,
        avgLTV: convertedInRange.length > 0 ? convertedInRange.reduce((sum, lead) => sum + (lead.ltv || 0), 0) / convertedInRange.length : 0,
        efficiency: leadsInRange.length > 0 ? ((convertedInRange.length * 0.6) + (leadsInRange.length * 0.4)) / leadsInRange.length * 100 : 0
      };
    });
  }, [data]);

  // LTV Analytics
  const ltvAnalytics = useMemo(() => {
    const ltvRanges = [
      { label: '₹0', min: 0, max: 0 },
      { label: '₹1-5k', min: 1, max: 5000 },
      { label: '₹5k-15k', min: 5001, max: 15000 },
      { label: '₹15k-30k', min: 15001, max: 30000 },
      { label: '₹30k+', min: 30001, max: Infinity }
    ];

    return ltvRanges.map(range => {
      const leadsInRange = data.filter(lead => {
        const ltv = lead.ltv || 0;
        return ltv >= range.min && ltv <= range.max;
      });

      const convertedInRange = leadsInRange.filter(isLeadConverted);
      
      return {
        ltvRange: range.label,
        totalLeads: leadsInRange.length,
        converted: convertedInRange.length,
        conversionRate: leadsInRange.length > 0 ? (convertedInRange.length / leadsInRange.length) * 100 : 0,
        avgVisits: leadsInRange.length > 0 ? leadsInRange.reduce((sum, lead) => sum + (lead.visits || 0), 0) / leadsInRange.length : 0,
        totalRevenue: leadsInRange.reduce((sum, lead) => sum + (lead.ltv || 0), 0),
        valueScore: convertedInRange.length > 0 ? (convertedInRange.reduce((sum, lead) => sum + (lead.ltv || 0), 0) / convertedInRange.length) * (convertedInRange.length / leadsInRange.length) : 0
      };
    });
  }, [data]);

  // Most Common Stage Analytics
  const mostCommonStages = useMemo(() => {
    const total = data.length || 1;
    const stageCounts = data.reduce((acc, lead) => {
      const key = lead.stage || 'Unknown';
      if (!acc[key]) {
        acc[key] = { count: 0, converted: 0, totalLTV: 0 };
      }
      acc[key].count += 1;
      if (isLeadConverted(lead)) acc[key].converted += 1;
      acc[key].totalLTV += lead.ltv || 0;
      return acc;
    }, {} as Record<string, { count: number; converted: number; totalLTV: number }>);

    return Object.entries(stageCounts)
      .map(([stage, stats]) => ({
        stage,
        leadCount: stats.count,
        percentage: (stats.count / total) * 100,
        converted: stats.converted,
        conversionRate: stats.count > 0 ? (stats.converted / stats.count) * 100 : 0,
        avgLTV: stats.converted > 0 ? stats.totalLTV / stats.converted : 0, // LTV per converted lead, not per total lead
        stagePopularity: (stats.count / total) * 100
      }))
      .sort((a, b) => b.leadCount - a.leadCount)
      .slice(0, 10); // Top 10 stages
  }, [data]);

  // Proximity Issue Analytics
  const proximityAnalytics = useMemo(() => {
    const locationStats = data.reduce((acc, lead) => {
      const location = lead.center || 'Unknown';
      if (!acc[location]) {
        acc[location] = {
          totalLeads: 0,
          proximityIssues: 0
        };
      }
      acc[location].totalLeads += 1;
      if (lead.stage?.includes('Proximity')) acc[location].proximityIssues += 1;
      return acc;
    }, {} as Record<string, { totalLeads: number; proximityIssues: number }>);

    return Object.entries(locationStats).map(([location, stats]) => ({
      location,
      totalLeads: stats.totalLeads,
      proximityIssues: stats.proximityIssues,
      proximityRate: stats.totalLeads > 0 ? (stats.proximityIssues / stats.totalLeads) * 100 : 0,
      impactScore: stats.proximityIssues * (stats.proximityIssues / stats.totalLeads) * 100
    })).sort((a, b) => b.totalLeads - a.totalLeads);
  }, [data]);

  // Apply sorting to data
  const sortedSourceData = useMemo(() => sortData(conversionBySource, 'source'), [conversionBySource, sortConfig]);
  const sortedStageData = useMemo(() => sortData(conversionByStage, 'stage'), [conversionByStage, sortConfig]);
  const sortedTimespanData = useMemo(() => sortData(conversionSpanAnalytics, 'timespan'), [conversionSpanAnalytics, sortConfig]);
  const sortedLtvData = useMemo(() => sortData(ltvAnalytics, 'ltv'), [ltvAnalytics, sortConfig]);
  const sortedTopStagesData = useMemo(() => sortData(mostCommonStages, 'topstages'), [mostCommonStages, sortConfig]);
  const sortedProximityData = useMemo(() => sortData(proximityAnalytics, 'proximity'), [proximityAnalytics, sortConfig]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="source" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-1 rounded-lg border border-slate-600">
          <TabsTrigger value="source" className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500">
            <Target className="w-4 h-4 mr-2" />
            Source
          </TabsTrigger>
          <TabsTrigger value="stage" className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500">
            <Activity className="w-4 h-4 mr-2" />
            Stage
          </TabsTrigger>
          <TabsTrigger value="timespan" className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500">
            <Clock className="w-4 h-4 mr-2" />
            Time Span
          </TabsTrigger>
          <TabsTrigger value="ltv" className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500">
            <DollarSign className="w-4 h-4 mr-2" />
            LTV
          </TabsTrigger>
          <TabsTrigger value="topstages" className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500">
            <BarChart3 className="w-4 h-4 mr-2" />
            Top Stages
          </TabsTrigger>
          <TabsTrigger value="proximity" className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500">
            <MapPin className="w-4 h-4 mr-2" />
            Proximity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="source" className="mt-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl relative">
            <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                  <Target className="w-5 h-5" />
                  Conversion by Source
                </CardTitle>
                <CopyTableButton 
                  tableRef={sourceTableRef}
                  tableName="Conversion by Source"
                  size="sm"
                  className="text-white hover:bg-white/20"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto" data-table="funnel-source-analytics">
                <table ref={sourceTableRef} className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                      <th className="px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide h-9 max-h-9 sticky left-0 z-40 border-r border-white/20">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-white" />
                          <span>Source</span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px] cursor-pointer select-none"
                          onClick={() => handleSort('totalLeads', 'source')}
                          title="Sort by Total Leads">
                        Total Leads
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px] cursor-pointer select-none"
                          onClick={() => handleSort('converted', 'source')}
                          title="Sort by Converted">
                        Converted
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px] cursor-pointer select-none"
                          onClick={() => handleSort('conversionRate', 'source')}
                          title="Sort by Conversion Rate">
                        Conv. Rate
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px] cursor-pointer select-none"
                          onClick={() => handleSort('avgLTV', 'source')}
                          title="Sort by Average LTV">
                        Avg LTV
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px] cursor-pointer select-none"
                          onClick={() => handleSort('leadQuality', 'source')}
                          title="Sort by Quality Score">
                        Quality Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedSourceData.map((row, index) => (
                      <tr
                        key={row.source}
                        className="hover:bg-gray-50 cursor-pointer h-9 max-h-9"
                        onClick={() => handleRowClick('source', row)}
                      >
                        <td className="px-6 py-2 font-semibold text-gray-800 h-9 max-h-9 sticky left-0 z-30 bg-white border-r border-gray-200">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.source}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(row.totalLeads)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(row.converted)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.conversionRate.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatCurrency(row.avgLTV)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.leadQuality.toFixed(1)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr className="font-bold h-9 max-h-9">
                      <td className="px-6 py-2 text-gray-800 h-9 max-h-9 sticky left-0 z-30 bg-gray-50 border-r border-gray-300">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis flex items-center space-x-2">
                          <Star className="w-4 h-4" />
                          <span>TOTALS</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-800 h-9 max-h-9">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {formatNumber(sortedSourceData.reduce((sum, row) => sum + row.totalLeads, 0))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-800 h-9 max-h-9">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {formatNumber(sortedSourceData.reduce((sum, row) => sum + row.converted, 0))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-800 h-9 max-h-9">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {sortedSourceData.length > 0 ? 
                            ((sortedSourceData.reduce((sum, row) => sum + row.converted, 0) / 
                              sortedSourceData.reduce((sum, row) => sum + row.totalLeads, 0)) * 100).toFixed(1) : '0.0'}%
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-800 h-9 max-h-9">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {formatCurrency(sortedSourceData.length > 0 ? 
                            (sortedSourceData.reduce((sum, row) => sum + row.avgLTV * row.totalLeads, 0) / 
                             sortedSourceData.reduce((sum, row) => sum + row.totalLeads, 0)) : 0)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-800 h-9 max-h-9">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {sortedSourceData.length > 0 ? 
                            (sortedSourceData.reduce((sum, row) => sum + row.leadQuality * row.totalLeads, 0) / 
                             sortedSourceData.reduce((sum, row) => sum + row.totalLeads, 0)).toFixed(1) : '0.0'}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stage" className="mt-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl relative">
            <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                  <Activity className="w-5 h-5" />
                  Conversion by Stage
                </CardTitle>
                <CopyTableButton 
                  tableRef={stageTableRef}
                  tableName="Conversion by Stage"
                  size="sm"
                  className="text-white hover:bg-white/20"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto" data-table="funnel-stage-analytics">
                <table ref={stageTableRef} className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                      <th className="px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide h-9 max-h-9 sticky left-0 z-40 border-r border-white/20">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-white" />
                          <span>Stage</span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Total Leads
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Converted
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Conv. Rate
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Avg LTV
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Efficiency
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedStageData.map((row, index) => (
                      <tr
                        key={row.stage}
                        className="hover:bg-gray-50 cursor-pointer h-9 max-h-9"
                        onClick={() => handleRowClick('stage', row)}
                      >
                        <td className="px-6 py-2 font-semibold text-gray-800 h-9 max-h-9 sticky left-0 z-30 bg-white border-r border-gray-200">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.stage}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(row.totalLeads)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(row.converted)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.conversionRate.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatCurrency(row.avgLTV)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.stageEfficiency.toFixed(1)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr className="font-bold h-9 max-h-9">
                      <td className="px-6 py-2 text-gray-800 h-9 max-h-9 sticky left-0 z-30 bg-gray-50 border-r border-gray-300">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis flex items-center space-x-2">
                          <Star className="w-4 h-4" />
                          <span>TOTALS</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-800 h-9 max-h-9">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {formatNumber(sortedStageData.reduce((sum, row) => sum + row.totalLeads, 0))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-800 h-9 max-h-9">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {formatNumber(sortedStageData.reduce((sum, row) => sum + row.converted, 0))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-800 h-9 max-h-9">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {sortedStageData.length > 0 ? 
                            ((sortedStageData.reduce((sum, row) => sum + row.converted, 0) / 
                              sortedStageData.reduce((sum, row) => sum + row.totalLeads, 0)) * 100).toFixed(1) : '0.0'}%
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-800 h-9 max-h-9">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {formatCurrency(sortedStageData.length > 0 ? 
                            (sortedStageData.reduce((sum, row) => sum + row.avgLTV * row.totalLeads, 0) / 
                             sortedStageData.reduce((sum, row) => sum + row.totalLeads, 0)) : 0)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-800 h-9 max-h-9">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {sortedStageData.length > 0 ? 
                            (sortedStageData.reduce((sum, row) => sum + row.stageEfficiency * row.totalLeads, 0) / 
                             sortedStageData.reduce((sum, row) => sum + row.totalLeads, 0)).toFixed(1) : '0.0'}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timespan" className="mt-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl relative">
            <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                  <Clock className="w-5 h-5" />
                  Conversion by Time Span
                </CardTitle>
                <CopyTableButton 
                  tableRef={spanTableRef}
                  tableName="Conversion by Time Span"
                  size="sm"
                  className="text-white hover:bg-white/20"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto" data-table="funnel-timespan-analytics">
                <table ref={spanTableRef} className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                      <th className="px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide h-9 max-h-9 sticky left-0 z-40 border-r border-white/20">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-white" />
                          <span>Time Range</span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Total Leads
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Converted
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Conv. Rate
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Avg LTV
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Efficiency
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedTimespanData.map((row, index) => (
                      <tr key={row.timeRange} className="hover:bg-gray-50 h-9 max-h-9">
                        <td className="px-6 py-2 font-semibold text-gray-800 h-9 max-h-9 sticky left-0 z-30 bg-white border-r border-gray-200">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.timeRange}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(row.totalLeads)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(row.converted)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.conversionRate.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatCurrency(row.avgLTV)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.efficiency.toFixed(1)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ltv" className="mt-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl relative">
            <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                  <DollarSign className="w-5 h-5" />
                  LTV Analysis
                </CardTitle>
                <CopyTableButton 
                  tableRef={ltvTableRef}
                  tableName="LTV Analysis"
                  size="sm"
                  className="text-white hover:bg-white/20"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto" data-table="funnel-ltv-analytics">
                <table ref={ltvTableRef} className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                      <th className="px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide h-9 max-h-9 sticky left-0 z-40 border-r border-white/20">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-white" />
                          <span>LTV Range</span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Total Leads
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Converted
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Conv. Rate
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Total Revenue
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Avg Visits
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedLtvData.map((row, index) => (
                      <tr key={row.ltvRange} className="hover:bg-gray-50 h-9 max-h-9">
                        <td className="px-6 py-2 font-semibold text-gray-800 h-9 max-h-9 sticky left-0 z-30 bg-white border-r border-gray-200">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.ltvRange}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(row.totalLeads)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(row.converted)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.conversionRate.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatCurrency(row.totalRevenue)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.avgVisits.toFixed(1)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topstages" className="mt-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl relative">
            <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                  <BarChart3 className="w-5 h-5" />
                  Top Performing Stages
                </CardTitle>
                <CopyTableButton 
                  tableRef={topStagesTableRef}
                  tableName="Top Performing Stages"
                  size="sm"
                  className="text-white hover:bg-white/20"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto" data-table="funnel-topstages-analytics">
                <table ref={topStagesTableRef} className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                      <th className="px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide h-9 max-h-9 sticky left-0 z-40 border-r border-white/20">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-white" />
                          <span>Stage</span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Lead Count
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Percentage
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Converted
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Conv. Rate
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Avg LTV
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedTopStagesData.map((row, index) => (
                      <tr key={row.stage} className="hover:bg-gray-50 h-9 max-h-9">
                        <td className="px-6 py-2 font-semibold text-gray-800 h-9 max-h-9 sticky left-0 z-30 bg-white border-r border-gray-200">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.stage}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(row.leadCount)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.percentage.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(row.converted)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.conversionRate.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatCurrency(row.avgLTV)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proximity" className="mt-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl relative">
            <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                  <MapPin className="w-5 h-5" />
                  Proximity Issue Analysis
                </CardTitle>
                <CopyTableButton 
                  tableRef={proximityTableRef}
                  tableName="Proximity Issue Analysis"
                  size="sm"
                  className="text-white hover:bg-white/20"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto" data-table="funnel-proximity-analytics">
                <table ref={proximityTableRef} className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                      <th className="px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide h-9 max-h-9 sticky left-0 z-40 border-r border-white/20">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-white" />
                          <span>Location</span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Total Leads
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Proximity Issues
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Proximity Rate
                      </th>
                      <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider h-9 max-h-9 border-l border-white/20 min-w-[90px]">
                        Impact Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedProximityData.map((row, index) => (
                      <tr
                        key={row.location}
                        className="hover:bg-gray-50 cursor-pointer h-9 max-h-9"
                        onClick={() => handleRowClick('proximity', row)}
                      >
                        <td className="px-6 py-2 font-semibold text-gray-800 h-9 max-h-9 sticky left-0 z-30 bg-white border-r border-gray-200">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{row.location}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(row.totalLeads)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(row.proximityIssues)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.proximityRate.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700 h-9 max-h-9">
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.impactScore.toFixed(1)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};