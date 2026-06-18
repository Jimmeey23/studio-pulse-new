import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayrollData } from '@/hooks/usePayrollData';
import { ImprovedYearOnYearTrainerTable } from './ImprovedYearOnYearTrainerTable';
import { MonthOnMonthTrainerTable } from './MonthOnMonthTrainerTable';
import { EnhancedTrainerDrillDownModal } from './EnhancedTrainerDrillDownModal';
import { TrainerFilterSection } from './TrainerFilterSection';
import { processTrainerData } from './TrainerDataProcessor';
import { Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';

export const TrainerPerformanceSection = () => {
  const { data: payrollData, isLoading, error } = usePayrollData();
  const [selectedTab, setSelectedTab] = useState('month-on-month');
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('');
  const [filters, setFilters] = useState<any>({});
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);

  // Process and filter data
  const processedData = useMemo(() => {
    if (!payrollData || payrollData.length === 0) return [];
    
    let data = processTrainerData(payrollData);
    
    // Apply enhanced filters
    if (filters.location) {
      data = data.filter(d => d.location === filters.location);
    }
    
    if (filters.trainer) {
      data = data.filter(d => d.trainerName === filters.trainer);
    }
    
    if (filters.month) {
      data = data.filter(d => d.monthYear === filters.month);
    }
    
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
      const sortedByRevenue = [...data].sort((a, b) => b.totalPaid - a.totalPaid);
      const total = sortedByRevenue.length;
      const topQuartile = Math.ceil(total * 0.25);
      const bottomQuartile = Math.ceil(total * 0.25);
      
      if (filters.performanceLevel === 'high') {
        data = data.filter(d => sortedByRevenue.indexOf(d) < topQuartile);
      } else if (filters.performanceLevel === 'low') {
        data = data.filter(d => sortedByRevenue.indexOf(d) >= (total - bottomQuartile));
      } else if (filters.performanceLevel === 'medium') {
        data = data.filter(d => {
          const index = sortedByRevenue.indexOf(d);
          return index >= topQuartile && index < (total - bottomQuartile);
        });
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
  }, [payrollData, filters]);

  const handleRowClick = (trainer: string, data: any) => {
    setSelectedTrainer(trainer);
    setDrillDownData(data);
    // Get the most recent month or default to current previous month
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthYearKey = `${previousMonth.toLocaleDateString('en-US', { month: 'short' })}-${previousMonth.getFullYear()}`;
    setSelectedMonthYear(data.monthYear || monthYearKey);
  };

  const closeDrillDown = () => {
    setSelectedTrainer(null);
    setDrillDownData(null);
    setSelectedMonthYear('');
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <BrandSpinner size="sm" />
            <span className="text-slate-700 font-medium">Loading trainer performance data...</span>
          </div>
        </CardContent>
      </Card>
    );
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
          <p className="text-center text-slate-600">No trainer performance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardContent className="p-6">
          <TrainerFilterSection
            data={processedData.flatMap(p => p.data?.map(d => ({ 
              teacherName: d.trainerName, 
              location: d.location, 
              monthYear: d.monthYear,
              totalSessions: d.totalSessions,
              totalPaid: d.totalPaid
            })) || []) || []}
            onFiltersChange={setFilters}
            isCollapsed={isFiltersCollapsed}
            onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
          />
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-sm grid grid-cols-2 w-full h-16">
          <TabsTrigger
            value="month-on-month"
            className="flex items-center justify-center gap-2 px-3 py-2 font-semibold text-sm transition-all duration-200 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-100 rounded-lg mx-1"
          >
            <Calendar className="w-4 h-4" />
            <span className="whitespace-nowrap text-xs sm:text-sm">Month-on-Month</span>
          </TabsTrigger>
          <TabsTrigger
            value="year-on-year"
            className="flex items-center justify-center gap-2 px-3 py-2 font-semibold text-sm transition-all duration-200 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-100 rounded-lg mx-1"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="whitespace-nowrap text-xs sm:text-sm">Year-on-Year</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="month-on-month" className="space-y-4">
          <MonthOnMonthTrainerTable
            data={processedData}
            defaultMetric="totalSessions"
            onRowClick={handleRowClick}
          />
        </TabsContent>

        <TabsContent value="year-on-year" className="space-y-4">
          <ImprovedYearOnYearTrainerTable
            data={processedData}
            defaultMetric="totalSessions"
            onRowClick={handleRowClick}
          />
        </TabsContent>
      </Tabs>

      {selectedTrainer && drillDownData && (
        <EnhancedTrainerDrillDownModal
          isOpen={!!selectedTrainer}
          onClose={closeDrillDown}
          trainerName={selectedTrainer}
          trainerData={drillDownData}
          monthYear={selectedMonthYear}
        />
      )}
    </div>
  );
};
