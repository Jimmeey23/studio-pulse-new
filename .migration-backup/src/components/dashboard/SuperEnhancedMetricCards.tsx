import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Calendar, Target, BarChart3, Clock, DollarSign, ArrowUpRight, ArrowDownRight, Activity, UserCheck, Percent, Building2 } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

interface SuperEnhancedMetricCardsProps {
  data: SessionData[];
  payrollData: any[];
  onMetricClick?: (metricData: any) => void;
}

const iconMap = {
  DollarSign,
  Users,
  Activity,
  BarChart3,
  Target,
  Calendar,
  Clock,
  UserCheck
};

export const SuperEnhancedMetricCards: React.FC<SuperEnhancedMetricCardsProps> = ({ 
  data, 
  payrollData, 
  onMetricClick 
}) => {
  const metrics = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const totalSessions = data.length;
    const totalAttendance = data.reduce((sum, session) => sum + (session.checkedInCount || 0), 0);
    const totalCapacity = data.reduce((sum, session) => sum + (session.capacity || 0), 0);
    const totalRevenue = data.reduce((sum, session) => sum + (session.totalPaid || 0), 0);
    const totalBooked = data.reduce((sum, session) => sum + (session.bookedCount || 0), 0);
    const totalLateCancelled = data.reduce((sum, session) => sum + (session.lateCancelledCount || 0), 0);
    
    const fillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
    const avgClassSize = totalSessions > 0 ? totalAttendance / totalSessions : 0;
    const cancelRate = totalBooked > 0 ? (totalLateCancelled / totalBooked) * 100 : 0;
    const bookingRate = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;
    
    // Calculate comparison data (using mock previous period for now)
    const previousRevenue = totalRevenue * 0.85; // Mock 15% growth
    const previousSessions = totalSessions * 0.92; // Mock 8% growth
    const previousAttendance = totalAttendance * 0.88; // Mock 12% growth
    const previousFillRate = fillRate * 0.95; // Mock 5% improvement
    
    return [
      {
        title: 'Total Revenue',
        value: formatCurrency(totalRevenue),
        previousValue: formatCurrency(previousRevenue),
        change: ((totalRevenue - previousRevenue) / previousRevenue) * 100,
        yoyChange: undefined,
        yoyPreviousValue: undefined,
        comparison: { difference: totalRevenue - previousRevenue },
        description: 'Total revenue generated from all class sessions',
        icon: 'DollarSign',
        color: 'blue',
        changeDetails: { isSignificant: true, trend: 'strong' }
      },
      {
        title: 'Total Sessions',
        value: formatNumber(totalSessions),
        previousValue: formatNumber(previousSessions),
        change: ((totalSessions - previousSessions) / previousSessions) * 100,
        yoyChange: undefined,
        yoyPreviousValue: undefined,
        comparison: { difference: totalSessions - previousSessions },
        description: 'Total number of class sessions conducted',
        icon: 'Calendar',
        color: 'green',
        changeDetails: { isSignificant: true, trend: 'moderate' }
      },
      {
        title: 'Total Attendance',
        value: formatNumber(totalAttendance),
        previousValue: formatNumber(previousAttendance),
        change: ((totalAttendance - previousAttendance) / previousAttendance) * 100,
        yoyChange: undefined,
        yoyPreviousValue: undefined,
        comparison: { difference: totalAttendance - previousAttendance },
        description: 'Total number of attendees across all sessions',
        icon: 'Users',
        color: 'purple',
        changeDetails: { isSignificant: true, trend: 'strong' }
      },
      {
        title: 'Fill Rate',
        value: formatPercentage(fillRate),
        previousValue: formatPercentage(previousFillRate),
        change: ((fillRate - previousFillRate) / previousFillRate) * 100,
        yoyChange: undefined,
        yoyPreviousValue: undefined,
        comparison: { difference: fillRate - previousFillRate },
        description: 'Percentage of capacity filled across all sessions',
        icon: 'Target',
        color: 'orange',
        changeDetails: { isSignificant: true, trend: 'moderate' }
      },
      {
        title: 'Avg Class Size',
        value: formatNumber(avgClassSize),
        previousValue: formatNumber(avgClassSize * 0.92),
        change: 8.7,
        yoyChange: undefined,
        yoyPreviousValue: undefined,
        comparison: { difference: avgClassSize * 0.08 },
        description: 'Average number of attendees per class session',
        icon: 'Activity',
        color: 'cyan',
        changeDetails: { isSignificant: true, trend: 'moderate' }
      },
      {
        title: 'Booking Rate',
        value: formatPercentage(bookingRate),
        previousValue: formatPercentage(bookingRate * 0.88),
        change: 13.6,
        yoyChange: undefined,
        yoyPreviousValue: undefined,
        comparison: { difference: bookingRate * 0.12 },
        description: 'Percentage of capacity that was booked',
        icon: 'UserCheck',
        color: 'pink',
        changeDetails: { isSignificant: true, trend: 'strong' }
      },
      {
        title: 'Late Cancel Rate',
        value: formatPercentage(cancelRate),
        previousValue: formatPercentage(cancelRate * 1.15),
        change: -13.0,
        yoyChange: undefined,
        yoyPreviousValue: undefined,
        comparison: { difference: -(cancelRate * 0.15) },
        description: 'Percentage of bookings that were cancelled late',
        icon: 'Clock',
        color: 'red',
        changeDetails: { isSignificant: true, trend: 'strong' }
      },
      {
        title: 'Total Capacity',
        value: formatNumber(totalCapacity),
        previousValue: formatNumber(totalCapacity * 0.95),
        change: 5.3,
        yoyChange: undefined,
        yoyPreviousValue: undefined,
        comparison: { difference: totalCapacity * 0.05 },
        description: 'Total capacity available across all sessions',
        icon: 'Building2',
        color: 'amber',
        changeDetails: { isSignificant: false, trend: 'moderate' }
      }
    ];
  }, [data, payrollData]);

  const handleMetricClick = (metric: any) => {
    if (onMetricClick) {
      // Calculate fresh metrics from current data for dynamic drill-down
      const dynamicRevenue = data.reduce((sum, item) => sum + (item.totalPaid || 0), 0);
      const dynamicSessions = data.length;
      const dynamicAttendance = data.reduce((sum, item) => sum + (item.checkedInCount || 0), 0);
      
      const drillDownData = {
        title: metric.title,
        name: metric.title,
        type: 'metric',
        totalRevenue: dynamicRevenue,
        grossRevenue: dynamicRevenue,
        netRevenue: dynamicRevenue,
        totalValue: dynamicRevenue,
        totalCurrent: dynamicRevenue,
        metricValue: dynamicRevenue,
        sessions: dynamicSessions,
        totalSessions: dynamicSessions,
        attendance: dynamicAttendance,
        totalAttendance: dynamicAttendance,
        totalChange: metric.change,
        rawData: data,
        filteredSessionData: data,
        months: {},
        monthlyValues: {},
        isDynamic: true,
        calculatedFromFiltered: true
      };
      
      logger.debug(`Metric ${metric.title} clicked: ${dynamicSessions} sessions, ${dynamicAttendance} attendance`);
      onMetricClick(drillDownData);
    }
  };

  if (!metrics || metrics.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <Card key={index} className="bg-gray-100 animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || BarChart3;
        const isPositive = metric.change > 0;
        const isNegative = metric.change < 0;
        
        return (
          <Card 
            key={index} 
            className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-500",
              "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
              "border border-slate-200 hover:border-slate-800 border-t-4",
              "shadow-md hover:shadow-2xl hover:shadow-slate-950/60",
              "hover:-translate-y-1 hover:scale-[1.01]",
              index % 4 === 0 && "border-t-emerald-500",
              index % 4 === 1 && "border-t-blue-500",
              index % 4 === 2 && "border-t-purple-500",
              index % 4 === 3 && "border-t-rose-500",
              onMetricClick && "hover:cursor-pointer"
            )}
            onClick={() => handleMetricClick(metric)}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <CardContent className="p-6">
              {/* Background icon - top right */}
              <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
                <IconComponent className="w-20 h-20 text-slate-900 group-hover:text-white" />
              </div>
              
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-500" 
                   style={{backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px'}} />
              
              {/* Main Content */}
              <div className="relative z-10 space-y-2.5">
                {/* Header Section - Icon and Title */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "p-2.5 rounded-xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md",
                      index % 4 === 0 && "bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 text-emerald-700 group-hover:from-emerald-500/25 group-hover:to-emerald-600/20 group-hover:text-emerald-400 group-hover:shadow-emerald-500/20",
                      index % 4 === 1 && "bg-gradient-to-br from-blue-500/15 to-blue-600/10 text-blue-700 group-hover:from-blue-500/25 group-hover:to-blue-600/20 group-hover:text-blue-400 group-hover:shadow-blue-500/20",
                      index % 4 === 2 && "bg-gradient-to-br from-purple-500/15 to-purple-600/10 text-purple-700 group-hover:from-purple-500/25 group-hover:to-purple-600/20 group-hover:text-purple-400 group-hover:shadow-purple-500/20",
                      index % 4 === 3 && "bg-gradient-to-br from-rose-500/15 to-rose-600/10 text-rose-700 group-hover:from-rose-500/25 group-hover:to-rose-600/20 group-hover:text-rose-400 group-hover:shadow-rose-500/20"
                    )}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={cn(
                        "font-bold text-sm text-slate-700 transition-all duration-500 leading-tight",
                        "group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2",
                        index % 4 === 0 && "group-hover:decoration-emerald-400",
                        index % 4 === 1 && "group-hover:decoration-blue-400",
                        index % 4 === 2 && "group-hover:decoration-purple-400",
                        index % 4 === 3 && "group-hover:decoration-rose-400"
                      )}>
                        {metric.title}
                      </h3>
                      <p className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors duration-500 mt-0.5">
                        {metric.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Value */}
                <div className="pt-2">
                  <div className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500">
                    {metric.value}
                  </div>
                </div>

                {/* Comparison Cards - Month over Month & YoY */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {/* MoM Card */}
                  <div className={cn(
                    "p-2.5 rounded-lg border transition-all duration-500 bg-white group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50"
                  )}>
                    <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                      Month over Month
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                        {metric.previousValue}
                      </span>
                      <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">prev</span>
                    </div>
                    <div className={cn(
                      "inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] tabular-nums transition-all duration-500 min-w-[65px]",
                      isPositive && "bg-emerald-900/90 text-white group-hover:bg-emerald-800 group-hover:shadow-lg group-hover:shadow-emerald-900/40",
                      isNegative && "bg-rose-900/90 text-white group-hover:bg-rose-800 group-hover:shadow-lg group-hover:shadow-rose-900/40",
                      !isPositive && !isNegative && "bg-slate-700/90 text-white group-hover:bg-slate-600 group-hover:shadow-lg"
                    )}>
                      {isPositive && <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />}
                      {isNegative && <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />}
                      {!isPositive && !isNegative && <Activity className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span>{isPositive ? '+' : ''}{Math.round(metric.change)}%</span>
                    </div>
                  </div>

                  {/* Description - now showing as hover content */}
                  <div className={cn(
                    "p-2.5 rounded-lg border transition-all duration-500 bg-slate-50 group-hover:bg-slate-800/10 border-slate-200 group-hover:border-slate-700/30"
                  )}>
                    <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                      Additional Info
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-slate-700 group-hover:text-white transition-colors duration-500">
                        {metric.changeDetails?.trend || 'normal'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};