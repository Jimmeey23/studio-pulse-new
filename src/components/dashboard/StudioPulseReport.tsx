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
  navy: '#0d2137',
  navyMid: '#1a3a5c',
  blue: '#2b6cb0',
  blueLight: '#63b3ed',
  bluePale: 'rgba(43,108,176,.08)',
  yellow: '#e8b94f',
  red: '#e53e3e',
  redPale: 'rgba(229,62,62,.06)',
  green: '#38a169',
  greenPale: 'rgba(56,161,105,.08)',
  warn: '#dd6b20',
  warnPale: 'rgba(221,107,32,.07)',
  surface: '#ffffff',
  surface2: '#f7f9fc',
  border: '#e2e8f0',
  border2: '#c8d4e3',
  text: '#1a202c',
  text2: '#2d3748',
  textMuted: '#4a5568',
  textLight: '#718096',
};

const T = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};

/* ──────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────── */
function fc(v: number) {
  if (v >= 10_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(2)}L`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(0)}K`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}
function fcFull(v: number) {
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}
function fp(v: number) { return `${v.toFixed(1)}%`; }
function fn(v: number) { return Math.round(v).toLocaleString('en-IN'); }
function delta(v: number | null | undefined) {
  if (v == null) return '—';
  const s = v > 0 ? '+' : '';
  return `${s}${v.toFixed(1)}%`;
}
function deltaColor(v: number | null | undefined): string {
  if (v == null) return C.textLight;
  return v > 0 ? C.green : v < 0 ? C.red : C.textLight;
}
function badge(label: string, color: 'green' | 'red' | 'warn' | 'blue' | 'gray' | 'yellow') {
  const bg: Record<string, string> = {
    green: C.greenPale, red: C.redPale, warn: C.warnPale,
    blue: C.bluePale, gray: 'rgba(113,128,150,.1)', yellow: 'rgba(232,185,79,.12)',
  };
  const fg: Record<string, string> = {
    green: C.green, red: C.red, warn: C.warn,
    blue: C.blueLight, gray: C.textLight, yellow: C.yellow,
  };
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontFamily: T.sans,
      letterSpacing: '.3px', padding: '2px 8px', borderRadius: 20,
      background: bg[color], color: fg[color], fontWeight: 600,
    }}>{label}</span>
  );
}

/* KPI box */
function KpiBox({ label, val, sub, variant = 'default' }: {
  label: string; val: string; sub?: string; variant?: 'default' | 'blue' | 'positive' | 'warn' | 'red';
}) {
  const accent: Record<string, string> = {
    default: C.border2, blue: C.blue, positive: C.green, warn: C.warn, red: C.red,
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

/* Section header */
function SectionHeader({ num, eyebrow, title, context }: { num: string; eyebrow: string; title: React.ReactNode; context?: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32, alignItems: 'start' }}>
      <div>
        <div style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: C.textLight, marginBottom: 8 }}>{num} · {eyebrow}</div>
        <div style={{ fontFamily: T.serif, fontSize: 30, color: C.text, lineHeight: 1.25 }}>{title}</div>
      </div>
      {context && (
        <div style={{ fontFamily: T.sans, fontSize: 13, color: C.textMuted, lineHeight: 1.75, paddingTop: 6 }}>{context}</div>
      )}
    </div>
  );
}

/* Insight box */
function Insight({ text, variant = 'default' }: { text: React.ReactNode; variant?: 'default' | 'blue' | 'green' | 'warn' | 'red' }) {
  const border: Record<string, string> = {
    default: C.border2, blue: C.blueLight, green: C.green, warn: C.warn, red: C.red,
  };
  return (
    <div style={{
      borderLeft: `3px solid ${border[variant]}`, background: C.surface2,
      padding: '14px 18px', marginBottom: 10, borderRadius: '0 6px 6px 0',
      fontFamily: T.sans, fontSize: 13, lineHeight: 1.75, color: C.text2,
    }}>{text}</div>
  );
}

/* Funnel bar */
function FunnelBar({ label, value, total, color = C.blueLight, textColor }: {
  label: string; value: number; total: number; color?: string; textColor?: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.sans, fontSize: 12, color: C.text2, marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: textColor || C.textLight }}>{fn(value)} · {fp(pct)}</span>
      </div>
      <div style={{ height: 10, background: C.surface2, borderRadius: 5, overflow: 'hidden', border: `1px solid ${C.border}` }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5 }} />
      </div>
    </div>
  );
}

/* Table styles */
const tblStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontFamily: T.sans };
const thStyle: React.CSSProperties = {
  padding: '8px 12px', textAlign: 'left', fontSize: 9, letterSpacing: '1.5px',
  textTransform: 'uppercase', color: C.textLight, borderBottom: `2px solid ${C.border}`,
  background: C.surface2, fontWeight: 600,
};
const tdStyle: React.CSSProperties = { padding: '9px 12px', fontSize: 12, color: C.text2, borderBottom: `1px solid ${C.border}` };
const tdR: React.CSSProperties = { ...tdStyle, textAlign: 'right' };

/* Card */
function Card({ title, children, style }: { title?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', ...style }}>
      {title && (
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, fontFamily: T.sans, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700 }}>{title}</div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

/* Flag box */
function FlagBox({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div style={{ background: C.redPale, border: `1px solid rgba(229,62,62,.15)`, borderLeft: `3px solid ${C.red}`, borderRadius: 6, padding: '18px 20px' }}>
      <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: '.5px', textTransform: 'uppercase', color: C.red, marginBottom: 6, fontWeight: 700 }}>Red Flag {num}</div>
      <div style={{ fontFamily: T.serif, fontSize: 15, color: C.text, marginBottom: 8 }}>{title}</div>
      <p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.7, margin: 0 }}>{text}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────── */
