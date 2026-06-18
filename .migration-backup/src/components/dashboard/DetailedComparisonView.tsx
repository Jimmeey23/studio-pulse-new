import React, { useEffect, useMemo, useState } from 'react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import type { SessionData } from '@/hooks/useSessionsData';
import { getAllFormats, getClassFormat } from '@/utils/classTypeUtils';
import { TrainerNameCell } from '@/components/ui/TrainerAvatar';
import {
  Activity,
  BarChart3,
  CalendarDays,
  Clock,
  DollarSign,
  Percent,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailedComparisonViewProps {
  data: SessionData[];
}

type MetricType =
  | 'revenue'
  | 'sessions'
  | 'attendance'
  | 'booked'
  | 'fill'
  | 'booking-rate'
  | 'show-up'
  | 'no-show'
  | 'late-cancel'
  | 'rev-per-session'
  | 'rev-per-attendee';

type BreakdownTab = 'trainer' | 'time' | 'day';

interface AggregateStats {
  sessions: number;
  revenue: number;
  checkins: number;
  capacity: number;
  booked: number;
  lateCancelled: number;
  emptyClasses: number;
}

interface MetricRow extends AggregateStats {
  name: string;
  fillRate: number;
  bookingRate: number;
  showUpRate: number;
  noShowRate: number;
  lateCancelRate: number;
  avgAttendance: number;
  revPerSession: number;
  revPerAttendee: number;
}

const EMPTY_STATS: AggregateStats = {
  sessions: 0,
  revenue: 0,
  checkins: 0,
  capacity: 0,
  booked: 0,
  lateCancelled: 0,
  emptyClasses: 0,
};

const createEmptyStats = (): AggregateStats => ({ ...EMPTY_STATS });

const toMetricRow = (name: string, stats: AggregateStats): MetricRow => {
  const safeBooked = Math.max(stats.booked, 0);
  const noShowCount = Math.max(safeBooked - stats.checkins - stats.lateCancelled, 0);

  return {
    ...stats,
    name,
    fillRate: stats.capacity > 0 ? (stats.checkins / stats.capacity) * 100 : 0,
    bookingRate: stats.capacity > 0 ? (safeBooked / stats.capacity) * 100 : 0,
    showUpRate: safeBooked > 0 ? (stats.checkins / safeBooked) * 100 : 0,
    noShowRate: safeBooked > 0 ? (noShowCount / safeBooked) * 100 : 0,
    lateCancelRate: safeBooked > 0 ? (stats.lateCancelled / safeBooked) * 100 : 0,
    avgAttendance: stats.sessions > 0 ? stats.checkins / stats.sessions : 0,
    revPerSession: stats.sessions > 0 ? stats.revenue / stats.sessions : 0,
    revPerAttendee: stats.checkins > 0 ? stats.revenue / stats.checkins : 0,
  };
};

const getMetricSortValue = (row: MetricRow, metric: MetricType) => {
  switch (metric) {
    case 'revenue': return row.revenue;
    case 'sessions': return row.sessions;
    case 'attendance': return row.checkins;
    case 'booked': return row.booked;
    case 'fill': return row.fillRate;
    case 'booking-rate': return row.bookingRate;
    case 'show-up': return row.showUpRate;
    case 'no-show': return row.noShowRate;
    case 'late-cancel': return row.lateCancelRate;
    case 'rev-per-session': return row.revPerSession;
    case 'rev-per-attendee': return row.revPerAttendee;
  }
};

const sortRows = (rows: MetricRow[], metric: MetricType) =>
  [...rows].sort((a, b) => getMetricSortValue(b, metric) - getMetricSortValue(a, metric));

const BREAKDOWN_TABS: { value: BreakdownTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'trainer', label: 'Trainer', icon: User },
  { value: 'time', label: 'Time Slot', icon: Clock },
  { value: 'day', label: 'Day of Week', icon: CalendarDays },
];

