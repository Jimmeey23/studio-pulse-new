import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AutoCloseFilterSection } from './AutoCloseFilterSection';
import { ExpirationMetricCards } from './ExpirationMetricCards';
import { UnifiedTopBottomSellers } from './UnifiedTopBottomSellers';
import { ModernDrillDownModal } from './ModernDrillDownModal';
import { ExpirationChartsGrid } from './ExpirationChartsGrid';
import { ExpirationDataTables } from './ExpirationDataTables';
import { ExpirationAdditionalAnalytics } from './ExpirationAdditionalAnalytics';
import { ChurnedMembersDetailedTable } from './ChurnedMembersDetailedTable';
import { ExpirationData, ExpirationFilterOptions, MetricCardData } from '@/types/dashboard';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { getDashboardDefaultDateRange } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { Calendar, Users, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { InfoPopover } from '@/components/ui/InfoSidebar';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { logger } from '@/utils/logger';

interface ExpirationAnalyticsSectionProps {
  data: ExpirationData[];
}

const locations = [{
  id: 'all',
  name: 'All Locations',
  fullName: 'All Locations'
}, {
  id: 'kwality',
  name: 'Kwality House, Kemps Corner',
  fullName: 'Kwality House, Kemps Corner'
}, {
  id: 'supreme',
  name: 'Supreme HQ, Bandra',
  fullName: 'Supreme HQ, Bandra'
}, {
  id: 'kenkere',
  name: 'Kenkere House',
  fullName: 'Kenkere House'
}, {
  id: 'popup',
  name: 'Pop-up',
  fullName: 'Pop-up'
}];

export const ExpirationAnalyticsSection: React.FC<ExpirationAnalyticsSectionProps> = ({ data }) => {
  const [activeLocation, setActiveLocation] = useState('kwality');
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [drillDownType, setDrillDownType] = useState<'expiration' | 'member' | 'status'>('expiration');

  const [filters, setFilters] = useState<ExpirationFilterOptions>(() => {
    const defaultDateRange = getDashboardDefaultDateRange();
    
    return {
      dateRange: defaultDateRange,
      location: [],
      status: [],
      membershipType: [],
      soldBy: []
    };
  });

  // Count data by location for tabs
  const tabCounts = useMemo(() => {
    const counts = {
      all: data?.length || 0,
      kwality: 0,
      supreme: 0,
      kenkere: 0
    };

    data?.forEach(item => {
      const location = (item.homeLocation || '').toString();
      if (location.includes('Kwality') || location.includes('Kemps Corner')) {
        counts.kwality++;
      } else if (location.includes('Supreme') || location.includes('Bandra')) {
        counts.supreme++;
      } else if (location.includes('Kenkere') || location.includes('Bengaluru')) {
        counts.kenkere++;
      } else if (location.toLowerCase().includes('pop') || location.toLowerCase().includes('popup') || location.toLowerCase().includes('pop-up')) {
        counts.popup++;
      }
    });

    return counts;
  }, [data]);

  const applyFilters = (rawData: ExpirationData[]) => {
    logger.debug('Applying filters to', rawData.length, 'expiration records');
    
    let filtered = [...rawData];

    // Apply location filter from activeLocation (location tabs)
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const loc = (item.homeLocation || '').toString().toLowerCase();
        if (activeLocation === 'kwality') return loc.includes('kwality') || loc.includes('kemps');
        if (activeLocation === 'supreme') return loc.includes('supreme') || loc.includes('bandra');
        if (activeLocation === 'kenkere') return loc.includes('kenkere') || loc.includes('bengaluru');
        if (activeLocation === 'popup') return loc.includes('pop') || loc.includes('popup') || loc.includes('pop-up');
        return false;
      });
      logger.debug(`📍 LOCATION FILTER: Reduced to ${filtered.length} records for location: ${activeLocation}`);
    }

    // Apply status filter
    if (filters.status?.length) {
      filtered = filtered.filter(item => 
        filters.status!.some(status => 
          item.status?.toLowerCase().includes(status.toLowerCase())
        )
      );
    }

    // Apply membership type filter
    if (filters.membershipType?.length) {
      filtered = filtered.filter(item => 
        filters.membershipType!.some(type => 
          item.membershipName?.toLowerCase().includes(type.toLowerCase())
        )
      );
    }

    // Apply sold by filter
    if (filters.soldBy?.length) {
      filtered = filtered.filter(item => 
        filters.soldBy!.some(seller => 
          item.soldBy?.toLowerCase().includes(seller.toLowerCase())
        )
      );
    }

    return filtered;
  };

  const filteredData = useMemo(() => applyFilters(data || []), [data, filters, activeLocation]);

  const calculateMetrics = (data: ExpirationData[]): MetricCardData[] => {
    const totalMemberships = data.length;
    const activeCount = data.filter(item => item.status === 'Active').length;
    const churnedCount = data.filter(item => item.status === 'Churned').length;
    const frozenCount = data.filter(item => item.status === 'Frozen').length;

    const churnRate = totalMemberships > 0 ? (churnedCount / totalMemberships) * 100 : 0;
    const activeRate = totalMemberships > 0 ? (activeCount / totalMemberships) * 100 : 0;
    const frozenRate = totalMemberships > 0 ? (frozenCount / totalMemberships) * 100 : 0;

    return [
      {
        title: 'Total Memberships',
        value: formatNumber(totalMemberships),
        change: 0, // Would need historical data for comparison
        description: 'All tracked membership records',
        calculation: 'Count of all membership records',
        icon: 'Users',
        rawValue: totalMemberships
      },
      {
        title: 'Active Members',
        value: formatNumber(activeCount),
        change: 0,
        description: `${formatPercentage(activeRate)} of total memberships`,
        calculation: 'Count of active status',
        icon: 'CheckCircle',
        rawValue: activeCount
      },
      {
        title: 'Churned Members',
        value: formatNumber(churnedCount),
        change: 0,
        description: `${formatPercentage(churnRate)} churn rate`,
        calculation: 'Count of churned status',
        icon: 'AlertTriangle',
        rawValue: churnedCount
      },
      {
        title: 'Frozen Members',
        value: formatNumber(frozenCount),
        change: 0,
        description: `${formatPercentage(frozenRate)} of total memberships`,
        calculation: 'Count of frozen status',
        icon: 'Clock',
        rawValue: frozenCount
      }
    ];
  };

  const resetFilters = () => {
    const defaultDateRange = getDashboardDefaultDateRange();
    setFilters({
      dateRange: defaultDateRange,
      location: [],
      status: [],
      membershipType: [],
      soldBy: []
    });
  };

  const metrics = calculateMetrics(filteredData);

  const handleRowClick = (data: any, type: 'expiration' | 'member' | 'status' = 'expiration') => {
    setDrillDownData(data);
    setDrillDownType(type);
  };

  const getTopBottomData = (data: ExpirationData[]) => {
    // Top membership types by count
    const membershipCounts = data.reduce((acc, item) => {
      const key = item.membershipName || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topMemberships = Object.entries(membershipCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Status distribution
    const statusCounts = data.reduce((acc, item) => {
      const key = item.status || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topStatuses = Object.entries(statusCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { topMemberships, topStatuses };
  };

  const { topMemberships, topStatuses } = getTopBottomData(filteredData);

  return (
    <div className="space-y-6">
      {/* Enhanced Location Tabs - matching Sales tab structure */}
      <StudioLocationTabs 
        activeLocation={activeLocation}
        onLocationChange={setActiveLocation}
        showInfoPopover={true}
        infoPopoverContext="expiration-analytics-overview"
      />

      {/* Main Content */}
      <div className="space-y-8">
        {/* Filters */}
        <AutoCloseFilterSection
          filters={filters as any}
          onFiltersChange={(newFilters: any) => setFilters(newFilters as ExpirationFilterOptions)}
          onReset={resetFilters}
        />

        {/* Metric Cards */}
        <ExpirationMetricCards
          data={filteredData}
          historicalData={data || []}
          dateRange={filters.dateRange}
          onMetricClick={(data, type) => handleRowClick(data, 'expiration')}
        />

        {/* Charts Grid */}
        <ExpirationChartsGrid data={filteredData} />

        {/* Analysis Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-white/90 backdrop-blur-sm p-1 rounded-2xl shadow-xl border border-slate-200 flex w-full max-w-7xl mx-auto overflow-hidden">
            <TabsTrigger value="overview" className="relative flex-1 text-center px-4 py-3 font-semibold text-sm md:text-base min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50 border-l border-slate-200 first:border-l-0">
              Overview & Analytics
            </TabsTrigger>
            <TabsTrigger value="churned" className="relative flex-1 text-center px-4 py-3 font-semibold text-sm md:text-base min-h-[48px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50 border-l border-slate-200 first:border-l-0">
              Churned Members Details
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-8">
            <div className="space-y-8">
              {/* Top/Bottom Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/70 backdrop-blur-lg border-gray-200/80 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent">
                      Top Membership Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topMemberships.slice(0, 5).map((membership, index) => (
                        <div key={membership.name} className="flex justify-between items-center p-2 hover:bg-slate-50/50 rounded cursor-pointer"
                             onClick={() => handleRowClick(filteredData.filter(item => item.membershipName === membership.name), 'expiration')}>
                          <span className="text-sm text-slate-700">{membership.name}</span>
                          <span className="text-sm font-medium text-slate-900">{membership.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/70 backdrop-blur-lg border-gray-200/80 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent">
                      Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topStatuses.map((status, index) => (
                        <div key={status.name} className="flex justify-between items-center p-2 hover:bg-slate-50/50 rounded cursor-pointer"
                             onClick={() => handleRowClick(filteredData.filter(item => item.status === status.name), 'status')}>
                          <span className="text-sm text-slate-700">{status.name}</span>
                          <span className="text-sm font-medium text-slate-900">{status.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Analytics */}
              <ExpirationAdditionalAnalytics data={filteredData} />

              {/* Data Tables */}
              <ExpirationDataTables 
                data={filteredData} 
                onRowClick={(item) => handleRowClick([item], 'member')} 
              />
            </div>
          </TabsContent>

          {/* Churned Members Tab */}
          <TabsContent value="churned" className="mt-8">
            <ChurnedMembersDetailedTable
              data={filteredData}
              onRowClick={(item) => handleRowClick([item], 'member')}
            />
          </TabsContent>
        </Tabs>
      </div>

      {drillDownData && (
        <ModernDrillDownModal 
          isOpen={!!drillDownData} 
          onClose={() => setDrillDownData(null)} 
          data={drillDownData} 
          type="member"
        />
      )}
    </div>
  );
};

export default ExpirationAnalyticsSection;