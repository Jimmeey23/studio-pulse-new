import { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  Row,
  SortingState,
  ExpandedState,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { GroupBy, ViewMode, GroupedRow, SessionData } from '@/types';
import { calculateMetrics, calculateTotalsRow, formatCurrency, formatPercentage, formatNumber } from '@/utils/calculations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DataTableEnhancedProps {
  sessions: SessionData[];
}

const groupByOptions: { value: GroupBy; label: string }[] = [
  { value: 'Class', label: 'Class' },
  { value: 'ClassDay', label: 'Class + Day' },
  { value: 'ClassDayTime', label: 'Class + Day + Time' },
  { value: 'ClassDayTimeLocation', label: 'Class + Day + Time + Location' },
  { value: 'ClassDayTimeLocationTrainer', label: 'Class + Day + Time + Location + Trainer' },
  { value: 'Location', label: 'Location' },
  { value: 'LocationClass', label: 'Location + Class' },
  { value: 'LocationClassDay', label: 'Location + Class + Day' },
  { value: 'Trainer', label: 'Trainer' },
  { value: 'TrainerClass', label: 'Trainer + Class' },
  { value: 'TrainerDay', label: 'Trainer + Day' },
  { value: 'TrainerLocation', label: 'Trainer + Location' },
  { value: 'Day', label: 'Day of Week' },
  { value: 'DayTime', label: 'Day + Time' },
  { value: 'Time', label: 'Time Slot' },
  { value: 'Month', label: 'Month' },
  { value: 'Week', label: 'Week' },
  { value: 'ClassMonth', label: 'Class + Month' },
  { value: 'LocationMonth', label: 'Location + Month' },
];

const viewModeOptions: { value: ViewMode; label: string }[] = [
  { value: 'grouped', label: 'Grouped View' },
  { value: 'flat', label: 'Flat View' },
];

