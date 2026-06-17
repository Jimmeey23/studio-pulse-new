import React, { useState, useMemo, useEffect, useDeferredValue, useTransition, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Users, Calendar, BarChart3, Info, Grid3x3, LayoutGrid, UserCheck, AlertCircle, Activity, DollarSign, Package, Target, Percent, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { useSalesData } from '@/hooks/useSalesData';
import { formatNumber, formatCurrency, formatPercentage, formatRevenue } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { InfoPopover } from '@/components/ui/InfoSidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SalesMotionHero from '@/components/ui/SalesMotionHero';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useRegisterTableForCopy } from '@/hooks/useRegisterTableForCopy';
import { useTableCopyContext } from '@/hooks/useTableCopyContext';
import { MemberBehaviorPatterns } from '@/components/dashboard/MemberBehaviorPatterns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/ui/footer';
import { GlobalFiltersProvider } from '@/contexts/GlobalFiltersContext';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { getActiveConsolidatedExportPreset, getConsolidatedStudioOption, getPresetMonthLabels } from '@/utils/consolidatedExportPreset';

type GroupByOption = 'product' | 'category' | 'teacher' | 'location' | 'memberStatus';

type MetricType = 
  | 'visits' 
  | 'bookings' 
  | 'checkins' 
  | 'sessions' 
  | 'emptySessions'
  | 'uniqueMembers' 
  | 'newMembers' 
  | 'returningMembers'
  | 'revenue' 
  | 'unitsSold' 
  | 'classAvg' 
  | 'fillRate' 
  | 'capacity'
  | 'lateCancellations'
  | 'complementary'
  | 'avgRevenuePerMember'
  | 'avgRevenuePerSession'
  | 'earnedRevenue';

interface MetricConfig {
  id: MetricType;
  label: string;
  description: string;
  icon: any;
  color: string;
  format: 'number' | 'currency' | 'percentage' | 'decimal';
}

export const PatternsAndTrends = () => {
  const { data: checkinsData, loading: checkinsLoading, error: checkinsError } = useCheckinsData();
  const { data: salesData, loading: salesLoading, error: salesError } = useSalesData();
  const { setLoading } = useGlobalLoading();
  const navigate = useNavigate();
  const exportPreset = useMemo(() => (typeof window !== 'undefined' ? getActiveConsolidatedExportPreset(window.location.search) : null), []);
  const exportStudio = exportPreset ? getConsolidatedStudioOption(exportPreset.studioId) : null;
  const [selectedLocation, setSelectedLocation] = useState(exportPreset?.studioId === 'all' ? 'All Locations' : (exportStudio?.patternsLocationLabel || 'Kwality House, Kemps Corner'));
  const [heroColor, setHeroColor] = useState<string>('#3b82f6');
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupByOption>('product');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('visits');
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  
  // Combine loading states
  const loading = checkinsLoading || salesLoading;
  const error = checkinsError || salesError;
  
  // Define all available metrics
  const METRICS: MetricConfig[] = [
    { id: 'visits', label: 'Total Visits', description: 'Total check-ins across all sessions', icon: Activity, color: 'text-indigo-600', format: 'number' },
    { id: 'bookings', label: 'Total Bookings', description: 'All bookings (checked-in or not)', icon: Calendar, color: 'text-blue-600', format: 'number' },
    { id: 'checkins', label: 'Check-ins', description: 'Successfully checked-in sessions', icon: CheckCircle, color: 'text-green-600', format: 'number' },
    { id: 'sessions', label: 'Sessions Held', description: 'Unique sessions that occurred', icon: BarChart3, color: 'text-purple-600', format: 'number' },
    { id: 'emptySessions', label: 'Empty Sessions', description: 'Sessions with zero check-ins', icon: XCircle, color: 'text-red-600', format: 'number' },
    { id: 'uniqueMembers', label: 'Unique Members', description: 'Distinct members who checked in', icon: Users, color: 'text-cyan-600', format: 'number' },
    { id: 'newMembers', label: 'New Members', description: 'Members with "New" in Is New column', icon: UserPlus, color: 'text-emerald-600', format: 'number' },
    { id: 'returningMembers', label: 'Returning Members', description: 'Members without "New" status', icon: UserCheck, color: 'text-teal-600', format: 'number' },
    { id: 'revenue', label: 'Total Revenue (Sales)', description: 'Sum of all payments from Sales sheet', icon: DollarSign, color: 'text-green-700', format: 'currency' },
    { id: 'earnedRevenue', label: 'Earned Revenue', description: 'Revenue from checked-in sessions', icon: DollarSign, color: 'text-emerald-700', format: 'currency' },
    { id: 'unitsSold', label: 'Units Sold', description: 'Total items from Sales sheet', icon: Package, color: 'text-orange-600', format: 'number' },
    { id: 'classAvg', label: 'Class Average', description: 'Average attendees per session', icon: Target, color: 'text-pink-600', format: 'decimal' },
    { id: 'fillRate', label: 'Fill Rate %', description: 'Capacity utilization percentage', icon: Percent, color: 'text-violet-600', format: 'percentage' },
    { id: 'capacity', label: 'Total Capacity', description: 'Maximum available spots', icon: Grid3x3, color: 'text-slate-600', format: 'number' },
    { id: 'lateCancellations', label: 'Late Cancellations', description: 'Cancelled after deadline', icon: AlertCircle, color: 'text-amber-600', format: 'number' },
    { id: 'complementary', label: 'Complementary', description: 'Sessions where Paid = 0', icon: Info, color: 'text-lime-600', format: 'number' },
    { id: 'avgRevenuePerMember', label: 'Avg Revenue/Member', description: 'Revenue per unique member', icon: DollarSign, color: 'text-fuchsia-600', format: 'currency' },
    { id: 'avgRevenuePerSession', label: 'Avg Revenue/Session', description: 'Revenue per session', icon: DollarSign, color: 'text-rose-600', format: 'currency' },
  ];
  
  // Filter states
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedMemberStatus, setSelectedMemberStatus] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => exportPreset ? getPresetMonthLabels(exportPreset, 'space') : []);
  
  // Frequency table states
  const [frequencyBreakdownBy, setFrequencyBreakdownBy] = useState<'product' | 'category' | 'teacher' | 'class'>('class');
  const [frequencyQuickFilterMonth, setFrequencyQuickFilterMonth] = useState<string>('All');
  const [cancellationBreakdownBy, setCancellationBreakdownBy] = useState<'product' | 'category' | 'teacher' | 'class'>('class');
  const [cancellationQuickFilterMonth, setCancellationQuickFilterMonth] = useState<string>('All');

  // Refs for copy table functionality
  const monthOnMonthTableRef = useRef<HTMLDivElement>(null);
  const frequencyTableRef = useRef<HTMLDivElement>(null);
  const cancellationTableRef = useRef<HTMLDivElement>(null);
  
  // Register tables for copy functionality - but we need custom logic for all metrics
  const { getAllTabsText: getMonthOnMonthText } = useRegisterTableForCopy(
    monthOnMonthTableRef as any, 
    `${METRICS.find(m => m.id === selectedMetric)?.label} by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} - Month on Month`,
    true // disabled - we'll handle this manually
  );
  const { getAllTabsText: getFrequencyText } = useRegisterTableForCopy(
    frequencyTableRef as any,
    'Attendance Frequency Breakdown'
  );
  const { getAllTabsText: getCancellationText } = useRegisterTableForCopy(
    cancellationTableRef as any,
    'Late Cancellations Breakdown'
  );

  // Sync loading state with global loader
  useEffect(() => {
    setLoading(loading, 'Loading patterns and trends data...');
  }, [loading, setLoading]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const products = new Set<string>();
    const categories = new Set<string>();
    const teachers = new Set<string>();
    const memberStatuses = new Set<string>();
    const months = new Set<string>();

    checkinsData.forEach(item => {
      if (item.cleanedProduct) products.add(item.cleanedProduct);
      if (item.cleanedCategory) categories.add(item.cleanedCategory);
      if (item.teacherName) teachers.add(item.teacherName);
      if (item.isNew) memberStatuses.add(item.isNew);
      if (item.month) months.add(item.month);
    });

    return {
      products: Array.from(products).sort(),
      categories: Array.from(categories).sort(),
      teachers: Array.from(teachers).sort(),
      memberStatuses: Array.from(memberStatuses).sort(),
      months: Array.from(months).sort()
    };
  }, [checkinsData]);

  // Filter data by location and additional filters (ALL FILTERS APPLIED)
  const filteredData = useMemo(() => {
    let data = checkinsData;
    
    // Location filter
    if (selectedLocation !== 'All Locations') {
      data = data.filter(item => {
        const location = item.location || '';
        if (selectedLocation === 'Kenkere House') {
          return location.toLowerCase().includes('kenkere') || location === 'Kenkere House';
        }
        return location === selectedLocation;
      });
    }

    // Product filter
    if (selectedProducts.length > 0) {
      data = data.filter(item => selectedProducts.includes(item.cleanedProduct || ''));
    }

    // Category filter
    if (selectedCategories.length > 0) {
      data = data.filter(item => selectedCategories.includes(item.cleanedCategory || ''));
    }

    // Teacher filter
    if (selectedTeachers.length > 0) {
      data = data.filter(item => selectedTeachers.includes(item.teacherName || ''));
    }

    // Member status filter
    if (selectedMemberStatus.length > 0) {
      data = data.filter(item => selectedMemberStatus.includes(item.isNew || ''));
    }

    // Month filter - NOW APPLIED
    if (selectedMonths.length > 0) {
      data = data.filter(item => selectedMonths.includes(item.month || ''));
    }

    return data;
  }, [checkinsData, selectedLocation, selectedProducts, selectedCategories, selectedTeachers, selectedMemberStatus, selectedMonths]);

  // Location-only filtered data for hero metrics
  const filteredLocationData = useMemo(() => {
    if (selectedLocation === 'All Locations') {
      return checkinsData;
    }
    
    return checkinsData.filter(item => {
      const location = item.location || '';
      if (selectedLocation === 'Kenkere House') {
        return location.toLowerCase().includes('kenkere') || location === 'Kenkere House';
      }
      return location === selectedLocation;
    });
  }, [checkinsData, selectedLocation]);

  // Location + categorical filters for month-on-month analysis, intentionally ignoring month filters.
  const filteredDataNoMonth = useMemo(() => {
    let data = checkinsData;

    if (selectedLocation !== 'All Locations') {
      data = data.filter(item => {
        const location = item.location || '';
        if (selectedLocation === 'Kenkere House') {
          return location.toLowerCase().includes('kenkere') || location === 'Kenkere House';
        }
        return location === selectedLocation;
      });
    }

    if (selectedProducts.length > 0) {
      data = data.filter(item => selectedProducts.includes(item.cleanedProduct || ''));
    }

    if (selectedCategories.length > 0) {
      data = data.filter(item => selectedCategories.includes(item.cleanedCategory || ''));
    }

    if (selectedTeachers.length > 0) {
      data = data.filter(item => selectedTeachers.includes(item.teacherName || ''));
    }

    if (selectedMemberStatus.length > 0) {
      data = data.filter(item => selectedMemberStatus.includes(item.isNew || ''));
    }

    return data;
  }, [checkinsData, selectedLocation, selectedProducts, selectedCategories, selectedTeachers, selectedMemberStatus]);

  // Defer heavy computations so UI stays responsive while filters change
  const deferredFilteredData = useDeferredValue(filteredData);
  const deferredFilteredDataNoMonth = useDeferredValue(filteredDataNoMonth);
  const deferredSalesData = useDeferredValue(salesData);
  const [isPending, startTransition] = useTransition();

  // Process data: month-on-month breakdown by product/category/teacher with ALL METRICS
  const monthlyProductData = useMemo(() => {
    const fd = deferredFilteredDataNoMonth;
    const sd = deferredSalesData;
    
    // Early return check
    if (!fd || fd.length === 0) {
      // Check if we have raw data but filtering is too restrictive
      if (checkinsData.length > 0) {
        return { 
          products: [{
            product: 'No Data After Filtering',
            monthlyBreakdown: [],
            totalVisits: 0,
            totalBookings: 0,
            totalUniqueMembers: 0,
            totalSessions: 0,
            totalRevenue: 0,
            totalCapacity: 0,
            avgFillRate: 0,
            avgClassAvg: 0
          }], 
          months: [], 
          totalsRow: { 
            product: 'TOTAL', 
            monthlyBreakdown: [], 
            totalVisits: 0, 
            totalUniqueMembers: 0 
          } 
        };
      }
      // No data at all - provide sample data for testing
      return { 
        products: [{
          product: 'Sample Product',
          monthlyBreakdown: [{
            month: 'December 2024',
            visits: 150,
            bookings: 180,
            checkins: 150,
            sessions: 25,
            emptySessions: 2,
            uniqueMembers: 85,
            newMembers: 15,
            returningMembers: 70,
            revenue: 12500,
            earnedRevenue: 11800,
            unitsSold: 45,
            classAvg: 6.0,
            fillRate: 75.5,
            capacity: 200,
            lateCancellations: 8,
            complementary: 5,
            avgRevenuePerMember: 147.06,
            avgRevenuePerSession: 500.00
          }],
          totalVisits: 150,
          totalBookings: 180,
          totalUniqueMembers: 85,
          totalSessions: 25,
          totalRevenue: 12500,
          totalCapacity: 200,
          avgFillRate: 75.5,
          avgClassAvg: 6.0
        }], 
        months: ['December 2024'], 
        totalsRow: { 
          product: 'TOTAL', 
          monthlyBreakdown: [{
            month: 'December 2024',
            visits: 150,
            bookings: 180,
            checkins: 150,
            sessions: 25,
            emptySessions: 2,
            uniqueMembers: 85,
            newMembers: 15,
            returningMembers: 70,
            revenue: 12500,
            earnedRevenue: 11800,
            unitsSold: 45,
            classAvg: 6.0,
            fillRate: 75.5,
            capacity: 200,
            lateCancellations: 8,
            complementary: 5,
            avgRevenuePerMember: 147.06,
            avgRevenuePerSession: 500.00
          }], 
          totalVisits: 150, 
          totalUniqueMembers: 85 
        } 
      };
    }
    const grouped: Record<string, Record<string, {
      visits: number;
      bookings: number;
      checkins: number;
      sessions: Set<string>;
      uniqueMembers: Set<string>;
      newMembers: Set<string>;
      returningMembers: Set<string>;
      earnedRevenue: number;
      capacity: number;
      actualCheckins: number;
      lateCancellations: number;
      complementary: number;
      allSessionIds: Set<string>;
    }>> = {};
    const monthsSet = new Set<string>();

  // Process check-ins data
  fd.forEach(item => {
      // Determine grouping key based on selected option
      let groupKey = '';
      if (groupBy === 'product') {
        groupKey = item.cleanedProduct || 'Unknown';
      } else if (groupBy === 'category') {
        groupKey = item.cleanedCategory || 'Unknown';
      } else if (groupBy === 'teacher') {
        groupKey = item.teacherName || 'Unknown';
      } else if (groupBy === 'location') {
        groupKey = item.location || 'Unknown';
      } else if (groupBy === 'memberStatus') {
        groupKey = item.isNew || 'Unknown';
      }
      
      const monthYear = `${item.month} ${item.year}`;
      
      if (!grouped[groupKey]) grouped[groupKey] = {};
      if (!grouped[groupKey][monthYear]) {
        grouped[groupKey][monthYear] = {
          visits: 0,
          bookings: 0,
          checkins: 0,
          sessions: new Set(),
          uniqueMembers: new Set(),
          newMembers: new Set(),
          returningMembers: new Set(),
          earnedRevenue: 0,
          capacity: 0,
          actualCheckins: 0,
          lateCancellations: 0,
          complementary: 0,
          allSessionIds: new Set()
        };
      }
      
      const monthData = grouped[groupKey][monthYear];
      
      // Count all metrics
      monthData.bookings += 1; // Every row is a booking
      
      if (item.checkedIn) {
        monthData.visits += 1;
        monthData.checkins += 1;
        monthData.actualCheckins += 1;
        monthData.uniqueMembers.add(item.memberId);
        
        // Check if "New" appears in isNew column
        if (item.isNew && item.isNew.toLowerCase().includes('new')) {
          monthData.newMembers.add(item.memberId);
        } else {
          monthData.returningMembers.add(item.memberId);
        }
        
        // Earned revenue from checked-in sessions
        monthData.earnedRevenue += item.paid || 0;
      }
      
      if (item.sessionId) {
        monthData.allSessionIds.add(item.sessionId);
        monthData.sessions.add(item.sessionId);
      }
      
      if (item.isLateCancelled) {
        monthData.lateCancellations += 1;
      }
      
      // Complementary when paid = 0
      if (item.paid === 0) {
        monthData.complementary += 1;
      }
      
      // Capacity - sum of all capacity values
      monthData.capacity += item.capacity || 0;
      
      monthsSet.add(monthYear);
    });

  // Calculate revenue and units from sales data
  const salesByMonth: Record<string, Record<string, { revenue: number; saleItemIds: Set<string> }>> = {};
  sd.forEach(sale => {
      // Extract month and year from paymentDate
      const date = new Date(sale.paymentDate);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const saleMonth = monthNames[date.getMonth()];
      const saleYear = date.getFullYear();
      const monthYear = `${saleMonth} ${saleYear}`;
      
      let groupKey = '';
      if (groupBy === 'product') {
        groupKey = sale.cleanedProduct || 'Unknown';
      } else if (groupBy === 'category') {
        groupKey = sale.cleanedCategory || 'Unknown';
      } else if (groupBy === 'location') {
        groupKey = sale.calculatedLocation || 'Unknown';
      } else {
        // For teacher and memberStatus, use 'All' as we don't have this in sales
        groupKey = 'All';
      }
      
      if (!salesByMonth[groupKey]) salesByMonth[groupKey] = {};
      if (!salesByMonth[groupKey][monthYear]) {
        salesByMonth[groupKey][monthYear] = { revenue: 0, saleItemIds: new Set() };
      }
      
      salesByMonth[groupKey][monthYear].revenue += sale.paymentValue || 0;
      // Track unique sale item IDs
      if (sale.saleItemId) {
        salesByMonth[groupKey][monthYear].saleItemIds.add(sale.saleItemId);
      }
    });

    // Sort months chronologically (ascending order)
    const months = Array.from(monthsSet).sort((a, b) => {
      const parseMonth = (str: string) => {
        const [month, year] = str.split(' ');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return new Date(parseInt(year), monthNames.indexOf(month), 1);
      };
      return parseMonth(a).getTime() - parseMonth(b).getTime();
    });

    // Convert to array and calculate totals
    const products = Object.entries(grouped).map(([product, monthData]) => {
      const monthlyBreakdown = months.map(month => {
        const data = monthData[month];
  const salesForMonth = salesByMonth[product]?.[month] || { revenue: 0, saleItemIds: new Set() };
        
        if (!data) {
          return {
            month,
            visits: 0,
            bookings: 0,
            checkins: 0,
            sessions: 0,
            emptySessions: 0,
            uniqueMembers: 0,
            newMembers: 0,
            returningMembers: 0,
            revenue: salesForMonth.revenue,
            earnedRevenue: 0,
            unitsSold: salesForMonth.saleItemIds.size,
            classAvg: 0,
            fillRate: 0,
            capacity: 0,
            lateCancellations: 0,
            complementary: 0,
            avgRevenuePerMember: 0,
            avgRevenuePerSession: 0
          };
        }
        
        const sessionsCount = data.sessions.size;
        const classAvg = sessionsCount > 0 ? data.actualCheckins / sessionsCount : 0;
        const fillRate = data.capacity > 0 ? (data.actualCheckins / data.capacity) * 100 : 0;
        
        // Empty sessions = sessions with no check-ins
        const sessionsWithCheckins = new Set<string>();
        fd.forEach(item => {
          if (item.checkedIn && item.sessionId && `${item.month} ${item.year}` === month) {
            sessionsWithCheckins.add(item.sessionId);
          }
        });
        const emptySessions = Math.max(0, sessionsCount - sessionsWithCheckins.size);
        
        const avgRevenuePerMember = data.uniqueMembers.size > 0 ? salesForMonth.revenue / data.uniqueMembers.size : 0;
        const avgRevenuePerSession = sessionsCount > 0 ? salesForMonth.revenue / sessionsCount : 0;
        
        return {
          month,
          visits: data.visits,
          bookings: data.bookings,
          checkins: data.checkins,
          sessions: sessionsCount,
          emptySessions,
          uniqueMembers: data.uniqueMembers.size,
          newMembers: data.newMembers.size,
          returningMembers: data.returningMembers.size,
          revenue: salesForMonth.revenue,
          earnedRevenue: data.earnedRevenue,
          unitsSold: salesForMonth.saleItemIds.size,
          classAvg,
          fillRate,
          capacity: data.capacity,
          lateCancellations: data.lateCancellations,
          complementary: data.complementary,
          avgRevenuePerMember,
          avgRevenuePerSession
        };
      });

      // Calculate totals
      const totalVisits = monthlyBreakdown.reduce((sum, m) => sum + m.visits, 0);
      const totalBookings = monthlyBreakdown.reduce((sum, m) => sum + m.bookings, 0);
      const totalSessions = monthlyBreakdown.reduce((sum, m) => sum + m.sessions, 0);
      const totalRevenue = monthlyBreakdown.reduce((sum, m) => sum + m.revenue, 0);
      const totalCapacity = monthlyBreakdown.reduce((sum, m) => sum + m.capacity, 0);
      const totalCheckins = monthlyBreakdown.reduce((sum, m) => sum + m.checkins, 0);
      
      const allUniqueMembers = new Set<string>();
      Object.values(monthData).forEach(d => {
        d.uniqueMembers.forEach(id => allUniqueMembers.add(id));
      });

      return {
        product,
        monthlyBreakdown,
        totalVisits,
        totalBookings,
        totalUniqueMembers: allUniqueMembers.size,
        totalSessions,
        totalRevenue,
        totalCapacity,
        avgFillRate: totalCapacity > 0 ? (totalCheckins / totalCapacity) * 100 : 0,
        avgClassAvg: totalSessions > 0 ? totalCheckins / totalSessions : 0
      };
    }).sort((a, b) => b.totalVisits - a.totalVisits);

    // Calculate totals row
  const totalsRow = {
      product: 'TOTAL',
      monthlyBreakdown: months.map(month => {
        const allData = {
          visits: 0,
          bookings: 0,
          checkins: 0,
          sessions: new Set<string>(),
          capacity: 0,
          uniqueMembers: new Set<string>(),
          newMembers: new Set<string>(),
          returningMembers: new Set<string>(),
          earnedRevenue: 0,
          lateCancellations: 0,
          complementary: 0,
          actualCheckins: 0
        };
        
  fd.forEach(item => {
          if (`${item.month} ${item.year}` === month) {
            allData.bookings += 1;
            
            if (item.checkedIn) {
              allData.visits += 1;
              allData.checkins += 1;
              allData.actualCheckins += 1;
              allData.uniqueMembers.add(item.memberId);
              
              if (item.isNew && item.isNew.toLowerCase().includes('new')) {
                allData.newMembers.add(item.memberId);
              } else {
                allData.returningMembers.add(item.memberId);
              }
              
              allData.earnedRevenue += item.paid || 0;
            }
            
            if (item.sessionId) {
              allData.sessions.add(item.sessionId);
            }
            
            if (item.isLateCancelled) {
              allData.lateCancellations += 1;
            }
            
            if (item.paid === 0) {
              allData.complementary += 1;
            }
            
            allData.capacity += item.capacity || 0;
          }
        });
        
  // Calculate sales totals for this month
  let monthRevenue = 0;
  const monthSaleItemIds = new Set<string>();
  sd.forEach(sale => {
          const date = new Date(sale.paymentDate);
          if (isNaN(date.getTime())) return;
          
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const saleMonth = monthNames[date.getMonth()];
          const saleYear = date.getFullYear();
          
          if (`${saleMonth} ${saleYear}` === month) {
            monthRevenue += sale.paymentValue || 0;
            // Track unique sale item IDs
            if (sale.saleItemId) {
              monthSaleItemIds.add(sale.saleItemId);
            }
          }
        });
        
        const sessionsCount = allData.sessions.size;
        const classAvg = sessionsCount > 0 ? allData.actualCheckins / sessionsCount : 0;
        const fillRate = allData.capacity > 0 ? (allData.actualCheckins / allData.capacity) * 100 : 0;
        
        // Empty sessions for totals
        const sessionsWithCheckins = new Set<string>();
        fd.forEach(item => {
          if (item.checkedIn && item.sessionId && `${item.month} ${item.year}` === month) {
            sessionsWithCheckins.add(item.sessionId);
          }
        });
        const emptySessions = Math.max(0, sessionsCount - sessionsWithCheckins.size);
        
        const avgRevenuePerMember = allData.uniqueMembers.size > 0 ? monthRevenue / allData.uniqueMembers.size : 0;
        const avgRevenuePerSession = sessionsCount > 0 ? monthRevenue / sessionsCount : 0;
        
        return {
          month,
          visits: allData.visits,
          bookings: allData.bookings,
          checkins: allData.checkins,
          sessions: sessionsCount,
          emptySessions,
          uniqueMembers: allData.uniqueMembers.size,
          newMembers: allData.newMembers.size,
          returningMembers: allData.returningMembers.size,
          revenue: monthRevenue,
          earnedRevenue: allData.earnedRevenue,
          unitsSold: monthSaleItemIds.size,
          classAvg,
          fillRate,
          capacity: allData.capacity,
          lateCancellations: allData.lateCancellations,
          complementary: allData.complementary,
          avgRevenuePerMember,
          avgRevenuePerSession
        };
      }),
      totalVisits: products.reduce((sum, p) => sum + p.totalVisits, 0),
      totalUniqueMembers: new Set(fd.filter(d => d.checkedIn).map(d => d.memberId)).size
    };

    return { products, months, totalsRow };
  }, [deferredFilteredDataNoMonth, groupBy, deferredSalesData]);

  // Get enhanced copy context with filters and metrics (after monthlyProductData is available)
  const { contextInfo } = useTableCopyContext({
    selectedMetric: METRICS.find(m => m.id === selectedMetric)?.label,
    additionalInfo: {
      groupBy: `${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`,
      totalProducts: monthlyProductData?.products?.length || 0,
      totalMonths: monthlyProductData?.months?.length || 0
    }
  });

  // Custom function to get ALL metric tables data - placed after monthlyProductData
  const getAllMetricTablesText = React.useCallback(async () => {
    let allText = '';
    
    // For each metric, generate the table data
    METRICS.forEach((metric) => {
      allText += `\n\n${'='.repeat(80)}\n`;
      allText += `${metric.label} by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} - Month on Month\n`;
      allText += `${'='.repeat(80)}\n\n`;
      
      // Headers
      const headers = [groupBy.charAt(0).toUpperCase() + groupBy.slice(1), ...monthlyProductData.months, 'Total', 'Average'];
      allText += headers.join('\t') + '\n';
      allText += headers.map(() => '---').join('\t') + '\n';
      
      // Data rows
      monthlyProductData.products.forEach(productItem => {
        const row = [productItem.product];
        let totalValue = 0;
        let monthCount = 0;
        
        monthlyProductData.months.forEach(month => {
          const monthData = productItem.monthlyBreakdown.find(m => m.month === month);
          let value = 0;
          
          if (monthData) {
            switch (metric.id) {
              case 'visits': value = monthData.visits; break;
              case 'bookings': value = monthData.bookings; break;
              case 'checkins': value = monthData.checkins; break;
              case 'sessions': value = monthData.sessions; break;
              case 'emptySessions': value = monthData.emptySessions; break;
              case 'uniqueMembers': value = monthData.uniqueMembers; break;
              case 'newMembers': value = monthData.newMembers; break;
              case 'returningMembers': value = monthData.returningMembers; break;
              case 'revenue': value = monthData.revenue; break;
              case 'earnedRevenue': value = monthData.earnedRevenue; break;
              case 'unitsSold': value = monthData.unitsSold; break;
              case 'classAvg': value = monthData.classAvg; break;
              case 'fillRate': value = monthData.fillRate; break;
              case 'capacity': value = monthData.capacity; break;
              case 'lateCancellations': value = monthData.lateCancellations; break;
              case 'complementary': value = monthData.complementary; break;
              case 'avgRevenuePerMember': value = monthData.avgRevenuePerMember; break;
              case 'avgRevenuePerSession': value = monthData.avgRevenuePerSession; break;
            }
            totalValue += value;
            monthCount++;
          }
          
          // Format value based on metric type
          let formattedValue = '-';
          if (value > 0) {
            switch (metric.format) {
              case 'currency': formattedValue = formatRevenue(value); break;
              case 'percentage': formattedValue = `${value.toFixed(1)}%`; break;
              case 'decimal': formattedValue = value.toFixed(2); break;
              default: formattedValue = formatNumber(value); break;
            }
          }
          row.push(formattedValue);
        });
        
        // Add total and average
        const formattedTotal = metric.format === 'currency' ? formatRevenue(totalValue) :
                              metric.format === 'percentage' ? `${totalValue.toFixed(1)}%` :
                              metric.format === 'decimal' ? totalValue.toFixed(2) :
                              formatNumber(totalValue);
        const avgValue = monthCount > 0 ? totalValue / monthCount : 0;
        const formattedAvg = metric.format === 'currency' ? formatRevenue(avgValue) :
                            metric.format === 'percentage' ? `${avgValue.toFixed(1)}%` :
                            metric.format === 'decimal' ? avgValue.toFixed(2) :
                            formatNumber(avgValue);
        
        row.push(formattedTotal, formattedAvg);
        allText += row.join('\t') + '\n';
      });
    });
    
    return allText;
  }, [monthlyProductData, groupBy, METRICS]);

  const toggleProductExpansion = (product: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(product)) {
      newExpanded.delete(product);
    } else {
      newExpanded.add(product);
    }
    setExpandedRows(newExpanded);
  };

  const handleCellDrillDown = (product: string, month: string, metric: MetricType, value: any) => {
    // Filter raw data for the specific product/month combination
    const filteredRawData = deferredFilteredData.filter(item => {
      const itemMonth = `${item.month} ${item.year}`;
      let itemGroupKey = '';
      if (groupBy === 'product') {
        itemGroupKey = item.cleanedProduct || 'Unknown';
      } else if (groupBy === 'category') {
        itemGroupKey = item.cleanedCategory || 'Unknown';
      } else if (groupBy === 'teacher') {
        itemGroupKey = item.teacherName || 'Unknown';
      } else if (groupBy === 'location') {
        itemGroupKey = item.location || 'Unknown';
      } else if (groupBy === 'memberStatus') {
        itemGroupKey = item.isNew || 'Unknown';
      }
      return itemGroupKey === product && itemMonth === month;
    });

    setDrillDownData({
      product,
      month,
      metric,
      value,
      rawData: filteredRawData,
      groupBy,
      metricConfig: METRICS.find(m => m.id === metric)
    });
    setIsDrillDownOpen(true);
  };

  // Calculate visit frequency buckets (monthly check-ins per member) - TABULAR FORMAT WITH MONTH FILTER
  const visitFrequencyData = useMemo(() => {
    // Group by selected dimension (product, category, teacher, or class) and month
    const breakdownData: Record<string, Record<string, Record<string, number>>> = {};
    
  deferredFilteredData.forEach(item => {
      if (!item.checkedIn) return;
      
      let breakdownKey = '';
      if (frequencyBreakdownBy === 'product') {
        breakdownKey = item.cleanedProduct || 'Unknown';
      } else if (frequencyBreakdownBy === 'category') {
        breakdownKey = item.cleanedCategory || 'Unknown';
      } else if (frequencyBreakdownBy === 'teacher') {
        breakdownKey = item.teacherName || 'Unknown';
      } else if (frequencyBreakdownBy === 'class') {
        breakdownKey = item.cleanedClass || 'Unknown';
      }
      
      const monthYear = `${item.month}-${item.year}`;
      const memberKey = `${item.memberId}_${monthYear}`;
      
      if (!breakdownData[breakdownKey]) {
        breakdownData[breakdownKey] = {};
      }
      if (!breakdownData[breakdownKey][monthYear]) {
        breakdownData[breakdownKey][monthYear] = {};
      }
      breakdownData[breakdownKey][monthYear][memberKey] = (breakdownData[breakdownKey][monthYear][memberKey] || 0) + 1;
    });

    // Calculate buckets for each breakdown item by month
    const result: Record<string, Record<string, Record<string, number>>> = {};
    
    Object.entries(breakdownData).forEach(([key, monthData]) => {
      result[key] = {};
      
      Object.entries(monthData).forEach(([month, memberData]) => {
        const buckets = {
          '1 class': 0,
          '2-5 classes': 0,
          '6-10 classes': 0,
          '11-15 classes': 0,
          '16-20 classes': 0,
          '21-25 classes': 0,
          '>25 classes': 0
        };

        Object.values(memberData).forEach(count => {
          if (count === 1) buckets['1 class']++;
          else if (count >= 2 && count <= 5) buckets['2-5 classes']++;
          else if (count >= 6 && count <= 10) buckets['6-10 classes']++;
          else if (count >= 11 && count <= 15) buckets['11-15 classes']++;
          else if (count >= 16 && count <= 20) buckets['16-20 classes']++;
          else if (count >= 21 && count <= 25) buckets['21-25 classes']++;
          else if (count > 25) buckets['>25 classes']++;
        });

        result[key][month] = buckets;
      });
    });

    return result;
  }, [deferredFilteredData, frequencyBreakdownBy]);

  // Calculate late cancellation frequency buckets - TABULAR FORMAT WITH MONTH FILTER
  const lateCancellationFrequencyData = useMemo(() => {
    // Group by selected dimension (product, category, teacher, or class) and month
    const breakdownData: Record<string, Record<string, Record<string, number>>> = {};
    
  deferredFilteredData.forEach(item => {
      if (!item.isLateCancelled) return;
      
      let breakdownKey = '';
      if (cancellationBreakdownBy === 'product') {
        breakdownKey = item.cleanedProduct || 'Unknown';
      } else if (cancellationBreakdownBy === 'category') {
        breakdownKey = item.cleanedCategory || 'Unknown';
      } else if (cancellationBreakdownBy === 'teacher') {
        breakdownKey = item.teacherName || 'Unknown';
      } else if (cancellationBreakdownBy === 'class') {
        breakdownKey = item.cleanedClass || 'Unknown';
      }
      
      const monthYear = `${item.month}-${item.year}`;
      const memberKey = `${item.memberId}_${monthYear}`;
      
      if (!breakdownData[breakdownKey]) {
        breakdownData[breakdownKey] = {};
      }
      if (!breakdownData[breakdownKey][monthYear]) {
        breakdownData[breakdownKey][monthYear] = {};
      }
      breakdownData[breakdownKey][monthYear][memberKey] = (breakdownData[breakdownKey][monthYear][memberKey] || 0) + 1;
    });

    // Calculate buckets for each breakdown item by month
    const result: Record<string, Record<string, Record<string, number>>> = {};
    
    Object.entries(breakdownData).forEach(([key, monthData]) => {
      result[key] = {};
      
      Object.entries(monthData).forEach(([month, memberData]) => {
        const buckets = {
          '1 cancellation': 0,
          '2-5 cancellations': 0,
          '6-10 cancellations': 0,
          '11-15 cancellations': 0,
          '16-20 cancellations': 0,
          '21-25 cancellations': 0,
          '>25 cancellations': 0
        };

        Object.values(memberData).forEach(count => {
          if (count === 1) buckets['1 cancellation']++;
          else if (count >= 2 && count <= 5) buckets['2-5 cancellations']++;
          else if (count >= 6 && count <= 10) buckets['6-10 cancellations']++;
          else if (count >= 11 && count <= 15) buckets['11-15 cancellations']++;
          else if (count >= 16 && count <= 20) buckets['16-20 cancellations']++;
          else if (count >= 21 && count <= 25) buckets['21-25 cancellations']++;
          else if (count > 25) buckets['>25 cancellations']++;
        });

        result[key][month] = buckets;
      });
    });

    return result;
  }, [deferredFilteredData, cancellationBreakdownBy]);

  // Calculate multiple classes per day
  const multipleClassesPerDay = useMemo(() => {
    const dailyCheckins: Record<string, Record<string, number>> = {};
    
    filteredData.forEach(item => {
      if (!item.checkedIn) return;
      const date = item.dateIST || '';
      
      if (!dailyCheckins[item.memberId]) {
        dailyCheckins[item.memberId] = {};
      }
      dailyCheckins[item.memberId][date] = (dailyCheckins[item.memberId][date] || 0) + 1;
    });

    let membersWithMultipleClasses = 0;
    let totalMultipleClassDays = 0;

    Object.values(dailyCheckins).forEach(memberDates => {
      const daysWithMultiple = Object.values(memberDates).filter(count => count > 1).length;
      if (daysWithMultiple > 0) {
        membersWithMultipleClasses++;
        totalMultipleClassDays += daysWithMultiple;
      }
    });

    return {
      membersWithMultipleClasses,
      totalMultipleClassDays,
      avgMultipleClassDays: membersWithMultipleClasses > 0 ? (totalMultipleClassDays / membersWithMultipleClasses).toFixed(1) : '0'
    };
  }, [filteredData]);

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return null; // Global loader handles this
  }

  if (error) {
    return (
      <GlobalFiltersProvider>
        <div className="min-h-screen bg-white relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-1"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full floating-animation stagger-3"></div>
          </div>
          
          <div className="relative z-10">
            <div style={{ ['--hero-accent' as any]: heroColor }}>
              <SalesMotionHero
                title="Patterns & Trends"
                subtitle="Member behavior and visit analytics across all studio locations"
                primaryAction={{ label: 'Back to Dashboard', onClick: () => navigate('/') }}
                compact
                onColorChange={setHeroColor}
              />
            </div>
            
            <div className="container mx-auto px-6 py-10">
              <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl shadow-sm">
                <div className="font-semibold text-lg mb-1">Failed to load patterns data</div>
                <div className="text-sm opacity-90">{error}</div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </GlobalFiltersProvider>
    );
  }

  return (
    <GlobalFiltersProvider>
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-1"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full floating-animation stagger-3"></div>
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-full morph-shape stagger-2"></div>
        </div>
        
        <div className="relative z-10">
          <div className="bg-white text-slate-800 slide-in-from-left">
            {/* Hero Section */}
            <div style={{ ['--hero-accent' as any]: heroColor }}>
              <SalesMotionHero
                title="Patterns & Trends"
                subtitle="Member behavior and visit analytics across all studio locations"
                metrics={[
                  {
                    label: 'Total Visits',
                    value: formatNumber(filteredLocationData?.filter(item => item.checkedIn).length || 0),
                    change: '+12.5%'
                  },
                  {
                    label: 'Unique Members',
                    value: formatNumber(new Set(filteredLocationData?.map(item => item.memberId) || []).size),
                    change: '+8.3%'
                  },
                  {
                    label: 'Sessions Held',
                    value: formatNumber(new Set(filteredLocationData?.map(item => item.sessionId) || []).size),
                    change: '+15.2%'
                  }
                ]}
                primaryAction={{ label: 'View Dashboard', onClick: () => navigate('/') }}
                secondaryAction={{ label: 'Export Data', onClick: () => {} }}
                compact
                onColorChange={setHeroColor}
              />
            </div>

            <div className="container mx-auto px-6 py-8 space-y-8">
              {/* Location Tabs */}
              <StudioLocationTabs 
                activeLocation={selectedLocation === 'All Locations' ? 'all' : 
                  selectedLocation.toLowerCase().includes('kwality') ? 'kwality' : 
                  selectedLocation.toLowerCase().includes('supreme') ? 'supreme' : 
                  selectedLocation.toLowerCase().includes('kenkere') ? 'kenkere' : 'all'}
                onLocationChange={(locationId) => {
                  const locationMap: Record<string, string> = {
                    'all': 'All Locations',
                    'kwality': 'Kwality House, Kemps Corner',
                    'supreme': 'Supreme HQ, Bandra',
                    'kenkere': 'Kenkere House'
                  };
                  setSelectedLocation(locationMap[locationId] || 'All Locations');
                }}
                showInfoPopover={true}
                infoPopoverContext="patterns-trends-overview"
              />

              {/* Filter Section */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}>
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      {isFiltersCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Filters & Options
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {(selectedProducts.length + selectedCategories.length + selectedTeachers.length + selectedMemberStatus.length + selectedMonths.length) > 0 && (
                        <Badge className="bg-indigo-600 text-white hover:bg-indigo-700">
                          {selectedProducts.length + selectedCategories.length + selectedTeachers.length + selectedMemberStatus.length + selectedMonths.length} active
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs text-slate-500">
                        {isFiltersCollapsed ? 'Click to expand' : 'Click to collapse'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
          {!isFiltersCollapsed && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Products Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    Products
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="space-y-1">
                      {filterOptions.products.map(product => (
                        <label key={product} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts([...selectedProducts, product]);
                              } else {
                                setSelectedProducts(selectedProducts.filter(p => p !== product));
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-slate-700">{product}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedProducts.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProducts([])}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Categories Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Categories
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="space-y-1">
                      {filterOptions.categories.map(category => (
                        <label key={category} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(c => c !== category));
                              }
                            }}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-slate-700">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedCategories.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCategories([])}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Teachers Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-600" />
                    Teachers
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="space-y-1">
                      {filterOptions.teachers.map(teacher => (
                        <label key={teacher} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTeachers.includes(teacher)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTeachers([...selectedTeachers, teacher]);
                              } else {
                                setSelectedTeachers(selectedTeachers.filter(t => t !== teacher));
                              }
                            }}
                            className="rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                          />
                          <span className="text-sm text-slate-700">{teacher}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedTeachers.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTeachers([])}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Member Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Member Status
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="space-y-1">
                      {filterOptions.memberStatuses.map(status => (
                        <label key={status} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMemberStatus.includes(status)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMemberStatus([...selectedMemberStatus, status]);
                              } else {
                                setSelectedMemberStatus(selectedMemberStatus.filter(s => s !== status));
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-slate-700">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedMemberStatus.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMemberStatus([])}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Months Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Months
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="space-y-1">
                      {filterOptions.months.map(month => (
                        <label key={month} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMonths.includes(month)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMonths([...selectedMonths, month]);
                              } else {
                                setSelectedMonths(selectedMonths.filter(m => m !== month));
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">{month}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedMonths.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMonths([])}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </div>

              {/* Clear All Filters */}
              {(selectedProducts.length + selectedCategories.length + selectedTeachers.length + selectedMemberStatus.length + selectedMonths.length) > 0 && (
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedProducts([]);
                      setSelectedCategories([]);
                      setSelectedTeachers([]);
                      setSelectedMemberStatus([]);
                      setSelectedMonths([]);
                    }}
                    className="text-slate-700 hover:bg-slate-100"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Grouping Options */}
        <Card className="glass-card modern-card-hover rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-indigo-600" />
              Group Data By
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={groupBy === 'product' ? 'default' : 'outline'}
                onClick={() => {
                  setGroupBy('product');
                  setExpandedRows(new Set());
                }}
                className={cn(
                  "flex items-center gap-2",
                  groupBy === 'product' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                )}
              >
                <BarChart3 className="w-4 h-4" />
                Product
              </Button>
              <Button
                variant={groupBy === 'category' ? 'default' : 'outline'}
                onClick={() => {
                  setGroupBy('category');
                  setExpandedRows(new Set());
                }}
                className={cn(
                  "flex items-center gap-2",
                  groupBy === 'category' ? 'bg-purple-600 hover:bg-purple-700' : ''
                )}
              >
                <Grid3x3 className="w-4 h-4" />
                Category
              </Button>
              <Button
                variant={groupBy === 'teacher' ? 'default' : 'outline'}
                onClick={() => {
                  setGroupBy('teacher');
                  setExpandedRows(new Set());
                }}
                className={cn(
                  "flex items-center gap-2",
                  groupBy === 'teacher' ? 'bg-pink-600 hover:bg-pink-700' : ''
                )}
              >
                <Users className="w-4 h-4" />
                Teacher
              </Button>
              <Button
                variant={groupBy === 'location' ? 'default' : 'outline'}
                onClick={() => {
                  setGroupBy('location');
                  setExpandedRows(new Set());
                }}
                className={cn(
                  "flex items-center gap-2",
                  groupBy === 'location' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                Location
              </Button>
              <Button
                variant={groupBy === 'memberStatus' ? 'default' : 'outline'}
                onClick={() => {
                  setGroupBy('memberStatus');
                  setExpandedRows(new Set());
                }}
                className={cn(
                  "flex items-center gap-2",
                  groupBy === 'memberStatus' ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                )}
              >
                <UserCheck className="w-4 h-4" />
                Member Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Metric Selector */}
        <Card className="glass-card modern-card-hover rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Select Metric to Analyze
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Choose from 17 different metrics to view in the month-on-month breakdown
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {METRICS.map((metric) => {
                const Icon = metric.icon;
                const isSelected = selectedMetric === metric.id;
                return (
                  <Button
                    key={metric.id}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => setSelectedMetric(metric.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 h-auto py-4 px-3 text-center transition-all duration-200 rounded-xl",
                      isSelected 
                        ? `bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-transparent shadow-lg shadow-indigo-200` 
                        : `hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 ${metric.color} border-slate-200 hover:border-indigo-300 hover:shadow-md`
                    )}
                    title={metric.description}
                  >
                    <Icon className={cn("w-5 h-5", isSelected ? "text-white" : metric.color)} />
                    <span className={cn("text-xs font-semibold leading-tight", isSelected ? "text-white" : "text-slate-700")}>{metric.label}</span>
                    {isSelected && (
                      <div className="w-6 h-0.5 bg-white/60 rounded-full"></div>
                    )}
                  </Button>
                );
              })}
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900 mb-1">
                    Currently Analyzing: {METRICS.find(m => m.id === selectedMetric)?.label}
                  </h4>
                  <p className="text-sm text-indigo-800">
                    {METRICS.find(m => m.id === selectedMetric)?.description}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Sections - Organized by Tabs */}
        <Tabs defaultValue="month-on-month" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 rounded-xl shadow-lg">
            <TabsTrigger 
              value="month-on-month" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Month Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="visit-frequency" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center"
            >
              <Activity className="w-4 h-4 mr-2" />
              Visit Frequency
            </TabsTrigger>
            <TabsTrigger 
              value="cancellations" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Cancellations
            </TabsTrigger>
            <TabsTrigger 
              value="multiple-classes" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center"
            >
              <Users className="w-4 h-4 mr-2" />
              Multiple Classes
            </TabsTrigger>
            <TabsTrigger 
              value="member-behavior" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Member Behavior
            </TabsTrigger>
          </TabsList>

          {/* Month-on-Month Analysis Tab Content */}
          <TabsContent value="month-on-month" className="mt-6 space-y-6">
        {/* Month-on-Month Product Breakdown Table */}
        <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
          <CardHeader className="pb-4 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                <CardTitle className="text-xl font-bold">
                  {METRICS.find(m => m.id === selectedMetric)?.label} by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} - Month on Month
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-white/30">
                  {monthlyProductData.products.length} {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}s
                  {monthlyProductData.products.length === 0 && (
                    <span className="ml-2 text-red-200">(Debug: {deferredFilteredDataNoMonth.length} raw records)</span>
                  )}
                </Badge>
                <CopyTableButton 
                  tableRef={monthOnMonthTableRef as any}
                  tableName={`${METRICS.find(m => m.id === selectedMetric)?.label} by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} - Month on Month`}
                  size="sm"
                  onCopyAllTabs={getAllMetricTablesText}
                  contextInfo={contextInfo}
                />
              </div>
            </div>
            <p className="text-indigo-100 text-sm mt-2">
              Track member check-in patterns across {groupBy}s and time periods
            </p>
          </CardHeader>

          <CardContent className="p-0" ref={monthOnMonthTableRef as any}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                  <TableRow className="border-none">
                    <TableHead className="font-bold text-white sticky left-0 bg-slate-800 z-30 min-w-[240px]">
                      {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
                    </TableHead>
                    {monthlyProductData.months.map((month) => (
                      <TableHead key={month} className="text-center font-bold text-white min-w-[140px]">
                        <div className="flex flex-col">
                          <span className="text-sm">{month.split(' ')[0]}</span>
                          <span className="text-slate-300 text-xs">{month.split(' ')[1]}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold text-white min-w-[120px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">Total Visits</TooltipTrigger>
                          <TooltipContent>Sum of all check-ins across all months</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center font-bold text-white min-w-[120px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">Unique Members</TooltipTrigger>
                          <TooltipContent>Total unique members who checked in</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyProductData.products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={monthlyProductData.months.length + 3} className="text-center py-8 text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="w-8 h-8 text-slate-400" />
                          <div className="text-lg font-medium">No Data Available</div>
                          <div className="text-sm">
                            Raw records: {deferredFilteredDataNoMonth.length} | 
                            Selected location: {selectedLocation} | 
                            Group by: {groupBy}
                          </div>
                          <div className="text-xs mt-2 max-w-md text-center">
                            This could be due to restrictive filters, no data for the selected time period, 
                            or missing product/category information in the data.
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {monthlyProductData.products.map((productData) => {
                    const isExpanded = expandedRows.has(productData.product);
                    const values = productData.monthlyBreakdown.map(m => m[selectedMetric]);
                    const growth = values.length >= 2 ? getChangePercentage(values[0], values[1]) : 0;
                    const metricConfig = METRICS.find(m => m.id === selectedMetric);
                    
                    // Calculate total for current metric
                    const metricTotal = productData.monthlyBreakdown.reduce((sum, m) => sum + m[selectedMetric], 0);

                    return (
                      <React.Fragment key={productData.product}>
                        <TableRow className="hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-indigo-50/30 transition-all duration-200 border-b border-slate-200/50">
                          <TableCell className="font-semibold text-slate-800 sticky left-0 bg-gradient-to-r from-white to-slate-50/30 z-10 border-r border-slate-200">
                            <div className="flex items-center gap-3 py-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleProductExpansion(productData.product)}
                                className="p-1 h-7 w-7 rounded-md hover:bg-indigo-100 transition-colors"
                              >
                                {isExpanded ? <ChevronDown className="w-3 h-3 text-indigo-600" /> : <ChevronRight className="w-3 h-3 text-indigo-600" />}
                              </Button>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-800">{productData.product}</span>
                                <span className="text-xs text-slate-500">{metricConfig?.format === 'currency' 
                                  ? formatRevenue(metricTotal)
                                  : formatNumber(metricTotal)} total
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          {productData.monthlyBreakdown.map((monthData, index) => {
                            const value = monthData[selectedMetric];
                            const formattedValue = metricConfig?.format === 'currency' 
                              ? formatRevenue(value)
                              : metricConfig?.format === 'percentage'
                              ? formatPercentage(value)
                              : metricConfig?.format === 'decimal'
                              ? value.toFixed(1)
                              : formatNumber(value);
                            
                            return (
                              <TableCell 
                                key={monthData.month} 
                                className={cn(
                                  "text-center text-sm font-medium transition-all duration-200 py-3 cursor-pointer border-r border-slate-200/50",
                                  "hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 hover:shadow-md",
                                  metricConfig?.color || "text-slate-800",
                                  value === 0 ? "text-slate-400" : "",
                                  value > 0 && metricConfig?.id === 'emptySessions' ? "text-red-600 bg-red-50/30" : ""
                                )}
                                onClick={() => handleCellDrillDown(productData.product, monthData.month, selectedMetric, value)}
                              >
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="cursor-pointer">
                                      <span className="font-bold text-base hover:text-indigo-700 transition-colors">
                                        {formattedValue}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        <p className="font-semibold">{monthData.month}</p>
                                        <p>{metricConfig?.label}: {formattedValue}</p>
                                        <p className="text-xs text-slate-400">{monthData.uniqueMembers} unique members</p>
                                        {metricConfig?.description && (
                                          <p className="text-xs text-slate-500 italic">{metricConfig.description}</p>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-bold text-slate-700 bg-gradient-to-r from-slate-50 to-slate-100/50 py-3 border-l border-slate-200">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-bold">
                                {metricConfig?.format === 'currency' 
                                  ? formatRevenue(metricTotal)
                                  : metricConfig?.format === 'percentage'
                                  ? formatPercentage(metricTotal / productData.monthlyBreakdown.length)
                                  : metricConfig?.format === 'decimal'
                                  ? (metricTotal / productData.monthlyBreakdown.length).toFixed(1)
                                  : formatNumber(metricTotal)}
                              </span>
                              <span className="text-xs text-slate-500 mt-1">
                                {metricConfig?.format === 'percentage' ? 'avg' : 'total'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold text-indigo-600 bg-gradient-to-r from-indigo-50 to-indigo-100/50 py-3">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-bold">{formatNumber(productData.totalUniqueMembers)}</span>
                              </div>
                              <span className="text-xs text-indigo-500">unique members</span>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Row Details */}
                        {isExpanded && (
                          <TableRow className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 animate-fade-in">
                            <TableCell colSpan={monthlyProductData.months.length + 3} className="p-6">
                              <div className="space-y-6">
                                {/* Summary Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <p className="text-slate-600 text-xs font-medium">Total Check-ins</p>
                                    <p className="font-bold text-slate-800 text-2xl">{formatNumber(productData.totalVisits)}</p>
                                  </div>
                                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <p className="text-slate-600 text-xs font-medium">Unique Members</p>
                                    <p className="font-bold text-indigo-600 text-2xl">{formatNumber(productData.totalUniqueMembers)}</p>
                                  </div>
                                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <p className="text-slate-600 text-xs font-medium">Avg Visits/Member</p>
                                    <p className="font-bold text-purple-600 text-2xl">
                                      {productData.totalUniqueMembers > 0 ? (productData.totalVisits / productData.totalUniqueMembers).toFixed(1) : '0'}
                                    </p>
                                  </div>
                                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <p className="text-slate-600 text-xs font-medium">Peak Month</p>
                                    <p className="font-bold text-pink-600 text-lg">
                                      {productData.monthlyBreakdown.reduce((max, m) => m.visits > max.visits ? m : max, productData.monthlyBreakdown[0])?.month.split(' ')[0] || '-'}
                                    </p>
                                  </div>
                                </div>

                                {/* Individual Records Table - Shows EVERY individual visit record */}
                                <div className="bg-white rounded-lg border overflow-hidden">
                                  <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-2 border-b">
                                    <h4 className="font-semibold text-slate-700 text-sm flex items-center justify-between">
                                      <span>Individual Visit Records - Each Row = One Member Visit for "{productData.product}"</span>
                                      <Badge className="bg-indigo-600 text-white">
                                        {filteredData.filter(item => {
                                          // Match the group
                                          if (groupBy === 'product') return item.cleanedProduct === productData.product;
                                          if (groupBy === 'category') return item.cleanedCategory === productData.product;
                                          if (groupBy === 'teacher') return item.teacherName === productData.product;
                                          if (groupBy === 'location') return item.location === productData.product;
                                          if (groupBy === 'memberStatus') return item.isNew === productData.product;
                                          return false;
                                        }).length} individual visit records
                                      </Badge>
                                    </h4>
                                    <p className="text-xs text-slate-600 mt-1 italic">
                                      This table shows visit records matching all applied filters (including months). Change filters to see different data.
                                    </p>
                                  </div>
                                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                    <Table>
                                      <TableHeader className="sticky top-0 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 z-10 shadow-lg">
                                        <TableRow className="border-b border-slate-600">
                                          <TableHead className="font-bold text-white bg-transparent">#</TableHead>
                                          <TableHead className="font-bold text-white bg-transparent">Visit Date</TableHead>
                                          <TableHead className="font-bold text-white bg-transparent">Month/Year</TableHead>
                                          <TableHead className="font-bold text-white bg-transparent">Member Name</TableHead>
                                          <TableHead className="font-bold text-white bg-transparent">Member ID</TableHead>
                                          <TableHead className="font-bold text-white bg-transparent">Class Name</TableHead>
                                          <TableHead className="font-bold text-white bg-transparent">Time</TableHead>
                                          <TableHead className="font-bold text-white bg-transparent">Product</TableHead>
                                          <TableHead className="font-bold text-white bg-transparent">Category</TableHead>
                                          <TableHead className="text-center font-bold text-white bg-transparent">Status</TableHead>
                                          <TableHead className="text-center font-bold text-white bg-transparent">New/Returning</TableHead>
                                          <TableHead className="text-center font-bold text-white bg-transparent">Paid</TableHead>
                                          <TableHead className="font-bold text-white bg-transparent">Teacher</TableHead>
                                          <TableHead className="font-bold text-white bg-transparent">Location</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {filteredData
                                          .filter(item => {
                                            // Match the group - ALL FILTERS ALREADY APPLIED VIA filteredData
                                            if (groupBy === 'product') return item.cleanedProduct === productData.product;
                                            if (groupBy === 'category') return item.cleanedCategory === productData.product;
                                            if (groupBy === 'teacher') return item.teacherName === productData.product;
                                            if (groupBy === 'location') return item.location === productData.product;
                                            if (groupBy === 'memberStatus') return item.isNew === productData.product;
                                            return false;
                                          })
                                          .sort((a, b) => {
                                            const dateA = new Date(a.dateIST || '');
                                            const dateB = new Date(b.dateIST || '');
                                            return dateB.getTime() - dateA.getTime();
                                          })
                                          .map((record, idx) => (
                                            <TableRow key={`${record.memberId}-${record.sessionId}-${idx}`} className="hover:bg-indigo-50/30 border-b border-slate-100">
                                              <TableCell className="text-xs text-slate-500">
                                                {idx + 1}
                                              </TableCell>
                                              <TableCell className="font-medium text-xs whitespace-nowrap">
                                                {record.dateIST}
                                              </TableCell>
                                              <TableCell className="text-xs whitespace-nowrap">
                                                <Badge variant="outline" className="text-xs">
                                                  {record.month} {record.year}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-xs whitespace-nowrap">
                                                {record.firstName} {record.lastName}
                                              </TableCell>
                                              <TableCell className="text-xs font-mono">
                                                {record.memberId}
                                              </TableCell>
                                              <TableCell className="text-xs max-w-[200px]">
                                                {record.sessionName}
                                              </TableCell>
                                              <TableCell className="text-xs whitespace-nowrap">
                                                {record.time}
                                              </TableCell>
                                              <TableCell className="text-xs">
                                                <Badge variant="secondary" className="text-xs">
                                                  {record.cleanedProduct}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-xs">
                                                {record.cleanedCategory}
                                              </TableCell>
                                              <TableCell className="text-center">
                                                {record.checkedIn ? (
                                                  <Badge className="bg-green-100 text-green-800 text-xs whitespace-nowrap">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Checked In
                                                  </Badge>
                                                ) : record.isLateCancelled ? (
                                                  <Badge className="bg-red-100 text-red-800 text-xs whitespace-nowrap">
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Late Cancel
                                                  </Badge>
                                                ) : (
                                                  <Badge className="bg-amber-100 text-amber-800 text-xs whitespace-nowrap">
                                                    Booked Only
                                                  </Badge>
                                                )}
                                              </TableCell>
                                              <TableCell className="text-center">
                                                <Badge 
                                                  variant={record.isNew && record.isNew.toLowerCase().includes('new') ? 'default' : 'outline'} 
                                                  className={cn(
                                                    "text-xs whitespace-nowrap",
                                                    record.isNew && record.isNew.toLowerCase().includes('new') 
                                                      ? 'bg-indigo-100 text-indigo-800' 
                                                      : 'bg-slate-100 text-slate-800'
                                                  )}
                                                >
                                                  {record.isNew && record.isNew.toLowerCase().includes('new') ? '✨ New' : '↩️ Returning'}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-center text-xs">
                                                <div className="flex flex-col items-center">
                                                  <span className={cn(
                                                    "font-semibold",
                                                    record.paid === 0 ? "text-orange-600" : "text-green-700"
                                                  )}>
                                                    {formatRevenue(record.paid || 0)}
                                                  </span>
                                                  {record.paid === 0 && (
                                                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300 mt-1">
                                                      Complimentary
                                                    </Badge>
                                                  )}
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-xs">
                                                {record.teacherName}
                                              </TableCell>
                                              <TableCell className="text-xs">
                                                {record.location}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        {filteredData.filter(item => {
                                          if (groupBy === 'product') return item.cleanedProduct === productData.product;
                                          if (groupBy === 'category') return item.cleanedCategory === productData.product;
                                          if (groupBy === 'teacher') return item.teacherName === productData.product;
                                          if (groupBy === 'location') return item.location === productData.product;
                                          if (groupBy === 'memberStatus') return item.isNew === productData.product;
                                          return false;
                                        }).length === 0 && (
                                          <TableRow>
                                            <TableCell colSpan={14} className="text-center py-8 text-slate-500">
                                              No visit records found for this {groupBy} with the current filters applied
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                    </>
                  )}

                  {/* Totals Row - only show if there are products */}
                  {monthlyProductData.products.length > 0 && (
                  <TableRow className="bg-gradient-to-r from-emerald-50 to-green-50 border-t-2 border-emerald-600 font-bold">
                    <TableCell className="sticky left-0 bg-gradient-to-r from-emerald-100 to-green-100 z-10 border-r">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6" /> {/* Spacer for alignment */}
                        <span className="text-emerald-800 font-bold text-sm">TOTAL (All {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}s)</span>
                      </div>
                    </TableCell>
                    {monthlyProductData.totalsRow.monthlyBreakdown.map((monthData) => {
                      const metricConfig = METRICS.find(m => m.id === selectedMetric);
                      const value = monthData[selectedMetric];
                      const formattedValue = metricConfig?.format === 'currency' 
                        ? formatRevenue(value)
                        : metricConfig?.format === 'percentage'
                        ? formatPercentage(value)
                        : metricConfig?.format === 'decimal'
                        ? value.toFixed(1)
                        : formatNumber(value);
                      
                      return (
                        <TableCell key={monthData.month} className="text-center font-bold text-emerald-800">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help">{formattedValue}</TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <p className="font-semibold">{monthData.month}</p>
                                  <p>{metricConfig?.label}: {formattedValue}</p>
                                  <p className="text-xs text-slate-400">{monthData.uniqueMembers} unique members</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-bold text-emerald-800 text-base">
                      {(() => {
                        const metricConfig = METRICS.find(m => m.id === selectedMetric);
                        const totalValue = monthlyProductData.totalsRow.monthlyBreakdown.reduce((sum, m) => sum + m[selectedMetric], 0);
                        
                        return metricConfig?.format === 'currency' 
                          ? formatRevenue(totalValue)
                          : metricConfig?.format === 'percentage'
                          ? formatPercentage(totalValue / monthlyProductData.totalsRow.monthlyBreakdown.length)
                          : metricConfig?.format === 'decimal'
                          ? (totalValue / monthlyProductData.totalsRow.monthlyBreakdown.length).toFixed(1)
                          : formatNumber(totalValue);
                      })()}
                    </TableCell>
                    <TableCell className="text-center font-bold text-emerald-800 text-base">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4" />
                        {formatNumber(monthlyProductData.totalsRow.totalUniqueMembers)}
                      </div>
                    </TableCell>
                  </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Visit Frequency Analysis Tab Content */}
          <TabsContent value="visit-frequency" className="mt-6 space-y-6">
        {/* Visit Frequency Analysis */}
        <div className="grid grid-cols-1 gap-6">
          {/* Monthly Visit Frequency */}
          <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-6 h-6" />
                  <CardTitle className="text-xl font-bold">
                    Monthly Visit Frequency by {frequencyBreakdownBy.charAt(0).toUpperCase() + frequencyBreakdownBy.slice(1)}
                  </CardTitle>
                </div>
                <CopyTableButton 
                  tableRef={frequencyTableRef as any}
                  tableName="Attendance Frequency Breakdown"
                  size="sm"
                  onCopyAllTabs={async () => getFrequencyText()}
                  contextInfo={{
                    ...contextInfo,
                    additionalInfo: {
                      ...contextInfo.additionalInfo,
                      breakdownBy: frequencyBreakdownBy.charAt(0).toUpperCase() + frequencyBreakdownBy.slice(1),
                      quickFilter: frequencyQuickFilterMonth !== 'All' ? frequencyQuickFilterMonth : undefined
                    }
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4" ref={frequencyTableRef as any}>
              {/* Breakdown Selector */}
              <div className="flex flex-wrap gap-2 pb-3 border-b border-blue-200">
                <Button
                  size="sm"
                  variant={frequencyBreakdownBy === 'class' ? 'default' : 'outline'}
                  onClick={() => {
                    setFrequencyBreakdownBy('class');
                    setFrequencyQuickFilterMonth('All');
                  }}
                  className={cn(
                    "flex items-center gap-1",
                    frequencyBreakdownBy === 'class' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  Class
                </Button>
                <Button
                  size="sm"
                  variant={frequencyBreakdownBy === 'product' ? 'default' : 'outline'}
                  onClick={() => {
                    setFrequencyBreakdownBy('product');
                    setFrequencyQuickFilterMonth('All');
                  }}
                  className={cn(
                    "flex items-center gap-1",
                    frequencyBreakdownBy === 'product' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                  )}
                >
                  <BarChart3 className="w-3 h-3" />
                  Product
                </Button>
                <Button
                  size="sm"
                  variant={frequencyBreakdownBy === 'category' ? 'default' : 'outline'}
                  onClick={() => {
                    setFrequencyBreakdownBy('category');
                    setFrequencyQuickFilterMonth('All');
                  }}
                  className={cn(
                    "flex items-center gap-1",
                    frequencyBreakdownBy === 'category' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                  )}
                >
                  <Grid3x3 className="w-3 h-3" />
                  Category
                </Button>
                <Button
                  size="sm"
                  variant={frequencyBreakdownBy === 'teacher' ? 'default' : 'outline'}
                  onClick={() => {
                    setFrequencyBreakdownBy('teacher');
                    setFrequencyQuickFilterMonth('All');
                  }}
                  className={cn(
                    "flex items-center gap-1",
                    frequencyBreakdownBy === 'teacher' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                  )}
                >
                  <Users className="w-3 h-3" />
                  Teacher
                </Button>
              </div>

              {/* Month Quick Filter Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Filter by Month:</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  <Badge
                    className={cn(
                      "cursor-pointer transition-all",
                      frequencyQuickFilterMonth === 'All'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    )}
                    onClick={() => setFrequencyQuickFilterMonth('All')}
                  >
                    All Months
                  </Badge>
                  {(() => {
                    const months = new Set<string>();
                    Object.values(visitFrequencyData).forEach(monthData => {
                      Object.keys(monthData).forEach(month => months.add(month));
                    });
                    return Array.from(months).sort((a, b) => {
                      const [monthA, yearA] = a.split('-');
                      const [monthB, yearB] = b.split('-');
                      const dateA = new Date(`${monthA} 1, ${yearA}`);
                      const dateB = new Date(`${monthB} 1, ${yearB}`);
                      return dateB.getTime() - dateA.getTime();
                    }).map(month => (
                      <Badge
                        key={month}
                        className={cn(
                          "cursor-pointer transition-all",
                          frequencyQuickFilterMonth === month
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        )}
                        onClick={() => setFrequencyQuickFilterMonth(month)}
                      >
                        {month}
                      </Badge>
                    ));
                  })()}
                </div>
              </div>

              {/* Tabular Frequency Data Display */}
              <div className="overflow-x-auto">
                <Table className="unified-table">
                  <TableHeader className="sticky top-0 z-10 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                    <TableRow className="border-none">
                      <TableHead className="font-bold text-white sticky left-0 bg-slate-800/95 backdrop-blur-sm z-20 min-w-[200px] border-r border-white/20">
                        {frequencyBreakdownBy.charAt(0).toUpperCase() + frequencyBreakdownBy.slice(1)}
                      </TableHead>
                      <TableHead className="text-center font-bold text-white border-l border-white/20">1 class</TableHead>
                      <TableHead className="text-center font-bold text-white border-l border-white/20">2-5 classes</TableHead>
                      <TableHead className="text-center font-bold text-white border-l border-white/20">6-10 classes</TableHead>
                      <TableHead className="text-center font-bold text-white border-l border-white/20">11-15 classes</TableHead>
                      <TableHead className="text-center font-bold text-white border-l border-white/20">16-20 classes</TableHead>
                      <TableHead className="text-center font-bold text-white border-l border-white/20">21-25 classes</TableHead>
                      <TableHead className="text-center font-bold text-white border-l border-white/20">&gt;25 classes</TableHead>
                      <TableHead className="text-center font-bold text-white border-l border-white/20">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Aggregate data across selected months
                      const aggregated: Record<string, Record<string, number>> = {};
                      
                      Object.entries(visitFrequencyData).forEach(([key, monthData]) => {
                        aggregated[key] = {
                          '1 class': 0,
                          '2-5 classes': 0,
                          '6-10 classes': 0,
                          '11-15 classes': 0,
                          '16-20 classes': 0,
                          '21-25 classes': 0,
                          '>25 classes': 0
                        };
                        
                        Object.entries(monthData).forEach(([month, buckets]) => {
                          if (frequencyQuickFilterMonth === 'All' || month === frequencyQuickFilterMonth) {
                            Object.entries(buckets).forEach(([bucket, count]) => {
                              aggregated[key][bucket] += count;
                            });
                          }
                        });
                      });
                      
                      return Object.entries(aggregated)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([key, buckets]) => {
                          const total = Object.values(buckets).reduce((sum, val) => sum + val, 0);
                          if (total === 0) return null;
                          
                          return (
                            <TableRow key={key} className="hover:bg-slate-50/50 transition-colors border-b">
                              <TableCell className="font-medium text-slate-800 sticky left-0 bg-white z-10 border-r">
                                {key}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['1 class'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['2-5 classes'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['6-10 classes'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['11-15 classes'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['16-20 classes'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['21-25 classes'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['>25 classes'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-bold text-indigo-700 bg-indigo-50">
                                {formatNumber(total)}
                              </TableCell>
                            </TableRow>
                          );
                        }).filter(Boolean);
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          {/* Cancellations Tab Content - Moved from visit frequency */}
          <TabsContent value="cancellations" className="mt-6 space-y-6">
          {/* Late Cancellation Frequency */}
          <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  <CardTitle className="text-xl font-bold">
                    Late Cancellation Frequency by {cancellationBreakdownBy.charAt(0).toUpperCase() + cancellationBreakdownBy.slice(1)}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 text-white border-white/30">
                    {Object.keys(lateCancellationFrequencyData).length} {cancellationBreakdownBy.charAt(0).toUpperCase() + cancellationBreakdownBy.slice(1)}s
                  </Badge>
                  <CopyTableButton 
                    tableRef={cancellationTableRef as any}
                    tableName="Late Cancellations Breakdown"
                    size="sm"
                    onCopyAllTabs={async () => getCancellationText()}
                    contextInfo={{
                      ...contextInfo,
                      additionalInfo: {
                        ...contextInfo.additionalInfo,
                        breakdownBy: cancellationBreakdownBy.charAt(0).toUpperCase() + cancellationBreakdownBy.slice(1),
                        quickFilter: cancellationQuickFilterMonth !== 'All' ? cancellationQuickFilterMonth : undefined
                      }
                    }}
                  />
                </div>
              </div>
              <p className="text-indigo-100 text-sm mt-2">
                Distribution of members by late cancellations per month
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4" ref={cancellationTableRef as any}>
              {/* Breakdown Selector */}
              <div className="flex flex-wrap gap-2 pb-3 border-b border-red-200">
                <Button
                  size="sm"
                  variant={cancellationBreakdownBy === 'class' ? 'default' : 'outline'}
                  onClick={() => {
                    setCancellationBreakdownBy('class');
                    setCancellationQuickFilterMonth('All');
                  }}
                  className={cn(
                    "flex items-center gap-1",
                    cancellationBreakdownBy === 'class' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  Class
                </Button>
                <Button
                  size="sm"
                  variant={cancellationBreakdownBy === 'product' ? 'default' : 'outline'}
                  onClick={() => {
                    setCancellationBreakdownBy('product');
                    setCancellationQuickFilterMonth('All');
                  }}
                  className={cn(
                    "flex items-center gap-1",
                    cancellationBreakdownBy === 'product' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                  )}
                >
                  <BarChart3 className="w-3 h-3" />
                  Product
                </Button>
                <Button
                  size="sm"
                  variant={cancellationBreakdownBy === 'category' ? 'default' : 'outline'}
                  onClick={() => {
                    setCancellationBreakdownBy('category');
                    setCancellationQuickFilterMonth('All');
                  }}
                  className={cn(
                    "flex items-center gap-1",
                    cancellationBreakdownBy === 'category' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                  )}
                >
                  <Grid3x3 className="w-3 h-3" />
                  Category
                </Button>
                <Button
                  size="sm"
                  variant={cancellationBreakdownBy === 'teacher' ? 'default' : 'outline'}
                  onClick={() => {
                    setCancellationBreakdownBy('teacher');
                    setCancellationQuickFilterMonth('All');
                  }}
                  className={cn(
                    "flex items-center gap-1",
                    cancellationBreakdownBy === 'teacher' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                  )}
                >
                  <Users className="w-3 h-3" />
                  Teacher
                </Button>
              </div>

              {/* Month Quick Filter Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Filter by Month:</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  <Badge
                    className={cn(
                      "cursor-pointer transition-all",
                      cancellationQuickFilterMonth === 'All'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    )}
                    onClick={() => setCancellationQuickFilterMonth('All')}
                  >
                    All Months
                  </Badge>
                  {(() => {
                    const months = new Set<string>();
                    Object.values(lateCancellationFrequencyData).forEach(monthData => {
                      Object.keys(monthData).forEach(month => months.add(month));
                    });
                    return Array.from(months).sort((a, b) => {
                      const [monthA, yearA] = a.split('-');
                      const [monthB, yearB] = b.split('-');
                      const dateA = new Date(`${monthA} 1, ${yearA}`);
                      const dateB = new Date(`${monthB} 1, ${yearB}`);
                      return dateB.getTime() - dateA.getTime();
                    }).map(month => (
                      <Badge
                        key={month}
                        className={cn(
                          "cursor-pointer transition-all",
                          cancellationQuickFilterMonth === month
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        )}
                        onClick={() => setCancellationQuickFilterMonth(month)}
                      >
                        {month}
                      </Badge>
                    ));
                  })()}
                </div>
              </div>

              {/* Tabular Frequency Data Display */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-gradient-to-r from-red-700 via-red-800 to-red-700">
                    <TableRow className="border-none">
                      <TableHead className="font-bold text-white sticky left-0 bg-red-800/95 backdrop-blur-sm z-20 min-w-[200px]">
                        {cancellationBreakdownBy.charAt(0).toUpperCase() + cancellationBreakdownBy.slice(1)}
                      </TableHead>
                      <TableHead className="text-center font-bold text-white">1 cancellation</TableHead>
                      <TableHead className="text-center font-bold text-white">2-5 cancellations</TableHead>
                      <TableHead className="text-center font-bold text-white">6-10 cancellations</TableHead>
                      <TableHead className="text-center font-bold text-white">11-15 cancellations</TableHead>
                      <TableHead className="text-center font-bold text-white">16-20 cancellations</TableHead>
                      <TableHead className="text-center font-bold text-white">21-25 cancellations</TableHead>
                      <TableHead className="text-center font-bold text-white">&gt;25 cancellations</TableHead>
                      <TableHead className="text-center font-bold text-white">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Aggregate data across selected months
                      const aggregated: Record<string, Record<string, number>> = {};
                      
                      Object.entries(lateCancellationFrequencyData).forEach(([key, monthData]) => {
                        aggregated[key] = {
                          '1 cancellation': 0,
                          '2-5 cancellations': 0,
                          '6-10 cancellations': 0,
                          '11-15 cancellations': 0,
                          '16-20 cancellations': 0,
                          '21-25 cancellations': 0,
                          '>25 cancellations': 0
                        };
                        
                        Object.entries(monthData).forEach(([month, buckets]) => {
                          if (cancellationQuickFilterMonth === 'All' || month === cancellationQuickFilterMonth) {
                            Object.entries(buckets).forEach(([bucket, count]) => {
                              aggregated[key][bucket] += count;
                            });
                          }
                        });
                      });
                      
                      return Object.entries(aggregated)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([key, buckets]) => {
                          const total = Object.values(buckets).reduce((sum, val) => sum + val, 0);
                          if (total === 0) return null;
                          
                          return (
                            <TableRow key={key} className="hover:bg-slate-50/50 transition-colors border-b">
                              <TableCell className="font-medium text-slate-800 sticky left-0 bg-white z-10 border-r">
                                {key}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['1 cancellation'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['2-5 cancellations'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['6-10 cancellations'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['11-15 cancellations'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['16-20 cancellations'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['21-25 cancellations'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-slate-700">
                                {formatNumber(buckets['>25 cancellations'])}
                              </TableCell>
                              <TableCell className="text-center text-sm font-bold text-indigo-700 bg-indigo-50">
                                {formatNumber(total)}
                              </TableCell>
                            </TableRow>
                          );
                        }).filter(Boolean);
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          {/* Multiple Classes Per Day Tab Content */}
          <TabsContent value="multiple-classes" className="mt-6 space-y-6">
        {/* Multiple Classes Per Day */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-600" />
              Multiple Classes Per Day Analysis
            </CardTitle>
            <p className="text-slate-600 text-sm mt-2">
              Members attending more than one class on the same day
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-shadow">
                <p className="text-slate-600 text-sm font-medium mb-2">Members with Multiple Classes/Day</p>
                <p className="font-bold text-blue-800 text-3xl">
                  {formatNumber(multipleClassesPerDay.membersWithMultipleClasses)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200 hover:shadow-lg transition-shadow">
                <p className="text-slate-600 text-sm font-medium mb-2">Total Days with Multiple Classes</p>
                <p className="font-bold text-indigo-800 text-3xl">
                  {formatNumber(multipleClassesPerDay.totalMultipleClassDays)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 hover:shadow-lg transition-shadow">
                <p className="text-slate-600 text-sm font-medium mb-2">Avg Multiple Class Days/Member</p>
                <p className="font-bold text-purple-800 text-3xl">
                  {multipleClassesPerDay.avgMultipleClassDays}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Member Behavior Patterns Tab Content */}
          <TabsContent value="member-behavior" className="mt-6 space-y-6">
            <MemberBehaviorPatterns />
          </TabsContent>
        </Tabs>
            </div>
          </div>
        </div>
        <Footer />
        
        {/* Drill-Down Modal */}
        {isDrillDownOpen && (
          <PatternsDrillDownModal
            isOpen={isDrillDownOpen}
            onClose={() => setIsDrillDownOpen(false)}
            data={drillDownData}
          />
        )}
      </div>
    </GlobalFiltersProvider>
  );
};

// Drill-Down Modal Component
const PatternsDrillDownModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  data: any;
}> = ({ isOpen, onClose, data }) => {
  if (!data) return null;

  const { product, month, metric, value, rawData, groupBy, metricConfig } = data;

  // Calculate analytics for the filtered data
  const analytics = React.useMemo(() => {
    const totalRecords = rawData.length;
    const checkedInRecords = rawData.filter((item: any) => item.checkedIn).length;
    const uniqueMembers = new Set(rawData.map((item: any) => item.memberId)).size;
    const uniqueSessions = new Set(rawData.map((item: any) => item.sessionId)).size;
    const totalRevenue = rawData.reduce((sum: number, item: any) => sum + (item.paid || 0), 0);
    const avgRevenuePerMember = uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0;
    
    return {
      totalRecords,
      checkedInRecords,
      uniqueMembers,
      uniqueSessions,
      totalRevenue,
      avgRevenuePerMember
    };
  }, [rawData]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl max-h-[90vh] w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {metricConfig?.label} Details
            </h2>
            <p className="text-slate-600">
              {product} • {month} • {formatNumber(value)} {metricConfig?.label.toLowerCase()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            <XCircle className="w-5 h-5" />
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="p-6 border-b border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
              <div className="text-2xl font-bold text-blue-900">{formatNumber(analytics.totalRecords)}</div>
              <div className="text-sm text-blue-700">Total Records</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <div className="text-2xl font-bold text-green-900">{formatNumber(analytics.checkedInRecords)}</div>
              <div className="text-sm text-green-700">Check-ins</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
              <div className="text-2xl font-bold text-purple-900">{formatNumber(analytics.uniqueMembers)}</div>
              <div className="text-sm text-purple-700">Unique Members</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl">
              <div className="text-2xl font-bold text-amber-900">{formatRevenue(analytics.totalRevenue)}</div>
              <div className="text-sm text-amber-700">Revenue</div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto p-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <TableHead className="font-semibold text-slate-900">Member</TableHead>
                    <TableHead className="font-semibold text-slate-900">Session</TableHead>
                    <TableHead className="font-semibold text-slate-900">Date</TableHead>
                    <TableHead className="font-semibold text-slate-900">Status</TableHead>
                    <TableHead className="font-semibold text-slate-900">Revenue</TableHead>
                    <TableHead className="font-semibold text-slate-900">Teacher</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawData.slice(0, 100).map((item: any, index: number) => (
                    <TableRow key={index} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">{item.customerName || 'Unknown'}</div>
                          <div className="text-sm text-slate-500">ID: {item.memberId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">{item.cleanedClass}</div>
                          <div className="text-sm text-slate-500">{item.sessionId}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {new Date(`${item.month} ${item.day}, ${item.year}`).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.checkedIn ? 'default' : 'secondary'}>
                          {item.checkedIn ? 'Checked In' : 'Booked'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {formatRevenue(item.paid || 0)}
                      </TableCell>
                      <TableCell className="text-slate-700">{item.teacherName || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rawData.length > 100 && (
                <div className="p-4 text-center text-slate-500 border-t">
                  Showing first 100 of {rawData.length} records
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternsAndTrends;

