import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar,
} from 'recharts';
import {
  DollarSign, Users, Activity, Target, TrendingUp, TrendingDown,
  Zap, AlertTriangle, CheckCircle, ArrowRight, RefreshCw, Flame,
  BarChart2, Shield, Clock, Star, FileText, ChevronRight,
  Sparkles, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import { AutoCloseFilterSection } from './AutoCloseFilterSection';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { useLocationReportData } from '@/hooks/useLocationReportData';
import { useSalesData } from '@/hooks/useSalesData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { parseDate } from '@/utils/dateUtils';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import type { LocationReportNarrative } from '@/services/geminiService';

interface LocationReportComprehensiveProps {
  onReady?: () => void;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy: '#07111F',
  navyCard: '#0E1A2E',
  navyMid: '#132036',
  navyLight: '#1A2942',
  gold: '#D4AF37',
  goldLight: '#F0D060',
  goldDim: '#A88820',
  cream: '#F5F0E8',
  muted: '#8A97B0',
  green: '#10B981',
  greenLight: '#34D399',
  red: '#EF4444',
  redLight: '#F87171',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  teal: '#14B8A6',
  rose: '#F43F5E',
};

// ── Number formatting ─────────────────────────────────────────────────────────
const fmt = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};
const pct = (n: number, d = 1) => `${(n || 0).toFixed(d)}%`;

// ── Sub-components ────────────────────────────────────────────────────────────

const DeltaBadge: React.FC<{ value: number; inverse?: boolean; size?: 'sm' | 'md' }> = ({
  value, inverse = false, size = 'sm',
}) => {
  const good = inverse ? value <= 0 : value >= 0;
  const abs = Math.abs(value).toFixed(1);
  const Icon = value === 0 ? Minus : good ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-bold ${size === 'md' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'}`}
      style={{ background: good ? `${C.green}18` : `${C.red}18`, color: good ? C.greenLight : C.redLight }}
    >
      <Icon size={size === 'md' ? 11 : 9} />
      {abs}%
    </span>
  );
};

const MetricCard: React.FC<{
  label: string; value: string; sub?: string;
  mom?: number; icon: React.ReactNode; accent?: string; inverse?: boolean; large?: boolean;
}> = ({ label, value, sub, mom, icon, accent = C.gold, inverse = false, large = false }) => (
  <div
    className="rounded-2xl p-4 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
    style={{ background: C.navyCard, border: `1px solid ${accent}1A` }}
  >
    <div
      className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
      style={{ background: accent, filter: 'blur(20px)', opacity: 0.07 }}
    />
    <div className="flex items-start justify-between mb-3">
      <div className="p-1.5 rounded-lg" style={{ background: `${accent}18` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      {mom !== undefined && <DeltaBadge value={mom} inverse={inverse} />}
    </div>
    <div
      className={`font-black tracking-tight mb-0.5 ${large ? 'text-3xl' : 'text-2xl'}`}
      style={{ color: C.cream }}
    >
      {value}
    </div>
    {sub && <div className="text-[11px] leading-tight" style={{ color: C.muted }}>{sub}</div>}
    <div
      className="text-[10px] font-bold tracking-widest uppercase mt-2"
      style={{ color: `${C.muted}80` }}
    >
      {label}
    </div>
  </div>
);

const NarrativeBlock: React.FC<{
  title: string; icon: React.ReactNode; accentColor: string;
  text: string; loading?: boolean;
}> = ({ title, icon, accentColor, text, loading }) => (
  <div
    className="rounded-2xl p-5"
    style={{ background: C.navyCard, border: `1px solid ${accentColor}18` }}
  >
    <div className="flex items-center gap-2 mb-3">
      <span style={{ color: accentColor }}>{icon}</span>
      <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: accentColor }}>
        {title}
      </span>
    </div>
    {loading ? (
      <div className="space-y-2">
        {[100, 85, 92].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-full animate-pulse"
            style={{ width: `${w}%`, background: `${C.cream}08` }}
          />
        ))}
      </div>
    ) : (
      <p className="text-[13px] leading-[1.75] whitespace-pre-line" style={{ color: `${C.cream}75` }}>
        {text}
      </p>
    )}
  </div>
);

