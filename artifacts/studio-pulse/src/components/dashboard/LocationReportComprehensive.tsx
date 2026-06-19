import React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AutoCloseFilterSection } from './AutoCloseFilterSection';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useLocationReportData } from '@/hooks/useLocationReportData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import type { LocationReportNarrative } from '@/services/geminiService';

interface LocationReportComprehensiveProps {
  onReady?: () => void;
}

class ReportErrorBoundary extends React.Component<
  { children: React.ReactNode; onClose?: () => void },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onClose?: () => void }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Report] Render error:', error);
    console.error('[Report] Component stack:', info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#fff', minHeight: '100vh' }}>
          <button
            onClick={this.props.onClose}
            style={{ marginBottom: 24, padding: '8px 16px', background: '#0F2C5E', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            ← Back to Dashboard
          </button>
          <h2 style={{ color: '#C0392B', marginBottom: 12 }}>Report encountered an error</h2>
          <pre style={{ background: '#FBE7E4', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', color: '#333', fontSize: 13 }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 16, padding: '8px 16px', background: '#1F8A4C', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const reportCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');

.p57r {
  --bg:#FFFFFF; --bg-soft:#F4F6FA; --bg-card:#FFFFFF; --bg-card-hover:#FAFBFD;
  --bg-inset:#EEF1F6; --border:#E1E5EE; --border-strong:#C8CFDD;
  --text:#0B1A33; --text-muted:#5A6478; --text-subtle:#8C93A3;
  --primary:#0F2C5E; --primary-2:#1E4A8F; --primary-3:#2E6BD3; --primary-soft:#E6ECF7;
  --accent:#F5C518; --accent-2:#FFD84D; --accent-soft:#FFF7D6;
  --good:#1F8A4C; --good-soft:#E1F4E9;
  --warn:#B87900; --warn-soft:#FFF1D1;
  --bad:#C0392B; --bad-soft:#FBE7E4;
  --shadow-sm:0 1px 2px rgba(15,44,94,.04),0 1px 1px rgba(15,44,94,.03);
  --shadow:0 4px 12px rgba(15,44,94,.06),0 2px 4px rgba(15,44,94,.04);
  --shadow-lg:0 12px 32px rgba(15,44,94,.08),0 4px 12px rgba(15,44,94,.05);
  --radius-sm:6px; --radius:10px; --radius-lg:16px;
  --sans:'Inter','Helvetica Neue',Helvetica,Arial,system-ui,sans-serif;
  --serif:'Source Serif 4',Georgia,'Times New Roman',serif;
  --mono:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
  background:var(--bg); color:var(--text);
  font-family:var(--sans); font-size:14px; line-height:1.55;
  -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
  font-feature-settings:'ss01','cv11','tnum';
  min-height:100vh;
}
.p57r *{box-sizing:border-box}
.p57r a{color:var(--primary-3);text-decoration:none}
.p57r a:hover{text-decoration:underline}
.p57r .cont{max-width:1340px;margin:0 auto;padding:0 32px}

/* Sticky filter bar */
.p57r .filter-bar{
  position:sticky;top:0;z-index:40;
  background:rgba(255,255,255,.92);backdrop-filter:blur(14px);
  border-bottom:1px solid var(--border);
  padding:10px 32px;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
}
.p57r .filter-bar-inner{max-width:1340px;margin:0 auto;width:100%;display:flex;align-items:center;gap:16px}

/* Hero */
.p57r .hero{
  position:relative;padding:56px 0 44px;overflow:hidden;
  border-bottom:1px solid var(--border);
}
.p57r .hero::before{
  content:"";position:absolute;top:-120px;right:-80px;
  width:440px;height:440px;
  background:radial-gradient(circle,var(--accent) 0%,transparent 65%);
  opacity:.14;filter:blur(20px);pointer-events:none;
}
.p57r .hero::after{
  content:"";position:absolute;bottom:-180px;left:-80px;
  width:480px;height:480px;
  background:radial-gradient(circle,var(--primary-3) 0%,transparent 60%);
  opacity:.10;filter:blur(30px);pointer-events:none;
}
.p57r .hero-inner{position:relative;z-index:1}
.p57r .hero-eyebrow{
  display:inline-flex;align-items:center;gap:10px;
  padding:6px 14px 6px 6px;background:var(--bg-card);border:1px solid var(--border);
  border-radius:999px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;
  color:var(--text-muted);font-weight:600;margin-bottom:24px;box-shadow:var(--shadow-sm);
}
.p57r .hero-eyebrow .dot{
  width:22px;height:22px;background:var(--primary);color:white;
  border-radius:50%;display:inline-flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:700;
}
.p57r .hero h1{
  font-family:var(--serif);
  font-size:clamp(36px,4.8vw,62px);
  line-height:1.04;letter-spacing:-.025em;
  margin:0 0 16px;font-weight:600;color:var(--text);max-width:920px;
}
.p57r .hero h1 .acc-blue{color:var(--primary)}
.p57r .hero h1 .acc-yellow{
  background:linear-gradient(120deg,var(--accent) 0%,var(--accent-2) 100%);
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;color:transparent;
}
.p57r .hero-sub{font-size:16px;color:var(--text-muted);max-width:720px;line-height:1.6;margin:0 0 32px}
.p57r .hero-meta{
  display:flex;flex-wrap:wrap;gap:24px 40px;
  margin-bottom:36px;padding:20px 0;
  border-top:1px solid var(--border);border-bottom:1px solid var(--border);
}
.p57r .hero-meta-item .label{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-subtle);font-weight:600;margin-bottom:5px}
.p57r .hero-meta-item .value{font-size:14px;color:var(--text);font-weight:500}

/* KPI cards grid */
.p57r .kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
@media(max-width:1100px){.p57r .kpi-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:640px){.p57r .kpi-grid{grid-template-columns:repeat(2,1fr)}}
.p57r .kpi-card{
  position:relative;background:var(--bg-card);border:1px solid var(--border);
  border-radius:var(--radius-lg);padding:16px 16px 14px;overflow:hidden;
  transition:all 180ms ease;
}
.p57r .kpi-card:hover{transform:translateY(-2px);border-color:var(--border-strong);box-shadow:var(--shadow)}
.p57r .kpi-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--primary)}
.p57r .kpi-card.tone-good::before{background:var(--good)}
.p57r .kpi-card.tone-warn::before{background:var(--warn)}
.p57r .kpi-card.tone-bad::before{background:var(--bad)}
.p57r .kpi-label{font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);font-weight:600;margin-bottom:7px}
.p57r .kpi-value{font-family:var(--serif);font-size:26px;font-weight:600;letter-spacing:-.02em;color:var(--text);line-height:1.1;margin-bottom:3px}
.p57r .kpi-sub{font-size:11px;color:var(--text-subtle);margin-bottom:10px}
.p57r .kpi-trends{display:flex;gap:8px;font-size:11px;flex-wrap:wrap}
.p57r .kpi-trend{display:inline-flex;align-items:center;gap:4px}
.p57r .trend-label{color:var(--text-subtle);font-size:10px;text-transform:uppercase;letter-spacing:.05em;font-weight:600}

/* Badges */
.p57r .badge{display:inline-flex;align-items:center;padding:1px 7px;border-radius:4px;font-size:10.5px;font-weight:600;font-family:var(--mono);letter-spacing:-.01em}
.p57r .badge.good{background:var(--good-soft);color:var(--good)}
.p57r .badge.bad{background:var(--bad-soft);color:var(--bad)}
.p57r .badge.warn{background:var(--warn-soft);color:var(--warn)}
.p57r .badge.neutral{background:var(--bg-inset);color:var(--text-muted)}

/* Report sections */
.p57r .report-section{padding:52px 0 28px;border-top:1px solid var(--border)}
.p57r .report-section:first-of-type{border-top:none}
.p57r .section-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28px;gap:24px;flex-wrap:wrap}
.p57r .section-header-left{max-width:760px}
.p57r .section-eyebrow{display:inline-block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);background:var(--accent-soft);padding:3px 10px;border-radius:4px;font-weight:700;margin-bottom:12px}
.p57r .section-title{font-family:var(--serif);font-size:32px;font-weight:600;letter-spacing:-.02em;margin:0 0 10px;color:var(--text);line-height:1.18}
.p57r .section-deck{font-size:14px;color:var(--text-muted);line-height:1.6;margin:0;max-width:700px}
.p57r .section-anchor{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-subtle);font-weight:600;white-space:nowrap}

