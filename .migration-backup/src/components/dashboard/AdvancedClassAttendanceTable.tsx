import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { 
  ChevronDown, ChevronUp, ChevronLeft, Search, Filter, Download, Eye, Settings,
  SortAsc, SortDesc, Users, BarChart3, Calendar, MapPin, Clock, 
  TrendingUp, Target, User, Building2, Activity, DollarSign,
  ChevronRight, RefreshCw, Grid, List, MoreHorizontal, X
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface AdvancedClassAttendanceTableProps {
  data: SessionData[];
  location: string;
  onDrillDown?: (data: any) => void;
}

type ViewType = 
  | 'overview' 
  | 'revenue_focus' 
  | 'attendance_focus' 
  | 'efficiency' 
  | 'performance' 
  | 'detailed';

type GroupingType = 
  | 'none'
  | 'day_time'
  | 'day_time_class' 
  | 'day_time_class_trainer'
  | 'day'
  | 'time_class'
  | 'class_trainer'
  | 'class'
  | 'trainer'
  | 'location'
  | 'dayOfWeek'
  | 'timeSlot';

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface GroupedRow {
  id: string;
  type: 'group' | 'session';
  groupKey: string;
  groupLabel: string;
  level: number;
  isExpanded?: boolean;
  sessions: SessionData[];
  metrics: {
    totalSessions: number;
    totalAttendance: number;
    totalCapacity: number;
    totalRevenue: number;
    totalBookings: number;
    totalCancellations: number;
    totalUnpaid: number;
    emptyClasses: number;
    fillRate: number;
    classAverage: number;
    cancellationRate: number;
    unpaidRate: number;
    bookingRate: number;
  };
  children?: GroupedRow[];
  sessionData?: SessionData;
}

export const AdvancedClassAttendanceTable: React.FC<AdvancedClassAttendanceTableProps> = ({ 
  data, 
  location,
  onDrillDown 
}) => {
  // State Management
  const [viewType, setViewType] = useState<ViewType>('overview');
  const [groupingType, setGroupingType] = useState<GroupingType>('none');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'fillRate',
    direction: 'desc'
  });

  // Column configurations for different views
  const getColumnConfig = useCallback((view: ViewType): ColumnConfig[] => {
    const baseColumns: ColumnConfig[] = [
      {
        key: 'groupLabel',
        label: 'Class Details',
        visible: true,
        sortable: true,
        width: 'w-[300px]',
        render: (value, row) => (
          <div className="flex items-center gap-2">
            {row.type === 'group' && row.children && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleGroup(row.id)}
              >
                {expandedGroups.has(row.id) ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            )}
            <div className={cn("font-medium", 
              row.type === 'group' ? "text-slate-900" : "text-slate-600 ml-6"
            )}>
              {value}
            </div>
          </div>
        )
      }
    ];

    const viewSpecificColumns: Record<ViewType, ColumnConfig[]> = {
      overview: [
        ...baseColumns,
        { key: 'dayOfWeek', label: 'Day', visible: true, sortable: true },
        { key: 'time', label: 'Time', visible: true, sortable: true },
        { key: 'location', label: 'Location', visible: true, sortable: true },
        { key: 'totalSessions', label: 'Sessions', visible: true, sortable: true },
        { key: 'classAverage', label: 'Avg Attendance', visible: true, sortable: true },
        { key: 'fillRate', label: 'Fill Rate', visible: true, sortable: true },
        { key: 'totalRevenue', label: 'Earned Revenue', visible: true, sortable: true }
      ],
      revenue_focus: [
        ...baseColumns,
        { key: 'totalRevenue', label: 'Earned Revenue', visible: true, sortable: true },
        { key: 'avgRevenuePerSession', label: 'Avg Revenue/Session', visible: true, sortable: true },
        { key: 'revenuePerAttendee', label: 'Revenue/Attendee', visible: true, sortable: true },
        { key: 'totalUnpaid', label: 'Unpaid Amount', visible: true, sortable: true },
        { key: 'unpaidRate', label: 'Unpaid Rate', visible: true, sortable: true }
      ],
      attendance_focus: [
        ...baseColumns,
        { key: 'totalAttendance', label: 'Total Attendance', visible: true, sortable: true },
        { key: 'totalCapacity', label: 'Total Capacity', visible: true, sortable: true },
        { key: 'classAverage', label: 'Class Average', visible: true, sortable: true },
        { key: 'fillRate', label: 'Fill Rate', visible: true, sortable: true },
        { key: 'emptyClasses', label: 'Empty Classes', visible: true, sortable: true }
      ],
      efficiency: [
        ...baseColumns,
        { key: 'fillRate', label: 'Fill Rate', visible: true, sortable: true },
        { key: 'bookingRate', label: 'Booking Rate', visible: true, sortable: true },
        { key: 'cancellationRate', label: 'Cancellation Rate', visible: true, sortable: true },
        { key: 'utilization', label: 'Utilization', visible: true, sortable: true },
        { key: 'efficiency', label: 'Efficiency Score', visible: true, sortable: true }
      ],
      performance: [
        ...baseColumns,
        { key: 'totalSessions', label: 'Sessions', visible: true, sortable: true },
        { key: 'consistency', label: 'Consistency', visible: true, sortable: true },
        { key: 'growth', label: 'Growth Trend', visible: true, sortable: true },
        { key: 'ranking', label: 'Performance Rank', visible: true, sortable: true }
      ],
      detailed: [
        ...baseColumns,
        { key: 'date', label: 'Date', visible: true, sortable: true },
        { key: 'dayOfWeek', label: 'Day', visible: true, sortable: true },
        { key: 'time', label: 'Time', visible: true, sortable: true },
        { key: 'trainerName', label: 'Trainer', visible: true, sortable: true },
        { key: 'location', label: 'Location', visible: true, sortable: true },
        { key: 'checkedInCount', label: 'Attendance', visible: true, sortable: true },
        { key: 'capacity', label: 'Capacity', visible: true, sortable: true },
        { key: 'bookedCount', label: 'Bookings', visible: true, sortable: true },
        { key: 'lateCancelledCount', label: 'Cancellations', visible: true, sortable: true },
        { key: 'totalPaid', label: 'Earned Revenue', visible: true, sortable: true },
        { key: 'fillRate', label: 'Fill Rate', visible: true, sortable: true }
      ]
    };

    return viewSpecificColumns[view] || viewSpecificColumns.overview;
  }, [expandedGroups]);

  // Helper function to calculate metrics for a group of sessions
  const calculateMetrics = useCallback((sessions: SessionData[]) => {
    const totalSessions = sessions.length;
    const totalAttendance = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
    const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
    const totalBookings = sessions.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
    const totalCancellations = sessions.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);
    // If SessionData does not have totalOwed, assume totalUnpaid is just unpaid amount if available, else 0
    // If SessionData does not have totalUnpaid, use 0 or another logic as needed
    const totalUnpaid = 0;
    const emptyClasses = sessions.filter(s => (s.checkedInCount || 0) === 0).length;

    return {
      totalSessions,
      totalAttendance,
      totalCapacity,
      totalRevenue,
      totalBookings,
      totalCancellations,
      totalUnpaid: Math.max(0, totalUnpaid),
      emptyClasses,
      fillRate: totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0,
      classAverage: totalSessions > 0 ? totalAttendance / totalSessions : 0,
      cancellationRate: totalBookings > 0 ? (totalCancellations / totalBookings) * 100 : 0,
      unpaidRate: totalRevenue > 0 ? (totalUnpaid / (totalRevenue + totalUnpaid)) * 100 : 0,
      bookingRate: totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0
    };
  }, []);

  // Advanced grouping function
  const createGroupedData = useCallback((sessions: SessionData[], grouping: GroupingType): GroupedRow[] => {
    if (grouping === 'none') {
      return sessions.map((session, index) => ({
        id: `session-${index}`,
        type: 'session' as const,
        groupKey: session.sessionId || `${session.cleanedClass}-${session.date}`,
        groupLabel: `${session.cleanedClass} - ${session.date}`,
        level: 0,
        sessions: [session],
        metrics: calculateMetrics([session]),
        sessionData: session
      }));
    }

    const groupMap = new Map<string, SessionData[]>();

    sessions.forEach(session => {
      let groupKeys: string[] = [];
      
      switch (grouping) {
        case 'day_time':
          groupKeys = [`${session.dayOfWeek} ${session.time}`];
          break;
        case 'day_time_class':
          groupKeys = [
            session.dayOfWeek,
            `${session.dayOfWeek} ${session.time}`,
            `${session.dayOfWeek} ${session.time} ${session.cleanedClass}`
          ];
          break;
        case 'day_time_class_trainer':
          groupKeys = [
            session.dayOfWeek,
            `${session.dayOfWeek} ${session.time}`,
            `${session.dayOfWeek} ${session.time} ${session.cleanedClass}`,
            `${session.dayOfWeek} ${session.time} ${session.cleanedClass} ${session.trainerName}`
          ];
          break;
        case 'day':
          groupKeys = [session.dayOfWeek];
          break;
        case 'time_class':
          groupKeys = [session.time, `${session.time} ${session.cleanedClass}`];
          break;
        case 'class_trainer':
          groupKeys = [session.cleanedClass, `${session.cleanedClass} ${session.trainerName}`];
          break;
        case 'class':
          groupKeys = [session.cleanedClass || 'Unknown'];
          break;
        case 'trainer':
          groupKeys = [session.trainerName || 'Unknown'];
          break;
        case 'location':
          groupKeys = [session.location || 'Unknown'];
          break;
        case 'dayOfWeek':
          groupKeys = [session.dayOfWeek || 'Unknown'];
          break;
        case 'timeSlot':
          groupKeys = [session.time || 'Unknown'];
          break;
        default:
          groupKeys = ['All'];
      }

      groupKeys.forEach(key => {
        if (!groupMap.has(key)) {
          groupMap.set(key, []);
        }
        groupMap.get(key)!.push(session);
      });
    });

    // Convert to hierarchical structure
    const rootGroups = new Map<string, GroupedRow>();
    
    Array.from(groupMap.entries()).forEach(([groupKey, sessions]) => {
      const parts = groupKey.split(' ');
      const level = Math.max(0, parts.length - 1);
      
      if (level === 0 || !groupKey.includes(' ')) {
        // Root level group
        if (!rootGroups.has(groupKey)) {
          rootGroups.set(groupKey, {
            id: `group-${groupKey}`,
            type: 'group',
            groupKey,
            groupLabel: groupKey,
            level: 0,
            sessions,
            metrics: calculateMetrics(sessions),
            children: []
          });
        }
      } else {
        // Sub-level group - for now, we'll flatten it
        rootGroups.set(groupKey, {
          id: `group-${groupKey}`,
          type: 'group',
          groupKey,
          groupLabel: groupKey,
          level,
          sessions,
          metrics: calculateMetrics(sessions),
          children: sessions.map((session, index) => ({
            id: `session-${groupKey}-${index}`,
            type: 'session' as const,
            groupKey: `${groupKey}-session-${index}`,
            groupLabel: `${session.trainerName} - ${session.date}`,
            level: level + 1,
            sessions: [session],
            metrics: calculateMetrics([session]),
            sessionData: session
          }))
        });
      }
    });

    return Array.from(rootGroups.values());
  }, [calculateMetrics]);

  // Process and filter data
  const processedData = useMemo(() => {
    let filtered = data.filter(session => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        (session.cleanedClass || '').toLowerCase().includes(searchLower) ||
        (session.trainerName || '').toLowerCase().includes(searchLower) ||
        (session.location || '').toLowerCase().includes(searchLower) ||
        (session.dayOfWeek || '').toLowerCase().includes(searchLower)
      );
    });

    const grouped = createGroupedData(filtered, groupingType);

    // Sort the data
    const sorted = [...grouped].sort((a, b) => {
      const aValue = a.metrics[sortConfig.key as keyof typeof a.metrics] || 0;
      const bValue = b.metrics[sortConfig.key as keyof typeof b.metrics] || 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [data, searchTerm, groupingType, sortConfig, createGroupedData]);

  // Flatten data for rendering (including children if expanded)
  const flattenedData = useMemo(() => {
    const flattened: GroupedRow[] = [];
    
    processedData.forEach(row => {
      flattened.push(row);
      
      if (row.children && expandedGroups.has(row.id)) {
        flattened.push(...row.children);
      }
    });

    return flattened;
  }, [processedData, expandedGroups]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return flattenedData.slice(startIndex, startIndex + itemsPerPage);
  }, [flattenedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(flattenedData.length / itemsPerPage);

  // Event handlers
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  const handleDrillDown = useCallback((row: GroupedRow) => {
    if (!onDrillDown) return;

    const drillDownData = {
      title: row.groupLabel,
      type: row.type,
      sessions: row.sessions,
      metrics: row.metrics,
      groupKey: row.groupKey,
      level: row.level,
      rawData: row.sessions,
      isDetailed: true
    };

    onDrillDown(drillDownData);
  }, [onDrillDown]);

  // Render cell value based on column config
  const renderCellValue = useCallback((row: GroupedRow, column: ColumnConfig) => {
    if (column.render) {
      return column.render(row.metrics[column.key as keyof typeof row.metrics] || row.sessionData?.[column.key as keyof SessionData], row);
    }

    const value = row.metrics[column.key as keyof typeof row.metrics] || row.sessionData?.[column.key as keyof SessionData];
    
    if (typeof value === 'number') {
      if (column.key.includes('Revenue') || column.key.includes('revenue')) {
        return formatNumber(value);
      }
      if (column.key.includes('Rate') || column.key.includes('rate') || column.key.includes('Percentage')) {
        return formatPercentage(value);
      }
      return formatNumber(value);
    }

    return value || '-';
  }, []);

  const columns = getColumnConfig(viewType);

  return (
    <Card className="w-full bg-white shadow-lg border-0">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Advanced Class Analytics
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 pt-4">
          {/* View Type Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">View:</label>
            <Select value={viewType} onValueChange={(value) => setViewType(value as ViewType)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="revenue_focus">Revenue Focus</SelectItem>
                <SelectItem value="attendance_focus">Attendance Focus</SelectItem>
                <SelectItem value="efficiency">Efficiency</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grouping Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Group by:</label>
            <Select value={groupingType} onValueChange={(value) => setGroupingType(value as GroupingType)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="day_time">Day + Time</SelectItem>
                <SelectItem value="day_time_class">Day + Time + Class</SelectItem>
                <SelectItem value="day_time_class_trainer">Day + Time + Class + Trainer</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="time_class">Time + Class</SelectItem>
                <SelectItem value="class_trainer">Class + Trainer</SelectItem>
                <SelectItem value="class">Class</SelectItem>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="dayOfWeek">Day of Week</SelectItem>
                <SelectItem value="timeSlot">Time Slot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 ml-auto">
            <Search className="w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search classes, trainers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px]"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                {columns.filter(col => col.visible).map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn("font-semibold text-slate-700", column.width)}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1 cursor-pointer">
                      {column.label}
                      {column.sortable && (
                        <div className="flex flex-col">
                          <SortAsc className={cn("w-3 h-3", 
                            sortConfig.key === column.key && sortConfig.direction === 'asc' 
                              ? "text-blue-600" : "text-slate-400"
                          )} />
                          <SortDesc className={cn("w-3 h-3 -mt-1",
                            sortConfig.key === column.key && sortConfig.direction === 'desc'
                              ? "text-blue-600" : "text-slate-400"
                          )} />
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "hover:bg-slate-50 transition-colors cursor-pointer",
                    row.type === 'group' ? "bg-white border-l-4 border-l-blue-500" : "bg-slate-25",
                    row.level > 0 && "bg-slate-25"
                  )}
                  onClick={() => handleDrillDown(row)}
                >
                  {columns.filter(col => col.visible).map((column) => (
                    <TableCell key={column.key} className={cn("py-4", column.width)}>
                      {renderCellValue(row, column)}
                    </TableCell>
                  ))}
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, flattenedData.length)} of {flattenedData.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm font-medium text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};