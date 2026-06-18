import React from 'react';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { Copy, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  asOverviewCharts,
  asOverviewTables,
  DATA_LAB_DASHBOARD_ASSETS_UPDATED_EVENT,
  getDataLabAssetsForModule,
  updateDataLabTableInModule,
} from '@/services/dataLabDashboardBridge';
import type {
  OverviewAccent,
  OverviewChartDefinition,
  OverviewMetricCard,
  OverviewModuleContent,
  OverviewModuleId,
  OverviewRankingDefinition,
  OverviewTableColumn,
  OverviewTableDefinition,
} from './types';
import { formatOverviewValue } from './filtering';
import { buildClipboardHtml, buildElementPayload } from '@/utils/elementCopy';

const accentStyles: Record<
  OverviewAccent,
  {
    border: string;
    icon: string;
    badge: string;
  }
> = {
  emerald: {
    border: 'border-t-emerald-500',
    icon: 'bg-emerald-500/15 text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  blue: {
    border: 'border-t-blue-500',
    icon: 'bg-blue-500/15 text-blue-700',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  purple: {
    border: 'border-t-purple-500',
    icon: 'bg-purple-500/15 text-purple-700',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  rose: {
    border: 'border-t-rose-500',
    icon: 'bg-rose-500/15 text-rose-700',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  amber: {
    border: 'border-t-amber-500',
    icon: 'bg-amber-500/15 text-amber-700',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  teal: {
    border: 'border-t-teal-500',
    icon: 'bg-teal-500/15 text-teal-700',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  indigo: {
    border: 'border-t-indigo-500',
    icon: 'bg-indigo-500/15 text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  slate: {
    border: 'border-t-slate-500',
    icon: 'bg-slate-500/15 text-slate-700',
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
  },
};

const copyElement = async (element: HTMLElement, title: string) => {
  const payload = buildElementPayload(element, title);
  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([buildClipboardHtml(payload)], { type: 'text/html' }),
        'text/plain': new Blob([payload.text], { type: 'text/plain' }),
      }),
    ]);
    return;
  }
  await navigator.clipboard.writeText(payload.text);
};