/* Split grid */
.p57r .split-grid{display:grid;grid-template-columns:1fr 1.45fr;gap:24px;align-items:start;margin-bottom:32px}
@media(max-width:1060px){.p57r .split-grid{grid-template-columns:1fr}}

/* Insights pane */
.p57r .insights-pane{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:22px;position:relative}
.p57r .insights-pane::before{content:"";position:absolute;left:0;top:22px;bottom:22px;width:3px;background:var(--accent);border-radius:0 2px 2px 0}
.p57r .pane-title{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);font-weight:700;margin:0 0 14px;padding-left:12px}
.p57r .data-pane{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:8px;overflow:hidden}

/* Insight cards */
.p57r .insight-card{display:flex;align-items:flex-start;gap:12px;padding:13px 0;border-bottom:1px dashed var(--border)}
.p57r .insight-card:last-child{border-bottom:none;padding-bottom:0}
.p57r .insight-card:first-child{padding-top:0}
.p57r .insight-num{flex-shrink:0;width:30px;height:30px;background:var(--primary-soft);color:var(--primary);border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;font-family:var(--mono)}
.p57r .insight-title{font-size:13px;font-weight:600;color:var(--text);margin-bottom:3px;letter-spacing:-.005em}
.p57r .insight-text{font-size:12px;color:var(--text-muted);line-height:1.55}
.p57r .insight-text strong{color:var(--text);font-weight:600;background:var(--accent-soft);padding:0 3px;border-radius:2px}

