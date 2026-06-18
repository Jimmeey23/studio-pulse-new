
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, UserCheck, Repeat } from 'lucide-react';
import { NewClientData } from '@/types/dashboard';

interface ClientAcquisitionFunnelProps {
  data: NewClientData[];
}

export const ClientAcquisitionFunnel: React.FC<ClientAcquisitionFunnelProps> = ({ data }) => {
  const totalClients = data.length;
  const convertedClients = data.filter(client => client.conversionStatus === 'Converted').length;
  const retainedClients = data.filter(client => client.retentionStatus === 'Retained').length;
  const newClients = data.filter(client => client.isNew === 'Yes').length;

  const conversionRate = totalClients > 0 ? (convertedClients / totalClients) * 100 : 0;
  const retentionRate = totalClients > 0 ? (retainedClients / totalClients) * 100 : 0;
  const newClientRate = totalClients > 0 ? (newClients / totalClients) * 100 : 0;

  const funnelStages = [
    {
      label: 'Total Clients',
      value: totalClients,
      percentage: 100,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      label: 'New Clients',
      value: newClients,
      percentage: newClientRate,
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      label: 'Converted',
      value: convertedClients,
      percentage: conversionRate,
      icon: UserCheck,
      color: 'bg-orange-500'
    },
    {
      label: 'Retained',
      value: retainedClients,
      percentage: retentionRate,
      icon: Repeat,
      color: 'bg-purple-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Client Acquisition Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelStages.map((stage, index) => (
            <div key={stage.label} className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${stage.color} text-white`}>
                <stage.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{stage.label}</span>
                  <span className="text-sm text-gray-600">
                    {stage.value} ({stage.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${stage.color}`}
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
