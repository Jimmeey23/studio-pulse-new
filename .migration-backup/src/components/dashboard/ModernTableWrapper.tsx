import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, ExpandIcon, ShrinkIcon, Filter, Calendar, TrendingUp, BarChart3, DollarSign, Users, ShoppingCart, Target, Package, Activity, Percent, Trophy, Medal, Award, Crown, Star, Eye, Receipt, BadgePercent, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { shallowEqual } from '@/utils/performanceUtils';
import { TABLE_STYLES, HEADER_GRADIENTS } from '@/styles/tableStyles';

interface ModernTableWrapperProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  totalItems?: number;
  filterCount?: number;
  className?: string;
  headerControls?: React.ReactNode;
  collapsedGroups?: Set<string>;
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
  showCollapseControls?: boolean;
  showDisplayToggle?: boolean;
  displayMode?: 'values' | 'growth';
  onDisplayModeChange?: (mode: 'values' | 'growth') => void;
  showCopyButton?: boolean;
  tableRef?: React.RefObject<HTMLTableElement>;
  onCopyAllTabs?: () => Promise<string>; // explicit override
  disableAutoRegistry?: boolean; // opt-out of automatic registry + copy all tabs
  // Enhanced context information for copying
  contextInfo?: {
    selectedMetric?: string;
    dateRange?: { start: string; end: string };
    filters?: Record<string, any>;
    additionalInfo?: Record<string, any>;
  };
}

const ModernTableWrapperComponent: React.FC<ModernTableWrapperProps> = ({
  title,
  description,
  icon,
  children,
  totalItems,
  filterCount,
  className,
  headerControls,
  collapsedGroups = new Set(),
  onCollapseAll,
  onExpandAll,
  showCollapseControls = true,
  showDisplayToggle = false,
  displayMode = 'values',
  onDisplayModeChange,
  showCopyButton = true,
  tableRef,
  onCopyAllTabs,
  disableAutoRegistry = false,
  contextInfo
}) => {
  const internalTableRef = useRef<HTMLDivElement>(null);
  const metricsRegistry = useMetricsTablesRegistry();

  // Auto-register this table for "copy all tabs" aggregation if provider is present
  useEffect(() => {
    if (disableAutoRegistry) return;
    if (!metricsRegistry) return;
    const refEl = (tableRef?.current as HTMLElement) || internalTableRef.current;
    if (!refEl) return;

    const getTextContent = () => {
      // Attempt to extract tab-separated text similar to CopyTableButton's logic
      const table = refEl.querySelector('table') || refEl;
      let text = `${title}\n`;
      // Headers
      const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td');
      const headers: string[] = [];
      headerCells.forEach(cell => {
        const t = cell.textContent?.trim();
        if (t) headers.push(t);
      });
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(() => '---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      rows.forEach(row => {
        // Check if this is a grouped/category row but NOT the totals row
        const isGroupRow = row.classList.contains('bg-slate-100') || 
                           row.querySelector('button[class*="ChevronRight"], button[class*="ChevronDown"]') !== null ||
                           row.querySelector('svg.lucide-chevron-right, svg.lucide-chevron-down') !== null;
        const isTotalsRow = row.classList.contains('bg-slate-800') || 
                            row.textContent?.includes('TOTALS') ||
                            row.textContent?.includes('Total');
        
        // Skip group rows but include totals
        if (isGroupRow && !isTotalsRow) {
          return;
        }
        
        const cells = row.querySelectorAll('td, th');
        const rowData: string[] = [];
        cells.forEach(c => rowData.push((c.textContent || '').trim()));
        if (rowData.length) text += rowData.join('\t') + '\n';
      });
      return text.trim();
    };

    metricsRegistry.register({ id: title, getTextContent });
    return () => metricsRegistry.unregister(title);
  }, [metricsRegistry, title, tableRef, disableAutoRegistry]);
  return (
    <Card className={cn(TABLE_STYLES.card.container, className)}>
      <CardHeader className={TABLE_STYLES.card.header}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={TABLE_STYLES.card.headerIcon}>
              {icon}
            </div>
            <div>
              <h3 className={TABLE_STYLES.card.headerTitle}>{title}</h3>
              <p className={TABLE_STYLES.card.headerDescription}>{description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {totalItems && (
              <Badge variant="secondary" className="bg-white/20 text-white font-semibold">
                {totalItems} items
              </Badge>
            )}
            
            {showDisplayToggle && onDisplayModeChange && (
              <div className="flex items-center space-x-1 mr-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDisplayModeChange('values')}
                  className={`font-medium text-xs px-2 py-1 h-7 ${
                    displayMode === 'values' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Values
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDisplayModeChange('growth')}
                  className={`font-medium text-xs px-2 py-1 h-7 ${
                    displayMode === 'growth' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Percent className="w-3 h-3 mr-1" />
                  Growth
                </Button>
              </div>
            )}
            
            {showCollapseControls && onCollapseAll && onExpandAll && (
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onCollapseAll}
                  className="text-white hover:bg-white/20 font-medium text-xs px-2 py-1 h-7"
                >
                  <ShrinkIcon className="w-3 h-3 mr-1" />
                  Collapse All
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onExpandAll}
                  className="text-white hover:bg-white/20 font-medium text-xs px-2 py-1 h-7"
                >
                  <ExpandIcon className="w-3 h-3 mr-1" />
                  Expand All
                </Button>
              </div>
            )}

            {/* Copy Table Button */}
            {showCopyButton && (
              <CopyTableButton 
                tableRef={tableRef || internalTableRef}
                tableName={title}
                size="sm"
                className="text-white hover:bg-white/20"
                onCopyAllTabs={
                  // Prioritize explicit override; otherwise use registry aggregator if available
                  onCopyAllTabs ?
                    (() => onCopyAllTabs().then(r => r)) :
                    (metricsRegistry ? async () => metricsRegistry.getAllTabsContent() : undefined)
                }
                contextInfo={contextInfo}
              />
            )}

            {headerControls}
          </div>
        </div>
      </CardHeader>

      {/* Animated Color-Changing Border */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 animate-pulse duration-[3000ms]"></div>
      </div>

      <CardContent className={TABLE_STYLES.card.content} ref={internalTableRef}>
        {children}
      </CardContent>
    </Card>
  );
};

// Memoize component with custom comparison
export const ModernTableWrapper = React.memo(
  ModernTableWrapperComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.title === nextProps.title &&
      prevProps.description === nextProps.description &&
      prevProps.totalItems === nextProps.totalItems &&
      prevProps.filterCount === nextProps.filterCount &&
      prevProps.className === nextProps.className &&
      prevProps.showCollapseControls === nextProps.showCollapseControls &&
      prevProps.showDisplayToggle === nextProps.showDisplayToggle &&
      prevProps.displayMode === nextProps.displayMode &&
      prevProps.showCopyButton === nextProps.showCopyButton &&
      prevProps.disableAutoRegistry === nextProps.disableAutoRegistry &&
      prevProps.collapsedGroups === nextProps.collapsedGroups &&
      prevProps.onCollapseAll === nextProps.onCollapseAll &&
      prevProps.onExpandAll === nextProps.onExpandAll &&
      prevProps.onDisplayModeChange === nextProps.onDisplayModeChange &&
      prevProps.tableRef === nextProps.tableRef &&
      prevProps.onCopyAllTabs === nextProps.onCopyAllTabs &&
      prevProps.children === nextProps.children
    );
  }
);


