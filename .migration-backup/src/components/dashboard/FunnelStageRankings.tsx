
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { isLeadConverted } from '@/utils/leadConversions';
import { cn } from '@/lib/utils';

interface FunnelStageRankingsProps {
  data: LeadsData[];
}

export const FunnelStageRankings: React.FC<FunnelStageRankingsProps> = ({ data }) => {
  const stageRankings = useMemo(() => {
    if (!data.length) return { stages: [], insights: [] };

    const stageStats = data.reduce((acc, lead) => {
      const stage = lead.stage || 'Unknown';
      if (!acc[stage]) {
        acc[stage] = {
          name: stage,
          count: 0,
          converted: 0,
          avgLTV: 0,
          totalLTV: 0,
          avgVisits: 0,
          totalVisits: 0
        };
      }
      
      acc[stage].count += 1;
      if (isLeadConverted(lead)) acc[stage].converted += 1;
      acc[stage].totalLTV += lead.ltv || 0;
      acc[stage].totalVisits += lead.visits || 0;
      
      return acc;
    }, {} as Record<string, any>);

    const processedStages = Object.values(stageStats)
      .map((stage: any) => ({
        ...stage,
        conversionRate: stage.count > 0 ? (stage.converted / stage.count) * 100 : 0,
        avgLTV: stage.count > 0 ? stage.totalLTV / stage.count : 0,
        avgVisits: stage.count > 0 ? stage.totalVisits / stage.count : 0,
        percentage: (stage.count / data.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Generate insights
    const insights = [
      {
        type: 'bottleneck',
        stage: processedStages.find(s => s.conversionRate < 20 && s.count > 10)?.name || 'None identified',
        message: 'Stage with low conversion rate requiring attention'
      },
      {
        type: 'success',
        stage: processedStages.find(s => s.conversionRate > 70)?.name || 'None identified',
        message: 'High-performing stage with excellent conversion'
      },
      {
        type: 'volume',
        stage: processedStages[0]?.name || 'None',
        message: 'Stage with highest lead volume'
      }
    ];

    return { stages: processedStages, insights };
  }, [data]);

  const getStageIcon = (stageName: string) => {
    if (stageName.includes('Trial')) return CheckCircle;
    if (stageName.includes('Schedule') || stageName.includes('Follow')) return Clock;
    if (stageName.includes('Lost') || stageName.includes('Inactive')) return AlertTriangle;
    return Activity;
  };

  const getStageColor = (conversionRate: number) => {
    if (conversionRate >= 70) return 'green';
    if (conversionRate >= 40) return 'yellow';
    return 'red';
  };

  const StageItem = ({ stage, index }: { stage: any; index: number }) => {
    const Icon = getStageIcon(stage.name);
    const colorClass = getStageColor(stage.conversionRate);
    
    return (
      <div 
        className={cn(
          "group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:shadow-lg",
          "bg-gradient-to-r from-white to-slate-50 hover:from-slate-50 hover:to-slate-100",
          "animate-fade-in border border-slate-200 hover:border-slate-300"
        )}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group-hover:scale-110",
          colorClass === 'green' && "bg-green-500 text-white",
          colorClass === 'yellow' && "bg-yellow-500 text-white",
          colorClass === 'red' && "bg-red-500 text-white"
        )}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-800 truncate group-hover:text-slate-900 transition-colors">
            {stage.name}
          </h4>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-sm">
              <span className="text-slate-600">Leads: </span>
              <span className="font-bold text-slate-800">{formatNumber(stage.count)}</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-600">Rate: </span>
              <span className={cn(
                "font-bold",
                colorClass === 'green' && "text-green-600",
                colorClass === 'yellow' && "text-yellow-600",
                colorClass === 'red' && "text-red-600"
              )}>
                {stage.conversionRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-slate-800">
            {stage.percentage.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            of total
          </div>
        </div>
      </div>
    );
  };

  const InsightItem = ({ insight, index }: { insight: any; index: number }) => {
    const getInsightIcon = () => {
      switch (insight.type) {
        case 'bottleneck': return AlertTriangle;
        case 'success': return CheckCircle;
        case 'volume': return TrendingUp;
        default: return Activity;
      }
    };

    const getInsightColor = () => {
      switch (insight.type) {
        case 'bottleneck': return 'red';
        case 'success': return 'green';
        case 'volume': return 'blue';
        default: return 'gray';
      }
    };

    const Icon = getInsightIcon();
    const color = getInsightColor();

    return (
      <div 
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg transition-all duration-300",
          "bg-white border border-slate-200 hover:shadow-md",
          "animate-fade-in"
        )}
        style={{ animationDelay: `${index * 150}ms` }}
      >
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
          color === 'red' && "bg-red-100 text-red-600",
          color === 'green' && "bg-green-100 text-green-600",
          color === 'blue' && "bg-blue-100 text-blue-600"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-800 text-sm">
            {insight.stage}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {insight.message}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Activity className="w-6 h-6 text-purple-600 animate-pulse" />
          Stage Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stage Rankings */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Stage Performance</h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stageRankings.stages.map((stage, index) => (
              <StageItem key={stage.name} stage={stage} index={index} />
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-800">Key Insights</h3>
          </div>
          <div className="space-y-3">
            {stageRankings.insights.map((insight, index) => (
              <InsightItem key={insight.type} insight={insight} index={index} />
            ))}
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
          <h4 className="font-semibold text-slate-800 mb-3">Stage Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Total Stages:</span>
              <div className="font-bold text-slate-800">
                {stageRankings.stages.length}
              </div>
            </div>
            <div>
              <span className="text-slate-600">Best Performing:</span>
              <div className="font-bold text-green-600">
                {stageRankings.stages.length > 0 
                  ? stageRankings.stages.reduce((best, stage) => 
                      stage.conversionRate > best.conversionRate ? stage : best
                    ).name
                  : 'N/A'
                }
              </div>
            </div>
            <div>
              <span className="text-slate-600">Highest Volume:</span>
              <div className="font-bold text-blue-600">
                {stageRankings.stages[0]?.name || 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-slate-600">Avg Conversion:</span>
              <div className="font-bold text-slate-800">
                {stageRankings.stages.length > 0 
                  ? (stageRankings.stages.reduce((sum, s) => sum + s.conversionRate, 0) / stageRankings.stages.length).toFixed(1)
                  : '0'
                }%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
