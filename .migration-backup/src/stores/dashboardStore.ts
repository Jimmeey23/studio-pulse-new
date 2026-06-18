import { create } from 'zustand';
import { SessionData } from '@/types';

interface DashboardState {
  // Data
  filteredData: SessionData[];
  
  // Rankings settings
  includeTrainerInRankings: boolean;
  excludeHostedClasses: boolean;
  
  // Filters
  filters: {
    minCheckins: number;
    minClasses: number;
    searchQuery: string;
    statusFilter: string;
  };
  
  // Actions
  setIncludeTrainerInRankings: (include: boolean) => void;
  setExcludeHostedClasses: (exclude: boolean) => void;
  setFilters: (filters: Partial<DashboardState['filters']>) => void;
  setFilteredData: (data: SessionData[]) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  filteredData: [],
  includeTrainerInRankings: false,
  excludeHostedClasses: false,
  filters: {
    minCheckins: 0,
    minClasses: 0,
    searchQuery: '',
    statusFilter: 'All',
  },
  
  setIncludeTrainerInRankings: (include) => 
    set({ includeTrainerInRankings: include }),
  
  setExcludeHostedClasses: (exclude) => 
    set({ excludeHostedClasses: exclude }),
  
  setFilters: (newFilters) => 
    set((state) => ({ 
      filters: { ...state.filters, ...newFilters } 
    })),
  
  setFilteredData: (data) => 
    set({ filteredData: data }),
}));