import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { AiNotes } from '@/components/ui/AiNotes';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

type GroupKey = 'classType' | 'cleanedClass' | 'trainerName' | 'location' | 'uniqueId1' | 'uniqueId2';

interface ClassTypePerformanceMetricsProps {
  data: SessionData[];
  defaultGroupBy?: GroupKey;
  title?: string;
}

// Small helpers
const safeDiv = (num: number, den: number) => (den === 0 ? 0 : num / den);

export const ClassTypePerformanceMetrics: React.FC<ClassTypePerformanceMetricsProps> = ({
  data,
  defaultGroupBy = 'classType',
  title = 'Class Type Performance Metrics',
}) => {
  const [groupBy, setGroupBy] = useState<GroupKey>(defaultGroupBy);
  const { filters } = useGlobalFilters();
  const periodId = `${filters.dateRange.start}:${filters.dateRange.end}`;

  const groups = useMemo(() => {
    const by: Record<string, SessionData[]> = {};
    (data || []).forEach((s) => {
      const key = (
        groupBy === 'classType' ? s.classType :
        groupBy === 'cleanedClass' ? s.cleanedClass :
        groupBy === 'trainerName' ? s.trainerName :
        groupBy === 'location' ? s.location :
        groupBy === 'uniqueId1' ? s.uniqueId1 :
        s.uniqueId2
      ) || 'Unknown';
      if (!by[key]) by[key] = [];
      by[key].push(s);
    });
    return by;
  }, [data, groupBy]);

  type Row = {
    key: string;
    sessions: number;
    checkedIn: number;
    booked: number;
    late: number;
    capacity: number;
    revenue: number;
    nonPaid: number;
    memberships: number;
    packages: number;
    introOffers: number;
    singleClasses: number;
    // derived
    avgAttendance: number;
    capacityUtil: number; // %
    peakCapacityUtil: number; // %
    avgCapacity: number;
    sellOutRate: number; // %
    avgRevenuePerClass: number;
    revenuePerAttendee: number;
    bookingToAttendanceRate: number; // %
    noShowRate: number; // %
    cancellationRate: number; // placeholder (0 without explicit cancel data)
    complimentaryRate: number; // % of comps relative to checked in
    paidAttendancePct: number; // %
    nonPaidRate: number; // %
    revenuePerCapacityUnit: number;
    membershipUsagePct: number; // %
    packageUsagePct: number; // %
    introOfferUsagePct: number; // %
    singleClassPct: number; // %
    frequency: number; // sessions
    // temporal proxies
    peakDay: string;
    peakTime: string;
    growthPotential: number; // %
    efficiencyScore: number; // 0-100
  };

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    Object.entries(groups).forEach(([key, sessions]) => {
      const sessionsCount = sessions.length;
      const checked = sessions.reduce((a, s) => a + (s.checkedInCount || 0), 0);
      const booked = sessions.reduce((a, s) => a + (s.bookedCount || 0), 0);
      const late = sessions.reduce((a, s) => a + (s.lateCancelledCount || 0), 0);
      const cap = sessions.reduce((a, s) => a + (s.capacity || 0), 0);
      const rev = sessions.reduce((a, s) => a + (s.totalPaid || s.revenue || 0), 0);
      const nonPaid = sessions.reduce((a, s) => a + (s.nonPaidCount || 0), 0);

      const memberships = sessions.reduce((a, s) => a + (s.checkedInsWithMemberships || 0), 0);
      const packages = sessions.reduce((a, s) => a + (s.checkedInsWithPackages || 0), 0);
      const introOffers = sessions.reduce((a, s) => a + (s.checkedInsWithIntroOffers || 0), 0);
      const singleClasses = sessions.reduce((a, s) => a + (s.checkedInsWithSingleClasses || 0), 0);

      // Derived
      const avgAttendance = safeDiv(checked, sessionsCount);
      const avgCapacity = safeDiv(cap, sessionsCount);
      // Harmonized fill-rate / capacity utilization: use total checked-in over total capacity
      const capacityUtil = cap > 0 ? safeDiv(checked, cap) * 100 : 0;
      const peakCapacityUtil = sessions.reduce((max, s) => {
        const pct = (s.capacity || 0) > 0 ? (safeDiv(s.checkedInCount || 0, s.capacity || 0) * 100) : 0;
        return Math.max(max, pct);
      }, 0);
      const sellOutRate = sessionsCount > 0 ? (sessions.filter(s => (s.checkedInCount || 0) >= (s.capacity || 0) && (s.capacity || 0) > 0).length / sessionsCount) * 100 : 0;
      const avgRevenuePerClass = safeDiv(rev, sessionsCount);
      const revenuePerAttendee = safeDiv(rev, checked);
      const bookingToAttendanceRate = booked > 0 ? safeDiv(checked, booked) * 100 : 0;
      const noShowRate = booked > 0 ? safeDiv((booked - checked), booked) * 100 : 0;
      const cancellationRate = 0; // not available explicitly from Sessions
      const complimentaryRate = checked > 0 ? safeDiv((sessions.reduce((a, s) => a + (s.complimentaryCount || 0), 0)), checked) * 100 : 0;
      const paidAttendancePct = checked > 0 ? safeDiv((checked - nonPaid), checked) * 100 : 0;
      const nonPaidRate = checked > 0 ? safeDiv(nonPaid, checked) * 100 : 0;
      const revenuePerCapacityUnit = cap > 0 ? safeDiv(rev, cap) : 0;
      const membershipUsagePct = checked > 0 ? safeDiv(memberships, checked) * 100 : 0;
      const packageUsagePct = checked > 0 ? safeDiv(packages, checked) * 100 : 0;
      const introOfferUsagePct = checked > 0 ? safeDiv(introOffers, checked) * 100 : 0;
      const singleClassPct = checked > 0 ? safeDiv(singleClasses, checked) * 100 : 0;
      const frequency = sessionsCount;

      // Temporal metrics: pick mode weighted by attendance
      const dayBuckets: Record<string, number> = {};
      const timeBuckets: Record<string, number> = {};
      sessions.forEach((s) => {
        const w = s.checkedInCount || 0;
        if (s.dayOfWeek) dayBuckets[s.dayOfWeek] = (dayBuckets[s.dayOfWeek] || 0) + w;
        if (s.time) timeBuckets[s.time] = (timeBuckets[s.time] || 0) + w;
      });
      const peakDay = Object.entries(dayBuckets).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
      const peakTime = Object.entries(timeBuckets).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      // Growth Potential = (AVG(Capacity) - AVG(CheckedIn)) / AVG(Capacity) × 100
      const growthPotential = avgCapacity > 0 ? ((avgCapacity - avgAttendance) / avgCapacity) * 100 : 0;

      // Efficiency Score = (Utilization × 0.4) + (Revenue per Class normalized × 0.3) + (Booking Rate × 0.3)
      // Normalize revenue per class roughly by dividing by max among groups to cap at ~100
      out.push({
        key,
        sessions: sessionsCount,
        checkedIn: checked,
        booked,
        late,
        capacity: cap,
        revenue: rev,
        nonPaid,
        memberships,
        packages,
        introOffers,
        singleClasses,
        avgAttendance,
        capacityUtil,
        peakCapacityUtil,
        avgCapacity,
        sellOutRate,
        avgRevenuePerClass,
        revenuePerAttendee,
        bookingToAttendanceRate,
        noShowRate,
        cancellationRate,
        complimentaryRate,
        paidAttendancePct,
        nonPaidRate,
        revenuePerCapacityUnit,
        membershipUsagePct,
        packageUsagePct,
        introOfferUsagePct,
        singleClassPct,
        frequency,
        peakDay,
        peakTime,
        growthPotential,
        efficiencyScore: 0, // fill later
      });
    });

    // Compute efficiency with normalization
    const maxRevenuePerClass = out.reduce((m, r) => Math.max(m, r.avgRevenuePerClass || 0), 0) || 1;
    out.forEach((r) => {
      const util = r.capacityUtil; // already %
      const revNorm = (r.avgRevenuePerClass / maxRevenuePerClass) * 100;
      const booking = r.bookingToAttendanceRate; // %
      r.efficiencyScore = (util * 0.4) + (revNorm * 0.3) + (booking * 0.3);
    });

    // Sort by efficiency desc
    out.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    return out;
  }, [groups]);

  return (
    <>
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
          <p className="text-sm text-gray-500">Compare formats using financial, operational, and temporal metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-slate-50">{rows.length} groups</Badge>
          <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
            <SelectTrigger className="h-8 w-44">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classType">Group: Class Type</SelectItem>
              <SelectItem value="cleanedClass">Group: Cleaned Class</SelectItem>
              <SelectItem value="trainerName">Group: Trainer</SelectItem>
              <SelectItem value="location">Group: Location</SelectItem>
              <SelectItem value="uniqueId1">Group: Unique ID 1</SelectItem>
              <SelectItem value="uniqueId2">Group: Unique ID 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="core" className="w-full">
          <TabsList className="mb-3">
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="payments">Payment Mix</TabsTrigger>
            <TabsTrigger value="temporal">Temporal</TabsTrigger>
          </TabsList>

          <TabsContent value="core">
            <div className="mb-3 text-sm text-slate-500">
              <strong>Note:</strong> Capacity Utilization = total checked‑in / total capacity (aggregated across sessions).
            </div>
            <div className="overflow-x-auto">
              <Table className="[&_*]:whitespace-nowrap">
                <TableHeader>
                  <TableRow className="h-[35px]">
                    <TableHead className="whitespace-nowrap">Group</TableHead>
                    <TableHead>Average Attendance</TableHead>
                    <TableHead>Capacity Utilization</TableHead>
                    <TableHead>Peak Utilization</TableHead>
                    <TableHead>Average Capacity</TableHead>
                    <TableHead>Sell-Out Rate</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Avg Revenue / Class</TableHead>
                    <TableHead>Revenue / Attendee</TableHead>
                    <TableHead>Total Bookings</TableHead>
                    <TableHead>Booking→Attendance</TableHead>
                    <TableHead>No-Show Rate</TableHead>
                    <TableHead>Complimentary Rate</TableHead>
                    <TableHead>Paid Attendance %</TableHead>
                    <TableHead>Non-Paid Rate</TableHead>
                    <TableHead>Revenue / Capacity</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Growth Potential</TableHead>
                    <TableHead>Efficiency Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.key} className="cursor-pointer h-[35px]" onClick={() => window.dispatchEvent(new CustomEvent('open-drilldown', { detail: { scope: 'classTypeMetrics', key: r.key, groupBy } }))}>
                      <TableCell className="font-medium">{r.key}</TableCell>
                      <TableCell>{formatNumber(r.avgAttendance)}</TableCell>
                      <TableCell>{(r.capacityUtil).toFixed(1)}%</TableCell>
                      <TableCell>{(r.peakCapacityUtil).toFixed(1)}%</TableCell>
                      <TableCell>{formatNumber(r.avgCapacity)}</TableCell>
                      <TableCell>{(r.sellOutRate).toFixed(1)}%</TableCell>
                      <TableCell>{formatCurrency(r.revenue)}</TableCell>
                      <TableCell>{formatCurrency(r.avgRevenuePerClass)}</TableCell>
                      <TableCell>{formatCurrency(r.revenuePerAttendee)}</TableCell>
                      <TableCell>{formatNumber(r.booked)}</TableCell>
                      <TableCell>{(r.bookingToAttendanceRate).toFixed(1)}%</TableCell>
                      <TableCell>{(r.noShowRate).toFixed(1)}%</TableCell>
                      <TableCell>{(r.complimentaryRate).toFixed(1)}%</TableCell>
                      <TableCell>{(r.paidAttendancePct).toFixed(1)}%</TableCell>
                      <TableCell>{(r.nonPaidRate).toFixed(1)}%</TableCell>
                      <TableCell>{formatCurrency(r.revenuePerCapacityUnit)}</TableCell>
                      <TableCell>{r.frequency}</TableCell>
                      <TableCell>{(r.growthPotential).toFixed(1)}%</TableCell>
                      <TableCell>{Math.round(r.efficiencyScore)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="overflow-x-auto">
              <Table className="[&_*]:whitespace-nowrap">
                <TableHeader>
                  <TableRow className="h-[35px]">
                    <TableHead>Group</TableHead>
                    <TableHead>Membership %</TableHead>
                    <TableHead>Package %</TableHead>
                    <TableHead>Intro Offer %</TableHead>
                    <TableHead>Single Class %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.key} className="cursor-pointer h-[35px]" onClick={() => window.dispatchEvent(new CustomEvent('open-drilldown', { detail: { scope: 'classTypePayments', key: r.key, groupBy } }))}>
                      <TableCell className="font-medium">{r.key}</TableCell>
                      <TableCell>{(r.membershipUsagePct).toFixed(1)}%</TableCell>
                      <TableCell>{(r.packageUsagePct).toFixed(1)}%</TableCell>
                      <TableCell>{(r.introOfferUsagePct).toFixed(1)}%</TableCell>
                      <TableCell>{(r.singleClassPct).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="temporal">
            <div className="overflow-x-auto">
              <Table className="[&_*]:whitespace-nowrap">
                <TableHeader>
                  <TableRow className="h-[35px]">
                    <TableHead>Group</TableHead>
                    <TableHead>Peak Day</TableHead>
                    <TableHead>Peak Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.key} className="cursor-pointer h-[35px]" onClick={() => window.dispatchEvent(new CustomEvent('open-drilldown', { detail: { scope: 'classTypeTemporal', key: r.key, groupBy } }))}>
                      <TableCell className="font-medium">{r.key}</TableCell>
                      <TableCell>{r.peakDay}</TableCell>
                      <TableCell>{r.peakTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-gray-500 mt-4 space-y-1">
          <p>Notes:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Cancellation Rate and Late Arrival Rate require explicit columns not present in Sessions; they’re displayed as 0 unless sourced elsewhere.</li>
            <li>Paid Attendance % and Non-Paid Rate use Sessions.nonPaidCount when available.</li>
            <li>Payment type percentages use checked-ins as the denominator.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
    <div className="mt-4">
      <AiNotes
        tableKey="sessions:classTypePerformance"
        location={filters.location[0]}
        period={periodId}
        sectionId="class-type-performance-table"
      />
    </div>
    </>
  );
};

export default ClassTypePerformanceMetrics;
