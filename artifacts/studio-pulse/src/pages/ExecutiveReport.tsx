import React, { useState, useMemo, useEffect, useRef } from 'react';
import '@/styles/executive-report.css';
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
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, ChevronDown, AlertTriangle, CheckCircle,
  Zap, RefreshCw, ArrowRight, ArrowUpRight, ArrowDownRight,
  Users, DollarSign, Activity, Target, Clock, Star, Flame,
  BarChart2, Shield, Award, Percent, Sun, Moon, ArrowLeft
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const STUDIOS = [
  { id: 'kwality', label: 'Kwality House', location: 'Kwality House', area: 'Kemps Corner', city: 'Mumbai', abbr: 'KH' },
  { id: 'supreme', label: 'Supreme HQ', location: 'Supreme HQ', area: 'Bandra', city: 'Mumbai', abbr: 'SQ' },
  { id: 'kenkere', label: 'Kenkere House', location: 'Kenkere House', area: 'Bengaluru', city: 'Bengaluru', abbr: 'KK' },
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

// Keep P palette for Recharts (which needs hex values, not CSS vars)
const P = {
  gold: '#F5C518', goldLight: '#FFD84D',
  navy: '#080E1C', navyCard: '#141414',
  cream: '#ECECEC', creamMuted: '#A8A8A8',
  green: '#4FB97B', greenLight: '#6DCFA0',
  red: '#E5705E', redLight: '#EF9088',
  blue: '#6E8ECB', blueLight: '#9CB5E0',
  purple: '#8B5CF6', purpleLight: '#C4B5FD',
  orange: '#E0A93C', orangeLight: '#ECC368',
  teal: '#14B8A6', tealLight: '#5EEAD4',
  rose: '#F43F5E', roseLight: '#FDA4AF',
  indigo: '#6366F1',
  primary: '#5B7BB5',
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
  if (m.fillRate >= 75) points += 25;
  else if (m.fillRate >= 60) points += 18;
  else if (m.fillRate >= 45) points += 10;
  else points += 3;
  if (m.conversionRate >= 60) points += 20;
  else if (m.conversionRate >= 40) points += 14;
  else if (m.conversionRate >= 25) points += 8;
  else points += 2;
  if (m.retentionRate >= 50) points += 20;
  else if (m.retentionRate >= 35) points += 13;
  else if (m.retentionRate >= 20) points += 7;
  else points += 1;
  const revGrowth = delta(m.currRevenue, m.prevRevenue);
  if (revGrowth >= 10) points += 15;
  else if (revGrowth >= 0) points += 10;
  else if (revGrowth >= -5) points += 5;
  const lcRatio = m.totalSessions > 0 ? (m.lcCount / m.totalSessions) * 100 : 0;
  if (lcRatio < 5) points += 10;
  else if (lcRatio < 10) points += 6;
  else if (lcRatio < 20) points += 3;
  if (m.discountPenetration < 15) points += 10;
  else if (m.discountPenetration < 30) points += 6;
  else if (m.discountPenetration < 50) points += 3;

  const score = Math.min(100, Math.round(points));
  if (score >= 80) return { score, grade: 'A', color: P.green, label: 'Excellent' };
  if (score >= 65) return { score, grade: 'B', color: P.gold, label: 'Good' };
  if (score >= 50) return { score, grade: 'C', color: P.orange, label: 'Needs Attention' };
  return { score, grade: 'D', color: P.red, label: 'At Risk' };
};

// ── Design-system sub-components ──────────────────────────────────────────────

const Badge: React.FC<{ value: number; inverse?: boolean }> = ({ value, inverse = false }) => {
  const isGood = inverse ? value <= 0 : value >= 0;
  const abs = Math.abs(value);
  return (
    <span className={`er-badge ${isGood ? 'good' : 'bad'}`}>
      {isGood ? '+' : '-'}{abs.toFixed(1)}%
    </span>
  );
};

const KpiCard: React.FC<{
  label: string; value: string; sub?: string; tone?: 'good' | 'warn' | 'bad' | 'neutral';
  mom?: number; yoy?: number; baseline?: string; inverse?: boolean;
}> = ({ label, value, sub, tone = 'neutral', mom, yoy, baseline, inverse = false }) => (
  <div className={`er-kpi-card tone-${tone}`}>
    <div className="er-kpi-label">{label}</div>
    <div className="er-kpi-value">{value}</div>
    {sub && <div className="er-kpi-sub">{sub}</div>}
    {(mom !== undefined || yoy !== undefined) && (
      <div className="er-kpi-trends">
        {mom !== undefined && (
          <span className="er-kpi-trend">
            <span className="er-trend-label">MoM</span>
            <Badge value={mom} inverse={inverse} />
          </span>
        )}
        {yoy !== undefined && (
          <span className="er-kpi-trend">
            <span className="er-trend-label">YoY</span>
            <Badge value={yoy} />
          </span>
        )}
      </div>
    )}
    {baseline && <div className="er-kpi-baseline">{baseline}</div>}
  </div>
);

const InsightItem: React.FC<{ num: number; title: string; text: React.ReactNode }> = ({ num, title, text }) => (
  <div className="er-insight-card">
    <div className="er-insight-num">{String(num).padStart(2, '0')}</div>
    <div>
      <div className="er-insight-title">{title}</div>
      <div className="er-insight-text">{text}</div>
    </div>
  </div>
);

const WorkedCard: React.FC<{ worked: boolean; title: string; text: React.ReactNode }> = ({ worked, title, text }) => (
  <div className={`er-worked-card${worked ? '' : ' didnt'}`}>
    <div className="er-worked-icon">{worked ? '✓' : '✗'}</div>
    <div>
      <div className="er-worked-title">{title}</div>
      <div className="er-worked-text">{text}</div>
    </div>
  </div>
);

const ActionCard: React.FC<{ num: number; title: string; text: React.ReactNode; owner?: string; priority?: string; impact?: string }> = ({ num, title, text, owner, priority, impact }) => (
  <div className="er-action-card">
    <div className="er-action-num">{num}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="er-action-title">{title}</div>
      <div className="er-action-text">{text}</div>
      <div className="er-action-meta">
        {owner && <span className="er-meta-pill">Owner: {owner}</span>}
        {priority && <span className="er-meta-pill">Priority: {priority}</span>}
        {impact && <span className="er-meta-pill">Impact: {impact}</span>}
      </div>
    </div>
  </div>
);

const SectionHeader: React.FC<{ eyebrow: string; title: string; deck?: string; anchor?: string }> = ({ eyebrow, title, deck, anchor }) => (
  <div className="er-section-header">
    <div className="er-section-header-left">
      <div className="er-section-eyebrow">{eyebrow}</div>
      <h2 className="er-section-title">{title}</h2>
      {deck && <p className="er-section-deck">{deck}</p>}
    </div>
    {anchor && <div className="er-section-anchor">{anchor}</div>}
  </div>
);

const ChartTooltip = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="er-tooltip" style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: P.gold }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: P.cream }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || p.stroke || p.color }} />
          <span>{p.name}: {prefix}{typeof p.value === 'number' ? (prefix === '₹' ? fmt(p.value) : p.value.toLocaleString('en-IN')) : p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
};

// ── Dropdown ──────────────────────────────────────────────────────────────────

