import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PayrollData } from '@/types/dashboard';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { FormatComparisonTable } from './FormatComparisonTable';
import { FormatAnalysisFilters, FormatFilters } from './FormatAnalysisFilters';
import { MonthOnMonthAnalysis } from './MonthOnMonthAnalysis';
import { LocationAnalysis } from './LocationAnalysis';
import { FormatDrillDownModal } from './FormatDrillDownModal';
import { useSessionsFilters } from '@/contexts/SessionsFiltersContext';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Clock, 
  Target, 
  AlertCircle,
  DollarSign,
  Calendar,
  BarChart3,
  Zap,
  Eye,
  Filter,
  MapPin,
  TrendingDown
} from 'lucide-react';

interface FormatMetrics {
  sessionsScheduled: number;
  emptySessions: number;
  nonEmptySessions: number;
  visits: number; // customers checked in
  lateCancelled: number;
  booked: number;
  capacity: number;
  revenueEarned: number;
  classAvgWithEmpty: number;
  classAvgWithoutEmpty: number;
  fillRate: number;
  cancellationRate: number;
  capacityUtilization: number;
  revenuePerSeat: number;
  revenueLostPerCancellation: number;
  score: number;
}

interface FormatMetricsAnalysisProps {
  data: PayrollData[];
}

