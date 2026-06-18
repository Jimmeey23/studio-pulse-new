
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Target, Calendar, BarChart3, DollarSign, Activity, Filter, RefreshCw } from 'lucide-react';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { LeadsFilterOptions, LeadsData, LeadsMetricType } from '@/types/leads';
import { ImprovedLeadMetricCards } from './ImprovedLeadMetricCards';
import { ImprovedLeadTopLists } from './ImprovedLeadTopLists';
import { ImprovedLeadSourcePerformanceTable } from './ImprovedLeadSourcePerformanceTable';
import { ImprovedLeadMonthOnMonthTable } from './ImprovedLeadMonthOnMonthTable';
import { LeadYearOnYearSourceTable } from './LeadYearOnYearSourceTable';
import { LeadConversionAnalyticsTable } from './LeadConversionAnalyticsTable';
import { FunnelStageAnalytics } from './FunnelStageAnalytics';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { motion } from 'framer-motion';

export const ImprovedLeadsSection = () => {
  const { data: leadsData, loading, error } = useLeadsData();
  const { filters: globalFilters, updateFilters, clearFilters } = useGlobalFilters();
  const [activeMetric, setActiveMetric] = useState<LeadsMetricType>('totalLeads');
  const [activeTab, setActiveTab] = useState('funnel-analytics');

  // Extract unique values for filters
  const uniqueValues = useMemo(() => {
    if (!leadsData) return {
      sources: [],
      associates: [],
      centers: [],
      stages: [],
      statuses: []
    };

    return {
      sources: [...new Set(leadsData.map(item => item.source).filter(Boolean))],
      associates: [...new Set(leadsData.map(item => item.associate).filter(Boolean))],
      centers: [...new Set(leadsData.map(item => item.center).filter(Boolean))],
      stages: [...new Set(leadsData.map(item => item.stage).filter(Boolean))],
      statuses: [...new Set(leadsData.map(item => item.status).filter(Boolean))]
    };
  }, [leadsData]);

  // Filter leads data based on global filters
  const filteredLeadsData = useMemo(() => {
    if (!leadsData) return [];

    return leadsData.filter(lead => {
      // Date range filter
      if (globalFilters.dateRange.start || globalFilters.dateRange.end) {
        const leadDate = new Date(lead.createdAt);
        if (globalFilters.dateRange.start && leadDate < new Date(globalFilters.dateRange.start)) return false;
        if (globalFilters.dateRange.end && leadDate > new Date(globalFilters.dateRange.end)) return false;
      }

      // Array filters - map global filters to lead fields
      if (globalFilters.location.length > 0 && !globalFilters.location.includes(lead.center)) return false;
      if (globalFilters.source.length > 0 && !globalFilters.source.includes(lead.source)) return false;
      if (globalFilters.stage.length > 0 && !globalFilters.stage.includes(lead.stage)) return false;
      if (globalFilters.status.length > 0 && !globalFilters.status.includes(lead.status)) return false;
      if (globalFilters.associate.length > 0 && !globalFilters.associate.includes(lead.associate)) return false;

      // LTV range filter
      if (globalFilters.minLTV !== undefined && lead.ltv < globalFilters.minLTV) return false;
      if (globalFilters.maxLTV !== undefined && lead.ltv > globalFilters.maxLTV) return false;

      return true;
    });
  }, [leadsData, globalFilters]);

  if (loading) {
    return null; // Global loader will handle this
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/20 flex items-center justify-center">
        <motion.div 
          className="text-center space-y-6 max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-red-600 text-xl font-bold">Error loading lead data</div>
          <p className="text-slate-600 bg-white p-4 rounded-lg shadow-lg">{error}</p>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Lead Performance Analytics
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Comprehensive insights into lead generation, conversion, and funnel performance
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <Activity className="w-3 h-3 mr-1" />
              {formatNumber(filteredLeadsData.length)} leads analyzed
            </Badge>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Target className="w-3 h-3 mr-1" />
              Live data
            </Badge>
          </div>
        </motion.div>

        {/* Global Filter Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/90 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-slate-800">Global Filters Applied</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    {globalFilters.dateRange.start && globalFilters.dateRange.end 
                      ? `${new Date(globalFilters.dateRange.start).toLocaleDateString()} - ${new Date(globalFilters.dateRange.end).toLocaleDateString()}`
                      : 'All dates'
                    }
                  </Badge>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ImprovedLeadMetricCards data={filteredLeadsData} />
        </motion.div>

        {/* Main Analytics Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 text-xl">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Lead Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-slate-100/80 p-1 rounded-xl h-14">
                  <TabsTrigger 
                    value="funnel-analytics" 
                    className="gap-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <Target className="w-4 h-4" />
                    Funnel Analytics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="source-performance" 
                    className="gap-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <Users className="w-4 h-4" />
                    Sources
                  </TabsTrigger>
                  <TabsTrigger 
                    value="conversion-analytics" 
                    className="gap-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <Activity className="w-4 h-4" />
                    Conversions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="month-comparison" 
                    className="gap-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <Calendar className="w-4 h-4" />
                    Monthly
                  </TabsTrigger>
                  <TabsTrigger 
                    value="year-comparison" 
                    className="gap-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Yearly
                  </TabsTrigger>
                </TabsList>

                <div className="mt-8">
                  <TabsContent value="funnel-analytics" className="space-y-6">
                    <FunnelStageAnalytics data={filteredLeadsData} />
                  </TabsContent>

                  <TabsContent value="source-performance">
                    <ImprovedLeadSourcePerformanceTable data={filteredLeadsData} />
                  </TabsContent>

                  <TabsContent value="conversion-analytics">
                    <LeadConversionAnalyticsTable data={filteredLeadsData} />
                  </TabsContent>

                  <TabsContent value="month-comparison">
                    <ImprovedLeadMonthOnMonthTable data={filteredLeadsData} />
                  </TabsContent>

                  <TabsContent value="year-comparison">
                    <LeadYearOnYearSourceTable
                      allData={leadsData || []}
                      activeMetric={activeMetric}
                      onMetricChange={setActiveMetric}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ImprovedLeadTopLists data={filteredLeadsData} />
        </motion.div>
      </div>
    </div>
  );
};
