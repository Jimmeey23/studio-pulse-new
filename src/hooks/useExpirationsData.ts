import { useState, useEffect } from 'react';
import { ExpirationData } from '@/types/dashboard';
import { fetchGoogleSheet, SPREADSHEET_IDS } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';
import { useDataSource } from '@/contexts/DataSourceContext';
import { loadDatasetRowsForMode } from '@/lib/offlineDatasetLoader';

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

      // Build header→index map (case+whitespace insensitive)
      const headers: string[] = (rows[0] as any[]).map(h => str(h));
      const idx = (name: string): number => {
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const target = norm(name);
        const found = headers.findIndex(h => norm(h) === target);
        return found;
      };

      // Pre-resolve all column indices once
      const COL = {
        memberName:           idx('Member Name'),
        memberId:             idx('Member ID'),
        email:                idx('Member Email'),
        phone:                idx('Member Phone'),
        hostId:               idx('Host ID'),
        status:               idx('Status'),
        membershipName:       idx('Membership Name'),
        sessionsLimit:        idx('Sessions Limit'),
        purchaseDate:         idx('Purchase Date'),
        startDate:            idx('Start Date'),
        endDate:              idx('End Date'),
        churnedDate:          idx('Churned Date'),
        amountPaid:           idx('Amount Paid'),
        discountCode:         idx('Discount Code'),
        discountValue:        idx('Discount Value'),
        originalAmount:       idx('Original Amount (Before Discount)'),
        soldBy:               idx('Sold By'),
        createdBy:            idx('Created By'),
        mostRecentVisitDate:  idx('Most Recent Visit Date'),
        firstVisitDate:       idx('First Visit Date'),
        totalSessions:        idx('Total Sessions Completed'),
        sessionsUsedPct:      idx('Sessions Used %'),
        remainingSessions:    idx('Remaining Sessions'),
        totalCancellations:   idx('Total Cancellations'),
        lateCancellations:    idx('Late Cancellations'),
        noShows:              idx('No Shows'),
        cancellationRate:     idx('Cancellation Rate %'),
        bookingMethod:        idx('Preferred Booking Method'),
        primaryLocation:      idx('Primary Location'),
        locationsAttended:    idx('Locations Attended'),
        freezeCount:          idx('Membership Freeze Count'),
        daysFrozen:           idx('Days Frozen'),
        durationDays:         idx('Membership Duration (Days)'),
        daysActive:           idx('Days Active'),
        daysSinceLastVisit:   idx('Days Since Last Visit'),
        avgSessionsPerMonth:  idx('Average Sessions Per Month'),
        revenuePerSession:    idx('Revenue Per Session'),
        attendanceRate:       idx('Attendance Rate %'),
      };

      logger.info('Column mapping resolved', COL);

      const g = (row: any[], col: number): string =>
        col >= 0 && row[col] != null ? str(row[col]) : '';

      const dataRows = rows.slice(1);
      const processedData: ExpirationData[] = dataRows
        .filter((row: any[]) => row.some(cell => str(cell) !== ''))
        .map((row: any[]) => {
          // Member Name may be "First Last" — split for firstName/lastName
          const fullName = g(row, COL.memberName);
          const nameParts = fullName.trim().split(/\s+/);
          const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : fullName;
          const lastName  = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

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
