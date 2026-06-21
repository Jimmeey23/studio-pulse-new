import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { PayrollData } from '@/types/dashboard';
import { formatNumber, formatPercentage } from '@/utils/formatters';

interface ClassAttendanceMonthOnMonthTableProps {
  data: SessionData[];
  payrollData?: PayrollData[];
  location?: string;
}

interface MonthStats {
  month: string;
  sessions: number;
  capacity: number;
  attendance: number;
  revenue: number;
  booked: number;
  lateCancelled: number;
  emptySessions: number;
  formatCount: number;
  fillRate: number;
  showUpRate: number;
  utilizationRate: number;
  avgRevenue: number;
  revenuePerAttendee: number;
  lateCancelRate: number;
  avgAttendancePerSession: number;
  avgBookedPerSession: number;
  capacityPerSession: number;
  pctEmpty: number;
}

interface MetricDef {
  id: keyof Omit<MonthStats, 'month'>;
  label: string;
  group: string;
  fmt: (v: number) => string;
  higherIsBetter?: boolean;
  goodThreshold?: number;
  badThreshold?: number;
}

const METRICS: MetricDef[] = [
  // Attendance & capacity
  { id: 'attendance',           label: 'Attendance',               group: 'Volume',      fmt: (v) => formatNumber(Math.round(v)) },
  { id: 'sessions',             label: 'Sessions',                 group: 'Volume',      fmt: (v) => formatNumber(Math.round(v)) },
  { id: 'capacity',             label: 'Capacity (total spots)',   group: 'Volume',      fmt: (v) => formatNumber(Math.round(v)) },
  { id: 'booked',               label: 'Booked',                   group: 'Volume',      fmt: (v) => formatNumber(Math.round(v)) },
  { id: 'lateCancelled',        label: 'Late Cancelled',           group: 'Volume',      fmt: (v) => formatNumber(Math.round(v)), higherIsBetter: false },
  { id: 'emptySessions',        label: 'Empty Sessions',           group: 'Volume',      fmt: (v) => formatNumber(Math.round(v)), higherIsBetter: false },
  { id: 'formatCount',          label: 'Format Count',             group: 'Volume',      fmt: (v) => formatNumber(Math.round(v)) },
  // Rates
  { id: 'fillRate',             label: 'Fill Rate %',              group: 'Rates',       fmt: (v) => formatPercentage(v), higherIsBetter: true,  goodThreshold: 80, badThreshold: 50 },
  { id: 'showUpRate',           label: 'Show-Up Rate %',           group: 'Rates',       fmt: (v) => formatPercentage(v), higherIsBetter: true,  goodThreshold: 85, badThreshold: 65 },
  { id: 'utilizationRate',      label: 'Utilization Rate %',       group: 'Rates',       fmt: (v) => formatPercentage(v), higherIsBetter: true,  goodThreshold: 90, badThreshold: 70 },
  { id: 'lateCancelRate',       label: 'Late Cancel Rate %',       group: 'Rates',       fmt: (v) => formatPercentage(v), higherIsBetter: false, goodThreshold: 5,  badThreshold: 15 },
  { id: 'pctEmpty',             label: 'Empty Session Rate %',     group: 'Rates',       fmt: (v) => formatPercentage(v), higherIsBetter: false, goodThreshold: 5,  badThreshold: 20 },
  // Per-session averages
  { id: 'avgAttendancePerSession', label: 'Avg Attendance / Session', group: 'Averages', fmt: (v) => v.toFixed(1) },
  { id: 'avgBookedPerSession',     label: 'Avg Booked / Session',     group: 'Averages', fmt: (v) => v.toFixed(1) },
  { id: 'capacityPerSession',      label: 'Avg Capacity / Session',   group: 'Averages', fmt: (v) => v.toFixed(1) },
  // Revenue
  { id: 'revenue',              label: 'Revenue',                  group: 'Revenue',     fmt: (v) => `₹${formatNumber(Math.round(v))}` },
  { id: 'avgRevenue',           label: 'Avg Revenue / Session',    group: 'Revenue',     fmt: (v) => `₹${formatNumber(Math.round(v))}` },
  { id: 'revenuePerAttendee',   label: 'Revenue / Attendee',       group: 'Revenue',     fmt: (v) => `₹${formatNumber(Math.round(v))}` },
];

const GROUP_COLORS: Record<string, string> = {
  Volume:   'bg-slate-100 text-slate-600',
  Rates:    'bg-blue-50 text-blue-700',
  Averages: 'bg-violet-50 text-violet-700',
  Revenue:  'bg-emerald-50 text-emerald-700',
};

