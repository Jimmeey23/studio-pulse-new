import React, { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar, ChevronDown, ChevronUp, Eye, Filter, Minus, TrendingDown, TrendingUp, ShrinkIcon, ExpandIcon, Percent, Star, Users, Target } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { cn } from '@/lib/utils';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { ModernTableWrapper } from './ModernTableWrapper';
import { useTableCopyContext } from '@/hooks/useTableCopyContext';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { formatNumber } from '@/utils/formatters';
import { generateStandardMonthRange } from '@/utils/dateUtils';
import { PersistentTableFooter } from './PersistentTableFooter';

type GroupKey = 'source' | 'stage' | 'center' | 'channel' | 'associate';
type MetricType = 'totalLeads' | 'trialsCompleted' | 'trialsScheduled' | 'convertedLeads' | 'ltv' | 'avgVisits';

interface FunnelMonthOnMonthTableProps {
  data: LeadsData[];
  onDrillDown?: (title: string, data: LeadsData[], type: string) => void;
}

const FunnelMonthOnMonthTable: React.FC<FunnelMonthOnMonthTableProps> = ({ data, onDrillDown }) => {
  const [groupKey, setGroupKey] = useState<GroupKey>('source');
  const [metric, setMetric] = useState<MetricType>('totalLeads');
  const [viewMode, setViewMode] = useState<'values' | 'growth'>('values');
  const [sortBy, setSortBy] = useState<'group' | 'total'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get context information for enhanced table copying
  const copyContext = useTableCopyContext();

  const handleSort = (column: 'group' | 'total') => {
    if (sortBy === column) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatNumber = (n: number) => new Intl.NumberFormat('en-IN').format(n);
  const formatPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
  const growthIcon = (n: number) => (n > 0 ? <TrendingUp className="w-3 h-3 text-green-600" /> : n < 0 ? <TrendingDown className="w-3 h-3 text-red-600" /> : <Minus className="w-3 h-3 text-slate-400" />);

  const months = useMemo(() => {
    // Full range from Jan 2024 to current month
    const start = new Date(2024, 0, 1);
    const now = new Date();
    const arr: string[] = [];
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
      arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return arr;
  }, []);

  // Display exactly Jan 2024 up to current month
  const displayMonths = months;

  const processedData = useMemo(() => {
    type Bucket = { totalLeads: number; trialsCompleted: number; trialsScheduled: number; convertedLeads: number; totalLTV: number; totalVisits: number };
    const emptyBucket = (): Bucket => ({ totalLeads: 0, trialsCompleted: 0, trialsScheduled: 0, convertedLeads: 0, totalLTV: 0, totalVisits: 0 });
    const map = new Map<string, { group: string; months: Map<string, Bucket>; totals: Bucket }>();

    const inc = (b: Bucket, l: LeadsData) => {
      b.totalLeads += 1;
      if (l.trialStatus === 'Trial Completed' || l.stage === 'Trial Completed') b.trialsCompleted += 1;
      const ts = (l.trialStatus || '').toLowerCase();
      const st = (l.stage || '').toLowerCase();
      if ((ts.includes('trial') && !ts.includes('completed')) || (st.includes('trial') && !st.includes('completed'))) b.trialsScheduled += 1;
      if (l.conversionStatus === 'Converted') b.convertedLeads += 1;
      b.totalLTV += l.ltv || 0;
      b.totalVisits += l.visits || 0;
    };

    data.forEach(l => {
      if (!l.createdAt) return;
      const d = new Date(l.createdAt);
      if (isNaN(d.getTime())) return;
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const gVal = ((l as any)[groupKey] as string) || 'Unknown';
      if (!map.has(gVal)) map.set(gVal, { group: gVal, months: new Map(), totals: emptyBucket() });
      const entry = map.get(gVal)!;
      if (!entry.months.has(mKey)) entry.months.set(mKey, emptyBucket());
      inc(entry.months.get(mKey)!, l);
      inc(entry.totals, l);
    });

    const metricVal = (b: Bucket) => {
      switch (metric) {
        case 'totalLeads': return b.totalLeads;
        case 'trialsCompleted': return b.trialsCompleted;
        case 'trialsScheduled': return b.trialsScheduled;
        case 'convertedLeads': return b.convertedLeads;
        case 'ltv': return b.totalLeads > 0 ? b.totalLTV / b.totalLeads : 0;
        case 'avgVisits': return b.totalLeads > 0 ? b.totalVisits / b.totalLeads : 0;
      }
    };

    const rows = Array.from(map.values()).map(r => {
      const totalVal = metricVal(r.totals) as number;
      return { group: r.group, months: r.months, totalVal };
    });

    return rows.sort((a, b) => {
      if (sortBy === 'group') return sortOrder === 'asc' ? a.group.localeCompare(b.group) : b.group.localeCompare(a.group);
      if (sortBy === 'total') return sortOrder === 'asc' ? (a.totalVal as number) - (b.totalVal as number) : (b.totalVal as number) - (a.totalVal as number);
    });
  }, [data, groupKey, metric, months, sortBy, sortOrder]);

  const tableVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
  const headerVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.2 } } };

  const tableRef = useRef<HTMLTableElement>(null);

  return (
    <motion.div variants={tableVariants} initial="hidden" animate="visible" className="w-full">
      <ModernTableWrapper
        title="Month-on-Month Performance"
        description={`Historical trends by ${groupKey} and ${metric}`}
        icon={<BarChart3 className="w-5 h-5 text-white" />}
        totalItems={processedData.length}
        showDisplayToggle={true}
        displayMode={viewMode}
        onDisplayModeChange={(mode) => setViewMode(mode as 'values' | 'growth')}
        showCollapseControls={false}
        tableRef={tableRef}
        contextInfo={{
          selectedMetric: metric,
          dateRange: copyContext.dateRange,
          filters: copyContext.filters,
          additionalInfo: {
            groupKey: groupKey,
            metric: metric,
            viewMode: viewMode,
            sortBy: sortBy,
            sortOrder: sortOrder,
            totalItems: processedData.length
          }
        }}
        headerControls={
          <div className="flex items-center gap-2">
            <select className="border border-white/30 bg-white/10 text-white rounded-md px-2 py-1 text-xs" value={groupKey} onChange={e => setGroupKey(e.target.value as GroupKey)}>
              <option value="source" className="text-slate-900">Group: Source</option>
              <option value="stage" className="text-slate-900">Group: Stage</option>
              <option value="center" className="text-slate-900">Group: Center</option>
              <option value="channel" className="text-slate-900">Group: Channel</option>
              <option value="associate" className="text-slate-900">Group: Associate</option>
            </select>
            <select className="border border-white/30 bg-white/10 text-white rounded-md px-2 py-1 text-xs" value={metric} onChange={e => setMetric(e.target.value as MetricType)}>
              <option value="totalLeads" className="text-slate-900">Metric: Total Leads</option>
              <option value="trialsCompleted" className="text-slate-900">Metric: Trials Completed</option>
              <option value="trialsScheduled" className="text-slate-900">Metric: Trials Scheduled</option>
              <option value="convertedLeads" className="text-slate-900">Metric: Converted Leads</option>
              <option value="ltv" className="text-slate-900">Metric: Avg LTV</option>
              <option value="avgVisits" className="text-slate-900">Metric: Avg Visits</option>
            </select>
          </div>
        }
      >
        <div className="pt-0">
          <motion.div className="overflow-x-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {
              // Build ModernDataTable columns dynamically per month
            }
            {(() => {
              type Bucket = { totalLeads: number; trialsCompleted: number; trialsScheduled: number; convertedLeads: number; totalLTV: number; totalVisits: number };
              const metricVal = (b: Bucket | undefined): number => {
                if (!b) return 0;
                switch (metric) {
                  case 'totalLeads': return b.totalLeads;
                  case 'trialsCompleted': return b.trialsCompleted;
                  case 'trialsScheduled': return b.trialsScheduled;
                  case 'convertedLeads': return b.convertedLeads;
                  case 'ltv': return b.totalLeads > 0 ? b.totalLTV / b.totalLeads : 0;
                  case 'avgVisits': return b.totalLeads > 0 ? b.totalVisits / b.totalLeads : 0;
                }
              };

              const columns: any[] = [
                {
                  key: 'group',
                  header: 'Group',
                  align: 'left' as const,
                  className: 'min-w-[160px] sticky left-0 bg-white',
                  render: (value: string) => (
                    <div className="font-semibold text-slate-700 truncate">{value}</div>
                  )
                },
                ...displayMonths.map((mKey, idx) => ({
                  key: mKey,
                  header: new Date(mKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                  align: 'center' as const,
                  className: 'min-w-[90px]',
                  render: (_: any, row: any) => {
                    if (viewMode === 'values') {
                      const v = metricVal(row.months.get(mKey));
                      return <div className="text-xs font-medium text-slate-700">{metric === 'ltv' || metric === 'avgVisits' ? v.toFixed(1) : formatNumber(v)}</div>;
                    }
                    // growth mode vs previous displayed month
                    const prevKey = displayMonths[idx - 1];
                    if (!prevKey) return <span className="text-slate-400 text-xs">-</span>;
                    const curr = metricVal(row.months.get(mKey));
                    const prev = metricVal(row.months.get(prevKey));
                    const growth = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
                    return (
                      <div className={cn('text-xs font-semibold', growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-slate-500')}>
                        {growth === 0 ? '0.0%' : `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`}
                      </div>
                    );
                  }
                }))
              ];

              // Build totals row per month
              const totalsMap = new Map<string, Bucket>();
              processedData.forEach((row: any) => {
                displayMonths.forEach(mKey => {
                  const b = row.months.get(mKey) as Bucket | undefined;
                  if (!totalsMap.has(mKey)) totalsMap.set(mKey, { totalLeads: 0, trialsCompleted: 0, trialsScheduled: 0, convertedLeads: 0, totalLTV: 0, totalVisits: 0 });
                  const acc = totalsMap.get(mKey)!;
                  if (b) {
                    acc.totalLeads += b.totalLeads;
                    acc.trialsCompleted += b.trialsCompleted;
                    acc.trialsScheduled += b.trialsScheduled;
                    acc.convertedLeads += b.convertedLeads;
                    acc.totalLTV += b.totalLTV;
                    acc.totalVisits += b.totalVisits;
                  }
                });
              });

              // Pre-format footer data to extract the selected metric value for each month
              const footerData: Record<string, any> = { group: 'TOTALS' };
              displayMonths.forEach((mKey, idx) => {
                const bucket = totalsMap.get(mKey);
                if (viewMode === 'values') {
                  const v = metricVal(bucket);
                  footerData[mKey] = metric === 'ltv' || metric === 'avgVisits' ? v.toFixed(1) : formatNumber(v);
                } else {
                  // growth mode vs previous displayed month
                  const prevKey = displayMonths[idx - 1];
                  if (!prevKey) {
                    footerData[mKey] = '-';
                  } else {
                    const curr = metricVal(bucket);
                    const prevBucket = totalsMap.get(prevKey);
                    const prev = metricVal(prevBucket);
                    const growth = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
                    footerData[mKey] = growth === 0 ? '0.0%' : `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
                  }
                }
              });

              const table = (
                <ModernDataTable
                  data={processedData}
                  columns={columns}
                  loading={false}
                  stickyHeader={true}
                  showFooter={true}
                  footerData={footerData}
                  maxHeight="480px"
                  className="rounded-lg"
                  headerGradient="from-slate-800 via-slate-900 to-slate-800"
                  onRowClick={onDrillDown ? (row) => {
                    // Filter data based on the group value and pass to drill down
                    const filteredData = data.filter(lead => {
                      const leadValue = ((lead as any)[groupKey] as string) || 'Unknown';
                      return leadValue === row.group;
                    });
                    onDrillDown(`${groupKey}: ${row.group}`, filteredData, 'month-on-month');
                  } : undefined}
                />
              );
              // Simple AI notes based on displayed metric
              const aiNotes: string[] = [];
              if (processedData.length > 0) {
                const latestKey = displayMonths[displayMonths.length - 1];
                const best = [...processedData]
                  .map(r => ({ name: r.group, v: metricVal(r.months.get(latestKey)) }))
                  .sort((a,b) => (b.v - a.v))[0];
                if (best && best.v > 0) aiNotes.push(`Top ${groupKey} in the latest month: ${best.name} (${metric === 'ltv' || metric === 'avgVisits' ? best.v.toFixed(1) : formatNumber(best.v)})`);
                if (viewMode === 'growth') {
                  const idx = displayMonths.length - 1;
                  const prevKey = displayMonths[idx - 1];
                  if (prevKey) {
                    const growths = processedData.map(r => {
                      const curr = metricVal(r.months.get(latestKey));
                      const prev = metricVal(r.months.get(prevKey));
                      return { name: r.group, g: prev > 0 ? ((curr - prev) / prev) * 100 : 0 };
                    });
                    const topG = [...growths].sort((a,b) => b.g - a.g)[0];
                    if (topG && (topG.g !== 0)) aiNotes.push(`Strongest MoM growth: ${topG.name} (${topG.g > 0 ? '+' : ''}${topG.g.toFixed(1)}%)`);
                  }
                }
              }
              return (
                <div>
                  {table}
                  <div className="border-t border-slate-200 p-4 bg-slate-50 mt-2 rounded-b-xl">
                    <div className="text-sm font-bold text-slate-700 mb-2">AI Notes</div>
                    {aiNotes.length ? (
                      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                        {aiNotes.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    ) : (
                      <div className="text-xs text-slate-500">No notable anomalies detected in the selected view.</div>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </div>
      </ModernTableWrapper>
    </motion.div>
  );
};

export default FunnelMonthOnMonthTable;