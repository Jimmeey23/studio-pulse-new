import React, { useEffect, useMemo } from 'react';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { Footer } from '@/components/ui/footer';
import { GlobalFiltersProvider } from '@/contexts/GlobalFiltersContext';
import { SessionsFiltersProvider } from '@/contexts/SessionsFiltersContext';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { useFilteredSessionsData } from '@/hooks/useFilteredSessionsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { EnhancedClassAttendanceFilterSection } from '@/components/dashboard/EnhancedClassAttendanceFilterSection';
import { EnhancedClassAttendanceMetricCards } from '@/components/dashboard/EnhancedClassAttendanceMetricCards';
import { UltimateClassAttendanceTable } from '@/components/dashboard/UltimateClassAttendanceTableNew';
import ClassDeepDive from '@/components/dashboard/ClassDeepDive';
import Rankings from '@/components/dashboard/Rankings';
import { DataScienceInsightsPanel } from '@/components/dashboard/DataScienceInsightsPanel';
import { usePayrollData } from '@/hooks/usePayrollData';
import { BarChart3, Users, MapPin, Building2, Calendar, Trophy } from 'lucide-react';
import { useState } from 'react';
import { DisplayedTablesExportButton } from '@/components/ui/DisplayedTablesExportButton';
import { getActiveConsolidatedExportPreset } from '@/utils/consolidatedExportPreset';

const locations = [{
  id: 'all',
  name: 'All Locations',
  fullName: 'All Locations'
}, {
  id: 'kwality',
  name: 'Kwality House',
  fullName: 'Kwality House, Kemps Corner'
}, {
  id: 'supreme',
  name: 'Supreme HQ',
  fullName: 'Supreme HQ, Bandra'
}, {
  id: 'kenkere',
  name: 'Kenkere House',
  fullName: 'Kenkere House'
}];

