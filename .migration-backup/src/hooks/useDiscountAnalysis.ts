import { useMemo } from 'react';
import { useGoogleSheets } from './useGoogleSheets';

// Updated interface to match all columns in the sample data
export interface DiscountAnalysisData {
  memberId: string;
  customerName: string;
  customerEmail: string;
  saleItemId: string;
  paymentCategory: string;
  paymentDate: string;
  paymentValue: number;
  paidInMoneyCredits: number;
  paymentVat: number;
  paymentItem: string;
  cleanedProduct?: string;
  cleanedCategory?: string;
  mrpPostTax?: number;
  discountAmount?: number;
  discountPercentage?: number;
  soldBy?: string;
  location?: string;
}
export const useDiscountAnalysis = () => {
  const { data: salesData, loading, error } = useGoogleSheets();
  const discountData = useMemo<DiscountAnalysisData[]>(() => {
    return (salesData || []).map((item: any) => ({
      memberId: item.memberId || '',
      customerName: item.customerName || '',
      customerEmail: item.customerEmail || '',
      saleItemId: item.saleItemId || '',
      paymentCategory: item.paymentCategory || '',
      paymentDate: item.paymentDate || '',
      paymentValue: Number(item.paymentValue || 0),
      paidInMoneyCredits: Number(item.paidInMoneyCredits || 0),
      paymentVat: Number(item.paymentVAT || item.paymentVat || 0),
      paymentItem: item.paymentItem || '',
      paymentMethod: item.paymentMethod || '',
      paymentStatus: item.paymentStatus || '',
      paymentTransactionId: item.paymentTransactionId || '',
      stripeToken: item.stripeToken || '',
      saleReference: item.saleReference || '',
      soldBy: item.soldBy === '-' ? 'Online/System' : (item.soldBy || 'Unknown'),
      location: item.calculatedLocation || '',
      cleanedProduct: item.cleanedProduct || '',
      cleanedCategory: item.cleanedCategory || '',
      hostId: item.hostId || '',
      mrpPreTax: Number(item.mrpPreTax || 0),
      mrpPostTax: Number(item.mrpPostTax || 0),
      discountAmount: Number(item.discountAmount || 0),
      discountPercentage: Number(item.discountPercentage || 0),
      membershipType: item.membershipType || '',
    }));
  }, [salesData]);

  const metrics = useMemo(() => {
    if (!discountData.length) {
      return {
        totalDiscountAmount: 0,
        totalRevenueLost: 0,
        totalTransactions: 0,
        avgDiscountPercentage: 0,
        totalPotentialRevenue: 0,
        totalActualRevenue: 0,
        discountEffectiveness: 0,
        productBreakdown: [],
        monthlyBreakdown: [],
      };
    }

    const totalDiscountAmount = discountData.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalTransactions = discountData.length;
    const totalPotentialRevenue = discountData.reduce((sum, item) => sum + (item.mrpPostTax || item.paymentValue || 0), 0);
    const totalActualRevenue = discountData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);

    // Calculate average discount percentage
    const discountedItems = discountData.filter(item => (item.discountAmount || 0) > 0);
    const avgDiscountPercentage = discountedItems.length > 0 
      ? discountedItems.reduce((sum, item) => sum + (item.discountPercentage || 0), 0) / discountedItems.length 
      : 0;

    // Group by product
    const productBreakdown = discountData.reduce((acc, item) => {
      const key = item.cleanedProduct || 'Unknown Product';
      if (!acc[key]) {
        acc[key] = {
          product: key,
          transactions: 0,
          totalDiscount: 0,
          avgDiscountPercentage: 0,
          revenue: 0,
          totalMrp: 0,
        };
      }
      acc[key].transactions += 1;
      acc[key].totalDiscount += item.discountAmount || 0;
      acc[key].revenue += item.paymentValue || 0;
      acc[key].totalMrp += item.mrpPostTax || item.paymentValue || 0;
      return acc;
    }, {} as Record<string, any>);

    Object.values(productBreakdown).forEach((product: any) => {
      product.avgDiscountPercentage = product.totalMrp > 0 ? (product.totalDiscount / product.totalMrp) * 100 : 0;
    });

    // Group by month
    const monthlyBreakdown = discountData.reduce((acc, item) => {
      if (!item.paymentDate) return acc;
      const monthKey = item.paymentDate.substring(0, 7); // YYYY-MM
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          transactions: 0,
          totalDiscount: 0,
          revenue: 0,
        };
      }
      acc[monthKey].transactions += 1;
      acc[monthKey].totalDiscount += item.discountAmount || 0;
      acc[monthKey].revenue += item.paymentValue || 0;
      return acc;
    }, {} as Record<string, any>);

    return {
      totalDiscountAmount,
      totalRevenueLost: totalDiscountAmount,
      totalTransactions,
      avgDiscountPercentage,
      totalPotentialRevenue,
      totalActualRevenue,
      discountEffectiveness: totalPotentialRevenue > 0 ? (totalActualRevenue / totalPotentialRevenue) * 100 : 0,
      productBreakdown: Object.values(productBreakdown),
      monthlyBreakdown: Object.values(monthlyBreakdown),
    };
  }, [discountData]);

  return {
    data: discountData,
    metrics,
    loading,
    error,
  };
};