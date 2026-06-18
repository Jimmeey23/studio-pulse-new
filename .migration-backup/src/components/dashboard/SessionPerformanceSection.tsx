import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Calendar, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { LocationReportMetrics } from '@/hooks/useLocationReportData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line
} from 'recharts';

interface SessionPerformanceSectionProps {
  metrics: LocationReportMetrics;
}

export const SessionPerformanceSection: React.FC<SessionPerformanceSectionProps> = ({
  metrics
}) => {
  // Class format data for chart
  const classFormatData = [
    { name: 'PowerCycle', sessions: metrics.powerCycleSessions, color: '#EF4444', percentage: (metrics.powerCycleSessions / metrics.totalSessions) * 100 },
    { name: 'Barre', sessions: metrics.barreSessions, color: '#EC4899', percentage: (metrics.barreSessions / metrics.totalSessions) * 100 },
    { name: 'Strength', sessions: metrics.strengthSessions, color: '#3B82F6', percentage: (metrics.strengthSessions / metrics.totalSessions) * 100 }
  ];

  // Sample utilization data over time
  const utilizationTrend = [
    { day: 'Mon', fillRate: 75, capacity: 120, checkIns: 90 },
    { day: 'Tue', fillRate: 68, capacity: 130, checkIns: 88 },
    { day: 'Wed', fillRate: 82, capacity: 140, checkIns: 115 },
    { day: 'Thu', fillRate: 71, capacity: 125, checkIns: 89 },
    { day: 'Fri', fillRate: 85, capacity: 110, checkIns: 94 },
    { day: 'Sat', fillRate: 92, capacity: 100, checkIns: 92 },
    { day: 'Sun', fillRate: 78, capacity: 80, checkIns: 62 }
  ];

  const sessionMetrics = [
    {
      title: 'Total Sessions',
      value: formatNumber(metrics.totalSessions),
      subValue: 'Classes conducted',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Check-ins',
      value: formatNumber(metrics.totalCheckIns),
      subValue: 'Attendees served',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Fill Rate',
      value: formatPercentage(metrics.fillRate),
      subValue: 'Capacity utilization',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Avg Class Size',
      value: formatNumber(metrics.avgClassSize),
      subValue: 'Students per session',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Late Cancellations',
      value: formatNumber(metrics.lateCancellations),
      subValue: 'Last minute cancels',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  const getUtilizationStatus = (fillRate: number) => {
    if (fillRate >= 85) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
    if (fillRate >= 70) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: TrendingUp };
    if (fillRate >= 50) return { status: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock };
    return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertCircle };
  };

  const utilizationStatus = getUtilizationStatus(metrics.fillRate);

  return (
    <div className="space-y-6">
      {/* Session Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {sessionMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className={`p-2 rounded-lg ${metric.bgColor} mb-4 w-fit`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                <p className="text-xs text-gray-500">{metric.subValue}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Utilization Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Capacity Utilization Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-6 rounded-lg ${utilizationStatus.bgColor} flex items-center justify-between`}>
            <div className="flex items-center">
              <utilizationStatus.icon className={`w-8 h-8 ${utilizationStatus.color} mr-4`} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.fillRate)}</p>
                <p className={`text-lg font-medium ${utilizationStatus.color}`}>{utilizationStatus.status}</p>
                <p className="text-sm text-gray-600">Overall capacity utilization</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Target: 75%+</p>
              <p className="text-xs text-gray-500">Industry benchmark</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Format Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Class Format Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={classFormatData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="sessions"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                >
                  {classFormatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} sessions`, 'Sessions']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {classFormatData.map((format, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: format.color }}
                    />
                    <span>{format.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{format.sessions} sessions</span>
                    <span className="text-gray-500 ml-2">({format.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Utilization Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Weekly Utilization Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={utilizationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'fillRate' ? `${value}%` : value,
                    name === 'fillRate' ? 'Fill Rate' : name === 'capacity' ? 'Total Capacity' : 'Check-ins'
                  ]} 
                />
                <Bar yAxisId="left" dataKey="capacity" fill="#E5E7EB" name="capacity" />
                <Bar yAxisId="left" dataKey="checkIns" fill="#3B82F6" name="checkIns" />
                <Line yAxisId="right" type="monotone" dataKey="fillRate" stroke="#EF4444" strokeWidth={3} name="fillRate" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              Performance Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-medium text-green-800">Most Popular Format</p>
                <p className="text-2xl font-bold text-green-600">
                  {classFormatData.reduce((max, format) => format.sessions > max.sessions ? format : max).name}
                </p>
                <p className="text-sm text-green-700">
                  {classFormatData.reduce((max, format) => format.sessions > max.sessions ? format : max).sessions} sessions
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800">Total Attendance</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(metrics.totalCheckIns)}</p>
                <p className="text-sm text-blue-700">Students served this period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              Optimization Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.fillRate < 70 && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="font-medium text-orange-800">Low Utilization</p>
                  <p className="text-sm text-orange-700">
                    Fill rate of {formatPercentage(metrics.fillRate)} is below optimal (75%+)
                  </p>
                </div>
              )}
              {metrics.lateCancellations > metrics.totalSessions * 0.1 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-800">High Cancellations</p>
                  <p className="text-sm text-red-700">
                    {metrics.lateCancellations} late cancellations impact class planning
                  </p>
                </div>
              )}
              {metrics.avgClassSize < 8 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-800">Small Class Sizes</p>
                  <p className="text-sm text-yellow-700">
                    Average {formatNumber(metrics.avgClassSize)} students per class
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Session Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalSessions)}</p>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-xs text-gray-500">Classes offered</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalCheckIns)}</p>
              <p className="text-sm text-gray-600">Total Attendance</p>
              <p className="text-xs text-gray-500">Student check-ins</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.fillRate)}</p>
              <p className="text-sm text-gray-600">Utilization Rate</p>
              <p className="text-xs text-gray-500">Capacity filled</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Activity className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.avgClassSize)}</p>
              <p className="text-sm text-gray-600">Avg Class Size</p>
              <p className="text-xs text-gray-500">Students per session</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionPerformanceSection;