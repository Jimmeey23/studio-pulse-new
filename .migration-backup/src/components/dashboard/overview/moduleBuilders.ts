import {
  Activity,
  ArrowDownWideNarrow,
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  Gauge,
  Layers3,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Clock3,
  Ticket,
  UserCheck,
  Package,
  BadgePercent,
  ShieldAlert,
  FileWarning,
  Repeat,
  Timer,
  Landmark,
  ShoppingCart,
  BookOpen,
  Sparkles,
  PieChart,
} from 'lucide-react';
import type { CheckinData } from '@/hooks/useCheckinsData';
import type { SessionData } from '@/hooks/useSessionsData';
import type { LeadsData } from '@/types/leads';
import type { ExpirationData, LateCancellationsData, NewClientData, PayrollData, SalesData } from '@/types/dashboard';
import type {
  OverviewDataBundle,
  OverviewMetricCard,
  OverviewModuleContent,
  OverviewRankingEntry,
  OverviewTableDefinition,
} from './types';
import {
  aggregateByLabel,
  average,
  countUnique,
  formatOverviewValue,
  guessFormatFamily,
  monthKeyFromDate,
  monthLabelFromKey,
  percentage,
  takeBottomEntries,
  takeTopEntries,
  toNumber,
  toText,
} from './filtering';

const clampTableRows = (rows: Array<Record<string, string | number>>, count = 8) => rows.slice(0, count);

const buildMonthlySeries = <T>(
  items: T[],
  dateFn: (item: T) => string | undefined | null,
  valueFns: Record<string, (item: T) => number>
) => {
  const monthMap = new Map<string, Record<string, string | number>>();

  items.forEach((item) => {
    const monthKey = monthKeyFromDate(dateFn(item));
    if (!monthKey) return;

    const current = monthMap.get(monthKey) ?? { month: monthLabelFromKey(monthKey) };
    Object.entries(valueFns).forEach(([key, valueFn]) => {
      current[key] = Number(current[key] ?? 0) + valueFn(item);
    });
    monthMap.set(monthKey, current);
  });

  return Array.from(monthMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value);
};

const rankingEntriesFromRows = (
  rows: Array<{ label: string; value: number; secondary?: string }>,
  fallbackLabel: string
): OverviewRankingEntry[] => {
  if (rows.length) {
    return rows.map((row) => ({ label: row.label, value: row.value, secondary: row.secondary }));
  }

  return [{ label: fallbackLabel, value: 0, secondary: 'No data for the active filters' }];
};

const uniqueTransactionCount = (sales: SalesData[]) =>
  countUnique(sales, (item) => item.transactionId || item.saleReference || item.saleItemId || item.salesItemId);

const buildSalesModule = (sales: SalesData[]): OverviewModuleContent => {
  const totalRevenue = sales.reduce((sum, item) => sum + toNumber(item.paymentValue), 0);
  const totalDiscount = sales.reduce((sum, item) => sum + toNumber(item.discountAmount), 0);
  const transactions = uniqueTransactionCount(sales) || sales.length;
  const uniqueMembers = countUnique(sales, (item) => item.memberId || item.customerEmail);
  const discountedTransactions = sales.filter((item) => toNumber(item.discountAmount) > 0 || toNumber(item.discountPercentage) > 0).length;
  const averageTicket = average(totalRevenue, transactions);
  const discountRate = percentage(totalDiscount, totalRevenue + totalDiscount);
  const uniqueProducts = countUnique(sales, (item) => item.cleanedProduct);
  const uniquePaymentMethods = countUnique(sales, (item) => item.paymentMethod);

  const productRows = aggregateByLabel(
    sales,
    (item) => item.cleanedProduct || item.paymentItem,
    () => ({ revenue: 0, discounts: 0, transactions: 0 }),
    (accumulator, item) => {
      accumulator.revenue += toNumber(item.paymentValue);
      accumulator.discounts += toNumber(item.discountAmount);
      accumulator.transactions += 1;
    }
  )
    .map((row) => ({
      ...row,
      averageTicket: average(row.revenue, row.transactions),
    }))
    .sort((left, right) => right.revenue - left.revenue);

  const categoryRows = aggregateByLabel(
    sales,
    (item) => item.cleanedCategory,
    () => ({ revenue: 0, discounts: 0, transactions: 0 }),
    (accumulator, item) => {
      accumulator.revenue += toNumber(item.paymentValue);
      accumulator.discounts += toNumber(item.discountAmount);
      accumulator.transactions += 1;
    }
  )
    .map((row) => ({ ...row, averageTicket: average(row.revenue, row.transactions) }))
    .sort((left, right) => right.revenue - left.revenue);

  const soldByRows = aggregateByLabel(
    sales,
    (item) => item.soldBy,
    () => ({ revenue: 0, transactions: 0 }),
    (accumulator, item) => {
      accumulator.revenue += toNumber(item.paymentValue);
      accumulator.transactions += 1;
    }
  )
    .sort((left, right) => right.revenue - left.revenue);

  const cards: OverviewMetricCard[] = [
    { id: 'sales-revenue', title: 'Revenue', value: formatOverviewValue(totalRevenue, 'currency'), description: 'Filtered payment value across the active window.', icon: DollarSign, accent: 'emerald' },
    { id: 'sales-transactions', title: 'Transactions', value: formatOverviewValue(transactions, 'number'), description: 'Distinct sale references captured in the filtered data.', icon: ShoppingCart, accent: 'blue' },
    { id: 'sales-members', title: 'Unique Members', value: formatOverviewValue(uniqueMembers, 'number'), description: 'Members associated with the filtered sales records.', icon: Users, accent: 'purple' },
    { id: 'sales-atv', title: 'Avg Ticket', value: formatOverviewValue(averageTicket, 'currency'), description: 'Average revenue per filtered transaction.', icon: Wallet, accent: 'indigo' },
    { id: 'sales-discount-value', title: 'Discount Value', value: formatOverviewValue(totalDiscount, 'currency'), description: 'Discount amount granted inside the active filter range.', icon: BadgePercent, accent: 'rose' },
    { id: 'sales-discount-rate', title: 'Discount Rate', value: formatOverviewValue(discountRate, 'percentage'), description: 'Discount amount as a share of gross opportunity.', icon: Percent, accent: 'amber' },
    { id: 'sales-products', title: 'Unique Products', value: formatOverviewValue(uniqueProducts, 'number'), description: 'Distinct products represented in the filtered sales set.', icon: Package, accent: 'teal' },
    { id: 'sales-payments', title: 'Payment Methods', value: formatOverviewValue(uniquePaymentMethods, 'number'), description: 'Distinct payment method mixes in the filtered sales.', icon: CreditCard, accent: 'slate' },
  ];

  const rankings = productRows.map((row) => ({
    label: row.label,
    value: row.revenue,
    secondary: `${formatOverviewValue(row.transactions, 'number')} txns`,
  }));

  return {
    title: 'Sales Analytics',
    subtitle: 'Revenue, pricing, and payment mix snapshots using the shared overview filters.',
    cards,
    charts: [
      {
        id: 'sales-category-chart',
        title: 'Revenue by Category',
        description: 'Category mix for the filtered revenue set.',
        data: categoryRows.slice(0, 8).map((row) => ({ category: row.label, revenue: row.revenue, discounts: row.discounts })),
        xKey: 'category',
        series: [
          { key: 'revenue', label: 'Revenue', color: '#10b981' },
          { key: 'discounts', label: 'Discounts', color: '#f97316' },
        ],
        format: 'currency',
      },
      {
        id: 'sales-soldby-chart',
        title: 'Revenue by Seller',
        description: 'Filtered seller contribution inside the active window.',
        data: soldByRows.slice(0, 8).map((row) => ({ seller: row.label, revenue: row.revenue, transactions: row.transactions })),
        xKey: 'seller',
        series: [
          { key: 'revenue', label: 'Revenue', color: '#3b82f6' },
          { key: 'transactions', label: 'Transactions', color: '#8b5cf6' },
        ],
        format: 'currency',
      },
    ],
    topRanking: {
      id: 'sales-top-products',
      title: 'Top Product Rankings',
      description: 'Highest revenue products inside the filtered sales set.',
      format: 'currency',
      accent: 'emerald',
      entries: takeTopEntries(rankingEntriesFromRows(rankings, 'No products yet')),
    },
    bottomRanking: {
      id: 'sales-bottom-products',
      title: 'Bottom Product Rankings',
      description: 'Lowest revenue products for the same filtered sales set.',
      format: 'currency',
      accent: 'rose',
      entries: takeBottomEntries(rankingEntriesFromRows(rankings, 'No products yet')),
    },
    tables: [
      {
        id: 'sales-products-table',
        title: 'Product Performance',
        description: 'Revenue, discount, and average ticket by product.',
        columns: [
          { key: 'label', label: 'Product' },
          { key: 'revenue', label: 'Revenue', format: 'currency', align: 'right' },
          { key: 'discounts', label: 'Discounts', format: 'currency', align: 'right' },
          { key: 'averageTicket', label: 'Avg Ticket', format: 'currency', align: 'right' },
        ],
        rows: clampTableRows(productRows),
      },
      {
        id: 'sales-categories-table',
        title: 'Category Performance',
        description: 'Category revenue totals inside the active filters.',
        columns: [
          { key: 'label', label: 'Category' },
          { key: 'transactions', label: 'Transactions', format: 'number', align: 'right' },
          { key: 'revenue', label: 'Revenue', format: 'currency', align: 'right' },
          { key: 'discounts', label: 'Discounts', format: 'currency', align: 'right' },
        ],
        rows: clampTableRows(categoryRows),
      },
    ],
  };
};