const DD: React.FC<{
  which: 'studio' | 'month' | 'year';
  label: string; display: string;
  open: 'studio' | 'month' | 'year' | null;
  setOpen: React.Dispatch<React.SetStateAction<'studio' | 'month' | 'year' | null>>;
  children: React.ReactNode;
}> = ({ which, label, display, open, setOpen, children }) => (
  <div style={{ position: 'relative' }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, color: P.gold }}>{label}</label>
    <button onClick={() => setOpen(open === which ? null : which)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderRadius: 12, background: display ? 'rgba(245,197,24,0.08)' : '#1C1C1C',
        border: `1.5px solid ${display ? P.gold : 'rgba(245,197,24,0.2)'}`,
        color: display ? P.cream : 'rgba(236,236,236,0.4)', cursor: 'pointer', fontSize: 14,
        fontFamily: 'var(--font-sans, Inter, sans-serif)',
      }}>
      <span style={{ fontWeight: display ? 500 : 400 }}>{display || `Select ${label.toLowerCase()}…`}</span>
      <ChevronDown size={14} style={{ transform: open === which ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: P.gold, flexShrink: 0 }} />
    </button>
    {open === which && (
      <div style={{
        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
        borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
        zIndex: 50, maxHeight: 260, overflowY: 'auto',
        background: '#1C1C1C', border: '1px solid rgba(245,197,24,0.2)',
      }}>
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -120, right: -120, width: 480, height: 480, borderRadius: '50%', background: `radial-gradient(circle, ${P.gold}, transparent 65%)`, opacity: 0.12, filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 520, padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 20, background: 'rgba(245,197,24,0.12)', border: '1px solid rgba(245,197,24,0.3)', color: P.gold }}>
            <Star size={11} /> Executive Intelligence
          </div>
          <div style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: 48, fontWeight: 700, letterSpacing: '-0.03em', color: P.cream, marginBottom: 6 }}>
            PHYSIQUE <span style={{ color: P.gold }}>57</span>
          </div>
          <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgba(236,236,236,0.4)', fontWeight: 500 }}>Studio Performance Report</div>
        </div>

        <div style={{ background: '#141414', border: '1px solid rgba(245,197,24,0.15)', borderRadius: 20, padding: 28, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ marginBottom: 16 }}>
            <DD which="studio" label="Studio Location" display={sel ? `${sel.label} — ${sel.city}` : ''} open={open} setOpen={setOpen}>
              {STUDIOS.map(s => (
                <button key={s.id} onClick={() => { setStudio(s.id); setOpen(null); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid rgba(245,197,24,0.08)', color: studio === s.id ? P.gold : P.cream, cursor: 'pointer', textAlign: 'left' as const }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: studio === s.id ? P.gold : 'rgba(245,197,24,0.3)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>{s.area} · {s.city}</div>
                  </div>
                </button>
              ))}
            </DD>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <DD which="month" label="Month" display={selM?.label || ''} open={open} setOpen={setOpen}>
              {MONTHS.map(m => (
                <button key={m.value} onClick={() => { setMonth(m.value); setOpen(null); }}
                  style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', borderBottom: '1px solid rgba(245,197,24,0.08)', color: month === m.value ? P.gold : P.cream, cursor: 'pointer', textAlign: 'left' as const, fontSize: 14 }}>
                  {m.label}
                </button>
              ))}
            </DD>
            <DD which="year" label="Year" display={year} open={open} setOpen={setOpen}>
              {YEARS.map(y => (
                <button key={y} onClick={() => { setYear(y); setOpen(null); }}
                  style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', borderBottom: '1px solid rgba(245,197,24,0.08)', color: year === y ? P.gold : P.cream, cursor: 'pointer', textAlign: 'left' as const, fontSize: 14 }}>
                  {y}
                </button>
              ))}
            </DD>
          </div>

          <button onClick={() => sel && onSelect(sel, month, year)} disabled={!can}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
              background: can ? `linear-gradient(135deg, ${P.gold}, ${P.goldLight})` : 'rgba(245,197,24,0.1)',
              color: can ? '#0A0A0A' : 'rgba(245,197,24,0.3)',
              cursor: can ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 13,
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: can ? `0 8px 32px rgba(245,197,24,0.25)` : 'none',
              transition: 'all 200ms ease',
            }}>
            <BarChart2 size={16} /> Generate Executive Report <ArrowRight size={16} />
          </button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(236,236,236,0.2)' }}>Powered by live Google Sheets data</p>
      </div>
    </div>
  );
};

// ── Loading ────────────────────────────────────────────────────────────────────

