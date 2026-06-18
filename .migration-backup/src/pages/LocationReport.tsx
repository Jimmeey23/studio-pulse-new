import React from 'react';
import { Footer } from '@/components/ui/footer';
import { LocationReportComprehensive } from '@/components/dashboard/LocationReportComprehensive';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

const LocationReportPage = () => {
  const { setLoading } = useGlobalLoading();
  const { filters } = useGlobalFilters();
  const [searchParams] = useSearchParams();
  const [isReady, setIsReady] = React.useState(false);
  const studioParam = searchParams.get('studio')?.toLowerCase() || '';
  const endParam = searchParams.get('to') || filters.dateRange.end;
  const isStaticMay2026Report = React.useMemo(() => {
    const end = new Date(`${endParam}T00:00:00`);
    const isMay2026 = !Number.isNaN(end.getTime()) && end.getFullYear() === 2026 && end.getMonth() === 4;
    return isMay2026 && (
      studioParam.includes('kwality') ||
      studioParam.includes('supreme') ||
      studioParam.includes('bandra')
    );
  }, [endParam, studioParam]);
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
    if (isStaticMay2026Report) {
      setLoading(false);
      return;
    }

    setLoading(true, 'Loading location reports...');
  }, [isStaticMay2026Report, setLoading]);

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
