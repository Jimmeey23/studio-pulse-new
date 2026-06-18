import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { Footer } from '@/components/ui/footer';
import { DisplayedTablesExportButton } from '@/components/ui/DisplayedTablesExportButton';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { SessionsFiltersProvider } from '@/contexts/SessionsFiltersContext';
import { SessionsFilterSection } from '@/components/dashboard/SessionsFilterSection';
import { useFilteredSessionsData } from '@/hooks/useFilteredSessionsData';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import OverviewMetricsCard from '@/components/dashboard/OverviewMetricsCard';
import ClassFormatRankings from '@/components/dashboard/ClassFormatRankings';
import DetailedComparisonView from '@/components/dashboard/DetailedComparisonView';
import EnhancedComparisonTool from '@/components/dashboard/EnhancedComparisonTool';
import ClassFormatsMoMTable from '@/components/dashboard/ClassFormatsMoMTable';
import ClassFormatsYoYTable from '@/components/dashboard/ClassFormatsYoYTable';
import type { SessionData } from '@/hooks/useSessionsData';
import { useSessionsFilters } from '@/contexts/SessionsFiltersContext';
import { ModernDrillDownModal } from '@/components/dashboard/ModernDrillDownModal';
import { InfoPopover } from '@/components/ui/InfoSidebar';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { getActiveConsolidatedExportPreset } from '@/utils/consolidatedExportPreset';


const locations = [
  { id: 'all', name: 'All Locations, ', fullName: 'All Locations' },
  { id: 'kwality', name: 'Kwality House, Kemps Corner', fullName: 'Kwality House, Kemps Corner' },
  { id: 'supreme', name: 'Supreme HQ, Bandra', fullName: 'Supreme HQ, Bandra' },
  { id: 'kenkere', name: 'Kenkere House, Bengaluru', fullName: 'Kenkere House' },
  { id: 'popup', name: 'Pop-up', fullName: 'Pop-up' }
];

