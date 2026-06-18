
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  Calendar, 
  Eye,
  Activity,
  UserCheck,
  Zap,
  ShoppingCart,
  TrendingDown,
  Percent,
  Clock,
  Home,
  Play,
  Pause,
  FileText,
  Download,
  Loader2,
  DollarSign,
  CreditCard,
  UserPlus
} from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { ExecutiveLocationSelector } from './ExecutiveLocationSelector';
import { ExecutiveFilterSection } from './ExecutiveFilterSection';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { SourceDataModal } from '@/components/ui/SourceDataModal';
import { cn } from '@/lib/utils';
import { ExecutiveMetricCardsGrid } from './ExecutiveMetricCardsGrid';
import { ExecutiveChartsGrid } from './ExecutiveChartsGrid';
import { EnhancedExecutiveDataTables } from './EnhancedExecutiveDataTables';
import { ExecutiveTopPerformersGrid } from './ExecutiveTopPerformersGrid';
import { ExecutiveDiscountsTab } from './ExecutiveDiscountsTab';
import { PowerCycleBarreStrengthComparison } from './PowerCycleBarreStrengthComparison';
import { ExpirationMetricCards } from './ExpirationMetricCards';
import { ExpirationDataTables } from './ExpirationDataTables';
import { ExpirationChartsGrid } from './ExpirationChartsGrid';
import { ImprovedLeadMetricCards } from './ImprovedLeadMetricCards';
import { LeadMonthOnMonthTable } from './LeadMonthOnMonthTable';
import { ImprovedLeadTopLists } from './ImprovedLeadTopLists';
import { LeadInteractiveChart } from './LeadInteractiveChart';
import { SessionsMetricCards } from './SessionsMetricCards';
import { SessionsGroupedTable } from './SessionsGroupedTable';
import { SessionsAttendanceAnalytics } from './SessionsAttendanceAnalytics';
import { LateCancellationsMetricCards } from './LateCancellationsMetricCards';
import { LateCancellationsMonthOnMonthTable } from './LateCancellationsMonthOnMonthTable';
import { EnhancedLateCancellationsDataTables } from './EnhancedLateCancellationsDataTables';
import { LateCancellationsInteractiveCharts } from './LateCancellationsInteractiveCharts';
import { ClientConversionMetricCards } from './ClientConversionMetricCards';
import { ClientConversionMonthOnMonthByTypeTable } from './ClientConversionMonthOnMonthByTypeTable';
import { ClientRetentionMonthByTypePivot } from './ClientRetentionMonthByTypePivot';
import { ClientConversionEnhancedCharts } from './ClientConversionEnhancedCharts';
import { SalesAnimatedMetricCards } from './SalesAnimatedMetricCards';
import { SalesInteractiveCharts } from './SalesInteractiveCharts';
import { ProductCategoryMetricsTable } from './ProductCategoryMetricsTable';
import { DiscountsAnimatedMetricCards } from './DiscountsAnimatedMetricCards';
import { EnhancedClientMetricCards } from './EnhancedClientMetricCards';
import { ExecutiveSalesSection } from './ExecutiveSalesSection';
import { ExecutiveSessionsSection } from './ExecutiveSessionsSection';
import { ExecutiveClientsSection } from './ExecutiveClientsSection';
import { ExecutiveTrainersSection } from './ExecutiveTrainersSection';
import { ExecutiveLeadsSection } from './ExecutiveLeadsSection';
import { ExecutiveDiscountsSection } from './ExecutiveDiscountsSection';
import { ExecutiveCancellationsSection } from './ExecutiveCancellationsSection';
import { ExecutiveExpirationsSection } from './ExecutiveExpirationsSection';
import { ComprehensiveMonthOnMonthTable } from './ComprehensiveMonthOnMonthTable';
import { ExecutivePDFExportButton } from './ExecutivePDFExportButton';
import { DashboardChatbot } from './DashboardChatbot';
import InfoPopover from '@/components/ui/InfoSidebar';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useSalesData } from '@/hooks/useSalesData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useDiscountAnalysis } from '@/hooks/useDiscountAnalysis';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useSalesMetrics } from '@/hooks/useSalesMetrics';
import { useClientConversionMetrics } from '@/hooks/useClientConversionMetrics';
import { getSummaryText } from '@/services/infoSummaryService';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { parseDate } from '@/utils/dateUtils';
import { generateHTMLPDFReport, generateMultiLocationHTMLPDFReports } from '@/services/htmlPDFService';

// Helper function to get location ID for InfoPopover
const getLocationId = (location: string | undefined): 'kwality' | 'supreme' | 'kenkere' | 'all' => {
  if (!location) return 'all';
  const loc = location.toLowerCase();
  if (loc.includes('kwality') || loc.includes('kemps')) return 'kwality';
  if (loc.includes('supreme') || loc.includes('bandra')) return 'supreme';
  if (loc.includes('kenkere') || loc.includes('bengaluru')) return 'kenkere';
  return 'all';
};

// Helper function to get growth badge
const getGrowthBadge = (changeValue: number | undefined, trend: string | undefined) => {
  if (changeValue === undefined || changeValue === null) return { icon: TrendingUp, text: 'Stable', color: 'text-gray-600' };
  
  if (changeValue > 0) {
    return {
      icon: TrendingUp,
      text: trend === 'strong' ? 'Strong Growth' : changeValue > 10 ? 'High Growth' : 'Growing',
      color: 'text-green-600 group-hover:text-green-400'
    };
  } else if (changeValue < 0) {
    return {
      icon: TrendingDown,
      text: Math.abs(changeValue) > 10 ? 'Declining' : 'Slight Decline',
      color: 'text-red-600 group-hover:text-red-400'
    };
  } else {
    return {
      icon: TrendingUp,
      text: 'Stable',
      color: 'text-gray-600 group-hover:text-gray-400'
    };
  }
};

// Summary card component
const SummaryCard: React.FC<{ context: string; locationId: 'kwality' | 'supreme' | 'kenkere' | 'all' }> = ({ context, locationId }) => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 mb-6">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Executive Context
          <InfoPopover context={context as any} locationId={locationId} />
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-blue-800 space-y-2">
        {/* InfoPopover content will be shown when clicked */}
        <p className="italic">Click the info icon to view location-specific insights and strategic context.</p>
      </CardContent>
    </Card>
  );
};

