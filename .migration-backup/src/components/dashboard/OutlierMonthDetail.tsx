import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, DollarSign, Target, Calendar,
  Building2, Activity, ShoppingCart, Sparkles, AlertCircle,
  BarChart3, PieChart, Zap, Award, ArrowUpRight, ArrowDownRight,
  UserPlus, UserCheck, RefreshCw, TrendingDown, Layers, Percent
} from 'lucide-react';
import { OutlierMonthAnalytics, SpenderData, LapsedMemberData, TransactionDetail } from '@/hooks/useOutlierMonthAnalytics';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { OutlierDrillDownModal } from './OutlierDrillDownModal';
import { SalesData } from '@/types/dashboard';
import { StackedMemberData } from '@/hooks/useOutlierMonthAnalytics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OutlierMonthDetailProps {
  analytics: OutlierMonthAnalytics;
  monthName: string;
  locationName: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];

export const OutlierMonthDetail: React.FC<OutlierMonthDetailProps> = ({
  analytics,
  monthName,
  locationName
}) => {
  const [chartView, setChartView] = useState<'daily' | 'membership'>('daily');
  const [selectedStackedMember, setSelectedStackedMember] = useState<StackedMemberData | null>(null);
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    type: 'spender' | 'lapsed' | 'new-transactions' | 'repeat-transactions' | 'membership';
    title: string;
    spenderData?: SpenderData;
    lapsedData?: LapsedMemberData;
    transactions?: TransactionDetail[];
    membershipTransactions?: SalesData[];
    membershipName?: string;
  }>({
    isOpen: false,
    type: 'new-transactions',
    title: ''
  });

  // Calculate percentages
  const newClientPercentage = analytics.totalRevenue > 0 
    ? (analytics.newClientRevenue / analytics.totalRevenue) * 100 
    : 0;
  const existingClientPercentage = 100 - newClientPercentage;
  const activePercentage = analytics.totalRevenue > 0
    ? (analytics.activeMembershipRevenue / analytics.totalRevenue) * 100
    : 0;

  // Prepare chart data
  const dailyChartData = analytics.dailyAnalytics.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Total Revenue': day.revenue,
    'New Client Revenue': day.newClientRevenue,
    'Existing Client Revenue': day.existingClientRevenue,
    'Transactions': day.transactions
  }));

  const membershipChartData = analytics.membershipAnalytics.slice(0, 10).map(m => ({
    name: m.membershipName.length > 30 ? m.membershipName.substring(0, 30) + '...' : m.membershipName,
    revenue: m.revenue,
    count: m.count
  }));

  const revenueDistribution = [
    { name: 'New Clients', value: analytics.newClientRevenue },
    { name: 'Existing Clients', value: analytics.existingClientRevenue }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Total</Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.totalRevenue)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
              <div className="mt-3 pt-3 border-t border-blue-100">
                <div className="text-xs text-gray-500">
                  {formatNumber(analytics.dailyAnalytics.length)} days tracked
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* New Client Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onClick={() => setModalData({
            isOpen: true,
            type: 'new-transactions',
            title: `${monthName} - New Client Transactions (${locationName})`,
            transactions: analytics.newTransactions
          })}
          className="cursor-pointer"
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <UserPlus className="w-8 h-8 text-emerald-600" />
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {formatPercentage(newClientPercentage)}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.newClientRevenue)}
              </div>
              <p className="text-sm text-gray-600 mt-1">New Client Revenue</p>
              <div className="mt-3 pt-3 border-t border-emerald-100">
                <div className="text-xs text-gray-500">
                  {formatNumber(analytics.newClients)} new clients • Click for details
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Existing Client Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={() => setModalData({
            isOpen: true,
            type: 'repeat-transactions',
            title: `${monthName} - Repeat Client Transactions (${locationName})`,
            transactions: analytics.repeatTransactions
          })}
          className="cursor-pointer"
        >
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-8 h-8 text-purple-600" />
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {formatPercentage(existingClientPercentage)}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.existingClientRevenue)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Existing Client Revenue</p>
              <div className="mt-3 pt-3 border-t border-purple-100">
                <div className="text-xs text-gray-500">
                  {formatNumber(analytics.existingClients)} returning clients • Click for details
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Membership Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-amber-600" />
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  {formatPercentage(activePercentage)}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.activeMembershipRevenue)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Active Member Purchases</p>
              <div className="mt-3 pt-3 border-t border-amber-100">
                <div className="text-xs text-gray-500">
                  {formatNumber(analytics.clientsWithActiveMembers)} active members
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Comprehensive Revenue Split Metrics */}
      {analytics.newCustomerMetrics && analytics.repeatCustomerMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Customer Metrics */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
          <Card className="border-emerald-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                New Customer Detailed Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Revenue</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(analytics.newCustomerMetrics.revenue)}
                  </div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Units Sold</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatNumber(analytics.newCustomerMetrics.unitsSold)}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Transactions</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(analytics.newCustomerMetrics.transactions)}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Unique Members</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(analytics.newCustomerMetrics.uniqueMembers)}
                  </div>
                </div>
                <div className="col-span-2 bg-teal-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Average Transaction Value (ATV)</div>
                  <div className="text-2xl font-bold text-teal-600">
                    {formatCurrency(analytics.newCustomerMetrics.atv)}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-orange-500" />
                  Discount Analysis
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className="bg-orange-50 p-3 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                    onClick={() => setModalData({
                      isOpen: true,
                      type: 'new-transactions',
                      title: `${monthName} - New Customer Discounted Transactions`,
                      transactions: analytics.newTransactions.filter(t => t.discountAmount > 0)
                    })}
                  >
                    <div className="text-xs text-gray-600">Discounted Revenue</div>
                    <div className="text-lg font-bold text-orange-600">
                      {formatCurrency(analytics.newCustomerMetrics.discountedRevenue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatNumber(analytics.newCustomerMetrics.discountedTransactions)} txns
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600">Non-Discounted</div>
                    <div className="text-lg font-bold text-gray-700">
                      {formatCurrency(analytics.newCustomerMetrics.nonDiscountedRevenue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatNumber(analytics.newCustomerMetrics.nonDiscountedTransactions)} txns
                    </div>
                  </div>
                  <div className="col-span-2 bg-red-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Total Discounts Given</span>
                      <span className="text-lg font-bold text-red-600">
                        {formatCurrency(analytics.newCustomerMetrics.totalDiscountAmount)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Avg: {formatPercentage(analytics.newCustomerMetrics.avgDiscountPercentage)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Repeat Customer Metrics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-600" />
                Repeat Customer Detailed Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Revenue</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(analytics.repeatCustomerMetrics.revenue)}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Units Sold</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(analytics.repeatCustomerMetrics.unitsSold)}
                  </div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Transactions</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatNumber(analytics.repeatCustomerMetrics.transactions)}
                  </div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Unique Members</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatNumber(analytics.repeatCustomerMetrics.uniqueMembers)}
                  </div>
                </div>
                <div className="col-span-2 bg-violet-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Average Transaction Value (ATV)</div>
                  <div className="text-2xl font-bold text-violet-600">
                    {formatCurrency(analytics.repeatCustomerMetrics.atv)}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-purple-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-orange-500" />
                  Discount Analysis
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className="bg-orange-50 p-3 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                    onClick={() => setModalData({
                      isOpen: true,
                      type: 'repeat-transactions',
                      title: `${monthName} - Repeat Customer Discounted Transactions`,
                      transactions: analytics.repeatTransactions.filter(t => t.discountAmount > 0)
                    })}
                  >
                    <div className="text-xs text-gray-600">Discounted Revenue</div>
                    <div className="text-lg font-bold text-orange-600">
                      {formatCurrency(analytics.repeatCustomerMetrics.discountedRevenue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatNumber(analytics.repeatCustomerMetrics.discountedTransactions)} txns
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600">Non-Discounted</div>
                    <div className="text-lg font-bold text-gray-700">
                      {formatCurrency(analytics.repeatCustomerMetrics.nonDiscountedRevenue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatNumber(analytics.repeatCustomerMetrics.nonDiscountedTransactions)} txns
                    </div>
                  </div>
                  <div className="col-span-2 bg-red-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Total Discounts Given</span>
                      <span className="text-lg font-bold text-red-600">
                        {formatCurrency(analytics.repeatCustomerMetrics.totalDiscountAmount)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Avg: {formatPercentage(analytics.repeatCustomerMetrics.avgDiscountPercentage)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        </div>
      )}

      {/* Membership Behavior Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            Membership Behavior Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{formatNumber(analytics.renewals)}</div>
              <div className="text-sm text-gray-600 mt-1">Renewals</div>
              <div className="text-xs text-gray-500 mt-1">Same membership repurchased</div>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-3xl font-bold text-emerald-600">{formatNumber(analytics.upgrades)}</div>
              <div className="text-sm text-gray-600 mt-1">Upgrades</div>
              <div className="text-xs text-gray-500 mt-1">Higher value purchase</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{formatNumber(analytics.downgrades)}</div>
              <div className="text-sm text-gray-600 mt-1">Downgrades</div>
              <div className="text-xs text-gray-500 mt-1">Lower value purchase</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{formatNumber(analytics.stackingMembers)}</div>
              <div className="text-sm text-gray-600 mt-1">Stacking Members</div>
              <div className="text-xs text-gray-500 mt-1">Multiple memberships</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Key Insight:</strong> {analytics.renewals > analytics.upgrades + analytics.downgrades 
                  ? `High renewal rate (${formatNumber(analytics.renewals)}) indicates strong membership satisfaction and loyalty. Members prefer to maintain their current membership level.`
                  : analytics.upgrades > analytics.renewals 
                  ? `Strong upgrade activity (${formatNumber(analytics.upgrades)}) suggests members are expanding their commitment and engagement with higher-tier offerings.`
                  : `Balanced membership behavior with ${formatNumber(analytics.renewals)} renewals and ${formatNumber(analytics.upgrades + analytics.downgrades)} tier changes indicates a healthy mix of satisfied members and those adjusting their commitments.`
                }
                {analytics.stackingMembers > analytics.totalClients * 0.1 && ` Notable stacking activity (${formatNumber(analytics.stackingMembers)} members) indicates high engagement and willingness to invest in multiple offerings.`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stacked Members Detail Table */}
      {analytics.stackedMembersDetails && analytics.stackedMembersDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              Stacked Memberships - Detailed Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Total Memberships</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">Total Paid</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.stackedMembersDetails.map((member, index) => (
                    <tr key={index} className="border-t hover:bg-purple-50">
                      <td className="p-3 text-sm text-gray-900 font-medium">{member.customerName}</td>
                      <td className="p-3 text-sm text-gray-600">{member.customerEmail}</td>
                      <td className="p-3 text-sm text-center">
                        <Badge className="bg-purple-100 text-purple-700">
                          {member.totalMemberships} Memberships
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-gray-900 text-right font-semibold">
                        {formatCurrency(member.totalAmountPaid)}
                      </td>
                      <td className="p-3 text-sm text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStackedMember(member)}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <strong>Stacking Insight:</strong> {analytics.stackedMembersDetails.length} members purchased multiple memberships in {monthName}. 
                  Average stacking value: {formatCurrency(analytics.stackedMembersDetails.reduce((sum, m) => sum + m.totalAmountPaid, 0) / analytics.stackedMembersDetails.length)}.
                  These highly engaged members represent {formatPercentage((analytics.stackedMembersDetails.length / analytics.totalClients) * 100)} of total clients
                  but contribute {formatPercentage((analytics.stackedMembersDetails.reduce((sum, m) => sum + m.totalAmountPaid, 0) / analytics.totalRevenue) * 100)} of total revenue.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Distribution Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Revenue Distribution: New vs Existing Clients
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={revenueDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Revenue Composition Analysis:</strong> {newClientPercentage > 50
                  ? `New client revenue dominates at ${formatPercentage(newClientPercentage)}, indicating strong acquisition momentum but potential dependency on new customer acquisition. Focus on retention strategies to balance revenue sources.`
                  : `Existing client revenue is ${formatPercentage(existingClientPercentage)} of total, demonstrating strong client retention and loyalty. This creates a stable revenue foundation while new client acquisition contributes ${formatPercentage(newClientPercentage)}.`
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Daily Revenue Trends
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setChartView('daily')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  chartView === 'daily' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Daily View
              </button>
              <button
                onClick={() => setChartView('membership')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  chartView === 'membership' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                By Membership
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartView === 'daily' ? (
            <>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="New Client Revenue" fill="#10b981" />
                    <Bar dataKey="Existing Client Revenue" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <strong>Daily Performance Pattern:</strong> Revenue tracked across {analytics.dailyAnalytics.length} days. 
                    Average daily revenue: {formatCurrency(analytics.totalRevenue / analytics.dailyAnalytics.length)}. 
                    Peak performance days and consistent patterns indicate operational efficiency and strong demand during this period.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={membershipChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <strong>Top Performing Memberships:</strong> The top membership generated {formatCurrency(analytics.membershipAnalytics[0]?.revenue || 0)} 
                    with {formatNumber(analytics.membershipAnalytics[0]?.count || 0)} purchases. 
                    This concentration indicates clear product-market fit and customer preference for specific offerings.
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Membership Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Membership Performance by Product & Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Membership</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Count</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Avg Price</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">New</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Existing</th>
                </tr>
              </thead>
              <tbody>
                {analytics.membershipAnalytics.map((membership, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-900 font-medium">{membership.membershipName}</td>
                    <td className="p-3 text-sm text-gray-600">
                      <Badge variant="outline">{membership.cleanedCategory}</Badge>
                    </td>
                    <td className="p-3 text-sm text-gray-900 text-right font-semibold">
                      {formatCurrency(membership.revenue)}
                    </td>
                    <td className="p-3 text-sm text-gray-600 text-right">{formatNumber(membership.count)}</td>
                    <td className="p-3 text-sm text-gray-600 text-right">{formatCurrency(membership.avgPrice)}</td>
                    <td className="p-3 text-sm text-emerald-600 text-right font-medium">{formatNumber(membership.newClients)}</td>
                    <td className="p-3 text-sm text-purple-600 text-right font-medium">{formatNumber(membership.existingClients)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-amber-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Product Performance Insight:</strong> Tracking {analytics.membershipAnalytics.length} unique products. 
                Top category is {analytics.membershipAnalytics[0]?.cleanedCategory || 'N/A'}. 
                The mix of new vs existing client purchases across products reveals which offerings attract new clients versus those that drive retention among current members.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Transactions Table - Bifurcated by New/Repeat */}
      {analytics.newTransactions && analytics.repeatTransactions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
            Detailed Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                New Customer Transactions ({analytics.newTransactions?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="repeat" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Repeat Customer Transactions ({analytics.repeatTransactions?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* New Customer Transactions */}
            <TabsContent value="new">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-emerald-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Product</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Category</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">MRP</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Paid</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Discount</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Savings</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Location</th>
                      <th className="text-center p-3 text-sm font-semibold text-gray-700">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.newTransactions.slice(0, 100).map((transaction, index) => (
                      <tr 
                        key={`new-${transaction.transactionId}-${index}`}
                        className="border-t hover:bg-emerald-50 cursor-pointer transition-colors"
                        onClick={() => setModalData({
                          isOpen: true,
                          type: 'spender',
                          title: `${transaction.customerName} - Transaction History`,
                          spenderData: {
                            memberId: transaction.memberId,
                            customerName: transaction.customerName,
                            customerEmail: transaction.customerEmail,
                            totalSpent: transaction.paymentValue,
                            transactions: 1,
                            avgTransaction: transaction.paymentValue,
                            firstPurchaseDate: transaction.paymentDate,
                            lastPurchaseDate: transaction.paymentDate,
                            isNew: true,
                            rawTransactions: [transaction as any]
                          }
                        })}
                      >
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(transaction.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-sm text-gray-900 font-medium">
                          <div>{transaction.customerName}</div>
                          <div className="text-xs text-gray-500">{transaction.customerEmail}</div>
                        </td>
                        <td className="p-3 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={transaction.product}>
                            {transaction.product}
                          </div>
                          {transaction.membershipEndDate && (
                            <div className="text-xs text-gray-500">
                              Expires: {new Date(transaction.membershipEndDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {transaction.category}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-900 text-right font-medium">
                          {transaction.mrpPostTax ? formatCurrency(transaction.mrpPostTax) : '-'}
                        </td>
                        <td className="p-3 text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(transaction.paymentValue)}
                        </td>
                        <td className="p-3 text-sm text-right">
                          {transaction.discountAmount > 0 ? (
                            <span className="text-orange-600 font-medium">
                              {formatCurrency(transaction.discountAmount)}
                              {transaction.discountPercentage > 0 && (
                                <span className="text-xs block">
                                  ({formatPercentage(transaction.discountPercentage)})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-right">
                          {transaction.savings && transaction.savings > 0 ? (
                            <span className="text-green-600 font-medium">
                              {formatCurrency(transaction.savings)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {transaction.location}
                        </td>
                        <td className="p-3 text-sm text-center">
                          <div className="flex flex-col gap-1 items-center">
                            {transaction.isStacked && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">
                                Stacked
                              </Badge>
                            )}
                            {transaction.discountType && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.discountType}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {analytics.newTransactions.length > 100 && (
                <div className="mt-3 text-sm text-gray-500 text-center">
                  Showing first 100 of {analytics.newTransactions.length} transactions
                </div>
              )}
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <strong>New Customer Transaction Insights:</strong> {analytics.newTransactions.length} transactions from new customers. 
                    Avg transaction value: {formatCurrency(analytics.newCustomerMetrics.atv)}. 
                    {analytics.newCustomerMetrics.discountedTransactions > 0 && (
                      <> {formatPercentage((analytics.newCustomerMetrics.discountedTransactions / analytics.newCustomerMetrics.transactions) * 100)} of transactions included discounts.</>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Repeat Customer Transactions */}
            <TabsContent value="repeat">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-purple-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Product</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Category</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">MRP</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Paid</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Discount</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Savings</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Location</th>
                      <th className="text-center p-3 text-sm font-semibold text-gray-700">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.repeatTransactions.slice(0, 100).map((transaction, index) => (
                      <tr 
                        key={`repeat-${transaction.transactionId}-${index}`}
                        className="border-t hover:bg-purple-50 cursor-pointer transition-colors"
                        onClick={() => setModalData({
                          isOpen: true,
                          type: 'spender',
                          title: `${transaction.customerName} - Transaction History`,
                          spenderData: {
                            memberId: transaction.memberId,
                            customerName: transaction.customerName,
                            customerEmail: transaction.customerEmail,
                            totalSpent: transaction.paymentValue,
                            transactions: 1,
                            avgTransaction: transaction.paymentValue,
                            firstPurchaseDate: transaction.paymentDate,
                            lastPurchaseDate: transaction.paymentDate,
                            isNew: false,
                            rawTransactions: [transaction as any]
                          }
                        })}
                      >
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(transaction.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-sm text-gray-900 font-medium">
                          <div>{transaction.customerName}</div>
                          <div className="text-xs text-gray-500">{transaction.customerEmail}</div>
                        </td>
                        <td className="p-3 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={transaction.product}>
                            {transaction.product}
                          </div>
                          {transaction.membershipEndDate && (
                            <div className="text-xs text-gray-500">
                              Expires: {new Date(transaction.membershipEndDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {transaction.category}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-900 text-right font-medium">
                          {transaction.mrpPostTax ? formatCurrency(transaction.mrpPostTax) : '-'}
                        </td>
                        <td className="p-3 text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(transaction.paymentValue)}
                        </td>
                        <td className="p-3 text-sm text-right">
                          {transaction.discountAmount > 0 ? (
                            <span className="text-orange-600 font-medium">
                              {formatCurrency(transaction.discountAmount)}
                              {transaction.discountPercentage > 0 && (
                                <span className="text-xs block">
                                  ({formatPercentage(transaction.discountPercentage)})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-right">
                          {transaction.savings && transaction.savings > 0 ? (
                            <span className="text-green-600 font-medium">
                              {formatCurrency(transaction.savings)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {transaction.location}
                        </td>
                        <td className="p-3 text-sm text-center">
                          <div className="flex flex-col gap-1 items-center">
                            {transaction.isStacked && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">
                                Stacked
                              </Badge>
                            )}
                            {transaction.discountType && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.discountType}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {analytics.repeatTransactions.length > 100 && (
                <div className="mt-3 text-sm text-gray-500 text-center">
                  Showing first 100 of {analytics.repeatTransactions.length} transactions
                </div>
              )}
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <RefreshCw className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <strong>Repeat Customer Transaction Insights:</strong> {analytics.repeatTransactions.length} transactions from repeat customers. 
                    Avg transaction value: {formatCurrency(analytics.repeatCustomerMetrics.atv)}. 
                    {analytics.repeatCustomerMetrics.discountedTransactions > 0 && (
                      <> {formatPercentage((analytics.repeatCustomerMetrics.discountedTransactions / analytics.repeatCustomerMetrics.transactions) * 100)} of transactions included discounts.</>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Top Spenders Table - Bifurcated by New/Repeat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Top 20 Spenders - New vs Repeat Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                New Customers ({analytics.topNewSpenders?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="repeat" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Repeat Customers ({analytics.topRepeatSpenders?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Rank</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Total Spent</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Transactions</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Discounts</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Membership</th>
                      <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topNewSpenders.map((spender, index) => (
                      <tr 
                        key={index} 
                        className="border-t hover:bg-emerald-50 cursor-pointer transition-colors"
                        onClick={() => setModalData({
                          isOpen: true,
                          type: 'spender',
                          title: `${spender.customerName} - Transaction History`,
                          spenderData: spender
                        })}
                      >
                        <td className="p-3 text-sm text-gray-600">#{index + 1}</td>
                        <td className="p-3 text-sm text-gray-900 font-medium">{spender.customerName}</td>
                        <td className="p-3 text-sm text-gray-600">{spender.customerEmail}</td>
                        <td className="p-3 text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(spender.totalSpent)}
                        </td>
                        <td className="p-3 text-sm text-gray-600 text-right">{formatNumber(spender.transactions)}</td>
                        <td className="p-3 text-sm text-orange-600 text-right font-medium">
                          {formatCurrency(spender.totalDiscountReceived || 0)}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          <div>
                            <div className="font-medium truncate max-w-xs">{spender.lastMembershipName || 'N/A'}</div>
                            {spender.lastMembershipEndDate && (
                              <div className="text-xs text-gray-500">
                                Ends: {new Date(spender.lastMembershipEndDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant="default"
                            className={`text-xs ${
                              spender.membershipStatus === 'Active' ? 'bg-green-100 text-green-700' :
                              spender.membershipStatus === 'Frozen' ? 'bg-blue-100 text-blue-700' :
                              spender.membershipStatus === 'Expired' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {spender.membershipStatus || 'None'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <strong>New Customer High-Value Analysis:</strong> Top {analytics.topNewSpenders.length} new customer spenders contributed {formatCurrency(analytics.topNewSpenders.reduce((sum, s) => sum + s.totalSpent, 0))}, 
                    demonstrating strong initial engagement. Average spending: {formatCurrency(analytics.topNewSpenders.reduce((sum, s) => sum + s.totalSpent, 0) / Math.max(analytics.topNewSpenders.length, 1))} per customer.
                    Total discounts given: {formatCurrency(analytics.topNewSpenders.reduce((sum, s) => sum + (s.totalDiscountReceived || 0), 0))}.
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="repeat" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Rank</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Total Spent</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Transactions</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Discounts</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Membership</th>
                      <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topRepeatSpenders.map((spender, index) => (
                      <tr 
                        key={index} 
                        className="border-t hover:bg-purple-50 cursor-pointer transition-colors"
                        onClick={() => setModalData({
                          isOpen: true,
                          type: 'spender',
                          title: `${spender.customerName} - Transaction History`,
                          spenderData: spender
                        })}
                      >
                        <td className="p-3 text-sm text-gray-600">#{index + 1}</td>
                        <td className="p-3 text-sm text-gray-900 font-medium">{spender.customerName}</td>
                        <td className="p-3 text-sm text-gray-600">{spender.customerEmail}</td>
                        <td className="p-3 text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(spender.totalSpent)}
                        </td>
                        <td className="p-3 text-sm text-gray-600 text-right">{formatNumber(spender.transactions)}</td>
                        <td className="p-3 text-sm text-orange-600 text-right font-medium">
                          {formatCurrency(spender.totalDiscountReceived || 0)}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          <div>
                            <div className="font-medium truncate max-w-xs">{spender.lastMembershipName || 'N/A'}</div>
                            {spender.lastMembershipEndDate && (
                              <div className="text-xs text-gray-500">
                                Ends: {new Date(spender.lastMembershipEndDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant="default"
                            className={`text-xs ${
                              spender.membershipStatus === 'Active' ? 'bg-green-100 text-green-700' :
                              spender.membershipStatus === 'Frozen' ? 'bg-blue-100 text-blue-700' :
                              spender.membershipStatus === 'Expired' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {spender.membershipStatus || 'None'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <strong>Repeat Customer High-Value Analysis:</strong> Top {analytics.topRepeatSpenders.length} repeat customer spenders contributed {formatCurrency(analytics.topRepeatSpenders.reduce((sum, s) => sum + s.totalSpent, 0))}, 
                    representing {formatPercentage((analytics.topRepeatSpenders.reduce((sum, s) => sum + s.totalSpent, 0) / analytics.totalRevenue) * 100)} of total revenue.
                    These loyal customers demonstrate consistent engagement with average: {formatCurrency(analytics.topRepeatSpenders.reduce((sum, s) => sum + s.totalSpent, 0) / Math.max(analytics.topRepeatSpenders.length, 1))} per customer.
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bottom Spenders (Low Value) - Bifurcated */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-gray-600" />
            Bottom 20 Spenders - New vs Repeat Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New Customers ({analytics.bottomNewSpenders?.length || 0})</TabsTrigger>
              <TabsTrigger value="repeat">Repeat Customers ({analytics.bottomRepeatSpenders?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Total Spent</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Transactions</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Membership</th>
                      <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.bottomNewSpenders.map((spender, index) => (
                      <tr 
                        key={index} 
                        className="border-t hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setModalData({
                          isOpen: true,
                          type: 'spender',
                          title: `${spender.customerName} - Transaction History`,
                          spenderData: spender
                        })}
                      >
                        <td className="p-3 text-sm text-gray-900 font-medium">{spender.customerName}</td>
                        <td className="p-3 text-sm text-gray-600">{spender.customerEmail}</td>
                        <td className="p-3 text-sm text-gray-900 text-right">{formatCurrency(spender.totalSpent)}</td>
                        <td className="p-3 text-sm text-gray-600 text-right">{formatNumber(spender.transactions)}</td>
                        <td className="p-3 text-sm text-gray-600 truncate max-w-xs">{spender.lastMembershipName || 'N/A'}</td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant="default"
                            className={`text-xs ${
                              spender.membershipStatus === 'Active' ? 'bg-green-100 text-green-700' :
                              spender.membershipStatus === 'Frozen' ? 'bg-blue-100 text-blue-700' :
                              spender.membershipStatus === 'Expired' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {spender.membershipStatus || 'None'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <strong>New Customer Growth Opportunity:</strong> These new customers represent upselling potential through targeted engagement. 
                    Many may be trial or single-purchase customers discovering your offerings. Nurture campaigns could convert them into higher-value relationships.
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="repeat" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Total Spent</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-700">Transactions</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Membership</th>
                      <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.bottomRepeatSpenders.map((spender, index) => (
                      <tr 
                        key={index} 
                        className="border-t hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setModalData({
                          isOpen: true,
                          type: 'spender',
                          title: `${spender.customerName} - Transaction History`,
                          spenderData: spender
                        })}
                      >
                        <td className="p-3 text-sm text-gray-900 font-medium">{spender.customerName}</td>
                        <td className="p-3 text-sm text-gray-600">{spender.customerEmail}</td>
                        <td className="p-3 text-sm text-gray-900 text-right">{formatCurrency(spender.totalSpent)}</td>
                        <td className="p-3 text-sm text-gray-600 text-right">{formatNumber(spender.transactions)}</td>
                        <td className="p-3 text-sm text-gray-600 truncate max-w-xs">{spender.lastMembershipName || 'N/A'}</td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant="default"
                            className={`text-xs ${
                              spender.membershipStatus === 'Active' ? 'bg-green-100 text-green-700' :
                              spender.membershipStatus === 'Frozen' ? 'bg-blue-100 text-blue-700' :
                              spender.membershipStatus === 'Expired' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {spender.membershipStatus || 'None'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <strong>Repeat Customer Retention Insight:</strong> These lower-value repeat customers show continued loyalty despite modest spending. 
                    Re-engagement campaigns and personalized offers could help increase their lifetime value while maintaining the relationship.
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Lapsed Members Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Lapsed Members (Top 50 by Lifetime Value)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Last Membership</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Lapsed Date</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Days Since</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Lifetime Value</th>
                </tr>
              </thead>
              <tbody>
                {analytics.lapsedMembers.slice(0, 50).map((member, index) => (
                  <tr 
                    key={index} 
                    className="border-t hover:bg-red-50 cursor-pointer transition-colors"
                    onClick={() => setModalData({
                      isOpen: true,
                      type: 'lapsed',
                      title: `${member.customerName} - Lapsed Member Details`,
                      lapsedData: member
                    })}
                  >
                    <td className="p-3 text-sm text-gray-900 font-medium">{member.customerName}</td>
                    <td className="p-3 text-sm text-gray-600">{member.customerEmail}</td>
                    <td className="p-3 text-sm text-gray-600">{member.lastMembershipType}</td>
                    <td className="p-3 text-sm text-gray-600 text-right">{member.lastMembershipEndDate}</td>
                    <td className="p-3 text-sm text-red-600 text-right font-medium">{formatNumber(member.daysSinceLapsed)}</td>
                    <td className="p-3 text-sm text-gray-900 text-right font-semibold">
                      {formatCurrency(member.totalLifetimeValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Critical Churn Risk:</strong> {analytics.lapsedMembers.length} high-value members have lapsed memberships. 
                Combined lifetime value: {formatCurrency(analytics.lapsedMembers.reduce((sum, m) => sum + m.totalLifetimeValue, 0))}. 
                These are proven customers with significant historical spend - immediate win-back campaigns targeting these members could recover substantial revenue. 
                Prioritize those lapsed within 30-60 days for highest conversion probability.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discount Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-orange-600" />
            Discount & Promotion Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {formatCurrency(analytics.totalDiscountGiven)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Discounts Given</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {formatNumber(analytics.transactionsWithDiscount)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Transactions with Discount</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {formatPercentage(analytics.avgDiscountPercentage)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Average Discount %</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-orange-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Promotion Impact:</strong> {formatPercentage((analytics.transactionsWithDiscount / analytics.dailyAnalytics.reduce((sum, d) => sum + d.transactions, 0)) * 100)} of transactions 
                used discounts, resulting in {formatCurrency(analytics.totalDiscountGiven)} in revenue reduction. 
                Average discount of {formatPercentage(analytics.avgDiscountPercentage)} suggests {analytics.avgDiscountPercentage > 15 ? 'aggressive' : 'moderate'} promotional activity. 
                Monitor discount dependency to ensure long-term profitability while maintaining customer acquisition momentum.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Visit & Engagement Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {formatNumber(analytics.totalVisits)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Check-ins</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.avgVisitsPerClient.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg Visits per Client</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.visitToRevenueRatio.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Visits per ₹1K Revenue</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong>Engagement Pattern:</strong> {analytics.totalVisits} check-ins demonstrate strong facility utilization. 
                Average of {analytics.avgVisitsPerClient.toFixed(1)} visits per client indicates {analytics.avgVisitsPerClient > 8 ? 'high' : analytics.avgVisitsPerClient > 4 ? 'moderate' : 'low'} engagement levels. 
                The visit-to-revenue ratio of {analytics.visitToRevenueRatio.toFixed(2)} helps benchmark operational efficiency and pricing adequacy relative to usage patterns.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drill Down Modal */}
      <OutlierDrillDownModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ ...modalData, isOpen: false })}
        data={modalData}
      />

      {/* Stacked Member Details Modal */}
      <Dialog open={!!selectedStackedMember} onOpenChange={() => setSelectedStackedMember(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              Stacked Memberships Details
            </DialogTitle>
            <DialogDescription>
              {selectedStackedMember && (
                <>
                  <div className="text-base font-semibold text-gray-900 mt-2">
                    {selectedStackedMember.customerName}
                  </div>
                  <div className="text-sm text-gray-600">{selectedStackedMember.customerEmail}</div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStackedMember && (
            <div className="space-y-4 mt-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Total Memberships</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedStackedMember.totalMemberships}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Amount Paid</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(selectedStackedMember.totalAmountPaid)}
                  </div>
                </div>
              </div>

              {/* Membership Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Membership Breakdown</h4>
                <div className="space-y-3">
                  {selectedStackedMember.memberships.map((membership, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 text-lg">
                            {membership.membershipName}
                          </h5>
                          <Badge variant="outline" className="mt-1">
                            {membership.category}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(membership.amountPaid)}
                          </div>
                          {membership.discountAmount && membership.discountAmount > 0 && (
                            <div className="text-sm text-orange-600 font-medium mt-1">
                              Save {formatCurrency(membership.discountAmount)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Purchase Date</div>
                          <div className="font-medium text-gray-900">
                            {new Date(membership.purchaseDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        {membership.endDate && (
                          <div>
                            <div className="text-gray-500">Expiry Date</div>
                            <div className="font-medium text-gray-900">
                              {new Date(membership.endDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <strong>Member Value:</strong> This customer purchased {selectedStackedMember.totalMemberships} memberships 
                    for a total of {formatCurrency(selectedStackedMember.totalAmountPaid)}, 
                    averaging {formatCurrency(selectedStackedMember.totalAmountPaid / selectedStackedMember.totalMemberships)} per membership. 
                    {selectedStackedMember.memberships.some(m => m.discountAmount && m.discountAmount > 0) && (
                      <> They saved a total of {formatCurrency(selectedStackedMember.memberships.reduce((sum, m) => sum + (m.discountAmount || 0), 0))} through discounts.</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
