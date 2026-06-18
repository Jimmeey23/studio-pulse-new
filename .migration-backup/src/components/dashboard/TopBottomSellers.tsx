
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Award, AlertTriangle, Eye, BarChart3 } from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface TopBottomSellersProps {
  data: SalesData[] | any[];
  type: 'product' | 'category' | 'member' | 'seller' | 'trainers';
  onRowClick?: (row: any) => void;
  title?: string;
}

export const TopBottomSellers: React.FC<TopBottomSellersProps> = ({ data, type, onRowClick, title }) => {
  const getGroupedData = () => {
    if (type === 'trainers') {
      // Handle trainer data which comes pre-processed
      return data;
    }
    
    const salesData = data as SalesData[];
    const grouped = salesData.reduce((acc, item) => {
      let key = '';
      switch (type) {
        case 'product':
          key = item.cleanedProduct;
          break;
        case 'category':
          key = item.cleanedCategory;
          break;
        case 'member':
          key = item.customerName;
          break;
        case 'seller':
          key = item.soldBy;
          break;
      }
      
      if (!acc[key]) {
        acc[key] = {
          name: key,
          totalValue: 0,
          unitsSold: 0,
          transactions: 0,
          uniqueMembers: new Set(),
          atv: 0,
          auv: 0,
          asv: 0,
          upt: 0
        };
      }
      
      acc[key].totalValue += item.paymentValue;
      acc[key].unitsSold += 1;
      acc[key].transactions += 1;
      acc[key].uniqueMembers.add(item.memberId);
      
      return acc;
    }, {} as Record<string, any>);
    
    // Calculate metrics
    Object.values(grouped).forEach((item: any) => {
      item.uniqueMembers = item.uniqueMembers.size;
      item.atv = item.totalValue / item.transactions;
      item.auv = item.totalValue / item.unitsSold;
      item.asv = item.totalValue / item.uniqueMembers;
      item.upt = item.unitsSold / item.transactions;
    });
    
    return Object.values(grouped).sort((a: any, b: any) => b.totalValue - a.totalValue);
  };

  const groupedData = getGroupedData();
  const topSellers = groupedData.slice(0, 5);
  const bottomSellers = groupedData.slice(-5).reverse();

  const renderSellerCard = (sellers: any[], isTop: boolean) => (
    <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          {isTop ? (
            <>
              <div className="p-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {title || 'Top Performers'}
                </span>
                <p className="text-sm text-slate-600 font-normal">Highest revenue generators</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-full bg-gradient-to-r from-red-400 to-rose-500">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  Improvement Opportunities
                </span>
                <p className="text-sm text-slate-600 font-normal">Areas for growth focus</p>
              </div>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sellers.map((seller, index) => (
          <div 
            key={seller.name || seller.Trainer} 
            className="group flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => onRowClick?.(seller)}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm",
                isTop 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-red-400 to-rose-600 text-white'
              )}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 truncate max-w-40 group-hover:text-blue-600 transition-colors">
                  {seller.name || seller.Trainer}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {type === 'trainers' ? (
                    <>
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {seller['Total Clients']} clients
                      </Badge>
                      <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                        Visits: {seller['Avg. Visits']}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                        LTV: {seller['Avg. LTV']}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                        Conv: {seller['Conversion Rate']}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {formatNumber(seller.transactions)} txns
                      </Badge>
                      <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                        ATV: {formatCurrency(seller.atv)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                        AUV: {formatCurrency(seller.auv)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                        ASV: {formatCurrency(seller.asv)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-slate-200 text-slate-700">
                        UPT: {seller.upt.toFixed(1)}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              {type === 'trainers' ? (
                <>
                  <p className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                    {seller['Total Clients']}
                  </p>
                  <p className="text-sm text-slate-500">{seller['Avg. LTV']}</p>
                  <p className="text-xs text-slate-400">{seller['Conversion Rate']}</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                    {formatCurrency(seller.totalValue)}
                  </p>
                  <p className="text-sm text-slate-500">{formatNumber(seller.unitsSold)} units</p>
                  <p className="text-xs text-slate-400">{formatNumber(seller.uniqueMembers)} customers</p>
                </>
              )}
              <Button variant="ghost" size="sm" className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="w-3 h-3 mr-1" />
                View Details
              </Button>
            </div>
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border">
          <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance Summary
          </h4>
          <ul className="text-sm text-slate-600 space-y-1">
            {type === 'trainers' ? (
              <>
                <li>• Average clients: {(sellers.reduce((sum, s) => sum + parseInt(s['Total Clients']), 0) / sellers.length).toFixed(1)}</li>
                <li>• Total clients served: {sellers.reduce((sum, s) => sum + parseInt(s['Total Clients']), 0)}</li>
                <li>• Performance spread: High variation in client handling</li>
              </>
            ) : (
              <>
                <li>• Average revenue: {formatCurrency(sellers.reduce((sum, s) => sum + s.totalValue, 0) / sellers.length)}</li>
                <li>• Total transactions: {formatNumber(sellers.reduce((sum, s) => sum + s.transactions, 0))}</li>
                <li>• Combined customer reach: {formatNumber(sellers.reduce((sum, s) => sum + s.uniqueMembers, 0))} unique customers</li>
                <li>• Performance spread: {((sellers[0]?.totalValue / sellers[sellers.length - 1]?.totalValue || 1) - 1).toFixed(1)}x variance</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {renderSellerCard(topSellers, true)}
      {renderSellerCard(bottomSellers, false)}
    </div>
  );
};