const MetricCardItem: React.FC<{ card: OverviewMetricCard }> = ({ card }) => {
  const { toast } = useToast();
  const Icon = card.icon;
  const styles = accentStyles[card.accent];
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="absolute right-3 top-3 z-10 h-8 gap-1 rounded-full bg-white/95"
        onClick={async () => {
          if (!ref.current) return;
          try {
            await copyElement(ref.current, card.title);
            toast({ title: 'Metric copied', description: `${card.title} copied to clipboard.` });
          } catch (error) {
            toast({ title: 'Copy failed', description: error instanceof Error ? error.message : 'Unable to copy metric', variant: 'destructive' });
          }
        }}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Card data-copyable-element="true" data-copy-title={card.title} className={cn('border border-slate-200 shadow-sm border-t-4 bg-white', styles.border)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.title}</p>
            <p className="text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-600">{card.description}</p>
          </div>
          <div className={cn('rounded-2xl p-3 shadow-sm', styles.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
      </Card>
    </div>
  );
};

const ChartCard: React.FC<{ chart: OverviewChartDefinition }> = ({ chart }) => {
  const { toast } = useToast();
  const [mode, setMode] = React.useState<'bar' | 'line'>('bar');
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="absolute right-3 top-3 z-10 h-8 gap-1 rounded-full bg-white/95"
        onClick={async () => {
          if (!ref.current) return;
          try {
            await copyElement(ref.current, chart.title);
            toast({ title: 'Chart copied', description: `${chart.title} copied to clipboard.` });
          } catch (error) {
            toast({ title: 'Copy failed', description: error instanceof Error ? error.message : 'Unable to copy chart', variant: 'destructive' });
          }
        }}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Card data-copyable-element="true" data-copy-title={chart.title} className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg text-slate-900">{chart.title}</CardTitle>
            <CardDescription className="text-slate-600">{chart.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={mode === 'bar' ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setMode('bar')}
            >
              Bar
            </Button>
            <Button
              size="sm"
              variant={mode === 'line' ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setMode('line')}
            >
              Line
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chart.data.length ? (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              {mode === 'bar' ? (
                <BarChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey={chart.xKey} tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatOverviewValue(value as number, chart.format)} />
                  <Legend />
                  {chart.series.map((series) => (
                    <Bar
                      key={series.key}
                      dataKey={series.key}
                      name={series.label}
                      fill={series.color}
                      radius={[8, 8, 0, 0]}
                    />
                  ))}
                </BarChart>
              ) : (
                <LineChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey={chart.xKey} tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatOverviewValue(value as number, chart.format)} />
                  <Legend />
                  {chart.series.map((series) => (
                    <Line
                      key={series.key}
                      dataKey={series.key}
                      name={series.label}
                      stroke={series.color}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      type="monotone"
                    />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            {chart.emptyMessage ?? 'No chart data available for the active filters.'}
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
};

const RankingCard: React.FC<{ ranking: OverviewRankingDefinition }> = ({ ranking }) => {
  const { toast } = useToast();
  const styles = accentStyles[ranking.accent];
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="absolute right-3 top-3 z-10 h-8 gap-1 rounded-full bg-white/95"
        onClick={async () => {
          if (!ref.current) return;
          try {
            await copyElement(ref.current, ranking.title);
            toast({ title: 'List copied', description: `${ranking.title} copied to clipboard.` });
          } catch (error) {
            toast({ title: 'Copy failed', description: error instanceof Error ? error.message : 'Unable to copy list', variant: 'destructive' });
          }
        }}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Card data-copyable-element="true" data-copy-title={ranking.title} className="border border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg text-slate-900">{ranking.title}</CardTitle>
            <CardDescription className="text-slate-600">{ranking.description}</CardDescription>
          </div>
          <Badge variant="outline" className={styles.badge}>
            {ranking.entries.length} ranked
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {ranking.entries.length ? (
          ranking.entries.map((entry, index) => (
            <div
              key={`${ranking.id}-${entry.label}`}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {index + 1}. {entry.label}
                </p>
                {entry.secondary ? <p className="text-xs text-slate-500">{entry.secondary}</p> : null}
              </div>
              <p className="text-sm font-bold text-slate-900">{formatOverviewValue(entry.value, ranking.format)}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No ranking data available for the active filters.
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
};

const renderCell = (value: string | number, column: OverviewTableColumn) => formatOverviewValue(value, column.format);

const TableCard: React.FC<{
  moduleId: OverviewModuleId;
  table: OverviewTableDefinition;
  isCustomTable: boolean;
}> = ({ moduleId, table, isCustomTable }) => {
  const { toast } = useToast();
  const [isCustomizing, setIsCustomizing] = React.useState(false);
  const [tableTitle, setTableTitle] = React.useState(table.title);
  const [tableDescription, setTableDescription] = React.useState(table.description);
  const [visibleRows, setVisibleRows] = React.useState(Math.min(Math.max(table.rows.length, 8), 30));
  const [editableColumns, setEditableColumns] = React.useState(table.columns);
  const [editableRows, setEditableRows] = React.useState(table.rows);

  React.useEffect(() => {
    setTableTitle(table.title);
    setTableDescription(table.description);
    setEditableColumns(table.columns);
    setEditableRows(table.rows);
    setVisibleRows(Math.min(Math.max(table.rows.length, 8), 30));
  }, [table]);

  const saveCustomTable = () => {
    if (!isCustomTable) return;
    updateDataLabTableInModule(moduleId, table.id, (current) => ({
      ...current,
      title: tableTitle.trim() || current.title,
      description: tableDescription.trim() || current.description,
      columns: editableColumns,
      rows: editableRows,
    }));
    setIsCustomizing(false);
  };

  const rowsToRender = editableRows.slice(0, visibleRows);
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="absolute right-3 top-3 z-10 h-8 gap-1 rounded-full bg-white/95"
        onClick={async () => {
          if (!ref.current) return;
          try {
            await copyElement(ref.current, table.title);
            toast({ title: 'Table copied', description: `${table.title} copied to clipboard.` });
          } catch (error) {
            toast({ title: 'Copy failed', description: error instanceof Error ? error.message : 'Unable to copy table', variant: 'destructive' });
          }
        }}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Card data-copyable-element="true" data-copy-title={table.title} className="border border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-slate-900">{tableTitle}</CardTitle>
            <CardDescription className="text-slate-600">{tableDescription}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">
              Rows
              <select
                value={String(visibleRows)}
                onChange={(event) => setVisibleRows(Number(event.target.value))}
                className="ml-2 h-8 rounded-md border border-slate-200 px-2 text-xs"
              >
                {[8, 12, 16, 20, 30, 50].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
            {isCustomTable ? (
              <>
                <Button type="button" size="sm" variant="outline" onClick={() => setIsCustomizing((prev) => !prev)}>
                  {isCustomizing ? 'Close Customize' : 'Customize Table'}
                </Button>
                {isCustomizing ? (
                  <Button type="button" size="sm" className="gap-1" onClick={saveCustomTable}>
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isCustomizing ? (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
            <label className="text-xs text-slate-700">
              Title
              <input
                value={tableTitle}
                onChange={(event) => setTableTitle(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-700">
              Description
              <input
                value={tableDescription}
                onChange={(event) => setTableDescription(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
              />
            </label>
          </div>
        ) : null}
        {rowsToRender.length ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  {editableColumns.map((column, columnIndex) => (
                    <TableHead
                      key={`${table.id}-${column.key}`}
                      className={cn(
                        'text-xs font-semibold uppercase tracking-[0.15em] text-slate-500',
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center'
                      )}
                    >
                      {isCustomizing && isCustomTable ? (
                        <input
                          value={column.label}
                          onChange={(event) =>
                            setEditableColumns((current) =>
                              current.map((item, idx) => (idx === columnIndex ? { ...item, label: event.target.value } : item))
                            )
                          }
                          className="h-7 w-full min-w-[120px] rounded-md border border-slate-300 bg-white px-1.5 text-[11px] normal-case tracking-normal text-slate-700"
                        />
                      ) : (
                        column.label
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsToRender.map((row, rowIndex) => (
                  <TableRow key={`${table.id}-${rowIndex}`}>
                    {editableColumns.map((column) => (
                      <TableCell
                        key={`${table.id}-${rowIndex}-${column.key}`}
                        className={cn(
                          'text-sm text-slate-700',
                          column.align === 'right' && 'text-right',
                          column.align === 'center' && 'text-center'
                        )}
                      >
                        {isCustomizing && isCustomTable ? (
                          <input
                            value={String(row[column.key] ?? '')}
                            onChange={(event) =>
                              setEditableRows((current) =>
                                current.map((item, idx) =>
                                  idx === rowIndex ? { ...item, [column.key]: event.target.value } : item
                                )
                              )
                            }
                            className="h-8 w-full min-w-[110px] rounded-md border border-slate-300 bg-white px-1.5 text-xs"
                          />
                        ) : (
                          renderCell(row[column.key] ?? '', column)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            {table.emptyMessage ?? 'No table data available for the active filters.'}
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
};

export const OverviewModuleView: React.FC<{ moduleId: OverviewModuleId; module: OverviewModuleContent }> = ({ moduleId, module }) => {
  const [customAssets, setCustomAssets] = React.useState(() => getDataLabAssetsForModule(moduleId));

  React.useEffect(() => {
    const reload = () => setCustomAssets(getDataLabAssetsForModule(moduleId));
    reload();

    window.addEventListener('storage', reload);
    window.addEventListener(DATA_LAB_DASHBOARD_ASSETS_UPDATED_EVENT, reload as EventListener);
    return () => {
      window.removeEventListener('storage', reload);
      window.removeEventListener(DATA_LAB_DASHBOARD_ASSETS_UPDATED_EVENT, reload as EventListener);
    };
  }, [moduleId]);

  const cards: OverviewMetricCard[] = React.useMemo(
    () => [
      ...module.cards,
      ...customAssets.cards.map((card) => ({
        id: card.id,
        title: card.title,
        value: card.value,
        description: card.description,
        icon: Sparkles,
        accent: card.accent,
      })),
    ],
    [module.cards, customAssets.cards]
  );

  const charts = React.useMemo(
    () => [...module.charts, ...asOverviewCharts(customAssets.charts)],
    [module.charts, customAssets.charts]
  );

  const tables = React.useMemo(
    () => [...module.tables, ...asOverviewTables(customAssets.tables)],
    [module.tables, customAssets.tables]
  );
  const customTableIds = React.useMemo(() => new Set(customAssets.tables.map((table) => table.id)), [customAssets.tables]);

  const hasCustomAssets = customAssets.cards.length || customAssets.charts.length || customAssets.tables.length;

  return (
    <div className="space-y-8">
      <Card className="border border-slate-200 bg-white/95 shadow-sm">
        <CardContent className="flex flex-col gap-2 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Overview Canvas</p>
          <h2 className="text-2xl font-bold text-slate-900">{module.title}</h2>
          <p className="max-w-3xl text-sm text-slate-600">{module.subtitle}</p>
          {hasCustomAssets ? (
            <div className="pt-2">
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                Custom Data Lab assets included in this module
              </Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCardItem key={card.id} card={card} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {charts.map((chart) => (
          <ChartCard key={chart.id} chart={chart} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RankingCard ranking={module.topRanking} />
        <RankingCard ranking={module.bottomRanking} />
      </section>

      <section className="grid grid-cols-1 gap-6">
        {tables.map((table) => (
          <TableCard key={table.id} moduleId={moduleId} table={table} isCustomTable={customTableIds.has(table.id)} />
        ))}
      </section>
    </div>
  );
};

export default OverviewModuleView;
