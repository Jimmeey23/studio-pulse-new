import { useMemo } from 'react';
import { useGoogleSheets } from './useGoogleSheets';
import { SalesData } from '@/types/dashboard';

export const useDiscountsData = () => {
  const { data: salesData, loading, error } = useGoogleSheets();
  const discountData = useMemo<SalesData[]>(() => {
    return [...(salesData || [])]
      .map((item) => ({
        ...item,
        soldBy: item.soldBy === '-' ? 'Online/System' : (item.soldBy || 'Unknown'),
      }))
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .slice(0, 5000);
  }, [salesData]);

  return {
    data: discountData,
    loading,
    error,
  };
};
