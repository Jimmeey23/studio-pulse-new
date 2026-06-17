import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { motion } from 'framer-motion';

interface Props {
  aprilData: SalesData[];
  augustData: SalesData[];
  sessionsData: SessionData[];
}

export const OutlierStudioComparison: React.FC<Props> = ({
  aprilData,
  augustData,
  sessionsData
}) => {
  const studioAnalysis = useMemo(() => {
    const analyzeByLocation = (data: SalesData[], month: string) => {
      const locationMap = new Map<string, {
        revenue: number;
        transactions: number;
        customers: Set<string>;
        newClientRevenue: number;
        existingClientRevenue: number;
        avgTransactionValue: number;
      }>();

      data.forEach(item => {
        const location = item.calculatedLocation || 'Unknown';
        if (!locationMap.has(location)) {
          locationMap.set(location, {
            revenue: 0,
            transactions: 0,
            customers: new Set(),
            newClientRevenue: 0,
            existingClientRevenue: 0,
            avgTransactionValue: 0
          });
        }

        const loc = locationMap.get(location)!;
        loc.revenue += item.paymentValue || 0;
        loc.transactions += 1;
        loc.customers.add(item.memberId || item.customerEmail || '');

        const isNewClient = item.cleanedProduct?.toLowerCase().includes('intro') ||
                           item.cleanedProduct?.toLowerCase().includes('new client') ||
                           item.paymentItem?.toLowerCase().includes('intro') ||
                           item.paymentItem?.toLowerCase().includes('new client');
        if (isNewClient) {
          loc.newClientRevenue += item.paymentValue || 0;
        } else {
          loc.existingClientRevenue += item.paymentValue || 0;
        }
      });

      return Array.from(locationMap.entries()).map(([location, stats]) => ({
        location,
        month,
        revenue: stats.revenue,
        transactions: stats.transactions,
        customers: stats.customers.size,
        newClientRevenue: stats.newClientRevenue,
        existingClientRevenue: stats.existingClientRevenue,
        avgTransactionValue: stats.transactions > 0 ? stats.revenue / stats.transactions : 0,
        newClientPercentage: stats.revenue > 0 ? (stats.newClientRevenue / stats.revenue) * 100 : 0
      }));
    };

    const aprilByLocation = analyzeByLocation(aprilData, 'April');
    const augustByLocation = analyzeByLocation(augustData, 'August');

    // Combine both months
    const allLocations = new Set([
      ...aprilByLocation.map(l => l.location),
      ...augustByLocation.map(l => l.location)
    ]);

    return Array.from(allLocations).map(location => {
      const april = aprilByLocation.find(l => l.location === location);
      const august = augustByLocation.find(l => l.location === location);

      return {
        location,
        april: april || {
          revenue: 0,
          transactions: 0,
          customers: 0,
          newClientRevenue: 0,
          existingClientRevenue: 0,
          avgTransactionValue: 0,
          newClientPercentage: 0
        },
        august: august || {
          revenue: 0,
          transactions: 0,
          customers: 0,
          newClientRevenue: 0,
          existingClientRevenue: 0,
          avgTransactionValue: 0,
          newClientPercentage: 0
        }
      };
    }).sort((a, b) => (b.april.revenue + b.august.revenue) - (a.april.revenue + a.august.revenue));
  }, [aprilData, augustData]);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-6 h-6 text-blue-600" />
            Studio-by-Studio Performance Analysis
          </CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            Detailed breakdown of each studio's performance in April and August 2025, highlighting revenue sources and customer acquisition
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-white">Studio</TableHead>
                  <TableHead className="font-bold text-center text-white">Month</TableHead>
                  <TableHead className="font-bold text-right text-white">Total Revenue</TableHead>
                  <TableHead className="font-bold text-right text-white">New Client Rev</TableHead>
                  <TableHead className="font-bold text-right text-white">Existing Client Rev</TableHead>
                  <TableHead className="font-bold text-right text-white">% New Clients</TableHead>
                  <TableHead className="font-bold text-right text-white">Transactions</TableHead>
                  <TableHead className="font-bold text-right text-white">Unique Customers</TableHead>
                  <TableHead className="font-bold text-right text-white">ATV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studioAnalysis.map((studio, index) => (
                  <React.Fragment key={studio.location}>
                    {/* April Row */}
                    <motion.tr
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b hover:bg-blue-50/50"
                    >
                      <TableCell className="font-semibold" rowSpan={2}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          {studio.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                          April
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-900">
                        {formatCurrency(studio.april.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-700 font-semibold">
                        {formatCurrency(studio.april.newClientRevenue)}
                      </TableCell>
                      <TableCell className="text-right text-purple-700 font-semibold">
                        {formatCurrency(studio.april.existingClientRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className={
                          studio.april.newClientPercentage > 50 
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }>
                          {formatPercentage(studio.april.newClientPercentage)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(studio.april.transactions)}</TableCell>
                      <TableCell className="text-right">{formatNumber(studio.april.customers)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(studio.april.avgTransactionValue)}</TableCell>
                    </motion.tr>

                    {/* August Row */}
                    <motion.tr
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 + 0.1 }}
                      className="border-b border-slate-200 hover:bg-purple-50/50"
                    >
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                          August
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-purple-900">
                        {formatCurrency(studio.august.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-700 font-semibold">
                        {formatCurrency(studio.august.newClientRevenue)}
                      </TableCell>
                      <TableCell className="text-right text-purple-700 font-semibold">
                        {formatCurrency(studio.august.existingClientRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className={
                          studio.august.newClientPercentage > 50 
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }>
                          {formatPercentage(studio.august.newClientPercentage)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(studio.august.transactions)}</TableCell>
                      <TableCell className="text-right">{formatNumber(studio.august.customers)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(studio.august.avgTransactionValue)}</TableCell>
                    </motion.tr>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights for Studios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {studioAnalysis.slice(0, 2).map((studio, index) => {
          const aprilGrowth = studio.august.revenue > studio.april.revenue 
            ? ((studio.august.revenue - studio.april.revenue) / studio.april.revenue) * 100
            : -((studio.april.revenue - studio.august.revenue) / studio.april.revenue) * 100;

          return (
            <Card key={studio.location} className="border-2 border-emerald-200">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Top Performer: {studio.location}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Month-over-Month Growth</p>
                  <div className="text-2xl font-bold text-emerald-700">
                    {formatPercentage(Math.abs(aprilGrowth))}%
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">New Client Focus (April)</p>
                    <p className="text-lg font-semibold text-blue-700">
                      {formatPercentage(studio.april.newClientPercentage)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">New Client Focus (Aug)</p>
                    <p className="text-lg font-semibold text-purple-700">
                      {formatPercentage(studio.august.newClientPercentage)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
