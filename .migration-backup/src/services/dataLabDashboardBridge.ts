import type {
  OverviewAccent,
  OverviewChartDefinition,
  OverviewModuleId,
  OverviewTableDefinition,
  OverviewValueFormat,
} from '@/components/dashboard/overview/types';

const STORAGE_KEY = 'p57-dashboard-overview-datalab-assets-v1';
export const DATA_LAB_DASHBOARD_ASSETS_UPDATED_EVENT = 'p57-dashboard-overview-assets-updated';

export interface DataLabDashboardCard {
  id: string;
  title: string;
  value: string;
  description: string;
  accent: OverviewAccent;
  sourceViewId: string;
  sourceViewName: string;
  createdAt: number;
}

export interface DataLabDashboardChart {
  id: string;
  title: string;
  description: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: Array<{ key: string; label: string; color: string }>;
  format?: OverviewValueFormat;
  emptyMessage?: string;
  sourceViewId: string;
  sourceViewName: string;
  createdAt: number;
}

export interface DataLabDashboardTable {
  id: string;
  title: string;
  description: string;
  columns: OverviewTableDefinition['columns'];
  rows: OverviewTableDefinition['rows'];
  emptyMessage?: string;
  sourceViewId: string;
  sourceViewName: string;
  createdAt: number;
}

export interface DataLabModuleAssets {
  cards: DataLabDashboardCard[];
  charts: DataLabDashboardChart[];
  tables: DataLabDashboardTable[];
}

type DataLabStore = Partial<Record<OverviewModuleId, DataLabModuleAssets>>;

const emptyModuleAssets = (): DataLabModuleAssets => ({
  cards: [],
  charts: [],
  tables: [],
});

const normaliseStore = (raw: unknown): DataLabStore => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const parsed = raw as Record<string, any>;
  const store: DataLabStore = {};

  Object.keys(parsed).forEach((moduleId) => {
    const value = parsed[moduleId];
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    store[moduleId as OverviewModuleId] = {
      cards: Array.isArray(value.cards) ? value.cards : [],
      charts: Array.isArray(value.charts) ? value.charts : [],
      tables: Array.isArray(value.tables) ? value.tables : [],
    };
  });

  return store;
};

export const loadDataLabDashboardAssetsStore = (): DataLabStore => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normaliseStore(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
};

export const saveDataLabDashboardAssetsStore = (store: DataLabStore) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(DATA_LAB_DASHBOARD_ASSETS_UPDATED_EVENT));
};

export const getDataLabAssetsForModule = (moduleId: OverviewModuleId): DataLabModuleAssets => {
  const store = loadDataLabDashboardAssetsStore();
  return store[moduleId] ?? emptyModuleAssets();
};

export const addDataLabCardToModule = (moduleId: OverviewModuleId, card: DataLabDashboardCard, maxItems = 8) => {
  const store = loadDataLabDashboardAssetsStore();
  const current = store[moduleId] ?? emptyModuleAssets();
  const deduped = [card, ...current.cards.filter((item) => item.id !== card.id)].slice(0, maxItems);
  store[moduleId] = { ...current, cards: deduped };
  saveDataLabDashboardAssetsStore(store);
};

export const addDataLabChartToModule = (moduleId: OverviewModuleId, chart: DataLabDashboardChart, maxItems = 4) => {
  const store = loadDataLabDashboardAssetsStore();
  const current = store[moduleId] ?? emptyModuleAssets();
  const deduped = [chart, ...current.charts.filter((item) => item.id !== chart.id)].slice(0, maxItems);
  store[moduleId] = { ...current, charts: deduped };
  saveDataLabDashboardAssetsStore(store);
};

export const addDataLabTableToModule = (moduleId: OverviewModuleId, table: DataLabDashboardTable, maxItems = 4) => {
  const store = loadDataLabDashboardAssetsStore();
  const current = store[moduleId] ?? emptyModuleAssets();
  const deduped = [table, ...current.tables.filter((item) => item.id !== table.id)].slice(0, maxItems);
  store[moduleId] = { ...current, tables: deduped };
  saveDataLabDashboardAssetsStore(store);
};

export const updateDataLabTableInModule = (
  moduleId: OverviewModuleId,
  tableId: string,
  updater: (table: DataLabDashboardTable) => DataLabDashboardTable
) => {
  const store = loadDataLabDashboardAssetsStore();
  const current = store[moduleId] ?? emptyModuleAssets();
  const nextTables = current.tables.map((table) => (table.id === tableId ? updater(table) : table));
  store[moduleId] = { ...current, tables: nextTables };
  saveDataLabDashboardAssetsStore(store);
};

export const asOverviewCharts = (charts: DataLabDashboardChart[]): OverviewChartDefinition[] =>
  charts.map((chart) => ({
    id: chart.id,
    title: chart.title,
    description: chart.description,
    data: chart.data,
    xKey: chart.xKey,
    series: chart.series,
    format: chart.format,
    emptyMessage: chart.emptyMessage,
  }));

export const asOverviewTables = (tables: DataLabDashboardTable[]): OverviewTableDefinition[] =>
  tables.map((table) => ({
    id: table.id,
    title: table.title,
    description: table.description,
    columns: table.columns,
    rows: table.rows,
    emptyMessage: table.emptyMessage,
  }));
