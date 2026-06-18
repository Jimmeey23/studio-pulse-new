import React from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  LineChart as LineChartIcon,
  Rows3,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExecutiveFilterSection } from '@/components/dashboard/ExecutiveFilterSection';
import { useSalesData } from '@/hooks/useSalesData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { cn } from '@/lib/utils';
import { getDashboardDefaultDateRange } from '@/utils/dateUtils';
import { buildPerformanceCommandCenter } from '@/components/dashboard/performance-command-center/buildPerformanceCommandCenter';
import type {
  PerformanceChart,
  PerformanceMetricCard,
  PerformanceRankingCriterion,
  PerformanceSection,
  PerformanceTable,
  PerformanceTableColumn,
  PerformanceValueFormat,
} from '@/components/dashboard/performance-command-center/types';
import { formatOverviewValue } from '@/components/dashboard/overview/filtering';
import { OVERVIEW_LOCATION_OPTIONS } from '@/components/dashboard/overview/filtering';

type ChartMode = 'bar' | 'line';

const MIN_CONSOLIDATED_MONTH_KEY = '2024-01';

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const metricOptions: Array<{ key: keyof ReturnType<typeof buildPerformanceCommandCenter>['monthlyRows'][number]; label: string; format: PerformanceValueFormat; color: string }> = [
  { key: 'salesRevenue', label: 'Sales Revenue', format: 'currency', color: '#059669' },
  { key: 'atv', label: 'ATV', format: 'currency', color: '#0284c7' },
  { key: 'uniqueMembers', label: 'Unique Members', format: 'number', color: '#7c3aed' },
  { key: 'classAverage', label: 'Class Average', format: 'number', color: '#d97706' },
  { key: 'fillRate', label: 'Fill Rate', format: 'percentage', color: '#e11d48' },
  { key: 'visitors', label: 'Visitors', format: 'number', color: '#0f766e' },
  { key: 'revenuePerVisit', label: 'Revenue/Visit', format: 'currency', color: '#4f46e5' },
  { key: 'lapsed', label: 'Lapsed', format: 'number', color: '#475569' },
];

const renderFormatted = (value: string | number, format?: PerformanceValueFormat) => {
  if (format === 'text') return String(value ?? '');
  return formatOverviewValue(value, format || 'text');
};

const buildConsolidatedMetricPivotTable = (
  monthlyRows: ReturnType<typeof buildPerformanceCommandCenter>['monthlyRows']
): PerformanceTable => {
  const currentMonthKey = getCurrentMonthKey();
  const months = [...monthlyRows]
    .filter((month) => month.monthKey >= MIN_CONSOLIDATED_MONTH_KEY && month.monthKey <= currentMonthKey)
    .sort((left, right) => left.monthKey.localeCompare(right.monthKey));
  const monthColumns: PerformanceTableColumn[] = months.map((month) => ({
    key: month.monthKey,
    label: month.monthLabel,
    align: 'right',
  }));

  return {
    id: 'consolidated-monthly-table',
    title: 'Consolidated Month-on-Month Values',
    description: 'Historical monthly values transposed for cross-metric comparison, with months as columns.',
    columns: [
      { key: 'metric', label: 'Metric' },
      ...monthColumns,
    ],
    rows: metricOptions.map((metric) => {
      const row: Record<string, string | number> = {
        metric: metric.label,
        __format: metric.format,
      };

      months.forEach((month) => {
        row[month.monthKey] = month[metric.key] as number;
      });

      return row;
    }),
  };
};

const trendTone = (card: PerformanceMetricCard) => {
  if (card.trend === 'flat') return 'text-slate-500 bg-slate-100';
  const positiveIsGood = card.id !== 'lapsed';
  const good = positiveIsGood ? card.trend === 'up' : card.trend === 'down';
  return good ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50';
};

