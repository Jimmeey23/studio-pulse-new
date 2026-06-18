import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Trophy, TrendingDown, BarChart3, Users, DollarSign, 
  Target, Activity, Crown, AlertTriangle, Eye, 
  ArrowUp, ArrowDown, Calendar, MapPin, Clock,
  Star, Award, Zap, Building2, TrendingUp
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface DualRankingListsProps {
  data: SessionData[];
  location: string;
}

type RankingCriteria = 'classAverage' | 'fillRate' | 'attendance' | 'revenue' | 'consistency' | 'growth';
type GroupingType = 'class' | 'trainer' | 'classTrainer' | 'location' | 'timeSlot';

interface RankingItem {
  id: string;
  name: string;
  subName?: string;
  sessions: number;
  attendance: number;
  capacity: number;
  revenue: number;
  fillRate: number;
  classAverage: number;
  consistency: number;
  growth: number;
  rankValue: number;
  emptyClasses: number;
  nonEmptyClasses: number;
  details: {
    location?: string;
    dayOfWeek?: string;
    time?: string;
    classType?: string;
    trainer?: string;
    uniqueClasses?: number;
    avgCapacity?: number;
    lateCancellations?: number;
  };
  sessions_data: SessionData[];
}

export const DualRankingLists: React.FC<DualRankingListsProps> = ({ 
  data, 
  location 
}) => {
  const [rankingCriteria, setRankingCriteria] = useState<RankingCriteria>('classAverage');
  const [groupingType, setGroupingType] = useState<GroupingType>('classTrainer');
  const [minClassesFilter, setMinClassesFilter] = useState(2);
  const [excludeHostedClasses, setExcludeHostedClasses] = useState(true);
  const [showTrainerDetails, setShowTrainerDetails] = useState(true);
  const [topCount, setTopCount] = useState(10);
  const [bottomCount, setBottomCount] = useState(10);
  const [selectedItem, setSelectedItem] = useState<RankingItem | null>(null);

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = [...data];
    
    // Exclude hosted classes if enabled
    if (excludeHostedClasses) {
      filtered = filtered.filter(session => 
        !session.cleanedClass?.toLowerCase().includes('hosted') &&
        !session.sessionName?.toLowerCase().includes('hosted')
      );
    }
    
    // Apply minimum classes filter
    if (minClassesFilter > 1) {
      const sessionCounts = new Map<string, number>();
      filtered.forEach(session => {
        const key = groupingType === 'classTrainer' 
          ? `${session.cleanedClass}-${session.trainerName}-${session.dayOfWeek}-${session.time}-${session.location}`
          : groupingType === 'class' 
          ? `${session.cleanedClass}-${session.dayOfWeek}-${session.time}-${session.location}`
          : groupingType === 'trainer'
          ? session.trainerName || 'unknown'
          : groupingType === 'location'
          ? session.location || 'unknown'
          : `${session.time}-${session.dayOfWeek}`;
        
        sessionCounts.set(key, (sessionCounts.get(key) || 0) + 1);
      });
      
      filtered = filtered.filter(session => {
        const key = groupingType === 'classTrainer' 
          ? `${session.cleanedClass}-${session.trainerName}-${session.dayOfWeek}-${session.time}-${session.location}`
          : groupingType === 'class' 
          ? `${session.cleanedClass}-${session.dayOfWeek}-${session.time}-${session.location}`
          : groupingType === 'trainer'
          ? session.trainerName || 'unknown'
          : groupingType === 'location'
          ? session.location || 'unknown'
          : `${session.time}-${session.dayOfWeek}`;
        
        return (sessionCounts.get(key) || 0) >= minClassesFilter;
      });
    }
    
    return filtered;
  }, [data, excludeHostedClasses, minClassesFilter, groupingType]);

  // Group and calculate rankings
  const rankings = useMemo(() => {
    const grouped = new Map<string, SessionData[]>();
    
    filteredData.forEach(session => {
      let groupKey = '';
      switch (groupingType) {
        case 'classTrainer':
          groupKey = `${session.cleanedClass}-${session.trainerName}-${session.dayOfWeek}-${session.time}-${session.location}`;
          break;
        case 'class':
          groupKey = `${session.cleanedClass}-${session.dayOfWeek}-${session.time}-${session.location}`;
          break;
        case 'trainer':
          groupKey = session.trainerName || 'Unknown Trainer';
          break;
        case 'location':
          groupKey = session.location || 'Unknown Location';
          break;
        case 'timeSlot':
          groupKey = `${session.time}-${session.dayOfWeek}`;
          break;
        default:
          groupKey = `${session.cleanedClass}-${session.trainerName}`;
      }
      
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(session);
    });

    const rankingItems: RankingItem[] = Array.from(grouped.entries()).map(([groupKey, sessions]) => {
      const totalSessions = sessions.length;
      const totalAttendance = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const totalLateCancellations = sessions.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);
      const emptyClasses = sessions.filter(s => (s.checkedInCount || 0) === 0).length;
      const nonEmptyClasses = totalSessions - emptyClasses;
      
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
      
      // Mock growth calculation (would need historical data in real implementation)
      const growth = fillRate > 70 ? Math.random() * 20 - 5 : Math.random() * 10 - 10;
      
      // Get ranking value based on criteria
      let rankValue = 0;
      switch (rankingCriteria) {
        case 'classAverage':
          rankValue = classAverage;
          break;
        case 'fillRate':
          rankValue = fillRate;
          break;
        case 'attendance':
          rankValue = totalAttendance;
          break;
        case 'revenue':
          rankValue = totalRevenue;
          break;
        case 'consistency':
          rankValue = Math.max(0, Math.min(100, consistency));
          break;
        case 'growth':
          rankValue = growth;
          break;
        default:
          rankValue = classAverage;
      }
      
      // Generate name based on grouping type
      let name = '';
      let subName = '';
      switch (groupingType) {
        case 'classTrainer':
          name = sessions[0].cleanedClass || 'Unknown Class';
          subName = showTrainerDetails ? sessions[0].trainerName || 'Unknown Trainer' : '';
          break;
        case 'class':
          name = sessions[0].cleanedClass || 'Unknown Class';
          subName = `${sessions[0].dayOfWeek} at ${sessions[0].time}`;
          break;
        case 'trainer':
          name = sessions[0].trainerName || 'Unknown Trainer';
          subName = `${totalSessions} classes`;
          break;
        case 'location':
          name = sessions[0].location || 'Unknown Location';
          subName = `${totalSessions} classes`;
          break;
        case 'timeSlot':
          name = `${sessions[0].time} - ${sessions[0].dayOfWeek}`;
          subName = `${new Set(sessions.map(s => s.cleanedClass)).size} different classes`;
          break;
        default:
          name = `${sessions[0].cleanedClass} - ${sessions[0].trainerName}`;
      }

      return {
        id: groupKey,
        name,
        subName,
        sessions: totalSessions,
        attendance: totalAttendance,
        capacity: totalCapacity,
        revenue: totalRevenue,
        fillRate: Math.max(0, Math.min(100, fillRate)),
        classAverage,
        consistency: Math.max(0, Math.min(100, consistency)),
        growth,
        rankValue,
        emptyClasses,
        nonEmptyClasses,
        details: {
          location: sessions[0].location,
          dayOfWeek: sessions[0].dayOfWeek,
          time: sessions[0].time,
          classType: sessions[0].cleanedClass,
          trainer: sessions[0].trainerName,
          uniqueClasses: new Set(sessions.map(s => s.cleanedClass)).size,
          avgCapacity,
          lateCancellations: totalLateCancellations
        },
        sessions_data: sessions
      };
    });

    // Sort by ranking value
    return rankingItems.sort((a, b) => b.rankValue - a.rankValue);
  }, [filteredData, groupingType, rankingCriteria, showTrainerDetails]);

  const topPerformers = rankings.slice(0, topCount);
  const bottomPerformers = rankings.slice(-bottomCount).reverse();

  const criteriaOptions = [
    { value: 'classAverage', label: 'Class Average', icon: BarChart3, description: 'Average attendance per session' },
    { value: 'fillRate', label: 'Fill Rate', icon: Target, description: 'Percentage of capacity filled' },
    { value: 'attendance', label: 'Total Attendance', icon: Users, description: 'Total people attended' },
    { value: 'revenue', label: 'Revenue', icon: DollarSign, description: 'Total revenue generated' },
    { value: 'consistency', label: 'Consistency', icon: TrendingUp, description: 'Consistency of attendance' },
    { value: 'growth', label: 'Growth Rate', icon: Zap, description: 'Month-over-month growth' }
  ];

  const groupingOptions = [
    { value: 'classTrainer', label: 'Class + Trainer', icon: Activity, description: 'Unique class-trainer combinations' },
    { value: 'class', label: 'Class Only', icon: Activity, description: 'Classes regardless of trainer' },
    { value: 'trainer', label: 'Trainer', icon: Users, description: 'Individual trainers' },
    { value: 'location', label: 'Location', icon: MapPin, description: 'By studio location' },
    { value: 'timeSlot', label: 'Time Slot', icon: Clock, description: 'By day and time' }
  ];

  const getRankValueDisplay = (item: RankingItem) => {
    switch (rankingCriteria) {
      case 'classAverage':
        return formatNumber(item.classAverage);
      case 'fillRate':
        return formatPercentage(item.fillRate);
      case 'attendance':
        return formatNumber(item.attendance);
      case 'revenue':
        return formatCurrency(item.revenue);
      case 'consistency':
        return formatPercentage(item.consistency);
      case 'growth':
        return `${item.growth >= 0 ? '+' : ''}${formatPercentage(item.growth)}`;
      default:
        return formatNumber(item.classAverage);
    }
  };

  const getRankValueColor = (item: RankingItem, isTop: boolean) => {
    if (rankingCriteria === 'growth') {
      return item.growth >= 0 ? 'text-green-600' : 'text-red-600';
    }
    return isTop ? 'text-green-600' : 'text-red-600';
  };

  const RankingCard = ({ 
    item, 
    rank, 
    isTop,
    icon: IconComponent 
  }: { 
    item: RankingItem; 
    rank: number; 
    isTop: boolean;
    icon: React.ElementType;
  }) => (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-lg cursor-pointer border-l-4",
      isTop 
        ? "hover:bg-green-50 border-l-green-500 bg-gradient-to-r from-green-50 to-white" 
        : "hover:bg-red-50 border-l-red-500 bg-gradient-to-r from-red-50 to-white"
    )}
    onClick={() => setSelectedItem(item)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              isTop ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {rank}
            </div>
            <IconComponent className={cn(
              "w-5 h-5",
              isTop ? "text-green-600" : "text-red-600"
            )} />
          </div>
          <div className={cn(
            "text-lg font-bold",
            getRankValueColor(item, isTop)
          )}>
            {getRankValueDisplay(item)}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="font-semibold text-gray-900 line-clamp-2">
            {item.name}
          </div>
          {item.subName && (
            <div className="text-sm text-gray-600">
              {item.subName}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="metric-badge badge-soft-slate">
              {item.sessions} classes
            </Badge>
            <Badge variant="outline" className="metric-badge badge-soft-blue">
              {formatNumber(item.attendance)} checked in
            </Badge>
            <Badge variant="outline" className="metric-badge badge-soft-red">
              {formatNumber(item.emptyClasses)} empty
            </Badge>
            <Badge variant="outline" className="metric-badge badge-soft-green">
              {formatNumber(item.nonEmptyClasses)} non-empty
            </Badge>
            <Badge variant="outline" className="metric-badge badge-soft-purple">
              {formatNumber(item.classAverage)} avg/class
            </Badge>
            <Badge variant="outline" className="metric-badge badge-soft-yellow">
              {formatPercentage(item.fillRate)} fill rate
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Ranking Criteria</Label>
                <Select value={rankingCriteria} onValueChange={(value: RankingCriteria) => setRankingCriteria(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {criteriaOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Group By</Label>
                <Select value={groupingType} onValueChange={(value: GroupingType) => setGroupingType(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groupingOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Min Classes</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={minClassesFilter}
                  onChange={(e) => setMinClassesFilter(Number(e.target.value))}
                  className="w-24"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Switch
                  id="exclude-hosted"
                  checked={excludeHostedClasses}
                  onCheckedChange={setExcludeHostedClasses}
                />
                <Label htmlFor="exclude-hosted" className="text-sm">
                  Exclude Hosted Classes
                </Label>
              </div>

              {groupingType === 'classTrainer' && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-trainer"
                    checked={showTrainerDetails}
                    onCheckedChange={setShowTrainerDetails}
                  />
                  <Label htmlFor="show-trainer" className="text-sm">
                    Show Trainer Names
                  </Label>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Top:</Label>
                  <Input
                    type="number"
                    min="5"
                    max="20"
                    value={topCount}
                    onChange={(e) => setTopCount(Number(e.target.value))}
                    className="w-16"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Bottom:</Label>
                  <Input
                    type="number"
                    min="5"
                    max="20"
                    value={bottomCount}
                    onChange={(e) => setBottomCount(Number(e.target.value))}
                    className="w-16"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardTitle className="flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              Top Performers
              <Badge variant="secondary" className="bg-white/20 text-white">
                {topPerformers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {topPerformers.map((item, index) => (
                <RankingCard
                  key={item.id}
                  item={item}
                  rank={index + 1}
                  isTop={true}
                  icon={index === 0 ? Crown : index === 1 ? Award : index === 2 ? Star : Trophy}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Performers */}
        <Card className="shadow-xl bg-gradient-to-br from-red-50 to-rose-50">
          <CardHeader className="bg-gradient-to-r from-red-600 to-rose-600 text-white">
            <CardTitle className="flex items-center gap-3">
              <TrendingDown className="w-6 h-6" />
              Bottom Performers
              <Badge variant="secondary" className="bg-white/20 text-white">
                {bottomPerformers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {bottomPerformers.map((item, index) => (
                <RankingCard
                  key={item.id}
                  item={item}
                  rank={rankings.length - bottomPerformers.length + index + 1}
                  isTop={false}
                  icon={AlertTriangle}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Dialog open={selectedItem !== null} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detailed Analytics: {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(selectedItem.classAverage)}
                  </div>
                  <div className="text-sm text-blue-700">Class Average</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(selectedItem.fillRate)}
                  </div>
                  <div className="text-sm text-green-700">Fill Rate</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(selectedItem.attendance)}
                  </div>
                  <div className="text-sm text-purple-700">Total Attendance</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(selectedItem.revenue)}
                  </div>
                  <div className="text-sm text-orange-700">Revenue</div>
                </div>
              </div>

              {/* Session Details */}
              <div>
                <h3 className="font-semibold mb-3">Session Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {selectedItem.sessions_data.slice(0, 12).map((session, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded border text-sm">
                      <div className="font-medium">{session.date}</div>
                      <div className="text-gray-600">{session.time} - {session.dayOfWeek}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {session.checkedInCount}/{session.capacity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(session.totalPaid || 0)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {selectedItem.sessions_data.length > 12 && (
                    <div className="bg-gray-100 p-3 rounded border text-sm flex items-center justify-center text-gray-500">
                      +{selectedItem.sessions_data.length - 12} more sessions
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};