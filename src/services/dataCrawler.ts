/**
 * Data Crawler Service
 * Orchestrates data extraction across all pages, locations, and tabs
 */

import { 
  ExtractedData, 
  ExtractedTable, 
  ExtractedMetric,
  extractTableFromData,
  extractMetrics,
  filterByLocation,
  calculateSalesMetrics,
  groupBy,
  getTopN,
  PAGE_REGISTRY
} from './dataExtraction';

export interface CrawlOptions {
  pages?: string[]; // Specific pages to crawl, or all if undefined
  locations?: string[]; // Specific locations, or all if undefined
  includeTables?: boolean;
  includeMetrics?: boolean;
  maxRowsPerTable?: number;
}

export interface DataSources {
  salesData?: any[];
  checkinsData?: any[];
  newClientData?: any[];
  payrollData?: any[];
  sessionsData?: any[];
  discountsData?: any[];
  expirationsData?: any[];
  lateCancellationsData?: any[];
  leadsData?: any[];
}

/**
 * Main crawler function - extracts all data from the app
 */
export async function crawlAllData(
  dataSources: DataSources,
  options: CrawlOptions = {}
): Promise<ExtractedData> {
  try {
    // Starting data crawl process
    
    const {
      pages = Object.keys(PAGE_REGISTRY),
      locations = ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'],
      includeTables = true,
      includeMetrics = true,
      maxRowsPerTable = 10000,
    } = options;

    const extractedTables: ExtractedTable[] = [];
    const extractedMetrics: ExtractedMetric[] = [];
    const processedPages = new Set<string>();

    // Crawl each page
    for (const pageName of pages) {
      if (!PAGE_REGISTRY[pageName as keyof typeof PAGE_REGISTRY]) {
        console.warn(`Page not found in registry: ${pageName}`);
        continue;
      }
      
      // Crawling page data
      processedPages.add(pageName);

      // Crawl each location for this page
      for (const location of locations) {
        try {
          const pageData = await crawlPage(pageName, location, dataSources, {
            includeTables,
            includeMetrics,
            maxRowsPerTable,
          });

          extractedTables.push(...pageData.tables);
          extractedMetrics.push(...pageData.metrics);
          
          // Page data crawled successfully
        } catch (error) {
          console.error(`Error crawling ${pageName} - ${location}:`, error);
          // Continue with other pages/locations
        }
      }
    }

    const result = {
      tables: extractedTables,
      metrics: extractedMetrics,
      summary: {
        totalTables: extractedTables.length,
        totalMetrics: extractedMetrics.length,
        pages: Array.from(processedPages),
        locations,
        timestamp: new Date().toISOString(),
      },
    };
    
    // Data crawl completed successfully
    
    return result;
    
  } catch (error) {
    console.error('Fatal error in crawlAllData:', error);
    throw new Error(`Data crawl failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Crawl a specific page
 */
async function crawlPage(
  pageName: string,
  location: string,
  dataSources: DataSources,
  options: CrawlOptions
): Promise<{ tables: ExtractedTable[]; metrics: ExtractedMetric[] }> {
  const tables: ExtractedTable[] = [];
  const metrics: ExtractedMetric[] = [];

  switch (pageName) {
    case 'Executive Summary':
      return crawlExecutiveSummary(dataSources, location, options);
    
    case 'Sales Analytics':
      return crawlSalesAnalytics(dataSources, location, options);
    
    case 'Client Retention':
      return crawlClientRetention(dataSources, location, options);
    
    case 'Trainer Performance':
      return crawlTrainerPerformance(dataSources, location, options);
    
    case 'Class Attendance':
      return crawlClassAttendance(dataSources, location, options);
    
    case 'Class Formats Comparison':
      return crawlClassFormats(dataSources, location, options);
    
    case 'Discounts & Promotions':
      return crawlDiscounts(dataSources, location, options);
    
    case 'Sessions':
      return crawlSessions(dataSources, location, options);
    
    case 'Expiration Analytics':
      return crawlExpirations(dataSources, location, options);
    
    case 'Late Cancellations':
      return crawlLateCancellations(dataSources, location, options);
    
    case 'Funnel & Leads':
      return crawlLeads(dataSources, location, options);
    
    default:
      return { tables, metrics };
  }
}

/**
 * Crawl Executive Summary page
 */
function crawlExecutiveSummary(
  dataSources: DataSources,
  location: string,
  options: CrawlOptions
): { tables: ExtractedTable[]; metrics: ExtractedMetric[] } {
  const tables: ExtractedTable[] = [];
  const metrics: ExtractedMetric[] = [];

  const { salesData = [], checkinsData = [], newClientData = [] } = dataSources;
  const filteredSales = filterByLocation(salesData, location);
  const filteredCheckins = filterByLocation(checkinsData, location);
  const filteredClients = filterByLocation(newClientData, location);

  // Extract metrics
  if (options.includeMetrics) {
    const salesMetrics = calculateSalesMetrics(filteredSales);
    metrics.push(...extractMetrics(salesMetrics, {
      category: 'Revenue',
      location,
      page: 'Executive Summary',
      section: 'Overview',
    }));

    metrics.push({
      title: 'Total Classes',
      value: filteredCheckins.length,
      category: 'Attendance',
      location,
      metadata: {
        page: 'Executive Summary',
        section: 'Overview',
        timestamp: new Date().toISOString(),
      },
    });

    metrics.push({
      title: 'New Clients',
      value: filteredClients.length,
      category: 'Client Acquisition',
      location,
      metadata: {
        page: 'Executive Summary',
        section: 'Overview',
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Extract tables
  if (options.includeTables && filteredSales.length > 0) {
    // Top products by revenue
    const productGroups = groupBy(filteredSales, 'cleanedProduct');
    const topProducts = Object.entries(productGroups).map(([product, sales]) => {
      const totalRevenue = sales.reduce((sum, s) => sum + (s.paymentValue || 0), 0);
      const uniqueTransactions = new Set(sales.map(s => s.paymentTransactionId).filter(Boolean));
      
      return {
        product: product || 'Unknown',
        revenue: totalRevenue,
        transactions: uniqueTransactions.size > 0 ? uniqueTransactions.size : sales.length,
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    tables.push(extractTableFromData('Top Products by Revenue', topProducts, {
      location,
      page: 'Executive Summary',
      section: 'Products',
    }));
  }

  return { tables, metrics };
}

/**
 * Crawl Sales Analytics page
 */
function crawlSalesAnalytics(
  dataSources: DataSources,
  location: string,
  options: CrawlOptions
): { tables: ExtractedTable[]; metrics: ExtractedMetric[] } {
  const tables: ExtractedTable[] = [];
  const metrics: ExtractedMetric[] = [];

  const { salesData = [], discountsData = [] } = dataSources;
  const filteredSales = filterByLocation(salesData, location);
  const filteredDiscounts = filterByLocation(discountsData, location);

  // Tab: Overview
  if (options.includeMetrics) {
    const salesMetrics = calculateSalesMetrics(filteredSales);
    metrics.push(...extractMetrics(salesMetrics, {
      category: 'Sales Overview',
      location,
      tab: 'Overview',
      page: 'Sales Analytics',
    }));
  }

  if (options.includeTables) {
    // Products tab - mirror ProductPerformanceTable
    const productGroups = groupBy(filteredSales, 'cleanedProduct');
    const productSummary = Object.entries(productGroups).map(([product, sales]) => {
      const totalRevenue = sales.reduce((sum, s) => sum + (s.paymentValue || 0), 0);
      const uniqueTransactions = new Set(sales.map(s => s.paymentTransactionId || s.transactionId).filter(Boolean));
      const totalTransactions = uniqueTransactions.size > 0 ? uniqueTransactions.size : sales.length;
      const uniqueMembers = new Set(sales.map(s => s.memberId).filter(Boolean)).size;
      
      return {
        product: product || 'Unknown',
        revenue: totalRevenue,
        transactions: totalTransactions,
        customers: uniqueMembers,
        avgValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    tables.push(extractTableFromData('Products Performance', productSummary, {
      location,
      tab: 'Products',
      page: 'Sales Analytics',
      section: 'Product Analysis',
      tableType: 'revenue',
      additionalTags: ['sales', 'products', 'performance'],
    }));

    // Category summary
    const categoryGroups = groupBy(filteredSales, 'cleanedCategory');
    const categorySummary = Object.entries(categoryGroups).map(([category, sales]) => {
      const totalRevenue = sales.reduce((sum, s) => sum + (s.paymentValue || 0), 0);
      const uniqueTransactions = new Set(sales.map(s => s.paymentTransactionId || s.transactionId).filter(Boolean));
      const totalTransactions = uniqueTransactions.size > 0 ? uniqueTransactions.size : sales.length;
      
      return {
        category: category || 'Uncategorized',
        revenue: totalRevenue,
        transactions: totalTransactions,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    tables.push(extractTableFromData('Category Performance', categorySummary, {
      location,
      tab: 'Categories',
      page: 'Sales Analytics',
      section: 'Category Analysis',
      tableType: 'revenue',
      additionalTags: ['sales', 'categories'],
    }));

    // Payment methods
    const paymentGroups = groupBy(filteredSales, 'paymentMethod');
    const paymentSummary = Object.entries(paymentGroups).map(([method, sales]) => {
      const totalRevenue = sales.reduce((sum, s) => sum + (s.paymentValue || 0), 0);
      
      return {
        paymentMethod: method || 'Unknown',
        transactions: sales.length,
        revenue: totalRevenue,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    tables.push(extractTableFromData('Payment Methods', paymentSummary, {
      location,
      tab: 'Payment Analysis',
      page: 'Sales Analytics',
      section: 'Payment Methods',
      tableType: 'payment',
      additionalTags: ['sales', 'payments'],
    }));

    // Discounts tab
    if (filteredDiscounts.length > 0) {
      const discountSummary = filteredDiscounts.map(d => ({
        product: d.cleanedProduct || d.paymentItem,
        customer: d.customerName,
        date: d.paymentDate,
        mrp: d.mrpPostTax || d.mrpPreTax || 0,
        paymentValue: d.paymentValue || 0,
        discountAmount: d.discountAmount || 0,
        discountPercentage: d.discountPercentage || 0,
      })).filter(d => d.discountAmount > 0).slice(0, options.maxRowsPerTable);

      tables.push(extractTableFromData('Discounts Applied', discountSummary, {
        location,
        tab: 'Discounts',
        page: 'Sales Analytics',
        section: 'Discount Details',
        tableType: 'discount',
        additionalTags: ['sales', 'discounts', 'promotions'],
      }));
    }
  }

  return { tables, metrics };
}

/**
 * Crawl Client Retention page
 */
function crawlClientRetention(
  dataSources: DataSources,
  location: string,
  options: CrawlOptions
): { tables: ExtractedTable[]; metrics: ExtractedMetric[] } {
  const tables: ExtractedTable[] = [];
  const metrics: ExtractedMetric[] = [];

  const { newClientData = [], checkinsData = [] } = dataSources;
  const filteredClients = filterByLocation(newClientData, location);

  if (options.includeMetrics) {
    const converted = filteredClients.filter(c => c.conversionStatus === 'Converted');
    const retained = filteredClients.filter(c => c.retentionStatus === 'Retained');

    metrics.push({
      title: 'Total New Clients',
      value: filteredClients.length,
      category: 'Client Acquisition',
      location,
      tab: 'New Clients',
      metadata: { page: 'Client Retention', timestamp: new Date().toISOString() },
    });

    metrics.push({
      title: 'Conversion Rate',
      value: `${((converted.length / filteredClients.length) * 100).toFixed(1)}%`,
      category: 'Conversion',
      location,
      tab: 'Conversion Funnel',
      metadata: { page: 'Client Retention', timestamp: new Date().toISOString() },
    });

    metrics.push({
      title: 'Retention Rate',
      value: `${((retained.length / filteredClients.length) * 100).toFixed(1)}%`,
      category: 'Retention',
      location,
      tab: 'Retention Metrics',
      metadata: { page: 'Client Retention', timestamp: new Date().toISOString() },
    });
  }

  if (options.includeTables) {
    tables.push(extractTableFromData('New Clients', filteredClients.slice(0, options.maxRowsPerTable), {
      location,
      tab: 'New Clients',
      page: 'Client Retention',
    }));

    const topClients = getTopN(filteredClients, 'ltv', 20);
    tables.push(extractTableFromData('Top Clients by LTV', topClients, {
      location,
      tab: 'Client Value',
      page: 'Client Retention',
    }));
  }

  return { tables, metrics };
}

/**
 * Crawl Trainer Performance page
 */
function crawlTrainerPerformance(
  dataSources: DataSources,
  location: string,
  options: CrawlOptions
): { tables: ExtractedTable[]; metrics: ExtractedMetric[] } {
  const tables: ExtractedTable[] = [];
  const metrics: ExtractedMetric[] = [];

  const { payrollData = [], checkinsData = [] } = dataSources;
  const filteredPayroll = location === 'All Locations' ? payrollData : payrollData.filter(p => 
    checkinsData.some(c => c.trainerName === p.teacherName && (c.location === location || c.calculatedLocation === location))
  );

  if (options.includeTables) {
    tables.push(extractTableFromData('Trainer Payroll', filteredPayroll.slice(0, options.maxRowsPerTable), {
      location,
      page: 'Trainer Performance',
    }));

    const trainerStats = filteredPayroll.map(trainer => {
      const trainerClasses = checkinsData.filter(c => c.trainerName === trainer.teacherName);
      return {
        ...trainer,
        totalClasses: trainerClasses.length,
        avgAttendance: trainerClasses.reduce((sum, c) => sum + (c.attendance || 0), 0) / (trainerClasses.length || 1),
      };
    });

    tables.push(extractTableFromData('Trainer Statistics', trainerStats, {
      location,
      page: 'Trainer Performance',
    }));
  }

  return { tables, metrics };
}

/**
 * Crawl Class Attendance page
 */
function crawlClassAttendance(
  dataSources: DataSources,
  location: string,
  options: CrawlOptions
): { tables: ExtractedTable[]; metrics: ExtractedMetric[] } {
  const tables: ExtractedTable[] = [];
  const metrics: ExtractedMetric[] = [];

  const { checkinsData = [], sessionsData = [] } = dataSources;
  const filteredCheckins = filterByLocation(checkinsData, location);

  if (options.includeMetrics) {
    const totalAttendance = filteredCheckins.reduce((sum, c) => sum + (c.attendance || 0), 0);
    const avgAttendance = totalAttendance / (filteredCheckins.length || 1);

    metrics.push({
      title: 'Total Classes',
      value: filteredCheckins.length,
      category: 'Attendance',
      location,
      tab: 'Overview',
      metadata: { page: 'Class Attendance', timestamp: new Date().toISOString() },
    });

    metrics.push({
      title: 'Total Attendance',
      value: totalAttendance,
      category: 'Attendance',
      location,
      tab: 'Overview',
      metadata: { page: 'Class Attendance', timestamp: new Date().toISOString() },
    });

    metrics.push({
      title: 'Average Attendance',
      value: avgAttendance.toFixed(1),
      category: 'Attendance',
      location,
      tab: 'Overview',
      metadata: { page: 'Class Attendance', timestamp: new Date().toISOString() },
    });
  }

  if (options.includeTables) {
    // By class format
    const formatGroups = groupBy(filteredCheckins, 'classFormat');
    const formatStats = Object.entries(formatGroups).map(([format, classes]) => ({
      format,
      totalClasses: classes.length,
      totalAttendance: classes.reduce((sum, c) => sum + (c.attendance || 0), 0),
      avgAttendance: classes.reduce((sum, c) => sum + (c.attendance || 0), 0) / classes.length,
    }));

    tables.push(extractTableFromData('Attendance by Class Format', formatStats, {
      location,
      tab: 'Class Formats',
      page: 'Class Attendance',
    }));

    // By trainer
    const trainerGroups = groupBy(filteredCheckins, 'trainerName');
    const trainerStats = Object.entries(trainerGroups).map(([trainer, classes]) => ({
      trainer,
      totalClasses: classes.length,
      totalAttendance: classes.reduce((sum, c) => sum + (c.attendance || 0), 0),
      avgAttendance: classes.reduce((sum, c) => sum + (c.attendance || 0), 0) / classes.length,
    }));

    tables.push(extractTableFromData('Attendance by Trainer', trainerStats, {
      location,
      tab: 'By Trainer',
      page: 'Class Attendance',
    }));
  }

  return { tables, metrics };
}

/**
 * Crawl Class Formats Comparison page
 */
function crawlClassFormats(
  dataSources: DataSources,
  location: string,
  options: CrawlOptions
): { tables: ExtractedTable[]; metrics: ExtractedMetric[] } {
  const tables: ExtractedTable[] = [];
  const metrics: ExtractedMetric[] = [];

  const { checkinsData = [] } = dataSources;
  const filteredCheckins = filterByLocation(checkinsData, location);

  if (options.includeTables) {
    const formatGroups = groupBy(filteredCheckins, 'classFormat');
    const formatComparison = Object.entries(formatGroups).map(([format, classes]) => ({
      format,
      classes: classes.length,
      attendance: classes.reduce((sum, c) => sum + (c.attendance || 0), 0),
      avgAttendance: (classes.reduce((sum, c) => sum + (c.attendance || 0), 0) / classes.length).toFixed(1),
      capacity: classes.reduce((sum, c) => sum + (c.capacity || 0), 0),
      utilizationRate: `${((classes.reduce((sum, c) => sum + (c.attendance || 0), 0) / classes.reduce((sum, c) => sum + (c.capacity || 1), 0)) * 100).toFixed(1)}%`,
    }));

    tables.push(extractTableFromData('Class Formats Comparison', formatComparison, {
      location,
      page: 'Class Formats Comparison',
    }));
  }

  return { tables, metrics };
}

/**
 * Crawl Discounts & Promotions page
 */
function crawlDiscounts(
  dataSources: DataSources,
  location: string,
  options: CrawlOptions
): { tables: ExtractedTable[]; metrics: ExtractedMetric[] } {
  const tables: ExtractedTable[] = [];
  const metrics: ExtractedMetric[] = [];

  const { discountsData = [], salesData = [] } = dataSources;
  const filteredDiscounts = filterByLocation(discountsData, location);
  const filteredSales = filterByLocation(salesData, location);

  const salesWithDiscounts = filteredSales.filter(s => (s.discountAmount || 0) > 0);

  if (options.includeMetrics) {
    const totalDiscount = salesWithDiscounts.reduce((sum, s) => sum + (s.discountAmount || 0), 0);
    const avgDiscount = totalDiscount / (salesWithDiscounts.length || 1);

    metrics.push({
      title: 'Total Discount Value',
      value: totalDiscount.toFixed(1),
      category: 'Discounts',
      location,
      tab: 'Overview',
      metadata: { page: 'Discounts & Promotions', timestamp: new Date().toISOString() },
    });

    metrics.push({
      title: 'Transactions with Discounts',
      value: salesWithDiscounts.length,
      category: 'Discounts',
      location,
      tab: 'Overview',
      metadata: { page: 'Discounts & Promotions', timestamp: new Date().toISOString() },
    });

    metrics.push({
      title: 'Average Discount',
      value: avgDiscount.toFixed(1),
      category: 'Discounts',
      location,
      tab: 'Overview',
      metadata: { page: 'Discounts & Promotions', timestamp: new Date().toISOString() },
    });
  }

  if (options.includeTables) {
    tables.push(extractTableFromData('Sales with Discounts', salesWithDiscounts.slice(0, options.maxRowsPerTable), {
      location,
      tab: 'Discount Analysis',
      page: 'Discounts & Promotions',
    }));
  }

  return { tables, metrics };
}

/**
 * Crawl Sessions page
 */
function crawlSessions(
  dataSources: DataSources,
  location: string,
  options: CrawlOptions
): { tables: ExtractedTable[]; metrics: ExtractedMetric[] } {
  const tables: ExtractedTable[] = [];
  const metrics: ExtractedMetric[] = [];

  const { sessionsData = [] } = dataSources;
  const filteredSessions = filterByLocation(sessionsData, location);

  if (options.includeTables) {
    tables.push(extractTableFromData('All Sessions', filteredSessions.slice(0, options.maxRowsPerTable), {
      location,
      tab: 'All Sessions',
      page: 'Sessions',
    }));
  }

  return { tables, metrics };
}

/**
 * Crawl Expiration Analytics page
 */
function crawlExpirations(
  dataSources: DataSources,
  location: string,
  options: CrawlOptions
): { tables: ExtractedTable[]; metrics: ExtractedMetric[] } {
  const tables: ExtractedTable[] = [];
  const metrics: ExtractedMetric[] = [];

  const { expirationsData = [] } = dataSources;
  const filteredExpirations = filterByLocation(expirationsData, location);

  if (options.includeMetrics) {
    metrics.push({
      title: 'Total Expirations',
      value: filteredExpirations.length,
      category: 'Expirations',
      location,
      metadata: { page: 'Expiration Analytics', timestamp: new Date().toISOString() },
    });
  }

  if (options.includeTables) {
    tables.push(extractTableFromData('Membership Expirations', filteredExpirations.slice(0, options.maxRowsPerTable), {
      location,
      page: 'Expiration Analytics',
    }));
  }

  return { tables, metrics };
}

/**
 * Crawl Late Cancellations page
 */
function crawlLateCancellations(
  dataSources: DataSources,
  location: string,
  options: CrawlOptions
): { tables: ExtractedTable[]; metrics: ExtractedMetric[] } {
  const tables: ExtractedTable[] = [];
  const metrics: ExtractedMetric[] = [];

  const { lateCancellationsData = [] } = dataSources;
  const filteredCancellations = filterByLocation(lateCancellationsData, location);

  if (options.includeMetrics) {
    metrics.push({
      title: 'Total Late Cancellations',
      value: filteredCancellations.length,
      category: 'Cancellations',
      location,
      metadata: { page: 'Late Cancellations', timestamp: new Date().toISOString() },
    });
  }

  if (options.includeTables) {
    tables.push(extractTableFromData('Late Cancellations', filteredCancellations.slice(0, options.maxRowsPerTable), {
      location,
      page: 'Late Cancellations',
    }));
  }

  return { tables, metrics };
}

/**
 * Crawl Funnel & Leads page
 */
function crawlLeads(
  dataSources: DataSources,
  location: string,
  options: CrawlOptions
): { tables: ExtractedTable[]; metrics: ExtractedMetric[] } {
  const tables: ExtractedTable[] = [];
  const metrics: ExtractedMetric[] = [];

  const { leadsData = [] } = dataSources;
  const filteredLeads = filterByLocation(leadsData, location);

  if (options.includeMetrics) {
    metrics.push({
      title: 'Total Leads',
      value: filteredLeads.length,
      category: 'Leads',
      location,
      metadata: { page: 'Funnel & Leads', timestamp: new Date().toISOString() },
    });
  }

  if (options.includeTables) {
    tables.push(extractTableFromData('Leads', filteredLeads.slice(0, options.maxRowsPerTable), {
      location,
      page: 'Funnel & Leads',
    }));
  }

  return { tables, metrics };
}
