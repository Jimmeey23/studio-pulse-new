import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { Footer } from '@/components/ui/footer';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { SectionTimelineNav } from '@/components/ui/SectionTimelineNav';
import { SectionAnchor } from '@/components/ui/SectionAnchor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ModalSuspense } from '@/components/lazy/ModalSuspense';
import { LazyMemberInsightsDrillDownModal } from '@/components/lazy/LazyModals';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useVCMemberData } from '@/hooks/useVCMemberData';
import { useMemberBehaviorAnalytics } from '@/hooks/useMemberBehaviorAnalytics';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useSalesData } from '@/hooks/useSalesData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { parseDate } from '@/utils/dateUtils';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MemberInsightModalData } from '@/components/dashboard/MemberInsightsDrillDownModal';

interface ActionItem {
  id: string;
  type: 'Renewal' | 'Churn Rescue' | 'Collections';
  subject: string;
  detail: string;
  priority: 'critical' | 'high' | 'medium';
  priorityScore: number;
  valueAtRisk: number;
  recommendedAction: string;
}

const PRIORITY_STYLES: Record<ActionItem['priority'], string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
};

const ACTION_COLORS = ['#2563eb', '#ef4444', '#f59e0b'];

const toNumber = (value: string | number | undefined | null) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const cleaned = String(value).replace(/[₹,$,]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isLikelyConvertedClient = (value?: string | null) => {
  const normalized = (value || '').toLowerCase();
  return normalized.includes('convert') || normalized.includes('purchase') || normalized.includes('member');
};

const isOpenLead = (status?: string | null, conversionStatus?: string | null) => {
  const normalizedStatus = (status || '').toLowerCase();
  const normalizedConversion = (conversionStatus || '').toLowerCase();

  if (normalizedConversion.includes('convert') || normalizedStatus.includes('convert') || normalizedStatus.includes('closed')) {
    return false;
  }

  return true;
};

const formatLocation = (value?: string | null) => value || 'Unknown location';

const ForecastingActionCenter: React.FC = () => {
  const { data: memberData = [], loading: memberLoading, error: memberError } = useVCMemberData();
  const { data: expirationsData = [], loading: expirationsLoading, error: expirationsError } = useExpirationsData();
  const { data: newClientData = [], loading: newClientsLoading, error: newClientsError } = useNewClientData();
  const { data: leadsData = [], loading: leadsLoading, error: leadsError } = useLeadsData();
  const { data: salesData = [], loading: salesLoading, error: salesError } = useSalesData();
  const { setLoading } = useGlobalLoading();
  const [drillDownModal, setDrillDownModal] = useState<MemberInsightModalData | null>(null);

  const analytics = useMemberBehaviorAnalytics(memberData);

  const loading = memberLoading || expirationsLoading || newClientsLoading || leadsLoading || salesLoading;

  useEffect(() => {
    setLoading(loading, 'Loading forecasting and action center...');
  }, [loading, setLoading]);

  const sourceWarnings = [
    memberError ? `VC member behavior: ${memberError}` : null,
    expirationsError ? `Expirations: ${expirationsError}` : null,
    newClientsError ? `New clients: ${newClientsError}` : null,
    leadsError ? `Leads: ${leadsError}` : null,
    salesError ? `Sales: ${salesError}` : null,
  ].filter(Boolean) as string[];

  const performanceByMember = useMemo(() => {
    return new Map(analytics.performanceMetrics.map((metric) => [metric.memberId, metric]));
  }, [analytics.performanceMetrics]);

  const upcomingExpirations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return expirationsData
      .map((item) => {
        const expirationDate = parseDate(item.endDate);
        const diffDays = expirationDate
          ? Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          : Number.POSITIVE_INFINITY;

        return {
          ...item,
          paidValue: toNumber(item.paid),
          diffDays,
        };
      })
      .filter((item) => Number.isFinite(item.diffDays) && item.diffDays >= -7 && item.diffDays <= 30)
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [expirationsData]);

  const leadSignals = useMemo(() => {
    const openLeads = leadsData.filter((lead) => isOpenLead(lead.status, lead.conversionStatus));
    const convertedLeads = leadsData.filter((lead) => !!lead.convertedToCustomerAt || isLikelyConvertedClient(lead.conversionStatus));
    const leadConversionRate = leadsData.length > 0 ? (convertedLeads.length / leadsData.length) * 100 : 0;

    return {
      openLeads: openLeads.length,
      convertedLeads: convertedLeads.length,
      leadConversionRate,
    };
  }, [leadsData]);

  const newClientSignals = useMemo(() => {
    const convertedClients = newClientData.filter(
      (client) => !!client.firstPurchase || client.purchaseCountPostTrial > 0 || isLikelyConvertedClient(client.conversionStatus)
    );
    const retainedClients = newClientData.filter((client) => {
      const normalized = (client.retentionStatus || '').toLowerCase();
      return normalized.includes('retain') || normalized.includes('active');
    });

    return {
      conversionRate: newClientData.length > 0 ? (convertedClients.length / newClientData.length) * 100 : 0,
      retainedRate: newClientData.length > 0 ? (retainedClients.length / newClientData.length) * 100 : 0,
    };
  }, [newClientData]);

  const actionQueue = useMemo<ActionItem[]>(() => {
    const churnActions: ActionItem[] = analytics.predictiveInsights.churnRiskMembers.slice(0, 8).map((member) => {
      const performance = performanceByMember.get(member.memberId);
      const valueAtRisk = performance?.totalPaidAmount || performance?.averageTransactionValue || 0;
      const priority: ActionItem['priority'] = member.churnScore >= 80 ? 'critical' : member.churnScore >= 60 ? 'high' : 'medium';

      return {
        id: `churn-${member.memberId}`,
        type: 'Churn Rescue',
        subject: member.fullName,
        detail: `Visits down ${formatPercentage(member.declineRate)} vs prior 3-month window • last active ${member.lastActiveMonth || 'n/a'}`,
        priority,
        priorityScore: member.churnScore,
        valueAtRisk,
        recommendedAction: 'Offer a trainer-led check-in plus a package renewal nudge within 72 hours.',
      };
    });

    const paymentActions: ActionItem[] = analytics.predictiveInsights.paymentRiskMembers.slice(0, 8).map((member) => {
      const priorityScore = Math.min(100, Math.round(member.unpaidAmount / 500));
      const priority: ActionItem['priority'] = priorityScore >= 80 ? 'critical' : priorityScore >= 55 ? 'high' : 'medium';

      return {
        id: `payment-${member.memberId}`,
        type: 'Collections',
        subject: member.fullName,
        detail: `${formatCurrency(member.unpaidAmount)} outstanding • compliance ${formatPercentage(member.paymentComplianceRate)}`,
        priority,
        priorityScore,
        valueAtRisk: member.unpaidAmount,
        recommendedAction: 'Trigger collections outreach with payment-link follow-up and a personal reminder.',
      };
    });

    const renewalActions: ActionItem[] = upcomingExpirations.slice(0, 10).map((member) => {
      const priority: ActionItem['priority'] = member.diffDays <= 7 ? 'critical' : member.diffDays <= 14 ? 'high' : 'medium';
      const priorityScore = member.diffDays <= 0 ? 95 : Math.max(50, 100 - member.diffDays * 2);

      return {
        id: `renewal-${member.uniqueId}`,
        type: 'Renewal',
        subject: `${member.firstName} ${member.lastName}`.trim(),
        detail: `${member.membershipName} ${member.diffDays <= 0 ? 'expired' : `expires in ${member.diffDays} days`} • ${member.homeLocation || 'Unknown location'}`,
        priority,
        priorityScore,
        valueAtRisk: member.paidValue,
        recommendedAction: 'Queue renewal outreach with the best-fit upgrade recommendation before expiry hits.',
      };
    });

    return [...renewalActions, ...churnActions, ...paymentActions]
      .sort((a, b) => b.priorityScore - a.priorityScore || b.valueAtRisk - a.valueAtRisk)
      .slice(0, 18);
  }, [analytics.predictiveInsights.churnRiskMembers, analytics.predictiveInsights.paymentRiskMembers, performanceByMember, upcomingExpirations]);

  const forecastChartData = useMemo(() => {
    const actualSeries = [...analytics.monthlyTrends].slice(0, 8).reverse().map((trend) => ({
      month: trend.month,
      actualRevenue: Math.round(trend.totalRevenue),
      forecastRevenue: null as number | null,
      confidence: null as number | null,
    }));

    const forecastSeries = analytics.predictiveInsights.revenueForecasts.map((forecast) => ({
      month: forecast.month,
      actualRevenue: null as number | null,
      forecastRevenue: Math.round(forecast.forecastedRevenue),
      confidence: forecast.confidence,
    }));

    return [...actualSeries, ...forecastSeries];
  }, [analytics.monthlyTrends, analytics.predictiveInsights.revenueForecasts]);

  const actionMix = useMemo(() => {
    const grouped = actionQueue.reduce<Record<string, { type: string; count: number; value: number }>>((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = { type: item.type, count: 0, value: 0 };
      }
      acc[item.type].count += 1;
      acc[item.type].value += item.valueAtRisk;
      return acc;
    }, {});

    return Object.values(grouped);
  }, [actionQueue]);

  const trailingAverageRevenue = useMemo(() => {
    const recentMonths = analytics.monthlyTrends.slice(0, 6);
    if (recentMonths.length === 0) return 0;
    return recentMonths.reduce((sum, month) => sum + month.totalRevenue, 0) / recentMonths.length;
  }, [analytics.monthlyTrends]);

  const forecastSummary = useMemo(() => {
    const totalForecastRevenue = analytics.predictiveInsights.revenueForecasts.reduce((sum, item) => sum + item.forecastedRevenue, 0);
    const avgConfidence = analytics.predictiveInsights.revenueForecasts.length > 0
      ? analytics.predictiveInsights.revenueForecasts.reduce((sum, item) => sum + item.confidence, 0) / analytics.predictiveInsights.revenueForecasts.length
      : 0;
    const outstandingExposure = analytics.predictiveInsights.paymentRiskMembers.reduce((sum, item) => sum + item.unpaidAmount, 0);
    const revenueRunRate = salesData.reduce((sum, sale) => sum + (sale.netRevenue || sale.paymentValue || 0), 0);

    return {
      totalForecastRevenue,
      avgConfidence,
      outstandingExposure,
      revenueRunRate,
    };
  }, [analytics.predictiveInsights.paymentRiskMembers, analytics.predictiveInsights.revenueForecasts, salesData]);

  const forecastRows = useMemo(() => {
    return analytics.predictiveInsights.revenueForecasts.map((forecast) => ({
      month: forecast.month,
      forecastRevenue: forecast.forecastedRevenue,
      confidence: forecast.confidence,
      lowerBound: forecast.forecastedRevenue - forecast.forecastedRevenue * ((100 - forecast.confidence) / 100) * 0.35,
      upperBound: forecast.forecastedRevenue + forecast.forecastedRevenue * ((100 - forecast.confidence) / 100) * 0.35,
    }));
  }, [analytics.predictiveInsights.revenueForecasts]);

  const trendRows = useMemo(() => {
    return analytics.monthlyTrends.map((trend) => ({
      month: trend.month,
      bookings: trend.totalBookings,
      visits: trend.totalVisits,
      cancellations: trend.totalCancellations,
      revenue: trend.totalRevenue,
      unpaid: trend.totalUnpaid,
      showUpRate: trend.showUpRate,
      cancellationRate: trend.cancellationRate,
    }));
  }, [analytics.monthlyTrends]);

  const churnRiskRows = useMemo(() => {
    return analytics.predictiveInsights.churnRiskMembers.map((member) => {
      const performance = performanceByMember.get(member.memberId);
      return {
        member: member.fullName,
        email: member.email,
        churnScore: member.churnScore,
        declineRate: member.declineRate,
        lastActiveMonth: member.lastActiveMonth || 'No recent activity',
        visits: performance?.totalVisits || 0,
        showUpRate: performance?.showUpRate || 0,
        revenueAtRisk: performance?.totalPaidAmount || 0,
      };
    });
  }, [analytics.predictiveInsights.churnRiskMembers, performanceByMember]);

  const paymentRiskRows = useMemo(() => {
    return analytics.predictiveInsights.paymentRiskMembers.map((member) => {
      const performance = performanceByMember.get(member.memberId);
      return {
        member: member.fullName,
        email: member.email,
        unpaidAmount: member.unpaidAmount,
        paymentComplianceRate: member.paymentComplianceRate,
        totalPaidAmount: performance?.totalPaidAmount || 0,
        averageTransactionValue: performance?.averageTransactionValue || 0,
      };
    });
  }, [analytics.predictiveInsights.paymentRiskMembers, performanceByMember]);

  const renewalRows = useMemo(() => {
    return upcomingExpirations.map((member) => ({
      member: `${member.firstName} ${member.lastName}`.trim(),
      membership: member.membershipName,
      location: formatLocation(member.homeLocation),
      daysToExpiry: member.diffDays,
      paidValue: member.paidValue,
      status: member.diffDays <= 0 ? 'Expired / urgent' : member.diffDays <= 14 ? 'Inside 14-day window' : 'Upcoming renewal',
    }));
  }, [upcomingExpirations]);

  const actionQueueRows = useMemo(() => {
    return actionQueue.map((item) => ({
      priority: item.priority,
      type: item.type,
      member: item.subject,
      score: item.priorityScore,
      valueAtRisk: item.valueAtRisk,
      whyNow: item.detail,
      recommendation: item.recommendedAction,
    }));
  }, [actionQueue]);

  const exportAdditionalData = useMemo(() => ({
    'Forecasting • Revenue Forecasts': forecastRows,
    'Forecasting • Historical Trends': trendRows,
    'Forecasting • Action Queue': actionQueueRows,
    'Forecasting • Churn Risk': churnRiskRows,
    'Forecasting • Collections Watchlist': paymentRiskRows,
    'Forecasting • Renewal Queue': renewalRows,
    'Forecasting • Action Mix': actionMix.map((item) => ({
      type: item.type,
      actionCount: item.count,
      combinedValueAtRisk: item.value,
    })),
    'Forecasting • Lead Signals': [leadSignals],
    'Forecasting • New Client Signals': [newClientSignals],
  }), [actionMix, actionQueueRows, churnRiskRows, forecastRows, leadSignals, newClientSignals, paymentRiskRows, renewalRows, trendRows]);

  const openDrillDown = useCallback((data: MemberInsightModalData) => {
    setDrillDownModal(data);
  }, []);

  const exportButton = (
    <AdvancedExportButton
      additionalData={exportAdditionalData}
      defaultFileName="forecasting-action-center"
      size="sm"
      variant="ghost"
      buttonClassName="rounded-xl border border-white/30 text-white hover:border-white/60 hover:bg-white/10"
      buttonLabel="Export Forecast Tables"
    />
  );

  if (!loading && memberError && memberData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex items-center justify-center p-6">
        <Card className="max-w-xl border-red-200 bg-white/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="h-6 w-6" />
              Forecasting module needs member-behavior data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>{memberError}</p>
            <p>The new module is wired up, but the VC member behavior source is the backbone for churn and forecast scoring, so it has to load first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute right-[-4rem] top-64 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <DashboardMotionHero
          title="Forecasting & Action Center"
          subtitle="Forward-looking revenue, churn, renewal, and collections signals powered by the live member behavior engine. Less guesswork, more go-do-the-thing."
          metrics={[
            { label: '90-day forecast', value: formatCurrency(forecastSummary.totalForecastRevenue) },
            { label: 'Forecast confidence', value: formatPercentage(forecastSummary.avgConfidence) },
            { label: 'Open actions', value: formatNumber(actionQueue.length) },
            { label: 'Outstanding exposure', value: formatCurrency(forecastSummary.outstandingExposure) },
          ]}
          extra={exportButton}
          compact={false}
        />
      </div>

      <div className="container relative z-10 mx-auto px-6 py-8">
        <main className="space-y-8">
          <SectionTimelineNav />

          {sourceWarnings.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
              <CardContent className="flex flex-col gap-2 p-5 text-sm text-amber-900">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  Some supporting sources are unavailable
                </div>
                <ul className="list-disc space-y-1 pl-5">
                  {sourceWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <SectionAnchor id="forecasting-readout" label="Operational readout">
          <Card className="border-blue-200/70 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Operational readout</p>
                <p className="mt-1 text-sm text-slate-700">
                  Forecasts use the VC member-behavior cohort as the predictive spine, while leads, new-client, sales, and expiration hooks sharpen the action queue.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => openDrillDown({
                    title: 'Lead funnel conversion detail',
                    description: 'Open leads and converted leads contributing to demand generation.',
                    badge: 'Lead funnel',
                    summary: [
                      { label: 'Open leads', value: formatNumber(leadSignals.openLeads), tone: 'emerald' },
                      { label: 'Converted leads', value: formatNumber(leadSignals.convertedLeads), tone: 'blue' },
                      { label: 'Conversion rate', value: formatPercentage(leadSignals.leadConversionRate), tone: 'amber' },
                    ],
                    rows: leadsData.map((lead) => ({
                      name: lead.clientName || lead.name || 'Lead',
                      status: lead.status || 'Unknown',
                      conversionStatus: lead.conversionStatus || 'Unknown',
                      source: lead.source || 'Unknown',
                      owner: lead.salesOwner || lead.assignedTo || 'Unassigned',
                    })),
                    columns: [
                      { key: 'name', header: 'Lead', align: 'left' },
                      { key: 'status', header: 'Status', align: 'left' },
                      { key: 'conversionStatus', header: 'Conversion', align: 'left' },
                      { key: 'source', header: 'Source', align: 'left' },
                      { key: 'owner', header: 'Owner', align: 'left' },
                    ],
                  })}
                  className="rounded-xl border border-white/80 bg-white/80 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">Lead conversion</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{formatPercentage(leadSignals.leadConversionRate)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => openDrillDown({
                    title: 'Trial-to-purchase detail',
                    description: 'Trial conversion and retained-client outcomes from the new client flow.',
                    badge: 'New client conversion',
                    summary: [
                      { label: 'Trial to purchase', value: formatPercentage(newClientSignals.conversionRate), tone: 'blue' },
                      { label: 'Retained rate', value: formatPercentage(newClientSignals.retainedRate), tone: 'emerald' },
                      { label: 'Tracked clients', value: formatNumber(newClientData.length), tone: 'slate' },
                    ],
                    rows: newClientData.map((client) => ({
                      client: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email || 'Client',
                      conversionStatus: client.conversionStatus || 'Unknown',
                      retentionStatus: client.retentionStatus || 'Unknown',
                      location: client.firstVisitLocation || 'Unknown',
                      purchaseCount: client.purchaseCountPostTrial || 0,
                    })),
                    columns: [
                      { key: 'client', header: 'Client', align: 'left' },
                      { key: 'conversionStatus', header: 'Conversion', align: 'left' },
                      { key: 'retentionStatus', header: 'Retention', align: 'left' },
                      { key: 'location', header: 'Location', align: 'left' },
                      { key: 'purchaseCount', header: 'Purchases', align: 'right', format: 'number' },
                    ],
                  })}
                  className="rounded-xl border border-white/80 bg-white/80 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">Trial-to-purchase</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{formatPercentage(newClientSignals.conversionRate)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => openDrillDown({
                    title: 'Upcoming expiries detail',
                    description: 'Members inside the near-term renewal window sorted by urgency.',
                    badge: 'Renewal window',
                    summary: [
                      { label: 'Expiring soon', value: formatNumber(upcomingExpirations.length), tone: 'amber' },
                      { label: 'Inside 14 days', value: formatNumber(upcomingExpirations.filter((item) => item.diffDays <= 14).length), tone: 'rose' },
                      { label: 'Value at risk', value: formatCurrency(upcomingExpirations.reduce((sum, item) => sum + item.paidValue, 0)), tone: 'blue' },
                    ],
                    rows: renewalRows,
                    columns: [
                      { key: 'member', header: 'Member', align: 'left' },
                      { key: 'membership', header: 'Membership', align: 'left' },
                      { key: 'location', header: 'Location', align: 'left' },
                      { key: 'daysToExpiry', header: 'Days to expiry', align: 'right', format: 'number' },
                      { key: 'paidValue', header: 'Value', align: 'right', format: 'currency' },
                      { key: 'status', header: 'Status', align: 'left' },
                    ],
                  })}
                  className="rounded-xl border border-white/80 bg-white/80 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">Upcoming expiries</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{formatNumber(upcomingExpirations.length)}</p>
                </button>
              </div>
            </CardContent>
          </Card>
          </SectionAnchor>

          <SectionAnchor id="forecasting-kpis" label="Forecasting KPIs">
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: 'Predicted revenue runway',
                value: formatCurrency(forecastSummary.totalForecastRevenue),
                note: `${formatCurrency(trailingAverageRevenue)} trailing monthly average`,
                icon: TrendingUp,
                accent: 'text-blue-600',
                bg: 'from-blue-50 to-indigo-50',
              },
              {
                title: 'Urgent churn rescues',
                value: formatNumber(analytics.predictiveInsights.churnRiskMembers.length),
                note: `${formatPercentage(analytics.summaryInsights.averageShowUpRate)} avg show-up rate`,
                icon: ShieldAlert,
                accent: 'text-red-600',
                bg: 'from-red-50 to-rose-50',
              },
              {
                title: 'Renewal interventions',
                value: formatNumber(upcomingExpirations.length),
                note: `${formatCurrency(upcomingExpirations.reduce((sum, item) => sum + item.paidValue, 0))} value at risk`,
                icon: CalendarClock,
                accent: 'text-amber-600',
                bg: 'from-amber-50 to-orange-50',
              },
              {
                title: 'Collections watchlist',
                value: formatCurrency(forecastSummary.outstandingExposure),
                note: `${formatNumber(analytics.predictiveInsights.paymentRiskMembers.length)} members with unpaid balances`,
                icon: Wallet,
                accent: 'text-emerald-600',
                bg: 'from-emerald-50 to-teal-50',
                onClick: () => openDrillDown({
                  title: 'Collections watchlist',
                  description: 'Members with unpaid balances and weaker compliance patterns that need immediate follow-up.',
                  badge: 'Collections',
                  summary: [
                    { label: 'Members', value: formatNumber(paymentRiskRows.length), tone: 'emerald' },
                    { label: 'Exposure', value: formatCurrency(forecastSummary.outstandingExposure), tone: 'amber' },
                    { label: 'Run-rate revenue', value: formatCurrency(forecastSummary.revenueRunRate), tone: 'blue' },
                  ],
                  rows: paymentRiskRows,
                  columns: [
                    { key: 'member', header: 'Member', align: 'left' },
                    { key: 'email', header: 'Email', align: 'left' },
                    { key: 'unpaidAmount', header: 'Outstanding', align: 'right', format: 'currency' },
                    { key: 'paymentComplianceRate', header: 'Compliance', align: 'right', format: 'percentage' },
                    { key: 'totalPaidAmount', header: 'Paid to date', align: 'right', format: 'currency' },
                    { key: 'averageTransactionValue', header: 'Avg visit value', align: 'right', format: 'currency' },
                  ],
                }),
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className={`border-slate-200 shadow-sm bg-gradient-to-br ${card.bg}`}>
                  <button type="button" onClick={card.onClick || (() => openDrillDown({
                    title: card.title,
                    description: 'Detailed view of the KPI and the underlying member records powering it.',
                    summary: [
                      { label: 'Primary value', value: card.value, tone: 'blue' },
                      { label: 'Context', value: card.note, tone: 'slate' },
                    ],
                    rows: card.title.includes('revenue') ? forecastRows : card.title.includes('churn') ? churnRiskRows : renewalRows,
                    columns: card.title.includes('revenue')
                      ? [
                          { key: 'month', header: 'Month', align: 'left' },
                          { key: 'forecastRevenue', header: 'Forecast revenue', align: 'right', format: 'currency' },
                          { key: 'confidence', header: 'Confidence', align: 'right', format: 'percentage' },
                          { key: 'lowerBound', header: 'Low band', align: 'right', format: 'currency' },
                          { key: 'upperBound', header: 'High band', align: 'right', format: 'currency' },
                        ]
                      : card.title.includes('churn')
                        ? [
                            { key: 'member', header: 'Member', align: 'left' },
                            { key: 'email', header: 'Email', align: 'left' },
                            { key: 'churnScore', header: 'Churn score', align: 'right', format: 'number' },
                            { key: 'declineRate', header: 'Decline', align: 'right', format: 'percentage' },
                            { key: 'showUpRate', header: 'Show-up rate', align: 'right', format: 'percentage' },
                            { key: 'revenueAtRisk', header: 'Revenue at risk', align: 'right', format: 'currency' },
                          ]
                        : [
                            { key: 'member', header: 'Member', align: 'left' },
                            { key: 'membership', header: 'Membership', align: 'left' },
                            { key: 'location', header: 'Location', align: 'left' },
                            { key: 'daysToExpiry', header: 'Days to expiry', align: 'right', format: 'number' },
                            { key: 'paidValue', header: 'Value', align: 'right', format: 'currency' },
                          ],
                  }))} className="w-full text-left">
                  <CardContent className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600">{card.title}</p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">{card.value}</p>
                        <p className="mt-2 text-xs text-slate-600">{card.note}</p>
                      </div>
                      <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                        <Icon className={`h-5 w-5 ${card.accent}`} />
                      </div>
                    </div>
                  </CardContent>
                  </button>
                </Card>
              );
            })}
          </section>
          </SectionAnchor>

          <SectionAnchor id="forecast-runway" label="Forecast runway and action mix">
          <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <CircleDollarSign className="h-5 w-5 text-blue-600" />
                  Revenue runway: actuals vs forecast
                </CardTitle>
                <button
                  type="button"
                  onClick={() => openDrillDown({
                    title: 'Revenue runway detail',
                    description: 'Historical performance and forward forecast with confidence bands.',
                    badge: 'Revenue runway',
                    summary: [
                      { label: 'Trailing avg revenue', value: formatCurrency(trailingAverageRevenue), tone: 'blue' },
                      { label: 'Forecast total', value: formatCurrency(forecastSummary.totalForecastRevenue), tone: 'emerald' },
                      { label: 'Avg confidence', value: formatPercentage(forecastSummary.avgConfidence), tone: 'amber' },
                    ],
                    rows: [...trendRows.slice(0, 8), ...forecastRows],
                    columns: [
                      { key: 'month', header: 'Month', align: 'left' },
                      { key: 'revenue', header: 'Actual revenue', align: 'right', format: 'currency' },
                      { key: 'forecastRevenue', header: 'Forecast revenue', align: 'right', format: 'currency' },
                      { key: 'confidence', header: 'Confidence', align: 'right', format: 'percentage' },
                      { key: 'showUpRate', header: 'Show-up rate', align: 'right', format: 'percentage' },
                    ],
                  })}
                  className="text-xs font-semibold uppercase tracking-wide text-blue-700 transition hover:text-blue-900"
                >
                  Open detail
                </button>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#475569' }} />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12, fill: '#475569' }} />
                      <Tooltip
                        formatter={(value: number | null, name: string) => {
                          if (value === null || typeof value !== 'number') return ['—', name];
                          return [formatCurrency(value), name === 'actualRevenue' ? 'Actual revenue' : 'Forecast revenue'];
                        }}
                      />
                      <Line type="monotone" dataKey="actualRevenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                      <Line type="monotone" dataKey="forecastRevenue" stroke="#f59e0b" strokeWidth={3} strokeDasharray="8 6" dot={{ r: 4 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Target className="h-5 w-5 text-indigo-600" />
                  Action mix by queue type
                </CardTitle>
                <button
                  type="button"
                  onClick={() => openDrillDown({
                    title: 'Action mix detail',
                    description: 'Queue composition and the actions currently demanding operational attention.',
                    badge: 'Queue composition',
                    summary: actionMix.map((item, index) => ({
                      label: item.type,
                      value: `${formatNumber(item.count)} • ${formatCurrency(item.value)}`,
                      tone: (['blue', 'rose', 'amber'] as const)[index % 3],
                    })),
                    rows: actionQueueRows,
                    columns: [
                      { key: 'priority', header: 'Priority', align: 'left' },
                      { key: 'type', header: 'Type', align: 'left' },
                      { key: 'member', header: 'Member', align: 'left' },
                      { key: 'score', header: 'Score', align: 'right', format: 'number' },
                      { key: 'valueAtRisk', header: 'Value at risk', align: 'right', format: 'currency' },
                      { key: 'whyNow', header: 'Why now', align: 'left' },
                    ],
                  })}
                  className="text-xs font-semibold uppercase tracking-wide text-indigo-700 transition hover:text-indigo-900"
                >
                  Open detail
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={actionMix}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#475569' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                      <Tooltip formatter={(value: number) => [formatNumber(value), 'Actions']} />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                        {actionMix.map((entry, index) => (
                          <Cell key={entry.type} fill={ACTION_COLORS[index % ACTION_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-3">
                  {actionMix.map((item, index) => (
                    <button
                      type="button"
                      key={item.type}
                      onClick={() => openDrillDown({
                        title: `${item.type} queue detail`,
                        description: `All queued ${item.type.toLowerCase()} actions currently surfaced by the engine.`,
                        badge: item.type,
                        summary: [
                          { label: 'Actions', value: formatNumber(item.count), tone: 'blue' },
                          { label: 'Value at risk', value: formatCurrency(item.value), tone: 'amber' },
                        ],
                        rows: actionQueueRows.filter((row) => row.type === item.type),
                        columns: [
                          { key: 'priority', header: 'Priority', align: 'left' },
                          { key: 'member', header: 'Member', align: 'left' },
                          { key: 'score', header: 'Score', align: 'right', format: 'number' },
                          { key: 'valueAtRisk', header: 'Value at risk', align: 'right', format: 'currency' },
                          { key: 'whyNow', header: 'Why now', align: 'left' },
                          { key: 'recommendation', header: 'Recommended action', align: 'left' },
                        ],
                      })}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ACTION_COLORS[index % ACTION_COLORS.length] }} />
                          <span className="font-semibold text-slate-800">{item.type}</span>
                        </div>
                        <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                          {formatNumber(item.count)} items
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{formatCurrency(item.value)} combined value at risk.</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
          </SectionAnchor>

          <SectionAnchor id="action-queue" label="Action queue and signals">
          <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Sparkles className="h-5 w-5 text-fuchsia-600" />
                  Prioritized action queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80">
                        <TableHead>Priority</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Why now</TableHead>
                        <TableHead className="text-right">Value at risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actionQueue.map((item) => (
                        <TableRow
                          key={item.id}
                          className="align-top transition hover:bg-slate-50/80 cursor-pointer"
                          onClick={() => openDrillDown({
                            title: `${item.subject} • ${item.type}`,
                            description: 'Single-member action recommendation with urgency, value, and next-step guidance.',
                            badge: item.priority,
                            summary: [
                              { label: 'Priority score', value: formatNumber(item.priorityScore), tone: 'rose' },
                              { label: 'Value at risk', value: formatCurrency(item.valueAtRisk), tone: 'amber' },
                              { label: 'Queue type', value: item.type, tone: 'blue' },
                            ],
                            rows: actionQueueRows.filter((row) => row.member === item.subject && row.type === item.type),
                            columns: [
                              { key: 'priority', header: 'Priority', align: 'left' },
                              { key: 'type', header: 'Type', align: 'left' },
                              { key: 'member', header: 'Member', align: 'left' },
                              { key: 'score', header: 'Score', align: 'right', format: 'number' },
                              { key: 'valueAtRisk', header: 'Value at risk', align: 'right', format: 'currency' },
                              { key: 'whyNow', header: 'Why now', align: 'left' },
                              { key: 'recommendation', header: 'Recommended action', align: 'left' },
                            ],
                          })}
                        >
                          <TableCell>
                            <Badge className={`border ${PRIORITY_STYLES[item.priority]}`}>{item.priority}</Badge>
                          </TableCell>
                          <TableCell className="font-medium text-slate-700">{item.type}</TableCell>
                          <TableCell>
                            <div className="font-semibold text-slate-900">{item.subject}</div>
                            <div className="mt-1 text-xs text-slate-500">Score {formatNumber(item.priorityScore)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-700">{item.detail}</div>
                            <div className="mt-1 text-xs text-slate-500">{item.recommendedAction}</div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-900">{formatCurrency(item.valueAtRisk)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Forecast detail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.predictiveInsights.revenueForecasts.map((forecast) => {
                    const confidenceBand = forecast.forecastedRevenue * ((100 - forecast.confidence) / 100) * 0.35;
                    return (
                      <button
                        type="button"
                        key={forecast.month}
                        onClick={() => openDrillDown({
                          title: `${forecast.month} forecast detail`,
                          description: 'Monthly revenue projection with confidence band and supporting outlook context.',
                          badge: 'Forecast',
                          summary: [
                            { label: 'Forecast revenue', value: formatCurrency(forecast.forecastedRevenue), tone: 'blue' },
                            { label: 'Confidence', value: formatPercentage(forecast.confidence), tone: 'amber' },
                            { label: 'Expected range', value: `${formatCurrency(forecast.forecastedRevenue - confidenceBand)} → ${formatCurrency(forecast.forecastedRevenue + confidenceBand)}`, tone: 'emerald' },
                          ],
                          rows: forecastRows.filter((row) => row.month === forecast.month),
                          columns: [
                            { key: 'month', header: 'Month', align: 'left' },
                            { key: 'forecastRevenue', header: 'Forecast revenue', align: 'right', format: 'currency' },
                            { key: 'confidence', header: 'Confidence', align: 'right', format: 'percentage' },
                            { key: 'lowerBound', header: 'Low band', align: 'right', format: 'currency' },
                            { key: 'upperBound', header: 'High band', align: 'right', format: 'currency' },
                          ],
                        })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{forecast.month}</p>
                            <p className="text-xs text-slate-500">Projected monthly revenue</p>
                          </div>
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                            {formatPercentage(forecast.confidence)} confidence
                          </Badge>
                        </div>
                        <p className="mt-3 text-xl font-bold text-slate-950">{formatCurrency(forecast.forecastedRevenue)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Expected range: {formatCurrency(forecast.forecastedRevenue - confidenceBand)} to {formatCurrency(forecast.forecastedRevenue + confidenceBand)}
                        </p>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Users className="h-5 w-5 text-emerald-600" />
                    Demand and renewal signals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <button
                    type="button"
                    onClick={() => openDrillDown({
                      title: 'Lead funnel demand signals',
                      description: 'Lead-level detail behind the current open pipeline and conversion performance.',
                      badge: 'Demand signal',
                      summary: [
                        { label: 'Open leads', value: formatNumber(leadSignals.openLeads), tone: 'emerald' },
                        { label: 'Converted', value: formatNumber(leadSignals.convertedLeads), tone: 'blue' },
                        { label: 'Conversion rate', value: formatPercentage(leadSignals.leadConversionRate), tone: 'amber' },
                      ],
                      rows: leadsData.map((lead) => ({
                        name: lead.clientName || lead.name || 'Lead',
                        status: lead.status || 'Unknown',
                        conversionStatus: lead.conversionStatus || 'Unknown',
                        source: lead.source || 'Unknown',
                        owner: lead.salesOwner || lead.assignedTo || 'Unassigned',
                      })),
                      columns: [
                        { key: 'name', header: 'Lead', align: 'left' },
                        { key: 'status', header: 'Status', align: 'left' },
                        { key: 'conversionStatus', header: 'Conversion', align: 'left' },
                        { key: 'source', header: 'Source', align: 'left' },
                        { key: 'owner', header: 'Owner', align: 'left' },
                      ],
                    })}
                    className="w-full rounded-xl border border-slate-200 bg-emerald-50/60 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2 font-semibold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" />
                      Lead funnel
                    </div>
                    <p className="mt-2">{formatNumber(leadSignals.openLeads)} open leads remain in motion, with {formatPercentage(leadSignals.leadConversionRate)} converting so far.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => openDrillDown({
                      title: 'New client conversion signals',
                      description: 'Detailed client-level view of trial-to-purchase performance and retained status.',
                      badge: 'New clients',
                      summary: [
                        { label: 'Trial to purchase', value: formatPercentage(newClientSignals.conversionRate), tone: 'blue' },
                        { label: 'Retained rate', value: formatPercentage(newClientSignals.retainedRate), tone: 'emerald' },
                        { label: 'Tracked clients', value: formatNumber(newClientData.length), tone: 'slate' },
                      ],
                      rows: newClientData.map((client) => ({
                        client: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email || 'Client',
                        conversionStatus: client.conversionStatus || 'Unknown',
                        retentionStatus: client.retentionStatus || 'Unknown',
                        location: client.firstVisitLocation || 'Unknown',
                        purchaseCount: client.purchaseCountPostTrial || 0,
                      })),
                      columns: [
                        { key: 'client', header: 'Client', align: 'left' },
                        { key: 'conversionStatus', header: 'Conversion', align: 'left' },
                        { key: 'retentionStatus', header: 'Retention', align: 'left' },
                        { key: 'location', header: 'Location', align: 'left' },
                        { key: 'purchaseCount', header: 'Purchases', align: 'right', format: 'number' },
                      ],
                    })}
                    className="w-full rounded-xl border border-slate-200 bg-blue-50/60 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2 font-semibold text-blue-800">
                      <TrendingUp className="h-4 w-4" />
                      New client conversion
                    </div>
                    <p className="mt-2">Trial-to-purchase is running at {formatPercentage(newClientSignals.conversionRate)} and retained-client status sits at {formatPercentage(newClientSignals.retainedRate)}.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => openDrillDown({
                      title: 'Renewal pressure detail',
                      description: 'Memberships inside the near-term renewal window, sorted by days to expiry.',
                      badge: 'Renewals',
                      summary: [
                        { label: 'Inside 14 days', value: formatNumber(upcomingExpirations.filter((item) => item.diffDays <= 14).length), tone: 'rose' },
                        { label: 'Total expiring soon', value: formatNumber(upcomingExpirations.length), tone: 'amber' },
                        { label: 'Value at risk', value: formatCurrency(upcomingExpirations.reduce((sum, item) => sum + item.paidValue, 0)), tone: 'blue' },
                      ],
                      rows: renewalRows,
                      columns: [
                        { key: 'member', header: 'Member', align: 'left' },
                        { key: 'membership', header: 'Membership', align: 'left' },
                        { key: 'location', header: 'Location', align: 'left' },
                        { key: 'daysToExpiry', header: 'Days to expiry', align: 'right', format: 'number' },
                        { key: 'paidValue', header: 'Value', align: 'right', format: 'currency' },
                        { key: 'status', header: 'Status', align: 'left' },
                      ],
                    })}
                    className="w-full rounded-xl border border-slate-200 bg-amber-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2 font-semibold text-amber-900">
                      <CalendarClock className="h-4 w-4" />
                      Renewal pressure
                    </div>
                    <p className="mt-2">{formatNumber(upcomingExpirations.filter((item) => item.diffDays <= 14).length)} memberships are inside a 14-day renewal window.</p>
                  </button>
                </CardContent>
              </Card>
            </div>
          </section>
          </SectionAnchor>
        </main>
      </div>

      <Footer />

      <ModalSuspense>
        {drillDownModal && (
          <LazyMemberInsightsDrillDownModal
            isOpen={Boolean(drillDownModal)}
            onClose={() => setDrillDownModal(null)}
            data={drillDownModal}
          />
        )}
      </ModalSuspense>
    </div>
  );
};

export default ForecastingActionCenter;
