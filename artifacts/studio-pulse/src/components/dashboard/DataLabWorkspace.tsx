import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Database,
  Filter,
  Gauge,
  Link2,
  Network,
  Plus,
  Search,
  Save,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Trash2,
  Wand2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { overviewModules } from '@/components/dashboard/overview/registry';
import type { OverviewAccent, OverviewModuleId, OverviewValueFormat } from '@/components/dashboard/overview/types';
import {
  addDataLabCardToModule,
  addDataLabChartToModule,
  addDataLabTableToModule,
} from '@/services/dataLabDashboardBridge';

const STORAGE_KEY = 'p57-data-lab-views-v2';
const STORAGE_ACTIVE_KEY = 'p57-data-lab-active-view-v2';
const STORAGE_FIELD_GROUPS_KEY = 'p57-data-lab-field-groups-v1';
const STORAGE_TARGET_MODULE_KEY = 'p57-data-lab-dashboard-module-v1';

type RowData = Record<string, any>;
type DateBucket = 'none' | 'day' | 'week' | 'month' | 'quarter' | 'year';
type DateFormat = 'dd-mmm-yyyy' | 'mmm-yyyy' | 'yyyy-mm-dd' | 'dd-mm-yyyy';
type ValueFormat = 'number' | 'currency' | 'percent';
type RevenueScale = 'auto' | 'full' | 'K' | 'L' | 'Cr';
type JoinType = 'left' | 'inner';
type ChartType = 'bar' | 'line' | 'area' | 'pie';
type FilterOperator = 'equals' | 'not_equals' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
type Aggregate =
  | 'sum'
  | 'count'
  | 'counta'
  | 'countunique'
  | 'avg'
  | 'mean'
  | 'median'
  | 'mode'
  | 'min'
  | 'max'
  | 'p25'
  | 'p75'
  | 'range'
  | 'stddev'
  | 'variance';

interface FieldMeta {
  name: string;
  type: 'number' | 'date' | 'string';
  sampleValues: string[];
}

interface FieldGroupType {
  type: 'date' | 'string' | 'number';
  fields: FieldMeta[];
}

interface FieldGroupSource {
  sourceKey: string;
  sourceLabel: string;
  types: FieldGroupType[];
}

interface UsedFieldSummary {
  field: string;
  label: string;
  sourceKey: string;
  sourceLabel: string;
  type: FieldMeta['type'];
  usage: Array<'row' | 'column' | 'value'>;
}

interface ValueFieldConfig {
  id: string;
  field: string;
  label: string;
  aggregate: Aggregate;
  format: ValueFormat;
  postProcess: 'none' | 'share_of_total' | 'row_percent' | 'running_total';
  decimalsOverride: -1 | 0 | 1 | 2 | 3 | 4;
  revenueScaleOverride: RevenueScale | 'inherit';
  accentColor: string;
}

interface FilterRule {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
  valueTo?: string;
}

interface RelationshipConfig {
  source: string;
  leftKey: string;
  rightKey: string;
  joinType: JoinType;
}

interface StyleConfig {
  sheetPreset: 'airtable' | 'numbers' | 'excel' | 'classic';
  theme: 'slate' | 'indigo' | 'emerald' | 'rose' | 'mono';
  wrapCells: boolean;
  dense: boolean;
  zebra: boolean;
  bordered: boolean;
  rounded: boolean;
  freezeHeader: boolean;
  freezeFirstColumns: boolean;
  freezeTotalsRow: boolean;
  showRowHover: boolean;
}

interface ProcessingConfig {
  rowLimit: number;
  rowMode: 'top' | 'bottom' | 'all';
  filterLogic: 'and' | 'or';
  sortMetricKey: string;
  sortDirection: 'asc' | 'desc';
  columnSortDirection: 'asc' | 'desc';
  showTotals: boolean;
  showSubtotals: boolean;
  nullHandling: 'zero' | 'ignore';
}

interface PivotConfig {
  primarySource: string;
  relationship: RelationshipConfig;
  rowFields: string[];
  columnFields: string[];
  valueFields: ValueFieldConfig[];
  headerAliases: Record<string, string>;
  cellOverrides: Record<string, string>;
  filterRules: FilterRule[];
  dateBucket: DateBucket;
  dateFormat: DateFormat;
  revenueScale: RevenueScale;
  decimals: number;
  chartType: ChartType;
  columnWidths: Record<string, number>;
  style: StyleConfig;
  processing: ProcessingConfig;
}

interface SavedView {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  config: PivotConfig;
}

interface DataLabWorkspaceProps {
  dataSources: Record<string, RowData[]>;
}

interface CellAccumulator {
  rowCount: number;
  countA: number;
  numericValues: number[];
  rawValues: string[];
  uniqueValues: Set<string>;
  sum: number;
  min: number;
  max: number;
}

interface MatrixRow {
  id: string;
  labels: string[];
  groupLabel: string;
  baseValues: Record<string, number>;
  values: Record<string, number>;
  isSubtotal?: boolean;
}

const AGGREGATE_OPTIONS: Array<{ value: Aggregate; label: string }> = [
  { value: 'sum', label: 'Sum' },
  { value: 'count', label: 'Count (Rows)' },
  { value: 'counta', label: 'CountA (Non-empty)' },
  { value: 'countunique', label: 'Count Unique' },
  { value: 'avg', label: 'Average' },
  { value: 'mean', label: 'Mean' },
  { value: 'median', label: 'Median' },
  { value: 'mode', label: 'Mode' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'p25', label: 'Percentile 25 (P25)' },
  { value: 'p75', label: 'Percentile 75 (P75)' },
  { value: 'range', label: 'Range (Max - Min)' },
  { value: 'stddev', label: 'Std Dev' },
  { value: 'variance', label: 'Variance' },
];

const THEME_CLASS: Record<
  PivotConfig['style']['theme'],
  { header: string; headerSolid: string; subtotal: string; totals: string; cardTint: string }
> = {
  slate: {
    header: 'from-slate-900 via-slate-800 to-slate-900 text-white',
    headerSolid: 'bg-slate-900 text-white',
    subtotal: 'bg-slate-100 text-slate-900',
    totals: 'bg-slate-900 text-white',
    cardTint: 'from-slate-50 to-slate-100/40',
  },
  indigo: {
    header: 'from-indigo-900 via-indigo-800 to-slate-900 text-white',
    headerSolid: 'bg-indigo-900 text-white',
    subtotal: 'bg-indigo-50 text-indigo-900',
    totals: 'bg-indigo-900 text-white',
    cardTint: 'from-indigo-50 to-indigo-100/30',
  },
  emerald: {
    header: 'from-emerald-900 via-emerald-800 to-slate-900 text-white',
    headerSolid: 'bg-emerald-900 text-white',
    subtotal: 'bg-emerald-50 text-emerald-900',
    totals: 'bg-emerald-900 text-white',
    cardTint: 'from-emerald-50 to-emerald-100/30',
  },
  rose: {
    header: 'from-rose-900 via-rose-800 to-slate-900 text-white',
    headerSolid: 'bg-rose-900 text-white',
    subtotal: 'bg-rose-50 text-rose-900',
    totals: 'bg-rose-900 text-white',
    cardTint: 'from-rose-50 to-rose-100/30',
  },
  mono: {
    header: 'from-neutral-900 via-neutral-800 to-neutral-900 text-white',
    headerSolid: 'bg-neutral-900 text-white',
    subtotal: 'bg-neutral-100 text-neutral-900',
    totals: 'bg-neutral-900 text-white',
    cardTint: 'from-neutral-50 to-neutral-100/30',
  },
};

const PREVIEW_COLORS = ['#1d4ed8', '#0f766e', '#7c3aed', '#dc2626', '#0f172a', '#ea580c'];
const VALUE_COLOR_OPTIONS = ['#1d4ed8', '#0f766e', '#7c3aed', '#be123c', '#b45309', '#0f172a'];

const makeId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const toOverviewFormat = (valueFormat: ValueFormat): OverviewValueFormat =>
  valueFormat === 'currency' ? 'currency' : valueFormat === 'percent' ? 'percentage' : 'number';

const themeToAccent = (theme: StyleConfig['theme']): OverviewAccent => {
  if (theme === 'indigo') return 'indigo';
  if (theme === 'emerald') return 'emerald';
  if (theme === 'rose') return 'rose';
  if (theme === 'mono') return 'slate';
  return 'blue';
};

const isEmpty = (value: unknown) => value === null || value === undefined || value === '';

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const clean = trimmed.replace(/,/g, '').replace(/₹/g, '').replace(/%/g, '');
    if (!/^-?\d*\.?\d+$/.test(clean)) return null;
    const parsed = Number(clean);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toNumber = (value: unknown): number => {
  return parseNumeric(value) ?? 0;
};

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const raw = String(value).trim();
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  if (/^\d{2}\/\d{2}\/\d{4}/.test(raw)) {
    const [d, m, y] = raw.split(/[\/\s:-]/).map(Number);
    const candidate = new Date(y, m - 1, d);
    if (!Number.isNaN(candidate.getTime())) return candidate;
  }

  return null;
};

const normalizeValueKey = (value: unknown) => String(value ?? '').trim().toLowerCase();

const percentile = (sorted: number[], p: number) => {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sorted[low];
  const weight = idx - low;
  return sorted[low] * (1 - weight) + sorted[high] * weight;
};

const computeAggregate = (acc: CellAccumulator | undefined, aggregate: Aggregate): number => {
  if (!acc) return 0;
  const numericValues = acc.numericValues;

  if (aggregate === 'sum') return acc.sum;
  if (aggregate === 'count') return acc.rowCount;
  if (aggregate === 'counta') return acc.countA;
  if (aggregate === 'countunique') return acc.uniqueValues.size;
  if (aggregate === 'min') return acc.min === Number.POSITIVE_INFINITY ? 0 : acc.min;
  if (aggregate === 'max') return acc.max === Number.NEGATIVE_INFINITY ? 0 : acc.max;
  if (aggregate === 'range') {
    if (acc.min === Number.POSITIVE_INFINITY || acc.max === Number.NEGATIVE_INFINITY) return 0;
    return acc.max - acc.min;
  }

  if (!numericValues.length) return 0;

  if (aggregate === 'avg' || aggregate === 'mean') return acc.sum / numericValues.length;
  if (aggregate === 'median') {
    const sorted = [...numericValues].sort((a, b) => a - b);
    return percentile(sorted, 0.5);
  }
  if (aggregate === 'p25') {
    const sorted = [...numericValues].sort((a, b) => a - b);
    return percentile(sorted, 0.25);
  }
  if (aggregate === 'p75') {
    const sorted = [...numericValues].sort((a, b) => a - b);
    return percentile(sorted, 0.75);
  }
  if (aggregate === 'mode') {
    const freq = new Map<string, { count: number; numeric: number }>();
    numericValues.forEach(value => {
      const key = value.toFixed(6);
      const found = freq.get(key) || { count: 0, numeric: value };
      found.count += 1;
      freq.set(key, found);
    });
    let bestCount = -1;
    let bestValue = 0;
    freq.forEach(entry => {
      if (entry.count > bestCount) {
        bestCount = entry.count;
        bestValue = entry.numeric;
      }
    });
    return bestValue;
  }
  if (aggregate === 'variance' || aggregate === 'stddev') {
    const mean = acc.sum / numericValues.length;
    const variance =
      numericValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / numericValues.length;
    if (aggregate === 'variance') return variance;
    return Math.sqrt(variance);
  }
  return acc.sum;
};

const bucketDate = (date: Date, bucket: DateBucket): string => {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (bucket === 'year') return `${y}`;
  if (bucket === 'quarter') return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  if (bucket === 'month') return `${y}-${String(m).padStart(2, '0')}`;
  if (bucket === 'week') {
    const start = new Date(y, 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / 86400000);
    const week = Math.floor((days + start.getDay()) / 7) + 1;
    return `${y}-W${String(week).padStart(2, '0')}`;
  }
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const formatDateOption = (date: Date, format: DateFormat) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const mmm = date.toLocaleDateString('en-IN', { month: 'short' });
  const yyyy = date.getFullYear();
  if (format === 'yyyy-mm-dd') return `${yyyy}-${mm}-${dd}`;
  if (format === 'dd-mm-yyyy') return `${dd}/${mm}/${yyyy}`;
  if (format === 'mmm-yyyy') return `${mmm} ${yyyy}`;
  return `${dd} ${mmm} ${yyyy}`;
};

const renderBucketLabel = (bucketValue: string, bucket: DateBucket, dateFormat: DateFormat) => {
  if (bucket === 'year' || bucket === 'quarter' || bucket === 'week') return bucketValue;
  if (bucket === 'month') {
    const [y, m] = bucketValue.split('-').map(Number);
    if (!y || !m) return bucketValue;
    return formatDateOption(new Date(y, m - 1, 1), dateFormat === 'dd-mm-yyyy' ? 'mmm-yyyy' : dateFormat);
  }
  const parsed = parseDate(bucketValue);
  if (!parsed) return bucketValue;
  return formatDateOption(parsed, dateFormat);
};

