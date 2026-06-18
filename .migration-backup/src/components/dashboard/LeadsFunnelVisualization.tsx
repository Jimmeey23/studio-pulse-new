
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, UserCheck, CreditCard, Target } from 'lucide-react';
import { formatNumber, formatPercentage } from '@/utils/formatters';

interface FunnelStageData {
  stage: string;
  count: number;
  percentage: number;
  conversionRate: number;
  icon: React.ReactNode;
  color: string;
}

interface LeadsFunnelVisualizationProps {
  data: {
    totalLeads: number;
    trialScheduled: number;
    trialCompleted: number;
    membershipsSold: number;
  };
}

export const LeadsFunnelVisualization: React.FC<LeadsFunnelVisualizationProps> = ({ data }) => {
  const funnelStages: FunnelStageData[] = [
    {
      stage: 'Total Leads',
      count: data.totalLeads,
      percentage: 100,
      conversionRate: 100,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      stage: 'Trial Scheduled',
      count: data.trialScheduled,
      percentage: data.totalLeads > 0 ? (data.trialScheduled / data.totalLeads) * 100 : 0,
      conversionRate: data.totalLeads > 0 ? (data.trialScheduled / data.totalLeads) * 100 : 0,
      icon: <Target className="w-6 h-6" />,
      color: 'bg-purple-500'
    },
    {
      stage: 'Trial Completed',
      count: data.trialCompleted,
      percentage: data.totalLeads > 0 ? (data.trialCompleted / data.totalLeads) * 100 : 0,
      conversionRate: data.trialScheduled > 0 ? (data.trialCompleted / data.trialScheduled) * 100 : 0,
      icon: <UserCheck className="w-6 h-6" />,
      color: 'bg-orange-500'
    },
    {
      stage: 'Membership Sold',
      count: data.membershipsSold,
      percentage: data.totalLeads > 0 ? (data.membershipsSold / data.totalLeads) * 100 : 0,
      conversionRate: data.trialCompleted > 0 ? (data.membershipsSold / data.trialCompleted) * 100 : 0,
      icon: <CreditCard className="w-6 h-6" />,
      color: 'bg-green-500'
    }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Lead Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {funnelStages.map((stage, index) => (
            <div key={stage.stage} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stage.color} text-white`}>
                    {stage.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{stage.stage}</h3>
                    <p className="text-sm text-gray-600">
                      {formatNumber(stage.count)} leads ({stage.percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatNumber(stage.count)}</div>
                  <div className="text-sm text-gray-600">
                    {index > 0 && `${stage.conversionRate.toFixed(1)}% conversion`}
                  </div>
                </div>
              </div>
              <Progress 
                value={stage.percentage} 
                className="h-3 mb-4"
              />
              {index < funnelStages.length - 1 && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400"></div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
          <h4 className="font-semibold mb-2">Overall Conversion Rate</h4>
          <div className="text-3xl font-bold text-green-600">
            {data.totalLeads > 0 ? `${((data.membershipsSold / data.totalLeads) * 100).toFixed(1)}%` : '0%'}
          </div>
          <p className="text-sm text-gray-600">From lead to membership sale</p>
        </div>
      </CardContent>
    </Card>
  );
};
