import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ModernTableWrapper } from './ModernTableWrapper';

// Standard table styling constants
export const TABLE_STYLES = {
  // Container
  container: "space-y-6",
  tableContainer: "overflow-x-auto",
  table: "min-w-full bg-white",
  
  // Header styles
  headerRow: "bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800",
  headerSticky: "sticky top-0 z-30",
  headerCell: "px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide border-r border-white/20 cursor-pointer select-none",
  headerCellFirst: "w-[30rem] px-6 py-3 text-left text-white font-bold text-sm uppercase tracking-wide sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-40 border-r border-white/20 cursor-pointer select-none",
  headerCellHighlighted: "bg-blue-800 text-white",
  
  // Category/Group row styles
  categoryRow: "group bg-slate-100 border-b border-slate-400 font-semibold hover:bg-slate-200 transition-all duration-200 h-9 max-h-9 cursor-pointer",
  categoryCell: "w-[30rem] px-4 py-2 text-left sticky left-0 bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-50 group-hover:from-slate-200 group-hover:via-blue-100 group-hover:to-indigo-100 border-r border-slate-200 z-20 transition-all duration-300 shadow-sm whitespace-nowrap overflow-hidden text-ellipsis",
  categoryText: "font-bold text-sm text-black",
  
  // Data row styles
  dataRow: "bg-white hover:bg-slate-50 border-b border-gray-200 transition-all duration-200 h-9 max-h-9",
  dataRowProduct: "bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-200 transition-all duration-300 hover:shadow-lg animate-in slide-in-from-left-2 fade-in duration-300 cursor-pointer h-9 max-h-9",
  dataCell: "px-4 py-2 text-left sticky left-0 bg-white hover:bg-slate-50 border-r border-gray-200 z-20 cursor-pointer transition-all duration-200 whitespace-nowrap overflow-hidden text-ellipsis",
  dataCellProduct: "w-[30rem] px-12 py-3 text-left sticky left-0 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-r border-slate-100 z-10 cursor-pointer transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis",
  
  // Regular cell styles
  cell: "px-2 py-3 text-center text-sm font-mono text-slate-700 border-l border-gray-200 cursor-pointer hover:bg-blue-100/60 whitespace-nowrap",
  cellHighlighted: "px-3 py-3 text-center font-bold text-xs uppercase tracking-wider border-l border-white/20 min-w-[90px] cursor-pointer select-none bg-blue-800 text-white",
  
  // Totals row styles
  totalsRow: "bg-slate-800 text-white font-bold border-t-2 border-slate-400",
  totalsCell: "w-[30rem] px-6 py-3 text-left sticky left-0 bg-slate-800 border-r border-slate-400 z-20 cursor-pointer hover:underline whitespace-nowrap",
  
  // Text styles
  textPrimary: "text-slate-700 font-medium text-xs",
  textSecondary: "text-slate-400 text-xs",
  textCategory: "text-slate-800 font-bold",
  textProduct: "text-slate-700 font-medium",
  
  // Growth indicator styles
  growthPositive: "text-emerald-600",
  growthNegative: "text-red-500",
  growthNeutral: "text-slate-500",
  
  // Animation classes
  animations: "animate-in slide-in-from-bottom-8 fade-in duration-1000"
};

// Standard table props interface
export interface StandardTableProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  data: any[];
  onRowClick?: (row: any) => void;
  selectedMetric?: string;
  onMetricChange?: (metric: string) => void;
  displayMode?: 'values' | 'growth';
  onDisplayModeChange?: (mode: 'values' | 'growth') => void;
  collapsedGroups?: Set<string>;
  onGroupToggle?: (group: string) => void;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  tableId?: string;
  className?: string;
}

// Standard table header component
export const StandardTableHeader: React.FC<{
  columns: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    isFirstColumn?: boolean;
    isHighlighted?: boolean;
    onClick?: () => void;
    title?: string;
  }>;
}> = ({ columns }) => (
  <thead className={TABLE_STYLES.headerSticky}>
    <tr className={TABLE_STYLES.headerRow}>
      {columns.map((col, index) => (
        <th
          key={col.key}
          className={col.isFirstColumn ? TABLE_STYLES.headerCellFirst : 
                    col.isHighlighted ? `${TABLE_STYLES.headerCell} ${TABLE_STYLES.headerCellHighlighted}` :
                    TABLE_STYLES.headerCell}
          onClick={col.onClick}
          title={col.title}
        >
          <div className="flex items-center space-x-2">
            {col.icon}
            <span>{col.label}</span>
          </div>
        </th>
      ))}
    </tr>
  </thead>
);

// Standard category row component
export const StandardCategoryRow: React.FC<{
  category: string;
  icon?: React.ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ category, icon, isCollapsed, onToggle, onClick, children }) => (
  <tr className={TABLE_STYLES.categoryRow} onClick={onClick}>
    <td className={TABLE_STYLES.categoryCell}>
      <div className="flex items-center space-x-2">
        {onToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-1 h-5 w-5 rounded text-slate-600 hover:text-slate-800 hover:bg-white/50 transition-all duration-200"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        )}
        {icon}
        <span className={TABLE_STYLES.categoryText}>{category}</span>
      </div>
    </td>
    {children}
  </tr>
);

// Standard data row component
export const StandardDataRow: React.FC<{
  isProduct?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ isProduct = false, onClick, className, children }) => (
  <tr 
    className={className || (isProduct ? TABLE_STYLES.dataRowProduct : TABLE_STYLES.dataRow)}
    onClick={onClick}
  >
    {children}
  </tr>
);

// Standard cell component
export const StandardCell: React.FC<{
  isFirstColumn?: boolean;
  isProduct?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ isFirstColumn, isProduct, isHighlighted, onClick, title, className, children }) => (
  <td 
    className={className || 
               (isFirstColumn ? 
                (isProduct ? TABLE_STYLES.dataCellProduct : TABLE_STYLES.dataCell) :
                (isHighlighted ? TABLE_STYLES.cellHighlighted : TABLE_STYLES.cell))}
    onClick={onClick}
    title={title}
  >
    {children}
  </td>
);

export default {
  TABLE_STYLES,
  StandardTableHeader,
  StandardCategoryRow,
  StandardDataRow,
  StandardCell
};