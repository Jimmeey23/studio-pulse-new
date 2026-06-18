import React, { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import { ExecutiveSectionCard } from './ExecutiveSectionCard';
import { ExecutiveDrillDownModal } from './ExecutiveDrillDownModal';
import { SessionsMetricCards } from './SessionsMetricCards';
import { SessionsGroupedTable } from './SessionsGroupedTable';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { formatNumber } from '@/utils/formatters';
import { parseDate } from '@/utils/dateUtils';

interface ExecutiveSessionsSectionProps {
  onMetricClick?: (metricData: any) => void;
}

export const ExecutiveSessionsSection: React.FC<ExecutiveSessionsSectionProps> = ({
  onMetricClick,
}) => {
  const { data: sessionsData, loading: sessionsLoading } = useSessionsData();
  const { filters } = useGlobalFilters();
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  // Filter sessions by date range and location
  const filteredSessions = useMemo(() => {
    if (!sessionsData) return [];

    return sessionsData.filter(session => {
      // Apply date range filter
      if (filters.dateRange?.start && filters.dateRange?.end) {
        const sessionDate = parseDate(session.date);
        const filterStart = new Date(filters.dateRange.start);
        const filterEnd = new Date(filters.dateRange.end);
        filterEnd.setHours(23, 59, 59, 999);

        if (!sessionDate || sessionDate < filterStart || sessionDate > filterEnd) {
          return false;
        }
      }

      // Apply location filter
      if (filters.location && filters.location.length > 0) {
        const locations = Array.isArray(filters.location) ? filters.location : [filters.location];
        if (!locations.includes('all') && !locations.some(loc => session.location?.includes(loc))) {
          return false;
        }
      }

      return true;
    });
  }, [sessionsData, filters.dateRange, filters.location]);

  if (sessionsLoading) {
    return (
      <ExecutiveSectionCard
        title="Sessions Overview"
        icon={Activity}
        borderColor="blue"
        description="Total sessions, fill rates, and attendance metrics"
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
        title="Sessions Overview"
        icon={Activity}
        borderColor="blue"
        description="Total sessions, fill rates, and attendance metrics"
        contentClassName="space-y-6"
      >
        {/* Metric Cards */}
        <div
          className="cursor-pointer"
          onClick={() => setDrillDownOpen(true)}
        >
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Metrics</h4>
          <SessionsMetricCards data={filteredSessions} />
        </div>

        {/* Sessions Table */}
        {filteredSessions && filteredSessions.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Class Schedule & Attendance</h4>
            <SessionsGroupedTable data={filteredSessions} />
          </div>
        )}
      </ExecutiveSectionCard>

      {/* Drill-Down Modal */}
      <ExecutiveDrillDownModal
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        title="Sessions Analysis"
        metric="Total Sessions"
        currentValue={formatNumber(filteredSessions?.length || 0)}
        description="Detailed breakdown of session and attendance metrics"
        borderColor="blue"
        breakdownData={
          filteredSessions
            ?.slice(0, 5)
            .map((session: any, idx: number) => ({
              label: `${session.name || `Session ${idx + 1}`}`,
              value: formatNumber(session.checkedInCount || 0),
              percentage: ((session.checkedInCount || 0) / (filteredSessions?.reduce((sum: number, s: any) => sum + (s.checkedInCount || 0), 0) || 1)) * 100,
              color: 'bg-blue-500',
            })) || []
        }
        analyticsText="Session metrics track class attendance, capacity utilization, and fill rates to optimize scheduling and resource allocation."
        rawData={filteredSessions?.slice(0, 20) || []}
        rawDataColumns={[
          { key: 'date', label: 'Date', format: 'text' },
          { key: 'sessionName', label: 'Class', format: 'text' },
          { key: 'checkedInCount', label: 'Attendance', format: 'number' },
          { key: 'capacity', label: 'Capacity', format: 'number' },
        ]}
      />
    </>
  );
};

export default ExecutiveSessionsSection;
