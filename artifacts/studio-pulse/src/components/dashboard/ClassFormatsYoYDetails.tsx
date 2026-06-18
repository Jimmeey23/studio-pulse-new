import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatRevenue } from '@/utils/formatters';

interface Props {
  sessions: SessionData[];
}

const toYear = (input?: string): string | null => {
  if (!input) return null;
  const s = String(input);
  if (/^\d{4}/.test(s)) return s.slice(0, 4);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return String(d.getFullYear());
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length >= 3) return parts[2].slice(0, 4);
  }
  return null;
};

const ClassFormatsYoYDetails: React.FC<Props> = ({ sessions }) => {
  const years = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      const y = toYear(s.date);
      if (y) set.add(y);
    });
    const arr = Array.from(set);
    arr.sort();
    return arr.slice(-4);
  }, [sessions]);

  const rows = useMemo(() => {
    const within = new Set(years);
    const byKey: Record<string, {
      day: string; time: string; cls: string; trainer: string;
      sessions: number; checkins: number; late: number; cap: number; rev: number;
    }> = {};
    (sessions || []).forEach((s) => {
      const y = toYear(s.date);
      if (!y || !within.has(y)) return;
      const key = [s.dayOfWeek || '-', s.time || '-', s.cleanedClass || s.classType || '-', s.trainerName || '-'].join(' | ');
      if (!byKey[key]) {
        byKey[key] = {
          day: s.dayOfWeek || '-',
          time: s.time || '-',
          cls: s.cleanedClass || s.classType || '-',
          trainer: s.trainerName || '-',
          sessions: 0,
          checkins: 0,
          late: 0,
          cap: 0,
          rev: 0,
        };
      }
      const r = byKey[key];
      r.sessions += 1;
      r.checkins += s.checkedInCount || 0;
      r.late += s.lateCancelledCount || 0;
      r.cap += s.capacity || 0;
      r.rev += s.totalPaid || s.revenue || 0;
    });
    return Object.values(byKey).sort((a, b) => b.checkins - a.checkins);
  }, [sessions, years]);

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">YoY Per-Class Details (last 4 years)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Trainer</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Check-ins</TableHead>
                <TableHead className="text-right">Late Cancels</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead className="text-right">Fill %</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, idx) => {
                const fill = r.cap > 0 ? (r.checkins / r.cap) * 100 : 0;
                return (
                  <TableRow key={idx}>
                    <TableCell>{r.day}</TableCell>
                    <TableCell>{r.time}</TableCell>
                    <TableCell>{r.cls}</TableCell>
                    <TableCell>{r.trainer}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.sessions)}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.checkins)}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.late)}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.cap)}</TableCell>
                    <TableCell className="text-right">{fill.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{formatRevenue(r.rev)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassFormatsYoYDetails;
