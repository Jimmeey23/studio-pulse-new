
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Badge } from '@/components/ui/badge';
import { Calendar, Zap, Bike } from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import { usePayrollData } from '@/hooks/usePayrollData';

interface PowerCycleVsBarreEnhancedMonthOnMonthTableProps {
  onRowClick?: (row: any) => void;
}

export const PowerCycleVsBarreEnhancedMonthOnMonthTable: React.FC<PowerCycleVsBarreEnhancedMonthOnMonthTableProps> = ({ 
  onRowClick 
}) => {
  const { data: payrollData, isLoading } = usePayrollData();

  const processedData = useMemo(() => {
    if (!payrollData) return [];

    const monthlyData = payrollData.reduce((acc, record) => {
      const monthKey = record.monthYear;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          pc: { sessions: 0, emptySessions: 0, nonEmptySessions: 0, customers: 0, revenue: 0, avgClassSize: 0, avgClassSizeExclEmpty: 0, new: 0, converted: 0, retained: 0 },
          barre: { sessions: 0, emptySessions: 0, nonEmptySessions: 0, customers: 0, revenue: 0, avgClassSize: 0, avgClassSizeExclEmpty: 0, new: 0, converted: 0, retained: 0 }
        };
      }

      acc[monthKey].pc.sessions += record.cycleSessions;
      acc[monthKey].pc.emptySessions += record.emptyCycleSessions;
      acc[monthKey].pc.nonEmptySessions += record.nonEmptyCycleSessions;
      acc[monthKey].pc.customers += record.cycleCustomers;
      acc[monthKey].pc.revenue += record.cyclePaid;
      acc[monthKey].pc.new += record.new || 0;
      acc[monthKey].pc.converted += record.converted || 0;
      acc[monthKey].pc.retained += record.retained || 0;

      acc[monthKey].barre.sessions += record.barreSessions;
      acc[monthKey].barre.emptySessions += record.emptyBarreSessions;
      acc[monthKey].barre.nonEmptySessions += record.nonEmptyBarreSessions;
      acc[monthKey].barre.customers += record.barreCustomers;
      acc[monthKey].barre.revenue += record.barrePaid;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyData).map((month: any) => {
      month.pc.avgClassSize = month.pc.sessions > 0 ? (month.pc.customers / month.pc.sessions).toFixed(1) : '0.0';
      month.pc.avgClassSizeExclEmpty = month.pc.nonEmptySessions > 0 ? (month.pc.customers / month.pc.nonEmptySessions).toFixed(1) : '0.0';
      month.pc.conversionRate = month.pc.customers > 0 ? ((month.pc.converted / month.pc.customers) * 100).toFixed(1) : '0.0';
      month.pc.retentionRate = month.pc.customers > 0 ? ((month.pc.retained / month.pc.customers) * 100).toFixed(1) : '0.0';

      month.barre.avgClassSize = month.barre.sessions > 0 ? (month.barre.customers / month.barre.sessions).toFixed(1) : '0.0';
      month.barre.avgClassSizeExclEmpty = month.barre.nonEmptySessions > 0 ? (month.barre.customers / month.barre.nonEmptySessions).toFixed(1) : '0.0';
      month.barre.conversionRate = '0.0';
      month.barre.retentionRate = '0.0';

      return {
        month: month.month,
        pcSessions: month.pc.sessions,
        barreSessions: month.barre.sessions,
        pcEmptySessions: month.pc.emptySessions,
        barreEmptySessions: month.barre.emptySessions,
        pcNonEmptySessions: month.pc.nonEmptySessions,
        barreNonEmptySessions: month.barre.nonEmptySessions,
        pcCustomers: month.pc.customers,
        barreCustomers: month.barre.customers,
        pcRevenue: month.pc.revenue,
        barreRevenue: month.barre.revenue,
        pcAvgClassSize: month.pc.avgClassSize,
        barreAvgClassSize: month.barre.avgClassSize,
        pcAvgClassSizeExclEmpty: month.pc.avgClassSizeExclEmpty,
        barreAvgClassSizeExclEmpty: month.barre.avgClassSizeExclEmpty,
        pcNew: month.pc.new,
        barreNew: month.barre.new,
        pcConverted: month.pc.converted,
        barreConverted: month.barre.converted,
        pcRetained: month.pc.retained,
        barreRetained: month.barre.retained,
        pcConversionRate: month.pc.conversionRate,
        barreConversionRate: month.barre.conversionRate,
        pcRetentionRate: month.pc.retentionRate,
        barreRetentionRate: month.barre.retentionRate,
        rawData: month
      };
    }).sort((a, b) => a.month.localeCompare(b.month));
  }, [payrollData]);

  const columns = [
    { key: 'month', header: 'Month', align: 'left' as const },
    
    // Sessions
    { key: 'pcSessions', header: 'PC Sessions', align: 'center' as const, render: (value: number) => (
      <div className="flex items-center gap-1">
        <Zap className="w-3 h-3 text-blue-500" />
        <span className="font-bold text-blue-600">{formatNumber(value)}</span>
      </div>
    )},
    { key: 'barreSessions', header: 'Barre Sessions', align: 'center' as const, render: (value: number) => (
      <div className="flex items-center gap-1">
        <Bike className="w-3 h-3 text-pink-500" />
        <span className="font-bold text-pink-600">{formatNumber(value)}</span>
      </div>
    )},
    
    // Empty Sessions
    { key: 'pcEmptySessions', header: 'PC Empty', align: 'center' as const, render: (value: number) => <span className="text-red-600">{formatNumber(value)}</span> },
    { key: 'barreEmptySessions', header: 'Barre Empty', align: 'center' as const, render: (value: number) => <span className="text-red-600">{formatNumber(value)}</span> },
    
    // Non-Empty Sessions
    { key: 'pcNonEmptySessions', header: 'PC Non-Empty', align: 'center' as const, render: (value: number) => <span className="text-green-600">{formatNumber(value)}</span> },
    { key: 'barreNonEmptySessions', header: 'Barre Non-Empty', align: 'center' as const, render: (value: number) => <span className="text-green-600">{formatNumber(value)}</span> },
    
    // Customers
    { key: 'pcCustomers', header: 'PC Customers', align: 'center' as const },
    { key: 'barreCustomers', header: 'Barre Customers', align: 'center' as const },
    
    // Revenue
    { key: 'pcRevenue', header: 'PC Revenue', align: 'right' as const, render: (value: number) => formatCurrency(value) },
    { key: 'barreRevenue', header: 'Barre Revenue', align: 'right' as const, render: (value: number) => formatCurrency(value) },
    
    // Class Averages
    { key: 'pcAvgClassSize', header: 'PC Avg (Incl)', align: 'center' as const },
    { key: 'barreAvgClassSize', header: 'Barre Avg (Incl)', align: 'center' as const },
    { key: 'pcAvgClassSizeExclEmpty', header: 'PC Avg (Excl)', align: 'center' as const },
    { key: 'barreAvgClassSizeExclEmpty', header: 'Barre Avg (Excl)', align: 'center' as const },
    
    // New Members
    { key: 'pcNew', header: 'PC New', align: 'center' as const, render: (value: number) => <Badge className="bg-green-100 text-green-800">{value}</Badge> },
    { key: 'barreNew', header: 'Barre New', align: 'center' as const, render: (value: number) => <Badge className="bg-green-100 text-green-800">{value}</Badge> },
    
    // Converted
    { key: 'pcConverted', header: 'PC Converted', align: 'center' as const, render: (value: number) => <Badge className="bg-blue-100 text-blue-800">{value}</Badge> },
    { key: 'barreConverted', header: 'Barre Converted', align: 'center' as const, render: (value: number) => <Badge className="bg-blue-100 text-blue-800">{value}</Badge> },
    
    // Retained
    { key: 'pcRetained', header: 'PC Retained', align: 'center' as const, render: (value: number) => <Badge className="bg-purple-100 text-purple-800">{value}</Badge> },
    { key: 'barreRetained', header: 'Barre Retained', align: 'center' as const, render: (value: number) => <Badge className="bg-purple-100 text-purple-800">{value}</Badge> },
    
    // Rates
    { key: 'pcConversionRate', header: 'PC Conv %', align: 'center' as const, render: (value: string) => `${value}%` },
    { key: 'barreConversionRate', header: 'Barre Conv %', align: 'center' as const, render: (value: string) => `${value}%` },
    { key: 'pcRetentionRate', header: 'PC Ret %', align: 'center' as const, render: (value: string) => `${value}%` },
    { key: 'barreRetentionRate', header: 'Barre Ret %', align: 'center' as const, render: (value: string) => `${value}%` }
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
      <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
          <Calendar className="w-5 h-5" />
          Enhanced Month-on-Month PowerCycle vs Barre Metrics
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
          onRowClick={onRowClick}
        />
      </CardContent>
    </Card>
  );
};
