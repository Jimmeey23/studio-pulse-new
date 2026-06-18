import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, ChevronDown, ChevronRight, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { isConvertedInCohort, isInNewClientCohort, isRetainedInCohort } from '@/utils/clientRetention';

interface ClientConversionMembershipTableProps {
  data: NewClientData[];
  onRowClick?: (rowData: any) => void;
}

interface MembershipRow {
  membershipType: string;
  totalMembers: number;
  newMembers: number;
  converted: number;
  retained: number;
  totalLTV: number;
  totalVisits: number;
  conversionSpans: number[];
  clients: NewClientData[];
  conversionRate: number;
  retentionRate: number;
  avgLTV: number;
  avgVisits: number;
  avgConversionSpan: number;
}

interface ChildBreakdownRow {
  label: string;
  totalMembers: number;
  newMembers: number;
  converted: number;
  retained: number;
  conversionRate: number;
  retentionRate: number;
  avgLTV: number;
  totalLTV: number;
  clients: NewClientData[];
}

const buildChildRows = (clients: NewClientData[]) => {
  const byClientType = clients.reduce<Record<string, ChildBreakdownRow>>((acc, client) => {
    const label = client.isNew || 'Unknown';
    if (!acc[label]) {
      acc[label] = {
        label,
        totalMembers: 0,
        newMembers: 0,
        converted: 0,
        retained: 0,
        conversionRate: 0,
        retentionRate: 0,
        avgLTV: 0,
        totalLTV: 0,
        clients: [],
      };
    }
    acc[label].totalMembers += 1;
    if (isInNewClientCohort(client)) acc[label].newMembers += 1;
    if (isConvertedInCohort(client)) acc[label].converted += 1;
    if (isRetainedInCohort(client)) acc[label].retained += 1;
    acc[label].totalLTV += client.ltv || 0;
    acc[label].clients.push(client);
    return acc;
  }, {});

  return Object.values(byClientType)
    .map((row) => ({
      ...row,
      conversionRate: row.newMembers > 0 ? (row.converted / row.newMembers) * 100 : 0,
      retentionRate: row.newMembers > 0 ? (row.retained / row.newMembers) * 100 : 0,
      avgLTV: row.totalMembers > 0 ? row.totalLTV / row.totalMembers : 0,
    }))
    .sort((a, b) => b.totalMembers - a.totalMembers);
};

