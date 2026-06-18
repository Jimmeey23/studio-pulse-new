import React, { useMemo, useState } from 'react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { SessionData } from '@/hooks/useSessionsData';
import { Crown, AlertTriangle, Calendar, Clock, Zap, Users, BarChart3, Download, RefreshCw, Filter } from 'lucide-react';

interface ClassFormatRankingsProps {
  data: SessionData[];
}

type SortCriteria = 'revenue' | 'sessions' | 'fill' | 'class-avg' | 'rev-per-seat' | 'rev-per-session' | 'empty-classes';

const ClassFormatRankings: React.FC<ClassFormatRankingsProps> = ({ data }) => {
  const sessions = Array.isArray(data) ? data : [];
  const [sortBy, setSortBy] = useState<SortCriteria>('revenue');
  const [includeTrainers, setIncludeTrainers] = useState(true);
  const [excludeHosted, setExcludeHosted] = useState(false);
  const [minClasses, setMinClasses] = useState(1);
  const [minVisitors, setMinVisitors] = useState(0);

  const allRankings = useMemo(() => {
    // Group by uniqueId1 (unique class occurrence)
    const classMap = new Map<string, SessionData[]>();
    sessions.forEach(s => {
      const classId = s.uniqueId1 || s.sessionId || 'unknown';
      if (!classMap.has(classId)) classMap.set(classId, []);
      classMap.get(classId)!.push(s);
    });

    // Build ranking data for each class
    let rankings = Array.from(classMap.entries()).map(([classId, classSessions]) => {
      const totalSessions = classSessions.length;
      const totalRevenue = classSessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const totalCapacity = classSessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const totalCheckins = classSessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const fillRate = totalCapacity > 0 ? (totalCheckins / totalCapacity) * 100 : 0;
      const avgRevPerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
      const avgRevPerSeat = totalCapacity > 0 ? totalRevenue / totalCapacity : 0;

      // Get first session details (class name, day, time)
      const firstSession = classSessions[0];
      const className = firstSession?.cleanedClass || firstSession?.classType || 'Unknown';
      const dayOfWeek = firstSession?.dayOfWeek || 'Unknown';
      const time = firstSession?.time || 'Unknown';

      // Check if class has any empty sessions (0 checkins)
      const emptyClassCount = classSessions.filter(s => s.checkedInCount === 0).length;
      const nonEmptyClassCount = totalSessions - emptyClassCount;

      // Check if class is hosted (contains "hosted" in class name)
      const isHosted = className.toLowerCase().includes('hosted');

      // Top trainer in this class by revenue
      const trainerMap = new Map<string, number>();
      classSessions.forEach(s => {
        const trainer = s.trainerName || 'Unknown';
        trainerMap.set(trainer, (trainerMap.get(trainer) || 0) + (s.totalPaid || 0));
      });
      let topTrainer = 'N/A';
      let maxTrainerRev = 0;
      trainerMap.forEach((rev, trainer) => {
        if (rev > maxTrainerRev) {
          maxTrainerRev = rev;
          topTrainer = trainer;
        }
      });

      return {
        classId,
        className,
        dayOfWeek,
        time,
        totalSessions,
        totalRevenue,
        totalCapacity,
        totalCheckins,
        fillRate,
        avgRevPerSession,
        avgRevPerSeat,
        emptyClassCount,
        nonEmptyClassCount,
        topTrainer,
        classSessions,
        isHosted,
      };
    });

    // Apply filters
    rankings = rankings.filter(r => {
      // Filter by minimum classes
      if (r.totalSessions < minClasses) return false;
      // Filter by minimum visitors
      if (r.totalCheckins < minVisitors) return false;
      // Filter out hosted classes if enabled
      if (excludeHosted && r.isHosted) return false;
      return true;
    });

    // Sort based on criteria
    rankings.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'sessions':
          return b.totalSessions - a.totalSessions;
        case 'fill':
          return b.fillRate - a.fillRate;
        case 'class-avg':
          return (b.nonEmptyClassCount > 0 ? b.totalCheckins / b.nonEmptyClassCount : 0) - (a.nonEmptyClassCount > 0 ? a.totalCheckins / a.nonEmptyClassCount : 0);
        case 'rev-per-seat':
          return b.avgRevPerSeat - a.avgRevPerSeat;
        case 'rev-per-session':
          return b.avgRevPerSession - a.avgRevPerSession;
        case 'empty-classes':
          return b.emptyClassCount - a.emptyClassCount;
        default:
          return 0;
      }
    });

    return rankings;
  }, [sessions, sortBy, excludeHosted, minClasses, minVisitors]);

  // Split into top and bottom
  const topCount = Math.ceil(allRankings.length / 2);
  const topRankings = allRankings.slice(0, topCount);
  const bottomRankings = allRankings.slice(-topCount).reverse();

  const getMetricLabel = () => {
    switch (sortBy) {
      case 'revenue': return 'Revenue';
      case 'sessions': return 'Sessions';
      case 'fill': return 'Fill Rate';
      case 'class-avg': return 'Class Avg';
      case 'rev-per-seat': return 'Rev/Seat';
      case 'rev-per-session': return 'Rev/Session';
      case 'empty-classes': return 'Empty Classes';
      default: return 'Metric';
    }
  };

  const getMetricValue = (item: any) => {
    switch (sortBy) {
      case 'revenue': return formatCurrency(item.totalRevenue);
      case 'sessions': return formatNumber(item.totalSessions);
      case 'fill': return `${item.fillRate.toFixed(1)}%`;
      case 'class-avg': return (item.nonEmptyClassCount > 0 ? item.totalCheckins / item.nonEmptyClassCount : 0).toFixed(1);
      case 'rev-per-seat': return formatCurrency(item.avgRevPerSeat);
      case 'rev-per-session': return formatCurrency(item.avgRevPerSession);
      case 'empty-classes': return formatNumber(item.emptyClassCount);
      default: return '—';
    }
  };

  const RankingCard = ({ item, index, isTop }: { item: any; index: number; isTop: boolean }) => (
    <div className="group flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-300 cursor-pointer">
      <div className="flex items-center gap-4 flex-1">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm text-white ${
            isTop
              ? 'bg-gradient-to-r from-green-400 to-emerald-600'
              : 'bg-gradient-to-r from-red-400 to-rose-600'
          }`}
        >
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{item.className}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
              <Calendar className="w-3 h-3 inline mr-1" />
              {item.dayOfWeek}
            </span>
            <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
              <Clock className="w-3 h-3 inline mr-1" />
              {item.time}
            </span>
            <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
              {formatNumber(item.totalSessions)} sessions
            </span>
            <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">
              {item.totalCapacity} capacity
            </span>
            <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${
              item.fillRate >= 75 ? 'bg-green-50 text-green-700 border-green-200' :
              item.fillRate >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {item.fillRate.toFixed(1)}% fill
            </span>
            {includeTrainers && (
              <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                <Users className="w-3 h-3 inline mr-1" />
                {item.topTrainer}
              </span>
            )}
            {item.isHosted && (
              <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-medium">
                🎥 Hosted
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
          {getMetricValue(item)}
        </p>
        <p className="text-sm text-slate-500">{getMetricLabel()}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Individual Class Rankings</h3>
          <p className="text-sm text-slate-500 mt-1">Performance metrics by class occurrence with advanced filters</p>
        </div>

        {/* Main Filter and Sort Controls */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          {/* Row 1: Sort and Toggles */}
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 cursor-pointer hover:border-slate-400 transition-all"
            >
              <option value="revenue">Sort by Revenue</option>
              <option value="sessions">Sort by Sessions</option>
              <option value="fill">Sort by Fill Rate</option>
              <option value="class-avg">Sort by Class Avg</option>
              <option value="rev-per-seat">Sort by Rev/Seat</option>
              <option value="rev-per-session">Sort by Rev/Session</option>
              <option value="empty-classes">Sort by Empty Classes</option>
            </select>

            <div className="h-6 w-px bg-slate-300" />

            {/* Toggle Trainer Inclusion */}
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={includeTrainers}
                onChange={(e) => setIncludeTrainers(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Show Trainers</span>
            </label>

            {/* Toggle Exclude Hosted */}
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={excludeHosted}
                onChange={(e) => setExcludeHosted(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm font-medium text-slate-700">Exclude Hosted</span>
            </label>
          </div>

          {/* Row 2: Min Classes and Min Visitors */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Min Classes
              </label>
              <input
                type="number"
                value={minClasses}
                onChange={(e) => setMinClasses(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="100"
                className="w-20 px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Min Visitors
              </label>
              <input
                type="number"
                value={minVisitors}
                onChange={(e) => setMinVisitors(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
                max="1000"
                className="w-20 px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => {
                  setSortBy('revenue');
                  setIncludeTrainers(true);
                  setExcludeHosted(false);
                  setMinClasses(1);
                  setMinVisitors(0);
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-all flex items-center gap-1"
                title="Reset all filters to default values"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>

              <button
                onClick={() => {
                  const csvData = allRankings.map((item, idx) => ({
                    rank: (idx + 1),
                    className: item.className,
                    trainer: item.topTrainer,
                    sessions: item.totalSessions,
                    revenue: item.totalRevenue,
                    fillRate: item.fillRate.toFixed(1),
                  }));
                  const csv = [
                    ['Rank', 'Class Name', 'Trainer', 'Sessions', 'Revenue', 'Fill Rate %'].join(','),
                    ...csvData.map(row => [row.rank, row.className, row.trainer, row.sessions, row.revenue, row.fillRate].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `class-rankings-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-all flex items-center gap-1"
                title="Export rankings as CSV"
              >
                <Download className="w-4 h-4" />
                Export
              </button>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium transition-all flex items-center gap-1"
                title="View analytics and insights"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="text-xs text-slate-600 px-3 py-2 bg-white/50 rounded-lg border border-slate-200">
            <span className="font-semibold">Active Filters:</span> Min {minClasses}+ classes • Min {minVisitors}+ visitors {excludeHosted && '• Excluding hosted'} {includeTrainers && '• Trainers visible'}
          </div>
        </div>
      </div>

      {/* Top and Bottom Rankings */}
      {allRankings.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
          <Zap className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-600 font-medium">No classes found</p>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 flex items-center justify-center text-white">
                <Crown className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-900">Top Performers</h4>
              <span className="ml-auto text-xs text-slate-500 font-medium">{topRankings.length} classes</span>
            </div>
            <div className="space-y-3">
              {topRankings.map((item, index) => (
                <RankingCard key={item.classId} item={item} index={index} isTop={true} />
              ))}
            </div>
          </div>

          {/* Bottom Performers */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-400 to-rose-600 flex items-center justify-center text-white">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-900">Needs Improvement</h4>
              <span className="ml-auto text-xs text-slate-500 font-medium">{bottomRankings.length} classes</span>
            </div>
            <div className="space-y-3">
              {bottomRankings.map((item, index) => (
                <RankingCard key={item.classId} item={item} index={index} isTop={false} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassFormatRankings;
