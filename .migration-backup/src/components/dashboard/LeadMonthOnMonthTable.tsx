import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, BarChart3, Filter, Eye, Edit3, Save, X } from 'lucide-react';
import { LeadMetricTabs } from './LeadMetricTabs';
import { LeadsMetricType } from '@/types/leads';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { generateStandardMonthRange } from '@/utils/dateUtils';

interface LeadMonthOnMonthTableProps {
  data: Record<string, Record<string, number>>;
  months: string[];
  stages: string[];
  activeMetric: LeadsMetricType;
  onMetricChange: (metric: LeadsMetricType) => void;
}

export const LeadMonthOnMonthTable: React.FC<LeadMonthOnMonthTableProps> = ({
  data,
  months,
  stages,
  activeMetric,
  onMetricChange
}) => {
  const [sortField, setSortField] = useState<string>('stage');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [quickFilter, setQuickFilter] = useState<'all' | 'top' | 'bottom'>('all');
  const [isEditingInsights, setIsEditingInsights] = useState(false);
  const [insights, setInsights] = useState({
    conversion: "42.3% of leads converted to customers across all stages",
    avgLtv: "$4,250 average LTV per lead with steady month-over-month growth",
    engagement: "3.2 visits per lead average showing strong interest levels", 
    pipeline: "$2.8M total pipeline value across all active stages"
  });

  // Use standard 22-month range (October 2025 to January 2024)
  const formattedMonths = generateStandardMonthRange().map(month => ({
    original: month.key,
    formatted: month.display,
    sortKey: month.sortOrder
  }));

  // Calculate totals for each month
  const monthlyTotals = formattedMonths.map(month => {
    const total = stages.reduce((sum, stage) => {
      return sum + (data[stage]?.[month.original] || 0);
    }, 0);
    return {
      month: month.formatted,
      total
    };
  });

  // Sort stages based on the current sort field and direction
  const stageWithTotals = stages.map(stage => {
    const total = formattedMonths.reduce((sum, month) => {
      return sum + (data[stage]?.[month.original] || 0);
    }, 0);
    return { stage, total };
  });

  const filteredStages = stageWithTotals.filter(({ stage, total }) => {
    if (quickFilter === 'top') return total > 0;
    if (quickFilter === 'bottom') return total === 0;
    return true;
  }).sort((a, b) => {
    if (sortField === 'stage') {
      return sortDirection === 'asc' ? a.stage.localeCompare(b.stage) : b.stage.localeCompare(a.stage);
    }
    const aValue = data[a.stage]?.[sortField] || 0;
    const bValue = data[b.stage]?.[sortField] || 0;
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  }).map(({ stage }) => stage);

  const formatValue = (value: number) => {
    if (activeMetric === 'ltv') return formatCurrency(value);
    if (activeMetric.includes('Conversion')) return `${value.toFixed(1)}%`;
    return formatNumber(value);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const quickFilters = [
    { value: 'all', label: 'All Stages', count: stages.length },
    { value: 'top', label: 'Active Stages', count: stageWithTotals.filter(s => s.total > 0).length },
    { value: 'bottom', label: 'Inactive Stages', count: stageWithTotals.filter(s => s.total === 0).length }
  ];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (stage: string) => {
  };

  const handleSaveInsights = () => {
    setIsEditingInsights(false);
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Stage Performance - Month on Month
          </CardTitle>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            {filteredStages.length} Active Stages
          </Badge>
        </div>
        
        <LeadMetricTabs value={activeMetric} onValueChange={onMetricChange} className="w-full" />

        {/* Quick Filter Buttons */}
        <div className="flex gap-2">
          {quickFilters.map(filter => (
            <Button
              key={filter.value}
              variant={quickFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter(filter.value as any)}
              className={`gap-2 text-xs ${
                quickFilter === filter.value 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              <Filter className="w-3 h-3" />
              {filter.label}
              <Badge variant="outline" className="ml-1 text-xs">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-20">
              <TableRow className="bg-gradient-to-r from-slate-800 via-slate-900 to-black text-white hover:bg-gradient-to-r hover:from-slate-800 hover:to-black">
                <TableHead 
                  className="cursor-pointer hover:bg-slate-700 transition-colors font-bold text-white sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-30 min-w-[250px] w-[250px] max-w-[250px] p-4"
                  onClick={() => handleSort('stage')}
                >
                  <div className="flex items-center gap-2 text-sm">
                    Stage <SortIcon field="stage" />
                  </div>
                </TableHead>
                {formattedMonths.map(month => (
                  <TableHead 
                    key={month.original}
                    className="cursor-pointer hover:bg-slate-700 transition-colors text-center font-bold text-white min-w-[100px] w-[100px] p-3"
                    onClick={() => handleSort(month.original)}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs whitespace-nowrap">
                      {month.formatted} <SortIcon field={month.original} />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {filteredStages.map((stage) => (
                <TableRow 
                  key={stage} 
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer border-b border-gray-200"
                  onClick={() => handleRowClick(stage)}
                >
                  <TableCell className="font-medium text-gray-800 sticky left-0 bg-white z-10 border-r border-gray-200 min-w-[250px] w-[250px] max-w-[250px] p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></div>
                      <span>{stage || 'Unknown Stage'}</span>
                    </div>
                  </TableCell>
                  {formattedMonths.map((month) => {
                    const value = data[stage]?.[month.original] || 0;
                    return (
                      <TableCell 
                        key={month.original} 
                        className="text-center align-middle font-mono min-w-[100px] w-[100px] p-3 text-gray-800"
                      >
                        <span className="font-semibold text-sm">
                          {formatValue(value)}
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="sticky bottom-0 z-20">
              <TableRow className="bg-black text-white border-t-4 border-slate-600">
                <TableCell className="font-bold text-white sticky left-0 bg-black z-30 min-w-[250px] w-[250px] max-w-[250px] p-4">
                  <span className="text-lg font-bold">TOTALS</span>
                </TableCell>
                {monthlyTotals.map(monthTotal => (
                  <TableCell 
                    key={monthTotal.month} 
                    className="text-center align-middle font-bold text-white min-w-[100px] w-[100px] p-3"
                  >
                    <span className="text-base">{formatValue(monthTotal.total)}</span>
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        
        {filteredStages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No stage data available for the selected filters</p>
          </div>
        )}

        {/* Editable Summary and Insights Section */}
        <div className="bg-muted/30 rounded-lg p-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Key Stage Performance Insights
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => isEditingInsights ? handleSaveInsights() : setIsEditingInsights(true)}
              className="gap-2"
            >
              {isEditingInsights ? (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Edit
                </>
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(insights).map(([key, value], index) => {
              const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500'];
              return (
                <div key={key} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full ${colors[index]} mt-2 flex-shrink-0`}></div>
                  <div className="flex-1">
                    {isEditingInsights ? (
                      <textarea
                        value={value}
                        onChange={(e) => setInsights(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full text-xs border rounded p-2 resize-none"
                        rows={2}
                      />
                    ) : (
                      <>
                        <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-xs text-muted-foreground">{value}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {isEditingInsights && (
            <div className="flex justify-end mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingInsights(false)}
                className="gap-2 mr-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
