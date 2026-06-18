import { useState, useMemo } from 'react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency } from '@/utils/calculations';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  MapPin,
  Clock,
  Award,
  BarChart3,
  ChevronDown,
  Star,
  X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

type RankingMetric = 
  | 'avgCheckIns' 
  | 'fillRate' 
  | 'totalRevenue' 
  | 'sessionCount' 
  | 'consistency' 
  | 'cancellationRate'
  | 'avgRevenue';

interface ClassMetrics {
  className: string;
  normalizedName: string;
  sessions: SessionData[];
  avgCheckIns: number;
  fillRate: number;
  totalRevenue: number;
  avgRevenue: number;
  sessionCount: number;
  cancellationRate: number;
  consistency: number;
  totalBooked: number;
  totalCapacity: number;
  totalCheckIns: number;
  avgCapacity: number;
  uniqueMembers: number;
  locations: string[];
  days: string[];
  times: string[];
  trainers: string[];
  firstDate: Date;
  lastDate: Date;
}

interface TrainerMetrics {
  trainer: string;
  sessions: SessionData[];
  avgCheckIns: number;
  fillRate: number;
  totalRevenue: number;
  avgRevenue: number;
  sessionCount: number;
  cancellationRate: number;
  consistency: number;
  totalBooked: number;
  totalCapacity: number;
  totalCheckIns: number;
  avgCapacity: number;
}

interface TimeSlotMetrics {
  day: string;
  time: string;
  location: string;
  sessions: SessionData[];
  avgCheckIns: number;
  fillRate: number;
  totalRevenue: number;
  sessionCount: number;
  consistency: number;
}

