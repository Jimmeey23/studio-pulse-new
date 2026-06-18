import React, { useState, useMemo, useEffect, useRef } from 'react';
import { geminiService, LocationReportNarrative } from '@/services/geminiService';
import { useSalesData } from '@/hooks/useSalesData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { parseDate } from '@/utils/dateUtils';
import { isLeadConverted } from '@/utils/leadConversions';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, ChevronDown, AlertTriangle, CheckCircle,
  Zap, RefreshCw, ArrowRight, ArrowUpRight, ArrowDownRight,
  Users, DollarSign, Activity, Target, Clock, Star, Flame,
  BarChart2, Shield, Award, Percent
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const STUDIOS = [
  { id: 'kwality', label: 'Kwality House', location: 'Kwality House', area: 'Kemps Corner', city: 'Mumbai' },
  { id: 'supreme', label: 'Supreme HQ', location: 'Supreme HQ', area: 'Bandra', city: 'Mumbai' },
  { id: 'kenkere', label: 'Kenkere House', location: 'Kenkere House', area: 'Bengaluru', city: 'Bengaluru' },
];

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const YEARS = ['2026', '2025', '2024'];

const P = {
  gold: '#D4AF37', goldLight: '#F0D060', goldDark: '#A08828',
  navy: '#080E1C', navyLight: '#0D1526', navyMid: '#162040', navyCard: '#111A30',
  cream: '#F5F0E8', creamMuted: '#9BA8BF',
  green: '#10B981', greenLight: '#34D399', greenDark: '#065F46',
  red: '#EF4444', redLight: '#F87171',
  blue: '#3B82F6', blueLight: '#93C5FD',
  purple: '#8B5CF6', purpleLight: '#C4B5FD',
  orange: '#F59E0B', orangeLight: '#FCD34D',
  teal: '#14B8A6', tealLight: '#5EEAD4',
  rose: '#F43F5E', roseLight: '#FDA4AF',
  indigo: '#6366F1',
};

const CHART_COLORS = [P.gold, P.blue, P.green, P.purple, P.orange, P.teal, P.rose, P.indigo];

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};
const pct = (n: number, d = 1) => `${n.toFixed(d)}%`;
const num = (n: number) => Math.round(n).toLocaleString('en-IN');
const delta = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;

const getMonthRange = (year: string, month: string) => ({
  start: new Date(parseInt(year), parseInt(month) - 1, 1),
  end: new Date(parseInt(year), parseInt(month), 0, 23, 59, 59),
});

const inRange = (dateStr: string | undefined, start: Date, end: Date): boolean => {
  if (!dateStr) return false;
  const d = parseDate(dateStr);
  return !!d && d >= start && d <= end;
};

const matchesLocation = (loc: string, studioLocation: string): boolean => {
  const l = (loc || '').toLowerCase();
  const s = studioLocation.toLowerCase();
  return l.includes(s) || s.split(' ').some(w => w.length > 3 && l.includes(w));
};

const classifyFormat = (name: string) => {
  const v = (name || '').toLowerCase();
  if (v.includes('cycle') || v.includes('spin') || v.includes('ride')) return 'PowerCycle';
  if (v.includes('strength') || v.includes('sculpt') || v.includes('hiit') || v.includes('fit')) return 'Strength';
  return 'Barre';
};

// ── Health Score ───────────────────────────────────────────────────────────────

const computeHealthScore = (m: any): { score: number; grade: 'A' | 'B' | 'C' | 'D'; color: string; label: string } => {
  let points = 0;
  // Fill rate (0-25 pts)
  if (m.fillRate >= 75) points += 25;
  else if (m.fillRate >= 60) points += 18;
  else if (m.fillRate >= 45) points += 10;
  else points += 3;
  // Conversion (0-20 pts)
  if (m.conversionRate >= 60) points += 20;
  else if (m.conversionRate >= 40) points += 14;
  else if (m.conversionRate >= 25) points += 8;
  else points += 2;
  // Retention (0-20 pts)
  if (m.retentionRate >= 50) points += 20;
  else if (m.retentionRate >= 35) points += 13;
  else if (m.retentionRate >= 20) points += 7;
  else points += 1;
  // Revenue growth MoM (0-15 pts)
  const revGrowth = delta(m.currRevenue, m.prevRevenue);
  if (revGrowth >= 10) points += 15;
  else if (revGrowth >= 0) points += 10;
  else if (revGrowth >= -5) points += 5;
  // Late cancel ratio (0-10 pts) — lower is better
  const lcRatio = m.totalSessions > 0 ? (m.lcCount / m.totalSessions) * 100 : 0;
  if (lcRatio < 5) points += 10;
  else if (lcRatio < 10) points += 6;
  else if (lcRatio < 20) points += 3;
  // Discount penetration (0-10 pts) — lower is better
  if (m.discountPenetration < 15) points += 10;
  else if (m.discountPenetration < 30) points += 6;
  else if (m.discountPenetration < 50) points += 3;

  const score = Math.min(100, Math.round(points));
  if (score >= 80) return { score, grade: 'A', color: P.green, label: 'Excellent' };
  if (score >= 65) return { score, grade: 'B', color: P.gold, label: 'Good' };
  if (score >= 50) return { score, grade: 'C', color: P.orange, label: 'Needs Attention' };
  return { score, grade: 'D', color: P.red, label: 'At Risk' };
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const Chip: React.FC<{ value: number; inverse?: boolean; suffix?: string }> = ({ value, inverse = false, suffix = '%' }) => {
  const isGood = inverse ? value <= 0 : value >= 0;
  const abs = Math.abs(value);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: isGood ? `${P.green}20` : `${P.red}20`, color: isGood ? P.greenLight : P.redLight }}>
      {isGood ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {abs.toFixed(1)}{suffix}
    </span>
  );
};

const KPI: React.FC<{
  label: string; value: string; sub?: string; mom?: number; yoy?: number;
  icon: React.ReactNode; accent?: string; inverse?: boolean;
}> = ({ label, value, sub, mom, yoy, icon, accent = P.gold, inverse = false }) => (
  <div className="rounded-2xl p-5 relative overflow-hidden"
    style={{ background: P.navyCard, border: `1px solid ${accent}25` }}>
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10"
      style={{ background: accent, filter: 'blur(16px)' }} />
    <div className="flex items-start justify-between mb-3">
      <div className="p-2.5 rounded-xl" style={{ background: `${accent}18` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="flex flex-col items-end gap-1">
        {mom !== undefined && <Chip value={mom} inverse={inverse} />}
        {yoy !== undefined && (
          <span className="text-[10px]" style={{ color: P.creamMuted }}>
            YoY {yoy >= 0 ? '+' : ''}{yoy.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
    <div className="text-2xl font-black tracking-tight mb-0.5" style={{ color: P.cream }}>{value}</div>
    {sub && <div className="text-xs mb-1" style={{ color: P.creamMuted }}>{sub}</div>}
    <div className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: `${P.creamMuted}` }}>{label}</div>
  </div>
);

const InsightCard: React.FC<{ type: 'win' | 'risk' | 'watch'; text: string }> = ({ type, text }) => {
  const cfg = {
    win:   { icon: <CheckCircle size={14} />, color: P.green,  bg: `${P.green}12`,  border: `${P.green}25`  },
    risk:  { icon: <AlertTriangle size={14} />, color: P.red,   bg: `${P.red}12`,   border: `${P.red}25`    },
    watch: { icon: <Zap size={14} />,           color: P.gold,  bg: `${P.gold}12`,  border: `${P.gold}25`  },
  }[type];
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <span className="mt-0.5 shrink-0" style={{ color: cfg.color }}>{cfg.icon}</span>
      <p className="text-sm leading-relaxed" style={{ color: `${P.cream}90` }}>{text}</p>
    </div>
  );
};

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; sub: string; accent?: string }> = ({ icon, title, sub, accent = P.gold }) => (
  <div className="flex items-center gap-4 mb-6">
    <div className="p-3 rounded-2xl shrink-0" style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
      <span style={{ color: accent }}>{icon}</span>
    </div>
    <div>
      <h2 className="text-xl font-black tracking-tight" style={{ color: P.cream }}>{title}</h2>
      <p className="text-xs mt-0.5" style={{ color: P.creamMuted }}>{sub}</p>
    </div>
  </div>
);

const TT = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-xl text-xs" style={{ background: P.navyMid, border: `1px solid ${P.gold}30` }}>
      <div className="font-semibold mb-2" style={{ color: P.gold }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill || p.stroke || p.color }} />
          <span style={{ color: P.cream }}>{p.name}: {prefix}{typeof p.value === 'number' ? (prefix === '₹' ? fmt(p.value) : p.value.toLocaleString('en-IN')) : p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
};

// ── Dropdown component (must be defined outside SelectionScreen to avoid remount) ──

