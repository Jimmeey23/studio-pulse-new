import React, { useEffect, useState, useMemo } from 'react';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { LateCancellationsMetricCards } from '@/components/dashboard/LateCancellationsMetricCards';
import { LateCancellationsInteractiveCharts } from '@/components/dashboard/LateCancellationsInteractiveCharts';
import { EnhancedLateCancellationsTopBottomLists } from '@/components/dashboard/EnhancedLateCancellationsTopBottomLists';
import { EnhancedLateCancellationsDataTables } from '@/components/dashboard/EnhancedLateCancellationsDataTables';
import { EnhancedLateCancellationsFilterSection } from '@/components/dashboard/EnhancedLateCancellationsFilterSection';
import { LateCancellationsMonthOnMonthTable } from '@/components/dashboard/LateCancellationsMonthOnMonthTable';
import { Footer } from '@/components/ui/footer';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { LateCancellationsDrillDownModal } from '@/components/dashboard/LateCancellationsDrillDownModal';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { formatNumber } from '@/utils/formatters';
import { getDashboardDefaultDateRange } from '@/utils/dateUtils';
import '@/components/dashboard/trainer-performance-styles.css';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { getActiveConsolidatedExportPreset } from '@/utils/consolidatedExportPreset';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

const LateCancellations = () => {
  const { data: lateCancellationsData, allCheckins, loading } = useLateCancellationsData();
  const { isLoading, setLoading } = useGlobalLoading();
  const exportPreset = useMemo(() => (typeof window !== 'undefined' ? getActiveConsolidatedExportPreset(window.location.search) : null), []);
  
  // Location tabs state
  const [activeLocation, setActiveLocation] = useState(exportPreset?.studioId || 'kwality');
  
  const defaultDateRange = useMemo(() => getDashboardDefaultDateRange(), []);

  const [selectedTimeframe, setSelectedTimeframe] = useState('custom');
  const [selectedTrainer, setSelectedTrainer] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all');
  const [dateRange, setDateRange] = useState({ start: exportPreset?.startDate || defaultDateRange.start, end: exportPreset?.endDate || defaultDateRange.end });
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  
  // Get unique locations for tabs - use allCheckins if no late cancellations data
  const locations = useMemo(() => {
    const dataToCheck = Array.isArray(lateCancellationsData) && lateCancellationsData.length > 0 
      ? lateCancellationsData 
      : (Array.isArray(allCheckins) ? allCheckins : []);
    
    if (dataToCheck.length === 0) {
      // Always show default locations even if no data
      return [
        { id: 'all', name: 'All Locations' },
        { id: 'kwality', name: 'Kwality House' },
        { id: 'supreme', name: 'Supreme HQ' },
        { id: 'kenkere', name: 'Kenkere House' }
      ];
    }
    
    const uniqueLocations = Array.from(new Set(dataToCheck.map(item => item?.location).filter(Boolean)));
      return [
        { id: 'all', name: 'All Locations' },
        { id: 'kwality', name: 'Kwality House' },
        { id: 'supreme', name: 'Supreme HQ' },
        { id: 'kenkere', name: 'Kenkere House' },
        { id: 'popup', name: 'Pop-up' }
      ].filter(loc => loc.id === 'all' || uniqueLocations.some(ul => 
      loc.id === 'kwality' ? ul.includes('Kwality') :
      loc.id === 'supreme' ? ul.includes('Supreme') :
      loc.id === 'kenkere' ? ul.includes('Kenkere') :
      loc.id === 'popup' ? (ul.includes('Pop') || ul.includes('Pop-up') || ul.includes('Popup')) : false
    ));
  }, [lateCancellationsData, allCheckins]);
  
  // Helper functions for consistent date parsing
  const parseItemDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    let parsedDate: Date;
    
    if (dateStr.includes('-')) {
      // ISO format: YYYY-MM-DD
      parsedDate = new Date(dateStr);
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY format
        parsedDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else {
        return null;
      }
    } else {
      return null;
    }
    
    // Normalize to start of day in local timezone for consistent comparison
    parsedDate.setHours(0, 0, 0, 0);
    return parsedDate;
  };
  
  // Helper function to normalize date to start of day
  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };
  
  // Enhanced filter data based on all selected filters
  const filteredData = useMemo(() => {
    if (!Array.isArray(lateCancellationsData)) return [];
    
    let filtered = lateCancellationsData;
    
    // Location tab filter
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const location = (item?.location || '').toString().toLowerCase();
        if (activeLocation === 'kwality') return location.includes('kwality') || location.includes('kemps');
        if (activeLocation === 'supreme') return location.includes('supreme') || location.includes('bandra');
        if (activeLocation === 'kenkere') return location.includes('kenkere');
        if (activeLocation === 'popup') return location.includes('pop') || location.includes('popup') || location.includes('pop-up');
        return true;
      });
    }
    
    // Trainer filter
    if (selectedTrainer !== 'all') {
      filtered = filtered.filter(item => item?.paymentMethodName === selectedTrainer);
    }
    
    // Class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(item => item?.cleanedClass === selectedClass);
    }
    
    // Product filter
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(item => item?.cleanedProduct === selectedProduct);
    }
    
    // Time slot filter
    if (selectedTimeSlot !== 'all') {
      filtered = filtered.filter(item => {
        if (!item?.time) return false;
        const hour = parseInt(item.time.split(':')[0]);
        switch (selectedTimeSlot) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 17;
          case 'evening':
            return hour >= 17 && hour < 22;
          case 'late':
            return hour >= 22 || hour < 6;
          default:
            return true;
        }
      });
    }
    
    // Timeframe filter
    if (selectedTimeframe !== 'all') {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (selectedTimeframe) {
        case '1w':
          startDate.setDate(now.getDate() - 7);
          startDate = normalizeDate(startDate);
          endDate = normalizeDate(now);
          break;
        case '2w':
          startDate.setDate(now.getDate() - 14);
          startDate = normalizeDate(startDate);
          endDate = normalizeDate(now);
          break;
        case '1m':
          startDate.setMonth(now.getMonth() - 1);
          startDate = normalizeDate(startDate);
          endDate = normalizeDate(now);
          break;
        case 'prev-month':
          // Previous complete month - first day to last day
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          endDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(item => {
            const itemDate = parseItemDate(item?.dateIST);
            if (!itemDate) return false;
            return itemDate >= startDate && itemDate <= endDate;
          });
          return filtered;
        case '3m':
          startDate.setMonth(now.getMonth() - 3);
          startDate = normalizeDate(startDate);
          endDate = normalizeDate(now);
          break;
        case '6m':
          startDate.setMonth(now.getMonth() - 6);
          startDate = normalizeDate(startDate);
          endDate = normalizeDate(now);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          startDate = normalizeDate(startDate);
          endDate = normalizeDate(now);
          break;
        case 'custom':
          if (dateRange.start || dateRange.end) {
            const customStart = dateRange.start ? normalizeDate(new Date(dateRange.start)) : new Date('2020-01-01');
            const customEnd = dateRange.end ? normalizeDate(new Date(dateRange.end)) : normalizeDate(now);
            filtered = filtered.filter(item => {
              const itemDate = parseItemDate(item?.dateIST);
              if (!itemDate) return false;
              return itemDate >= customStart && itemDate <= customEnd;
            });
          }
          return filtered;
        default:
          return filtered;
      }
      
      filtered = filtered.filter(item => {
        const itemDate = parseItemDate(item?.dateIST);
        if (!itemDate) return false;
        return itemDate >= startDate && itemDate <= endDate;
      });
    }
    
    return filtered;
  }, [lateCancellationsData, activeLocation, selectedTimeframe, selectedTrainer, selectedClass, selectedProduct, selectedTimeSlot, dateRange]);

  // Clear all filters function
  const clearAllFilters = () => {
    setSelectedTimeframe('custom');
    setSelectedTrainer('all');
    setSelectedClass('all');
    setSelectedProduct('all');
    setSelectedTimeSlot('all');
    setDateRange({ start: defaultDateRange.start, end: defaultDateRange.end });
  };

  const handleDrillDownOpen = (payload: any) => {
    if (!payload) return;
    setDrillDownData(payload);
    setIsDrillDownOpen(true);
  };

  // Filter data for charts (exempt from date range)
  const chartData = useMemo(() => {
    if (!Array.isArray(lateCancellationsData)) return [];
    
    let filtered = lateCancellationsData;
    
    // Apply all filters except timeframe for charts
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const location = (item?.location || '').toString().toLowerCase();
        if (activeLocation === 'kwality') return location.includes('kwality') || location.includes('kemps');
        if (activeLocation === 'supreme') return location.includes('supreme') || location.includes('bandra');
        if (activeLocation === 'kenkere') return location.includes('kenkere');
        if (activeLocation === 'popup') return location.includes('pop') || location.includes('popup') || location.includes('pop-up');
        return true;
      });
    }
    
    if (selectedTrainer !== 'all') {
      filtered = filtered.filter(item => item?.paymentMethodName === selectedTrainer);
    }
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter(item => item?.cleanedClass === selectedClass);
    }
    
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(item => item?.cleanedProduct === selectedProduct);
    }
    
    if (selectedTimeSlot !== 'all') {
      filtered = filtered.filter(item => {
        if (!item?.time) return false;
        const hour = parseInt(item.time.split(':')[0]);
        switch (selectedTimeSlot) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 17;
          case 'evening':
            return hour >= 17 && hour < 22;
          case 'late':
            return hour >= 22 || hour < 6;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [lateCancellationsData, activeLocation, selectedTrainer, selectedClass, selectedProduct, selectedTimeSlot]);

  // Apply the same filters to allCheckins for global consistency, including timeframe
  const filteredCheckins = useMemo(() => {
    if (!Array.isArray(allCheckins)) return [] as any[];
    let filtered: any[] = allCheckins;

    // Location filter
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const location = item?.location || '';
        return activeLocation === 'kwality' ? location.includes('Kwality') :
               activeLocation === 'supreme' ? location.includes('Supreme') :
               activeLocation === 'kenkere' ? location.includes('Kenkere') : true;
      });
    }

    // Trainer filter
    if (selectedTrainer !== 'all') {
      filtered = filtered.filter(item => item?.paymentMethodName === selectedTrainer);
    }

    // Class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(item => item?.cleanedClass === selectedClass);
    }

    // Product filter
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(item => item?.cleanedProduct === selectedProduct);
    }

    // Time slot filter
    if (selectedTimeSlot !== 'all') {
      filtered = filtered.filter(item => {
        if (!item?.time) return false;
        const hour = parseInt(item.time.split(':')[0]);
        switch (selectedTimeSlot) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 17;
          case 'evening':
            return hour >= 17 && hour < 22;
          case 'late':
            return hour >= 22 || hour < 6;
          default:
            return true;
        }
      });
    }

    // Timeframe filter mirrors cancellations
    if (selectedTimeframe !== 'all') {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      switch (selectedTimeframe) {
        case '1w':
          startDate.setDate(now.getDate() - 7);
          startDate = normalizeDate(startDate);
          endDate = normalizeDate(now);
          break;
        case '2w':
          startDate.setDate(now.getDate() - 14);
          startDate = normalizeDate(startDate);
          endDate = normalizeDate(now);
          break;
        case '1m':
          startDate.setMonth(now.getMonth() - 1);
          startDate = normalizeDate(startDate);
          endDate = normalizeDate(now);
          break;
        case 'prev-month': {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          endDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(item => {
            const itemDate = parseItemDate(item?.dateIST);
            if (!itemDate) return false;
            return itemDate >= startDate && itemDate <= endDate;
          });
          return filtered;
        }
        case '3m':
          startDate.setMonth(now.getMonth() - 3);
          startDate = normalizeDate(startDate);
          endDate = normalizeDate(now);
          break;
        case '6m':
          startDate.setMonth(now.getMonth() - 6);
          startDate = normalizeDate(startDate);
          endDate = normalizeDate(now);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          startDate = normalizeDate(startDate);
          endDate = normalizeDate(now);
          break;
        case 'custom': {
          if (dateRange.start || dateRange.end) {
            const customStart = dateRange.start ? normalizeDate(new Date(dateRange.start)) : new Date('2020-01-01');
            const customEnd = dateRange.end ? normalizeDate(new Date(dateRange.end)) : normalizeDate(now);
            filtered = filtered.filter(item => {
              const itemDate = parseItemDate(item?.dateIST);
              if (!itemDate) return false;
              return itemDate >= customStart && itemDate <= customEnd;

            });
          }
          return filtered;
        }
        default:
          break;
      }
      filtered = filtered.filter(item => {
        const itemDate = parseItemDate(item?.dateIST);
        if (!itemDate) return false;
        return itemDate >= startDate && itemDate <= endDate;
      });
    }
    return filtered;
  }, [allCheckins, activeLocation, selectedTrainer, selectedClass, selectedProduct, selectedTimeSlot, selectedTimeframe, dateRange]);

  const heroMetrics = useMemo(() => {
    // If no late cancellations, show available cancellation records across locations
    if (!filteredData || filteredData.length === 0) {
      if (!filteredCheckins || filteredCheckins.length === 0) {
        return [{ location: 'No Data', label: 'Available', value: '—' }];
      }
      
      const locations = [
        { key: 'Kwality', name: 'Kwality' },
        { key: 'Supreme', name: 'Supreme' },
        { key: 'Kenkere', name: 'Kenkere' }
      ];

      return locations.map(location => {
        const locationData = filteredCheckins.filter(item => 
          item.location?.includes(location.key)
        );
        
        return {
          location: location.name,
          label: 'Cancellation Records',
          value: formatNumber(locationData.length)
        };
      });
    }

    const locations = [
      { key: 'Kwality', name: 'Kwality' },
      { key: 'Supreme', name: 'Supreme' },
      { key: 'Kenkere', name: 'Kenkere' }
    ];

    return locations.map(location => {
      const locationData = filteredData.filter(item => 
        item.location?.includes(location.key)
      );
      
      const totalCancellations = locationData.length;
      
      return {
        location: location.name,
        label: 'Late Cancellations',
        value: formatNumber(totalCancellations)
      };
    });
  }, [filteredData, filteredCheckins]);

  useEffect(() => {
    setLoading(loading, 'Loading late cancellations data...');
  }, [loading, setLoading]);

  // Remove individual loader - rely on global loader only

  const exportButton = (
    <AdvancedExportButton 
      lateCancellationsData={filteredData}
      defaultFileName={`late-cancellations-${activeLocation}`}
      size="sm"
      variant="ghost"
      buttonClassName="rounded-xl border border-white/30 text-white hover:border-white/50"
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
      <DashboardMotionHero 
        title="Late Cancellations"
        subtitle="Deeper cancellation intelligence from the Late Cancellations report, including event trends, lead-time behavior, membership patterns, penalties, and location insights"
        metrics={heroMetrics}
        extra={exportButton}
      />

      {/* Main Content */}
      <div className="relative">
        <div className="container mx-auto px-6 py-8">
          {/* Location Tabs - New Animated Component */}
          <StudioLocationTabs
            activeLocation={activeLocation}
            onLocationChange={setActiveLocation}
            className="mb-8"
          />

          {/* Content for Selected Location */}
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-100 bg-white/85 px-5 py-4 shadow-sm backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-orange-500 text-white shadow-md">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">Interactive drill-down is enabled</p>
                <p className="text-sm text-slate-600">Click cards, ranking tiles, and table rows to open detailed cancellation records with lead-time and penalty context.</p>
              </div>
              <Badge className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-50">Click to explore</Badge>
            </div>

            {/* No Data Message */}
            {lateCancellationsData.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-900 font-medium">
                  No late cancellations recorded in the selected period.
                </p>
                <p className="text-blue-700 text-sm mt-2">
                  Adjust filters to view different date ranges or locations from the Late Cancellations report.
                </p>
              </div>
            )}
            
            {/* Enhanced Filter Section */}
            <EnhancedLateCancellationsFilterSection
              selectedLocation="all"
              onLocationChange={() => {}}
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
              selectedTrainer={selectedTrainer}
              onTrainerChange={setSelectedTrainer}
              selectedClass={selectedClass}
              onClassChange={setSelectedClass}
              selectedProduct={selectedProduct}
              onProductChange={setSelectedProduct}
              selectedTimeSlot={selectedTimeSlot}
              onTimeSlotChange={setSelectedTimeSlot}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              data={lateCancellationsData}
              onClearFilters={clearAllFilters}
            />
            
            {/* Metric Cards */}
            <LateCancellationsMetricCards data={filteredData} onMetricClick={handleDrillDownOpen} />
            
            {/* Interactive Charts */}
            <LateCancellationsInteractiveCharts data={chartData} />
            
            {/* Enhanced Top/Bottom Lists */}
            <EnhancedLateCancellationsTopBottomLists data={filteredData} onItemClick={handleDrillDownOpen} />
            
            {/* Month on Month Analysis Table */}
            <LateCancellationsMonthOnMonthTable data={chartData} onRowClick={handleDrillDownOpen} />
            
            {/* Enhanced Detailed Data Tables with Pagination */}
            <EnhancedLateCancellationsDataTables data={filteredData} allCheckins={filteredCheckins} onDrillDown={handleDrillDownOpen} />
          </div>
        </div>
      </div>

      <LateCancellationsDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        data={drillDownData}
      />
      
      <Footer />
    </div>
  );
};

export default LateCancellations;
