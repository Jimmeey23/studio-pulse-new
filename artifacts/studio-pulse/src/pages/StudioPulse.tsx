import React, { memo, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart2,
  Bell,
  BookOpen,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleDollarSign,
  Coins,
  Crown,
  Filter,
  Flame,
  Layers,
  LineChart,
  MapPin,
  Medal,
  Percent,
  PersonStanding,
  RefreshCcw,
  RefreshCw,
  Repeat,
  RotateCcw,
  Scan,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  Target,
  ThumbsDown,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserCheck,
  UserCog,
  UserPlus,
  UserRoundCheck,
  Users,
  Wallet,
  Zap,
  ChevronsUpDown,
} from 'lucide-react';

import { Footer } from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { StudioPulseFilterSection } from '@/components/dashboard/StudioPulseFilterSection';
import { SheetStructureCheck } from '@/components/dashboard/SheetStructureCheck';
import { StudioPulseMetricCard } from '@/components/dashboard/StudioPulseMetricCard';
import InsightDetailDialog from '@/components/dashboard/InsightDetailDialog';
import { UniversalDrillDownModal } from '@/components/dashboard/UniversalDrillDownModal';
import { MonthOnMonthTableNew } from '@/components/dashboard/MonthOnMonthTableNew';
import { ClientConversionMonthOnMonthByTypeTable, NewClientMembershipPurchasesTable } from '@/components/dashboard/ClientConversionMonthOnMonthByTypeTableEnhanced';
import { FloatingAISectionPanel } from '@/components/dashboard/FloatingAISectionPanel';
import { UnifiedTopBottomSellers } from '@/components/dashboard/UnifiedTopBottomSellers';
import DetailedComparisonView from '@/components/dashboard/DetailedComparisonView';
import { LocationReportComprehensive } from '@/components/dashboard/LocationReportComprehensive';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useStudioAISummary } from '@/hooks/useStudioAISummary';
import { useRecurringSessionsData } from '@/hooks/useRecurringSessionsData';
import { useCheckinsData } from '@/hooks/useCheckinsData';

import { TrainerNameCell, TrainerAvatar } from '@/components/ui/TrainerAvatar';
import { mapLocationIdToTab } from '@/utils/memberLifecycleFilters';
import { getDashboardDefaultDateRange, parseDate } from '@/utils/dateUtils';
import { isLeadConverted } from '@/utils/leadConversions';
import { isInNewClientCohort, isConvertedInCohort, isRetainedInCohort } from '@/utils/clientRetention';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { usePresenterMode, PulseSnapshot } from '@/hooks/usePresenterMode';
import { PresenterToolbar } from '@/components/dashboard/PresenterToolbar';
import { PresenterAnnotationOverlay } from '@/components/dashboard/PresenterAnnotationOverlay';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminCodeGate } from '@/components/ui/AdminCodeGate';
import { useToast } from '@/hooks/use-toast';
import { StudioPulseReport } from '@/components/dashboard/StudioPulseReport';
import { geminiService, type LocationReportNarrative } from '@/services/geminiService';
import { UnifiedExportButton, type ExportFormat } from '@/components/ui/UnifiedExportButton';

/* ------------------------------------------------------------------ */
/* Studio definitions                                                  */
/* ------------------------------------------------------------------ */

type StudioId = 'all' | 'kwality' | 'supreme' | 'kenkere' | 'popup';

interface StudioDef {
  id: StudioId;
  name: string;
  area: string;
  accent: string; // gradient classes for the active tab + accents
  ring: string;
}

const STUDIOS: StudioDef[] = [
  { id: 'all', name: 'All Studios', area: 'Mumbai & Bengaluru', accent: 'from-slate-700 to-slate-900', ring: 'ring-slate-300' },
  { id: 'kwality', name: 'Kwality House', area: 'Kemps Corner, Mumbai', accent: 'from-blue-700 to-blue-900', ring: 'ring-blue-300' },
  { id: 'supreme', name: 'Supreme HQ', area: 'Bandra, Mumbai', accent: 'from-fuchsia-600 to-purple-700', ring: 'ring-fuchsia-300' },
  { id: 'kenkere', name: 'Kenkere House', area: 'Bengaluru', accent: 'from-emerald-600 to-teal-700', ring: 'ring-emerald-300' },
  { id: 'popup', name: 'Pop-up', area: 'Roaming', accent: 'from-amber-500 to-orange-600', ring: 'ring-amber-300' },
];

const FORMAT_COLORS: Record<string, string> = {
  Barre: '#1d4ed8',
  PowerCycle: '#06b6d4',
  Strength: '#f59e0b',
  Other: '#94a3b8',
};

type SalesMetricsMatrixRow = {
  label: string;
  type: 'currency' | 'number' | 'percent';
  values: Record<string, number>;
};

type SalesMetricDefinition = {
  definition: string;
  formula: string;
  businessMeaning: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const monthKeyFromDate = (value?: string): string | null => {
  if (!value) return null;
  const d = parseDate(value);
  if (!d || isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const getPreviousMonthKey = () => {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
};

const inStudio = (locationValue: string | undefined, studio: StudioId): boolean => {
  if (studio === 'all') return true;
  return mapLocationIdToTab(locationValue) === studio;
};

const normalizeClassName = (value?: string): string => {
  if (!value) return 'Unknown';
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/physique\s*57/gi, 'Physique57')
    .replace(/\s*[-–—]\s*(online|virtual|zoom|fb live|facebook live|livestream)/gi, '')
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s+#?\d+$/g, '')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    || 'Unknown';
};

const classifyFormat = (value?: string): keyof typeof FORMAT_COLORS => {
  const v = (value || '').toLowerCase();
  if (v.includes('powercycle')) return 'PowerCycle';
  if (v.includes('strength lab')) return 'Strength';
  return 'Barre';
};

const pctChange = (current: number, previous: number): number | null => {
  if (!previous) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
};

const formatSalesMetricCell = (value: number, type: SalesMetricsMatrixRow['type']) => {
  if (type === 'currency') return formatCurrency(value);
  if (type === 'percent') return formatPercentage(value);
  return formatNumber(value);
};

const salesMetricTypeMap: Record<string, 'metric' | 'product' | 'category' | 'seller' | 'member'> = {
  'Gross Sales': 'metric',
  'Net Sales': 'metric',
  'Transactions': 'metric',
  'Unique Members': 'member',
  'Average Transaction Value': 'metric',
  'Discount Value': 'metric',
  'Discounted Transactions': 'metric',
  'Discount Penetration': 'metric',
  'VAT Collected': 'metric',
  'Money Credits Used': 'metric',
  'Package Sales': 'category',
  'Retail Sales': 'category',
  'Membership Sales': 'category',
  'Drop-in Sales': 'product',
  'Online / System Sales': 'seller',
  'Top Seller Share': 'seller',
  'Distinct Products Sold': 'product',
  'Distinct Categories Sold': 'category',
  'Average Revenue per Member': 'member',
  'Promo-led Sales': 'metric',
};

const salesMetricDefinitions: Record<string, SalesMetricDefinition> = {
  'Gross Sales': {
    definition: 'Total billed sales value before deducting VAT.',
    formula: 'Sum of `paymentValue`.',
    businessMeaning: 'Shows topline commercial throughput and billing momentum.'
  },
  'Net Sales': {
    definition: 'Sales value after removing VAT from billed revenue.',
    formula: 'Sum of `paymentValue - paymentVAT`.',
    businessMeaning: 'Tracks the real revenue retained by the business from sales.'
  },
  'Transactions': {
    definition: 'Count of completed sales records in the period.',
    formula: 'Number of sales rows.',
    businessMeaning: 'Shows sales volume and purchase activity intensity.'
  },
  'Unique Members': {
    definition: 'Distinct members or customers who made purchases.',
    formula: 'Distinct `memberId` or fallback customer identity count.',
    businessMeaning: 'Shows customer reach and breadth of monetized engagement.'
  },
  'Average Transaction Value': {
    definition: 'Average net revenue generated per transaction.',
    formula: 'Net Sales / Transactions.',
    businessMeaning: 'Shows ticket size and upsell quality per purchase.'
  },
  'Discount Value': {
    definition: 'Total discount amount granted across eligible sales.',
    formula: 'Sum of `discountAmount`.',
    businessMeaning: 'Shows how much revenue was traded off to convert or retain demand.'
  },
  'Discounted Transactions': {
    definition: 'Transactions where a discount amount or percentage was applied.',
    formula: 'Count of rows with `discountAmount > 0` or `discountPercentage > 0`.',
    businessMeaning: 'Shows how frequently discounting is being used to close sales.'
  },
  'Discount Penetration': {
    definition: 'Share of transactions that carried a discount.',
    formula: 'Discounted Transactions / Transactions × 100.',
    businessMeaning: 'Shows how dependent the business is on discount-led conversion.'
  },
  'VAT Collected': {
    definition: 'Total VAT component collected on billed sales.',
    formula: 'Sum of `paymentVAT`.',
    businessMeaning: 'Helps separate statutory tax collections from operating revenue.'
  },
  'Money Credits Used': {
    definition: 'Value settled through money credits instead of direct payment.',
    formula: 'Sum of `paidInMoneyCredits`.',
    businessMeaning: 'Shows how much revenue was fulfilled through stored value or credits.'
  },
  'Package Sales': {
    definition: 'Net sales attributed to package-category products.',
    formula: 'Net Sales where `cleanedCategory` contains package.',
    businessMeaning: 'Shows package-led revenue contribution and commitment buying behavior.'
  },
  'Retail Sales': {
    definition: 'Net sales attributed to retail-category products.',
    formula: 'Net Sales where `cleanedCategory` contains retail.',
    businessMeaning: 'Shows ancillary merchandising contribution beyond core sessions.'
  },
  'Membership Sales': {
    definition: 'Net sales attributed to memberships or membership-like products.',
    formula: 'Net Sales where `membershipType` or `cleanedCategory` contains member.',
    businessMeaning: 'Shows recurring-access style demand and membership monetization strength.'
  },
  'Drop-in Sales': {
    definition: 'Net sales from single-class, trial, or drop-in purchases.',
    formula: 'Net Sales where product text contains drop, single, or trial.',
    businessMeaning: 'Shows lower-commitment entry demand and newcomer conversion opportunity.'
  },
  'Online / System Sales': {
    definition: 'Net sales attributed to online, system, or unattributed seller records.',
    formula: 'Net Sales where `soldBy` is blank, `-`, online, or system.',
    businessMeaning: 'Shows how much revenue is coming through non-human or self-serve channels.'
  },
  'Top Seller Share': {
    definition: 'Share of net sales contributed by the strongest seller for the period.',
    formula: 'Highest seller net revenue / Net Sales × 100.',
    businessMeaning: 'Shows concentration risk and dependence on top individual sellers.'
  },
  'Distinct Products Sold': {
    definition: 'Count of different products sold in the period.',
    formula: 'Distinct count of `cleanedProduct`.',
    businessMeaning: 'Shows assortment breadth and product mix diversity.'
  },
  'Distinct Categories Sold': {
    definition: 'Count of different sales categories represented in the period.',
    formula: 'Distinct count of `cleanedCategory`.',
    businessMeaning: 'Shows how balanced revenue is across major product families.'
  },
  'Average Revenue per Member': {
    definition: 'Average net revenue generated per purchasing member.',
    formula: 'Net Sales / Unique Members.',
    businessMeaning: 'Shows monetization depth per buyer and customer value quality.'
  },
  'Promo-led Sales': {
    definition: 'Net sales coming from promotional or discounted transactions.',
    formula: 'Net Sales where `isPromotional` is true or a discount was applied.',
    businessMeaning: 'Shows how much revenue is being driven by promotional mechanics.'
  },
};

const isWithinRange = (value: string | undefined, range: { start: string; end: string }): boolean => {
  const date = value ? parseDate(value) : null;
  if (!date) return false;

  const start = range.start ? new Date(`${range.start}T00:00:00`) : null;
  const end = range.end ? new Date(`${range.end}T23:59:59.999`) : null;

  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
};

// Converts "May-2026" or "May 2026" to "2026-05" for ISO comparison.
// Falls back to slicing if already ISO-like ("2026-05-01" → "2026-05").
const normalizeMonthYearToISO = (value: string): string => {
  if (/^\d{4}-\d{2}/.test(value)) return value.slice(0, 7);
  const normalized = value.replace(/-/g, ' ').trim();
  const parsed = new Date(`1 ${normalized}`);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
  }
  return value.slice(0, 7);
};

const isMonthKeyWithinRange = (value: string | undefined, range: { start: string; end: string }): boolean => {
  if (!value) return false;

  const normalizedValue = normalizeMonthYearToISO(value);
  const startKey = range.start ? range.start.slice(0, 7) : '';
  const endKey = range.end ? range.end.slice(0, 7) : '';

  if (startKey && normalizedValue < startKey) return false;
  if (endKey && normalizedValue > endKey) return false;
  return true;
};

const shiftRangeBackOneMonth = (range: { start: string; end: string }) => {
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T00:00:00`);
  const shiftedStart = new Date(start.getFullYear(), start.getMonth() - 1, start.getDate());
  const shiftedEnd = new Date(end.getFullYear(), end.getMonth() - 1, end.getDate());

  const format = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { start: format(shiftedStart), end: format(shiftedEnd) };
};

const shiftRangeBackOneYear = (range: { start: string; end: string }) => {
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T00:00:00`);
  const shiftedStart = new Date(start.getFullYear() - 1, start.getMonth(), start.getDate());
  const shiftedEnd = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());

  const format = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { start: format(shiftedStart), end: format(shiftedEnd) };
};

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

const RANK_ICONS_TOP = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
const RANK_ICONS_BOTTOM = ['🔴','🟠','🟡','⚠️','📉','📉','📉','📉','📉','📉'];
const RANK_ICONS = RANK_ICONS_TOP;

const AnimatedSectionCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconGradient: string;
  iconColor?: string;
  sectionNumber?: number;
  className?: string;
  action?: React.ReactNode;
  onAIPanel?: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, icon: Icon, iconGradient, iconColor = '#6366f1', sectionNumber, className, action, onAIPanel, children }) => {
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const roman = sectionNumber !== undefined ? ROMAN[sectionNumber - 1] : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={cn('rounded-3xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.10)] backdrop-blur-md overflow-hidden', className)}
    >
      <div
        className="flex items-center justify-between gap-4 px-7 py-5 border-b-[1.5px]"
        style={{ borderBottomColor: `${iconColor}40`, background: `linear-gradient(135deg, ${iconColor}0c 0%, transparent 55%)` }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, -4, 4, -2, 2, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
            whileHover={{ scale: 1.12, rotate: 0 }}
            className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', iconGradient)}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
          <div>
            {roman && (
              <p
                className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: iconColor, fontFamily: "'Sora', 'Space Grotesk', sans-serif" }}
              >
                Section {roman}
              </p>
            )}
            <h3
              className="text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-slate-900"
              style={{ fontFamily: "'Sora', 'Space Grotesk', sans-serif" }}
            >
              {title}
            </h3>
            {subtitle && <p className="mt-0.5 text-[12px] font-medium text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {onAIPanel && (
            <button
              type="button"
              title="Open AI Insights panel"
              onClick={onAIPanel}
              className="group flex h-8 w-8 items-center justify-center rounded-xl border border-violet-200 bg-white text-violet-500 shadow-sm transition-all duration-150 hover:border-violet-400 hover:bg-violet-50 hover:shadow-md hover:text-violet-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="p-7">
        {children}
      </div>
    </motion.div>
  );
};

const EmptyNote: React.FC<{ label?: string }> = ({ label = 'No data for this studio yet' }) => (
  <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-sm text-slate-400">
    {label}
  </div>
);

type MonthlyInsightData = {
  months: string[];
  latestMonth: string;
  latestMonthLabel: string;
  trend: Array<{
    month: string;
    label: string;
    sales: number;
    sessions: number;
    attendance: number;
    capacity: number;
    fillRate: number;
    leads: number;
    clients: number;
    converted: number;
    retained: number;
    ltc: number;
    expirations: number;
  }>;
  current: null | {
    month: string;
    sales: number;
    sessions: number;
    attendance: number;
    capacity: number;
    fillRate: number;
    leads: number;
    clients: number;
    converted: number;
    retained: number;
    ltc: number;
    expirations: number;
  };
  previous: null | {
    month: string;
    sales: number;
    sessions: number;
    attendance: number;
    capacity: number;
    fillRate: number;
    leads: number;
    clients: number;
    converted: number;
    retained: number;
    ltc: number;
    expirations: number;
  };
};

const StudioPulseMonthView: React.FC<{
  studioName: string;
  studioArea: string;
  dateRange: { start: string; end: string };
  monthlyInsight: MonthlyInsightData;
  salesStats: { net: number; growth: { net: number | null } };
  sessionStats: { totalSessions: number; attendance: number; growth: { totalSessions: number | null; attendance: number | null; avgFill: number | null }; avgFill: number };
}> = ({ studioName, studioArea, dateRange, monthlyInsight, salesStats, sessionStats }) => {
  const metricCards = [
    { label: 'Net Sales', value: monthlyInsight.current ? formatCurrency(monthlyInsight.current.sales) : formatCurrency(salesStats.net), delta: salesStats.growth.net },
    { label: 'Sessions', value: monthlyInsight.current ? formatNumber(monthlyInsight.current.sessions) : formatNumber(sessionStats.totalSessions), delta: sessionStats.growth.totalSessions },
    { label: 'Attendance', value: monthlyInsight.current ? formatNumber(monthlyInsight.current.attendance) : formatNumber(sessionStats.attendance), delta: sessionStats.growth.attendance },
    { label: 'Fill Rate', value: monthlyInsight.current ? formatPercentage(monthlyInsight.current.fillRate) : formatPercentage(sessionStats.avgFill), delta: sessionStats.growth.avgFill },
  ];

  return (
    <motion.div
      key={`month-view`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-7 py-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/45">Monthly insight report</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight">{monthlyInsight.latestMonthLabel}</h2>
              <p className="mt-2 max-w-3xl text-sm text-white/70">
                Month view consolidates the filtered studio into a denser operating readout with month-by-month revenue, attendance, conversion, and retention signals.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">Filtered scope</div>
              <div className="mt-1 text-lg font-bold">Monthly report mode</div>
              <div className="text-sm text-white/65">{studioName} · {dateRange.start} to {dateRange.end}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{card.value}</div>
              <div className="mt-2 text-xs font-medium text-slate-500">{card.delta === null ? 'No previous period' : `${card.delta > 0 ? '+' : ''}${card.delta.toFixed(1)}% vs previous month`}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">12-Month Trend</h3>
              <p className="text-sm text-slate-500">Revenue, attendance, conversion, and churn at month level.</p>
            </div>
          </div>
          <div className="grid gap-3">
            {monthlyInsight.trend.slice(-12).map((row) => (
              <div key={row.month} className="grid grid-cols-5 gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                <div className="font-semibold text-slate-700">{row.label}</div>
                <div className="text-right tabular-nums text-slate-900">{formatCurrency(row.sales)}</div>
                <div className="text-right tabular-nums text-slate-700">{formatNumber(row.attendance)}</div>
                <div className="text-right tabular-nums text-slate-700">{formatPercentage(row.fillRate)}</div>
                <div className="text-right tabular-nums text-slate-500">{formatNumber(row.ltc)} LCs</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Monthly Snapshot</h3>
          <p className="mt-1 text-sm text-slate-500">Current month vs prior month inside the filtered scope.</p>
          <div className="mt-4 space-y-3">
            {monthlyInsight.current ? [
              ['Sales', formatCurrency(monthlyInsight.current.sales), monthlyInsight.previous ? `${monthlyInsight.current.sales >= monthlyInsight.previous.sales ? 'Up' : 'Down'} vs prior month` : 'No prior month'],
              ['Sessions', formatNumber(monthlyInsight.current.sessions), monthlyInsight.previous ? `${monthlyInsight.current.sessions - monthlyInsight.previous.sessions >= 0 ? '+' : ''}${monthlyInsight.current.sessions - monthlyInsight.previous.sessions} vs prior month` : 'No prior month'],
              ['Leads', formatNumber(monthlyInsight.current.leads), monthlyInsight.previous ? `${monthlyInsight.current.leads - monthlyInsight.previous.leads >= 0 ? '+' : ''}${monthlyInsight.current.leads - monthlyInsight.previous.leads} vs prior month` : 'No prior month'],
              ['Expirations', formatNumber(monthlyInsight.current.expirations), monthlyInsight.previous ? `${monthlyInsight.current.expirations - monthlyInsight.previous.expirations >= 0 ? '+' : ''}${monthlyInsight.current.expirations - monthlyInsight.previous.expirations} vs prior month` : 'No prior month'],
            ] : [['Sales', formatCurrency(0), 'No monthly bucket found']].map(([label, value, sub]) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{value as string}</div>
                <div className="text-sm text-slate-500">{sub as string}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Monthly Operations Readout</h3>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Sessions</th>
                  <th className="px-4 py-3 text-right">Clients</th>
                  <th className="px-4 py-3 text-right">Late Cancels</th>
                </tr>
              </thead>
              <tbody>
                {monthlyInsight.trend.slice(-6).map((row) => (
                  <tr key={row.month} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-700">{row.label}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-900">{formatCurrency(row.sales)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.sessions)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.clients)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.ltc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Monthly Summary Notes</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Sales are being read at month granularity for the selected studio scope, with the latest month anchored to <span className="font-semibold text-slate-900">{monthlyInsight.latestMonthLabel}</span>.
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Month view keeps the same date range and location filters but makes monthly movement more visible for revenue, attendance, lead flow, and churn.
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Toggle back to the full report when you want the detailed sectional view and all drilldowns.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const chartTooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
  fontSize: 12,
};

/* ── 3D Bar shape for all BarCharts ─────────────────────────────────── */
const Custom3DBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0 || !width || width <= 0) return null;
  const d  = Math.min(10, width * 0.28);   // horizontal depth
  const dh = d * 0.55;                      // vertical depth offset
  // Top-face and side-face use CSS filter for lightening / darkening
  return (
    <g>
      {/* Front face — vertical gradient */}
      <defs>
        <linearGradient id={`fg-${fill?.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={fill} stopOpacity={1} />
          <stop offset="100%" stopColor={fill} stopOpacity={0.72} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={width} height={height} fill={`url(#fg-${fill?.replace('#','')})`} rx={2} />
      {/* Top face — lighter */}
      <path
        d={`M${x},${y} L${x+d},${y-dh} L${x+width+d},${y-dh} L${x+width},${y} Z`}
        fill={fill}
        fillOpacity={1}
        style={{ filter: 'brightness(1.55) saturate(0.85)' }}
      />
      {/* Right side face — darker */}
      <path
        d={`M${x+width},${y} L${x+width+d},${y-dh} L${x+width+d},${y+height-dh} L${x+width},${y+height} Z`}
        fill={fill}
        fillOpacity={0.85}
        style={{ filter: 'brightness(0.52)' }}
      />
    </g>
  );
};

const exportTableToSheet = (sheetName: string, columns: string[], rows: Array<Record<string, any>>) => {
  const worksheet = XLSX.utils.json_to_sheet(rows.map((row) => {
    const normalized: Record<string, any> = {};
    columns.forEach((column) => {
      normalized[column] = row[column] ?? '';
    });
    return normalized;
  }));
  XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: 'A1' });
  return { sheetName, worksheet };
};

const csvSafeValue = (value: any) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (value instanceof Set) return Array.from(value).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

/**
 * Normalise a formatted cell value (₹1.2K, ₹3.5L, ₹1.2Cr, 45.3%, 1,234) into
 * a raw JS number for clean spreadsheet cells. Returns the original string if
 * it cannot be parsed as a number (e.g. names, dates, mixed text).
 */
const deformatCellValue = (value: any): number | string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return csvSafeValue(value);
  let s = value.trim();
  if (!s || s === '—' || s === '-' || s === 'N/A') return s;
  // Detect intent
  const isCurrency = s.startsWith('₹') || s.startsWith('Rs') || s.startsWith('INR');
  const isPct = s.endsWith('%');
  if (isCurrency) s = s.replace(/^(₹|Rs\.?|INR)\s*/, '');
  if (isPct) s = s.slice(0, -1).trim();
  // Suffix multipliers (must check Cr before L before K)
  let multiplier = 1;
  if (/Cr$/i.test(s)) { multiplier = 10_000_000; s = s.replace(/Cr$/i, '').trim(); }
  else if (/Lk?$/i.test(s)) { multiplier = 100_000; s = s.replace(/Lk?$/i, '').trim(); }
  else if (/K$/i.test(s)) { multiplier = 1_000; s = s.replace(/K$/i, '').trim(); }
  // Strip thousands separators (Indian: 1,23,456 or Western: 1,234,567)
  s = s.replace(/,/g, '');
  const n = parseFloat(s);
  if (!isFinite(n)) return value; // unparseable — keep original string
  const result = n * multiplier;
  // Return integer when there's no meaningful decimal part
  return isPct ? result : (Number.isInteger(result) ? result : parseFloat(result.toFixed(2)));
};

/** Returns true if a registry-table row is a grouped/total/summary row that should be excluded. */
const isGroupOrTotalRow = (row: string[], headerCount: number): boolean => {
  const first = (row[0] || '').trim().toLowerCase();
  // Named total/summary rows
  if (/^(total|grand total|subtotal|all studios|all|sum|average|avg|overall)\b/i.test(first)) return true;
  // Group header rows: non-empty cells concentrated in first column, rest blank
  const nonEmpty = row.filter((c) => c.trim() !== '').length;
  if (nonEmpty === 1 && headerCount > 2) return true;
  // Separator rows (all dashes)
  if (row.every((c) => /^-+$/.test(c.trim()) || c.trim() === '')) return true;
  return false;
};

const camelToHeader = (key: string): string =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^[a-z]/, (c) => c.toUpperCase())
    .replace(/\bIst\b/g, 'IST')
    .replace(/\bVat\b/g, 'VAT')
    .replace(/\bLtv\b/g, 'LTV')
    .replace(/\bPct\b/g, '%')
    .replace(/\bId\b/g, 'ID')
    .trim();

const parseRegistryTable = (content: string): { title: string; headers: string[]; rows: string[][] } => {
  const lines = content.split('\n');
  const title = lines[0]?.trim() || 'Table';
  let headerIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t').filter(Boolean);
    if (parts.length >= 2) { headerIdx = i; break; }
  }
  if (headerIdx === -1) return { title, headers: [], rows: [] };
  const headers = lines[headerIdx].split('\t').map((h) => h.trim()).filter(Boolean);
  const rows = lines
    .slice(headerIdx + 1)
    .filter((l) => l.includes('\t'))
    .map((l) => l.split('\t').map((c) => c.trim()));
  return { title, headers, rows };
};

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

// ── Format Comparison Section ─────────────────────────────────────────────────
type FormatCompTab = 'overview' | 'trainer';

interface FormatMetrics {
  name: string;
  sessions: number;
  visits: number;
  capacity: number;
  revenue: number;
  lateCancels: number;
  classAvg: number;
  fillRate: number;
  cancellationRate: number;
  revPerSession: number;
  emptyClasses: number;
  trainers: string[];
  locations: string[];
  trendPct: number;
  trend: 'growing' | 'declining' | 'stable';
  consistency: number;
  // monthly trend for sparkline
  monthlyAvg: { month: string; avg: number; fill: number }[];
}

function FormatComparisonSection({ sessions, trainerTabOnly, activeTab: activeTabProp, onTabChange }: { sessions: any[]; trainerTabOnly?: boolean; activeTab?: FormatCompTab; onTabChange?: (tab: FormatCompTab) => void }) {
  const [localTab, setLocalTab] = useState<FormatCompTab>(trainerTabOnly ? 'trainer' : 'overview');
  const activeTab = activeTabProp ?? localTab;
  const setActiveTab = (tab: FormatCompTab) => { setLocalTab(tab); onTabChange?.(tab); };
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'classAvg' | 'fillRate' | 'revenue' | 'sessions' | 'emptyClasses' | 'cancellationRate' | 'lateCancels' | 'revPerSession' | 'consistency'>('classAvg');

  const formatMetrics = useMemo<FormatMetrics[]>(() => {
    const grouped: Record<string, typeof sessions> = {};
    sessions.forEach((s) => {
      const key = s.cleanedClass || s.classType || 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    });
    return Object.entries(grouped).map(([name, rows]) => {
      const visits = rows.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
      const capacity = rows.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
      const revenue = rows.reduce((sum, s) => sum + (Number(s.revenue) || Number(s.totalPaid) || 0), 0);
      const lateCancels = rows.reduce((sum, s) => sum + (Number(s.lateCancelledCount) || 0), 0);
      const classAvg = rows.length > 0 ? visits / rows.length : 0;
      const fillRate = capacity > 0 ? (visits / capacity) * 100 : 0;
      const cancellationRate = visits + lateCancels > 0 ? (lateCancels / (visits + lateCancels)) * 100 : 0;
      const revPerSession = rows.length > 0 ? revenue / rows.length : 0;
      const emptyClasses = rows.filter((s) => (Number(s.checkedInCount) || 0) === 0).length;
      const trainers = [...new Set(rows.map((s) => s.trainerName).filter(Boolean))];
      const locations = [...new Set(rows.map((s) => s.location).filter(Boolean))];

      // trend
      const sorted = [...rows].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const mid = Math.floor(sorted.length / 2);
      const firstAvg = mid > 0 ? sorted.slice(0, mid).reduce((s, r) => s + (Number(r.checkedInCount) || 0), 0) / mid : 0;
      const secondAvg = sorted.length - mid > 0 ? sorted.slice(mid).reduce((s, r) => s + (Number(r.checkedInCount) || 0), 0) / (sorted.length - mid) : 0;
      const trendPct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
      const trend: FormatMetrics['trend'] = trendPct > 5 ? 'growing' : trendPct < -5 ? 'declining' : 'stable';

      // consistency
      const mean = classAvg;
      const variance = rows.length > 0 ? rows.reduce((s, r) => { const d = (Number(r.checkedInCount) || 0) - mean; return s + d * d; }, 0) / rows.length : 0;
      const stdDev = Math.sqrt(variance);
      const consistency = mean > 0 ? Math.max(0, Math.round(100 - (stdDev / mean) * 100)) : 0;

      // monthly sparkline
      const byMonth: Record<string, { visits: number; cap: number; n: number }> = {};
      rows.forEach((s) => {
        const mk = (s.date || '').slice(0, 7);
        if (!mk) return;
        if (!byMonth[mk]) byMonth[mk] = { visits: 0, cap: 0, n: 0 };
        byMonth[mk].visits += Number(s.checkedInCount) || 0;
        byMonth[mk].cap += Number(s.capacity) || 0;
        byMonth[mk].n += 1;
      });
      const monthlyAvg = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, d]) => ({
        month,
        avg: d.n > 0 ? d.visits / d.n : 0,
        fill: d.cap > 0 ? (d.visits / d.cap) * 100 : 0,
      }));

      return { name, sessions: rows.length, visits, capacity, revenue, lateCancels, classAvg, fillRate, cancellationRate, revPerSession, emptyClasses, trainers, locations, trendPct, trend, consistency, monthlyAvg };
    }).sort((a, b) => b[sortBy] - a[sortBy]);
  }, [sessions, sortBy]);

  const selected = useMemo(() => formatMetrics.find((f) => f.name === selectedFormat) || null, [formatMetrics, selectedFormat]);

  const trendColor = (t: FormatMetrics['trend']) => t === 'growing' ? 'text-emerald-600' : t === 'declining' ? 'text-red-500' : 'text-slate-500';
  const trendBg = (t: FormatMetrics['trend']) => t === 'growing' ? 'bg-emerald-50 border-emerald-200' : t === 'declining' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200';

  // Recharts tooltip style (inline)
  const ttStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 11, padding: '6px 10px' };

  return (
    <div className="space-y-5">
      {/* Tab bar — hidden when trainerTabOnly */}
      {!trainerTabOnly && <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
          {([
            { value: 'overview', label: '📊 Overview' },
            { value: 'trainer', label: '👤 Trainer Comparison' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                activeTab === value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
              )}
            >{label}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Rank by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="classAvg">Class Avg</option>
            <option value="fillRate">Fill Rate</option>
            <option value="revenue">Revenue</option>
            <option value="sessions">Sessions</option>
            <option value="emptyClasses">Empty Classes</option>
            <option value="cancellationRate">Cancellation Rate</option>
            <option value="lateCancels">Late Cancels</option>
            <option value="revPerSession">Rev / Session</option>
            <option value="consistency">Consistency</option>
          </select>
        </div>
      </div>}

      {/* Overview tab — format cards */}
      {activeTab === 'overview' && (() => {
        const FMT_ORDER = ['PowerCycle', 'Barre', 'Strength'] as const;
        const FMT_GRAD: Record<string, string> = {
          PowerCycle: 'from-blue-600 via-indigo-600 to-indigo-700',
          Barre: 'from-purple-600 via-violet-600 to-violet-700',
          Strength: 'from-rose-500 via-pink-600 to-pink-700',
        };
        const FMT_ACCENT: Record<string, string> = {
          PowerCycle: 'bg-blue-500/20 text-blue-100',
          Barre: 'bg-purple-500/20 text-purple-100',
          Strength: 'bg-rose-500/20 text-rose-100',
        };
        const FMT_BAR: Record<string, string> = {
          PowerCycle: 'bg-blue-300',
          Barre: 'bg-purple-300',
          Strength: 'bg-rose-300',
        };

        const grouped: Record<string, typeof sessions> = {};
        FMT_ORDER.forEach((f) => { grouped[f] = []; });
        sessions.forEach((s) => { grouped[classifyFormat(s.cleanedClass || s.classType)].push(s); });

        const cards = FMT_ORDER.map((fmt) => {
          const rows = grouped[fmt];
          if (!rows.length) return null;
          const visits = rows.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
          const capacity = rows.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
          const revenue = rows.reduce((sum, s) => sum + (Number(s.revenue) || Number(s.totalPaid) || 0), 0);
          const lateCancels = rows.reduce((sum, s) => sum + (Number(s.lateCancelledCount) || 0), 0);
          const emptyClasses = rows.filter((s) => (Number(s.checkedInCount) || 0) === 0).length;
          const classAvg = rows.length ? visits / rows.length : 0;
          const fillRate = capacity ? (visits / capacity) * 100 : 0;

          const tv: Record<string, number> = {};
          rows.forEach((s) => { const t = s.trainerName || ''; if (t) tv[t] = (tv[t] || 0) + (Number(s.checkedInCount) || 0); });
          const topTrainer = Object.entries(tv).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

          const cv: Record<string, number> = {};
          rows.forEach((s) => { const c = s.cleanedClass || s.classType || ''; if (c) cv[c] = (cv[c] || 0) + (Number(s.checkedInCount) || 0); });
          const topClass = Object.entries(cv).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

          const tc: Record<string, number> = {};
          rows.forEach((s) => { const raw = s.startTime || s.time || ''; const m = raw.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i); if (m) tc[m[1]] = (tc[m[1]] || 0) + 1; });
          const topTiming = Object.entries(tc).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

          const cancellationRate = visits + lateCancels > 0 ? (lateCancels / (visits + lateCancels)) * 100 : 0;
          const revPerSession = rows.length ? revenue / rows.length : 0;
          const avgCapacity = rows.length ? capacity / rows.length : 0;
          const mean = classAvg;
          const variance = rows.length > 0 ? rows.reduce((sv, r) => { const d = (Number(r.checkedInCount) || 0) - mean; return sv + d * d; }, 0) / rows.length : 0;
          const consistency = mean > 0 ? Math.max(0, Math.round(100 - (Math.sqrt(variance) / mean) * 100)) : 0;

          return { fmt, sessionsCount: rows.length, visits, capacity, revenue, lateCancels, classAvg, fillRate, emptyClasses, nonEmptyClasses: rows.length - emptyClasses, topTrainer, topClass, topTiming, cancellationRate, revPerSession, avgCapacity, consistency };
        }).filter(Boolean) as { fmt: string; sessionsCount: number; visits: number; capacity: number; revenue: number; lateCancels: number; classAvg: number; fillRate: number; emptyClasses: number; nonEmptyClasses: number; topTrainer: string; topClass: string; topTiming: string; cancellationRate: number; revPerSession: number; avgCapacity: number; consistency: number }[];

        // Sort cards by selected metric (lower is better for emptyClasses/cancellationRate/lateCancels)
        const lowIsBetter = ['emptyClasses', 'cancellationRate', 'lateCancels'].includes(sortBy);
        const sortedCards = [...cards].sort((a, b) => {
          const av = (a as any)[sortBy] as number ?? 0;
          const bv = (b as any)[sortBy] as number ?? 0;
          return lowIsBetter ? av - bv : bv - av;
        });

        const fmtCur = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' });
        const RANK_LABELS = ['#1', '#2', '#3'];
        const RANK_BG: Record<number, string> = { 0: 'bg-yellow-400/90 text-yellow-900', 1: 'bg-slate-300/80 text-slate-700', 2: 'bg-amber-700/80 text-amber-100' };

        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedCards.map((card, rankIdx) => (
              <div key={card.fmt} className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-lg', FMT_GRAD[card.fmt])}>
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                {/* Rank badge */}
                <div className={cn('absolute top-3 right-3 z-20 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide shadow', RANK_BG[rankIdx] ?? 'bg-white/20 text-white/70')}>
                  {RANK_LABELS[rankIdx] ?? `#${rankIdx + 1}`}
                </div>
                <div className="relative z-10 flex flex-col p-5 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-0.5">Class Format</p>
                    <h3 className="text-2xl font-extrabold leading-tight tracking-tight">{card.fmt}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Total Sessions', value: card.sessionsCount.toLocaleString() },
                      { label: 'Revenue', value: fmtCur.format(card.revenue) },
                      { label: 'Fill Rate', value: `${card.fillRate.toFixed(1)}%` },
                      { label: 'Class Avg', value: card.classAvg.toFixed(1) },
                      { label: 'Rev / Session', value: fmtCur.format(card.revPerSession) },
                      { label: 'Avg Capacity', value: card.avgCapacity.toFixed(0) },
                    ].map(({ label, value }) => (
                      <div key={label} className={cn('rounded-xl px-3 py-2.5', FMT_ACCENT[card.fmt])}>
                        <p className="text-[10px] font-medium uppercase tracking-wider opacity-75 leading-none mb-1">{label}</p>
                        <p className="text-lg font-extrabold leading-none tabular-nums">{value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Fill rate bar */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] text-white/60 font-semibold">Fill Rate</span>
                      <span className="text-[10px] font-bold text-white/80">{card.fillRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                      <div className={cn('h-1.5 rounded-full', FMT_BAR[card.fmt])} style={{ width: `${Math.min(card.fillRate, 100)}%` }} />
                    </div>
                  </div>
                  {/* Consistency bar */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] text-white/60 font-semibold">Consistency Score</span>
                      <span className="text-[10px] font-bold text-white/80">{card.consistency}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                      <div className="h-1.5 rounded-full bg-white/60" style={{ width: `${Math.min(card.consistency, 100)}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Non-Empty Classes', value: card.nonEmptyClasses },
                      { label: 'Empty Classes', value: card.emptyClasses },
                      { label: 'Late Cancels', value: card.lateCancels },
                      { label: 'Cancel Rate', value: `${card.cancellationRate.toFixed(1)}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-[11px] text-white/70 font-medium">{label}</span>
                        <span className="text-xs font-bold tabular-nums">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/20" />
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/50 mb-2">Top Performers</p>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Trainer', value: card.topTrainer },
                        { label: 'Class', value: card.topClass },
                        { label: 'Timing', value: card.topTiming },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-2">
                          <span className="text-[10px] text-white/60 font-semibold shrink-0">{label}</span>
                          <span className="text-[11px] font-bold text-right leading-tight truncate max-w-[60%]" title={value}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Trainer comparison tab */}
      {activeTab === 'trainer' && (
        <div className="space-y-4">
          {/* Controls row: format selector + sort */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {formatMetrics.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setSelectedFormat(f.name)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                    selectedFormat === f.name ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  )}
                >{f.name}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400"
              >
                <option value="classAvg">Class Avg</option>
                <option value="fillRate">Fill Rate</option>
                <option value="revenue">Revenue</option>
                <option value="sessions">Sessions</option>
              </select>
            </div>
          </div>

          {selected ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-5 py-3 text-white">
                <h4 className="text-sm font-bold">Trainer breakdown · {selected.name}</h4>
                <p className="text-[11px] text-white/70">{selected.sessions} sessions · {selected.trainers.length} trainers · sorted by {sortBy === 'classAvg' ? 'class avg' : sortBy}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="border-b border-slate-200 px-4 py-3 text-left">Trainer</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Sessions</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Visits</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Class Avg</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-left min-w-[120px]">Fill Rate</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Revenue</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Late Cancels</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {selected.trainers.map((trainer) => {
                      const trSessions = sessions.filter((s) => (s.cleanedClass || s.classType) === selected.name && s.trainerName === trainer);
                      const trVisits = trSessions.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
                      const trCap = trSessions.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
                      const trRev = trSessions.reduce((sum, s) => sum + (Number(s.revenue) || Number(s.totalPaid) || 0), 0);
                      const trLC = trSessions.reduce((sum, s) => sum + (Number(s.lateCancelledCount) || 0), 0);
                      const trAvg = trSessions.length > 0 ? trVisits / trSessions.length : 0;
                      const trFill = trCap > 0 ? (trVisits / trCap) * 100 : 0;
                      return { trainer, trSessions, trVisits, trRev, trLC, trAvg, trFill };
                    }).sort((a, b) => {
                      if (sortBy === 'classAvg') return b.trAvg - a.trAvg;
                      if (sortBy === 'fillRate') return b.trFill - a.trFill;
                      if (sortBy === 'revenue') return b.trRev - a.trRev;
                      return b.trSessions.length - a.trSessions.length;
                    }).map(({ trainer, trSessions, trVisits, trRev, trLC, trAvg, trFill }) => (
                        <tr key={trainer} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-2.5">
                            <TrainerNameCell name={trainer} />
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-700 text-right text-xs">{trSessions.length}</td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-700 text-right text-xs">{trVisits}</td>
                          <td className="px-3 py-2.5 tabular-nums font-bold text-blue-700 text-right text-xs">{trAvg.toFixed(1)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-14 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${Math.min(trFill, 100)}%` }} />
                              </div>
                              <span className="text-xs text-slate-700 font-semibold">{trFill.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-green-700 font-semibold text-right text-xs">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(trRev)}</td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-500 text-right text-xs">{trLC}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">Select a format above to see trainer breakdown</div>
          )}
        </div>
      )}
    </div>
  );
}

const StudioPulse = memo(() => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const didInitFromUrl = useRef(false);
  const { setLoading } = useGlobalLoading();
  const defaultDateRange = useMemo(() => getDashboardDefaultDateRange(), []);
  const [studio, setStudio] = useState<StudioId>('all');
  const activeStudio = STUDIOS.find((s) => s.id === studio) || STUDIOS[0];
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(defaultDateRange);
  const previousDateRange = useMemo(() => shiftRangeBackOneMonth(dateRange), [dateRange]);
  const previousYearDateRange = useMemo(() => shiftRangeBackOneYear(dateRange), [dateRange]);

  const { data: sales = [], loading: salesLoading, refetch: refetchSales } = useGoogleSheets();
  const { data: sessions = [], loading: sessionsLoading } = useSessionsData();
  const { data: clients = [], loading: clientsLoading } = useNewClientData();
  const { data: payroll = [], isLoading: payrollLoading } = usePayrollData();
  const { data: leads = [], loading: leadsLoading } = useLeadsData();
  const { data: lateCancels = [], loading: lcLoading } = useLateCancellationsData();
  const { data: expirations = [], loading: expLoading } = useExpirationsData();
  const { data: recurringData = [], teacherData: teacherRecurring = [], loading: recurringLoading } = useRecurringSessionsData();
  const { data: checkins = [], loading: checkinsLoading } = useCheckinsData();

  const anyLoading = salesLoading || sessionsLoading || clientsLoading || payrollLoading || leadsLoading || lcLoading || expLoading || recurringLoading || checkinsLoading;
  const metricsRegistry = useMetricsTablesRegistry();

  useEffect(() => {
    setLoading(salesLoading, 'Reading the studio pulse...');
  }, [salesLoading, setLoading]);

  const filteredSales = useMemo(
    () => sales.filter((item) => inStudio(item.calculatedLocation, studio) && isWithinRange(item.paymentDate, dateRange)),
    [sales, studio, dateRange]
  );
  const previousSales = useMemo(
    () => sales.filter((item) => inStudio(item.calculatedLocation, studio) && isWithinRange(item.paymentDate, previousDateRange)),
    [sales, studio, previousDateRange]
  );
  const previousYearSales = useMemo(
    () => sales.filter((item) => inStudio(item.calculatedLocation, studio) && isWithinRange(item.paymentDate, previousYearDateRange)),
    [sales, studio, previousYearDateRange]
  );
  const studioWideSales = useMemo(
    () => sales.filter((item) => inStudio(item.calculatedLocation, studio)),
    [sales, studio]
  );

  const filteredSessions = useMemo(
    () => sessions.filter((item) => inStudio(item.location, studio) && isWithinRange(item.date, dateRange)),
    [sessions, studio, dateRange]
  );
  const previousSessions = useMemo(
    () => sessions.filter((item) => inStudio(item.location, studio) && isWithinRange(item.date, previousDateRange)),
    [sessions, studio, previousDateRange]
  );
  const previousYearSessions = useMemo(
    () => sessions.filter((item) => inStudio(item.location, studio) && isWithinRange(item.date, previousYearDateRange)),
    [sessions, studio, previousYearDateRange]
  );

  const filteredClients = useMemo(
    () => clients.filter((item) => inStudio(item.firstVisitLocation || item.homeLocation, studio) && isWithinRange(item.firstVisitDate, dateRange)),
    [clients, studio, dateRange]
  );
  const previousClients = useMemo(
    () => clients.filter((item) => inStudio(item.firstVisitLocation || item.homeLocation, studio) && isWithinRange(item.firstVisitDate, previousDateRange)),
    [clients, studio, previousDateRange]
  );
  const previousYearClients = useMemo(
    () => clients.filter((item) => inStudio(item.firstVisitLocation || item.homeLocation, studio) && isWithinRange(item.firstVisitDate, previousYearDateRange)),
    [clients, studio, previousYearDateRange]
  );

  const filteredPayroll = useMemo(
    () => payroll.filter((item) => inStudio(item.location, studio) && isMonthKeyWithinRange(item.monthYear, dateRange)),
    [payroll, studio, dateRange]
  );
  const previousPayroll = useMemo(
    () => payroll.filter((item) => inStudio(item.location, studio) && isMonthKeyWithinRange(item.monthYear, previousDateRange)),
    [payroll, studio, previousDateRange]
  );

  const filteredLeads = useMemo(
    () => leads.filter((item) => inStudio(item.center, studio) && isWithinRange(item.createdAt, dateRange)),
    [leads, studio, dateRange]
  );
  const previousLeads = useMemo(
    () => leads.filter((item) => inStudio(item.center, studio) && isWithinRange(item.createdAt, previousDateRange)),
    [leads, studio, previousDateRange]
  );
  const previousYearLeads = useMemo(
    () => leads.filter((item) => inStudio(item.center, studio) && isWithinRange(item.createdAt, previousYearDateRange)),
    [leads, studio, previousYearDateRange]
  );

  const filteredLateCancels = useMemo(
    () => lateCancels.filter((item) => inStudio(item.location, studio) && isWithinRange(item.dateIST || item.sessionDateIST, dateRange)),
    [lateCancels, studio, dateRange]
  );
  const studioWideLateCancels = useMemo(
    () => lateCancels.filter((item) => inStudio(item.location, studio)),
    [lateCancels, studio]
  );
  const previousLateCancels = useMemo(
    () => lateCancels.filter((item) => inStudio(item.location, studio) && isWithinRange(item.dateIST || item.sessionDateIST, previousDateRange)),
    [lateCancels, studio, previousDateRange]
  );
  const previousYearLateCancels = useMemo(
    () => lateCancels.filter((item) => inStudio(item.location, studio) && isWithinRange(item.dateIST || item.sessionDateIST, previousYearDateRange)),
    [lateCancels, studio, previousYearDateRange]
  );

  /* ---------- Expirations (lapsed) ---------- */
  // Exclude low-value / noise memberships from all lapsed/churn views
  const isValidExpiration = (item: (typeof expirations)[0]): boolean => {
    const name = (item.membershipName || '').toLowerCase();
    const paid = (item as any).amountPaid ?? Number((item as any).paid) ?? 0;
    if (paid <= 900) return false;
    if (/private/i.test(name)) return false;
    if (/newcomers.{0,5}2.{0,5}for.{0,5}1/i.test(name)) return false;
    if (/single\s*class/i.test(name)) return false;
    return true;
  };

  const filteredExpirations = useMemo(
    () => expirations.filter((item) => isValidExpiration(item) && inStudio(item.primaryLocation || item.homeLocation, studio) && isWithinRange(item.endDate, dateRange)),
    [expirations, studio, dateRange]
  );
  const previousExpirations = useMemo(
    () => expirations.filter((item) => isValidExpiration(item) && inStudio(item.primaryLocation || item.homeLocation, studio) && isWithinRange(item.endDate, previousDateRange)),
    [expirations, studio, previousDateRange]
  );
  const previousYearExpirations = useMemo(
    () => expirations.filter((item) => isValidExpiration(item) && inStudio(item.primaryLocation || item.homeLocation, studio) && isWithinRange(item.endDate, previousYearDateRange)),
    [expirations, studio, previousYearDateRange]
  );
  const expirationStats = useMemo(() => {
    const total = filteredExpirations.length;
    const prev = previousExpirations.length;
    const yoy = previousYearExpirations.length;

    // Categorise each expiring membership: frozen > renewed > lapsed, else active
    const categorizeMembership = (e: (typeof filteredExpirations)[0]) => {
      const s = (e.status || '').toLowerCase();
      if (e.frozen || /frozen|freeze/i.test(s)) return 'frozen';
      if (/renew/i.test(s)) return 'renewed';
      if (/lapsed|inactive|expired|churn|lost/i.test(s)) return 'lapsed';
      return 'active'; // still in window but not yet lapsed
    };

    const frozen = filteredExpirations.filter((e) => categorizeMembership(e) === 'frozen').length;
    const renewed = filteredExpirations.filter((e) => categorizeMembership(e) === 'renewed').length;
    // lapsed = all that are not frozen/renewed/active; if status unknown treat as lapsed
    const lapsedArr = filteredExpirations.filter((e) => {
      const cat = categorizeMembership(e);
      const s = (e.status || '').toLowerCase();
      // If no status info at all, treat as lapsed (membership has ended)
      return cat === 'lapsed' || (cat === 'active' && !s);
    });
    const lapsed = lapsedArr.length;
    const active = total - lapsed - renewed - frozen;
    // churned = subset of lapsed specifically marked as churned
    const churned = filteredExpirations.filter((e) => /churn/i.test(e.status || '')).length || lapsed;

    // lapsed% = lapsed/expiring * 100
    const lapsedPct = total ? (lapsed / total) * 100 : 0;
    const churnRate = total ? (churned / total) * 100 : 0;

    // prev / yoy equivalents (simplified)
    const prevChurned = previousExpirations.length;
    const yoyChurned = previousYearExpirations.length;
    const prevChurnRate = prev ? (prevChurned / prev) * 100 : 0;
    const yoyChurnRate = yoy ? (yoyChurned / yoy) * 100 : 0;
    const byLocation: Record<string, number> = {};
    filteredExpirations.forEach((e) => {
      const loc = e.homeLocation || 'Unknown';
      byLocation[loc] = (byLocation[loc] || 0) + 1;
    });
    const topLocations = Object.entries(byLocation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    const ltvVals = filteredExpirations.map((e) => (e as any).amountPaid || Number(e.paid) || 0).filter((v) => v > 0);
    const avgLtvLapsed = ltvVals.length ? ltvVals.reduce((a, b) => a + b, 0) / ltvVals.length : 0;
    const prevLtvVals = previousExpirations.map((e) => (e as any).amountPaid || Number(e.paid) || 0).filter((v) => v > 0);
    const prevAvgLtvLapsed = prevLtvVals.length ? prevLtvVals.reduce((a, b) => a + b, 0) / prevLtvVals.length : 0;
    const yoyLtvVals = previousYearExpirations.map((e) => (e as any).amountPaid || Number(e.paid) || 0).filter((v) => v > 0);
    const yoyAvgLtvLapsed = yoyLtvVals.length ? yoyLtvVals.reduce((a, b) => a + b, 0) / yoyLtvVals.length : 0;
    return {
      total,
      lapsed,
      renewed,
      frozen,
      active,
      churned,
      lapsedPct,
      churnRate,
      avgLtvLapsed,
      topLocations,
      momGrowth: pctChange(total, prev),
      yoyGrowth: pctChange(total, yoy),
      churnRateMomGrowth: pctChange(churnRate, prevChurnRate),
      churnRateYoyGrowth: pctChange(churnRate, yoyChurnRate),
      avgLtvMomGrowth: pctChange(avgLtvLapsed, prevAvgLtvLapsed),
      avgLtvYoyGrowth: pctChange(avgLtvLapsed, yoyAvgLtvLapsed),
    };
  }, [filteredExpirations, previousExpirations, previousYearExpirations]);

  /* ---------- Sales ---------- */
  const salesStats = useMemo(() => {
    const rows = filteredSales;
    let gross = 0;
    let net = 0;
    let discount = 0;
    let discountedTxns = 0;
    const members = new Set<string>();
    const monthly: Record<string, number> = {};
    const products: Record<string, number> = {};
    const discountByProduct: Record<string, { amount: number; count: number }> = {};

    rows.forEach((d) => {
      const pay = Number(d.paymentValue) || 0;
      const vat = Number(d.paymentVAT) || 0;
      gross += pay;
      net += pay - vat;
      const disc = Number(d.discountAmount) || 0;
      if (disc > 0) {
        discount += disc;
        discountedTxns += 1;
        const p = d.cleanedProduct || 'Other';
        discountByProduct[p] = discountByProduct[p] || { amount: 0, count: 0 };
        discountByProduct[p].amount += disc;
        discountByProduct[p].count += 1;
      }
      if (d.memberId) members.add(d.memberId);
      const mk = monthKeyFromDate(d.paymentDate);
      if (mk) monthly[mk] = (monthly[mk] || 0) + (pay - vat);
      const prod = d.cleanedProduct || 'Other';
      products[prod] = (products[prod] || 0) + (pay - vat);
    });

    const txns = rows.length;
    const monthsSorted = Object.keys(monthly).sort();
    const trend = monthsSorted.slice(-12).map((k) => ({ key: k, label: monthLabel(k), revenue: Math.round(monthly[k]) }));

    const last = monthsSorted[monthsSorted.length - 1];
    const prev = monthsSorted[monthsSorted.length - 2];
    const revDelta = last && prev ? pctChange(monthly[last], monthly[prev]) : null;
    const prevRows = previousSales;
    const prevGross = prevRows.reduce((sum, d) => sum + (Number(d.paymentValue) || 0), 0);
    const prevNet = prevRows.reduce((sum, d) => sum + (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0), 0);
    const prevDiscountedTxns = prevRows.filter((d) => (Number(d.discountAmount) || 0) > 0).length;
    const prevDiscount = prevRows.reduce((sum, d) => sum + (Number(d.discountAmount) || 0), 0);
    const prevTxns = prevRows.length;
    const prevMembers = new Set(prevRows.map((d) => d.memberId).filter(Boolean)).size;
    const yoyRows = previousYearSales;
    const yoyGross = yoyRows.reduce((sum, d) => sum + (Number(d.paymentValue) || 0), 0);
    const yoyNet = yoyRows.reduce((sum, d) => sum + (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0), 0);
    const yoyDiscountedTxns = yoyRows.filter((d) => (Number(d.discountAmount) || 0) > 0).length;
    const yoyDiscount = yoyRows.reduce((sum, d) => sum + (Number(d.discountAmount) || 0), 0);
    const yoyTxns = yoyRows.length;
    const yoyMembers = new Set(yoyRows.map((d) => d.memberId).filter(Boolean)).size;

    const topProducts = Object.entries(products)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const topDiscounts = Object.entries(discountByProduct)
      .map(([name, v]) => ({ name, amount: v.amount, count: v.count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      gross,
      net,
      txns,
      atv: txns ? net / txns : 0,
      members: members.size,
      discount,
      discountPenetration: txns ? (discountedTxns / txns) * 100 : 0,
      growth: {
        net: pctChange(net, prevNet),
        gross: pctChange(gross, prevGross),
        txns: pctChange(txns, prevTxns),
        members: pctChange(members.size, prevMembers),
        discount: pctChange(discount, prevDiscount),
        discountPenetration: pctChange(discountedTxns, prevDiscountedTxns),
      },
      yoyGrowth: {
        net: pctChange(net, yoyNet),
        gross: pctChange(gross, yoyGross),
        txns: pctChange(txns, yoyTxns),
        members: pctChange(members.size, yoyMembers),
        discount: pctChange(discount, yoyDiscount),
        discountPenetration: pctChange(discountedTxns, yoyDiscountedTxns),
      },
      trend,
      revDelta,
      topProducts,
      topDiscounts,
    };
  }, [filteredSales, previousSales, previousYearSales]);

  // ── Avg Order Value ──────────────────────────────────────────────────────
  const avgOrderValue = useMemo(() => {
    const cur = filteredSales.length > 0 ? filteredSales.reduce((s, x) => s + (Number(x.paymentValue) || 0), 0) / filteredSales.length : 0;
    const prev = previousSales.length > 0 ? previousSales.reduce((s, x) => s + (Number(x.paymentValue) || 0), 0) / previousSales.length : 0;
    const yoy = previousYearSales.length > 0 ? previousYearSales.reduce((s, x) => s + (Number(x.paymentValue) || 0), 0) / previousYearSales.length : 0;
    return { value: cur, momGrowth: pctChange(cur, prev), yoyGrowth: pctChange(cur, yoy) };
  }, [filteredSales, previousSales, previousYearSales]);

  // ── Discount Efficiency: incremental net per ₹1 discounted ───────────────
  const discountEfficiency = useMemo(() => {
    let totalDiscount = 0, totalNet = 0, discountedNet = 0, discountedTxns = 0;
    filteredSales.forEach((s) => {
      const net = (Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0);
      totalNet += net;
      let disc = Number(s.discountAmount) || 0;
      // Fallback: derive discount from percentage when amount column is missing
      if (disc <= 0) {
        const pct = Number(s.discountPercentage) || 0;
        const mrp = (Number(s.mrpPostTax) || Number(s.mrpPreTax) || 0);
        if (pct > 0 && mrp > 0) disc = mrp * (pct / 100);
        else if (pct > 0 && net > 0) disc = net * (pct / (100 - pct)); // back-compute from net
      }
      if (disc > 0) { totalDiscount += disc; discountedNet += net; discountedTxns += 1; }
    });
    // Incremental revenue per ₹1 discount = discountedNet / totalDiscount
    const efficiency = totalDiscount > 0 ? discountedNet / totalDiscount : 0;
    const prevDiscount = previousSales.reduce((s, x) => s + (Number(x.discountAmount) || 0), 0);
    const prevDiscountedNet = previousSales.filter((x) => (Number(x.discountAmount) || 0) > 0).reduce((s, x) => s + ((Number(x.paymentValue) || 0) - (Number(x.paymentVAT) || 0)), 0);
    const prevEfficiency = prevDiscount > 0 ? prevDiscountedNet / prevDiscount : 0;
    const yoyDiscount = previousYearSales.reduce((s, x) => s + (Number(x.discountAmount) || 0), 0);
    const yoyDiscountedNet = previousYearSales.filter((x) => (Number(x.discountAmount) || 0) > 0).reduce((s, x) => s + ((Number(x.paymentValue) || 0) - (Number(x.paymentVAT) || 0)), 0);
    const yoyEfficiency = yoyDiscount > 0 ? yoyDiscountedNet / yoyDiscount : 0;
    return {
      efficiency,
      totalDiscount,
      discountedTxns,
      momGrowth: pctChange(efficiency, prevEfficiency),
      yoyGrowth: pctChange(efficiency, yoyEfficiency),
    };
  }, [filteredSales, previousSales, previousYearSales]);

  // ── Package Sell-through %: sessions used / sessions purchased ────────────
  const packageSellThrough = useMemo(() => {
    // Infer class count from product name when Sec. Membership Total Classes is blank
    // e.g. "Studio 8 Class Package" → 8, "4-Class Pack" → 4, "Studio Single Class" → 1
    const inferTotalClasses = (s: (typeof filteredSales)[0]): number => {
      const direct = Number(s.secMembershipTotalClasses) || 0;
      if (direct > 0) return direct;
      const text = (s.cleanedProduct || s.paymentItem || '').toLowerCase();
      const numMatch = text.match(/^(\d+)\s*[-\s]?(?:class|session|visit)/i) ||
                       text.match(/(?:^|\s)(\d+)\s*(?:class|session|visit)/i);
      if (numMatch) return parseInt(numMatch[1], 10);
      // Single class fallback
      if (/single|drop.?in|trial|1\s*class/i.test(text)) return 1;
      return 0;
    };

    const packageRows = filteredSales.filter((s) => /pack|package|class\s*pack|session\s*pack/i.test(s.cleanedProduct || s.cleanedCategory || ''));
    let totalClasses = 0, usedClasses = 0;
    packageRows.forEach((s) => {
      const total = inferTotalClasses(s);
      const left = Number(s.secMembershipClassesLeft) || 0;
      const used = Number(s.secMembershipUsedSessions) || (total > 0 && left > 0 ? total - left : 0);
      if (total > 0) { totalClasses += total; usedClasses += used; }
    });
    const rate = totalClasses > 0 ? (usedClasses / totalClasses) * 100 : 0;
    const inferClassesFromRow = (s: (typeof previousSales)[0]): number => {
      const direct = Number(s.secMembershipTotalClasses) || 0;
      if (direct > 0) return direct;
      const text = (s.cleanedProduct || s.paymentItem || '').toLowerCase();
      const m = text.match(/^(\d+)\s*[-\s]?(?:class|session|visit)/i) || text.match(/(?:^|\s)(\d+)\s*(?:class|session|visit)/i);
      if (m) return parseInt(m[1], 10);
      if (/single|drop.?in|trial|1\s*class/i.test(text)) return 1;
      return 0;
    };
    const PACK_RE = /pack|package|class\s*pack|session\s*pack/i;
    const prevPackageRows = previousSales.filter((s) => PACK_RE.test(s.cleanedProduct || s.cleanedCategory || ''));
    let prevTotal = 0, prevUsed = 0;
    prevPackageRows.forEach((s) => {
      const t = inferClassesFromRow(s);
      const l = Number(s.secMembershipClassesLeft) || 0;
      const u = Number(s.secMembershipUsedSessions) || (t > 0 && l > 0 ? t - l : 0);
      if (t > 0) { prevTotal += t; prevUsed += u; }
    });
    const prevRate = prevTotal > 0 ? (prevUsed / prevTotal) * 100 : 0;
    const yoyPackageRows = previousYearSales.filter((s) => PACK_RE.test(s.cleanedProduct || s.cleanedCategory || ''));
    let yoyTotal = 0, yoyUsed = 0;
    yoyPackageRows.forEach((s) => {
      const t = inferClassesFromRow(s);
      const l = Number(s.secMembershipClassesLeft) || 0;
      const u = Number(s.secMembershipUsedSessions) || (t > 0 && l > 0 ? t - l : 0);
      if (t > 0) { yoyTotal += t; yoyUsed += u; }
    });
    const yoyRate = yoyTotal > 0 ? (yoyUsed / yoyTotal) * 100 : 0;
    return {
      rate,
      usedClasses,
      totalClasses,
      packages: packageRows.length,
      momGrowth: pctChange(rate, prevRate),
      yoyGrowth: pctChange(rate, yoyRate),
    };
  }, [filteredSales, previousSales, previousYearSales]);

  // ── Repeat Purchase Rate: members with >1 purchase / total members ────────
  const repeatPurchaseRate = useMemo(() => {
    const memberTxns: Record<string, number> = {};
    filteredSales.forEach((s) => { if (s.memberId) memberTxns[s.memberId] = (memberTxns[s.memberId] || 0) + 1; });
    const total = Object.keys(memberTxns).length;
    const repeaters = Object.values(memberTxns).filter((n) => n > 1).length;
    const rate = total > 0 ? (repeaters / total) * 100 : 0;
    const prevMap: Record<string, number> = {};
    previousSales.forEach((s) => { if (s.memberId) prevMap[s.memberId] = (prevMap[s.memberId] || 0) + 1; });
    const prevTotal = Object.keys(prevMap).length;
    const prevRepeaters = Object.values(prevMap).filter((n) => n > 1).length;
    const prevRate = prevTotal > 0 ? (prevRepeaters / prevTotal) * 100 : 0;
    const yoyMap: Record<string, number> = {};
    previousYearSales.forEach((s) => { if (s.memberId) yoyMap[s.memberId] = (yoyMap[s.memberId] || 0) + 1; });
    const yoyTotal = Object.keys(yoyMap).length;
    const yoyRepeaters = Object.values(yoyMap).filter((n) => n > 1).length;
    const yoyRate = yoyTotal > 0 ? (yoyRepeaters / yoyTotal) * 100 : 0;
    return { rate, repeaters, total, momGrowth: pctChange(rate, prevRate), yoyGrowth: pctChange(rate, yoyRate) };
  }, [filteredSales, previousSales, previousYearSales]);

  // ── Discount Code Performance table ──────────────────────────────────────
  const discountCodePerf = useMemo(() => {
    const map: Record<string, { revenue: number; txns: number; members: Set<string>; totalOrder: number }> = {};
    filteredSales.forEach((s) => {
      const code = (s.discountCode || '').trim();
      if (!code) return;
      if (!map[code]) map[code] = { revenue: 0, txns: 0, members: new Set(), totalOrder: 0 };
      const net = (Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0);
      map[code].revenue += net;
      map[code].txns += 1;
      map[code].totalOrder += Number(s.paymentValue) || 0;
      if (s.memberId) map[code].members.add(s.memberId);
    });
    return Object.entries(map).map(([code, d]) => ({
      code,
      revenue: d.revenue,
      txns: d.txns,
      members: d.members.size,
      avgOrderValue: d.txns > 0 ? d.totalOrder / d.txns : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  const salesMetricsMatrix = useMemo(() => {
    const monthlyMap = new Map<string, typeof filteredSales>();

    studioWideSales.forEach((item) => {
      const key = monthKeyFromDate(item.paymentDate);
      if (!key) return;
      const existing = monthlyMap.get(key) || [];
      existing.push(item);
      monthlyMap.set(key, existing);
    });

    // Cap at current month — future-dated entries (bad data or mis-parsed dates) should not appear
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const months = Array.from(monthlyMap.keys()).filter(k => k <= currentMonthKey).sort().reverse();
    const monthLabels: Record<string, string> = Object.fromEntries(months.map((month) => [month, monthLabel(month)]));

    const metricRows: SalesMetricsMatrixRow[] = [
      { label: 'Gross Sales', type: 'currency', values: {} },
      { label: 'Net Sales', type: 'currency', values: {} },
      { label: 'Transactions', type: 'number', values: {} },
      { label: 'Unique Members', type: 'number', values: {} },
      { label: 'Average Transaction Value', type: 'currency', values: {} },
      { label: 'Discount Value', type: 'currency', values: {} },
      { label: 'Discounted Transactions', type: 'number', values: {} },
      { label: 'Discount Penetration', type: 'percent', values: {} },
      { label: 'VAT Collected', type: 'currency', values: {} },
      { label: 'Money Credit Sales', type: 'currency', values: {} },
      { label: 'Package Sales', type: 'currency', values: {} },
      { label: 'Retail Sales', type: 'currency', values: {} },
      { label: 'Membership Sales', type: 'currency', values: {} },
      { label: 'Drop-in Sales', type: 'currency', values: {} },
      { label: 'Online / System Sales', type: 'currency', values: {} },
      { label: 'Top Seller Share', type: 'percent', values: {} },
      { label: 'Distinct Products Sold', type: 'number', values: {} },
      { label: 'Distinct Categories Sold', type: 'number', values: {} },
      { label: 'Average Revenue per Member', type: 'currency', values: {} },
      { label: 'Promo-led Sales', type: 'currency', values: {} },
    ];

    months.forEach((month) => {
      const rows = monthlyMap.get(month) || [];
      const gross = rows.reduce((sum, item) => sum + (Number(item.paymentValue) || 0), 0);
      const vat = rows.reduce((sum, item) => sum + (Number(item.paymentVAT) || 0), 0);
      const net = gross - vat;
      const txns = rows.length;
      const uniqueMembers = new Set(rows.map((item) => item.memberId || item.customerEmail).filter(Boolean)).size;
      const discountValue = rows.reduce((sum, item) => sum + (Number(item.discountAmount) || 0), 0);
      const discountedTxns = rows.filter((item) => (Number(item.discountAmount) || 0) > 0 || (Number(item.discountPercentage) || 0) > 0).length;
      const moneyCredits = rows.reduce((sum, item) => sum + (Number(item.paidInMoneyCredits) || 0), 0);

      // Mutually exclusive category buckets — priority order ensures each transaction counted once.
      // All 5 sum to gross so: membershipSales + packageSales + moneyCreditSales + dropInSales + retailSales = gross.
      let membershipSales = 0, packageSales = 0, moneyCreditSales = 0, dropInSales = 0, retailSales = 0;
      rows.forEach((item) => {
        const pv = Number(item.paymentValue) || 0;
        const cat = (item.cleanedCategory || '').toLowerCase();
        const prod = (item.cleanedProduct || '').toLowerCase();
        const payItem = (item.paymentItem || '').toLowerCase();
        const memType = (item.membershipType || '').toLowerCase();
        const fullText = `${cat} ${prod} ${payItem} ${memType}`;

        if (cat.includes('money') || payItem === 'money-credit' || memType === 'package-money') {
          moneyCreditSales += pv;
        } else if (cat.includes('retail') || cat.includes('merchandise') || cat.includes('product')) {
          retailSales += pv;
        } else if (cat.includes('package') || memType.includes('pack') || cat.includes('class pack') || cat.includes('session pack')) {
          packageSales += pv;
        } else if (fullText.includes('single') || fullText.includes('drop') || fullText.includes('trial') || fullText.includes('walk-in') || fullText.includes('walkin') || cat.includes('session')) {
          dropInSales += pv;
        } else if (memType.includes('subscription') || memType.includes('member') || cat.includes('member') || cat.includes('subscript')) {
          membershipSales += pv;
        } else {
          // catch-all: assign to membership so total is always preserved
          membershipSales += pv;
        }
      });
      const onlineSales = rows.filter((item) => !item.soldBy || item.soldBy === '-' || item.soldBy.toLowerCase().includes('online') || item.soldBy.toLowerCase().includes('system')).reduce((sum, item) => sum + ((Number(item.paymentValue) || 0) - (Number(item.paymentVAT) || 0)), 0);
      const sellerRevenue = rows.reduce<Record<string, number>>((acc, item) => {
        const seller = item.soldBy === '-' ? 'Online/System' : (item.soldBy || 'Unknown');
        acc[seller] = (acc[seller] || 0) + ((Number(item.paymentValue) || 0) - (Number(item.paymentVAT) || 0));
        return acc;
      }, {});
      const topSellerShare = net > 0 ? (Math.max(0, ...Object.values(sellerRevenue)) / net) * 100 : 0;
      const promoSales = rows.filter((item) => item.isPromotional || (Number(item.discountAmount) || 0) > 0).reduce((sum, item) => sum + ((Number(item.paymentValue) || 0) - (Number(item.paymentVAT) || 0)), 0);

      metricRows[0].values[month] = gross;
      metricRows[1].values[month] = net;
      metricRows[2].values[month] = txns;
      metricRows[3].values[month] = uniqueMembers;
      metricRows[4].values[month] = txns ? net / txns : 0;
      metricRows[5].values[month] = discountValue;
      metricRows[6].values[month] = discountedTxns;
      metricRows[7].values[month] = txns ? (discountedTxns / txns) * 100 : 0;
      metricRows[8].values[month] = vat;
      metricRows[9].values[month] = moneyCreditSales;
      metricRows[10].values[month] = packageSales;
      metricRows[11].values[month] = retailSales;
      metricRows[12].values[month] = membershipSales;
      metricRows[13].values[month] = dropInSales;
      metricRows[14].values[month] = onlineSales;
      metricRows[15].values[month] = topSellerShare;
      metricRows[16].values[month] = new Set(rows.map((item) => item.cleanedProduct).filter(Boolean)).size;
      metricRows[17].values[month] = new Set(rows.map((item) => item.cleanedCategory).filter(Boolean)).size;
      metricRows[18].values[month] = uniqueMembers ? net / uniqueMembers : 0;
      metricRows[19].values[month] = promoSales;
    });

    return { months, monthLabels, metricRows };
  }, [studioWideSales]);

  /* ---------- Sessions ---------- */
  const sessionStats = useMemo(() => {
    const rows = filteredSessions;
    let attendance = 0;
    let capacity = 0;
    let empty = 0;
    const monthly: Record<string, { att: number; cap: number }> = {};
    const formats: Record<string, number> = { Barre: 0, PowerCycle: 0, Strength: 0, Other: 0 };

    rows.forEach((s) => {
      const checked = Number(s.checkedInCount) || 0;
      const cap = Number(s.capacity) || 0;
      attendance += checked;
      capacity += cap;
      if (checked === 0) empty += 1;
      const fmt = classifyFormat(s.cleanedClass || s.classType);
      formats[fmt] += checked;
      const mk = monthKeyFromDate(s.date);
      if (mk) {
        monthly[mk] = monthly[mk] || { att: 0, cap: 0 };
        monthly[mk].att += checked;
        monthly[mk].cap += cap;
      }
    });

    const _nowSess = new Date();
    const _curMonthSess = `${_nowSess.getFullYear()}-${String(_nowSess.getMonth() + 1).padStart(2, '0')}`;
    const monthsSorted = Object.keys(monthly).filter(k => k <= _curMonthSess).sort();
    const trend = monthsSorted.slice(-12).map((k) => ({
      key: k,
      label: monthLabel(k),
      attendance: monthly[k].att,
      fill: monthly[k].cap > 0 ? Math.round((monthly[k].att / monthly[k].cap) * 100) : 0,
    }));

    const last = monthsSorted[monthsSorted.length - 1];
    const prev = monthsSorted[monthsSorted.length - 2];
    const attDelta = last && prev ? pctChange(monthly[last].att, monthly[prev].att) : null;
    const prevRows = previousSessions;
    const prevAttendance = prevRows.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
    const prevCapacity = prevRows.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
    const prevEmpty = prevRows.filter((s) => (Number(s.checkedInCount) || 0) === 0).length;
    const yoyRows = previousYearSessions;
    const yoyAttendance = yoyRows.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
    const yoyCapacity = yoyRows.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
    const yoyEmpty = yoyRows.filter((s) => (Number(s.checkedInCount) || 0) === 0).length;

    const formatData = Object.entries(formats)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    return {
      totalSessions: rows.length,
      attendance,
      capacity,
      avgFill: capacity > 0 ? (attendance / capacity) * 100 : 0,
      classAvg: rows.length ? attendance / Math.max(rows.length - empty, 1) : 0,
      emptyShare: rows.length ? (empty / rows.length) * 100 : 0,
      growth: {
        attendance: pctChange(attendance, prevAttendance),
        totalSessions: pctChange(rows.length, prevRows.length),
        avgFill: pctChange(capacity > 0 ? (attendance / capacity) * 100 : 0, prevCapacity > 0 ? (prevAttendance / prevCapacity) * 100 : 0),
        emptyShare: pctChange(rows.length ? (empty / rows.length) * 100 : 0, prevRows.length ? (prevEmpty / prevRows.length) * 100 : 0),
        classAvg: pctChange(rows.length ? attendance / Math.max(rows.length - empty, 1) : 0, prevRows.length ? prevAttendance / Math.max(prevRows.length - prevEmpty, 1) : 0),
      },
      yoyGrowth: {
        attendance: pctChange(attendance, yoyAttendance),
        totalSessions: pctChange(rows.length, yoyRows.length),
        avgFill: pctChange(capacity > 0 ? (attendance / capacity) * 100 : 0, yoyCapacity > 0 ? (yoyAttendance / yoyCapacity) * 100 : 0),
        emptyShare: pctChange(rows.length ? (empty / rows.length) * 100 : 0, yoyRows.length ? (yoyEmpty / yoyRows.length) * 100 : 0),
        classAvg: pctChange(rows.length ? attendance / Math.max(rows.length - empty, 1) : 0, yoyRows.length ? yoyAttendance / Math.max(yoyRows.length - yoyEmpty, 1) : 0),
      },
      trend,
      attDelta,
      formatData,
    };
  }, [filteredSessions, previousSessions, previousYearSessions]);

  /* ---------- Clients (retention / conversion) ---------- */
  const clientStats = useMemo(() => {
    const rows = filteredClients.filter((c) => isInNewClientCohort(c));
    const total = rows.length;
    const converted = rows.filter((c) => c.conversionStatus === 'Converted').length;
    const retained = rows.filter((c) => c.retentionStatus === 'Retained').length;
    const ltvVals = rows.map((c) => Number(c.ltv) || 0).filter((v) => v > 0);
    const avgLtv = ltvVals.length ? ltvVals.reduce((a, b) => a + b, 0) / ltvVals.length : 0;
    const spanVals = rows.map((c) => Number(c.conversionSpan) || 0).filter((v) => v > 0);
    const avgSpan = spanVals.length ? spanVals.reduce((a, b) => a + b, 0) / spanVals.length : 0;
    const prevRows = previousClients.filter((c) => isInNewClientCohort(c));
    const yoyRows = previousYearClients.filter((c) => isInNewClientCohort(c));
    const prevTotal = prevRows.length;
    const prevConverted = prevRows.filter((c) => c.conversionStatus === 'Converted').length;
    const prevRetained = prevRows.filter((c) => c.retentionStatus === 'Retained').length;
    const yoyTotal = yoyRows.length;
    const yoyConverted = yoyRows.filter((c) => c.conversionStatus === 'Converted').length;
    const yoyRetained = yoyRows.filter((c) => c.retentionStatus === 'Retained').length;
    const lapsed = rows.filter((c) => /lapsed|inactive|expired|churn|lost/i.test(`${c.retentionStatus || ''} ${c.conversionStatus || ''}`)).length;
    const prevLapsed = prevRows.filter((c) => /lapsed|inactive|expired|churn|lost/i.test(`${c.retentionStatus || ''} ${c.conversionStatus || ''}`)).length;
    const yoyLapsed = yoyRows.filter((c) => /lapsed|inactive|expired|churn|lost/i.test(`${c.retentionStatus || ''} ${c.conversionStatus || ''}`)).length;
    return {
      newClients: total,
      conversionRate: total ? (converted / total) * 100 : 0,
      retentionRate: total ? (retained / total) * 100 : 0,
      converted,
      retained,
      lapsed,
      avgLtv,
      avgSpan,
      growth: {
        newClients: pctChange(total, prevTotal),
        conversionRate: pctChange(total ? (converted / total) * 100 : 0, prevTotal ? (prevConverted / prevTotal) * 100 : 0),
        retentionRate: pctChange(total ? (retained / total) * 100 : 0, prevTotal ? (prevRetained / prevTotal) * 100 : 0),
        converted: pctChange(converted, prevConverted),
        retained: pctChange(retained, prevRetained),
        lapsed: pctChange(lapsed, prevLapsed),
      },
      yoyGrowth: {
        newClients: pctChange(total, yoyTotal),
        conversionRate: pctChange(total ? (converted / total) * 100 : 0, yoyTotal ? (yoyConverted / yoyTotal) * 100 : 0),
        retentionRate: pctChange(total ? (retained / total) * 100 : 0, yoyTotal ? (yoyRetained / yoyTotal) * 100 : 0),
        converted: pctChange(converted, yoyConverted),
        retained: pctChange(retained, yoyRetained),
        lapsed: pctChange(lapsed, yoyLapsed),
      },
    };
  }, [filteredClients, previousClients, previousYearClients]);

  /* ---------- Trainers (payroll) ---------- */
  const trainerStats = useMemo(() => {
    const rows = filteredPayroll;
    const byTrainer: Record<string, { name: string; customers: number; sessions: number; nonEmpty: number; paid: number }> = {};
    rows.forEach((p) => {
      const name = p.teacherName || 'Unknown';
      byTrainer[name] = byTrainer[name] || { name, customers: 0, sessions: 0, nonEmpty: 0, paid: 0 };
      byTrainer[name].customers += Number(p.totalCustomers) || 0;
      byTrainer[name].sessions += Number(p.totalSessions) || 0;
      byTrainer[name].nonEmpty += Number(p.totalNonEmptySessions) || 0;
      byTrainer[name].paid += Number(p.totalPaid) || 0;
    });
    const all = Object.values(byTrainer)
      .map((t) => ({ ...t, classAvg: t.nonEmpty > 0 ? t.customers / t.nonEmpty : 0 }))
      .sort((a, b) => b.customers - a.customers);
    const prevRows = previousPayroll;
    const prevCustomers = prevRows.reduce((sum, p) => sum + (Number(p.totalCustomers) || 0), 0);
    return { top: all.slice(0, 6), all, growth: { customers: pctChange(rows.reduce((sum, p) => sum + (Number(p.totalCustomers) || 0), 0), prevCustomers) } };
  }, [filteredPayroll, previousPayroll]);

  /* ---------- Leads / Funnel ---------- */
  const leadStats = useMemo(() => {
    const rows = filteredLeads;
    const total = rows.length;
    const converted = rows.filter((l) => isLeadConverted(l)).length;
    const trials = rows.filter((l) => {
      const t = (l.trialStatus || '').toLowerCase();
      return t.includes('completed') || t.includes('trial') || t.includes('attended');
    }).length;
    const bySource: Record<string, { count: number; converted: number }> = {};
    rows.forEach((l) => {
      const src = l.source || 'Unknown';
      bySource[src] = bySource[src] || { count: 0, converted: 0 };
      bySource[src].count += 1;
      if (isLeadConverted(l)) bySource[src].converted += 1;
    });
    const topSources = Object.entries(bySource)
      .map(([name, v]) => ({ name, count: v.count, rate: v.count ? (v.converted / v.count) * 100 : 0 }))
      .sort((a, b) => b.count - a.count);
    const yoyTotal = previousYearLeads.length;
    const yoyConverted = previousYearLeads.filter((l) => isLeadConverted(l)).length;
    const yoyTrials = previousYearLeads.filter((l) => {
      const t = (l.trialStatus || '').toLowerCase();
      return t.includes('completed') || t.includes('trial') || t.includes('attended');
    }).length;
    return {
      total,
      trials,
      converted,
      conversionRate: total ? (converted / total) * 100 : 0,
      funnel: [
        { stage: 'Leads', value: total },
        { stage: 'Trials', value: trials },
        { stage: 'Converted', value: converted },
      ],
      topSources,
      growth: {
        total: pctChange(total, previousLeads.length),
        conversionRate: pctChange(total ? (converted / total) * 100 : 0, previousLeads.length ? (previousLeads.filter((l) => isLeadConverted(l)).length / previousLeads.length) * 100 : 0),
      },
      yoyGrowth: {
        total: pctChange(total, yoyTotal),
        trials: pctChange(trials, yoyTrials),
        converted: pctChange(converted, yoyConverted),
        conversionRate: pctChange(total ? (converted / total) * 100 : 0, yoyTotal ? (yoyConverted / yoyTotal) * 100 : 0),
      },
    };
  }, [filteredLeads, previousLeads, previousYearLeads]);

  /* ---------- Late cancellations ---------- */
  const lcStats = useMemo(() => {
    const rows = filteredLateCancels;
    const sameDay = rows.filter((d) => d.isSameDayCancellation).length;
    const penalty = rows.reduce((sum, d) => sum + (Number(d.chargedPenaltyAmount) || 0), 0);
    const prevRows = previousLateCancels;
    const prevSameDay = prevRows.filter((d) => d.isSameDayCancellation).length;
    const prevPenalty = prevRows.reduce((sum, d) => sum + (Number(d.chargedPenaltyAmount) || 0), 0);
    return {
      total: rows.length,
      sameDay,
      penalty,
      growth: {
        total: pctChange(rows.length, prevRows.length),
        sameDay: pctChange(sameDay, prevSameDay),
        penalty: pctChange(penalty, prevPenalty),
      },
    };
  }, [filteredLateCancels, previousLateCancels]);

  const classFormatSummary = useMemo(() => {
    const byFormat: Record<string, { sessions: number; attendance: number; revenue: number }> = {};
    filteredSessions.forEach((session) => {
      const key = classifyFormat(session.cleanedClass || session.classType);
      byFormat[key] = byFormat[key] || { sessions: 0, attendance: 0, revenue: 0 };
      byFormat[key].sessions += 1;
      byFormat[key].attendance += Number(session.checkedInCount) || 0;
      byFormat[key].revenue += Number(session.totalPaid) || 0;
    });
    return Object.entries(byFormat).map(([name, value]) => ({
      name,
      sessions: value.sessions,
      attendance: value.attendance,
      revenue: value.revenue,
      fillRate: value.sessions ? value.attendance / value.sessions : 0,
    }));
  }, [filteredSessions]);

  const churnSummary = useMemo(() => {
    const byLocation: Record<string, { count: number; penalty: number }> = {};
    filteredLateCancels.forEach((item) => {
      const key = item.location || 'Unknown';
      byLocation[key] = byLocation[key] || { count: 0, penalty: 0 };
      byLocation[key].count += 1;
      byLocation[key].penalty += Number(item.chargedPenaltyAmount) || 0;
    });
    return Object.entries(byLocation)
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredLateCancels]);

  const studioWideLeads = useMemo(
    () => leads.filter((item) => inStudio(item.center, studio)),
    [leads, studio]
  );

  const studioWideClients = useMemo(
    () => clients.filter((item) => inStudio(item.firstVisitLocation || item.homeLocation, studio)),
    [clients, studio]
  );

  const studioWidePayroll = useMemo(
    () => payroll.filter((item) => inStudio(item.location, studio)),
    [payroll, studio]
  );

  const studioWideSessions = useMemo(
    () => sessions.filter((item) => inStudio(item.location, studio)),
    [sessions, studio]
  );

  const studioWideExpirations = useMemo(
    () => expirations.filter((item) => isValidExpiration(item) && inStudio(item.primaryLocation || item.homeLocation, studio)),
    [expirations, studio]
  );

  const funnelMatrix = useMemo(() => {
    const _now = new Date();
    const _currentMonthKey = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}`;
    const months = Array.from(new Set([
      ...studioWideLeads.map((item) => monthKeyFromDate(item.createdAt)).filter(Boolean) as string[],
      ...studioWideClients.map((item) => monthKeyFromDate(item.firstVisitDate)).filter(Boolean) as string[],
    ])).filter(k => k <= _currentMonthKey).sort().reverse();

    const monthLabels = Object.fromEntries(months.map((month) => [month, monthLabel(month)]));
    const rows: SalesMetricsMatrixRow[] = [
      { label: 'Leads Received', type: 'number', values: {} },
      { label: 'Trials / First Visits', type: 'number', values: {} },
      { label: 'Converted Members', type: 'number', values: {} },
      { label: 'Lead To Member %', type: 'percent', values: {} },
      { label: 'Retained Members', type: 'number', values: {} },
      { label: 'Retention %', type: 'percent', values: {} },
      { label: 'Visits Post Trial', type: 'number', values: {} },
      { label: 'Avg Visits Post Trial', type: 'number', values: {} },
      { label: 'LTV', type: 'currency', values: {} },
      { label: 'Memberships Bought', type: 'number', values: {} },
      { label: 'Avg Conversion Span', type: 'number', values: {} },
      { label: 'Trial to Conversion %', type: 'percent', values: {} },
      { label: 'Avg LTV', type: 'currency', values: {} },
      { label: 'Revenue from Retained', type: 'currency', values: {} },
      { label: 'Lead to Trial %', type: 'percent', values: {} },
    ];

    months.forEach((month) => {
      const leadRows = studioWideLeads.filter((item) => monthKeyFromDate(item.createdAt) === month);
      const clientRows = studioWideClients.filter((item) => monthKeyFromDate(item.firstVisitDate) === month);
      const converted = leadRows.filter((item) => isLeadConverted(item)).length;
      const retained = clientRows.filter((item) => item.retentionStatus === 'Retained').length;
      const visitsPostTrial = clientRows.reduce((sum, item) => sum + (Number(item.visitsPostTrial) || 0), 0);
      const ltv = clientRows.reduce((sum, item) => sum + (Number(item.ltv) || 0), 0);
      const membershipsBought = clientRows.filter((item) => `${item.membershipsBoughtPostTrial || ''}`.trim()).length;

      const trials = leadRows.filter((item) => {
        const t = (item.trialStatus || '').toLowerCase();
        return t.includes('completed') || t.includes('trial') || t.includes('attended');
      }).length;
      const avgConversionSpan = clientRows.length ? clientRows.reduce((sum, item) => sum + (Number(item.conversionSpan) || 0), 0) / clientRows.length : 0;
      const avgLtv = clientRows.length ? ltv / clientRows.length : 0;
      const revenueFromRetained = clientRows.filter((item) => item.retentionStatus === 'Retained').reduce((sum, item) => sum + (Number(item.ltv) || 0), 0);
      rows[0].values[month] = leadRows.length;
      rows[1].values[month] = clientRows.length;
      rows[2].values[month] = converted;
      rows[3].values[month] = leadRows.length ? (converted / leadRows.length) * 100 : 0;
      rows[4].values[month] = retained;
      rows[5].values[month] = clientRows.length ? (retained / clientRows.length) * 100 : 0;
      rows[6].values[month] = visitsPostTrial;
      rows[7].values[month] = clientRows.length ? visitsPostTrial / clientRows.length : 0;
      rows[8].values[month] = ltv;
      rows[9].values[month] = membershipsBought;
      rows[10].values[month] = avgConversionSpan;
      rows[11].values[month] = trials > 0 ? (converted / trials) * 100 : 0;
      rows[12].values[month] = avgLtv;
      rows[13].values[month] = revenueFromRetained;
      rows[14].values[month] = leadRows.length > 0 ? (trials / leadRows.length) * 100 : 0;
    });

    return { months, monthLabels, metricRows: rows };
  }, [studioWideClients, studioWideLeads]);

  const trainerMatrix = useMemo(() => {
    const _nowTr = new Date();
    const _curMonthTr = `${_nowTr.getFullYear()}-${String(_nowTr.getMonth() + 1).padStart(2, '0')}`;
    const months = Array.from(new Set(studioWidePayroll.map((item) => {
      const my = item.monthYear;
      if (!my) return null;
      return normalizeMonthYearToISO(my);
    }).filter(Boolean) as string[])).filter(k => k <= _curMonthTr).sort().reverse();
    const monthLabels = Object.fromEntries(months.map((month) => [month, monthLabel(month)]));
    const rows: SalesMetricsMatrixRow[] = [
      { label: 'Trainers Active', type: 'number', values: {} },
      { label: 'Sessions', type: 'number', values: {} },
      { label: 'Empty Sessions', type: 'number', values: {} },
      { label: 'Active Sessions', type: 'number', values: {} },
      { label: 'Empty Session Rate', type: 'percent', values: {} },
      { label: 'Customers', type: 'number', values: {} },
      { label: 'Pay', type: 'currency', values: {} },
      { label: 'Pay / Session', type: 'currency', values: {} },
      { label: 'Pay / Customer', type: 'currency', values: {} },
      { label: 'Avg Incl Empty', type: 'number', values: {} },
      { label: 'Avg Excl Empty', type: 'number', values: {} },
      { label: 'New Members', type: 'number', values: {} },
      { label: 'Converted', type: 'number', values: {} },
      { label: 'Retained', type: 'number', values: {} },
      { label: 'Conversion %', type: 'percent', values: {} },
      { label: 'Retention %', type: 'percent', values: {} },
    ];

    months.forEach((month) => {
      const monthRows = studioWidePayroll.filter((item) => item.monthYear && normalizeMonthYearToISO(item.monthYear) === month);
      const totalSessions = monthRows.reduce((sum, item) => sum + (Number(item.totalSessions) || 0), 0);
      const emptySessions = monthRows.reduce((sum, item) => sum + (Number(item.totalEmptySessions) || 0), 0);
      const activeSessions = monthRows.reduce((sum, item) => sum + (Number(item.totalNonEmptySessions) || 0), 0);
      const customers = monthRows.reduce((sum, item) => sum + (Number(item.totalCustomers) || 0), 0);
      const pay = monthRows.reduce((sum, item) => sum + (Number(item.totalPaid) || 0), 0);
      const newMembers = monthRows.reduce((sum, item) => sum + (Number(item.new) || 0), 0);
      const converted = monthRows.reduce((sum, item) => sum + (Number(item.converted) || 0), 0);
      const retained = monthRows.reduce((sum, item) => sum + (Number(item.retained) || 0), 0);

      rows[0].values[month] = new Set(monthRows.map((item) => item.teacherName).filter(Boolean)).size;
      rows[1].values[month] = totalSessions;
      rows[2].values[month] = emptySessions;
      rows[3].values[month] = activeSessions;
      rows[4].values[month] = totalSessions ? (emptySessions / totalSessions) * 100 : 0;
      rows[5].values[month] = customers;
      rows[6].values[month] = pay;
      rows[7].values[month] = totalSessions ? pay / totalSessions : 0;
      rows[8].values[month] = customers ? pay / customers : 0;
      rows[9].values[month] = totalSessions ? customers / totalSessions : 0;
      rows[10].values[month] = activeSessions ? customers / activeSessions : 0;
      rows[11].values[month] = newMembers;
      rows[12].values[month] = converted;
      rows[13].values[month] = retained;
      rows[14].values[month] = newMembers ? (converted / newMembers) * 100 : 0;
      rows[15].values[month] = newMembers ? (retained / newMembers) * 100 : 0;
    });

    return { months, monthLabels, metricRows: rows };
  }, [studioWidePayroll]);

  const classMatrix = useMemo(() => {
    const _nowCl = new Date();
    const _curMonthCl = `${_nowCl.getFullYear()}-${String(_nowCl.getMonth() + 1).padStart(2, '0')}`;
    const months = Array.from(new Set(studioWideSessions.map((item) => monthKeyFromDate(item.date)).filter(Boolean) as string[])).filter(k => k <= _curMonthCl).sort().reverse();
    const monthLabels = Object.fromEntries(months.map((month) => [month, monthLabel(month)]));
    const rows: SalesMetricsMatrixRow[] = [
      { label: 'Sessions Conducted', type: 'number', values: {} },
      { label: 'Visits', type: 'number', values: {} },
      { label: 'Capacity', type: 'number', values: {} },
      { label: 'Fill Rate', type: 'percent', values: {} },
      { label: 'Empty Sessions', type: 'number', values: {} },
      { label: 'Avg Class Size', type: 'number', values: {} },
      { label: 'Distinct Trainers', type: 'number', values: {} },
      { label: 'Distinct Formats', type: 'number', values: {} },
    ];

    months.forEach((month) => {
      const monthRows = studioWideSessions.filter((item) => monthKeyFromDate(item.date) === month);
      const visits = monthRows.reduce((sum, item) => sum + (Number(item.checkedInCount) || 0), 0);
      const capacity = monthRows.reduce((sum, item) => sum + (Number(item.capacity) || 0), 0);
      const emptySessions = monthRows.filter((item) => (Number(item.checkedInCount) || 0) === 0).length;

      rows[0].values[month] = monthRows.length;
      rows[1].values[month] = visits;
      rows[2].values[month] = capacity;
      rows[3].values[month] = capacity ? (visits / capacity) * 100 : 0;
      rows[4].values[month] = emptySessions;
      rows[5].values[month] = monthRows.length ? visits / monthRows.length : 0;
      rows[6].values[month] = new Set(monthRows.map((item) => item.trainerName).filter(Boolean)).size;
      rows[7].values[month] = new Set(monthRows.map((item) => classifyFormat(item.cleanedClass || item.classType))).size;
    });

    return { months, monthLabels, metricRows: rows };
  }, [studioWideSessions]);

  const lapsedMatrix = useMemo(() => {
    const _nowLp = new Date();
    const _curMonthLp = `${_nowLp.getFullYear()}-${String(_nowLp.getMonth() + 1).padStart(2, '0')}`;
    const months = Array.from(new Set(studioWideExpirations.map((item) => monthKeyFromDate(item.endDate)).filter(Boolean) as string[])).filter(k => k <= _curMonthLp).sort().reverse();
    const monthLabels = Object.fromEntries(months.map((month) => [month, monthLabel(month)]));
    const rows: SalesMetricsMatrixRow[] = [
      { label: 'Due Renewals', type: 'number', values: {} },
      { label: 'Renewed', type: 'number', values: {} },
      { label: 'Lapsed', type: 'number', values: {} },
      { label: 'Churned', type: 'number', values: {} },
      { label: 'Reactivated', type: 'number', values: {} },
      { label: 'Revenue Recovered', type: 'currency', values: {} },
      { label: 'Revenue Lost', type: 'currency', values: {} },
      { label: 'Lapse Rate %', type: 'percent', values: {} },
      { label: 'Churn Rate %', type: 'percent', values: {} },
      { label: 'Renewal Rate %', type: 'percent', values: {} },
      { label: 'Reactivation Rate %', type: 'percent', values: {} },
      { label: 'Net Retention %', type: 'percent', values: {} },
      { label: 'Not Renewed', type: 'number', values: {} },
      { label: 'Pending / Unknown', type: 'number', values: {} },
      { label: 'Net Revenue Impact', type: 'currency', values: {} },
    ];
    months.forEach((month) => {
      const monthRows = studioWideExpirations.filter((item) => monthKeyFromDate(item.endDate) === month);
      // Mutually exclusive buckets — every row assigned to exactly one
      const renewed = monthRows.filter((e) => /renew/i.test(e.status || '')).length;
      const frozen = monthRows.filter((e) => e.frozen || /frozen|freeze/i.test(e.status || '')).length;
      const active = monthRows.filter((e) => {
        const s = (e.status || '').toLowerCase().trim();
        return s === 'active' && !e.frozen && !/renew/i.test(s) && !/frozen|freeze/i.test(s);
      }).length;
      // lapsed = catch-all for anything not renewed/frozen/active
      const lapsed = monthRows.filter((e) => {
        const s = (e.status || '').toLowerCase().trim();
        return !e.frozen && !/renew/i.test(s) && !/frozen|freeze/i.test(s) && s !== 'active';
      }).length;
      const total = lapsed + renewed + active + frozen; // always equals monthRows.length
      const churned = monthRows.filter((e) => /churn/i.test(e.status || '')).length || lapsed;
      const reactivated = 0;
      const revenueRecovered = 0;
      const revenueLost = monthRows.reduce((sum, e) => sum + ((e as any).amountPaid || Number(e.paid) || 0), 0);
      const notRenewed = total - renewed - reactivated;
      const pending = monthRows.filter((e) => !e.status || /pending|unknown|n\/a/i.test(e.status)).length;
      rows[0].values[month] = total; // Due Renewals = lapsed + renewed + active + frozen
      rows[1].values[month] = renewed;
      rows[2].values[month] = lapsed;
      rows[3].values[month] = churned;
      rows[4].values[month] = reactivated;
      rows[5].values[month] = revenueRecovered;
      rows[6].values[month] = revenueLost;
      rows[7].values[month] = total ? (lapsed / total) * 100 : 0;
      rows[8].values[month] = total ? (churned / total) * 100 : 0;
      rows[9].values[month] = total ? (renewed / total) * 100 : 0;
      rows[10].values[month] = total ? (reactivated / total) * 100 : 0;
      rows[11].values[month] = total ? ((renewed + reactivated) / total) * 100 : 0;
      rows[12].values[month] = Math.max(0, notRenewed);
      rows[13].values[month] = pending;
      rows[14].values[month] = revenueRecovered - revenueLost;
    });
    return { months, monthLabels, metricRows: rows };
  }, [studioWideExpirations]);

  const lapsedByMembership = useMemo(() => {
    const byMembership: Record<string, number> = {};
    filteredExpirations.forEach((e) => {
      const key = e.membershipName || 'Unknown';
      byMembership[key] = (byMembership[key] || 0) + 1;
    });
    return Object.entries(byMembership).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredExpirations]);

  // ── NEW LAPSED ANALYTICS MEMOS ──

  const churnByMonth = useMemo(() => {
    const monthly: Record<string, { total: number; byMembership: Record<string, number>; byLocation: Record<string, number>; totalAmountPaid: number; totalSessionsCompleted: number; totalDaysActive: number; rowCount: number }> = {};
    studioWideExpirations.forEach((e) => {
      const mk = monthKeyFromDate(e.endDate);
      if (!mk) return;
      if (!monthly[mk]) monthly[mk] = { total: 0, byMembership: {}, byLocation: {}, totalAmountPaid: 0, totalSessionsCompleted: 0, totalDaysActive: 0, rowCount: 0 };
      const m = monthly[mk];
      m.total += 1;
      const mem = e.membershipName || 'Unknown';
      m.byMembership[mem] = (m.byMembership[mem] || 0) + 1;
      const loc = e.primaryLocation || e.homeLocation || 'Unknown';
      m.byLocation[loc] = (m.byLocation[loc] || 0) + 1;
      m.totalAmountPaid += (e as any).amountPaid || Number(e.paid) || 0;
      m.totalSessionsCompleted += (e as any).totalSessionsCompleted || 0;
      m.totalDaysActive += (e as any).daysActive || 0;
      m.rowCount += 1;
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mk, d]) => ({
        month: monthLabel(mk),
        mk,
        total: d.total,
        byMembership: d.byMembership,
        byLocation: d.byLocation,
        avgAmountPaid: d.rowCount > 0 ? d.totalAmountPaid / d.rowCount : 0,
        avgSessionsCompleted: d.rowCount > 0 ? d.totalSessionsCompleted / d.rowCount : 0,
        avgDaysActive: d.rowCount > 0 ? d.totalDaysActive / d.rowCount : 0,
      }));
  }, [studioWideExpirations]);

  const membershipChurnBreakdown = useMemo(() => {
    const map: Record<string, { count: number; members: Set<string>; totalPaid: number; totalSessions: number; totalDaysActive: number; earlyExits: number; discountCodes: number }> = {};
    studioWideExpirations.forEach((e) => {
      const key = e.membershipName || 'Unknown';
      if (!map[key]) map[key] = { count: 0, members: new Set(), totalPaid: 0, totalSessions: 0, totalDaysActive: 0, earlyExits: 0, discountCodes: 0 };
      const g = map[key];
      g.count += 1;
      if (e.memberId) g.members.add(e.memberId);
      g.totalPaid += (e as any).amountPaid || Number(e.paid) || 0;
      const sessUsedPct = (e as any).sessionsUsedPct || 0;
      g.totalSessions += sessUsedPct;
      g.totalDaysActive += (e as any).daysActive || 0;
      if (sessUsedPct < 50 && sessUsedPct > 0) g.earlyExits += 1;
      if ((e as any).discountCode) g.discountCodes += 1;
    });
    return Object.entries(map)
      .map(([name, d]) => ({
        name,
        count: d.count,
        uniqueMembers: d.members.size,
        avgLtv: d.members.size > 0 ? d.totalPaid / d.members.size : 0,
        avgSessionsUsedPct: d.count > 0 ? d.totalSessions / d.count : 0,
        avgDaysActive: d.count > 0 ? d.totalDaysActive / d.count : 0,
        earlyExitRate: d.count > 0 ? (d.earlyExits / d.count) * 100 : 0,
        discountRate: d.count > 0 ? (d.discountCodes / d.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [studioWideExpirations]);

  const lapsedEngagementStats = useMemo(() => {
    let totalSessionsUsedPct = 0;
    let totalAvgSessionsPerMonth = 0;
    let totalDaysActive = 0;
    let earlyExits = 0;
    let discountDriven = 0;
    let prevEarlyExits = 0;
    let prevTotal = previousExpirations.length;
    let prevAvgSessionsPerMonth = 0;
    let yoyEarlyExits = 0;
    let yoyTotal = previousYearExpirations.length;
    let yoyAvgSessionsPerMonth = 0;
    let count = filteredExpirations.length;

    filteredExpirations.forEach((e) => {
      const pct = (e as any).sessionsUsedPct || 0;
      totalSessionsUsedPct += pct;
      totalAvgSessionsPerMonth += (e as any).avgSessionsPerMonth || 0;
      totalDaysActive += (e as any).daysActive || 0;
      if (pct < 50 && pct > 0) earlyExits += 1;
      if ((e as any).discountCode) discountDriven += 1;
    });
    previousExpirations.forEach((e) => {
      const pct = (e as any).sessionsUsedPct || 0;
      if (pct < 50 && pct > 0) prevEarlyExits += 1;
      prevAvgSessionsPerMonth += (e as any).avgSessionsPerMonth || 0;
    });
    previousYearExpirations.forEach((e) => {
      const pct = (e as any).sessionsUsedPct || 0;
      if (pct < 50 && pct > 0) yoyEarlyExits += 1;
      yoyAvgSessionsPerMonth += (e as any).avgSessionsPerMonth || 0;
    });

    const earlyExitRate = count > 0 ? (earlyExits / count) * 100 : 0;
    const prevEarlyExitRate = prevTotal > 0 ? (prevEarlyExits / prevTotal) * 100 : 0;
    const yoyEarlyExitRate = yoyTotal > 0 ? (yoyEarlyExits / yoyTotal) * 100 : 0;
    const avgEngagement = count > 0 ? totalAvgSessionsPerMonth / count : 0;
    const prevAvgEngagement = prevTotal > 0 ? prevAvgSessionsPerMonth / prevTotal : 0;
    const yoyAvgEngagement = yoyTotal > 0 ? yoyAvgSessionsPerMonth / yoyTotal : 0;
    const avgSessionsUsedPct = count > 0 ? totalSessionsUsedPct / count : 0;
    const discountDrivenPct = count > 0 ? (discountDriven / count) * 100 : 0;

    return {
      earlyExitRate,
      earlyExitCount: earlyExits,
      earlyExitMomGrowth: pctChange(earlyExitRate, prevEarlyExitRate),
      earlyExitYoyGrowth: pctChange(earlyExitRate, yoyEarlyExitRate),
      avgEngagement,
      avgEngagementMomGrowth: pctChange(avgEngagement, prevAvgEngagement),
      avgEngagementYoyGrowth: pctChange(avgEngagement, yoyAvgEngagement),
      avgSessionsUsedPct,
      discountDrivenPct,
      discountDrivenCount: discountDriven,
    };
  }, [filteredExpirations, previousExpirations, previousYearExpirations]);

  // Back sparklines for new lapsed cards
  const backEarlyExitSparkline = useMemo(() => {
    const monthly: Record<string, { earlyExits: number; total: number }> = {};
    const studioExp = expirations.filter((e) => inStudio(e.primaryLocation || e.homeLocation, studio));
    studioExp.forEach((e) => {
      const mk = monthKeyFromDate(e.endDate);
      if (!mk) return;
      if (!monthly[mk]) monthly[mk] = { earlyExits: 0, total: 0 };
      monthly[mk].total += 1;
      const pct = (e as any).sessionsUsedPct || 0;
      if (pct < 50 && pct > 0) monthly[mk].earlyExits += 1;
    });
    return Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([, d]) => d.total > 0 ? (d.earlyExits / d.total) * 100 : 0);
  }, [expirations, studio]);

  const backEngagementSparkline = useMemo(() => {
    const monthly: Record<string, { total: number; sum: number }> = {};
    const studioExp = expirations.filter((e) => inStudio(e.primaryLocation || e.homeLocation, studio));
    studioExp.forEach((e) => {
      const mk = monthKeyFromDate(e.endDate);
      if (!mk) return;
      if (!monthly[mk]) monthly[mk] = { total: 0, sum: 0 };
      monthly[mk].total += 1;
      monthly[mk].sum += (e as any).avgSessionsPerMonth || 0;
    });
    return Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([, d]) => d.total > 0 ? d.sum / d.total : 0);
  }, [expirations, studio]);

  const lapsedByTrainer = useMemo(() => {
    const byTrainer: Record<string, number> = {};
    filteredExpirations.forEach((e) => {
      const key = (e as any).teacherName || (e as any).instructor || (e as any).trainer || 'Unknown';
      byTrainer[key] = (byTrainer[key] || 0) + 1;
    });
    return Object.entries(byTrainer).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredExpirations]);

  const winBackStats = useMemo(() => {
    // Build a lookup: memberId → all purchase dates (across all time, studio-scoped)
    const purchaseDatesByMember: Record<string, number[]> = {};
    studioWideSales.forEach((s) => {
      if (!s.memberId || !s.paymentDate) return;
      const t = new Date(s.paymentDate).getTime();
      if (isNaN(t)) return;
      if (!purchaseDatesByMember[s.memberId]) purchaseDatesByMember[s.memberId] = [];
      purchaseDatesByMember[s.memberId].push(t);
    });

    const isWinBack = (memberId: string, endDate: string): boolean => {
      const lapseMs = new Date(endDate).getTime();
      if (isNaN(lapseMs)) return false;
      const purchases = purchaseDatesByMember[memberId];
      if (!purchases) return false;
      // Any purchase >= 45 days after membership end date
      return purchases.some((t) => t >= lapseMs + 45 * 86400000);
    };

    const reactivated = filteredExpirations.filter((e) => isWinBack(e.memberId, e.endDate)).length;
    const prevReactivated = previousExpirations.filter((e) => isWinBack(e.memberId, e.endDate)).length;
    const yoyReactivated = previousYearExpirations.filter((e) => isWinBack(e.memberId, e.endDate)).length;
    const total = filteredExpirations.length;
    const prevTotal = previousExpirations.length;
    const yoyTotal = previousYearExpirations.length;
    const winBackRate = total ? (reactivated / total) * 100 : 0;
    const prevWinBackRate = prevTotal ? (prevReactivated / prevTotal) * 100 : 0;
    const yoyWinBackRate = yoyTotal ? (yoyReactivated / yoyTotal) * 100 : 0;
    return {
      reactivated,
      winBackRate,
      momGrowth: pctChange(winBackRate, prevWinBackRate),
      yoyGrowth: pctChange(winBackRate, yoyWinBackRate),
    };
  }, [filteredExpirations, previousExpirations, previousYearExpirations, studioWideSales]);

  const revenuePerVisitStats = useMemo(() => {
    const currentAttendance = sessionStats.attendance;
    const previousAttendance = previousSessions.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
    const yoyAttendance = previousYearSessions.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
    const previousNet = previousSales.reduce((sum, d) => sum + (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0), 0);
    const yoyNet = previousYearSales.reduce((sum, d) => sum + (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0), 0);
    const value = currentAttendance ? salesStats.net / currentAttendance : 0;
    const prevValue = previousAttendance ? previousNet / previousAttendance : 0;
    const yoyValue = yoyAttendance ? yoyNet / yoyAttendance : 0;
    return {
      value,
      momGrowth: pctChange(value, prevValue),
      yoyGrowth: pctChange(value, yoyValue),
    };
  }, [salesStats.net, sessionStats.attendance, previousSales, previousSessions, previousYearSales, previousYearSessions]);

  const revenuePerNewClientStats = useMemo(() => {
    const prevNewClients = previousClients.filter((c) => isInNewClientCohort(c)).length;
    const yoyNewClients = previousYearClients.filter((c) => isInNewClientCohort(c)).length;
    const previousNet = previousSales.reduce((sum, d) => sum + (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0), 0);
    const yoyNet = previousYearSales.reduce((sum, d) => sum + (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0), 0);
    const value = clientStats.newClients > 0 ? salesStats.net / clientStats.newClients : 0;
    const prevValue = prevNewClients > 0 ? previousNet / prevNewClients : 0;
    const yoyValue = yoyNewClients > 0 ? yoyNet / yoyNewClients : 0;
    return {
      value,
      momGrowth: pctChange(value, prevValue),
      yoyGrowth: pctChange(value, yoyValue),
    };
  }, [clientStats.newClients, salesStats.net, previousClients, previousSales, previousYearClients, previousYearSales]);

  // ── Instructor Efficiency ────────────────────────────────────────────────
  const instructorEfficiency = useMemo(() => {
    const map: Record<string, { trainer: string; sessions: number; emptySessions: number; totalCheckedIn: number; totalCapacity: number; totalRevenue: number }> = {};
    teacherRecurring.forEach((r) => {
      if (!inStudio(r.location, studio)) return;
      if (!isWithinRange(r.date, dateRange)) return;
      const key = r.trainer || `${r.firstName} ${r.lastName}`;
      if (!map[key]) map[key] = { trainer: key, sessions: 0, emptySessions: 0, totalCheckedIn: 0, totalCapacity: 0, totalRevenue: 0 };
      map[key].sessions += 1;
      map[key].emptySessions += r.checkedIn === 0 ? 1 : 0;
      map[key].totalCheckedIn += r.checkedIn;
      map[key].totalCapacity += r.capacity;
      map[key].totalRevenue += r.revenue;
    });
    return Object.values(map).map((d) => ({
      trainer: d.trainer,
      sessions: d.sessions,
      emptySessions: d.emptySessions,
      fillRate: d.totalCapacity > 0 ? (d.totalCheckedIn / d.totalCapacity) * 100 : 0,
      classAvgExclEmpty: (d.sessions - d.emptySessions) > 0 ? d.totalCheckedIn / (d.sessions - d.emptySessions) : 0,
      revenuePerClass: d.sessions > 0 ? d.totalRevenue / d.sessions : 0,
      totalRevenue: d.totalRevenue,
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [teacherRecurring, studio, dateRange]);

  // ── Peak Hour / Day-of-Week Heatmap ────────────────────────────────────
  const peakHourHeatmap = useMemo(() => {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // Per cell: track counts + unique session capacities + teacher/class name sets for rich tooltips
    type Cell = {
      attendance: number; booked: number; lateCancels: number;
      sessionCapacity: Map<string, number>;
      teachers: Set<string>; classes: Set<string>;
    };
    const buckets: Record<string, Record<string, Cell>> = {};
    const slotSet = new Set<string>();

    checkins.forEach((c) => {
      if (!inStudio(c.location, studio)) return;
      if (!isWithinRange(c.dateIST, dateRange)) return;
      const parts = (c.time || '').split(':');
      const hour = parseInt(parts[0]);
      const minutes = parseInt(parts[1] || '0');
      if (isNaN(hour)) return;
      const roundedMins = Math.floor(minutes / 15) * 15;
      const slot = `${hour}:${String(roundedMins).padStart(2, '0')}`;
      const day = c.dayOfWeek;
      if (!DAYS.includes(day)) return;
      slotSet.add(slot);
      if (!buckets[slot]) buckets[slot] = {};
      if (!buckets[slot][day]) buckets[slot][day] = { attendance: 0, booked: 0, lateCancels: 0, sessionCapacity: new Map(), teachers: new Set(), classes: new Set() };
      const cell = buckets[slot][day];
      if (c.checkedIn) cell.attendance += 1;
      if (c.isLateCancelled) cell.lateCancels += 1;
      cell.booked += 1;
      if (c.sessionId && !cell.sessionCapacity.has(c.sessionId)) {
        cell.sessionCapacity.set(c.sessionId, c.capacity);
      }
      if ((c as any).teacherName) cell.teachers.add((c as any).teacherName);
      if ((c as any).sessionName) cell.classes.add((c as any).sessionName);
    });

    const sortedSlots = Array.from(slotSet).sort((a, b) => {
      const [ah, am] = a.split(':').map(Number);
      const [bh, bm] = b.split(':').map(Number);
      return ah !== bh ? ah - bh : am - bm;
    });

    const flatBuckets: Record<string, Record<string, {
      attendance: number; capacity: number; classes: number; lateCancels: number;
      booked: number; fillRate: number; teacherList: string[]; classList: string[];
    }>> = {};
    sortedSlots.forEach((slot) => {
      flatBuckets[slot] = {};
      DAYS.forEach((day) => {
        const c = buckets[slot]?.[day];
        if (!c) {
          flatBuckets[slot][day] = { attendance: 0, capacity: 0, classes: 0, lateCancels: 0, booked: 0, fillRate: 0, teacherList: [], classList: [] };
          return;
        }
        const totalCapacity = Array.from(c.sessionCapacity.values()).reduce((s, v) => s + v, 0);
        flatBuckets[slot][day] = {
          attendance: c.attendance,
          capacity: totalCapacity,
          classes: c.sessionCapacity.size,
          lateCancels: c.lateCancels,
          booked: c.booked,
          fillRate: totalCapacity > 0 ? (c.attendance / totalCapacity) * 100 : 0,
          teacherList: Array.from(c.teachers).sort(),
          classList: Array.from(c.classes).sort(),
        };
      });
    });

    return { buckets: flatBuckets, days: DAYS, timeSlots: sortedSlots };
  }, [checkins, studio, dateRange]);

  // ── Complementary Class Rate MoM Trend (all-time, date-range independent) ──
  // Free/comp visits from recurringData.nonPaid — date-range independent, studio-scoped
  const compRateTrend = useMemo(() => {
    const monthly: Record<string, { totalCheckedIn: number; nonPaid: number; complimentary: number }> = {};
    recurringData.forEach((r) => {
      if (!inStudio(r.location, studio)) return;
      const mk = monthKeyFromDate(r.date);
      if (!mk) return;
      if (!monthly[mk]) monthly[mk] = { totalCheckedIn: 0, nonPaid: 0, complimentary: 0 };
      monthly[mk].totalCheckedIn += r.checkedIn || 0;
      monthly[mk].nonPaid += r.nonPaid || 0;
      monthly[mk].complimentary += r.complimentary || 0;
    });
    return Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([mk, d]) => ({
      month: monthLabel(mk),
      nonPaidRate: d.totalCheckedIn > 0 ? (d.nonPaid / d.totalCheckedIn) * 100 : 0,
      compRate: d.totalCheckedIn > 0 ? (d.complimentary / d.totalCheckedIn) * 100 : 0,
      nonPaid: d.nonPaid,
      complimentary: d.complimentary,
      totalCheckedIn: d.totalCheckedIn,
    }));
  }, [recurringData, studio]);

  // ── Product Mix by Month ─────────────────────────────────────────────────
  const productMixByMonth = useMemo(() => {
    const monthly: Record<string, { memberships: number; packages: number; introOffers: number; singleClasses: number; other: number }> = {};
    filteredSales.forEach((item) => {
      const cat = (item.cleanedCategory || item.cleanedProduct || '').toLowerCase();
      const mk = monthKeyFromDate(item.paymentDate || (item as any).date || '');
      if (!mk) return;
      if (!monthly[mk]) monthly[mk] = { memberships: 0, packages: 0, introOffers: 0, singleClasses: 0, other: 0 };
      const rev = Number(item.paymentValue) || 0;
      if (/member|membership/i.test(cat)) monthly[mk].memberships += rev;
      else if (/intro|welcome|trial|first.?time|new.*client/i.test(cat)) monthly[mk].introOffers += rev;
      else if (/single|drop.?in|walk.?in|casual/i.test(cat)) monthly[mk].singleClasses += rev;
      else if (/pack|package|class\s*pack|session\s*pack/i.test(cat)) monthly[mk].packages += rev;
      else monthly[mk].other += rev;
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mk, d]) => ({ month: monthLabel(mk), ...d }))
      .filter((d) => d.memberships + d.packages + d.introOffers + d.singleClasses + d.other > 0);
  }, [filteredSales]);

  // ── Capacity Utilization by Studio ──────────────────────────────────────
  const capacityByStudio = useMemo(() => {
    const map: Record<string, { booked: number; capacity: number; sessions: number }> = {};
    recurringData.forEach((r) => {
      if (!isWithinRange(r.date, dateRange)) return;
      const loc = r.location || 'Unknown';
      if (!map[loc]) map[loc] = { booked: 0, capacity: 0, sessions: 0 };
      map[loc].booked += r.checkedIn;
      map[loc].capacity += r.capacity;
      map[loc].sessions += 1;
    });
    return Object.entries(map).map(([location, d]) => ({
      location,
      booked: d.booked,
      capacity: d.capacity,
      sessions: d.sessions,
      utilization: d.capacity > 0 ? (d.booked / d.capacity) * 100 : 0,
    })).sort((a, b) => b.utilization - a.utilization);
  }, [recurringData, dateRange]);

  const [funnelRankingDimension, setFunnelRankingDimension] = useState<'source' | 'location' | 'stage' | 'membership' | 'class'>('source');
  const [newMemberTableMetric, setNewMemberTableMetric] = useState<'source' | 'membership' | 'class'>('source');
  const [funnelChartMetric, setFunnelChartMetric] = useState<'leads' | 'converted' | 'retained' | 'ltv'>('leads');
  const [funnelRankingCount, setFunnelRankingCount] = useState<5 | 10 | 15 | 20>(5);
  const [editableSummaryText, setEditableSummaryText] = useState(() => {
    try { return localStorage.getItem('sp_summary_text') || ''; } catch { return ''; }
  });
  const [isSummaryEditing, setIsSummaryEditing] = useState(false);
  const [aiPanel, setAIPanel] = useState<{ open: boolean; sectionKey: string; title: string } | null>(null);
  const [showFunnelMomTable, setShowFunnelMomTable] = useState(false);
  const [funnelChartView, setFunnelChartView] = useState<'funnel' | 'bar'>('funnel');
  const [showFunnelBreakdownTable, setShowFunnelBreakdownTable] = useState(false);
  const [showNewMemberMomTable, setShowNewMemberMomTable] = useState(false);
  const [showTrainerMomTable, setShowTrainerMomTable] = useState(false);
  const [showTrainerFormatSection, setShowTrainerFormatSection] = useState(false);
  const [trainerRankingCriteria, setTrainerRankingCriteria] = useState<'paid' | 'revenueScore' | 'fillRate' | 'classAvg' | 'sessions'>('paid');
  const [scorecardSortKey, setScorecardSortKey] = useState<'sessions' | 'customers' | 'paid' | 'classAvg' | 'fillRate' | 'utilization' | 'conversionRate' | 'lateCancels' | 'revenueScore'>('sessions');
  const [scorecardSortDir, setScorecardSortDir] = useState<'desc' | 'asc'>('desc');
  const [scorecardExpandedTrainer, setScorecardExpandedTrainer] = useState<string | null>(null);
  const [showClassMomTable, setShowClassMomTable] = useState(false);
  const [showSheetStructureCheck, setShowSheetStructureCheck] = useState(false);
  const [showLapsedMomTable, setShowLapsedMomTable] = useState(false);
  const [churnLocationMetric, setChurnLocationMetric] = useState<'count' | 'penalty'>('count');
  const [lapseRankDimension, setLapseRankDimension] = useState<'membership' | 'location'>('membership');
  const [showSalesRankings, setShowSalesRankings] = useState(false);
  const [showDiscountCodes, setShowDiscountCodes] = useState(false);
  const [showFunnelRankings, setShowFunnelRankings] = useState(false);
  const [showTrainerRankings, setShowTrainerRankings] = useState(false);
  const [showLapseRankings, setShowLapseRankings] = useState(false);
  const [showLapsedChurnTrend, setShowLapsedChurnTrend] = useState(false);
  const [lapsedTableTab, setLapsedTableTab] = useState<'breakdown' | 'renewal' | 'churned' | 'highvalue'>('churned');
  const [churnTrendMetric, setChurnTrendMetric] = useState<'count' | 'ltv'>('count');
  const [showSessionRankings, setShowSessionRankings] = useState(false);
  const [showMomTable, setShowMomTable] = useState(false);
  const [allTogglesOn, setAllTogglesOn] = useState(false);
  const handleMasterToggle = useCallback(() => {
    const next = !allTogglesOn;
    setAllTogglesOn(next);
    setShowFunnelMomTable(next);
    setShowFunnelBreakdownTable(next);
    setShowNewMemberMomTable(next);
    setShowTrainerMomTable(next);
    setShowTrainerFormatSection(next);
    setShowClassMomTable(next);
    setShowLapsedMomTable(next);
    setShowSalesRankings(next);
    setShowDiscountCodes(next);
    setShowFunnelRankings(next);
    setShowTrainerRankings(next);
    setShowLapseRankings(next);
    setShowLapsedChurnTrend(next);
    setShowSessionRankings(next);
    setShowMomTable(next);
  }, [allTogglesOn]);
  const [sessionRankingDimension, setSessionRankingDimension] = useState<'class' | 'trainer' | 'format' | 'location' | 'day' | 'time'>('class');
  const [sessionRankingMetric, setSessionRankingMetric] = useState<'classAvg' | 'fillRate' | 'visits' | 'sessions' | 'revenue' | 'cancellationRate' | 'revPerCheckin' | 'compositeScore'>('classAvg');
  const [sessionRankingCount, setSessionRankingCount] = useState<10 | 20 | 30>(10);
  const [sessionViewMode, setSessionViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [heatmapMetric, setHeatmapMetric] = useState<'attendance' | 'classes' | 'booked' | 'lateCancels' | 'fillRate'>('attendance');
  const [sessionTableView, setSessionTableView] = useState<'default' | 'performance' | 'revenue' | 'attendance' | 'capacity' | 'cancellations'>('default');
  const [sessionDensity, setSessionDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [sessionMinCheckins, setSessionMinCheckins] = useState(0);
  const [sessionMinClasses, setSessionMinClasses] = useState(0);
  const [sessionIncludeTrainer, setSessionIncludeTrainer] = useState(false);
  const [annotationMode, setAnnotationMode] = React.useState(false);
  const [formatCompTab, setFormatCompTab] = useState<FormatCompTab>('overview');
  const [sessionStatusFilter, setSessionStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sessionShowAdvanced, setSessionShowAdvanced] = useState(false);
  const [sessionExcludeHosted, setSessionExcludeHosted] = useState(false);
  const [sessionGrouping, setSessionGrouping] = useState<
    'none' | 'ClassDayTimeLocation' | 'ClassDayTimeLocationTrainer' | 'LocationClass' | 'ClassDay' | 'ClassTime' | 'ClassDayTrainer' | 'ClassTrainer' | 'DayTimeLocation' | 'DayTime' | 'TrainerLocation' | 'DayLocation' | 'TimeLocation' | 'ClassType' | 'TypeLocation' | 'TrainerDay' | 'ClassLocation' | 'TrainerTime' | 'AMSessions' | 'PMSessions' | 'MorningClasses' | 'EveningClasses' | 'Weekday' | 'Weekend' | 'Class' | 'Type' | 'Trainer' | 'Location' | 'Day' | 'Date' | 'Time' | 'SessionName'
  >('none');
  const [sessionTopMetric, setSessionTopMetric] = useState<'classAvg' | 'fillRate' | 'visits' | 'sessions' | 'revenue' | 'cancellationRate' | 'revPerCheckin' | 'compositeScore'>('classAvg');
  const [sessionBottomMetric, setSessionBottomMetric] = useState<'classAvg' | 'fillRate' | 'visits' | 'sessions' | 'revenue' | 'cancellationRate' | 'revPerCheckin' | 'compositeScore'>('classAvg');
  const [sessionTopCount, setSessionTopCount] = useState<5 | 10 | 20>(10);
  const [sessionBottomCount, setSessionBottomCount] = useState<5 | 10 | 20>(10);
  const [sessionExpandedGroups, setSessionExpandedGroups] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [isExportingPulse, setIsExportingPulse] = useState(false);
  const monthViewMode = searchParams.get('mv') === '1';
  const aiSummaryCacheOnly = import.meta.env.VITE_TESTMODE === 'true' && searchParams.get('testmode') !== 'false';
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [aiNarrative, setAiNarrative] = useState<LocationReportNarrative | null>(null);
  const [sectionEdits, setSectionEdits] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('sp_section_edits_v1') || '{}'); } catch { return {}; }
  });
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const saveSectionEdit = useCallback((key: string, text: string) => {
    setSectionEdits((prev) => {
      const next = { ...prev, [key]: text };
      try { localStorage.setItem('sp_section_edits_v1', JSON.stringify(next)); } catch {}
      return next;
    });
    setEditingSectionKey(null);
  }, []);
  const clearSectionEdit = useCallback((key: string) => {
    setSectionEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      try { localStorage.setItem('sp_section_edits_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const toggleSessionGroup = useCallback((key: string) => {
    setSessionExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleOpenReport = useCallback(async () => {
    setReportLoading(true);
    setReportOpen(true);
    try {
      const narrative = await geminiService.generateLocationReport(
        {
          totalRevenue: salesStats.gross,
          netRevenue: salesStats.net,
          vatAmount: salesStats.gross - salesStats.net,
          totalTransactions: salesStats.txns,
          uniqueMembers: salesStats.members,
          avgTransactionValue: salesStats.atv,
          avgSpendPerMember: salesStats.members > 0 ? salesStats.net / salesStats.members : 0,
          totalDiscounts: salesStats.discount,
          discountRate: salesStats.discountPenetration,
          totalSessions: sessionStats.totalSessions,
          totalCheckIns: sessionStats.attendance,
          fillRate: sessionStats.avgFill,
          lateCancellations: lcStats.total,
          totalTrainers: trainerStats.all.length,
          avgClassSize: sessionStats.totalSessions > 0 ? sessionStats.attendance / sessionStats.totalSessions : 0,
          revenuePerTrainer: trainerStats.all.length > 0 ? salesStats.net / trainerStats.all.length : 0,
          topTrainerName: trainerStats.top[0]?.name || 'N/A',
          topTrainerRevenue: trainerStats.top[0]?.paid || 0,
          newClientsAcquired: clientStats.newClients,
          conversionRate: clientStats.conversionRate,
          retentionRate: clientStats.retentionRate,
          churnRate: expirationStats.lapsedPct,
          churnedMembers: expirationStats.lapsed,
          totalLeads: leadStats.total,
          leadsConverted: leadStats.converted,
          leadConversionRate: leadStats.conversionRate,
          overallScore: Math.round(
            Math.min(100, (sessionStats.avgFill * 0.3) + (clientStats.conversionRate * 0.25) + (clientStats.retentionRate * 0.2) +
              ((1 - salesStats.discountPenetration / 100) * 20) + (salesStats.net > 0 ? Math.min(25, 25) : 0))
          ),
          revenueGrowth: salesStats.growth.net ?? 0,
        },
        activeStudio.name,
        `${dateRange.start} to ${dateRange.end}`
      );
      setAiNarrative(narrative);
    } catch (err) {
      console.error('AI report generation failed:', err);
    } finally {
      setReportLoading(false);
    }
  }, [salesStats, sessionStats, lcStats, clientStats, expirationStats, leadStats, trainerStats, activeStudio.name, dateRange]);

  // Auto-regenerate the report when location or date changes while the report is open
  useEffect(() => {
    if (!reportOpen) return;
    handleOpenReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio, dateRange]);

  // Init state from URL params (one-time on mount)
  useEffect(() => {
    if (didInitFromUrl.current) return;
    didInitFromUrl.current = true;
    const p = searchParams;
    if (p.has('studio')) setStudio((p.get('studio') as StudioId) || 'all');
    if (p.has('from') && p.has('to')) setDateRange({ start: p.get('from')!, end: p.get('to')! });
    if (p.has('frd')) setFunnelRankingDimension(p.get('frd') as any);
    if (p.has('nmm')) setNewMemberTableMetric(p.get('nmm') as any);
    if (p.has('fcm')) setFunnelChartMetric(p.get('fcm') as any);
    if (p.has('frc')) setFunnelRankingCount(Number(p.get('frc')) as any);
    if (p.has('fcv')) setFunnelChartView(p.get('fcv') as any);
    if (p.has('sfmt')) setShowFunnelMomTable(p.get('sfmt') === '1');
    if (p.has('sfbt')) setShowFunnelBreakdownTable(p.get('sfbt') === '1');
    if (p.has('snmmt')) setShowNewMemberMomTable(p.get('snmmt') === '1');
    if (p.has('stmt')) setShowTrainerMomTable(p.get('stmt') === '1');
    if (p.has('stfs')) setShowTrainerFormatSection(p.get('stfs') === '1');
    if (p.has('ssk')) setScorecardSortKey(p.get('ssk') as any);
    if (p.has('ssd')) setScorecardSortDir(p.get('ssd') as any);
    if (p.has('scmt')) setShowClassMomTable(p.get('scmt') === '1');
    if (p.has('slmt')) setShowLapsedMomTable(p.get('slmt') === '1');
    if (p.has('clm')) setChurnLocationMetric(p.get('clm') as any);
    if (p.has('lrd')) setLapseRankDimension(p.get('lrd') as any);
    if (p.has('srd')) setSessionRankingDimension(p.get('srd') as any);
    if (p.has('srm')) setSessionRankingMetric(p.get('srm') as any);
    if (p.has('src')) setSessionRankingCount(Number(p.get('src')) as any);
    if (p.has('svm')) setSessionViewMode(p.get('svm') as any);
    if (p.has('stv')) setSessionTableView(p.get('stv') as any);
    if (p.has('sd')) setSessionDensity(p.get('sd') as any);
    if (p.has('fct')) setFormatCompTab(p.get('fct') as any);
    if (p.has('ssf')) setSessionStatusFilter(p.get('ssf') as any);
    if (p.has('seh')) setSessionExcludeHosted(p.get('seh') === '1');
    if (p.has('stm')) setSessionTopMetric(p.get('stm') as any);
    if (p.has('sbm')) setSessionBottomMetric(p.get('sbm') as any);
    if (p.has('stc')) setSessionTopCount(Number(p.get('stc')) as any);
    if (p.has('sbc')) setSessionBottomCount(Number(p.get('sbc')) as any);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync state → URL params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('studio', studio);
    params.set('from', dateRange.start);
    params.set('to', dateRange.end);
    if (funnelRankingDimension !== 'source') params.set('frd', funnelRankingDimension);
    if (newMemberTableMetric !== 'source') params.set('nmm', newMemberTableMetric);
    if (funnelChartMetric !== 'leads') params.set('fcm', funnelChartMetric);
    if (funnelRankingCount !== 5) params.set('frc', String(funnelRankingCount));
    if (funnelChartView !== 'funnel') params.set('fcv', funnelChartView);
    if (showFunnelMomTable) params.set('sfmt', '1');
    if (showFunnelBreakdownTable) params.set('sfbt', '1');
    if (showNewMemberMomTable) params.set('snmmt', '1');
    if (showTrainerMomTable) params.set('stmt', '1');
    if (showTrainerFormatSection) params.set('stfs', '1');
    if (scorecardSortKey !== 'sessions') params.set('ssk', scorecardSortKey);
    if (scorecardSortDir !== 'desc') params.set('ssd', scorecardSortDir);
    if (showClassMomTable) params.set('scmt', '1');
    if (showLapsedMomTable) params.set('slmt', '1');
    if (churnLocationMetric !== 'count') params.set('clm', churnLocationMetric);
    if (lapseRankDimension !== 'membership') params.set('lrd', lapseRankDimension);
    if (sessionRankingDimension !== 'class') params.set('srd', sessionRankingDimension);
    if (sessionRankingMetric !== 'classAvg') params.set('srm', sessionRankingMetric);
    if (sessionRankingCount !== 10) params.set('src', String(sessionRankingCount));
    if (sessionViewMode !== 'grouped') params.set('svm', sessionViewMode);
    if (sessionTableView !== 'default') params.set('stv', sessionTableView);
    if (sessionDensity !== 'comfortable') params.set('sd', sessionDensity);
    if (formatCompTab !== 'overview') params.set('fct', formatCompTab);
    if (sessionStatusFilter !== 'all') params.set('ssf', sessionStatusFilter);
    if (sessionExcludeHosted) params.set('seh', '1');
    if (sessionTopMetric !== 'classAvg') params.set('stm', sessionTopMetric);
    if (sessionBottomMetric !== 'classAvg') params.set('sbm', sessionBottomMetric);
    if (sessionTopCount !== 10) params.set('stc', String(sessionTopCount));
    if (sessionBottomCount !== 10) params.set('sbc', String(sessionBottomCount));
    setSearchParams(params, { replace: true });
  }, [
    studio, dateRange, funnelRankingDimension, newMemberTableMetric, funnelChartMetric,
    funnelRankingCount, funnelChartView, showFunnelMomTable, showFunnelBreakdownTable,
    showNewMemberMomTable, showTrainerMomTable, showTrainerFormatSection, scorecardSortKey,
    scorecardSortDir, showClassMomTable, showLapsedMomTable, churnLocationMetric,
    lapseRankDimension, sessionRankingDimension, sessionRankingMetric, sessionRankingCount,
    sessionViewMode, sessionTableView, sessionDensity, formatCompTab, sessionStatusFilter,
    sessionExcludeHosted, sessionTopMetric, sessionBottomMetric, sessionTopCount, sessionBottomCount,
    searchParams,
    setSearchParams,
  ]);

  /* ---------- Session Intelligence grouped rankings ---------- */
  const sessionIntelligence = useMemo(() => {
    const HOSTED_TOKENS = ['host', 'hosted', 'p57', 'birthday', 'rugby', 'lrs'];
    const isHostedClass = (s: { sessionName?: string; cleanedClass?: string; classType?: string }) => {
      const name = (s.sessionName || s.cleanedClass || s.classType || '').toLowerCase();
      return HOSTED_TOKENS.some((t) => name.includes(t));
    };

    // Determine active/inactive: group by the same key as ranking dimension using ALL studio sessions,
    // then mark a key as active if it appeared in the last 2 calendar months.
    const studioAllSessions = sessions.filter((s) => inStudio(s.location, studio));
    const now = new Date();
    const activeThresholdDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const activeThresholdStr = activeThresholdDate.toISOString().slice(0, 10);
    const activeKeys = new Set<string>();
    studioAllSessions.forEach((s) => {
      if ((s.date || '') >= activeThresholdStr) {
        const className = normalizeClassName(s.sessionName || s.cleanedClass || s.classType);
        const trainerName = s.trainerName || 'Unknown';
        const loc = s.location || 'Unknown';
        const day = (() => { const d = parseDate(s.date); return d ? d.toLocaleDateString('en-IN', { weekday: 'long' }) : 'Unknown'; })();
        const time = s.time || 'Unknown';
        activeKeys.add(className);
        activeKeys.add(trainerName);
        activeKeys.add(loc);
        activeKeys.add(day);
        activeKeys.add(time);
        activeKeys.add(classifyFormat(s.cleanedClass || s.classType));
        // compound keys
        activeKeys.add(`${className}|${day}|${time}|${loc}`);
        activeKeys.add(`${className}|${day}|${time}|${loc}|${trainerName}`);
        activeKeys.add(`${loc}|${className}`);
        activeKeys.add(`${className}|${day}`);
        activeKeys.add(`${className}|${time}`);
        activeKeys.add(`${className}|${day}|${trainerName}`);
        activeKeys.add(`${className}|${trainerName}`);
        activeKeys.add(`${day}|${time}|${loc}`);
        activeKeys.add(`${day}|${time}`);
        activeKeys.add(`${trainerName}|${loc}`);
      }
    });

    type GroupRow = {
      name: string; sessions: number; visits: number; capacity: number; empty: number;
      revenue: number; memberships: number; packages: number; introOffers: number; singleClasses: number; lateCancels: number;
      children: Array<{ date: string; trainer: string; location: string; sessions: number; visits: number; capacity: number; fillRate: number; classAvg: number; empty: number; revenue: number; lateCancels: number; }>;
    };

    // Apply pre-filters: excludeHosted
    const preSessions = filteredSessions.filter((s) => {
      if (sessionExcludeHosted && isHostedClass(s)) return false;
      return true;
    });

    const grouped: Record<string, GroupRow> = {};
    preSessions.forEach((s) => {
      const className = normalizeClassName(s.sessionName || s.cleanedClass || s.classType);
      const trainerName = s.trainerName || 'Unknown';
      const loc = s.location || 'Unknown';
      const day = (() => { const d = parseDate(s.date); return d ? d.toLocaleDateString('en-IN', { weekday: 'long' }) : 'Unknown'; })();
      const time = s.time || 'Unknown';
      const fmt = classifyFormat(s.cleanedClass || s.classType);

      let key = '';
      if (sessionGrouping !== 'none') {
        switch (sessionGrouping) {
          case 'ClassDayTimeLocation': key = `${className} · ${day} · ${time} · ${loc}`; break;
          case 'ClassDayTimeLocationTrainer': key = `${className} · ${day} · ${time} · ${loc} · ${trainerName}`; break;
          case 'LocationClass': key = `${loc} → ${className}`; break;
          case 'ClassDay': key = `${className} · ${day}`; break;
          case 'ClassTime': key = `${className} · ${time}`; break;
          case 'ClassDayTrainer': key = `${className} · ${day} · ${trainerName}`; break;
          case 'ClassTrainer': key = `${className} · ${trainerName}`; break;
          case 'DayTimeLocation': key = `${day} · ${time} · ${loc}`; break;
          case 'DayTime': key = `${day} · ${time}`; break;
          case 'TrainerLocation': key = `${trainerName} · ${loc}`; break;
          case 'DayLocation': key = `${day} · ${loc}`; break;
          case 'TimeLocation': key = `${time} · ${loc}`; break;
          case 'ClassType': key = fmt; break;
          case 'TypeLocation': key = `${fmt} · ${loc}`; break;
          case 'TrainerDay': key = `${trainerName} · ${day}`; break;
          case 'ClassLocation': key = `${className} · ${loc}`; break;
          case 'TrainerTime': key = `${trainerName} · ${time}`; break;
          case 'AMSessions': { const hour = parseInt(time); key = (!isNaN(hour) && hour < 12) || time.toLowerCase().includes('am') ? 'AM (Before 12pm)' : 'PM (12pm+)'; break; }
          case 'PMSessions': { const hour = parseInt(time); key = (!isNaN(hour) && hour >= 12) || time.toLowerCase().includes('pm') ? 'PM (12pm+)' : 'AM (Before 12pm)'; break; }
          case 'MorningClasses': key = (parseInt(time) < 13) ? 'Morning (before 1pm)' : 'Afternoon/Evening'; break;
          case 'EveningClasses': key = (parseInt(time) >= 17 || time.toLowerCase().includes('evening')) ? 'Evening (5pm+)' : 'Day'; break;
          case 'Weekday': { const wd = ['Monday','Tuesday','Wednesday','Thursday','Friday']; key = wd.includes(day) ? 'Weekday' : 'Weekend'; break; }
          case 'Weekend': { const we = ['Saturday','Sunday']; key = we.includes(day) ? 'Weekend' : 'Weekday'; break; }
          case 'Class': key = className; break;
          case 'Type': key = fmt; break;
          case 'Trainer': key = trainerName; break;
          case 'Location': key = loc; break;
          case 'Day': key = day; break;
          case 'Date': key = s.date || 'Unknown'; break;
          case 'Time': key = time; break;
          case 'SessionName': key = s.sessionName || className; break;
          default: key = className;
        }
      } else {
        if (sessionRankingDimension === 'class') {
          key = sessionIncludeTrainer ? `${className} · ${trainerName}` : className;
        } else if (sessionRankingDimension === 'trainer') key = trainerName;
        else if (sessionRankingDimension === 'format') key = fmt;
        else if (sessionRankingDimension === 'location') key = loc;
        else if (sessionRankingDimension === 'day') key = day;
        else if (sessionRankingDimension === 'time') key = time;
      }
      if (!key) key = 'Unknown';

      if (!grouped[key]) grouped[key] = { name: key, sessions: 0, visits: 0, capacity: 0, empty: 0, revenue: 0, memberships: 0, packages: 0, introOffers: 0, singleClasses: 0, lateCancels: 0, children: [] };
      const g = grouped[key];
      const visits = Number(s.checkedInCount) || 0;
      const cap = Number(s.capacity) || 0;
      const rev = Number(s.revenue) || Number(s.totalPaid) || 0;
      g.sessions += 1;
      g.visits += visits;
      g.capacity += cap;
      g.empty += visits === 0 ? 1 : 0;
      g.revenue += rev;
      g.memberships += Number(s.checkedInsWithMemberships) || 0;
      g.packages += Number(s.checkedInsWithPackages) || 0;
      g.introOffers += Number(s.checkedInsWithIntroOffers) || 0;
      g.singleClasses += Number(s.checkedInsWithSingleClasses) || 0;
      g.lateCancels += Number(s.lateCancelledCount) || 0;
      g.children.push({
        date: s.date,
        trainer: s.trainerName || '—',
        location: s.location || '—',
        sessions: 1,
        visits,
        capacity: cap,
        fillRate: cap > 0 ? (visits / cap) * 100 : 0,
        classAvg: visits,
        empty: visits === 0 ? 1 : 0,
        revenue: rev,
        lateCancels: Number(s.lateCancelledCount) || 0,
      });
    });
    const rows = Object.values(grouped).map((g) => ({
      ...g,
      classAvg: g.sessions > 0 ? g.visits / g.sessions : 0,
      fillRate: g.capacity > 0 ? (g.visits / g.capacity) * 100 : 0,
      children: [...g.children].sort((a, b) => b.date.localeCompare(a.date)),
    }));
    const enriched = rows.map((g) => {
      const cancellationRate = g.visits + g.lateCancels > 0 ? (g.lateCancels / (g.visits + g.lateCancels)) * 100 : 0;
      const revPerCheckin = g.visits > 0 ? g.revenue / g.visits : 0;
      // Composite score (0–100):
      //   30% fill rate — primary demand signal
      //   25% avg attendance normalised to 15 pax benchmark
      //   20% empty-session penalty — penalise classes that run empty
      //   15% session volume (consistency) normalised to 30 sessions
      //   10% revenue per attendee normalised to ₹500
      const attendanceScore     = Math.min((g.classAvg / 15) * 100, 100);
      const fillScore           = Math.min(g.fillRate, 100);
      const sessionVolumeScore  = Math.min((g.sessions / 30) * 100, 100);
      const emptyRate           = g.sessions > 0 ? g.empty / g.sessions : 0;
      const emptyPenaltyScore   = (1 - emptyRate) * 100;
      const revPerCheckinScore  = Math.min((revPerCheckin / 500) * 100, 100);
      const compositeScore =
        fillScore          * 0.30 +
        attendanceScore    * 0.25 +
        emptyPenaltyScore  * 0.20 +
        sessionVolumeScore * 0.15 +
        revPerCheckinScore * 0.10;
      const isActive = activeKeys.has(g.name);
      return { ...g, cancellationRate, revPerCheckin, compositeScore, isActive };
    }).filter((g) => {
      if (g.visits < sessionMinCheckins) return false;
      if (g.sessions < sessionMinClasses) return false;
      if (sessionStatusFilter === 'active' && !g.isActive) return false;
      if (sessionStatusFilter === 'inactive' && g.isActive) return false;
      return true;
    });
    const sorted = [...enriched].sort((a, b) => {
      if (sessionRankingMetric === 'classAvg') return b.classAvg - a.classAvg;
      if (sessionRankingMetric === 'fillRate') return b.fillRate - a.fillRate;
      if (sessionRankingMetric === 'visits') return b.visits - a.visits;
      if (sessionRankingMetric === 'revenue') return b.revenue - a.revenue;
      if (sessionRankingMetric === 'cancellationRate') return b.cancellationRate - a.cancellationRate;
      if (sessionRankingMetric === 'revPerCheckin') return b.revPerCheckin - a.revPerCheckin;
      if (sessionRankingMetric === 'compositeScore') return b.compositeScore - a.compositeScore;
      return b.sessions - a.sessions;
    });
    return { rows: sorted, top: sorted.slice(0, sessionRankingCount), bottom: [...sorted].reverse().slice(0, sessionRankingCount) };
  }, [filteredSessions, sessions, studio, sessionRankingDimension, sessionRankingMetric, sessionRankingCount, sessionMinCheckins, sessionMinClasses, sessionExcludeHosted, sessionIncludeTrainer, sessionStatusFilter, sessionGrouping]);

  const reportSlotRows = useMemo(() => {
    const grouped: Record<string, {
      name: string; trainer: string; day: string; time: string; location: string;
      sessions: number; visits: number; capacity: number; lateCancels: number;
    }> = {};
    filteredSessions.forEach((s) => {
      const className = normalizeClassName(s.sessionName || s.cleanedClass || s.classType);
      const trainer   = s.trainerName || 'Unknown';
      const dayFull   = (() => { const d = parseDate(s.date); return d ? d.toLocaleDateString('en-IN', { weekday: 'short' }) : '—'; })();
      const time      = s.time || '—';
      const loc       = s.location || '—';
      const key       = `${className}|${dayFull}|${time}|${trainer}`;
      if (!grouped[key]) {
        grouped[key] = { name: className, trainer, day: dayFull, time, location: loc, sessions: 0, visits: 0, capacity: 0, lateCancels: 0 };
      }
      const g = grouped[key];
      g.sessions  += 1;
      g.visits    += Number(s.checkedInCount) || 0;
      g.capacity  += Number(s.capacity) || 0;
      g.lateCancels += Number(s.lateCancels) || 0;
    });
    return Object.values(grouped)
      .map(g => ({ ...g, fillRate: g.capacity > 0 ? (g.visits / g.capacity) * 100 : 0 }))
      .filter(g => g.sessions >= 2)
      .sort((a, b) => b.fillRate - a.fillRate)
      .slice(0, 15);
  }, [filteredSessions]);

  const funnelRankings = useMemo(() => {
    const leadLookup = new Map<string, any>();
    filteredLeads.forEach((lead) => {
      if (lead.memberId) leadLookup.set(`member:${lead.memberId}`, lead);
      if (lead.email) leadLookup.set(`email:${lead.email.toLowerCase()}`, lead);
    });

    const grouped = new Map<string, {
      name: string;
      leads: number;
      trials: number;
      converted: number;
      retained: number;
      visitsPostTrial: number;
      ltv: number;
      membershipsBought: number;
      uniqueMembers: Set<string>;
    }>();

    const getNameFromLead = (lead: any) => {
      if (funnelRankingDimension === 'source') return lead.source || 'Unknown';
      if (funnelRankingDimension === 'location') return lead.center || 'Unknown';
      if (funnelRankingDimension === 'stage') return lead.stage || 'Unknown';
      if (funnelRankingDimension === 'class') return lead.classType || 'Unknown';
      return 'Unknown';
    };

    filteredLeads.forEach((lead) => {
      const key = funnelRankingDimension === 'membership' ? 'Membership N/A' : getNameFromLead(lead);
      const current = grouped.get(key) || { name: key, leads: 0, trials: 0, converted: 0, retained: 0, visitsPostTrial: 0, ltv: 0, membershipsBought: 0, uniqueMembers: new Set<string>() };
      current.leads += 1;
      if ((lead.trialStatus || '').toLowerCase().match(/completed|trial|attended|booked/)) current.trials += 1;
      if (isLeadConverted(lead)) current.converted += 1;
      if (lead.memberId) current.uniqueMembers.add(lead.memberId);
      grouped.set(key, current);
    });

    filteredClients.forEach((client) => {
      const matchedLead = leadLookup.get(`member:${client.memberId}`) || leadLookup.get(`email:${client.email?.toLowerCase()}`);
      const key = funnelRankingDimension === 'membership'
        ? (client.membershipUsed || 'Unknown')
        : funnelRankingDimension === 'location'
          ? (client.firstVisitLocation || client.homeLocation || matchedLead?.center || 'Unknown')
          : funnelRankingDimension === 'class'
            ? (client.firstVisitEntityName || matchedLead?.classType || 'Unknown')
            : funnelRankingDimension === 'stage'
              ? (matchedLead?.stage || client.conversionStatus || 'Unknown')
              : (matchedLead?.source || 'Unknown');
      const current = grouped.get(key) || { name: key, leads: 0, trials: 0, converted: 0, retained: 0, visitsPostTrial: 0, ltv: 0, membershipsBought: 0, uniqueMembers: new Set<string>() };
      current.retained += client.retentionStatus === 'Retained' ? 1 : 0;
      current.visitsPostTrial += Number(client.visitsPostTrial) || 0;
      current.ltv += Number(client.ltv) || 0;
      current.membershipsBought += `${client.membershipsBoughtPostTrial || ''}`.trim() ? 1 : 0;
      if (client.memberId) current.uniqueMembers.add(client.memberId);
      grouped.set(key, current);
    });

    const rows = Array.from(grouped.values()).map((item) => ({
      ...item,
      uniqueMembers: item.uniqueMembers.size,
      conversionRate: item.leads ? (item.converted / item.leads) * 100 : 0,
      retentionRate: item.converted ? (item.retained / item.converted) * 100 : 0,
    })).sort((a, b) => {
      if (funnelChartMetric === 'converted') return b.converted - a.converted;
      if (funnelChartMetric === 'retained') return b.retained - a.retained;
      if (funnelChartMetric === 'ltv') return b.ltv - a.ltv;
      return b.leads - a.leads;
    });

    return {
      rows,
      top: rows.slice(0, funnelRankingCount),
      bottom: rows.slice(-funnelRankingCount).reverse(),
    };
  }, [filteredClients, filteredLeads, funnelChartMetric, funnelRankingDimension, funnelRankingCount]);

  const trainerRankingsExtended = useMemo(() => {
    const rows = trainerStats.all.map((trainer, index) => {
      const trainerPayroll = filteredPayroll.filter((item) => item.teacherName === trainer.name);
      const totalNew = trainerPayroll.reduce((sum, item) => sum + (Number(item.new) || 0), 0);
      const totalConverted = trainerPayroll.reduce((sum, item) => sum + (Number(item.converted) || 0), 0);
      const totalRetained = trainerPayroll.reduce((sum, item) => sum + (Number(item.retained) || 0), 0);
      const trainerLC = filteredLateCancels.filter((item) => (`${item.teacherName || item.instructor || ''}`).toLowerCase() === trainer.name.toLowerCase()).length;
      const trainerSessions = filteredSessions.filter((s) => (s.trainerName || '').toLowerCase() === trainer.name.toLowerCase());
      const totalAttended = trainerSessions.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
      const totalCapacity = trainerSessions.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
      const fillRate = totalCapacity > 0 ? (totalAttended / totalCapacity) * 100 : 0;
      const utilization = trainer.sessions > 0 ? (trainer.nonEmpty / trainer.sessions) * 100 : 0;
      const conversionRate = totalNew > 0 ? (totalConverted / totalNew) * 100 : 0;
      const retentionRate = totalConverted > 0 ? (totalRetained / totalConverted) * 100 : 0;
      // Composite score (0–100):
      //   30% fill rate — primary demand signal
      //   25% avg class attendance normalised to 15 pax benchmark
      //   20% empty-session penalty — share of sessions run with 0 attendees
      //   15% session volume (consistency) normalised to 30 sessions
      //   10% conversion rate (business impact)
      const emptySessions       = trainerSessions.filter((s) => (Number(s.checkedInCount) || 0) === 0).length;
      const emptyRate           = trainerSessions.length > 0 ? emptySessions / trainerSessions.length : 0;
      const emptyPenaltyScore   = (1 - emptyRate) * 100;
      const classAvgScore       = Math.min((trainer.classAvg / 15) * 100, 100);
      const sessionVolumeScore  = Math.min((trainer.sessions / 30) * 100, 100);
      const compositeScore =
        fillRate           * 0.30 +
        classAvgScore      * 0.25 +
        emptyPenaltyScore  * 0.20 +
        sessionVolumeScore * 0.15 +
        conversionRate     * 0.10;
      return { ...trainer, rank: index + 1, utilization, fillRate, conversionRate, retentionRate, totalNew, totalConverted, totalRetained, lateCancels: trainerLC, revenueScore: compositeScore };
    }).sort((a, b) => b.revenueScore - a.revenueScore);

    return { rows, top: rows.slice(0, 5), bottom: rows.slice(-5).reverse() };
  }, [filteredLateCancels, filteredPayroll, filteredSessions, trainerStats.all]);

  const salesCollapsedGroups = useMemo(() => {
    const groups = new Set<string>();
    sales.forEach((item) => {
      const category = item.cleanedCategory || 'Uncategorized';
      if (category) groups.add(category);
    });
    return groups;
  }, [sales]);

  const renderBulletSummary = (items: string[], columns: 1 | 2 = 1) => (
    <ul className={cn('space-y-1.5 text-sm text-slate-600', columns === 2 && 'grid gap-x-6 gap-y-2 md:grid-cols-2 md:space-y-0')}>
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

  /** AI-powered section summary — shows spinner while loading, then bullets. Supports inline editing. */
  const renderAISummary = (sectionKey: string, fallbackItems: string[], columns: 1 | 2 = 2) => {
    const s = getSummary(sectionKey);
    const loading = aiSectionLoading(sectionKey);
    const manualEdit = sectionEdits[sectionKey];
    const isEditing = editingSectionKey === sectionKey;
    const aiBullets = s ? s.bullets : (aiSummaryCacheOnly ? [] : fallbackItems);
    const displayBullets = manualEdit
      ? manualEdit.split('\n').map((l) => l.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean)
      : aiBullets;

    if (isEditing) {
      return (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <svg className="h-3.5 w-3.5 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-500">Editing summary · one bullet per line</span>
          </div>
          <textarea
            autoFocus
            className="w-full rounded-xl border border-violet-200 bg-white p-3 text-sm text-slate-700 placeholder-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
            rows={6}
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            placeholder="• Enter each bullet on its own line&#10;• Use • or - prefix or just plain text&#10;• Changes persist until AI is regenerated"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => saveSectionEdit(sectionKey, editDraft)}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition"
            >Save</button>
            <button
              onClick={() => setEditingSectionKey(null)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >Cancel</button>
            {manualEdit && (
              <button
                onClick={() => { clearSectionEdit(sectionKey); setEditingSectionKey(null); }}
                className="ml-auto rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
              >Clear manual edit</button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={`rounded-2xl border p-4 shadow-sm ${manualEdit ? 'border-violet-200 bg-violet-50/40' : 'border-slate-200 bg-slate-50/90'}`}>
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {loading ? 'Generating AI insights…' : manualEdit ? 'Manual summary · edited' : s ? `AI insights · generated ${new Date(s.lastGenerated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Summary'}
          </span>
          {loading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-200 border-t-purple-500 shrink-0" />}
          <button
            onClick={() => { setEditDraft(manualEdit || displayBullets.map((b) => `• ${b}`).join('\n')); setEditingSectionKey(sectionKey); }}
            title="Edit summary"
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 transition shrink-0"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          {manualEdit && (
            <button
              onClick={() => clearSectionEdit(sectionKey)}
              title="Clear manual edit, restore AI summary"
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition shrink-0"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
        {displayBullets.length > 0 ? renderBulletSummary(displayBullets, columns) : (
          <p className="text-sm text-slate-400">Click the pencil icon to add notes, or use the ✦ button to generate AI insights.</p>
        )}
      </div>
    );
  };

  const renderMatrixTable = (
    title: string,
    subtitle: string,
    months: string[],
    monthLabels: Record<string, string>,
    rows: SalesMetricsMatrixRow[],
    onCellClick: (row: SalesMetricsMatrixRow, month?: string) => void,
    rightAction?: React.ReactNode
  ) => (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-bold">{title}</h4>
              <p className="text-xs text-white/75">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/20 font-semibold text-white">
              {rows.length} metrics
            </Badge>
            {rightAction}
          </div>
        </div>
      </div>
      <div className="relative h-px w-full overflow-hidden bg-gradient-to-r from-transparent via-blue-400 to-transparent">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400" />
      </div>
      {months.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-30">
              <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <th className="sticky left-0 z-40 min-w-[280px] bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-white border-r border-white/20">
                  Metric
                </th>
                {months.map((month) => (
                  <th key={month} className={`min-w-[90px] border-l border-white/20 px-3 py-3 text-center text-xs font-bold uppercase tracking-wider ${month === activeMatrixMonthKey ? 'bg-blue-800 text-white' : 'text-white'}`}>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        {month === activeMatrixMonthKey ? <Star className="h-3 w-3" /> : null}
                        <span className="text-xs font-bold whitespace-nowrap">{monthLabels[month]?.split(' ')[0]}</span>
                      </div>
                      <span className={`text-xs ${month === activeMatrixMonthKey ? 'text-blue-100' : 'text-slate-300'}`}>{monthLabels[month]?.split(' ')[1]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {rows.map((row, rowIdx) => (
                <tr key={`${rowIdx}-${row.label}`} className="h-[35px] bg-white">
                  <td className="sticky left-0 z-10 min-w-[280px] border-b border-gray-200 bg-white px-4 py-2 font-medium leading-none text-slate-900 border-r border-gray-200">
                    <button type="button" className="w-full text-left hover:text-blue-700" onClick={() => onCellClick(row)}>
                      {row.label}
                    </button>
                  </td>
                  {months.map((month) => (
                    <td
                      key={`${row.label}-${month}`}
                      className="h-[35px] border-b border-gray-200 bg-white px-3 py-2 text-center leading-none tabular-nums text-slate-700 cursor-pointer hover:bg-slate-50"
                      onClick={() => onCellClick(row, month)}
                    >
                      {formatSalesMetricCell(row.values[month] || 0, row.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-5">
          <EmptyNote label="No monthly data available" />
        </div>
      )}
    </div>
  );

  const renderRankingList = (
    title: string,
    items: Array<Record<string, any>>,
    metricKey: string,
    valueFormatter: (value: number) => string,
    caption: (item: Record<string, any>) => string,
    isBottom = false
  ) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white ${isBottom ? 'bg-gradient-to-br from-slate-500 to-slate-700' : 'bg-gradient-to-br from-blue-700 to-slate-900'}`}>
          {isBottom ? <TrendingDown className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">Ranked by metric value</p>
        </div>
      </div>
      <div className="space-y-2">
        {items.length ? items.map((item, index) => (
          <div key={`${title}-${item.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <span className={cn('flex items-center justify-center w-7 h-7 rounded-lg text-white font-bold text-xs shrink-0 select-none', isBottom ? 'bg-gradient-to-br from-red-700 to-red-900' : 'bg-gradient-to-br from-blue-700 to-blue-900')}>{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{item.name}</p>
              <p className="text-xs text-slate-500">{caption(item)}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-950">{valueFormatter(Number(item[metricKey]) || 0)}</p>
            </div>
          </div>
        )) : <EmptyNote label="No ranking data available" />}
      </div>
    </div>
  );

  const { summary: aiSummary, loading: aiLoading, generate: generateAISummary, getSummary, isLoading: aiSectionLoading, refreshAll: refreshAllSummaries } = useStudioAISummary();
  const [insightOpen, setInsightOpen] = useState(false);
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownConfig, setDrillDownConfig] = useState<{ title: string; type: any; data: any; relatedData: any[] } | null>(null);
  const activeMatrixMonthKey = useMemo(() => getPreviousMonthKey(), []);

  // Front-face sparklines — date-filtered (show trend within selected range, same as before)
  const revenueSparkline = useMemo(() => salesStats.trend.map((point) => point.revenue), [salesStats.trend]);
  const revenueSparklineLabels = useMemo(() => salesStats.trend.map((point) => point.label), [salesStats.trend]);
  const attendanceSparkline = useMemo(() => sessionStats.trend.map((point) => point.attendance), [sessionStats.trend]);
  const attendanceSparklineLabels = useMemo(() => sessionStats.trend.map((point) => point.label), [sessionStats.trend]);
  const fillSparkline = useMemo(() => sessionStats.trend.map((point) => point.fill), [sessionStats.trend]);
  const lateCancelSparkline = useMemo(() => {
    const monthly: Record<string, number> = {};
    filteredLateCancels.forEach((item) => {
      const key = monthKeyFromDate(item.dateIST || item.sessionDateIST);
      if (key) monthly[key] = (monthly[key] || 0) + 1;
    });
    return Object.keys(monthly).sort().map((key) => monthly[key]);
  }, [filteredLateCancels]);

  const unitsSoldSparkline = useMemo(() => {
    const monthly: Record<string, number> = {};
    filteredSales.forEach((d) => {
      const mk = monthKeyFromDate(d.paymentDate);
      if (mk) monthly[mk] = (monthly[mk] || 0) + 1;
    });
    return Object.keys(monthly).sort().map((k) => monthly[k]);
  }, [filteredSales]);

  const uniqueMembersSparkline = useMemo(() => {
    const monthly: Record<string, Set<string>> = {};
    filteredSales.forEach((d) => {
      const mk = monthKeyFromDate(d.paymentDate);
      if (!mk) return;
      if (!monthly[mk]) monthly[mk] = new Set();
      if (d.memberId || d.customerEmail) monthly[mk].add(String(d.memberId || d.customerEmail));
    });
    return Object.keys(monthly).sort().map((k) => monthly[k].size);
  }, [filteredSales]);

  const lapsedCountSparkline = useMemo(() => {
    const monthly: Record<string, number> = {};
    filteredExpirations.forEach((d) => {
      const mk = monthKeyFromDate(d.endDate);
      if (mk) monthly[mk] = (monthly[mk] || 0) + 1;
    });
    return Object.keys(monthly).sort().map((k) => monthly[k]);
  }, [filteredExpirations]);

  const lapsedCountSparklineLabels = useMemo(() => {
    const monthly: Record<string, number> = {};
    filteredExpirations.forEach((d) => { const mk = monthKeyFromDate(d.endDate); if (mk) monthly[mk] = 1; });
    return Object.keys(monthly).sort().map((k) => monthLabel(k));
  }, [filteredExpirations]);

  // Back-face sparklines — all-time (not date-filtered) so flip shows real 12-month history
  const backRevenueSparkline = useMemo(() => {
    const monthly: Record<string, number> = {};
    studioWideSales.forEach((d) => {
      const mk = monthKeyFromDate(d.paymentDate);
      if (mk) monthly[mk] = (monthly[mk] || 0) + ((Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0));
    });
    return Object.keys(monthly).sort().map((k) => Math.round(monthly[k]));
  }, [studioWideSales]);
  const backRevenueSparklineLabels = useMemo(() => {
    const monthly: Record<string, number> = {};
    studioWideSales.forEach((d) => { const mk = monthKeyFromDate(d.paymentDate); if (mk) monthly[mk] = 1; });
    return Object.keys(monthly).sort().map((k) => monthLabel(k));
  }, [studioWideSales]);
  const backAttendanceSparkline = useMemo(() => {
    const monthly: Record<string, number> = {};
    studioWideSessions.forEach((s) => {
      const mk = monthKeyFromDate(s.date);
      if (mk) monthly[mk] = (monthly[mk] || 0) + (Number(s.checkedInCount) || 0);
    });
    return Object.keys(monthly).sort().map((k) => monthly[k]);
  }, [studioWideSessions]);
  const backAttendanceSparklineLabels = useMemo(() => {
    const monthly: Record<string, number> = {};
    studioWideSessions.forEach((s) => { const mk = monthKeyFromDate(s.date); if (mk) monthly[mk] = 1; });
    return Object.keys(monthly).sort().map((k) => monthLabel(k));
  }, [studioWideSessions]);
  const backFillSparkline = useMemo(() => {
    const monthly: Record<string, { att: number; cap: number }> = {};
    studioWideSessions.forEach((s) => {
      const mk = monthKeyFromDate(s.date);
      if (mk) {
        monthly[mk] = monthly[mk] || { att: 0, cap: 0 };
        monthly[mk].att += Number(s.checkedInCount) || 0;
        monthly[mk].cap += Number(s.capacity) || 0;
      }
    });
    return Object.keys(monthly).sort().map((k) => monthly[k].cap > 0 ? Math.round((monthly[k].att / monthly[k].cap) * 100) : 0);
  }, [studioWideSessions]);
  const backLateCancelSparkline = useMemo(() => {
    const monthly: Record<string, number> = {};
    studioWideLateCancels.forEach((item) => {
      const key = monthKeyFromDate(item.dateIST || item.sessionDateIST);
      if (key) monthly[key] = (monthly[key] || 0) + 1;
    });
    return Object.keys(monthly).sort().map((key) => monthly[key]);
  }, [studioWideLateCancels]);

  const backUnitsSoldSparkline = useMemo(() => {
    const monthly: Record<string, number> = {};
    studioWideSales.forEach((d) => {
      const mk = monthKeyFromDate(d.paymentDate);
      if (mk) monthly[mk] = (monthly[mk] || 0) + 1;
    });
    return Object.keys(monthly).sort().map((k) => monthly[k]);
  }, [studioWideSales]);

  const backUniqueMembersSparkline = useMemo(() => {
    const monthly: Record<string, Set<string>> = {};
    studioWideSales.forEach((d) => {
      const mk = monthKeyFromDate(d.paymentDate);
      if (!mk) return;
      if (!monthly[mk]) monthly[mk] = new Set();
      if (d.memberId || d.customerEmail) {
        monthly[mk].add(String(d.memberId || d.customerEmail));
      }
    });
    return Object.keys(monthly).sort().map((k) => monthly[k].size);
  }, [studioWideSales]);

  // Back sparklines for the 4 new overview cards (all-time, studio-wide)
  const backDiscountEfficiencySparkline = useMemo(() => {
    const monthly: Record<string, { disc: number; net: number }> = {};
    studioWideSales.forEach((s) => {
      const mk = monthKeyFromDate(s.paymentDate);
      if (!mk) return;
      if (!monthly[mk]) monthly[mk] = { disc: 0, net: 0 };
      const disc = Number(s.discountAmount) || 0;
      if (disc > 0) {
        monthly[mk].disc += disc;
        monthly[mk].net += (Number(s.paymentValue) || 0) - (Number(s.paymentVAT) || 0);
      }
    });
    return Object.keys(monthly).sort().map((k) => monthly[k].disc > 0 ? monthly[k].net / monthly[k].disc : 0);
  }, [studioWideSales]);

  const backPackageSellThroughSparkline = useMemo(() => {
    const monthly: Record<string, { total: number; used: number }> = {};
    studioWideSales.filter((s) => /pack|package/i.test(s.cleanedProduct || s.cleanedCategory || '')).forEach((s) => {
      const mk = monthKeyFromDate(s.paymentDate);
      if (!mk) return;
      if (!monthly[mk]) monthly[mk] = { total: 0, used: 0 };
      const t = Number(s.secMembershipTotalClasses) || 0;
      const u = Number(s.secMembershipUsedSessions) || (t > 0 ? t - (Number(s.secMembershipClassesLeft) || 0) : 0);
      if (t > 0) { monthly[mk].total += t; monthly[mk].used += u; }
    });
    return Object.keys(monthly).sort().map((k) => monthly[k].total > 0 ? (monthly[k].used / monthly[k].total) * 100 : 0);
  }, [studioWideSales]);

  const backRepeatPurchaseSparkline = useMemo(() => {
    const monthly: Record<string, Record<string, number>> = {};
    studioWideSales.forEach((s) => {
      const mk = monthKeyFromDate(s.paymentDate);
      if (!mk || !s.memberId) return;
      if (!monthly[mk]) monthly[mk] = {};
      monthly[mk][s.memberId] = (monthly[mk][s.memberId] || 0) + 1;
    });
    return Object.keys(monthly).sort().map((k) => {
      const counts = Object.values(monthly[k]);
      const total = counts.length;
      return total > 0 ? (counts.filter((n) => n > 1).length / total) * 100 : 0;
    });
  }, [studioWideSales]);

  const backAvgOrderValueSparkline = useMemo(() => {
    const monthly: Record<string, { sum: number; count: number }> = {};
    studioWideSales.forEach((s) => {
      const mk = monthKeyFromDate(s.paymentDate);
      if (!mk) return;
      if (!monthly[mk]) monthly[mk] = { sum: 0, count: 0 };
      monthly[mk].sum += Number(s.paymentValue) || 0;
      monthly[mk].count += 1;
    });
    return Object.keys(monthly).sort().map((k) => monthly[k].count > 0 ? monthly[k].sum / monthly[k].count : 0);
  }, [studioWideSales]);

  const backLapsedMembersSparkline = useMemo(() => {
    const studioWideExpirations = expirations.filter((item) => inStudio(item.primaryLocation || item.homeLocation, studio));
    const monthly: Record<string, number> = {};
    studioWideExpirations.forEach((d) => {
      const mk = monthKeyFromDate(d.endDate);
      if (mk) monthly[mk] = (monthly[mk] || 0) + 1;
    });
    return Object.keys(monthly).sort().map((k) => monthly[k]);
  }, [expirations, studio]);

  const backRevenuePerVisitSparkline = useMemo(() => {
    const monthlySales: Record<string, number> = {};
    const monthlyVisits: Record<string, number> = {};
    studioWideSales.forEach((d) => {
      const mk = monthKeyFromDate(d.paymentDate);
      if (mk) monthlySales[mk] = (monthlySales[mk] || 0) + ((Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0));
    });
    studioWideSessions.forEach((s) => {
      const mk = monthKeyFromDate(s.date);
      if (mk) monthlyVisits[mk] = (monthlyVisits[mk] || 0) + (Number(s.checkedInCount) || 0);
    });
    const allKeys = Array.from(new Set([...Object.keys(monthlySales), ...Object.keys(monthlyVisits)])).sort();
    return allKeys.map((k) => {
      const visits = monthlyVisits[k] || 0;
      const sales = monthlySales[k] || 0;
      return visits > 0 ? Math.round(sales / visits) : 0;
    });
  }, [studioWideSales, studioWideSessions]);

  const backClientMonthKeys = useMemo(() => {
    const keys = new Set<string>();
    studioWideClients.forEach((c) => { const mk = monthKeyFromDate(c.firstVisitDate); if (mk) keys.add(mk); });
    return [...keys].sort();
  }, [studioWideClients]);
  const backClientSparklineLabels = useMemo(() => backClientMonthKeys.map((k) => monthLabel(k)), [backClientMonthKeys]);
  const backNewClientSparkline = useMemo(() => {
    const monthly: Record<string, number> = {};
    studioWideClients.filter((c) => isInNewClientCohort(c)).forEach((c) => {
      const mk = monthKeyFromDate(c.firstVisitDate); if (mk) monthly[mk] = (monthly[mk] || 0) + 1;
    });
    return backClientMonthKeys.map((k) => monthly[k] || 0);
  }, [studioWideClients, backClientMonthKeys]);
  const backConvertedSparkline = useMemo(() => {
    const monthly: Record<string, number> = {};
    studioWideClients.filter((c) => isConvertedInCohort(c)).forEach((c) => {
      const mk = monthKeyFromDate(c.firstVisitDate); if (mk) monthly[mk] = (monthly[mk] || 0) + 1;
    });
    return backClientMonthKeys.map((k) => monthly[k] || 0);
  }, [studioWideClients, backClientMonthKeys]);
  const backRetainedSparkline = useMemo(() => {
    const monthly: Record<string, number> = {};
    studioWideClients.filter((c) => isRetainedInCohort(c)).forEach((c) => {
      const mk = monthKeyFromDate(c.firstVisitDate); if (mk) monthly[mk] = (monthly[mk] || 0) + 1;
    });
    return backClientMonthKeys.map((k) => monthly[k] || 0);
  }, [studioWideClients, backClientMonthKeys]);

  const backSessionsSparkline = useMemo(() => {
    const monthly: Record<string, number> = {};
    studioWideSessions.forEach((s) => {
      const mk = monthKeyFromDate(s.date);
      if (mk) monthly[mk] = (monthly[mk] || 0) + 1;
    });
    return Object.keys(monthly).sort().map((k) => monthly[k]);
  }, [studioWideSessions]);

  const backClassAvgSparkline = useMemo(() => {
    const monthly: Record<string, { att: number; sessions: number }> = {};
    studioWideSessions.forEach((s) => {
      const mk = monthKeyFromDate(s.date);
      const att = Number(s.checkedInCount) || 0;
      if (mk && att > 0) {
        monthly[mk] = monthly[mk] || { att: 0, sessions: 0 };
        monthly[mk].att += att;
        monthly[mk].sessions += 1;
      }
    });
    return Object.keys(monthly).sort().map((k) => monthly[k].sessions > 0 ? Math.round(monthly[k].att / monthly[k].sessions * 10) / 10 : 0);
  }, [studioWideSessions]);

  const openMetricDrillDown = useCallback((title: string, type: any, data: any, relatedData: any[]) => {
    setDrillDownConfig({ title, type, data, relatedData });
    setDrillDownOpen(true);
  }, []);

  const openSalesMatrixDrillDown = useCallback((row: SalesMetricsMatrixRow, month?: string) => {
    const baseRows = month
      ? studioWideSales.filter((item) => monthKeyFromDate(item.paymentDate) === month)
      : studioWideSales;

    const normalizedLabel = row.label.toLowerCase();
    const filteredRows = baseRows.filter((item) => {
      const category = (item.cleanedCategory || '').toLowerCase();
      const membershipType = (item.membershipType || '').toLowerCase();
      const productText = `${item.paymentItem || ''} ${item.cleanedProduct || ''}`.toLowerCase();
      const soldBy = (item.soldBy || '').toLowerCase();
      const hasDiscount = (Number(item.discountAmount) || 0) > 0 || (Number(item.discountPercentage) || 0) > 0;

      if (normalizedLabel === 'package sales') return category.includes('package');
      if (normalizedLabel === 'retail sales') return category.includes('retail');
      if (normalizedLabel === 'membership sales') return membershipType.includes('member') || category.includes('member');
      if (normalizedLabel === 'drop-in sales') return productText.includes('drop') || productText.includes('single') || productText.includes('trial');
      if (normalizedLabel === 'online / system sales') return !soldBy || soldBy === '-' || soldBy.includes('online') || soldBy.includes('system');
      if (normalizedLabel === 'discounted transactions' || normalizedLabel === 'discount penetration' || normalizedLabel === 'discount value') return hasDiscount;
      if (normalizedLabel === 'promo-led sales') return !!item.isPromotional || hasDiscount;
      return true;
    });

    const contextMonthLabel = month ? salesMetricsMatrix.monthLabels[month] : 'All Months';
    openMetricDrillDown(
      `${row.label} • ${contextMonthLabel}`,
      salesMetricTypeMap[row.label] || 'metric',
      {
        name: row.label,
        rawData: filteredRows,
        filteredTransactionData: filteredRows,
        selectedMetric: row.label,
        metricValue: month ? row.values[month] || 0 : Object.values(row.values).reduce((sum, value) => sum + value, 0),
        drillDownContext: month ? 'studio-pulse-sales-matrix-month' : 'studio-pulse-sales-matrix-row',
        filterCriteria: month ? { month, metric: row.label } : { metric: row.label },
        contextDescription: month
          ? `${row.label} for ${activeStudio.name} in ${contextMonthLabel}: ${formatSalesMetricCell(row.values[month] || 0, row.type)}`
          : `${row.label} for ${activeStudio.name} across the full available sales history`,
      },
      filteredRows
    );
  }, [activeStudio.name, openMetricDrillDown, salesMetricsMatrix.monthLabels, studioWideSales]);

  const salesSellerSummary = useMemo(() => {
    const bySeller = studioWideSales.reduce<Record<string, number>>((acc, item) => {
      const seller = item.soldBy === '-' ? 'Online/System' : (item.soldBy || 'Online/System');
      acc[seller] = (acc[seller] || 0) + ((Number(item.paymentValue) || 0) - (Number(item.paymentVAT) || 0));
      return acc;
    }, {});
    const ranked = Object.entries(bySeller).sort((a, b) => b[1] - a[1]);
    const top = ranked[0];
    const second = ranked[1];
    const total = ranked.reduce((sum, [, value]) => sum + value, 0);
    return {
      topName: top?.[0] || 'N/A',
      topValue: top?.[1] || 0,
      gap: top && second ? top[1] - second[1] : top?.[1] || 0,
      share: total > 0 && top ? (top[1] / total) * 100 : 0,
    };
  }, [studioWideSales]);

  const matrixSummaryStats = useMemo(() => {
    const latestMonth = salesMetricsMatrix.months[0];
    const latestNet = latestMonth ? salesMetricsMatrix.metricRows.find((row) => row.label === 'Net Sales')?.values[latestMonth] || 0 : 0;
    const latestAtv = latestMonth ? salesMetricsMatrix.metricRows.find((row) => row.label === 'Average Transaction Value')?.values[latestMonth] || 0 : 0;
    const latestDiscount = latestMonth ? salesMetricsMatrix.metricRows.find((row) => row.label === 'Discount Penetration')?.values[latestMonth] || 0 : 0;
    return {
      latestMonth: latestMonth ? salesMetricsMatrix.monthLabels[latestMonth] : 'N/A',
      latestNet,
      latestAtv,
      latestDiscount,
    };
  }, [salesMetricsMatrix]);

  const locationSummary = useMemo(() => {
    const sections = [
      `Net sales closed at ${formatCurrency(salesStats.net)} across ${formatNumber(salesStats.txns)} transactions.`,
      `Unique members reached ${formatNumber(salesStats.members)} while attendance totaled ${formatNumber(sessionStats.attendance)} across ${formatNumber(sessionStats.totalSessions)} sessions.`,
      `Fill rate averaged ${formatPercentage(sessionStats.avgFill)} and late cancellations totaled ${formatNumber(lcStats.total)}.`,
    ];
    return {
      title: `${activeStudio.name} performance summary`,
      subtitle: `${activeStudio.area} · ${dateRange.start} to ${dateRange.end}`,
      badge: `${studio === 'all' ? 'All studios' : activeStudio.name}`,
      stats: [
        { label: 'Net Sales', value: formatCurrency(salesStats.net) },
        { label: 'Sessions', value: formatNumber(sessionStats.totalSessions) },
        { label: 'Members', value: formatNumber(salesStats.members) },
        { label: 'Late Cancels', value: formatNumber(lcStats.total) },
      ],
      sections: [
        { title: 'Sales readout', bullets: [sections[0], `Discounts applied: ${formatCurrency(salesStats.discount)}.`] },
        { title: 'Operations readout', bullets: [sections[1], sections[2]] },
      ],
    };
  }, [activeStudio, dateRange.end, dateRange.start, lcStats.total, salesStats.discount, salesStats.members, salesStats.net, salesStats.txns, sessionStats.attendance, sessionStats.avgFill, sessionStats.totalSessions, studio]);

  const sharedMetrics = useMemo(() => ({
    netSales: formatCurrency(salesStats.net),
    grossSales: formatCurrency(salesStats.gross),
    transactions: salesStats.txns,
    uniqueMembers: salesStats.members,
    totalSessions: sessionStats.totalSessions,
    attendance: sessionStats.attendance,
    avgFill: formatPercentage(sessionStats.avgFill),
    lateCancels: lcStats.total,
    lapsed: expirationStats.total,
    churned: expirationStats.churned,
    newClients: clientStats.newClients,
    converted: clientStats.converted,
    retained: clientStats.retained,
    conversionRate: formatPercentage(clientStats.conversionRate),
    retentionRate: formatPercentage(clientStats.retentionRate),
    momNetSales: salesStats.growth.net,
    yoyNetSales: salesStats.yoyGrowth.net,
  }), [salesStats, sessionStats, lcStats, expirationStats, clientStats]);

  const monthlyInsight = (() => {
    const monthBuckets = new Map<string, {
      sales: number;
      sessions: number;
      attendance: number;
      capacity: number;
      leads: number;
      clients: number;
      converted: number;
      retained: number;
      ltc: number;
      expirations: number;
    }>();

    const ensureMonth = (key: string) => {
      if (!monthBuckets.has(key)) {
        monthBuckets.set(key, {
          sales: 0,
          sessions: 0,
          attendance: 0,
          capacity: 0,
          leads: 0,
          clients: 0,
          converted: 0,
          retained: 0,
          ltc: 0,
          expirations: 0,
        });
      }
      return monthBuckets.get(key)!;
    };

    filteredSales.forEach((row) => {
      const key = monthKeyFromDate(row.paymentDate);
      if (!key) return;
      ensureMonth(key).sales += (Number(row.paymentValue) || 0) - (Number(row.paymentVAT) || 0);
    });
    filteredSessions.forEach((row) => {
      const key = monthKeyFromDate(row.date);
      if (!key) return;
      const bucket = ensureMonth(key);
      bucket.sessions += 1;
      bucket.attendance += Number(row.checkedInCount) || 0;
      bucket.capacity += Number(row.capacity) || 0;
    });
    filteredLeads.forEach((row) => {
      const key = monthKeyFromDate(row.createdAt);
      if (!key) return;
      ensureMonth(key).leads += 1;
    });
    filteredClients.forEach((row) => {
      const key = monthKeyFromDate(row.firstVisitDate);
      if (!key) return;
      const bucket = ensureMonth(key);
      bucket.clients += 1;
      bucket.converted += isConvertedInCohort(row) ? 1 : 0;
      bucket.retained += isRetainedInCohort(row) ? 1 : 0;
    });
    filteredLateCancels.forEach((row) => {
      const key = monthKeyFromDate(row.dateIST || row.sessionDateIST);
      if (!key) return;
      ensureMonth(key).ltc += 1;
    });
    filteredExpirations.forEach((row) => {
      const key = monthKeyFromDate(row.endDate);
      if (!key) return;
      ensureMonth(key).expirations += 1;
    });

    const months = Array.from(monthBuckets.keys()).sort().slice(-12);
    const latestMonth = months[months.length - 1] || monthKeyFromDate(dateRange.end) || monthKeyFromDate(dateRange.start) || '';
    const current = latestMonth ? ensureMonth(latestMonth) : null;
    const previous = months.length > 1 ? ensureMonth(months[months.length - 2]) : null;

    return {
      months,
      latestMonth,
      latestMonthLabel: latestMonth ? monthLabel(latestMonth) : 'N/A',
      trend: months.map((month) => {
        const value = ensureMonth(month);
        return {
          month,
          label: monthLabel(month),
          sales: value.sales,
          sessions: value.sessions,
          attendance: value.attendance,
          capacity: value.capacity,
          fillRate: value.capacity > 0 ? (value.attendance / value.capacity) * 100 : 0,
          leads: value.leads,
          clients: value.clients,
          converted: value.converted,
          retained: value.retained,
          ltc: value.ltc,
          expirations: value.expirations,
        };
      }),
      current: current && latestMonth ? {
        month: latestMonth,
        sales: current.sales,
        sessions: current.sessions,
        attendance: current.attendance,
        capacity: current.capacity,
        fillRate: current.capacity > 0 ? (current.attendance / current.capacity) * 100 : 0,
        leads: current.leads,
        clients: current.clients,
        converted: current.converted,
        retained: current.retained,
        ltc: current.ltc,
        expirations: current.expirations,
      } : null,
      previous: previous ? {
        month: months[months.length - 2],
        sales: previous.sales,
        sessions: previous.sessions,
        attendance: previous.attendance,
        capacity: previous.capacity,
        fillRate: previous.capacity > 0 ? (previous.attendance / previous.capacity) * 100 : 0,
        leads: previous.leads,
        clients: previous.clients,
        converted: previous.converted,
        retained: previous.retained,
        ltc: previous.ltc,
        expirations: previous.expirations,
      } : null,
    };
  })();

  const buildSummaryInput = useCallback((sectionKey: string, sectionContext?: string) => ({
    studioName: activeStudio.name,
    dateRange,
    metrics: sharedMetrics,
    sectionKey,
    sectionContext,
  }), [activeStudio.name, dateRange, sharedMetrics]);

  const openAIPanel = useCallback((sectionKey: string, title: string, context?: string) => {
    setAIPanel({ open: true, sectionKey, title });
    if (!getSummary(sectionKey) && !aiSectionLoading(sectionKey)) {
      generateAISummary(buildSummaryInput(sectionKey, context));
    }
  }, [getSummary, aiSectionLoading, generateAISummary, buildSummaryInput]);

  // Build rich section contexts — memoised so they update when data changes
  const sectionContexts = useMemo(() => {
    const topTrainers = [...trainerRankingsExtended.rows].sort((a, b) => b.paid - a.paid).slice(0, 3);
    const botTrainers = [...trainerRankingsExtended.rows].sort((a, b) => a.utilization - b.utilization).slice(0, 3);
    const topLapsed = lapsedByMembership.slice(0, 3);
    const topSessions = [...sessionIntelligence.rows].sort((a, b) => b.classAvg - a.classAvg).slice(0, 3);
    const botSessions = [...sessionIntelligence.rows].sort((a, b) => a.fillRate - b.fillRate).slice(0, 3);
    const topSalesRows = [...salesMetricsMatrix.metricRows].slice(0, 3);
    const topFunnelRows = [...funnelRankings.rows].slice(0, 3);
    const bottomFunnelRows = [...funnelRankings.rows].slice(-3).reverse();
    const topCapacityRows = [...capacityByStudio].sort((a, b) => b.utilization - a.utilization).slice(0, 3);
    const heatmapPeak = (() => {
      let peakSlot = '';
      let peakDay = '';
      let peakValue = 0;
      peakHourHeatmap.timeSlots.forEach((slot) => {
        peakHourHeatmap.days.forEach((day) => {
          const v = peakHourHeatmap.buckets[slot]?.[day]?.fillRate ?? 0;
          if (v > peakValue) {
            peakValue = v;
            peakSlot = slot;
            peakDay = day;
          }
        });
      });
      return { peakSlot, peakDay, peakValue };
    })();

    return {
      sales: [
        `Gross ${formatCurrency(salesStats.gross)} → Net ${formatCurrency(salesStats.net)} (${salesStats.gross > 0 ? ((salesStats.net / salesStats.gross) * 100).toFixed(1) : 0}% net margin after VAT)`,
        `ATV ${formatCurrency(salesStats.atv)} · Discount penetration ${formatPercentage(salesStats.discountPenetration)} · Total discount value ${formatCurrency(salesStats.discount)}`,
        `Transactions ${formatNumber(salesStats.txns)} · Unique buyers ${formatNumber(salesStats.members)} · Sales/member ${formatCurrency(salesStats.members > 0 ? salesStats.net / salesStats.members : 0)}`,
        salesStats.growth.net !== null ? `Net sales MoM: ${salesStats.growth.net > 0 ? '+' : ''}${salesStats.growth.net.toFixed(1)}%` : 'MoM comparison unavailable',
      ].join('\n'),
      salesMatrix: [
        `Latest month ${matrixSummaryStats.latestMonth} net sales ${formatCurrency(matrixSummaryStats.latestNet)} · ATV ${formatCurrency(matrixSummaryStats.latestAtv)} · discount penetration ${formatPercentage(matrixSummaryStats.latestDiscount)}`,
        `The matrix is reading the full available sales history for ${activeStudio.name} and is not limited by the visible date filter.`,
        topSalesRows.length ? `Leading matrix rows: ${topSalesRows.map((row) => `${row.label}`).join(' | ')}` : '',
      ].filter(Boolean).join('\n'),
      salesMom: [
        `${showMomTable ? 'Month-on-month table is expanded' : 'Month-on-month table is collapsed'} for category and product movement.`,
        `The newest visible month is highlighted, making month-to-month deltas easy to inspect without changing the underlying filter scope.`,
        `Use the table to compare absolute sales mix shifts, not just growth percentages.`,
      ].join('\n'),
      salesRankings: [
        `${salesSellerSummary.topName} leads current seller performance with ${formatPercentage(salesSellerSummary.share)} of displayed sales.`,
        `The lead over the next seller is ${formatCurrency(salesSellerSummary.gap)}.`,
        `Concentration risk becomes material when one seller exceeds about 40% of displayed sales.`,
      ].join('\n'),
      salesMix: [
        `Product mix shift is comparing memberships, packages, intro offers, and single classes across months.`,
        `The chart is useful for seeing whether acquisition is moving toward longer-duration value or shorter one-off purchases.`,
        `Watch for a rising share of single classes when membership conversion softens.`,
      ].join('\n'),

      funnel: [
        `${clientStats.newClients} new clients entered funnel · ${clientStats.converted} converted (${formatPercentage(clientStats.conversionRate)}) · ${clientStats.retained} retained (${formatPercentage(clientStats.retentionRate)})`,
        `Avg LTV post-trial: ${formatCurrency(clientStats.avgLtv)}`,
        `Conversion gap: ${formatNumber(clientStats.newClients - clientStats.converted)} new clients did NOT convert`,
        `Retention gap: ${formatNumber(clientStats.converted - clientStats.retained)} converted clients did NOT retain`,
        clientStats.conversionRate > 0 && clientStats.retentionRate > 0
          ? `Retention-to-conversion ratio: ${(clientStats.retentionRate / clientStats.conversionRate * 100).toFixed(0)}% of converters retained`
          : '',
      ].filter(Boolean).join('\n'),
      funnelOverview: [
        `${clientStats.newClients} newcomers entered the funnel and ${clientStats.converted} converted.`,
        `The biggest gap is ${formatNumber(clientStats.newClients - clientStats.converted)} members who entered but did not convert.`,
        `Avg LTV is ${formatCurrency(clientStats.avgLtv)}, so every conversion gap has direct revenue impact.`,
      ].join('\n'),
      funnelRankings: [
        topFunnelRows.length ? `Top funnel segments: ${topFunnelRows.map((row) => `${row.name} (${formatPercentage(row.conversionRate)} conv, ${formatPercentage(row.retentionRate)} ret, ${formatCurrency(row.ltv)} LTV)`).join(' | ')}` : '',
        bottomFunnelRows.length ? `Bottom funnel segments: ${bottomFunnelRows.map((row) => `${row.name} (${formatPercentage(row.conversionRate)} conv, ${formatPercentage(row.retentionRate)} ret)`).join(' | ')}` : '',
        `Use the ranking lists to identify which sources are producing retained revenue, not just trial volume.`,
      ].filter(Boolean).join('\n'),

      trainers: [
        `${trainerRankingsExtended.rows.length} trainers in period`,
        topTrainers.length ? `Top 3 by pay: ${topTrainers.map((t) => `${t.name} ${formatCurrency(t.paid)} (${formatNumber(t.sessions)} cls, ${formatPercentage(t.utilization)} fill)`).join(' | ')}` : '',
        botTrainers.length ? `Bottom 3 fill rate: ${botTrainers.map((t) => `${t.name} ${formatPercentage(t.utilization)} fill`).join(' | ')}` : '',
        `Studio avg fill ${formatPercentage(sessionStats.avgFill)} · Total late cancels ${formatNumber(lcStats.total)}`,
        `Total trainer pay: ${formatCurrency(trainerRankingsExtended.rows.reduce((s, r) => s + r.paid, 0))}`,
      ].filter(Boolean).join('\n'),
      trainerScorecard: [
        `${trainerRankingsExtended.rows.length} trainers are in the scorecard, and the top earner is ${trainerRankingsExtended.rows[0]?.name || 'N/A'}.`,
        `Compare pay, fill, and conversion together so the highest-paid trainer is not treated as automatically highest-performing.`,
        `The most useful gap is between sessions delivered and fill rate, not just raw attendance.`,
      ].join('\n'),
      trainerEfficiency: [
        topTrainers.length ? `Top pay performers: ${topTrainers.map((t) => `${t.name} ${formatPercentage(t.utilization)} fill · ${formatCurrency(t.paid)}`).join(' | ')}` : '',
        botTrainers.length ? `Lowest utilization performers: ${botTrainers.map((t) => `${t.name} ${formatPercentage(t.utilization)} fill`).join(' | ')}` : '',
        `Efficiency view should be read against the studio average fill of ${formatPercentage(sessionStats.avgFill)}.`,
      ].filter(Boolean).join('\n'),

      lapsed: [
        `${expirationStats.total} lapsed · ${expirationStats.churned} churned · churn rate ${expirationStats.total ? ((expirationStats.churned / expirationStats.total) * 100).toFixed(1) : 0}%`,
        topLapsed.length ? `Top 3 lapsing memberships: ${topLapsed.map((m) => `${m.name} (${m.count})`).join(', ')}` : '',
        `Late cancellations: ${lcStats.total} total · ${lcStats.sameDay} same-day · ${formatCurrency(lcStats.penalty)} penalty revenue`,
        `Late cancel same-day rate: ${lcStats.total > 0 ? ((lcStats.sameDay / lcStats.total) * 100).toFixed(0) : 0}% of LCs are same-day`,
        expirationStats.momGrowth !== null ? `Lapsed MoM: ${expirationStats.momGrowth > 0 ? '+' : ''}${expirationStats.momGrowth.toFixed(1)}%` : '',
      ].filter(Boolean).join('\n'),
      lapsedTrend: [
        `${expirationStats.total} expirations and ${expirationStats.churned} churned members are visible in the current window.`,
        `Same-day late cancels account for ${lcStats.total > 0 ? ((lcStats.sameDay / lcStats.total) * 100).toFixed(0) : 0}% of cancellations, which is the immediate revenue-loss pressure point.`,
        `The most common lapse memberships are ${topLapsed.map((m) => `${m.name} (${m.count})`).join(', ')}.`,
      ].join('\n'),
      lapsedTable: [
        `The lapse table should be used to prioritize outreach by membership type, days active, and session usage percentage.`,
        `Early exits with low session usage are the clearest churn-rescue candidates.`,
        `Penalty revenue of ${formatCurrency(lcStats.penalty)} gives the near-term cash impact of cancellation behavior.`,
      ].join('\n'),

      attendance: [
        `${sessionStats.totalSessions} sessions · ${sessionStats.attendance} visits · ${formatPercentage(sessionStats.avgFill)} avg fill · ${formatPercentage(sessionStats.emptyShare)} empty-class rate`,
        `Avg class size (all): ${(sessionStats.totalSessions > 0 ? sessionStats.attendance / sessionStats.totalSessions : 0).toFixed(1)} · Avg class size (non-empty): ${sessionStats.classAvg.toFixed(1)}`,
        topSessions.length ? `Top 3 classes by avg size: ${topSessions.map((r) => `${r.name} (avg ${r.classAvg.toFixed(1)}, ${formatPercentage(r.fillRate)} fill)`).join(' | ')}` : '',
        botSessions.length ? `Bottom 3 by fill rate: ${botSessions.map((r) => `${r.name} (${formatPercentage(r.fillRate)} fill, ${r.sessions} cls)`).join(' | ')}` : '',
        `Late cancels ${lcStats.total} · Rev/visit ${formatCurrency(sessionStats.attendance > 0 ? salesStats.net / sessionStats.attendance : 0)}`,
      ].filter(Boolean).join('\n'),
      attendanceHeatmap: [
        `Peak heatmap cell is ${heatmapPeak.peakSlot} on ${heatmapPeak.peakDay} at ${formatPercentage(heatmapPeak.peakValue)} fill rate.`,
        `The heatmap shows where demand clusters across the week instead of averaging out the signal.`,
        `Use this to move capacity into the strongest day-and-hour combinations.`,
      ].join('\n'),
      attendanceCapacity: [
        topCapacityRows.length ? `Highest utilization locations: ${topCapacityRows.map((row) => `${row.location} (${row.utilization.toFixed(1)}%)`).join(' | ')}` : '',
        `Booked ${formatNumber(sessionStats.attendance)} against ${formatNumber(sessionStats.totalSessions)} sessions and ${formatNumber(sessionStats.totalSessions > 0 ? sessionStats.attendance / sessionStats.totalSessions : 0)} avg all-session attendance.`,
        `Capacity should be read as utilization quality, not just raw headcount.`,
      ].filter(Boolean).join('\n'),
      attendanceComp: [
        `Complementary and non-paid visit trend is used to detect dilution in attendance quality.`,
        `If the non-paid share rises while fill rate stays flat, the studio is filling seats but not monetizing them efficiently.`,
        `The chart should be used alongside revenue per visit to judge whether free traffic is productive.`,
      ].join('\n'),
      attendanceTable: [
        `The session intelligence table is most useful when read by class average, fill rate, late cancels, and revenue together.`,
        `Expanded rows reveal the underlying class-by-class drivers instead of only the grouped totals.`,
        `Look for classes that are full enough to sell but still weak on revenue per check-in.`,
      ].join('\n'),
    };
  }, [salesStats, clientStats, sessionStats, trainerRankingsExtended, expirationStats, lcStats, lapsedByMembership, sessionIntelligence.rows]);

  // Auto-generation disabled — AI summaries are triggered manually via the Sparkles button or AI panel
  // useEffect(() => { ... }, [anyLoading, studio, dateRange.start, dateRange.end]);

  const handleRefresh = useCallback(() => {
    refetchSales();
  }, [refetchSales]);

  const handleExportStudioPulse = useCallback(async (format: ExportFormat) => {
    if (isExportingPulse) return;
    setIsExportingPulse(true);

    const filenameBase = `studio-pulse-${studio}-${dateRange.start}-to-${dateRange.end}`.replace(/[^a-zA-Z0-9-_.]+/g, '-');
    const locationLabel = studio === 'all' ? 'All Studios' : activeStudio.name;
    const filterMeta = `Location: ${locationLabel}  |  Date Range: ${dateRange.start} to ${dateRange.end}`;

    // ── Inline breakdown tables (computed from already-filtered data) ──────────
    const _salesProdMap: Record<string, { revenue: number; units: number; discount: number }> = {};
    filteredSales.forEach((d) => {
      const p = d.cleanedProduct || 'Other';
      _salesProdMap[p] = _salesProdMap[p] || { revenue: 0, units: 0, discount: 0 };
      _salesProdMap[p].revenue += (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0);
      _salesProdMap[p].units += 1;
      _salesProdMap[p].discount += Number(d.discountAmount) || 0;
    });
    const salesByProduct = Object.entries(_salesProdMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([name, v]) => ({ name, revenue: Math.round(v.revenue), units: v.units, discount: Math.round(v.discount) }));

    const _salesCatMap: Record<string, { revenue: number; units: number }> = {};
    filteredSales.forEach((d) => {
      const c = d.cleanedCategory || 'Other';
      _salesCatMap[c] = _salesCatMap[c] || { revenue: 0, units: 0 };
      _salesCatMap[c].revenue += (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0);
      _salesCatMap[c].units += 1;
    });
    const salesByCategory = Object.entries(_salesCatMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([name, v]) => ({ name, revenue: Math.round(v.revenue), units: v.units }));

    const _salesSellerMap: Record<string, { revenue: number; units: number }> = {};
    filteredSales.forEach((d) => {
      const s = d.soldBy || 'Unknown';
      _salesSellerMap[s] = _salesSellerMap[s] || { revenue: 0, units: 0 };
      _salesSellerMap[s].revenue += (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0);
      _salesSellerMap[s].units += 1;
    });
    const salesBySeller = Object.entries(_salesSellerMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([name, v]) => ({ name, revenue: Math.round(v.revenue), units: v.units }));

    const _salesPayMethodMap: Record<string, { revenue: number; units: number }> = {};
    filteredSales.forEach((d) => {
      const pm = d.paymentMethod || 'Unknown';
      _salesPayMethodMap[pm] = _salesPayMethodMap[pm] || { revenue: 0, units: 0 };
      _salesPayMethodMap[pm].revenue += (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0);
      _salesPayMethodMap[pm].units += 1;
    });
    const salesByPaymentMethod = Object.entries(_salesPayMethodMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([name, v]) => ({ name, revenue: Math.round(v.revenue), units: v.units }));

    const _fmtMap: Record<string, { sessions: number; visits: number; cap: number }> = {};
    filteredSessions.forEach((s) => {
      const fmt = classifyFormat(s.cleanedClass || s.classType);
      _fmtMap[fmt] = _fmtMap[fmt] || { sessions: 0, visits: 0, cap: 0 };
      _fmtMap[fmt].sessions += 1;
      _fmtMap[fmt].visits += Number(s.checkedInCount) || 0;
      _fmtMap[fmt].cap += Number(s.capacity) || 0;
    });
    const sessionsByFormat = Object.entries(_fmtMap)
      .sort((a, b) => b[1].visits - a[1].visits)
      .map(([format, v]) => ({ format, sessions: v.sessions, visits: v.visits, avgFill: v.cap > 0 ? Math.round((v.visits / v.cap) * 100) : 0 }));

    const _lcTeacherMap: Record<string, { count: number; sameDay: number; penalty: number }> = {};
    filteredLateCancels.forEach((d) => {
      const t = (d as any).teacherName || (d as any).trainerName || 'Unknown';
      _lcTeacherMap[t] = _lcTeacherMap[t] || { count: 0, sameDay: 0, penalty: 0 };
      _lcTeacherMap[t].count += 1;
      if ((d as any).isSameDayCancellation) _lcTeacherMap[t].sameDay += 1;
      _lcTeacherMap[t].penalty += Number((d as any).chargedPenaltyAmount || (d as any).penaltyAmount) || 0;
    });
    const lcByTeacher = Object.entries(_lcTeacherMap)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, v]) => ({ name, count: v.count, sameDay: v.sameDay, penalty: Math.round(v.penalty) }));

    const _lcMemberMap: Record<string, { count: number; penalty: number }> = {};
    filteredLateCancels.forEach((d) => {
      const m = (d as any).memberId || 'Unknown';
      _lcMemberMap[m] = _lcMemberMap[m] || { count: 0, penalty: 0 };
      _lcMemberMap[m].count += 1;
      _lcMemberMap[m].penalty += Number((d as any).chargedPenaltyAmount || (d as any).penaltyAmount) || 0;
    });
    const lcByMember = Object.entries(_lcMemberMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 100)
      .map(([memberId, v]) => ({ memberId, count: v.count, penalty: Math.round(v.penalty) }));

    const _leadSrcMap: Record<string, { count: number; converted: number }> = {};
    filteredLeads.forEach((l) => {
      const src = l.source || 'Unknown';
      _leadSrcMap[src] = _leadSrcMap[src] || { count: 0, converted: 0 };
      _leadSrcMap[src].count += 1;
      if (isLeadConverted(l)) _leadSrcMap[src].converted += 1;
    });
    const leadSources = Object.entries(_leadSrcMap)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([source, v]) => ({ source, count: v.count, converted: v.converted, conversionRate: v.count ? Math.round((v.converted / v.count) * 100) : 0 }));

    const leadTrials = filteredLeads.filter((l) => { const t = (l.trialStatus || '').toLowerCase(); return t.includes('completed') || t.includes('trial') || t.includes('attended'); }).length;
    const leadConverted = filteredLeads.filter((l) => isLeadConverted(l)).length;
    const leadFunnel = [
      { stage: 'Leads', count: filteredLeads.length, pctOfTop: 100 },
      { stage: 'Trials', count: leadTrials, pctOfTop: filteredLeads.length ? Math.round((leadTrials / filteredLeads.length) * 100) : 0 },
      { stage: 'Converted', count: leadConverted, pctOfTop: filteredLeads.length ? Math.round((leadConverted / filteredLeads.length) * 100) : 0 },
    ];

    const fmtPct = (v: number | null | undefined) => v === null || v === undefined ? 'N/A' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;

    const totalSalesNet = filteredSales.reduce((s, d) => s + (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0), 0);
    const totalSalesGross = filteredSales.reduce((s, d) => s + (Number(d.paymentValue) || 0), 0);
    const totalDiscount = filteredSales.reduce((s, d) => s + (Number(d.discountAmount) || 0), 0);
    const discountedTxns = filteredSales.filter((d) => (Number(d.discountAmount) || 0) > 0).length;
    const uniqueMembers = new Set(filteredSales.map((d) => d.memberId).filter(Boolean)).size;
    const totalAttendance = filteredSessions.reduce((s, d) => s + (Number(d.checkedInCount) || 0), 0);
    const totalCapacity = filteredSessions.reduce((s, d) => s + (Number(d.capacity) || 0), 0);
    const emptyCount = filteredSessions.filter((s) => (Number(s.checkedInCount) || 0) === 0).length;
    const totalSessions = filteredSessions.length;
    const avgFillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
    const classAvg = totalSessions > 0 ? totalAttendance / Math.max(totalSessions - emptyCount, 1) : 0;
    const revPerVisit = totalAttendance > 0 ? totalSalesNet / totalAttendance : 0;
    const newClients = filteredClients.filter((c) => isInNewClientCohort(c));
    const convertedClients = newClients.filter((c) => c.conversionStatus === 'Converted').length;
    const retainedClients = newClients.filter((c) => c.retentionStatus === 'Retained').length;
    const lapsedMembers = filteredExpirations.length;
    const lcTotal = filteredLateCancels.length;
    const lcSameDay = filteredLateCancels.filter((d) => (d as any).isSameDayCancellation).length;
    const lcPenalty = filteredLateCancels.reduce((s, d) => s + (Number((d as any).chargedPenaltyAmount || (d as any).penaltyAmount) || 0), 0);

    const metricCardRows = [
      // Studio Overview section
      { section: 'Studio Overview', metric: 'Net Sales', value: formatCurrency(Math.round(totalSalesNet)), momGrowth: fmtPct(salesStats.growth.net), yoyGrowth: fmtPct(salesStats.yoyGrowth.net), note: `Gross ${formatCurrency(Math.round(totalSalesGross))} · Discount ${formatCurrency(Math.round(totalDiscount))}` },
      { section: 'Studio Overview', metric: 'Units Sold', value: formatNumber(filteredSales.length), momGrowth: fmtPct(salesStats.growth.txns), yoyGrowth: fmtPct(salesStats.yoyGrowth.txns), note: `ATV ${formatCurrency(filteredSales.length ? Math.round(totalSalesNet / filteredSales.length) : 0)} · ${discountedTxns} discounted txns` },
      { section: 'Studio Overview', metric: 'Unique Members', value: formatNumber(uniqueMembers), momGrowth: fmtPct(salesStats.growth.members), yoyGrowth: fmtPct(salesStats.yoyGrowth.members), note: 'Unique buyers in the active period' },
      { section: 'Studio Overview', metric: 'Lapsed Members', value: formatNumber(lapsedMembers), momGrowth: fmtPct(expirationStats.momGrowth), yoyGrowth: fmtPct(expirationStats.yoyGrowth), note: `${expirationStats.churned} churned` },
      { section: 'Studio Overview', metric: 'Visits', value: formatNumber(totalAttendance), momGrowth: fmtPct(sessionStats.growth.attendance), yoyGrowth: fmtPct(sessionStats.yoyGrowth.attendance), note: `${totalSessions} sessions conducted` },
      { section: 'Studio Overview', metric: 'Sessions Conducted', value: formatNumber(totalSessions), momGrowth: fmtPct(sessionStats.growth.totalSessions), yoyGrowth: fmtPct(sessionStats.yoyGrowth.totalSessions), note: `Fill rate ${avgFillRate.toFixed(1)}% · ${emptyCount} empty sessions` },
      { section: 'Studio Overview', metric: 'Class Average', value: classAvg.toFixed(1), momGrowth: fmtPct(sessionStats.growth.classAvg), yoyGrowth: fmtPct(sessionStats.yoyGrowth.classAvg), note: 'Avg check-ins per non-empty class' },
      { section: 'Studio Overview', metric: 'Fill Rate', value: `${avgFillRate.toFixed(1)}%`, momGrowth: fmtPct(sessionStats.growth.avgFill), yoyGrowth: fmtPct(sessionStats.yoyGrowth.avgFill), note: 'Capacity utilization across all sessions' },
      { section: 'Studio Overview', metric: 'Revenue / Visit', value: formatCurrency(Math.round(revPerVisit)), momGrowth: fmtPct(revenuePerVisitStats.momGrowth), yoyGrowth: fmtPct(revenuePerVisitStats.yoyGrowth), note: `${formatNumber(totalAttendance)} visits · ${formatNumber(totalSessions)} sessions` },
      { section: 'Studio Overview', metric: 'Late Cancellations', value: formatNumber(lcTotal), momGrowth: fmtPct(lcStats.growth.total), yoyGrowth: 'N/A', note: `${lcSameDay} same-day · Penalties ${formatCurrency(Math.round(lcPenalty))}` },
      { section: 'Studio Overview', metric: 'Rev / New Client', value: formatCurrency(newClients.length ? Math.round(totalSalesNet / newClients.length) : 0), momGrowth: fmtPct(revenuePerNewClientStats.momGrowth), yoyGrowth: fmtPct(revenuePerNewClientStats.yoyGrowth), note: `${newClients.length} new clients` },
      { section: 'Studio Overview', metric: 'Discount Efficiency', value: `₹${discountEfficiency.efficiency.toFixed(2)}`, momGrowth: fmtPct(discountEfficiency.momGrowth), yoyGrowth: fmtPct(discountEfficiency.yoyGrowth), note: 'Net revenue generated per ₹1 discounted' },
      { section: 'Studio Overview', metric: 'Package Sell-through', value: `${packageSellThrough.rate.toFixed(1)}%`, momGrowth: fmtPct(packageSellThrough.momGrowth), yoyGrowth: fmtPct(packageSellThrough.yoyGrowth), note: `${packageSellThrough.usedClasses} used of ${packageSellThrough.totalClasses} purchased` },
      { section: 'Studio Overview', metric: 'Repeat Purchase Rate', value: `${repeatPurchaseRate.rate.toFixed(1)}%`, momGrowth: fmtPct(repeatPurchaseRate.momGrowth), yoyGrowth: fmtPct(repeatPurchaseRate.yoyGrowth), note: `${repeatPurchaseRate.repeaters} of ${repeatPurchaseRate.total} members` },
      { section: 'Studio Overview', metric: 'Avg Order Value', value: formatCurrency(Math.round(avgOrderValue.value)), momGrowth: fmtPct(avgOrderValue.momGrowth), yoyGrowth: fmtPct(avgOrderValue.yoyGrowth), note: 'Avg gross order value per transaction' },
      // Funnel section
      { section: 'Funnel', metric: 'Leads Received', value: formatNumber(filteredLeads.length), momGrowth: fmtPct(leadStats.growth.total), yoyGrowth: fmtPct(leadStats.yoyGrowth.total), note: 'All leads in the active period' },
      { section: 'Funnel', metric: 'Trials / First Visits', value: formatNumber(newClients.length), momGrowth: fmtPct(clientStats.growth.newClients), yoyGrowth: fmtPct(clientStats.yoyGrowth.newClients), note: 'Unique first visits from New sheet' },
      { section: 'Funnel', metric: 'Converted Members', value: formatNumber(convertedClients), momGrowth: fmtPct(clientStats.growth.converted), yoyGrowth: fmtPct(clientStats.yoyGrowth.converted), note: `${newClients.length ? ((convertedClients / newClients.length) * 100).toFixed(1) : 0}% conversion rate` },
      { section: 'Funnel', metric: 'Retained Members', value: formatNumber(retainedClients), momGrowth: fmtPct(clientStats.growth.retained), yoyGrowth: fmtPct(clientStats.yoyGrowth.retained), note: `${newClients.length ? ((retainedClients / newClients.length) * 100).toFixed(1) : 0}% retention rate · Avg LTV ${formatCurrency(clientStats.avgLtv)}` },
      // Lapsed section
      { section: 'Lapsed', metric: 'Lapsed Members', value: formatNumber(expirationStats.total), momGrowth: fmtPct(expirationStats.momGrowth), yoyGrowth: fmtPct(expirationStats.yoyGrowth), note: `${expirationStats.churned} churned · ${expirationStats.renewed} renewed · ${expirationStats.frozen} frozen` },
      { section: 'Lapsed', metric: 'Churn Rate', value: `${expirationStats.churnRate.toFixed(1)}%`, momGrowth: fmtPct(expirationStats.churnRateMomGrowth), yoyGrowth: fmtPct(expirationStats.churnRateYoyGrowth), note: `${expirationStats.churned} of ${expirationStats.total} lapsed` },
      { section: 'Lapsed', metric: 'Avg LTV (Lapsed)', value: formatCurrency(Math.round(expirationStats.avgLtvLapsed)), momGrowth: fmtPct(expirationStats.avgLtvMomGrowth), yoyGrowth: fmtPct(expirationStats.avgLtvYoyGrowth), note: 'Average amount paid by lapsed members' },
      // Attendance section
      { section: 'Attendance', metric: 'Visits', value: formatNumber(totalAttendance), momGrowth: fmtPct(sessionStats.growth.attendance), yoyGrowth: fmtPct(sessionStats.yoyGrowth.attendance), note: `${totalSessions} sessions · ${avgFillRate.toFixed(1)}% fill` },
      { section: 'Attendance', metric: 'Avg Class Size', value: classAvg.toFixed(1), momGrowth: fmtPct(sessionStats.growth.classAvg), yoyGrowth: fmtPct(sessionStats.yoyGrowth.classAvg), note: `${((emptyCount / Math.max(totalSessions, 1)) * 100).toFixed(1)}% empty-session share` },
      { section: 'Attendance', metric: 'Fill Rate', value: `${avgFillRate.toFixed(1)}%`, momGrowth: fmtPct(sessionStats.growth.avgFill), yoyGrowth: fmtPct(sessionStats.yoyGrowth.avgFill), note: 'Capacity utilization across all sessions' },
      { section: 'Attendance', metric: 'Sessions Conducted', value: formatNumber(totalSessions), momGrowth: fmtPct(sessionStats.growth.totalSessions), yoyGrowth: fmtPct(sessionStats.yoyGrowth.totalSessions), note: `${((emptyCount / Math.max(totalSessions, 1)) * 100).toFixed(1)}% empty share` },
    ];

    const workbookSections = [
      // ── Metric card KPI summary ──────────────────────────────────────────────
      { title: 'Metric Cards', columns: ['section', 'metric', 'value', 'momGrowth', 'yoyGrowth', 'note'], rows: metricCardRows },
      // ── Raw filtered data ────────────────────────────────────────────────────
      { title: 'Sales (Raw Data)', columns: ['paymentDate', 'calculatedLocation', 'memberId', 'cleanedProduct', 'cleanedCategory', 'paymentValue', 'paymentVAT', 'discountAmount', 'soldBy', 'paymentMethod'], rows: filteredSales },
      { title: 'Sessions (Raw Data)', columns: ['date', 'location', 'sessionName', 'cleanedClass', 'trainerName', 'checkedInCount', 'capacity', 'revenue', 'lateCancelledCount'], rows: filteredSessions },
      { title: 'Clients (Raw Data)', columns: ['firstVisitDate', 'firstVisitLocation', 'firstVisitEntityName', 'memberId', 'email', 'conversionStatus', 'retentionStatus', 'ltv'], rows: filteredClients },
      { title: 'Leads (Raw Data)', columns: ['createdAt', 'center', 'source', 'stage', 'classType', 'memberId', 'email', 'conversionStatus', 'ltv'], rows: filteredLeads },
      { title: 'Late Cancels (Raw Data)', columns: ['dateIST', 'sessionDateIST', 'location', 'teacherName', 'memberId', 'sessionName', 'penaltyAmount'], rows: filteredLateCancels },
      { title: 'Expirations (Raw Data)', columns: ['endDate', 'primaryLocation', 'homeLocation', 'membershipName', 'memberId', 'status', 'sessionsUsedPct', 'avgSessionsPerMonth', 'daysActive'], rows: filteredExpirations },
      // ── Sales breakdowns ─────────────────────────────────────────────────────
      { title: 'Sales by Product', columns: ['name', 'revenue', 'units', 'discount'], rows: salesByProduct },
      { title: 'Sales by Category', columns: ['name', 'revenue', 'units'], rows: salesByCategory },
      { title: 'Sales by Seller', columns: ['name', 'revenue', 'units'], rows: salesBySeller },
      { title: 'Sales by Payment Method', columns: ['name', 'revenue', 'units'], rows: salesByPaymentMethod },
      // ── Session breakdowns ───────────────────────────────────────────────────
      { title: 'Sessions by Format', columns: ['format', 'sessions', 'visits', 'avgFill'], rows: sessionsByFormat },
      // ── Funnel breakdowns ────────────────────────────────────────────────────
      { title: 'Lead Funnel', columns: ['stage', 'count', 'pctOfTop'], rows: leadFunnel },
      { title: 'Lead Sources', columns: ['source', 'count', 'converted', 'conversionRate'], rows: leadSources },
      // ── Late cancel breakdowns ───────────────────────────────────────────────
      { title: 'Late Cancels by Teacher', columns: ['name', 'count', 'sameDay', 'penalty'], rows: lcByTeacher },
      { title: 'Late Cancels by Member', columns: ['memberId', 'count', 'penalty'], rows: lcByMember },
      // ── Computed analytics tables ────────────────────────────────────────────
      { title: 'Sales Metrics Matrix', columns: ['label', ...salesMetricsMatrix.months.map((m) => salesMetricsMatrix.monthLabels[m])], rows: salesMetricsMatrix.metricRows.map((row) => ({
        label: row.label,
        ...Object.fromEntries(salesMetricsMatrix.months.map((month) => [salesMetricsMatrix.monthLabels[month], row.values[month] ?? 0])),
      })) },
      { title: 'Session Intelligence', columns: ['name', 'sessions', 'visits', 'capacity', 'empty', 'classAvg', 'fillRate', 'cancellationRate', 'revPerCheckin', 'revenue', 'isActive'], rows: sessionIntelligence.rows },
      { title: 'Funnel Rankings', columns: ['name', 'leads', 'trials', 'converted', 'retained', 'visitsPostTrial', 'ltv', 'membershipsBought'], rows: funnelRankings.rows },
      { title: 'Trainer Rankings', columns: ['name', 'sessions', 'customers', 'paid', 'classAvg', 'fillRate', 'utilization', 'conversionRate', 'lateCancels', 'revenueScore'], rows: trainerRankingsExtended.rows },
      { title: 'Lapsed Memberships', columns: ['name', 'count', 'uniqueMembers', 'avgLtv', 'avgSessionsUsedPct', 'avgDaysActive', 'earlyExitRate', 'discountRate'], rows: membershipChurnBreakdown },
      { title: 'Heatmap', columns: ['slot', ...peakHourHeatmap.days], rows: peakHourHeatmap.timeSlots.map((slot) => ({ slot, ...Object.fromEntries(peakHourHeatmap.days.map((day) => [day, peakHourHeatmap.buckets[slot]?.[day]?.fillRate ?? 0])) })) },
    ];

    try {
      // ── New format handlers (early return) ────────────────────────────────
      if (format === 'clipboard') {
        const content = metricsRegistry.getAllTabsContent();
        await navigator.clipboard.writeText(content);
        toast({ title: 'Copied to clipboard!', description: 'All metric tables copied. Paste into any spreadsheet or document.' });
        return;
      }

      if (format === 'csv') {
        let csvContent = `Studio Pulse Export\nLocation: ${locationLabel}\nDate Range: ${dateRange.start} to ${dateRange.end}\nGenerated: ${new Date().toLocaleString()}\n\n`;
        workbookSections.forEach(section => {
          if (!section.rows.length) return;
          csvContent += `\n# ${section.title}\n`;
          csvContent += section.columns.map(camelToHeader).join(',') + '\n';
          section.rows.forEach(row => {
            csvContent += section.columns.map(col => {
              const val = String(csvSafeValue((row as Record<string, any>)[col]) ?? '');
              return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val;
            }).join(',') + '\n';
          });
        });
        metricsRegistry.getAllTables().forEach((table) => {
          try {
            const { title, headers, rows } = parseRegistryTable(table.getTextContent());
            if (!headers.length || !rows.length) return;
            csvContent += `\n# ${title}\n`;
            csvContent += headers.map(h => h.includes(',') ? `"${h}"` : h).join(',') + '\n';
            rows.forEach(row => { csvContent += row.map(cell => cell.includes(',') ? `"${cell}"` : cell).join(',') + '\n'; });
          } catch { /* skip */ }
        });
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvA = document.createElement('a'); csvA.href = csvUrl; csvA.download = `${filenameBase}.csv`; csvA.click();
        URL.revokeObjectURL(csvUrl);
        toast({ title: 'CSV ready', description: `Studio Pulse data exported for ${locationLabel}.` });
        return;
      }

      if (format === 'json') {
        const jsonPayload: Record<string, any> = {
          meta: { location: locationLabel, dateRange: `${dateRange.start} to ${dateRange.end}`, generatedAt: new Date().toISOString() },
          sections: {} as Record<string, any[]>,
          dashboardTables: {} as Record<string, any[]>,
        };
        workbookSections.forEach(section => {
          if (section.rows.length) jsonPayload.sections[section.title] = section.rows;
        });
        metricsRegistry.getAllTables().forEach((table) => {
          try {
            const { title, headers, rows } = parseRegistryTable(table.getTextContent());
            if (!headers.length || !rows.length) return;
            jsonPayload.dashboardTables[title] = rows.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])));
          } catch { /* skip */ }
        });
        const jsonBlob = new Blob([JSON.stringify(jsonPayload, null, 2)], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonA = document.createElement('a'); jsonA.href = jsonUrl; jsonA.download = `${filenameBase}.json`; jsonA.click();
        URL.revokeObjectURL(jsonUrl);
        toast({ title: 'JSON ready', description: `Studio Pulse structured data exported for ${locationLabel}.` });
        return;
      }

      if (format === 'html') {
        const htmlStyle = `<style>body{font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;padding:2rem;max-width:1300px;margin:0 auto}h1{font-size:1.75rem;font-weight:800;margin-bottom:.25rem}.meta{color:#64748b;font-size:.875rem;margin-bottom:2rem}h2{font-size:.875rem;font-weight:700;margin:2rem 0 .5rem;padding:.5rem 1rem;background:#1e293b;color:#fff;border-radius:8px}table{width:100%;border-collapse:collapse;font-size:.8rem;margin-bottom:1.5rem;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)}th{background:#334155;color:#fff;padding:8px 12px;text-align:left;font-weight:600;font-size:.7rem;text-transform:uppercase;letter-spacing:.05em}td{padding:7px 12px;border-bottom:1px solid #f1f5f9}tr:last-child td{border-bottom:none}tr:nth-child(even) td{background:#f8fafc}</style>`;
        let htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Studio Pulse — ${locationLabel}</title>${htmlStyle}</head><body><h1>Studio Pulse Export</h1><div class="meta">Location: ${locationLabel} · Date Range: ${dateRange.start} to ${dateRange.end} · Generated: ${new Date().toLocaleString()}</div>`;
        workbookSections.forEach(section => {
          if (!section.rows.length) return;
          htmlContent += `<h2>${section.title}</h2><table><thead><tr>${section.columns.map(c => `<th>${camelToHeader(c)}</th>`).join('')}</tr></thead><tbody>`;
          section.rows.slice(0, 500).forEach(row => {
            htmlContent += `<tr>${section.columns.map(col => `<td>${csvSafeValue((row as Record<string, any>)[col]) ?? ''}</td>`).join('')}</tr>`;
          });
          htmlContent += '</tbody></table>';
        });
        metricsRegistry.getAllTables().forEach((table) => {
          try {
            const { title, headers, rows } = parseRegistryTable(table.getTextContent());
            if (!headers.length || !rows.length) return;
            htmlContent += `<h2>${title}</h2><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
            rows.slice(0, 500).forEach(row => { htmlContent += `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`; });
            htmlContent += '</tbody></table>';
          } catch { /* skip */ }
        });
        htmlContent += '</body></html>';
        const htmlBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
        const htmlUrl = URL.createObjectURL(htmlBlob);
        const htmlA = document.createElement('a'); htmlA.href = htmlUrl; htmlA.download = `${filenameBase}.html`; htmlA.click();
        URL.revokeObjectURL(htmlUrl);
        toast({ title: 'HTML report ready', description: `Studio Pulse styled web report exported for ${locationLabel}.` });
        return;
      }

      // ── Existing XLSX / PDF paths ─────────────────────────────────────────
      if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        const metaSheet = XLSX.utils.aoa_to_sheet([
          ['Studio Pulse Export'],
          ['Location', locationLabel],
          ['Date Range', `${dateRange.start} to ${dateRange.end}`],
          ['Generated At', new Date().toLocaleString()],
          [],
          ['Sheet', 'Description'],
          ['Metric Cards', 'All KPI metric card values with MoM and YoY growth'],
          ['Sales (Raw Data)', 'Filtered sales transactions'],
          ['Sessions (Raw Data)', 'Filtered session records'],
          ['Clients (Raw Data)', 'Filtered client records'],
          ['Leads (Raw Data)', 'Filtered lead records'],
          ['Late Cancels (Raw Data)', 'Filtered late cancellation records'],
          ['Expirations (Raw Data)', 'Filtered expiration / lapsed records'],
          ['Sales by Product', 'Revenue and units breakdown by product'],
          ['Sales by Category', 'Revenue and units breakdown by category'],
          ['Sales by Seller', 'Revenue and units breakdown by seller / trainer'],
          ['Sales by Payment Method', 'Revenue and units by payment method'],
          ['Sessions by Format', 'Sessions, visits, and fill rate by class format'],
          ['Lead Funnel', 'Leads → Trials → Converted funnel counts'],
          ['Lead Sources', 'Lead count and conversion rate by source'],
          ['Late Cancels by Teacher', 'Late cancellation count and penalty by teacher'],
          ['Late Cancels by Member', 'Top members by late cancellation count'],
          ['Sales Metrics Matrix', 'Month-on-month sales metric matrix'],
          ['Session Intelligence', 'Per-class performance intelligence table'],
          ['Funnel Rankings', 'New-client funnel ranked by source'],
          ['Trainer Rankings', 'Trainer performance scorecard'],
          ['Lapsed Memberships', 'Lapsed membership breakdown by type'],
          ['Heatmap', 'Peak-hour fill rate heatmap'],
        ]);
        XLSX.utils.book_append_sheet(wb, metaSheet, 'Summary');

        // Filter header rows prepended to each data sheet
        const filterHeaderRows = [
          [filterMeta],
          [],
        ];

        workbookSections.forEach((section) => {
          if (!section.rows.length) return;
          const headerRow = section.columns.map(camelToHeader);
          // Use deformatCellValue so numeric fields export as numbers, not ₹/K/Cr strings
          const dataRows = section.rows.map((row) =>
            section.columns.map((col) => deformatCellValue((row as Record<string, any>)[col]))
          );
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...filterHeaderRows, headerRow, ...dataRows]), section.title.slice(0, 31));
        });

        // Append all registered dashboard tables (pivot tables, rankings, etc.) — includes hidden/inactive sections
        const existingSheets = new Set(wb.SheetNames);
        metricsRegistry.getAllTables().forEach((table) => {
          try {
            const { title, headers, rows } = parseRegistryTable(table.getTextContent());
            if (!headers.length || !rows.length) return;
            // Filter grouped/total rows; normalise cell values to raw numbers
            const cleanRows = rows
              .filter((row) => !isGroupOrTotalRow(row, headers.length))
              .map((row) => row.map((cell) => deformatCellValue(cell)));
            if (!cleanRows.length) return;
            let sheetName = title.slice(0, 31).replace(/[\\/*?[\]:]/g, '-');
            if (existingSheets.has(sheetName)) sheetName = sheetName.slice(0, 28) + ' (2)';
            existingSheets.add(sheetName);
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...filterHeaderRows, headers, ...cleanRows]), sheetName);
          } catch { /* skip tables that fail to render */ }
        });

        XLSX.writeFile(wb, `${filenameBase}.xlsx`);
      } else {
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        let y = 14;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text('Studio Pulse Export', 14, y);
        y += 7;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Location: ${locationLabel}`, 14, y);
        y += 5;
        pdf.text(`Date Range: ${dateRange.start} to ${dateRange.end}`, 14, y);
        y += 5;
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, y);
        y += 8;

        const addPdfSection = (title: string, columns: string[], rows: any[], maxRows = 250) => {
          if (!rows.length) return;
          if (y > 170) { pdf.addPage(); y = 14; }
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(title, 14, y);
          y += 4;
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 116, 139);
          pdf.text(filterMeta, 14, y);
          pdf.setTextColor(0, 0, 0);
          y += 4;
          autoTable(pdf, {
            startY: y,
            head: [columns.map(camelToHeader)],
            body: rows.slice(0, maxRows).map((row) =>
              columns.map((col) => csvSafeValue((row as Record<string, any>)[col]))
            ),
            styles: { fontSize: 7, cellPadding: 1.5 },
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 },
            theme: 'grid',
          });
          y = ((pdf as any).lastAutoTable?.finalY || y) + 8;
        };

        // Metric card summary
        addPdfSection('Metric Cards — KPI Summary', ['section', 'metric', 'value', 'momGrowth', 'yoyGrowth', 'note'], metricCardRows);

        // Raw data
        addPdfSection('Sales (Raw Data)', ['paymentDate', 'calculatedLocation', 'cleanedProduct', 'paymentValue', 'paymentVAT', 'discountAmount', 'soldBy'], filteredSales);
        addPdfSection('Sessions (Raw Data)', ['date', 'location', 'sessionName', 'trainerName', 'checkedInCount', 'capacity', 'revenue'], filteredSessions);
        addPdfSection('Clients (Raw Data)', ['firstVisitDate', 'firstVisitLocation', 'memberId', 'conversionStatus', 'retentionStatus', 'ltv'], filteredClients);
        addPdfSection('Leads (Raw Data)', ['createdAt', 'center', 'source', 'stage', 'conversionStatus', 'ltv'], filteredLeads);
        addPdfSection('Late Cancellations (Raw Data)', ['dateIST', 'location', 'teacherName', 'sessionName', 'penaltyAmount'], filteredLateCancels);
        addPdfSection('Expirations (Raw Data)', ['endDate', 'primaryLocation', 'membershipName', 'memberId', 'sessionsUsedPct', 'daysActive'], filteredExpirations);

        // Sales breakdowns
        addPdfSection('Sales by Product', ['name', 'revenue', 'units', 'discount'], salesByProduct);
        addPdfSection('Sales by Category', ['name', 'revenue', 'units'], salesByCategory);
        addPdfSection('Sales by Seller', ['name', 'revenue', 'units'], salesBySeller);
        addPdfSection('Sales by Payment Method', ['name', 'revenue', 'units'], salesByPaymentMethod);

        // Session breakdowns
        addPdfSection('Sessions by Format', ['format', 'sessions', 'visits', 'avgFill'], sessionsByFormat);

        // Funnel breakdowns
        addPdfSection('Lead Funnel', ['stage', 'count', 'pctOfTop'], leadFunnel);
        addPdfSection('Lead Sources', ['source', 'count', 'converted', 'conversionRate'], leadSources);

        // Late cancel breakdowns
        addPdfSection('Late Cancels by Teacher', ['name', 'count', 'sameDay', 'penalty'], lcByTeacher);
        addPdfSection('Late Cancels by Member (Top 100)', ['memberId', 'count', 'penalty'], lcByMember);

        // Analytics tables
        addPdfSection('Trainer Rankings', ['name', 'sessions', 'customers', 'paid', 'classAvg', 'fillRate', 'lateCancels', 'revenueScore'], trainerRankingsExtended.rows);
        addPdfSection('Session Intelligence', ['name', 'sessions', 'visits', 'classAvg', 'fillRate', 'revenue'], sessionIntelligence.rows);
        addPdfSection('Funnel Rankings', ['name', 'leads', 'trials', 'converted', 'retained', 'ltv'], funnelRankings.rows);
        addPdfSection('Lapsed Memberships', ['name', 'count', 'uniqueMembers', 'avgLtv', 'avgSessionsUsedPct', 'avgDaysActive'], membershipChurnBreakdown as any[]);

        // Append all registered dashboard tables (includes hidden/inactive section tables)
        metricsRegistry.getAllTables().forEach((table) => {
          try {
            const { title, headers, rows } = parseRegistryTable(table.getTextContent());
            if (!headers.length || !rows.length) return;
            if (y > 170) { pdf.addPage(); y = 14; }
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, 14, y);
            y += 4;
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(100, 116, 139);
            pdf.text(filterMeta, 14, y);
            pdf.setTextColor(0, 0, 0);
            y += 4;
            autoTable(pdf, {
              startY: y,
              head: [headers],
              body: rows.slice(0, 200),
              styles: { fontSize: 7, cellPadding: 1.5 },
              headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
              alternateRowStyles: { fillColor: [248, 250, 252] },
              margin: { left: 14, right: 14 },
              theme: 'grid',
            });
            y = ((pdf as any).lastAutoTable?.finalY || y) + 8;
          } catch { /* skip tables that fail to render */ }
        });

        pdf.save(`${filenameBase}.pdf`);
      }

      toast({
        title: 'Export complete',
        description: `Studio Pulse ${format.toUpperCase()} ready for ${locationLabel}.`,
      });
    } catch (error) {
      console.error('Studio Pulse export failed:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unable to generate the Studio Pulse export.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingPulse(false);
    }
  }, [activeStudio.name, avgOrderValue.momGrowth, avgOrderValue.value, avgOrderValue.yoyGrowth, clientStats.avgLtv, clientStats.growth.converted, clientStats.growth.newClients, clientStats.growth.retained, clientStats.yoyGrowth.converted, clientStats.yoyGrowth.newClients, clientStats.yoyGrowth.retained, dateRange.end, dateRange.start, discountEfficiency.efficiency, discountEfficiency.momGrowth, discountEfficiency.yoyGrowth, expirationStats.avgLtvLapsed, expirationStats.avgLtvMomGrowth, expirationStats.avgLtvYoyGrowth, expirationStats.churnRate, expirationStats.churnRateMomGrowth, expirationStats.churnRateYoyGrowth, expirationStats.churned, expirationStats.frozen, expirationStats.momGrowth, expirationStats.renewed, expirationStats.total, expirationStats.yoyGrowth, filteredClients, filteredExpirations, filteredLateCancels, filteredLeads, filteredSales, filteredSessions, funnelRankings.rows, isExportingPulse, lcStats.growth.total, leadStats.growth.total, leadStats.yoyGrowth.total, membershipChurnBreakdown, metricsRegistry, packageSellThrough.momGrowth, packageSellThrough.rate, packageSellThrough.totalClasses, packageSellThrough.usedClasses, packageSellThrough.yoyGrowth, peakHourHeatmap.buckets, peakHourHeatmap.days, peakHourHeatmap.timeSlots, repeatPurchaseRate.momGrowth, repeatPurchaseRate.rate, repeatPurchaseRate.repeaters, repeatPurchaseRate.total, repeatPurchaseRate.yoyGrowth, revenuePerNewClientStats.momGrowth, revenuePerNewClientStats.yoyGrowth, revenuePerVisitStats.momGrowth, revenuePerVisitStats.yoyGrowth, salesMetricsMatrix.metricRows, salesMetricsMatrix.monthLabels, salesMetricsMatrix.months, salesStats.growth.members, salesStats.growth.net, salesStats.growth.txns, salesStats.yoyGrowth.members, salesStats.yoyGrowth.net, salesStats.yoyGrowth.txns, sessionIntelligence.rows, sessionStats.growth.attendance, sessionStats.growth.avgFill, sessionStats.growth.classAvg, sessionStats.growth.totalSessions, sessionStats.yoyGrowth.attendance, sessionStats.yoyGrowth.avgFill, sessionStats.yoyGrowth.classAvg, sessionStats.yoyGrowth.totalSessions, studio, toast, trainerRankingsExtended.rows]);

  const [summaryRefreshing, setSummaryRefreshing] = useState(false);
  const [funnelActiveIdx, setFunnelActiveIdx] = useState(0);
  const [funnelSrcFilter, setFunnelSrcFilter] = useState<string | null>(null);
  const handleRefreshSummaries = useCallback(async () => {
    setSummaryRefreshing(true);
    await refreshAllSummaries([
      buildSummaryInput('main'),
      buildSummaryInput('sales', sectionContexts.sales),
      buildSummaryInput('sales-matrix', sectionContexts.salesMatrix),
      buildSummaryInput('sales-mom', sectionContexts.salesMom),
      buildSummaryInput('sales-rankings', sectionContexts.salesRankings),
      buildSummaryInput('sales-mix', sectionContexts.salesMix),
      buildSummaryInput('funnel', sectionContexts.funnel),
      buildSummaryInput('funnel-overview', sectionContexts.funnelOverview),
      buildSummaryInput('funnel-rankings', sectionContexts.funnelRankings),
      buildSummaryInput('trainers', sectionContexts.trainers),
      buildSummaryInput('trainer-scorecard', sectionContexts.trainerScorecard),
      buildSummaryInput('trainer-efficiency', sectionContexts.trainerEfficiency),
      buildSummaryInput('lapsed', sectionContexts.lapsed),
      buildSummaryInput('lapsed-trend', sectionContexts.lapsedTrend),
      buildSummaryInput('lapsed-table', sectionContexts.lapsedTable),
      buildSummaryInput('attendance', sectionContexts.attendance),
      buildSummaryInput('attendance-heatmap', sectionContexts.attendanceHeatmap),
      buildSummaryInput('attendance-capacity', sectionContexts.attendanceCapacity),
      buildSummaryInput('attendance-comp', sectionContexts.attendanceComp),
      buildSummaryInput('attendance-table', sectionContexts.attendanceTable),
    ]);
    setSummaryRefreshing(false);
  }, [buildSummaryInput, refreshAllSummaries, sectionContexts]);

  const handleResetFilters = useCallback(() => {
    setStudio('all');
    setDateRange(defaultDateRange);
    const params = new URLSearchParams(searchParams);
    params.delete('mv');
    setSearchParams(params, { replace: true });
  }, [defaultDateRange]);

  // ─── Admin auth + presenter mode ──────────────────────────────────────────
  const { isAdmin, error: adminError, unlock: unlockAdmin, lock: lockAdmin } = useAdminAuth();
  const { modeState: presenterMode, isPresenter, startSession, endSession, joinSession, broadcastSnapshot } = usePresenterMode(
    isAdmin ? (import.meta.env.VITE_PRESENTER_EMAIL ?? 'jimmeey@physique57india.com') : null
  );

  // Track scroll position for broadcast (presenter only)
  const [presenterScrollY, setPresenterScrollY] = useState(0);
  useEffect(() => {
    if (presenterMode.role !== 'presenter') return;
    const onScroll = () => setPresenterScrollY(Math.round(window.scrollY));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [presenterMode.role]);

  // Collect current snapshot for broadcast
  const currentSnapshot: PulseSnapshot = {
    studio, dateRange, monthViewMode,
    funnelRankingDimension, newMemberTableMetric, funnelChartMetric, funnelRankingCount,
    funnelChartView, showFunnelMomTable, showFunnelBreakdownTable, showNewMemberMomTable,
    showTrainerMomTable, showTrainerFormatSection, scorecardSortKey, scorecardSortDir,
    showClassMomTable, showLapsedMomTable, churnLocationMetric, lapseRankDimension,
    sessionRankingDimension, sessionRankingMetric, sessionRankingCount, sessionViewMode,
    sessionTableView, sessionDensity, sessionMinCheckins, sessionMinClasses,
    sessionIncludeTrainer, sessionStatusFilter, sessionShowAdvanced, sessionExcludeHosted,
    sessionGrouping, sessionTopMetric, sessionBottomMetric, sessionTopCount, sessionBottomCount,
    showMomTable, insightOpen, drillDownOpen, formatCompTab,
    scrollY: presenterScrollY,
  };

  // Broadcast whenever snapshot changes
  useEffect(() => {
    broadcastSnapshot(currentSnapshot);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcastSnapshot,
    studio, dateRange.start, dateRange.end,
    funnelRankingDimension, newMemberTableMetric, funnelChartMetric, funnelRankingCount,
    funnelChartView, showFunnelMomTable, showFunnelBreakdownTable, showNewMemberMomTable,
    showTrainerMomTable, showTrainerFormatSection, scorecardSortKey, scorecardSortDir,
    showClassMomTable, showLapsedMomTable, churnLocationMetric, lapseRankDimension,
    sessionRankingDimension, sessionRankingMetric, sessionRankingCount, sessionViewMode,
    sessionTableView, sessionDensity, sessionMinCheckins, sessionMinClasses,
    sessionIncludeTrainer, sessionStatusFilter, sessionShowAdvanced, sessionExcludeHosted,
    sessionGrouping, sessionTopMetric, sessionBottomMetric, sessionTopCount, sessionBottomCount,
    showMomTable, insightOpen, drillDownOpen, formatCompTab, monthViewMode, presenterScrollY,
  ]);

  // Apply incoming snapshot (viewer)
  const applySnapshot = useCallback((snap: PulseSnapshot) => {
    setStudio(snap.studio);
    setDateRange(snap.dateRange);
    setFunnelRankingDimension(snap.funnelRankingDimension);
    setNewMemberTableMetric(snap.newMemberTableMetric);
    setFunnelChartMetric(snap.funnelChartMetric);
    setFunnelRankingCount(snap.funnelRankingCount);
    setFunnelChartView(snap.funnelChartView);
    setShowFunnelMomTable(snap.showFunnelMomTable);
    setShowFunnelBreakdownTable(snap.showFunnelBreakdownTable);
    setShowNewMemberMomTable(snap.showNewMemberMomTable);
    setShowTrainerMomTable(snap.showTrainerMomTable);
    setShowTrainerFormatSection(snap.showTrainerFormatSection);
    setScorecardSortKey(snap.scorecardSortKey);
    setScorecardSortDir(snap.scorecardSortDir);
    setShowClassMomTable(snap.showClassMomTable);
    setShowLapsedMomTable(snap.showLapsedMomTable);
    setChurnLocationMetric(snap.churnLocationMetric);
    setLapseRankDimension(snap.lapseRankDimension);
    setSessionRankingDimension(snap.sessionRankingDimension);
    setSessionRankingMetric(snap.sessionRankingMetric);
    setSessionRankingCount(snap.sessionRankingCount);
    setSessionViewMode(snap.sessionViewMode);
    setSessionTableView(snap.sessionTableView);
    setSessionDensity(snap.sessionDensity);
    setSessionMinCheckins(snap.sessionMinCheckins);
    setSessionMinClasses(snap.sessionMinClasses);
    setSessionIncludeTrainer(snap.sessionIncludeTrainer);
    setSessionStatusFilter(snap.sessionStatusFilter);
    setSessionShowAdvanced(snap.sessionShowAdvanced);
    setSessionExcludeHosted(snap.sessionExcludeHosted);
    setSessionGrouping(snap.sessionGrouping as any);
    setSessionTopMetric(snap.sessionTopMetric);
    setSessionBottomMetric(snap.sessionBottomMetric);
    setSessionTopCount(snap.sessionTopCount);
    setSessionBottomCount(snap.sessionBottomCount);
    setShowMomTable(snap.showMomTable);
    setInsightOpen(snap.insightOpen);
    setDrillDownOpen(snap.drillDownOpen);
    if (snap.formatCompTab) setFormatCompTab(snap.formatCompTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (snap.monthViewMode) next.set('mv', '1');
      else next.delete('mv');
      next.set('studio', snap.studio);
      next.set('from', snap.dateRange.start);
      next.set('to', snap.dateRange.end);
      return next;
    }, { replace: true });
    // scroll to presenter position smoothly
    window.scrollTo({ top: snap.scrollY, behavior: 'smooth' });
  }, [setSearchParams]);

  const handleJoinSession = useCallback((code: string, name: string) => {
    joinSession(code, name, applySnapshot);
  }, [joinSession, applySnapshot]);

  // Auto-join from shareable URL: ?join=CODE&viewer=NAME
  useEffect(() => {
    const code = searchParams.get('join');
    const name = searchParams.get('viewer') || '';
    if (code && code.length === 6 && presenterMode.role === 'idle') {
      handleJoinSession(code.toUpperCase(), name);
      // Remove params from URL after consuming
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('join');
        next.delete('viewer');
        return next;
      }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock viewer controls when following
  const viewerLocked = presenterMode.role === 'viewer' && presenterMode.isConnected;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* ── Full-page data loader ── show until every sheet has responded */}
      {anyLoading && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-slate-950 select-none">
          {/* Subtle grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
          <div className="relative flex flex-col items-center gap-7 z-10">
            {/* Spinner */}
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-[3px] border-white/10" />
              <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-purple-400" />
              <div className="absolute inset-[6px] animate-spin rounded-full border-[2px] border-transparent border-t-rose-400" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            </div>
            {/* Wordmark */}
            <div className="text-center">
              <p className="text-2xl font-extrabold tracking-tight text-white">Performance Intelligence Platform</p>
              <p className="mt-1.5 text-sm font-medium text-slate-400">Initialising core modules…</p>
            </div>
            {/* Source pills */}
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {[
                { label: 'Sales', done: !salesLoading },
                { label: 'Sessions', done: !sessionsLoading },
                { label: 'New Clients', done: !clientsLoading },
                { label: 'Payroll', done: !payrollLoading },
                { label: 'Leads', done: !leadsLoading },
                { label: 'Late Cancellations', done: !lcLoading },
                { label: 'Expirations', done: !expLoading },
                { label: 'Recurring', done: !recurringLoading },
                { label: 'Checkins', done: !checkinsLoading },
              ].map(({ label, done }) => (
                <span
                  key={label}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-500 ${
                    done
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 text-slate-500 border border-white/10'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-emerald-400' : 'bg-slate-600 animate-pulse'}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-10 h-80 w-80 rounded-full bg-gradient-to-br from-blue-300/20 to-blue-900/10 blur-3xl" />
        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-fuchsia-300/15 to-purple-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-300/15 to-teal-300/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 py-8 md:px-8">
        {/* Header */}
        <header className="relative mb-6 overflow-hidden rounded-3xl">
          {/* Cinematic dark backdrop */}
          <div className="relative flex flex-col items-center justify-center px-8 py-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 rounded-3xl overflow-hidden">

            {/* Ambient grid lines — decorative */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }} />

            {/* Left radial glow — CSS-only, compositor safe */}
            <div
              className="pointer-events-none absolute -left-24 top-1/2 -translate-y-1/2 h-[320px] w-[320px] rounded-full bg-rose-600/20 blur-[80px] animate-pulse"
              style={{ willChange: 'opacity', animationDuration: '3s' }}
            />
            {/* Right radial glow */}
            <div
              className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 h-[320px] w-[320px] rounded-full bg-indigo-600/20 blur-[80px] animate-pulse"
              style={{ willChange: 'opacity', animationDuration: '4s', animationDelay: '1.5s' }}
            />
            {/* Center ambient */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[180px] w-[400px] rounded-full bg-white/5 blur-[60px] animate-pulse"
              style={{ willChange: 'opacity', animationDuration: '5s', animationDelay: '0.5s' }}
            />

            {/* Project badge — top right */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/50 backdrop-blur"
            >
              <span className="text-white/30 font-normal">by</span>
              <span className="text-white/70 font-bold tracking-wide">Jimmeey Gondaa</span>
            </motion.div>

            {/* Logo — entrance only (no repeat animations) */}
            <motion.div
              initial={{ opacity: 0, y: -18, scale: 0.75 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-5 flex flex-col items-center gap-2"
            >
              <div className="relative flex items-center justify-center">
                {/* Glow ring — CSS pulse only */}
                <div
                  className="pointer-events-none absolute h-16 w-48 rounded-full bg-rose-400/25 blur-xl animate-pulse"
                  style={{ willChange: 'opacity', animationDuration: '3.5s' }}
                />
                <div className="relative flex items-center gap-3">
                  <div className="h-px w-10 bg-gradient-to-r from-transparent to-white/30 animate-pulse" style={{ animationDuration: '3s' }} />
                  <motion.img
                    src="/physique57-logo.png"
                    alt="Physique57"
                    className="h-8 w-auto object-contain brightness-0 invert"
                    style={{ opacity: 0.85 }}
                    whileHover={{ opacity: 1, scale: 1.04 }}
                    transition={{ duration: 0.2 }}
                  />
                  <div className="h-px w-10 bg-gradient-to-l from-transparent to-white/30 animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                </div>
              </div>
              {/* Studio Pulse badge */}
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" style={{ animationDuration: '2s' }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">Studio Pulse</span>
              </motion.div>
            </motion.div>

            {/* Main title — word-by-word reveal */}
            <div className="relative flex flex-col items-center text-center">
              <h1 className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
                {(['Performance', 'Analytics', 'Suite'] as const).map((word, i) => (
                  <motion.span
                    key={word}
                    initial={{ opacity: 0, y: 32, filter: 'blur(16px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 1.0, delay: 0.35 + i * 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      'inline-block select-none font-black leading-none tracking-tight',
                      'text-5xl md:text-6xl lg:text-7xl',
                      i === 0 && 'bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent',
                      i === 1 && 'bg-gradient-to-br from-rose-300 via-rose-400 to-rose-600 bg-clip-text text-transparent',
                      i === 2 && 'bg-gradient-to-br from-white/50 via-white/30 to-white/10 bg-clip-text text-transparent',
                    )}
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>

              {/* Shine sweep across title */}
              <motion.div
                initial={{ x: '-120%', opacity: 0 }}
                animate={{ x: '120%', opacity: [0, 0.5, 0] }}
                transition={{ duration: 1.1, delay: 1.2, ease: 'easeInOut' }}
                className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />

              {/* Underline — center-out grow */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.35, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'center' }}
                className="mt-3 h-px w-4/5 rounded-full bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />
            </div>

            {/* Subtitle — data-driven tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              className="mt-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/30"
            >
              Studio · Operations · Intelligence
            </motion.p>

            {/* Scanning horizontal line — sweeps top→bottom on loop */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
              <div
                className="sp-scan-line absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/70 to-transparent"
                style={{ animationDelay: '2s' }}
              />
              <div
                className="sp-scan-line absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent"
                style={{ animationDelay: '5s' }}
              />
            </div>

            {/* Pulsing concentric rings from center */}
            {[0, 0.8, 1.6].map((delay, i) => (
              <div
                key={i}
                className="sp-ring pointer-events-none absolute rounded-full border border-white/6"
                style={{
                  left: '50%', top: '50%',
                  width: 220 + i * 80, height: 220 + i * 80,
                  animationDelay: `${delay}s`,
                }}
              />
            ))}

            {/* Floating data dots — with actual float animation */}
            {[
              { x: '8%',  y: '22%', delay: 1.6,  dur: 3.2, size: 'h-1.5 w-1.5', color: 'bg-rose-400',    dx1: '6px',  dy1: '-10px', dx2: '-4px', dy2: '-18px' },
              { x: '92%', y: '25%', delay: 1.75, dur: 4.1, size: 'h-1 w-1',     color: 'bg-indigo-400',  dx1: '-8px', dy1: '-8px',  dx2: '4px',  dy2: '-16px' },
              { x: '5%',  y: '70%', delay: 1.85, dur: 3.7, size: 'h-1 w-1',     color: 'bg-white/50',    dx1: '5px',  dy1: '-12px', dx2: '-3px', dy2: '-20px' },
              { x: '95%', y: '65%', delay: 1.7,  dur: 3.5, size: 'h-1.5 w-1.5', color: 'bg-rose-300',    dx1: '-6px', dy1: '-9px',  dx2: '3px',  dy2: '-15px' },
              { x: '18%', y: '80%', delay: 2.1,  dur: 4.4, size: 'h-1 w-1',     color: 'bg-cyan-400',    dx1: '7px',  dy1: '-11px', dx2: '-5px', dy2: '-19px' },
              { x: '82%', y: '78%', delay: 2.4,  dur: 3.9, size: 'h-1 w-1',     color: 'bg-violet-400',  dx1: '-5px', dy1: '-13px', dx2: '6px',  dy2: '-21px' },
              { x: '35%', y: '10%', delay: 2.0,  dur: 4.8, size: 'h-0.5 w-0.5', color: 'bg-white/30',    dx1: '4px',  dy1: '-7px',  dx2: '-2px', dy2: '-14px' },
              { x: '65%', y: '88%', delay: 2.6,  dur: 3.3, size: 'h-0.5 w-0.5', color: 'bg-emerald-400', dx1: '-3px', dy1: '-10px', dx2: '5px',  dy2: '-17px' },
            ].map((dot, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: dot.delay }}
                className={cn('pointer-events-none absolute rounded-full sp-particle', dot.size, dot.color)}
                style={{
                  left: dot.x, top: dot.y,
                  animationDelay: `${dot.delay}s`,
                  animationDuration: `${dot.dur}s`,
                  '--dx1': dot.dx1, '--dy1': dot.dy1,
                  '--dx2': dot.dx2, '--dy2': dot.dy2,
                } as React.CSSProperties}
              />
            ))}

            {/* Glowing breathe orbs — richer ambient */}
            <div className="sp-glow-breathe pointer-events-none absolute left-1/4 top-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-cyan-500/10" />
            <div className="sp-glow-breathe pointer-events-none absolute right-1/4 top-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-rose-500/10" style={{ animationDelay: '2.5s' }} />

            {/* Bottom accent bar — animated gradient chase */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, #f43f5e, #818cf8, #06b6d4, #f43f5e)',
                backgroundSize: '300% 100%',
                animation: 'sp-border-chase 4s linear infinite',
              }}
            />
          </div>
        </header>

        {/* Toolbar row: presenter + icon actions */}
        <div className="mb-3 flex items-center gap-2">
          <PresenterToolbar
            modeState={presenterMode}
            isPresenter={isPresenter}
            onStart={startSession}
            onEnd={endSession}
            onJoin={handleJoinSession}
          />
          <PresenterAnnotationOverlay active={annotationMode} isPresenter={isPresenter} />
          <div className="ml-auto flex items-center gap-1.5">
            {/* Annotate — presenter only */}
            {isPresenter && presenterMode.role === 'presenter' && (
              <button
                onClick={() => setAnnotationMode((v) => !v)}
                title={annotationMode ? 'Exit Draw' : 'Annotate'}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm transition',
                  annotationMode
                    ? 'border-violet-400 bg-violet-600 text-white'
                    : 'border-slate-200 bg-white/70 text-slate-500 backdrop-blur hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700'
                )}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {/* Refresh Data */}
            <button
              onClick={handleRefresh}
              title="Refresh data"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/70 text-slate-500 shadow-sm backdrop-blur transition hover:bg-slate-50 hover:text-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <UnifiedExportButton
              onExport={handleExportStudioPulse}
              isExporting={isExportingPulse}
            />
            {/* Master toggle — expand/collapse all section toggles */}
            <button
              onClick={handleMasterToggle}
              title={allTogglesOn ? 'Collapse all sections' : 'Expand all sections'}
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold shadow-sm backdrop-blur transition',
                allTogglesOn
                  ? 'border-emerald-400 bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
              )}
            >
              {allTogglesOn ? <ChevronsUpDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5" />}
              {allTogglesOn ? 'Collapse All' : 'Expand All'}
            </button>
            {/* Report Mode toggle */}
            <button
              onClick={handleOpenReport}
              disabled={reportLoading}
              title="Generate AI Report for current filters"
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold shadow-sm backdrop-blur transition',
                reportLoading
                  ? 'border-blue-300 bg-blue-50 text-blue-400 cursor-not-allowed'
                  : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
              )}
            >
              {reportLoading ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
              ) : (
                <BookOpen className="h-3.5 w-3.5" />
              )}
              {reportLoading ? 'Generating…' : 'Report'}
            </button>
            {/* Refresh Summaries */}
            <button
              onClick={handleRefreshSummaries}
              disabled={summaryRefreshing}
              title={summaryRefreshing ? 'Refreshing summaries…' : 'Refresh AI summaries'}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/70 text-purple-600 shadow-sm backdrop-blur transition hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50"
            >
              <Sparkles className={cn('h-3.5 w-3.5', summaryRefreshing && 'animate-spin')} />
            </button>
            {/* Admin */}
            {isAdmin ? (
              <button
                onClick={lockAdmin}
                title="Lock admin mode"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 shadow-sm transition hover:bg-amber-100"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </button>
            ) : (
              <AdminCodeGate onUnlock={unlockAdmin} error={adminError} />
            )}
          </div>
        </div>

        <div className={viewerLocked ? 'pointer-events-none select-none opacity-80' : ''}>
        {/* Location tabs — full width, centered */}
        <div className="mb-6 w-full rounded-2xl border border-slate-200/70 bg-white/80 p-2 shadow-sm backdrop-blur-sm">
          <div className="flex w-full items-center gap-2">
          {STUDIOS.map((s) => {
            const active = s.id === studio;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStudio(s.id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-center transition-all duration-300',
                  active ? cn('bg-gradient-to-br text-white shadow-md', s.accent) : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <MapPin className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-slate-400')} />
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-bold">{s.name}</span>
                  <span className={cn('text-[10px]', active ? 'text-white/80' : 'text-slate-400')}>{s.area}</span>
                </span>
              </button>
            );
          })}
          </div>
        </div>

        <div className="mb-6">
          <StudioPulseFilterSection
            studio={studio}
            onStudioChange={setStudio}
            studios={STUDIOS}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onReset={handleResetFilters}
          />
        </div>
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSheetStructureCheck(true)}
            className="flex items-center gap-2 border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
            </svg>
            Sheet Structure Check
          </Button>
          <Dialog open={showSheetStructureCheck} onOpenChange={setShowSheetStructureCheck}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-800">Sheet Structure Check</DialogTitle>
                <DialogDescription className="text-slate-500 text-sm">
                  Validates your Google Sheets column structure against the expected schema.
                </DialogDescription>
              </DialogHeader>
              <SheetStructureCheck />
            </DialogContent>
          </Dialog>
        </div>
        </div>{/* end viewer-lock wrapper */}

        <>
        {/* AI Report Loading Overlay */}
        {reportLoading && (
          <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6 max-w-sm text-center">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                <div className="absolute inset-2 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-400" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Georgia, serif' }}>Generating AI Report</p>
                <p className="mt-1 text-sm text-slate-500">Analysing {activeStudio.name} · {dateRange.start} to {dateRange.end}</p>
                <p className="mt-2 text-xs text-slate-400">Gemini is reading your filtered metrics and writing the executive narrative…</p>
              </div>
              <div className="flex gap-1.5">
                {['Sales', 'Sessions', 'Trainers', 'Leads', 'Retention'].map((s, i) => (
                  <span
                    key={s}
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI-Powered Studio Pulse Report */}
        {reportOpen && !reportLoading && (
          <StudioPulseReport
            studioName={activeStudio.name}
            dateRange={dateRange}
            salesStats={{
              gross: salesStats.gross,
              net: salesStats.net,
              txns: salesStats.txns,
              members: salesStats.members,
              discount: salesStats.discount,
              discountPenetration: salesStats.discountPenetration,
              atv: salesStats.atv,
              growth: {
                net: salesStats.growth.net ?? 0,
                gross: salesStats.growth.gross ?? 0,
                txns: salesStats.growth.txns ?? 0,
                members: salesStats.growth.members ?? 0,
              },
            }}
            sessionStats={{
              totalSessions: sessionStats.totalSessions,
              attendance: sessionStats.attendance,
              avgFill: sessionStats.avgFill,
              empty: sessionStats.empty,
            }}
            sessionIntelligenceRows={sessionIntelligence.rows.map((r) => ({
              name: r.name,
              sessions: r.sessions,
              visits: r.visits,
              capacity: r.capacity,
              fillRate: r.fillRate,
              lateCancels: r.lateCancels ?? 0,
              cancellationRate: r.cancellationRate ?? 0,
              compositeScore: r.compositeScore ?? 0,
              revenue: r.revenue ?? 0,
            }))}
            classSlotRows={reportSlotRows}
            trainerRows={trainerRankingsExtended.rows.map((t) => ({
              name: t.name,
              sessions: t.sessions,
              customers: t.customers,
              classAvg: t.classAvg,
              paid: t.paid,
              fillRate: t.fillRate,
              utilization: t.utilization,
              conversionRate: t.conversionRate,
              retentionRate: t.retentionRate,
              revenueScore: t.revenueScore,
              lateCancels: t.lateCancels,
              totalNew: t.totalNew,
              totalConverted: t.totalConverted,
              rank: t.rank,
            }))}
            clientStats={{
              newClients: clientStats.newClients,
              converted: clientStats.converted,
              retained: clientStats.retained,
              conversionRate: clientStats.conversionRate,
              retentionRate: clientStats.retentionRate,
              avgLtv: clientStats.avgLtv,
              lapsed: clientStats.lapsed,
            }}
            funnelRows={funnelRankings.rows.map((f) => ({
              name: f.name,
              leads: f.leads,
              trials: f.trials,
              converted: f.converted,
              conversionRate: f.conversionRate,
              ltv: f.ltv,
              membershipsBought: f.membershipsBought,
              retained: f.retained,
            }))}
            lcStats={{ total: lcStats.total, sameDay: lcStats.sameDay, penalty: lcStats.penalty }}
            expirationStats={{
              total: expirationStats.total,
              lapsed: expirationStats.lapsed,
              renewed: expirationStats.renewed,
              churned: expirationStats.churned,
              lapsedPct: expirationStats.lapsedPct,
              avgLtvLapsed: expirationStats.avgLtvLapsed,
            }}
            lapsedByMembership={lapsedByMembership}
            salesMatrix={salesMetricsMatrix}
            getSummary={(key: string) => {
              if (!aiNarrative) return null;
              const map: Record<string, string[]> = {
                executive: [aiNarrative.executiveSummary],
                revenue: [aiNarrative.revenueNarrative],
                operations: [aiNarrative.operationsNarrative],
                clients: [aiNarrative.clientNarrative],
                highlights: aiNarrative.highlights,
                concerns: aiNarrative.concerns,
                recommendations: aiNarrative.recommendations,
                verdict: [aiNarrative.overallVerdict],
                management: aiNarrative.managementLines,
              };
              const bullets = map[key];
              return bullets ? { bullets } : null;
            }}
            sectionEdits={sectionEdits}
            onClose={() => { setReportOpen(false); setAiNarrative(null); }}
          />
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={studio}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="space-y-10"
          >
            <AnimatedSectionCard
              title="Studio Overview"
              subtitle={`${activeStudio.name} · ${dateRange.start} to ${dateRange.end}`}
              icon={Sparkles}
              iconGradient="from-slate-700 to-slate-900"
              iconColor="#1e293b"
              sectionNumber={1}
              action={
                <div className="flex items-center gap-2">
                  {isSummaryEditing && (
                    <Button variant="outline" size="sm" onClick={() => { try { localStorage.setItem('sp_summary_text', editableSummaryText); } catch {} setIsSummaryEditing(false); }}>Save</Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { setIsSummaryEditing((v) => !v); if (!isSummaryEditing && !editableSummaryText) { setEditableSummaryText((aiSummary?.bullets ?? locationSummary.sections.flatMap((s) => s.bullets)).map((b) => `• ${b}`).join('\n')); } }}>
                    {isSummaryEditing ? 'Cancel' : 'Edit'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setInsightOpen(true)}>Expand</Button>
                </div>
              }
              onAIPanel={() => openAIPanel('main', 'Studio Overview')}
            >
            <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StudioPulseMetricCard
                icon={<CircleDollarSign className="h-5 w-5" />}
                title="Net Sales"
                metric={salesStats.net}
                precision={0}
                formatter={formatCurrency}
                growthLabel="MoM"
                growthValue={salesStats.growth.net}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={salesStats.yoyGrowth.net}
                sparklineData={revenueSparkline}
                sparklineLabels={revenueSparklineLabels}
                backSparklineData={backRevenueSparkline}
                backSparklineLabels={backRevenueSparklineLabels}
                tooltipContent="Net sales after VAT. Tracks retained revenue quality across the active period."
                subtext={`Gross ${formatCurrency(salesStats.gross)} · Discount ${formatCurrency(salesStats.discount)}`}
                iconContainerClassName="bg-gradient-to-br from-emerald-600 to-green-700 text-white"
                onClick={() => openMetricDrillDown('Net Sales', 'metric', { name: 'Net Sales', rawData: filteredSales, filteredTransactionData: filteredSales }, filteredSales)}
                isLoading={salesLoading}
              />
              <StudioPulseMetricCard
                icon={<Wallet className="h-5 w-5" />}
                title="Units Sold"
                metric={salesStats.txns}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={salesStats.growth.txns}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={salesStats.yoyGrowth.txns}
                sparklineData={unitsSoldSparkline}
                sparklineLabels={revenueSparklineLabels}
                backSparklineData={backUnitsSoldSparkline}
                backSparklineLabels={backRevenueSparklineLabels}
                tooltipContent="Completed sales transactions in the active window. Useful for purchase volume tracking."
                subtext={`ATV ${formatCurrency(salesStats.atv)} · ${formatPercentage(salesStats.discountPenetration)} discounted`}
                iconContainerClassName="bg-gradient-to-br from-blue-700 to-blue-900 text-white"
                onClick={() => openMetricDrillDown('Units Sold', 'product', { name: 'Units Sold', rawData: filteredSales, filteredTransactionData: filteredSales }, filteredSales)}
                isLoading={salesLoading}
              />
              <StudioPulseMetricCard
                icon={<Users className="h-5 w-5" />}
                title="Unique Members"
                metric={salesStats.members}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={salesStats.growth.members}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={salesStats.yoyGrowth.members}
                sparklineData={uniqueMembersSparkline}
                sparklineLabels={revenueSparklineLabels}
                backSparklineData={backUniqueMembersSparkline}
                backSparklineLabels={backRevenueSparklineLabels}
                tooltipContent="Distinct purchasing members. Shows customer reach across the active sales mix."
                subtext="Unique buyers in the active period"
                iconContainerClassName="bg-gradient-to-br from-slate-700 to-slate-900 text-white"
                onClick={() => openMetricDrillDown('Unique Members', 'member', { name: 'Unique Members', rawData: filteredSales, filteredTransactionData: filteredSales }, filteredSales)}
                isLoading={salesLoading}
              />
              <StudioPulseMetricCard
                icon={<Zap className="h-5 w-5" />}
                title="Lapsed Members"
                metric={expirationStats.total}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={expirationStats.momGrowth}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={expirationStats.yoyGrowth}
                sparklineData={lapsedCountSparkline}
                sparklineLabels={lapsedCountSparklineLabels}
                backSparklineData={backLapsedMembersSparkline}
                backSparklineLabels={backRevenueSparklineLabels}
                tooltipContent="Members whose memberships expired in the selected period, sourced from the Expirations sheet."
                subtext={`${formatNumber(expirationStats.churned)} churned · memberships expired`}
                iconContainerClassName="bg-gradient-to-br from-slate-600 to-slate-800 text-white"
                onClick={() => openMetricDrillDown('Lapsed Members', 'client', { name: 'Lapsed Members', rawData: filteredExpirations as any, filteredTransactionData: filteredExpirations as any }, filteredExpirations as any)}
                isLoading={expLoading}
              />
              <StudioPulseMetricCard
                icon={<LineChart className="h-5 w-5" />}
                title="Visits"
                metric={sessionStats.attendance}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={sessionStats.growth.attendance}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={sessionStats.yoyGrowth.attendance}
                sparklineData={attendanceSparkline}
                sparklineLabels={attendanceSparklineLabels}
                backSparklineData={backAttendanceSparkline}
                backSparklineLabels={backAttendanceSparklineLabels}
                tooltipContent="Total check-ins across sessions in the selected period."
                subtext={`${formatNumber(sessionStats.totalSessions)} sessions · Avg ${formatNumber(sessionStats.classAvg)} per non-empty class`}
                iconContainerClassName="bg-gradient-to-br from-cyan-600 to-blue-700 text-white"
                onClick={() => openMetricDrillDown('Visits', 'location', { name: activeStudio.name, rawData: filteredSessions, filteredTransactionData: filteredSessions }, filteredSessions)}
                isLoading={sessionsLoading}
              />
              <StudioPulseMetricCard
                icon={<Scan className="h-5 w-5" />}
                title="Sessions Conducted"
                metric={sessionStats.totalSessions}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={sessionStats.growth.totalSessions}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={sessionStats.yoyGrowth.totalSessions}
                sparklineData={attendanceSparkline}
                sparklineLabels={attendanceSparklineLabels}
                backSparklineData={backSessionsSparkline}
                backSparklineLabels={backAttendanceSparklineLabels}
                tooltipContent="All conducted sessions during the selected period."
                subtext={`Fill rate ${formatPercentage(sessionStats.avgFill)} · Empty share ${formatPercentage(sessionStats.emptyShare)}`}
                iconContainerClassName="bg-gradient-to-br from-sky-600 to-cyan-700 text-white"
                onClick={() => openMetricDrillDown('Sessions Conducted', 'location', { name: activeStudio.name, rawData: filteredSessions, filteredTransactionData: filteredSessions }, filteredSessions)}
                isLoading={sessionsLoading}
              />
              <StudioPulseMetricCard
                icon={<UserPlus className="h-5 w-5" />}
                title="Class Average"
                metric={sessionStats.classAvg}
                precision={1}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={sessionStats.growth.classAvg}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={sessionStats.yoyGrowth.classAvg}
                sparklineData={attendanceSparkline}
                sparklineLabels={attendanceSparklineLabels}
                backSparklineData={backClassAvgSparkline}
                backSparklineLabels={backAttendanceSparklineLabels}
                tooltipContent="Average check-ins per non-empty class. Indicates delivery density."
                subtext="Average check-ins per non-empty class"
                iconContainerClassName="bg-gradient-to-br from-teal-600 to-emerald-700 text-white"
                onClick={() => openMetricDrillDown('Class Average', 'trainer', { name: activeStudio.name, rawData: filteredSessions, filteredTransactionData: filteredSessions }, filteredSessions)}
                isLoading={sessionsLoading}
              />
              <StudioPulseMetricCard
                icon={<Target className="h-5 w-5" />}
                title="Fill Rate"
                metric={sessionStats.avgFill}
                precision={0}
                metricUnit="%"
                formatter={(value) => `${Math.round(value)}%`}
                growthLabel="MoM"
                growthValue={sessionStats.growth.avgFill}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={sessionStats.yoyGrowth.avgFill}
                sparklineData={fillSparkline}
                backSparklineData={backFillSparkline}
                backSparklineLabels={backAttendanceSparklineLabels}
                tooltipContent="Capacity utilization across all sessions in the selected period."
                subtext={`${formatPercentage(sessionStats.emptyShare)} empty-session share`}
                iconContainerClassName="bg-gradient-to-br from-orange-600 to-red-700 text-white"
                onClick={() => openMetricDrillDown('Fill Rate', 'location', { name: activeStudio.name, rawData: filteredSessions, filteredTransactionData: filteredSessions }, filteredSessions)}
                isLoading={sessionsLoading}
              />
              <StudioPulseMetricCard
                icon={<Repeat className="h-5 w-5" />}
                title="Revenue / Visit"
                metric={revenuePerVisitStats.value}
                precision={0}
                formatter={formatCurrency}
                growthLabel="MoM"
                growthValue={revenuePerVisitStats.momGrowth}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={revenuePerVisitStats.yoyGrowth}
                sparklineData={revenueSparkline}
                sparklineLabels={revenueSparklineLabels}
                backSparklineData={backRevenuePerVisitSparkline}
                backSparklineLabels={backRevenueSparklineLabels}
                tooltipContent="Net sales divided by session visits. Indicates monetization efficiency per visit."
                subtext={`${formatNumber(sessionStats.attendance)} visits · ${formatNumber(sessionStats.totalSessions)} sessions`}
                iconContainerClassName="bg-gradient-to-br from-rose-600 to-pink-700 text-white"
                onClick={() => openMetricDrillDown('Revenue / Visit', 'metric', { name: 'Revenue / Visit', rawData: filteredSessions, filteredTransactionData: filteredSessions }, filteredSessions)}
                isLoading={salesLoading || sessionsLoading}
              />
              <StudioPulseMetricCard
                icon={<CalendarClock className="h-5 w-5" />}
                title="Late Cancellations"
                metric={lcStats.total}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={lcStats.growth.total}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={pctChange(lcStats.total, previousYearLateCancels.length)}
                sparklineData={lateCancelSparkline}
                backSparklineData={backLateCancelSparkline}
                tooltipContent="Late cancellations in the selected period. High values signal revenue leakage and scheduling friction."
                subtext={`${formatNumber(lcStats.sameDay)} same-day · Penalties ${formatCurrency(lcStats.penalty)}`}
                iconContainerClassName="bg-gradient-to-br from-amber-600 to-orange-700 text-white"
                onClick={() => openMetricDrillDown('Late Cancellations', 'location', { name: activeStudio.name, rawData: filteredLateCancels, filteredTransactionData: filteredLateCancels }, filteredLateCancels)}
                isLoading={lcLoading}
              />
              <StudioPulseMetricCard
                icon={<TrendingUp className="h-5 w-5" />}
                title="Rev / New Client"
                metric={revenuePerNewClientStats.value}
                precision={0}
                formatter={formatCurrency}
                growthLabel="MoM"
                growthValue={revenuePerNewClientStats.momGrowth}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={revenuePerNewClientStats.yoyGrowth}
                sparklineData={revenueSparkline}
                sparklineLabels={revenueSparklineLabels}
                tooltipContent="Net revenue divided by new clients acquired. Measures how much revenue each new client drives."
                subtext={`${formatNumber(clientStats.newClients)} new clients · ${formatCurrency(salesStats.net)} net`}
                iconContainerClassName="bg-gradient-to-br from-violet-600 to-purple-800 text-white"
                isLoading={salesLoading || clientsLoading}
              />
              <StudioPulseMetricCard
                icon={<Percent className="h-5 w-5" />}
                title="Discount Efficiency"
                metric={discountEfficiency.efficiency}
                precision={2}
                formatter={(v) => `₹${v.toFixed(2)}`}
                growthLabel="MoM"
                growthValue={discountEfficiency.momGrowth}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={discountEfficiency.yoyGrowth}
                sparklineData={revenueSparkline}
                sparklineLabels={revenueSparklineLabels}
                backSparklineData={backDiscountEfficiencySparkline}
                backSparklineLabels={revenueSparklineLabels}
                tooltipContent="Net revenue generated per ₹1 discounted. Above ₹1 = discount driving net-positive sales."
                subtext={`${formatNumber(discountEfficiency.discountedTxns)} discounted txns · ${formatCurrency(discountEfficiency.totalDiscount)} total discount`}
                iconContainerClassName="bg-gradient-to-br from-amber-500 to-orange-700 text-white"
                isLoading={salesLoading}
              />
              <StudioPulseMetricCard
                icon={<TrendingUp className="h-5 w-5" />}
                title="Package Sell-through"
                metric={packageSellThrough.rate}
                precision={1}
                metricUnit="%"
                formatter={(v) => `${v.toFixed(1)}%`}
                growthLabel="MoM"
                growthValue={packageSellThrough.momGrowth}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={packageSellThrough.yoyGrowth}
                sparklineData={revenueSparkline}
                sparklineLabels={revenueSparklineLabels}
                backSparklineData={backPackageSellThroughSparkline}
                backSparklineLabels={revenueSparklineLabels}
                tooltipContent="Classes used vs. classes purchased across all active class packs."
                subtext={`${formatNumber(packageSellThrough.usedClasses)} used of ${formatNumber(packageSellThrough.totalClasses)} purchased`}
                iconContainerClassName="bg-gradient-to-br from-sky-500 to-cyan-700 text-white"
                isLoading={sessionsLoading || checkinsLoading}
              />
              <StudioPulseMetricCard
                icon={<Repeat className="h-5 w-5" />}
                title="Repeat Purchase Rate"
                metric={repeatPurchaseRate.rate}
                precision={1}
                metricUnit="%"
                formatter={(v) => `${v.toFixed(1)}%`}
                growthLabel="MoM"
                growthValue={repeatPurchaseRate.momGrowth}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={repeatPurchaseRate.yoyGrowth}
                sparklineData={revenueSparkline}
                sparklineLabels={revenueSparklineLabels}
                backSparklineData={backRepeatPurchaseSparkline}
                backSparklineLabels={revenueSparklineLabels}
                tooltipContent="% of members who made more than one purchase in the selected period."
                subtext={`${formatNumber(repeatPurchaseRate.repeaters)} repeat of ${formatNumber(repeatPurchaseRate.total)} members`}
                iconContainerClassName="bg-gradient-to-br from-emerald-500 to-green-800 text-white"
                isLoading={salesLoading}
              />
              <StudioPulseMetricCard
                icon={<CircleDollarSign className="h-5 w-5" />}
                title="Avg Order Value"
                metric={avgOrderValue.value}
                precision={0}
                formatter={formatCurrency}
                growthLabel="MoM"
                growthValue={avgOrderValue.momGrowth}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={avgOrderValue.yoyGrowth}
                sparklineData={revenueSparkline}
                sparklineLabels={revenueSparklineLabels}
                backSparklineData={backAvgOrderValueSparkline}
                backSparklineLabels={revenueSparklineLabels}
                tooltipContent="Average gross order value per transaction in the selected period."
                subtext={`${formatNumber(salesStats.txns)} transactions · ${formatCurrency(salesStats.gross)} gross`}
                iconContainerClassName="bg-gradient-to-br from-indigo-500 to-blue-800 text-white"
                isLoading={salesLoading}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08)]">
              <div className="p-6 space-y-6">
                {aiLoading ? (
                  <div className="flex items-center gap-3 text-slate-500 py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
                    <span className="text-sm font-medium">Generating AI summary…</span>
                  </div>
                ) : isSummaryEditing ? (
                  <textarea
                    className="w-full min-h-[220px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-y font-medium"
                    value={editableSummaryText}
                    onChange={(e) => setEditableSummaryText(e.target.value)}
                    placeholder="Write your studio summary here. Use • to start bullet points."
                  />
                ) : editableSummaryText ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {editableSummaryText.split('\n').filter(Boolean).map((line, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-500" />
                        <span className="text-[13px] font-medium leading-relaxed text-slate-700">{line.replace(/^[•\-]\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                ) : (() => {
                  const bullets = aiSummary?.bullets ?? locationSummary.sections.flatMap((s) => s.bullets);
                  const narrative = aiSummary?.narrative;
                  return (
                    <div className="space-y-6">
                      {/* Narrative */}
                      {narrative ? (
                        <p className="text-[15px] leading-[1.75] text-slate-800 font-normal tracking-[-0.01em]">{narrative}</p>
                      ) : (
                        <p className="text-[15px] leading-[1.75] text-slate-800 font-normal tracking-[-0.01em]">
                          {`${activeStudio.name} recorded ${formatCurrency(salesStats.net)} net sales across ${formatNumber(salesStats.txns)} transactions with ${formatNumber(sessionStats.attendance)} visits across ${formatNumber(sessionStats.totalSessions)} sessions (${formatPercentage(sessionStats.avgFill)} avg fill). ${clientStats.newClients} new clients entered the funnel — ${formatPercentage(clientStats.conversionRate)} converted, ${formatPercentage(clientStats.retentionRate)} retained. ${expirationStats.total} memberships lapsed with ${expirationStats.churned} classified as churned.`}
                        </p>
                      )}
                      {/* Key insights */}
                      <div>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Key Insights</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {bullets.map((b, i) => (
                            <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />
                              <span className="text-[13px] font-medium leading-relaxed text-slate-700">{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            </div>
            </AnimatedSectionCard>

            <AnimatedSectionCard title="Sales Metrics" subtitle="Month-on-month table and seller lists" icon={CircleDollarSign} iconGradient="from-blue-600 to-blue-900" iconColor="#1d4ed8" sectionNumber={2} onAIPanel={() => openAIPanel('sales', 'Sales Metrics')}>
              <div className="space-y-6">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                          <CircleDollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold">Monthly sales metrics matrix</h4>
                          <p className="text-xs text-white/75">Metrics appear in the first column followed by month columns for the active studio across the full available sales history.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-white/20 font-semibold text-white">
                          {salesMetricsMatrix.metricRows.length} metrics
                        </Badge>
                        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">MoM</span>
                          <Switch checked={showMomTable} onCheckedChange={setShowMomTable} />
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">Rankings</span>
                          <Switch checked={showSalesRankings} onCheckedChange={setShowSalesRankings} />
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">Discount Codes</span>
                          <Switch checked={showDiscountCodes} onCheckedChange={setShowDiscountCodes} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-px w-full overflow-hidden bg-gradient-to-r from-transparent via-blue-400 to-transparent">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-pulse duration-[3000ms]"></div>
                  </div>
                  {salesMetricsMatrix.months.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <thead className="sticky top-0 z-30">
                          <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                            <th className="sticky left-0 z-40 min-w-[280px] bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-white border-r border-white/20">Metric</th>
                            {salesMetricsMatrix.months.map((month) => (
                              <th key={month} className={`min-w-[90px] border-l border-white/20 px-3 py-3 text-center text-xs font-bold uppercase tracking-wider ${month === activeMatrixMonthKey ? 'bg-blue-800 text-white' : 'text-white'}`}>
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-1">
                                    {month === activeMatrixMonthKey ? <Star className="h-3 w-3" /> : null}
                                    <span className="text-xs font-bold whitespace-nowrap">{salesMetricsMatrix.monthLabels[month].split(' ')[0]}</span>
                                  </div>
                                  <span className={`text-xs ${month === activeMatrixMonthKey ? 'text-blue-100' : 'text-slate-300'}`}>{salesMetricsMatrix.monthLabels[month].split(' ')[1]}</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {salesMetricsMatrix.metricRows.map((row, rowIdx) => (
                            <tr key={`${rowIdx}-${row.label}`} className="h-[35px] bg-white">
                              <td className="sticky left-0 z-10 min-w-[280px] border-b border-gray-200 bg-white px-4 py-2 font-medium leading-none text-slate-900 border-r border-gray-200">
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    className="flex-1 cursor-pointer text-left hover:text-blue-700"
                                    onClick={() => openSalesMatrixDrillDown(row)}
                                    title={`Open analytics for ${row.label}`}
                                  >
                                    {row.label}
                                  </button>
                                  <TooltipProvider delayDuration={120}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-700" aria-label={`About ${row.label}`}>
                                          <CircleAlert className="h-3.5 w-3.5" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" align="start" className="max-w-sm rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
                                        <div className="space-y-3">
                                          <div>
                                            <p className="text-sm font-semibold text-slate-950">{row.label}</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-600">{salesMetricDefinitions[row.label]?.definition || 'Metric definition unavailable.'}</p>
                                          </div>
                                          <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Formula</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-700">{salesMetricDefinitions[row.label]?.formula || 'N/A'}</p>
                                          </div>
                                          <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">What It Tells You</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-700">{salesMetricDefinitions[row.label]?.businessMeaning || 'N/A'}</p>
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </td>
                              {salesMetricsMatrix.months.map((month) => (
                                <td
                                  key={`${row.label}-${month}`}
                                  className="h-[35px] border-b border-gray-200 bg-white px-3 py-2 text-center leading-none tabular-nums text-slate-700 cursor-pointer hover:bg-slate-50"
                                  onClick={() => openSalesMatrixDrillDown(row, month)}
                                  title={`Open analytics for ${row.label} in ${salesMetricsMatrix.monthLabels[month]}`}
                                >
                                  {formatSalesMetricCell(row.values[month] || 0, row.type)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-5">
                      <EmptyNote label="No monthly sales metrics available for the selected studio and date range" />
                    </div>
                  )}
                </div>
                {renderAISummary('sales-matrix', [
                  `Latest net sales in ${matrixSummaryStats.latestMonth} closed at ${formatCurrency(matrixSummaryStats.latestNet)}.`,
                  `Average transaction value for the latest month sits at ${formatCurrency(matrixSummaryStats.latestAtv)}.`,
                  `Latest discount penetration is ${formatPercentage(matrixSummaryStats.latestDiscount)}, showing current discount dependence.`,
                  `The matrix remains independent of the date filter and reflects the full available sales history for ${activeStudio.name}.`,
                ])}
                {showMomTable ? (
                  <>
                    <MonthOnMonthTableNew data={sales as any} collapsedGroups={salesCollapsedGroups} contextInfo={{ dateRange: defaultDateRange, location: activeStudio.name }} />
                    {renderAISummary('sales-mom', [
                      'Month columns are sorted newest first, with the active month highlighted for faster scanning.',
                      'Collapse groups to compare top-level categories before drilling into products.',
                      'Click any month cell to open context-aware analytics for that exact category or product slice.',
                    ])}
                  </>
                ) : null}
                {showSalesRankings && <>
                  <UnifiedTopBottomSellers data={filteredSales as any} onRowClick={(row) => openMetricDrillDown(row.title || row.name || 'Seller detail', row.type || 'seller', row, filteredSales)} />
                  {renderAISummary('sales-rankings', [
                    `${salesSellerSummary.topName} is the current top seller across the displayed data.`,
                    `Top-seller share stands at ${formatPercentage(salesSellerSummary.share)}, indicating current concentration risk.`,
                    `The lead over the next seller is ${formatCurrency(salesSellerSummary.gap)}.`,
                  ])}
                </>}

              {/* Product Mix Shift */}
              {productMixByMonth.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                      <BarChart2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Product Mix Shift</h4>
                      <p className="text-xs text-white/60">Memberships · Packages · Intro Offers · Single Classes — month-on-month</p>
                    </div>
                  </div>
                  <div className="p-6 sp-chart-rise" style={{ animationDelay: '0.15s' }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={productMixByMonth} barCategoryGap="28%" margin={{ top: 14, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                        <Bar dataKey="memberships" name="Memberships" fill="#2563eb" shape={<Custom3DBar />} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                        <Bar dataKey="packages"    name="Packages"    fill="#0e7490" shape={<Custom3DBar />} isAnimationActive animationDuration={900} animationEasing="ease-out" animationBegin={80} />
                        <Bar dataKey="introOffers" name="Intro Offers" fill="#7c3aed" shape={<Custom3DBar />} isAnimationActive animationDuration={900} animationEasing="ease-out" animationBegin={160} />
                        <Bar dataKey="singleClasses" name="Single Classes" fill="#be123c" shape={<Custom3DBar />} isAnimationActive animationDuration={900} animationEasing="ease-out" animationBegin={240} />
                        <Bar dataKey="other" name="Other" fill="#475569" shape={<Custom3DBar />} isAnimationActive animationDuration={900} animationEasing="ease-out" animationBegin={320} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Discount Code Performance — toggled */}
              {showDiscountCodes && (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                        <Percent className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Discount Code Performance</h4>
                        <p className="text-xs text-white/50">{discountCodePerf.length} active codes in selected period · sorted by revenue</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-300 border border-amber-500/30">
                      {discountCodePerf.length} codes
                    </span>
                  </div>
                  {discountCodePerf.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                            <th className="border-b border-slate-200 px-5 py-3 text-left font-bold">#</th>
                            <th className="border-b border-slate-200 px-5 py-3 text-left font-bold">Code</th>
                            <th className="border-b border-slate-200 px-4 py-3 text-right font-bold">Revenue</th>
                            <th className="border-b border-slate-200 px-4 py-3 text-right font-bold">Txns</th>
                            <th className="border-b border-slate-200 px-4 py-3 text-right font-bold">Members</th>
                            <th className="border-b border-slate-200 px-4 py-3 text-right font-bold">Avg Order</th>
                            <th className="border-b border-slate-200 px-4 py-3 text-right font-bold">Rev Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {discountCodePerf.map((row, i) => {
                            const totalRev = discountCodePerf.reduce((s, r) => s + r.revenue, 0);
                            const share = totalRev > 0 ? (row.revenue / totalRev) * 100 : 0;
                            return (
                              <tr key={row.code} className={`transition-colors hover:bg-slate-50/80 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                                <td className="px-5 py-2.5 text-[11px] font-bold text-slate-400 tabular-nums">{i + 1}</td>
                                <td className="px-5 py-2.5">
                                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-amber-800">{row.code}</span>
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-900">{formatCurrency(row.revenue)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatNumber(row.txns)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatNumber(row.members)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatCurrency(row.avgOrderValue)}</td>
                                <td className="px-4 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(share, 100)}%` }} />
                                    </div>
                                    <span className="tabular-nums text-xs font-semibold text-slate-500">{share.toFixed(1)}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-900 text-white text-xs font-bold h-[40px]">
                            <td className="px-5 py-2" colSpan={2}>Totals</td>
                            <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(discountCodePerf.reduce((s, r) => s + r.revenue, 0))}</td>
                            <td className="px-4 py-2 text-right tabular-nums">{formatNumber(discountCodePerf.reduce((s, r) => s + r.txns, 0))}</td>
                            <td className="px-4 py-2 text-right tabular-nums">{formatNumber(discountCodePerf.reduce((s, r) => s + r.members, 0))}</td>
                            <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(discountCodePerf.reduce((s, r) => s + r.revenue, 0) / Math.max(discountCodePerf.reduce((s, r) => s + r.txns, 0), 1))}</td>
                            <td className="px-4 py-2 text-right">100%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-slate-400">No discount codes found in selected period.</div>
                  )}
                </div>
              )}
              </div>
            </AnimatedSectionCard>

            <AnimatedSectionCard
              title="New Member Funnel & Conversions"
              subtitle="Lead, trial, conversion, retention, and source performance in one view"
              icon={UserPlus}
              iconGradient="from-emerald-500 to-teal-700"
              iconColor="#059669"
              sectionNumber={3}
              onAIPanel={() => openAIPanel('funnel', 'New Member Funnel & Conversions')}
              action={
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">MoM Table</span>
                    <Switch checked={showNewMemberMomTable} onCheckedChange={setShowNewMemberMomTable} />
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Rankings</span>
                    <Switch checked={showFunnelRankings} onCheckedChange={setShowFunnelRankings} />
                  </div>
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StudioPulseMetricCard icon={<Users className="h-5 w-5" />} title="Leads Received" metric={leadStats.total} formatter={formatNumber} growthLabel="MoM" growthValue={leadStats.growth.total} secondaryGrowthLabel="YoY" secondaryGrowthValue={leadStats.yoyGrowth.total} subtext="All leads captured in the active period" iconContainerClassName="bg-gradient-to-br from-blue-700 to-slate-900 text-white" backSparklineData={backNewClientSparkline} backSparklineLabels={backClientSparklineLabels} isLoading={leadsLoading} />
                <StudioPulseMetricCard icon={<Zap className="h-5 w-5" />} title="Trials / First Visits" metric={clientStats.newClients} formatter={formatNumber} growthLabel="MoM" growthValue={clientStats.growth.newClients} secondaryGrowthLabel="YoY" secondaryGrowthValue={clientStats.yoyGrowth.newClients} subtext="Unique first visits from New sheet" iconContainerClassName="bg-gradient-to-br from-cyan-600 to-blue-800 text-white" backSparklineData={backNewClientSparkline} backSparklineLabels={backClientSparklineLabels} isLoading={clientsLoading} />
                <StudioPulseMetricCard icon={<Target className="h-5 w-5" />} title="Converted Members" metric={clientStats.converted} formatter={formatNumber} growthLabel="MoM" growthValue={clientStats.growth.converted} secondaryGrowthLabel="YoY" secondaryGrowthValue={clientStats.yoyGrowth.converted} subtext={`${formatPercentage(clientStats.conversionRate)} conversion rate`} iconContainerClassName="bg-gradient-to-br from-emerald-600 to-teal-800 text-white" backSparklineData={backConvertedSparkline} backSparklineLabels={backClientSparklineLabels} isLoading={clientsLoading} />
                <StudioPulseMetricCard icon={<Wallet className="h-5 w-5" />} title="Retained Members" metric={clientStats.retained} formatter={formatNumber} growthLabel="MoM" growthValue={clientStats.growth.retained} secondaryGrowthLabel="YoY" secondaryGrowthValue={clientStats.yoyGrowth.retained} subtext={`${formatPercentage(clientStats.retentionRate)} retained · Avg LTV ${formatCurrency(clientStats.avgLtv)}`} iconContainerClassName="bg-gradient-to-br from-amber-600 to-orange-800 text-white" backSparklineData={backRetainedSparkline} backSparklineLabels={backClientSparklineLabels} isLoading={clientsLoading} />
              </div>

              {showNewMemberMomTable && (
                <div className="mt-6">
                  <ClientConversionMonthOnMonthByTypeTable
                    data={studioWideClients}
                    onRowClick={(row) => {
                      const matched = row.clients ?? studioWideClients.filter((c) => c.isNew === row.type);
                      openMetricDrillDown(row.type || 'Client type detail', 'member', { name: row.type, rawData: matched, filteredTransactionData: matched }, matched);
                    }}
                  />
                </div>
              )}

              {/* Membership Purchases Table — always shown */}
              <div className="mt-6">
                <NewClientMembershipPurchasesTable
                  data={filteredClients}
                  onRowClick={(row) => {
                    const rowName = (row.name || '').trim().toLowerCase();
                    const newCohort = filteredClients.filter((c) => isInNewClientCohort(c));
                    const matched = newCohort.filter((c) => {
                      const memberships = String(c.membershipsBoughtPostTrial || '')
                        .split(',')
                        .map((m) => m.trim().toLowerCase())
                        .filter(Boolean);
                      return memberships.some((m) =>
                        m === rowName || m.includes(rowName) || rowName.includes(m)
                      );
                    });
                    const drillData = matched.length > 0 ? matched : newCohort;
                    openMetricDrillDown(
                      row.name || 'Membership detail',
                      'client',
                      { name: row.name, rawData: drillData, filteredTransactionData: drillData },
                      drillData
                    );
                  }}
                />
              </div>

              {/* Conversion Pipeline — reference style */}
              {(() => {
                const PILL_COLORS = ['#2563eb','#16a34a','#dc2626','#d97706','#7c3aed','#0891b2'];
                const activeIdx = funnelActiveIdx;
                const setActiveIdx = setFunnelActiveIdx;
                const srcFilter = funnelSrcFilter;
                const setSrcFilter = setFunnelSrcFilter;

                // Source-filtered funnel values
                const srcLeads = srcFilter ? filteredLeads.filter(l => (l.source || 'Unknown') === srcFilter) : filteredLeads;
                const srcClients = srcFilter
                  ? filteredClients.filter(c => {
                      const matchedLead = filteredLeads.find(l => (l.memberId && l.memberId === c.memberId) || (l.email && l.email.toLowerCase() === c.email?.toLowerCase()));
                      return matchedLead ? (matchedLead.source || 'Unknown') === srcFilter : false;
                    })
                  : filteredClients;
                const srcLeadTotal = srcLeads.length;
                const srcTrials = srcClients.filter(c => isInNewClientCohort(c)).length;
                const srcConverted = srcClients.filter(c => c.conversionStatus === 'Converted' && isInNewClientCohort(c)).length;
                const srcRetained = srcClients.filter(c => c.retentionStatus === 'Retained' && isInNewClientCohort(c)).length;

                const fStages = [
                  { id: 'leads',     label: 'Leads',     sub: '100% captured',                                 value: srcLeadTotal,  pctOfLeads: 100,    fromPrev: null as number|null, dropPct: null as number|null, accent: '#1e3a8a', light: '#eff6ff', textOnLight: '#1d4ed8' },
                  { id: 'trials',    label: 'Trials',    sub: `${srcLeadTotal ? ((srcTrials/srcLeadTotal)*100).toFixed(1) : 0}% lead → trial`,  value: srcTrials,     pctOfLeads: srcLeadTotal ? (srcTrials/srcLeadTotal)*100 : 0,    fromPrev: srcLeadTotal ? (srcTrials/srcLeadTotal)*100 : null,    dropPct: srcLeadTotal && srcTrials < srcLeadTotal ? Math.round(((srcLeadTotal-srcTrials)/srcLeadTotal)*100) : null, accent: '#164e63', light: '#ecfeff', textOnLight: '#0e7490' },
                  { id: 'retained',  label: 'Retained',  sub: 'Active members',                               value: srcRetained,  pctOfLeads: srcLeadTotal ? (srcRetained/srcLeadTotal)*100 : 0,  fromPrev: srcTrials ? (srcRetained/srcTrials)*100 : null, dropPct: srcTrials && srcRetained < srcTrials ? Math.round(((srcTrials-srcRetained)/srcTrials)*100) : null, accent: '#4c1d95', light: '#faf5ff', textOnLight: '#6d28d9' },
                  { id: 'converted', label: 'Converted', sub: `${srcLeadTotal ? ((srcConverted/srcLeadTotal)*100).toFixed(1) : 0}% overall`,  value: srcConverted, pctOfLeads: srcLeadTotal ? (srcConverted/srcLeadTotal)*100 : 0, fromPrev: srcRetained ? (srcConverted/srcRetained)*100 : null, dropPct: null, accent: '#14532d', light: '#f0fdf4', textOnLight: '#15803d' },
                ];
                const active = fStages[activeIdx];

                // SVG layout constants
                const CX = 300;
                const MAX_HW = 220; // half-width of leads
                const MIN_HW = 72;  // minimum so bottom stages are visible
                const STAGE_H = 130; // height per stage
                const GAP = 4;       // gap between stages
                const TOP_PAD = 30;
                const leadVal = fStages[0].value || 1;
                // Half-widths proportionate to value, monotonically narrowing
                const hwRaw = fStages.map(s => Math.max(MIN_HW, (s.value / leadVal) * MAX_HW));
                const hw = hwRaw.reduce<number[]>((acc, w, i) => {
                  acc.push(i === 0 ? w : Math.min(w, acc[i - 1]));
                  return acc;
                }, []);
                // Compute Y positions dynamically
                const yTops = fStages.map((_, i) => TOP_PAD + i * (STAGE_H + GAP));
                const yBots = yTops.map(y => y + STAGE_H);
                const SVG_H = yBots[3] + 70; // total svg height
                const svgStages = fStages.map((_, i) => {
                  const tl = CX - hw[i], tr = CX + hw[i];
                  const nextHw = i < 3 ? hw[i + 1] : hw[i] * 0.85;
                  const bl = CX - nextHw, br = CX + nextHw;
                  const yt = yTops[i], yb = yBots[i];
                  const midY = Math.round((yt + yb) / 2);
                  const isLast = i === 3;
                  // last stage: rounded pill bottom
                  const path = isLast
                    ? `M ${bl},${yt} L ${br},${yt} L ${br + 18},${yt + 40} C ${br + 24},${yt + 75} ${br + 10},${yt + STAGE_H} ${CX + 60},${yt + STAGE_H} C ${CX + 20},${yt + STAGE_H + 18} ${CX - 20},${yt + STAGE_H + 18} ${CX - 60},${yt + STAGE_H} C ${bl - 10},${yt + STAGE_H} ${bl - 24},${yt + 75} ${bl - 18},${yt + 40} Z`
                    : `M ${tl},${yt} L ${tr},${yt} L ${br},${yb} L ${bl},${yb} Z`;
                  const hl = i === 0 ? `M ${tl + 12},${yt + 8} L ${tr - 12},${yt + 8} L ${tr - 20},${yt + 44} L ${tl + 20},${yt + 44} Z` : null;
                  return {
                    path,
                    highlightPath: hl,
                    labelY: midY - 16,
                    valueY: midY + 18,
                    rightEdgeX: br,
                  };
                });

                const gradIds = ['pfl-g0','pfl-g1','pfl-g2','pfl-g3'];

                return (
                  <div className="mt-6 space-y-4">
                    {/* Main: funnel card (left) + inspector (right) */}
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.18fr_420px] items-start">

                      {/* Left — funnel canvas card */}
                      <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_34px_rgba(15,23,42,0.07)] overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-7 py-5">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Lead Intake Flow</div>
                            <div className="text-[13.5px] text-slate-600 mt-0.5">{leadStats.topSources.length} inbound sources feeding the funnel</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowFunnelBreakdownTable(v => !v)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            {showFunnelBreakdownTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            Per-source breakdown
                          </button>
                        </div>

                        {/* Source pills */}
                        <div className="px-7 pt-5 pb-2">
                          <div className="flex flex-wrap gap-2.5">
                            {leadStats.topSources.map((src, si) => {
                              const c = PILL_COLORS[si % PILL_COLORS.length];
                              const isOn = srcFilter === src.name;
                              const isMuted = srcFilter && !isOn;
                              return (
                                <button
                                  key={src.name}
                                  type="button"
                                  onClick={() => setSrcFilter(isOn ? null : src.name)}
                                  className={cn(
                                    'inline-flex items-center gap-2 rounded-full border pl-2.5 pr-3 py-1.5 text-[12.5px] font-medium transition-all shadow-[0_1px_4px_rgba(15,23,42,0.07)]',
                                    isOn ? 'border-slate-300 bg-white shadow-md ring-2' : isMuted ? 'opacity-40 border-slate-100 bg-white' : 'border-slate-200 bg-white hover:shadow-md'
                                  )}
                                  style={isOn ? { outline: `2px solid ${c}`, outlineOffset: '0px' } as React.CSSProperties : {}}
                                >
                                  <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0" style={{ background: `${c}18` }}>
                                    <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                                  </span>
                                  <span className="text-slate-800">{src.name}</span>
                                  <span className="text-[11.5px] font-mono text-slate-400">{formatNumber(src.count)}</span>
                                </button>
                              );
                            })}
                            {srcFilter && (
                              <button type="button" onClick={() => setSrcFilter(null)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] text-slate-500 hover:text-slate-800 transition-colors">
                                All sources active
                              </button>
                            )}
                          </div>
                          <div className="text-[11.5px] text-slate-400 mt-2">Click a source to filter the funnel.</div>
                        </div>

                        {/* SVG funnel */}
                        <div className="relative px-4 pb-7 pt-2">
                          <div className="relative max-w-[620px] mx-auto">
                            <svg viewBox={`0 0 600 ${SVG_H}`} className="w-full h-auto" aria-label="Sales funnel">
                              <defs>
                                {fStages.map((s, i) => (
                                  <linearGradient key={s.id} id={gradIds[i]} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={s.accent} stopOpacity="1" />
                                    <stop offset="100%" stopColor={s.accent} stopOpacity="0.82" />
                                  </linearGradient>
                                ))}
                                <filter id="pfl-shadow" x="-20%" y="-20%" width="140%" height="140%">
                                  <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.18" />
                                </filter>
                              </defs>

                              {/* Ground shadow */}
                              <ellipse cx="300" cy={SVG_H - 20} rx={hw[3] + 30} ry="14" fill="#cbd5e1" opacity="0.6" />
                              <ellipse cx="300" cy={SVG_H - 26} rx={hw[3] + 10} ry="9" fill="#94a3b8" opacity="0.25" />

                              {/* Funnel stages */}
                              {svgStages.map((sv, i) => {
                                const s = fStages[i];
                                const isActive = activeIdx === i;
                                return (
                                  <g
                                    key={s.id}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setActiveIdx(i)}
                                    role="button"
                                    aria-label={`${s.label} stage, ${formatNumber(s.value)}`}
                                  >
                                    {/* Active glow ring for last stage (bowl shape) */}
                                    {i === 3 && isActive && (
                                      <ellipse cx="300" cy={yTops[3] + STAGE_H - 10} rx={hw[3] + 20} ry="28" fill="none" stroke={s.accent} strokeOpacity="0.22" strokeWidth="18" />
                                    )}
                                    {/* Main shape */}
                                    <path
                                      d={sv.path}
                                      fill={`url(#${gradIds[i]})`}
                                      filter="url(#pfl-shadow)"
                                      opacity={isActive ? 1 : 0.84}
                                    />
                                    {/* Highlight / shine */}
                                    {sv.highlightPath && (
                                      <path d={sv.highlightPath} fill="white" opacity="0.38" />
                                    )}
                                    {/* Active ring stroke */}
                                    {isActive && (
                                      <path d={sv.path} fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="2" />
                                    )}
                                    {/* Stage label */}
                                    <text x="300" y={sv.labelY} textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Inter, system-ui" opacity="0.88" style={{ letterSpacing: '0.12em' }}>
                                      {s.label.toUpperCase()}
                                    </text>
                                    {/* Value — scale font to available width */}
                                    <text x="300" y={sv.valueY} textAnchor="middle" fill="white" fontSize={Math.min(42, Math.max(22, hw[i] * 0.38))} fontWeight="700" fontFamily="Inter, system-ui">
                                      {formatNumber(s.value)}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Intake lip */}
                              <path d={`M ${CX - hw[0]},${yTops[0]} L ${CX + hw[0]},${yTops[0]}`} stroke="white" strokeOpacity="0.9" strokeWidth="2.2" />
                              <path d={`M ${CX - hw[0]},${yTops[0]} L ${CX - hw[1]},${yBots[0]}`} stroke="white" opacity="0.22" strokeWidth="1.2" />
                              <path d={`M ${CX + hw[0]},${yTops[0]} L ${CX + hw[1]},${yBots[0]}`} stroke="white" opacity="0.15" strokeWidth="1.2" />

                              {/* Drop annotations — fixed right margin so never overlap funnel */}
                              {[1, 2].map((i) => {
                                if (fStages[i].dropPct === null) return null;
                                const ay = yTops[i] + 18;
                                const lostCount = i === 1 ? srcLeadTotal - srcTrials : srcTrials - srcRetained;
                                const lineX = Math.min(CX + hw[i] + 8, 490);
                                return (
                                  <g key={i} fontFamily="Inter, system-ui" fontSize="11">
                                    <line x1={lineX} y1={ay} x2={lineX + 16} y2={ay} stroke="#cbd5e1" strokeDasharray="3 3" />
                                    <text x={lineX + 20} y={ay - 5} fill="#dc2626" fontWeight="700">{fStages[i].dropPct}% drop</text>
                                    <text x={lineX + 20} y={ay + 9} fill="#94a3b8">{formatNumber(lostCount)} lost</text>
                                  </g>
                                );
                              })}
                              {/* Converted annotation — stage 3 right side */}
                              {(() => {
                                const ay = yTops[3] + 18;
                                const lineX = Math.min(CX + hw[3] + 8, 490);
                                return (
                                  <g fontFamily="Inter, system-ui" fontSize="11">
                                    <line x1={lineX} y1={ay} x2={lineX + 16} y2={ay} stroke="#86efac" />
                                    <text x={lineX + 20} y={ay - 5} fill="#15803d" fontWeight="700">{srcRetained ? `${Math.round((srcConverted/srcRetained)*100)}%` : '0%'} conv.</text>
                                    <text x={lineX + 20} y={ay + 9} fill="#94a3b8">of retained</text>
                                  </g>
                                );
                              })()}

                              {/* Left pct tick labels — fixed left margin */}
                              <g fontFamily="Inter, system-ui" fontSize="11" fill="#94a3b8">
                                {fStages.map((s, i) => (
                                  <text key={s.id} x="44" y={yTops[i] + STAGE_H / 2 + 4} textAnchor="end">{s.pctOfLeads.toFixed(1)}%</text>
                                ))}
                              </g>

                              {/* Footer note */}
                              <text x="300" y={SVG_H - 4} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="Inter, system-ui">
                                * Retained includes active members from prior periods
                              </text>
                            </svg>
                          </div>

                          {/* Legend */}
                          <div className="flex flex-wrap gap-4 justify-center text-[11.5px] text-slate-500 mt-1">
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Click a stage to inspect</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Hover to preview</div>
                          </div>
                        </div>
                      </div>

                      {/* Right — Inspector */}
                      <div className="sticky top-6 space-y-4">
                        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_34px_rgba(15,23,42,0.07)] overflow-hidden">
                          {/* Stage header */}
                          <div className="px-6 pt-6 pb-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: active.accent }}>Stage · {active.id.toUpperCase()}</div>
                                <div className="text-[26px] font-bold text-slate-900 leading-tight mt-0.5">{active.label}</div>
                                <div className="text-[13px] text-slate-500">{active.sub}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-[40px] font-bold leading-none text-slate-900 tabular-nums">{formatNumber(active.value)}</div>
                                <div className="text-[12px] text-slate-500 mt-1">{active.pctOfLeads.toFixed(1)}% of leads</div>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                          <div className="px-6 py-5 space-y-5">
                            {/* Metric tiles 2×2 */}
                            <div className="grid grid-cols-2 gap-3">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 cursor-help">
                                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Stage conv. <CircleAlert className="w-3 h-3 opacity-50" /></div>
                                      <div className="text-[22px] font-semibold text-slate-900 mt-1 tabular-nums">
                                        {active.fromPrev !== null ? `${active.fromPrev.toFixed(1)}%` : '100%'}
                                      </div>
                                      <div className="text-[11.5px] text-slate-400">{active.fromPrev !== null ? 'from previous' : 'top of funnel'}</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[220px] text-xs">% of people from the previous funnel stage who reached this stage. Leads→Trials, Trials→Retained, Retained→Converted.</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 cursor-help">
                                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Avg LTV <CircleAlert className="w-3 h-3 opacity-50" /></div>
                                      <div className="text-[20px] font-semibold text-slate-900 mt-1 tabular-nums">{formatCurrency(clientStats.avgLtv)}</div>
                                      <div className="text-[11.5px] text-slate-400">converted members</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[220px] text-xs">Lifetime Value — total revenue collected from a converted member across all purchases, averaged across the cohort.</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 cursor-help">
                                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Conv. rate <CircleAlert className="w-3 h-3 opacity-50" /></div>
                                      <div className="text-[20px] font-semibold text-slate-900 mt-1 tabular-nums">{srcTrials ? `${((srcConverted/srcTrials)*100).toFixed(1)}%` : '0%'}</div>
                                      <div className="text-[11.5px] text-slate-400">trial → member</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[220px] text-xs">% of first-visit trials who went on to purchase a membership. Converted ÷ Trials × 100.</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 cursor-help">
                                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ret. rate <CircleAlert className="w-3 h-3 opacity-50" /></div>
                                      <div className="text-[20px] font-semibold text-slate-900 mt-1 tabular-nums">{srcConverted ? `${Math.round((srcRetained/srcConverted)*100)}%` : '0%'}</div>
                                      <div className="text-[11.5px] text-slate-400">member → retained</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[220px] text-xs">% of converted members classified as Retained — still active with a valid membership. Retained ÷ Converted × 100.</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>

                            {/* Source mix bars */}
                            {leadStats.topSources.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-2.5">
                                  <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Source mix — this stage</div>
                                  <div className="text-[11px] text-slate-400">Click left pills to filter</div>
                                </div>
                                <div className="space-y-2.5">
                                  {leadStats.topSources.map((src, si) => {
                                    const c = PILL_COLORS[si % PILL_COLORS.length];
                                    const total = leadStats.topSources.reduce((s,x) => s + x.count, 0) || 1;
                                    const pct = Math.round((src.count / total) * 100);
                                    return (
                                      <div key={src.name} className={cn('flex items-center gap-3 text-[12.5px]', srcFilter && srcFilter !== src.name ? 'opacity-35' : '')}>
                                        <div className="w-24 shrink-0 truncate text-slate-600">{src.name}</div>
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: c }} />
                                        </div>
                                        <div className="w-10 text-right font-mono text-slate-800 font-semibold">{formatNumber(src.count)}</div>
                                        <div className="w-9 text-right text-[11.5px] text-slate-400">{pct}%</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Stage note */}
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-slate-600">
                              {activeIdx === 0 && `${formatNumber(srcLeadTotal)} leads captured${srcFilter ? ` from ${srcFilter}` : ''}. Top source: ${leadStats.topSources[0]?.name || 'N/A'} with ${formatNumber(leadStats.topSources[0]?.count || 0)}.`}
                              {activeIdx === 1 && `${fStages[1].pctOfLeads.toFixed(1)}% of leads became first visits. ${fStages[1].dropPct ? `${fStages[1].dropPct}% dropped before this stage.` : ''}`}
                              {activeIdx === 2 && `${formatNumber(srcRetained)} active retained members. ${srcTrials ? `${((srcRetained/srcTrials)*100).toFixed(1)}%` : '0%'} of trials retained.`}
                              {activeIdx === 3 && `${srcRetained ? `${((srcConverted/srcRetained)*100).toFixed(1)}%` : '0%'} retained → converted member. Avg LTV of converted members: ${formatCurrency(clientStats.avgLtv)}.`}
                            </div>
                          </div>
                        </div>

                        {/* Loss reasons card — below inspector */}
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Drop-off analysis · Trial → Convert</div>
                            <span className="font-mono text-[11px] text-slate-400">n={formatNumber(Math.max(srcTrials - srcConverted, 0))}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-[12.5px] text-slate-600">
                            <div><span className="font-bold text-slate-900">{srcTrials ? `${((srcConverted/srcTrials)*100).toFixed(1)}%` : '0%'}</span> convert</div>
                            <div><span className="font-bold text-slate-900">{fStages[2].dropPct ?? 0}%</span> drop at this stage</div>
                            <div><span className="font-bold text-slate-900">{formatCurrency(clientStats.avgLtv)}</span> avg LTV</div>
                            <div><span className="font-bold text-slate-900">{srcConverted ? `${Math.round((srcRetained/srcConverted)*100)}%` : '0%'}</span> retention</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Per-source breakdown table — shown only when toggle active */}
                    {showFunnelBreakdownTable && <div>
                      <div className="flex items-end justify-between flex-wrap gap-3 mb-3 px-1">
                        <div>
                          <h3 className="text-[22px] font-bold text-slate-900 tracking-tight">Per-source breakdown</h3>
                          <p className="text-[13px] text-slate-500 mt-0.5">Which channels are actually converting to retained members.</p>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
                          {(['source','location','membership','class'] as const).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setFunnelRankingDimension(d)}
                              className={cn('px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all', funnelRankingDimension === d ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700')}
                            >{d.charAt(0).toUpperCase() + d.slice(1)}</button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[26px] border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)] overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-[13px]">
                            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50">
                              <tr className="[&>th]:py-3.5 [&>th]:px-5 [&>th]:font-semibold [&>th]:text-left">
                                <th>{funnelRankingDimension === 'source' ? 'Source' : funnelRankingDimension.charAt(0).toUpperCase() + funnelRankingDimension.slice(1)}</th>
                                <th className="text-right">Leads</th>
                                <th className="text-right">Trials</th>
                                <th className="text-right">Converted</th>
                                <th className="text-right">Retained</th>
                                <th className="text-right">L→C Rate</th>
                                <th className="w-40">Mix</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                              {funnelRankings.rows.map((row, ri) => {
                                const totalLeads = funnelRankings.rows.reduce((s, r) => s + r.leads, 0) || 1;
                                const sharePct = Math.round((row.leads / totalLeads) * 100);
                                const c = PILL_COLORS[ri % PILL_COLORS.length];
                                return (
                                  <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-[14px] px-5 font-semibold text-slate-900">
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
                                        {row.name}
                                      </div>
                                    </td>
                                    <td className="py-[14px] px-5 text-right font-mono">{formatNumber(row.leads)}</td>
                                    <td className="py-[14px] px-5 text-right font-mono">{formatNumber(row.trials)}</td>
                                    <td className="py-[14px] px-5 text-right font-mono font-semibold text-emerald-700">{formatNumber(row.converted)}</td>
                                    <td className="py-[14px] px-5 text-right font-mono font-semibold text-violet-700">{formatNumber(row.retained)}</td>
                                    <td className="py-[14px] px-5 text-right font-semibold text-slate-900">{formatPercentage(row.conversionRate)}</td>
                                    <td className="py-[14px] px-5">
                                      <div className="h-[7px] w-full rounded-full overflow-hidden bg-slate-100">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${sharePct}%`, background: c }} />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>}
                  </div>
                );
              })()}

              {showFunnelRankings && (
                <>
                  {/* Group by + Metric selectors — control the ranking lists below */}
                  <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <div className="flex w-full max-w-2xl items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
                      <span className="shrink-0 pl-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Group by</span>
                      {([
                        { value: 'source', label: 'Source', icon: <Tag className="h-3 w-3" /> },
                        { value: 'location', label: 'Location', icon: <MapPin className="h-3 w-3" /> },
                        { value: 'stage', label: 'Stage', icon: <TrendingUp className="h-3 w-3" /> },
                        { value: 'membership', label: 'Membership', icon: <Star className="h-3 w-3" /> },
                        { value: 'class', label: 'Class', icon: <LineChart className="h-3 w-3" /> },
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFunnelRankingDimension(opt.value)}
                          className={cn(
                            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition-all',
                            funnelRankingDimension === opt.value ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          )}
                        >
                          {opt.icon}{opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
                      <span className="shrink-0 pl-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Metric</span>
                      {([
                        { value: 'leads', label: 'Leads', icon: <UserPlus className="h-3 w-3" /> },
                        { value: 'converted', label: 'Converted', icon: <Target className="h-3 w-3" /> },
                        { value: 'retained', label: 'Retained', icon: <Repeat className="h-3 w-3" /> },
                        { value: 'ltv', label: 'LTV', icon: <CircleDollarSign className="h-3 w-3" /> },
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFunnelChartMetric(opt.value)}
                          className={cn(
                            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition-all',
                            funnelChartMetric === opt.value ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          )}
                        >
                          {opt.icon}{opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-4 lg:grid-cols-2">
                    {renderRankingList('Top funnel segments', funnelRankings.top, funnelChartMetric === 'leads' ? 'leads' : funnelChartMetric, funnelChartMetric === 'ltv' ? formatCurrency : formatNumber, (item) => `${formatNumber(item.uniqueMembers)} members · ${formatPercentage(item.conversionRate)} conv · ${formatPercentage(item.retentionRate)} ret`, false)}
                    {renderRankingList('Bottom funnel segments', funnelRankings.bottom, funnelChartMetric === 'leads' ? 'leads' : funnelChartMetric, funnelChartMetric === 'ltv' ? formatCurrency : formatNumber, (item) => `${formatNumber(item.trials)} trials · ${formatNumber(item.membershipsBought)} memberships · ${formatNumber(item.visitsPostTrial)} visits`, true)}
                  </div>

                  {/* Count selector below ranking lists */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-slate-500">Show top/bottom</span>
                    {([5, 10, 15, 20] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFunnelRankingCount(n)}
                        className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition-colors', funnelRankingCount === n ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300')}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Summary — full width at bottom */}
              <div className="mt-6">
                {renderAISummary('funnel-overview', [
                  `Current conversion rate is ${formatPercentage(clientStats.conversionRate)} and retention rate is ${formatPercentage(clientStats.retentionRate)}.`,
                  `Average post-trial value is ${formatCurrency(clientStats.avgLtv)} with ${formatNumber(filteredClients.reduce((sum, item) => sum + (Number(item.visitsPostTrial) || 0), 0))} total post-trial visits.`,
                  `${clientStats.newClients} new clients entered the funnel — ${clientStats.converted} converted.`,
                ])}
              </div>
            </AnimatedSectionCard>

            <AnimatedSectionCard
              title="Teacher Scorecard"
              subtitle="Trainer attendance, fill, conversion, retention, and pay on one consistent shell"
              icon={UserCheck}
              iconGradient="from-violet-600 to-purple-900"
              iconColor="#7c3aed"
              sectionNumber={4}
              onAIPanel={() => openAIPanel('trainers', 'Teacher Scorecard')}
              action={
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">MoM Table</span>
                    <Switch checked={showTrainerMomTable} onCheckedChange={setShowTrainerMomTable} />
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Rankings</span>
                    <Switch checked={showTrainerRankings} onCheckedChange={setShowTrainerRankings} />
                  </div>
                </div>
              }
            >
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-100/80 px-5 py-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">Trainer scorecard</h4>
                    <p className="text-xs text-slate-500">Click column header to sort · Attendance, fill, conversion, retention, and revenue score</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Sort by</span>
                    <select
                      value={scorecardSortKey}
                      onChange={(e) => setScorecardSortKey(e.target.value as typeof scorecardSortKey)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400"
                    >
                      <option value="sessions">Classes</option>
                      <option value="customers">Avg Incl</option>
                      <option value="classAvg">Avg Excl</option>
                      <option value="paid">Pay</option>
                      <option value="fillRate">Fill %</option>
                      <option value="conversionRate">Conv %</option>
                      <option value="lateCancels">Late Cancels</option>
                      <option value="revenueScore">Score</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setScorecardSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:border-slate-400"
                    >{scorecardSortDir === 'desc' ? '↓ Desc' : '↑ Asc'}</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        {[
                            { label: 'Instructor', key: null },
                          { label: 'Cls', key: 'sessions' },
                          { label: 'Empty', key: null },
                          { label: 'Active', key: 'nonEmpty' },
                          { label: 'Fill Rate', key: 'fillRate' },
                          { label: 'Avg Incl', key: 'customers' },
                          { label: 'Avg Excl', key: 'classAvg' },
                          { label: 'New', key: 'totalNew' },
                          { label: 'Conv', key: 'totalConverted' },
                          { label: 'Ret', key: 'totalRetained' },
                          { label: 'Conv %', key: 'conversionRate' },
                          { label: 'Late', key: 'lateCancels' },
                          { label: 'Pay', key: 'paid' },
                          { label: 'Score ⓘ', key: 'revenueScore' },
                        ].map(({ label, key }) => (
                          <th
                            key={label}
                            className={cn(
                              'border-b border-slate-200 px-3 py-3 text-center first:text-left',
                              key ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                            )}
                            onClick={() => {
                              if (!key) return;
                              const k = key as typeof scorecardSortKey;
                              if (scorecardSortKey === k) setScorecardSortDir((d) => d === 'desc' ? 'asc' : 'desc');
                              else { setScorecardSortKey(k); setScorecardSortDir('desc'); }
                            }}
                          >
                            <span className="flex items-center justify-center gap-0.5">
                              {label}
                              {key && scorecardSortKey === key && (
                                <span className="text-blue-600">{scorecardSortDir === 'desc' ? ' ↓' : ' ↑'}</span>
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {trainerRankingsExtended.rows.length ? ([...trainerRankingsExtended.rows].sort((a, b) => {
                        const av = a[scorecardSortKey] as number;
                        const bv = b[scorecardSortKey] as number;
                        return scorecardSortDir === 'desc' ? bv - av : av - bv;
                      })).map((t) => {
                        const isExpanded = scorecardExpandedTrainer === t.name;
                        const tNew = filteredPayroll.filter((item) => item.teacherName === t.name).reduce((sum, item) => sum + (Number(item.new) || 0), 0);
                        const tConv = filteredPayroll.filter((item) => item.teacherName === t.name).reduce((sum, item) => sum + (Number(item.converted) || 0), 0);
                        const tRet = filteredPayroll.filter((item) => item.teacherName === t.name).reduce((sum, item) => sum + (Number(item.retained) || 0), 0);
                        return (
                          <React.Fragment key={t.name}>
                            <tr
                              className={cn('h-[44px] border-b border-slate-200 cursor-pointer transition-colors', isExpanded ? 'bg-slate-100' : 'hover:bg-slate-50')}
                              onClick={() => setScorecardExpandedTrainer(isExpanded ? null : t.name)}
                            >
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400 text-xs">{isExpanded ? '▾' : '▸'}</span>
                                  <TrainerNameCell name={t.name} />
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center text-slate-700">{formatNumber(t.sessions)}</td>
                              <td className="px-3 py-2 text-center text-slate-700">{formatNumber(Math.max(t.sessions - t.nonEmpty, 0))}</td>
                              <td className="px-3 py-2 text-center text-slate-700">{formatNumber(t.nonEmpty)}</td>
                              <td className="px-3 py-2 text-center text-slate-700">{formatPercentage(t.fillRate)}</td>
                              <td className="px-3 py-2 text-center text-slate-700">{(t.sessions ? t.customers / t.sessions : 0).toFixed(1)}</td>
                              <td className="px-3 py-2 text-center text-slate-700">{t.classAvg.toFixed(1)}</td>
                              <td className="px-3 py-2 text-center text-slate-700">{formatNumber(tNew)}</td>
                              <td className="px-3 py-2 text-center text-slate-700">{formatNumber(tConv)}</td>
                              <td className="px-3 py-2 text-center text-slate-700">{formatNumber(tRet)}</td>
                              <td className="px-3 py-2 text-center text-slate-700">{formatPercentage(t.conversionRate || 0)}</td>
                              <td className="px-3 py-2 text-center text-slate-700">{formatNumber(t.lateCancels)}</td>
                              <td className="px-3 py-2 text-center text-slate-700">{formatCurrency(t.paid)}</td>
                              <td className="px-3 py-2 text-center font-semibold text-slate-900">{Math.round(t.revenueScore)}</td>
                            </tr>
                            {isExpanded && (() => {
                              const retRate = tConv > 0 ? (tRet / tConv * 100) : 0;
                              const revPerSess = t.sessions > 0 ? t.paid / t.sessions : 0;
                              const revPerCust = t.customers > 0 ? t.paid / t.customers : 0;
                              const utilPct = t.sessions > 0 ? (t.nonEmpty / t.sessions * 100) : 0;
                              const trainerSessData = filteredSessions.filter((s) => (s.trainerName || '').toLowerCase() === t.name.toLowerCase());
                              const totCap = trainerSessData.reduce((s, ss) => s + (Number(ss.capacity) || 0), 0);
                              const totAtt = trainerSessData.reduce((s, ss) => s + (Number(ss.checkedInCount) || 0), 0);
                              const kpis = [
                                { label: 'Total Revenue', val: formatCurrency(t.paid), sub: '' },
                                { label: 'Rev / Session', val: formatCurrency(revPerSess), sub: '' },
                                { label: 'Rev / Member', val: formatCurrency(revPerCust), sub: '' },
                                { label: 'Fill Rate', val: formatPercentage(t.fillRate), sub: `${formatNumber(totAtt)} / ${formatNumber(totCap)} spots` },
                                { label: 'Utilisation', val: `${utilPct.toFixed(1)}%`, sub: `${formatNumber(t.nonEmpty)} active cls` },
                                { label: 'Late Cancels', val: formatNumber(t.lateCancels), sub: '' },
                                { label: 'Conv. Rate', val: formatPercentage(t.conversionRate || 0), sub: `${formatNumber(tConv)} / ${formatNumber(tNew)}` },
                                { label: 'Ret. Rate', val: formatPercentage(retRate), sub: `${formatNumber(tRet)} / ${formatNumber(tConv)}` },
                                { label: 'Score', val: Math.round(t.revenueScore).toString(), sub: '0–100 composite' },
                              ];
                              return (
                                <tr className="bg-slate-50/70 border-b border-slate-200">
                                  <td colSpan={15} className="px-4 py-4">
                                    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                                      {kpis.map(({ label, val, sub }) => (
                                        <div key={label} className="bg-white rounded-lg border border-slate-200 px-3 py-2.5 shadow-sm">
                                          <p className="text-[10px] text-slate-500 font-medium leading-tight">{label}</p>
                                          <p className="font-bold text-sm text-slate-800 mt-0.5">{val}</p>
                                          {sub && <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{sub}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })()}
                          </React.Fragment>
                        );
                      }) : <tr><td colSpan={15} className="p-5"><EmptyNote label="No trainer scorecard data available" /></td></tr>}
                    </tbody>
                    {trainerRankingsExtended.rows.length > 0 && (() => {
                      const rows = trainerRankingsExtended.rows;
                      const totSessions = rows.reduce((s, r) => s + r.sessions, 0);
                      const totEmpty = rows.reduce((s, r) => s + Math.max(r.sessions - r.nonEmpty, 0), 0);
                      const totActive = rows.reduce((s, r) => s + r.nonEmpty, 0);
                      const totPaid = rows.reduce((s, r) => s + r.paid, 0);
                      const totCustomers = rows.reduce((s, r) => s + r.customers, 0);
                      const totLateCancels = rows.reduce((s, r) => s + r.lateCancels, 0);
                      const totNew = rows.reduce((s, r) => s + (r.totalNew || 0), 0);
                      const totConverted = rows.reduce((s, r) => s + (r.totalConverted || 0), 0);
                      const totRetained = rows.reduce((s, r) => s + (r.totalRetained || 0), 0);

                      const avgConv = totNew > 0 ? (totConverted / totNew) * 100 : 0;
                      const avgScore = rows.length ? rows.reduce((s, r) => s + r.revenueScore, 0) / rows.length : 0;
                      return (
                        <tfoot>
                          <tr className="bg-slate-900 text-white text-xs font-bold h-[44px]">
                            <td className="px-3 py-2">Totals / Avg</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totSessions)}</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totEmpty)}</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totActive)}</td>
                            <td className="px-3 py-2 text-center">{formatPercentage(rows.reduce((s, r) => s + r.fillRate, 0) / (rows.length || 1))}</td>
                            <td className="px-3 py-2 text-center">{(totSessions ? totCustomers / totSessions : 0).toFixed(1)}</td>
                            <td className="px-3 py-2 text-center">—</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totNew)}</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totConverted)}</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totRetained)}</td>
                            <td className="px-3 py-2 text-center">{formatPercentage(avgConv)}</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totLateCancels)}</td>
                            <td className="px-3 py-2 text-center">{formatCurrency(totPaid)}</td>
                            <td className="px-3 py-2 text-center">{Math.round(avgScore)}</td>
                          </tr>
                        </tfoot>
                      );
                    })()}
                  </table>
                </div>
              </div>

              {/* Format × Trainer comparison — collapsed by default */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowTrainerFormatSection((v) => !v)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Trainer performance by format</h4>
                    <p className="text-xs text-slate-500">Per-trainer breakdown by format — sessions, avg attendance, fill rate, revenue, late cancels</p>
                  </div>
                  {showTrainerFormatSection ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                </button>
                {showTrainerFormatSection && (
                  <div className="mt-3">
                    <FormatComparisonSection sessions={filteredSessions} trainerTabOnly />
                  </div>
                )}
              </div>

              {showTrainerMomTable && (
                <div className="mt-6">
                  {renderMatrixTable(
                    'Month on month trainer table',
                    'Monthly trainer, class, conversion, and retention metrics.',
                    trainerMatrix.months,
                    trainerMatrix.monthLabels,
                    trainerMatrix.metricRows,
                    (row, month) => openMetricDrillDown(`${row.label}${month ? ` • ${trainerMatrix.monthLabels[month]}` : ''}`, 'trainer', { name: row.label, rawData: month ? studioWidePayroll.filter((item) => item.monthYear && normalizeMonthYearToISO(item.monthYear) === month) : studioWidePayroll, filteredTransactionData: month ? studioWidePayroll.filter((item) => item.monthYear && normalizeMonthYearToISO(item.monthYear) === month) : studioWidePayroll }, studioWidePayroll as any)
                  )}
                </div>
              )}

              {showTrainerRankings && <>
              {/* Ranking criteria selector */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 shrink-0">Rank by</span>
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                  {([
                    { value: 'paid', label: 'Pay' },
                    { value: 'revenueScore', label: 'Score' },
                    { value: 'fillRate', label: 'Fill Rate' },
                    { value: 'classAvg', label: 'Class Avg' },
                    { value: 'sessions', label: 'Classes' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTrainerRankingCriteria(value)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                        trainerRankingCriteria === value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-700'
                      )}
                    >{label}</button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                {/* Top trainers */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-slate-900 text-white">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Top trainers</h4>
                      <p className="text-xs text-slate-500">Highest {trainerRankingCriteria === 'paid' ? 'pay' : trainerRankingCriteria === 'revenueScore' ? 'score' : trainerRankingCriteria === 'fillRate' ? 'fill rate' : trainerRankingCriteria === 'classAvg' ? 'class avg' : 'classes'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[...trainerRankingsExtended.rows].sort((a, b) => (b[trainerRankingCriteria] as number) - (a[trainerRankingCriteria] as number)).slice(0, 10).map((item, index) => (
                      <div key={`top-trainer-${item.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <TrainerAvatar name={item.name} size="lg" showName={false} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{formatNumber(item.sessions)} cls · {item.classAvg.toFixed(1)} avg · {formatPercentage(item.fillRate)} fill · {formatPercentage(item.conversionRate || 0)} conv</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-slate-950 text-sm">{trainerRankingCriteria === 'paid' ? formatCurrency(item.paid) : trainerRankingCriteria === 'revenueScore' ? `Score ${Math.round(item.revenueScore)}` : trainerRankingCriteria === 'fillRate' ? formatPercentage(item.fillRate) : trainerRankingCriteria === 'classAvg' ? item.classAvg.toFixed(1) : formatNumber(item.sessions)}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatCurrency(item.paid)}</p>
                        </div>
                      </div>
                    ))}
                    {!trainerRankingsExtended.rows.length && <EmptyNote label="No ranking data available" />}
                  </div>
                </div>
                {/* Bottom trainers */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-700 to-red-900 text-white">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Bottom trainers</h4>
                      <p className="text-xs text-slate-500">Lowest {trainerRankingCriteria === 'paid' ? 'pay' : trainerRankingCriteria === 'revenueScore' ? 'score' : trainerRankingCriteria === 'fillRate' ? 'fill rate' : trainerRankingCriteria === 'classAvg' ? 'class avg' : 'classes'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[...trainerRankingsExtended.rows].sort((a, b) => (a[trainerRankingCriteria] as number) - (b[trainerRankingCriteria] as number)).slice(0, 10).map((item, index) => (
                      <div key={`bot-trainer-${item.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <TrainerAvatar name={item.name} size="lg" showName={false} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{formatNumber(item.sessions)} cls · {formatNumber(item.lateCancels)} late · {formatPercentage(item.retentionRate || 0)} ret · {formatCurrency(item.paid)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-red-600 text-sm">{trainerRankingCriteria === 'paid' ? formatCurrency(item.paid) : trainerRankingCriteria === 'revenueScore' ? `Score ${Math.round(item.revenueScore)}` : trainerRankingCriteria === 'fillRate' ? formatPercentage(item.fillRate) : trainerRankingCriteria === 'classAvg' ? item.classAvg.toFixed(1) : formatNumber(item.sessions)}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.classAvg.toFixed(1)} avg class</p>
                        </div>
                      </div>
                    ))}
                    {!trainerRankingsExtended.rows.length && <EmptyNote label="No ranking data available" />}
                  </div>
                </div>
              </div>
              </>}

              {/* Instructor Efficiency Table */}
              {instructorEfficiency.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                      <BarChart2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Instructor Efficiency</h4>
                      <p className="text-xs text-white/60">Revenue, fill rate, and class average per instructor</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Instructor</th>
                          <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Sessions</th>
                          <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Empty</th>
                          <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Fill %</th>
                          <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Avg (Excl Empty)</th>
                          <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Rev / Class</th>
                          <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Total Rev</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {instructorEfficiency.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-slate-900">{row.trainer}</td>
                            <td className="px-4 py-2.5 tabular-nums text-right text-slate-600">{formatNumber(row.sessions)}</td>
                            <td className="px-4 py-2.5 tabular-nums text-right text-slate-500">{formatNumber(row.emptySessions)}</td>
                            <td className="px-4 py-2.5 tabular-nums text-right font-semibold text-slate-800">{row.fillRate.toFixed(1)}%</td>
                            <td className="px-4 py-2.5 tabular-nums text-right text-slate-700">{row.classAvgExclEmpty.toFixed(1)}</td>
                            <td className="px-4 py-2.5 tabular-nums text-right text-slate-700">{formatCurrency(row.revenuePerClass)}</td>
                            <td className="px-4 py-2.5 tabular-nums text-right font-bold text-slate-900">{formatCurrency(row.totalRevenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 pb-6">
                    {renderAISummary('attendance-capacity', [
                      `${capacityByStudio.length} studios are shown, with the strongest utilization currently in the highest rows of the table.`,
                      'Booked capacity should be read against total capacity to understand whether utilization is actually efficient.',
                      'Low-utilization studios are the clearest place to look for schedule or demand misalignment.',
                    ])}
                  </div>
                </div>
                )}

              {/* Summary — full width at bottom */}
              <div className="mt-6">
                {renderAISummary('trainer-scorecard', [
                  `${trainerRankingsExtended.rows.length} trainers in scorecard, top earner is ${trainerRankingsExtended.rows[0]?.name || 'N/A'}.`,
                  `Avg fill rate across all sessions is ${formatPercentage(sessionStats.avgFill)}.`,
                  'Conv % and Ret % are calculated from new members attributed to each trainer.',
                ])}
              </div>
            </AnimatedSectionCard>

            {/* ── LAPSED MEMBERS SECTION ── */}
            <AnimatedSectionCard
              title="Lapsed Members"
              subtitle="Membership expirations, churn pressure, and lifetime metrics"
              icon={Flame}
              iconGradient="from-red-600 to-rose-900"
              iconColor="#dc2626"
              sectionNumber={5}
              onAIPanel={() => openAIPanel('lapsed', 'Lapsed Members')}
              action={
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Churn Trend</span>
                    <Switch checked={showLapsedChurnTrend} onCheckedChange={setShowLapsedChurnTrend} />
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">MoM Table</span>
                    <Switch checked={showLapsedMomTable} onCheckedChange={setShowLapsedMomTable} />
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Rankings</span>
                    <Switch checked={showLapseRankings} onCheckedChange={setShowLapseRankings} />
                  </div>
                </div>
              }
            >
              {/* Metric cards */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <StudioPulseMetricCard icon={<Flame className="h-5 w-5" />} title="Lapsed Members" metric={expirationStats.total} formatter={formatNumber} growthLabel="MoM" growthValue={expirationStats.momGrowth} secondaryGrowthLabel="YoY" secondaryGrowthValue={expirationStats.yoyGrowth} sparklineData={lapsedCountSparkline} sparklineLabels={lapsedCountSparklineLabels} backSparklineData={backLapsedMembersSparkline} backSparklineLabels={backRevenueSparklineLabels} subtext={`${formatNumber(expirationStats.churned)} churned · memberships expired`} iconContainerClassName="bg-gradient-to-br from-orange-600 to-red-800 text-white" onClick={() => openMetricDrillDown('Lapsed Members', 'client', { name: 'Lapsed Members', rawData: filteredExpirations as any, filteredTransactionData: filteredExpirations as any }, filteredExpirations as any)} />
                <StudioPulseMetricCard icon={<Zap className="h-5 w-5" />} title="Churn Rate" metric={expirationStats.churnRate} precision={1} metricUnit="%" formatter={(v) => `${v.toFixed(1)}%`} growthLabel="MoM" growthValue={expirationStats.churnRateMomGrowth} secondaryGrowthLabel="YoY" secondaryGrowthValue={expirationStats.churnRateYoyGrowth} sparklineData={lapsedCountSparkline} sparklineLabels={lapsedCountSparklineLabels} backSparklineData={backLapsedMembersSparkline} backSparklineLabels={backRevenueSparklineLabels} subtext={`${formatNumber(expirationStats.churned)} of ${formatNumber(expirationStats.total)} lapsed`} iconContainerClassName="bg-gradient-to-br from-rose-600 to-red-900 text-white" />
                <StudioPulseMetricCard icon={<CircleDollarSign className="h-5 w-5" />} title="Avg LTV (Lapsed)" metric={expirationStats.avgLtvLapsed} precision={0} formatter={formatCurrency} growthLabel="MoM" growthValue={expirationStats.avgLtvMomGrowth} secondaryGrowthLabel="YoY" secondaryGrowthValue={expirationStats.avgLtvYoyGrowth} sparklineData={lapsedCountSparkline} backSparklineData={backLapsedMembersSparkline} subtext="Average amount paid by lapsed members" iconContainerClassName="bg-gradient-to-br from-slate-700 to-slate-900 text-white" tooltipContent="Average of the paid amount across all lapsed memberships in the selected period." />
              </div>

              {/* Churn by Month — hidden behind toggle */}
              {showLapsedChurnTrend && (() => {
                const TOP_N = 5;
                const topMemNames = membershipChurnBreakdown.slice(0, TOP_N).map((m) => m.name);
                const chartData = churnByMonth.slice(-12).map((d) => {
                  const row: Record<string, any> = { month: d.month };
                  topMemNames.forEach((n) => { row[n] = d.byMembership[n] || 0; });
                  const othersTotal = d.total - topMemNames.reduce((s, n) => s + (d.byMembership[n] || 0), 0);
                  if (othersTotal > 0) row['Others'] = othersTotal;
                  return row;
                });
                const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#3b82f6', '#94a3b8'];
                const allKeys = [...topMemNames, chartData.some((r) => (r['Others'] || 0) > 0) ? 'Others' : ''].filter(Boolean);
                return (
                  <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                            <TrendingDown className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold">Churn Trend — Monthly by Membership</h4>
                            <p className="text-xs text-white/75">Last 12 months · stacked by top {TOP_N} membership types</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="inline-flex rounded-xl border border-white/20 bg-white/10 p-0.5 gap-0.5">
                            {(['count', 'ltv'] as const).map((m) => (
                              <button key={m} type="button" onClick={() => setChurnTrendMetric(m)}
                                className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold transition-all', churnTrendMetric === m ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70 hover:text-white')}
                              >{m === 'count' ? 'Lapse Count' : 'Avg LTV'}</button>
                            ))}
                          </div>
                          <Badge variant="secondary" className="bg-white/20 font-semibold text-white">{churnByMonth.length} months</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 sp-chart-rise" style={{ animationDelay: '0.2s' }}>
                      {chartData.length > 1 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={chartData} margin={{ top: 14, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                            <RechartsTooltip contentStyle={chartTooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            {allKeys.map((key, i) => (
                              <Bar key={key} dataKey={key} stackId="a" fill={BAR_COLORS[i % BAR_COLORS.length]} shape={i === allKeys.length - 1 ? <Custom3DBar /> : undefined} isAnimationActive animationDuration={800} animationEasing="ease-out" animationBegin={i * 60} />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      ) : <EmptyNote label="Not enough monthly data for trend" />}
                    </div>
                  </div>
                );
              })()}

              {/* MoM matrix table */}
              {showLapsedMomTable && (
                <div className="mt-6">
                  {renderMatrixTable(
                    'Lapsed members month on month',
                    'Monthly lapsed counts, churn rates, and lifetime metrics across the full available history.',
                    lapsedMatrix.months,
                    lapsedMatrix.monthLabels,
                    lapsedMatrix.metricRows,
                    (row, month) => openMetricDrillDown(`${row.label}${month ? ` • ${lapsedMatrix.monthLabels[month]}` : ''}`, 'client', { name: row.label, rawData: month ? studioWideExpirations.filter((item) => monthKeyFromDate(item.endDate) === month) : studioWideExpirations, filteredTransactionData: month ? studioWideExpirations.filter((item) => monthKeyFromDate(item.endDate) === month) : studioWideExpirations }, studioWideExpirations as any)
                  )}
                </div>
              )}

              {/* Tab selector for lapsed detail tables */}
              <div className="mt-6">
                <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                  {([
                    { key: 'churned', label: 'Churned by Membership' },
                    { key: 'breakdown', label: 'Churn Breakdown' },
                    { key: 'renewal', label: 'Renewal Potential' },
                    { key: 'highvalue', label: 'High-Value Members' },
                  ] as const).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setLapsedTableTab(tab.key)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap', lapsedTableTab === tab.key ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600')}
                    >{tab.label}</button>
                  ))}
                </div>

                {/* Tab: Churned by Membership */}
                {lapsedTableTab === 'churned' && (() => {
                  const churnedRows = filteredExpirations;
                  const allMonths = [...new Set(churnedRows.map((e) => monthKeyFromDate(e.endDate)).filter(Boolean))].sort();
                  const recentMonths = allMonths.slice(-6);
                  type ChurnGroup = { name: string; total: number; uniqueMembers: Set<string>; totalPaid: number; byMonth: Record<string, { count: number; members: Set<string>; paid: number }> };
                  const groups: Record<string, ChurnGroup> = {};
                  churnedRows.forEach((e) => {
                    const key = e.membershipName || 'Unknown';
                    const mk = monthKeyFromDate(e.endDate) || 'Unknown';
                    if (!groups[key]) groups[key] = { name: key, total: 0, uniqueMembers: new Set(), totalPaid: 0, byMonth: {} };
                    const g = groups[key];
                    g.total += 1;
                    if (e.memberId) g.uniqueMembers.add(e.memberId);
                    g.totalPaid += Number(e.paid) || 0;
                    if (!g.byMonth[mk]) g.byMonth[mk] = { count: 0, members: new Set(), paid: 0 };
                    g.byMonth[mk].count += 1;
                    if (e.memberId) g.byMonth[mk].members.add(e.memberId);
                    g.byMonth[mk].paid += Number(e.paid) || 0;
                  });
                  const sortedGroups = Object.values(groups).sort((a, b) => b.total - a.total);
                  const grandTotal = churnedRows.length;
                  const grandMembers = new Set(churnedRows.map((e) => e.memberId).filter(Boolean)).size;
                  const grandPaid = churnedRows.reduce((s, e) => s + (Number(e.paid) || 0), 0);
                  const monthLabels: Record<string, string> = {};
                  recentMonths.forEach((mk) => {
                    const [y, m] = mk.split('-');
                    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
                    monthLabels[mk] = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                  });
                  return (
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                              <UserPlus className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold">Churned Memberships ({formatNumber(expirationStats.churned)})</h4>
                              <p className="text-xs text-white/75">Grouped by membership type · last 6 months · lapsed count, unique members, avg LTV, churn share</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-white/20 font-semibold text-white">{sortedGroups.length} types</Badge>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                              <th className="px-4 py-3 text-left sticky left-0 z-10 bg-slate-50 min-w-[200px] border-r border-b border-slate-200">Membership</th>
                              <th className="px-3 py-3 text-right whitespace-nowrap border-l border-b border-slate-200">Total</th>
                              <th className="px-3 py-3 text-right whitespace-nowrap border-l border-b border-slate-200">Members</th>
                              <th className="px-3 py-3 text-right whitespace-nowrap border-l border-b border-slate-200">Avg LTV</th>
                              <th className="px-3 py-3 text-right whitespace-nowrap border-l border-b border-slate-200">Churn %</th>
                              {recentMonths.map((mk) => (
                                <th key={mk} className="px-3 py-3 text-right whitespace-nowrap border-l border-b border-slate-200">{monthLabels[mk]}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {sortedGroups.map((g, i) => {
                              const avgLtv = g.uniqueMembers.size > 0 ? g.totalPaid / g.uniqueMembers.size : 0;
                              const churnShare = grandTotal > 0 ? (g.total / grandTotal) * 100 : 0;
                              return (
                                <tr key={g.name} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-2.5 sticky left-0 bg-white border-r border-slate-100 hover:bg-slate-50">
                                    <div className="flex items-center gap-2">
                                      <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-slate-600 to-slate-800 text-white font-bold text-[10px] shrink-0">{i + 1}</span>
                                      <span className="font-semibold text-slate-900 text-xs max-w-[160px] truncate">{g.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-right tabular-nums font-bold text-slate-900 text-xs">{formatNumber(g.total)}</td>
                                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 text-xs">{formatNumber(g.uniqueMembers.size)}</td>
                                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 text-xs">{avgLtv > 0 ? formatCurrency(avgLtv) : '—'}</td>
                                  <td className="px-3 py-2.5 text-right text-xs">
                                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-bold text-[10px] ${churnShare >= 20 ? 'bg-red-100 text-red-700' : churnShare >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                      {churnShare.toFixed(1)}%
                                    </span>
                                  </td>
                                  {recentMonths.map((mk) => {
                                    const month = g.byMonth[mk];
                                    return (
                                      <td key={mk} className="px-3 py-2.5 text-right tabular-nums text-xs">
                                        {month ? (
                                          <div className="flex flex-col items-end">
                                            <span className="font-semibold text-slate-900">{formatNumber(month.count)}</span>
                                            <span className="text-[9px] text-slate-400">{formatNumber(month.members.size)}m</span>
                                          </div>
                                        ) : <span className="text-slate-300">—</span>}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                            {sortedGroups.length === 0 && (
                              <tr><td colSpan={5 + recentMonths.length} className="p-5 text-center text-xs text-slate-400">No churned membership records in the selected period</td></tr>
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700">
                              <td className="px-4 py-2.5 sticky left-0 bg-slate-900 border-r border-white/10">Totals</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(grandTotal)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(grandMembers)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{grandMembers > 0 ? formatCurrency(grandPaid / grandMembers) : '—'}</td>
                              <td className="px-3 py-2.5 text-right">100%</td>
                              {recentMonths.map((mk) => {
                                const mTotal = churnedRows.filter((e) => monthKeyFromDate(e.endDate) === mk).length;
                                return <td key={mk} className="px-3 py-2.5 text-right tabular-nums">{mTotal > 0 ? formatNumber(mTotal) : '—'}</td>;
                              })}
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* Tab: Churn Breakdown */}
                {lapsedTableTab === 'breakdown' && (
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                            <Activity className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold">Membership Churn Breakdown</h4>
                            <p className="text-xs text-white/75">Per membership: lapse count · avg LTV · share of total churn</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-white/20 font-semibold text-white">{membershipChurnBreakdown.length} types</Badge>
                      </div>
                    </div>
                    {membershipChurnBreakdown.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                              <th className="px-4 py-3 text-left sticky left-0 z-10 bg-slate-50 min-w-[200px] border-r border-b border-slate-200"># Membership</th>
                              <th className="px-3 py-3 text-right whitespace-nowrap border-l border-b border-slate-200">Lapsed</th>
                              <th className="px-3 py-3 text-right whitespace-nowrap border-l border-b border-slate-200">Unique Members</th>
                              <th className="px-3 py-3 text-right whitespace-nowrap border-l border-b border-slate-200">Avg LTV</th>
                              <th className="px-3 py-3 text-right whitespace-nowrap border-l border-b border-slate-200">Churn Share</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {membershipChurnBreakdown.map((m, i) => {
                              const churnShare = expirationStats.total ? (m.count / expirationStats.total) * 100 : 0;
                              return (
                                <tr key={m.name} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-2.5 sticky left-0 bg-white border-r border-slate-100 hover:bg-slate-50">
                                    <div className="flex items-center gap-2">
                                      <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-slate-600 to-slate-800 text-white font-bold text-[10px] shrink-0">{i + 1}</span>
                                      <span className="font-semibold text-slate-900 text-xs max-w-[160px] truncate">{m.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-right tabular-nums font-bold text-slate-900 text-xs">{formatNumber(m.count)}</td>
                                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 text-xs">{formatNumber(m.uniqueMembers)}</td>
                                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 text-xs">{m.avgLtv > 0 ? formatCurrency(m.avgLtv) : '—'}</td>
                                  <td className="px-3 py-2.5 text-right text-xs">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="h-1.5 w-20 rounded-full bg-slate-100">
                                        <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" style={{ width: `${Math.min(churnShare * 3, 100)}%` }} />
                                      </div>
                                      <span className="tabular-nums text-slate-700 font-semibold">{churnShare.toFixed(1)}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : <div className="p-5"><EmptyNote label="No membership breakdown data available" /></div>}
                  </div>
                )}

                {/* Tab: Renewal Potential */}
                {lapsedTableTab === 'renewal' && (
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                            <Repeat className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold">Renewal Potential by Membership</h4>
                            <p className="text-xs text-white/75">Lapsed memberships ranked by count — high count = renewal opportunity</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-white/20 font-semibold text-white">{lapsedByMembership.length} types</Badge>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                            {['#', 'Membership Type', 'Lapsed Count', 'Share %', 'Potential'].map((col) => (
                              <th key={col} className="border-b border-slate-200 px-4 py-3 text-left">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {lapsedByMembership.length ? lapsedByMembership.map((item, i) => (
                            <tr key={item.name} className="h-[38px] border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-2 w-10"><span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 text-white font-bold text-xs">{i + 1}</span></td>
                              <td className="px-4 py-2 font-medium text-slate-900">{item.name}</td>
                              <td className="px-4 py-2 tabular-nums text-slate-700">{formatNumber(item.count)}</td>
                              <td className="px-4 py-2 tabular-nums text-slate-700">
                                {expirationStats.total ? formatPercentage((item.count / expirationStats.total) * 100) : '—'}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 flex-1 max-w-[120px] rounded-full bg-slate-100">
                                    <div
                                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-400"
                                      style={{ width: `${lapsedByMembership[0]?.count ? Math.min((item.count / lapsedByMembership[0].count) * 100, 100) : 0}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    {item.count >= 20 ? 'High' : item.count >= 10 ? 'Med' : 'Low'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )) : <tr><td colSpan={5} className="p-5"><EmptyNote label="No membership lapse data available" /></td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab: High-Value Members */}
                {lapsedTableTab === 'highvalue' && (() => {
                  const rows = [...filteredExpirations]
                    .filter((e) => (e as any).amountPaid || Number(e.paid) || 0)
                    .sort((a, b) => ((b as any).amountPaid || Number(b.paid) || 0) - ((a as any).amountPaid || Number(a.paid) || 0))
                    .slice(0, 20);
                  return rows.length > 0 ? (
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold">High-Value Lapsed Members</h4>
                              <p className="text-xs text-white/75">Top 20 by amount paid · spot re-engagement targets</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-white/20 font-semibold text-white">{filteredExpirations.length} total lapsed</Badge>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                              <th className="px-4 py-3 text-left sticky left-0 z-10 bg-slate-50 min-w-[180px] border-r border-b border-slate-200">Member</th>
                              <th className="px-3 py-3 text-left whitespace-nowrap border-l border-b border-slate-200">Membership</th>
                              <th className="px-3 py-3 text-right whitespace-nowrap border-l border-b border-slate-200">End Date</th>
                              <th className="px-3 py-3 text-right whitespace-nowrap border-l border-b border-slate-200">Amount Paid</th>
                              <th className="px-3 py-3 text-right whitespace-nowrap border-l border-b border-slate-200">Location</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {rows.map((e, i) => {
                              const amtPaid = (e as any).amountPaid || Number(e.paid) || 0;
                              return (
                                <tr key={`lmb-${e.memberId}-${i}`} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-2.5 sticky left-0 bg-white border-r border-slate-100 hover:bg-slate-50">
                                    <div>
                                      <p className="font-semibold text-slate-900 text-xs">{e.firstName} {e.lastName}</p>
                                      <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{e.email}</p>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[160px]">
                                    <span className="truncate block">{e.membershipName || '—'}</span>
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-xs tabular-nums text-slate-600">
                                    {e.endDate ? new Date(e.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-xs font-bold tabular-nums text-slate-900">
                                    {amtPaid > 0 ? formatCurrency(amtPaid) : '—'}
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-xs text-slate-500 max-w-[120px]">
                                    <span className="truncate block">{(e as any).primaryLocation || e.homeLocation || '—'}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : <EmptyNote label="No lapsed member data available" />;
                })()}
              </div>

              {/* Summary */}
              <div className="mt-6">
                {renderAISummary('lapsed-trend', [
                  `${formatNumber(expirationStats.total)} memberships expired, ${formatNumber(expirationStats.churned)} churned (${expirationStats.total ? formatPercentage((expirationStats.churned / expirationStats.total) * 100) : '0%'} churn rate).`,
                  `Early exit rate: ${lapsedEngagementStats.earlyExitRate.toFixed(1)}% of lapsed members used less than 50% of purchased sessions — high intent, low retention.`,
                  `${lapsedEngagementStats.discountDrivenPct.toFixed(0)}% of lapsed members had a promo code — watch for promo-driven churn patterns.`,
                  `Late cancellations total ${formatNumber(lcStats.total)} with ${formatCurrency(lcStats.penalty)} in penalty revenue.`,
                ])}
              </div>
            </AnimatedSectionCard>

            {/* ── CLASS ATTENDANCE SECTION ── */}
            <AnimatedSectionCard
              title="Class Attendance"
              subtitle="Session delivery, fill rates, format mix, and class-level utilization"
              icon={LineChart}
              iconGradient="from-cyan-500 to-sky-800"
              iconColor="#0891b2"
              sectionNumber={6}
              onAIPanel={() => openAIPanel('attendance', 'Class Attendance')}
              action={
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">MoM Table</span>
                    <Switch checked={showClassMomTable} onCheckedChange={setShowClassMomTable} />
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Rankings</span>
                    <Switch checked={showSessionRankings} onCheckedChange={setShowSessionRankings} />
                  </div>
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StudioPulseMetricCard icon={<LineChart className="h-5 w-5" />} title="Visits" metric={sessionStats.attendance} formatter={formatNumber} growthLabel="MoM" growthValue={sessionStats.growth.attendance} secondaryGrowthLabel="YoY" secondaryGrowthValue={sessionStats.yoyGrowth.attendance} subtext={`${formatNumber(sessionStats.totalSessions)} sessions · ${formatPercentage(sessionStats.avgFill)} fill`} iconContainerClassName="bg-gradient-to-br from-cyan-600 to-blue-800 text-white" />
                <StudioPulseMetricCard icon={<Scan className="h-5 w-5" />} title="Avg Class Size" metric={sessionStats.classAvg} precision={1} formatter={formatNumber} growthLabel="MoM" growthValue={sessionStats.growth.classAvg} secondaryGrowthLabel="YoY" secondaryGrowthValue={sessionStats.yoyGrowth.classAvg} subtext={`${formatPercentage(sessionStats.emptyShare)} empty-session share`} iconContainerClassName="bg-gradient-to-br from-slate-700 to-slate-900 text-white" />
                <StudioPulseMetricCard icon={<Target className="h-5 w-5" />} title="Fill Rate" metric={sessionStats.avgFill} precision={1} metricUnit="%" formatter={(v) => `${v.toFixed(1)}%`} growthLabel="MoM" growthValue={sessionStats.growth.avgFill} secondaryGrowthLabel="YoY" secondaryGrowthValue={sessionStats.yoyGrowth.avgFill} subtext="Capacity utilization across all sessions" iconContainerClassName="bg-gradient-to-br from-orange-600 to-red-700 text-white" />
                <StudioPulseMetricCard icon={<BarChart2 className="h-5 w-5" />} title="Sessions Conducted" metric={sessionStats.totalSessions} precision={0} formatter={formatNumber} growthLabel="MoM" growthValue={sessionStats.growth.totalSessions} secondaryGrowthLabel="YoY" secondaryGrowthValue={sessionStats.yoyGrowth.totalSessions} subtext={`${formatPercentage(sessionStats.emptyShare)} empty share`} iconContainerClassName="bg-gradient-to-br from-teal-600 to-emerald-700 text-white" />
              </div>

              {showClassMomTable && (
                <div className="mt-6">
                  {renderMatrixTable(
                    'Class performance month on month',
                    'Monthly class delivery and utilization metrics.',
                    classMatrix.months,
                    classMatrix.monthLabels,
                    classMatrix.metricRows,
                    (row, month) => openMetricDrillDown(`${row.label}${month ? ` • ${classMatrix.monthLabels[month]}` : ''}`, 'location', { name: row.label, rawData: month ? studioWideSessions.filter((item) => monthKeyFromDate(item.date) === month) : studioWideSessions, filteredTransactionData: month ? studioWideSessions.filter((item) => monthKeyFromDate(item.date) === month) : studioWideSessions }, studioWideSessions as any)
                  )}
                </div>
              )}

              {/* ── SESSION INTELLIGENCE ── */}
              <div className="mt-6 space-y-4">

                {/* ── Unified controls panel (mirrors reference repo Rankings controls) ── */}
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm space-y-4">

                  {/* Row 1: Rank By + Status + Advanced toggle */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Rank By</span>
                      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                        {([
                          { value: 'class', label: 'Classes' },
                          { value: 'trainer', label: 'Trainers' },
                          { value: 'format', label: 'Formats' },
                          { value: 'location', label: 'Locations' },
                          { value: 'time', label: 'Times' },
                          { value: 'day', label: 'Days' },
                        ] as const).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSessionRankingDimension(value)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                              sessionRankingDimension === value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                            )}
                          >{label}</button>
                        ))}
                      </div>
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</span>
                      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                        {(['all', 'active', 'inactive'] as const).map((val) => {
                          const lbl = { all: 'All', active: 'Active', inactive: 'Discontinued' }[val];
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setSessionStatusFilter(val)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                                sessionStatusFilter === val ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                              )}
                            >{lbl}</button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSessionShowAdvanced((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 ml-auto"
                    >
                      {sessionShowAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {sessionShowAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                      {(sessionMinCheckins > 0 || sessionMinClasses > 0 || sessionIncludeTrainer || sessionExcludeHosted || sessionGrouping !== 'none') && (
                        <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] text-white">
                          {[sessionMinCheckins > 0, sessionMinClasses > 0, sessionIncludeTrainer, sessionExcludeHosted, sessionGrouping !== 'none'].filter(Boolean).length}
                        </span>
                      )}
                    </button>
                  </div>

                  {sessionShowAdvanced && (
                    <>
                      {/* Row 2: Thresholds + toggles */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Min Check-ins</span>
                          <input
                            type="number" min="0"
                            value={sessionMinCheckins}
                            onChange={(e) => setSessionMinCheckins(parseInt(e.target.value) || 0)}
                            className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:border-slate-400 outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Min Classes</span>
                          <input
                            type="number" min="0"
                            value={sessionMinClasses}
                            onChange={(e) => setSessionMinClasses(parseInt(e.target.value) || 0)}
                            className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:border-slate-400 outline-none"
                          />
                        </div>
                        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={sessionIncludeTrainer}
                            onClick={() => setSessionIncludeTrainer(!sessionIncludeTrainer)}
                            className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', sessionIncludeTrainer ? 'bg-slate-800' : 'bg-slate-300')}
                          >
                            <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow', sessionIncludeTrainer ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                          </button>
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Include Trainer in Group Key</span>
                        </label>
                        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={sessionExcludeHosted}
                            onClick={() => setSessionExcludeHosted(!sessionExcludeHosted)}
                            className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', sessionExcludeHosted ? 'bg-slate-800' : 'bg-slate-300')}
                          >
                            <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow', sessionExcludeHosted ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                          </button>
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Exclude Hosted Classes</span>
                        </label>
                        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Group By</span>
                          <select
                            value={sessionGrouping}
                            onChange={(e) => setSessionGrouping(e.target.value as typeof sessionGrouping)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:border-slate-400 outline-none"
                          >
                            <option value="none">No Grouping</option>
                            <option value="ClassDayTimeLocation">✨ Class + Day + Time + Location (Recommended)</option>
                            <option value="ClassDayTimeLocationTrainer">👤 Class + Day + Time + Location + Trainer</option>
                            <option value="LocationClass">📍 Location → Class</option>
                            <option value="ClassDay">📅 Class → Day</option>
                            <option value="ClassTime">⏰ Class → Time</option>
                            <option value="ClassDayTrainer">🏋️ Class + Day + Trainer</option>
                            <option value="ClassTrainer">👥 Class + Trainer</option>
                            <option value="DayTimeLocation">🗓️ Day + Time + Location</option>
                            <option value="DayTime">📆 Day + Time</option>
                            <option value="TrainerLocation">🎯 Trainer + Location</option>
                            <option value="DayLocation">📌 Day + Location</option>
                            <option value="TimeLocation">⏱️ Time + Location</option>
                            <option value="ClassType">🎨 Class + Type</option>
                            <option value="TypeLocation">🏷️ Type + Location</option>
                            <option value="TrainerDay">👤 Trainer + Day</option>
                            <option value="ClassLocation">🏢 Class + Location</option>
                            <option value="TrainerTime">⏰ Trainer + Time</option>
                            <option value="AMSessions">🌅 AM Sessions (Before 12pm)</option>
                            <option value="PMSessions">🌆 PM Sessions (12pm+)</option>
                            <option value="MorningClasses">🌄 Morning Classes (6am-11am)</option>
                            <option value="EveningClasses">🌃 Evening Classes (5pm-9pm)</option>
                            <option value="Weekday">📊 Weekday (Mon-Fri)</option>
                            <option value="Weekend">🎉 Weekend (Sat-Sun)</option>
                            <option value="Class">📚 Class Only</option>
                            <option value="Type">🎯 Class Type</option>
                            <option value="Trainer">👤 Trainer Only</option>
                            <option value="Location">📍 Location Only</option>
                            <option value="Day">📅 Day of Week Only</option>
                            <option value="Date">📆 Date Only</option>
                            <option value="Time">⏰ Time Only</option>
                            <option value="SessionName">🎫 Session Name</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 3: Table controls */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-100 pt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Table</span>
                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                          {(['grouped', 'flat'] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setSessionViewMode(m)}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                                sessionViewMode === m ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                              )}
                            >
                              {m === 'grouped' ? <BookOpen className="w-3 h-3" /> : <BarChart2 className="w-3 h-3" />}
                              {m.charAt(0).toUpperCase() + m.slice(1)}
                            </button>
                          ))}
                        </div>
                        <select
                          value={sessionTableView}
                          onChange={(e) => setSessionTableView(e.target.value as typeof sessionTableView)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:border-slate-400 outline-none"
                        >
                          <option value="default">✨ All Metrics (Default)</option>
                          <option value="performance">🎯 Performance Focus</option>
                          <option value="revenue">💰 Revenue Analysis</option>
                          <option value="attendance">👥 Attendance Overview</option>
                          <option value="capacity">📊 Capacity Planning</option>
                          <option value="cancellations">❌ Cancellation Analysis</option>
                        </select>
                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                          {(['comfortable', 'compact'] as const).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setSessionDensity(d)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                                sessionDensity === d ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                              )}
                            >{d === 'comfortable' ? 'Cozy' : 'Compact'}</button>
                          ))}
                        </div>
                        <select
                          value={sessionRankingCount}
                          onChange={(e) => setSessionRankingCount(parseInt(e.target.value) as 10 | 20 | 30)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:border-slate-400 outline-none"
                        >
                          <option value={10}>Show 10</option>
                          <option value={20}>Show 20</option>
                          <option value={30}>Show 30</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {/* ── Top / Bottom performer cards (reference Rankings layout) ── */}
                {showSessionRankings && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Top Performers */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="bg-green-700 px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white">Top Performers</h3>
                          <p className="text-[10px] text-white/80 uppercase tracking-wider">Best in class</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={sessionTopMetric}
                          onChange={(e) => setSessionTopMetric(e.target.value as typeof sessionTopMetric)}
                          className="px-2 py-1.5 rounded-lg border border-white/40 bg-white/10 text-[11px] font-medium text-white focus:outline-none"
                        >
                          <option value="classAvg" className="bg-green-700">📊 Class Avg</option>
                          <option value="fillRate" className="bg-green-700">📈 Fill Rate</option>
                          <option value="visits" className="bg-green-700">👥 Total Visits</option>
                          <option value="revenue" className="bg-green-700">💰 Revenue</option>
                          <option value="revPerCheckin" className="bg-green-700">💵 Rev / Check-in</option>
                          <option value="sessions" className="bg-green-700">📚 Sessions</option>
                          <option value="cancellationRate" className="bg-green-700">❌ Cancel Rate</option>
                          <option value="compositeScore" className="bg-green-700">⭐ Composite</option>
                        </select>
                        <select
                          value={sessionTopCount}
                          onChange={(e) => setSessionTopCount(parseInt(e.target.value) as 5 | 10 | 20)}
                          className="px-2 py-1.5 rounded-lg border border-white/40 bg-white/10 text-[11px] font-medium text-white focus:outline-none"
                        >
                          <option value={5} className="bg-green-700">Top 5</option>
                          <option value={10} className="bg-green-700">Top 10</option>
                          <option value={20} className="bg-green-700">Top 20</option>
                        </select>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto bg-white">
                      {([...sessionIntelligence.rows]
                        .sort((a, b) => {
                          const key = sessionTopMetric as keyof typeof a;
                          return (b[key] as number) - (a[key] as number);
                        })
                        .slice(0, sessionTopCount)
                      ).map((group, index) => {
                        const fillPct = Math.min(group.fillRate, 100);
                        const metricVal = group[sessionTopMetric as keyof typeof group] as number;
                        const fmtTopVal = sessionTopMetric === 'fillRate' || sessionTopMetric === 'cancellationRate' || sessionTopMetric === 'compositeScore'
                          ? formatPercentage(metricVal)
                          : sessionTopMetric === 'revenue' || sessionTopMetric === 'revPerCheckin'
                          ? formatCurrency(metricVal)
                          : sessionTopMetric === 'classAvg'
                          ? metricVal.toFixed(1)
                          : formatNumber(metricVal);
                        return (
                          <div key={`top-${group.name}-${index}`} className="flex items-stretch gap-0 hover:bg-slate-50/80 transition-colors">
                            <div className="w-10 shrink-0 flex items-center justify-center">
                              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 text-white font-bold text-xs">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0 px-4 py-3">
                              <div className="flex items-start justify-between gap-3 mb-1.5">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-slate-900 truncate">{group.name}</p>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {formatNumber(group.sessions)} classes · {formatNumber(group.visits)} check-ins
                                  </p>
                                  <p className="text-[11px] text-green-700 font-semibold truncate mt-0.5">
                                    {formatPercentage(group.fillRate)} fill · {formatCurrency(group.revenue)} rev
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className="text-base font-bold text-slate-900">{fmtTopVal}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-green-600 rounded-full transition-all duration-500" style={{ width: `${fillPct}%` }} />
                                </div>
                                <span className="text-[9px] text-slate-400 font-medium shrink-0">{fillPct.toFixed(0)}% fill</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {sessionIntelligence.rows.length === 0 && (
                        <div className="p-6"><EmptyNote label="No session data for selected filters" /></div>
                      )}
                    </div>
                  </div>

                  {/* Needs Improvement */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="bg-red-700 px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                          <TrendingDown className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white">Needs Improvement</h3>
                          <p className="text-[10px] text-white/80 uppercase tracking-wider">Requiring attention</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={sessionBottomMetric}
                          onChange={(e) => setSessionBottomMetric(e.target.value as typeof sessionBottomMetric)}
                          className="px-2 py-1.5 rounded-lg border border-white/40 bg-red-700 text-[11px] font-medium text-white focus:outline-none"
                        >
                          <option value="classAvg" className="bg-red-700">📊 Class Avg</option>
                          <option value="fillRate" className="bg-red-700">📈 Fill Rate</option>
                          <option value="visits" className="bg-red-700">👥 Total Visits</option>
                          <option value="revenue" className="bg-red-700">💰 Revenue</option>
                          <option value="revPerCheckin" className="bg-red-700">💵 Rev / Check-in</option>
                          <option value="sessions" className="bg-red-700">📚 Sessions</option>
                          <option value="cancellationRate" className="bg-red-700">❌ Cancel Rate</option>
                          <option value="compositeScore" className="bg-red-700">⭐ Composite</option>
                        </select>
                        <select
                          value={sessionBottomCount}
                          onChange={(e) => setSessionBottomCount(parseInt(e.target.value) as 5 | 10 | 20)}
                          className="px-2 py-1.5 rounded-lg border border-white/40 bg-red-700 text-[11px] font-medium text-white focus:outline-none"
                        >
                          <option value={5} className="bg-red-700">Bottom 5</option>
                          <option value={10} className="bg-red-700">Bottom 10</option>
                          <option value={20} className="bg-red-700">Bottom 20</option>
                        </select>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto bg-white">
                      {([...sessionIntelligence.rows]
                        .sort((a, b) => {
                          const key = sessionBottomMetric as keyof typeof a;
                          return (a[key] as number) - (b[key] as number);
                        })
                        .slice(0, sessionBottomCount)
                      ).map((group, index) => {
                        const fillPct = Math.min(group.fillRate, 100);
                        const metricVal = group[sessionBottomMetric as keyof typeof group] as number;
                        const fmtBotVal = sessionBottomMetric === 'fillRate' || sessionBottomMetric === 'cancellationRate' || sessionBottomMetric === 'compositeScore'
                          ? formatPercentage(metricVal)
                          : sessionBottomMetric === 'revenue' || sessionBottomMetric === 'revPerCheckin'
                          ? formatCurrency(metricVal)
                          : sessionBottomMetric === 'classAvg'
                          ? metricVal.toFixed(1)
                          : formatNumber(metricVal);
                        return (
                          <div key={`bot-${group.name}-${index}`} className="flex items-stretch gap-0 hover:bg-slate-50/80 transition-colors">
                            <div className="w-10 shrink-0 flex items-center justify-center">
                              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-red-700 to-red-900 text-white font-bold text-xs">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0 px-4 py-3">
                              <div className="flex items-start justify-between gap-3 mb-1.5">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-slate-900 truncate">{group.name}</p>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {formatNumber(group.sessions)} classes · {formatNumber(group.visits)} check-ins
                                  </p>
                                  <p className="text-[11px] text-red-600 font-semibold truncate mt-0.5">
                                    {formatPercentage(group.fillRate)} fill · {formatCurrency(group.revenue)} rev
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className="text-base font-bold text-slate-900">{fmtBotVal}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${fillPct}%` }} />
                                </div>
                                <span className="text-[9px] text-slate-400 font-medium shrink-0">{fillPct.toFixed(0)}% fill</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {sessionIntelligence.rows.length === 0 && (
                        <div className="p-6"><EmptyNote label="No session data for selected filters" /></div>
                      )}
                    </div>
                  </div>
                </div>}

                {/* ── Session Intelligence grouped table (reference DataTable structure) ── */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                          <BarChart2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold">Session Intelligence</h4>
                          <p className="text-xs text-white/70">
                            {formatNumber(sessionIntelligence.rows.length)} groups · {formatNumber(filteredSessions.length)} sessions · sorted by {sessionRankingMetric}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={sessionRankingMetric}
                          onChange={(e) => setSessionRankingMetric(e.target.value as typeof sessionRankingMetric)}
                          className="px-2.5 py-1.5 rounded-lg border border-white/30 bg-white/10 text-xs font-medium text-white focus:outline-none"
                        >
                          <option value="classAvg" className="bg-slate-900">📊 Class Avg</option>
                          <option value="fillRate" className="bg-slate-900">📈 Fill Rate</option>
                          <option value="visits" className="bg-slate-900">👥 Total Visits</option>
                          <option value="revenue" className="bg-slate-900">💰 Revenue</option>
                          <option value="revPerCheckin" className="bg-slate-900">💵 Rev / Check-in</option>
                          <option value="sessions" className="bg-slate-900">📚 Sessions</option>
                          <option value="cancellationRate" className="bg-slate-900">❌ Cancel Rate</option>
                          <option value="compositeScore" className="bg-slate-900">⭐ Composite</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        <tr>
                          <th className="border-b border-slate-200 px-3 py-3 text-left w-10">#</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-left min-w-[220px]">{sessionRankingDimension.charAt(0).toUpperCase() + sessionRankingDimension.slice(1)}</th>
                          {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Sessions</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Visits</th>
                          </>}
                          {(sessionTableView === 'default' || sessionTableView === 'capacity') && <>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Capacity</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Empty</th>
                          </>}
                          {(sessionTableView === 'default' || sessionTableView === 'performance' || sessionTableView === 'attendance') && <>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Class Avg</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-left min-w-[130px]">Fill Rate</th>
                          </>}
                          {(sessionTableView === 'default' || sessionTableView === 'cancellations') && (
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Late Cancels</th>
                          )}
                          {(sessionTableView === 'default' || sessionTableView === 'cancellations') && (
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Cancel Rate</th>
                          )}
                          {(sessionTableView === 'default' || sessionTableView === 'revenue') && <>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Revenue</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Rev/Check-in</th>
                          </>}
                          {(sessionTableView === 'default' || sessionTableView === 'performance') && (
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Composite</th>
                          )}
                          {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Memberships</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Packages</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Intros</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Singles</th>
                          </>}
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {sessionIntelligence.rows.length ? sessionIntelligence.rows.map((row, i) => {
                          const expanded = sessionExpandedGroups.has(row.name);
                          const rowHeight = sessionDensity === 'compact' ? 'h-[32px]' : 'h-[42px]';
                          const childHeight = sessionDensity === 'compact' ? 'h-[28px]' : 'h-[36px]';
                          return (
                            <React.Fragment key={`si-${row.name}-${i}`}>
                              <tr
                                className={cn(rowHeight, 'border-b border-slate-100 hover:bg-slate-50 cursor-pointer')}
                                onClick={() => toggleSessionGroup(row.name)}
                              >
                                <td className="px-3 py-2 w-10"><span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 text-white font-bold text-xs">{i + 1}</span></td>
                                <td className="px-4 py-2 font-semibold text-slate-900 max-w-[260px]">
                                  <div className="flex items-center gap-1.5">
                                    <ChevronRight className={cn('h-3.5 w-3.5 text-slate-400 flex-shrink-0 transition-transform', expanded ? 'rotate-90' : '')} />
                                    <span className="truncate">{row.name}</span>
                                  </div>
                                </td>
                                {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                                  <td className="px-3 py-2 tabular-nums text-slate-700 text-right text-xs">{formatNumber(row.sessions)}</td>
                                  <td className="px-3 py-2 tabular-nums font-semibold text-slate-900 text-right text-xs">{formatNumber(row.visits)}</td>
                                </>}
                                {(sessionTableView === 'default' || sessionTableView === 'capacity') && <>
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.capacity)}</td>
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.empty)}</td>
                                </>}
                                {(sessionTableView === 'default' || sessionTableView === 'performance' || sessionTableView === 'attendance') && <>
                                  <td className="px-3 py-2 tabular-nums font-bold text-blue-700 text-right text-xs">{row.classAvg.toFixed(1)}</td>
                                  <td className="px-3 py-2 tabular-nums">
                                    <div className="flex items-center gap-2">
                                      <div className="h-1.5 w-14 rounded-full bg-slate-100">
                                        <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${Math.min(row.fillRate, 100)}%` }} />
                                      </div>
                                      <span className="text-xs font-semibold text-slate-800">{formatPercentage(row.fillRate)}</span>
                                    </div>
                                  </td>
                                </>}
                                {(sessionTableView === 'default' || sessionTableView === 'cancellations') && (
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.lateCancels)}</td>
                                )}
                                {(sessionTableView === 'default' || sessionTableView === 'cancellations') && (
                                  <td className="px-3 py-2 tabular-nums text-right text-xs">
                                    <span className={cn('font-medium', row.cancellationRate > 15 ? 'text-red-600' : 'text-slate-600')}>
                                      {formatPercentage(row.cancellationRate)}
                                    </span>
                                  </td>
                                )}
                                {(sessionTableView === 'default' || sessionTableView === 'revenue') && <>
                                  <td className="px-3 py-2 tabular-nums font-semibold text-green-700 text-right text-xs">{formatCurrency(row.revenue)}</td>
                                  <td className="px-3 py-2 tabular-nums text-slate-600 text-right text-xs">{formatCurrency(row.revPerCheckin)}</td>
                                </>}
                                {(sessionTableView === 'default' || sessionTableView === 'performance') && (
                                  <td className="px-3 py-2 tabular-nums text-right text-xs">
                                    <span className="font-semibold text-slate-700">{row.compositeScore.toFixed(1)}</span>
                                  </td>
                                )}
                                {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.memberships)}</td>
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.packages)}</td>
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.introOffers)}</td>
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.singleClasses)}</td>
                                </>}
                              </tr>
                              {expanded && row.children.map((child, ci) => (
                                <tr key={`si-child-${row.name}-${ci}`} className={cn(childHeight, 'border-b border-slate-50 bg-slate-50/50 hover:bg-slate-100/60')}>
                                  <td className="px-3 py-1.5 text-slate-300 text-xs text-center">↳</td>
                                  <td className="px-4 py-1.5 text-slate-600 text-xs min-w-[220px]">
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-slate-700 truncate">{child.date}</span>
                                      <span className="text-[10px] text-slate-400 truncate">{child.trainer} · {child.location}</span>
                                    </div>
                                  </td>
                                  {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                                    <td className="px-3 py-1.5 tabular-nums text-slate-400 text-right text-xs">1</td>
                                    <td className="px-3 py-1.5 tabular-nums text-slate-700 text-right text-xs">{child.visits}</td>
                                  </>}
                                  {(sessionTableView === 'default' || sessionTableView === 'capacity') && <>
                                    <td className="px-3 py-1.5 tabular-nums text-slate-400 text-right text-xs">{child.capacity}</td>
                                    <td className="px-3 py-1.5 tabular-nums text-slate-400 text-right text-xs">{child.empty}</td>
                                  </>}
                                  {(sessionTableView === 'default' || sessionTableView === 'performance' || sessionTableView === 'attendance') && <>
                                    <td className="px-3 py-1.5 tabular-nums text-blue-700 text-right text-xs font-medium">{child.classAvg.toFixed(1)}</td>
                                    <td className="px-3 py-1.5 tabular-nums">
                                      <div className="flex items-center gap-1.5">
                                        <div className="h-1 w-10 rounded-full bg-slate-200">
                                          <div className="h-1 rounded-full bg-cyan-400" style={{ width: `${Math.min(child.fillRate, 100)}%` }} />
                                        </div>
                                        <span className="text-[10px] text-slate-500">{child.fillRate.toFixed(0)}%</span>
                                      </div>
                                    </td>
                                  </>}
                                  {(sessionTableView === 'default' || sessionTableView === 'cancellations') && (
                                    <td className="px-3 py-1.5 tabular-nums text-slate-400 text-right text-xs">{child.lateCancels}</td>
                                  )}
                                  {(sessionTableView === 'default' || sessionTableView === 'cancellations') && (
                                    <td className="px-3 py-1.5 tabular-nums text-right text-xs text-slate-500">—</td>
                                  )}
                                  {(sessionTableView === 'default' || sessionTableView === 'revenue') && <>
                                    <td className="px-3 py-1.5 tabular-nums text-green-700 text-right text-xs">{formatCurrency(child.revenue)}</td>
                                    <td className="px-3 py-1.5 tabular-nums text-slate-500 text-right text-xs">{child.visits > 0 ? formatCurrency(child.revenue / child.visits) : '—'}</td>
                                  </>}
                                  {(sessionTableView === 'default' || sessionTableView === 'performance') && (
                                    <td className="px-3 py-1.5 text-right text-xs text-slate-400">—</td>
                                  )}
                                  {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                                    <td className="px-3 py-1.5 text-right text-xs text-slate-400" colSpan={4}>—</td>
                                  </>}
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        }) : <tr><td colSpan={18} className="p-5"><EmptyNote label="No session data available for the selected filters" /></td></tr>}
                      </tbody>
                      {sessionIntelligence.rows.length > 0 && (() => {
                        const rows = sessionIntelligence.rows;
                        const totSessions = rows.reduce((s, r) => s + r.sessions, 0);
                        const totVisits = rows.reduce((s, r) => s + r.visits, 0);
                        const totCapacity = rows.reduce((s, r) => s + r.capacity, 0);
                        const totEmpty = rows.reduce((s, r) => s + r.empty, 0);
                        const avgClassAvg = totSessions ? totVisits / totSessions : 0;
                        const avgFill = totCapacity ? (totVisits / totCapacity) * 100 : 0;
                        const totLC = rows.reduce((s, r) => s + r.lateCancels, 0);
                        const totRevenue = rows.reduce((s, r) => s + r.revenue, 0);
                        const avgRevPerCheckin = totVisits ? totRevenue / totVisits : 0;
                        const totMemberships = rows.reduce((s, r) => s + r.memberships, 0);
                        const totPackages = rows.reduce((s, r) => s + r.packages, 0);
                        const totIntros = rows.reduce((s, r) => s + r.introOffers, 0);
                        const totSingles = rows.reduce((s, r) => s + r.singleClasses, 0);
                        return (
                          <tfoot>
                            <tr className="bg-slate-900 text-white text-xs font-bold h-[40px]">
                              <td className="px-3 py-2"></td>
                              <td className="px-4 py-2">Totals / Avg ({rows.length} groups)</td>
                              {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                                <td className="px-3 py-2 text-right">{formatNumber(totSessions)}</td>
                                <td className="px-3 py-2 text-right">{formatNumber(totVisits)}</td>
                              </>}
                              {(sessionTableView === 'default' || sessionTableView === 'capacity') && <>
                                <td className="px-3 py-2 text-right">{formatNumber(totCapacity)}</td>
                                <td className="px-3 py-2 text-right">{formatNumber(totEmpty)}</td>
                              </>}
                              {(sessionTableView === 'default' || sessionTableView === 'performance' || sessionTableView === 'attendance') && <>
                                <td className="px-3 py-2 text-right">{avgClassAvg.toFixed(1)}</td>
                                <td className="px-3 py-2 text-right">{formatPercentage(avgFill)}</td>
                              </>}
                              {(sessionTableView === 'default' || sessionTableView === 'cancellations') && <td className="px-3 py-2 text-right">{formatNumber(totLC)}</td>}
                              {(sessionTableView === 'default' || sessionTableView === 'cancellations') && <td className="px-3 py-2 text-right">—</td>}
                              {(sessionTableView === 'default' || sessionTableView === 'revenue') && <>
                                <td className="px-3 py-2 text-right">{formatCurrency(totRevenue)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(avgRevPerCheckin)}</td>
                              </>}
                              {(sessionTableView === 'default' || sessionTableView === 'performance') && <td className="px-3 py-2 text-right">—</td>}
                              {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                                <td className="px-3 py-2 text-right">{formatNumber(totMemberships)}</td>
                                <td className="px-3 py-2 text-right">{formatNumber(totPackages)}</td>
                                <td className="px-3 py-2 text-right">{formatNumber(totIntros)}</td>
                                <td className="px-3 py-2 text-right">{formatNumber(totSingles)}</td>
                              </>}
                            </tr>
                          </tfoot>
                        );
                      })()}
                    </table>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-2">
                  {renderAISummary('attendance-table', [
                    `${formatNumber(sessionStats.totalSessions)} sessions conducted with ${formatNumber(sessionStats.attendance)} total visits and ${formatPercentage(sessionStats.avgFill)} average fill rate.`,
                    `Average class size across non-empty sessions is ${sessionStats.classAvg.toFixed(1)}, with ${formatPercentage(sessionStats.emptyShare)} of sessions running empty.`,
                    `${lcStats.total} late cancellations recorded across sessions — review slot patterns.`,
                  ])}
                </div>
              </div>
            </AnimatedSectionCard>

            {/* ── FORMAT COMPARISON SECTION ── */}
            <AnimatedSectionCard
              title="Class Formats & Performance Analysis"
              subtitle="Format-level attendance trends, fill rates, revenue, and trainer comparison"
              icon={BarChart2}
              iconGradient="from-orange-500 to-amber-700"
              iconColor="#d97706"
              sectionNumber={7}
            >
              <div className="space-y-6">
                {/* Comparison cards (overview) */}
                <FormatComparisonSection sessions={filteredSessions} activeTab={formatCompTab} onTabChange={setFormatCompTab} />
                {/* Detailed per-class breakdown */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-5 py-4 text-white">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                        <BarChart2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">Detailed Format Breakdown</h4>
                        <p className="text-[11px] text-white/60">Per-class metrics: sessions, attendance, fill, revenue, late cancels · by trainer, time slot, or day</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <DetailedComparisonView data={filteredSessions as any} />
                  </div>
                  <div className="px-5 pb-5">
                    {renderAISummary('sales-mix', [
                      'Use the detailed comparison to isolate which session formats are driving the best attendance and revenue combination.',
                      'Look for formats with high fill but weak revenue if pricing or package mix is suppressing yield.',
                      'The strongest formats should be those with healthy attendance and stable revenue per check-in.',
                    ])}
                  </div>
                </div>
              </div>
            </AnimatedSectionCard>

            {/* ── SECTION 8: STUDIO OPERATIONS ── */}
            <AnimatedSectionCard
              title="Studio Operations"
              subtitle="Peak hours, capacity utilization, and complementary class trends"
              icon={BarChart2}
              iconGradient="from-cyan-600 to-teal-800"
              iconColor="#0891b2"
              sectionNumber={8}
            >
              <div className="space-y-6">
                {/* Peak Hour Heatmap */}
                {(() => {
                  type HeatMetric = typeof heatmapMetric;
                  const HEATMAP_TABS: { key: HeatMetric; label: string; icon: string; format: (v: number) => string; palette: [string, string, string]; darkThreshold: number }[] = [
                    { key: 'attendance',  label: 'Attendance',   icon: '👥', format: (v) => String(Math.round(v)),  palette: ['#dbeafe','#2563eb','#1e3a8a'], darkThreshold: 0.42 },
                    { key: 'classes',     label: 'Classes',      icon: '📅', format: (v) => String(Math.round(v)),  palette: ['#ede9fe','#7c3aed','#3b0764'], darkThreshold: 0.38 },
                    { key: 'booked',      label: 'Booked',       icon: '🎟️', format: (v) => String(Math.round(v)),  palette: ['#d1fae5','#059669','#022c22'], darkThreshold: 0.42 },
                    { key: 'lateCancels', label: 'Late Cancels', icon: '⚠️', format: (v) => String(Math.round(v)),  palette: ['#fee2e2','#dc2626','#450a0a'], darkThreshold: 0.38 },
                    { key: 'fillRate',    label: 'Fill Rate',    icon: '📊', format: (v) => `${v.toFixed(0)}%`,     palette: ['#fef9c3','#d97706','#78350f'], darkThreshold: 0.38 },
                  ];
                  const activeTab = HEATMAP_TABS.find((t) => t.key === heatmapMetric)!;

                  let globalMax = 0;
                  peakHourHeatmap.timeSlots.forEach((slot) => {
                    peakHourHeatmap.days.forEach((day) => {
                      const v = peakHourHeatmap.buckets[slot]?.[day]?.[heatmapMetric] ?? 0;
                      if (v > globalMax) globalMax = v;
                    });
                  });
                  const norm = globalMax > 0 ? globalMax : 1;

                  // Interpolate between three palette stops
                  const interpColor = (hex1: string, hex2: string, t: number) => {
                    const p = (h: string) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)] as [number,number,number];
                    const [r1,g1,b1] = p(hex1), [r2,g2,b2] = p(hex2);
                    return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
                  };
                  const cellBg = (v: number) => {
                    if (v === 0) return 'transparent';
                    const t = Math.min(v / norm, 1);
                    const [lo, mid, hi] = activeTab.palette;
                    return t < 0.5 ? interpColor(lo, mid, t * 2) : interpColor(mid, hi, (t - 0.5) * 2);
                  };
                  const cellFg = (v: number) => {
                    const t = Math.min(v / norm, 1);
                    return t > activeTab.darkThreshold ? '#fff' : '#1e293b';
                  };

                  const fmtHour = (slot: string) => {
                    const [hStr, mStr] = slot.split(':');
                    const h = parseInt(hStr);
                    const m = parseInt(mStr || '0');
                    if (isNaN(h)) return slot;
                    const ampm = h < 12 ? 'AM' : 'PM';
                    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
                  };

                  // Find peak cell for annotation
                  let peakSlot = '', peakDay = '', peakVal = 0;
                  peakHourHeatmap.timeSlots.forEach((slot) => {
                    peakHourHeatmap.days.forEach((day) => {
                      const v = peakHourHeatmap.buckets[slot]?.[day]?.[heatmapMetric] ?? 0;
                      if (v > peakVal) { peakVal = v; peakSlot = slot; peakDay = day; }
                    });
                  });

                  return (
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.10)]">
                      {/* Dark header */}
                      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg">{activeTab.icon}</div>
                          <div>
                            <h4 className="text-base font-bold text-white tracking-tight">Peak Hour · Day-of-Week Heatmap</h4>
                            <p className="text-[11px] text-white/50 mt-0.5">
                              {activeTab.label} per time × day · peak: <span className="text-white/80 font-semibold">{fmtHour(peakSlot)} {peakDay} ({activeTab.format(peakVal)})</span>
                            </p>
                          </div>
                        </div>
                        {/* Metric pill switcher */}
                        <div className="flex items-center gap-1 rounded-2xl bg-white/8 border border-white/10 p-1 backdrop-blur-sm">
                          {HEATMAP_TABS.map((tab) => (
                            <button
                              key={tab.key}
                              onClick={() => setHeatmapMetric(tab.key)}
                              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 ${heatmapMetric === tab.key ? 'bg-white text-slate-900 shadow-md' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                            >
                              <span>{tab.icon}</span>
                              <span>{tab.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Heatmap grid */}
                      <div className="overflow-x-auto bg-slate-950/[0.02]">
                        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                          <colgroup>
                            <col style={{ width: 100 }} />
                            {peakHourHeatmap.days.map((d) => <col key={d} />)}
                          </colgroup>
                          <thead>
                            <tr>
                              <th className="sticky left-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-4 py-3" />
                              {peakHourHeatmap.days.map((d) => (
                                <th key={d} className="border-b border-slate-200 py-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                  {d.slice(0, 3).toUpperCase()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {peakHourHeatmap.timeSlots.map((slot) => (
                              <tr key={slot} className="group">
                                {/* Time label */}
                                <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-4 py-0 group-hover:bg-slate-50 transition-colors">
                                  <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{fmtHour(slot)}</span>
                                </td>
                                {peakHourHeatmap.days.map((day) => {
                                  const cell = peakHourHeatmap.buckets[slot]?.[day];
                                  const val = cell?.[heatmapMetric] ?? 0;
                                  const isPeak = slot === peakSlot && day === peakDay;
                                  const teacherList = cell?.teacherList ?? [];
                                  const classList = cell?.classList ?? [];
                                  const fgColor = val > 0 ? cellFg(val) : '#94a3b8';
                                  const fgMuted = val > 0 ? (cellFg(val) === '#fff' ? 'rgba(255,255,255,0.65)' : 'rgba(30,41,59,0.55)') : '#cbd5e1';
                                  return (
                                    <td
                                      key={day}
                                      className="relative p-0 text-center group/cell overflow-hidden border border-white/30"
                                      style={{ backgroundColor: val > 0 ? cellBg(val) : '#f1f5f9', minWidth: 90 }}
                                    >
                                      {isPeak && val > 0 && (
                                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_4px_2px_rgba(253,224,71,0.5)]" />
                                      )}
                                      <div className="flex flex-col items-center gap-0.5 px-1 py-1.5">
                                        {/* Primary value */}
                                        <span
                                          className="text-[13px] font-black tabular-nums leading-none"
                                          style={{ color: val > 0 ? fgColor : '#cbd5e1' }}
                                        >
                                          {val > 0 ? activeTab.format(val) : '—'}
                                        </span>
                                        {val > 0 && (
                                          <>
                                            {/* Class names — always visible */}
                                            {classList.length > 0 && (
                                              <div className="w-full mt-0.5 space-y-px">
                                                {classList.slice(0, 2).map((cn) => (
                                                  <div
                                                    key={cn}
                                                    className="truncate rounded px-1 text-[8px] font-semibold leading-tight text-center"
                                                    style={{ color: fgMuted, maxWidth: '100%' }}
                                                    title={cn}
                                                  >
                                                    {cn.length > 14 ? cn.slice(0, 13) + '…' : cn}
                                                  </div>
                                                ))}
                                                {classList.length > 2 && (
                                                  <div className="text-[7px] font-medium text-center" style={{ color: fgMuted }}>
                                                    +{classList.length - 2} more
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            {/* Trainer names — always visible */}
                                            {teacherList.length > 0 && (
                                              <div className="w-full mt-0.5 space-y-px">
                                                {teacherList.slice(0, 2).map((t) => (
                                                  <div
                                                    key={t}
                                                    className="truncate rounded px-1 text-[8px] font-medium leading-tight text-center"
                                                    style={{ color: fgMuted, maxWidth: '100%' }}
                                                    title={t}
                                                  >
                                                    👤 {t.length > 12 ? t.slice(0, 11) + '…' : t}
                                                  </div>
                                                ))}
                                                {teacherList.length > 2 && (
                                                  <div className="text-[7px] font-medium text-center" style={{ color: fgMuted }}>
                                                    +{teacherList.length - 2} trainers
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer legend */}
                      <div className="flex items-center justify-between gap-4 px-6 py-3 border-t border-slate-100 bg-slate-50/80">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Low</span>
                          <div className="flex rounded-md overflow-hidden h-3" style={{ width: 112 }}>
                            {Array.from({ length: 14 }, (_, i) => (
                              <div key={i} className="flex-1" style={{ backgroundColor: cellBg(((i + 1) / 14) * norm) }} />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">High</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_3px_1px_rgba(253,224,71,0.5)]" /> Peak cell</span>
                          <span>Max: <strong className="text-slate-600">{activeTab.format(globalMax)}</strong></span>
                        </div>
                      </div>
                      <div className="px-6 pb-6">
                        {renderAISummary('attendance-heatmap', [
                          `Peak heatmap cell is ${fmtHour(peakSlot)} on ${peakDay} at ${activeTab.format(peakVal)} for ${activeTab.label.toLowerCase()}.`,
                          'The heatmap is the clearest place to see time-of-day demand concentration.',
                          'Move supply toward the strongest time and day clusters rather than spreading capacity evenly.',
                        ])}
                      </div>
                    </div>
                  );
                })()}

                {/* Capacity Utilization by Studio */}
                {capacityByStudio.length > 0 && (
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                        <BarChart2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Capacity Utilization by Studio</h4>
                        <p className="text-xs text-white/60">Booked slots vs. available capacity per location</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Location</th>
                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Sessions</th>
                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Booked</th>
                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Capacity</th>
                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">Utilization</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {capacityByStudio.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-2.5 font-medium text-slate-900">{row.location}</td>
                              <td className="px-4 py-2.5 tabular-nums text-right text-slate-600">{formatNumber(row.sessions)}</td>
                              <td className="px-4 py-2.5 tabular-nums text-right text-slate-700">{formatNumber(row.booked)}</td>
                              <td className="px-4 py-2.5 tabular-nums text-right text-slate-500">{formatNumber(row.capacity)}</td>
                              <td className="px-4 py-2.5 tabular-nums text-right font-bold text-slate-900">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${row.utilization >= 70 ? 'bg-emerald-100 text-emerald-800' : row.utilization >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                  {row.utilization.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Free / Complementary Visits Trend */}
                {compRateTrend.length > 0 && (
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-5 text-white flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                          <BarChart2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Free &amp; Complementary Visits</h4>
                          <p className="text-xs text-white/50">NonPaid % and Complementary % of total check-ins · all-time · studio-scoped</p>
                        </div>
                      </div>
                      {/* Summary pills */}
                      <div className="flex items-center gap-3">
                        {[
                          { label: 'Avg NonPaid %', value: compRateTrend.length ? `${(compRateTrend.reduce((s, d) => s + d.nonPaidRate, 0) / compRateTrend.length).toFixed(1)}%` : '—', color: '#f59e0b' },
                          { label: 'Avg Comp %',    value: compRateTrend.length ? `${(compRateTrend.reduce((s, d) => s + d.compRate, 0) / compRateTrend.length).toFixed(1)}%` : '—', color: '#8b5cf6' },
                        ].map((p) => (
                          <div key={p.label} className="flex flex-col items-end">
                            <span className="text-[18px] font-black" style={{ color: p.color }}>{p.value}</span>
                            <span className="text-[10px] text-white/50 uppercase tracking-widest">{p.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  <div className="p-6 sp-chart-rise" style={{ animationDelay: '0.1s' }}>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={compRateTrend} margin={{ top: 14, right: 20, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="nonPaidGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"  stopColor="#f59e0b" stopOpacity={0.45} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="compGrad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"  stopColor="#8b5cf6" stopOpacity={0.45} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <filter id="area-glow">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                          <RechartsTooltip
                            contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                            formatter={(v: number, name: string) => [`${v.toFixed(2)}%`, name === 'nonPaidRate' ? 'NonPaid %' : 'Comp %']}
                          />
                          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} formatter={(v) => v === 'nonPaidRate' ? 'NonPaid %' : 'Comp %'} />
                          <Area type="monotone" dataKey="nonPaidRate" stroke="#f59e0b" strokeWidth={3} fill="url(#nonPaidGrad)" dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationDuration={1200} animationEasing="ease-out" />
                          <Area type="monotone" dataKey="compRate"    stroke="#8b5cf6" strokeWidth={3} fill="url(#compGrad2)"   dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationDuration={1200} animationEasing="ease-out" animationBegin={200} />
                        </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="px-6 pb-6">
                    {renderAISummary('attendance-comp', [
                      'Track non-paid and complementary share together to avoid calling a high-traffic month healthy when monetization is weakening.',
                      'If the free visit share rises without a matching increase in revenue per visit, the mix is becoming less efficient.',
                      'This chart is a quality-of-demand check, not just an activity trend.',
                    ])}
                  </div>
                </div>
              )}
              </div>
            </AnimatedSectionCard>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur-sm">
              <p className="text-xs text-slate-500">
                Snapshot for <span className="font-semibold text-slate-700">{activeStudio.name}</span> · {activeStudio.area}
                <span className="ml-2">· {dateRange.start} to {dateRange.end}</span>
                {anyLoading && <span className="ml-2 italic text-slate-400">refreshing…</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Sales', path: '/sales-analytics' },
                  { label: 'Attendance', path: '/class-attendance' },
                  { label: 'Retention', path: '/client-retention' },
                  { label: 'Trainers', path: '/trainer-performance' },
                  { label: 'Funnel', path: '/funnel-leads' },
                ].map((link) => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                  >
                    {link.label} <ArrowUpRight className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        </>
      </div>

      {aiPanel && (
        <FloatingAISectionPanel
          isOpen={aiPanel.open}
          onClose={() => setAIPanel(null)}
          title={aiPanel.title}
          sectionKey={aiPanel.sectionKey}
          getSummary={getSummary}
          aiSectionLoading={aiSectionLoading}
          onGenerate={() => generateAISummary(buildSummaryInput(aiPanel.sectionKey))}
        />
      )}

      <InsightDetailDialog
        open={insightOpen}
        onOpenChange={setInsightOpen}
        title={locationSummary.title}
        subtitle={locationSummary.subtitle}
        badge={locationSummary.badge}
        stats={locationSummary.stats}
        sections={locationSummary.sections}
        footerNote="This summary uses the currently selected studio scope and date filter."
      />

      {drillDownConfig ? (
        <UniversalDrillDownModal
          isOpen={drillDownOpen}
          onClose={() => setDrillDownOpen(false)}
          data={drillDownConfig.data}
          relatedData={drillDownConfig.relatedData}
          type={drillDownConfig.type}
          title={drillDownConfig.title}
        />
      ) : null}

      <Footer />
    </div>
  );
});

StudioPulse.displayName = 'StudioPulse';

export default StudioPulse;
