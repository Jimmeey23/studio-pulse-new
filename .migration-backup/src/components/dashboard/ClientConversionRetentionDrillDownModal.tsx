import React from 'react';
import { useSalesData } from '@/hooks/useSalesData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { parseDate } from '@/utils/dateUtils';
import { NewClientData, SalesData } from '@/types/dashboard';
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  Filter,
  FileSpreadsheet,
  ListChecks,
  MapPin,
  Search,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  X,
} from 'lucide-react';

type DrillDownModalType = 'month' | 'year' | 'class' | 'membership' | 'metric' | 'ranking';
type QuickFilterKey = 'all' | 'eligible' | 'converted' | 'retained' | 'excluded' | 'highValue' | 'newOnly' | 'hosted';
type ModalTabKey = 'overview' | 'clients' | 'transactions' | 'methodology';

type DrillDownDataPayload = {
  clients?: NewClientData[];
  relatedClients?: NewClientData[];
  metricType?: string;
  month?: string | number;
  year?: number;
  rowType?: string;
  rowKey?: string;
  type?: string;
  data?: unknown;
  [key: string]: unknown;
};

interface ClientConversionDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: DrillDownDataPayload | NewClientData[] | null;
  type: DrillDownModalType;
}

type ClientRecord = {
  client: NewClientData;
  transactions: SalesData[];
  transactionCount: number;
  totalMatchedRevenue: number;
  memberships: string[];
  orderedMembershipPurchases: string;
  firstPurchaseItem: string;
  firstPurchaseDate: string;
  secondVisitDate: string;
  recordedVisits: number;
  cohortIncluded: boolean;
  cohortReason: string;
  conversionIncluded: boolean;
  conversionReason: string;
  retentionIncluded: boolean;
  retentionReason: string;
};

const safeText = (value: unknown, fallback = 'Unknown') => {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
};

const parseLooseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = parseDate(value);
  if (parsed) return parsed;
  const jsDate = new Date(value);
  return Number.isNaN(jsDate.getTime()) ? null : jsDate;
};

const uniqBy = <T,>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getClientKey = (client: NewClientData) => {
  const memberId = safeText(client.memberId, '').toLowerCase();
  const email = safeText(client.email, '').toLowerCase();
  return `${memberId}__${email}__${safeText(client.firstVisitDate, '')}`;
};

const getClientKeys = (client: NewClientData) => ({
  memberId: safeText(client.memberId, '').toLowerCase(),
  email: safeText(client.email, '').toLowerCase(),
});

const getChronologicalTransactions = (transactions: SalesData[]) => (
  [...transactions].sort((a, b) => (parseLooseDate(a.paymentDate)?.getTime() || 0) - (parseLooseDate(b.paymentDate)?.getTime() || 0))
);

const getFirstPurchaseItem = (client: NewClientData, transactions: SalesData[]) => {
  const firstTransaction = getChronologicalTransactions(transactions)[0];
  const firstMembershipFromSheet = safeText(client.membershipsBoughtPostTrial, '')
    .split(',')
    .map((item) => item.trim())
    .find(Boolean);

  return safeText(
    client.firstPurchaseItem || firstTransaction?.membershipType || firstTransaction?.paymentItem || firstMembershipFromSheet,
    'Not captured'
  );
};

const getFirstPurchaseDate = (client: NewClientData, transactions: SalesData[]) => {
  const firstTransaction = getChronologicalTransactions(transactions)[0];
  return safeText(client.firstPurchase || firstTransaction?.paymentDate, 'Not captured');
};

const getSecondVisitDate = (client: NewClientData) => {
  const recordedVisits = client.noOfVisits || client.classNo || 0;
  return recordedVisits > 1 ? 'Exact date not captured in source' : 'Not available';
};

