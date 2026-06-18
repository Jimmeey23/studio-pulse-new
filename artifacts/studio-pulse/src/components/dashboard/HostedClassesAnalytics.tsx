import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useRegisterTableForCopy } from '@/hooks/useRegisterTableForCopy';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTableHeaderClasses } from '@/utils/colorThemes';
import { 
  Calendar, Users, DollarSign, BarChart3, TrendingUp, MapPin, 
  ArrowUpDown, Filter, Download, Eye, Star, Building2, Clock
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/formatters';

interface HostedClassesAnalyticsProps {
  data: SessionData[];
  location?: string;
}

interface HostedClassData {
  monthKey: string;
  monthDisplay: string;
  classes: {
    sessionName: string;
    trainerName: string;
    location: string;
    date: string;
    attendance: number;
    capacity: number;
    fillRate: number;
    revenue: number;
    type: string;
    dayOfWeek: string;
    time: string;
  }[];
  totalClasses: number;
  totalAttendance: number;
  totalCapacity: number;
  totalRevenue: number;
  avgFillRate: number;
  avgAttendance: number;
  avgRevenue: number;
  revenuePerAttendee: number;
  growthRate: number;
  topPerformer: string;
}

type SortColumn = 'monthKey' | 'totalClasses' | 'totalAttendance' | 'totalRevenue' | 'avgFillRate';
type ViewMode = 'monthly' | 'detailed' | 'performance';

export const HostedClassesAnalytics: React.FC<HostedClassesAnalyticsProps> = ({ data, location }) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('monthKey');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<string>('kwality');
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { getAllTabsText } = useRegisterTableForCopy(tableContainerRef as any, 'Hosted Classes Analytics');

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filter for hosted classes only
    let hostedClasses = data.filter(session => 
      session.sessionName?.toLowerCase().includes('hosted') ||
      session.sessionName?.toLowerCase().includes('myriad') ||
      session.cleanedClass?.toLowerCase().includes('hosted')
    );

    // Apply location filter if specified
    if (selectedLocation !== 'all') {
      hostedClasses = hostedClasses.filter(session => 
        session.location === selectedLocation ||
        session.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Group by month
    const monthlyGroups = hostedClasses.reduce((acc, session) => {
      const sessionDate = new Date(session.date || '');
      const monthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
      const monthDisplay = sessionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      if (!acc[monthKey]) {
        acc[monthKey] = {
          monthKey,
          monthDisplay,
          classes: [],
          totalClasses: 0,
          totalAttendance: 0,
          totalCapacity: 0,
          totalRevenue: 0,
          avgFillRate: 0,
          avgAttendance: 0,
          avgRevenue: 0,
          revenuePerAttendee: 0,
          growthRate: 0,
          topPerformer: ''
        };
      }

      const monthData = acc[monthKey];
      const attendance = session.checkedInCount || 0;
      const capacity = session.capacity || 0;
      const revenue = session.totalPaid || session.revenue || 0;
      const fillRate = capacity > 0 ? (attendance / capacity) * 100 : 0;

      monthData.classes.push({
        sessionName: session.sessionName || 'Hosted Class',
        trainerName: session.trainerName || `${session.trainerFirstName} ${session.trainerLastName}`.trim() || 'Unknown',
        location: session.location || 'Unknown',
        date: session.date || '',
        attendance,
        capacity,
        fillRate,
        revenue,
        type: session.cleanedClass || session.classType || 'Hosted',
        dayOfWeek: session.dayOfWeek || '',
        time: session.time || ''
      });

      monthData.totalClasses += 1;
      monthData.totalAttendance += attendance;
      monthData.totalCapacity += capacity;
      monthData.totalRevenue += revenue;

      return acc;
    }, {} as Record<string, HostedClassData>);

    // Calculate derived metrics for each month
    const monthlyData = Object.values(monthlyGroups).map(monthData => {
      monthData.avgFillRate = monthData.totalCapacity > 0 ? (monthData.totalAttendance / monthData.totalCapacity) * 100 : 0;
      monthData.avgAttendance = monthData.totalClasses > 0 ? monthData.totalAttendance / monthData.totalClasses : 0;
      monthData.avgRevenue = monthData.totalClasses > 0 ? monthData.totalRevenue / monthData.totalClasses : 0;
      monthData.revenuePerAttendee = monthData.totalAttendance > 0 ? monthData.totalRevenue / monthData.totalAttendance : 0;

      // Find top performer (highest revenue class)
      const topClass = monthData.classes.reduce((best, current) => 
        current.revenue > best.revenue ? current : best, 
        monthData.classes[0] || { revenue: 0, sessionName: 'None' }
      );
      monthData.topPerformer = topClass.sessionName;

      return monthData;
    });

    // Calculate growth rates
    const sortedMonths = monthlyData.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    sortedMonths.forEach((monthData, index) => {
      if (index > 0) {
        const prevMonth = sortedMonths[index - 1];
        const growth = prevMonth.totalRevenue > 0 ? 
          ((monthData.totalRevenue - prevMonth.totalRevenue) / prevMonth.totalRevenue) * 100 : 0;
        monthData.growthRate = growth;
      }
    });

    return sortedMonths;
  }, [data, selectedLocation]);

  const sortedData = useMemo(() => {
    return [...processedData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [processedData, sortColumn, sortDirection]);

  const uniqueLocations = useMemo(() => {
    const locations = [...new Set(data.map(session => session.location).filter(Boolean))];
    return locations.sort();
  }, [data]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const toggleRowExpansion = (monthKey: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedRows(newExpanded);
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    return <ArrowUpDown className={`w-3 h-3 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 10) return 'text-green-600 bg-green-50';
    if (growth > 0) return 'text-blue-600 bg-blue-50';
    if (growth > -10) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const totalMetrics = useMemo(() => {
    return processedData.reduce((acc, month) => ({
      totalClasses: acc.totalClasses + month.totalClasses,
      totalAttendance: acc.totalAttendance + month.totalAttendance,
      totalRevenue: acc.totalRevenue + month.totalRevenue,
      totalCapacity: acc.totalCapacity + month.totalCapacity
    }), { totalClasses: 0, totalAttendance: 0, totalRevenue: 0, totalCapacity: 0 });
  }, [processedData]);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No hosted class data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Hosted Classes Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location Filter</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      All Locations
                    </div>
                  </SelectItem>
                  {uniqueLocations.map(location => (
                    <SelectItem key={location} value={location}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {location}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">View Mode</label>
              <Select value={viewMode} onValueChange={(v: ViewMode) => setViewMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Summary</SelectItem>
                  <SelectItem value="detailed">Detailed View</SelectItem>
                  <SelectItem value="performance">Performance Focus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Actions</label>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Range</label>
              <div className="text-sm text-gray-600">
                {processedData.length} months • {totalMetrics.totalClasses} classes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">
              {formatNumber(totalMetrics.totalClasses)}
            </div>
            <div className="text-sm text-blue-600">Total Hosted Classes</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">
              {formatNumber(totalMetrics.totalAttendance)}
            </div>
            <div className="text-sm text-green-600">Total Attendance</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">
              {formatCurrency(totalMetrics.totalRevenue)}
            </div>
            <div className="text-sm text-purple-600">Total Revenue</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-700">
              {formatPercentage(totalMetrics.totalCapacity > 0 ? (totalMetrics.totalAttendance / totalMetrics.totalCapacity) * 100 : 0)}
            </div>
            <div className="text-sm text-orange-600">Overall Fill Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Data Table */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-0" ref={tableContainerRef as any}>
          <div className="overflow-auto max-h-[800px] border rounded-lg">
            <Table>
              <TableHeader className={`sticky top-0 z-10 border-b-2 ${getTableHeaderClasses('retention')}`}>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12"></TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 whitespace-nowrap min-w-40"
                    onClick={() => handleSort('monthKey')}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Month {getSortIcon('monthKey')}</span>
                      <CopyTableButton 
                        tableRef={tableContainerRef as any}
                        tableName="Hosted Classes Analytics"
                        size="sm"
                        className="ml-2"
                        onCopyAllTabs={async () => getAllTabsText()}
                      />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap"
                    onClick={() => handleSort('totalClasses')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Classes {getSortIcon('totalClasses')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap"
                    onClick={() => handleSort('totalAttendance')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-4 h-4" />
                      Attendance {getSortIcon('totalAttendance')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap"
                    onClick={() => handleSort('avgFillRate')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Fill Rate {getSortIcon('avgFillRate')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-gray-50 text-center whitespace-nowrap"
                    onClick={() => handleSort('totalRevenue')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Revenue {getSortIcon('totalRevenue')}
                    </div>
                  </TableHead>
                  <TableHead className="text-center font-bold whitespace-nowrap">
                    <TrendingUp className="w-4 h-4 mx-auto" />
                    Growth
                  </TableHead>
                  <TableHead className="text-center font-bold whitespace-nowrap">
                    Top Performer
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((monthData) => (
                  <React.Fragment key={monthData.monthKey}>
                    <TableRow 
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors border-b"
                      onClick={() => toggleRowExpansion(monthData.monthKey)}
                    >
                      <TableCell className="text-center">
                        {expandedRows.has(monthData.monthKey) ? 
                          <Button variant="ghost" size="sm">
                            <BarChart3 className="w-4 h-4" />
                          </Button> : 
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        }
                      </TableCell>
                      
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-800">{monthData.monthDisplay}</div>
                          <div className="text-xs text-gray-500">{monthData.monthKey}</div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-gray-800">
                            {formatNumber(monthData.totalClasses)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatNumber(monthData.avgAttendance)} avg
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-800">
                            {formatNumber(monthData.totalAttendance)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatNumber(monthData.totalCapacity)} capacity
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <Badge className={`px-2 py-1 text-sm font-bold ${
                            monthData.avgFillRate >= 80 ? 'bg-green-100 text-green-800' :
                            monthData.avgFillRate >= 60 ? 'bg-blue-100 text-blue-800' :
                            monthData.avgFillRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {formatPercentage(monthData.avgFillRate)}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-800">
                            {formatCurrency(monthData.totalRevenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(monthData.avgRevenue)} avg
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge className={`px-2 py-1 text-xs font-semibold ${getGrowthColor(monthData.growthRate)}`}>
                          {monthData.growthRate > 0 ? '+' : ''}{formatPercentage(monthData.growthRate)}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="text-xs text-gray-700 max-w-32 truncate">
                          {monthData.topPerformer}
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {expandedRows.has(monthData.monthKey) && (
                      <TableRow className="bg-gray-50/30">
                        <TableCell colSpan={8} className="p-0">
                          <Collapsible open={true}>
                            <CollapsibleContent>
                              <div className="p-6">
                                <div className="bg-white rounded-lg border">
                                  <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                                    <h4 className="font-semibold text-gray-800">Individual Hosted Classes - {monthData.monthDisplay}</h4>
                                  </div>
                                  <div className="overflow-auto max-h-60">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="whitespace-nowrap">Class Name</TableHead>
                                          <TableHead className="whitespace-nowrap">Trainer</TableHead>
                                          <TableHead className="whitespace-nowrap">Date</TableHead>
                                          <TableHead className="whitespace-nowrap">Day</TableHead>
                                          <TableHead className="whitespace-nowrap">Time</TableHead>
                                          <TableHead className="text-center whitespace-nowrap">Attendance</TableHead>
                                          <TableHead className="text-center whitespace-nowrap">Fill Rate</TableHead>
                                          <TableHead className="text-center whitespace-nowrap">Revenue</TableHead>
                                          <TableHead className="whitespace-nowrap">Location</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {monthData.classes.map((classItem, index) => (
                                          <TableRow key={index} className="hover:bg-gray-50">
                                            <TableCell className="font-medium whitespace-nowrap">
                                              {classItem.sessionName}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                              {classItem.trainerName}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                              {classItem.date}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                              {classItem.dayOfWeek}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                              <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                {classItem.time}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <div className="space-y-1">
                                                <div className="font-semibold">
                                                  {formatNumber(classItem.attendance)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                  /{formatNumber(classItem.capacity)}
                                                </div>
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <Badge className={`px-2 py-1 text-xs ${
                                                classItem.fillRate >= 80 ? 'bg-green-100 text-green-800' :
                                                classItem.fillRate >= 60 ? 'bg-blue-100 text-blue-800' :
                                                classItem.fillRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                              }`}>
                                                {formatPercentage(classItem.fillRate)}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                              {formatCurrency(classItem.revenue)}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                              <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-gray-400" />
                                                {classItem.location}
                                              </div>
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

      {/* Footer Info */}
      <div className="text-sm text-gray-600 text-center">
        Showing {processedData.length} months of hosted class data • 
        Total: {totalMetrics.totalClasses} classes, {formatNumber(totalMetrics.totalAttendance)} attendees, {formatCurrency(totalMetrics.totalRevenue)} revenue •
        Average fill rate: {formatPercentage(totalMetrics.totalCapacity > 0 ? (totalMetrics.totalAttendance / totalMetrics.totalCapacity) * 100 : 0)}
      </div>
    </div>
  );
};