import { useState, useEffect } from 'react';
import { ExpirationData } from '@/types/dashboard';
import { fetchGoogleSheet, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';

const logger = createLogger('useExpirationsData');
const SHEET_NAME = "Lapsed";

export const useExpirationsData = () => {
  const [data, setData] = useState<ExpirationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useDataSource();

  const fetchExpirationsData = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Fetching expirations data...');

      const { rows } = await loadDatasetRowsForMode('expirations', mode, async () => {
        return fetchGoogleSheet(SPREADSHEET_IDS.EXPIRATIONS, SHEET_NAME, {
          valueRenderOption: 'FORMATTED_VALUE'
        });
      });

      logger.info(`Total rows received: ${rows.length}`);

      if (rows.length < 2) {
        logger.warn('No data found in the sheet');
        setData([]);
        return;
      }

      // Detect format by checking if first row looks like a header
      const firstRow: string[] = rows[0];
      const hasHeader = typeof firstRow[0] === 'string' && isNaN(Number(firstRow[0]));
      const dataRows = hasHeader ? rows.slice(1) : rows;

      // Column positions for the 15-col format:
      // 0: Unique Id, 1: Member ID, 2: First Name, 3: Last Name, 4: Email,
      // 5: Membership Name, 6: End Date, 7: Home Location, 8: Current Usage,
      // 9: Id, 10: Order At, 11: Sold By, 12: Membership Id, 13: Frozen, 14: Paid
      const processedData: ExpirationData[] = dataRows.map((row: string[]) => {
        const g = (i: number): string => (row[i] != null ? String(row[i]) : '');

        const homeLocation = g(7);

        return {
          uniqueId:       g(0) || `${g(1)}_${g(6)}`,
          memberId:       g(1),
          firstName:      g(2),
          lastName:       g(3),
          email:          g(4),
          membershipName: g(5),
          endDate:        g(6),
          homeLocation,
          primaryLocation: homeLocation,
          currentUsage:   g(8) || '-',
          id:             g(9),
          orderAt:        g(10),
          soldBy:         g(11) || '-',
          membershipId:   g(12) || '-',
          frozen:         g(13)?.toUpperCase() === 'TRUE',
          paid:           g(14) || '-',
          // Numeric derived from paid field
          amountPaid:     parseFloat(g(14)) || 0,
          // Rich fields not in this sheet — leave as defaults
          status:         'Lapsed',
        };
      });

      logger.info(`Processed ${processedData.length} expirations`);
      setData(processedData);
    } catch (error) {
      logger.error('Error fetching expirations data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpirationsData();
  }, [mode]);

  return {
    data,
    loading,
    error,
    refetch: fetchExpirationsData,
  };
};
