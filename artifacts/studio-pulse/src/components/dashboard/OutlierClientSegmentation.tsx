import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, UserPlus, Repeat } from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface Props {
  aprilData: SalesData[];
  augustData: SalesData[];
  allSalesData?: SalesData[]; // Need full dataset to determine first purchases
}

const COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444'];

export const OutlierClientSegmentation: React.FC<Props> = ({
  aprilData,
  augustData,
  allSalesData = []
}) => {
  const clientAnalysis = useMemo(() => {
    // Build customer first purchase map across ALL data
    const customerFirstPurchase = new Map<string, Date>();
    const dataToUse = allSalesData.length > 0 ? allSalesData : [...aprilData, ...augustData];
    
    dataToUse.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId || !item.paymentDate) return;
      
      const purchaseDate = new Date(item.paymentDate);
      const existingFirstDate = customerFirstPurchase.get(customerId);
      
      if (!existingFirstDate || purchaseDate < existingFirstDate) {
        customerFirstPurchase.set(customerId, purchaseDate);
      }
    });

    const analyzeClients = (data: SalesData[], month: string, monthYear: { year: number, month: number }) => {
      // Group by customer
      const customerMap = new Map<string, {
        purchases: number;
        totalSpent: number;
        isNew: boolean;
        products: string[];
      }>();

      data.forEach(item => {
        const customerId = item.memberId || item.customerEmail;
        if (!customerId) return;
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            purchases: 0,
            totalSpent: 0,
            isNew: false,
            products: []
          });
        }

        const customer = customerMap.get(customerId)!;
        customer.purchases += 1;
        customer.totalSpent += item.paymentValue || 0;
        customer.products.push(item.cleanedProduct || item.paymentItem || '');

        // Check if this is their first purchase ever
        const firstPurchase = customerFirstPurchase.get(customerId);
        if (firstPurchase) {
          const isFirstPurchaseInThisMonth = firstPurchase.getFullYear() === monthYear.year && 
                                             firstPurchase.getMonth() === monthYear.month;
          if (isFirstPurchaseInThisMonth) {
            customer.isNew = true;
          }
        }
      });

      // Categorize customers
      const newCustomers = Array.from(customerMap.entries()).filter(([_, c]) => c.isNew);
      const existingCustomers = Array.from(customerMap.entries()).filter(([_, c]) => !c.isNew);
      const stackingCustomers = Array.from(customerMap.entries()).filter(([_, c]) => c.purchases > 1);
      const highValueCustomers = Array.from(customerMap.entries()).filter(([_, c]) => c.totalSpent > 500);

      const newRevenue = newCustomers.reduce((sum, [_, c]) => sum + c.totalSpent, 0);
      const existingRevenue = existingCustomers.reduce((sum, [_, c]) => sum + c.totalSpent, 0);
      const stackingRevenue = stackingCustomers.reduce((sum, [_, c]) => sum + c.totalSpent, 0);

      const totalRevenue = data.reduce((sum, item) => sum + (item.paymentValue || 0), 0);

      logger.debug(`📊 Client Segmentation ${month}:`, {
        totalCustomers: customerMap.size,
        newCustomers: newCustomers.length,
        existingCustomers: existingCustomers.length,
        newRevenue,
        existingRevenue,
        totalRevenue
      });

      return {
        month,
        totalCustomers: customerMap.size,
        newCustomers: newCustomers.length,
        existingCustomers: existingCustomers.length,
        stackingCustomers: stackingCustomers.length,
        highValueCustomers: highValueCustomers.length,
        newRevenue,
        existingRevenue,
        stackingRevenue,
        avgSpendPerCustomer: customerMap.size > 0 ? totalRevenue / customerMap.size : 0,
        avgPurchasesPerCustomer: customerMap.size > 0 ? data.length / customerMap.size : 0
      };
    };

    const april = analyzeClients(aprilData, 'April', { year: 2025, month: 3 });
    const august = analyzeClients(augustData, 'August', { year: 2025, month: 7 });

    return { april, august };
  }, [aprilData, augustData, allSalesData]);

  const chartData = [
    {
      name: 'April',
      'New Clients': clientAnalysis.april.newRevenue,
      'Existing Clients': clientAnalysis.april.existingRevenue,
      'Stacking': clientAnalysis.april.stackingRevenue
    },
    {
      name: 'August',
      'New Clients': clientAnalysis.august.newRevenue,
      'Existing Clients': clientAnalysis.august.existingRevenue,
      'Stacking': clientAnalysis.august.stackingRevenue
    }
  ];

  const aprilPieData = [
    { name: 'New Clients', value: clientAnalysis.april.newRevenue },
    { name: 'Existing Clients', value: clientAnalysis.april.existingRevenue }
  ];

  const augustPieData = [
    { name: 'New Clients', value: clientAnalysis.august.newRevenue },
    { name: 'Existing Clients', value: clientAnalysis.august.existingRevenue }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <UserPlus className="w-6 h-6 text-emerald-600" />
                <Badge variant="secondary">April</Badge>
              </div>
              <div className="text-2xl font-bold text-emerald-900">
                {formatNumber(clientAnalysis.april.newCustomers)}
              </div>
              <p className="text-sm text-emerald-600">New Clients</p>
              <p className="text-xs text-emerald-700 mt-2">
                {formatCurrency(clientAnalysis.april.newRevenue)} revenue
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <UserPlus className="w-6 h-6 text-purple-600" />
                <Badge variant="secondary">August</Badge>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {formatNumber(clientAnalysis.august.newCustomers)}
              </div>
              <p className="text-sm text-purple-600">New Clients</p>
              <p className="text-xs text-purple-700 mt-2">
                {formatCurrency(clientAnalysis.august.newRevenue)} revenue
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Repeat className="w-6 h-6 text-blue-600" />
                <Badge variant="secondary">April</Badge>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {formatNumber(clientAnalysis.april.stackingCustomers)}
              </div>
              <p className="text-sm text-blue-600">Stacking Customers</p>
              <p className="text-xs text-blue-700 mt-2">
                Multiple purchases
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Repeat className="w-6 h-6 text-orange-600" />
                <Badge variant="secondary">August</Badge>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {formatNumber(clientAnalysis.august.stackingCustomers)}
              </div>
              <p className="text-sm text-orange-600">Stacking Customers</p>
              <p className="text-xs text-orange-700 mt-2">
                Multiple purchases
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revenue Composition Chart */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Revenue Composition by Client Type
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="New Clients" fill="#10b981" />
              <Bar dataKey="Existing Clients" fill="#8b5cf6" />
              <Bar dataKey="Stacking" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg">April 2025 - Revenue Split</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={aprilPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${formatPercentage((entry.value / (clientAnalysis.april.newRevenue + clientAnalysis.april.existingRevenue)) * 100)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {aprilPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-lg">August 2025 - Revenue Split</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={augustPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${formatPercentage((entry.value / (clientAnalysis.august.newRevenue + clientAnalysis.august.existingRevenue)) * 100)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {augustPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card className="border-2 border-slate-200">
        <CardHeader className="bg-slate-50">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-slate-600" />
            Detailed Client Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Avg Spend/Customer (April)</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(clientAnalysis.april.avgSpendPerCustomer)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Avg Spend/Customer (Aug)</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(clientAnalysis.august.avgSpendPerCustomer)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Purchases/Customer (April)</p>
              <p className="text-2xl font-bold text-blue-900">
                {clientAnalysis.april.avgPurchasesPerCustomer.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Purchases/Customer (Aug)</p>
              <p className="text-2xl font-bold text-purple-900">
                {clientAnalysis.august.avgPurchasesPerCustomer.toFixed(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
