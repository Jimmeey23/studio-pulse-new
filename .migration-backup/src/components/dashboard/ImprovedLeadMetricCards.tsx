
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, TrendingUp, CreditCard, Activity, UserCheck, Zap, BarChart3 } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { motion } from 'framer-motion';

interface ImprovedLeadMetricCardsProps {
  data: LeadsData[];
}

export const ImprovedLeadMetricCards: React.FC<ImprovedLeadMetricCardsProps> = ({ data }) => {
  const totalLeads = data.length;
  const convertedLeads = data.filter(item => item.conversionStatus === 'Converted').length;
  const trialsCompleted = data.filter(item => item.stage === 'Trial Completed').length;
  const totalLTV = data.reduce((sum, item) => sum + (item.ltv || 0), 0);
  const totalVisits = data.reduce((sum, item) => sum + (item.visits || 0), 0);
  const avgLTV = totalLeads > 0 ? totalLTV / totalLeads : 0;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  const trialConversionRate = totalLeads > 0 ? (trialsCompleted / totalLeads) * 100 : 0;
  const avgVisitsPerLead = totalLeads > 0 ? totalVisits / totalLeads : 0;

  const metrics = [
    {
      title: 'Total Leads',
      value: formatNumber(totalLeads),
      change: '+12.5%',
      changeType: 'positive' as const,
      description: 'Total leads in pipeline',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100'
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      change: '+8.2%',
      changeType: 'positive' as const,
      description: 'Lead to customer conversion',
      icon: Target,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100'
    },
    {
      title: 'Trial Conversion',
      value: `${trialConversionRate.toFixed(1)}%`,
      change: '+15.3%',
      changeType: 'positive' as const,
      description: 'Lead to trial conversion',
      icon: UserCheck,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100'
    },
    {
      title: 'Average LTV',
      value: formatCurrency(avgLTV),
      change: '+7.4%',
      changeType: 'positive' as const,
      description: 'Customer lifetime value',
      icon: CreditCard,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-100'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalLTV),
      change: '+22.1%',
      changeType: 'positive' as const,
      description: 'Total pipeline value',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-100'
    },
    {
      title: 'Converted Leads',
      value: formatNumber(convertedLeads),
      change: '+18.7%',
      changeType: 'positive' as const,
      description: 'Successfully converted leads',
      icon: Zap,
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100'
    },
    {
      title: 'Avg Visits/Lead',
      value: avgVisitsPerLead.toFixed(1),
      change: '+5.2%',
      changeType: 'positive' as const,
      description: 'Average visits per lead',
      icon: Activity,
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-50 to-rose-100'
    },
    {
      title: 'Pipeline Health',
      value: `${((convertedLeads + trialsCompleted) / totalLeads * 100).toFixed(1)}%`,
      change: '+9.8%',
      changeType: 'positive' as const,
      description: 'Active + converted leads',
      icon: BarChart3,
      gradient: 'from-cyan-500 to-blue-500',
      bgGradient: 'from-cyan-50 to-blue-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <Card className="relative overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl group hover:scale-105">
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-50`} />
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.gradient} shadow-lg`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${metric.changeType === 'positive' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'} font-semibold`}
                >
                  {metric.change}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {metric.title}
                </h3>
                <div className="text-2xl font-bold text-gray-900">
                  {metric.value}
                </div>
                <p className="text-sm text-gray-500">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
