import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, TrendingUp, BarChart3, Users, DollarSign, 
  Target, Activity, Building2, Percent, RefreshCw, 
  ArrowUp, ArrowDown, Clock, MapPin, Sparkles, ShrinkIcon, ExpandIcon, Star 
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { getTableHeaderClasses } from '@/utils/colorThemes';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';
import { useSessionsFilters } from '@/contexts/SessionsFiltersContext';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { ModernTableWrapper, ModernGroupBadge } from './ModernTableWrapper';

interface MonthOnMonthClassTableProps {
  data: SessionData[];
  location: string;
}

type MetricType = 'attendance' | 'sessions' | 'revenue' | 'fillRate' | 'classAverage' | 'capacity' | 'bookingRate';
type GroupByType = 'trainer' | 'class' | 'location' | 'day_time' | 'trainer_class' | 'uniqueid1' | 'uniqueid2' | 'overall' | 'am_pm' | 'timeslot' | 'class_time' | 'trainer_time' | 'class_day' | 'trainer_day' | 'time_location' | 'class_location' | 'class_day_time_location' | 'trainer_class_day' | 'trainer_location' | 'class_trainer_location' | 'day_location' | 'time_trainer' | 'time_class_location' | 'day_time_trainer' | 'trainer_am_pm' | 'class_am_pm' | 'location_am_pm' | 'class_day_time' | 'trainer_day_time' | 'trainer_class_time' | 'location_day_time' | 'timeslot_location' | 'timeslot_trainer' | 'timeslot_class' | 'trainer_location_am_pm' | 'class_location_day';

interface MonthlyData {
  month: string;
  monthLabel: string;
  sessions: number;
  attendance: number;
  capacity: number;
  revenue: number;
  fillRate: number;
  classAverage: number;
  bookingRate: number;
  lateCancellations: number;
  uniqueClasses: number;
  uniqueTrainers: number;
  booked?: number;
}