const leadLocation = (lead: LeadsData) => lead.center;

const buildFunnelModule = (leads: LeadsData[]): OverviewModuleContent => {
  const convertedLeads = leads.filter((lead) => Boolean(lead.convertedToCustomerAt) || /convert|member/i.test(lead.conversionStatus || ''));
  const totalLtv = convertedLeads.reduce((sum, lead) => sum + toNumber(lead.ltv), 0);
  const totalLeads = leads.length;
  const totalConverted = convertedLeads.length;
  const conversionRate = percentage(totalConverted, totalLeads);
  const avgLtv = average(totalLtv, totalConverted);
  const avgVisits = average(leads.reduce((sum, lead) => sum + toNumber(lead.visits), 0), totalLeads);
  const uniqueSources = countUnique(leads, (lead) => lead.source);
  const uniqueAssociates = countUnique(leads, (lead) => lead.associate);
  const openLeads = leads.filter((lead) => !/convert|lost|closed/i.test(lead.status || '')).length;

  const sourceRows = aggregateByLabel(
    leads,
    (lead) => lead.source,
    () => ({ leads: 0, converted: 0, ltv: 0 }),
    (accumulator, lead) => {
      accumulator.leads += 1;
      const isConverted = Boolean(lead.convertedToCustomerAt) || /convert|member/i.test(lead.conversionStatus || '');
      if (isConverted) {
        accumulator.converted += 1;
        accumulator.ltv += toNumber(lead.ltv);
      }
    }
  )
    .map((row) => ({ ...row, conversionRate: percentage(row.converted, row.leads), averageLtv: average(row.ltv, row.converted) }))
    .sort((left, right) => right.conversionRate - left.conversionRate);

  const stageRows = aggregateByLabel(
    leads,
    (lead) => lead.stage,
    () => ({ leads: 0, converted: 0 }),
    (accumulator, lead) => {
      accumulator.leads += 1;
      if (Boolean(lead.convertedToCustomerAt) || /convert|member/i.test(lead.conversionStatus || '')) {
        accumulator.converted += 1;
      }
    }
  )
    .map((row) => ({ ...row, conversionRate: percentage(row.converted, row.leads) }))
    .sort((left, right) => right.leads - left.leads);

  const monthlyRows = buildMonthlySeries(leads, (lead) => lead.createdAt, {
    leads: () => 1,
    converted: (lead) => (Boolean(lead.convertedToCustomerAt) || /convert|member/i.test(lead.conversionStatus || '') ? 1 : 0),
  });

  const rankings = sourceRows.map((row) => ({
    label: row.label,
    value: row.conversionRate,
    secondary: `${formatOverviewValue(row.leads, 'number')} leads`,
  }));

  return {
    title: 'Funnel & Leads',
    subtitle: 'Lead acquisition quality, conversion velocity, and source contribution within the shared filters.',
    cards: [
      { id: 'funnel-total-leads', title: 'Total Leads', value: formatOverviewValue(totalLeads, 'number'), description: 'Lead records captured in the active filter range.', icon: Activity, accent: 'blue' },
      { id: 'funnel-converted', title: 'Converted Leads', value: formatOverviewValue(totalConverted, 'number'), description: 'Leads showing a conversion or customer timestamp.', icon: TrendingUp, accent: 'emerald' },
      { id: 'funnel-conversion-rate', title: 'Conversion Rate', value: formatOverviewValue(conversionRate, 'percentage'), description: 'Converted leads as a share of the filtered lead pool.', icon: Percent, accent: 'purple' },
      { id: 'funnel-total-ltv', title: 'Total LTV', value: formatOverviewValue(totalLtv, 'currency'), description: 'Lifetime value from converted leads in the filtered window.', icon: DollarSign, accent: 'indigo' },
      { id: 'funnel-avg-ltv', title: 'Avg LTV', value: formatOverviewValue(avgLtv, 'currency'), description: 'Average LTV among leads that converted.', icon: Wallet, accent: 'teal' },
      { id: 'funnel-avg-visits', title: 'Avg Visits', value: formatOverviewValue(avgVisits, 'number'), description: 'Average recorded visits across filtered leads.', icon: Repeat, accent: 'amber' },
      { id: 'funnel-sources', title: 'Lead Sources', value: formatOverviewValue(uniqueSources, 'number'), description: 'Distinct source channels represented in the filtered set.', icon: Layers3, accent: 'rose' },
      { id: 'funnel-open-leads', title: 'Open Leads', value: formatOverviewValue(openLeads, 'number'), description: 'Leads that are not yet marked lost or converted.', icon: Target, accent: 'slate' },
    ],
    charts: [
      {
        id: 'funnel-source-chart',
        title: 'Source Performance',
        description: 'Lead volume and conversions by source.',
        data: sourceRows.slice(0, 8).map((row) => ({ source: row.label, leads: row.leads, converted: row.converted })),
        xKey: 'source',
        series: [
          { key: 'leads', label: 'Leads', color: '#3b82f6' },
          { key: 'converted', label: 'Converted', color: '#10b981' },
        ],
        format: 'number',
      },
      {
        id: 'funnel-monthly-chart',
        title: 'Lead Trend',
        description: 'Lead creation versus conversions across months in the active window.',
        data: monthlyRows,
        xKey: 'month',
        series: [
          { key: 'leads', label: 'Leads', color: '#8b5cf6' },
          { key: 'converted', label: 'Converted', color: '#f97316' },
        ],
        format: 'number',
      },
    ],
    topRanking: {
      id: 'funnel-top-sources',
      title: 'Top Source Rankings',
      description: 'Sources with the strongest conversion rate inside the active filters.',
      format: 'percentage',
      accent: 'emerald',
      entries: takeTopEntries(rankingEntriesFromRows(rankings, 'No sources yet')),
    },
    bottomRanking: {
      id: 'funnel-bottom-sources',
      title: 'Bottom Source Rankings',
      description: 'Sources with the weakest conversion rate inside the active filters.',
      format: 'percentage',
      accent: 'rose',
      entries: takeBottomEntries(rankingEntriesFromRows(rankings, 'No sources yet')),
    },
    tables: [
      {
        id: 'funnel-source-table',
        title: 'Source Summary',
        description: 'Lead counts, conversions, and average LTV by source.',
        columns: [
          { key: 'label', label: 'Source' },
          { key: 'leads', label: 'Leads', format: 'number', align: 'right' },
          { key: 'converted', label: 'Converted', format: 'number', align: 'right' },
          { key: 'conversionRate', label: 'Conversion', format: 'percentage', align: 'right' },
        ],
        rows: clampTableRows(sourceRows),
      },
      {
        id: 'funnel-stage-table',
        title: 'Stage Summary',
        description: 'Stage throughput for the filtered lead set.',
        columns: [
          { key: 'label', label: 'Stage' },
          { key: 'leads', label: 'Leads', format: 'number', align: 'right' },
          { key: 'converted', label: 'Converted', format: 'number', align: 'right' },
          { key: 'conversionRate', label: 'Conversion', format: 'percentage', align: 'right' },
        ],
        rows: clampTableRows(stageRows),
      },
    ],
  };
};

const normalizeStatusValue = (value: string | undefined | null) => String(value || '').trim().toLowerCase();

const isConvertedClient = (client: NewClientData) => normalizeStatusValue(client.conversionStatus) === 'converted';

const isRetainedClient = (client: NewClientData) => normalizeStatusValue(client.retentionStatus) === 'retained';

