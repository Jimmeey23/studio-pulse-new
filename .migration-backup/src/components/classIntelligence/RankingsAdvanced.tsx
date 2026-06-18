import React, { useState, useEffect, useMemo, memo } from 'react';
import { TrendingUp, TrendingDown, Award, BarChart3, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import EnhancedDrilldownModal2 from './EnhancedDrilldownModal2';
import type { SessionData } from './types';
import { calculateMetrics, formatNumber, formatCurrency, formatPercentage } from './utils';

type RankingMetric =
  | 'avgCheckIns'
  | 'fillRate'
  | 'totalRevenue'
  | 'consistency'
  | 'sessionCount'
  | 'revPerCheckin'
  | 'revPerBooking';

type RankingGroup = {
  key: string;
  className: string;
  day: string;
  time: string;
  location: string;
  trainer?: string;
  sessions: SessionData[];
  metrics: ReturnType<typeof calculateMetrics> & {
    revPerCheckin: number;
    revPerBooking: number;
  };
};

function generateCompositeKey(className?: string, day?: string, time?: string, location?: string, trainer?: string) {
  return [className || '', day || '', time || '', location || '', trainer || ''].join('|');
}

function parseCompositeKey(key: string) {
  const [className, day, time, location, trainer] = key.split('|');
  return { className, day, time, location, trainer };
}

type Props = { sessions: SessionData[] };

function RankingsAdvanced({ sessions }: Props) {
  const [topMetric, setTopMetric] = useState<RankingMetric>('avgCheckIns');
  const [bottomMetric, setBottomMetric] = useState<RankingMetric>('avgCheckIns');
  const [topCount, setTopCount] = useState(10);
  const [bottomCount, setBottomCount] = useState(10);
  const [excludeHostedClasses, setExcludeHostedClasses] = useState(false);
  const [minCheckins, setMinCheckins] = useState(0);
  const [minClasses, setMinClasses] = useState(0);
  const [includeTrainerInRankings, setIncludeTrainerInRankings] = useState(false);
  const [groupBy, setGroupBy] = useState<string>('class|day|time|location');
  const [searchQuery, setSearchQuery] = useState('');

  const [rankedGroups, setRankedGroups] = useState<RankingGroup[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const rawData = useMemo(() => sessions || [], [sessions]);

  const handleCardClick = (group: RankingGroup) => {
    setDrilldownData(group.sessions);
    setDrilldownTitle(`${group.className} - ${group.day} at ${group.time} (${group.location})`);
    setIsDrilldownOpen(true);
  };

  const [drilldownData, setDrilldownData] = useState<SessionData[]>([]);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);

  useEffect(() => {
    if (rawData.length === 0) {
      setRankedGroups([]);
      return;
    }
    setIsCalculating(true);
    const timer = setTimeout(() => {
      const groups = new Map<string, SessionData[]>();
      rawData.forEach((session) => {
        if (excludeHostedClasses && (session.className || '').toLowerCase().includes('hosted')) return;
        // Build key from selected grouping template
        const parts: Record<string, string | undefined> = {
          class: session.className,
          day: session.day,
          time: session.time,
          location: session.location,
          trainer: includeTrainerInRankings ? session.trainerName : undefined,
          // Extras (derived)
          week: session.startTime ? new Date(session.startTime).toISOString().slice(0, 10) : undefined,
          month: session.startTime ? new Date(session.startTime).toISOString().slice(0, 7) : undefined,
        };
        const key = groupBy.split('+').map(k => parts[k] || '').join('|');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(session);
      });

      const rankingGroups: RankingGroup[] = [];
      groups.forEach((groupSessions, key) => {
        const parsed = parseCompositeKey(key);
        const m = calculateMetrics(groupSessions);
        const totalCheckIns = m.totalCheckIns;
        const totalRevenue = m.totalRevenue;
        const totalBooked = groupSessions.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
        const revPerCheckin = totalCheckIns > 0 ? totalRevenue / totalCheckIns : 0;
        const revPerBooking = totalBooked > 0 ? totalRevenue / totalBooked : 0;

        if (m.totalCheckIns < minCheckins) return;
        if (groupSessions.length < minClasses) return;

        const labelStr = `${parsed.className} ${parsed.day ? '• ' + parsed.day : ''} ${parsed.time || ''} ${parsed.location ? '• ' + parsed.location : ''} ${parsed.trainer ? '• ' + parsed.trainer : ''}`.trim();
        if (searchQuery && !labelStr.toLowerCase().includes(searchQuery.toLowerCase())) return;

        rankingGroups.push({
          key,
          className: parsed.className,
          day: parsed.day,
          time: parsed.time,
          location: parsed.location,
          trainer: parsed.trainer,
          sessions: groupSessions,
          metrics: { ...m, revPerCheckin, revPerBooking },
        });
      });
      setRankedGroups(rankingGroups);
      setIsCalculating(false);
    }, 10);
    return () => clearTimeout(timer);
  }, [rawData, excludeHostedClasses, includeTrainerInRankings, minCheckins, minClasses, searchQuery, groupBy]);

  if (rawData.length === 0 && !isCalculating) return null;

  const getMetricLabel = (metric: RankingMetric) => {
    switch (metric) {
      case 'avgCheckIns': return 'Class Avg';
      case 'fillRate': return 'Fill Rate';
      case 'totalRevenue': return 'Revenue';
      case 'consistency': return 'Consistency';
      case 'sessionCount': return 'Classes';
      case 'revPerCheckin': return 'Rev / Check-in';
      case 'revPerBooking': return 'Rev / Booking';
    }
  };

  const formatMetricValue = (metric: RankingMetric, value: number): string => {
    switch (metric) {
      case 'avgCheckIns': return formatNumber(value, 1);
      case 'fillRate': return formatPercentage(value);
      case 'totalRevenue': return formatCurrency(value);
      case 'consistency': return formatPercentage(value);
      case 'sessionCount': return formatNumber(value);
      case 'revPerCheckin': return formatCurrency(value);
      case 'revPerBooking': return formatCurrency(value);
    }
  };

  const getTopPerformers = (metric: RankingMetric, count: number): RankingGroup[] => {
    return [...rankedGroups]
      .sort((a, b) => (b.metrics as any)[metric] - (a.metrics as any)[metric])
      .slice(0, count);
  };
  const getBottomPerformers = (metric: RankingMetric, count: number): RankingGroup[] => {
    return [...rankedGroups]
      .sort((a, b) => (a.metrics as any)[metric] - (b.metrics as any)[metric])
      .slice(0, count);
  };

  const topPerformers = getTopPerformers(topMetric, topCount);
  const bottomPerformers = getBottomPerformers(bottomMetric, bottomCount);

  const metricOptions: RankingMetric[] = [
    'avgCheckIns',
    'fillRate',
    'totalRevenue',
    'consistency',
    'sessionCount',
    'revPerCheckin',
    'revPerBooking',
  ];

  // 30+ grouping options (combinations of dimensions)
  const groupingOptions: string[] = [
    'class', 'trainer', 'location', 'day', 'time',
    'class+trainer', 'class+location', 'class+day', 'class+time',
    'trainer+location', 'trainer+day', 'trainer+time',
    'location+day', 'location+time', 'day+time',
    'class+trainer+location', 'class+trainer+day', 'class+trainer+time',
    'class+location+day', 'class+location+time', 'class+day+time',
    'trainer+location+day', 'trainer+location+time', 'trainer+day+time',
    'location+day+time',
    'class+trainer+location+day', 'class+trainer+location+time',
    'class+trainer+day+time', 'class+location+day+time',
    'trainer+location+day+time',
    // Derived time periods
    'class+month', 'trainer+month', 'location+month', 'day+month', 'time+month',
    'class+week', 'trainer+week', 'location+week'
  ];

  return (
    <>
      <div className="space-y-6 relative">
        {isCalculating && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-start justify-center pt-20 backdrop-blur-sm rounded-2xl">
            <div className="bg-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 border border-blue-100">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <span className="font-medium text-blue-700">Updating rankings...</span>
            </div>
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white shadow-sm cursor-pointer hover:border-blue-400 transition-all">
              <input type="checkbox" checked={excludeHostedClasses} onChange={(e) => setExcludeHostedClasses(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
              <span className="text-sm font-semibold text-gray-800">Exclude Hosted Classes</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Min Check-ins:</label>
              <input type="number" min="0" value={minCheckins} onChange={(e) => setMinCheckins(parseInt(e.target.value) || 0)} className="w-24 px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-semibold" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Min Classes:</label>
              <input type="number" min="0" value={minClasses} onChange={(e) => setMinClasses(parseInt(e.target.value) || 0)} className="w-24 px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-semibold" />
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-600" />
              <input type="text" placeholder="Search classes, trainers, locations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Group By:</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm font-medium transition-all max-w-[260px]">
                {groupingOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt.replaceAll('+', ' • ')}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-sm font-semibold text-gray-700">Include Trainer</span>
              <button onClick={() => setIncludeTrainerInRankings(!includeTrainerInRankings)} className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${includeTrainerInRankings ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${includeTrainerInRankings ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-3xl p-6">
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
            <div className="flex gap-3 mb-4">
              <select value={topMetric} onChange={(e) => setTopMetric(e.target.value as RankingMetric)} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none text-sm font-medium transition-all">
                {metricOptions.map((metric) => (<option key={metric} value={metric}>{getMetricLabel(metric)}</option>))}
              </select>
              <select value={topCount} onChange={(e) => setTopCount(parseInt(e.target.value))} className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none text-sm font-medium transition-all">
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
              </select>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {topPerformers.map((group, index) => (
                <motion.div key={group.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} onClick={() => handleCardClick(group)} className={`flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-green-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer active:scale-[0.98]`}>
                  <div className="flex items-center justify-center min-w-[36px] h-9 rounded-lg bg-gradient-to-br from-green-600 to-green-700 text-white font-bold text-sm shadow-md">{index + 1}</div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className={`font-bold truncate text-sm text-gray-900`}>{group.className}</p>
                    <p className={`text-xs truncate text-gray-600`}>{group.day} • {group.time} • {group.location}</p>
                    {group.trainer && (<p className={`text-xs truncate text-blue-600 font-medium`}>{group.trainer}</p>)}
                    <div className={`flex items-center gap-3 text-xs text-gray-500`}>
                      <span className="font-medium">{group.metrics.sessionCount} classes</span>
                      <span>•</span>
                      <span>{formatNumber(group.metrics.totalCheckIns)} check-ins</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`w-4 h-4 text-green-600`} />
                      <span className={`font-bold text-lg cursor-help text-gray-900`}>{formatMetricValue(topMetric, (group.metrics as any)[topMetric])}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-3xl p-6">
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
            <div className="flex gap-3 mb-4">
              <select value={bottomMetric} onChange={(e) => setBottomMetric(e.target.value as RankingMetric)} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium transition-all">
                {metricOptions.map((metric) => (<option key={metric} value={metric}>{getMetricLabel(metric)}</option>))}
              </select>
              <select value={bottomCount} onChange={(e) => setBottomCount(parseInt(e.target.value))} className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium transition-all">
                <option value={5}>Bottom 5</option>
                <option value={10}>Bottom 10</option>
                <option value={20}>Bottom 20</option>
              </select>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {bottomPerformers.map((group, index) => (
                <motion.div key={group.key} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} onClick={() => handleCardClick(group)} className={`flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-red-700 hover:shadow-md transition-all cursor-pointer`}>
                  <div className="flex items-center justify-center min-w-[32px] h-8 rounded-lg bg-gradient-to-br from-red-700 to-red-800 text-white font-bold text-sm">{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate text-sm text-gray-900`}>{group.className}</p>
                    <p className={`text-xs truncate text-gray-600`}>{group.day} • {group.time} • {group.location}</p>
                    {group.trainer && (<p className={`text-xs truncate text-blue-600`}>{group.trainer}</p>)}
                    <div className={`flex items-center gap-3 mt-1 text-xs text-gray-500`}>
                      <span>{group.metrics.sessionCount} classes</span>
                      <span>•</span>
                      <span>{formatNumber(group.metrics.totalCheckIns)} check-ins</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-700" />
                    <span className="font-bold text-gray-900 text-sm cursor-help">{formatMetricValue(bottomMetric, (group.metrics as any)[bottomMetric])}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <EnhancedDrilldownModal2 isOpen={isDrilldownOpen} onClose={() => setIsDrilldownOpen(false)} sessions={drilldownData} title={drilldownTitle} />
    </>
  );
}

export default memo(RankingsAdvanced);