/* Data tables */
.p57r .table-wrap{overflow-x:auto;border-radius:var(--radius)}
.p57r table.data-table{width:100%;border-collapse:separate;border-spacing:0;font-size:12.5px;font-variant-numeric:tabular-nums}
.p57r table.data-table thead th{text-align:right;padding:11px 13px;background:var(--bg-inset);color:var(--text-muted);font-weight:600;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;border-bottom:1px solid var(--border);white-space:nowrap;position:sticky;top:0}
.p57r table.data-table thead th:first-child{text-align:left;border-top-left-radius:var(--radius)}
.p57r table.data-table thead th:last-child{border-top-right-radius:var(--radius)}
.p57r table.data-table tbody td{padding:10px 13px;border-bottom:1px solid var(--border);text-align:right;color:var(--text);vertical-align:middle}
.p57r table.data-table tbody td.metric-name{text-align:left;color:var(--text);font-weight:500}
.p57r table.data-table tbody tr:hover{background:var(--bg-card-hover)}
.p57r table.data-table tbody tr:last-child td{border-bottom:none}
.p57r .num strong{color:var(--primary);font-weight:600}
.p57r .totals-row td{background:var(--bg-inset);font-weight:600;border-top:2px solid var(--primary)}
.p57r .totals-row td.metric-name{color:var(--primary)}

/* Worked / didn't work cards */
.p57r .worked-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:32px}
@media(max-width:768px){.p57r .worked-grid{grid-template-columns:1fr}}
.p57r .worked-card{display:flex;align-items:flex-start;gap:11px;padding:13px 15px;border-radius:var(--radius);background:var(--bg-card);border:1px solid var(--border);border-left:3px solid var(--good)}
.p57r .worked-card.neg{border-left-color:var(--bad)}
.p57r .worked-icon{flex-shrink:0;width:22px;height:22px;background:var(--good-soft);color:var(--good);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;font-family:var(--mono)}
.p57r .worked-card.neg .worked-icon{background:var(--bad-soft);color:var(--bad)}
.p57r .worked-title{font-size:12.5px;font-weight:600;color:var(--text);margin-bottom:2px}
.p57r .worked-text{font-size:12px;color:var(--text-muted);line-height:1.5}
.p57r .worked-text strong{color:var(--text);font-weight:600;background:var(--accent-soft);padding:0 3px;border-radius:2px}

/* Action cards */
.p57r .action-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:32px}
@media(max-width:900px){.p57r .action-grid{grid-template-columns:1fr}}
.p57r .action-card{display:flex;gap:14px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px;position:relative;overflow:hidden}
.p57r .action-card::before{content:"";position:absolute;top:0;right:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--primary) 0%,var(--accent) 100%)}
.p57r .action-num{flex-shrink:0;width:40px;height:40px;background:var(--primary);color:white;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:17px;font-weight:600}
.p57r .action-title{font-size:14px;font-weight:600;color:var(--text);margin-bottom:5px}
.p57r .action-text{font-size:12.5px;color:var(--text-muted);line-height:1.6;margin-bottom:10px}
.p57r .action-text strong{color:var(--text);font-weight:600}
.p57r .meta-pill{font-size:11px;padding:3px 9px;background:var(--bg-inset);color:var(--text-muted);border-radius:999px;font-weight:500;display:inline-block;margin:3px 3px 0 0}

/* Conclusions */
.p57r .conclusions-block{background:linear-gradient(135deg,var(--primary-soft) 0%,var(--bg-card) 100%);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px}
.p57r .conclusion-item{display:flex;align-items:flex-start;gap:12px;padding:11px 0;border-bottom:1px dashed var(--border)}
.p57r .conclusion-item:last-child{border-bottom:none;padding-bottom:0}
.p57r .conclusion-item:first-child{padding-top:0}
.p57r .conclusion-num{flex-shrink:0;width:24px;height:24px;background:var(--accent);color:var(--primary);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:var(--mono)}
.p57r .conclusion-text{font-size:13px;color:var(--text);line-height:1.55;font-weight:500}
.p57r .conclusion-text strong{color:var(--primary);font-weight:700}

/* Funnel stages */
.p57r .funnel-stages{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
@media(max-width:768px){.p57r .funnel-stages{grid-template-columns:1fr 1fr}}
.p57r .funnel-stage{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px;position:relative;text-align:center}
.p57r .funnel-stage-num{font-family:var(--serif);font-size:34px;font-weight:600;color:var(--primary);letter-spacing:-.02em;line-height:1;margin-bottom:5px}
.p57r .funnel-stage.conv .funnel-stage-num{color:var(--good)}
.p57r .funnel-stage-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);font-weight:600;margin-bottom:6px}
.p57r .funnel-stage-sub{font-size:11px;color:var(--text-subtle)}

/* Callout */
.p57r .callout{background:linear-gradient(135deg,var(--primary-soft) 0%,var(--bg-card) 100%);border-left:3px solid var(--accent);border-radius:var(--radius);padding:16px 20px;font-size:13px;color:var(--text);line-height:1.6;margin:18px 0}
.p57r .callout strong{color:var(--primary);font-weight:600}

/* Subsection */
.p57r .subsection{margin-top:36px;margin-bottom:14px}
.p57r .subsection-title{font-family:var(--serif);font-size:20px;font-weight:600;letter-spacing:-.015em;color:var(--text);margin:0 0 6px}
.p57r .subsection-deck{font-size:13px;color:var(--text-muted);margin:0 0 16px;max-width:800px;line-height:1.55}

/* KPI strip */
.p57r .kpi-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:24px}
@media(max-width:900px){.p57r .kpi-strip{grid-template-columns:repeat(3,1fr)}}
.p57r .kpi-strip-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:14px}
.p57r .kpi-strip-label{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-subtle);font-weight:600;margin-bottom:5px}
.p57r .kpi-strip-val{font-family:var(--serif);font-size:22px;font-weight:600;letter-spacing:-.02em;color:var(--text);line-height:1.15;margin-bottom:2px}
.p57r .kpi-strip-sub{font-size:11px;color:var(--text-subtle)}