export const ClassAttendanceMonthOnMonthTable: React.FC<ClassAttendanceMonthOnMonthTableProps> = ({ data }) => {
  const monthlyStats = useMemo((): MonthStats[] => {
    if (!data || data.length === 0) return [];

    const acc: Record<string, { sessions: number; capacity: number; attendance: number; revenue: number; booked: number; lateCancelled: number; emptySessions: number; formats: Set<string> }> = {};

    data.forEach((session) => {
      const date = new Date(session.date);
      if (isNaN(date.getTime())) return;
      const mk = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[mk]) {
        acc[mk] = { sessions: 0, capacity: 0, attendance: 0, revenue: 0, booked: 0, lateCancelled: 0, emptySessions: 0, formats: new Set() };
      }
      const s = acc[mk];
      s.sessions += 1;
      s.capacity += session.capacity || 0;
      s.attendance += session.checkedInCount || 0;
      s.revenue += session.totalPaid || 0;
      s.booked += session.bookedCount || 0;
      s.lateCancelled += session.lateCancelledCount || 0;
      s.formats.add(session.cleanedClass || session.classType || 'Unknown');
      if ((session.checkedInCount || 0) === 0) s.emptySessions += 1;
    });

    return Object.entries(acc)
      .map(([month, s]) => ({
        month,
        sessions: s.sessions,
        capacity: s.capacity,
        attendance: s.attendance,
        revenue: s.revenue,
        booked: s.booked,
        lateCancelled: s.lateCancelled,
        emptySessions: s.emptySessions,
        formatCount: s.formats.size,
        fillRate: s.capacity > 0 ? (s.attendance / s.capacity) * 100 : 0,
        showUpRate: s.booked > 0 ? (s.attendance / s.booked) * 100 : 0,
        utilizationRate: s.sessions > 0 ? ((s.sessions - s.emptySessions) / s.sessions) * 100 : 0,
        avgRevenue: s.sessions > 0 ? s.revenue / s.sessions : 0,
        revenuePerAttendee: s.attendance > 0 ? s.revenue / s.attendance : 0,
        lateCancelRate: s.booked > 0 ? (s.lateCancelled / s.booked) * 100 : 0,
        avgAttendancePerSession: s.sessions > 0 ? s.attendance / s.sessions : 0,
        avgBookedPerSession: s.sessions > 0 ? s.booked / s.sessions : 0,
        capacityPerSession: s.sessions > 0 ? s.capacity / s.sessions : 0,
        pctEmpty: s.sessions > 0 ? (s.emptySessions / s.sessions) * 100 : 0,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [data]);

  const months = monthlyStats; // newest first (up to ~12 most recent for display)

  const fmtMonthLabel = (mk: string) => {
    const [year, mon] = mk.split('-');
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${MONTHS[parseInt(mon,10)-1]} '${year.slice(2)}`;
  };

  const getChange = (current: number, previous: number) => {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const getCellColor = (metric: MetricDef, value: number, change: number | null): string => {
    if (metric.goodThreshold === undefined) return '';
    const { higherIsBetter, goodThreshold, badThreshold } = metric;
    if (higherIsBetter) {
      if (value >= goodThreshold!) return 'bg-emerald-50';
      if (badThreshold && value < badThreshold) return 'bg-red-50';
      return 'bg-amber-50';
    } else {
      if (value <= goodThreshold!) return 'bg-emerald-50';
      if (badThreshold && value > badThreshold) return 'bg-red-50';
      return 'bg-amber-50';
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-6 h-6" />
            Month-on-Month Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600">No session data available for month-on-month analysis</p>
        </CardContent>
      </Card>
    );
  }

  let currentGroup = '';

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-6 h-6" />
            Month-on-Month Performance Analysis
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {months.length} months · {METRICS.length} metrics
            </Badge>
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(GROUP_COLORS).map(([group, cls]) => (
              <span key={group} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{group}</span>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr className="bg-slate-900 sticky top-0 z-20">
                <th className="sticky left-0 z-30 bg-slate-900 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-white/70 min-w-[200px] border-r border-white/10">
                  Metric
                </th>
                {months.map((ms) => (
                  <th key={ms.month} className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-white/70 min-w-[80px] border-r border-white/5">
                    {fmtMonthLabel(ms.month)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((metric, metricIdx) => {
                const showGroupHeader = metric.group !== currentGroup;
                if (showGroupHeader) currentGroup = metric.group;

                return (
                  <React.Fragment key={metric.id}>
                    {showGroupHeader && (
                      <tr>
                        <td
                          colSpan={months.length + 1}
                          className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border-t border-b border-slate-200"
                          style={{ backgroundColor: metric.group === 'Volume' ? '#f8fafc' : metric.group === 'Rates' ? '#eff6ff' : metric.group === 'Averages' ? '#f5f3ff' : '#f0fdf4' }}
                        >
                          <span className={`rounded-full px-2 py-0.5 ${GROUP_COLORS[metric.group]}`}>{metric.group}</span>
                        </td>
                      </tr>
                    )}
                    <tr className={`border-b border-slate-100 transition-colors hover:bg-slate-50/70 ${metricIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="sticky left-0 z-10 bg-inherit border-r border-slate-200 px-4 py-2.5">
                        <span className="text-[12px] font-semibold text-slate-700">{metric.label}</span>
                      </td>
                      {months.map((ms, mIdx) => {
                        const value = ms[metric.id] as number;
                        const prevMs = months[mIdx + 1];
                        const prevValue = prevMs ? (prevMs[metric.id] as number) : null;
                        const change = prevValue !== null ? getChange(value, prevValue) : null;
                        const cellBg = getCellColor(metric, value, change);

                        return (
                          <td key={ms.month} className={`px-2 py-2 text-center border-r border-slate-100 ${cellBg}`}>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[12px] font-bold text-slate-800 tabular-nums leading-tight">
                                {metric.fmt(value)}
                              </span>
                              {change !== null && (
                                <div className="flex items-center gap-0.5">
                                  {change > 0 ? (
                                    <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                                  ) : change < 0 ? (
                                    <TrendingDown className="w-2.5 h-2.5 text-red-400" />
                                  ) : (
                                    <Minus className="w-2.5 h-2.5 text-slate-300" />
                                  )}
                                  <span className={`text-[9px] font-semibold ${change > 0 ? 'text-emerald-500' : change < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
