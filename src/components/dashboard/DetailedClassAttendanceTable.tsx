import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTableHeaderClasses } from '@/utils/colorThemes';
import { 
  ChevronDown, ChevronRight, ArrowUpDown, Search, Filter, Calendar, 
  Clock, User, Users, DollarSign, Target, BarChart3, Eye, Hash,
  Percent, TrendingUp, MapPin, Star, Award
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/formatters';

interface DetailedClassAttendanceTableProps {
  data: SessionData[];
  location?: string;
}

interface EnhancedGroupedClassData {
  uniqueId: string;
  className: string;
  trainerName: string;
  dayOfWeek: string;
  time: string;
  location: string;
  sessions: SessionData[];
  sessionCount: number;
  totalAttendance: number;
  totalCapacity: number;
  totalRevenue: number;
  totalBooked: number;
  totalCancellations: number;
  avgAttendance: number;
  fillRate: number;
  bookingRate: number;
  cancellationRate: number;
  showUpRate: number;
  avgRevenue: number;
  revenuePerAttendee: number;
  consistencyScore: number;
  peakAttendance: number;
  lowestAttendance: number;
  trendDirection: 'up' | 'down' | 'stable';
  lastSessionFillRate: number;
  monthlyTrends: { month: string; avgFill: number; sessions: number }[];
}

type SortColumn = keyof EnhancedGroupedClassData;
type GroupByOption = 'trainer' | 'classType' | 'dayOfWeek' | 'timeSlot' | 'location' | 'none';
type ViewOption = 'summary' | 'detailed' | 'trends';

export const DetailedClassAttendanceTable: React.FC<DetailedClassAttendanceTableProps> = ({ data, location }) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('fillRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [viewOption, setViewOption] = useState<ViewOption>('detailed');
  const [searchTerm, setSearchTerm] = useState('');
  const [minSessions, setMinSessions] = useState(2);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filter out hosted classes and classes with fewer than minSessions
    const nonHostedData = data.filter(session => 
      !session.sessionName?.toLowerCase().includes('hosted') &&
      !session.sessionName?.toLowerCase().includes('myriad') &&
      !session.cleanedClass?.toLowerCase().includes('hosted') &&
      session.sessionName?.toLowerCase() !== 'hosted'
    );

    // Group by unique class ID
    const classGroups = nonHostedData.reduce((acc, session) => {
      const uniqueId = session.uniqueId || 'unknown';
      if (!acc[uniqueId]) {
        acc[uniqueId] = [];
      }
      acc[uniqueId].push(session);
      return acc;
    }, {} as Record<string, SessionData[]>);

    // Process each group with enhanced metrics
    const enhancedData: EnhancedGroupedClassData[] = Object.entries(classGroups)
      .filter(([, sessions]) => sessions.length >= minSessions)
      .map(([uniqueId, sessions]) => {
        const firstSession = sessions[0];
        const sortedSessions = sessions.sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime());
        
        // Basic calculations
        const totalAttendance = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
        const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
        const totalRevenue = sessions.reduce((sum, s) => sum + (s.revenue || s.totalPaid || 0), 0);
        const totalBooked = sessions.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
        const totalCancellations = sessions.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);
        
        const avgAttendance = totalAttendance / sessions.length;
        const fillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
        const bookingRate = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;
        const cancellationRate = totalBooked > 0 ? (totalCancellations / totalBooked) * 100 : 0;
        const showUpRate = totalBooked > 0 ? (totalAttendance / totalBooked) * 100 : 0;
        const avgRevenue = totalRevenue / sessions.length;
        const revenuePerAttendee = totalAttendance > 0 ? totalRevenue / totalAttendance : 0;

        // Advanced metrics
        const attendanceValues = sessions.map(s => s.checkedInCount || 0);
        const peakAttendance = Math.max(...attendanceValues);
        const lowestAttendance = Math.min(...attendanceValues);
        
        // Consistency score (lower variance = higher consistency)
        const attendanceVariance = attendanceValues.reduce((sum, val) => {
          const diff = val - avgAttendance;
          return sum + (diff * diff);
        }, 0) / sessions.length;
        const consistencyScore = Math.max(0, 100 - (Math.sqrt(attendanceVariance) / avgAttendance) * 20);

        // Trend analysis (comparing first half vs second half)
        const midPoint = Math.floor(sessions.length / 2);
        const firstHalfFill = sortedSessions.slice(0, midPoint).reduce((sum, s) => 
          sum + ((s.checkedInCount || 0) / (s.capacity || 1)), 0) / midPoint * 100;
        const secondHalfFill = sortedSessions.slice(midPoint).reduce((sum, s) => 
          sum + ((s.checkedInCount || 0) / (s.capacity || 1)), 0) / (sessions.length - midPoint) * 100;
        
        let trendDirection: 'up' | 'down' | 'stable' = 'stable';
        const trendDiff = secondHalfFill - firstHalfFill;
        if (trendDiff > 5) trendDirection = 'up';
        else if (trendDiff < -5) trendDirection = 'down';

        const lastSessionFillRate = sortedSessions.length > 0 ? 
          ((sortedSessions[sortedSessions.length - 1].checkedInCount || 0) / 
           (sortedSessions[sortedSessions.length - 1].capacity || 1)) * 100 : 0;

        // Monthly trends
        const monthlyData = sessions.reduce((acc, session) => {
          const sessionDate = new Date(session.date || '');
          const monthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!acc[monthKey]) {
            acc[monthKey] = { sessions: 0, totalFill: 0 };
          }
          
          acc[monthKey].sessions += 1;
          acc[monthKey].totalFill += ((session.checkedInCount || 0) / (session.capacity || 1)) * 100;
          
          return acc;
        }, {} as Record<string, { sessions: number; totalFill: number }>);

        const monthlyTrends = Object.entries(monthlyData).map(([month, data]) => ({
          month,
          avgFill: data.totalFill / data.sessions,
          sessions: data.sessions
        })).sort((a, b) => a.month.localeCompare(b.month));

        return {
          uniqueId,
          className: firstSession.cleanedClass || firstSession.classType || 'Unknown Class',
          trainerName: firstSession.trainerName || `${firstSession.trainerFirstName} ${firstSession.trainerLastName}`.trim(),
          dayOfWeek: firstSession.dayOfWeek,
          time: firstSession.time,
          location: firstSession.location,
          sessions,
          sessionCount: sessions.length,
          totalAttendance,
          totalCapacity,
          totalRevenue,
          totalBooked,
          totalCancellations,
          avgAttendance,
          fillRate,
          bookingRate,
          cancellationRate,
          showUpRate,
          avgRevenue,
          revenuePerAttendee,
          consistencyScore,
          peakAttendance,
          lowestAttendance,
          trendDirection,
          lastSessionFillRate,
          monthlyTrends
        };
      });

    // Apply search filter
    let searchFilteredData = enhancedData;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      searchFilteredData = enhancedData.filter(item => 
        item.className.toLowerCase().includes(term) ||
        item.trainerName.toLowerCase().includes(term) ||
        item.dayOfWeek.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term)
      );
    }

    // Sort data
    const sortedData = [...searchFilteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

    return sortedData;
  }, [data, minSessions, searchTerm, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const toggleRowExpansion = (uniqueId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(uniqueId)) {
      newExpanded.delete(uniqueId);
    } else {
      newExpanded.add(uniqueId);
    }
    setExpandedRows(newExpanded);
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    return sortDirection === 'asc' ? <ChevronDown className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 rotate-180" />;
  };

  const getPerformanceColor = (value: number, type: 'fill' | 'revenue' | 'score') => {
    if (type === 'fill') {
      if (value >= 80) return 'bg-green-100 text-green-800 border-green-200';
      if (value >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
      if (value >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No class attendance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Detailed Class Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Classes</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Class, trainer, day..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Min Sessions</label>
              <Input
                type="number"
                value={minSessions}
                onChange={(e) => setMinSessions(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Items per Page</label>
              <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">View Type</label>
              <Select value={viewOption} onValueChange={(v: ViewOption) => setViewOption(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary View</SelectItem>
                  <SelectItem value="detailed">Detailed View</SelectItem>
                  <SelectItem value="trends">Trends View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            {processedData.length} classes found
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Main Data Table */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[800px] border rounded-lg">
            <Table>
              <TableHeader className={`sticky top-0 z-10 border-b-2 ${getTableHeaderClasses('attendance')}`}>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12"></TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 whitespace-nowrap min-w-64"
                    onClick={() => handleSort('className')}
                  >
                    <div className="flex items-center gap-2">
                      Class Information {getSortIcon('className')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap"
                    onClick={() => handleSort('sessionCount')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Sessions {getSortIcon('sessionCount')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap"
                    onClick={() => handleSort('fillRate')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Fill Rate {getSortIcon('fillRate')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap"
                    onClick={() => handleSort('totalRevenue')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Revenue {getSortIcon('totalRevenue')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap"
                    onClick={() => handleSort('consistencyScore')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Consistency {getSortIcon('consistencyScore')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap"
                    onClick={() => handleSort('trendDirection')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Trend {getSortIcon('trendDirection')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((classData) => (
                  <React.Fragment key={classData.uniqueId}>
                    <TableRow 
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors border-b"
                      onClick={() => toggleRowExpansion(classData.uniqueId)}
                    >
                      <TableCell className="text-center">
                        {expandedRows.has(classData.uniqueId) ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                      </TableCell>
                      
                      <TableCell className="whitespace-nowrap">
                        <div className="space-y-2">
                          <div className="font-semibold text-gray-800 text-base">{classData.className}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <User className="w-3 h-3" />
                            {classData.trainerName}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {classData.dayOfWeek}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {classData.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {classData.location}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-gray-800">
                            {formatNumber(classData.sessionCount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatNumber(classData.totalAttendance)} total
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <Badge className={`px-2 py-1 text-sm font-bold ${getPerformanceColor(classData.fillRate, 'fill')}`}>
                            {formatPercentage(classData.fillRate)}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {formatNumber(classData.avgAttendance)} avg
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-800">
                            {formatCurrency(classData.totalRevenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(classData.avgRevenue)} avg
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-800">
                            {formatNumber(classData.consistencyScore)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {classData.peakAttendance - classData.lowestAttendance} range
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {getTrendIcon(classData.trendDirection)}
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {expandedRows.has(classData.uniqueId) && (
                      <TableRow className="bg-gray-50/30">
                        <TableCell colSpan={7} className="p-0">
                          <Collapsible open={true}>
                            <CollapsibleContent>
                              <div className="p-6 space-y-4">
                                {/* Extended Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                  <div className="text-center p-3 bg-white rounded-lg border">
                                    <div className="text-xs text-gray-500 mb-1">Booking Rate</div>
                                    <div className="font-semibold">{formatPercentage(classData.bookingRate)}</div>
                                  </div>
                                  <div className="text-center p-3 bg-white rounded-lg border">
                                    <div className="text-xs text-gray-500 mb-1">Show-up Rate</div>
                                    <div className="font-semibold">{formatPercentage(classData.showUpRate)}</div>
                                  </div>
                                  <div className="text-center p-3 bg-white rounded-lg border">
                                    <div className="text-xs text-gray-500 mb-1">Cancellation Rate</div>
                                    <div className="font-semibold">{formatPercentage(classData.cancellationRate)}</div>
                                  </div>
                                  <div className="text-center p-3 bg-white rounded-lg border">
                                    <div className="text-xs text-gray-500 mb-1">Revenue/Attendee</div>
                                    <div className="font-semibold">{formatCurrency(classData.revenuePerAttendee)}</div>
                                  </div>
                                  <div className="text-center p-3 bg-white rounded-lg border">
                                    <div className="text-xs text-gray-500 mb-1">Peak Attendance</div>
                                    <div className="font-semibold">{formatNumber(classData.peakAttendance)}</div>
                                  </div>
                                  <div className="text-center p-3 bg-white rounded-lg border">
                                    <div className="text-xs text-gray-500 mb-1">Last Session Fill</div>
                                    <div className="font-semibold">{formatPercentage(classData.lastSessionFillRate)}</div>
                                  </div>
                                </div>

                                {/* Individual Sessions Table */}
                                <div className="bg-white rounded-lg border">
                                  <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                                    <h4 className="font-semibold text-gray-800">Individual Session Details</h4>
                                  </div>
                                  <div className="overflow-auto max-h-60">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="whitespace-nowrap">Date</TableHead>
                                          <TableHead className="text-center whitespace-nowrap">Attendance</TableHead>
                                          <TableHead className="text-center whitespace-nowrap">Capacity</TableHead>
                                          <TableHead className="text-center whitespace-nowrap">Fill Rate</TableHead>
                                          <TableHead className="text-center whitespace-nowrap">Revenue</TableHead>
                                          <TableHead className="text-center whitespace-nowrap">Cancellations</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {classData.sessions.map((session, index) => (
                                          <TableRow key={index} className="hover:bg-gray-50">
                                            <TableCell className="whitespace-nowrap">
                                              {session.date || session.sessionId || `Session ${index + 1}`}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              {formatNumber(session.checkedInCount)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              {formatNumber(session.capacity)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <Badge className={`px-2 py-1 text-xs ${getPerformanceColor((session.checkedInCount / session.capacity) * 100, 'fill')}`}>
                                                {formatPercentage((session.checkedInCount / session.capacity) * 100)}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              {formatCurrency(session.totalPaid || 0)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              {formatNumber(session.lateCancelledCount || 0)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} classes
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-medium">
            {currentPage}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
};