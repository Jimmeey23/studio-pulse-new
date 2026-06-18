import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingUp, Target, Users, Calendar, DollarSign, Activity, Zap, ChevronRight } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { ClassAttendanceDrillDownModal } from './ClassAttendanceDrillDownModal';
interface ClassAttendancePerformanceTableProps {
  data: SessionData[];
  location?: string;
}
export const ClassAttendancePerformanceTable: React.FC<ClassAttendancePerformanceTableProps> = ({
  data,
  location
}) => {
  const [selectedMetric, setSelectedMetric] = useState('fillRate');
  const [drillDownModal, setDrillDownModal] = useState<{
    isOpen: boolean;
    classFormat: string;
    stats: any;
  }>({
    isOpen: false,
    classFormat: '',
    stats: null
  });
  const performanceData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const formatStats = data.reduce((acc, session) => {
      const format = session.cleanedClass || session.classType || 'Unknown';
      if (!acc[format]) {
        acc[format] = {
          format,
          totalSessions: 0,
          totalCapacity: 0,
          totalCheckedIn: 0,
          totalRevenue: 0,
          totalBooked: 0,
          totalLateCancelled: 0,
          emptySessions: 0,
          revenueGeneratingSessions: 0
        };
      }
      acc[format].totalSessions += 1;
      acc[format].totalCapacity += session.capacity || 0;
      acc[format].totalCheckedIn += session.checkedInCount || 0;
      acc[format].totalRevenue += session.totalPaid || 0;
      acc[format].totalBooked += session.bookedCount || 0;
      acc[format].totalLateCancelled += session.lateCancelledCount || 0;
      if ((session.checkedInCount || 0) === 0) acc[format].emptySessions += 1;
      if ((session.totalPaid || 0) > 0) acc[format].revenueGeneratingSessions += 1;
      return acc;
    }, {} as Record<string, any>);
    return Object.values(formatStats).map((stat: any) => ({
      ...stat,
      fillRate: stat.totalCapacity > 0 ? stat.totalCheckedIn / stat.totalCapacity * 100 : 0,
      showUpRate: stat.totalBooked > 0 ? stat.totalCheckedIn / stat.totalBooked * 100 : 0,
      utilizationRate: stat.totalSessions > 0 ? (stat.totalSessions - stat.emptySessions) / stat.totalSessions * 100 : 0,
      avgRevenue: stat.totalSessions > 0 ? stat.totalRevenue / stat.totalSessions : 0,
      revenuePerAttendee: stat.totalCheckedIn > 0 ? stat.totalRevenue / stat.totalCheckedIn : 0,
      efficiency: stat.totalCapacity > 0 ? stat.totalRevenue / stat.totalCapacity : 0,
      cancellationRate: stat.totalBooked > 0 ? stat.totalLateCancelled / stat.totalBooked * 100 : 0,
      revenueEfficiency: stat.totalSessions > 0 ? stat.revenueGeneratingSessions / stat.totalSessions * 100 : 0
    })).sort((a, b) => b.totalSessions - a.totalSessions);
  }, [data]);
  const metrics = [{
    id: 'fillRate',
    label: 'Fill Rate',
    icon: Target,
    color: 'blue'
  }, {
    id: 'showUpRate',
    label: 'Show-up Rate',
    icon: Users,
    color: 'green'
  }, {
    id: 'utilizationRate',
    label: 'Utilization',
    icon: Activity,
    color: 'purple'
  }, {
    id: 'avgRevenue',
    label: 'Avg Revenue',
    icon: DollarSign,
    color: 'orange'
  }, {
    id: 'efficiency',
    label: 'Revenue Efficiency',
    icon: TrendingUp,
    color: 'indigo'
  }, {
    id: 'cancellationRate',
    label: 'Cancellation Rate',
    icon: Calendar,
    color: 'red'
  }, {
    id: 'revenueEfficiency',
    label: 'Revenue Sessions %',
    icon: Zap,
    color: 'pink'
  }, {
    id: 'revenuePerAttendee',
    label: 'Revenue per Attendee',
    icon: BarChart3,
    color: 'teal'
  }];
  const getMetricValue = (row: any, metricId: string) => {
    const value = row[metricId];
    switch (metricId) {
      case 'avgRevenue':
      case 'revenuePerAttendee':
      case 'efficiency':
        return formatNumber(value);
      case 'fillRate':
      case 'showUpRate':
      case 'utilizationRate':
      case 'cancellationRate':
      case 'revenueEfficiency':
        return formatPercentage(value);
      default:
        return formatNumber(value);
    }
  };
  const getMetricBadgeColor = (value: number, metricId: string) => {
    if (metricId === 'cancellationRate') {
      if (value <= 10) return 'bg-green-100 text-green-800';
      if (value <= 20) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    } else {
      if (value >= 80) return 'bg-green-100 text-green-800';
      if (value >= 60) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    }
  };
  const handleDrillDown = (classFormat: string, stats: any) => {
    setDrillDownModal({
      isOpen: true,
      classFormat,
      stats: {
        totalSessions: stats.totalSessions,
        totalCapacity: stats.totalCapacity,
        totalCheckedIn: stats.totalCheckedIn,
        totalRevenue: stats.totalRevenue,
        fillRate: stats.fillRate,
        showUpRate: stats.showUpRate,
        avgRevenue: stats.avgRevenue,
        emptySessions: stats.emptySessions
      }
    });
  };
  return <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white border-b-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold">Class Format Performance</div>
              <div className="text-sm text-white/80 font-normal">
                Comprehensive analysis across all class formats
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-white/30">
              {performanceData.length} formats
            </Badge>
          </CardTitle>
        </div>
        
        {/* Metric Selector */}
        <div className="flex flex-wrap gap-1 mt-4">
          {metrics.map(metric => {
          const Icon = metric.icon;
          return <Button key={metric.id} variant={selectedMetric === metric.id ? 'secondary' : 'ghost'} size="sm" onClick={() => setSelectedMetric(metric.id)} className={`gap-2 text-sm transition-all duration-200 ${selectedMetric === metric.id ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                <Icon className="w-4 h-4" />
                {metric.label}
              </Button>;
        })}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="class-attendance-neat-table">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <TableHead className="font-bold text-white sticky left-0 bg-slate-800 z-10 border-r border-white/20">
                  Class Format
                </TableHead>
                <TableHead className="text-center font-bold text-white">
                  Sessions
                </TableHead>
                <TableHead className="text-center font-bold text-white">
                  Capacity
                </TableHead>
                <TableHead className="text-center font-bold text-white">
                  Attendance
                </TableHead>
                <TableHead className="text-center font-bold text-white">
                  Revenue
                </TableHead>
                <TableHead className="text-center font-bold text-white">
                  {metrics.find(m => m.id === selectedMetric)?.label}
                </TableHead>
                <TableHead className="text-center font-bold text-white">
                  Empty Sessions
                </TableHead>
                <TableHead className="text-center font-bold text-white">
                  Performance
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((row, index) => <TableRow key={index} className="cursor-pointer group transition-colors" onClick={() => handleDrillDown(row.format, row)}>
                  <TableCell className="attendance-sticky-cell font-medium sticky left-0 z-10 whitespace-nowrap">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-semibold">{row.format}</span>
                        <span className="text-xs text-slate-500">({formatPercentage(row.utilizationRate)})</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <span className="font-medium">{formatNumber(row.totalSessions)}</span>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <span className="font-medium">{formatNumber(row.totalCapacity)}</span>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <span className="font-medium">{formatNumber(row.totalCheckedIn)}</span>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <span className="font-medium">{formatNumber(row.totalRevenue)}</span>
                    <span className="text-xs text-gray-500 ml-1">({formatNumber(row.avgRevenue)})</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`attendance-badge ${getMetricBadgeColor(row[selectedMetric], selectedMetric)}`}>
                      {getMetricValue(row, selectedMetric)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <span className="font-medium text-red-600">{formatNumber(row.emptySessions)}</span>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant="outline" className="attendance-badge text-xs">
                        {formatPercentage(row.fillRate)}
                      </Badge>
                      <Badge variant="outline" className="attendance-badge text-xs">
                        {formatPercentage(row.showUpRate)}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Drill-down Modal */}
      <ClassAttendanceDrillDownModal isOpen={drillDownModal.isOpen} onClose={() => setDrillDownModal({
      isOpen: false,
      classFormat: '',
      stats: null
    })} classFormat={drillDownModal.classFormat} sessionsData={data} overallStats={drillDownModal.stats || {}} />
    </Card>;
};