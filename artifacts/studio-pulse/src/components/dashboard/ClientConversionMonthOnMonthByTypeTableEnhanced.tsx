import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Star, ChevronDown, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { isConvertedInCohort, isInNewClientCohort, isRetainedInCohort } from '@/utils/clientRetention';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientConversionMonthOnMonthByTypeTableProps {
  data: NewClientData[];
  checkins?: any[];
  visitsSummary?: Record<string, number>;
  onRowClick?: (row: any) => void;
}

type MetricKey = 'trials' | 'newMembers' | 'converted' | 'retained' | 'retentionPct' | 'conversionPct' | 'avgLtv' | 'totalLtv' | 'avgConvDays' | 'avgVisits' | 'conv30d' | 'conv45d' | 'conv60d' | 'ret30d' | 'ret45d' | 'ret60d';

interface MonthCell {
  trials: number;
  newMembers: number;
  converted: number;
  retained: number;
  retentionPct: number;
  conversionPct: number;
  avgLtv: number;
  totalLtv: number;
  avgConvDays: number;
  avgVisits: number;
}

const METRIC_OPTS: { value: MetricKey; label: string; group?: string }[] = [
  { value: 'trials', label: 'Trials' },
  { value: 'newMembers', label: 'New Members' },
  { value: 'converted', label: 'Converted' },
  { value: 'retained', label: 'Retained' },
  { value: 'retentionPct', label: 'Retention %' },
  { value: 'conversionPct', label: 'Conversion %' },
  { value: 'avgLtv', label: 'Avg LTV' },
  { value: 'totalLtv', label: 'Total LTV' },
  { value: 'avgConvDays', label: 'Avg Conv Days' },
  { value: 'avgVisits', label: 'Avg Visits' },
  { value: 'conv30d', label: 'Conv 30d %', group: 'window' },
  { value: 'conv45d', label: 'Conv 45d %', group: 'window' },
  { value: 'conv60d', label: 'Conv 60d %', group: 'window' },
  { value: 'ret30d', label: 'Ret 30d %', group: 'window' },
  { value: 'ret45d', label: 'Ret 45d %', group: 'window' },
  { value: 'ret60d', label: 'Ret 60d %', group: 'window' },
];

