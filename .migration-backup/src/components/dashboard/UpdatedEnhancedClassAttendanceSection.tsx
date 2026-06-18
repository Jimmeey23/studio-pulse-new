import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useFilteredSessionsData } from '@/hooks/useFilteredSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { InfoPopover } from '@/components/ui/InfoSidebar';
import { BarChart3, Calendar, Trophy, TrendingUp, Activity, Star, DollarSign, Users, Target, LayoutDashboard } from 'lucide-react';

import { ModernMetricCards } from './ModernMetricCards';
import { EnhancedClassAttendanceFilterSection } from './EnhancedClassAttendanceFilterSection';
import { AdvancedClassAttendanceTable } from './ModernAdvancedClassAttendanceTable';
import { MonthOnMonthClassTable } from './MonthOnMonthClassTable';
import { DualRankingLists } from './DualRankingLists';
import { InteractivePerformanceAnalytics } from './InteractivePerformanceAnalytics';
import { DrillDownAnalyticsModal } from './DrillDownAnalyticsModal';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';
import { ClassFormatAnalytics } from './ClassFormatAnalytics';
import { FormatFocusedAnalytics } from './FormatFocusedAnalytics';
import { MainDashboard, ClassDeepDive } from '@/components/classIntelligence';
import RankingsAdvanced from '@/components/classIntelligence/RankingsAdvanced';
import type { SessionData as CISession } from '@/components/classIntelligence/types';

