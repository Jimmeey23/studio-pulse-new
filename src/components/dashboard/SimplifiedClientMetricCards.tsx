import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, TrendingUp, DollarSign, Clock, UserCheck, Award, UserPlus, Eye } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface SimplifiedClientMetricCardsProps {
  data: NewClientData[];
  onCardClick?: (title: string, data: NewClientData[], metricType: string) => void;
}

export const SimplifiedClientMetricCards: React.FC<SimplifiedClientMetricCardsProps> = ({ data, onCardClick }) => {
  // Calculate core metrics
  const totalClients = data.length;
  
  // Get unique member IDs for trials completed (clients who have visits post trial > 0)
  const uniqueTrialsCompleted = [...new Set(
    data
      .filter(client => (client.visitsPostTrial || 0) > 0)
      .map(client => client.memberId)
      .filter(Boolean)
  )].length;
  
  // Get unique member IDs for new members (isNew contains "New")
  const uniqueNewMembers = [...new Set(
    data
      .filter(client => {
        const isNewValue = String(client.isNew || '').toLowerCase();
        return isNewValue.includes('new');
      })
      .map(client => client.memberId)
      .filter(Boolean)
  )].length;
  
  const convertedMembers = data.filter(client => client.conversionStatus === 'Converted').length;
  const retainedMembers = data.filter(client => client.retentionStatus === 'Retained').length;
  
  // Calculate rates
  const conversionRate = uniqueNewMembers > 0 ? (convertedMembers / uniqueNewMembers) * 100 : 0;
  // Corrected retention rate: retained members / new members * 100
  const retentionRate = uniqueNewMembers > 0 ? (retainedMembers / uniqueNewMembers) * 100 : 0;
  
  // Calculate average LTV
  const totalLTV = data.reduce((sum, client) => sum + (client.ltv || 0), 0);
  const avgLTV = totalClients > 0 ? totalLTV / totalClients : 0;

  const metrics = [
    {
      title: 'Trials Completed',
      value: formatNumber(uniqueTrialsCompleted),
      icon: Eye,
      gradient: 'from-blue-500 to-indigo-600',
      description: 'Unique members with trials',
      change: 12.5,
      isPositive: true,
      metricType: 'trials_completed',
      filterData: () => data.filter(client => (client.visitsPostTrial || 0) > 0)
    },
    {
      title: 'New Members',
      value: formatNumber(uniqueNewMembers),
      icon: UserPlus,
      gradient: 'from-green-500 to-teal-600',
      description: 'Unique new acquisitions',
      change: 8.3,
      isPositive: true,
      metricType: 'new_members',
      filterData: () => data.filter(client => {
        const isNewValue = String(client.isNew || '').toLowerCase();
        return isNewValue.includes('new');
      })
    },
    {
      title: 'Converted Members',
      value: formatNumber(convertedMembers),
      icon: Award,
      gradient: 'from-purple-500 to-violet-600',
      description: 'Successfully converted',
      change: 15.2,
      isPositive: true,
      metricType: 'converted_members',
      filterData: () => data.filter(client => client.conversionStatus === 'Converted')
    },
    {
      title: 'Retained Members',
      value: formatNumber(retainedMembers),
      icon: UserCheck,
      gradient: 'from-orange-500 to-red-600',
      description: 'Currently retained',
      change: 4.8,
      isPositive: true,
      metricType: 'retained_members',
      filterData: () => data.filter(client => client.retentionStatus === 'Retained')
    },
    {
      title: 'Avg LTV',
      value: formatCurrency(avgLTV),
      icon: DollarSign,
      gradient: 'from-pink-500 to-rose-600',
      description: 'Average lifetime value',
      change: 7.2,
      isPositive: true,
      metricType: 'avg_ltv',
      filterData: () => data.filter(client => (client.ltv || 0) > 0)
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      icon: Target,
      gradient: 'from-cyan-500 to-blue-600',
      description: 'New to converted rate',
      change: 3.1,
      isPositive: true,
      metricType: 'conversion_rate',
      filterData: () => data.filter(client => {
        const isNewValue = String(client.isNew || '').toLowerCase();
        return isNewValue.includes('new') || client.conversionStatus === 'Converted';
      })
    },
    {
      title: 'Retention Rate',
      value: `${retentionRate.toFixed(1)}%`,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-green-600',
      description: 'Retained from new members',
      change: 2.1,
      isPositive: true,
      metricType: 'retention_rate',
      filterData: () => data.filter(client => {
        const isNewValue = String(client.isNew || '').toLowerCase();
        return isNewValue.includes('new') || client.retentionStatus === 'Retained';
      })
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {metrics.map((metric, index) => (
        <Card 
          key={metric.title}
          className="group relative overflow-hidden bg-slate-800/95 backdrop-blur-sm shadow-2xl border border-slate-700 hover:shadow-3xl transition-all duration-700 cursor-pointer hover:scale-[1.02] hover:-translate-y-1 transform-gpu"
          onClick={() => onCardClick?.(metric.title, metric.filterData(), metric.metricType)}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Animated gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-10 group-hover:opacity-15 transition-opacity duration-300`}></div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <CardContent className="relative p-4 z-10">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${metric.gradient} shadow-md group-hover:shadow-lg transition-all duration-300`}>
                <metric.icon className="w-4 h-4 text-white" />
              </div>
              <Badge 
                className={cn(
                  "text-xs px-2 py-1 font-medium transition-all duration-300",
                  metric.isPositive 
                    ? 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200' 
                    : 'bg-red-100 text-red-700 group-hover:bg-red-200'
                )}
              >
                {metric.isPositive ? '+' : ''}{metric.change}%
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-white group-hover:text-gray-100 transition-colors">
                {metric.title}
              </h4>
              <p className={`text-xl font-bold text-white group-hover:scale-105 transition-transform duration-300`}>
                {metric.value}
              </p>
              <div className="flex items-center gap-1">
                <div className={`w-1 h-1 rounded-full bg-gradient-to-r ${metric.gradient} animate-pulse`}></div>
                <p className="text-xs text-gray-300 group-hover:text-gray-200 transition-colors">
                  {metric.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};