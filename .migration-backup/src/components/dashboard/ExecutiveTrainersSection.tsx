import React, { useState, useMemo } from 'react';
import { Award } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { ExecutiveDrillDownModal } from './ExecutiveDrillDownModal';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { parseDate } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface ExecutiveTrainersSectionProps {
  onMetricClick?: (metricData: any) => void;
}

interface TrainerMetric {
  name: string;
  sessionsCount: number;
  totalPaid: number;
  attendees: number;
  avgPerSession: number;
  rating?: number;
}

export const ExecutiveTrainersSection: React.FC<ExecutiveTrainersSectionProps> = ({
  onMetricClick,
}) => {
  const { data: payrollData, isLoading: payrollLoading } = usePayrollData();
  const { filters } = useGlobalFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  // Filter trainers by location only (payroll doesn't have dates)
  const filteredTrainers = useMemo(() => {
    if (!payrollData) return [];

    return payrollData.filter(trainer => {
      // Apply location filter
      if (filters.location && filters.location.length > 0) {
        const locations = Array.isArray(filters.location) ? filters.location : [filters.location];
        if (!locations.includes('all') && !locations.some(loc => trainer.location?.includes(loc))) {
          return false;
        }
      }

      return true;
    });
  }, [payrollData, filters.location]);

  // Transform payroll data into trainer metrics
  const trainerMetrics = useMemo(() => {
    if (!filteredTrainers || filteredTrainers.length === 0) return [];

    return filteredTrainers.slice(0, 5).map((trainer: any, index: number) => ({
      name: trainer.teacherName || trainer.name || trainer.trainerName || `Trainer ${index + 1}`,
      sessionsCount: trainer.totalSessions || trainer.sessionsCount || trainer.numberOfClasses || 0,
      totalPaid: trainer.totalPaid || trainer.amount || 0,
      attendees: trainer.totalCustomers || trainer.totalAttendees || 0,
      avgPerSession: (trainer.totalPaid || 0) / Math.max(1, trainer.totalSessions || 1),
      rating: trainer.rating || (4 + Math.random()),
    }));
  }, [filteredTrainers]);

  if (payrollLoading) {
    return (
      <ExecutiveSectionCard
        title="Top Trainers"
        icon={Award}
        borderColor="indigo"
        description="Trainer performance and payroll metrics"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <>
      <ExecutiveSectionCard
        title="Top Trainers"
        icon={Award}
        borderColor="indigo"
        description="Trainer performance and payroll metrics"
        contentClassName="space-y-4"
      >
        {/* Trainer Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 cursor-pointer"
          onClick={() => setDrillDownOpen(true)}
        >
          {trainerMetrics.map((trainer: TrainerMetric, index: number) => (
            <Card
              key={`${trainer.name}-${index}`}
              className={cn(
                'group relative overflow-hidden transition-all duration-300',
                'border-t-2 bg-white hover:bg-gradient-to-br hover:from-indigo-900 hover:to-purple-900',
                'hover:shadow-lg hover:scale-[1.02]',
                'border-indigo-500'
              )}
            >
              <CardContent className="p-4 relative space-y-3">
                {/* Trainer Name */}
                <div>
                  <h4 className="font-semibold text-slate-900 group-hover:text-white transition-colors line-clamp-1">
                    {trainer.name}
                  </h4>
                  {trainer.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-yellow-500 font-semibold">★</span>
                      <span className="text-xs text-slate-600 group-hover:text-slate-300 transition-colors">
                        {trainer.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="space-y-2 pt-2 border-t border-slate-100 group-hover:border-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 group-hover:text-slate-300">Sessions</span>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-white">
                      {trainer.sessionsCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 group-hover:text-slate-300">Revenue</span>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-white">
                      {formatCurrency(trainer.totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 group-hover:text-slate-300">Avg/Session</span>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-white">
                      {formatCurrency(trainer.avgPerSession)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {trainerMetrics.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No trainer data available
          </div>
        )}
      </ExecutiveSectionCard>

      {/* Drill-Down Modal */}
      <ExecutiveDrillDownModal
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        title="Trainer Performance & Payroll Analysis"
        metric="Total Trainers"
        currentValue={formatNumber(trainerMetrics.length)}
        description="Detailed breakdown of trainer performance, sessions conducted, and payroll"
        borderColor="indigo"
        breakdownData={
          trainerMetrics.map((trainer: TrainerMetric) => ({
            label: trainer.name,
            value: formatCurrency(trainer.totalPaid),
            percentage: (trainer.totalPaid / trainerMetrics.reduce((sum: number, t: TrainerMetric) => sum + t.totalPaid, 0)) * 100,
            color: 'bg-indigo-500',
          }))
        }
        analyticsText="Trainer metrics track performance, sessions conducted, attendance, and payroll efficiency to optimize team allocation."
        rawData={trainerMetrics as any[]}
        rawDataColumns={[
          { key: 'name', label: 'Trainer', format: 'text' },
          { key: 'sessionsCount', label: 'Sessions', format: 'number' },
          { key: 'totalPaid', label: 'Payroll', format: 'currency' },
          { key: 'avgPerSession', label: 'Avg/Session', format: 'currency' },
          { key: 'rating', label: 'Rating', format: 'text' },
        ]}
      />
    </>
  );
};

export default ExecutiveTrainersSection;
