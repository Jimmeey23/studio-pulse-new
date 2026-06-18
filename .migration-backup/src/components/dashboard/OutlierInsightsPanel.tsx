import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { motion } from 'framer-motion';

interface Props {
  aprilData: SalesData[];
  augustData: SalesData[];
  aprilMetrics: any;
  augustMetrics: any;
  avgBaseline: number;
}

export const OutlierInsightsPanel: React.FC<Props> = ({
  aprilData,
  augustData,
  aprilMetrics,
  augustMetrics,
  avgBaseline
}) => {
  const insights = useMemo(() => {
    const aprilVsBaseline = ((aprilMetrics.totalRevenue - avgBaseline) / avgBaseline) * 100;
    const augustVsBaseline = ((augustMetrics.totalRevenue - avgBaseline) / avgBaseline) * 100;

    // Determine what worked
    const aprilNewClientStrong = (aprilMetrics.newClientRevenue / aprilMetrics.totalRevenue) > 0.4;
    const augustNewClientStrong = (augustMetrics.newClientRevenue / augustMetrics.totalRevenue) > 0.4;

    const aprilStackingHigh = aprilMetrics.stackingCustomers > (aprilMetrics.uniqueCustomers * 0.2);
    const augustStackingHigh = augustMetrics.stackingCustomers > (augustMetrics.uniqueCustomers * 0.2);

    return {
      april: {
        vsBaseline: aprilVsBaseline,
        strengths: [
          aprilNewClientStrong && {
            title: 'Strong New Client Acquisition',
            description: `${formatPercentage((aprilMetrics.newClientRevenue / aprilMetrics.totalRevenue) * 100)}% of revenue came from new clients (${formatCurrency(aprilMetrics.newClientRevenue)})`,
            impact: 'high'
          },
          aprilStackingHigh && {
            title: 'High Membership Stacking',
            description: `${formatNumber(aprilMetrics.stackingCustomers)} customers made multiple purchases, showing strong engagement`,
            impact: 'medium'
          },
          aprilMetrics.atv > 200 && {
            title: 'High Average Transaction Value',
            description: `Average transaction value of ${formatCurrency(aprilMetrics.atv)} indicates premium product sales`,
            impact: 'medium'
          }
        ].filter(Boolean),
        opportunities: [
          !aprilNewClientStrong && {
            title: 'Increase New Client Marketing',
            description: 'New client revenue was only ' + formatPercentage((aprilMetrics.newClientRevenue / aprilMetrics.totalRevenue) * 100) + '% of total',
            priority: 'medium'
          },
          !aprilStackingHigh && {
            title: 'Boost Membership Stacking',
            description: 'Only ' + formatNumber(aprilMetrics.stackingCustomers) + ' customers made multiple purchases',
            priority: 'low'
          }
        ].filter(Boolean)
      },
      august: {
        vsBaseline: augustVsBaseline,
        strengths: [
          augustNewClientStrong && {
            title: 'Strong New Client Acquisition',
            description: `${formatPercentage((augustMetrics.newClientRevenue / augustMetrics.totalRevenue) * 100)}% of revenue came from new clients (${formatCurrency(augustMetrics.newClientRevenue)})`,
            impact: 'high'
          },
          augustStackingHigh && {
            title: 'High Membership Stacking',
            description: `${formatNumber(augustMetrics.stackingCustomers)} customers made multiple purchases, showing strong engagement`,
            impact: 'medium'
          },
          augustMetrics.atv > 200 && {
            title: 'High Average Transaction Value',
            description: `Average transaction value of ${formatCurrency(augustMetrics.atv)} indicates premium product sales`,
            impact: 'medium'
          }
        ].filter(Boolean),
        opportunities: [
          !augustNewClientStrong && {
            title: 'Increase New Client Marketing',
            description: 'New client revenue was only ' + formatPercentage((augustMetrics.newClientRevenue / augustMetrics.totalRevenue) * 100) + '% of total',
            priority: 'medium'
          },
          !augustStackingHigh && {
            title: 'Boost Membership Stacking',
            description: 'Only ' + formatNumber(augustMetrics.stackingCustomers) + ' customers made multiple purchases',
            priority: 'low'
          }
        ].filter(Boolean)
      }
    };
  }, [aprilMetrics, augustMetrics, avgBaseline]);

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="border-2 border-indigo-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-7 h-7" />
            Executive Summary: What Drove These Outlier Months
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-blue-100 text-blue-800 text-lg px-4 py-2">
                  April 2025
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-800 text-base px-3 py-1">
                  +{formatPercentage(insights.april.vsBaseline)}% vs avg
                </Badge>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-2xl font-bold text-blue-900 mb-2">
                  {formatCurrency(aprilMetrics.totalRevenue)}
                </p>
                <p className="text-sm text-blue-700">
                  Total Revenue ({formatNumber(aprilMetrics.transactions)} transactions)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="text-xs text-emerald-600 mb-1">New Clients</p>
                  <p className="text-lg font-bold text-emerald-900">
                    {formatCurrency(aprilMetrics.newClientRevenue)}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-xs text-purple-600 mb-1">Existing</p>
                  <p className="text-lg font-bold text-purple-900">
                    {formatCurrency(aprilMetrics.existingClientRevenue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-purple-100 text-purple-800 text-lg px-4 py-2">
                  August 2025
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-800 text-base px-3 py-1">
                  +{formatPercentage(insights.august.vsBaseline)}% vs avg
                </Badge>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-2xl font-bold text-purple-900 mb-2">
                  {formatCurrency(augustMetrics.totalRevenue)}
                </p>
                <p className="text-sm text-purple-700">
                  Total Revenue ({formatNumber(augustMetrics.transactions)} transactions)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="text-xs text-emerald-600 mb-1">New Clients</p>
                  <p className="text-lg font-bold text-emerald-900">
                    {formatCurrency(augustMetrics.newClientRevenue)}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Existing</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(augustMetrics.existingClientRevenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Worked */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-emerald-200">
          <CardHeader className="bg-emerald-50">
            <CardTitle className="flex items-center gap-2 text-lg text-emerald-900">
              <CheckCircle className="w-5 h-5" />
              April 2025: What Worked
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {insights.april.strengths.map((strength: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white border-2 border-emerald-200 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-900 mb-1">{strength.title}</p>
                      <p className="text-sm text-slate-700">{strength.description}</p>
                      <Badge className="mt-2 bg-emerald-100 text-emerald-800 text-xs">
                        {strength.impact} impact
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200">
          <CardHeader className="bg-emerald-50">
            <CardTitle className="flex items-center gap-2 text-lg text-emerald-900">
              <CheckCircle className="w-5 h-5" />
              August 2025: What Worked
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {insights.august.strengths.map((strength: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white border-2 border-emerald-200 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-900 mb-1">{strength.title}</p>
                      <p className="text-sm text-slate-700">{strength.description}</p>
                      <Badge className="mt-2 bg-emerald-100 text-emerald-800 text-xs">
                        {strength.impact} impact
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Recommendations */}
      <Card className="border-2 border-amber-200">
        <CardHeader className="bg-amber-50">
          <CardTitle className="flex items-center gap-2 text-lg text-amber-900">
            <Info className="w-5 h-5" />
            Strategic Recommendations to Replicate Success
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="font-semibold text-slate-900">Based on April Performance:</p>
              {insights.april.strengths.length > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-slate-700">
                    ✓ Continue leveraging {insights.april.strengths[0]?.title.toLowerCase()} strategies that contributed to the revenue spike
                  </p>
                </div>
              )}
              {insights.april.opportunities.map((opp: any, index: number) => (
                <div key={index} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900">{opp.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{opp.description}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-slate-900">Based on August Performance:</p>
              {insights.august.strengths.length > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-slate-700">
                    ✓ Maintain focus on {insights.august.strengths[0]?.title.toLowerCase()} that drove exceptional results
                  </p>
                </div>
              )}
              {insights.august.opportunities.map((opp: any, index: number) => (
                <div key={index} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900">{opp.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{opp.description}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
