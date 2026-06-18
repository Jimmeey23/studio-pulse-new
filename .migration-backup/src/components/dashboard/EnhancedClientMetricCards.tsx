import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, TrendingUp, DollarSign, Clock, UserCheck, Award, UserPlus, ArrowRight, Eye } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface EnhancedClientMetricCardsProps {
  data: NewClientData[];
  onCardClick?: (title: string, data: NewClientData[], metricType: string) => void;
}

export const EnhancedClientMetricCards: React.FC<EnhancedClientMetricCardsProps> = ({ data, onCardClick }) => {
  // Get unique "is new" categories and calculate metrics for each
  const isNewCategories = [...new Set(data.map(client => client.isNew).filter(Boolean))];
  
  // Calculate metrics by "is new" category
  const metricsByCategory = isNewCategories.map(category => {
    const categoryData = data.filter(client => client.isNew === category);
    const totalClients = categoryData.length;
    const convertedMembers = categoryData.filter(client => client.conversionStatus === 'Converted').length;
    const retainedMembers = categoryData.filter(client => client.retentionStatus === 'Retained').length;
    const totalLTV = categoryData.reduce((sum, client) => sum + (client.ltv || 0), 0);
    const avgLTV = totalClients > 0 ? totalLTV / totalClients : 0;
    
    // Additional metrics
    const avgVisitsPostTrial = categoryData.reduce((sum, client) => sum + (client.visitsPostTrial || 0), 0) / totalClients;
    const avgPurchaseCountPostTrial = categoryData.reduce((sum, client) => sum + (client.purchaseCountPostTrial || 0), 0) / totalClients;
    const avgConversionSpan = categoryData
      .filter(client => (client.conversionSpan || 0) > 0)
      .reduce((sum, client, _, arr) => sum + (client.conversionSpan || 0) / arr.length, 0);
    const avgVisits = categoryData.reduce((sum, client) => sum + (client.classNo || 0), 0) / totalClients;

    const conversionRate = totalClients > 0 ? (convertedMembers / totalClients) * 100 : 0;
    const retentionRate = convertedMembers > 0 ? (retainedMembers / convertedMembers) * 100 : 0;

    return {
      category,
      data: categoryData,
      metrics: [
        {
          title: 'Total Clients',
          value: formatNumber(totalClients),
          icon: Users,
          gradient: 'from-blue-500 to-indigo-600',
          description: `${category} clients`,
          change: null,
          isPositive: true,
          metricType: 'total_clients'
        },
        {
          title: 'Visits Post Trial',
          value: avgVisitsPostTrial.toFixed(1),
          icon: Eye,
          gradient: 'from-cyan-500 to-blue-600',
          description: 'Avg visits after trial',
          change: null,
          isPositive: true,
          metricType: 'visits_post_trial'
        },
        {
          title: 'Purchase Count',
          value: avgPurchaseCountPostTrial.toFixed(1),
          icon: Target,
          gradient: 'from-green-500 to-teal-600',
          description: 'Avg purchases post trial',
          change: null,
          isPositive: true,
          metricType: 'purchase_count'
        },
        {
          title: 'Avg LTV',
          value: formatCurrency(avgLTV),
          icon: DollarSign,
          gradient: 'from-pink-500 to-rose-600',
          description: 'Average lifetime value',
          change: null,
          isPositive: true,
          metricType: 'avg_ltv'
        },
        {
          title: 'Conversion Span',
          value: `${avgConversionSpan.toFixed(0)} days`,
          icon: Clock,
          gradient: 'from-orange-500 to-red-600',
          description: 'Avg conversion time',
          change: null,
          isPositive: false,
          metricType: 'conversion_span'
        },
        {
          title: 'Total Visits',
          value: avgVisits.toFixed(1),
          icon: ArrowRight,
          gradient: 'from-purple-500 to-violet-600',
          description: 'Avg total visits',
          change: null,
          isPositive: true,
          metricType: 'total_visits'
        }
      ]
    };
  });

  return (
    <div className="space-y-8">
      {metricsByCategory.map((categoryGroup, categoryIndex) => (
        <div key={categoryGroup.category} className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-slate-800">{categoryGroup.category} Metrics</h3>
            <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
              {categoryGroup.data.length} clients
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {categoryGroup.metrics.map((metric, index) => (
              <Card 
                key={`${categoryGroup.category}-${metric.title}`}
                className="group relative overflow-hidden bg-white/95 backdrop-blur-sm shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-700 cursor-pointer hover:scale-[1.02] hover:-translate-y-1 transform-gpu"
                onClick={() => onCardClick?.(metric.title, categoryGroup.data, metric.metricType)}
                style={{ animationDelay: `${(categoryIndex * 6 + index) * 100}ms` }}
              >
                {/* Animated gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <CardContent className="relative p-4 z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${metric.gradient} shadow-md group-hover:shadow-lg transition-all duration-300`}>
                      <metric.icon className="w-4 h-4 text-white" />
                    </div>
                    {metric.change !== null && (
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
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700 group-hover:text-gray-800 transition-colors">
                      {metric.title}
                    </h4>
                    <p className={`text-xl font-bold text-transparent bg-gradient-to-r ${metric.gradient} bg-clip-text group-hover:scale-105 transition-transform duration-300`}>
                      {metric.value}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className={`w-1 h-1 rounded-full bg-gradient-to-r ${metric.gradient} animate-pulse`}></div>
                      <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                        {metric.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};