import React, { useMemo } from 'react';

/* ──────────────────────────────────────────────────────────────
   TYPE DEFS
────────────────────────────────────────────────────────────── */
interface SalesMatrixRow {
  label: string;
  type: 'currency' | 'number' | 'percent';
  values: Record<string, number>;
}

interface TrainerRow {
  name: string;
  sessions: number;
  customers?: number;
  classAvg?: number;
  paid: number;
  fillRate: number;
  utilization: number;
  conversionRate: number;
  retentionRate: number;
  revenueScore: number;
  lateCancels: number;
  totalNew?: number;
  totalConverted?: number;
  rank?: number;
}

interface SessionRow {
  name: string;
  sessions: number;
  visits: number;
  capacity: number;
  fillRate: number;
  lateCancels: number;
  cancellationRate: number;
  compositeScore: number;
  revenue: number;
}

interface ClassSlotRow {
  name: string;
  trainer: string;
  day: string;
  time: string;
  location: string;
  sessions: number;
  visits: number;
  capacity: number;
  fillRate: number;
  lateCancels: number;
}

interface FunnelRow {
  name: string;
  leads: number;
  trials: number;
  converted: number;
  conversionRate: number;
  ltv: number;
  membershipsBought: number;
  retained?: number;
}

export interface StudioPulseReportProps {
  studioName: string;
  dateRange: { start: string; end: string };
  salesStats: {
    gross: number; net: number; txns: number; members: number;
    discount: number; discountPenetration: number; atv: number;
    growth: { net: number; gross: number; txns: number; members: number };
  };
  sessionStats: { totalSessions: number; attendance: number; avgFill: number; empty?: number };
  sessionIntelligenceRows: SessionRow[];
  classSlotRows?: ClassSlotRow[];
  trainerRows: TrainerRow[];
  clientStats: {
    newClients: number; converted: number; retained: number;
    conversionRate: number; retentionRate: number; avgLtv: number;
    lapsed?: number;
  };
  funnelRows: FunnelRow[];
  lcStats: { total: number; sameDay: number; penalty: number };
  expirationStats: {
    total: number; lapsed: number; renewed: number;
    churned: number; lapsedPct: number; avgLtvLapsed: number;
  };
  lapsedByMembership: Array<{ name: string; count: number }>;
  salesMatrix: { months: string[]; monthLabels: Record<string, string>; metricRows: SalesMatrixRow[] };
  getSummary?: (key: string) => { bullets?: string[] } | null;
  sectionEdits?: Record<string, string>;
  onClose: () => void;
}

/* ──────────────────────────────────────────────────────────────
   STYLE CONSTANTS
────────────────────────────────────────────────────────────── */
const C = {
  navy:      '#030d18',
  navyMid:   '#071e36',
  navyLight: '#0e3054',
  blue:      '#1a6eb5',
  blueLight: '#4e9de0',
  bluePale:  'rgba(26,110,181,.08)',
  yellow:    '#e8b94f',
  red:       '#c53030',
  redPale:   'rgba(197,48,48,.06)',
  green:     '#276749',
  greenPale: 'rgba(39,103,73,.07)',
  warn:      '#c05621',
  warnPale:  'rgba(192,86,33,.07)',
  surface:   '#ffffff',
  surface2:  '#f7f9fc',
  border:    '#e2e8f0',
  border2:   '#c8d4e3',
  text:      '#111827',
  text2:     '#1f2937',
  textMuted: '#374151',
  textLight: '#6b7280',
  textVeryLight: '#9ca3af',
};

const T = {
  serif: 'Georgia, "Times New Roman", serif',
  sans:  '"Helvetica Neue", Helvetica, Arial, sans-serif',
};

/* ──────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────── */
function fc(v: number) {
  if (v >= 10_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_00_000)  return `₹${(v / 1_00_000).toFixed(2)}L`;
  if (v >= 1_000)     return `₹${(v / 1_000).toFixed(0)}K`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}
function fcFull(v: number) { return `₹${Math.round(v).toLocaleString('en-IN')}`; }
function fp(v: number) { return `${v.toFixed(1)}%`; }
function fn(v: number) { return Math.round(v).toLocaleString('en-IN'); }
function delta(v: number | null | undefined) {
  if (v == null) return '—';
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}
function deltaColor(v: number | null | undefined): string {
  if (v == null) return C.textLight;
  return v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : C.textLight;
}

function badge(label: string, color: 'green' | 'red' | 'warn' | 'blue' | 'gray' | 'yellow' | 'navy') {
  const bg: Record<string, string> = {
    green: 'rgba(39,103,73,.1)', red: 'rgba(197,48,48,.1)', warn: 'rgba(192,86,33,.1)',
    blue: 'rgba(26,110,181,.1)', gray: 'rgba(107,114,128,.1)', yellow: 'rgba(232,185,79,.12)',
    navy: 'rgba(3,13,24,.08)',
  };
  const fg: Record<string, string> = {
    green: C.green, red: C.red, warn: C.warn,
    blue: C.blue, gray: C.textLight, yellow: '#92660a', navy: C.navyMid,
  };
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontFamily: T.sans,
      letterSpacing: '.2px', padding: '3px 10px', borderRadius: 4,
      background: bg[color], color: fg[color], fontWeight: 600,
      minWidth: 80, textAlign: 'center' as const, whiteSpace: 'nowrap' as const,
    }}>{label}</span>
  );
}

/* ──────────────────────────────────────────────────────────────
   SUB-COMPONENTS
────────────────────────────────────────────────────────────── */

function KpiBox({ label, val, sub, variant = 'default' }: {
  label: string; val: string; sub?: string;
  variant?: 'default' | 'blue' | 'positive' | 'warn' | 'red';
}) {
  const accent: Record<string, string> = {
    default: C.border2, blue: C.blue, positive: '#16a34a', warn: C.warn, red: C.red,
  };
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderTop: `3px solid ${accent[variant]}`,
      borderRadius: 6, padding: '16px 18px',
    }}>
      <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.textLight, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: T.serif, fontSize: 26, color: C.text, lineHeight: 1.1, marginBottom: 4 }}>{val}</div>
      {sub && <div style={{ fontFamily: T.sans, fontSize: 11, color: C.textMuted }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ num, eyebrow, title, context }: {
  num: string; eyebrow: string; title: React.ReactNode; context?: string;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32, alignItems: 'start' }}>
      <div className="sp-section-header-left">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 10,
        }}>
          <span style={{
            fontFamily: T.sans, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase',
            color: C.textVeryLight,
          }}>{num}</span>
          <span style={{ width: 24, height: 1, background: C.border2, display: 'inline-block' }} />
          <span style={{
            fontFamily: T.sans, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase',
            color: C.textLight,
          }}>{eyebrow}</span>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 30, color: C.text, lineHeight: 1.25 }}>{title}</div>
      </div>
      {context && (
        <div style={{ fontFamily: T.sans, fontSize: 13, color: C.textMuted, lineHeight: 1.8, paddingTop: 8, borderLeft: `2px solid ${C.border}`, paddingLeft: 24 }}>{context}</div>
      )}
    </div>
  );
}

function Insight({ text, variant = 'default' }: {
  text: React.ReactNode;
  variant?: 'default' | 'blue' | 'green' | 'warn' | 'red';
}) {
  const border: Record<string, string> = {
    default: C.border2, blue: C.blueLight, green: '#16a34a', warn: C.warn, red: C.red,
  };
  const bg: Record<string, string> = {
    default: C.surface2, blue: 'rgba(26,110,181,.04)', green: 'rgba(22,163,74,.04)',
    warn: 'rgba(192,86,33,.04)', red: 'rgba(197,48,48,.04)',
  };
  return (
    <div style={{
      borderLeft: `3px solid ${border[variant]}`, background: bg[variant],
      padding: '13px 18px', marginBottom: 10, borderRadius: '0 6px 6px 0',
      fontFamily: T.sans, fontSize: 13, lineHeight: 1.8, color: C.text2,
    }}>{text}</div>
  );
}

function FunnelBar({ label, value, total, color = C.blueLight, textColor }: {
  label: string; value: number; total: number; color?: string; textColor?: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.sans, fontSize: 12, color: C.text2, marginBottom: 5 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: textColor || C.textLight }}>{fn(value)} · {fp(pct)}</span>
      </div>
      <div style={{ height: 10, background: C.surface2, borderRadius: 5, overflow: 'hidden', border: `1px solid ${C.border}` }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5, transition: 'width .5s ease' }} />
      </div>
    </div>
  );
}

const tblStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontFamily: T.sans };
const thStyle: React.CSSProperties = {
  padding: '9px 12px', textAlign: 'left', fontSize: 9, letterSpacing: '1.5px',
  textTransform: 'uppercase', color: C.textLight, borderBottom: `2px solid ${C.border}`,
  background: C.surface2, fontWeight: 600,
};
const tdStyle: React.CSSProperties = { padding: '9px 12px', fontSize: 12, color: C.text2, borderBottom: `1px solid ${C.border}` };
const tdR: React.CSSProperties = { ...tdStyle, textAlign: 'right' };
const tdBold: React.CSSProperties = { ...tdStyle, fontWeight: 700, color: C.text };

function Card({ title, children, style, fullWidth }: {
  title?: string; children: React.ReactNode; style?: React.CSSProperties; fullWidth?: boolean;
}) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 8, overflow: 'hidden',
      ...(fullWidth ? { width: '100%' } : {}),
      ...style,
    }}>
      {title && (
        <div style={{
          padding: '13px 20px', borderBottom: `1px solid ${C.border}`,
          fontFamily: T.sans, fontSize: 11, letterSpacing: '1px',
          textTransform: 'uppercase', color: C.textMuted, fontWeight: 700,
        }}>{title}</div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function FlagBox({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div style={{
      background: C.redPale, border: `1px solid rgba(197,48,48,.14)`,
      borderLeft: `3px solid ${C.red}`, borderRadius: 6, padding: '18px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', background: C.red,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.sans, fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>{num}</span>
        <span style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: '.5px', textTransform: 'uppercase', color: C.red, fontWeight: 700 }}>Red Flag</span>
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 15, color: C.text, marginBottom: 10 }}>{title}</div>
      <p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>{text}</p>
    </div>
  );
}