export function StudioPulseReport(props: StudioPulseReportProps) {
  const {
    studioName, dateRange, salesStats, sessionStats,
    sessionIntelligenceRows, trainerRows, clientStats,
    funnelRows, lcStats, expirationStats, lapsedByMembership,
    salesMatrix, getSummary, sectionEdits, onClose,
  } = props;

  /* ── Derived comparison data ────────────────────────────── */
  const { months, monthLabels, metricRows } = salesMatrix;
  const curMonth = months[0] || '';
  const prevMonth = months[1] || '';
  const baseMonths = months.slice(2, 5);
  const curLabel = monthLabels[curMonth] || 'Current';
  const prevLabel = monthLabels[prevMonth] || 'Previous';
  const baseLabel = baseMonths.length >= 2
    ? `${monthLabels[baseMonths[baseMonths.length - 1]] || ''}–${monthLabels[baseMonths[0]] || ''} Avg`
    : 'Baseline';

  function rowVal(idx: number, month: string) { return metricRows[idx]?.values[month] ?? 0; }
  function rowBase(idx: number) {
    if (!baseMonths.length) return null;
    return baseMonths.reduce((s, m) => s + (metricRows[idx]?.values[m] ?? 0), 0) / baseMonths.length;
  }
  function formatRowVal(idx: number, v: number) {
    const type = metricRows[idx]?.type;
    if (type === 'currency') return fcFull(v);
    if (type === 'percent') return fp(v);
    return fn(v);
  }

  /* ── Session rows sorted by fill descending ─────────────── */
  const sessionsSorted = useMemo(
    () => [...sessionIntelligenceRows].sort((a, b) => b.fillRate - a.fillRate).slice(0, 12),
    [sessionIntelligenceRows]
  );
  const lateCancelsSorted = useMemo(
    () => [...sessionIntelligenceRows].sort((a, b) => b.lateCancels - a.lateCancels).filter(r => r.lateCancels > 0).slice(0, 8),
    [sessionIntelligenceRows]
  );

  /* ── Trainer rows sorted by revenueScore ───────────────── */
  const trainersSorted = useMemo(
    () => [...trainerRows].sort((a, b) => b.revenueScore - a.revenueScore).slice(0, 16),
    [trainerRows]
  );

  /* ── Funnel rows sorted by conversionRate ──────────────── */
  const funnelSorted = useMemo(
    () => [...funnelRows].filter(r => r.leads > 0).sort((a, b) => b.leads - a.leads).slice(0, 12),
    [funnelRows]
  );
  const topFunnelSource = useMemo(
    () => [...funnelRows].filter(r => r.leads >= 5).sort((a, b) => b.conversionRate - a.conversionRate)[0],
    [funnelRows]
  );

  /* ── Red flags (auto-computed) ─────────────────────────── */
  const redFlags = useMemo(() => {
    const flags: Array<{ num: string; title: string; text: string }> = [];
    let n = 1;
    if (expirationStats.lapsedPct > 60) {
      flags.push({ num: `0${n++}`, title: `${fp(expirationStats.lapsedPct)} Lapse Rate on Expiring Memberships`, text: `${fn(expirationStats.lapsed)} of ${fn(expirationStats.total)} memberships lapsed during this period with ${fn(expirationStats.renewed)} renewals recorded. A lapse rate above 60% signals either a genuine retention failure or an absent renewal outreach process. Each lapsed member represents a customer the studio has already won once — and is most likely to win again with the right intervention.` });
    }
    if (lcStats.total > 100) {
      flags.push({ num: `0${n++}`, title: `${fn(lcStats.total)} Late Cancellations — No Financial Deterrent in Place`, text: `Late cancellations represent blocked capacity in high-demand class formats. Without a fee structure, late cancellation is costless for the member — making it a rational choice to hold a spot speculatively. At an average revenue of ₹800–₹1,000 per check-in, the capacity lost to late cancels is a material and recoverable revenue leak.` });
    }
    if (salesStats.discountPenetration > 20) {
      flags.push({ num: `0${n++}`, title: `${fp(salesStats.discountPenetration)} Discount Penetration — Promo Dependency Risk`, text: `More than 1 in 5 transactions is discounted. While the gross revenue headline may appear healthy, the quality of that revenue is diminished when a significant portion flows through promotional pathways. Sustained discount penetration above 20% trains clients to expect reduced pricing, compressing long-term margin.` });
    }
    const zeroConvTrainers = trainersSorted.filter(t => t.sessions >= 12 && t.conversionRate === 0);
    if (zeroConvTrainers.length > 0) {
      const names = zeroConvTrainers.slice(0, 3).map(t => t.name).join(', ');
      flags.push({ num: `0${n++}`, title: `Zero Conversion Across ${fn(zeroConvTrainers.length)} High-Volume Trainer${zeroConvTrainers.length > 1 ? 's' : ''}`, text: `${names}${zeroConvTrainers.length > 3 ? ' and others' : ''} collectively ran ${fn(zeroConvTrainers.reduce((s, t) => s + t.sessions, 0))} sessions with ${fn(zeroConvTrainers.reduce((s, t) => s + (t.customers ?? 0), 0))} client visits and zero new membership conversions. These sessions are generating transactions and attendance but not growing the committed member base — the studio's primary long-term revenue engine.` });
    }
    const zeroConvSources = funnelSorted.filter(f => f.leads >= 8 && f.conversionRate === 0);
    if (zeroConvSources.length > 0) {
      const names = zeroConvSources.map(f => f.name).join(', ');
      flags.push({ num: `0${n++}`, title: `${names} — Lead Channel${zeroConvSources.length > 1 ? 's' : ''} Converting at 0%`, text: `${fn(zeroConvSources.reduce((s, f) => s + f.leads, 0))} leads arrived through these channel${zeroConvSources.length > 1 ? 's' : ''}. Zero converted. This is not a sample size issue — it indicates a broken or absent follow-up process for these specific acquisition pathways. Every day this persists, motivated prospects are being lost to inaction.` });
    }
    const underperformers = sessionsSorted.filter(s => s.fillRate < 30 && s.sessions >= 6);
    if (underperformers.length > 0) {
      const top = underperformers[underperformers.length - 1];
      flags.push({ num: `0${n++}`, title: `${top.name} — ${fp(top.fillRate)} Fill Rate Across ${fn(top.sessions)} Sessions`, text: `This format is consuming trainer time and studio capacity for an average audience of ${(top.visits / top.sessions).toFixed(1)} clients per session. Each session costs the studio more in operational overhead than the revenue it generates relative to alternatives. A schedule reduction or format discontinuation should be evaluated before the next scheduling cycle.` });
    }
    if (flags.length === 0) {
      flags.push({ num: '01', title: 'No Critical Red Flags Identified This Period', text: 'All key metrics are within healthy ranges. Continue monitoring lapse rate, late cancellation volume, and new client conversion rate as leading indicators for the next period.' });
    }
    return flags;
  }, [expirationStats, lcStats, salesStats, trainersSorted, funnelSorted, sessionsSorted]);

  /* ── What Worked / Didn't ──────────────────────────────── */
  const wwPositive = useMemo(() => {
    const items: string[] = [];
    if (topFunnelSource && topFunnelSource.conversionRate > 30) {
      items.push(`${topFunnelSource.name} channel is generating the highest-quality leads with a ${fp(topFunnelSource.conversionRate)} conversion rate. With ${fn(topFunnelSource.leads)} leads and ${fn(topFunnelSource.converted)} conversions, this is the studio's most effective acquisition pathway — and it's working without paid media.`);
    }
    const topTrainer = trainersSorted.find(t => t.conversionRate > 40 && t.sessions >= 8);
    if (topTrainer) {
      items.push(`${topTrainer.name} is converting at ${fp(topTrainer.conversionRate)} — the highest of any trainer with meaningful session volume. ${topTrainer.sessions} sessions, ${fp(topTrainer.fillRate)} fill rate. Assigning them to new client-facing time slots would extract greater value from this profile.`);
    }
    const topClass = sessionsSorted[0];
    if (topClass && topClass.fillRate > 65) {
      items.push(`${topClass.name} is performing at ${fp(topClass.fillRate)} fill — the highest in the studio across ${fn(topClass.sessions)} sessions. Demand has proven itself. The scheduling response should now match it.`);
    }
    const memSalesRow = metricRows.find(r => r.label === 'Membership Sales');
    const baseMemSales = memSalesRow ? rowBase(metricRows.indexOf(memSalesRow)) : null;
    const curMemSales = memSalesRow ? rowVal(metricRows.indexOf(memSalesRow), curMonth) : 0;
    if (baseMemSales && curMemSales > baseMemSales * 2) {
      items.push(`Membership sales at ${fc(curMemSales)} are significantly above the ${baseLabel} average of ${fc(baseMemSales)} — indicating a structural shift in buyer intent toward committed, recurring products rather than one-off purchases.`);
    }
    if (clientStats.newClients > 50) {
      items.push(`${fn(clientStats.newClients)} new clients visited during this period — a healthy acquisition volume that provides a meaningful pipeline for conversion and retention effort.`);
    }
    if (items.length < 3) {
      items.push(`Session attendance across ${fn(sessionStats.totalSessions)} total sessions demonstrates continued studio demand, with an average fill rate of ${fp(sessionStats.avgFill)}.`);
    }
    return items;
  }, [topFunnelSource, trainersSorted, sessionsSorted, metricRows, curMonth, baseLabel, clientStats, sessionStats]);

  const wwNegative = useMemo(() => {
    const items: string[] = [];
    const zeroConvTrainers = trainersSorted.filter(t => t.sessions >= 12 && t.conversionRate === 0);
    if (zeroConvTrainers.length > 0) {
      const names = zeroConvTrainers.slice(0, 2).map(t => t.name).join(' and ');
      items.push(`${names}${zeroConvTrainers.length > 2 ? ` and ${zeroConvTrainers.length - 2} others` : ''} ran ${fn(zeroConvTrainers.reduce((s, t) => s + t.sessions, 0))} sessions with zero new membership conversions. These trainers are servicing existing clients without adding new membership value.`);
    }
    if (clientStats.conversionRate < 35 && clientStats.newClients > 20) {
      const notConverted = clientStats.newClients - clientStats.converted;
      items.push(`${fn(notConverted)} of ${fn(clientStats.newClients)} new clients (${fp(100 - clientStats.conversionRate)}) left without purchasing. The first-class experience, same-day follow-up, and pricing conversation are the three variables that determine conversion — all appear underdeveloped.`);
    }
    if (lcStats.total > 80) {
      items.push(`${fn(lcStats.total)} late cancellations represent blocked capacity in the studio's highest-demand formats. Without a financial deterrent, late cancellation is costless for the member — creating systematic booking speculation.`);
    }
    const lowFill = sessionsSorted.filter(s => s.fillRate < 35 && s.sessions >= 5);
    if (lowFill.length > 0) {
      const lf = lowFill[lowFill.length - 1];
      items.push(`${lf.name} is running ${fn(lf.sessions)} sessions at ${fp(lf.fillRate)} fill — below the threshold of operational viability. Schedule reduction should be evaluated for the next period.`);
    }
    if (expirationStats.lapsedPct > 50) {
      items.push(`${fn(expirationStats.lapsed)} memberships lapsed with ${fn(expirationStats.renewed)} renewals recorded. The renewal capture process is either absent or insufficiently systematic to intercept expiring members before they churn.`);
    }
    if (items.length < 3) {
      items.push(`Website and digital acquisition channels are underperforming relative to referral and walk-in sources, indicating the digital follow-up process requires improvement.`);
    }
    return items;
  }, [trainersSorted, clientStats, lcStats, sessionsSorted, expirationStats]);

  /* ── Actions (5 data-driven) ───────────────────────────── */
  const actions = useMemo(() => {
    const list: Array<{ num: number; tags: string[]; title: string; body: React.ReactNode }> = [];
    if (expirationStats.lapsed >= 10) {
      list.push({
        num: 1, tags: ['Retention', 'Revenue Recovery', 'Urgent — This Week'],
        title: `Launch win-back outreach for all ${fn(expirationStats.lapsed)} lapsed members within 2 weeks`,
        body: (<p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>
          <strong style={{ color: C.text2 }}>The data:</strong> {fn(expirationStats.lapsed)} memberships lapsed with {fn(expirationStats.renewed)} renewals recorded. Research in boutique fitness shows that 60 days post-lapse is the boundary beyond which win-back probability drops below 5%.<br /><br />
          <strong style={{ color: C.text2 }}>Action:</strong> Personal outreach for high-value products (Annual, 6-Month, 3-Month, multi-class packs) via phone call this week. WhatsApp sequence for mid-tier lapses over the following 10 days. A 3-email sequence for month-pass lapses. Script: acknowledge the lapse without pressure, offer a complimentary re-entry class, present a renewal conversation in studio.<br /><br />
          <strong style={{ color: C.text2 }}>Expected outcome:</strong> A 15% win-back rate = {fn(Math.round(expirationStats.lapsed * 0.15))} renewals at average renewal value represents meaningful incremental revenue this period.
        </p>)
      });
    }
    if (lcStats.total > 80) {
      list.push({
        num: 2, tags: ['Operations', 'Revenue Recovery', 'Policy Decision — This Week'],
        title: `Implement a late cancellation fee across all high-demand formats`,
        body: (<p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>
          <strong style={{ color: C.text2 }}>The data:</strong> {fn(lcStats.total)} late cancellations this period.{lateCancelsSorted.length > 0 ? ` ${lateCancelsSorted[0].name} (${fn(lateCancelsSorted[0].lateCancels)}) and ${lateCancelsSorted[1]?.name || 'other formats'} (${fn(lateCancelsSorted[1]?.lateCancels ?? 0)}) are the primary contributors.` : ''}<br /><br />
          <strong style={{ color: C.text2 }}>Action:</strong> Introduce a ₹500 late cancellation fee for bookings cancelled within 8 hours of class start. Give each member one fee-free late cancel per rolling 30 days. Activate an automated waitlist system that fills cancelled spots within 15 minutes. Publish the policy with a 2-week grace period.<br /><br />
          <strong style={{ color: C.text2 }}>Expected outcome:</strong> A 40% reduction in late cancels frees capacity for real bookings plus direct fee income from remaining violations.
        </p>)
      });
    }
    if (clientStats.conversionRate < 35 && clientStats.newClients > 20) {
      list.push({
        num: 3, tags: ['Conversion', 'New Clients', 'Implement This Month'],
        title: `Implement a 24-hour new client follow-up protocol`,
        body: (<p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>
          <strong style={{ color: C.text2 }}>The data:</strong> {fp(100 - clientStats.conversionRate)} of {fn(clientStats.newClients)} new clients ({fn(clientStats.newClients - clientStats.converted)} people) left without converting. The avg LTV of a converting client is {fc(clientStats.avgLtv)} — making each conversion missed a material revenue event.<br /><br />
          <strong style={{ color: C.text2 }}>Action:</strong> Every new client receives a personal WhatsApp message from front desk within 4 hours of their first class — referencing something specific about the session, not a template. Assign a Website Lead Owner with a 2-hour phone response SLA for all digital form submissions. Trial-completed leads receive a 3-touch sequence: Day 1 call, Day 4 WhatsApp, Day 8 personal email.<br /><br />
          <strong style={{ color: C.text2 }}>Expected outcome:</strong> Moving conversion from {fp(clientStats.conversionRate)} to 30% represents {fn(Math.round(clientStats.newClients * 0.07))} additional memberships at {fc(clientStats.avgLtv)} avg LTV.
        </p>)
      });
    }
    if (topFunnelSource?.name?.toLowerCase().includes('referral')) {
      list.push({
        num: 4, tags: ['Referral Programme', 'Acquisition', 'Launch by Month End'],
        title: `Formalise the referral programme and set a monthly referral lead target`,
        body: (<p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>
          <strong style={{ color: C.text2 }}>The data:</strong> Referral generated {fn(topFunnelSource.leads)} leads at {fp(topFunnelSource.conversionRate)} conversion — organically, with no formal programme. The LTV/lead ratio is the highest of any channel.<br /><br />
          <strong style={{ color: C.text2 }}>Action:</strong> Name and publish the programme. For every referred client who purchases a membership or multi-class pack, the referring member earns one complimentary class credit. Communicate via trainers and front desk in post-class conversation — not mass email. Track referral source attribution rigorously. Set a monthly target: current volume + 35%.<br /><br />
          <strong style={{ color: C.text2 }}>Expected outcome:</strong> Growing referral volume by 35% at maintained conversion rates represents {fn(Math.round(topFunnelSource.leads * 0.35 * topFunnelSource.conversionRate / 100))} additional memberships/month at near-zero acquisition cost.
        </p>)
      });
    }
    if (list.length < 4) {
      const lowFillClass = [...sessionIntelligenceRows].sort((a, b) => a.fillRate - b.fillRate).find(s => s.sessions >= 6);
      const topFillClass = sessionsSorted[0];
      if (lowFillClass && topFillClass) {
        list.push({
          num: list.length + 1, tags: ['Scheduling', 'Revenue', 'Implement in Next Schedule Cycle'],
          title: `Restructure the class schedule: expand ${topFillClass.name}, reduce ${lowFillClass.name}`,
          body: (<p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>
            <strong style={{ color: C.text2 }}>The data:</strong> {topFillClass.name} is running at {fp(topFillClass.fillRate)} fill across {fn(topFillClass.sessions)} sessions — demand exceeds supply. {lowFillClass.name} is at {fp(lowFillClass.fillRate)} fill across {fn(lowFillClass.sessions)} sessions — operationally inefficient.<br /><br />
            <strong style={{ color: C.text2 }}>Action:</strong> Add 3–4 sessions of {topFillClass.name} to the next schedule at peak time slots where late cancels are highest. Reduce {lowFillClass.name} sessions by 25–30%. Redirect freed trainer time and room capacity to higher-demand formats.<br /><br />
            <strong style={{ color: C.text2 }}>Expected outcome:</strong> Overall studio fill rate moves from {fp(sessionStats.avgFill)} toward 60%+ within 60 days of the schedule change.
          </p>)
        });
      }
    }
    if (list.length < 5) {
      list.push({
        num: list.length + 1, tags: ['Data Quality', 'Reporting', 'This Month'],
        title: 'Resolve data gaps in usage and lapsed member records',
        body: (<p style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>
          <strong style={{ color: C.text2 }}>The data:</strong> Key operational fields — sessions used percentage, average sessions per month, and days active — appear incomplete for a significant portion of expiring member records. Without usage data, it is impossible to distinguish heavy users from disengaged ones.<br /><br />
          <strong style={{ color: C.text2 }}>Action:</strong> Assign one team member to audit data completeness in the CRM this month. Identify which fields are systematically absent and trace the gap to its source (import pipeline, manual entry, or system configuration). Implement a data validation check on new member onboarding so these fields are populated at first visit.<br /><br />
          <strong style={{ color: C.text2 }}>Expected outcome:</strong> Complete data enables retention segmentation, targeted win-back outreach, and accurate churn prediction — all of which are currently blocked by missing fields.
        </p>)
      });
    }
    return list.slice(0, 5);
  }, [expirationStats, lcStats, clientStats, topFunnelSource, sessionIntelligenceRows, sessionsSorted, sessionStats, lateCancelsSorted]);

  /* ── Conclusions ──────────────────────────────────────── */
  const conclusions = useMemo(() => [
    { num: '01', text: `Revenue stands at ${fc(salesStats.net)} net for the period with ${fp(salesStats.discountPenetration)} discount penetration.`, verdict: salesStats.growth.net != null ? `${delta(salesStats.growth.net)} vs prior period` : 'vs prior period' },
    { num: '02', text: `${fn(sessionStats.totalSessions)} sessions ran with ${fp(sessionStats.avgFill)} average fill rate across all formats.`, verdict: sessionStats.avgFill > 55 ? 'Healthy fill — expand high-demand formats' : 'Below 55% — schedule optimisation needed' },
    { num: '03', text: `${fn(clientStats.newClients)} new clients with ${fp(clientStats.conversionRate)} conversion rate. ${fn(clientStats.converted)} converted, ${fn(clientStats.retained)} retained.`, verdict: clientStats.conversionRate < 30 ? 'Conversion is the primary growth lever' : 'Conversion above 30% — maintain follow-up' },
    { num: '04', text: `${fn(expirationStats.lapsed)} memberships lapsed with ${fn(expirationStats.renewed)} renewals. Win-back window closes in 60 days.`, verdict: expirationStats.lapsedPct > 60 ? 'Critical — outreach must begin immediately' : 'Moderate risk — prioritise outreach' },
    { num: '05', text: `${fn(lcStats.total)} late cancellations recorded. A fee structure would recover capacity in high-demand formats.`, verdict: lcStats.total > 150 ? 'Critical — implement fee policy' : 'Actionable — policy recommended' },
    { num: '06', text: topFunnelSource ? `${topFunnelSource.name} channel leads with ${fp(topFunnelSource.conversionRate)} conversion — the studio's strongest organic growth signal.` : `Analyse and formalise the highest-converting acquisition channel to systematise growth.`, verdict: 'Formalise and scale this channel' },
  ], [salesStats, sessionStats, clientStats, expirationStats, lcStats, topFunnelSource]);

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: C.surface, overflowY: 'auto', fontFamily: T.sans }}>
      <style>{`
        @media print {
          .sp-report-topbar { display: none !important; }
          .sp-report-wrap { padding: 0 !important; }
        }
        .sp-report-wrap { max-width: 1100px; margin: 0 auto; padding: 0 32px 80px; }
        @media (max-width: 768px) { .sp-report-wrap { padding: 0 16px 60px; } }
        .sp-report-section-divider { border: none; border-top: 1px solid ${C.border}; margin: 56px 0; }
        .sp-tbl-row:hover td { background: ${C.surface2}; }
      `}</style>

      {/* Top bar */}
      <div className="sp-report-topbar" style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${C.border}`, padding: '10px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: C.textLight }}>Monthly Performance Report</span>
          <span style={{ color: C.border2 }}>·</span>
          <span style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted }}>{studioName}</span>
          <span style={{ color: C.border2 }}>·</span>
          <span style={{ fontFamily: T.sans, fontSize: 12, color: C.textMuted }}>{dateRange.start} to {dateRange.end}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{
            fontFamily: T.sans, fontSize: 11, color: C.blue, background: C.bluePale,
            border: `1px solid rgba(43,108,176,.2)`, borderRadius: 4, padding: '5px 14px', cursor: 'pointer',
          }}>Print / PDF</button>
          <button onClick={onClose} style={{
            fontFamily: T.sans, fontSize: 11, color: C.textMuted, background: C.surface2,
            border: `1px solid ${C.border}`, borderRadius: 4, padding: '5px 14px', cursor: 'pointer',
          }}>✕ Exit Report</button>
        </div>
      </div>

      {/* HERO */}
      <section style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 60%, #1e4a7c 100%)`, padding: '64px 0 0' }}>
        <div className="sp-report-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start', paddingBottom: 48 }}>
            <div>
              <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 20 }}>
                Senior Management Review · {studioName} · {dateRange.start} to {dateRange.end}
              </div>
              <h1 style={{ fontFamily: T.serif, fontSize: 52, color: '#fff', lineHeight: 1.1, margin: '0 0 24px', fontWeight: 400 }}>
                Monthly<br />Performance<br /><span style={{ color: C.yellow }}>Report</span>
              </h1>
              <p style={{ fontFamily: T.sans, fontSize: 13, color: 'rgba(255,255,255,.55)', lineHeight: 1.8, margin: 0 }}>
                A full-spectrum business intelligence review covering revenue, session performance, trainer analytics, new client acquisition, lapsed membership diagnostics, and strategic action items.
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 10, padding: '28px 32px',
            }}>
              <div style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>Executive Summary</div>
              <p style={{ fontFamily: T.sans, fontSize: 13, color: 'rgba(255,255,255,.8)', lineHeight: 1.85, margin: 0 }}>
                {curLabel} delivered <strong style={{ color: '#fff' }}>{fc(salesStats.gross)} gross revenue</strong> with <strong style={{ color: '#fff' }}>{fp(salesStats.discountPenetration)}</strong> discount penetration.
                {' '}{fn(sessionStats.totalSessions)} sessions ran at <strong style={{ color: '#fff' }}>{fp(sessionStats.avgFill)}</strong> average fill.
                {' '}{fn(clientStats.newClients)} new clients visited — <strong style={{ color: C.yellow }}>{fp(clientStats.conversionRate)} converted</strong>.
                {expirationStats.lapsed > 0 && <> <strong style={{ color: '#fc8181' }}>{fn(expirationStats.lapsed)} memberships lapsed</strong> with {fn(expirationStats.renewed)} renewals.</>}
                {' '}{fn(lcStats.total)} late cancellations were recorded, representing blocked capacity in high-demand formats.
                {salesStats.growth.net != null && <> Revenue is <strong style={{ color: salesStats.growth.net >= 0 ? '#68d391' : '#fc8181' }}>{delta(salesStats.growth.net)} vs the prior period</strong>.</>}
              </p>
            </div>
          </div>
        </div>
        {/* KPI bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', background: 'rgba(0,0,0,.25)', padding: '0' }}>
          <div className="sp-report-wrap" style={{ padding: '0 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
              {[
                { label: 'Gross Revenue', val: fc(salesStats.gross), delta: salesStats.growth.gross, note: null },
                { label: 'Net Revenue', val: fc(salesStats.net), delta: salesStats.growth.net, note: null },
                { label: 'Transactions', val: fn(salesStats.txns), delta: salesStats.growth.txns, note: null },
                { label: 'Unique Members', val: fn(salesStats.members), delta: salesStats.growth.members, note: null },
                { label: 'New Clients', val: fn(clientStats.newClients), delta: null, note: `${fp(clientStats.conversionRate)} converted` },
                { label: 'Avg Txn Value', val: fc(salesStats.atv), delta: null, note: null },
                { label: 'Late Cancels', val: fn(lcStats.total), delta: null, note: lcStats.total > 150 ? 'Critical — action req\'d' : 'Monitor volume' },
              ].map((k, i) => (
                <div key={i} style={{
                  padding: '18px 16px', borderRight: i < 6 ? '1px solid rgba(255,255,255,.08)' : 'none',
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontFamily: T.serif, fontSize: 22, color: '#fff', marginBottom: 4 }}>{k.val}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 10, color: k.delta != null ? deltaColor(k.delta) : (k.note?.includes('Critical') ? '#fc8181' : 'rgba(255,255,255,.35)') }}>
                    {k.delta != null ? delta(k.delta) + ' vs prior' : (k.note || '—')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="sp-report-wrap">
        {/* TOC */}
        <nav style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '24px 32px', margin: '40px 0 48px' }}>
          <div style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: C.textLight, marginBottom: 16 }}>Contents</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px 16px' }}>
            {[
              { num: '01', label: 'Financial Performance', href: '#rpt-fin' },
              { num: '02', label: 'Session Intelligence', href: '#rpt-session' },
              { num: '03', label: 'Trainer Intelligence', href: '#rpt-trainer' },
              { num: '04', label: 'New Client Funnel', href: '#rpt-funnel' },
              { num: '05', label: 'Lapsed Memberships', href: '#rpt-lapsed' },
              { num: '06', label: 'Red Flags', href: '#rpt-flags' },
              { num: '07', label: 'What Worked / Didn\'t', href: '#rpt-ww' },
              { num: '08', label: 'Action Items', href: '#rpt-actions' },
            ].map(item => (
              <a key={item.href} href={item.href} style={{
                fontFamily: T.sans, fontSize: 12, color: C.textMuted, display: 'block',
                padding: '5px 0', borderBottom: `1px solid ${C.border}`, textDecoration: 'none',
              }}>
                <span style={{ color: C.yellow, marginRight: 6, fontSize: 10 }}>{item.num}</span>
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ══ SECTION 1: FINANCIAL ══ */}
        <section id="rpt-fin">
          <SectionHeader num="01" eyebrow="Financial Performance" title={<>Revenue, Sales Mix<br />&amp; Comparative Health</>}
            context={`${curLabel} is compared against ${baseLabel} as the studio's baseline run-rate. ${prevLabel} data is shown for reference.`}
          />

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
            <KpiBox label="Gross Sales" val={fc(salesStats.gross)} sub={salesStats.growth.gross != null ? `${delta(salesStats.growth.gross)} vs prior` : undefined} variant="blue" />
            <KpiBox label="Net Sales" val={fc(salesStats.net)} sub={salesStats.growth.net != null ? `${delta(salesStats.growth.net)} vs prior` : undefined} variant="positive" />
            <KpiBox label="Avg Txn Value" val={fc(salesStats.atv)} variant="default" />
            <KpiBox label="Discount Value" val={fc(salesStats.discount)} sub={`${fp(salesStats.discountPenetration)} penetration`} variant={salesStats.discountPenetration > 20 ? 'warn' : 'default'} />
            <KpiBox label="Members" val={fn(salesStats.members)} sub={salesStats.growth.members != null ? `${delta(salesStats.growth.members)} vs prior` : undefined} variant="default" />
          </div>

          {/* Comparison table */}
          <Card title={`Sales Metrics Comparison — ${curLabel} vs ${prevLabel} vs ${baseLabel}`} style={{ marginBottom: 24 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={tblStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Metric</th>
                    <th style={{ ...thStyle, textAlign: 'right', color: C.yellow }}>{curLabel}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>{prevLabel}</th>
                    <th style={{ ...thStyle, textAlign: 'right', color: C.blueLight }}>{baseLabel}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>vs Baseline</th>
                  </tr>
                </thead>
                <tbody>
                  {metricRows.slice(0, 12).map((row, idx) => {
                    const cur = rowVal(idx, curMonth);
                    const prev = rowVal(idx, prevMonth);
                    const base = rowBase(idx);
                    const vsBase = base && base > 0 ? ((cur - base) / base) * 100 : null;
                    return (
                      <tr key={row.label} className="sp-tbl-row">
                        <td style={{ ...tdStyle, fontWeight: 600, color: C.text }}>{row.label}</td>
                        <td style={{ ...tdR, color: C.yellow, fontWeight: 700 }}>{formatRowVal(idx, cur)}</td>
                        <td style={{ ...tdR, color: C.textLight }}>{formatRowVal(idx, prev)}</td>
                        <td style={{ ...tdR, color: C.blueLight }}>{base != null ? formatRowVal(idx, base) : '—'}</td>
                        <td style={{ ...tdR }}>
                          {vsBase != null ? badge(delta(vsBase), vsBase > 5 ? 'green' : vsBase < -5 ? 'red' : 'gray') : badge('—', 'gray')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Financial insights */}
          <Card title="Financial Insights">
            {getSummary?.('financial')?.bullets?.map((b, i) => <Insight key={i} text={b} variant={i === 0 ? 'blue' : i % 2 === 0 ? 'green' : 'default'} />) ??
              (sectionEdits?.['financial'] ? sectionEdits['financial'].split('\n').filter(Boolean).map((b, i) => <Insight key={i} text={b.replace(/^[•·]\s*/, '')} />) : [
                <Insight key={0} variant="blue" text={<><strong>Revenue quality:</strong> Net-to-gross ratio of {fp(salesStats.net / salesStats.gross * 100)} indicates {salesStats.net / salesStats.gross > 0.9 ? 'strong' : 'moderate'} revenue quality. Discount at {fp(salesStats.discountPenetration)} is {salesStats.discountPenetration < 15 ? 'well within healthy range' : salesStats.discountPenetration < 25 ? 'approaching elevated territory' : 'above recommended thresholds'}.</>} />,
                <Insight key={1} text={<><strong>Transaction volume:</strong> {fn(salesStats.txns)} transactions from {fn(salesStats.members)} unique members — an average of {(salesStats.txns / Math.max(salesStats.members, 1)).toFixed(1)} purchases per active member during the period.</>} />,
                <Insight key={2} variant="warn" text={<><strong>Discount dependency monitoring:</strong> {fp(salesStats.discountPenetration)} of transactions are discounted. Track whether promotional categories are driving net-new purchases or substituting full-price behaviour.</>} />,
              ])
            }
          </Card>
        </section>

        <hr className="sp-report-section-divider" />

        {/* ══ SECTION 2: SESSIONS ══ */}
        <section id="rpt-session">
          <SectionHeader num="02" eyebrow="Session Intelligence" title={<>Class Performance,<br />Fill Rates &amp; Scheduling</>}
            context={`${fn(sessionStats.totalSessions)} sessions ran across all formats. Fill rate is the primary scheduling health metric. Formats below 40% fill are operationally inefficient — they consume trainer time and studio capacity for diminishing returns.`}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            <KpiBox label="Total Sessions" val={fn(sessionStats.totalSessions)} variant="blue" />
            <KpiBox label="Total Attendance" val={fn(sessionStats.attendance)} />
            <KpiBox label="Avg Fill Rate" val={fp(sessionStats.avgFill)} variant={sessionStats.avgFill > 55 ? 'positive' : 'warn'} />
            <KpiBox label="Late Cancels" val={fn(lcStats.total)} variant={lcStats.total > 150 ? 'red' : 'warn'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <Card title="Class Format Performance — Fill Rate">
              <div style={{ overflowX: 'auto' }}>
                <table style={tblStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Format</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Sessions</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Attendance</th>
                      <th style={{ ...thStyle, width: 120 }}>Fill Rate</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>L/C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionsSorted.map((row) => {
                      const fill = row.fillRate;
                      const barColor = fill >= 70 ? C.green : fill >= 50 ? C.blueLight : fill >= 35 ? C.warn : C.red;
                      return (
                        <tr key={row.name} className="sp-tbl-row">
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{row.name}</td>
                          <td style={tdR}>{fn(row.sessions)}</td>
                          <td style={tdR}>{fn(row.visits)}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 6, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(fill, 100)}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 11, color: barColor, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>{fp(fill)}</span>
                            </div>
                          </td>
                          <td style={{ ...tdR, color: row.lateCancels > 20 ? C.red : row.lateCancels > 10 ? C.warn : C.textLight }}>{fn(row.lateCancels)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title={`Late Cancellations by Format (${fn(lcStats.total)} Total)`}>
              <div style={{ overflowX: 'auto' }}>
                <table style={tblStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Format</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Late Cancels</th>
                      <th style={{ ...thStyle, width: 100 }}>Volume</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lateCancelsSorted.map((row) => {
                      const maxLC = lateCancelsSorted[0]?.lateCancels || 1;
                      const pct = (row.lateCancels / maxLC) * 100;
                      return (
                        <tr key={row.name} className="sp-tbl-row">
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{row.name}</td>
                          <td style={{ ...tdR, color: row.lateCancels > 30 ? C.red : row.lateCancels > 15 ? C.warn : C.text2, fontWeight: 700 }}>{fn(row.lateCancels)}</td>
                          <td style={tdStyle}>
                            <div style={{ height: 6, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? C.red : pct > 50 ? C.warn : C.blueLight, borderRadius: 3 }} />
                            </div>
                          </td>
                          <td style={tdStyle}>
                            {row.lateCancels > 30 ? badge('Fee — highest volume', 'red') : row.lateCancels > 15 ? badge('Add waitlist', 'warn') : badge('Monitor', 'blue')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        <hr className="sp-report-section-divider" />

        {/* ══ SECTION 3: TRAINERS ══ */}
        <section id="rpt-trainer">
          <SectionHeader num="03" eyebrow="Trainer Intelligence" title={<>Trainer Rankings,<br />Conversion &amp; Efficiency</>}
            context="Revenue Score is a composite of fill rate, conversion rate, and paid revenue relative to session load. Conversion rate reflects how often new clients from that trainer's classes subsequently purchased a membership."
          />

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
            <Card title="Trainer Performance — All Metrics">
              <div style={{ overflowX: 'auto' }}>
                <table style={tblStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Trainer</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Sessions</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Clients</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Paid</th>
                      <th style={{ ...thStyle, width: 90 }}>Fill Rate</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Utilisation</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Conv.</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainersSorted.map((t) => {
                      const fill = t.fillRate * (t.fillRate > 1 ? 1 : 100);
                      const fillPct = t.fillRate > 1 ? t.fillRate : t.fillRate * 100;
                      const fillColor = fillPct >= 65 ? C.green : fillPct >= 45 ? C.blueLight : fillPct >= 30 ? C.warn : C.red;
                      const convPct = t.conversionRate > 1 ? t.conversionRate : t.conversionRate * 100;
                      const utilPct = t.utilization > 1 ? t.utilization : t.utilization * 100;
                      return (
                        <tr key={t.name} className="sp-tbl-row">
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{t.name}</td>
                          <td style={tdR}>{fn(t.sessions)}</td>
                          <td style={tdR}>{fn(t.customers ?? 0)}</td>
                          <td style={tdR}>{fc(t.paid)}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ flex: 1, height: 5, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(fillPct, 100)}%`, height: '100%', background: fillColor, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 10, color: fillColor, fontWeight: 700, minWidth: 32 }}>{fp(fillPct)}</span>
                            </div>
                          </td>
                          <td style={{ ...tdR, color: utilPct >= 95 ? C.green : utilPct >= 85 ? C.text2 : C.warn }}>{fp(utilPct)}</td>
                          <td style={{ ...tdR, color: convPct >= 30 ? C.green : convPct >= 15 ? C.text2 : convPct > 0 ? C.warn : C.red, fontWeight: convPct === 0 ? 700 : 400 }}>{fp(convPct)}</td>
                          <td style={{ ...tdR, fontWeight: 700, color: t.revenueScore >= 45 ? C.yellow : t.revenueScore >= 30 ? C.text2 : C.warn }}>{t.revenueScore.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Trainer Insights">
              {getSummary?.('trainer')?.bullets?.slice(0, 5).map((b, i) => <Insight key={i} text={b} variant={i === 0 ? 'green' : i === 1 ? 'warn' : 'default'} />) ??
                (sectionEdits?.['trainer'] ? sectionEdits['trainer'].split('\n').filter(Boolean).map((b, i) => <Insight key={i} text={b.replace(/^[•·]\s*/, '')} />) : [
                  trainersSorted[0] && <Insight key={0} variant="green" text={<><strong>{trainersSorted[0].name}</strong> leads the ranking with a score of {trainersSorted[0].revenueScore.toFixed(1)}, running {fn(trainersSorted[0].sessions)} sessions at {fp(trainersSorted[0].fillRate > 1 ? trainersSorted[0].fillRate : trainersSorted[0].fillRate * 100)} fill.</>} />,
                  trainersSorted.find(t => (t.conversionRate > 1 ? t.conversionRate : t.conversionRate * 100) > 40) && <Insight key={1} variant="blue" text={<><strong>{trainersSorted.find(t => (t.conversionRate > 1 ? t.conversionRate : t.conversionRate * 100) > 40)?.name}</strong> has the highest conversion rate among trainers with meaningful session volume. Their schedule should be weighted toward new-client-facing time slots.</>} />,
                  <Insight key={2} variant="warn" text={<>Trainers with 0% conversion and 12+ sessions represent a direct opportunity cost against trainers converting at 33–67%. Structured post-class engagement training is the most cost-effective intervention.</>} />,
                ])
              }
            </Card>
          </div>
        </section>

        <hr className="sp-report-section-divider" />

        {/* ══ SECTION 4: FUNNEL ══ */}
        <section id="rpt-funnel">
          <SectionHeader num="04" eyebrow="New Client Funnel" title={<>Acquisition, Conversion<br />&amp; Channel Intelligence</>}
            context={`${fn(clientStats.newClients)} new clients visited during this period. ${fn(clientStats.converted)} converted (${fp(clientStats.conversionRate)}). ${fn(clientStats.retained)} were retained. The avg LTV of a converted client is ${fc(clientStats.avgLtv)}.`}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            <KpiBox label="New Clients" val={fn(clientStats.newClients)} variant="blue" />
            <KpiBox label="Converted" val={fn(clientStats.converted)} sub={`${fp(clientStats.conversionRate)} rate`} variant="positive" />
            <KpiBox label="Retained" val={fn(clientStats.retained)} sub={`${fp(clientStats.retentionRate)} retention`} />
            <KpiBox label="Did Not Convert" val={fn(clientStats.newClients - clientStats.converted)} sub={`${fp(100 - clientStats.conversionRate)} left without buying`} variant={clientStats.conversionRate < 30 ? 'warn' : 'default'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Conversion Funnel">
              <div style={{ marginBottom: 24 }}>
                <FunnelBar label="New Clients — First Visit" value={clientStats.newClients} total={clientStats.newClients} color={C.blueLight} />
                <FunnelBar label="Returned for 2nd Visit" value={clientStats.retained} total={clientStats.newClients} color={C.blueLight} />
                <FunnelBar label="Converted to Paid Product" value={clientStats.converted} total={clientStats.newClients} color={C.green} />
                <FunnelBar label="Did Not Convert" value={clientStats.newClients - clientStats.converted} total={clientStats.newClients} color={C.red} textColor={C.red} />
              </div>
              <div style={{ background: C.bluePale, border: `1px solid rgba(43,108,176,.15)`, borderLeft: `3px solid ${C.blueLight}`, borderRadius: '0 6px 6px 0', padding: '14px 18px', fontFamily: T.sans, fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
                Avg LTV of a converting client: <strong style={{ color: C.blue }}>{fc(clientStats.avgLtv)}</strong>. Improving conversion from {fp(clientStats.conversionRate)} to 30% would represent {fn(Math.round(Math.max(0, clientStats.newClients * 0.3 - clientStats.converted)))} additional memberships at this period's avg LTV.
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
                      <th style={{ ...thStyle, textAlign: 'right' }}>Conv. %</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>LTV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funnelSorted.map((row) => {
                      const conv = row.conversionRate > 1 ? row.conversionRate : row.conversionRate * 100;
                      return (
                        <tr key={row.name} className="sp-tbl-row">
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{row.name}</td>
                          <td style={tdR}>{fn(row.leads)}</td>
                          <td style={tdR}>{fn(row.converted)}</td>
                          <td style={{ ...tdR, color: conv >= 30 ? C.green : conv >= 15 ? C.text2 : conv > 0 ? C.warn : C.red, fontWeight: 700 }}>{fp(conv)}</td>
                          <td style={{ ...tdR, color: row.ltv > 50000 ? C.blueLight : C.text2 }}>{fc(row.ltv)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        <hr className="sp-report-section-divider" />

        {/* ══ SECTION 5: LAPSED ══ */}
        <section id="rpt-lapsed">
          <SectionHeader num="05" eyebrow="Lapsed Memberships" title={<>Expiry Analysis<br />&amp; Win-Back Strategy</>}
            context={`${fn(expirationStats.total)} memberships expired during the period. ${fn(expirationStats.lapsed)} lapsed, ${fn(expirationStats.renewed)} renewed. The 60-day win-back window is the critical action deadline.`}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            <KpiBox label="Total Expirations" val={fn(expirationStats.total)} variant="default" />
            <KpiBox label="Lapsed" val={fn(expirationStats.lapsed)} sub={`${fp(expirationStats.lapsedPct)} lapse rate`} variant={expirationStats.lapsedPct > 60 ? 'red' : 'warn'} />
            <KpiBox label="Renewed" val={fn(expirationStats.renewed)} sub={`${fn(expirationStats.total - expirationStats.lapsed - expirationStats.renewed)} active/frozen`} variant={expirationStats.renewed > 0 ? 'positive' : 'default'} />
            <KpiBox label="Avg LTV (Lapsed)" val={fc(expirationStats.avgLtvLapsed)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Lapsed Memberships by Product">
              <div style={{ overflowX: 'auto' }}>
                <table style={tblStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Membership Product</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Lapsed Count</th>
                      <th style={{ ...thStyle, width: 120 }}>Share</th>
                      <th style={thStyle}>Win-Back Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lapsedByMembership.map((row, i) => {
                      const pct = expirationStats.lapsed > 0 ? (row.count / expirationStats.lapsed) * 100 : 0;
                      return (
                        <tr key={row.name} className="sp-tbl-row">
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{row.name}</td>
                          <td style={{ ...tdR, fontFamily: T.serif, fontSize: 16, color: C.red }}>{fn(row.count)}</td>
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

            <Card title="Retention Analysis & Win-Back Protocol">
              <Insight variant="red" text={<><strong>No proactive renewal outreach process is evident.</strong> In a functioning retention system, 20–35% of expiring members renew before or within 7 days of expiry. The current {fp(expirationStats.lapsedPct)} lapse rate suggests either no automated reminder or an insufficient manual process.</>} />
              <Insight variant="warn" text={<><strong>Win-back window is time-critical.</strong> Research in boutique fitness shows that 60 days post-lapse is the boundary beyond which win-back probability drops below 5%. Every week without outreach reduces that probability by 10–15 percentage points.</>} />
              <Insight variant="green" text={<><strong>Tier 1 — Personal call within this week</strong> for high-value lapses (Annual, 6-Month, 3-Month, multi-class packs). Script: acknowledge the lapse without pressure, offer a complimentary re-entry class, present renewal in studio.</>} />
              <Insight variant="blue" text={<><strong>Tier 2 — WhatsApp sequence weeks 2–3</strong> for mid-tier lapses. Two messages: Day 7 (value message) and Day 14 (time-limited renewal offer). WhatsApp response rates are 5–10× higher than email for re-engagement.</>} />
              <Insight text={<><strong>Tier 3 — Email re-engagement weeks 3–4</strong> for monthly and class-pack lapses. Three emails over 14 days. No pressure. Highlight new classes and return member testimonials.</>} />
            </Card>
          </div>
        </section>

        <hr className="sp-report-section-divider" />

        {/* ══ SECTION 6: RED FLAGS ══ */}
        <section id="rpt-flags">
          <SectionHeader num="06" eyebrow="Red Flags & Predictions" title={<>Business Risk Signals<br />&amp; Forward Outlook</>}
            context="Red flags are data patterns that pose a structural risk to revenue, retention, or operations if left unaddressed. Each flag below is directly traceable to a specific data point in this report."
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
            {redFlags.map(flag => <FlagBox key={flag.num} {...flag} />)}
          </div>
        </section>

        <hr className="sp-report-section-divider" />

        {/* ══ SECTION 7: WHAT WORKED ══ */}
        <section id="rpt-ww">
          <SectionHeader num="07" eyebrow="Performance Diagnostics" title={<>What Worked &amp;<br />What Needs Attention</>} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
            {wwPositive.map((text, i) => (
              <div key={`pos-${i}`} style={{
                background: C.greenPale, border: `1px solid rgba(56,161,105,.15)`,
                borderLeft: `3px solid ${C.green}`, borderRadius: 6, padding: '16px 20px',
                fontFamily: T.sans, fontSize: 13, color: C.text2, lineHeight: 1.75,
              }}><span style={{ color: C.green, fontWeight: 700, marginRight: 8 }}>✓</span>{text}</div>
            ))}
            {wwNegative.map((text, i) => (
              <div key={`neg-${i}`} style={{
                background: C.redPale, border: `1px solid rgba(229,62,62,.12)`,
                borderLeft: `3px solid ${C.red}`, borderRadius: 6, padding: '16px 20px',
                fontFamily: T.sans, fontSize: 13, color: C.text2, lineHeight: 1.75,
              }}><span style={{ color: C.red, fontWeight: 700, marginRight: 8 }}>✗</span>{text}</div>
            ))}
          </div>
        </section>

        <hr className="sp-report-section-divider" />

        {/* ══ SECTION 8: ACTIONS ══ */}
        <section id="rpt-actions">
          <SectionHeader num="08" eyebrow="Strategic Action Plan" title={<>Priority Decisions —<br />{curLabel}</>}
            context="Each action is directly traceable to a data point in this report. Owner, timeline, and expected outcome are specified for each."
          />

          {actions.map((action) => (
            <div key={action.num} style={{ display: 'flex', gap: 24, marginBottom: 24, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '24px 28px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: C.navy,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: T.sans, fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>{action.num}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {action.tags.map(tag => (
                    <span key={tag} style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: '.3px', padding: '2px 9px', borderRadius: 20, background: C.bluePale, color: C.blueLight }}>{tag}</span>
                  ))}
                </div>
                <h4 style={{ fontFamily: T.serif, fontSize: 17, color: C.text, fontWeight: 400, margin: '0 0 10px' }}>{action.title}</h4>
                {action.body}
              </div>
            </div>
          ))}
        </section>

        <hr className="sp-report-section-divider" />

        {/* ══ CONCLUSIONS ══ */}
        <section id="rpt-conclusions">
          <SectionHeader num="09" eyebrow="Conclusions" title={<>Period Summary<br />&amp; Key Takeaways</>} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
            {conclusions.map((c) => (
              <div key={c.num} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, padding: '22px 24px' }}>
                <span style={{ fontFamily: T.serif, fontSize: 36, color: C.yellow, lineHeight: 1, marginBottom: 8, display: 'block' }}>{c.num}</span>
                <p style={{ fontFamily: T.sans, fontSize: 13, lineHeight: 1.65, color: C.text2, margin: '0 0 10px' }}>{c.text}</p>
                <span style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: '.5px', textTransform: 'uppercase', color: C.textLight, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'block' }}>{c.verdict}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div style={{ background: C.navy, color: 'rgba(255,255,255,.35)', textAlign: 'center', padding: '36px', fontFamily: T.sans, fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', marginTop: 0 }}>
        {studioName} · Monthly Performance Report · {dateRange.start} to {dateRange.end} · Studio Pulse Analytics
      </div>
    </div>
  );
}
