/**
 * Data Extraction Service
 * Crawls through all pages and extracts tables, metrics, and data
 */

import { SalesData } from '@/types/dashboard';

/**
 * Generate unique table ID
 */
function generateTableId(page: string, title: string, location?: string, tab?: string): string {
  const parts = [
    page.toLowerCase().replace(/\s+/g, '-'),
    title.toLowerCase().replace(/\s+/g, '-'),
    location?.toLowerCase().replace(/[,\s]+/g, '-'),
    tab?.toLowerCase().replace(/\s+/g, '-'),
  ].filter(Boolean);
  
  return parts.join('_');
}

/**
 * Generate tags for table identification
 */
function generateTags(options: {
  page: string;
  section?: string;
  location?: string;
  tab?: string;
  subTab?: string;
  tableType?: string;
  additionalTags?: string[];
}): string[] {
  const tags: string[] = [];
  
  // Page tag
  tags.push(`page:${options.page}`);
  
  // Section tag
  if (options.section) {
    tags.push(`section:${options.section}`);
  }
  
  // Location tag
  if (options.location && options.location !== 'All Locations') {
    const locationShort = options.location.split(',')[0].trim();
    tags.push(`location:${locationShort}`);
  } else if (options.location === 'All Locations') {
    tags.push('location:all');
  }
  
  // Tab tag
  if (options.tab) {
    tags.push(`tab:${options.tab}`);
  }
  
  // SubTab tag
  if (options.subTab) {
    tags.push(`subtab:${options.subTab}`);
  }
  
  // Table type tag
  if (options.tableType) {
    tags.push(`type:${options.tableType}`);
  }
  
  // Additional custom tags
  if (options.additionalTags) {
    tags.push(...options.additionalTags);
  }
  
  return tags;
}

export interface ExtractedTable {
  id: string; // Unique identifier for the table
  title: string;
  subtitle?: string;
  location?: string;
  tab?: string;
  subTab?: string;
  headers: string[];
  rows: any[][];
  tags: string[]; // Tags for easy identification
  metadata?: {
    page: string;
    section?: string;
    timestamp: string;
    recordCount: number;
    tableType?: string; // e.g., "revenue", "attendance", "customer", etc.
  };
}

export interface ExtractedMetric {
  title: string;
  value: string | number;
  change?: string | number;
  location?: string;
  tab?: string;
  category: string;
  metadata?: {
    page: string;
    section?: string;
    timestamp: string;
  };
}

export interface ExtractedData {
  tables: ExtractedTable[];
  metrics: ExtractedMetric[];
  summary: {
    totalTables: number;
    totalMetrics: number;
    pages: string[];
    locations: string[];
    timestamp: string;
  };
}

/**
 * Page Data Registry - Maps pages to their data extraction functions
 */
export const PAGE_REGISTRY = {
  'Executive Summary': {
    path: '/',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'],
    dataHooks: ['useSalesData', 'useCheckinsData', 'useNewClientData'],
  },
  'Sales Analytics': {
    path: '/sales-analytics',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'],
    dataHooks: ['useSalesData', 'useDiscountsData'],
    tabs: ['Overview', 'Products', 'Trends', 'Discounts'],
  },
  'Client Retention': {
    path: '/client-retention',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'],
    dataHooks: ['useNewClientData', 'useCheckinsData'],
    tabs: ['New Clients', 'Retention Metrics', 'Conversion Funnel'],
  },
  'Trainer Performance': {
    path: '/trainer-performance',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'],
    dataHooks: ['usePayrollData', 'useCheckinsData'],
  },
  'Class Attendance': {
    path: '/class-attendance',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'],
    dataHooks: ['useCheckinsData', 'useSessionsData'],
    tabs: ['Attendance Overview', 'Class Formats', 'Time Analysis'],
  },
  'Class Formats Comparison': {
    path: '/class-formats-comparison',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'],
    dataHooks: ['useCheckinsData', 'useSessionsData'],
  },
  'Discounts & Promotions': {
    path: '/discounts-promotions',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'],
    dataHooks: ['useDiscountsData', 'useSalesData'],
    tabs: ['Discount Analysis', 'Product Performance', 'Customer Segments'],
  },
  'Sessions': {
    path: '/sessions',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'],
    dataHooks: ['useFilteredSessionsData'],
    tabs: ['All Sessions', 'By Trainer', 'By Class Type'],
  },
  'Expiration Analytics': {
    path: '/expiration-analytics',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'],
    dataHooks: ['useExpirationsData'],
  },
  'Late Cancellations': {
    path: '/late-cancellations',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'],
    dataHooks: ['useLateCancellationsData'],
  },
  'Funnel & Leads': {
    path: '/funnel-leads',
    locations: ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'],
    dataHooks: ['useLeadsData'],
  },
};

