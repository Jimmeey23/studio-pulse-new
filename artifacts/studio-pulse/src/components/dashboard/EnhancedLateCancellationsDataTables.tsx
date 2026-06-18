import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LateCancellationsData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { ListFilter } from 'lucide-react';

interface EnhancedLateCancellationsDataTablesProps {
  data: LateCancellationsData[];
  allCheckins?: any[];
  onDrillDown?: (data: any) => void;
}

type TableView = 'lead-time' | 'events' | 'memberships' | 'locations' | 'repeat-members' | 'records';

export const EnhancedLateCancellationsDataTables: React.FC<EnhancedLateCancellationsDataTablesProps> = ({ data, onDrillDown }) => {
  const [activeTab, setActiveTab] = useState<TableView>('lead-time');

  const tables = useMemo(() => {
    const buildSummary = (labelGetter: (item: LateCancellationsData) => string, labelKey: string) => {
      const groups = data.reduce((acc, item) => {
        const key = labelGetter(item) || 'Unknown';
        if (!acc[key]) {
          acc[key] = {
            label: key,
            count: 0,
            penalty: 0,
            members: new Set<string>(),
            totalLeadHours: 0,
            leadRows: 0,
            records: [] as LateCancellationsData[],
          };
        }

        acc[key].count += 1;
        acc[key].penalty += item.chargedPenaltyAmount || 0;
        if (item.memberId || item.email) acc[key].members.add(item.memberId || item.email || '');
        if (typeof item.timeBeforeClassHours === 'number') {
          acc[key].totalLeadHours += item.timeBeforeClassHours;
          acc[key].leadRows += 1;
        }
        acc[key].records.push(item);
        return acc;
      }, {} as Record<string, any>);

      return Object.values(groups)
        .map((group: any) => ({
          [labelKey]: group.label,
          cancellations: group.count,
          members: group.members.size,
          avgLeadHours: group.leadRows ? group.totalLeadHours / group.leadRows : 0,
          penalties: group.penalty,
          share: data.length ? (group.count / data.length) * 100 : 0,
          records: group.records,
        }))
        .sort((a: any, b: any) => b.cancellations - a.cancellations);
    };

    const repeatMembers = buildSummary(
      (item) => item.customerName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
      'member'
    ).filter((row: any) => row.cancellations > 1);

    const records = [...data]
      .sort((a, b) => (b.cancelledDateTimeISO || '').localeCompare(a.cancelledDateTimeISO || ''))
      .slice(0, 100)
      .map((item) => ({
        event: item.cleanedClass || item.cancelledEvent || 'Unknown',
        member: item.customerName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
        location: item.location || 'Unknown',
        membership: item.cleanedProduct || 'Unknown',
        cancelledAt: item.cancelledDateIST || '—',
        sessionAt: item.sessionDateIST || item.dateIST || '—',
        leadTime: typeof item.timeBeforeClassHours === 'number' ? `${item.timeBeforeClassHours.toFixed(1)} hrs` : '—',
        penalty: item.chargedPenaltyAmount || 0,
        raw: item,
      }));

    return {
      leadTime: buildSummary((item) => item.cancellationWindow || 'Unknown', 'window'),
      events: buildSummary((item) => item.cleanedClass || item.cancelledEvent || 'Unknown', 'event'),
      memberships: buildSummary((item) => item.cleanedProduct || 'Unknown', 'membership'),
      locations: buildSummary((item) => item.location || 'Unknown', 'location'),
      repeatMembers,
      records,
    };
  }, [data]);

  const renderTable = (rows: any[], columns: Array<{ key: string; label: string; format?: (value: any) => React.ReactNode }>) => (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className="font-semibold text-slate-700">{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row: any, index: number) => (
            <TableRow key={index} className="cursor-pointer hover:bg-red-50/40" onClick={() => onDrillDown?.({
              title: row.window || row.event || row.membership || row.location || row.member || 'Late cancellation details',
              records: row.records || (row.raw ? [row.raw] : []),
              summary: row,
            })}>
              {columns.map((column) => (
                <TableCell key={column.key} className="align-top">
                  {column.format ? column.format(row[column.key]) : row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (!data.length) {
    return (
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="flex h-56 items-center justify-center text-slate-500">
          No detailed late cancellation data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ListFilter className="h-5 w-5 text-red-600" />
            Detailed Cancellation Tables
          </CardTitle>
          <p className="mt-2 text-sm text-slate-600">Use these deeper cuts to understand lead-time behavior, repeat cancellers, penalties, and the events driving the most churn risk.</p>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TableView)}>
          <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-2 lg:grid-cols-6">
            <TabsTrigger value="lead-time" className="rounded-xl data-[state=active]:bg-white">Lead Time</TabsTrigger>
            <TabsTrigger value="events" className="rounded-xl data-[state=active]:bg-white">Events</TabsTrigger>
            <TabsTrigger value="memberships" className="rounded-xl data-[state=active]:bg-white">Memberships</TabsTrigger>
            <TabsTrigger value="locations" className="rounded-xl data-[state=active]:bg-white">Locations</TabsTrigger>
            <TabsTrigger value="repeat-members" className="rounded-xl data-[state=active]:bg-white">Repeat Members</TabsTrigger>
            <TabsTrigger value="records" className="rounded-xl data-[state=active]:bg-white">Recent Records</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {activeTab === 'lead-time' && renderTable(tables.leadTime, [
          { key: 'window', label: 'Lead-Time Window' },
          { key: 'cancellations', label: 'Late Cancellations', format: (value) => <Badge variant="outline">{formatNumber(value)}</Badge> },
          { key: 'members', label: 'Members', format: formatNumber },
          { key: 'share', label: 'Share', format: (value) => formatPercentage(value) },
          { key: 'avgLeadHours', label: 'Avg Lead Time', format: (value) => `${Number(value).toFixed(1)} hrs` },
          { key: 'penalties', label: 'Penalties', format: formatCurrency },
        ])}

        {activeTab === 'events' && renderTable(tables.events.slice(0, 20), [
          { key: 'event', label: 'Cancelled Event' },
          { key: 'cancellations', label: 'Late Cancellations', format: (value) => <Badge variant="outline">{formatNumber(value)}</Badge> },
          { key: 'members', label: 'Members', format: formatNumber },
          { key: 'share', label: 'Share', format: (value) => formatPercentage(value) },
          { key: 'avgLeadHours', label: 'Avg Lead Time', format: (value) => `${Number(value).toFixed(1)} hrs` },
          { key: 'penalties', label: 'Penalties', format: formatCurrency },
        ])}

        {activeTab === 'memberships' && renderTable(tables.memberships.slice(0, 20), [
          { key: 'membership', label: 'Membership' },
          { key: 'cancellations', label: 'Late Cancellations', format: (value) => <Badge variant="outline">{formatNumber(value)}</Badge> },
          { key: 'members', label: 'Members', format: formatNumber },
          { key: 'share', label: 'Share', format: (value) => formatPercentage(value) },
          { key: 'avgLeadHours', label: 'Avg Lead Time', format: (value) => `${Number(value).toFixed(1)} hrs` },
          { key: 'penalties', label: 'Penalties', format: formatCurrency },
        ])}

        {activeTab === 'locations' && renderTable(tables.locations, [
          { key: 'location', label: 'Home Location' },
          { key: 'cancellations', label: 'Late Cancellations', format: (value) => <Badge variant="outline">{formatNumber(value)}</Badge> },
          { key: 'members', label: 'Members', format: formatNumber },
          { key: 'share', label: 'Share', format: (value) => formatPercentage(value) },
          { key: 'avgLeadHours', label: 'Avg Lead Time', format: (value) => `${Number(value).toFixed(1)} hrs` },
          { key: 'penalties', label: 'Penalties', format: formatCurrency },
        ])}

        {activeTab === 'repeat-members' && renderTable(tables.repeatMembers.slice(0, 20), [
          { key: 'member', label: 'Member' },
          { key: 'cancellations', label: 'Late Cancellations', format: (value) => <Badge variant="outline">{formatNumber(value)}</Badge> },
          { key: 'members', label: 'Members', format: formatNumber },
          { key: 'share', label: 'Share', format: (value) => formatPercentage(value) },
          { key: 'avgLeadHours', label: 'Avg Lead Time', format: (value) => `${Number(value).toFixed(1)} hrs` },
          { key: 'penalties', label: 'Penalties', format: formatCurrency },
        ])}

        {activeTab === 'records' && renderTable(tables.records, [
          { key: 'event', label: 'Cancelled Event' },
          { key: 'member', label: 'Member' },
          { key: 'location', label: 'Location' },
          { key: 'membership', label: 'Membership' },
          { key: 'cancelledAt', label: 'Cancelled At' },
          { key: 'sessionAt', label: 'Session At' },
          { key: 'leadTime', label: 'Lead Time' },
          { key: 'penalty', label: 'Penalty', format: formatCurrency },
        ])}
      </CardContent>
    </Card>
  );
};