import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Zap, Target, TrendingUp, AlertTriangle, CheckCircle, XCircle, BarChart3, Activity } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatPercentage } from '@/utils/formatters';

interface ClassAttendanceEfficiencyTableProps {
  data: SessionData[];
}

export const ClassAttendanceEfficiencyTable: React.FC<ClassAttendanceEfficiencyTableProps> = ({ data }) => {
  const [selectedView, setSelectedView] = useState('overall');

  const efficiencyData = useMemo(() => {
    if (!data || data.length === 0) return { overall: [], timeEfficiency: [], performance: [] };

    // Overall efficiency analysis
    const formatStats = data.reduce((acc, session) => {
      const format = session.cleanedClass || session.classType || 'Unknown';
      if (!acc[format]) {
        acc[format] = {
          format,
          totalSessions: 0,
          totalCapacity: 0,
          totalAttendance: 0,
          totalRevenue: 0,
          totalBooked: 0,
          totalLateCancelled: 0,
          emptySessions: 0,
          underutilizedSessions: 0, // <50% capacity
          optimizedSessions: 0, // 70-90% capacity
          oversoldSessions: 0, // >90% capacity
          revenueGeneratingSessions: 0
        };
      }
      
      acc[format].totalSessions += 1;
      acc[format].totalCapacity += session.capacity || 0;
      acc[format].totalAttendance += session.checkedInCount || 0;
      acc[format].totalRevenue += session.totalPaid || 0;
      acc[format].totalBooked += session.bookedCount || 0;
      acc[format].totalLateCancelled += session.lateCancelledCount || 0;
      
      const attendance = session.checkedInCount || 0;
      const capacity = session.capacity || 0;
      const fillRate = capacity > 0 ? (attendance / capacity) * 100 : 0;
      
      if (attendance === 0) acc[format].emptySessions += 1;
      else if (fillRate < 50) acc[format].underutilizedSessions += 1;
      else if (fillRate >= 70 && fillRate <= 90) acc[format].optimizedSessions += 1;
      else if (fillRate > 90) acc[format].oversoldSessions += 1;
      
      if ((session.totalPaid || 0) > 0) acc[format].revenueGeneratingSessions += 1;
      
      return acc;
    }, {} as Record<string, any>);

    const overallData = Object.values(formatStats).map((stat: any) => ({
      ...stat,
      fillRate: stat.totalCapacity > 0 ? (stat.totalAttendance / stat.totalCapacity) * 100 : 0,
      showUpRate: stat.totalBooked > 0 ? (stat.totalAttendance / stat.totalBooked) * 100 : 0,
      utilizationRate: stat.totalSessions > 0 ? ((stat.totalSessions - stat.emptySessions) / stat.totalSessions) * 100 : 0,
      optimizationRate: stat.totalSessions > 0 ? (stat.optimizedSessions / stat.totalSessions) * 100 : 0,
      efficiencyScore: stat.totalSessions > 0 ? (
        (stat.optimizedSessions * 100 + stat.oversoldSessions * 90 + stat.underutilizedSessions * 40) / 
        (stat.totalSessions * 100)
      ) * 100 : 0,
      revenueEfficiency: stat.totalSessions > 0 ? (stat.revenueGeneratingSessions / stat.totalSessions) * 100 : 0,
      avgRevenue: stat.totalSessions > 0 ? stat.totalRevenue / stat.totalSessions : 0,
      revenuePerCapacity: stat.totalCapacity > 0 ? stat.totalRevenue / stat.totalCapacity : 0
    })).sort((a, b) => b.efficiencyScore - a.efficiencyScore);

    // Time efficiency analysis
    const timeStats = data.reduce((acc, session) => {
      const timeSlot = session.time || 'Unknown';
      if (!acc[timeSlot]) {
        acc[timeSlot] = {
          timeSlot,
          totalSessions: 0,
          totalCapacity: 0,
          totalAttendance: 0,
          totalRevenue: 0,
          emptySessions: 0,
          optimizedSessions: 0,
          formats: new Set()
        };
      }
      
      acc[timeSlot].totalSessions += 1;
      acc[timeSlot].totalCapacity += session.capacity || 0;
      acc[timeSlot].totalAttendance += session.checkedInCount || 0;
      acc[timeSlot].totalRevenue += session.totalPaid || 0;
      acc[timeSlot].formats.add(session.cleanedClass || session.classType);
      
      const attendance = session.checkedInCount || 0;
      const capacity = session.capacity || 0;
      const fillRate = capacity > 0 ? (attendance / capacity) * 100 : 0;
      
      if (attendance === 0) acc[timeSlot].emptySessions += 1;
      else if (fillRate >= 70 && fillRate <= 90) acc[timeSlot].optimizedSessions += 1;
      
      return acc;
    }, {} as Record<string, any>);

    const timeEfficiencyData = Object.values(timeStats).map((stat: any) => ({
      ...stat,
      formatCount: stat.formats.size,
      fillRate: stat.totalCapacity > 0 ? (stat.totalAttendance / stat.totalCapacity) * 100 : 0,
      utilizationRate: stat.totalSessions > 0 ? ((stat.totalSessions - stat.emptySessions) / stat.totalSessions) * 100 : 0,
      optimizationRate: stat.totalSessions > 0 ? (stat.optimizedSessions / stat.totalSessions) * 100 : 0,
      avgRevenue: stat.totalSessions > 0 ? stat.totalRevenue / stat.totalSessions : 0,
      efficiencyScore: stat.totalSessions > 0 && stat.totalCapacity > 0 ? 
        (stat.totalAttendance / stat.totalCapacity) * (stat.totalRevenue / stat.totalSessions) : 0
    })).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    // Performance categories
    const performanceData = overallData.map(item => {
      let category = 'Needs Improvement';
      let categoryColor = 'bg-red-100 text-red-800';
      let recommendations = [];

      if (item.efficiencyScore >= 80) {
        category = 'Excellent';
        categoryColor = 'bg-green-100 text-green-800';
        recommendations.push('Maintain current performance');
      } else if (item.efficiencyScore >= 60) {
        category = 'Good';
        categoryColor = 'bg-yellow-100 text-yellow-800';
        recommendations.push('Minor optimizations needed');
      } else {
        recommendations.push('Major improvements required');
      }

      if (item.fillRate < 60) recommendations.push('Increase marketing');
      if (item.emptySessions > item.totalSessions * 0.1) recommendations.push('Review scheduling');
      if (item.revenueEfficiency < 70) recommendations.push('Improve monetization');

      return {
        ...item,
        category,
        categoryColor,
        recommendations: recommendations.slice(0, 2)
      };
    });

    return {
      overall: overallData,
      timeEfficiency: timeEfficiencyData,
      performance: performanceData
    };
  }, [data]);

  const views = [
    { id: 'overall', label: 'Overall Efficiency', icon: Zap },
    { id: 'timeEfficiency', label: 'Time Slot Analysis', icon: BarChart3 },
    { id: 'performance', label: 'Performance Categories', icon: Target }
  ];

  const getEfficiencyBadge = (score: number) => {
    if (score >= 80) return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Excellent' };
    if (score >= 60) return { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Good' };
    return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Needs Work' };
  };

  const currentData = efficiencyData[selectedView as keyof typeof efficiencyData] || [];

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="w-6 h-6" />
            Efficiency & Optimization Analysis
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {currentData.length} items
            </Badge>
          </CardTitle>
        </div>
        
        {/* View Selector */}
        <div className="flex flex-wrap gap-2 mt-4">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <Button
                key={view.id}
                variant={selectedView === view.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView(view.id)}
                className={`gap-1 text-xs ${selectedView === view.id ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                <Icon className="w-3 h-3" />
                {view.label}
              </Button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <TableHead className="font-semibold text-white sticky left-0 bg-slate-800 z-10">
                  {selectedView === 'timeEfficiency' ? 'Time Slot' : 'Class Format'}
                </TableHead>
                <TableHead className="text-center font-semibold text-white">Sessions</TableHead>
                <TableHead className="text-center font-semibold text-white">Fill Rate</TableHead>
                <TableHead className="text-center font-semibold text-white">Utilization</TableHead>
                <TableHead className="text-center font-semibold text-white">Efficiency Score</TableHead>
                <TableHead className="text-center font-semibold text-white">Session Distribution</TableHead>
                <TableHead className="text-center font-semibold text-white">Revenue</TableHead>
                {selectedView === 'performance' && (
                  <TableHead className="text-center font-semibold text-white">Recommendations</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((row: any, index) => {
                const efficiencyBadge = getEfficiencyBadge(row.efficiencyScore || 0);
                const EfficiencyIcon = efficiencyBadge.icon;
                
                return (
                  <TableRow key={index} className="compact-table-row hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium sticky left-0 bg-white z-10 border-r whitespace-nowrap">
                      <span className="text-gray-900 font-semibold">
                        {selectedView === 'timeEfficiency' ? row.timeSlot : row.format}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({selectedView === 'timeEfficiency' ? `${row.formatCount} formats` : formatNumber(row.totalCapacity)})
                      </span>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <span className="font-medium">{formatNumber(row.totalSessions)}</span>
                      <span className="text-xs text-gray-500 ml-1">({row.emptySessions} empty)</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={`attendance-badge ${
                          row.fillRate >= 80 ? 'badge-soft-green' :
                          row.fillRate >= 60 ? 'badge-soft-yellow' :
                          'badge-soft-red'
                        }`}
                      >
                        {formatPercentage(row.fillRate)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={`attendance-badge ${
                          row.utilizationRate >= 90 ? 'badge-soft-green' :
                          row.utilizationRate >= 70 ? 'badge-soft-yellow' :
                          'badge-soft-red'
                        }`}
                      >
                        {formatPercentage(row.utilizationRate)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <EfficiencyIcon className="w-3 h-3" />
                        <Badge className={`attendance-badge ${efficiencyBadge.color}`}>
                          {formatPercentage(row.efficiencyScore || 0)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        {row.optimizedSessions > 0 && (
                          <span className="flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            {row.optimizedSessions}
                          </span>
                        )}
                        {row.underutilizedSessions > 0 && (
                          <span className="flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3 text-yellow-600" />
                            {row.underutilizedSessions}
                          </span>
                        )}
                        {row.oversoldSessions > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Activity className="w-3 h-3 text-blue-600" />
                            {row.oversoldSessions}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <span className="font-medium">{formatNumber(row.totalRevenue || 0)}</span>
                      <span className="text-xs text-gray-500 ml-1">({formatNumber(row.avgRevenue || 0)})</span>
                    </TableCell>
                    {selectedView === 'performance' && (
                      <TableCell className="text-center whitespace-nowrap">
                        <Badge className={`attendance-badge ${row.categoryColor}`}>
                          {row.category}
                        </Badge>
                      </TableCell>
                    )}
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