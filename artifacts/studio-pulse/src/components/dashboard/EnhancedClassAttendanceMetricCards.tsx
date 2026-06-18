import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, Calendar, Target, DollarSign, 
  ArrowUpRight, ArrowDownRight, Minus, TrendingUp, BarChart3
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { useSessionsFilters } from '@/contexts/SessionsFiltersContext';
import { parseDate } from '@/utils/dateUtils';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface EnhancedClassAttendanceMetricCardsProps {
  data: SessionData[];
  comparisonData?: SessionData[];
}

const iconMap = {
  DollarSign,
  Users,
  Calendar,
  Target,
  BarChart3,
  TrendingUp
};

export const EnhancedClassAttendanceMetricCards: React.FC<EnhancedClassAttendanceMetricCardsProps> = ({ data, comparisonData }) => {
  const { filters } = useSessionsFilters();

  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null;

    const baseComparisonData = comparisonData && comparisonData.length > 0 ? comparisonData : data;

    const normalizeDate = (value?: string) => {
      const parsed = value ? parseDate(value) : null;
      return parsed ? new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()) : null;
    };

    const currentDates = data
      .map((session) => normalizeDate(session.date))
      .filter((value): value is Date => value instanceof Date);

    const inferredStart = currentDates.length > 0
      ? new Date(Math.min(...currentDates.map((date) => date.getTime())))
      : null;
    const inferredEnd = currentDates.length > 0
      ? new Date(Math.max(...currentDates.map((date) => date.getTime())))
      : null;

    const currentStart = filters.dateRange.start
      ? new Date(filters.dateRange.start.getFullYear(), filters.dateRange.start.getMonth(), filters.dateRange.start.getDate())
      : inferredStart;
    const currentEnd = filters.dateRange.end
      ? new Date(filters.dateRange.end.getFullYear(), filters.dateRange.end.getMonth(), filters.dateRange.end.getDate())
      : inferredEnd;

    const lastYearStart = currentStart
      ? new Date(currentStart.getFullYear() - 1, currentStart.getMonth(), currentStart.getDate())
      : null;
    const lastYearEnd = currentEnd
      ? new Date(currentEnd.getFullYear() - 1, currentEnd.getMonth(), currentEnd.getDate())
      : null;

    const matchesNonDateFilters = (session: SessionData) => {
      if (filters.trainers.length > 0 && !filters.trainers.includes(session.trainerName)) {
        return false;
      }

      if (filters.classTypes.length > 0 && !filters.classTypes.includes(session.cleanedClass)) {
        return false;
      }

      if (filters.dayOfWeek.length > 0 && !filters.dayOfWeek.includes(session.dayOfWeek)) {
        return false;
      }

      if (filters.timeSlots.length > 0 && !filters.timeSlots.includes(session.time)) {
        return false;
      }

      return true;
    };

    const currentPeriodData = data;
    const lastYearData = baseComparisonData.filter((session) => {
      if (!matchesNonDateFilters(session)) {
        return false;
      }

      const sessionDate = normalizeDate(session.date);
      if (!sessionDate) {
        return false;
      }

      if (lastYearStart && sessionDate < lastYearStart) {
        return false;
      }

      if (lastYearEnd && sessionDate > lastYearEnd) {
        return false;
      }

      return true;
    });

    const totalSessions = currentPeriodData.length;
    const totalAttendance = currentPeriodData.reduce((sum, session) => sum + (session.checkedInCount || 0), 0);
    const totalCapacity = currentPeriodData.reduce((sum, session) => sum + (session.capacity || 0), 0);
    const totalRevenue = currentPeriodData.reduce((sum, session) => sum + (session.totalPaid || 0), 0);
    const totalBooked = currentPeriodData.reduce((sum, session) => sum + (session.bookedCount || 0), 0);
    const totalLateCancelled = currentPeriodData.reduce((sum, session) => sum + (session.lateCancelledCount || 0), 0);
    
    // Last year metrics
    const lastYearSessions = lastYearData.length;
    const lastYearAttendance = lastYearData.reduce((sum, session) => sum + (session.checkedInCount || 0), 0);
    const lastYearRevenue = lastYearData.reduce((sum, session) => sum + (session.totalPaid || 0), 0);
    const lastYearCapacity = lastYearData.reduce((sum, session) => sum + (session.capacity || 0), 0);
    
    const uniqueClasses = [...new Set(currentPeriodData.map(session => session.cleanedClass || session.classType).filter(Boolean))];
    const uniqueTrainers = [...new Set(currentPeriodData.map(session => session.trainerName).filter(Boolean))];
    const uniqueLocations = [...new Set(currentPeriodData.map(session => session.location).filter(Boolean))];
    
    const avgAttendance = totalSessions > 0 ? Number((totalAttendance / totalSessions).toFixed(1)) : 0;
    const fillRate = totalCapacity > 0 ? Number(((totalAttendance / totalCapacity) * 100).toFixed(1)) : 0;
    const avgRevenue = totalSessions > 0 ? Number((totalRevenue / totalSessions).toFixed(0)) : 0;
    const bookingRate = totalCapacity > 0 ? Number(((totalBooked / totalCapacity) * 100).toFixed(1)) : 0;
    const cancellationRate = totalBooked > 0 ? Number(((totalLateCancelled / totalBooked) * 100).toFixed(1)) : 0;
    const noShowRate = totalBooked > 0 ? Number((((totalBooked - totalAttendance - totalLateCancelled) / totalBooked) * 100).toFixed(1)) : 0;
    
    // Last year metrics for comparison
    const lastYearAvgAttendance = lastYearSessions > 0 ? lastYearAttendance / lastYearSessions : 0;
    const lastYearFillRate = lastYearCapacity > 0 ? (lastYearAttendance / lastYearCapacity) * 100 : 0;
    const lastYearAvgRevenue = lastYearSessions > 0 ? lastYearRevenue / lastYearSessions : 0;
    
    // Calculate YoY changes
    const calculateYoYChange = (current: number, lastYear: number) => {
      if (lastYear === 0) return current > 0 ? 100 : 0;
      return Number((((current - lastYear) / lastYear) * 100).toFixed(1));
    };
    
    const sessionsYoY = calculateYoYChange(totalSessions, lastYearSessions);
    const attendanceYoY = calculateYoYChange(totalAttendance, lastYearAttendance);
    const avgAttendanceYoY = calculateYoYChange(avgAttendance, lastYearAvgAttendance);
    const fillRateYoY = calculateYoYChange(fillRate, lastYearFillRate);
    const revenueYoY = calculateYoYChange(totalRevenue, lastYearRevenue);
    const avgRevenueYoY = calculateYoYChange(avgRevenue, lastYearAvgRevenue);

    // Peak hours analysis
    const hourlyData = currentPeriodData.reduce((acc, session) => {
      const hour = session.time?.split(':')[0] || 'Unknown';
      if (!acc[hour]) acc[hour] = { sessions: 0, attendance: 0 };
      acc[hour].sessions += 1;
      acc[hour].attendance += session.checkedInCount || 0;
      return acc;
    }, {} as Record<string, { sessions: number; attendance: number }>);

    const peakHour = Object.entries(hourlyData)
      .sort(([,a], [,b]) => b.attendance - a.attendance)[0];

    // Day of week analysis
    const dayData = currentPeriodData.reduce((acc, session) => {
      const day = session.dayOfWeek || 'Unknown';
      if (!acc[day]) acc[day] = { sessions: 0, attendance: 0 };
      acc[day].sessions += 1;
      acc[day].attendance += session.checkedInCount || 0;
      return acc;
    }, {} as Record<string, { sessions: number; attendance: number }>);

    const peakDay = Object.entries(dayData)
      .sort(([,a], [,b]) => b.attendance - a.attendance)[0];

    // Best performing class by average attendance
    const classPerformance = currentPeriodData.reduce((acc, session) => {
      const className = session.cleanedClass || session.classType || 'Unknown';
      if (!acc[className]) {
        acc[className] = { totalAttendance: 0, sessionCount: 0, revenue: 0 };
      }
      acc[className].totalAttendance += session.checkedInCount || 0;
      acc[className].sessionCount += 1;
      acc[className].revenue += session.totalPaid || 0;
      return acc;
    }, {} as Record<string, { totalAttendance: number; sessionCount: number; revenue: number }>);

    const bestClass = Object.entries(classPerformance)
      .map(([name, stats]) => ({
        name,
        avgAttendance: Number((stats.totalAttendance / stats.sessionCount).toFixed(1)),
        totalRevenue: stats.revenue
      }))
      .sort((a, b) => b.avgAttendance - a.avgAttendance)[0];

    // Trainer performance
    const trainerPerformance = currentPeriodData.reduce((acc, session) => {
      const trainer = session.trainerName || 'Unknown';
      if (!acc[trainer]) {
        acc[trainer] = { sessions: 0, attendance: 0, revenue: 0 };
      }
      acc[trainer].sessions += 1;
      acc[trainer].attendance += session.checkedInCount || 0;
      acc[trainer].revenue += session.totalPaid || 0;
      return acc;
    }, {} as Record<string, { sessions: number; attendance: number; revenue: number }>);

    const topTrainer = Object.entries(trainerPerformance)
      .map(([name, stats]) => ({
        name,
        avgAttendance: Number((stats.attendance / stats.sessions).toFixed(1)),
        totalSessions: stats.sessions
      }))
      .sort((a, b) => b.avgAttendance - a.avgAttendance)[0];

    const periodLabel = currentStart && currentEnd
      ? `${currentStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${currentEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : 'Selected Period';

    return {
      totalSessions,
      totalAttendance,
      avgAttendance,
      fillRate,
      avgRevenue,
      totalRevenue,
      bookingRate,
      cancellationRate,
      noShowRate,
      uniqueClasses: uniqueClasses.length,
      uniqueTrainers: uniqueTrainers.length,
      uniqueLocations: uniqueLocations.length,
      peakHour: peakHour ? { hour: peakHour[0], attendance: peakHour[1].attendance } : null,
      peakDay: peakDay ? { day: peakDay[0], attendance: peakDay[1].attendance } : null,
      bestClass,
      topTrainer,
      // YoY changes
      sessionsYoY,
      attendanceYoY,
      avgAttendanceYoY,
      fillRateYoY,
      revenueYoY,
      avgRevenueYoY,
      // Last year values
      lastYearSessions,
      lastYearAttendance,
      lastYearRevenue,
      lastYearAvgAttendance,
      lastYearFillRate,
      lastYearAvgRevenue,
      periodLabel
    };
  }, [comparisonData, data, filters]);

  if (!metrics) return null;

  // Define metrics to display (8 cards to match Sales layout)
  const displayMetrics = [
    {
      title: 'Total Sessions',
      value: formatNumber(metrics.totalSessions),
      previousValue: formatNumber(metrics.lastYearSessions),
      change: metrics.sessionsYoY,
      yoyChange: metrics.sessionsYoY,
      yoyPreviousValue: formatNumber(metrics.lastYearSessions),
      description: 'Total class sessions conducted in the last 30 days',
      icon: 'Calendar' as keyof typeof iconMap,
      comparison: { difference: metrics.totalSessions - metrics.lastYearSessions },
      changeDetails: { 
        trend: metrics.sessionsYoY > 5 ? 'Strong Growth' : metrics.sessionsYoY > 0 ? 'Growing' : metrics.sessionsYoY < -5 ? 'Declining' : 'Stable',
        isSignificant: Math.abs(metrics.sessionsYoY) > 5
      },
      yoyChangeDetails: {
        trend: metrics.sessionsYoY > 5 ? 'Strong YoY Growth' : metrics.sessionsYoY > 0 ? 'YoY Growth' : metrics.sessionsYoY < 0 ? 'YoY Decline' : 'YoY Stable'
      }
    },
    {
      title: 'Total Attendance',
      value: formatNumber(metrics.totalAttendance),
      previousValue: formatNumber(metrics.lastYearAttendance),
      change: metrics.attendanceYoY,
      yoyChange: metrics.attendanceYoY,
      yoyPreviousValue: formatNumber(metrics.lastYearAttendance),
      description: 'Total participants across all sessions',
      icon: 'Users' as keyof typeof iconMap,
      comparison: { difference: metrics.totalAttendance - metrics.lastYearAttendance },
      changeDetails: { 
        trend: metrics.attendanceYoY > 5 ? 'Strong Growth' : metrics.attendanceYoY > 0 ? 'Growing' : metrics.attendanceYoY < -5 ? 'Declining' : 'Stable',
        isSignificant: Math.abs(metrics.attendanceYoY) > 5
      },
      yoyChangeDetails: {
        trend: metrics.attendanceYoY > 5 ? 'Strong YoY Growth' : metrics.attendanceYoY > 0 ? 'YoY Growth' : metrics.attendanceYoY < 0 ? 'YoY Decline' : 'YoY Stable'
      }
    },
    {
      title: 'Average Attendance',
      value: metrics.avgAttendance.toString(),
      previousValue: metrics.lastYearAvgAttendance.toFixed(1),
      change: metrics.avgAttendanceYoY,
      yoyChange: metrics.avgAttendanceYoY,
      yoyPreviousValue: metrics.lastYearAvgAttendance.toFixed(1),
      description: 'Average attendees per session',
      icon: 'BarChart3' as keyof typeof iconMap,
      comparison: { difference: metrics.avgAttendance - metrics.lastYearAvgAttendance },
      changeDetails: { 
        trend: metrics.avgAttendanceYoY > 5 ? 'Strong Growth' : metrics.avgAttendanceYoY > 0 ? 'Growing' : metrics.avgAttendanceYoY < -5 ? 'Declining' : 'Stable',
        isSignificant: Math.abs(metrics.avgAttendanceYoY) > 5
      },
      yoyChangeDetails: {
        trend: metrics.avgAttendanceYoY > 5 ? 'Strong YoY Growth' : metrics.avgAttendanceYoY > 0 ? 'YoY Growth' : metrics.avgAttendanceYoY < 0 ? 'YoY Decline' : 'YoY Stable'
      }
    },
    {
      title: 'Fill Rate',
      value: `${metrics.fillRate}%`,
      previousValue: `${metrics.lastYearFillRate.toFixed(1)}%`,
      change: metrics.fillRateYoY,
      yoyChange: metrics.fillRateYoY,
      yoyPreviousValue: `${metrics.lastYearFillRate.toFixed(1)}%`,
      description: 'Capacity utilization rate',
      icon: 'Target' as keyof typeof iconMap,
      comparison: { difference: metrics.fillRate - metrics.lastYearFillRate },
      changeDetails: { 
        trend: metrics.fillRateYoY > 5 ? 'Strong Growth' : metrics.fillRateYoY > 0 ? 'Growing' : metrics.fillRateYoY < -5 ? 'Declining' : 'Stable',
        isSignificant: Math.abs(metrics.fillRateYoY) > 5
      },
      yoyChangeDetails: {
        trend: metrics.fillRateYoY > 5 ? 'Strong YoY Growth' : metrics.fillRateYoY > 0 ? 'YoY Growth' : metrics.fillRateYoY < 0 ? 'YoY Decline' : 'YoY Stable'
      }
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      previousValue: formatCurrency(metrics.lastYearRevenue),
      change: metrics.revenueYoY,
      yoyChange: metrics.revenueYoY,
      yoyPreviousValue: formatCurrency(metrics.lastYearRevenue),
      description: 'Total revenue generated',
      icon: 'DollarSign' as keyof typeof iconMap,
      comparison: { difference: metrics.totalRevenue - metrics.lastYearRevenue },
      changeDetails: { 
        trend: metrics.revenueYoY > 5 ? 'Strong Growth' : metrics.revenueYoY > 0 ? 'Growing' : metrics.revenueYoY < -5 ? 'Declining' : 'Stable',
        isSignificant: Math.abs(metrics.revenueYoY) > 5
      },
      yoyChangeDetails: {
        trend: metrics.revenueYoY > 5 ? 'Strong YoY Growth' : metrics.revenueYoY > 0 ? 'YoY Growth' : metrics.revenueYoY < 0 ? 'YoY Decline' : 'YoY Stable'
      }
    },
    {
      title: 'Avg Revenue per Session',
      value: formatCurrency(metrics.avgRevenue),
      previousValue: formatCurrency(metrics.lastYearAvgRevenue),
      change: metrics.avgRevenueYoY,
      yoyChange: metrics.avgRevenueYoY,
      yoyPreviousValue: formatCurrency(metrics.lastYearAvgRevenue),
      description: 'Average revenue per session',
      icon: 'TrendingUp' as keyof typeof iconMap,
      comparison: { difference: metrics.avgRevenue - metrics.lastYearAvgRevenue },
      changeDetails: { 
        trend: metrics.avgRevenueYoY > 5 ? 'Strong Growth' : metrics.avgRevenueYoY > 0 ? 'Growing' : metrics.avgRevenueYoY < -5 ? 'Declining' : 'Stable',
        isSignificant: Math.abs(metrics.avgRevenueYoY) > 5
      },
      yoyChangeDetails: {
        trend: metrics.avgRevenueYoY > 5 ? 'Strong YoY Growth' : metrics.avgRevenueYoY > 0 ? 'YoY Growth' : metrics.avgRevenueYoY < 0 ? 'YoY Decline' : 'YoY Stable'
      }
    },
    {
      title: 'Booking Rate',
      value: `${metrics.bookingRate}%`,
      previousValue: 'N/A',
      change: 0,
      description: 'Percentage of capacity booked',
      icon: 'Target' as keyof typeof iconMap,
      comparison: { difference: 0 },
      changeDetails: { 
        trend: 'Current Period',
        isSignificant: false
      }
    },
    {
      title: 'No-Show Rate',
      value: `${metrics.noShowRate}%`,
      previousValue: 'N/A',
      change: 0,
      description: 'Percentage of bookings not attended',
      icon: 'Users' as keyof typeof iconMap,
      comparison: { difference: 0 },
      changeDetails: { 
        trend: 'Current Period',
        isSignificant: false
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {displayMetrics.map((metric, index) => {
        const IconComponent = iconMap[metric.icon] || Calendar;
        const isPositive = metric.change > 0;
        const isNegative = metric.change < 0;

        return (
          <Card
            key={metric.title}
            className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-500",
              "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
              "border border-slate-200 hover:border-slate-800 border-t-4",
              "shadow-md hover:shadow-2xl hover:shadow-slate-950/60",
              "hover:-translate-y-1 hover:scale-[1.01]",
              index % 4 === 0 && "border-t-blue-500",
              index % 4 === 1 && "border-t-emerald-500",
              index % 4 === 2 && "border-t-purple-500",
              index % 4 === 3 && "border-t-rose-500"
            )}
          >
            <CardContent className="p-5 relative">
              {/* Decorative gradient overlay */}
              <div className={cn(
                "absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500",
                index % 4 === 0 && "bg-gradient-to-br from-blue-500 to-cyan-500",
                index % 4 === 1 && "bg-gradient-to-br from-emerald-500 to-teal-500",
                index % 4 === 2 && "bg-gradient-to-br from-purple-500 to-pink-500",
                index % 4 === 3 && "bg-gradient-to-br from-rose-500 to-orange-500"
              )} />
              
              {/* Background Icon - Enhanced */}
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
                      index % 4 === 0 && "bg-gradient-to-br from-blue-500/15 to-blue-600/10 text-blue-700 group-hover:from-blue-500/25 group-hover:to-blue-600/20 group-hover:text-blue-400 group-hover:shadow-blue-500/20",
                      index % 4 === 1 && "bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 text-emerald-700 group-hover:from-emerald-500/25 group-hover:to-emerald-600/20 group-hover:text-emerald-400 group-hover:shadow-emerald-500/20",
                      index % 4 === 2 && "bg-gradient-to-br from-purple-500/15 to-purple-600/10 text-purple-700 group-hover:from-purple-500/25 group-hover:to-purple-600/20 group-hover:text-purple-400 group-hover:shadow-purple-500/20",
                      index % 4 === 3 && "bg-gradient-to-br from-rose-500/15 to-rose-600/10 text-rose-700 group-hover:from-rose-500/25 group-hover:to-rose-600/20 group-hover:text-rose-400 group-hover:shadow-rose-500/20"
                    )}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={cn(
                        "font-bold text-sm text-slate-700 transition-all duration-500 leading-tight",
                        "group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2",
                        index % 4 === 0 && "group-hover:decoration-blue-400",
                        index % 4 === 1 && "group-hover:decoration-emerald-400",
                        index % 4 === 2 && "group-hover:decoration-purple-400",
                        index % 4 === 3 && "group-hover:decoration-rose-400"
                      )}>
                        {metric.title}
                      </h3>
                      <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-500 mt-0.5 uppercase tracking-wide font-semibold">
                        {metrics.periodLabel}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Value with Background Card */}
                <div className={cn(
                  "p-2.5 rounded-lg transition-all duration-500",
                  "bg-slate-50 group-hover:bg-slate-800/30",
                  "border border-slate-100 group-hover:border-slate-700/50"
                )}>
                  <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 tracking-tight">
                    {metric.value}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={cn(
                      "h-0.5 flex-1 rounded-full transition-all duration-500",
                      metric.change > 0 && "bg-emerald-200 group-hover:bg-emerald-500/40",
                      metric.change < 0 && "bg-rose-200 group-hover:bg-rose-500/40",
                      metric.change === 0 && "bg-slate-200 group-hover:bg-slate-500/40"
                    )} />
                    <div className="flex items-center gap-1">
                      {metric.change > 0 && <ArrowUpRight className="w-3 h-3 text-emerald-600 group-hover:text-emerald-400" />}
                      {metric.change < 0 && <ArrowDownRight className="w-3 h-3 text-rose-600 group-hover:text-rose-400" />}
                      {metric.change === 0 && <Minus className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />}
                      <span className={cn(
                        "text-[10px] font-bold transition-colors duration-500",
                        metric.change > 0 && "text-emerald-600 group-hover:text-emerald-400",
                        metric.change < 0 && "text-rose-600 group-hover:text-rose-400",
                        metric.change === 0 && "text-slate-600 group-hover:text-slate-400"
                      )}>
                        {metric.changeDetails.trend}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comparison Metrics - Enhanced Cards */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Previous Period Card */}
                  <div className={cn(
                    "p-2.5 rounded-lg border transition-all duration-500",
                    "bg-white/50 group-hover:bg-slate-800/20",
                    "border-slate-200 group-hover:border-slate-700/50"
                  )}>
                    <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                      Last Year
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                        {metric.previousValue ?? '—'}
                      </span>
                      <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">prev</span>
                    </div>
                    <div className={cn(
                      "inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] tabular-nums transition-all duration-500 min-w-[65px]",
                      metric.change > 0 && "bg-emerald-900/90 text-white group-hover:bg-emerald-800 group-hover:shadow-lg group-hover:shadow-emerald-900/40",
                      metric.change < 0 && "bg-rose-900/90 text-white group-hover:bg-rose-800 group-hover:shadow-lg group-hover:shadow-rose-900/40",
                      metric.change === 0 && "bg-slate-700/90 text-white group-hover:bg-slate-600 group-hover:shadow-lg"
                    )}>
                      {metric.change > 0 && <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />}
                      {metric.change < 0 && <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />}
                      {metric.change === 0 && <Minus className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span>{typeof metric.change === 'number' ? (metric.change > 0 ? '+' : '') + Math.round(metric.change) + '%' : 'N/A'}</span>
                    </div>
                  </div>
                  
                  {/* YoY Card */}
                  {metric.yoyPreviousValue != null ? (
                    <div className={cn(
                      "p-2.5 rounded-lg border transition-all duration-500",
                      "bg-white/50 group-hover:bg-slate-800/20",
                      "border-slate-200 group-hover:border-slate-700/50"
                    )}>
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Year over Year
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {metric.yoyPreviousValue ?? '—'}
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">prev</span>
                      </div>
                      {typeof metric.yoyChange === 'number' && (
                        <div className={cn(
                          "inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] tabular-nums transition-all duration-500 min-w-[65px]",
                          metric.yoyChange > 0 && "bg-emerald-900/90 text-white group-hover:bg-emerald-800 group-hover:shadow-lg group-hover:shadow-emerald-900/40",
                          metric.yoyChange < 0 && "bg-rose-900/90 text-white group-hover:bg-rose-800 group-hover:shadow-lg group-hover:shadow-rose-900/40",
                          metric.yoyChange === 0 && "bg-slate-700/90 text-white group-hover:bg-slate-600 group-hover:shadow-lg"
                        )}>
                          {metric.yoyChange > 0 && <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />}
                          {metric.yoyChange < 0 && <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />}
                          {metric.yoyChange === 0 && <Minus className="w-3.5 h-3.5 flex-shrink-0" />}
                          <span>{typeof metric.yoyChange === 'number' ? (metric.yoyChange > 0 ? '+' : '') + Math.round(metric.yoyChange) + '%' : 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={cn(
                      "p-2.5 rounded-lg border transition-all duration-500 flex items-center justify-center",
                      "bg-slate-50/50 group-hover:bg-slate-800/10",
                      "border-slate-200 group-hover:border-slate-700/30"
                    )}>
                      <span className="text-[9px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500 font-semibold">
                        No YoY Data
                      </span>
                    </div>
                  )}
                </div>

                {/* Description Footer with Enhanced Side Border */}
                <div className={cn(
                  "relative pt-1.5 border-l-3 pl-3 transition-all duration-500",
                  "before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:rounded-r-full before:transition-all before:duration-500",
                  index % 4 === 0 && "border-l-blue-500/50 group-hover:border-l-blue-400 before:bg-blue-500/20 group-hover:before:bg-blue-400/30",
                  index % 4 === 1 && "border-l-emerald-500/50 group-hover:border-l-emerald-400 before:bg-emerald-500/20 group-hover:before:bg-emerald-400/30",
                  index % 4 === 2 && "border-l-purple-500/50 group-hover:border-l-purple-400 before:bg-purple-500/20 group-hover:before:bg-purple-400/30",
                  index % 4 === 3 && "border-l-rose-500/50 group-hover:border-l-rose-400 before:bg-rose-500/20 group-hover:before:bg-rose-400/30"
                )}>
                  <p className="text-xs text-slate-600 group-hover:text-slate-300 leading-snug transition-colors duration-500 line-clamp-2 font-medium">
                    {metric.description}
                  </p>
                </div>

                {/* Additional Info - Hidden by default, shown on hover */}
                <div className={cn(
                  "pt-2 space-y-2 border-t transition-all duration-500 overflow-hidden",
                  "max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100",
                  index % 4 === 0 && "border-blue-200 group-hover:border-blue-500/30",
                  index % 4 === 1 && "border-emerald-200 group-hover:border-emerald-500/30",
                  index % 4 === 2 && "border-purple-200 group-hover:border-purple-500/30",
                  index % 4 === 3 && "border-rose-200 group-hover:border-rose-500/30"
                )}>
                  {/* Trend Info */}
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Trend:</span>
                      <span className="text-white font-semibold">{metric.changeDetails.trend}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Difference:</span>
                      <span className="text-white font-semibold">{formatNumber(Math.abs(metric.comparison.difference))}</span>
                    </div>
                    {metric.yoyChangeDetails && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">YoY Trend:</span>
                        <span className="text-white font-semibold">{metric.yoyChangeDetails.trend}</span>
                      </div>
                    )}
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
