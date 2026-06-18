import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ChevronDown, ChevronRight, Search, Filter, Download, Eye, Settings,
  SortAsc, SortDesc, Users, BarChart3, Calendar, MapPin, Clock, 
  TrendingUp, Target, User, Building2, Activity, DollarSign,
  MoreHorizontal, RefreshCw, Grid3x3, List, ChevronLeft, 
  Star, AlertTriangle
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { TrainerNameCell } from '@/components/ui/TrainerAvatar';
import { cn } from '@/lib/utils';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { useRegisterTableForCopy } from '@/hooks/useRegisterTableForCopy';

interface AdvancedClassAttendanceTableProps {
  data: SessionData[];
  location: string;
  onDrillDown?: (data: any) => void;
}

type ViewMode = 'grouped' | 'flat';
type GroupByOption = 'trainer' | 'class' | 'location' | 'day_time' | 'trainer_class' | 'class_day_time_trainer' | 'class_day_time' | 'class_time' | 'class_day' | 'trainer_time' | 'uniqueid1' | 'uniqueid2' | 'period' | 'day_of_week' | 'time_slot' | 'revenue_tier' | 'attendance_tier' | 'trainer_location' | 'class_location' | 'monthly_period' | 'weekly_period' | 'performance_tier' | 'none';

interface ProcessedSession extends SessionData {
  period: string;
  emptyClasses: number;
  nonEmptyClasses: number;
  avgAll: number;
  avgNonEmpty: number;
  lateCancels: number;
  tips: number;
}

interface GroupedData {
  groupKey: string;
  groupLabel: string;
  trainer: string;
  period: string;
  sessions: ProcessedSession[];
  aggregatedMetrics: {
    totalClasses: number;
    emptyClasses: number;
    nonEmptyClasses: number;
    totalCheckedIn: number;
    avgAll: number;
    avgNonEmpty: number;
    totalRevenue: number;
    totalLateCancels: number;
    totalTips: number;
    totalCapacity: number;
    fillRate: number;
    revenuePerClass: number;
    revenuePerAttendee: number;
    utilization: number;
    consistency: number;
    noShowRate: number;
    showUpRate: number;
    attendanceRatio: number;
    cancellationRate: number;
    avgRevenuePerNonEmptyClass: number;
    classEfficiency: number;
    trainerProductivity: number;
    peakAttendance: number;
    avgClassSize: number;
  };
  isExpanded: boolean;
}