const ClassFormatsComparison: React.FC = () => {
  const { data, loading } = useSessionsData();
  const { allCheckins, loading: checkinsLoading } = useLateCancellationsData();
  const { setLoading } = useGlobalLoading();
  const exportPreset = useMemo(() => (typeof window !== 'undefined' ? getActiveConsolidatedExportPreset(window.location.search) : null), []);
  const [activeLocation, setActiveLocation] = useState(exportPreset?.studioId || 'kwality');
  const [drill, setDrill] = useState<any | null>(null);

  useEffect(() => {
    setLoading(loading || checkinsLoading, 'Loading class format comparison data...');
  }, [loading, checkinsLoading, setLoading, data, allCheckins]);

  // NOTE: We must read filters within the provider. We'll render an inner component below.
  // Global drilldown event bridge
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      setDrill((prev: any) => ({ type: 'class', ...detail }));
    };
    window.addEventListener('open-drilldown', handler as any);
    return () => window.removeEventListener('open-drilldown', handler as any);
  }, []);

  // Inner section that can read filters from context (lives under provider)
  const FormatTrendsSection: React.FC<{ sessions: SessionData[]; checkins: any[]; activeLocation: string }>
    = ({ sessions, checkins, activeLocation }) => {
    const { filters } = useSessionsFilters();
    const filteredSessionsByFilters = useFilteredSessionsData(sessions || []);
    const filteredSessionsByLocation = React.useMemo(() => {
      if (activeLocation === 'all') return filteredSessionsByFilters;
      return filteredSessionsByFilters.filter(s => {
        const sl = String(s.location || '').toLowerCase();
        if (activeLocation === 'kwality') return sl.includes('kwality');
        if (activeLocation === 'supreme') return sl.includes('supreme');
        if (activeLocation === 'kenkere') return sl.includes('kenkere');
        if (activeLocation === 'popup') return sl.includes('pop') || sl.includes('popup') || sl.includes('pop-up');
        return true;
      });
    }, [filteredSessionsByFilters, activeLocation]);
    const filteredCheckinsByLocation = React.useMemo(() => {
      const rows = Array.isArray(checkins) ? checkins : [];
      const passesFilters = (row: any) => {
        const name = String(row.sessionName || '').toLowerCase();
        if (name.includes('test') || name.includes('demo')) return false;
        if (!filters) return true;
        if (filters.trainers.length > 0 && !filters.trainers.includes(row.teacherName)) return false;
        if (filters.classTypes.length > 0 && !filters.classTypes.includes(row.cleanedClass)) return false;
        if (filters.dayOfWeek.length > 0 && !filters.dayOfWeek.includes(row.dayOfWeek)) return false;
        if (filters.timeSlots.length > 0 && !filters.timeSlots.includes(row.time)) return false;
        // Intentionally ignore dateRange for MoM/YoY tables per request
        return true;
      };
      const byLoc = rows.filter(r => {
        if (!passesFilters(r)) return false;
        if (activeLocation === 'all') return true;
        const rl = String(r.location || '').toLowerCase();
        if (activeLocation === 'kwality') return rl.includes('kwality');
        if (activeLocation === 'supreme') return rl.includes('supreme');
        if (activeLocation === 'kenkere') return rl.includes('kenkere');
        if (activeLocation === 'popup') return rl.includes('pop') || rl.includes('popup') || rl.includes('pop-up');
        return true;
      });
      return byLoc;
    }, [checkins, filters, activeLocation]);

    return (
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="bg-white/90 backdrop-blur-sm p-1 rounded-2xl shadow-xl border border-slate-200 grid w-full grid-cols-3 h-auto max-w-2xl mx-auto mb-8">
          <TabsTrigger value="summary" className="flex-1 text-center py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r">
            Summary Tables
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1 text-center py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r">
            Monthly Trends
          </TabsTrigger>
          <TabsTrigger value="yearly" className="flex-1 text-center py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r">
            Yearly Trends
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClassFormatsMoMTable 
              sessions={filteredSessionsByLocation as any} 
              checkins={filteredCheckinsByLocation}
              onDrillDown={(data) => {
                window.dispatchEvent(new CustomEvent('open-drilldown', {
                  detail: { type: 'format-trend', ...data }
                }));
              }}
            />
            <ClassFormatsYoYTable 
              sessions={filteredSessionsByLocation as any} 
              checkins={filteredCheckinsByLocation}
              onDrillDown={(data) => {
                window.dispatchEvent(new CustomEvent('open-drilldown', {
                  detail: { type: 'format-trend', ...data }
                }));
              }}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="monthly" className="space-y-6">
          <ClassFormatsMoMDetails sessions={filteredSessionsByLocation as any} />
        </TabsContent>
        
        <TabsContent value="yearly" className="space-y-6">
          <ClassFormatsYoYDetails sessions={filteredSessionsByLocation as any} />
        </TabsContent>
      </Tabs>
    );
  };

  // Inner body rendered under SessionsFiltersProvider so filtering applies globally within page
  const ClassFormatsBody: React.FC<{ sessions: SessionData[]; allCheckins: any[] }>
    = ({ sessions, allCheckins }) => {
    const { filters } = useSessionsFilters();
    const filteredAll = useFilteredSessionsData(sessions || []);
    
    React.useEffect(() => {
      if (sessions && sessions.length > 0) {
        const uniqueClasses = new Set(sessions.map(s => s?.cleanedClass || s?.classType));

      }
    }, [sessions, filteredAll, allCheckins, activeLocation, filters]);
    
    // Filter checkins globally with SessionsFilters
    const filteredAllCheckins = useMemo(() => {
      return (allCheckins || []).filter((c: any) => {
        if (!filters) return true;
        if (filters.trainers.length > 0 && !filters.trainers.includes(c.teacherName)) return false;
        if (filters.classTypes.length > 0 && !filters.classTypes.includes(c.cleanedClass)) return false;
        if (filters.dayOfWeek.length > 0 && !filters.dayOfWeek.includes(c.dayOfWeek)) return false;
        if (filters.timeSlots.length > 0 && !filters.timeSlots.includes(c.time)) return false;
        return true;
      });
    }, [allCheckins, filters]);
    
    const filteredByLocation = useMemo(() => {
      if (activeLocation === 'all') return filteredAll;
      const loc = locations.find(l => l.id === activeLocation);
      if (!loc) return filteredAll;
      return filteredAll.filter(s => {
        const sl = (s.location || '').toLowerCase();
        if (activeLocation === 'kwality') return sl.includes('kwality');
        if (activeLocation === 'supreme') return sl.includes('supreme');
        if (activeLocation === 'kenkere') return sl.includes('kenkere');
        if (activeLocation === 'popup') return sl.includes('pop') || sl.includes('popup') || sl.includes('pop-up');
        return s.location === loc.fullName;
      });
    }, [filteredAll, activeLocation]);

    const heroTotals = useMemo(() => {
      // Use FILTERED data (includes global filters AND location filters)
      const baseData = filteredByLocation;
      
      const sessionsCount = baseData.length;
      const capacity = baseData.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const checkIns = baseData.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const revenue = baseData.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const fill = capacity > 0 ? (checkIns / capacity) * 100 : 0;
      return { sessions: sessionsCount, revenue, fill };
    }, [filteredByLocation]);

    const exportButton = (
      <DisplayedTablesExportButton
        analyticsName="Class Formats Analytics"
        contextLabel={locations.find((location) => location.id === activeLocation)?.name || 'All Locations'}
        defaultFileName={`class-formats-${activeLocation}`}
        buttonLabel="Export Format Tables"
        buttonVariant="ghost"
        buttonSize="sm"
        buttonClassName="rounded-xl border border-white/30 text-white hover:border-white/50"
        tabOptions={[
          { key: 'overview', label: 'Overview tab', matchers: ['overview'] },
          { key: 'rankings', label: 'Rankings tab', matchers: ['rankings'] },
          { key: 'detailed', label: 'Detailed tab', matchers: ['detailed'] },
          { key: 'compare', label: 'Compare tab', matchers: ['compare'] },
          { key: 'trends', label: 'Trends tab', matchers: ['trends'] },
        ]}
      />
    );

    // Build drilldown payload data based on current state
    const buildDrillData = useMemo(() => {
      if (!drill) return null;
      const scope = drill.scope as string | undefined;
      const row = drill.row || {};
      const groupBy = drill.groupBy as string | undefined;
      const item = drill.item;

      // Get the correctly filtered data that matches what components are using
      const currentLocationFilteredData = activeLocation === 'all' ? filteredAll : filteredAll.filter(s => {
        const sl = (s.location || '').toLowerCase();
        if (activeLocation === 'kwality') return sl.includes('kwality');
        if (activeLocation === 'supreme') return sl.includes('supreme');
        if (activeLocation === 'kenkere') return sl.includes('kenkere');
        return false;
      });

      // For format-trend type drill-downs (from MoM/YoY tables)
      if (drill.type === 'format-trend') {
        const format = drill.format;
        const month = drill.month;
        const year = drill.year;
        const metric = drill.metric;
        
        // Filter sessions based on format and time period
        const sessionsFiltered = currentLocationFilteredData.filter(s => {
          const matchesFormat = format === 'PowerCycle' ? 
            (s.classType === 'PowerCycle' || s.cleanedClass === 'PowerCycle') :
            format === 'Barre' ? 
            (s.classType === 'Barre' || s.cleanedClass === 'Barre') :
            format === 'Strength' ?
            (s.classType === 'Strength' || s.cleanedClass === 'Strength') :
            true;
            
          // Add time period filtering if month/year provided
          let matchesTime = true;
          if (month || year) {
            const sessionDate = new Date(s.date);
            if (month && sessionDate.getMonth() + 1 !== parseInt(month.split('-')[1])) {
              matchesTime = false;
            }
            if (year && sessionDate.getFullYear() !== parseInt(year)) {
              matchesTime = false;
            }
          }
          
          return matchesFormat && matchesTime;
        });

        return { 
          scope: 'format-trend', 
          format, 
          month, 
          year, 
          metric, 
          sessionsFiltered,
          totalSessions: sessionsFiltered.length,
          totalRevenue: sessionsFiltered.reduce((sum, s) => sum + (s.totalPaid || s.revenue || 0), 0),
          totalCheckins: sessionsFiltered.reduce((sum, s) => sum + (s.checkedInCount || 0), 0)
        };
      }

      // For format-summary type drill-downs (from summary cards)
      if (drill.type === 'format-summary') {
        const format = drill.format;
        const sessionsFiltered = currentLocationFilteredData.filter(s => {
          const matchesFormat = format === 'PowerCycle' ? 
            (s.classType === 'PowerCycle' || s.cleanedClass === 'PowerCycle') :
            format === 'Barre' ? 
            (s.classType === 'Barre' || s.cleanedClass === 'Barre') :
            format === 'Strength' ?
            (s.classType === 'Strength' || s.cleanedClass === 'Strength') :
            true;
          return matchesFormat;
        });

        return { 
          scope: 'format-summary', 
          format, 
          sessionsFiltered,
          totalSessions: sessionsFiltered.length,
          totalRevenue: sessionsFiltered.reduce((sum, s) => sum + (s.revenue || 0), 0),
          totalCheckins: sessionsFiltered.reduce((sum, s) => sum + (s.checkedInCount || 0), 0)
        };
      }

      // Focused handling for Detailed Format Analytics (payroll-driven)
      if (scope === 'detailed-format') {
        const trainerName = item?.trainer?.teacherName as string | undefined;
        const rawType = String(item?.type || ''); // e.g., powercycle-trainer
        const formatKey = rawType.split('-')[0];
        const map: Record<string, string> = { powercycle: 'PowerCycle', barre: 'Barre', strength: 'Strength' };
        const targetClassType = map[formatKey];

        const sessionsFiltered = currentLocationFilteredData.filter(s => {
          const trainerOk = trainerName ? (s.trainerName === trainerName) : true;
          const classOk = targetClassType ? (s.cleanedClass === targetClassType || s.classType === targetClassType) : true;
          return trainerOk && classOk;
        });

        const checkinsFiltered = filteredAllCheckins.filter((c: any) => {
          const loc = String(c.location || '').toLowerCase();
          if (activeLocation === 'kwality' && !loc.includes('kwality')) return false;
          if (activeLocation === 'supreme' && !loc.includes('supreme')) return false;
          if (activeLocation === 'kenkere' && !loc.includes('kenkere')) return false;
          if (activeLocation === 'popup' && !loc.includes('pop') && !loc.includes('popup') && !loc.includes('pop-up')) return false;
          const cls = c.cleanedClass || c['Cleaned Class'];
          const t = c.teacherName || c['Teacher Name'];
          const trainerOk = trainerName ? (t === trainerName) : true;
          const classOk = targetClassType ? (cls === targetClassType) : true;
          return trainerOk && classOk;
        });

        return { scope, trainerName, targetClassType, sessionsFiltered, checkinsFiltered, payrollItem: item };
      }

      // Filter sessions by group and row context
      const sessionsFiltered = currentLocationFilteredData.filter(s => {
        const matchesGroup = groupBy === 'uniqueId1' ? (s.uniqueId1 === row.group)
          : groupBy === 'uniqueId2' ? (s.uniqueId2 === row.group)
          : groupBy === 'classType' ? (s.classType === row.group || s.cleanedClass === row.group)
          : (row.group === undefined || s.classType === row.group || s.cleanedClass === row.group);
        const matchesRow = (
          (!row.day || s.dayOfWeek === row.day) &&
          (!row.time || s.time === row.time) &&
          (!row.cls || s.cleanedClass === row.cls || s.classType === row.cls) &&
          (!row.trainer || s.trainerName === row.trainer)
        );
        return matchesGroup && matchesRow;
      });

      // Filter checkins similarly (respect active location) when needed
      const checkinsFiltered = filteredAllCheckins.filter((c: any) => {
        const loc = String(c.location || '').toLowerCase();
        if (activeLocation === 'kwality' && !loc.includes('kwality')) return false;
        if (activeLocation === 'supreme' && !loc.includes('supreme')) return false;
        if (activeLocation === 'kenkere' && !loc.includes('kenkere')) return false;
        if (activeLocation === 'popup' && !loc.includes('pop') && !loc.includes('popup') && !loc.includes('pop-up')) return false;
        // match class and trainer broadly
        const cls = c.cleanedClass || c['Cleaned Class'];
        const t = c.teacherName || c['Teacher Name'];
        const day = c.dayOfWeek || c['Day of Week'];
        const time = c.time || c['Time'];
        const groupMatch = groupBy === 'uniqueId1' ? sessionsFiltered.some(s => s.uniqueId1 === (drill?.row?.group))
          : groupBy === 'uniqueId2' ? sessionsFiltered.some(s => s.uniqueId2 === (drill?.row?.group))
          : sessionsFiltered.length > 0;
        const rowMatch = (!row.cls || (cls === row.cls)) && (!row.trainer || (t === row.trainer)) && (!row.day || (day === row.day)) && (!row.time || (time === row.time));
        return groupMatch && rowMatch;
      });

      return { scope, row, groupBy, sessionsFiltered, checkinsFiltered };
    }, [drill, filteredAll, filteredAllCheckins, activeLocation]);

    return (
      <>
        <DashboardMotionHero 
          title="Class Formats & Performance Analysis"
          subtitle="Comprehensive PowerCycle vs Barre vs Strength comparison with performance metrics and analytics"
          metrics={[
            { label: 'Total Sessions', value: heroTotals.sessions.toLocaleString() },
            { label: 'Avg Fill', value: `${heroTotals.fill.toFixed(1)}%` },
            { label: 'Total Revenue', value: formatNumber(heroTotals.revenue) },
          ]}
          extra={exportButton}
        />

        <div className="container mx-auto px-6 py-10">
          {/* Location Tabs - Above Filters Section */}
          <div className="mb-8">
            <StudioLocationTabs 
              activeLocation={activeLocation}
              onLocationChange={setActiveLocation}
              showInfoPopover={true}
              infoPopoverContext="class-formats-overview"
            />
          </div>

          {/* Filters Section - Below Location Tabs and Collapsed by Default */}
          <div className="mb-8">
            <SessionsFilterSection data={sessions} defaultCollapsed={true} />
          </div>

          {/* Location Tab Content */}
          <div className="space-y-8">{locations.map(location => {
            // Calculate filtered data specific to THIS location tab
            const locationFilteredData = location.id === 'all' ? filteredAll : filteredAll.filter(s => {
              const sl = (s.location || '').toLowerCase();
              if (location.id === 'kwality') return sl.includes('kwality');
              if (location.id === 'supreme') return sl.includes('supreme');
              if (location.id === 'kenkere') return sl.includes('kenkere');
              if (location.id === 'popup') return sl.includes('pop') || sl.includes('popup') || sl.includes('pop-up');
              return false;
            });

            // Filter checkins data to match the location (SessionsFilters already applied globally)
            const locationFilteredCheckins = location.id === 'all' ? filteredAllCheckins : filteredAllCheckins.filter((c: any) => {
              const loc = String(c.location || '').toLowerCase();
              if (location.id === 'kwality') return loc.includes('kwality');
              if (location.id === 'supreme') return loc.includes('supreme');
              if (location.id === 'kenkere') return loc.includes('kenkere');
              if (location.id === 'popup') return loc.includes('pop') || loc.includes('popup') || loc.includes('pop-up');
              return false;
            });

            if (activeLocation === location.id) {


            }

            return (
            <div key={location.id} style={{ display: activeLocation === location.id ? 'block' : 'none' }}>
              {/* Rebuilt Sub-tabs: Overview | Rankings | Detailed | Compare | Trends */}
              <Tabs defaultValue="overview" className="w-full">
                <div className="flex justify-center mb-6">
                  <TabsList className="bg-white/90 backdrop-blur-sm p-1 rounded-2xl shadow-xl border border-slate-200 grid grid-cols-5 gap-0 w-full max-w-5xl relative z-20">
                    <TabsTrigger value="overview" className="flex-1 text-center py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:z-30 relative">Overview</TabsTrigger>
                    <TabsTrigger value="rankings" className="flex-1 text-center py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:z-30 relative">Rankings</TabsTrigger>
                    <TabsTrigger value="detailed" className="flex-1 text-center py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:z-30 relative">Detailed</TabsTrigger>
                    <TabsTrigger value="compare" className="flex-1 text-center py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:z-30 relative">Compare</TabsTrigger>
                    <TabsTrigger value="trends" className="flex-1 text-center py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:z-30 relative">Trends</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-6 mt-4">
                  {locationFilteredData && locationFilteredData.length > 0 ? (
                    <OverviewMetricsCard data={locationFilteredData as any} />
                  ) : (
                    <div className="text-center py-8 text-slate-500">No data available for this location</div>
                  )}
                </TabsContent>

                <TabsContent value="rankings" className="space-y-6 mt-4">
                  {locationFilteredData && locationFilteredData.length > 0 ? (
                    <ClassFormatRankings data={locationFilteredData as any} />
                  ) : (
                    <div className="text-center py-8 text-slate-500">No data available for this location</div>
                  )}
                </TabsContent>

                <TabsContent value="detailed" className="space-y-6 mt-4">
                  {locationFilteredData && locationFilteredData.length > 0 ? (
                    <DetailedComparisonView data={locationFilteredData as any} />
                  ) : (
                    <div className="text-center py-8 text-slate-500">No data available for this location</div>
                  )}
                </TabsContent>

                <TabsContent value="compare" className="space-y-6 mt-4">
                  {locationFilteredData && locationFilteredData.length > 0 ? (
                    <EnhancedComparisonTool data={locationFilteredData as any} />
                  ) : (
                    <div className="text-center py-8 text-slate-500">No data available for this location</div>
                  )}
                </TabsContent>

                <TabsContent value="trends" className="space-y-6 mt-4">
                  {locationFilteredData && locationFilteredData.length > 0 ? (
                    <>
                      <div className="bg-gradient-to-r from-blue-50 to-slate-100 rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Month-over-Month Performance Trends</h3>
                        <p className="text-sm text-slate-600">Historical class format performance comparison across all months</p>
                      </div>
                      <ClassFormatsMoMTable sessions={locationFilteredData as any} checkins={locationFilteredCheckins} />
                    </>
                  ) : (
                    <div className="text-center py-8 text-slate-500">No data available</div>
                  )}
                </TabsContent>
              </Tabs>
              </div>
            );
          })}</div>
        </div>
        {drill && (
          <ModernDrillDownModal
            isOpen={!!drill}
            onClose={() => setDrill(null)}
            data={buildDrillData || drill}
            type="class"
          />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/40 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-400/15 to-blue-400/15 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      
      <div className="relative z-10">
      <SessionsFiltersProvider>
        <ClassFormatsBody sessions={data || []} allCheckins={allCheckins || []} />
      </SessionsFiltersProvider>
      <Footer />
      </div>
    </div>
  );
};

export default ClassFormatsComparison;
