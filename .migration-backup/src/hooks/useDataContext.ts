import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useSessionsFilters } from '@/contexts/SessionsFiltersContext';
import { useMemo } from 'react';

// Hook to extract relevant contextual data for AI summary generation
export const useDataContext = (context: string, locationId: string) => {
  const { filters: globalFilters } = useGlobalFilters();
  
  // Try to get sessions filters if available
  let sessionsFilters = null;
  try {
    const { filters } = useSessionsFilters();
    sessionsFilters = filters;
  } catch {
    // Sessions filters not available in this context
  }

  const extractedData = useMemo(() => {
    // Extract data from the current page/DOM context
    const data = extractCurrentPageData(context, locationId);
    
    // Combine all active filters
    const activeFilters = {
      ...globalFilters,
      ...(sessionsFilters ? { sessions: sessionsFilters } : {})
    };

    // Clean up filters to only include non-empty values
    const cleanedFilters = Object.entries(activeFilters).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          acc[key] = value;
        } else if (typeof value === 'string' && value !== '') {
          acc[key] = value;
        } else if (typeof value === 'object' && Object.keys(value).length > 0) {
          acc[key] = value;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    return {
      data,
      activeFilters: cleanedFilters,
      dateRange: globalFilters.dateRange,
      tableName: getTableName(context)
    };
  }, [context, locationId, globalFilters, sessionsFilters]);

  return extractedData;
};

// Extract data from the current page context
function extractCurrentPageData(context: string, locationId: string): any[] {
  try {
    // First, try to extract data from visible tables on the page
    const tableData = extractTableData();
    if (tableData.length > 0) {
      return tableData;
    }
    
    // If no table data, try to extract metrics from cards/components
    const metricsData = extractMetricsData(context, locationId);
    if (metricsData.length > 0) {
      return metricsData;
    }
    
    // Fallback: create sample data based on context
    return createFallbackData(context, locationId);
  } catch (error) {
    console.warn('Failed to extract page data:', error);
    return createFallbackData(context, locationId);
  }
}

// Extract data from visible tables on the page
function extractTableData(): any[] {
  const tables = document.querySelectorAll('table');
  const data: any[] = [];
  
  tables.forEach(table => {
    try {
      const headers = Array.from(table.querySelectorAll('thead th, thead td')).map(th => 
        th.textContent?.trim() || ''
      );
      
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      
      rows.forEach((row, index) => {
        if (index >= 50) return; // Limit to first 50 rows for performance
        
        const cells = Array.from(row.querySelectorAll('td'));
        const rowData: any = { _rowIndex: index };
        
        cells.forEach((cell, cellIndex) => {
          const header = headers[cellIndex] || `Column_${cellIndex}`;
          const value = cell.textContent?.trim() || '';
          
          // Try to parse numeric values
          const numericValue = parseFloat(value.replace(/[,$₹%]/g, ''));
          if (!isNaN(numericValue) && value.match(/[\d.,]+/)) {
            rowData[header] = numericValue;
            rowData[`${header}_raw`] = value;
          } else {
            rowData[header] = value;
          }
        });
        
        if (Object.keys(rowData).length > 1) { // More than just _rowIndex
          data.push(rowData);
        }
      });
    } catch (error) {
      console.warn('Failed to extract table data:', error);
    }
  });
  
  return data;
}

