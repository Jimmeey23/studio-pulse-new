"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Calendar,
  Building2,
  MapPin,
  Package,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface LeadDataTableProps {
  title: string;
  data: LeadsData[];
}

// Custom hook for expandable functionality
function useExpandable(initialState = false) {
  const [isExpanded, setIsExpanded] = useState(initialState);
  const springConfig = { stiffness: 300, damping: 30 };
  const animatedHeight = useSpring(0, springConfig);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return { isExpanded, toggleExpand, animatedHeight };
}

// Animated Number Component
interface AnimatedNumberProps {
  value: number;
  className?: string;
  springOptions?: any;
}

function AnimatedNumber({ value, className, springOptions }: AnimatedNumberProps) {
  const spring = useSpring(value, springOptions);
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={cn('tabular-nums', className)}>
      {display}
    </motion.span>
  );
}

// Expandable Row Component
interface ExpandableRowProps {
  data: LeadsData;
  isSticky?: boolean;
}

function ExpandableRow({ data, isSticky = false }: ExpandableRowProps) {
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      animatedHeight.set(isExpanded ? contentRef.current.offsetHeight : 0);
    }
  }, [isExpanded, animatedHeight]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Converted': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Lost': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLTVIcon = (ltv: number) => {
    return ltv > 50000 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-orange-600" />
    );
  };

  return (
    <>
      <TableRow 
        className="hover:bg-muted/30 transition-all duration-200 cursor-pointer group"
        onClick={toggleExpand}
      >
        <TableCell className={cn("font-medium sticky left-0 bg-white z-10 border-r", isSticky && "shadow-sm")}>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </Button>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="truncate">{data.fullName}</span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{data.source}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            {data.stage}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {getLTVIcon(data.ltv)}
            <AnimatedNumber 
              value={data.ltv} 
              className="font-mono font-semibold"
              springOptions={{ bounce: 0, duration: 1000 }}
            />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <AnimatedNumber 
              value={data.visits || 0} 
              className="font-mono"
              springOptions={{ bounce: 0, duration: 1000 }}
            />
          </div>
        </TableCell>
        <TableCell>
          <Badge className={cn("border", getStatusColor(data.conversionStatus))}>
            {data.conversionStatus}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            {data.associate}
          </div>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>
      
      <TableRow>
        <TableCell colSpan={9} className="p-0 border-0">
          <motion.div 
            style={{ height: animatedHeight }}
            className="overflow-hidden"
          >
            <div ref={contentRef} className="bg-muted/20 border-l-4 border-blue-500">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Lead Details */}
                  <div className="lg:col-span-2">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Lead Details & Follow-ups
                    </h4>
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-sm">{data.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="text-sm">{data.phone}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Center</label>
                            <p className="text-sm">{data.center}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Class Type</label>
                            <p className="text-sm">{data.classType}</p>
                          </div>
                        </div>
                        
                        {data.remarks && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                            <p className="text-sm bg-muted/50 p-2 rounded">{data.remarks}</p>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <h5 className="font-medium">Follow-up History</h5>
                          {[
                            { date: data.followUp1Date, comments: data.followUpComments1 },
                            { date: data.followUp2Date, comments: data.followUpComments2 },
                            { date: data.followUp3Date, comments: data.followUpComments3 },
                            { date: data.followUp4Date, comments: data.followUpComments4 }
                          ].filter(f => f.date).map((followUp, index) => (
                            <div key={index} className="bg-muted/30 p-2 rounded text-sm">
                              <div className="font-medium">{followUp.date}</div>
                              <div className="text-muted-foreground">{followUp.comments}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <PieChart className="w-4 h-4" />
                      Quick Stats
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">LTV Value</span>
                          <DollarSign className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-lg font-semibold mt-1">
                          {formatCurrency(data.ltv)}
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Visits</span>
                          <Activity className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-lg font-semibold mt-1">
                          {data.visits || 0}
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Trial Status</span>
                          <Target className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="text-lg font-semibold mt-1">
                          {data.trialStatus}
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Purchases</span>
                          <Package className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="text-lg font-semibold mt-1">
                          {data.purchasesMade || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </TableCell>
      </TableRow>
    </>
  );
}

export const LeadDataTable: React.FC<LeadDataTableProps> = ({ title, data }) => {
  const totals = {
    totalLeads: data.length,
    totalLTV: data.reduce((sum, item) => sum + (item.ltv || 0), 0),
    avgLTV: data.length > 0 ? data.reduce((sum, item) => sum + (item.ltv || 0), 0) / data.length : 0,
    converted: data.filter(item => item.conversionStatus === 'Converted').length,
    totalVisits: data.reduce((sum, item) => sum + (item.visits || 0), 0)
  };

  return (
    <Card className="bg-white shadow-xl border-0 overflow-hidden rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-xl font-bold">
            <BarChart3 className="w-6 h-6 text-white" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1 bg-white/20 border-white/30 text-white">
              <Eye className="w-3 h-3" />
              Live Data
            </Badge>
            <Badge variant="secondary" className="text-slate-600 border-white bg-white/90">
              {data.length} Leads
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-auto max-h-[700px]">
          <Table className="w-full">
            <TableHeader className="sticky top-0 z-20 bg-background border-b-2 border-border">
              <TableRow className="hover:bg-transparent bg-gradient-to-r from-slate-800 via-slate-900 to-black text-white">
                <TableHead className="sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-30 border-r font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Lead Name
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Source
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Stage
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    LTV
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Visits
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-white">Status</TableHead>
                <TableHead className="font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Associate
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {data.slice(0, 50).map((item) => (
                <ExpandableRow key={item.id} data={item} isSticky />
              ))}
            </TableBody>
            <TableFooter className="sticky bottom-0 z-20 bg-slate-800 backdrop-blur-sm border-t-2 border-slate-600">
              <TableRow className="hover:bg-transparent">
                <TableCell className="sticky left-0 bg-slate-800 z-30 border-r border-slate-600 font-bold text-white">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    TOTALS
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-white">{new Set(data.map(d => d.source)).size} Sources</TableCell>
                <TableCell className="font-semibold text-white">{new Set(data.map(d => d.stage)).size} Stages</TableCell>
                <TableCell className="font-bold text-white">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <AnimatedNumber 
                      value={totals.totalLTV} 
                      className="font-mono text-emerald-400"
                      springOptions={{ bounce: 0, duration: 1500 }}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-bold text-white">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <AnimatedNumber 
                      value={totals.totalVisits} 
                      className="font-mono text-blue-400"
                      springOptions={{ bounce: 0, duration: 1500 }}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-bold text-white">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400">
                      {totals.converted}/{totals.totalLeads} Converted
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-white">-</TableCell>
                <TableCell className="font-semibold text-white">{new Set(data.map(d => d.associate)).size} Associates</TableCell>
                <TableCell className="text-white">-</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Summary Points */}
        <div className="bg-muted/30 rounded-lg p-6 border-t">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Key Lead Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium">Conversion Rate</p>
                <p className="text-xs text-muted-foreground">
                  {((totals.converted / totals.totalLeads) * 100).toFixed(1)}% of leads converted to customers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium">Average LTV</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(totals.avgLTV)} per lead on average
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium">Engagement</p>
                <p className="text-xs text-muted-foreground">
                  {(totals.totalVisits / totals.totalLeads).toFixed(1)} visits per lead average
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium">Total Pipeline Value</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(totals.totalLTV)} total LTV across all leads
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