const InsightPill: React.FC<{ type: 'win' | 'risk' | 'watch'; text: string }> = ({ type, text }) => {
  const cfg = {
    win:   { icon: <CheckCircle size={13} />, color: C.green,  bg: `${C.green}0D`,  border: `${C.green}22`  },
    risk:  { icon: <AlertTriangle size={13} />, color: C.red, bg: `${C.red}0D`,    border: `${C.red}22`    },
    watch: { icon: <Zap size={13} />,           color: C.gold, bg: `${C.gold}0D`,   border: `${C.gold}22`   },
  }[type];
  return (
    <div
      className="flex items-start gap-2.5 p-3 rounded-xl"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span className="mt-0.5 shrink-0" style={{ color: cfg.color }}>{cfg.icon}</span>
      <p className="text-[13px] leading-relaxed" style={{ color: `${C.cream}80` }}>{text}</p>
    </div>
  );
};

const ManagementLine: React.FC<{ line: string; loading?: boolean }> = ({ line, loading }) => {
  const LINE_COLORS: Record<string, string> = {
    Read: C.gold, Driver: C.blue, Demand: C.teal,
    Acquisition: C.green, Retention: C.orange, Action: C.rose,
  };
  const prefix = ['Read', 'Driver', 'Demand', 'Acquisition', 'Retention', 'Action'].find(
    p => line.startsWith(`${p}:`),
  );
  const color = prefix ? LINE_COLORS[prefix] : C.muted;
  const body = prefix ? line.slice(prefix.length + 1).trim() : line;

  if (loading) {
    return (
      <div className="flex items-start gap-3 py-4 border-b" style={{ borderColor: `${C.cream}06` }}>
        <div className="w-24 h-4 rounded animate-pulse" style={{ background: `${C.cream}08` }} />
        <div className="flex-1 h-4 rounded animate-pulse" style={{ background: `${C.cream}06` }} />
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-3 py-4 border-b last:border-0"
      style={{ borderColor: `${C.cream}06` }}
    >
      {prefix && (
        <span
          className="text-[10px] font-black tracking-widest uppercase shrink-0 mt-0.5 w-24 pt-0.5"
          style={{ color }}
        >
          {prefix}
        </span>
      )}
      <p className="text-[13px] leading-relaxed flex-1" style={{ color: `${C.cream}75` }}>
        {body}
      </p>
    </div>
  );
};

const ChartTip = ({ active, payload, label, isCurrency = false }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl p-3 shadow-xl text-xs"
      style={{ background: C.navyMid, border: `1px solid ${C.gold}30` }}
    >
      <div className="font-semibold mb-1.5" style={{ color: C.gold }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.stroke || p.fill }} />
          <span style={{ color: C.cream }}>
            {p.name}: {isCurrency ? fmt(p.value) : typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
            {!isCurrency && p.name?.toLowerCase().includes('rate') ? '%' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

const FunnelBar: React.FC<{ label: string; value: number; max: number; note: string; color: string }> = ({
  label, value, max, note, color,
}) => {
  const w = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold" style={{ color: `${C.cream}75` }}>{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: C.muted }}>{note}</span>
          <span className="font-black text-base" style={{ color: C.cream }}>{formatNumber(value)}</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: `${C.cream}08` }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${w}%`, background: `linear-gradient(90deg, ${color}, ${color}80)` }}
        />
      </div>
    </div>
  );
};

const SectionDivider: React.FC<{ label: string; icon: React.ReactNode; color: string }> = ({
  label, icon, color,
}) => (
  <div className="flex items-center gap-3 py-2">
    <div className="p-1.5 rounded-lg" style={{ background: `${color}15` }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <span className="text-[11px] font-black tracking-widest uppercase" style={{ color }}>
      {label}
    </span>
    <div className="flex-1 h-px" style={{ background: `${color}18` }} />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export const LocationReportComprehensive: React.FC<LocationReportComprehensiveProps> = ({ onReady }) => {
  const { filters: globalFilters, updateFilters, clearFilters } = useGlobalFilters();
  const { metrics, isLoading, generateFullReport } = useLocationReportData();
  const { data: salesData = [] } = useSalesData();
  const { data: sessionsData = [] } = useSessionsData();

  const [report, setReport] = React.useState<LocationReportNarrative | null>(null);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [reportError, setReportError] = React.useState(false);

  const selectedMonth = React.useMemo(() => {
    const end = new Date(`${globalFilters.dateRange.end}T00:00:00`);
    return Number.isNaN(end.getTime()) ? 'Selected month' : format(end, 'MMMM yyyy');
  }, [globalFilters.dateRange.end]);

  const selectedLocations = globalFilters.location.length ? globalFilters.location : ['All locations'];
  const locationLabel = selectedLocations.join(' · ');

  React.useEffect(() => {
    if (!isLoading && onReady) onReady();
  }, [isLoading, onReady]);

  const runReport = React.useCallback(() => {
    if (!metrics) return;
    setReportLoading(true);
    setReportError(false);
    generateFullReport()
      .then(r => { if (r) setReport(r); else setReportError(true); })
      .catch(() => setReportError(true))
      .finally(() => setReportLoading(false));
  }, [metrics, generateFullReport]);

  React.useEffect(() => {
    if (!isLoading && metrics && !report && !reportLoading) runReport();
  }, [isLoading, metrics]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 6-month revenue trend ─────────────────────────────────────────────────
  const revTrend = useMemo(() => {
    if (!salesData.length) return [];
    const anchorEnd = new Date(`${globalFilters.dateRange.end}T00:00:00`);
    if (Number.isNaN(anchorEnd.getTime())) return [];
    const anchor = endOfMonth(anchorEnd);
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(anchor, 5 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const rows = salesData.filter(s => {
        const pd = parseDate(s.paymentDate);
        return pd && pd >= start && pd <= end;
      });
      const rev = rows.reduce(
        (a, s) => a + ((Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0)),
        0,
      );
      return { label: format(d, 'MMM'), revenue: rev, txns: rows.length };
    });
  }, [salesData, globalFilters.dateRange.end]);

  // ── 6-month fill rate trend ───────────────────────────────────────────────
  const fillTrend = useMemo(() => {
    if (!sessionsData.length) return [];
    const anchorEnd = new Date(`${globalFilters.dateRange.end}T00:00:00`);
    if (Number.isNaN(anchorEnd.getTime())) return [];
    const anchor = endOfMonth(anchorEnd);
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(anchor, 5 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const rows = sessionsData.filter(s => {
        const pd = parseDate(s.date);
        return pd && pd >= start && pd <= end;
      });
      const checkins = rows.reduce((a, s) => a + (Number(s.checkedInCount) || 0), 0);
      const cap = rows.reduce((a, s) => a + (Number(s.capacity) || 0), 0);
      return {
        label: format(d, 'MMM'),
        fillRate: cap > 0 ? parseFloat(((checkins / cap) * 100).toFixed(1)) : 0,
      };
    });
  }, [sessionsData, globalFilters.dateRange.end]);

  // ── Health score ──────────────────────────────────────────────────────────
  const health = useMemo(() => {
    if (!metrics) return { score: 0, grade: 'D' as const, color: C.red, label: 'No Data' };
    const s = metrics.overallScore || 0;
    if (s >= 80) return { score: s, grade: 'A' as const, color: C.green, label: 'Excellent' };
    if (s >= 65) return { score: s, grade: 'B' as const, color: C.gold, label: 'Good' };
    if (s >= 50) return { score: s, grade: 'C' as const, color: C.orange, label: 'Needs Attention' };
    return { score: s, grade: 'D' as const, color: C.red, label: 'At Risk' };
  }, [metrics]);

  // ── Format data ───────────────────────────────────────────────────────────
  const formats = useMemo(() => {
    if (!metrics) return [];
    const total = (metrics.barreSessions || 0) + (metrics.powerCycleSessions || 0) + (metrics.strengthSessions || 0);
    return [
      { name: 'Barre', sessions: metrics.barreSessions || 0, color: C.purple, share: total > 0 ? ((metrics.barreSessions || 0) / total) * 100 : 0 },
      { name: 'PowerCycle', sessions: metrics.powerCycleSessions || 0, color: C.blue, share: total > 0 ? ((metrics.powerCycleSessions || 0) / total) * 100 : 0 },
      { name: 'Strength', sessions: metrics.strengthSessions || 0, color: C.rose, share: total > 0 ? ((metrics.strengthSessions || 0) / total) * 100 : 0 },
    ].filter(f => f.sessions > 0);
  }, [metrics]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading || !metrics) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: C.navy }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: `${C.gold}12`, border: `2px solid ${C.gold}30` }}
        >
          <RefreshCw size={22} style={{ color: C.gold }} className="animate-spin" />
        </div>
        <p className="text-sm" style={{ color: C.muted }}>Building {selectedMonth} report…</p>
      </div>
    );
  }

  const m = metrics;
  const funnelMax = Math.max(m.totalLeads, m.newClientsAcquired, 1);
  const ringC = 2 * Math.PI * 38;
  const ringProg = (health.score / 100) * ringC;

  return (
    <div className="min-h-screen" style={{ background: C.navy, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Filters bar ── */}
      <div style={{ background: C.navyCard, borderBottom: `1px solid ${C.gold}12` }}>
        <div className="max-w-7xl mx-auto px-6 py-3">
          <AutoCloseFilterSection filters={globalFilters} onFiltersChange={updateFilters} onReset={clearFilters} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — Location + period + AI verdict
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${C.navyCard} 0%, ${C.navyMid} 60%, ${C.navy} 100%)`,
          borderBottom: `1px solid ${C.gold}15`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 600px 400px at 80% -20%, ${C.gold}07 0%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase"
                  style={{ background: `${C.gold}12`, border: `1px solid ${C.gold}30`, color: C.gold }}
                >
                  <Star size={9} /> Monthly Performance Report
                </span>
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    background: `${health.color}12`,
                    color: health.color,
                    border: `1px solid ${health.color}30`,
                  }}
                >
                  {health.label}
                </span>
              </div>

              <h1
                className="text-4xl font-black tracking-tight mb-1"
                style={{ color: C.cream, letterSpacing: '-0.025em' }}
              >
                {locationLabel}
              </h1>
              <p className="text-base font-light mb-5" style={{ color: `${C.cream}45` }}>
                {selectedMonth}
              </p>

              {/* Overall verdict — the most prominent AI output */}
              {reportLoading && !report ? (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1">
                    {[0,1,2,3].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: C.gold, animationDelay: `${i * 0.1}s`, opacity: 0.7 }}
                      />
                    ))}
                  </div>
                  <span className="text-sm" style={{ color: `${C.cream}40` }}>AI is analysing {selectedMonth}…</span>
                </div>
              ) : report?.overallVerdict ? (
                <div
                  className="rounded-xl px-4 py-3 max-w-2xl"
                  style={{
                    background: `${C.gold}08`,
                    border: `1px solid ${C.gold}20`,
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: C.gold }} />
                    <p
                      className="text-[14px] leading-relaxed font-medium"
                      style={{ color: `${C.cream}80` }}
                    >
                      {report.overallVerdict}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Health ring + top metrics */}
            <div className="flex items-center gap-5 shrink-0">
              <div className="relative">
                <svg width="86" height="86" viewBox="0 0 86 86">
                  <circle cx="43" cy="43" r="38" fill="none" stroke={`${health.color}12`} strokeWidth="7" />
                  <circle
                    cx="43" cy="43" r="38" fill="none" stroke={health.color} strokeWidth="7"
                    strokeDasharray={`${ringProg} ${ringC}`} strokeLinecap="round"
                    strokeDashoffset={ringC / 4}
                  />
                  <text x="43" y="40" textAnchor="middle" fontSize="19" fontWeight="900" fill={health.color}>
                    {health.score}
                  </text>
                  <text x="43" y="53" textAnchor="middle" fontSize="7.5" fontWeight="600" fill={`${C.cream}45`} letterSpacing="2">
                    HEALTH
                  </text>
                </svg>
              </div>
              <div className="space-y-3 text-right">
                <div>
                  <div className="text-2xl font-black" style={{ color: C.gold }}>{fmt(m.netRevenue)}</div>
                  <div className="text-xs" style={{ color: C.muted }}>Net Revenue</div>
                </div>
                <div>
                  <div className="text-xl font-black" style={{ color: C.cream }}>{pct(m.fillRate)}</div>
                  <div className="text-xs" style={{ color: C.muted }}>Fill Rate</div>
                </div>
              </div>
              <button
                onClick={runReport}
                disabled={reportLoading}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 self-start"
                style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}28`, color: C.gold }}
              >
                <RefreshCw size={10} className={reportLoading ? 'animate-spin' : ''} />
                {reportLoading ? 'Generating…' : 'Refresh AI'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          REPORT BODY
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* ── 1. AI Management Cockpit ── */}
        <section>
          <SectionDivider label="AI Management Readout" icon={<Zap size={14} />} color={C.gold} />
          <div
            className="mt-3 rounded-2xl overflow-hidden"
            style={{ background: C.navyCard, border: `1px solid ${C.gold}20` }}
          >
            {reportLoading && !report ? (
              <div className="px-7 py-6 space-y-0">
                {['Read', 'Driver', 'Demand', 'Acquisition', 'Retention', 'Action'].map(p => (
                  <ManagementLine key={p} line={`${p}: loading…`} loading />
                ))}
              </div>
            ) : report?.managementLines?.length ? (
              <div className="px-7 py-1">
                {report.managementLines.map((line, i) => (
                  <ManagementLine key={i} line={line} />
                ))}
              </div>
            ) : (
              <div className="px-7 py-6 text-center">
                <p className="text-sm" style={{ color: `${C.muted}70` }}>
                  {reportError
                    ? 'AI readout unavailable — metrics below are accurate.'
                    : 'AI readout will appear here once analysis completes.'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── 2. Executive Summary ── */}
        {(reportLoading || report?.executiveSummary) && (
          <section>
            <SectionDivider label="Executive Summary" icon={<FileText size={14} />} color={C.blue} />
            <div className="mt-3">
              <NarrativeBlock
                title="Executive Summary"
                icon={<FileText size={14} />}
                accentColor={C.blue}
                text={report?.executiveSummary || ''}
                loading={reportLoading && !report}
              />
            </div>
          </section>
        )}

        {/* ── 3. Core KPI Grid ── */}
        <section>
          <SectionDivider label="Key Performance Metrics" icon={<BarChart2 size={14} />} color={C.teal} />
          <div className="mt-3 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <MetricCard
              label="Net Revenue" value={fmt(m.netRevenue)}
              sub={`${formatNumber(m.totalTransactions)} transactions`}
              mom={m.revenueGrowth} icon={<DollarSign size={15} />} accent={C.gold}
            />
            <MetricCard
              label="Fill Rate" value={pct(m.fillRate)}
              sub={`${(m.avgClassSize || 0).toFixed(1)} avg class size`}
              icon={<BarChart2 size={15} />} accent={C.blue}
            />
            <MetricCard
              label="New Clients" value={formatNumber(m.newClientsAcquired)}
              sub="first visits this period"
              icon={<Users size={15} />} accent={C.green}
            />
            <MetricCard
              label="Conversion" value={pct(m.conversionRate)}
              sub={`${formatNumber(m.leadsConverted)} converted`}
              icon={<Target size={15} />} accent={C.teal}
            />
            <MetricCard
              label="Churn Rate" value={pct(m.churnRate)}
              sub={`${formatNumber(m.churnedMembers)} lapsed members`}
              icon={<Flame size={15} />} accent={C.rose} inverse
            />
            <MetricCard
              label="Late Cancels" value={formatNumber(m.lateCancellations)}
              sub="this period"
              icon={<Clock size={15} />} accent={C.orange} inverse
            />
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Avg Txn Value" value={fmt(m.avgTransactionValue)}
              sub="per transaction"
              icon={<DollarSign size={15} />} accent={C.teal}
            />
            <MetricCard
              label="Discount Rate" value={pct(m.discountRate)}
              sub={`${fmt(m.totalDiscounts)} given`}
              icon={<Shield size={15} />} accent={C.orange} inverse
            />
            <MetricCard
              label="Retention Rate" value={pct(m.retentionRate)}
              sub="members retained"
              icon={<TrendingUp size={15} />} accent={C.green}
            />
            <MetricCard
              label="Unique Members" value={formatNumber(m.uniqueMembers)}
              sub={`${fmt(m.avgSpendPerMember)} avg spend`}
              icon={<Users size={15} />} accent={C.purple}
            />
          </div>
        </section>

        {/* ── 4. Highlights & Concerns ── */}
        {(reportLoading || report?.highlights?.length || report?.concerns?.length) ? (
          <section>
            <SectionDivider label="Wins & Watch Points" icon={<Sparkles size={14} />} color={C.green} />
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div
                className="rounded-2xl p-5"
                style={{ background: C.navyCard, border: `1px solid ${C.green}18` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={13} style={{ color: C.green }} />
                  <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: C.green }}>
                    Highlights
                  </span>
                </div>
                {reportLoading && !report ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: `${C.cream}05` }} />
                    ))}
                  </div>
                ) : report?.highlights?.length ? (
                  <div className="space-y-2">
                    {report.highlights.map((h, i) => <InsightPill key={i} type="win" text={h} />)}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: `${C.muted}60` }}>No highlights identified.</p>
                )}
              </div>

              <div
                className="rounded-2xl p-5"
                style={{ background: C.navyCard, border: `1px solid ${C.red}18` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={13} style={{ color: C.red }} />
                  <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: C.red }}>
                    Watch Points
                  </span>
                </div>
                {reportLoading && !report ? (
                  <div className="space-y-2">
                    {[1,2].map(i => (
                      <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: `${C.cream}05` }} />
                    ))}
                  </div>
                ) : report?.concerns?.length ? (
                  <div className="space-y-2">
                    {report.concerns.map((c, i) => <InsightPill key={i} type="risk" text={c} />)}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: `${C.muted}60` }}>No concerns flagged.</p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {/* ── 5. Revenue Trend + Narrative ── */}
        <section>
          <SectionDivider label="Revenue Performance" icon={<DollarSign size={14} />} color={C.gold} />
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div
              className="lg:col-span-3 rounded-2xl p-5"
              style={{ background: C.navyCard, border: `1px solid ${C.gold}18` }}
            >
              <div className="text-[11px] font-bold tracking-widest uppercase mb-4" style={{ color: C.gold }}>
                6-Month Revenue Trend
              </div>
              {revTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revTrend}>
                    <defs>
                      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.gold} stopOpacity={0.22} />
                        <stop offset="95%" stopColor={C.gold} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={`${C.cream}05`} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: `${C.cream}40` }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: `${C.cream}30` }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={55} />
                    <Tooltip content={(p: any) => <ChartTip {...p} isCurrency />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.gold} strokeWidth={2.5}
                      fill="url(#rg)" dot={{ fill: C.gold, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: `${C.cream}20` }}>
                  No revenue trend data available
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <NarrativeBlock
                title="Revenue Analysis"
                icon={<DollarSign size={14} />}
                accentColor={C.gold}
                text={report?.revenueNarrative || ''}
                loading={reportLoading && !report}
              />
            </div>
          </div>
        </section>

        {/* ── 6. Operations Trend + Narrative ── */}
        <section>
          <SectionDivider label="Operations & Capacity" icon={<Activity size={14} />} color={C.blue} />
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2">
              <NarrativeBlock
                title="Operations Analysis"
                icon={<Activity size={14} />}
                accentColor={C.blue}
                text={report?.operationsNarrative || ''}
                loading={reportLoading && !report}
              />
            </div>

            <div
              className="lg:col-span-3 rounded-2xl p-5"
              style={{ background: C.navyCard, border: `1px solid ${C.blue}18` }}
            >
              <div className="text-[11px] font-bold tracking-widest uppercase mb-4" style={{ color: C.blue }}>
                6-Month Fill Rate Trend
              </div>
              {fillTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={fillTrend}>
                    <defs>
                      <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.blue} stopOpacity={0.22} />
                        <stop offset="95%" stopColor={C.blue} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={`${C.cream}05`} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: `${C.cream}40` }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: `${C.cream}30` }} axisLine={false} tickLine={false}
                      tickFormatter={v => `${v}%`} domain={[0, 100]} />
                    <Tooltip content={(p: any) => <ChartTip {...p} />} />
                    <Area type="monotone" dataKey="fillRate" name="Fill Rate" stroke={C.blue} strokeWidth={2.5}
                      fill="url(#fg)" dot={{ fill: C.blue, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: `${C.cream}20` }}>
                  No sessions trend data available
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 7. Acquisition Funnel + Client Narrative ── */}
        <section>
          <SectionDivider label="Client Acquisition & Funnel" icon={<Target size={14} />} color={C.green} />
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div
              className="lg:col-span-3 rounded-2xl p-6"
              style={{ background: C.navyCard, border: `1px solid ${C.green}18` }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Leads',       value: formatNumber(m.totalLeads),          color: C.blue },
                  { label: 'First Visits', value: formatNumber(m.newClientsAcquired), color: C.teal },
                  { label: 'Converted',   value: formatNumber(m.leadsConverted),       color: C.green },
                  { label: 'Lead CVR',    value: pct(m.leadConversionRate),            color: C.gold },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: `${color}0D`, border: `1px solid ${color}1A` }}
                  >
                    <div className="text-xl font-black mb-0.5" style={{ color }}>{value}</div>
                    <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: `${C.cream}45` }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <FunnelBar label="Leads Received" value={m.totalLeads} max={funnelMax} note="top of funnel" color={C.blue} />
                <FunnelBar
                  label="Trial / First Visit" value={m.newClientsAcquired} max={funnelMax}
                  note={m.totalLeads > 0 ? `${pct((m.newClientsAcquired / m.totalLeads) * 100)} of leads` : '—'}
                  color={C.teal}
                />
                <FunnelBar
                  label="Converted to Member" value={m.leadsConverted} max={funnelMax}
                  note={`${pct(m.conversionRate)} cvr`}
                  color={C.green}
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <NarrativeBlock
                title="Client & Retention Analysis"
                icon={<Users size={14} />}
                accentColor={C.green}
                text={report?.clientNarrative || ''}
                loading={reportLoading && !report}
              />
            </div>
          </div>
        </section>

        {/* ── 8. Class Format Split ── */}
        {formats.length > 0 && (
          <section>
            <SectionDivider label="Class Format Split" icon={<Activity size={14} />} color={C.purple} />
            <div
              className="mt-3 rounded-2xl p-6"
              style={{ background: C.navyCard, border: `1px solid ${C.purple}18` }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {formats.map(f => (
                  <div
                    key={f.name}
                    className="rounded-xl p-4"
                    style={{ background: `${f.color}0D`, border: `1px solid ${f.color}22` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: f.color }}>
                        {f.name}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: `${C.cream}50` }}>
                        {pct(f.share, 0)}
                      </span>
                    </div>
                    <div className="text-2xl font-black mb-2" style={{ color: C.cream }}>
                      {formatNumber(f.sessions)}
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${C.cream}08` }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${f.share}%`, background: `linear-gradient(90deg, ${f.color}, ${f.color}70)` }}
                      />
                    </div>
                    <div className="text-[11px] mt-1.5" style={{ color: C.muted }}>of total sessions</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={formats} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${C.cream}05`} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: `${C.cream}30` }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: `${C.cream}50` }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="sessions" name="Sessions" radius={[0, 4, 4, 0]}>
                    {formats.map((f, i) => <Cell key={i} fill={f.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ── 9. Trainer Spotlight ── */}
        {m.topTrainerName && m.topTrainerName !== 'N/A' && (
          <section>
            <SectionDivider label="Trainer Spotlight" icon={<Star size={14} />} color={C.gold} />
            <div
              className="mt-3 rounded-2xl p-6"
              style={{ background: C.navyCard, border: `1px solid ${C.gold}18` }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Top Performer', value: m.topTrainerName, color: C.gold },
                  { label: 'Revenue Attributed', value: fmt(m.topTrainerRevenue), color: C.gold },
                  { label: 'Active Trainers', value: formatNumber(m.totalTrainers), color: C.cream },
                  { label: 'Revenue / Trainer', value: fmt(m.revenuePerTrainer), color: C.cream },
                  { label: 'Avg Class Size', value: (m.avgClassSize || 0).toFixed(1), color: C.cream },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <div className="text-xl font-black mb-1" style={{ color }}>{value}</div>
                    <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: `${C.muted}90` }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 10. Strategic Recommendations ── */}
        {(reportLoading || report?.recommendations?.length) ? (
          <section>
            <SectionDivider label="Strategic Actions" icon={<ArrowRight size={14} />} color={C.gold} />
            <div
              className="mt-3 rounded-2xl p-6"
              style={{ background: C.navyCard, border: `1px solid ${C.gold}18` }}
            >
              {reportLoading && !report ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: `${C.cream}05` }} />
                  ))}
                </div>
              ) : report?.recommendations?.length ? (
                <div className="space-y-3">
                  {report.recommendations.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 rounded-xl"
                      style={{ background: `${C.gold}07`, border: `1px solid ${C.gold}15` }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black"
                        style={{ background: `${C.gold}18`, color: C.gold }}
                      >
                        {i + 1}
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ color: `${C.cream}78` }}>{r}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ── Footer ── */}
        <footer
          className="pt-6 pb-10 flex items-center justify-between flex-wrap gap-3"
          style={{ borderTop: `1px solid ${C.gold}0E` }}
        >
          <p className="text-xs" style={{ color: `${C.cream}22` }}>
            Physique 57 · {locationLabel} · {selectedMonth} · AI insights by Gemini
          </p>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: `${health.color}0D`, border: `1px solid ${health.color}18` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: health.color }} />
            <span className="text-xs font-semibold" style={{ color: health.color }}>
              {health.score}/100 · {health.grade} · {health.label}
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
};