const buildClientRetentionModule = (clients: NewClientData[]): OverviewModuleContent => {
  const convertedClients = clients.filter(isConvertedClient);
  const retainedClients = clients.filter(isRetainedClient);
  const totalClients = clients.length;
  const totalConverted = convertedClients.length;
  const totalRetained = retainedClients.length;
  const totalLtv = clients.reduce((sum, client) => sum + toNumber(client.ltv), 0);
  const avgLtv = average(totalLtv, totalClients);
  const avgVisitsPostTrial = average(clients.reduce((sum, client) => sum + toNumber(client.visitsPostTrial), 0), totalClients);
  const avgConversionSpan = average(convertedClients.reduce((sum, client) => sum + toNumber(client.conversionSpan), 0), totalConverted);
  const uniqueTrainers = countUnique(clients, (client) => client.trainerName);
  const uniqueMemberships = countUnique(clients, (client) => client.membershipUsed);

  const trainerRows = aggregateByLabel(
    clients,
    (client) => client.trainerName,
    () => ({ clients: 0, converted: 0, retained: 0, ltv: 0 }),
    (accumulator, client) => {
      accumulator.clients += 1;
      accumulator.ltv += toNumber(client.ltv);
      if (isConvertedClient(client)) accumulator.converted += 1;
      if (isRetainedClient(client)) accumulator.retained += 1;
    }
  )
    .map((row) => ({
      ...row,
      conversionRate: percentage(row.converted, row.clients),
      retentionRate: percentage(row.retained, row.clients),
      averageLtv: average(row.ltv, row.clients),
    }))
    .sort((left, right) => right.conversionRate - left.conversionRate);

  const membershipRows = aggregateByLabel(
    clients,
    (client) => client.membershipUsed,
    () => ({ clients: 0, converted: 0, retained: 0 }),
    (accumulator, client) => {
      accumulator.clients += 1;
      if (isConvertedClient(client)) accumulator.converted += 1;
      if (isRetainedClient(client)) accumulator.retained += 1;
    }
  )
    .map((row) => ({
      ...row,
      conversionRate: percentage(row.converted, row.clients),
      retentionRate: percentage(row.retained, row.clients),
    }))
    .sort((left, right) => right.clients - left.clients);

  const monthlyRows = buildMonthlySeries(clients, (client) => client.firstVisitDate, {
    clients: () => 1,
    converted: (client) => (isConvertedClient(client) ? 1 : 0),
    retained: (client) => (isRetainedClient(client) ? 1 : 0),
  });

  const rankings = trainerRows.map((row) => ({
    label: row.label,
    value: row.conversionRate,
    secondary: `${formatOverviewValue(row.clients, 'number')} newcomers`,
  }));

  return {
    title: 'Client Retention',
    subtitle: 'Newcomer conversion, retention, and trainer effectiveness under the shared overview filters.',
    cards: [
      { id: 'retention-newcomers', title: 'New Clients', value: formatOverviewValue(totalClients, 'number'), description: 'New client records entering the filtered cohort.', icon: UserPlus, accent: 'blue' },
      { id: 'retention-converted', title: 'Converted', value: formatOverviewValue(totalConverted, 'number'), description: 'Clients marked as Converted in the filtered cohort.', icon: TrendingUp, accent: 'emerald' },
      { id: 'retention-conversion-rate', title: 'Conversion Rate', value: formatOverviewValue(percentage(totalConverted, totalClients), 'percentage'), description: 'Converted newcomers as a share of the filtered cohort.', icon: Percent, accent: 'purple' },
      { id: 'retention-retained', title: 'Retained', value: formatOverviewValue(totalRetained, 'number'), description: 'Clients marked as Retained in the filtered cohort.', icon: Repeat, accent: 'teal' },
      { id: 'retention-rate', title: 'Retention Rate', value: formatOverviewValue(percentage(totalRetained, totalClients), 'percentage'), description: 'Retained newcomers as a share of the filtered cohort.', icon: ShieldAlert, accent: 'indigo' },
      { id: 'retention-ltv', title: 'Avg LTV', value: formatOverviewValue(avgLtv, 'currency'), description: 'Average lifetime value across the filtered new client cohort.', icon: Wallet, accent: 'rose' },
      { id: 'retention-conversion-span', title: 'Avg Conversion Span', value: formatOverviewValue(avgConversionSpan, 'days'), description: 'Average days from first visit to first purchase.', icon: Timer, accent: 'amber' },
      { id: 'retention-trainers', title: 'Active Trainers', value: formatOverviewValue(uniqueTrainers, 'number'), description: 'Trainers represented in the current newcomer cohort.', icon: UserCheck, accent: 'slate' },
    ],
    charts: [
      {
        id: 'retention-monthly-chart',
        title: 'Client Cohort Trend',
        description: 'New clients, conversions, and retained counts by first-visit month.',
        data: monthlyRows,
        xKey: 'month',
        series: [
          { key: 'clients', label: 'Clients', color: '#3b82f6' },
          { key: 'converted', label: 'Converted', color: '#10b981' },
          { key: 'retained', label: 'Retained', color: '#8b5cf6' },
        ],
        format: 'number',
      },
      {
        id: 'retention-trainer-chart',
        title: 'Trainer Conversion Snapshot',
        description: 'Trainer-level newcomer conversion versus retention.',
        data: trainerRows.slice(0, 8).map((row) => ({
          trainer: row.label,
          conversionRate: row.conversionRate,
          retentionRate: row.retentionRate,
        })),
        xKey: 'trainer',
        series: [
          { key: 'conversionRate', label: 'Conversion Rate', color: '#f97316' },
          { key: 'retentionRate', label: 'Retention Rate', color: '#14b8a6' },
        ],
        format: 'percentage',
      },
    ],
    topRanking: {
      id: 'retention-top-trainers',
      title: 'Top Trainer Rankings',
      description: 'Trainers converting the highest share of filtered newcomers.',
      format: 'percentage',
      accent: 'emerald',
      entries: takeTopEntries(rankingEntriesFromRows(rankings, 'No trainers yet')),
    },
    bottomRanking: {
      id: 'retention-bottom-trainers',
      title: 'Bottom Trainer Rankings',
      description: 'Trainers with the lowest newcomer conversion rate in the active filters.',
      format: 'percentage',
      accent: 'rose',
      entries: takeBottomEntries(rankingEntriesFromRows(rankings, 'No trainers yet')),
    },
    tables: [
      {
        id: 'retention-trainer-table',
        title: 'Trainer Summary',
        description: 'Trainer conversion and retention output for filtered newcomers.',
        columns: [
          { key: 'label', label: 'Trainer' },
          { key: 'clients', label: 'Clients', format: 'number', align: 'right' },
          { key: 'conversionRate', label: 'Conversion', format: 'percentage', align: 'right' },
          { key: 'retentionRate', label: 'Retention', format: 'percentage', align: 'right' },
        ],
        rows: clampTableRows(trainerRows),
      },
      {
        id: 'retention-membership-table',
        title: 'Membership Mix',
        description: 'How the filtered newcomer cohort is distributed by membership used.',
        columns: [
          { key: 'label', label: 'Membership' },
          { key: 'clients', label: 'Clients', format: 'number', align: 'right' },
          { key: 'conversionRate', label: 'Conversion', format: 'percentage', align: 'right' },
          { key: 'retentionRate', label: 'Retention', format: 'percentage', align: 'right' },
        ],
        rows: clampTableRows(membershipRows),
      },
    ],
  };
};