// Extract metrics from cards and other UI components
function extractMetricsData(context: string, locationId: string): any[] {
  const data: any[] = [];
  
  try {
    // Look for metric cards, stat cards, or similar components
    const metricSelectors = [
      '[class*="metric"]',
      '[class*="card"]',
      '[class*="stat"]',
      '[data-metric]',
      '.bg-white',
      '.border'
    ];
    
    metricSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach((element, index) => {
        const text = element.textContent?.trim();
        if (text && text.length > 10 && text.length < 500) {
          // Extract numbers from the text
          const numbers = text.match(/[\d,.-]+/g);
          const metrics: any = {
            _source: 'ui_component',
            _index: index,
            _selector: selector,
            text: text.substring(0, 200), // Truncate long text
            context,
            locationId
          };
          
          if (numbers) {
            numbers.forEach((num, numIndex) => {
              const cleanNum = parseFloat(num.replace(/[,₹$]/g, ''));
              if (!isNaN(cleanNum)) {
                metrics[`value_${numIndex}`] = cleanNum;
                metrics[`value_${numIndex}_raw`] = num;
              }
            });
          }
          
          if (Object.keys(metrics).length > 5) { // Has some actual data
            data.push(metrics);
          }
        }
      });
    });
  } catch (error) {
    console.warn('Failed to extract metrics data:', error);
  }
  
  return data.slice(0, 20); // Limit to 20 items
}

// Create fallback data when no real data is available
function createFallbackData(context: string, locationId: string): any[] {
  const baseData = {
    context,
    locationId,
    timestamp: new Date().toISOString(),
    dataSource: 'fallback',
    _extractionNote: 'Generated fallback data for AI analysis'
  };

  // Create context-specific sample data
  switch (context) {
    case 'sales-overview':
    case 'sales-metrics':
      return [
        {
          ...baseData,
          totalRevenue: 145000,
          transactionCount: 234,
          avgTransactionValue: 620,
          month: 'December 2024',
          location: locationId
        }
      ];
      
    case 'sessions-overview':
    case 'class-formats-overview':
      return [
        {
          ...baseData,
          totalSessions: 156,
          totalAttendance: 1240,
          avgAttendancePerSession: 8,
          popularFormat: 'Barre',
          month: 'December 2024',
          location: locationId
        }
      ];
      
    case 'client-retention-overview':
      return [
        {
          ...baseData,
          totalClients: 420,
          activeClients: 310,
          retentionRate: 73.8,
          churnRate: 26.2,
          month: 'December 2024',
          location: locationId
        }
      ];
      
    default:
      return [
        {
          ...baseData,
          sampleMetric: 100,
          anotherMetric: 85.5,
          status: 'Active',
          month: 'December 2024'
        }
      ];
  }
}

// Get user-friendly table name based on context
function getTableName(context: string): string {
  const contextMapping: Record<string, string> = {
    'sales-overview': 'Sales Analytics',
    'sales-metrics': 'Sales Performance Metrics',
    'sales-top-bottom': 'Top & Bottom Performers',
    'sales-mom': 'Month-over-Month Sales',
    'sales-yoy': 'Year-over-Year Sales',
    'sales-product': 'Product Performance',
    'sales-category': 'Category Analysis',
    'sessions-overview': 'Sessions Analytics',
    'class-formats-overview': 'Class Format Analysis', 
    'client-retention-overview': 'Client Retention Metrics',
    'expiration-analytics-overview': 'Membership Expiration Analysis',
    'funnel-leads-overview': 'Lead Funnel Analytics',
    'trainer-performance-overview': 'Trainer Performance',
    'discounts-promotions-overview': 'Discounts & Promotions',
    'patterns-trends-overview': 'Patterns & Trends Analysis',
    'outlier-analysis-overview': 'Outlier Detection',
    'executive-overview': 'Executive Dashboard'
  };

  return contextMapping[context] || context.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Hook to get current page data (this would be implemented per page)
export const useCurrentPageData = (context: string) => {
  return useMemo(() => {
    return {
      data: extractCurrentPageData(context, 'current'),
      loading: false,
      error: null
    };
  }, [context]);
};

// Hook to detect data changes and invalidate summaries
export const useDataChangeDetection = (data: any[], filters: any) => {
  return useMemo(() => {
    // Generate a simple hash of the data and filters
    const dataSignature = JSON.stringify({
      recordCount: data.length,
      filters: filters,
      firstRecord: data[0] || null,
      lastRecord: data[data.length - 1] || null,
      timestamp: Math.floor(Date.now() / (1000 * 60 * 5)) // Update every 5 minutes
    });
    
    return btoa(dataSignature).substring(0, 16);
  }, [data, filters]);
};