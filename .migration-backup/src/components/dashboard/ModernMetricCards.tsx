import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, Calendar, Users, Target, Activity, 
  Clock, AlertTriangle, TrendingUp, TrendingDown,
  Award, Building2, UserX, Banknote, BarChart3,
  ArrowUpRight, ArrowDownRight, MoreHorizontal
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface ModernMetricCardsProps {
  data: SessionData[];
  payrollData?: any[];
  onMetricClick?: (metricData: any) => void;
}

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  gradient: string;
  category: 'revenue' | 'attendance' | 'performance' | 'efficiency';
  drillDownData: any;
}

export const ModernMetricCards: React.FC<ModernMetricCardsProps> = ({ 
  data, 
  payrollData = [], 
  onMetricClick 
}) => {
  const metrics = useMemo((): MetricCard[] => {
    if (!data || data.length === 0) return [];

    // Basic calculations
    const totalSessions = data.length;
    const totalAttendance = data.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
    const totalCapacity = data.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const totalRevenue = data.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
    const totalBookings = data.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
    const totalCancellations = data.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);
    const totalUnpaid = data.reduce((sum, s) => sum + (s.nonPaidCount || 0) * 25, 0); // Estimate unpaid amount
    const emptySessions = data.filter(s => (s.checkedInCount || 0) === 0).length;

    // Derived metrics
    const fillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
    const classAverage = totalSessions > 0 ? totalAttendance / totalSessions : 0;
    const cancellationRate = totalBookings > 0 ? (totalCancellations / totalBookings) * 100 : 0;
    const emptyClassRate = totalSessions > 0 ? (emptySessions / totalSessions) * 100 : 0;
    const bookingRate = totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0;
    const unpaidRate = (totalRevenue + totalUnpaid) > 0 ? (totalUnpaid / (totalRevenue + totalUnpaid)) * 100 : 0;

    // Top performers analysis
    const classPerformance = data.reduce((acc, session) => {
      const className = session.cleanedClass || 'Unknown';
      if (!acc[className]) {
        acc[className] = { attendance: 0, capacity: 0, sessions: 0, revenue: 0 };
      }
      acc[className].attendance += session.checkedInCount || 0;
      acc[className].capacity += session.capacity || 0;
      acc[className].sessions += 1;
      acc[className].revenue += session.totalPaid || 0;
      return acc;
    }, {} as Record<string, any>);

    const topClass = Object.entries(classPerformance)
      .map(([name, stats]) => ({
        name,
        fillRate: stats.capacity > 0 ? (stats.attendance / stats.capacity) * 100 : 0,
        ...stats
      }))
      .sort((a, b) => b.fillRate - a.fillRate)[0];

    const trainerPerformance = data.reduce((acc, session) => {
      const trainerName = session.trainerName || 'Unknown';
      if (!acc[trainerName]) {
        acc[trainerName] = { attendance: 0, capacity: 0, sessions: 0, revenue: 0 };
      }
      acc[trainerName].attendance += session.checkedInCount || 0;
      acc[trainerName].capacity += session.capacity || 0;
      acc[trainerName].sessions += 1;
      acc[trainerName].revenue += session.totalPaid || 0;
      return acc;
    }, {} as Record<string, any>);

    const topTrainer = Object.entries(trainerPerformance)
      .map(([name, stats]) => ({
        name,
        fillRate: stats.capacity > 0 ? (stats.attendance / stats.capacity) * 100 : 0,
        ...stats
      }))
      .sort((a, b) => b.fillRate - a.fillRate)[0];

    // Mock previous period data for trend calculation
    const previousRevenue = totalRevenue * 0.85;
    const previousSessions = totalSessions * 0.92;
    const previousAttendance = totalAttendance * 0.88;
    const previousFillRate = fillRate * 0.95;

    return [
      {
        id: 'earned-revenue',
        title: 'Earned Revenue',
        value: formatCurrency(totalRevenue),
        subtitle: `From ${formatNumber(totalSessions)} sessions`,
        change: ((totalRevenue - previousRevenue) / previousRevenue) * 100,
        trend: totalRevenue > previousRevenue ? 'up' : 'down',
        icon: DollarSign,
        gradient: 'from-green-500 to-emerald-600',
        category: 'revenue',
        drillDownData: {
          title: 'Earned Revenue Analysis',
          totalRevenue,
          sessions: data,
          breakdown: {
            totalSessions,
            avgRevenuePerSession: totalRevenue / totalSessions,
            avgRevenuePerAttendee: totalAttendance > 0 ? totalRevenue / totalAttendance : 0,
            unpaidAmount: totalUnpaid,
            unpaidRate
          }
        }
      },
      {
        id: 'total-sessions',
        title: 'Total Sessions',
        value: formatNumber(totalSessions),
        subtitle: `${formatNumber(data.length)} classes conducted`,
        change: ((totalSessions - previousSessions) / previousSessions) * 100,
        trend: totalSessions > previousSessions ? 'up' : 'down',
        icon: Calendar,
        gradient: 'from-blue-500 to-cyan-600',
        category: 'attendance',
        drillDownData: {
          title: 'Session Analysis',
          totalSessions,
          sessions: data,
          breakdown: {
            uniqueClasses: [...new Set(data.map(s => s.cleanedClass))].length,
            uniqueTrainers: [...new Set(data.map(s => s.trainerName))].length,
            uniqueLocations: [...new Set(data.map(s => s.location))].length,
            avgSessionsPerDay: totalSessions / 30 // Assuming 30-day period
          }
        }
      },
      {
        id: 'total-attendance',
        title: 'Total Attendance',
        value: formatNumber(totalAttendance),
        subtitle: `Avg ${formatNumber(classAverage)} per class`,
        change: ((totalAttendance - previousAttendance) / previousAttendance) * 100,
        trend: totalAttendance > previousAttendance ? 'up' : 'down',
        icon: Users,
        gradient: 'from-purple-500 to-violet-600',
        category: 'attendance',
        drillDownData: {
          title: 'Attendance Analysis',
          totalAttendance,
          sessions: data,
          breakdown: {
            classAverage,
            totalCapacity,
            fillRate,
            peakAttendance: Math.max(...data.map(s => s.checkedInCount || 0)),
            lowestAttendance: Math.min(...data.map(s => s.checkedInCount || 0))
          }
        }
      },
      {
        id: 'fill-rate',
        title: 'Fill Rate',
        value: formatPercentage(fillRate),
        subtitle: `${formatPercentage(previousFillRate)} last period`,
        change: ((fillRate - previousFillRate) / previousFillRate) * 100,
        trend: fillRate > previousFillRate ? 'up' : 'down',
        icon: Target,
        gradient: 'from-orange-500 to-red-600',
        category: 'efficiency',
        drillDownData: {
          title: 'Fill Rate Analysis',
          fillRate,
          sessions: data,
          breakdown: {
            totalCapacity,
            totalAttendance,
            utilizationRate: fillRate,
            bookingRate,
            showUpRate: totalBookings > 0 ? (totalAttendance / totalBookings) * 100 : 0
          }
        }
      },
      {
        id: 'class-average',
        title: 'Class Average',
        value: formatNumber(classAverage),
        subtitle: `Across ${formatNumber(totalSessions)} sessions`,
        change: 5.2, // Mock change
        trend: 'up',
        icon: Activity,
        gradient: 'from-indigo-500 to-blue-600',
        category: 'performance',
        drillDownData: {
          title: 'Class Average Analysis',
          classAverage,
          sessions: data,
          breakdown: {
            totalAttendance,
            totalSessions,
            medianAttendance: data.map(s => s.checkedInCount || 0).sort()[Math.floor(data.length / 2)],
            consistency: 85 // Mock consistency score
          }
        }
      },
      {
        id: 'empty-sessions',
        title: 'Empty Sessions',
        value: formatNumber(emptySessions),
        subtitle: `${formatPercentage(emptyClassRate)} of all sessions`,
        change: -12.5, // Mock improvement
        trend: 'down', // Good trend for empty sessions
        icon: AlertTriangle,
        gradient: 'from-yellow-500 to-orange-600',
        category: 'efficiency',
        drillDownData: {
          title: 'Empty Sessions Analysis',
          emptySessions,
          sessions: data.filter(s => (s.checkedInCount || 0) === 0),
          breakdown: {
            emptyClassRate,
            totalSessions,
            impactOnRevenue: emptySessions * (totalRevenue / totalSessions), // Estimated lost revenue
            patterns: {} // Could analyze time patterns
          }
        }
      },
      {
        id: 'top-class-format',
        title: 'Top Class Format',
        value: topClass?.name || 'N/A',
        subtitle: `${formatPercentage(topClass?.fillRate || 0)} fill rate`,
        change: 8.3, // Mock change
        trend: 'up',
        icon: Award,
        gradient: 'from-pink-500 to-rose-600',
        category: 'performance',
        drillDownData: {
          title: 'Top Class Format Analysis',
          topClass,
          sessions: data.filter(s => s.cleanedClass === topClass?.name),
          breakdown: {
            fillRate: topClass?.fillRate || 0,
            totalSessions: topClass?.sessions || 0,
            totalAttendance: topClass?.attendance || 0,
            revenue: topClass?.revenue || 0
          }
        }
      },
      {
        id: 'top-teacher',
        title: 'Top Teacher',
        value: topTrainer?.name || 'N/A',
        subtitle: `${formatPercentage(topTrainer?.fillRate || 0)} fill rate`,
        change: 6.7, // Mock change
        trend: 'up',
        icon: UserX,
        gradient: 'from-teal-500 to-cyan-600',
        category: 'performance',
        drillDownData: {
          title: 'Top Teacher Analysis',
          topTrainer,
          sessions: data.filter(s => s.trainerName === topTrainer?.name),
          breakdown: {
            fillRate: topTrainer?.fillRate || 0,
            totalSessions: topTrainer?.sessions || 0,
            totalAttendance: topTrainer?.attendance || 0,
            revenue: topTrainer?.revenue || 0
          }
        }
      },
      {
        id: 'unpaid-amount',
        title: 'Unpaid Amount',
        value: formatCurrency(totalUnpaid),
        subtitle: `${formatPercentage(unpaidRate)} of total owed`,
        change: -8.2, // Mock improvement
        trend: 'down', // Good trend for unpaid
        icon: Banknote,
        gradient: 'from-red-500 to-pink-600',
        category: 'revenue',
        drillDownData: {
          title: 'Unpaid Amount Analysis',
          totalUnpaid,
          sessions: data.filter(s => (s.nonPaidCount || 0) > 0),
          breakdown: {
            unpaidRate,
            totalOwed: totalRevenue + totalUnpaid,
            impactOnCashFlow: totalUnpaid,
            avgUnpaidPerSession: data.length > 0 ? totalUnpaid / data.length : 0
          }
        }
      },
      {
        id: 'cancellations',
        title: 'Cancellations',
        value: formatNumber(totalCancellations),
        subtitle: `${formatPercentage(cancellationRate)} cancellation rate`,
        change: -5.1, // Mock improvement
        trend: 'down', // Good trend for cancellations
        icon: Clock,
        gradient: 'from-amber-500 to-yellow-600',
        category: 'efficiency',
        drillDownData: {
          title: 'Cancellation Analysis',
          totalCancellations,
          sessions: data,
          breakdown: {
            cancellationRate,
            totalBookings,
            lostRevenue: totalCancellations * (totalRevenue / totalAttendance), // Estimated
            impactOnFillRate: (totalCancellations / totalCapacity) * 100
          }
        }
      },
      {
        id: 'total-capacity',
        title: 'Total Capacity',
        value: formatNumber(totalCapacity),
        subtitle: `${formatPercentage(fillRate)} utilized`,
        change: 3.4, // Mock change
        trend: 'up',
        icon: Building2,
        gradient: 'from-slate-500 to-gray-600',
        category: 'efficiency',
        drillDownData: {
          title: 'Capacity Analysis',
          totalCapacity,
          sessions: data,
          breakdown: {
            utilizationRate: fillRate,
            totalAttendance,
            unutilizedCapacity: totalCapacity - totalAttendance,
            avgCapacityPerSession: totalCapacity / totalSessions
          }
        }
      },
      {
        id: 'booking-rate',
        title: 'Booking Rate',
        value: formatPercentage(bookingRate),
        subtitle: `${formatNumber(totalBookings)} total bookings`,
        change: 7.8, // Mock change
        trend: 'up',
        icon: BarChart3,
        gradient: 'from-emerald-500 to-teal-600',
        category: 'performance',
        drillDownData: {
          title: 'Booking Rate Analysis',
          bookingRate,
          sessions: data,
          breakdown: {
            totalBookings,
            totalCapacity,
            showUpRate: totalBookings > 0 ? (totalAttendance / totalBookings) * 100 : 0,
            cancellationRate
          }
        }
      }
    ];
  }, [data]);

  const handleMetricClick = useCallback((metric: MetricCard) => {
    if (onMetricClick) {
      onMetricClick(metric.drillDownData);
    }
  }, [onMetricClick]);

  if (!metrics || metrics.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(12)].map((_, index) => (
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
        const IconComponent = metric.icon;
        const isPositive = metric.change && metric.change > 0;
        const isNegative = metric.change && metric.change < 0;

        return (
          <Card
            key={metric.id}
            className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-700",
              "bg-white hover:bg-gradient-to-br hover:from-gray-900 hover:via-slate-900 hover:to-slate-900",
              index % 4 === 0 && "border-t-4 border-green-700 hover:border-green-700 shadow-lg",
              index % 4 === 1 && "border-t-4 border-blue-700 hover:border-blue-700 shadow-lg",
              index % 4 === 2 && "border-t-4 border-pink-700 hover:border-pink-700 shadow-lg",
              index % 4 === 3 && "border-t-4 border-red-700 hover:border-red-700 shadow-lg",
              "hover:shadow-2xl hover:shadow-slate-900/30",
              "hover:-translate-y-2 hover:scale-[1.02]"
            )}
            onClick={() => handleMetricClick(metric)}
          >
            <CardContent className="p-6 relative">
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-all duration-700">
                <IconComponent className={cn(
                  "w-12 h-12 transition-all duration-700",
                  index % 4 === 0 && "text-green-700",
                  index % 4 === 1 && "text-blue-700",
                  index % 4 === 2 && "text-pink-700",
                  index % 4 === 3 && "text-red-700",
                  "group-hover:text-white/40"
                )} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "p-4 rounded-2xl transition-all duration-700 border-1 shadow-md",
                      index % 4 === 0 && "bg-gradient-to-br from-green-700 to-green-600 border-green-900 text-white shadow-green-200",
                      index % 4 === 1 && "bg-gradient-to-br from-blue-700 to-blue-600 border-blue-900 text-white shadow-blue-200",
                      index % 4 === 2 && "bg-gradient-to-br from-pink-700 to-pink-600 border-pink-900 text-white shadow-pink-200",
                      index % 4 === 3 && "bg-gradient-to-br from-red-700 to-red-600 border-red-900 text-white shadow-red-200",
                      "group-hover:bg-white/20 group-hover:border-white/40 group-hover:text-white group-hover:shadow-white/20"
                    )}>
                      <IconComponent className="w-6 h-6 drop-shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-slate-900 group-hover:text-white/95 transition-colors duration-700">
                        {metric.title}
                      </h3>
                    </div>
                  </div>
                  
                  {metric.change !== undefined && (
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
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className={cn(
                    "text-4xl font-bold transition-all duration-700 text-slate-900 group-hover:text-white"
                  )}>
                    {metric.value}
                  </p>
                  
                  {metric.subtitle && (
                    <p className="text-sm text-slate-500 group-hover:text-white/80 transition-colors duration-700">
                      {metric.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};