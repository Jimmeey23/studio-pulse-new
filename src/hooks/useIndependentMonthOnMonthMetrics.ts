import { useMemo } from 'react';
import { SalesData, NewClientData, PayrollData, ExpirationData } from '@/types/dashboard';
import { LeadsData } from '@/types/leads';
import { useSalesData } from './useSalesData';
import { useSessionsData, SessionData } from './useSessionsData';
import { useNewClientData } from './useNewClientData';
import { useLeadsData } from './useLeadsData';
import { usePayrollData } from './usePayrollData';
import { useExpirationsData } from './useExpirationsData';
import { useDiscountsData } from './useDiscountsData';
import { parseDate as robustParseDate } from '@/utils/dateUtils';

/**
 * Independent Month-On-Month Metrics Hook
 * 
 * Returns aggregated metrics for each calendar month over the past 24 months,
 * independent of any date range or location filters applied by the user.
 * 
 * This allows the Month-On-Month table in Executive Dashboard to show
 * complete historical data regardless of current filter selections.
 */

export interface MonthlyMetrics {
  monthKey: string; // "2024-01", "2024-02", etc.
  monthLabel: string; // "January 2024"
  year: number;
  month: number;
  
  // Sales metrics
  totalRevenue: number;
  totalSalesCount: number;
  
  // Sessions metrics
  totalSessions: number;
  totalAttendance: number;
  
  // Clients metrics
  newClients: number;
  
  // Leads metrics
  totalLeads: number;
  convertedLeads: number;
  
  // Trainers metrics (payroll)
  totalPayroll: number;
  
  // Discounts metrics
  totalDiscounts: number;
  
  // Expirations metrics
  totalExpirations: number;
}

export const useIndependentMonthOnMonthMetrics = () => {
  // Fetch all raw data (unfiltered by date range or location)
  const salesData = useSalesData();
  const sessionsData = useSessionsData();
  const clientsData = useNewClientData();
  const leadsData = useLeadsData();
  const payrollData = usePayrollData();
  const expirationsData = useExpirationsData();
  const discountsData = useDiscountsData();

  const metrics = useMemo(() => {
    // Early return if data is still loading
    if (
      salesData.loading ||
      sessionsData.loading ||
      clientsData.loading ||
      leadsData.loading ||
      payrollData.isLoading ||
      expirationsData.loading ||
      discountsData.loading
    ) {
      return [];
    }

    const parseDate = (d: any): Date | null => robustParseDate(typeof d === 'string' ? d : String(d));
    const monthKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = (d: Date): string => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Helper to aggregate data by month
    const aggregateByMonth = <T extends any>(
      data: T[],
      dateField: keyof T,
      aggregator: (item: T, month: string) => Record<string, number>
    ): Map<string, Record<string, number>> => {
      const monthMap = new Map<string, Record<string, number>>();

      data.forEach((item) => {
        const dateStr = item[dateField];
        const date = parseDate(dateStr);
        if (!date) return;

        const month = monthKey(date);
        const agg = aggregator(item, month);

        if (!monthMap.has(month)) {
          monthMap.set(month, {});
        }

        const current = monthMap.get(month)!;
        Object.keys(agg).forEach((key) => {
          current[key] = (current[key] || 0) + agg[key];
        });
      });

      return monthMap;
    };

    // Aggregate each data type by month
    const salesByMonth = aggregateByMonth(
      salesData.data || [],
      'paymentDate' as keyof SalesData,
      (item: SalesData) => ({
        revenue: item.paymentValue || 0,
        count: 1,
      })
    );

    const sessionsByMonth = aggregateByMonth(
      sessionsData.data || [],
      'date' as keyof SessionData,
      (item: SessionData) => ({
        sessions: 1,
        attendance: item.checkedInCount || 0,
      })
    );

    const clientsByMonth = aggregateByMonth(
      clientsData.data || [],
      'registrationDate' as keyof NewClientData,
      (item: NewClientData) => ({
        newClients: 1,
      })
    );

    const leadsByMonth = aggregateByMonth(
      leadsData.data || [],
      'createdAt' as keyof LeadsData,
      (item: LeadsData) => ({
        leads: 1,
        converted: item.status === 'Converted' ? 1 : 0,
      })
    );

    const payrollByMonth = aggregateByMonth(
      payrollData.data || [],
      'monthYear' as keyof PayrollData,
      (item: PayrollData) => ({
        payroll: item.totalPaid || 0,
      })
    );

    const expirationsByMonth = aggregateByMonth(
      expirationsData.data || [],
      'expirationDate' as keyof ExpirationData,
      (item: ExpirationData) => ({
        expirations: 1,
      })
    );

    const discountsByMonth = aggregateByMonth(
      discountsData.data || [],
      'date' as keyof any,
      (item: any) => ({
        discounts: item.discountAmount || 0,
      })
    );

    // Merge all months and generate final metrics
    const allMonths = new Set<string>();
    [
      salesByMonth,
      sessionsByMonth,
      clientsByMonth,
      leadsByMonth,
      payrollByMonth,
      expirationsByMonth,
      discountsByMonth,
    ].forEach((map) => {
      map.forEach((_, month) => allMonths.add(month));
    });

    // Sort months in descending order (most recent first)
    const sortedMonths = Array.from(allMonths).sort().reverse();

    // Generate metrics for each month
    const result: MonthlyMetrics[] = sortedMonths.map((month) => {
      const date = new Date(`${month}-01`);
      const sales = salesByMonth.get(month) || {};
      const sessions = sessionsByMonth.get(month) || {};
      const clients = clientsByMonth.get(month) || {};
      const leads = leadsByMonth.get(month) || {};
      const payroll = payrollByMonth.get(month) || {};
      const expirations = expirationsByMonth.get(month) || {};
      const discounts = discountsByMonth.get(month) || {};

      return {
        monthKey: month,
        monthLabel: monthLabel(date),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        totalRevenue: sales.revenue || 0,
        totalSalesCount: sales.count || 0,
        totalSessions: sessions.sessions || 0,
        totalAttendance: sessions.attendance || 0,
        newClients: clients.newClients || 0,
        totalLeads: leads.leads || 0,
        convertedLeads: leads.converted || 0,
        totalPayroll: payroll.payroll || 0,
        totalExpirations: expirations.expirations || 0,
        totalDiscounts: discounts.discounts || 0,
      };
    });

    return result;
  }, [salesData, sessionsData, clientsData, leadsData, payrollData, expirationsData, discountsData]);

  return {
    metrics,
    loading:
      salesData.loading ||
      sessionsData.loading ||
      clientsData.loading ||
      leadsData.loading ||
      payrollData.isLoading ||
      expirationsData.loading ||
      discountsData.loading,
    error: null,
  };
};