export const UpdatedEnhancedClassAttendanceSection: React.FC = () => {
  const { data: sessionsData, loading } = useSessionsData();
  const filteredData = useFilteredSessionsData(sessionsData || []);
  const { data: payrollData } = usePayrollData();
  
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('kwality');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Set up the dashboard store with filtered data
  React.useEffect(() => {
    if (filteredData) {
      // Transform data to match the GitHub repo's expected format
      const transformedData = filteredData.map((s: any) => ({
        SessionID: s.sessionId || s.uniqueId || s.uniqueId1 || s.uniqueId2,
        Class: s.cleanedClass || s.sessionName,
        Trainer: s.trainerName,
        Day: s.dayOfWeek,
        Time: s.time,
        Date: s.date,
        Location: s.location,
        CheckedIn: s.checkedInCount,
        Capacity: s.capacity,
        Revenue: s.totalPaid ?? s.revenue,
        Booked: s.bookedCount || s.checkedInCount || 0,
        LateCancelled: s.lateCancelledCount || 0,
        NoShow: s.noShowCount || 0,
        Waitlisted: s.waitlistedCount || 0
      }));
      
      // Set the store data for ClassDeepDive to use
      import('@/components/classIntelligence/store/dashboardStore').then(({ useDashboardStore }) => {
        useDashboardStore.getState().setFilteredData(transformedData);
      });
    }
  }, [filteredData]);

  const handleDrillDown = (data: any) => {
    setDrillDownData(data);
    setIsDrillDownOpen(true);
  };

  const closeDrillDown = () => {
    setIsDrillDownOpen(false);
    setDrillDownData(null);
  };

  if (loading) {
    return null; // Global loader will handle this
  }

  // Normalize session data for Class Intelligence components
  const ciSessions: CISession[] = (filteredData || []).map((s: any) => ({
    SessionID: s.sessionId || s.uniqueId || s.uniqueId1 || s.uniqueId2 || '',
    Class: s.cleanedClass || s.sessionName || '',
    Trainer: s.trainerName || '',
    Day: s.dayOfWeek || '',
    Time: s.time || '',
    Date: s.date || '',
    Location: s.location || '',
    CheckedIn: s.checkedInCount || 0,
    Capacity: s.capacity || 0,
    Revenue: s.totalPaid || s.revenue || 0,
    Booked: s.bookedCount || s.checkedInCount || 0,
    LateCancelled: s.lateCancelledCount || 0,
    NoShow: s.noShowCount || 0,
    Waitlisted: s.waitlistedCount || 0
  }));

  return (
    <div className="space-y-8">
      {/* Location Filter Tabs */}
      <StudioLocationTabs 
        activeLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        showInfoPopover={true}
        infoPopoverContext="class-attendance-overview"
      />
      
      <>
        {/* Enhanced Metric Cards */}
        <div className="space-y-6">
          {filteredData && filteredData.length > 0 ? (
            <ModernMetricCards 
              data={filteredData}
              payrollData={payrollData}
              onMetricClick={handleDrillDown}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(() => {
                const totalRevenue = filteredData?.reduce((sum, s) => sum + (s.totalPaid || 0), 0) || 0;
                const totalSessions = filteredData?.length || 0;
                const totalAttendance = filteredData?.reduce((sum, s) => sum + (s.checkedInCount || 0), 0) || 0;
                const totalCapacity = filteredData?.reduce((sum, s) => sum + (s.capacity || 0), 0) || 0;
                const fillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity * 100) : 0;
                
                return (
                  <>
                    <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm opacity-90">Total Revenue</p>
                            <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                          </div>
                          <DollarSign className="h-8 w-8 opacity-80" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm opacity-90">Total Sessions</p>
                            <p className="text-2xl font-bold">{totalSessions}</p>
                          </div>
                          <Calendar className="h-8 w-8 opacity-80" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm opacity-90">Total Attendance</p>
                            <p className="text-2xl font-bold">{totalAttendance}</p>
                          </div>
                          <Users className="h-8 w-8 opacity-80" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm opacity-90">Fill Rate</p>
                            <p className="text-2xl font-bold">{fillRate.toFixed(1)}%</p>
                          </div>
                          <Target className="h-8 w-8 opacity-80" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Filter Section - hidden on Analytics tab to avoid duplicate filters */}
        {activeTab !== 'analytics' && (
          <EnhancedClassAttendanceFilterSection data={filteredData} />
        )}

        {/* Main Analytics Tabs - Restructured like Sales Tab */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/95 backdrop-blur-sm p-1.5 rounded-2xl shadow-2xl border-2 border-slate-200 flex w-full max-w-7xl mx-auto overflow-visible relative">
            <TabsTrigger 
              value="dashboard" 
              className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-800 data-[state=active]:via-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="whitespace-nowrap">Main Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="rankings"
              className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-800 data-[state=active]:via-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1"
            >
              <Trophy className="w-4 h-4" />
              <span className="whitespace-nowrap">Rankings</span>
            </TabsTrigger>
            <TabsTrigger 
              value="performance"
              className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-800 data-[state=active]:via-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="whitespace-nowrap">Performance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-800 data-[state=active]:via-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1"
            >
              <Activity className="w-4 h-4" />
              <span className="whitespace-nowrap">Analytics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="deepdive"
              className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-800 data-[state=active]:via-slate-900 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1"
            >
              <Star className="w-4 h-4" />
              <span className="whitespace-nowrap">Deep Dive</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Main Dashboard</h2>
              </div>
              <MainDashboard sessions={ciSessions} />
            </div>
          </TabsContent>

          <TabsContent value="rankings" className="mt-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Performance Rankings</h2>
              </div>
              <div className="bg-white/90 glass-card rounded-3xl p-6 border border-white/20 shadow-xl backdrop-blur-xl">
                <RankingsAdvanced sessions={ciSessions} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comprehensive" className="mt-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Comprehensive Class Analysis</h2>
              </div>
              <AdvancedClassAttendanceTable 
                data={filteredData}
                location={selectedLocation === 'all' ? 'All Locations' : selectedLocation}
                onDrillDown={handleDrillDown}
              />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
              </div>
              <InteractivePerformanceAnalytics 
                data={filteredData}
                onDrillDown={handleDrillDown}
              />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Format Analytics</h2>
              </div>
              <FormatFocusedAnalytics data={filteredData} />
            </div>
          </TabsContent>

          <TabsContent value="deepdive" className="mt-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Class Deep Dive</h2>
              </div>
              <ClassDeepDive />
            </div>
          </TabsContent>
        </Tabs>
      </>

      {/* Drill-Down Modal */}
      <DrillDownAnalyticsModal
        isOpen={isDrillDownOpen}
        onClose={closeDrillDown}
        data={drillDownData || { title: '', sessions: [] }}
      />
    </div>
  );
};