import React from 'react';
import { ModernHeroSection } from '@/components/ui/ModernHeroSection';
import { AdvancedExportButton } from '@/components/ui/AdvancedExportButton';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

interface DiscountsHeroSectionProps {
  data: SalesData[];
}

export const DiscountsHeroSection: React.FC<DiscountsHeroSectionProps> = ({ data }) => {
  // Calculate discount metrics
  const totalDiscounts = data.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  const totalTransactions = data.length;
  const discountedTransactions = data.filter(item => (item.discountAmount || 0) > 0).length;
  const totalRevenue = data.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
  const discountRate = totalRevenue > 0 ? (totalDiscounts / (totalRevenue + totalDiscounts)) * 100 : 0;

  // Convert metrics to hero format - show top 3 key metrics
  const heroMetrics = [
    {
      location: 'Total Discounts',
      label: 'Amount saved by customers',
      value: formatCurrency(totalDiscounts)
    },
    {
      location: 'Discount Rate',
      label: 'Percentage of gross revenue',
      value: formatPercentage(discountRate)
    },
    {
      location: 'Transactions',
      label: `${discountedTransactions} of ${totalTransactions} had discounts`,
      value: formatNumber(discountedTransactions)
    }
  ];

  const exportButton = (
    <AdvancedExportButton 
      salesData={data}
      defaultFileName="discounts-promotions-filtered"
      size="sm"
      variant="ghost"
    />
  );

  return (
    <ModernHeroSection 
      title="Discounts & Promotions"
      subtitle="Comprehensive analysis of discount strategies, promotional effectiveness, and customer savings patterns"
      variant="discounts"
      metrics={heroMetrics}
      exportButton={exportButton}
    />
  );
};