export const FormatMetricsAnalysis: React.FC<FormatMetricsAnalysisProps> = ({ data }) => {
  const { filters: sessionFilters } = useSessionsFilters();
  const [filters, setFilters] = useState<FormatFilters>({
    dateRange: {
      start: '',
      end: '',
      period: 'all'
    },
    locations: [],
    formats: ['cycle', 'barre', 'strength'],
    compareBy: 'format',
    showEmpty: true
  });

  const filteredData = useMemo(() => {
    let result = data;
    
    // Apply SessionsFilters first
    if (sessionFilters) {
      result = result.filter((item: PayrollData) => {
        // Apply trainer filter
        if (sessionFilters.trainers.length > 0 && !sessionFilters.trainers.includes(item.teacherName || '')) {
          return false;
        }
        
        // Apply class type filter
        if (sessionFilters.classTypes.length > 0 && !sessionFilters.classTypes.includes(item.cleanedClass || '')) {
          return false;
        }
        
        // Apply day of week filter
        if (sessionFilters.dayOfWeek.length > 0 && !sessionFilters.dayOfWeek.includes(item.dayOfWeek || '')) {
          return false;
        }
        
        // Apply time slot filter
        if (sessionFilters.timeSlots.length > 0 && !sessionFilters.timeSlots.includes(item.time || '')) {
          return false;
        }
        
        return true;
      });
    }
    
    // Filter by locations
    if (filters.locations.length > 0) {
      result = result.filter(item => filters.locations.includes(item.location));
    }

    // Filter by date period
    if (filters.dateRange.period !== 'all') {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      switch (filters.dateRange.period) {
        case 'last3months':
          const last3Months = new Date(currentYear, currentMonth - 3, 1);
          result = result.filter(item => {
            if (!item.monthYear) return false;
            const [month, year] = item.monthYear.split('-');
            const itemDate = new Date(parseInt(year), getMonthIndex(month), 1);
            return itemDate >= last3Months;
          });
          break;
        case 'last6months':
          const last6Months = new Date(currentYear, currentMonth - 6, 1);
          result = result.filter(item => {
            if (!item.monthYear) return false;
            const [month, year] = item.monthYear.split('-');
            const itemDate = new Date(parseInt(year), getMonthIndex(month), 1);
            return itemDate >= last6Months;
          });
          break;
        case 'last12months':
          const last12Months = new Date(currentYear, currentMonth - 12, 1);
          result = result.filter(item => {
            if (!item.monthYear) return false;
            const [month, year] = item.monthYear.split('-');
            const itemDate = new Date(parseInt(year), getMonthIndex(month), 1);
            return itemDate >= last12Months;
          });
          break;
        case 'ytd':
          const yearStart = new Date(currentYear, 0, 1);
          result = result.filter(item => {
            if (!item.monthYear) return false;
            const [month, year] = item.monthYear.split('-');
            const itemDate = new Date(parseInt(year), getMonthIndex(month), 1);
            return itemDate >= yearStart;
          });
          break;
      }
    }

    
    return result;
  }, [data, filters, sessionFilters]);  const getMonthIndex = (monthName: string): number => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(monthName.substring(0, 3));
  };

  const formatMetrics = useMemo(() => {
    const cycleMetrics: FormatMetrics = {
      sessionsScheduled: 0,
      emptySessions: 0,
      nonEmptySessions: 0,
      visits: 0,
      lateCancelled: 0,
      booked: 0,
      capacity: 0,
      revenueEarned: 0,
      classAvgWithEmpty: 0,
      classAvgWithoutEmpty: 0,
      fillRate: 0,
      cancellationRate: 0,
      capacityUtilization: 0,
      revenuePerSeat: 0,
      revenueLostPerCancellation: 0,
      score: 0
    };

    const barreMetrics: FormatMetrics = { ...cycleMetrics };
    const strengthMetrics: FormatMetrics = { ...cycleMetrics };

    // Calculate metrics for each format - only if format is selected
    filteredData.forEach(row => {
      // PowerCycle Metrics - only if cycle is in active formats
      if (filters.formats.includes('cycle')) {
        cycleMetrics.sessionsScheduled += row.cycleSessions || 0;
        cycleMetrics.emptySessions += row.emptyCycleSessions || 0;
        cycleMetrics.nonEmptySessions += row.nonEmptyCycleSessions || 0;
        cycleMetrics.visits += row.cycleCustomers || 0;
        cycleMetrics.revenueEarned += row.cyclePaid || 0;
      }

      // Barre Metrics - only if barre is in active formats
      if (filters.formats.includes('barre')) {
        barreMetrics.sessionsScheduled += row.barreSessions || 0;
        barreMetrics.emptySessions += row.emptyBarreSessions || 0;
        barreMetrics.nonEmptySessions += row.nonEmptyBarreSessions || 0;
        barreMetrics.visits += row.barreCustomers || 0;
        barreMetrics.revenueEarned += row.barrePaid || 0;
      }

      // Strength Metrics - only if strength is in active formats
      if (filters.formats.includes('strength')) {
        strengthMetrics.sessionsScheduled += row.strengthSessions || 0;
        strengthMetrics.emptySessions += row.emptyStrengthSessions || 0;
        strengthMetrics.nonEmptySessions += row.nonEmptyStrengthSessions || 0;
        strengthMetrics.visits += row.strengthCustomers || 0;
        strengthMetrics.revenueEarned += row.strengthPaid || 0;
      }
    });

    // Calculate derived metrics for each format
    const calculateDerivedMetrics = (metrics: FormatMetrics): FormatMetrics => {
      // Estimate capacity (assuming 20 per session as default)
      const estimatedCapacityPerSession = 20;
      metrics.capacity = metrics.sessionsScheduled * estimatedCapacityPerSession;
      
      // Estimate bookings (visits + some cancellation buffer)
      metrics.booked = Math.round(metrics.visits * 1.15); // Assume 15% cancellation buffer
      
      // Calculate late cancellations (estimate 5-10% of bookings)
      metrics.lateCancelled = Math.round(metrics.booked * 0.08);
      
      // Class averages
      metrics.classAvgWithEmpty = metrics.sessionsScheduled > 0 
        ? metrics.visits / metrics.sessionsScheduled 
        : 0;
      
      metrics.classAvgWithoutEmpty = metrics.nonEmptySessions > 0 
        ? metrics.visits / metrics.nonEmptySessions 
        : 0;
      
      // Fill rate
      metrics.fillRate = metrics.sessionsScheduled > 0 
        ? (metrics.nonEmptySessions / metrics.sessionsScheduled) * 100 
        : 0;
      
      // Cancellation rate
      metrics.cancellationRate = metrics.booked > 0 
        ? (metrics.lateCancelled / metrics.booked) * 100 
        : 0;
      
      // Capacity utilization
      metrics.capacityUtilization = metrics.capacity > 0 
        ? (metrics.visits / metrics.capacity) * 100 
        : 0;
      
      // Revenue per seat
      metrics.revenuePerSeat = metrics.visits > 0 
        ? metrics.revenueEarned / metrics.visits 
        : 0;
      
      // Revenue lost per cancellation
      metrics.revenueLostPerCancellation = metrics.lateCancelled > 0 
        ? (metrics.revenuePerSeat * metrics.lateCancelled) / metrics.lateCancelled 
        : 0;
      
      // Score calculation (weighted average of key metrics)
      const fillRateWeight = 0.25;
      const utilizationWeight = 0.25;
      const revenueEfficiencyWeight = 0.30;
      const retentionWeight = 0.20;
      
      const normalizedFillRate = Math.min(metrics.fillRate, 100) / 100;
      const normalizedUtilization = Math.min(metrics.capacityUtilization, 100) / 100;
      const normalizedRevenue = Math.min(metrics.revenuePerSeat / 1000, 1); // Normalize to 1000 as max
      const normalizedRetention = Math.max(0, (100 - metrics.cancellationRate)) / 100;
      
      metrics.score = (
        normalizedFillRate * fillRateWeight +
        normalizedUtilization * utilizationWeight +
        normalizedRevenue * revenueEfficiencyWeight +
        normalizedRetention * retentionWeight
      ) * 100;
      
      return metrics;
    };

    return {
      cycle: calculateDerivedMetrics(cycleMetrics),
      barre: calculateDerivedMetrics(barreMetrics),
      strength: calculateDerivedMetrics(strengthMetrics)
    };
  }, [filteredData, filters]);

  const MetricsCard = ({ 
    title, 
    value, 
    format = 'number',
    icon: Icon,
    trend,
    description
  }: {
    title: string;
    value: number;
    format?: 'number' | 'currency' | 'percentage';
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    description?: string;
  }) => (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {format === 'currency' ? formatNumber(value) :
           format === 'percentage' ? formatPercentage(value) :
           formatNumber(value)}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  const FormatTab = ({ 
    metrics, 
    formatName,
    color,
    data,
    formatType
  }: { 
    metrics: FormatMetrics;
    formatName: string;
    color: string;
    data?: PayrollData[];
    formatType?: 'cycle' | 'barre' | 'strength';
  }) => (
    <div className="space-y-8">
      {/* Enhanced Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={`border-2 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br ${
          color === 'blue' ? 'from-blue-50 to-white border-blue-200' :
          color === 'pink' ? 'from-pink-50 to-white border-pink-200' :
          'from-orange-50 to-white border-orange-200'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${
                color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                color === 'pink' ? 'bg-gradient-to-r from-pink-500 to-pink-600' :
                'bg-gradient-to-r from-orange-500 to-orange-600'
              }`}>
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-700">Sessions Scheduled</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{formatNumber(metrics.sessionsScheduled)}</div>
            <div className="text-sm text-gray-600">Total classes scheduled</div>
          </CardContent>
        </Card>
        
        <Card className={`border-2 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br ${
          color === 'blue' ? 'from-blue-50 to-white border-blue-200' :
          color === 'pink' ? 'from-pink-50 to-white border-pink-200' :
          'from-orange-50 to-white border-orange-200'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${
                color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                color === 'pink' ? 'bg-gradient-to-r from-pink-500 to-pink-600' :
                'bg-gradient-to-r from-orange-500 to-orange-600'
              }`}>
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-700">Revenue Earned</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{formatNumber(metrics.revenueEarned)}</div>
            <div className="text-sm text-gray-600">Total revenue generated</div>
          </CardContent>
        </Card>

        <Card className={`border-2 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br ${
          color === 'blue' ? 'from-blue-50 to-white border-blue-200' :
          color === 'pink' ? 'from-pink-50 to-white border-pink-200' :
          'from-orange-50 to-white border-orange-200'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${
                color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                color === 'pink' ? 'bg-gradient-to-r from-pink-500 to-pink-600' :
                'bg-gradient-to-r from-orange-500 to-orange-600'
              }`}>
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-700">Visits (Check-ins)</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{formatNumber(metrics.visits)}</div>
            <div className="text-sm text-gray-600">Customer check-ins</div>
          </CardContent>
        </Card>

        <Card className={`border-2 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br ${
          color === 'blue' ? 'from-blue-50 to-white border-blue-200' :
          color === 'pink' ? 'from-pink-50 to-white border-pink-200' :
          'from-orange-50 to-white border-orange-200'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${
                color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                color === 'pink' ? 'bg-gradient-to-r from-pink-500 to-pink-600' :
                'bg-gradient-to-r from-orange-500 to-orange-600'
              }`}>
                <Target className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-700">Overall Score</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{formatPercentage(metrics.score)}</div>
            <div className="text-sm text-gray-600">Composite performance score</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-gray-50/50 to-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                color === 'pink' ? 'bg-gradient-to-r from-pink-500 to-pink-600' :
                'bg-gradient-to-r from-orange-500 to-orange-600'
              }`}>
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className={`font-bold text-xl bg-gradient-to-r ${
                color === 'blue' ? 'from-blue-600 to-blue-800' :
                color === 'pink' ? 'from-pink-600 to-pink-800' :
                'from-orange-600 to-orange-800'
              } bg-clip-text text-transparent`}>
                Detailed {formatName} Metrics
              </span>
            </div>
            {data && formatType && (
              <FormatDrillDownModal 
                data={data} 
                formatType={formatType}
                filters={filters}
                trigger={
                  <Button variant="outline" className={`${
                    color === 'blue' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' :
                    color === 'pink' ? 'border-pink-200 text-pink-700 hover:bg-pink-50' :
                    'border-orange-200 text-orange-700 hover:bg-orange-50'
                  }`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Advanced Analysis
                  </Button>
                }
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Session Metrics */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Session Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Sessions Scheduled</span>
                  <span className="font-semibold text-slate-700">{formatNumber(metrics.sessionsScheduled)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Empty Sessions</span>
                  <span className="font-semibold text-red-600">{formatNumber(metrics.emptySessions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Non-Empty Sessions</span>
                  <span className="font-semibold text-blue-600">{formatNumber(metrics.nonEmptySessions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Fill Rate</span>
                  <Badge variant="outline">{formatPercentage(metrics.fillRate)}</Badge>
                </div>
              </div>
            </div>

            {/* Customer Metrics */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Customer Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total Visits</span>
                  <Badge variant="secondary">{formatNumber(metrics.visits)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Booked</span>
                  <Badge variant="default">{formatNumber(metrics.booked)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Late Cancelled</span>
                  <Badge variant="destructive">{formatNumber(metrics.lateCancelled)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cancellation Rate</span>
                  <Badge variant="outline">{formatPercentage(metrics.cancellationRate)}</Badge>
                </div>
              </div>
            </div>

            {/* Financial & Efficiency Metrics */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Financial & Efficiency</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Revenue Earned</span>
                  <Badge variant="secondary">{formatNumber(metrics.revenueEarned)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Revenue per Seat</span>
                  <Badge variant="default">{formatNumber(metrics.revenuePerSeat)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Capacity Utilization</span>
                  <Badge variant="outline">{formatPercentage(metrics.capacityUtilization)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Revenue Lost/Cancellation</span>
                  <Badge variant="destructive">{formatNumber(metrics.revenueLostPerCancellation)}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Class Averages */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-3">Class Averages</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Average with Empty Classes</span>
                <div className="text-lg font-semibold">{formatNumber(metrics.classAvgWithEmpty)} customers/class</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Average without Empty Classes</span>
                <div className="text-lg font-semibold">{formatNumber(metrics.classAvgWithoutEmpty)} customers/class</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Advanced Filters Section */}
      <FormatAnalysisFilters data={data} onFiltersChange={setFilters} />

      {/* Main Analysis Tabs */}
      <Tabs defaultValue={filters.compareBy === 'format' ? 'overview' : 
                         filters.compareBy === 'month' ? 'monthly' : 
                         filters.compareBy === 'location' ? 'locations' : 'overview'} 
            className="w-full">
        
        <TabsList className="bg-white/90 backdrop-blur-sm p-1 rounded-2xl shadow-xl border border-slate-200 grid w-full grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="flex-1 text-center flex items-center gap-2 py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex-1 text-center flex items-center gap-2 py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Comparison</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1 text-center flex items-center gap-2 py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Monthly</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex-1 text-center flex items-center gap-2 py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Locations</span>
          </TabsTrigger>
          <TabsTrigger value="cycle" className="flex-1 text-center flex items-center gap-2 py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">PowerCycle</span>
          </TabsTrigger>
          <TabsTrigger value="barre" className="flex-1 text-center flex items-center gap-2 py-3 data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Barre</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-8 space-y-6">
          {/* Enhanced Performance Overview Cards */}
          <div className={`grid gap-6 ${
            filters.formats.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
            filters.formats.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-1 md:grid-cols-3'
          }`}>
            {/* PowerCycle Summary */}
            {filters.formats.includes('cycle') && (
              <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-50 via-blue-25 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-blue-900">PowerCycle</h3>
                    </div>
                    <Badge className="bg-blue-500 text-white shadow-sm">{formatPercentage(formatMetrics.cycle.score)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-700 font-medium">Sessions</div>
                      <div className="text-lg font-bold text-blue-900">{formatNumber(formatMetrics.cycle.sessionsScheduled)}</div>
                    </div>
                    <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-700 font-medium">Revenue</div>
                      <div className="text-lg font-bold text-blue-900">{formatNumber(formatMetrics.cycle.revenueEarned)}</div>
                    </div>
                    <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-700 font-medium">Fill Rate</div>
                      <div className="text-lg font-bold text-blue-900">{formatPercentage(formatMetrics.cycle.fillRate)}</div>
                    </div>
                    <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-700 font-medium">Visits</div>
                      <div className="text-lg font-bold text-blue-900">{formatNumber(formatMetrics.cycle.visits)}</div>
                    </div>
                  </div>
                  <FormatDrillDownModal 
                    data={filteredData} 
                    formatType="cycle"
                    filters={filters}
                    trigger={
                      <Button variant="outline" size="sm" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            )}

            {/* Barre Summary */}
            {filters.formats.includes('barre') && (
              <Card className="border-2 border-pink-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-pink-50 via-pink-25 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg shadow-md">
                        <Activity className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-pink-900">Barre</h3>
                    </div>
                    <Badge className="bg-pink-500 text-white shadow-sm">{formatPercentage(formatMetrics.barre.score)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/80 p-3 rounded-lg border border-pink-100">
                      <div className="text-xs text-pink-700 font-medium">Sessions</div>
                      <div className="text-lg font-bold text-pink-900">{formatNumber(formatMetrics.barre.sessionsScheduled)}</div>
                    </div>
                    <div className="bg-white/80 p-3 rounded-lg border border-pink-100">
                      <div className="text-xs text-pink-700 font-medium">Revenue</div>
                      <div className="text-lg font-bold text-pink-900">{formatNumber(formatMetrics.barre.revenueEarned)}</div>
                    </div>
                    <div className="bg-white/80 p-3 rounded-lg border border-pink-100">
                      <div className="text-xs text-pink-700 font-medium">Fill Rate</div>
                      <div className="text-lg font-bold text-pink-900">{formatPercentage(formatMetrics.barre.fillRate)}</div>
                    </div>
                    <div className="bg-white/80 p-3 rounded-lg border border-pink-100">
                      <div className="text-xs text-pink-700 font-medium">Visits</div>
                      <div className="text-lg font-bold text-pink-900">{formatNumber(formatMetrics.barre.visits)}</div>
                    </div>
                  </div>
                  <FormatDrillDownModal 
                    data={filteredData} 
                    formatType="barre"
                    filters={filters}
                    trigger={
                      <Button variant="outline" size="sm" className="w-full border-pink-200 text-pink-700 hover:bg-pink-50">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            )}

            {/* Strength Summary */}
            {filters.formats.includes('strength') && (
              <Card className="border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-orange-50 via-orange-25 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-md">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-orange-900">Strength</h3>
                    </div>
                    <Badge className="bg-orange-500 text-white shadow-sm">{formatPercentage(formatMetrics.strength.score)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/80 p-3 rounded-lg border border-orange-100">
                      <div className="text-xs text-orange-700 font-medium">Sessions</div>
                      <div className="text-lg font-bold text-orange-900">{formatNumber(formatMetrics.strength.sessionsScheduled)}</div>
                    </div>
                    <div className="bg-white/80 p-3 rounded-lg border border-orange-100">
                      <div className="text-xs text-orange-700 font-medium">Revenue</div>
                      <div className="text-lg font-bold text-orange-900">{formatNumber(formatMetrics.strength.revenueEarned)}</div>
                    </div>
                    <div className="bg-white/80 p-3 rounded-lg border border-orange-100">
                      <div className="text-xs text-orange-700 font-medium">Fill Rate</div>
                      <div className="text-lg font-bold text-orange-900">{formatPercentage(formatMetrics.strength.fillRate)}</div>
                    </div>
                    <div className="bg-white/80 p-3 rounded-lg border border-orange-100">
                      <div className="text-xs text-orange-700 font-medium">Visits</div>
                      <div className="text-lg font-bold text-orange-900">{formatNumber(formatMetrics.strength.visits)}</div>
                    </div>
                  </div>
                  <FormatDrillDownModal 
                    data={filteredData} 
                    formatType="strength"
                    filters={filters}
                    trigger={
                      <Button variant="outline" size="sm" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="mt-8">
          <FormatComparisonTable data={filteredData} filters={filters} />
        </TabsContent>

        {/* Monthly Analysis Tab */}
        <TabsContent value="monthly" className="mt-8">
          <MonthOnMonthAnalysis data={filteredData} filters={filters} />
        </TabsContent>

        {/* Location Analysis Tab */}
        <TabsContent value="locations" className="mt-8">
          <LocationAnalysis data={filteredData} filters={filters} />
        </TabsContent>

        {/* Individual Format Tabs */}
        <TabsContent value="cycle" className="mt-8">
          <FormatTab 
            metrics={formatMetrics.cycle} 
            formatName="PowerCycle"
            color="blue"
            data={filteredData}
            formatType="cycle"
          />
        </TabsContent>

        <TabsContent value="barre" className="mt-8">
          <FormatTab 
            metrics={formatMetrics.barre} 
            formatName="Barre"
            color="pink"
            data={filteredData}
            formatType="barre"
          />
        </TabsContent>

        <TabsContent value="strength" className="mt-8">
          <FormatTab 
            metrics={formatMetrics.strength} 
            formatName="Strength"
            color="orange"
            data={filteredData}
            formatType="strength"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};