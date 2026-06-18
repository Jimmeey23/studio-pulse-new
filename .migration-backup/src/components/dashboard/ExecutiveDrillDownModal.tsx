import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Download, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ExecutiveDrillDownModal
 * 
 * A reusable modal component for drilling down on Executive metric cards.
 * Shows detailed breakdown, analytics, and raw data.
 */

interface ExecutiveDrillDownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  metric: string;
  currentValue: number | string;
  previousValue?: number | string;
  description?: string;
  borderColor?: 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'sky' | 'indigo' | 'pink';
  
  // Data sections
  breakdownData?: Array<{
    label: string;
    value: number | string;
    percentage?: number;
    color?: string;
  }>;
  
  analyticsText?: string;
  
  rawData?: Array<Record<string, any>>;
  rawDataColumns?: Array<{
    key: string;
    label: string;
    format?: 'number' | 'currency' | 'percentage' | 'text';
  }>;
  
  onExport?: () => void;
}

const borderColorMap = {
  emerald: 'border-l-emerald-500',
  blue: 'border-l-blue-500',
  purple: 'border-l-purple-500',
  rose: 'border-l-rose-500',
  amber: 'border-l-amber-500',
  sky: 'border-l-sky-500',
  indigo: 'border-l-indigo-500',
  pink: 'border-l-pink-500',
};

const badgeColorMap = {
  emerald: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  rose: 'bg-rose-100 text-rose-800',
  amber: 'bg-amber-100 text-amber-800',
  sky: 'bg-sky-100 text-sky-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  pink: 'bg-pink-100 text-pink-800',
};

export const ExecutiveDrillDownModal: React.FC<ExecutiveDrillDownModalProps> = ({
  open,
  onOpenChange,
  title,
  metric,
  currentValue,
  previousValue,
  description,
  borderColor = 'emerald',
  breakdownData,
  analyticsText,
  rawData,
  rawDataColumns,
  onExport,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className={cn('border-l-4 pb-4 pt-6 px-6 flex-shrink-0', borderColorMap[borderColor])}>
          <div className="flex items-start justify-between gap-4 pl-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold text-slate-900">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-slate-600 mt-1">{description}</DialogDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-6 pt-2">
          {/* Metric Header */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-slate-200">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide mb-1">
                  {metric}
                </p>
                <p className="text-2xl font-bold text-slate-900">{currentValue}</p>
                {previousValue && (
                  <p className="text-xs text-slate-500 mt-2">
                    Previous: <span className="font-semibold">{previousValue}</span>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Trend Badge */}
            <Card className={cn('border-l-4', borderColorMap[borderColor])}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">
                      Trend
                    </p>
                    <Badge className={cn('mt-1', badgeColorMap[borderColor])}>
                      View Details
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export */}
            {onExport && (
              <Card className="border-l-4 border-l-slate-200">
                <CardContent className="pt-6">
                  <Button
                    onClick={onExport}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Breakdown Data */}
          {breakdownData && breakdownData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {breakdownData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">{item.label}</p>
                        {item.percentage !== undefined && (
                          <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                item.color || `bg-${borderColor}-500`
                              )}
                              style={{ width: `${Math.min(item.percentage, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                        {item.percentage !== undefined && (
                          <p className="text-xs text-slate-500">{item.percentage.toFixed(1)}%</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analytics Text */}
          {analyticsText && (
            <Card className={cn('border-l-4', borderColorMap[borderColor])}>
              <CardHeader>
                <CardTitle className="text-base">Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 leading-relaxed">{analyticsText}</p>
              </CardContent>
            </Card>
          )}

          {/* Raw Data Table */}
          {rawData && rawData.length > 0 && rawDataColumns && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detailed Records ({rawData.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-100 border-b-2 border-slate-300">
                        {rawDataColumns.map((col) => (
                          <th
                            key={col.key}
                            className="px-4 py-3 text-left font-semibold text-slate-700 text-xs uppercase tracking-wide whitespace-nowrap"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawData.slice(0, 50).map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          {rawDataColumns.map((col) => {
                            const value = row[col.key];
                            let displayValue = String(value || '');

                            if (col.format === 'currency') {
                              const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                              displayValue = `₹${numValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                            } else if (col.format === 'percentage') {
                              displayValue = `${typeof value === 'number' ? value.toFixed(1) : value}%`;
                            } else if (col.format === 'number') {
                              displayValue = typeof value === 'number' ? value.toLocaleString('en-IN') : value;
                            }

                            return (
                              <td key={col.key} className="px-4 py-3 text-slate-700 text-xs whitespace-nowrap">
                                <span className={col.format === 'currency' || col.format === 'number' ? 'font-mono' : ''}>
                                  {displayValue}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rawData.length > 50 && (
                  <p className="text-xs text-slate-500 mt-3 text-center px-4 pb-3">
                    Showing 50 of {rawData.length} records
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
