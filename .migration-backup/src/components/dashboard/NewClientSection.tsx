
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedClientConversionFilterSection } from './EnhancedClientConversionFilterSection';
import { ClientConversionCharts } from './ClientConversionCharts';
import { ClientAcquisitionFunnel } from './ClientAcquisitionFunnel';
import { ClientConversionTopBottomLists } from './ClientConversionTopBottomLists';
import { EnhancedClientConversionMetrics } from './EnhancedClientConversionMetrics';
import { ConversionAnalyticsTables } from './ConversionAnalyticsTables';
import { ClientConversionDataTable } from './ClientConversionDataTable';
import { ClientConversionMonthOnMonthTable } from './ClientConversionMonthOnMonthTable';
import { ClientConversionYearOnYearTable } from './ClientConversionYearOnYearTableV2';
import { SourceDataModal } from '@/components/ui/SourceDataModal';
import { DrillDownModal } from './DrillDownModal';
import { Button } from '@/components/ui/button';
import { Eye, BarChart3, Users, Target, TrendingUp } from 'lucide-react';
import { NewClientData, NewClientFilterOptions } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { getDashboardDefaultDateRange } from '@/utils/dateUtils';
import { logger } from '@/utils/logger';

interface NewClientSectionProps {
  data: NewClientData[];
}

export const NewClientSection: React.FC<NewClientSectionProps> = ({
  data
}) => {
  const [showSourceData, setShowSourceData] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [filters, setFilters] = useState<NewClientFilterOptions>(() => {
    const defaultDateRange = getDashboardDefaultDateRange();
    return {
      dateRange: defaultDateRange,
      location: [],
      homeLocation: [],
      trainer: [],
      paymentMethod: [],
      retentionStatus: [],
      conversionStatus: [],
      isNew: [],
      minLTV: undefined,
      maxLTV: undefined
    };
  });

  // Helper function to filter data
  const applyFilters = (rawData: NewClientData[]) => {
    if (!rawData || !Array.isArray(rawData)) {
      return [];
    }

    let filtered = rawData;

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

      filtered = filtered.filter(item => {
        if (!item.firstVisitDate) return false;
        
        let itemDate: Date;
        if (item.firstVisitDate.includes('/')) {
          const [day, month, year] = item.firstVisitDate.split(' ')[0].split('/');
          itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          itemDate = new Date(item.firstVisitDate);
        }
        
        if (isNaN(itemDate.getTime())) return false;
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }

    // Apply location filter (only 3 main locations)
    if (filters.location?.length) {
      filtered = filtered.filter(item => 
        filters.location!.includes(item.firstVisitLocation) || 
        filters.location!.includes(item.homeLocation)
      );
    }

    // Apply trainer filter
    if (filters.trainer?.length) {
      filtered = filtered.filter(item => filters.trainer!.includes(item.trainerName));
    }

    // Apply payment method filter
    if (filters.paymentMethod?.length) {
      filtered = filtered.filter(item => filters.paymentMethod!.includes(item.paymentMethod));
    }

    // Apply retention status filter
    if (filters.retentionStatus?.length) {
      filtered = filtered.filter(item => filters.retentionStatus!.includes(item.retentionStatus));
    }

    // Apply conversion status filter
    if (filters.conversionStatus?.length) {
      filtered = filtered.filter(item => filters.conversionStatus!.includes(item.conversionStatus));
    }

    // Apply isNew filter
    if (filters.isNew?.length) {
      filtered = filtered.filter(item => filters.isNew!.includes(item.isNew));
    }

    // Apply LTV range filter
    if (filters.minLTV !== undefined) {
      filtered = filtered.filter(item => (item.ltv || 0) >= filters.minLTV!);
    }
    if (filters.maxLTV !== undefined) {
      filtered = filtered.filter(item => (item.ltv || 0) <= filters.maxLTV!);
    }

    return filtered;
  };

  const filteredData = useMemo(() => applyFilters(data || []), [data, filters]);

  // Get unique values for filters (only 3 main locations)
  const uniqueLocations = useMemo(() => {
    const mainLocations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru'];
    const locations = new Set<string>();
    data.forEach(client => {
      if (client.firstVisitLocation && mainLocations.includes(client.firstVisitLocation)) {
        locations.add(client.firstVisitLocation);
      }
      if (client.homeLocation && mainLocations.includes(client.homeLocation)) {
        locations.add(client.homeLocation);
      }
    });
    return Array.from(locations).filter(Boolean);
  }, [data]);

  const uniqueTrainers = useMemo(() => {
    const trainers = new Set<string>();
    data.forEach(client => {
      if (client.trainerName) trainers.add(client.trainerName);
    });
    return Array.from(trainers).filter(Boolean);
  }, [data]);

  const uniqueMembershipTypes = useMemo(() => {
    const memberships = new Set<string>();
    data.forEach(client => {
      if (client.membershipUsed) memberships.add(client.membershipUsed);
    });
    return Array.from(memberships).filter(Boolean);
  }, [data]);

  const handleItemClick = (item: any) => {
    logger.debug('Item clicked:', item);
    setDrillDownData(item);
  };

  return (
    <div className="space-y-8">
      {/* Filter Section - Using Enhanced Filter */}
      <EnhancedClientConversionFilterSection
        filters={filters}
        onFiltersChange={setFilters}
        locations={uniqueLocations}
        trainers={uniqueTrainers}
        membershipTypes={uniqueMembershipTypes}
      />

      {/* Enhanced Metrics using filtered data */}
      <EnhancedClientConversionMetrics data={filteredData} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <TabsList className="grid w-full grid-cols-6 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="overview" className="text-sm font-medium">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="performance" className="text-sm font-medium">
                <Target className="w-4 h-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="monthonmonth" className="text-sm font-medium">
                <Target className="w-4 h-4 mr-2" />
                Month-on-Month
              </TabsTrigger>
              <TabsTrigger value="yearonyear" className="text-sm font-medium">
                <Target className="w-4 h-4 mr-2" />
                Year-on-Year
              </TabsTrigger>
              <TabsTrigger value="detailed" className="text-sm font-medium">
                <Eye className="w-4 h-4 mr-2" />
                Detailed View
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent value="overview" className="space-y-8">
          <ClientConversionCharts data={filteredData} />
          <ClientConversionTopBottomLists data={filteredData} onItemClick={handleItemClick} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8">
          <ConversionAnalyticsTables data={filteredData} onItemClick={handleItemClick} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-8">
          <ClientConversionTopBottomLists data={filteredData} onItemClick={handleItemClick} />
        </TabsContent>

        <TabsContent value="monthonmonth" className="space-y-8">
          <ClientConversionMonthOnMonthTable data={filteredData} />
        </TabsContent>

        <TabsContent value="yearonyear" className="space-y-8">
          <ClientConversionYearOnYearTable data={filteredData} />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-8">
          <ClientConversionDataTable data={filteredData} onItemClick={handleItemClick} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {drillDownData && (
        <DrillDownModal
          isOpen={!!drillDownData}
          onClose={() => setDrillDownData(null)}
          data={drillDownData}
          type="client-conversion"
        />
      )}

      {showSourceData && (
        <SourceDataModal
          open={showSourceData}
          onOpenChange={setShowSourceData}
          sources={[
            {
              name: "New Clients",
              data: data
            }
          ]}
        />
      )}
    </div>
  );
};

export default NewClientSection;
