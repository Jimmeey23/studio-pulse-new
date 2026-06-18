import React from 'react';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { formatCurrency, formatNumber, formatDiscount } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernSalesTableProps {
  data: any[];
  loading?: boolean;
  title?: string;
  onRowClick?: (row: any) => void;
  showFooter?: boolean;
  footerData?: any;
  maxHeight?: string;
  className?: string;
}

export const ModernSalesTable: React.FC<ModernSalesTableProps> = ({
  data,
  loading = false,
  title,
  onRowClick,
  showFooter = false,
  footerData,
  maxHeight = "500px",
  className
}) => {
  
  const getGrowthBadge = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    
    const growth = ((current - previous) / previous) * 100;
    const isPositive = growth > 0;
    
    return (
      <div className={cn(
        "group relative inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200",
        isPositive 
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
          : "bg-red-50 text-red-700 hover:bg-red-100"
      )}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{Math.abs(growth).toFixed(1)}%</span>
        
        {/* Hover tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
          <div className="font-medium">Growth Details</div>
          <div>Previous: {formatCurrency(previous)}</div>
          <div>Current: {formatCurrency(current)}</div>
          <div className={isPositive ? "text-emerald-300" : "text-red-300"}>
            {isPositive ? "↗" : "↘"} {growth.toFixed(1)}%
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  };

  const columns = [
    {
      key: 'name',
      header: 'Item',
      render: (value: any, row: any) => (
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">{value}</span>
            {row.category && (
              <span className="text-xs text-slate-500">{row.category}</span>
            )}
          </div>
        </div>
      ),
      align: 'left' as const,
      sortable: true
    },
    {
      key: 'revenue',
      header: 'Revenue',
      render: (value: any, row: any) => (
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono font-semibold">{formatCurrency(value)}</span>
          {row.previousRevenue && getGrowthBadge(value, row.previousRevenue)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'transactions',
      header: 'Transactions',
      render: (value: any, row: any) => (
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono">{formatNumber(value)}</span>
          {row.previousTransactions && getGrowthBadge(value, row.previousTransactions)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'discountAmount',
      header: 'Discount',
      render: (value: any) => (
        <span className="font-mono text-red-600">{formatDiscount(value)}</span>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'atv',
      header: 'ATV',
      render: (value: any) => (
        <span className="font-mono">{formatCurrency(value)}</span>
      ),
      align: 'center' as const,
      sortable: true
    }
  ];

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      )}
      <ModernDataTable
        data={data}
        columns={columns}
        loading={loading}
        stickyHeader={true}
        showFooter={showFooter}
        footerData={footerData}
        maxHeight={maxHeight}
        className={className}
        headerGradient="from-slate-700 to-slate-900"
        onRowClick={onRowClick}
      />
    </div>
  );
};