const formatCurrencyWithScale = (value: number, scale: RevenueScale, decimals: number) => {
  const abs = Math.abs(value);
  let mode = scale;
  if (scale === 'auto') {
    if (abs >= 10000000) mode = 'Cr';
    else if (abs >= 100000) mode = 'L';
    else if (abs >= 1000) mode = 'K';
    else mode = 'full';
  }
  if (mode === 'full') {
    return `₹${value.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }
  const divisor = mode === 'Cr' ? 10000000 : mode === 'L' ? 100000 : 1000;
  return `₹${(value / divisor).toFixed(decimals)}${mode}`;
};

const formatMetric = (
  value: number,
  format: ValueFormat,
  revenueScale: RevenueScale,
  decimals: number,
) => {
  if (format === 'currency') return formatCurrencyWithScale(value, revenueScale, decimals);
  if (format === 'percent') return `${value.toFixed(decimals)}%`;
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatMetricForField = (value: number, valueField: ValueFieldConfig, config: PivotConfig) => {
  const decimals = valueField.decimalsOverride >= 0 ? valueField.decimalsOverride : config.decimals;
  const scale = valueField.revenueScaleOverride === 'inherit' ? config.revenueScale : valueField.revenueScaleOverride;
  return formatMetric(value, valueField.format, scale, decimals);
};

const inferFieldMeta = (rows: RowData[]): FieldMeta[] => {
  if (!rows.length) return [];
  const keys = new Set<string>();
  rows.slice(0, 500).forEach(row => {
    Object.keys(row || {}).forEach(key => keys.add(key));
  });

  return Array.from(keys)
    .sort((a, b) => a.localeCompare(b))
    .map(name => {
      const values = rows
        .map(row => row?.[name])
        .filter(value => !isEmpty(value))
        .slice(0, 100);

      const numericRatio = values.length
        ? values.filter(value => parseNumeric(value) !== null).length / values.length
        : 0;
      const dateRatio = values.length ? values.filter(value => parseDate(value)).length / values.length : 0;
      const type: FieldMeta['type'] =
        dateRatio >= 0.7 ? 'date' : numericRatio >= 0.7 ? 'number' : 'string';

      const sampleValues = Array.from(
        new Set(values.map(value => String(value).trim()).filter(Boolean)),
      )
        .slice(0, 150)
        .sort((a, b) => a.localeCompare(b));

      return { name, type, sampleValues };
    });
};

const makeDefaultConfig = (primarySource: string): PivotConfig => ({
  primarySource,
  relationship: {
    source: '',
    leftKey: '',
    rightKey: '',
    joinType: 'left',
  },
  rowFields: [],
  columnFields: [],
  valueFields: [],
  headerAliases: {},
  cellOverrides: {},
  filterRules: [],
  dateBucket: 'month',
  dateFormat: 'dd-mmm-yyyy',
  revenueScale: 'auto',
  decimals: 1,
  chartType: 'bar',
  columnWidths: {},
  style: {
    sheetPreset: 'airtable',
    theme: 'slate',
    wrapCells: false,
    dense: false,
    zebra: true,
    bordered: true,
    rounded: true,
    freezeHeader: true,
    freezeFirstColumns: true,
    freezeTotalsRow: false,
    showRowHover: true,
  },
  processing: {
    rowLimit: 100,
    rowMode: 'top',
    filterLogic: 'and',
    sortMetricKey: '',
    sortDirection: 'desc',
    columnSortDirection: 'asc',
    showTotals: true,
    showSubtotals: false,
    nullHandling: 'zero',
  },
});

const normalizePivotConfig = (rawConfig: any, fallbackSource: string): PivotConfig => {
  const base = makeDefaultConfig(fallbackSource);
  const raw = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};
  return {
    ...base,
    ...raw,
    relationship: {
      ...base.relationship,
      ...(raw.relationship || {}),
    },
    style: {
      ...base.style,
      ...(raw.style || {}),
    },
    processing: {
      ...base.processing,
      ...(raw.processing || {}),
      rowMode:
        raw.processing && ['top', 'bottom', 'all'].includes(raw.processing.rowMode)
          ? raw.processing.rowMode
          : base.processing.rowMode,
      filterLogic:
        raw.processing && ['and', 'or'].includes(raw.processing.filterLogic)
          ? raw.processing.filterLogic
          : base.processing.filterLogic,
      columnSortDirection:
        raw.processing && ['asc', 'desc'].includes(raw.processing.columnSortDirection)
          ? raw.processing.columnSortDirection
          : base.processing.columnSortDirection,
    },
    valueFields: Array.isArray(raw.valueFields) ? raw.valueFields : [],
    filterRules: Array.isArray(raw.filterRules) ? raw.filterRules : [],
    rowFields: Array.isArray(raw.rowFields) ? raw.rowFields : [],
    columnFields: Array.isArray(raw.columnFields) ? raw.columnFields : [],
    headerAliases:
      raw.headerAliases && typeof raw.headerAliases === 'object' && !Array.isArray(raw.headerAliases)
        ? raw.headerAliases
        : {},
    cellOverrides:
      raw.cellOverrides && typeof raw.cellOverrides === 'object' && !Array.isArray(raw.cellOverrides)
        ? raw.cellOverrides
        : {},
    columnWidths:
      raw.columnWidths && typeof raw.columnWidths === 'object' && !Array.isArray(raw.columnWidths)
        ? raw.columnWidths
        : {},
  };
};

const normalizeLoadedView = (view: any, fallbackSource: string): SavedView | null => {
  if (!view || typeof view !== 'object') return null;
  const cfg = normalizePivotConfig(view.config || {}, fallbackSource);
  return {
    id: typeof view.id === 'string' ? view.id : makeId('view'),
    name: typeof view.name === 'string' && view.name.trim() ? view.name : 'Data Lab View',
    createdAt: Number(view.createdAt) || Date.now(),
    updatedAt: Number(view.updatedAt) || Date.now(),
    config: {
      ...cfg,
      valueFields: Array.isArray(cfg.valueFields)
        ? cfg.valueFields.map((item: any) => ({
            id: item.id || makeId('value'),
            field: item.field || '',
            label: item.label || item.field || 'Value',
            aggregate: item.aggregate || item.agg || 'sum',
            format: item.format || 'number',
            postProcess: item.postProcess || 'none',
            decimalsOverride:
              typeof item.decimalsOverride === 'number' &&
              [-1, 0, 1, 2, 3, 4].includes(item.decimalsOverride)
                ? item.decimalsOverride
                : -1,
            revenueScaleOverride:
              item.revenueScaleOverride &&
              ['inherit', 'auto', 'full', 'K', 'L', 'Cr'].includes(item.revenueScaleOverride)
                ? item.revenueScaleOverride
                : 'inherit',
            accentColor:
              typeof item.accentColor === 'string' && item.accentColor.trim()
                ? item.accentColor
                : VALUE_COLOR_OPTIONS[0],
          }))
        : [],
      filterRules: Array.isArray(cfg.filterRules)
        ? cfg.filterRules.map((item: any) => ({
            id: item.id || makeId('filter'),
            field: item.field || '',
            operator: item.operator || 'equals',
            value: item.value || '',
            valueTo: item.valueTo || '',
          }))
        : [],
      rowFields: Array.isArray(cfg.rowFields) ? cfg.rowFields : [],
      columnFields: Array.isArray(cfg.columnFields) ? cfg.columnFields : [],
      columnWidths: cfg.columnWidths && typeof cfg.columnWidths === 'object' ? cfg.columnWidths : {},
    },
  };
};

const DatePickerCell: React.FC<{
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Select date' }) => {
  const selected = value ? parseDate(value) : null;
  const label = selected ? formatDateOption(selected, 'dd-mmm-yyyy') : placeholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-full justify-start font-normal">
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected || undefined}
          onSelect={date => onChange(date ? formatDateOption(date, 'yyyy-mm-dd') : '')}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export const DataLabWorkspace: React.FC<DataLabWorkspaceProps> = ({ dataSources = {} as Record<string, RowData[]> }) => {
  const { toast } = useToast();
  const safeDataSources = dataSources && typeof dataSources === 'object' ? dataSources : {};
  const sourceNames = useMemo(
    () =>
      Object.keys(safeDataSources)
        .filter(source => Array.isArray(safeDataSources[source]) && safeDataSources[source].length > 0)
        .sort((a, b) => a.localeCompare(b)),
    [safeDataSources],
  );

  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState('');
  const [fieldSearch, setFieldSearch] = useState('');
  const [workspacePage, setWorkspacePage] = useState<'workspace' | 'settings'>('workspace');
  const [showTopControls, setShowTopControls] = useState(false);
  const [inlineEditMode, setInlineEditMode] = useState(false);
  const [collapsedFieldGroupsByView, setCollapsedFieldGroupsByView] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [collapsedPivotGroupsByView, setCollapsedPivotGroupsByView] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [targetModuleId, setTargetModuleId] = useState<OverviewModuleId>(() => {
    if (typeof window === 'undefined') return 'sales-analytics';
    const saved = window.localStorage.getItem(STORAGE_TARGET_MODULE_KEY) as OverviewModuleId | null;
    return overviewModules.some((module) => module.id === saved) ? (saved as OverviewModuleId) : 'sales-analytics';
  });
  const [dragField, setDragField] = useState<{
    field: string;
    from: 'available' | 'rows' | 'columns' | 'values';
    fromIndex?: number;
    valueId?: string;
  } | null>(null);
  const stableViews = useMemo(
    () =>
      (Array.isArray(views) ? views : []).filter(
        (view): view is SavedView =>
          Boolean(
            view &&
            typeof view === 'object' &&
            (view as SavedView).id &&
            (view as SavedView).config &&
            typeof (view as SavedView).config === 'object',
          ),
      ),
    [views],
  );

  useEffect(() => {
    if (!sourceNames.length) return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const rawViews = stored ? JSON.parse(stored) : [];
      const normalized = Array.isArray(rawViews)
        ? rawViews
            .map(item => normalizeLoadedView(item, sourceNames[0]))
            .filter(Boolean) as SavedView[]
        : [];

      if (normalized.length) {
        setViews(normalized);
        const savedActive = window.localStorage.getItem(STORAGE_ACTIVE_KEY) || '';
        const validActive = normalized.some(view => view.id === savedActive)
          ? savedActive
          : normalized[0].id;
        setActiveViewId(validActive);
      } else {
        const first: SavedView = {
          id: makeId('view'),
          name: 'Data Lab View 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config: makeDefaultConfig(sourceNames[0]),
        };
        setViews([first]);
        setActiveViewId(first.id);
      }
    } catch {
      const first: SavedView = {
        id: makeId('view'),
        name: 'Data Lab View 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: makeDefaultConfig(sourceNames[0]),
      };
      setViews([first]);
      setActiveViewId(first.id);
    }
  }, [sourceNames]);

  useEffect(() => {
    if (!stableViews.length) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stableViews));
  }, [stableViews]);

  useEffect(() => {
    if (!activeViewId) return;
    window.localStorage.setItem(STORAGE_ACTIVE_KEY, activeViewId);
  }, [activeViewId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_TARGET_MODULE_KEY, targetModuleId);
  }, [targetModuleId]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_FIELD_GROUPS_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setCollapsedFieldGroupsByView(parsed as Record<string, Record<string, boolean>>);
      }
    } catch {
      // ignore invalid persisted state
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_FIELD_GROUPS_KEY, JSON.stringify(collapsedFieldGroupsByView));
  }, [collapsedFieldGroupsByView]);

  const activeView = useMemo(
    () => stableViews.find(view => view.id === activeViewId) || null,
    [stableViews, activeViewId],
  );
  const config = useMemo(() => {
    if (!activeView?.config) return null;
    const fallbackSource = activeView.config.primarySource || sourceNames[0] || '';
    const base = makeDefaultConfig(fallbackSource);
    const raw = activeView.config as any;

    return {
      ...base,
      ...raw,
      relationship: {
        ...base.relationship,
        ...(raw.relationship || {}),
      },
      style: {
        ...base.style,
        ...(raw.style || {}),
      },
      processing: {
        ...base.processing,
        ...(raw.processing || {}),
      },
      rowFields: Array.isArray(raw.rowFields) ? raw.rowFields : [],
      columnFields: Array.isArray(raw.columnFields) ? raw.columnFields : [],
      valueFields: Array.isArray(raw.valueFields) ? raw.valueFields : [],
      filterRules: Array.isArray(raw.filterRules) ? raw.filterRules : [],
      columnWidths:
        raw.columnWidths && typeof raw.columnWidths === 'object' && !Array.isArray(raw.columnWidths)
          ? raw.columnWidths
          : {},
    } as PivotConfig;
  }, [activeView, sourceNames]);
  const collapsedFieldGroups = useMemo(
    () => collapsedFieldGroupsByView[activeViewId] || {},
    [collapsedFieldGroupsByView, activeViewId],
  );
  const collapsedPivotGroups = useMemo(
    () => collapsedPivotGroupsByView[activeViewId] || {},
    [collapsedPivotGroupsByView, activeViewId],
  );

  const updateConfig = (updater: (current: PivotConfig) => PivotConfig) => {
    if (!activeViewId) return;
    setViews(current => {
      const currentViews = (Array.isArray(current) ? current : []).filter(
        (view): view is SavedView => Boolean(view && typeof view === 'object' && (view as SavedView).id),
      );
      return currentViews.map(view =>
        view.id === activeViewId
          ? (() => {
              const fallbackSource = view.config?.primarySource || sourceNames[0] || '';
              const normalizedCurrent = normalizePivotConfig(view.config, fallbackSource);
              const updated = updater(normalizedCurrent);
              return {
                ...view,
                updatedAt: Date.now(),
                config: normalizePivotConfig(updated, fallbackSource),
              };
            })()
          : view,
      );
    });
  };

  const updateViewName = (name: string) => {
    if (!activeViewId) return;
    setViews(current => {
      const currentViews = (Array.isArray(current) ? current : []).filter(
        (view): view is SavedView => Boolean(view && typeof view === 'object' && (view as SavedView).id),
      );
      return currentViews.map(view =>
        view.id === activeViewId
          ? {
              ...view,
              updatedAt: Date.now(),
              name,
            }
          : view,
      );
    });
  };

  const createView = () => {
    if (!sourceNames.length) return;
    const baseSource = config?.primarySource || sourceNames[0];
    const next: SavedView = {
      id: makeId('view'),
      name: `Data Lab View ${stableViews.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config: config ? { ...config, columnWidths: { ...(config.columnWidths || {}) } } : makeDefaultConfig(baseSource),
    };
    setViews(current => [next, ...(Array.isArray(current) ? current : [])]);
    setActiveViewId(next.id);
  };

  const deleteView = (id: string) => {
    setViews(current => {
      const currentViews = Array.isArray(current) ? current : [];
      const next = currentViews.filter(view => view && view.id !== id);
      if (!next.length && sourceNames.length) {
        const fallback: SavedView = {
          id: makeId('view'),
          name: 'Data Lab View 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config: makeDefaultConfig(sourceNames[0]),
        };
        setActiveViewId(fallback.id);
        return [fallback];
      }
      if (id === activeViewId && next.length) {
        setActiveViewId(next[0].id);
      }
      return next;
    });
  };

  const primaryRows = useMemo(() => {
    if (!config) return [] as RowData[];
    return (safeDataSources[config.primarySource] || []).map(row => ({ ...row }));
  }, [config, safeDataSources]);

  const primaryFields = useMemo(() => inferFieldMeta(primaryRows), [primaryRows]);

  const secondaryRows = useMemo(() => {
    if (!config?.relationship.source) return [] as RowData[];
    return (safeDataSources[config.relationship.source] || []).map(row => ({ ...row }));
  }, [config, safeDataSources]);

  const secondaryFields = useMemo(() => inferFieldMeta(secondaryRows), [secondaryRows]);

  const mergedRows = useMemo(() => {
    if (!config) return [] as RowData[];
    const relation = config.relationship;

    if (!relation.source || !relation.leftKey || !relation.rightKey || relation.source === config.primarySource) {
      return primaryRows;
    }

    const rightRows = safeDataSources[relation.source] || [];
    const lookup = new Map<string, RowData[]>();
    rightRows.forEach(row => {
      const key = normalizeValueKey(row?.[relation.rightKey]);
      if (!key) return;
      const bucket = lookup.get(key) || [];
      bucket.push(row);
      lookup.set(key, bucket);
    });

    const joined: RowData[] = [];
    primaryRows.forEach(leftRow => {
      const leftKey = normalizeValueKey(leftRow?.[relation.leftKey]);
      const matches = lookup.get(leftKey) || [];
      if (!matches.length && relation.joinType === 'left') {
        joined.push({ ...leftRow });
        return;
      }
      matches.forEach(rightRow => {
        const prefixed: RowData = {};
        Object.entries(rightRow || {}).forEach(([key, value]) => {
          prefixed[`${relation.source}.${key}`] = value;
        });
        joined.push({ ...leftRow, ...prefixed });
      });
    });

    return joined;
  }, [config, safeDataSources, primaryRows]);

  const relationshipDiagnostics = useMemo(() => {
    if (
      !config?.relationship.source ||
      !config.relationship.leftKey ||
      !config.relationship.rightKey ||
      config.relationship.source === config.primarySource
    ) {
      return null;
    }

    const rightRows = safeDataSources[config.relationship.source] || [];
    const rightCounts = new Map<string, number>();
    rightRows.forEach(row => {
      const key = normalizeValueKey(row?.[config.relationship.rightKey]);
      if (!key) return;
      rightCounts.set(key, (rightCounts.get(key) || 0) + 1);
    });

    let matchedLeftRows = 0;
    let totalRightMatches = 0;
    primaryRows.forEach(row => {
      const leftKey = normalizeValueKey(row?.[config.relationship.leftKey]);
      if (!leftKey) return;
      const matches = rightCounts.get(leftKey) || 0;
      if (matches > 0) {
        matchedLeftRows += 1;
        totalRightMatches += matches;
      }
    });

    const duplicateRightKeys = Array.from(rightCounts.values()).filter(count => count > 1).length;
    const leftRowCount = primaryRows.length;
    const matchRate = leftRowCount ? (matchedLeftRows / leftRowCount) * 100 : 0;
    const fanOut = matchedLeftRows ? totalRightMatches / matchedLeftRows : 0;
    const confidence = Math.max(0, Math.min(100, matchRate - Math.max(fanOut - 1, 0) * 6));

    return {
      leftRowCount,
      matchedLeftRows,
      unmatchedLeftRows: Math.max(leftRowCount - matchedLeftRows, 0),
      duplicateRightKeys,
      matchRate,
      fanOut,
      confidence,
    };
  }, [config, safeDataSources, primaryRows]);

  const mergedFields = useMemo(() => inferFieldMeta(mergedRows), [mergedRows]);
  const fieldMap = useMemo(() => new Map(mergedFields.map(field => [field.name, field])), [mergedFields]);

  const availableFields = useMemo(() => {
    if (!config) return mergedFields;
    const used = new Set<string>();
    config.rowFields.forEach(field => used.add(field));
    config.columnFields.forEach(field => used.add(field));
    config.valueFields.forEach(valueField => used.add(valueField.field));
    return mergedFields.filter(field => !used.has(field.name));
  }, [mergedFields, config]);

  const typeOrder: Array<FieldMeta['type']> = ['date', 'string', 'number'];
  const typeLabels: Record<FieldMeta['type'], string> = {
    date: 'Date',
    string: 'Text',
    number: 'Number',
  };

  const resolveFieldSource = (fieldName: string) => {
    if (!config) return '';
    const separator = fieldName.indexOf('.');
    if (separator > 0) {
      const prefix = fieldName.slice(0, separator);
      if (sourceNames.includes(prefix)) return prefix;
    }
    return config.primarySource;
  };

  const resolveFieldLabel = (fieldName: string) => {
    const source = resolveFieldSource(fieldName);
    if (!source) return fieldName;
    const prefix = `${source}.`;
    return fieldName.startsWith(prefix) ? fieldName.slice(prefix.length) : fieldName;
  };

  const groupedAvailableFields = useMemo(() => {
    if (!config) return [] as FieldGroupSource[];

    const grouped = new Map<
      string,
      {
        sourceKey: string;
        sourceLabel: string;
        typeMap: Record<FieldMeta['type'], FieldMeta[]>;
      }
    >();

    availableFields.forEach(field => {
      const sourceKey = resolveFieldSource(field.name) || config.primarySource;
      const existing = grouped.get(sourceKey) || {
        sourceKey,
        sourceLabel: sourceKey,
        typeMap: { date: [], string: [], number: [] },
      };
      existing.typeMap[field.type].push(field);
      grouped.set(sourceKey, existing);
    });

    const sourceGroups = Array.from(grouped.values()).sort((a, b) => {
      if (a.sourceKey === config.primarySource && b.sourceKey !== config.primarySource) return -1;
      if (b.sourceKey === config.primarySource && a.sourceKey !== config.primarySource) return 1;
      return a.sourceLabel.localeCompare(b.sourceLabel);
    });

    return sourceGroups.map(group => ({
      sourceKey: group.sourceKey,
      sourceLabel: group.sourceLabel,
      types: typeOrder
        .map(type => ({
          type,
          fields: [...group.typeMap[type]].sort((a, b) =>
            resolveFieldLabel(a.name).localeCompare(resolveFieldLabel(b.name)),
          ),
        }))
        .filter(typeGroup => typeGroup.fields.length > 0),
    }));
  }, [availableFields, config, sourceNames]);

  const filteredGroupedAvailableFields = useMemo(() => {
    const query = fieldSearch.trim().toLowerCase();
    if (!query) return groupedAvailableFields;

    return groupedAvailableFields
      .map(sourceGroup => ({
        ...sourceGroup,
        types: sourceGroup.types
          .map(typeGroup => ({
            ...typeGroup,
            fields: typeGroup.fields.filter(field => {
              const fieldLabel = resolveFieldLabel(field.name).toLowerCase();
              return (
                fieldLabel.includes(query) ||
                field.name.toLowerCase().includes(query) ||
                sourceGroup.sourceLabel.toLowerCase().includes(query) ||
                typeLabels[typeGroup.type].toLowerCase().includes(query)
              );
            }),
          }))
          .filter(typeGroup => typeGroup.fields.length > 0),
      }))
      .filter(sourceGroup => sourceGroup.types.length > 0);
  }, [groupedAvailableFields, fieldSearch]);

  const usedFieldsSummary = useMemo(() => {
    if (!config) return [] as UsedFieldSummary[];
    const usageMap = new Map<string, UsedFieldSummary>();

    const addUsage = (field: string, usage: 'row' | 'column' | 'value') => {
      const meta = fieldMap.get(field);
      if (!meta) return;
      const sourceKey = resolveFieldSource(field) || config.primarySource;
      const sourceLabel = sourceKey;
      const label = resolveFieldLabel(field);
      const existing = usageMap.get(field) || {
        field,
        label,
        sourceKey,
        sourceLabel,
        type: meta.type,
        usage: [],
      };
      if (!existing.usage.includes(usage)) existing.usage.push(usage);
      usageMap.set(field, existing);
    };

    config.rowFields.forEach(field => addUsage(field, 'row'));
    config.columnFields.forEach(field => addUsage(field, 'column'));
    config.valueFields.forEach(valueField => addUsage(valueField.field, 'value'));

    const usageOrder: Record<'row' | 'column' | 'value', number> = {
      row: 0,
      column: 1,
      value: 2,
    };

    return Array.from(usageMap.values()).sort((a, b) => {
      if (a.sourceKey === config.primarySource && b.sourceKey !== config.primarySource) return -1;
      if (b.sourceKey === config.primarySource && a.sourceKey !== config.primarySource) return 1;

      const aUsage = Math.min(...a.usage.map(item => usageOrder[item]));
      const bUsage = Math.min(...b.usage.map(item => usageOrder[item]));
      if (aUsage !== bUsage) return aUsage - bUsage;

      if (a.sourceLabel !== b.sourceLabel) return a.sourceLabel.localeCompare(b.sourceLabel);
      return a.label.localeCompare(b.label);
    });
  }, [config, fieldMap]);

  const filterValueOptions = useMemo(() => {
    const result: Record<string, string[]> = {};
    mergedFields.forEach(field => {
      result[field.name] = field.sampleValues;
    });
    return result;
  }, [mergedFields]);

  const filteredRows = useMemo(() => {
    if (!config) return [] as RowData[];
    const validRules = (Array.isArray(config.filterRules) ? config.filterRules : []).filter(
      rule => rule.field && !isEmpty(rule.value),
    );
    if (!validRules.length) return mergedRows;

    return mergedRows.filter(row => {
      const evaluations = validRules.map(rule => {
        const meta = fieldMap.get(rule.field);
        const raw = row?.[rule.field];

        if (meta?.type === 'date') {
          const rowDate = parseDate(raw);
          const valueDate = parseDate(rule.value);
          const valueToDate = parseDate(rule.valueTo);
          if (!rowDate || !valueDate) return false;
          if (rule.operator === 'equals') return rowDate.toDateString() === valueDate.toDateString();
          if (rule.operator === 'gt') return rowDate > valueDate;
          if (rule.operator === 'gte') return rowDate >= valueDate;
          if (rule.operator === 'lt') return rowDate < valueDate;
          if (rule.operator === 'lte') return rowDate <= valueDate;
          if (rule.operator === 'between' && valueToDate) {
            return rowDate >= valueDate && rowDate <= valueToDate;
          }
          if (rule.operator === 'not_equals') return rowDate.toDateString() !== valueDate.toDateString();
          return true;
        }

        if (meta?.type === 'number') {
          const rowNum = toNumber(raw);
          const from = toNumber(rule.value);
          const to = toNumber(rule.valueTo);
          if (rule.operator === 'equals') return rowNum === from;
          if (rule.operator === 'not_equals') return rowNum !== from;
          if (rule.operator === 'gt') return rowNum > from;
          if (rule.operator === 'gte') return rowNum >= from;
          if (rule.operator === 'lt') return rowNum < from;
          if (rule.operator === 'lte') return rowNum <= from;
          if (rule.operator === 'between') return rowNum >= from && rowNum <= to;
          return true;
        }

        const rowText = String(raw ?? '').toLowerCase();
        const filterText = String(rule.value || '').toLowerCase();
        if (rule.operator === 'equals') return rowText === filterText;
        if (rule.operator === 'not_equals') return rowText !== filterText;
        return rowText === filterText;
      });
      return config.processing.filterLogic === 'or'
        ? evaluations.some(Boolean)
        : evaluations.every(Boolean);
    });
  }, [config, mergedRows, fieldMap]);

  const pivot = useMemo(() => {
    if (!config || !config.valueFields.length) {
      return {
        rows: [] as MatrixRow[],
        rowsForDisplay: [] as MatrixRow[],
        totals: null as MatrixRow | null,
        columnKeys: ['ALL'],
        columnLabels: { ALL: 'ALL' } as Record<string, string>,
      };
    }

    const rowMap = new Map<
      string,
      { labels: string[]; groupLabel: string; cellMap: Map<string, Record<string, CellAccumulator>> }
    >();
    const columnKeys = new Set<string>();
    const columnLabels: Record<string, string> = {};
    const valueFieldById = new Map(config.valueFields.map(value => [value.id, value]));

    const normalizeGroupValue = (row: RowData, field: string) => {
      const meta = fieldMap.get(field);
      const raw = row?.[field];
      if (meta?.type === 'date') {
        const parsed = parseDate(raw);
        if (!parsed) return { key: 'N/A', label: 'N/A' };
        const key = config.dateBucket === 'none' ? formatDateOption(parsed, 'yyyy-mm-dd') : bucketDate(parsed, config.dateBucket);
        const label = config.dateBucket === 'none'
          ? formatDateOption(parsed, config.dateFormat)
          : renderBucketLabel(key, config.dateBucket, config.dateFormat);
        return { key, label };
      }
      if (isEmpty(raw)) return { key: 'N/A', label: 'N/A' };
      return { key: String(raw), label: String(raw) };
    };

    filteredRows.forEach(row => {
      const rowParts = config.rowFields.length
        ? config.rowFields.map(field => normalizeGroupValue(row, field))
        : [{ key: 'All', label: 'All' }];
      const rowKey = rowParts.map(part => part.key).join('||');
      const rowLabels = rowParts.map(part => part.label);
      const groupLabel = rowLabels[0] || 'All';

      const columnParts = config.columnFields.length
        ? config.columnFields.map(field => normalizeGroupValue(row, field))
        : [{ key: 'ALL', label: 'ALL' }];
      const columnKey = columnParts.map(part => part.key).join('||');
      const columnLabel = columnParts.map(part => part.label).join(' · ');

      columnKeys.add(columnKey);
      columnLabels[columnKey] = columnLabel;

      if (!rowMap.has(rowKey)) {
        rowMap.set(rowKey, { labels: rowLabels, groupLabel, cellMap: new Map() });
      }
      const rowEntry = rowMap.get(rowKey)!;

      if (!rowEntry.cellMap.has(columnKey)) {
        rowEntry.cellMap.set(columnKey, {});
      }
      const cell = rowEntry.cellMap.get(columnKey)!;

      config.valueFields.forEach(valueField => {
        if (!cell[valueField.id]) {
          cell[valueField.id] = {
            rowCount: 0,
            countA: 0,
            numericValues: [],
            rawValues: [],
            uniqueValues: new Set<string>(),
            sum: 0,
            min: Number.POSITIVE_INFINITY,
            max: Number.NEGATIVE_INFINITY,
          };
        }

        const acc = cell[valueField.id];
        const raw = row?.[valueField.field];
        const empty = isEmpty(raw);
        const numeric = parseNumeric(raw);

        acc.rowCount += 1;
        if (!empty) {
          acc.countA += 1;
          const rawText = String(raw);
          acc.rawValues.push(rawText);
          acc.uniqueValues.add(rawText);

          if (numeric !== null) {
            acc.numericValues.push(numeric);
            acc.sum += numeric;
            acc.min = Math.min(acc.min, numeric);
            acc.max = Math.max(acc.max, numeric);
          }
        } else if (config.processing.nullHandling === 'zero') {
          acc.numericValues.push(0);
          acc.sum += 0;
          acc.min = Math.min(acc.min, 0);
          acc.max = Math.max(acc.max, 0);
        }
      });
    });

    const sortedColumnKeys = Array.from(columnKeys).sort((a, b) =>
      config.processing.columnSortDirection === 'asc' ? a.localeCompare(b) : b.localeCompare(a),
    );
    const metricKeys = sortedColumnKeys.flatMap(columnKey =>
      config.valueFields.map(valueField => ({
        key: `${columnKey}__${valueField.id}`,
        columnKey,
        valueFieldId: valueField.id,
      })),
    );

    const baseRows = Array.from(rowMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([rowId, entry]) => {
        const baseValues: Record<string, number> = {};
        sortedColumnKeys.forEach(columnKey => {
          const cell = entry.cellMap.get(columnKey);
          config.valueFields.forEach(valueField => {
            const metricKey = `${columnKey}__${valueField.id}`;
            baseValues[metricKey] = computeAggregate(cell?.[valueField.id], valueField.aggregate);
          });
        });
        return {
          id: rowId,
          labels: entry.labels,
          groupLabel: entry.groupLabel,
          baseValues,
          values: { ...baseValues },
        } as MatrixRow;
      });

    // Post-process value fields.
    const processedRows = baseRows.map(row => ({ ...row, values: { ...row.baseValues } }));
    config.valueFields.forEach(valueField => {
      const keys = metricKeys.filter(key => key.valueFieldId === valueField.id).map(key => key.key);
      if (!keys.length) return;

      if (valueField.postProcess === 'share_of_total') {
        keys.forEach(key => {
          const total = processedRows.reduce((sum, row) => sum + (row.baseValues[key] || 0), 0);
          processedRows.forEach(row => {
            row.values[key] = total !== 0 ? ((row.baseValues[key] || 0) / total) * 100 : 0;
          });
        });
      }

      if (valueField.postProcess === 'row_percent') {
        processedRows.forEach(row => {
          const rowTotal = keys.reduce((sum, key) => sum + (row.baseValues[key] || 0), 0);
          keys.forEach(key => {
            row.values[key] = rowTotal !== 0 ? ((row.baseValues[key] || 0) / rowTotal) * 100 : 0;
          });
        });
      }

      if (valueField.postProcess === 'running_total') {
        processedRows.forEach(row => {
          let running = 0;
          keys.forEach(key => {
            running += row.baseValues[key] || 0;
            row.values[key] = running;
          });
        });
      }
    });

    const sortMetric = config.processing.sortMetricKey || metricKeys[0]?.key || '';
    const sortedRows = [...processedRows].sort((a, b) => {
      const av = a.values[sortMetric] || 0;
      const bv = b.values[sortMetric] || 0;
      return config.processing.sortDirection === 'asc' ? av - bv : bv - av;
    });

    let limitedRows = sortedRows;
    if (config.processing.rowMode === 'all' || config.processing.rowLimit <= 0) {
      limitedRows = sortedRows;
    } else if (config.processing.rowMode === 'bottom') {
      limitedRows = sortedRows.slice(-config.processing.rowLimit);
    } else {
      limitedRows = sortedRows.slice(0, config.processing.rowLimit);
    }

    let rowsForDisplay = limitedRows;
    if (config.processing.showSubtotals && config.rowFields.length > 1) {
      const grouped = new Map<string, MatrixRow[]>();
      limitedRows.forEach(row => {
        const key = row.groupLabel || 'All';
        const bucket = grouped.get(key) || [];
        bucket.push(row);
        grouped.set(key, bucket);
      });

      const withSubtotals: MatrixRow[] = [];
      Array.from(grouped.entries()).forEach(([group, rows]) => {
        rows.forEach(row => withSubtotals.push(row));
        const subtotalValues: Record<string, number> = {};
        metricKeys.forEach(metric => {
          subtotalValues[metric.key] = rows.reduce((sum, row) => sum + (row.values[metric.key] || 0), 0);
        });
        withSubtotals.push({
          id: `subtotal_${group}`,
          labels: [`${group} subtotal`, ...new Array(Math.max(config.rowFields.length - 1, 0)).fill('')],
          groupLabel: group,
          baseValues: subtotalValues,
          values: subtotalValues,
          isSubtotal: true,
        });
      });
      rowsForDisplay = withSubtotals;
    }

    const totals =
      config.processing.showTotals
        ? {
            id: 'totals',
            labels: ['TOTALS', ...new Array(Math.max(config.rowFields.length - 1, 0)).fill('')],
            groupLabel: 'TOTALS',
            baseValues: metricKeys.reduce((acc, metric) => {
              acc[metric.key] = limitedRows.reduce((sum, row) => sum + (row.values[metric.key] || 0), 0);
              return acc;
            }, {} as Record<string, number>),
            values: metricKeys.reduce((acc, metric) => {
              acc[metric.key] = limitedRows.reduce((sum, row) => sum + (row.values[metric.key] || 0), 0);
              return acc;
            }, {} as Record<string, number>),
          }
        : null;

    return {
      rows: limitedRows,
      rowsForDisplay,
      totals,
      columnKeys: sortedColumnKeys.length ? sortedColumnKeys : ['ALL'],
      columnLabels,
    };
  }, [config, filteredRows, fieldMap]);

  const metricColumns = useMemo(() => {
    if (!config) return [] as Array<{
      key: string;
      label: string;
      valueField: ValueFieldConfig;
      columnKey: string;
    }>;
    const columnKeys = config.columnFields.length ? pivot.columnKeys : ['ALL'];
    return columnKeys.flatMap(columnKey =>
      config.valueFields.map(valueField => ({
        key: `${columnKey}__${valueField.id}`,
        label: config.columnFields.length
          ? `${pivot.columnLabels[columnKey] || columnKey} · ${valueField.label || valueField.field}`
          : valueField.label || valueField.field,
        valueField,
        columnKey,
      })),
    );
  }, [config, pivot.columnKeys, pivot.columnLabels]);

  useEffect(() => {
    if (!config || !metricColumns.length) return;
    if (config.processing.sortMetricKey) return;
    updateConfig(current => ({
      ...current,
      processing: {
        ...current.processing,
        sortMetricKey: metricColumns[0].key,
      },
    }));
    // Intentional one-time initialization when missing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.processing.sortMetricKey, metricColumns.length]);

  const buildRowLabel = (row: MatrixRow) =>
    (Array.isArray(row.labels) ? row.labels.filter(Boolean).join(' · ') : '') || row.id;

  const chartData = useMemo(() => {
    if (!metricColumns.length) return [] as Array<{ name: string; value: number }>;
    const metric = metricColumns[0];
    return pivot.rows
      .map(row => ({
        name: buildRowLabel(row),
        value: row.values[metric.key] || 0,
      }))
      .slice(0, 25);
  }, [pivot.rows, metricColumns]);

  const smartSummary = useMemo(() => {
    if (!chartData.length) {
      return {
        total: 0,
        topLabel: 'N/A',
        topValue: 0,
        concentration: 0,
      };
    }
    const sorted = [...chartData].sort((a, b) => b.value - a.value);
    const total = sorted.reduce((sum, row) => sum + row.value, 0);
    return {
      total,
      topLabel: sorted[0].name,
      topValue: sorted[0].value,
      concentration: total > 0 ? (sorted[0].value / total) * 100 : 0,
    };
  }, [chartData]);

  const groupedPreviewRows = useMemo(() => {
    if (!config || config.rowFields.length < 2 || !metricColumns.length) return [];
    const grouped = new Map<
      string,
      {
        rows: MatrixRow[];
        totals: Record<string, number>;
      }
    >();

    pivot.rowsForDisplay.forEach(row => {
      const labels = Array.isArray(row.labels) ? row.labels : [];
      const groupKey = String(row.groupLabel ?? labels[0] ?? 'Ungrouped');
      const existing = grouped.get(groupKey) || {
        rows: [],
        totals: Object.fromEntries(metricColumns.map(metric => [metric.key, 0])),
      };
      existing.rows.push(row);
      if (!row.isSubtotal) {
        metricColumns.forEach(metric => {
          existing.totals[metric.key] += row.values?.[metric.key] || 0;
        });
      }
      grouped.set(groupKey, existing);
    });

    return Array.from(grouped.entries()).map(([groupKey, value]) => ({
      groupKey,
      rows: value.rows,
      totals: value.totals,
      rowCount: value.rows.filter(row => !row.isSubtotal).length,
    }));
  }, [config, metricColumns, pivot.rowsForDisplay]);

  const addCurrentCardToDashboard = () => {
    const primaryMetric = metricColumns[0];
    if (!primaryMetric) {
      toast({
        title: 'Card not added',
        description: 'Add at least one value field before sending a card to Dashboard Overview.',
        variant: 'destructive',
      });
      return;
    }

    addDataLabCardToModule(targetModuleId, {
      id: makeId('datalab_card'),
      title: activeView.name,
      value: formatMetricForField(smartSummary.total, primaryMetric.valueField, config),
      description: `${primaryMetric.label} total across ${pivot.rows.length.toLocaleString('en-IN')} grouped rows.`,
      accent: themeToAccent(config.style.theme),
      sourceViewId: activeView.id,
      sourceViewName: activeView.name,
      createdAt: Date.now(),
    });

    toast({
      title: 'Card added to Dashboard Overview',
      description: `${activeView.name} card was added to ${overviewModules.find((module) => module.id === targetModuleId)?.label || 'selected module'}.`,
    });
  };

  const addCurrentChartToDashboard = () => {
    const primaryMetric = metricColumns[0];
    if (!primaryMetric || !chartData.length) {
      toast({
        title: 'Chart not added',
        description: 'Generate chart data first, then add it to Dashboard Overview.',
        variant: 'destructive',
      });
      return;
    }

    addDataLabChartToModule(targetModuleId, {
      id: makeId('datalab_chart'),
      title: `${activeView.name} Chart`,
      description: `Custom Data Lab chart based on ${primaryMetric.label}.`,
      data: chartData.slice(0, 20).map((row) => ({
        name: row.name.length > 36 ? `${row.name.slice(0, 35)}...` : row.name,
        value: Number(row.value.toFixed(2)),
      })),
      xKey: 'name',
      series: [
        {
          key: 'value',
          label: primaryMetric.label,
          color: primaryMetricColor,
        },
      ],
      format: toOverviewFormat(primaryMetric.valueField.format),
      emptyMessage: 'No custom chart data available for this saved Data Lab model.',
      sourceViewId: activeView.id,
      sourceViewName: activeView.name,
      createdAt: Date.now(),
    });

    toast({
      title: 'Chart added to Dashboard Overview',
      description: `${activeView.name} chart was added to ${overviewModules.find((module) => module.id === targetModuleId)?.label || 'selected module'}.`,
    });
  };

  const addCurrentTableToDashboard = () => {
    if (!metricColumns.length || !pivot.rows.length) {
      toast({
        title: 'Table not added',
        description: 'Build a pivot table with at least one value field before adding to Dashboard Overview.',
        variant: 'destructive',
      });
      return;
    }

    const rowHeaders = config.rowFields.length ? config.rowFields : ['Segment'];
    const columns = [
      ...rowHeaders.map((field, index) => ({
        key: `row_${index}`,
        label: getHeaderAlias(`row:${index}:${field}`, field),
        format: 'text' as const,
        align: 'left' as const,
      })),
      ...metricColumns.map((metric) => ({
        key: `metric_${metric.key}`,
        label: getHeaderAlias(`metric:${metric.key}`, metric.label),
        format: 'text' as const,
        align: 'right' as const,
      })),
    ];

    const rows = pivot.rows.slice(0, 20).map((row) => {
      const nextRow: Record<string, string> = {};
      const rowLabels = config.rowFields.length
        ? [...(row.labels || [])]
        : [buildRowLabel(row)];

      rowHeaders.forEach((_, index) => {
        const fallbackValue = rowLabels[index] ?? '';
        nextRow[`row_${index}`] = resolveLabelCellDisplay(row.id, index, fallbackValue);
      });

      metricColumns.forEach((metric) => {
        const fallbackValue = formatMetricForField(
          row.values?.[metric.key] || 0,
          metric.valueField,
          config
        );
        nextRow[`metric_${metric.key}`] = resolveMetricCellDisplay(row.id, metric.key, fallbackValue);
      });

      return nextRow;
    });

    addDataLabTableToModule(targetModuleId, {
      id: makeId('datalab_table'),
      title: `${activeView.name} Table`,
      description: `Top ${rows.length} rows from the Custom Data Lab pivot model.`,
      columns,
      rows,
      emptyMessage: 'No custom pivot rows available for this Data Lab view.',
      sourceViewId: activeView.id,
      sourceViewName: activeView.name,
      createdAt: Date.now(),
    });

    toast({
      title: 'Table added to Dashboard Overview',
      description: `${activeView.name} table was added to ${overviewModules.find((module) => module.id === targetModuleId)?.label || 'selected module'}.`,
    });
  };

  const autoMapJoinKeys = () => {
    if (!config?.relationship.source) return;
    const leftFields = primaryFields.map(field => field.name);
    const rightFields = secondaryFields.map(field => field.name);
    const scored: Array<{ left: string; right: string; score: number }> = [];

    leftFields.forEach(left => {
      const normalizedLeft = left.toLowerCase().replace(/[^a-z0-9]/g, '');
      rightFields.forEach(right => {
        const normalizedRight = right.toLowerCase().replace(/[^a-z0-9]/g, '');
        let score = 0;
        if (normalizedLeft === normalizedRight) score += 5;
        if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) score += 2;
        if (normalizedLeft.endsWith('id') && normalizedRight.endsWith('id')) score += 1;
        if (score > 0) scored.push({ left, right, score });
      });
    });

    scored.sort((a, b) => b.score - a.score);
    if (!scored.length) return;

    updateConfig(current => ({
      ...current,
      relationship: {
        ...current.relationship,
        leftKey: scored[0].left,
        rightKey: scored[0].right,
      },
    }));
  };

  const autoBuildModel = () => {
    if (!config) return;
    const dateField = mergedFields.find(field => field.type === 'date')?.name || '';
    const stringField = mergedFields.find(field => field.type === 'string')?.name || '';
    const secondaryStringField = mergedFields.find(
      field => field.type === 'string' && field.name !== stringField,
    )?.name;
    const numericField = mergedFields.find(field => field.type === 'number')?.name || '';

    if (!numericField) return;

    updateConfig(current => ({
      ...current,
      rowFields: stringField ? [stringField, ...(secondaryStringField ? [secondaryStringField] : [])] : [],
      columnFields: dateField ? [dateField] : [],
          valueFields: [
            {
              id: makeId('value'),
              field: numericField,
              label: numericField,
              aggregate: 'sum',
              format: 'currency',
              postProcess: 'none',
              decimalsOverride: -1,
              revenueScaleOverride: 'inherit',
              accentColor: VALUE_COLOR_OPTIONS[0],
            },
          ],
      processing: {
        ...current.processing,
        sortMetricKey: '',
      },
    }));
  };

  const applyTopBottomPreset = (mode: 'top' | 'bottom', limit: number) => {
    if (!metricColumns.length) {
      toast({
        title: 'Preset unavailable',
        description: 'Add at least one value field before applying Top/Bottom presets.',
        variant: 'destructive',
      });
      return;
    }

    updateConfig((current) => ({
      ...current,
      processing: {
        ...current.processing,
        rowMode: mode,
        rowLimit: limit,
        sortDirection: mode === 'top' ? 'desc' : 'asc',
        sortMetricKey: current.processing.sortMetricKey || metricColumns[0].key,
      },
    }));
  };

  const applyTrendPreset = () => {
    const dateField =
      mergedFields.find((field) => field.type === 'date' && field.name === config.columnFields[0])?.name ||
      mergedFields.find((field) => field.type === 'date')?.name ||
      '';
    const labelField =
      mergedFields.find((field) => field.type === 'string' && field.name === config.rowFields[0])?.name ||
      mergedFields.find((field) => field.type === 'string')?.name ||
      '';

    if (!dateField) {
      toast({
        title: 'Trend preset unavailable',
        description: 'No date field found in this source model.',
        variant: 'destructive',
      });
      return;
    }

    updateConfig((current) => ({
      ...current,
      rowFields: labelField ? [labelField] : current.rowFields,
      columnFields: [dateField],
      dateBucket: 'month',
      chartType: 'line',
      processing: {
        ...current.processing,
        rowMode: 'top',
        rowLimit: 12,
        columnSortDirection: 'asc',
      },
    }));
  };

  const resetModelCanvas = () => {
    updateConfig((current) => ({
      ...current,
      rowFields: [],
      columnFields: [],
      valueFields: [],
      filterRules: [],
      headerAliases: {},
      cellOverrides: {},
      columnWidths: {},
      processing: {
        ...current.processing,
        sortMetricKey: '',
      },
    }));
  };

  const quickAddFieldToModel = (fieldName: string) => {
    const fieldMeta = fieldMap.get(fieldName);
    updateConfig((current) => {
      if (fieldMeta?.type === 'number') {
        const nextMetric: ValueFieldConfig = {
          id: makeId('value'),
          field: fieldName,
          label: fieldName,
          aggregate: 'sum',
          format: 'currency',
          postProcess: 'none',
          decimalsOverride: -1,
          revenueScaleOverride: 'inherit',
          accentColor:
            VALUE_COLOR_OPTIONS[current.valueFields.length % VALUE_COLOR_OPTIONS.length] || VALUE_COLOR_OPTIONS[0],
        };
        return {
          ...current,
          valueFields: [...current.valueFields, nextMetric],
        };
      }

      if (!current.rowFields.includes(fieldName)) {
        return {
          ...current,
          rowFields: [...current.rowFields, fieldName],
        };
      }

      if (!current.columnFields.includes(fieldName)) {
        return {
          ...current,
          columnFields: [...current.columnFields, fieldName],
        };
      }

      return current;
    });
  };

  const removeValueField = (valueFieldId: string) =>
    updateConfig((current) => ({
      ...current,
      valueFields: current.valueFields.filter((item) => item.id !== valueFieldId),
    }));

  const duplicateValueField = (valueFieldId: string) =>
    updateConfig((current) => {
      const sourceMetric = current.valueFields.find((item) => item.id === valueFieldId);
      if (!sourceMetric) return current;
      const nextMetric: ValueFieldConfig = {
        ...sourceMetric,
        id: makeId('value'),
        label: `${sourceMetric.label} (Copy)`,
      };
      const sourceIndex = current.valueFields.findIndex((item) => item.id === valueFieldId);
      const nextValueFields = [...current.valueFields];
      nextValueFields.splice(sourceIndex + 1, 0, nextMetric);
      return { ...current, valueFields: nextValueFields };
    });

  const reorderItems = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    if (typeof moved === 'undefined') return items;
    next.splice(Math.min(toIndex, next.length), 0, moved);
    return next;
  };

  const insertItemAt = <T,>(items: T[], index: number, item: T): T[] => {
    const next = [...items];
    next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
    return next;
  };

  const dropFieldToZone = (zone: 'rows' | 'columns' | 'values', targetIndex?: number) => {
    if (!dragField || !config) return;

    if (zone === 'values') {
      updateConfig(current => {
        const normalizedTargetIndex =
          typeof targetIndex === 'number' ? Math.max(0, Math.min(targetIndex, current.valueFields.length)) : current.valueFields.length;

        if (dragField.from === 'values') {
          const fromIndex =
            typeof dragField.fromIndex === 'number'
              ? dragField.fromIndex
              : current.valueFields.findIndex(
                  (valueField) =>
                    valueField.id === dragField.valueId || valueField.field === dragField.field
                );
          if (fromIndex < 0) return current;
          return {
            ...current,
            valueFields: reorderItems(current.valueFields, fromIndex, normalizedTargetIndex),
          };
        }

        const fieldMeta = fieldMap.get(dragField.field);
        const nextRows =
          dragField.from === 'rows'
            ? current.rowFields.filter((field) => field !== dragField.field)
            : current.rowFields;
        const nextColumns =
          dragField.from === 'columns'
            ? current.columnFields.filter((field) => field !== dragField.field)
            : current.columnFields;
        const nextValues =
          dragField.from === 'values'
            ? current.valueFields.filter((valueField) => valueField.id !== dragField.valueId)
            : current.valueFields;
        const nextMetric: ValueFieldConfig = {
          id: makeId('value'),
          field: dragField.field,
          label: dragField.field,
          aggregate: fieldMeta?.type === 'string' ? 'counta' : 'sum',
          format: fieldMeta?.type === 'number' ? 'currency' : 'number',
          postProcess: 'none',
          decimalsOverride: -1,
          revenueScaleOverride: 'inherit',
          accentColor:
            VALUE_COLOR_OPTIONS[nextValues.length % VALUE_COLOR_OPTIONS.length] || VALUE_COLOR_OPTIONS[0],
        };

        return {
          ...current,
          rowFields: nextRows,
          columnFields: nextColumns,
          valueFields: insertItemAt(nextValues, normalizedTargetIndex, nextMetric),
        };
      });
    } else {
      updateConfig(current => {
        const currentZoneFields = zone === 'rows' ? current.rowFields : current.columnFields;
        const normalizedTargetIndex =
          typeof targetIndex === 'number'
            ? Math.max(0, Math.min(targetIndex, currentZoneFields.length))
            : currentZoneFields.length;

        if (dragField.from === zone) {
          const sourceIndex =
            typeof dragField.fromIndex === 'number'
              ? dragField.fromIndex
              : currentZoneFields.findIndex((field) => field === dragField.field);
          if (sourceIndex < 0) return current;
          const reordered = reorderItems(currentZoneFields, sourceIndex, normalizedTargetIndex);
          return zone === 'rows'
            ? { ...current, rowFields: reordered }
            : { ...current, columnFields: reordered };
        }

        if (currentZoneFields.includes(dragField.field)) return current;

        const nextRows =
          zone === 'rows'
            ? insertItemAt(
                dragField.from === 'rows'
                  ? current.rowFields.filter((field) => field !== dragField.field)
                  : current.rowFields,
                normalizedTargetIndex,
                dragField.field,
              )
            : dragField.from === 'rows'
              ? current.rowFields.filter(field => field !== dragField.field)
              : current.rowFields;
        const nextColumns =
          zone === 'columns'
            ? insertItemAt(
                dragField.from === 'columns'
                  ? current.columnFields.filter((field) => field !== dragField.field)
                  : current.columnFields,
                normalizedTargetIndex,
                dragField.field,
              )
            : dragField.from === 'columns'
              ? current.columnFields.filter(field => field !== dragField.field)
              : current.columnFields;
        const nextValues =
          dragField.from === 'values'
            ? current.valueFields.filter(
                (valueField) => valueField.id !== dragField.valueId && valueField.field !== dragField.field
              )
            : current.valueFields;

        return { ...current, rowFields: nextRows, columnFields: nextColumns, valueFields: nextValues };
      });
    }
    setDragField(null);
  };

  const toggleFieldGroupCollapsed = (sourceKey: string, type: FieldMeta['type']) => {
    if (!activeViewId) return;
    const groupKey = `${sourceKey}:${type}`;
    setCollapsedFieldGroupsByView(current => {
      const existing = current[activeViewId] || {};
      return {
        ...current,
        [activeViewId]: {
          ...existing,
          [groupKey]: !existing[groupKey],
        },
      };
    });
  };

  const togglePivotGroupCollapsed = (groupKey: string) => {
    if (!activeViewId) return;
    setCollapsedPivotGroupsByView(current => {
      const existing = current[activeViewId] || {};
      return {
        ...current,
        [activeViewId]: {
          ...existing,
          [groupKey]: !existing[groupKey],
        },
      };
    });
  };

  if (!sourceNames.length || !config || !activeView) {
    return (
      <Card className="border border-slate-200 bg-white">
        <CardContent className="p-10 text-center text-slate-600">No data sources available for Data Lab.</CardContent>
      </Card>
    );
  }

  const activeTheme = THEME_CLASS[config.style.theme];
  const rowFieldCount = Math.max(config.rowFields.length, 1);

  const rowWidths = Array.from({ length: rowFieldCount }).map((_, index) => {
    const key = `row_${index}`;
    return config.columnWidths[key] || 190;
  });

  const rowStickyOffsets = rowWidths.map((_, index) =>
    rowWidths.slice(0, index).reduce((sum, width) => sum + width, 0),
  );

  const wrapClass = config.style.wrapCells ? 'whitespace-normal break-words' : 'whitespace-nowrap';
  const cellPadding = config.style.dense ? 'py-1.5' : 'py-2.5';
  const primaryMetricColor = metricColumns[0]?.valueField.accentColor || PREVIEW_COLORS[0];
  const isClassicPreset = config.style.sheetPreset === 'classic';
  const previewShellClass = isClassicPreset ? `bg-gradient-to-br ${activeTheme.cardTint}` : 'bg-white';
  const summaryTileClass = isClassicPreset ? 'bg-white/90' : 'bg-white';
  const headerClass = isClassicPreset
    ? `bg-gradient-to-r ${activeTheme.header}`
    : config.style.sheetPreset === 'excel'
      ? 'bg-emerald-50 text-emerald-900'
      : config.style.sheetPreset === 'numbers'
        ? 'bg-gradient-to-r from-slate-100 to-indigo-50 text-slate-800'
        : 'bg-slate-100 text-slate-800';
  const stickyHeaderCellClass = isClassicPreset
    ? activeTheme.headerSolid
    : config.style.sheetPreset === 'excel'
      ? 'bg-emerald-50 text-emerald-900'
      : config.style.sheetPreset === 'numbers'
        ? 'bg-slate-100 text-slate-800'
        : 'bg-slate-100 text-slate-800';
  const headerDividerClass = isClassicPreset ? 'border-white/20' : 'border-slate-200';
  const totalsDividerClass = isClassicPreset ? 'border-white/20' : 'border-slate-300';
  const settingsSummaryClass =
    'list-none cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition-colors hover:bg-slate-100 group-open:bg-slate-900 group-open:text-white group-open:border-slate-900';
  const settingsSelectClass = 'w-full h-8 rounded-md border border-slate-200 px-2 bg-white text-xs';
  const settingsLabelClass = 'block space-y-1';
  const settingsLabelTextClass = 'text-[11px] font-semibold uppercase tracking-wide text-slate-500';
  const showSettingsSections = workspacePage === 'settings';
  const previewRowBackgroundClass = 'bg-white';
  const previewHoverClass = config.style.showRowHover ? 'hover:bg-blue-50 transition-colors' : '';
  const savedTablesCount = stableViews.length;
  const savedChartsCount = stableViews.filter(
    view => Array.isArray(view.config?.valueFields) && view.config.valueFields.length > 0,
  ).length;
  const savedMetricCardsCount = stableViews.reduce(
    (count, view) => count + (Array.isArray(view.config?.valueFields) ? view.config.valueFields.length : 0),
    0,
  );
  const savedListsCount = stableViews.filter(
    view => Array.isArray(view.config?.rowFields) && view.config.rowFields.length > 0,
  ).length;
  const getHeaderAlias = (headerKey: string, fallback: string) =>
    (config.headerAliases?.[headerKey] || '').trim() || fallback;

  const resolveLabelCellDisplay = (rowId: string, labelIndex: number, fallback: string) =>
    config.cellOverrides?.[`label:${rowId}:${labelIndex}`] ?? fallback;

  const resolveMetricCellDisplay = (rowId: string, metricKey: string, fallback: string) =>
    config.cellOverrides?.[`metric:${rowId}:${metricKey}`] ?? fallback;

  const setHeaderAlias = (headerKey: string, value: string) =>
    updateConfig(current => ({
      ...current,
      headerAliases: {
        ...current.headerAliases,
        [headerKey]: value,
      },
    }));

  const setCellOverride = (cellKey: string, value: string) =>
    updateConfig(current => {
      const next = { ...(current.cellOverrides || {}) };
      if (value.trim()) next[cellKey] = value;
      else delete next[cellKey];
      return {
        ...current,
        cellOverrides: next,
      };
    });

  const renderPreviewTable = (withChart: boolean) => (
    <Card className={`border border-slate-200 ${previewShellClass} shadow-sm ${config.style.rounded ? 'rounded-xl' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700" />
            Smart Pivot Preview
          </CardTitle>
          <div className="inline-flex items-center gap-2 text-[11px] text-slate-600">
            <span className="px-2 py-1 rounded bg-white/80 border border-slate-200">Rows: {pivot.rows.length.toLocaleString('en-IN')}</span>
            <span className="px-2 py-1 rounded bg-white/80 border border-slate-200">Filtered: {filteredRows.length.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={`rounded-lg border border-slate-200 p-3 ${summaryTileClass}`}>
            <div className="text-[11px] text-slate-500">Top Segment</div>
            <div className="font-semibold text-slate-900 truncate" title={smartSummary.topLabel}>
              {smartSummary.topLabel}
            </div>
          </div>
          <div className={`rounded-lg border border-slate-200 p-3 ${summaryTileClass}`}>
            <div className="text-[11px] text-slate-500">Top Value</div>
            <div className="font-semibold text-slate-900">
              {metricColumns[0] ? formatMetricForField(smartSummary.topValue, metricColumns[0].valueField, config) : '0'}
            </div>
          </div>
          <div className={`rounded-lg border border-slate-200 p-3 ${summaryTileClass}`}>
            <div className="text-[11px] text-slate-500">Top Contribution</div>
            <div className="font-semibold text-slate-900">{smartSummary.concentration.toFixed(1)}%</div>
          </div>
        </div>

        <div className={`overflow-hidden border ${config.style.bordered ? 'border-slate-200' : 'border-transparent'} ${config.style.rounded ? 'rounded-lg' : ''}`}>
          <div className="overflow-auto max-h-[560px] bg-white">
            <table className="w-full border-collapse text-sm bg-white">
              <thead className={headerClass}>
                <tr>
                  {(config.rowFields.length ? config.rowFields : ['Row']).map((field, index) => (
                    <th
                      key={`row-head-${field}-${index}`}
                      className={[
                        `px-3 text-left text-xs font-semibold uppercase tracking-wide border-r ${headerDividerClass}`,
                        cellPadding,
                        wrapClass,
                        config.style.freezeHeader ? `sticky top-0 z-30 ${stickyHeaderCellClass}` : '',
                        config.style.freezeFirstColumns ? 'sticky z-40' : '',
                      ].join(' ')}
                      style={{
                        minWidth: rowWidths[index] || 190,
                        width: rowWidths[index] || 190,
                        left: config.style.freezeFirstColumns ? rowStickyOffsets[index] : undefined,
                      }}
                    >
                      {getHeaderAlias(`row:${index}:${field}`, field)}
                    </th>
                  ))}
                  {metricColumns.map(metric => (
                    <th
                      key={`metric-head-${metric.key}`}
                      className={[
                        `px-3 text-right text-xs font-semibold uppercase tracking-wide border-r ${headerDividerClass}`,
                        cellPadding,
                        wrapClass,
                        config.style.freezeHeader ? `sticky top-0 z-30 ${stickyHeaderCellClass}` : '',
                      ].join(' ')}
                      style={{
                        minWidth: config.columnWidths[`metric_${metric.key}`] || 150,
                        width: config.columnWidths[`metric_${metric.key}`] || 150,
                      }}
                    >
                      {getHeaderAlias(`metric:${metric.key}`, metric.label)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {!metricColumns.length && (
                  <tr>
                    <td
                      colSpan={rowFieldCount + 1}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      Add at least one value field to render the pivot table.
                    </td>
                  </tr>
                )}
                {!!metricColumns.length && config.rowFields.length > 1 && groupedPreviewRows.length > 0 &&
                  groupedPreviewRows.map(group => {
                    const isCollapsed = Boolean(collapsedPivotGroups[group.groupKey]);
                    return (
                      <React.Fragment key={`group-${group.groupKey}`}>
                        <tr
                          className={[
                            'bg-slate-100/80',
                            config.style.bordered ? 'border-b border-slate-200' : '',
                          ].join(' ')}
                        >
                          {Array.from({ length: rowFieldCount }).map((_, labelIndex) => (
                            <td
                              key={`group-label-${group.groupKey}-${labelIndex}`}
                              className={[
                                'px-3 text-left font-semibold text-slate-900 border-r border-slate-200',
                                cellPadding,
                                wrapClass,
                                config.style.freezeFirstColumns ? 'sticky z-20 bg-slate-100/80' : '',
                              ].join(' ')}
                              style={{
                                minWidth: rowWidths[labelIndex] || 190,
                                width: rowWidths[labelIndex] || 190,
                                left: config.style.freezeFirstColumns ? rowStickyOffsets[labelIndex] : undefined,
                              }}
                            >
                              {labelIndex === 0 ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2"
                                  onClick={() => togglePivotGroupCollapsed(group.groupKey)}
                                >
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white text-[11px]">
                                    {isCollapsed ? '+' : '−'}
                                  </span>
                                  <span>{group.groupKey}</span>
                                </button>
                              ) : labelIndex === 1 ? (
                                <span className="text-xs text-slate-600">{group.rowCount} row(s)</span>
                              ) : (
                                ''
                              )}
                            </td>
                          ))}

                          {metricColumns.map(metric => (
                            <td
                              key={`group-total-${group.groupKey}-${metric.key}`}
                              className={[
                                'px-3 text-right font-semibold text-slate-900 border-r border-slate-200 bg-slate-100/80',
                                cellPadding,
                                wrapClass,
                              ].join(' ')}
                              style={{
                                minWidth: config.columnWidths[`metric_${metric.key}`] || 150,
                                width: config.columnWidths[`metric_${metric.key}`] || 150,
                              }}
                            >
                              {formatMetricForField(group.totals[metric.key] || 0, metric.valueField, config)}
                            </td>
                          ))}
                        </tr>

                        {!isCollapsed &&
                          group.rows.map((row, index) => (
                            <tr
                              key={row.id}
                              className={[
                                row.isSubtotal ? activeTheme.subtotal : previewRowBackgroundClass,
                                previewHoverClass,
                                config.style.bordered ? 'border-b border-slate-200' : '',
                              ].join(' ')}
                            >
                              {(Array.isArray(row.labels) ? row.labels : []).map((label, labelIndex) => (
                                <td
                                  key={`${row.id}-label-${labelIndex}`}
                                  className={[
                                    'px-3 text-left font-medium text-slate-800 border-r border-slate-200',
                                    cellPadding,
                                    wrapClass,
                                    config.style.freezeFirstColumns ? 'sticky z-20' : '',
                                    row.isSubtotal ? activeTheme.subtotal : previewRowBackgroundClass,
                                  ].join(' ')}
                                  style={{
                                    minWidth: rowWidths[labelIndex] || 190,
                                    width: rowWidths[labelIndex] || 190,
                                    left: config.style.freezeFirstColumns ? rowStickyOffsets[labelIndex] : undefined,
                                  }}
                                >
                                  {inlineEditMode ? (
                                    <Input
                                      value={resolveLabelCellDisplay(
                                        row.id,
                                        labelIndex,
                                        row.isSubtotal
                                          ? label
                                          : labelIndex === 0
                                            ? ''
                                            : labelIndex === 1
                                              ? `↳ ${label}`
                                              : label
                                      )}
                                      onChange={(event) =>
                                        setCellOverride(`label:${row.id}:${labelIndex}`, event.target.value)
                                      }
                                      className="h-8 text-xs bg-white"
                                    />
                                  ) : row.isSubtotal
                                    ? label
                                    : labelIndex === 0
                                      ? ''
                                      : labelIndex === 1
                                        ? `↳ ${label}`
                                        : label}
                                </td>
                              ))}

                              {metricColumns.map(metric => (
                                <td
                                  key={`${row.id}-${metric.key}`}
                                  className={[
                                    `px-3 text-right font-medium text-slate-800 border-r border-slate-200 ${previewRowBackgroundClass}`,
                                    cellPadding,
                                    wrapClass,
                                  ].join(' ')}
                                  style={{
                                    minWidth: config.columnWidths[`metric_${metric.key}`] || 150,
                                    width: config.columnWidths[`metric_${metric.key}`] || 150,
                                  }}
                                >
                                  {inlineEditMode ? (
                                    <Input
                                      value={resolveMetricCellDisplay(
                                        row.id,
                                        metric.key,
                                        formatMetricForField(row.values[metric.key] || 0, metric.valueField, config)
                                      )}
                                      onChange={(event) =>
                                        setCellOverride(`metric:${row.id}:${metric.key}`, event.target.value)
                                      }
                                      className="h-8 text-xs text-right bg-white"
                                    />
                                  ) : (
                                    resolveMetricCellDisplay(
                                      row.id,
                                      metric.key,
                                      formatMetricForField(row.values[metric.key] || 0, metric.valueField, config)
                                    )
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}
                {!!metricColumns.length && !(config.rowFields.length > 1 && groupedPreviewRows.length > 0) &&
                  pivot.rowsForDisplay.map(row => (
                    <tr
                      key={row.id}
                      className={[
                        row.isSubtotal ? activeTheme.subtotal : previewRowBackgroundClass,
                        previewHoverClass,
                        config.style.bordered ? 'border-b border-slate-200' : '',
                      ].join(' ')}
                    >
                      {(Array.isArray(row.labels) ? row.labels : []).map((label, labelIndex) => (
                        <td
                          key={`${row.id}-label-${labelIndex}`}
                          className={[
                            'px-3 text-left font-medium text-slate-800 border-r border-slate-200',
                            cellPadding,
                            wrapClass,
                            config.style.freezeFirstColumns ? 'sticky z-20' : '',
                            row.isSubtotal ? activeTheme.subtotal : previewRowBackgroundClass,
                          ].join(' ')}
                          style={{
                            minWidth: rowWidths[labelIndex] || 190,
                            width: rowWidths[labelIndex] || 190,
                            left: config.style.freezeFirstColumns ? rowStickyOffsets[labelIndex] : undefined,
                          }}
                        >
                          {inlineEditMode ? (
                            <Input
                              value={resolveLabelCellDisplay(row.id, labelIndex, label)}
                              onChange={(event) => setCellOverride(`label:${row.id}:${labelIndex}`, event.target.value)}
                              className="h-8 text-xs bg-white"
                            />
                          ) : (
                            resolveLabelCellDisplay(row.id, labelIndex, label)
                          )}
                        </td>
                      ))}

                      {metricColumns.map(metric => (
                        <td
                          key={`${row.id}-${metric.key}`}
                          className={[
                            `px-3 text-right font-medium text-slate-800 border-r border-slate-200 ${previewRowBackgroundClass}`,
                            cellPadding,
                            wrapClass,
                          ].join(' ')}
                          style={{
                            minWidth: config.columnWidths[`metric_${metric.key}`] || 150,
                            width: config.columnWidths[`metric_${metric.key}`] || 150,
                          }}
                        >
                          {inlineEditMode ? (
                            <Input
                              value={resolveMetricCellDisplay(
                                row.id,
                                metric.key,
                                formatMetricForField(row.values[metric.key] || 0, metric.valueField, config)
                              )}
                              onChange={(event) => setCellOverride(`metric:${row.id}:${metric.key}`, event.target.value)}
                              className="h-8 text-xs text-right bg-white"
                            />
                          ) : (
                            resolveMetricCellDisplay(
                              row.id,
                              metric.key,
                              formatMetricForField(row.values[metric.key] || 0, metric.valueField, config)
                            )
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>

              {pivot.totals && (
                <tfoot className={activeTheme.totals}>
                  <tr className={config.style.freezeTotalsRow ? 'sticky bottom-0 z-30' : ''}>
                    {pivot.totals.labels.map((label, labelIndex) => (
                      <td
                        key={`totals-label-${labelIndex}`}
                        className={`px-3 ${cellPadding} font-bold border-r ${totalsDividerClass}`}
                        style={{
                          minWidth: rowWidths[labelIndex] || 190,
                          width: rowWidths[labelIndex] || 190,
                        }}
                      >
                        {label}
                      </td>
                    ))}
                    {metricColumns.map(metric => (
                      <td
                        key={`totals-${metric.key}`}
                        className={`px-3 ${cellPadding} text-right font-bold border-r ${totalsDividerClass}`}
                        style={{
                          minWidth: config.columnWidths[`metric_${metric.key}`] || 150,
                          width: config.columnWidths[`metric_${metric.key}`] || 150,
                        }}
                      >
                        {formatMetricForField(pivot.totals?.values[metric.key] || 0, metric.valueField, config)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {withChart && chartData.length > 0 && (
          <div className="h-80 rounded-lg border border-slate-200 bg-white p-3">
            <ResponsiveContainer width="100%" height="100%">
              {config.chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={95} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) =>
                      metricColumns[0]
                        ? formatMetricForField(value, metricColumns[0].valueField, config)
                        : value
                    }
                  />
                  <Legend />
                  <Bar dataKey="value" fill={primaryMetricColor} radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : config.chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={95} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) =>
                      metricColumns[0]
                        ? formatMetricForField(value, metricColumns[0].valueField, config)
                        : value
                    }
                  />
                  <Line type="monotone" dataKey="value" stroke={primaryMetricColor} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              ) : config.chartType === 'area' ? (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={95} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) =>
                      metricColumns[0]
                        ? formatMetricForField(value, metricColumns[0].valueField, config)
                        : value
                    }
                  />
                  <Area type="monotone" dataKey="value" stroke={primaryMetricColor} fill={primaryMetricColor} fillOpacity={0.22} />
                </AreaChart>
              ) : (
                <PieChart>
                  <Tooltip
                    formatter={(value: number) =>
                      metricColumns[0]
                        ? formatMetricForField(value, metricColumns[0].valueField, config)
                        : value
                    }
                  />
                  <Legend />
                  <Pie data={chartData.slice(0, 10)} dataKey="value" nameKey="name" outerRadius={110} label>
                    {chartData.slice(0, 10).map((row, index) => (
                      <Cell key={`pie-${row.name}`} fill={PREVIEW_COLORS[index % PREVIEW_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const fieldType = (field: string) => fieldMap.get(field)?.type || 'string';

  return (
    <div className="space-y-5" id="data-lab-workspace">
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-slate-700" />
                Enterprise Custom Data Lab
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Premium pivot and chart studio with robust relationship mapping, advanced computations, styling controls, and auto-save.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-600">
                <Save className="w-3 h-3" />
                Auto-saved {new Date(activeView.updatedAt).toLocaleTimeString('en-IN')}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved Tables</div>
            <div className="text-xs text-slate-500">{stableViews.length} total</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {stableViews.map((view, index) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveViewId(view.id)}
                  className={[
                    'shrink-0 min-w-[180px] rounded-lg border px-3 py-2 text-left transition',
                    view.id === activeViewId
                      ? 'bg-white text-slate-900 border-slate-900 shadow-sm ring-1 ring-slate-900/10'
                      : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-white',
                  ].join(' ')}
                >
                  <div className="truncate text-sm font-semibold">{view.name}</div>
                  <div className="text-[11px] text-slate-500">Saved View {index + 1}</div>
                </button>
              ))}
              <Button size="sm" variant="outline" className="shrink-0 gap-1 bg-white" onClick={createView}>
                <Plus className="w-4 h-4" />
                New Table
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1 bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                onClick={() => deleteView(activeViewId)}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs text-slate-700 space-y-1 block">
              <span className="font-medium">Active Table Name</span>
              <Input value={activeView.name} onChange={event => updateViewName(event.target.value)} className="h-9" />
            </label>
            <label className="text-xs text-slate-700 space-y-1 block">
              <span className="font-medium">Dashboard Module</span>
              <select
                value={targetModuleId}
                onChange={(event) => setTargetModuleId(event.target.value as OverviewModuleId)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs"
              >
                {overviewModules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="gap-1" onClick={addCurrentCardToDashboard}>
              Add Card to Dashboard
            </Button>
            <Button type="button" size="sm" variant="outline" className="gap-1" onClick={addCurrentChartToDashboard}>
              Add Chart to Dashboard
            </Button>
            <Button type="button" size="sm" variant="outline" className="gap-1" onClick={addCurrentTableToDashboard}>
              Add Table to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md ring-1 ring-slate-100"
            >
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/70">
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
                    Workbook Ribbon
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => setShowTopControls(previous => !previous)}
                    >
                      {showTopControls ? 'Hide Controls' : 'Show Controls'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                      onClick={() =>
                        setWorkspacePage(current => (current === 'settings' ? 'workspace' : 'settings'))
                      }
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      {showSettingsSections ? 'Back To Workspace' : 'Open Settings'}
                    </Button>
                    <Button
                      size="sm"
                      variant={inlineEditMode ? 'default' : 'outline'}
                      className="h-8 text-xs"
                      onClick={() => setInlineEditMode((prev) => !prev)}
                    >
                      {inlineEditMode ? 'Stop Edit Values' : 'Edit Headers/Values'}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-3 py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Smart Actions</span>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={autoBuildModel}>
                    Auto Build Pivot
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={applyTrendPreset}>
                    Trend View
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => applyTopBottomPreset('top', 10)}>
                    Top 10
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => applyTopBottomPreset('bottom', 10)}>
                    Bottom 10
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                    onClick={resetModelCanvas}
                  >
                    Clear Canvas
                  </Button>
                </div>

                {showTopControls && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-3 py-2">
                    <select
                      value={config.style.sheetPreset}
                      onChange={event =>
                        updateConfig(current => ({
                          ...current,
                          style: {
                            ...current.style,
                            sheetPreset: event.target.value as StyleConfig['sheetPreset'],
                          },
                        }))
                      }
                      className="h-8 rounded-md border border-slate-200 px-2 bg-white text-xs"
                    >
                      <option value="airtable">Airtable</option>
                      <option value="numbers">Apple Numbers</option>
                      <option value="excel">Microsoft Excel</option>
                      <option value="classic">Classic Data Lab</option>
                    </select>
                    <Button
                      size="sm"
                      variant={config.style.wrapCells ? 'default' : 'outline'}
                      className="h-8 text-xs"
                      onClick={() =>
                        updateConfig(current => ({
                          ...current,
                          style: { ...current.style, wrapCells: !current.style.wrapCells },
                        }))
                      }
                    >
                      Wrap Cells
                    </Button>
                    <Button
                      size="sm"
                      variant={config.style.freezeHeader ? 'default' : 'outline'}
                      className="h-8 text-xs"
                      onClick={() =>
                        updateConfig(current => ({
                          ...current,
                          style: { ...current.style, freezeHeader: !current.style.freezeHeader },
                        }))
                      }
                    >
                      Freeze Header
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-4">
              {showSettingsSections ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="space-y-4 sticky top-4 self-start">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Table2 className="w-4 h-4" />
                      Field Explorer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={fieldSearch}
                        onChange={event => setFieldSearch(event.target.value)}
                        placeholder="Search by field, source, or type..."
                        className="h-8 pl-7 text-xs bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Tip: drag fields into zones, or double-click a field for smart auto-placement.
                    </p>

                    {usedFieldsSummary.length > 0 && (
                      <div className="rounded-md border border-slate-200 p-2 bg-slate-50/60 space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          Used In Model
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {usedFieldsSummary.map(item => (
                            <span
                              key={`used-${item.field}`}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700"
                              title={`${item.sourceLabel} • ${item.usage.join(', ')}`}
                            >
                              <span className="font-medium">{item.label}</span>
                              <span className="text-slate-500">[{item.usage.join('/')}]</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-md border border-slate-200 p-2 bg-slate-50/60">
                      <div className="max-h-56 overflow-auto space-y-2 pr-1">
                        {filteredGroupedAvailableFields.map(sourceGroup => (
                          <div key={`source-group-${sourceGroup.sourceKey}`} className="space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                              {sourceGroup.sourceLabel}
                            </div>

                            {sourceGroup.types.map(typeGroup => {
                              const groupKey = `${sourceGroup.sourceKey}:${typeGroup.type}`;
                              const isCollapsed = collapsedFieldGroups[groupKey] ?? false;

                              return (
                                <div key={`type-group-${groupKey}`} className="rounded-md border border-slate-200 bg-white">
                                  <button
                                    type="button"
                                    className="w-full px-2 py-1.5 text-left text-[11px] font-semibold text-slate-700 flex items-center justify-between"
                                    onClick={() => toggleFieldGroupCollapsed(sourceGroup.sourceKey, typeGroup.type)}
                                  >
                                    <span>{`${sourceGroup.sourceLabel} • ${typeLabels[typeGroup.type]} (${typeGroup.fields.length})`}</span>
                                    <span className="text-slate-500">{isCollapsed ? '+' : '−'}</span>
                                  </button>

                                  {!isCollapsed && (
                                    <div className="px-2 pb-2 space-y-1">
                                      {typeGroup.fields.map(field => (
                                        <button
                                          key={field.name}
                                          type="button"
                                          draggable
                                          onDragStart={() => setDragField({ field: field.name, from: 'available' })}
                                          onDoubleClick={() => quickAddFieldToModel(field.name)}
                                          className="w-full text-left px-2 py-1 rounded-md border border-slate-200 bg-white text-xs hover:bg-slate-100 transition flex items-center justify-between gap-2"
                                          title="Drag to Rows/Columns/Values or double-click for smart add"
                                        >
                                          <span className="truncate font-medium text-slate-800">{resolveFieldLabel(field.name)}</span>
                                          <span className="inline-flex items-center gap-1 shrink-0">
                                            <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600">
                                              {typeLabels[field.type]}
                                            </span>
                                            {sourceGroup.sourceKey !== config.primarySource && (
                                              <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-700">
                                                {sourceGroup.sourceLabel}
                                              </span>
                                            )}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}

                        {!filteredGroupedAvailableFields.length && (
                          <div className="text-[11px] text-slate-500 px-1 py-2">No fields match this search.</div>
                        )}
                      </div>
                    </div>

                    {([
                      { key: 'rows', configKey: 'rowFields', title: 'Rows', fields: config.rowFields },
                      { key: 'columns', configKey: 'columnFields', title: 'Columns', fields: config.columnFields },
                    ] as const).map(zone => (
                      <div
                        key={zone.key}
                        onDragOver={event => event.preventDefault()}
                        onDrop={event => {
                          event.preventDefault();
                          dropFieldToZone(zone.key);
                        }}
                        className="rounded-md border border-dashed border-slate-300 p-2 bg-white min-h-[64px]"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-slate-700">{zone.title}</div>
                          <div className="text-[10px] text-slate-500">drag to reorder</div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {zone.fields.map((field, fieldIndex) => (
                            <span
                              key={field}
                              draggable
                              onDragStart={() => setDragField({ field, from: zone.key, fromIndex: fieldIndex })}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                dropFieldToZone(zone.key, fieldIndex);
                              }}
                              className="inline-flex cursor-grab items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs active:cursor-grabbing"
                            >
                              <span className="text-slate-400">::</span>
                              <span>{field}</span>
                              <button
                                type="button"
                                className="text-slate-500 hover:text-rose-600"
                                onClick={() =>
                                  updateConfig(current => ({
                                    ...current,
                                    [zone.configKey]: (Array.isArray((current as any)[zone.configKey]) ? (current as any)[zone.configKey] : []).filter(
                                      (value: string) => value !== field,
                                    ),
                                  }))
                                }
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div
                      onDragOver={event => event.preventDefault()}
                      onDrop={event => {
                        event.preventDefault();
                        dropFieldToZone('values');
                      }}
                      className="rounded-md border border-dashed border-slate-300 p-2 bg-white min-h-[64px]"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-slate-700">Values</div>
                        <div className="text-[10px] text-slate-500">drag to reorder</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {config.valueFields.map((valueField, metricIndex) => (
                          <span
                            key={valueField.id}
                            draggable
                            onDragStart={() =>
                              setDragField({
                                field: valueField.field,
                                from: 'values',
                                fromIndex: metricIndex,
                                valueId: valueField.id,
                              })
                            }
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              dropFieldToZone('values', metricIndex);
                            }}
                            className="inline-flex cursor-grab items-center justify-between gap-2 rounded border border-slate-200 bg-slate-100 px-2 py-1 text-xs active:cursor-grabbing"
                          >
                            <span className="inline-flex items-center gap-1">
                              <span className="text-slate-400">::</span>
                              <span>{valueField.label}</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                className="text-slate-500 hover:text-slate-900"
                                onClick={() => duplicateValueField(valueField.id)}
                                title="Duplicate metric"
                              >
                                ⧉
                              </button>
                              <button
                                type="button"
                                className="text-slate-500 hover:text-rose-600"
                                onClick={() => removeValueField(valueField.id)}
                                title="Remove metric"
                              >
                                ×
                              </button>
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {showSettingsSections ? (
                <div className="space-y-3">
                <details open className="group">
                <summary className={settingsSummaryClass}>
                  Sources & Relationships
                </summary>
                <div className="pt-2">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Source Mapping
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                      <span className={settingsLabelTextClass}>Primary Source</span>
                      <select
                        value={config.primarySource}
                        onChange={event =>
                          updateConfig(current => ({
                            ...current,
                            primarySource: event.target.value,
                            relationship: {
                              ...current.relationship,
                              source: '',
                              leftKey: '',
                              rightKey: '',
                            },
                            rowFields: [],
                            columnFields: [],
                            valueFields: [],
                            filterRules: [],
                          }))
                        }
                        className={settingsSelectClass}
                      >
                        {sourceNames.map(source => (
                          <option key={source} value={source}>
                            {source} ({(safeDataSources[source] || []).length.toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="rounded-md border border-slate-200 p-3 bg-slate-50/60 space-y-3">
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        Relationship Mapping
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Secondary Source</span>
                          <select
                            value={config.relationship.source}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                relationship: {
                                  ...current.relationship,
                                  source: event.target.value,
                                  leftKey: '',
                                  rightKey: '',
                                },
                              }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="">No Secondary Source</option>
                            {sourceNames
                              .filter(source => source !== config.primarySource)
                              .map(source => (
                                <option key={source} value={source}>
                                  {source}
                                </option>
                              ))}
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Join Type</span>
                          <select
                            value={config.relationship.joinType}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                relationship: {
                                  ...current.relationship,
                                  joinType: event.target.value as JoinType,
                                },
                              }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="left">Left Join</option>
                            <option value="inner">Inner Join</option>
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Primary Key</span>
                          <select
                            value={config.relationship.leftKey}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                relationship: {
                                  ...current.relationship,
                                  leftKey: event.target.value,
                                },
                              }))
                            }
                            className={settingsSelectClass}
                            disabled={!config.relationship.source}
                          >
                            <option value="">Select key</option>
                            {primaryFields.map(field => (
                              <option key={field.name} value={field.name}>
                                {field.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Secondary Key</span>
                          <select
                            value={config.relationship.rightKey}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                relationship: {
                                  ...current.relationship,
                                  rightKey: event.target.value,
                                },
                              }))
                            }
                            className={settingsSelectClass}
                            disabled={!config.relationship.source}
                          >
                            <option value="">Select key</option>
                            {secondaryFields.map(field => (
                              <option key={field.name} value={field.name}>
                                {field.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={autoMapJoinKeys}>
                          Auto-map
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={autoBuildModel}>
                          Smart Model
                        </Button>
                      </div>

                      {relationshipDiagnostics && (
                        <div className="rounded-md border border-slate-200 bg-white p-2.5 space-y-2">
                          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Network className="w-3 h-3" />
                            Relationship Diagnostics
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
                            <span>Match Rate</span>
                            <span className="text-right font-semibold text-slate-900">
                              {relationshipDiagnostics.matchRate.toFixed(1)}%
                            </span>
                            <span>Matched / Left</span>
                            <span className="text-right font-semibold text-slate-900">
                              {relationshipDiagnostics.matchedLeftRows.toLocaleString('en-IN')} / {relationshipDiagnostics.leftRowCount.toLocaleString('en-IN')}
                            </span>
                            <span>Unmatched Left</span>
                            <span className="text-right font-semibold text-slate-900">
                              {relationshipDiagnostics.unmatchedLeftRows.toLocaleString('en-IN')}
                            </span>
                            <span>Avg Fan-out</span>
                            <span className="text-right font-semibold text-slate-900">
                              {relationshipDiagnostics.fanOut.toFixed(2)}x
                            </span>
                            <span>Duplicate Right Keys</span>
                            <span className="text-right font-semibold text-slate-900">
                              {relationshipDiagnostics.duplicateRightKeys.toLocaleString('en-IN')}
                            </span>
                            <span>Mapping Confidence</span>
                            <span className="text-right font-semibold text-emerald-700">
                              {relationshipDiagnostics.confidence.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, relationshipDiagnostics.confidence))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </div>
                </details>

                <details className="group">
                <summary className={settingsSummaryClass}>
                  Filters
                </summary>
                <div className="pt-2">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Advanced Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                      <span className={settingsLabelTextClass}>Filter Logic</span>
                      <select
                        value={config.processing.filterLogic}
                        onChange={event =>
                          updateConfig(current => ({
                            ...current,
                            processing: {
                              ...current.processing,
                              filterLogic: event.target.value as ProcessingConfig['filterLogic'],
                            },
                          }))
                        }
                        className={settingsSelectClass}
                      >
                        <option value="and">Match ALL rules (AND)</option>
                        <option value="or">Match ANY rule (OR)</option>
                      </select>
                    </label>

                    {config.filterRules.map((rule, ruleIndex) => {
                      const type = fieldType(rule.field);
                      const operators: Array<{ value: FilterOperator; label: string }> =
                        type === 'date'
                          ? [
                              { value: 'equals', label: 'On' },
                              { value: 'gte', label: 'On / After' },
                              { value: 'lte', label: 'On / Before' },
                              { value: 'between', label: 'Between' },
                            ]
                          : type === 'number'
                            ? [
                                { value: 'equals', label: '=' },
                                { value: 'gt', label: '>' },
                                { value: 'gte', label: '>=' },
                                { value: 'lt', label: '<' },
                                { value: 'lte', label: '<=' },
                                { value: 'between', label: 'Between' },
                              ]
                            : [
                                { value: 'equals', label: 'Equals' },
                                { value: 'not_equals', label: 'Not Equals' },
                              ];

                      const options = rule.field ? (filterValueOptions[rule.field] || []) : [];
                      return (
                        <div key={rule.id} className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Rule {ruleIndex + 1}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                              <span className={settingsLabelTextClass}>Field</span>
                              <select
                                value={rule.field}
                                onChange={event =>
                                  updateConfig(current => ({
                                    ...current,
                                    filterRules: current.filterRules.map(item =>
                                      item.id === rule.id
                                        ? { ...item, field: event.target.value, operator: 'equals', value: '', valueTo: '' }
                                        : item,
                                    ),
                                  }))
                                }
                                className={settingsSelectClass}
                              >
                                <option value="">Select field</option>
                                {mergedFields.map(field => (
                                  <option key={field.name} value={field.name}>
                                    {field.name}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                              <span className={settingsLabelTextClass}>Operator</span>
                              <select
                                value={rule.operator}
                                onChange={event =>
                                  updateConfig(current => ({
                                    ...current,
                                    filterRules: current.filterRules.map(item =>
                                      item.id === rule.id
                                        ? { ...item, operator: event.target.value as FilterOperator }
                                        : item,
                                    ),
                                  }))
                                }
                                className={settingsSelectClass}
                              >
                                {operators.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          {type === 'date' ? (
                            <div className="space-y-2">
                              <DatePickerCell
                                value={rule.value}
                                onChange={next =>
                                  updateConfig(current => ({
                                    ...current,
                                    filterRules: current.filterRules.map(item =>
                                      item.id === rule.id ? { ...item, value: next } : item,
                                    ),
                                  }))
                                }
                                placeholder="From date"
                              />
                              {rule.operator === 'between' && (
                                <DatePickerCell
                                  value={rule.valueTo || ''}
                                  onChange={next =>
                                    updateConfig(current => ({
                                      ...current,
                                      filterRules: current.filterRules.map(item =>
                                        item.id === rule.id ? { ...item, valueTo: next } : item,
                                      ),
                                    }))
                                  }
                                  placeholder="To date"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <select
                                value={rule.value}
                                onChange={event =>
                                  updateConfig(current => ({
                                    ...current,
                                    filterRules: current.filterRules.map(item =>
                                      item.id === rule.id ? { ...item, value: event.target.value } : item,
                                    ),
                                  }))
                                }
                                className={settingsSelectClass}
                              >
                                <option value="">Select value</option>
                                {options.map(option => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                              {rule.operator === 'between' && (
                                <select
                                  value={rule.valueTo || ''}
                                  onChange={event =>
                                    updateConfig(current => ({
                                      ...current,
                                      filterRules: current.filterRules.map(item =>
                                        item.id === rule.id ? { ...item, valueTo: event.target.value } : item,
                                      ),
                                    }))
                                  }
                                  className={settingsSelectClass}
                                >
                                  <option value="">Select upper bound</option>
                                  {options.map(option => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-full text-xs text-rose-700 border-rose-200"
                            onClick={() =>
                              updateConfig(current => ({
                                ...current,
                                filterRules: current.filterRules.filter(item => item.id !== rule.id),
                              }))
                            }
                          >
                            Remove Rule
                          </Button>
                        </div>
                      );
                    })}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-full text-xs"
                      onClick={() =>
                        updateConfig(current => ({
                          ...current,
                          filterRules: [
                            ...current.filterRules,
                            {
                              id: makeId('filter'),
                              field: '',
                              operator: 'equals',
                              value: '',
                              valueTo: '',
                            },
                          ],
                        }))
                      }
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Filter
                    </Button>
                  </CardContent>
                </Card>
                </div>
                </details>

                <details className="group">
                <summary className={settingsSummaryClass}>
                  Style & Processing
                </summary>
                <div className="pt-2">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Gauge className="w-4 h-4" />
                      Style & Processing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Display</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Chart Type</span>
                          <select
                            value={config.chartType}
                            onChange={event =>
                              updateConfig(current => ({ ...current, chartType: event.target.value as ChartType }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="bar">Bar</option>
                            <option value="line">Line</option>
                            <option value="area">Area</option>
                            <option value="pie">Pie</option>
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Theme</span>
                          <select
                            value={config.style.theme}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                style: { ...current.style, theme: event.target.value as PivotConfig['style']['theme'] },
                              }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="slate">Slate</option>
                            <option value="indigo">Indigo</option>
                            <option value="emerald">Emerald</option>
                            <option value="rose">Rose</option>
                            <option value="mono">Mono</option>
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Layout Preset</span>
                          <select
                            value={config.style.sheetPreset}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                style: {
                                  ...current.style,
                                  sheetPreset: event.target.value as StyleConfig['sheetPreset'],
                                },
                              }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="airtable">Airtable</option>
                            <option value="numbers">Apple Numbers</option>
                            <option value="excel">Microsoft Excel</option>
                            <option value="classic">Classic Data Lab</option>
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Date Bucket</span>
                          <select
                            value={config.dateBucket}
                            onChange={event =>
                              updateConfig(current => ({ ...current, dateBucket: event.target.value as DateBucket }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="none">None</option>
                            <option value="day">Day</option>
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                            <option value="quarter">Quarter</option>
                            <option value="year">Year</option>
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700 sm:col-span-2`}>
                          <span className={settingsLabelTextClass}>Date Format</span>
                          <select
                            value={config.dateFormat}
                            onChange={event =>
                              updateConfig(current => ({ ...current, dateFormat: event.target.value as DateFormat }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="dd-mmm-yyyy">DD MMM YYYY</option>
                            <option value="mmm-yyyy">MMM YYYY</option>
                            <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                            <option value="dd-mm-yyyy">DD/MM/YYYY</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Processing</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Row Limit</span>
                          <select
                            value={String(config.processing.rowLimit)}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                processing: { ...current.processing, rowLimit: Number(event.target.value) },
                              }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="250">250</option>
                            <option value="500">500</option>
                            <option value="0">No Limit</option>
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Row Selection</span>
                          <select
                            value={config.processing.rowMode}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                processing: {
                                  ...current.processing,
                                  rowMode: event.target.value as ProcessingConfig['rowMode'],
                                },
                              }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="top">Top by sort</option>
                            <option value="bottom">Bottom by sort</option>
                            <option value="all">All rows</option>
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Sort Metric</span>
                          <select
                            value={config.processing.sortMetricKey}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                processing: { ...current.processing, sortMetricKey: event.target.value },
                              }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="">Select metric</option>
                            {metricColumns.map(metric => (
                              <option key={metric.key} value={metric.key}>
                                {metric.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Sort Direction</span>
                          <select
                            value={config.processing.sortDirection}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                processing: {
                                  ...current.processing,
                                  sortDirection: event.target.value as 'asc' | 'desc',
                                },
                              }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="desc">High to Low</option>
                            <option value="asc">Low to High</option>
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Column Member Order</span>
                          <select
                            value={config.processing.columnSortDirection}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                processing: {
                                  ...current.processing,
                                  columnSortDirection: event.target.value as 'asc' | 'desc',
                                },
                              }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="asc">A-Z</option>
                            <option value="desc">Z-A</option>
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700 sm:col-span-2`}>
                          <span className={settingsLabelTextClass}>Null Handling</span>
                          <select
                            value={config.processing.nullHandling}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                processing: {
                                  ...current.processing,
                                  nullHandling: event.target.value as 'zero' | 'ignore',
                                },
                              }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="zero">Treat nulls as 0</option>
                            <option value="ignore">Ignore nulls</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Formatting</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Revenue Scale</span>
                          <select
                            value={config.revenueScale}
                            onChange={event =>
                              updateConfig(current => ({ ...current, revenueScale: event.target.value as RevenueScale }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="auto">Auto</option>
                            <option value="full">Full</option>
                            <option value="K">K</option>
                            <option value="L">L</option>
                            <option value="Cr">Cr</option>
                          </select>
                        </label>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Decimals</span>
                          <select
                            value={String(config.decimals)}
                            onChange={event =>
                              updateConfig(current => ({ ...current, decimals: Number(event.target.value) }))
                            }
                            className={settingsSelectClass}
                          >
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Totals</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {([
                          { key: 'showTotals', label: 'Show Totals' },
                          { key: 'showSubtotals', label: 'Show Subtotals' },
                        ] as const).map(toggle => (
                          <label
                            key={toggle.key}
                            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={config.processing[toggle.key]}
                              onChange={event =>
                                updateConfig(current => ({
                                  ...current,
                                  processing: {
                                    ...current.processing,
                                    [toggle.key]: event.target.checked,
                                  },
                                }))
                              }
                            />
                            {toggle.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Table Appearance</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {([
                          { key: 'wrapCells', label: 'Wrap Cells' },
                          { key: 'dense', label: 'Dense Rows' },
                          { key: 'zebra', label: 'Zebra Rows' },
                          { key: 'bordered', label: 'Borders' },
                          { key: 'rounded', label: 'Rounded Table' },
                          { key: 'freezeHeader', label: 'Freeze Header Row' },
                          { key: 'freezeFirstColumns', label: 'Freeze Row Fields' },
                          { key: 'freezeTotalsRow', label: 'Freeze Totals Row' },
                          { key: 'showRowHover', label: 'Row Hover Highlight' },
                        ] as const).map(toggle => (
                          <label
                            key={toggle.key}
                            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={config.style[toggle.key]}
                              onChange={event =>
                                updateConfig(current => ({
                                  ...current,
                                  style: {
                                    ...current.style,
                                    [toggle.key]: event.target.checked,
                                  },
                                }))
                              }
                            />
                            {toggle.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
                </details>

                <details className="group">
                <summary className={settingsSummaryClass}>
                  Value Fields
                </summary>
                <div className="pt-2">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-900">Value Field Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {config.valueFields.length === 0 && (
                      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50/70 px-3 py-2 text-xs text-slate-600">
                        Drag a field into the Values zone to configure metric settings.
                      </div>
                    )}

                    {config.valueFields.map((valueField, index) => (
                      <div key={valueField.id} className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Metric {index + 1}
                          </div>
                          <div className="inline-flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => duplicateValueField(valueField.id)}
                            >
                              Duplicate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px] text-rose-700 border-rose-200 hover:bg-rose-50"
                              onClick={() => removeValueField(valueField.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Metric Label</span>
                          <Input
                            value={valueField.label}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                valueFields: current.valueFields.map(item =>
                                  item.id === valueField.id ? { ...item, label: event.target.value } : item,
                                ),
                              }))
                            }
                            className="h-8 bg-white"
                          />
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                            <span className={settingsLabelTextClass}>Source Field</span>
                            <select
                              value={valueField.field}
                              onChange={event =>
                                updateConfig(current => ({
                                  ...current,
                                  valueFields: current.valueFields.map(item =>
                                    item.id === valueField.id ? { ...item, field: event.target.value } : item,
                                  ),
                                }))
                              }
                              className={settingsSelectClass}
                            >
                              {mergedFields.map(field => (
                                <option key={field.name} value={field.name}>
                                  {field.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                            <span className={settingsLabelTextClass}>Aggregate</span>
                            <select
                              value={valueField.aggregate}
                              onChange={event =>
                                updateConfig(current => ({
                                  ...current,
                                  valueFields: current.valueFields.map(item =>
                                    item.id === valueField.id
                                      ? { ...item, aggregate: event.target.value as Aggregate }
                                      : item,
                                  ),
                                }))
                              }
                              className={settingsSelectClass}
                            >
                              {AGGREGATE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                            <span className={settingsLabelTextClass}>Format</span>
                            <select
                              value={valueField.format}
                              onChange={event =>
                                updateConfig(current => ({
                                  ...current,
                                  valueFields: current.valueFields.map(item =>
                                    item.id === valueField.id
                                      ? { ...item, format: event.target.value as ValueFormat }
                                      : item,
                                  ),
                                }))
                              }
                              className={settingsSelectClass}
                            >
                              <option value="number">Number</option>
                              <option value="currency">Currency</option>
                              <option value="percent">Percent</option>
                            </select>
                          </label>

                          <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                            <span className={settingsLabelTextClass}>Post Process</span>
                            <select
                              value={valueField.postProcess}
                              onChange={event =>
                                updateConfig(current => ({
                                  ...current,
                                  valueFields: current.valueFields.map(item =>
                                    item.id === valueField.id
                                      ? {
                                          ...item,
                                          postProcess:
                                            event.target.value as ValueFieldConfig['postProcess'],
                                        }
                                      : item,
                                  ),
                                }))
                              }
                              className={settingsSelectClass}
                            >
                              <option value="none">None</option>
                              <option value="share_of_total">Share of Total %</option>
                              <option value="row_percent">Row Percent %</option>
                              <option value="running_total">Running Total</option>
                            </select>
                          </label>

                          <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                            <span className={settingsLabelTextClass}>Decimal Override</span>
                            <select
                              value={String(valueField.decimalsOverride)}
                              onChange={event =>
                                updateConfig(current => ({
                                  ...current,
                                  valueFields: current.valueFields.map(item =>
                                    item.id === valueField.id
                                      ? {
                                          ...item,
                                          decimalsOverride: Number(event.target.value) as ValueFieldConfig['decimalsOverride'],
                                        }
                                      : item,
                                  ),
                                }))
                              }
                              className={settingsSelectClass}
                            >
                              <option value="-1">Inherit</option>
                              <option value="0">0</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                            </select>
                          </label>

                          <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                            <span className={settingsLabelTextClass}>Revenue Scale Override</span>
                            <select
                              value={valueField.revenueScaleOverride}
                              onChange={event =>
                                updateConfig(current => ({
                                  ...current,
                                  valueFields: current.valueFields.map(item =>
                                    item.id === valueField.id
                                      ? {
                                          ...item,
                                          revenueScaleOverride: event.target.value as ValueFieldConfig['revenueScaleOverride'],
                                        }
                                      : item,
                                  ),
                                }))
                              }
                              className={settingsSelectClass}
                            >
                              <option value="inherit">Inherit</option>
                              <option value="auto">Auto</option>
                              <option value="full">Full</option>
                              <option value="K">K</option>
                              <option value="L">L</option>
                              <option value="Cr">Cr</option>
                            </select>
                          </label>
                        </div>

                        <label className={`${settingsLabelClass} text-xs text-slate-700`}>
                          <span className={settingsLabelTextClass}>Accent Color</span>
                          <select
                            value={valueField.accentColor}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                valueFields: current.valueFields.map(item =>
                                  item.id === valueField.id
                                    ? {
                                        ...item,
                                        accentColor: event.target.value,
                                      }
                                    : item,
                                ),
                              }))
                            }
                            className={settingsSelectClass}
                          >
                            {VALUE_COLOR_OPTIONS.map(color => (
                              <option key={color} value={color}>
                                {color}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                </div>
                </details>

                <details open className="group">
                <summary className={settingsSummaryClass}>
                  Header & Value Customization
                </summary>
                <div className="pt-2">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-900">Display Overrides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Header Aliases</div>
                      {(config.rowFields.length ? config.rowFields : ['Row']).map((field, index) => (
                        <label key={`header-row-${index}`} className="block text-xs text-slate-700">
                          Row Header: {field}
                          <Input
                            value={config.headerAliases?.[`row:${index}:${field}`] || ''}
                            onChange={(event) => setHeaderAlias(`row:${index}:${field}`, event.target.value)}
                            className="mt-1 h-8 bg-white"
                            placeholder={field}
                          />
                        </label>
                      ))}
                      {metricColumns.map((metric) => (
                        <label key={`header-metric-${metric.key}`} className="block text-xs text-slate-700">
                          Metric Header: {metric.label}
                          <Input
                            value={config.headerAliases?.[`metric:${metric.key}`] || ''}
                            onChange={(event) => setHeaderAlias(`metric:${metric.key}`, event.target.value)}
                            className="mt-1 h-8 bg-white"
                            placeholder={metric.label}
                          />
                        </label>
                      ))}
                    </div>

                    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cell Overrides</div>
                      <p className="text-xs text-slate-600">
                        Use the <span className="font-semibold">Edit Headers/Values</span> button in the ribbon to directly edit preview table values.
                        Current overrides: {Object.keys(config.cellOverrides || {}).length}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() =>
                          updateConfig((current) => ({
                            ...current,
                            cellOverrides: {},
                          }))
                        }
                      >
                        Clear Cell Overrides
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </div>
                </details>

                <details className="group">
                <summary className={settingsSummaryClass}>
                  Layout Controls
                </summary>
                <div className="pt-2">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-900">Column Width Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Row Field Widths</div>
                      {(config.rowFields.length ? config.rowFields : ['Row']).map((field, index) => (
                        <label key={`row-width-${field}-${index}`} className="block text-xs text-slate-700 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span>{field}: {Math.round(config.columnWidths[`row_${index}`] || 190)}px</span>
                            <Input
                              type="number"
                              min={120}
                              max={420}
                              value={Math.round(config.columnWidths[`row_${index}`] || 190)}
                              onChange={event =>
                                updateConfig(current => ({
                                  ...current,
                                  columnWidths: {
                                    ...current.columnWidths,
                                    [`row_${index}`]: Math.max(120, Math.min(420, Number(event.target.value) || 190)),
                                  },
                                }))
                              }
                              className="h-7 w-20 text-xs bg-white"
                            />
                          </div>
                          <input
                            type="range"
                            min={120}
                            max={420}
                            value={config.columnWidths[`row_${index}`] || 190}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                columnWidths: {
                                  ...current.columnWidths,
                                  [`row_${index}`]: Number(event.target.value),
                                },
                              }))
                            }
                            className="w-full"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Metric Widths</div>
                      {metricColumns.map(metric => (
                        <label key={`metric-width-${metric.key}`} className="block text-xs text-slate-700 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate block" title={metric.label}>
                              {metric.label}: {Math.round(config.columnWidths[`metric_${metric.key}`] || 150)}px
                            </span>
                            <Input
                              type="number"
                              min={100}
                              max={360}
                              value={Math.round(config.columnWidths[`metric_${metric.key}`] || 150)}
                              onChange={event =>
                                updateConfig(current => ({
                                  ...current,
                                  columnWidths: {
                                    ...current.columnWidths,
                                    [`metric_${metric.key}`]: Math.max(100, Math.min(360, Number(event.target.value) || 150)),
                                  },
                                }))
                              }
                              className="h-7 w-20 text-xs shrink-0 bg-white"
                            />
                          </div>
                          <input
                            type="range"
                            min={100}
                            max={360}
                            value={config.columnWidths[`metric_${metric.key}`] || 150}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                columnWidths: {
                                  ...current.columnWidths,
                                  [`metric_${metric.key}`]: Number(event.target.value),
                                },
                              }))
                            }
                            className="w-full"
                          />
                        </label>
                      ))}
                      {!metricColumns.length && (
                        <div className="text-xs text-slate-500">Add value fields to enable metric width controls.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </div>
                </details>
                </div>
                ) : (
                <Card className="border border-slate-200 bg-slate-50/70 shadow-sm">
                  <CardContent className="p-3 text-xs text-slate-600">
                    Settings sections are hidden. Use <span className="font-semibold text-slate-800">Open Settings</span> in the ribbon to edit source mapping, filters, styling, value fields, and layout controls.
                  </CardContent>
                </Card>
                )}
              </aside>

              <main className="min-w-0 space-y-4">
                {renderPreviewTable(true)}
              </main>
              </div>
              ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">Saved Tables</div>
                      <div className="text-xl font-semibold text-slate-900">{savedTablesCount}</div>
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">Saved Charts</div>
                      <div className="text-xl font-semibold text-slate-900">{savedChartsCount}</div>
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">Metric Cards</div>
                      <div className="text-xl font-semibold text-slate-900">{savedMetricCardsCount}</div>
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">Lists</div>
                      <div className="text-xl font-semibold text-slate-900">{savedListsCount}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-4">
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-slate-900">Saved Assets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {stableViews.map(view => {
                        const viewValueFields = Array.isArray(view.config?.valueFields) ? view.config.valueFields : [];
                        const viewRowFields = Array.isArray(view.config?.rowFields) ? view.config.rowFields : [];
                        const viewChartType = view.config?.chartType || 'bar';
                        return (
                          <button
                            key={`saved-asset-${view.id}`}
                            type="button"
                            onClick={() => setActiveViewId(view.id)}
                            className={[
                              'w-full rounded-md border px-2.5 py-2 text-left transition',
                              view.id === activeViewId
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                            ].join(' ')}
                          >
                            <div className="font-semibold text-xs">{view.name}</div>
                            <div className="mt-1 text-[11px] opacity-80">
                              Table • {viewChartType} chart • {viewValueFields.length} metric card(s) • {Math.max(viewRowFields.length, 1)} list level(s)
                            </div>
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-slate-900">List Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {pivot.rows.slice(0, 8).map(row => (
                        <div key={`list-row-${row.id}`} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                          <div className="text-xs font-medium text-slate-800 truncate">
                            {buildRowLabel(row)}
                          </div>
                        </div>
                      ))}
                      {pivot.rows.length === 0 && (
                        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                          No list rows yet. Add row/value fields in Settings.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {renderPreviewTable(true)}
              </div>
              )}
              </div>
            </motion.div>
      </div>
    </div>
  );
};

export default DataLabWorkspace;