export const ComprehensiveExecutiveDashboard = React.memo(() => {
  const [showSourceData, setShowSourceData] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { filters, updateFilters } = useGlobalFilters();
  const { setLoading } = useGlobalLoading();
  const { toast } = useToast();

  // Load real data from hooks
  const { data: salesData, loading: salesLoading } = useSalesData();
  const { data: sessionsData, loading: sessionsLoading } = useSessionsData();
  const { data: payrollData, isLoading: payrollLoading } = usePayrollData();
  const { data: newClientsData, loading: newClientsLoading } = useNewClientData();
  const { data: leadsData, loading: leadsLoading } = useLeadsData();
  const { data: discountData, loading: discountLoading } = useDiscountAnalysis();
  const { data: lateCancellationsData, loading: lateCancellationsLoading } = useLateCancellationsData();
  const { data: expirationsData, loading: expirationsLoading } = useExpirationsData();

  const isLoading = salesLoading || sessionsLoading || payrollLoading || newClientsLoading || leadsLoading || discountLoading || lateCancellationsLoading || expirationsLoading;

  useEffect(() => {
    setLoading(isLoading, 'Loading executive dashboard overview...');
  }, [isLoading, setLoading]);

  // Ensure Executive Summary defaults to November 2025 when this component mounts
  useEffect(() => {
    try {
      // Force the Executive Summary to November 2025 on mount
      updateFilters({ dateRange: { start: '2025-11-01', end: '2025-11-30' } });
    } catch (e) {
      console.warn('Failed to set default Executive Summary date range:', e);
    }
    // Intentionally only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get unique locations for the selector
  const availableLocations = useMemo(() => {
    const locations = new Set<string>();
    
    salesData?.forEach(sale => {
      if (sale.calculatedLocation) locations.add(sale.calculatedLocation);
    });
    
    sessionsData?.forEach(session => {
      if (session.location) locations.add(session.location);
    });
    
    newClientsData?.forEach(client => {
      if (client.homeLocation) locations.add(client.homeLocation);
    });
    
    payrollData?.forEach(payroll => {
      if (payroll.location) locations.add(payroll.location);
    });

    return Array.from(locations).sort();
  }, [salesData, sessionsData, newClientsData, payrollData]);

  // Filter data by selected date range and location
  const previousMonthData = useMemo(() => {
    const startDate = filters.dateRange?.start ? new Date(filters.dateRange.start) : null;
    const endDate = filters.dateRange?.end ? (() => {
      const d = new Date(filters.dateRange.end);
      d.setHours(23, 59, 59, 999);
      return d;
    })() : null;

    const withinDateRange = (dateStr: string) => {
      if (!dateStr) return false;
      const d = parseDate(dateStr);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };

    const normalizeLocationId = (raw: any): 'kwality' | 'supreme' | 'kenkere' | 'all' | null => {
      if (!raw) return null;
      const s = String(raw).toLowerCase();
      if (['all', 'all locations'].includes(s)) return 'all';
      if (s.includes('kwality') || s.includes('kemps')) return 'kwality';
      if (s.includes('supreme') || s.includes('bandra')) return 'supreme';
      if (s.includes('kenkere') || s.includes('bengaluru') || s.includes('bangalore')) return 'kenkere';
      // If we already store ids like 'kwality'/'supreme'/'kenkere'
      if (s === 'kwality' || s === 'supreme' || s === 'kenkere') return s as any;
      return null;
    };

    const filterByLocation = (items: any[], locationKey: string) => {
      if (!filters.location || (Array.isArray(filters.location) && filters.location.length === 0)) return items;
      const locationFilter = Array.isArray(filters.location) ? filters.location[0] : (filters.location as any);
      const locationId = normalizeLocationId(locationFilter);
      if (!locationId || locationId === 'all') return items;

      return items.filter((item) => {
        const itemLocation = item?.[locationKey];
        if (!itemLocation) return false;
        const itemLocationLower = String(itemLocation).toLowerCase();

        // Match Sales tab semantics for Sales locations (calculatedLocation)
        if (locationKey === 'calculatedLocation') {
          if (locationId === 'kwality') return String(itemLocation) === 'Kwality House, Kemps Corner';
          if (locationId === 'supreme') return String(itemLocation) === 'Supreme HQ, Bandra';
          if (locationId === 'kenkere') return itemLocationLower.includes('kenkere') || String(itemLocation) === 'Kenkere House';
        }

        // For other datasets, fall back to flexible matching
        if (locationId === 'kwality') return itemLocationLower.includes('kwality') || itemLocationLower.includes('kemps');
        if (locationId === 'supreme') return itemLocationLower.includes('supreme') || itemLocationLower.includes('bandra');
        if (locationId === 'kenkere') return itemLocationLower.includes('kenkere') || itemLocationLower.includes('bengaluru') || itemLocationLower.includes('bangalore');
        return false;
      });
    };

    const salesBase = filterByLocation(salesData || [], 'calculatedLocation');
    const filteredSales = salesBase.filter((item) => withinDateRange(item.paymentDate));

    const sessionsBase = filterByLocation(sessionsData || [], 'location');
    const filteredSessions = sessionsBase.filter((item) => withinDateRange(item.date));

    const payrollBase = filterByLocation(payrollData || [], 'location');
    const filteredPayroll = payrollBase.filter((item) => withinDateRange(item.monthYear || ''));

    const newClientsBase = filterByLocation(newClientsData || [], 'homeLocation');
    const filteredNewClients = newClientsBase.filter((item) => withinDateRange(item.firstVisitDate));

    const leadsBase = filterByLocation(leadsData || [], 'center');
    const filteredLeads = leadsBase.filter((item) => (item.createdAt ? withinDateRange(item.createdAt) : false));

    const discountsBase = filterByLocation(discountData || [], 'location');
    const filteredDiscounts = discountsBase.filter((item) => withinDateRange(item.paymentDate));

    // Filter late cancellations
    const lateCancellationsBase = filterByLocation(lateCancellationsData || [], 'location');
    const filteredLateCancellations = lateCancellationsBase.filter((item) => {
      const dateStr = item.dateIST || '';
      return typeof dateStr === 'string' && withinDateRange(dateStr);
    });

    // Filter expirations
    const expirationsBase = filterByLocation(expirationsData || [], 'homeLocation');
    const filteredExpirations = expirationsBase.filter((item) => withinDateRange(item.endDate || item.orderAt));









    return {
      sales: filteredSales,
      salesHistoricalBase: salesBase,
      sessions: filteredSessions,
      payroll: filteredPayroll,
      newClients: filteredNewClients,
      newClientsHistoricalBase: newClientsBase,
      leads: filteredLeads,
      discounts: filteredDiscounts,
      lateCancellations: filteredLateCancellations,
      expirations: filteredExpirations
    };
  }, [salesData, sessionsData, payrollData, newClientsData, leadsData, discountData, lateCancellationsData, expirationsData, filters.location, filters.dateRange]);

  // Calculate metrics using hooks with proper filtering
  const salesMetrics = useSalesMetrics(
    previousMonthData?.sales || [],
    (previousMonthData as any)?.salesHistoricalBase || salesData || [],
    { 
      compareMode: 'previousMonth',
      dateRange: filters.dateRange?.start || filters.dateRange?.end ? {
        start: filters.dateRange?.start,
        end: filters.dateRange?.end
      } : undefined
    }
  );

  const clientMetrics = useClientConversionMetrics(
    previousMonthData?.newClients || [],
    (previousMonthData as any)?.newClientsHistoricalBase || newClientsData || [],
    {
      dateRange: {
        start: filters.dateRange?.start,
        end: filters.dateRange?.end
      }
    }
  );

  // Calculate derived metrics from filtered data
  const derivedMetrics = useMemo(() => {
    const sales = previousMonthData?.sales || [];
    const sessions = previousMonthData?.sessions || [];
    const clients = previousMonthData?.newClients || [];
    const cancellations = previousMonthData?.lateCancellations || [];
    const discounts = previousMonthData?.discounts || [];

    return {
      totalRevenue: sales.reduce((sum, s) => sum + ((s.paymentValue || 0) - (s.paymentVAT || 0)), 0),
      totalTransactions: new Set(sales.map(s => s.paymentTransactionId || s.paymentTransactionID).filter(Boolean)).size,
      totalSessions: sessions.length,
      totalVisits: sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0),
      avgAttendance: sessions.length > 0 ? sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0) / sessions.length : 0,
      totalCapacity: sessions.reduce((sum, s) => sum + (s.capacity || 0), 0),
      fillRate: sessions.reduce((sum, s) => sum + (s.capacity || 0), 0) > 0 ? 
        (sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0) / sessions.reduce((sum, s) => sum + (s.capacity || 0), 0)) * 100 : 0,
      lateCancellations: cancellations.length,
      cancellationRate: sessions.length > 0 ? (cancellations.length / sessions.length) * 100 : 0,
      newClients: clients.length,
      conversionRate: clients.length > 0 ? (clients.filter(c => c.conversionStatus === 'Converted').length / clients.length) * 100 : 0,
      retentionRate: clients.length > 0 ? (clients.filter(c => c.retentionStatus === 'Retained').length / clients.length) * 100 : 0,
      avgLTV: clients.length > 0 ? clients.reduce((sum, c) => sum + (c.ltv || 0), 0) / clients.length : 0,
      totalDiscounts: discounts.reduce((sum, d) => sum + (d.discountAmount || 0), 0),
      discountRate: sales.length > 0 ? (discounts.length / sales.length) * 100 : 0
    };
  }, [previousMonthData]);

  // Previous month data for comparison calculations
  const allDataLast3Months = useMemo(() => {
    const now = new Date();
    // Get previous month start and end
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const filterByPreviousMonth = (dateStr: string) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date >= prevMonthStart && date <= prevMonthEnd;
    };

    const filterByLocation = (items: any[], locationKey: string) => {
      if (!filters.location || (Array.isArray(filters.location) && filters.location.length === 0)) return items;
      const locationFilter = Array.isArray(filters.location) ? filters.location[0] : filters.location;
      if (!locationFilter || ['all', 'all locations'].includes(String(locationFilter).toLowerCase())) {
        return items;
      }
      return items.filter(item => item[locationKey] === locationFilter);
    };

    const allSales = filterByLocation(
      salesData?.filter(item => filterByPreviousMonth(item.paymentDate)) || [],
      'calculatedLocation'
    );

    const allSessions = filterByLocation(
      sessionsData?.filter(item => filterByPreviousMonth(item.date)) || [],
      'location'
    );

    const allPayroll = filterByLocation(
      payrollData?.filter(item => filterByPreviousMonth((item as any).monthYear || '')) || [],
      'location'
    );

    const allNewClients = filterByLocation(
      newClientsData?.filter(item => filterByPreviousMonth(item.firstVisitDate)) || [],
      'homeLocation'
    );

    const allLeads = filterByLocation(
      leadsData?.filter(item => filterByPreviousMonth(item.createdAt || '')) || [],
      'center'
    );

    const allDiscounts = filterByLocation(
      discountData?.filter(item => filterByPreviousMonth(item.paymentDate)) || [],
      'location'
    );

    const allLateCancellations = filterByLocation(
      lateCancellationsData?.filter(item => {
        const dateStr = item.dateIST || '';
        return typeof dateStr === 'string' && filterByPreviousMonth(dateStr);
      }) || [],
      'location'
    );

    return {
      sales: allSales,
      sessions: allSessions,
      payroll: allPayroll,
      newClients: allNewClients,
      leads: allLeads,
      discounts: allDiscounts,
      lateCancellations: allLateCancellations
    };
  }, [salesData, sessionsData, payrollData, newClientsData, leadsData, discountData, lateCancellationsData, filters.location]);

  // Year-over-year data for same month last year
  const yearOverYearData = useMemo(() => {
    const now = new Date();
    // Get same month start and end from last year
    const lastYearMonthStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const lastYearMonthEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);

    const filterByLastYearMonth = (dateStr: string) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date >= lastYearMonthStart && date <= lastYearMonthEnd;
    };

    const filterByLocation = (items: any[], locationKey: string) => {
      if (!filters.location || (Array.isArray(filters.location) && filters.location.length === 0)) return items;
      const locationFilter = Array.isArray(filters.location) ? filters.location[0] : filters.location;
      if (!locationFilter || ['all', 'all locations'].includes(String(locationFilter).toLowerCase())) {
        return items;
      }
      return items.filter(item => item[locationKey] === locationFilter);
    };

    const yoySales = filterByLocation(
      salesData?.filter(item => filterByLastYearMonth(item.paymentDate)) || [],
      'calculatedLocation'
    );

    const yoySessions = filterByLocation(
      sessionsData?.filter(item => filterByLastYearMonth(item.date)) || [],
      'location'
    );

    const yoyNewClients = filterByLocation(
      newClientsData?.filter(item => filterByLastYearMonth(item.firstVisitDate)) || [],
      'homeLocation'
    );

    const yoyLeads = filterByLocation(
      leadsData?.filter(item => filterByLastYearMonth(item.createdAt || '')) || [],
      'center'
    );

    const yoyDiscounts = filterByLocation(
      discountData?.filter(item => filterByLastYearMonth(item.paymentDate)) || [],
      'location'
    );

    const yoyLateCancellations = filterByLocation(
      lateCancellationsData?.filter(item => {
        const dateStr = item.dateIST || '';
        return typeof dateStr === 'string' && filterByLastYearMonth(dateStr);
      }) || [],
      'location'
    );

    return {
      sales: yoySales,
      sessions: yoySessions,
      newClients: yoyNewClients,
      leads: yoyLeads,
      discounts: yoyDiscounts,
      lateCancellations: yoyLateCancellations
    };
  }, [salesData, sessionsData, newClientsData, leadsData, discountData, lateCancellationsData, filters.location]);

  if (isLoading) {
    return null; // Global loader will handle this
  }

  const selectedLocation = Array.isArray(filters.location) ? filters.location[0] : filters.location;

  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Select audio source based on location
        const audioSrc = selectedLocation === 'Kwality House' 
          ? '/kwality-house-audio.mp3' 
          : '/placeholder-audio.mp3';
        
        audioRef.current.src = audioSrc;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDownloadPDFReports = async () => {
    setIsGeneratingPDF(true);
    
    try {
        // Prepare report data
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const dateRange = `${threeMonthsAgo.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;

        // Defensive helpers
        const safeNumber = (val) => (typeof val === 'number' && !isNaN(val) ? val : 0);
        const safeArray = (arr) => Array.isArray(arr) ? arr : [];
        const safeString = (str) => typeof str === 'string' ? str : '';

        // Calculate avgResponseTime for leads
        let avgResponseTime = 0;
        if (previousMonthData.leads.length > 0) {
          const responseTimes = previousMonthData.leads
            .map(l => safeNumber(l.responseTimeHours))
            .filter(rt => rt > 0);
          avgResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
            : 0;
        }

        // Calculate avgDaysToExpiry for expirations
        let avgDaysToExpiry = 0;
        if (previousMonthData.expirations.length > 0) {
          const daysArr = previousMonthData.expirations
            .map(e => safeNumber(e.daysToExpiry))
            .filter(d => d > 0);
          avgDaysToExpiry = daysArr.length > 0
            ? daysArr.reduce((sum, d) => sum + d, 0) / daysArr.length
            : 0;
        }

        // Map to InfoSummary location id
        const locationId = getLocationId(selectedLocation);

        // Defensive construction of reportData
        const reportData = {
          location: safeString(selectedLocation) || 'All Locations',
          dateRange,
          sales: {
            totalRevenue: safeArray(previousMonthData.sales).reduce((sum, s) => sum + (safeNumber(s.paymentValue) - safeNumber(s.paymentVAT)), 0),
            transactions: safeArray(previousMonthData.sales).length,
            avgTransaction: safeArray(previousMonthData.sales).length > 0
              ? safeArray(previousMonthData.sales).reduce((sum, s) => sum + (safeNumber(s.paymentValue) - safeNumber(s.paymentVAT)), 0) / safeArray(previousMonthData.sales).length
              : 0,
            uniqueCustomers: new Set(safeArray(previousMonthData.sales).map(s => safeString(s.customerName))).size,
          },
          clients: {
            newMembers: safeArray(previousMonthData.newClients).filter(c => safeString(c.isNew).toLowerCase().includes('new')).length,
            convertedMembers: safeArray(previousMonthData.newClients).filter(c => safeString(c.conversionStatus) === 'Converted').length,
            retentionRate: safeArray(previousMonthData.newClients).length > 0
              ? (safeArray(previousMonthData.newClients).filter(c => safeString(c.retentionStatus) === 'Retained').length / safeArray(previousMonthData.newClients).length) * 100
              : 0,
            avgLTV: safeArray(previousMonthData.newClients).length > 0
              ? safeArray(previousMonthData.newClients).reduce((sum, c) => sum + safeNumber(c.ltv), 0) / safeArray(previousMonthData.newClients).length
              : 0,
          },
          sessions: {
            totalSessions: safeArray(previousMonthData.sessions).length,
            avgClassSize: safeArray(previousMonthData.sessions).length > 0
              ? safeArray(previousMonthData.sessions).reduce((sum, s) => sum + safeNumber(s.checkedInCount), 0) / safeArray(previousMonthData.sessions).length
              : 0,
            avgFillRate: safeArray(previousMonthData.sessions).reduce((sum, s) => sum + safeNumber(s.capacity), 0) > 0
              ? (safeArray(previousMonthData.sessions).reduce((sum, s) => sum + safeNumber(s.checkedInCount), 0) / safeArray(previousMonthData.sessions).reduce((sum, s) => sum + safeNumber(s.capacity), 0)) * 100
              : 0,
            totalAttendance: safeArray(previousMonthData.sessions).reduce((sum, s) => sum + safeNumber(s.checkedInCount), 0),
          },
          trainers: {
            totalTrainers: new Set(safeArray(previousMonthData.sessions).map(s => safeString(s.trainerName)).filter(t => t)).size,
            totalSessions: safeArray(previousMonthData.sessions).length,
            totalPaid: safeArray(previousMonthData.payroll).reduce((sum, p) => sum + safeNumber(p.totalPaid), 0),
            avgPerSession: safeArray(previousMonthData.sessions).length > 0
              ? safeArray(previousMonthData.payroll).reduce((sum, p) => sum + safeNumber(p.totalPaid), 0) / safeArray(previousMonthData.sessions).length
              : 0,
          },
          discounts: {
            discountedSales: safeArray(previousMonthData.discounts).length,
            totalDiscount: safeArray(previousMonthData.discounts).reduce((sum, d) => sum + safeNumber(d.discountAmount), 0),
            avgDiscountPercent: safeArray(previousMonthData.discounts).length > 0
              ? (safeArray(previousMonthData.discounts).reduce((sum, d) => sum + safeNumber(d.discountPercentage), 0) / safeArray(previousMonthData.discounts).length)
              : 0,
            revenueImpact: safeArray(previousMonthData.discounts).reduce((sum, d) => sum + (safeNumber(d.paymentValue) - safeNumber(d.paymentVAT)), 0),
          },
          leads: {
            totalLeads: safeArray(previousMonthData.leads).length,
            converted: safeArray(previousMonthData.leads).filter(l => safeString(l.status) === 'Converted').length,
            conversionRate: safeArray(previousMonthData.leads).length > 0
              ? (safeArray(previousMonthData.leads).filter(l => safeString(l.status) === 'Converted').length / safeArray(previousMonthData.leads).length) * 100
              : 0,
            avgResponseTime,
          },
          expirations: {
            total: safeArray(previousMonthData.expirations).length,
            value: safeArray(previousMonthData.expirations).reduce((sum, e) => sum + safeNumber(e.orderValue), 0),
            avgDaysToExpiry,
          },
          cancellations: {
            total: safeArray(previousMonthData.lateCancellations).length,
            rate: safeArray(previousMonthData.sessions).length > 0
              ? (safeArray(previousMonthData.lateCancellations).length / safeArray(previousMonthData.sessions).length) * 100
              : 0,
            pattern: 'Peak times: Early morning and evening classes',
          },
          summaries: {
            executive: getSummaryText('executive', locationId),
            sales: getSummaryText('sales-overview', locationId),
            clients: getSummaryText('clients-overview', locationId),
            sessions: getSummaryText('sessions-overview', locationId),
            trainers: getSummaryText('trainer-overview', locationId),
            discounts: getSummaryText('discounts-overview', locationId),
            leads: getSummaryText('leads-overview', locationId),
            expirations: getSummaryText('expiration-analytics-overview', locationId),
            cancellations: getSummaryText('late-cancellations-overview', locationId),
            recommendations: getSummaryText('recommendations', locationId),
          },
        };

        toast({
          title: "Generating PDF Report",
          description: `Creating structured HTML-based report for ${reportData.location}...`,
        });

        await generateHTMLPDFReport(reportData);

        toast({
          title: "Success!",
          description: `PDF report generated successfully for ${reportData.location}`,
          duration: 5000,
        });
    } catch (error) {
      console.error('Error generating PDF reports:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF reports. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div id="executive-dashboard" className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 p-6">
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} preload="metadata">
        <source src="/placeholder-audio.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Executive Filter Section */}
        <ExecutiveFilterSection availableLocations={availableLocations} />

        {/* Location Tabs - Easy Switching Between Locations */}
        <StudioLocationTabs 
          activeLocation={selectedLocation || 'all'}
          onLocationChange={(locationId) => {
            updateFilters({ location: locationId === 'all' ? [] : [locationId] });
          }}
          showInfoPopover={true}
          infoPopoverContext="executive-overview"
        />

        {/* Empty Text Box */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-400 text-sm">Executive Notes & Key Insights</p>
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary Metric Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({length: 8}).map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-slate-100">
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-300 rounded w-1/2"></div>
                    <div className="h-8 bg-slate-300 rounded w-3/4"></div>
                    <div className="h-20 bg-slate-300 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Sales Revenue */}
            <Card className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-500",
              "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
              "border border-slate-200 hover:border-slate-800 border-t-4 border-t-emerald-500",
              "shadow-md hover:shadow-2xl hover:shadow-slate-950/60",
              "hover:-translate-y-1 hover:scale-[1.01]"
            )}>
              <CardContent className="p-5 relative">
                <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 bg-gradient-to-br from-emerald-500 to-teal-500" />
                <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
                  <DollarSign className="w-20 h-20 text-slate-900 group-hover:text-white" />
                </div>
                
                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 text-emerald-700 group-hover:from-emerald-500/25 group-hover:to-emerald-600/20 group-hover:text-emerald-400 group-hover:shadow-emerald-500/20">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-700 transition-all duration-500 leading-tight group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2 group-hover:decoration-emerald-400">
                          {salesMetrics?.metrics?.[0]?.title || 'Sales Revenue'}
                        </h3>
                        <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-500 mt-0.5 uppercase tracking-wide font-semibold">
                          Previous Month
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg transition-all duration-500 bg-slate-50 group-hover:bg-slate-800/30 border border-slate-100 group-hover:border-slate-700/50">
                    <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 tracking-tight">
                      ₹{(derivedMetrics.totalRevenue / 100000).toFixed(1)}L
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-0.5 flex-1 rounded-full transition-all duration-500 bg-emerald-200 group-hover:bg-emerald-500/40" />
                      <div className="flex items-center gap-1">
                        {(() => {
                          const badge = getGrowthBadge(salesMetrics?.metrics?.[0]?.change, salesMetrics?.metrics?.[0]?.changeDetails?.trend);
                          const Icon = badge.icon;
                          return (
                            <>
                              <Icon className={`w-3 h-3 ${badge.color}`} />
                              <span className={`text-[10px] font-bold transition-colors duration-500 ${badge.color}`}>
                                {badge.text}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Month over Month
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {typeof salesMetrics?.metrics?.[0]?.change === 'number' ? `${salesMetrics.metrics[0].change > 0 ? '+' : ''}${salesMetrics.metrics[0].change.toFixed(1)}%` : 'N/A'}
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">vs prev</span>
                      </div>
                    </div>
                    
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Year over Year
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {typeof salesMetrics?.metrics?.[0]?.yoyChange === 'number' ? `${salesMetrics.metrics[0].yoyChange > 0 ? '+' : ''}${salesMetrics.metrics[0].yoyChange.toFixed(1)}%` : 'N/A'}
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">vs 2024</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-1.5 border-l-3 pl-3 transition-all duration-500 border-l-emerald-500/50 group-hover:border-l-emerald-400 before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:rounded-r-full before:transition-all before:duration-500 before:bg-emerald-500/20 group-hover:before:bg-emerald-400/30">
                    <p className="text-xs text-slate-600 group-hover:text-slate-300 leading-snug transition-colors duration-500 line-clamp-2 font-medium">
                      {salesMetrics?.metrics?.[0]?.description || 'Total sales revenue'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Sessions */}
            <Card className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-500",
              "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
              "border border-slate-200 hover:border-slate-800 border-t-4 border-t-blue-500",
              "shadow-md hover:shadow-2xl hover:shadow-slate-950/60",
              "hover:-translate-y-1 hover:scale-[1.01]"
            )}>
              <CardContent className="p-5 relative">
                <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 bg-gradient-to-br from-blue-500 to-cyan-500" />
                <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
                  <Calendar className="w-20 h-20 text-slate-900 group-hover:text-white" />
                </div>
                
                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md bg-gradient-to-br from-blue-500/15 to-blue-600/10 text-blue-700 group-hover:from-blue-500/25 group-hover:to-blue-600/20 group-hover:text-blue-400 group-hover:shadow-blue-500/20">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-700 transition-all duration-500 leading-tight group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2 group-hover:decoration-blue-400">
                          Total Sessions
                        </h3>
                        <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-500 mt-0.5 uppercase tracking-wide font-semibold">
                          Previous Month
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg transition-all duration-500 bg-slate-50 group-hover:bg-slate-800/30 border border-slate-100 group-hover:border-slate-700/50">
                    <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 tracking-tight">
                      {derivedMetrics.totalSessions}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-0.5 flex-1 rounded-full transition-all duration-500 bg-blue-200 group-hover:bg-blue-500/40" />
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-600 group-hover:text-blue-400" />
                        <span className="text-[10px] font-bold transition-colors duration-500 text-blue-600 group-hover:text-blue-400">
                          Classes
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Avg Capacity
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                        {derivedMetrics.totalSessions > 0 ? (derivedMetrics.totalCapacity / derivedMetrics.totalSessions).toFixed(0) : 0}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Avg Attendance
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                        {derivedMetrics.avgAttendance.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <div className="relative pt-1.5 border-l-3 pl-3 transition-all duration-500 border-l-blue-500/50 group-hover:border-l-blue-400 before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:rounded-r-full before:transition-all before:duration-500 before:bg-blue-500/20 group-hover:before:bg-blue-400/30">
                    <p className="text-xs text-slate-600 group-hover:text-slate-300 leading-snug transition-colors duration-500 line-clamp-2 font-medium">
                      Total classes conducted
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Late Cancellations */}
            <Card className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-500",
              "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
              "border border-slate-200 hover:border-slate-800 border-t-4 border-t-red-500",
              "shadow-md hover:shadow-2xl hover:shadow-slate-950/60",
              "hover:-translate-y-1 hover:scale-[1.01]"
            )}>
              <CardContent className="p-5 relative">
                <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 bg-gradient-to-br from-red-500 to-rose-500" />
                <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
                  <Clock className="w-20 h-20 text-slate-900 group-hover:text-white" />
                </div>
                
                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md bg-gradient-to-br from-red-500/15 to-red-600/10 text-red-700 group-hover:from-red-500/25 group-hover:to-red-600/20 group-hover:text-red-400 group-hover:shadow-red-500/20">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-700 transition-all duration-500 leading-tight group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2 group-hover:decoration-red-400">
                          Late Cancellations
                        </h3>
                        <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-500 mt-0.5 uppercase tracking-wide font-semibold">
                          Previous Month
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg transition-all duration-500 bg-slate-50 group-hover:bg-slate-800/30 border border-slate-100 group-hover:border-slate-700/50">
                    <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 tracking-tight">
                      {derivedMetrics.lateCancellations}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-0.5 flex-1 rounded-full transition-all duration-500 bg-red-200 group-hover:bg-red-500/40" />
                      <div className="flex items-center gap-1">
                        {(() => {
                          const badge = getGrowthBadge(derivedMetrics.lateCancellations > 0 ? -5 : 0, 'moderate'); // Assume negative is good for cancellations
                          const Icon = derivedMetrics.cancellationRate > 10 ? TrendingDown : Clock;
                          return (
                            <>
                              <Icon className="w-3 h-3 text-red-600 group-hover:text-red-400" />
                              <span className="text-[10px] font-bold transition-colors duration-500 text-red-600 group-hover:text-red-400">
                                {derivedMetrics.cancellationRate > 10 ? 'High Impact' : 'Cancelled'}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Cancel Rate
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                        {derivedMetrics.cancellationRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Impact Level
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                        {derivedMetrics.cancellationRate > 15 ? 'Critical' : derivedMetrics.cancellationRate > 10 ? 'High' : derivedMetrics.cancellationRate > 5 ? 'Moderate' : 'Low'}
                      </span>
                    </div>
                  </div>

                  <div className="relative pt-1.5 border-l-3 pl-3 transition-all duration-500 border-l-red-500/50 group-hover:border-l-red-400 before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:rounded-r-full before:transition-all before:duration-500 before:bg-red-500/20 group-hover:before:bg-red-400/30">
                    <p className="text-xs text-slate-600 group-hover:text-slate-300 leading-snug transition-colors duration-500 line-clamp-2 font-medium">
                      Sessions cancelled late
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* New Clients */}
            <Card className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-500",
              "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
              "border border-slate-200 hover:border-slate-800 border-t-4 border-t-purple-500",
              "shadow-md hover:shadow-2xl hover:shadow-slate-950/60",
              "hover:-translate-y-1 hover:scale-[1.01]"
            )}>
              <CardContent className="p-5 relative">
                <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 bg-gradient-to-br from-purple-500 to-pink-500" />
                <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
                  <UserPlus className="w-20 h-20 text-slate-900 group-hover:text-white" />
                </div>
                
                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md bg-gradient-to-br from-purple-500/15 to-purple-600/10 text-purple-700 group-hover:from-purple-500/25 group-hover:to-purple-600/20 group-hover:text-purple-400 group-hover:shadow-purple-500/20">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-700 transition-all duration-500 leading-tight group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2 group-hover:decoration-purple-400">
                          New Clients
                        </h3>
                        <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-500 mt-0.5 uppercase tracking-wide font-semibold">
                          Previous Month
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg transition-all duration-500 bg-slate-50 group-hover:bg-slate-800/30 border border-slate-100 group-hover:border-slate-700/50">
                    <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 tracking-tight">
                      {derivedMetrics.newClients}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-0.5 flex-1 rounded-full transition-all duration-500 bg-purple-200 group-hover:bg-purple-500/40" />
                      <div className="flex items-center gap-1">
                        {(() => {
                          const badge = getGrowthBadge(clientMetrics?.metrics?.[0]?.change, clientMetrics?.metrics?.[0]?.changeDetails?.trend);
                          const Icon = badge.icon;
                          return (
                            <>
                              <Icon className={`w-3 h-3 ${badge.color.replace('text-', 'text-purple-600 group-hover:text-purple-400')}`} />
                              <span className="text-[10px] font-bold transition-colors duration-500 text-purple-600 group-hover:text-purple-400">
                                New Members
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Conversion Rate
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {derivedMetrics.conversionRate.toFixed(1)}%
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">lead→client</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Retention Rate
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {derivedMetrics.retentionRate.toFixed(1)}%
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">active</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-1.5 border-l-3 pl-3 transition-all duration-500 border-l-purple-500/50 group-hover:border-l-purple-400 before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:rounded-r-full before:transition-all before:duration-500 before:bg-purple-500/20 group-hover:before:bg-purple-400/30">
                    <p className="text-xs text-slate-600 group-hover:text-slate-300 leading-snug transition-colors duration-500 line-clamp-2 font-medium">
                      {clientMetrics?.metrics?.[0]?.description || 'New member acquisitions'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Transaction Value */}
            <Card className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-500",
              "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
              "border border-slate-200 hover:border-slate-800 border-t-4 border-t-indigo-500",
              "shadow-md hover:shadow-2xl hover:shadow-slate-950/60",
              "hover:-translate-y-1 hover:scale-[1.01]"
            )}>
              <CardContent className="p-5 relative">
                <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 bg-gradient-to-br from-indigo-500 to-purple-500" />
                <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
                  <Target className="w-20 h-20 text-slate-900 group-hover:text-white" />
                </div>
                
                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md bg-gradient-to-br from-indigo-500/15 to-indigo-600/10 text-indigo-700 group-hover:from-indigo-500/25 group-hover:to-indigo-600/20 group-hover:text-indigo-400 group-hover:shadow-indigo-500/20">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-700 transition-all duration-500 leading-tight group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2 group-hover:decoration-indigo-400">
                          Avg Transaction Value
                        </h3>
                        <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-500 mt-0.5 uppercase tracking-wide font-semibold">
                          Previous Month
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg transition-all duration-500 bg-slate-50 group-hover:bg-slate-800/30 border border-slate-100 group-hover:border-slate-700/50">
                    <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 tracking-tight">
                      ₹{derivedMetrics.totalTransactions > 0 ? (derivedMetrics.totalRevenue / derivedMetrics.totalTransactions).toFixed(0) : '0'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-0.5 flex-1 rounded-full transition-all duration-500 bg-indigo-200 group-hover:bg-indigo-500/40" />
                      <div className="flex items-center gap-1">
                        {(() => {
                          const badge = getGrowthBadge(salesMetrics?.metrics?.[6]?.change, salesMetrics?.metrics?.[6]?.changeDetails?.trend);
                          const Icon = badge.icon;
                          return (
                            <>
                              <Icon className={`w-3 h-3 ${badge.color.replace('text-', 'text-indigo-600 group-hover:text-indigo-400')}`} />
                              <span className="text-[10px] font-bold transition-colors duration-500 text-indigo-600 group-hover:text-indigo-400">
                                Per Sale
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Month over Month
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {typeof salesMetrics?.metrics?.[6]?.change === 'number' ? `${salesMetrics.metrics[6].change > 0 ? '+' : ''}${salesMetrics.metrics[6].change.toFixed(1)}%` : 'N/A'}
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">vs prev</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Year over Year
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {typeof salesMetrics?.metrics?.[6]?.yoyChange === 'number' ? `${salesMetrics.metrics[6].yoyChange > 0 ? '+' : ''}${salesMetrics.metrics[6].yoyChange.toFixed(1)}%` : 'N/A'}
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">vs 2024</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-1.5 border-l-3 pl-3 transition-all duration-500 border-l-indigo-500/50 group-hover:border-l-indigo-400 before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:rounded-r-full before:transition-all before:duration-500 before:bg-indigo-500/20 group-hover:before:bg-indigo-400/30">
                    <p className="text-xs text-slate-600 group-hover:text-slate-300 leading-snug transition-colors duration-500 line-clamp-2 font-medium">
                      {salesMetrics?.metrics?.[6]?.description || 'Average value per transaction'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Visits */}
            <Card className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-500",
              "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
              "border border-slate-200 hover:border-slate-800 border-t-4 border-t-teal-500",
              "shadow-md hover:shadow-2xl hover:shadow-slate-950/60",
              "hover:-translate-y-1 hover:scale-[1.01]"
            )}>
              <CardContent className="p-5 relative">
                <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 bg-gradient-to-br from-teal-500 to-cyan-500" />
                <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
                  <Activity className="w-20 h-20 text-slate-900 group-hover:text-white" />
                </div>
                
                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md bg-gradient-to-br from-teal-500/15 to-teal-600/10 text-teal-700 group-hover:from-teal-500/25 group-hover:to-teal-600/20 group-hover:text-teal-400 group-hover:shadow-teal-500/20">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-700 transition-all duration-500 leading-tight group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2 group-hover:decoration-teal-400">
                          Total Visits
                        </h3>
                        <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-500 mt-0.5 uppercase tracking-wide font-semibold">
                          Previous Month
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg transition-all duration-500 bg-slate-50 group-hover:bg-slate-800/30 border border-slate-100 group-hover:border-slate-700/50">
                    <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 tracking-tight">
                      {derivedMetrics.totalVisits}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-0.5 flex-1 rounded-full transition-all duration-500 bg-teal-200 group-hover:bg-teal-500/40" />
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-teal-600 group-hover:text-teal-400" />
                        <span className="text-[10px] font-bold transition-colors duration-500 text-teal-600 group-hover:text-teal-400">
                          Check-ins
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Avg per Session
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                        {derivedMetrics.avgAttendance.toFixed(1)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Fill Rate
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                        {derivedMetrics.fillRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="relative pt-1.5 border-l-3 pl-3 transition-all duration-500 border-l-teal-500/50 group-hover:border-l-teal-400 before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:rounded-r-full before:transition-all before:duration-500 before:bg-teal-500/20 group-hover:before:bg-teal-400/30">
                    <p className="text-xs text-slate-600 group-hover:text-slate-300 leading-snug transition-colors duration-500 line-clamp-2 font-medium">
                      Total member check-ins
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average LTV */}
            <Card className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-500",
              "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
              "border border-slate-200 hover:border-slate-800 border-t-4 border-t-rose-500",
              "shadow-md hover:shadow-2xl hover:shadow-slate-950/60",
              "hover:-translate-y-1 hover:scale-[1.01]"
            )}>
              <CardContent className="p-5 relative">
                <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 bg-gradient-to-br from-rose-500 to-orange-500" />
                <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
                  <CreditCard className="w-20 h-20 text-slate-900 group-hover:text-white" />
                </div>
                
                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md bg-gradient-to-br from-rose-500/15 to-rose-600/10 text-rose-700 group-hover:from-rose-500/25 group-hover:to-rose-600/20 group-hover:text-rose-400 group-hover:shadow-rose-500/20">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-700 transition-all duration-500 leading-tight group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2 group-hover:decoration-rose-400">
                          Average LTV
                        </h3>
                        <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-500 mt-0.5 uppercase tracking-wide font-semibold">
                          Previous Month
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg transition-all duration-500 bg-slate-50 group-hover:bg-slate-800/30 border border-slate-100 group-hover:border-slate-700/50">
                    <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 tracking-tight">
                      ₹{(derivedMetrics.avgLTV / 1000).toFixed(1)}k
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-0.5 flex-1 rounded-full transition-all duration-500 bg-rose-200 group-hover:bg-rose-500/40" />
                      <div className="flex items-center gap-1">
                        {(() => {
                          const badge = getGrowthBadge(clientMetrics?.metrics?.[3]?.change, clientMetrics?.metrics?.[3]?.changeDetails?.trend);
                          const Icon = badge.icon;
                          return (
                            <>
                              <Icon className={`w-3 h-3 ${badge.color.replace('text-', 'text-rose-600 group-hover:text-rose-400')}`} />
                              <span className="text-[10px] font-bold transition-colors duration-500 text-rose-600 group-hover:text-rose-400">
                                Lifetime Value
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Month over Month
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {typeof clientMetrics?.metrics?.[3]?.change === 'number' ? `${clientMetrics.metrics[3].change > 0 ? '+' : ''}${clientMetrics.metrics[3].change.toFixed(1)}%` : 'N/A'}
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">vs prev</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Trend Quality
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {(clientMetrics?.metrics?.[3]?.changeDetails?.trend === 'strong' ? 'Excellent' : 
                            clientMetrics?.metrics?.[3]?.changeDetails?.trend === 'moderate' ? 'Good' : 
                            clientMetrics?.metrics?.[3]?.changeDetails?.trend === 'weak' ? 'Fair' : 'Stable')}
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">quality</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-1.5 border-l-3 pl-3 transition-all duration-500 border-l-rose-500/50 group-hover:border-l-rose-400 before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:rounded-r-full before:transition-all before:duration-500 before:bg-rose-500/20 group-hover:before:bg-rose-400/30">
                    <p className="text-xs text-slate-600 group-hover:text-slate-300 leading-snug transition-colors duration-500 line-clamp-2 font-medium">
                      {clientMetrics?.metrics?.[3]?.description || 'Average customer lifetime value'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discount Rate */}
            <Card className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-500",
              "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
              "border border-slate-200 hover:border-slate-800 border-t-4 border-t-orange-500",
              "shadow-md hover:shadow-2xl hover:shadow-slate-950/60",
              "hover:-translate-y-1 hover:scale-[1.01]"
            )}>
              <CardContent className="p-5 relative">
                <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 bg-gradient-to-br from-orange-500 to-yellow-500" />
                <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
                  <Percent className="w-20 h-20 text-slate-900 group-hover:text-white" />
                </div>
                
                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md bg-gradient-to-br from-orange-500/15 to-orange-600/10 text-orange-700 group-hover:from-orange-500/25 group-hover:to-orange-600/20 group-hover:text-orange-400 group-hover:shadow-orange-500/20">
                        <Percent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-700 transition-all duration-500 leading-tight group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2 group-hover:decoration-orange-400">
                          Discount Rate
                        </h3>
                        <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-500 mt-0.5 uppercase tracking-wide font-semibold">
                          Previous Month
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg transition-all duration-500 bg-slate-50 group-hover:bg-slate-800/30 border border-slate-100 group-hover:border-slate-700/50">
                    <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 tracking-tight">
                      {derivedMetrics.discountRate.toFixed(1)}%
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-0.5 flex-1 rounded-full transition-all duration-500 bg-orange-200 group-hover:bg-orange-500/40" />
                      <div className="flex items-center gap-1">
                        {(() => {
                          const badge = getGrowthBadge(salesMetrics?.metrics?.[8]?.change, salesMetrics?.metrics?.[8]?.changeDetails?.trend);
                          const Icon = badge.icon;
                          return (
                            <>
                              <Icon className={`w-3 h-3 ${badge.color.replace('text-', 'text-orange-600 group-hover:text-orange-400')}`} />
                              <span className="text-[10px] font-bold transition-colors duration-500 text-orange-600 group-hover:text-orange-400">
                                Applied
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Total Discounts
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          ₹{(derivedMetrics.totalDiscounts / 1000).toFixed(0)}k
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">total</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg border transition-all duration-500 bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50">
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Impact Level
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {derivedMetrics.discountRate > 20 ? 'High' : derivedMetrics.discountRate > 10 ? 'Moderate' : 'Low'}
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">impact</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-1.5 border-l-3 pl-3 transition-all duration-500 border-l-orange-500/50 group-hover:border-l-orange-400 before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:rounded-r-full before:transition-all before:duration-500 before:bg-orange-500/20 group-hover:before:bg-orange-400/30">
                    <p className="text-xs text-slate-600 group-hover:text-slate-300 leading-snug transition-colors duration-500 line-clamp-2 font-medium">
                      {salesMetrics?.metrics?.[8]?.description || 'Average discount percentage'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sales Table (Exportable) */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Product & Category Metrics</h2>
          </div>

          <ProductCategoryMetricsTable
            data={previousMonthData.sales || []}
            filters={filters}
          />
        </div>

        {/* Independent Month-On-Month Overview */}
        <div className="mt-12 mb-12">
          <div className="border-t-2 border-slate-200 pt-8 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Month-On-Month History</h2>
            <p className="text-sm text-slate-600">All metrics across all time periods, independent of current filters</p>
          </div>
          <ComprehensiveMonthOnMonthTable />
        </div>

        {/* New Executive Sections - Complete Performance Overview */}
        <div className="mt-12">
          <div className="border-t-2 border-slate-200 pt-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Performance Overview</h2>
            <p className="text-sm text-slate-600">All key metrics filtered by your selected date range and location</p>
          </div>

          <div className="space-y-5">
            {/* Sales Section */}
            <ExecutiveSalesSection onMetricClick={() => {}} />

            {/* Sessions Section */}
            <ExecutiveSessionsSection onMetricClick={() => {}} />

            {/* Clients Section */}
            <ExecutiveClientsSection onMetricClick={() => {}} />

            {/* Trainers Section */}
            <ExecutiveTrainersSection onMetricClick={() => {}} />

            {/* Leads Section */}
            <ExecutiveLeadsSection onMetricClick={() => {}} />

            {/* Discounts Section */}
            <ExecutiveDiscountsSection onMetricClick={() => {}} />

            {/* Cancellations Section */}
            <ExecutiveCancellationsSection onMetricClick={() => {}} />

            {/* Expirations Section */}
            <ExecutiveExpirationsSection onMetricClick={() => {}} />
          </div>
        </div>
        
        {/* (Duplicate sales table removed) */}

        {/* Source Data Modal */}
        <SourceDataModal 
          open={showSourceData} 
          onOpenChange={setShowSourceData} 
          sources={[
            {
              name: "Sales Data (Previous Month)",
              data: previousMonthData.sales || []
            },
            {
              name: "Sessions Data (Previous Month)", 
              data: previousMonthData.sessions || []
            },
            {
              name: "New Clients Data (Previous Month)",
              data: previousMonthData.newClients || []
            },
            {
              name: "Leads Data (Previous Month)",
              data: previousMonthData.leads || []
            },
            {
              name: "Payroll Data (Previous Month)",
              data: previousMonthData.payroll || []
            },
            {
              name: "Discounts Data (Previous Month)",
              data: previousMonthData.discounts || []
            }
          ]}
        />
        
      </div>

      {/* Dashboard Chatbot */}
      <DashboardChatbot />
    </div>
  );
});

ComprehensiveExecutiveDashboard.displayName = 'ComprehensiveExecutiveDashboard';

export default ComprehensiveExecutiveDashboard;
