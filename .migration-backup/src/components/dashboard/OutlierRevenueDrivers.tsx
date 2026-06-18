import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, Award, Zap } from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { motion } from 'framer-motion';

interface Props {
  aprilData: SalesData[];
  augustData: SalesData[];
  aprilMetrics: any;
  augustMetrics: any;
}

export const OutlierRevenueDrivers: React.FC<Props> = ({
  aprilData,
  augustData,
  aprilMetrics,
  augustMetrics
}) => {
  const drivers = useMemo(() => {
    // Analyze what drove revenue
    const aprilNewClientContribution = (aprilMetrics.newClientRevenue / aprilMetrics.totalRevenue) * 100;
    const augustNewClientContribution = (augustMetrics.newClientRevenue / augustMetrics.totalRevenue) * 100;

    return {
      april: {
        primaryDriver: aprilNewClientContribution > 50 ? 'New Client Acquisition' : 'Existing Client Expansion',
        newClientPercentage: aprilNewClientContribution,
        stackingImpact: aprilMetrics.stackingCustomers,
        avgTransactionValue: aprilMetrics.atv
      },
      august: {
        primaryDriver: augustNewClientContribution > 50 ? 'New Client Acquisition' : 'Existing Client Expansion',
        newClientPercentage: augustNewClientContribution,
        stackingImpact: augustMetrics.stackingCustomers,
        avgTransactionValue: augustMetrics.atv
      }
    };
  }, [aprilMetrics, augustMetrics]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* April Drivers */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="w-6 h-6 text-blue-600" />
              April 2025 Revenue Drivers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <p className="font-semibold text-lg">Primary Driver</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 text-base px-4 py-2">
                {drivers.april.primaryDriver}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">New Client Contribution</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatPercentage(drivers.april.newClientPercentage)}%
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {formatCurrency(aprilMetrics.newClientRevenue)} from new clients
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Existing Client Contribution</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatPercentage(100 - drivers.april.newClientPercentage)}%
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  {formatCurrency(aprilMetrics.existingClientRevenue)} from existing
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Membership Stacking</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatNumber(drivers.april.stackingImpact)}
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  Customers with multiple purchases
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Average Transaction Value</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(drivers.april.avgTransactionValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* August Drivers */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="w-6 h-6 text-purple-600" />
              August 2025 Revenue Drivers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <p className="font-semibold text-lg">Primary Driver</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 text-base px-4 py-2">
                {drivers.august.primaryDriver}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">New Client Contribution</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatPercentage(drivers.august.newClientPercentage)}%
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  {formatCurrency(augustMetrics.newClientRevenue)} from new clients
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Existing Client Contribution</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatPercentage(100 - drivers.august.newClientPercentage)}%
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {formatCurrency(augustMetrics.existingClientRevenue)} from existing
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Membership Stacking</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatNumber(drivers.august.stackingImpact)}
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  Customers with multiple purchases
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Average Transaction Value</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(drivers.august.avgTransactionValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card className="border-2 border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Key Revenue Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white border-2 border-blue-200 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-blue-900 mb-2">April Analysis</p>
                  <p className="text-sm text-slate-700">
                    {drivers.april.newClientPercentage > 50
                      ? `Strong new client acquisition drove ${formatPercentage(drivers.april.newClientPercentage)}% of revenue. Focus on retention to maximize lifetime value.`
                      : `Existing clients contributed ${formatPercentage(100 - drivers.april.newClientPercentage)}% of revenue. ${drivers.april.stackingImpact} customers made multiple purchases, indicating strong engagement.`
                    }
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-white border-2 border-purple-200 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="font-semibold text-purple-900 mb-2">August Analysis</p>
                  <p className="text-sm text-slate-700">
                    {drivers.august.newClientPercentage > 50
                      ? `New client acquisition was the primary driver at ${formatPercentage(drivers.august.newClientPercentage)}% of total revenue. Consider conversion strategies to retain these clients.`
                      : `Existing client base showed strong loyalty with ${formatPercentage(100 - drivers.august.newClientPercentage)}% revenue contribution. ${drivers.august.stackingImpact} customers demonstrated commitment through multiple purchases.`
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
