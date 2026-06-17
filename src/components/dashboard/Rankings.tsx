import { useState, useEffect, useMemo } from 'react';
import { SessionData, RankingMetric, CalculatedMetrics } from '@/types';
import { formatNumber, formatCurrency, formatPercentage, calculateMetrics } from '@/utils/calculations';
import { TrendingUp, TrendingDown, Award, BarChart3, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface RankingGroup {
  key: string;
  className: string;
  day: string;
  time: string;
  location: string;
  trainer?: string;
  sessions: SessionData[];
  metrics: CalculatedMetrics;
}

interface RankingsProps {
  data: SessionData[];
}

const Rankings = ({ data }: RankingsProps) => {
  const [topMetric, setTopMetric] = useState<RankingMetric>('classAvg');
  const [bottomMetric, setBottomMetric] = useState<RankingMetric>('classAvg');
  const [topCount, setTopCount] = useState(10);
  const [bottomCount, setBottomCount] = useState(10);
  const [minCheckins, setMinCheckins] = useState(0);
  const [minClasses, setMinClasses] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeTrainer, setIncludeTrainer] = useState(false);
  const [excludeHostedClasses, setExcludeHostedClasses] = useState(true);
  
  const [rankedGroups, setRankedGroups] = useState<RankingGroup[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Group sessions by composite key
  useEffect(() => {
    if (data.length === 0) {
      setRankedGroups([]);
      return;
    }

    setIsCalculating(true);

    const timer = setTimeout(() => {
      // Filter hosted classes if enabled
      const filteredData = excludeHostedClasses
        ? data.filter(s => {
            const className = (s.sessionName || s.cleanedClass || s.classType || '').toLowerCase();
            const hostedPattern = /hosted|bridal|lrs|x p57|rugby|wework|olympics|birthday|host|raheja|pop|workshop|community|physique|soundrise|outdoor|p57 x|x/i;
            return !hostedPattern.test(className);
          })
        : data;

      const groups = new Map<string, SessionData[]>();

      filteredData.forEach((session) => {
        const key = [
          session.sessionName || session.cleanedClass || '',
          session.dayOfWeek || session.day || '',
          session.time || '',
          session.location || '',
          includeTrainer ? (session.trainerName || session.instructor || '') : undefined,
        ].filter(Boolean).join('|');

        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(session);
      });

      const rankingGroups: RankingGroup[] = [];
      groups.forEach((sessionGroup, key) => {
        // Manual metrics calculation
        const totalCheckIns = sessionGroup.reduce((sum, s) => sum + (s.checkedInCount || s.checkins || 0), 0);
        const totalCapacity = sessionGroup.reduce((sum, s) => sum + (s.capacity || 0), 0);
        const totalRevenue = sessionGroup.reduce((sum, s) => sum + (s.totalPaid || s.revenue || 0), 0);
        const totalBooked = sessionGroup.reduce((sum, s) => sum + (s.bookedCount || s.bookings || 0), 0);
        const totalCancellations = sessionGroup.reduce((sum, s) => sum + (s.lateCancelledCount || s.lateCancelled || 0), 0);
        const totalWaitlisted = sessionGroup.reduce((sum, s) => sum + (s.waitlistedCount || s.waitlisted || 0), 0);
        
        const classAvg = sessionGroup.length > 0 ? totalCheckIns / sessionGroup.length : 0;
        const fillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
        const cancellationRate = totalBooked > 0 ? (totalCancellations / totalBooked) * 100 : 0;
        const waitlistRate = totalCapacity > 0 ? (totalWaitlisted / totalCapacity) * 100 : 0;
        const revPerCheckin = totalCheckIns > 0 ? totalRevenue / totalCheckIns : 0;
        const revPerBooking = totalBooked > 0 ? totalRevenue / totalBooked : 0;
        const revLostPerCancellation = totalCancellations > 0 ? revPerBooking * totalCancellations : 0;
        
        // Consistency calculation
        const avg = classAvg;
        const variance = sessionGroup.reduce((sum, s) => {
          const diff = (s.checkedInCount || s.checkins || 0) - avg;
          return sum + diff * diff;
        }, 0) / sessionGroup.length;
        const stdDev = Math.sqrt(variance);
        const consistencyScore = avg > 0 ? Math.max(0, 100 - (stdDev / avg) * 100) : 0;
        
        const compositeScore = (
          fillRate * 0.3 +
          classAvg * 0.25 +
          consistencyScore * 0.25 +
          (totalRevenue / sessionGroup.length / 100) * 0.2
        );
        
        const metrics: CalculatedMetrics = {
          classes: sessionGroup.length,
          emptyClasses: sessionGroup.filter(s => (s.checkedInCount || s.checkins || 0) === 0).length,
          nonEmptyClasses: sessionGroup.length - sessionGroup.filter(s => (s.checkedInCount || s.checkins || 0) === 0).length,
          fillRate,
          cancellationRate,
          waitlistRate,
          rank: 0,
          classAvg,
          classAvgNonEmpty: classAvg,
          revPerBooking,
          revPerCheckin,
          revLostPerCancellation,
          weightedAverage: fillRate,
          consistencyScore,
          totalRevenue,
          totalCheckIns,
          totalBookings: totalBooked,
          totalCancellations,
          totalCapacity,
          totalBooked,
          totalWaitlisted,
          status: 'Active',
          compositeScore
        };
        
        if (totalCheckIns < minCheckins || sessionGroup.length < minClasses) {
          return;
        }

        const parts = key.split('|');
        rankingGroups.push({
          key,
          className: parts[0] || 'Unknown',
          day: parts[1] || 'Unknown',
          time: parts[2] || 'Unknown',
          location: parts[3] || 'Unknown',
          trainer: includeTrainer ? parts[4] : undefined,
          sessions: sessionGroup,
          metrics,
        });
      });

      setRankedGroups(rankingGroups);
      setIsCalculating(false);
    }, 10);

    return () => clearTimeout(timer);
  }, [data, includeTrainer, minCheckins, minClasses, excludeHostedClasses]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return rankedGroups;
    const query = searchQuery.toLowerCase();
    return rankedGroups.filter(g => 
      g.className.toLowerCase().includes(query) ||
      g.location.toLowerCase().includes(query) ||
      g.trainer?.toLowerCase().includes(query)
    );
  }, [rankedGroups, searchQuery]);

  const getMetricLabel = (metric: RankingMetric): string => {
    const labels: Record<RankingMetric, string> = {
      classAvg: 'Class Avg',
      fillRate: 'Fill Rate',
      totalRevenue: 'Revenue',
      consistencyScore: 'Consistency',
      totalCancellations: 'Late Cancellations',
      totalBooked: 'Total Booked',
      classes: 'Classes',
      compositeScore: 'Composite Score',
      revPerCheckin: 'Rev / Check-in',
      revPerBooking: 'Rev / Booking',
      cancellationRate: 'Cancel Rate',
      waitlistRate: 'Waitlist Rate',
      totalWaitlisted: 'Total Waitlisted',
      revLostPerCancellation: 'Rev Lost / Cancel',
    };
    return labels[metric];
  };

  const formatMetricValue = (metric: RankingMetric, value: number): string => {
    switch (metric) {
      case 'classAvg':
        return formatNumber(value, 1);
      case 'fillRate':
      case 'consistencyScore':
      case 'cancellationRate':
      case 'waitlistRate':
        return formatPercentage(value);
      case 'totalRevenue':
      case 'revPerCheckin':
      case 'revPerBooking':
      case 'revLostPerCancellation':
        return formatCurrency(value, true);
      case 'totalCancellations':
      case 'totalBooked':
      case 'classes':
      case 'totalWaitlisted':
        return formatNumber(value);
      case 'compositeScore':
        return formatNumber(value, 1);
      default:
        return formatNumber(value);
    }
  };

  const getTopPerformers = (metric: RankingMetric, count: number): RankingGroup[] => {
    return [...filteredGroups]
      .sort((a, b) => b.metrics[metric] - a.metrics[metric])
      .slice(0, count);
  };

  const getBottomPerformers = (metric: RankingMetric, count: number): RankingGroup[] => {
    return [...filteredGroups]
      .sort((a, b) => a.metrics[metric] - b.metrics[metric])
      .slice(0, count);
  };

  const topPerformers = getTopPerformers(topMetric, topCount);
  const bottomPerformers = getBottomPerformers(bottomMetric, bottomCount);

  const metricOptions: RankingMetric[] = [
    'classAvg',
    'fillRate',
    'totalRevenue',
    'consistencyScore',
    'compositeScore',
    'revPerCheckin',
    'revPerBooking',
    'cancellationRate',
    'waitlistRate',
    'totalWaitlisted',
    'revLostPerCancellation',
  ];

  return (
    <div className="space-y-6 relative">
      {isCalculating && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-start justify-center pt-20 backdrop-blur-sm rounded-2xl">
          <div className="bg-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 border border-blue-100">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <span className="font-medium text-blue-700">Updating rankings...</span>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          {/* Exclude Hosted Classes */}
          <label className="flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white shadow-sm cursor-pointer hover:border-blue-400 transition-all">
            <input
              type="checkbox"
              checked={excludeHostedClasses}
              onChange={(e) => setExcludeHostedClasses(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-semibold text-gray-800">
              Exclude Hosted Classes
            </span>
          </label>

          {/* Min Checkins */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Min Check-ins:
            </label>
            <input
              type="number"
              min="0"
              value={minCheckins}
              onChange={(e) => setMinCheckins(parseInt(e.target.value) || 0)}
              className="w-24 px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-semibold"
            />
          </div>

          {/* Min Classes */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Min Classes:
            </label>
            <input
              type="number"
              min="0"
              value={minClasses}
              onChange={(e) => setMinClasses(parseInt(e.target.value) || 0)}
              className="w-24 px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-semibold"
            />
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search classes, trainers, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
            />
          </div>

          {/* Include Trainer Toggle */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm font-semibold text-gray-700">Include Trainer</span>
            <button
              onClick={() => setIncludeTrainer(!includeTrainer)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                includeTrainer ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  includeTrainer ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-green-800 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Top Performers</h3>
                <p className="text-sm text-gray-500">Best performing classes</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-4">
            <select
              value={topMetric}
              onChange={(e) => setTopMetric(e.target.value as RankingMetric)}
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none text-sm font-medium transition-all"
            >
              {metricOptions.map((metric) => (
                <option key={metric} value={metric}>
                  {getMetricLabel(metric)}
                </option>
              ))}
            </select>
            <select
              value={topCount}
              onChange={(e) => setTopCount(parseInt(e.target.value))}
              className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none text-sm font-medium transition-all"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {topPerformers.map((group, index) => (
              <motion.div
                key={group.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-green-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-center min-w-[36px] h-9 rounded-lg bg-gradient-to-br from-green-600 to-green-700 text-white font-bold text-sm shadow-md">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="font-bold truncate text-sm text-gray-900">
                    {group.className}
                  </p>
                  <p className="text-xs truncate text-gray-600">
                    {group.day} • {group.time} • {group.location}
                  </p>
                  {group.trainer && (
                    <p className="text-xs truncate text-blue-600 font-medium">
                      {group.trainer}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-medium">{group.metrics.classes} classes</span>
                    <span>•</span>
                    <span>{formatNumber(group.metrics.totalCheckIns)} check-ins</span>
                    <span>•</span>
                    <span className={group.metrics.status === 'Active' ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                      {group.metrics.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-bold text-lg text-gray-900">
                      {formatMetricValue(topMetric, group.metrics[topMetric])}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Performers */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-800 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Needs Improvement</h3>
                <p className="text-sm text-gray-500">Classes requiring attention</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-4">
            <select
              value={bottomMetric}
              onChange={(e) => setBottomMetric(e.target.value as RankingMetric)}
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium transition-all"
            >
              {metricOptions.map((metric) => (
                <option key={metric} value={metric}>
                  {getMetricLabel(metric)}
                </option>
              ))}
            </select>
            <select
              value={bottomCount}
              onChange={(e) => setBottomCount(parseInt(e.target.value))}
              className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium transition-all"
            >
              <option value={5}>Bottom 5</option>
              <option value={10}>Bottom 10</option>
              <option value={20}>Bottom 20</option>
            </select>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {bottomPerformers.map((group, index) => (
              <motion.div
                key={group.key}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-red-700 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-center min-w-[32px] h-8 rounded-lg bg-gradient-to-br from-red-700 to-red-800 text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate text-sm text-gray-900">
                    {group.className}
                  </p>
                  <p className="text-xs truncate text-gray-600">
                    {group.day} • {group.time} • {group.location}
                  </p>
                  {group.trainer && (
                    <p className="text-xs truncate text-blue-600">
                      {group.trainer}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{group.metrics.classes} classes</span>
                    <span>•</span>
                    <span>{formatNumber(group.metrics.totalCheckIns)} check-ins</span>
                    <span>•</span>
                    <span>{group.metrics.emptyClasses} empty</span>
                    <span>•</span>
                    <span className={group.metrics.status === 'Active' ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                      {group.metrics.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-700" />
                  <span className="font-bold text-gray-900 text-sm">
                    {formatMetricValue(bottomMetric, group.metrics[bottomMetric])}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Rankings;