const buildMembershipList = (client: NewClientData, transactions: SalesData[]) => {
  const values = [
    client.membershipUsed,
    ...safeText(client.membershipsBoughtPostTrial, '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    ...transactions.flatMap((transaction) => [transaction.membershipType, transaction.paymentItem]),
  ]
    .map((value) => safeText(value, ''))
    .filter(Boolean);

  return uniqBy(values, (value) => value.toLowerCase()).slice(0, 10);
};

const getCohortReason = (client: NewClientData) => {
  const label = safeText(client.isNew, 'Blank');
  if (label.toLowerCase().includes('new')) {
    return {
      included: true,
      reason: `Included in the conversion cohort because isNew is recorded as “${label}”.`,
    };
  }

  return {
    included: false,
    reason: `Excluded from the conversion cohort because isNew is “${label}”, not a new-client value.`,
  };
};

const getConversionReason = (client: NewClientData, transactionCount: number) => {
  if (safeText(client.conversionStatus, '').trim() === 'Converted') {
    if (client.firstPurchase) {
      return {
        included: true,
        reason: `Included as converted because the source marks this client “Converted” and the first purchase is ${client.firstPurchase}.`,
      };
    }

    return {
      included: true,
      reason: 'Included as converted because the source conversionStatus is “Converted”.',
    };
  }

  if (!String(client.isNew || '').toLowerCase().includes('new')) {
    return {
      included: false,
      reason: 'Excluded from conversion performance because this client is outside the new-client denominator.',
    };
  }

  if (transactionCount > 0 || client.purchaseCountPostTrial > 0 || client.firstPurchase) {
    return {
      included: false,
      reason: `Not counted as converted because conversionStatus is “${safeText(client.conversionStatus, 'Blank')}” even though post-trial purchase signals exist.`,
    };
  }

  return {
    included: false,
    reason: 'Not counted as converted because no post-trial purchase signal was matched for this client.',
  };
};

const getRetentionReason = (client: NewClientData) => {
  if (safeText(client.retentionStatus, '').trim() === 'Retained') {
    return {
      included: true,
      reason: 'Included in retained results because retentionStatus is “Retained”.',
    };
  }

  if (safeText(client.conversionStatus, '').trim() !== 'Converted') {
    return {
      included: false,
      reason: 'Excluded from retained results because the client never reached converted status.',
    };
  }

  return {
    included: false,
    reason: `Excluded from retained results because retentionStatus is “${safeText(client.retentionStatus, 'Blank')}”.`,
  };
};

const getScopeBadges = (payload: DrillDownDataPayload | null, type: DrillDownModalType) => {
  const badges: string[] = [];

  if (type === 'month' && payload?.month) badges.push(`Month: ${payload.month}`);
  if (type === 'year' && payload?.year) badges.push(`Year: ${payload.year}`);
  if (payload?.rowKey) badges.push(`Segment: ${payload.rowKey}`);
  if (payload?.rowType) badges.push(`Grouping: ${payload.rowType}`);
  if (payload?.metricType) badges.push(`Metric: ${payload.metricType}`);
  if (payload?.type && type !== 'month') badges.push(`Type: ${payload.type}`);

  if (badges.length === 0) badges.push(`${safeText(type, 'Detail')} drill-down`);
  return badges;
};

const buildDistribution = (items: string[]) => {
  const distribution = items.reduce<Record<string, number>>((acc, item) => {
    const key = safeText(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
};

const isHostedEntity = (value?: string | null) => {
  const normalized = safeText(value, '').toLowerCase();
  return ['host', 'hosted', 'p57', 'birthday', 'rugby', 'lrs'].some((token) => normalized.includes(token));
};

const buildCsv = (headers: string[], rows: Array<Array<string | number>>) => {
  const lines = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...lines].join('\n');
};

const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const toolbarButtonClass =
  'rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50';

export const ClientConversionDrillDownModalV3: React.FC<ClientConversionDrillDownModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  type,
}) => {
  const { data: salesData = [] } = useSalesData();
  const [quickFilter, setQuickFilter] = React.useState<QuickFilterKey>('all');
  const [activeTab, setActiveTab] = React.useState<ModalTabKey>('clients');
  const [search, setSearch] = React.useState('');
  const [expandedClientKeys, setExpandedClientKeys] = React.useState<string[]>([]);

  const payload = data && !Array.isArray(data) ? data : null;
  const hasData = Boolean(data);

  const clients = React.useMemo<NewClientData[]>(() => {
    if (!hasData) return [];
    if (type === 'ranking' && payload?.relatedClients && Array.isArray(payload.relatedClients)) return payload.relatedClients;
    if (payload?.clients && Array.isArray(payload.clients)) return payload.clients;
    if (Array.isArray(data)) return data;
    return [];
  }, [data, hasData, payload, type]);

  const salesIndex = React.useMemo(() => {
    const byMemberId = new Map<string, SalesData[]>();
    const byEmail = new Map<string, SalesData[]>();

    salesData.forEach((transaction) => {
      const memberId = safeText(transaction.memberId, '').toLowerCase();
      const email = safeText(transaction.customerEmail, '').toLowerCase();

      if (memberId) {
        const bucket = byMemberId.get(memberId) || [];
        bucket.push(transaction);
        byMemberId.set(memberId, bucket);
      }

      if (email) {
        const bucket = byEmail.get(email) || [];
        bucket.push(transaction);
        byEmail.set(email, bucket);
      }
    });

    return { byMemberId, byEmail };
  }, [salesData]);

  const clientRecords = React.useMemo<ClientRecord[]>(() => {
    return clients.map((client) => {
      const keys = getClientKeys(client);
      const transactions = uniqBy(
        [
          ...(keys.memberId ? salesIndex.byMemberId.get(keys.memberId) || [] : []),
          ...(keys.email ? salesIndex.byEmail.get(keys.email) || [] : []),
        ],
        (transaction) => [
          safeText(transaction.paymentTransactionId, ''),
          safeText(transaction.transactionId, ''),
          safeText(transaction.saleItemId, ''),
          safeText(transaction.saleReference, ''),
          safeText(transaction.paymentDate, ''),
          safeText(transaction.paymentItem, ''),
        ].join('__')
      ).sort((a, b) => (parseLooseDate(b.paymentDate)?.getTime() || 0) - (parseLooseDate(a.paymentDate)?.getTime() || 0));

      const cohort = getCohortReason(client);
      const conversion = getConversionReason(client, transactions.length);
      const retention = getRetentionReason(client);

      return {
        client,
        transactions,
        transactionCount: transactions.length,
        totalMatchedRevenue: transactions.reduce((sum, transaction) => sum + (transaction.paymentValue || 0), 0),
        memberships: buildMembershipList(client, transactions),
        orderedMembershipPurchases: safeText(client.membershipsBoughtPostTrial, 'Not captured'),
        firstPurchaseItem: getFirstPurchaseItem(client, transactions),
        firstPurchaseDate: getFirstPurchaseDate(client, transactions),
        secondVisitDate: getSecondVisitDate(client),
        recordedVisits: client.noOfVisits || client.classNo || 0,
        cohortIncluded: cohort.included,
        cohortReason: cohort.reason,
        conversionIncluded: conversion.included,
        conversionReason: conversion.reason,
        retentionIncluded: retention.included,
        retentionReason: retention.reason,
      };
    });
  }, [clients, salesIndex]);

  const summary = React.useMemo(() => {
    const totalMembers = clientRecords.length;
    const cohortIncluded = clientRecords.filter((record) => record.cohortIncluded).length;
    const convertedMembers = clientRecords.filter((record) => record.conversionIncluded).length;
    const retainedMembers = clientRecords.filter((record) => record.retentionIncluded).length;
    const totalLTV = clientRecords.reduce((sum, record) => sum + (record.client.ltv || 0), 0);
    const matchedRevenue = clientRecords.reduce((sum, record) => sum + record.totalMatchedRevenue, 0);
    const matchedTransactions = clientRecords.reduce((sum, record) => sum + record.transactionCount, 0);
    const conversionSpans = clientRecords.map((record) => record.client.conversionSpan || 0).filter((value) => value > 0);

    return {
      totalMembers,
      cohortIncluded,
      convertedMembers,
      retainedMembers,
      totalLTV,
      matchedRevenue,
      matchedTransactions,
      avgLTV: totalMembers > 0 ? totalLTV / totalMembers : 0,
      conversionRate: cohortIncluded > 0 ? (convertedMembers / cohortIncluded) * 100 : 0,
      retentionRate: cohortIncluded > 0 ? (retainedMembers / cohortIncluded) * 100 : 0,
      avgConversionSpan: conversionSpans.length > 0 ? conversionSpans.reduce((sum, value) => sum + value, 0) / conversionSpans.length : 0,
    };
  }, [clientRecords]);

  const displayedRecords = React.useMemo(() => {
    const term = search.trim().toLowerCase();

    return clientRecords.filter((record) => {
      const haystack = [
        `${record.client.firstName} ${record.client.lastName}`,
        record.client.email,
        record.client.memberId,
        record.client.isNew,
        record.client.membershipUsed,
        record.client.membershipsBoughtPostTrial,
        record.client.firstVisitLocation,
        record.client.homeLocation,
        record.client.trainerName,
        ...record.memberships,
      ]
        .join(' ')
        .toLowerCase();

      if (term && !haystack.includes(term)) return false;

      switch (quickFilter) {
        case 'eligible':
          return record.cohortIncluded;
        case 'converted':
          return record.conversionIncluded;
        case 'retained':
          return record.retentionIncluded;
        case 'excluded':
          return !record.cohortIncluded;
        case 'highValue':
          return (record.client.ltv || 0) >= (summary.avgLTV || 0);
        case 'newOnly':
          return String(record.client.isNew || '').toLowerCase().includes('new');
        case 'hosted':
          return isHostedEntity(record.client.firstVisitEntityName);
        default:
          return true;
      }
    });
  }, [clientRecords, quickFilter, search, summary.avgLTV]);

  const displayedTransactions = React.useMemo(() => {
    return displayedRecords
      .flatMap((record) =>
        record.transactions.map((transaction) => ({
          transaction,
          clientLabel: `${record.client.firstName} ${record.client.lastName}`.trim() || record.client.email || record.client.memberId,
          clientType: safeText(record.client.isNew),
        }))
      )
      .sort((a, b) => (parseLooseDate(b.transaction.paymentDate)?.getTime() || 0) - (parseLooseDate(a.transaction.paymentDate)?.getTime() || 0));
  }, [displayedRecords]);

  const scopeBadges = React.useMemo(() => getScopeBadges(payload, type), [payload, type]);
  const topMemberships = React.useMemo(() => buildDistribution(clientRecords.flatMap((record) => record.memberships)), [clientRecords]);
  const topLocations = React.useMemo(() => buildDistribution(clientRecords.map((record) => record.client.firstVisitLocation || record.client.homeLocation || 'Unknown')), [clientRecords]);
  const topTrainers = React.useMemo(() => buildDistribution(clientRecords.map((record) => record.client.trainerName || 'Unknown')), [clientRecords]);

  const suggestions = React.useMemo(() => {
    const notes: string[] = [];
    const excludedCount = clientRecords.filter((record) => !record.cohortIncluded).length;
    const missingTransactionMatches = clientRecords.filter((record) => record.conversionIncluded && record.transactionCount === 0).length;
    const blankMemberships = clientRecords.filter((record) => record.memberships.length === 0).length;

    if (excludedCount > 0) {
      notes.push(`${formatNumber(excludedCount)} client(s) are outside the conversion denominator because the isNew label is not clearly marked as a new-client value.`);
    }
    if (missingTransactionMatches > 0) {
      notes.push(`${formatNumber(missingTransactionMatches)} converted client(s) do not have matched transaction evidence in the sales dataset, so the join between retention and sales could be tightened.`);
    }
    if (blankMemberships > 0) {
      notes.push(`${formatNumber(blankMemberships)} client(s) have no clear membership trail, which makes product-level interpretation weaker than it should be.`);
    }
    if (notes.length === 0) {
      notes.push('This slice is relatively clean. The next best improvement would be storing a dedicated source conversion reason so the modal can explain outcomes without inference.');
    }

    return notes;
  }, [clientRecords]);

  const toggleExpandedClient = (key: string) => {
    setExpandedClientKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('clients');
      setExpandedClientKeys([]);
    }
  }, [isOpen]);

  const copyEmails = React.useCallback(() => {
    const emails = uniqBy(
      displayedRecords.map((record) => safeText(record.client.email, '')).filter(Boolean),
      (email) => email.toLowerCase()
    );
    if (emails.length === 0) return;
    navigator.clipboard.writeText(emails.join(', '));
  }, [displayedRecords]);

  const exportClients = React.useCallback(() => {
    const csv = buildCsv(
      [
        'Client Name',
        'Email',
        'Member ID',
        'First Visit Date',
        'Membership Used',
        'Payment Method',
        'Entity Name',
        'First Purchase Made',
        'No. of Purchases',
        'First Purchase Date',
        'Total LTV',
        'Memberships Purchased',
        'Conversion Span',
        'Conversion Status',
        'No. of Visits',
        'Retention Status',
        'Visits Post Trial',
        'Second Visit Date',
        'Visit Location',
        'Home Location',
        'Trainer',
        'Matched Transactions',
        'Matched Revenue',
        'Cohort Status',
        'Cohort Reason',
        'Conversion Reason',
        'Retention Reason',
      ],
      displayedRecords.map((record) => [
        `${record.client.firstName} ${record.client.lastName}`.trim(),
        record.client.email || '',
        record.client.memberId || '',
        record.client.firstVisitDate || '',
        record.client.membershipUsed || '',
        record.client.paymentMethod || '',
        record.client.firstVisitEntityName || '',
        record.firstPurchaseItem,
        record.client.purchaseCountPostTrial || 0,
        record.firstPurchaseDate,
        record.client.ltv || 0,
        record.orderedMembershipPurchases,
        record.client.conversionSpan || 0,
        record.client.conversionStatus || '',
        record.recordedVisits,
        record.client.retentionStatus || '',
        record.client.visitsPostTrial || 0,
        record.secondVisitDate,
        record.client.firstVisitLocation || '',
        record.client.homeLocation || '',
        record.client.trainerName || '',
        record.transactionCount,
        record.totalMatchedRevenue,
        record.cohortIncluded ? 'Included' : 'Excluded',
        record.cohortReason,
        record.conversionReason,
        record.retentionReason,
      ])
    );

    downloadCsv(`${title.replace(/\s+/g, '-').toLowerCase()}-clients.csv`, csv);
  }, [displayedRecords, title]);

  const exportTransactions = React.useCallback(() => {
    const csv = buildCsv(
      [
        'Client',
        'Client Type',
        'Payment Date',
        'Item',
        'Membership',
        'Payment Method',
        'Location',
        'Sold By',
        'Payment Status',
        'Transaction Value',
      ],
      displayedTransactions.map(({ transaction, clientLabel, clientType }) => [
        clientLabel,
        clientType,
        transaction.paymentDate || '',
        transaction.paymentItem || '',
        transaction.membershipType || '',
        transaction.paymentMethod || '',
        transaction.calculatedLocation || '',
        transaction.soldBy || '',
        transaction.paymentStatus || '',
        transaction.paymentValue || 0,
      ])
    );

    downloadCsv(`${title.replace(/\s+/g, '-').toLowerCase()}-transactions.csv`, csv);
  }, [displayedTransactions, title]);

  const exportSummary = React.useCallback(() => {
    const csv = buildCsv(
      ['Metric', 'Value'],
      [
        ['Clients in slice', summary.totalMembers],
        ['Clients displayed', displayedRecords.length],
        ['Conversion cohort', summary.cohortIncluded],
        ['Converted', summary.convertedMembers],
        ['Retained', summary.retainedMembers],
        ['Conversion rate', `${summary.conversionRate.toFixed(1)}%`],
        ['Retention rate', `${summary.retentionRate.toFixed(1)}%`],
        ['Average LTV', formatCurrency(summary.avgLTV)],
        ['Total LTV', formatCurrency(summary.totalLTV)],
        ['Matched transactions', summary.matchedTransactions],
        ['Matched revenue', formatCurrency(summary.matchedRevenue)],
      ]
    );

    downloadCsv(`${title.replace(/\s+/g, '-').toLowerCase()}-summary.csv`, csv);
  }, [displayedRecords.length, summary, title]);

  const exportCurrentTab = React.useCallback(() => {
    if (activeTab === 'clients') {
      exportClients();
      return;
    }
    if (activeTab === 'transactions') {
      exportTransactions();
      return;
    }
    exportSummary();
  }, [activeTab, exportClients, exportSummary, exportTransactions]);

  if (!hasData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[95vh] w-[96vw] max-w-[1680px] overflow-hidden border-0 bg-transparent p-0 shadow-none">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/60">
          <DialogHeader className="border-b border-slate-200 bg-white px-8 py-6 text-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 shadow-sm">
                    <BarChart3 className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Retention drill-down
                    </div>
                    <DialogTitle className="text-[26px] font-semibold tracking-tight text-slate-950">{title}</DialogTitle>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      A cleaner, more structured drill-down with direct client fields, clear supporting logic, and export-ready transaction evidence.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {scopeBadges.map((badge) => (
                    <span key={badge}>{badge}</span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" className="rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50" onClick={exportCurrentTab}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export current view
                </Button>
                <Button size="sm" className="rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50" onClick={copyEmails}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy emails
                </Button>
                <Button size="icon" variant="ghost" className="rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50 px-8 py-6">
            <div className="mb-5 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {[
                { label: 'Clients in slice', value: formatNumber(summary.totalMembers), helper: `${formatNumber(displayedRecords.length)} shown`, icon: Users },
                { label: 'Conversion cohort', value: formatNumber(summary.cohortIncluded), helper: `${formatNumber(summary.totalMembers - summary.cohortIncluded)} excluded`, icon: Target },
                { label: 'Converted', value: formatNumber(summary.convertedMembers), helper: `${summary.conversionRate.toFixed(1)}% of eligible`, icon: TrendingUp },
                { label: 'Retained', value: formatNumber(summary.retainedMembers), helper: `${summary.retentionRate.toFixed(1)}% of eligible`, icon: ListChecks },
                { label: 'Matched transactions', value: formatNumber(summary.matchedTransactions), helper: formatCurrency(summary.matchedRevenue), icon: ShoppingBag },
                { label: 'Average LTV', value: formatCurrency(summary.avgLTV), helper: summary.avgConversionSpan > 0 ? `${summary.avgConversionSpan.toFixed(1)} avg conv days` : 'No conversion span data', icon: CreditCard },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <Card key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 shadow-none">
                    <CardContent className="flex h-full flex-col gap-2 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">{card.label}</span>
                      </div>
                      <div className="text-2xl font-semibold text-slate-950">{card.value}</div>
                      <div className="text-xs text-slate-500">{card.helper}</div>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ModalTabKey)} className="w-full">
              <TabsList className="grid h-12 w-full grid-cols-4 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                {[
                  ['overview', 'Overview'],
                  ['clients', 'Client table'],
                  ['transactions', 'Transactions'],
                  ['methodology', 'Methodology'],
                ].map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="rounded-xl border border-transparent bg-transparent text-sm font-semibold text-slate-600 transition-all shadow-none before:hidden hover:bg-slate-50 hover:text-slate-900 data-[state=active]:border-slate-950 data-[state=active]:bg-slate-950 data-[state=active]:bg-none data-[state=active]:from-transparent data-[state=active]:via-transparent data-[state=active]:to-transparent data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:shadow-slate-950/20 data-[state=active]:scale-100 data-[state=active]:translate-y-0"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
                  <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                        <Sparkles className="h-5 w-5 text-slate-700" />
                        Better organised segment summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <ShoppingBag className="h-4 w-4 text-slate-700" />
                          Membership mix
                        </div>
                        <div className="space-y-2">
                          {topMemberships.length > 0 ? topMemberships.map(([label, count]) => (
                            <div key={label} className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate text-slate-700">{label}</span>
                              <span className="text-xs font-medium text-slate-500">{formatNumber(count)}</span>
                            </div>
                          )) : <p className="text-sm text-slate-500">No membership data available.</p>}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <MapPin className="h-4 w-4 text-slate-700" />
                          Top locations
                        </div>
                        <div className="space-y-2">
                          {topLocations.map(([label, count]) => (
                            <div key={label} className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate text-slate-700">{label}</span>
                              <span className="text-xs font-medium text-slate-500">{formatNumber(count)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <UserRound className="h-4 w-4 text-slate-700" />
                          Trainer touchpoints
                        </div>
                        <div className="space-y-2">
                          {topTrainers.map(([label, count]) => (
                            <div key={label} className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate text-slate-700">{label}</span>
                              <span className="text-xs font-medium text-slate-500">{formatNumber(count)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                        <Filter className="h-5 w-5 text-slate-700" />
                        Inclusion logic at a glance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        New-client eligibility is driven by <code className="rounded bg-white px-1 py-0.5 text-xs">isNew</code>. Converted and retained counts follow the explicit source statuses, and each client row now shows the reason for being included or excluded.
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <div className="text-2xl font-semibold text-emerald-700">{formatNumber(summary.cohortIncluded)}</div>
                          <div className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">Included in denominator</div>
                        </div>
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <div className="text-2xl font-semibold text-amber-700">{formatNumber(summary.totalMembers - summary.cohortIncluded)}</div>
                          <div className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">Excluded from denominator</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-2xl font-semibold text-slate-900">{formatNumber(summary.matchedTransactions)}</div>
                          <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Matched transactions</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl border border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle className="text-lg text-slate-900">Suggestions to improve data clarity</CardTitle>
                      <Button size="sm" variant="outline" className={toolbarButtonClass} onClick={exportSummary}>
                        <Download className="mr-2 h-4 w-4" />
                        Export summary
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-6">
                    {suggestions.map((suggestion) => (
                      <div key={suggestion} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        {suggestion}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clients" className="mt-6 space-y-5">
                <Card className="rounded-2xl border border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div className="space-y-2">
                        <CardTitle className="text-lg text-slate-900">Client details in tabular form</CardTitle>
                          <p className="text-sm text-slate-500">Key client, purchase, visit, and retention fields are surfaced directly in columns. Expand a row for reasoning support and transaction evidence.</p>
                        </div>
                        <div className="text-sm text-slate-500 xl:text-right">
                          Showing <span className="font-semibold text-slate-900">{formatNumber(displayedRecords.length)}</span> clients • <span className="font-semibold text-slate-900">{formatNumber(displayedTransactions.length)}</span> matched transactions • {quickFilter === 'all' ? 'All visible clients' : quickFilter}
                        </div>
                      </div>
                      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px_auto]">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {([
                              ['all', 'All'],
                              ['newOnly', 'New'],
                              ['hosted', 'Hosted'],
                              ['eligible', 'Eligible'],
                              ['converted', 'Converted'],
                              ['retained', 'Retained'],
                              ['excluded', 'Excluded'],
                              ['highValue', 'High Value'],
                            ] as Array<[QuickFilterKey, string]>).map(([value, label]) => (
                              <Button
                                key={value}
                                size="sm"
                                variant={quickFilter === value ? 'default' : 'outline'}
                                onClick={() => setQuickFilter(value)}
                                className={quickFilter === value ? 'rounded-xl border border-slate-900 bg-slate-950 text-white hover:bg-slate-900' : toolbarButtonClass}
                              >
                                {label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="relative min-w-[280px]">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search client, membership, trainer, location"
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                          />
                        </div>
                        </div>
                        <div className="flex items-end justify-start xl:justify-end">
                        <Button size="sm" variant="outline" className={toolbarButtonClass} onClick={exportClients}>
                          <Download className="mr-2 h-4 w-4" />
                          Export clients
                        </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                    <div className="max-h-[62vh] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 z-20 bg-slate-950">
                          <TableRow className="border-slate-800 bg-slate-950 hover:bg-slate-950">
                            <TableHead className="w-[60px] text-center text-xs font-semibold uppercase tracking-wide text-white">View</TableHead>
                            <TableHead className="min-w-[220px] text-xs font-semibold uppercase tracking-wide text-white">Client name</TableHead>
                            <TableHead className="min-w-[220px] text-xs font-semibold uppercase tracking-wide text-white">Email</TableHead>
                            <TableHead className="min-w-[130px] text-xs font-semibold uppercase tracking-wide text-white">First visit</TableHead>
                            <TableHead className="min-w-[160px] text-xs font-semibold uppercase tracking-wide text-white">Membership used</TableHead>
                            <TableHead className="min-w-[140px] text-xs font-semibold uppercase tracking-wide text-white">Payment method</TableHead>
                            <TableHead className="min-w-[180px] text-xs font-semibold uppercase tracking-wide text-white">Entity name</TableHead>
                            <TableHead className="min-w-[180px] text-xs font-semibold uppercase tracking-wide text-white">First purchase made</TableHead>
                            <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-white">Purchases</TableHead>
                            <TableHead className="min-w-[130px] text-xs font-semibold uppercase tracking-wide text-white">First purchase date</TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-white">Total LTV</TableHead>
                            <TableHead className="min-w-[220px] text-xs font-semibold uppercase tracking-wide text-white">Memberships purchased</TableHead>
                            <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-white">Conv span</TableHead>
                            <TableHead className="min-w-[130px] text-xs font-semibold uppercase tracking-wide text-white">Conversion status</TableHead>
                            <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-white">No. of visits</TableHead>
                            <TableHead className="min-w-[130px] text-xs font-semibold uppercase tracking-wide text-white">Retention status</TableHead>
                            <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-white">Visits post trial</TableHead>
                            <TableHead className="min-w-[170px] text-xs font-semibold uppercase tracking-wide text-white">Second visit date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedRecords.map((record) => {
                            const client = record.client;
                            const clientKey = getClientKey(client);
                            const expanded = expandedClientKeys.includes(clientKey);
                            return (
                              <React.Fragment key={clientKey}>
                                <TableRow className="border-b border-slate-100 bg-white align-top odd:bg-white even:bg-slate-50/45 hover:bg-slate-50">
                                  <TableCell className="text-center align-top">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-900"
                                      onClick={() => toggleExpandedClient(clientKey)}
                                    >
                                      {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="space-y-2">
                                      <div className="font-semibold text-slate-900">{client.firstName} {client.lastName}</div>
                                      <div className="space-y-0.5 text-xs text-slate-500">
                                        <div>ID {safeText(client.memberId, 'n/a')}</div>
                                        <div>{record.cohortIncluded ? 'Eligible for cohort' : 'Excluded from cohort'}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="text-sm text-slate-700">{safeText(client.email, 'No email')}</div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="space-y-1 text-sm text-slate-700">
                                      <div>{safeText(client.firstVisitDate, 'Unknown')}</div>
                                      <div className="text-xs text-slate-500">{safeText(client.firstVisitLocation, 'No visit location')}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top text-sm text-slate-700">{safeText(client.membershipUsed, 'Not captured')}</TableCell>
                                  <TableCell className="align-top">
                                    <div className="text-sm text-slate-700">{safeText(client.paymentMethod, 'Not captured')}</div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="space-y-1 text-sm text-slate-700">
                                      <div>{safeText(client.firstVisitEntityName, 'Unknown')}</div>
                                      {isHostedEntity(client.firstVisitEntityName) && (
                                        <div className="text-xs text-slate-500">Hosted source</div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="text-sm text-slate-700">{record.firstPurchaseItem}</div>
                                  </TableCell>
                                  <TableCell className="align-top text-center font-medium text-slate-800">{formatNumber(client.purchaseCountPostTrial || 0)}</TableCell>
                                  <TableCell className="align-top"><div className="text-sm text-slate-700">{record.firstPurchaseDate}</div></TableCell>
                                  <TableCell className="align-top text-right font-semibold text-slate-900">{formatCurrency(client.ltv || 0)}</TableCell>
                                  <TableCell className="align-top">
                                    <div className="max-w-[220px] whitespace-normal text-sm leading-5 text-slate-700">{record.orderedMembershipPurchases}</div>
                                  </TableCell>
                                  <TableCell className="align-top text-center font-medium text-slate-800">{client.conversionSpan > 0 ? `${client.conversionSpan} days` : 'N/A'}</TableCell>
                                  <TableCell className="align-top">
                                    <div className="text-sm font-medium text-slate-800">
                                      {safeText(client.conversionStatus, record.conversionIncluded ? 'Converted' : 'Not converted')}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      {record.conversionIncluded ? 'Included in conversion results' : 'Not counted in conversion results'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top text-center font-medium text-slate-800">{formatNumber(record.recordedVisits)}</TableCell>
                                  <TableCell className="align-top">
                                    <div className="text-sm font-medium text-slate-800">
                                      {safeText(client.retentionStatus, record.retentionIncluded ? 'Retained' : 'Not retained')}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      {record.retentionIncluded ? 'Included in retention results' : 'Not counted in retention results'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top text-center font-medium text-slate-800">{formatNumber(client.visitsPostTrial || 0)}</TableCell>
                                  <TableCell className="align-top"><div className="max-w-[170px] whitespace-normal text-sm leading-5 text-slate-700">{record.secondVisitDate}</div></TableCell>
                                </TableRow>
                                {expanded && (
                                  <TableRow className="bg-slate-100/70 hover:bg-slate-100/70">
                                    <TableCell colSpan={18} className="px-5 py-4">
                                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                        <div className="grid gap-0 xl:grid-cols-[1.15fr_1fr_1.15fr]">
                                        <div className="border-b border-slate-200 p-4 xl:border-b-0 xl:border-r">
                                          <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Client context</div>
                                            <div className="text-xs text-slate-500">{formatNumber(record.transactionCount)} matched txn</div>
                                          </div>
                                          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                                            <div>First visit <span className="font-medium text-slate-900">{safeText(client.firstVisitDate, 'Unknown')}</span></div>
                                            <div>First purchase date <span className="font-medium text-slate-900">{record.firstPurchaseDate}</span></div>
                                            <div>First purchase made <span className="font-medium text-slate-900">{record.firstPurchaseItem}</span></div>
                                            <div>Membership used <span className="font-medium text-slate-900">{safeText(client.membershipUsed, 'Not captured')}</span></div>
                                            <div>Visit location <span className="font-medium text-slate-900">{safeText(client.firstVisitLocation)}</span></div>
                                            <div>Home location <span className="font-medium text-slate-900">{safeText(client.homeLocation)}</span></div>
                                            <div>Trial entity <span className="font-medium text-slate-900">{safeText(client.firstVisitEntityName)}</span></div>
                                            <div>Trainer <span className="font-medium text-slate-900">{safeText(client.trainerName)}</span></div>
                                            <div>Payment method <span className="font-medium text-slate-900">{safeText(client.paymentMethod)}</span></div>
                                            <div>Recorded visits <span className="font-medium text-slate-900">{formatNumber(record.recordedVisits)}</span></div>
                                            <div>Visits post trial <span className="font-medium text-slate-900">{formatNumber(client.visitsPostTrial || 0)}</span></div>
                                            <div>Purchases post trial <span className="font-medium text-slate-900">{formatNumber(client.purchaseCountPostTrial || 0)}</span></div>
                                            <div>Memberships purchased <span className="font-medium text-slate-900">{record.orderedMembershipPurchases}</span></div>
                                            <div>Conversion span <span className="font-medium text-slate-900">{client.conversionSpan > 0 ? `${client.conversionSpan} days` : 'N/A'}</span></div>
                                            <div>Second visit date <span className="font-medium text-slate-900">{record.secondVisitDate}</span></div>
                                          </div>
                                        </div>

                                        <div className="border-b border-slate-200 p-4 xl:border-b-0 xl:border-r">
                                          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reason support</div>
                                          <div className="space-y-3 text-sm text-slate-700">
                                            <div>
                                              <div className="font-medium text-slate-900">Cohort</div>
                                              <div className="mt-1 text-slate-600">{record.cohortReason}</div>
                                            </div>
                                            <div className="border-t border-slate-200 pt-3">
                                              <div className="font-medium text-slate-900">Conversion</div>
                                              <div className="mt-1 text-slate-600">{record.conversionReason}</div>
                                            </div>
                                            <div className="border-t border-slate-200 pt-3">
                                              <div className="font-medium text-slate-900">Retention</div>
                                              <div className="mt-1 text-slate-600">{record.retentionReason}</div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="p-4">
                                          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Transaction evidence</div>
                                          {record.transactions.length > 0 ? (
                                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                              <Table>
                                                <TableHeader>
                                                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Date</TableHead>
                                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Item</TableHead>
                                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Method</TableHead>
                                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Location</TableHead>
                                                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-slate-600">Value</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {record.transactions.slice(0, 4).map((transaction) => (
                                                    <TableRow key={[transaction.paymentTransactionId, transaction.saleItemId, transaction.paymentDate].join('__')}>
                                                      <TableCell className="text-xs text-slate-700">{safeText(transaction.paymentDate, 'Unknown')}</TableCell>
                                                      <TableCell className="text-xs text-slate-700">{safeText(transaction.membershipType || transaction.paymentItem)}</TableCell>
                                                      <TableCell className="text-xs text-slate-700">{safeText(transaction.paymentMethod)}</TableCell>
                                                      <TableCell className="text-xs text-slate-700">{safeText(transaction.calculatedLocation)}</TableCell>
                                                      <TableCell className="text-right text-xs font-semibold text-slate-900">{formatCurrency(transaction.paymentValue || 0)}</TableCell>
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                              {record.transactions.length > 4 && (
                                                <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                                  Showing the first 4 matched transactions here. Use the Transactions tab for the full evidence list.
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                              No matched sales transactions were found for this client. The sheet-level retention record is still shown, but the evidence trail is incomplete.
                                            </div>
                                          )}
                                        </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })}
                          {displayedRecords.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={18} className="py-12 text-center text-sm text-slate-500">
                                No clients match the current filter. Try another filter or search term.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="mt-6">
                <Card className="rounded-2xl border border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg text-slate-900">Matched transaction evidence</CardTitle>
                        <p className="mt-1 text-sm text-slate-500">Exportable transaction-level support for the selected drill-down slice.</p>
                      </div>
                      <Button size="sm" variant="outline" className={toolbarButtonClass} onClick={exportTransactions}>
                        <Download className="mr-2 h-4 w-4" />
                        Export transactions
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[62vh] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 z-20 bg-slate-950">
                          <TableRow className="border-slate-800 bg-slate-950 hover:bg-slate-950">
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-white">Client</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-white">Type</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-white">Payment date</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-white">Item</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-white">Membership</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-white">Method</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-white">Location</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-white">Sold by</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-white">Status</TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-white">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedTransactions.length > 0 ? displayedTransactions.map(({ transaction, clientLabel, clientType }) => (
                            <TableRow key={[clientLabel, transaction.paymentTransactionId, transaction.saleItemId, transaction.paymentDate].join('__')} className="border-b border-slate-100 hover:bg-slate-50">
                              <TableCell className="text-sm font-medium text-slate-900">{clientLabel}</TableCell>
                              <TableCell className="text-sm text-slate-700">{clientType}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.paymentDate, 'Unknown')}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.paymentItem)}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.membershipType)}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.paymentMethod)}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.calculatedLocation)}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.soldBy)}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.paymentStatus)}</TableCell>
                              <TableCell className="text-right text-sm font-semibold text-slate-900">{formatCurrency(transaction.paymentValue || 0)}</TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={10} className="py-12 text-center text-sm text-slate-500">
                                No matched transactions are available for the currently filtered clients.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="methodology" className="mt-6 space-y-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <CardTitle className="text-lg text-slate-900">How this drill-down decides inclusion</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-6 text-sm text-slate-700">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="font-semibold text-slate-900">Conversion denominator</div>
                        <p className="mt-1">A client is included only when <code className="rounded bg-white px-1 py-0.5 text-xs">isNew</code> contains “new”. Everyone else stays visible with an explicit exclusion reason.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="font-semibold text-slate-900">Conversion numerator</div>
                        <p className="mt-1">A client is counted as converted when <code className="rounded bg-white px-1 py-0.5 text-xs">conversionStatus</code> is exactly “Converted”. Transaction matches are supporting evidence, not a replacement for the source flag.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="font-semibold text-slate-900">Retention numerator</div>
                        <p className="mt-1">A client is counted as retained when they are part of the new-client cohort and <code className="rounded bg-white px-1 py-0.5 text-xs">retentionStatus</code> is exactly “Retained”. A matching <code className="rounded bg-white px-1 py-0.5 text-xs">conversionStatus</code> is not required for retention.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <CardTitle className="text-lg text-slate-900">Recommended data improvements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-6 text-sm text-slate-700">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="font-semibold text-slate-900">1. Normalize isNew values</div>
                        <p className="mt-1">Use one controlled set of labels for new-client status so exclusions are clearly intentional.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="font-semibold text-slate-900">2. Add an explicit source conversion reason</div>
                        <p className="mt-1">A dedicated field such as “converted via membership / package / unknown” would make this drill-down more precise.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="font-semibold text-slate-900">3. Keep a stable member key across datasets</div>
                        <p className="mt-1">Consistent IDs between retention and sales would improve transaction evidence matching and reduce unexplained gaps.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientConversionDrillDownModalV3;
