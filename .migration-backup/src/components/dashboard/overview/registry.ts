import React from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock3,
  Percent,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  LayoutGrid,
} from 'lucide-react';
import type { OverviewModuleDefinition, OverviewModuleId } from './types';

export const overviewModules: OverviewModuleDefinition[] = [
  {
    id: 'sales-analytics',
    label: 'Sales Analytics',
    description: 'Revenue, pricing, and payment mix',
    icon: BarChart3,
    accent: 'emerald',
    adapter: React.lazy(() => import('./adapters/SalesAnalyticsOverviewAdapter')),
  },
  {
    id: 'funnel-leads',
    label: 'Funnel & Leads',
    description: 'Lead quality, source, and conversion',
    icon: TrendingUp,
    accent: 'indigo',
    adapter: React.lazy(() => import('./adapters/FunnelLeadsOverviewAdapter')),
  },
  {
    id: 'client-retention',
    label: 'Client Retention',
    description: 'Newcomer conversion and retention',
    icon: Users,
    accent: 'teal',
    adapter: React.lazy(() => import('./adapters/ClientRetentionOverviewAdapter')),
  },
  {
    id: 'trainer-performance',
    label: 'Trainer Performance',
    description: 'Trainer revenue and cohort impact',
    icon: UserCheck,
    accent: 'amber',
    adapter: React.lazy(() => import('./adapters/TrainerPerformanceOverviewAdapter')),
  },
  {
    id: 'class-attendance',
    label: 'Class Attendance',
    description: 'Attendance and fill efficiency',
    icon: Calendar,
    accent: 'blue',
    adapter: React.lazy(() => import('./adapters/ClassAttendanceOverviewAdapter')),
  },
  {
    id: 'discounts-promotions',
    label: 'Discounts & Promotions',
    description: 'Discount depth and product exposure',
    icon: Percent,
    accent: 'rose',
    adapter: React.lazy(() => import('./adapters/DiscountsOverviewAdapter')),
  },
  {
    id: 'class-formats',
    label: 'Class Formats',
    description: 'PowerCycle, Barre, Strength, Hosted',
    icon: Sparkles,
    accent: 'purple',
    adapter: React.lazy(() => import('./adapters/ClassFormatsOverviewAdapter')),
  },
  {
    id: 'late-cancellations',
    label: 'Late Cancellations',
    description: 'Cancellation intensity and risk pockets',
    icon: Clock3,
    accent: 'rose',
    adapter: React.lazy(() => import('./adapters/LateCancellationsOverviewAdapter')),
  },
  {
    id: 'patterns-trends',
    label: 'Patterns & Trends',
    description: 'Behavior signals and product momentum',
    icon: Activity,
    accent: 'indigo',
    adapter: React.lazy(() => import('./adapters/PatternsOverviewAdapter')),
  },
  {
    id: 'expiration-analytics',
    label: 'Expirations & Churn',
    description: 'Status mix and churn pockets',
    icon: AlertTriangle,
    accent: 'amber',
    adapter: React.lazy(() => import('./adapters/ExpirationOverviewAdapter')),
  },
  {
    id: 'dashboard-workbench',
    label: 'Dashboard Workbench',
    description: 'Paste copied tables, cards, charts, and lists',
    icon: LayoutGrid,
    accent: 'slate',
    adapter: React.lazy(() => import('@/components/dashboard/DashboardWorkbench')),
  },
];

export const overviewModulesById = overviewModules.reduce<Record<OverviewModuleId, OverviewModuleDefinition>>((accumulator, module) => {
  accumulator[module.id] = module;
  return accumulator;
}, {} as Record<OverviewModuleId, OverviewModuleDefinition>);
