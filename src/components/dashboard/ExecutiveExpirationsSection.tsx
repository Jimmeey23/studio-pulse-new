import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { ExpirationMetricCards } from './ExpirationMetricCards';
import { ExpirationDataTables } from './ExpirationDataTables';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { parseDate } from '@/utils/dateUtils';

interface ExecutiveExpirationsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveExpirationsSection: React.FC<ExecutiveExpirationsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: expirationsData, loading: expirationsLoading } = useExpirationsData();
  const { filters } = useGlobalFilters();

  // Filter expirations by date range and location
  const filteredExpirations = useMemo(() => {
    if (!expirationsData) return [];

    return expirationsData.filter(expiration => {
      // Apply date range filter
      if (filters.dateRange?.start && filters.dateRange?.end) {
        const expirationDate = parseDate(expiration.endDate);
        const filterStart = new Date(filters.dateRange.start);
        const filterEnd = new Date(filters.dateRange.end);
        filterEnd.setHours(23, 59, 59, 999);

        if (!expirationDate || expirationDate < filterStart || expirationDate > filterEnd) {
          return false;
        }
      }

      // Apply location filter
      if (filters.location && filters.location.length > 0) {
        const locations = Array.isArray(filters.location) ? filters.location : [filters.location];
        if (!locations.includes('all') && !locations.some(loc => expiration.homeLocation?.includes(loc))) {
          return false;
        }
      }

      return true;
    });
  }, [expirationsData, filters.dateRange, filters.location]);

  if (expirationsLoading) {
    return (
      <ExecutiveSectionCard
        title="Membership Expirations"
        icon={AlertCircle}
        borderColor="sky"
        description="Upcoming expirations and retention opportunities"
      >
        <div className="flex items-center justify-center py-12">
          <BrandSpinner />
        </div>
      </ExecutiveSectionCard>
    );
  }

  return (
    <ExecutiveSectionCard
      title="Membership Expirations"
      icon={AlertCircle}
      borderColor="sky"
      description="Upcoming expirations and retention opportunities"
      contentClassName="space-y-6"
    >
      {/* Metric Cards */}
      <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
        <ExpirationMetricCards data={filteredExpirations} />
      </div>

      {/* Expirations Table */}
      {filteredExpirations && filteredExpirations.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Expiration Details</h4>
          <ExpirationDataTables data={filteredExpirations} />
        </div>
      )}
    </ExecutiveSectionCard>
  );
};

export default ExecutiveExpirationsSection;
