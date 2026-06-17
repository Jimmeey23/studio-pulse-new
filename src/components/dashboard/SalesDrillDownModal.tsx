import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { BarChart3, DollarSign, ShoppingCart, Users, Target, X, Calendar, Trophy } from 'lucide-react';

interface SalesDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

const humanizeKey = (key: string) =>
  key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (str) => str.toUpperCase());

const summarizeValue = (key: string, value: unknown) => {
  if (value == null || value === '') return 'N/A';
  if (typeof value === 'number') {
    return /revenue|value|amount|atv|auv|asv/i.test(key) ? formatCurrency(value) : formatNumber(value);
  }
  if (Array.isArray(value)) return `${formatNumber(value.length)} records`;
  if (typeof value === 'object') return 'Available in detailed data';
  return String(value);
};

export const SalesDrillDownModal: React.FC<SalesDrillDownModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!data) return null;

  const rawData = data.rawData || data.filteredTransactionData || [];

  const analytics = React.useMemo(() => {
    const totalRevenue = rawData.reduce((sum: number, item: SalesData) => sum + (Number(item.paymentValue) || 0), 0);
    const totalTransactions = rawData.length;
    const uniqueCustomers = new Set(rawData.map((item: SalesData) => item.memberId).filter(Boolean)).size;
    const totalDiscount = rawData.reduce((sum: number, item: SalesData) => sum + (Number(item.discountAmount) || 0), 0);
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const avgRevenuePerCustomer = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;
    const discountRate = totalRevenue > 0 ? (totalDiscount / totalRevenue) * 100 : 0;

    const monthlyData = rawData.reduce((acc: Record<string, { revenue: number; transactions: number; customers: Set<string> }>, item: SalesData) => {
      const month = new Date(item.paymentDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = { revenue: 0, transactions: 0, customers: new Set() };
      }
      acc[month].revenue += Number(item.paymentValue) || 0;
      acc[month].transactions += 1;
      if (item.memberId) acc[month].customers.add(item.memberId);
      return acc;
    }, {});

    const topCustomers = Object.values(
      rawData.reduce((acc: Record<string, { name: string; revenue: number; transactions: number; email: string }>, item: SalesData) => {
        const key = item.customerName || 'Unknown';
        if (!acc[key]) {
          acc[key] = { name: key, revenue: 0, transactions: 0, email: item.customerEmail || 'N/A' };
        }
        acc[key].revenue += Number(item.paymentValue) || 0;
        acc[key].transactions += 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return {
      totalRevenue,
      totalTransactions,
      uniqueCustomers,
      totalDiscount,
      avgTransactionValue,
      avgRevenuePerCustomer,
      discountRate,
      monthlyData: Object.entries(monthlyData)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .map(([month, entry]) => ({
          month,
          revenue: entry.revenue,
          transactions: entry.transactions,
          uniqueCustomers: entry.customers.size,
        })),
      topCustomers,
    };
  }, [rawData]);

  const tableColumns = [
    {
      key: 'customerName',
      header: 'Customer',
      className: 'min-w-[150px]',
      render: (value: string, row: SalesData) => (
        <div>
          <div className="font-semibold text-slate-900">{value || 'N/A'}</div>
          <div className="text-xs text-slate-500">{row.customerEmail || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'cleanedProduct',
      header: 'Product',
      className: 'min-w-[140px]',
      render: (value: string, row: SalesData) => (
        <div>
          <div className="font-medium text-slate-800">{value || row.paymentItem || 'N/A'}</div>
          <Badge variant="outline" className="mt-1 border-slate-200 bg-slate-50 text-slate-600">
            {row.cleanedCategory || 'Uncategorized'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'paymentValue',
      header: 'Amount',
      align: 'right' as const,
      render: (value: number) => <span className="font-semibold text-slate-950">{formatCurrency(value || 0)}</span>,
    },
    {
      key: 'discountAmount',
      header: 'Discount',
      align: 'right' as const,
      render: (value: number) => <span className="text-slate-700">{formatCurrency(value || 0)}</span>,
    },
    {
      key: 'paymentDate',
      header: 'Date',
      align: 'center' as const,
      render: (value: string) => <span className="text-sm text-slate-700">{value ? new Date(value).toLocaleDateString() : 'N/A'}</span>,
    },
    {
      key: 'soldBy',
      header: 'Sold By',
      className: 'min-w-[110px]',
      render: (value: string) => <span className="text-sm text-slate-700">{value || 'N/A'}</span>,
    },
  ];

  const summaryEntries = Object.entries(data).filter(([key]) => !['rawData', 'filteredTransactionData', 'months', 'monthlyValues'].includes(key));

  const statCards = [
    { label: 'Revenue', value: formatCurrency(analytics.totalRevenue), icon: DollarSign, tone: 'bg-blue-100 text-blue-700' },
    { label: 'Transactions', value: formatNumber(analytics.totalTransactions), icon: ShoppingCart, tone: 'bg-slate-100 text-slate-700' },
    { label: 'Unique Members', value: formatNumber(analytics.uniqueCustomers), icon: Users, tone: 'bg-cyan-100 text-cyan-700' },
    { label: 'Avg Transaction', value: formatCurrency(analytics.avgTransactionValue), icon: Target, tone: 'bg-amber-100 text-amber-700' },
    { label: 'Discount Value', value: formatCurrency(analytics.totalDiscount), icon: BarChart3, tone: 'bg-rose-100 text-rose-700' },
    { label: 'Discount %', value: `${analytics.discountRate.toFixed(1)}%`, icon: Trophy, tone: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[95vh] max-w-7xl overflow-hidden border border-slate-200 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="secondary" className="w-fit border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-50">
                Sales Drill Down
              </Badge>
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <span>{data.title || data.name}</span>
              </DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full border border-white/10 text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(95vh-108px)] space-y-6 overflow-y-auto bg-slate-50/70 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {statCards.map(({ label, value, icon: Icon, tone }) => (
              <Card key={label} className="border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  </div>
                  <p className="text-xl font-bold text-slate-950">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-200 bg-slate-100/80">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Calendar className="h-4 w-4" />
                  Monthly performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {analytics.monthlyData.length ? analytics.monthlyData.map((item) => (
                  <div key={item.month} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.month}</p>
                      <p className="text-xs text-slate-500">{formatNumber(item.transactions)} txns · {formatNumber(item.uniqueCustomers)} members</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">{formatCurrency(item.revenue)}</p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No monthly performance available.</p>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-200 bg-slate-100/80">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Users className="h-4 w-4" />
                  Top members in this slice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {analytics.topCustomers.length ? analytics.topCustomers.map((customer, index) => (
                  <div key={`${customer.name}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{customer.name}</p>
                      <p className="truncate text-xs text-slate-500">{customer.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-950">{formatCurrency(customer.revenue)}</p>
                      <p className="text-xs text-slate-500">{formatNumber(customer.transactions)} txns</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No customer distribution available.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-100/80">
              <CardTitle className="flex items-center justify-between text-slate-900">
                <span>Detailed transactions</span>
                <Badge variant="secondary" className="border border-slate-200 bg-white text-slate-700">
                  {formatNumber(rawData.length)} records
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ModernDataTable data={rawData} columns={tableColumns} headerGradient="from-slate-900 via-blue-950 to-slate-900" maxHeight="420px" />
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-100/80">
              <CardTitle className="text-slate-900">Item summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryEntries.map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{humanizeKey(key)}</p>
                    <p className="mt-2 break-words text-sm font-semibold text-slate-900">{summarizeValue(key, value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
