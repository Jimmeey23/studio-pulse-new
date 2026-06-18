import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FilterOptions } from '@/types/dashboard';

interface GlobalFiltersState {
  filters: FilterOptions;
  setFilters: (filters: FilterOptions | ((prev: FilterOptions) => FilterOptions)) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterOptions = {
  dateRange: { start: '', end: '' },
  location: [],
  category: [],
  product: [],
  soldBy: [],
  paymentMethod: [],
};

export const useGlobalFiltersStore = create<GlobalFiltersState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      
      setFilters: (filters) => set((state) => ({
        filters: typeof filters === 'function' ? filters(state.filters) : filters
      })),
      
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'global-filters-storage',
      partialize: (state) => ({ filters: state.filters }), // Only persist filters
    }
  )
);

// Selector hooks for better performance (only re-render when specific data changes)
export const useDateRangeFilter = () => useGlobalFiltersStore((state) => state.filters.dateRange);
export const useLocationFilter = () => useGlobalFiltersStore((state) => state.filters.location);
export const useCategoryFilter = () => useGlobalFiltersStore((state) => state.filters.category);
export const useProductFilter = () => useGlobalFiltersStore((state) => state.filters.product);
export const useSoldByFilter = () => useGlobalFiltersStore((state) => state.filters.soldBy);
export const usePaymentMethodFilter = () => useGlobalFiltersStore((state) => state.filters.paymentMethod);