export const ClientConversionMembershipTable: React.FC<ClientConversionMembershipTableProps> = ({ data, onRowClick }) => {
  const totalsRowStyle: React.CSSProperties = {
    ['--retention-totals-bg' as string]: '#9a3412',
    ['--retention-totals-text' as string]: '#ffffff',
    ['--retention-totals-border' as string]: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: '#9a3412',
    color: '#ffffff',
    borderTopColor: '#c2410c',
  };

  const totalsCellStyle: React.CSSProperties = {
    ['--retention-totals-bg' as string]: '#9a3412',
    ['--retention-totals-text' as string]: '#ffffff',
    ['--retention-totals-border' as string]: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: '#9a3412',
    color: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderTopColor: '#c2410c',
  };

  const [sortField, setSortField] = useState<string>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const membershipData = useMemo<MembershipRow[]>(() => {
    const grouped = data.reduce<Record<string, Omit<MembershipRow, 'conversionRate' | 'retentionRate' | 'avgLTV' | 'avgVisits' | 'avgConversionSpan'>>>((acc, client) => {
      const membership = client.membershipUsed || 'No Membership';
      if (!acc[membership]) {
        acc[membership] = {
          membershipType: membership,
          totalMembers: 0,
          newMembers: 0,
          converted: 0,
          retained: 0,
          totalLTV: 0,
          totalVisits: 0,
          conversionSpans: [],
          clients: [],
        };
      }

      const bucket = acc[membership];
      bucket.totalMembers += 1;
      if (isInNewClientCohort(client)) bucket.newMembers += 1;
      if (isConvertedInCohort(client)) bucket.converted += 1;
      if (isRetainedInCohort(client)) bucket.retained += 1;
      bucket.totalLTV += client.ltv || 0;
      bucket.totalVisits += client.visitsPostTrial || 0;
      if ((client.conversionSpan || 0) > 0) bucket.conversionSpans.push(client.conversionSpan);
      bucket.clients.push(client);
      return acc;
    }, {});

    return Object.values(grouped)
      .map((bucket) => ({
        ...bucket,
        conversionRate: bucket.newMembers > 0 ? (bucket.converted / bucket.newMembers) * 100 : 0,
        retentionRate: bucket.newMembers > 0 ? (bucket.retained / bucket.newMembers) * 100 : 0,
        avgLTV: bucket.totalMembers > 0 ? bucket.totalLTV / bucket.totalMembers : 0,
        avgVisits: bucket.totalMembers > 0 ? bucket.totalVisits / bucket.totalMembers : 0,
        avgConversionSpan:
          bucket.conversionSpans.length > 0
            ? bucket.conversionSpans.reduce((sum, value) => sum + value, 0) / bucket.conversionSpans.length
            : 0,
      }))
      .sort((a, b) => b.totalMembers - a.totalMembers);
  }, [data]);

  const displayedData = useMemo(() => {
    if (!sortField) return membershipData;
    return [...membershipData].sort((a: any, b: any) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'number' && typeof bValue === 'number') return (aValue - bValue) * dir;
      return String(aValue ?? '').localeCompare(String(bValue ?? '')) * dir;
    });
  }, [membershipData, sortDirection, sortField]);

  const totals = useMemo<MembershipRow>(() => {
    const total = membershipData.reduce(
      (acc, row) => ({
        membershipType: 'TOTALS',
        totalMembers: acc.totalMembers + row.totalMembers,
        newMembers: acc.newMembers + row.newMembers,
        converted: acc.converted + row.converted,
        retained: acc.retained + row.retained,
        totalLTV: acc.totalLTV + row.totalLTV,
        totalVisits: acc.totalVisits + row.totalVisits,
        conversionSpans: [...acc.conversionSpans, ...row.conversionSpans],
        clients: [...acc.clients, ...row.clients],
        conversionRate: 0,
        retentionRate: 0,
        avgLTV: 0,
        avgVisits: 0,
        avgConversionSpan: 0,
      }),
      {
        membershipType: 'TOTALS',
        totalMembers: 0,
        newMembers: 0,
        converted: 0,
        retained: 0,
        totalLTV: 0,
        totalVisits: 0,
        conversionSpans: [] as number[],
        clients: [] as NewClientData[],
        conversionRate: 0,
        retentionRate: 0,
        avgLTV: 0,
        avgVisits: 0,
        avgConversionSpan: 0,
      }
    );

    total.conversionRate = total.newMembers > 0 ? (total.converted / total.newMembers) * 100 : 0;
    total.retentionRate = total.newMembers > 0 ? (total.retained / total.newMembers) * 100 : 0;
    total.avgLTV = total.totalMembers > 0 ? total.totalLTV / total.totalMembers : 0;
    total.avgVisits = total.totalMembers > 0 ? total.totalVisits / total.totalMembers : 0;
    total.avgConversionSpan = total.conversionSpans.length > 0
      ? total.conversionSpans.reduce((sum, value) => sum + value, 0) / total.conversionSpans.length
      : 0;

    return total;
  }, [membershipData]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleExpanded = (rowKey: string) => {
    setExpandedRows((current) =>
      current.includes(rowKey) ? current.filter((key) => key !== rowKey) : [...current, rowKey]
    );
  };

  return (
    <Card className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="h-5 w-5" />
          Membership Type Performance Analysis
          <Badge className="border-white/20 bg-white/10 text-white">{displayedData.length} types</Badge>
        </CardTitle>
        <p className="mt-2 text-sm text-slate-300">
          Stronger table styling, clickable totals, and attached child rows showing client-type detail for every membership.
        </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50/90 px-5 py-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Membership rows</div>
            <div className="mt-1 text-2xl font-semibold text-slate-950">{formatNumber(displayedData.length)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total trials</div>
            <div className="mt-1 text-2xl font-semibold text-slate-950">{formatNumber(totals.totalMembers)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total LTV</div>
            <div className="mt-1 text-2xl font-semibold text-slate-950">{formatCurrency(totals.totalLTV)}</div>
          </div>
        </div>
        <div className="max-h-[680px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-slate-950">
              <TableRow className="border-slate-800 bg-slate-950 hover:bg-slate-950">
                <TableHead className="sticky left-0 z-10 min-w-[320px] bg-slate-950 text-xs font-semibold uppercase tracking-wide text-white">Membership Type</TableHead>
                {[
                  ['totalMembers', 'Trials'],
                  ['newMembers', 'New Members'],
                  ['retained', 'Retained'],
                  ['retentionRate', 'Retention %'],
                  ['converted', 'Converted'],
                  ['conversionRate', 'Conversion %'],
                  ['avgLTV', 'Avg LTV'],
                  ['totalLTV', 'Total LTV'],
                ].map(([field, label]) => (
                  <TableHead
                    key={field}
                    onClick={() => handleSort(field)}
                    className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wide text-white"
                  >
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedData.map((row) => {
                const isExpanded = expandedRows.includes(row.membershipType);
                const childRows = buildChildRows(row.clients);
                const topLocations = Array.from(new Set(row.clients.map((client) => client.homeLocation || client.firstVisitLocation).filter(Boolean))).slice(0, 3);

                return (
                  <React.Fragment key={row.membershipType}>
                    <TableRow className="cursor-pointer border-b border-slate-100 bg-white/90 hover:bg-violet-50/40" onClick={() => onRowClick?.(row)}>
                      <TableCell className="sticky left-0 z-10 bg-inherit py-3">
                        <div className="flex items-center gap-3">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpanded(row.membershipType);
                            }}
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                          <div>
                            <div className="font-semibold text-slate-900">{row.membershipType}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                              {topLocations.map((location) => (
                                <Badge key={location} variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
                                  {location}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{formatNumber(row.totalMembers)}</TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{formatNumber(row.newMembers)}</TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{formatNumber(row.retained)}</TableCell>
                      <TableCell className="text-center"><span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">{row.retentionRate.toFixed(1)}%</span></TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{formatNumber(row.converted)}</TableCell>
                      <TableCell className="text-center"><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{row.conversionRate.toFixed(1)}%</span></TableCell>
                      <TableCell className="text-right font-medium text-slate-900">{formatCurrency(row.avgLTV)}</TableCell>
                      <TableCell className="text-right font-medium text-slate-900">{formatCurrency(row.totalLTV)}</TableCell>
                    </TableRow>
                    {isExpanded && (childRows.length > 0 ? childRows.map((child) => (
                      <TableRow
                        key={`${row.membershipType}-${child.label}`}
                        className="cursor-pointer border-b border-orange-100 bg-orange-50/70 hover:bg-orange-100/80"
                        onClick={() => onRowClick?.({
                          membershipType: row.membershipType,
                          rowType: 'clientTypeChild',
                          label: child.label,
                          totalMembers: child.totalMembers,
                          newMembers: child.newMembers,
                          converted: child.converted,
                          retained: child.retained,
                          conversionRate: child.conversionRate,
                          retentionRate: child.retentionRate,
                          avgLTV: child.avgLTV,
                          totalLTV: child.totalLTV,
                          clients: child.clients, 
                        })}
                      >
                        <TableCell className="sticky left-0 z-10 bg-orange-50/70 py-2.5 pl-14">
                          <div className="flex items-start gap-3 text-sm text-slate-700">
                            <Layers3 className="mt-0.5 h-4 w-4 text-orange-600" />
                            <div>
                              <div className="font-semibold text-slate-900">{child.label}</div>
                              <div className="text-xs text-slate-500"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{formatNumber(child.totalMembers)}</TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{formatNumber(child.newMembers)}</TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{formatNumber(child.retained)}</TableCell>
                        <TableCell className="text-center"><span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">{child.retentionRate.toFixed(1)}%</span></TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{formatNumber(child.converted)}</TableCell>
                        <TableCell className="text-center"><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{child.conversionRate.toFixed(1)}%</span></TableCell>
                        <TableCell className="text-right font-medium text-slate-900">{formatCurrency(child.avgLTV)}</TableCell>
                        <TableCell className="text-right font-medium text-slate-900">{formatCurrency(child.totalLTV)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                        <TableCell colSpan={9} className="px-6 py-4 text-sm text-slate-500">
                          No client-type detail available for this membership.
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
              <TableRow className="cursor-pointer border-t-4 border-orange-700" style={totalsRowStyle} onClick={() => onRowClick?.(totals)}>
                <TableCell className="sticky left-0 z-10 py-3 font-semibold" style={totalsCellStyle}>TOTALS</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{formatNumber(totals.totalMembers)}</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{formatNumber(totals.newMembers)}</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{formatNumber(totals.retained)}</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{totals.retentionRate.toFixed(1)}%</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{formatNumber(totals.converted)}</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{totals.conversionRate.toFixed(1)}%</TableCell>
                <TableCell className="text-right font-bold" style={totalsCellStyle}>{formatCurrency(totals.avgLTV)}</TableCell>
                <TableCell className="text-right font-bold" style={totalsCellStyle}>{formatCurrency(totals.totalLTV)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientConversionMembershipTable;
