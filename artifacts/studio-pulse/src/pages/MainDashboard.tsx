import { SectionLayout } from '@/components/layout/SectionLayout';
import Rankings from '@/components/dashboard/Rankings';
import { DataTableEnhanced } from '@/components/dashboard/DataTableEnhanced';
import { MetricsCardsEnhanced } from '@/components/dashboard/MetricsCardsEnhanced';
import { ExecutiveFilterSection } from '@/components/dashboard/ExecutiveFilterSection';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useFilteredSessions } from '@/hooks/useFilteredSessions';
import { useMemo } from 'react';

export default function MainDashboard() {
  const { data: sessions = [] } = useSessionsData();
  const filteredSessions = useFilteredSessions(sessions);

  // Get unique locations for filter
  const availableLocations = useMemo(() => {
    const locations = new Set(sessions.map(s => s.location).filter(Boolean));
    return Array.from(locations).sort();
  }, [sessions]);

  return (
    <SectionLayout title="Main Dashboard">
      <div className="space-y-8">
        {/* Filter Section */}
        <ExecutiveFilterSection availableLocations={availableLocations} />
        
        {/* Metrics Cards Section */}
        <MetricsCardsEnhanced sessions={filteredSessions} />
        
        {/* Rankings Section */}
        <Rankings sessions={filteredSessions} />
        
        {/* Data Table Section */}
        <DataTableEnhanced sessions={filteredSessions} />
      </div>
    </SectionLayout>
  );
}
