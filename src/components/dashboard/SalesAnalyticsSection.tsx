import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Building2, Landmark, Building, Calendar, TrendingUp, ShoppingCart, FolderOpen, Users, CreditCard, UserCheck } from 'lucide-react';
import { AutoCloseFilterSection } from './AutoCloseFilterSection';
import { MetricCard } from './MetricCard';
import { UnifiedTopBottomSellers } from './UnifiedTopBottomSellers';
import { DataTable } from './DataTable';
import { InteractiveChart } from './InteractiveChart';
import { ThemeSelector } from './ThemeSelector';
import { LazyEnhancedSalesDrillDownModal } from '@/components/lazy/LazyModals';
import { ModalSuspense } from '@/components/lazy/ModalSuspense';
import { getActiveTabClasses } from '@/utils/colorThemes';
import { EnhancedYearOnYearTableNew } from './EnhancedYearOnYearTableNew';
import { MonthOnMonthTableNew } from './MonthOnMonthTableNew';
import { ProductPerformanceTableNew } from './ProductPerformanceTableNew';
import { CategoryPerformanceTableNew } from './CategoryPerformanceTableNew';
import { SalesAnimatedMetricCards } from './SalesAnimatedMetricCards';
import { SalesInteractiveCharts } from './SalesInteractiveCharts';
import { SoldByMonthOnMonthTableNew } from './SoldByMonthOnMonthTableNew';
import { PaymentMethodMonthOnMonthTableNew } from './PaymentMethodMonthOnMonthTableNew';
import { ProductCategoryMetricsTable } from './ProductCategoryMetricsTable';
import { SalesHeroSection } from './SalesHeroSection';
import QuickSections from '@/components/ui/QuickSections';
import SectionTimelineNav from '@/components/ui/SectionTimelineNav';
import SectionAnchor from '@/components/ui/SectionAnchor';
import { useSectionNavigation } from '@/contexts/SectionNavigationContext';
import { ModernSalesTable } from './ModernSalesTable';
import { SalesData, FilterOptions, MetricCardData, YearOnYearMetricType } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage, formatDiscount } from '@/utils/formatters';
import { getDashboardDefaultDateRange } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { createLogger } from '@/utils/logger';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { ComprehensiveSalesExportButton } from './ComprehensiveSalesExportButton';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { CustomerBehaviorMonthOnMonthTable } from './CustomerBehaviorMonthOnMonthTable';
import { InfoPopover } from '@/components/ui/InfoSidebar';
import { StudioLocationTabs } from '@/components/ui/StudioLocationTabs';

interface SalesAnalyticsSectionProps {
  data: SalesData[];
  onReady?: () => void;
}

const locations = [{
  id: 'all',
  name: 'All Locations, ',
  fullName: 'All Studio Locations'
}, {
  id: 'kwality',
  name: 'Kwality House, Kemps Corner',
  fullName: 'Kwality House, Kemps Corner'
}, {
  id: 'supreme',
  name: 'Supreme HQ, Bandra',
  fullName: 'Supreme HQ, Bandra'
}, {
  id: 'kenkere',
  name: 'Kenkere House, Bengaluru',
  fullName: 'Kenkere House, Bengaluru'
}, {
  id: 'popup',
  name: 'Pop-up',
  fullName: 'Pop-up'
}];