export function DataTableEnhanced({ sessions }: DataTableEnhancedProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('ClassDayTimeLocation');
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Group sessions data
  const groupedData = useMemo(() => {
    setIsCalculating(true);
    
    const groups = new Map<string, SessionData[]>();
    
    sessions.forEach((session) => {
      let key = '';
      
      switch (groupBy) {
        case 'Class':
          key = session.className;
          break;
        case 'ClassDay':
          key = `${session.className}|${session.day}`;
          break;
        case 'ClassDayTime':
          key = `${session.className}|${session.day}|${session.time}`;
          break;
        case 'ClassDayTimeLocation':
          key = `${session.className}|${session.day}|${session.time}|${session.location}`;
          break;
        case 'ClassDayTimeLocationTrainer':
          key = `${session.className}|${session.day}|${session.time}|${session.location}|${session.instructor}`;
          break;
        case 'Location':
          key = session.location;
          break;
        case 'LocationClass':
          key = `${session.location}|${session.className}`;
          break;
        case 'LocationClassDay':
          key = `${session.location}|${session.className}|${session.day}`;
          break;
        case 'Trainer':
          key = session.instructor;
          break;
        case 'TrainerClass':
          key = `${session.instructor}|${session.className}`;
          break;
        case 'TrainerDay':
          key = `${session.instructor}|${session.day}`;
          break;
        case 'TrainerLocation':
          key = `${session.instructor}|${session.location}`;
          break;
        case 'Day':
          key = session.day;
          break;
        case 'DayTime':
          key = `${session.day}|${session.time}`;
          break;
        case 'Time':
          key = session.time;
          break;
        case 'Month':
          key = session.date.substring(0, 7); // YYYY-MM
          break;
        case 'Week':
          const date = new Date(session.date);
          const week = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
          key = `${session.date.substring(0, 7)}-W${week}`;
          break;
        case 'ClassMonth':
          key = `${session.className}|${session.date.substring(0, 7)}`;
          break;
        case 'LocationMonth':
          key = `${session.location}|${session.date.substring(0, 7)}`;
          break;
        default:
          key = session.className;
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(session);
    });
    
    const result: GroupedRow[] = [];
    
    groups.forEach((groupSessions, key) => {
      const parts = key.split('|');
      const metrics = calculateMetrics(groupSessions);
      
      const row: GroupedRow = {
        id: key,
        className: parts[0] || '',
        day: parts[1] || '',
        time: parts[2] || '',
        location: parts[3] || '',
        trainer: parts[4] || '',
        ...metrics,
        children: viewMode === 'grouped' ? groupSessions.map((session, idx) => ({
          id: `${key}-${idx}`,
          className: session.className,
          day: session.day,
          time: session.time,
          location: session.location,
          trainer: session.instructor,
          date: session.date,
          ...calculateMetrics([session]),
          children: [],
        })) : [],
      };
      
      result.push(row);
    });
    
    setTimeout(() => setIsCalculating(false), 100);
    return result;
  }, [sessions, groupBy, viewMode]);

  // Calculate totals
  const totalsRow = useMemo(() => {
    const allSessions = groupedData.flatMap(row => 
      row.children && row.children.length > 0 
        ? row.children.map(() => sessions.find(s => 
            s.className === row.className && 
            s.day === row.day && 
            s.time === row.time
          )!).filter(Boolean)
        : [sessions.find(s => 
            s.className === row.className && 
            s.day === row.day && 
            s.time === row.time
          )!].filter(Boolean)
    );
    return calculateTotalsRow(allSessions);
  }, [groupedData, sessions]);

  // Define columns
  const columns = useMemo<ColumnDef<GroupedRow>[]>(() => {
    const cols: ColumnDef<GroupedRow>[] = [];
    
    // Group identifier columns
    if (groupBy.includes('Class')) {
      cols.push({
        accessorKey: 'className',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-white/10 -ml-4"
          >
            Class Name
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.getCanExpand() && (
              <button
                onClick={row.getToggleExpandedHandler()}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {row.getIsExpanded() ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            <span className={row.getCanExpand() ? 'font-semibold' : ''}>
              {row.original.className}
            </span>
          </div>
        ),
      });
    }
    
    if (groupBy.includes('Day')) {
      cols.push({
        accessorKey: 'day',
        header: 'Day',
        cell: ({ row }) => <span className={row.getCanExpand() ? 'font-semibold' : ''}>{row.original.day}</span>,
      });
    }
    
    if (groupBy.includes('Time')) {
      cols.push({
        accessorKey: 'time',
        header: 'Time',
        cell: ({ row }) => <span className={row.getCanExpand() ? 'font-semibold' : ''}>{row.original.time}</span>,
      });
    }
    
    if (groupBy.includes('Location')) {
      cols.push({
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => <span className={row.getCanExpand() ? 'font-semibold' : ''}>{row.original.location}</span>,
      });
    }
    
    if (groupBy.includes('Trainer')) {
      cols.push({
        accessorKey: 'trainer',
        header: 'Trainer',
        cell: ({ row }) => <span className={row.getCanExpand() ? 'font-semibold' : ''}>{row.original.trainer}</span>,
      });
    }
    
    if (groupBy === 'Month' || groupBy.includes('Month')) {
      cols.push({
        accessorKey: 'id',
        header: 'Month',
        cell: ({ row }) => {
          const monthStr = row.original.id.split('|').pop()!;
          return <span className={row.getCanExpand() ? 'font-semibold' : ''}>{monthStr}</span>;
        },
      });
    }
    
    // Metrics columns
    cols.push(
      {
        accessorKey: 'classes',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-white/10 -ml-4"
          >
            Classes
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => <span className={row.getCanExpand() ? 'font-semibold' : ''}>{formatNumber(row.original.classes)}</span>,
      },
      {
        accessorKey: 'totalCheckIns',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-white/10 -ml-4"
          >
            Check-ins
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => <span className={row.getCanExpand() ? 'font-semibold' : ''}>{formatNumber(row.original.totalCheckIns)}</span>,
      },
      {
        accessorKey: 'classAvg',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-white/10 -ml-4"
          >
            Avg/Class
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => <span className={row.getCanExpand() ? 'font-semibold' : ''}>{formatNumber(row.original.classAvg)}</span>,
      },
      {
        accessorKey: 'fillRate',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-white/10 -ml-4"
          >
            Fill Rate
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => <span className={row.getCanExpand() ? 'font-semibold' : ''}>{formatPercentage(row.original.fillRate)}</span>,
      },
      {
        accessorKey: 'totalRevenue',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-white/10 -ml-4"
          >
            Revenue
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => <span className={row.getCanExpand() ? 'font-semibold' : ''}>{formatCurrency(row.original.totalRevenue)}</span>,
      },
      {
        accessorKey: 'compositeScore',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-white/10 -ml-4"
          >
            Score
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className={`${row.getCanExpand() ? 'font-semibold' : ''} ${
            row.original.compositeScore >= 80 ? 'text-green-600' :
            row.original.compositeScore >= 60 ? 'text-blue-600' :
            row.original.compositeScore >= 40 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {formatNumber(row.original.compositeScore)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.original.status === 'excellent' ? 'bg-green-100 text-green-700' :
            row.original.status === 'good' ? 'bg-blue-100 text-blue-700' :
            row.original.status === 'average' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {row.original.status?.charAt(0).toUpperCase() + row.original.status?.slice(1)}
          </span>
        ),
      }
    );
    
    return cols;
  }, [groupBy]);

  const table = useReactTable({
    data: groupedData,
    columns,
    state: {
      sorting,
      expanded,
    },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSubRows: (row) => row.children,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group By
            </label>
            <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupByOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View Mode
            </label>
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {viewModeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-semibold"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              <AnimatePresence mode="popLayout">
                {isCalculating ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Calculating metrics...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`
                        hover:bg-gray-50 transition-colors
                        ${row.depth > 0 ? 'bg-gray-50/50' : ''}
                        ${row.getCanExpand() ? 'font-medium' : ''}
                      `}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm"
                          style={{
                            paddingLeft: row.depth > 0 ? `${row.depth * 2 + 1}rem` : undefined,
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
            <tfoot className="bg-gradient-to-br from-slate-800 via-blue-800 to-indigo-700 text-white font-bold">
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={groupBy.split(/(?=[A-Z])/).length}>
                  TOTAL
                </td>
                <td className="px-4 py-3 text-sm">{formatNumber(totalsRow.classes)}</td>
                <td className="px-4 py-3 text-sm">{formatNumber(totalsRow.totalCheckIns)}</td>
                <td className="px-4 py-3 text-sm">{formatNumber(totalsRow.classAvg)}</td>
                <td className="px-4 py-3 text-sm">{formatPercentage(totalsRow.fillRate)}</td>
                <td className="px-4 py-3 text-sm">{formatCurrency(totalsRow.totalRevenue)}</td>
                <td className="px-4 py-3 text-sm">{formatNumber(totalsRow.compositeScore)}</td>
                <td className="px-4 py-3 text-sm">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