const buildTrainerModule = (payroll: PayrollData[]): OverviewModuleContent => {
  const totalRevenue = payroll.reduce((sum, row) => sum + toNumber(row.totalPaid), 0);
  const totalSessions = payroll.reduce((sum, row) => sum + toNumber(row.totalSessions), 0);
  const totalCustomers = payroll.reduce((sum, row) => sum + toNumber(row.totalCustomers), 0);
  const trainerRows = aggregateByLabel(
    payroll,
    (row) => row.teacherName,
    () => ({ revenue: 0, sessions: 0, customers: 0, cycleSessions: 0, barreSessions: 0, strengthSessions: 0, retentionRate: 0, conversionRate: 0, rows: 0 }),
    (accumulator, row) => {
      accumulator.revenue += toNumber(row.totalPaid);
      accumulator.sessions += toNumber(row.totalSessions);
      accumulator.customers += toNumber(row.totalCustomers);
      accumulator.cycleSessions += toNumber(row.cycleSessions);
      accumulator.barreSessions += toNumber(row.barreSessions);
      accumulator.strengthSessions += toNumber(row.strengthSessions);
      accumulator.retentionRate += toNumber(row.retentionRate);
      accumulator.conversionRate += toNumber(row.conversionRate);
      accumulator.rows += 1;
    }
  )
    .map((row) => ({
      ...row,
      classAverage: average(row.customers, row.sessions),
      avgRevenue: average(row.revenue, row.sessions),
      retentionRate: average(row.retentionRate, row.rows),
      conversionRate: average(row.conversionRate, row.rows),
    }))
    .sort((left, right) => right.revenue - left.revenue);

  const locationRows = aggregateByLabel(
    payroll,
    (row) => row.location,
    () => ({ revenue: 0, sessions: 0, customers: 0 }),
    (accumulator, row) => {
      accumulator.revenue += toNumber(row.totalPaid);
      accumulator.sessions += toNumber(row.totalSessions);
      accumulator.customers += toNumber(row.totalCustomers);
    }
  )
    .map((row) => ({ ...row, classAverage: average(row.customers, row.sessions) }))
    .sort((left, right) => right.revenue - left.revenue);

  const formatMix = [
    { format: 'PowerCycle', sessions: payroll.reduce((sum, row) => sum + toNumber(row.cycleSessions), 0) },
    { format: 'Barre', sessions: payroll.reduce((sum, row) => sum + toNumber(row.barreSessions), 0) },
    { format: 'Strength', sessions: payroll.reduce((sum, row) => sum + toNumber(row.strengthSessions), 0) },
  ];

  const avgRetention = average(payroll.reduce((sum, row) => sum + toNumber(row.retentionRate), 0), payroll.length);
  const avgConversion = average(payroll.reduce((sum, row) => sum + toNumber(row.conversionRate), 0), payroll.length);

  const rankings = trainerRows.map((row) => ({
    label: row.label,
    value: row.revenue,
    secondary: `${formatOverviewValue(row.sessions, 'number')} sessions`,
  }));

  return {
    title: 'Trainer Performance',
    subtitle: 'Trainer output, class mix, and customer impact inside the shared filter window.',
    cards: [
      { id: 'trainer-revenue', title: 'Trainer Revenue', value: formatOverviewValue(totalRevenue, 'currency'), description: 'Total trainer-linked revenue in the filtered payroll set.', icon: DollarSign, accent: 'emerald' },
      { id: 'trainer-sessions', title: 'Sessions', value: formatOverviewValue(totalSessions, 'number'), description: 'Sessions taught by the filtered trainer cohort.', icon: Calendar, accent: 'blue' },
      { id: 'trainer-customers', title: 'Customers', value: formatOverviewValue(totalCustomers, 'number'), description: 'Customers served across the filtered trainer cohort.', icon: Users, accent: 'purple' },
      { id: 'trainer-class-average', title: 'Avg Class Size', value: formatOverviewValue(average(totalCustomers, totalSessions), 'number'), description: 'Average customers per trainer session.', icon: Gauge, accent: 'indigo' },
      { id: 'trainer-count', title: 'Trainers', value: formatOverviewValue(trainerRows.length, 'number'), description: 'Distinct trainers represented in the current filter scope.', icon: UserCheck, accent: 'teal' },
      { id: 'trainer-avg-revenue', title: 'Avg Revenue / Session', value: formatOverviewValue(average(totalRevenue, totalSessions), 'currency'), description: 'Average paid value per trainer-led session.', icon: Wallet, accent: 'rose' },
      { id: 'trainer-retention', title: 'Avg Retention', value: formatOverviewValue(avgRetention, 'percentage'), description: 'Average trainer retention rate across filtered payroll rows.', icon: Repeat, accent: 'amber' },
      { id: 'trainer-conversion', title: 'Avg Conversion', value: formatOverviewValue(avgConversion, 'percentage'), description: 'Average trainer conversion rate across filtered payroll rows.', icon: TrendingUp, accent: 'slate' },
    ],
    charts: [
      {
        id: 'trainer-revenue-chart',
        title: 'Trainer Revenue Leaders',
        description: 'Revenue and session volume for the top filtered trainers.',
        data: trainerRows.slice(0, 8).map((row) => ({ trainer: row.label, revenue: row.revenue, sessions: row.sessions })),
        xKey: 'trainer',
        series: [
          { key: 'revenue', label: 'Revenue', color: '#10b981' },
          { key: 'sessions', label: 'Sessions', color: '#3b82f6' },
        ],
        format: 'currency',
      },
      {
        id: 'trainer-format-chart',
        title: 'Trainer Format Mix',
        description: 'Session mix by class format inside the active filters.',
        data: formatMix,
        xKey: 'format',
        series: [{ key: 'sessions', label: 'Sessions', color: '#8b5cf6' }],
        format: 'number',
      },
    ],
    topRanking: {
      id: 'trainer-top-ranking',
      title: 'Top Trainer Rankings',
      description: 'Highest revenue trainers inside the filtered payroll view.',
      format: 'currency',
      accent: 'emerald',
      entries: takeTopEntries(rankingEntriesFromRows(rankings, 'No trainers yet')),
    },
    bottomRanking: {
      id: 'trainer-bottom-ranking',
      title: 'Bottom Trainer Rankings',
      description: 'Lowest revenue trainers inside the same filtered payroll view.',
      format: 'currency',
      accent: 'rose',
      entries: takeBottomEntries(rankingEntriesFromRows(rankings, 'No trainers yet')),
    },
    tables: [
      {
        id: 'trainer-performance-table',
        title: 'Trainer Summary',
        description: 'Revenue, sessions, class size, and retention by trainer.',
        columns: [
          { key: 'label', label: 'Trainer' },
          { key: 'revenue', label: 'Revenue', format: 'currency', align: 'right' },
          { key: 'sessions', label: 'Sessions', format: 'number', align: 'right' },
          { key: 'classAverage', label: 'Avg Class', format: 'number', align: 'right' },
        ],
        rows: clampTableRows(trainerRows),
      },
      {
        id: 'trainer-location-table',
        title: 'Location Summary',
        description: 'Location performance for the same filtered trainer cohort.',
        columns: [
          { key: 'label', label: 'Location' },
          { key: 'revenue', label: 'Revenue', format: 'currency', align: 'right' },
          { key: 'sessions', label: 'Sessions', format: 'number', align: 'right' },
          { key: 'classAverage', label: 'Avg Class', format: 'number', align: 'right' },
        ],
        rows: clampTableRows(locationRows),
      },
    ],
  };
};

const buildClassAttendanceModule = (sessions: SessionData[]): OverviewModuleContent => {
  const totalSessions = sessions.length;
  const totalAttendance = sessions.reduce((sum, session) => sum + toNumber(session.checkedInCount), 0);
  const totalCapacity = sessions.reduce((sum, session) => sum + toNumber(session.capacity), 0);
  const totalRevenue = sessions.reduce((sum, session) => sum + toNumber(session.totalPaid), 0);
  const uniqueTrainers = countUnique(sessions, (session) => session.trainerName);
  const lateCancellations = sessions.reduce((sum, session) => sum + toNumber(session.lateCancelledCount), 0);
  const nonPaidAttendance = sessions.reduce((sum, session) => sum + toNumber(session.nonPaidCount), 0);

  const classRows = aggregateByLabel(
    sessions,
    (session) => session.cleanedClass || session.classType,
    () => ({ sessions: 0, attendance: 0, capacity: 0, revenue: 0 }),
    (accumulator, session) => {
      accumulator.sessions += 1;
      accumulator.attendance += toNumber(session.checkedInCount);
      accumulator.capacity += toNumber(session.capacity);
      accumulator.revenue += toNumber(session.totalPaid);
    }
  )
    .map((row) => ({
      ...row,
      avgAttendance: average(row.attendance, row.sessions),
      fillRate: percentage(row.attendance, row.capacity),
    }))
    .sort((left, right) => right.avgAttendance - left.avgAttendance);

  const trainerRows = aggregateByLabel(
    sessions,
    (session) => session.trainerName,
    () => ({ sessions: 0, attendance: 0, capacity: 0 }),
    (accumulator, session) => {
      accumulator.sessions += 1;
      accumulator.attendance += toNumber(session.checkedInCount);
      accumulator.capacity += toNumber(session.capacity);
    }
  )
    .map((row) => ({ ...row, avgAttendance: average(row.attendance, row.sessions), fillRate: percentage(row.attendance, row.capacity) }))
    .sort((left, right) => right.avgAttendance - left.avgAttendance);

  const dayRows = aggregateByLabel(
    sessions,
    (session) => session.dayOfWeek,
    () => ({ sessions: 0, attendance: 0 }),
    (accumulator, session) => {
      accumulator.sessions += 1;
      accumulator.attendance += toNumber(session.checkedInCount);
    }
  ).sort((left, right) => right.attendance - left.attendance);

  const rankings = classRows.map((row) => ({
    label: row.label,
    value: row.avgAttendance,
    secondary: `${formatOverviewValue(row.sessions, 'number')} sessions`,
  }));

  return {
    title: 'Class Attendance',
    subtitle: 'Attendance volume, fill efficiency, and class mix based on the shared overview filters.',
    cards: [
      { id: 'attendance-sessions', title: 'Sessions', value: formatOverviewValue(totalSessions, 'number'), description: 'Class sessions inside the current filter range.', icon: Calendar, accent: 'blue' },
      { id: 'attendance-visits', title: 'Attendance', value: formatOverviewValue(totalAttendance, 'number'), description: 'Checked-in attendance across filtered sessions.', icon: Users, accent: 'emerald' },
      { id: 'attendance-fill', title: 'Fill Rate', value: formatOverviewValue(percentage(totalAttendance, totalCapacity), 'percentage'), description: 'Capacity utilization for the active session set.', icon: Gauge, accent: 'purple' },
      { id: 'attendance-average', title: 'Avg Attendance', value: formatOverviewValue(average(totalAttendance, totalSessions), 'number'), description: 'Average attendance per filtered session.', icon: TrendingUp, accent: 'indigo' },
      { id: 'attendance-revenue', title: 'Revenue', value: formatOverviewValue(totalRevenue, 'currency'), description: 'Paid value tied to the filtered attendance cohort.', icon: DollarSign, accent: 'teal' },
      { id: 'attendance-trainers', title: 'Trainers', value: formatOverviewValue(uniqueTrainers, 'number'), description: 'Distinct trainers represented in the filtered sessions.', icon: UserCheck, accent: 'rose' },
      { id: 'attendance-late-cancels', title: 'Late Cancels', value: formatOverviewValue(lateCancellations, 'number'), description: 'Late cancellation count attached to the filtered sessions.', icon: FileWarning, accent: 'amber' },
      { id: 'attendance-non-paid', title: 'Non-Paid Visits', value: formatOverviewValue(nonPaidAttendance, 'number'), description: 'Non-paid attendance volume inside the active filters.', icon: Ticket, accent: 'slate' },
    ],
    charts: [
      {
        id: 'attendance-class-chart',
        title: 'Class Attendance Leaders',
        description: 'Average attendance and fill rate by class.',
        data: classRows.slice(0, 8).map((row) => ({ className: row.label, avgAttendance: row.avgAttendance, fillRate: row.fillRate })),
        xKey: 'className',
        series: [
          { key: 'avgAttendance', label: 'Avg Attendance', color: '#3b82f6' },
          { key: 'fillRate', label: 'Fill Rate', color: '#10b981' },
        ],
        format: 'number',
      },
      {
        id: 'attendance-day-chart',
        title: 'Attendance by Weekday',
        description: 'Weekday volume for the active session range.',
        data: dayRows.slice(0, 7).map((row) => ({ day: row.label, attendance: row.attendance, sessions: row.sessions })),
        xKey: 'day',
        series: [
          { key: 'attendance', label: 'Attendance', color: '#8b5cf6' },
          { key: 'sessions', label: 'Sessions', color: '#f97316' },
        ],
        format: 'number',
      },
    ],
    topRanking: {
      id: 'attendance-top-classes',
      title: 'Top Class Rankings',
      description: 'Classes with the strongest average attendance inside the active filters.',
      format: 'number',
      accent: 'emerald',
      entries: takeTopEntries(rankingEntriesFromRows(rankings, 'No classes yet')),
    },
    bottomRanking: {
      id: 'attendance-bottom-classes',
      title: 'Bottom Class Rankings',
      description: 'Classes with the weakest average attendance inside the active filters.',
      format: 'number',
      accent: 'rose',
      entries: takeBottomEntries(rankingEntriesFromRows(rankings, 'No classes yet')),
    },
    tables: [
      {
        id: 'attendance-class-table',
        title: 'Class Summary',
        description: 'Attendance, fill, and revenue by class.',
        columns: [
          { key: 'label', label: 'Class' },
          { key: 'sessions', label: 'Sessions', format: 'number', align: 'right' },
          { key: 'avgAttendance', label: 'Avg Attendance', format: 'number', align: 'right' },
          { key: 'fillRate', label: 'Fill Rate', format: 'percentage', align: 'right' },
        ],
        rows: clampTableRows(classRows),
      },
      {
        id: 'attendance-trainer-table',
        title: 'Trainer Attendance Summary',
        description: 'Attendance and fill by trainer for the active filter window.',
        columns: [
          { key: 'label', label: 'Trainer' },
          { key: 'sessions', label: 'Sessions', format: 'number', align: 'right' },
          { key: 'avgAttendance', label: 'Avg Attendance', format: 'number', align: 'right' },
          { key: 'fillRate', label: 'Fill Rate', format: 'percentage', align: 'right' },
        ],
        rows: clampTableRows(trainerRows),
      },
    ],
  };
};

