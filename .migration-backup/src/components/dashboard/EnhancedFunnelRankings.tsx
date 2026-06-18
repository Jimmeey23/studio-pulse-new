import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Users, Target, AlertTriangle, Award, Crown, Trophy, Medal, Star, ArrowDownCircle, ThumbsDown, BarChart3 } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { isLeadConverted } from '@/utils/leadConversions';
import { cn } from '@/lib/utils';
import { LeadsData } from '@/types/leads';

interface EnhancedFunnelRankingsProps {
  data: LeadsData[];
}

export const EnhancedFunnelRankings: React.FC<EnhancedFunnelRankingsProps> = ({ data }) => {
  const [activeType, setActiveType] = useState<'source' | 'stage'>('source');
  const [showMore, setShowMore] = useState(false);

  const rankings = useMemo(() => {
    if (!data || data.length === 0) return { sources: [], stages: [] };

    // Source rankings
    const sourceMap = new Map();
    data.forEach(lead => {
      const source = lead.source || 'Unknown';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          name: source,
          count: 0,
          converted: 0,
          revenue: 0,
          conversionRate: 0
        });
      }

      const sourceData = sourceMap.get(source);
      sourceData.count += 1;
      
      if (isLeadConverted(lead)) {
        sourceData.converted += 1;
      }
      
      sourceData.revenue += (lead.ltv || 0);
    });

    const sources = Array.from(sourceMap.values()).map(source => ({
      ...source,
      conversionRate: source.count > 0 ? (source.converted / source.count) * 100 : 0,
      avgRevenue: source.count > 0 ? source.revenue / source.count : 0
    })).sort((a, b) => b.count - a.count);

    // Stage rankings
    const stageMap = new Map();
    data.forEach(lead => {
      const stage = lead.stage || 'Unknown';
      if (!stageMap.has(stage)) {
        stageMap.set(stage, {
          name: stage,
          count: 0,
          converted: 0,
          revenue: 0,
          conversionRate: 0
        });
      }

      const stageData = stageMap.get(stage);
      stageData.count += 1;
      
      if (isLeadConverted(lead)) {
        stageData.converted += 1;
      }
      
      stageData.revenue += (lead.ltv || 0);
    });

    const stages = Array.from(stageMap.values()).map(stage => ({
      ...stage,
      conversionRate: stage.count > 0 ? (stage.converted / stage.count) * 100 : 0,
      avgRevenue: stage.count > 0 ? stage.revenue / stage.count : 0,
      percentage: stage.count > 0 ? (stage.count / data.length) * 100 : 0
    })).sort((a, b) => b.count - a.count);

    return { sources, stages };
  }, [data]);

  const totalLeads = data?.length || 0;
  const displayCount = showMore ? 10 : 5;
  const currentRankings = activeType === 'source' ? rankings.sources : rankings.stages;
  const topItems = currentRankings.slice(0, displayCount);
  const bottomItems = currentRankings.slice(-displayCount).reverse();

  const getTypeConfig = (type: 'source' | 'stage') => {
    if (type === 'source') {
      return { icon: Users, label: 'Sources', description: 'Lead source performance' };
    }
    return { icon: Target, label: 'Stages', description: 'Funnel stage performance' };
  };

  const renderRankingCard = (items: any[], isTop: boolean, type: 'source' | 'stage') => {
    const config = getTypeConfig(type);

    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            {isTop ? (
              <>
                <div className="p-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    Top {displayCount} {config.label}
                  </span>
                  <p className="text-sm text-slate-600 font-normal">{config.description}</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                    Bottom {displayCount} {config.label}
                  </span>
                  <p className="text-sm text-slate-600 font-normal">Areas for improvement</p>
                </div>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div 
              key={item.name} 
              className={`group flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border hover:shadow-md transition-all duration-300 ${isTop ? 'hover:border-emerald-200/70' : 'hover:border-rose-200/70'}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                  isTop 
                    ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-white'
                    : 'bg-gradient-to-br from-red-500 via-rose-600 to-red-700 text-white'
                )}>
                  {isTop ? (
                    index === 0 ? <Crown className="w-6 h-6" /> :
                    index === 1 ? <Trophy className="w-6 h-6" /> :
                    index === 2 ? <Medal className="w-5 h-5" /> :
                    index === 3 ? <Star className="w-5 h-5" /> :
                    <span className="text-sm font-bold">{index + 1}</span>
                  ) : (
                    index === 0 ? <ArrowDownCircle className="w-6 h-6" /> :
                    index === 1 ? <TrendingDown className="w-6 h-6" /> :
                    index === 2 ? <ThumbsDown className="w-5 h-5" /> :
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 whitespace-normal break-words group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {formatNumber(item.count)} leads
                    </Badge>
                    <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                      {item.conversionRate.toFixed(1)}% conv.
                    </Badge>
                    <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                      Avg: {formatCurrency(item.avgRevenue)}
                    </Badge>
                    {type === 'stage' && (
                      <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                        {item.percentage.toFixed(1)}% of funnel
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                  {formatNumber(item.count)}
                </p>
                <p className="text-sm text-slate-500">{formatNumber(item.converted)} converted</p>
                <p className="text-xs text-slate-400">{formatCurrency(item.revenue)} revenue</p>
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Performance Summary
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMore(!showMore)}
                className="text-xs"
              >
                Show {showMore ? 'Less' : 'More'}
              </Button>
            </div>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Average leads: {formatNumber(items.reduce((sum, s) => sum + s.count, 0) / items.length)}</li>
              <li>• Total converted: {formatNumber(items.reduce((sum, s) => sum + s.converted, 0))}</li>
              <li>• Combined revenue: {formatCurrency(items.reduce((sum, s) => sum + s.revenue, 0))}</li>
              <li>• Performance spread: {((items[0]?.count / items[items.length - 1]?.count || 1) - 1).toFixed(1)}x variance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Tab Navigation */}
      <Card className="bg-gradient-to-br from-white via-slate-50/20 to-white border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            Lead Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeType} onValueChange={(val) => setActiveType(val as 'source' | 'stage')} className="w-full">
            <TabsList className="bg-white/90 backdrop-blur-sm p-1.5 rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl mx-auto overflow-visible grid grid-cols-2 gap-0.5">
              <TabsTrigger 
                value="source" 
                className="relative text-center px-3 py-3 font-semibold text-sm min-h-[60px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-10 data-[state=active]:scale-105 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4 shrink-0" />
                <span className="text-sm leading-tight whitespace-nowrap">Lead Sources</span>
              </TabsTrigger>
              <TabsTrigger 
                value="stage" 
                className="relative text-center px-3 py-3 font-semibold text-sm min-h-[60px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-10 data-[state=active]:scale-105 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4 shrink-0" />
                <span className="text-sm leading-tight whitespace-nowrap">Funnel Stages</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeType} className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {renderRankingCard(topItems, true, activeType)}
                {renderRankingCard(bottomItems, false, activeType)}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};