const MetricCard = ({ card, index }: { card: PerformanceMetricCard; index: number }) => {
  const Icon = card.icon;
  const TrendIcon = card.trend === 'down' ? ArrowDownRight : ArrowUpRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="h-full overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60 transition-all duration-300 group-hover:border-slate-300 group-hover:shadow-xl">
        <CardContent className="relative p-5">
          <div className={cn('absolute inset-x-0 top-0 h-1', `bg-${card.accent}-500`, card.accent === 'slate' && 'bg-slate-500')} />
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{card.label}</p>
              <p className="text-3xl font-bold tracking-tight text-slate-950">{card.formattedValue}</p>
              <p className="min-h-10 text-sm leading-5 text-slate-600">{card.description}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-800 shadow-inner">
              <Icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <Badge variant="outline" className={cn('border-transparent text-xs font-semibold', trendTone(card))}>
              <TrendIcon className="mr-1 h-3.5 w-3.5" />
              {card.changePercent.toFixed(1)}% MoM
            </Badge>
            <span className="text-xs text-slate-400">latest month trend</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ChartModeControls = ({ mode, onModeChange }: { mode: ChartMode; onModeChange: (mode: ChartMode) => void }) => (
  <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
    <Button size="sm" variant={mode === 'bar' ? 'default' : 'ghost'} className="h-8 rounded-full gap-1.5" onClick={() => onModeChange('bar')}>
      <BarChart3 className="h-3.5 w-3.5" />
      Bar
    </Button>
    <Button size="sm" variant={mode === 'line' ? 'default' : 'ghost'} className="h-8 rounded-full gap-1.5" onClick={() => onModeChange('line')}>
      <LineChartIcon className="h-3.5 w-3.5" />
      Line
    </Button>
  </div>
);

const DashboardChart = ({ chart }: { chart: PerformanceChart }) => {
  const [mode, setMode] = React.useState<ChartMode>('bar');
  const data = chart.data.slice(0, 16);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-lg text-slate-950">{chart.title}</CardTitle>
          <CardDescription className="text-slate-600">{chart.description}</CardDescription>
        </div>
        <ChartModeControls mode={mode} onModeChange={setMode} />
      </CardHeader>
      <CardContent>
        {data.length ? (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              {mode === 'bar' ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey={chart.xKey} tick={{ fill: '#475569', fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={58} />
                  <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => {
                    const series = chart.series.find((item) => item.key === name);
                    return [renderFormatted(value as number, series?.format || chart.format), series?.label || String(name)];
                  }} />
                  <Legend />
                  {chart.series.map((series) => (
                    <Bar key={series.key} dataKey={series.key} name={series.label} fill={series.color} radius={[8, 8, 0, 0]} />
                  ))}
                </BarChart>
              ) : (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey={chart.xKey} tick={{ fill: '#475569', fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={58} />
                  <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => {
                    const series = chart.series.find((item) => item.key === name);
                    return [renderFormatted(value as number, series?.format || chart.format), series?.label || String(name)];
                  }} />
                  <Legend />
                  {chart.series.map((series) => (
                    <Line key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={series.color} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            No chart data available for the active filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DataTableCard = ({ table, fullHeight = false }: { table: PerformanceTable; fullHeight?: boolean }) => {
  const [visibleRows, setVisibleRows] = React.useState(10);
  const rows = table.rows.slice(0, visibleRows);
  const totalRow = React.useMemo(() => {
    if (!table.rows.length) return null;

    return table.columns.reduce<Record<string, string | number>>((accumulator, column, columnIndex) => {
      if (columnIndex === 0) {
        accumulator[column.key] = 'Total';
        return accumulator;
      }

      const numericValues = table.rows
        .map((row) => row[column.key])
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

      accumulator[column.key] = numericValues.length ? numericValues.reduce((sum, value) => sum + value, 0) : '';
      return accumulator;
    }, {});
  }, [table.columns, table.rows]);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-lg text-slate-950">{table.title}</CardTitle>
          <CardDescription className="text-slate-600">{table.description}</CardDescription>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Rows3 className="h-3.5 w-3.5" />
          Rows
          <select
            value={visibleRows}
            onChange={(event) => setVisibleRows(Number(event.target.value))}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
          >
            {[10, 15, 25, 50].map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </label>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className={cn('overflow-x-auto rounded-2xl border border-slate-200', fullHeight && 'max-h-[520px] overflow-y-auto')}>
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50">
                <TableRow>
                  {table.columns.map((column) => (
                    <TableHead key={column.key} className={cn('whitespace-nowrap text-xs font-semibold uppercase tracking-[0.14em] text-slate-500', column.align === 'right' && 'text-right', column.align === 'center' && 'text-center')}>
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, rowIndex) => (
                  <TableRow key={`${table.id}-${rowIndex}`} className="hover:bg-slate-50/80">
                    {table.columns.map((column: PerformanceTableColumn) => (
                      <TableCell key={`${table.id}-${rowIndex}-${column.key}`} className={cn('whitespace-nowrap text-sm text-slate-700', column.align === 'right' && 'text-right font-medium text-slate-900', column.align === 'center' && 'text-center')}>
                        {renderFormatted(
                          row[column.key] ?? '',
                          column.format ?? (column.key !== 'metric' ? (row.__format as PerformanceValueFormat | undefined) : undefined)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
              {totalRow ? (
                <TableFooter className="sticky bottom-0 bg-slate-950 text-white">
                  <TableRow className="border-t border-slate-700 bg-slate-950 hover:bg-slate-900">
                    {table.columns.map((column: PerformanceTableColumn) => (
                      <TableCell
                        key={`${table.id}-total-${column.key}`}
                        className={cn(
                          'whitespace-nowrap text-sm font-bold text-white',
                          column.align === 'right' && 'text-right',
                          column.align === 'center' && 'text-center'
                        )}
                      >
                        {renderFormatted(
                          totalRow[column.key] ?? '',
                          column.format ?? (column.key !== table.columns[0]?.key ? 'number' : undefined)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableFooter>
              ) : null}
            </Table>
          </div>
        ) : (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            No table data available for the active filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const RankingList = ({ title, criterion, entries }: { title: string; criterion: PerformanceRankingCriterion; entries: PerformanceRankingCriterion['top'] }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="mb-3 flex items-center justify-between">
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">{criterion.label}</Badge>
    </div>
    <div className="space-y-2">
      {entries.length ? entries.map((entry, index) => (
        <div key={`${title}-${criterion.id}-${entry.label}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{index + 1}. {entry.label}</p>
            {entry.secondary ? <p className="truncate text-xs text-slate-500">{entry.secondary}</p> : null}
          </div>
          <p className="whitespace-nowrap text-sm font-bold text-slate-950">{renderFormatted(entry.value, criterion.format)}</p>
        </div>
      )) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-8 text-center text-sm text-slate-500">
          No ranking data available.
        </div>
      )}
    </div>
  </div>
);

const RankingPanel = ({ criteria }: { criteria: PerformanceRankingCriterion[] }) => {
  const [selectedId, setSelectedId] = React.useState(criteria[0]?.id || '');
  const selected = criteria.find((criterion) => criterion.id === selectedId) || criteria[0];

  if (!selected) return null;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-lg text-slate-950">Top & Bottom Rankings</CardTitle>
          <CardDescription>Switch the ranking criteria to compare best and softest performers.</CardDescription>
        </div>
        <select
          value={selected.id}
          onChange={(event) => setSelectedId(event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
        >
          {criteria.map((criterion) => (
            <option key={criterion.id} value={criterion.id}>{criterion.label}</option>
          ))}
        </select>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankingList title="Top Ranking" criterion={selected} entries={selected.top} />
        <RankingList title="Bottom Ranking" criterion={selected} entries={selected.bottom} />
      </CardContent>
    </Card>
  );
};

const ConsolidatedTrend = ({ model }: { model: ReturnType<typeof buildPerformanceCommandCenter> }) => {
  const [selectedMetric, setSelectedMetric] = React.useState(metricOptions[0]);
  const chartData = React.useMemo(() => [...model.monthlyRows].reverse(), [model.monthlyRows]);
  const consolidatedTable = React.useMemo(() => buildConsolidatedMetricPivotTable(model.monthlyRows), [model.monthlyRows]);

  return (
    <section className="grid grid-cols-1 gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.7fr)]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-xl text-slate-950">Month-on-Month Command Trend</CardTitle>
              <CardDescription>Choose one of the eight executive metrics to inspect historical movement.</CardDescription>
            </div>
            <select
              value={selectedMetric.key}
              onChange={(event) => setSelectedMetric(metricOptions.find((option) => option.key === event.target.value) || metricOptions[0])}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
            >
              {metricOptions.map((option) => (
                <option key={String(option.key)} value={String(option.key)}>{option.label}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
            {chartData.length ? (
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="performanceTrendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={selectedMetric.color} stopOpacity={0.32} />
                        <stop offset="95%" stopColor={selectedMetric.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="monthLabel" tick={{ fill: '#475569', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                    <Tooltip formatter={(value) => renderFormatted(value as number, selectedMetric.format)} />
                    <Area type="monotone" dataKey={selectedMetric.key} name={selectedMetric.label} stroke={selectedMetric.color} strokeWidth={3} fill="url(#performanceTrendFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                No monthly trend data available for the selected studio.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-slate-950 text-white shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <CardTitle className="text-xl text-white">Written Summary</CardTitle>
            </div>
            <CardDescription className="text-slate-300">Auto-generated operating readout from the consolidated metrics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {model.summary.map((item, index) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Insight {index + 1}</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <DataTableCard
        fullHeight
        table={consolidatedTable}
      />
    </section>
  );
};

const PerformanceSectionView = ({ section }: { section: PerformanceSection }) => (
  <motion.section
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className="space-y-6"
  >
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-8 md:flex-row md:items-end md:justify-between">
      <div>
        <Badge variant="outline" className="mb-3 border-slate-200 bg-white text-slate-600">Performance Section</Badge>
        <h2 className="text-3xl font-bold tracking-tight text-slate-950">{section.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{section.subtitle}</p>
      </div>
    </div>
    <DataTableCard table={section.table} fullHeight />
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {section.charts.map((chart) => (
        <DashboardChart key={chart.id} chart={chart} />
      ))}
    </div>
    <RankingPanel criteria={section.rankingCriteria} />
  </motion.section>
);

const PerformanceCommandCenter = () => {
  const navigate = useNavigate();
  const { filters, updateFilters } = useGlobalFilters();
  const { setLoading } = useGlobalLoading();

  const salesData = useSalesData();
  const sessionsData = useSessionsData();
  const leadsData = useLeadsData();
  const newClientsData = useNewClientData();
  const payrollData = usePayrollData();
  const checkinsData = useCheckinsData();
  const expirationsData = useExpirationsData();

  const isLoading =
    salesData.loading ||
    sessionsData.loading ||
    leadsData.loading ||
    newClientsData.loading ||
    payrollData.isLoading ||
    checkinsData.loading ||
    expirationsData.loading;

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLoading(false);
    }, 750);

    return () => window.clearTimeout(timeoutId);
  }, [setLoading]);

  const model = React.useMemo(
    () =>
      buildPerformanceCommandCenter({
        sales: salesData.data || [],
        sessions: sessionsData.data || [],
        leads: leadsData.data || [],
        newClients: newClientsData.data || [],
        payroll: payrollData.data || [],
        checkins: checkinsData.data || [],
        expirations: expirationsData.data || [],
        filters: {
          dateRange: filters.dateRange,
          location: filters.location,
        },
      }),
    [salesData.data, sessionsData.data, leadsData.data, newClientsData.data, payrollData.data, checkinsData.data, expirationsData.data, filters]
  );

  const clearToDefault = React.useCallback(() => {
    updateFilters({ dateRange: getDashboardDefaultDateRange(), location: ['Kwality House'] });
  }, [updateFilters]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f8fafc_0,#ffffff_35%,#f1f5f9_100%)]">
      <main className="container mx-auto space-y-8 px-6 py-8">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-300/50"
        >
          <div className="relative p-8 md:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(14,165,233,0.18),rgba(124,58,237,0.16),rgba(16,185,129,0.12))]" />
            <div className="absolute right-8 top-8 hidden h-32 w-32 rounded-full border border-white/10 md:block" />
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 gap-2 text-slate-300 hover:bg-white/10 hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                  Back to dashboard
                </Button>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Physique 57 India</p>
                <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-6xl">Performance Command Center</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                  A consolidated operating view across revenue, attendance, conversion, instructor performance, format health, and lapsed member pressure.
                </p>
                {isLoading ? (
                  <Badge variant="outline" className="mt-5 border-white/15 bg-white/10 text-slate-200">
                    Source data is still syncing; visible panels update as each dataset arrives.
                  </Badge>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sections</p>
                  <p className="mt-1 text-3xl font-bold text-white">6</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Metrics</p>
                  <p className="mt-1 text-3xl font-bold text-white">8</p>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <ExecutiveFilterSection availableLocations={OVERVIEW_LOCATION_OPTIONS} showExportButton={false} onClearFilters={clearToDefault} />

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {model.metricCards.map((card, index) => (
            <MetricCard key={card.id} card={card} index={index} />
          ))}
        </section>

        <ConsolidatedTrend model={model} />

        <div className="space-y-10">
          {model.sections.map((section) => (
            <PerformanceSectionView key={section.id} section={section} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PerformanceCommandCenter;
