
import React, { useState } from 'react';
import { ModernTableWrapper } from './ModernTableWrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedTable } from '@/components/ui/OptimizedTable';
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, Target, Award, Activity, Eye, BarChart3, Zap } from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { formatCurrency, formatNumber, formatRevenue } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { TrainerNameCell } from '@/components/ui/TrainerAvatar';
import { useTableCopyContext } from '@/hooks/useTableCopyContext';

interface TrainerDetailedPerformanceTableProps {
  data: any[];
  title?: string;
}

export const TrainerDetailedPerformanceTable: React.FC<TrainerDetailedPerformanceTableProps> = ({
  data,
  title = "Detailed Trainer Performance Analytics"
}) => {
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('totalRevenue');

  // Get context information for enhanced table copying
  const copyContext = useTableCopyContext();

  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(trainer => ({
      ...trainer,
      efficiency: trainer.totalSessions > 0 ? (trainer.totalPaid / trainer.totalSessions) : 0,
      avgClassSize: trainer.totalNonEmptySessions > 0 ? (trainer.totalCustomers / trainer.totalNonEmptySessions) : 0,
      utilizationRate: trainer.totalSessions > 0 ? ((trainer.totalSessions - (trainer.totalEmptySessions || 0)) / trainer.totalSessions) * 100 : 0,
      revenuePerCustomer: trainer.totalCustomers > 0 ? (trainer.totalPaid / trainer.totalCustomers) : 0
    })).sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [data, sortBy]);

  const handleTrainerClick = (trainerName: string) => {
    setSelectedTrainer(selectedTrainer === trainerName ? null : trainerName);
  };

  const columns = [
    {
      key: 'teacherName' as keyof typeof processedData[0],
      header: 'Trainer Name',
      align: 'left' as const,
      render: (value: any) => (
        <div className="flex items-center gap-3">
          <div>
            <TrainerNameCell name={value} className="text-nowrap" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTrainerClick(value)}
              className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto ml-10"
            >
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'totalSessions' as keyof typeof processedData[0],
      header: 'Total Sessions',
      align: 'center' as const,
      render: (value: any) => (
        <div className="text-center">
          <div className="font-bold text-slate-900">{formatNumber(value || 0)}</div>
          <Badge variant="secondary" className="text-xs mt-1">
            <Calendar className="w-3 h-3 mr-1" />
            Classes
          </Badge>
        </div>
      )
    },
    {
      key: 'totalCustomers' as keyof typeof processedData[0],
      header: 'Total Students',
      align: 'center' as const,
      render: (value: any) => (
        <div className="text-center">
          <div className="font-bold text-slate-900">{formatNumber(value || 0)}</div>
          <Badge variant="outline" className="text-xs mt-1 border-green-200 text-green-700">
            <Users className="w-3 h-3 mr-1" />
            Students
          </Badge>
        </div>
      )
    },
    {
      key: 'avgClassSize' as keyof typeof processedData[0],
      header: 'Avg Class Size',
      align: 'center' as const,
      render: (value: any) => (
        <div className="text-center">
          <div className="font-bold text-slate-900">{(value || 0).toFixed(1)}</div>
          <Badge variant="outline" className="text-xs mt-1 border-blue-200 text-blue-700">
            <Activity className="w-3 h-3 mr-1" />
            Per Class
          </Badge>
        </div>
      )
    },
    {
      key: 'utilizationRate' as keyof typeof processedData[0],
      header: 'Utilization Rate',
      align: 'center' as const,
      render: (value: any) => (
        <div className="text-center">
          <div className="font-bold text-slate-900">{(value || 0).toFixed(1)}%</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {(value || 0) > 80 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
              <Zap className="w-3 h-3 mr-1" />
              Efficiency
            </Badge>
          </div>
        </div>
      )
    },
    {
      key: 'efficiency' as keyof typeof processedData[0],
      header: 'Revenue/Session',
      align: 'center' as const,
      render: (value: any) => (
        <div className="text-center">
          <div className="font-bold text-slate-900">{formatRevenue(value || 0)}</div>
          <Badge variant="outline" className="text-xs mt-1 border-yellow-200 text-yellow-700">
            <DollarSign className="w-3 h-3 mr-1" />
            Efficiency
          </Badge>
        </div>
      )
    },
    {
      key: 'revenuePerCustomer' as keyof typeof processedData[0],
      header: 'Revenue/Student',
      align: 'center' as const,
      render: (value: any) => (
        <div className="text-center">
          <div className="font-bold text-slate-900">{formatRevenue(value || 0)}</div>
          <Badge variant="outline" className="text-xs mt-1 border-indigo-200 text-indigo-700">
            <Target className="w-3 h-3 mr-1" />
            Value
          </Badge>
        </div>
      )
    },
    {
      key: 'totalPaid' as keyof typeof processedData[0],
      header: 'Total Revenue',
      align: 'right' as const,
      render: (value: any) => (
        <div className="text-right">
          <div className="font-bold text-slate-900 text-lg">{formatRevenue(value || 0)}</div>
          <Badge variant="outline" className="text-xs mt-1 border-green-200 text-green-700">
            <Award className="w-3 h-3 mr-1" />
            Total
          </Badge>
        </div>
      )
    }
  ];

  const calculateTotals = () => {
    return processedData.reduce((totals, trainer) => ({
      totalSessions: totals.totalSessions + (trainer.totalSessions || 0),
      totalCustomers: totals.totalCustomers + (trainer.totalCustomers || 0),
      totalRevenue: totals.totalRevenue + (trainer.totalPaid || 0),
      avgEfficiency: totals.avgEfficiency + (trainer.efficiency || 0),
      avgUtilization: totals.avgUtilization + (trainer.utilizationRate || 0)
    }), { 
      totalSessions: 0, 
      totalCustomers: 0, 
      totalRevenue: 0, 
      avgEfficiency: 0, 
      avgUtilization: 0 
    });
  };

  const totals = calculateTotals();
  const trainerCount = processedData.length;

  if (!data || data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No trainer performance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ModernTableWrapper
      title={title}
      description={`Detailed performance analytics for ${processedData.length} trainers with efficiency metrics`}
      icon={<BarChart3 className="w-5 h-5" />}
      totalItems={processedData.length}
      contextInfo={{
        selectedMetric: sortBy,
        dateRange: copyContext.dateRange,
        filters: copyContext.filters,
        additionalInfo: {
          selectedTrainer: selectedTrainer,
          sortBy: sortBy,
          totalTrainers: processedData.length
        }
      }}
    >
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <OptimizedTable
          data={processedData}
          columns={columns}
          maxHeight="600px"
          stickyHeader={true}
          stickyFirstColumn={true}
          showFooter={true}
          footerData={{
            teacherName: 'TOTAL',
            totalSessions: totals.totalSessions,
            totalCustomers: totals.totalCustomers,
            avgClassSize: totals.totalSessions > 0 ? totals.totalCustomers / totals.totalSessions : 0,
            utilizationRate: trainerCount > 0 ? totals.avgUtilization / trainerCount : 0,
            efficiency: trainerCount > 0 ? totals.avgEfficiency / trainerCount : 0,
            revenuePerCustomer: totals.totalCustomers > 0 ? totals.totalRevenue / totals.totalCustomers : 0,
            totalPaid: totals.totalRevenue
          }}
        />

        {/* Detailed Summary Footer */}
        <div className="mt-6 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 animate-pulse" />
            Performance Analytics & Key Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h5 className="text-sm font-medium text-slate-600 mb-2">Overall Efficiency</h5>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(trainerCount > 0 ? totals.avgEfficiency / trainerCount : 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Average revenue per session</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h5 className="text-sm font-medium text-slate-600 mb-2">Utilization Rate</h5>
              <p className="text-2xl font-bold text-slate-900">
                {(trainerCount > 0 ? totals.avgUtilization / trainerCount : 0).toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Average class utilization</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h5 className="text-sm font-medium text-slate-600 mb-2">Student Value</h5>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(totals.totalCustomers > 0 ? totals.totalRevenue / totals.totalCustomers : 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Average revenue per student</p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
            <div className="space-y-1">
              <p>• <strong>{trainerCount}</strong> active trainers tracked</p>
              <p>• <strong>{formatNumber(totals.totalSessions)}</strong> total sessions delivered</p>
              <p>• <strong>{formatNumber(totals.totalCustomers)}</strong> students served</p>
            </div>
            <div className="space-y-1">
              <p>• Total revenue generated: <strong>{formatCurrency(totals.totalRevenue)}</strong></p>
              <p>• Top performer: <strong>{processedData[0]?.teacherName}</strong></p>
              <p>• Performance tracking across multiple efficiency metrics</p>
            </div>
          </div>
        </div>
      </div>
    </ModernTableWrapper>
  );
};
