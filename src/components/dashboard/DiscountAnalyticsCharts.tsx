
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar } from 'lucide-react';
import { DiscountAnalysisData } from '@/hooks/useDiscountAnalysis';
import { formatCurrency } from '@/utils/formatters';

interface DiscountAnalyticsChartsProps {
  data: DiscountAnalysisData[];
  metrics: any;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export const DiscountAnalyticsCharts: React.FC<DiscountAnalyticsChartsProps> = ({ data, metrics }) => {
  const monthlyTrendData = useMemo(() => {
    if (!metrics?.monthlyBreakdown) return [];
    
    return metrics.monthlyBreakdown
      .sort((a: any, b: any) => a.month.localeCompare(b.month))
      .map((item: any) => ({
        month: item.month,
        discountAmount: item.totalDiscount,
        revenue: item.revenue,
        transactions: item.transactions,
        discountRate: (item.totalDiscount / item.revenue) * 100
      }));
  }, [metrics]);

  const productDistribution = useMemo(() => {
    if (!metrics?.productBreakdown) return [];
    
    return metrics.productBreakdown
      .sort((a: any, b: any) => b.totalDiscount - a.totalDiscount)
      .slice(0, 8)
      .map((item: any) => ({
        name: item.product,
        value: item.totalDiscount,
        transactions: item.transactions
      }));
  }, [metrics]);

  const discountRangeData = useMemo(() => {
    const ranges = [
      { min: 0, max: 10, label: '0-10%' },
      { min: 10, max: 20, label: '10-20%' },
      { min: 20, max: 30, label: '20-30%' },
      { min: 30, max: 50, label: '30-50%' },
      { min: 50, max: 100, label: '50%+' }
    ];

    return ranges.map(range => {
      const itemsInRange = data.filter(item => {
        const discount = item.discountPercentage;
        return discount >= range.min && discount < range.max;
      });

      return {
        range: range.label,
        transactions: itemsInRange.length,
        totalDiscount: itemsInRange.reduce((sum, item) => sum + item.discountAmount, 0),
        avgDiscount: itemsInRange.length > 0 ? itemsInRange.reduce((sum, item) => sum + item.discountAmount, 0) / itemsInRange.length : 0
      };
    });
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Discount Trends */}
      <Card className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Monthly Discount Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value)} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'discountRate' ? `${(value as number).toFixed(1)}%` : formatCurrency(value as number),
                  name === 'discountAmount' ? 'Discount Amount' : 
                  name === 'revenue' ? 'Revenue' : 'Discount Rate'
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="discountAmount" fill="#3b82f6" name="Discount Amount" />
              <Line yAxisId="right" type="monotone" dataKey="discountRate" stroke="#ef4444" strokeWidth={3} name="Discount Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product Distribution */}
      <Card className="bg-gradient-to-br from-white via-purple-50/30 to-violet-50/20 border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent flex items-center gap-2">
            <PieChartIcon className="w-6 h-6 text-purple-600" />
            Discount Distribution by Product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {productDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Discount Range Analysis */}
      <Card className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 border-0 shadow-xl lg:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-600" />
            Discount Range Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={discountRangeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value, name) => [
                  formatCurrency(value as number),
                  name === 'totalDiscount' ? 'Total Discount' : 'Average Discount'
                ]}
              />
              <Legend />
              <Bar dataKey="totalDiscount" fill="#10b981" name="Total Discount" />
              <Bar dataKey="avgDiscount" fill="#06b6d4" name="Average Discount" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
