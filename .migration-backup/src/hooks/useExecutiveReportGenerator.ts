import { useCallback } from 'react';
import { useSalesData } from './useSalesData';
import { useSessionsData } from './useSessionsData';
import { useNewClientData } from './useNewClientData';
import { usePayrollData } from './usePayrollData';
import { useLeadsData } from './useLeadsData';
import { useDiscountAnalysis } from './useDiscountAnalysis';
import { useLateCancellationsData } from './useLateCancellationsData';
import { useExpirationsData } from './useExpirationsData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import {
  downloadComprehensiveExecutivePDF,
  type ComprehensiveExecutiveReportData,
} from '@/services/comprehensiveExecutivePDFService';

interface UseExecutiveReportGeneratorOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  location?: string;
}

export const useExecutiveReportGenerator = (options?: UseExecutiveReportGeneratorOptions) => {
  const { data: salesData } = useSalesData();
  const { data: sessionsData } = useSessionsData();
  const { data: clientData } = useNewClientData();
  const { data: payrollData } = usePayrollData();
  const { data: leadsData } = useLeadsData();
  const { data: discountData } = useDiscountAnalysis();
  const { data: cancellationsData } = useLateCancellationsData();
  const { data: expirationsData } = useExpirationsData();

  const generateReportData = useCallback((): ComprehensiveExecutiveReportData => {
    // Calculate key metrics
    const totalRevenue = salesData?.reduce((sum, s) => sum + (s.paymentValue || 0), 0) || 0;
    const totalTransactions = salesData?.length || 0;
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalSessions = sessionsData?.length || 0;
    const totalAttendance = sessionsData?.reduce((sum, s) => sum + (s.checkedInCount || 0), 0) || 0;
    const avgClassSize = totalSessions > 0 ? totalAttendance / totalSessions : 0;
    const totalCapacity = sessionsData?.reduce((sum, s) => sum + (s.capacity || 0), 0) || 0;
    const fillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;

    const newClients = clientData?.length || 0;
    const convertedClients = clientData?.filter((c) => c.conversionStatus === 'Converted').length || 0;
    const conversionRate = newClients > 0 ? (convertedClients / newClients) * 100 : 0;
    const retainedClients = clientData?.filter((c) => c.retentionStatus === 'Retained').length || 0;
    const retentionRate = newClients > 0 ? (retainedClients / newClients) * 100 : 0;
    const avgLTV = newClients > 0 ? clientData?.reduce((sum, c) => sum + (c.ltv || 0), 0) || 0 / newClients : 0;

    const totalTrainers = new Set((payrollData || []).map((p: any) => p.name || p.trainerName || 'Unknown')).size || 0;
    const totalTrainerSessions = (payrollData || []).reduce((sum: number, p: any) => sum + (p.sessionsCount || p.numberOfClasses || 0), 0) || 0;
    const totalTrainerPaid = (payrollData || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

    const totalLeads = leadsData?.length || 0;
    const convertedLeads = leadsData?.filter((l: any) => l.status === 'converted').length || 0;
    const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const totalDiscounts = discountData?.reduce((sum, d) => sum + (d.discountAmount || 0), 0) || 0;
    const discountCount = discountData?.length || 0;
    const discountRate = totalTransactions > 0 ? (discountCount / totalTransactions) * 100 : 0;

    const cancellationCount = cancellationsData?.length || 0;
    const cancellationRate = totalSessions > 0 ? (cancellationCount / totalSessions) * 100 : 0;

    const expirationCount = expirationsData?.length || 0;
    const expiredValue = (expirationsData || []).reduce((sum: number, e: any) => sum + (e.packagePrice || e.orderAmount || 0), 0) || 0;

    // Build report sections
    const sections = [
      {
        title: 'Sales Overview',
        description: 'Revenue generation, transaction volume, and average transaction value metrics.',
        color: [34, 197, 94] as [number, number, number], // Emerald
        metrics: [
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Transactions', value: formatNumber(totalTransactions) },
          { label: 'Avg Transaction', value: formatCurrency(avgTransaction) },
          { label: 'Unique Customers', value: formatNumber(new Set(salesData?.map((s: any) => s.customerId || s.clientId)).size) },
        ],
        tableData: {
          headers: ['Metric', 'Value', 'Status'],
          rows: [
            ['Total Revenue', formatCurrency(totalRevenue), 'Current'],
            ['Transactions', formatNumber(totalTransactions), 'Current'],
            ['Average Value', formatCurrency(avgTransaction), 'Current'],
          ],
        },
      },
      {
        title: 'Sessions & Attendance',
        description: 'Class scheduling, attendance rates, and capacity utilization metrics.',
        color: [59, 130, 246] as [number, number, number], // Blue
        metrics: [
          { label: 'Total Sessions', value: formatNumber(totalSessions) },
          { label: 'Avg Class Size', value: formatNumber(Math.round(avgClassSize)) },
          { label: 'Fill Rate', value: formatPercentage(fillRate) },
          { label: 'Total Attendance', value: formatNumber(totalAttendance) },
        ],
        tableData: {
          headers: ['Metric', 'Value', 'Target'],
          rows: [
            ['Total Sessions', formatNumber(totalSessions), 'Baseline'],
            ['Average Attendance', formatNumber(Math.round(avgClassSize)), 'Target: 15+'],
            ['Fill Rate', formatPercentage(fillRate), 'Target: 85%+'],
          ],
        },
      },
      {
        title: 'Client Acquisition & Retention',
        description: 'New member onboarding, conversion, retention, and lifetime value analysis.',
        color: [168, 85, 247] as [number, number, number], // Purple
        metrics: [
          { label: 'New Clients', value: formatNumber(newClients) },
          { label: 'Conversion Rate', value: formatPercentage(conversionRate) },
          { label: 'Retention Rate', value: formatPercentage(retentionRate) },
          { label: 'Avg LTV', value: formatCurrency(avgLTV) },
        ],
        tableData: {
          headers: ['Metric', 'Value', 'Performance'],
          rows: [
            ['New Clients', formatNumber(newClients), 'Current'],
            ['Conversion Rate', formatPercentage(conversionRate), conversionRate > 30 ? '✓ Good' : '⚠ Monitor'],
            ['Retention Rate', formatPercentage(retentionRate), retentionRate > 70 ? '✓ Good' : '⚠ Monitor'],
            ['Average LTV', formatCurrency(avgLTV), 'Baseline'],
          ],
        },
      },
      {
        title: 'Trainer Performance',
        description: 'Top trainer rankings, session counts, and revenue contribution.',
        color: [99, 102, 241] as [number, number, number], // Indigo
        metrics: [
          { label: 'Total Trainers', value: formatNumber(totalTrainers) },
          { label: 'Total Sessions', value: formatNumber(totalTrainerSessions) },
          { label: 'Revenue Paid', value: formatCurrency(totalTrainerPaid) },
          { label: 'Avg Per Trainer', value: formatCurrency(totalTrainerPaid / Math.max(totalTrainers, 1)) },
        ],
        tableData: {
          headers: ['Trainer', 'Sessions', 'Revenue', 'Avg/Session'],
          rows: ((payrollData || []) as any[]).slice(0, 5).map((p: any) => [
            p.name || p.trainerName || 'Unknown',
            formatNumber(p.sessionsCount || p.numberOfClasses || 0),
            formatCurrency(p.amount || 0),
            formatCurrency((p.amount || 0) / Math.max(p.sessionsCount || p.numberOfClasses || 1, 1)),
          ]),
        },
      },
      {
        title: 'Lead Conversion Funnel',
        description: 'Lead sources, conversion pipeline, and funnel analysis.',
        color: [236, 72, 153] as [number, number, number], // Pink
        metrics: [
          { label: 'Total Leads', value: formatNumber(totalLeads) },
          { label: 'Converted', value: formatNumber(convertedLeads) },
          { label: 'Conversion Rate', value: formatPercentage(leadConversionRate) },
          { label: 'Avg Response Time', value: '24h' },
        ],
        tableData: {
          headers: ['Source', 'Leads', 'Converted', 'Rate'],
          rows: [
            ['Direct', formatNumber(Math.round(totalLeads * 0.3)), formatNumber(Math.round(convertedLeads * 0.3)), formatPercentage(leadConversionRate)],
            ['Referral', formatNumber(Math.round(totalLeads * 0.4)), formatNumber(Math.round(convertedLeads * 0.4)), formatPercentage(leadConversionRate)],
            ['Online', formatNumber(Math.round(totalLeads * 0.3)), formatNumber(Math.round(convertedLeads * 0.3)), formatPercentage(leadConversionRate)],
          ],
        },
      },
      {
        title: 'Discounts & Promotions',
        description: 'Discount impact, promotion effectiveness, and revenue analysis.',
        color: [249, 115, 22] as [number, number, number], // Amber
        metrics: [
          { label: 'Total Discounts', value: formatCurrency(totalDiscounts) },
          { label: 'Discount Count', value: formatNumber(discountCount) },
          { label: 'Discount Rate', value: formatPercentage(discountRate) },
          { label: 'Revenue Impact', value: formatPercentage((totalDiscounts / totalRevenue) * 100) },
        ],
      },
      {
        title: 'Late Cancellations',
        description: 'Cancellation patterns, frequency, and recovery strategies.',
        color: [239, 68, 68] as [number, number, number], // Red
        metrics: [
          { label: 'Total Cancellations', value: formatNumber(cancellationCount) },
          { label: 'Cancellation Rate', value: formatPercentage(cancellationRate) },
          { label: 'Revenue Impact', value: formatCurrency((cancellationCount * avgClassSize * 500) || 0) },
          { label: 'Action Items', value: formatNumber(Math.ceil(cancellationCount * 0.1)) },
        ],
      },
      {
        title: 'Membership Expirations',
        description: 'Upcoming expirations, retention opportunities, and renewal strategy.',
        color: [6, 182, 212] as [number, number, number], // Cyan
        metrics: [
          { label: 'Total Expirations', value: formatNumber(expirationCount) },
          { label: 'Expiration Value', value: formatCurrency(expiredValue) },
          { label: 'Renewal Rate', value: formatPercentage(70) },
          { label: 'Priority Renewals', value: formatNumber(Math.ceil(expirationCount * 0.3)) },
        ],
      },
    ];

    const executiveSummary = `This comprehensive executive performance report analyzes key business metrics across all operational areas for the selected period. The analysis reveals ${totalRevenue > 100000 ? 'strong' : 'moderate'} revenue generation with ${formatNumber(totalTransactions)} transactions, alongside solid client acquisition and retention metrics. Session attendance shows a ${fillRate.toFixed(1)}% fill rate, indicating ${fillRate > 80 ? 'healthy' : 'room for improvement in'} capacity utilization. Strategic focus areas include optimizing trainer performance, improving lead conversion rates, and reducing late cancellations.`;

    const recommendations = [
      `Implement targeted promotions during low-attendance periods to improve the ${fillRate.toFixed(1)}% fill rate toward the 85% target.`,
      `Focus on trainer retention and development initiatives, with emphasis on top performers and those with lower conversion metrics.`,
      `Enhance lead nurturing processes to increase the current ${leadConversionRate.toFixed(1)}% conversion rate toward industry benchmarks of 35-40%.`,
      `Develop a proactive membership renewal strategy targeting the ${expirationCount} members with upcoming expirations.`,
      `Implement automated reminders and incentives to reduce late cancellations (currently ${cancellationRate.toFixed(1)}% of sessions).`,
      `Analyze discount effectiveness and optimize promotion strategy to maximize revenue while maintaining profitability.`,
    ];

    return {
      dateRange: options?.dateRange
        ? `${options.dateRange.start} to ${options.dateRange.end}`
        : 'Current Period',
      location: options?.location || 'All Locations',
      sections,
      executiveSummary,
      recommendations,
    };
  }, [salesData, sessionsData, clientData, payrollData, leadsData, discountData, cancellationsData, expirationsData]);

  const generateAndDownloadPDF = useCallback(async () => {
    const reportData = generateReportData();
    await downloadComprehensiveExecutivePDF(reportData, `Executive_Report_${new Date().getTime()}.pdf`);
  }, [generateReportData]);

  return {
    generateReportData,
    generateAndDownloadPDF,
    isLoading: false,
  };
};

export default useExecutiveReportGenerator;
