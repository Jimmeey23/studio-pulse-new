import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getTrainerImage, getTrainerInitials } from '@/components/ui/TrainerAvatar';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  X,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Target,
  Calendar,
  Award,
  Star,
  Clock,
  MapPin,
  Zap,
  BarChart3,
  PieChartIcon,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  Bike,
  Dumbbell,
  Music,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

interface ComprehensiveTrainerDrillDownProps {
  isOpen: boolean;
  onClose: () => void;
  trainerName: string;
  trainerData: any;
  allPayrollData?: any[];
  allSessionsData?: any[];
  filters?: { location?: string; month?: string };
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  pink: '#EC4899',
  indigo: '#6366F1',
};

const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.purple, COLORS.cyan, COLORS.pink];

// Metric Card Component
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'blue',
  size = 'default'
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'cyan';
  size?: 'default' | 'large';
}) => {
  const colorClasses = {
    blue: 'from-blue-700 to-blue-800 text-white',
    green: 'from-white to-gray-50 text-gray-900 border-2 border-gray-200',
    purple: 'from-white to-gray-50 text-gray-900 border-2 border-gray-200',
    amber: 'from-white to-gray-50 text-gray-900 border-2 border-gray-200',
    rose: 'from-white to-gray-50 text-gray-900 border-2 border-gray-200',
    cyan: 'from-white to-gray-50 text-gray-900 border-2 border-gray-200',
  };

  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400';

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl bg-gradient-to-br p-4 shadow-lg transition-all hover:shadow-xl",
      colorClasses[color],
      size === 'large' && 'p-6'
    )}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className={cn(
            "p-2 rounded-lg backdrop-blur-sm",
            color === 'blue' ? 'bg-white/20' : 'bg-blue-600'
          )}>
            <Icon className={cn(
              size === 'large' ? 'w-6 h-6' : 'w-5 h-5',
              color === 'blue' ? 'text-white' : 'text-white'
            )} />
          </div>
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
              <TrendIcon className="w-3 h-3" />
              {trendValue}
            </div>
          )}
        </div>
        <p className={cn(
          "font-bold",
          size === 'large' ? 'text-3xl' : 'text-2xl',
          color === 'blue' ? 'text-white' : 'text-gray-900'
        )}>
          {value}
        </p>
        <p className={cn(
          "text-sm font-medium",
          color === 'blue' ? 'text-white/90' : 'text-gray-700'
        )}>{title}</p>
        {subtitle && <p className={cn(
          "text-xs mt-1",
          color === 'blue' ? 'text-white/70' : 'text-gray-600'
        )}>{subtitle}</p>}
      </div>
    </div>
  );
};

