import { useState, useEffect } from 'react';
import { batchFetchGoogleSheet, parseNumericValue } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useRecurringSessionsData');

export interface RecurringSessionData {
  trainerId: string;
  firstName: string;
  lastName: string;
  trainer: string;
  sessionId: string;
  sessionName: string;
  capacity: number;
  checkedIn: number;
  lateCancelled: number;
  booked: number;
  complimentary: number;
  location: string;
  date: string;
  day: string;
  time: string;
  revenue: number;
  nonPaid: number;
  uniqueId1: string;
  uniqueId2: string;
  memberships: number;
  packages: number;
  introOffers: number;
  singleClasses: number;
  type: string;
  class: string;
  classes: number;
  totalSessions: number;
  emptySessions: number;
  nonEmptySessions: number;
  totalCheckedInSum: number;
  totalCapacitySum: number;
  totalRevenueSum: number;
  classAvgInclEmpty: number;
  classAvgExclEmpty: number;
  fillRate: string;
  weightedAverage: number;
  top5Trainers?: string;
  fillPercentage?: number;
}

const SPREADSHEET_ID = "1sDPAX6OmGb48kL1pm0mhin2C9KD-Jykq8skJjNuQUNg";

export const useRecurringSessionsData = () => {
  const [data, setData] = useState<RecurringSessionData[]>([]);
  const [teacherData, setTeacherData] = useState<RecurringSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both sheets using batch fetch
      const results = await batchFetchGoogleSheet(SPREADSHEET_ID, ['Recurring', 'Teacher Recurring']);
      
      const recurringRows = results[0];
      const teacherRows = results[1];
      
      // Process Recurring data
      if (recurringRows.length > 1) {
        const recurringData: RecurringSessionData[] = recurringRows.slice(1).map((row: any[]) => {
          const capacity = parseNumericValue(row[6]);
          const checkedIn = parseNumericValue(row[7]);
          const fillPercentage = capacity > 0 ? (checkedIn / capacity) * 100 : 0;
          
          return {
            trainerId: row[0] || '',
            firstName: row[1] || '',
            lastName: row[2] || '',
            trainer: row[3] || '',
            sessionId: row[4] || '',
            sessionName: row[5] || '',
            capacity,
            checkedIn,
            lateCancelled: parseNumericValue(row[8]),
            booked: parseNumericValue(row[9]),
            complimentary: parseNumericValue(row[10]),
            location: row[11] || '',
            date: row[12] || '',
            day: row[13] || '',
            time: row[14] || '',
            revenue: parseNumericValue(row[15]),
            nonPaid: parseNumericValue(row[16]),
            uniqueId1: row[17] || '',
            uniqueId2: row[18] || '',
            memberships: parseNumericValue(row[19]),
            packages: parseNumericValue(row[20]),
            introOffers: parseNumericValue(row[21]),
            singleClasses: parseNumericValue(row[22]),
            type: row[23] || '',
            class: row[24] || '',
            classes: parseNumericValue(row[25]),
            totalSessions: parseNumericValue(row[26]),
            emptySessions: parseNumericValue(row[27]),
            nonEmptySessions: parseNumericValue(row[28]),
            totalCheckedInSum: parseNumericValue(row[29]),
            totalCapacitySum: parseNumericValue(row[30]),
            totalRevenueSum: parseNumericValue(row[31]),
            classAvgInclEmpty: parseNumericValue(row[32]),
            classAvgExclEmpty: parseNumericValue(row[33]),
            fillRate: row[34] || '0%',
            weightedAverage: parseNumericValue(row[35]),
            top5Trainers: row[36] || '',
            fillPercentage
          };
        });
        setData(recurringData);
      }

      // Process Teacher Recurring data
      if (teacherRows.length > 1) {
        const teacherRecurringData: RecurringSessionData[] = teacherRows.slice(1).map((row: any[]) => {
          const capacity = parseNumericValue(row[6]);
          const checkedIn = parseNumericValue(row[7]);
          const fillPercentage = capacity > 0 ? (checkedIn / capacity) * 100 : 0;
          
          return {
            trainerId: row[0] || '',
            firstName: row[1] || '',
            lastName: row[2] || '',
            trainer: row[3] || '',
            sessionId: row[4] || '',
            sessionName: row[5] || '',
            capacity,
            checkedIn,
            lateCancelled: parseNumericValue(row[8]),
            booked: parseNumericValue(row[9]),
            complimentary: parseNumericValue(row[10]),
            location: row[11] || '',
            date: row[12] || '',
            day: row[13] || '',
            time: row[14] || '',
            revenue: parseNumericValue(row[15]),
            nonPaid: parseNumericValue(row[16]),
            uniqueId1: row[17] || '',
            uniqueId2: row[18] || '',
            memberships: parseNumericValue(row[19]),
            packages: parseNumericValue(row[20]),
            introOffers: parseNumericValue(row[21]),
            singleClasses: parseNumericValue(row[22]),
            type: row[23] || '',
            class: row[24] || '',
            classes: parseNumericValue(row[25]),
            totalSessions: parseNumericValue(row[26]),
            emptySessions: parseNumericValue(row[27]),
            nonEmptySessions: parseNumericValue(row[28]),
            totalCheckedInSum: parseNumericValue(row[29]),
            totalCapacitySum: parseNumericValue(row[30]),
            totalRevenueSum: parseNumericValue(row[31]),
            classAvgInclEmpty: parseNumericValue(row[32]),
            classAvgExclEmpty: parseNumericValue(row[33]),
            fillRate: row[34] || '0%',
            weightedAverage: parseNumericValue(row[35]),
            fillPercentage
          };
        });
        setTeacherData(teacherRecurringData);
      }

      setError(null);
    } catch (err) {
      logger.error('Error fetching recurring sessions data:', err);
      setError('Failed to load recurring sessions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, teacherData, loading, error, refetch: fetchData };
};
