
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Award, Target, Zap, AlertTriangle } from 'lucide-react';
import { DiscountAnalysisData } from '@/hooks/useDiscountAnalysis';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface DiscountTopBottomListsProps {
  data: DiscountAnalysisData[];
  onItemClick?: (item: any) => void;
}

export const DiscountTopBottomLists: React.FC<DiscountTopBottomListsProps> = ({
  data,
  onItemClick
}) => {
  const { topDiscountProducts, bottomDiscountProducts, topDiscountStaff, mostDiscountedCategories } = useMemo(() => {
    // Top discount products by total discount amount
    const productDiscounts = data
      .filter(item => item.discountAmount > 0)
      .reduce((acc, item) => {
        const product = item.cleanedProduct || 'Unknown Product';
        if (!acc[product]) {
          acc[product] = {
            product,
            totalDiscount: 0,
            transactions: 0,
            avgDiscount: 0,
            totalRevenue: 0,
            avgDiscountPercent: 0,
            category: item.cleanedCategory || 'Unknown'
          };
        }
        acc[product].totalDiscount += item.discountAmount;
        acc[product].transactions += 1;
        acc[product].totalRevenue += item.paymentValue;
        acc[product].avgDiscountPercent += item.discountPercentage;
        return acc;
      }, {} as Record<string, any>);

    const processedProducts = Object.values(productDiscounts)
      .map((item: any) => ({
        ...item,
        avgDiscount: item.totalDiscount / item.transactions,
        discountRate: item.totalRevenue > 0 ? (item.totalDiscount / item.totalRevenue) * 100 : 0,
        avgDiscountPercent: item.avgDiscountPercent / item.transactions
      }))
      .sort((a, b) => b.totalDiscount - a.totalDiscount);

    // Top discount staff
    const staffDiscounts = data
      .filter(item => item.discountAmount > 0)
      .reduce((acc, item) => {
        const staff = item.soldBy || 'Unknown Staff';
        if (!acc[staff]) {
          acc[staff] = {
            staff,
            totalDiscount: 0,
            transactions: 0,
            avgDiscount: 0,
            totalRevenue: 0,
            discountRate: 0
          };
        }
        acc[staff].totalDiscount += item.discountAmount;
        acc[staff].transactions += 1;
        acc[staff].totalRevenue += item.paymentValue;
        return acc;
      }, {} as Record<string, any>);

    const processedStaff = Object.values(staffDiscounts)
      .map((item: any) => ({
        ...item,
        avgDiscount: item.totalDiscount / item.transactions,
        discountRate: item.totalRevenue > 0 ? (item.totalDiscount / item.totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.totalDiscount - a.totalDiscount);

    // Category discounts
    const categoryDiscounts = data
      .filter(item => item.discountAmount > 0)
      .reduce((acc, item) => {
        const category = item.cleanedCategory || 'Unknown Category';
        if (!acc[category]) {
          acc[category] = {
            category,
            totalDiscount: 0,
            transactions: 0,
            avgDiscount: 0,
            totalRevenue: 0,
            penetration: 0
          };
        }
        acc[category].totalDiscount += item.discountAmount;
        acc[category].transactions += 1;
        acc[category].totalRevenue += item.paymentValue;
        return acc;
      }, {} as Record<string, any>);

    const totalTransactionsByCategory = data.reduce((acc, item) => {
      const category = item.cleanedCategory || 'Unknown Category';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const processedCategories = Object.values(categoryDiscounts)
      .map((item: any) => ({
        ...item,
        avgDiscount: item.totalDiscount / item.transactions,
        discountRate: item.totalRevenue > 0 ? (item.totalDiscount / item.totalRevenue) * 100 : 0,
        penetration: totalTransactionsByCategory[item.category] > 0 
          ? (item.transactions / totalTransactionsByCategory[item.category]) * 100 
          : 0
      }))
      .sort((a, b) => b.totalDiscount - a.totalDiscount);

    return {
      topDiscountProducts: processedProducts.slice(0, 5),
      bottomDiscountProducts: processedProducts.slice(-5).reverse(),
      topDiscountStaff: processedStaff.slice(0, 5),
      mostDiscountedCategories: processedCategories.slice(0, 5)
    };
  }, [data]);

  const ListCard = ({ title, items, icon: Icon, gradient, onItemClick }: any) => (
    <Card className={cn("border-0 shadow-xl", gradient)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {items.map((item: any, index: number) => (
            <div
              key={item.product || item.staff || item.category}
              className="flex items-center justify-between p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all duration-300 hover:scale-102 cursor-pointer"
              onClick={() => onItemClick?.(item)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-800 truncate">
                    {item.product || item.staff || item.category}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span>{item.transactions} transactions</span>
                    {item.category && (
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="font-bold text-blue-600 text-sm">
                  {formatCurrency(item.totalDiscount)}
                </div>
                <div className="text-xs text-slate-600">
                  {item.discountRate?.toFixed(1)}% rate
                </div>
                <div className="text-xs text-slate-500">
                  {formatCurrency(item.avgDiscount)} avg
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ListCard
        title="Top Discounted Products"
        items={topDiscountProducts}
        icon={Award}
        gradient="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20"
        onItemClick={onItemClick}
      />

      <ListCard
        title="Least Discounted Products"
        items={bottomDiscountProducts}
        icon={Target}
        gradient="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20"
        onItemClick={onItemClick}
      />

      <ListCard
        title="Top Discount-Giving Staff"
        items={topDiscountStaff}
        icon={TrendingUp}
        gradient="bg-gradient-to-br from-white via-purple-50/30 to-violet-50/20"
        onItemClick={onItemClick}
      />

      <ListCard
        title="Most Discounted Categories"
        items={mostDiscountedCategories}
        icon={Zap}
        gradient="bg-gradient-to-br from-white via-orange-50/30 to-red-50/20"
        onItemClick={onItemClick}
      />
    </div>
  );
};
