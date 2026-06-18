import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Percent,
  Receipt,
  CreditCard,
  Tag
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
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
  LineChart,
  Line
} from 'recharts';

interface RevenuePerformanceSectionProps {
  metrics: LocationReportMetrics;
}

export const RevenuePerformanceSection: React.FC<RevenuePerformanceSectionProps> = ({
  metrics
}) => {
  // Revenue breakdown data for chart
  const revenueBreakdown = [
    { name: 'Gross Revenue', value: metrics.totalRevenue, color: '#3B82F6' },
    { name: 'VAT Amount', value: metrics.vatAmount, color: '#EF4444' },
    { name: 'Net Revenue', value: metrics.netRevenue, color: '#10B981' }
  ];

  // Sample month-over-month data (in a real implementation, this would come from historical data)
  const monthlyTrend = [
    { month: 'Oct', revenue: metrics.totalRevenue * 0.85, transactions: metrics.totalTransactions * 0.9 },
    { month: 'Nov', revenue: metrics.totalRevenue * 0.92, transactions: metrics.totalTransactions * 0.95 },
    { month: 'Dec', revenue: metrics.totalRevenue, transactions: metrics.totalTransactions }
  ];

  const revenueMetrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      subValue: `From ${formatNumber(metrics.totalTransactions)} transactions`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: metrics.revenueGrowth
    },
    {
      title: 'Net Revenue',
      value: formatCurrency(metrics.netRevenue),
      subValue: `After VAT: ${formatCurrency(metrics.vatAmount)}`,
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: 0
    },
    {
      title: 'Avg Transaction Value',
      value: formatCurrency(metrics.avgTransactionValue),
      subValue: `Per transaction average`,
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: 0
    },
    {
      title: 'Revenue per Member',
      value: formatCurrency(metrics.avgSpendPerMember),
      subValue: `From ${formatNumber(metrics.uniqueMembers)} unique members`,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: 0
    },
    {
      title: 'Total Discounts',
      value: formatCurrency(metrics.totalDiscounts),
      subValue: `${formatPercentage(metrics.discountRate)} discount rate`,
      icon: Tag,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: 0
    }
  ];

  const getTrendBadge = (change: number) => {
    if (change > 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800">+{change}%</Badge>;
    } else if (change < 0) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">{change}%</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Revenue Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {revenueMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                {metric.change !== 0 && getTrendBadge(metric.change)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                    name === 'revenue' ? 'Revenue' : 'Transactions'
                  ]} 
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Transaction Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{formatNumber(metrics.totalTransactions)}</p>
              <p className="text-sm text-gray-600 mt-2">Total Transactions</p>
              <p className="text-xs text-gray-500">Payment processed successfully</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{formatNumber(metrics.uniqueMembers)}</p>
              <p className="text-sm text-gray-600 mt-2">Unique Members</p>
              <p className="text-xs text-gray-500">Individual customers served</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">
                {formatNumber(metrics.totalTransactions / (metrics.uniqueMembers || 1))}
              </p>
              <p className="text-sm text-gray-600 mt-2">Avg Transactions per Member</p>
              <p className="text-xs text-gray-500">Purchase frequency indicator</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discount Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tag className="w-5 h-5 mr-2" />
            Discount & Promotion Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Discount Rate</span>
                <Badge variant={metrics.discountRate > 15 ? "destructive" : "default"}>
                  {formatPercentage(metrics.discountRate)}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${metrics.discountRate > 15 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(metrics.discountRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {metrics.discountRate > 15 ? 'High discount rate - review pricing strategy' : 'Healthy discount rate'}
              </p>
            </div>
            <div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalDiscounts)}</p>
                <p className="text-sm text-gray-600">Total Discounts Given</p>
                <p className="text-xs text-gray-500 mt-1">
                  Impact on revenue: {formatPercentage((metrics.totalDiscounts / metrics.totalRevenue) * 100)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenuePerformanceSection;