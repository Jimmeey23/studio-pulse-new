import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, BarChart3, Users, Target, Filter, MapPin, Building2, Star, TrendingUp, Calendar, Activity, Trophy } from 'lucide-react';
import { useSessionsData, SessionData } from '@/hooks/useSessionsData';
import { useFilteredSessionsData } from '@/hooks/useFilteredSessionsData';
import { EnhancedClassAttendanceFilterSection } from './EnhancedClassAttendanceFilterSection';
import { SuperEnhancedMetricCards } from './SuperEnhancedMetricCards';
import { SuperInteractiveCharts } from './SuperInteractiveCharts';
import { UltimateClassAttendanceTable } from './UltimateClassAttendanceTable';
import { MonthOnMonthClassTable } from './MonthOnMonthClassTable';
import { DualRankingLists } from './DualRankingLists';
import { EnhancedPayrollTable } from './EnhancedPayrollTable';
import { HostedClassesAnalytics } from './HostedClassesAnalytics';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useNavigate } from 'react-router-dom';
import { InfoPopover } from '@/components/ui/InfoSidebar';

const locations = [{
  id: 'all',
  name: 'All Locations',
  fullName: 'All Locations'
}, {
  id: 'Kwality House, Kemps Corner',
  name: 'Kwality House',
  fullName: 'Kwality House, Kemps Corner'
}, {
  id: 'Supreme HQ, Bandra',
  name: 'Supreme HQ',
  fullName: 'Supreme HQ, Bandra'
}, {
  id: 'Kenkere House',
  name: 'Kenkere House',
  fullName: 'Kenkere House'
}];

export const EnhancedClassAttendanceSection: React.FC = () => {
  const navigate = useNavigate();
  const { data: sessionsData, loading, error, refetch } = useSessionsData();
  const { data: payrollData, isLoading: payrollLoading } = usePayrollData();
  const [activeLocation, setActiveLocation] = useState('Kwality House, Kemps Corner');

  // Apply filters to the data
  const filteredData = useFilteredSessionsData(sessionsData || []);

  // Filter data by location
  const locationFilteredData = useMemo(() => {
    if (!filteredData || activeLocation === 'all') return filteredData || [];
    
    const selectedLocation = locations.find(loc => loc.id === activeLocation);
    if (!selectedLocation) return filteredData || [];

    return filteredData.filter(session => {
      if (session.location === selectedLocation.fullName) return true;
      
      const sessionLoc = session.location?.toLowerCase() || '';
      const targetLoc = selectedLocation.fullName.toLowerCase();
      
      if (selectedLocation.id === 'Kwality House, Kemps Corner' && sessionLoc.includes('kwality')) return true;
      if (selectedLocation.id === 'Supreme HQ, Bandra' && sessionLoc.includes('supreme')) return true;
      if (selectedLocation.id === 'Kenkere House' && sessionLoc.includes('kenkere')) return true;
      
      return false;
    });
  }, [filteredData, activeLocation]);

  // Remove individual loader - parent component handles loading via global loader

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600 mb-4">Error loading data: {error}</p>
          <Button onClick={refetch} variant="outline">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!sessionsData || sessionsData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600">No class attendance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Filter Section */}
      <EnhancedClassAttendanceFilterSection data={sessionsData || []} />

      {/* Location Tabs */}
      <Tabs value={activeLocation} onValueChange={setActiveLocation} className="w-full">
        <div className="flex justify-center items-start mb-8">
          <TabsList className="glass-morphism p-2 rounded-2xl shadow-lg border-0 grid grid-cols-4 w-full max-w-4xl">
            {locations.map(location => (
              <TabsTrigger 
                key={location.id} 
                value={location.id} 
                className="tab-modern"
              >
                <div className="flex items-center gap-2">
                  {location.id === 'all' ? <Building2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  <div className="text-center">
                    <div className="font-bold">{location.name.split(',')[0]}</div>
                    {location.name.includes(',') && <div className="text-xs opacity-75">{location.name.split(',')[1]?.trim()}</div>}
                  </div>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="ml-3 mt-1">
            <InfoPopover context="class-attendance-overview" locationId={activeLocation} />
          </div>
        </div>

        {locations.map(location => (
          <TabsContent key={location.id} value={location.id} className="space-y-8">
            {/* Enhanced Key Metric Cards */}
            <SuperEnhancedMetricCards data={locationFilteredData} payrollData={payrollData || []} />

            {/* Enhanced Interactive Charts Section */}
            <SuperInteractiveCharts data={locationFilteredData} />

            {/* Enhanced Analytics Tables Tabs */}
            <Tabs defaultValue="comprehensive" className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="glass-morphism p-2 rounded-2xl shadow-lg border-0 grid grid-cols-6 w-full max-w-7xl">
                  <TabsTrigger value="comprehensive" className="tab-modern">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Comprehensive</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="monthly" className="tab-modern">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Month-on-Month</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="rankings" className="tab-modern">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span>Rankings</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="hosted" className="tab-modern">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      <span>Hosted Classes</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="payroll" className="tab-modern">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Payroll</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="tab-modern">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span>Charts</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="comprehensive">
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Ultimate Class Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Comprehensive table with 6 view types, 7 grouping options, ranking criteria selection, class average metrics, and horizontal scrolling.
                      </p>
                    </CardContent>
                  </Card>
                  <UltimateClassAttendanceTable data={locationFilteredData} location={activeLocation} />
                </div>
              </TabsContent>

              <TabsContent value="monthly">
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Month-on-Month Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Monthly data displayed as columns with metric selector, totals row, and ignores date filters to show complete history.
                      </p>
                    </CardContent>
                  </Card>
                  <MonthOnMonthClassTable data={sessionsData || []} location={activeLocation} />
                </div>
              </TabsContent>

              <TabsContent value="rankings">
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Performance Rankings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Side-by-side top and bottom performers with customizable criteria, class averages by default, and trainer-specific options.
                      </p>
                    </CardContent>
                  </Card>
                  <DualRankingLists data={locationFilteredData} location={activeLocation} />
                </div>
              </TabsContent>

              <TabsContent value="hosted">
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        Hosted Classes Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Detailed analytics for hosted classes grouped by month with comprehensive performance metrics and growth analysis.
                      </p>
                    </CardContent>
                  </Card>
                  <HostedClassesAnalytics data={locationFilteredData} location={activeLocation} />
                </div>
              </TabsContent>

              <TabsContent value="payroll">
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Enhanced Payroll Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Restructured payroll table with months as columns, better formatting, and comprehensive trainer performance metrics.
                      </p>
                    </CardContent>
                  </Card>
                  <EnhancedPayrollTable data={payrollData || []} sessionsData={locationFilteredData} location={activeLocation} />
                </div>
              </TabsContent>

              <TabsContent value="charts">
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-cyan-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Interactive Visualizations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Enhanced interactive charts with multiple visualization types, dynamic controls, and comprehensive analytics.
                      </p>
                    </CardContent>
                  </Card>
                  <SuperInteractiveCharts data={locationFilteredData} />
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default EnhancedClassAttendanceSection;