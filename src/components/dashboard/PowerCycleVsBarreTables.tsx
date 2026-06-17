import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Users, Target, TrendingUp, Calendar, MapPin, User, DollarSign } from 'lucide-react';
import type { SessionData, SalesData, PayrollData } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface PowerCycleVsBarreTablesProps {
  powerCycleData: SessionData[];
  barreData: SessionData[];
  salesData: SalesData[];
  payrollData: PayrollData[];
  onItemClick?: (item: any) => void;
}

export const PowerCycleVsBarreTables: React.FC<PowerCycleVsBarreTablesProps> = memo(({
  powerCycleData,
  barreData,
  salesData,
  payrollData,
  onItemClick
}) => {
  // Helper function to safely format numbers
  const safeToFixed = (value: any, decimals: number = 1): string => {
    if (value === null || value === undefined) return '0.0';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? '0.0' : num.toFixed(decimals);
  };

  // Safe number formatting for display
  const formatSafeNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  };

  // Instructor performance analysis
  const instructorAnalysis = useMemo(() => {
    const instructors: Record<string, {
      name: string;
      powerCycleSessions: number;
      barreSessions: number;
      totalSessions: number;
      powerCycleAttendance: number;
      barreAttendance: number;
      totalAttendance: number;
      powerCycleAvg: number;
      barreAvg: number;
      overallAvg: number;
      powerCycleFillRate: number;
      barreFillRate: number;
      overallFillRate: number;
      powerCycleCapacity: number;
      barreCapacity: number;
      totalCapacity: number;
    }> = {};

    // Process PowerCycle data
    powerCycleData.forEach(session => {
      const instructor = session.instructor;
      if (!instructors[instructor]) {
        instructors[instructor] = {
          name: instructor,
          powerCycleSessions: 0,
          barreSessions: 0,
          totalSessions: 0,
          powerCycleAttendance: 0,
          barreAttendance: 0,
          totalAttendance: 0,
          powerCycleAvg: 0,
          barreAvg: 0,
          overallAvg: 0,
          powerCycleFillRate: 0,
          barreFillRate: 0,
          overallFillRate: 0,
          powerCycleCapacity: 0,
          barreCapacity: 0,
          totalCapacity: 0
        };
      }

      instructors[instructor].powerCycleSessions++;
      instructors[instructor].powerCycleAttendance += session.checkedIn;
      instructors[instructor].powerCycleCapacity += session.capacity;
    });

    // Process Barre data
    barreData.forEach(session => {
      const instructor = session.instructor;
      if (!instructors[instructor]) {
        instructors[instructor] = {
          name: instructor,
          powerCycleSessions: 0,
          barreSessions: 0,
          totalSessions: 0,
          powerCycleAttendance: 0,
          barreAttendance: 0,
          totalAttendance: 0,
          powerCycleAvg: 0,
          barreAvg: 0,
          overallAvg: 0,
          powerCycleFillRate: 0,
          barreFillRate: 0,
          overallFillRate: 0,
          powerCycleCapacity: 0,
          barreCapacity: 0,
          totalCapacity: 0
        };
      }

      instructors[instructor].barreSessions++;
      instructors[instructor].barreAttendance += session.checkedIn;
      instructors[instructor].barreCapacity += session.capacity;
    });

    // Calculate metrics
    Object.values(instructors).forEach(instructor => {
      instructor.totalSessions = instructor.powerCycleSessions + instructor.barreSessions;
      instructor.totalAttendance = instructor.powerCycleAttendance + instructor.barreAttendance;
      instructor.totalCapacity = instructor.powerCycleCapacity + instructor.barreCapacity;
      
      instructor.powerCycleAvg = instructor.powerCycleSessions > 0 ? instructor.powerCycleAttendance / instructor.powerCycleSessions : 0;
      instructor.barreAvg = instructor.barreSessions > 0 ? instructor.barreAttendance / instructor.barreSessions : 0;
      instructor.overallAvg = instructor.totalSessions > 0 ? instructor.totalAttendance / instructor.totalSessions : 0;
      
      instructor.powerCycleFillRate = instructor.powerCycleCapacity > 0 ? (instructor.powerCycleAttendance / instructor.powerCycleCapacity) * 100 : 0;
      instructor.barreFillRate = instructor.barreCapacity > 0 ? (instructor.barreAttendance / instructor.barreCapacity) * 100 : 0;
      instructor.overallFillRate = instructor.totalCapacity > 0 ? (instructor.totalAttendance / instructor.totalCapacity) * 100 : 0;
    });

    return Object.values(instructors)
      .filter(instructor => instructor.totalSessions >= 3)
      .sort((a, b) => b.overallAvg - a.overallAvg);
  }, [powerCycleData, barreData]);

  // Monthly performance comparison
  const monthlyPerformance = useMemo(() => {
    const months: Record<string, {
      month: string;
      powerCycleSessions: number;
      barreSessions: number;
      powerCycleAttendance: number;
      barreAttendance: number;
      powerCycleCapacity: number;
      barreCapacity: number;
      powerCycleAvg: number;
      barreAvg: number;
      powerCycleFillRate: number;
      barreFillRate: number;
      revenue: number;
    }> = {};

    // Process session data
    [...powerCycleData, ...barreData].forEach(session => {
      const monthKey = session.date.substring(0, 7);
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          powerCycleSessions: 0,
          barreSessions: 0,
          powerCycleAttendance: 0,
          barreAttendance: 0,
          powerCycleCapacity: 0,
          barreCapacity: 0,
          powerCycleAvg: 0,
          barreAvg: 0,
          powerCycleFillRate: 0,
          barreFillRate: 0,
          revenue: 0
        };
      }

      const isPowerCycle = powerCycleData.includes(session);
      if (isPowerCycle) {
        months[monthKey].powerCycleSessions++;
        months[monthKey].powerCycleAttendance += session.checkedIn;
        months[monthKey].powerCycleCapacity += session.capacity;
      } else {
        months[monthKey].barreSessions++;
        months[monthKey].barreAttendance += session.checkedIn;
        months[monthKey].barreCapacity += session.capacity;
      }
      
      // Calculate basic revenue estimate (simplified)
      months[monthKey].revenue += session.checkedIn * 500; // Rough estimate
    });

    // Calculate averages and fill rates
    Object.values(months).forEach(month => {
      month.powerCycleAvg = month.powerCycleSessions > 0 ? month.powerCycleAttendance / month.powerCycleSessions : 0;
      month.barreAvg = month.barreSessions > 0 ? month.barreAttendance / month.barreSessions : 0;
      month.powerCycleFillRate = month.powerCycleCapacity > 0 ? (month.powerCycleAttendance / month.powerCycleCapacity) * 100 : 0;
      month.barreFillRate = month.barreCapacity > 0 ? (month.barreAttendance / month.barreCapacity) * 100 : 0;
    });

    return Object.values(months).sort((a, b) => b.month.localeCompare(a.month));
  }, [powerCycleData, barreData]);

  // Instructor table columns
  const instructorColumns: Array<{
    key: keyof typeof instructorAnalysis[0];
    header: string;
    align?: 'left' | 'center' | 'right';
    render?: (value: any, item: any) => React.ReactNode;
  }> = [
    {
      key: 'name',
      header: 'Instructor',
      align: 'left',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 font-semibold">
            {value}
          </Badge>
        </div>
      )
    },
    {
      key: 'totalSessions',
      header: 'Total Sessions',
      align: 'center',
      render: (value: number) => (
        <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 font-bold">
          {formatSafeNumber(value)}
        </Badge>
      )
    },
    {
      key: 'powerCycleSessions',
      header: 'PC Sessions',
      align: 'center',
      render: (value: number) => (
        <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 font-semibold">
          {formatSafeNumber(value)}
        </Badge>
      )
    },
    {
      key: 'barreSessions',
      header: 'Barre Sessions',
      align: 'center',
      render: (value: number) => (
        <Badge className="bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 font-semibold">
          {formatSafeNumber(value)}
        </Badge>
      )
    },
    {
      key: 'overallAvg',
      header: 'Overall Avg',
      align: 'center',
      render: (value: number) => (
        <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 font-bold">
          {safeToFixed(value)}
        </Badge>
      )
    },
    {
      key: 'powerCycleAvg',
      header: 'PC Avg',
      align: 'center',
      render: (value: number) => (
        <Badge variant="outline" className="border-blue-300 text-blue-700 font-medium">
          {safeToFixed(value)}
        </Badge>
      )
    },
    {
      key: 'barreAvg',
      header: 'Barre Avg',
      align: 'center',
      render: (value: number) => (
        <Badge variant="outline" className="border-pink-300 text-pink-700 font-medium">
          {safeToFixed(value)}
        </Badge>
      )
    },
    {
      key: 'overallFillRate',
      header: 'Fill Rate',
      align: 'center',
      render: (value: number) => {
        const numValue = formatSafeNumber(value);
        const roundedValue = Math.round(numValue);
        const colorClass = roundedValue > 80 ? 'from-green-500 to-green-600' : 
                          roundedValue > 60 ? 'from-yellow-500 to-yellow-600' : 
                          'from-red-500 to-red-600';
        return (
          <Badge className={`bg-gradient-to-r ${colorClass} text-white font-bold`}>
            {roundedValue}%
          </Badge>
        );
      }
    }
  ];

  // Monthly performance columns
  const monthlyColumns: Array<{
    key: keyof typeof monthlyPerformance[0];
    header: string;
    align?: 'left' | 'center' | 'right';
    render?: (value: any, item: any) => React.ReactNode;
  }> = [
    {
      key: 'month',
      header: 'Month',
      align: 'left',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-600" />
          <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 font-semibold">
            {value}
          </Badge>
        </div>
      )
    },
    {
      key: 'powerCycleSessions',
      header: 'PC Sessions',
      align: 'center',
      render: (value: number) => (
        <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 font-semibold">
          {formatSafeNumber(value)}
        </Badge>
      )
    },
    {
      key: 'barreSessions',
      header: 'Barre Sessions',
      align: 'center',
      render: (value: number) => (
        <Badge className="bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 font-semibold">
          {formatSafeNumber(value)}
        </Badge>
      )
    },
    {
      key: 'powerCycleAttendance',
      header: 'PC Attendance',
      align: 'center',
      render: (value: number) => (
        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold">
          {formatNumber(formatSafeNumber(value))}
        </Badge>
      )
    },
    {
      key: 'barreAttendance',
      header: 'Barre Attendance',
      align: 'center',
      render: (value: number) => (
        <Badge className="bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold">
          {formatNumber(formatSafeNumber(value))}
        </Badge>
      )
    },
    {
      key: 'powerCycleAvg',
      header: 'PC Avg',
      align: 'center',
      render: (value: number) => (
        <Badge variant="outline" className="border-blue-300 text-blue-700 font-medium">
          {safeToFixed(value)}
        </Badge>
      )
    },
    {
      key: 'barreAvg',
      header: 'Barre Avg',
      align: 'center',
      render: (value: number) => (
        <Badge variant="outline" className="border-pink-300 text-pink-700 font-medium">
          {safeToFixed(value)}
        </Badge>
      )
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      render: (value: number) => (
        <div className="flex items-center justify-end gap-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold">
            {formatCurrency(formatSafeNumber(value))}
          </Badge>
        </div>
      )
    }
  ];

  // Calculate totals for footer
  const instructorTotals = useMemo(() => {
    const totals = instructorAnalysis.reduce((acc, instructor) => ({
      totalSessions: acc.totalSessions + instructor.totalSessions,
      powerCycleSessions: acc.powerCycleSessions + instructor.powerCycleSessions,
      barreSessions: acc.barreSessions + instructor.barreSessions,
      totalAttendance: acc.totalAttendance + instructor.totalAttendance,
      powerCycleAttendance: acc.powerCycleAttendance + instructor.powerCycleAttendance,
      barreAttendance: acc.barreAttendance + instructor.barreAttendance
    }), {
      totalSessions: 0,
      powerCycleSessions: 0,
      barreSessions: 0,
      totalAttendance: 0,
      powerCycleAttendance: 0,
      barreAttendance: 0
    });

    return {
      name: 'TOTAL',
      totalSessions: totals.totalSessions,
      powerCycleSessions: totals.powerCycleSessions,
      barreSessions: totals.barreSessions,
      overallAvg: totals.totalSessions > 0 ? safeToFixed(totals.totalAttendance / totals.totalSessions) : '0.0',
      powerCycleAvg: totals.powerCycleSessions > 0 ? safeToFixed(totals.powerCycleAttendance / totals.powerCycleSessions) : '0.0',
      barreAvg: totals.barreSessions > 0 ? safeToFixed(totals.barreAttendance / totals.barreSessions) : '0.0',
      overallFillRate: '-'
    };
  }, [instructorAnalysis]);

  const monthlyTotals = useMemo(() => {
    const totals = monthlyPerformance.reduce((acc, month) => ({
      powerCycleSessions: acc.powerCycleSessions + month.powerCycleSessions,
      barreSessions: acc.barreSessions + month.barreSessions,
      powerCycleAttendance: acc.powerCycleAttendance + month.powerCycleAttendance,
      barreAttendance: acc.barreAttendance + month.barreAttendance,
      revenue: acc.revenue + month.revenue
    }), {
      powerCycleSessions: 0,
      barreSessions: 0,
      powerCycleAttendance: 0,
      barreAttendance: 0,
      revenue: 0
    });

    return {
      month: 'TOTAL',
      powerCycleSessions: totals.powerCycleSessions,
      barreSessions: totals.barreSessions,
      powerCycleAttendance: totals.powerCycleAttendance,
      barreAttendance: totals.barreAttendance,
      powerCycleAvg: totals.powerCycleSessions > 0 ? safeToFixed(totals.powerCycleAttendance / totals.powerCycleSessions) : '0.0',
      barreAvg: totals.barreSessions > 0 ? safeToFixed(totals.barreAttendance / totals.barreSessions) : '0.0',
      revenue: totals.revenue
    };
  }, [monthlyPerformance]);

  return (
    <div className="space-y-8">
      {/* Instructor Performance Table */}
      <Card className="bg-white shadow-xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-gray-200">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            Instructor Performance Analysis
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
              {instructorAnalysis.length} instructors
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Comparative analysis of instructor performance across PowerCycle and Barre sessions (minimum 3 sessions)
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={instructorAnalysis}
            columns={instructorColumns}
            maxHeight="500px"
            showFooter={true}
            footerData={instructorTotals}
            onRowClick={onItemClick}
          />
        </CardContent>
      </Card>

      {/* Monthly Performance Table */}
      <Card className="bg-white shadow-xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-b border-gray-200">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Monthly Performance Comparison
            <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold">
              {monthlyPerformance.length} months
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Month-over-month comparison of PowerCycle vs Barre performance metrics and revenue
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ModernDataTable
            data={monthlyPerformance}
            columns={monthlyColumns}
            maxHeight="500px"
            showFooter={true}
            footerData={monthlyTotals}
            onRowClick={onItemClick}
          />
        </CardContent>
      </Card>
    </div>
  );
});