const ClassAttendance = () => {
  const { data, loading, error, refetch } = useSessionsData();
  const { data: payrollData } = usePayrollData();
  const { setLoading } = useGlobalLoading();

  useEffect(() => {
    setLoading(loading, 'Loading class attendance data...');
  }, [loading, setLoading]);



  if (loading) {
    return (
      <div className="class-attendance-unified min-h-screen bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full floating-animation stagger-1"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-3"></div>
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-full morph-shape stagger-2"></div>
        </div>
        <div className="relative z-10 container mx-auto px-6 py-10">
          <LoadingSkeleton type="full-page" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="class-attendance-unified min-h-screen bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full floating-animation stagger-1"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-3"></div>
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-full morph-shape stagger-2"></div>
        </div>
        <div className="relative z-10 container mx-auto px-6 py-10">
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl shadow-sm">
            <div className="font-semibold text-lg mb-1">Failed to load class attendance data</div>
            <div className="text-sm opacity-90 mb-4">{String(error)}</div>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inner component rendered under SessionsFiltersProvider so filtering applies
  const InnerContent: React.FC<{ rawData: any[]; payrollData: any[] }> = ({ rawData, payrollData }) => {
    const filteredData = useFilteredSessionsData(rawData || []);
    const exportPreset = useMemo(() => (typeof window !== 'undefined' ? getActiveConsolidatedExportPreset(window.location.search) : null), []);
    const [activeLocation, setActiveLocation] = useState(exportPreset?.studioId || 'kwality');
    const [activeTab, setActiveTab] = useState('overview');

    const filterByLocation = useMemo(() => {
      return (sessions: any[]) => {
        if (!sessions || activeLocation === 'all') {
          return sessions || [];
        }

        const selectedLocation = locations.find(loc => loc.id === activeLocation);
        if (!selectedLocation) {
          return sessions || [];
        }

        return sessions.filter(session => {
          if (session.location === selectedLocation.fullName) return true;

          const sessionLoc = session.location?.toLowerCase() || '';
          const targetLoc = selectedLocation.fullName.toLowerCase();

          if (sessionLoc.includes(targetLoc) || targetLoc.includes(sessionLoc)) return true;
          if (selectedLocation.id === 'kwality' && sessionLoc.includes('kwality')) return true;
          if (selectedLocation.id === 'supreme' && sessionLoc.includes('supreme')) return true;
          if (selectedLocation.id === 'kenkere' && sessionLoc.includes('kenkere')) return true;

          return false;
        });
      };
    }, [activeLocation]);

    const locationLabel = useMemo(() => {
      return locations.find((location) => location.id === activeLocation)?.name || 'All Locations';
    }, [activeLocation]);

    const exportButton = useMemo(() => (
      <DisplayedTablesExportButton
        analyticsName="Class Attendance Analytics"
        contextLabel={locationLabel}
        defaultFileName={`class-attendance-${activeLocation}`}
        buttonLabel="Export Attendance Tables"
        buttonVariant="outline"
        buttonSize="sm"
        buttonClassName="rounded-xl border border-white/30 bg-transparent text-white hover:border-white/50 hover:bg-white/10"
        tabOptions={[
          { key: 'overview', label: 'Comprehensive tab', matchers: ['overview', 'comprehensive'] },
          { key: 'monthlyTrends', label: 'Month on Month tab', matchers: ['monthlytrends', 'month on month', 'month-on-month'] },
          { key: 'rankings', label: 'Rankings tab', matchers: ['rankings'] },
        ]}
      />
    ), [activeLocation, locationLabel]);

    // Filter data by location
    const locationFilteredData = useMemo(() => {
      return filterByLocation(filteredData || []);
    }, [filterByLocation, filteredData]);

    const locationScopedRawData = useMemo(() => {
      return filterByLocation(rawData || []);
    }, [filterByLocation, rawData]);

    // Calculate hero metrics - should use locationFilteredData to match metric cards
    const metrics = useMemo(() => {
      if (!locationFilteredData || locationFilteredData.length === 0) {
        return [
          { label: 'Total Classes', value: '0' },
          { label: 'Total Attendance', value: '0' },
          { label: 'Fill Rate', value: '0%' },
        ];
      }

      const totalClasses = locationFilteredData.length;
      const totalAttendance = locationFilteredData.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const totalCapacity = locationFilteredData.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const fillRate = totalCapacity > 0 ? ((totalAttendance / totalCapacity) * 100).toFixed(1) : '0';

      return [
        { label: 'Total Classes', value: totalClasses.toLocaleString() },
        { label: 'Total Attendance', value: totalAttendance.toLocaleString() },
        { label: 'Fill Rate', value: `${fillRate}%` },
      ];
    }, [locationFilteredData]);

    return (
      <div className="class-attendance-unified min-h-screen bg-white relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full floating-animation stagger-1"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full floating-animation stagger-3"></div>
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-full morph-shape stagger-2"></div>
        </div>

        <div className="relative z-10">
          <DashboardMotionHero
            title="Class Attendance Analytics"
            subtitle="Monitor class performance, attendance patterns, capacity utilization, and trainer efficiency across all locations."
            metrics={metrics}
            extra={exportButton}
          />

          <div className="bg-white text-slate-800 slide-in-from-left">
            <div className="container mx-auto px-6 space-y-6">
          {/* Location Tabs - matching Sales style */}
          <StudioLocationTabs 
            activeLocation={activeLocation}
            onLocationChange={setActiveLocation}
            showInfoPopover={true}
            infoPopoverContext="class-attendance-overview"
          />

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Filter Section */}
            <div className="w-full space-y-4">
              <EnhancedClassAttendanceFilterSection data={rawData || []} />
            </div>

            {/* Metric Cards */}
            <div>
              <EnhancedClassAttendanceMetricCards data={locationFilteredData} comparisonData={locationScopedRawData} />
            </div>

            <DataScienceInsightsPanel
              title="Class Attendance Analytics Toolkit"
              description="Use anomaly detection and distribution diagnostics to spot unusual session behavior before it impacts operations."
              data={locationFilteredData}
              initiallyCollapsed={true}
              metricOptions={[
                {
                  key: 'checkedInCount',
                  label: 'Checked-in Members',
                  accessor: (row: any) => Number(row?.checkedInCount || 0),
                },
                {
                  key: 'capacity',
                  label: 'Class Capacity',
                  accessor: (row: any) => Number(row?.capacity || 0),
                },
                {
                  key: 'fillRate',
                  label: 'Fill Rate %',
                  accessor: (row: any) => {
                    const capacity = Number(row?.capacity || 0);
                    const checkedIn = Number(row?.checkedInCount || 0);
                    return capacity > 0 ? (checkedIn / capacity) * 100 : 0;
                  },
                },
                {
                  key: 'lateCancellations',
                  label: 'Late Cancellations',
                  accessor: (row: any) => Number(row?.lateCancelledCount || row?.lateCancellations || 0),
                },
              ]}
              dateAccessor={(row: any) => {
                const raw =
                  row?.classDate ||
                  row?.sessionDate ||
                  row?.startDate ||
                  row?.startTime ||
                  row?.date;
                if (!raw) return null;
                const parsed = new Date(raw);
                return Number.isNaN(parsed.getTime()) ? null : parsed;
              }}
            />

            {/* Analysis Tabs - matching Sales style exactly */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-white/95 backdrop-blur-sm p-1.5 rounded-2xl shadow-2xl border-2 border-slate-200 flex w-full max-w-7xl mx-auto overflow-visible relative">
                <TabsTrigger value="overview" className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:via-blue-700 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1">
                  <BarChart3 className="w-4 h-4" />
                  <span className="whitespace-nowrap">Comprehensive</span>
                </TabsTrigger>
                <TabsTrigger value="monthlyTrends" className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:via-emerald-700 data-[state=active]:to-emerald-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1">
                  <Calendar className="w-4 h-4" />
                  <span className="whitespace-nowrap">Month on Month</span>
                </TabsTrigger>
                <TabsTrigger value="rankings" className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:via-purple-700 data-[state=active]:to-purple-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1">
                  <Trophy className="w-4 h-4" />
                  <span className="whitespace-nowrap">Rankings</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Comprehensive Analysis</h2>
                  </div>
                  <UltimateClassAttendanceTable data={locationFilteredData} location={activeLocation} />
                </div>
              </TabsContent>

              <TabsContent value="monthlyTrends" className="mt-8">
                <ClassDeepDive data={locationFilteredData} />
              </TabsContent>

              <TabsContent value="rankings" className="mt-8">
                <Rankings data={locationFilteredData} />
              </TabsContent>
            </Tabs>
          </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  };

  return (
    <SessionsFiltersProvider>
      <InnerContent rawData={data || []} payrollData={payrollData || []} />
    </SessionsFiltersProvider>
  );
};

export default ClassAttendance;
