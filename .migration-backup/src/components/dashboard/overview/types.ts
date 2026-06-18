import type { LazyExoticComponent, ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { SalesData, NewClientData, PayrollData, LateCancellationsData, ExpirationData } from '@/types/dashboard';
import type { LeadsData } from '@/types/leads';
import type { SessionData } from '@/hooks/useSessionsData';
import type { CheckinData } from '@/hooks/useCheckinsData';

export type OverviewModuleId =
  | 'sales-analytics'
  | 'funnel-leads'
  | 'client-retention'
  | 'trainer-performance'
  | 'class-attendance'
  | 'discounts-promotions'
  | 'class-formats'
  | 'late-cancellations'
  | 'patterns-trends'
  | 'expiration-analytics'
  | 'dashboard-workbench';

export type OverviewValueFormat = 'currency' | 'number' | 'percentage' | 'text' | 'days';
export type OverviewAccent = 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'teal' | 'indigo' | 'slate';

export interface OverviewFiltersShape {
  dateRange: {
    start: string;
    end: string;
  };
  location: string[];
}

export interface OverviewDataBundle {
  sales: SalesData[];
  leads: LeadsData[];
  newClients: NewClientData[];
  payroll: PayrollData[];
  sessions: SessionData[];
  lateCancellations: LateCancellationsData[];
  expirations: ExpirationData[];
  checkins: CheckinData[];
  filters: OverviewFiltersShape;
}

export interface OverviewMetricCard {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  accent: OverviewAccent;
}

export interface OverviewChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface OverviewChartDefinition {
  id: string;
  title: string;
  description: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: OverviewChartSeries[];
  format?: OverviewValueFormat;
  emptyMessage?: string;
}

export interface OverviewRankingEntry {
  label: string;
  value: number;
  secondary?: string;
}

export interface OverviewRankingDefinition {
  id: string;
  title: string;
  description: string;
  format: OverviewValueFormat;
  accent: OverviewAccent;
  entries: OverviewRankingEntry[];
}

export interface OverviewTableColumn {
  key: string;
  label: string;
  format?: OverviewValueFormat;
  align?: 'left' | 'right' | 'center';
}

export interface OverviewTableDefinition {
  id: string;
  title: string;
  description: string;
  columns: OverviewTableColumn[];
  rows: Array<Record<string, string | number>>;
  emptyMessage?: string;
}

export interface OverviewModuleContent {
  title: string;
  subtitle: string;
  cards: OverviewMetricCard[];
  charts: [OverviewChartDefinition, OverviewChartDefinition];
  topRanking: OverviewRankingDefinition;
  bottomRanking: OverviewRankingDefinition;
  tables: [OverviewTableDefinition, OverviewTableDefinition];
}

export interface OverviewAdapterProps {
  data: OverviewDataBundle;
}

export interface OverviewModuleDefinition {
  id: OverviewModuleId;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: OverviewAccent;
  adapter: LazyExoticComponent<ComponentType<OverviewAdapterProps>>;
}
