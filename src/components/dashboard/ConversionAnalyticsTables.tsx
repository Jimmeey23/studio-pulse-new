
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Users, MapPin, Calendar, User, ChevronRight } from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';

interface ConversionAnalyticsTablesProps {
  data: NewClientData[];
  onItemClick?: (item: any) => void;
}

export const ConversionAnalyticsTables: React.FC<ConversionAnalyticsTablesProps> = ({
  data,
  onItemClick
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [sortBy, setSortBy] = useState<'conversions' | 'ltv' | 'retention'>('conversions');

  // Lead source analysis with enhanced metrics
  const sourceStats = data.reduce((acc, client) => {
    const source = client.firstVisitEntityName || 'Unknown';
    if (!acc[source]) {
      acc[source] = {
        source,
        leads: 0,
        trials: 0,
        trialsCompleted: 0,
        conversions: 0,
        retained: 0,
        totalLTV: 0,
        totalConversionSpan: 0,
        totalPostTrialClasses: 0,
        conversionRate: 0,
        retentionRate: 0,
        leadToTrialRate: 0,
        trialToMemberRate: 0,
        avgLTV: 0,
        avgConversionSpan: 0,
        avgPostTrialClasses: 0
      };
    }
    
    acc[source].leads++;
    if (client.visitsPostTrial > 0) {
      acc[source].trials++;
      acc[source].trialsCompleted++;
    }
    if (client.conversionStatus === 'Converted') acc[source].conversions++;
    if (client.retentionStatus === 'Retained') acc[source].retained++;
    acc[source].totalLTV += client.ltv || 0;
    acc[source].totalConversionSpan += client.conversionSpan || 0;
    acc[source].totalPostTrialClasses += client.visitsPostTrial || 0;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate enhanced rates for sources
  Object.values(sourceStats).forEach((stats: any) => {
    stats.conversionRate = stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0;
    stats.retentionRate = stats.leads > 0 ? (stats.retained / stats.leads) * 100 : 0;
    stats.leadToTrialRate = stats.leads > 0 ? (stats.trialsCompleted / stats.leads) * 100 : 0;
    stats.trialToMemberRate = stats.trialsCompleted > 0 ? (stats.conversions / stats.trialsCompleted) * 100 : 0;
    stats.avgLTV = stats.leads > 0 ? stats.totalLTV / stats.leads : 0;
    stats.avgConversionSpan = stats.conversions > 0 ? stats.totalConversionSpan / stats.conversions : 0;
    stats.avgPostTrialClasses = stats.trialsCompleted > 0 ? stats.totalPostTrialClasses / stats.trialsCompleted : 0;
  });

  const sourceList = Object.values(sourceStats) as any[];

  // Lead stage analysis with enhanced metrics
  const stageStats = data.reduce((acc, client) => {
    const stage = client.firstVisitType || 'Unknown';
    if (!acc[stage]) {
      acc[stage] = {
        stage,
        leads: 0,
        trialsCompleted: 0,
        conversions: 0,
        retained: 0,
        totalLTV: 0,
        totalConversionSpan: 0,
        totalPostTrialClasses: 0,
        conversionRate: 0,
        retentionRate: 0,
        leadToTrialRate: 0,
        trialToMemberRate: 0,
        avgConversionSpan: 0,
        avgPostTrialClasses: 0
      };
    }
    
    acc[stage].leads++;
    if (client.visitsPostTrial > 0) acc[stage].trialsCompleted++;
    if (client.conversionStatus === 'Converted') acc[stage].conversions++;
    if (client.retentionStatus === 'Retained') acc[stage].retained++;
    acc[stage].totalLTV += client.ltv || 0;
    acc[stage].totalConversionSpan += client.conversionSpan || 0;
    acc[stage].totalPostTrialClasses += client.visitsPostTrial || 0;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate enhanced rates for stages
  Object.values(stageStats).forEach((stats: any) => {
    stats.conversionRate = stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0;
    stats.retentionRate = stats.leads > 0 ? (stats.retained / stats.leads) * 100 : 0;
    stats.leadToTrialRate = stats.leads > 0 ? (stats.trialsCompleted / stats.leads) * 100 : 0;
    stats.trialToMemberRate = stats.trialsCompleted > 0 ? (stats.conversions / stats.trialsCompleted) * 100 : 0;
    stats.avgConversionSpan = stats.conversions > 0 ? stats.totalConversionSpan / stats.conversions : 0;
    stats.avgPostTrialClasses = stats.trialsCompleted > 0 ? stats.totalPostTrialClasses / stats.trialsCompleted : 0;
  });

  const stageList = Object.values(stageStats) as any[];

  // Associate performance with enhanced metrics
  const associateStats = data.reduce((acc, client) => {
    const associate = client.trainerName || 'Unknown';
    if (!acc[associate]) {
      acc[associate] = {
        associate,
        leads: 0,
        trialsCompleted: 0,
        conversions: 0,
        retained: 0,
        totalLTV: 0,
        totalConversionSpan: 0,
        totalPostTrialClasses: 0,
        conversionRate: 0,
        retentionRate: 0,
        leadToTrialRate: 0,
        trialToMemberRate: 0,
        avgConversionSpan: 0,
        avgPostTrialClasses: 0
      };
    }
    
    acc[associate].leads++;
    if (client.visitsPostTrial > 0) acc[associate].trialsCompleted++;
    if (client.conversionStatus === 'Converted') acc[associate].conversions++;
    if (client.retentionStatus === 'Retained') acc[associate].retained++;
    acc[associate].totalLTV += client.ltv || 0;
    acc[associate].totalConversionSpan += client.conversionSpan || 0;
    acc[associate].totalPostTrialClasses += client.visitsPostTrial || 0;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate enhanced rates for associates
  Object.values(associateStats).forEach((stats: any) => {
    stats.conversionRate = stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0;
    stats.retentionRate = stats.leads > 0 ? (stats.retained / stats.leads) * 100 : 0;
    stats.leadToTrialRate = stats.leads > 0 ? (stats.trialsCompleted / stats.leads) * 100 : 0;
    stats.trialToMemberRate = stats.trialsCompleted > 0 ? (stats.conversions / stats.trialsCompleted) * 100 : 0;
    stats.avgConversionSpan = stats.conversions > 0 ? stats.totalConversionSpan / stats.conversions : 0;
    stats.avgPostTrialClasses = stats.trialsCompleted > 0 ? stats.totalPostTrialClasses / stats.trialsCompleted : 0;
  });

  const associateList = Object.values(associateStats) as any[];

  // Class type analysis with enhanced metrics
  const classTypeStats = data.reduce((acc, client) => {
    const classType = client.membershipUsed || client.firstVisitType || 'Unknown';
    if (!acc[classType]) {
      acc[classType] = {
        classType,
        leads: 0,
        trialsCompleted: 0,
        conversions: 0,
        retained: 0,
        totalLTV: 0,
        totalConversionSpan: 0,
        totalPostTrialClasses: 0,
        conversionRate: 0,
        leadToTrialRate: 0,
        trialToMemberRate: 0,
        avgConversionSpan: 0,
        avgPostTrialClasses: 0
      };
    }
    
    acc[classType].leads++;
    if (client.visitsPostTrial > 0) acc[classType].trialsCompleted++;
    if (client.conversionStatus === 'Converted') acc[classType].conversions++;
    if (client.retentionStatus === 'Retained') acc[classType].retained++;
    acc[classType].totalLTV += client.ltv || 0;
    acc[classType].totalConversionSpan += client.conversionSpan || 0;
    acc[classType].totalPostTrialClasses += client.visitsPostTrial || 0;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate enhanced rates for class types
  Object.values(classTypeStats).forEach((stats: any) => {
    stats.conversionRate = stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0;
    stats.leadToTrialRate = stats.leads > 0 ? (stats.trialsCompleted / stats.leads) * 100 : 0;
    stats.trialToMemberRate = stats.trialsCompleted > 0 ? (stats.conversions / stats.trialsCompleted) * 100 : 0;
    stats.avgConversionSpan = stats.conversions > 0 ? stats.totalConversionSpan / stats.conversions : 0;
    stats.avgPostTrialClasses = stats.trialsCompleted > 0 ? stats.totalPostTrialClasses / stats.trialsCompleted : 0;
  });

  const classTypeList = Object.values(classTypeStats) as any[];

  const sortList = (list: any[], sortKey: string) => {
    return [...list].sort((a, b) => {
      const aValue = a[sortKey] || 0;
      const bValue = b[sortKey] || 0;
      return bValue - aValue;
    });
  };

  const handleItemClick = (item: any, type: string) => {
    onItemClick?.({ ...item, type });
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="sources" className="text-sm font-medium">
            <Users className="w-4 h-4 mr-2" />
            Lead Sources
          </TabsTrigger>
          <TabsTrigger value="stages" className="text-sm font-medium">
            <TrendingUp className="w-4 h-4 mr-2" />
            Lead Stages
          </TabsTrigger>
          <TabsTrigger value="associates" className="text-sm font-medium">
            <User className="w-4 h-4 mr-2" />
            Associates
          </TabsTrigger>
          <TabsTrigger value="classes" className="text-sm font-medium">
            <MapPin className="w-4 h-4 mr-2" />
            Class Types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-6">
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-800 text-xl flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Lead Source Performance
                </CardTitle>
                <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">
                  {sourceList.length} Sources
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Trials Completed</TableHead>
                      <TableHead className="text-right">Lead→Trial %</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Trial→Member %</TableHead>
                      <TableHead className="text-right">Avg Conv Span</TableHead>
                      <TableHead className="text-right">Avg LTV</TableHead>
                      <TableHead className="text-right">Avg Classes Post Trial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortList(sourceList, 'conversions').slice(0, 10).map((source, index) => (
                      <TableRow 
                        key={source.source}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => handleItemClick(source, 'source')}
                      >
                        <TableCell className="font-medium">{source.source}</TableCell>
                        <TableCell className="text-right">{formatNumber(source.leads)}</TableCell>
                        <TableCell className="text-right">{formatNumber(source.trialsCompleted)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={source.leadToTrialRate > 50 ? "default" : "secondary"}>
                            {source.leadToTrialRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(source.conversions)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={source.trialToMemberRate > 30 ? "default" : "secondary"}>
                            {source.trialToMemberRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{source.avgConversionSpan.toFixed(0)} days</TableCell>
                        <TableCell className="text-right">{formatCurrency(source.avgLTV)}</TableCell>
                        <TableCell className="text-right">{source.avgPostTrialClasses.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="sticky bottom-0 z-10 bg-slate-900 border-t-2 border-slate-700">
                    <TableRow className="hover:bg-slate-800 h-10 max-h-10 border-none">
                      <TableCell className="font-bold text-white">TOTAL</TableCell>
                      <TableCell className="text-right font-bold text-white">{formatNumber(sourceList.reduce((sum, row) => sum + row.leads, 0))}</TableCell>
                      <TableCell className="text-right font-bold text-white">{formatNumber(sourceList.reduce((sum, row) => sum + row.trialsCompleted, 0))}</TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {sourceList.reduce((sum, row) => sum + row.leads, 0) > 0 ? 
                          ((sourceList.reduce((sum, row) => sum + row.trialsCompleted, 0) / sourceList.reduce((sum, row) => sum + row.leads, 0)) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">{formatNumber(sourceList.reduce((sum, row) => sum + row.conversions, 0))}</TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {sourceList.reduce((sum, row) => sum + row.trialsCompleted, 0) > 0 ? 
                          ((sourceList.reduce((sum, row) => sum + row.conversions, 0) / sourceList.reduce((sum, row) => sum + row.trialsCompleted, 0)) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {sourceList.reduce((sum, row) => sum + row.conversions, 0) > 0 ? 
                          Math.round(sourceList.reduce((sum, row) => sum + (row.avgConversionSpan * row.conversions), 0) / sourceList.reduce((sum, row) => sum + row.conversions, 0)) : 0} days
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {formatCurrency(sourceList.reduce((sum, row) => sum + row.leads, 0) > 0 ? 
                          sourceList.reduce((sum, row) => sum + row.totalLTV, 0) / sourceList.reduce((sum, row) => sum + row.leads, 0) : 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {sourceList.reduce((sum, row) => sum + row.trialsCompleted, 0) > 0 ? 
                          (sourceList.reduce((sum, row) => sum + (row.avgPostTrialClasses * row.trialsCompleted), 0) / sourceList.reduce((sum, row) => sum + row.trialsCompleted, 0)).toFixed(1) : '0.0'}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stages" className="mt-6">
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-800 text-xl flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Lead Stage Analysis
                </CardTitle>
                <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                  {stageList.length} Stages
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Trials Completed</TableHead>
                      <TableHead className="text-right">Lead→Trial %</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Trial→Member %</TableHead>
                      <TableHead className="text-right">Avg Conv Span</TableHead>
                      <TableHead className="text-right">Avg Classes Post Trial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortList(stageList, 'conversions').map((stage, index) => (
                      <TableRow 
                        key={stage.stage}
                        className="hover:bg-green-50 cursor-pointer transition-colors"
                        onClick={() => handleItemClick(stage, 'stage')}
                      >
                        <TableCell className="font-medium">{stage.stage}</TableCell>
                        <TableCell className="text-right">{formatNumber(stage.leads)}</TableCell>
                        <TableCell className="text-right">{formatNumber(stage.trialsCompleted)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={stage.leadToTrialRate > 50 ? "default" : "secondary"}>
                            {stage.leadToTrialRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(stage.conversions)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={stage.trialToMemberRate > 30 ? "default" : "secondary"}>
                            {stage.trialToMemberRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{stage.avgConversionSpan.toFixed(0)} days</TableCell>
                        <TableCell className="text-right">{stage.avgPostTrialClasses.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="sticky bottom-0 z-10 bg-slate-900 border-t-2 border-slate-700">
                    <TableRow className="hover:bg-slate-800 h-10 max-h-10 border-none">
                      <TableCell className="font-bold text-white">TOTAL</TableCell>
                      <TableCell className="text-right font-bold text-white">{formatNumber(stageList.reduce((sum, row) => sum + row.leads, 0))}</TableCell>
                      <TableCell className="text-right font-bold text-white">{formatNumber(stageList.reduce((sum, row) => sum + row.trialsCompleted, 0))}</TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {stageList.reduce((sum, row) => sum + row.leads, 0) > 0 ? 
                          ((stageList.reduce((sum, row) => sum + row.trialsCompleted, 0) / stageList.reduce((sum, row) => sum + row.leads, 0)) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">{formatNumber(stageList.reduce((sum, row) => sum + row.conversions, 0))}</TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {stageList.reduce((sum, row) => sum + row.trialsCompleted, 0) > 0 ? 
                          ((stageList.reduce((sum, row) => sum + row.conversions, 0) / stageList.reduce((sum, row) => sum + row.trialsCompleted, 0)) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {stageList.reduce((sum, row) => sum + row.conversions, 0) > 0 ? 
                          Math.round(stageList.reduce((sum, row) => sum + (row.avgConversionSpan * row.conversions), 0) / stageList.reduce((sum, row) => sum + row.conversions, 0)) : 0} days
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {stageList.reduce((sum, row) => sum + row.trialsCompleted, 0) > 0 ? 
                          (stageList.reduce((sum, row) => sum + (row.avgPostTrialClasses * row.trialsCompleted), 0) / stageList.reduce((sum, row) => sum + row.trialsCompleted, 0)).toFixed(1) : '0.0'}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="associates" className="mt-6">
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-800 text-xl flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Associate Performance
                </CardTitle>
                <Badge variant="outline" className="text-purple-600 border-purple-600 bg-purple-50">
                  {associateList.length} Associates
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Associate</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Trials Completed</TableHead>
                      <TableHead className="text-right">Lead→Trial %</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Trial→Member %</TableHead>
                      <TableHead className="text-right">Avg Conv Span</TableHead>
                      <TableHead className="text-right">Avg Classes Post Trial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortList(associateList, 'conversions').slice(0, 15).map((associate, index) => (
                      <TableRow 
                        key={associate.associate}
                        className="hover:bg-purple-50 cursor-pointer transition-colors"
                        onClick={() => handleItemClick(associate, 'associate')}
                      >
                        <TableCell className="font-medium">{associate.associate}</TableCell>
                        <TableCell className="text-right">{formatNumber(associate.leads)}</TableCell>
                        <TableCell className="text-right">{formatNumber(associate.trialsCompleted)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={associate.leadToTrialRate > 50 ? "default" : "secondary"}>
                            {associate.leadToTrialRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(associate.conversions)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={associate.trialToMemberRate > 30 ? "default" : "secondary"}>
                            {associate.trialToMemberRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{associate.avgConversionSpan.toFixed(0)} days</TableCell>
                        <TableCell className="text-right">{associate.avgPostTrialClasses.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="sticky bottom-0 z-10 bg-slate-900 border-t-2 border-slate-700">
                    <TableRow className="hover:bg-slate-800 h-10 max-h-10 border-none">
                      <TableCell className="font-bold text-white">TOTAL</TableCell>
                      <TableCell className="text-right font-bold text-white">{formatNumber(associateList.reduce((sum, row) => sum + row.leads, 0))}</TableCell>
                      <TableCell className="text-right font-bold text-white">{formatNumber(associateList.reduce((sum, row) => sum + row.trialsCompleted, 0))}</TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {associateList.reduce((sum, row) => sum + row.leads, 0) > 0 ? 
                          ((associateList.reduce((sum, row) => sum + row.trialsCompleted, 0) / associateList.reduce((sum, row) => sum + row.leads, 0)) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">{formatNumber(associateList.reduce((sum, row) => sum + row.conversions, 0))}</TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {associateList.reduce((sum, row) => sum + row.trialsCompleted, 0) > 0 ? 
                          ((associateList.reduce((sum, row) => sum + row.conversions, 0) / associateList.reduce((sum, row) => sum + row.trialsCompleted, 0)) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {associateList.reduce((sum, row) => sum + row.conversions, 0) > 0 ? 
                          Math.round(associateList.reduce((sum, row) => sum + (row.avgConversionSpan * row.conversions), 0) / associateList.reduce((sum, row) => sum + row.conversions, 0)) : 0} days
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {associateList.reduce((sum, row) => sum + row.trialsCompleted, 0) > 0 ? 
                          (associateList.reduce((sum, row) => sum + (row.avgPostTrialClasses * row.trialsCompleted), 0) / associateList.reduce((sum, row) => sum + row.trialsCompleted, 0)).toFixed(1) : '0.0'}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="mt-6">
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-800 text-xl flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  Class Type Performance
                </CardTitle>
                <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">
                  {classTypeList.length} Types
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Type</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Trials Completed</TableHead>
                      <TableHead className="text-right">Lead→Trial %</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Trial→Member %</TableHead>
                      <TableHead className="text-right">Avg Conv Span</TableHead>
                      <TableHead className="text-right">Avg Classes Post Trial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortList(classTypeList, 'conversions').map((classType, index) => (
                      <TableRow 
                        key={classType.classType}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => handleItemClick(classType, 'classType')}
                      >
                        <TableCell className="font-medium">{classType.classType}</TableCell>
                        <TableCell className="text-right">{formatNumber(classType.leads)}</TableCell>
                        <TableCell className="text-right">{formatNumber(classType.trialsCompleted)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={classType.leadToTrialRate > 50 ? "default" : "secondary"}>
                            {classType.leadToTrialRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(classType.conversions)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={classType.trialToMemberRate > 30 ? "default" : "secondary"}>
                            {classType.trialToMemberRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{classType.avgConversionSpan.toFixed(0)} days</TableCell>
                        <TableCell className="text-right">{classType.avgPostTrialClasses.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="sticky bottom-0 z-10 bg-slate-900 border-t-2 border-slate-700">
                    <TableRow className="hover:bg-slate-800 h-10 max-h-10 border-none">
                      <TableCell className="font-bold text-white">TOTAL</TableCell>
                      <TableCell className="text-right font-bold text-white">{formatNumber(classTypeList.reduce((sum, row) => sum + row.leads, 0))}</TableCell>
                      <TableCell className="text-right font-bold text-white">{formatNumber(classTypeList.reduce((sum, row) => sum + row.trialsCompleted, 0))}</TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {classTypeList.reduce((sum, row) => sum + row.leads, 0) > 0 ? 
                          ((classTypeList.reduce((sum, row) => sum + row.trialsCompleted, 0) / classTypeList.reduce((sum, row) => sum + row.leads, 0)) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">{formatNumber(classTypeList.reduce((sum, row) => sum + row.conversions, 0))}</TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {classTypeList.reduce((sum, row) => sum + row.trialsCompleted, 0) > 0 ? 
                          ((classTypeList.reduce((sum, row) => sum + row.conversions, 0) / classTypeList.reduce((sum, row) => sum + row.trialsCompleted, 0)) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {classTypeList.reduce((sum, row) => sum + row.conversions, 0) > 0 ? 
                          Math.round(classTypeList.reduce((sum, row) => sum + (row.avgConversionSpan * row.conversions), 0) / classTypeList.reduce((sum, row) => sum + row.conversions, 0)) : 0} days
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {classTypeList.reduce((sum, row) => sum + row.trialsCompleted, 0) > 0 ? 
                          (classTypeList.reduce((sum, row) => sum + (row.avgPostTrialClasses * row.trialsCompleted), 0) / classTypeList.reduce((sum, row) => sum + row.trialsCompleted, 0)).toFixed(1) : '0.0'}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
