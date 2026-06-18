import { useState, useEffect } from 'react';
import { fetchGoogleSheet, parseNumericValue } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';

const logger = createLogger('useCheckinsData');
const SPREADSHEET_ID = "1a7XKv2WCog7o8nYuV8YcFdqtfPYJNRO6DelJ6Hn_z6Q";

export interface CheckinData {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  orderAt: string;
  paid: number;
  paymentMethodName: string;
  checkedIn: boolean;
  complementary: boolean;
  isLateCancelled: boolean;
  sessionId: string;
  sessionName: string;
  capacity: number;
  location: string;
  dateIST: string;
  dayOfWeek: string;
  time: string;
  durationMinutes: number;
  teacherName: string;
  cleanedProduct: string;
  cleanedCategory: string;
  cleanedClass: string;
  hostId: string;
  month: string;
  year: number;
  classNo: number;
  isNew: string;
}

export const useCheckinsData = () => {
  const [data, setData] = useState<CheckinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useDataSource();

  const parseBoolean = (value: string | boolean): boolean => {
    if (typeof value === 'boolean') return value;
    return value?.toString().toUpperCase() === 'TRUE';
  };

  const fetchCheckinsData = async () => {
    try {
      logger.info('Fetching checkins data...');
      setLoading(true);
      
      const { rows } = await loadDatasetRowsForMode('checkins', mode, async () => {
        return fetchGoogleSheet(SPREADSHEET_ID, 'Checkins', {
          valueRenderOption: 'FORMATTED_VALUE'
        });
      });

      if (rows.length < 2) {
        setData([]);
        setError(null);
        return;
      }

      const checkinsData: CheckinData[] = rows.slice(1).map((row: any[]) => ({
        memberId: row[0]?.toString() || '',
        firstName: row[1] || '',
        lastName: row[2] || '',
        email: row[3] || '',
        orderAt: row[4] || '',
        paid: parseNumericValue(row[5]),
        paymentMethodName: row[6] || '',
        checkedIn: parseBoolean(row[7]),
        complementary: parseBoolean(row[8]),
        isLateCancelled: parseBoolean(row[9]),
        sessionId: row[10]?.toString() || '',
        sessionName: row[11] || '',
        capacity: parseNumericValue(row[12]),
        location: row[13] || '',
        dateIST: row[14] || '',
        dayOfWeek: row[15] || '',
        time: row[16] || '',
        durationMinutes: parseNumericValue(row[17]),
        teacherName: row[18] || '',
        cleanedProduct: row[19] || '',
        cleanedCategory: row[20] || '',
        cleanedClass: row[21] || '',
        hostId: row[22]?.toString() || '',
        month: row[23] || '',
        year: parseNumericValue(row[24]),
        classNo: parseNumericValue(row[25]),
        isNew: row[26] || ''
      }));

      setData(checkinsData);
      setError(null);
      logger.info(`Loaded ${checkinsData.length} checkins`);
    } catch (err) {
      logger.error('Error fetching checkins data:', err);
      setError('Failed to load checkins data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckinsData();
  }, [mode]);

  return { data, loading, error, refetch: fetchCheckinsData };
};
