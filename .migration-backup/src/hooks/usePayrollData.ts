import { useState, useEffect } from 'react';
import { PayrollData } from '@/types/dashboard';
import { fetchGoogleSheet, parseNumericValue, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';

const mapRowToPayroll = (row: any[]): PayrollData => {
  const teacherId = row[0] || '';
  const teacherName = row[1] || '';
  const teacherEmail = row[2] || '';
  const location = row[3] || '';

  const cycleSessions = parseNumericValue(row[4]);
  const emptyCycleSessions = parseNumericValue(row[5]);
  const nonEmptyCycleSessions = parseNumericValue(row[6]);
  const cycleCustomers = parseNumericValue(row[7]);
  const cyclePaid = parseNumericValue(row[8]);

  const strengthSessions = parseNumericValue(row[9]);
  const emptyStrengthSessions = parseNumericValue(row[10]);
  const nonEmptyStrengthSessions = parseNumericValue(row[11]);
  const strengthCustomers = parseNumericValue(row[12]);
  const strengthPaid = parseNumericValue(row[13]);

  const barreSessions = parseNumericValue(row[14]);
  const emptyBarreSessions = parseNumericValue(row[15]);
  const nonEmptyBarreSessions = parseNumericValue(row[16]);
  const barreCustomers = parseNumericValue(row[17]);
  const barrePaid = parseNumericValue(row[18]);

  const totalSessions = parseNumericValue(row[19]);
  const totalEmptySessions = parseNumericValue(row[20]);
  const totalNonEmptySessions = parseNumericValue(row[21]);
  const totalCustomers = parseNumericValue(row[22]);
  const totalPaid = parseNumericValue(row[23]);

  const monthYear = row[24] || '';
  const unique = row[25] || '';
  const converted = parseNumericValue(row[26]);
  const conversionRate = parseNumericValue(row[27]);
  const retained = parseNumericValue(row[28]);
  const retentionRate = parseNumericValue(row[29]);
  const newMembers = parseNumericValue(row[30]);

  const classAverageInclEmpty = totalSessions > 0 ? totalCustomers / totalSessions : 0;
  const classAverageExclEmpty = totalNonEmptySessions > 0 ? totalCustomers / totalNonEmptySessions : 0;

  return {
    teacherId,
    teacherName,
    teacherEmail,
    location,
    cycleSessions,
    emptyCycleSessions,
    nonEmptyCycleSessions,
    cycleCustomers,
    cyclePaid,
    strengthSessions,
    emptyStrengthSessions,
    nonEmptyStrengthSessions,
    strengthCustomers,
    strengthPaid,
    barreSessions,
    emptyBarreSessions,
    nonEmptyBarreSessions,
    barreCustomers,
    barrePaid,
    totalSessions,
    totalEmptySessions,
    totalNonEmptySessions,
    totalCustomers,
    totalPaid,
    monthYear,
    unique,
    converted,
    conversion: `${conversionRate}%`,
    retained,
    retention: `${retentionRate}%`,
    new: newMembers,
    conversionRate,
    retentionRate,
    classAverageInclEmpty,
    classAverageExclEmpty,
  };
};

export const usePayrollData = () => {
  const [data, setData] = useState<PayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useDataSource();

  const fetchPayrollData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { rows } = await loadDatasetRowsForMode('payroll', mode, async () => {
        try {
          const response = await fetch('/api/payroll');
          if (!response.ok) {
            throw new Error(`Failed to fetch payroll data: ${response.status} ${response.statusText}`);
          }

          const result = await response.json();
          if (result.error) {
            throw new Error(result.error);
          }

          const headers = [
            'teacherId', 'teacherName', 'teacherEmail', 'location',
            'cycleSessions', 'emptyCycleSessions', 'nonEmptyCycleSessions', 'cycleCustomers', 'cyclePaid',
            'strengthSessions', 'emptyStrengthSessions', 'nonEmptyStrengthSessions', 'strengthCustomers', 'strengthPaid',
            'barreSessions', 'emptyBarreSessions', 'nonEmptyBarreSessions', 'barreCustomers', 'barrePaid',
            'totalSessions', 'totalEmptySessions', 'totalNonEmptySessions', 'totalCustomers', 'totalPaid',
            'monthYear', 'unique', 'converted', 'conversionRate', 'retained', 'retentionRate', 'newMembers'
          ];

          const bodyRows = (result.data || []).map((item: any) => [
            item.teacherId,
            item.teacherName,
            item.teacherEmail,
            item.location,
            item.cycleSessions,
            item.emptyCycleSessions,
            item.nonEmptyCycleSessions,
            item.cycleCustomers,
            item.cyclePaid,
            item.strengthSessions,
            item.emptyStrengthSessions,
            item.nonEmptyStrengthSessions,
            item.strengthCustomers,
            item.strengthPaid,
            item.barreSessions,
            item.emptyBarreSessions,
            item.nonEmptyBarreSessions,
            item.barreCustomers,
            item.barrePaid,
            item.totalSessions,
            item.totalEmptySessions,
            item.totalNonEmptySessions,
            item.totalCustomers,
            item.totalPaid,
            item.monthYear,
            item.unique,
            item.converted,
            item.conversionRate,
            item.retained,
            item.retentionRate,
            item.new,
          ]);

          return [headers, ...bodyRows];
        } catch {
          return fetchGoogleSheet(SPREADSHEET_IDS.PAYROLL, 'Payroll', {
            valueRenderOption: 'FORMATTED_VALUE',
          });
        }
      });

      const loadedData = rows.length < 2 ? [] : rows.slice(1).map(mapRowToPayroll);

      setData(loadedData || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching payroll data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payroll data');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [mode]);

  return { data, isLoading, error, refetch: fetchPayrollData };
};
