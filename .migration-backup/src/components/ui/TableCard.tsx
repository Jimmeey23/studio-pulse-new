import React, { useRef, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CopyTableButton from './CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { cn } from '@/lib/utils';

interface TableCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  showCopyButton?: boolean;
  headerControls?: React.ReactNode;
  onCopyAllTabs?: () => Promise<string>; // optional explicit override
  disableAutoRegistry?: boolean;
  // Enhanced context information for copying
  contextInfo?: {
    selectedMetric?: string;
    dateRange?: { start: string; end: string };
    filters?: Record<string, any>;
    additionalInfo?: Record<string, any>;
  };
}

export const TableCard = forwardRef<HTMLDivElement, TableCardProps>(({
  title,
  subtitle,
  children,
  className,
  showCopyButton = true,
  headerControls,
  onCopyAllTabs,
  disableAutoRegistry = false,
  contextInfo
}, ref) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const metricsRegistry = useMetricsTablesRegistry();

  React.useEffect(() => {
    if (disableAutoRegistry) return;
    if (!metricsRegistry) return;
    if (!title) return;
    const refEl = tableRef.current;
    if (!refEl) return;
    const getTextContent = () => {
      const table = refEl.querySelector('table') || refEl;
      let text = `${title}\n`;
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
    metricsRegistry.register({ id: title, getTextContent });
    return () => metricsRegistry.unregister(title);
  }, [metricsRegistry, title, disableAutoRegistry]);
  
  return (
    <Card className={cn("bg-white/95 backdrop-blur-sm border-0 shadow-xl", className)} ref={ref}>
      {(title || showCopyButton || headerControls) && (
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <CardTitle className="text-lg font-bold text-white">
                  {title}
                </CardTitle>
              )}
              {subtitle && (
                <p className="text-sm text-white/80 mt-1">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {headerControls}
              {showCopyButton && (
                <CopyTableButton 
                  tableRef={tableRef}
                  tableName={title || 'Table'}
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onCopyAllTabs={
                    onCopyAllTabs ?
                      (() => onCopyAllTabs().then(r => r)) :
                      (metricsRegistry ? async () => metricsRegistry.getAllTabsContent() : undefined)
                  }
                  contextInfo={contextInfo}
                />
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0" ref={tableRef}>
        {children}
      </CardContent>
    </Card>
  );
});

TableCard.displayName = 'TableCard';

export default TableCard;