import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getTableHeaderClasses } from '@/utils/colorThemes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, TrendingDown, BarChart3, Eye, Calendar, Clock, User, ChevronLeft, ChevronRight,
  ArrowUpDown, Filter, Target, Users, DollarSign, Percent, Hash, Star, Award
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/formatters';

interface ComprehensivePerformanceRankingsProps {
  data: SessionData[];
  location?: string;
}

interface GroupedClassData {
  uniqueId: string;
  className: string;
  trainerName: string;
  dayOfWeek: string;
  time: string;
  location: string;
  sessions: SessionData[];
  avgCheckIns: number;
  fillPercentage: number;
  totalRevenue: number;
  totalCheckIns: number;
  totalCapacity: number;
  totalLateCancellations: number;
  sessionCount: number;
  avgRevenue: number;
  bookingRate: number;
  showUpRate: number;
  cancellationRate: number;
  revenuePerAttendee: number;
  consistencyScore: number;
  overallScore: number;
}

type SortCriteria = 'fillPercentage' | 'totalRevenue' | 'avgCheckIns' | 'sessionCount' | 'overallScore' | 'consistencyScore' | 'showUpRate';

export const ComprehensivePerformanceRankings: React.FC<ComprehensivePerformanceRankingsProps> = ({ data, location }) => {
  const [selectedClass, setSelectedClass] = useState<GroupedClassData | null>(null);
  const [minClassesCriteria, setMinClassesCriteria] = useState(2);
  const [sortBy, setSortBy] = useState<SortCriteria>('overallScore');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showTopCount, setShowTopCount] = useState(10);
  const [showBottomCount, setShowBottomCount] = useState(5);

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filter out hosted classes and group by unique class ID
    const filteredData = data.filter(session => 
      !session.sessionName?.toLowerCase().includes('hosted') &&
      !session.sessionName?.toLowerCase().includes('myriad') &&
      !session.cleanedClass?.toLowerCase().includes('hosted')
    );

    const classGroups = filteredData.reduce((acc, session) => {
      const uniqueId = session.uniqueId || 'unknown';
      if (!acc[uniqueId]) {
        acc[uniqueId] = [];
      }
      acc[uniqueId].push(session);
      return acc;
    }, {} as Record<string, SessionData[]>);

    // Calculate comprehensive metrics for each unique class
    const classPerformance: GroupedClassData[] = Object.entries(classGroups)
      .filter(([, sessions]) => sessions.length >= minClassesCriteria)
      .map(([uniqueId, sessions]) => {
        const firstSession = sessions[0];
        const totalCheckIns = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
        const totalRevenue = sessions.reduce((sum, s) => sum + (s.revenue || s.totalPaid || 0), 0);
        const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
        const totalBooked = sessions.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
        const totalLateCancellations = sessions.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);
        
        const avgCheckIns = totalCheckIns / sessions.length;
        const fillPercentage = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
        const avgRevenue = totalRevenue / sessions.length;
        const bookingRate = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;
        const showUpRate = totalBooked > 0 ? (totalCheckIns / totalBooked) * 100 : 0;
        const cancellationRate = totalBooked > 0 ? (totalLateCancellations / totalBooked) * 100 : 0;
        const revenuePerAttendee = totalCheckIns > 0 ? totalRevenue / totalCheckIns : 0;

        // Calculate consistency score (variance in attendance)
        const attendanceVariance = sessions.reduce((sum, s) => {
          const diff = (s.checkedInCount || 0) - avgCheckIns;
          return sum + (diff * diff);
        }, 0) / sessions.length;
        const consistencyScore = Math.max(0, 100 - (attendanceVariance / avgCheckIns) * 10);

        // Calculate overall performance score
        const fillScore = Math.min(fillPercentage, 100);
        const revenueScore = Math.min((avgRevenue / 3000) * 100, 100); // Normalize to ₹3000 max
        const showUpScore = Math.min(showUpRate, 100);
        const consistencyWeight = Math.min(consistencyScore, 100);
        
        const overallScore = (fillScore * 0.3 + revenueScore * 0.25 + showUpScore * 0.25 + consistencyWeight * 0.2);

        return {
          uniqueId,
          className: firstSession.cleanedClass || firstSession.classType || 'Unknown Class',
          trainerName: firstSession.trainerName || `${firstSession.trainerFirstName} ${firstSession.trainerLastName}`.trim(),
          dayOfWeek: firstSession.dayOfWeek,
          time: firstSession.time,
          location: firstSession.location,
          sessions,
          sessionCount: sessions.length,
          avgCheckIns,
          fillPercentage,
          totalRevenue,
          totalCheckIns,
          totalCapacity,
          totalLateCancellations,
          avgRevenue,
          bookingRate,
          showUpRate,
          cancellationRate,
          revenuePerAttendee,
          consistencyScore,
          overallScore
        };
      });

    return classPerformance.sort((a, b) => b[sortBy] - a[sortBy]);
  }, [data, minClassesCriteria, sortBy]);

  const topPerformers = processedData.slice(0, showTopCount);
  const bottomPerformers = processedData.slice(-showBottomCount).reverse();

  const toggleRowExpansion = (uniqueId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(uniqueId)) {
      newExpanded.delete(uniqueId);
    } else {
      newExpanded.add(uniqueId);
    }
    setExpandedRows(newExpanded);
  };

  const getRankBadge = (rank: number, isTop: boolean = true) => {
    if (isTop) {
      if (rank === 1) return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900"><Trophy className="w-3 h-3 mr-1" />1st</Badge>;
      if (rank === 2) return <Badge className="bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800"><Star className="w-3 h-3 mr-1" />2nd</Badge>;
      if (rank === 3) return <Badge className="bg-gradient-to-r from-orange-300 to-orange-400 text-orange-800"><Award className="w-3 h-3 mr-1" />3rd</Badge>;
    }
    return <Badge variant="outline">{isTop ? `${rank}th` : `${rank}th`}</Badge>;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const renderClassTable = (classes: GroupedClassData[], title: string, isTop: boolean = true) => (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isTop ? <Trophy className="w-5 h-5 text-yellow-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
            {title}
          </CardTitle>
          <Badge variant="secondary" className="text-sm">
            {classes.length} classes
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-96 border rounded-lg">
          <Table>
            <TableHeader className={`sticky top-0 z-10 ${getTableHeaderClasses('attendance')}`}>
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="text-left font-bold whitespace-nowrap w-12">Rank</TableHead>
                <TableHead className="text-left font-bold whitespace-nowrap min-w-48">Class Details</TableHead>
                <TableHead className="text-center font-bold whitespace-nowrap cursor-pointer hover:bg-gray-50" onClick={() => setSortBy('fillPercentage')}>
                  <div className="flex items-center justify-center gap-1">
                    Fill Rate <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-center font-bold whitespace-nowrap cursor-pointer hover:bg-gray-50" onClick={() => setSortBy('totalRevenue')}>
                  <div className="flex items-center justify-center gap-1">
                    Revenue <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-center font-bold whitespace-nowrap cursor-pointer hover:bg-gray-50" onClick={() => setSortBy('overallScore')}>
                  <div className="flex items-center justify-center gap-1">
                    Score <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-center font-bold whitespace-nowrap w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classData, index) => (
                <React.Fragment key={classData.uniqueId}>
                  <TableRow 
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors border-b"
                    onClick={() => toggleRowExpansion(classData.uniqueId)}
                  >
                    <TableCell className="font-medium">
                      {getRankBadge(index + 1, isTop)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-800">{classData.className}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <User className="w-3 h-3" />
                          {classData.trainerName}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {classData.dayOfWeek}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {classData.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {formatNumber(classData.sessionCount)} sessions
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className={`px-2 py-1 rounded-full text-sm font-semibold ${getPerformanceColor(classData.fillPercentage)}`}>
                          {formatPercentage(classData.fillPercentage)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatNumber(classData.avgCheckIns)} avg
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
                      <div className={`px-2 py-1 rounded-full text-sm font-bold ${getPerformanceColor(classData.overallScore)}`}>
                        {formatNumber(classData.overallScore)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClass(classData);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {expandedRows.has(classData.uniqueId) && (
                    <TableRow className="bg-gray-50/30">
                      <TableCell colSpan={6} className="p-0">
                        <Collapsible open={true}>
                          <CollapsibleContent>
                            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Show-up Rate</div>
                                <div className="font-semibold">{formatPercentage(classData.showUpRate)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Cancellation Rate</div>
                                <div className="font-semibold">{formatPercentage(classData.cancellationRate)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Revenue/Attendee</div>
                                <div className="font-semibold">{formatCurrency(classData.revenuePerAttendee)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Consistency Score</div>
                                <div className="font-semibold">{formatNumber(classData.consistencyScore)}</div>
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
  );

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No class performance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Performance Analysis Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Classes</label>
              <Input
                type="number"
                value={minClassesCriteria}
                onChange={(e) => setMinClassesCriteria(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="50"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={(value: SortCriteria) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overallScore">Overall Score</SelectItem>
                  <SelectItem value="fillPercentage">Fill Rate</SelectItem>
                  <SelectItem value="totalRevenue">Total Revenue</SelectItem>
                  <SelectItem value="avgCheckIns">Avg Attendance</SelectItem>
                  <SelectItem value="consistencyScore">Consistency</SelectItem>
                  <SelectItem value="showUpRate">Show-up Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Top Performers</label>
              <Input
                type="number"
                value={showTopCount}
                onChange={(e) => setShowTopCount(Math.max(1, parseInt(e.target.value) || 10))}
                min="1"
                max="50"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bottom Performers</label>
              <Input
                type="number"
                value={showBottomCount}
                onChange={(e) => setShowBottomCount(Math.max(1, parseInt(e.target.value) || 5))}
                min="1"
                max="20"
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side by Side Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderClassTable(topPerformers, `Top ${showTopCount} Performers`, true)}
        {renderClassTable(bottomPerformers, `Bottom ${showBottomCount} Performers`, false)}
      </div>

      {/* Detailed View Modal */}
      {selectedClass && (
        <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {selectedClass.className} - Detailed Analytics
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Class Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{formatPercentage(selectedClass.fillPercentage)}</div>
                    <div className="text-sm text-gray-600">Fill Rate</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedClass.totalRevenue)}</div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatNumber(selectedClass.overallScore)}</div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </CardContent>
                </Card>
              </div>

              {/* Individual Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Individual Session Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto max-h-60">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Fill Rate</TableHead>
                          <TableHead>Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedClass.sessions.map((session, index) => (
                          <TableRow key={index}>
                            <TableCell>{session.date || session.sessionId || `Session ${index + 1}`}</TableCell>
                            <TableCell>{formatNumber(session.checkedInCount)}</TableCell>
                            <TableCell>{formatNumber(session.capacity)}</TableCell>
                            <TableCell>{formatPercentage((session.checkedInCount / session.capacity) * 100)}</TableCell>
                            <TableCell>{formatCurrency(session.totalPaid || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};