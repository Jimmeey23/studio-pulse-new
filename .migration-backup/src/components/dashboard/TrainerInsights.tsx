
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Award, AlertTriangle, Users, DollarSign, Target, Lightbulb } from 'lucide-react';

interface TrainerInsightsProps {
  data: Array<{
    name: string;
    totalValue: number;
    conversion: number;
    sessions: number;
    uniqueMembers: number;
  }>;
}

export const TrainerInsights = ({ data }: TrainerInsightsProps) => {
  if (!data.length) return null;

  const insights = React.useMemo(() => {
    const sortedByRevenue = [...data].sort((a, b) => b.totalValue - a.totalValue);
    const sortedByConversion = [...data].sort((a, b) => b.conversion - a.conversion);
    const sortedBySessions = [...data].sort((a, b) => b.sessions - a.sessions);
    
    const avgRevenue = data.reduce((sum, t) => sum + t.totalValue, 0) / data.length;
    const avgConversion = data.reduce((sum, t) => sum + t.conversion, 0) / data.length;
    const avgSessions = data.reduce((sum, t) => sum + t.sessions, 0) / data.length;
    
    const topPerformer = sortedByRevenue[0];
    const bestConverter = sortedByConversion[0];
    const mostActive = sortedBySessions[0];
    const needsAttention = data.filter(t => t.conversion < avgConversion * 0.7);
    
    return {
      topPerformer,
      bestConverter,
      mostActive,
      needsAttention,
      avgRevenue,
      avgConversion,
      avgSessions,
      trends: {
        highPerformers: data.filter(t => t.totalValue > avgRevenue * 1.2).length,
        lowPerformers: data.filter(t => t.totalValue < avgRevenue * 0.6).length,
        consistentTrainers: data.filter(t => t.conversion >= avgConversion * 0.9 && t.conversion <= avgConversion * 1.1).length
      }
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Key Insights */}
      <Card className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-blue-600" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-slate-800">Top Revenue Generator</span>
            </div>
            <p className="text-sm text-slate-600">
              <span className="font-bold text-blue-600">{insights.topPerformer.name}</span> leads with 
              ₹{(insights.topPerformer.totalValue / 1000).toFixed(0)}K revenue, 
              {((insights.topPerformer.totalValue / insights.avgRevenue - 1) * 100).toFixed(0)}% above average
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-slate-800">Conversion Champion</span>
            </div>
            <p className="text-sm text-slate-600">
              <span className="font-bold text-green-600">{insights.bestConverter.name}</span> achieves 
              {insights.bestConverter.conversion.toFixed(1)}% conversion rate, 
              {((insights.bestConverter.conversion / insights.avgConversion - 1) * 100).toFixed(0)}% above average
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-slate-800">Most Active Trainer</span>
            </div>
            <p className="text-sm text-slate-600">
              <span className="font-bold text-purple-600">{insights.mostActive.name}</span> conducted 
              {insights.mostActive.sessions} sessions, 
              {((insights.mostActive.sessions / insights.avgSessions - 1) * 100).toFixed(0)}% above average
            </p>
          </div>

          {insights.needsAttention.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">Needs Attention</span>
              </div>
              <p className="text-sm text-red-700">
                {insights.needsAttention.length} trainer{insights.needsAttention.length > 1 ? 's' : ''} performing 
                below 70% of average conversion rate
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Distribution */}
      <Card className="bg-gradient-to-br from-green-50 via-white to-blue-50 border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Performance Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-green-600">{insights.trends.highPerformers}</div>
              <div className="text-xs text-slate-600">High Performers</div>
              <Badge className="mt-1 bg-green-100 text-green-800">20%+ above avg</Badge>
            </div>
            
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-blue-600">{insights.trends.consistentTrainers}</div>
              <div className="text-xs text-slate-600">Consistent</div>
              <Badge className="mt-1 bg-blue-100 text-blue-800">±10% of avg</Badge>
            </div>
            
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-red-600">{insights.trends.lowPerformers}</div>
              <div className="text-xs text-slate-600">Below Average</div>
              <Badge className="mt-1 bg-red-100 text-red-800">40%+ below avg</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700">Average Revenue</span>
                <span className="text-sm font-bold text-blue-600">₹{(insights.avgRevenue / 1000).toFixed(0)}K</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '50%'}}></div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700">Average Conversion</span>
                <span className="text-sm font-bold text-green-600">{insights.avgConversion.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: `${Math.min(insights.avgConversion, 100)}%`}}></div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700">Average Sessions</span>
                <span className="text-sm font-bold text-purple-600">{insights.avgSessions.toFixed(0)}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{width: '60%'}}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
