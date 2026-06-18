import { useState, useEffect } from 'react';
import { MemberBehaviorData, MonthlyMetrics } from '@/types/memberBehavior';
import { fetchGoogleSheet, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useVCMemberData');

const SPREADSHEET_ID =
  import.meta.env.VITE_GOOGLE_SESSIONS_SPREADSHEET_ID ||
  import.meta.env.VITE_SESSIONS_SPREADSHEET_ID ||
  SPREADSHEET_IDS.SESSIONS;
const VC_SHEET_NAME = 'VC';

interface UseVCMemberDataResult {
  data: MemberBehaviorData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useVCMemberData = (): UseVCMemberDataResult => {
  const [data, setData] = useState<MemberBehaviorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseMonthlyMetrics = (row: any[], headers: string[]): Record<string, MonthlyMetrics> => {
    const monthlyData: Record<string, MonthlyMetrics> = {};
    
    // Find all unique month-year combinations
    const monthPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} - /;
    const months = new Set<string>();
    
    headers.forEach(header => {
      const match = header.match(monthPattern);
      if (match) {
        const monthYear = header.split(' - ')[0];
        months.add(monthYear);
      }
    });

    // For each month, extract the metrics
    months.forEach(monthYear => {
      const bookedIdx = headers.findIndex(h => h === `${monthYear} - Booked`);
      const visitsIdx = headers.findIndex(h => h === `${monthYear} - Visits`);
      const cancellationsIdx = headers.findIndex(h => h === `${monthYear} - Cancellations`);
      const paidIdx = headers.findIndex(h => h === `${monthYear} - Paid Amount`);
      const unpaidIdx = headers.findIndex(h => h === `${monthYear} - Unpaid Amount`);

      if (bookedIdx !== -1) {
        monthlyData[monthYear] = {
          booked: parseFloat(row[bookedIdx]?.toString() || '0') || 0,
          visits: parseFloat(row[visitsIdx]?.toString() || '0') || 0,
          cancellations: parseFloat(row[cancellationsIdx]?.toString() || '0') || 0,
          paidAmount: parseFloat(row[paidIdx]?.toString() || '0') || 0,
          unpaidAmount: parseFloat(row[unpaidIdx]?.toString() || '0') || 0,
        };
      }
    });

    return monthlyData;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    if (!SPREADSHEET_ID) {
      const msg = 'Sessions spreadsheet is not configured for VC member behavior data';
      logger.error(msg);
      setError(msg);
      setLoading(false);
      return;
    }

    try {
      logger.info('🔄 Fetching VC member data from Google Sheets...');
      const rows = await fetchGoogleSheet(SPREADSHEET_ID, VC_SHEET_NAME);

      if (rows.length < 2) {
        throw new Error('VC sheet appears to be empty');
      }

      const headers = rows[0];
      const memberData: MemberBehaviorData[] = [];

      // Process each row (skip header)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 5 || !row[0]) continue; // Skip empty rows

        const memberId = row[0]?.toString() || '';
        const firstName = row[1]?.toString() || '';
        const lastName = row[2]?.toString() || '';
        const email = row[3]?.toString() || '';
        const phone = row[4]?.toString() || '';

        const monthlyData = parseMonthlyMetrics(row, headers);

        memberData.push({
          memberId,
          firstName,
          lastName,
          email,
          phone,
          monthlyData,
        });
      }

      logger.info(`✅ Loaded ${memberData.length} members from VC sheet`);
      setData(memberData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching VC data';
      logger.error('❌ Error fetching VC member data:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
