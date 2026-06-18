import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CalendarClock, Clock3, IndianRupee, MapPin, Users } from 'lucide-react';
import { LateCancellationsData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

interface LateCancellationsDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export const LateCancellationsDrillDownModal: React.FC<LateCancellationsDrillDownModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const records: LateCancellationsData[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.rawData)) return data.rawData;
    if (data.raw) return [data.raw];
    return [];
  }, [data]);

  const title = data?.title || 'Late Cancellation Drill-Down';

  const metrics = useMemo(() => {
    const total = records.length;
    const uniqueMembers = new Set(records.map((item) => item.memberId || item.email || item.customerName).filter(Boolean)).size;
    const uniqueLocations = new Set(records.map((item) => item.location).filter(Boolean)).size;
    const penalties = records.reduce((sum, item) => sum + (item.chargedPenaltyAmount || 0), 0);
    const sameDay = records.filter((item) => item.isSameDayCancellation).length;
    const leadHours = records
      .map((item) => item.timeBeforeClassHours)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    const avgLeadHours = leadHours.length ? leadHours.reduce((sum, value) => sum + value, 0) / leadHours.length : 0;

    const locationBreakdown = records.reduce((acc, item) => {
      const key = item.location || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const windowBreakdown = records.reduce((acc, item) => {
      const key = item.cancellationWindow || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      uniqueMembers,
      uniqueLocations,
      penalties,
      sameDay,
      avgLeadHours,
      locationBreakdown,
      windowBreakdown,
    };
  }, [records]);

  const summaryCards = [
    { label: 'Late Cancellations', value: formatNumber(metrics.total), icon: AlertTriangle, tone: 'from-red-600 to-red-500' },
    { label: 'Members', value: formatNumber(metrics.uniqueMembers), icon: Users, tone: 'from-blue-600 to-blue-500' },
    { label: 'Avg Lead Time', value: `${metrics.avgLeadHours.toFixed(1)} hrs`, icon: Clock3, tone: 'from-violet-600 to-fuchsia-500' },
    { label: 'Penalties', value: formatCurrency(metrics.penalties), icon: IndianRupee, tone: 'from-emerald-600 to-emerald-500' },
  ];

  const topLocations = Object.entries(metrics.locationBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topWindows = Object.entries(metrics.windowBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[92vh] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-red-950 to-orange-900 px-8 py-6 text-white">
          <DialogTitle className="flex flex-col gap-2 text-left">
            <span className="text-2xl font-bold tracking-tight">{title}</span>
            <span className="text-sm font-normal text-red-100">Detailed record view with event, location, lead-time, and penalty context.</span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-8 py-6">
          {records.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
              No drill-down records are available for this selection.
            </div>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-slate-100 p-2">
                <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
                <TabsTrigger value="breakdowns" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Breakdowns</TabsTrigger>
                <TabsTrigger value="records" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Records</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <Card key={card.label} className="overflow-hidden border border-slate-200 shadow-sm">
                        <CardContent className="p-0">
                          <div className={`h-2 bg-gradient-to-r ${card.tone}`} />
                          <div className="flex items-start justify-between gap-4 p-5">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                              <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
                            </div>
                            <div className={`rounded-2xl bg-gradient-to-br p-3 text-white ${card.tone}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-2 text-slate-900">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <h3 className="font-semibold">Top locations in this selection</h3>
                      </div>
                      <div className="space-y-3">
                        {topLocations.map(([label, count]) => (
                          <div key={label} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-700">{label}</span>
                              <Badge variant="outline">{formatNumber(count)}</Badge>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100">
                              <div className="h-2 rounded-full bg-gradient-to-r from-red-600 to-orange-500" style={{ width: `${(count / Math.max(metrics.total, 1)) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-2 text-slate-900">
                        <CalendarClock className="h-4 w-4 text-red-600" />
                        <h3 className="font-semibold">Lead-time windows</h3>
                      </div>
                      <div className="space-y-3">
                        {topWindows.map(([label, count]) => (
                          <div key={label} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-700">{label}</span>
                              <Badge variant="outline">{formatNumber(count)}</Badge>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100">
                              <div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" style={{ width: `${(count / Math.max(metrics.total, 1)) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <span className="font-semibold">Same-day share:</span> {formatPercentage((metrics.sameDay / Math.max(metrics.total, 1)) * 100)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="breakdowns" className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {records.slice(0, 12).map((record, index) => (
                    <Card key={`${record.memberId || record.email || record.cancelledDateIST}-${index}`} className="border border-slate-200 shadow-sm">
                      <CardContent className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{record.customerName || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unknown member'}</p>
                            <p className="text-sm text-slate-500">{record.cleanedClass || record.cancelledEvent || 'Unknown event'}</p>
                          </div>
                          <Badge variant="outline">{record.cancellationWindow || 'Unknown'}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Location</p>
                            <p>{record.location || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Membership</p>
                            <p>{record.cleanedProduct || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Cancelled At</p>
                            <p>{record.cancelledDateIST || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Session At</p>
                            <p>{record.sessionDateIST || record.dateIST || '—'}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-red-50 text-red-700 hover:bg-red-50">{typeof record.timeBeforeClassHours === 'number' ? `${record.timeBeforeClassHours.toFixed(1)} hrs before class` : 'Lead time unavailable'}</Badge>
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Penalty {formatCurrency(record.chargedPenaltyAmount || 0)}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="records">
                <ScrollArea className="h-[52vh] rounded-2xl border border-slate-200">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50">
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Cancelled Event</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Membership</TableHead>
                        <TableHead>Cancelled At</TableHead>
                        <TableHead>Session At</TableHead>
                        <TableHead>Lead Time</TableHead>
                        <TableHead>Penalty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record, index) => (
                        <TableRow key={`${record.memberId || record.email || record.cancelledDateIST}-${index}`} className="hover:bg-red-50/30">
                          <TableCell className="font-medium text-slate-900">{record.customerName || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unknown member'}</TableCell>
                          <TableCell>{record.cleanedClass || record.cancelledEvent || '—'}</TableCell>
                          <TableCell>{record.location || '—'}</TableCell>
                          <TableCell>{record.cleanedProduct || '—'}</TableCell>
                          <TableCell>{record.cancelledDateIST || '—'}</TableCell>
                          <TableCell>{record.sessionDateIST || record.dateIST || '—'}</TableCell>
                          <TableCell>{typeof record.timeBeforeClassHours === 'number' ? `${record.timeBeforeClassHours.toFixed(1)} hrs` : '—'}</TableCell>
                          <TableCell>{formatCurrency(record.chargedPenaltyAmount || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
