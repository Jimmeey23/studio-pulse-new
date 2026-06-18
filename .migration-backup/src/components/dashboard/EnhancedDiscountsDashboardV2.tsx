import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiscountsAnimatedMetricCards } from './DiscountsAnimatedMetricCards';
import { AutoCloseFilterSection } from './AutoCloseFilterSection';
import { DiscountInteractiveCharts } from './DiscountInteractiveCharts';
import { DiscountInteractiveTopBottomLists } from './DiscountInteractiveTopBottomLists';
import { EnhancedDiscountDataTable } from './EnhancedDiscountDataTable';
import { EnhancedDiscountBreakdownTables } from './EnhancedDiscountBreakdownTables';
import { DiscountDrillDownModal } from './DiscountDrillDownModal';
import { MonthOnMonthDiscountTable } from './MonthOnMonthDiscountTable';
import { DataScienceInsightsPanel } from './DataScienceInsightsPanel';
import { DiscountForecastingToolkit } from './DiscountForecastingToolkit';
import { getActiveTabClasses } from '@/utils/colorThemes';
import { SalesData } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { InfoPopover } from '@/components/ui/InfoSidebar';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { getDashboardDefaultDateRange, parseDate } from '@/utils/dateUtils';

interface EnhancedDiscountsDashboardV2Props {
  data: SalesData[];
}

const locations = [
  { id: 'all', name: 'All Locations' },
  { id: 'kwality', name: 'Kwality House, Kemps Corner' },
  { id: 'supreme', name: 'Supreme HQ, Bandra' },
  { id: 'kenkere', name: 'Kenkere House' },
  { id: 'popup', name: 'Pop-up' }
];