const DD: React.FC<{
  which: 'studio' | 'month' | 'year';
  label: string;
  display: string;
  open: 'studio' | 'month' | 'year' | null;
  setOpen: React.Dispatch<React.SetStateAction<'studio' | 'month' | 'year' | null>>;
  children: React.ReactNode;
}> = ({ which, label, display, open, setOpen, children }) => (
  <div className="relative">
    <label className="block text-xs font-bold tracking-widest uppercase mb-2" style={{ color: P.gold }}>{label}</label>
    <button onClick={() => setOpen(open === which ? null : which)}
      className="w-full flex items-center justify-between px-4 py-4 rounded-2xl text-left transition-all text-sm"
      style={{ background: display ? `${P.gold}10` : P.navyMid, border: `1.5px solid ${display ? P.gold : P.gold + '28'}`, color: display ? P.cream : `${P.cream}45` }}>
      <span className={display ? 'font-medium' : ''}>{display || `Select ${label.toLowerCase()}...`}</span>
      <ChevronDown size={14} style={{ transform: open === which ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: P.gold }} />
    </button>
    {open === which && (
      <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-64 overflow-y-auto"
        style={{ background: P.navyMid, border: `1px solid ${P.gold}25` }}>
        {children}
      </div>
    )}
  </div>
);

// ── Selection Screen ───────────────────────────────────────────────────────────

const SelectionScreen: React.FC<{ onSelect: (s: typeof STUDIOS[0], m: string, y: string) => void }> = ({ onSelect }) => {
  const [studio, setStudio] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('2026');
  const [open, setOpen] = useState<'studio' | 'month' | 'year' | null>(null);

  const sel = STUDIOS.find(s => s.id === studio);
  const selM = MONTHS.find(m => m.value === month);
  const can = studio && month;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: P.navy }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-8"
          style={{ background: `radial-gradient(ellipse, ${P.gold}, transparent)` }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
      </div>
      <div className="relative z-10 w-full max-w-xl px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-5"
            style={{ background: `${P.gold}18`, border: `1px solid ${P.gold}40`, color: P.gold }}>
            <Star size={11} /> Executive Intelligence
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-2" style={{ color: P.cream, letterSpacing: '-0.03em' }}>
            PHYSIQUE <span style={{ color: P.gold }}>57</span>
          </h1>
          <p className="text-sm font-light tracking-widest uppercase" style={{ color: `${P.cream}50`, letterSpacing: '0.22em' }}>
            Studio Performance Report
          </p>
        </div>

        <div className="rounded-3xl p-7 shadow-2xl space-y-4" style={{ background: P.navyCard, border: `1px solid ${P.gold}20` }}>
          <DD which="studio" label="Studio Location" display={sel ? `${sel.label} — ${sel.city}` : ''} open={open} setOpen={setOpen}>
            {STUDIOS.map(s => (
              <button key={s.id} onClick={() => { setStudio(s.id); setOpen(null); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5"
                style={{ borderBottom: `1px solid ${P.gold}10`, color: studio === s.id ? P.gold : P.cream }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: studio === s.id ? P.gold : `${P.gold}40` }} />
                <div>
                  <div className="font-semibold text-sm">{s.label}</div>
                  <div className="text-xs opacity-50">{s.area} · {s.city}</div>
                </div>
              </button>
            ))}
          </DD>

          <div className="grid grid-cols-2 gap-4">
            <DD which="month" label="Month" display={selM?.label || ''} open={open} setOpen={setOpen}>
              {MONTHS.map(m => (
                <button key={m.value} onClick={() => { setMonth(m.value); setOpen(null); }}
                  className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5"
                  style={{ borderBottom: `1px solid ${P.gold}10`, color: month === m.value ? P.gold : P.cream }}>
                  {m.label}
                </button>
              ))}
            </DD>
            <DD which="year" label="Year" display={year} open={open} setOpen={setOpen}>
              {YEARS.map(y => (
                <button key={y} onClick={() => { setYear(y); setOpen(null); }}
                  className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5"
                  style={{ borderBottom: `1px solid ${P.gold}10`, color: year === y ? P.gold : P.cream }}>
                  {y}
                </button>
              ))}
            </DD>
          </div>

          <button onClick={() => sel && onSelect(sel, month, year)} disabled={!can}
            className="w-full py-4 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 mt-2"
            style={{
              background: can ? `linear-gradient(135deg, ${P.gold}, ${P.goldLight})` : `${P.gold}18`,
              color: can ? P.navy : `${P.gold}40`, cursor: can ? 'pointer' : 'not-allowed',
              boxShadow: can ? `0 8px 32px ${P.gold}35` : 'none',
            }}>
            <BarChart2 size={16} /> Generate Executive Report <ArrowRight size={16} />
          </button>
        </div>
        <p className="text-center mt-5 text-xs" style={{ color: `${P.cream}20` }}>Powered by live Google Sheets data</p>
      </div>
    </div>
  );
};

// ── Loading ────────────────────────────────────────────────────────────────────

const LoadingScreen: React.FC<{ studio: string; period: string }> = ({ studio, period }) => (
  <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: P.navy }}>
    <div className="text-center space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
        style={{ background: `${P.gold}18`, border: `2px solid ${P.gold}40` }}>
        <RefreshCw size={24} style={{ color: P.gold }} className="animate-spin" />
      </div>
      <div>
        <p className="font-bold text-lg" style={{ color: P.cream }}>Analysing {studio}</p>
        <p className="text-sm mt-1" style={{ color: P.creamMuted }}>{period} · Building insights…</p>
      </div>
      <div className="flex gap-1.5 justify-center">
        {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: P.gold, animationDelay: `${i * 0.15}s` }} />)}
      </div>
    </div>
  </div>
);

// ── Main Report ────────────────────────────────────────────────────────────────

