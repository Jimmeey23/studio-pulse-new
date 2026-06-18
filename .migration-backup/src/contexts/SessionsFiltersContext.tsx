
import * as React from 'react';
import { ReactNode } from 'react';
import { getDashboardDefaultDateRange } from '@/utils/dateUtils';
import { getActiveConsolidatedExportPreset, getConsolidatedStudioOption } from '@/utils/consolidatedExportPreset';

interface SessionsFilters {
  locations: string[];
  trainers: string[];
  classTypes: string[];
  dayOfWeek: string[];
  timeSlots: string[];
  dateRange: { start: Date | null; end: Date | null };
}

interface SessionsFiltersContextType {
  filters: SessionsFilters;
  updateFilters: (newFilters: Partial<SessionsFilters>) => void;
  clearFilters: () => void;
  clearAllFilters: () => void;
}

const SessionsFiltersContext = React.createContext<SessionsFiltersContextType | undefined>(undefined);

export const useSessionsFilters = () => {
  const context = React.useContext(SessionsFiltersContext);
  if (!context) {
    console.error('useSessionsFilters must be used within a SessionsFiltersProvider. Returning fallback values.');
    // Return a fallback context
    return {
      filters: {
        locations: [],
        trainers: [],
        classTypes: [],
        dayOfWeek: [],
        timeSlots: [],
        dateRange: { start: null, end: null }
      },
      updateFilters: () => {},
      clearFilters: () => {},
      clearAllFilters: () => {}
    };
  }
  return context;
};

interface SessionsFiltersProviderProps {
  children: ReactNode;
}

export const SessionsFiltersProvider: React.FC<SessionsFiltersProviderProps> = ({ children }) => {
  const [filters, setFilters] = React.useState<SessionsFilters>(() => {
    const preset = typeof window !== 'undefined' ? getActiveConsolidatedExportPreset(window.location.search) : null;
    const studioOption = preset ? getConsolidatedStudioOption(preset.studioId) : null;
    // Set default date range to the previous complete month
    const defaultDateRange = getDashboardDefaultDateRange();
    return {
      locations: preset && preset.studioId !== 'all' ? [studioOption?.locationLabel || 'Kwality House, Kemps Corner'] : [],
      trainers: [],
      classTypes: [],
      dayOfWeek: [],
      timeSlots: [],
      dateRange: { 
        start: new Date(preset?.startDate || defaultDateRange.start), 
        end: new Date(preset?.endDate || defaultDateRange.end) 
      }
    };
  });

  const updateFilters = (newFilters: Partial<SessionsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    const preset = typeof window !== 'undefined' ? getActiveConsolidatedExportPreset(window.location.search) : null;
    const studioOption = preset ? getConsolidatedStudioOption(preset.studioId) : null;
    const defaultDateRange = getDashboardDefaultDateRange();
    setFilters({
      locations: preset && preset.studioId !== 'all' ? [studioOption?.locationLabel || 'Kwality House, Kemps Corner'] : [],
      trainers: [],
      classTypes: [],
      dayOfWeek: [],
      timeSlots: [],
      dateRange: { 
        start: new Date(preset?.startDate || defaultDateRange.start), 
        end: new Date(preset?.endDate || defaultDateRange.end) 
      }
    });
  };

  const clearAllFilters = clearFilters;

  return (
    <SessionsFiltersContext.Provider value={{
      filters,
      updateFilters,
      clearFilters,
      clearAllFilters
    }}>
      {children}
    </SessionsFiltersContext.Provider>
  );
};
