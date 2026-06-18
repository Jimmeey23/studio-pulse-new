
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp, 
  Target,
  BarChart3,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { usePayrollData } from '@/hooks/usePayrollData';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { BrandSpinner } from '@/components/ui/BrandSpinner';

export const PowerCycleVsBarrePayrollMetrics: React.FC = () => {
  const { data: payrollData, isLoading } = usePayrollData();

  const processedData = useMemo(() => {
    if (!payrollData) return { monthlyComparison: [], trainerComparison: [] };

    // Group by month for comparison
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
            avgClassSize: 0,
            avgClassSizeExclEmpty: 0,
            fillRate: 0,
            newCustomers: 0,
            convertedCustomers: 0,
            retainedCustomers: 0,
            conversionRate: 0,
            retentionRate: 0
          },
          barre: {
            sessions: 0,
            emptySessions: 0,
            nonEmptySessions: 0,
            customers: 0,
            revenue: 0,
            avgClassSize: 0,
            avgClassSizeExclEmpty: 0,
            fillRate: 0,
            newCustomers: 0,
            convertedCustomers: 0,
            retainedCustomers: 0,
            conversionRate: 0,
            retentionRate: 0
          }
        };
      }

      // PowerCycle metrics
      acc[monthKey].powerCycle.sessions += record.cycleSessions;
      acc[monthKey].powerCycle.emptySessions += record.emptyCycleSessions;
      acc[monthKey].powerCycle.nonEmptySessions += record.nonEmptyCycleSessions;
      acc[monthKey].powerCycle.customers += record.cycleCustomers;
      acc[monthKey].powerCycle.revenue += record.cyclePaid;

      // Barre metrics
      acc[monthKey].barre.sessions += record.barreSessions;
      acc[monthKey].barre.emptySessions += record.emptyBarreSessions;
      acc[monthKey].barre.nonEmptySessions += record.nonEmptyBarreSessions;
      acc[monthKey].barre.customers += record.barreCustomers;
      acc[monthKey].barre.revenue += record.barrePaid;

      return acc;
    }, {} as Record<string, any>);

    // Calculate derived metrics
    Object.values(monthlyData).forEach((month: any) => {
      // PowerCycle calculations
      if (month.powerCycle.sessions > 0) {
        month.powerCycle.avgClassSize = month.powerCycle.customers / month.powerCycle.sessions;
      }
      if (month.powerCycle.nonEmptySessions > 0) {
        month.powerCycle.avgClassSizeExclEmpty = month.powerCycle.customers / month.powerCycle.nonEmptySessions;
      }

      // Barre calculations
      if (month.barre.sessions > 0) {
        month.barre.avgClassSize = month.barre.customers / month.barre.sessions;
      }
      if (month.barre.nonEmptySessions > 0) {
        month.barre.avgClassSizeExclEmpty = month.barre.customers / month.barre.nonEmptySessions;
      }
    });

    const monthlyComparison = Object.values(monthlyData).map((month: any) => ({
      month: month.month,
      pcSessions: month.powerCycle.sessions,
      pcEmptySessions: month.powerCycle.emptySessions,
      pcNonEmptySessions: month.powerCycle.nonEmptySessions,
      pcCustomers: month.powerCycle.customers,
      pcRevenue: formatCurrency(month.powerCycle.revenue),
      pcAvgClassSize: month.powerCycle.avgClassSize.toFixed(1),
      pcAvgClassSizeExclEmpty: month.powerCycle.avgClassSizeExclEmpty.toFixed(1),
      barreSessions: month.barre.sessions,
      barreEmptySessions: month.barre.emptySessions,
      barreNonEmptySessions: month.barre.nonEmptySessions,
      barreCustomers: month.barre.customers,
      barreRevenue: formatCurrency(month.barre.revenue),
      barreAvgClassSize: month.barre.avgClassSize.toFixed(1),
      barreAvgClassSizeExclEmpty: month.barre.avgClassSizeExclEmpty.toFixed(1)
    }));

    // Trainer comparison data
    const trainerComparison = payrollData.map(record => ({
      trainerName: record.teacherName,
      location: record.location.substring(0, 3).toUpperCase(),
      month: record.monthYear,
      pcSessions: record.cycleSessions,
      pcRevenue: formatCurrency(record.cyclePaid),
      pcCustomers: record.cycleCustomers,
      barreSessions: record.barreSessions,
      barreRevenue: formatCurrency(record.barrePaid),
      barreCustomers: record.barreCustomers,
      totalSessions: record.totalSessions,
      totalRevenue: formatCurrency(record.totalPaid),
      totalCustomers: record.totalCustomers,
      classAvgInclEmpty: record.classAverageInclEmpty?.toFixed(1) || '0.0',
      classAvgExclEmpty: record.classAverageExclEmpty?.toFixed(1) || '0.0',
      newCustomers: record.new || 0,
      converted: record.converted || 0,
      retained: record.retained || 0,
      conversionRate: record.conversion || '0%',
      retentionRate: record.retention || '0%'
    }));

    return { monthlyComparison, trainerComparison };
  }, [payrollData]);

  const monthlyColumns = [
    { key: 'month', header: 'Month', align: 'left' as const },
    { key: 'pcSessions', header: 'PC Sessions', align: 'center' as const, render: (value: number) => <span className="font-bold text-blue-600">{formatNumber(value)}</span> },
    { key: 'barreSessions', header: 'Barre Sessions', align: 'center' as const, render: (value: number) => <span className="font-bold text-pink-600">{formatNumber(value)}</span> },
    { key: 'pcCustomers', header: 'PC Customers', align: 'center' as const },
    { key: 'barreCustomers', header: 'Barre Customers', align: 'center' as const },
    { key: 'pcRevenue', header: 'PC Revenue', align: 'right' as const },
    { key: 'barreRevenue', header: 'Barre Revenue', align: 'right' as const },
    { key: 'pcAvgClassSize', header: 'PC Avg Size', align: 'center' as const },
    { key: 'barreAvgClassSize', header: 'Barre Avg Size', align: 'center' as const },
    { key: 'pcAvgClassSizeExclEmpty', header: 'PC Avg (Ex Empty)', align: 'center' as const },
    { key: 'barreAvgClassSizeExclEmpty', header: 'Barre Avg (Ex Empty)', align: 'center' as const }
  ];

  const trainerColumns = [
    { key: 'trainerName', header: 'Trainer', align: 'left' as const, render: (value: string, item: any) => (
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-blue-500" />
        <span className="font-medium">{value}</span>
        <Badge variant="outline" className="text-xs">{item.location}</Badge>
      </div>
    )},
    { key: 'month', header: 'Month', align: 'center' as const },
    { key: 'pcSessions', header: 'PC Sessions', align: 'center' as const, render: (value: number) => <span className="font-bold text-blue-600">{formatNumber(value)}</span> },
    { key: 'barreSessions', header: 'Barre Sessions', align: 'center' as const, render: (value: number) => <span className="font-bold text-pink-600">{formatNumber(value)}</span> },
    { key: 'pcRevenue', header: 'PC Revenue', align: 'right' as const },
    { key: 'barreRevenue', header: 'Barre Revenue', align: 'right' as const },
    { key: 'classAvgInclEmpty', header: 'Avg (Incl Empty)', align: 'center' as const },
    { key: 'classAvgExclEmpty', header: 'Avg (Excl Empty)', align: 'center' as const },
    { key: 'newCustomers', header: 'New', align: 'center' as const, render: (value: number) => (
      <Badge className="bg-green-100 text-green-800">{value}</Badge>
    )},
    { key: 'converted', header: 'Converted', align: 'center' as const, render: (value: number) => (
      <Badge className="bg-blue-100 text-blue-800">{value}</Badge>
    )},
    { key: 'retained', header: 'Retained', align: 'center' as const, render: (value: number) => (
      <Badge className="bg-purple-100 text-purple-800">{value}</Badge>
    )},
    { key: 'conversionRate', header: 'Conversion %', align: 'center' as const },
    { key: 'retentionRate', header: 'Retention %', align: 'center' as const }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <BrandSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600">
          <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
            <Calendar className="w-5 h-5" />
            Monthly PowerCycle vs Barre Comparison
            <Badge className="bg-white/20 text-white">
              {processedData.monthlyComparison.length} months
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={processedData.monthlyComparison}
            columns={monthlyColumns}
            maxHeight="500px"
            stickyHeader={true}
            headerGradient="from-slate-800 via-slate-900 to-slate-800"
          />
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600">
          <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
            <Users className="w-5 h-5" />
            Trainer Performance by Class Format
            <Badge className="bg-white/20 text-white">
              {processedData.trainerComparison.length} records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={processedData.trainerComparison}
            columns={trainerColumns}
            maxHeight="600px"
            stickyHeader={true}
            headerGradient="from-slate-800 via-slate-900 to-slate-800"
          />
        </CardContent>
      </Card>
    </div>
  );
};
