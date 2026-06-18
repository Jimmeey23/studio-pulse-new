import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, TrendingUp, Calendar, Users, DollarSign, Target, 
  Clock, MapPin, Filter, Download, Maximize2, PieChart, LineChart
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatPercentage, formatNumber, formatRevenue } from '@/utils/formatters';

interface SuperInteractiveChartsProps {
  data: SessionData[];
  location?: string;
}

type ChartType = 'fillRate' | 'revenue' | 'attendance' | 'trends' | 'heatmap' | 'performance';
type TimeGrouping = 'daily' | 'weekly' | 'monthly' | 'quarterly';
type MetricType = 'fillRate' | 'revenue' | 'attendance' | 'consistency';

export const SuperInteractiveCharts: React.FC<SuperInteractiveChartsProps> = ({ data, location }) => {
  const [selectedChart, setSelectedChart] = useState<ChartType>('fillRate');
  const [timeGrouping, setTimeGrouping] = useState<TimeGrouping>('monthly');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('fillRate');
  const [showTop, setShowTop] = useState(10);

  const processedChartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Filter out hosted classes
    const filteredData = data.filter(session => 
      !session.sessionName?.toLowerCase().includes('hosted') &&
      !session.sessionName?.toLowerCase().includes('myriad')
    );

    // Time-based grouping
    const timeGroups = filteredData.reduce((acc, session) => {
      const sessionDate = new Date(session.date || '');
      let groupKey = '';
      
      switch (timeGrouping) {
        case 'daily':
          groupKey = sessionDate.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(sessionDate);
          weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());
          groupKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          groupKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(sessionDate.getMonth() / 3) + 1;
          groupKey = `${sessionDate.getFullYear()}-Q${quarter}`;
          break;
      }

      if (!acc[groupKey]) {
        acc[groupKey] = {
          period: groupKey,
          sessions: 0,
          attendance: 0,
          capacity: 0,
          revenue: 0,
          fillRate: 0,
          avgAttendance: 0
        };
      }

      const group = acc[groupKey];
      group.sessions += 1;
      group.attendance += session.checkedInCount || 0;
      group.capacity += session.capacity || 0;
      group.revenue += session.totalPaid || 0;
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate derived metrics
    Object.values(timeGroups).forEach((group: any) => {
      group.fillRate = group.capacity > 0 ? (group.attendance / group.capacity) * 100 : 0;
      group.avgAttendance = group.sessions > 0 ? group.attendance / group.sessions : 0;
    });

    // Class performance analysis
    const classGroups = filteredData.reduce((acc, session) => {
      const classKey = session.cleanedClass || session.classType || 'Unknown';
      
      if (!acc[classKey]) {
        acc[classKey] = {
          className: classKey,
          sessions: 0,
          attendance: 0,
          capacity: 0,
          revenue: 0,
          fillRate: 0,
          consistency: 0,
          trend: 'stable' as 'up' | 'down' | 'stable'
        };
      }

      const group = acc[classKey];
      group.sessions += 1;
      group.attendance += session.checkedInCount || 0;
      group.capacity += session.capacity || 0;
      group.revenue += session.totalPaid || 0;
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate performance metrics for classes
    Object.values(classGroups).forEach((group: any) => {
      group.fillRate = group.capacity > 0 ? (group.attendance / group.capacity) * 100 : 0;
      group.avgRevenue = group.sessions > 0 ? group.revenue / group.sessions : 0;
      group.avgAttendance = group.sessions > 0 ? group.attendance / group.sessions : 0;
      
      // Simple consistency calculation (for demo)
      group.consistency = Math.random() * 40 + 60; // Random between 60-100 for demo
    });

    // Trainer performance
    const trainerGroups = filteredData.reduce((acc, session) => {
      const trainerKey = session.trainerName || 'Unknown';
      
      if (!acc[trainerKey]) {
        acc[trainerKey] = {
          trainerName: trainerKey,
          sessions: 0,
          attendance: 0,
          capacity: 0,
          revenue: 0,
          fillRate: 0,
          classes: new Set()
        };
      }

      const group = acc[trainerKey];
      group.sessions += 1;
      group.attendance += session.checkedInCount || 0;
      group.capacity += session.capacity || 0;
      group.revenue += session.totalPaid || 0;
      group.classes.add(session.cleanedClass || session.classType);
      
      return acc;
    }, {} as Record<string, any>);

    Object.values(trainerGroups).forEach((group: any) => {
      group.fillRate = group.capacity > 0 ? (group.attendance / group.capacity) * 100 : 0;
      group.classCount = group.classes.size;
    });

    // Time slot analysis
    const timeSlotGroups = filteredData.reduce((acc, session) => {
      const timeSlot = session.time || 'Unknown';
      
      if (!acc[timeSlot]) {
        acc[timeSlot] = {
          timeSlot,
          sessions: 0,
          attendance: 0,
          capacity: 0,
          revenue: 0,
          fillRate: 0
        };
      }

      const group = acc[timeSlot];
      group.sessions += 1;
      group.attendance += session.checkedInCount || 0;
      group.capacity += session.capacity || 0;
      group.revenue += session.totalPaid || 0;
      
      return acc;
    }, {} as Record<string, any>);

    Object.values(timeSlotGroups).forEach((group: any) => {
      group.fillRate = group.capacity > 0 ? (group.attendance / group.capacity) * 100 : 0;
    });

    return {
      timeData: Object.values(timeGroups).sort((a: any, b: any) => a.period.localeCompare(b.period)),
      classData: Object.values(classGroups).sort((a: any, b: any) => b.fillRate - a.fillRate),
      trainerData: Object.values(trainerGroups).sort((a: any, b: any) => b.fillRate - a.fillRate),
      timeSlotData: Object.values(timeSlotGroups).sort((a: any, b: any) => b.fillRate - a.fillRate)
    };
  }, [data, timeGrouping]);

  const renderFillRateChart = () => {
    if (!processedChartData) return null;

    const topClasses = processedChartData.classData.slice(0, showTop);
    const maxFillRate = Math.max(...topClasses.map((item: any) => item.fillRate));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {topClasses.map((classItem: any, index: number) => (
            <div key={classItem.className} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{classItem.className}</div>
                  <div className="text-xs text-gray-500">
                    {formatNumber(classItem.sessions)} sessions • {formatNumber(classItem.attendance)} attendees
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-800">{formatPercentage(classItem.fillRate)}</div>
                  <div className="text-xs text-gray-500">{formatCurrency(classItem.revenue)}</div>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      classItem.fillRate >= 80 ? 'bg-green-500' :
                      classItem.fillRate >= 60 ? 'bg-blue-500' :
                      classItem.fillRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(classItem.fillRate / maxFillRate) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRevenueChart = () => {
    if (!processedChartData) return null;

    const topClasses = processedChartData.classData
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, showTop);
    const maxRevenue = Math.max(...topClasses.map((item: any) => item.revenue));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {topClasses.map((classItem: any, index: number) => (
            <div key={classItem.className} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{classItem.className}</div>
                  <div className="text-xs text-gray-500">
                    {formatPercentage(classItem.fillRate)} fill • {formatNumber(classItem.sessions)} sessions
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-800">{formatCurrency(classItem.revenue)}</div>
                  <div className="text-xs text-gray-500">{formatCurrency(classItem.avgRevenue)}/session</div>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${(classItem.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTrendsChart = () => {
    if (!processedChartData) return null;

    const timeData = processedChartData.timeData.slice(-12); // Last 12 periods
    const maxValue = Math.max(...timeData.map((item: any) => item[selectedMetric]));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <div className="flex items-end justify-between gap-2 h-64 p-4 bg-gradient-to-t from-gray-50 to-white rounded-lg border">
              {timeData.map((period: any, index: number) => {
                const value = period[selectedMetric];
                const height = (value / maxValue) * 100;
                
                return (
                  <div key={period.period} className="flex flex-col items-center gap-2 flex-1">
                    <div className="relative w-full flex items-end justify-center">
                      <div 
                        className={`w-full max-w-12 rounded-t transition-all duration-500 hover:opacity-80 ${
                          selectedMetric === 'fillRate' ? 'bg-blue-500' :
                          selectedMetric === 'revenue' ? 'bg-green-500' :
                          selectedMetric === 'attendance' ? 'bg-purple-500' : 'bg-orange-500'
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${period.period}: ${
                          selectedMetric === 'fillRate' ? formatPercentage(value) :
                          selectedMetric === 'revenue' ? formatCurrency(value) :
                          formatNumber(value)
                        }`}
                      />
                    </div>
                    <div className="text-xs text-gray-500 transform -rotate-45 whitespace-nowrap">
                      {period.period}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-600">
          Trend analysis for {selectedMetric} over the last {timeData.length} {timeGrouping} periods
        </div>
      </div>
    );
  };

  const renderTrainerPerformance = () => {
    if (!processedChartData) return null;

    const topTrainers = processedChartData.trainerData.slice(0, showTop);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topTrainers.map((trainer: any, index: number) => (
          <Card key={trainer.trainerName} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="font-medium text-gray-800">{trainer.trainerName}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {formatNumber(trainer.classCount)} formats
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="font-semibold text-blue-700">{formatPercentage(trainer.fillRate)}</div>
                  <div className="text-xs text-blue-600">Fill Rate</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-semibold text-green-700">{formatRevenue(trainer.revenue)}</div>
                  <div className="text-xs text-green-600">Revenue</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <div className="font-semibold text-purple-700">{formatNumber(trainer.sessions)}</div>
                  <div className="text-xs text-purple-600">Sessions</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded">
                  <div className="font-semibold text-orange-700">{formatNumber(trainer.attendance)}</div>
                  <div className="text-xs text-orange-600">Attendees</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderTimeSlotAnalysis = () => {
    if (!processedChartData) return null;

    const timeSlots = processedChartData.timeSlotData;
    const maxSessions = Math.max(...timeSlots.map((slot: any) => slot.sessions));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          {timeSlots.map((slot: any) => (
            <div key={slot.timeSlot} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-800">{slot.timeSlot}</div>
                  <div className="text-xs text-gray-500">
                    {formatNumber(slot.sessions)} sessions • {formatPercentage(slot.fillRate)} fill
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-800">{formatNumber(slot.attendance)}</div>
                  <div className="text-xs text-gray-500">{formatCurrency(slot.revenue)}</div>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${(slot.sessions / maxSessions) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (selectedChart) {
      case 'fillRate': return renderFillRateChart();
      case 'revenue': return renderRevenueChart();
      case 'trends': return renderTrendsChart();
      case 'performance': return renderTrainerPerformance();
      case 'heatmap': return renderTimeSlotAnalysis();
      default: return renderFillRateChart();
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No data available for charts</p>
        </CardContent>
      </Card>
    );
  }

  const chartOptions = [
    { value: 'fillRate', label: 'Fill Rate Analysis', icon: Target },
    { value: 'revenue', label: 'Revenue Performance', icon: DollarSign },
    { value: 'trends', label: 'Trends Over Time', icon: TrendingUp },
    { value: 'performance', label: 'Trainer Performance', icon: Users },
    { value: 'heatmap', label: 'Time Slot Analysis', icon: Clock }
  ];

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-cyan-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Interactive Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chart Type</label>
              <Select value={selectedChart} onValueChange={(v: ChartType) => setSelectedChart(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedChart === 'trends' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Grouping</label>
                  <Select value={timeGrouping} onValueChange={(v: TimeGrouping) => setTimeGrouping(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Metric</label>
                  <Select value={selectedMetric} onValueChange={(v: MetricType) => setSelectedMetric(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fillRate">Fill Rate</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="attendance">Attendance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Show Top</label>
              <Select value={String(showTop)} onValueChange={(v) => setShowTop(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="15">Top 15</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {chartOptions.find(opt => opt.value === selectedChart)?.icon && (
                React.createElement(chartOptions.find(opt => opt.value === selectedChart)!.icon, { className: "w-5 h-5" })
              )}
              {chartOptions.find(opt => opt.value === selectedChart)?.label}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Maximize2 className="w-4 h-4 mr-1" />
                Fullscreen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {renderChart()}
        </CardContent>
      </Card>
    </div>
  );
};