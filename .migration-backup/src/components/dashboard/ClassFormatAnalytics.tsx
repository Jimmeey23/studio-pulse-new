import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatPercentage, formatRevenue } from '@/utils/formatters';
import { TrendingUp, TrendingDown, Activity, Users, DollarSign, Target } from 'lucide-react';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';

interface ClassFormatAnalyticsProps {
  data: SessionData[];
}

interface ClassPerformance {
  classKey: string;
  className: string;
  day: string;
  time: string;
  sessions: number;
  attendance: number;
  capacity: number;
  revenue: number;
  fillRate: number;
  avgAttendance: number;
}

interface FormatData {
  format: string;
  topClasses: ClassPerformance[];
  bottomClasses: ClassPerformance[];
  totalSessions: number;
  totalAttendance: number;
  totalRevenue: number;
  totalCapacity: number;
  avgFillRate: number;
}

export const ClassFormatAnalytics: React.FC<ClassFormatAnalyticsProps> = ({ data }) => {
  const formatAnalytics = useMemo(() => {
    // Group by format (Class type)
    const formatMap = new Map<string, SessionData[]>();
    
    data.forEach(session => {
      const format = session.cleanedClass || 'Unknown';
      if (!formatMap.has(format)) {
        formatMap.set(format, []);
      }
      formatMap.get(format)!.push(session);
    });

    // Process each format
    const analytics: FormatData[] = [];

    formatMap.forEach((sessions, format) => {
      // Group by class+day+time
      const classMap = new Map<string, SessionData[]>();
      
      sessions.forEach(session => {
        const classKey = `${session.cleanedClass}-${session.dayOfWeek}-${session.time}`;
        if (!classMap.has(classKey)) {
          classMap.set(classKey, []);
        }
        classMap.get(classKey)!.push(session);
      });

      // Calculate metrics for each class
      const classPerformances: ClassPerformance[] = [];

      classMap.forEach((classSessions, classKey) => {
        const totalSessions = classSessions.length;
        const totalAttendance = classSessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
        const totalCapacity = classSessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
        const totalRevenue = classSessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
        const fillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
        const avgAttendance = totalSessions > 0 ? totalAttendance / totalSessions : 0;

        classPerformances.push({
          classKey,
          className: classSessions[0].cleanedClass || 'Unknown',
          day: classSessions[0].dayOfWeek || 'Unknown',
          time: classSessions[0].time || 'Unknown',
          sessions: totalSessions,
          attendance: totalAttendance,
          capacity: totalCapacity,
          revenue: totalRevenue,
          fillRate,
          avgAttendance
        });
      });

      // Sort by attendance
      classPerformances.sort((a, b) => b.attendance - a.attendance);

      // Get top 5 and bottom 5
      const topClasses = classPerformances.slice(0, 5);
      const bottomClasses = classPerformances.slice(-5).reverse();

      // Calculate format totals
      const totalSessions = sessions.length;
      const totalAttendance = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const avgFillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;

      analytics.push({
        format,
        topClasses,
        bottomClasses,
        totalSessions,
        totalAttendance,
        totalRevenue,
        totalCapacity,
        avgFillRate
      });
    });

    return analytics.sort((a, b) => b.totalAttendance - a.totalAttendance);
  }, [data]);

  const renderClassTable = (classes: ClassPerformance[], title: string, icon: React.ReactNode, isTop: boolean) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-bold text-slate-700">{title}</h4>
      </div>
      <div className="overflow-x-auto custom-scrollbar border rounded-lg">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-700 to-slate-800">
              <TableHead className="text-white font-bold py-2 h-10 min-w-[250px]">Class + Day + Time</TableHead>
              <TableHead className="text-white font-bold text-center py-2 h-10">Sessions</TableHead>
              <TableHead className="text-white font-bold text-center py-2 h-10">Attendance</TableHead>
              <TableHead className="text-white font-bold text-center py-2 h-10">Capacity</TableHead>
              <TableHead className="text-white font-bold text-center py-2 h-10">Fill Rate</TableHead>
              <TableHead className="text-white font-bold text-center py-2 h-10">Avg Attendance</TableHead>
              <TableHead className="text-white font-bold text-center py-2 h-10">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((cls, idx) => (
              <TableRow key={cls.classKey} className="hover:bg-slate-50 h-10">
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={isTop ? "default" : "secondary"} className="h-6">
                      #{idx + 1}
                    </Badge>
                    <span className="font-medium">{cls.className} | {cls.day} {cls.time}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center py-2">
                  <span className="font-semibold text-slate-700">{cls.sessions}</span>
                </TableCell>
                <TableCell className="text-center py-2 font-semibold text-blue-700">{cls.attendance}</TableCell>
                <TableCell className="text-center py-2 text-slate-600">{cls.capacity}</TableCell>
                <TableCell className="text-center py-2">
                  <Badge 
                    className={`metric-badge ${
                      cls.fillRate >= 80 ? 'badge-soft-green' :
                      cls.fillRate >= 60 ? 'badge-soft-yellow' :
                      'badge-soft-red'
                    }`}
                  >
                    {cls.fillRate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-center py-2 text-slate-700">{cls.avgAttendance.toFixed(1)}</TableCell>
                <TableCell className="text-center py-2 font-semibold text-green-700">{formatRevenue(cls.revenue)}</TableCell>
              </TableRow>
            ))}
            {/* Totals Row */}
            <TableRow className="bg-slate-100 font-bold border-t-2 border-slate-300 h-10">
              <TableCell className="py-2">TOTALS</TableCell>
              <TableCell className="text-center py-2">{classes.reduce((sum, c) => sum + c.sessions, 0)}</TableCell>
              <TableCell className="text-center py-2 text-blue-800">{classes.reduce((sum, c) => sum + c.attendance, 0)}</TableCell>
              <TableCell className="text-center py-2">{classes.reduce((sum, c) => sum + c.capacity, 0)}</TableCell>
              <TableCell className="text-center py-2">
                {((classes.reduce((sum, c) => sum + c.attendance, 0) / classes.reduce((sum, c) => sum + c.capacity, 0)) * 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-center py-2">
                {(classes.reduce((sum, c) => sum + c.attendance, 0) / classes.reduce((sum, c) => sum + c.sessions, 0)).toFixed(1)}
              </TableCell>
              <TableCell className="text-center py-2 text-green-800">{formatRevenue(classes.reduce((sum, c) => sum + c.revenue, 0))}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {formatAnalytics.map((formatData) => (
        <Card key={formatData.format} className="shadow-lg border-slate-300">
          <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6" />
                <div>
                  <CardTitle className="text-xl">{formatData.format}</CardTitle>
                  <p className="text-sm text-slate-300 mt-1">Class Performance Analysis</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <div className="text-sm text-slate-300">Total Sessions</div>
                  <div className="text-lg font-bold">{formatData.totalSessions}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-300">Total Attendance</div>
                  <div className="text-lg font-bold">{formatData.totalAttendance}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-300">Avg Fill Rate</div>
                  <div className="text-lg font-bold">{formatData.avgFillRate.toFixed(1)}%</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-300">Total Revenue</div>
                  <div className="text-lg font-bold">{formatCurrency(formatData.totalRevenue)}</div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {renderClassTable(
              formatData.topClasses, 
              `Top 5 ${formatData.format} Classes (by Attendance)`,
              <TrendingUp className="w-5 h-5 text-green-600" />,
              true
            )}
            
            {renderClassTable(
              formatData.bottomClasses, 
              `Bottom 5 ${formatData.format} Classes (by Attendance)`,
              <TrendingDown className="w-5 h-5 text-red-600" />,
              false
            )}
          </CardContent>
          
          <PersistentTableFooter
            tableId={`class-format-${formatData.format.toLowerCase().replace(/\s+/g, '-')}`}
            tableData={[...formatData.topClasses, ...formatData.bottomClasses]}
            tableName={`${formatData.format} Class Performance`}
            tableContext={`Analysis of top and bottom performing ${formatData.format} classes by attendance`}
          />
        </Card>
      ))}
    </div>
  );
};
