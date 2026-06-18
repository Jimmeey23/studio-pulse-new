import React from 'react';
import { cn } from '@/lib/utils';

interface TableColumn {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface StandardizedTableProps {
  data: any[];
  columns: TableColumn[];
  striped?: boolean;
  headerColor?: 'slate' | 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'sky' | 'indigo' | 'pink';
  footerData?: any;
  loading?: boolean;
  maxHeight?: string;
}

const headerColorMap = {
  slate: 'from-slate-700 to-slate-900',
  emerald: 'from-emerald-700 to-emerald-900',
  blue: 'from-blue-700 to-blue-900',
  purple: 'from-purple-700 to-purple-900',
  rose: 'from-rose-700 to-rose-900',
  amber: 'from-amber-700 to-amber-900',
  sky: 'from-sky-700 to-sky-900',
  indigo: 'from-indigo-700 to-indigo-900',
  pink: 'from-pink-700 to-pink-900'
};

export const StandardizedTable: React.FC<StandardizedTableProps> = ({
  data,
  columns,
  striped = true,
  headerColor = 'slate',
  footerData,
  loading = false,
  maxHeight = '500px'
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500">
        Loading...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500">
        No data available
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-slate-200', maxHeight && `max-h-[${maxHeight}] overflow-y-auto`)}>
      <table className="w-full">
        <thead className="sticky top-0">
          <tr className={cn('bg-gradient-to-r text-white', `${headerColorMap[headerColor]}`)}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-sm font-semibold whitespace-nowrap',
                  col.align === 'left' && 'text-left',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right'
                )}
                style={col.width ? { width: col.width } : {}}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, index) => (
            <tr
              key={index}
              className={cn(
                'transition-colors hover:bg-slate-100',
                striped && index % 2 === 0 ? 'bg-white' : striped && 'bg-slate-50'
              )}
            >
              {columns.map((col) => (
                <td
                  key={`${index}-${col.key}`}
                  className={cn(
                    'px-4 py-3 text-sm',
                    col.align === 'left' && 'text-left',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                  )}
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footerData && (
          <tfoot>
            <tr className="bg-slate-900 text-white font-semibold border-t-2 border-slate-300">
              {columns.map((col) => (
                <td
                  key={`footer-${col.key}`}
                  className={cn(
                    'px-4 py-3 text-sm',
                    col.align === 'left' && 'text-left',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                  )}
                >
                  {col.render && footerData[col.key]
                    ? col.render(footerData[col.key], footerData)
                    : footerData[col.key] || ''}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};
