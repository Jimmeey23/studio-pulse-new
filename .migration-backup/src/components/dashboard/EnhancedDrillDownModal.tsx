import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTrainerImage, getTrainerInitials } from '@/components/ui/TrainerAvatar';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Calendar,
  Award,
  Activity,
  Clock,
  Star,
  Download,
  Share2,
  MapPin,
  X,
  ChevronRight,
  Sparkles,
  CreditCard,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface EnhancedDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerName: string;
  trainerData: any;
  initialTab?: string;
  highlightMetric?: string | null;
  sessionsData?: any[];
  payrollData?: any[];
  checkinsData?: any[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];

export function EnhancedDrillDownModal({
  isOpen,
  onClose,
  trainerName,
  trainerData,
  initialTab = 'overview',
  highlightMetric = null,
  sessionsData = [],
  payrollData = [],
  checkinsData = [],
}: EnhancedDrillDownModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Set active tab when modal opens with initialTab
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Auto-scroll to highlighted metric
  useEffect(() => {
    if (highlightMetric && contentRefs.current[highlightMetric]) {
      const element = contentRefs.current[highlightMetric];
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      element?.classList.add('ring-2', 'ring-yellow-400');
      setTimeout(() => {
        element?.classList.remove('ring-2', 'ring-yellow-400');
      }, 3000);
    }
  }, [highlightMetric, activeTab]);

  // Process individual session data from trainerData.individualSessions
  const processedMetrics = useMemo(() => {
    if (!trainerData) {
      console.warn('⚠️ No trainer data provided to modal');
      return {
        totals: { revenue: 0, sessions: 0, customers: 0, avgPerSession: 0, emptyClasses: 0 },
        classes: [],
        monthly: [],
        byLocation: [],
        byClassType: [],
        timeDistribution: [],
        topClients: [],
        paymentMethods: [],
        newVsReturning: { new: 0, returning: 0 },
        performanceData: [],
      };
    }

    const sessions = trainerData.individualSessions || [];
    const checkins = trainerData.checkins || [];

    if (sessions.length === 0) {
      console.warn('⚠️ No individual sessions found, using aggregate data');
      
      // Try to create some mock session data from aggregate if available
      const mockSessions = [];
      if (trainerData.totalSessions > 0) {
        // Create placeholder sessions based on aggregate data
        for (let i = 0; i < Math.min(trainerData.totalSessions, 10); i++) {
          mockSessions.push({
            className: 'Class Data',
            location: trainerData.location || selectedLocation || 'Studio',
            date: 'N/A',
            monthYear: 'N/A',
            time: 'N/A',
            dayOfWeek: 'N/A',
            revenue: (trainerData.totalRevenue || trainerData.totalPaid || 0) / (trainerData.totalSessions || 1),
            customers: Math.round((trainerData.totalCustomers || 0) / (trainerData.totalSessions || 1)),
            sessionId: `mock-${i}`,
            totalPaid: (trainerData.totalRevenue || trainerData.totalPaid || 0) / (trainerData.totalSessions || 1),
            totalCustomers: Math.round((trainerData.totalCustomers || 0) / (trainerData.totalSessions || 1))
          });
        }
      }
      
      return {
        totals: {
          revenue: trainerData.totalRevenue || trainerData.totalPaid || 0,
          sessions: trainerData.totalSessions || 0,
          customers: trainerData.totalCustomers || 0,
          avgPerSession: trainerData.efficiency || ((trainerData.totalRevenue || trainerData.totalPaid || 0) / (trainerData.totalSessions || 1)),
          emptyClasses: trainerData.emptySessions || 0,
        },
        classes: mockSessions,
        monthly: trainerData.totalSessions > 0 ? [{
          month: 'Aggregate Data',
          revenue: trainerData.totalRevenue || trainerData.totalPaid || 0,
          sessions: trainerData.totalSessions || 0,
          customers: trainerData.totalCustomers || 0
        }] : [],
        byLocation: trainerData.location ? [{
          name: trainerData.location,
          revenue: trainerData.totalRevenue || trainerData.totalPaid || 0,
          sessions: trainerData.totalSessions || 0,
          customers: trainerData.totalCustomers || 0
        }] : [],
        byClassType: [{
          name: 'Class Data',
          value: trainerData.totalRevenue || trainerData.totalPaid || 0,
          sessions: trainerData.totalSessions || 0,
          customers: trainerData.totalCustomers || 0
        }],
        timeDistribution: [],
        topClients: [],
        paymentMethods: [],
        newVsReturning: { new: 0, returning: 0 },
        performanceData: [
          { metric: 'Revenue', value: Math.min(((trainerData.totalRevenue || trainerData.totalPaid || 0) / (trainerData.totalSessions || 1) / 2000) * 100, 100), fullMark: 100 },
          { metric: 'Attendance', value: Math.min(((trainerData.totalCustomers || 0) / (trainerData.totalSessions || 1) / 15) * 100, 100), fullMark: 100 },
          { metric: 'Consistency', value: Math.min((trainerData.totalSessions || 0) / 20 * 100, 100), fullMark: 100 },
          { metric: 'Engagement', value: Math.min((((trainerData.totalSessions || 0) - (trainerData.emptySessions || 0)) / (trainerData.totalSessions || 1)) * 100, 100), fullMark: 100 }
        ],
      };
    }

    // Calculate totals with multiple field name support
    const totals = sessions.reduce(
      (acc: any, session: any) => {
        // Handle different revenue field names
        const revenue = parseFloat(
          session.totalPaid || 
          session.revenue || 
          session.paid || 
          session.amount || 
          0
        );
        
        // Handle different customer count field names  
        const customers = parseInt(
          session.totalCustomers || 
          session.customers || 
          session.attendees ||
          session.checkedInCount ||
          session.bookedCount ||
          0
        );
        
        acc.revenue += revenue;
        acc.sessions += 1;
        acc.customers += customers;
        if (customers === 0) acc.emptyClasses += 1;
        return acc;
      },
      { revenue: 0, sessions: 0, customers: 0, emptyClasses: 0 }
    );

    totals.avgPerSession = totals.sessions > 0 ? totals.revenue / totals.sessions : 0;

    // Group by month with flexible field handling
    const monthlyMap = new Map();
    sessions.forEach((session: any) => {
      const month = session.monthYear || session.month || session.date?.substring(0, 7) || 'Unknown';
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { revenue: 0, sessions: 0, customers: 0 });
      }
      const data = monthlyMap.get(month);
      const revenue = parseFloat(
        session.totalPaid || 
        session.revenue || 
        session.paid || 
        session.amount || 
        0
      );
      const customers = parseInt(
        session.totalCustomers || 
        session.customers || 
        session.attendees ||
        session.checkedInCount ||
        session.bookedCount ||
        0
      );
      data.revenue += revenue;
      data.sessions += 1;
      data.customers += customers;
    });

    const monthly = Array.from(monthlyMap.entries())
      .map(([month, data]: any) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Group by location with flexible field handling
    const locationMap = new Map();
    sessions.forEach((session: any) => {
      const location = session.location || session.studio || session.venue || 'Unknown';
      if (!locationMap.has(location)) {
        locationMap.set(location, { name: location, revenue: 0, sessions: 0, customers: 0 });
      }
      const data = locationMap.get(location);
      const revenue = parseFloat(
        session.totalPaid || 
        session.revenue || 
        session.paid || 
        session.amount || 
        0
      );
      const customers = parseInt(
        session.totalCustomers || 
        session.customers || 
        session.attendees ||
        session.checkedInCount ||
        session.bookedCount ||
        0
      );
      data.revenue += revenue;
      data.sessions += 1;
      data.customers += customers;
    });

    const byLocation = Array.from(locationMap.values());

    // Group by class type with flexible field handling
    const classTypeMap = new Map();
    sessions.forEach((session: any) => {
      const classType = session.cleanedClass || session.className || session.sessionName || session.classType || session.class || 'Unknown';
      if (!classTypeMap.has(classType)) {
        classTypeMap.set(classType, { name: classType, value: 0, sessions: 0, customers: 0 });
      }
      const data = classTypeMap.get(classType);
      const revenue = parseFloat(
        session.totalPaid || 
        session.revenue || 
        session.paid || 
        session.amount || 
        0
      );
      const customers = parseInt(
        session.totalCustomers || 
        session.customers || 
        session.attendees ||
        session.checkedInCount ||
        session.bookedCount ||
        0
      );
      data.value += revenue;
      data.sessions += 1;
      data.customers += customers;
    });

    const byClassType = Array.from(classTypeMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Time distribution with flexible field handling
    const timeMap = new Map();
    sessions.forEach((session: any) => {
      const time = session.time || session.classTime || session.startTime || session.scheduledTime || 'Unknown';
      const hour = time && time.includes(':') ? time.split(':')[0] : (time || 'Unknown');
      if (!timeMap.has(hour)) {
        timeMap.set(hour, { time: hour, count: 0 });
      }
      timeMap.get(hour).count += 1;
    });

    const timeDistribution = Array.from(timeMap.values())
      .sort((a, b) => a.time.localeCompare(b.time));

    // Top clients from checkins
    const clientMap = new Map();
    checkins.forEach((checkin: any) => {
      const clientKey = `${checkin.firstName} ${checkin.lastName}`;
      if (!clientMap.has(clientKey)) {
        clientMap.set(clientKey, {
          name: clientKey,
          email: checkin.email,
          classes: 0,
          paid: 0,
          isNew: checkin.isNew === 'yes' || checkin.isNew === true,
        });
      }
      const client = clientMap.get(clientKey);
      client.classes += 1;
      client.paid += parseFloat(checkin.paid || 0);
    });

    const topClients = Array.from(clientMap.values())
      .sort((a, b) => b.classes - a.classes)
      .slice(0, 10);

    // Payment methods
    const paymentMap = new Map();
    checkins.forEach((checkin: any) => {
      const method = checkin.paymentMethodName || 'Unknown';
      if (!paymentMap.has(method)) {
        paymentMap.set(method, { method, count: 0, value: 0 });
      }
      const data = paymentMap.get(method);
      data.count += 1;
      data.value += parseFloat(checkin.paid || 0);
    });

    const paymentMethods = Array.from(paymentMap.values())
      .sort((a, b) => b.value - a.value);

    // New vs Returning
    const newVsReturning = {
      new: checkins.filter((c: any) => c.isNew === 'yes' || c.isNew === true).length,
      returning: checkins.filter((c: any) => c.isNew === 'no' || c.isNew === false).length,
    };

    // Performance radar
    const performanceData = [
      {
        metric: 'Revenue',
        value: Math.min((totals.avgPerSession / 2000) * 100, 100),
        fullMark: 100,
      },
      {
        metric: 'Attendance',
        value: Math.min((totals.customers / totals.sessions / 15) * 100, 100),
        fullMark: 100,
      },
      {
        metric: 'Consistency',
        value: Math.min((totals.sessions / monthly.length / 20) * 100, 100),
        fullMark: 100,
      },
      {
        metric: 'Engagement',
        value: Math.min(((totals.sessions - totals.emptyClasses) / totals.sessions) * 100, 100),
        fullMark: 100,
      },
    ];

    // Classes with full details and flexible field mapping
    const classes = sessions
      .map((session: any) => {
        const revenue = parseFloat(
          session.totalPaid || 
          session.revenue || 
          session.paid || 
          session.amount || 
          0
        );
        const customers = parseInt(
          session.totalCustomers || 
          session.customers || 
          session.attendees ||
          session.checkedInCount ||
          session.bookedCount ||
          0
        );
        
        return {
          className: session.cleanedClass || session.className || session.sessionName || session.classType || session.class || 'Class',
          location: session.location || session.studio || session.venue || 'Studio',
          date: session.date || session.sessionDate || session.classDate || 'N/A',
          monthYear: session.monthYear || session.month || (session.date?.substring(0, 7)) || 'N/A',
          time: session.time || session.classTime || session.startTime || session.scheduledTime || 'N/A',
          dayOfWeek: session.dayOfWeek || session.day || 'N/A',
          revenue,
          customers,
          sessionId: session.sessionId || session.id || session.uniqueId || Math.random().toString(),
          // Add additional useful fields
          capacity: session.capacity || 0,
          fillPercentage: session.fillPercentage || (session.capacity > 0 ? (customers / session.capacity * 100) : 0),
          isEmpty: customers === 0,
          revenuePerCustomer: customers > 0 ? revenue / customers : 0
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totals,
      classes,
      monthly,
      byLocation,
      byClassType,
      timeDistribution,
      topClients,
      paymentMethods,
      newVsReturning,
      performanceData,
    };
  }, [trainerData]);

  const performanceScore = useMemo(() => {
    const { totals } = processedMetrics;
    if (totals.revenue === 0 || totals.sessions === 0) return 0;

    const avgRevenue = totals.avgPerSession;
    const avgCustomers = totals.customers / totals.sessions;
    const fillRate = ((totals.sessions - totals.emptyClasses) / totals.sessions) * 100;

    const revenueScore = Math.min((avgRevenue / 2000) * 35, 35);
    const engagementScore = Math.min((avgCustomers / 15) * 35, 35);
    const fillRateScore = Math.min((fillRate / 100) * 30, 30);

    return revenueScore + engagementScore + fillRateScore;
  }, [processedMetrics]);

  const avgRevenuePerSession = processedMetrics.totals.avgPerSession;
  const avgCustomersPerSession =
    processedMetrics.totals.sessions > 0
      ? processedMetrics.totals.customers / processedMetrics.totals.sessions
      : 0;
  const fillRate =
    processedMetrics.totals.sessions > 0
      ? ((processedMetrics.totals.sessions - processedMetrics.totals.emptyClasses) /
          processedMetrics.totals.sessions) *
        100
      : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 bg-slate-50 border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex h-full overflow-hidden">
          {/* Left Panel - Trainer Profile & Key Metrics */}
          <div className="w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex flex-col overflow-y-auto border-r border-slate-700 shadow-xl">
            {/* Close Button */}
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="absolute top-4 right-4 z-50 text-slate-400 hover:bg-slate-700 rounded-lg p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Trainer Avatar Section */}
            <div className="text-center mb-6 mt-2">
              <div className="relative w-36 h-36 mx-auto mb-4">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/20 shadow-2xl bg-gradient-to-br from-slate-600 to-slate-700">
                  <img
                    src={getTrainerImage(trainerName)}
                    alt={trainerName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const initials = getTrainerInitials(trainerName);
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">${initials}</div>`;
                    }}
                  />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">{trainerName}</h2>
              <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 border-0 shadow-md">
                <Star className="w-3 h-3 mr-1" />
                Performance Rating
              </Badge>
            </div>

            {/* Performance Score */}
            <Card
              ref={(el) => {
                if (el) contentRefs.current['performanceScore'] = el;
              }}
              className="bg-white/10 border-white/20 mb-4 hover:bg-white/15 transition-all"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Performance Score</span>
                  <span className="text-2xl font-bold">{performanceScore.toFixed(0)}</span>
                </div>
                <Progress value={performanceScore} className="h-2 bg-white/20" />
                <p className="text-xs text-white/70 mt-2">
                  {performanceScore >= 80
                    ? '🌟 Outstanding'
                    : performanceScore >= 60
                      ? '⭐ Great'
                      : performanceScore >= 40
                        ? '→ Good'
                        : '⚠️ Needs Work'}
                </p>
              </CardContent>
            </Card>

            {/* Key Metrics Grid */}
            <div className="space-y-3 flex-1">
              <div
                ref={(el) => {
                  if (el) contentRefs.current['revenue'] = el;
                }}
                className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur rounded-lg p-4 border border-green-400/30 hover:border-green-400/60 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-300" />
                  <span className="text-xs font-semibold text-green-100">Total Revenue</span>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(processedMetrics.totals.revenue)}</div>
                <div className="text-xs text-green-200 mt-1">
                  Avg: {formatCurrency(avgRevenuePerSession)}/session
                </div>
              </div>

              <div
                ref={(el) => {
                  if (el) contentRefs.current['sessions'] = el;
                }}
                className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur rounded-lg p-4 border border-blue-400/30 hover:border-blue-400/60 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-blue-300" />
                  <span className="text-xs font-semibold text-blue-100">Total Sessions</span>
                </div>
                <div className="text-2xl font-bold">{formatNumber(processedMetrics.totals.sessions)}</div>
                <div className="text-xs text-blue-200 mt-1">
                  {processedMetrics.monthly.filter((m: any) => m.revenue > 0).length} active months
                </div>
              </div>

              <div
                ref={(el) => {
                  if (el) contentRefs.current['attendees'] = el;
                }}
                className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur rounded-lg p-4 border border-purple-400/30 hover:border-purple-400/60 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-purple-300" />
                  <span className="text-xs font-semibold text-purple-100">Total Attendees</span>
                </div>
                <div className="text-2xl font-bold">{formatNumber(processedMetrics.totals.customers)}</div>
                <div className="text-xs text-purple-200 mt-1">
                  Avg: {avgCustomersPerSession.toFixed(1)}/session
                </div>
              </div>

              <div
                ref={(el) => {
                  if (el) contentRefs.current['fillRate'] = el;
                }}
                className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur rounded-lg p-4 border border-amber-400/30 hover:border-amber-400/60 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-semibold text-amber-100">Fill Rate</span>
                </div>
                <div className="text-2xl font-bold">{fillRate.toFixed(1)}%</div>
                <div className="text-xs text-amber-200 mt-1">
                  {processedMetrics.totals.emptyClasses} empty classes
                </div>
              </div>

              {/* New vs Returning */}
              <div className="bg-gradient-to-br from-indigo-500/20 to-violet-600/20 backdrop-blur rounded-lg p-4 border border-indigo-400/30 hover:border-indigo-400/60 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-indigo-300" />
                  <span className="text-xs font-semibold text-indigo-100">Client Breakdown</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 rounded p-2 text-center">
                    <div className="text-sm font-bold text-green-300">
                      {processedMetrics.newVsReturning.new}
                    </div>
                    <div className="text-xs text-indigo-200">New</div>
                  </div>
                  <div className="bg-white/10 rounded p-2 text-center">
                    <div className="text-sm font-bold text-blue-300">
                      {processedMetrics.newVsReturning.returning}
                    </div>
                    <div className="text-xs text-indigo-200">Returning</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mt-6 pt-6 border-t border-white/10">
              <Button className="w-full bg-white/15 hover:bg-white/25 text-white border-white/20 justify-start transition-all">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button className="w-full bg-white/15 hover:bg-white/25 text-white border-white/20 justify-start transition-all">
                <Share2 className="w-4 h-4 mr-2" />
                Share Analytics
              </Button>
            </div>
          </div>

          {/* Right Panel - Detailed Analytics */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-slate-900 mb-2">Comprehensive Analytics</h3>
              <p className="text-sm text-slate-600">
                Detailed breakdown of performance metrics, client analytics, and session insights
              </p>
              <div className="h-px bg-gradient-to-r from-slate-200 to-transparent mt-4"></div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-slate-100 border border-slate-200 p-1 rounded-lg">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <BarChart className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="sessions" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <Activity className="w-4 h-4 mr-2" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger value="clients" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <Users className="w-4 h-4 mr-2" />
                  Clients
                </TabsTrigger>
                <TabsTrigger value="revenue" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Revenue
                </TabsTrigger>
                <TabsTrigger value="insights" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Insights
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Monthly Trend */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Monthly Performance Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {processedMetrics.monthly.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={processedMetrics.monthly}>
                          <defs>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="month" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(15, 23, 42, 0.95)',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '12px',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3B82F6"
                            fill="url(#revenueGrad)"
                            name="Revenue"
                          />
                          <Area
                            type="monotone"
                            dataKey="customers"
                            stroke="#10B981"
                            fill="#10B98120"
                            name="Attendees"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-3">
                        <AlertCircle className="w-8 h-8" />
                        <div className="text-center">
                          <p className="font-medium">No monthly data available</p>
                          <p className="text-sm text-slate-400 mt-1">
                            Sessions: {processedMetrics.totals.sessions} | Data source: {trainerData?.dataSource || 'unknown'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Location & Class Type Distribution */}
                <div className="grid grid-cols-2 gap-6">
                  {/* By Location */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        By Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {processedMetrics.byLocation.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={processedMetrics.byLocation}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                            <YAxis stroke="#64748b" />
                            <Tooltip />
                            <Bar dataKey="revenue" fill="#10B981" name="Revenue" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-slate-500 font-medium">No location data available</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Sessions found: {processedMetrics.totals.sessions}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* By Class Type */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="w-5 h-5 text-blue-600" />
                        By Class Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {processedMetrics.byClassType.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={processedMetrics.byClassType}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label
                            >
                              {processedMetrics.byClassType.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-slate-500 font-medium">No class type data available</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Sessions found: {processedMetrics.totals.sessions}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Sessions Tab */}
              <TabsContent value="sessions" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        All Sessions ({processedMetrics.classes.length})
                      </div>
                      <Badge variant="outline">{formatCurrency(processedMetrics.totals.revenue)}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">#</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Class</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Location</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Revenue</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Attendees</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">$/Person</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {processedMetrics.classes.map((cls: any, idx: number) => (
                            <tr key={cls.sessionId} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium text-slate-600">{idx + 1}</td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-slate-900">{cls.className}</p>
                                <p className="text-xs text-slate-500">{cls.dayOfWeek}</p>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-700">{cls.date}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{cls.time}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="text-xs">
                                  {cls.location}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                                {formatCurrency(cls.revenue)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                                {cls.customers}
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-slate-700">
                                {cls.customers > 0 ? formatCurrency(cls.revenue / cls.customers) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Clients Tab */}
              <TabsContent value="clients" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b border-cyan-200">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-600" />
                      Top Clients by Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {processedMetrics.topClients.length > 0 ? (
                      <div className="space-y-3">
                        {processedMetrics.topClients.map((client: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{client.name}</p>
                                  <p className="text-xs text-slate-500">{client.email}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right mr-4">
                              <Badge className={client.isNew ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                                {client.isNew ? 'New' : 'Returning'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-900">{client.classes} classes</p>
                              <p className="text-sm text-slate-600">{formatCurrency(client.paid)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-2">
                        <Users className="w-8 h-8 text-slate-400 mx-auto" />
                        <div>
                          <p className="text-slate-500 font-medium">No client data available</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Checkins found: {processedMetrics.topClients.length} | Sessions: {processedMetrics.totals.sessions}
                          </p>
                          <p className="text-xs text-slate-400">
                            Data source: {trainerData?.dataSource || 'unknown'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Revenue Tab */}
              <TabsContent value="revenue" className="space-y-6">
                {/* Payment Methods */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      Payment Methods Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {processedMetrics.paymentMethods.length > 0 ? (
                      <div className="space-y-3">
                        {processedMetrics.paymentMethods.map((method: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200">
                            <div>
                              <p className="font-semibold text-slate-900">{method.method}</p>
                              <p className="text-sm text-slate-600">{method.count} transactions</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-900">{formatCurrency(method.value)}</p>
                              <p className="text-sm text-slate-600">
                                {((method.value / processedMetrics.totals.revenue) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-2">
                        <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
                        <div>
                          <p className="text-slate-500 font-medium">No payment data available</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Checkins found: {(trainerData?.checkins || []).length} | Sessions: {processedMetrics.totals.sessions}
                          </p>
                          <p className="text-xs text-slate-400">
                            Data source: {trainerData?.dataSource || 'unknown'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Strengths */}
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-500 rounded-lg shadow">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-blue-900">Strengths</h3>
                      </div>
                      <ul className="space-y-2">
                        {fillRate > 85 && (
                          <li className="flex items-start gap-2 text-sm text-blue-800">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Excellent fill rate at {fillRate.toFixed(1)}%</span>
                          </li>
                        )}
                        {avgRevenuePerSession > 1500 && (
                          <li className="flex items-start gap-2 text-sm text-blue-800">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Above-average revenue per session</span>
                          </li>
                        )}
                        {processedMetrics.totals.sessions > 50 && (
                          <li className="flex items-start gap-2 text-sm text-blue-800">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Highly active with {processedMetrics.totals.sessions}+ sessions</span>
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Opportunities */}
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-500 rounded-lg shadow">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-amber-900">Opportunities</h3>
                      </div>
                      <ul className="space-y-2">
                        {processedMetrics.totals.emptyClasses > 5 && (
                          <li className="flex items-start gap-2 text-sm text-amber-800">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Reduce {processedMetrics.totals.emptyClasses} empty classes</span>
                          </li>
                        )}
                        {avgCustomersPerSession < 10 && (
                          <li className="flex items-start gap-2 text-sm text-amber-800">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Increase average attendance per class</span>
                          </li>
                        )}
                        {processedMetrics.newVsReturning.new < 5 && (
                          <li className="flex items-start gap-2 text-sm text-amber-800">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Focus on acquiring new clients</span>
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EnhancedDrillDownModal;
