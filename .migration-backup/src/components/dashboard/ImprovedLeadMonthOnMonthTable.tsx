
import React, { useMemo, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Calendar, Users, Target, AlertCircle } from 'lucide-react';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useRegisterTableForCopy } from '@/hooks/useRegisterTableForCopy';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { useTableCopyContext } from '@/hooks/useTableCopyContext';

interface MonthData {
  totalLeads: number;
  trialsCompleted: number;
  converted: number;
  lost: number;
  revenue: number;
  leadToTrialConversion: number;
  trialToMemberConversion: number;
  lostRate: number;
}

interface ImprovedLeadMonthOnMonthTableProps {
  data: any[];
  title?: string;
}

export const ImprovedLeadMonthOnMonthTable: React.FC<ImprovedLeadMonthOnMonthTableProps> = ({ 
  data, 
  title = "Month-on-Month Lead Analysis" 
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { getAllTabsText } = useRegisterTableForCopy(tableContainerRef as any, title);
  
  // Get context information for enhanced table copying
  const copyContext = useTableCopyContext();
  
  const monthOnMonthData = useMemo(() => {
    if (!data || data.length === 0) return { monthData: {}, months: [] };

    const monthMap = new Map<string, MonthData>();

    data.forEach(lead => {
      if (!lead.createdAt) return;
      
      const date = new Date(lead.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          totalLeads: 0,
          trialsCompleted: 0,
          converted: 0,
          lost: 0,
          revenue: 0,
          leadToTrialConversion: 0,
          trialToMemberConversion: 0,
          lostRate: 0
        });
      }

      const monthData = monthMap.get(monthKey)!;
      monthData.totalLeads += 1;
      
      if (lead.stage === 'Trial Completed') {
        monthData.trialsCompleted += 1;
      }
      
      if (lead.conversionStatus === 'Converted') {
        monthData.converted += 1;
      }
      
      if (lead.conversionStatus === 'Lost' || lead.stage === 'Lost') {
        monthData.lost += 1;
      }
      
      monthData.revenue += (lead.ltv || 0);
    });

    // Calculate conversion rates
    monthMap.forEach((monthData, monthKey) => {
      monthData.leadToTrialConversion = monthData.totalLeads > 0 
        ? (monthData.trialsCompleted / monthData.totalLeads) * 100 
        : 0;
      monthData.trialToMemberConversion = monthData.trialsCompleted > 0 
        ? (monthData.converted / monthData.trialsCompleted) * 100 
        : 0;
      monthData.lostRate = monthData.totalLeads > 0 
        ? (monthData.lost / monthData.totalLeads) * 100 
        : 0;
    });

    const monthData = Object.fromEntries(monthMap);
    const months = Array.from(monthMap.keys()).sort();

    return { monthData, months };
  }, [data]);

  const toggleRowExpansion = (month: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedRows(newExpanded);
  };

  const getMonthlyLeadsForDrilldown = (month: string) => {
    return data.filter(lead => {
      if (!lead.createdAt) return false;
      const date = new Date(lead.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === month;
    });
  };

  const formatMonthDisplay = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  };

  const getChangeIndicator = (current: number, previous: number) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        {Math.abs(change).toFixed(1)}%
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No data available for month-on-month analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {title}
            </CardTitle>
            <CopyTableButton 
              tableRef={tableContainerRef as any}
              tableName={title}
              size="sm"
              className="text-white hover:bg-white/20"
              onCopyAllTabs={async () => getAllTabsText()}
              contextInfo={{
                selectedMetric: 'leadAnalysis',
                dateRange: copyContext.dateRange,
                filters: copyContext.filters,
                additionalInfo: {
                  expandedRows: Array.from(expandedRows),
                  analysisType: 'month-on-month',
                  totalMonths: monthOnMonthData.months.length
                }
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0" ref={tableContainerRef as any}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold text-slate-700">Month</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Total Leads</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Trials Completed</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Converted</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Lost</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Revenue</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Lead to Trial %</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Trial to Member %</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Lost Rate %</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthOnMonthData.months.map((month, index) => {
                  const monthData = monthOnMonthData.monthData[month];
                  const previousMonth = index > 0 ? monthOnMonthData.monthData[monthOnMonthData.months[index - 1]] : null;
                  const isExpanded = expandedRows.has(month);
                  const monthlyLeads = getMonthlyLeadsForDrilldown(month);

                  return (
                    <React.Fragment key={month}>
                      <TableRow className="hover:bg-slate-50 border-b border-slate-200">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(month)}
                              className="p-1"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                            {formatMonthDisplay(month)}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex flex-col items-center">
                                <span className="font-bold">{formatNumber(monthData.totalLeads)}</span>
                                {previousMonth && getChangeIndicator(monthData.totalLeads, previousMonth.totalLeads)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Total leads generated in {formatMonthDisplay(month)}</TooltipContent>
                          </Tooltip>
                        </TableCell>

                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex flex-col items-center">
                                <span className="font-bold">{formatNumber(monthData.trialsCompleted)}</span>
                                {previousMonth && getChangeIndicator(monthData.trialsCompleted, previousMonth.trialsCompleted)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Number of completed trials in {formatMonthDisplay(month)}</TooltipContent>
                          </Tooltip>
                        </TableCell>

                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-green-600">{formatNumber(monthData.converted)}</span>
                                {previousMonth && getChangeIndicator(monthData.converted, previousMonth.converted)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Successful conversions to membership in {formatMonthDisplay(month)}</TooltipContent>
                          </Tooltip>
                        </TableCell>

                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-red-600">{formatNumber(monthData.lost)}</span>
                                {previousMonth && getChangeIndicator(monthData.lost, previousMonth.lost)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Lost leads in {formatMonthDisplay(month)}</TooltipContent>
                          </Tooltip>
                        </TableCell>

                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-purple-600">{formatCurrency(monthData.revenue)}</span>
                                {previousMonth && getChangeIndicator(monthData.revenue, previousMonth.revenue)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Total revenue generated in {formatMonthDisplay(month)}</TooltipContent>
                          </Tooltip>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {formatPercentage(monthData.leadToTrialConversion)}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {formatPercentage(monthData.trialToMemberConversion)}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            {formatPercentage(monthData.lostRate)}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRowExpansion(month)}
                            className="text-xs"
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row Details */}
                      {isExpanded && (
                        <TableRow className="bg-slate-50">
                          <TableCell colSpan={10} className="p-6">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Detailed Breakdown for {formatMonthDisplay(month)}
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-lg border">
                                  <h5 className="font-medium text-slate-700 mb-2">Performance Metrics</h5>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span>Total Leads:</span>
                                      <span className="font-bold">{formatNumber(monthData.totalLeads)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Average LTV:</span>
                                      <span className="font-bold">{formatCurrency(monthData.revenue / (monthData.totalLeads || 1))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Success Rate:</span>
                                      <span className="font-bold text-green-600">
                                        {formatPercentage(monthData.totalLeads > 0 ? (monthData.converted / monthData.totalLeads) * 100 : 0)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white p-4 rounded-lg border">
                                  <h5 className="font-medium text-slate-700 mb-2">Lead Sources</h5>
                                  <div className="space-y-1 text-sm">
                                    {(() => {
                                      const sources: Record<string, number> = {};
                                      monthlyLeads.forEach(lead => {
                                        const source = lead.source || 'Unknown';
                                        sources[source] = (sources[source] || 0) + 1;
                                      });
                                      return Object.entries(sources).slice(0, 3).map(([source, count]) => (
                                        <div key={source} className="flex justify-between">
                                          <span>{source}:</span>
                                          <span className="font-bold">{count as number}</span>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </div>

                                <div className="bg-white p-4 rounded-lg border">
                                  <h5 className="font-medium text-slate-700 mb-2">Top Stages</h5>
                                  <div className="space-y-1 text-sm">
                                    {(() => {
                                      const stages: Record<string, number> = {};
                                      monthlyLeads.forEach(lead => {
                                        const stage = lead.stage || 'Unknown';
                                        stages[stage] = (stages[stage] || 0) + 1;
                                      });
                                      return Object.entries(stages).slice(0, 3).map(([stage, count]) => (
                                        <div key={stage} className="flex justify-between">
                                          <span>{stage}:</span>
                                          <span className="font-bold">{count as number}</span>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {/* Summary Footer */}
          <div className="bg-white border-t p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(Object.values(monthOnMonthData.monthData).reduce((sum, month) => sum + month.totalLeads, 0))}
                </div>
                <div className="text-sm text-slate-600">Total Leads</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(Object.values(monthOnMonthData.monthData).reduce((sum, month) => sum + month.converted, 0))}
                </div>
                <div className="text-sm text-slate-600">Total Converted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(Object.values(monthOnMonthData.monthData).reduce((sum, month) => sum + month.revenue, 0))}
                </div>
                <div className="text-sm text-slate-600">Total Revenue</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">
                  {(() => {
                    const totalLeads = Object.values(monthOnMonthData.monthData).reduce((sum, month) => sum + month.totalLeads, 0);
                    const totalConverted = Object.values(monthOnMonthData.monthData).reduce((sum, month) => sum + month.converted, 0);
                    return formatPercentage(totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0);
                  })()}
                </div>
                <div className="text-sm text-slate-600">Overall Conversion</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
