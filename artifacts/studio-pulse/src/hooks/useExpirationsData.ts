import { useState, useEffect } from 'react';
import { ExpirationData } from '@/types/dashboard';
import { fetchGoogleSheet, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useExpirationsData');
const SHEET_NAME = "Lapsed";

const toNum = (v: any): number => {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return isFinite(n) ? n : 0;
};

const str = (v: any): string => (v != null ? String(v).trim() : '');

export const useExpirationsData = () => {
  const [data, setData] = useState<ExpirationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchExpirationsData = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Fetching expirations data...');

      const rows = await fetchGoogleSheet(SPREADSHEET_IDS.EXPIRATIONS, SHEET_NAME, {
        valueRenderOption: 'FORMATTED_VALUE'
      });

      logger.info(`Total rows received: ${rows.length}`);

      if (rows.length < 2) {
        logger.warn('No data found in the sheet');
        setData([]);
        return;
      }

      // Build header→index map (case+whitespace insensitive)
      const headers: string[] = (rows[0] as any[]).map(h => str(h));
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normHeaders = headers.map(norm);

      // Single-name lookup
      const idx = (name: string): number => {
        const target = norm(name);
        return normHeaders.findIndex(h => h === target);
      };

      // Multi-name lookup — tries each alias in order, returns first match.
      // Primary names match the live Google Sheet columns; aliases handle the
      // simplified offline CSV column names.
      const idxAny = (...names: string[]): number => {
        for (const n of names) {
          const f = idx(n);
          if (f >= 0) return f;
        }
        return -1;
      };

      // Separate indices for the two offline-CSV-only name columns
      const firstNameCol = idx('First Name');
      const lastNameCol  = idx('Last Name');

      // Pre-resolve all column indices once
      const COL = {
        memberName:           idxAny('Member Name'),
        memberId:             idxAny('Member ID'),
        email:                idxAny('Member Email',  'Email'),
        phone:                idxAny('Member Phone',  'Phone'),
        hostId:               idxAny('Host ID',       'Id'),
        status:               idxAny('Status'),
        membershipName:       idxAny('Membership Name'),
        sessionsLimit:        idxAny('Sessions Limit'),
        purchaseDate:         idxAny('Purchase Date', 'Order At'),
        startDate:            idxAny('Start Date'),
        endDate:              idxAny('End Date'),
        churnedDate:          idxAny('Churned Date'),
        amountPaid:           idxAny('Amount Paid',   'Paid'),
        discountCode:         idxAny('Discount Code'),
        discountValue:        idxAny('Discount Value'),
        originalAmount:       idxAny('Original Amount (Before Discount)'),
        soldBy:               idxAny('Sold By'),
        createdBy:            idxAny('Created By'),
        mostRecentVisitDate:  idxAny('Most Recent Visit Date'),
        firstVisitDate:       idxAny('First Visit Date'),
        totalSessions:        idxAny('Total Sessions Completed', 'Current Usage'),
        sessionsUsedPct:      idxAny('Sessions Used %'),
        remainingSessions:    idxAny('Remaining Sessions'),
        totalCancellations:   idxAny('Total Cancellations'),
        lateCancellations:    idxAny('Late Cancellations'),
        noShows:              idxAny('No Shows'),
        cancellationRate:     idxAny('Cancellation Rate %'),
        bookingMethod:        idxAny('Preferred Booking Method'),
        primaryLocation:      idxAny('Primary Location', 'Home Location'),
        locationsAttended:    idxAny('Locations Attended'),
        freezeCount:          idxAny('Membership Freeze Count'),
        daysFrozen:           idxAny('Days Frozen'),
        durationDays:         idxAny('Membership Duration (Days)'),
        daysActive:           idxAny('Days Active'),
        daysSinceLastVisit:   idxAny('Days Since Last Visit'),
        avgSessionsPerMonth:  idxAny('Average Sessions Per Month'),
        revenuePerSession:    idxAny('Revenue Per Session'),
        attendanceRate:       idxAny('Attendance Rate %'),
      };

      logger.info('Column mapping resolved', COL);

      const g = (row: any[], col: number): string =>
        col >= 0 && row[col] != null ? str(row[col]) : '';

      const dataRows = rows.slice(1);
      const processedData: ExpirationData[] = dataRows
        .filter((row: any[]) => row.some(cell => str(cell) !== ''))
        .map((row: any[]) => {
          // Member Name may be a combined "First Last" column (live sheet) OR two
          // separate First Name / Last Name columns (offline CSV).
          const fullName = g(row, COL.memberName);
          let firstName: string;
          let lastName: string;
          if (fullName) {
            const nameParts = fullName.trim().split(/\s+/);
            firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : fullName;
            lastName  = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
          } else {
            firstName = firstNameCol >= 0 ? str(row[firstNameCol]) : '';
            lastName  = lastNameCol  >= 0 ? str(row[lastNameCol])  : '';
          }

          const memberId      = g(row, COL.memberId);
          const endDate       = g(row, COL.endDate);
          const primaryLoc    = g(row, COL.primaryLocation);

          return {
            uniqueId:                `${memberId}_${endDate}` || fullName,
            memberId,
            firstName,
            lastName,
            email:                   g(row, COL.email),
            memberPhone:             g(row, COL.phone) || undefined,
            hostId:                  g(row, COL.hostId) || undefined,
            status:                  g(row, COL.status) || 'Lapsed',
            membershipName:          g(row, COL.membershipName),
            sessionsLimit:           g(row, COL.sessionsLimit) || undefined,
            purchaseDate:            g(row, COL.purchaseDate) || undefined,
            startDate:               g(row, COL.startDate) || undefined,
            endDate,
            churnedDate:             g(row, COL.churnedDate) || undefined,
            amountPaid:              toNum(g(row, COL.amountPaid)),
            paid:                    g(row, COL.amountPaid) || '-',
            discountCode:            g(row, COL.discountCode) || undefined,
            discountValue:           toNum(g(row, COL.discountValue)) || undefined,
            originalAmount:          toNum(g(row, COL.originalAmount)) || undefined,
            soldBy:                  g(row, COL.soldBy) || '-',
            createdBy:               g(row, COL.createdBy) || undefined,
            mostRecentVisitDate:     g(row, COL.mostRecentVisitDate) || undefined,
            firstVisitDate:          g(row, COL.firstVisitDate) || undefined,
            totalSessionsCompleted:  toNum(g(row, COL.totalSessions)) || undefined,
            currentUsage:            g(row, COL.totalSessions) || '-',
            sessionsUsedPct:         toNum(g(row, COL.sessionsUsedPct)) || undefined,
            remainingSessions:       toNum(g(row, COL.remainingSessions)) || undefined,
            totalCancellations:      toNum(g(row, COL.totalCancellations)) || undefined,
            lateCancellations:       toNum(g(row, COL.lateCancellations)) || undefined,
            noShows:                 toNum(g(row, COL.noShows)) || undefined,
            cancellationRate:        toNum(g(row, COL.cancellationRate)) || undefined,
            preferredBookingMethod:  g(row, COL.bookingMethod) || undefined,
            primaryLocation:         primaryLoc,
            homeLocation:            primaryLoc,
            locationsAttended:       g(row, COL.locationsAttended) || undefined,
            membershipFreezeCount:   toNum(g(row, COL.freezeCount)) || undefined,
            daysFrozen:              toNum(g(row, COL.daysFrozen)) || undefined,
            frozen:                  toNum(g(row, COL.daysFrozen)) > 0,
            membershipDurationDays:  toNum(g(row, COL.durationDays)) || undefined,
            daysActive:              toNum(g(row, COL.daysActive)) || undefined,
            daysSinceLastVisit:      toNum(g(row, COL.daysSinceLastVisit)) || undefined,
            avgSessionsPerMonth:     toNum(g(row, COL.avgSessionsPerMonth)) || undefined,
            revenuePerSession:       toNum(g(row, COL.revenuePerSession)) || undefined,
            attendanceRate:          toNum(g(row, COL.attendanceRate)) || undefined,
            id:                      g(row, COL.hostId),
            orderAt:                 g(row, COL.purchaseDate),
            membershipId:            '-',
          };
        });

      logger.info(`Processed ${processedData.length} expirations`);
      setData(processedData);
    } catch (err) {
      logger.error('Error fetching expirations data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setTimeout(() => fetchExpirationsData(), 30_000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpirationsData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchExpirationsData,
  };
};