export const AdvancedClassAttendanceTable: React.FC<AdvancedClassAttendanceTableProps> = ({ 
  data, 
  location,
  onDrillDown 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [groupBy, setGroupBy] = useState<GroupByOption>('trainer');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Table registration for export functionality
  const tableRef = React.useRef<HTMLDivElement>(null);
  const tableId = `class-attendance-table-${location.toLowerCase().replace(/\s+/g, '-')}`;
  const { getAllTabsText } = useRegisterTableForCopy(tableRef, `Class Attendance Analytics - ${location}`);
  const [expandAll, setExpandAll] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'trainer',
    direction: 'desc'
  });

  // Process raw session data
  const processedData = useMemo((): ProcessedSession[] => {
    return data.map(session => {
      const date = new Date(session.date);
      const monthYear = `${date.toLocaleDateString('en-US', { month: 'short' })}-${date.getFullYear().toString().slice(-2)}`;
      
      return {
        ...session,
        period: monthYear,
        emptyClasses: (session.checkedInCount || 0) === 0 ? 1 : 0,
        nonEmptyClasses: (session.checkedInCount || 0) > 0 ? 1 : 0,
        avgAll: session.checkedInCount || 0,
        avgNonEmpty: (session.checkedInCount || 0) > 0 ? (session.checkedInCount || 0) : 0,
        lateCancels: session.lateCancelledCount || 0,
        tips: 0    // Would need tips data integration
      };
    });
  }, [data]);

  // Group data based on selected grouping
  const groupedData = useMemo((): GroupedData[] => {
    if (viewMode === 'flat' || groupBy === 'none') {
      return [];
    }

    const groups = new Map<string, ProcessedSession[]>();

    processedData.forEach(session => {
      let groupKey = '';
      let groupLabel = '';

      switch (groupBy) {
        case 'trainer':
          groupKey = session.trainerName || 'Unknown';
          groupLabel = session.trainerName || 'Unknown Trainer';
          break;
        case 'class':
          groupKey = session.cleanedClass || 'Unknown';
          groupLabel = session.cleanedClass || 'Unknown Class';
          break;
        case 'location':
          groupKey = session.location || 'Unknown';
          groupLabel = session.location || 'Unknown Location';
          break;
        case 'day_time':
          groupKey = `${session.dayOfWeek}-${session.time}`;
          groupLabel = `${session.dayOfWeek} ${session.time}`;
          break;
        case 'trainer_class':
          groupKey = `${session.trainerName}-${session.cleanedClass}`;
          groupLabel = `${session.trainerName} - ${session.cleanedClass}`;
          break;
        case 'class_day_time_trainer':
          groupKey = `${session.cleanedClass}-${session.dayOfWeek}-${session.time}-${session.trainerName}`;
          groupLabel = `${session.cleanedClass} | ${session.dayOfWeek} ${session.time} | ${session.trainerName}`;
          break;
        case 'class_day_time':
          groupKey = `${session.cleanedClass}-${session.dayOfWeek}-${session.time}`;
          groupLabel = `${session.cleanedClass} | ${session.dayOfWeek} ${session.time}`;
          break;
        case 'class_time':
          groupKey = `${session.cleanedClass}-${session.time}`;
          groupLabel = `${session.cleanedClass} | ${session.time}`;
          break;
        case 'class_day':
          groupKey = `${session.cleanedClass}-${session.dayOfWeek}`;
          groupLabel = `${session.cleanedClass} | ${session.dayOfWeek}`;
          break;
        case 'trainer_time':
          groupKey = `${session.trainerName}-${session.time}`;
          groupLabel = `${session.trainerName} | ${session.time}`;
          break;
        case 'uniqueid1':
          groupKey = session.uniqueId1 || 'Unknown';
          groupLabel = session.uniqueId1 || 'Unknown UniqueID1';
          break;
        case 'uniqueid2':
          groupKey = session.uniqueId2 || 'Unknown';
          groupLabel = session.uniqueId2 || 'Unknown UniqueID2';
          break;
        case 'period':
          groupKey = session.period || 'Unknown';
          groupLabel = session.period || 'Unknown Period';
          break;
        case 'day_of_week':
          groupKey = session.dayOfWeek || 'Unknown';
          groupLabel = session.dayOfWeek || 'Unknown Day';
          break;
        case 'time_slot':
          const hour = parseInt(session.time?.split(':')[0] || '0');
          if (hour < 8) {
            groupKey = 'early_morning';
            groupLabel = 'Early Morning (5-8 AM)';
          } else if (hour < 12) {
            groupKey = 'morning';
            groupLabel = 'Morning (8 AM-12 PM)';
          } else if (hour < 17) {
            groupKey = 'afternoon';
            groupLabel = 'Afternoon (12-5 PM)';
          } else {
            groupKey = 'evening';
            groupLabel = 'Evening (5+ PM)';
          }
          break;
        case 'revenue_tier':
          const revenue = session.totalPaid || 0;
          if (revenue === 0) {
            groupKey = 'no_revenue';
            groupLabel = 'No Revenue';
          } else if (revenue < 100) {
            groupKey = 'low_revenue';
            groupLabel = 'Low Revenue ($0-$100)';
          } else if (revenue < 300) {
            groupKey = 'medium_revenue';
            groupLabel = 'Medium Revenue ($100-$300)';
          } else {
            groupKey = 'high_revenue';
            groupLabel = 'High Revenue ($300+)';
          }
          break;
        case 'attendance_tier':
          const attendance = session.checkedInCount || 0;
          if (attendance === 0) {
            groupKey = 'empty';
            groupLabel = 'Empty Class';
          } else if (attendance < 5) {
            groupKey = 'low_attendance';
            groupLabel = 'Low Attendance (1-4)';
          } else if (attendance < 10) {
            groupKey = 'medium_attendance';
            groupLabel = 'Medium Attendance (5-9)';
          } else {
            groupKey = 'high_attendance';
            groupLabel = 'High Attendance (10+)';
          }
          break;
        case 'trainer_location':
          groupKey = `${session.trainerName}-${session.location}`;
          groupLabel = `${session.trainerName} @ ${session.location}`;
          break;
        case 'class_location':
          groupKey = `${session.cleanedClass}-${session.location}`;
          groupLabel = `${session.cleanedClass} @ ${session.location}`;
          break;
        case 'monthly_period':
          const date = new Date(session.date);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          groupKey = monthKey;
          groupLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          break;
        case 'weekly_period':
          const sessionDate = new Date(session.date);
          const weekStart = new Date(sessionDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          groupKey = weekStart.toISOString().split('T')[0];
          groupLabel = `Week of ${weekStart.toLocaleDateString()}`;
          break;
        case 'performance_tier':
          const capacity = session.capacity || 1;
          const fillRate = ((session.checkedInCount || 0) / capacity) * 100;
          if (fillRate === 0) {
            groupKey = 'no_show';
            groupLabel = 'No Show';
          } else if (fillRate < 50) {
            groupKey = 'low_performance';
            groupLabel = 'Low Performance (<50%)';
          } else if (fillRate < 80) {
            groupKey = 'good_performance';
            groupLabel = 'Good Performance (50-80%)';
          } else {
            groupKey = 'excellent_performance';
            groupLabel = 'Excellent Performance (80%+)';
          }
          break;
        default:
          groupKey = 'all';
          groupLabel = 'All Sessions';
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(session);
    });

    return Array.from(groups.entries()).map(([groupKey, sessions]) => {
      const totalClasses = sessions.length;
      const emptyClasses = sessions.filter(s => (s.checkedInCount || 0) === 0).length;
      const nonEmptyClasses = totalClasses - emptyClasses;
      const totalCheckedIn = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const totalLateCancels = sessions.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);
      
      // Calculate advanced metrics with 1 decimal precision
      const avgAll = totalClasses > 0 ? Number((totalCheckedIn / totalClasses).toFixed(1)) : 0;
      const avgNonEmpty = nonEmptyClasses > 0 ? Number((totalCheckedIn / nonEmptyClasses).toFixed(1)) : 0;
      const fillRate = totalCapacity > 0 ? Number(((totalCheckedIn / totalCapacity) * 100).toFixed(1)) : 0;
      const revenuePerClass = totalClasses > 0 ? Number((totalRevenue / totalClasses).toFixed(1)) : 0;
      const revenuePerAttendee = totalCheckedIn > 0 ? Number((totalRevenue / totalCheckedIn).toFixed(1)) : 0;
      
      // Calculate additional metrics
      const utilization = totalCapacity > 0 ? Number(((totalCheckedIn / totalCapacity) * 100).toFixed(1)) : 0;
      const attendanceRatio = totalClasses > 0 ? Number((nonEmptyClasses / totalClasses * 100).toFixed(1)) : 0;
      const cancellationRate = (totalCheckedIn + totalLateCancels) > 0 ? Number((totalLateCancels / (totalCheckedIn + totalLateCancels) * 100).toFixed(1)) : 0;
      const avgRevenuePerNonEmptyClass = nonEmptyClasses > 0 ? Number((totalRevenue / nonEmptyClasses).toFixed(1)) : 0;
      const classEfficiency = totalCapacity > 0 ? Number(((totalRevenue / totalCapacity)).toFixed(1)) : 0;
      const trainerProductivity = sessions.length > 0 ? Number((totalRevenue / sessions.length).toFixed(1)) : 0;
      const peakAttendance = Math.max(...sessions.map(s => s.checkedInCount || 0), 0);
      const avgClassSize = totalClasses > 0 ? Number(((totalCheckedIn + totalLateCancels) / totalClasses).toFixed(1)) : 0;
      
      // Calculate consistency (lower variance = higher consistency)
      const attendanceValues = sessions.map(s => s.checkedInCount || 0);
      const attendanceMean = attendanceValues.reduce((sum, val) => sum + val, 0) / attendanceValues.length;
      const attendanceVariance = attendanceValues.reduce((sum, val) => sum + Math.pow(val - attendanceMean, 2), 0) / attendanceValues.length;
      const consistency = attendanceMean > 0 ? Number(Math.max(0, 100 - (Math.sqrt(attendanceVariance) / attendanceMean * 100)).toFixed(1)) : 0;
      
      // Calculate show-up and no-show rates with 1 decimal precision
      const totalBooked = sessions.reduce((sum, s) => sum + (s.bookedCount || s.checkedInCount || 0), 0);
      const noShowRate = totalBooked > 0 ? Number(((totalLateCancels / totalBooked) * 100).toFixed(1)) : 0;
      const showUpRate = Number((100 - noShowRate).toFixed(1));

      // Get primary trainer and period for display
      const primaryTrainer = sessions[0]?.trainerName || 'Unknown';
      const primaryPeriod = sessions[0]?.period || 'Unknown';

      // Use the groupLabel computed in the switch statement above
      let groupLabel = '';
      switch (groupBy) {
        case 'trainer':
          groupLabel = primaryTrainer || 'Unknown Trainer';
          break;
        case 'class':
          groupLabel = sessions[0]?.cleanedClass || 'Unknown Class';
          break;
        case 'location':
          groupLabel = sessions[0]?.location || 'Unknown Location';
          break;
        case 'day_time':
          groupLabel = `${sessions[0]?.dayOfWeek} ${sessions[0]?.time}`;
          break;
        case 'trainer_class':
          groupLabel = `${primaryTrainer} - ${sessions[0]?.cleanedClass}`;
          break;
        case 'class_day_time_trainer':
          groupLabel = `${sessions[0]?.cleanedClass} | ${sessions[0]?.dayOfWeek} ${sessions[0]?.time} | ${primaryTrainer}`;
          break;
        case 'class_day_time':
          groupLabel = `${sessions[0]?.cleanedClass} | ${sessions[0]?.dayOfWeek} ${sessions[0]?.time}`;
          break;
        case 'class_time':
          groupLabel = `${sessions[0]?.cleanedClass} | ${sessions[0]?.time}`;
          break;
        case 'class_day':
          groupLabel = `${sessions[0]?.cleanedClass} | ${sessions[0]?.dayOfWeek}`;
          break;
        case 'trainer_time':
          groupLabel = `${primaryTrainer} | ${sessions[0]?.time}`;
          break;
        case 'uniqueid1':
          groupLabel = sessions[0]?.uniqueId1 || 'Unknown UniqueID1';
          break;
        case 'uniqueid2':
          groupLabel = sessions[0]?.uniqueId2 || 'Unknown UniqueID2';
          break;
        default:
          groupLabel = 'All Sessions';
      }

      return {
        groupKey,
        groupLabel,
        trainer: primaryTrainer,
        period: primaryPeriod,
        sessions,
        aggregatedMetrics: {
          totalClasses,
          emptyClasses,
          nonEmptyClasses,
          totalCheckedIn,
          avgAll,
          avgNonEmpty,
          totalRevenue,
          totalLateCancels,
          totalTips: 0,
          totalCapacity,
          fillRate,
          revenuePerClass,
          revenuePerAttendee,
          utilization,
          consistency,
          noShowRate,
          showUpRate,
          attendanceRatio,
          cancellationRate,
          avgRevenuePerNonEmptyClass,
          classEfficiency,
          trainerProductivity,
          peakAttendance,
          avgClassSize
        },
        isExpanded: expandedGroups.has(groupKey) || expandAll
      };
    }).sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a.trainer.localeCompare(b.trainer);
      } else {
        return b.trainer.localeCompare(a.trainer);
      }
    });
  }, [processedData, groupBy, viewMode, expandedGroups, expandAll, sortConfig]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return viewMode === 'grouped' ? groupedData : processedData;
    }

    const searchLower = searchTerm.toLowerCase();
    
    if (viewMode === 'grouped') {
      return groupedData.filter(group => 
        group.trainer.toLowerCase().includes(searchLower) ||
        group.groupLabel.toLowerCase().includes(searchLower) ||
        group.sessions.some(session => 
          (session.cleanedClass || '').toLowerCase().includes(searchLower) ||
          (session.location || '').toLowerCase().includes(searchLower)
        )
      );
    } else {
      return processedData.filter(session =>
        (session.trainerName || '').toLowerCase().includes(searchLower) ||
        (session.cleanedClass || '').toLowerCase().includes(searchLower) ||
        (session.location || '').toLowerCase().includes(searchLower)
      );
    }
  }, [groupedData, processedData, searchTerm, viewMode]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return (filteredData as any[]).slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((filteredData as any[]).length / itemsPerPage);

  // Export handler
  const handleExportCSV = React.useCallback(() => {
    const headers = [
      groupBy === 'trainer' ? 'Trainer' :
      groupBy === 'class' ? 'Class Type' :
      groupBy === 'location' ? 'Location' :
      'Group',
      'Period',
      'Total Classes',
      'Empty Classes', 
      'Non-Empty Classes',
      'Total Checked In',
      'Avg All Classes',
      'Avg Non-Empty',
      'Late Cancels',
      'Fill Rate %',
      'Revenue',
      'Revenue/Class',
      'Revenue/Attendee'
    ];
    
    const csvRows = [headers.join(',')];
    
    if (viewMode === 'flat') {
      processedData.forEach(session => {
        const row = [
          session.trainerName || 'Unknown',
          session.period || '',
          '1', // Individual session counts as 1 class
          (session.checkedInCount || 0) === 0 ? '1' : '0',
          (session.checkedInCount || 0) > 0 ? '1' : '0',
          session.checkedInCount || 0,
          session.checkedInCount || 0,
          (session.checkedInCount || 0) > 0 ? session.checkedInCount || 0 : 0,
          session.lateCancelledCount || 0,
          session.capacity ? ((session.checkedInCount || 0) / session.capacity * 100).toFixed(1) : '0',
          (session.totalPaid || 0).toFixed(0),
          (session.totalPaid || 0).toFixed(0),
          (session.checkedInCount && session.checkedInCount > 0) ? ((session.totalPaid || 0) / session.checkedInCount).toFixed(0) : '0'
        ];
        csvRows.push(row.join(','));
      });
    } else {
      groupedData.forEach(group => {
        const row = [
          group.groupLabel,
          group.period,
          group.aggregatedMetrics.totalClasses,
          group.aggregatedMetrics.emptyClasses,
          group.aggregatedMetrics.nonEmptyClasses,
          group.aggregatedMetrics.totalCheckedIn,
          group.aggregatedMetrics.avgAll.toFixed(1),
          group.aggregatedMetrics.avgNonEmpty.toFixed(1),
          group.aggregatedMetrics.lateCancels,
          group.aggregatedMetrics.fillRate.toFixed(1),
          formatCurrency(group.aggregatedMetrics.totalRevenue).replace(',', ''),
          formatCurrency(group.aggregatedMetrics.revenuePerClass).replace(',', ''),
          formatCurrency(group.aggregatedMetrics.revenuePerAttendee).replace(',', '')
        ];
        csvRows.push(row.join(','));
      });
    }
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-attendance-${location.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [processedData, groupedData, groupBy, location, viewMode]);

  // Event handlers
  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  const toggleExpandAll = useCallback(() => {
    setExpandAll(prev => !prev);
    if (!expandAll) {
      // Expand all groups
      const allGroupKeys = groupedData.map(g => g.groupKey);
      setExpandedGroups(new Set(allGroupKeys));
    } else {
      // Collapse all groups
      setExpandedGroups(new Set());
    }
  }, [expandAll, groupedData]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <div className="w-4 h-4" />;
    }
    return sortConfig.direction === 'asc' ? 
      <SortAsc className="w-4 h-4 text-blue-200" /> : 
      <SortDesc className="w-4 h-4 text-blue-200" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  };

  // Remove the old TrainerAvatar component since we're importing the proper one

  const ClassTypeBadge: React.FC<{ type: string; count?: number }> = ({ type, count }) => {
    const getBadgeColor = (classType: string) => {
      if (classType.toLowerCase().includes('barre')) return 'bg-pink-100 text-pink-800 border-pink-200';
      if (classType.toLowerCase().includes('cardio')) return 'bg-red-100 text-red-800 border-red-200';
      if (classType.toLowerCase().includes('power')) return 'bg-orange-100 text-orange-800 border-orange-200';
      if (classType.toLowerCase().includes('recovery')) return 'bg-green-100 text-green-800 border-green-200';
      return 'bg-blue-100 text-blue-800 border-blue-200';
    };

    return (
      <div className="flex items-center gap-2">
        <Badge className={cn('text-xs font-medium px-2 py-1', getBadgeColor(type))}>
          {type}
        </Badge>
        {count && count > 1 && (
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full bg-white shadow-lg border-0 rounded-xl overflow-visible">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-6 rounded-t-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
              Class Analytics Dashboard
            </CardTitle>
            <p className="text-slate-600">Comprehensive view of your class performance data</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900">{data.length}</div>
            <div className="text-sm text-slate-500">Total Records</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search classes, trainers, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-slate-200"
            />
          </div>

          {/* Group By */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupByOption)}>
              <SelectTrigger className="w-[220px] bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="class">Class Type</SelectItem>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="uniqueid1">Group by Class</SelectItem>
                <SelectItem value="uniqueid2">Group by Class & Trainer</SelectItem>
                <SelectItem value="day_time">Day + Time</SelectItem>
                <SelectItem value="trainer_class">Trainer + Class</SelectItem>
                <SelectItem value="class_day_time_trainer">Class + Day + Time + Trainer</SelectItem>
                <SelectItem value="class_day_time">Class + Day + Time</SelectItem>
                <SelectItem value="class_time">Class + Time</SelectItem>
                <SelectItem value="class_day">Class + Day</SelectItem>
                <SelectItem value="trainer_time">Trainer + Time</SelectItem>
                <SelectItem value="period">Period</SelectItem>
                <SelectItem value="day_of_week">Day of Week</SelectItem>
                <SelectItem value="time_slot">Time Slot</SelectItem>
                <SelectItem value="revenue_tier">Revenue Tier</SelectItem>
                <SelectItem value="attendance_tier">Attendance Tier</SelectItem>
                <SelectItem value="trainer_location">Trainer + Location</SelectItem>
                <SelectItem value="class_location">Class + Location</SelectItem>
                <SelectItem value="monthly_period">Monthly Period</SelectItem>
                <SelectItem value="weekly_period">Weekly Period</SelectItem>
                <SelectItem value="performance_tier">Performance Tier</SelectItem>
                <SelectItem value="none">No Grouping</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grouped')}
              className="flex items-center gap-2"
            >
              <Grid3x3 className="w-4 h-4" />
              Grouped
            </Button>
            <Button
              variant={viewMode === 'flat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('flat')}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Flat
            </Button>
          </div>

          {/* Expand All */}
          {viewMode === 'grouped' && (
            <div className="flex items-center gap-2">
              <Switch
                id="expand-all"
                checked={expandAll}
                onCheckedChange={toggleExpandAll}
              />
              <Label htmlFor="expand-all" className="text-sm font-medium text-slate-700">
                Expand All
              </Label>
            </div>
          )}

          {/* Export */}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 rounded-b-xl">
        <div 
          ref={tableRef}
          className="relative w-full overflow-x-auto overflow-y-auto max-h-[650px] custom-scrollbar border-t border-slate-200 rounded-b-xl" 
          style={{ display: 'block' }}
          data-table={tableId}
        >
          <Table className="min-w-[2000px] w-max">
            <TableHeader className="sticky top-0 z-20">
              <TableRow className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b-2 border-slate-900 shadow-lg">
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-slate-100 transition-colors w-[200px] sticky left-0 z-30 h-9 max-h-9 bg-gradient-to-r from-slate-800 to-slate-900"
                  onClick={() => handleSort('trainer')}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {groupBy === 'trainer' ? 'TRAINER' :
                     groupBy === 'class' ? 'CLASS TYPE' :
                     groupBy === 'location' ? 'LOCATION' :
                     groupBy === 'day_time' ? 'DAY & TIME' :
                     groupBy === 'trainer_class' ? 'TRAINER & CLASS' :
                     groupBy === 'class_day_time_trainer' ? 'CLASS | DAY & TIME | TRAINER' :
                     groupBy === 'class_day_time' ? 'CLASS | DAY & TIME' :
                     groupBy === 'class_time' ? 'CLASS | TIME' :
                     groupBy === 'class_day' ? 'CLASS | DAY' :
                     groupBy === 'trainer_time' ? 'TRAINER | TIME' :
                     groupBy === 'uniqueid1' ? 'GROUP BY CLASS' :
                     groupBy === 'uniqueid2' ? 'GROUP BY CLASS & TRAINER' : 'PRIMARY'}
                    </span>
                    {getSortIcon('trainer')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-slate-100 transition-colors w-[80px] h-9 max-h-9"
                  onClick={() => handleSort('period')}
                >
                  <div className="flex items-center gap-1 justify-center">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">PERIOD</span>
                    {getSortIcon('period')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-slate-100 transition-colors w-[100px] h-9 max-h-9"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1 justify-center">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">DATE</span>
                    {getSortIcon('date')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-slate-100 transition-colors w-[130px] h-9 max-h-9"
                  onClick={() => handleSort('classType')}
                >
                  <div className="flex items-center gap-1 justify-center">
                    <Activity className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">CLASS TYPE</span>
                    {getSortIcon('classType')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-slate-100 transition-colors w-[80px] h-9 max-h-9"
                  onClick={() => handleSort('day')}
                >
                  <div className="flex items-center gap-1 justify-center">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">DAY</span>
                    {getSortIcon('day')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-slate-100 transition-colors w-[70px] h-9 max-h-9"
                  onClick={() => handleSort('time')}
                >
                  <div className="flex items-center gap-1 justify-center">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">TIME</span>
                    {getSortIcon('time')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-white cursor-pointer hover:text-slate-100 transition-colors w-[130px] h-9 max-h-9"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center gap-1 justify-center">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">LOCATION</span>
                    {getSortIcon('location')}
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[70px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <BarChart3 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">CLASSES</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[70px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span className="text-xs whitespace-nowrap">EMPTY</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-4 h-4 flex-shrink-0 text-green-400" />
                    <span className="text-xs whitespace-nowrap">NON-EMPTY</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">CHECKED IN</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <Activity className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">AVG (ALL)</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[90px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">AVG (NON-E)</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[100px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">REVENUE</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4 flex-shrink-0 text-orange-400" />
                    LATE CANCEL
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <Building2 className="w-4 h-4 flex-shrink-0 text-blue-400" />
                    <span className="text-xs whitespace-nowrap">CAPACITY</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-4 h-4 flex-shrink-0 text-purple-400" />
                    <span className="text-xs whitespace-nowrap">FILL RATE</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[90px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <span className="text-xs whitespace-nowrap">REV/CLASS</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[90px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4 flex-shrink-0 text-teal-400" />
                    <span className="text-xs whitespace-nowrap">REV/ATTEND</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <Activity className="w-4 h-4 flex-shrink-0 text-cyan-400" />
                    <span className="text-xs whitespace-nowrap">CONSISTENCY</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[80px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4 flex-shrink-0 text-indigo-400" />
                    <span className="text-xs whitespace-nowrap">SHOW-UP %</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[90px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <BarChart3 className="w-4 h-4 flex-shrink-0 text-purple-400" />
                    <span className="text-xs whitespace-nowrap">UTILIZATION</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[85px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-4 h-4 flex-shrink-0 text-orange-400" />
                    <span className="text-xs whitespace-nowrap">ATT. RATIO</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[90px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-yellow-400" />
                    <span className="text-xs whitespace-nowrap">CANCEL %</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[100px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <span className="text-xs whitespace-nowrap">REV/NONEMPTY</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[95px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <Activity className="w-4 h-4 flex-shrink-0 text-pink-400" />
                    <span className="text-xs whitespace-nowrap">EFFICIENCY</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[90px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 flex-shrink-0 text-amber-400" />
                    <span className="text-xs whitespace-nowrap">PEAK ATT.</span>
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center w-[85px] h-9 max-h-9">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="w-4 h-4 flex-shrink-0 text-cyan-400" />
                    <span className="text-xs whitespace-nowrap">AVG SIZE</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewMode === 'grouped' ? (
                // Grouped view
                paginatedData.map((group: GroupedData) => (
                  <React.Fragment key={group.groupKey}>
                    {/* Group header row */}
                    <TableRow 
                      className="bg-white hover:bg-gray-50 transition-colors border-l-4 border-l-blue-600 cursor-pointer h-9 max-h-9"
                      onClick={() => toggleGroup(group.groupKey)}
                    >
                      <TableCell className="py-2 sticky left-0 z-20 bg-white hover:bg-gray-50 transition-colors h-9 max-h-9 whitespace-nowrap overflow-hidden text-ellipsis">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                            {group.isExpanded ? 
                              <ChevronDown className="h-4 w-4 text-black" /> : 
                              <ChevronRight className="h-4 w-4 text-black" />
                            }
                          </Button>
                          <TrainerNameCell name={group.groupLabel} className="flex-shrink-0" showName={false} />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-black whitespace-nowrap overflow-hidden text-ellipsis">{group.groupLabel}</div>
                            <div className="text-xs text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">
                              {group.aggregatedMetrics.totalClasses} classes
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 h-9 max-h-9">
                        <div className="font-medium text-xs text-black bg-white">
                          {group.period}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-slate-500 text-sm h-9 max-h-9">
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">Multiple</span>
                      </TableCell>
                      <TableCell className="py-2 h-9 max-h-9">
                        <div className="text-slate-500 text-sm whitespace-nowrap overflow-hidden text-ellipsis">Multiple</div>
                      </TableCell>
                      <TableCell className="py-2 text-slate-500 text-sm h-9 max-h-9">
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">Various</span>
                      </TableCell>
                      <TableCell className="py-2 text-slate-500 text-sm h-9 max-h-9">
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">Various</span>
                      </TableCell>
                      <TableCell className="py-2 text-slate-500 text-sm h-9 max-h-9">
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">Multiple</span>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="bg-white text-blue-900 text-xs font-bold">
                          {group.aggregatedMetrics.totalClasses}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="bg-white text-red-900 text-xs font-bold">
                          {group.aggregatedMetrics.emptyClasses}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="bg-white text-green-900 text-xs font-bold">
                          {group.aggregatedMetrics.nonEmptyClasses}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="font-bold text-slate-900 text-sm">
                          {group.aggregatedMetrics.totalCheckedIn}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="font-medium text-slate-700 text-sm">
                          {group.aggregatedMetrics.avgAll.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="font-medium text-slate-700 text-sm">
                          {group.aggregatedMetrics.avgNonEmpty.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="font-bold text-green-700 text-sm">
                          {formatCurrency(group.aggregatedMetrics.totalRevenue)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="font-medium text-orange-700 text-sm">
                          {group.aggregatedMetrics.totalLateCancels}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="font-medium text-blue-700 text-sm">
                          {formatNumber(group.aggregatedMetrics.totalCapacity)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className={cn(
                          "bg-white text-xs font-bold",
                          group.aggregatedMetrics.fillRate >= 80 ? "text-green-900" :
                          group.aggregatedMetrics.fillRate >= 60 ? "text-yellow-900" :
                          "text-red-900"
                        )}>
                          {group.aggregatedMetrics.fillRate.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="font-medium text-emerald-700 text-sm">
                          {formatCurrency(group.aggregatedMetrics.revenuePerClass)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="font-medium text-teal-700 text-sm">
                          {formatCurrency(group.aggregatedMetrics.revenuePerAttendee)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className={cn(
                          "bg-white text-xs font-bold",
                          group.aggregatedMetrics.consistency >= 80 ? "text-green-900" :
                          group.aggregatedMetrics.consistency >= 60 ? "text-yellow-900" :
                          "text-red-900"
                        )}>
                          {group.aggregatedMetrics.consistency.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className={cn(
                          "bg-white text-xs font-bold",
                          group.aggregatedMetrics.showUpRate >= 90 ? "text-green-900" :
                          group.aggregatedMetrics.showUpRate >= 75 ? "text-yellow-900" :
                          "text-red-900"
                        )}>
                          {group.aggregatedMetrics.showUpRate.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="bg-white text-xs font-bold text-purple-900">
                          {group.aggregatedMetrics.utilization.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="bg-white text-xs font-bold text-orange-900">
                          {group.aggregatedMetrics.attendanceRatio.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="bg-white text-xs font-bold text-yellow-900">
                          {group.aggregatedMetrics.cancellationRate.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="bg-white text-xs font-bold text-emerald-900">
                          {formatCurrency(group.aggregatedMetrics.avgRevenuePerNonEmptyClass)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="bg-white text-xs font-bold text-pink-900">
                          {formatCurrency(group.aggregatedMetrics.classEfficiency)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="bg-white text-xs font-bold text-amber-900">
                          {group.aggregatedMetrics.peakAttendance}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center h-9 max-h-9">
                        <div className="bg-white text-xs font-bold text-cyan-900">
                          {group.aggregatedMetrics.avgClassSize.toFixed(1)}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Individual session rows */}
                    {group.isExpanded && group.sessions.map((session, index) => (
                      <TableRow 
                        key={`${group.groupKey}-${index}`}
                        className="bg-white hover:bg-gray-50 transition-colors border-l-4 border-l-transparent hover:border-l-gray-300"
                      >
                        <TableCell className="py-2 pl-12 h-9 max-h-9">
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <TrainerNameCell name={session.trainerName || 'Unknown'} showName={false} />
                            </div>
                            <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                              <div className="text-sm font-medium text-black whitespace-nowrap overflow-hidden text-ellipsis">{session.trainerName}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 h-9 max-h-9">
                          <div className="text-xs font-bold text-black bg-white">
                            {session.period}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 h-9 max-h-9">
                          <div className="text-sm font-medium text-black whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatDate(session.date)}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 h-9 max-h-9">
                          <div className="text-xs font-medium text-black bg-white whitespace-nowrap overflow-hidden text-ellipsis">
                            {session.cleanedClass || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 h-9 max-h-9">
                          <div className="text-sm text-black whitespace-nowrap overflow-hidden text-ellipsis">
                            {session.dayOfWeek}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 h-9 max-h-9">
                          <div className="text-sm font-medium text-black whitespace-nowrap overflow-hidden text-ellipsis">
                            {session.time}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 h-9 max-h-9">
                          <div className="text-sm text-black whitespace-nowrap overflow-hidden text-ellipsis">
                            {session.location}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="bg-white text-black font-bold text-xs">
                            1
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className={cn(
                            "bg-white font-bold text-xs",
                            session.emptyClasses > 0 ? "text-red-800" : "text-gray-600"
                          )}>
                            {session.emptyClasses}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className={cn(
                            "bg-white font-bold text-xs",
                            session.nonEmptyClasses > 0 ? "text-green-800" : "text-gray-600"
                          )}>
                            {session.nonEmptyClasses}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs font-medium text-black">
                            {session.checkedInCount || 0}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            {session.checkedInCount || 0}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            {(session.checkedInCount || 0) > 0 ? (session.checkedInCount || 0) : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs font-medium text-black whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatCurrency(session.totalPaid || 0)}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            {session.lateCancelledCount || 0}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            {session.capacity || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs font-medium text-black">
                            {session.capacity && session.checkedInCount ? 
                              `${((session.checkedInCount / session.capacity) * 100).toFixed(1)}%` : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs font-medium text-black">
                            {session.totalPaid && session.checkedInCount ? 
                              formatCurrency(session.totalPaid / 1) : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs font-medium text-black">
                            {session.totalPaid && session.checkedInCount ? 
                              formatCurrency(session.totalPaid / session.checkedInCount) : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            -
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            -
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            {session.capacity && session.checkedInCount ? 
                              `${((session.checkedInCount / session.capacity) * 100).toFixed(1)}%` : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            {session.checkedInCount > 0 ? '100%' : '0%'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            {session.lateCancelledCount && (session.checkedInCount + session.lateCancelledCount) ? 
                              `${(session.lateCancelledCount / (session.checkedInCount + session.lateCancelledCount) * 100).toFixed(1)}%` : '0%'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            {session.checkedInCount > 0 ? formatCurrency(session.totalPaid || 0) : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            {session.capacity ? formatCurrency((session.totalPaid || 0) / session.capacity) : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            {session.checkedInCount || 0}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center h-9 max-h-9">
                          <div className="text-xs text-black">
                            {(session.checkedInCount || 0) + (session.lateCancelledCount || 0)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                // Flat view
                paginatedData.map((session: ProcessedSession, index) => (
                  <TableRow 
                    key={index}
                    className="bg-white hover:bg-gray-50 transition-colors border-l-4 border-l-transparent hover:border-l-gray-300 h-9 max-h-9"
                  >
                    <TableCell className="py-2 h-9 max-h-9">
                      <div className="flex items-center gap-3">
                        <TrainerNameCell name={session.trainerName || 'Unknown'} />
                      </div>
                    </TableCell>
                    <TableCell className="py-2 h-9 max-h-9">
                      <div className="font-medium text-black text-xs">
                        {session.period}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 h-9 max-h-9">
                      <div className="font-medium text-black text-xs">
                        {formatDate(session.date)}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 h-9 max-h-9">
                      <div className="text-xs font-medium text-black bg-white whitespace-nowrap overflow-hidden text-ellipsis">
                        {session.cleanedClass || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 h-9 max-h-9">
                      <div className="text-black text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                        {session.dayOfWeek}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 h-9 max-h-9">
                      <div className="font-medium text-black text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                        {session.time}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 h-9 max-h-9">
                      <div className="text-black text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                        {session.location}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-center h-9 max-h-9">
                      <div className="bg-white text-black font-medium text-xs">
                        1
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-center h-9 max-h-9">
                      <div className={cn(
                        "bg-white font-medium text-xs",
                        session.emptyClasses > 0 ? "text-red-800" : "text-gray-600"
                      )}>
                        {session.emptyClasses}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-center h-9 max-h-9">
                      <div className={cn(
                        "bg-white font-medium text-xs",
                        session.nonEmptyClasses > 0 ? "text-green-800" : "text-gray-600"
                      )}>
                        {session.nonEmptyClasses}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-center h-9 max-h-9">
                      <div className="font-bold text-slate-900 text-xs">
                        {session.checkedInCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-center h-9 max-h-9">
                      <div className="font-medium text-slate-700 text-xs">
                        {session.checkedInCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-center h-9 max-h-9">
                      <div className="font-medium text-slate-700 text-xs">
                        {(session.checkedInCount || 0) > 0 ? (session.checkedInCount || 0) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-center h-9 max-h-9">
                      <div className="font-bold text-green-700 text-xs">
                        {formatCurrency(session.totalPaid || 0)}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-center h-9 max-h-9">
                      <div className="font-medium text-orange-700 text-xs">
                        {session.lateCancelledCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center text-slate-400">
                      -
                    </TableCell>
                    <TableCell className="py-4 text-center text-slate-400">
                      -
                    </TableCell>
                  </TableRow>
                ))
              )}
              {/* Totals row */}
              <TableRow className="bg-gradient-to-r from-indigo-100 via-blue-100 to-indigo-100 border-t-4 border-indigo-500">
                <TableCell className="sticky left-0 z-10 bg-gradient-to-r from-indigo-100 to-blue-100 py-2 h-9 max-h-9">
                  <span className="text-sm font-bold text-indigo-900">TOTALS</span>
                </TableCell>
                {/* Period */}
                <TableCell className="py-2 h-9 max-h-9"></TableCell>
                {/* Date */}
                <TableCell className="py-2 h-9 max-h-9"></TableCell>
                {/* Class Type */}
                <TableCell className="py-2 h-9 max-h-9"></TableCell>
                {/* Day */}
                <TableCell className="py-2 h-9 max-h-9"></TableCell>
                {/* Time */}
                <TableCell className="py-2 h-9 max-h-9"></TableCell>
                {/* Location */}
                <TableCell className="py-2 h-9 max-h-9"></TableCell>
                {/* Classes */}
                <TableCell className="text-center py-2 h-9 max-h-9">
                  <span className="text-sm font-bold text-indigo-900">{formatNumber(processedData.length)}</span>
                </TableCell>
                {/* Empty */}
                <TableCell className="text-center py-2 h-9 max-h-9">
                  <span className="text-sm font-bold text-red-700">{formatNumber(processedData.filter(s => (s.checkedInCount || 0) === 0).length)}</span>
                </TableCell>
                {/* Non-Empty */}
                <TableCell className="text-center py-2 h-9 max-h-9">
                  <span className="text-sm font-bold text-green-700">{formatNumber(processedData.filter(s => (s.checkedInCount || 0) > 0).length)}</span>
                </TableCell>
                {/* Checked In */}
                <TableCell className="text-center py-2 h-9 max-h-9">
                  <span className="text-sm font-bold text-indigo-900">{formatNumber(processedData.reduce((sum, s) => sum + (s.checkedInCount || 0), 0))}</span>
                </TableCell>
                {/* Avg (All) */}
                <TableCell className="text-center py-2 h-9 max-h-9">
                  <span className="text-sm font-bold text-indigo-900">{(() => {
                    const totalChecked = processedData.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
                    return (processedData.length > 0 ? (totalChecked / processedData.length).toFixed(1) : '0.0');
                  })()}</span>
                </TableCell>
                {/* Avg (Non-Empty) */}
                <TableCell className="text-center py-2 h-9 max-h-9">
                  <span className="text-sm font-bold text-indigo-900">{(() => {
                    const nonEmpty = processedData.filter(s => (s.checkedInCount || 0) > 0);
                    const totalChecked = nonEmpty.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
                    return (nonEmpty.length > 0 ? (totalChecked / nonEmpty.length).toFixed(1) : '0.0');
                  })()}</span>
                </TableCell>
                {/* Revenue */}
                <TableCell className="text-center py-2 h-9 max-h-9">
                  <span className="text-sm font-bold text-green-700">{formatCurrency(processedData.reduce((sum, s) => sum + (s.totalPaid || 0), 0))}</span>
                </TableCell>
                {/* Late Cancels */}
                <TableCell className="text-center py-2 h-9 max-h-9">
                  <span className="text-xs font-bold text-black">{formatNumber(processedData.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0))}</span>
                </TableCell>
                {/* Capacity */}
                <TableCell className="text-center py-2 h-9 max-h-9">
                  <span className="text-xs font-bold text-black">{formatNumber(processedData.reduce((sum, s) => sum + (s.capacity || 0), 0))}</span>
                </TableCell>
                {/* Fill Rate */}
                <TableCell className="text-center py-2 h-9 max-h-9">
                  <span className="text-sm font-bold text-indigo-900">{(() => {
                    const totalCapacity = processedData.reduce((sum, s) => sum + (s.capacity || 0), 0);
                    const totalChecked = processedData.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
                    const pct = totalCapacity > 0 ? (totalChecked / totalCapacity) * 100 : 0;
                    return `${pct.toFixed(1)}%`;
                  })()}</span>
                </TableCell>
                {/* Rev/Class */}
                <TableCell className="text-center py-2 h-9 max-h-9">
                  <span className="text-sm font-bold text-green-700">{(() => {
                    const totalRevenue = processedData.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
                    return processedData.length > 0 ? formatCurrency(totalRevenue / processedData.length) : formatCurrency(0);
                  })()}</span>
                </TableCell>
                {/* Rev/Attendee */}
                <TableCell className="text-center py-2 h-9 max-h-9">
                  <span className="text-sm font-bold text-green-700">{(() => {
                    const totalRevenue = processedData.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
                    const totalChecked = processedData.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
                    return totalChecked > 0 ? formatCurrency(totalRevenue / totalChecked) : formatCurrency(0);
                  })()}</span>
                </TableCell>
                {/* Consistency */}
                <TableCell className="py-2 h-9 max-h-9"></TableCell>
                {/* Show-up % */}
                <TableCell className="py-2 h-9 max-h-9"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
            <div className="text-sm text-slate-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, (filteredData as any[]).length)} of {(filteredData as any[]).length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      <PersistentTableFooter
        tableId="comprehensive-class-attendance"
        tableData={viewMode === 'grouped' ? groupedData.map(g => g.aggregatedMetrics) : processedData}
        tableName="Comprehensive Class Attendance"
        tableContext="Class attendance analysis with grouping and detailed metrics"
      />
    </Card>
  );
};