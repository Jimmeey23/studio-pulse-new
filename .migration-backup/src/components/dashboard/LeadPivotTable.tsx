import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Grid3X3, Filter, Eye, Edit3, Save, X } from 'lucide-react';
import { LeadMetricTabs } from './LeadMetricTabs';
import { LeadsMetricType } from '@/types/leads';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
interface LeadPivotTableProps {
  data: Record<string, Record<string, number>>;
  rowLabels: string[];
  columnLabels: string[];
  activeMetric: LeadsMetricType;
  onMetricChange: (metric: LeadsMetricType) => void;
}
export const LeadPivotTable: React.FC<LeadPivotTableProps> = ({
  data,
  rowLabels,
  columnLabels,
  activeMetric,
  onMetricChange
}) => {
  const { filters } = useGlobalFilters();
  const periodId = `${filters.dateRange.start}:${filters.dateRange.end}`;
  const [sortField, setSortField] = useState<string>('row');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [quickFilter, setQuickFilter] = useState<'all' | 'top' | 'bottom'>('all');
  const [isEditingInsights, setIsEditingInsights] = useState(false);
  const [insights, setInsights] = useState({
    topPerformer: "Google Ads x Trial Completed shows highest conversion at 34%",
    opportunity: "Social Media x New Lead has potential for 40% improvement",
    trend: "Direct Traffic leads show consistent performance across all stages",
    optimization: "Email campaigns need stage-specific optimization strategies"
  });
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Calculate totals for each row
  const rowWithTotals = rowLabels.map(row => {
    const total = columnLabels.reduce((sum, col) => {
      return sum + (data[row]?.[col] || 0);
    }, 0);
    return {
      row,
      total
    };
  });
  const filteredRows = rowWithTotals.filter(({
    row,
    total
  }) => {
    if (quickFilter === 'top') return total > 0;
    if (quickFilter === 'bottom') return total === 0;
    return true;
  }).sort((a, b) => {
    if (sortField === 'row') {
      return sortDirection === 'asc' ? a.row.localeCompare(b.row) : b.row.localeCompare(a.row);
    }
    const aValue = columnLabels.reduce((sum, col) => sum + (data[a.row]?.[col] || 0), 0);
    const bValue = columnLabels.reduce((sum, col) => sum + (data[b.row]?.[col] || 0), 0);
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  }).map(({
    row
  }) => row);
  const formatValue = (value: number) => {
    if (activeMetric === 'ltv') return formatCurrency(value);
    if (activeMetric.includes('Conversion')) return `${value.toFixed(1)}%`;
    return formatNumber(value);
  };

  // Calculate column totals
  const columnTotals = columnLabels.map(col => {
    const total = rowLabels.reduce((sum, row) => {
      return sum + (data[row]?.[col] || 0);
    }, 0);
    return {
      column: col,
      total
    };
  });
  const SortIcon = ({
    field
  }: {
    field: string;
  }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };
  const quickFilters = [{
    value: 'all',
    label: 'All Rows',
    count: rowLabels.length
  }, {
    value: 'top',
    label: 'Active Rows',
    count: rowWithTotals.filter(r => r.total > 0).length
  }, {
    value: 'bottom',
    label: 'Inactive Rows',
    count: rowWithTotals.filter(r => r.total === 0).length
  }];
  const handleRowClick = (row: string) => {
    logger.debug('Drill-down data for row:', row, data[row]);
  };
  const handleSaveInsights = () => {
    setIsEditingInsights(false);
    logger.debug('Insights saved:', insights);
  };
  return <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-blue-600" />
            Source vs Stage Performance Matrix
          </CardTitle>
          <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">
            {filteredRows.length} x {columnLabels.length} Matrix
          </Badge>
        </div>
        
        <LeadMetricTabs value={activeMetric} onValueChange={onMetricChange} className="w-full" />

        {/* Quick Filter Buttons */}
        <div className="flex gap-2">
          {quickFilters.map(filter => <Button key={filter.value} variant={quickFilter === filter.value ? "default" : "outline"} size="sm" onClick={() => setQuickFilter(filter.value as any)} className={`gap-2 text-xs ${quickFilter === filter.value ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'text-gray-600 hover:bg-blue-50'}`}>
              <Filter className="w-3 h-3" />
              {filter.label}
              <Badge variant="outline" className="ml-1 text-xs text-gray-800 hover:text-white active:text-white transition-colors bg-slate-950">
                {filter.count}
              </Badge>
            </Button>)}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-20">
              <TableRow className="bg-gradient-to-r from-slate-800 via-slate-900 to-black text-white hover:bg-gradient-to-r hover:from-slate-800 hover:to-black">
                <TableHead className="cursor-pointer hover:bg-slate-700 transition-colors font-bold text-white sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-30 min-w-[200px] w-[200px] max-w-[200px] p-4" onClick={() => handleSort('row')}>
                  <div className="flex items-center gap-2 text-sm">
                    Source / Stage <SortIcon field="row" />
                  </div>
                </TableHead>
                {columnLabels.map(col => <TableHead key={col} className="cursor-pointer hover:bg-slate-700 transition-colors text-center font-bold text-white min-w-[120px] w-[120px] p-3" onClick={() => handleSort(col)}>
                    <div className="flex items-center justify-center gap-1 text-xs whitespace-nowrap">
                      {col} <SortIcon field={col} />
                    </div>
                  </TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {filteredRows.map(row => <TableRow key={row} className="hover:bg-blue-50/50 transition-colors cursor-pointer border-b border-gray-200" onClick={() => handleRowClick(row)}>
                  <TableCell className="font-medium text-gray-800 sticky left-0 bg-white z-10 border-r border-gray-200 min-w-[200px] w-[200px] max-w-[200px] p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></div>
                      <span>{row || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  {columnLabels.map(col => {
                const value = data[row]?.[col] || 0;
                return <TableCell key={col} className="text-center align-middle font-mono min-w-[120px] w-[120px] p-3 text-gray-800">
                        <span className="font-semibold text-sm">
                          {formatValue(value)}
                        </span>
                      </TableCell>;
              })}
                </TableRow>)}
            </TableBody>
            <TableFooter className="sticky bottom-0 z-20">
              <TableRow className="bg-black text-white border-t-4 border-slate-600">
                <TableCell className="font-bold text-white sticky left-0 bg-black z-30 min-w-[200px] w-[200px] max-w-[200px] p-4">
                  <span className="text-lg font-bold">TOTALS</span>
                </TableCell>
                {columnTotals.map(colTotal => <TableCell key={colTotal.column} className="text-center align-middle font-bold text-white min-w-[120px] w-[120px] p-3">
                    <span className="text-base">{formatValue(colTotal.total)}</span>
                  </TableCell>)}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        
        {filteredRows.length === 0 && <div className="text-center py-12 text-gray-500">
            <Grid3X3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-medium">No pivot data available</p>
            <p className="text-sm">Try adjusting your filters or data range</p>
          </div>}

        {/* Editable Summary and Insights Section */}
        <div className="bg-muted/30 rounded-lg p-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Key Matrix Performance Insights
            </h3>
            <Button variant="outline" size="sm" onClick={() => isEditingInsights ? handleSaveInsights() : setIsEditingInsights(true)} className="gap-2">
              {isEditingInsights ? <>
                  <Save className="w-4 h-4" />
                  Save
                </> : <>
                  <Edit3 className="w-4 h-4" />
                  Edit
                </>}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(insights).map(([key, value], index) => {
            const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500'];
            return <div key={key} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full ${colors[index]} mt-2 flex-shrink-0`}></div>
                  <div className="flex-1">
                    {isEditingInsights ? <textarea value={value} onChange={e => setInsights(prev => ({
                  ...prev,
                  [key]: e.target.value
                }))} className="w-full text-xs border rounded p-2 resize-none" rows={2} /> : <>
                        <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-xs text-muted-foreground">{value}</p>
                      </>}
                  </div>
                </div>;
          })}
          </div>
          
          {isEditingInsights && <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={() => setIsEditingInsights(false)} className="gap-2 mr-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>}
        </div>
      </CardContent>

      <div className="p-4 border-t">
      </div>
    </Card>;
};