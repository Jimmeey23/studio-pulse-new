import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Clock,
  Database as DatabaseIcon,
  DollarSign,
  Eye,
  EyeOff,
  GripVertical,
  LayoutGrid,
  List,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'premium' | 'compact' | 'dense' | 'spotlight' | 'list';

interface DashboardGridProps {
  onButtonClick: (sectionId: string) => void;
}

interface DashboardSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hoverColor: string;
  insight: string;
}

const STORAGE_KEYS = {
  order: 'p57-home-card-order',
  hidden: 'p57-home-hidden-cards',
  view: 'p57-home-view-mode',
};

const VIEW_OPTIONS: Array<{ id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'premium', label: 'Premium', icon: Sparkles },
  { id: 'compact', label: 'Compact', icon: LayoutGrid },
  { id: 'dense', label: 'Dense', icon: LayoutGrid },
  { id: 'spotlight', label: 'Spotlight', icon: TrendingUp },
  { id: 'list', label: 'List', icon: List },
];

const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    description: 'High-level business metrics and KPIs',
    icon: TrendingUp,
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    insight: 'Leadership',
  },
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    description: 'One summary canvas across the core analytics modules with shared filters',
    icon: Eye,
    color: 'from-slate-600 to-slate-800',
    hoverColor: 'hover:from-slate-700 hover:to-slate-900',
    insight: 'Overview',
  },
  {
    id: 'performance-command-center',
    title: 'Performance Command Center',
    description: 'Executive metrics, month-on-month trends, section tables, charts, and rankings in one operating view',
    icon: Activity,
    color: 'from-cyan-600 to-indigo-700',
    hoverColor: 'hover:from-cyan-700 hover:to-indigo-800',
    insight: 'Command',
  },
  {
    id: 'sales-analytics',
    title: 'Sales Analytics',
    description: 'Revenue trends and sales performance',
    icon: DollarSign,
    color: 'from-green-500 to-green-600',
    hoverColor: 'hover:from-green-600 hover:to-green-700',
    insight: 'Revenue',
  },
  {
    id: 'class-attendance',
    title: 'Class Attendance',
    description: 'Session attendance and capacity analysis',
    icon: Users,
    color: 'from-purple-500 to-purple-600',
    hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    insight: 'Operations',
  },
  {
    id: 'trainer-performance',
    title: 'Trainer Performance',
    description: 'Individual trainer metrics and rankings',
    icon: UserCheck,
    color: 'from-orange-500 to-orange-600',
    hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    insight: 'Instructors',
  },
  {
    id: 'client-retention',
    title: 'Client Retention',
    description: 'Member retention and conversion analysis',
    icon: Target,
    color: 'from-teal-500 to-teal-600',
    hoverColor: 'hover:from-teal-600 hover:to-teal-700',
    insight: 'Retention',
  },
  {
    id: 'forecasting-action-center',
    title: 'Forecasting & Action Center',
    description: 'Predict revenue, rank churn and renewal risk, and surface the next best actions to take',
    icon: Sparkles,
    color: 'from-violet-500 to-indigo-600',
    hoverColor: 'hover:from-violet-600 hover:to-indigo-700',
    insight: 'Predict',
  },
  {
    id: 'member-lifecycle',
    title: 'Member 360 & Lifecycle',
    description: 'See member value, engagement, reliability, and momentum in one behavior-first workspace',
    icon: Users,
    color: 'from-emerald-500 to-cyan-600',
    hoverColor: 'hover:from-emerald-600 hover:to-cyan-700',
    insight: 'Lifecycle',
  },
  {
    id: 'studio-pulse',
    title: 'Studio Pulse',
    description: 'Live 360 degree operating view across revenue, attendance, leads, payroll, and cancellations',
    icon: Activity,
    color: 'from-slate-700 to-slate-900',
    hoverColor: 'hover:from-slate-800 hover:to-black',
    insight: 'Pulse',
  },
  {
    id: 'discounts-promotions',
    title: 'Discounts & Promotions',
    description: 'Discount analysis and promotional effectiveness',
    icon: BarChart3,
    color: 'from-pink-500 to-pink-600',
    hoverColor: 'hover:from-pink-600 hover:to-pink-700',
    insight: 'Pricing',
  },
  {
    id: 'funnel-leads',
    title: 'Funnel & Leads',
    description: 'Lead conversion and sales funnel analysis',
    icon: Activity,
    color: 'from-indigo-500 to-indigo-600',
    hoverColor: 'hover:from-indigo-600 hover:to-indigo-700',
    insight: 'Growth',
  },
  {
    id: 'class-formats',
    title: 'Class Formats & Performance',
    description: 'Comprehensive PowerCycle vs Barre vs Strength analysis and comparison metrics',
    icon: BarChart3,
    color: 'from-cyan-500 to-cyan-600',
    hoverColor: 'hover:from-cyan-600 hover:to-cyan-700',
    insight: 'Formats',
  },
  {
    id: 'late-cancellations',
    title: 'Late Cancellations',
    description: 'Analysis of late cancellations and no-shows',
    icon: Clock,
    color: 'from-red-500 to-red-600',
    hoverColor: 'hover:from-red-600 hover:to-red-700',
    insight: 'Risk',
  },
  {
    id: 'patterns-trends',
    title: 'Patterns & Trends',
    description: 'Member visit patterns and product usage trends over time',
    icon: TrendingUp,
    color: 'from-indigo-500 to-purple-600',
    hoverColor: 'hover:from-indigo-600 hover:to-purple-700',
    insight: 'Trends',
  },
  {
    id: 'expiration-analytics',
    title: 'Expirations & Churn',
    description: 'Membership expirations and customer retention analysis',
    icon: Calendar,
    color: 'from-amber-500 to-amber-600',
    hoverColor: 'hover:from-amber-600 hover:to-amber-700',
    insight: 'Churn',
  },
  {
    id: 'outlier-analysis',
    title: 'Custom Data Lab',
    description: 'Build auto-saved advanced pivot tables and chart models across linked data sources',
    icon: DatabaseIcon,
    color: 'from-indigo-500 to-pink-600',
    hoverColor: 'hover:from-indigo-600 hover:to-pink-700',
    insight: 'Data Lab',
  },
  {
    id: 'executive-report',
    title: 'Executive Report',
    description: 'Select a studio and month to generate a full executive performance report with sales, classes, trainers, funnel, churn, and late cancellations',
    icon: Target,
    color: 'from-yellow-600 to-amber-700',
    hoverColor: 'hover:from-yellow-700 hover:to-amber-800',
    insight: 'Report',
  },
];

