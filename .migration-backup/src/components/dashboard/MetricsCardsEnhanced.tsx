import { useState, useMemo } from 'react';
import { SessionData } from '@/types';
import { formatCurrency, formatNumber, formatPercentage, calculateMetrics } from '@/utils/calculations';
import { Calendar, Users, DollarSign, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface MetricsCardsEnhancedProps {
  sessions: SessionData[];
}

export function MetricsCardsEnhanced({ sessions }: MetricsCardsEnhancedProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Calculate overall metrics
  const metrics = useMemo(() => {
    if (sessions.length === 0) {
      return {
        totalClasses: 0,
        totalCheckIns: 0,
        fillRate: 0,
        totalRevenue: 0,
        cancellationRate: 0,
        consistencyScore: 0,
        avgClassSize: 0,
      };
    }

    const calculated = calculateMetrics(sessions);
    return {
      totalClasses: calculated.classes,
      totalCheckIns: calculated.totalCheckIns,
      fillRate: calculated.fillRate,
      totalRevenue: calculated.totalRevenue,
      cancellationRate: calculated.cancellationRate,
      consistencyScore: calculated.consistencyScore,
      avgClassSize: calculated.classAvg,
    };
  }, [sessions]);

  // Generate time series data for mini charts
  const timeSeriesData = useMemo(() => {
    if (sessions.length === 0) return [];

    const dateMap = new Map<string, { checkIns: number; revenue: number; classes: number }>();
    
    sessions.forEach((session) => {
      const dateKey = session.date;
      const existing = dateMap.get(dateKey) || { checkIns: 0, revenue: 0, classes: 0 };
      dateMap.set(dateKey, {
        checkIns: existing.checkIns + (session.checkedInCount || 0),
        revenue: existing.revenue + (session.revenue || session.totalPaid || 0),
        classes: existing.classes + 1,
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        checkIns: data.checkIns,
        revenue: data.revenue,
        classes: data.classes,
        avgClass: data.classes > 0 ? data.checkIns / data.classes : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }, [sessions]);

  const cards = [
    {
      id: 'classes',
      title: 'Total Classes',
      value: formatNumber(metrics.totalClasses),
      icon: Calendar,
      gradient: 'from-blue-600 to-blue-800',
      bgGradient: 'from-blue-50 to-blue-100',
      chartData: timeSeriesData.map(d => ({ value: d.classes })),
      chartColor: '#2563eb',
    },
    {
      id: 'checkIns',
      title: 'Check-ins',
      value: formatNumber(metrics.totalCheckIns),
      icon: Users,
      gradient: 'from-green-600 to-green-800',
      bgGradient: 'from-green-50 to-green-100',
      chartData: timeSeriesData.map(d => ({ value: d.checkIns })),
      chartColor: '#16a34a',
    },
    {
      id: 'fillRate',
      title: 'Fill Rate',
      value: formatPercentage(metrics.fillRate),
      icon: Target,
      gradient: 'from-purple-600 to-purple-800',
      bgGradient: 'from-purple-50 to-purple-100',
      chartData: timeSeriesData.map(d => ({ value: d.avgClass })),
      chartColor: '#9333ea',
    },
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue, true),
      icon: DollarSign,
      gradient: 'from-emerald-600 to-emerald-800',
      bgGradient: 'from-emerald-50 to-emerald-100',
      chartData: timeSeriesData.map(d => ({ value: d.revenue })),
      chartColor: '#059669',
    },
    {
      id: 'cancellations',
      title: 'Cancellation Rate',
      value: formatPercentage(metrics.cancellationRate),
      icon: AlertCircle,
      gradient: 'from-orange-600 to-orange-800',
      bgGradient: 'from-orange-50 to-orange-100',
      chartData: timeSeriesData.map(d => ({ value: d.classes })),
      chartColor: '#ea580c',
    },
    {
      id: 'consistency',
      title: 'Consistency',
      value: formatPercentage(metrics.consistencyScore),
      icon: TrendingUp,
      gradient: 'from-cyan-600 to-cyan-800',
      bgGradient: 'from-cyan-50 to-cyan-100',
      chartData: timeSeriesData.map(d => ({ value: d.avgClass })),
      chartColor: '#0891b2',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isHovered = hoveredCard === card.id;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
            className="relative glass-card rounded-2xl p-5 sm:p-4 cursor-pointer overflow-hidden group hover:shadow-2xl transition-all duration-300 min-h-[120px] sm:min-h-[140px]"
            whileHover={{ y: -6, scale: 1.03 }}
          >
            {/* Gradient Top Border */}
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${card.gradient}`} />

            {/* Background Pattern */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />

            <div className="relative z-10">
              <div className="flex flex-col items-center mb-3">
                <div className={`p-3 sm:p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                  <Icon className="w-6 h-6 sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-center mb-2">
                  {card.title}
                </p>
                <p className="text-3xl sm:text-2xl font-bold text-gray-900 text-center transition-colors duration-300 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent">
                  {card.value}
                </p>
              </div>

              {/* Mini Chart */}
              {isHovered && card.chartData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 60 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <ResponsiveContainer width="100%" height={60}>
                    <AreaChart data={card.chartData}>
                      <defs>
                        <linearGradient id={`gradient-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={card.chartColor} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={card.chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={card.chartColor}
                        strokeWidth={2}
                        fill={`url(#gradient-${card.id})`}
                        isAnimationActive={true}
                        animationDuration={500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
