import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, DollarSign, AlertCircle, Award,
  Target, Activity, BarChart3, Calendar, AlertTriangle,
  CheckCircle, XCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useVCMemberData } from '@/hooks/useVCMemberData';
import { useMemberBehaviorAnalytics } from '@/hooks/useMemberBehaviorAnalytics';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];

export const MemberBehaviorPatterns: React.FC = () => {
  const { data: memberData, loading, error } = useVCMemberData();
  const analytics = useMemberBehaviorAnalytics(memberData);
  const [activeTab, setActiveTab] = useState<string>('overview');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading member behavior data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-6 h-6" />
            <div>
              <div className="font-semibold">Failed to load member behavior data</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { performanceMetrics, monthlyTrends, memberSegments, financialInsights, operationalMetrics, predictiveInsights, trendAnalysis, summaryInsights } = analytics;

  // Prepare segment distribution for pie chart
  const segmentCounts = memberSegments.reduce((acc, m) => {
    acc[m.segment] = (acc[m.segment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const segmentData = Object.entries(segmentCounts).map(([segment, count]) => ({
    name: segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value: count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="w-7 h-7 text-purple-600" />
            Member Behavior Patterns Analysis
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Comprehensive analysis of {formatNumber(memberData.length)} members across {monthlyTrends.length} months
          </p>
        </CardHeader>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Revenue</Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(financialInsights.totalRevenue)}</div>
              <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
              <div className="mt-3 pt-3 border-t border-blue-100 text-xs text-gray-500">
                {formatCurrency(financialInsights.revenuePerVisit)} per visit
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-emerald-600" />
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {formatPercentage(operationalMetrics.appointmentUtilizationRate)}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatNumber(operationalMetrics.totalVisits)}</div>
              <p className="text-sm text-gray-600 mt-1">Total Visits</p>
              <div className="mt-3 pt-3 border-t border-emerald-100 text-xs text-gray-500">
                {formatNumber(operationalMetrics.totalBookings)} bookings
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-amber-600" />
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">Collection</Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatPercentage(financialInsights.collectionEfficiency)}</div>
              <p className="text-sm text-gray-600 mt-1">Collection Efficiency</p>
              <div className="mt-3 pt-3 border-t border-amber-100 text-xs text-gray-500">
                {formatCurrency(financialInsights.totalOutstanding)} outstanding
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-red-50 to-white border-red-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-8 h-8 text-red-600" />
                <Badge variant="secondary" className="bg-red-100 text-red-700">Rate</Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatPercentage(operationalMetrics.overallCancellationRate)}</div>
              <p className="text-sm text-gray-600 mt-1">Cancellation Rate</p>
              <div className="mt-3 pt-3 border-t border-red-100 text-xs text-gray-500">
                {formatNumber(operationalMetrics.totalCancellations)} cancellations
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="segments" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Predictive
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Monthly Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrends.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="totalRevenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="totalUnpaid" stroke="#f59e0b" strokeWidth={2} name="Unpaid" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Member Segmentation Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Member Segmentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Operational Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Operational Efficiency Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border border-blue-200">
                  <div className="text-sm text-gray-600 mb-2">Appointment Utilization</div>
                  <div className="text-3xl font-bold text-blue-600">{formatPercentage(operationalMetrics.appointmentUtilizationRate)}</div>
                  <div className="text-xs text-gray-500 mt-2">{formatNumber(operationalMetrics.totalVisits)} visits / {formatNumber(operationalMetrics.totalBookings)} bookings</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-lg border border-emerald-200">
                  <div className="text-sm text-gray-600 mb-2">Booking to Payment</div>
                  <div className="text-3xl font-bold text-emerald-600">{formatCurrency(operationalMetrics.bookingToPaymentConversion)}</div>
                  <div className="text-xs text-gray-500 mt-2">Average revenue per booking</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-lg border border-red-200">
                  <div className="text-sm text-gray-600 mb-2">Cancellation Rate</div>
                  <div className="text-3xl font-bold text-red-600">{formatPercentage(operationalMetrics.overallCancellationRate)}</div>
                  <div className="text-xs text-gray-500 mt-2">{formatNumber(operationalMetrics.totalCancellations)} total cancellations</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Top Performing Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Member</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Visits</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Revenue</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Show-up Rate</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Avg Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceMetrics
                      .sort((a, b) => b.totalPaidAmount - a.totalPaidAmount)
                      .slice(0, 20)
                      .map((member, idx) => (
                        <tr key={member.memberId} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium text-gray-900">{member.fullName}</div>
                            <div className="text-xs text-gray-500">{member.email}</div>
                          </td>
                          <td className="text-right p-3 text-gray-700">{formatNumber(member.totalVisits)}</td>
                          <td className="text-right p-3 font-semibold text-emerald-600">{formatCurrency(member.totalPaidAmount)}</td>
                          <td className="text-right p-3">
                            <Badge variant={member.showUpRate >= 80 ? 'default' : 'secondary'} className={member.showUpRate >= 80 ? 'bg-emerald-100 text-emerald-700' : ''}>
                              {formatPercentage(member.showUpRate)}
                            </Badge>
                          </td>
                          <td className="text-right p-3 text-gray-700">{formatCurrency(member.averageTransactionValue)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Correlation Insights */}
          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Booking & Cancellation Correlation Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-indigo-200">
                  <div className="text-sm text-gray-600 mb-2">Booking-Cancellation Correlation</div>
                  <div className="text-3xl font-bold text-indigo-600">
                    {trendAnalysis.correlationInsights.bookingCancellationCorrelation.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {Math.abs(trendAnalysis.correlationInsights.bookingCancellationCorrelation) > 0.5 ? 'Strong' : Math.abs(trendAnalysis.correlationInsights.bookingCancellationCorrelation) > 0.3 ? 'Moderate' : 'Weak'} correlation
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-emerald-200">
                  <div className="text-sm text-gray-600 mb-2">Booking-Visit Correlation</div>
                  <div className="text-3xl font-bold text-emerald-600">
                    {trendAnalysis.correlationInsights.bookingVisitCorrelation.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {trendAnalysis.correlationInsights.bookingVisitCorrelation > 0.7 ? 'Strong' : trendAnalysis.correlationInsights.bookingVisitCorrelation > 0.5 ? 'Moderate' : 'Weak'} conversion
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-purple-200">
                  <div className="text-sm text-gray-600 mb-2">Overall Pattern</div>
                  <div className="text-sm font-medium text-gray-800 mt-3">
                    {trendAnalysis.correlationInsights.overallPattern}
                  </div>
                </div>
              </div>

              {/* High Risk Patterns */}
              {trendAnalysis.correlationInsights.highRiskPatterns.length > 0 && (
                <div className="mt-6">
                  <div className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    High Risk Patterns Detected
                  </div>
                  <div className="space-y-2">
                    {trendAnalysis.correlationInsights.highRiskPatterns.map((pattern, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${
                        pattern.severity === 'high' ? 'bg-red-50 border-red-200' :
                        pattern.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
                        'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">{pattern.pattern}</span>
                          <Badge variant={pattern.severity === 'high' ? 'destructive' : 'secondary'}>
                            {pattern.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Declining Trends */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <ArrowDownRight className="w-5 h-5" />
                Members with Declining Trends
                <Badge variant="destructive" className="ml-2">{trendAnalysis.declining.length}</Badge>
              </CardTitle>
              <p className="text-sm text-red-600 mt-2">
                Members showing significant decreases in bookings, visits, or increases in cancellations
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Member</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Metric</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Change Rate</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Recent Avg</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Previous Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendAnalysis.declining.slice(0, 15).map((member, idx) => (
                      <tr key={`${member.memberId}-${member.metric}`} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{member.fullName}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="capitalize">
                            {member.metric}
                          </Badge>
                        </td>
                        <td className="text-right p-3">
                          <div className="flex items-center justify-end gap-1 text-red-600 font-semibold">
                            <ArrowDownRight className="w-4 h-4" />
                            {formatPercentage(Math.abs(member.changeRate))}
                          </div>
                        </td>
                        <td className="text-right p-3 text-gray-700">{member.recentAvg.toFixed(1)}</td>
                        <td className="text-right p-3 text-gray-700">{member.previousAvg.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Increasing Trends */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <ArrowUpRight className="w-5 h-5" />
                Members with Improving Trends
                <Badge className="ml-2 bg-emerald-200 text-emerald-800">{trendAnalysis.increasing.length}</Badge>
              </CardTitle>
              <p className="text-sm text-emerald-600 mt-2">
                Members showing significant increases in bookings and attendance
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Member</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Metric</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Change Rate</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Recent Avg</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Previous Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendAnalysis.increasing.slice(0, 15).map((member, idx) => (
                      <tr key={`${member.memberId}-${member.metric}`} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{member.fullName}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </td>
                        <td className="p-3">
                          <Badge className="capitalize bg-emerald-100 text-emerald-700">
                            {member.metric}
                          </Badge>
                        </td>
                        <td className="text-right p-3">
                          <div className="flex items-center justify-end gap-1 text-emerald-600 font-semibold">
                            <ArrowUpRight className="w-4 h-4" />
                            {formatPercentage(member.changeRate)}
                          </div>
                        </td>
                        <td className="text-right p-3 text-gray-700">{member.recentAvg.toFixed(1)}</td>
                        <td className="text-right p-3 text-gray-700">{member.previousAvg.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Performance Trends - Original Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Monthly Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyTrends.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalBookings" fill="#3b82f6" name="Bookings" />
                  <Bar dataKey="totalVisits" fill="#10b981" name="Visits" />
                  <Bar dataKey="totalCancellations" fill="#ef4444" name="Cancellations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cancellation Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyTrends.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Line type="monotone" dataKey="cancellationRate" stroke="#ef4444" strokeWidth={2} name="Cancellation %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Show-up Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyTrends.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Line type="monotone" dataKey="showUpRate" stroke="#10b981" strokeWidth={2} name="Show-up %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          {(['high-value', 'engaged', 'reliable', 'at-risk', 'unreliable', 'inactive'] as const).map(segment => {
            const segmentMembers = memberSegments.filter(m => m.segment === segment);
            if (segmentMembers.length === 0) return null;

            const segmentConfig = {
              'high-value': { color: 'purple', icon: Award, label: 'High-Value Members' },
              'engaged': { color: 'emerald', icon: CheckCircle, label: 'Engaged Members' },
              'reliable': { color: 'blue', icon: Target, label: 'Reliable Members' },
              'at-risk': { color: 'amber', icon: AlertCircle, label: 'At-Risk Members' },
              'unreliable': { color: 'orange', icon: AlertTriangle, label: 'Unreliable Members' },
              'inactive': { color: 'gray', icon: XCircle, label: 'Inactive Members' },
            };

            const config = segmentConfig[segment];
            const Icon = config.icon;

            return (
              <Card key={segment}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 text-${config.color}-600`} />
                    {config.label}
                    <Badge className="ml-2">{segmentMembers.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Member</th>
                          <th className="text-right p-3 text-sm font-semibold text-gray-700">Revenue</th>
                          <th className="text-right p-3 text-sm font-semibold text-gray-700">Visits</th>
                          <th className="text-right p-3 text-sm font-semibold text-gray-700">Cancellation Rate</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {segmentMembers.slice(0, 10).map(member => (
                          <tr key={member.memberId} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div className="font-medium text-gray-900">{member.fullName}</div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                            </td>
                            <td className="text-right p-3 font-semibold text-emerald-600">{formatCurrency(member.totalRevenue)}</td>
                            <td className="text-right p-3 text-gray-700">{formatNumber(member.visitFrequency)}</td>
                            <td className="text-right p-3">
                              <Badge variant={member.cancellationRate < 20 ? 'default' : 'secondary'}>
                                {formatPercentage(member.cancellationRate)}
                              </Badge>
                            </td>
                            <td className="text-left p-3 text-sm text-gray-600">{member.lastActivityMonth || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Predictive Tab */}
        <TabsContent value="predictive" className="space-y-6">
          {/* Churn Risk */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                High Churn Risk Members
                <Badge variant="destructive" className="ml-2">{predictiveInsights.churnRiskMembers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Member</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Churn Score</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Decline Rate</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictiveInsights.churnRiskMembers.map(member => (
                      <tr key={member.memberId} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{member.fullName}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </td>
                        <td className="text-right p-3">
                          <Badge variant="destructive">{member.churnScore.toFixed(0)}</Badge>
                        </td>
                        <td className="text-right p-3 text-red-600 font-semibold">
                          <div className="flex items-center justify-end gap-1">
                            <ArrowDownRight className="w-4 h-4" />
                            {formatPercentage(member.declineRate)}
                          </div>
                        </td>
                        <td className="text-left p-3 text-sm text-gray-600">{member.lastActiveMonth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payment Risk */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <DollarSign className="w-5 h-5" />
                Payment Risk Members
                <Badge className="ml-2 bg-amber-200 text-amber-800">{predictiveInsights.paymentRiskMembers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Member</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Unpaid Amount</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Compliance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictiveInsights.paymentRiskMembers.map(member => (
                      <tr key={member.memberId} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{member.fullName}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </td>
                        <td className="text-right p-3 font-semibold text-red-600">{formatCurrency(member.unpaidAmount)}</td>
                        <td className="text-right p-3">
                          <Badge variant={member.paymentComplianceRate >= 80 ? 'default' : 'destructive'}>
                            {formatPercentage(member.paymentComplianceRate)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Forecast */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <TrendingUp className="w-5 h-5" />
                Revenue Forecasts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {predictiveInsights.revenueForecasts.map(forecast => (
                    <div key={forecast.month} className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border border-blue-200">
                      <div className="text-sm text-gray-600 mb-2">{forecast.month}</div>
                      <div className="text-2xl font-bold text-blue-600 mb-2">{formatCurrency(forecast.forecastedRevenue)}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Target className="w-3 h-3" />
                        {forecast.confidence}% confidence
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Footer */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="w-7 h-7 text-blue-400" />
            Analysis Summary & Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <div className="text-sm text-blue-200 mb-1">Total Members</div>
              <div className="text-3xl font-bold">{formatNumber(summaryInsights.totalMembers)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <div className="text-sm text-emerald-200 mb-1">Active Members</div>
              <div className="text-3xl font-bold text-emerald-400">{formatNumber(summaryInsights.activeMembers)}</div>
              <div className="text-xs text-emerald-300 mt-1">
                {formatPercentage((summaryInsights.activeMembers / summaryInsights.totalMembers) * 100)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <div className="text-sm text-amber-200 mb-1">At Risk</div>
              <div className="text-3xl font-bold text-amber-400">{formatNumber(summaryInsights.atRiskMembers)}</div>
              <div className="text-xs text-amber-300 mt-1">
                {formatPercentage((summaryInsights.atRiskMembers / summaryInsights.totalMembers) * 100)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <div className="text-sm text-red-200 mb-1">Inactive</div>
              <div className="text-3xl font-bold text-red-400">{formatNumber(summaryInsights.inactiveMembers)}</div>
              <div className="text-xs text-red-300 mt-1">
                {formatPercentage((summaryInsights.inactiveMembers / summaryInsights.totalMembers) * 100)}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">Overall Performance</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Average Cancellation Rate:</span>
                  <span className="font-bold text-xl">{formatPercentage(summaryInsights.averageCancellationRate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Average Show-up Rate:</span>
                  <span className="font-bold text-xl text-emerald-400">{formatPercentage(summaryInsights.averageShowUpRate)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold">Trend Analysis</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <ArrowDownRight className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{trendAnalysis.declining.length} members declining</span>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowUpRight className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{trendAnalysis.increasing.length} members improving</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm p-6 rounded-lg border border-blue-400/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-blue-100">Top Trend</h3>
                <p className="text-gray-200">{summaryInsights.topTrend}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm p-6 rounded-lg border border-purple-400/30">
            <div className="flex items-start gap-3">
              <Target className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-purple-100">Key Insight</h3>
                <p className="text-gray-200">{summaryInsights.keyInsight}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-sm p-6 rounded-lg border border-emerald-400/30">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-emerald-100">Recommendation</h3>
                <p className="text-gray-200">{summaryInsights.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Correlation Summary */}
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold">Correlation Insights</h3>
            </div>
            <p className="text-gray-300">{trendAnalysis.correlationInsights.overallPattern}</p>
            {trendAnalysis.correlationInsights.highRiskPatterns.length > 0 && (
              <div className="mt-4 space-y-2">
                {trendAnalysis.correlationInsights.highRiskPatterns.map((pattern, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-gray-300">{pattern.pattern}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
