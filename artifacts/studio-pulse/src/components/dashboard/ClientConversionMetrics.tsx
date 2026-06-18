
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Target, Clock, DollarSign, Calendar, Percent } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';

interface ClientConversionMetricsProps {
  data: NewClientData[];
}

export const ClientConversionMetrics: React.FC<ClientConversionMetricsProps> = ({ data }) => {
  const metrics = React.useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalClients: 0,
        convertedClients: 0,
        retainedClients: 0,
        conversionRate: 0,
        retentionRate: 0,
        averageLTV: 0,
        totalLTV: 0,
        averageConversionTime: 0,
        averageVisitsPostTrial: 0,
        newClientsOnly: 0,
        newClientConversionRate: 0
      };
    }

    const totalClients = data.length;
    const convertedClients = data.filter(client => client.conversionStatus === 'Converted').length;
    const retainedClients = data.filter(client => client.retentionStatus === 'Retained').length;
    const totalLTV = data.reduce((sum, client) => sum + (client.ltv || 0), 0);
    const averageLTV = totalClients > 0 ? totalLTV / totalClients : 0;
    
    // Calculate average conversion time from conversionSpan
    const conversionsWithTime = data.filter(client => 
      client.conversionStatus === 'Converted' && client.conversionSpan > 0
    );
    const averageConversionTime = conversionsWithTime.length > 0 
      ? conversionsWithTime.reduce((sum, client) => sum + client.conversionSpan, 0) / conversionsWithTime.length
      : 0;

    // Calculate average visits post trial
    const clientsWithVisits = data.filter(client => client.visitsPostTrial > 0);
    const averageVisitsPostTrial = clientsWithVisits.length > 0
      ? clientsWithVisits.reduce((sum, client) => sum + client.visitsPostTrial, 0) / clientsWithVisits.length
      : 0;

    // New clients metrics
    const newClientsOnly = data.filter(client => client.isNew === 'New').length;
    const newClientsConverted = data.filter(client => 
      client.isNew === 'New' && client.conversionStatus === 'Converted'
    ).length;
    const newClientConversionRate = newClientsOnly > 0 ? (newClientsConverted / newClientsOnly) * 100 : 0;

    return {
      totalClients,
      convertedClients,
      retainedClients,
      conversionRate: totalClients > 0 ? (convertedClients / totalClients) * 100 : 0,
      retentionRate: totalClients > 0 ? (retainedClients / totalClients) * 100 : 0,
      averageLTV,
      totalLTV,
      averageConversionTime,
      averageVisitsPostTrial,
      newClientsOnly,
      newClientConversionRate
    };
  }, [data]);

  const metricCards = [
    {
      title: "Total Clients",
      value: formatNumber(metrics.totalClients),
      icon: Users,
      color: "blue",
      description: "Total client records in dataset"
    },
    {
      title: "Conversion Rate",
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: Target,
      color: "green",
      description: `${metrics.convertedClients} out of ${metrics.totalClients} converted`
    },
    {
      title: "Retention Rate", 
      value: `${metrics.retentionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "purple",
      description: `${metrics.retainedClients} clients retained`
    },
    {
      title: "Average LTV",
      value: formatCurrency(metrics.averageLTV),
      icon: DollarSign,
      color: "emerald",
      description: `Total LTV: ${formatCurrency(metrics.totalLTV)}`
    },
    {
      title: "Avg Conversion Time",
      value: `${Math.round(metrics.averageConversionTime)} days`,
      icon: Clock,
      color: "orange",
      description: "Average days from first visit to conversion"
    },
    {
      title: "Avg Visits Post Trial",
      value: metrics.averageVisitsPostTrial.toFixed(1),
      icon: Calendar,
      color: "pink",
      description: "Average visits after trial period"
    },
    {
      title: "New Clients",
      value: formatNumber(metrics.newClientsOnly),
      icon: Users,
      color: "indigo",
      description: "First-time clients"
    },
    {
      title: "New Client Conv. Rate",
      value: `${metrics.newClientConversionRate.toFixed(1)}%`,
      icon: Percent,
      color: "teal",
      description: "Conversion rate for new clients only"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <Card key={index} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                  <IconComponent className={`w-6 h-6 text-${metric.color}-600`} />
                </div>
                <Badge variant="outline" className={`text-${metric.color}-600 border-${metric.color}-200`}>
                  Live
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-xs text-gray-500">{metric.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
