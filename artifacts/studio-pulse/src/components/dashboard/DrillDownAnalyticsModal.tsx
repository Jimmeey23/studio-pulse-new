import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  X, TrendingUp, TrendingDown, Calendar, Users, DollarSign, 
  Target, Clock, MapPin, User, Award, BarChart3, Activity,
  Download, Share, Bookmark, ArrowLeft, ExternalLink
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface DrillDownAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    type?: string;
    metric?: string;
    sessions: SessionData[];
    breakdown?: any;
    performanceData?: any;
    [key: string]: any;
  };
}

interface TimeSeriesData {
  date: string;
  value: number;
  sessions: number;
  attendance: number;
  revenue: number;
}

export const DrillDownAnalyticsModal: React.FC<DrillDownAnalyticsModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Process session data for detailed analytics
  const analytics = useMemo(() => {
    if (!data?.sessions || data.sessions.length === 0) {
      return {
        summary: {
          totalSessions: 0,
          totalAttendance: 0,
          totalCapacity: 0,
          totalRevenue: 0,
          totalBookings: 0,
          totalCancellations: 0,
          fillRate: 0,
          classAverage: 0,
          revenuePerSession: 0,
          revenuePerAttendee: 0,
          cancellationRate: 0,
          bookingRate: 0,
          emptySessions: 0,
          fullSessions: 0
        },
        timeSeries: [],
        topSessions: [],
        patterns: {
          dayOfWeek: {},
          timeSlot: {},
          trainer: {}
        },
        recommendations: []
      };
    }

    const sessions = data.sessions;
    const totalSessions = sessions.length;
    const totalAttendance = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
    const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
    const totalBookings = sessions.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
    const totalCancellations = sessions.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);

    // Summary metrics
    const summary = {
      totalSessions,
      totalAttendance,
      totalCapacity,
      totalRevenue,
      totalBookings,
      totalCancellations,
      fillRate: totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0,
      classAverage: totalSessions > 0 ? totalAttendance / totalSessions : 0,
      revenuePerSession: totalSessions > 0 ? totalRevenue / totalSessions : 0,
      revenuePerAttendee: totalAttendance > 0 ? totalRevenue / totalAttendance : 0,
      cancellationRate: totalBookings > 0 ? (totalCancellations / totalBookings) * 100 : 0,
      bookingRate: totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0,
      emptySessions: sessions.filter(s => (s.checkedInCount || 0) === 0).length,
      fullSessions: sessions.filter(s => (s.checkedInCount || 0) >= (s.capacity || 0)).length
    };

    // Time series data (group by date)
    const timeSeriesMap = sessions.reduce((acc, session) => {
      const date = session.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          value: 0,
          sessions: 0,
          attendance: 0,
          revenue: 0
        };
      }
      acc[date].sessions += 1;
      acc[date].attendance += session.checkedInCount || 0;
      acc[date].revenue += session.totalPaid || 0;
      acc[date].value = acc[date].attendance; // Default to attendance
      return acc;
    }, {} as Record<string, TimeSeriesData>);

    const timeSeries = Object.values(timeSeriesMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Top performing sessions (show all, sorted by fill rate)
    const topSessions = [...sessions]
      .sort((a, b) => {
        const aFillRate = (a.capacity || 0) > 0 ? ((a.checkedInCount || 0) / (a.capacity || 0)) * 100 : 0;
        const bFillRate = (b.capacity || 0) > 0 ? ((b.checkedInCount || 0) / (b.capacity || 0)) * 100 : 0;
        return bFillRate - aFillRate;
      });
      // Removed .slice(0, 10) to show all sessions

    // Pattern analysis
    const patterns = {
      dayOfWeek: sessions.reduce((acc, session) => {
        const day = session.dayOfWeek || 'Unknown';
        if (!acc[day]) acc[day] = { sessions: 0, attendance: 0, revenue: 0 };
        acc[day].sessions += 1;
        acc[day].attendance += session.checkedInCount || 0;
        acc[day].revenue += session.totalPaid || 0;
        return acc;
      }, {} as Record<string, any>),
      timeSlot: sessions.reduce((acc, session) => {
        const time = session.time || 'Unknown';
        if (!acc[time]) acc[time] = { sessions: 0, attendance: 0, revenue: 0 };
        acc[time].sessions += 1;
        acc[time].attendance += session.checkedInCount || 0;
        acc[time].revenue += session.totalPaid || 0;
        return acc;
      }, {} as Record<string, any>),
      trainer: sessions.reduce((acc, session) => {
        const trainer = session.trainerName || 'Unknown';
        if (!acc[trainer]) acc[trainer] = { sessions: 0, attendance: 0, revenue: 0 };
        acc[trainer].sessions += 1;
        acc[trainer].attendance += session.checkedInCount || 0;
        acc[trainer].revenue += session.totalPaid || 0;
        return acc;
      }, {} as Record<string, any>)
    };

    // Generate recommendations
    const recommendations = [];
    
    if (summary.fillRate < 60) {
      recommendations.push({
        type: 'improvement',
        title: 'Low Fill Rate Detected',
        description: 'Consider reducing class capacity or improving marketing for this segment.',
        impact: 'High',
        icon: Target
      });
    }
    
    if (summary.emptySessions > totalSessions * 0.1) {
      recommendations.push({
        type: 'warning',
        title: 'High Empty Session Rate',
        description: 'Too many sessions with zero attendance. Review scheduling strategy.',
        impact: 'Medium',
        icon: Calendar
      });
    }
    
    if (summary.cancellationRate > 15) {
      recommendations.push({
        type: 'attention',
        title: 'High Cancellation Rate',
        description: 'Consider improving cancellation policies or class appeal.',
        impact: 'Medium',
        icon: Clock
      });
    }

    if (summary.revenuePerSession > totalRevenue / totalSessions * 1.2) {
      recommendations.push({
        type: 'success',
        title: 'Strong Revenue Performance',
        description: 'This segment is performing above average in revenue generation.',
        impact: 'Positive',
        icon: DollarSign
      });
    }

    return {
      summary,
      timeSeries,
      topSessions,
      patterns,
      recommendations
    };
  }, [data]);

  if (!isOpen || !data) return null;

  const MetricCard: React.FC<{ 
    title: string; 
    value: string; 
    subtitle?: string; 
    icon: React.ComponentType<any>;
    trend?: 'up' | 'down' | 'neutral';
    change?: number;
  }> = ({ title, value, subtitle, icon: Icon, trend, change }) => (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Icon className="w-4 h-4 text-slate-600" />
          </div>
          {trend && change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              trend === 'up' ? "text-green-600" : trend === 'down' ? "text-red-600" : "text-slate-600"
            )}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
               trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-600">{title}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {data.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Sessions"
                value={formatNumber(analytics.summary.totalSessions)}
                subtitle={`${analytics.summary.emptySessions} empty`}
                icon={Calendar}
              />
              <MetricCard
                title="Total Attendance"
                value={formatNumber(analytics.summary.totalAttendance)}
                subtitle={`${formatNumber(analytics.summary.classAverage)} avg per class`}
                icon={Users}
              />
              <MetricCard
                title="Earned Revenue"
                value={formatCurrency(analytics.summary.totalRevenue)}
                subtitle={`${formatCurrency(analytics.summary.revenuePerSession)} per session`}
                icon={DollarSign}
              />
              <MetricCard
                title="Fill Rate"
                value={formatPercentage(analytics.summary.fillRate)}
                subtitle={`${analytics.summary.fullSessions} full sessions`}
                icon={Target}
              />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Booking Rate"
                value={formatPercentage(analytics.summary.bookingRate)}
                subtitle={`${formatNumber(analytics.summary.totalBookings)} bookings`}
                icon={BarChart3}
              />
              <MetricCard
                title="Cancellation Rate"
                value={formatPercentage(analytics.summary.cancellationRate)}
                subtitle={`${formatNumber(analytics.summary.totalCancellations)} cancellations`}
                icon={Clock}
              />
              <MetricCard
                title="Revenue per Attendee"
                value={formatCurrency(analytics.summary.revenuePerAttendee)}
                subtitle="Average customer value"
                icon={Activity}
              />
              <MetricCard
                title="Capacity Utilization"
                value={formatPercentage(analytics.summary.fillRate)}
                subtitle={`${formatNumber(analytics.summary.totalCapacity)} total capacity`}
                icon={Target}
              />
            </div>

            {/* Performance Summary */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-800">
                      {analytics.summary.fillRate > 75 ? 'Excellent' : 
                       analytics.summary.fillRate > 60 ? 'Good' : 
                       analytics.summary.fillRate > 40 ? 'Average' : 'Needs Improvement'}
                    </div>
                    <div className="text-sm text-blue-600">Overall Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-800">
                      {formatNumber(analytics.timeSeries.length)}
                    </div>
                    <div className="text-sm text-blue-600">Days Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-800">
                      {formatNumber(analytics.summary.classAverage)}
                    </div>
                    <div className="text-sm text-blue-600">Avg Class Size</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Trainer</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Fill Rate</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topSessions.map((session, index) => (
                      <TableRow key={index}>
                        <TableCell>{session.date}</TableCell>
                        <TableCell className="font-medium">{session.cleanedClass}</TableCell>
                        <TableCell>{session.trainerName}</TableCell>
                        <TableCell>{session.time}</TableCell>
                        <TableCell>{session.location}</TableCell>
                        <TableCell>{session.checkedInCount || 0}</TableCell>
                        <TableCell>{session.capacity || 0}</TableCell>
                        <TableCell>
                          <Badge variant={
                            ((session.checkedInCount || 0) / (session.capacity || 1)) > 0.8 ? 'default' :
                            ((session.checkedInCount || 0) / (session.capacity || 1)) > 0.6 ? 'secondary' : 'destructive'
                          }>
                            {formatPercentage(
                              (session.capacity || 0) > 0 ? 
                              ((session.checkedInCount || 0) / (session.capacity || 0)) * 100 : 0
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(session.totalPaid || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Day of Week Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Day of Week Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(analytics.patterns.dayOfWeek)
                    .sort(([,a], [,b]) => (b as any).attendance - (a as any).attendance)
                    .map(([day, stats]) => (
                    <div key={day} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{day}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatNumber((stats as any).attendance)}</div>
                        <div className="text-xs text-slate-500">{(stats as any).sessions} sessions</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Time Slot Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Time Slot Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                  {Object.entries(analytics.patterns.timeSlot)
                    .sort(([,a], [,b]) => (b as any).attendance - (a as any).attendance)
                    .map(([time, stats]) => (
                    <div key={time} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{time}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatNumber((stats as any).attendance)}</div>
                        <div className="text-xs text-slate-500">{(stats as any).sessions} sessions</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Trainer Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Trainer Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                  {Object.entries(analytics.patterns.trainer)
                    .sort(([,a], [,b]) => (b as any).attendance - (a as any).attendance)
                    .map(([trainer, stats]) => (
                    <div key={trainer} className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate">{trainer}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatNumber((stats as any).attendance)}</div>
                        <div className="text-xs text-slate-500">{(stats as any).sessions} sessions</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {analytics.timeSeries.map((point, index) => (
                    <div key={point.date} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">{point.date}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-bold">{point.sessions}</div>
                          <div className="text-slate-500">Sessions</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{point.attendance}</div>
                          <div className="text-slate-500">Attendance</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{formatCurrency(point.revenue)}</div>
                          <div className="text-slate-500">Revenue</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6 mt-6">
            <div className="space-y-4">
              {analytics.recommendations.map((rec, index) => (
                <Card key={index} className={cn(
                  "border-l-4",
                  rec.type === 'success' ? "border-l-green-500 bg-green-50" :
                  rec.type === 'warning' ? "border-l-yellow-500 bg-yellow-50" :
                  rec.type === 'improvement' ? "border-l-blue-500 bg-blue-50" :
                  "border-l-red-500 bg-red-50"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        rec.type === 'success' ? "bg-green-100 text-green-700" :
                        rec.type === 'warning' ? "bg-yellow-100 text-yellow-700" :
                        rec.type === 'improvement' ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        <rec.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {rec.impact} Impact
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{rec.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {analytics.recommendations.length === 0 && (
                <Card className="border-l-4 border-l-green-500 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Award className="w-4 h-4 text-green-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">Great Performance!</h4>
                        <p className="text-sm text-slate-600">
                          This segment is performing well across all key metrics. Keep up the excellent work!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};