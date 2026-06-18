import { ExpirationData, NewClientData, SalesData } from '@/types/dashboard';
import { LeadsData } from '@/types/leads';
import { MemberBehaviorData } from '@/types/memberBehavior';
import { parseDate } from '@/utils/dateUtils';

export type DashboardLocationId = 'all' | 'kwality' | 'supreme' | 'kenkere' | 'popup';

export interface DashboardDateRange {
  start: string;
  end: string;
}

const parseBehaviorMonth = (value: string): Date | null => {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return new Date(direct.getFullYear(), direct.getMonth(), 1);

  const match = value.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i);
  if (!match) return null;

  const monthToken = match[1].slice(0, 3).toLowerCase();
  const year = Number(match[2]);
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthIndex = months.indexOf(monthToken);
  if (monthIndex < 0 || Number.isNaN(year)) return null;
  return new Date(year, monthIndex, 1);
};

const normalizeLocationText = (value?: string | null) => (value || '').toLowerCase().trim();

export const mapLocationIdToTab = (value?: string | null): DashboardLocationId => {
  const normalized = normalizeLocationText(value);
  if (!normalized || normalized === 'all locations' || normalized === 'all') return 'all';
  if (normalized.includes('kwality') || normalized.includes('kemps')) return 'kwality';
  if (normalized.includes('supreme') || normalized.includes('bandra')) return 'supreme';
  if (normalized.includes('kenkere') || normalized.includes('bengaluru') || normalized.includes('bangalore')) return 'kenkere';
  if (normalized.includes('pop')) return 'popup';
  return 'all';
};

export const matchesDashboardLocation = (value: string | undefined | null, locationId: DashboardLocationId) => {
  if (locationId === 'all') return true;
  return mapLocationIdToTab(value) === locationId;
};

export const getTrailingMonthsDateRange = (monthsBack = 6): DashboardDateRange => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const format = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { start: format(start), end: format(end) };
};

export const isDateInRange = (value: string | Date | undefined | null, range: DashboardDateRange) => {
  if (!value) return false;
  const parsed = value instanceof Date ? value : parseDate(String(value));
  if (!parsed) return false;
  const start = parseDate(range.start);
  const end = parseDate(range.end);
  if (!start || !end) return true;
  const normalized = new Date(parsed);
  normalized.setHours(0, 0, 0, 0);
  const normalizedStart = new Date(start);
  normalizedStart.setHours(0, 0, 0, 0);
  const normalizedEnd = new Date(end);
  normalizedEnd.setHours(23, 59, 59, 999);
  return normalized >= normalizedStart && normalized <= normalizedEnd;
};

export const filterMemberDataByMonthRange = (members: MemberBehaviorData[], range: DashboardDateRange) => {
  return members
    .map((member) => {
      const monthlyData = Object.fromEntries(
        Object.entries(member.monthlyData).filter(([month]) => {
          const parsed = parseBehaviorMonth(month);
          return parsed ? isDateInRange(parsed, range) : false;
        }),
      );
      return { ...member, monthlyData };
    })
    .filter((member) => Object.keys(member.monthlyData).length > 0);
};

export const buildMemberLocationIndex = ({
  members,
  newClients,
  expirations,
  sales,
  leads,
}: {
  members: MemberBehaviorData[];
  newClients: NewClientData[];
  expirations: ExpirationData[];
  sales: SalesData[];
  leads: LeadsData[];
}) => {
  const byEmail = new Map<string, string>();
  const byMemberId = new Map<string, string>();

  const remember = (memberId: string | undefined, email: string | undefined, location: string | undefined) => {
    if (!location) return;
    if (memberId) byMemberId.set(String(memberId).trim(), location);
    if (email) byEmail.set(String(email).trim().toLowerCase(), location);
  };

  newClients.forEach((client) => {
    remember(client.memberId, client.email, client.homeLocation || client.firstVisitLocation);
  });
  expirations.forEach((item) => {
    remember(item.memberId, item.email, item.homeLocation);
  });
  sales.forEach((item) => {
    remember(item.memberId, item.customerEmail, item.calculatedLocation);
  });
  leads.forEach((lead) => {
    remember(lead.memberId, lead.email, lead.center);
  });

  const index = new Map<string, string>();
  members.forEach((member) => {
    const memberId = String(member.memberId || '').trim();
    const email = String(member.email || '').trim().toLowerCase();
    const location = byMemberId.get(memberId) || byEmail.get(email) || '';
    if (location) {
      index.set(memberId, location);
      if (email) index.set(email, location);
    }
  });

  return index;
};

export const getMemberLocation = (member: MemberBehaviorData, index: Map<string, string>) => {
  return (
    index.get(String(member.memberId || '').trim()) ||
    index.get(String(member.email || '').trim().toLowerCase()) ||
    'Unknown location'
  );
};
