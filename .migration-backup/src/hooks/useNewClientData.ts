
import { useState, useEffect, useCallback } from 'react';
import { NewClientData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';
import { fetchGoogleSheet, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';

const logger = createLogger('useNewClientData');

// Helper to calculate conversion span in days
const calculateConversionSpan = (firstVisitDate: string, firstPurchaseDate: string): number => {
  if (!firstVisitDate || !firstPurchaseDate) {
    return 0;
  }

  const firstVisit = parseDate(firstVisitDate);
  const firstPurchase = parseDate(firstPurchaseDate);
  if (!firstVisit || !firstPurchase) return 0;

  const diffTime = firstPurchase.getTime() - firstVisit.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Helper to format to canonical month key YYYY-MM
const getMonthYear = (dateStr: string = ''): string => {
  const d = parseDate(dateStr);
  if (!d) return '';
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const getMonthYearHint = (monthYear: string): { year: number; month: number } | null => {
  const value = String(monthYear || '').trim();
  if (!value) return null;

  const isoMatch = value.match(/^(\d{4})[-/](\d{1,2})$/);
  if (isoMatch) {
    return { year: Number(isoMatch[1]), month: Number(isoMatch[2]) };
  }

  const nameMatch = value.match(/^([A-Za-z]+)[\s-]+(\d{4})$/);
  if (nameMatch) {
    const month = MONTH_NAME_TO_NUMBER[nameMatch[1].toLowerCase()];
    if (month) return { year: Number(nameMatch[2]), month };
  }

  return null;
};

const formatCanonicalDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const normalizeSheetDate = (dateValue: string, monthYear: string): string => {
  const value = String(dateValue || '').trim();
  if (!value) return '';

  const datePart = value.split(',')[0].split(' ')[0].trim();
  const hint = getMonthYearHint(monthYear);

  const slashMatch = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    let day = first;
    let month = second;

    if (hint?.year === year) {
      if (second === hint.month) {
        day = first;
        month = second;
      } else if (first === hint.month) {
        day = second;
        month = first;
      }
    } else if (first > 12) {
      day = first;
      month = second;
    } else if (second > 12) {
      day = second;
      month = first;
    }

    return formatCanonicalDate(year, month, day);
  }

  const parsed = parseDate(value);
  return parsed ? formatCanonicalDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()) : value;
};

export const useNewClientData = () => {
  const [data, setData] = useState<NewClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useDataSource();

  const fetchNewClientData = useCallback(async () => {
    try {
      setLoading(true);
      logger.info('Fetching new client data...');

      const { rows } = await loadDatasetRowsForMode('new-clients', mode, async () => {
        return fetchGoogleSheet(SPREADSHEET_IDS.NEW_CLIENTS, 'New', {
          valueRenderOption: 'FORMATTED_VALUE'
        });
      });

      if (rows.length < 2) {
        setData([]);
        return;
      }

      const headers = (rows[0] || []).map((header: unknown) => String(header || '').trim());
      const headerIndexMap = new Map<string, number>();
      const normalizedHeaderIndexMap = new Map<string, number>();
      const normalizeHeader = (header: string) =>
        header
          .toLowerCase()
          .replace(/&/g, 'and')
          .replace(/[^a-z0-9]/g, '');

      headers.forEach((header, index) => {
        if (header) {
          headerIndexMap.set(header, index);
          normalizedHeaderIndexMap.set(normalizeHeader(header), index);
        }
      });

      const getCellValue = (row: unknown[], ...headerNames: string[]) => {
        for (const headerName of headerNames) {
          const index = headerIndexMap.get(headerName) ?? normalizedHeaderIndexMap.get(normalizeHeader(headerName));
          if (typeof index === 'number') {
            return row[index] ?? '';
          }
        }
        return '';
      };

      const toNumber = (value: unknown): number => {
        if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
        const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      const newClientData: NewClientData[] = rows.slice(1).filter((row: unknown[]) =>
        row.some((cell) => String(cell ?? '').trim() !== '')
      ).map((row: unknown[]) => {
        const firstPurchasePostTrial = String(getCellValue(row, 'First Purchase Post Trial', 'First Purchase Made', 'First Purchase'));
        const firstPurchaseDate = String(getCellValue(row, 'First Purchase Date', 'Purchase Date'));
        const parsedFirstPurchasePostTrial = parseDate(firstPurchasePostTrial);
        const canonicalFirstPurchaseDate = firstPurchaseDate || (parsedFirstPurchasePostTrial ? firstPurchasePostTrial : '');
        const firstPurchaseItem = parsedFirstPurchasePostTrial ? '' : firstPurchasePostTrial;
        const firstVisitLocation = String(getCellValue(row, 'First Visit Location', 'Location', 'Studio', 'First Studio'));
        const homeLocation = String(getCellValue(row, 'Home Location', 'Home Studio', 'Member Home Location'));
        const sheetConversionSpanValue = getCellValue(row, 'Conversion Span (Days)', 'Conversion Span', 'Days to Convert');
        const sheetConversionSpan = sheetConversionSpanValue !== '' ? toNumber(sheetConversionSpanValue) : undefined;
        const monthYearSheet = String(getCellValue(row, 'Month Year', 'Month', 'Month-Year'));
        const firstVisitDate = normalizeSheetDate(
          String(getCellValue(row, 'First Visit Date', 'First Visit', 'Trial Date', 'Visit Date')),
          monthYearSheet
        );
        const noOfVisitsValue = getCellValue(row, 'No of Visits', 'Number of Visits', 'Visits');
        const noOfVisits = noOfVisitsValue !== '' ? toNumber(noOfVisitsValue) : undefined;

        const conversionSpan = (sheetConversionSpan && !isNaN(sheetConversionSpan))
          ? sheetConversionSpan
          : calculateConversionSpan(firstVisitDate, canonicalFirstPurchaseDate);

        return {
          memberId: String(getCellValue(row, 'Member Id', 'Member ID', 'Client ID', 'Customer ID')),
          firstName: String(getCellValue(row, 'First Name', 'Client First Name')),
          lastName: String(getCellValue(row, 'Last Name', 'Client Last Name')),
          email: String(getCellValue(row, 'Email', 'Email Address')),
          phoneNumber: String(getCellValue(row, 'Phone Number', 'Phone', 'Mobile', 'Mobile Number')),
          firstVisitDate,
          firstVisitEntityName: String(getCellValue(row, 'First Visit Entity Name', 'First Visit Class', 'Class Name')),
          firstVisitType: String(getCellValue(row, 'First Visit Type', 'Visit Type', 'Class Type')),
          firstVisitLocation: firstVisitLocation || homeLocation,
          paymentMethod: String(getCellValue(row, 'Payment Method', 'Payment Type')),
          membershipUsed: String(getCellValue(row, 'Membership Used', 'Membership', 'Package Used', 'Package')),
          homeLocation,
          classNo: toNumber(getCellValue(row, 'Class No', 'Class Number')),
          trainerName: String(getCellValue(row, 'Trainer Name', 'Instructor', 'Instructor Name', 'Teacher Name')),
          isNew: String(getCellValue(row, 'Is New', 'Client Type', 'Member Type', 'New/Repeat')),
          visitsPostTrial: toNumber(getCellValue(row, 'Visits Post Trial', 'Post Trial Visits')),
          membershipsBoughtPostTrial: String(getCellValue(row, 'Memberships Bought Post Trial', 'Membership Bought Post Trial', 'Packages Bought Post Trial')),
          purchaseCountPostTrial: toNumber(getCellValue(row, 'Purchase Count Post Trial', 'Post Trial Purchase Count', 'Purchase Count')),
          ltv: toNumber(getCellValue(row, 'Ltv', 'LTV', 'Lifetime Value')),
          retentionStatus: String(getCellValue(row, 'Retention Status', 'Retention')),
          conversionStatus: String(getCellValue(row, 'Conversion Status', 'Conversion')),
          firstPurchase: canonicalFirstPurchaseDate,
          firstPurchaseItem,
          // Canonical month key from sheet if provided else derived
          monthYear: monthYearSheet || getMonthYear(firstVisitDate),
          conversionSpan,
          // Optional: bring in noOfVisits for downstream use
          noOfVisits,
        } as NewClientData & { noOfVisits?: number };
      });

      logger.info(`New client data loaded: ${newClientData.length} records`);
      
      setData(newClientData);
      setError(null);
    } catch (err) {
      logger.error('Error fetching new client data:', err);
      setError('Failed to load new client data');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchNewClientData();
  }, [fetchNewClientData]);

  return { data, loading, error, refetch: fetchNewClientData };
};