const DetailedComparisonView: React.FC<DetailedComparisonViewProps> = ({ data }) => {
  const sessions = Array.isArray(data) ? data : [];
  const [metric, setMetric] = useState<MetricType>('revenue');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [breakdownTab, setBreakdownTab] = useState<BreakdownTab>('trainer');

  const formats = useMemo(() => {
    const presentFormats = new Set(sessions.map((s) => getClassFormat(s.cleanedClass || s.classType)));
    return getAllFormats().filter((format) => presentFormats.has(format));
  }, [sessions]);

  useEffect(() => {
    if (!selectedFormat || !formats.includes(selectedFormat as any)) {
      setSelectedFormat(formats[0] || '');
    }
  }, [formats, selectedFormat]);

  const formatSessions = useMemo(() => {
    if (!selectedFormat) return [] as SessionData[];
    return sessions.filter((s) => getClassFormat(s.cleanedClass || s.classType) === selectedFormat);
  }, [sessions, selectedFormat]);

  const formatOverview = useMemo(() => {
    const stats = formatSessions.reduce<AggregateStats>((acc, session) => {
      acc.sessions += 1;
      acc.revenue += session.totalPaid || session.revenue || 0;
      acc.checkins += session.checkedInCount || 0;
      acc.capacity += session.capacity || 0;
      acc.booked += session.bookedCount || 0;
      acc.lateCancelled += session.lateCancelledCount || 0;
      acc.emptyClasses += (session.checkedInCount || 0) === 0 ? 1 : 0;
      return acc;
    }, createEmptyStats());
    return toMetricRow(selectedFormat || 'Selected Format', stats);
  }, [formatSessions, selectedFormat]);

  const formatData = useMemo(() => {
    const trainerMap = new Map<string, AggregateStats>();
    const timeMap = new Map<string, AggregateStats>();
    const dayMap = new Map<string, AggregateStats>();

    const collect = (map: Map<string, AggregateStats>, key: string, session: SessionData) => {
      const current = map.get(key) || createEmptyStats();
      current.sessions += 1;
      current.revenue += session.totalPaid || session.revenue || 0;
      current.checkins += session.checkedInCount || 0;
      current.capacity += session.capacity || 0;
      current.booked += session.bookedCount || 0;
      current.lateCancelled += session.lateCancelledCount || 0;
      current.emptyClasses += (session.checkedInCount || 0) === 0 ? 1 : 0;
      map.set(key, current);
    };

    formatSessions.forEach((session) => {
      collect(trainerMap, session.trainerName || 'Unknown Trainer', session);
      collect(timeMap, session.time || 'Unknown Time', session);
      collect(dayMap, session.dayOfWeek || 'Unknown Day', session);
    });

    return {
      byTrainer: sortRows(Array.from(trainerMap.entries()).map(([name, stats]) => toMetricRow(name, stats)), metric),
      byTime: sortRows(Array.from(timeMap.entries()).map(([name, stats]) => toMetricRow(name, stats)), metric),
      byDay: sortRows(Array.from(dayMap.entries()).map(([name, stats]) => toMetricRow(name, stats)), metric),
    };
  }, [formatSessions, metric]);

  const activeRows = breakdownTab === 'trainer' ? formatData.byTrainer : breakdownTab === 'time' ? formatData.byTime : formatData.byDay;

  const bestPerformers = useMemo(() => {
    const trainerLeader = formatData.byTrainer[0];
    const timeLeader = formatData.byTime[0];
    const dayLeader = formatData.byDay[0];
    return [
      { label: 'Top Trainer', value: trainerLeader?.name || '—', subvalue: trainerLeader ? `${formatNumber(trainerLeader.checkins)} attendance` : '—', icon: User },
      { label: 'Best Time Slot', value: timeLeader?.name || '—', subvalue: timeLeader ? formatPercentage(timeLeader.fillRate) : '—', icon: Clock },
      { label: 'Strongest Day', value: dayLeader?.name || '—', subvalue: dayLeader ? formatCurrency(dayLeader.revenue) : '—', icon: CalendarDays },
    ];
  }, [formatData]);

  const summaryCards = useMemo(() => {
    const noShows = Math.max(formatOverview.booked - formatOverview.checkins - formatOverview.lateCancelled, 0);
    return [
      { label: 'Sessions', value: formatNumber(formatOverview.sessions), icon: BarChart3, accent: 'from-blue-600 to-blue-800' },
      { label: 'Attendance', value: formatNumber(formatOverview.checkins), icon: Users, accent: 'from-cyan-600 to-blue-800' },
      { label: 'Booked', value: formatNumber(formatOverview.booked), icon: Activity, accent: 'from-indigo-600 to-indigo-800' },
      { label: 'Fill Rate', value: formatPercentage(formatOverview.fillRate), icon: Percent, accent: 'from-violet-600 to-purple-800' },
      { label: 'Booking Rate', value: formatPercentage(formatOverview.bookingRate), icon: TrendingUp, accent: 'from-purple-600 to-fuchsia-800' },
      { label: 'Show-up Rate', value: formatPercentage(formatOverview.showUpRate), icon: Users, accent: 'from-emerald-600 to-teal-800' },
      { label: 'No-shows', value: formatNumber(noShows), icon: Activity, accent: 'from-amber-600 to-orange-800' },
      { label: 'Late Cancels', value: formatNumber(formatOverview.lateCancelled), icon: Activity, accent: 'from-rose-600 to-red-800' },
      { label: 'Revenue', value: formatCurrency(formatOverview.revenue), icon: DollarSign, accent: 'from-emerald-600 to-green-800' },
      { label: 'Rev / Session', value: formatCurrency(formatOverview.revPerSession), icon: DollarSign, accent: 'from-teal-600 to-cyan-800' },
      { label: 'Rev / Attendee', value: formatCurrency(formatOverview.revPerAttendee), icon: DollarSign, accent: 'from-sky-600 to-blue-800' },
      { label: 'Empty Classes', value: formatNumber(formatOverview.emptyClasses), icon: BarChart3, accent: 'from-slate-600 to-slate-800' },
    ];
  }, [formatOverview]);

  return (
    <div className="space-y-6">
      {/* Controls — format selector + metric selector */}
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Format pills */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Class Format</p>
          <div className="flex flex-wrap gap-2">
            {formats.map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => setSelectedFormat(format)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-xs font-semibold transition-all',
                  selectedFormat === format
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                )}
              >
                {format}
              </button>
            ))}
          </div>
        </div>

        {/* Metric pills */}
        <div className="border-t border-slate-100 pt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Rank by</p>
          <div className="flex flex-wrap gap-2">
            {([
              ['revenue', 'Revenue', DollarSign],
              ['attendance', 'Attendance', Users],
              ['sessions', 'Sessions', BarChart3],
              ['booked', 'Booked', Users],
              ['fill', 'Fill Rate', Percent],
              ['booking-rate', 'Booking Rate', TrendingUp],
              ['show-up', 'Show-up Rate', Users],
              ['no-show', 'No-show Rate', Activity],
              ['late-cancel', 'Late Cancel Rate', Activity],
              ['rev-per-session', 'Rev / Session', DollarSign],
              ['rev-per-attendee', 'Rev / Attendee', DollarSign],
            ] as Array<[MetricType, string, React.ComponentType<{ className?: string }>]>).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMetric(value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                  metric === value
                    ? 'border-blue-700 bg-blue-700 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedFormat && formatSessions.length > 0 && (
        <>
          {/* Summary stat chips */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', card.accent)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 leading-tight">{card.label}</p>
                  </div>
                  <p className="text-xl font-extrabold tabular-nums text-slate-900">{card.value}</p>
                </div>
              );
            })}
          </div>

          {/* Best performers */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {bestPerformers.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  <p className="text-base font-bold text-slate-900">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.subvalue}</p>
                </div>
              );
            })}
          </div>

          {/* Combined breakdown table with tabs */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-5 py-4 text-white">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-bold">Breakdown · {selectedFormat}</h4>
                  <p className="text-[11px] text-white/60">Sorted by {metric.replace(/-/g, ' ')}</p>
                </div>
                {/* Tab switcher in header */}
                <div className="inline-flex rounded-xl border border-white/20 bg-white/10 p-0.5 gap-0.5">
                  {BREAKDOWN_TABS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBreakdownTab(value)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                        breakdownTab === value
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-white/70 hover:text-white'
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {activeRows.length > 0 ? (
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                      <th className="border-b border-slate-200 px-4 py-3 text-left sticky left-0 bg-slate-50 min-w-[200px] w-[200px]">
                        {breakdownTab === 'trainer' ? 'Trainer' : breakdownTab === 'time' ? 'Time Slot' : 'Day'}
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">Sessions</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">Attendance</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">Booked</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">Fill %</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">Booking %</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">Show-up %</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">No-show %</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">LC %</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">Avg/Class</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Revenue</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Rev/Class</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Rev/Att</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">Empty</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {activeRows.map((row, i) => (
                      <tr key={row.name} className={cn('h-[44px] border-b border-slate-100 transition-colors hover:bg-slate-50/80', i % 2 === 1 && 'bg-slate-50/40')}>
                        <td className="px-4 py-2 sticky left-0 bg-inherit min-w-[200px] w-[200px]">
                          {breakdownTab === 'trainer'
                            ? <TrainerNameCell name={row.name} className="min-w-0" />
                            : <span className="font-semibold text-slate-900 text-sm">{row.name}</span>
                          }
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums text-slate-700">{formatNumber(row.sessions)}</td>
                        <td className="px-3 py-2 text-center tabular-nums text-slate-700">{formatNumber(row.checkins)}</td>
                        <td className="px-3 py-2 text-center tabular-nums text-slate-700">{formatNumber(row.booked)}</td>
                        <td className="px-3 py-2 text-center tabular-nums text-slate-700">{formatPercentage(row.fillRate)}</td>
                        <td className="px-3 py-2 text-center tabular-nums text-slate-700">{formatPercentage(row.bookingRate)}</td>
                        <td className="px-3 py-2 text-center tabular-nums text-emerald-700 font-semibold">{formatPercentage(row.showUpRate)}</td>
                        <td className="px-3 py-2 text-center tabular-nums text-amber-700">{formatPercentage(row.noShowRate)}</td>
                        <td className="px-3 py-2 text-center tabular-nums text-red-600">{formatPercentage(row.lateCancelRate)}</td>
                        <td className="px-3 py-2 text-center tabular-nums font-semibold text-blue-700">{formatNumber(row.avgAttendance)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-900">{formatCurrency(row.revenue)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-700">{formatCurrency(row.revPerSession)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-700">{formatCurrency(row.revPerAttendee)}</td>
                        <td className="px-3 py-2 text-center tabular-nums text-slate-500">{formatNumber(row.emptyClasses)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-sm text-slate-400">No data for this breakdown.</div>
              )}
            </div>
          </div>
        </>
      )}

      {selectedFormat && formatSessions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-400">
          No data available for the selected format.
        </div>
      )}
    </div>
  );
};

export default DetailedComparisonView;
