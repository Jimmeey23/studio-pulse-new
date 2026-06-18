import React, { useMemo } from 'react';
import { AiNotes } from '@/components/ui/AiNotes';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

interface NotesBlockProps {
  tableKey: string;
  sectionId?: string;
  locationOverride?: string;
  periodOverride?: string;
  className?: string;
}

export const NotesBlock: React.FC<NotesBlockProps> = ({ tableKey, sectionId, locationOverride, periodOverride, className }) => {
  const { filters } = useGlobalFilters();
  const location = locationOverride ?? (filters.location?.[0] || 'all');
  const periodId = useMemo(() => (
    periodOverride ?? (filters?.dateRange ? `${filters.dateRange.start}:${filters.dateRange.end}` : 'all-time')
  ), [filters?.dateRange, periodOverride]);

  return (
    <div className={className || 'mt-3'}>
      <AiNotes tableKey={tableKey} location={location} period={periodId} sectionId={sectionId} />
    </div>
  );
};

export default NotesBlock;