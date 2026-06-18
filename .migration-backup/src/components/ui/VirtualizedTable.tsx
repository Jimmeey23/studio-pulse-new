import React, { memo, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    render?: (value: any, item: T) => React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
    width?: number;
  }>;
  loading?: boolean;
  height?: number;
  rowHeight?: number;
  stickyHeader?: boolean;
  onRowClick?: (item: T) => void;
  tableId?: string;
  showCopyButton?: boolean;
  overscan?: number;
}

// Row component for virtual scrolling
const Row = memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    items: any[];
    columns: any[];
    onRowClick?: (item: any) => void;
  };
}>(({ index, style, data }) => {
  const { items, columns, onRowClick } = data;
  const item = items[index];

  return (
    <div style={style} className="flex border-b border-gray-100 hover:bg-gray-50">
      {columns.map((column, colIndex) => {
        const value = item[column.key];
        const cellContent = column.render ? column.render(value, item) : value;
        
        return (
          <div
            key={colIndex}
            className={`flex-shrink-0 px-4 py-2 text-sm ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'} ${column.className || ''}`}
            style={{ width: column.width || 150 }}
            onClick={() => onRowClick?.(item)}
          >
            {cellContent}
          </div>
        );
      })}
    </div>
  );
});

Row.displayName = 'VirtualizedTableRow';

function VirtualizedTableComponent<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  height = 600,
  rowHeight = 48,
  stickyHeader = true,
  onRowClick,
  tableId = 'virtualized-table',
  showCopyButton = true,
  overscan = 5
}: VirtualizedTableProps<T>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Register with metrics tables registry
  const { registerTable, unregisterTable } = useMetricsTablesRegistry();
  
  useEffect(() => {
    if (tableId && tableRef.current) {
      registerTable(tableId, tableRef);
      return () => unregisterTable(tableId);
    }
  }, [tableId, registerTable, unregisterTable]);

  // Memoize the row data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    items: data,
    columns,
    onRowClick
  }), [data, columns, onRowClick]);

  // Calculate total width for horizontal scrolling
  const totalWidth = useMemo(() => {
    return columns.reduce((sum, col) => sum + (col.width || 150), 0);
  }, [columns]);

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={tableRef} id={tableId}>
      {showCopyButton && (
        <div className="absolute right-2 top-2 z-40">
          <CopyTableButton tableRef={tableRef} />
        </div>
      )}
      
      <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
        {/* Header */}
        {stickyHeader && (
          <div 
            ref={headerRef}
            className="flex bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white font-semibold border-b-2 border-slate-600"
            style={{ minWidth: totalWidth }}
          >
            {columns.map((column, index) => (
              <div
                key={index}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                style={{ width: column.width || 150 }}
              >
                {column.header}
              </div>
            ))}
          </div>
        )}

        {/* Virtualized Content */}
        <div style={{ height: height - (stickyHeader ? 48 : 0) }}>
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data available
            </div>
          ) : (
            <List
              height={height - (stickyHeader ? 48 : 0)}
              itemCount={data.length}
              itemSize={rowHeight}
              itemData={itemData}
              overscanCount={overscan}
              width="100%"
            >
              {Row}
            </List>
          )}
        </div>
      </div>
    </div>
  );
}

export const VirtualizedTable = memo(VirtualizedTableComponent) as <T extends Record<string, any>>(
  props: VirtualizedTableProps<T>
) => React.ReactElement;