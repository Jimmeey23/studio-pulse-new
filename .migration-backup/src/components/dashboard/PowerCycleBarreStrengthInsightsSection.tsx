import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PayrollData } from '@/types/dashboard';
import { 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Zap, 
  AlertCircle, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface PowerCycleBarreStrengthInsightsSectionProps {
  data: PayrollData[];
  onItemClick: (item: any) => void;
}

export const PowerCycleBarreStrengthInsightsSection: React.FC<PowerCycleBarreStrengthInsightsSectionProps> = ({
  data,
  onItemClick
}) => {
  const insights = useMemo(() => {
    if (!data || data.length === 0) return [];

    const insights = [];

    // Calculate totals
    const totalSessions = data.reduce((sum, d) => sum + (d.totalSessions || 0), 0);
    const totalCycleSessions = data.reduce((sum, d) => sum + (d.cycleSessions || 0), 0);
    const totalBarreSessions = data.reduce((sum, d) => sum + (d.barreSessions || 0), 0);
    const totalCustomers = data.reduce((sum, d) => sum + (d.totalCustomers || 0), 0);
    const totalRevenue = data.reduce((sum, d) => sum + (d.totalPaid || 0), 0);

    // Performance insights
    const cycleVsBarreRatio = totalCycleSessions / (totalBarreSessions || 1);
    if (cycleVsBarreRatio > 1.5) {
      insights.push({
        type: 'performance',
        icon: <Zap className="w-5 h-5 text-yellow-500" />,
        title: 'PowerCycle Dominance',
        description: `PowerCycle sessions are ${(cycleVsBarreRatio * 100 - 100).toFixed(0)}% higher than Barre sessions`,
        recommendation: 'Consider expanding PowerCycle capacity or promoting Barre classes',
        priority: 'medium'
      });
    } else if (cycleVsBarreRatio < 0.7) {
      insights.push({
        type: 'performance',
        icon: <Target className="w-5 h-5 text-purple-500" />,
        title: 'Barre Leading Performance',
        description: `Barre sessions are ${((1/cycleVsBarreRatio) * 100 - 100).toFixed(0)}% higher than PowerCycle sessions`,
        recommendation: 'Consider increasing PowerCycle marketing or class availability',
        priority: 'medium'
      });
    }

    // Efficiency insights
    const avgCustomersPerSession = totalCustomers / (totalSessions || 1);
    if (avgCustomersPerSession < 8) {
      insights.push({
        type: 'efficiency',
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        title: 'Low Session Utilization',
        description: `Average ${avgCustomersPerSession.toFixed(1)} customers per session`,
        recommendation: 'Focus on improving class attendance and reducing empty sessions',
        priority: 'high'
      });
    } else if (avgCustomersPerSession > 12) {
      insights.push({
        type: 'efficiency',
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        title: 'Excellent Session Utilization',
        description: `Strong average of ${avgCustomersPerSession.toFixed(1)} customers per session`,
        recommendation: 'Maintain current strategies and consider expanding popular time slots',
        priority: 'low'
      });
    }

    // Revenue insights
    const revenuePerCustomer = totalRevenue / (totalCustomers || 1);
    if (revenuePerCustomer > 1500) {
      insights.push({
        type: 'revenue',
        icon: <TrendingUp className="w-5 h-5 text-green-500" />,
        title: 'High Revenue Per Customer',
        description: `Excellent ₹${revenuePerCustomer.toFixed(0)} average revenue per customer`,
        recommendation: 'Focus on customer retention to maintain this high value',
        priority: 'low'
      });
    }

    // Location insights
    const locationData = data.reduce((acc, item) => {
      const location = item.location || 'Unknown';
      if (!acc[location]) {
        acc[location] = { sessions: 0, customers: 0, revenue: 0 };
      }
      acc[location].sessions += item.totalSessions || 0;
      acc[location].customers += item.totalCustomers || 0;
      acc[location].revenue += item.totalPaid || 0;
      return acc;
    }, {} as Record<string, any>);

    const locations = Object.entries(locationData);
    if (locations.length > 1) {
      const topLocation = locations.reduce((max, curr) => 
        curr[1].sessions > max[1].sessions ? curr : max
      );
      const topLocationShare = (topLocation[1].sessions / totalSessions) * 100;
      
      if (topLocationShare > 60) {
        insights.push({
          type: 'location',
          icon: <Target className="w-5 h-5 text-blue-500" />,
          title: 'Location Concentration',
          description: `${topLocation[0]} dominates with ${topLocationShare.toFixed(0)}% of sessions`,
          recommendation: 'Consider strategies to boost performance at other locations',
          priority: 'medium'
        });
      }
    }

    // Trainer insights
    const trainerData = data.reduce((acc, item) => {
      const trainer = item.teacherName || 'Unknown';
      if (!acc[trainer]) {
        acc[trainer] = { sessions: 0, customers: 0 };
      }
      acc[trainer].sessions += item.totalSessions || 0;
      acc[trainer].customers += item.totalCustomers || 0;
      return acc;
    }, {} as Record<string, any>);

    const trainers = Object.entries(trainerData);
    const topTrainer = trainers.reduce((max, curr) => 
      curr[1].sessions > max[1].sessions ? curr : max
    );

    if (topTrainer && trainers.length > 1) {
      const topTrainerShare = (topTrainer[1].sessions / totalSessions) * 100;
      insights.push({
        type: 'trainer',
        icon: <Users className="w-5 h-5 text-purple-500" />,
        title: 'Top Performing Trainer',
        description: `${topTrainer[0]} leads with ${topTrainerShare.toFixed(0)}% of total sessions`,
        recommendation: 'Learn from their best practices and share with other trainers',
        priority: 'low'
      });
    }

    return insights;
  }, [data]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Strategic Insights & Recommendations</h2>
        <p className="text-slate-600">Data-driven insights to optimize your PowerCycle vs Barre performance</p>
      </div>

      {insights.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No Insights Available</h3>
            <p className="text-slate-500">Add more data to generate meaningful insights</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {insights.map((insight, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {insight.icon}
                    <div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <Badge className={`mt-2 ${getPriorityColor(insight.priority)}`}>
                        {insight.priority.toUpperCase()} PRIORITY
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-slate-700">{insight.description}</p>
                  <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-cyan-500">
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700 font-medium">{insight.recommendation}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Key Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-500" />
            Key Performance Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">
                {data.length > 0 ? ((data.reduce((sum, d) => sum + (d.totalCustomers || 0), 0) / 
                  data.reduce((sum, d) => sum + (d.totalSessions || 0), 1)) || 0).toFixed(1) : '0'}
              </div>
              <div className="text-sm text-slate-600">Avg Customers/Session</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.length > 0 ? ((data.reduce((sum, d) => sum + (d.cycleSessions || 0), 0) / 
                  (data.reduce((sum, d) => sum + (d.barreSessions || 0), 1) || 1)) || 0).toFixed(1) : '0'}
              </div>
              <div className="text-sm text-slate-600">Cycle/Barre Ratio</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ₹{data.length > 0 ? ((data.reduce((sum, d) => sum + (d.totalPaid || 0), 0) / 
                  (data.reduce((sum, d) => sum + (d.totalCustomers || 0), 1) || 1)) || 0).toFixed(0) : '0'}
              </div>
              <div className="text-sm text-slate-600">Revenue/Customer</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};