export const EnhancedDiscountsDashboardV2: React.FC<EnhancedDiscountsDashboardV2Props> = ({ data }) => {
  const [activeLocation, setActiveLocation] = useState('kwality');  // Changed default to 'kwality' for better visibility
  const [filters, setFilters] = useState<any>({
    dateRange: getDashboardDefaultDateRange(),
    category: [],
    product: [],
    soldBy: [],
    paymentMethod: []
  });
  
  const [drillDownData, setDrillDownData] = useState<{
    isOpen: boolean;
    title: string;
    data: any[];
    type: string;
  }>({ isOpen: false, title: '', data: [], type: '' });

  // Debug: Log received data with available months
  useEffect(() => {
    if (data?.length > 0) {
      // Analyze what months have data
      const monthCounts: Record<string, number> = {};
      data.forEach(d => {
        if (d.paymentDate) {
          const parsed = parseDate(d.paymentDate);
          if (parsed) {
            const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
            monthCounts[key] = (monthCounts[key] || 0) + 1;
          }
        }
      });
      
      const sortedMonths = Object.entries(monthCounts).sort((a, b) => b[0].localeCompare(a[0]));
      
    }
  }, [data]);

  // Get the most recent month with data
  const getLatestMonthWithData = () => {
    if (!data || data.length === 0) return null;
    
    let latestDate: Date | null = null;
    
    data.forEach(d => {
      if (d.paymentDate) {
        const parsed = parseDate(d.paymentDate);
        if (parsed && (!latestDate || parsed > latestDate)) {
          latestDate = parsed;
        }
      }
    });
    
    if (!latestDate) return null;
    
    const firstDay = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
    const lastDay = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 0);
    
    return {
      start: `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-01`,
      end: `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
    };
  };

  useEffect(() => {
    setFilters((prev: any) => ({
      ...prev,
      dateRange: getDashboardDefaultDateRange()
    }));
  }, []);

  // Apply filters similar to sales section
  const applyFilters = (rawData: SalesData[], includeHistoric: boolean = false) => {
    let filtered = rawData.slice();

    // Apply location filter
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const loc = (item.calculatedLocation || '').toString().toLowerCase();
        if (activeLocation === 'kwality') return loc.includes('kwality') || loc.includes('kemps');
        if (activeLocation === 'supreme') return loc.includes('supreme') || loc.includes('bandra');
        if (activeLocation === 'kenkere') return loc.includes('kenkere') || loc.includes('bengaluru');
        if (activeLocation === 'popup') return loc.includes('pop') || loc.includes('popup') || loc.includes('pop-up');
        return false;
      });
    }

    // Apply date range filter (skip if includeHistoric is true)
    if (!includeHistoric && (filters.dateRange.start || filters.dateRange.end)) {
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? (() => {
        const date = new Date(filters.dateRange.end);
        date.setHours(23, 59, 59, 999);
        return date;
      })() : null;

      if (startDate || endDate) {
        filtered = filtered.filter(item => {
          if (!item.paymentDate) return false;
          
          // Use centralized parseDate utility for consistent parsing
          const itemDate = parseDate(item.paymentDate);
          
          if (!itemDate || isNaN(itemDate.getTime())) {
            // Debug only first few invalid dates
            return false;
          }
          
          const itemInRange = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
          
          return itemInRange;
        });
      }
    }

    // Apply category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(item => 
        filters.category.includes(item.cleanedCategory || 'Uncategorized')
      );
    }

    // Apply product filter
    if (filters.product && filters.product.length > 0) {
      filtered = filtered.filter(item => 
        filters.product.includes(item.cleanedProduct || item.paymentItem || 'Unknown')
      );
    }

    // Apply soldBy filter
    if (filters.soldBy && filters.soldBy.length > 0) {
      filtered = filtered.filter(item => 
        filters.soldBy.includes(item.soldBy || 'Unknown')
      );
    }

    // Apply payment method filter
    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      filtered = filtered.filter(item => 
        filters.paymentMethod.includes(item.paymentMethod || 'Unknown')
      );
    }

    return filtered;
  };

  const filteredData = useMemo(() => applyFilters(data), [data, filters, activeLocation]);
  const allHistoricData = useMemo(() => applyFilters(data, true), [data, activeLocation]);

  // For discount analysis, we need ALL sales data to calculate discount opportunities and performance
  // Show all filtered data (both discounted and non-discounted transactions)
  const discountAnalysisData = useMemo(() => filteredData, [filteredData]);

  // Separate data for components that specifically need only discounted transactions
  const handleMetricClick = (metricData: any) => {
    setDrillDownData({
      isOpen: true,
      title: `${metricData.title} Analysis`,
      data: metricData.rawData || filteredData,
      type: 'metric'
    });
  };

  const handleDrillDown = (title: string, data: any[], type: string) => {
    setDrillDownData({
      isOpen: true,
      title,
      data,
      type
    });
  };

  const resetFilters = () => {
    setFilters({
      dateRange: getDashboardDefaultDateRange(),
      category: [],
      product: [],
      soldBy: [],
      paymentMethod: []
    });
  };

  // Calculate tab counts for location tabs using filtered data
  const tabCounts = useMemo(() => {
    const counts = { all: 0, kwality: 0, supreme: 0, kenkere: 0 };
    
    discountAnalysisData.forEach(item => {
      counts.all++;
      const loc = (item.calculatedLocation || '').toString().toLowerCase();
      if (loc.includes('kwality')) {
        counts.kwality++;
      } else if (loc.includes('supreme')) {
        counts.supreme++;
      } else if (loc.includes('kenkere') || loc.includes('bengaluru')) {
        counts.kenkere++;
      }
    });
    
    return counts;
  }, [discountAnalysisData]);

  return (
    <div className="space-y-8">
      {/* Note Taker Component */}
      <div className="container mx-auto px-6">
  {/* NoteTaker removed as per request */}
      </div>

      {/* Enhanced Location Tabs - unified styling (matching Client Retention) */}
      <div className="container mx-auto px-6 space-y-6">
        <StudioLocationTabs 
          activeLocation={activeLocation}
          onLocationChange={setActiveLocation}
          showInfoPopover={true}
          infoPopoverContext="discounts-promotions-overview"
        />

        {/* Content Sections */}
        <div className="space-y-8">
        <div className="w-full">
          <AutoCloseFilterSection
            filters={filters} 
            onFiltersChange={setFilters} 
            onReset={resetFilters} 
          />
        </div>

        {/* Modern Animated Metric Cards */}
        <DiscountsAnimatedMetricCards 
          data={discountAnalysisData}
          historicalData={allHistoricData}
          dateRange={filters.dateRange}
          onMetricClick={handleMetricClick}
        />

        <DiscountForecastingToolkit
          currentData={discountAnalysisData}
          historicalData={allHistoricData}
        />

        <DataScienceInsightsPanel
          title="Discount Data Science Toolkit"
          description="Track discount elasticity, outliers, and concentration risk to improve promotional strategy quality."
          data={discountAnalysisData}
          initiallyCollapsed={true}
          metricOptions={[
            {
              key: 'discountAmount',
              label: 'Discount Amount',
              accessor: (row: any) => Number(row?.discountAmount || 0),
            },
            {
              key: 'discountPercentage',
              label: 'Discount %',
              accessor: (row: any) => Number(row?.discountPercentage || 0),
            },
            {
              key: 'paymentValue',
              label: 'Net Payment Value',
              accessor: (row: any) => Number(row?.paymentValue || 0),
            },
            {
              key: 'grossPotentialValue',
              label: 'Gross Potential Value',
              accessor: (row: any) => Number(row?.paymentValue || 0) + Number(row?.discountAmount || 0),
            },
          ]}
          dateAccessor={(row: any) => {
            if (!row?.paymentDate) return null;
            const parsed = parseDate(row.paymentDate);
            return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
          }}
        />

        <DiscountInteractiveCharts data={allHistoricData} />

        <DiscountInteractiveTopBottomLists 
          data={discountAnalysisData} 
          onDrillDown={handleDrillDown}
        />

        {/* Month-on-Month Analysis Table */}
        <MonthOnMonthDiscountTable data={allHistoricData} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="detailed" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-slate-50 via-indigo-50 to-purple-50 p-1.5 rounded-xl shadow-md border border-slate-200">
            <TabsTrigger 
              value="detailed" 
              className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-700 hover:text-slate-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Data Tables
            </TabsTrigger>
            <TabsTrigger 
              value="breakdown" 
              className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-700 hover:text-slate-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Breakdowns
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="rounded-lg px-4 py-2.5 font-semibold transition-all duration-300 text-slate-700 hover:text-slate-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <DiscountInteractiveCharts data={discountAnalysisData} />
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-200/50">
              <EnhancedDiscountDataTable 
                data={discountAnalysisData}
                onRowClick={(title, data, type) => handleDrillDown(title, data, type)}
              />
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-6">
            <EnhancedDiscountBreakdownTables 
              data={discountAnalysisData}
              onDrillDown={handleDrillDown}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>      {/* Drill Down Modal */}
      <DiscountDrillDownModal
        isOpen={drillDownData.isOpen}
        onClose={() => setDrillDownData({ isOpen: false, title: '', data: [], type: '' })}
        title={drillDownData.title}
        data={drillDownData.data}
        type={drillDownData.type}
      />
    </div>
  );
};
