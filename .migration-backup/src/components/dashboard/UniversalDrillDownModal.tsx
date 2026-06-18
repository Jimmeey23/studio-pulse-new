import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptimizedTable } from '@/components/ui/OptimizedTable';
import { TrendingUp, DollarSign, Users, Target, Eye, X, CalendarRange } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

interface UniversalDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  relatedData: any[];
  type: 'product' | 'category' | 'member' | 'seller' | 'trainer' | 'location' | 'metric' | 'lead' | 'client';
  title: string;
}

type ColAlign = 'left' | 'center' | 'right';
interface Column { key: string; header: string; align: ColAlign; render?: (v: any) => React.ReactNode }

const detectSchema = (item: any): 'sales' | 'session' | 'payroll' | 'expiration' | 'latecancel' | 'client' | 'lead' | 'unknown' => {
  if (!item) return 'unknown';
  if (item.paymentDate || item.paymentItem || item.paymentValue !== undefined) return 'sales';
  if (item.sessionId || (item.date && (item.cleanedClass || item.checkedInCount !== undefined))) return 'session';
  if (item.teacherName && (item.totalSessions !== undefined || item.monthYear)) return 'payroll';
  if (item.endDate && (item.homeLocation || item.expirationDate)) return 'expiration';
  if (item.isSameDayCancellation !== undefined || item.chargedPenaltyAmount !== undefined) return 'latecancel';
  if (item.firstName || item.fullName || item.conversionStatus || item.retentionStatus) return 'client';
  if (item.trialStatus || item.source) return 'lead';
  return 'unknown';
};

const SCHEMA_COLUMNS: Record<string, Column[]> = {
  sales: [
    { key: 'paymentDate', header: 'Date', align: 'center' },
    { key: 'customerName', header: 'Customer', align: 'left' },
    { key: 'paymentItem', header: 'Product', align: 'left' },
    { key: 'cleanedCategory', header: 'Category', align: 'left' },
    { key: 'paymentValue', header: 'Amount', align: 'right', render: (v: number) => formatCurrency(v) },
    { key: 'paymentMethod', header: 'Method', align: 'center' },
    { key: 'soldBy', header: 'Sold By', align: 'left' },
    { key: 'calculatedLocation', header: 'Location', align: 'center' },
  ],
  session: [
    { key: 'date', header: 'Date', align: 'center' },
    { key: 'cleanedClass', header: 'Class', align: 'left' },
    { key: 'instructor', header: 'Instructor', align: 'left' },
    { key: 'checkedInCount', header: 'Attendance', align: 'center', render: (v: number) => formatNumber(v) },
    { key: 'capacity', header: 'Capacity', align: 'center', render: (v: number) => formatNumber(v) },
    { key: 'location', header: 'Location', align: 'center' },
    { key: 'classType', header: 'Format', align: 'center' },
  ],
  payroll: [
    { key: 'teacherName', header: 'Trainer', align: 'left' },
    { key: 'monthYear', header: 'Month', align: 'center' },
    { key: 'location', header: 'Location', align: 'center' },
    { key: 'totalSessions', header: 'Sessions', align: 'center', render: (v: number) => formatNumber(v) },
    { key: 'totalNonEmptySessions', header: 'Active', align: 'center', render: (v: number) => formatNumber(v) },
    { key: 'totalCustomers', header: 'Customers', align: 'center', render: (v: number) => formatNumber(v) },
    { key: 'totalPaid', header: 'Revenue', align: 'right', render: (v: number) => formatCurrency(v) },
    { key: 'new', header: 'New', align: 'center', render: (v: number) => formatNumber(v) },
    { key: 'converted', header: 'Conv', align: 'center', render: (v: number) => formatNumber(v) },
    { key: 'retained', header: 'Ret', align: 'center', render: (v: number) => formatNumber(v) },
  ],
  expiration: [
    { key: 'firstName', header: 'First Name', align: 'left' },
    { key: 'lastName', header: 'Last Name', align: 'left' },
    { key: 'email', header: 'Email', align: 'left' },
    { key: 'endDate', header: 'Expiry Date', align: 'center' },
    { key: 'homeLocation', header: 'Location', align: 'center' },
    { key: 'status', header: 'Status', align: 'center' },
  ],
  latecancel: [
    { key: 'dateIST', header: 'Date', align: 'center' },
    { key: 'customerName', header: 'Customer', align: 'left' },
    { key: 'instructor', header: 'Instructor', align: 'left' },
    { key: 'cleanedClass', header: 'Class', align: 'left' },
    { key: 'location', header: 'Location', align: 'center' },
    { key: 'isSameDayCancellation', header: 'Same Day', align: 'center', render: (v: boolean) => v ? 'Yes' : 'No' },
    { key: 'chargedPenaltyAmount', header: 'Penalty', align: 'right', render: (v: number) => formatCurrency(v || 0) },
  ],
  client: [
    { key: 'firstName', header: 'First Name', align: 'left' },
    { key: 'lastName', header: 'Last Name', align: 'left' },
    { key: 'email', header: 'Email', align: 'left' },
    { key: 'firstVisitDate', header: 'First Visit', align: 'center' },
    { key: 'homeLocation', header: 'Location', align: 'center' },
    { key: 'conversionStatus', header: 'Conversion', align: 'center' },
    { key: 'retentionStatus', header: 'Retention', align: 'center' },
    { key: 'ltv', header: 'LTV', align: 'right', render: (v: number) => formatCurrency(v || 0) },
  ],
  lead: [
    { key: 'firstName', header: 'First Name', align: 'left' },
    { key: 'lastName', header: 'Last Name', align: 'left' },
    { key: 'email', header: 'Email', align: 'left' },
    { key: 'createdAt', header: 'Created', align: 'center' },
    { key: 'source', header: 'Source', align: 'center' },
    { key: 'center', header: 'Location', align: 'center' },
    { key: 'trialStatus', header: 'Trial Status', align: 'center' },
  ],
  unknown: [],
};