const normalizeClassName = (className: string): string => {
  return className
    .toLowerCase()
    .replace(/\s*express\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

interface ClassDeepDiveProps {
  data: SessionData[];
}

export default function ClassDeepDive({ data }: ClassDeepDiveProps) {
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [trainerRankingMetric, setTrainerRankingMetric] = useState<RankingMetric>('fillRate');
  const [timeSlotRankingMetric, setTimeSlotRankingMetric] = useState<'avgCheckIns' | 'fillRate' | 'totalRevenue' | 'consistency'>('avgCheckIns');
  const [rankingView, setRankingView] = useState<'timeSlot' | 'day' | 'time' | 'location' | 'trainer'>('timeSlot');
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);

  // Get all unique class formats (use cleanedClass as primary source)
  const classFormats = useMemo(() => {
    const classMap = new Map<string, string>();
    
    data.forEach(session => {
      const className = session.cleanedClass || session.sessionName || '';
      if (!className || className.toLowerCase().includes('hosted')) return;
      
      // Don't normalize - keep the full "Studio X" format names
      if (!classMap.has(className)) {
        classMap.set(className, className);
      }
    });

    return Array.from(classMap.entries())
      .map(([key, original]) => ({ normalized: key, original }))
      .sort((a, b) => a.original.localeCompare(b.original));
  }, [data]);

  // Calculate metrics for selected classes
  const classMetrics = useMemo((): ClassMetrics | null => {
    if (selectedClasses.length === 0) return null;

    const classSessions = data.filter(session => {
      const className = session.cleanedClass || session.sessionName || '';
      if (!className || className.toLowerCase().includes('hosted')) return false;
      return selectedClasses.includes(className);
    });

    if (classSessions.length === 0) return null;

    const totalCheckIns = classSessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
    const totalCapacity = classSessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const totalRevenue = classSessions.reduce((sum, s) => sum + (s.totalPaid || s.revenue || 0), 0);
    const totalBooked = classSessions.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
    const totalLateCancelled = classSessions.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);

    const avgCheckIns = classSessions.length > 0 ? totalCheckIns / classSessions.length : 0;
    const fillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
    const cancellationRate = totalBooked > 0 ? (totalLateCancelled / totalBooked) * 100 : 0;

    // Calculate consistency
    const checkInVariance = classSessions.length > 0 ? classSessions.reduce((sum, s) => {
      const diff = (s.checkedInCount || 0) - avgCheckIns;
      return sum + diff * diff;
    }, 0) / classSessions.length : 0;
    const consistency = avgCheckIns > 0 ? Math.max(0, 100 - Math.min(Math.sqrt(checkInVariance) / avgCheckIns * 100, 100)) : 0;

    // Get unique values
    const locations = [...new Set(classSessions.map(s => s.location).filter(Boolean))];
    const days = [...new Set(classSessions.map(s => s.dayOfWeek).filter(Boolean))];
    const times = [...new Set(classSessions.map(s => s.time?.substring(0, 5) || ''))].filter(Boolean);
    const trainers = [...new Set(classSessions.map(s => s.trainerName).filter(Boolean))];
    
    const uniqueMembers = new Set<string>();

    const dates = classSessions.map(s => parseISO(s.date)).sort((a, b) => a.getTime() - b.getTime());

    const displayName = selectedClasses.length === 1 
      ? selectedClasses[0]
      : `${selectedClasses.length} Classes Combined`;

    return {
      className: displayName,
      normalizedName: selectedClasses.join(', '),
      sessions: classSessions,
      avgCheckIns,
      fillRate,
      totalRevenue,
      avgRevenue: classSessions.length > 0 ? totalRevenue / classSessions.length : 0,
      sessionCount: classSessions.length,
      cancellationRate,
      consistency: Math.round(consistency),
      totalBooked,
      totalCapacity,
      totalCheckIns,
      avgCapacity: classSessions.length > 0 ? totalCapacity / classSessions.length : 0,
      uniqueMembers: uniqueMembers.size,
      locations,
      days,
      times,
      trainers,
      firstDate: dates[0] || new Date(),
      lastDate: dates[dates.length - 1] || new Date()
    };
  }, [data, selectedClasses]);

  // Calculate trainer metrics for selected class
  const trainerMetrics = useMemo((): TrainerMetrics[] => {
    if (!classMetrics) return [];

    const trainerMap = new Map<string, SessionData[]>();
    
    classMetrics.sessions.forEach(session => {
      const trainer = session.trainerName || '';
      if (!trainer) return;
      const existing = trainerMap.get(trainer) || [];
      existing.push(session);
      trainerMap.set(trainer, existing);
    });

    const metrics: TrainerMetrics[] = [];

    trainerMap.forEach((sessions, trainer) => {
      const totalCheckIns = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || s.revenue || 0), 0);
      const totalBooked = sessions.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
      const totalLateCancelled = sessions.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);

      const avgCheckIns = sessions.length > 0 ? totalCheckIns / sessions.length : 0;
      const fillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
      const cancellationRate = totalBooked > 0 ? (totalLateCancelled / totalBooked) * 100 : 0;

      const checkInVariance = sessions.length > 0 ? sessions.reduce((sum, s) => {
        const diff = (s.checkedInCount || 0) - avgCheckIns;
        return sum + diff * diff;
      }, 0) / sessions.length : 0;
      const consistency = avgCheckIns > 0 ? Math.max(0, 100 - Math.min(Math.sqrt(checkInVariance) / avgCheckIns * 100, 100)) : 0;

      metrics.push({
        trainer,
        sessions,
        avgCheckIns,
        fillRate,
        totalRevenue,
        avgRevenue: sessions.length > 0 ? totalRevenue / sessions.length : 0,
        sessionCount: sessions.length,
        cancellationRate,
        consistency: Math.round(consistency),
        totalBooked,
        totalCapacity,
        totalCheckIns,
        avgCapacity: sessions.length > 0 ? totalCapacity / sessions.length : 0
      });
    });

    // Sort by selected metric
    return metrics.sort((a, b) => {
      switch (trainerRankingMetric) {
        case 'avgCheckIns': return b.avgCheckIns - a.avgCheckIns;
        case 'fillRate': return b.fillRate - a.fillRate;
        case 'totalRevenue': return b.totalRevenue - a.totalRevenue;
        case 'sessionCount': return b.sessionCount - a.sessionCount;
        case 'consistency': return b.consistency - a.consistency;
        case 'cancellationRate': return a.cancellationRate - b.cancellationRate;
        case 'avgRevenue': return b.avgRevenue - a.avgRevenue;
        default: return b.fillRate - a.fillRate;
      }
    });
  }, [classMetrics, trainerRankingMetric]);

  // Calculate dynamic rankings based on view type
  const dynamicRankings = useMemo(() => {
    if (!classMetrics) return { top: [], bottom: [] };

    type RankingItem = {
      label: string;
      avgCheckIns: number;
      fillRate: number;
      totalRevenue: number;
      sessionCount: number;
      consistency: number;
      sessions: SessionData[];
    };

    const rankingMap = new Map<string, SessionData[]>();

    classMetrics.sessions.forEach(session => {
      let key = '';
      switch (rankingView) {
        case 'day':
          key = session.dayOfWeek || '';
          break;
        case 'time':
          key = session.time?.substring(0, 5) || '';
          break;
        case 'location':
          key = session.location || '';
          break;
        case 'trainer':
          key = session.trainerName || '';
          break;
        case 'timeSlot':
          key = `${session.dayOfWeek} • ${session.time?.substring(0, 5)} • ${session.location}`;
          break;
      }
      if (key) {
        const existing = rankingMap.get(key) || [];
        existing.push(session);
        rankingMap.set(key, existing);
      }
    });

    const rankings: RankingItem[] = [];

    rankingMap.forEach((sessions, label) => {
      const totalCheckIns = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || s.revenue || 0), 0);

      const avgCheckIns = sessions.length > 0 ? totalCheckIns / sessions.length : 0;
      const fillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;

      const checkInVariance = sessions.length > 0 ? sessions.reduce((sum, s) => {
        const diff = (s.checkedInCount || 0) - avgCheckIns;
        return sum + diff * diff;
      }, 0) / sessions.length : 0;
      const consistency = avgCheckIns > 0 ? Math.max(0, 100 - Math.min(Math.sqrt(checkInVariance) / avgCheckIns * 100, 100)) : 0;

      rankings.push({
        label,
        avgCheckIns,
        fillRate,
        totalRevenue,
        sessionCount: sessions.length,
        consistency: Math.round(consistency),
        sessions
      });
    });

    const sorted = rankings.sort((a, b) => {
      switch (timeSlotRankingMetric) {
        case 'avgCheckIns': return b.avgCheckIns - a.avgCheckIns;
        case 'fillRate': return b.fillRate - a.fillRate;
        case 'totalRevenue': return b.totalRevenue - a.totalRevenue;
        case 'consistency': return b.consistency - a.consistency;
        default: return b.avgCheckIns - a.avgCheckIns;
      }
    });

    return {
      top: sorted.slice(0, 5),
      bottom: sorted.slice(-5).reverse()
    };
  }, [classMetrics, timeSlotRankingMetric, rankingView]);

  // Get all historical sessions sorted by class average
  const historicalSessions = useMemo(() => {
    if (!classMetrics) return [];

    return [...classMetrics.sessions]
      .sort((a, b) => (b.checkedInCount || 0) - (a.checkedInCount || 0));
  }, [classMetrics]);

  return (
    <div className="space-y-6">
      {/* Header with Class Selector */}
      <div className="bg-white/80 glass-card rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Class Deep Dive</h2>
              <p className="text-blue-100 text-sm mt-1">Comprehensive format analysis & performance insights</p>
            </div>
          </div>

          {/* Multi-Class Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-3">
              Select Class Formats (Multiple)
            </label>
            <div className="space-y-3">
              {/* Selected Classes Display */}
              {selectedClasses.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedClasses.map(normalized => {
                    const format = classFormats.find(f => f.normalized === normalized);
                    return (
                      <button
                        key={normalized}
                        onClick={() => setSelectedClasses(prev => prev.filter(c => c !== normalized))}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-semibold hover:bg-white/30 transition-all"
                      >
                        {format?.original}
                        <span className="text-white/70 hover:text-white">✕</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setSelectedClasses([])}
                    className="px-3 py-1.5 bg-red-500/20 backdrop-blur-sm rounded-lg text-red-200 text-xs font-semibold hover:bg-red-500/30 transition-all"
                  >
                    Clear All
                  </button>
                </div>
              )}
              
              {/* Dropdown Selector */}
              <div className="relative">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !selectedClasses.includes(e.target.value)) {
                      setSelectedClasses(prev => [...prev, e.target.value]);
                    }
                  }}
                  className="w-full px-5 py-4 pr-12 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white font-semibold text-lg appearance-none cursor-pointer hover:bg-white/20 focus:bg-white/20 focus:border-white/50 focus:ring-2 focus:ring-white/30 transition-all"
                >
                  <option value="" className="bg-slate-800">
                    {selectedClasses.length === 0 ? '-- Select class format(s) --' : '-- Add another class --'}
                  </option>
                  {classFormats
                    .filter(({ normalized }) => !selectedClasses.includes(normalized))
                    .map(({ normalized, original }) => (
                      <option key={normalized} value={normalized} className="bg-slate-800">
                        {original}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/70 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Only show when class is selected */}
      {classMetrics && (
        <>
          {/* Class Overview */}
          <div className="bg-white/80 glass-card rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white p-8">
              <div className="mb-6">
                <h3 className="text-3xl font-bold tracking-tight mb-2">{classMetrics.className}</h3>
                <p className="text-blue-200 text-sm">
                  {format(classMetrics.firstDate, 'MMM dd, yyyy')} - {format(classMetrics.lastDate, 'MMM dd, yyyy')}
                </p>
              </div>

              {/* Key Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">Total Sessions</div>
                  <div className="text-3xl font-bold">{classMetrics.sessionCount}</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">Total Check-ins</div>
                  <div className="text-3xl font-bold">{classMetrics.totalCheckIns}</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">Avg Attendance</div>
                  <div className="text-3xl font-bold">{classMetrics.avgCheckIns.toFixed(1)}</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">Fill Rate</div>
                  <div className="text-3xl font-bold">{classMetrics.fillRate.toFixed(1)}%</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">Consistency</div>
                  <div className="text-3xl font-bold">{classMetrics.consistency}%</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">Total Revenue</div>
                  <div className="text-xl font-bold">{formatCurrency(classMetrics.totalRevenue)}</div>
                </div>
              </div>

              {/* Details and Metrics */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-xl p-5 border border-white/20">
                  <div className="text-xs font-bold uppercase tracking-wider mb-4 text-white/80">Class Details</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-white/60 text-xs mb-1">Locations</div>
                        <div className="font-medium">{classMetrics.locations.join(', ')}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-white/60 text-xs mb-1">Days</div>
                        <div className="font-medium">{classMetrics.days.join(', ')}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-white/60 text-xs mb-1">Time Slots</div>
                        <div className="font-medium">{classMetrics.times.length} different</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-white/60 text-xs mb-1">Trainers</div>
                        <div className="font-medium">{classMetrics.trainers.length} total</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-5 border border-white/20">
                  <div className="text-xs font-bold uppercase tracking-wider mb-4 text-white/80">Performance Metrics</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Check-Ins</span>
                      <span className="font-bold">{classMetrics.totalCheckIns.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Bookings</span>
                      <span className="font-bold">{classMetrics.totalBooked.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Avg Rev/Session</span>
                      <span className="font-bold">{formatCurrency(classMetrics.avgRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Rev/Check-In</span>
                      <span className="font-bold">
                        {formatCurrency(classMetrics.totalRevenue / classMetrics.totalCheckIns)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Cancel Rate</span>
                      <span className="font-bold">{classMetrics.cancellationRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Avg Capacity</span>
                      <span className="font-bold">{classMetrics.avgCapacity.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trainer Rankings & Performance Rankings */}
          <div className="bg-white/80 glass-card rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8">
              {/* Trainer Rankings */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-2.5 rounded-xl">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Trainer Rankings</h3>
                      <p className="text-xs text-slate-600">Performance comparison across all trainers</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <select
                      value={trainerRankingMetric}
                      onChange={(e) => setTrainerRankingMetric(e.target.value as RankingMetric)}
                      className="px-4 py-2 pr-10 rounded-lg border-2 border-slate-300 bg-white text-sm font-semibold appearance-none cursor-pointer hover:border-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all"
                    >
                      <option value="fillRate">Fill Rate</option>
                      <option value="avgCheckIns">Avg Attendance</option>
                      <option value="totalRevenue">Total Revenue</option>
                      <option value="avgRevenue">Avg Revenue</option>
                      <option value="sessionCount">Session Count</option>
                      <option value="consistency">Consistency</option>
                      <option value="cancellationRate">Cancel Rate ↓</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table data-table="class-attendance-trainer-rankings" data-table-name="Class Attendance Trainer Rankings" className="w-full text-sm">
                      <thead className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider w-16">Rank</th>
                          <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Trainer</th>
                          <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Sessions</th>
                          <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Check-Ins</th>
                          <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Avg Attend</th>
                          <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Fill Rate</th>
                          <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Total Rev</th>
                          <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Consistency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {trainerMetrics.map((trainer, index) => (
                          <tr 
                            key={trainer.trainer}
                            onClick={() => setSelectedTrainer(trainer.trainer)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer h-[35px]"
                          >
                            <td className="px-4 py-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                                index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                                'bg-gradient-to-br from-slate-400 to-slate-600'
                              }`}>
                                {index === 0 ? <Star className="w-4 h-4" fill="currentColor" /> : index + 1}
                              </div>
                            </td>
                            <td className="px-4 py-2 max-w-[200px] truncate">
                              <div className="font-bold text-slate-900">{trainer.trainer}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200 text-slate-800">
                                {trainer.sessionCount}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {trainer.totalCheckIns.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {trainer.avgCheckIns.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200 text-slate-800">
                                {trainer.fillRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {formatCurrency(trainer.totalRevenue)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200 text-slate-800">
                                {trainer.consistency}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Performance Rankings */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-2.5 rounded-xl">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Performance Rankings</h3>
                      <p className="text-xs text-slate-600">Top and bottom performers</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">View:</span>
                      <div className="flex gap-1">
                        {['timeSlot', 'day', 'time', 'location', 'trainer'].map((view) => (
                          <button
                            key={view}
                            onClick={() => setRankingView(view as any)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              rankingView === view
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {view === 'timeSlot' ? 'Time Slot' : view.charAt(0).toUpperCase() + view.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Rank By:</span>
                      <div className="flex gap-1">
                        {(['avgCheckIns', 'fillRate', 'totalRevenue', 'consistency'] as const).map((metric) => (
                          <button
                            key={metric}
                            onClick={() => setTimeSlotRankingMetric(metric)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              timeSlotRankingMetric === metric
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {metric === 'avgCheckIns' ? 'Attendance' : 
                             metric === 'fillRate' ? 'Fill Rate' :
                             metric === 'totalRevenue' ? 'Revenue' : 'Consistency'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Top Rankings */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h4 className="text-base font-bold text-slate-900">Top 5</h4>
                    </div>
                    
                    <div className="space-y-2">
                      {dynamicRankings.top.map((item, index) => (
                        <div key={`top_${item.label}`} className="bg-gradient-to-br from-white to-green-50/30 rounded-xl p-4 border-2 border-slate-200 hover:border-green-400 hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-900">{item.label}</div>
                                <div className="text-xs text-slate-600 mt-0.5">{item.sessionCount} sessions</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                {timeSlotRankingMetric === 'avgCheckIns' && item.avgCheckIns.toFixed(1)}
                                {timeSlotRankingMetric === 'fillRate' && `${item.fillRate.toFixed(1)}%`}
                                {timeSlotRankingMetric === 'totalRevenue' && formatCurrency(item.totalRevenue)}
                                {timeSlotRankingMetric === 'consistency' && `${item.consistency}%`}
                              </div>
                              <div className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">
                                {timeSlotRankingMetric === 'avgCheckIns' && 'avg attend'}
                                {timeSlotRankingMetric === 'fillRate' && 'fill rate'}
                                {timeSlotRankingMetric === 'totalRevenue' && 'revenue'}
                                {timeSlotRankingMetric === 'consistency' && 'consistency'}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div className="bg-white/60 rounded-lg p-2 border border-slate-200">
                              <div className="text-[10px] text-slate-600 mb-1">Attend</div>
                              <div className="font-bold text-slate-900">{item.avgCheckIns.toFixed(1)}</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-2 border border-slate-200">
                              <div className="text-[10px] text-slate-600 mb-1">Fill</div>
                              <div className="font-bold text-slate-900">{item.fillRate.toFixed(1)}%</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-2 border border-slate-200">
                              <div className="text-[10px] text-slate-600 mb-1">Sessions</div>
                              <div className="font-bold text-slate-900">{item.sessionCount}</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-2 border border-slate-200">
                              <div className="text-[10px] text-slate-600 mb-1">Rev</div>
                              <div className="font-bold text-slate-900">{formatCurrency(item.totalRevenue)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Rankings */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      <h4 className="text-base font-bold text-slate-900">Bottom 5</h4>
                    </div>
                    
                    <div className="space-y-2">
                      {dynamicRankings.bottom.map((item, index) => (
                        <div key={`bottom_${item.label}`} className="bg-gradient-to-br from-white to-red-50/30 rounded-xl p-4 border-2 border-slate-200 hover:border-red-400 hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-900">{item.label}</div>
                                <div className="text-xs text-slate-600 mt-0.5">{item.sessionCount} sessions</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-red-600">
                                {timeSlotRankingMetric === 'avgCheckIns' && item.avgCheckIns.toFixed(1)}
                                {timeSlotRankingMetric === 'fillRate' && `${item.fillRate.toFixed(1)}%`}
                                {timeSlotRankingMetric === 'totalRevenue' && formatCurrency(item.totalRevenue)}
                                {timeSlotRankingMetric === 'consistency' && `${item.consistency}%`}
                              </div>
                              <div className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">
                                {timeSlotRankingMetric === 'avgCheckIns' && 'avg attend'}
                                {timeSlotRankingMetric === 'fillRate' && 'fill rate'}
                                {timeSlotRankingMetric === 'totalRevenue' && 'revenue'}
                                {timeSlotRankingMetric === 'consistency' && 'consistency'}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div className="bg-white/60 rounded-lg p-2 border border-slate-200">
                              <div className="text-[10px] text-slate-600 mb-1">Attend</div>
                              <div className="font-bold text-slate-900">{item.avgCheckIns.toFixed(1)}</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-2 border border-slate-200">
                              <div className="text-[10px] text-slate-600 mb-1">Fill</div>
                              <div className="font-bold text-slate-900">{item.fillRate.toFixed(1)}%</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-2 border border-slate-200">
                              <div className="text-[10px] text-slate-600 mb-1">Sessions</div>
                              <div className="font-bold text-slate-900">{item.sessionCount}</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-2 border border-slate-200">
                              <div className="text-[10px] text-slate-600 mb-1">Rev</div>
                              <div className="font-bold text-slate-900">{formatCurrency(item.totalRevenue)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Sessions Table */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-2.5 rounded-xl">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">All Historical Sessions</h3>
                    <p className="text-xs text-slate-600">Complete history sorted by attendance (highest to lowest)</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table data-table="class-attendance-historical-sessions" data-table-name="Class Attendance Historical Sessions" className="w-full text-sm">
                      <thead className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Date</th>
                          {selectedClasses.length > 1 && (
                            <th className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Class</th>
                          )}
                          <th className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Day</th>
                          <th className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Time</th>
                          <th className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Trainer</th>
                          <th className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Location</th>
                          <th className="px-3 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Attended</th>
                          <th className="px-3 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Capacity</th>
                          <th className="px-3 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Fill %</th>
                          <th className="px-3 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historicalSessions.map((session, index) => {
                          const fillRate = (session.capacity || 0) > 0 ? ((session.checkedInCount || 0) / (session.capacity || 1)) * 100 : 0;
                          return (
                            <tr key={`hist_${index}_${session.date}`} className="hover:bg-slate-50 transition-colors h-[35px]">
                              <td className="px-3 py-2 font-medium text-slate-900 text-xs whitespace-nowrap">
                                {format(parseISO(session.date), 'MMM dd, yyyy')}
                              </td>
                              {selectedClasses.length > 1 && (
                                <td className="px-3 py-2 font-semibold text-slate-900 text-xs truncate max-w-[150px]">
                                  {session.cleanedClass || session.sessionName}
                                </td>
                              )}
                              <td className="px-3 py-2 text-slate-700 text-xs whitespace-nowrap">{session.dayOfWeek}</td>
                              <td className="px-3 py-2 text-slate-700 text-xs font-medium whitespace-nowrap">{session.time?.substring(0, 5)}</td>
                              <td className="px-3 py-2 font-semibold text-slate-900 text-xs truncate max-w-[150px]">{session.trainerName}</td>
                              <td className="px-3 py-2 text-slate-700 text-xs truncate max-w-[150px]">{session.location}</td>
                              <td className="px-3 py-2 text-right">
                                <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-md text-xs font-bold border border-slate-200 text-slate-800">
                                  {session.checkedInCount || 0}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-slate-700 text-xs">{session.capacity || 0}</td>
                              <td className="px-3 py-2 text-right">
                                <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-md text-xs font-bold border border-slate-200 text-slate-800">
                                  {fillRate.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-slate-900 text-xs whitespace-nowrap">
                                {formatCurrency(session.totalPaid || session.revenue || 0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {selectedClasses.length === 0 && (
        <div className="bg-white/80 glass-card rounded-3xl p-16 border border-white/20 shadow-2xl text-center">
          <div className="bg-slate-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-3">Select Class Format(s) to Begin</h3>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            Choose one or more class formats from the dropdown above to unlock detailed analytics, trainer rankings, optimal scheduling insights, and complete session history. Compare multiple formats simultaneously!
          </p>
        </div>
      )}

      {/* Trainer Detail Modal */}
      {selectedTrainer && classMetrics && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{selectedTrainer}</h3>
                <p className="text-blue-200 text-sm mt-1">Individual Session Details</p>
              </div>
              <button
                onClick={() => setSelectedTrainer(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table data-table="class-attendance-trainer-session-detail" data-table-name="Class Attendance Trainer Session Detail" className="w-full text-sm">
                    <thead className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Date</th>
                        <th className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Day</th>
                        <th className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Time</th>
                        <th className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Location</th>
                        <th className="px-3 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Attended</th>
                        <th className="px-3 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Capacity</th>
                        <th className="px-3 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Fill %</th>
                        <th className="px-3 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classMetrics.sessions
                        .filter(s => (s.trainerName || '') === selectedTrainer)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((session, index) => {
                          const fillRate = (session.capacity || 0) > 0 ? ((session.checkedInCount || 0) / (session.capacity || 1)) * 100 : 0;
                          return (
                            <tr key={`trainer_${index}_${session.date}`} className="hover:bg-slate-50 transition-colors h-[35px]">
                              <td className="px-3 py-2 font-medium text-slate-900 text-xs whitespace-nowrap">
                                {format(parseISO(session.date), 'MMM dd, yyyy')}
                              </td>
                              <td className="px-3 py-2 text-slate-700 text-xs whitespace-nowrap">{session.dayOfWeek}</td>
                              <td className="px-3 py-2 text-slate-700 text-xs font-medium whitespace-nowrap">{session.time?.substring(0, 5)}</td>
                              <td className="px-3 py-2 text-slate-700 text-xs truncate max-w-[150px]">{session.location}</td>
                              <td className="px-3 py-2 text-right">
                                <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-md text-xs font-bold border border-slate-200 text-slate-800">
                                  {session.checkedInCount || 0}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-slate-700 text-xs">{session.capacity || 0}</td>
                              <td className="px-3 py-2 text-right">
                                <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-md text-xs font-bold border border-slate-200 text-slate-800">
                                  {fillRate.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-slate-900 text-xs whitespace-nowrap">
                                {formatCurrency(session.totalPaid || session.revenue || 0)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
