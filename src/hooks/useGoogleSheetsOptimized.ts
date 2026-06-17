import { useQuery } from '@tanstack/react-query';
import { SalesData } from '@/types/dashboard';
import { getGoogleAccessToken, parseNumericValue } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useGoogleSheetsOptimized');

const SPREADSHEET_ID = "1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0";

const fetchSalesData = async (): Promise<SalesData[]> => {
  logger.info('Fetching sales data from Google Sheets...');
  const accessToken = await getGoogleAccessToken();
  
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sales?alt=json`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch sales data');
  }

  const result = await response.json();
  const rows = result.values || [];
  
  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0];
  
  // Transform data in optimized chunks
  const salesData: SalesData[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawItem: any = {};
    headers.forEach((header: string, index: number) => {
      rawItem[header] = row[index] || '';
    });

    // Transform to match SalesData interface
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
      
      // Handle discount columns
      mrpPreTax: parseNumericValue(
        rawItem['Mrp - Pre Tax'] || rawItem['MRP Pre Tax'] || rawItem['MRP_Pre_Tax'] || 
        rawItem['mrpPreTax'] || rawItem['MrpPreTax'] || rawItem['Pre Tax MRP'] || 0
      ),
      mrpPostTax: parseNumericValue(
        rawItem['Mrp - Post Tax'] || rawItem['MRP Post Tax'] || rawItem['MRP_Post_Tax'] || 
        rawItem['mrpPostTax'] || rawItem['MrpPostTax'] || rawItem['Post Tax MRP'] || 0
      ),
      discountAmount: parseNumericValue(
        rawItem['Discount Amount -Mrp- Payment Value'] || rawItem['Discount Amount'] || 
        rawItem['discount_amount'] || rawItem['discountAmount'] || rawItem['DiscountAmount'] ||
        rawItem['Discount_Amount'] || rawItem['Total Discount'] || 0
      ),
      discountPercentage: parseNumericValue(
        rawItem['Discount Percentage - discount amount/mrp*100'] || rawItem['Discount Percentage'] || 
        rawItem['discount_percentage'] || rawItem['discountPercentage'] || rawItem['DiscountPercentage'] ||
        rawItem['Discount_Percentage'] || rawItem['Discount %'] || rawItem['Discount_Percent'] || 0
      ),
      hostId: rawItem['Host Id'] || rawItem['Host ID'] || rawItem['hostId'] || '',
      // Secondary fields
      secMembershipStartDate: rawItem['Sec. Membership Start Date'] || rawItem['Sec Membership Start Date'] || '',
      secMembershipEndDate: rawItem['Sec. Membership End Date'] || rawItem['Sec Membership End Date'] || '',
      secMembershipTotalClasses: parseNumericValue(rawItem['Sec. Membership Total Classes'] || 0),
      secMembershipClassesLeft: parseNumericValue(rawItem['Sec. Membership Classes Left'] || 0),
      secMembershipUsedSessions: parseNumericValue(rawItem['Sec. Total Used Sessions'] || rawItem['Sec. Membership Used Sessions'] || 0)
    };

    // Compute fallback discount metrics
    const mrp = transformedItem.mrpPostTax && transformedItem.mrpPostTax > 0
      ? transformedItem.mrpPostTax
      : (transformedItem.mrpPreTax || 0);

    if ((transformedItem.discountAmount || 0) <= 0 && mrp > 0 && (transformedItem.paymentValue || 0) > 0 && mrp > (transformedItem.paymentValue || 0)) {
      transformedItem.discountAmount = mrp - (transformedItem.paymentValue || 0);
    }

    if ((transformedItem.discountAmount || 0) <= 0 && (transformedItem.discountPercentage || 0) > 0 && mrp > 0) {
      transformedItem.discountAmount = (mrp * (transformedItem.discountPercentage || 0)) / 100;
    }

    if ((transformedItem.discountPercentage || 0) <= 0) {
      if (mrp > 0 && (transformedItem.discountAmount || 0) > 0) {
        transformedItem.discountPercentage = (transformedItem.discountAmount! / mrp) * 100;
      } else if (mrp > 0 && (transformedItem.paymentValue || 0) > 0 && mrp > (transformedItem.paymentValue || 0)) {
        transformedItem.discountPercentage = ((mrp - (transformedItem.paymentValue || 0)) / mrp) * 100;
      } else if ((transformedItem.discountAmount || 0) > 0 && (transformedItem.paymentValue || 0) > 0) {
        const effectiveMrp = (transformedItem.paymentValue || 0) + (transformedItem.discountAmount || 0);
        transformedItem.discountPercentage = effectiveMrp > 0 ? ((transformedItem.discountAmount || 0) / effectiveMrp) * 100 : 0;
      }
    }

    // Normalize rounding
    if (typeof transformedItem.discountAmount === 'number') {
      transformedItem.discountAmount = Math.round(transformedItem.discountAmount * 100) / 100;
    }
    if (typeof transformedItem.discountPercentage === 'number') {
      transformedItem.discountPercentage = Math.round(transformedItem.discountPercentage * 100) / 100;
    }

    salesData.push(transformedItem);
  }
  
  logger.info(`Transformed sales data: ${salesData.length} rows`);
  return salesData;
};

// Optimized hook using React Query
export const useGoogleSheetsOptimized = () => {
  const query = useQuery({
    queryKey: ['sales-data'],
    queryFn: fetchSalesData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  });

  return {
    data: query.data || [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load sales data' : null,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    isFetching: query.isFetching,
  };
};

// Backwards compatible export
// Re-export as default to replace the original hook
export default useGoogleSheetsOptimized;
export { useGoogleSheetsOptimized as useGoogleSheets };
