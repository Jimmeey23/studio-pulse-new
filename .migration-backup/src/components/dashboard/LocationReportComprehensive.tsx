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

const reportCss = `
.p57-report-shell{--bg:#ffffff;--bg2:#f8f9fc;--bg3:#f0f2f7;--surface:#ffffff;--surface2:#f4f6fb;--border:#dde2ed;--border2:#c8d0e0;--text:#0d1117;--text-2:#3a4355;--text-muted:#5a6474;--text-light:#8c95a6;--blue:#0d2137;--blue-mid:#1a3f6b;--blue-light:#2b6cb0;--blue-pale:#e8f0f9;--yellow:#c8960c;--yellow-deep:#a07508;--yellow-pale:#fef9ec;--yellow-mid:#e8b94f;--positive:#1a6b3c;--positive-bg:#edf7f2;--warn:#b54708;--warn-bg:#fff4ec;--red:#991b1b;--red-bg:#fef2f2;--shadow:0 1px 4px rgba(13,33,55,.06),0 4px 16px rgba(13,33,55,.06);--shadow-lg:0 4px 24px rgba(13,33,55,.10);--radius:12px;--radius-sm:7px;background:var(--bg);color:var(--text);font-family:Georgia,'Times New Roman',serif;line-height:1.65;font-size:15px}
.p57-report-shell *{box-sizing:border-box}.p57-report-filter{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.92);border-bottom:1px solid var(--border);backdrop-filter:blur(14px)}.p57-report-filter-inner{max-width:1400px;margin:0 auto;padding:12px 60px}.hero{background:var(--blue);color:#fff;position:relative;overflow:hidden}.hero-inner{max-width:1400px;margin:0 auto;padding:80px 60px 0}.hero-top{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:end;padding-bottom:60px}.hero-label{font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--yellow-mid);margin-bottom:16px}.hero h1{font-size:clamp(38px,4.5vw,64px);font-weight:400;line-height:1.08;color:#fff;margin:0 0 20px}.hero h1 span{color:var(--yellow-mid)}.hero-desc{font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.7;color:rgba(255,255,255,.55);max-width:430px}.hero-verdict{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:var(--radius);padding:28px 32px}.hero-verdict-title{font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--yellow-mid);margin-bottom:14px}.hero-verdict p{font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.75;color:rgba(255,255,255,.72);margin:0}.hero-verdict strong{color:#fff;font-weight:600}.hero-kpi-bar{background:rgba(255,255,255,.04);border-top:1px solid rgba(255,255,255,.1);padding:36px 60px}.hero-kpis{max-width:1400px;margin:0 auto;display:grid;grid-template-columns:repeat(7,1fr);gap:0}.hero-kpi{padding:0 28px 0 0;border-right:1px solid rgba(255,255,255,.1);margin-right:28px}.hero-kpi:last-child{border-right:none;margin-right:0}.hero-kpi-label{font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:6px}.hero-kpi-val{font-size:26px;color:#fff;letter-spacing:-.5px;line-height:1;margin-bottom:5px}.hero-kpi-delta{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px}.d-up{color:#4ade80}.d-down{color:#f87171}.d-neu{color:rgba(255,255,255,.4)}.wrap{max-width:1400px;margin:0 auto;padding:0 60px}.section{padding:72px 0 40px}.section-divider{height:1px;background:var(--border)}.sh{margin-bottom:44px;display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start}.sh-eyebrow{font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--yellow);margin-bottom:10px;display:flex;align-items:center;gap:10px}.sh-eyebrow:before{content:'';display:block;width:24px;height:1px;background:var(--yellow)}.sh-title{font-size:clamp(22px,2.5vw,32px);font-weight:400;color:var(--text);line-height:1.15}.sh-right{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.75;color:var(--text-muted);padding-top:4px;border-left:2px solid var(--border);padding-left:24px}.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px 32px;box-shadow:var(--shadow)}.card-title{font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--text-light);margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid var(--border)}.g2{display:grid;grid-template-columns:1fr 1fr;gap:20px}.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px}.g32{display:grid;grid-template-columns:3fr 2fr;gap:20px}.mb20{margin-bottom:20px}.mb32{margin-bottom:32px}.kpi-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px}.kpi-box{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:20px 22px;position:relative;overflow:hidden}.kpi-box:after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--yellow)}.kpi-box.blue:after{background:var(--blue)}.kpi-box.positive:after{background:var(--positive)}.kpi-box.warn:after{background:var(--warn)}.kpi-box.red:after{background:var(--red)}.kpi-label{font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-light);margin-bottom:6px}.kpi-val{font-size:26px;color:var(--text);letter-spacing:-.5px;margin-bottom:4px;line-height:1}.kpi-sub{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:var(--text-muted)}.tbl-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12.5px}thead th{text-align:left;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-light);padding:10px 14px;border-bottom:1px solid var(--border2);background:var(--bg2);font-weight:500;white-space:nowrap}tbody td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text-2);vertical-align:middle}tbody tr:last-child td{border-bottom:none}tbody tr:hover td{background:var(--bg2)}.tr{text-align:right}.tn{color:var(--text);font-weight:600}.t-blue{color:var(--blue-light);font-weight:600}.t-yellow{color:var(--yellow);font-weight:600}.t-green{color:var(--positive)}.t-warn{color:var(--warn)}.t-red{color:var(--red)}.t-muted{color:var(--text-light)}.bar-wrap{display:flex;align-items:center;gap:8px}.bar-bg{flex:1;height:5px;background:var(--border2);border-radius:3px;overflow:hidden;min-width:60px}.bar-fill{height:100%;border-radius:3px;background:var(--blue-light)}.bar-fill.yellow{background:var(--yellow)}.bar-fill.green{background:var(--positive)}.bar-fill.warn{background:var(--warn)}.bar-fill.red{background:var(--red)}.bar-pct{font-size:11px;color:var(--text-muted);width:34px;text-align:right;flex-shrink:0}.badge{display:inline-flex;align-items:center;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:.3px;padding:2px 9px;border-radius:20px;font-weight:500;white-space:nowrap}.badge-blue{background:var(--blue-pale);color:var(--blue-light)}.badge-yellow{background:var(--yellow-pale);color:var(--yellow-deep)}.badge-green{background:var(--positive-bg);color:var(--positive)}.badge-warn{background:var(--warn-bg);color:var(--warn)}.badge-red{background:var(--red-bg);color:var(--red)}.highlight{background:linear-gradient(135deg,var(--blue-pale),var(--yellow-pale));border-left:3px solid var(--yellow);padding:24px 30px;border-radius:0 var(--radius) var(--radius) 0;font-family:'Helvetica Neue',Arial,sans-serif;color:var(--text-2);line-height:1.8}.insight-panel{display:grid;gap:12px}.insight{padding:16px 18px;background:var(--bg2);border-radius:var(--radius-sm);border-left:3px solid var(--yellow);font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:var(--text-muted);line-height:1.65}.insight strong{display:block;color:var(--text);margin-bottom:4px}.insight.blue{border-left-color:var(--blue-light)}.insight.green{border-left-color:var(--positive)}.insight.warn{border-left-color:var(--warn)}.action-list{counter-reset:action}.action-item{counter-increment:action;display:grid;grid-template-columns:44px 1fr;gap:18px;padding:22px 0;border-bottom:1px solid var(--border)}.action-item:last-child{border-bottom:none}.action-num:before{content:counter(action);display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:var(--blue);color:#fff;border-radius:50%;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px}.action-title{font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;color:var(--text);margin-bottom:5px}.action-desc{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:var(--text-muted);line-height:1.7}.footer-note{padding:48px 0 72px;text-align:center;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--text-light)}@media(max-width:1100px){.hero-kpis{grid-template-columns:repeat(3,1fr);gap:24px}.hero-kpi{border-right:0;margin-right:0}.kpi-strip{grid-template-columns:repeat(2,1fr)}}@media(max-width:900px){.p57-report-filter-inner,.hero-inner,.hero-kpi-bar,.wrap{padding-left:24px;padding-right:24px}.hero-top,.sh,.g2,.g3,.g32{grid-template-columns:1fr}.hero-kpis{grid-template-columns:1fr 1fr}.hero-top{gap:28px;padding-bottom:36px}.section{padding:48px 0 28px}}`;