interface GroupedRow {
  groupKey: string;
  groupLabel: string;
  monthlyData: Record<string, MonthlyData>;
  totals: MonthlyData;
  sessionDetails?: {
    date: string;
    time: string;
    trainer: string;
    location: string;
    teacher?: string;
    session: SessionData;
  };
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const MonthOnMonthClassTable: React.FC<MonthOnMonthClassTableProps> = ({ 
  data, 
  location 
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('classAverage');
  const [groupBy, setGroupBy] = useState<GroupByType>('class_day_time_location');
  const [showGrowthRate, setShowGrowthRate] = useState(false);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Table ref for copy functionality
  const tableRef = useRef<HTMLTableElement>(null);
  const tableId = 'month-on-month-class-table';
  
  // Register with metrics tables registry
  const { registerTable, unregisterTable } = useMetricsTablesRegistry();
  
  useEffect(() => {
    if (tableRef.current) {
      const getTextContent = () => {
        if (tableRef.current) {
          return tableRef.current.innerText || '';
        }
        return '';
      };
      
      registerTable({
        id: tableId,
        getTextContent
      });
      
      return () => unregisterTable(tableId);
    }
  }, [registerTable, unregisterTable]);

  // Apply location + non-date filters (independent of date range)
  const { filters } = useSessionsFilters();

  const workingData = useMemo(() => {
    let d = data;
    // Filter by selected location tab
    if (location && location !== 'All Locations') {
      d = d.filter(s => (s.location || '') === location);
    }
    // Apply other filters but ignore dateRange
    if (filters) {
      if (filters.trainers.length > 0) {
        d = d.filter(s => filters.trainers.includes(s.trainerName));
      }
      if (filters.classTypes.length > 0) {
        d = d.filter(s => filters.classTypes.includes(s.cleanedClass));
      }
      if (filters.dayOfWeek.length > 0) {
        d = d.filter(s => filters.dayOfWeek.includes(s.dayOfWeek));
      }
      if (filters.timeSlots.length > 0) {
        d = d.filter(s => filters.timeSlots.includes(s.time));
      }
    }
    return d;
  }, [data, location, filters]);

  // Get all unique months from the data (ignoring current filters)
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    workingData.forEach(session => {
      const date = new Date(session.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    
    return Array.from(months).sort().reverse().map(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthIndex = parseInt(month) - 1;
      return {
        key: monthKey,
        label: `${MONTH_NAMES[monthIndex]} ${year}`,
        shortLabel: `${MONTH_NAMES[monthIndex]}'${year.slice(2)}`
      };
    });
  }, [workingData]);

  // Process data by month and grouping
  const processedData = useMemo(() => {
    const groupedSessions = new Map<string, SessionData[]>();
    
    // Group sessions by the selected grouping criteria
    workingData.forEach(session => {
      let groupKey = 'Overall';
      switch (groupBy) {
        case 'trainer':
          groupKey = session.trainerName || 'Unknown Trainer';
          break;
        case 'class':
          groupKey = session.cleanedClass || 'Unknown Class';
          break;
        case 'location':
          groupKey = session.location || 'Unknown Location';
          break;
        case 'day_time':
          groupKey = `${session.dayOfWeek} ${session.time}`;
          break;
        case 'trainer_class':
          groupKey = `${session.trainerName || 'Unknown'} - ${session.cleanedClass || 'Unknown'}`;
          break;
        case 'uniqueid1':
          groupKey = session.uniqueId1 || 'Unknown UniqueID1';
          break;
        case 'uniqueid2':
          groupKey = session.uniqueId2 || 'Unknown UniqueID2';
          break;
        case 'am_pm':
          const hour = parseInt(session.time?.split(':')[0] || '0');
          groupKey = hour < 12 ? 'AM' : 'PM';
          break;
        case 'timeslot':
          const sessionHour = parseInt(session.time?.split(':')[0] || '0');
          if (sessionHour >= 5 && sessionHour < 9) groupKey = 'Early Morning (5-9)';
          else if (sessionHour >= 9 && sessionHour < 12) groupKey = 'Morning (9-12)';
          else if (sessionHour >= 12 && sessionHour < 17) groupKey = 'Afternoon (12-17)';
          else if (sessionHour >= 17 && sessionHour < 21) groupKey = 'Evening (17-21)';
          else groupKey = 'Late Night (21-5)';
          break;
        case 'class_time':
          groupKey = `${session.cleanedClass || 'Unknown'} - ${session.time}`;
          break;
        case 'trainer_time':
          groupKey = `${session.trainerName || 'Unknown'} - ${session.time}`;
          break;
        case 'class_day':
          groupKey = `${session.cleanedClass || 'Unknown'} - ${session.dayOfWeek}`;
          break;
        case 'trainer_day':
          groupKey = `${session.trainerName || 'Unknown'} - ${session.dayOfWeek}`;
          break;
        case 'time_location':
          groupKey = `${session.time} - ${session.location || 'Unknown'}`;
          break;
        case 'class_location':
          groupKey = `${session.cleanedClass || 'Unknown'} - ${session.location || 'Unknown'}`;
          break;
        case 'class_day_time_location':
          groupKey = `${session.cleanedClass || 'Unknown'} - ${session.dayOfWeek} ${session.time} - ${session.location || 'Unknown'}`;
          break;
        case 'trainer_class_day':
          groupKey = `${session.trainerName || 'Unknown'} - ${session.cleanedClass || 'Unknown'} - ${session.dayOfWeek}`;
          break;
        case 'trainer_location':
          groupKey = `${session.trainerName || 'Unknown'} - ${session.location || 'Unknown'}`;
          break;
        case 'class_trainer_location':
          groupKey = `${session.cleanedClass || 'Unknown'} - ${session.trainerName || 'Unknown'} - ${session.location || 'Unknown'}`;
          break;
        case 'day_location':
          groupKey = `${session.dayOfWeek} - ${session.location || 'Unknown'}`;
          break;
        case 'time_trainer':
          groupKey = `${session.time} - ${session.trainerName || 'Unknown'}`;
          break;
        case 'time_class_location':
          groupKey = `${session.time} - ${session.cleanedClass || 'Unknown'} - ${session.location || 'Unknown'}`;
          break;
        case 'day_time_trainer':
          groupKey = `${session.dayOfWeek} ${session.time} - ${session.trainerName || 'Unknown'}`;
          break;
        case 'trainer_am_pm': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          groupKey = `${session.trainerName || 'Unknown'} - ${h < 12 ? 'AM' : 'PM'}`;
          break;
        }
        case 'class_am_pm': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          groupKey = `${session.cleanedClass || 'Unknown'} - ${h < 12 ? 'AM' : 'PM'}`;
          break;
        }
        case 'location_am_pm': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          groupKey = `${session.location || 'Unknown'} - ${h < 12 ? 'AM' : 'PM'}`;
          break;
        }
        case 'class_day_time':
          groupKey = `${session.cleanedClass || 'Unknown'} - ${session.dayOfWeek} ${session.time}`;
          break;
        case 'trainer_day_time':
          groupKey = `${session.trainerName || 'Unknown'} - ${session.dayOfWeek} ${session.time}`;
          break;
        case 'trainer_class_time':
          groupKey = `${session.trainerName || 'Unknown'} - ${session.cleanedClass || 'Unknown'} - ${session.time}`;
          break;
        case 'location_day_time':
          groupKey = `${session.location || 'Unknown'} - ${session.dayOfWeek} ${session.time}`;
          break;
        case 'timeslot_location': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          let slot = '';
          if (h >= 5 && h < 9) slot = 'Early Morning (5-9)';
          else if (h >= 9 && h < 12) slot = 'Morning (9-12)';
          else if (h >= 12 && h < 17) slot = 'Afternoon (12-17)';
          else if (h >= 17 && h < 21) slot = 'Evening (17-21)';
          else slot = 'Late Night (21-5)';
          groupKey = `${slot} - ${session.location || 'Unknown'}`;
          break;
        }
        case 'timeslot_trainer': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          let slot = '';
          if (h >= 5 && h < 9) slot = 'Early Morning (5-9)';
          else if (h >= 9 && h < 12) slot = 'Morning (9-12)';
          else if (h >= 12 && h < 17) slot = 'Afternoon (12-17)';
          else if (h >= 17 && h < 21) slot = 'Evening (17-21)';
          else slot = 'Late Night (21-5)';
          groupKey = `${slot} - ${session.trainerName || 'Unknown'}`;
          break;
        }
        case 'timeslot_class': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          let slot = '';
          if (h >= 5 && h < 9) slot = 'Early Morning (5-9)';
          else if (h >= 9 && h < 12) slot = 'Morning (9-12)';
          else if (h >= 12 && h < 17) slot = 'Afternoon (12-17)';
          else if (h >= 17 && h < 21) slot = 'Evening (17-21)';
          else slot = 'Late Night (21-5)';
          groupKey = `${slot} - ${session.cleanedClass || 'Unknown'}`;
          break;
        }
        case 'trainer_location_am_pm': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          groupKey = `${session.trainerName || 'Unknown'} - ${session.location || 'Unknown'} - ${h < 12 ? 'AM' : 'PM'}`;
          break;
        }
        case 'class_location_day':
          groupKey = `${session.cleanedClass || 'Unknown'} - ${session.location || 'Unknown'} - ${session.dayOfWeek}`;
          break;
        case 'overall':
        default:
          groupKey = 'Overall';
          break;
      }
      
      if (!groupedSessions.has(groupKey)) {
        groupedSessions.set(groupKey, []);
      }
      groupedSessions.get(groupKey)!.push(session);
    });

    // Process each group's monthly data
    const result: GroupedRow[] = Array.from(groupedSessions.entries()).map(([groupKey, sessions]) => {
      const monthlyData: Record<string, MonthlyData> = {};
      
      // Initialize monthly data for all available months
      availableMonths.forEach(month => {
        monthlyData[month.key] = {
          month: month.key,
          monthLabel: month.label,
          sessions: 0,
          attendance: 0,
          capacity: 0,
          revenue: 0,
          fillRate: 0,
          classAverage: 0,
          bookingRate: 0,
          lateCancellations: 0,
          uniqueClasses: 0,
          uniqueTrainers: 0,
          booked: 0
        };
      });

      // Aggregate data by month
      sessions.forEach(session => {
        const date = new Date(session.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData[monthKey]) {
          const monthData = monthlyData[monthKey];
          monthData.sessions += 1;
          monthData.attendance += session.checkedInCount || 0;
          monthData.capacity += session.capacity || 0;
          monthData.revenue += session.totalPaid || 0;
          monthData.lateCancellations += session.lateCancelledCount || 0;
          monthData.booked = (monthData.booked || 0) + (session.bookedCount || 0);
        }
      });

      // Calculate derived metrics for each month
      Object.values(monthlyData).forEach(monthData => {
        monthData.fillRate = monthData.capacity > 0 ? (monthData.attendance / monthData.capacity) * 100 : 0;
        monthData.classAverage = monthData.sessions > 0 ? monthData.attendance / monthData.sessions : 0;
        // Booking rate = booked seats / capacity
        monthData.bookingRate = monthData.capacity > 0 ? (((monthData.booked || 0) as number) / monthData.capacity) * 100 : 0;
      });

      // Calculate totals
      const totals: MonthlyData = {
        month: 'total',
        monthLabel: 'Total',
        sessions: Object.values(monthlyData).reduce((sum, m) => sum + m.sessions, 0),
        attendance: Object.values(monthlyData).reduce((sum, m) => sum + m.attendance, 0),
        capacity: Object.values(monthlyData).reduce((sum, m) => sum + m.capacity, 0),
        revenue: Object.values(monthlyData).reduce((sum, m) => sum + m.revenue, 0),
        lateCancellations: Object.values(monthlyData).reduce((sum, m) => sum + m.lateCancellations, 0),
        fillRate: 0,
        classAverage: 0,
        bookingRate: 0,
        uniqueClasses: 0,
        uniqueTrainers: 0,
        booked: Object.values(monthlyData).reduce((sum, m) => sum + (m.booked || 0), 0)
      };

      totals.fillRate = totals.capacity > 0 ? (totals.attendance / totals.capacity) * 100 : 0;
      totals.classAverage = totals.sessions > 0 ? totals.attendance / totals.sessions : 0;
      totals.bookingRate = totals.capacity > 0 ? (totals.attendance / totals.capacity) * 100 : 0;

      return {
        groupKey,
        groupLabel: groupKey,
        monthlyData,
        totals
      };
    });

    // Sort by total attendance (descending)
    return result.sort((a, b) => b.totals.attendance - a.totals.attendance);
  }, [workingData, groupBy, availableMonths]);

  // Get individual child rows for an expanded group (showing individual sessions per month)
  const getChildRowsForGroup = (groupKey: string): GroupedRow[] => {
    const groupedSessions = new Map<string, SessionData[]>();
    
    // Re-filter data for this specific group
    workingData.forEach(session => {
      let sessionGroupKey = 'Overall';
      switch (groupBy) {
        case 'trainer':
          sessionGroupKey = session.trainerName || 'Unknown Trainer';
          break;
        case 'class':
          sessionGroupKey = session.cleanedClass || 'Unknown Class';
          break;
        case 'location':
          sessionGroupKey = session.location || 'Unknown Location';
          break;
        case 'day_time':
          sessionGroupKey = `${session.dayOfWeek} ${session.time}`;
          break;
        case 'trainer_class':
          sessionGroupKey = `${session.trainerName || 'Unknown'} - ${session.cleanedClass || 'Unknown'}`;
          break;
        case 'uniqueid1':
          sessionGroupKey = session.uniqueId1 || 'Unknown UniqueID1';
          break;
        case 'uniqueid2':
          sessionGroupKey = session.uniqueId2 || 'Unknown UniqueID2';
          break;
        case 'am_pm': {
          const hour = parseInt(session.time?.split(':')[0] || '0');
          sessionGroupKey = hour < 12 ? 'AM' : 'PM';
          break;
        }
        case 'timeslot': {
          const sessionHour = parseInt(session.time?.split(':')[0] || '0');
          if (sessionHour >= 5 && sessionHour < 9) sessionGroupKey = 'Early Morning (5-9)';
          else if (sessionHour >= 9 && sessionHour < 12) sessionGroupKey = 'Morning (9-12)';
          else if (sessionHour >= 12 && sessionHour < 17) sessionGroupKey = 'Afternoon (12-17)';
          else if (sessionHour >= 17 && sessionHour < 21) sessionGroupKey = 'Evening (17-21)';
          else sessionGroupKey = 'Late Night (21-5)';
          break;
        }
        case 'class_time':
          sessionGroupKey = `${session.cleanedClass || 'Unknown'} - ${session.time}`;
          break;
        case 'trainer_time':
          sessionGroupKey = `${session.trainerName || 'Unknown'} - ${session.time}`;
          break;
        case 'class_day':
          sessionGroupKey = `${session.cleanedClass || 'Unknown'} - ${session.dayOfWeek}`;
          break;
        case 'trainer_day':
          sessionGroupKey = `${session.trainerName || 'Unknown'} - ${session.dayOfWeek}`;
          break;
        case 'time_location':
          sessionGroupKey = `${session.time} - ${session.location || 'Unknown'}`;
          break;
        case 'class_location':
          sessionGroupKey = `${session.cleanedClass || 'Unknown'} - ${session.location || 'Unknown'}`;
          break;
        case 'class_day_time_location':
          sessionGroupKey = `${session.cleanedClass || 'Unknown'} - ${session.dayOfWeek} ${session.time} - ${session.location || 'Unknown'}`;
          break;
        case 'trainer_class_day':
          sessionGroupKey = `${session.trainerName || 'Unknown'} - ${session.cleanedClass || 'Unknown'} - ${session.dayOfWeek}`;
          break;
        case 'trainer_location':
          sessionGroupKey = `${session.trainerName || 'Unknown'} - ${session.location || 'Unknown'}`;
          break;
        case 'class_trainer_location':
          sessionGroupKey = `${session.cleanedClass || 'Unknown'} - ${session.trainerName || 'Unknown'} - ${session.location || 'Unknown'}`;
          break;
        case 'day_location':
          sessionGroupKey = `${session.dayOfWeek} - ${session.location || 'Unknown'}`;
          break;
        case 'time_trainer':
          sessionGroupKey = `${session.time} - ${session.trainerName || 'Unknown'}`;
          break;
        case 'time_class_location':
          sessionGroupKey = `${session.time} - ${session.cleanedClass || 'Unknown'} - ${session.location || 'Unknown'}`;
          break;
        case 'day_time_trainer':
          sessionGroupKey = `${session.dayOfWeek} ${session.time} - ${session.trainerName || 'Unknown'}`;
          break;
        case 'trainer_am_pm': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          sessionGroupKey = `${session.trainerName || 'Unknown'} - ${h < 12 ? 'AM' : 'PM'}`;
          break;
        }
        case 'class_am_pm': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          sessionGroupKey = `${session.cleanedClass || 'Unknown'} - ${h < 12 ? 'AM' : 'PM'}`;
          break;
        }
        case 'location_am_pm': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          sessionGroupKey = `${session.location || 'Unknown'} - ${h < 12 ? 'AM' : 'PM'}`;
          break;
        }
        case 'class_day_time':
          sessionGroupKey = `${session.cleanedClass || 'Unknown'} - ${session.dayOfWeek} ${session.time}`;
          break;
        case 'trainer_day_time':
          sessionGroupKey = `${session.trainerName || 'Unknown'} - ${session.dayOfWeek} ${session.time}`;
          break;
        case 'trainer_class_time':
          sessionGroupKey = `${session.trainerName || 'Unknown'} - ${session.cleanedClass || 'Unknown'} - ${session.time}`;
          break;
        case 'location_day_time':
          sessionGroupKey = `${session.location || 'Unknown'} - ${session.dayOfWeek} ${session.time}`;
          break;
        case 'timeslot_location': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          let slot = '';
          if (h >= 5 && h < 9) slot = 'Early Morning (5-9)';
          else if (h >= 9 && h < 12) slot = 'Morning (9-12)';
          else if (h >= 12 && h < 17) slot = 'Afternoon (12-17)';
          else if (h >= 17 && h < 21) slot = 'Evening (17-21)';
          else slot = 'Late Night (21-5)';
          sessionGroupKey = `${slot} - ${session.location || 'Unknown'}`;
          break;
        }
        case 'timeslot_trainer': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          let slot = '';
          if (h >= 5 && h < 9) slot = 'Early Morning (5-9)';
          else if (h >= 9 && h < 12) slot = 'Morning (9-12)';
          else if (h >= 12 && h < 17) slot = 'Afternoon (12-17)';
          else if (h >= 17 && h < 21) slot = 'Evening (17-21)';
          else slot = 'Late Night (21-5)';
          sessionGroupKey = `${slot} - ${session.trainerName || 'Unknown'}`;
          break;
        }
        case 'timeslot_class': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          let slot = '';
          if (h >= 5 && h < 9) slot = 'Early Morning (5-9)';
          else if (h >= 9 && h < 12) slot = 'Morning (9-12)';
          else if (h >= 12 && h < 17) slot = 'Afternoon (12-17)';
          else if (h >= 17 && h < 21) slot = 'Evening (17-21)';
          else slot = 'Late Night (21-5)';
          sessionGroupKey = `${slot} - ${session.cleanedClass || 'Unknown'}`;
          break;
        }
        case 'trainer_location_am_pm': {
          const h = parseInt(session.time?.split(':')[0] || '0');
          sessionGroupKey = `${session.trainerName || 'Unknown'} - ${session.location || 'Unknown'} - ${h < 12 ? 'AM' : 'PM'}`;
          break;
        }
        case 'class_location_day':
          sessionGroupKey = `${session.cleanedClass || 'Unknown'} - ${session.location || 'Unknown'} - ${session.dayOfWeek}`;
          break;
        case 'overall':
        default:
          sessionGroupKey = 'Overall';
          break;
      }
      
      if (sessionGroupKey === groupKey) {
        if (!groupedSessions.has(sessionGroupKey)) {
          groupedSessions.set(sessionGroupKey, []);
        }
        groupedSessions.get(sessionGroupKey)!.push(session);
      }
    });

    // Now create a row for each individual session within this group
    const allSessions = groupedSessions.get(groupKey) || [];
    const childRows: GroupedRow[] = allSessions.map((session, idx) => {
      const monthlyData: Record<string, MonthlyData> = {};
      
      availableMonths.forEach(month => {
        monthlyData[month.key] = {
          month: month.key,
          monthLabel: month.label,
          sessions: 0,
          attendance: 0,
          capacity: 0,
          revenue: 0,
          fillRate: 0,
          classAverage: 0,
          bookingRate: 0,
          lateCancellations: 0,
          uniqueClasses: 0,
          uniqueTrainers: 0,
          booked: 0
        };
      });

      const date = new Date(session.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[monthKey]) {
        const monthData = monthlyData[monthKey];
        monthData.sessions = 1;
        monthData.attendance = session.checkedInCount || 0;
        monthData.capacity = session.capacity || 0;
        monthData.revenue = session.totalPaid || 0;
        monthData.fillRate = monthData.capacity > 0 ? (monthData.attendance / monthData.capacity) * 100 : 0;
        monthData.classAverage = monthData.attendance;
        monthData.booked = session.bookedCount || 0;
        monthData.bookingRate = monthData.capacity > 0 ? (monthData.booked / monthData.capacity) * 100 : 0;
        monthData.lateCancellations = session.lateCancelledCount || 0;
      }

      const totals: MonthlyData = {
        month: 'total',
        monthLabel: 'Total',
        sessions: 1,
        attendance: session.checkedInCount || 0,
        capacity: session.capacity || 0,
        revenue: session.totalPaid || 0,
        lateCancellations: session.lateCancelledCount || 0,
        fillRate: 0,
        classAverage: session.checkedInCount || 0,
        bookingRate: 0,
        uniqueClasses: 0,
        uniqueTrainers: 0,
        booked: session.bookedCount || 0
      };

      totals.fillRate = totals.capacity > 0 ? (totals.attendance / totals.capacity) * 100 : 0;
      totals.bookingRate = totals.capacity > 0 ? (totals.booked / totals.capacity) * 100 : 0;

      return {
        groupKey: `${groupKey}__child__${idx}`,
        groupLabel: `${session.date} - ${session.cleanedClass || 'Unknown'} - ${session.trainerName || 'Unknown'}`,
        monthlyData,
        totals
      };
    });

    return childRows.sort((a, b) => b.totals.attendance - a.totals.attendance);
  };

  const getMetricValue = (monthData: MonthlyData, metric: MetricType): string => {
    switch (metric) {
      case 'attendance':
        return formatNumber(monthData.attendance);
      case 'sessions':
        return formatNumber(monthData.sessions);
      case 'revenue':
        return formatNumber(monthData.revenue);
      case 'fillRate':
        return formatPercentage(monthData.fillRate);
      case 'classAverage':
        return monthData.classAverage.toFixed(1);
      case 'capacity':
        return formatNumber(monthData.capacity);
      case 'bookingRate':
        return formatPercentage(monthData.bookingRate);
      default:
        return formatNumber(monthData.attendance);
    }
  };

  const getGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const metricOptions = [
    { value: 'attendance', label: 'Attendance', icon: Users },
    { value: 'sessions', label: 'Sessions', icon: Calendar },
    { value: 'revenue', label: 'Revenue', icon: DollarSign },
    { value: 'fillRate', label: 'Fill Rate', icon: Target },
    { value: 'classAverage', label: 'Class Average', icon: BarChart3 },
    { value: 'capacity', label: 'Capacity', icon: Building2 },
    { value: 'bookingRate', label: 'Booking Rate', icon: Percent }
  ];

  const groupOptions = [
    { value: 'class_day_time_location', label: 'Class + Day + Time + Location', icon: BarChart3 },
    { value: 'overall', label: 'Overall', icon: BarChart3 },
    { value: 'class', label: 'By Class', icon: Activity },
    { value: 'trainer', label: 'By Trainer', icon: Users },
    { value: 'location', label: 'By Location', icon: MapPin },
    { value: 'day_time', label: 'By Day & Time', icon: Clock },
    { value: 'class_day_time', label: 'Class + Day + Time', icon: Activity },
    { value: 'trainer_class_day', label: 'Trainer + Class + Day', icon: Users },
    { value: 'trainer_location', label: 'Trainer + Location', icon: Users },
    { value: 'class_trainer_location', label: 'Class + Trainer + Location', icon: Activity },
    { value: 'day_location', label: 'Day + Location', icon: MapPin },
    { value: 'am_pm', label: 'By AM/PM', icon: Clock },
    { value: 'timeslot', label: 'By Timeslot', icon: Clock },
    { value: 'class_time', label: 'Class + Time', icon: Activity },
    { value: 'trainer_time', label: 'Trainer + Time', icon: Users },
    { value: 'class_day', label: 'Class + Day', icon: Activity },
    { value: 'trainer_day', label: 'Trainer + Day', icon: Users },
    { value: 'time_location', label: 'Time + Location', icon: MapPin },
    { value: 'class_location', label: 'Class + Location', icon: Building2 },
    { value: 'trainer_class', label: 'Trainer + Class', icon: Target },
    { value: 'time_trainer', label: 'Time + Trainer', icon: Clock },
    { value: 'time_class_location', label: 'Time + Class + Location', icon: Clock },
    { value: 'day_time_trainer', label: 'Day + Time + Trainer', icon: Clock },
    { value: 'trainer_am_pm', label: 'Trainer + AM/PM', icon: Users },
    { value: 'class_am_pm', label: 'Class + AM/PM', icon: Activity },
    { value: 'location_am_pm', label: 'Location + AM/PM', icon: MapPin },
    { value: 'trainer_day_time', label: 'Trainer + Day + Time', icon: Users },
    { value: 'trainer_class_time', label: 'Trainer + Class + Time', icon: Users },
    { value: 'location_day_time', label: 'Location + Day + Time', icon: MapPin },
    { value: 'timeslot_location', label: 'Timeslot + Location', icon: MapPin },
    { value: 'timeslot_trainer', label: 'Timeslot + Trainer', icon: Clock },
    { value: 'timeslot_class', label: 'Timeslot + Class', icon: Clock },
    { value: 'uniqueid1', label: 'Group by Class (ID1)', icon: Target },
    { value: 'uniqueid2', label: 'Group by Class & Trainer (ID2)', icon: Users },
    { value: 'trainer_location_am_pm', label: 'Trainer + Location + AM/PM', icon: Users },
    { value: 'class_location_day', label: 'Class + Location + Day', icon: Activity }
  ];

  return (
    <>
      <ModernTableWrapper
      title="Month-on-Month Analytics"
      description="Track class attendance trends across months with detailed grouping options"
      icon={<BarChart3 className="w-5 h-5" />}
      totalItems={data.length}
      showCollapseControls={true}
      onCollapseAll={() => setExpandedRows(new Set())}
      onExpandAll={() => {
        const allRows = new Set<string>();
        processedData.forEach(row => {
          if (groupBy !== 'overall') {
            allRows.add(row.groupKey);
          }
        });
        setExpandedRows(allRows);
      }}
      showCopyButton={true}
      tableRef={tableRef}
      headerControls={
        <div className="flex items-center gap-4 ml-auto">
          {/* Metric Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/70 flex items-center gap-2">
              <BarChart3 className="w-3 h-3" />
              Metric
            </label>
            <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)}>
              <SelectTrigger className="w-[150px] border-white/20 bg-white/10 text-white focus:border-white/40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-3 h-3" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Group By Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/70 flex items-center gap-2">
              <Building2 className="w-3 h-3" />
              Group By
            </label>
            <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupByType)}>
              <SelectTrigger className="w-[180px] border-white/20 bg-white/10 text-white focus:border-white/40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-3 h-3" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Growth Rate Toggle */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant={showGrowthRate ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGrowthRate(!showGrowthRate)}
              className={cn(
                "transition-all duration-200 h-8 text-xs",
                showGrowthRate 
                  ? "bg-white text-slate-700 hover:bg-white/90" 
                  : "border-white/20 text-white hover:bg-white/10"
              )}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Growth %
            </Button>
          </motion.div>

          {/* Collapse/Expand Table */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsTableCollapsed(!isTableCollapsed)}
            className="border-white/20 text-white hover:bg-white/10 h-8 text-xs"
          >
            {isTableCollapsed ? <ExpandIcon className="w-3 h-3" /> : <ShrinkIcon className="w-3 h-3" />}
            {isTableCollapsed ? 'Expand' : 'Collapse'}
          </Button>
        </div>
      }
    >
      {!isTableCollapsed && (
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[800px] custom-scrollbar rounded-xl" style={{ display: 'block' }}>
          <Table ref={tableRef} id={tableId} className="min-w-[1400px] w-max">
            <TableHeader className="sticky top-0 z-20 shadow-sm border-b border-slate-200 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
              <TableRow>
                <TableHead className={`min-w-[200px] sticky left-0 z-30 bg-slate-800/95 backdrop-blur-sm border-r font-bold`}>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-white" />
                    {groupBy === 'trainer' ? 'Trainer' : 
                     groupBy === 'class' ? 'Class' :
                     groupBy === 'location' ? 'Location' :
                     groupBy === 'day_time' ? 'Day & Time' :
                     groupBy === 'uniqueid1' ? 'UniqueID1' :
                     groupBy === 'uniqueid2' ? 'UniqueID2' :
                     groupBy === 'trainer_class' ? 'Trainer & Class' : 'Category'}
                  </div>
                </TableHead>

                {/* Additional detail columns for expanded rows - only show if there are expanded rows */}
                {expandedRows.size > 0 && (
                  <>
                    <TableHead className="min-w-[100px] text-center font-bold text-white text-xs">
                      Date
                    </TableHead>
                    <TableHead className="min-w-[80px] text-center font-bold text-white text-xs">
                      Time
                    </TableHead>
                    <TableHead className="min-w-[120px] text-center font-bold text-white text-xs">
                      Trainer
                    </TableHead>
                    <TableHead className="min-w-[120px] text-center font-bold text-white text-xs">
                      Location
                    </TableHead>
                    <TableHead className="min-w-[120px] text-center font-bold text-white text-xs">
                      Teacher
                    </TableHead>
                  </>
                )}
                
                {availableMonths.map(month => (
                  <TableHead key={month.key} className={`text-center min-w-[120px] font-bold`}>
                    <div className="space-y-1">
                      <div className="font-semibold">{month.shortLabel}</div>
                      {showGrowthRate && (
                        <div className="text-xs text-gray-500">Growth %</div>
                      )}
                    </div>
                  </TableHead>
                ))}
                
                <TableHead className="text-center min-w-[120px] bg-slate-800 font-bold text-white">
                  <div className="space-y-1">
                    <div className="font-semibold">Total</div>
                    {showGrowthRate && (
                      <div className="text-xs text-slate-300">Avg Growth</div>
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <AnimatePresence>
                {processedData.map((row, rowIndex) => {
                  const isExpanded = expandedRows.has(row.groupKey);
                  const isExpandable = groupBy !== 'overall';
                  const childRows = isExpanded ? getChildRowsForGroup(row.groupKey) : [];

                  return (
                    <React.Fragment key={row.groupKey}>
                      <motion.tr
                        className={cn(
                          "border-b transition-all duration-300 hover:shadow-md h-9 max-h-9 cursor-pointer",
                          rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                          isExpandable ? "hover:bg-blue-50/30" : ""
                        )}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
                        whileHover={{ 
                          backgroundColor: isExpandable ? "rgba(59, 130, 246, 0.08)" : "rgba(59, 130, 246, 0.05)",
                          transition: { duration: 0.2 }
                        }}
                        onClick={() => {
                          if (isExpandable) {
                            setExpandedRows(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(row.groupKey)) {
                                newSet.delete(row.groupKey);
                              } else {
                                newSet.add(row.groupKey);
                              }
                              return newSet;
                            });
                          }
                        }}
                      >
                        <TableCell className="sticky left-0 z-20 bg-white border-r font-medium whitespace-nowrap py-1.5">
                          <div className="flex items-center gap-2">
                            {isExpandable && (
                              <motion.div
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-center w-5"
                              >
                                <ExpandIcon className="w-4 h-4 text-blue-600" />
                              </motion.div>
                            )}
                            {!isExpandable && <div className="w-5" />}
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                              {row.groupLabel.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">{row.groupLabel}</span>
                            <span className="text-xs text-gray-500">({row.totals.sessions})</span>
                          </div>
                        </TableCell>

                        {/* Detail columns - only show for parent rows when there are expanded rows */}
                        {expandedRows.size > 0 && (
                          <>
                            <TableCell className="text-center py-1.5 text-gray-400">-</TableCell>
                            <TableCell className="text-center py-1.5 text-gray-400">-</TableCell>
                            <TableCell className="text-center py-1.5 text-gray-400">-</TableCell>
                            <TableCell className="text-center py-1.5 text-gray-400">-</TableCell>
                            <TableCell className="text-center py-1.5 text-gray-400">-</TableCell>
                          </>
                        )}

                        {availableMonths.map((month, index) => {
                          const monthData = row.monthlyData[month.key];
                          const prevMonthData = index > 0 ? row.monthlyData[availableMonths[index - 1].key] : null;

                          const getMetricNumeric = (md: MonthlyData, metric: MetricType): number => {
                            switch (metric) {
                              case 'attendance': return md.attendance;
                              case 'sessions': return md.sessions;
                              case 'revenue': return md.revenue;
                              case 'fillRate': return md.fillRate;
                              case 'classAverage': return md.classAverage;
                              case 'capacity': return md.capacity;
                              case 'bookingRate': return md.bookingRate;
                              default: return md.attendance;
                            }
                          };

                          const currentValue = getMetricNumeric(monthData, selectedMetric);
                          const previousValue = prevMonthData ? getMetricNumeric(prevMonthData, selectedMetric) : 0;
                          const growthRate = prevMonthData ? getGrowthRate(currentValue, previousValue) : 0;

                          return (
                            <TableCell key={month.key} className="text-center py-1.5 whitespace-nowrap">
                              <span className="font-semibold text-gray-900">
                                {getMetricValue(monthData, selectedMetric)}
                              </span>
                              {showGrowthRate && prevMonthData && (
                                <span className={cn(
                                  "text-xs font-medium ml-1",
                                  growthRate > 0 ? "text-green-600" : growthRate < 0 ? "text-red-600" : "text-gray-500"
                                )}>
                                  {growthRate > 0 ? "↑" : growthRate < 0 ? "↓" : ""}
                                  {formatPercentage(Math.abs(growthRate))}
                                </span>
                              )}
                            </TableCell>
                          );
                        })}

                        <TableCell className="text-center py-1.5 whitespace-nowrap">
                          <span className="font-bold text-slate-800">
                            {getMetricValue(row.totals, selectedMetric)}
                          </span>
                        </TableCell>
                      </motion.tr>

                      {/* Child Rows */}
                      <AnimatePresence>
                        {isExpanded && childRows.map((childRow, childIndex) => (
                          <motion.tr
                            key={childRow.groupKey}
                            className="border-b h-9 max-h-9"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, delay: childIndex * 0.02 }}
                          >
                            <TableCell className="sticky left-0 z-20 bg-white border-r font-medium whitespace-nowrap py-1 pl-12 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-blue-400" />
                                <span className="text-gray-700">{childRow.groupLabel}</span>
                              </div>
                            </TableCell>

                            {/* Detail columns for child rows - always show to maintain alignment */}
                            <TableCell className="text-center py-1 text-sm text-gray-700">
                              {childRow.sessionDetails?.date || '-'}
                            </TableCell>
                            <TableCell className="text-center py-1 text-sm text-gray-700">
                              {childRow.sessionDetails?.time || '-'}
                            </TableCell>
                            <TableCell className="text-center py-1 text-sm text-gray-700">
                              {childRow.sessionDetails?.trainer || '-'}
                            </TableCell>
                            <TableCell className="text-center py-1 text-sm text-gray-700">
                              {childRow.sessionDetails?.location || '-'}
                            </TableCell>
                            <TableCell className="text-center py-1 text-sm text-gray-700">
                              {childRow.sessionDetails?.teacher || '-'}
                            </TableCell>

                            {availableMonths.map((month) => {
                              const monthData = childRow.monthlyData[month.key];
                              return (
                                <TableCell key={month.key} className="text-center py-1 whitespace-nowrap text-sm">
                                  <span className="text-gray-800">
                                    {getMetricValue(monthData, selectedMetric)}
                                  </span>
                                </TableCell>
                              );
                            })}

                            <TableCell className="text-center py-1 whitespace-nowrap text-sm">
                              <span className="font-semibold text-slate-700">
                                {getMetricValue(childRow.totals, selectedMetric)}
                              </span>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
              
              {/* Totals row across all groups */}
              <TableRow className="bg-slate-800 text-white font-bold border-t-2 h-9 max-h-9">
                <TableCell className="sticky left-0 z-10 bg-slate-800 border-r text-white py-1.5">Totals</TableCell>
                {/* Empty detail columns - only show when there are expanded rows */}
                {expandedRows.size > 0 && (
                  <>
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell />
                  </>
                )}
                
                {availableMonths.map((month) => {
                  const totalsForMonth = processedData.reduce((acc, row) => {
                    const md = row.monthlyData[month.key];
                    acc.sessions += md.sessions;
                    acc.attendance += md.attendance;
                    acc.capacity += md.capacity;
                    acc.revenue += md.revenue;
                    acc.lateCancellations += md.lateCancellations;
                    acc.booked += (md.booked || 0);
                    return acc;
                  }, { sessions:0, attendance:0, capacity:0, revenue:0, lateCancellations:0, booked:0 });
                  const display = getMetricValue({
                    month: month.key,
                    monthLabel: month.label,
                    sessions: totalsForMonth.sessions,
                    attendance: totalsForMonth.attendance,
                    capacity: totalsForMonth.capacity,
                    revenue: totalsForMonth.revenue,
                    fillRate: totalsForMonth.capacity>0 ? (totalsForMonth.attendance/totalsForMonth.capacity)*100 : 0,
                    classAverage: totalsForMonth.sessions>0 ? (totalsForMonth.attendance/totalsForMonth.sessions) : 0,
                    bookingRate: totalsForMonth.capacity>0 ? ((totalsForMonth.booked)/totalsForMonth.capacity)*100 : 0,
                    lateCancellations: totalsForMonth.lateCancellations,
                    uniqueClasses: 0,
                    uniqueTrainers: 0,
                    booked: totalsForMonth.booked
                  }, selectedMetric);
                  return (
                    <TableCell key={`total-${month.key}`} className="text-center py-1.5">
                      <span className="font-bold text-white">{display}</span>
                    </TableCell>
                  );
                })}
                
                {/* Overall total (rightmost) */}
                <TableCell className="text-center py-1.5">
                  <span className="font-bold text-white">
                    {getMetricValue({
                      month: 'total',
                      monthLabel: 'Total',
                      sessions: processedData.reduce((s, r) => s + r.totals.sessions, 0),
                      attendance: processedData.reduce((s, r) => s + r.totals.attendance, 0),
                      capacity: processedData.reduce((s, r) => s + r.totals.capacity, 0),
                      revenue: processedData.reduce((s, r) => s + r.totals.revenue, 0),
                      fillRate: 0,
                      classAverage: 0,
                      bookingRate: 0,
                      lateCancellations: processedData.reduce((s, r) => s + r.totals.lateCancellations, 0),
                      uniqueClasses: 0,
                      uniqueTrainers: 0
                    }, selectedMetric)}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </ModernTableWrapper>

    <PersistentTableFooter
      tableId="month-on-month-class-attendance"
      tableData={processedData}
      tableName="Month-on-Month Class Attendance"
      tableContext="Monthly class attendance trends and comparisons"
    />
    </>
  );
};