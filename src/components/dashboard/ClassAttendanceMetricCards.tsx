import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Target, TrendingUp, TrendingDown, Star, Clock, Activity, Zap } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatPercentage, formatCurrency } from '@/utils/formatters';
import { ClassAttendanceDrillDownModal } from './ClassAttendanceDrillDownModal';
import { cn } from '@/lib/utils';

interface ClassAttendanceMetricCardsProps {
  data: SessionData[];
}

interface DrillDownData {
  type: 'total-sessions' | 'total-attendance' | 'average-attendance' | 'fill-rate' | 'class-formats' | 'revenue-per-session';
  title: string;
  value: string | number;
  sessionsData: SessionData[];
}

export const ClassAttendanceMetricCards: React.FC<ClassAttendanceMetricCardsProps> = ({ data }) => {
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Count ALL sessions - both empty and non-empty
    const totalSessions = data.length;
    const totalAttendance = data.reduce((sum, session) => sum + (session.checkedInCount || 0), 0);
    const totalCapacity = data.reduce((sum, session) => sum + (session.capacity || 0), 0);
    const totalRevenue = data.reduce((sum, session) => sum + (session.revenue || session.totalPaid || 0), 0);
    const uniqueClasses = [...new Set(data.map(session => session.cleanedClass || session.classType).filter(Boolean))].length;
    const uniqueTrainers = [...new Set(data.map(session => session.trainerName).filter(Boolean))].length;
    
    // Count empty vs non-empty sessions
    const emptySessions = data.filter(session => (session.checkedInCount || 0) === 0).length;
    const nonEmptySessions = totalSessions - emptySessions;
    
    const avgAttendance = totalSessions > 0 ? Number((totalAttendance / totalSessions).toFixed(1)) : 0;
    const fillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
    const avgRevenue = totalSessions > 0 ? Number((totalRevenue / totalSessions).toFixed(1)) : 0;

    // Find best performing class by average attendance
    const classPerformance = data.reduce((acc, session) => {
      const className = session.cleanedClass || session.classType || 'Unknown';
      if (!acc[className]) {
        acc[className] = { totalAttendance: 0, sessionCount: 0 };
      }
      acc[className].totalAttendance += session.checkedInCount || 0;
      acc[className].sessionCount += 1;
      return acc;
    }, {} as Record<string, { totalAttendance: number; sessionCount: number }>);

    const bestClass = Object.entries(classPerformance)
      .map(([name, stats]) => ({
        name,
        avgAttendance: stats.totalAttendance / stats.sessionCount
      }))
      .sort((a, b) => b.avgAttendance - a.avgAttendance)[0];

    return {
      totalSessions,
      totalAttendance,
      avgAttendance,
      fillRate,
      avgRevenue,
      totalRevenue,
      uniqueClasses,
      uniqueTrainers,
      bestClass,
      emptySessions,
      nonEmptySessions
    };
  }, [data]);

  if (!metrics) return null;

  const handleCardClick = (type: DrillDownData['type'], title: string, value: string | number) => {
    setDrillDownData({
      type,
      title,
      value,
      sessionsData: data
    });
  };

  const cards = [
    {
      title: 'Total Sessions',
      value: formatNumber(metrics.totalSessions),
      icon: Calendar,
      description: `${formatNumber(metrics.nonEmptySessions)} with attendance • ${formatNumber(metrics.emptySessions)} empty`,
      change: 12.3,
      onClick: () => handleCardClick('total-sessions', 'Total Sessions', metrics.totalSessions)
    },
    {
      title: 'Total Attendance',
      value: formatNumber(metrics.totalAttendance),
      icon: Users,
      description: 'Total participants checked-in',
      change: 8.7,
      onClick: () => handleCardClick('total-attendance', 'Total Attendance', metrics.totalAttendance)
    },
    {
      title: 'Average Attendance',
      value: `${metrics.avgAttendance}`,
      icon: Target,
      description: 'Per session average',
      change: 5.2,
      onClick: () => handleCardClick('average-attendance', 'Average Attendance', metrics.avgAttendance)
    },
    {
      title: 'Fill Rate',
      value: formatPercentage(metrics.fillRate),
      icon: TrendingUp,
      description: 'Capacity utilization rate',
      change: 3.1,
      onClick: () => handleCardClick('fill-rate', 'Fill Rate', metrics.fillRate)
    },
    {
      title: 'Class Formats',
      value: formatNumber(metrics.uniqueClasses),
      icon: Star,
      description: 'Unique class formats offered',
      change: 2.0,
      onClick: () => handleCardClick('class-formats', 'Class Formats', metrics.uniqueClasses)
    },
    {
      title: 'Revenue Per Session',
      value: formatCurrency(metrics.avgRevenue),
      icon: Zap,
      description: 'Average revenue generated',
      change: 15.4,
      onClick: () => handleCardClick('revenue-per-session', 'Revenue Per Session', metrics.avgRevenue)
    }
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          const isPositive = card.change > 0;
          const isNegative = card.change < 0;
          const cardIndex = index % 4;
          
          return (
            <Card
              key={index}
              className={cn(
                "group relative overflow-hidden cursor-pointer transition-all duration-700",
                "bg-white hover:bg-gradient-to-br hover:from-gray-900 hover:via-slate-900 hover:to-slate-900",
                cardIndex === 0 && "border-t-4 border-green-700 hover:border-green-700 shadow-lg",
                cardIndex === 1 && "border-t-4 border-blue-700 hover:border-blue-700 shadow-lg",
                cardIndex === 2 && "border-t-4 border-pink-700 hover:border-pink-700 shadow-lg",
                cardIndex === 3 && "border-t-4 border-red-700 hover:border-red-700 shadow-lg",
                "hover:shadow-2xl hover:shadow-slate-900/30",
                "hover:-translate-y-2 hover:scale-[1.02]"
              )}
              onClick={card.onClick}
            >
              <CardContent className="p-6 relative">
                <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-all duration-700">
                  <IconComponent className={cn(
                    "w-12 h-12 transition-all duration-700",
                    cardIndex === 0 && "text-green-700",
                    cardIndex === 1 && "text-blue-700",
                    cardIndex === 2 && "text-pink-700",
                    cardIndex === 3 && "text-red-700",
                    "group-hover:text-white/40"
                  )} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "p-4 rounded-2xl transition-all duration-700 border-1 shadow-md",
                        cardIndex === 0 && "bg-gradient-to-br from-green-700 to-green-600 border-green-900 text-white shadow-green-200",
                        cardIndex === 1 && "bg-gradient-to-br from-blue-700 to-blue-600 border-blue-900 text-white shadow-blue-200",
                        cardIndex === 2 && "bg-gradient-to-br from-pink-700 to-pink-600 border-pink-900 text-white shadow-pink-200",
                        cardIndex === 3 && "bg-gradient-to-br from-red-700 to-red-600 border-red-900 text-white shadow-red-200",
                        "group-hover:bg-white/20 group-hover:border-white/40 group-hover:text-white group-hover:shadow-white/20"
                      )}>
                        <IconComponent className="w-6 h-6 drop-shadow-sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-slate-900 group-hover:text-white/95 transition-colors duration-700">
                          {card.title}
                        </h3>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-700",
                      isPositive
                        ? "bg-green-50 text-green-700 group-hover:bg-green-400/30 group-hover:text-green-100"
                        : isNegative
                        ? "bg-red-50 text-red-700 group-hover:bg-red-400/30 group-hover:text-red-100"
                        : "bg-blue-50 text-blue-700 group-hover:bg-blue-400/30 group-hover:text-blue-100"
                    )}>
                      {isPositive && <TrendingUp className="w-3 h-3" />}
                      {isNegative && <TrendingDown className="w-3 h-3" />}
                      <span>
                        {card.change > 0 ? '+' : ''}{card.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className={cn(
                      "text-4xl font-bold transition-all duration-700 text-slate-900 group-hover:text-white"
                    )}>
                      {card.value}
                    </p>
                    <p className={cn(
                      "text-xs text-slate-500 group-hover:text-slate-200 transition-colors"
                    )}>
                      vs previous period
                    </p>
                  </div>
                </div>
                
                <div className={cn(
                  "mt-4 p-3 border-t border-l-4 transition-all duration-700",
                  "bg-slate-50 group-hover:bg-slate-800/50 border-t-slate-200 group-hover:border-t-white/10",
                  cardIndex === 0 && "border-l-green-700",
                  cardIndex === 1 && "border-l-blue-700",
                  cardIndex === 2 && "border-l-pink-700",
                  cardIndex === 3 && "border-l-red-700"
                )}>
                  <p className="text-xs text-slate-900 group-hover:text-white transition-colors duration-700">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Drill-down Modal */}
      {drillDownData && (
        <ClassAttendanceDrillDownModal
          isOpen={!!drillDownData}
          onClose={() => setDrillDownData(null)}
          classFormat={drillDownData.title}
          sessionsData={drillDownData.sessionsData}
          overallStats={{
            totalSessions: metrics?.totalSessions || 0,
            totalCapacity: data.reduce((sum, session) => sum + (session.capacity || 0), 0),
            totalCheckedIn: metrics?.totalAttendance || 0,
            totalRevenue: metrics?.totalRevenue || 0,
            fillRate: metrics?.fillRate || 0,
            showUpRate: 0,
            avgRevenue: metrics?.avgRevenue || 0,
            emptySessions: metrics?.emptySessions || 0
          }}
        />
      )}
    </>
  );
};