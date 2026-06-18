
import { useState, useEffect } from 'react';
import { fetchGoogleSheet, parseNumericValue, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';

const logger = createLogger('useSessionsData');

export interface SessionData {
  trainerId: string;
  trainerFirstName: string;
  trainerLastName: string;
  trainerName: string;
  sessionId: string;
  sessionName: string;
  capacity: number;
  checkedInCount: number;
  lateCancelledCount: number;
  bookedCount: number;
  complimentaryCount: number;
  location: string;
  date: string;
  dayOfWeek: string;
  time: string;
  totalPaid: number;
  nonPaidCount: number;
  uniqueId1: string;
  uniqueId2: string;
  checkedInsWithMemberships: number;
  checkedInsWithPackages: number;
  checkedInsWithIntroOffers: number;
  checkedInsWithSingleClasses: number;
  classType: string;
  cleanedClass: string;
  classes: number;
  fillPercentage?: number;
  revenue?: number;
  // Legacy field for backward compatibility
  uniqueId?: string;
}

export const useSessionsData = () => {
  const [data, setData] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useDataSource();

  const fetchSessionsData = async () => {
    try {
      setLoading(true);
      logger.info('Fetching sessions data...');
      
      const { rows } = await loadDatasetRowsForMode('sessions', mode, async () => {
        return fetchGoogleSheet(SPREADSHEET_IDS.SESSIONS, 'Sessions', {
          valueRenderOption: 'FORMATTED_VALUE'
        });
      });
      
      if (rows.length < 2) {
        setData([]);
        return;
      }

      const sessionsData: SessionData[] = rows.slice(1).map((row: any[]) => {
        const capacity = parseNumericValue(row[6]);
        const checkedInCount = parseNumericValue(row[7]);
        const fillPercentage = capacity > 0 ? (checkedInCount / capacity) * 100 : 0;
        
        return {
          trainerId: row[0] || '',
          trainerFirstName: row[1] || '',
          trainerLastName: row[2] || '',
          trainerName: row[3] || '',
          sessionId: row[4] || '',
          sessionName: row[5] || '',
          capacity,
          checkedInCount,
          lateCancelledCount: parseNumericValue(row[8]),
          bookedCount: parseNumericValue(row[9]),
          complimentaryCount: parseNumericValue(row[10]),
          location: row[11] || '',
          date: row[12] || '',
          dayOfWeek: row[13] || '',
          time: row[14] || '',
          totalPaid: parseNumericValue(row[15]),
          nonPaidCount: parseNumericValue(row[16]),
          uniqueId1: row[17] || '',
          uniqueId2: row[18] || '',
          checkedInsWithMemberships: parseNumericValue(row[19]),
          checkedInsWithPackages: parseNumericValue(row[20]),
          checkedInsWithIntroOffers: parseNumericValue(row[21]),
          checkedInsWithSingleClasses: parseNumericValue(row[22]),
          classType: row[23] || '',
          cleanedClass: row[24] || '',
          classes: parseNumericValue(row[25]),
          fillPercentage,
          revenue: parseNumericValue(row[15]),
          uniqueId: row[17] || ''
        };
      });

      setData(sessionsData);
      setError(null);
    } catch (err) {
      logger.error('Error fetching sessions data:', err);
      setError('Failed to load sessions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionsData();
  }, [mode]);

  return { data, loading, error, refetch: fetchSessionsData };
};
