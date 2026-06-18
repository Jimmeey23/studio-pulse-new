import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

interface Props {
  aprilData: SalesData[];
  augustData: SalesData[];
}

export const OutlierProductMix: React.FC<Props> = ({
  aprilData,
  augustData
}) => {
  const productAnalysis = useMemo(() => {
    const analyzeProducts = (data: SalesData[], month: string) => {
      const productMap = new Map<string, {
        revenue: number;
        transactions: number;
        customers: Set<string>;
      }>();

      data.forEach(item => {
        const product = item.cleanedProduct || item.paymentItem || 'Unknown';
        if (!productMap.has(product)) {
          productMap.set(product, {
            revenue: 0,
            transactions: 0,
            customers: new Set()
          });
        }

        const prod = productMap.get(product)!;
        prod.revenue += item.paymentValue || 0;
        prod.transactions += 1;
        prod.customers.add(item.memberId || item.customerEmail);
      });

      return Array.from(productMap.entries())
        .map(([product, stats]) => ({
          product,
          month,
          revenue: stats.revenue,
          transactions: stats.transactions,
          customers: stats.customers.size,
          avgPrice: stats.transactions > 0 ? stats.revenue / stats.transactions : 0
        }))
        .sort((a, b) => b.revenue - a.revenue);
    };

    const april = analyzeProducts(aprilData, 'April');
    const august = analyzeProducts(augustData, 'August');

    // Combine for comparison
    const allProducts = new Set([
      ...april.map(p => p.product),
      ...august.map(p => p.product)
    ]);

    const comparison = Array.from(allProducts).map(product => {
      const aprilProduct = april.find(p => p.product === product);
      const augustProduct = august.find(p => p.product === product);

      return {
        product,
        aprilRevenue: aprilProduct?.revenue || 0,
        augustRevenue: augustProduct?.revenue || 0,
        aprilTransactions: aprilProduct?.transactions || 0,
        augustTransactions: augustProduct?.transactions || 0,
        growth: aprilProduct && augustProduct
          ? ((augustProduct.revenue - aprilProduct.revenue) / aprilProduct.revenue) * 100
          : 0
      };
    }).sort((a, b) => (b.aprilRevenue + b.augustRevenue) - (a.aprilRevenue + a.augustRevenue));

    return { april, august, comparison };
  }, [aprilData, augustData]);

  const chartData = productAnalysis.comparison.slice(0, 10).map(item => ({
    name: item.product.length > 30 ? item.product.substring(0, 30) + '...' : item.product,
    April: item.aprilRevenue,
    August: item.augustRevenue
  }));

  return (
    <div className="space-y-6">
      {/* Top Products Chart */}
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            Top 10 Products by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={200} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="April" fill="#3b82f6" />
              <Bar dataKey="August" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Product Table */}
      <Card className="border-2 border-slate-200">
        <CardHeader className="bg-slate-50">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-slate-600" />
            Product Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-white">Product</TableHead>
                  <TableHead className="font-bold text-right text-white">April Revenue</TableHead>
                  <TableHead className="font-bold text-right text-white">August Revenue</TableHead>
                  <TableHead className="font-bold text-right text-white">April Txns</TableHead>
                  <TableHead className="font-bold text-right text-white">August Txns</TableHead>
                  <TableHead className="font-bold text-right text-white">Growth %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productAnalysis.comparison.slice(0, 15).map((product, index) => (
                  <motion.tr
                    key={product.product}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-slate-50"
                  >
                    <TableCell className="font-medium max-w-xs truncate">
                      {product.product}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-700">
                      {formatCurrency(product.aprilRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-purple-700">
                      {formatCurrency(product.augustRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(product.aprilTransactions)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(product.augustTransactions)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={product.growth > 0 ? 'default' : 'secondary'}
                        className={product.growth > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}
                      >
                        {product.growth > 0 ? '+' : ''}{formatPercentage(product.growth)}%
                      </Badge>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Category Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              April 2025 - Top 5 Products
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {productAnalysis.april.slice(0, 5).map((product, index) => (
                <div key={product.product} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      #{index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {product.product}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-blue-900">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              August 2025 - Top 5 Products
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {productAnalysis.august.slice(0, 5).map((product, index) => (
                <div key={product.product} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-100 text-purple-800">
                      #{index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {product.product}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-purple-900">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
