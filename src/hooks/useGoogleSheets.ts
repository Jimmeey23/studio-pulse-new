
import { useState, useEffect, useRef, useMemo } from 'react';
import { SalesData } from '@/types/dashboard';
import { requestCache } from '@/utils/performanceOptimizations';
import { getGoogleAccessToken, parseNumericValue } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';

const logger = createLogger('useGoogleSheets');

const SPREADSHEET_ID = "1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0";

export const useGoogleSheets = () => {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const { mode } = useDataSource();

  const fetchSalesData = async () => {
    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const { rows } = await loadDatasetRowsForMode('sales', mode, async () => {
        const result = await requestCache.fetch('google-sheets-sales', async () => {
          logger.info('Fetching sales data from Google Sheets...');
          const accessToken = await getGoogleAccessToken();
          
          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sales?alt=json`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
              signal: abortControllerRef.current?.signal,
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch data');
          }

          return response.json();
        });

        return result.values || [];
      });
      
      // Raw data from Google Sheets received
      
      if (rows.length < 2) {
        if (isMountedRef.current) {
          setData([]);
          setLoading(false);
        }
        return;
      }

      const headers = rows[0];
      
      // Process data in chunks to avoid blocking UI
      const salesData: SalesData[] = [];
      const chunkSize = 200; // Increased chunk size for better performance
      
      for (let i = 1; i < rows.length; i += chunkSize) {
        // Check if component is still mounted
        if (!isMountedRef.current) return;
        
        const end = Math.min(i + chunkSize, rows.length);
        const batch = rows.slice(i, end).map((row: any[]) => {
          const rawItem: any = {};
          headers.forEach((header: string, index: number) => {
            rawItem[header] = row[index] || '';
          });

          // Transform to match SalesData interface with camelCase field names
          const transformedItem: SalesData = {
            memberId: rawItem['Member ID'] || rawItem['memberId'] || '',
            customerName: rawItem['Customer Name'] || rawItem['customerName'] || '',
            customerEmail: rawItem['Customer Email'] || rawItem['customerEmail'] || '',
            saleItemId: rawItem['Sale Item ID'] || rawItem['saleItemId'] || '',
            paymentCategory: rawItem['Payment Category'] || rawItem['paymentCategory'] || '',
            membershipType: rawItem['Membership Type'] || rawItem['membershipType'] || '',
            paymentDate: rawItem['Payment Date'] || rawItem['paymentDate'] || '',
            paymentValue: parseNumericValue(rawItem['Payment Value'] || rawItem['paymentValue'] || 0),
            paidInMoneyCredits: parseNumericValue(rawItem['Paid in Money Credits'] || rawItem['Paid In Money Credits'] || rawItem['paidInMoneyCredits'] || 0),
            paymentVAT: parseNumericValue(rawItem['Payment VAT'] || rawItem['paymentVAT'] || 0),
            paymentItem: rawItem['Payment Item'] || rawItem['paymentItem'] || '',
            paymentStatus: rawItem['Payment Status'] || rawItem['paymentStatus'] || '',
            paymentMethod: rawItem['Payment Method'] || rawItem['paymentMethod'] || '',
            paymentTransactionId: rawItem['Payment Transaction ID'] || rawItem['paymentTransactionId'] || '',
            stripeToken: rawItem['Stripe Token'] || rawItem['stripeToken'] || '',
            soldBy: rawItem['Sold By'] || rawItem['soldBy'] || '',
            saleReference: rawItem['Sale Reference'] || rawItem['saleReference'] || '',
            calculatedLocation: rawItem['Calculated Location'] || rawItem['calculatedLocation'] || '',
            cleanedProduct: rawItem['Cleaned Product'] || rawItem['cleanedProduct'] || '',
            cleanedCategory: rawItem['Cleaned Category'] || rawItem['cleanedCategory'] || '',
            
            // Calculate derived fields
            netRevenue: parseNumericValue(rawItem['Payment Value'] || rawItem['paymentValue'] || 0) - parseNumericValue(rawItem['Payment VAT'] || rawItem['paymentVAT'] || 0),
            vat: parseNumericValue(rawItem['Payment VAT'] || rawItem['paymentVAT'] || 0),
            grossRevenue: parseNumericValue(rawItem['Payment Value'] || rawItem['paymentValue'] || 0),
            
            // Handle discount columns with multiple possible names
            // Priority: Check primary discount columns first, then sale-level totals, then item-level values
            mrpPreTax: parseNumericValue(
              rawItem['Mrp - Pre Tax'] || rawItem['MRP Pre Tax'] || rawItem['MRP_Pre_Tax'] || 
              rawItem['mrpPreTax'] || rawItem['MrpPreTax'] || rawItem['Pre Tax MRP'] || 
              rawItem['Sale Item Unit Price Excluding VAT'] || 0
            ),
            mrpPostTax: parseNumericValue(
              rawItem['Mrp - Post Tax'] || rawItem['MRP Post Tax'] || rawItem['MRP_Post_Tax'] || 
              rawItem['mrpPostTax'] || rawItem['MrpPostTax'] || rawItem['Post Tax MRP'] || 
              rawItem['Sale Item Unit Price Including VAT'] || 0
            ),
            discountAmount: parseNumericValue(
              rawItem['Discount Amount -Mrp- Payment Value'] || rawItem['Discount Amount'] || 
              rawItem['discount_amount'] || rawItem['discountAmount'] || rawItem['DiscountAmount'] ||
              rawItem['Discount_Amount'] || rawItem['Total Discount'] || rawItem['Discount Value In Currency'] || rawItem['Discount Value'] || rawItem['Discount Value (In Currency)'] || 
              rawItem['Sale Total Discount Value'] || rawItem['Sale Total Discount'] || rawItem['Sale Item Unit Discount Value'] || 0
            ),
            discountPercentage: parseNumericValue(
              rawItem['Discount Percentage - discount amount/mrp*100'] || rawItem['Discount Percentage'] || 
              rawItem['discount_percentage'] || rawItem['discountPercentage'] || rawItem['DiscountPercentage'] ||
              rawItem['Discount_Percentage'] || rawItem['Discount %'] || rawItem['Discount_Percent'] || 0
            ),
            discountSource: 'none',
            discountIsEstimated: false,
            hostId: rawItem['Host Id'] || rawItem['Host ID'] || rawItem['hostId'] || '',
            // Secondary (Sec.) fields for behavior analytics
            secMembershipStartDate: rawItem['Sec. Membership Start Date'] || rawItem['Sec Membership Start Date'] || '',
            secMembershipEndDate: rawItem['Sec. Membership End Date'] || rawItem['Sec Membership End Date'] || '',
            secMembershipTotalClasses: parseNumericValue(rawItem['Sec. Membership Total Classes'] || 0),
            secMembershipClassesLeft: parseNumericValue(rawItem['Sec. Membership Classes Left'] || 0),
            secMembershipUsedSessions: parseNumericValue(rawItem['Sec. Total Used Sessions'] || rawItem['Sec. Membership Used Sessions'] || 0),
            // Additional discount indicators
            discountCode: rawItem['Discount Code'] || rawItem['discount_code'] || rawItem['DiscountCode'] || rawItem['Promo Code'] || rawItem['promo_code'] || '',
            discountType: rawItem['Discount Code'] ? 'code' : undefined,
            isPromotional: !!(rawItem['Discount Code'] || rawItem['Purchase Type'] === 'promotional')
          };

          // Compute fallback discount metrics when missing
          const itemUnitDiscount = parseNumericValue(rawItem['Sale Item Unit Discount Value'] || 0);
          const mrp = transformedItem.mrpPostTax && transformedItem.mrpPostTax > 0
            ? transformedItem.mrpPostTax
            : (transformedItem.mrpPreTax || 0);

          if ((transformedItem.discountAmount || 0) > 0 || (transformedItem.discountPercentage || 0) > 0) {
            transformedItem.discountSource = 'sheet';
          }

          // If discountAmount is still 0 but item-level discount exists, use it
          if ((transformedItem.discountAmount || 0) <= 0 && itemUnitDiscount > 0) {
            transformedItem.discountAmount = itemUnitDiscount;
            transformedItem.discountSource = 'item_unit';
          }

          // Fallback: derive discountAmount from MRP vs payment when column is missing/0
          if ((transformedItem.discountAmount || 0) <= 0 && mrp > 0 && (transformedItem.paymentValue || 0) > 0 && mrp > (transformedItem.paymentValue || 0)) {
            transformedItem.discountAmount = mrp - (transformedItem.paymentValue || 0);
            transformedItem.discountSource = 'mrp_gap';
            transformedItem.discountIsEstimated = true;
          }

          // Additional fallback: if still 0 but explicit percentage exists, compute amount
          if ((transformedItem.discountAmount || 0) <= 0 && (transformedItem.discountPercentage || 0) > 0 && mrp > 0) {
            transformedItem.discountAmount = (mrp * (transformedItem.discountPercentage || 0)) / 100;
            transformedItem.discountSource = 'percentage_derived';
            transformedItem.discountIsEstimated = true;
          }

          // Fallback: derive discountPercentage if missing/0
          if ((transformedItem.discountPercentage || 0) <= 0) {
            if (mrp > 0 && (transformedItem.discountAmount || 0) > 0) {
              transformedItem.discountPercentage = (transformedItem.discountAmount! / mrp) * 100;
            } else if (mrp > 0 && (transformedItem.paymentValue || 0) > 0 && mrp > (transformedItem.paymentValue || 0)) {
              transformedItem.discountPercentage = ((mrp - (transformedItem.paymentValue || 0)) / mrp) * 100;
            } else if ((transformedItem.discountAmount || 0) > 0 && (transformedItem.paymentValue || 0) > 0) {
              // Assume effective MRP = payment + discount when MRP is not available
              const effectiveMrp = (transformedItem.paymentValue || 0) + (transformedItem.discountAmount || 0);
              transformedItem.discountPercentage = effectiveMrp > 0 ? ((transformedItem.discountAmount || 0) / effectiveMrp) * 100 : 0;
              transformedItem.discountSource = transformedItem.discountSource === 'none' ? 'effective_mrp' : transformedItem.discountSource;
              transformedItem.discountIsEstimated = true;
            }
          }

          if ((transformedItem.discountAmount || 0) > 0 && transformedItem.discountSource === 'none') {
            transformedItem.discountSource = 'sheet';
          }

          // Normalize rounding
          if (typeof transformedItem.discountAmount === 'number') {
            transformedItem.discountAmount = Math.round(transformedItem.discountAmount * 100) / 100;
          }
          if (typeof transformedItem.discountPercentage === 'number') {
            transformedItem.discountPercentage = Math.round(transformedItem.discountPercentage * 100) / 100;
          }

          return transformedItem;
        });
        
        salesData.push(...batch);
      }
      
      if (!isMountedRef.current) return;
      
      logger.debug('Transformed sales data sample:', salesData.slice(0, 3));
      
      // Enhanced debug logging for discount data (show more header/field variants to aid debugging)
      const discountedItems = salesData.filter(item => (item.discountAmount || 0) > 0 || (item.discountPercentage || 0) > 0);
      // Detect discount/mrp-like headers to help debugging
      const foundDiscountHeaders = headers.filter((h: string) => /discount/i.test(h));
      const foundMrpHeaders = headers.filter((h: string) => /mrp|mrp post|mrp - post|post tax/i.test(h));

      const sampleRowValuesForFoundHeaders: Record<string, any> = {};
      if (rows[1]) {
        headers.forEach((header: string, idx: number) => {
          if (foundDiscountHeaders.includes(header) || foundMrpHeaders.includes(header)) {
            sampleRowValuesForFoundHeaders[header] = rows[1][idx] || null;
          }
        });
      }

      logger.info('useGoogleSheets - Data summary:', {
        totalRecords: salesData.length,
        recordsWithDiscounts: discountedItems.length,
        samplePaymentDates: salesData.slice(0, 5).map(d => d.paymentDate),
        sampleRawHeaders: headers ? headers.slice(0, 30) : undefined,
        sampleRawRow: rows[1] ? rows[1].slice(0, 30) : undefined,
        foundDiscountHeaders,
        foundMrpHeaders,
        sampleRowValuesForFoundHeaders,
        sampleDiscountData: salesData.slice(0, 5).map(d => ({
          date: d.paymentDate,
          paymentValue: d.paymentValue,
          mrpPreTax: d.mrpPreTax,
          mrpPostTax: d.mrpPostTax,
          discountAmount: d.discountAmount,
          discountPercentage: d.discountPercentage,
          discountValueInCurrency: d['Discount Value In Currency'] || d['discountValueInCurrency'] || undefined,
          location: d.calculatedLocation
        }))
      });
      
      // Update state with processed data
      setData(salesData);
      setError(null);
    } catch (err) {
      if (isMountedRef.current) {
        logger.error('Error fetching sales data:', err);
        setError('Failed to load sales data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchSalesData();
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [mode]);

  return { data, loading, error, refetch: fetchSalesData };
};
