import React, { useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
interface Column {
  key: string;
  header: React.ReactNode;
  render?: (value: any, row: any) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  sortable?: boolean;
  width?: string;
}
interface UniformTrainerTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  stickyHeader?: boolean;
  showFooter?: boolean;
  footerData?: any;
  maxHeight?: string;
  className?: string;
  headerGradient?: string;
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (row: any) => void;
  tableId?: string; // enable copy button + registry aggregation
  disableRegistry?: boolean;
}
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

export const UniformTrainerTable: React.FC<UniformTrainerTableProps> = ({
  data,
  columns,
  loading = false,
  stickyHeader = false,
  showFooter = false,
  footerData,
  maxHeight = "600px",
  className,
  headerGradient = "from-slate-600 to-slate-700",
  onSort,
  sortField,
  sortDirection,
  onRowClick,
  tableId,
  disableRegistry = false
}) => {
  if (loading) {
    return <div className="flex items-center justify-center p-8">
        <BrandSpinner size="md" />
      </div>;
  }
  const handleSort = (column: Column) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();

  // auto-register for copy-all aggregation
  useEffect(() => {
    if (!tableId) return;
    if (disableRegistry) return;
    if (!registry) return;
    const el = containerRef.current;
    if (!el) return;
    const getTextContent = () => {
      const table = el.querySelector('table') || el;
      let text = `${tableId}\n`;
      const headerCells = table.querySelectorAll('thead th');
      const headers: string[] = [];
      headerCells.forEach(cell => { const t = cell.textContent?.trim(); if (t) headers.push(t); });
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(() => '---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData: string[] = [];
        cells.forEach(c => rowData.push((c.textContent || '').trim()));
        if (rowData.length) text += rowData.join('\t') + '\n';
      });
      return text.trim();
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [tableId, disableRegistry, registry]);

  return <div ref={containerRef} className={cn("relative overflow-auto rounded-xl", className)} style={{
    maxHeight
  }}>
      {tableId && <div className="absolute top-2 right-2 z-30">
        <CopyTableButton
          tableRef={containerRef as any}
          tableName={tableId}
          size="sm"
          onCopyAllTabs={registry ? async () => registry.getAllTabsContent() : undefined}
        />
      </div>}
      <Table className="w-full table-fixed">
        <TableHeader className={cn(
          stickyHeader && "sticky top-0 z-20",
          "bg-gradient-to-r text-primary-foreground border-none shadow-sm",
          headerGradient
        )}>
          <TableRow className="border-none" style={{
          height: '48px'
        }}>
            {columns.map(column => <TableHead key={column.key} className={cn("font-bold text-primary-foreground px-4 text-sm whitespace-nowrap", column.align === 'center' && 'text-center', column.align === 'right' && 'text-right', column.sortable && 'cursor-pointer hover:bg-primary-foreground/10 transition-colors', column.className)} style={{
            height: '48px',
            width: column.width || 'auto'
          }} onClick={() => handleSort(column)}>
                <div className="flex items-center gap-2 h-full">
                  {column.header}
                  {column.sortable && sortField === column.key && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
              </TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => <TableRow key={index} className={cn("hover:bg-muted/40 transition-all duration-200 table-row-stripe", onRowClick && "cursor-pointer hover:scale-[1.01] hover:shadow-sm")} style={{
          height: '40px'
        }} onClick={() => onRowClick?.(row)}>
              {columns.map(column => <TableCell key={column.key} className={cn("px-4 py-3 text-sm font-medium", column.align === 'center' && 'text-center', column.align === 'right' && 'text-right', column.className)} style={{
            height: '40px'
          }}>
                  <div className="flex items-center h-full">
                    {column.render ? column.render(row[column.key], row) : <span className="truncate">{row[column.key]}</span>}
                  </div>
                </TableCell>)}
            </TableRow>)}
        </TableBody>
        {showFooter && footerData && <TableFooter className="sticky bottom-0 z-10 bg-primary/90 backdrop-blur-sm border-t border-border">
            <TableRow className="hover:bg-primary/95 border-none" style={{
          height: '44px'
        }}>
              {columns.map(column => <TableCell key={column.key} className={cn("font-bold text-primary-foreground px-4 py-3 text-sm", column.align === 'center' && 'text-center', column.align === 'right' && 'text-right', column.className)} style={{
            height: '44px'
          }}>
                  <div className="flex items-center h-full">
                    {column.render ? column.render(footerData[column.key], footerData) : <span className="truncate">{footerData[column.key]}</span>}
                  </div>
                </TableCell>)}
            </TableRow>
          </TableFooter>}
      </Table>
    </div>;
};