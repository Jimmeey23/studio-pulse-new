import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, TrendingDown, Target, Award, Users, 
  BarChart3, Calendar, Clock, MapPin, User,
  ArrowUpRight, ArrowDownRight, Star, Trophy,
  Activity, DollarSign, Percent, Building2
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface InteractivePerformanceAnalyticsProps {
  data: SessionData[];
  onDrillDown?: (data: any) => void;
}

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  displayValue: string;
  trend: 'up' | 'down' | 'neutral';
  change: number;
  rank: number;
  totalItems: number;
  details: any;
}

interface AnalysisFilter {
  type: 'class' | 'trainer' | 'location' | 'timeSlot' | 'dayOfWeek';
  metric: 'fillRate' | 'revenue' | 'attendance' | 'consistency' | 'growth';
  period: 'current' | 'monthToMonth' | 'weekToWeek';
  minSessions: number;
}

export const InteractivePerformanceAnalytics: React.FC<InteractivePerformanceAnalyticsProps> = ({ 
  data, 
  onDrillDown 
}) => {
  const [filter, setFilter] = useState<AnalysisFilter>({
    type: 'class',
    metric: 'fillRate',
    period: 'current',
    minSessions: 3
  });
  const [showComparisons, setShowComparisons] = useState(true);
  const [highlightTopPerformers, setHighlightTopPerformers] = useState(true);

  // Calculate performance metrics based on current filter
  const performanceData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group data by selected type
    const grouped = data.reduce((acc, session) => {
      let key = '';
      switch (filter.type) {
        case 'class':
          key = session.cleanedClass || 'Unknown';
          break;
        case 'trainer':
          key = session.trainerName || 'Unknown';
          break;
        case 'location':
          key = session.location || 'Unknown';
          break;
        case 'timeSlot':
          key = session.time || 'Unknown';
          break;
        case 'dayOfWeek':
          key = session.dayOfWeek || 'Unknown';
          break;
        default:
          key = 'Unknown';
      }

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(session);
      return acc;
    }, {} as Record<string, SessionData[]>);

    // Calculate metrics for each group
    const metrics: PerformanceMetric[] = Object.entries(grouped)
      .filter(([, sessions]) => sessions.length >= filter.minSessions)
      .map(([name, sessions]) => {
        const totalSessions = sessions.length;
        const totalAttendance = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
        const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
        const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
        
        const fillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
        const avgAttendance = totalSessions > 0 ? totalAttendance / totalSessions : 0;
        const avgRevenue = totalSessions > 0 ? totalRevenue / totalSessions : 0;
        
        // Calculate consistency (how consistent is the performance)
        const attendances = sessions.map(s => s.checkedInCount || 0);
        const mean = avgAttendance;
        const variance = attendances.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / attendances.length;
        const stdDev = Math.sqrt(variance);
        const consistency = mean > 0 ? Math.max(0, 100 - (stdDev / mean) * 100) : 0;

        // Calculate growth trend (mock for now - would need time series analysis)
        const growth = Math.random() * 20 - 10; // Mock between -10% and +10%

        let value: number;
        let displayValue: string;

        switch (filter.metric) {
          case 'fillRate':
            value = fillRate;
            displayValue = formatPercentage(fillRate);
            break;
          case 'revenue':
            value = totalRevenue;
            displayValue = formatCurrency(totalRevenue);
            break;
          case 'attendance':
            value = totalAttendance;
            displayValue = formatNumber(totalAttendance);
            break;
          case 'consistency':
            value = consistency;
            displayValue = formatPercentage(consistency);
            break;
          case 'growth':
            value = growth;
            displayValue = `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
            break;
          default:
            value = fillRate;
            displayValue = formatPercentage(fillRate);
        }

        return {
          id: `${filter.type}-${name}`,
          name,
          value,
          displayValue,
          trend: (growth > 2 ? 'up' : growth < -2 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
          change: growth,
          rank: 0, // Will be set after sorting
          totalItems: 0, // Will be set after counting
          details: {
            sessions,
            totalSessions,
            totalAttendance,
            totalCapacity,
            totalRevenue,
            fillRate,
            avgAttendance,
            avgRevenue,
            consistency,
            growth
          }
        };
      })
      .sort((a, b) => b.value - a.value)
      .map((item, index, array) => ({
        ...item,
        rank: index + 1,
        totalItems: array.length
      }));

    return metrics;
  }, [data, filter]);

  // Split into top and bottom performers
  const topPerformers = useMemo(() => {
    return performanceData.slice(0, 5);
  }, [performanceData]);

  const bottomPerformers = useMemo(() => {
    return performanceData.slice(-5).reverse();
  }, [performanceData]);

  const averageMetric = useMemo(() => {
    if (performanceData.length === 0) return 0;
    return performanceData.reduce((sum, item) => sum + item.value, 0) / performanceData.length;
  }, [performanceData]);

  const handleItemClick = useCallback((item: PerformanceMetric) => {
    if (onDrillDown) {
      onDrillDown({
        title: `${item.name} - Performance Analysis`,
        type: filter.type,
        metric: filter.metric,
        performanceData: item,
        sessions: item.details.sessions,
        breakdown: item.details
      });
    }
  }, [onDrillDown, filter]);

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'fillRate':
        return Target;
      case 'revenue':
        return DollarSign;
      case 'attendance':
        return Users;
      case 'consistency':
        return Activity;
      case 'growth':
        return TrendingUp;
      default:
        return BarChart3;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'class':
        return Award;
      case 'trainer':
        return User;
      case 'location':
        return Building2;
      case 'timeSlot':
        return Clock;
      case 'dayOfWeek':
        return Calendar;
      default:
        return BarChart3;
    }
  };

  const PerformanceCard: React.FC<{ item: PerformanceMetric; isTop?: boolean }> = ({ item, isTop = true }) => {
    const IconComponent = getTypeIcon(filter.type);
    const isAboveAverage = item.value > averageMetric;
    
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all duration-300 hover:shadow-lg border",
          isTop 
            ? isAboveAverage 
              ? "border-green-200 bg-green-50 hover:border-green-300" 
              : "border-blue-200 bg-blue-50 hover:border-blue-300"
            : "border-red-200 bg-red-50 hover:border-red-300",
          highlightTopPerformers && item.rank <= 3 && "ring-2 ring-yellow-400 ring-opacity-50"
        )}
        onClick={() => handleItemClick(item)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg",
                isTop 
                  ? isAboveAverage 
                    ? "bg-green-100 text-green-700" 
                    : "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
              )}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="text-sm font-medium text-slate-900 truncate">
                {item.name}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  item.rank <= 3 ? "bg-yellow-100 text-yellow-800 border-yellow-300" : "bg-slate-100 text-slate-600"
                )}
              >
                #{item.rank}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xl font-bold text-slate-900">
              {item.displayValue}
            </div>
            
            {showComparisons && (
              <div className="flex items-center justify-between text-xs">
                <div className="text-slate-500">
                  vs avg: {typeof averageMetric === 'number' ? formatPercentage(averageMetric) : averageMetric}
                </div>
                <div className={cn(
                  "flex items-center gap-1",
                  item.trend === 'up' ? "text-green-600" : item.trend === 'down' ? "text-red-600" : "text-slate-500"
                )}>
                  {item.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : item.trend === 'down' ? (
                    <ArrowDownRight className="w-3 h-3" />
                  ) : null}
                  {Math.abs(item.change).toFixed(1)}%
                </div>
              </div>
            )}
            
            <div className="text-xs text-slate-500">
              {item.details.totalSessions} sessions • {formatNumber(item.details.totalAttendance)} attendance
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Performance Analytics Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Analysis Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Analysis Type</Label>
              <Select 
                value={filter.type} 
                onValueChange={(value) => setFilter(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Class Analysis</SelectItem>
                  <SelectItem value="trainer">Trainer Analysis</SelectItem>
                  <SelectItem value="location">Location Analysis</SelectItem>
                  <SelectItem value="timeSlot">Time Slot Analysis</SelectItem>
                  <SelectItem value="dayOfWeek">Day of Week Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Metric */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Metric</Label>
              <Select 
                value={filter.metric} 
                onValueChange={(value) => setFilter(prev => ({ ...prev, metric: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fillRate">Fill Rate</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="consistency">Consistency</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Period */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Period</Label>
              <Select 
                value={filter.period} 
                onValueChange={(value) => setFilter(prev => ({ ...prev, period: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Period</SelectItem>
                  <SelectItem value="monthToMonth">Month to Month</SelectItem>
                  <SelectItem value="weekToWeek">Week to Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Sessions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Min Sessions</Label>
              <Select 
                value={filter.minSessions.toString()} 
                onValueChange={(value) => setFilter(prev => ({ ...prev, minSessions: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+ Sessions</SelectItem>
                  <SelectItem value="3">3+ Sessions</SelectItem>
                  <SelectItem value="5">5+ Sessions</SelectItem>
                  <SelectItem value="10">10+ Sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-comparisons"
                checked={showComparisons}
                onCheckedChange={setShowComparisons}
              />
              <Label htmlFor="show-comparisons" className="text-sm text-slate-700">
                Show Comparisons
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="highlight-top"
                checked={highlightTopPerformers}
                onCheckedChange={setHighlightTopPerformers}
              />
              <Label htmlFor="highlight-top" className="text-sm text-slate-700">
                Highlight Top 3
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Total Items</h3>
                <p className="text-2xl font-bold text-blue-800">{performanceData.length}</p>
              </div>
            </div>
            <p className="text-sm text-blue-700">
              {filter.type.charAt(0).toUpperCase() + filter.type.slice(1)}s being analyzed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                {React.createElement(getMetricIcon(filter.metric), { className: "w-6 h-6 text-green-600" })}
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Average {filter.metric}</h3>
                <p className="text-2xl font-bold text-green-800">
                  {typeof averageMetric === 'number' 
                    ? filter.metric.includes('Rate') || filter.metric === 'consistency'
                      ? formatPercentage(averageMetric)
                      : filter.metric === 'revenue'
                        ? formatCurrency(averageMetric)
                        : formatNumber(averageMetric)
                    : averageMetric}
                </p>
              </div>
            </div>
            <p className="text-sm text-green-700">
              Performance benchmark
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-900">Top Performer</h3>
                <p className="text-lg font-bold text-yellow-800 truncate">
                  {topPerformers[0]?.name || 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-sm text-yellow-700">
              {topPerformers[0]?.displayValue || 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUp className="w-5 h-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {topPerformers.map((item) => (
              <PerformanceCard key={item.id} item={item} isTop={true} />
            ))}
            {topPerformers.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No data available for current filters
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Performers */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <TrendingDown className="w-5 h-5" />
              Improvement Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {bottomPerformers.map((item) => (
              <PerformanceCard key={item.id} item={item} isTop={false} />
            ))}
            {bottomPerformers.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No data available for current filters
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};