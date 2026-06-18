
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { TrainerNameCell, getTrainerImage } from '@/components/ui/TrainerAvatar';
import { TrainerYearOnYearTable } from './TrainerYearOnYearTable';
import { TrainerPerformanceDetailTable } from './TrainerPerformanceDetailTable';
import { TrainerEfficiencyAnalysisTable } from './TrainerEfficiencyAnalysisTable';
import { MonthOnMonthTrainerTable } from './MonthOnMonthTrainerTable';
import { ComprehensiveTrainerDrillDown } from './ComprehensiveTrainerDrillDown';
import { TrainerFilterSection } from './TrainerFilterSection';
import { EnhancedTrainerMetricCards } from './EnhancedTrainerMetricCards';
import { DataScienceInsightsPanel } from './DataScienceInsightsPanel';
import { processTrainerData } from './TrainerDataProcessor';
import { formatCurrency, formatNumber, formatRevenue } from '@/utils/formatters';
import { Users, Calendar, TrendingUp, TrendingDown, AlertCircle, Award, Target, DollarSign, Activity, FileDown, Crown, Trophy, Medal, Maximize2, Download, RotateCcw } from 'lucide-react';
import { InfoPopover } from '@/components/ui/InfoSidebar';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getActiveConsolidatedExportPreset, getConsolidatedStudioOption } from '@/utils/consolidatedExportPreset';

