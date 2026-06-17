import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatPercentage, formatCurrency as baseCurrency } from '@/utils/formatters';

// INR formatter without decimals
const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '₹0';
  const absValue = Math.abs(value);
  if (absValue >= 10000000) return `₹${Math.floor(value / 10000000)}Cr`;
  if (absValue >= 100000) return `₹${Math.floor(value / 100000)}L`;
  if (absValue >= 1000) return `₹${Math.floor(value / 1000)}K`;
  return `₹${Math.floor(value)}`;
};
import { cn } from '@/lib/utils';
import {
  ChevronDown, ChevronRight, ArrowUp, ArrowDown,
  List, Download, Eye, Settings, Award, X, Search,
  Table as TableIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UltimateClassAttendanceTableProps {
  data: SessionData[];
  location: string;
}

// Comprehensive GroupBy type matching class-intelligence
type GroupBy =
  | 'ClassDayTimeLocation'
  | 'ClassDayTimeLocationTrainer'
  | 'LocationClass'
  | 'ClassDay'
  | 'ClassTime'
  | 'ClassDayTrainer'
  | 'ClassTrainer'
  | 'DayTimeLocation'
  | 'DayTime'
  | 'TrainerLocation'
  | 'DayLocation'
  | 'TimeLocation'
  | 'ClassType'
  | 'TypeLocation'
  | 'TrainerDay'
  | 'ClassLocation'
  | 'TrainerTime'
  | 'Class'
  | 'Type'
  | 'Trainer'
  | 'Location'
  | 'Day'
  | 'Date'
  | 'Time';

type ViewMode = 'grouped' | 'flat';
type RankingMetric = 'classAvg' | 'fillRate' | 'totalCheckIns' | 'totalRevenue' | 'consistencyScore' | 'compositeScore';

interface GroupedRow {
  isGroupRow: true;
  groupValue: string;
  rank: number;
  classes: number;
  totalCheckIns: number;
  totalRevenue: number;
  totalCapacity: number;
  totalBooked: number;
  totalCancellations: number;
  totalWaitlisted: number;
  fillRate: number;
  cancellationRate: number;
  waitlistRate: number;
  classAvg: number;
  classAvgNonEmpty: number;
  revPerCheckin: number;
  revPerBooking: number;
  revLostPerCancellation: number;
  weightedAverage: number;
  consistencyScore: number;
  compositeScore: number;
  emptyClasses: number;
  nonEmptyClasses: number;
  children?: SessionData[];
}

export const UltimateClassAttendanceTable: React.FC<UltimateClassAttendanceTableProps> = ({ data, location }) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [groupBy, setGroupBy] = useState<GroupBy>('ClassDayTimeLocation');
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>('compositeScore');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSortingState] = useState<SortingState>([{ id: 'rank', desc: false }]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [drilldownSessions, setDrilldownSessions] = useState<SessionData[]>([]);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('classAttendanceColumnSizing');
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        ...parsed,
        groupValue: Math.max(parsed?.groupValue || 0, 280),
      };
    } catch {
      return { groupValue: 280 };
    }
  });
  const [minSessions, setMinSessions] = useState(0);
  const [minCheckins, setMinCheckins] = useState(0);
  const [excludeHostedClasses, setExcludeHostedClasses] = useState(true);

  // Persist column sizing
  useEffect(() => {
    try {
      localStorage.setItem('classAttendanceColumnSizing', JSON.stringify(columnSizing));
    } catch {}
  }, [columnSizing]);

  // ESC key handler for modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrilldownOpen) {
        setIsDrilldownOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isDrilldownOpen]);
  
  // Helper functions
  const getCleanedValue = (value: string | undefined): string => {
    return (value || '').trim();
  };

  const getGroupKey = (session: SessionData, groupBy: GroupBy): string => {
    switch (groupBy) {
      case 'ClassDayTimeLocation':
        return `${getCleanedValue(session.cleanedClass)}|${getCleanedValue(session.dayOfWeek)}|${getCleanedValue(session.time)}|${getCleanedValue(session.location)}`;
      case 'ClassDayTimeLocationTrainer':
        return `${getCleanedValue(session.cleanedClass)}|${getCleanedValue(session.dayOfWeek)}|${getCleanedValue(session.time)}|${getCleanedValue(session.location)}|${getCleanedValue(session.trainerName)}`;
      case 'LocationClass':
        return `${getCleanedValue(session.location)}|${getCleanedValue(session.cleanedClass)}`;
      case 'ClassDay':
        return `${getCleanedValue(session.cleanedClass)}|${getCleanedValue(session.dayOfWeek)}`;
      case 'ClassTime':
        return `${getCleanedValue(session.cleanedClass)}|${getCleanedValue(session.time)}`;
      case 'ClassDayTrainer':
        return `${getCleanedValue(session.cleanedClass)}|${getCleanedValue(session.dayOfWeek)}|${getCleanedValue(session.trainerName)}`;
      case 'ClassTrainer':
        return `${getCleanedValue(session.cleanedClass)}|${getCleanedValue(session.trainerName)}`;
      case 'DayTimeLocation':
        return `${getCleanedValue(session.dayOfWeek)}|${getCleanedValue(session.time)}|${getCleanedValue(session.location)}`;
      case 'DayTime':
        return `${getCleanedValue(session.dayOfWeek)}|${getCleanedValue(session.time)}`;
      case 'TrainerLocation':
        return `${getCleanedValue(session.trainerName)}|${getCleanedValue(session.location)}`;
      case 'DayLocation':
        return `${getCleanedValue(session.dayOfWeek)}|${getCleanedValue(session.location)}`;
      case 'TimeLocation':
        return `${getCleanedValue(session.time)}|${getCleanedValue(session.location)}`;
      case 'ClassLocation':
        return `${getCleanedValue(session.cleanedClass)}|${getCleanedValue(session.location)}`;
      case 'TrainerTime':
        return `${getCleanedValue(session.trainerName)}|${getCleanedValue(session.time)}`;
      case 'Class':
        return getCleanedValue(session.cleanedClass);
      case 'Trainer':
        return getCleanedValue(session.trainerName);
      case 'Location':
        return getCleanedValue(session.location);
      case 'Day':
        return getCleanedValue(session.dayOfWeek);
      case 'Date':
        return getCleanedValue(session.date);
      case 'Time':
        return getCleanedValue(session.time);
      default:
        return getCleanedValue(session.cleanedClass);
    }
  };

  // Group data
  const processedData = useMemo(() => {
    if (viewMode === 'flat') {
      return data as (SessionData | GroupedRow)[];
    }

    // Filter hosted classes if enabled
    const filteredData = excludeHostedClasses
      ? data.filter(s => {
          const className = (s.sessionName || s.cleanedClass || s.classType || '').toLowerCase();
          const hostedPattern = /hosted|bridal|lrs|x p57|rugby|wework|olympics|birthday|host|raheja|pop|workshop|community|physique|soundrise|outdoor|p57 x|x/i;
          return !hostedPattern.test(className);
        })
      : data;

    const groups = new Map<string, SessionData[]>();
    filteredData.forEach((session) => {
      const key = getGroupKey(session, groupBy);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(session);
    });

    const groupedRows: GroupedRow[] = [];
    groups.forEach((sessions, key) => {
      const totalCheckIns = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPaid || s.revenue || 0), 0);
      const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const totalBooked = sessions.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
      const totalCancellations = sessions.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);
      const totalWaitlisted = sessions.reduce((sum, s) => sum + ((s as any).waitlistedCount || 0), 0);
      
      const emptyClasses = sessions.filter(s => (s.checkedInCount || 0) === 0).length;
      const nonEmptyClasses = sessions.length - emptyClasses;
      
      const fillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
      const cancellationRate = totalBooked > 0 ? (totalCancellations / totalBooked) * 100 : 0;
      const classAvg = sessions.length > 0 ? totalCheckIns / sessions.length : 0;
      const classAvgNonEmpty = nonEmptyClasses > 0 ? totalCheckIns / nonEmptyClasses : 0;
      const revPerCheckin = totalCheckIns > 0 ? totalRevenue / totalCheckIns : 0;
      const revPerBooking = totalBooked > 0 ? totalRevenue / totalBooked : 0;
      const revLostPerCancellation = totalCancellations > 0 ? (totalRevenue / totalBooked) * totalCancellations : 0;
      const weightedAverage = fillRate; // Weighted utilization percentage
      
      // Consistency score: lower variance = higher consistency
      const avg = classAvg;
      const variance = sessions.reduce((sum, s) => {
        const diff = (s.checkedInCount || 0) - avg;
        return sum + diff * diff;
      }, 0) / sessions.length;
      const stdDev = Math.sqrt(variance);
      const consistencyScore = avg > 0 ? Math.max(0, 100 - (stdDev / avg) * 100) : 0;
      
      // Composite score formula from class-intelligence
      const compositeScore = (
        fillRate * 0.3 +
        classAvg * 0.25 +
        consistencyScore * 0.25 +
        (totalRevenue / sessions.length / 100) * 0.2
      );

      const waitlistRate = totalCapacity > 0 ? (totalWaitlisted / totalCapacity) * 100 : 0;

      // Apply filters
      if (sessions.length < minSessions) return;
      if (totalCheckIns < minCheckins) return;

      groupedRows.push({
        isGroupRow: true,
        groupValue: key,
        rank: 0,
        classes: sessions.length,
        totalCheckIns,
        totalRevenue,
        totalCapacity,
        totalBooked,
        totalCancellations,
        totalWaitlisted,
        fillRate,
        cancellationRate,
        waitlistRate,
        classAvg,
        classAvgNonEmpty,
        revPerCheckin,
        revPerBooking,
        revLostPerCancellation,
        weightedAverage,
        consistencyScore,
        compositeScore,
        emptyClasses,
        nonEmptyClasses,
        children: sessions,
      });
    });

    // Rank by selected metric
    groupedRows.sort((a, b) => {
      const aVal = a[rankingMetric];
      const bVal = b[rankingMetric];
      return bVal - aVal;
    });

    // Assign ranks
    groupedRows.forEach((row, index) => {
      row.rank = index + 1;
    });

    return groupedRows;
  }, [data, viewMode, groupBy, rankingMetric, minSessions, minCheckins, excludeHostedClasses]);

  // Table data with expanded rows
  const tableData = useMemo(() => {
    if (viewMode === 'flat') {
      return data;
    }

    // Return only the grouped rows (without children expanded yet)
    // We'll handle expansion in the rendering phase to preserve sort order
    return processedData as GroupedRow[];
  }, [processedData, viewMode, data]);

  const toggleGroup = useCallback((groupValue: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupValue)) {
        newSet.delete(groupValue);
      } else {
        newSet.add(groupValue);
      }
      return newSet;
    });
  }, []);

  const handleRowClick = useCallback((row: GroupedRow) => {
    // Open drilldown modal
    setDrilldownSessions(row.children || []);
    setDrilldownTitle(row.groupValue.replace(/\|/g, ' • '));
    setIsDrilldownOpen(true);
  }, []);

  // Column definitions
  const columns = useMemo<ColumnDef<SessionData | GroupedRow>[]>(() => {
    const baseColumns: ColumnDef<SessionData | GroupedRow>[] = [
      {
        id: 'expand',
        header: '',
        size: columnSizing['expand'] || 50,
        enableSorting: false,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            const isExpanded = expandedGroups.has(data.groupValue);
            return (
              <button
                onClick={(e) => toggleGroup(data.groupValue, e)}
                className="p-2 hover:bg-blue-100 rounded-lg transition-all"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-700" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                )}
              </button>
            );
          }
          return null;
        },
      },
      {
        accessorKey: 'rank',
        header: '#',
        size: columnSizing['rank'] || 60,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center font-bold text-black text-xs">#{data.rank}</div>;
          }
          return null;
        },
      },
      {
        id: 'groupValue',
        header: 'Group',
        size: columnSizing['groupValue'] || 420,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="font-semibold text-slate-900 text-xs whitespace-normal break-words leading-5">{data.groupValue.replace(/\|/g, ' • ')}</div>;
          }
          const session = data as SessionData;
          return (
            <div className="pl-4 text-xs text-slate-700 font-medium whitespace-normal break-words leading-5">
              {session.cleanedClass || session.sessionName || session.classType}
            </div>
          );
        },
      },
      {
        id: 'trainer',
        header: 'Trainer',
        size: columnSizing['trainer'] || 120,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            const firstSession = data.children?.[0];
            const hasMultiple = data.children?.some(s => s.trainerName !== firstSession?.trainerName);
            return <div className="text-xs text-black">{hasMultiple ? 'Multiple' : firstSession?.trainerName || ''}</div>;
          }
          const session = data as SessionData;
          return <div className="text-xs text-black">{session.trainerName || ''}</div>;
        },
      },
      {
        id: 'location',
        header: 'Location',
        size: columnSizing['location'] || 110,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            const firstSession = data.children?.[0];
            const hasMultiple = data.children?.some(s => s.location !== firstSession?.location);
            return <div className="text-xs text-black">{hasMultiple ? 'Multiple' : firstSession?.location || ''}</div>;
          }
          const session = data as SessionData;
          return <div className="text-xs text-black">{session.location || ''}</div>;
        },
      },
      {
        id: 'class',
        header: 'Class',
        size: columnSizing['class'] || 150,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            const firstSession = data.children?.[0];
            const hasMultiple = data.children?.some(s => (s.cleanedClass || s.sessionName) !== (firstSession?.cleanedClass || firstSession?.sessionName));
            return <div className="text-xs text-black">{hasMultiple ? 'Multiple' : firstSession?.cleanedClass || firstSession?.sessionName || ''}</div>;
          }
          const session = data as SessionData;
          return <div className="text-xs text-black">{session.cleanedClass || session.sessionName || session.classType || ''}</div>;
        },
      },
      {
        id: 'formats',
        header: 'Formats',
        size: columnSizing['formats'] || 100,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            const firstSession = data.children?.[0];
            const hasMultiple = data.children?.some(s => (s as any).format !== (firstSession as any)?.format);
            return <div className="text-xs text-black">{hasMultiple ? 'Multiple' : (firstSession as any)?.format || ''}</div>;
          }
          const session = data as SessionData;
          return <div className="text-xs text-black">{(session as any).format || ''}</div>;
        },
      },
      {
        id: 'type',
        header: 'Type',
        size: columnSizing['type'] || 100,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            const firstSession = data.children?.[0];
            const hasMultiple = data.children?.some(s => s.classType !== firstSession?.classType);
            return <div className="text-xs text-black">{hasMultiple ? 'Multiple' : firstSession?.classType || ''}</div>;
          }
          const session = data as SessionData;
          return <div className="text-xs text-black">{session.classType || ''}</div>;
        },
      },
      {
        id: 'date',
        header: 'Date',
        size: columnSizing['date'] || 100,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            const firstSession = data.children?.[0];
            const hasMultiple = data.children?.some(s => s.date !== firstSession?.date);
            return <div className="text-xs text-black">{hasMultiple ? 'Multiple' : firstSession?.date || ''}</div>;
          }
          const session = data as SessionData;
          return <div className="text-xs text-black">{session.date || ''}</div>;
        },
      },
      {
        id: 'day',
        header: 'Day',
        size: columnSizing['day'] || 90,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            const firstSession = data.children?.[0];
            const hasMultiple = data.children?.some(s => s.dayOfWeek !== firstSession?.dayOfWeek);
            return <div className="text-xs text-black">{hasMultiple ? 'Multiple' : firstSession?.dayOfWeek || ''}</div>;
          }
          const session = data as SessionData;
          return <div className="text-xs text-black">{session.dayOfWeek || ''}</div>;
        },
      },
      {
        id: 'time',
        header: 'Time',
        size: columnSizing['time'] || 90,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            const firstSession = data.children?.[0];
            const hasMultiple = data.children?.some(s => s.time !== firstSession?.time);
            return <div className="text-xs text-black">{hasMultiple ? 'Multiple' : firstSession?.time || ''}</div>;
          }
          const session = data as SessionData;
          return <div className="text-xs text-black">{session.time || ''}</div>;
        },
      },
      {
        accessorKey: 'classes',
        header: 'Classes',
        size: columnSizing['classes'] || 80,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{data.classes}</div>;
          }
          return null;
        },
      },
      {
        accessorKey: 'totalCheckIns',
        header: 'Check-Ins',
        size: columnSizing['totalCheckIns'] || 100,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{formatNumber(data.totalCheckIns)}</div>;
          }
          const session = data as SessionData;
          return <div className="text-center text-black text-xs">{session.checkedInCount || 0}</div>;
        },
      },
      {
        accessorKey: 'classAvg',
        header: 'Class Avg',
        size: columnSizing['classAvg'] || 90,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{data.classAvg.toFixed(1)}</div>;
          }
          return null;
        },
      },
      {
        accessorKey: 'fillRate',
        header: 'Fill Rate',
        size: columnSizing['fillRate'] || 90,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{formatPercentage(data.fillRate)}</div>;
          }
          const session = data as SessionData;
          const rate = session.capacity > 0 ? (session.checkedInCount || 0) / session.capacity * 100 : 0;
          return <div className="text-center text-black text-xs">{formatPercentage(rate)}</div>;
        },
      },
      {
        accessorKey: 'totalRevenue',
        header: 'Revenue',
        size: columnSizing['totalRevenue'] || 100,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-right text-black text-xs">{formatCurrency(data.totalRevenue)}</div>;
          }
          const session = data as SessionData;
          return <div className="text-right text-black text-xs">{formatCurrency(session.totalPaid || session.revenue || 0)}</div>;
        },
      },
      {
        accessorKey: 'consistencyScore',
        header: 'Consistency',
        size: columnSizing['consistencyScore'] || 110,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{formatPercentage(data.consistencyScore)}</div>;
          }
          return null;
        },
      },
      {
        accessorKey: 'emptyClasses',
        header: 'Empty',
        size: columnSizing['emptyClasses'] || 70,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{data.emptyClasses}</div>;
          }
          return null;
        },
      },
      {
        accessorKey: 'totalCapacity',
        header: 'Capacity',
        size: columnSizing['totalCapacity'] || 90,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{formatNumber(data.totalCapacity)}</div>;
          }
          const session = data as SessionData;
          return <div className="text-center text-black text-xs">{session.capacity || 0}</div>;
        },
      },
      {
        accessorKey: 'totalBooked',
        header: 'Booked',
        size: columnSizing['totalBooked'] || 80,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{formatNumber(data.totalBooked)}</div>;
          }
          const session = data as SessionData;
          return <div className="text-center text-black text-xs">{session.bookedCount || 0}</div>;
        },
      },
      {
        accessorKey: 'totalCancellations',
        header: 'Late Cancel',
        size: columnSizing['totalCancellations'] || 100,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{formatNumber(data.totalCancellations)}</div>;
          }
          const session = data as SessionData;
          return <div className="text-center text-black text-xs">{session.lateCancelledCount || 0}</div>;
        },
      },
      {
        accessorKey: 'cancellationRate',
        header: 'Cancel Rate',
        size: columnSizing['cancellationRate'] || 100,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{formatPercentage(data.cancellationRate)}</div>;
          }
          return null;
        },
      },
      {
        accessorKey: 'revPerCheckin',
        header: 'Rev/Check-In',
        size: columnSizing['revPerCheckin'] || 110,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-right text-black text-xs">{formatCurrency(data.revPerCheckin)}</div>;
          }
          return null;
        },
      },
      {
        accessorKey: 'revPerBooking',
        header: 'Rev/Booking',
        size: columnSizing['revPerBooking'] || 110,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-right text-black text-xs">{formatCurrency(data.revPerBooking)}</div>;
          }
          return null;
        },
      },
      {
        accessorKey: 'revLostPerCancellation',
        header: 'Rev Lost',
        size: columnSizing['revLostPerCancellation'] || 100,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-right text-black text-xs">{formatCurrency(data.revLostPerCancellation)}</div>;
          }
          return null;
        },
      },
      {
        accessorKey: 'classAvgNonEmpty',
        header: 'Avg (No Empty)',
        size: columnSizing['classAvgNonEmpty'] || 120,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{data.classAvgNonEmpty.toFixed(1)}</div>;
          }
          return null;
        },
      },
      {
        accessorKey: 'waitlistRate',
        header: 'Waitlist %',
        size: columnSizing['waitlistRate'] || 100,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{formatPercentage(data.waitlistRate)}</div>;
          }
          return null;
        },
      },
      {
        accessorKey: 'weightedAverage',
        header: 'Weighted Util%',
        size: columnSizing['weightedAverage'] || 130,
        enableSorting: true,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return <div className="text-center text-black text-xs">{formatPercentage(data.weightedAverage)}</div>;
          }
          return null;
        },
      },
      {
        id: 'actions',
        header: '',
        size: columnSizing['actions'] || 80,
        enableSorting: false,
        enableResizing: true,
        cell: ({ row }) => {
          const data = row.original;
          if ('isGroupRow' in data && data.isGroupRow) {
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRowClick(data);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"
              >
                <Eye className="w-4 h-4 text-gray-600" />
              </button>
            );
          }
          return null;
        },
      },
    ];

    return baseColumns;
  }, [expandedGroups, toggleGroup]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      pagination,
      columnSizing,
    },
    onSortingChange: setSortingState,
    onPaginationChange: setPagination,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    manualPagination: viewMode === 'grouped',
  });

  const groupByOptions: { value: GroupBy; label: string }[] = [
    { value: 'ClassDayTimeLocation', label: '✨ Class + Day + Time + Location (Recommended)' },
    { value: 'ClassDayTimeLocationTrainer', label: '👤 Class + Day + Time + Location + Trainer' },
    { value: 'LocationClass', label: '📍 Location → Class' },
    { value: 'ClassDay', label: '📅 Class → Day' },
    { value: 'ClassTime', label: '⏰ Class → Time' },
    { value: 'ClassDayTrainer', label: '🏋️ Class + Day + Trainer' },
    { value: 'ClassTrainer', label: '👥 Class + Trainer' },
    { value: 'DayTimeLocation', label: '🗓️ Day + Time + Location' },
    { value: 'DayTime', label: '📆 Day + Time' },
    { value: 'TrainerLocation', label: '🎯 Trainer + Location' },
    { value: 'DayLocation', label: '📌 Day + Location' },
    { value: 'TimeLocation', label: '⏱️ Time + Location' },
    { value: 'ClassLocation', label: '🏢 Class + Location' },
    { value: 'TrainerTime', label: '👤⏰ Trainer + Time' },
    { value: 'Class', label: '📚 Class Only' },
    { value: 'Trainer', label: '👤 Trainer Only' },
    { value: 'Location', label: '📍 Location Only' },
    { value: 'Day', label: '📅 Day of Week Only' },
    { value: 'Date', label: '📆 Date Only' },
    { value: 'Time', label: '⏰ Time Only' },
  ];

  const rankingOptions: { value: RankingMetric; label: string }[] = [
    { value: 'compositeScore', label: 'Composite Score' },
    { value: 'classAvg', label: 'Class Average' },
    { value: 'fillRate', label: 'Fill Rate' },
    { value: 'totalCheckIns', label: 'Total Check-ins' },
    { value: 'totalRevenue', label: 'Total Revenue' },
    { value: 'consistencyScore', label: 'Consistency Score' },
  ];

  const tdPaddingClass = density === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2';
  const thPaddingClass = density === 'compact' ? 'px-3 py-1' : 'px-4 py-1.5';
  const rowHeightClass = density === 'compact' ? 'min-h-9' : 'min-h-10';
  const headerHeightClass = density === 'compact' ? 'min-h-8' : 'min-h-9';

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 shadow-xl"
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border-2 border-gray-300 shadow-sm">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                viewMode === 'grouped'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <List className="w-5 h-5" />
              Grouped
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                viewMode === 'flat'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TableIcon className="w-5 h-5" />
              Flat
            </button>
          </div>

          {/* Group By Selector */}
          {viewMode === 'grouped' && (
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="px-5 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none font-semibold transition-all bg-white shadow-sm"
            >
              {groupByOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {/* Ranking Criteria Selector */}
          {viewMode === 'grouped' && (
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <select
                value={rankingMetric}
                onChange={(e) => setRankingMetric(e.target.value as RankingMetric)}
                className="px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 outline-none font-semibold transition-all bg-white shadow-sm"
              >
                {rankingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Rank by {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Density Toggle */}
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 border-2 border-gray-200">
            <button
              onClick={() => setDensity('comfortable')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                density === 'comfortable' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cozy
            </button>
            <button
              onClick={() => setDensity('compact')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                density === 'compact' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Compact
            </button>
          </div>

          {/* Min Sessions */}
          {viewMode === 'grouped' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Min Sessions:
              </label>
              <input
                type="number"
                min="0"
                value={minSessions}
                onChange={(e) => setMinSessions(parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none font-semibold transition-all bg-white shadow-sm text-sm"
              />
            </div>
          )}

          {/* Min Check-ins */}
          {viewMode === 'grouped' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Min Check-ins:
              </label>
              <input
                type="number"
                min="0"
                value={minCheckins}
                onChange={(e) => setMinCheckins(parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none font-semibold transition-all bg-white shadow-sm text-sm"
              />
            </div>
          )}

          {/* Exclude Hosted Classes */}
          {viewMode === 'grouped' && (
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white shadow-sm cursor-pointer hover:border-blue-400 transition-all">
              <input
                type="checkbox"
                checked={excludeHostedClasses}
                onChange={(e) => setExcludeHostedClasses(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-800">
                Exclude Hosted
              </span>
            </label>
          )}

          {/* Export Button */}
          <button className="ml-auto px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:shadow-xl transition-all flex items-center gap-2 shadow-lg">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="overflow-x-auto">
          <table data-table="class-attendance-comprehensive" data-table-name="Class Attendance Comprehensive Table" className="class-attendance-neat-table min-w-full border-collapse" style={{ tableLayout: 'auto', width: 'max-content', minWidth: '100%' }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className={`${headerHeightClass} border-b border-slate-900/70 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]`}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: `${header.getSize()}px`, position: 'relative' }}
                      className={`${thPaddingClass} ${headerHeightClass} text-left text-[11px] font-semibold text-slate-100 uppercase tracking-[0.08em] relative group whitespace-nowrap align-top`}
                    >
                      <div
                        className="flex items-center gap-1.5 cursor-pointer select-none"
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <span className="whitespace-nowrap flex-shrink-0">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {header.column.getCanSort() && (
                          <span className="flex items-center justify-center w-4 h-4 flex-shrink-0">
                            {header.column.getIsSorted() === 'asc' && <ArrowUp className="w-3 h-3" />}
                            {header.column.getIsSorted() === 'desc' && <ArrowDown className="w-3 h-3" />}
                            {!header.column.getIsSorted() && <ArrowUp className="w-3 h-3 opacity-30" />}
                          </span>
                        )}
                      </div>
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none bg-blue-400 opacity-0 hover:opacity-100 ${
                            header.column.getIsResizing() ? 'opacity-100 bg-blue-600' : ''
                          }`}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white">
              {table.getRowModel().rows.map((row) => {
                const isGroupRow = 'isGroupRow' in row.original && row.original.isGroupRow;
                const groupData = isGroupRow ? (row.original as GroupedRow) : null;
                const isExpanded = groupData && expandedGroups.has(groupData.groupValue);
                
                return (
                  <React.Fragment key={row.id}>
                    {/* Group Row */}
                    <tr
                      onClick={() => {
                        if (isGroupRow && groupData) {
                          handleRowClick(groupData);
                        }
                      }}
                      className={`${rowHeightClass} border-b border-slate-200/80 transition-colors ${
                        isGroupRow
                          ? 'bg-white hover:bg-slate-50/80 cursor-pointer'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          style={{ width: `${cell.column.getSize()}px` }}
                          className={`${tdPaddingClass} ${rowHeightClass} text-sm align-top whitespace-normal break-words ${isGroupRow ? 'font-medium' : ''}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    
                    {/* Expanded Child Rows - Render immediately after parent */}
                    {isExpanded && groupData?.children?.map((childSession, idx) => {
                      const childRow = table.getRowModel().rows.find(r => r.original === childSession);
                      if (!childRow) {
                        // Manually render child row if not in table model
                        return (
                          <tr
                            key={`${row.id}-child-${idx}`}
                            className={`${rowHeightClass} border-b border-slate-200/70 bg-slate-50/60 hover:bg-slate-100/70`}
                          >
                            {columns.map((col, colIdx) => {
                              const cellValue = col.accessorFn 
                                ? col.accessorFn(childSession, idx)
                                : (childSession as any)[col.id || ''];
                              
                              return (
                                <td
                                  key={`${row.id}-child-${idx}-col-${colIdx}`}
                                  style={{ width: `${col.size}px` }}
                                  className={`${tdPaddingClass} ${rowHeightClass} text-sm align-top whitespace-normal break-words text-slate-600`}
                                >
                                  {col.cell && typeof col.cell === 'function'
                                    ? col.cell({ getValue: () => cellValue, row: { original: childSession } } as any)
                                    : cellValue}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      }
                      
                      return (
                        <tr
                          key={childRow.id}
                          className={`${rowHeightClass} border-b border-slate-200/70 bg-slate-50/60 hover:bg-slate-100/70`}
                        >
                          {childRow.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              style={{ width: `${cell.column.getSize()}px` }}
                              className={`${tdPaddingClass} ${rowHeightClass} text-sm align-top whitespace-normal break-words text-slate-600`}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t-2 border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              tableData.length
            )}{' '}
            of {tableData.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 rounded-lg border-2 border-gray-300 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 rounded-lg border-2 border-gray-300 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Drilldown Modal */}
      <AnimatePresence>
        {isDrilldownOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrilldownOpen(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <div className="fixed inset-0 overflow-y-auto z-50">
              <div className="flex min-h-full items-start justify-center p-4 text-center md:items-center md:p-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-6xl transform rounded-3xl bg-white glass-card text-left align-middle shadow-2xl transition-all max-h-[90vh] overflow-y-auto"
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-2">
                          {drilldownTitle}
                        </h2>
                        <p className="text-sm text-gray-600">Detailed analytics • {drilldownSessions.length} sessions</p>
                      </div>
                      <button
                        onClick={() => setIsDrilldownOpen(false)}
                        className="p-3 rounded-xl hover:bg-red-100 transition-colors group"
                      >
                        <X className="w-6 h-6 text-gray-600 group-hover:text-red-600" />
                      </button>
                    </div>

                    {/* Metrics Grid */}
                    {drilldownSessions.length > 0 && (() => {
                      const metrics = drilldownSessions.reduce((acc, s) => {
                        acc.totalSessions++;
                        acc.totalCheckIns += s.checkedInCount || 0;
                        acc.totalRevenue += s.totalPaid || 0;
                        acc.totalCapacity += s.capacity || 0;
                        acc.totalBooked += s.bookedCount || 0;
                        acc.totalCancellations += s.lateCancelledCount || 0;
                        if ((s.checkedInCount || 0) === 0) acc.emptySessions++;
                        return acc;
                      }, { totalSessions: 0, totalCheckIns: 0, totalRevenue: 0, totalCapacity: 0, totalBooked: 0, totalCancellations: 0, emptySessions: 0 });

                      const avgFillRate = metrics.totalCapacity > 0 ? (metrics.totalCheckIns / metrics.totalCapacity) * 100 : 0;
                      const avgCheckIns = metrics.totalSessions > 0 ? metrics.totalCheckIns / metrics.totalSessions : 0;
                      const cancellationRate = metrics.totalBooked > 0 ? (metrics.totalCancellations / metrics.totalBooked) * 100 : 0;

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="glass-card rounded-xl p-4 border-l-4 border-blue-600">
                            <p className="text-xs text-gray-600 mb-1 uppercase font-semibold">Sessions</p>
                            <p className="text-2xl font-bold text-blue-700">{formatNumber(metrics.totalSessions)}</p>
                          </div>
                          <div className="glass-card rounded-xl p-4 border-l-4 border-green-600">
                            <p className="text-xs text-gray-600 mb-1 uppercase font-semibold">Total Check-ins</p>
                            <p className="text-2xl font-bold text-green-700">{formatNumber(metrics.totalCheckIns)}</p>
                          </div>
                          <div className="glass-card rounded-xl p-4 border-l-4 border-purple-600">
                            <p className="text-xs text-gray-600 mb-1 uppercase font-semibold">Avg Fill Rate</p>
                            <p className="text-2xl font-bold text-purple-700">{formatPercentage(avgFillRate)}</p>
                          </div>
                          <div className="glass-card rounded-xl p-4 border-l-4 border-emerald-600">
                            <p className="text-xs text-gray-600 mb-1 uppercase font-semibold">Revenue</p>
                            <p className="text-2xl font-bold text-emerald-700">{formatNumber(metrics.totalRevenue)}</p>
                          </div>
                          <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                            <p className="text-xs text-gray-700 mb-1 font-medium">Avg Check-ins</p>
                            <p className="text-xl font-bold text-blue-800">{avgCheckIns.toFixed(1)}</p>
                          </div>
                          <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-orange-50 to-orange-100">
                            <p className="text-xs text-gray-700 mb-1 font-medium">Empty Classes</p>
                            <p className="text-xl font-bold text-orange-800">{formatNumber(metrics.emptySessions)}</p>
                          </div>
                          <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-red-50 to-red-100">
                            <p className="text-xs text-gray-700 mb-1 font-medium">Cancellations</p>
                            <p className="text-xl font-bold text-red-800">{formatNumber(metrics.totalCancellations)}</p>
                          </div>
                          <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-slate-50 to-slate-100">
                            <p className="text-xs text-gray-700 mb-1 font-medium">Cancel Rate</p>
                            <p className="text-xl font-bold text-slate-800">{formatPercentage(cancellationRate)}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Sessions List */}
                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Individual Sessions</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {drilldownSessions.map((session, idx) => {
                          const fillRate = session.capacity > 0 ? ((session.checkedInCount || 0) / session.capacity) * 100 : 0;
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold">
                                    {session.cleanedClass}
                                  </span>
                                  <span className="text-xs text-gray-500">•</span>
                                  <p className="font-bold text-gray-900">{session.date}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold">
                                    {session.dayOfWeek}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-semibold">
                                    {session.time}
                                  </span>
                                  <p className="text-sm text-gray-600">{session.trainerName} • {session.location}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-green-700">
                                  {session.checkedInCount || 0}/{session.capacity || 0}
                                </p>
                                <p className="text-xs text-gray-600">{formatPercentage(fillRate)} full</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setIsDrilldownOpen(false)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