const buildDiscountsModule = (sales: SalesData[]): OverviewModuleContent => {
  const discountedSales = sales.filter((item) => toNumber(item.discountAmount) > 0 || toNumber(item.discountPercentage) > 0);
  const totalDiscount = discountedSales.reduce((sum, item) => sum + toNumber(item.discountAmount), 0);
  const totalRevenue = discountedSales.reduce((sum, item) => sum + toNumber(item.paymentValue), 0);
  const transactions = discountedSales.length;
  const uniqueCustomers = countUnique(discountedSales, (item) => item.memberId || item.customerEmail);
  const uniqueProducts = countUnique(discountedSales, (item) => item.cleanedProduct);
  const uniqueCategories = countUnique(discountedSales, (item) => item.cleanedCategory);
  const uniqueSellers = countUnique(discountedSales, (item) => item.soldBy);
  const avgDiscount = average(totalDiscount, transactions);
  const avgDiscountRate = average(discountedSales.reduce((sum, item) => sum + toNumber(item.discountPercentage), 0), transactions);

  const productRows = aggregateByLabel(
    discountedSales,
    (item) => item.cleanedProduct,
    () => ({ transactions: 0, discountAmount: 0, revenue: 0 }),
    (accumulator, item) => {
      accumulator.transactions += 1;
      accumulator.discountAmount += toNumber(item.discountAmount);
      accumulator.revenue += toNumber(item.paymentValue);
    }
  )
    .map((row) => ({ ...row, avgDiscount: average(row.discountAmount, row.transactions) }))
    .sort((left, right) => right.discountAmount - left.discountAmount);

  const categoryRows = aggregateByLabel(
    discountedSales,
    (item) => item.cleanedCategory,
    () => ({ transactions: 0, discountAmount: 0, revenue: 0 }),
    (accumulator, item) => {
      accumulator.transactions += 1;
      accumulator.discountAmount += toNumber(item.discountAmount);
      accumulator.revenue += toNumber(item.paymentValue);
    }
  ).sort((left, right) => right.discountAmount - left.discountAmount);

  const soldByRows = aggregateByLabel(
    discountedSales,
    (item) => item.soldBy,
    () => ({ transactions: 0, discountAmount: 0 }),
    (accumulator, item) => {
      accumulator.transactions += 1;
      accumulator.discountAmount += toNumber(item.discountAmount);
    }
  ).sort((left, right) => right.discountAmount - left.discountAmount);

  const rankings = productRows.map((row) => ({
    label: row.label,
    value: row.discountAmount,
    secondary: `${formatOverviewValue(row.transactions, 'number')} discounted txns`,
  }));

  return {
    title: 'Discounts & Promotions',
    subtitle: 'Discount depth, product exposure, and seller concentration using the shared filters.',
    cards: [
      { id: 'discount-total', title: 'Discount Value', value: formatOverviewValue(totalDiscount, 'currency'), description: 'Discount amount granted in the filtered sales set.', icon: BadgePercent, accent: 'rose' },
      { id: 'discount-revenue', title: 'Discounted Revenue', value: formatOverviewValue(totalRevenue, 'currency'), description: 'Revenue attached to discounted transactions.', icon: DollarSign, accent: 'emerald' },
      { id: 'discount-transactions', title: 'Discounted Txns', value: formatOverviewValue(transactions, 'number'), description: 'Transactions carrying any discount in the active window.', icon: ShoppingCart, accent: 'blue' },
      { id: 'discount-customers', title: 'Customers Impacted', value: formatOverviewValue(uniqueCustomers, 'number'), description: 'Distinct customers who received a discount.', icon: Users, accent: 'purple' },
      { id: 'discount-products', title: 'Discounted Products', value: formatOverviewValue(uniqueProducts, 'number'), description: 'Distinct products sold with discounts applied.', icon: Package, accent: 'teal' },
      { id: 'discount-categories', title: 'Discounted Categories', value: formatOverviewValue(uniqueCategories, 'number'), description: 'Distinct categories impacted by discounts.', icon: Layers3, accent: 'indigo' },
      { id: 'discount-avg', title: 'Avg Discount', value: formatOverviewValue(avgDiscount, 'currency'), description: 'Average discount amount per discounted transaction.', icon: Wallet, accent: 'amber' },
      { id: 'discount-rate', title: 'Avg Discount %', value: formatOverviewValue(avgDiscountRate, 'percentage'), description: 'Average discount percentage across discounted transactions.', icon: Percent, accent: 'slate' },
    ],
    charts: [
      {
        id: 'discount-category-chart',
        title: 'Discount Value by Category',
        description: 'Where discount value is concentrated inside the active filters.',
        data: categoryRows.slice(0, 8).map((row) => ({ category: row.label, discountAmount: row.discountAmount, revenue: row.revenue })),
        xKey: 'category',
        series: [
          { key: 'discountAmount', label: 'Discount Value', color: '#f43f5e' },
          { key: 'revenue', label: 'Discounted Revenue', color: '#10b981' },
        ],
        format: 'currency',
      },
      {
        id: 'discount-soldby-chart',
        title: 'Discount Value by Seller',
        description: 'Seller concentration for discounts granted in the active window.',
        data: soldByRows.slice(0, 8).map((row) => ({ seller: row.label, discountAmount: row.discountAmount, transactions: row.transactions })),
        xKey: 'seller',
        series: [
          { key: 'discountAmount', label: 'Discount Value', color: '#8b5cf6' },
          { key: 'transactions', label: 'Transactions', color: '#3b82f6' },
        ],
        format: 'currency',
      },
    ],
    topRanking: {
      id: 'discount-top-products',
      title: 'Top Discounted Products',
      description: 'Products absorbing the most discount value inside the active filters.',
      format: 'currency',
      accent: 'emerald',
      entries: takeTopEntries(rankingEntriesFromRows(rankings, 'No discounted products yet')),
    },
    bottomRanking: {
      id: 'discount-bottom-products',
      title: 'Bottom Discounted Products',
      description: 'Products with the least discount value inside the active filters.',
      format: 'currency',
      accent: 'rose',
      entries: takeBottomEntries(rankingEntriesFromRows(rankings, 'No discounted products yet')),
    },
    tables: [
      {
        id: 'discount-product-table',
        title: 'Discounted Product Summary',
        description: 'Product-level discount depth and revenue output.',
        columns: [
          { key: 'label', label: 'Product' },
          { key: 'transactions', label: 'Txns', format: 'number', align: 'right' },
          { key: 'discountAmount', label: 'Discount', format: 'currency', align: 'right' },
          { key: 'avgDiscount', label: 'Avg Discount', format: 'currency', align: 'right' },
        ],
        rows: clampTableRows(productRows),
      },
      {
        id: 'discount-seller-table',
        title: 'Seller Discount Summary',
        description: 'Discount volume and transactions by seller.',
        columns: [
          { key: 'label', label: 'Seller' },
          { key: 'transactions', label: 'Txns', format: 'number', align: 'right' },
          { key: 'discountAmount', label: 'Discount', format: 'currency', align: 'right' },
        ],
        rows: clampTableRows(soldByRows),
      },
    ],
  };
};