/* Share bar */
.p57r .share-bar{display:inline-flex;align-items:center;gap:7px;width:110px}
.p57r .share-fill{height:5px;background:linear-gradient(90deg,var(--primary) 0%,var(--primary-3) 100%);border-radius:3px;min-width:2px}
.p57r .share-bar span{font-size:10.5px;color:var(--text-muted);font-family:var(--mono)}

/* Footer */
.p57r .report-footer{padding:40px 0 52px;border-top:1px solid var(--border);margin-top:52px;text-align:center}
.p57r .report-footer p{font-size:12px;color:var(--text-subtle);line-height:1.6}
.p57r .report-footer strong{color:var(--text-muted)}

/* Color utilities */
.p57r .fill-high{color:var(--good);font-weight:600}
.p57r .fill-mid{color:var(--warn);font-weight:600}
.p57r .fill-low{color:var(--bad);font-weight:600}
`;

const compactCurrency = (n: number) => {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  return formatCurrency(n);
};

const pct = (n: number) => formatPercentage(Number.isFinite(n) ? n : 0);
const num = (n: number) => formatNumber(n);
const cur = (n: number) => formatCurrency(n);
const barW = (v: number, max: number) => `${Math.max(2, Math.min(100, max ? (v / max) * 100 : 0))}%`;

const Badge: React.FC<{ value: number; fmt?: 'pct' | 'num' | 'cur'; invert?: boolean }> = ({ value, fmt = 'pct', invert = false }) => {
  const pos = invert ? value < 0 : value > 0;
  const neg = invert ? value > 0 : value < 0;
  const cls = pos ? 'good' : neg ? 'bad' : 'neutral';
  const prefix = value > 0 ? '+' : '';
  const label = fmt === 'pct' ? `${prefix}${value.toFixed(1)}%` : fmt === 'cur' ? `${prefix}${compactCurrency(Math.abs(value))}` : `${prefix}${num(value)}`;
  return <span className={`badge ${cls}`}>{label}</span>;
};

const getStudioLocationLabel = (studio: string | null) => {
  if (studio === 'supreme') return 'Supreme HQ, Bandra';
  if (studio === 'kenkere') return 'Kenkere House, Bengaluru';
  if (studio === 'popup') return 'Pop-up';
  if (studio === 'kwality') return 'Kwality House';
  return '';
};

const BackButton: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (onClose) { onClose(); return; }
    navigate('/studio-pulse', { replace: true });
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed left-4 top-4 z-[1000] inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/65 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-black/85"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Dashboard
    </button>
  );
};

const StaticReportFrame: React.FC<{ title: string; src: string; onClose?: () => void }> = ({ title, src, onClose }) => (
  <div className="min-h-screen bg-[#0A0A0A]">
    <BackButton onClose={onClose} />
    <iframe
      title={title}
      src={src}
      className="block h-screen min-h-screen w-full border-0 bg-[#0A0A0A]"
    />
  </div>
);

export const LocationReportComprehensive: React.FC<LocationReportComprehensiveProps & { onClose?: () => void }> = ({ onReady, onClose }) => {
  const { filters: globalFilters, updateFilters, clearFilters } = useGlobalFilters();
  const [searchParams] = useSearchParams();
  const studioParam = searchParams.get('studio');
  const toParam = searchParams.get('to');
  const urlLocationLabel = getStudioLocationLabel(studioParam);
  const effectiveLocationLabel = urlLocationLabel || (globalFilters.location.length ? globalFilters.location.join(' · ') : 'All locations');
  // Use start date for month determination (end may be exclusive/+1 day)
  const effectiveStartDate = globalFilters.dateRange.start;
  const effectiveEndDate = toParam || globalFilters.dateRange.end;

  const isMay2026 = React.useMemo(() => {
    // Check start date first (most reliable), fallback to end
    const start = new Date(`${effectiveStartDate}T00:00:00`);
    const end = new Date(`${effectiveEndDate}T00:00:00`);
    const ref = !Number.isNaN(start.getTime()) ? start : end;
    return ref.getFullYear() === 2026 && ref.getMonth() === 4;
  }, [effectiveStartDate, effectiveEndDate]);

  const effectiveLocationText = `${effectiveLocationLabel} ${studioParam || ''}`.toLowerCase();
  const isKwalityMay2026Template = isMay2026 && effectiveLocationText.includes('kwality');
  const isSupremeMay2026Template = isMay2026 && (effectiveLocationText.includes('supreme') || effectiveLocationText.includes('bandra'));

  React.useEffect(() => {
    if ((isKwalityMay2026Template || isSupremeMay2026Template) && onReady) onReady();
  }, [isKwalityMay2026Template, isSupremeMay2026Template, onReady]);

  if (isKwalityMay2026Template) {
    return (
      <ReportErrorBoundary onClose={onClose}>
        <StaticReportFrame
          title="Kwality House Performance Report May 2026"
          src="/kwality-house-performance-report-may-2026.html"
          onClose={onClose}
        />
      </ReportErrorBoundary>
    );
  }

  if (isSupremeMay2026Template) {
    return (
      <ReportErrorBoundary onClose={onClose}>
        <StaticReportFrame
          title="Supreme HQ Studio Performance Review May 2026"
          src="/supreme-hq-studio-performance-review-may-2026.pdf"
          onClose={onClose}
        />
      </ReportErrorBoundary>
    );
  }

  return (
    <ReportErrorBoundary onClose={onClose}>
      <DynamicLocationReport
        globalFilters={globalFilters}
        updateFilters={updateFilters}
        clearFilters={clearFilters}
        onReady={onReady}
        onClose={onClose}
      />
    </ReportErrorBoundary>
  );
};

const DynamicLocationReport: React.FC<{
  globalFilters: ReturnType<typeof useGlobalFilters>['filters'];
  updateFilters: ReturnType<typeof useGlobalFilters>['updateFilters'];
  clearFilters: ReturnType<typeof useGlobalFilters>['clearFilters'];
  onReady?: () => void;
  onClose?: () => void;
}> = ({ globalFilters, updateFilters, clearFilters, onReady, onClose }) => {
  const { metrics, isLoading, generateFullReport } = useLocationReportData();
  const [report, setReport] = React.useState<LocationReportNarrative | null>(null);
  const [reportLoading, setReportLoading] = React.useState(false);

  // Use start date for month label (end can be exclusive/+1 day which would show wrong month)
  const selectedMonth = React.useMemo(() => {
    const start = new Date(`${globalFilters.dateRange.start}T00:00:00`);
    const end = new Date(`${globalFilters.dateRange.end}T00:00:00`);
    const ref = !Number.isNaN(start.getTime()) ? start : end;
    return Number.isNaN(ref.getTime()) ? 'Selected period' : format(ref, 'MMMM yyyy');
  }, [globalFilters.dateRange.start, globalFilters.dateRange.end]);

  // Period label: "01 May 2026 — 31 May 2026"
  const periodLabel = React.useMemo(() => {
    const start = new Date(`${globalFilters.dateRange.start}T00:00:00`);
    const rawEnd = new Date(`${globalFilters.dateRange.end}T00:00:00`);
    // If end is 1st of a month (exclusive), use last day of previous month
    const end = rawEnd.getDate() === 1
      ? new Date(rawEnd.getFullYear(), rawEnd.getMonth(), 0)
      : rawEnd;
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return `${format(start, 'dd MMM yyyy')} — ${format(end, 'dd MMM yyyy')}`;
    }
    return selectedMonth;
  }, [globalFilters.dateRange.start, globalFilters.dateRange.end, selectedMonth]);

  const locationLabel = globalFilters.location.length ? globalFilters.location.join(' · ') : 'All locations';

  React.useEffect(() => {
    if (metrics && onReady) onReady();
  }, [metrics, onReady]);

  const runReport = React.useCallback(() => {
    if (!metrics || reportLoading) return;
    setReportLoading(true);
    generateFullReport()
      .then((next) => { if (next) setReport(next); })
      .catch(() => undefined)
      .finally(() => setReportLoading(false));
  }, [generateFullReport, metrics, reportLoading]);

  React.useEffect(() => {
    if (metrics && !report && !reportLoading) runReport();
  }, [metrics, report, reportLoading, runReport]);

  if (!metrics) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-white text-slate-700">
        <div className="flex items-center gap-3 text-sm">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
          Building {selectedMonth} report…
        </div>
      </div>
    );
  }

  const m = metrics;
  const verdict = report?.overallVerdict || `${locationLabel} closed ${selectedMonth} with ${compactCurrency(m.totalRevenue)} gross revenue, ${compactCurrency(m.netRevenue)} net revenue, ${num(m.totalTransactions)} transactions, and a ${pct(m.fillRate)} studio fill rate.`;
  const sessionMax = Math.max(m.barreSessions, m.powerCycleSessions, m.strengthSessions, 1);
  const funnelMax = Math.max(m.totalLeads, m.newClientsAcquired, m.leadsConverted, 1);
  const leadRows = Object.entries(m.leadsBySource || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const highlights = report?.highlights?.length ? report.highlights : [
    'Revenue and transaction volume provide the clearest read of monthly commercial health.',
    'Fill rate and average class size indicate demand relative to scheduled supply.',
    'Conversion and retention rates signal the health of the member lifecycle funnel.',
  ];
  const actions = report?.recommendations?.length ? report.recommendations : [
    'Review late-cancel behavior and create a follow-up path for repeat offenders.',
    'Use highest-performing class formats as anchor for next month schedule planning.',
    'Prioritise lead sources with the strongest conversion signal and reduce effort on low-yield channels.',
    'Audit discount policy against gross-to-net ratio to recover margin.',
  ];

  const kpiCards = [
    { label: 'Gross Revenue', value: compactCurrency(m.totalRevenue), sub: `${num(m.totalTransactions)} transactions`, tone: '' },
    { label: 'Net Revenue', value: compactCurrency(m.netRevenue), sub: `${pct(m.totalRevenue ? (m.netRevenue / m.totalRevenue) * 100 : 0)} net ratio`, tone: 'tone-good' },
    { label: 'Fill Rate', value: pct(m.fillRate), sub: `${m.avgClassSize.toFixed(1)} avg class size`, tone: m.fillRate >= 50 ? 'tone-good' : m.fillRate >= 35 ? 'tone-warn' : 'tone-bad' },
    { label: 'Conversion', value: pct(m.conversionRate), sub: `${num(m.leadsConverted)} of ${num(m.totalLeads)} leads`, tone: m.conversionRate >= 20 ? 'tone-good' : m.conversionRate >= 12 ? 'tone-warn' : 'tone-bad' },
    { label: 'Churn Rate', value: pct(m.churnRate), sub: `${num(m.churnedMembers)} lapsed members`, tone: m.churnRate <= 20 ? 'tone-good' : m.churnRate <= 40 ? 'tone-warn' : 'tone-bad' },
    { label: 'Discount Rate', value: pct(m.discountRate), sub: `${compactCurrency(m.totalDiscounts)} discounted`, tone: m.discountRate <= 10 ? 'tone-good' : m.discountRate <= 20 ? 'tone-warn' : 'tone-bad' },
  ];

  const summaryInsights = highlights.slice(0, 6).map((text, i) => ({ num: String(i + 1).padStart(2, '0'), text }));

  const headlineMetrics = [
    { name: 'Gross Revenue', value: cur(m.totalRevenue) },
    { name: 'Net Revenue', value: cur(m.netRevenue) },
    { name: 'Transactions', value: num(m.totalTransactions) },
    { name: 'Unique Members', value: num(m.uniqueMembers) },
    { name: 'Avg Transaction Value', value: cur(m.avgTransactionValue) },
    { name: 'Avg Revenue / Member', value: cur(m.avgSpendPerMember) },
    { name: 'Discount Value', value: cur(m.totalDiscounts) },
    { name: 'Discount Rate', value: pct(m.discountRate) },
  ];

  const sessionRows = [
    { name: 'Barre', count: m.barreSessions, fill: '' },
    { name: 'PowerCycle', count: m.powerCycleSessions, fill: '' },
    { name: 'Strength Lab', count: m.strengthSessions, fill: '' },
  ];

  return (
    <div className="p57r">
      <BackButton onClose={onClose} />
      <style>{reportCss}</style>

      {/* Sticky filter bar */}
      <div className="p57r filter-bar">
        <div className="filter-bar-inner">
          <AutoCloseFilterSection filters={globalFilters} onFiltersChange={updateFilters} onReset={clearFilters} />
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="p57r hero">
        <div className="p57r cont">
          <div className="p57r hero-inner">
            <div className="p57r hero-eyebrow">
              <span className="p57r dot">P57</span>
              Senior Management Review · Period: {periodLabel}
            </div>
            <h1 className="p57r">
              <span className="p57r acc-blue">{locationLabel}</span> studio performance<br />
              for <span className="p57r acc-yellow">{selectedMonth}</span> — revenue, operations, and member lifecycle.
            </h1>
            <p className="p57r hero-sub">
              A data-led review of the studio's commercial and operational performance in {selectedMonth}, benchmarked against the active filters applied in the dashboard. Every section surfaces a business decision — fill rate, trainer deployment, discount discipline, and membership retention.
            </p>
            <div className="p57r hero-meta">
              <div className="p57r hero-meta-item">
                <span className="p57r label">Location</span>
                <span className="p57r value">{locationLabel}</span>
              </div>
              <div className="p57r hero-meta-item">
                <span className="p57r label">Period</span>
                <span className="p57r value">{periodLabel}</span>
              </div>
              <div className="p57r hero-meta-item">
                <span className="p57r label">Reporting basis</span>
                <span className="p57r value">Net Sales · {num(m.totalSessions)} sessions · {num(m.uniqueMembers)} unique buyers</span>
              </div>
              <div className="p57r hero-meta-item">
                <span className="p57r label">Audience</span>
                <span className="p57r value">Senior Management · Board Review</span>
              </div>
            </div>
            <div className="p57r kpi-grid">
              {kpiCards.map((k) => (
                <div key={k.label} className={`p57r kpi-card ${k.tone}`}>
                  <div className="p57r kpi-label">{k.label}</div>
                  <div className="p57r kpi-value">{k.value}</div>
                  <div className="p57r kpi-sub">{k.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 01: EXECUTIVE SUMMARY ── */}
      <section className="p57r report-section">
        <div className="p57r cont">
          <div className="p57r section-header">
            <div className="p57r section-header-left">
              <span className="p57r section-eyebrow">01 · Executive Summary</span>
              <h2 className="p57r section-title">
                {report?.executiveSummary
                  ? report.executiveSummary.slice(0, 120) + (report.executiveSummary.length > 120 ? '…' : '')
                  : `${selectedMonth} performance at a glance — revenue, session utilisation, and member lifecycle health.`}
              </h2>
              <p className="p57r section-deck">{verdict}</p>
            </div>
            <div className="p57r section-anchor">Section 01 / 04</div>
          </div>

          <div className="p57r split-grid">
            <div className="p57r insights-pane">
              <div className="p57r pane-title">Key Insights · {selectedMonth}</div>
              {summaryInsights.map((ins, i) => (
                <div className="p57r insight-card" key={i}>
                  <div className="p57r insight-num">{ins.num}</div>
                  <div>
                    <div className="p57r insight-text">{ins.text}</div>
                  </div>
                </div>
              ))}
              {summaryInsights.length === 0 && (
                <div className="p57r insight-card">
                  <div className="p57r insight-num">01</div>
                  <div>
                    <div className="p57r insight-title">Report summary</div>
                    <div className="p57r insight-text">{verdict}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="p57r data-pane">
              <div className="p57r pane-title" style={{ padding: '14px 14px 8px' }}>Headline KPI Table · {selectedMonth}</div>
              <div className="p57r table-wrap">
                <table className="p57r data-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>{selectedMonth}</th>
                      <th>Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headlineMetrics.map((row) => (
                      <tr key={row.name}>
                        <td className="metric-name">{row.name}</td>
                        <td className="num"><strong>{row.value}</strong></td>
                        <td className="num">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Conclusions */}
          <div className="p57r subsection">
            <h3 className="p57r subsection-title">Data-backed conclusions</h3>
          </div>
          <div className="p57r conclusions-block">
            {[
              `Gross revenue of ${compactCurrency(m.totalRevenue)} with ${num(m.totalTransactions)} transactions represents the period baseline.`,
              `Net revenue of ${compactCurrency(m.netRevenue)} after VAT gives a ${pct(m.totalRevenue ? (m.netRevenue / m.totalRevenue) * 100 : 0)} net ratio.`,
              `Studio fill rate of ${pct(m.fillRate)} with ${m.avgClassSize.toFixed(1)} average class size across ${num(m.totalSessions)} sessions.`,
              `${num(m.lateCancellations)} late cancellations represent operational capacity loss worth reviewing.`,
              `Conversion rate of ${pct(m.conversionRate)} from ${num(m.totalLeads)} leads — ${num(m.leadsConverted)} converted.`,
              `Churn rate at ${pct(m.churnRate)} with ${num(m.churnedMembers)} lapsed members. Retention at ${pct(m.retentionRate)}.`,
            ].map((text, i) => (
              <div className="p57r conclusion-item" key={i}>
                <span className="p57r conclusion-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="p57r conclusion-text">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 02: STUDIO SESSION PERFORMANCE ── */}
      <section className="p57r report-section">
        <div className="p57r cont">
          <div className="p57r section-header">
            <div className="p57r section-header-left">
              <span className="p57r section-eyebrow">02 · Studio Session Performance</span>
              <h2 className="p57r section-title">Demand, utilisation &amp; format mix</h2>
              <p className="p57r section-deck">{report?.sessionNarrative || 'Studio session performance combines total sessions, check-ins, fill rate, average class size, format mix, and late-cancellation pressure.'}</p>
            </div>
            <div className="p57r section-anchor">Section 02 / 04</div>
          </div>

          <div className="p57r kpi-strip">
            {[
              { label: 'Sessions', val: num(m.totalSessions), sub: 'scheduled' },
              { label: 'Check-ins', val: num(m.totalCheckIns), sub: 'attended' },
              { label: 'Fill Rate', val: pct(m.fillRate), sub: `${m.avgClassSize.toFixed(1)} avg size` },
              { label: 'Late Cancels', val: num(m.lateCancellations), sub: 'policy review needed' },
              { label: 'Capacity Use', val: pct(m.capacityUtilization), sub: 'available seats used' },
            ].map((k) => (
              <div className="p57r kpi-strip-card" key={k.label}>
                <div className="p57r kpi-strip-label">{k.label}</div>
                <div className="p57r kpi-strip-val">{k.val}</div>
                <div className="p57r kpi-strip-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="p57r split-grid">
            <div className="p57r data-pane">
              <div className="p57r pane-title" style={{ padding: '14px 14px 8px' }}>Format Mix — Sessions &amp; Share</div>
              <div className="p57r table-wrap">
                <table className="p57r data-table">
                  <thead>
                    <tr>
                      <th>Format</th>
                      <th>Sessions</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionRows.map((row) => (
                      <tr key={row.name}>
                        <td className="metric-name">{row.name}</td>
                        <td className="num">{num(row.count)}</td>
                        <td>
                          <div className="p57r share-bar">
                            <div className="p57r share-fill" style={{ width: barW(row.count, sessionMax) }} />
                            <span>{pct((row.count / Math.max(m.totalSessions, 1)) * 100)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="totals-row">
                      <td className="metric-name">Total</td>
                      <td className="num">{num(m.totalSessions)}</td>
                      <td className="num">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p57r insights-pane">
              <div className="p57r pane-title">Session Insights</div>
              {[
                { title: 'Fill rate efficiency', text: `Studio ran ${num(m.totalSessions)} sessions with ${num(m.totalCheckIns)} total check-ins — a ${pct(m.fillRate)} fill rate at ${m.avgClassSize.toFixed(1)} average class size.` },
                { title: 'Late cancellation pressure', text: `${num(m.lateCancellations)} late cancellations represent capacity held but not delivered, creating potential penalty-enforcement opportunities.` },
                { title: 'Capacity utilization', text: `Overall capacity utilization at ${pct(m.capacityUtilization)} indicates room for demand-generation focus on lower-fill formats.` },
              ].map((ins, i) => (
                <div className="p57r insight-card" key={i}>
                  <div className="p57r insight-num">{String(i + 1).padStart(2, '0')}</div>
                  <div>
                    <div className="p57r insight-title">{ins.title}</div>
                    <div className="p57r insight-text">{ins.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 03: ACQUISITION & RETENTION ── */}
      <section className="p57r report-section">
        <div className="p57r cont">
          <div className="p57r section-header">
            <div className="p57r section-header-left">
              <span className="p57r section-eyebrow">03 · Acquisition &amp; Retention</span>
              <h2 className="p57r section-title">Lead flow, conversion &amp; member continuity</h2>
              <p className="p57r section-deck">{report?.acquisitionNarrative || 'Acquisition and retention connects lead volume, converted leads, new clients, retention rate, churn, and source quality.'}</p>
            </div>
            <div className="p57r section-anchor">Section 03 / 04</div>
          </div>

          {/* Funnel stages */}
          <div className="p57r funnel-stages">
            {[
              { label: 'Total Leads', val: num(m.totalLeads), sub: 'top of funnel', cls: '' },
              { label: 'New Clients', val: num(m.newClientsAcquired), sub: 'acquired this period', cls: '' },
              { label: 'Converted', val: num(m.leadsConverted), sub: `${pct(m.leadConversionRate)} of leads`, cls: 'conv' },
              { label: 'Avg LTV', val: compactCurrency(m.averageLTV), sub: 'new-client cohort', cls: '' },
            ].map((stage) => (
              <div key={stage.label} className={`p57r funnel-stage ${stage.cls}`}>
                <div className="p57r funnel-stage-num">{stage.val}</div>
                <div className="p57r funnel-stage-label">{stage.label}</div>
                <div className="p57r funnel-stage-sub">{stage.sub}</div>
              </div>
            ))}
          </div>

          <div className="p57r split-grid">
            <div className="p57r data-pane">
              <div className="p57r pane-title" style={{ padding: '14px 14px 8px' }}>Lead Sources · {selectedMonth}</div>
              <div className="p57r table-wrap">
                <table className="p57r data-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Leads</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(leadRows.length ? leadRows : [['No source data', 0]]).map(([source, count]) => (
                      <tr key={source}>
                        <td className="metric-name">{source}</td>
                        <td className="num">{num(count as number)}</td>
                        <td>
                          <div className="p57r share-bar">
                            <div className="p57r share-fill" style={{ width: barW(count as number, funnelMax) }} />
                            <span>{pct(((count as number) / Math.max(m.totalLeads, 1)) * 100)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p57r data-pane">
              <div className="p57r pane-title" style={{ padding: '14px 14px 8px' }}>Retention &amp; Churn Metrics</div>
              <div className="p57r table-wrap">
                <table className="p57r data-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Retention Rate', val: pct(m.retentionRate) },
                      { name: 'Churn Rate', val: pct(m.churnRate) },
                      { name: 'Churned Members', val: num(m.churnedMembers) },
                      { name: 'Avg Conversion Days', val: `${m.avgConversionDays.toFixed(1)} days` },
                      { name: 'Conversion Rate', val: pct(m.conversionRate) },
                      { name: 'Lead Conversion Rate', val: pct(m.leadConversionRate) },
                      { name: 'Average LTV', val: cur(m.averageLTV) },
                    ].map((row) => (
                      <tr key={row.name}>
                        <td className="metric-name">{row.name}</td>
                        <td className="num"><strong>{row.val}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 04: INSTRUCTOR & ACTION READOUT ── */}
      <section className="p57r report-section">
        <div className="p57r cont">
          <div className="p57r section-header">
            <div className="p57r section-header-left">
              <span className="p57r section-eyebrow">04 · Instructor &amp; Action Readout</span>
              <h2 className="p57r section-title">Delivery benchmarks &amp; next moves</h2>
              <p className="p57r section-deck">{report?.retentionNarrative || 'The closing readout translates performance signals into focused management actions for the next reporting cycle.'}</p>
            </div>
            <div className="p57r section-anchor">Section 04 / 04</div>
          </div>

          {/* Instructor KPI strip */}
          <div className="p57r kpi-strip" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {[
              { label: 'Top Instructor', val: m.topTrainerName || 'N/A', sub: cur(m.topTrainerRevenue) },
              { label: 'Instructors', val: num(m.totalTrainers), sub: `${m.sessionsPerTrainer.toFixed(1)} sessions each` },
              { label: 'Revenue / Instructor', val: compactCurrency(m.revenuePerTrainer), sub: 'selected period' },
            ].map((k) => (
              <div className="p57r kpi-strip-card" key={k.label}>
                <div className="p57r kpi-strip-label">{k.label}</div>
                <div className="p57r kpi-strip-val">{k.val}</div>
                <div className="p57r kpi-strip-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Action items */}
          <div className="p57r subsection">
            <h3 className="p57r subsection-title">Action items for the next 30 days</h3>
            <p className="p57r subsection-deck">Each action is anchored to performance signals from this period and designed for immediate execution.</p>
          </div>
          <div className="p57r action-grid">
            {actions.slice(0, 6).map((action, i) => (
              <div className="p57r action-card" key={i}>
                <div className="p57r action-num">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className="p57r action-title">Next-cycle priority #{i + 1}</div>
                  <div className="p57r action-text">{action}</div>
                  <div>
                    <span className="p57r meta-pill">Priority: High</span>
                    <span className="p57r meta-pill">Impact: Medium–High</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p57r report-footer">
            <p>
              <strong>Physique 57 India · Monthly Performance Intelligence</strong><br />
              {locationLabel} · {selectedMonth} · Generated by Studio Pulse
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