interface ModernGroupBadgeProps {
  count: number;
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
  className?: string;
}

export const ModernGroupBadge: React.FC<ModernGroupBadgeProps> = ({ 
  count, 
  label, 
  variant = 'default', 
  className = '' 
}) => {
  return (
    <div className={cn(TABLE_STYLES.group.badge, className)}>
      <span className="font-bold">{count}</span>
      <span className="ml-1.5 font-medium">{label}</span>
    </div>
  );
};

interface ModernMetricTabsProps {
  metrics: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
  }>;
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
  className?: string;
}

// Professional metrics for business analysis
export const STANDARD_METRICS = [
  { key: 'revenue', label: 'Total Revenue', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'units', label: 'Volume Sold', icon: <Package className="w-4 h-4" /> },
  { key: 'transactions', label: 'Transaction Count', icon: <ShoppingCart className="w-4 h-4" /> },
  { key: 'members', label: 'Customer Base', icon: <Users className="w-4 h-4" /> },
  { key: 'auv', label: 'Avg. User Value', icon: <TrendingUp className="w-4 h-4" /> },
  { key: 'atv', label: 'Avg. Transaction Value', icon: <Target className="w-4 h-4" /> },
  { key: 'asv', label: 'Avg. Session Value', icon: <Activity className="w-4 h-4" /> },
  { key: 'upt', label: 'Units per Transaction', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'vat', label: 'Tax Amount', icon: <Receipt className="w-4 h-4" /> },
  { key: 'discountAmount', label: 'Discount Value', icon: <BadgePercent className="w-4 h-4" /> },
  { key: 'discountPercentage', label: 'Discount Rate', icon: <Percent className="w-4 h-4" /> },
  { key: 'purchaseFrequency', label: 'Purchase Interval', icon: <Clock className="w-4 h-4" /> }
];

export const ModernMetricTabs: React.FC<ModernMetricTabsProps> = ({
  metrics,
  selectedMetric,
  onMetricChange,
  className = ''
}) => {
  return (
    <div className={cn(TABLE_STYLES.metricTabs.container, className)}>
      <div className={TABLE_STYLES.metricTabs.label}>
        <BarChart3 className="w-4 h-4 text-slate-500" />
        <span>Metrics:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            onClick={() => onMetricChange(metric.key)}
            className={cn(
              TABLE_STYLES.metricTabs.button,
              selectedMetric === metric.key
                ? TABLE_STYLES.metricTabs.buttonActive
                : TABLE_STYLES.metricTabs.buttonInactive
            )}
          >
            {metric.icon}
            <span>{metric.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};