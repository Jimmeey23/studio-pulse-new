
import React, { useMemo, useEffect } from 'react';
import { SessionsSection } from '@/components/dashboard/SessionsSection';
import { Footer } from '@/components/ui/footer';
import { SessionsFiltersProvider } from '@/contexts/SessionsFiltersContext';
import DashboardMotionHero from '@/components/ui/DashboardMotionHero';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { formatNumber } from '@/utils/formatters';
import { AiNotes } from '@/components/ui/AiNotes';

const Sessions = () => {
  const { data, loading } = useSessionsData();
  const { setLoading } = useGlobalLoading();

  useEffect(() => {
    setLoading(loading, 'Loading session analytics...');
  }, [loading, setLoading]);

  const heroMetrics = useMemo(() => {
    if (!data || data.length === 0) return [];

    const locations = [
      { key: 'Kwality House, Kemps Corner', name: 'Kwality' },
      { key: 'Supreme HQ, Bandra', name: 'Supreme' },
      { key: 'Kenkere House', name: 'Kenkere' },
      { key: 'Pop-up', name: 'Pop-up' }
    ];

    return locations.map(location => {
      const locationData = data.filter(item => 
        location.key === 'Kenkere House' 
          ? item.location?.includes('Kenkere') || item.location === 'Kenkere House'
          : item.location === location.key
      );
      
      const totalCheckedIn = locationData.reduce((sum, item) => sum + (item.checkedInCount || 0), 0);
      
      return {
        location: location.name,
        label: 'Total Check-ins',
        value: formatNumber(totalCheckedIn)
      };
    });
  }, [data]);

  return (
    <SessionsFiltersProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50/20">
        <DashboardMotionHero 
          title="Sessions Analytics"
          subtitle="Comprehensive analysis of class sessions, attendance patterns, and performance insights"
          metrics={heroMetrics}
          onExportClick={() => {}}
        />
        <main>
          <SessionsSection />
          
          <div className="container mx-auto px-6 pb-8">
            <AiNotes 
              location="sessions"
              sectionId="sessions-overview" 
              tableKey="sessions-main"
              author="Sessions Analyst"
            />
          </div>
        </main>
        <Footer />
      </div>
    </SessionsFiltersProvider>
  );
};

export default Sessions;
