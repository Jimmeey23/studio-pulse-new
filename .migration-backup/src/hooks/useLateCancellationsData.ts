import { useState, useEffect } from 'react';
import { LateCancellationsData } from '@/types/dashboard';
import { fetchGoogleSheet, parseNumericValue } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';

const logger = createLogger('useLateCancellationsData');

const LATE_CANCELLATIONS_SPREADSHEET_ID = '149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI';
const LATE_CANCELLATIONS_SHEET_NAME = 'Late Cancellations';
const CHECKINS_SPREADSHEET_ID = '1a7XKv2WCog7o8nYuV8YcFdqtfPYJNRO6DelJ6Hn_z6Q';
const CHECKINS_SHEET_NAME = 'Checkins';

const isTrueish = (value: unknown): boolean => String(value ?? '').trim().toUpperCase() === 'TRUE';

const parseDateTime = (value?: string): Date | null => {
  if (!value) return null;
  const normalized = value.replace(', ', 'T').replace(',', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateOnly = (value?: string): string => {
  const parsed = parseDateTime(value);
  if (!parsed) return value?.split(',')[0]?.trim() || '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthName = (date: Date): string => date.toLocaleString('en-US', { month: 'long' });

const splitCustomerName = (fullName?: string) => {
  const trimmed = (fullName || '').trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
};

const getCancellationWindow = (minutes?: number): string => {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 0) return 'Unknown';
  if (minutes < 60) return '<1 hour';
  if (minutes < 180) return '1-3 hours';
  if (minutes < 360) return '3-6 hours';
  if (minutes < 720) return '6-12 hours';
  if (minutes < 1440) return '12-24 hours';
  return '24+ hours';
};

const buildLegacyCheckinsRows = (rows: any[][]): any[] => {
  if (rows.length < 2) return [];

  const headers = rows[0];
  const findIndex = (name: string) => headers.findIndex((h: string) => h?.toLowerCase() === name.toLowerCase());

  const memberIdIndex = findIndex('Member ID');
  const firstNameIndex = findIndex('First Name');
  const lastNameIndex = findIndex('Last Name');
  const emailIndex = findIndex('Email');
  const locationIndex = findIndex('Location');
  const sessionNameIndex = findIndex('Session Name');
  const teacherNameIndex = findIndex('Teacher Name');
  const cleanedProductIndex = findIndex('Cleaned Product');
  const cleanedCategoryIndex = findIndex('Cleaned Category');
  const cleanedClassIndex = findIndex('Cleaned Class');
  const paymentMethodIndex = findIndex('Payment Method Name');
  const dateIndex = findIndex('Date (IST)');
  const dayOfWeekIndex = findIndex('Day of Week');
  const timeIndex = findIndex('Time');
  const durationIndex = findIndex('Duration (Minutes)');
  const capacityIndex = findIndex('Capacity');
  const monthIndex = findIndex('Month');
  const yearIndex = findIndex('Year');
  const paidIndex = findIndex('Paid');
  const checkedInIndex = findIndex('Checked In');
  const complementaryIndex = findIndex('Complementary');
  const isLateCancelledIndex = findIndex('Is Late Cancelled');

  return rows.slice(1).filter(Boolean).map((row) => {
    const checkedIn = checkedInIndex >= 0 ? isTrueish(row[checkedInIndex]) : false;
    const isLateCancelled = isLateCancelledIndex >= 0 ? isTrueish(row[isLateCancelledIndex]) : false;
    return {
      memberId: memberIdIndex >= 0 ? row[memberIdIndex] : '',
      firstName: firstNameIndex >= 0 ? row[firstNameIndex] : '',
      lastName: lastNameIndex >= 0 ? row[lastNameIndex] : '',
      email: emailIndex >= 0 ? row[emailIndex] : '',
      location: locationIndex >= 0 ? row[locationIndex] : '',
      sessionName: sessionNameIndex >= 0 ? row[sessionNameIndex] : '',
      teacherName: teacherNameIndex >= 0 ? row[teacherNameIndex] : '',
      cleanedProduct: cleanedProductIndex >= 0 ? row[cleanedProductIndex] : '',
      cleanedCategory: cleanedCategoryIndex >= 0 ? row[cleanedCategoryIndex] : '',
      cleanedClass: cleanedClassIndex >= 0 ? row[cleanedClassIndex] : '',
      paymentMethodName: paymentMethodIndex >= 0 ? row[paymentMethodIndex] : '',
      dateIST: dateIndex >= 0 ? row[dateIndex] : '',
      dayOfWeek: dayOfWeekIndex >= 0 ? row[dayOfWeekIndex] : '',
      time: timeIndex >= 0 ? row[timeIndex] : '',
      duration: durationIndex >= 0 ? parseNumericValue(row[durationIndex]) : 0,
      capacity: capacityIndex >= 0 ? parseNumericValue(row[capacityIndex]) : 0,
      checkedIn,
      complementary: complementaryIndex >= 0 ? isTrueish(row[complementaryIndex]) : false,
      month: monthIndex >= 0 ? row[monthIndex] : '',
      year: yearIndex >= 0 ? parseNumericValue(row[yearIndex]) : 0,
      paidAmount: paidIndex >= 0 ? parseNumericValue(row[paidIndex]) : 0,
      isLateCancelled,
      isCancelled: !isLateCancelled && !checkedIn,
      cancellationType: isLateCancelled ? 'late-cancelled' : !checkedIn ? 'cancelled' : 'attended',
    };
  });
};

export const useLateCancellationsData = () => {
  const [data, setData] = useState<LateCancellationsData[]>([]);
  // New: retain all raw checkins (unfiltered) for additional analytics
  const [allCheckins, setAllCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useDataSource();

  const fetchLateCancellationsData = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching late cancellations data from Google Sheets...');

      const [lateCancellationRows, rawCheckinRows] = await Promise.all([
        (async () => {
          if (mode === 'offline') {
            logger.warn('Late cancellations sheet is unavailable in offline mode; returning empty live dataset.');
            return [] as any[][];
          }

          return fetchGoogleSheet(LATE_CANCELLATIONS_SPREADSHEET_ID, LATE_CANCELLATIONS_SHEET_NAME, {
            valueRenderOption: 'FORMATTED_VALUE'
          });
        })(),
        loadDatasetRowsForMode('checkins', mode, async () => {
          return fetchGoogleSheet(CHECKINS_SPREADSHEET_ID, CHECKINS_SHEET_NAME, {
            valueRenderOption: 'FORMATTED_VALUE'
          });
        }).then(result => result.rows)
      ]);
      
      logger.info('Late cancellations fetch result:', {
        status: 'success',
        rowsReceived: lateCancellationRows.length,
        sheetId: LATE_CANCELLATIONS_SPREADSHEET_ID,
        legacyCheckinsRows: rawCheckinRows.length,
      });
      
      const legacyCheckins = buildLegacyCheckinsRows(rawCheckinRows);

      if (lateCancellationRows.length < 2) {
        logger.warn('No data rows found in Late Cancellations sheet');
        setData([]);
        setAllCheckins(legacyCheckins);
        return;
      }

      const headers = lateCancellationRows[0];
      logger.info('Late cancellations sheet headers:', headers);

      const findIndex = (name: string) => headers.findIndex((h: string) => h?.toLowerCase() === name.toLowerCase());
      const hostIdIndex = findIndex('Host ID');
      const reportRunIdIndex = findIndex('Report Run ID');
      const reportGeneratedAtIndex = findIndex('Report Generated At (IST)');
      const memberIdIndex = findIndex('Member ID');
      const customerNameIndex = findIndex('Customer Name');
      const customerEmailIndex = findIndex('Customer Email');
      const cancelledEventIndex = findIndex('Cancelled Event');
      const cancelledDateIndex = findIndex('Cancelled Date (IST)');
      const cancelledDayIndex = findIndex('Cancelled Day');
      const cancelledTimeIndex = findIndex('Cancelled Time');
      const sessionDateIndex = findIndex('Session Date (IST)');
      const sessionDayIndex = findIndex('Session Day');
      const sessionTimeIndex = findIndex('Session Time');
      const paidIndex = findIndex('Paid');
      const paymentMethodIndex = findIndex('Payment Method');
      const membershipNameIndex = findIndex('Membership Name');
      const homeLocationIndex = findIndex('Home Location');
      const penaltyIndex = findIndex('Charged Penalty Amount In Currency');

      const processedData: LateCancellationsData[] = lateCancellationRows.slice(1).filter(Boolean).map((row: any[]) => {
        const customerName = customerNameIndex >= 0 ? row[customerNameIndex] : '';
        const { firstName, lastName } = splitCustomerName(customerName);
        const cancelledDateRaw = cancelledDateIndex >= 0 ? row[cancelledDateIndex] : '';
        const sessionDateRaw = sessionDateIndex >= 0 ? row[sessionDateIndex] : '';
        const cancelledAt = parseDateTime(cancelledDateRaw);
        const sessionAt = parseDateTime(sessionDateRaw);
        const timeBeforeClassMinutes = cancelledAt && sessionAt
          ? Math.max(0, Math.round((sessionAt.getTime() - cancelledAt.getTime()) / 60000))
          : undefined;
        const timeBeforeClassHours = typeof timeBeforeClassMinutes === 'number'
          ? Math.round((timeBeforeClassMinutes / 60) * 10) / 10
          : undefined;
        const sessionDateOnly = formatDateOnly(sessionDateRaw);
        const sessionDateObj = parseDateTime(sessionDateRaw);

        return {
          hostId: hostIdIndex >= 0 ? row[hostIdIndex] : '',
          reportRunId: reportRunIdIndex >= 0 ? row[reportRunIdIndex] : '',
          reportGeneratedAtIST: reportGeneratedAtIndex >= 0 ? row[reportGeneratedAtIndex] : '',
          memberId: memberIdIndex >= 0 ? row[memberIdIndex] : '',
          customerName,
          firstName,
          lastName,
          email: customerEmailIndex >= 0 ? row[customerEmailIndex] : '',
          location: homeLocationIndex >= 0 ? row[homeLocationIndex] : '',
          cancelledEvent: cancelledEventIndex >= 0 ? row[cancelledEventIndex] : '',
          cleanedClass: cancelledEventIndex >= 0 ? row[cancelledEventIndex] : '',
          sessionName: cancelledEventIndex >= 0 ? row[cancelledEventIndex] : '',
          cleanedCategory: 'Late Cancellations',
          cleanedProduct: membershipNameIndex >= 0 ? row[membershipNameIndex] : '',
          paymentMethodName: paymentMethodIndex >= 0 ? row[paymentMethodIndex] : '',
          paidAmount: paidIndex >= 0 ? parseNumericValue(row[paidIndex]) : 0,
          chargedPenaltyAmount: penaltyIndex >= 0 ? parseNumericValue(row[penaltyIndex]) : 0,
          cancelledDateIST: cancelledDateRaw,
          cancelledDay: cancelledDayIndex >= 0 ? row[cancelledDayIndex] : '',
          cancelledTime: cancelledTimeIndex >= 0 ? row[cancelledTimeIndex] : '',
          sessionDateIST: sessionDateRaw,
          sessionDay: sessionDayIndex >= 0 ? row[sessionDayIndex] : '',
          sessionTime: sessionTimeIndex >= 0 ? row[sessionTimeIndex] : '',
          cancelledDateTimeISO: cancelledAt?.toISOString(),
          sessionDateTimeISO: sessionAt?.toISOString(),
          dateIST: sessionDateOnly,
          dayOfWeek: sessionDayIndex >= 0 ? row[sessionDayIndex] : '',
          time: sessionTimeIndex >= 0 ? row[sessionTimeIndex] : '',
          month: sessionDateObj ? getMonthName(sessionDateObj) : '',
          year: sessionDateObj ? sessionDateObj.getFullYear() : 0,
          teacherName: '',
          isLateCancelled: true,
          isCancelled: false,
          cancellationType: 'late-cancelled',
          timeBeforeClassMinutes,
          timeBeforeClassHours,
          cancellationWindow: getCancellationWindow(timeBeforeClassMinutes),
          isSameDayCancellation: cancelledAt && sessionAt ? cancelledAt.toDateString() === sessionAt.toDateString() : false,
          hasPenalty: penaltyIndex >= 0 ? parseNumericValue(row[penaltyIndex]) > 0 : false,
          tableType: 'late-cancellations',
        };
      });
      
      logger.info('Processed late cancellations data:', {
        totalRecords: processedData.length,
        totalRawCheckins: legacyCheckins.length,
        spreadsheetId: LATE_CANCELLATIONS_SPREADSHEET_ID,
        sheetName: LATE_CANCELLATIONS_SHEET_NAME,
        sample: processedData.slice(0, 3)
      });
      
      setData(processedData);
      setAllCheckins(legacyCheckins);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error('Error fetching late cancellations data:', {
        error: errorMsg,
        spreadsheetId: LATE_CANCELLATIONS_SPREADSHEET_ID,
        sheetName: LATE_CANCELLATIONS_SHEET_NAME,
        errorType: err instanceof Error ? err.constructor.name : typeof err
      });
      setError(`Failed to load late cancellations data: ${errorMsg}`);
      setData([]);
      setAllCheckins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLateCancellationsData();
  }, [mode]);

  return { data, allCheckins, loading, error, refetch: fetchLateCancellationsData };
};
