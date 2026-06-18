
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DiscountAnalysisData } from '@/hooks/useDiscountAnalysis';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { TrendingDown, TrendingUp, Target, AlertTriangle, Award, Zap } from 'lucide-react';

interface DiscountImpactInsightsProps {
  data: DiscountAnalysisData[];
}

export const DiscountImpactInsights: React.FC<DiscountImpactInsightsProps> = ({ data }) => {
  const insights = useMemo(() => {
    const discountedItems = data.filter(item => item.discountAmount > 0);
    const nonDiscountedItems = data.filter(item => item.discountAmount === 0);

    const totalDiscounts = discountedItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalRevenue = data.reduce((sum, item) => sum + item.paymentValue, 0);
    
    const avgDiscountedOrderValue = discountedItems.length > 0 
      ? discountedItems.reduce((sum, item) => sum + item.paymentValue, 0) / discountedItems.length 
      : 0;
    
    const avgNonDiscountedOrderValue = nonDiscountedItems.length > 0 
      ? nonDiscountedItems.reduce((sum, item) => sum + item.paymentValue, 0) / nonDiscountedItems.length 
      : 0;

    // Top discounted products
    const productDiscounts = discountedItems.reduce((acc, item) => {
      const product = item.cleanedProduct || 'Unknown';
      if (!acc[product]) {
        acc[product] = { totalDiscount: 0, count: 0, totalRevenue: 0 };
      }
      acc[product].totalDiscount += item.discountAmount;
      acc[product].count += 1;
      acc[product].totalRevenue += item.paymentValue;
      return acc;
    }, {} as Record<string, any>);

    const topDiscountedProducts = Object.entries(productDiscounts)
      .map(([product, data]: [string, any]) => ({
        product,
        totalDiscount: data.totalDiscount,
        avgDiscount: data.totalDiscount / data.count,
        discountRate: data.totalRevenue > 0 ? (data.totalDiscount / data.totalRevenue) * 100 : 0,
        transactions: data.count
      }))
      .sort((a, b) => b.totalDiscount - a.totalDiscount)
      .slice(0, 5);

    // Calculate discount effectiveness metrics
    const highDiscountItems = discountedItems.filter(item => item.discountPercentage > 25);
    const mediumDiscountItems = discountedItems.filter(item => {
      const discount = item.discountPercentage;
      return discount > 10 && discount <= 25;
    });
    const lowDiscountItems = discountedItems.filter(item => {
      const discount = item.discountPercentage;
      return discount > 0 && discount <= 10;
    });

    return {
      totalDiscounts,
      totalRevenue,
      discountRate: totalRevenue > 0 ? (totalDiscounts / totalRevenue) * 100 : 0,
      avgDiscountedOrderValue,
      avgNonDiscountedOrderValue,
      orderValueImpact: avgDiscountedOrderValue - avgNonDiscountedOrderValue,
      discountPenetration: data.length > 0 ? (discountedItems.length / data.length) * 100 : 0,
      topDiscountedProducts,
      highDiscountItems: highDiscountItems.length,
      mediumDiscountItems: mediumDiscountItems.length,
      lowDiscountItems: lowDiscountItems.length,
      avgDiscountAmount: discountedItems.length > 0 ? totalDiscounts / discountedItems.length : 0
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-white via-red-50/30 to-orange-50/20 border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-red-700 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Revenue Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Discounts:</span>
              <span className="font-bold text-red-600">{formatCurrency(insights.totalDiscounts)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Discount Rate:</span>
              <span className="font-bold text-red-600">{insights.discountRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Penetration:</span>
              <span className="font-bold text-orange-600">{insights.discountPenetration.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-blue-700 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Order Value Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Discounted AOV:</span>
              <span className="font-bold text-blue-600">{formatCurrency(insights.avgDiscountedOrderValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Regular AOV:</span>
              <span className="font-bold text-gray-600">{formatCurrency(insights.avgNonDiscountedOrderValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Impact:</span>
              <span className={`font-bold ${insights.orderValueImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {insights.orderValueImpact >= 0 ? '+' : ''}{formatCurrency(insights.orderValueImpact)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-purple-50/30 to-violet-50/20 border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-purple-700 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Discount Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">High (25%+):</span>
              <Badge variant="destructive">{insights.highDiscountItems}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Medium (10-25%):</span>
              <Badge variant="secondary">{insights.mediumDiscountItems}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Low (0-10%):</span>
              <Badge variant="outline">{insights.lowDiscountItems}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Discounted Products */}
      <Card className="bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/20 border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-600" />
            Top Discounted Products Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.topDiscountedProducts.map((product, index) => (
              <div key={product.product} className="flex items-center justify-between p-4 bg-white/60 rounded-lg hover:bg-white/80 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{product.product}</p>
                    <p className="text-sm text-gray-600">{product.transactions} transactions</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-bold text-amber-600">{formatCurrency(product.totalDiscount)}</div>
                  <div className="text-sm text-gray-600">{product.discountRate.toFixed(1)}% rate</div>
                  <div className="text-xs text-gray-500">{formatCurrency(product.avgDiscount)} avg</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
