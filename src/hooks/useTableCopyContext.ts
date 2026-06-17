import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

interface TableCopyContextOptions {
  selectedMetric?: string;
  additionalInfo?: Record<string, any>;
  includeFilters?: boolean;
}

/**
 * Hook to provide comprehensive context information for table copying functionality.
 * This automatically includes date range and filters from GlobalFiltersContext.
 */
export const useTableCopyContext = (options: TableCopyContextOptions = {}) => {
  const { filters } = useGlobalFilters();
  
  const getCopyContext = () => {
    const context: any = {};
    
    // Add selected metric if provided
    if (options.selectedMetric) {
      context.selectedMetric = options.selectedMetric;
    }
    
    // Add date range from global filters
    if (filters?.dateRange) {
      context.dateRange = filters.dateRange;
    }
    
    // Add filters if requested
    if (options.includeFilters !== false) { // Default to true
      const activeFilters: Record<string, any> = {};
      
      // Only include non-empty filters
      Object.entries(filters || {}).forEach(([key, value]) => {
        if (key === 'dateRange') return; // Already handled above
        
        if (Array.isArray(value) && value.length > 0) {
          activeFilters[key] = value;
        } else if (typeof value === 'string' && value !== '' && value !== 'All') {
          activeFilters[key] = value;
        } else if (typeof value === 'number' && value > 0) {
          activeFilters[key] = value;
        }
      });
      
      if (Object.keys(activeFilters).length > 0) {
        context.filters = activeFilters;
      }
    }
    
    // Add any additional custom information
    if (options.additionalInfo) {
      context.additionalInfo = options.additionalInfo;
    }
    
    return context;
  };
  
  return {
    getCopyContext,
    contextInfo: getCopyContext()
  };
};

export default useTableCopyContext;