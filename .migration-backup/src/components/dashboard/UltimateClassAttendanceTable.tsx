import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  ChevronDown, ChevronUp, Search, Filter, Download, 
  SortAsc, SortDesc, Users, BarChart3, Calendar, 
  MapPin, Clock, TrendingUp, Eye, Settings, Target,
  User, Building2, Activity, DollarSign, Percent,
  RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

interface UltimateClassAttendanceTableProps {
  data: SessionData[];
  location: string;
}

type ViewType = 'detailed' | 'summary' | 'trainer' | 'class' | 'timeline' | 'performance';
type GroupingType = 'none' | 'trainer' | 'class' | 'location' | 'dayOfWeek' | 'timeSlot' | 'month';
type RankingCriteria = 'fillRate' | 'attendance' | 'revenue' | 'classAverage' | 'consistency' | 'growth';
type SortDirection = 'asc' | 'desc';

interface GroupedData {
  groupKey: string;
  groupLabel: string;
  sessions: SessionData[];
  metrics: {
    totalSessions: number;
    totalAttendance: number;
    totalCapacity: number;
    totalRevenue: number;
    fillRate: number;
    classAverage: number;
    avgCapacity: number;
    consistency: number;
  };
}

export const UltimateClassAttendanceTable: React.FC<UltimateClassAttendanceTableProps> = ({ 
  data, 
  location 
}) => {
  const { filters } = useGlobalFilters();
  const periodId = `${filters.dateRange.start}:${filters.dateRange.end}`;
  // State Management
  const [viewType, setViewType] = useState<ViewType>('detailed');
  const [groupingType, setGroupingType] = useState<GroupingType>('none');
  const [rankingCriteria, setRankingCriteria] = useState<RankingCriteria>('classAverage');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showTrainerSpecific, setShowTrainerSpecific] = useState(true);
  const [minClassesFilter, setMinClassesFilter] = useState(2);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(['class', 'trainer', 'attendance', 'capacity', 'fillRate', 'revenue', 'classAverage'])
  );

  // Filter data based on minimum classes requirement
  const filteredData = useMemo(() => {
    if (minClassesFilter <= 1) return data;
    
    // Group by class+trainer combination and filter out those with fewer sessions
    const sessionCounts = new Map<string, number>();
    data.forEach(session => {
      const key = `${session.cleanedClass}-${session.trainerName}-${session.dayOfWeek}-${session.time}-${session.location}`;
      sessionCounts.set(key, (sessionCounts.get(key) || 0) + 1);
    });
    
    return data.filter(session => {
      const key = `${session.cleanedClass}-${session.trainerName}-${session.dayOfWeek}-${session.time}-${session.location}`;
      return (sessionCounts.get(key) || 0) >= minClassesFilter;
    });
  }, [data, minClassesFilter]);

  // Group data based on selected grouping type
  const groupedData = useMemo(() => {
    if (groupingType === 'none') {
      // Return individual sessions with calculated metrics
      return filteredData.map(session => ({
        groupKey: session.sessionId || `${session.cleanedClass}-${session.date}`,
        groupLabel: `${session.cleanedClass} - ${session.date}`,
        sessions: [session],
        metrics: {
          totalSessions: 1,
          totalAttendance: session.checkedInCount || 0,
          totalCapacity: session.capacity || 0,
          totalRevenue: session.totalPaid || 0,
          fillRate: session.capacity ? ((session.checkedInCount || 0) / session.capacity) * 100 : 0,
          classAverage: session.checkedInCount || 0,
          avgCapacity: session.capacity || 0,
          consistency: 100
        }
      }));
    }

    const grouped = new Map<string, SessionData[]>();
    
    filteredData.forEach(session => {
      let groupKey = '';
      switch (groupingType) {
        case 'trainer':
          groupKey = session.trainerName || 'Unknown';
          break;
        case 'class':
          groupKey = showTrainerSpecific 
            ? `${session.cleanedClass} - ${session.trainerName}` 
            : session.cleanedClass || 'Unknown';
          break;
        case 'location':
          groupKey = session.location || 'Unknown';
          break;
        case 'dayOfWeek':
          groupKey = session.dayOfWeek || 'Unknown';
          break;
        case 'timeSlot':
          groupKey = session.time || 'Unknown';
          break;
        case 'month':
          const date = new Date(session.date);
          groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          groupKey = 'All';
      }
      
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(session);
    });

    return Array.from(grouped.entries()).map(([groupKey, sessions]) => {
      const totalSessions = sessions.length;
      const totalAttendance = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const fillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
      const classAverage = totalSessions > 0 ? totalAttendance / totalSessions : 0;
      const avgCapacity = totalSessions > 0 ? totalCapacity / totalSessions : 0;
      
      // Calculate consistency (coefficient of variation)
      const attendanceMean = classAverage;
      const attendanceVariance = sessions.reduce((sum, s) => {
        const diff = (s.checkedInCount || 0) - attendanceMean;
        return sum + (diff * diff);
      }, 0) / totalSessions;
      const consistency = attendanceMean > 0 ? 100 - (Math.sqrt(attendanceVariance) / attendanceMean * 100) : 0;

      return {
        groupKey,
        groupLabel: groupKey,
        sessions,
        metrics: {
          totalSessions,
          totalAttendance,
          totalCapacity,
          totalRevenue,
          fillRate: Math.max(0, Math.min(100, fillRate)),
          classAverage,
          avgCapacity,
          consistency: Math.max(0, Math.min(100, consistency))
        }
      };
    });
  }, [filteredData, groupingType, showTrainerSpecific]);

  // Sort grouped data based on ranking criteria
  const sortedData = useMemo(() => {
    return [...groupedData].sort((a, b) => {
      let valueA = 0;
      let valueB = 0;
      
      switch (rankingCriteria) {
        case 'fillRate':
          valueA = a.metrics.fillRate;
          valueB = b.metrics.fillRate;
          break;
        case 'attendance':
          valueA = a.metrics.totalAttendance;
          valueB = b.metrics.totalAttendance;
          break;
        case 'revenue':
          valueA = a.metrics.totalRevenue;
          valueB = b.metrics.totalRevenue;
          break;
        case 'classAverage':
          valueA = a.metrics.classAverage;
          valueB = b.metrics.classAverage;
          break;
        case 'consistency':
          valueA = a.metrics.consistency;
          valueB = b.metrics.consistency;
          break;
        case 'growth':
          // Mock growth calculation
          valueA = a.metrics.fillRate * 0.1;
          valueB = b.metrics.fillRate * 0.1;
          break;
        default:
          valueA = a.metrics.classAverage;
          valueB = b.metrics.classAverage;
      }
      
      return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
    });
  }, [groupedData, rankingCriteria, sortDirection]);

  // Apply search filter
  const searchFilteredData = useMemo(() => {
    if (!searchTerm) return sortedData;
    
    return sortedData.filter(group => 
      group.groupLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.sessions.some(session => 
        session.trainerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.cleanedClass?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm]);

  // Pagination
  const totalItems = searchFilteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = searchFilteredData.slice(startIndex, endIndex);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewType, groupingType, rankingCriteria, searchTerm, minClassesFilter]);

  const toggleRowExpansion = (groupKey: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedRows(newExpanded);
  };

  const toggleColumn = (columnKey: string) => {
    const newColumns = new Set(selectedColumns);
    if (newColumns.has(columnKey)) {
      newColumns.delete(columnKey);
    } else {
      newColumns.add(columnKey);
    }
    setSelectedColumns(newColumns);
  };

  const allColumns = [
    { key: 'class', label: 'Class/Group', icon: Activity },
    { key: 'trainer', label: 'Trainer', icon: User },
    { key: 'sessions', label: 'Sessions', icon: Calendar },
    { key: 'attendance', label: 'Attendance', icon: Users },
    { key: 'capacity', label: 'Capacity', icon: Building2 },
    { key: 'fillRate', label: 'Fill Rate', icon: Target },
    { key: 'revenue', label: 'Revenue', icon: DollarSign },
    { key: 'classAverage', label: 'Class Average', icon: BarChart3 },
    { key: 'consistency', label: 'Consistency', icon: TrendingUp },
    { key: 'location', label: 'Location', icon: MapPin },
    { key: 'dayOfWeek', label: 'Day', icon: Calendar },
    { key: 'time', label: 'Time', icon: Clock }
  ];

  const viewOptions = [
    { value: 'detailed', label: 'Detailed View', icon: Eye },
    { value: 'summary', label: 'Summary View', icon: BarChart3 },
    { value: 'trainer', label: 'Trainer Focus', icon: User },
    { value: 'class', label: 'Class Focus', icon: Activity },
    { value: 'timeline', label: 'Timeline View', icon: Calendar },
    { value: 'performance', label: 'Performance View', icon: TrendingUp }
  ];

  const groupingOptions = [
    { value: 'none', label: 'Individual Sessions', icon: Activity },
    { value: 'trainer', label: 'By Trainer', icon: User },
    { value: 'class', label: 'By Class', icon: Activity },
    { value: 'location', label: 'By Location', icon: MapPin },
    { value: 'dayOfWeek', label: 'By Day of Week', icon: Calendar },
    { value: 'timeSlot', label: 'By Time Slot', icon: Clock },
    { value: 'month', label: 'By Month', icon: Calendar }
  ];

  const rankingOptions = [
    { value: 'classAverage', label: 'Class Average', icon: BarChart3 },
    { value: 'fillRate', label: 'Fill Rate', icon: Target },
    { value: 'attendance', label: 'Total Attendance', icon: Users },
    { value: 'revenue', label: 'Revenue', icon: DollarSign },
    { value: 'consistency', label: 'Consistency', icon: TrendingUp },
    { value: 'growth', label: 'Growth Rate', icon: TrendingUp }
  ];

  return (
    <>
    <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 px-6 py-5 border-b-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <BarChart3 className="w-6 h-6" />
            <h2 className="text-xl font-bold">Ultimate Class Attendance Analytics</h2>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-0 px-3 py-1">
            {totalItems} {groupingType === 'none' ? 'Sessions' : 'Groups'}
          </Badge>
        </div>
      </div>
      
      <div className="p-6">
        {/* Control Panel */}
        <div className="space-y-6 mb-8">
          {/* View and Grouping Controls */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 flex-wrap">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">View Type</Label>
                <Select value={viewType} onValueChange={(value: ViewType) => setViewType(value)}>
                  <SelectTrigger className="w-48 px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {viewOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Group By</Label>
                <Select value={groupingType} onValueChange={(value: GroupingType) => setGroupingType(value)}>
                  <SelectTrigger className="w-48 px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {groupingOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Rank By</Label>
                <Select value={rankingCriteria} onValueChange={(value: RankingCriteria) => setRankingCriteria(value)}>
                  <SelectTrigger className="w-48 px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {rankingOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
                className="mt-7 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all border-2"
              >
                {sortDirection === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
              </Button>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="px-4 py-2 rounded-xl hover:bg-blue-50 transition-all border-2">
                  <Settings className="w-4 h-4 mr-2" />
                  Columns
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Select Columns</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  {allColumns.map(column => (
                    <div key={column.key} className="flex items-center space-x-2">
                      <Switch
                        id={column.key}
                        checked={selectedColumns.has(column.key)}
                        onCheckedChange={() => toggleColumn(column.key)}
                      />
                      <Label htmlFor={column.key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <column.icon className="w-4 h-4" />
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters and Search */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search classes, trainers, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-gray-700">Min Classes:</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={minClassesFilter}
                onChange={(e) => setMinClassesFilter(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all"
              />
            </div>

            {groupingType === 'class' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="trainer-specific"
                  checked={showTrainerSpecific}
                  onCheckedChange={setShowTrainerSpecific}
                />
                <Label htmlFor="trainer-specific" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Include Trainers
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xl">
          <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
            <Table className="border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  {groupingType !== 'none' && (
                    <TableHead className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white w-10 px-3 py-3">
                      <ChevronDown className="w-4 h-4" />
                    </TableHead>
                  )}
                  
                  {selectedColumns.has('class') && (
                    <TableHead className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white min-w-[200px] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {groupingType === 'trainer' ? 'Trainer' : 
                           groupingType === 'location' ? 'Location' :
                           groupingType === 'dayOfWeek' ? 'Day' :
                           groupingType === 'timeSlot' ? 'Time' :
                           groupingType === 'month' ? 'Month' :
                           'Class/Group'}
                        </span>
                      </div>
                    </TableHead>
                  )}
                  
                  {selectedColumns.has('sessions') && groupingType !== 'none' && (
                    <TableHead className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white text-center px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Sessions</span>
                      </div>
                    </TableHead>
                  )}
                  
                  {selectedColumns.has('attendance') && (
                    <TableHead className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white text-center px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Attendance</span>
                      </div>
                    </TableHead>
                  )}
                  
                  {selectedColumns.has('capacity') && (
                    <TableHead className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white text-center px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <Building2 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Capacity</span>
                      </div>
                    </TableHead>
                  )}
                  
                  {selectedColumns.has('fillRate') && (
                    <TableHead className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white text-center px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <Target className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Fill Rate</span>
                      </div>
                    </TableHead>
                  )}
                  
                  {selectedColumns.has('classAverage') && (
                    <TableHead className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white text-center px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Class Avg</span>
                      </div>
                    </TableHead>
                  )}
                  
                  {selectedColumns.has('revenue') && (
                    <TableHead className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white text-center px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Revenue</span>
                      </div>
                    </TableHead>
                  )}
                  
                  {selectedColumns.has('consistency') && (
                    <TableHead className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white text-center px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Consistency</span>
                      </div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {paginatedData.map((group, index) => (
                  <React.Fragment key={group.groupKey}>
                    <TableRow className={cn(
                      "hover:bg-blue-50/50 transition-all border-b border-gray-100",
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    )}>
                      {groupingType !== 'none' && (
                        <TableCell className="px-3 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(group.groupKey)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-all"
                          >
                            {expandedRows.has(group.groupKey) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                      
                      {selectedColumns.has('class') && (
                        <TableCell className="font-medium px-4 py-3">
                          <div className="space-y-1">
                            <div className="font-bold text-gray-800">{group.groupLabel}</div>
                            {groupingType !== 'none' && (
                              <div className="text-xs text-gray-500">
                                {group.sessions.length} sessions
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )}
                      
                      {selectedColumns.has('sessions') && groupingType !== 'none' && (
                        <TableCell className="text-center px-4 py-3">
                          <Badge variant="outline" className="font-semibold">
                            {group.metrics.totalSessions}
                          </Badge>
                        </TableCell>
                      )}
                      
                      {selectedColumns.has('attendance') && (
                        <TableCell className="text-center font-bold text-gray-800 px-4 py-3">
                          {formatNumber(group.metrics.totalAttendance)}
                        </TableCell>
                      )}
                      
                      {selectedColumns.has('capacity') && (
                        <TableCell className="text-center text-gray-700 px-4 py-3">
                          {formatNumber(group.metrics.totalCapacity)}
                        </TableCell>
                      )}
                      
                      {selectedColumns.has('fillRate') && (
                        <TableCell className="text-center px-4 py-3">
                          <div className="flex items-center gap-2 justify-center">
                            <div className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold shadow-sm",
                              group.metrics.fillRate >= 80 ? "bg-green-100 text-green-800" :
                              group.metrics.fillRate >= 60 ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            )}>
                              {formatPercentage(group.metrics.fillRate)}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      
                      {selectedColumns.has('classAverage') && (
                        <TableCell className="text-center font-bold text-blue-600 px-4 py-3">
                          {formatNumber(group.metrics.classAverage)}
                        </TableCell>
                      )}
                      
                      {selectedColumns.has('revenue') && (
                        <TableCell className="text-center font-bold text-gray-800 px-4 py-3">
                          {formatNumber(group.metrics.totalRevenue)}
                        </TableCell>
                      )}
                      
                      {selectedColumns.has('consistency') && (
                        <TableCell className="text-center px-4 py-3">
                          <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold shadow-sm inline-block",
                            group.metrics.consistency >= 80 ? "bg-green-100 text-green-800" :
                            group.metrics.consistency >= 60 ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          )}>
                            {formatPercentage(group.metrics.consistency)}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                    
                    {/* Expanded row details */}
                    {expandedRows.has(group.groupKey) && groupingType !== 'none' && (
                      <TableRow>
                        <TableCell colSpan={selectedColumns.size + 1} className="bg-gradient-to-r from-gray-50 to-blue-50/30 p-0 border-b border-gray-100">
                          <div className="p-6 space-y-4">
                            <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Individual Sessions
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {group.sessions.slice(0, 6).map((session, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-xs">
                                  <div className="font-bold text-gray-800">{session.cleanedClass}</div>
                                  <div className="text-gray-600 font-medium mt-1">{session.trainerName}</div>
                                  <div className="text-gray-500 mt-1">{session.date} - {session.time}</div>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs font-semibold">
                                      {session.checkedInCount}/{session.capacity}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs font-semibold text-green-700">
                                      {formatNumber(session.totalPaid || 0)}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                              {group.sessions.length > 6 && (
                                <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-4 rounded-xl border border-gray-300 text-xs flex items-center justify-center text-gray-600 font-semibold">
                                  +{group.sessions.length - 6} more sessions
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 font-medium">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} items
            </div>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-24 px-3 py-2 rounded-xl border-2 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {[10, 25, 50, 100].map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl border-2 border-gray-300 disabled:opacity-50 hover:bg-blue-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-10 h-10 p-0 rounded-xl transition-all",
                      pageNum === currentPage 
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:from-blue-700 hover:to-blue-800" 
                        : "border-2 border-gray-300 hover:bg-blue-50"
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl border-2 border-gray-300 disabled:opacity-50 hover:bg-blue-50 transition-all"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-4">
    </div>
    </>
  );
};