const buildClassFormatsModule = (sessions: SessionData[]): OverviewModuleContent => {
  const formatRows = aggregateByLabel(
    sessions,
    (session) => guessFormatFamily(session.cleanedClass || session.classType || session.sessionName),
    () => ({ sessions: 0, attendance: 0, capacity: 0, revenue: 0 }),
    (accumulator, session) => {
      accumulator.sessions += 1;
      accumulator.attendance += toNumber(session.checkedInCount);
      accumulator.capacity += toNumber(session.capacity);
      accumulator.revenue += toNumber(session.totalPaid);
    }
  )
    .map((row) => ({ ...row, avgAttendance: average(row.attendance, row.sessions), fillRate: percentage(row.attendance, row.capacity) }))
    .sort((left, right) => right.sessions - left.sessions);

  const locationRows = aggregateByLabel(
    sessions,
    (session) => session.location,
    () => ({ sessions: 0, attendance: 0, revenue: 0 }),
    (accumulator, session) => {
      accumulator.sessions += 1;
      accumulator.attendance += toNumber(session.checkedInCount);
      accumulator.revenue += toNumber(session.totalPaid);
    }
  )
    .map((row) => ({ ...row, avgAttendance: average(row.attendance, row.sessions) }))
    .sort((left, right) => right.sessions - left.sessions);

  const formatLookup = new Map(formatRows.map((row) => [row.label, row]));
  const powerCycleSessions = formatLookup.get('PowerCycle')?.sessions ?? 0;
  const barreSessions = formatLookup.get('Barre')?.sessions ?? 0;
  const strengthSessions = formatLookup.get('Strength')?.sessions ?? 0;
  const hostedSessions = formatLookup.get('Hosted')?.sessions ?? 0;
  const totalSessions = sessions.length;
  const totalAttendance = sessions.reduce((sum, session) => sum + toNumber(session.checkedInCount), 0);
  const totalCapacity = sessions.reduce((sum, session) => sum + toNumber(session.capacity), 0);
  const totalRevenue = sessions.reduce((sum, session) => sum + toNumber(session.totalPaid), 0);

  const rankings = formatRows.map((row) => ({
    label: row.label,
    value: row.avgAttendance,
    secondary: `${formatOverviewValue(row.sessions, 'number')} sessions`,
  }));

  return {
    title: 'Class Formats',
    subtitle: 'Format mix, attendance quality, and revenue contribution within the active overview filters.',
    cards: [
      { id: 'formats-total-sessions', title: 'Sessions', value: formatOverviewValue(totalSessions, 'number'), description: 'Format sessions inside the shared filter range.', icon: Calendar, accent: 'blue' },
      { id: 'formats-attendance', title: 'Attendance', value: formatOverviewValue(totalAttendance, 'number'), description: 'Attendance tied to the filtered format sessions.', icon: Users, accent: 'emerald' },
      { id: 'formats-fill', title: 'Fill Rate', value: formatOverviewValue(percentage(totalAttendance, totalCapacity), 'percentage'), description: 'Capacity utilization across the filtered format set.', icon: Gauge, accent: 'purple' },
      { id: 'formats-revenue', title: 'Revenue', value: formatOverviewValue(totalRevenue, 'currency'), description: 'Paid value across filtered format sessions.', icon: DollarSign, accent: 'indigo' },
      { id: 'formats-powercycle', title: 'PowerCycle', value: formatOverviewValue(powerCycleSessions, 'number'), description: 'PowerCycle sessions in the filtered window.', icon: TrendingUp, accent: 'teal' },
      { id: 'formats-barre', title: 'Barre', value: formatOverviewValue(barreSessions, 'number'), description: 'Barre sessions in the filtered window.', icon: Sparkles, accent: 'rose' },
      { id: 'formats-strength', title: 'Strength', value: formatOverviewValue(strengthSessions, 'number'), description: 'Strength sessions in the filtered window.', icon: Target, accent: 'amber' },
      { id: 'formats-hosted', title: 'Hosted', value: formatOverviewValue(hostedSessions, 'number'), description: 'Hosted or partner sessions in the filtered window.', icon: Landmark, accent: 'slate' },
    ],
    charts: [
      {
        id: 'formats-sessions-chart',
        title: 'Session Mix by Format',
        description: 'Format-level session volume and revenue under the active filters.',
        data: formatRows.map((row) => ({ format: row.label, sessions: row.sessions, revenue: row.revenue })),
        xKey: 'format',
        series: [
          { key: 'sessions', label: 'Sessions', color: '#3b82f6' },
          { key: 'revenue', label: 'Revenue', color: '#10b981' },
        ],
        format: 'currency',
      },
      {
        id: 'formats-attendance-chart',
        title: 'Format Quality Snapshot',
        description: 'Average attendance and fill rate by format.',
        data: formatRows.map((row) => ({ format: row.label, avgAttendance: row.avgAttendance, fillRate: row.fillRate })),
        xKey: 'format',
        series: [
          { key: 'avgAttendance', label: 'Avg Attendance', color: '#8b5cf6' },
          { key: 'fillRate', label: 'Fill Rate', color: '#f97316' },
        ],
        format: 'number',
      },
    ],
    topRanking: {
      id: 'formats-top-ranking',
      title: 'Top Format Rankings',
      description: 'Formats delivering the highest average attendance inside the active filters.',
      format: 'number',
      accent: 'emerald',
      entries: takeTopEntries(rankingEntriesFromRows(rankings, 'No formats yet')),
    },
    bottomRanking: {
      id: 'formats-bottom-ranking',
      title: 'Bottom Format Rankings',
      description: 'Formats with the lowest average attendance inside the same filters.',
      format: 'number',
      accent: 'rose',
      entries: takeBottomEntries(rankingEntriesFromRows(rankings, 'No formats yet')),
    },
    tables: [
      {
        id: 'formats-summary-table',
        title: 'Format Summary',
        description: 'Sessions, attendance, fill, and revenue by format family.',
        columns: [
          { key: 'label', label: 'Format' },
          { key: 'sessions', label: 'Sessions', format: 'number', align: 'right' },
          { key: 'avgAttendance', label: 'Avg Attendance', format: 'number', align: 'right' },
          { key: 'fillRate', label: 'Fill Rate', format: 'percentage', align: 'right' },
        ],
        rows: clampTableRows(formatRows),
      },
      {
        id: 'formats-location-table',
        title: 'Location Summary',
        description: 'Location mix for the same filtered format cohort.',
        columns: [
          { key: 'label', label: 'Location' },
          { key: 'sessions', label: 'Sessions', format: 'number', align: 'right' },
          { key: 'avgAttendance', label: 'Avg Attendance', format: 'number', align: 'right' },
          { key: 'revenue', label: 'Revenue', format: 'currency', align: 'right' },
        ],
        rows: clampTableRows(locationRows),
      },
    ],
  };
};

const buildLateCancellationsModule = (lateCancellations: LateCancellationsData[]): OverviewModuleContent => {
  const totalCancellations = lateCancellations.length;
  const impactedMembers = countUnique(lateCancellations, (row) => row.memberId || row.email);
  const uniqueTrainers = countUnique(lateCancellations, (row) => row.teacherName);
  const uniqueClasses = countUnique(lateCancellations, (row) => row.cleanedClass);
  const uniqueProducts = countUnique(lateCancellations, (row) => row.cleanedProduct);
  const avgCapacity = average(lateCancellations.reduce((sum, row) => sum + toNumber(row.capacity), 0), totalCancellations);
  const avgPaidAmount = average(lateCancellations.reduce((sum, row) => sum + toNumber(row.paidAmount), 0), totalCancellations);
  const newMemberCancellations = lateCancellations.filter((row) => /new/i.test(String(row.isNew ?? ''))).length;

  const trainerRows = aggregateByLabel(
    lateCancellations,
    (row) => row.teacherName,
    () => ({ cancellations: 0, paidAmount: 0 }),
    (accumulator, row) => {
      accumulator.cancellations += 1;
      accumulator.paidAmount += toNumber(row.paidAmount);
    }
  ).sort((left, right) => right.cancellations - left.cancellations);

  const classRows = aggregateByLabel(
    lateCancellations,
    (row) => row.cleanedClass || row.sessionName,
    () => ({ cancellations: 0, paidAmount: 0 }),
    (accumulator, row) => {
      accumulator.cancellations += 1;
      accumulator.paidAmount += toNumber(row.paidAmount);
    }
  ).sort((left, right) => right.cancellations - left.cancellations);

  const dayRows = aggregateByLabel(
    lateCancellations,
    (row) => row.dayOfWeek,
    () => ({ cancellations: 0 }),
    (accumulator) => {
      accumulator.cancellations += 1;
    }
  ).sort((left, right) => right.cancellations - left.cancellations);

  const monthlyRows = buildMonthlySeries(lateCancellations, (row) => row.dateIST, {
    cancellations: () => 1,
  });

  const rankings = trainerRows.map((row) => ({
    label: row.label,
    value: row.cancellations,
    secondary: formatOverviewValue(row.paidAmount, 'currency'),
  }));

  return {
    title: 'Late Cancellations',
    subtitle: 'Cancellation intensity, trainer exposure, and class risk under the active overview filters.',
    cards: [
      { id: 'cancel-total', title: 'Late Cancellations', value: formatOverviewValue(totalCancellations, 'number'), description: 'Late cancellation records inside the active filters.', icon: ShieldAlert, accent: 'rose' },
      { id: 'cancel-members', title: 'Impacted Members', value: formatOverviewValue(impactedMembers, 'number'), description: 'Distinct members represented in the filtered cancellations.', icon: Users, accent: 'blue' },
      { id: 'cancel-trainers', title: 'Trainers', value: formatOverviewValue(uniqueTrainers, 'number'), description: 'Distinct trainers tied to the late cancellation set.', icon: UserCheck, accent: 'purple' },
      { id: 'cancel-classes', title: 'Classes', value: formatOverviewValue(uniqueClasses, 'number'), description: 'Distinct class labels inside the filtered cancellations.', icon: BookOpen, accent: 'indigo' },
      { id: 'cancel-products', title: 'Products', value: formatOverviewValue(uniqueProducts, 'number'), description: 'Distinct products affected by late cancellations.', icon: Package, accent: 'teal' },
      { id: 'cancel-capacity', title: 'Avg Capacity', value: formatOverviewValue(avgCapacity, 'number'), description: 'Average class capacity attached to late cancellations.', icon: Gauge, accent: 'amber' },
      { id: 'cancel-paid', title: 'Avg Paid Value', value: formatOverviewValue(avgPaidAmount, 'currency'), description: 'Average paid amount associated with late cancellations.', icon: Wallet, accent: 'emerald' },
      { id: 'cancel-new-members', title: 'New Member Cancels', value: formatOverviewValue(newMemberCancellations, 'number'), description: 'Late cancellations coming from new members.', icon: UserPlus, accent: 'slate' },
    ],
    charts: [
      {
        id: 'cancel-trainer-chart',
        title: 'Cancellations by Trainer',
        description: 'Trainer concentration for late cancellation records.',
        data: trainerRows.slice(0, 8).map((row) => ({ trainer: row.label, cancellations: row.cancellations, paidAmount: row.paidAmount })),
        xKey: 'trainer',
        series: [
          { key: 'cancellations', label: 'Cancellations', color: '#ef4444' },
          { key: 'paidAmount', label: 'Paid Amount', color: '#8b5cf6' },
        ],
        format: 'number',
      },
      {
        id: 'cancel-day-chart',
        title: 'Cancellation Trend',
        description: 'Weekday and monthly cancellation shape for the active filters.',
        data: monthlyRows.length > 1 ? monthlyRows : dayRows.slice(0, 7).map((row) => ({ period: row.label, cancellations: row.cancellations })),
        xKey: monthlyRows.length > 1 ? 'month' : 'period',
        series: [{ key: 'cancellations', label: 'Cancellations', color: '#f97316' }],
        format: 'number',
      },
    ],
    topRanking: {
      id: 'cancel-top-ranking',
      title: 'Top Trainer Risk Rankings',
      description: 'Trainers with the highest late cancellation load.',
      format: 'number',
      accent: 'emerald',
      entries: takeTopEntries(rankingEntriesFromRows(rankings, 'No trainer data yet')),
    },
    bottomRanking: {
      id: 'cancel-bottom-ranking',
      title: 'Bottom Trainer Risk Rankings',
      description: 'Trainers with the lowest late cancellation load.',
      format: 'number',
      accent: 'rose',
      entries: takeBottomEntries(rankingEntriesFromRows(rankings, 'No trainer data yet')),
    },
    tables: [
      {
        id: 'cancel-trainer-table',
        title: 'Trainer Risk Summary',
        description: 'Late cancellation concentration by trainer.',
        columns: [
          { key: 'label', label: 'Trainer' },
          { key: 'cancellations', label: 'Cancellations', format: 'number', align: 'right' },
          { key: 'paidAmount', label: 'Paid Amount', format: 'currency', align: 'right' },
        ],
        rows: clampTableRows(trainerRows),
      },
      {
        id: 'cancel-class-table',
        title: 'Class Risk Summary',
        description: 'Late cancellation concentration by class.',
        columns: [
          { key: 'label', label: 'Class' },
          { key: 'cancellations', label: 'Cancellations', format: 'number', align: 'right' },
          { key: 'paidAmount', label: 'Paid Amount', format: 'currency', align: 'right' },
        ],
        rows: clampTableRows(classRows),
      },
    ],
  };
};

const filteredCheckins = (checkins: CheckinData[]) => checkins;

const buildPatternsModule = (checkins: CheckinData[]): OverviewModuleContent => {
  const visits = checkins.filter((row) => row.checkedIn);
  const totalVisits = visits.length;
  const totalBookings = checkins.length;
  const totalRevenue = visits.reduce((sum, row) => sum + toNumber(row.paid), 0);
  const uniqueMembers = countUnique(checkins, (row) => row.memberId || row.email);
  const avgRevenuePerMember = average(totalRevenue, uniqueMembers);
  const avgClassNo = average(checkins.reduce((sum, row) => sum + toNumber(row.classNo), 0), totalBookings);
  const lateCancellations = checkins.filter((row) => row.isLateCancelled).length;
  const complementaryVisits = checkins.filter((row) => row.complementary).length;

  const productRows = aggregateByLabel(
    checkins,
    (row) => row.cleanedProduct,
    () => ({ bookings: 0, visits: 0, revenue: 0 }),
    (accumulator, row) => {
      accumulator.bookings += 1;
      accumulator.visits += row.checkedIn ? 1 : 0;
      accumulator.revenue += toNumber(row.paid);
    }
  )
    .map((row) => ({ ...row, visitRate: percentage(row.visits, row.bookings) }))
    .sort((left, right) => right.visits - left.visits);

  const teacherRows = aggregateByLabel(
    checkins,
    (row) => row.teacherName,
    () => ({ bookings: 0, visits: 0, revenue: 0 }),
    (accumulator, row) => {
      accumulator.bookings += 1;
      accumulator.visits += row.checkedIn ? 1 : 0;
      accumulator.revenue += toNumber(row.paid);
    }
  )
    .map((row) => ({ ...row, visitRate: percentage(row.visits, row.bookings) }))
    .sort((left, right) => right.visits - left.visits);

  const categoryRows = aggregateByLabel(
    checkins,
    (row) => row.cleanedCategory,
    () => ({ bookings: 0, visits: 0, revenue: 0 }),
    (accumulator, row) => {
      accumulator.bookings += 1;
      accumulator.visits += row.checkedIn ? 1 : 0;
      accumulator.revenue += toNumber(row.paid);
    }
  ).sort((left, right) => right.visits - left.visits);

  const monthlyRows = buildMonthlySeries(checkins, (row) => row.dateIST, {
    visits: (row) => (row.checkedIn ? 1 : 0),
    revenue: (row) => toNumber(row.paid),
  });

  const rankings = productRows.map((row) => ({
    label: row.label,
    value: row.visits,
    secondary: formatOverviewValue(row.revenue, 'currency'),
  }));

  return {
    title: 'Patterns & Trends',
    subtitle: 'Visit behavior, product momentum, and member activity patterns inside the shared overview filters.',
    cards: [
      { id: 'patterns-visits', title: 'Visits', value: formatOverviewValue(totalVisits, 'number'), description: 'Checked-in visits in the active filter set.', icon: Activity, accent: 'blue' },
      { id: 'patterns-bookings', title: 'Bookings', value: formatOverviewValue(totalBookings, 'number'), description: 'All bookings represented in the filtered checkins data.', icon: Calendar, accent: 'purple' },
      { id: 'patterns-members', title: 'Unique Members', value: formatOverviewValue(uniqueMembers, 'number'), description: 'Distinct members touching the filtered booking set.', icon: Users, accent: 'emerald' },
      { id: 'patterns-revenue', title: 'Revenue', value: formatOverviewValue(totalRevenue, 'currency'), description: 'Paid value from the filtered visit set.', icon: DollarSign, accent: 'indigo' },
      { id: 'patterns-rpm', title: 'Revenue / Member', value: formatOverviewValue(avgRevenuePerMember, 'currency'), description: 'Average paid value per distinct filtered member.', icon: Wallet, accent: 'teal' },
      { id: 'patterns-class-no', title: 'Avg Class No.', value: formatOverviewValue(avgClassNo, 'number'), description: 'Average class number across the filtered bookings.', icon: Layers3, accent: 'rose' },
      { id: 'patterns-late-cancels', title: 'Late Cancels', value: formatOverviewValue(lateCancellations, 'number'), description: 'Late cancellation records inside the filtered checkins set.', icon: TrendingDown, accent: 'amber' },
      { id: 'patterns-complementary', title: 'Complementary', value: formatOverviewValue(complementaryVisits, 'number'), description: 'Complementary bookings inside the filtered checkins set.', icon: Ticket, accent: 'slate' },
    ],
    charts: [
      {
        id: 'patterns-product-chart',
        title: 'Product Activity',
        description: 'Bookings and visits by product in the active filters.',
        data: productRows.slice(0, 8).map((row) => ({ product: row.label, bookings: row.bookings, visits: row.visits })),
        xKey: 'product',
        series: [
          { key: 'bookings', label: 'Bookings', color: '#3b82f6' },
          { key: 'visits', label: 'Visits', color: '#10b981' },
        ],
        format: 'number',
      },
      {
        id: 'patterns-monthly-chart',
        title: 'Visit Trend',
        description: 'Visit and revenue movement across the filtered time window.',
        data: monthlyRows,
        xKey: 'month',
        series: [
          { key: 'visits', label: 'Visits', color: '#8b5cf6' },
          { key: 'revenue', label: 'Revenue', color: '#f97316' },
        ],
        format: 'number',
      },
    ],
    topRanking: {
      id: 'patterns-top-products',
      title: 'Top Product Rankings',
      description: 'Products driving the highest visit volume inside the active filters.',
      format: 'number',
      accent: 'emerald',
      entries: takeTopEntries(rankingEntriesFromRows(rankings, 'No products yet')),
    },
    bottomRanking: {
      id: 'patterns-bottom-products',
      title: 'Bottom Product Rankings',
      description: 'Products with the lowest visit volume inside the active filters.',
      format: 'number',
      accent: 'rose',
      entries: takeBottomEntries(rankingEntriesFromRows(rankings, 'No products yet')),
    },
    tables: [
      {
        id: 'patterns-product-table',
        title: 'Product Summary',
        description: 'Bookings, visits, visit rate, and revenue by product.',
        columns: [
          { key: 'label', label: 'Product' },
          { key: 'bookings', label: 'Bookings', format: 'number', align: 'right' },
          { key: 'visits', label: 'Visits', format: 'number', align: 'right' },
          { key: 'visitRate', label: 'Visit Rate', format: 'percentage', align: 'right' },
        ],
        rows: clampTableRows(productRows),
      },
      {
        id: 'patterns-teacher-table',
        title: 'Teacher Summary',
        description: 'Booking, visit, and revenue patterns by teacher.',
        columns: [
          { key: 'label', label: 'Teacher' },
          { key: 'bookings', label: 'Bookings', format: 'number', align: 'right' },
          { key: 'visits', label: 'Visits', format: 'number', align: 'right' },
          { key: 'revenue', label: 'Revenue', format: 'currency', align: 'right' },
        ],
        rows: clampTableRows(teacherRows),
      },
    ],
  };
};

const buildExpirationsModule = (expirations: ExpirationData[]): OverviewModuleContent => {
  const totalMemberships = expirations.length;
  const activeCount = expirations.filter((row) => /active/i.test(row.status)).length;
  const churnedCount = expirations.filter((row) => /churn/i.test(row.status)).length;
  const frozenCount = expirations.filter((row) => /frozen/i.test(row.status) || row.frozen).length;
  const expiringCount = expirations.filter((row) => !/active|churn|frozen/i.test(row.status)).length;
  const uniqueMemberships = countUnique(expirations, (row) => row.membershipName);
  const uniqueSellers = countUnique(expirations, (row) => row.soldBy);

  const membershipRows = aggregateByLabel(
    expirations,
    (row) => row.membershipName,
    () => ({ total: 0, active: 0, churned: 0, frozen: 0 }),
    (accumulator, row) => {
      accumulator.total += 1;
      if (/active/i.test(row.status)) accumulator.active += 1;
      if (/churn/i.test(row.status)) accumulator.churned += 1;
      if (/frozen/i.test(row.status) || row.frozen) accumulator.frozen += 1;
    }
  )
    .map((row) => ({
      ...row,
      activeRate: percentage(row.active, row.total),
      churnRate: percentage(row.churned, row.total),
    }))
    .sort((left, right) => right.total - left.total);

  const sellerRows = aggregateByLabel(
    expirations,
    (row) => row.soldBy,
    () => ({ total: 0, churned: 0, active: 0 }),
    (accumulator, row) => {
      accumulator.total += 1;
      if (/churn/i.test(row.status)) accumulator.churned += 1;
      if (/active/i.test(row.status)) accumulator.active += 1;
    }
  )
    .map((row) => ({ ...row, churnRate: percentage(row.churned, row.total) }))
    .sort((left, right) => right.total - left.total);

  const statusRows = [
    { status: 'Active', count: activeCount },
    { status: 'Churned', count: churnedCount },
    { status: 'Frozen', count: frozenCount },
    { status: 'Other', count: expiringCount },
  ];

  const rankings = membershipRows.map((row) => ({
    label: row.label,
    value: row.total,
    secondary: `${formatOverviewValue(row.churnRate, 'percentage')} churn`,
  }));

  return {
    title: 'Expirations & Churn',
    subtitle: 'Membership status mix, churn pockets, and seller exposure inside the shared overview filters.',
    cards: [
      { id: 'exp-total', title: 'Memberships', value: formatOverviewValue(totalMemberships, 'number'), description: 'Expiration records inside the active overview filters.', icon: Users, accent: 'blue' },
      { id: 'exp-active', title: 'Active', value: formatOverviewValue(activeCount, 'number'), description: 'Memberships still active inside the filtered expiration set.', icon: TrendingUp, accent: 'emerald' },
      { id: 'exp-churned', title: 'Churned', value: formatOverviewValue(churnedCount, 'number'), description: 'Memberships marked churned in the active filters.', icon: TrendingDown, accent: 'rose' },
      { id: 'exp-frozen', title: 'Frozen', value: formatOverviewValue(frozenCount, 'number'), description: 'Frozen memberships in the current filtered set.', icon: ShieldAlert, accent: 'purple' },
      { id: 'exp-active-rate', title: 'Active Rate', value: formatOverviewValue(percentage(activeCount, totalMemberships), 'percentage'), description: 'Share of filtered memberships currently active.', icon: Percent, accent: 'indigo' },
      { id: 'exp-churn-rate', title: 'Churn Rate', value: formatOverviewValue(percentage(churnedCount, totalMemberships), 'percentage'), description: 'Share of filtered memberships marked churned.', icon: FileWarning, accent: 'amber' },
      { id: 'exp-membership-types', title: 'Membership Types', value: formatOverviewValue(uniqueMemberships, 'number'), description: 'Distinct membership names represented in the filtered set.', icon: Layers3, accent: 'teal' },
      { id: 'exp-sellers', title: 'Selling Owners', value: formatOverviewValue(uniqueSellers, 'number'), description: 'Distinct sellers attached to filtered expiration records.', icon: UserCheck, accent: 'slate' },
    ],
    charts: [
      {
        id: 'exp-status-chart',
        title: 'Status Distribution',
        description: 'Status distribution across the filtered expiration records.',
        data: statusRows,
        xKey: 'status',
        series: [{ key: 'count', label: 'Count', color: '#3b82f6' }],
        format: 'number',
      },
      {
        id: 'exp-membership-chart',
        title: 'Membership Exposure',
        description: 'Top membership types in the active filtered set.',
        data: membershipRows.slice(0, 8).map((row) => ({ membership: row.label, total: row.total, churned: row.churned })),
        xKey: 'membership',
        series: [
          { key: 'total', label: 'Total', color: '#8b5cf6' },
          { key: 'churned', label: 'Churned', color: '#ef4444' },
        ],
        format: 'number',
      },
    ],
    topRanking: {
      id: 'exp-top-memberships',
      title: 'Top Membership Rankings',
      description: 'Highest-volume membership types inside the active filters.',
      format: 'number',
      accent: 'emerald',
      entries: takeTopEntries(rankingEntriesFromRows(rankings, 'No memberships yet')),
    },
    bottomRanking: {
      id: 'exp-bottom-memberships',
      title: 'Bottom Membership Rankings',
      description: 'Lowest-volume membership types inside the active filters.',
      format: 'number',
      accent: 'rose',
      entries: takeBottomEntries(rankingEntriesFromRows(rankings, 'No memberships yet')),
    },
    tables: [
      {
        id: 'exp-membership-table',
        title: 'Membership Summary',
        description: 'Membership volume, active rate, and churn rate by membership type.',
        columns: [
          { key: 'label', label: 'Membership' },
          { key: 'total', label: 'Total', format: 'number', align: 'right' },
          { key: 'activeRate', label: 'Active Rate', format: 'percentage', align: 'right' },
          { key: 'churnRate', label: 'Churn Rate', format: 'percentage', align: 'right' },
        ],
        rows: clampTableRows(membershipRows),
      },
      {
        id: 'exp-seller-table',
        title: 'Seller Summary',
        description: 'Seller exposure and churn rate in the active filtered set.',
        columns: [
          { key: 'label', label: 'Seller' },
          { key: 'total', label: 'Memberships', format: 'number', align: 'right' },
          { key: 'active', label: 'Active', format: 'number', align: 'right' },
          { key: 'churnRate', label: 'Churn Rate', format: 'percentage', align: 'right' },
        ],
        rows: clampTableRows(sellerRows),
      },
    ],
  };
};

export const buildOverviewModuleContent = (moduleId: string, data: OverviewDataBundle): OverviewModuleContent => {
  switch (moduleId) {
    case 'sales-analytics':
      return buildSalesModule(data.sales);
    case 'funnel-leads':
      return buildFunnelModule(data.leads);
    case 'client-retention':
      return buildClientRetentionModule(data.newClients);
    case 'trainer-performance':
      return buildTrainerModule(data.payroll);
    case 'class-attendance':
      return buildClassAttendanceModule(data.sessions);
    case 'discounts-promotions':
      return buildDiscountsModule(data.sales);
    case 'class-formats':
      return buildClassFormatsModule(data.sessions);
    case 'late-cancellations':
      return buildLateCancellationsModule(data.lateCancellations);
    case 'patterns-trends':
      return buildPatternsModule(data.checkins);
    case 'expiration-analytics':
      return buildExpirationsModule(data.expirations);
    default:
      return buildSalesModule(data.sales);
  }
};
