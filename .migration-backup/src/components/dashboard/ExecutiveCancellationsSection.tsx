import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { LateCancellationsMetricCards } from './LateCancellationsMetricCards';
import { LateCancellationsMonthOnMonthTable } from './LateCancellationsMonthOnMonthTable';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { parseDate } from '@/utils/dateUtils';

interface ExecutiveCancellationsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveCancellationsSection: React.FC<ExecutiveCancellationsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: cancellationsData, loading: cancellationsLoading } = useLateCancellationsData();
  const { filters } = useGlobalFilters();

  // Filter cancellations by date range and location
  const filteredCancellations = useMemo(() => {
    if (!cancellationsData) return [];

    return cancellationsData.filter(cancellation => {
      // Apply date range filter
      if (filters.dateRange?.start && filters.dateRange?.end) {
        const dateStr = (cancellation.dateIST || '').toString();
        const cancellationDate = dateStr ? parseDate(dateStr) : null;
        const filterStart = new Date(filters.dateRange.start);
        const filterEnd = new Date(filters.dateRange.end);
        filterEnd.setHours(23, 59, 59, 999);

        if (!cancellationDate || cancellationDate < filterStart || cancellationDate > filterEnd) {
          return false;
        }
      }

      // Apply location filter
      if (filters.location && filters.location.length > 0) {
        const locations = Array.isArray(filters.location) ? filters.location : [filters.location];
        const locStr = (cancellation.location || '').toString();
        if (!locations.includes('all') && !locations.some(loc => locStr?.includes(loc))) {
          return false;
        }
      }

      return true;
    });
  }, [cancellationsData, filters.dateRange, filters.location]);

  if (cancellationsLoading) {
    return (
      <ExecutiveSectionCard
        title="Late Cancellations"
        icon={Clock}
        borderColor="rose"
        description="Cancellation trends, patterns, and recovery opportunities"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <ExecutiveSectionCard
      title="Late Cancellations"
      icon={Clock}
      borderColor="rose"
      description="Cancellation trends, patterns, and recovery opportunities"
      contentClassName="space-y-6"
    >
      {/* Metric Cards */}
      <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
        <LateCancellationsMetricCards data={filteredCancellations} />
      </div>

      {/* Cancellations Table */}
      {filteredCancellations && filteredCancellations.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Cancellations by Time Period</h4>
          <LateCancellationsMonthOnMonthTable data={filteredCancellations} />
        </div>
      )}
    </ExecutiveSectionCard>
  );
};

export default ExecutiveCancellationsSection;
