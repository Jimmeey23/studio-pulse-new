import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  Filter,
  Eye,
  Award,
  Target,
  Activity,
  ChevronDown,
  ArrowUpDown,
  Search,
  X
} from 'lucide-react';
import type { SessionData } from './types';
import { formatCurrency } from './utils/calculations';

type Props = { 
  sessions: SessionData[] 
};

interface DrilldownData {
  title: string;
  sessions: SessionData[];
}

type GroupingOption = 
  | 'trainer' 
  | 'class' 
  | 'location' 
  | 'day' 
  | 'time' 
  | 'date'
  | 'classFormat'
  | 'timeSlot'
  | 'dayTime'
  | 'locationTrainer'
  | 'classTrainer'
  | 'locationClass'
  | 'dayClass'
  | 'timeClass'
  | 'monthYear'
  | 'week'
  | 'weekday'
  | 'weekend'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'prime'
  | 'offPeak'
  | 'capacity'
  | 'revenue'
  | 'performance'
  | 'attendance'
  | 'cancellation'
  | 'waitlist'
  | 'utilization';

type ViewOption = 'summary' | 'detailed' | 'metrics' | 'trends' | 'comparison';

type RankingCriteria = 
  | 'totalClasses'
  | 'totalCheckIns'
  | 'classAvg'
  | 'fillRate'
  | 'cancelRate'
  | 'revenue'
  | 'revPerCheckIn'
  | 'revPerBooking'
  | 'revLost'
  | 'avgNoEmpty'
  | 'waitlistPercent'
  | 'weightedUtil'
  | 'consistency'
  | 'utilization'
  | 'performance';

const rankingSortKey: Record<RankingCriteria, keyof TableRow> = {
  totalClasses: 'classes',
  totalCheckIns: 'checkIns',
  classAvg: 'classAvg',
  fillRate: 'fillRate',
  cancelRate: 'cancelRate',
  revenue: 'revenue',
  revPerCheckIn: 'revPerCheckIn',
  revPerBooking: 'revPerBooking',
  revLost: 'revLost',
  avgNoEmpty: 'avgNoEmpty',
  waitlistPercent: 'waitlistPercent',
  weightedUtil: 'weightedUtil',
  consistency: 'consistency',
  utilization: 'weightedUtil',
  performance: 'fillRate',
};

interface TableRow {
  rank: number;
  group: string;
  trainer: string;
  location: string;
  class: string;
  formats: string;
  type: string;
  date: string;
  day: string;
  time: string;
  classes: number;
  checkIns: number;
  classAvg: number;
  fillRate: number;
  cancelRate: number;
  revenue: number;
  revPerCheckIn: number;
  revPerBooking: number;
  revLost: number;
  avgNoEmpty: number;
  waitlistPercent: number;
  weightedUtil: number;
  consistency: number;
  empty: number;
  capacity: number;
  booked: number;
  lateCancel: number;
  waitlist: number;
  data: SessionData[];
}

