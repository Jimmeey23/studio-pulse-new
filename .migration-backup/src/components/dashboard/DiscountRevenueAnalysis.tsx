
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface DiscountRevenueAnalysisProps {
  data: SalesData[];
}

export const DiscountRevenueAnalysis: React.FC<DiscountRevenueAnalysisProps> = ({ data }) => {
  const analysisData = useMemo(() => {
    // Group by discount percentage ranges
    const discountRanges = [
      { min: 0, max: 0, label: 'No Discount' },
      { min: 0.1, max: 10, label: '0-10%' },
      { min: 10.1, max: 20, label: '10-20%' },
      { min: 20.1, max: 30, label: '20-30%' },
      { min: 30.1, max: 50, label: '30-50%' },
      { min: 50.1, max: 100, label: '50%+' }
    ];

    const rangeData = discountRanges.map(range => {
      const itemsInRange = data.filter(item => {
        const discountPercent = item.discountPercentage || 0;
        if (range.min === 0 && range.max === 0) {
          return discountPercent === 0;
        }
        return discountPercent >= range.min && discountPercent <= range.max;
      });

      const totalRevenue = itemsInRange.reduce((sum, item) => sum + (item.grossRevenue || 0), 0);
      const totalNetRevenue = itemsInRange.reduce((sum, item) => sum + (item.netRevenue || 0), 0);
      const totalDiscounts = itemsInRange.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
      const avgOrderValue = itemsInRange.length > 0 ? totalRevenue / itemsInRange.length : 0;

      return {
        range: range.label,
        transactions: itemsInRange.length,
        totalRevenue,
        totalNetRevenue,
        totalDiscounts,
        avgOrderValue,
        revenueImpact: totalRevenue - totalDiscounts
      };
    });

    return rangeData;
  }, [data]);

  const scatterData = useMemo(() => {
    return data
      .filter(item => (item.discountAmount || 0) > 0)
      .map(item => ({
        discountPercent: item.discountPercentage || 0,
        revenue: item.grossRevenue || 0,
        discountAmount: item.discountAmount || 0,
        product: item.cleanedProduct
      }))
      .slice(0, 100); // Limit for performance
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue by Discount Range */}
      <Card className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Revenue by Discount Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysisData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'transactions' ? formatNumber(value as number) : formatCurrency(value as number),
                  name
                ]}
              />
              <Legend />
              <Bar dataKey="totalRevenue" fill="#10b981" name="Gross Revenue" />
              <Bar dataKey="totalDiscounts" fill="#ef4444" name="Discounts Given" />
              <Bar dataKey="totalNetRevenue" fill="#3b82f6" name="Net Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Discount vs Revenue Scatter */}
      <Card className="bg-gradient-to-br from-white via-purple-50/30 to-violet-50/20 border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent flex items-center gap-2">
            <Percent className="w-6 h-6 text-purple-600" />
            Discount % vs Revenue Correlation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="discountPercent" 
                name="Discount %" 
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                dataKey="revenue" 
                name="Revenue"
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'discountPercent' ? `${value}%` : formatCurrency(value as number),
                  name === 'discountPercent' ? 'Discount %' : 'Revenue'
                ]}
                labelFormatter={() => ''}
              />
              <Scatter dataKey="revenue" fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
