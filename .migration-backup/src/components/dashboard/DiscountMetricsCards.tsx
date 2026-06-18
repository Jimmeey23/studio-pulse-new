
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { TrendingDown, TrendingUp, Target, Percent, DollarSign, Users, ShoppingCart, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiscountMetricsCardsProps {
  data: SalesData[];
  filters?: any;
}

export const DiscountMetricsCards: React.FC<DiscountMetricsCardsProps> = ({ data, filters }) => {
  const metrics = useMemo(() => {
    let filteredData = data;
    
    // Apply filters
    if (filters) {
      filteredData = data.filter(item => {
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

    const discountedTransactions = filteredData.filter(item => (item.discountAmount || 0) > 0);
    const totalTransactions = filteredData.length;
    
    const totalDiscountAmount = discountedTransactions.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalRevenue = filteredData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const totalPotentialRevenue = filteredData.reduce((sum, item) => sum + (item.mrpPostTax || item.paymentValue || 0), 0);
    
    const discountPenetration = totalTransactions > 0 ? (discountedTransactions.length / totalTransactions) * 100 : 0;
    const avgDiscountPerTransaction = discountedTransactions.length > 0 ? totalDiscountAmount / discountedTransactions.length : 0;
    const overallDiscountRate = totalPotentialRevenue > 0 ? (totalDiscountAmount / totalPotentialRevenue) * 100 : 0;
    const revenueImpact = totalPotentialRevenue - totalRevenue;

    // Additional metrics
    const uniqueCustomersWithDiscounts = new Set(discountedTransactions.map(item => item.customerEmail)).size;
    const avgDiscountPercent = discountedTransactions.length > 0 
      ? discountedTransactions.reduce((sum, item) => sum + (item.discountPercentage || 0), 0) / discountedTransactions.length 
      : 0;

    // Top discount categories
    const categoryDiscounts = discountedTransactions.reduce((acc, item) => {
      const category = item.cleanedCategory || 'Unknown';
      if (!acc[category]) acc[category] = { amount: 0, count: 0 };
      acc[category].amount += item.discountAmount || 0;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    const topDiscountCategory = Object.entries(categoryDiscounts)
      .sort(([,a], [,b]) => b.amount - a.amount)[0];

    // Staff discount analysis
    const staffDiscounts = discountedTransactions.reduce((acc, item) => {
      const staff = item.soldBy === '-' ? 'Online/System' : item.soldBy || 'Unknown';
      if (!acc[staff]) acc[staff] = 0;
      acc[staff] += item.discountAmount || 0;
      return acc;
    }, {} as Record<string, number>);

    const topDiscountStaff = Object.entries(staffDiscounts)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalDiscountAmount,
      discountPenetration,
      avgDiscountPerTransaction,
      overallDiscountRate,
      revenueImpact,
      discountedTransactions: discountedTransactions.length,
      totalTransactions,
      uniqueCustomersWithDiscounts,
      avgDiscountPercent,
      totalRevenue,
      totalPotentialRevenue,
      topDiscountCategory: topDiscountCategory ? { 
        name: topDiscountCategory[0], 
        amount: topDiscountCategory[1].amount,
        count: topDiscountCategory[1].count 
      } : null,
      topDiscountStaff: topDiscountStaff ? { name: topDiscountStaff[0], amount: topDiscountStaff[1] } : null
    };
  }, [data, filters]);

  const metricCards = [
    {
      title: 'Total Discount Impact',
      value: formatCurrency(metrics.totalDiscountAmount),
      subtitle: `${formatCurrency(metrics.revenueImpact)} potential revenue lost`,
      icon: DollarSign,
      change: -metrics.overallDiscountRate,
      description: `Total discount: ${formatCurrency(metrics.totalDiscountAmount)} | ${metrics.overallDiscountRate.toFixed(1)}% of potential revenue`
    },
    {
      title: 'Discount Penetration',
      value: `${metrics.discountPenetration.toFixed(1)}%`,
      subtitle: `${metrics.discountedTransactions} of ${metrics.totalTransactions} transactions`,
      icon: Target,
      change: metrics.discountPenetration - 25,
      description: `${metrics.discountedTransactions} discounted transactions | ${metrics.uniqueCustomersWithDiscounts} unique customers`
    },
    {
      title: 'Average Discount',
      value: formatCurrency(metrics.avgDiscountPerTransaction),
      subtitle: 'Per discounted transaction',
      icon: Percent,
      change: 5.2,
      description: `Avg discount %: ${metrics.avgDiscountPercent.toFixed(1)}% | ${metrics.topDiscountStaff ? `Top: ${metrics.topDiscountStaff.name}` : ''}`
    },
    {
      title: 'Discount Rate',
      value: `${metrics.overallDiscountRate.toFixed(1)}%`,
      subtitle: 'Of total potential revenue',
      icon: TrendingDown,
      change: -metrics.overallDiscountRate,
      description: `Revenue efficiency: ${((metrics.totalRevenue / metrics.totalPotentialRevenue) * 100).toFixed(1)}%`
    },
    {
      title: 'Customer Impact',
      value: formatNumber(metrics.uniqueCustomersWithDiscounts),
      subtitle: 'Customers received discounts',
      icon: Users,
      change: 8.5,
      description: `Avg per customer: ${formatCurrency(metrics.uniqueCustomersWithDiscounts > 0 ? metrics.totalDiscountAmount / metrics.uniqueCustomersWithDiscounts : 0)}`
    },
    {
      title: 'Discount Frequency',
      value: `${(metrics.discountedTransactions / Math.max(metrics.uniqueCustomersWithDiscounts, 1)).toFixed(1)}`,
      subtitle: 'Avg discounts per customer',
      icon: ShoppingCart,
      change: -2.1,
      description: `Total discounted: ${metrics.discountedTransactions} | ${(metrics.discountedTransactions / Math.max(metrics.uniqueCustomersWithDiscounts, 1)) > 1.5 ? 'Frequent' : 'Occasional'} usage`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metricCards.map((metric, index) => {
        const IconComponent = metric.icon;
        const isPositive = metric.change > 0;
        const isNegative = metric.change < 0;
        const cardIndex = index % 4;
        
        return (
          <Card
            key={metric.title}
            className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-700",
              "bg-white hover:bg-gradient-to-br hover:from-gray-900 hover:via-slate-900 hover:to-slate-900",
              cardIndex === 0 && "border-t-4 border-green-700 hover:border-green-700 shadow-lg",
              cardIndex === 1 && "border-t-4 border-blue-700 hover:border-blue-700 shadow-lg",
              cardIndex === 2 && "border-t-4 border-pink-700 hover:border-pink-700 shadow-lg",
              cardIndex === 3 && "border-t-4 border-red-700 hover:border-red-700 shadow-lg",
              "hover:shadow-2xl hover:shadow-slate-900/30",
              "hover:-translate-y-2 hover:scale-[1.02]"
            )}
          >
            <CardContent className="p-6 relative">
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-all duration-700">
                <IconComponent className={cn(
                  "w-12 h-12 transition-all duration-700",
                  cardIndex === 0 && "text-green-700",
                  cardIndex === 1 && "text-blue-700",
                  cardIndex === 2 && "text-pink-700",
                  cardIndex === 3 && "text-red-700",
                  "group-hover:text-white/40"
                )} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "p-4 rounded-2xl transition-all duration-700 border-1 shadow-md",
                      cardIndex === 0 && "bg-gradient-to-br from-green-700 to-green-600 border-green-900 text-white shadow-green-200",
                      cardIndex === 1 && "bg-gradient-to-br from-blue-700 to-blue-600 border-blue-900 text-white shadow-blue-200",
                      cardIndex === 2 && "bg-gradient-to-br from-pink-700 to-pink-600 border-pink-900 text-white shadow-pink-200",
                      cardIndex === 3 && "bg-gradient-to-br from-red-700 to-red-600 border-red-900 text-white shadow-red-200",
                      "group-hover:bg-white/20 group-hover:border-white/40 group-hover:text-white group-hover:shadow-white/20"
                    )}>
                      <IconComponent className="w-6 h-6 drop-shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-slate-900 group-hover:text-white/95 transition-colors duration-700">
                        {metric.title}
                      </h3>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-700",
                    isPositive
                      ? "bg-green-50 text-green-700 group-hover:bg-green-400/30 group-hover:text-green-100"
                      : isNegative
                      ? "bg-red-50 text-red-700 group-hover:bg-red-400/30 group-hover:text-red-100"
                      : "bg-blue-50 text-blue-700 group-hover:bg-blue-400/30 group-hover:text-blue-100"
                  )}>
                    {isPositive && <TrendingUp className="w-3 h-3" />}
                    {isNegative && <TrendingDown className="w-3 h-3" />}
                    <span>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className={cn(
                    "text-4xl font-bold transition-all duration-700 text-slate-900 group-hover:text-white"
                  )}>
                    {metric.value}
                  </p>
                  <p className={cn(
                    "text-xs text-slate-500 group-hover:text-slate-200 transition-colors"
                  )}>
                    {metric.subtitle}
                  </p>
                </div>
              </div>
              
              <div className={cn(
                "mt-4 p-3 border-t border-l-4 transition-all duration-700",
                "bg-slate-50 group-hover:bg-slate-800/50 border-t-slate-200 group-hover:border-t-white/10",
                cardIndex === 0 && "border-l-green-700",
                cardIndex === 1 && "border-l-blue-700",
                cardIndex === 2 && "border-l-pink-700",
                cardIndex === 3 && "border-l-red-700"
              )}>
                <p className="text-xs text-slate-900 group-hover:text-white transition-colors duration-700">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
