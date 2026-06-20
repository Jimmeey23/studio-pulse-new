import { useState, useEffect } from 'react';
import { LeadsData } from '@/types/leads';
import { getGoogleAccessToken } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useLeadsData');
const SPREADSHEET_ID = "1dQMNF69WnXVQdhlLvUZTig3kL97NA21k6eZ9HRu6xiQ";

export const parseDate = (dateString: string | undefined | null) => {
  if (!dateString || dateString.trim() === '' || dateString === '-') return '';
  
  try {
    let parsedDate;
    const now = new Date();
    
    // Handle various date formats
    if (dateString.includes('/')) {
      // Handle DD/MM/YYYY or MM/DD/YYYY format
      const datePart = dateString.split(' ')[0].trim();
      const parts = datePart.split('/');
      if (parts.length === 3) {
        let day = parseInt(parts[0]);
        let month = parseInt(parts[1]);
        const rawYear = parseInt(parts[2]);
        const year = rawYear < 100 ? 2000 + rawYear : rawYear;
        // Auto-detect MM/DD/YYYY: if parts[1] > 12 it must be the day — swap
        if (month > 12 && day <= 12) {
          const tmp = day; day = month; month = tmp;
        }
        if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12) {
          parsedDate = new Date(year, month - 1, day);
        }
      }
    } else if (dateString.includes('-')) {
      // YYYY-MM-DD format — parse as local midnight to avoid UTC-offset date-shifting
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          parsedDate = new Date(year, month - 1, day);
        }
      }
      if (!parsedDate) parsedDate = new Date(dateString);
    } else {
      // Try direct parsing
      parsedDate = new Date(dateString);
    }
    
    // Validate the date and ensure it's not in the future or too far in the past
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return '';
    }
    
    // Exclude dates that are in the future or before 2020
    if (parsedDate > now || parsedDate.getFullYear() < 2020) {
      return '';
    }
    
    // Return ISO string format for consistency
    return parsedDate.toISOString();
  } catch (error) {
    return '';
  }
};

const safeGet = (row: any[], index: number): string => {
  return row && row[index] !== undefined && row[index] !== null ? String(row[index]).trim() : '';
};

const safeGetNumber = (row: any[], index: number): number => {
  let value = safeGet(row, index);
  if (!value) return 0;
  // Guard against date-like and non-numeric strings in numeric fields
  if (value.includes('/') || value.includes('-')) return 0;
  // Strip currency symbols/commas
  value = value.replace(/[₹$,]/g, '');
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

const safeGetInt = (row: any[], index: number): number => {
  const value = safeGet(row, index);
  if (!value) return 0;
  // Date-like string should not be parsed as int
  if (value.includes('/') || value.includes('-')) return 0;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
};

export const useLeadsData = () => {
  const [data, setData] = useState<LeadsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchLeadsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = await getGoogleAccessToken();
      const sheetName = encodeURIComponent('◉ Leads');
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?alt=json`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        const err: any = new Error(`Failed to fetch leads data: ${response.status} ${response.statusText}`);
        err.status = response.status;
        throw err;
      }
      const result = await response.json();
      const rows = result.values || [];
      
      logger.info(`Fetched ${rows.length} rows from leads sheet`);
      
      if (rows.length < 2) {
        setData([]);
        return;
      }

      // Process each row with defensive programming
      const leadsData: LeadsData[] = rows.slice(1)
        .map((row: any[], index: number) => {
          try {
            if (!row || row.length === 0) {
              return null;
            }

            const leadData: LeadsData = {
              id: safeGet(row, 0),
              fullName: safeGet(row, 1),
              phone: safeGet(row, 2),
              email: safeGet(row, 3),
              createdAt: parseDate(safeGet(row, 4)),
              sourceId: safeGet(row, 5),
              source: safeGet(row, 6),
              memberId: safeGet(row, 7),
              convertedToCustomerAt: parseDate(safeGet(row, 8)),
              stage: safeGet(row, 9),
              associate: safeGet(row, 10),
              remarks: safeGet(row, 11),
              followUp1Date: parseDate(safeGet(row, 12)),
              followUpComments1: safeGet(row, 13),
              followUp2Date: parseDate(safeGet(row, 14)),
              followUpComments2: safeGet(row, 15),
              followUp3Date: parseDate(safeGet(row, 16)),
              followUpComments3: safeGet(row, 17),
              followUp4Date: parseDate(safeGet(row, 18)),
              followUpComments4: safeGet(row, 19),
              center: safeGet(row, 20),
              classType: safeGet(row, 21),
              hostId: safeGet(row, 22),
              status: safeGet(row, 23),
              channel: safeGet(row, 24),
              period: safeGet(row, 25),
              purchasesMade: safeGetInt(row, 26),
              ltv: safeGetNumber(row, 27),
              visits: safeGetInt(row, 28),
              trialStatus: safeGet(row, 29),
              conversionStatus: safeGet(row, 30),
              retentionStatus: safeGet(row, 31),
            };

            return leadData;
          } catch (rowError) {
            logger.error(`Error processing row ${index + 1}:`, rowError);
            return null;
          }
        })
        .filter((item): item is LeadsData => item !== null);

      logger.info(`Processed ${leadsData.length} leads`);
      
      setData(leadsData);
      setError(null);
    } catch (err) {
      logger.error('Error fetching leads data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leads data');
      if (!((err as any)?.status >= 400)) setTimeout(() => fetchLeadsData(), 300_000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsData();
  }, []);

  return { data, loading, error, refetch: fetchLeadsData };
};
