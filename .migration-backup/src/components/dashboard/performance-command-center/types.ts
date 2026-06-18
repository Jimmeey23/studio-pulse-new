import type { LucideIcon } from 'lucide-react';

export type PerformanceValueFormat = 'currency' | 'number' | 'percentage' | 'text';

export interface PerformanceMetricCard {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  format: PerformanceValueFormat;
  description: string;
  changePercent: number;
  trend: 'up' | 'down' | 'flat';
  icon: LucideIcon;
  accent: string;
}

export interface PerformanceMonthlyRow {
  monthKey: string;
  monthLabel: string;
  salesRevenue: number;
  atv: number;
  uniqueMembers: number;
  classAverage: number;
  fillRate: number;
  visitors: number;
  revenuePerVisit: number;
  lapsed: number;
}

export interface PerformanceChartSeries {
  key: string;
  label: string;
  color: string;
  format?: PerformanceValueFormat;
}

export interface PerformanceChart {
  id: string;
  title: string;
  description: string;
  xKey: string;
  data: Array<Record<string, string | number>>;
  series: PerformanceChartSeries[];
  format?: PerformanceValueFormat;
}

export interface PerformanceTableColumn {
  key: string;
  label: string;
  format?: PerformanceValueFormat;
  align?: 'left' | 'right' | 'center';
}

export interface PerformanceTable {
  id: string;
  title: string;
  description: string;
  columns: PerformanceTableColumn[];
  rows: Array<Record<string, string | number>>;
}

export interface PerformanceRankingEntry {
  label: string;
  value: number;
  secondary?: string;
}

export interface PerformanceRankingCriterion {
  id: string;
  label: string;
  format: PerformanceValueFormat;
  top: PerformanceRankingEntry[];
  bottom: PerformanceRankingEntry[];
}

export interface PerformanceSection {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  table: PerformanceTable;
  charts: [PerformanceChart, PerformanceChart];
  rankingCriteria: PerformanceRankingCriterion[];
}

export interface PerformanceCommandCenterModel {
  metricCards: PerformanceMetricCard[];
  monthlyRows: PerformanceMonthlyRow[];
  summary: string[];
  sections: PerformanceSection[];
}
