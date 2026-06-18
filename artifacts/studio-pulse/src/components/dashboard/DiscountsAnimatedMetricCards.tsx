import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Percent, ShoppingCart, CreditCard, DollarSign, Target, Activity, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { useDiscountMetrics } from '@/hooks/useDiscountMetrics';

interface DiscountsAnimatedMetricCardsProps {
  data: SalesData[];
  historicalData?: SalesData[];
  dateRange?: { start?: string | Date; end?: string | Date };
  onMetricClick?: (metricData: any) => void;
}

const iconMap: Record<string, any> = {
  DollarSign,
  ShoppingCart,
  Activity,
  Users,
  Target,
  Percent,
  CreditCard,
  ArrowDownRight
};

export const DiscountsAnimatedMetricCards: React.FC<DiscountsAnimatedMetricCardsProps> = ({ 
  data,
  historicalData,
  dateRange,
  onMetricClick 
}) => {
  const { metrics } = useDiscountMetrics(data, historicalData, { dateRange });

  // Debug logging removed for production

  // For drill down context, compute some derived totals from current period subset of data
  // Note: Show ALL transactions, not just discounted ones - useful for seeing full sales picture even if no discounts
  const calculatedContext = useMemo(() => {
    const totalDiscounts = data.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalRevenue = data.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const totalTransactions = data.length;
    const discountedTransactions = data.filter(item => (item.discountAmount || 0) > 0).length;
    const uniqueCustomers = new Set(data.map(item => item.memberId || item.customerEmail)).size;
    const customersWithDiscounts = new Set(
      data.filter(item => (item.discountAmount || 0) > 0)
          .map(item => item.memberId || item.customerEmail)
    ).size;
    const discountPenetration = totalTransactions > 0 ? (discountedTransactions / totalTransactions) * 100 : 0;
    const discountRate = totalRevenue + totalDiscounts > 0 ? (totalDiscounts / (totalRevenue + totalDiscounts)) * 100 : 0;
    
    // Debug: log removed for production
    
    return { totalDiscounts, totalRevenue, totalTransactions, discountedTransactions, uniqueCustomers, customersWithDiscounts, discountPenetration, discountRate };
  }, [data]);

  const { totalRevenue, totalDiscounts, totalTransactions, discountedTransactions, uniqueCustomers, customersWithDiscounts, discountPenetration, discountRate } = calculatedContext;

  const handleMetricClick = (metric: any) => {
    if (onMetricClick) {
      const drillDownData = {
        title: metric.title,
        name: metric.title,
        type: 'metric',
        totalRevenue,
        totalDiscounts,
        transactions: totalTransactions,
        discountedTransactions,
        uniqueCustomers,
        customersWithDiscounts,
        discountRate,
        discountPenetration,
        rawData: data,
        filteredTransactionData: data,
        isDynamic: true,
        calculatedFromFiltered: true
      };
      
      onMetricClick(drillDownData);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || DollarSign;
        const isPositive = metric.change > 0;
        const isNegative = metric.change < 0;
        
        return (
          <Card 
            key={metric.title}
            className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-700",
              "bg-white hover:bg-gradient-to-br hover:from-gray-900 hover:via-slate-900 hover:to-slate-900",
              index % 4 === 0 && "border-t-4 border-indigo-700 hover:border-indigo-700 shadow-lg",
              index % 4 === 1 && "border-t-4 border-purple-700 hover:border-purple-700 shadow-lg",
              index % 4 === 2 && "border-t-4 border-blue-700 hover:border-blue-700 shadow-lg", 
              index % 4 === 3 && "border-t-4 border-violet-700 hover:border-violet-700 shadow-lg",
              "hover:shadow-2xl hover:shadow-slate-900/30",
              "hover:-translate-y-2 hover:scale-[1.02]",
              onMetricClick && "hover:cursor-pointer"
            )}
            onClick={() => handleMetricClick(metric)}
          >
            <CardContent className="p-6 relative">
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-all duration-700">
                <IconComponent className={cn(
                  "w-12 h-12 transition-all duration-700",
                  index % 4 === 0 && "text-indigo-700",
                  index % 4 === 1 && "text-purple-700",
                  index % 4 === 2 && "text-blue-700",
                  index % 4 === 3 && "text-violet-700",
                  "group-hover:text-white/40"
                )} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "p-4 rounded-2xl transition-all duration-700 border-1 shadow-md",
                      index % 4 === 0 && "bg-gradient-to-br from-indigo-700 to-indigo-600 border-indigo-900 text-white shadow-indigo-200",
                      index % 4 === 1 && "bg-gradient-to-br from-purple-700 to-purple-600 border-purple-900 text-white shadow-purple-200",
                      index % 4 === 2 && "bg-gradient-to-br from-blue-700 to-blue-600 border-blue-900 text-white shadow-blue-200",
                      index % 4 === 3 && "bg-gradient-to-br from-violet-700 to-violet-600 border-violet-900 text-white shadow-violet-200",
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
                    {metric.periodLabel ? (
                      <>
                        {metric.periodLabel}: <span className="font-medium">{metric.previousValue}</span>
                      </>
                    ) : (
                      <>vs previous month: <span className="font-medium">{metric.previousValue}</span></>
                    )}
                  </p>
                </div>
              </div>
              
              <div className={cn(
                "mt-4 p-3 border-t border-l-4 transition-all duration-700",
                "bg-slate-50 group-hover:bg-slate-800/50 border-t-slate-200 group-hover:border-t-white/10",
                index % 4 === 0 && "border-l-indigo-700",
                index % 4 === 1 && "border-l-purple-700",
                index % 4 === 2 && "border-l-blue-700",
                index % 4 === 3 && "border-l-violet-700"
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