export const UniversalDrillDownModal: React.FC<UniversalDrillDownModalProps> = ({
  isOpen,
  onClose,
  data,
  relatedData,
  type,
  title
}) => {
  const contextDescription = data?.contextDescription as string | undefined;

  const filteredData = useMemo(() => {
    if (data?.filteredTransactionData && data.filteredTransactionData.length > 0) {
      return data.filteredTransactionData;
    }
    if (data?.rawData && data.rawData.length > 0) {
      return data.rawData;
    }
    if (!data || !relatedData) return [];

    switch (type) {
      case 'product':
        return relatedData.filter(item =>
          item.paymentItem === data.name || item.cleanedProduct === data.name || item.product === data.name
        );
      case 'category':
        return relatedData.filter(item =>
          item.cleanedCategory === data.name || item.category === data.name
        );
      case 'member':
        return relatedData.filter(item =>
          item.customerName === data.name || item.memberId === data.memberId
        );
      case 'seller':
        return relatedData.filter(item => item.soldBy === data.name);
      case 'trainer':
        return relatedData.filter(item =>
          item.teacherName === data.name || item.Trainer === data.name || item.trainerName === data.name
        );
      case 'location':
        return relatedData.filter(item =>
          item.calculatedLocation === data.name || item.location === data.name || item.center === data.name
        );
      case 'lead':
        return relatedData.filter(item => item.id === data.id || item.memberId === data.memberId);
      case 'client':
        return relatedData.filter(item => item.memberId === data.memberId || item.firstName === data.firstName);
      default:
        return relatedData.slice(0, 200);
    }
  }, [data, relatedData, type]);

  const schema = useMemo(() => detectSchema(filteredData[0]), [filteredData]);

  const columns = useMemo((): Column[] => {
    if (!filteredData.length) return [];
    const all = SCHEMA_COLUMNS[schema] || [];
    // Only include columns where at least one row has a non-null value
    return all.filter(col => filteredData.some(row => row[col.key] !== undefined && row[col.key] !== null && row[col.key] !== ''));
  }, [filteredData, schema]);

  const summaryMetrics = useMemo(() => {
    if (!filteredData.length) return null;
    let totalRevenue = 0;
    let totalTransactions = 0;
    const uniqueCustomers = new Set<string>();

    filteredData.forEach(item => {
      if (item.paymentValue) { totalRevenue += Number(item.paymentValue) || 0; totalTransactions += 1; }
      if (item.totalPaid) totalRevenue += Number(item.totalPaid) || 0;
      if (item.ltv) totalRevenue += Number(item.ltv) || 0;
      if (item.memberId) uniqueCustomers.add(item.memberId);
      if (item.customerName) uniqueCustomers.add(item.customerName);
    });

    return {
      totalRecords: filteredData.length,
      totalRevenue,
      uniqueCustomers: uniqueCustomers.size,
      avgValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
    };
  }, [filteredData]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[95vh] max-w-[86rem] overflow-hidden border border-slate-200 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="secondary" className="w-fit border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-50">
                Drill Down View
              </Badge>
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold leading-tight">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Eye className="h-5 w-5" />
                </span>
                <span>{title}</span>
              </DialogTitle>
              {contextDescription ? (
                <div className="flex items-start gap-2 text-sm text-blue-100/90">
                  <CalendarRange className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{contextDescription}</span>
                </div>
              ) : null}
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 p-2 text-white transition-colors hover:bg-white/10"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-120px)] space-y-6 overflow-y-auto bg-slate-50/70 p-6">
          {summaryMetrics && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="mb-3 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <Target className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-950">{formatNumber(summaryMetrics.totalRecords)}</div>
                  <div className="text-sm text-slate-500">Records</div>
                </CardContent>
              </Card>

              {summaryMetrics.totalRevenue > 0 && (
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="mb-3 flex items-center justify-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <DollarSign className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-950">{formatCurrency(summaryMetrics.totalRevenue)}</div>
                    <div className="text-sm text-slate-500">Total Revenue</div>
                  </CardContent>
                </Card>
              )}

              {summaryMetrics.uniqueCustomers > 0 && (
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="mb-3 flex items-center justify-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-950">{formatNumber(summaryMetrics.uniqueCustomers)}</div>
                    <div className="text-sm text-slate-500">Unique Customers</div>
                  </CardContent>
                </Card>
              )}

              {summaryMetrics.avgValue > 0 && (
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="mb-3 flex items-center justify-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-950">{formatCurrency(summaryMetrics.avgValue)}</div>
                    <div className="text-sm text-slate-500">Avg Transaction</div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-100/80">
              <CardTitle className="flex items-center justify-between text-slate-900">
                <span>{title}</span>
                <Badge variant="secondary" className="border border-blue-200 bg-blue-50 text-blue-800">
                  {filteredData.length} records
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {columns.length > 0 && filteredData.length > 0 ? (
                <OptimizedTable
                  data={filteredData.slice(0, 200)}
                  columns={columns}
                  maxHeight="520px"
                  stickyHeader={true}
                />
              ) : (
                <div className="p-10 text-center text-slate-500">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Target className="h-7 w-7" />
                  </div>
                  <p className="text-lg font-semibold text-slate-700">No data available</p>
                  <p className="mt-1 text-sm">No records match this selection.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
