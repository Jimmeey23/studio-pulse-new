
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { TrendingUp, Package, Users, Calendar } from 'lucide-react';

interface DiscountDistributionChartsProps {
  data: SalesData[];
  filters?: any;
}

export const DiscountDistributionCharts: React.FC<DiscountDistributionChartsProps> = ({ data, filters }) => {
  const chartData = useMemo(() => {
    const discountedData = data.filter(item => (item.discountAmount || 0) > 0);
    
    // Apply filters
    let filteredData = discountedData;
    if (filters) {
      filteredData = discountedData.filter(item => {
        if (filters.location && item.calculatedLocation !== filters.location) return false;
        if (filters.category && item.cleanedCategory !== filters.category) return false;
        if (filters.product && item.cleanedProduct !== filters.product) return false;
        if (filters.soldBy && (item.soldBy === '-' ? 'Online/System' : item.soldBy) !== filters.soldBy) return false;
        if (filters.paymentMethod && item.paymentMethod !== filters.paymentMethod) return false;
        if (filters.minDiscountAmount && (item.discountAmount || 0) < filters.minDiscountAmount) return false;
        if (filters.maxDiscountAmount && (item.discountAmount || 0) > filters.maxDiscountAmount) return false;
        if (filters.minDiscountPercent && (item.discountPercentage || 0) < filters.minDiscountPercent) return false;
        if (filters.maxDiscountPercent && (item.discountPercentage || 0) > filters.maxDiscountPercent) return false;
        if (filters.dateRange?.from || filters.dateRange?.to) {
          const itemDate = new Date(item.paymentDate);
          if (filters.dateRange.from && itemDate < filters.dateRange.from) return false;
          if (filters.dateRange.to && itemDate > filters.dateRange.to) return false;
        }
        return true;
      });
    }

    // Discount range distribution
    const discountRanges = [
      { range: '₹0-500', min: 0, max: 500 },
      { range: '₹501-1000', min: 501, max: 1000 },
      { range: '₹1001-2000', min: 1001, max: 2000 },
      { range: '₹2001-5000', min: 2001, max: 5000 },
      { range: '₹5000+', min: 5001, max: Infinity }
    ];

    const rangeData = discountRanges.map(range => {
      const transactions = filteredData.filter(item => 
        (item.discountAmount || 0) >= range.min && (item.discountAmount || 0) <= range.max
      );
      return {
        range: range.range,
        transactions: transactions.length,
        totalDiscount: transactions.reduce((sum, item) => sum + (item.discountAmount || 0), 0)
      };
    });

    // Category-wise discount distribution
    const categoryData = Object.entries(
      filteredData.reduce((acc, item) => {
        const category = item.cleanedCategory || 'Unknown';
        if (!acc[category]) acc[category] = { transactions: 0, totalDiscount: 0 };
        acc[category].transactions += 1;
        acc[category].totalDiscount += item.discountAmount || 0;
        return acc;
      }, {} as Record<string, { transactions: number; totalDiscount: number }>)
    ).map(([category, data]) => ({
      category,
      transactions: data.transactions,
      totalDiscount: data.totalDiscount
    })).sort((a, b) => b.totalDiscount - a.totalDiscount).slice(0, 8);

    // Monthly discount trends
    const monthlyData = Object.entries(
      filteredData.reduce((acc, item) => {
        const date = new Date(item.paymentDate);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!acc[monthKey]) acc[monthKey] = { totalDiscount: 0, transactions: 0 };
        acc[monthKey].totalDiscount += item.discountAmount || 0;
        acc[monthKey].transactions += 1;
        return acc;
      }, {} as Record<string, { totalDiscount: number; transactions: number }>)
    ).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      totalDiscount: data.totalDiscount,
      transactions: data.transactions,
      avgDiscount: data.transactions > 0 ? data.totalDiscount / data.transactions : 0
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Staff discount performance
    const staffData = Object.entries(
      filteredData.reduce((acc, item) => {
        const staff = item.soldBy === '-' ? 'Online/System' : item.soldBy || 'Unknown';
        if (!acc[staff]) acc[staff] = { totalDiscount: 0, transactions: 0 };
        acc[staff].totalDiscount += item.discountAmount || 0;
        acc[staff].transactions += 1;
        return acc;
      }, {} as Record<string, { totalDiscount: number; transactions: number }>)
    ).map(([staff, data]) => ({
      staff,
      totalDiscount: data.totalDiscount,
      transactions: data.transactions,
      avgDiscount: data.transactions > 0 ? data.totalDiscount / data.transactions : 0
    })).sort((a, b) => b.totalDiscount - a.totalDiscount).slice(0, 8);

    return { rangeData, categoryData, monthlyData, staffData };
  }, [data, filters]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb366', '#67b7dc'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Discount Range Distribution */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Discount Range Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.rangeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'transactions' ? formatNumber(value as number) : formatCurrency(value as number),
                  name === 'transactions' ? 'Transactions' : 'Total Discount'
                ]}
              />
              <Bar dataKey="transactions" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Discount Breakdown */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Category Discount Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, totalDiscount }) => `${category}: ${formatCurrency(totalDiscount)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalDiscount"
              >
                {chartData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Discount Trends */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Monthly Discount Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  formatCurrency(value as number),
                  name === 'totalDiscount' ? 'Total Discount' : 'Avg Discount'
                ]}
              />
              <Line type="monotone" dataKey="totalDiscount" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="avgDiscount" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Staff Discount Performance */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Staff Discount Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={chartData.staffData} 
              layout="horizontal" 
              margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="staff" type="category" width={70} />
              <Tooltip 
                formatter={(value, name) => [
                  formatCurrency(value as number),
                  name === 'totalDiscount' ? 'Total Discount' : 'Avg Discount'
                ]}
              />
              <Bar dataKey="totalDiscount" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
