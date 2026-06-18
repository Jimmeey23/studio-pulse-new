
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Target, 
  AlertTriangle,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { BarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

interface SessionsForecastingProps {
  data: SessionData[];
}

export const SessionsForecasting: React.FC<SessionsForecastingProps> = ({ data }) => {
  const [forecastPeriod, setForecastPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const forecastData = useMemo(() => {
    // Group data by month for trend analysis
    const monthlyData = data.reduce((acc, session) => {
      if (!session.date) return acc;
      
      const date = new Date(session.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          totalSessions: 0,
          totalAttendees: 0,
          totalRevenue: 0,
          avgFillRate: 0,
          uniqueClasses: new Set(),
          trainerHours: 0
        };
      }
      
      acc[monthKey].totalSessions++;
      acc[monthKey].totalAttendees += session.checkedInCount;
      acc[monthKey].totalRevenue += session.totalPaid;
      acc[monthKey].uniqueClasses.add(session.cleanedClass);
      acc[monthKey].trainerHours += 1; // Assuming each session is 1 hour
      
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and calculate fill rates
    const monthlyArray = Object.values(monthlyData).map((month: any) => ({
      ...month,
      uniqueClasses: month.uniqueClasses.size,
      avgFillRate: month.totalSessions > 0 ? (month.totalAttendees / (month.totalSessions * 20)) * 100 : 0 // Assuming avg capacity of 20
    })).sort((a, b) => a.month.localeCompare(b.month));

    // Simple linear regression for forecasting
    const forecast = (values: number[], periods: number) => {
      const n = values.length;
      const sumX = (n * (n + 1)) / 2;
      const sumY = values.reduce((sum, val) => sum + val, 0);
      const sumXY = values.reduce((sum, val, i) => sum + val * (i + 1), 0);
      const sumXX = (n * (n + 1) * (2 * n + 1)) / 6;
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      return Array.from({ length: periods }, (_, i) => 
        Math.max(0, slope * (n + i + 1) + intercept)
      );
    };

    const attendeeValues = monthlyArray.map(m => m.totalAttendees);
    const revenueValues = monthlyArray.map(m => m.totalRevenue);
    const sessionValues = monthlyArray.map(m => m.totalSessions);

    const forecastPeriods = forecastPeriod === 'week' ? 4 : forecastPeriod === 'month' ? 3 : 12;
    
    const attendeeForecast = forecast(attendeeValues, forecastPeriods);
    const revenueForecast = forecast(revenueValues, forecastPeriods);
    const sessionForecast = forecast(sessionValues, forecastPeriods);

    return {
      historical: monthlyArray,
      forecast: {
        attendees: attendeeForecast,
        revenue: revenueForecast,
        sessions: sessionForecast
      }
    };
  }, [data, forecastPeriod]);

  const demandPrediction = useMemo(() => {
    // Analyze demand patterns by day of week and time
    const patterns = data.reduce((acc, session) => {
      const key = `${session.dayOfWeek}-${session.time}`;
      if (!acc[key]) {
        acc[key] = {
          dayOfWeek: session.dayOfWeek,
          time: session.time,
          sessions: 0,
          totalAttendees: 0,
          totalCapacity: 0,
          avgDemand: 0
        };
      }
      
      acc[key].sessions++;
      acc[key].totalAttendees += session.checkedInCount;
      acc[key].totalCapacity += session.capacity;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(patterns)
      .map((pattern: any) => ({
        ...pattern,
        avgDemand: pattern.totalCapacity > 0 ? (pattern.totalAttendees / pattern.totalCapacity) * 100 : 0,
        demandLevel: pattern.totalCapacity > 0 ? 
          (pattern.totalAttendees / pattern.totalCapacity) > 0.8 ? 'High' :
          (pattern.totalAttendees / pattern.totalCapacity) > 0.5 ? 'Medium' : 'Low' : 'Unknown'
      }))
      .sort((a, b) => b.avgDemand - a.avgDemand);
  }, [data]);

  const capacityOptimization = useMemo(() => {
    const classAnalysis = data.reduce((acc, session) => {
      const key = session.cleanedClass || 'Unknown';
      if (!acc[key]) {
        acc[key] = {
          className: key,
          sessions: 0,
          totalAttendees: 0,
          totalCapacity: 0,
          revenue: 0,
          avgFillRate: 0,
          recommendation: ''
        };
      }
      
      acc[key].sessions++;
      acc[key].totalAttendees += session.checkedInCount;
      acc[key].totalCapacity += session.capacity;
      acc[key].revenue += session.totalPaid;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(classAnalysis)
      .map((analysis: any) => {
        const fillRate = analysis.totalCapacity > 0 ? (analysis.totalAttendees / analysis.totalCapacity) * 100 : 0;
        let recommendation = '';
        
        if (fillRate > 90) recommendation = 'Increase capacity or add sessions';
        else if (fillRate < 30) recommendation = 'Reduce capacity or improve marketing';
        else if (fillRate < 60) recommendation = 'Optimize scheduling or pricing';
        else recommendation = 'Maintain current capacity';
        
        return {
          ...analysis,
          avgFillRate: fillRate,
          recommendation
        };
      })
      .sort((a, b) => b.avgFillRate - a.avgFillRate);
  }, [data]);

  const seasonalTrends = useMemo(() => {
    const monthlyTrends = data.reduce((acc, session) => {
      if (!session.date) return acc;
      
      const date = new Date(session.date);
      const month = date.toLocaleString('default', { month: 'long' });
      
      if (!acc[month]) {
        acc[month] = {
          month,
          sessions: 0,
          attendees: 0,
          revenue: 0
        };
      }
      
      acc[month].sessions++;
      acc[month].attendees += session.checkedInCount;
      acc[month].revenue += session.totalPaid;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyTrends);
  }, [data]);

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Session Forecasting & Demand Prediction
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={forecastPeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setForecastPeriod('week')}
            >
              4 Weeks
            </Button>
            <Button
              variant={forecastPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setForecastPeriod('month')}
            >
              3 Months
            </Button>
            <Button
              variant={forecastPeriod === 'quarter' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setForecastPeriod('quarter')}
            >
              1 Year
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="forecast" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="forecast">Attendance Forecast</TabsTrigger>
            <TabsTrigger value="demand">Demand Patterns</TabsTrigger>
            <TabsTrigger value="capacity">Capacity Analysis</TabsTrigger>
            <TabsTrigger value="seasonal">Seasonal Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Projected Attendees</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(forecastData.forecast.attendees.reduce((sum, val) => sum + val, 0))}
                  </p>
                  <p className="text-xs text-gray-500">Next {forecastPeriod}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Projected Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(forecastData.forecast.revenue.reduce((sum, val) => sum + val, 0))}
                  </p>
                  <p className="text-xs text-gray-500">Next {forecastPeriod}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Projected Sessions</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatNumber(forecastData.forecast.sessions.reduce((sum, val) => sum + val, 0))}
                  </p>
                  <p className="text-xs text-gray-500">Next {forecastPeriod}</p>
                </CardContent>
              </Card>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={forecastData.historical}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="totalAttendees" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="totalRevenue" stroke="#10B981" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="demand" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">High Demand Time Slots</h3>
                <div className="space-y-2">
                  {demandPrediction.slice(0, 5).map((slot, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{slot.dayOfWeek} {slot.time}</span>
                        <p className="text-sm text-gray-600">{slot.sessions} sessions</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={slot.demandLevel === 'High' ? 'destructive' : slot.demandLevel === 'Medium' ? 'default' : 'secondary'}>
                          {slot.avgDemand.toFixed(1)}%
                        </Badge>
                        <p className="text-xs text-gray-500">{slot.demandLevel} demand</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demandPrediction.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgDemand" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="capacity" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Capacity Optimization Recommendations</h3>
              {capacityOptimization.slice(0, 8).map((analysis, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{analysis.className}</span>
                    <Badge variant={analysis.avgFillRate > 80 ? 'destructive' : analysis.avgFillRate > 60 ? 'default' : 'secondary'}>
                      {analysis.avgFillRate.toFixed(1)}% filled
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{analysis.sessions} sessions</span>
                    <span>{formatNumber(analysis.totalAttendees)} attendees</span>
                    <span>{formatCurrency(analysis.revenue)} revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">{analysis.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="seasonal" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attendees" fill="#3B82F6" name="Attendees" />
                  <Bar dataKey="sessions" fill="#10B981" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {seasonalTrends.slice(0, 3).map((trend, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{trend.month}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Sessions:</span>
                        <span>{trend.sessions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Attendees:</span>
                        <span>{formatNumber(trend.attendees)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span>{formatCurrency(trend.revenue)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