// Format Distribution Mini Chart
const FormatDistributionChart = ({ data }: { data: { name: string; value: number; sessions: number }[] }) => {
  if (!data || data.length === 0) return null;
  
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={item.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {item.name === 'Cycle' && <Bike className="w-4 h-4 text-blue-500" />}
              {item.name === 'Strength' && <Dumbbell className="w-4 h-4 text-purple-500" />}
              {item.name === 'Barre' && <Music className="w-4 h-4 text-pink-500" />}
              <span className="font-medium text-slate-700">{item.name}</span>
            </div>
            <span className="text-slate-600">{item.sessions} sessions</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                item.name === 'Cycle' && 'bg-gradient-to-r from-blue-400 to-blue-600',
                item.name === 'Strength' && 'bg-gradient-to-r from-purple-400 to-purple-600',
                item.name === 'Barre' && 'bg-gradient-to-r from-pink-400 to-pink-600'
              )}
              style={{ width: `${Math.min(item.value, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Performance Indicator
const PerformanceIndicator = ({ score, label }: { score: number; label: string }) => {
  const getColor = () => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getIcon = () => {
    if (score >= 80) return CheckCircle2;
    if (score >= 60) return AlertCircle;
    return XCircle;
  };

  const Icon = getIcon();

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("w-5 h-5", getColor())} />
      <div>
        <span className={cn("font-bold text-lg", getColor())}>{score.toFixed(0)}</span>
        <span className="text-slate-500 text-sm ml-1">/100</span>
      </div>
      <span className="text-slate-600 text-sm">{label}</span>
    </div>
  );
};

export function ComprehensiveTrainerDrillDown({
  isOpen,
  onClose,
  trainerName,
  trainerData,
  allPayrollData = [],
  allSessionsData = [],
  filters = {},
}: ComprehensiveTrainerDrillDownProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Process all the data comprehensively
  const processedData = useMemo(() => {
    logger.debug('🔍 [Modal] Processing drill-down', {
      trainerName,
      filters,
      trainerDataKeys: Object.keys(trainerData || {}),
      trainerDataSample: trainerData
    });

    if (!trainerData) {
      return {
        hasData: false,
        summary: null,
        byMonth: [],
        byFormat: [],
        performanceScore: 0,
        insights: [],
        comparisons: null,
      };
    }

    const locationMatches = (recordLoc: string, filterLoc?: string) => {
      if (!filterLoc || filterLoc === 'All Locations') return true;
      const rl = (recordLoc || '').toLowerCase();
      const fl = filterLoc.toLowerCase();
      if (fl.includes('kenkere')) return rl.includes('kenkere');
      if (fl.includes('kwality')) return rl.includes('kwality') || rl.includes('kemps');
      if (fl.includes('supreme')) return rl.includes('supreme') || rl.includes('bandra');
      return recordLoc === filterLoc;
    };

    // Contextual records for the clicked trainer + location + month (overview/revenue)
    const trainerRecordsContext = allPayrollData.filter(
      (r) => r.teacherName === trainerName &&
        locationMatches(r.location, filters.location) &&
        (!filters.month || r.monthYear === filters.month)
    );

    // Records for trends: ignore the month filter, keep trainer + location
    const trainerRecordsAllMonths = allPayrollData.filter(
      (r) => r.teacherName === trainerName &&
        locationMatches(r.location, filters.location)
    );

    // Robust date parsing to normalize to MMM-YYYY (tries multiple formats)
    const toMonthYear = (dStr: string) => {
      if (!dStr && dStr !== 0) return '';
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

      // If already in MMM-YYYY, return as-is
      if (typeof dStr === 'string' && /^[A-Za-z]{3}-\d{4}$/.test(dStr.trim())) {
        return dStr.trim();
      }

      // Try native Date parsing first
      const tryNative = (s: string) => {
        const dt = new Date(s);
        if (!isNaN(dt.getTime())) return `${months[dt.getMonth()]}-${dt.getFullYear()}`;
        return '';
      };

      // Common patterns: YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY, DD/MM/YYYY
      const s = String(dStr).trim();
      let out = tryNative(s);
      if (out) return out;

      // YYYY-MM-DD or YYYY/MM/DD
      const iso = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
      if (iso) {
        const y = Number(iso[1]);
        const m = Number(iso[2]) - 1;
        if (!isNaN(y) && !isNaN(m)) return `${months[m]}-${y}`;
      }

      // MM/DD/YYYY or MM-DD-YYYY
      const mdy = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
      if (mdy) {
        const y = Number(mdy[3]);
        const m = Number(mdy[1]) - 1;
        if (!isNaN(y) && !isNaN(m)) return `${months[m]}-${y}`;
      }

      // DD-MM-YYYY or DD/MM/YYYY
      const dmy = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
      if (dmy) {
        const y = Number(dmy[3]);
        const m = Number(dmy[2]) - 1;
        if (!isNaN(y) && !isNaN(m)) return `${months[m]}-${y}`;
      }

      // Fallback: try Date.parse numeric
      const parsed = Date.parse(s);
      if (!isNaN(parsed)) {
        const dt = new Date(parsed);
        return `${months[dt.getMonth()]}-${dt.getFullYear()}`;
      }

      return '';
    };

    const trainerSessionsAll = (allSessionsData || []).filter((s: any) => {
      const sessionMonthYear = toMonthYear(String(s.date || ''));
      const nameMatch = (s.trainerName === trainerName || s.teacherName === trainerName);
      const locMatch = locationMatches(s.location, filters.location);
      const monthMatch = !filters.month || sessionMonthYear === filters.month;
      return nameMatch && locMatch && monthMatch;
    });

    // Current period data (aggregate contextual records filtered by trainer + location + month)

    // Use trainerData directly as the source for the clicked context
    // Only aggregate from payroll if trainerData is missing key fields
    const hasDirectData = trainerData && (
      trainerData.totalSessions !== undefined || 
      trainerData.currentSessions !== undefined ||
      trainerData.sessions !== undefined
    );

    const source = hasDirectData ? trainerData : (
      trainerRecordsContext.length > 0
        ? trainerRecordsContext.reduce((acc: any, r: any) => {
            acc.totalSessions = (acc.totalSessions || 0) + (r.totalSessions || 0);
            acc.totalCustomers = (acc.totalCustomers || 0) + (r.totalCustomers || 0);
            acc.totalPaid = (acc.totalPaid || 0) + (r.totalPaid || 0);
            acc.emptySessions = (acc.emptySessions || 0) + (r.emptySessions || 0);
            acc.nonEmptySessions = (acc.nonEmptySessions || 0) + (r.nonEmptySessions || 0);
            acc.cycleSessions = (acc.cycleSessions || 0) + (r.cycleSessions || 0);
            acc.cycleCustomers = (acc.cycleCustomers || 0) + (r.cycleCustomers || 0);
            acc.cycleRevenue = (acc.cycleRevenue || 0) + (r.cycleRevenue || r.cyclePaid || 0);
            acc.strengthSessions = (acc.strengthSessions || 0) + (r.strengthSessions || 0);
            acc.strengthCustomers = (acc.strengthCustomers || 0) + (r.strengthCustomers || 0);
            acc.strengthRevenue = (acc.strengthRevenue || 0) + (r.strengthRevenue || r.strengthPaid || 0);
            acc.barreSessions = (acc.barreSessions || 0) + (r.barreSessions || 0);
            acc.barreCustomers = (acc.barreCustomers || 0) + (r.barreCustomers || 0);
            acc.barreRevenue = (acc.barreRevenue || 0) + (r.barreRevenue || r.barrePaid || 0);
            acc.newMembers = (acc.newMembers || 0) + (r.newMembers || 0);
            acc.convertedMembers = (acc.convertedMembers || 0) + (r.convertedMembers || 0);
            acc.retainedMembers = (acc.retainedMembers || 0) + (r.retainedMembers || 0);
            if (!acc.location) acc.location = r.location;
            if (!acc.monthYear) acc.monthYear = r.monthYear;
            if (!acc.conversionRate && r.conversionRate) acc.conversionRate = r.conversionRate;
            if (!acc.retentionRate && r.retentionRate) acc.retentionRate = r.retentionRate;
            return acc;
          }, {})
        : {}
    );

    // clicked-cell authoritative count (if provided by the table click)
    const clickedCellSessions = Number(trainerData?.totalSessions || trainerData?.currentSessions || trainerData?.sessions || 0);

    const current = {
      totalSessions: source.totalSessions || source.currentSessions || source.sessions || 0,
      totalCustomers: source.totalCustomers || source.currentCustomers || source.customers || 0,
      totalRevenue: source.totalPaid || source.totalRevenue || source.currentRevenue || source.revenue || 0,
      emptySessions: source.emptySessions || source.totalEmptySessions || 0,
      nonEmptySessions: source.nonEmptySessions || source.totalNonEmptySessions || 0,
      cycleSessions: source.cycleSessions || 0,
      cycleCustomers: source.cycleCustomers || 0,
      cycleRevenue: source.cycleRevenue || source.cyclePaid || 0,
      strengthSessions: source.strengthSessions || 0,
      strengthCustomers: source.strengthCustomers || 0,
      strengthRevenue: source.strengthRevenue || source.strengthPaid || 0,
      barreSessions: source.barreSessions || 0,
      barreCustomers: source.barreCustomers || 0,
      barreRevenue: source.barreRevenue || source.barrePaid || 0,
      conversionRate: typeof source.conversionRate === 'number' 
        ? source.conversionRate 
        : parseFloat(String(source.conversion || source.conversionRate || '0').replace('%', '')) || 0,
      retentionRate: typeof source.retentionRate === 'number'
        ? source.retentionRate
        : parseFloat(String(source.retention || source.retentionRate || '0').replace('%', '')) || 0,
      newMembers: source.newMembers || source.new || 0,
      location: source.location || filters.location || '',
      monthYear: source.monthYear || filters.month || '',
      classAverageExclEmpty: source.classAverageExclEmpty || source.currentAvgClassSize || 0,
      classAverageInclEmpty: source.classAverageInclEmpty || 0,
      convertedMembers: source.convertedMembers || source.converted || 0,
      retainedMembers: source.retainedMembers || source.retained || 0,
      // attach clicked vs sheet counts for diagnostics
      clickedCellSessions,
      sessionsSheetCount: 0, // to be filled after sessionMetrics computation
    };

    // Calculate derived metrics
    const avgClassSize = current.totalSessions > 0 ? current.totalCustomers / current.totalSessions : 0;
    const avgClassSizeExclEmpty = current.nonEmptySessions > 0 ? current.totalCustomers / current.nonEmptySessions : 0;
    const fillRate = current.totalSessions > 0 
      ? ((current.totalSessions - current.emptySessions) / current.totalSessions) * 100 
      : 0;
    const revenuePerSession = current.totalSessions > 0 ? current.totalRevenue / current.totalSessions : 0;
    const revenuePerCustomer = current.totalCustomers > 0 ? current.totalRevenue / current.totalCustomers : 0;

    // Build session metrics from sessions sheet
    const sessionMetrics = (() => {
      const sessions = trainerSessionsAll;
      const totals = sessions.reduce((acc: any, s: any) => {
        const isCancelled = (s.lateCancelledCount || 0) > 0 && (s.checkedInCount || 0) === 0;
        const paid = Number(s.totalPaid || s.revenue || 0);
        const attendees = Number(s.checkedInCount || s.totalCustomers || s.attendees || 0);
        acc.count += 1;
        acc.attendance += attendees;
        acc.cancelled += isCancelled ? 1 : 0;
        acc.revenue += paid;
        acc.capacity += Number(s.capacity || 0);
        acc.booked += Number(s.bookedCount || 0);
        acc.complimentary += Number(s.complimentaryCount || 0);
        return acc;
      }, { count: 0, attendance: 0, cancelled: 0, revenue: 0, capacity: 0, booked: 0, complimentary: 0 });

      const byType = ['Barre', 'Power Cycle', 'Strength Lab'];
      const split = byType.map(type => {
        const group = sessions.filter((s: any) => (s.cleanedClass || s.classType || '').toLowerCase().includes(type.toLowerCase()));
        const gTotals = group.reduce((acc: any, s: any) => {
          acc.sessions += 1;
          acc.attendance += Number(s.checkedInCount || 0);
          acc.revenue += Number(s.totalPaid || s.revenue || 0);
          return acc;
        }, { sessions: 0, attendance: 0, revenue: 0 });
        return {
          name: type,
          sessions: gTotals.sessions,
          customers: gTotals.attendance,
          revenue: gTotals.revenue,
          avgAttendance: gTotals.sessions > 0 ? gTotals.attendance / gTotals.sessions : 0,
        };
      });

      return {
        list: sessions,
        totals,
        split,
        avgAttendance: totals.count > 0 ? totals.attendance / totals.count : 0,
        avgRevenuePerSession: totals.count > 0 ? totals.revenue / totals.count : 0,
        fillRate: totals.capacity > 0 ? (totals.attendance / totals.capacity) * 100 : 0,
      };
    })();

      // populate diagnostic counts
      current.sessionsSheetCount = sessionMetrics.list ? sessionMetrics.list.length : 0;

    // Format breakdown
    const byFormat = [
      {
        name: 'Cycle',
        sessions: current.cycleSessions,
        customers: current.cycleCustomers,
        revenue: current.cycleRevenue,
        value: current.totalSessions > 0 ? (current.cycleSessions / current.totalSessions) * 100 : 0,
        avgAttendance: current.cycleSessions > 0 ? current.cycleCustomers / current.cycleSessions : 0,
      },
      {
        name: 'Strength',
        sessions: current.strengthSessions,
        customers: current.strengthCustomers,
        revenue: current.strengthRevenue,
        value: current.totalSessions > 0 ? (current.strengthSessions / current.totalSessions) * 100 : 0,
        avgAttendance: current.strengthSessions > 0 ? current.strengthCustomers / current.strengthSessions : 0,
      },
      {
        name: 'Barre',
        sessions: current.barreSessions,
        customers: current.barreCustomers,
        revenue: current.barreRevenue,
        value: current.totalSessions > 0 ? (current.barreSessions / current.totalSessions) * 100 : 0,
        avgAttendance: current.barreSessions > 0 ? current.barreCustomers / current.barreSessions : 0,
      },
    ].filter(f => f.sessions > 0);

    // Monthly trends from all records
    const byMonth = trainerRecordsAllMonths
      .map((r: any) => ({
        month: r.monthYear,
        sessions: r.totalSessions || 0,
        customers: r.totalCustomers || 0,
        revenue: r.totalPaid || 0,
        avgAttendance: r.totalSessions > 0 ? (r.totalCustomers / r.totalSessions) : 0,
        conversionRate: typeof r.conversionRate === 'number' 
          ? r.conversionRate 
          : parseFloat(String(r.conversion || '0').replace('%', '')) || 0,
        retentionRate: typeof r.retentionRate === 'number'
          ? r.retentionRate
          : parseFloat(String(r.retention || '0').replace('%', '')) || 0,
      }))
      .sort((a, b) => {
        // Sort by month chronologically
        const parseMonth = (str: string) => {
          const parts = str.replace('-', ' ').split(' ');
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const mi = months.indexOf(parts[0]);
          const yi = parseInt(parts[1]) || 2024;
          return new Date(yi, mi, 1).getTime();
        };
        return parseMonth(a.month) - parseMonth(b.month);
      });

    // Performance score calculation
    const performanceScore = Math.min(100, Math.round(
      (fillRate * 0.25) +
      (Math.min(avgClassSizeExclEmpty / 15, 1) * 25) +
      (Math.min(current.conversionRate / 50, 1) * 25) +
      (Math.min(current.retentionRate / 80, 1) * 25)
    ));

    // Generate insights
    const insights: { type: 'success' | 'warning' | 'info'; message: string }[] = [];
    
    if (fillRate >= 85) {
      insights.push({ type: 'success', message: `Excellent fill rate of ${fillRate.toFixed(1)}% - almost no empty classes!` });
    } else if (fillRate < 70) {
      insights.push({ type: 'warning', message: `Fill rate of ${fillRate.toFixed(1)}% could be improved - ${current.emptySessions} empty classes` });
    }
    
    if (avgClassSizeExclEmpty >= 12) {
      insights.push({ type: 'success', message: `Strong class attendance averaging ${avgClassSizeExclEmpty.toFixed(1)} students per class` });
    } else if (avgClassSizeExclEmpty < 8 && avgClassSizeExclEmpty > 0) {
      insights.push({ type: 'warning', message: `Average class size of ${avgClassSizeExclEmpty.toFixed(1)} is below target` });
    }
    
    if (current.conversionRate >= 40) {
      insights.push({ type: 'success', message: `Great conversion rate of ${current.conversionRate.toFixed(1)}% (${current.convertedMembers} members converted)` });
    } else if (current.conversionRate > 0 && current.conversionRate < 25) {
      insights.push({ type: 'warning', message: `Conversion rate of ${current.conversionRate.toFixed(1)}% could be improved` });
    }
    
    if (current.retentionRate >= 70) {
      insights.push({ type: 'success', message: `Excellent client retention at ${current.retentionRate.toFixed(1)}% (${current.retainedMembers} retained)` });
    } else if (current.retentionRate > 0 && current.retentionRate < 50) {
      insights.push({ type: 'warning', message: `Retention rate of ${current.retentionRate.toFixed(1)}% needs attention` });
    }
    
    if (current.newMembers > 0) {
      insights.push({ type: 'info', message: `${current.newMembers} new members joined classes this period` });
    }

    // Top performing format
    const topFormat = byFormat.length > 0 
      ? byFormat.reduce((a, b) => (a.revenue > b.revenue ? a : b), byFormat[0])
      : null;
    if (topFormat && topFormat.revenue > 0) {
      insights.push({ type: 'info', message: `${topFormat.name} is the top revenue format (${formatCurrency(topFormat.revenue)})` });
    }

    // Radar chart data
    const radarData = [
      { metric: 'Fill Rate', value: fillRate, fullMark: 100 },
      { metric: 'Attendance', value: Math.min(avgClassSizeExclEmpty * 6.67, 100), fullMark: 100 },
      { metric: 'Conversion', value: Math.min(current.conversionRate * 2, 100), fullMark: 100 },
      { metric: 'Retention', value: Math.min(current.retentionRate * 1.25, 100), fullMark: 100 },
      { metric: 'Revenue', value: Math.min(revenuePerSession / 20, 100), fullMark: 100 },
    ];

    return {
      hasData: true,
      summary: {
        ...current,
        avgClassSize,
        avgClassSizeExclEmpty,
        fillRate,
        revenuePerSession,
        revenuePerCustomer,
        newMembers: current.newMembers,
        convertedMembers: current.convertedMembers,
        retainedMembers: current.retainedMembers,
      },
      byMonth,
      byFormat,
      sessionMetrics,
      performanceScore,
      insights,
      radarData,
    };
  }, [trainerData, trainerName, allPayrollData, allSessionsData, filters]);

  if (!processedData.hasData || !processedData.summary) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700">No Data Available</h3>
            <p className="text-slate-500 mt-2">Could not load trainer performance data</p>
            <Button onClick={onClose} className="mt-6">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { summary, byMonth, byFormat, performanceScore, insights, radarData, sessionMetrics } = processedData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] p-0 bg-slate-50 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Trainer drilldown — {trainerName}</DialogTitle>
          <DialogDescription>{summary?.monthYear ? `Data for ${summary.monthYear}` : 'All periods'}{filters?.location ? ` • ${filters.location}` : ''}</DialogDescription>
        </DialogHeader>
        <div className="flex h-[90vh]">
          {/* Left Sidebar - Trainer Profile */}
          <div className="w-80 bg-gray-900 text-white flex flex-col border-r-2 border-gray-700">
            {/* Close Button */}
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="absolute top-4 right-4 z-50 text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>

            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* Trainer Avatar */}
                <div className="text-center mb-6">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                      <img
                        src={getTrainerImage(trainerName)}
                        alt={trainerName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `
                            <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                              ${getTrainerInitials(trainerName)}
                            </div>
                          `;
                        }}
                      />
                    </div>
                    {performanceScore >= 80 && (
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full p-2 shadow-lg">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold">{trainerName}</h2>
                  <div className="flex items-center justify-center gap-2 mt-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{summary.location || 'All Locations'}</span>
                  </div>
                  {summary.monthYear && (
                    <Badge className="mt-2 bg-white/10 text-white/80">
                      <Calendar className="w-3 h-3 mr-1" />
                      {summary.monthYear}
                    </Badge>
                  )}
                </div>

                {/* Performance Score */}
                <Card className="bg-gray-800 border-gray-700 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-white">Performance Score</span>
                      <span className="text-3xl font-bold text-white">{performanceScore}</span>
                    </div>
                    <Progress value={performanceScore} className="h-2 bg-gray-700" />
                    <p className="text-xs text-gray-300 mt-2">
                      {performanceScore >= 80 ? '🌟 Outstanding' : 
                       performanceScore >= 60 ? '⭐ Great' : 
                       performanceScore >= 40 ? '→ Good' : '⚠️ Needs Work'}
                    </p>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-blue-400" />
                      <span className="text-sm text-white">Total Sessions</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-white">{summary.clickedCellSessions || summary.totalSessions}</div>
                      <div className="text-xs text-gray-300">
                        Sheet: {summary.sessionsSheetCount} {summary.clickedCellSessions && summary.clickedCellSessions !== summary.sessionsSheetCount && (
                          <span className="text-amber-400">• Clicked value differs</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm text-white">Total Attendees</span>
                    </div>
                    <span className="font-bold text-lg text-white">{formatNumber(summary.totalCustomers)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-amber-400" />
                      <span className="text-sm text-white">Total Revenue</span>
                    </div>
                    <span className="font-bold text-lg text-white">{formatCurrency(summary.totalRevenue)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-purple-400" />
                      <span className="text-sm text-white">Fill Rate</span>
                    </div>
                    <span className="font-bold text-lg text-white">{summary.fillRate.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Format Distribution */}
                {byFormat.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-white mb-3">Class Format Mix</h4>
                    <div className="space-y-2">
                      {byFormat.map((format) => (
                        <div key={format.name} className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                format.name === 'Cycle' && 'bg-blue-500',
                                format.name === 'Strength' && 'bg-purple-500',
                                format.name === 'Barre' && 'bg-pink-500'
                              )}
                              style={{ width: `${format.value}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-300 w-16">
                            {format.name} {format.value.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b bg-white">
              <h3 className="text-2xl font-bold text-slate-900">Performance Analytics</h3>
              <p className="text-slate-500 mt-1">Comprehensive breakdown for {trainerName}</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 pt-4 bg-white border-b">
                <TabsList className="bg-slate-100 p-1">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-white">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="sessions" className="data-[state=active]:bg-white">
                    <Activity className="w-4 h-4 mr-2" />
                    Sessions
                  </TabsTrigger>
                  <TabsTrigger value="revenue" className="data-[state=active]:bg-white">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Revenue
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="data-[state=active]:bg-white">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trends
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="data-[state=active]:bg-white">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Insights
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6">
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-0 space-y-6">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-4 gap-4">
                      <MetricCard
                        title="Total Sessions"
                        value={summary.totalSessions}
                        subtitle={`${summary.emptySessions} empty`}
                        icon={Activity}
                        color="blue"
                      />
                      <MetricCard
                        title="Total Attendees"
                        value={formatNumber(summary.totalCustomers)}
                        subtitle={`Avg ${summary.avgClassSizeExclEmpty.toFixed(1)}/class`}
                        icon={Users}
                        color="green"
                      />
                      <MetricCard
                        title="Total Revenue"
                        value={formatCurrency(summary.totalRevenue)}
                        subtitle={`${formatCurrency(summary.revenuePerSession)}/session`}
                        icon={DollarSign}
                        color="purple"
                      />
                      <MetricCard
                        title="Fill Rate"
                        value={`${summary.fillRate.toFixed(1)}%`}
                        subtitle={`${summary.nonEmptySessions || summary.totalSessions - summary.emptySessions} active classes`}
                        icon={Target}
                        color="amber"
                      />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Performance Radar */}
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500" />
                            Performance Radar
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={radarData}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#64748b' }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                              <Radar
                                name="Performance"
                                dataKey="value"
                                stroke={COLORS.primary}
                                fill={COLORS.primary}
                                fillOpacity={0.4}
                                strokeWidth={2}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Format Breakdown */}
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-purple-500" />
                            Class Format Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {byFormat.length > 0 ? (
                            <div className="flex items-center gap-6">
                              <ResponsiveContainer width="50%" height={200}>
                                <PieChart>
                                  <Pie
                                    data={byFormat}
                                    dataKey="sessions"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={80}
                                    paddingAngle={4}
                                  >
                                    {byFormat.map((entry, index) => (
                                      <Cell 
                                        key={entry.name} 
                                        fill={
                                          entry.name === 'Cycle' ? COLORS.primary :
                                          entry.name === 'Strength' ? COLORS.purple :
                                          COLORS.pink
                                        } 
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value: any, name) => [`${value} sessions`, name]} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="flex-1 space-y-4">
                                {byFormat.map((format) => (
                                  <div key={format.name} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={cn(
                                          "w-3 h-3 rounded-full",
                                          format.name === 'Cycle' && 'bg-blue-500',
                                          format.name === 'Strength' && 'bg-purple-500',
                                          format.name === 'Barre' && 'bg-pink-500'
                                        )} />
                                        <span className="font-medium text-sm">{format.name}</span>
                                      </div>
                                      <span className="text-sm text-slate-600">{format.sessions} sessions</span>
                                    </div>
                                    <div className="text-xs text-slate-500 pl-5">
                                      {formatCurrency(format.revenue)} • {format.customers} attendees
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="h-[200px] flex items-center justify-center text-slate-400">
                              No format breakdown available
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Conversion & Retention */}
                    <div className="grid grid-cols-2 gap-6">
                      <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-emerald-700">Conversion Rate</p>
                              <p className="text-4xl font-bold text-emerald-600 mt-2">
                                {summary.conversionRate.toFixed(1)}%
                              </p>
                              <p className="text-sm text-emerald-600/70 mt-1">
                                New clients converted to members
                              </p>
                            </div>
                            <div className="p-3 bg-emerald-500/20 rounded-xl">
                              <TrendingUp className="w-8 h-8 text-emerald-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-700">Retention Rate</p>
                              <p className="text-4xl font-bold text-blue-600 mt-2">
                                {summary.retentionRate.toFixed(1)}%
                              </p>
                              <p className="text-sm text-blue-600/70 mt-1">
                                Members returning for classes
                              </p>
                            </div>
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                              <Users className="w-8 h-8 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Sessions Tab */}
                  <TabsContent value="sessions" className="mt-0 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <MetricCard
                        title="Total Sessions (Clicked)"
                        value={summary.clickedCellSessions || summary.totalSessions}
                        subtitle={summary.sessionsSheetCount ? `Sheet: ${summary.sessionsSheetCount}${(summary.clickedCellSessions && summary.clickedCellSessions !== summary.sessionsSheetCount) ? ' • Mismatch' : ''}` : undefined}
                        icon={Activity}
                        color="blue"
                        size="large"
                      />
                      <MetricCard
                        title="Active Sessions"
                        value={summary.totalSessions - summary.emptySessions}
                        subtitle={`${summary.fillRate.toFixed(1)}% fill rate`}
                        icon={CheckCircle2}
                        color="green"
                        size="large"
                      />
                      <MetricCard
                        title="Empty Sessions"
                        value={summary.emptySessions}
                        subtitle={`${((summary.emptySessions / summary.totalSessions) * 100).toFixed(1)}% of total`}
                        icon={XCircle}
                        color="rose"
                        size="large"
                      />
                    </div>

                    {/* Sessions by Format */}
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg">Sessions by Format</CardTitle>
                        <CardDescription>Breakdown of classes by type</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {byFormat.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={byFormat} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis type="number" />
                              <YAxis type="category" dataKey="name" width={80} />
                              <Tooltip 
                                formatter={(value: any, name) => {
                                  if (name === 'sessions') return [value, 'Sessions'];
                                  if (name === 'customers') return [value, 'Attendees'];
                                  return [value, name];
                                }}
                              />
                              <Legend />
                              <Bar dataKey="sessions" fill={COLORS.primary} name="Sessions" radius={[0, 4, 4, 0]} />
                              <Bar dataKey="customers" fill={COLORS.success} name="Attendees" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-[300px] flex items-center justify-center text-slate-400">
                            <div className="text-center">
                              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>No session format data available</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Sessions Summary & List */}
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg">Session Metrics (Filtered)</CardTitle>
                        <CardDescription>
                          {filters?.month ? `Month: ${filters.month}` : 'All Months'}{filters?.location ? ` • Location: ${filters.location}` : ''}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {sessionMetrics?.list && sessionMetrics.list.length > 0 ? (
                          <div className="space-y-6">
                            {/* Diagnostic: show mismatch warning if clicked vs sheet counts differ */}
                            {(summary.clickedCellSessions && summary.clickedCellSessions !== summary.sessionsSheetCount) && (
                              <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
                                <div className="font-medium">Clicked cell value differs from sessions sheet</div>
                                <div className="text-sm">Clicked: {summary.clickedCellSessions} • Sheet rows: {summary.sessionsSheetCount} • Difference: {summary.clickedCellSessions - summary.sessionsSheetCount}</div>
                              </div>
                            )}
                            <div className="grid grid-cols-5 gap-4">
                              <MetricCard
                                title="Attendance"
                                value={formatNumber(sessionMetrics.totals.attendance)}
                                subtitle={`Avg ${sessionMetrics.avgAttendance.toFixed(1)}/class`}
                                icon={Users}
                                color="green"
                              />
                              <MetricCard
                                title="Cancelled"
                                value={sessionMetrics.totals.cancelled}
                                subtitle={`${((sessionMetrics.totals.cancelled / sessionMetrics.totals.count) * 100).toFixed(1)}% of classes`}
                                icon={AlertCircle}
                                color="amber"
                              />
                              <MetricCard
                                title="Revenue"
                                value={formatCurrency(sessionMetrics.totals.revenue)}
                                subtitle={`${formatCurrency(sessionMetrics.avgRevenuePerSession)}/session`}
                                icon={DollarSign}
                                color="purple"
                              />
                              <MetricCard
                                title="Capacity"
                                value={formatNumber(sessionMetrics.totals.capacity)}
                                subtitle={`Fill ${sessionMetrics.fillRate.toFixed(1)}%`}
                                icon={Target}
                                color="blue"
                              />
                              <MetricCard
                                title="Booked"
                                value={formatNumber(sessionMetrics.totals.booked)}
                                subtitle={`Comp ${formatNumber(sessionMetrics.totals.complimentary)}`}
                                icon={Calendar}
                                color="cyan"
                              />
                            </div>

                            {/* Format Split Mini Cards */}
                            {sessionMetrics.split && sessionMetrics.split.length > 0 && (
                              <div className="grid grid-cols-3 gap-4">
                                {sessionMetrics.split.map((s: any) => (
                                  <Card key={s.name} className="border bg-slate-50">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-slate-700">{s.name}</span>
                                        <span className="text-xs text-slate-500">{s.sessions} sessions</span>
                                      </div>
                                      <div className="text-slate-600 text-sm">
                                        {formatNumber(s.customers)} attendees • {formatCurrency(s.revenue)}
                                      </div>
                                      <div className="text-xs text-slate-500 mt-1">Avg {s.avgAttendance.toFixed(1)}/class</div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}

                            {/* Detailed Sessions Table */}
                            <div className="overflow-x-auto border rounded-lg bg-white">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-100 text-slate-700">
                                  <tr>
                                    <th className="p-2 text-left">Date</th>
                                    <th className="p-2 text-left">Time</th>
                                    <th className="p-2 text-left">Class</th>
                                    <th className="p-2 text-left">Location</th>
                                    <th className="p-2 text-right">Attendees</th>
                                    <th className="p-2 text-right">Cancelled</th>
                                    <th className="p-2 text-right">Capacity</th>
                                    <th className="p-2 text-right">Fill %</th>
                                    <th className="p-2 text-right">Revenue</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sessionMetrics.list.map((s: any, idx: number) => {
                                    const attendees = Number(s.checkedInCount || s.totalCustomers || 0);
                                    const capacity = Number(s.capacity || 0);
                                    const fillPct = capacity > 0 ? (attendees / capacity) * 100 : 0;
                                    const cancelled = (s.lateCancelledCount || 0) > 0 && (attendees === 0);
                                    const cls = (s.cleanedClass || s.classType || '').trim();
                                    const revenue = Number(s.totalPaid || s.revenue || 0);
                                    return (
                                      <tr key={idx} className="border-t">
                                        <td className="p-2">{s.date || s.monthYear || ''}</td>
                                        <td className="p-2">{s.time || ''}</td>
                                        <td className="p-2">{cls}</td>
                                        <td className="p-2">{s.location || ''}</td>
                                        <td className="p-2 text-right">{attendees}</td>
                                        <td className="p-2 text-right">{cancelled ? 'Yes' : 'No'}</td>
                                        <td className="p-2 text-right">{capacity}</td>
                                        <td className="p-2 text-right">{fillPct.toFixed(1)}%</td>
                                        <td className="p-2 text-right">{formatCurrency(revenue)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="h-[200px] flex items-center justify-center text-slate-400">
                            <div className="text-center">
                              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>No sessions found for the selected filters.</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Class Size Distribution */}
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg">Class Size Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-slate-500 mb-1">Avg Class Size (All Classes)</p>
                              <p className="text-3xl font-bold text-slate-800">
                                {summary.avgClassSize.toFixed(1)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 mb-1">Avg Class Size (Excl. Empty)</p>
                              <p className="text-3xl font-bold text-emerald-600">
                                {summary.avgClassSizeExclEmpty.toFixed(1)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="w-40 h-40 rounded-full border-8 border-blue-100 flex items-center justify-center">
                              <div className="text-center">
                                <p className="text-4xl font-bold text-blue-600">
                                  {formatNumber(summary.totalCustomers)}
                                </p>
                                <p className="text-sm text-slate-500">Total Attendees</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Revenue Tab */}
                  <TabsContent value="revenue" className="mt-0 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <MetricCard
                        title="Total Revenue"
                        value={formatCurrency(summary.totalRevenue)}
                        icon={DollarSign}
                        color="blue"
                        size="large"
                      />
                      <MetricCard
                        title="Revenue per Session"
                        value={formatCurrency(summary.revenuePerSession)}
                        icon={Activity}
                        color="green"
                        size="large"
                      />
                      <MetricCard
                        title="Revenue per Customer"
                        value={formatCurrency(summary.revenuePerCustomer)}
                        icon={Users}
                        color="purple"
                        size="large"
                      />
                    </div>

                    {/* Revenue Breakdown Table */}
                    <Card className="border-0 shadow-sm border border-slate-200">
                      <CardHeader className="bg-slate-50 border-b border-slate-200">
                        <CardTitle className="text-lg text-slate-800">Revenue Breakdown by Session</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {byMonth.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-slate-200 bg-black">
                                  <th className="text-left py-3 px-4 font-medium text-white bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800">Month</th>
                                  <th className="text-right py-3 px-4 font-medium text-white bg-black">Sessions</th>
                                  <th className="text-right py-3 px-4 font-medium text-white bg-black">Revenue</th>
                                  <th className="text-right py-3 px-4 font-medium text-white bg-black">Avg/Session</th>
                                  <th className="text-right py-3 px-4 font-medium text-white bg-black">Customers</th>
                                  <th className="text-right py-3 px-4 font-medium text-white bg-black">Avg/Customer</th>
                                </tr>
                              </thead>
                              <tbody>
                                {byMonth.map((month, index) => (
                                  <tr key={month.month} className={cn(
                                    "border-b border-slate-100 hover:bg-slate-50",
                                    "h-[35px] max-h-[35px]"
                                  )}>
                                    <td className="py-2 px-4 font-medium text-slate-900 h-[35px]">{month.month}</td>
                                    <td className="py-2 px-4 text-right text-slate-700 h-[35px]">{month.sessions}</td>
                                    <td className="py-2 px-4 text-right font-semibold text-slate-900 h-[35px]">{formatCurrency(month.revenue)}</td>
                                    <td className="py-2 px-4 text-right text-slate-700 h-[35px]">{formatCurrency(month.revenue / month.sessions)}</td>
                                    <td className="py-2 px-4 text-right text-slate-700 h-[35px]">{month.customers}</td>
                                    <td className="py-2 px-4 text-right text-slate-700 h-[35px]">{formatCurrency(month.revenue / month.customers)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="h-[200px] flex items-center justify-center text-slate-400">
                            <div className="text-center">
                              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>No revenue data available</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Revenue by Format */}
                    <Card className="border-0 shadow-sm border border-slate-200">
                      <CardHeader className="bg-slate-50 border-b border-slate-200">
                        <CardTitle className="text-lg text-slate-800">Revenue by Class Format</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {byFormat.length > 0 ? (
                          <div className="grid grid-cols-3 gap-6">
                            {byFormat.map((format) => (
                              <div 
                                key={format.name}
                                className="p-6 rounded-xl border-2 border-gray-900 bg-white text-gray-900 shadow-lg"
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  {format.name === 'Cycle' && <Bike className="w-6 h-6 text-blue-700" />}
                                  {format.name === 'Strength' && <Dumbbell className="w-6 h-6 text-blue-700" />}
                                  {format.name === 'Barre' && <Music className="w-6 h-6 text-blue-700" />}
                                  <span className="font-bold text-lg text-gray-900">{format.name}</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{formatCurrency(format.revenue)}</p>
                                <p className="text-sm text-gray-600 mt-2 font-medium">
                                  {format.sessions} sessions • {format.customers} attendees
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-[200px] flex items-center justify-center text-slate-400">
                            <div className="text-center">
                              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>No revenue breakdown available</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Trends Tab */}
                  <TabsContent value="trends" className="mt-0 space-y-6">
                    {byMonth.length > 1 ? (
                      <>
                        {/* Monthly Revenue Trend */}
                        <Card className="border-0 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-lg">Monthly Revenue Trend</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <AreaChart data={byMonth}>
                                <defs>
                                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip 
                                  formatter={(value: any) => formatCurrency(value)}
                                  labelStyle={{ fontWeight: 'bold' }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="revenue"
                                  stroke={COLORS.success}
                                  fill="url(#revenueGradient)"
                                  strokeWidth={2}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Monthly Sessions & Attendance */}
                        <Card className="border-0 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-lg">Sessions & Attendance Trend</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={byMonth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Line
                                  yAxisId="left"
                                  type="monotone"
                                  dataKey="sessions"
                                  stroke={COLORS.primary}
                                  strokeWidth={2}
                                  dot={{ fill: COLORS.primary }}
                                  name="Sessions"
                                />
                                <Line
                                  yAxisId="right"
                                  type="monotone"
                                  dataKey="customers"
                                  stroke={COLORS.purple}
                                  strokeWidth={2}
                                  dot={{ fill: COLORS.purple }}
                                  name="Attendees"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Monthly Avg Attendance */}
                        <Card className="border-0 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-lg">Average Class Attendance Trend</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={byMonth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']} />
                                <Tooltip formatter={(value: any) => value.toFixed(1)} />
                                <Bar
                                  dataKey="avgAttendance"
                                  fill={COLORS.cyan}
                                  name="Avg Attendance"
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <Card className="border-0 shadow-md">
                        <CardContent className="p-12">
                          <div className="text-center text-slate-400">
                            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-slate-600 mb-2">Single Period Data</h3>
                            <p className="text-sm">
                              Trend analysis requires multiple months of data.
                              <br />
                              Currently showing data for: <span className="font-medium">{summary.monthYear || 'All time'}</span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Insights Tab */}
                  <TabsContent value="insights" className="mt-0 space-y-6">
                    {/* Performance Summary */}
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Star className="w-5 h-5 text-amber-500" />
                          Performance Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-8 mb-6">
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                            <div className="text-center">
                              <p className="text-4xl font-bold">{performanceScore}</p>
                              <p className="text-sm text-white/80">Score</p>
                            </div>
                          </div>
                          <div className="flex-1 space-y-3">
                            <PerformanceIndicator score={summary.fillRate} label="Fill Rate" />
                            <PerformanceIndicator score={Math.min(summary.avgClassSizeExclEmpty * 6.67, 100)} label="Attendance" />
                            <PerformanceIndicator score={Math.min(summary.conversionRate * 2, 100)} label="Conversion" />
                            <PerformanceIndicator score={Math.min(summary.retentionRate * 1.25, 100)} label="Retention" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI Insights */}
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-500" />
                          Key Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {insights.length > 0 ? (
                          <div className="space-y-3">
                            {insights.map((insight, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "flex items-start gap-3 p-4 rounded-lg",
                                  insight.type === 'success' && 'bg-emerald-50 border border-emerald-200',
                                  insight.type === 'warning' && 'bg-amber-50 border border-amber-200',
                                  insight.type === 'info' && 'bg-blue-50 border border-blue-200'
                                )}
                              >
                                {insight.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />}
                                {insight.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />}
                                {insight.type === 'info' && <Zap className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />}
                                <p className={cn(
                                  "text-sm",
                                  insight.type === 'success' && 'text-emerald-800',
                                  insight.type === 'warning' && 'text-amber-800',
                                  insight.type === 'info' && 'text-blue-800'
                                )}>
                                  {insight.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-center py-8">No insights available</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card className="border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="w-5 h-5 text-amber-400" />
                          Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {summary.emptySessions > 2 && (
                            <div className="flex items-start gap-3 p-3 bg-white/10 rounded-lg">
                              <div className="p-1.5 bg-amber-500/20 rounded">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                              </div>
                              <div>
                                <p className="font-medium">Reduce Empty Classes</p>
                                <p className="text-sm text-white/70">
                                  Consider adjusting schedule or promotion for the {summary.emptySessions} classes with no attendance.
                                </p>
                              </div>
                            </div>
                          )}
                          {summary.avgClassSizeExclEmpty < 10 && (
                            <div className="flex items-start gap-3 p-3 bg-white/10 rounded-lg">
                              <div className="p-1.5 bg-blue-500/20 rounded">
                                <Users className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="font-medium">Boost Class Attendance</p>
                                <p className="text-sm text-white/70">
                                  Average class size is {summary.avgClassSizeExclEmpty.toFixed(1)}. Target 12+ for optimal revenue.
                                </p>
                              </div>
                            </div>
                          )}
                          {summary.conversionRate < 30 && (
                            <div className="flex items-start gap-3 p-3 bg-white/10 rounded-lg">
                              <div className="p-1.5 bg-emerald-500/20 rounded">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                <p className="font-medium">Improve Conversion</p>
                                <p className="text-sm text-white/70">
                                  Focus on converting trial members. Current rate: {summary.conversionRate.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          )}
                          {performanceScore >= 70 && (
                            <div className="flex items-start gap-3 p-3 bg-white/10 rounded-lg">
                              <div className="p-1.5 bg-amber-500/20 rounded">
                                <Award className="w-4 h-4 text-amber-400" />
                              </div>
                              <div>
                                <p className="font-medium">Strong Performance</p>
                                <p className="text-sm text-white/70">
                                  Keep up the great work! Consider mentoring other trainers.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