const compactCurrency = (n: number) => {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  return formatCurrency(n);
};

const percent = (n: number) => formatPercentage(Number.isFinite(n) ? n : 0);

const barWidth = (value: number, max: number) => `${Math.max(4, Math.min(100, max ? (value / max) * 100 : 0))}%`;

const getStudioLocationLabel = (studio: string | null) => {
  if (studio === 'supreme') return 'Supreme HQ, Bandra';
  if (studio === 'kenkere') return 'Kenkere House, Bengaluru';
  if (studio === 'popup') return 'Pop-up';
  if (studio === 'kwality') return 'Kwality House';
  return '';
};

const BackToDashboardButton = () => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/studio-pulse', { replace: true })}
      className="fixed left-4 top-4 z-[1000] inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/65 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-black/85"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Dashboard
    </button>
  );
};

const StaticReportFrame: React.FC<{ title: string; src: string }> = ({ title, src }) => (
  <div className="min-h-screen bg-[#0A0A0A]">
    <BackToDashboardButton />
    <iframe
      title={title}
      src={src}
      className="block h-screen min-h-screen w-full border-0 bg-[#0A0A0A]"
    />
  </div>
);

export const LocationReportComprehensive: React.FC<LocationReportComprehensiveProps> = ({ onReady }) => {
  const { filters: globalFilters, updateFilters, clearFilters } = useGlobalFilters();
  const [searchParams] = useSearchParams();
  const studioParam = searchParams.get('studio');
  const toParam = searchParams.get('to');
  const urlLocationLabel = getStudioLocationLabel(studioParam);
  const effectiveLocationLabel = urlLocationLabel || (globalFilters.location.length ? globalFilters.location.join(' · ') : 'All locations');
  const effectiveEndDate = toParam || globalFilters.dateRange.end;
  const isMay2026 = React.useMemo(() => {
    const end = new Date(`${effectiveEndDate}T00:00:00`);
    return !Number.isNaN(end.getTime()) && end.getFullYear() === 2026 && end.getMonth() === 4;
  }, [effectiveEndDate]);
  const effectiveLocationText = `${effectiveLocationLabel} ${studioParam || ''}`.toLowerCase();
  const isKwalityMay2026Template = isMay2026 && effectiveLocationText.includes('kwality');
  const isSupremeMay2026Template = isMay2026 && (effectiveLocationText.includes('supreme') || effectiveLocationText.includes('bandra'));

  React.useEffect(() => {
    if ((isKwalityMay2026Template || isSupremeMay2026Template) && onReady) onReady();
  }, [isKwalityMay2026Template, isSupremeMay2026Template, onReady]);

  if (isKwalityMay2026Template) {
    return (
      <StaticReportFrame
        title="Kwality House Performance Report May 2026"
        src="/kwality-house-performance-report-may-2026.html"
      />
    );
  }

  if (isSupremeMay2026Template) {
    return (
      <StaticReportFrame
        title="Supreme HQ Studio Performance Review May 2026"
        src="/supreme-hq-studio-performance-review-may-2026.pdf"
      />
    );
  }

  return (
    <DynamicLocationReport
      globalFilters={globalFilters}
      updateFilters={updateFilters}
      clearFilters={clearFilters}
      onReady={onReady}
    />
  );
};