const LoadingScreen: React.FC<{ studio: string; period: string }> = ({ studio, period }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', border: `2px solid rgba(245,197,24,0.3)`, borderTopColor: P.gold, animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
      <div style={{ fontWeight: 700, fontSize: 18, color: P.cream, marginBottom: 8 }}>Analysing {studio}</div>
      <div style={{ fontSize: 13, color: P.creamMuted }}>{period} · Building insights…</div>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
  const [lightMode, setLightMode] = useState(false);

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
    const uniqueMembers = new Set(currS.map(s => s.memberId).filter(Boolean)).size;

    const cats: Record<string, number> = {};
    currS.forEach(s => { const c = s.cleanedCategory || 'Other'; cats[c] = (cats[c] || 0) + ((Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0)); });
    const topCats = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

    const pkgRev = currS.filter(s => /pack|package/i.test(s.cleanedCategory || s.cleanedProduct || '')).reduce((a, s) => a + ((Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0)), 0);
    const memRev = currS.filter(s => /member/i.test(s.cleanedCategory || s.membershipType || '')).reduce((a, s) => a + ((Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0)), 0);
    const dropRev = currS.filter(s => /drop|single|trial/i.test(`${s.paymentItem || ''} ${s.cleanedProduct || ''}`)).reduce((a, s) => a + ((Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0)), 0);

    const revTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(parseInt(year), parseInt(month) - 1 - (5 - i), 1);
      const r = getMonthRange(String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'));
      const rows = sales(r);
      return { label: d.toLocaleDateString('en-US', { month: 'short' }), revenue: netRev(rows), txns: rows.length };
    });

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

    const fmtMap: Record<string, { sessions: number; checkins: number; cap: number }> = { Barre: { sessions: 0, checkins: 0, cap: 0 }, PowerCycle: { sessions: 0, checkins: 0, cap: 0 }, Strength: { sessions: 0, checkins: 0, cap: 0 } };
    currSess.forEach(s => {
      const f = classifyFormat(s.cleanedClass || s.classType || '');
      if (fmtMap[f]) { fmtMap[f].sessions++; fmtMap[f].checkins += Number(s.checkedInCount) || 0; fmtMap[f].cap += Number(s.capacity) || 0; }
    });
    const formats = Object.entries(fmtMap).map(([name, v]) => ({
      name, sessions: v.sessions, checkins: v.checkins,
      fillRate: v.cap > 0 ? (v.checkins / v.cap) * 100 : 0,
      classAvg: v.sessions > 0 ? v.checkins / v.sessions : 0,
    })).filter(f => f.sessions > 0);

    const sessTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(parseInt(year), parseInt(month) - 1 - (5 - i), 1);
      const r = getMonthRange(String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'));
      const rows = sess(r);
      const ci = rows.reduce((a, s) => a + (Number(s.checkedInCount) || 0), 0);
      const cap = rows.reduce((a, s) => a + (Number(s.capacity) || 0), 0);
      return { label: d.toLocaleDateString('en-US', { month: 'short' }), checkins: ci, fillRate: cap > 0 ? parseFloat(((ci / cap) * 100).toFixed(1)) : 0 };
    });

    const dayMap: Record<string, number> = {};
    currSess.forEach(s => { const day = new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }); dayMap[day] = (dayMap[day] || 0) + (Number(s.checkedInCount) || 0); });
    const peakDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const dayData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ day: d, checkins: dayMap[d] || 0 }));

    const trainerKey = `${monthName} ${year}`;
    const prevTrainerKey = `${prevMonthName} ${prevMonthYear}`;
    const currPay = payrollData.filter(p => matchesLocation(p.location || '', loc) && (p.monthYear || '').toLowerCase().includes(trainerKey.toLowerCase()));
    const prevPay = payrollData.filter(p => matchesLocation(p.location || '', loc) && (p.monthYear || '').toLowerCase().includes(prevTrainerKey.toLowerCase()));
    const trainers = currPay.map(p => ({
      name: p.teacherName || 'Unknown',
      sessions: Number(p.totalSessions) || 0, customers: Number(p.totalCustomers) || 0,
      nonEmpty: Number(p.totalNonEmptySessions) || 0, paid: Number(p.totalPaid) || 0,
      classAvg: (Number(p.totalNonEmptySessions) || 0) > 0 ? (Number(p.totalCustomers) || 0) / (Number(p.totalNonEmptySessions) || 0) : 0,
      converted: Number(p.converted) || 0, retained: Number(p.retained) || 0,
    })).sort((a, b) => b.customers - a.customers);
    const topTrainer = trainers[0];
    const bottomTrainer = trainers.length > 1 ? trainers[trainers.length - 1] : null;
    const totalCustomers = currPay.reduce((a, p) => a + (Number(p.totalCustomers) || 0), 0);
    const prevCustomers = prevPay.reduce((a, p) => a + (Number(p.totalCustomers) || 0), 0);

    const currLeads = leadsData.filter(l => inRange(l.createdAt, currRange.start, currRange.end) && matchesLocation(l.center || '', loc));
    const prevLeads = leadsData.filter(l => inRange(l.createdAt, prevRange.start, prevRange.end) && matchesLocation(l.center || '', loc));
    const convertedLeads = currLeads.filter(l => isLeadConverted(l)).length;
    const trialLeads = currLeads.filter(l => { const t = (l.trialStatus || '').toLowerCase(); return t.includes('completed') || t.includes('trial') || t.includes('attended'); }).length;
    const leadCvr = currLeads.length > 0 ? (convertedLeads / currLeads.length) * 100 : 0;
    const leadToTrial = currLeads.length > 0 ? (trialLeads / currLeads.length) * 100 : 0;
    const trialToCvr = trialLeads > 0 ? (convertedLeads / trialLeads) * 100 : 0;
    const srcMap: Record<string, { count: number; converted: number }> = {};
    currLeads.forEach(l => { const src = l.source || 'Unknown'; srcMap[src] = srcMap[src] || { count: 0, converted: 0 }; srcMap[src].count++; if (isLeadConverted(l)) srcMap[src].converted++; });
    const topSources = Object.entries(srcMap).map(([name, v]) => ({ name, count: v.count, cvr: v.count > 0 ? (v.converted / v.count) * 100 : 0 })).sort((a, b) => b.count - a.count).slice(0, 5);

    const currCli = newClientData.filter(c => inRange(c.firstVisitDate, currRange.start, currRange.end) && matchesLocation(c.firstVisitLocation || c.homeLocation || '', loc));
    const prevCli = newClientData.filter(c => inRange(c.firstVisitDate, prevRange.start, prevRange.end) && matchesLocation(c.firstVisitLocation || c.homeLocation || '', loc));
    const converted2 = currCli.filter(c => (c.conversionStatus || '').toLowerCase().includes('converted')).length;
    const retained2 = currCli.filter(c => (c.retentionStatus || '').toLowerCase().includes('retained')).length;
    const convRate = currCli.length > 0 ? (converted2 / currCli.length) * 100 : 0;
    const retRate = currCli.length > 0 ? (retained2 / currCli.length) * 100 : 0;
    const avgLTV = currCli.length > 0 ? currCli.reduce((a, c) => a + (Number(c.ltv) || 0), 0) / currCli.length : 0;
    const prevConvRate = prevCli.length > 0 ? (prevCli.filter(c => (c.conversionStatus || '').toLowerCase().includes('converted')).length / prevCli.length) * 100 : 0;
    const prevRetRate = prevCli.length > 0 ? (prevCli.filter(c => (c.retentionStatus || '').toLowerCase().includes('retained')).length / prevCli.length) * 100 : 0;

    const currExp = expirationsData.filter(e => inRange(e.endDate, currRange.start, currRange.end) && matchesLocation(e.homeLocation || e.primaryLocation || '', loc));
    const prevExp = expirationsData.filter(e => inRange(e.endDate, prevRange.start, prevRange.end) && matchesLocation(e.homeLocation || e.primaryLocation || '', loc));
    const avgDaysActive = currExp.length > 0 ? currExp.reduce((a, e) => a + ((e as any).daysActive || 0), 0) / currExp.length : 0;
    const memBreakdown: Record<string, number> = {};
    currExp.forEach(e => { const m = e.membershipName || 'Unknown'; memBreakdown[m] = (memBreakdown[m] || 0) + 1; });
    const churnByMem = Object.entries(memBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name: name.length > 28 ? name.slice(0, 28) + '…' : name, count }));

    const currLC = lateCancelData.filter(lc => inRange(lc.sessionDateIST || lc.dateIST || '', currRange.start, currRange.end) && matchesLocation(lc.location || '', loc));
    const prevLC = lateCancelData.filter(lc => inRange(lc.sessionDateIST || lc.dateIST || '', prevRange.start, prevRange.end) && matchesLocation(lc.location || '', loc));
    const sameDayLC = currLC.filter(lc => lc.isSameDayCancellation).length;
    const lcPenalties = currLC.filter(lc => (Number(lc.chargedPenaltyAmount) || 0) > 0).length;
    const lcRatio = currSess.length > 0 ? (currLC.length / currSess.length) * 100 : 0;

    return {
      currRevenue: currRev, prevRevenue: prevRev, yoyRevenue: yoyRev,
      currTransactions: currS.length, prevTransactions: prevS.length,
      uniqueMembers, atv, prevAtv, discountPenetration, totalDiscount, discountedTxns,
      topCats, pkgRev, memRev, dropRev, revTrend,
      totalSessions: currSess.length, prevSessions: prevSess.length,
      totalCheckins, prevCheckins, fillRate, prevFillRate,
      classAvg, nonEmptyAvg, prevClassAvg, emptySessions, emptyPct,
      formats, sessTrend, peakDay, dayData,
      trainers: trainers.slice(0, 8), topTrainer, bottomTrainer, totalTrainers: currPay.length,
      totalCustomers, prevCustomers,
      totalLeads: currLeads.length, prevLeads: prevLeads.length, trialLeads, convertedLeads,
      leadCvr, leadToTrial, trialToCvr, topSources,
      newClients: currCli.length, prevNewClients: prevCli.length,
      converted: converted2, retained: retained2, convRate, retRate,
      prevConvRate, prevRetRate, avgLTV,
      churnedMembers: currExp.length, prevChurned: prevExp.length,
      avgDaysActive, churnByMem,
      lcCount: currLC.length, prevLCCount: prevLC.length,
      sameDayLC, lcPenalties, lcRatio,
    };
  }, [salesData, sessionsData, payrollData, newClientData, expirationsData, lateCancelData, leadsData, salesLoading, studio, month, year, currRange, prevRange, yoyRange, monthName, prevMonthName, prevMonthYear]);

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
      totalRevenue: metrics.currRevenue, netRevenue: metrics.currRevenue, vatAmount: 0,
      totalTransactions: metrics.currTransactions, uniqueMembers: metrics.uniqueMembers,
      avgTransactionValue: metrics.atv, avgSpendPerMember: metrics.uniqueMembers > 0 ? metrics.currRevenue / metrics.uniqueMembers : 0,
      totalDiscounts: metrics.totalDiscount, discountRate: metrics.discountPenetration,
      totalSessions: metrics.totalSessions, totalCheckIns: metrics.totalCheckins,
      fillRate: metrics.fillRate,
      powerCycleSessions: metrics.formats.find(f => f.name === 'PowerCycle')?.sessions ?? 0,
      barreSessions: metrics.formats.find(f => f.name === 'Barre')?.sessions ?? 0,
      strengthSessions: metrics.formats.find(f => f.name === 'Strength')?.sessions ?? 0,
      lateCancellations: metrics.lcCount, totalTrainers: metrics.totalTrainers,
      avgClassSize: metrics.classAvg, topTrainerName: metrics.topTrainer?.name ?? 'N/A',
      topTrainerRevenue: 0, newClientsAcquired: metrics.newClients,
      conversionRate: metrics.convRate, retentionRate: metrics.retRate,
      churnRate: metrics.prevChurned > 0 ? ((metrics.churnedMembers - metrics.prevChurned) / metrics.prevChurned) * 100 : 0,
      churnedMembers: metrics.churnedMembers, totalLeads: metrics.totalLeads,
      leadsConverted: metrics.convertedLeads, leadConversionRate: metrics.leadCvr,
      overallScore: h.score, prevRevenue: metrics.prevRevenue,
      revenueChangePct: metrics.prevRevenue > 0 ? ((metrics.currRevenue - metrics.prevRevenue) / metrics.prevRevenue) * 100 : 0,
      prevFillRate: metrics.prevFillRate, prevConversionRate: metrics.prevConvRate,
    };
    geminiService.generateLocationReport(payload, studio.label, `${monthName} ${year}`)
      .then(n => { setAiNarrative(n); setAiLoading(false); })
      .catch(() => setAiLoading(false));
  }, [metrics, studio, month, year, monthName]);

  if (anyLoading || !metrics) return <LoadingScreen studio={studio.label} period={`${monthName} ${year}`} />;

  const m = metrics;
  const health = computeHealthScore({ ...m, conversionRate: m.convRate, retentionRate: m.retRate });

  // ── Revenue insights ────────────────────────────────────────────────────────
  const revGrowth = delta(m.currRevenue, m.prevRevenue);
  const atvGrowth = delta(m.atv, m.prevAtv);
  const fillGrowth = delta(m.fillRate, m.prevFillRate);
  const churnGrowth = delta(m.churnedMembers, m.prevChurned);
  const lcGrowth = delta(m.lcCount, m.prevLCCount);

  // hero KPI tone helper
  const revTone: 'good' | 'warn' | 'bad' = revGrowth >= 5 ? 'good' : revGrowth >= -5 ? 'warn' : 'bad';
  const fillTone: 'good' | 'warn' | 'bad' = m.fillRate >= 65 ? 'good' : m.fillRate >= 45 ? 'warn' : 'bad';
  const convTone: 'good' | 'warn' | 'bad' = m.convRate >= 40 ? 'good' : m.convRate >= 25 ? 'warn' : 'bad';
  const churnTone: 'good' | 'warn' | 'bad' = churnGrowth <= -10 ? 'good' : churnGrowth <= 10 ? 'warn' : 'bad';

  return (
    <div className={`exec-report${lightMode ? ' light' : ''}`}>

      {/* ── Topbar ── */}
      <div className="er-topbar">
        <div className="er-topbar-inner">
          <div className="er-brand">
            <div className="er-brand-mark" />
            <div className="er-brand-text">
              {studio.label} · Studio Pulse
              <small>Performance Report · {monthName} {year}</small>
            </div>
          </div>
          <div className="er-topbar-actions">
            <button className="er-back-btn" onClick={onReset}>
              <ArrowLeft size={13} /> New Report
            </button>
            <button className="er-theme-toggle" onClick={() => setLightMode(l => !l)}>
              {lightMode ? <Moon size={14} /> : <Sun size={14} />}
              {lightMode ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="er-hero">
        <div className="er-container er-hero-content">
          <div className="er-hero-eyebrow">
            <span className="dot">{studio.abbr}</span>
            Senior Management Review · {monthName} {year}
          </div>
          <h1>
            {studio.label} <span className="accent-word">studio performance</span><br />
            for <span className="accent-yellow">{monthName} {year}</span> — revenue, sessions, funnel and retention.
          </h1>
          <p className="er-hero-sub">
            A data-led review of {studio.label}'s commercial and operational performance in {monthName} {year},
            benchmarked against {prevMonthName} {prevMonthYear}. Every section surfaces a business decision
            — class schedule, trainer deployment, discount discipline, membership retention — that management can act on.
          </p>

          <div className="er-hero-meta">
            <div className="er-hero-meta-item">
              <span className="meta-label">Location</span>
              <span className="meta-value">{studio.label}, {studio.area}</span>
            </div>
            <div className="er-hero-meta-item">
              <span className="meta-label">Period</span>
              <span className="meta-value">01 {monthName} {year} — {new Date(parseInt(year), parseInt(month), 0).getDate()} {monthName} {year}</span>
            </div>
            <div className="er-hero-meta-item">
              <span className="meta-label">Reporting basis</span>
              <span className="meta-value">Net Sales · {num(m.totalSessions)} sessions · {num(m.uniqueMembers)} unique buyers</span>
            </div>
            <div className="er-hero-meta-item">
              <span className="meta-label">Comparator</span>
              <span className="meta-value">{prevMonthName} {prevMonthYear} · YoY</span>
            </div>
            <div className="er-hero-meta-item">
              <span className="meta-label">Studio Health</span>
              <span className="meta-value" style={{ color: health.color, fontWeight: 700 }}>{health.grade} — {health.label} ({health.score}/100)</span>
            </div>
          </div>

          <div className="er-kpi-grid">
            <KpiCard
              label="Net Revenue" value={fmt(m.currRevenue)}
              sub={`Prev ${fmt(m.prevRevenue)}`}
              tone={revTone}
              mom={revGrowth} yoy={m.yoyRevenue > 0 ? delta(m.currRevenue, m.yoyRevenue) : undefined}
              baseline={m.prevRevenue > 0 ? `${revGrowth >= 0 ? '+' : ''}${revGrowth.toFixed(1)}% vs ${prevMonthName}` : undefined}
            />
            <KpiCard
              label="Visits" value={num(m.totalCheckins)}
              sub={`Across ${num(m.totalSessions)} sessions`}
              tone={fillTone}
              mom={delta(m.totalCheckins, m.prevCheckins)}
            />
            <KpiCard
              label="Fill Rate" value={pct(m.fillRate)}
              sub={`${pct(m.prevFillRate)} prior month`}
              tone={fillTone}
              mom={fillGrowth}
              baseline={`Class avg ${m.classAvg.toFixed(1)} · ${num(m.totalSessions)} sessions`}
            />
            <KpiCard
              label="Transactions" value={num(m.currTransactions)}
              sub={`ATV ${fmt(m.atv)}`}
              tone="neutral"
              mom={delta(m.currTransactions, m.prevTransactions)}
            />
            <KpiCard
              label="Conv. Rate" value={pct(m.convRate)}
              sub={`${num(m.converted)} of ${num(m.newClients)} new clients`}
              tone={convTone}
              mom={delta(m.convRate, m.prevConvRate)}
            />
            <KpiCard
              label="Lapsed" value={num(m.churnedMembers)}
              sub={`${num(m.prevChurned)} prior month`}
              tone={churnTone}
              mom={churnGrowth} inverse
            />
          </div>
        </div>
      </section>

      {/* ── Sections ── */}
      <main>

        {/* 01 · Executive Summary */}
        <section className="er-section" id="exec-summary">
          <div className="er-container">
            <SectionHeader
              eyebrow="01 · Executive Summary"
              title="One-page view of the studio's health, what worked, what didn't, and the top actions for next month."
              deck={aiLoading ? 'Generating AI narrative…' : aiNarrative?.summary || `${monthName} ${year}: ${fmt(m.currRevenue)} net revenue · ${pct(m.fillRate)} fill rate · ${pct(m.convRate)} conversion · ${num(m.churnedMembers)} lapsed members.`}
              anchor="Section 01 / 07"
            />

            {/* Health score */}
            <div className="er-callout">
              <strong>Studio Health Score: {health.grade} ({health.score}/100) — {health.label}.</strong>{' '}
              {health.grade === 'A' && 'The studio is firing on all cylinders. Maintain momentum and push for capacity expansion.'}
              {health.grade === 'B' && 'Solid performance with clear upside. Address the highlighted gaps to break into the top tier.'}
              {health.grade === 'C' && 'The studio needs attention on its key drivers. The actions below are prioritised for maximum impact.'}
              {health.grade === 'D' && 'Structural issues require urgent management intervention. Focus on the top two action items immediately.'}
            </div>

            {/* AI narrative blocks if available */}
            {aiNarrative && (
              <div className="er-split-grid">
                <div className="er-insights-pane">
                  <div className="er-pane-title">Key insights</div>
                  {(aiNarrative.keyInsights || []).slice(0, 5).map((ins: string, i: number) => (
                    <InsightItem key={i} num={i + 1} title={`Insight ${i + 1}`} text={ins} />
                  ))}
                </div>
                <div>
                  {(aiNarrative.recommendations || []).length > 0 && (
                    <>
                      <div className="er-subsection" style={{ marginTop: 0 }}>
                        <h3 className="er-subsection-title">Priority actions</h3>
                      </div>
                      <div className="er-action-grid">
                        {(aiNarrative.recommendations || []).slice(0, 4).map((rec: string, i: number) => (
                          <ActionCard key={i} num={i + 1} title={`Action ${i + 1}`} text={rec} priority={i === 0 ? 'High' : i === 1 ? 'High' : 'Medium'} impact={i < 2 ? 'High' : 'Medium'} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Worked / Didn't Work */}
            <div className="er-subsection">
              <h3 className="er-subsection-title">What worked · What didn't</h3>
              <p className="er-subsection-deck">Data-driven assessment of the studio's operational performance in {monthName} {year}.</p>
            </div>
            <div className="er-worked-grid">
              <WorkedCard
                worked={revGrowth >= 0}
                title={revGrowth >= 0 ? 'Revenue grew MoM' : 'Revenue contracted MoM'}
                text={<>Net revenue {revGrowth >= 0 ? 'increased' : 'fell'} <strong>{Math.abs(revGrowth).toFixed(1)}%</strong> to <strong>{fmt(m.currRevenue)}</strong> vs {fmt(m.prevRevenue)} prior month.</>}
              />
              <WorkedCard
                worked={m.discountPenetration < 25}
                title={m.discountPenetration < 25 ? 'Discount discipline maintained' : 'Discount penetration elevated'}
                text={<><strong>{pct(m.discountPenetration)}</strong> of transactions carried a discount ({fmt(m.totalDiscount)} total). {m.discountPenetration >= 25 ? 'This level erodes margin and may signal deal-dependency.' : 'Most revenue earned at full price — healthy margin profile.'}</>}
              />
              <WorkedCard
                worked={m.fillRate >= 55}
                title={m.fillRate >= 55 ? 'Fill rate at healthy level' : 'Fill rate below target'}
                text={<><strong>{pct(m.fillRate)}</strong> fill rate across {num(m.totalSessions)} sessions ({num(m.totalCheckins)} check-ins). Class average: <strong>{m.classAvg.toFixed(1)}</strong>.</>}
              />
              <WorkedCard
                worked={m.convRate >= 35}
                title={m.convRate >= 35 ? 'Conversion funnel working' : 'Conversion needs work'}
                text={<><strong>{pct(m.convRate)}</strong> new member conversion rate — {num(m.converted)} of {num(m.newClients)} new clients committed to memberships.</>}
              />
              <WorkedCard
                worked={m.lcRatio < 15}
                title={m.lcRatio < 15 ? 'Late cancels under control' : 'Late cancellation rate elevated'}
                text={<><strong>{num(m.lcCount)}</strong> late cancellations ({pct(m.lcRatio)} per session). {m.sameDayLC > 0 ? `${num(m.sameDayLC)} were same-day.` : 'No same-day cancellations recorded.'}</>}
              />
              <WorkedCard
                worked={churnGrowth <= 0}
                title={churnGrowth <= 0 ? 'Churn trending down' : 'Churn trending up'}
                text={<><strong>{num(m.churnedMembers)}</strong> memberships lapsed, {churnGrowth <= 0 ? 'down' : 'up'} <strong>{Math.abs(churnGrowth).toFixed(0)}%</strong> vs prior month ({num(m.prevChurned)}).</>}
              />
            </div>
          </div>
        </section>

        {/* 02 · Revenue */}
        <section className="er-section" id="revenue">
          <div className="er-container">
            <SectionHeader
              eyebrow="02 · Revenue & Sales Performance"
              title="Where the revenue came from, which categories carry margin, and the discount picture."
              deck={`${monthName} ${year} closed at ${fmt(m.currRevenue)} net on ${num(m.currTransactions)} transactions, an ATV of ${fmt(m.atv)}. ${m.topCats.length > 0 ? `Top category: ${m.topCats[0].name} (${pct((m.topCats[0].value / m.currRevenue) * 100)} of revenue).` : ''}`}
              anchor="Section 02 / 07"
            />

            <div className="er-split-grid">
              <div className="er-insights-pane">
                <div className="er-pane-title">Revenue insights</div>
                {revGrowth >= 10 && <InsightItem num={1} title="Strong revenue growth" text={<>Revenue surged <strong>{revGrowth.toFixed(1)}%</strong> MoM to <strong>{fmt(m.currRevenue)}</strong>. Momentum is building.</>} />}
                {revGrowth >= 0 && revGrowth < 10 && <InsightItem num={1} title="Modest positive growth" text={<>Revenue grew <strong>{revGrowth.toFixed(1)}%</strong> MoM to <strong>{fmt(m.currRevenue)}</strong>. Identify which categories drove this to amplify them.</>} />}
                {revGrowth < 0 && <InsightItem num={1} title="Revenue declined MoM" text={<>Revenue fell <strong>{Math.abs(revGrowth).toFixed(1)}%</strong> to <strong>{fmt(m.currRevenue)}</strong> from {fmt(m.prevRevenue)}. YoY comparison: {fmt(m.yoyRevenue)}.</>} />}
                <InsightItem num={2} title="ATV movement" text={<>Average transaction value is <strong>{fmt(m.atv)}</strong> ({atvGrowth >= 0 ? '+' : ''}{atvGrowth.toFixed(1)}% MoM). {atvGrowth > 5 ? 'Members are buying larger packages — upsell is working.' : atvGrowth < -5 ? 'Mix shift toward smaller packages. Review product strategy.' : 'Stable ATV — consistent purchasing behaviour.'}</>} />
                <InsightItem num={3} title="Discount discipline" text={<><strong>{pct(m.discountPenetration)}</strong> discount penetration — {m.discountedTxns} of {m.currTransactions} transactions discounted (total {fmt(m.totalDiscount)} conceded). {m.discountPenetration > 30 ? 'This level risks training members to wait for deals.' : 'Healthy — most revenue earned at full price.'}</>} />
                {m.topCats.length > 1 && <InsightItem num={4} title={`${m.topCats[0].name} leads`} text={<><strong>{m.topCats[0].name}</strong> is the largest revenue category at <strong>{fmt(m.topCats[0].value)}</strong> ({pct((m.topCats[0].value / m.currRevenue) * 100)}). {m.topCats[1].name} second at {fmt(m.topCats[1].value)}.</>} />}
                {m.uniqueMembers > 0 && <InsightItem num={5} title="Buyer concentration" text={<><strong>{num(m.uniqueMembers)}</strong> unique buyers in {monthName}. Avg spend per buyer: <strong>{fmt(m.currRevenue / m.uniqueMembers)}</strong>. Building the repeat-buyer base protects against single-buyer concentration risk.</>} />}
              </div>

              <div className="er-data-pane">
                <div className="er-pane-title">6-Month Revenue Trend</div>
                <div style={{ padding: '8px 8px 16px' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={m.revTrend}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={P.gold} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={P.gold} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(236,236,236,0.06)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: P.creamMuted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'rgba(236,236,236,0.4)' }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={64} />
                      <Tooltip content={(p) => <ChartTooltip {...p} prefix="₹" />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke={P.gold} strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: P.gold, r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {m.topCats.length > 0 && (
                  <>
                    <div className="er-pane-title" style={{ paddingLeft: 16, paddingTop: 8 }}>Revenue by Category</div>
                    <div style={{ padding: '0 16px 16px' }}>
                      <div className="er-table-wrap">
                        <table className="er-data-table">
                          <thead>
                            <tr>
                              <th>Category</th>
                              <th>Revenue</th>
                              <th>Share</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.topCats.map((cat, i) => {
                              const share = m.currRevenue > 0 ? (cat.value / m.currRevenue) * 100 : 0;
                              return (
                                <tr key={i}>
                                  <td className="metric-name">{cat.name}</td>
                                  <td>{fmt(cat.value)}</td>
                                  <td>
                                    <div className="er-share-bar">
                                      <div className="er-share-fill" style={{ width: `${share}%`, maxWidth: 80 }} />
                                      <span>{pct(share)}</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="er-totals-row">
                              <td className="metric-name">Total</td>
                              <td>{fmt(m.currRevenue)}</td>
                              <td>100.0%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 03 · Sessions */}
        <section className="er-section" id="sessions">
          <div className="er-container">
            <SectionHeader
              eyebrow="03 · Class Attendance & Utilisation"
              title="Fill rates, format breakdown, peak day patterns and scheduling opportunities."
              deck={`${num(m.totalCheckins)} visits across ${num(m.totalSessions)} sessions · ${pct(m.fillRate)} overall fill rate · Class average ${m.classAvg.toFixed(1)} (${m.nonEmptyAvg.toFixed(1)} excl. empty).${m.peakDay ? ` Peak day: ${m.peakDay}.` : ''}`}
              anchor="Section 03 / 07"
            />

            <div className="er-split-grid">
              <div className="er-insights-pane">
                <div className="er-pane-title">Attendance insights</div>
                {m.fillRate >= 75 && <InsightItem num={1} title="Fill rate excellent" text={<>Fill rate of <strong>{pct(m.fillRate)}</strong> — classes running at high utilisation. Signal for potential capacity expansion.</>} />}
                {m.fillRate >= 50 && m.fillRate < 75 && <InsightItem num={1} title="Fill rate decent, headroom exists" text={<><strong>{pct(m.fillRate)}</strong> fill rate with capacity available. Targeted marketing on under-attended slots could unlock revenue without added cost.</>} />}
                {m.fillRate < 50 && <InsightItem num={1} title="Fill rate below target" text={<>At <strong>{pct(m.fillRate)}</strong>, too many classes are running under-capacity. Consider rationalising the schedule or repositioning low-traffic slots.</>} />}
                {m.emptyPct > 10 && <InsightItem num={2} title="Empty sessions are a cost leak" text={<><strong>{num(m.emptySessions)}</strong> sessions ({pct(m.emptyPct)}) ran with zero check-ins. Every empty class is a cost with no revenue offset. Audit by time, trainer and day.</>} />}
                {fillGrowth > 0 && <InsightItem num={3} title="Fill rate trend improving" text={<>Fill rate improved <strong>{fillGrowth.toFixed(1)} pp</strong> MoM, from {pct(m.prevFillRate)} to {pct(m.fillRate)}. Consistent improvement trajectory.</>} />}
                {fillGrowth < -5 && <InsightItem num={3} title="Fill rate declining" text={<>Fill rate dropped <strong>{Math.abs(fillGrowth).toFixed(1)} pp</strong> MoM. Cross-reference with late cancellation data — last-minute dropouts may be depressing fill metrics.</>} />}
                {m.formats.length > 1 && (() => {
                  const best = [...m.formats].sort((a, b) => b.fillRate - a.fillRate)[0];
                  const worst = [...m.formats].sort((a, b) => a.fillRate - b.fillRate)[0];
                  return best.name !== worst.name ? (
                    <InsightItem num={4} title="Format gap" text={<><strong>{best.name}</strong> leads at {pct(best.fillRate)} fill rate; <strong>{worst.name}</strong> trails at {pct(worst.fillRate)}. The {worst.name} schedule may need pruning or promotion.</>} />
                  ) : null;
                })()}
                {m.peakDay && <InsightItem num={5} title={`${m.peakDay} is peak day`} text={<>Optimise trainer allocation, front-desk staffing and class capacity for <strong>{m.peakDay}</strong> peak demand. Waitlist data on this day would clarify expansion potential.</>} />}
              </div>

              <div>
                <div className="er-data-pane" style={{ marginBottom: 20 }}>
                  <div className="er-pane-title">6-Month Fill Rate Trend</div>
                  <div style={{ padding: '0 8px 16px' }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={m.sessTrend}>
                        <defs>
                          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={P.blue} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={P.blue} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(236,236,236,0.06)" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: P.creamMuted }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'rgba(236,236,236,0.4)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                        <Tooltip content={(p) => <ChartTooltip {...p} suffix="%" />} />
                        <Area type="monotone" dataKey="fillRate" name="Fill Rate" stroke={P.blue} strokeWidth={2.5} fill="url(#fillGrad)" dot={{ fill: P.blue, r: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="er-data-pane">
                  <div className="er-pane-title">Check-ins by Day of Week</div>
                  <div style={{ padding: '0 8px 16px' }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={m.dayData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(236,236,236,0.06)" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: P.creamMuted }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'rgba(236,236,236,0.4)' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="checkins" name="Check-ins" radius={[4, 4, 0, 0]}>
                          {m.dayData.map((d, i) => <Cell key={i} fill={d.day === m.peakDay ? P.gold : P.primary} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Format breakdown table */}
            {m.formats.length > 0 && (
              <>
                <div className="er-subsection">
                  <h3 className="er-subsection-title">Format breakdown</h3>
                </div>
                <div className="er-data-pane">
                  <div className="er-table-wrap">
                    <table className="er-data-table">
                      <thead>
                        <tr>
                          <th>Format</th>
                          <th>Sessions</th>
                          <th>Check-ins</th>
                          <th>Fill Rate</th>
                          <th>Class Avg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.formats.map((f, i) => (
                          <tr key={i}>
                            <td className="metric-name">{f.name}</td>
                            <td>{num(f.sessions)}</td>
                            <td>{num(f.checkins)}</td>
                            <td className={f.fillRate >= 65 ? 'er-fill-high' : f.fillRate >= 45 ? 'er-fill-mid' : 'er-fill-low'}>{pct(f.fillRate)}</td>
                            <td>{f.classAvg.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 04 · Lead Funnel */}
        <section className="er-section" id="funnel">
          <div className="er-container">
            <SectionHeader
              eyebrow="04 · Lead Funnel & Acquisition"
              title="Leads, trials, conversion and retention — the full pipeline from inquiry to committed member."
              deck={`${num(m.totalLeads)} leads received · ${pct(m.leadToTrial)} lead-to-trial · ${pct(m.convRate)} new-client conversion · ${pct(m.retRate)} retention.`}
              anchor="Section 04 / 07"
            />

            <div className="er-funnel-stages">
              <div className="er-funnel-stage">
                <div className="er-funnel-num">{num(m.totalLeads)}</div>
                <div className="er-funnel-stage-label">Leads</div>
                <div className="er-funnel-stage-sub">Top of funnel</div>
              </div>
              <div className="er-funnel-stage">
                <div className="er-funnel-num">{num(m.trialLeads)}</div>
                <div className="er-funnel-stage-label">Trialists</div>
                <div className="er-funnel-stage-sub">{m.totalLeads > 0 ? pct(m.leadToTrial) : '—'} of leads</div>
              </div>
              <div className="er-funnel-stage">
                <div className="er-funnel-num">{num(m.newClients)}</div>
                <div className="er-funnel-stage-label">New Clients</div>
                <div className="er-funnel-stage-sub">First visits this month</div>
              </div>
              <div className="er-funnel-stage">
                <div className={`er-funnel-num${m.convRate >= 35 ? ' conv' : ''}`}>{num(m.converted)}</div>
                <div className="er-funnel-stage-label">Converted</div>
                <div className="er-funnel-stage-sub">{pct(m.convRate)} rate · avg LTV {fmt(m.avgLTV)}</div>
              </div>
            </div>

            <div className="er-split-grid">
              <div className="er-insights-pane">
                <div className="er-pane-title">Funnel insights</div>
                {m.totalLeads > 0 && (
                  m.leadToTrial < 30
                    ? <InsightItem num={1} title="Lead→Trial drop is the biggest gap" text={<>Only <strong>{pct(m.leadToTrial)}</strong> of leads ({num(m.trialLeads)} of {num(m.totalLeads)}) completed a trial. The biggest funnel loss is at the top — outreach quality or follow-up speed needs attention.</>} />
                    : <InsightItem num={1} title="Strong lead-to-trial conversion" text={<><strong>{pct(m.leadToTrial)}</strong> lead-to-trial rate — {num(m.trialLeads)} of {num(m.totalLeads)} leads showed up for a session. Above-average pipeline qualification.</>} />
                )}
                {m.convRate < 30
                  ? <InsightItem num={2} title="Conversion below benchmark" text={<><strong>{pct(m.convRate)}</strong> conversion (benchmark: 40%+). At avg LTV {fmt(m.avgLTV)}, each unconverted trialist is a missed <strong>{fmt(m.avgLTV)}</strong> revenue opportunity.</>} />
                  : <InsightItem num={2} title="Conversion is working" text={<><strong>{pct(m.convRate)}</strong> new-client conversion — {num(m.converted)} of {num(m.newClients)} committed to memberships. Onboarding experience and sales follow-through appear effective.</>}
                />}
                {m.retRate < 25 && <InsightItem num={3} title="Post-conversion retention needs work" text={<><strong>{pct(m.retRate)}</strong> retention after conversion. Members are converting but not staying. Focus on the critical 30–60 day post-purchase window with structured engagement.</>} />}
                {m.retRate >= 40 && <InsightItem num={3} title="Retention is strong" text={<><strong>{pct(m.retRate)}</strong> retention — converted members are staying and building habits. This is the foundation of recurring revenue.</>} />}
                {m.topSources.length > 0 && (() => {
                  const topSrc = m.topSources[0];
                  const highCvr = [...m.topSources].sort((a, b) => b.cvr - a.cvr)[0];
                  return (
                    <InsightItem num={4} title={`Top lead source: ${topSrc.name}`} text={<><strong>{topSrc.name}</strong> drives {num(topSrc.count)} leads ({pct(topSrc.cvr)} cvr). {highCvr.name !== topSrc.name ? <>Highest-quality source: <strong>{highCvr.name}</strong> at {pct(highCvr.cvr)} conversion.</> : 'Also the highest-converting source — double down on it.'}</>} />
                  );
                })()}
              </div>

              {m.topSources.length > 0 && (
                <div className="er-data-pane">
                  <div className="er-pane-title">Lead Source Performance</div>
                  <div className="er-table-wrap">
                    <table className="er-data-table">
                      <thead>
                        <tr>
                          <th>Source</th>
                          <th>Leads</th>
                          <th>Converted</th>
                          <th>CVR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.topSources.map((src, i) => (
                          <tr key={i}>
                            <td className="metric-name">{src.name}</td>
                            <td>{num(src.count)}</td>
                            <td>{num(Math.round(src.count * src.cvr / 100))}</td>
                            <td className={src.cvr >= 40 ? 'er-fill-high' : src.cvr >= 20 ? 'er-fill-mid' : 'er-fill-low'}>{pct(src.cvr)}</td>
                          </tr>
                        ))}
                        <tr className="er-totals-row">
                          <td className="metric-name">Total</td>
                          <td>{num(m.totalLeads)}</td>
                          <td>{num(m.convertedLeads)}</td>
                          <td>{pct(m.leadCvr)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 05 · Churn */}
        <section className="er-section" id="churn">
          <div className="er-container">
            <SectionHeader
              eyebrow="05 · Lapsed Members & Churn"
              title="Membership expirations, patterns, and the revenue risk in the lapsed book."
              deck={`${num(m.churnedMembers)} memberships lapsed in ${monthName} ${year} — ${churnGrowth > 0 ? 'up' : 'down'} ${Math.abs(churnGrowth).toFixed(0)}% from ${num(m.prevChurned)} in ${prevMonthName}.${m.avgDaysActive > 0 ? ` Average ${m.avgDaysActive.toFixed(0)} days active before lapsing.` : ''}`}
              anchor="Section 05 / 07"
            />

            <div className="er-split-grid">
              <div className="er-insights-pane">
                <div className="er-pane-title">Churn insights</div>
                {m.churnedMembers === 0
                  ? <InsightItem num={1} title="No lapsed members" text="No membership expirations recorded this period — excellent retention or no memberships reaching end-of-term." />
                  : <>
                    {churnGrowth > 20 && <InsightItem num={1} title="Churn spiked" text={<>Lapsed members surged <strong>{churnGrowth.toFixed(0)}%</strong> MoM — {num(m.churnedMembers)} vs {num(m.prevChurned)} last month. Check if a specific membership type or batch renewal is driving this.</>} />}
                    {churnGrowth <= 0 && <InsightItem num={1} title="Churn improving" text={<>Lapsed members fell <strong>{Math.abs(churnGrowth).toFixed(0)}%</strong> MoM to {num(m.churnedMembers)} — retention actions appear to be working.</>} />}
                    {churnGrowth > 0 && churnGrowth <= 20 && <InsightItem num={1} title="Churn edging up" text={<><strong>{num(m.churnedMembers)}</strong> memberships lapsed, up {churnGrowth.toFixed(0)}% from last month. Watch for sequential increases — they signal structural weakness.</>} />}
                    {m.avgDaysActive > 0 && m.avgDaysActive < 45 && <InsightItem num={2} title="Early dropout pattern" text={<>Lapsing members active only <strong>{m.avgDaysActive.toFixed(0)} days</strong> on average — this is early-stage dropout, not natural membership end. The critical intervention window is weeks 1–6 post-purchase.</>} />}
                    {m.avgDaysActive >= 180 && <InsightItem num={2} title="Long-tenured lapsers" text={<>Lapsing members had <strong>{m.avgDaysActive.toFixed(0)} days</strong> of activity. Long-term members — re-engagement campaigns are worth the effort given their demonstrated commitment.</>} />}
                    {m.churnByMem.length > 0 && <InsightItem num={3} title={`"${m.churnByMem[0].name}" tops lapse list`} text={<><strong>{m.churnByMem[0].name}</strong> had {num(m.churnByMem[0].count)} expirations — the most of any membership type. Consider a targeted re-enrolment campaign for this segment.</>} />}
                  </>
                }
              </div>

              {m.churnByMem.length > 0 && (
                <div className="er-data-pane">
                  <div className="er-pane-title">Lapsed by Membership Type</div>
                  <div className="er-table-wrap">
                    <table className="er-data-table">
                      <thead>
                        <tr>
                          <th>Membership</th>
                          <th>Lapsed</th>
                          <th>Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.churnByMem.map((mem, i) => {
                          const share = m.churnedMembers > 0 ? (mem.count / m.churnedMembers) * 100 : 0;
                          return (
                            <tr key={i}>
                              <td className="metric-name">{mem.name}</td>
                              <td>{num(mem.count)}</td>
                              <td>
                                <div className="er-share-bar">
                                  <div className="er-share-fill" style={{ width: `${share}%`, maxWidth: 80 }} />
                                  <span>{pct(share)}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="er-totals-row">
                          <td className="metric-name">Total lapsed</td>
                          <td>{num(m.churnedMembers)}</td>
                          <td>100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 06 · Late Cancels */}
        <section className="er-section" id="late-cancels">
          <div className="er-container">
            <SectionHeader
              eyebrow="06 · Late Cancellations"
              title="Last-minute dropouts block genuine demand and inflate perceived capacity — here's where the problem sits."
              deck={`${num(m.lcCount)} late cancellations in ${monthName} ${year} (${pct(m.lcRatio)} per session). ${m.sameDayLC > 0 ? `${num(m.sameDayLC)} were same-day.` : ''} ${m.lcPenalties > 0 ? `${num(m.lcPenalties)} penalties charged.` : 'No penalties charged.'}`}
              anchor="Section 06 / 07"
            />

            <div className="er-worked-grid" style={{ marginBottom: 24 }}>
              <WorkedCard
                worked={m.lcCount === 0 || m.lcRatio < 10}
                title={m.lcCount === 0 ? 'Zero late cancellations' : m.lcRatio < 10 ? 'Late cancel rate manageable' : 'Late cancel rate elevated'}
                text={<><strong>{num(m.lcCount)}</strong> late cancellations — {pct(m.lcRatio)} per session. {m.lcCount === 0 ? 'Exceptional member commitment.' : m.lcRatio > 20 ? 'Spots booked are not being filled, blocking genuine demand.' : 'Monitor for trend changes.'}</>}
              />
              <WorkedCard
                worked={lcGrowth <= 0}
                title={lcGrowth <= 0 ? 'Late cancels trending down' : 'Late cancels trending up'}
                text={<>Late cancels {lcGrowth <= 0 ? 'fell' : 'rose'} <strong>{Math.abs(lcGrowth).toFixed(0)}%</strong> MoM ({num(m.prevLCCount)} → {num(m.lcCount)}). {m.sameDayLC > 0 ? `${num(m.sameDayLC)} same-day cancellations are the most disruptive.` : 'No same-day cancellations recorded.'}</>}
              />
              <WorkedCard
                worked={m.lcPenalties > 0 || m.lcCount === 0}
                title={m.lcPenalties > 0 ? 'Penalty enforcement in place' : 'Penalties not being charged'}
                text={<>{m.lcPenalties > 0 ? <><strong>{num(m.lcPenalties)}</strong> penalties charged of {num(m.lcCount)} late cancels — enforcement is happening. Consistent application deters repeat behaviour.</> : <>Zero penalties charged despite {num(m.lcCount)} late cancels. Enforcing the policy would reduce repeat offenders and protect class spots.</>}</>}
              />
              <WorkedCard
                worked={m.lcRatio < 15}
                title="Impact on schedule integrity"
                text={<>At {pct(m.lcRatio)} per session, late cancels {m.lcRatio < 15 ? 'are not materially impacting' : 'are materially disrupting'} schedule integrity. {m.lcRatio >= 15 ? 'A waitlist-to-booking flow would recover most of these spots.' : 'Schedule integrity is intact.'}</>}
              />
            </div>

            {m.lcCount > 0 && (
              <div className="er-callout">
                <strong>Action:</strong> {m.lcPenalties === 0 ? 'Begin enforcing the late-cancellation policy consistently. Even a soft notification (no fee, but logged count) creates behavioural change. ' : ''}
                {m.sameDayLC > 0 ? `Same-day cancellations (${num(m.sameDayLC)}) are the highest-impact category — prioritise policy enforcement for these. ` : ''}
                Target: reduce late cancels by 30% over 60 days by combining enforcement with a waitlist feature.
              </div>
            )}
          </div>
        </section>

        {/* 07 · Trainers */}
        <section className="er-section" id="trainers">
          <div className="er-container">
            <SectionHeader
              eyebrow="07 · Trainer Performance"
              title="Utilisation, class averages, conversion attribution and coaching opportunities."
              deck={`${num(m.totalTrainers)} active trainers · ${num(m.totalCustomers)} customers served.${m.topTrainer ? ` Top: ${m.topTrainer.name} (${num(m.topTrainer.customers)} customers, ${m.topTrainer.classAvg.toFixed(1)} avg class).` : ''}`}
              anchor="Section 07 / 07"
            />

            {m.trainers.length > 0 ? (
              <>
                <div className="er-trainer-grid">
                  {m.trainers.map((t, i) => {
                    const isTop = i === 0;
                    const avgColor = t.classAvg >= 12 ? P.green : t.classAvg >= 7 ? P.gold : P.red;
                    return (
                      <div key={t.name} className={`er-trainer-card${isTop ? ' top' : ''}`}>
                        <div className="er-trainer-avatar">{t.name.charAt(0)}</div>
                        <div className="er-trainer-name">{t.name}</div>
                        <div className="er-trainer-sub">{num(t.sessions)} sessions</div>
                        <div className="er-trainer-stats">
                          <div className="er-stat-cell">
                            <div className="er-stat-val">{num(t.customers)}</div>
                            <div className="er-stat-lbl">Clients</div>
                          </div>
                          <div className="er-stat-cell">
                            <div className="er-stat-val" style={{ color: avgColor }}>{t.classAvg.toFixed(1)}</div>
                            <div className="er-stat-lbl">Avg class</div>
                          </div>
                          <div className="er-stat-cell">
                            <div className="er-stat-val" style={{ color: t.converted > 0 ? P.green : P.creamMuted }}>{num(t.converted)}</div>
                            <div className="er-stat-lbl">Converted</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="er-data-pane">
                  <div className="er-pane-title" style={{ padding: '16px 16px 8px' }}>Trainer Summary Table · {monthName} {year}</div>
                  <div className="er-table-wrap">
                    <table className="er-data-table">
                      <thead>
                        <tr>
                          <th>Trainer</th>
                          <th>Sessions</th>
                          <th>Customers</th>
                          <th>Class Avg</th>
                          <th>Converted</th>
                          <th>Retained</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.trainers.map((t, i) => (
                          <tr key={i}>
                            <td className="metric-name">{t.name}</td>
                            <td>{num(t.sessions)}</td>
                            <td>{num(t.customers)}</td>
                            <td className={t.classAvg >= 12 ? 'er-fill-high' : t.classAvg >= 7 ? 'er-fill-mid' : 'er-fill-low'}>{t.classAvg.toFixed(1)}</td>
                            <td>{num(t.converted)}</td>
                            <td>{num(t.retained)}</td>
                          </tr>
                        ))}
                        <tr className="er-totals-row">
                          <td className="metric-name">Total / Avg</td>
                          <td>{num(m.trainers.reduce((a, t) => a + t.sessions, 0))}</td>
                          <td>{num(m.totalCustomers)}</td>
                          <td>{m.trainers.length > 0 ? (m.trainers.reduce((a, t) => a + t.classAvg, 0) / m.trainers.length).toFixed(1) : '—'}</td>
                          <td>{num(m.trainers.reduce((a, t) => a + t.converted, 0))}</td>
                          <td>{num(m.trainers.reduce((a, t) => a + t.retained, 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="er-callout">
                No payroll data found for {monthName} {year}. Ensure payroll records use the "{monthName} {year}" format in the Month/Year column.
              </div>
            )}
          </div>
        </section>

        {/* Conclusion */}
        <section className="er-section" id="conclusion">
          <div className="er-container">
            <SectionHeader
              eyebrow="Conclusion · Senior Management Summary"
              title="Data-backed conclusions for the management team."
            />
            <div className="er-conclusions-block">
              <div className="er-conclusion-item">
                <div className="er-conclusion-num">01</div>
                <div className="er-conclusion-text">
                  <strong>Revenue health: {health.label}.</strong>{' '}
                  {fmt(m.currRevenue)} net revenue on {num(m.currTransactions)} transactions ({revGrowth >= 0 ? '+' : ''}{revGrowth.toFixed(1)}% MoM). ATV of {fmt(m.atv)} reflects the current product and discount mix.
                </div>
              </div>
              <div className="er-conclusion-item">
                <div className="er-conclusion-num">02</div>
                <div className="er-conclusion-text">
                  <strong>Discount discipline is the #1 P&L lever.</strong>{' '}
                  At {pct(m.discountPenetration)} discount penetration ({fmt(m.totalDiscount)} conceded), reducing discounting to below 15% would materially improve net revenue without any volume change.
                </div>
              </div>
              <div className="er-conclusion-item">
                <div className="er-conclusion-num">03</div>
                <div className="er-conclusion-text">
                  <strong>The class schedule {m.fillRate >= 55 ? 'is working' : 'needs rationalisation'}.</strong>{' '}
                  {pct(m.fillRate)} fill rate across {num(m.totalSessions)} sessions. {m.emptySessions > 0 ? `${num(m.emptySessions)} empty sessions (${pct(m.emptyPct)}) represent pure cost.` : 'No empty sessions — strong utilisation.'} {m.peakDay ? `Peak demand on ${m.peakDay}.` : ''}
                </div>
              </div>
              <div className="er-conclusion-item">
                <div className="er-conclusion-num">04</div>
                <div className="er-conclusion-text">
                  <strong>The conversion funnel {m.convRate >= 35 ? 'is healthy' : 'needs intervention'}.</strong>{' '}
                  {pct(m.convRate)} new-member conversion rate ({num(m.converted)} of {num(m.newClients)} new clients). {m.avgLTV > 0 ? `At avg LTV ${fmt(m.avgLTV)}, each unconverted trialist is a missed opportunity.` : ''}
                </div>
              </div>
              <div className="er-conclusion-item">
                <div className="er-conclusion-num">05</div>
                <div className="er-conclusion-text">
                  <strong>Retention {churnGrowth <= 0 ? 'is improving' : 'needs attention'}.</strong>{' '}
                  {num(m.churnedMembers)} memberships lapsed ({churnGrowth > 0 ? '+' : ''}{churnGrowth.toFixed(0)}% MoM). {m.churnByMem.length > 0 ? `"${m.churnByMem[0].name}" is the most vulnerable membership type.` : ''} A structured re-engagement campaign for lapsed members represents the highest-ROI retention action.
                </div>
              </div>
              <div className="er-conclusion-item">
                <div className="er-conclusion-num">06</div>
                <div className="er-conclusion-text">
                  <strong>Trainer utilisation is {m.totalTrainers > 0 ? `spread across ${num(m.totalTrainers)} active trainers` : 'not yet data-matched'}.</strong>{' '}
                  {m.topTrainer ? `${m.topTrainer.name} leads with ${num(m.topTrainer.customers)} customers and a ${m.topTrainer.classAvg.toFixed(1)} class average. ` : ''}
                  {m.trainers.filter(t => t.converted === 0).length > 0 ? `${m.trainers.filter(t => t.converted === 0).length} trainer(s) carried 0% conversion — a coaching opportunity.` : 'All trainers contributed to conversion.'}
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="er-footer">
        <div className="er-container">
          <div className="er-footer-inner">
            <div>
              <div className="er-footer-brand-text">Studio Pulse · {studio.label}</div>
              <div className="er-footer-text">
                Executive Performance Report · {monthName} {year}<br />
                Generated from live Google Sheets data. For senior management use.
              </div>
            </div>
            <div>
              <div className="er-footer-label">Report sections</div>
              <div className="er-footer-links">
                {['Executive Summary', 'Revenue & Sales', 'Attendance', 'Lead Funnel', 'Churn', 'Late Cancels', 'Trainers'].map((s, i) => (
                  <span key={i}>{String(i + 1).padStart(2, '0')} · {s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

// ── Page root ──────────────────────────────────────────────────────────────────

const ExecutiveReport: React.FC = () => {
  const [selected, setSelected] = useState<{ studio: typeof STUDIOS[0]; month: string; year: string } | null>(null);
  return selected
    ? <Report studio={selected.studio} month={selected.month} year={selected.year} onReset={() => setSelected(null)} />
    : <SelectionScreen onSelect={(studio, month, year) => setSelected({ studio, month, year })} />;
};

export default ExecutiveReport;
