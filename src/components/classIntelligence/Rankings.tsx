import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Award, Filter, Users, Target, BarChart3, DollarSign } from 'lucide-react';
import type { SessionData, RankingMetric } from './types';
import { calculateMetrics, formatNumber, formatCurrency, formatPercentage } from './utils';

type Props = {
  sessions: SessionData[];
};

export default function Rankings({ sessions }: Props) {
  const [metric, setMetric] = useState<RankingMetric>('fillRate');
  const [count, setCount] = useState<number>(5);
  const [excludeHostedClasses, setExcludeHostedClasses] = useState(false);
  const [minCheckins, setMinCheckins] = useState(1);
  const [minClasses, setMinClasses] = useState(2);
  const [groupBy, setGroupBy] = useState<string>('className');

  const grouped = useMemo(() => {
    const map = new Map<string, SessionData[]>();
    let filteredSessions = sessions;

    // Apply hosting filter
    if (excludeHostedClasses) {
      filteredSessions = filteredSessions.filter(s => !(s.className?.toLowerCase().includes('hosted') || false));
    }

    const makeKey = (s: SessionData) => {
      switch (groupBy) {
        case 'className': return `${s.className || 'Unknown'}`;
        case 'trainerName': return `${s.trainerName || 'Unknown'}`;
        case 'location': return `${s.location || 'Unknown'}`;
        case 'day': return `${s.day || 'Unknown'}`;
        case 'time': return `${s.time || 'Unknown'}`;
        case 'class_day': return `${s.className || 'Unknown'}|${s.day || ''}`;
        case 'class_time': return `${s.className || 'Unknown'}|${s.time || ''}`;
        case 'class_location': return `${s.className || 'Unknown'}|${s.location || ''}`;
        case 'trainer_day': return `${s.trainerName || 'Unknown'}|${s.day || ''}`;
        case 'trainer_time': return `${s.trainerName || 'Unknown'}|${s.time || ''}`;
        case 'trainer_location': return `${s.trainerName || 'Unknown'}|${s.location || ''}`;
        case 'day_time': return `${s.day || 'Unknown'}|${s.time || ''}`;
        case 'day_location': return `${s.day || 'Unknown'}|${s.location || ''}`;
        case 'time_location': return `${s.time || 'Unknown'}|${s.location || ''}`;
        case 'class_day_time': return `${s.className || 'Unknown'}|${s.day || ''}|${s.time || ''}`;
        case 'class_day_location': return `${s.className || 'Unknown'}|${s.day || ''}|${s.location || ''}`;
        case 'class_time_location': return `${s.className || 'Unknown'}|${s.time || ''}|${s.location || ''}`;
        default: return `${s.className || 'Unknown'}|${s.day || ''}|${s.time || ''}|${s.location || ''}`;
      }
    };

    filteredSessions.forEach((s) => {
      const key = makeKey(s);
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });

    const items = Array.from(map.entries()).map(([key, rows]) => {
      const parts = key.split('|');
      const metrics = calculateMetrics(rows as SessionData[]);
      let label = '';
      switch (groupBy) {
        case 'className': label = `${parts[0]}`; break;
        case 'trainerName': label = `${parts[0]}`; break;
        case 'location': label = `${parts[0]}`; break;
        case 'day': label = `${parts[0]}`; break;
        case 'time': label = `${parts[0]}`; break;
        case 'class_day': label = `${parts[0]} • ${parts[1]}`; break;
        case 'class_time': label = `${parts[0]} • ${parts[1]}`; break;
        case 'class_location': label = `${parts[0]} • ${parts[1]}`; break;
        case 'trainer_day': label = `${parts[0]} • ${parts[1]}`; break;
        case 'trainer_time': label = `${parts[0]} • ${parts[1]}`; break;
        case 'trainer_location': label = `${parts[0]} • ${parts[1]}`; break;
        case 'day_time': label = `${parts[0]} • ${parts[1]}`; break;
        case 'day_location': label = `${parts[0]} • ${parts[1]}`; break;
        case 'time_location': label = `${parts[0]} • ${parts[1]}`; break;
        case 'class_day_time': label = `${parts[0]} • ${parts[1]} ${parts[2]}`; break;
        case 'class_day_location': label = `${parts[0]} • ${parts[1]} • ${parts[2]}`; break;
        case 'class_time_location': label = `${parts[0]} • ${parts[1]} • ${parts[2]}`; break;
        default: label = `${parts[0]} • ${parts[1]} ${parts[2]} • ${parts[3]}`;
      }
      return {
        key,
        label,
        metrics,
        sessions: rows,
      };
    });

    // Apply minimum filters
    return items.filter(item => 
      item.metrics.totalCheckIns >= minCheckins && 
      item.metrics.sessionCount >= minClasses
    );
  }, [sessions, excludeHostedClasses, minCheckins, minClasses]);

  const sorted = useMemo(() => {
    return [...grouped].sort((a, b) => {
      switch (metric) {
        case 'avgCheckIns': return b.metrics.avgCheckIns - a.metrics.avgCheckIns;
        case 'fillRate': return b.metrics.fillRate - a.metrics.fillRate;
        case 'totalRevenue': return b.metrics.totalRevenue - a.metrics.totalRevenue;
        case 'consistency': return b.metrics.consistency - a.metrics.consistency;
        case 'sessionCount': return b.metrics.sessionCount - a.metrics.sessionCount;
        default: return b.metrics.fillRate - a.metrics.fillRate;
      }
    });
  }, [grouped, metric]);

  const top = sorted.slice(0, count);
  const bottom = sorted.slice(-count).reverse();

  const getMetricValue = (metrics: any) => {
    switch (metric) {
      case 'totalRevenue': return formatCurrency(metrics.totalRevenue);
      case 'fillRate': return formatPercentage(metrics.fillRate);
      case 'avgCheckIns': return formatNumber(metrics.avgCheckIns, 1);
      case 'consistency': return `${metrics.consistency}%`;
      case 'sessionCount': return formatNumber(metrics.sessionCount);
      default: return formatNumber(metrics[metric] || 0, 1);
    }
  };

  const getMetricIcon = () => {
    switch (metric) {
      case 'totalRevenue': return DollarSign;
      case 'fillRate': return Target;
      case 'avgCheckIns': return Users;
      case 'consistency': return BarChart3;
      case 'sessionCount': return Award;
      default: return TrendingUp;
    }
  };

  const MetricIcon = getMetricIcon();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="glass-card rounded-2xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <MetricIcon className="w-4 h-4 text-blue-600" />
              Ranking Metric
            </label>
            <select 
              value={metric} 
              onChange={(e) => setMetric(e.target.value as RankingMetric)} 
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white font-medium"
            >
              <option value="avgCheckIns">Avg Attendees</option>
              <option value="fillRate">Fill Rate</option>
              <option value="totalRevenue">Total Revenue</option>
              <option value="consistency">Consistency</option>
              <option value="sessionCount">Session Count</option>
              {/* Extended metrics placeholders if needed in future */}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Award className="w-4 h-4 text-blue-600" />
              Group By
            </label>
            <select 
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white font-medium"
            >
              <option value="className">Class</option>
              <option value="trainerName">Trainer</option>
              <option value="location">Location</option>
              <option value="day">Day</option>
              <option value="time">Time</option>
              <option value="class_day">Class + Day</option>
              <option value="class_time">Class + Time</option>
              <option value="class_location">Class + Location</option>
              <option value="trainer_day">Trainer + Day</option>
              <option value="trainer_time">Trainer + Time</option>
              <option value="trainer_location">Trainer + Location</option>
              <option value="day_time">Day + Time</option>
              <option value="day_location">Day + Location</option>
              <option value="time_location">Time + Location</option>
              <option value="class_day_time">Class + Day + Time</option>
              <option value="class_day_location">Class + Day + Location</option>
              <option value="class_time_location">Class + Time + Location</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Award className="w-4 h-4 text-blue-600" />
              Show Count
            </label>
            <select 
              value={count} 
              onChange={(e) => setCount(parseInt(e.target.value))} 
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white font-medium"
            >
              <option value={3}>Top/Bottom 3</option>
              <option value={5}>Top/Bottom 5</option>
              <option value={10}>Top/Bottom 10</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">
              Min Check-ins
            </label>
            <input
              type="number"
              min="0"
              value={minCheckins}
              onChange={(e) => setMinCheckins(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">
              Min Classes
            </label>
            <input
              type="number"
              min="0"
              value={minClasses}
              onChange={(e) => setMinClasses(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white shadow-sm cursor-pointer hover:border-blue-400 transition-all">
            <input
              type="checkbox"
              checked={excludeHostedClasses}
              onChange={(e) => setExcludeHostedClasses(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-bold text-gray-800">
              Exclude Hosted Classes
            </span>
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6 border border-white/20 bg-gradient-to-br from-green-50 to-emerald-50"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-lg font-bold text-gray-800">Top {count} Performers</h4>
          </div>
          <div className="space-y-3">
            {top.map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-green-200 hover:bg-white/90 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800 truncate max-w-[300px]">
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-600">
                        {item.metrics.sessionCount} sessions • {formatNumber(item.metrics.avgCheckIns, 1)} avg • {formatPercentage(item.metrics.fillRate)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-700">
                      {getMetricValue(item.metrics)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6 border border-white/20 bg-gradient-to-br from-red-50 to-orange-50"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-600">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-lg font-bold text-gray-800">Bottom {count} Performers</h4>
          </div>
          <div className="space-y-3">
            {bottom.map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-red-200 hover:bg-white/90 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                      {sorted.length - count + index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800 truncate max-w-[300px]">
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-600">
                        {item.metrics.sessionCount} sessions • {formatNumber(item.metrics.avgCheckIns, 1)} avg • {formatPercentage(item.metrics.fillRate)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-700">
                      {getMetricValue(item.metrics)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
