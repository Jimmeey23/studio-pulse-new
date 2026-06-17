import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayrollData } from '@/types/dashboard';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { FormatFilters } from './FormatAnalysisFilters';
import { 
  Eye, 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp,
  Calendar,
  MapPin,
  Activity,
  Target,
  ArrowRight,
  Zap,
  X
} from 'lucide-react';

interface FormatDrillDownModalProps {
  data: PayrollData[];
  formatType: 'cycle' | 'barre' | 'strength';
  filters?: FormatFilters;
  trigger?: React.ReactNode;
}

export const FormatDrillDownModal: React.FC<FormatDrillDownModalProps> = ({ 
  data, 
  formatType,
  filters,
  trigger 
}) => {
  const [open, setOpen] = useState(false);

  const formatConfig = {
    cycle: {
      name: 'PowerCycle',
      color: 'blue',
      sessions: 'cycleSessions',
      emptySessions: 'emptyCycleSessions',
      customers: 'cycleCustomers',
      paid: 'cyclePaid'
    },
    barre: {
      name: 'Barre',
      color: 'pink',
      sessions: 'barreSessions',
      emptySessions: 'emptyBarreSessions',
      customers: 'barreCustomers',
      paid: 'barrePaid'
    },
    strength: {
      name: 'Strength',
      color: 'orange',
      sessions: 'strengthSessions',
      emptySessions: 'emptyStrengthSessions',
      customers: 'strengthCustomers',
      paid: 'strengthPaid'
    }
  }[formatType];

  const analysisData = useMemo(() => {
    let filteredData = data.filter(row => (row as any)[formatConfig.sessions] > 0);
    
    // Apply location filter if provided
    if (filters?.locations && filters.locations.length > 0) {
      filteredData = filteredData.filter(row => filters.locations.includes(row.location));
    }

    // Aggregate metrics
    const totals = {
      sessions: 0,
      emptySessions: 0,
      nonEmptySessions: 0,
      customers: 0,
      revenue: 0,
      teachers: new Set(),
      locations: new Set(),
      months: new Set()
    };

    // Monthly breakdown
    const monthlyData = new Map();
    // Location breakdown
    const locationData = new Map();
    // Teacher breakdown
    const teacherData = new Map();

    filteredData.forEach(row => {
      const sessions = (row as any)[formatConfig.sessions] || 0;
      const emptySessions = (row as any)[formatConfig.emptySessions] || 0;
      const customers = (row as any)[formatConfig.customers] || 0;
      const revenue = (row as any)[formatConfig.paid] || 0;

      // Totals
      totals.sessions += sessions;
      totals.emptySessions += emptySessions;
      totals.nonEmptySessions += (sessions - emptySessions);
      totals.customers += customers;
      totals.revenue += revenue;
      totals.teachers.add(row.teacherName);
      totals.locations.add(row.location);
      totals.months.add(row.monthYear);

      // Monthly data
      if (!monthlyData.has(row.monthYear)) {
        monthlyData.set(row.monthYear, {
          monthYear: row.monthYear,
          sessions: 0,
          emptySessions: 0,
          customers: 0,
          revenue: 0
        });
      }
      const monthData = monthlyData.get(row.monthYear);
      monthData.sessions += sessions;
      monthData.emptySessions += emptySessions;
      monthData.customers += customers;
      monthData.revenue += revenue;

      // Location data
      if (!locationData.has(row.location)) {
        locationData.set(row.location, {
          location: row.location,
          sessions: 0,
          emptySessions: 0,
          customers: 0,
          revenue: 0,
          teachers: new Set()
        });
      }
      const locData = locationData.get(row.location);
      locData.sessions += sessions;
      locData.emptySessions += emptySessions;
      locData.customers += customers;
      locData.revenue += revenue;
      locData.teachers.add(row.teacherName);

      // Teacher data
      if (!teacherData.has(row.teacherName)) {
        teacherData.set(row.teacherName, {
          teacherName: row.teacherName,
          sessions: 0,
          emptySessions: 0,
          customers: 0,
          revenue: 0,
          locations: new Set()
        });
      }
      const teachData = teacherData.get(row.teacherName);
      teachData.sessions += sessions;
      teachData.emptySessions += emptySessions;
      teachData.customers += customers;
      teachData.revenue += revenue;
      teachData.locations.add(row.location);
    });

    // Calculate derived metrics
    const fillRate = totals.sessions > 0 ? (totals.nonEmptySessions / totals.sessions) * 100 : 0;
    const avgCustomersPerSession = totals.sessions > 0 ? totals.customers / totals.sessions : 0;
    const avgCustomersPerNonEmpty = totals.nonEmptySessions > 0 ? totals.customers / totals.nonEmptySessions : 0;
    const revenuePerCustomer = totals.customers > 0 ? totals.revenue / totals.customers : 0;
    const revenuePerSession = totals.sessions > 0 ? totals.revenue / totals.sessions : 0;

    // Capacity utilization (assuming 20 capacity per session)
    const totalCapacity = totals.sessions * 20;
    const capacityUtilization = totalCapacity > 0 ? (totals.customers / totalCapacity) * 100 : 0;

    return {
      totals: {
        ...totals,
        fillRate,
        avgCustomersPerSession,
        avgCustomersPerNonEmpty,
        revenuePerCustomer,
        revenuePerSession,
        capacityUtilization,
        totalCapacity
      },
      monthly: Array.from(monthlyData.values()).sort((a, b) => a.monthYear.localeCompare(b.monthYear)),
      locations: Array.from(locationData.values()).sort((a, b) => b.revenue - a.revenue),
      teachers: Array.from(teacherData.values()).sort((a, b) => b.revenue - a.revenue)
    };
  }, [data, formatConfig, filters]);

  const MetricCard = ({ 
    title, 
    value, 
    subtitle,
    format = 'number',
    icon: Icon,
    color = 'blue'
  }: {
    title: string;
    value: number;
    subtitle?: string;
    format?: 'number' | 'currency' | 'percentage';
    icon: React.ElementType;
    color?: string;
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency': return formatCurrency(val);
        case 'percentage': return formatPercentage(val);
        default: return formatNumber(val);
      }
    };

    const colorClasses = {
      blue: 'from-blue-500 to-blue-600 bg-blue-50 border-blue-200',
      pink: 'from-pink-500 to-pink-600 bg-pink-50 border-pink-200',
      orange: 'from-orange-500 to-orange-600 bg-orange-50 border-orange-200'
    };

    return (
      <Card className={`border-2 ${colorClasses[color as keyof typeof colorClasses].split(' ').slice(2).join(' ')}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses].split(' ').slice(0, 2).join(' ')}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <span className="font-medium text-gray-700">{title}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{formatValue(value)}</div>
          {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${
              formatConfig.color === 'blue' ? 'from-blue-500 to-blue-600' :
              formatConfig.color === 'pink' ? 'from-pink-500 to-pink-600' :
              'from-orange-500 to-orange-600'
            }`}>
              {formatType === 'cycle' ? <Zap className="h-6 w-6 text-white" /> :
               formatType === 'barre' ? <Activity className="h-6 w-6 text-white" /> :
               <TrendingUp className="h-6 w-6 text-white" />}
            </div>
            <span className={`bg-gradient-to-r ${
              formatConfig.color === 'blue' ? 'from-blue-600 to-blue-800' :
              formatConfig.color === 'pink' ? 'from-pink-600 to-pink-800' :
              'from-orange-600 to-orange-800'
            } bg-clip-text text-transparent`}>
              {formatConfig.name} Detailed Analysis
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Sessions"
              value={analysisData.totals.sessions}
              subtitle={`${analysisData.totals.nonEmptySessions} non-empty`}
              icon={BarChart3}
              color={formatConfig.color}
            />
            <MetricCard
              title="Total Customers"
              value={analysisData.totals.customers}
              subtitle={`Avg: ${formatNumber(analysisData.totals.avgCustomersPerSession)}/session`}
              icon={Users}
              color={formatConfig.color}
            />
            <MetricCard
              title="Total Revenue"
              value={analysisData.totals.revenue}
              subtitle={`₹${formatNumber(analysisData.totals.revenuePerCustomer)}/customer`}
              format="currency"
              icon={DollarSign}
              color={formatConfig.color}
            />
            <MetricCard
              title="Fill Rate"
              value={analysisData.totals.fillRate}
              subtitle={`${formatPercentage(analysisData.totals.capacityUtilization)} capacity used`}
              format="percentage"
              icon={Target}
              color={formatConfig.color}
            />
          </div>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Sessions Scheduled:</span>
                        <span className="font-semibold">{formatNumber(analysisData.totals.sessions)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Empty Sessions:</span>
                        <span className="font-semibold text-red-600">{formatNumber(analysisData.totals.emptySessions)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Non-Empty Sessions:</span>
                        <span className="font-semibold text-green-600">{formatNumber(analysisData.totals.nonEmptySessions)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Fill Rate:</span>
                        <span className="font-semibold">{formatPercentage(analysisData.totals.fillRate)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Total Capacity:</span>
                        <span className="font-semibold">{formatNumber(analysisData.totals.totalCapacity)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Capacity Used:</span>
                        <span className="font-semibold">{formatPercentage(analysisData.totals.capacityUtilization)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Revenue per Customer:</span>
                        <span className="font-semibold">{formatCurrency(analysisData.totals.revenuePerCustomer)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Revenue per Session:</span>
                        <span className="font-semibold">{formatCurrency(analysisData.totals.revenuePerSession)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Avg Customers/Session (All):</span>
                        <span className="font-semibold">{formatNumber(analysisData.totals.avgCustomersPerSession)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Avg Customers/Session (Non-Empty):</span>
                        <span className="font-semibold">{formatNumber(analysisData.totals.avgCustomersPerNonEmpty)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Active Teachers:</span>
                        <span className="font-semibold">{analysisData.totals.teachers.size}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>Active Locations:</span>
                        <span className="font-semibold">{analysisData.totals.locations.size}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="text-left p-3">Month</th>
                          <th className="text-center p-3">Sessions</th>
                          <th className="text-center p-3">Empty</th>
                          <th className="text-center p-3">Fill Rate</th>
                          <th className="text-center p-3">Customers</th>
                          <th className="text-center p-3">Revenue</th>
                          <th className="text-center p-3">Avg/Session</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.monthly.map(month => {
                          const fillRate = month.sessions > 0 ? ((month.sessions - month.emptySessions) / month.sessions) * 100 : 0;
                          const avgPerSession = month.sessions > 0 ? month.customers / month.sessions : 0;
                          
                          return (
                            <tr key={month.monthYear} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-3 font-medium">{month.monthYear}</td>
                              <td className="text-center p-3">{formatNumber(month.sessions)}</td>
                              <td className="text-center p-3 text-red-600">{formatNumber(month.emptySessions)}</td>
                              <td className="text-center p-3">{formatPercentage(fillRate)}</td>
                              <td className="text-center p-3">{formatNumber(month.customers)}</td>
                              <td className="text-center p-3">{formatCurrency(month.revenue)}</td>
                              <td className="text-center p-3">{formatNumber(avgPerSession)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="locations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Location Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="text-left p-3">Location</th>
                          <th className="text-center p-3">Sessions</th>
                          <th className="text-center p-3">Fill Rate</th>
                          <th className="text-center p-3">Customers</th>
                          <th className="text-center p-3">Revenue</th>
                          <th className="text-center p-3">Teachers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.locations.map(location => {
                          const fillRate = location.sessions > 0 ? ((location.sessions - location.emptySessions) / location.sessions) * 100 : 0;
                          
                          return (
                            <tr key={location.location} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-3 font-medium">{location.location}</td>
                              <td className="text-center p-3">{formatNumber(location.sessions)}</td>
                              <td className="text-center p-3">{formatPercentage(fillRate)}</td>
                              <td className="text-center p-3">{formatNumber(location.customers)}</td>
                              <td className="text-center p-3">{formatCurrency(location.revenue)}</td>
                              <td className="text-center p-3">{location.teachers.size}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teachers" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="text-left p-3">Teacher</th>
                          <th className="text-center p-3">Sessions</th>
                          <th className="text-center p-3">Fill Rate</th>
                          <th className="text-center p-3">Customers</th>
                          <th className="text-center p-3">Revenue</th>
                          <th className="text-center p-3">Locations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.teachers.map(teacher => {
                          const fillRate = teacher.sessions > 0 ? ((teacher.sessions - teacher.emptySessions) / teacher.sessions) * 100 : 0;
                          
                          return (
                            <tr key={teacher.teacherName} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-3 font-medium">{teacher.teacherName}</td>
                              <td className="text-center p-3">{formatNumber(teacher.sessions)}</td>
                              <td className="text-center p-3">{formatPercentage(fillRate)}</td>
                              <td className="text-center p-3">{formatNumber(teacher.customers)}</td>
                              <td className="text-center p-3">{formatCurrency(teacher.revenue)}</td>
                              <td className="text-center p-3">{teacher.locations.size}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};