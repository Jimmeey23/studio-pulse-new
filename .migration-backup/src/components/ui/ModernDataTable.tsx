
import React, { useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { TABLE_STYLES, HEADER_GRADIENTS } from '@/styles/tableStyles';

interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  sortable?: boolean;
  sticky?: boolean;
}

interface ModernDataTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  stickyHeader?: boolean;
  showFooter?: boolean;
  footerData?: any;
  maxHeight?: string;
  className?: string;
  headerGradient?: keyof typeof HEADER_GRADIENTS | string;
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (row: any) => void;
  onFooterClick?: (row: any) => void;
  footerRowClassName?: string;
  footerStickyCellClassName?: string;
  footerCellClassName?: string;
  footerSectionStyle?: React.CSSProperties;
  footerRowStyle?: React.CSSProperties;
  footerStickyCellStyle?: React.CSSProperties;
  footerCellStyle?: React.CSSProperties;
  tableId?: string;
  disableRegistry?: boolean;
  striped?: boolean;
  compact?: boolean;
}

import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

export const ModernDataTable: React.FC<ModernDataTableProps> = ({
  data,
  columns,
  loading = false,
  stickyHeader = false,
  showFooter = false,
  footerData,
  maxHeight,
  className,
  headerGradient = "default",
  onSort,
  sortField,
  sortDirection,
  onRowClick,
  onFooterClick,
  footerRowClassName,
  footerStickyCellClassName,
  footerCellClassName,
  footerSectionStyle,
  footerRowStyle,
  footerStickyCellStyle,
  footerCellStyle,
  tableId,
  disableRegistry = false,
  striped = true,
  compact = false
}) => {
  // Get the gradient class - support both preset keys and custom strings
  const gradientClass = HEADER_GRADIENTS[headerGradient as keyof typeof HEADER_GRADIENTS] || headerGradient;
  // Remove individual loading state - parent components handle loading via global loader
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center p-8">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  //     </div>
  //   );
  // }

  const formatCurrencyValue = (value: any) => {
    if (typeof value === 'string' && (value.includes('₹') || value.includes('$'))) {
      const numericValue = parseFloat(value.replace(/[₹$,]/g, ''));
      if (!isNaN(numericValue) && numericValue < 1000) {
        return `₹${Math.round(numericValue)}`;
      }
    }
    return value;
  };

  const formatFooterValue = (value: any) => {
    if (value === null || value === undefined) return '';
    // Handle objects (like nested month data) - return empty string
    if (typeof value === 'object') {
      // If it's an object with a specific value we want to display, handle it
      // Otherwise return empty to avoid [object Object]
      return '';
    }
    if (typeof value === 'number') {
      // Check if it's a percentage (typically 0-100 range with decimals)
      if (value >= 0 && value <= 100 && !Number.isInteger(value)) {
        return `${value.toFixed(1)}%`;
      }
      // Check if it looks like currency (large numbers)
      if (value >= 1000) {
        return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      }
      // Format with max 1 decimal
      return Number.isInteger(value) ? value.toString() : value.toFixed(1);
    }
    return formatCurrencyValue(value);
  };

  const handleSort = (column: Column) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();

  // auto-register for copy-all
  useEffect(() => {
    if (disableRegistry) return;
    if (!registry) return;
    if (!tableId) return;
    const el = containerRef.current;
    if (!el) return;
    const getTextContent = () => {
      const table = el.querySelector('table') || el;
      let text = `${tableId}\n`;
      const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td');
      const headers: string[] = [];
      headerCells.forEach(cell => { const t = cell.textContent?.trim(); if (t) headers.push(t); });
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(() => '---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        const rowData: string[] = [];
        cells.forEach(c => rowData.push((c.textContent || '').trim()));
        if (rowData.length) text += rowData.join('\t') + '\n';
      });
      return text.trim();
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, tableId, disableRegistry]);

  return (
    <div
      ref={containerRef}
      className={cn(TABLE_STYLES.container, className)}
      style={{ maxHeight }}
      data-table={tableId}
      data-table-name={tableId}
    >
      <Table className={TABLE_STYLES.table} data-table={tableId} data-table-name={tableId}>
        <TableHeader className={cn(
          stickyHeader && TABLE_STYLES.header.wrapper,
          "border-b border-slate-300"
        )}>
          <TableRow className={cn(
            "border-none",
            compact ? "h-10" : "h-12",
            "relative",
            gradientClass.includes('from-') ? `bg-gradient-to-r ${gradientClass}` : ''
          )} style={!gradientClass.includes('from-') ? {
            background: `linear-gradient(to right, rgb(51 65 85), rgb(15 23 42), rgb(51 65 85))`
          } : undefined}>
            {columns.map((column, colIndex) => {
              const isSticky = column.sticky || colIndex === 0;
              const isLastColumn = colIndex === columns.length - 1;
              const sanitizedHeaderClass = (column.className || '')
                .split(' ')
                .filter(c => !c.startsWith('bg-'))
                .join(' ');
              return (
                <TableHead 
                  key={column.key} 
                  className={cn(
                    "px-3 text-left text-white font-bold text-xs uppercase tracking-wide border-r border-white/20 last:border-r-0",
                    compact ? "py-2" : "py-3",
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer hover:bg-white/10 transition-colors',
                    isSticky && 'sticky left-0 z-40 border-r border-white/20',
                    sanitizedHeaderClass,
                    isLastColumn && tableId && "pr-12" // Extra padding for copy button
                  )}
                  style={{
                    minWidth: '80px',
                    ...(isSticky
                      ? {
                          background: gradientClass.includes('from-')
                            ? `linear-gradient(to right, ${gradientClass.split(' ').slice(1).join(' ')})`
                            : 'linear-gradient(to right, rgb(51 65 85), rgb(15 23 42))',
                        }
                      : {}),
                  }}
                  onClick={() => handleSort(column)}
                >
                <div className={cn(
                  "flex items-center gap-1 h-full",
                  column.align === 'center' && 'justify-center',
                  column.align === 'right' && 'justify-end'
                )}>
                  <span className="text-xs font-bold uppercase tracking-wide leading-tight">
                    {column.header}
                  </span>
                  {column.sortable && sortField === column.key && (
                    sortDirection === 'asc' ? 
                      <ChevronUp className="w-3 h-3" /> : 
                      <ChevronDown className="w-3 h-3" />
                  )}
                </div>
                {/* Copy button positioned in last column header */}
                {isLastColumn && tableId && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <CopyTableButton 
                      tableRef={containerRef as any}
                      tableName={tableId}
                      size="sm"
                      onCopyAllTabs={registry ? async () => registry.getAllTabsContent() : undefined}
                    />
                  </div>
                )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow 
              key={index} 
              className={cn(
                TABLE_STYLES.body.row,
                striped && index % 2 === 1 && TABLE_STYLES.body.rowAlternate,
                onRowClick && TABLE_STYLES.body.rowClickable,
                compact ? "h-10" : "h-12"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, colIndex) => {
                const isSticky = column.sticky || colIndex === 0;
                return (
                  <TableCell 
                    key={column.key}
                    className={cn(
                      TABLE_STYLES.body.cell,
                      compact ? "py-1.5" : "py-2",
                      column.align === 'center' && TABLE_STYLES.body.cellCenter,
                      column.align === 'right' && 'text-right',
                      isSticky && TABLE_STYLES.body.cellSticky,
                      column.className
                    )}
                    style={{ minWidth: '80px' }}
                  >
                    <div className={cn(
                      "flex items-center h-full",
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}>
                      {column.render 
                        ? column.render(row[column.key], row)
                        : <span className="text-sm truncate">{formatCurrencyValue(row[column.key])}</span>
                      }
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
        {showFooter && footerData && (
          <TableFooter className="sticky bottom-0 z-10" style={footerSectionStyle}>
            <TableRow
              className={cn(
                TABLE_STYLES.footer.row,
                compact ? "h-10" : "h-12",
                "hover:bg-slate-800",
                onFooterClick && TABLE_STYLES.body.rowClickable,
                footerRowClassName
              )}
              style={footerRowStyle}
              onClick={() => onFooterClick?.(footerData)}
            >
              {columns.map((column, colIndex) => {
                const isSticky = column.sticky || colIndex === 0;
                return (
                  <TableCell 
                    key={column.key}
                    className={cn(
                      TABLE_STYLES.footer.cell,
                      compact ? "py-1.5" : "py-2",
                      column.align === 'center' && TABLE_STYLES.footer.cellCenter,
                      column.align === 'right' && 'text-right',
                      footerCellClassName,
                      isSticky && TABLE_STYLES.footer.cellSticky,
                      isSticky && footerStickyCellClassName
                    )}
                    style={{
                      minWidth: '80px',
                      ...footerCellStyle,
                      ...(isSticky ? footerStickyCellStyle : {}),
                    }}
                  >
                    <div className={cn(
                      "flex items-center h-full",
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}>
                      <span className="text-sm font-bold text-white">
                        {footerData[column.key] === 'TOTALS' || footerData[column.key] === 'TOTAL' 
                          ? footerData[column.key] 
                          : column.render && typeof footerData[column.key] === 'object'
                            ? (() => {
                                const rendered = column.render(footerData[column.key], footerData);
                                // Strip out any text color classes and force white
                                if (React.isValidElement(rendered)) {
                                  return React.cloneElement(rendered as React.ReactElement<any>, {
                                    className: cn(
                                      (rendered as React.ReactElement<any>).props?.className?.replace(/text-slate-\d+/g, '').replace(/text-blue-\d+/g, '').replace(/text-green-\d+/g, ''),
                                      'text-white'
                                    )
                                  });
                                }
                                return rendered;
                              })()
                            : formatFooterValue(footerData[column.key])}
                      </span>
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
};
