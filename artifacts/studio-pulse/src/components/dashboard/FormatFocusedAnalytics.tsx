import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { Activity, BarChart3, Columns, GitCompare, Search, Target, ArrowUpDown } from 'lucide-react';

type Grouping =
  | 'none'
  | 'classTrainer'
  | 'class'
  | 'trainer'
  | 'timeSlot'
  | 'location'
  | 'day'
  | 'time'
  | 'classTime'
  | 'classDay'
  | 'classLocation'
  | 'trainerTime'
  | 'trainerLocation'
  | 'uniqueId1'
  | 'uniqueId2'
  | 'sessionName';

interface FormatFocusedAnalyticsProps {
  data: SessionData[];
}

interface GroupRow {
  id: string;
  label: string;
  sessions: number;
  attendance: number;
  capacity: number;
  booked: number;
  lateCancelled: number;
  revenue: number;
  emptyClasses: number;
  nonEmptyClasses: number;
  fillRate: number;
  classAverage: number;
  bookingRate: number;
  showUpRate: number;
  noShowRate: number;
  lateCancelRate: number;
  revenuePerClass: number;
  revenuePerAttendee: number;
  avgCapacity: number;
  consistency: number;
}

const groupSessions = (data: SessionData[], grouping: Grouping): GroupRow[] => {
  // Special case for 'none' - return individual sessions
  if (grouping === 'none') {
    return data.map((s, index) => {
      const attendance = s.checkedInCount || 0;
      const capacity = s.capacity || 0;
      const booked = s.bookedCount || 0;
      const lateCancelled = s.lateCancelledCount || 0;
      const revenue = s.totalPaid || 0;
      const empty = attendance === 0 ? 1 : 0;
      const nonEmpty = 1 - empty;
      const fill = capacity > 0 ? (attendance / capacity) * 100 : 0;
      const avg = attendance; // For single session, average = attendance
      const bookingRate = capacity > 0 ? (booked / capacity) * 100 : 0;
      const showUpRate = booked > 0 ? (attendance / booked) * 100 : 0;
      const noShow = Math.max(booked - attendance - lateCancelled, 0);
      const noShowRate = booked > 0 ? (noShow / booked) * 100 : 0;
      const lateCancelRate = booked > 0 ? (lateCancelled / booked) * 100 : 0;
      const revenuePerClass = revenue; // For single session
      const revenuePerAttendee = attendance > 0 ? revenue / attendance : 0;
      const avgCapacity = capacity;
      const consistency = 100; // Single session, so 100% consistent

      // Format datetime if available
      const dateTime = s.date && s.time ? `${s.date} ${s.time}` : s.date || s.time || 'Unknown DateTime';
      const label = `${s.cleanedClass || 'Class'} | ${dateTime} | ${s.trainerName || 'Unknown Trainer'} | ${s.location || 'Unknown Location'}`;

      return {
        id: `session-${index}-${s.date}-${s.time}-${s.cleanedClass}`,
        label,
        sessions: 1,
        attendance,
        capacity,
        booked,
        lateCancelled,
        revenue,
        emptyClasses: empty,
        nonEmptyClasses: nonEmpty,
        fillRate: fill,
        classAverage: avg,
        bookingRate,
        showUpRate,
        noShowRate,
        lateCancelRate,
        revenuePerClass,
        revenuePerAttendee,
        avgCapacity,
        consistency,
      };
    }).sort((a, b) => {
      // Sort by date first, then by time
      const dateA = new Date(a.label.split(' | ')[1] || '');
      const dateB = new Date(b.label.split(' | ')[1] || '');
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
  }

  const map = new Map<string, SessionData[]>();
  for (const s of data) {
    let key = '';
    let label = '';
    switch (grouping) {
      case 'classTrainer':
        key = `${s.cleanedClass}-${s.trainerName}-${s.dayOfWeek}-${s.time}-${s.location}`;
        label = `${s.cleanedClass || 'Class'} | ${s.dayOfWeek} ${s.time} | ${s.trainerName}`;
        break;
      case 'class':
        key = `${s.cleanedClass}-${s.dayOfWeek}-${s.time}-${s.location}`;
        label = `${s.cleanedClass || 'Class'} | ${s.dayOfWeek} ${s.time}`;
        break;
      case 'trainer':
        key = s.trainerName || 'Unknown Trainer';
        label = key;
        break;
      case 'location':
        key = s.location || 'Unknown Location';
        label = key;
        break;
      case 'day':
        key = s.dayOfWeek || 'Unknown Day';
        label = key;
        break;
      case 'time':
        key = s.time || 'Unknown Time';
        label = key;
        break;
      case 'classTime':
        key = `${s.cleanedClass}-${s.time}`;
        label = `${s.cleanedClass || 'Class'} | ${s.time}`;
        break;
      case 'classDay':
        key = `${s.cleanedClass}-${s.dayOfWeek}`;
        label = `${s.cleanedClass || 'Class'} | ${s.dayOfWeek}`;
        break;
      case 'classLocation':
        key = `${s.cleanedClass}-${s.location}`;
        label = `${s.cleanedClass || 'Class'} | ${s.location}`;
        break;
      case 'trainerTime':
        key = `${s.trainerName}-${s.time}`;
        label = `${s.trainerName || 'Trainer'} | ${s.time}`;
        break;
      case 'trainerLocation':
        key = `${s.trainerName}-${s.location}`;
        label = `${s.trainerName || 'Trainer'} | ${s.location}`;
        break;
      case 'uniqueId1':
        key = s.uniqueId1 || 'Unknown ID1';
        label = key;
        break;
      case 'uniqueId2':
        key = s.uniqueId2 || 'Unknown ID2';
        label = key;
        break;
      case 'sessionName':
        key = s.sessionName || 'Unknown Session';
        label = key;
        break;
      case 'timeSlot':
      default:
        key = `${s.time}-${s.dayOfWeek}`;
        label = `${s.dayOfWeek} ${s.time}`;
        break;
    }
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }

  const rows: GroupRow[] = [];
  map.forEach((sessions, id) => {
    const sessionsCount = sessions.length;
    const attendance = sessions.reduce((a, s) => a + (s.checkedInCount || 0), 0);
    const capacity = sessions.reduce((a, s) => a + (s.capacity || 0), 0);
    const booked = sessions.reduce((a, s) => a + (s.bookedCount || 0), 0);
    const lateCancelled = sessions.reduce((a, s) => a + (s.lateCancelledCount || 0), 0);
    const revenue = sessions.reduce((a, s) => a + (s.totalPaid || 0), 0);
    const empty = sessions.filter(s => (s.checkedInCount || 0) === 0).length;
    const nonEmpty = sessionsCount - empty;
    const fill = capacity > 0 ? (attendance / capacity) * 100 : 0;
    const avg = sessionsCount > 0 ? attendance / sessionsCount : 0;
    const bookingRate = capacity > 0 ? (booked / capacity) * 100 : 0;
    const showUpRate = booked > 0 ? (attendance / booked) * 100 : 0;
    const noShow = Math.max(booked - attendance - lateCancelled, 0);
    const noShowRate = booked > 0 ? (noShow / booked) * 100 : 0;
    const lateCancelRate = booked > 0 ? (lateCancelled / booked) * 100 : 0;
    const revenuePerClass = sessionsCount > 0 ? revenue / sessionsCount : 0;
    const revenuePerAttendee = attendance > 0 ? revenue / attendance : 0;
    const avgCapacity = sessionsCount > 0 ? capacity / sessionsCount : 0;
    const attendanceVals = sessions.map(s => s.checkedInCount || 0);
    const mean = attendanceVals.length ? attendanceVals.reduce((a, b) => a + b, 0) / attendanceVals.length : 0;
    const variance = attendanceVals.length ? attendanceVals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / attendanceVals.length : 0;
    const consistency = mean > 0 ? Math.max(0, 100 - (Math.sqrt(variance) / mean) * 100) : 0;

    const any = sessions[0];
    let label = '';
    switch (grouping) {
      case 'classTrainer':
        label = `${any.cleanedClass || 'Class'} | ${any.dayOfWeek} ${any.time} | ${any.trainerName}`;
        break;
      case 'class':
        label = `${any.cleanedClass || 'Class'} | ${any.dayOfWeek} ${any.time}`;
        break;
      case 'trainer':
        label = any.trainerName || 'Unknown Trainer';
        break;
      case 'location':
        label = any.location || 'Unknown Location';
        break;
      case 'day':
        label = any.dayOfWeek || 'Unknown Day';
        break;
      case 'time':
        label = any.time || 'Unknown Time';
        break;
      case 'classTime':
        label = `${any.cleanedClass || 'Class'} | ${any.time}`;
        break;
      case 'classDay':
        label = `${any.cleanedClass || 'Class'} | ${any.dayOfWeek}`;
        break;
      case 'classLocation':
        label = `${any.cleanedClass || 'Class'} | ${any.location}`;
        break;
      case 'trainerTime':
        label = `${any.trainerName || 'Trainer'} | ${any.time}`;
        break;
      case 'trainerLocation':
        label = `${any.trainerName || 'Trainer'} | ${any.location}`;
        break;
      case 'uniqueId1':
        label = any.uniqueId1 || 'Unknown ID1';
        break;
      case 'uniqueId2':
        label = any.uniqueId2 || 'Unknown ID2';
        break;
      case 'sessionName':
        label = any.sessionName || 'Unknown Session';
        break;
      case 'timeSlot':
      default:
        label = `${any.dayOfWeek} ${any.time}`;
        break;
    }

    rows.push({
      id,
      label,
      sessions: sessionsCount,
      attendance,
      capacity,
      booked,
      lateCancelled,
      revenue,
      emptyClasses: empty,
      nonEmptyClasses: nonEmpty,
      fillRate: fill,
      classAverage: avg,
      bookingRate,
      showUpRate,
      noShowRate,
      lateCancelRate,
      revenuePerClass,
      revenuePerAttendee,
      avgCapacity,
      consistency,
    });
  });

  return rows.sort((a, b) => b.attendance - a.attendance);
};

type SortKey = keyof GroupRow;

const FormatBlock: React.FC<{
  title: string;
  sessions: SessionData[];
  grouping: Grouping;
  search: string;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  visibleCols: Record<SortKey, boolean>;
  onHeaderSort?: (key: SortKey) => void;
  minSessions: number;
}> = ({ title, sessions, grouping, search, sortKey, sortDir, visibleCols, onHeaderSort, minSessions }) => {
  const rows = useMemo(() => {
    let grouped = groupSessions(sessions, grouping);
    if (minSessions > 1) {
      grouped = grouped.filter(r => (r.sessions || 0) >= minSessions);
    }
    if (search) {
      const q = search.toLowerCase();
      grouped = grouped.filter(r => r.label.toLowerCase().includes(q));
    }
    // Sorting
    grouped.sort((a, b) => {
      const av = a[sortKey] as number | string;
      const bv = b[sortKey] as number | string;
      let cmp = 0;
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv; else cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return grouped;
  }, [sessions, grouping, search, sortKey, sortDir]);

  const totals = useMemo(() => {
    const t = rows.reduce((acc, r) => {
      acc.sessions += r.sessions;
      acc.attendance += r.attendance;
      acc.capacity += r.capacity;
      acc.booked += r.booked;
      acc.lateCancelled += r.lateCancelled;
      acc.revenue += r.revenue;
      acc.emptyClasses += r.emptyClasses;
      acc.nonEmptyClasses += r.nonEmptyClasses;
      return acc;
    }, { sessions:0, attendance:0, capacity:0, booked:0, lateCancelled:0, revenue:0, emptyClasses:0, nonEmptyClasses:0 });
    const fill = t.capacity > 0 ? (t.attendance / t.capacity) * 100 : 0;
    const avg = t.sessions > 0 ? t.attendance / t.sessions : 0;
    const bookingRate = t.capacity > 0 ? (t.booked / t.capacity) * 100 : 0;
    const showUpRate = t.booked > 0 ? (t.attendance / t.booked) * 100 : 0;
    const noShow = Math.max(t.booked - t.attendance - t.lateCancelled, 0);
    const noShowRate = t.booked > 0 ? (noShow / t.booked) * 100 : 0;
    const lateCancelRate = t.booked > 0 ? (t.lateCancelled / t.booked) * 100 : 0;
    const revenuePerClass = t.sessions > 0 ? t.revenue / t.sessions : 0;
    const revenuePerAttendee = t.attendance > 0 ? t.revenue / t.attendance : 0;
    const avgCapacity = t.sessions > 0 ? t.capacity / t.sessions : 0;
    return {
      id: 'TOTALS',
      label: 'TOTALS',
      sessions: t.sessions,
      attendance: t.attendance,
      capacity: t.capacity,
      booked: t.booked,
      lateCancelled: t.lateCancelled,
      revenue: t.revenue,
      emptyClasses: t.emptyClasses,
      nonEmptyClasses: t.nonEmptyClasses,
      fillRate: fill,
      classAverage: avg,
      bookingRate,
      showUpRate,
      noShowRate,
      lateCancelRate,
      revenuePerClass,
      revenuePerAttendee,
      avgCapacity,
      consistency: 0,
    } as GroupRow;
  }, [rows]);

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <div className="text-slate-300">Classes</div>
              <div className="font-bold">{formatNumber(totals.sessions)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-300">Attendance</div>
              <div className="font-bold">{formatNumber(totals.attendance)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-300">Fill</div>
              <div className="font-bold">{formatPercentage(totals.fillRate)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-300">Revenue</div>
              <div className="font-bold">{formatCurrency(totals.revenue)}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <Table className="min-w-[1400px]">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-700 to-slate-800">
                <TableHead onClick={() => onHeaderSort && onHeaderSort('label')} className="text-white font-bold h-10 min-w-[300px] cursor-pointer">Group</TableHead>
                {visibleCols.sessions && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('sessions')} className="text-white font-bold text-center h-10 cursor-pointer">Sessions</TableHead>
                )}
                {visibleCols.attendance && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('attendance')} className="text-white font-bold text-center h-10 cursor-pointer">Attendance</TableHead>
                )}
                {visibleCols.capacity && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('capacity')} className="text-white font-bold text-center h-10 cursor-pointer">Capacity</TableHead>
                )}
                {visibleCols.avgCapacity && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('avgCapacity')} className="text-white font-bold text-center h-10 cursor-pointer">Avg Cap</TableHead>
                )}
                {visibleCols.booked && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('booked')} className="text-white font-bold text-center h-10 cursor-pointer">Booked</TableHead>
                )}
                {visibleCols.bookingRate && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('bookingRate')} className="text-white font-bold text-center h-10 cursor-pointer">Booking %</TableHead>
                )}
                {visibleCols.fillRate && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('fillRate')} className="text-white font-bold text-center h-10 cursor-pointer">Fill %</TableHead>
                )}
                {visibleCols.classAverage && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('classAverage')} className="text-white font-bold text-center h-10 cursor-pointer">Avg/Class</TableHead>
                )}
                {visibleCols.showUpRate && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('showUpRate')} className="text-white font-bold text-center h-10 cursor-pointer">Show-up %</TableHead>
                )}
                {visibleCols.noShowRate && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('noShowRate')} className="text-white font-bold text-center h-10 cursor-pointer">No-show %</TableHead>
                )}
                {visibleCols.lateCancelled && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('lateCancelled')} className="text-white font-bold text-center h-10 cursor-pointer">Late Cancels</TableHead>
                )}
                {visibleCols.lateCancelRate && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('lateCancelRate')} className="text-white font-bold text-center h-10 cursor-pointer">Late Cancel %</TableHead>
                )}
                {visibleCols.revenue && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('revenue')} className="text-white font-bold text-center h-10 cursor-pointer">Revenue</TableHead>
                )}
                {visibleCols.revenuePerClass && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('revenuePerClass')} className="text-white font-bold text-center h-10 cursor-pointer">Rev/Class</TableHead>
                )}
                {visibleCols.revenuePerAttendee && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('revenuePerAttendee')} className="text-white font-bold text-center h-10 cursor-pointer">Rev/Attendee</TableHead>
                )}
                {visibleCols.emptyClasses && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('emptyClasses')} className="text-white font-bold text-center h-10 cursor-pointer">Empty</TableHead>
                )}
                {visibleCols.nonEmptyClasses && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('nonEmptyClasses')} className="text-white font-bold text-center h-10 cursor-pointer">Non-Empty</TableHead>
                )}
                {visibleCols.consistency && (
                  <TableHead onClick={() => onHeaderSort && onHeaderSort('consistency')} className="text-white font-bold text-center h-10 cursor-pointer">Consistency</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="hover:bg-slate-50 h-10">
                  <TableCell className="h-10">{r.label}</TableCell>
                  {visibleCols.sessions && (
                    <TableCell className="text-center h-10">
                      <span className="font-semibold text-slate-700">{formatNumber(r.sessions)}</span>
                    </TableCell>
                  )}
                  {visibleCols.attendance && (
                    <TableCell className="text-center h-10 font-semibold text-blue-700">{formatNumber(r.attendance)}</TableCell>
                  )}
                  {visibleCols.capacity && (
                    <TableCell className="text-center h-10 text-slate-700">{formatNumber(r.capacity)}</TableCell>
                  )}
                  {visibleCols.avgCapacity && (
                    <TableCell className="text-center h-10 text-slate-700">{formatNumber(r.avgCapacity)}</TableCell>
                  )}
                  {visibleCols.booked && (
                    <TableCell className="text-center h-10 text-slate-700">{formatNumber(r.booked)}</TableCell>
                  )}
                  {visibleCols.bookingRate && (
                    <TableCell className="text-center h-10">
                      <Badge className={cn('metric-badge', r.bookingRate >= 80 ? 'badge-soft-green' : r.bookingRate >= 60 ? 'badge-soft-yellow' : 'badge-soft-red')}>
                        {formatPercentage(r.bookingRate)}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleCols.fillRate && (
                    <TableCell className="text-center h-10">
                      <Badge className={cn('metric-badge', r.fillRate >= 80 ? 'badge-soft-green' : r.fillRate >= 60 ? 'badge-soft-yellow' : 'badge-soft-red')}>
                        {formatPercentage(r.fillRate)}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleCols.classAverage && (
                    <TableCell className="text-center h-10 text-slate-700">{formatNumber(r.classAverage)}</TableCell>
                  )}
                  {visibleCols.showUpRate && (
                    <TableCell className="text-center h-10">
                      <Badge className={cn('metric-badge', r.showUpRate >= 90 ? 'badge-soft-green' : r.showUpRate >= 75 ? 'badge-soft-yellow' : 'badge-soft-red')}>
                        {formatPercentage(r.showUpRate)}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleCols.noShowRate && (
                    <TableCell className="text-center h-10">
                      <Badge className={cn('metric-badge', r.noShowRate <= 5 ? 'badge-soft-green' : r.noShowRate <= 15 ? 'badge-soft-yellow' : 'badge-soft-red')}>
                        {formatPercentage(r.noShowRate)}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleCols.lateCancelled && (
                    <TableCell className="text-center h-10 text-slate-700">{formatNumber(r.lateCancelled)}</TableCell>
                  )}
                  {visibleCols.lateCancelRate && (
                    <TableCell className="text-center h-10">
                      <Badge className={cn('metric-badge', r.lateCancelRate <= 5 ? 'badge-soft-green' : r.lateCancelRate <= 15 ? 'badge-soft-yellow' : 'badge-soft-red')}>
                        {formatPercentage(r.lateCancelRate)}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleCols.revenue && (
                    <TableCell className="text-center h-10 font-semibold text-emerald-700">{formatCurrency(r.revenue)}</TableCell>
                  )}
                  {visibleCols.revenuePerClass && (
                    <TableCell className="text-center h-10 text-emerald-700">{formatCurrency(r.revenuePerClass)}</TableCell>
                  )}
                  {visibleCols.revenuePerAttendee && (
                    <TableCell className="text-center h-10 text-emerald-700">{formatCurrency(r.revenuePerAttendee)}</TableCell>
                  )}
                  {visibleCols.emptyClasses && (
                    <TableCell className="text-center h-10">
                      <Badge className="metric-badge badge-soft-red">{formatNumber(r.emptyClasses)}</Badge>
                    </TableCell>
                  )}
                  {visibleCols.nonEmptyClasses && (
                    <TableCell className="text-center h-10">
                      <Badge className="metric-badge badge-soft-green">{formatNumber(r.nonEmptyClasses)}</Badge>
                    </TableCell>
                  )}
                  {visibleCols.consistency && (
                    <TableCell className="text-center h-10">
                      <Badge className={cn('metric-badge', r.consistency >= 80 ? 'badge-soft-green' : r.consistency >= 60 ? 'badge-soft-yellow' : 'badge-soft-red')}>
                        {formatPercentage(r.consistency)}
                      </Badge>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              <TableRow className="bg-slate-100 font-bold border-t h-10">
                <TableCell className="h-10">TOTALS</TableCell>
                {visibleCols.sessions && (
                  <TableCell className="text-center h-10">{formatNumber(totals.sessions)}</TableCell>
                )}
                {visibleCols.attendance && (
                  <TableCell className="text-center h-10 text-blue-800">{formatNumber(totals.attendance)}</TableCell>
                )}
                {visibleCols.capacity && (
                  <TableCell className="text-center h-10">{formatNumber(totals.capacity)}</TableCell>
                )}
                {visibleCols.avgCapacity && (
                  <TableCell className="text-center h-10">{formatNumber(totals.avgCapacity)}</TableCell>
                )}
                {visibleCols.booked && (
                  <TableCell className="text-center h-10">{formatNumber(totals.booked)}</TableCell>
                )}
                {visibleCols.bookingRate && (
                  <TableCell className="text-center h-10">{formatPercentage(totals.bookingRate)}</TableCell>
                )}
                {visibleCols.fillRate && (
                  <TableCell className="text-center h-10">{formatPercentage(totals.fillRate)}</TableCell>
                )}
                {visibleCols.classAverage && (
                  <TableCell className="text-center h-10">{formatNumber(totals.classAverage)}</TableCell>
                )}
                {visibleCols.showUpRate && (
                  <TableCell className="text-center h-10">{formatPercentage(totals.showUpRate)}</TableCell>
                )}
                {visibleCols.noShowRate && (
                  <TableCell className="text-center h-10">{formatPercentage(totals.noShowRate)}</TableCell>
                )}
                {visibleCols.lateCancelled && (
                  <TableCell className="text-center h-10">{formatNumber(totals.lateCancelled)}</TableCell>
                )}
                {visibleCols.lateCancelRate && (
                  <TableCell className="text-center h-10">{formatPercentage(totals.lateCancelRate)}</TableCell>
                )}
                {visibleCols.revenue && (
                  <TableCell className="text-center h-10 text-emerald-800">{formatCurrency(totals.revenue)}</TableCell>
                )}
                {visibleCols.revenuePerClass && (
                  <TableCell className="text-center h-10">{formatCurrency(totals.revenuePerClass)}</TableCell>
                )}
                {visibleCols.revenuePerAttendee && (
                  <TableCell className="text-center h-10">{formatCurrency(totals.revenuePerAttendee)}</TableCell>
                )}
                {visibleCols.emptyClasses && (
                  <TableCell className="text-center h-10">{formatNumber(totals.emptyClasses)}</TableCell>
                )}
                {visibleCols.nonEmptyClasses && (
                  <TableCell className="text-center h-10">{formatNumber(totals.nonEmptyClasses)}</TableCell>
                )}
                {visibleCols.consistency && (
                  <TableCell className="text-center h-10">-</TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export const FormatFocusedAnalytics: React.FC<FormatFocusedAnalyticsProps> = ({ data }) => {
  const [comparisonMode, setComparisonMode] = useState(false);
  const [grouping, setGrouping] = useState<Grouping>('classTrainer');
  const [search, setSearch] = useState('');
  const [excludeHosted, setExcludeHosted] = useState(true);
  const [singleFormat, setSingleFormat] = useState<string>('');
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('attendance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showColsPanel, setShowColsPanel] = useState(false);
  const [minSessions, setMinSessions] = useState<number>(1);

  const defaultVisible: SortKey[] = [
    'sessions', 'attendance', 'capacity', 'fillRate', 'classAverage', 'revenue', 'emptyClasses', 'nonEmptyClasses',
  ];
  const [visibleCols, setVisibleCols] = useState<Record<SortKey, boolean>>(() => {
    const base: Record<SortKey, boolean> = {
      id: false,
      label: true,
      sessions: true,
      attendance: true,
      capacity: true,
      booked: false,
      lateCancelled: false,
      revenue: true,
      emptyClasses: true,
      nonEmptyClasses: true,
      fillRate: true,
      classAverage: true,
      bookingRate: false,
      showUpRate: false,
      noShowRate: false,
      lateCancelRate: false,
      revenuePerClass: false,
      revenuePerAttendee: false,
      avgCapacity: false,
      consistency: false,
    } as Record<SortKey, boolean>;
    // Ensure defaults above are honored
    defaultVisible.forEach(k => (base[k] = true));
    return base;
  });

  const availableFormats = useMemo(() => {
    const formats = Array.from(new Set(data.map(d => d.cleanedClass).filter(Boolean))) as string[];
    formats.sort((a, b) => a.localeCompare(b));
    return formats;
  }, [data]);

  // Default the single format to the first popular format
  React.useEffect(() => {
    if (!singleFormat && availableFormats.length > 0) {
      setSingleFormat(availableFormats[0]);
    }
  }, [availableFormats, singleFormat]);

  const baseFiltered = useMemo(() => {
    return excludeHosted
      ? data.filter(s => !s.cleanedClass?.toLowerCase().includes('hosted') && !s.sessionName?.toLowerCase().includes('hosted'))
      : data;
  }, [data, excludeHosted]);

  const ALL_FORMAT = '__ALL__';
  const singleModeData = useMemo(() => {
    if (comparisonMode) return [] as SessionData[];
    if (!singleFormat) return [] as SessionData[];
    if (singleFormat === ALL_FORMAT) return baseFiltered;
    return baseFiltered.filter(s => s.cleanedClass === singleFormat);
  }, [baseFiltered, comparisonMode, singleFormat]);

  const comparisonData = useMemo(() => {
    if (!comparisonMode) return [] as { format: string; items: SessionData[] }[];
    return selectedFormats.map(fmt => ({
      format: fmt,
      items: baseFiltered.filter(s => s.cleanedClass === fmt)
    }));
  }, [comparisonMode, selectedFormats, baseFiltered]);

  const toggleFormat = (fmt: string) => {
    setSelectedFormats(prev => {
      const set = new Set(prev);
      if (set.has(fmt)) set.delete(fmt); else set.add(fmt);
      return Array.from(set);
    });
  };

  const toggleCol = (key: SortKey) => {
    setVisibleCols(v => ({ ...v, [key]: !v[key] }));
  };

  const handleHeaderSort = (key: SortKey) => {
    if (key === 'label' || key === 'id') return; // skip non-numeric for now
    setSortKey(prev => (prev === key ? key : key));
    setSortDir(prev => (sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'));
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Comparison toggle */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border">
              <GitCompare className="w-4 h-4 text-purple-600" />
              <Switch id="compare" checked={comparisonMode} onCheckedChange={setComparisonMode} />
              <Label htmlFor="compare" className="text-sm font-medium">Comparison Mode</Label>
            </div>

            {/* Format selection */}
            {!comparisonMode ? (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-green-600" />Format</Label>
                <Select value={singleFormat} onValueChange={setSingleFormat}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FORMAT}>All Classes</SelectItem>
                    {availableFormats.map(fmt => (
                      <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-sm font-semibold flex items-center gap-2"><Columns className="w-4 h-4 text-indigo-600" />Compare Formats</Label>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button size="sm" variant="outline" onClick={() => setSelectedFormats(availableFormats)}>Select All</Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedFormats([])}>Clear All</Button>
                  <Badge variant="outline" className="metric-badge badge-soft-purple">{selectedFormats.length} selected</Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableFormats.map(fmt => {
                    const active = selectedFormats.includes(fmt);
                    return (
                      <Button key={fmt} variant={active ? 'default' : 'outline'} size="sm" onClick={() => toggleFormat(fmt)} className={cn('h-7', active ? 'bg-indigo-600' : '')}>
                        {fmt}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grouping */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600" />Group By</Label>
              <Select value={grouping} onValueChange={(v) => setGrouping(v as Grouping)}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="classTrainer">Class + Day + Time + Trainer</SelectItem>
                  <SelectItem value="class">Class + Day + Time</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="timeSlot">Day + Time</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="classTime">Class + Time</SelectItem>
                  <SelectItem value="classDay">Class + Day</SelectItem>
                  <SelectItem value="classLocation">Class + Location</SelectItem>
                  <SelectItem value="trainerTime">Trainer + Time</SelectItem>
                  <SelectItem value="trainerLocation">Trainer + Location</SelectItem>
                  <SelectItem value="uniqueId1">Unique ID 1</SelectItem>
                  <SelectItem value="uniqueId2">Unique ID 2</SelectItem>
                  <SelectItem value="sessionName">Session Name</SelectItem>
                  <SelectItem value="none">No Grouping - Individual Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups..." className="pl-9" />
            </div>

            {/* Exclude hosted */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border">
              <Switch id="hosted" checked={excludeHosted} onCheckedChange={setExcludeHosted} />
              <Label htmlFor="hosted" className="text-sm">Exclude Hosted</Label>
            </div>

            {/* Min classes filter */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border">
              <Label className="text-sm">Min classes</Label>
              <Input type="number" min={1} className="w-20" value={minSessions} onChange={(e) => setMinSessions(Math.max(1, Number(e.target.value)))} />
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border">
              <ArrowUpDown className="w-4 h-4 text-slate-600" />
              <Label className="text-sm">Sort</Label>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sessions">Sessions</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="capacity">Capacity</SelectItem>
                  <SelectItem value="avgCapacity">Avg Capacity</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="bookingRate">Booking %</SelectItem>
                  <SelectItem value="fillRate">Fill %</SelectItem>
                  <SelectItem value="classAverage">Avg/Class</SelectItem>
                  <SelectItem value="showUpRate">Show-up %</SelectItem>
                  <SelectItem value="noShowRate">No-show %</SelectItem>
                  <SelectItem value="lateCancelled">Late Cancels</SelectItem>
                  <SelectItem value="lateCancelRate">Late Cancel %</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="revenuePerClass">Rev/Class</SelectItem>
                  <SelectItem value="revenuePerAttendee">Rev/Attendee</SelectItem>
                  <SelectItem value="emptyClasses">Empty</SelectItem>
                  <SelectItem value="nonEmptyClasses">Non-Empty</SelectItem>
                  <SelectItem value="consistency">Consistency</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>{sortDir.toUpperCase()}</Button>
            </div>

            {/* Column visibility */}
            <div className="relative">
              <Button size="sm" variant="outline" onClick={() => setShowColsPanel(p => !p)}>Columns</Button>
              {showColsPanel && (
                <div className="absolute z-20 mt-2 w-[340px] max-h-[380px] overflow-auto bg-white border rounded-md shadow-md p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Button size="sm" variant="outline" onClick={() => setVisibleCols(v => {
                      const keys = [
                        'sessions','attendance','capacity','avgCapacity','booked','bookingRate','fillRate','classAverage','showUpRate','noShowRate','lateCancelled','lateCancelRate','revenue','revenuePerClass','revenuePerAttendee','emptyClasses','nonEmptyClasses','consistency'
                      ] as SortKey[];
                      const next = { ...v } as Record<SortKey, boolean>;
                      keys.forEach(k => next[k] = true);
                      return next;
                    })}>Select All</Button>
                    <Button size="sm" variant="outline" onClick={() => setVisibleCols(v => {
                      const keys = [
                        'sessions','attendance','capacity','avgCapacity','booked','bookingRate','fillRate','classAverage','showUpRate','noShowRate','lateCancelled','lateCancelRate','revenue','revenuePerClass','revenuePerAttendee','emptyClasses','nonEmptyClasses','consistency'
                      ] as SortKey[];
                      const next = { ...v } as Record<SortKey, boolean>;
                      keys.forEach(k => next[k] = false);
                      return next;
                    })}>Clear All</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        'sessions','attendance','capacity','avgCapacity','booked','bookingRate','fillRate','classAverage','showUpRate','noShowRate','lateCancelled','lateCancelRate','revenue','revenuePerClass','revenuePerAttendee','emptyClasses','nonEmptyClasses','consistency'
                      ] as SortKey[]
                    ).map(k => (
                      <label key={k} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={!!visibleCols[k]} onChange={() => toggleCol(k)} />
                        <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {!comparisonMode ? (
        <FormatBlock
          title={`${singleFormat || 'Select Format'} — Classes`}
          sessions={singleModeData}
          grouping={grouping}
          search={search}
          sortKey={sortKey}
          sortDir={sortDir}
          visibleCols={visibleCols}
          onHeaderSort={handleHeaderSort}
          minSessions={minSessions}
        />
      ) : (
        <div className={cn('grid gap-6', selectedFormats.length <= 1 ? 'grid-cols-1' : selectedFormats.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3')}>
          {comparisonData.map(({ format, items }) => (
            <FormatBlock
              key={format}
              title={`${format} — Classes`}
              sessions={items}
              grouping={grouping}
              search={search}
              sortKey={sortKey}
              sortDir={sortDir}
              visibleCols={visibleCols}
              onHeaderSort={handleHeaderSort}
              minSessions={minSessions}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FormatFocusedAnalytics;