/**
 * Extract table data from a dataset
 */
export function extractTableFromData(
  title: string,
  data: any[],
  options: {
    location?: string;
    tab?: string;
    subTab?: string;
    page: string;
    section?: string;
    headers?: string[];
    tableType?: string;
    additionalTags?: string[];
  }
): ExtractedTable {
  if (!data || data.length === 0) {
    // Generate unique ID
    const id = generateTableId(options.page, title, options.location, options.tab);
    
    // Generate tags
    const tags = generateTags({
      page: options.page,
      section: options.section,
      location: options.location,
      tab: options.tab,
      subTab: options.subTab,
      tableType: options.tableType,
      additionalTags: options.additionalTags,
    });
    
    return {
      id,
      title,
      location: options.location,
      tab: options.tab,
      subTab: options.subTab,
      headers: options.headers || [],
      rows: [],
      tags,
      metadata: {
        page: options.page,
        section: options.section,
        timestamp: new Date().toISOString(),
        recordCount: 0,
        tableType: options.tableType,
      },
    };
  }

  // Auto-detect headers from first object if not provided
  const headers = options.headers || Object.keys(data[0]);

  // Convert data objects to rows
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      return value !== undefined && value !== null ? String(value) : '';
    })
  );

  // Generate unique ID
  const id = generateTableId(options.page, title, options.location, options.tab);
  
  // Generate tags
  const tags = generateTags({
    page: options.page,
    section: options.section,
    location: options.location,
    tab: options.tab,
    subTab: options.subTab,
    tableType: options.tableType,
    additionalTags: options.additionalTags,
  });

  return {
    id,
    title,
    location: options.location,
    tab: options.tab,
    subTab: options.subTab,
    headers,
    rows,
    tags,
    metadata: {
      page: options.page,
      section: options.section,
      timestamp: new Date().toISOString(),
      recordCount: data.length,
      tableType: options.tableType,
    },
  };
}

/**
 * Extract metrics from an object
 */
export function extractMetrics(
  metrics: Record<string, any>,
  options: {
    category: string;
    location?: string;
    tab?: string;
    page: string;
    section?: string;
  }
): ExtractedMetric[] {
  return Object.entries(metrics).map(([key, value]) => ({
    title: formatMetricTitle(key),
    value: typeof value === 'object' ? value.value : value,
    change: typeof value === 'object' ? value.change : undefined,
    location: options.location,
    tab: options.tab,
    category: options.category,
    metadata: {
      page: options.page,
      section: options.section,
      timestamp: new Date().toISOString(),
    },
  }));
}

/**
 * Format camelCase to Title Case
 */
function formatMetricTitle(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Filter data by location
 */
/**
 * Filter data by location
 */
export function filterByLocation(data: any[], location: string): any[] {
  if (!location || /^\s*all locations\s*$/i.test(location)) {
    return data;
  }

  const normalize = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = normalize(location);

  return data.filter(item => {
    const itemLocation = item.calculatedLocation || item.location || '';
    const itemNorm = normalize(itemLocation);

    // Match by inclusion of normalized tokens (handles Pop-up, Pop up, Popup, Kenkere/Bengaluru variants)
    if (!itemNorm) return false;
    return itemNorm.includes(target) || target.includes(itemNorm) || (target === 'kenkere' && itemNorm.includes('kenkere'));
  });
}

/**
 * Calculate summary metrics from sales data
 */
export function calculateSalesMetrics(data: SalesData[], location?: string) {
  const filteredData = location ? filterByLocation(data, location) : data;

  const totalRevenue = filteredData.reduce((sum, item) => sum + (item.grossRevenue || 0), 0);
  const totalTransactions = filteredData.length;
  const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const totalDiscount = filteredData.reduce((sum, item) => sum + (item.discountAmount || 0), 0);

  return {
    totalRevenue,
    totalTransactions,
    averageTransactionValue,
    totalDiscount,
    netRevenue: totalRevenue - totalDiscount,
  };
}

/**
 * Group data by a field
 */
export function groupBy<T>(data: T[], field: keyof T): Record<string, T[]> {
  return data.reduce((groups, item) => {
    const key = String(item[field] || 'Unknown');
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Extract top N items by a numeric field
 */
export function getTopN<T>(data: T[], field: keyof T, n: number = 10): T[] {
  return [...data]
    .sort((a, b) => {
      const aVal = Number(a[field]) || 0;
      const bVal = Number(b[field]) || 0;
      return bVal - aVal;
    })
    .slice(0, n);
}

/**
 * Convert table to different formats
 */
export function formatTableData(table: ExtractedTable, format: 'array' | 'object') {
  if (format === 'array') {
    return [table.headers, ...table.rows];
  }
  
  // Convert to array of objects
  return table.rows.map(row => {
    const obj: Record<string, any> = {};
    table.headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}