const DynamicLocationReport: React.FC<{
  globalFilters: ReturnType<typeof useGlobalFilters>['filters'];
  updateFilters: ReturnType<typeof useGlobalFilters>['updateFilters'];
  clearFilters: ReturnType<typeof useGlobalFilters>['clearFilters'];
  onReady?: () => void;
}> = ({ globalFilters, updateFilters, clearFilters, onReady }) => {
  const { metrics, isLoading, generateFullReport } = useLocationReportData();
  const [report, setReport] = React.useState<LocationReportNarrative | null>(null);
  const [reportLoading, setReportLoading] = React.useState(false);

  const selectedMonth = React.useMemo(() => {
    const end = new Date(`${globalFilters.dateRange.end}T00:00:00`);
    return Number.isNaN(end.getTime()) ? 'Selected month' : format(end, 'MMMM yyyy');
  }, [globalFilters.dateRange.end]);

  const locationLabel = globalFilters.location.length ? globalFilters.location.join(' · ') : 'All locations';

  React.useEffect(() => {
    if (metrics && onReady) onReady();
  }, [metrics, onReady]);

  const runReport = React.useCallback(() => {
    if (!metrics || reportLoading) return;
    setReportLoading(true);
    generateFullReport()
      .then((next) => {
        if (next) setReport(next);
      })
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
          <RefreshCw className="h-4 w-4 animate-spin" />
          Building {selectedMonth} report...
        </div>
      </div>
    );
  }

  const m = metrics;
  const verdict = report?.overallVerdict || `${locationLabel} closed ${selectedMonth} with ${compactCurrency(m.grossRevenue ?? m.totalRevenue)} gross revenue, ${compactCurrency(m.netRevenue)} net revenue, ${formatNumber(m.totalTransactions)} transactions, and a ${percent(m.fillRate)} studio-session fill rate.`;
  const sessionMax = Math.max(m.barreSessions, m.powerCycleSessions, m.strengthSessions, 1);
  const funnelMax = Math.max(m.totalLeads, m.newClientsAcquired, m.leadsConverted, 1);
  const leadRows = Object.entries(m.leadsBySource || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const actions = report?.recommendations?.length
    ? report.recommendations
    : [
        'Review late cancellation behavior and create a member follow-up path for repeat offenders.',
        'Use high-performing class formats as the anchor for next-month schedule planning.',
        'Prioritize lead sources with the strongest conversion signal and reduce effort on low-yield channels.',
      ];

  return (
    <div className="p57-report-shell">
      <BackToDashboardButton />
      <style>{reportCss}</style>
      <div className="p57-report-filter">
        <div className="p57-report-filter-inner">
          <AutoCloseFilterSection filters={globalFilters} onFiltersChange={updateFilters} onReset={clearFilters} />
        </div>
      </div>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-top">
            <div>
              <div className="hero-label">Senior Management Review · {locationLabel} · {selectedMonth}</div>
              <h1>{locationLabel}<br /><span>Performance Report</span></h1>
              <p className="hero-desc">A full-spectrum business intelligence review covering revenue, studio-session performance, instructor analytics, new client acquisition, lapsed membership diagnostics, and strategic action items.</p>
            </div>
            <div className="hero-verdict">
              <div className="hero-verdict-title">Executive Summary</div>
              <p><strong>{selectedMonth} read:</strong> {verdict}</p>
            </div>
          </div>
        </div>
        <div className="hero-kpi-bar">
          <div className="hero-kpis">
            {[
              ['Gross Revenue', compactCurrency(m.totalRevenue), `${formatNumber(m.totalTransactions)} transactions`, 'd-up'],
              ['Net Revenue', compactCurrency(m.netRevenue), `${percent(m.netRevenue && m.totalRevenue ? (m.netRevenue / m.totalRevenue) * 100 : 0)} net ratio`, 'd-up'],
              ['Transactions', formatNumber(m.totalTransactions), `${formatNumber(m.uniqueMembers)} unique members`, 'd-neu'],
              ['Unique Members', formatNumber(m.uniqueMembers), `${compactCurrency(m.avgSpendPerMember)} avg spend`, 'd-neu'],
              ['New Clients', formatNumber(m.newClientsAcquired), `${percent(m.leadConversionRate)} lead conversion`, 'd-up'],
              ['Avg Txn Value', compactCurrency(m.avgTransactionValue), 'per transaction', 'd-neu'],
              ['Late Cancels', formatNumber(m.lateCancellations), m.lateCancellations > 0 ? 'action required' : 'stable', m.lateCancellations > 0 ? 'd-down' : 'd-up'],
            ].map(([label, value, delta, klass]) => (
              <div className="hero-kpi" key={label}>
                <div className="hero-kpi-label">{label}</div>
                <div className="hero-kpi-val">{value}</div>
                <div className={`hero-kpi-delta ${klass}`}>{delta}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="section">
          <div className="sh">
            <div>
              <div className="sh-eyebrow">01 · Financial Performance</div>
              <div className="sh-title">Revenue, Sales Mix<br />& Comparative Health</div>
            </div>
            <div className="sh-right">{report?.revenueNarrative || 'Revenue quality is summarized through gross sales, net sales, transaction behavior, average spend, discount pressure, and member-level purchasing activity for the selected month and location.'}</div>
          </div>
          <div className="highlight mb32">{report?.executiveSummary || verdict}</div>
          <div className="kpi-strip mb32">
            <div className="kpi-box"><div className="kpi-label">Gross Sales</div><div className="kpi-val">{compactCurrency(m.totalRevenue)}</div><div className="kpi-sub">selected period</div></div>
            <div className="kpi-box blue"><div className="kpi-label">Net Sales</div><div className="kpi-val">{compactCurrency(m.netRevenue)}</div><div className="kpi-sub">{compactCurrency(m.vatAmount)} VAT</div></div>
            <div className="kpi-box positive"><div className="kpi-label">Avg Txn Value</div><div className="kpi-val">{compactCurrency(m.avgTransactionValue)}</div><div className="kpi-sub">per transaction</div></div>
            <div className="kpi-box warn"><div className="kpi-label">Discount Rate</div><div className="kpi-val">{percent(m.discountRate)}</div><div className="kpi-sub">{compactCurrency(m.totalDiscounts)} discount value</div></div>
            <div className="kpi-box red"><div className="kpi-label">Churn Rate</div><div className="kpi-val">{percent(m.churnRate)}</div><div className="kpi-sub">{formatNumber(m.churnedMembers)} lapsed members</div></div>
          </div>
          <div className="g32 mb32">
            <div className="card">
              <div className="card-title">Full Sales Metrics Comparison — Selected Month Performance</div>
              <div className="tbl-wrap">
                <table><thead><tr><th>Metric</th><th className="tr">Value</th><th className="tr">Context</th></tr></thead><tbody>
                  <tr><td className="tn">Gross Revenue</td><td className="tr t-blue">{formatCurrency(m.totalRevenue)}</td><td className="tr">All recorded sales</td></tr>
                  <tr><td className="tn">Net Revenue</td><td className="tr t-blue">{formatCurrency(m.netRevenue)}</td><td className="tr">After VAT</td></tr>
                  <tr><td className="tn">Transactions</td><td className="tr">{formatNumber(m.totalTransactions)}</td><td className="tr">Sales count</td></tr>
                  <tr><td className="tn">Unique Members</td><td className="tr">{formatNumber(m.uniqueMembers)}</td><td className="tr">Distinct purchasing members</td></tr>
                  <tr><td className="tn">Average Spend / Member</td><td className="tr">{formatCurrency(m.avgSpendPerMember)}</td><td className="tr">Gross revenue divided by unique members</td></tr>
                </tbody></table>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Financial Insights</div>
              <div className="insight-panel">
                {(report?.highlights?.length ? report.highlights : ['Net revenue and transaction behavior provide the cleanest view of monthly sales quality.', 'Average transaction value shows the strength of package and membership purchasing.', 'Discount rate should be monitored against campaign intent and margin impact.']).slice(0, 5).map((text, index) => (
                  <div className={`insight ${index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'green' : 'warn'}`} key={text}><strong>{index === 0 ? 'Primary read' : `Insight ${index + 1}`}</strong>{text}</div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="section-divider" />

      <div className="wrap">
        <section className="section">
          <div className="sh">
            <div>
              <div className="sh-eyebrow">02 · Studio Session Performance</div>
              <div className="sh-title">Demand, Utilisation<br />& Format Mix</div>
            </div>
            <div className="sh-right">{report?.sessionNarrative || 'Studio-session performance combines total sessions, check-ins, fill rate, average class size, format mix, and late-cancellation pressure.'}</div>
          </div>
          <div className="kpi-strip mb32">
            <div className="kpi-box"><div className="kpi-label">Sessions</div><div className="kpi-val">{formatNumber(m.totalSessions)}</div><div className="kpi-sub">scheduled</div></div>
            <div className="kpi-box blue"><div className="kpi-label">Check-ins</div><div className="kpi-val">{formatNumber(m.totalCheckIns)}</div><div className="kpi-sub">attended</div></div>
            <div className="kpi-box positive"><div className="kpi-label">Fill Rate</div><div className="kpi-val">{percent(m.fillRate)}</div><div className="kpi-sub">{m.avgClassSize.toFixed(1)} avg class size</div></div>
            <div className="kpi-box warn"><div className="kpi-label">Late Cancels</div><div className="kpi-val">{formatNumber(m.lateCancellations)}</div><div className="kpi-sub">{formatCurrency(m.lateCancellationRevenueLoss)} revenue impact</div></div>
            <div className="kpi-box red"><div className="kpi-label">Capacity Use</div><div className="kpi-val">{percent(m.capacityUtilization)}</div><div className="kpi-sub">available seats used</div></div>
          </div>
          <div className="card mb32">
            <div className="card-title">Format Mix — Sessions and Share</div>
            <div className="tbl-wrap">
              <table><thead><tr><th>Format</th><th className="tr">Sessions</th><th>Mix</th></tr></thead><tbody>
                {[
                  ['Barre', m.barreSessions, ''],
                  ['PowerCycle', m.powerCycleSessions, 'yellow'],
                  ['Strength', m.strengthSessions, 'green'],
                ].map(([name, count, klass]) => (
                  <tr key={name as string}><td className="tn">{name}</td><td className="tr t-blue">{formatNumber(count as number)}</td><td><div className="bar-wrap"><div className="bar-bg"><div className={`bar-fill ${klass}`} style={{ width: barWidth(count as number, sessionMax) }} /></div><span className="bar-pct">{percent(((count as number) / Math.max(m.totalSessions, 1)) * 100)}</span></div></td></tr>
                ))}
              </tbody></table>
            </div>
          </div>
        </section>
      </div>

      <div className="section-divider" />

      <div className="wrap">
        <section className="section">
          <div className="sh">
            <div>
              <div className="sh-eyebrow">03 · Acquisition & Retention</div>
              <div className="sh-title">Lead Flow, Conversion<br />& Member Continuity</div>
            </div>
            <div className="sh-right">{report?.acquisitionNarrative || 'Acquisition and retention intelligence connects lead volume, converted leads, new clients, retention rate, churn, and source quality.'}</div>
          </div>
          <div className="g2 mb32">
            <div className="card">
              <div className="card-title">Lead Funnel</div>
              <table><thead><tr><th>Stage</th><th className="tr">Count</th><th>Progress</th></tr></thead><tbody>
                {[
                  ['Total Leads', m.totalLeads],
                  ['New Clients', m.newClientsAcquired],
                  ['Converted Leads', m.leadsConverted],
                ].map(([label, value], index) => (
                  <tr key={label as string}><td className="tn">{label}</td><td className="tr">{formatNumber(value as number)}</td><td><div className="bar-wrap"><div className="bar-bg"><div className={`bar-fill ${index === 1 ? 'green' : index === 2 ? 'yellow' : ''}`} style={{ width: barWidth(value as number, funnelMax) }} /></div><span className="bar-pct">{percent(((value as number) / funnelMax) * 100)}</span></div></td></tr>
                ))}
              </tbody></table>
            </div>
            <div className="card">
              <div className="card-title">Lead Sources</div>
              <table><thead><tr><th>Source</th><th className="tr">Leads</th></tr></thead><tbody>
                {(leadRows.length ? leadRows : [['No source data', 0] as [string, number]]).map(([source, count]) => (
                  <tr key={source}><td className="tn">{source}</td><td className="tr">{formatNumber(count)}</td></tr>
                ))}
              </tbody></table>
            </div>
          </div>
          <div className="kpi-strip mb32">
            <div className="kpi-box positive"><div className="kpi-label">Retention</div><div className="kpi-val">{percent(m.retentionRate)}</div><div className="kpi-sub">member continuity</div></div>
            <div className="kpi-box red"><div className="kpi-label">Churned</div><div className="kpi-val">{formatNumber(m.churnedMembers)}</div><div className="kpi-sub">members</div></div>
            <div className="kpi-box blue"><div className="kpi-label">Avg LTV</div><div className="kpi-val">{compactCurrency(m.averageLTV)}</div><div className="kpi-sub">new-client cohort</div></div>
            <div className="kpi-box"><div className="kpi-label">Conversion</div><div className="kpi-val">{percent(m.conversionRate)}</div><div className="kpi-sub">trial-to-converted</div></div>
            <div className="kpi-box warn"><div className="kpi-label">Avg Conversion</div><div className="kpi-val">{m.avgConversionDays.toFixed(1)}</div><div className="kpi-sub">days</div></div>
          </div>
        </section>
      </div>

      <div className="section-divider" />

      <div className="wrap">
        <section className="section">
          <div className="sh">
            <div>
              <div className="sh-eyebrow">04 · Instructor & Action Readout</div>
              <div className="sh-title">Delivery Benchmarks<br />& Next Moves</div>
            </div>
            <div className="sh-right">{report?.retentionNarrative || 'The closing readout translates performance signals into focused management actions for the next reporting cycle.'}</div>
          </div>
          <div className="g3 mb32">
            <div className="card"><div className="card-title">Top Instructor Revenue</div><div className="kpi-val">{m.topTrainerName}</div><div className="kpi-sub">{formatCurrency(m.topTrainerRevenue)}</div></div>
            <div className="card"><div className="card-title">Instructors</div><div className="kpi-val">{formatNumber(m.totalTrainers)}</div><div className="kpi-sub">{m.sessionsPerTrainer.toFixed(1)} sessions per instructor</div></div>
            <div className="card"><div className="card-title">Revenue / Instructor</div><div className="kpi-val">{compactCurrency(m.revenuePerTrainer)}</div><div className="kpi-sub">selected period</div></div>
          </div>
          <div className="card">
            <div className="card-title">Management Action Items</div>
            <div className="action-list">
              {actions.slice(0, 6).map((action) => (
                <div className="action-item" key={action}>
                  <div className="action-num" />
                  <div>
                    <div className="action-title">Next-cycle priority</div>
                    <div className="action-desc">{action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div className="footer-note">Physique 57 India · Monthly Performance Intelligence · {locationLabel} · {selectedMonth}</div>
      </div>
    </div>
  );
};
