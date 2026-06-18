import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { countConvertedLeads, calculateConversionRate } from '@/utils/leadConversions';

// Import components
import { FunnelLeadsFilterSection } from '@/components/dashboard/FunnelLeadsFilterSection';
import { FunnelMetricCards } from '@/components/dashboard/FunnelMetricCards';
import { FunnelInteractiveCharts } from '@/components/dashboard/FunnelInteractiveCharts';
import FunnelMonthOnMonthTable from '@/components/dashboard/FunnelMonthOnMonthTable';
import { FunnelYearOnYearTable } from '@/components/dashboard/FunnelYearOnYearTable';
import { EnhancedFunnelRankings } from '@/components/dashboard/EnhancedFunnelRankings';
import { FunnelHealthMetricsTable } from '@/components/dashboard/FunnelHealthMetricsTable';
import { FunnelAnalyticsTables } from '@/components/dashboard/FunnelAnalyticsTables';
import { DataScienceInsightsPanel } from '@/components/dashboard/DataScienceInsightsPanel';
import { LazyFunnelDrillDownModal } from '@/components/lazy/LazyModals';
import { ModalSuspense } from '@/components/lazy/ModalSuspense';
import { LeadsFilterOptions } from '@/types/leads';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { getActiveConsolidatedExportPreset } from '@/utils/consolidatedExportPreset';
import { getDashboardDefaultDateRange } from '@/utils/dateUtils';
export default function FunnelLeads() {
  const {
    data: allLeadsData,
    loading,
    error
  } = useLeadsData();
  const { setLoading } = useGlobalLoading();
  
  useEffect(() => {
    setLoading(loading, 'Loading funnel and lead conversion data...');
  }, [loading, setLoading]);
  const exportPreset = useMemo(() => (typeof window !== 'undefined' ? getActiveConsolidatedExportPreset(window.location.search) : null), []);
  const defaultDateRange = useMemo(() => getDashboardDefaultDateRange(), []);
  const [activeLocation, setActiveLocation] = useState(exportPreset?.studioId || 'all');
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [chartsCollapsed, setChartsCollapsed] = useState(true);
  const [drillDownModal, setDrillDownModal] = useState<{
    isOpen: boolean;
    title: string;
    data: any[];
    type: string;
  }>({
    isOpen: false,
    title: '',
    data: [],
    type: ''
  });

  const [filters, setFilters] = useState<LeadsFilterOptions>(() => {
    return {
      dateRange: {
        start: exportPreset?.startDate || defaultDateRange.start,
        end: exportPreset?.endDate || defaultDateRange.end,
      },
      location: [],
      source: [],
      stage: [],
      status: [],
      associate: [],
      channel: [],
      trialStatus: [],
      conversionStatus: [],
      retentionStatus: [],
      minLTV: undefined,
      maxLTV: undefined
    };
  });

  // Filter data by location
  const locationFilteredData = useMemo(() => {
    if (!allLeadsData || activeLocation === 'all') return allLeadsData || [];
    return allLeadsData.filter(lead => {
      const leadCenter = lead.center?.toLowerCase() || '';
      switch (activeLocation) {
        case 'kwality':
          return leadCenter.includes('kwality') || leadCenter.includes('kemps');
        case 'supreme':
          return leadCenter.includes('supreme') || leadCenter.includes('bandra');
        case 'kenkere':
          return leadCenter.includes('kenkere');
        case 'popup':
          return leadCenter.includes('pop') || leadCenter.includes('popup') || leadCenter.includes('pop-up');
        default:
          return true;
      }
    });
  }, [allLeadsData, activeLocation]);

  // Apply additional filters to location-filtered data
  const filteredData = useMemo(() => {
    if (!locationFilteredData) return [];
    return locationFilteredData.filter(lead => {
      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const leadDate = new Date(lead.createdAt);
        if (filters.dateRange.start && leadDate < new Date(filters.dateRange.start)) return false;
        if (filters.dateRange.end && leadDate > new Date(filters.dateRange.end)) return false;
      }

      // Multi-select filters
      if (filters.location.length > 0 && !filters.location.some(loc => lead.center?.toLowerCase().includes(loc.toLowerCase()))) return false;
      if (filters.source.length > 0 && !filters.source.includes(lead.source)) return false;
      if (filters.stage.length > 0 && !filters.stage.includes(lead.stage)) return false;
      if (filters.status.length > 0 && !filters.status.includes(lead.status)) return false;
      if (filters.associate.length > 0 && !filters.associate.includes(lead.associate)) return false;
      if (filters.channel.length > 0 && !filters.channel.includes(lead.channel)) return false;
      if (filters.trialStatus.length > 0 && !filters.trialStatus.includes(lead.trialStatus)) return false;
      if (filters.conversionStatus.length > 0 && !filters.conversionStatus.includes(lead.conversionStatus)) return false;
      if (filters.retentionStatus.length > 0 && !filters.retentionStatus.includes(lead.retentionStatus)) return false;

      // LTV range filters
      if (filters.minLTV && lead.ltv < filters.minLTV) return false;
      if (filters.maxLTV && lead.ltv > filters.maxLTV) return false;
      return true;
    });
  }, [locationFilteredData, filters]);

  // Extract unique values for filter options
  const uniqueValues = useMemo(() => {
    if (!allLeadsData) return {
      locations: [],
      sources: [],
      stages: [],
      statuses: [],
      associates: [],
      channels: [],
      trialStatuses: [],
      conversionStatuses: [],
      retentionStatuses: []
    };
    return {
      locations: [...new Set(allLeadsData.map(lead => lead.center).filter(Boolean))],
      sources: [...new Set(allLeadsData.map(lead => lead.source).filter(Boolean))],
      stages: [...new Set(allLeadsData.map(lead => lead.stage).filter(Boolean))],
      statuses: [...new Set(allLeadsData.map(lead => lead.status).filter(Boolean))],
      associates: [...new Set(allLeadsData.map(lead => lead.associate).filter(Boolean))],
      channels: [...new Set(allLeadsData.map(lead => lead.channel).filter(Boolean))],
      trialStatuses: [...new Set(allLeadsData.map(lead => lead.trialStatus).filter(Boolean))],
      conversionStatuses: [...new Set(allLeadsData.map(lead => lead.conversionStatus).filter(Boolean))],
      retentionStatuses: [...new Set(allLeadsData.map(lead => lead.retentionStatus).filter(Boolean))]
    };
  }, [allLeadsData]);

  const handleFiltersChange = (newFilters: LeadsFilterOptions) => {
    setFilters(newFilters);
  };

  const resetAllFilters = () => {
    setActiveLocation('all');
    setFilters({
      dateRange: { start: defaultDateRange.start, end: defaultDateRange.end },
      location: [],
      source: [],
      stage: [],
      status: [],
      associate: [],
      channel: [],
      trialStatus: [],
      conversionStatus: [],
      retentionStatus: [],
      minLTV: undefined,
      maxLTV: undefined,
    });
  };
  const handleDrillDown = (title: string, data: any[], type: string) => {
    setDrillDownModal({
      isOpen: true,
      title,
      data,
      type
    });
  };
  
  // Remove individual loader - rely on global loader only
  
  if (error) {
    return <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-4">
        <Card className="p-8 bg-white shadow-lg max-w-md">
          <CardContent className="text-center space-y-4">
            <RefreshCw className="w-12 h-12 text-red-600 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-gray-800">Connection Error</p>
              <p className="text-sm text-gray-600 mt-2">{error?.toString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="funnel-leads-unified min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <DashboardMotionHero
        title="Funnel & Leads Analytics"
        subtitle="Analyze your marketing funnel, lead quality, source effectiveness, and conversion patterns to improve acquisition and retention."
        metrics={[
          { label: 'Total Leads', value: filteredData.length.toLocaleString() },
          { label: 'Converted', value: countConvertedLeads(filteredData).toString() },
          { label: 'Conversion Rate', value: `${calculateConversionRate(filteredData).toFixed(1)}%` },
        ]}
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Location Tabs - unified styling (matching Client Retention) */}
        <StudioLocationTabs 
          activeLocation={activeLocation}
          onLocationChange={setActiveLocation}
          showInfoPopover={true}
          infoPopoverContext="funnel-leads-overview"
        />

        {/* Content Sections */}
        <div className="space-y-8">
                  {!loading && allLeadsData.length === 0 && (
                    <Card className="bg-slate-50 border border-slate-200 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-700">
                          No lead rows were returned from the data source. Please check the Leads sheet data and refresh.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {!loading && allLeadsData.length > 0 && filteredData.length === 0 && (
                    <Card className="bg-amber-50/80 border border-amber-200 shadow-sm">
                      <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-amber-900">
                          No leads match the current filters. Reset filters to repopulate metric cards, tables, and rankings.
                        </p>
                        <Button variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100" onClick={resetAllFilters}>
                          Reset Filters
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Collapsible Filters Section */}
                  <Card className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 w-full">
                    <CardContent className="p-6 w-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Advanced Filters</h3>
                        <Button variant="ghost" size="sm" onClick={() => setFiltersCollapsed(!filtersCollapsed)} className="gap-2">
                          {filtersCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          {filtersCollapsed ? 'Show Filters' : 'Hide Filters'}
                        </Button>
                      </div>
                      {!filtersCollapsed && <div className="w-full"><FunnelLeadsFilterSection filters={filters} onFiltersChange={handleFiltersChange} uniqueValues={uniqueValues} /></div>}
                    </CardContent>
                  </Card>

                  {/* Metric Cards */}
                  <FunnelMetricCards data={filteredData} onCardClick={handleDrillDown} />

                  <DataScienceInsightsPanel
                    title="Leads Data Science Toolkit"
                    description="Monitor distribution skew, outliers, and momentum shifts to prioritize high-quality lead segments."
                    data={filteredData}
                    initiallyCollapsed={true}
                    metricOptions={[
                      {
                        key: 'ltv',
                        label: 'Lead LTV',
                        accessor: (row: any) => Number(row?.ltv || 0),
                      },
                      {
                        key: 'convertedFlag',
                        label: 'Converted Leads (0/1)',
                        accessor: (row: any) => {
                          const status = String(row?.conversionStatus || row?.stage || '').toLowerCase();
                          return status.includes('convert') ? 1 : 0;
                        },
                      },
                      {
                        key: 'responseTimeDays',
                        label: 'Response Time (Days)',
                        accessor: (row: any) =>
                          Number(row?.responseDays || row?.daysToRespond || row?.daysToConversion || 0),
                      },
                    ]}
                    dateAccessor={(row: any) => {
                      const raw = row?.createdAt || row?.leadDate || row?.date;
                      if (!raw) return null;
                      const parsed = new Date(raw);
                      return Number.isNaN(parsed.getTime()) ? null : parsed;
                    }}
                  />

                  {/* Interactive Charts - Collapsible */}
                  <Card className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 w-full">
                    <CardContent className="p-6 w-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Interactive Charts</h3>
                        <Button variant="ghost" size="sm" onClick={() => setChartsCollapsed(!chartsCollapsed)} className="gap-2">
                          {chartsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          {chartsCollapsed ? 'Show Charts' : 'Hide Charts'}
                        </Button>
                      </div>
                      {!chartsCollapsed && (
                        <div className="w-full">
                          <FunnelInteractiveCharts data={filteredData} />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Enhanced Rankings Section */}
                  <EnhancedFunnelRankings data={filteredData} />

                  {/* Tables Sub-Tabs */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 w-full">
            <CardContent className="p-4 w-full">
              <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-slate-800 to-slate-700 p-1.5 rounded-xl shadow-lg border border-slate-600">
                  <TabsTrigger 
                    value="analytics" 
                    className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500"
                  >
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="mom" 
                    className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500"
                  >
                    Month-on-Month
                  </TabsTrigger>
                  <TabsTrigger 
                    value="yoy" 
                    className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500"
                  >
                    Year-on-Year
                  </TabsTrigger>
                  <TabsTrigger 
                    value="health" 
                    className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-600/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-slate-500"
                  >
                    Health Metrics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="mt-4">
                  <FunnelAnalyticsTables data={filteredData} onDrillDown={handleDrillDown} />
                </TabsContent>

                <TabsContent value="mom" className="mt-4">
                  {/* Uses ALL location data, independent from page date filters */}
                  <FunnelMonthOnMonthTable data={locationFilteredData} onDrillDown={handleDrillDown} />
                </TabsContent>

                <TabsContent value="yoy" className="mt-4">
                  {/* Uses ALL location data, independent from page date filters */}
                  <FunnelYearOnYearTable allData={locationFilteredData} onDrillDown={handleDrillDown} />
                </TabsContent>

                <TabsContent value="health" className="mt-4">
                  <FunnelHealthMetricsTable data={filteredData} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drill Down Modal - Lazy loaded */}
      <ModalSuspense>
        {drillDownModal.isOpen && (
          <LazyFunnelDrillDownModal 
            isOpen={drillDownModal.isOpen} 
            onClose={() => setDrillDownModal(prev => ({
              ...prev,
              isOpen: false
            }))} 
            title={drillDownModal.title} 
            data={drillDownModal.data} 
            type={drillDownModal.type} 
          />
        )}
      </ModalSuspense>
    </div>;
}
