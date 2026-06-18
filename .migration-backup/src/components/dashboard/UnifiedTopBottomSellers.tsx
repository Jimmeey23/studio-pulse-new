import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, Award, Eye, BarChart3, Users, Package, Tag, UserCheck, CreditCard, Percent } from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { SalesDrillDownModal } from './SalesDrillDownModal';

interface UnifiedTopBottomSellersProps {
  data: SalesData[];
  onRowClick?: (row: any) => void;
}

type RankingType = 'product' | 'category' | 'member' | 'seller' | 'paymentMethod' | 'discountValue';
type DisplayLimit = 5 | 10 | 15 | 20 | 'all';

export const UnifiedTopBottomSellers: React.FC<UnifiedTopBottomSellersProps> = ({ data, onRowClick }) => {
  const [activeType, setActiveType] = useState<RankingType>('product');
  const [displayLimit, setDisplayLimit] = useState<DisplayLimit>(5);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  const getGroupedData = (type: RankingType) => {
    const grouped = data.reduce((acc, item) => {
      const key =
        type === 'product' ? item.cleanedProduct :
        type === 'category' ? item.cleanedCategory :
        type === 'member' ? item.customerName :
        type === 'seller' ? item.soldBy :
        type === 'paymentMethod' ? item.paymentMethod :
        item.cleanedProduct;

      if (!acc[key]) {
        acc[key] = {
          name: key,
          totalValue: 0,
          unitsSold: 0,
          transactions: 0,
          uniqueMembers: new Set<string>(),
          discountValue: 0,
          atv: 0,
          auv: 0,
          asv: 0,
          upt: 0,
        };
      }

      acc[key].totalValue += Number(item.paymentValue) || 0;
      acc[key].unitsSold += 1;
      acc[key].transactions += 1;
      if (item.memberId) acc[key].uniqueMembers.add(item.memberId);
      acc[key].discountValue += Number(item.discountAmount) || 0;

      return acc;
    }, {} as Record<string, any>);

    Object.values(grouped).forEach((item: any) => {
      const uniqueMembersCount = item.uniqueMembers.size;
      item.uniqueMembers = uniqueMembersCount;
      item.atv = item.transactions > 0 ? item.totalValue / item.transactions : 0;
      item.auv = item.unitsSold > 0 ? item.totalValue / item.unitsSold : 0;
      item.asv = uniqueMembersCount > 0 ? item.totalValue / uniqueMembersCount : 0;
      item.upt = item.transactions > 0 ? item.unitsSold / item.transactions : 0;
      item.discountRate = item.totalValue > 0 ? (item.discountValue / item.totalValue) * 100 : 0;
    });

    return Object.values(grouped).sort((a: any, b: any) => {
      if (type === 'discountValue') return b.discountValue - a.discountValue;
      return b.totalValue - a.totalValue;
    });
  };

  const getTypeConfig = (type: RankingType) => {
    switch (type) {
      case 'product':
        return { icon: Package, label: 'Products', description: 'Individual product performance' };
      case 'category':
        return { icon: Tag, label: 'Categories', description: 'Category-wise performance' };
      case 'member':
        return { icon: Users, label: 'Members', description: 'Customer spending patterns' };
      case 'seller':
        return { icon: UserCheck, label: 'Associates', description: 'Sales representative performance' };
      case 'paymentMethod':
        return { icon: CreditCard, label: 'Payment Methods', description: 'Revenue by payment method' };
      case 'discountValue':
        return { icon: Percent, label: 'Discount Value', description: 'Products with the highest discount value' };
      default:
        return { icon: Package, label: 'Products', description: 'Performance data' };
    }
  };

  const renderSellerCard = (sellers: any[], isTop: boolean, type: RankingType) => {
    const config = getTypeConfig(type);

    return (
      <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-900">
            {isTop ? (
              <>
                <div className="rounded-2xl bg-slate-900 p-2 text-white shadow-sm">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-900">Top {displayLimit === 'all' ? sellers.length : displayLimit} {config.label}</span>
                  <p className="text-xs font-normal text-slate-500">{config.description}</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl bg-slate-700 p-2 text-white shadow-sm">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-900">Bottom {displayLimit === 'all' ? sellers.length : displayLimit} {config.label}</span>
                  <p className="text-xs font-normal text-slate-500">Areas for improvement</p>
                </div>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sellers.map((seller, index) => (
            <div
              key={seller.name}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition-all duration-300 hover:bg-white hover:shadow-sm cursor-pointer"
              onClick={() => {
                const filtered = data.filter((item) => {
                  switch (type) {
                    case 'product': return item.cleanedProduct === seller.name;
                    case 'category': return item.cleanedCategory === seller.name;
                    case 'member': return item.customerName === seller.name;
                    case 'seller': return item.soldBy === seller.name;
                    case 'paymentMethod': return item.paymentMethod === seller.name;
                    case 'discountValue': return item.cleanedProduct === seller.name;
                    default: return false;
                  }
                });
                onRowClick?.({
                  ...seller,
                  rawData: filtered,
                  filteredTransactionData: filtered,
                  type,
                  title: seller.name,
                  name: seller.name,
                  grossRevenue: seller.totalValue,
                  totalRevenue: seller.totalValue,
                  totalValue: seller.totalValue,
                  totalCurrent: seller.totalValue,
                  metricValue: seller.totalValue,
                  transactions: seller.transactions,
                  totalTransactions: seller.transactions,
                  uniqueMembers: seller.uniqueMembers,
                  totalCustomers: seller.uniqueMembers,
                  totalChange: 12.5,
                  months: {},
                  monthlyValues: {},
                  isDynamic: true,
                  calculatedFromFiltered: true,
                });
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm text-white font-bold text-sm select-none', isTop ? 'bg-gradient-to-br from-blue-700 to-blue-900' : 'bg-gradient-to-br from-red-700 to-red-900')}>
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 whitespace-normal break-words transition-colors">{seller.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs border-slate-200 bg-slate-50 text-slate-700">
                      {formatNumber(seller.transactions)} txns
                    </Badge>
                    <Badge variant="outline" className="text-xs border-slate-200 bg-white text-slate-700">Members: {formatNumber(seller.uniqueMembers)}</Badge>
                    <Badge variant="outline" className="text-xs border-slate-200 bg-white text-slate-700">Discount: {formatCurrency(seller.discountValue)}</Badge>
                    <Badge variant="outline" className="text-xs border-slate-200 bg-white text-slate-700">Discount %: {seller.discountRate.toFixed(1)}%</Badge>
                    {type !== 'discountValue' ? <Badge variant="outline" className="text-xs border-slate-200 bg-white text-slate-700">ATV: {formatCurrency(seller.atv)}</Badge> : null}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-slate-900">{type === 'discountValue' ? formatCurrency(seller.discountValue) : formatCurrency(seller.totalValue)}</p>
                <p className="text-xs text-slate-500">{formatNumber(seller.unitsSold)} units</p>
                <p className="text-xs text-slate-400">{formatNumber(seller.uniqueMembers)} members</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-slate-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    const filtered = data.filter((item) => {
                      switch (type) {
                        case 'product': return item.cleanedProduct === seller.name;
                        case 'category': return item.cleanedCategory === seller.name;
                        case 'member': return item.customerName === seller.name;
                        case 'seller': return item.soldBy === seller.name;
                        case 'paymentMethod': return item.paymentMethod === seller.name;
                        case 'discountValue': return item.cleanedProduct === seller.name;
                        default: return false;
                      }
                    });

                    const drillDownInfo = {
                      ...seller,
                      rawData: filtered,
                      filteredTransactionData: filtered,
                      type,
                      title: seller.name,
                      name: seller.name,
                      grossRevenue: seller.totalValue,
                      totalValue: seller.totalValue,
                      totalCurrent: seller.totalValue,
                      metricValue: seller.totalValue,
                      transactions: seller.transactions,
                      totalTransactions: seller.transactions,
                      uniqueMembers: seller.uniqueMembers,
                      totalCustomers: seller.uniqueMembers,
                      totalChange: 0,
                      months: {},
                      monthlyValues: {},
                    };

                    setDrillDownData(drillDownInfo);
                    setIsDrillDownOpen(true);
                  }}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  View Analytics
                </Button>
              </div>
            </div>
          ))}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <BarChart3 className="h-4 w-4" />
                Performance Summary
              </h4>
            </div>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>• Average revenue: {formatCurrency(sellers.reduce((sum, seller) => sum + seller.totalValue, 0) / Math.max(sellers.length, 1))}</li>
              <li>• Total transactions: {formatNumber(sellers.reduce((sum, seller) => sum + seller.transactions, 0))}</li>
              <li>• Combined customer reach: {formatNumber(sellers.reduce((sum, seller) => sum + seller.uniqueMembers, 0))} unique members</li>
              <li>• Discount value: {formatCurrency(sellers.reduce((sum, seller) => sum + seller.discountValue, 0))}</li>
              <li>• Performance spread: {((sellers[0]?.totalValue / sellers[sellers.length - 1]?.totalValue || 1) - 1).toFixed(1)}x variance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  };

  const groupedData = getGroupedData(activeType);
  const limitCount = displayLimit === 'all' ? groupedData.length : displayLimit;
  const topSellers = groupedData.slice(0, limitCount);
  const bottomSellers = groupedData.slice(-limitCount).reverse();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeType} onValueChange={(value) => setActiveType(value as RankingType)} className="w-full">
            <TabsList className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 md:grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="product" className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Package className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap text-sm leading-tight">Products</span>
              </TabsTrigger>
              <TabsTrigger value="category" className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Tag className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap text-sm leading-tight">Categories</span>
              </TabsTrigger>
              <TabsTrigger value="member" className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Users className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap text-sm leading-tight">Members</span>
              </TabsTrigger>
              <TabsTrigger value="seller" className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <UserCheck className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap text-sm leading-tight">Associates</span>
              </TabsTrigger>
              <TabsTrigger value="paymentMethod" className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <CreditCard className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap text-sm leading-tight">Payment Methods</span>
              </TabsTrigger>
              <TabsTrigger value="discountValue" className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Percent className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap text-sm leading-tight">Discount Value</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeType} className="mt-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {renderSellerCard(topSellers, true, activeType)}
                {renderSellerCard(bottomSellers, false, activeType)}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {[5, 10, 15, 20, 'all'].map((count) => (
                  <Button
                    key={String(count)}
                    variant={displayLimit === count ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDisplayLimit(count as DisplayLimit)}
                    className={cn('rounded-full', displayLimit === count ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700')}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <SalesDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        data={drillDownData}
      />
    </div>
  );
};
