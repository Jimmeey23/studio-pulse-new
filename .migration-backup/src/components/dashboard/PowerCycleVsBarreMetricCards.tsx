
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Calendar, 
  Zap,
  BarChart3,
  Clock,
  Bike,
  Info
} from 'lucide-react';
import { SessionData } from '@/types/dashboard';
import { formatNumber } from '@/utils/formatters';

interface PowerCycleVsBarreMetricCardsProps {
  data: SessionData[];
  onCardClick?: (metricType: string, data: any) => void;
}

export const PowerCycleVsBarreMetricCards: React.FC<PowerCycleVsBarreMetricCardsProps> = ({ 
  data, 
  onCardClick 
}) => {
  const metrics = useMemo(() => {
    // Separate PowerCycle and Barre data
    const powerCycleData = data.filter(session => 
      session.cleanedClass?.toLowerCase().includes('cycle') || 
      session.classType?.toLowerCase().includes('cycle')
    );
    
    const barreData = data.filter(session => 
      session.cleanedClass?.toLowerCase().includes('barre') || 
      session.classType?.toLowerCase().includes('barre')
    );

    // PowerCycle metrics
    const pcTotalSessions = powerCycleData.length;
    const pcTotalAttendance = powerCycleData.reduce((sum, s) => sum + s.checkedInCount, 0);
    const pcTotalCapacity = powerCycleData.reduce((sum, s) => sum + s.capacity, 0);
    const pcAvgFillRate = pcTotalCapacity > 0 ? (pcTotalAttendance / pcTotalCapacity) * 100 : 0;
    const pcAvgSessionSize = pcTotalSessions > 0 ? pcTotalAttendance / pcTotalSessions : 0;
    const pcEmptySessions = powerCycleData.filter(s => s.checkedInCount === 0).length;

    // Barre metrics
    const barreTotalSessions = barreData.length;
    const barreTotalAttendance = barreData.reduce((sum, s) => sum + s.checkedInCount, 0);
    const barreTotalCapacity = barreData.reduce((sum, s) => sum + s.capacity, 0);
    const barreAvgFillRate = barreTotalCapacity > 0 ? (barreTotalAttendance / barreTotalCapacity) * 100 : 0;
    const barreAvgSessionSize = barreTotalSessions > 0 ? barreTotalAttendance / barreTotalSessions : 0;
    const barreEmptySessions = barreData.filter(s => s.checkedInCount === 0).length;

    return {
      totalSessions: {
        powerCycle: pcTotalSessions,
        barre: barreTotalSessions,
        winner: pcTotalSessions > barreTotalSessions ? 'powercycle' : barreTotalSessions > pcTotalSessions ? 'barre' : 'tie',
        rawData: { powerCycleData, barreData }
      },
      totalAttendance: {
        powerCycle: pcTotalAttendance,
        barre: barreTotalAttendance,
        winner: pcTotalAttendance > barreTotalAttendance ? 'powercycle' : barreTotalAttendance > pcTotalAttendance ? 'barre' : 'tie',
        rawData: { powerCycleData, barreData }
      },
      avgFillRate: {
        powerCycle: pcAvgFillRate,
        barre: barreAvgFillRate,
        winner: pcAvgFillRate > barreAvgFillRate ? 'powercycle' : barreAvgFillRate > pcAvgFillRate ? 'barre' : 'tie',
        rawData: { powerCycleData, barreData, pcTotalCapacity, barreTotalCapacity }
      },
      avgSessionSize: {
        powerCycle: pcAvgSessionSize,
        barre: barreAvgSessionSize,
        winner: pcAvgSessionSize > barreAvgSessionSize ? 'powercycle' : barreAvgSessionSize > pcAvgSessionSize ? 'barre' : 'tie',
        rawData: { powerCycleData, barreData }
      },
      emptySessions: {
        powerCycle: pcEmptySessions,
        barre: barreEmptySessions,
        winner: pcEmptySessions < barreEmptySessions ? 'powercycle' : barreEmptySessions < pcEmptySessions ? 'barre' : 'tie',
        rawData: { powerCycleData, barreData }
      }
    };
  }, [data]);

  const MetricCard = ({ 
    title, 
    icon: Icon, 
    metric, 
    format = 'number',
    gradient,
    metricKey
  }: {
    title: string;
    icon: any;
    metric: { powerCycle: number; barre: number; winner: string; rawData: any };
    format?: 'number' | 'percentage' | 'decimal';
    gradient: string;
    metricKey: string;
  }) => {
    const formatValue = (value: number) => {
      switch (format) {
        case 'percentage':
          return `${Math.round(value)}%`;
        case 'decimal':
          return value.toFixed(1);
        default:
          return formatNumber(value);
      }
    };

    const hoverContent = (
      <div className="space-y-2">
        <h4 className="font-semibold">{title} Analytics</h4>
        <div className="text-sm space-y-1">
          <p>PowerCycle: {formatValue(metric.powerCycle)}</p>
          <p>Barre: {formatValue(metric.barre)}</p>
          <p>Difference: {formatValue(Math.abs(metric.powerCycle - metric.barre))}</p>
          <p className="text-xs text-gray-500 mt-2">Click for detailed breakdown</p>
        </div>
      </div>
    );

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Card 
            className="bg-white shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
            onClick={() => onCardClick?.(metricKey, metric)}
          >
            <CardHeader className={`${gradient} text-white pb-3`}>
              <CardTitle className="text-lg font-bold flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                {title}
                <Info className="w-4 h-4 ml-auto opacity-70" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">PowerCycle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl text-gray-800">
                      {formatValue(metric.powerCycle)}
                    </span>
                    {metric.winner === 'powercycle' && (
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2 py-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Leader
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                      <Bike className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Barre</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl text-gray-800">
                      {formatValue(metric.barre)}
                    </span>
                    {metric.winner === 'barre' && (
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2 py-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Leader
                      </Badge>
                    )}
                  </div>
                </div>
                
                {metric.winner === 'tie' && (
                  <div className="text-center pt-2">
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs">
                      Tie
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          {hoverContent}
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      <MetricCard
        title="Total Sessions"
        icon={Calendar}
        metric={metrics.totalSessions}
        gradient="bg-gradient-to-r from-blue-500 to-blue-600"
        metricKey="totalSessions"
      />
      
      <MetricCard
        title="Total Attendance"
        icon={Users}
        metric={metrics.totalAttendance}
        gradient="bg-gradient-to-r from-purple-500 to-purple-600"
        metricKey="totalAttendance"
      />
      
      <MetricCard
        title="Average Fill Rate"
        icon={Target}
        metric={metrics.avgFillRate}
        format="percentage"
        gradient="bg-gradient-to-r from-green-500 to-green-600"
        metricKey="avgFillRate"
      />
      
      <MetricCard
        title="Avg Session Size"
        icon={BarChart3}
        metric={metrics.avgSessionSize}
        format="decimal"
        gradient="bg-gradient-to-r from-orange-500 to-orange-600"
        metricKey="avgSessionSize"
      />
      
      <MetricCard
        title="Empty Sessions"
        icon={Clock}
        metric={metrics.emptySessions}
        gradient="bg-gradient-to-r from-red-500 to-red-600"
        metricKey="emptySessions"
      />
    </div>
  );
};
