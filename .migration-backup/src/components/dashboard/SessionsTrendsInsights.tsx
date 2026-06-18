
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Target,
  Users,
  Clock,
  Star,
  Zap,
  BarChart3
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SessionsTrendsInsightsProps {
  data: SessionData[];
}

export const SessionsTrendsInsights: React.FC<SessionsTrendsInsightsProps> = ({ data }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  const trendsAnalysis = useMemo(() => {
    // Group data by time periods for trend analysis
    const timeGroups = data.reduce((acc, session) => {
      if (!session.date) return acc;
      
      const date = new Date(session.date);
      let key: string;
      
      if (timeframe === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (timeframe === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
      }
      
      if (!acc[key]) {
        acc[key] = {
          period: key,
          sessions: 0,
          attendees: 0,
          revenue: 0,
          fillRate: 0,
          lateCancellations: 0,
          totalCapacity: 0
        };
      }
      
      acc[key].sessions++;
      acc[key].attendees += session.checkedInCount;
      acc[key].revenue += session.totalPaid;
      acc[key].lateCancellations += session.lateCancelledCount;
      acc[key].totalCapacity += session.capacity;
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate trends and insights
    const periods = Object.values(timeGroups)
      .map((period: any) => ({
        ...period,
        fillRate: period.totalCapacity > 0 ? (period.attendees / period.totalCapacity) * 100 : 0,
        avgRevenuePerSession: period.sessions > 0 ? period.revenue / period.sessions : 0,
        cancellationRate: period.sessions > 0 ? (period.lateCancellations / period.sessions) * 100 : 0
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return periods;
  }, [data, timeframe]);

  const insights = useMemo(() => {
    const insights = [];
    
    // Attendance trend analysis
    if (trendsAnalysis.length >= 2) {
      const recent = trendsAnalysis[trendsAnalysis.length - 1];
      const previous = trendsAnalysis[trendsAnalysis.length - 2];
      
      const attendeeChange = ((recent.attendees - previous.attendees) / previous.attendees) * 100;
      const revenueChange = ((recent.revenue - previous.revenue) / previous.revenue) * 100;
      const fillRateChange = recent.fillRate - previous.fillRate;
      
      if (attendeeChange > 10) {
        insights.push({
          type: 'positive',
          icon: TrendingUp,
          title: 'Strong Attendance Growth',
          description: `Attendance increased by ${attendeeChange.toFixed(1)}% in the latest period`,
          metric: `+${formatNumber(recent.attendees - previous.attendees)} attendees`,
          priority: 'high'
        });
      } else if (attendeeChange < -10) {
        insights.push({
          type: 'negative',
          icon: TrendingDown,
          title: 'Declining Attendance',
          description: `Attendance decreased by ${Math.abs(attendeeChange).toFixed(1)}% in the latest period`,
          metric: `${formatNumber(recent.attendees - previous.attendees)} attendees`,
          priority: 'high'
        });
      }
      
      if (revenueChange > 15) {
        insights.push({
          type: 'positive',
          icon: Target,
          title: 'Revenue Surge',
          description: `Revenue grew by ${revenueChange.toFixed(1)}% compared to last period`,
          metric: formatCurrency(recent.revenue - previous.revenue),
          priority: 'high'
        });
      }
      
      if (fillRateChange > 5) {
        insights.push({
          type: 'positive',
          icon: Star,
          title: 'Improved Capacity Utilization',
          description: `Fill rate improved by ${fillRateChange.toFixed(1)} percentage points`,
          metric: `${recent.fillRate.toFixed(1)}% current fill rate`,
          priority: 'medium'
        });
      }
    }
    
    // Class performance insights
    const classPerformance = data.reduce((acc, session) => {
      const key = session.cleanedClass || 'Unknown';
      if (!acc[key]) {
        acc[key] = { sessions: 0, attendees: 0, revenue: 0, capacity: 0 };
      }
      acc[key].sessions++;
      acc[key].attendees += session.checkedInCount;
      acc[key].revenue += session.totalPaid;
      acc[key].capacity += session.capacity;
      return acc;
    }, {} as Record<string, any>);
    
    const topClass = Object.entries(classPerformance)
      .map(([name, stats]: [string, any]) => ({
        name,
        fillRate: stats.capacity > 0 ? (stats.attendees / stats.capacity) * 100 : 0,
        ...stats
      }))
      .sort((a, b) => b.fillRate - a.fillRate)[0];
      
    if (topClass && topClass.fillRate > 80) {
      insights.push({
        type: 'positive',
        icon: Zap,
        title: 'High-Performing Class Identified',
        description: `${topClass.name} consistently achieves ${topClass.fillRate.toFixed(1)}% capacity`,
        metric: `${topClass.sessions} sessions analyzed`,
        priority: 'medium'
      });
    }
    
    // Time slot analysis
    const timeSlotPerformance = data.reduce((acc, session) => {
      const key = session.time || 'Unknown';
      if (!acc[key]) {
        acc[key] = { sessions: 0, attendees: 0, capacity: 0 };
      }
      acc[key].sessions++;
      acc[key].attendees += session.checkedInCount;
      acc[key].capacity += session.capacity;
      return acc;
    }, {} as Record<string, any>);
    
    const peakTime = Object.entries(timeSlotPerformance)
      .map(([time, stats]: [string, any]) => ({
        time,
        fillRate: stats.capacity > 0 ? (stats.attendees / stats.capacity) * 100 : 0,
        ...stats
      }))
      .sort((a, b) => b.fillRate - a.fillRate)[0];
      
    if (peakTime) {
      insights.push({
        type: 'info',
        icon: Clock,
        title: 'Peak Performance Time Slot',
        description: `${peakTime.time} shows highest demand with ${peakTime.fillRate.toFixed(1)}% fill rate`,
        metric: `${peakTime.sessions} sessions`,
        priority: 'low'
      });
    }
    
    // Cancellation rate analysis
    const totalLateCancellations = data.reduce((sum, session) => sum + session.lateCancelledCount, 0);
    const totalSessions = data.length;
    const avgCancellationRate = totalSessions > 0 ? (totalLateCancellations / totalSessions) * 100 : 0;
    
    if (avgCancellationRate > 15) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'High Late Cancellation Rate',
        description: `${avgCancellationRate.toFixed(1)}% late cancellation rate needs attention`,
        metric: `${totalLateCancellations} cancellations`,
        priority: 'high'
      });
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    });
  }, [data, trendsAnalysis]);

  const patternAnalysis = useMemo(() => {
    // Day of week patterns
    const dayPatterns = data.reduce((acc, session) => {
      const day = session.dayOfWeek || 'Unknown';
      if (!acc[day]) {
        acc[day] = { sessions: 0, attendees: 0, revenue: 0 };
      }
      acc[day].sessions++;
      acc[day].attendees += session.checkedInCount;
      acc[day].revenue += session.totalPaid;
      return acc;
    }, {} as Record<string, any>);

    const dayTrends = Object.entries(dayPatterns)
      .map(([day, stats]: [string, any]) => ({
        day,
        avgAttendees: stats.sessions > 0 ? stats.attendees / stats.sessions : 0,
        ...stats
      }))
      .sort((a, b) => b.avgAttendees - a.avgAttendees);

    // Monthly patterns
    const monthlyTrends = trendsAnalysis.map(period => ({
      ...period,
      attendeesPerSession: period.sessions > 0 ? period.attendees / period.sessions : 0
    }));

    return { dayTrends, monthlyTrends };
  }, [data, trendsAnalysis]);

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            AI-Powered Trends & Insights
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={timeframe === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('week')}
            >
              Weekly
            </Button>
            <Button
              variant={timeframe === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('month')}
            >
              Monthly
            </Button>
            <Button
              variant={timeframe === 'quarter' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('quarter')}
            >
              Quarterly
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">Key Insights</TabsTrigger>
            <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
            <TabsTrigger value="patterns">Pattern Discovery</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, index) => (
                <Card key={index} className={`border-l-4 ${
                  insight.type === 'positive' ? 'border-l-green-500 bg-green-50' :
                  insight.type === 'negative' ? 'border-l-red-500 bg-red-50' :
                  insight.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                  'border-l-blue-500 bg-blue-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <insight.icon className={`w-5 h-5 mt-1 ${
                        insight.type === 'positive' ? 'text-green-600' :
                        insight.type === 'negative' ? 'text-red-600' :
                        insight.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                          <Badge variant={
                            insight.priority === 'high' ? 'destructive' :
                            insight.priority === 'medium' ? 'default' : 'secondary'
                          } className="text-xs">
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                        <p className="text-sm font-medium text-gray-900">{insight.metric}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="attendees" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="sessions" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendsAnalysis.slice(-3).map((period, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">{period.period}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Fill Rate:</span>
                        <span className="font-medium">{period.fillRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Revenue/Session:</span>
                        <span className="font-medium">{formatCurrency(period.avgRevenuePerSession)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cancellation Rate:</span>
                        <span className="font-medium">{period.cancellationRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Best Performing Days</h3>
                <div className="space-y-2">
                  {patternAnalysis.dayTrends.slice(0, 7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{day.day}</span>
                      <div className="text-right">
                        <p className="font-semibold">{day.avgAttendees.toFixed(1)} avg attendees</p>
                        <p className="text-sm text-gray-600">{day.sessions} sessions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Monthly Performance Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={patternAnalysis.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="fillRate" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