const MONTHS_SHOWN = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthKey(dateStr: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtMonthKey(mk: string): string {
  const [year, month] = mk.split('-');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTHS[parseInt(month, 10) - 1]} ${year.slice(2)}`;
}

function buildCell(clients: NewClientData[], metric: MetricKey): number {
  const trials = clients.length;
  const newMembers = clients.filter((c) => isInNewClientCohort(c)).length;
  const converted = clients.filter((c) => isConvertedInCohort(c)).length;
  const retained = clients.filter((c) => isRetainedInCohort(c)).length;
  const totalLtv = clients.reduce((s, c) => s + (c.ltv || 0), 0);
  const convIntervals = clients.map((c) => c.conversionSpan).filter((v) => v > 0);
  const visitsList = clients.map((c) => c.visitsPostTrial).filter((v) => v > 0);

  switch (metric) {
    case 'trials': return trials;
    case 'newMembers': return newMembers;
    case 'converted': return converted;
    case 'retained': return retained;
    case 'retentionPct': return newMembers > 0 ? (retained / newMembers) * 100 : 0;
    case 'conversionPct': return newMembers > 0 ? (converted / newMembers) * 100 : 0;
    case 'avgLtv': return trials > 0 ? totalLtv / trials : 0;
    case 'totalLtv': return totalLtv;
    case 'avgConvDays': return convIntervals.length > 0 ? convIntervals.reduce((s, v) => s + v, 0) / convIntervals.length : 0;
    case 'avgVisits': return visitsList.length > 0 ? visitsList.reduce((s, v) => s + v, 0) / visitsList.length : 0;
    case 'conv30d': return newMembers > 0 ? (clients.filter(c => isInNewClientCohort(c) && c.conversionStatus === 'Converted' && c.conversionSpan > 0 && c.conversionSpan <= 30).length / newMembers) * 100 : 0;
    case 'conv45d': return newMembers > 0 ? (clients.filter(c => isInNewClientCohort(c) && c.conversionStatus === 'Converted' && c.conversionSpan > 0 && c.conversionSpan <= 45).length / newMembers) * 100 : 0;
    case 'conv60d': return newMembers > 0 ? (clients.filter(c => isInNewClientCohort(c) && c.conversionStatus === 'Converted' && c.conversionSpan > 0 && c.conversionSpan <= 60).length / newMembers) * 100 : 0;
    case 'ret30d': return newMembers > 0 ? (clients.filter(c => isInNewClientCohort(c) && c.retentionStatus === 'Retained' && c.conversionSpan > 0 && c.conversionSpan <= 30).length / newMembers) * 100 : 0;
    case 'ret45d': return newMembers > 0 ? (clients.filter(c => isInNewClientCohort(c) && c.retentionStatus === 'Retained' && c.conversionSpan > 0 && c.conversionSpan <= 45).length / newMembers) * 100 : 0;
    case 'ret60d': return newMembers > 0 ? (clients.filter(c => isInNewClientCohort(c) && c.retentionStatus === 'Retained' && c.conversionSpan > 0 && c.conversionSpan <= 60).length / newMembers) * 100 : 0;
  }
}

function fmtCell(value: number, metric: MetricKey): string {
  if (metric === 'retentionPct' || metric === 'conversionPct') return `${value.toFixed(1)}%`;
  if (['conv30d', 'conv45d', 'conv60d', 'ret30d', 'ret45d', 'ret60d'].includes(metric)) return `${value.toFixed(1)}%`;
  if (metric === 'avgLtv' || metric === 'totalLtv') return formatCurrency(value);
  if (metric === 'avgConvDays') return `${value.toFixed(0)}d`;
  if (metric === 'avgVisits') return value.toFixed(1);
  return formatNumber(Math.round(value));
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ClientConversionMonthOnMonthByTypeTable: React.FC<ClientConversionMonthOnMonthByTypeTableProps> = ({
  data,
  onRowClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const [metric, setMetric] = useState<MetricKey>('trials');
  const [viewMode, setViewMode] = useState<'values' | 'growth'>('values');
  const tableId = 'Month-on-Month by Client Type';

  // Collect all month keys across all data, sorted newest-last
  const allMonths = useMemo(() => {
    const keys = new Set<string>();
    data.forEach((c) => {
      const mk = getMonthKey(c.firstVisitDate);
      if (mk) keys.add(mk);
    });
    const sorted = [...keys].sort();
    return sorted.slice(-MONTHS_SHOWN);
  }, [data]);

  // Active month highlight — most recent complete month (matches other MoM tables)
  const activeMonthKey = (() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  })();

  // Unique client types (rows)
  const clientTypes = useMemo(() => {
    const types = new Set(data.map((c) => c.isNew || 'Unknown'));
    return [...types].sort((a, b) => {
      const aNew = a.toLowerCase().includes('new');
      const bNew = b.toLowerCase().includes('new');
      if (aNew && !bNew) return -1;
      if (!aNew && bNew) return 1;
      return a.localeCompare(b);
    });
  }, [data]);

  // Build matrix: clientType → month → clients[]
  const matrix = useMemo(() => {
    const m: Record<string, Record<string, NewClientData[]>> = {};
    clientTypes.forEach((ct) => { m[ct] = {}; });
    data.forEach((c) => {
      const ct = c.isNew || 'Unknown';
      const mk = getMonthKey(c.firstVisitDate);
      if (!mk || !m[ct]) return;
      if (!m[ct][mk]) m[ct][mk] = [];
      m[ct][mk].push(c);
    });
    return m;
  }, [data, clientTypes]);

  // Totals per month
  const monthTotals = useMemo(() => {
    const t: Record<string, NewClientData[]> = {};
    allMonths.forEach((mk) => {
      t[mk] = clientTypes.flatMap((ct) => matrix[ct]?.[mk] ?? []);
    });
    return t;
  }, [allMonths, clientTypes, matrix]);

  // Register for copy
  useEffect(() => {
    if (!registry || !containerRef.current) return;
    const getTextContent = () => {
      const table = containerRef.current?.querySelector('table');
      if (!table) return `${tableId} (No Data)`;
      const headers = Array.from(table.querySelectorAll('thead th')).map((n) => n.textContent?.trim() || '');
      const rows = Array.from(table.querySelectorAll('tbody tr'))
        .map((n) => Array.from(n.querySelectorAll('td')).map((c) => c.textContent?.trim() || '').join('\t'))
        .filter(Boolean);
      return [tableId, headers.join('\t'), ...rows].join('\n');
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, tableId, metric, allMonths]);

  const months = allMonths.slice().reverse(); // newest first for display

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08)]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[15px] font-bold text-white">{tableId}</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">{months.length} months</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">{clientTypes.length} client types</span>
          </div>
          <p className="mt-1 text-[12px] text-slate-400">Click any row or totals cell to open detailed drill-down evidence for that slice.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Values / Growth toggle */}
          <div className="flex rounded-xl border border-white/10 bg-white/10 p-0.5">
            {(['values', 'growth'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${viewMode === v ? 'bg-violet-600 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
              >
                {v === 'values' ? 'Values' : 'Growth %'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric selector */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 bg-slate-950 px-4 py-2.5">
        {METRIC_OPTS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMetric(opt.value)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${metric === opt.value ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-20">
            <TableRow className="border-slate-800 bg-slate-950 hover:bg-slate-950">
              <TableHead className="sticky left-0 z-30 min-w-[200px] bg-slate-950 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                Client Type
              </TableHead>
              {months.map((mk) => {
                const isActive = mk === activeMonthKey;
                return (
                  <TableHead
                    key={mk}
                    className={`min-w-[70px] py-3 text-center text-xs font-semibold uppercase tracking-wide ${isActive ? 'bg-blue-800 text-white' : 'bg-slate-950 text-white/70'}`}
                  >
                    {isActive && <Star className="w-3 h-3 mx-auto mb-0.5 text-white" />}
                    <div>{fmtMonthKey(mk).split(' ')[0]}</div>
                    <div className="text-[10px] font-normal opacity-70">{fmtMonthKey(mk).split(' ')[1]}</div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientTypes.map((ct, rowIdx) => {
              return (
                <TableRow
                  key={ct}
                  className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                  onClick={() => onRowClick?.({ type: ct, clients: data.filter((c) => c.isNew === ct) })}
                >
                  <TableCell className="sticky left-0 z-10 bg-inherit py-2.5">
                    <span className="text-[12px] font-semibold text-slate-800">
                      {ct}
                    </span>
                  </TableCell>
                  {months.map((mk) => {
                    const clients = matrix[ct]?.[mk] ?? [];
                    if (viewMode === 'growth') {
                      // compare to previous month
                      const prevMk = months[months.indexOf(mk) + 1] ?? null;
                      const cur = buildCell(clients, metric);
                      const prev = prevMk ? buildCell(matrix[ct]?.[prevMk] ?? [], metric) : null;
                      const pct = prev !== null && prev !== 0 ? ((cur - prev) / prev) * 100 : null;
                      return (
                        <TableCell key={mk} className="py-2 text-center text-xs font-semibold">
                          {pct === null ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            <span className={pct >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                              {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                            </span>
                          )}
                        </TableCell>
                      );
                    }
                    const value = buildCell(clients, metric);
                    return (
                      <TableCell key={mk} className={`py-2 text-center text-[12px] font-medium text-slate-800 ${value === 0 ? 'text-slate-300' : ''}`}>
                        {value === 0 ? '0' : fmtCell(value, metric)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}

            {/* Totals row */}
            <TableRow className="sticky bottom-0 z-10 border-t-2 border-slate-800 bg-slate-900 hover:bg-slate-800">
              <TableCell className="sticky left-0 z-20 bg-slate-900 py-3 text-xs font-bold uppercase tracking-widest text-white">
                Totals
              </TableCell>
              {months.map((mk) => {
                const clients = monthTotals[mk] ?? [];
                if (viewMode === 'growth') {
                  const prevMk = months[months.indexOf(mk) + 1] ?? null;
                  const cur = buildCell(clients, metric);
                  const prev = prevMk ? buildCell(monthTotals[prevMk] ?? [], metric) : null;
                  const pct = prev !== null && prev !== 0 ? ((cur - prev) / prev) * 100 : null;
                  return (
                    <TableCell key={mk} className="py-3 text-center text-xs font-bold">
                      {pct === null ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <span className={pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                        </span>
                      )}
                    </TableCell>
                  );
                }
                const value = buildCell(clients, metric);
                return (
                  <TableCell key={mk} className="py-3 text-center text-[12px] font-bold text-white">
                    {fmtCell(value, metric)}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// ─── New Client Membership Purchases Table ────────────────────────────────────

interface MembershipPurchasesTableProps {
  data: NewClientData[];
  onRowClick?: (row: any) => void;
}

function memberTypeLabel(isNew: string | undefined | null): string {
  return (isNew || '').trim() || 'Unknown';
}

const IS_NEW_PALETTE = [
  'bg-emerald-50 text-emerald-800 border border-emerald-200',
  'bg-sky-50 text-sky-800 border border-sky-200',
  'bg-violet-50 text-violet-800 border border-violet-200',
  'bg-amber-50 text-amber-800 border border-amber-200',
  'bg-rose-50 text-rose-800 border border-rose-200',
  'bg-teal-50 text-teal-800 border border-teal-200',
  'bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200',
  'bg-orange-50 text-orange-800 border border-orange-200',
  'bg-indigo-50 text-indigo-800 border border-indigo-200',
  'bg-slate-100 text-slate-700 border border-slate-200',
];
const memberTypeBadge = (() => {
  const cache: Record<string, string> = {};
  let idx = 0;
  return (label: string) => {
    if (!cache[label]) cache[label] = IS_NEW_PALETTE[idx++ % IS_NEW_PALETTE.length];
    return cache[label];
  };
})();

interface ParentRow {
  memberType: string;
  total: number;
  newTrials: number;
  otherTrials: number;
  retained: number;
  retentionPct: number;
  converted: number;
  conversionPct: number;
  avgLtv: number;
  avgPurchaseCountPostTrial: number;
  avgConvSpan: number | null;
}

interface ChildRow {
  membership: string;
  members: number;
  unitsSold: number;
  totalLtv: number;
  avgConvDays: number | null;
}

export const NewClientMembershipPurchasesTable: React.FC<MembershipPurchasesTableProps> = ({ data, onRowClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const tableId = 'New Client Membership Purchases';
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const toggleType = (mt: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(mt)) { next.delete(mt); } else { next.add(mt); }
      return next;
    });
  };

  const memberTypes = useMemo(() => Array.from(new Set(data.map((c) => memberTypeLabel((c as any).isNew)))), [data]);

  const parentRows = useMemo((): ParentRow[] => {
    return memberTypes.map((mt) => {
      const group = data.filter((c) => memberTypeLabel((c as any).isNew) === mt);
      const total = group.length;
      const newTrials = group.filter((c) => isInNewClientCohort(c)).length;
      const otherTrials = total - newTrials;
      const retainedMembers = group.filter((c) => isRetainedInCohort(c));
      const retained = retainedMembers.length;
      const retentionPct = total > 0 ? (retained / total) * 100 : 0;
      const convertedMembers = group.filter((c) => isConvertedInCohort(c));
      const converted = convertedMembers.length;
      const conversionPct = total > 0 ? (converted / total) * 100 : 0;
      const avgLtv = converted > 0 ? convertedMembers.reduce((s, c) => s + (Number(c.ltv) || 0), 0) / converted : 0;
      const avgPurchaseCountPostTrial = converted > 0
        ? convertedMembers.reduce((s, c) => s + (Number(c.purchaseCountPostTrial) || 0), 0) / converted
        : 0;
      const convSpanMembers = convertedMembers.filter((c) => (c.conversionSpan || 0) > 0);
      const avgConvSpan = convSpanMembers.length > 0
        ? convSpanMembers.reduce((s, c) => s + c.conversionSpan, 0) / convSpanMembers.length
        : null;
      return { memberType: mt, total, newTrials, otherTrials, retained, retentionPct, converted, conversionPct, avgLtv, avgPurchaseCountPostTrial, avgConvSpan };
    });
  }, [data, memberTypes]);

  const childRowsByType = useMemo((): Record<string, ChildRow[]> => {
    const result: Record<string, ChildRow[]> = {};
    memberTypes.forEach((mt) => {
      const convertedInType = data.filter((c) => memberTypeLabel((c as any).isNew) === mt && isConvertedInCohort(c));
      const grouped: Record<string, { members: Set<string>; unitsSold: number; totalLtv: number; totalConvSpan: number; convSpanCount: number }> = {};
      convertedInType.forEach((c) => {
        const membership = (c.firstPurchaseItem || c.membershipsBoughtPostTrial || 'Unknown').trim() || 'Unknown';
        if (!grouped[membership]) grouped[membership] = { members: new Set(), unitsSold: 0, totalLtv: 0, totalConvSpan: 0, convSpanCount: 0 };
        const g = grouped[membership];
        g.members.add(c.memberId || c.email || String(c));
        g.unitsSold += 1;
        g.totalLtv += Number(c.ltv) || 0;
        if ((c.conversionSpan || 0) > 0) { g.totalConvSpan += c.conversionSpan; g.convSpanCount += 1; }
      });
      result[mt] = Object.entries(grouped)
        .map(([membership, g]) => ({
          membership,
          members: g.members.size,
          unitsSold: g.unitsSold,
          totalLtv: g.totalLtv,
          avgConvDays: g.convSpanCount > 0 ? g.totalConvSpan / g.convSpanCount : null,
        }))
        .sort((a, b) => b.members - a.members);
    });
    return result;
  }, [data, memberTypes]);

  const totals = useMemo(() => {
    const total = data.length;
    const newTrials = data.filter((c) => isInNewClientCohort(c)).length;
    const otherTrials = total - newTrials;
    const retained = data.filter((c) => isRetainedInCohort(c)).length;
    const converted = data.filter((c) => isConvertedInCohort(c)).length;
    const retentionPct = total > 0 ? (retained / total) * 100 : 0;
    const conversionPct = total > 0 ? (converted / total) * 100 : 0;
    const convertedMembers = data.filter((c) => isConvertedInCohort(c));
    const avgLtv = converted > 0 ? convertedMembers.reduce((s, c) => s + (Number(c.ltv) || 0), 0) / converted : 0;
    const avgPurchaseCountPostTrial = converted > 0
      ? convertedMembers.reduce((s, c) => s + (Number(c.purchaseCountPostTrial) || 0), 0) / converted
      : 0;
    const convSpanMembers = convertedMembers.filter((c) => (c.conversionSpan || 0) > 0);
    const avgConvSpan = convSpanMembers.length > 0
      ? convSpanMembers.reduce((s, c) => s + c.conversionSpan, 0) / convSpanMembers.length
      : null;
    return { total, newTrials, otherTrials, retained, retentionPct, converted, conversionPct, avgLtv, avgPurchaseCountPostTrial, avgConvSpan };
  }, [data]);

  useEffect(() => {
    if (!registry || !containerRef.current) return;
    const getTextContent = () => {
      const table = containerRef.current?.querySelector('table');
      if (!table) return `${tableId} (No Data)`;
      const headers = Array.from(table.querySelectorAll('thead th')).map((n) => n.textContent?.trim() || '');
      const tableRows = Array.from(table.querySelectorAll('tbody tr'))
        .map((n) => Array.from(n.querySelectorAll('td')).map((c) => c.textContent?.trim() || '').join('\t'))
        .filter(Boolean);
      return [tableId, headers.join('\t'), ...tableRows].join('\n');
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, tableId, parentRows]);

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span className="text-[15px] font-bold text-white">New Client Membership Purchases</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">{totals.converted} Converted</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">{memberTypes.length} Member Types</span>
          </div>
          <p className="mt-1 text-[12px] text-slate-400">Trial cohort breakdown by member type — click a row to expand membership details.</p>
        </div>
      </div>

      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-slate-950">
            <TableRow className="border-slate-800 hover:bg-slate-950">
              <TableHead className="sticky left-0 z-30 min-w-[180px] bg-slate-950 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">Member Type</TableHead>
              <TableHead className="bg-slate-950 py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-white">New Trials</TableHead>
              <TableHead className="bg-slate-950 py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-white">Other Trials</TableHead>
              <TableHead className="bg-slate-950 py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-white">Retained</TableHead>
              <TableHead className="bg-slate-950 py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-white">Retention %</TableHead>
              <TableHead className="bg-slate-950 py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-white">Converted</TableHead>
              <TableHead className="bg-slate-950 py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-white">Conversion %</TableHead>
              <TableHead className="bg-slate-950 py-3 px-3 text-right text-xs font-semibold uppercase tracking-wide text-white">LTV</TableHead>
              <TableHead className="bg-slate-950 py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-white">Purch Post Trial</TableHead>
              <TableHead className="bg-slate-950 py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-white">Avg Conv Span</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parentRows.map((row) => {
              const badge = memberTypeBadge(row.memberType);
              const isExpanded = expandedTypes.has(row.memberType);
              const children = childRowsByType[row.memberType] ?? [];
              return (
                <React.Fragment key={row.memberType}>
                  <TableRow
                    className="cursor-pointer border-b border-slate-100 bg-white transition-colors hover:bg-slate-50"
                    onClick={() => { toggleType(row.memberType); onRowClick?.(row); }}
                  >
                    <TableCell className="sticky left-0 z-10 min-w-[180px] bg-white px-4 py-3 text-[12px] font-semibold">
                      <div className="flex items-center gap-2">
                        {children.length > 0
                          ? isExpanded
                            ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                            : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                          : <span className="w-3.5" />
                        }
                        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold leading-tight ${badge}`}>{row.memberType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-3 text-center text-[13px] font-medium text-slate-800">{formatNumber(row.newTrials)}</TableCell>
                    <TableCell className="py-3 px-3 text-center text-[13px] font-medium text-slate-800">{formatNumber(row.otherTrials)}</TableCell>
                    <TableCell className="py-3 px-3 text-center text-[13px] font-medium text-slate-800">{formatNumber(row.retained)}</TableCell>
                    <TableCell className="py-3 px-3 text-center text-[13px] font-medium text-slate-800">{row.retentionPct.toFixed(1)}%</TableCell>
                    <TableCell className="py-3 px-3 text-center text-[13px] font-medium text-slate-800">{formatNumber(row.converted)}</TableCell>
                    <TableCell className="py-3 px-3 text-center text-[13px] font-medium text-slate-800">{row.conversionPct.toFixed(1)}%</TableCell>
                    <TableCell className="py-3 px-3 text-right text-[13px] font-medium text-slate-800">{formatCurrency(row.avgLtv)}</TableCell>
                    <TableCell className="py-3 px-3 text-center text-[13px] font-medium text-slate-800">{row.avgPurchaseCountPostTrial.toFixed(1)}</TableCell>
                    <TableCell className="py-3 px-3 text-center text-[13px] font-medium text-slate-800">{row.avgConvSpan !== null ? `${row.avgConvSpan.toFixed(0)}d` : '—'}</TableCell>
                  </TableRow>

                  {isExpanded && children.map((child) => (
                    <TableRow key={`${row.memberType}|||${child.membership}`} className="border-b border-slate-100 bg-slate-50">
                      <TableCell className="sticky left-0 z-10 min-w-[180px] bg-slate-50 pl-10 pr-4 py-2.5 text-[12px] font-medium text-slate-700">{child.membership}</TableCell>
                      <TableCell className="py-2.5 px-3 text-center text-[12px] text-slate-600" colSpan={2}>{formatNumber(child.members)} members</TableCell>
                      <TableCell className="py-2.5 px-3 text-center text-[12px] text-slate-600">{formatNumber(child.unitsSold)}</TableCell>
                      <TableCell className="py-2.5 px-3 text-center text-[12px] text-slate-600" />
                      <TableCell className="py-2.5 px-3 text-center text-[12px] text-slate-600" />
                      <TableCell className="py-2.5 px-3 text-center text-[12px] text-slate-600" />
                      <TableCell className="py-2.5 px-3 text-right text-[12px] text-slate-600">{formatCurrency(child.totalLtv)}</TableCell>
                      <TableCell className="py-2.5 px-3 text-center text-[12px] text-slate-600" />
                      <TableCell className="py-2.5 px-3 text-center text-[12px] text-slate-600">{child.avgConvDays !== null ? `${child.avgConvDays.toFixed(0)}d` : '—'}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}

            <TableRow className="sticky bottom-0 z-10 border-t-2 border-slate-800 bg-slate-900 hover:bg-slate-800">
              <TableCell className="sticky left-0 z-20 bg-slate-900 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white">Total</TableCell>
              <TableCell className="py-3 px-3 text-center text-[13px] font-bold text-white">{formatNumber(totals.newTrials)}</TableCell>
              <TableCell className="py-3 px-3 text-center text-[13px] font-bold text-white">{formatNumber(totals.otherTrials)}</TableCell>
              <TableCell className="py-3 px-3 text-center text-[13px] font-bold text-white">{formatNumber(totals.retained)}</TableCell>
              <TableCell className="py-3 px-3 text-center text-[13px] font-bold text-white">{totals.retentionPct.toFixed(1)}%</TableCell>
              <TableCell className="py-3 px-3 text-center text-[13px] font-bold text-white">{formatNumber(totals.converted)}</TableCell>
              <TableCell className="py-3 px-3 text-center text-[13px] font-bold text-white">{totals.conversionPct.toFixed(1)}%</TableCell>
              <TableCell className="py-3 px-3 text-right text-[13px] font-bold text-white">{formatCurrency(totals.avgLtv)}</TableCell>
              <TableCell className="py-3 px-3 text-center text-[13px] font-bold text-white">{totals.avgPurchaseCountPostTrial.toFixed(1)}</TableCell>
              <TableCell className="py-3 px-3 text-center text-[13px] font-bold text-white">{totals.avgConvSpan !== null ? `${totals.avgConvSpan.toFixed(0)}d` : '—'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientConversionMonthOnMonthByTypeTable;
