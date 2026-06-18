import React from 'react';
import { Footer } from '@/components/ui/footer';
import { LocationReportComprehensive } from '@/components/dashboard/LocationReportComprehensive';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { format } from 'date-fns';

const LocationReportPage = () => {
  const { setLoading } = useGlobalLoading();
  const { filters } = useGlobalFilters();
  const [isReady, setIsReady] = React.useState(false);
  const selectedMonth = React.useMemo(() => {
    const end = new Date(`${filters.dateRange.end}T00:00:00`);
    return Number.isNaN(end.getTime()) ? 'Selected month' : format(end, 'MMMM yyyy');
  }, [filters.dateRange.end]);

  const selectedLocations = React.useMemo(() => {
    if (!filters.location.length) return ['All locations'];
    return filters.location;
  }, [filters.location]);

  const handleReady = React.useCallback(() => {
    setIsReady(true);
    setLoading(false);
  }, [setLoading]);

  React.useEffect(() => {
    setLoading(true, 'Loading location reports...');
  }, [setLoading]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#ECECEC]">
      <div className="mx-auto max-w-[1380px] px-0 pb-10">
        <LocationReportComprehensive onReady={handleReady} />
      </div>

      <Footer />
    </div>
  );
};

export default LocationReportPage;
