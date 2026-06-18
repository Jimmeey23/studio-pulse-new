
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, TrendingDown, Award, Target, DollarSign, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface FunnelSourceRankingsProps {
  data: LeadsData[];
}

type RankingCriteria = 'conversion' | 'volume' | 'ltv' | 'visits';

export const FunnelSourceRankings: React.FC<FunnelSourceRankingsProps> = ({ data }) => {
  const [topCriteria, setTopCriteria] = useState<RankingCriteria>('conversion');
  const [bottomCriteria, setBottomCriteria] = useState<RankingCriteria>('conversion');
  const [showAllTop, setShowAllTop] = useState(false);
  const [showAllBottom, setShowAllBottom] = useState(false);

  const sourceRankings = useMemo(() => {
    if (!data || !data.length) {
      return { 
        processed: [],
        topByCriteria: {},
        bottomByCriteria: {}
      };
    }

    const sourceStats = data.reduce((acc, lead) => {
      const source = lead.source || 'Unknown';
      if (!acc[source]) {
        acc[source] = {
          name: source,
          totalLeads: 0,
          convertedLeads: 0,
          totalLTV: 0,
          totalVisits: 0,
          trialsCompleted: 0,
          trialsScheduled: 0
        };
      }
      
      acc[source].totalLeads += 1;
      if (lead.conversionStatus === 'Converted') acc[source].convertedLeads += 1;
      acc[source].totalLTV += lead.ltv || 0;
      acc[source].totalVisits += lead.visits || 0;
      if (lead.stage === 'Trial Completed') acc[source].trialsCompleted += 1;
      if (lead.stage?.includes('Trial')) acc[source].trialsScheduled += 1;
      
      return acc;
    }, {} as Record<string, any>);

    const processedSources = Object.values(sourceStats)
      .map((source: any) => ({
        ...source,
        conversionRate: source.totalLeads > 0 ? (source.convertedLeads / source.totalLeads) * 100 : 0,
        avgLTV: source.totalLeads > 0 ? source.totalLTV / source.totalLeads : 0,
        avgVisits: source.totalLeads > 0 ? source.totalVisits / source.totalLeads : 0,
        trialCompletionRate: source.trialsScheduled > 0 ? (source.trialsCompleted / source.trialsScheduled) * 100 : 0
      }))
      .filter(source => source.totalLeads >= 3);

    const topByCriteria = {
      conversion: [...processedSources].sort((a, b) => b.conversionRate - a.conversionRate),
      volume: [...processedSources].sort((a, b) => b.totalLeads - a.totalLeads),
      ltv: [...processedSources].sort((a, b) => b.avgLTV - a.avgLTV),
      visits: [...processedSources].sort((a, b) => b.avgVisits - a.avgVisits)
    };

    const bottomByCriteria = {
      conversion: [...processedSources].sort((a, b) => a.conversionRate - b.conversionRate),
      volume: [...processedSources].sort((a, b) => a.totalLeads - b.totalLeads),
      ltv: [...processedSources].sort((a, b) => a.avgLTV - b.avgLTV),
      visits: [...processedSources].sort((a, b) => a.avgVisits - b.avgVisits)
    };

    return {
      processed: processedSources,
      topByCriteria,
      bottomByCriteria
    };
  }, [data]);

  const getCriteriaValue = (source: any, criteria: RankingCriteria) => {
    switch (criteria) {
      case 'conversion': return `${source.conversionRate.toFixed(1)}%`;
      case 'volume': return source.totalLeads.toLocaleString('en-IN');
      case 'ltv': return formatCurrency(source.avgLTV);
      case 'visits': return source.avgVisits.toFixed(1);
      default: return '';
    }
  };

  const getCriteriaLabel = (criteria: RankingCriteria) => {
    switch (criteria) {
      case 'conversion': return 'Conversion Rate';
      case 'volume': return 'Lead Volume';
      case 'ltv': return 'Average LTV';
      case 'visits': return 'Avg Visits';
      default: return '';
    }
  };

  const getCriteriaIcon = (criteria: RankingCriteria) => {
    switch (criteria) {
      case 'conversion': return Target;
      case 'volume': return Users;
      case 'ltv': return DollarSign;
      case 'visits': return TrendingUp;
      default: return Target;
    }
  };

  const RankingItem = ({ source, rank, type, criteria }: { 
    source: any; 
    rank: number; 
    type: 'top' | 'bottom'; 
    criteria: RankingCriteria;
  }) => {
    const isTop = type === 'top';
    const icon = rank === 1 ? Trophy : rank === 2 ? Award : Target;
    const IconComponent = icon;
    
    return (
      <div 
        className={cn(
          "group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1",
          isTop ? "bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200" 
                : "bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border border-red-200",
          "animate-fade-in"
        )}
        style={{ animationDelay: `${rank * 100}ms` }}
      >
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group-hover:scale-110 shadow-lg",
          isTop ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white" 
                : "bg-gradient-to-br from-red-500 to-rose-600 text-white"
        )}>
          <IconComponent className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 truncate group-hover:text-slate-900 transition-colors text-lg">
            {source.name}
          </h4>
          <div className="flex items-center gap-3 mt-2">
            <span className={cn(
              "text-xl font-black",
              isTop ? "text-green-700" : "text-red-700"
            )}>
              {getCriteriaValue(source, criteria)}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">
              {getCriteriaLabel(criteria)}
            </span>
          </div>
          <div className="text-sm text-slate-600 mt-1">
            {source.totalLeads.toLocaleString('en-IN')} leads • {source.convertedLeads} converted
          </div>
        </div>
        
        <div className="text-right">
          <Badge 
            variant={isTop ? "default" : "destructive"}
            className={cn(
              "text-sm px-3 py-1 font-bold",
              isTop ? "bg-green-600 text-white" : "bg-red-600 text-white"
            )}
          >
            #{rank}
          </Badge>
        </div>
      </div>
    );
  };

  const CriteriaSelector = ({ 
    criteria, 
    onChange, 
    label 
  }: { 
    criteria: RankingCriteria; 
    onChange: (criteria: RankingCriteria) => void;
    label: string;
  }) => (
    <div className="flex gap-2 mb-4">
      <span className="text-sm font-medium text-slate-700 mr-2">{label}:</span>
      {(['conversion', 'volume', 'ltv', 'visits'] as RankingCriteria[]).map(c => {
        const Icon = getCriteriaIcon(c);
        return (
          <Button
            key={c}
            variant={criteria === c ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(c)}
            className="text-xs gap-1"
          >
            <Icon className="w-3 h-3" />
            {getCriteriaLabel(c)}
          </Button>
        );
      })}
    </div>
  );

  if (!data || !data.length) {
    return (
      <Card className="w-full bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Trophy className="w-6 h-6 text-yellow-600" />
            Source Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            No data available for source rankings
          </div>
        </CardContent>
      </Card>
    );
  }

  const topSources = sourceRankings.topByCriteria[topCriteria] || [];
  const bottomSources = sourceRankings.bottomByCriteria[bottomCriteria] || [];

  return (
    <Card className="w-full bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Trophy className="w-6 h-6 text-yellow-600 animate-pulse" />
          Source Performance Rankings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {/* Top Performers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-slate-800 text-lg">Top Performers</h3>
          </div>
          
          <CriteriaSelector 
            criteria={topCriteria}
            onChange={setTopCriteria}
            label="Rank by"
          />
          
          <div className="space-y-3">
            {topSources.slice(0, showAllTop ? topSources.length : 5).map((source, index) => (
              <RankingItem 
                key={`top-${source.name}`} 
                source={source} 
                rank={index + 1} 
                type="top"
                criteria={topCriteria}
              />
            ))}
            
            {topSources.length > 5 && (
              <Button
                variant="outline"
                onClick={() => setShowAllTop(!showAllTop)}
                className="w-full gap-2"
              >
                {showAllTop ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showAllTop ? 'Show Less' : `Show All ${topSources.length} Sources`}
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Performers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-800 text-lg">Needs Improvement</h3>
          </div>
          
          <CriteriaSelector 
            criteria={bottomCriteria}
            onChange={setBottomCriteria}
            label="Rank by"
          />
          
          <div className="space-y-3">
            {bottomSources.slice(0, showAllBottom ? bottomSources.length : 5).map((source, index) => (
              <RankingItem 
                key={`bottom-${source.name}`} 
                source={source} 
                rank={index + 1} 
                type="bottom"
                criteria={bottomCriteria}
              />
            ))}
            
            {bottomSources.length > 5 && (
              <Button
                variant="outline"
                onClick={() => setShowAllBottom(!showAllBottom)}
                className="w-full gap-2"
              >
                {showAllBottom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showAllBottom ? 'Show Less' : `Show All ${bottomSources.length} Sources`}
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-4 text-lg">Performance Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-black text-green-600 mb-1">
                {topSources[0]?.conversionRate.toFixed(1) || '0'}%
              </div>
              <div className="text-slate-600 font-medium">Best Conversion</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-black text-blue-600 mb-1">
                {formatCurrency(Math.max(...sourceRankings.processed.map(s => s.avgLTV)))}
              </div>
              <div className="text-slate-600 font-medium">Highest LTV</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-black text-purple-600 mb-1">
                {Math.max(...sourceRankings.processed.map(s => s.totalLeads)).toLocaleString('en-IN')}
              </div>
              <div className="text-slate-600 font-medium">Most Leads</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-black text-slate-800 mb-1">
                {sourceRankings.processed.length}
              </div>
              <div className="text-slate-600 font-medium">Active Sources</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