export const SalesAnalyticsSection: React.FC<SalesAnalyticsSectionProps> = ({ data, onReady }) => {
  const { filters: globalFilters } = useGlobalFilters();
  const periodId = globalFilters?.dateRange
    ? `${globalFilters.dateRange.start}:${globalFilters.dateRange.end}`
    : 'all-time';
  const [activeLocation, setActiveLocation] = useState('kwality');
  const [currentTheme, setCurrentTheme] = useState('classic');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [drillDownType, setDrillDownType] = useState<'metric' | 'product' | 'category' | 'member' | 'soldBy' | 'paymentMethod'>('metric');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [activeYoyMetric, setActiveYoyMetric] = useState<YearOnYearMetricType>('revenue');

  const logger = createLogger('SalesAnalyticsSection');

  // Debug CSS variables
  React.useEffect(() => {
    const root = document.documentElement;
    const heroAccent = root.style.getPropertyValue('--hero-accent') || getComputedStyle(root).getPropertyValue('--hero-accent');
    logger.debug('Sales Section: Current --hero-accent:', heroAccent);
    logger.debug('Sales Section: Active location:', activeLocation);
  }, [activeLocation]);
  const [isReady, setIsReady] = useState(false);
  const markReady = React.useCallback(() => setIsReady(true), []);
  const { addSection, removeSection } = useSectionNavigation();

  React.useEffect(() => {
    if (isReady) {
      onReady?.();
    }
  }, [isReady, onReady]);

  const [filters, setFilters] = useState<FilterOptions>(() => {
    const defaultDateRange = getDashboardDefaultDateRange();
    
    return {
      dateRange: defaultDateRange,
      location: [],
      category: [],
      product: [],
      soldBy: [],
      paymentMethod: []
    };
  });

  const applyFilters = (rawData: SalesData[], includeHistoric: boolean = false) => {

    
    let filtered = [...rawData];

    // Apply location filter
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const loc = (item.calculatedLocation || '').toString().toLowerCase();
        const locationMatch = activeLocation === 'kwality'
          ? loc.includes('kwality') || loc.includes('kemps')
          : activeLocation === 'supreme'
          ? loc.includes('supreme') || loc.includes('bandra')
          : activeLocation === 'kenkere'
          ? loc.includes('kenkere') || loc.includes('bengaluru')
          : activeLocation === 'popup'
          ? loc.includes('pop') || loc.includes('popup') || loc.includes('pop-up')
          : false;
        return locationMatch;
      });
    }



    // Apply date range filter
    if (!includeHistoric && (filters.dateRange.start || filters.dateRange.end)) {
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? (() => {
        const date = new Date(filters.dateRange.end);
        // Set to end of day to include all transactions on the end date
        date.setHours(23, 59, 59, 999);
        return date;
      })() : null;
      

      
      filtered = filtered.filter(item => {
        if (!item.paymentDate) return false;

        let itemDate: Date | null = null;

        // Try DD/MM/YYYY format first
        const ddmmyyyy = item.paymentDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyy) {
          const [, day, month, year] = ddmmyyyy;
          itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Try other formats
          const formats = [
            new Date(item.paymentDate), 
            new Date(item.paymentDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')), 
            new Date(item.paymentDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'))
          ];
          
          for (const date of formats) {
            if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
              itemDate = date;
              break;
            }
          }
        }

        if (!itemDate || isNaN(itemDate.getTime())) return false;
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
      

    }

    // Apply category filter
    if (filters.category?.length) {
      filtered = filtered.filter(item => 
        filters.category!.some(cat => 
          item.cleanedCategory?.toLowerCase().includes(cat.toLowerCase())
        )
      );

    }

    // Apply payment method filter
    if (filters.paymentMethod?.length) {
      filtered = filtered.filter(item => 
        filters.paymentMethod!.some(method => 
          item.paymentMethod?.toLowerCase().includes(method.toLowerCase())
        )
      );

    }

    // Apply sold by filter
    if (filters.soldBy?.length) {
      filtered = filtered.filter(item => 
        filters.soldBy!.some(seller => 
          item.soldBy?.toLowerCase().includes(seller.toLowerCase())
        )
      );

    }

    // Apply amount range filters
    if (filters.minAmount) {
      filtered = filtered.filter(item => (item.paymentValue || 0) >= filters.minAmount!);

    }
    
    if (filters.maxAmount) {
      filtered = filtered.filter(item => (item.paymentValue || 0) <= filters.maxAmount!);

    }


    return filtered;
  };

  const filteredData = useMemo(() => applyFilters(data), [data, filters, activeLocation]);
  const allHistoricData = useMemo(() => applyFilters(data, true), [data, activeLocation]);
  // Location-only historical dataset for MoM metrics (ignore non-date filters to reflect total sales at location)
  const metricsHistoricData = useMemo(() => {
    let filtered = [...data];
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => {
        const loc = (item.calculatedLocation || '').toString().toLowerCase();
        if (activeLocation === 'kwality') return loc.includes('kwality') || loc.includes('kemps');
        if (activeLocation === 'supreme') return loc.includes('supreme') || loc.includes('bandra');
        if (activeLocation === 'kenkere') return loc.includes('kenkere') || loc.includes('bengaluru');
        if (activeLocation === 'popup') return loc.includes('pop') || loc.includes('popup') || loc.includes('pop-up');
        return false;
      });
    }
    return filtered;
  }, [data, activeLocation]);

  const handleRowClick = useCallback((rowData: any) => {

    
    // Use RAW DATA for drill-down to be independent of current filters
    // Only apply location filtering to maintain context
    let baseData = data;
    logger.debug(`🔍 DRILL-DOWN: Starting with ${data.length} total records (RAW DATA)`);
    logger.debug(`📊 COMPARISON: Current filtered view has ${filteredData.length} records`);
    
    if (activeLocation !== 'all') {
      baseData = data.filter(item => {
        const loc = (item.calculatedLocation || '').toString().toLowerCase();
        const locationMatch = activeLocation === 'kwality'
          ? loc.includes('kwality') || loc.includes('kemps')
          : activeLocation === 'supreme'
          ? loc.includes('supreme') || loc.includes('bandra')
          : activeLocation === 'kenkere'
          ? loc.includes('kenkere') || loc.includes('bengaluru')
          : activeLocation === 'popup'
          ? loc.includes('pop') || loc.includes('popup') || loc.includes('pop-up')
          : false;
        return locationMatch;
      });
      logger.debug(`📍 LOCATION FILTER: Reduced to ${baseData.length} records for location: ${activeLocation}`);
    }
    
    let specificFilteredData = baseData;
    let drillDownTypeToSet: 'metric' | 'product' | 'category' | 'member' | 'soldBy' | 'paymentMethod' = 'product';
    
    // Handle the new contextual filtering system - filter from ALL DATA, not current filtered view
    if (rowData.filterCriteria && rowData.drillDownContext) {
      logger.debug('Using enhanced contextual filtering on raw data:', rowData.drillDownContext);
      const criteria = rowData.filterCriteria;
      
      // Check MORE SPECIFIC conditions first (combinations) before general conditions
      if (criteria.month && criteria.product) {
        // Month-specific product filtering - match YYYY-MM format from ALL DATA
        logger.debug('🎯 CELL-SPECIFIC FILTERING:', {
          month: criteria.month,
          product: criteria.product,
          baseDataCount: baseData.length
        });
        
        specificFilteredData = baseData.filter(item => {
          if (!item.paymentDate) return false;
          
          const itemDate = new Date(item.paymentDate);
          const year = itemDate.getFullYear();
          const month = itemDate.getMonth() + 1;
          const itemKey = `${year}-${String(month).padStart(2, '0')}`;
          
          const productMatches = (
            item.cleanedProduct?.toLowerCase() === criteria.product?.toLowerCase() ||
            item.paymentItem?.toLowerCase() === criteria.product?.toLowerCase() ||
            // Removed membershipName which does not exist on SalesData
            item.paymentItem?.toLowerCase().includes(criteria.product?.toLowerCase() || '')
          );
          
          const monthMatches = itemKey === criteria.month;
          
          if (productMatches && monthMatches) {
            logger.debug('✅ EXACT MATCH FOUND:', {
              product: item.cleanedProduct || item.paymentItem,
              date: item.paymentDate,
              itemKey,
              criteriaMonth: criteria.month,
              paymentValue: item.paymentValue
            });
          }
          
          return productMatches && monthMatches;
        });
        
        logger.debug(`🎯 FINAL CELL-SPECIFIC RESULT: Found ${specificFilteredData.length} transactions for ${criteria.product} in ${criteria.month}`);
        if (specificFilteredData.length > 0) {
          const totalRevenue = specificFilteredData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
          logger.debug(`💰 CELL REVENUE: ${totalRevenue} (should NOT be 13.4L if filtering correctly)`);
        }
        drillDownTypeToSet = 'product';
        logger.debug(`Context-filtered by product + month: ${criteria.product} in ${criteria.month} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.month && criteria.category) {
        // Month-specific category filtering from ALL DATA
        specificFilteredData = baseData.filter(item => {
          if (!item.paymentDate) return false;
          
          const itemDate = new Date(item.paymentDate);
          const year = itemDate.getFullYear();
          const month = itemDate.getMonth() + 1;
          const itemKey = `${year}-${String(month).padStart(2, '0')}`;
          
          const categoryMatches = item.cleanedCategory?.toLowerCase() === criteria.category?.toLowerCase();
          const monthMatches = itemKey === criteria.month;
          
          return categoryMatches && monthMatches;
        });
        drillDownTypeToSet = 'category';
        logger.debug(`Context-filtered by category + month: ${criteria.category} in ${criteria.month} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.month && criteria.soldBy) {
        // Month-specific seller filtering from ALL DATA
        specificFilteredData = baseData.filter(item => {
          if (!item.paymentDate) return false;
          
          const itemDate = new Date(item.paymentDate);
          const year = itemDate.getFullYear();
          const month = itemDate.getMonth() + 1;
          const itemKey = `${year}-${String(month).padStart(2, '0')}`;
          
          const sellerMatches = item.soldBy?.toLowerCase() === criteria.soldBy?.toLowerCase();
          const monthMatches = itemKey === criteria.month;
          
          return sellerMatches && monthMatches;
        });
        drillDownTypeToSet = 'soldBy';
        logger.debug(`Context-filtered by seller + month: ${criteria.soldBy} in ${criteria.month} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.month && criteria.paymentMethod) {
        // Month-specific payment method filtering from ALL DATA
        specificFilteredData = baseData.filter(item => {
          if (!item.paymentDate) return false;
          
          const itemDate = new Date(item.paymentDate);
          const year = itemDate.getFullYear();
          const month = itemDate.getMonth() + 1;
          const itemKey = `${year}-${String(month).padStart(2, '0')}`;
          
          const methodMatches = item.paymentMethod?.toLowerCase() === criteria.paymentMethod?.toLowerCase();
          const monthMatches = itemKey === criteria.month;
          
          return methodMatches && monthMatches;
        });
        drillDownTypeToSet = 'paymentMethod';
        logger.debug(`Context-filtered by payment method + month: ${criteria.paymentMethod} in ${criteria.month} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.month) {
        // Month-only filtering (for month total rows)
        specificFilteredData = baseData.filter(item => {
          if (!item.paymentDate) return false;
          
          const itemDate = new Date(item.paymentDate);
          const year = itemDate.getFullYear();
          const month = itemDate.getMonth() + 1;
          const itemKey = `${year}-${String(month).padStart(2, '0')}`;
          
          return itemKey === criteria.month;
        });
        logger.debug(`Context-filtered by month only: ${criteria.month} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.product) {
        // Product-only filtering (no month specified)
        specificFilteredData = baseData.filter(item => 
          item.cleanedProduct?.toLowerCase() === criteria.product?.toLowerCase() ||
          item.paymentItem?.toLowerCase() === criteria.product?.toLowerCase()
        );
        drillDownTypeToSet = 'product';
        logger.debug(`Context-filtered by product from ALL DATA: ${criteria.product} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.category) {
        // Category-only filtering (no month specified)
        specificFilteredData = baseData.filter(item => 
          item.cleanedCategory?.toLowerCase() === criteria.category?.toLowerCase()
        );
        drillDownTypeToSet = 'category';
        logger.debug(`Context-filtered by category from ALL DATA: ${criteria.category} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.soldBy) {
        // Seller-only filtering (no month specified)
        specificFilteredData = baseData.filter(item => 
          item.soldBy?.toLowerCase() === criteria.soldBy?.toLowerCase()
        );
        drillDownTypeToSet = 'soldBy';
        logger.debug(`Context-filtered by seller from ALL DATA: ${criteria.soldBy} - Found ${specificFilteredData.length} matching transactions`);
      } else if (criteria.paymentMethod) {
        // Payment method-only filtering (no month specified)
        specificFilteredData = baseData.filter(item => 
          item.paymentMethod?.toLowerCase() === criteria.paymentMethod?.toLowerCase()
        );
        drillDownTypeToSet = 'paymentMethod';
        logger.debug(`Context-filtered by payment method from ALL DATA: ${criteria.paymentMethod} - Found ${specificFilteredData.length} matching transactions`);
      }
      
    } else if (rowData.rawData && Array.isArray(rowData.rawData) && rowData.rawData.length > 0) {
      // Legacy: If we have transaction data already attached to the row, use that
      specificFilteredData = rowData.rawData;
      logger.debug(`Using pre-filtered rawData: ${specificFilteredData.length} transactions`);
    } else if (Array.isArray(rowData) && rowData.length > 0) {
      // Legacy: If rowData itself is an array of transactions, use it directly
      specificFilteredData = rowData;
      logger.debug(`Using rowData array directly: ${specificFilteredData.length} transactions`);
    } else if (rowData.transactionData && Array.isArray(rowData.transactionData) && rowData.transactionData.length > 0) {
      specificFilteredData = rowData.transactionData;
      logger.debug(`Using pre-filtered transactionData: ${specificFilteredData.length} transactions`);
    } else if (rowData.currentYearRawData && rowData.lastYearRawData) {
      // For Year-on-Year data, combine current and last year data for this specific product/category
      specificFilteredData = [...rowData.currentYearRawData, ...rowData.lastYearRawData];
      logger.debug(`Using YoY data: ${rowData.currentYearRawData.length} current year + ${rowData.lastYearRawData.length} last year transactions`);
    } else {
      // Apply specific filters based on row properties as fallback
      specificFilteredData = filteredData.filter(item => {
        let matches = false; // Start with false and require at least one match
        
        // Try multiple possible property names for product matching
        const productIdentifiers = [
          rowData.name,
          rowData.product,
          rowData.productName,
          rowData.paymentItem,
          rowData.cleanedProduct,
          rowData.membership,
          rowData.membershipType,
          rowData.item
        ].filter(Boolean);
        
        const categoryIdentifiers = [
          rowData.category,
          rowData.cleanedCategory,
          rowData.paymentCategory
        ].filter(Boolean);
        
        logger.debug('Product identifiers to match:', productIdentifiers);
        logger.debug('Category identifiers to match:', categoryIdentifiers);
        
        // Product-specific filtering - try exact matches
        for (const identifier of productIdentifiers) {
          if (item.cleanedProduct === identifier || 
              item.paymentItem === identifier ||
              item.membershipType === identifier ||
              (item.paymentItem && item.paymentItem.includes(identifier)) ||
              (item.cleanedProduct && item.cleanedProduct.includes(identifier))) {
            matches = true;
            logger.debug(`Product match found: ${identifier} matches item ${item.paymentItem || item.cleanedProduct}`);
            break;
          }
        }
        
        // Category-specific filtering if no product match
        if (!matches) {
          for (const identifier of categoryIdentifiers) {
            if (item.cleanedCategory === identifier ||
                item.paymentCategory === identifier ||
                (item.cleanedCategory && item.cleanedCategory.includes(identifier))) {
              matches = true;
              drillDownTypeToSet = 'category';
              logger.debug(`Category match found: ${identifier} matches item ${item.cleanedCategory}`);
              break;
            }
          }
        }
        
        // Sales rep specific filtering
        if (rowData.soldBy && item.soldBy === rowData.soldBy) {
          matches = true;
          drillDownTypeToSet = 'member';
        }
        
        // Payment method specific filtering
        if (rowData.paymentMethod && item.paymentMethod === rowData.paymentMethod) {
          matches = true;
          drillDownTypeToSet = 'product';
        }
        
        return matches;
      });
      logger.debug(`Using fallback filtering: ${specificFilteredData.length} transactions from ${filteredData.length} total`);
      
    }
    
    logger.debug(`Filtered ${specificFilteredData.length} transactions for drill-down from ${filteredData.length} total`);
    
    // Log the filtering results
    logger.debug(`Final drill-down data preparation:`);
    logger.debug(`- Context type: ${rowData.contextType || 'unknown'}`);
    logger.debug(`- Filter criteria:`, rowData.filterCriteria);
    logger.debug(`- Specific filtered transactions: ${specificFilteredData.length}`);
    logger.debug(`- Sample transactions:`, specificFilteredData.slice(0, 3));
    
    // Ensure we have valid transaction data - if no specific filter worked, use a fallback
    if (specificFilteredData.length === 0) {
      console.warn('No specific transactions found for this drill-down. Trying fallback filtering...');
      
      // More aggressive fallback filtering based on row data properties
      if (rowData.product || rowData.name) {
        const productName = rowData.product || rowData.name;
        specificFilteredData = filteredData.filter(item => 
          item.cleanedProduct?.includes(productName) || 
          item.paymentItem?.includes(productName) ||
          item.cleanedProduct === productName ||
          item.paymentItem === productName
        );
        logger.debug(`Fallback product filter found ${specificFilteredData.length} transactions for "${productName}"`);
      } else if (rowData.category) {
        specificFilteredData = filteredData.filter(item => 
          item.cleanedCategory?.includes(rowData.category) || 
          item.cleanedCategory === rowData.category
        );
        logger.debug(`Fallback category filter found ${specificFilteredData.length} transactions for "${rowData.category}"`);
      } else {
        // Last resort - use all filtered data but log warning
        console.warn('Using all filtered data as last resort');
        specificFilteredData = filteredData.slice(0, 100); // Limit to 100 for performance
      }
    }

    // Build enhanced data object with CORRECTLY FILTERED transactions
    // CRITICAL: Do NOT spread rowData first, as it may contain incorrect pre-filtered data
    const calculatedRevenue = specificFilteredData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const calculatedTransactions = specificFilteredData.length;
    const calculatedCustomers = new Set(specificFilteredData.map(item => item.memberId || item.customerEmail)).size;
    
    const enhancedData = {
      // Spread rowData but it will be overridden by our correctly filtered data below
      ...rowData,
      // FORCE override with correctly filtered transaction data
      rawData: specificFilteredData,
      filteredTransactionData: specificFilteredData,
      transactionData: specificFilteredData, // Some modals might read from this property
      // Calculate specific metrics from our CORRECTLY FILTERED data and override any static values
      totalRevenue: calculatedRevenue,
      grossRevenue: calculatedRevenue,
      netRevenue: calculatedRevenue,
      totalValue: calculatedRevenue,
      totalCurrent: calculatedRevenue,
      metricValue: calculatedRevenue,
      revenue: calculatedRevenue, // Some modals might read from this property
      transactions: calculatedTransactions,
      totalTransactions: calculatedTransactions,
      transactionCount: calculatedTransactions, // Some modals might read from this property
      uniqueMembers: calculatedCustomers,
      totalCustomers: calculatedCustomers,
      customerCount: calculatedCustomers, // Some modals might read from this property
      specificRevenue: calculatedRevenue,
      specificTransactions: calculatedTransactions,
      specificCustomers: calculatedCustomers,
      specificProducts: new Set(specificFilteredData.map(item => item.cleanedProduct || item.paymentItem)).size,
      // Add dynamic calculation flags to ensure modal uses fresh data
      isDynamic: true,
      calculatedFromFiltered: true,
      useCalculatedMetrics: true, // Flag for modal to prefer calculated metrics
      // Add context information for the modal
      clickedItemName: rowData.product || rowData.name || rowData.category || 'Selected Item',
      contextDescription: rowData.filterCriteria ? 
        `Showing data for ${Object.entries(rowData.filterCriteria).map(([key, value]) => `${key}: ${value}`).join(', ')}` :
        `Showing transactions for ${rowData.product || rowData.name || rowData.category || 'selected item'}`
    };
    
    // Final validation and logging
    logger.debug('🎉 === DRILL-DOWN MODAL DATA FINAL SUMMARY ===');
    logger.debug('📋 Filter Criteria:', rowData.filterCriteria);
    logger.debug('📊 Drill-down Context:', rowData.drillDownContext);
    logger.debug('🔢 Specific Filtered Data Count:', specificFilteredData.length);
    logger.debug('💰 Calculated Revenue:', calculatedRevenue);
    logger.debug('👥 Calculated Customers:', calculatedCustomers);
    logger.debug('📦 Enhanced Data Properties:');
    logger.debug('  - rawData length:', enhancedData.rawData?.length);
    logger.debug('  - filteredTransactionData length:', enhancedData.filteredTransactionData?.length);
    logger.debug('  - transactionData length:', enhancedData.transactionData?.length);
    logger.debug('  - totalRevenue:', enhancedData.totalRevenue);
    logger.debug('  - revenue:', enhancedData.revenue);
    logger.debug('  - transactions:', enhancedData.transactions);
    logger.debug('  - totalTransactions:', enhancedData.totalTransactions);
    logger.debug('🎯 Drill-down Type:', drillDownTypeToSet);
    logger.debug('📝 Context Description:', enhancedData.contextDescription);
    logger.debug('✅ === END DRILL-DOWN SUMMARY ===');
    
    setDrillDownData(enhancedData);
    setDrillDownType(drillDownTypeToSet);
  }, [data, activeLocation, filteredData]);

  const handleMetricClick = useCallback((metricData: any) => {
    logger.debug('Metric clicked with data:', metricData);
    
    // Filter data based on the specific metric clicked
    let specificData = filteredData;
    
    // Apply metric-specific filtering based on the metric type
    if (metricData.metricType) {
      switch (metricData.metricType) {
        case 'sales-revenue':
        case 'total-revenue':
          // For revenue metrics, focus on high-value transactions
          specificData = filteredData.filter(item => (item.paymentValue || 0) > 0);
          break;
          
        case 'units-sold':
        case 'total-transactions':
          // For transaction metrics, include all transactions
          specificData = filteredData;
          break;
          
        case 'unique-members':
          // For member metrics, focus on unique customer data
          const uniqueMembers = new Set(filteredData.map(item => item.memberId || item.customerEmail));
          specificData = filteredData.filter(item => 
            item.memberId || item.customerEmail
          );
          break;
          
        case 'avg-transaction-value':
        case 'avg-spend-per-member':
          // For average metrics, focus on meaningful transactions
          specificData = filteredData.filter(item => 
            (item.paymentValue || 0) > 0 && (item.memberId || item.customerEmail)
          );
          break;
          
        default:
          specificData = filteredData;
      }
    }
    
    // Calculate fresh metrics from the metric-specific filtered data
    const dynamicRevenue = specificData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const dynamicTransactions = specificData.length;
    const dynamicCustomers = new Set(specificData.map(item => item.memberId || item.customerEmail)).size;
    
    // Enhance metric data with dynamic calculations and metric-specific context
    const enhancedData = {
      ...metricData,
      rawData: specificData,
      filteredTransactionData: specificData,
      // Override with dynamic values
      totalRevenue: dynamicRevenue,
      grossRevenue: dynamicRevenue,
      netRevenue: dynamicRevenue,
      totalValue: dynamicRevenue,
      totalCurrent: dynamicRevenue,
      metricValue: dynamicRevenue,
      transactions: dynamicTransactions,
      totalTransactions: dynamicTransactions,
      uniqueMembers: dynamicCustomers,
      totalCustomers: dynamicCustomers,
      specificRevenue: dynamicRevenue,
      specificTransactions: dynamicTransactions,
      specificCustomers: dynamicCustomers,
      // Add context about the specific metric
      focusMetric: metricData.title,
      metricContext: metricData.metricType,
      // Add flags to indicate this is dynamically calculated
      isDynamic: true,
      calculatedFromFiltered: true,
      isMetricSpecific: true
    };
    
    logger.debug(`Metric-specific drill-down for '${metricData.title}' with ${specificData.length} filtered transactions, revenue: ${dynamicRevenue}`);
    setDrillDownData(enhancedData);
    setDrillDownType('metric');
  }, [filteredData]);

  const handleGroupToggle = useCallback((groupKey: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupKey)) {
      newCollapsed.delete(groupKey);
    } else {
      newCollapsed.add(groupKey);
    }
    setCollapsedGroups(newCollapsed);
  }, [collapsedGroups]);

  const resetFilters = useCallback(() => {
    const defaultDateRange = getDashboardDefaultDateRange();
    
    setFilters({
      dateRange: defaultDateRange,
      location: [],
      category: [],
      product: [],
      soldBy: [],
      paymentMethod: []
    });
  }, []);

  // Calculate tab counts for location tabs using filtered data
  const tabCounts = useMemo(() => {
    const counts = { all: 0, kwality: 0, supreme: 0, kenkere: 0 };
    
    // Use filtered data instead of raw data to reflect current filters
    filteredData.forEach(item => {
      counts.all++;
      const loc = (item.calculatedLocation || '').toString().toLowerCase();
      if (loc.includes('kwality')) {
        counts.kwality++;
      } else if (loc.includes('supreme')) {
        counts.supreme++;
      } else if (loc.includes('kenkere') || loc.includes('bengaluru')) {
        counts.kenkere++;
      }
    });
    
    return counts;
  }, [filteredData]);

  return (
    <div className="space-y-8">
      {/* Hero Section with Dynamic Metrics */}
      <SectionAnchor id="sales-overview" label="Overview">
        <SalesHeroSection 
          data={filteredData} 
          historicalData={metricsHistoricData}
          dateRange={filters.dateRange}
          currentLocation={activeLocation}
          locationName={locations.find(loc => loc.id === activeLocation)?.fullName || 'All Locations'}
          onExportDateRangeChange={(dateRange) => {
            setFilters((prev) => ({
              ...prev,
              dateRange,
            }));
          }}
        />
      </SectionAnchor>

      {/* Note Taker removed as requested; AI Notes remain elsewhere */}

      {/* Vertical timeline navigation (scrollspy) */}
      <SectionTimelineNav position="right" title="Sales sections" />

      {/* Enhanced Location Tabs - unified styling (matching Client Retention) */}
      <div className="container mx-auto px-6 space-y-6">
        <StudioLocationTabs 
          activeLocation={activeLocation}
          onLocationChange={setActiveLocation}
          showInfoPopover={true}
          infoPopoverContext="sales-overview"
        />

        {/* Content Sections */}
        <div className="space-y-8">
          <SectionAnchor id="sales-filters" label="Filters" className="w-full space-y-4">
            <AutoCloseFilterSection
              filters={filters} 
              onFiltersChange={setFilters} 
              onReset={resetFilters} 
            />
          </SectionAnchor>

          <SectionAnchor id="sales-metrics" label="Metrics">
            <SalesAnimatedMetricCards 
              data={filteredData} 
              historicalData={metricsHistoricData}
              dateRange={filters.dateRange}
              onMetricClick={handleMetricClick}
              locationId={activeLocation}
            />
          </SectionAnchor>

              <SectionAnchor id="sales-charts" label="Charts">
                <SalesInteractiveCharts data={allHistoricData} />
              </SectionAnchor>

              <SectionAnchor id="sales-sellers" label="Top & Bottom Sellers">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">Top & Bottom Sellers</h2>
                </div>
                <UnifiedTopBottomSellers data={filteredData} />
              </SectionAnchor>

                <Tabs defaultValue="monthOnMonth" className="w-full">
                  <TabsList className="bg-white/95 backdrop-blur-sm p-1.5 rounded-2xl shadow-2xl border-2 border-slate-200 flex w-full max-w-7xl mx-auto overflow-visible relative">
                    {/* Uniform trigger styling for consistent size/width/spacing across tabs */}
                    <TabsTrigger value="monthOnMonth" className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:via-blue-700 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1">
                      <Calendar className="w-4 h-4" />
                      <span className="whitespace-nowrap">Month on Month</span>
                    </TabsTrigger>
                    <TabsTrigger value="yearOnYear" className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:via-emerald-700 data-[state=active]:to-emerald-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="whitespace-nowrap">Year on Year</span>
                    </TabsTrigger>
                    <TabsTrigger value="productPerformance" className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:via-purple-700 data-[state=active]:to-purple-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="whitespace-nowrap">Products</span>
                    </TabsTrigger>
                    <TabsTrigger value="categoryPerformance" className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-600 data-[state=active]:via-orange-700 data-[state=active]:to-orange-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1">
                      <FolderOpen className="w-4 h-4" />
                      <span className="whitespace-nowrap">Categories</span>
                    </TabsTrigger>
                    <TabsTrigger value="soldByAnalysis" className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:via-indigo-700 data-[state=active]:to-indigo-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1">
                      <Users className="w-4 h-4" />
                      <span className="whitespace-nowrap">Sales Team</span>
                    </TabsTrigger>
                    <TabsTrigger value="paymentMethodAnalysis" className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-600 data-[state=active]:via-teal-700 data-[state=active]:to-teal-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1">
                      <CreditCard className="w-4 h-4" />
                      <span className="whitespace-nowrap">Payments</span>
                    </TabsTrigger>
                    <TabsTrigger value="customerBehavior" className="relative flex-1 flex items-center justify-center gap-2 px-3 py-3 font-semibold text-xs md:text-sm min-h-[52px] transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-pink-600 data-[state=active]:via-pink-700 data-[state=active]:to-pink-800 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:border-2 data-[state=active]:border-white data-[state=active]:z-50 hover:bg-gray-50 border-r border-slate-200 last:border-r-0 data-[state=active]:scale-[1.02] data-[state=active]:rounded-xl data-[state=active]:-translate-y-1">
                      <UserCheck className="w-4 h-4" />
                      <span className="whitespace-nowrap">Behavior</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="monthOnMonth" className="mt-8">
                    <SectionAnchor id="sales-mom" label="Month-on-Month" activate={() => {
                      const trigger = document.querySelector("[role='tab'][data-state='active'][data-value='monthOnMonth']") as HTMLElement | null;
                      if (!trigger) {
                        const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                        t.find(el => el.getAttribute('data-value') === 'monthOnMonth')?.click();
                      }
                    }} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Month-on-Month Analysis</h2>
                      </div>
                      <MonthOnMonthTableNew 
                        data={allHistoricData} 
                        onRowClick={handleRowClick} 
                        collapsedGroups={collapsedGroups} 
                        // Adapter to match MonthOnMonthTableNew's onGroupToggle signature (Set<string>)
                        onGroupToggle={React.useCallback((groups: Set<string>) => setCollapsedGroups(new Set(groups)), [])} 
                        selectedMetric={activeYoyMetric} 
                        onReady={markReady}
                        contextInfo={{
                          selectedMetric: activeYoyMetric,
                          dateRange: filters.dateRange,
                          location: locations.find(loc => loc.id === activeLocation)?.fullName || 'All Locations',
                          filters: {
                            location: [activeLocation],
                            category: filters.category,
                            product: filters.product,
                            soldBy: filters.soldBy,
                            paymentMethod: filters.paymentMethod
                          }
                        }}
                      />
                    </SectionAnchor>
                  </TabsContent>

                  <TabsContent value="yearOnYear" className="mt-8">
                    <SectionAnchor id="sales-yoy" label="Year-on-Year" activate={() => {
                      const trigger = document.querySelector("[role='tab'][data-state='active'][data-value='yearOnYear']") as HTMLElement | null;
                      if (!trigger) {
                        const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                        t.find(el => el.getAttribute('data-value') === 'yearOnYear')?.click();
                      }
                    }} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Year-on-Year Analysis</h2>
                      </div>
                      <EnhancedYearOnYearTableNew 
                        data={allHistoricData} 
                        onRowClick={handleRowClick} 
                        selectedMetric={activeYoyMetric} 
                        onReady={markReady}
                        contextInfo={{
                          selectedMetric: activeYoyMetric,
                          dateRange: filters.dateRange,
                          location: locations.find(loc => loc.id === activeLocation)?.fullName || 'All Locations',
                          filters: {
                            location: [activeLocation],
                            category: filters.category,
                            product: filters.product,
                            soldBy: filters.soldBy,
                            paymentMethod: filters.paymentMethod
                          }
                        }}
                      />
                    </SectionAnchor>
                  </TabsContent>

                <TabsContent value="productPerformance" className="mt-8">
                  <SectionAnchor id="sales-product" label="Products" activate={() => {
                    const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                    t.find(el => el.getAttribute('data-value') === 'productPerformance')?.click();
                  }} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900">Product & Category Metrics</h2>
                    </div>
                    <ProductCategoryMetricsTable
                      data={filteredData}
                      filters={filters}
                      onReady={markReady}
                    />
                  </SectionAnchor>
                </TabsContent>

                <TabsContent value="categoryPerformance" className="mt-8">
                  <SectionAnchor id="sales-category" label="Categories" activate={() => {
                    const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                    t.find(el => el.getAttribute('data-value') === 'categoryPerformance')?.click();
                  }} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900">Category Performance Analysis</h2>
                    </div>
                    <CategoryPerformanceTableNew 
                      data={allHistoricData} 
                      onRowClick={handleRowClick} 
                      selectedMetric={activeYoyMetric} 
                      onReady={markReady}
                      contextInfo={{
                        selectedMetric: activeYoyMetric,
                        dateRange: filters.dateRange,
                        location: locations.find(loc => loc.id === activeLocation)?.fullName || 'All Locations',
                        filters: {
                          location: [activeLocation],
                          category: filters.category,
                          product: filters.product,
                          soldBy: filters.soldBy,
                          paymentMethod: filters.paymentMethod
                        }
                      }}
                    />
                  </SectionAnchor>
                </TabsContent>

                <TabsContent value="soldByAnalysis" className="mt-8">
                  <SectionAnchor id="sales-soldby" label="Sold By" activate={() => {
                    const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                    t.find(el => el.getAttribute('data-value') === 'soldByAnalysis')?.click();
                  }} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900">Sold By Analysis</h2>
                    </div>
                    <SoldByMonthOnMonthTableNew 
                      data={allHistoricData} 
                      onRowClick={handleRowClick} 
                      selectedMetric={activeYoyMetric} 
                      onReady={markReady}
                      contextInfo={{
                        selectedMetric: activeYoyMetric,
                        dateRange: filters.dateRange,
                        location: locations.find(loc => loc.id === activeLocation)?.fullName || 'All Locations',
                        filters: {
                          location: [activeLocation],
                          category: filters.category,
                          product: filters.product,
                          soldBy: filters.soldBy,
                          paymentMethod: filters.paymentMethod
                        }
                      }}
                    />
                  </SectionAnchor>
                </TabsContent>

                <TabsContent value="paymentMethodAnalysis" className="mt-8">
                  <SectionAnchor id="sales-payment" label="Payment Methods" activate={() => {
                    const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                    t.find(el => el.getAttribute('data-value') === 'paymentMethodAnalysis')?.click();
                  }} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900">Payment Method Analysis</h2>
                    </div>
                    <PaymentMethodMonthOnMonthTableNew 
                      data={allHistoricData} 
                      onRowClick={handleRowClick} 
                      selectedMetric={activeYoyMetric} 
                      onReady={markReady}
                      contextInfo={{
                        selectedMetric: activeYoyMetric,
                        dateRange: filters.dateRange,
                        location: locations.find(loc => loc.id === activeLocation)?.fullName || 'All Locations',
                        filters: {
                          location: [activeLocation],
                          category: filters.category,
                          product: filters.product,
                          soldBy: filters.soldBy,
                          paymentMethod: filters.paymentMethod
                        }
                      }}
                    />
                  </SectionAnchor>
                </TabsContent>

                <TabsContent value="customerBehavior" className="space-y-6">
                  <SectionAnchor id="sales-customer" label="Customer Behavior" activate={() => {
                    const t = Array.from(document.querySelectorAll("[role='tab']")) as HTMLElement[];
                    t.find(el => el.getAttribute('data-value') === 'customerBehavior')?.click();
                  }}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900">Customer Behavior</h2>
                    </div>
                    {/* Use allHistoricData to make this tab independent from the date filters */}
                    <CustomerBehaviorMonthOnMonthTable 
                      data={allHistoricData} 
                      onReady={markReady} 
                      onRowClick={handleRowClick}
                      contextInfo={{
                        selectedMetric: activeYoyMetric,
                        dateRange: filters.dateRange,
                        location: locations.find(loc => loc.id === activeLocation)?.fullName || 'All Locations',
                        filters: {
                          location: [activeLocation],
                          category: filters.category,
                          product: filters.product,
                          soldBy: filters.soldBy,
                          paymentMethod: filters.paymentMethod
                        }
                      }}
                    />
                  </SectionAnchor>
                </TabsContent>
              </Tabs>
        </div>
      </div>

      {/* Modal - Lazy loaded for performance */}
      <ModalSuspense>
        {drillDownData && (
          <LazyEnhancedSalesDrillDownModal 
            isOpen={!!drillDownData} 
            onClose={() => setDrillDownData(null)} 
            data={drillDownData} 
            type={drillDownType} 
          />
        )}
      </ModalSuspense>
    </div>
  );
};
