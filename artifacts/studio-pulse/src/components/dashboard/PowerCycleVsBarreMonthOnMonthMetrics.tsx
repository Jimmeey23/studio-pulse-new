
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, Target, Users } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { usePayrollData } from '@/hooks/usePayrollData';

export const PowerCycleVsBarreMonthOnMonthMetrics: React.FC = () => {
  const { data: payrollData, isLoading } = usePayrollData();

  const processedData = useMemo(() => {
    if (!payrollData) return [];

    // Group by month and calculate totals for each class format
    const monthlyData = payrollData.reduce((acc, record) => {
      const monthKey = record.monthYear;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          powerCycle: {
            sessions: 0,
            emptySessions: 0,
            nonEmptySessions: 0,
            customers: 0,
            revenue: 0,
            capacity: 0,
            fillRate: 0,
            newMembers: 0,
            convertedMembers: 0,
            retainedMembers: 0,
            conversion: 0,
            retention: 0,
            classAvgInclEmpty: 0,
            classAvgExclEmpty: 0
          },
          barre: {
            sessions: 0,
            emptySessions: 0,
            nonEmptySessions: 0,
            customers: 0,
            revenue: 0,
            capacity: 0,
            fillRate: 0,
            newMembers: 0,
            convertedMembers: 0,
            retainedMembers: 0,
            conversion: 0,
            retention: 0,
            classAvgInclEmpty: 0,
            classAvgExclEmpty: 0
          }
        };
      }

      // PowerCycle metrics
      acc[monthKey].powerCycle.sessions += record.cycleSessions;
      acc[monthKey].powerCycle.emptySessions += record.emptyCycleSessions;
      acc[monthKey].powerCycle.nonEmptySessions += record.nonEmptyCycleSessions;
      acc[monthKey].powerCycle.customers += record.cycleCustomers;
      acc[monthKey].powerCycle.revenue += record.cyclePaid;
      acc[monthKey].powerCycle.newMembers += record.new || 0;
      acc[monthKey].powerCycle.convertedMembers += record.converted || 0;
      acc[monthKey].powerCycle.retainedMembers += record.retained || 0;

      // Barre metrics
      acc[monthKey].barre.sessions += record.barreSessions;
      acc[monthKey].barre.emptySessions += record.emptyBarreSessions;
      acc[monthKey].barre.nonEmptySessions += record.nonEmptyBarreSessions;
      acc[monthKey].barre.customers += record.barreCustomers;
      acc[monthKey].barre.revenue += record.barrePaid;

      return acc;
    }, {} as Record<string, any>);

    // Calculate derived metrics and format for display
    return Object.values(monthlyData).map((monthData: any) => {
      const pc = monthData.powerCycle;
      const barre = monthData.barre;

      // Calculate averages and rates
      pc.classAvgInclEmpty = pc.sessions > 0 ? pc.customers / pc.sessions : 0;
      pc.classAvgExclEmpty = pc.nonEmptySessions > 0 ? pc.customers / pc.nonEmptySessions : 0;
      pc.fillRate = pc.capacity > 0 ? (pc.customers / pc.capacity) * 100 : 0;
      pc.conversion = pc.customers > 0 ? (pc.convertedMembers / pc.customers) * 100 : 0;
      pc.retention = pc.customers > 0 ? (pc.retainedMembers / pc.customers) * 100 : 0;

      barre.classAvgInclEmpty = barre.sessions > 0 ? barre.customers / barre.sessions : 0;
      barre.classAvgExclEmpty = barre.nonEmptySessions > 0 ? barre.customers / barre.nonEmptySessions : 0;
      barre.fillRate = barre.capacity > 0 ? (barre.customers / barre.capacity) * 100 : 0;
      barre.conversion = barre.customers > 0 ? (barre.convertedMembers / barre.customers) * 100 : 0;
      barre.retention = barre.customers > 0 ? (barre.retainedMembers / barre.customers) * 100 : 0;

      return {
        month: monthData.month,
        
        // PowerCycle metrics
        pcSessions: pc.sessions,
        pcEmptySessions: pc.emptySessions,
        pcNonEmptySessions: pc.nonEmptySessions,
        pcCustomers: pc.customers,
        pcRevenue: formatCurrency(pc.revenue),
        pcClassAvgInclEmpty: pc.classAvgInclEmpty.toFixed(1),
        pcClassAvgExclEmpty: pc.classAvgExclEmpty.toFixed(1),
        pcFillRate: `${pc.fillRate.toFixed(1)}%`,
        pcNew: pc.newMembers,
        pcConverted: pc.convertedMembers,
        pcRetained: pc.retainedMembers,
        pcConversion: `${pc.conversion.toFixed(1)}%`,
        pcRetention: `${pc.retention.toFixed(1)}%`,
        
        // Barre metrics
        barreSessions: barre.sessions,
        barreEmptySessions: barre.emptySessions,
        barreNonEmptySessions: barre.nonEmptySessions,
        barreCustomers: barre.customers,
        barreRevenue: formatCurrency(barre.revenue),
        barreClassAvgInclEmpty: barre.classAvgInclEmpty.toFixed(1),
        barreClassAvgExclEmpty: barre.classAvgExclEmpty.toFixed(1),
        barreFillRate: `${barre.fillRate.toFixed(1)}%`,
        barreNew: barre.newMembers,
        barreConverted: barre.convertedMembers,
        barreRetained: barre.retainedMembers,
        barreConversion: `${barre.conversion.toFixed(1)}%`,
        barreRetention: `${barre.retention.toFixed(1)}%`
      };
    }).sort((a, b) => a.month.localeCompare(b.month));
  }, [payrollData]);

  const columns = [
    { key: 'month', header: 'Month', align: 'left' as const },
    
    // PowerCycle columns
    { key: 'pcSessions', header: 'PC Sessions', align: 'center' as const, render: (value: number) => <span className="font-bold text-blue-600">{formatNumber(value)}</span> },
    { key: 'pcEmptySessions', header: 'PC Empty', align: 'center' as const, render: (value: number) => <span className="text-red-600">{formatNumber(value)}</span> },
    { key: 'pcNonEmptySessions', header: 'PC Non-Empty', align: 'center' as const, render: (value: number) => <span className="text-green-600">{formatNumber(value)}</span> },
    { key: 'pcCustomers', header: 'PC Customers', align: 'center' as const },
    { key: 'pcRevenue', header: 'PC Revenue', align: 'right' as const },
    { key: 'pcClassAvgInclEmpty', header: 'PC Avg (Incl)', align: 'center' as const },
    { key: 'pcClassAvgExclEmpty', header: 'PC Avg (Excl)', align: 'center' as const },
    { key: 'pcFillRate', header: 'PC Fill Rate', align: 'center' as const },
    { key: 'pcNew', header: 'PC New', align: 'center' as const, render: (value: number) => <Badge className="bg-green-100 text-green-800">{value}</Badge> },
    { key: 'pcConverted', header: 'PC Converted', align: 'center' as const, render: (value: number) => <Badge className="bg-blue-100 text-blue-800">{value}</Badge> },
    { key: 'pcRetained', header: 'PC Retained', align: 'center' as const, render: (value: number) => <Badge className="bg-purple-100 text-purple-800">{value}</Badge> },
    { key: 'pcConversion', header: 'PC Conv %', align: 'center' as const },
    { key: 'pcRetention', header: 'PC Ret %', align: 'center' as const },
    
    // Barre columns
    { key: 'barreSessions', header: 'Barre Sessions', align: 'center' as const, render: (value: number) => <span className="font-bold text-pink-600">{formatNumber(value)}</span> },
    { key: 'barreEmptySessions', header: 'Barre Empty', align: 'center' as const, render: (value: number) => <span className="text-red-600">{formatNumber(value)}</span> },
    { key: 'barreNonEmptySessions', header: 'Barre Non-Empty', align: 'center' as const, render: (value: number) => <span className="text-green-600">{formatNumber(value)}</span> },
    { key: 'barreCustomers', header: 'Barre Customers', align: 'center' as const },
    { key: 'barreRevenue', header: 'Barre Revenue', align: 'right' as const },
    { key: 'barreClassAvgInclEmpty', header: 'Barre Avg (Incl)', align: 'center' as const },
    { key: 'barreClassAvgExclEmpty', header: 'Barre Avg (Excl)', align: 'center' as const },
    { key: 'barreFillRate', header: 'Barre Fill Rate', align: 'center' as const },
    { key: 'barreNew', header: 'Barre New', align: 'center' as const, render: (value: number) => <Badge className="bg-green-100 text-green-800">{value}</Badge> },
    { key: 'barreConverted', header: 'Barre Converted', align: 'center' as const, render: (value: number) => <Badge className="bg-blue-100 text-blue-800">{value}</Badge> },
    { key: 'barreRetained', header: 'Barre Retained', align: 'center' as const, render: (value: number) => <Badge className="bg-purple-100 text-purple-800">{value}</Badge> },
    { key: 'barreConversion', header: 'Barre Conv %', align: 'center' as const },
    { key: 'barreRetention', header: 'Barre Ret %', align: 'center' as const }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <BrandSpinner size="md" />
      </div>
    );
  }

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600">
        <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
          <Calendar className="w-5 h-5" />
          Month-on-Month PowerCycle vs Barre Metrics
          <Badge className="bg-white/20 text-white">
            {processedData.length} months
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ModernDataTable
          data={processedData}
          columns={columns}
          maxHeight="600px"
          stickyHeader={true}
          headerGradient="from-slate-800 via-slate-900 to-slate-800"
        />
      </CardContent>
    </Card>
  );
};
