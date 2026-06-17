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
    <div className="min-h-screen bg-[#f4f1ea] text-[#15171a]">
      <div className="mx-auto max-w-[1720px] px-4 pb-10 pt-4 sm:px-5 lg:px-6">
        <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-[#dfe4ea] bg-[rgba(244,241,234,0.94)] px-4 py-3 backdrop-blur-md sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#17181b] text-sm font-extrabold tracking-[0.12em] text-white">
                P57
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#a8792a]">Executive Studio Performance Dashboard</div>
                <div className="text-sm text-[#5d6673]">{selectedMonth} · {selectedLocations.join(' / ')}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[#5d6673]">
              <span className="rounded-full border border-[#dfe4ea] bg-white px-3 py-2">Report view</span>
              <span className="rounded-full border border-[#dfe4ea] bg-white px-3 py-2">Selected month</span>
              <span className="rounded-full border border-[#dfe4ea] bg-white px-3 py-2">Selected locations</span>
            </div>
          </div>
        </div>

        <LocationReportComprehensive onReady={handleReady} />
      </div>

      <Footer />
    </div>
  );
};

export default LocationReportPage;
