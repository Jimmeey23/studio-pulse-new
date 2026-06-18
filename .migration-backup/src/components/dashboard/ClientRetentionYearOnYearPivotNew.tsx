import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, ArrowUpDown } from 'lucide-react';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { NewClientData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';
import { isConvertedInCohort, isInNewClientCohort, isRetainedInCohort } from '@/utils/clientRetention';
import { formatCurrency, formatNumber } from '@/utils/formatters';

type MetricKey =
  | 'trials'
  | 'newMembers'
  | 'converted'
  | 'retained'
  | 'retentionRate'
  | 'conversionRate'
  | 'avgLTV'
  | 'totalLTV'
  | 'avgConversionDays'
  | 'avgVisits';

const METRIC_LABELS: Record<MetricKey, string> = {
  trials: 'Trials',
  newMembers: 'New Members',
  converted: 'Converted',
  retained: 'Retained',
  retentionRate: 'Retention %',
  conversionRate: 'Conversion %',
  avgLTV: 'Avg LTV',
  totalLTV: 'Total LTV',
  avgConversionDays: 'Avg Conv Days',
  avgVisits: 'Avg Visits',
};

type RowType = 'clientType' | 'membership';

interface Props {
  data: NewClientData[];
  months?: Array<{ key: string; display?: string; year: number; month: number }>;
  onRowClick?: (data: any) => void;
}

export const ClientRetentionYearOnYearPivot: React.FC<Props> = ({ data, months: providedMonths, onRowClick }) => {
  const totalsRowStyle: React.CSSProperties = {
    ['--retention-totals-bg' as string]: '#6b21a8',
    ['--retention-totals-text' as string]: '#ffffff',
    ['--retention-totals-border' as string]: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: '#6b21a8',
    color: '#ffffff',
    borderTopColor: '#7e22ce',
  };

  const totalsCellStyle: React.CSSProperties = {
    ['--retention-totals-bg' as string]: '#6b21a8',
    ['--retention-totals-text' as string]: '#ffffff',
    ['--retention-totals-border' as string]: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: '#6b21a8',
    color: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderTopColor: '#7e22ce',
  };

  const [metric, setMetric] = useState<MetricKey>('trials');
  const [rowType, setRowType] = useState<RowType>('clientType');
  const [displayMode, setDisplayMode] = useState<'values' | 'growth'>('values');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const tableId = 'Client Retention YoY Pivot';
  
  const months = useMemo(() => {
    if (providedMonths && providedMonths.length > 0) {
      return providedMonths.map((month) => ({
        key: month.key,
        display: month.display || new Date(month.year, month.month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        year: month.year,
        month: month.month,
        monthName: new Date(month.year, month.month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
      }));
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthsArr: { key: string; display: string; year: number; month: number; monthName: string }[] = [];
    
    // Generate months from Jan to current month only
    for (let monthNum = 1; monthNum <= currentMonth; monthNum++) {
      const monthName = new Date(2024, monthNum - 1, 1).toLocaleDateString('en-US', { month: 'short' });
      
      // Add 2024 entry
      monthsArr.push({
        key: `2024-${String(monthNum).padStart(2, '0')}`,
        display: `${monthName} 2024`,
        year: 2024,
        month: monthNum,
        monthName: monthName
      });
      
      // Add 2025 entry
      monthsArr.push({
        key: `${currentYear}-${String(monthNum).padStart(2, '0')}`,
        display: `${monthName} ${currentYear}`,
        year: currentYear,
        month: monthNum,
        monthName: monthName
      });
    }
    return monthsArr;
  }, [providedMonths]);

  const comparisonYears = useMemo(() => {
    const years = Array.from(new Set(months.map((month) => month.year))).sort((a, b) => a - b);
    const latestYear = years[years.length - 1] ?? new Date().getFullYear();
    const baselineYear = years.length > 1 ? years[years.length - 2] : latestYear - 1;
    return { baselineYear, latestYear };
  }, [months]);

  const rowKeys = useMemo(() => {
    const set = new Set<string>();
    data.forEach(c => {
      const key = rowType === 'clientType' ? (c.isNew || 'Unknown') : (c.membershipUsed || 'Unknown');
      set.add(key);
    });
    return Array.from(set).sort((a, b) => {
      if (rowType === 'clientType') {
        const an = a.toLowerCase();
        const bn = b.toLowerCase();
        if (an.includes('new') && !bn.includes('new')) return -1;
        if (!an.includes('new') && bn.includes('new')) return 1;
      }
      return a.localeCompare(b);
    });
  }, [data, rowType]);

  const pivot = useMemo(() => {
    const initCell = () => ({ 
      trials: 0, 
      newMembers: 0, 
      converted: 0, 
      retained: 0, 
      totalLTV: 0, 
      conversionIntervals: [] as number[],
      visitsPostTrial: [] as number[],
      clients: [] as NewClientData[] // Store actual client data for drill-down
    });
    const map: Record<string, Record<string, any>> = {};
    
    rowKeys.forEach(rk => {
      map[rk] = {};
      months.forEach(m => {
        map[rk][m.key] = initCell();
      });
    });

    data.forEach(c => {
      const d = parseDate(c.firstVisitDate || '');
      if (!d) return;
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const dataKey = `${year}-${String(month).padStart(2, '0')}`;
      const rowKey = rowType === 'clientType' ? (c.isNew || 'Unknown') : (c.membershipUsed || 'Unknown');
      
      if (!map[rowKey]) return;
      const bucket = map[rowKey][dataKey];
      if (!bucket) return;
      
      bucket.trials += 1;
      if (isInNewClientCohort(c)) bucket.newMembers += 1;
      if (isConvertedInCohort(c)) bucket.converted += 1;
      if (isRetainedInCohort(c)) bucket.retained += 1;
      bucket.totalLTV += c.ltv || 0;
      bucket.clients.push(c); // Add client to bucket
      
      // Add conversion interval and visits tracking
      if (c.conversionSpan !== undefined && c.conversionSpan !== null) {
        bucket.conversionIntervals.push(c.conversionSpan);
      }
      if (c.visitsPostTrial !== undefined && c.visitsPostTrial !== null) {
        bucket.visitsPostTrial.push(c.visitsPostTrial);
      }
    });

    // Derived metrics
    rowKeys.forEach(rk => {
      months.forEach(m => {
        const b = map[rk][m.key];
        if (!b) return;
        b.avgLTV = b.trials > 0 ? b.totalLTV / b.trials : 0;
        b.conversionRate = b.newMembers > 0 ? (b.converted / b.newMembers) * 100 : 0;
        b.retentionRate = b.newMembers > 0 ? (b.retained / b.newMembers) * 100 : 0;
        b.avgConversionDays = b.conversionIntervals.length > 0 
          ? b.conversionIntervals.reduce((sum: number, val: number) => sum + val, 0) / b.conversionIntervals.length 
          : 0;
        b.avgVisits = b.visitsPostTrial.length > 0
          ? b.visitsPostTrial.reduce((sum: number, val: number) => sum + val, 0) / b.visitsPostTrial.length
          : 0;
      });
    });
    
    return map;
  }, [data, rowKeys, months, rowType]);

  const renderValue = (current: any, previous: any) => {
    let currVal = 0, prevVal = 0;
    
    switch (metric) {
      case 'trials':
        currVal = current.trials || 0;
        prevVal = previous.trials || 0;
        break;
      case 'newMembers':
        currVal = current.newMembers || 0;
        prevVal = previous.newMembers || 0;
        break;
      case 'converted':
        currVal = current.converted || 0;
        prevVal = previous.converted || 0;
        break;
      case 'retained':
        currVal = current.retained || 0;
        prevVal = previous.retained || 0;
        break;
      case 'conversionRate':
        currVal = current.conversionRate || 0;
        prevVal = previous.conversionRate || 0;
        break;
      case 'retentionRate':
        currVal = current.retentionRate || 0;
        prevVal = previous.retentionRate || 0;
        break;
      case 'avgLTV':
        currVal = current.avgLTV || 0;
        prevVal = previous.avgLTV || 0;
        break;
      case 'totalLTV':
        currVal = current.totalLTV || 0;
        prevVal = previous.totalLTV || 0;
        break;
      case 'avgConversionDays':
        currVal = current.avgConversionDays || 0;
        prevVal = previous.avgConversionDays || 0;
        break;
      case 'avgVisits':
        currVal = current.avgVisits || 0;
        prevVal = previous.avgVisits || 0;
        break;
    }

    if (displayMode === 'growth') {
      const growth = prevVal !== 0 ? ((currVal - prevVal) / prevVal) * 100 : 0;
      const isPositive = growth >= 0;
      return (
        <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
        </span>
      );
    }

    // Values mode: show prev | curr
    const format = (val: number) => {
      switch (metric) {
        case 'trials':
        case 'newMembers':
        case 'converted':
        case 'retained':
          return formatNumber(val);
        case 'conversionRate':
        case 'retentionRate':
          return `${val.toFixed(1)}%`;
        case 'avgLTV':
        case 'totalLTV':
          return formatCurrency(val);
        case 'avgConversionDays':
          return `${val.toFixed(0)} days`;
        case 'avgVisits':
          return `${val.toFixed(1)}`;
        default:
          return String(val);
      }
    };

    return (
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="text-slate-500">{format(prevVal)}</span>
        <span className="font-bold text-slate-800">{format(currVal)}</span>
      </div>
    );
  };

  // Render value with white text for totals row
  const renderValueWhite = (current: any, previous: any) => {
    let currVal = 0, prevVal = 0;
    
    switch (metric) {
      case 'trials':
        currVal = current.trials || 0;
        prevVal = previous.trials || 0;
        break;
      case 'newMembers':
        currVal = current.newMembers || 0;
        prevVal = previous.newMembers || 0;
        break;
      case 'converted':
        currVal = current.converted || 0;
        prevVal = previous.converted || 0;
        break;
      case 'retained':
        currVal = current.retained || 0;
        prevVal = previous.retained || 0;
        break;
      case 'conversionRate':
        currVal = current.conversionRate || 0;
        prevVal = previous.conversionRate || 0;
        break;
      case 'retentionRate':
        currVal = current.retentionRate || 0;
        prevVal = previous.retentionRate || 0;
        break;
      case 'avgLTV':
        currVal = current.avgLTV || 0;
        prevVal = previous.avgLTV || 0;
        break;
      case 'totalLTV':
        currVal = current.totalLTV || 0;
        prevVal = previous.totalLTV || 0;
        break;
      case 'avgConversionDays':
        currVal = current.avgConversionDays || 0;
        prevVal = previous.avgConversionDays || 0;
        break;
      case 'avgVisits':
        currVal = current.avgVisits || 0;
        prevVal = previous.avgVisits || 0;
        break;
    }

    if (displayMode === 'growth') {
      const growth = prevVal !== 0 ? ((currVal - prevVal) / prevVal) * 100 : 0;
      const isPositive = growth >= 0;
      return (
        <span className="text-xs font-semibold text-white">
          {isPositive ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
        </span>
      );
    }

    // Values mode: show prev | curr with white text
    const format = (val: number) => {
      switch (metric) {
        case 'trials':
        case 'newMembers':
        case 'converted':
        case 'retained':
          return formatNumber(val);
        case 'conversionRate':
        case 'retentionRate':
          return `${val.toFixed(1)}%`;
        case 'avgLTV':
        case 'totalLTV':
          return formatCurrency(val);
        case 'avgConversionDays':
          return `${val.toFixed(0)} days`;
        case 'avgVisits':
          return `${val.toFixed(1)}`;
        default:
          return String(val);
      }
    };

    return (
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="text-white/70">{format(prevVal)}</span>
        <span className="font-bold text-white">{format(currVal)}</span>
      </div>
    );
  };

  const sortedRowKeys = useMemo(() => {
    if (!sortColumn) return rowKeys;
    
    const sorted = [...rowKeys].sort((a, b) => {
      if (sortColumn === 'row') return a.localeCompare(b);
      
      const aData = pivot[a];
      const bData = pivot[b];
      if (!aData || !bData) return 0;
      
      const aCurr = aData[sortColumn];
      const bCurr = bData[sortColumn];
      if (!aCurr || !bCurr) return 0;
      
      let aVal = 0, bVal = 0;
      switch (metric) {
        case 'trials': aVal = aCurr.trials || 0; bVal = bCurr.trials || 0; break;
        case 'newMembers': aVal = aCurr.newMembers || 0; bVal = bCurr.newMembers || 0; break;
        case 'converted': aVal = aCurr.converted || 0; bVal = bCurr.converted || 0; break;
        case 'retained': aVal = aCurr.retained || 0; bVal = bCurr.retained || 0; break;
        case 'retentionRate': aVal = aCurr.retentionRate || 0; bVal = bCurr.retentionRate || 0; break;
        case 'conversionRate': aVal = aCurr.conversionRate || 0; bVal = bCurr.conversionRate || 0; break;
        case 'avgLTV': aVal = aCurr.avgLTV || 0; bVal = bCurr.avgLTV || 0; break;
        case 'totalLTV': aVal = aCurr.totalLTV || 0; bVal = bCurr.totalLTV || 0; break;
      }
      
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    return sorted;
  }, [rowKeys, sortColumn, sortDir, pivot, metric]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(col);
      setSortDir('desc');
    }
  };

  // Calculate totals
  const totalsRow = useMemo(() => {
    const totals: Record<string, any> = {};
    
    months.forEach(m => {
      totals[m.key] = { 
        trials: 0, 
        newMembers: 0, 
        converted: 0, 
        retained: 0, 
        totalLTV: 0,
        conversionIntervals: [] as number[],
        visitsPostTrial: [] as number[],
        clients: [] as NewClientData[]
      };
      
      rowKeys.forEach(rk => {
        const cell = pivot[rk]?.[m.key];
        
        if (cell) {
          totals[m.key].trials += cell.trials || 0;
          totals[m.key].newMembers += cell.newMembers || 0;
          totals[m.key].converted += cell.converted || 0;
          totals[m.key].retained += cell.retained || 0;
          totals[m.key].totalLTV += cell.totalLTV || 0;
          totals[m.key].conversionIntervals.push(...(cell.conversionIntervals || []));
          totals[m.key].visitsPostTrial.push(...(cell.visitsPostTrial || []));
          totals[m.key].clients.push(...(cell.clients || []));
        }
      });
      
      const b = totals[m.key];
      b.avgLTV = b.trials > 0 ? b.totalLTV / b.trials : 0;
      b.conversionRate = b.newMembers > 0 ? (b.converted / b.newMembers) * 100 : 0;
      b.retentionRate = b.newMembers > 0 ? (b.retained / b.newMembers) * 100 : 0;
      b.avgConversionDays = b.conversionIntervals.length > 0 
        ? b.conversionIntervals.reduce((sum: number, val: number) => sum + val, 0) / b.conversionIntervals.length 
        : 0;
      b.avgVisits = b.visitsPostTrial.length > 0
        ? b.visitsPostTrial.reduce((sum: number, val: number) => sum + val, 0) / b.visitsPostTrial.length
        : 0;
    });
    
    return totals;
  }, [pivot, rowKeys, months]);

  // Multi-metric export across ALL metrics & months for both previous and current year
  const generateAllTabsContent = useCallback(() => {
    const sections: string[] = [];
    sections.push(`${tableId} - All Metrics Export`);
    sections.push(`Exported on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
    sections.push(`Row Mode: ${rowType}`);
    sections.push('');

    const metricKeys = Object.keys(METRIC_LABELS) as MetricKey[];
    const formatVal = (mk: MetricKey, cell: any) => {
      switch (mk) {
        case 'trials': return formatNumber(cell?.trials || 0);
        case 'newMembers': return formatNumber(cell?.newMembers || 0);
        case 'converted': return formatNumber(cell?.converted || 0);
        case 'retained': return formatNumber(cell?.retained || 0);
        case 'retentionRate': return `${(cell?.retentionRate || 0).toFixed(1)}%`;
        case 'conversionRate': return `${(cell?.conversionRate || 0).toFixed(1)}%`;
        case 'avgLTV': return formatCurrency(cell?.avgLTV || 0);
        case 'totalLTV': return formatCurrency(cell?.totalLTV || 0);
        case 'avgConversionDays': return `${Math.round(cell?.avgConversionDays || 0)}`;
        case 'avgVisits': return `${(cell?.avgVisits || 0).toFixed(1)}`;
      }
    };

    metricKeys.forEach(mk => {
      sections.push(`\n${METRIC_LABELS[mk].toUpperCase()}`);
      const headers = [rowType === 'clientType' ? 'Client Type' : 'Membership'];
      months.forEach(m => headers.push(m.display));
      sections.push(headers.join('\t'));
      sections.push(headers.map(() => '---').join('\t'));

      rowKeys.forEach(rk => {
        const row: string[] = [rk];
        months.forEach(m => {
          const cell = pivot[rk]?.[m.key];
          row.push(formatVal(mk, cell) as string);
        });
        sections.push(row.join('\t'));
      });

      // Totals row
      const totalRow: string[] = ['TOTALS'];
      months.forEach(m => {
        const cell = totalsRow[m.key];
        totalRow.push(formatVal(mk, cell) as string);
      });
      sections.push(totalRow.join('\t'));
    });

    return sections.join('\n');
  }, [pivot, rowKeys, months, totalsRow, rowType, tableId]);

  useEffect(() => {
    if (!registry) return;
    const el = containerRef.current;
    if (!el) return;
    const getTextContent = () => {
      const table = el.querySelector('table');
      if (!table) return `${tableId} (No Data)`;
      let text = `${tableId}\nMetric: ${METRIC_LABELS[metric]} | Mode: ${displayMode} | Rows: ${rowType}\n`;
      const headerCells = table.querySelectorAll('thead th');
      const headers: string[] = [];
      headerCells.forEach(h => headers.push((h.textContent || '').trim().replace(/Prev \| Curr/i, '').trim()));
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(() => '---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(r => {
        const cells = r.querySelectorAll('td');
        const rowData: string[] = [];
        cells.forEach(c => rowData.push((c.textContent || '').trim()));
        if (rowData.length) text += rowData.join('\t') + '\n';
      });
      return text.trim();
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, metric, displayMode, rowType, pivot, sortedRowKeys]);

  return (
    <Card ref={containerRef} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 pt-4 text-white">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Year-on-Year Analysis
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {comparisonYears.baselineYear} vs {comparisonYears.latestYear}
                </Badge>
                <div className="ml-4">
                  <CopyTableButton
                    tableRef={containerRef as any}
                    tableName={tableId}
                    size="sm"
                    onCopyAllTabs={async () => generateAllTabsContent()}
                  />
                </div>
              </CardTitle>
              <p className="mt-2 text-sm text-slate-300">
                Compare the same month across years, then open any row or month cell for supporting client evidence.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={displayMode === 'values' ? 'default' : 'outline'}
                onClick={() => setDisplayMode('values')}
                className={displayMode === 'values' ? 'rounded-xl border border-purple-400/30 bg-purple-500 text-white hover:bg-purple-400' : 'rounded-xl border border-white/20 bg-white/10 text-purple-100 hover:bg-purple-500/20 hover:text-white'}
              >
                Values
              </Button>
              <Button
                size="sm"
                variant={displayMode === 'growth' ? 'default' : 'outline'}
                onClick={() => setDisplayMode('growth')}
                className={displayMode === 'growth' ? 'rounded-xl border border-purple-400/30 bg-purple-500 text-white hover:bg-purple-400' : 'rounded-xl border border-white/20 bg-white/10 text-purple-100 hover:bg-purple-500/20 hover:text-white'}
              >
                Growth %
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 p-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRowType('clientType')}
                className={`min-w-[110px] rounded-lg ${rowType === 'clientType' ? 'border border-purple-400/30 bg-purple-500 text-white' : 'text-purple-100 hover:bg-purple-500/20 hover:text-white'}`}
              >
                Client Type
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRowType('membership')}
                className={`min-w-[110px] rounded-lg ${rowType === 'membership' ? 'border border-purple-400/30 bg-purple-500 text-white' : 'text-purple-100 hover:bg-purple-500/20 hover:text-white'}`}
              >
                Membership
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(Object.keys(METRIC_LABELS) as MetricKey[]).map(k => (
                <button
                  key={k}
                  onClick={() => setMetric(k)}
                  className={`min-w-[90px] rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${metric === k ? 'border border-purple-400/30 bg-purple-500 text-white shadow-md' : 'border border-white/10 bg-white/10 text-purple-100 hover:bg-purple-500/20 hover:text-white'}`}
                  title={METRIC_LABELS[k]}
                >
                  {METRIC_LABELS[k]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50/90 px-5 py-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Years compared</div>
            <div className="mt-1 text-2xl font-semibold text-slate-950">2</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Row grouping</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">{rowType === 'clientType' ? 'Client Type' : 'Membership'}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Current metric</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">{METRIC_LABELS[metric]}</div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[900px] relative" data-table="client-retention-yoy-pivot" data-table-name={tableId}>
          <table className="min-w-full relative" data-table="client-retention-yoy-pivot" data-table-name={tableId}>
            <thead>
              <tr className="sticky top-0 z-10 bg-slate-950 text-white">
                <th 
                  className="sticky left-0 z-20 border-r border-white/20 bg-slate-950 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide cursor-pointer select-none"
                  style={{ width: '300px', minWidth: '300px' }}
                  onClick={() => handleSort('row')}
                >
                  <div className="flex items-center gap-1">
                    {rowType === 'clientType' ? 'Client Type' : 'Membership'}
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                {months.map((m, index) => {
                  const prevMonth = index > 0 ? months[index - 1] : null;
                  const nextMonth = index < months.length - 1 ? months[index + 1] : null;
                  
                  const isFirstOfGroup = !prevMonth || prevMonth.month !== m.month;
                  const isLastOfGroup = !nextMonth || nextMonth.month !== m.month;
                  
                  return (
                    <th 
                      key={m.key} 
                      className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wider min-w-[90px] cursor-pointer hover:bg-slate-800/60 select-none sticky top-0 ${
                        isFirstOfGroup ? 'border-l-2 border-slate-400' : ''
                      } ${
                        isLastOfGroup ? 'border-r-2 border-slate-400' : ''
                      }`}
                      onClick={() => handleSort(m.key)}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold whitespace-nowrap leading-tight">{m.monthName}</span>
                        <span className="text-slate-300 text-xs leading-tight">{m.year}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRowKeys.map((rk) => (
                <tr 
                  key={rk} 
                  className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-indigo-50/60"
                  style={{ maxHeight: '35px' }}
                  onClick={() => {
                    // Aggregate clients from all months for this row
                    const allClients = months.flatMap(m => pivot[rk]?.[m.key]?.clients || []);
                    onRowClick?.({ 
                      rowKey: rk, 
                      rowType, 
                      data: pivot[rk], 
                      metric,
                      clients: allClients
                    });
                  }}
                >
                  <td className="sticky left-0 z-10 border-r bg-white px-4 py-2 hover:bg-indigo-50/60" style={{ width: '300px', minWidth: '300px', maxHeight: '35px' }}>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-800 shadow-sm">{rk}</span>
                  </td>
                  {months.map((m, index) => {
                    const prevMonth = index > 0 ? months[index - 1] : null;
                    const nextMonth = index < months.length - 1 ? months[index + 1] : null;
                    
                    const isFirstOfGroup = !prevMonth || prevMonth.month !== m.month;
                    const isLastOfGroup = !nextMonth || nextMonth.month !== m.month;
                    
                    const cellData = pivot[rk]?.[m.key];
                    
                    return (
                      <td 
                        key={m.key} 
                        className={`px-2 py-2 text-center text-sm font-mono text-slate-800 transition-colors hover:bg-indigo-50/80 ${
                          isFirstOfGroup ? 'border-l-2 border-slate-300' : 'border-l'
                        } ${
                          isLastOfGroup ? 'border-r-2 border-slate-300' : ''
                        }`}
                        style={{ maxHeight: '35px' }}
                        onClick={(e) => {
                          // Allow clicking individual cells for month-specific drill-down
                          e.stopPropagation();
                          const clients = cellData?.clients || [];
                          onRowClick?.({ 
                            rowKey: rk, 
                            rowType,
                            month: m.month,
                            year: m.year,
                            data: cellData,
                            metric,
                            clients: clients
                          });
                        }}
                      >
                        {(() => {
                          const val = cellData || {};
                          switch (metric) {
                            case 'trials': return formatNumber(val.trials || 0);
                            case 'newMembers': return formatNumber(val.newMembers || 0);
                            case 'converted': return formatNumber(val.converted || 0);
                            case 'retained': return formatNumber(val.retained || 0);
                            case 'conversionRate': return `${(val.conversionRate || 0).toFixed(1)}%`;
                            case 'retentionRate': return `${(val.retentionRate || 0).toFixed(1)}%`;
                            case 'avgLTV': return formatCurrency(val.avgLTV || 0);
                            case 'totalLTV': return formatCurrency(val.totalLTV || 0);
                            case 'avgConversionDays': return `${(val.avgConversionDays || 0).toFixed(0)}`;
                            case 'avgVisits': return `${(val.avgVisits || 0).toFixed(1)}`;
                          }
                        })()}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="retention-totals-row border-t-4 border-purple-700 font-bold" style={{ ...totalsRowStyle, maxHeight: '35px' }}>
                <td className="sticky left-0 z-10 border-r px-4 py-2 text-sm" style={{ ...totalsCellStyle, width: '300px', minWidth: '300px', maxHeight: '35px' }}>TOTALS</td>
                {months.map((m, index) => {
                  const prevMonth = index > 0 ? months[index - 1] : null;
                  const nextMonth = index < months.length - 1 ? months[index + 1] : null;
                  
                  const isFirstOfGroup = !prevMonth || prevMonth.month !== m.month;
                  const isLastOfGroup = !nextMonth || nextMonth.month !== m.month;
                  
                  const cellData = totalsRow[m.key];
                  
                  return (
                    <td 
                      key={m.key} 
                      className={`cursor-pointer px-2 py-2 text-center text-sm font-mono ${
                        isFirstOfGroup ? 'border-l-2' : 'border-l'
                      } ${
                        isLastOfGroup ? 'border-r-2' : ''
                      }`}
                      style={{ ...totalsCellStyle, maxHeight: '35px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const clients = cellData?.clients || [];
                        onRowClick?.({ 
                          rowKey: 'TOTALS', 
                          rowType,
                          month: m.month,
                          year: m.year,
                          data: cellData,
                          metric,
                          clients: clients
                        });
                      }}
                    >
                      {(() => {
                        const val = cellData || {};
                        switch (metric) {
                          case 'trials': return formatNumber(val.trials || 0);
                          case 'newMembers': return formatNumber(val.newMembers || 0);
                          case 'converted': return formatNumber(val.converted || 0);
                          case 'retained': return formatNumber(val.retained || 0);
                          case 'conversionRate': return `${(val.conversionRate || 0).toFixed(1)}%`;
                          case 'retentionRate': return `${(val.retentionRate || 0).toFixed(1)}%`;
                          case 'avgLTV': return formatCurrency(val.avgLTV || 0);
                          case 'totalLTV': return formatCurrency(val.totalLTV || 0);
                          case 'avgConversionDays': return `${(val.avgConversionDays || 0).toFixed(0)}`;
                          case 'avgVisits': return `${(val.avgVisits || 0).toFixed(1)}`;
                        }
                      })()}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientRetentionYearOnYearPivot;
