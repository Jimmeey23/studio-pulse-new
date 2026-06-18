import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  Gauge,
  Percent,
  ReceiptText,
  Users,
} from 'lucide-react';
import type { CheckinData } from '@/hooks/useCheckinsData';
import type { SessionData } from '@/hooks/useSessionsData';
import type { LeadsData } from '@/types/leads';
import type { ExpirationData, NewClientData, PayrollData, SalesData } from '@/types/dashboard';
import {
  average,
  countUnique,
  filterByOverviewFilters,
  formatOverviewValue,
  guessFormatFamily,
  matchesLocationFilter,
  monthKeyFromDate,
  monthLabelFromKey,
  parseOverviewDate,
  percentage,
  toNumber,
  toText,
  withinDateRange,
} from '@/components/dashboard/overview/filtering';
import type {
  PerformanceChart,
  PerformanceCommandCenterModel,
  PerformanceMetricCard,
  PerformanceMonthlyRow,
  PerformanceRankingCriterion,
  PerformanceRankingEntry,
  PerformanceSection,
  PerformanceTable,
  PerformanceValueFormat,
} from './types';

export interface PerformanceSourceData {
  sales: SalesData[];
  sessions: SessionData[];
  leads: LeadsData[];
  newClients: NewClientData[];
  payroll: PayrollData[];
  checkins: CheckinData[];
  expirations: ExpirationData[];
  filters: {
    dateRange: {
      start: string;
      end: string;
    };
    location: string[];
  };
}

const emptyRowLabel = 'No data';

const formatValue = (value: number, format: PerformanceValueFormat = 'number') =>
  formatOverviewValue(value, format);

const uniqueTransactionCount = (sales: SalesData[]) =>
  countUnique(sales, (item) => item.transactionId || item.saleReference || item.saleItemId || item.salesItemId || item.paymentTransactionId);

const salesLocation = (item: SalesData) => item.calculatedLocation || (item as any).location;
const leadLocation = (item: LeadsData) => item.center || (item as any).location;
const clientLocation = (item: NewClientData) => item.homeLocation || item.firstVisitLocation || (item as any).location;
const expirationLocation = (item: ExpirationData) => item.homeLocation || (item as any).location;

const filterForDetail = (data: PerformanceSourceData) => ({
  sales: filterByOverviewFilters(data.sales, data.filters, {
    getDate: (item) => item.paymentDate,
    getLocation: salesLocation,
  }),
  sessions: filterByOverviewFilters(data.sessions, data.filters, {
    getDate: (item) => item.date,
    getLocation: (item) => item.location,
  }),
  leads: filterByOverviewFilters(data.leads, data.filters, {
    getDate: (item) => item.createdAt || (item as any).leadDate || item.period,
    getLocation: leadLocation,
  }),
  newClients: filterByOverviewFilters(data.newClients, data.filters, {
    getDate: (item) => item.firstVisitDate || item.monthYear,
    getLocation: clientLocation,
  }),
  payroll: filterByOverviewFilters(data.payroll, data.filters, {
    getDate: (item) => item.monthYear,
    getLocation: (item) => item.location,
  }),
  checkins: filterByOverviewFilters(data.checkins, data.filters, {
    getDate: (item) => item.dateIST,
    getLocation: (item) => item.location,
  }),
  expirations: filterByOverviewFilters(data.expirations, data.filters, {
    getDate: (item) => item.endDate || item.orderAt,
    getLocation: expirationLocation,
  }),
});

const filterLocationOnly = <T>(items: T[], selectedLocations: string[], getLocation: (item: T) => string | undefined | null) =>
  items.filter((item) => matchesLocationFilter(getLocation(item), selectedLocations));

const isCheckedInVisit = (item: CheckinData) => item.checkedIn && !item.isLateCancelled;

const isLapsedExpiration = (item: ExpirationData) => {
  const status = toText(item.status, '').toLowerCase();
  if (/lapsed|expired|inactive|ended|cancelled|canceled/.test(status)) return true;

  const endDate = parseOverviewDate(item.endDate);
  return Boolean(endDate && endDate < new Date());
};

const calculateCoreMetrics = (input: {
  sales: SalesData[];
  sessions: SessionData[];
  checkins: CheckinData[];
  expirations: ExpirationData[];
}) => {
  const revenue = input.sales.reduce((sum, item) => sum + toNumber(item.paymentValue), 0);
  const transactions = uniqueTransactionCount(input.sales) || input.sales.length;
  const uniqueMembers = countUnique(input.sales, (item) => item.memberId || item.customerEmail);
  const checkedInVisits = input.checkins.filter(isCheckedInVisit).length || input.sessions.reduce((sum, item) => sum + toNumber(item.checkedInCount), 0);
  const visitors = countUnique(input.checkins.filter(isCheckedInVisit), (item) => item.memberId || item.email);
  const sessionCount = input.sessions.length;
  const sessionAttendance = input.sessions.reduce((sum, item) => sum + toNumber(item.checkedInCount), 0);
  const sessionCapacity = input.sessions.reduce((sum, item) => sum + toNumber(item.capacity), 0);
  const lapsed = input.expirations.filter(isLapsedExpiration).length;

  return {
    salesRevenue: revenue,
    atv: average(revenue, transactions),
    uniqueMembers,
    classAverage: average(sessionAttendance, sessionCount),
    fillRate: percentage(sessionAttendance, sessionCapacity),
    visitors,
    revenuePerVisit: average(revenue, checkedInVisits),
    lapsed,
  };
};

const changePercent = (current: number, previous: number) => {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

const monthBucket = (map: Map<string, any>, key: string) => {
  const current = map.get(key) ?? {
    sales: [] as SalesData[],
    sessions: [] as SessionData[],
    checkins: [] as CheckinData[],
    expirations: [] as ExpirationData[],
  };
  map.set(key, current);
  return current;
};

const buildMonthlyRows = (data: PerformanceSourceData): PerformanceMonthlyRow[] => {
  const selectedLocations = data.filters.location || [];
  const monthMap = new Map<string, ReturnType<typeof monthBucket>>();

  filterLocationOnly(data.sales, selectedLocations, salesLocation).forEach((item) => {
    const key = monthKeyFromDate(item.paymentDate);
    if (key) monthBucket(monthMap, key).sales.push(item);
  });

  filterLocationOnly(data.sessions, selectedLocations, (item) => item.location).forEach((item) => {
    const key = monthKeyFromDate(item.date);
    if (key) monthBucket(monthMap, key).sessions.push(item);
  });

  filterLocationOnly(data.checkins, selectedLocations, (item) => item.location).forEach((item) => {
    const key = monthKeyFromDate(item.dateIST);
    if (key) monthBucket(monthMap, key).checkins.push(item);
  });

  filterLocationOnly(data.expirations, selectedLocations, expirationLocation).forEach((item) => {
    const key = monthKeyFromDate(item.endDate || item.orderAt);
    if (key) monthBucket(monthMap, key).expirations.push(item);
  });

  return Array.from(monthMap.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([monthKey, bucket]) => ({
      monthKey,
      monthLabel: monthLabelFromKey(monthKey),
      ...calculateCoreMetrics(bucket),
    }));
};

const buildMetricCards = (current: ReturnType<typeof calculateCoreMetrics>, monthlyRows: PerformanceMonthlyRow[]): PerformanceMetricCard[] => {
  const latest = monthlyRows[0];
  const previous = monthlyRows[1];

  const cardConfig = [
    { id: 'salesRevenue', label: 'Sales Revenue', format: 'currency' as const, icon: CircleDollarSign, description: 'Filtered sales payment value.', accent: 'emerald' },
    { id: 'atv', label: 'ATV', format: 'currency' as const, icon: ReceiptText, description: 'Revenue divided by distinct transactions.', accent: 'sky' },
    { id: 'uniqueMembers', label: 'Unique Members', format: 'number' as const, icon: Users, description: 'Distinct purchasing community members.', accent: 'violet' },
    { id: 'classAverage', label: 'Class Average', format: 'number' as const, icon: CalendarDays, description: 'Average checked-in attendance per studio session.', accent: 'amber' },
    { id: 'fillRate', label: 'Fill Rate', format: 'percentage' as const, icon: Percent, description: 'Checked-in attendance as a share of session capacity.', accent: 'rose' },
    { id: 'visitors', label: 'Visitors', format: 'number' as const, icon: Activity, description: 'Distinct checked-in visitors.', accent: 'teal' },
    { id: 'revenuePerVisit', label: 'Revenue/Visit', format: 'currency' as const, icon: Gauge, description: 'Sales revenue divided by checked-in visits.', accent: 'indigo' },
    { id: 'lapsed', label: 'Lapsed', format: 'number' as const, icon: AlertTriangle, description: 'Expired or lapsed access records.', accent: 'slate' },
  ];

  return cardConfig.map((item) => {
    const value = current[item.id as keyof typeof current];
    const monthChange = latest && previous ? changePercent(latest[item.id as keyof PerformanceMonthlyRow] as number, previous[item.id as keyof PerformanceMonthlyRow] as number) : 0;

    return {
      id: item.id,
      label: item.label,
      value,
      formattedValue: formatValue(value, item.format),
      format: item.format,
      description: item.description,
      changePercent: monthChange,
      trend: Math.abs(monthChange) < 0.1 ? 'flat' : monthChange > 0 ? 'up' : 'down',
      icon: item.icon,
      accent: item.accent,
    };
  });
};

const groupRows = <T, A extends Record<string, number>>(
  items: T[],
  labelFn: (item: T) => string | undefined | null,
  initial: () => A,
  apply: (accumulator: A, item: T) => void
) => {
  const map = new Map<string, A>();
  items.forEach((item) => {
    const label = toText(labelFn(item), emptyRowLabel);
    const accumulator = map.get(label) ?? initial();
    apply(accumulator, item);
    map.set(label, accumulator);
  });
  return Array.from(map.entries()).map(([label, value]) => ({ label, ...value }));
};

const topBottomCriterion = (
  id: string,
  label: string,
  format: PerformanceValueFormat,
  entries: PerformanceRankingEntry[],
  count = 5
): PerformanceRankingCriterion => {
  const sorted = [...entries].filter((entry) => Number.isFinite(entry.value));

  return {
    id,
    label,
    format,
    top: sorted.sort((left, right) => right.value - left.value).slice(0, count),
    bottom: sorted.sort((left, right) => left.value - right.value).slice(0, count),
  };
};

const table = (
  id: string,
  title: string,
  description: string,
  columns: PerformanceTable['columns'],
  rows: PerformanceTable['rows']
): PerformanceTable => ({ id, title, description, columns, rows });

const monthlyChart = (id: string, title: string, description: string, rows: PerformanceMonthlyRow[], keys: PerformanceChart['series']): PerformanceChart => ({
  id,
  title,
  description,
  xKey: 'monthLabel',
  data: [...rows].reverse().map((row) => ({ ...row })),
  series: keys,
});

const buildSalesSection = (sales: SalesData[], monthlyRows: PerformanceMonthlyRow[]): PerformanceSection => {
  const rows = groupRows(
    sales,
    (item) => item.cleanedProduct || item.paymentItem,
    () => ({ revenue: 0, transactions: 0, members: 0 }),
    (accumulator, item) => {
      accumulator.revenue += toNumber(item.paymentValue);
      accumulator.transactions += 1;
      accumulator.members += item.memberId || item.customerEmail ? 1 : 0;
    }
  )
    .map((row) => ({ ...row, atv: average(row.revenue, row.transactions) }))
    .sort((left, right) => right.revenue - left.revenue);

  const categoryRows = groupRows(
    sales,
    (item) => item.cleanedCategory || item.paymentCategory,
    () => ({ revenue: 0, transactions: 0 }),
    (accumulator, item) => {
      accumulator.revenue += toNumber(item.paymentValue);
      accumulator.transactions += 1;
    }
  ).sort((left, right) => right.revenue - left.revenue);

  return {
    id: 'sales',
    title: 'Sales',
    subtitle: 'Revenue, transaction, product, and seller momentum.',
    accent: 'emerald',
    table: table('sales-product-table', 'Product Revenue Table', 'Sales revenue, transactions, and ATV by product.', [
      { key: 'label', label: 'Product' },
      { key: 'revenue', label: 'Revenue', format: 'currency', align: 'right' },
      { key: 'transactions', label: 'Transactions', format: 'number', align: 'right' },
      { key: 'atv', label: 'ATV', format: 'currency', align: 'right' },
    ], rows),
    charts: [
      monthlyChart('sales-monthly-chart', 'Monthly Sales Revenue', 'Revenue and ATV across historical months.', monthlyRows, [
        { key: 'salesRevenue', label: 'Revenue', color: '#059669', format: 'currency' },
        { key: 'atv', label: 'ATV', color: '#0284c7', format: 'currency' },
      ]),
      {
        id: 'sales-category-chart',
        title: 'Revenue by Category',
        description: 'Category contribution inside the active filter window.',
        xKey: 'label',
        data: categoryRows.slice(0, 10),
        series: [
          { key: 'revenue', label: 'Revenue', color: '#7c3aed', format: 'currency' },
          { key: 'transactions', label: 'Transactions', color: '#f59e0b', format: 'number' },
        ],
      },
    ],
    rankingCriteria: [
      topBottomCriterion('revenue', 'Revenue', 'currency', rows.map((row) => ({ label: row.label, value: row.revenue, secondary: `${row.transactions} txns` }))),
      topBottomCriterion('transactions', 'Transactions', 'number', rows.map((row) => ({ label: row.label, value: row.transactions, secondary: formatValue(row.revenue, 'currency') }))),
      topBottomCriterion('atv', 'ATV', 'currency', rows.map((row) => ({ label: row.label, value: row.atv, secondary: `${row.transactions} txns` }))),
    ],
  };
};

const buildClassesSection = (sessions: SessionData[], monthlyRows: PerformanceMonthlyRow[]): PerformanceSection => {
  const rows = groupRows(
    sessions,
    (item) => item.cleanedClass || item.classType || item.sessionName,
    () => ({ sessions: 0, attendance: 0, capacity: 0, revenue: 0 }),
    (accumulator, item) => {
      accumulator.sessions += 1;
      accumulator.attendance += toNumber(item.checkedInCount);
      accumulator.capacity += toNumber(item.capacity);
      accumulator.revenue += toNumber(item.totalPaid || item.revenue);
    }
  )
    .map((row) => ({ ...row, classAverage: average(row.attendance, row.sessions), fillRate: percentage(row.attendance, row.capacity) }))
    .sort((left, right) => right.attendance - left.attendance);

  const trainerRows = groupRows(
    sessions,
    (item) => item.trainerName,
    () => ({ sessions: 0, attendance: 0, capacity: 0 }),
    (accumulator, item) => {
      accumulator.sessions += 1;
      accumulator.attendance += toNumber(item.checkedInCount);
      accumulator.capacity += toNumber(item.capacity);
    }
  )
    .map((row) => ({ ...row, classAverage: average(row.attendance, row.sessions), fillRate: percentage(row.attendance, row.capacity) }))
    .sort((left, right) => right.fillRate - left.fillRate);

  return {
    id: 'classes-attendance',
    title: 'Classes & Attendance',
    subtitle: 'Session demand, capacity utilization, and class average signals.',
    accent: 'sky',
    table: table('classes-table', 'Class Attendance Table', 'Attendance and utilization by signature experience.', [
      { key: 'label', label: 'Studio Session' },
      { key: 'sessions', label: 'Sessions', format: 'number', align: 'right' },
      { key: 'attendance', label: 'Attendance', format: 'number', align: 'right' },
      { key: 'classAverage', label: 'Class Avg', format: 'number', align: 'right' },
      { key: 'fillRate', label: 'Fill Rate', format: 'percentage', align: 'right' },
    ], rows),
    charts: [
      monthlyChart('classes-monthly-chart', 'Monthly Attendance Quality', 'Class average and fill rate by month.', monthlyRows, [
        { key: 'classAverage', label: 'Class Average', color: '#0284c7', format: 'number' },
        { key: 'fillRate', label: 'Fill Rate', color: '#e11d48', format: 'percentage' },
      ]),
      {
        id: 'classes-trainer-chart',
        title: 'Instructor Attendance Snapshot',
        description: 'Instructor class average and fill rate in the active window.',
        xKey: 'label',
        data: trainerRows.slice(0, 10),
        series: [
          { key: 'classAverage', label: 'Class Average', color: '#7c3aed', format: 'number' },
          { key: 'fillRate', label: 'Fill Rate', color: '#14b8a6', format: 'percentage' },
        ],
      },
    ],
    rankingCriteria: [
      topBottomCriterion('attendance', 'Attendance', 'number', rows.map((row) => ({ label: row.label, value: row.attendance, secondary: `${row.sessions} sessions` }))),
      topBottomCriterion('fillRate', 'Fill Rate', 'percentage', rows.map((row) => ({ label: row.label, value: row.fillRate, secondary: `${row.attendance} visits` }))),
      topBottomCriterion('classAverage', 'Class Average', 'number', rows.map((row) => ({ label: row.label, value: row.classAverage, secondary: `${row.sessions} sessions` }))),
    ],
  };
};

const isConvertedLead = (lead: LeadsData) => Boolean(lead.convertedToCustomerAt) || /convert|member/i.test(lead.conversionStatus || lead.status || '');
const isConvertedClient = (client: NewClientData) => /converted/i.test(client.conversionStatus || '');

const buildFunnelSection = (leads: LeadsData[], newClients: NewClientData[]): PerformanceSection => {
  const sourceRows = groupRows(
    leads,
    (item) => item.source,
    () => ({ leads: 0, converted: 0, ltv: 0 }),
    (accumulator, item) => {
      accumulator.leads += 1;
      if (isConvertedLead(item)) accumulator.converted += 1;
      accumulator.ltv += toNumber(item.ltv);
    }
  )
    .map((row) => ({ ...row, conversionRate: percentage(row.converted, row.leads), avgLtv: average(row.ltv, row.converted || row.leads) }))
    .sort((left, right) => right.conversionRate - left.conversionRate);

  const trainerRows = groupRows(
    newClients,
    (item) => item.trainerName,
    () => ({ newcomers: 0, converted: 0, ltv: 0 }),
    (accumulator, item) => {
      accumulator.newcomers += 1;
      if (isConvertedClient(item)) accumulator.converted += 1;
      accumulator.ltv += toNumber(item.ltv);
    }
  )
    .map((row) => ({ ...row, conversionRate: percentage(row.converted, row.newcomers), avgLtv: average(row.ltv, row.newcomers) }))
    .sort((left, right) => right.conversionRate - left.conversionRate);

  const monthlyMap = new Map<string, Record<string, number | string>>();
  leads.forEach((lead) => {
    const key = monthKeyFromDate(lead.createdAt || (lead as any).leadDate || lead.period);
    if (!key) return;
    const row = monthlyMap.get(key) ?? { monthLabel: monthLabelFromKey(key), leads: 0, converted: 0 };
    row.leads = toNumber(row.leads) + 1;
    row.converted = toNumber(row.converted) + (isConvertedLead(lead) ? 1 : 0);
    monthlyMap.set(key, row);
  });
  const monthly = Array.from(monthlyMap.entries()).sort(([left], [right]) => left.localeCompare(right)).map(([, row]) => row);

  return {
    id: 'new-member-funnel',
    title: 'New Member Funnel & Conversion',
    subtitle: 'Lead source throughput and newcomer conversion outcomes.',
    accent: 'violet',
    table: table('funnel-source-table', 'Source Conversion Table', 'Lead volume, conversions, conversion rate, and LTV by source.', [
      { key: 'label', label: 'Source' },
      { key: 'leads', label: 'Leads', format: 'number', align: 'right' },
      { key: 'converted', label: 'Converted', format: 'number', align: 'right' },
      { key: 'conversionRate', label: 'Conversion', format: 'percentage', align: 'right' },
      { key: 'avgLtv', label: 'Avg LTV', format: 'currency', align: 'right' },
    ], sourceRows),
    charts: [
      {
        id: 'funnel-monthly-chart',
        title: 'Monthly Funnel Movement',
        description: 'Lead generation and conversion counts by month.',
        xKey: 'monthLabel',
        data: monthly,
        series: [
          { key: 'leads', label: 'Leads', color: '#7c3aed', format: 'number' },
          { key: 'converted', label: 'Converted', color: '#059669', format: 'number' },
        ],
      },
      {
        id: 'funnel-trainer-chart',
        title: 'Newcomer Conversion by Instructor',
        description: 'Conversion and average LTV by first-visit instructor.',
        xKey: 'label',
        data: trainerRows.slice(0, 10),
        series: [
          { key: 'conversionRate', label: 'Conversion Rate', color: '#f59e0b', format: 'percentage' },
          { key: 'avgLtv', label: 'Avg LTV', color: '#0f766e', format: 'currency' },
        ],
      },
    ],
    rankingCriteria: [
      topBottomCriterion('conversionRate', 'Conversion', 'percentage', sourceRows.map((row) => ({ label: row.label, value: row.conversionRate, secondary: `${row.leads} leads` }))),
      topBottomCriterion('leadVolume', 'Lead Volume', 'number', sourceRows.map((row) => ({ label: row.label, value: row.leads, secondary: `${formatValue(row.conversionRate, 'percentage')} conversion` }))),
      topBottomCriterion('avgLtv', 'Avg LTV', 'currency', sourceRows.map((row) => ({ label: row.label, value: row.avgLtv, secondary: `${row.converted} converted` }))),
    ],
  };
};

const buildTeacherSection = (payroll: PayrollData[], sessions: SessionData[]): PerformanceSection => {
  const sessionRows = groupRows(
    sessions,
    (item) => item.trainerName,
    () => ({ liveSessions: 0, attendance: 0, capacity: 0, sessionRevenue: 0 }),
    (accumulator, item) => {
      accumulator.liveSessions += 1;
      accumulator.attendance += toNumber(item.checkedInCount);
      accumulator.capacity += toNumber(item.capacity);
      accumulator.sessionRevenue += toNumber(item.totalPaid || item.revenue);
    }
  );
  const sessionMap = new Map(sessionRows.map((row) => [row.label, row]));

  const rows = groupRows(
    payroll,
    (item) => item.teacherName,
    () => ({ payrollRevenue: 0, payrollSessions: 0, customers: 0, converted: 0, retained: 0 }),
    (accumulator, item) => {
      accumulator.payrollRevenue += toNumber(item.totalPaid);
      accumulator.payrollSessions += toNumber(item.totalSessions);
      accumulator.customers += toNumber(item.totalCustomers);
      accumulator.converted += toNumber(item.converted);
      accumulator.retained += toNumber(item.retained);
    }
  )
    .map((row) => {
      const sessionRow = sessionMap.get(row.label);
      const sessionsCount = row.payrollSessions || sessionRow?.liveSessions || 0;
      const attendance = sessionRow?.attendance || row.customers;
      return {
        ...row,
        sessions: sessionsCount,
        attendance,
        classAverage: average(attendance, sessionsCount),
        fillRate: percentage(sessionRow?.attendance || 0, sessionRow?.capacity || 0),
        conversionRate: percentage(row.converted, row.customers),
        retentionRate: percentage(row.retained, row.customers),
      };
    })
    .sort((left, right) => right.payrollRevenue - left.payrollRevenue);

  return {
    id: 'teacher-performance',
    title: 'Teacher Performance',
    subtitle: 'Instructor revenue, attendance, retention, and conversion output.',
    accent: 'amber',
    table: table('teacher-performance-table', 'Teacher Performance Table', 'Instructor-level revenue, sessions, attendance, conversion, and retention.', [
      { key: 'label', label: 'Instructor' },
      { key: 'payrollRevenue', label: 'Revenue', format: 'currency', align: 'right' },
      { key: 'sessions', label: 'Sessions', format: 'number', align: 'right' },
      { key: 'classAverage', label: 'Class Avg', format: 'number', align: 'right' },
      { key: 'conversionRate', label: 'Conversion', format: 'percentage', align: 'right' },
      { key: 'retentionRate', label: 'Retention', format: 'percentage', align: 'right' },
    ], rows),
    charts: [
      {
        id: 'teacher-revenue-chart',
        title: 'Instructor Revenue Mix',
        description: 'Revenue and customer contribution by instructor.',
        xKey: 'label',
        data: rows.slice(0, 10),
        series: [
          { key: 'payrollRevenue', label: 'Revenue', color: '#d97706', format: 'currency' },
          { key: 'customers', label: 'Customers', color: '#0284c7', format: 'number' },
        ],
      },
      {
        id: 'teacher-quality-chart',
        title: 'Instructor Quality Signals',
        description: 'Class average and retention by instructor.',
        xKey: 'label',
        data: rows.slice(0, 10),
        series: [
          { key: 'classAverage', label: 'Class Average', color: '#7c3aed', format: 'number' },
          { key: 'retentionRate', label: 'Retention', color: '#059669', format: 'percentage' },
        ],
      },
    ],
    rankingCriteria: [
      topBottomCriterion('revenue', 'Revenue', 'currency', rows.map((row) => ({ label: row.label, value: row.payrollRevenue, secondary: `${row.sessions} sessions` }))),
      topBottomCriterion('classAverage', 'Class Average', 'number', rows.map((row) => ({ label: row.label, value: row.classAverage, secondary: `${row.attendance} visits` }))),
      topBottomCriterion('retentionRate', 'Retention', 'percentage', rows.map((row) => ({ label: row.label, value: row.retentionRate, secondary: `${row.retained} retained` }))),
      topBottomCriterion('conversionRate', 'Conversion', 'percentage', rows.map((row) => ({ label: row.label, value: row.conversionRate, secondary: `${row.converted} converted` }))),
    ],
  };
};

const buildFormatSection = (sessions: SessionData[], payroll: PayrollData[]): PerformanceSection => {
  const rows = groupRows(
    sessions,
    (item) => guessFormatFamily(`${item.cleanedClass || ''} ${item.classType || ''} ${item.sessionName || ''}`),
    () => ({ sessions: 0, attendance: 0, capacity: 0, revenue: 0 }),
    (accumulator, item) => {
      accumulator.sessions += 1;
      accumulator.attendance += toNumber(item.checkedInCount);
      accumulator.capacity += toNumber(item.capacity);
      accumulator.revenue += toNumber(item.totalPaid || item.revenue);
    }
  )
    .filter((row) => ['PowerCycle', 'Barre', 'Strength'].includes(row.label))
    .map((row) => ({ ...row, classAverage: average(row.attendance, row.sessions), fillRate: percentage(row.attendance, row.capacity) }))
    .sort((left, right) => right.revenue - left.revenue);

  const payrollRows = payroll.map((item) => ({
    month: item.monthYear,
    PowerCycle: toNumber(item.cyclePaid),
    Barre: toNumber(item.barrePaid),
    Strength: toNumber(item.strengthPaid),
  }));

  return {
    id: 'format-comparison',
    title: 'PowerCycle vs Barre vs Strength',
    subtitle: 'Format-level demand, revenue, and utilization comparison.',
    accent: 'indigo',
    table: table('format-table', 'Format Comparison Table', 'Format revenue, attendance, class average, and fill rate.', [
      { key: 'label', label: 'Format' },
      { key: 'revenue', label: 'Revenue', format: 'currency', align: 'right' },
      { key: 'sessions', label: 'Sessions', format: 'number', align: 'right' },
      { key: 'attendance', label: 'Attendance', format: 'number', align: 'right' },
      { key: 'classAverage', label: 'Class Avg', format: 'number', align: 'right' },
      { key: 'fillRate', label: 'Fill Rate', format: 'percentage', align: 'right' },
    ], rows),
    charts: [
      {
        id: 'format-performance-chart',
        title: 'Format Performance',
        description: 'Revenue and attendance by format.',
        xKey: 'label',
        data: rows,
        series: [
          { key: 'revenue', label: 'Revenue', color: '#4f46e5', format: 'currency' },
          { key: 'attendance', label: 'Attendance', color: '#0f766e', format: 'number' },
        ],
      },
      {
        id: 'format-payroll-chart',
        title: 'Format Revenue by Payroll Month',
        description: 'Payroll-reported format revenue over time.',
        xKey: 'month',
        data: payrollRows.slice(-12),
        series: [
          { key: 'PowerCycle', label: 'PowerCycle', color: '#0284c7', format: 'currency' },
          { key: 'Barre', label: 'Barre', color: '#be185d', format: 'currency' },
          { key: 'Strength', label: 'Strength', color: '#d97706', format: 'currency' },
        ],
      },
    ],
    rankingCriteria: [
      topBottomCriterion('revenue', 'Revenue', 'currency', rows.map((row) => ({ label: row.label, value: row.revenue, secondary: `${row.sessions} sessions` })), 3),
      topBottomCriterion('attendance', 'Attendance', 'number', rows.map((row) => ({ label: row.label, value: row.attendance, secondary: `${formatValue(row.fillRate, 'percentage')} fill` })), 3),
      topBottomCriterion('fillRate', 'Fill Rate', 'percentage', rows.map((row) => ({ label: row.label, value: row.fillRate, secondary: `${row.attendance} visits` })), 3),
    ],
  };
};

const buildExpirationsSection = (expirations: ExpirationData[], monthlyRows: PerformanceMonthlyRow[]): PerformanceSection => {
  const rows = groupRows(
    expirations,
    (item) => item.membershipName,
    () => ({ expirations: 0, lapsed: 0, paidValue: 0 }),
    (accumulator, item) => {
      accumulator.expirations += 1;
      if (isLapsedExpiration(item)) accumulator.lapsed += 1;
      accumulator.paidValue += toNumber(item.paid);
    }
  )
    .map((row) => ({ ...row, lapsedRate: percentage(row.lapsed, row.expirations) }))
    .sort((left, right) => right.lapsed - left.lapsed);

  const statusRows = groupRows(
    expirations,
    (item) => item.status,
    () => ({ expirations: 0, paidValue: 0 }),
    (accumulator, item) => {
      accumulator.expirations += 1;
      accumulator.paidValue += toNumber(item.paid);
    }
  ).sort((left, right) => right.expirations - left.expirations);

  return {
    id: 'expirations-lapsed',
    title: 'Expirations & Lapsed Members',
    subtitle: 'Access expiry pressure, lapsed counts, and renewal-risk pockets.',
    accent: 'rose',
    table: table('expiration-table', 'Expirations Table', 'Membership expiry and lapsed signals by membership type.', [
      { key: 'label', label: 'Membership' },
      { key: 'expirations', label: 'Expirations', format: 'number', align: 'right' },
      { key: 'lapsed', label: 'Lapsed', format: 'number', align: 'right' },
      { key: 'lapsedRate', label: 'Lapsed Rate', format: 'percentage', align: 'right' },
      { key: 'paidValue', label: 'Paid Value', format: 'currency', align: 'right' },
    ], rows),
    charts: [
      monthlyChart('expiration-monthly-chart', 'Monthly Lapsed Trend', 'Lapsed access records by month.', monthlyRows, [
        { key: 'lapsed', label: 'Lapsed', color: '#e11d48', format: 'number' },
        { key: 'uniqueMembers', label: 'Unique Members', color: '#475569', format: 'number' },
      ]),
      {
        id: 'expiration-status-chart',
        title: 'Expiration Status Mix',
        description: 'Expiration records by status in the active window.',
        xKey: 'label',
        data: statusRows.slice(0, 10),
        series: [
          { key: 'expirations', label: 'Expirations', color: '#e11d48', format: 'number' },
          { key: 'paidValue', label: 'Paid Value', color: '#7c3aed', format: 'currency' },
        ],
      },
    ],
    rankingCriteria: [
      topBottomCriterion('lapsed', 'Lapsed Count', 'number', rows.map((row) => ({ label: row.label, value: row.lapsed, secondary: `${row.expirations} expirations` }))),
      topBottomCriterion('lapsedRate', 'Lapsed Rate', 'percentage', rows.map((row) => ({ label: row.label, value: row.lapsedRate, secondary: `${row.lapsed} lapsed` }))),
      topBottomCriterion('paidValue', 'Paid Value', 'currency', rows.map((row) => ({ label: row.label, value: row.paidValue, secondary: `${row.expirations} records` }))),
    ],
  };
};

const buildSummary = (monthlyRows: PerformanceMonthlyRow[], cards: PerformanceMetricCard[]) => {
  const latest = monthlyRows[0];
  const previous = monthlyRows[1];

  if (!latest) {
    return [
      'No historical month-on-month data is available for the selected studio filter yet.',
      'Once source data loads, this panel will summarize movement across revenue, attendance, visits, and lapsed member pressure.',
      'Use the filters above to narrow the command center to a specific studio or operating window.',
    ];
  }

  const strongest = [...cards].sort((left, right) => right.changePercent - left.changePercent)[0];
  const weakest = [...cards].sort((left, right) => left.changePercent - right.changePercent)[0];

  return [
    previous
      ? `${latest.monthLabel} is the latest complete trend point, with ${formatValue(latest.salesRevenue, 'currency')} in revenue and ${formatValue(latest.visitors, 'number')} unique visitors.`
      : `${latest.monthLabel} is the latest available trend point for this studio filter.`,
    `The strongest month-on-month movement is ${strongest.label} at ${strongest.changePercent.toFixed(1)}%, while the softest signal is ${weakest.label} at ${weakest.changePercent.toFixed(1)}%.`,
    `Current filtered performance shows ${cards[3].formattedValue} class average, ${cards[4].formattedValue} fill rate, and ${cards[7].formattedValue} lapsed records requiring renewal or retention review.`,
  ];
};

export const buildPerformanceCommandCenter = (data: PerformanceSourceData): PerformanceCommandCenterModel => {
  const filtered = filterForDetail(data);
  const monthlyRows = buildMonthlyRows(data);
  const currentMetrics = calculateCoreMetrics({
    sales: filtered.sales,
    sessions: filtered.sessions,
    checkins: filtered.checkins,
    expirations: filtered.expirations,
  });
  const metricCards = buildMetricCards(currentMetrics, monthlyRows);

  return {
    metricCards,
    monthlyRows,
    summary: buildSummary(monthlyRows, metricCards),
    sections: [
      buildSalesSection(filtered.sales, monthlyRows),
      buildClassesSection(filtered.sessions, monthlyRows),
      buildFunnelSection(filtered.leads, filtered.newClients),
      buildTeacherSection(filtered.payroll, filtered.sessions),
      buildFormatSection(filtered.sessions, filtered.payroll),
      buildExpirationsSection(filtered.expirations, monthlyRows),
    ],
  };
};
