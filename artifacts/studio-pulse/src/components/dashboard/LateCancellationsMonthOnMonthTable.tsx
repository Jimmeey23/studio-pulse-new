import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LateCancellationsData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { CalendarDays } from 'lucide-react';

interface LateCancellationsMonthOnMonthTableProps {
  data: LateCancellationsData[];
  onRowClick?: (rowData: any) => void;
}

type ViewType = 'monthly' | 'window' | 'event' | 'membership';

export const LateCancellationsMonthOnMonthTable: React.FC<LateCancellationsMonthOnMonthTableProps> = ({ data, onRowClick }) => {
  const [activeView, setActiveView] = useState<ViewType>('monthly');

  const monthlyRows = useMemo(() => {
    const groups = data.reduce((acc, item) => {
      if (!item.dateIST) return acc;
      const date = new Date(item.dateIST);
      if (Number.isNaN(date.getTime())) return acc;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[key]) {
        acc[key] = { key, month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), count: 0, penalties: 0, records: [] as LateCancellationsData[] };
      }
      acc[key].count += 1;
      acc[key].penalties += item.chargedPenaltyAmount || 0;
      acc[key].records.push(item);
      return acc;
    }, {} as Record<string, any>);

    const ordered = Object.values(groups).sort((a: any, b: any) => a.key.localeCompare(b.key));
    return ordered.map((row: any, index: number) => {
      const prev = ordered[index - 1];
      const change = prev ? row.count - prev.count : 0;
      const changePct = prev?.count ? (change / prev.count) * 100 : 0;
      return { ...row, previous: prev?.count || 0, change, changePct };
    }).reverse();
  }, [data]);

  const summaryRows = useMemo(() => {
    const build = (keyGetter: (item: LateCancellationsData) => string, labelKey: string) => {
      const groups = data.reduce((acc, item) => {
        const key = keyGetter(item) || 'Unknown';
        if (!acc[key]) {
          acc[key] = { label: key, count: 0, penalties: 0, members: new Set<string>(), records: [] as LateCancellationsData[] };
        }
        acc[key].count += 1;
        acc[key].penalties += item.chargedPenaltyAmount || 0;
        if (item.memberId || item.email) acc[key].members.add(item.memberId || item.email || '');
        acc[key].records.push(item);
        return acc;
      }, {} as Record<string, any>);

      return Object.values(groups)
        .map((group: any) => ({
          [labelKey]: group.label,
          count: group.count,
          penalties: group.penalties,
          members: group.members.size,
          share: data.length ? (group.count / data.length) * 100 : 0,
          records: group.records,
        }))
        .sort((a: any, b: any) => b.count - a.count);
    };

    return {
      window: build((item) => item.cancellationWindow || 'Unknown', 'window'),
      event: build((item) => item.cleanedClass || item.cancelledEvent || 'Unknown', 'event'),
      membership: build((item) => item.cleanedProduct || 'Unknown', 'membership'),
    };
  }, [data]);

  const renderSummaryTable = (rows: any[], labelKey: string) => (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-semibold text-slate-700">{labelKey}</TableHead>
            <TableHead className="font-semibold text-slate-700">Cancellations</TableHead>
            <TableHead className="font-semibold text-slate-700">Members</TableHead>
            <TableHead className="font-semibold text-slate-700">Share</TableHead>
            <TableHead className="font-semibold text-slate-700">Penalties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 12).map((row: any, index) => (
            <TableRow key={`${labelKey}-${index}`} className="cursor-pointer hover:bg-red-50/40" onClick={() => onRowClick?.({ title: `${String(labelKey).toUpperCase()}: ${row[labelKey]}`, records: row.records, summary: row })}>
              <TableCell className="font-medium text-slate-900">{row[labelKey]}</TableCell>
              <TableCell>{formatNumber(row.count)}</TableCell>
              <TableCell>{formatNumber(row.members)}</TableCell>
              <TableCell>{formatPercentage(row.share)}</TableCell>
              <TableCell>{formatCurrency(row.penalties)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <CalendarDays className="h-5 w-5 text-red-600" />
            Trend & Driver Analysis
          </CardTitle>
          <p className="mt-2 text-sm text-slate-600">Compare month-on-month performance and see which windows, events, and memberships are driving late cancellations.</p>
        </div>
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as ViewType)}>
          <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-2 lg:grid-cols-4">
            <TabsTrigger value="monthly" className="rounded-xl data-[state=active]:bg-white">Monthly</TabsTrigger>
            <TabsTrigger value="window" className="rounded-xl data-[state=active]:bg-white">Lead Time</TabsTrigger>
            <TabsTrigger value="event" className="rounded-xl data-[state=active]:bg-white">Events</TabsTrigger>
            <TabsTrigger value="membership" className="rounded-xl data-[state=active]:bg-white">Memberships</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {activeView === 'monthly' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Month</TableHead>
                  <TableHead className="font-semibold text-slate-700">Late Cancellations</TableHead>
                  <TableHead className="font-semibold text-slate-700">Previous Month</TableHead>
                  <TableHead className="font-semibold text-slate-700">Change</TableHead>
                  <TableHead className="font-semibold text-slate-700">MoM %</TableHead>
                  <TableHead className="font-semibold text-slate-700">Penalties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyRows.map((row: any) => (
                  <TableRow key={row.key} className="cursor-pointer hover:bg-red-50/40" onClick={() => onRowClick?.({ title: `Monthly trend: ${row.month}`, records: row.records, summary: row })}>
                    <TableCell className="font-medium text-slate-900">{row.month}</TableCell>
                    <TableCell><Badge variant="outline">{formatNumber(row.count)}</Badge></TableCell>
                    <TableCell>{formatNumber(row.previous)}</TableCell>
                    <TableCell className={row.change > 0 ? 'text-red-600' : row.change < 0 ? 'text-emerald-600' : 'text-slate-600'}>
                      {row.change > 0 ? '+' : ''}{formatNumber(row.change)}
                    </TableCell>
                    <TableCell>{row.previous ? formatPercentage(row.changePct) : '—'}</TableCell>
                    <TableCell>{formatCurrency(row.penalties)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {activeView === 'window' && renderSummaryTable(summaryRows.window, 'window')}
        {activeView === 'event' && renderSummaryTable(summaryRows.event, 'event')}
        {activeView === 'membership' && renderSummaryTable(summaryRows.membership, 'membership')}
      </CardContent>
    </Card>
  );
};