const DEFAULT_ORDER = DASHBOARD_SECTIONS.map((section) => section.id);

const parseArray = (value: string | null) => {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const normalizeOrder = (storedOrder: string[]) => {
  const valid = storedOrder.filter((id) => DEFAULT_ORDER.includes(id));
  return [...valid, ...DEFAULT_ORDER.filter((id) => !valid.includes(id))];
};

const reorderCards = (items: string[], draggedId: string, targetId: string) => {
  const source = items.indexOf(draggedId);
  const target = items.indexOf(targetId);
  if (source < 0 || target < 0 || source === target) return items;

  const updated = [...items];
  const [moved] = updated.splice(source, 1);
  updated.splice(target, 0, moved);
  return updated;
};

export const DashboardGrid: React.FC<DashboardGridProps> = memo(({ onButtonClick }) => {
  const [cardOrder, setCardOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_ORDER;
    return normalizeOrder(parseArray(window.localStorage.getItem(STORAGE_KEYS.order)));
  });
  const [hiddenCards, setHiddenCards] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    return parseArray(window.localStorage.getItem(STORAGE_KEYS.hidden));
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'premium';
    const stored = window.localStorage.getItem(STORAGE_KEYS.view) as ViewMode | null;
    return VIEW_OPTIONS.some((option) => option.id === stored) ? (stored as ViewMode) : 'premium';
  });

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.order, JSON.stringify(cardOrder));
  }, [cardOrder]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.hidden, JSON.stringify(hiddenCards));
  }, [hiddenCards]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.view, viewMode);
  }, [viewMode]);

  const orderedSections = useMemo(() => {
    const map = new Map(DASHBOARD_SECTIONS.map((section) => [section.id, section]));
    return normalizeOrder(cardOrder).map((id) => map.get(id)).filter(Boolean) as DashboardSection[];
  }, [cardOrder]);

  const visibleSections = useMemo(
    () => orderedSections.filter((section) => !hiddenCards.includes(section.id)),
    [orderedSections, hiddenCards]
  );

  const hiddenSections = useMemo(
    () => orderedSections.filter((section) => hiddenCards.includes(section.id)),
    [orderedSections, hiddenCards]
  );

  const handleCardClick = useCallback(
    (sectionId: string) => {
      onButtonClick(sectionId);
    },
    [onButtonClick]
  );

  const hideCard = useCallback((sectionId: string) => {
    setHiddenCards((previous) => (previous.includes(sectionId) ? previous : [...previous, sectionId]));
  }, []);

  const unhideCard = useCallback((sectionId: string) => {
    setHiddenCards((previous) => previous.filter((id) => id !== sectionId));
  }, []);

  const unhideAllCards = useCallback(() => {
    setHiddenCards([]);
  }, []);

  const resetLayout = useCallback(() => {
    setCardOrder(DEFAULT_ORDER);
    setHiddenCards([]);
    setViewMode('premium');
  }, []);

  const onDragStartCard = useCallback((sectionId: string) => {
    setDraggedCardId(sectionId);
  }, []);

  const onDragOverCard = useCallback(
    (event: React.DragEvent<HTMLDivElement>, sectionId: string) => {
      event.preventDefault();
      if (draggedCardId && draggedCardId !== sectionId) {
        setDragOverCardId(sectionId);
      }
    },
    [draggedCardId]
  );

  const onDropCard = useCallback(
    (event: React.DragEvent<HTMLDivElement>, targetId: string) => {
      event.preventDefault();
      if (!draggedCardId) return;

      setCardOrder((previous) => reorderCards(previous, draggedCardId, targetId));
      setDraggedCardId(null);
      setDragOverCardId(null);
    },
    [draggedCardId]
  );

  const gridClass = useMemo(() => {
    if (viewMode === 'list') return 'grid grid-cols-1 gap-4 p-2';
    if (viewMode === 'dense') return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2';
    if (viewMode === 'compact') return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2';
  }, [viewMode]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          {VIEW_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewMode(id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300',
                viewMode === id
                  ? 'border-slate-900 bg-slate-900 text-white shadow-[0_8px_18px_rgba(15,23,42,0.25)]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowHiddenPanel((previous) => !previous)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300"
          >
            <Eye className="w-3.5 h-3.5" />
            Hidden ({hiddenSections.length})
          </button>

          <Button
            variant="outline"
            onClick={resetLayout}
            className="h-8 rounded-full border-slate-200 px-3 text-xs"
          >
            Reset Layout
          </Button>
        </div>

        {showHiddenPanel && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-700">Hidden Cards</p>
              <button
                type="button"
                onClick={unhideAllCards}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Unhide all
              </button>
            </div>
            {hiddenSections.length === 0 ? (
              <p className="text-xs text-slate-500">No cards are hidden.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hiddenSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => unhideCard(section.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-slate-300"
                  >
                    {section.title}
                    <EyeOff className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={gridClass}>
        {visibleSections.map((section, index) => {
          const IconComponent = section.icon;
          const isSpotlight = viewMode === 'spotlight' && index === 0;
          const isCompact = viewMode === 'compact';
          const isDense = viewMode === 'dense';
          const isList = viewMode === 'list';

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: index * 0.03 }}
              whileHover={{ y: -5 }}
              draggable
              onDragStart={() => onDragStartCard(section.id)}
              onDragOver={(event) => onDragOverCard(event, section.id)}
              onDrop={(event) => onDropCard(event, section.id)}
              onDragEnd={() => {
                setDraggedCardId(null);
                setDragOverCardId(null);
              }}
              className={cn(isSpotlight && 'md:col-span-2 lg:col-span-2', dragOverCardId === section.id && 'ring-2 ring-cyan-300 rounded-2xl')}
            >
              <Card
                className={cn(
                  `group cursor-pointer relative overflow-hidden bg-white/90 border border-slate-200/70 ring-1 ring-white/70 shadow-lg hover:shadow-3xl transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02] transform-gpu before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-gradient-to-b ${section.color} before:opacity-80`,
                  isDense && 'rounded-xl',
                  isList && 'rounded-xl'
                )}
                onClick={() => handleCardClick(section.id)}
                style={{
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-2xl`} />

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/12 to-white/0 transform -skew-x-12 group-hover:animate-pulse" />
                </div>

                <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/85 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    {section.insight}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      hideCard(section.id);
                    }}
                    className="rounded-full border border-slate-200/70 bg-white/90 p-1 text-slate-500 transition-colors hover:text-slate-800"
                    aria-label={`Hide ${section.title}`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                </div>

                <CardHeader className={cn('relative z-10 flex items-start gap-3', isCompact ? 'pb-2 pt-5' : 'pb-3')}>
                  <div className="relative inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => event.stopPropagation()}
                      className="cursor-grab rounded-md bg-slate-100/90 p-1 text-slate-400 hover:text-slate-700"
                      aria-label="Drag card"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </button>

                    <div
                      className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${section.color} ${section.hoverColor} flex-shrink-0 flex items-center justify-center transition-all duration-600 group-hover:scale-110 group-hover:-translate-y-1 shadow-lg group-hover:shadow-2xl`}
                      style={{
                        boxShadow: '0 6px 16px rgba(15, 23, 42, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                      }}
                    >
                      <div className="absolute inset-[-10px] rounded-lg bg-white/40 blur-lg opacity-0 group-hover:opacity-80 transition-opacity duration-600" />
                      <IconComponent className="w-5 h-5 text-white transition-all duration-600 group-hover:scale-110 group-hover:rotate-6" />
                      <div className={`absolute inset-[-2px] rounded-xl bg-gradient-to-r ${section.color} opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-600 -z-10`} />
                    </div>
                  </div>

                  <div className="flex-1 pt-1 pr-3">
                    <CardTitle className={cn('font-bold text-slate-950 transition-all duration-500 leading-tight', isDense ? 'text-base' : 'text-xl')}>
                      {section.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className={cn('relative z-10', isCompact ? 'pt-0 pb-4' : 'pt-2')}>
                  {!isCompact && (
                    <p className={cn('text-slate-700 leading-relaxed mb-4 transition-all duration-600 group-hover:text-slate-950', isDense ? 'text-[11px]' : 'text-xs')}>
                      {section.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-[11px] text-slate-500 transition-all duration-600 group-hover:text-emerald-600">
                      <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse group-hover:scale-125 transition-all duration-600 mr-2" />
                      <span className="font-semibold tracking-tight">Live</span>
                    </div>

                    <div className={`inline-flex items-center gap-1.5 rounded-full bg-white/90 group-hover:bg-gradient-to-br ${section.color} px-2.5 py-1 transition-all duration-500 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_10px_rgba(15,23,42,0.12)] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_16px_rgba(59,130,246,0.25)]`}>
                      <span className="text-[11px] font-semibold text-slate-700 group-hover:text-white transition-colors">Open</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-white transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
