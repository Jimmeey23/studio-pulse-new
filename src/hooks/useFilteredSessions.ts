import { useMemo } from 'react';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { SessionData } from './useSessionsData';

export const useFilteredSessions = (sessions: SessionData[]) => {
  const { filters } = useGlobalFilters();

  // Convert location array to string for stable dependency comparison
  const locationKey = filters.location.join(',');
  
  const filteredSessions = useMemo(() => {
    const filtered = sessions.filter((session) => {
      // Apply date filter
      if (filters.dateRange.start && filters.dateRange.end) {
        const sessionDate = new Date(session.date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        if (sessionDate < startDate || sessionDate > endDate) {
          return false;
        }
      }

      // Apply location filter - normalize both values for comparison
      if (filters.location.length > 0) {
        const normalizeLocation = (loc: string) => {
          return loc.toLowerCase().trim();
        };
        
        const sessionLocationNormalized = normalizeLocation(session.location);
        const hasMatch = filters.location.some(filterLoc => {
          const filterLocationNormalized = normalizeLocation(filterLoc);
          return sessionLocationNormalized.includes(filterLocationNormalized) || 
                 filterLocationNormalized.includes(sessionLocationNormalized);
        });
        
        if (!hasMatch) {
          return false;
        }
      }

      return true;
    });

    return filtered;
  }, [sessions, filters.dateRange.start, filters.dateRange.end, locationKey]);

  return filteredSessions;
};