const Report: React.FC<{ studio: typeof STUDIOS[0]; month: string; year: string; onReset: () => void }> = ({ studio, month, year, onReset }) => {
  const { data: salesData = [], loading: salesLoading } = useSalesData();
  const { data: sessionsData = [], loading: sessionsLoading } = useSessionsData();
  const { data: payrollData = [], isLoading: payrollLoading } = usePayrollData();
  const { data: newClientData = [], loading: clientsLoading } = useNewClientData();
  const { data: expirationsData = [], loading: expLoading } = useExpirationsData();
  const { data: lateCancelData = [], loading: lcLoading } = useLateCancellationsData();
  const { data: leadsData = [], loading: leadsLoading } = useLeadsData();

  // Only block rendering on primary sales data — other sources load asynchronously
  const anyLoading = salesLoading;

  const monthName = MONTHS.find(m => m.value === month)?.label || '';
  const prevMonthNum = parseInt(month) === 1 ? 12 : parseInt(month) - 1;
  const prevMonthYear = parseInt(month) === 1 ? String(parseInt(year) - 1) : year;
  const prevMonthName = MONTHS.find(m => m.value === String(prevMonthNum).padStart(2, '0'))?.label || '';

  const currRange = useMemo(() => getMonthRange(year, month), [year, month]);
  const prevRange = useMemo(() => getMonthRange(prevMonthYear, String(prevMonthNum).padStart(2, '0')), [prevMonthYear, prevMonthNum]);
  const yoyRange = useMemo(() => getMonthRange(String(parseInt(year) - 1), month), [year, month]);

  const metrics = useMemo(() => {
    if (salesLoading || salesData.length === 0) return null;

    const loc = studio.location;
    const filterByLoc = <T extends Record<string, any>>(arr: T[], keys: string[]) =>
      arr.filter(r => keys.some(k => matchesLocation(r[k] || '', loc)));

    // Sales
    const sales = (r: { start: Date; end: Date }) =>
      salesData.filter(s => inRange(s.paymentDate, r.start, r.end) && matchesLocation(s.calculatedLocation || '', loc));
    const currS = sales(currRange), prevS = sales(prevRange), yoyS = sales(yoyRange);

    const netRev = (rows: typeof currS) => rows.reduce((a, s) => a + ((Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0)), 0);
    const currRev = netRev(currS), prevRev = netRev(prevS), yoyRev = netRev(yoyS);

    const discountedTxns = currS.filter(s => (Number(s.discountAmount) || 0) > 0).length;
    const discountPenetration = currS.length > 0 ? (discountedTxns / currS.length) * 100 : 0;
    const totalDiscount = currS.reduce((a, s) => a + (Number(s.discountAmount) || 0), 0);
    const atv = currS.length > 0 ? currRev / currS.length : 0;
    const prevAtv = prevS.length > 0 ? netRev(prevS) / prevS.length : 0;

    // Unique members
    const uniqueMembers = new Set(currS.map(s => s.memberId).filter(Boolean)).size;

    // Category breakdown
    const cats: Record<string, number> = {};
    currS.forEach(s => { const c = s.cleanedCategory || 'Other'; cats[c] = (cats[c] || 0) + ((Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0)); });
    const topCats = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

    // Package vs drop-in vs membership split
    const pkgRev = currS.filter(s => /pack|package/i.test(s.cleanedCategory || s.cleanedProduct || '')).reduce((a, s) => a + ((Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0)), 0);
    const memRev = currS.filter(s => /member/i.test(s.cleanedCategory || s.membershipType || '')).reduce((a, s) => a + ((Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0)), 0);
    const dropRev = currS.filter(s => /drop|single|trial/i.test(`${s.paymentItem || ''} ${s.cleanedProduct || ''}`)).reduce((a, s) => a + ((Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0)), 0);

    // 6-month revenue trend
    const revTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(parseInt(year), parseInt(month) - 1 - (5 - i), 1);
      const r = getMonthRange(String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'));
      const rows = sales(r);
      return { label: d.toLocaleDateString('en-US', { month: 'short' }), revenue: netRev(rows), txns: rows.length };
    });

    // Sessions
    const sess = (r: { start: Date; end: Date }) =>
      sessionsData.filter(s => inRange(s.date, r.start, r.end) && matchesLocation(s.location || '', loc));
    const currSess = sess(currRange), prevSess = sess(prevRange);

    const totalCheckins = currSess.reduce((a, s) => a + (Number(s.checkedInCount) || 0), 0);
    const totalCap = currSess.reduce((a, s) => a + (Number(s.capacity) || 0), 0);
    const fillRate = totalCap > 0 ? (totalCheckins / totalCap) * 100 : 0;
    const prevCheckins = prevSess.reduce((a, s) => a + (Number(s.checkedInCount) || 0), 0);
    const prevCap = prevSess.reduce((a, s) => a + (Number(s.capacity) || 0), 0);
    const prevFillRate = prevCap > 0 ? (prevCheckins / prevCap) * 100 : 0;
    const emptySessions = currSess.filter(s => (Number(s.checkedInCount) || 0) === 0).length;
    const emptyPct = currSess.length > 0 ? (emptySessions / currSess.length) * 100 : 0;
    const classAvg = currSess.length > 0 ? totalCheckins / currSess.length : 0;
    const nonEmptyAvg = (currSess.length - emptySessions) > 0 ? totalCheckins / (currSess.length - emptySessions) : 0;
    const prevClassAvg = prevSess.length > 0 ? prevCheckins / prevSess.length : 0;

    // Format breakdown
    const fmtMap: Record<string, { sessions: number; checkins: number; cap: number }> = { Barre: { sessions: 0, checkins: 0, cap: 0 }, PowerCycle: { sessions: 0, checkins: 0, cap: 0 }, Strength: { sessions: 0, checkins: 0, cap: 0 } };
    currSess.forEach(s => {
      const f = classifyFormat(s.cleanedClass || s.classType || '');
      if (fmtMap[f]) {
        fmtMap[f].sessions++;
        fmtMap[f].checkins += Number(s.checkedInCount) || 0;
        fmtMap[f].cap += Number(s.capacity) || 0;
      }
    });
    const formats = Object.entries(fmtMap).map(([name, v]) => ({
      name, sessions: v.sessions, checkins: v.checkins,
      fillRate: v.cap > 0 ? (v.checkins / v.cap) * 100 : 0,
      classAvg: v.sessions > 0 ? v.checkins / v.sessions : 0,
    })).filter(f => f.sessions > 0);

    // Session trend
    const sessTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(parseInt(year), parseInt(month) - 1 - (5 - i), 1);
      const r = getMonthRange(String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'));
      const rows = sess(r);
      const ci = rows.reduce((a, s) => a + (Number(s.checkedInCount) || 0), 0);
      const cap = rows.reduce((a, s) => a + (Number(s.capacity) || 0), 0);
      return { label: d.toLocaleDateString('en-US', { month: 'short' }), checkins: ci, fillRate: cap > 0 ? parseFloat(((ci / cap) * 100).toFixed(1)) : 0 };
    });

    // Peak day analysis
    const dayMap: Record<string, number> = {};
    currSess.forEach(s => {
      const day = new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' });
      dayMap[day] = (dayMap[day] || 0) + (Number(s.checkedInCount) || 0);
    });
    const peakDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const dayData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ day: d, checkins: dayMap[d] || 0 }));

    // Trainers (payroll)
    const trainerKey = `${monthName} ${year}`;
    const prevTrainerKey = `${prevMonthName} ${prevMonthYear}`;
    const currPay = payrollData.filter(p => matchesLocation(p.location || '', loc) && (p.monthYear || '').toLowerCase().includes(trainerKey.toLowerCase()));
    const prevPay = payrollData.filter(p => matchesLocation(p.location || '', loc) && (p.monthYear || '').toLowerCase().includes(prevTrainerKey.toLowerCase()));

    const trainers = currPay.map(p => ({
      name: p.teacherName || 'Unknown',
      sessions: Number(p.totalSessions) || 0,
      customers: Number(p.totalCustomers) || 0,
      nonEmpty: Number(p.totalNonEmptySessions) || 0,
      paid: Number(p.totalPaid) || 0,
      classAvg: (Number(p.totalNonEmptySessions) || 0) > 0 ? (Number(p.totalCustomers) || 0) / (Number(p.totalNonEmptySessions) || 0) : 0,
      converted: Number(p.converted) || 0,
      retained: Number(p.retained) || 0,
    })).sort((a, b) => b.customers - a.customers);
    const topTrainer = trainers[0];
    const bottomTrainer = trainers.length > 1 ? trainers[trainers.length - 1] : null;
    const totalCustomers = currPay.reduce((a, p) => a + (Number(p.totalCustomers) || 0), 0);
    const prevCustomers = prevPay.reduce((a, p) => a + (Number(p.totalCustomers) || 0), 0);

    // Leads
    const currLeads = leadsData.filter(l => inRange(l.createdAt, currRange.start, currRange.end) && matchesLocation(l.center || '', loc));
    const prevLeads = leadsData.filter(l => inRange(l.createdAt, prevRange.start, prevRange.end) && matchesLocation(l.center || '', loc));
    const convertedLeads = currLeads.filter(l => isLeadConverted(l)).length;
    const trialLeads = currLeads.filter(l => { const t = (l.trialStatus || '').toLowerCase(); return t.includes('completed') || t.includes('trial') || t.includes('attended'); }).length;
    const leadCvr = currLeads.length > 0 ? (convertedLeads / currLeads.length) * 100 : 0;
    const leadToTrial = currLeads.length > 0 ? (trialLeads / currLeads.length) * 100 : 0;
    const trialToCvr = trialLeads > 0 ? (convertedLeads / trialLeads) * 100 : 0;

    const srcMap: Record<string, { count: number; converted: number }> = {};
    currLeads.forEach(l => {
      const src = l.source || 'Unknown';
      srcMap[src] = srcMap[src] || { count: 0, converted: 0 };
      srcMap[src].count++;
      if (isLeadConverted(l)) srcMap[src].converted++;
    });
    const topSources = Object.entries(srcMap).map(([name, v]) => ({ name, count: v.count, cvr: v.count > 0 ? (v.converted / v.count) * 100 : 0 })).sort((a, b) => b.count - a.count).slice(0, 5);

    // New clients
    const currCli = newClientData.filter(c => inRange(c.firstVisitDate, currRange.start, currRange.end) && matchesLocation(c.firstVisitLocation || c.homeLocation || '', loc));
    const prevCli = newClientData.filter(c => inRange(c.firstVisitDate, prevRange.start, prevRange.end) && matchesLocation(c.firstVisitLocation || c.homeLocation || '', loc));
    const converted2 = currCli.filter(c => (c.conversionStatus || '').toLowerCase().includes('converted')).length;
    const retained2 = currCli.filter(c => (c.retentionStatus || '').toLowerCase().includes('retained')).length;
    const convRate = currCli.length > 0 ? (converted2 / currCli.length) * 100 : 0;
    const retRate = currCli.length > 0 ? (retained2 / currCli.length) * 100 : 0;
    const avgLTV = currCli.length > 0 ? currCli.reduce((a, c) => a + (Number(c.ltv) || 0), 0) / currCli.length : 0;
    const prevConvRate = prevCli.length > 0 ? (prevCli.filter(c => (c.conversionStatus || '').toLowerCase().includes('converted')).length / prevCli.length) * 100 : 0;
    const prevRetRate = prevCli.length > 0 ? (prevCli.filter(c => (c.retentionStatus || '').toLowerCase().includes('retained')).length / prevCli.length) * 100 : 0;

    // Expirations
    const currExp = expirationsData.filter(e => inRange(e.endDate, currRange.start, currRange.end) && matchesLocation(e.homeLocation || e.primaryLocation || '', loc));
    const prevExp = expirationsData.filter(e => inRange(e.endDate, prevRange.start, prevRange.end) && matchesLocation(e.homeLocation || e.primaryLocation || '', loc));
    const avgDaysActive = currExp.length > 0 ? currExp.reduce((a, e) => a + ((e as any).daysActive || 0), 0) / currExp.length : 0;
    const memBreakdown: Record<string, number> = {};
    currExp.forEach(e => { const m = e.membershipName || 'Unknown'; memBreakdown[m] = (memBreakdown[m] || 0) + 1; });
    const churnByMem = Object.entries(memBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name: name.length > 25 ? name.slice(0, 25) + '…' : name, count }));

    // Late cancellations
    const currLC = lateCancelData.filter(lc => inRange(lc.sessionDateIST || lc.dateIST || '', currRange.start, currRange.end) && matchesLocation(lc.location || '', loc));
    const prevLC = lateCancelData.filter(lc => inRange(lc.sessionDateIST || lc.dateIST || '', prevRange.start, prevRange.end) && matchesLocation(lc.location || '', loc));
    const sameDayLC = currLC.filter(lc => lc.isSameDayCancellation).length;
    const lcPenalties = currLC.filter(lc => (Number(lc.chargedPenaltyAmount) || 0) > 0).length;
    const lcRatio = currSess.length > 0 ? (currLC.length / currSess.length) * 100 : 0;

    return {
      // Revenue
      currRevenue: currRev, prevRevenue: prevRev, yoyRevenue: yoyRev,
      currTransactions: currS.length, prevTransactions: prevS.length,
      uniqueMembers, atv, prevAtv,
      discountPenetration, totalDiscount, discountedTxns,
      topCats, pkgRev, memRev, dropRev, revTrend,
      // Sessions
      totalSessions: currSess.length, prevSessions: prevSess.length,
      totalCheckins, prevCheckins, fillRate, prevFillRate,
      classAvg, nonEmptyAvg, prevClassAvg, emptySessions, emptyPct,
      formats, sessTrend, peakDay, dayData,
      // Trainers
      trainers: trainers.slice(0, 8), topTrainer, bottomTrainer, totalTrainers: currPay.length,
      totalCustomers, prevCustomers,
      // Leads
      totalLeads: currLeads.length, prevLeads: prevLeads.length, trialLeads, convertedLeads,
      leadCvr, leadToTrial, trialToCvr, topSources,
      // Clients
      newClients: currCli.length, prevNewClients: prevCli.length,
      converted: converted2, retained: retained2, convRate, retRate,
      prevConvRate, prevRetRate, avgLTV,
      // Churn
      churnedMembers: currExp.length, prevChurned: prevExp.length,
      avgDaysActive, churnByMem,
      // Late cancels
      lcCount: currLC.length, prevLCCount: prevLC.length,
      sameDayLC, lcPenalties, lcRatio,
    };
  }, [salesData, sessionsData, payrollData, newClientData, expirationsData, lateCancelData, leadsData, salesLoading, studio, month, year, currRange, prevRange, yoyRange, monthName, prevMonthName, prevMonthYear]);

  // AI narrative state — must be declared before any early returns
  const [aiNarrative, setAiNarrative] = useState<LocationReportNarrative | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiMetricsKey = useRef('');

  useEffect(() => {
    if (!metrics) return;
    const key = `${studio.id}:${month}:${year}`;
    if (aiMetricsKey.current === key) return;
    aiMetricsKey.current = key;
    setAiLoading(true);
    setAiNarrative(null);
    const h = computeHealthScore({ ...metrics, conversionRate: metrics.convRate, retentionRate: metrics.retRate });
    const payload = {
      totalRevenue: metrics.currRevenue,
      netRevenue: metrics.currRevenue,
      vatAmount: 0,
      totalTransactions: metrics.currTransactions,
      uniqueMembers: metrics.uniqueMembers,
      avgTransactionValue: metrics.atv,
      avgSpendPerMember: metrics.uniqueMembers > 0 ? metrics.currRevenue / metrics.uniqueMembers : 0,
      totalDiscounts: metrics.totalDiscount,
      discountRate: metrics.discountPenetration,
      totalSessions: metrics.totalSessions,
      totalCheckIns: metrics.totalCheckins,
      fillRate: metrics.fillRate,
      powerCycleSessions: metrics.formats.find(f => f.name === 'PowerCycle')?.sessions ?? 0,
      barreSessions: metrics.formats.find(f => f.name === 'Barre')?.sessions ?? 0,
      strengthSessions: metrics.formats.find(f => f.name === 'Strength')?.sessions ?? 0,
      lateCancellations: metrics.lcCount,
      totalTrainers: metrics.totalTrainers,
      avgClassSize: metrics.classAvg,
      topTrainerName: metrics.topTrainer?.name ?? 'N/A',
      topTrainerRevenue: 0,
      newClientsAcquired: metrics.newClients,
      conversionRate: metrics.convRate,
      retentionRate: metrics.retRate,
      churnRate: metrics.prevChurned > 0 ? ((metrics.churnedMembers - metrics.prevChurned) / metrics.prevChurned) * 100 : 0,
      churnedMembers: metrics.churnedMembers,
      totalLeads: metrics.totalLeads,
      leadsConverted: metrics.convertedLeads,
      leadConversionRate: metrics.leadCvr,
      overallScore: h.score,
      prevRevenue: metrics.prevRevenue,
      revenueChangePct: metrics.prevRevenue > 0 ? ((metrics.currRevenue - metrics.prevRevenue) / metrics.prevRevenue) * 100 : 0,
      prevFillRate: metrics.prevFillRate,
      prevConversionRate: metrics.prevConvRate,
    };
    geminiService.generateLocationReport(payload, studio.label, `${monthName} ${year}`)
      .then(n => { setAiNarrative(n); setAiLoading(false); })
      .catch(() => setAiLoading(false));
  }, [metrics, studio, month, year, monthName]);

  if (anyLoading || !metrics) return <LoadingScreen studio={studio.label} period={`${monthName} ${year}`} />;

  const m = metrics;
  const health = computeHealthScore({ ...m, conversionRate: m.convRate, retentionRate: m.retRate });

  // ── Narrative insight generators ───────────────────────────────────────────

  const revenueInsights = (() => {
    const items: Array<{ type: 'win' | 'risk' | 'watch'; text: string }> = [];
    const revGrowth = delta(m.currRevenue, m.prevRevenue);
    const atvGrowth = delta(m.atv, m.prevAtv);

    if (revGrowth >= 10) items.push({ type: 'win', text: `Revenue surged ${revGrowth.toFixed(1)}% MoM to ${fmt(m.currRevenue)}, an outstanding month that signals strong demand and execution. Momentum is clearly building.` });
    else if (revGrowth >= 0) items.push({ type: 'watch', text: `Revenue grew ${revGrowth.toFixed(1)}% MoM to ${fmt(m.currRevenue)} — modest but positive progress. Identify which product categories drove growth to amplify them.` });
    else items.push({ type: 'risk', text: `Revenue fell ${Math.abs(revGrowth).toFixed(1)}% MoM to ${fmt(m.currRevenue)} (from ${fmt(m.prevRevenue)}). Investigate whether this is seasonal softness or structural: compare with same month last year (${fmt(m.yoyRevenue)}).` });

    if (m.discountPenetration > 35) items.push({ type: 'risk', text: `Discount penetration at ${pct(m.discountPenetration)} is elevated — ${m.discountedTxns} of ${m.currTransactions} transactions used a discount, totalling ${fmt(m.totalDiscount)} in concessions. This level of discounting is eroding margin and potentially training members to wait for deals.` });
    else if (m.discountPenetration > 20) items.push({ type: 'watch', text: `${pct(m.discountPenetration)} of transactions carried a discount (${fmt(m.totalDiscount)} total). Manageable, but monitor closely — if it crosses 30% you risk a discount dependency culture.` });
    else items.push({ type: 'win', text: `Discount penetration is healthy at ${pct(m.discountPenetration)}, meaning most revenue is being earned at full price. This protects margin and signals genuine demand.` });

    if (atvGrowth > 5) items.push({ type: 'win', text: `Average transaction value rose to ${fmt(m.atv)} (up ${atvGrowth.toFixed(1)}% MoM), suggesting members are buying larger or more premium packages. Upsell strategies appear to be working.` });
    else if (atvGrowth < -5) items.push({ type: 'risk', text: `Average transaction value slipped to ${fmt(m.atv)} (down ${Math.abs(atvGrowth).toFixed(1)}% MoM). This could indicate a mix shift toward smaller packages or discount-driven purchasing. Review product mix.` });

    if (m.pkgRev > 0 && m.currRevenue > 0) {
      const pkgShare = (m.pkgRev / m.currRevenue) * 100;
      if (pkgShare > 50) items.push({ type: 'win', text: `Package sales dominate at ${pct(pkgShare)} of net revenue (${fmt(m.pkgRev)}), indicating strong commitment buying. This is the most predictable and valuable revenue type for the studio.` });
    }

    return items;
  })();

  const sessionInsights = (() => {
    const items: Array<{ type: 'win' | 'risk' | 'watch'; text: string }> = [];
    const fillGrowth = delta(m.fillRate, m.prevFillRate);

    if (m.fillRate >= 75) items.push({ type: 'win', text: `Fill rate of ${pct(m.fillRate)} is excellent — classes are running at high utilisation. This validates your scheduling and is a strong signal for potential capacity expansion.` });
    else if (m.fillRate >= 55) items.push({ type: 'watch', text: `Fill rate at ${pct(m.fillRate)} is decent but there is capacity headroom. With ${m.totalCheckins} check-ins across ${m.totalSessions} sessions, targeted marketing on under-attended slots could unlock additional revenue without added cost.` });
    else items.push({ type: 'risk', text: `Fill rate of ${pct(m.fillRate)} is below the target threshold. At ${m.totalCheckins} check-ins across ${m.totalSessions} sessions, too many classes are running under-capacity. Consider rationalising the schedule or repositioning under-subscribed time slots.` });

    if (m.emptyPct > 10) items.push({ type: 'risk', text: `${m.emptySessions} sessions (${pct(m.emptyPct)}) ran with zero check-ins. Every empty class is a direct cost with zero revenue offset. Audit these slots: time of day, trainer, format, and day of week to identify patterns.` });

    if (fillGrowth > 0) items.push({ type: 'win', text: `Fill rate improved ${fillGrowth.toFixed(1)} percentage points MoM, from ${pct(m.prevFillRate)} to ${pct(m.fillRate)} — consistent improvement trend.` });
    else if (fillGrowth < -5) items.push({ type: 'risk', text: `Fill rate dropped ${Math.abs(fillGrowth).toFixed(1)} points MoM. Cross-reference with late cancellation data — a rise in last-minute dropouts may be artificially depressing fill metrics.` });

    if (m.formats.length > 1) {
      const best = [...m.formats].sort((a, b) => b.fillRate - a.fillRate)[0];
      const worst = [...m.formats].sort((a, b) => a.fillRate - b.fillRate)[0];
      if (best.name !== worst.name) {
        items.push({ type: 'watch', text: `Format gap: ${best.name} leads with ${pct(best.fillRate)} fill rate and ${best.classAvg.toFixed(1)} avg class size, while ${worst.name} trails at ${pct(worst.fillRate)}. The ${worst.name} schedule may need pruning or promotion to close this gap.` });
      }
    }

    if (m.peakDay) items.push({ type: 'watch', text: `${m.peakDay} is the busiest attendance day. Ensure trainer allocation, front-desk staffing, and class capacity are optimised for peak-day demand.` });

    return items;
  })();

  const funnelInsights = (() => {
    const items: Array<{ type: 'win' | 'risk' | 'watch'; text: string }> = [];

    if (m.totalLeads > 0) {
      if (m.leadToTrial < 30) items.push({ type: 'risk', text: `Only ${pct(m.leadToTrial)} of leads (${m.trialLeads} of ${m.totalLeads}) actually completed a trial. The biggest drop in your funnel is at lead→trial — your outreach quality or follow-up speed needs attention.` });
      else items.push({ type: 'win', text: `${pct(m.leadToTrial)} lead-to-trial rate — ${m.trialLeads} of ${m.totalLeads} leads showed up for a session. Above-average pipeline conversion.` });

      if (m.trialToCvr < 40) items.push({ type: 'risk', text: `Trial-to-membership conversion at ${pct(m.trialToCvr)} means more than 6 in 10 trialists are not converting. Identify whether the barrier is price, schedule, experience, or follow-up — each has a different intervention.` });
      else items.push({ type: 'win', text: `${pct(m.trialToCvr)} of trialists are converting to membership — strong post-trial experience and sales follow-through.` });
    }

    if (m.convRate < 30) items.push({ type: 'risk', text: `New member conversion rate at ${pct(m.convRate)} (${m.converted} of ${m.newClients}) is below the 40% benchmark. At an average LTV of ${fmt(m.avgLTV)}, each unconverted trialist represents a missed ${fmt(m.avgLTV)} revenue opportunity.` });
    else if (m.convRate >= 50) items.push({ type: 'win', text: `Strong ${pct(m.convRate)} conversion rate — ${m.converted} of ${m.newClients} new members are committing to memberships. Your onboarding experience and sales process are working.` });
    else items.push({ type: 'watch', text: `Conversion rate of ${pct(m.convRate)} is reasonable but the gap between ${m.newClients} trialists and ${m.converted} converted members (${m.newClients - m.converted} not converting) represents significant untapped LTV.` });

    if (m.retRate < 25) items.push({ type: 'risk', text: `Post-conversion retention at ${pct(m.retRate)} is concerning — members are converting but not staying. Focus on the critical 30–60 day post-purchase window with engagement programming.` });
    else if (m.retRate >= 45) items.push({ type: 'win', text: `${pct(m.retRate)} retention rate — converted members are staying and building habits. This is the foundation of your LTV and recurring revenue base.` });

    if (m.topSources.length > 0) {
      const topSrc = m.topSources[0];
      const highCvrSrc = [...m.topSources].sort((a, b) => b.cvr - a.cvr)[0];
      if (highCvrSrc && highCvrSrc.name !== topSrc.name) {
        items.push({ type: 'watch', text: `While ${topSrc.name} drives the most leads (${topSrc.count}), ${highCvrSrc.name} has the highest conversion quality at ${pct(highCvrSrc.cvr)}. Double down on ${highCvrSrc.name} for better quality-adjusted pipeline.` });
      }
    }

    return items;
  })();

  const churnInsights = (() => {
    const items: Array<{ type: 'win' | 'risk' | 'watch'; text: string }> = [];
    const churnGrowth = delta(m.churnedMembers, m.prevChurned);

    if (m.churnedMembers === 0) {
      items.push({ type: 'win', text: 'No membership expirations recorded this period — excellent retention or no memberships reaching end-of-term.' });
    } else {
      if (churnGrowth > 20) items.push({ type: 'risk', text: `Churn spiked ${churnGrowth.toFixed(0)}% MoM — ${m.churnedMembers} lapsed vs ${m.prevChurned} last month. This acceleration is a red flag. Check if a specific membership type or batch renewal is driving this.` });
      else if (churnGrowth <= 0) items.push({ type: 'win', text: `Lapsed members fell ${Math.abs(churnGrowth).toFixed(0)}% MoM to ${m.churnedMembers} — churn pressure is easing. Whatever retention actions are in place appear to be working.` });
      else items.push({ type: 'watch', text: `${m.churnedMembers} memberships lapsed this month, up ${churnGrowth.toFixed(0)}% from last month. Monitor momentum: sequential increases indicate structural retention weakness.` });

      if (m.avgDaysActive > 0 && m.avgDaysActive < 45) items.push({ type: 'risk', text: `Lapsing members were active for only ${m.avgDaysActive.toFixed(0)} days on average — this indicates early-stage dropout, not natural membership end. The critical intervention window is the first 4–6 weeks post-purchase.` });
      else if (m.avgDaysActive > 180) items.push({ type: 'watch', text: `Lapsing members had ${m.avgDaysActive.toFixed(0)} average days of activity before expiring. These are long-term members — re-engagement campaigns are worth the effort given their demonstrated commitment history.` });
    }

    if (m.churnByMem.length > 0 && m.churnedMembers > 0) {
      const topChurnMem = m.churnByMem[0];
      items.push({ type: 'watch', text: `"${topChurnMem.name}" is the most frequently lapsing membership type with ${topChurnMem.count} expirations this month. Consider a targeted re-enrolment campaign for this segment.` });
    }

    return items;
  })();

  const lcInsights = (() => {
    const items: Array<{ type: 'win' | 'risk' | 'watch'; text: string }> = [];
    const lcGrowth = delta(m.lcCount, m.prevLCCount);

    if (m.lcCount === 0) {
      items.push({ type: 'win', text: 'Zero late cancellations this period — exceptional member commitment and scheduling discipline.' });
    } else {
      if (m.lcRatio > 20) items.push({ type: 'risk', text: `Late cancellation rate of ${pct(m.lcRatio)} per session (${m.lcCount} cancellations) is high. This is both a revenue risk and a scheduling burden — spots booked are not being filled, blocking genuine demand from getting in.` });
      else if (m.lcRatio < 8) items.push({ type: 'win', text: `Late cancellation rate of ${pct(m.lcRatio)} per session is well-controlled. Low LC rates indicate committed members and effective booking policies.` });

      if (m.sameDayLC > 0) {
        const sdPct = (m.sameDayLC / m.lcCount) * 100;
        if (sdPct > 50) items.push({ type: 'risk', text: `${pct(sdPct)} of cancellations (${m.sameDayLC}) are same-day. Same-day cancellations leave no time to fill spots — stricter enforcement or pre-booking incentives could meaningfully recover occupancy.` });
      }

      if (m.lcPenalties > 0) {
        const penPct = (m.lcPenalties / m.lcCount) * 100;
        if (penPct < 40) items.push({ type: 'watch', text: `Penalty enforcement rate is only ${pct(penPct)} — ${m.lcPenalties} of ${m.lcCount} late cancellations were charged. Inconsistent enforcement undermines the policy's deterrent effect.` });
        else items.push({ type: 'win', text: `${pct(penPct)} penalty enforcement rate (${m.lcPenalties} of ${m.lcCount} charged) — policy is being applied consistently, which helps deter repeat behaviour.` });
      }

      if (lcGrowth > 25) items.push({ type: 'risk', text: `Late cancellations rose ${lcGrowth.toFixed(0)}% MoM to ${m.lcCount}. Identify if a specific trainer, time slot, or class format is driving the increase.` });
      else if (lcGrowth < -15) items.push({ type: 'win', text: `Late cancellations dropped ${Math.abs(lcGrowth).toFixed(0)}% MoM — positive improvement, likely driven by better policy communication or booking commitment incentives.` });
    }

    return items;
  })();

  const trainerInsights = (() => {
    const items: Array<{ type: 'win' | 'risk' | 'watch'; text: string }> = [];
    if (!m.topTrainer) {
      items.push({ type: 'watch', text: 'No payroll data matched for this period. Trainer insights will populate once payroll data is recorded.' });
      return items;
    }
    items.push({ type: 'win', text: `${m.topTrainer.name} leads the studio with ${num(m.topTrainer.customers)} customers across ${m.topTrainer.sessions} sessions — a class average of ${m.topTrainer.classAvg.toFixed(1)}. This trainer is a key driver of attendance revenue.` });
    if (m.topTrainer.classAvg > 12) items.push({ type: 'win', text: `${m.topTrainer.name}'s class average of ${m.topTrainer.classAvg.toFixed(1)} indicates magnetic demand. Ensure this trainer's schedule is optimised and retention programs are in place.` });
    if (m.bottomTrainer && m.bottomTrainer.classAvg < 5 && m.bottomTrainer.sessions > 2) {
      items.push({ type: 'risk', text: `${m.bottomTrainer.name} is averaging only ${m.bottomTrainer.classAvg.toFixed(1)} members per non-empty class across ${m.bottomTrainer.sessions} sessions. This trainer needs support: observe class experience, solicit member feedback, or review schedule placement.` });
    }
    const customerGrowth = delta(m.totalCustomers, m.prevCustomers);
    if (customerGrowth > 0) items.push({ type: 'win', text: `Studio-wide trainer-attributed customers grew ${customerGrowth.toFixed(1)}% MoM to ${num(m.totalCustomers)}, indicating healthy and growing class demand across the trainer roster.` });
    else if (customerGrowth < -10) items.push({ type: 'risk', text: `Trainer-attributed customers dropped ${Math.abs(customerGrowth).toFixed(1)}% MoM. This could signal scheduling changes, trainer churn, or member drift — investigate before the trend compounds.` });

    return items;
  })();

  // ── Health score ring SVG ────────────────────────────────────────────────
  const ringCircumference = 2 * Math.PI * 44;
  const ringProgress = (health.score / 100) * ringCircumference;

  return (
    <div className="min-h-screen" style={{ background: P.navy, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${P.navyCard} 0%, ${P.navyMid} 100%)`, borderBottom: `1px solid ${P.gold}20` }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 right-0 w-[500px] h-[400px] opacity-6 rounded-full" style={{ background: P.gold, filter: 'blur(100px)' }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.018]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="hg" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#hg)" />
          </svg>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-9">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"
                  style={{ background: `${P.gold}18`, border: `1px solid ${P.gold}40`, color: P.gold }}>
                  <Star size={10} /> Executive Report
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: `${P.blue}20`, color: P.blueLight, border: `1px solid ${P.blue}30` }}>{studio.city}</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: `${health.color}20`, color: health.color, border: `1px solid ${health.color}40` }}>
                  Studio Health: {health.label}
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1" style={{ color: P.cream, letterSpacing: '-0.025em' }}>{studio.label}</h1>
              <p className="text-lg font-light" style={{ color: `${P.cream}55` }}>{monthName} {year} · Performance Intelligence Report</p>
            </div>
            <div className="flex items-center gap-6">
              {/* Health score ring */}
              <div className="relative flex items-center justify-center">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke={`${health.color}20`} strokeWidth="8" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke={health.color} strokeWidth="8"
                    strokeDasharray={`${ringProgress} ${ringCircumference}`}
                    strokeLinecap="round" strokeDashoffset={ringCircumference / 4}
                    style={{ transition: 'stroke-dasharray 1s ease' }} />
                  <text x="50" y="46" textAnchor="middle" fontSize="22" fontWeight="900" fill={health.color}>{health.score}</text>
                  <text x="50" y="61" textAnchor="middle" fontSize="9" fontWeight="600" fill={`${P.cream}60`} letterSpacing="2">HEALTH</text>
                </svg>
              </div>
              <div className="space-y-2 text-right">
                <div>
                  <div className="text-2xl font-black" style={{ color: P.gold }}>{fmt(m.currRevenue)}</div>
                  <div className="text-xs" style={{ color: P.creamMuted }}>Net Revenue · <Chip value={delta(m.currRevenue, m.prevRevenue)} /></div>
                </div>
                <div>
                  <div className="text-2xl font-black" style={{ color: P.cream }}>{pct(m.fillRate)}</div>
                  <div className="text-xs" style={{ color: P.creamMuted }}>Fill Rate</div>
                </div>
              </div>
              <button onClick={onReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                style={{ background: `${P.gold}12`, border: `1px solid ${P.gold}30`, color: P.gold }}>
                <RefreshCw size={12} /> Change
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* ── AI Cockpit Readout ── */}
        <section>
          <div className="rounded-3xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${P.navyCard} 0%, ${P.navyMid} 100%)`, border: `1px solid ${P.gold}30` }}>
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: `1px solid ${P.gold}18` }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: `${P.gold}18`, border: `1px solid ${P.gold}35` }}>
                  <Zap size={18} style={{ color: P.gold }} />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight" style={{ color: P.cream }}>AI Executive Readout</h2>
                  <p className="text-xs mt-0.5" style={{ color: P.creamMuted }}>Gemini Intelligence · {monthName} {year} · {studio.label}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: `${health.color}18`, border: `1px solid ${health.color}35`, color: health.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: health.color }} />
                {health.label} · {health.score}/100
              </span>
            </div>

            {aiLoading && !aiNarrative ? (
              <div className="px-7 py-10 flex flex-col items-center gap-4">
                <div className="flex gap-1.5">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: P.gold, animationDelay: `${i*0.12}s`, opacity: 0.6 }} />
                  ))}
                </div>
                <p className="text-sm" style={{ color: P.creamMuted }}>Analysing {monthName} {year} data…</p>
              </div>
            ) : aiNarrative ? (
              <div className="p-7 space-y-6">
                {/* Verdict pill */}
                {aiNarrative.overallVerdict && (
                  <div className="px-5 py-3.5 rounded-2xl" style={{ background: `${P.gold}10`, border: `1px solid ${P.gold}25` }}>
                    <p className="text-sm font-semibold leading-relaxed" style={{ color: P.cream }}>
                      <span className="font-black" style={{ color: P.gold }}>Verdict: </span>
                      {aiNarrative.overallVerdict}
                    </p>
                  </div>
                )}

                {/* Executive summary */}
                {aiNarrative.executiveSummary && (
                  <div>
                    <p className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: `${P.creamMuted}` }}>Executive Summary</p>
                    <p className="text-sm leading-relaxed" style={{ color: `${P.cream}85` }}>{aiNarrative.executiveSummary}</p>
                  </div>
                )}

                {/* Three columns: narratives */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Revenue', text: aiNarrative.revenueNarrative, accent: P.gold },
                    { label: 'Operations', text: aiNarrative.operationsNarrative, accent: P.blue },
                    { label: 'Clients & Retention', text: aiNarrative.clientNarrative, accent: P.green },
                  ].filter(x => x.text).map(({ label, text, accent }) => (
                    <div key={label} className="rounded-2xl p-4" style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}>
                      <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: accent }}>{label}</p>
                      <p className="text-xs leading-relaxed" style={{ color: `${P.cream}75` }}>{text}</p>
                    </div>
                  ))}
                </div>

                {/* Highlights + Concerns + Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Highlights */}
                  {aiNarrative.highlights?.length > 0 && (
                    <div className="rounded-2xl p-4" style={{ background: `${P.green}08`, border: `1px solid ${P.green}20` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={13} style={{ color: P.green }} />
                        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: P.green }}>Highlights</span>
                      </div>
                      <ul className="space-y-2">
                        {aiNarrative.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: P.greenLight }} />
                            <span className="text-xs leading-relaxed" style={{ color: `${P.cream}75` }}>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Concerns */}
                  {aiNarrative.concerns?.length > 0 && (
                    <div className="rounded-2xl p-4" style={{ background: `${P.red}08`, border: `1px solid ${P.red}20` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={13} style={{ color: P.red }} />
                        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: P.red }}>Watch Points</span>
                      </div>
                      <ul className="space-y-2">
                        {aiNarrative.concerns.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: P.redLight }} />
                            <span className="text-xs leading-relaxed" style={{ color: `${P.cream}75` }}>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {aiNarrative.recommendations?.length > 0 && (
                    <div className="rounded-2xl p-4" style={{ background: `${P.gold}08`, border: `1px solid ${P.gold}20` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowRight size={13} style={{ color: P.gold }} />
                        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: P.gold }}>Actions</span>
                      </div>
                      <ul className="space-y-2">
                        {aiNarrative.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 text-[10px] font-black shrink-0" style={{ color: P.gold }}>{i + 1}.</span>
                            <span className="text-xs leading-relaxed" style={{ color: `${P.cream}75` }}>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-7 py-6">
                <p className="text-sm text-center" style={{ color: `${P.creamMuted}70` }}>AI readout unavailable. Detailed insights below.</p>
              </div>
            )}
          </div>
        </section>

        {/* ── 1. Revenue ── */}
        <section>
          <SectionTitle icon={<DollarSign size={20} />} title="Revenue & Commercial Performance"
            sub={`${monthName} ${year} vs ${prevMonthName} · All figures net of VAT`} accent={P.gold} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPI label="Net Revenue" value={fmt(m.currRevenue)} sub={`${fmt(m.prevRevenue)} prior month`}
              mom={delta(m.currRevenue, m.prevRevenue)} yoy={delta(m.currRevenue, m.yoyRevenue)}
              icon={<DollarSign size={18} />} accent={P.gold} />
            <KPI label="Transactions" value={num(m.currTransactions)} sub={`${num(m.prevTransactions)} prior`}
              mom={delta(m.currTransactions, m.prevTransactions)} icon={<Activity size={18} />} accent={P.blue} />
            <KPI label="Avg Transaction" value={fmt(m.atv)} sub="per sale"
              mom={delta(m.atv, m.prevAtv)} icon={<Target size={18} />} accent={P.teal} />
            <KPI label="Buying Members" value={num(m.uniqueMembers)} sub="distinct purchasers"
              icon={<Users size={18} />} accent={P.purple} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            <div className="rounded-2xl p-5" style={{ background: P.navyCard, border: `1px solid ${P.gold}18` }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: P.cream }}>6-Month Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={m.revTrend}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={P.gold} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={P.gold} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${P.cream}07`} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: `${P.cream}50` }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: `${P.cream}40` }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={60} />
                  <Tooltip content={(p) => <TT {...p} prefix="₹" />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={P.gold} strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: P.gold, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl p-5" style={{ background: P.navyCard, border: `1px solid ${P.gold}18` }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: P.cream }}>Revenue by Category</h3>
              {m.topCats.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {m.topCats.slice(0, 5).map((cat, i) => {
                    const share = m.currRevenue > 0 ? (cat.value / m.currRevenue) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: `${P.cream}75` }}>{cat.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: P.creamMuted }}>{pct(share)}</span>
                            <span className="text-xs font-bold" style={{ color: P.cream }}>{fmt(cat.value)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${P.cream}08` }}>
                          <div className="h-full rounded-full" style={{ width: `${share}%`, background: CHART_COLORS[i] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-sm py-16 text-center" style={{ color: `${P.cream}30` }}>No category data</p>}
            </div>
          </div>

          {/* Revenue mix pills */}
          {(m.pkgRev > 0 || m.memRev > 0 || m.dropRev > 0) && (
            <div className="flex flex-wrap gap-3 mb-5">
              {[
                { label: 'Package Revenue', value: m.pkgRev, color: P.blue },
                { label: 'Membership Revenue', value: m.memRev, color: P.purple },
                { label: 'Drop-in / Trial', value: m.dropRev, color: P.teal },
              ].filter(x => x.value > 0).map((x, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
                  style={{ background: `${x.color}12`, border: `1px solid ${x.color}25` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: x.color }} />
                  <span className="text-xs font-medium" style={{ color: `${P.cream}70` }}>{x.label}</span>
                  <span className="text-sm font-black" style={{ color: P.cream }}>{fmt(x.value)}</span>
                  <span className="text-xs" style={{ color: x.color }}>{m.currRevenue > 0 ? pct((x.value / m.currRevenue) * 100, 0) : '—'}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">{revenueInsights.map((item, i) => <InsightCard key={i} {...item} />)}</div>
        </section>

        {/* ── 2. Sessions ── */}
        <section>
          <SectionTitle icon={<Activity size={20} />} title="Class Attendance & Studio Utilisation"
            sub="Fill rates, class averages, format breakdown and peak patterns" accent={P.blue} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPI label="Total Sessions" value={num(m.totalSessions)} mom={delta(m.totalSessions, m.prevSessions)}
              icon={<BarChart2 size={18} />} accent={P.blue} />
            <KPI label="Total Check-ins" value={num(m.totalCheckins)} mom={delta(m.totalCheckins, m.prevCheckins)}
              icon={<Users size={18} />} accent={P.green} />
            <KPI label="Fill Rate" value={pct(m.fillRate)} sub={`${pct(m.prevFillRate)} prior`}
              mom={delta(m.fillRate, m.prevFillRate)} icon={<Percent size={18} />} accent={P.gold} />
            <KPI label="Class Average" value={m.classAvg.toFixed(1)} sub={`${m.nonEmptyAvg.toFixed(1)} excl. empty`}
              mom={delta(m.classAvg, m.prevClassAvg)} icon={<Target size={18} />} accent={P.teal} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            <div className="rounded-2xl p-5" style={{ background: P.navyCard, border: `1px solid ${P.blue}20` }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: P.cream }}>6-Month Fill Rate Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={m.sessTrend}>
                  <defs>
                    <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={P.blue} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={P.blue} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${P.cream}07`} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: `${P.cream}50` }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: `${P.cream}40` }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <Tooltip content={(p) => <TT {...p} suffix="%" />} />
                  <Area type="monotone" dataKey="fillRate" name="Fill Rate" stroke={P.blue} strokeWidth={2.5} fill="url(#fillGrad)" dot={{ fill: P.blue, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl p-5" style={{ background: P.navyCard, border: `1px solid ${P.blue}20` }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: P.cream }}>Check-ins by Day of Week</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={m.dayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${P.cream}07`} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: `${P.cream}60` }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: `${P.cream}40` }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="checkins" name="Check-ins" radius={[4, 4, 0, 0]}>
                    {m.dayData.map((d, i) => <Cell key={i} fill={d.day === m.peakDay ? P.gold : P.blue} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Format breakdown cards */}
          {m.formats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {[
                { name: 'Barre', grad: 'from-purple-700 to-violet-800', accent: '#7C3AED' },
                { name: 'PowerCycle', grad: 'from-blue-700 to-indigo-800', accent: '#1D4ED8' },
                { name: 'Strength', grad: 'from-rose-600 to-pink-800', accent: '#E11D48' },
              ].map(({ name, accent }) => {
                const f = m.formats.find(x => x.name === name);
                if (!f) return null;
                return (
                  <div key={name} className="rounded-2xl p-5 relative overflow-hidden" style={{ background: P.navyCard, border: `1px solid ${accent}30` }}>
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10" style={{ background: accent, filter: 'blur(20px)' }} />
                    <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: accent }}>{name}</div>
                    <div className="text-2xl font-black mb-3" style={{ color: P.cream }}>{pct(f.fillRate)}</div>
                    <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: `${P.cream}10` }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(f.fillRate, 100)}%`, background: accent }} />
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: 'Sessions', value: num(f.sessions) },
                        { label: 'Check-ins', value: num(f.checkins) },
                        { label: 'Class Avg', value: f.classAvg.toFixed(1) },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: P.creamMuted }}>{label}</span>
                          <span className="text-xs font-bold" style={{ color: P.cream }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}

          <div className="space-y-3">{sessionInsights.map((item, i) => <InsightCard key={i} {...item} />)}</div>
        </section>

        {/* ── 3. Lead Funnel & New Members ── */}
        <section>
          <SectionTitle icon={<Target size={20} />} title="Lead Funnel & Member Acquisition"
            sub="Leads → trials → conversions → retention pipeline" accent={P.green} />

          {/* Funnel visual */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: P.navyCard, border: `1px solid ${P.green}20` }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPI label="Leads Received" value={num(m.totalLeads)} mom={delta(m.totalLeads, m.prevLeads)}
                icon={<Users size={18} />} accent={P.blue} />
              <KPI label="Trials / First Visits" value={num(m.newClients)} mom={delta(m.newClients, m.prevNewClients)}
                icon={<Zap size={18} />} accent={P.teal} />
              <KPI label="Converted to Membership" value={num(m.converted)} sub={`${pct(m.convRate)} conversion rate`}
                mom={delta(m.convRate, m.prevConvRate)} icon={<Target size={18} />} accent={P.green} />
              <KPI label="Retained Active" value={num(m.retained)} sub={`${pct(m.retRate)} retention · Avg LTV ${fmt(m.avgLTV)}`}
                mom={delta(m.retRate, m.prevRetRate)} icon={<Shield size={18} />} accent={P.gold} />
            </div>

            {/* Visual funnel bars */}
            <div className="space-y-3">
              {[
                { label: 'Leads Received', value: m.totalLeads, pctVal: 100, color: P.blue, note: 'Top of funnel' },
                { label: 'Trial / First Visit', value: m.newClients, pctVal: m.totalLeads > 0 ? (m.newClients / m.totalLeads) * 100 : 100, color: P.teal, note: `${m.totalLeads > 0 ? pct((m.newClients / m.totalLeads) * 100) : '—'} of leads` },
                { label: 'Converted to Member', value: m.converted, pctVal: m.totalLeads > 0 ? (m.converted / m.totalLeads) * 100 : (m.newClients > 0 ? (m.converted / m.newClients) * 100 : 0), color: P.green, note: `${pct(m.convRate)} of trialists` },
                { label: 'Retained Active', value: m.retained, pctVal: m.totalLeads > 0 ? (m.retained / m.totalLeads) * 100 : (m.newClients > 0 ? (m.retained / m.newClients) * 100 : 0), color: P.gold, note: `${pct(m.retRate)} of trialists` },
              ].filter(r => r.value > 0 || r.label === 'Leads Received').map((row, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-sm font-semibold" style={{ color: `${P.cream}85` }}>{row.label}</span>
                      <span className="ml-2 text-xs" style={{ color: P.creamMuted }}>{row.note}</span>
                    </div>
                    <span className="font-black text-base" style={{ color: P.cream }}>{num(row.value)}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: `${P.cream}08` }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(row.pctVal, 100)}%`, background: `linear-gradient(90deg, ${row.color}, ${row.color}90)` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top lead sources */}
          {m.topSources.length > 0 && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: P.navyCard, border: `1px solid ${P.green}15` }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: P.cream }}>Lead Source Performance</h3>
              <div className="space-y-3">
                {m.topSources.map((src, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                      style={{ background: `${CHART_COLORS[i]}25`, color: CHART_COLORS[i] }}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate" style={{ color: `${P.cream}85` }}>{src.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs" style={{ color: P.creamMuted }}>{src.count} leads</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: src.cvr >= 40 ? `${P.green}20` : `${P.gold}20`, color: src.cvr >= 40 ? P.greenLight : P.gold }}>
                            {pct(src.cvr)} cvr
                          </span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: `${P.cream}08` }}>
                        <div className="h-full rounded-full" style={{ width: `${m.topSources[0].count > 0 ? (src.count / m.topSources[0].count) * 100 : 0}%`, background: CHART_COLORS[i] }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">{funnelInsights.map((item, i) => <InsightCard key={i} {...item} />)}</div>
        </section>

        {/* ── 4. Trainers ── */}
        <section>
          <SectionTitle icon={<Award size={20} />} title="Trainer Performance"
            sub={`${m.totalTrainers} active trainers · ${num(m.totalCustomers)} customers served`} accent={P.purple} />

          {m.trainers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
                {m.trainers.slice(0, 6).map((t, i) => {
                  const isTop = i === 0;
                  const classAvgColor = t.classAvg >= 12 ? P.green : t.classAvg >= 7 ? P.gold : P.red;
                  return (
                    <div key={t.name} className="rounded-2xl p-5 relative overflow-hidden"
                      style={{ background: P.navyCard, border: `1px solid ${isTop ? P.gold : P.purple}25` }}>
                      {isTop && (
                        <div className="absolute top-3 right-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                            style={{ background: `${P.gold}25`, color: P.gold }}>TOP</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                          style={{ background: isTop ? `${P.gold}20` : `${P.purple}20`, color: isTop ? P.gold : P.purpleLight }}>
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm" style={{ color: P.cream }}>{t.name}</div>
                          <div className="text-xs" style={{ color: P.creamMuted }}>{t.sessions} sessions</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Customers', value: num(t.customers), color: P.cream },
                          { label: 'Class Avg', value: t.classAvg.toFixed(1), color: classAvgColor },
                          { label: 'Converted', value: num(t.converted), color: P.green },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center">
                            <div className="text-lg font-black" style={{ color }}>{value}</div>
                            <div className="text-[10px] mt-0.5 font-semibold uppercase tracking-wider" style={{ color: P.creamMuted }}>{label}</div>
                          </div>
                        ))}
                      </div>
                      {/* Class avg bar */}
                      <div className="mt-3">
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: `${P.cream}08` }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min((t.classAvg / 20) * 100, 100)}%`, background: classAvgColor }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3">{trainerInsights.map((item, i) => <InsightCard key={i} {...item} />)}</div>
            </>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{ background: P.navyCard }}>
              <p className="text-sm" style={{ color: `${P.cream}40` }}>No payroll data matched for {monthName} {year}. Ensure payroll records use "{monthName} {year}" format.</p>
            </div>
          )}
        </section>

        {/* ── 5. Lapsed & Churn ── */}
        <section>
          <SectionTitle icon={<Flame size={20} />} title="Lapsed Members & Churn Analysis"
            sub="Membership expirations, patterns and revenue risk" accent={P.rose} />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <KPI label="Lapsed Members" value={num(m.churnedMembers)} sub={`${num(m.prevChurned)} prior month`}
              mom={-delta(m.churnedMembers, m.prevChurned)} inverse icon={<TrendingDown size={18} />} accent={P.rose} />
            <KPI label="Avg Days Active" value={m.avgDaysActive > 0 ? `${m.avgDaysActive.toFixed(0)}d` : '—'}
              sub="before lapsing" icon={<Clock size={18} />} accent={P.orange} />
            <KPI label="Churn MoM Change" value={m.prevChurned > 0 ? `${delta(m.churnedMembers, m.prevChurned) > 0 ? '+' : ''}${delta(m.churnedMembers, m.prevChurned).toFixed(0)}%` : '—'}
              sub="month over month" icon={<AlertTriangle size={18} />} accent={m.churnedMembers > m.prevChurned ? P.red : P.green} />
          </div>

          {m.churnByMem.length > 0 && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: P.navyCard, border: `1px solid ${P.rose}18` }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: P.cream }}>Lapsed by Membership Type</h3>
              <div className="space-y-3">
                {m.churnByMem.map((mem, i) => {
                  const share = m.churnedMembers > 0 ? (mem.count / m.churnedMembers) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate" style={{ color: `${P.cream}80` }}>{mem.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs" style={{ color: P.creamMuted }}>{pct(share)}</span>
                          <span className="text-sm font-black" style={{ color: P.rose }}>{num(mem.count)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${P.cream}08` }}>
                        <div className="h-full rounded-full" style={{ width: `${share}%`, background: CHART_COLORS[(i + 4) % CHART_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">{churnInsights.map((item, i) => <InsightCard key={i} {...item} />)}</div>
        </section>

        {/* ── 6. Late Cancellations ── */}
        <section>
          <SectionTitle icon={<Clock size={20} />} title="Late Cancellations"
            sub="Timing, penalties and impact on studio utilisation" accent={P.orange} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPI label="Late Cancellations" value={num(m.lcCount)} sub={`${num(m.prevLCCount)} prior month`}
              mom={-delta(m.lcCount, m.prevLCCount)} inverse icon={<Clock size={18} />} accent={P.orange} />
            <KPI label="Same-day Cancels" value={num(m.sameDayLC)} sub={m.lcCount > 0 ? `${pct((m.sameDayLC / m.lcCount) * 100)} of total` : '—'}
              icon={<AlertTriangle size={18} />} accent={P.red} />
            <KPI label="Penalties Charged" value={num(m.lcPenalties)} sub={m.lcCount > 0 ? `${pct((m.lcPenalties / m.lcCount) * 100)} enforcement` : '—'}
              icon={<Shield size={18} />} accent={m.lcPenalties / Math.max(m.lcCount, 1) > 0.5 ? P.green : P.gold} />
            <KPI label="LC per Session" value={pct(m.lcRatio)} sub="late cancel rate"
              icon={<Activity size={18} />} accent={m.lcRatio < 10 ? P.green : P.red} />
          </div>

          {/* LC trend vs sessions trend */}
          <div className="rounded-2xl p-5 mb-5" style={{ background: P.navyCard, border: `1px solid ${P.orange}18` }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: P.cream }}>Cancellation Breakdown</h3>
            {m.lcCount > 0 ? (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {[
                  { label: 'Same-day', value: m.sameDayLC, pctVal: m.lcCount > 0 ? (m.sameDayLC / m.lcCount) * 100 : 0, color: P.red },
                  { label: 'In-advance', value: m.lcCount - m.sameDayLC, pctVal: m.lcCount > 0 ? ((m.lcCount - m.sameDayLC) / m.lcCount) * 100 : 0, color: P.orange },
                  { label: 'Penalised', value: m.lcPenalties, pctVal: m.lcCount > 0 ? (m.lcPenalties / m.lcCount) * 100 : 0, color: P.green },
                ].map(({ label, value, pctVal, color }) => (
                  <div key={label} className="text-center p-4 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                    <div className="text-2xl font-black mb-1" style={{ color }}>{num(value)}</div>
                    <div className="text-xs mb-2" style={{ color: P.creamMuted }}>{pct(pctVal)} of total</div>
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: `${P.cream}50` }}>{label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24">
                <div className="flex items-center gap-3">
                  <CheckCircle style={{ color: P.green }} size={20} />
                  <span style={{ color: `${P.cream}60` }} className="text-sm">No late cancellations recorded this period</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">{lcInsights.map((item, i) => <InsightCard key={i} {...item} />)}</div>
        </section>

        {/* ── Footer ── */}
        <footer className="pt-6 pb-10" style={{ borderTop: `1px solid ${P.gold}12` }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-bold" style={{ color: `${P.cream}40` }}>Physique57 Executive Intelligence</p>
              <p className="text-xs mt-0.5" style={{ color: `${P.cream}25` }}>{studio.label} · {monthName} {year} · Generated from live Google Sheets data</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: `${health.color}12`, border: `1px solid ${health.color}25` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: health.color }} />
                <span className="text-xs font-semibold" style={{ color: health.color }}>Health Score: {health.score}/100 · {health.grade} · {health.label}</span>
              </div>
              <button onClick={onReset}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2"
                style={{ background: `${P.gold}12`, border: `1px solid ${P.gold}30`, color: P.gold }}>
                <RefreshCw size={11} /> New Report
              </button>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

// ── Root ────────────────────────────────────────────────────────────────────────

const ExecutiveReport: React.FC = () => {
  const [selected, setSelected] = useState<{ studio: typeof STUDIOS[0]; month: string; year: string } | null>(null);

  if (!selected) return <SelectionScreen onSelect={(s, m, y) => setSelected({ studio: s, month: m, year: y })} />;
  return <Report studio={selected.studio} month={selected.month} year={selected.year} onReset={() => setSelected(null)} />;
};

export default ExecutiveReport;