const MONTH_LABEL_TO_INDEX: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const parseTrainerMonthLabel = (value: string) => {
  if (!value) return null;

  const normalized = value.replace(/-/g, ' ').trim();
  const parsed = new Date(`1 ${normalized}`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
};

const canonicalizeTrainerMonthLabel = (value: string) => {
  const parsed = parseTrainerMonthLabel(value);
  if (!parsed) return value;

  const monthLabel = parsed.toLocaleDateString('en-US', { month: 'short' });
  return `${monthLabel}-${parsed.getFullYear()}`;
};

const sortTrainerMonthsDesc = (months: string[]) =>
  [...months].sort((a, b) => {
    const aDate = parseTrainerMonthLabel(a)?.getTime() ?? 0;
    const bDate = parseTrainerMonthLabel(b)?.getTime() ?? 0;
    return bDate - aDate;
  });

export const EnhancedTrainerPerformanceSection = () => {
  const exportPreset = useMemo(() => (typeof window !== 'undefined' ? getActiveConsolidatedExportPreset(window.location.search) : null), []);
  const exportStudio = exportPreset ? getConsolidatedStudioOption(exportPreset.studioId) : null;
  const { data: payrollData, isLoading, error } = usePayrollData();
  const { data: sessionsData } = useSessionsData();
  const { data: checkinsData } = useCheckinsData();
  const [selectedTab, setSelectedTab] = useState('month-on-month');
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [clickedMetric, setClickedMetric] = useState<string | null>(null);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
  const DEFAULT_LOCATION = exportPreset?.studioId === 'all' ? 'All Locations' : (exportStudio?.trainerLocationLabel || 'Kwality House, Kemps Corner');
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [isRendering, setIsRendering] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    trainer: '',
    month: '',
    months: [] as string[],
    searchTerm: '',
    performanceLevel: '',
    classType: '',
    minSessions: null as number | null,
    maxSessions: null as number | null,
    minRevenue: null as number | null,
    maxRevenue: null as number | null
  });

  // Base processed data
  const baseProcessed = useMemo(() => {
    if (!payrollData || payrollData.length === 0) return [];
    return processTrainerData(payrollData).map((item) => ({
      ...item,
      monthYear: canonicalizeTrainerMonthLabel(item.monthYear || ''),
    }));
  }, [payrollData]);

  const availableMonths = useMemo(() => {
    const scopedData = selectedLocation === 'All Locations'
      ? baseProcessed
      : baseProcessed.filter((item) => (item.location || '') === selectedLocation);

    const months = sortTrainerMonthsDesc(Array.from(new Set(scopedData.map(item => item.monthYear).filter(Boolean))));

    return months;
  }, [baseProcessed, selectedLocation]);

  const defaultMonth = useMemo(() => {
    const months = availableMonths;
    if (months.length === 0) return '';

    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthShort = prev.toLocaleDateString('en-US', { month: 'short' });
    const expectedMonth = `${monthShort}-${prev.getFullYear()}`;

    return months.find((month) => month === expectedMonth) || months[0] || '';
  }, [availableMonths]);

  useEffect(() => {
    if (!defaultMonth) return;

    setFilters((prev) => {
      const validSelectedMonths = (prev.months || []).filter((month) => availableMonths.includes(month));

      if (validSelectedMonths.length > 0) {
        return prev;
      }

      return {
        ...prev,
        month: defaultMonth,
        months: [defaultMonth],
      };
    });
  }, [availableMonths, defaultMonth]);

  // Data with all filters applied (including month) for cards, charts, efficiency, and detail tables
  const processedData = useMemo(() => {
    let data = [...baseProcessed];
    
    // Apply location (tabs) and explicit location filter
    if (selectedLocation !== 'All Locations') {
      const beforeCount = data.length;
      data = data.filter(d => {
        const location = d.location || '';
        // Use exact match since we know the exact location names from diagnostic logging
        return location === selectedLocation;
      });
      // Removed diagnostic logs about location filter to reduce console noise
    }
    // Remove the filters.location check - only use tab location selection
    // if (filters.location) {
    //   data = data.filter(d => d.location === filters.location);
    // }
    
    // Apply trainer filter
    if (filters.trainer) {
      data = data.filter(d => d.trainerName === filters.trainer);
    }
    
    // Apply month filter
    if (filters.months.length > 0) {
      data = data.filter(d => filters.months.includes(d.monthYear));
    } else if (filters.month) {
      data = data.filter(d => d.monthYear === filters.month);
    }
    
    // Apply enhanced filters from rebuilt TrainerFilterSection
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      data = data.filter(d => 
        d.trainerName.toLowerCase().includes(searchLower) ||
        (d.location || '').toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.minSessions !== null) {
      data = data.filter(d => d.totalSessions >= filters.minSessions);
    }
    
    if (filters.maxSessions !== null) {
      data = data.filter(d => d.totalSessions <= filters.maxSessions);
    }
    
    if (filters.minRevenue !== null) {
      data = data.filter(d => d.totalPaid >= filters.minRevenue);
    }
    
    if (filters.maxRevenue !== null) {
      data = data.filter(d => d.totalPaid <= filters.maxRevenue);
    }
    
    if (filters.performanceLevel) {
      // Sort by total revenue to determine performance levels
      const allData = [...data];
      const sortedByRevenue = allData.sort((a, b) => b.totalPaid - a.totalPaid);
      const total = sortedByRevenue.length;
      const topQuartile = Math.ceil(total * 0.25);
      const bottomQuartile = Math.ceil(total * 0.25);
      
      if (filters.performanceLevel === 'high') {
        const highPerformers = sortedByRevenue.slice(0, topQuartile);
        data = data.filter(d => highPerformers.some(hp => hp.trainerName === d.trainerName && hp.monthYear === d.monthYear));
      } else if (filters.performanceLevel === 'low') {
        const lowPerformers = sortedByRevenue.slice(total - bottomQuartile);
        data = data.filter(d => lowPerformers.some(lp => lp.trainerName === d.trainerName && lp.monthYear === d.monthYear));
      } else if (filters.performanceLevel === 'medium') {
        const mediumPerformers = sortedByRevenue.slice(topQuartile, total - bottomQuartile);
        data = data.filter(d => mediumPerformers.some(mp => mp.trainerName === d.trainerName && mp.monthYear === d.monthYear));
      }
    }
    
    if (filters.classType) {
      // Filter based on class type dominance
      if (filters.classType === 'cycle') {
        data = data.filter(d => d.cycleSessions > d.barreSessions && d.cycleSessions > (d.strengthSessions || 0));
      } else if (filters.classType === 'barre') {
        data = data.filter(d => d.barreSessions > d.cycleSessions && d.barreSessions > (d.strengthSessions || 0));
      } else if (filters.classType === 'strength') {
        data = data.filter(d => (d.strengthSessions || 0) > d.cycleSessions && (d.strengthSessions || 0) > d.barreSessions);
      }
    }
    
    return data;
  }, [baseProcessed, filters, selectedLocation]);

  // Data that ignores the month filter (but respects location/trainer) for MoM/YoY
  const processedDataNoMonth = useMemo(() => {
    let data = [...baseProcessed];
    
    if (selectedLocation !== 'All Locations') {
      data = data.filter(d => {
        const location = d.location || '';
        // Use exact match since we know the exact location names
        return location === selectedLocation;
      });
    }
    // Remove the filters.location check - only use tab location selection
    // if (filters.location) {
    //   data = data.filter(d => d.location === filters.location);
    // }
    if (filters.trainer) {
      data = data.filter(d => d.trainerName === filters.trainer);
    }
    
    // Apply enhanced filters except month filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      data = data.filter(d => 
        d.trainerName.toLowerCase().includes(searchLower) ||
        (d.location || '').toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.minSessions !== null) {
      data = data.filter(d => d.totalSessions >= filters.minSessions);
    }
    
    if (filters.maxSessions !== null) {
      data = data.filter(d => d.totalSessions <= filters.maxSessions);
    }
    
    if (filters.minRevenue !== null) {
      data = data.filter(d => d.totalPaid >= filters.minRevenue);
    }
    
    if (filters.maxRevenue !== null) {
      data = data.filter(d => d.totalPaid <= filters.maxRevenue);
    }
    
    if (filters.performanceLevel) {
      // Sort by total revenue to determine performance levels
      const allData = [...data];
      const sortedByRevenue = allData.sort((a, b) => b.totalPaid - a.totalPaid);
      const total = sortedByRevenue.length;
      const topQuartile = Math.ceil(total * 0.25);
      const bottomQuartile = Math.ceil(total * 0.25);
      
      if (filters.performanceLevel === 'high') {
        const highPerformers = sortedByRevenue.slice(0, topQuartile);
        data = data.filter(d => highPerformers.some(hp => hp.trainerName === d.trainerName && hp.monthYear === d.monthYear));
      } else if (filters.performanceLevel === 'low') {
        const lowPerformers = sortedByRevenue.slice(total - bottomQuartile);
        data = data.filter(d => lowPerformers.some(lp => lp.trainerName === d.trainerName && lp.monthYear === d.monthYear));
      } else if (filters.performanceLevel === 'medium') {
        const mediumPerformers = sortedByRevenue.slice(topQuartile, total - bottomQuartile);
        data = data.filter(d => mediumPerformers.some(mp => mp.trainerName === d.trainerName && mp.monthYear === d.monthYear));
      }
    }
    
    if (filters.classType) {
      // Filter based on class type dominance
      if (filters.classType === 'cycle') {
        data = data.filter(d => d.cycleSessions > d.barreSessions && d.cycleSessions > (d.strengthSessions || 0));
      } else if (filters.classType === 'barre') {
        data = data.filter(d => d.barreSessions > d.cycleSessions && d.barreSessions > (d.strengthSessions || 0));
      } else if (filters.classType === 'strength') {
        data = data.filter(d => (d.strengthSessions || 0) > d.cycleSessions && (d.strengthSessions || 0) > d.barreSessions);
      }
    }
    
    // Intentionally DO NOT apply filters.month here
    return data;
  }, [baseProcessed, filters.trainer, filters.searchTerm, filters.minSessions, filters.maxSessions, filters.minRevenue, filters.maxRevenue, filters.performanceLevel, filters.classType, selectedLocation]);

  const handleRowClick = (trainer: string, data: any) => {
    // Simply pass the data directly - the modal will handle processing
    // The data object already contains all the processed trainer information
    // Determine context strictly by source type
    const clickType = data?.type || 'generic';
    const effectiveLocation = data.location || (filters.location || selectedLocation);
    let effectiveMonth = '';
    if (clickType === 'trainer-month-cell') {
      // Only month-table cell clicks enforce a month context
      effectiveMonth = data.monthYear || filters.months[0] || filters.month || '';
    } else if (clickType === 'trainer-efficiency') {
      // Efficiency table should show the most recent month data, not filtered month
      effectiveMonth = data.monthYear || '';
    } else {
      // Other sources only use the globally selected month if explicitly set
      effectiveMonth = filters.months.length === 1 ? filters.months[0] : (filters.month || '');
    }
    
    setSelectedTrainer(trainer);
    setClickedMetric('overview');
    setDrillDownData({
      // Spread all existing processed data
      ...data,
      // Ensure trainerName is set
      trainerName: trainer,
      location: effectiveLocation,
      monthYear: data.monthYear || effectiveMonth,
      contextFilters: { location: effectiveLocation, month: effectiveMonth, months: filters.months },
      // Add raw payroll data for this trainer
      rawPayrollRecords: (payrollData || []).filter(r => r.teacherName === trainer),
    });
  };

  const closeDrillDown = () => {
    setSelectedTrainer(null);
    setDrillDownData(null);
  };

  // Calculate summary statistics and metrics
  const summaryStats = useMemo(() => {
    if (!processedData.length) return null;

    const totalTrainers = new Set(processedData.map(d => d.trainerName)).size;
    const totalSessions = processedData.reduce((sum, d) => sum + d.totalSessions, 0);
    const totalRevenue = processedData.reduce((sum, d) => sum + d.totalPaid, 0);
    const totalCustomers = processedData.reduce((sum, d) => sum + d.totalCustomers, 0);
    const avgClassSize = totalSessions > 0 ? totalCustomers / totalSessions : 0;
    const avgRevenue = totalTrainers > 0 ? totalRevenue / totalTrainers : 0;

    return {
      totalTrainers,
      totalSessions,
      totalRevenue,
      totalCustomers,
      avgClassSize,
      avgRevenue
    };
  }, [processedData]);

  // Interactive rankings controls (metric + show count)
  const [rankingMetric, setRankingMetric] = useState<'revenue' | 'sessions' | 'customers' | 'efficiency' | 'classAvg' | 'conversion' | 'retention' | 'emptySessions' | 'fillRate'>('revenue');
  const [rankingCount, setRankingCount] = useState<number>(5);

  // Build ranked trainers based on selected metric
  const rankedTrainers = useMemo(() => {
    if (!processedData.length) return [] as any[];

    const byTrainer = processedData.reduce((acc, r) => {
      const key = r.trainerName;
      if (!acc[key]) {
        acc[key] = {
          name: key,
          location: r.location,
          totalRevenue: 0,
          totalSessions: 0,
          totalCustomers: 0,
          nonEmptySessions: 0,
          totalConverted: 0,
          totalNew: 0,
          totalRetained: 0,
          conversionSum: 0,
          retentionSum: 0,
          records: 0,
          emptySessions: 0
        } as any;
      }
      const t = acc[key];
      t.totalRevenue += r.totalPaid || 0;
      t.totalSessions += r.totalSessions || 0;
      t.totalCustomers += r.totalCustomers || 0;
      t.nonEmptySessions += r.nonEmptySessions || 0;
      // processed data fields use `convertedMembers`, `newMembers`, `retainedMembers`, `conversionRate`
      t.totalConverted += (r.convertedMembers ?? r.converted ?? 0);
      t.totalNew += (r.newMembers ?? r.new ?? 0);
      t.totalRetained += (r.retainedMembers ?? r.retained ?? 0);
      t.conversionSum += (r.conversionRate ?? 0);
      t.retentionSum += (r.retentionRate ?? 0);
      t.emptySessions += (r.emptySessions ?? r.totalEmptySessions ?? 0);
      t.records += 1;
      return acc;
    }, {} as Record<string, any>);

    const trainers = Object.values(byTrainer).map((t: any) => {
      const efficiency = t.totalSessions > 0 ? t.totalRevenue / t.totalSessions : 0;
      const classAvg = t.totalSessions > 0 ? (t.nonEmptySessions > 0 ? (t.totalCustomers / t.nonEmptySessions) : (t.totalCustomers / t.totalSessions)) : 0;
      const conversionRate = t.records > 0 ? t.conversionSum / t.records : 0;
      const retentionRate = t.records > 0 ? t.retentionSum / t.records : 0;
      // expose aggregated totals too
      return { ...t, efficiency, classAvg, conversionRate, retentionRate, newMembers: t.totalNew, convertedMembers: t.totalConverted, retainedMembers: t.totalRetained, fillRate: t.totalSessions > 0 ? (t.totalCustomers / (t.totalSessions * 20)) * 100 : 0 };
    });

    const sortFn = (a: any, b: any) => {
      switch (rankingMetric) {
        case 'revenue': return b.totalRevenue - a.totalRevenue;
        case 'sessions': return b.totalSessions - a.totalSessions;
        case 'customers': return b.totalCustomers - a.totalCustomers;
        case 'efficiency': return b.efficiency - a.efficiency;
        case 'classAvg': return b.classAvg - a.classAvg;
        case 'fillRate': return b.fillRate - a.fillRate;
        case 'conversion': return b.conversionRate - a.conversionRate;
        case 'retention': return b.retentionRate - a.retentionRate;
        case 'emptySessions': return b.emptySessions - a.emptySessions;
        default: return b.totalRevenue - a.totalRevenue;
      }
    };

    return trainers.sort(sortFn);
  }, [processedData, rankingMetric]);

  const topList = rankedTrainers.slice(0, rankingCount);
  const bottomList = rankedTrainers.slice(-rankingCount).reverse();

  // Chart data
  const chartData = useMemo(() => {
    if (!processedData.length) return [];

    const monthlyData = processedData.reduce((acc, trainer) => {
      const month = trainer.monthYear;
      if (!acc[month]) {
        acc[month] = { month, sessions: 0, revenue: 0, customers: 0 };
      }
      acc[month].sessions += trainer.totalSessions;
      acc[month].revenue += trainer.totalPaid;
      acc[month].customers += trainer.totalCustomers;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }, [processedData]);

  // Handle rendering state - wait for data to be processed before showing content
  useEffect(() => {
    if (isLoading) {
      setIsRendering(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsRendering(false);
    }, payrollData && payrollData.length > 0 ? 100 : 0);

    return () => clearTimeout(timer);
  }, [isLoading, payrollData]);

  if (isLoading || isRendering) {
    return null; // Global loader handles this
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading trainer data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!processedData.length) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardContent className="p-6">
          <p className="text-center text-slate-600">
            No trainer performance data available for: {selectedLocation}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Location Tabs - matching Client Retention styling */}
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
            'kenkere': 'Kenkere House'  // Match actual data: just 'Kenkere House'
          };
          const newLocation = locationMap[locationId] || 'All Locations';
          setSelectedLocation(newLocation);
        }}
        showInfoPopover={true}
        infoPopoverContext="trainer-performance-overview"
      />

      {/* Filter Section */}
  <div className="glass-card modern-card-hover p-6 rounded-2xl mb-6" id="filters">

        <TrainerFilterSection
          data={baseProcessed.map(p => ({ 
            teacherName: p.trainerName, 
            location: p.location, 
            monthYear: p.monthYear,
            totalSessions: p.totalSessions,
            totalPaid: p.totalPaid
          })) || []}
          onFiltersChange={setFilters}
          activeLocation={selectedLocation}
          activeMonths={filters.months.length ? filters.months : (defaultMonth ? [defaultMonth] : [])}
          defaultLocation={DEFAULT_LOCATION}
          defaultMonths={defaultMonth ? [defaultMonth] : []}
          onLocationChange={setSelectedLocation}
          isCollapsed={isFiltersCollapsed}
          onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
        />
      </div>

      {/* Enhanced Metric Cards - matching Sales styling */}
      <div className="glass-card modern-card-hover rounded-2xl p-6 soft-bounce stagger-2" id="metrics">
        <EnhancedTrainerMetricCards 
          data={processedData} 
          onCardClick={(title, data) => {
            // Open drill-down modal with trainer data and remember clicked metric
            const trainerName = title;
            const effectiveLocation = data.location || (filters.location || selectedLocation);
            const effectiveMonth = filters.months.length === 1 ? filters.months[0] : (filters.month || '');
            setSelectedTrainer(trainerName);
            setClickedMetric(title);
            setDrillDownData({ ...data, trainerName, location: effectiveLocation, monthYear: effectiveMonth, type: 'metric-card', contextFilters: { location: effectiveLocation, month: effectiveMonth, months: filters.months } });
          }}
        />
      </div>

      <DataScienceInsightsPanel
        title="Trainer Data Science Toolkit"
        description="Validate trainer distribution quality with robust outlier, trend, and concentration diagnostics."
        data={processedDataNoMonth}
        initiallyCollapsed={true}
        metricOptions={[
          {
            key: 'totalPaid',
            label: 'Revenue',
            accessor: (row: any) => Number(row?.totalPaid || 0),
          },
          {
            key: 'totalSessions',
            label: 'Sessions',
            accessor: (row: any) => Number(row?.totalSessions || 0),
          },
          {
            key: 'totalCustomers',
            label: 'Members',
            accessor: (row: any) => Number(row?.totalCustomers || 0),
          },
          {
            key: 'revenuePerSession',
            label: 'Revenue per Session',
            accessor: (row: any) => {
              const sessions = Number(row?.totalSessions || 0);
              const revenue = Number(row?.totalPaid || 0);
              return sessions > 0 ? revenue / sessions : 0;
            },
          },
          {
            key: 'conversionRate',
            label: 'Conversion Rate %',
            accessor: (row: any) => Number(row?.conversionRate || 0),
          },
        ]}
        dateAccessor={(row: any) => {
          const key = String(row?.monthKey || row?.monthYear || '').trim();
          if (!key) return null;

          if (/^\d{4}-\d{2}$/.test(key)) {
            const parsedIso = new Date(`${key}-01`);
            return Number.isNaN(parsedIso.getTime()) ? null : parsedIso;
          }

          const normalized = key.replace('-', ' ');
          const parsedLabel = new Date(`1 ${normalized}`);
          return Number.isNaN(parsedLabel.getTime()) ? null : parsedLabel;
        }}
      />

      {/* Charts Section - Enhanced 3D Interactive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance Trends - 3D Line Chart */}
        <Card className="group relative bg-gradient-to-br from-white via-blue-50/30 to-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
          {/* Glow effect on hover */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
          
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Monthly Performance Trends
                  </div>
                  <div className="text-xs text-slate-500 font-normal">Revenue & session growth over time</div>
                </div>
              </div>
              {/* Interactive Chart Controls */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="bg-white/50 hover:bg-blue-50 border-blue-200">
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="bg-white/50 hover:bg-blue-50 border-blue-200">
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="bg-white/50 hover:bg-blue-50 border-blue-200">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart 
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <filter id="shadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                  </filter>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.5}
                />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  tick={{ fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    padding: '12px 16px',
                    backdropFilter: 'blur(10px)'
                  }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '8px' }}
                  itemStyle={{ color: '#e2e8f0', padding: '4px 0' }}
                  cursor={{ stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={4}
                  name="Revenue"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6, stroke: '#fff', filter: 'url(#shadow)' }}
                  activeDot={{ r: 8, fill: '#2563EB', stroke: '#fff', strokeWidth: 3 }}
                  fill="url(#revenueGradient)"
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Sessions"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 5, stroke: '#fff', filter: 'url(#shadow)' }}
                  activeDot={{ r: 7, fill: '#059669', stroke: '#fff', strokeWidth: 3 }}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sessions vs Revenue - 3D Bar Chart */}
        <Card className="group relative bg-gradient-to-br from-white via-green-50/30 to-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
          {/* Glow effect on hover */}
          <div className="absolute -inset-1 bg-gradient-to-r from-green-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
          
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-green-600 to-green-700 rounded-lg text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                    Sessions vs Members
                  </div>
                  <div className="text-xs text-slate-500 font-normal">Comparative analysis by month</div>
                </div>
              </div>
              {/* Interactive Chart Controls */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="bg-white/50 hover:bg-green-50 border-green-200">
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="bg-white/50 hover:bg-green-50 border-green-200">
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="bg-white/50 hover:bg-green-50 border-green-200">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="sessionsBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                  </linearGradient>
                  <linearGradient id="customersBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.8}/>
                  </linearGradient>
                  <filter id="barShadow">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.4"/>
                  </filter>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.5}
                />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  tick={{ fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    padding: '12px 16px',
                    backdropFilter: 'blur(10px)'
                  }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '8px' }}
                  itemStyle={{ color: '#e2e8f0', padding: '4px 0' }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                />
                <Bar 
                  dataKey="sessions" 
                  fill="url(#sessionsBarGradient)" 
                  name="Sessions"
                  radius={[8, 8, 0, 0]}
                  filter="url(#barShadow)"
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Bar 
                  dataKey="customers" 
                  fill="url(#customersBarGradient)" 
                  name="Members"
                  radius={[8, 8, 0, 0]}
                  filter="url(#barShadow)"
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top & Bottom Performers — styled like Sales with controls */}
      <Card className="bg-gradient-to-br from-white via-slate-50/20 to-white border-0 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            Trainer Top & Bottom Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {/* Metric selection */}
            <div className="flex flex-wrap bg-slate-50 border border-slate-200 rounded-lg p-1 gap-1">
                {[
                { key: 'revenue', label: 'Revenue', icon: DollarSign },
                { key: 'sessions', label: 'Sessions', icon: Activity },
                { key: 'customers', label: 'Members', icon: Users },
                { key: 'efficiency', label: 'Rev/Session', icon: DollarSign },
                { key: 'classAvg', label: 'Class Avg', icon: Users },
                { key: 'fillRate', label: 'Fill Rate', icon: Target },
                { key: 'conversion', label: 'Conversion', icon: TrendingUp },
                { key: 'retention', label: 'Retention', icon: Target },
                { key: 'emptySessions', label: 'Empty', icon: Activity },
              ].map(({ key, label, icon: Icon }: any) => (
                <Button
                  key={key}
                  size="sm"
                  variant={rankingMetric === key ? 'default' : 'ghost'}
                  className={rankingMetric === key ? 'bg-black text-white' : 'text-slate-700 hover:bg-slate-100'}
                  onClick={() => setRankingMetric(key)}
                >
                  <Icon className="w-3 h-3 mr-1" /> {label}
                </Button>
              ))}
            </div>
            {/* Count selection */}
            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
              {[5, 10, 15].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={rankingCount === n ? 'default' : 'ghost'}
                  className={rankingCount === n ? 'bg-purple-800 text-white' : 'text-slate-700 hover:bg-slate-100'}
                  onClick={() => setRankingCount(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers Card */}
            <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Top Trainers</span>
                    <p className="text-sm text-slate-600 font-normal capitalize">By {rankingMetric === 'efficiency' ? 'Revenue/Session' : rankingMetric === 'classAvg' ? 'Class Average' : rankingMetric === 'conversion' ? 'Conversion Rate' : rankingMetric}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                {topList.map((t: any, index: number) => (
                  <div
                    key={t.name}
                    className="group flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border hover:shadow-md transition-all duration-300 cursor-pointer hover:border-emerald-200/70 min-h-[88px]"
                    onClick={() => handleRowClick(t.name, { ...t, type: 'ranking-item' })}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 shadow-lg" style={{
                          borderColor: index === 0 ? '#f59e0b' : index === 1 ? '#9ca3af' : index === 2 ? '#d97706' : '#3b82f6'
                        }}>
                          <img 
                            src={getTrainerImage(t.name)}
                            alt={t.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const initials = t.name.split(' ').map((n: string) => n[0]).join('');
                              target.parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${index === 0 ? 'from-yellow-400 to-orange-500' : index === 1 ? 'from-gray-300 to-gray-500' : index === 2 ? 'from-amber-400 to-amber-600' : 'from-blue-500 to-blue-700'} flex items-center justify-center text-white text-lg font-bold">${initials}</div>`;
                            }}
                          />
                        </div>
                        <div className={
                          `absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md text-white text-xs font-bold border-2 border-white ` +
                          (index === 0
                            ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500'
                            : index === 1
                            ? 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500'
                            : index === 2
                            ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600'
                            : 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700')
                        }>
                          {index === 0 ? (
                            <Crown className="w-4 h-4" />
                          ) : index === 1 ? (
                            <Trophy className="w-4 h-4" />
                          ) : index === 2 ? (
                            <Medal className="w-3 h-3" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors" title={t.name}>{t.name}</p>
                        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap">
                            {rankingMetric === 'conversion' ? `${formatNumber(t.totalNew || 0)} new` : `${formatNumber(t.totalSessions)} sessions`}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-green-200 text-green-700 whitespace-nowrap">
                            {rankingMetric === 'conversion' ? `${formatNumber(t.totalConverted || 0)} converted` : rankingMetric === 'fillRate' ? `${(t.fillRate ?? 0).toFixed(1)}% fill` : `Avg: ${(t.nonEmptySessions > 0 ? (t.totalCustomers / t.nonEmptySessions) : (t.totalSessions > 0 ? t.totalCustomers / t.totalSessions : 0)).toFixed(1)}`}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 whitespace-nowrap">
                            {rankingMetric === 'conversion' ? `${formatNumber(t.totalRetained || 0)} retained` : rankingMetric === 'fillRate' ? `${((t.nonEmptySessions / Math.max(t.totalSessions,1))*100).toFixed(1)}% utilization` : `${formatNumber(t.totalCustomers)} members`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                        {rankingMetric === 'revenue' ? formatRevenue(t.totalRevenue)
                          : rankingMetric === 'sessions' ? formatNumber(t.totalSessions)
                          : rankingMetric === 'customers' ? formatNumber(t.totalCustomers)
                          : rankingMetric === 'efficiency' ? formatRevenue(t.efficiency)
                          : rankingMetric === 'classAvg' ? (t.classAvg).toFixed(1)
                          : rankingMetric === 'fillRate' ? `${(t.fillRate ?? 0).toFixed(1)}%`
                          : rankingMetric === 'conversion' ? `${t.conversionRate.toFixed(1)}%`
                          : rankingMetric === 'retention' ? `${t.retentionRate.toFixed(1)}%`
                          : formatNumber(t.emptySessions)}
                      </p>
                      <p className="text-sm text-slate-500 truncate" title={t.location}>
                        {rankingMetric === 'conversion' ? `${t.totalConverted || 0}/${t.totalNew || 0} converted` : t.location}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Bottom Performers Card */}
            <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">Bottom Trainers</span>
                    <p className="text-sm text-slate-600 font-normal capitalize">By {rankingMetric === 'efficiency' ? 'Revenue/Session' : rankingMetric === 'classAvg' ? 'Class Average' : rankingMetric === 'conversion' ? 'Conversion Rate' : rankingMetric}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                {bottomList.map((t: any, index: number) => (
                  <div
                    key={t.name}
                    className="group flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border hover:shadow-md transition-all duration-300 cursor-pointer hover:border-rose-200/70 min-h-[88px]"
                    onClick={() => handleRowClick(t.name, { ...t, type: 'ranking-item' })}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-red-500 shadow-lg">
                          <img 
                            src={getTrainerImage(t.name)}
                            alt={t.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const initials = t.name.split(' ').map((n: string) => n[0]).join('');
                              target.parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white text-sm font-bold">${initials}</div>`;
                            }}
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-red-500 via-rose-600 to-red-700 flex items-center justify-center shadow-md text-white text-xs font-bold border-2 border-white">
                          <span>{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors" title={t.name}>{t.name}</p>
                        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap">
                            {rankingMetric === 'conversion' ? `${formatNumber(t.totalNew || 0)} new` : `${formatNumber(t.totalSessions)} sessions`}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-green-200 text-green-700 whitespace-nowrap">
                            {rankingMetric === 'conversion' ? `${formatNumber(t.totalConverted || 0)} converted` : rankingMetric === 'fillRate' ? `${(t.fillRate ?? 0).toFixed(1)}% fill` : `Avg: ${(t.nonEmptySessions > 0 ? (t.totalCustomers / t.nonEmptySessions) : (t.totalSessions > 0 ? t.totalCustomers / t.totalSessions : 0)).toFixed(1)}`}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 whitespace-nowrap">
                            {rankingMetric === 'conversion' ? `${formatNumber(t.totalRetained || 0)} retained` : rankingMetric === 'fillRate' ? `${((t.nonEmptySessions / Math.max(t.totalSessions,1))*100).toFixed(1)}% utilization` : `${formatNumber(t.totalCustomers)} members`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                        {rankingMetric === 'revenue' ? formatRevenue(t.totalRevenue)
                          : rankingMetric === 'sessions' ? formatNumber(t.totalSessions)
                          : rankingMetric === 'customers' ? formatNumber(t.totalCustomers)
                          : rankingMetric === 'efficiency' ? formatRevenue(t.efficiency)
                          : rankingMetric === 'classAvg' ? (t.classAvg).toFixed(1)
                          : rankingMetric === 'fillRate' ? `${(t.fillRate ?? 0).toFixed(1)}%`
                          : rankingMetric === 'conversion' ? `${t.conversionRate.toFixed(1)}%`
                          : rankingMetric === 'retention' ? `${t.retentionRate.toFixed(1)}%`
                          : formatNumber(t.emptySessions)}
                      </p>
                      <p className="text-sm text-slate-500 truncate" title={t.location}>
                        {rankingMetric === 'conversion' ? `${t.totalConverted || 0}/${t.totalNew || 0} converted` : t.location}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      

      {/* Analysis Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 p-1 rounded-xl shadow-sm h-14">
          <TabsTrigger
            value="month-on-month"
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 data-[state=active]:hover:bg-gray-800"
          >
            <Calendar className="w-4 h-4" />
            Month-on-Month
          </TabsTrigger>
          <TabsTrigger
            value="year-on-year"
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 data-[state=active]:hover:bg-emerald-700"
          >
            <TrendingUp className="w-4 h-4" />
            Year-on-Year
          </TabsTrigger>
          <TabsTrigger
            value="efficiency-analysis"
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 data-[state=active]:hover:bg-orange-700"
          >
            <Target className="w-4 h-4" />
            Efficiency
          </TabsTrigger>
          <TabsTrigger
            value="performance-detail"
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 data-[state=active]:bg-purple-800 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 data-[state=active]:hover:bg-purple-900"
          >
            <Award className="w-4 h-4" />
            Performance
          </TabsTrigger>
        </TabsList>

  <TabsContent value="month-on-month" className="space-y-6">
          <div className="flex items-center gap-2 -mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50">Ignoring Month Filter</Badge>
            <button onClick={() => setFilters(prev => ({...prev, location: ''}))} className="rounded">
              <Badge variant="outline" className="text-xs text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100">Location: {filters.location || selectedLocation || 'All Locations'}</Badge>
            </button>
            <button onClick={() => setFilters(prev => ({...prev, trainer: ''}))} className="rounded">
              <Badge variant="outline" className="text-xs text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100">Trainer: {filters.trainer || 'All Trainers'}</Badge>
            </button>
          </div>
          <MonthOnMonthTrainerTable
            data={processedDataNoMonth}
            defaultMetric="totalSessions"
            onRowClick={handleRowClick}
          />
        </TabsContent>

  <TabsContent value="year-on-year" className="space-y-6">
          <div className="flex items-center gap-2 -mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50">Ignoring Month Filter</Badge>
            <button onClick={() => setFilters(prev => ({...prev, location: ''}))} className="rounded">
              <Badge variant="outline" className="text-xs text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100">Location: {filters.location || selectedLocation || 'All Locations'}</Badge>
            </button>
            <button onClick={() => setFilters(prev => ({...prev, trainer: ''}))} className="rounded">
              <Badge variant="outline" className="text-xs text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100">Trainer: {filters.trainer || 'All Trainers'}</Badge>
            </button>
          </div>
          
          <TrainerYearOnYearTable
            data={processedDataNoMonth}
            onRowClick={handleRowClick}
          />
        </TabsContent>

        <TabsContent value="efficiency-analysis" className="space-y-6">
          <TrainerEfficiencyAnalysisTable
            data={processedData}
            onRowClick={handleRowClick}
          />
        </TabsContent>

        <TabsContent value="performance-detail" className="space-y-6">
          <TrainerPerformanceDetailTable
            data={processedData}
            onRowClick={handleRowClick}
          />
        </TabsContent>
      </Tabs>

      {/* Comprehensive Trainer Drill Down */}
      {selectedTrainer && drillDownData && (
        <ComprehensiveTrainerDrillDown
          isOpen={!!drillDownData}
          onClose={closeDrillDown}
          trainerName={selectedTrainer}
          trainerData={drillDownData}
          allPayrollData={processedDataNoMonth.map(p => ({
            teacherName: p.trainerName,
            location: p.location,
            monthYear: p.monthYear,
            totalSessions: p.totalSessions,
            totalPaid: p.totalPaid,
            totalCustomers: p.totalCustomers
          })) || []}
          allSessionsData={sessionsData || []}
          filters={drillDownData.contextFilters || { location: selectedLocation, month: filters.months[0] || filters.month || '', months: filters.months }}
        />
      )}
    </div>
  );
};