/* Simple 3-D-style bar chart rendered with CSS perspective */
function Bar3DChart({ data, title }: {
  title: string;
  data: Array<{ label: string; value: number; color: string }>;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
      <div style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700, marginBottom: 18 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100, perspective: 400 }}>
        {data.map((d) => {
          const h = Math.max(4, (d.value / max) * 92);
          return (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: T.sans, fontSize: 9, color: C.textLight, whiteSpace: 'nowrap' as const }}>{fc(d.value)}</span>
              <div style={{ position: 'relative', width: '100%', height: h }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: d.color,
                  borderRadius: '3px 3px 0 0',
                  boxShadow: `3px -3px 0 ${d.color}aa, 6px -6px 0 ${d.color}55`,
                  transform: 'perspective(200px) rotateX(4deg)',
                  transformOrigin: 'bottom',
                }} />
              </div>
              <span style={{ fontFamily: T.sans, fontSize: 9, color: C.textLight, textAlign: 'center', whiteSpace: 'nowrap' as const, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Donut ring SVG chart */
function DonutChart({ slices, size = 110 }: {
  size?: number;
  slices: Array<{ value: number; color: string; label: string }>;
}) {
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 16;
  let cumAngle = -Math.PI / 2;
  const paths = slices.filter(s => s.value > 0).map((s) => {
    const angle = (s.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, color: s.color, label: s.label, pct: Math.round((s.value / total) * 100) };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
      {paths.map((p, i) => (
        <path key={i} d={p.path} fill="none" stroke={p.color} strokeWidth={stroke} strokeLinecap="butt" />
      ))}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────── */
export function StudioPulseReport(props: StudioPulseReportProps) {
  const {
    studioName, dateRange, salesStats, sessionStats,
    sessionIntelligenceRows, classSlotRows, trainerRows, clientStats,
    funnelRows, lcStats, expirationStats, lapsedByMembership,
    salesMatrix, getSummary, sectionEdits, onClose,
  } = props;

  /* ── Derived comparison data ────────────────────────────── */
  const { months, monthLabels, metricRows } = salesMatrix;
  const curMonth   = months[0] || '';
  const prevMonth  = months[1] || '';
  const curLabel   = monthLabels[curMonth]  || 'Current Month';
  const prevLabel  = monthLabels[prevMonth] || 'Previous Month';

  /* YTD avg: all months in the same calendar year as curMonth, excluding curMonth itself */
  const curYear    = curMonth.slice(0, 4);
  const ytdMonths  = months.filter(m => m.startsWith(curYear) && m !== curMonth);
  const ytdLabel   = ytdMonths.length ? `${curYear} YTD Avg` : null;

  /* Same month last year */
  const sameMonthLastYear = curMonth ? `${Number(curYear) - 1}-${curMonth.slice(5)}` : '';
  const hasSameMonthLY    = months.includes(sameMonthLastYear);
  const lastYearLabel     = hasSameMonthLY ? (monthLabels[sameMonthLastYear] || 'Same Month LY') : null;

  function rowVal(idx: number, month: string) { return metricRows[idx]?.values[month] ?? 0; }
  function rowYtd(idx: number): number | null {
    if (!ytdMonths.length) return null;
    return ytdMonths.reduce((s, m) => s + (metricRows[idx]?.values[m] ?? 0), 0) / ytdMonths.length;
  }
  function formatRowVal(idx: number, v: number) {
    const type = metricRows[idx]?.type;
    if (type === 'currency') return fcFull(v);
    if (type === 'percent')  return fp(v);
    return fn(v);
  }
  /* pct change helper for comparison badges */
  function pctVs(cur: number, ref: number | null): number | null {
    if (ref == null || ref === 0) return null;
    return ((cur - ref) / ref) * 100;
  }

  /* ── Session rows ─────────────────────────────────────── */
  const sessionsSorted = useMemo(
    () => [...sessionIntelligenceRows].sort((a, b) => b.fillRate - a.fillRate).slice(0, 14),
    [sessionIntelligenceRows]
  );
  const lateCancelsSorted = useMemo(
    () => [...sessionIntelligenceRows].sort((a, b) => b.lateCancels - a.lateCancels).filter(r => r.lateCancels > 0).slice(0, 8),
    [sessionIntelligenceRows]
  );
  const topSlots = useMemo(
    () => (classSlotRows ?? []).slice(0, 12),
    [classSlotRows]
  );

  /* ── Trainers ─────────────────────────────────────────── */
  const trainersSorted = useMemo(
    () => [...trainerRows].sort((a, b) => b.revenueScore - a.revenueScore).slice(0, 16),
    [trainerRows]
  );

  /* ── Funnel ───────────────────────────────────────────── */
  const funnelSorted = useMemo(
    () => [...funnelRows].filter(r => r.leads > 0).sort((a, b) => b.leads - a.leads).slice(0, 12),
    [funnelRows]
  );
  const topFunnelSource = useMemo(
    () => [...funnelRows].filter(r => r.leads >= 5).sort((a, b) => b.conversionRate - a.conversionRate)[0],
    [funnelRows]
  );

  /* ── Red flags ────────────────────────────────────────── */
  const redFlags = useMemo(() => {
    const flags: Array<{ num: string; title: string; text: string }> = [];
    let n = 1;
    if (expirationStats.lapsedPct > 60) {
      flags.push({ num: `0${n++}`, title: `${fp(expirationStats.lapsedPct)} Lapse Rate on Expiring Memberships`, text: `${fn(expirationStats.lapsed)} of ${fn(expirationStats.total)} memberships expired this period with only ${fn(expirationStats.renewed)} renewals recorded. A lapse rate above 60% is a structural retention failure. These are customers the studio has already won — and is most likely to win again with the right intervention. The 60-day win-back window starts now.` });
    }
    if (lcStats.total > 100) {
      flags.push({ num: `0${n++}`, title: `${fn(lcStats.total)} Late Cancellations — Capacity Revenue Lost`, text: `Late cancellations represent seats that were held, then vacated too late to fill from the waitlist. Without a financial deterrent, late cancellation is costless for the member — making speculative booking rational. At ₹800–₹1,000 per check-in, this is a quantified and recoverable revenue leak that requires a policy decision, not a process change.` });
    }
    if (salesStats.discountPenetration > 20) {
      flags.push({ num: `0${n++}`, title: `${fp(salesStats.discountPenetration)} Discount Penetration — Revenue Quality Risk`, text: `More than 1 in 5 transactions is discounted. Sustained discount penetration above 20% trains clients to expect reduced pricing and compresses long-term margin. Net revenue quality falls even when gross revenue is stable. The revenue-per-member figure should be tracked against the prior period to measure the erosion impact.` });
    }
    const zeroConvTrainers = trainersSorted.filter(t => t.sessions >= 12 && t.conversionRate === 0);
    if (zeroConvTrainers.length > 0) {
      const names = zeroConvTrainers.slice(0, 3).map(t => t.name).join(', ');
      flags.push({ num: `0${n++}`, title: `Zero Conversion Across ${fn(zeroConvTrainers.length)} High-Volume Trainer${zeroConvTrainers.length > 1 ? 's' : ''}`, text: `${names}${zeroConvTrainers.length > 3 ? ' and others' : ''} collectively ran ${fn(zeroConvTrainers.reduce((s, t) => s + t.sessions, 0))} sessions with ${fn(zeroConvTrainers.reduce((s, t) => s + (t.customers ?? 0), 0))} client visits and zero new membership conversions. These sessions generate attendance but not growth. Structured post-class engagement for these specific trainers is the most direct lever.` });
    }
    const zeroConvSources = funnelSorted.filter(f => f.leads >= 8 && f.conversionRate === 0);
    if (zeroConvSources.length > 0) {
      const names = zeroConvSources.map(f => f.name).join(', ');
      flags.push({ num: `0${n++}`, title: `${names} — Lead Channel${zeroConvSources.length > 1 ? 's' : ''} Converting at 0%`, text: `${fn(zeroConvSources.reduce((s, f) => s + f.leads, 0))} leads arrived through these channels. Zero converted. This is not a sample size issue — it indicates a broken or absent follow-up process for these specific acquisition pathways. Every day this persists, motivated prospects are being lost to inaction.` });
    }
    const underperformers = sessionsSorted.filter(s => s.fillRate < 30 && s.sessions >= 6);
    if (underperformers.length > 0) {
      const bottom = underperformers[underperformers.length - 1];
      flags.push({ num: `0${n++}`, title: `${bottom.name} — ${fp(bottom.fillRate)} Fill Rate Across ${fn(bottom.sessions)} Sessions`, text: `This format averages ${(bottom.visits / bottom.sessions).toFixed(1)} clients per session. Each session costs the studio trainer time and room capacity for diminishing returns. A 25–30% reduction in session count for this format should be evaluated before the next scheduling cycle, with capacity redirected to high-demand formats.` });
    }
    if (clientStats.conversionRate < 25 && clientStats.newClients > 20) {
      flags.push({ num: `0${n++}`, title: `${fp(clientStats.conversionRate)} New Client Conversion — Below Viable Threshold`, text: `${fn(clientStats.newClients - clientStats.converted)} of ${fn(clientStats.newClients)} new clients (${fp(100 - clientStats.conversionRate)}) left without purchasing. The first-class experience, same-day follow-up call, and in-studio pricing conversation are the three variables that determine this number — and all three appear underdeveloped based on the current conversion data.` });
    }
    if (flags.length === 0) {
      flags.push({ num: '01', title: 'No Critical Red Flags Identified This Period', text: 'All key metrics are within operational thresholds. Continue monitoring lapse rate, late cancellation volume, and new client conversion rate as the three primary leading indicators for the next period. Healthy operations compound — maintain the current trajectory.' });
    }
    return flags;
  }, [expirationStats, lcStats, salesStats, trainersSorted, funnelSorted, sessionsSorted, clientStats]);

  /* ── What Worked / Needs Attention ──────────────────── */
  const wwPositive = useMemo(() => {
    const items: Array<{ title: string; text: string }> = [];
    if (topFunnelSource && topFunnelSource.conversionRate > 30) {
      items.push({ title: `${topFunnelSource.name} is the highest-converting acquisition channel`, text: `${fn(topFunnelSource.leads)} leads, ${fn(topFunnelSource.converted)} conversions, ${fp(topFunnelSource.conversionRate)} conversion rate. This channel is delivering qualified buyers — without paid media. It should be formalised and resourced before being handed to chance.` });
    }
    const topTrainer = trainersSorted.find(t => (t.conversionRate > 1 ? t.conversionRate : t.conversionRate * 100) > 40 && t.sessions >= 8);
    if (topTrainer) {
      const convPct = topTrainer.conversionRate > 1 ? topTrainer.conversionRate : topTrainer.conversionRate * 100;
      items.push({ title: `${topTrainer.name} is the studio's highest-converting trainer`, text: `${fp(convPct)} conversion rate across ${fn(topTrainer.sessions)} sessions with ${fp(topTrainer.fillRate > 1 ? topTrainer.fillRate : topTrainer.fillRate * 100)} fill. Assigning this trainer to new-client-facing time slots — especially trials and intro class series — would directly increase membership conversion.` });
    }
    const topClass = sessionsSorted[0];
    if (topClass && topClass.fillRate > 65) {
      items.push({ title: `${topClass.name} is the studio's highest-demand format`, text: `${fp(topClass.fillRate)} fill rate across ${fn(topClass.sessions)} sessions. Demand has demonstrably outpaced current supply. The scheduling response — adding 2–3 sessions at peak slots — should happen before the next period. Unmet demand that persists converts into member frustration and cancellation.` });
    }
    const memIdx = metricRows.findIndex(r => r.label === 'Membership Sales');
    if (memIdx >= 0) {
      const curMem = rowVal(memIdx, curMonth);
      const ytdMem = rowYtd(memIdx);
      if (ytdMem && curMem > ytdMem * 1.2) {
        items.push({ title: `Membership sales are significantly above YTD average`, text: `${fc(curMem)} this period vs ${fc(ytdMem)} YTD average — a ${fp(((curMem - ytdMem) / ytdMem) * 100)} premium. This signals a structural shift toward committed, recurring products rather than one-off purchases. The team or campaign that drove this should be identified and replicated.` });
      }
    }
    if (clientStats.newClients > 50) {
      items.push({ title: `${fn(clientStats.newClients)} new clients visited this period`, text: `A healthy acquisition volume. Each new client represents a potential lifetime value of ${fc(clientStats.avgLtv)} if converted. At ${fp(clientStats.conversionRate)} conversion, the pipeline is generating real revenue — and there is a material opportunity to improve it further.` });
    }
    if (items.length < 3) {
      items.push({ title: `Session attendance is tracking positively`, text: `${fn(sessionStats.totalSessions)} total sessions with an average fill rate of ${fp(sessionStats.avgFill)}. ${sessionStats.avgFill > 55 ? 'Studio demand is healthy and trending above the 55% operational efficiency threshold.' : 'Fill rate is below the 55% threshold — but improvement is a scheduling optimisation problem, not a demand problem.'}` });
    }
    return items;
  }, [topFunnelSource, trainersSorted, sessionsSorted, metricRows, curMonth, clientStats, sessionStats]);

  const wwNegative = useMemo(() => {
    const items: Array<{ title: string; text: string }> = [];
    const zeroConvTrainers = trainersSorted.filter(t => t.sessions >= 12 && t.conversionRate === 0);
    if (zeroConvTrainers.length > 0) {
      const names = zeroConvTrainers.slice(0, 2).map(t => t.name).join(' and ');
      items.push({ title: `Zero conversion across ${fn(zeroConvTrainers.length)} high-volume trainer${zeroConvTrainers.length > 1 ? 's' : ''}`, text: `${names}${zeroConvTrainers.length > 2 ? ` and ${zeroConvTrainers.length - 2} others` : ''} ran ${fn(zeroConvTrainers.reduce((s, t) => s + t.sessions, 0))} sessions with zero new membership conversions. These trainers are servicing existing clients without contributing to the membership growth engine. Post-class engagement training is the most immediate lever.` });
    }
    if (clientStats.conversionRate < 35 && clientStats.newClients > 20) {
      const missed = clientStats.newClients - clientStats.converted;
      items.push({ title: `${fn(missed)} new clients left without purchasing`, text: `${fp(100 - clientStats.conversionRate)} of ${fn(clientStats.newClients)} new clients did not convert. The gap between a first class and a membership purchase is closed in the first 24 hours — by a personal follow-up call, a specific product recommendation, and a frictionless booking path. All three are currently under-engineered.` });
    }
    if (lcStats.total > 80) {
      items.push({ title: `${fn(lcStats.total)} late cancellations represent blocked capacity`, text: `Without a financial deterrent, late cancellation is costless. The studio is absorbing this cost in the form of unfilled classes and trainer hours delivered to empty rooms. A ₹500 late cancellation fee with a 2-week grace period is the standard industry intervention — direct, enforceable, and understood by members as fair.` });
    }
    const lowFill = sessionsSorted.filter(s => s.fillRate < 35 && s.sessions >= 5);
    if (lowFill.length > 0) {
      const lf = lowFill[lowFill.length - 1];
      items.push({ title: `${lf.name} is operating at ${fp(lf.fillRate)} fill — below viability threshold`, text: `${fn(lf.sessions)} sessions averaging ${(lf.visits / lf.sessions).toFixed(1)} clients each. The cost of running this format — trainer, room, admin — exceeds the revenue it generates per session. A schedule reduction of 25–30% for the next period is the minimum corrective action.` });
    }
    if (expirationStats.lapsedPct > 50) {
      items.push({ title: `${fn(expirationStats.lapsed)} memberships lapsed — renewal process is absent or failing`, text: `${fn(expirationStats.renewed)} renewals from ${fn(expirationStats.total)} expirations. The win-back window is 60 days from lapse — beyond that, probability drops below 5%. Personal outreach for Tier 1 (high-value) lapses must begin this week.` });
    }
    if (salesStats.discountPenetration > 20) {
      items.push({ title: `${fp(salesStats.discountPenetration)} discount penetration erodes revenue quality`, text: `More than 1 in 5 transactions is discounted. This compresses net revenue relative to gross and trains price-sensitive behaviour in the client base. The net-to-gross ratio should be tracked monthly as the primary revenue quality metric.` });
    }
    if (items.length < 3) {
      items.push({ title: `Digital acquisition is underperforming vs referral and direct channels`, text: `Website and paid digital sources are generating lower-quality leads — lower conversion rates and shorter LTVs — compared to referral and walk-in. The follow-up process for digital leads requires standardisation: 2-hour phone response SLA, structured 3-touch sequence, and an assigned owner.` });
    }
    return items;
  }, [trainersSorted, clientStats, lcStats, sessionsSorted, expirationStats, salesStats]);

  /* ── Actions ──────────────────────────────────────────── */
  const actions = useMemo(() => {
    const list: Array<{ num: number; tags: string[]; title: string; body: React.ReactNode }> = [];
    if (expirationStats.lapsed >= 10) {
      list.push({
        num: 1, tags: ['Retention', 'Revenue Recovery', 'Urgent — This Week'],
        title: `Launch win-back outreach for all ${fn(expirationStats.lapsed)} lapsed members`,
        body: (<p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.8, margin: 0 }}>
          <strong style={{ color: C.text2 }}>The data:</strong> {fn(expirationStats.lapsed)} memberships lapsed with {fn(expirationStats.renewed)} renewals. Research in boutique fitness shows 60 days post-lapse is the boundary beyond which win-back probability drops below 5%.<br /><br />
          <strong style={{ color: C.text2 }}>Action:</strong> Personal phone call this week for high-value lapses (Annual, 6-Month, 3-Month, multi-class packs). WhatsApp sequence for mid-tier lapses over days 4–10. A 3-email sequence for month-pass lapses. Script: acknowledge without pressure, offer a complimentary re-entry class, present a renewal conversation in studio.<br /><br />
          <strong style={{ color: C.text2 }}>Expected outcome:</strong> A 15% win-back rate = {fn(Math.round(expirationStats.lapsed * 0.15))} renewals — material incremental revenue at near-zero acquisition cost.
        </p>)
      });
    }
    if (lcStats.total > 80) {
      list.push({
        num: 2, tags: ['Operations', 'Revenue Recovery', 'Policy Decision'],
        title: `Implement a ₹500 late cancellation fee for all high-demand formats`,
        body: (<p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.8, margin: 0 }}>
          <strong style={{ color: C.text2 }}>The data:</strong> {fn(lcStats.total)} late cancellations this period — blocked capacity in the studio's highest-demand formats.<br /><br />
          <strong style={{ color: C.text2 }}>Action:</strong> Introduce a ₹500 late cancellation fee for bookings cancelled within 8 hours of class start. Give each member one fee-free late cancel per rolling 30 days. Activate an automated waitlist system that fills cancelled spots within 15 minutes. Communicate the policy with a 2-week grace period.<br /><br />
          <strong style={{ color: C.text2 }}>Expected outcome:</strong> 40% reduction in late cancels frees meaningful capacity for real bookings, plus direct fee income from remaining violations.
        </p>)
      });
    }
    if (clientStats.conversionRate < 35 && clientStats.newClients > 20) {
      list.push({
        num: 3, tags: ['Conversion', 'New Clients', 'Implement This Month'],
        title: `Launch a 24-hour new client follow-up protocol for every first visit`,
        body: (<p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.8, margin: 0 }}>
          <strong style={{ color: C.text2 }}>The data:</strong> {fp(100 - clientStats.conversionRate)} of {fn(clientStats.newClients)} new clients ({fn(clientStats.newClients - clientStats.converted)} people) left without converting. Each conversion missed is {fc(clientStats.avgLtv)} in potential LTV.<br /><br />
          <strong style={{ color: C.text2 }}>Action:</strong> Every new client receives a personal WhatsApp from front desk within 4 hours of their first class — referencing something specific about the session. Website leads get a 2-hour phone response SLA with an assigned owner. Trial-completed leads receive: Day 1 call, Day 4 WhatsApp, Day 8 personal email.<br /><br />
          <strong style={{ color: C.text2 }}>Expected outcome:</strong> Moving conversion from {fp(clientStats.conversionRate)} to 30% = {fn(Math.round(clientStats.newClients * 0.07))} additional memberships at {fc(clientStats.avgLtv)} avg LTV.
        </p>)
      });
    }
    if (topFunnelSource?.name?.toLowerCase().includes('referral')) {
      list.push({
        num: 4, tags: ['Referral Programme', 'Acquisition', 'Launch by Month End'],
        title: `Formalise the referral programme and set a monthly referral lead target`,
        body: (<p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.8, margin: 0 }}>
          <strong style={{ color: C.text2 }}>The data:</strong> Referral generated {fn(topFunnelSource.leads)} leads at {fp(topFunnelSource.conversionRate)} conversion — organically, with no formal programme in place. The LTV/lead ratio is the highest of any channel.<br /><br />
          <strong style={{ color: C.text2 }}>Action:</strong> Name and publish the programme. For every referred client who purchases a membership or multi-class pack, the referring member earns one complimentary class credit. Communicate via trainers and front desk in post-class conversation. Track referral source attribution rigorously. Set a monthly target: current volume + 35%.<br /><br />
          <strong style={{ color: C.text2 }}>Expected outcome:</strong> Growing referral volume by 35% at maintained conversion = {fn(Math.round(topFunnelSource.leads * 0.35 * topFunnelSource.conversionRate / 100))} additional memberships/month at near-zero acquisition cost.
        </p>)
      });
    }
    if (list.length < 4) {
      const lowFillClass = [...sessionIntelligenceRows].sort((a, b) => a.fillRate - b.fillRate).find(s => s.sessions >= 6);
      const topFillClass = sessionsSorted[0];
      if (lowFillClass && topFillClass) {
        list.push({
          num: list.length + 1, tags: ['Scheduling', 'Revenue', 'Next Schedule Cycle'],
          title: `Expand ${topFillClass.name} (${fp(topFillClass.fillRate)} fill), reduce ${lowFillClass.name} (${fp(lowFillClass.fillRate)} fill)`,
          body: (<p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.8, margin: 0 }}>
            <strong style={{ color: C.text2 }}>The data:</strong> {topFillClass.name} is running at {fp(topFillClass.fillRate)} fill across {fn(topFillClass.sessions)} sessions — demand exceeds supply. {lowFillClass.name} is at {fp(lowFillClass.fillRate)} fill across {fn(lowFillClass.sessions)} sessions — consuming capacity below operational threshold.<br /><br />
            <strong style={{ color: C.text2 }}>Action:</strong> Add 3–4 sessions of {topFillClass.name} to the next schedule at peak time slots where late cancels are highest. Reduce {lowFillClass.name} sessions by 25–30%. Redirect freed trainer time to higher-demand formats.<br /><br />
            <strong style={{ color: C.text2 }}>Expected outcome:</strong> Overall studio fill rate moves from {fp(sessionStats.avgFill)} toward 60%+ within 60 days of the schedule change.
          </p>)
        });
      }
    }
    if (list.length < 5) {
      list.push({
        num: list.length + 1, tags: ['Data Quality', 'Reporting', 'This Month'],
        title: 'Resolve data completeness gaps — sessions used, member activity, and usage rates',
        body: (<p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.8, margin: 0 }}>
          <strong style={{ color: C.text2 }}>The data:</strong> Key retention fields — sessions used %, average sessions per month, days active — are incomplete for a significant portion of expiring member records. Without usage data, it is impossible to distinguish heavy users from disengaged ones before they lapse.<br /><br />
          <strong style={{ color: C.text2 }}>Action:</strong> Assign one team member to audit data completeness in the CRM this month. Identify which fields are systematically absent and trace the gap to its source (import, manual entry, or system configuration). Implement a data validation check on new member onboarding.<br /><br />
          <strong style={{ color: C.text2 }}>Expected outcome:</strong> Complete usage data enables retention segmentation, targeted win-back outreach, and accurate churn prediction — all currently blocked by missing fields.
        </p>)
      });
    }
    return list.slice(0, 5);
  }, [expirationStats, lcStats, clientStats, topFunnelSource, sessionIntelligenceRows, sessionsSorted, sessionStats]);

  /* ── Conclusions ─────────────────────────────────────── */
  const conclusions = useMemo(() => [
    { num: '01', text: `Revenue stands at ${fc(salesStats.net)} net for the period with ${fp(salesStats.discountPenetration)} discount penetration.`, verdict: salesStats.growth.net != null ? `${delta(salesStats.growth.net)} vs prior period` : 'vs prior period' },
    { num: '02', text: `${fn(sessionStats.totalSessions)} sessions ran with ${fp(sessionStats.avgFill)} average fill rate across all formats.`, verdict: sessionStats.avgFill > 55 ? 'Healthy fill — expand high-demand formats' : 'Below 55% — schedule optimisation needed' },
    { num: '03', text: `${fn(clientStats.newClients)} new clients with ${fp(clientStats.conversionRate)} conversion rate. ${fn(clientStats.converted)} converted.`, verdict: clientStats.conversionRate < 30 ? 'Conversion is the primary growth lever' : 'Conversion above 30% — maintain follow-up' },
    { num: '04', text: `${fn(expirationStats.lapsed)} memberships lapsed with ${fn(expirationStats.renewed)} renewals. Win-back window closes in 60 days.`, verdict: expirationStats.lapsedPct > 60 ? 'Critical — outreach must begin immediately' : 'Moderate risk — prioritise outreach' },
    { num: '05', text: `${fn(lcStats.total)} late cancellations recorded. A fee structure would recover capacity in high-demand formats.`, verdict: lcStats.total > 150 ? 'Critical — implement fee policy' : 'Actionable — policy recommended' },
    { num: '06', text: topFunnelSource ? `${topFunnelSource.name} channel leads with ${fp(topFunnelSource.conversionRate)} conversion — the studio's strongest organic growth signal.` : `Identify and formalise the highest-converting acquisition channel to systematise growth.`, verdict: 'Formalise and scale this channel' },
  ], [salesStats, sessionStats, clientStats, expirationStats, lcStats, topFunnelSource]);

  /* ── Revenue mix for 3D chart ────────────────────────── */
  const revMixData = useMemo(() => {
    const pkgIdx = metricRows.findIndex(r => r.label === 'Package Sales');
    const memIdx = metricRows.findIndex(r => r.label === 'Membership Sales');
    const dropIdx = metricRows.findIndex(r => r.label === 'Drop-in Sales');
    const retailIdx = metricRows.findIndex(r => r.label === 'Retail Sales');
    return [
      { label: 'Memberships', value: memIdx >= 0 ? rowVal(memIdx, curMonth) : 0, color: C.blue },
      { label: 'Packages',    value: pkgIdx >= 0 ? rowVal(pkgIdx, curMonth) : 0, color: '#0ea5e9' },
      { label: 'Drop-ins',    value: dropIdx >= 0 ? rowVal(dropIdx, curMonth) : 0, color: '#6366f1' },
      { label: 'Retail',      value: retailIdx >= 0 ? rowVal(retailIdx, curMonth) : 0, color: '#8b5cf6' },
    ].filter(d => d.value > 0);
  }, [metricRows, curMonth]);

  /* ── Format attendance donut data ────────────────────── */
  const formatDonutData = useMemo(() => {
    const formatMap: Record<string, number> = {};
    sessionIntelligenceRows.forEach(r => {
      const fmt = r.name.toLowerCase().includes('barre') ? 'Barre' :
                  r.name.toLowerCase().includes('cycle') ? 'PowerCycle' :
                  r.name.toLowerCase().includes('strength') ? 'Strength' : 'Other';
      formatMap[fmt] = (formatMap[fmt] || 0) + r.visits;
    });
    const colors: Record<string, string> = { Barre: C.blue, PowerCycle: '#0ea5e9', Strength: '#f59e0b', Other: C.textLight };
    return Object.entries(formatMap).map(([label, value]) => ({ label, value, color: colors[label] || C.textLight }));
  }, [sessionIntelligenceRows]);

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: C.surface, overflowY: 'auto', fontFamily: T.sans }}>
      <style>{`
        @keyframes sp-fadeInUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sp-fadeInRight {
          from { opacity: 0; transform: translateX(-14px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes sp-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes sp-shimmer {
          0%   { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        @keyframes sp-barGrow {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        .sp-hero-h1   { animation: sp-fadeInUp 0.75s cubic-bezier(.22,1,.36,1) both; }
        .sp-hero-sub  { animation: sp-fadeInUp 0.75s cubic-bezier(.22,1,.36,1) 0.18s both; }
        .sp-hero-card { animation: sp-fadeInUp 0.75s cubic-bezier(.22,1,.36,1) 0.32s both; }
        .sp-kpi-0     { animation: sp-fadeInUp 0.6s ease 0.55s both; }
        .sp-kpi-1     { animation: sp-fadeInUp 0.6s ease 0.65s both; }
        .sp-kpi-2     { animation: sp-fadeInUp 0.6s ease 0.75s both; }
        .sp-kpi-3     { animation: sp-fadeInUp 0.6s ease 0.85s both; }
        .sp-kpi-4     { animation: sp-fadeInUp 0.6s ease 0.95s both; }
        .sp-kpi-5     { animation: sp-fadeInUp 0.6s ease 1.05s both; }
        .sp-kpi-6     { animation: sp-fadeInUp 0.6s ease 1.15s both; }
        .sp-sechead   { animation: sp-fadeInRight 0.5s ease both; }
        @media print {
          .sp-report-topbar { display: none !important; }
          .sp-report-wrap   { padding: 0 !important; }
        }
        .sp-report-wrap { max-width: 1120px; margin: 0 auto; padding: 0 36px 90px; }
        @media (max-width: 768px) { .sp-report-wrap { padding: 0 16px 60px; } }
        .sp-report-divider { border: none; border-top: 1px solid ${C.border}; margin: 56px 0; }
        .sp-tbl-row:hover td { background: ${C.surface2} !important; }
        .sp-tbl-row td { transition: background .12s; }
      `}</style>

      {/* ─── Sticky topbar ─── */}
      <div className="sp-report-topbar" style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${C.border}`, padding: '9px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase', color: C.textVeryLight }}>Studio Pulse</span>
          <span style={{ color: C.border2, fontSize: 14 }}>·</span>
          <span style={{ fontFamily: T.sans, fontSize: 11, color: C.textLight, fontWeight: 600 }}>{studioName}</span>
          <span style={{ color: C.border2, fontSize: 14 }}>·</span>
          <span style={{ fontFamily: T.sans, fontSize: 11, color: C.textVeryLight }}>{dateRange.start} — {dateRange.end}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.print()} style={{
            fontFamily: T.sans, fontSize: 10, letterSpacing: '.3px', color: C.blue, background: 'rgba(26,110,181,.07)',
            border: `1px solid rgba(26,110,181,.2)`, borderRadius: 4, padding: '5px 14px', cursor: 'pointer',
          }}>Print / PDF</button>
          <button onClick={onClose} style={{
            fontFamily: T.sans, fontSize: 10, letterSpacing: '.3px', color: C.textMuted, background: C.surface2,
            border: `1px solid ${C.border}`, borderRadius: 4, padding: '5px 14px', cursor: 'pointer',
          }}>✕ Close Report</button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════ */}
      <section style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 55%, ${C.navyLight} 100%)`,
        padding: '70px 0 0',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(26,110,181,.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 40, left: -80, width: 240, height: 240, borderRadius: '50%', background: 'rgba(232,185,79,.04)', pointerEvents: 'none' }} />

        <div className="sp-report-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 52, alignItems: 'start', paddingBottom: 52 }}>
            <div>
              <div className="sp-hero-sub" style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '3.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 22 }}>
                Senior Management Review · {studioName} · {dateRange.start} — {dateRange.end}
              </div>
              <h1 className="sp-hero-h1" style={{ fontFamily: T.serif, fontSize: 54, color: '#fff', lineHeight: 1.08, margin: '0 0 26px', fontWeight: 400, letterSpacing: '-.5px' }}>
                Monthly<br />Performance<br /><span style={{ color: C.yellow }}>Report</span>
              </h1>
              <p className="sp-hero-sub" style={{ fontFamily: T.sans, fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.85, margin: 0, maxWidth: 360 }}>
                Full-spectrum business intelligence covering revenue, session performance, trainer analytics, new client acquisition, lapsed membership diagnostics, and strategic action items.
              </p>
            </div>

            <div className="sp-hero-card" style={{
              background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 12, padding: '28px 32px',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 14 }}>Executive Summary</div>
              <p style={{ fontFamily: T.sans, fontSize: 13, color: 'rgba(255,255,255,.78)', lineHeight: 1.9, margin: '0 0 20px' }}>
                {curLabel} delivered <strong style={{ color: '#fff' }}>{fc(salesStats.gross)}</strong> gross revenue with <strong style={{ color: '#fff' }}>{fp(salesStats.discountPenetration)}</strong> discount penetration.
                {' '}{fn(sessionStats.totalSessions)} sessions ran at <strong style={{ color: '#fff' }}>{fp(sessionStats.avgFill)}</strong> average fill.
                {' '}{fn(clientStats.newClients)} new clients — <strong style={{ color: C.yellow }}>{fp(clientStats.conversionRate)} converted</strong>.
                {expirationStats.lapsed > 0 && <> <strong style={{ color: '#fca5a5' }}>{fn(expirationStats.lapsed)} memberships lapsed</strong> with {fn(expirationStats.renewed)} renewals.</>}
                {salesStats.growth.net != null && <> Revenue is <strong style={{ color: salesStats.growth.net >= 0 ? '#86efac' : '#fca5a5' }}>{delta(salesStats.growth.net)} vs the prior period</strong>.</>}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { l: 'Gross Revenue', v: fc(salesStats.gross) },
                  { l: 'Net Revenue',   v: fc(salesStats.net) },
                  { l: 'New Clients',   v: fn(clientStats.newClients) },
                  { l: 'Avg Txn Value', v: fc(salesStats.atv) },
                ].map((m, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,.05)', borderRadius: 6, padding: '10px 14px' }}>
                    <div style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 4 }}>{m.l}</div>
                    <div style={{ fontFamily: T.serif, fontSize: 20, color: '#fff' }}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* KPI bar */}
        <div style={{ background: 'rgba(0,0,0,.3)', borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <div className="sp-report-wrap" style={{ padding: '0 36px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {[
                { label: 'Gross Revenue',   val: fc(salesStats.gross),          delta: salesStats.growth.gross,   note: null },
                { label: 'Net Revenue',     val: fc(salesStats.net),            delta: salesStats.growth.net,     note: null },
                { label: 'Transactions',    val: fn(salesStats.txns),           delta: salesStats.growth.txns,    note: null },
                { label: 'Unique Members',  val: fn(salesStats.members),        delta: salesStats.growth.members, note: null },
                { label: 'New Clients',     val: fn(clientStats.newClients),    delta: null, note: `${fp(clientStats.conversionRate)} converted` },
                { label: 'Avg Txn Value',   val: fc(salesStats.atv),            delta: null, note: null },
                { label: 'Late Cancels',    val: fn(lcStats.total),             delta: null, note: lcStats.total > 150 ? 'Critical — action req\'d' : 'Monitor volume' },
              ].map((k, i) => (
                <div key={i} className={`sp-kpi-${i}`} style={{
                  padding: '20px 14px', textAlign: 'center',
                  borderRight: i < 6 ? '1px solid rgba(255,255,255,.07)' : 'none',
                }}>
                  <div style={{ fontFamily: T.sans, fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 7 }}>{k.label}</div>
                  <div style={{ fontFamily: T.serif, fontSize: 22, color: '#fff', marginBottom: 5 }}>{k.val}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 9, color: k.delta != null ? deltaColor(k.delta) : (k.note?.includes('Critical') ? '#fca5a5' : 'rgba(255,255,255,.3)') }}>
                    {k.delta != null ? delta(k.delta) + ' vs prior' : (k.note || '—')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          BODY
      ═══════════════════════════════════════════════ */}
      <div className="sp-report-wrap">

        {/* Table of Contents */}
        <nav style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '22px 32px', margin: '44px 0 52px' }}>
          <div style={{ fontFamily: T.sans, fontSize: 8, letterSpacing: '3px', textTransform: 'uppercase', color: C.textVeryLight, marginBottom: 14 }}>Contents</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px 16px' }}>
            {[
              { num: '01', label: 'Financial Performance',  href: '#rpt-fin' },
              { num: '02', label: 'Session Intelligence',   href: '#rpt-session' },
              { num: '03', label: 'Trainer Intelligence',   href: '#rpt-trainer' },
              { num: '04', label: 'New Client Funnel',      href: '#rpt-funnel' },
              { num: '05', label: 'Lapsed Memberships',     href: '#rpt-lapsed' },
              { num: '06', label: 'Red Flags',              href: '#rpt-flags' },
              { num: '07', label: 'What Worked / Didn\'t', href: '#rpt-ww' },
              { num: '08', label: 'Action Items',           href: '#rpt-actions' },
            ].map(item => (
              <a key={item.href} href={item.href} style={{
                fontFamily: T.sans, fontSize: 12, color: C.textMuted,
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 0', borderBottom: `1px solid ${C.border}`, textDecoration: 'none',
              }}>
                <span style={{ color: C.yellow, fontSize: 10, fontWeight: 700 }}>{item.num}</span>
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ══════════════════════════════════
            SECTION 01 — FINANCIAL
        ══════════════════════════════════ */}
        <section id="rpt-fin">
          <div className="sp-sechead">
            <SectionHeader num="01" eyebrow="Financial Performance" title={<>Revenue, Sales Mix<br />&amp; Comparative Health</>}
              context={`${curLabel} compared across four benchmarks: the prior month (${prevLabel}), YTD average${ytdLabel ? ` (${ytdLabel})` : ''}, and the same month from the prior year${lastYearLabel ? ` (${lastYearLabel})` : ' (if data available)'}. Baseline establishes whether this month is structurally above, at, or below the studio's long-run run rate.`}
            />
          </div>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
            <KpiBox label="Gross Sales"    val={fc(salesStats.gross)}  sub={salesStats.growth.gross != null ? `${delta(salesStats.growth.gross)} vs prior` : undefined} variant="blue" />
            <KpiBox label="Net Sales"      val={fc(salesStats.net)}    sub={salesStats.growth.net != null ? `${delta(salesStats.growth.net)} vs prior` : undefined} variant="positive" />
            <KpiBox label="Avg Txn Value"  val={fc(salesStats.atv)}    variant="default" />
            <KpiBox label="Discount Value" val={fc(salesStats.discount)} sub={`${fp(salesStats.discountPenetration)} penetration`} variant={salesStats.discountPenetration > 20 ? 'warn' : 'default'} />
            <KpiBox label="Members"        val={fn(salesStats.members)} sub={salesStats.growth.members != null ? `${delta(salesStats.growth.members)} vs prior` : undefined} variant="default" />
          </div>

          {/* 4-period comparison table — full width */}
          <Card fullWidth style={{ marginBottom: 20 }}>
            <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, fontFamily: T.sans, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              Sales Metrics — 4-Period Comparison
            </div>
            <div style={{ padding: 0, overflowX: 'auto' }}>
              <table style={tblStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, minWidth: 180 }}>Metric</th>
                    <th style={{ ...thStyle, textAlign: 'right', color: C.text, background: 'rgba(26,110,181,.05)', borderBottom: `2px solid ${C.blue}` }}>{curLabel}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>{prevLabel}</th>
                    {ytdLabel && <th style={{ ...thStyle, textAlign: 'right' }}>{ytdLabel}</th>}
                    {lastYearLabel && <th style={{ ...thStyle, textAlign: 'right' }}>{lastYearLabel}</th>}
                    <th style={{ ...thStyle, textAlign: 'right' }}>vs Prev</th>
                    {ytdLabel && <th style={{ ...thStyle, textAlign: 'right' }}>vs YTD</th>}
                  </tr>
                </thead>
                <tbody>
                  {metricRows.slice(0, 14).map((row, idx) => {
                    const cur  = rowVal(idx, curMonth);
                    const prev = rowVal(idx, prevMonth);
                    const ytd  = rowYtd(idx);
                    const ly   = hasSameMonthLY ? rowVal(idx, sameMonthLastYear) : null;
                    const vsPrev = pctVs(cur, prev);
                    const vsYtd  = pctVs(cur, ytd);
                    return (
                      <tr key={row.label} className="sp-tbl-row">
                        <td style={{ ...tdStyle, fontWeight: 600, color: C.text }}>{row.label}</td>
                        <td style={{ ...tdR, fontWeight: 700, color: C.text, background: 'rgba(26,110,181,.03)' }}>{formatRowVal(idx, cur)}</td>
                        <td style={{ ...tdR, color: C.textMuted }}>{formatRowVal(idx, prev)}</td>
                        {ytdLabel && <td style={{ ...tdR, color: C.textMuted }}>{ytd != null ? formatRowVal(idx, ytd) : '—'}</td>}
                        {lastYearLabel && <td style={{ ...tdR, color: C.textMuted }}>{ly != null ? formatRowVal(idx, ly) : '—'}</td>}
                        <td style={{ ...tdR, width: 90 }}>
                          {vsPrev != null ? badge(delta(vsPrev), vsPrev > 5 ? 'green' : vsPrev < -5 ? 'red' : 'gray') : badge('—', 'gray')}
                        </td>
                        {ytdLabel && (
                          <td style={{ ...tdR, width: 90 }}>
                            {vsYtd != null ? badge(delta(vsYtd), vsYtd > 5 ? 'green' : vsYtd < -5 ? 'red' : 'gray') : badge('—', 'gray')}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Revenue mix 3D chart + insights row */}
          <div style={{ display: 'grid', gridTemplateColumns: revMixData.length >= 2 ? '1fr 1fr' : '1fr', gap: 20, marginBottom: 24 }}>
            {revMixData.length >= 2 && (
              <Bar3DChart title={`Revenue Mix — ${curLabel}`} data={revMixData} />
            )}
            <Card title="Financial Insights">
              {getSummary?.('financial')?.bullets?.map((b, i) => <Insight key={i} text={b} variant={i === 0 ? 'blue' : i % 2 === 0 ? 'green' : 'default'} />) ??
                (sectionEdits?.['financial'] ? sectionEdits['financial'].split('\n').filter(Boolean).map((b, i) => <Insight key={i} text={b.replace(/^[•·]\s*/, '')} />) : [
                  <Insight key={0} variant="blue" text={<><strong>Revenue quality:</strong> Net-to-gross ratio of {fp(salesStats.net / Math.max(salesStats.gross, 1) * 100)} indicates {salesStats.net / Math.max(salesStats.gross, 1) > 0.9 ? 'strong' : 'moderate'} revenue quality. Discount penetration at {fp(salesStats.discountPenetration)} is {salesStats.discountPenetration < 15 ? 'within healthy range' : salesStats.discountPenetration < 25 ? 'approaching elevated territory — monitor closely' : 'above recommended thresholds — track promo substitution behaviour'}.</>} />,
                  <Insight key={1} text={<><strong>Transaction depth:</strong> {fn(salesStats.txns)} transactions from {fn(salesStats.members)} unique members — {(salesStats.txns / Math.max(salesStats.members, 1)).toFixed(1)} purchases per active member. Members transacting &gt;1× per period indicate product mix or multi-session purchasing patterns.</>} />,
                  <Insight key={2} variant="warn" text={<><strong>Discount dependency:</strong> {fp(salesStats.discountPenetration)} of all transactions are discounted. If this figure is rising period-on-period, it signals promo dependency — pricing strategy should be reviewed. Track whether discounts are driving net-new purchases or substituting full-price intent.</>} />,
                  salesStats.growth.net != null && <Insight key={3} variant={salesStats.growth.net >= 0 ? 'green' : 'red'} text={<><strong>Period momentum:</strong> Net revenue is {delta(salesStats.growth.net)} vs the prior period. {salesStats.growth.net >= 0 ? `Positive momentum. Sustain the drivers — identify which product categories and acquisition channels contributed to the growth.` : `Revenue decline requires a driver-level decomposition. Determine whether the decline is concentrated in specific products, channels, or trainer-led transactions.`}</>} />,
                ])
              }
            </Card>
          </div>
        </section>

        <hr className="sp-report-divider" />

        {/* ══════════════════════════════════
            SECTION 02 — SESSIONS
        ══════════════════════════════════ */}
        <section id="rpt-session">
          <div className="sp-sechead">
            <SectionHeader num="02" eyebrow="Session Intelligence" title={<>Class Performance,<br />Fill Rates &amp; Scheduling</>}
              context={`${fn(sessionStats.totalSessions)} sessions ran across all formats during this period. Fill rate is the primary scheduling health metric — formats below 40% fill consume trainer time and studio capacity below operational viability. Format slots with consistent above-70% fill rates represent constrained demand.`}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            <KpiBox label="Total Sessions"   val={fn(sessionStats.totalSessions)} variant="blue" />
            <KpiBox label="Total Attendance" val={fn(sessionStats.attendance)} />
            <KpiBox label="Avg Fill Rate"    val={fp(sessionStats.avgFill)} variant={sessionStats.avgFill > 55 ? 'positive' : 'warn'} />
            <KpiBox label="Late Cancels"     val={fn(lcStats.total)} variant={lcStats.total > 150 ? 'red' : 'warn'} />
          </div>

          {/* Session insights above the table */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: C.textVeryLight, marginBottom: 12 }}>Session Insights</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {getSummary?.('session')?.bullets?.slice(0, 3).map((b, i) => <Insight key={i} text={b} variant={i === 0 ? 'blue' : i === 1 ? 'green' : 'warn'} />) ?? [
                <Insight key={0} variant="blue" text={<><strong>Fill rate benchmark:</strong> {fp(sessionStats.avgFill)} average fill rate across {fn(sessionStats.totalSessions)} sessions. {sessionStats.avgFill > 65 ? 'Above 65% — the studio is at high-utilisation. Adding sessions in peak slots would capture latent demand directly.' : sessionStats.avgFill > 50 ? 'Approaching the 55% efficiency threshold. The schedule is functional but optimisation is available through slot redistribution.' : 'Below 50% — the current schedule has significant underutilised capacity. Redistribution from low-fill to high-fill formats is the primary scheduling lever.'}</>} />,
                sessionsSorted[0] && <Insight key={1} variant="green" text={<><strong>{sessionsSorted[0].name}</strong> leads all formats at {fp(sessionsSorted[0].fillRate)} fill across {fn(sessionsSorted[0].sessions)} sessions. This format has demonstrated consistent demand — {fn(sessionsSorted[0].lateCancels)} late cancellations confirm that clients are booking speculatively, a signal that additional sessions would be absorbed.</>} />,
                lateCancelsSorted[0] && <Insight key={2} variant="warn" text={<><strong>Late cancellation concentration:</strong> {lateCancelsSorted[0].name} accounts for {fn(lateCancelsSorted[0].lateCancels)} late cancellations, the highest of any format. This indicates high booking intent with low commitment — an ideal candidate for the late cancellation fee policy.</>} />,
              ]}
            </div>
          </div>

          {/* Full-width class format table */}
          <Card fullWidth style={{ marginBottom: 20 }}>
            <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, fontFamily: T.sans, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              Class Format Performance — {fn(sessionIntelligenceRows.length)} Formats Ranked by Fill Rate
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tblStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 30 }}>#</th>
                    <th style={thStyle}>Format</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Sessions</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Attendance</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Capacity</th>
                    <th style={{ ...thStyle, width: 140 }}>Fill Rate</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Late Cancels</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Canc. Rate</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionsSorted.map((row, i) => {
                    const fill     = row.fillRate;
                    const barColor = fill >= 70 ? '#16a34a' : fill >= 50 ? C.blue : fill >= 35 ? C.warn : C.red;
                    const status   = fill >= 70 ? badge('High demand', 'green') : fill >= 50 ? badge('Healthy', 'blue') : fill >= 35 ? badge('Below avg', 'warn') : badge('Underperforming', 'red');
                    return (
                      <tr key={row.name} className="sp-tbl-row">
                        <td style={{ ...tdStyle, color: C.textVeryLight, fontSize: 11 }}>{i + 1}</td>
                        <td style={tdBold}>{row.name}</td>
                        <td style={tdR}>{fn(row.sessions)}</td>
                        <td style={tdR}>{fn(row.visits)}</td>
                        <td style={{ ...tdR, color: C.textLight }}>{fn(row.capacity)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, height: 6, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(fill, 100)}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: C.text, minWidth: 38, textAlign: 'right' }}>{fp(fill)}</span>
                          </div>
                        </td>
                        <td style={tdR}>{fn(row.lateCancels)}</td>
                        <td style={tdR}>{fp(row.cancellationRate)}</td>
                        <td style={tdStyle}>{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Top performing class slots (class+day+time+trainer) */}
          {topSlots.length > 0 && (
            <Card fullWidth style={{ marginBottom: 20 }}>
              <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, fontFamily: T.sans, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
                Top Performing Class Slots — Class · Day · Time · Trainer
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={tblStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: 30 }}>#</th>
                      <th style={thStyle}>Class</th>
                      <th style={thStyle}>Day</th>
                      <th style={thStyle}>Time</th>
                      <th style={thStyle}>Trainer</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Sessions</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Attendance</th>
                      <th style={{ ...thStyle, width: 130 }}>Fill Rate</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Late Cancels</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSlots.map((s, i) => {
                      const fill     = s.fillRate;
                      const barColor = fill >= 70 ? '#16a34a' : fill >= 50 ? C.blue : fill >= 35 ? C.warn : C.red;
                      return (
                        <tr key={`${s.name}-${s.day}-${s.time}-${s.trainer}`} className="sp-tbl-row">
                          <td style={{ ...tdStyle, color: C.textVeryLight, fontSize: 11 }}>{i + 1}</td>
                          <td style={tdBold}>{s.name}</td>
                          <td style={tdStyle}>{s.day}</td>
                          <td style={tdStyle}>{s.time}</td>
                          <td style={tdStyle}>{s.trainer}</td>
                          <td style={tdR}>{fn(s.sessions)}</td>
                          <td style={tdR}>{fn(s.visits)}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 5, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(fill, 100)}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.text, minWidth: 36 }}>{fp(fill)}</span>
                            </div>
                          </td>
                          <td style={tdR}>{fn(s.lateCancels)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Late cancels table */}
          {lateCancelsSorted.length > 0 && (
            <Card fullWidth>
              <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, fontFamily: T.sans, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
                Late Cancellations by Format — {fn(lcStats.total)} Total
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={tblStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Format</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Late Cancels</th>
                      <th style={{ ...thStyle, width: 130 }}>Volume</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>% of Total</th>
                      <th style={thStyle}>Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lateCancelsSorted.map((row) => {
                      const maxLC = lateCancelsSorted[0]?.lateCancels || 1;
                      const pct   = (row.lateCancels / maxLC) * 100;
                      const sharePct = lcStats.total > 0 ? (row.lateCancels / lcStats.total) * 100 : 0;
                      return (
                        <tr key={row.name} className="sp-tbl-row">
                          <td style={tdBold}>{row.name}</td>
                          <td style={{ ...tdR, fontWeight: 700, color: C.text }}>{fn(row.lateCancels)}</td>
                          <td style={tdStyle}>
                            <div style={{ height: 6, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? C.red : pct > 50 ? C.warn : C.blueLight, borderRadius: 3 }} />
                            </div>
                          </td>
                          <td style={tdR}>{fp(sharePct)}</td>
                          <td style={tdStyle}>
                            {row.lateCancels > 30 ? badge('Implement fee — highest volume', 'red') : row.lateCancels > 15 ? badge('Add waitlist trigger', 'warn') : badge('Monitor trend', 'blue')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>

        <hr className="sp-report-divider" />

        {/* ══════════════════════════════════
            SECTION 03 — TRAINERS
        ══════════════════════════════════ */}
        <section id="rpt-trainer">
          <div className="sp-sechead">
            <SectionHeader num="03" eyebrow="Trainer Intelligence" title={<>Trainer Rankings,<br />Conversion &amp; Efficiency</>}
              context="Revenue Score is a composite of fill rate, conversion rate, and paid revenue relative to session load. Conversion rate reflects how often new clients from that trainer's classes subsequently purchased a membership. Trainers with high fill but zero conversion represent a specific intervention opportunity."
            />
          </div>

          {/* Trainer insights above the table */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: C.textVeryLight, marginBottom: 12 }}>Trainer Insights</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {getSummary?.('trainer')?.bullets?.slice(0, 3).map((b, i) => <Insight key={i} text={b} variant={i === 0 ? 'green' : i === 1 ? 'warn' : 'default'} />) ??
                (sectionEdits?.['trainer'] ? sectionEdits['trainer'].split('\n').filter(Boolean).slice(0, 3).map((b, i) => <Insight key={i} text={b.replace(/^[•·]\s*/, '')} />) : [
                  trainersSorted[0] && <Insight key={0} variant="green" text={<><strong>{trainersSorted[0].name}</strong> leads the ranking with a composite score of {trainersSorted[0].revenueScore.toFixed(1)}. Running {fn(trainersSorted[0].sessions)} sessions at {fp(trainersSorted[0].fillRate > 1 ? trainersSorted[0].fillRate : trainersSorted[0].fillRate * 100)} fill — this trainer's class slots are among the studio's most reliably filled and should be given priority in the schedule.</>} />,
                  trainersSorted.find(t => (t.conversionRate > 1 ? t.conversionRate : t.conversionRate * 100) > 35) && <Insight key={1} variant="blue" text={<><strong>{trainersSorted.find(t => (t.conversionRate > 1 ? t.conversionRate : t.conversionRate * 100) > 35)?.name}</strong> has the highest conversion rate among trainers with meaningful session volume. Assigning them more new-client-facing and trial slots is the single highest-leverage scheduling change available.</>} />,
                  <Insight key={2} variant="warn" text={<>Trainers with 0% conversion and 12+ sessions represent a concentrated and recoverable opportunity. The gap between converting and non-converting trainers is almost never about skill — it is about whether post-class engagement is structured. A 30-minute protocol training session is the correct first intervention.</>} />,
                ])
              }
            </div>
          </div>

          {/* Full-width trainer table */}
          <Card fullWidth>
            <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, fontFamily: T.sans, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>
              Trainer Performance — All Metrics
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tblStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 30 }}>#</th>
                    <th style={thStyle}>Trainer</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Sessions</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Clients</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Paid Rev.</th>
                    <th style={{ ...thStyle, width: 120 }}>Fill Rate</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Utilisation</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Conv. Rate</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Score</th>
                    <th style={thStyle}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {trainersSorted.map((t, i) => {
                    const fillPct = t.fillRate > 1 ? t.fillRate : t.fillRate * 100;
                    const convPct = t.conversionRate > 1 ? t.conversionRate : t.conversionRate * 100;
                    const utilPct = t.utilization > 1 ? t.utilization : t.utilization * 100;
                    const barColor = fillPct >= 65 ? '#16a34a' : fillPct >= 45 ? C.blue : fillPct >= 30 ? C.warn : C.red;
                    const rating   = t.revenueScore >= 45 ? badge('Top performer', 'green') : t.revenueScore >= 30 ? badge('Strong', 'blue') : t.revenueScore >= 15 ? badge('Average', 'gray') : badge('Needs review', 'warn');
                    return (
                      <tr key={t.name} className="sp-tbl-row">
                        <td style={{ ...tdStyle, color: C.textVeryLight, fontSize: 11 }}>{i + 1}</td>
                        <td style={tdBold}>{t.name}</td>
                        <td style={tdR}>{fn(t.sessions)}</td>
                        <td style={tdR}>{fn(t.customers ?? 0)}</td>
                        <td style={tdR}>{fc(t.paid)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ flex: 1, height: 5, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(fillPct, 100)}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: C.text, minWidth: 34 }}>{fp(fillPct)}</span>
                          </div>
                        </td>
                        <td style={tdR}>{fp(utilPct)}</td>
                        <td style={tdR}>{fp(convPct)}</td>
                        <td style={{ ...tdR, fontWeight: 700, color: C.text }}>{t.revenueScore.toFixed(1)}</td>
                        <td style={tdStyle}>{rating}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <hr className="sp-report-divider" />

        {/* ══════════════════════════════════
            SECTION 04 — FUNNEL
        ══════════════════════════════════ */}
        <section id="rpt-funnel">
          <div className="sp-sechead">
            <SectionHeader num="04" eyebrow="New Client Funnel" title={<>Acquisition, Conversion<br />&amp; Channel Intelligence</>}
              context={`${fn(clientStats.newClients)} new clients visited during this period. ${fn(clientStats.converted)} converted (${fp(clientStats.conversionRate)}). ${fn(clientStats.retained)} were retained. The avg LTV of a converting client is ${fc(clientStats.avgLtv)} — making each unconverted client a quantified revenue miss.`}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            <KpiBox label="New Clients"     val={fn(clientStats.newClients)} variant="blue" />
            <KpiBox label="Converted"       val={fn(clientStats.converted)} sub={`${fp(clientStats.conversionRate)} rate`} variant="positive" />
            <KpiBox label="Retained"        val={fn(clientStats.retained)} sub={`${fp(clientStats.retentionRate)} retention`} />
            <KpiBox label="Did Not Convert" val={fn(clientStats.newClients - clientStats.converted)} sub={`${fp(100 - clientStats.conversionRate)} walked away`} variant={clientStats.conversionRate < 30 ? 'warn' : 'default'} />
          </div>

          {/* Funnel insights above */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: C.textVeryLight, marginBottom: 12 }}>Funnel Insights</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Insight variant="blue" text={<><strong>Conversion pipeline value:</strong> With {fn(clientStats.newClients)} new clients and {fc(clientStats.avgLtv)} avg LTV, the total addressable conversion value this period is {fc(clientStats.newClients * clientStats.avgLtv)}. At {fp(clientStats.conversionRate)} conversion, {fc(clientStats.converted * clientStats.avgLtv)} was captured and {fc((clientStats.newClients - clientStats.converted) * clientStats.avgLtv)} left on the table.</>} />
              <Insight variant={clientStats.conversionRate < 30 ? 'warn' : 'green'} text={<><strong>Conversion benchmark:</strong> Industry-leading boutique fitness studios convert 35–50% of first-time visitors. At {fp(clientStats.conversionRate)}, the studio is {clientStats.conversionRate < 30 ? 'significantly below' : clientStats.conversionRate < 40 ? 'approaching' : 'meeting'} this threshold. The gap is almost entirely closed through structured same-day follow-up — not discounting.</>} />
              {topFunnelSource ? (
                <Insight variant="green" text={<><strong>{topFunnelSource.name}</strong> is the highest-converting acquisition channel at {fp(topFunnelSource.conversionRate)} ({fn(topFunnelSource.leads)} leads → {fn(topFunnelSource.converted)} conversions). This should be the primary channel for referral programme investment and formalisation.</>} />
              ) : (
                <Insight text={<><strong>Channel attribution:</strong> Ensure lead source is being captured for every new client. Attribution data enables channel-level investment decisions — without it, acquisition spend cannot be optimised.</>} />
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Conversion Funnel">
              <div style={{ marginBottom: 24 }}>
                <FunnelBar label="New Clients — First Visit"   value={clientStats.newClients} total={clientStats.newClients} color={C.blueLight} />
                <FunnelBar label="Returned for 2nd Visit"      value={clientStats.retained}   total={clientStats.newClients} color={C.blueLight} />
                <FunnelBar label="Converted to Paid Product"   value={clientStats.converted}  total={clientStats.newClients} color="#16a34a" />
                <FunnelBar label="Did Not Convert"             value={clientStats.newClients - clientStats.converted} total={clientStats.newClients} color={C.red} textColor={C.red} />
              </div>
              <div style={{ background: 'rgba(26,110,181,.05)', border: `1px solid rgba(26,110,181,.15)`, borderLeft: `3px solid ${C.blueLight}`, borderRadius: '0 6px 6px 0', padding: '14px 18px', fontFamily: T.sans, fontSize: 12, color: C.text2, lineHeight: 1.8 }}>
                Avg LTV of a converting client: <strong style={{ color: C.blue }}>{fc(clientStats.avgLtv)}</strong>. Moving conversion from {fp(clientStats.conversionRate)} to 30% represents {fn(Math.round(Math.max(0, clientStats.newClients * 0.3 - clientStats.converted)))} additional memberships at this avg LTV.
              </div>
            </Card>

            <Card title="Lead Source Analysis">
              <div style={{ overflowX: 'auto' }}>
                <table style={tblStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Source</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Leads</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Conv.</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Rate</th>
                      <th style={thStyle}>Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funnelSorted.map((row) => {
                      const conv = row.conversionRate > 1 ? row.conversionRate : row.conversionRate * 100;
                      const quality = conv >= 30 ? badge('High quality', 'green') : conv >= 15 ? badge('Moderate', 'blue') : conv > 0 ? badge('Low yield', 'warn') : badge('0% conv.', 'red');
                      return (
                        <tr key={row.name} className="sp-tbl-row">
                          <td style={tdBold}>{row.name}</td>
                          <td style={tdR}>{fn(row.leads)}</td>
                          <td style={tdR}>{fn(row.converted)}</td>
                          <td style={{ ...tdR, fontWeight: 700, color: C.text }}>{fp(conv)}</td>
                          <td style={tdStyle}>{quality}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        <hr className="sp-report-divider" />

        {/* ══════════════════════════════════
            SECTION 05 — LAPSED
        ══════════════════════════════════ */}
        <section id="rpt-lapsed">
          <div className="sp-sechead">
            <SectionHeader num="05" eyebrow="Lapsed Memberships" title={<>Expiry Analysis<br />&amp; Win-Back Strategy</>}
              context={`${fn(expirationStats.total)} memberships expired during the period. ${fn(expirationStats.lapsed)} lapsed, ${fn(expirationStats.renewed)} renewed. The 60-day win-back window is the critical action deadline — beyond that, probability of recovery drops below 5%.`}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            <KpiBox label="Total Expirations" val={fn(expirationStats.total)} variant="default" />
            <KpiBox label="Lapsed"            val={fn(expirationStats.lapsed)} sub={`${fp(expirationStats.lapsedPct)} lapse rate`} variant={expirationStats.lapsedPct > 60 ? 'red' : 'warn'} />
            <KpiBox label="Renewed"           val={fn(expirationStats.renewed)} sub={`${fn(expirationStats.total - expirationStats.lapsed - expirationStats.renewed)} active/frozen`} variant={expirationStats.renewed > 0 ? 'positive' : 'default'} />
            <KpiBox label="Avg LTV (Lapsed)"  val={fc(expirationStats.avgLtvLapsed)} />
          </div>

          {/* Lapsed insights above */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: C.textVeryLight, marginBottom: 12 }}>Retention Insights</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Insight variant={expirationStats.lapsedPct > 60 ? 'red' : 'warn'} text={<><strong>Renewal rate signal:</strong> {fp(100 - expirationStats.lapsedPct)} of expiring memberships renewed. Industry benchmark for high-performing boutique fitness studios is 35–50% renewal within the expiry month. {expirationStats.lapsedPct > 60 ? 'The current rate indicates either an absent proactive renewal process or a pricing/value perception issue requiring direct investigation.' : 'Current rate is below optimal — structured pre-expiry outreach (7, 14, 30 days before) can close the gap.'}</>} />
              <Insight variant="warn" text={<><strong>Win-back urgency:</strong> Research in boutique fitness shows win-back probability drops by 10–15% per week post-lapse, reaching near zero at 60 days. For the {fn(expirationStats.lapsed)} lapsed members, the clock is running. Tier 1 (high-value products) must be contacted by phone within 7 days — not email.</>} />
              <Insight variant="blue" text={<><strong>Revenue recovery potential:</strong> At {fc(expirationStats.avgLtvLapsed)} avg LTV for lapsed members, even a 15% win-back rate represents {fc(Math.round(expirationStats.lapsed * 0.15) * expirationStats.avgLtvLapsed)} in recovered membership revenue — at near-zero acquisition cost compared to new client acquisition.</>} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Lapsed Memberships by Product">
              <div style={{ overflowX: 'auto' }}>
                <table style={tblStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Membership Product</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Lapsed</th>
                      <th style={{ ...thStyle, width: 110 }}>Share</th>
                      <th style={thStyle}>Win-Back Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lapsedByMembership.map((row, i) => {
                      const pct = expirationStats.lapsed > 0 ? (row.count / expirationStats.lapsed) * 100 : 0;
                      return (
                        <tr key={row.name} className="sp-tbl-row">
                          <td style={tdBold}>{row.name}</td>
                          <td style={{ ...tdR, fontWeight: 700, color: C.text, fontFamily: T.serif, fontSize: 16 }}>{fn(row.count)}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 6, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: i < 2 ? C.red : C.warn, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 10, color: C.textLight, minWidth: 30 }}>{fp(pct)}</span>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            {i === 0 ? badge('Tier 1 — Personal call', 'red') : i < 3 ? badge('Tier 2 — WhatsApp', 'warn') : badge('Tier 3 — Email', 'blue')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Win-Back Protocol">
              <Insight variant="red"  text={<><strong>No proactive renewal outreach is evident.</strong> In a functioning retention system, 20–35% of expiring members renew before or within 7 days of expiry. The current {fp(expirationStats.lapsedPct)} lapse rate signals either no automated reminder or an insufficient manual follow-up process. Both are fixable within one week.</>} />
              <Insight variant="warn" text={<><strong>Win-back window is time-critical.</strong> 60 days post-lapse is the boundary beyond which win-back probability drops below 5%. Every week without outreach reduces that probability by 10–15 points. Begin Tier 1 outreach this week — not next month's goal-setting.</>} />
              <Insight variant="green" text={<><strong>Tier 1 — Personal phone call, this week.</strong> High-value lapses: Annual, 6-Month, 3-Month, multi-class packs. Script: acknowledge the lapse without pressure, offer a complimentary re-entry class, present a renewal conversation in studio. Do not send a template — make it personal and specific.</>} />
              <Insight variant="blue" text={<><strong>Tier 2 — WhatsApp sequence, days 4–14.</strong> Mid-tier lapses. Two messages: Day 7 (value message, highlight new classes) and Day 14 (time-limited renewal offer). WhatsApp response rates are 5–10× higher than email for re-engagement.</>} />
            </Card>
          </div>
        </section>

        <hr className="sp-report-divider" />

        {/* ══════════════════════════════════
            SECTION 06 — RED FLAGS
        ══════════════════════════════════ */}
        <section id="rpt-flags">
          <div className="sp-sechead">
            <SectionHeader num="06" eyebrow="Red Flags & Predictions" title={<>Business Risk Signals<br />&amp; Forward Outlook</>}
              context="Red flags are data patterns that pose a structural risk to revenue, retention, or operations if left unaddressed. Each flag is directly traceable to a specific data point in this report. The order reflects estimated revenue impact, not severity."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
            {redFlags.map(flag => <FlagBox key={flag.num} {...flag} />)}
          </div>
        </section>

        <hr className="sp-report-divider" />

        {/* ══════════════════════════════════
            SECTION 07 — WHAT WORKED / DIDN'T
        ══════════════════════════════════ */}
        <section id="rpt-ww">
          <div className="sp-sechead">
            <SectionHeader num="07" eyebrow="Performance Diagnostics" title={<>What Worked &amp;<br />What Needs Attention</>}
              context="A structured diagnostic review of performance drivers and failure points. Each item is directly supported by a data point in this report."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* What Worked */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                paddingBottom: 12, borderBottom: `2px solid #16a34a`,
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#16a34a',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: T.sans, fontSize: 13, fontWeight: 700, color: '#fff',
                }}>✓</span>
                <span style={{ fontFamily: T.serif, fontSize: 18, color: C.text }}>What Worked This Period</span>
              </div>
              {wwPositive.map((item, i) => (
                <div key={`pos-${i}`} style={{
                  background: 'rgba(22,163,74,.04)', border: `1px solid rgba(22,163,74,.12)`,
                  borderLeft: `3px solid #16a34a`, borderRadius: '0 8px 8px 0',
                  padding: '16px 20px', marginBottom: 12,
                }}>
                  <div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>{item.title}</div>
                  <p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.8, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>

            {/* What Needs Attention */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                paddingBottom: 12, borderBottom: `2px solid ${C.warn}`,
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', background: C.warn,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: T.sans, fontSize: 13, fontWeight: 700, color: '#fff',
                }}>!</span>
                <span style={{ fontFamily: T.serif, fontSize: 18, color: C.text }}>What Needs Attention</span>
              </div>
              {wwNegative.map((item, i) => (
                <div key={`neg-${i}`} style={{
                  background: `${C.warnPale}`, border: `1px solid rgba(192,86,33,.12)`,
                  borderLeft: `3px solid ${C.warn}`, borderRadius: '0 8px 8px 0',
                  padding: '16px 20px', marginBottom: 12,
                }}>
                  <div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>{item.title}</div>
                  <p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.8, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="sp-report-divider" />

        {/* ══════════════════════════════════
            SECTION 08 — ACTION PLAN
        ══════════════════════════════════ */}
        <section id="rpt-actions">
          <div className="sp-sechead">
            <SectionHeader num="08" eyebrow="Strategic Action Plan" title={<>Priority Decisions —<br />{curLabel}</>}
              context="Each action is directly traceable to a data point in this report. Owner, timeline, and expected outcome are specified. These are not suggestions — they are the minimum viable interventions required to move the tracked metrics before the next review."
            />
          </div>

          {actions.map((action) => (
            <div key={action.num} style={{
              display: 'flex', gap: 24, marginBottom: 20,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '22px 28px',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: T.sans, fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>{action.num}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {action.tags.map(tag => (
                    <span key={tag} style={{
                      fontFamily: T.sans, fontSize: 9, letterSpacing: '.3px', padding: '3px 9px',
                      borderRadius: 4, background: 'rgba(26,110,181,.08)', color: C.blue, fontWeight: 600,
                    }}>{tag}</span>
                  ))}
                </div>
                <h4 style={{ fontFamily: T.serif, fontSize: 17, color: C.text, fontWeight: 400, margin: '0 0 12px' }}>{action.title}</h4>
                {action.body}
              </div>
            </div>
          ))}
        </section>

        <hr className="sp-report-divider" />

        {/* ══════════════════════════════════
            SECTION 09 — CONCLUSIONS
        ══════════════════════════════════ */}
        <section id="rpt-conclusions">
          <div className="sp-sechead">
            <SectionHeader num="09" eyebrow="Conclusions" title={<>Period Summary<br />&amp; Key Takeaways</>} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
            {conclusions.map((c) => (
              <div key={c.num} style={{
                background: C.surface2, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '22px 24px',
              }}>
                <span style={{ fontFamily: T.serif, fontSize: 36, color: C.yellow, lineHeight: 1, marginBottom: 8, display: 'block' }}>{c.num}</span>
                <p style={{ fontFamily: T.sans, fontSize: 13, lineHeight: 1.7, color: C.text2, margin: '0 0 12px' }}>{c.text}</p>
                <span style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: '.5px', textTransform: 'uppercase', color: C.textLight, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'block' }}>{c.verdict}</span>
              </div>
            ))}
          </div>
        </section>

      </div>{/* end sp-report-wrap */}

      {/* Footer */}
      <div style={{
        background: C.navy, color: 'rgba(255,255,255,.28)',
        textAlign: 'center', padding: '36px',
        fontFamily: T.sans, fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase',
      }}>
        {studioName} · Monthly Performance Report · {dateRange.start} — {dateRange.end} · Studio Pulse Analytics
      </div>
    </div>
  );
}