const formatNumber = (value: number, decimals: number = 0) => {
  return value.toLocaleString(undefined, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

const formatPercentage = (value: number, decimals: number = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export default function MainDashboard({ sessions }: Props) {
  const [drilldownData, setDrilldownData] = useState<DrilldownData | null>(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupingOption>('trainer');
  const [viewType, setViewType] = useState<ViewOption>('detailed');
  const [rankingCriteria, setRankingCriteria] = useState<RankingCriteria>('fillRate');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof TableRow>('fillRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const nextKey = rankingSortKey[rankingCriteria];
    setSortColumn(nextKey);
    setSortDirection('desc');
  }, [rankingCriteria]);

  const groupingOptions: { value: GroupingOption; label: string }[] = [
    { value: 'trainer', label: 'Trainer' },
    { value: 'class', label: 'Class Format' },
    { value: 'location', label: 'Location' },
    { value: 'day', label: 'Day of Week' },
    { value: 'time', label: 'Time Slot' },
    { value: 'date', label: 'Date' },
    { value: 'classFormat', label: 'Class Format Type' },
    { value: 'timeSlot', label: 'Time Slot Groups' },
    { value: 'dayTime', label: 'Day + Time' },
    { value: 'locationTrainer', label: 'Location + Trainer' },
    { value: 'classTrainer', label: 'Class + Trainer' },
    { value: 'locationClass', label: 'Location + Class' },
    { value: 'dayClass', label: 'Day + Class' },
    { value: 'timeClass', label: 'Time + Class' },
    { value: 'monthYear', label: 'Month/Year' },
    { value: 'week', label: 'Week' },
    { value: 'weekday', label: 'Weekdays vs Weekends' },
    { value: 'weekend', label: 'Weekend Classes' },
    { value: 'morning', label: 'Morning Classes' },
    { value: 'afternoon', label: 'Afternoon Classes' },
    { value: 'evening', label: 'Evening Classes' },
    { value: 'prime', label: 'Prime Time' },
    { value: 'offPeak', label: 'Off-Peak Hours' },
    { value: 'capacity', label: 'By Capacity Range' },
    { value: 'revenue', label: 'By Revenue Range' },
    { value: 'performance', label: 'By Performance Tier' },
    { value: 'attendance', label: 'By Attendance Level' },
    { value: 'cancellation', label: 'By Cancellation Rate' },
    { value: 'waitlist', label: 'By Waitlist Activity' },
    { value: 'utilization', label: 'By Utilization Rate' }
  ];

  const viewOptions: { value: ViewOption; label: string }[] = [
    { value: 'summary', label: 'Summary View' },
    { value: 'detailed', label: 'Detailed View' },
    { value: 'metrics', label: 'Metrics Focus' },
    { value: 'trends', label: 'Trends Analysis' },
    { value: 'comparison', label: 'Comparison View' }
  ];

  const rankingCriteriaOptions: { value: RankingCriteria; label: string }[] = [
    { value: 'totalClasses', label: 'Total Classes' },
    { value: 'totalCheckIns', label: 'Total Check-ins' },
    { value: 'classAvg', label: 'Class Average' },
    { value: 'fillRate', label: 'Fill Rate' },
    { value: 'cancelRate', label: 'Cancellation Rate' },
    { value: 'revenue', label: 'Total Revenue' },
    { value: 'revPerCheckIn', label: 'Revenue per Check-in' },
    { value: 'revPerBooking', label: 'Revenue per Booking' },
    { value: 'revLost', label: 'Revenue Lost' },
    { value: 'avgNoEmpty', label: 'Average (No Empty)' },
    { value: 'waitlistPercent', label: 'Waitlist %' },
    { value: 'weightedUtil', label: 'Weighted Utilization %' },
    { value: 'consistency', label: 'Consistency Score' },
    { value: 'utilization', label: 'Utilization Rate' },
    { value: 'performance', label: 'Overall Performance' }
  ];

  const processedData = useMemo(() => {
    const groupedData = new Map<string, SessionData[]>();
    
    // Group sessions based on selected grouping option
    sessions.forEach(session => {
      let key = '';
      
      switch (groupBy) {
        case 'trainer':
          key = session.Trainer || 'Unknown';
          break;
        case 'class':
          key = session.Class || 'Unknown';
          break;
        case 'location':
          key = session.Location || 'Unknown';
          break;
        case 'day':
          key = session.Day || 'Unknown';
          break;
        case 'time':
          key = session.Time || 'Unknown';
          break;
        case 'date':
          key = session.Date || 'Unknown';
          break;
        case 'locationTrainer':
          key = `${session.Location} - ${session.Trainer}`;
          break;
        case 'classTrainer':
          key = `${session.Class} - ${session.Trainer}`;
          break;
        case 'dayTime':
          key = `${session.Day} ${session.Time}`;
          break;
        case 'morning':
          const hour = parseInt(session.Time?.split(':')[0] || '12');
          if (hour >= 6 && hour < 12) key = 'Morning Classes';
          else key = 'Non-Morning';
          break;
        case 'afternoon':
          const hourAft = parseInt(session.Time?.split(':')[0] || '12');
          if (hourAft >= 12 && hourAft < 18) key = 'Afternoon Classes';
          else key = 'Non-Afternoon';
          break;
        case 'evening':
          const hourEve = parseInt(session.Time?.split(':')[0] || '12');
          if (hourEve >= 18) key = 'Evening Classes';
          else key = 'Non-Evening';
          break;
        case 'weekday':
          if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(session.Day)) {
            key = 'Weekdays';
          } else {
            key = 'Weekends';
          }
          break;
        case 'capacity':
          const capacity = session.Capacity || 0;
          if (capacity <= 10) key = 'Small (≤10)';
          else if (capacity <= 20) key = 'Medium (11-20)';
          else key = 'Large (>20)';
          break;
        case 'performance':
          const fillRate = session.Capacity ? (session.CheckedIn / session.Capacity) * 100 : 0;
          if (fillRate >= 80) key = 'High Performers';
          else if (fillRate >= 60) key = 'Medium Performers';
          else key = 'Low Performers';
          break;
        default:
          key = session.Trainer || 'Unknown';
      }
      
      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      groupedData.get(key)?.push(session);
    });

    // Convert to table rows with calculations
    const rows: TableRow[] = Array.from(groupedData.entries()).map(([groupKey, groupSessions]) => {
      const totalClasses = groupSessions.length;
      const totalCheckIns = groupSessions.reduce((sum, s) => sum + (s.CheckedIn || 0), 0);
      const totalCapacity = groupSessions.reduce((sum, s) => sum + (s.Capacity || 0), 0);
      const totalRevenue = groupSessions.reduce((sum, s) => sum + (s.Revenue || 0), 0);
      const totalBooked = groupSessions.reduce((sum, s) => sum + (s.Booked || 0), 0);
      const totalLateCancelled = groupSessions.reduce((sum, s) => sum + (s.LateCancelled || 0), 0);
      const totalWaitlisted = groupSessions.reduce((sum, s) => sum + (s.Waitlisted || 0), 0);
      
      const classAvg = totalClasses > 0 ? totalCheckIns / totalClasses : 0;
      const fillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
      const cancelRate = totalBooked > 0 ? (totalLateCancelled / totalBooked) * 100 : 0;
      const revPerCheckIn = totalCheckIns > 0 ? totalRevenue / totalCheckIns : 0;
      const revPerBooking = totalBooked > 0 ? totalRevenue / totalBooked : 0;
      const revLost = totalLateCancelled * revPerBooking;
      
      const nonEmptyClasses = groupSessions.filter(s => (s.CheckedIn || 0) > 0);
      const avgNoEmpty = nonEmptyClasses.length > 0 ? 
        nonEmptyClasses.reduce((sum, s) => sum + (s.CheckedIn || 0), 0) / nonEmptyClasses.length : 0;
      
      const waitlistPercent = totalBooked > 0 ? (totalWaitlisted / totalBooked) * 100 : 0;
      const weightedUtil = totalCapacity > 0 ? 
        (totalCheckIns + (totalWaitlisted * 0.5)) / totalCapacity * 100 : 0;
      
      // Consistency calculation
      const variance = totalClasses > 0 ? groupSessions.reduce((sum, s) => {
        const diff = (s.CheckedIn || 0) - classAvg;
        return sum + diff * diff;
      }, 0) / totalClasses : 0;
      const consistency = classAvg > 0 ? Math.max(0, 100 - Math.min(Math.sqrt(variance) / classAvg * 100, 100)) : 0;
      
      const emptyClasses = groupSessions.filter(s => (s.CheckedIn || 0) === 0).length;
      
      // Extract representative values for display
      const sampleSession = groupSessions[0];
      
      return {
        rank: 0, // Will be set after sorting
        group: groupKey,
        trainer: groupBy === 'trainer' ? groupKey : sampleSession?.Trainer || '',
        location: groupBy === 'location' ? groupKey : sampleSession?.Location || '',
        class: groupBy === 'class' ? groupKey : sampleSession?.Class || '',
        formats: sampleSession?.Class || '',
        type: 'Regular', // Could be enhanced based on class type
        date: sampleSession?.Date || '',
        day: sampleSession?.Day || '',
        time: sampleSession?.Time || '',
        classes: totalClasses,
        checkIns: totalCheckIns,
        classAvg: Math.round(classAvg * 10) / 10,
        fillRate: Math.round(fillRate * 10) / 10,
        cancelRate: Math.round(cancelRate * 10) / 10,
        revenue: Math.round(totalRevenue),
        revPerCheckIn: Math.round(revPerCheckIn * 100) / 100,
        revPerBooking: Math.round(revPerBooking * 100) / 100,
        revLost: Math.round(revLost),
        avgNoEmpty: Math.round(avgNoEmpty * 10) / 10,
        waitlistPercent: Math.round(waitlistPercent * 10) / 10,
        weightedUtil: Math.round(weightedUtil * 10) / 10,
        consistency: Math.round(consistency),
        empty: emptyClasses,
        capacity: totalCapacity,
        booked: totalBooked,
        lateCancel: totalLateCancelled,
        waitlist: totalWaitlisted,
        data: groupSessions
      };
    });

    // Sort based on ranking criteria
    rows.sort((a, b) => {
      const aVal = a[rankingCriteria as keyof TableRow] as number;
      const bVal = b[rankingCriteria as keyof TableRow] as number;
      return bVal - aVal; // Descending order
    });

    // Add ranks
    rows.forEach((row, index) => {
      row.rank = index + 1;
    });

    // Apply search filter
    const filteredRows = searchTerm ? rows.filter(row =>
      Object.values(row).some(val => 
        val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    ) : rows;

    return filteredRows;
  }, [sessions, groupBy, rankingCriteria, searchTerm]);

  const handleSort = (column: keyof TableRow) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedData = useMemo(() => {
    return [...processedData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = aVal?.toString() || '';
      const bStr = bVal?.toString() || '';
      return sortDirection === 'asc' ? 
        aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [processedData, sortColumn, sortDirection]);

  const handleRowClick = (row: TableRow) => {
    setDrilldownData({ title: `${row.group} Details`, sessions: row.data });
    setIsDrilldownOpen(true);
  };

  const closeDrilldown = () => {
    setIsDrilldownOpen(false);
    setDrilldownData(null);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <motion.div 
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Controls</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Grouping Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group By ({groupingOptions.length} options)
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupingOption)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {groupingOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View Type ({viewOptions.length} options)
            </label>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as ViewOption)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {viewOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ranking Criteria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ranking Criteria ({rankingCriteriaOptions.length} options)
            </label>
            <select
              value={rankingCriteria}
              onChange={(e) => setRankingCriteria(e.target.value as RankingCriteria)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {rankingCriteriaOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Groups</p>
              <p className="text-2xl font-bold">{processedData.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Check-ins</p>
              <p className="text-2xl font-bold">
                {formatNumber(processedData.reduce((sum, row) => sum + row.checkIns, 0))}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Avg Fill Rate</p>
              <p className="text-2xl font-bold">
                {formatPercentage(processedData.length > 0 ? 
                  processedData.reduce((sum, row) => sum + row.fillRate, 0) / processedData.length : 0
                )}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-200">Total Revenue</p>
              <p className="text-2xl font-bold">
                {formatCurrency(processedData.reduce((sum, row) => sum + row.revenue, 0))}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-slate-100" />
          </div>
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div 
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Performance Analytics ({sortedData.length} groups)
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Grouped by: <strong>{groupingOptions.find(opt => opt.value === groupBy)?.label}</strong></span>
              <span>•</span>
              <span>Ranked by: <strong>{rankingCriteriaOptions.find(opt => opt.value === rankingCriteria)?.label}</strong></span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: 'rank', label: 'Rank', width: 'w-16' },
                  { key: 'group', label: 'Group', width: 'w-32' },
                  { key: 'trainer', label: 'Trainer', width: 'w-24' },
                  { key: 'location', label: 'Location', width: 'w-20' },
                  { key: 'class', label: 'Class', width: 'w-24' },
                  { key: 'formats', label: 'Formats', width: 'w-20' },
                  { key: 'type', label: 'Type', width: 'w-16' },
                  { key: 'date', label: 'Date', width: 'w-20' },
                  { key: 'day', label: 'Day', width: 'w-16' },
                  { key: 'time', label: 'Time', width: 'w-16' },
                  { key: 'classes', label: 'Classes', width: 'w-16' },
                  { key: 'checkIns', label: 'Check-ins', width: 'w-20' },
                  { key: 'classAvg', label: 'Class Avg', width: 'w-20' },
                  { key: 'fillRate', label: 'Fill Rate', width: 'w-20' },
                  { key: 'cancelRate', label: 'Cancel Rate', width: 'w-20' },
                  { key: 'revenue', label: 'Revenue', width: 'w-20' },
                  { key: 'revPerCheckIn', label: 'Rev/Check-in', width: 'w-24' },
                  { key: 'revPerBooking', label: 'Rev/Booking', width: 'w-24' },
                  { key: 'revLost', label: 'Rev Lost', width: 'w-20' },
                  { key: 'avgNoEmpty', label: 'Avg (No Empty)', width: 'w-24' },
                  { key: 'waitlistPercent', label: 'Waitlist %', width: 'w-20' },
                  { key: 'weightedUtil', label: 'Weighted Util%', width: 'w-24' },
                  { key: 'consistency', label: 'Consistency', width: 'w-24' },
                  { key: 'empty', label: 'Empty', width: 'w-16' },
                  { key: 'capacity', label: 'Capacity', width: 'w-20' },
                  { key: 'booked', label: 'Booked', width: 'w-16' },
                  { key: 'lateCancel', label: 'Late Cancel', width: 'w-20' },
                  { key: 'waitlist', label: 'Waitlist', width: 'w-18' }
                ].map(column => (
                  <th 
                    key={column.key}
                    className={`${column.width} px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100`}
                    onClick={() => handleSort(column.key as keyof TableRow)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((row, index) => (
                <tr 
                  key={index}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(row)}
                >
                  <td className="px-3 py-4 text-sm">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-gray-800 font-semibold">
                      {row.rank}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm font-medium text-gray-900 max-w-32 truncate">
                    {row.group}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-700">{row.trainer}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{row.location}</td>
                  <td className="px-3 py-4 text-sm text-gray-700 max-w-24 truncate">{row.class}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{row.formats}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{row.type}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{row.date}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{row.day}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{row.time}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 font-medium">{row.classes}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 font-medium">{formatNumber(row.checkIns)}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{row.classAvg}</td>
                  <td className="px-3 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.fillRate >= 80 ? 'bg-blue-100 text-blue-800' :
                      row.fillRate >= 60 ? 'bg-indigo-100 text-indigo-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {formatPercentage(row.fillRate)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.cancelRate <= 10 ? 'bg-blue-100 text-blue-800' :
                      row.cancelRate <= 20 ? 'bg-indigo-100 text-indigo-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {formatPercentage(row.cancelRate)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm font-medium text-gray-900">{formatCurrency(row.revenue)}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{formatCurrency(row.revPerCheckIn)}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{formatCurrency(row.revPerBooking)}</td>
                  <td className="px-3 py-4 text-sm text-red-600 font-medium">{formatCurrency(row.revLost)}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{row.avgNoEmpty}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{formatPercentage(row.waitlistPercent)}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{formatPercentage(row.weightedUtil)}</td>
                  <td className="px-3 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.consistency >= 80 ? 'bg-blue-100 text-blue-800' :
                      row.consistency >= 60 ? 'bg-indigo-100 text-indigo-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {row.consistency}%
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-700">{row.empty}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{formatNumber(row.capacity)}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{formatNumber(row.booked)}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{formatNumber(row.lateCancel)}</td>
                  <td className="px-3 py-4 text-sm text-gray-700">{formatNumber(row.waitlist)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedData.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No data available for the selected filters</p>
          </div>
        )}
      </motion.div>

      {/* Drilldown Modal */}
      <AnimatePresence>
        {isDrilldownOpen && drilldownData && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrilldown}
          >
            <motion.div
              className="bg-white rounded-xl max-w-6xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{drilldownData.title}</h3>
                  <button
                    onClick={closeDrilldown}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-blue-600 font-medium">Total Sessions</p>
                      <p className="text-xl font-bold text-blue-900">{drilldownData.sessions.length}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-blue-600 font-medium">Total Check-ins</p>
                      <p className="text-xl font-bold text-blue-900">
                        {formatNumber(drilldownData.sessions.reduce((sum, s) => sum + (s.CheckedIn || 0), 0))}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-slate-700 font-medium">Total Revenue</p>
                      <p className="text-xl font-bold text-slate-900">
                        {formatCurrency(drilldownData.sessions.reduce((sum, s) => sum + (s.Revenue || 0), 0))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trainer</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check-ins</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fill Rate</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {drilldownData.sessions.map((session, idx) => {
                          const fillRate = session.Capacity ? (session.CheckedIn / session.Capacity) * 100 : 0;
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-900">{session.Date}</td>
                              <td className="px-3 py-2 text-gray-900">{session.Class}</td>
                              <td className="px-3 py-2 text-gray-700">{session.Trainer}</td>
                              <td className="px-3 py-2 text-gray-900 font-medium">{session.CheckedIn}</td>
                              <td className="px-3 py-2 text-gray-700">{session.Capacity}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  fillRate >= 80 ? 'bg-green-100 text-green-800' :
                                  fillRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {formatPercentage(fillRate)}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-900 font-medium">{formatCurrency(session.Revenue)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}