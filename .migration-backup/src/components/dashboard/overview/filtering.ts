import type { OverviewFiltersShape, OverviewRankingEntry, OverviewValueFormat } from './types';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { parseDate } from '@/utils/dateUtils';

export type OverviewLocationId = 'kwality' | 'supreme' | 'kenkere' | 'popup' | 'all';

const LOCATION_LABELS: Record<Exclude<OverviewLocationId, 'all'>, string> = {
  kwality: 'Kwality House',
  supreme: 'Supreme HQ',
  kenkere: 'Kenkere House',
  popup: 'Pop-up',
};

export const OVERVIEW_LOCATION_OPTIONS = Object.values(LOCATION_LABELS);
export const OVERVIEW_REPORT_LOCATION_IDS: Array<Exclude<OverviewLocationId, 'all' | 'popup'>> = ['kwality', 'supreme', 'kenkere'];
export const OVERVIEW_REPORT_LOCATION_OPTIONS = OVERVIEW_REPORT_LOCATION_IDS.map((locationId) => LOCATION_LABELS[locationId]);

export const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const toText = (value: unknown, fallback = 'Unknown'): string => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

export const average = (total: number, count: number): number => {
  if (!count) return 0;
  return total / count;
};

export const percentage = (numerator: number, denominator: number): number => {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
};

export const countUnique = <T>(items: T[], keyFn: (item: T) => string | undefined | null) => {
  const values = new Set<string>();

  items.forEach((item) => {
    const value = String(keyFn(item) ?? '').trim();
    if (value) {
      values.add(value);
    }
  });

  return values.size;
};

export const normalizeLocationId = (rawLocation: string | undefined | null): OverviewLocationId | null => {
  const location = String(rawLocation ?? '').trim().toLowerCase();
  if (!location) return null;
  if (location === 'all' || location === 'all locations') return 'all';
  if (location === 'kh' || location === 'kwality house') return 'kwality';
  if (location.includes('kwality') || location.includes('kemps')) return 'kwality';
  if (location === 'shq' || location === 'supreme hq') return 'supreme';
  if (location.includes('supreme') || location.includes('bandra')) return 'supreme';
  if (location === 'blr' || location === 'bengaluru') return 'kenkere';
  if (location.includes('kenkere') || location.includes('bengaluru') || location.includes('bangalore')) return 'kenkere';
  if (location.includes('pop-up') || location.includes('popup') || location === 'pop-up' || location === 'popup' || location.startsWith('pop')) {
    return 'popup';
  }

  return null;
};

export const matchesLocationFilter = (rawLocation: string | undefined | null, selectedLocations: string[]) => {
  if (!selectedLocations.length) return true;

  const target = normalizeLocationId(rawLocation);
  if (!target) return false;

  return selectedLocations.some((selected) => normalizeLocationId(selected) === target);
};

export const parseOverviewDate = (rawDate: string | undefined | null): Date | null => {
  const value = String(rawDate ?? '').trim();
  if (!value) return null;

  if (/^\d{4}-\d{2}$/.test(value)) {
    return new Date(`${value}-01T00:00:00`);
  }

  if (/^\d{1,2}\/\d{4}$/.test(value)) {
    const [month, year] = value.split('/').map((part) => Number.parseInt(part, 10));
    if (Number.isFinite(month) && Number.isFinite(year)) {
      const parsedMonth = new Date(year, month - 1, 1);
      return Number.isNaN(parsedMonth.getTime()) ? null : parsedMonth;
    }
  }

  if (/^\d{4}\/\d{1,2}$/.test(value)) {
    const [year, month] = value.split('/').map((part) => Number.parseInt(part, 10));
    if (Number.isFinite(month) && Number.isFinite(year)) {
      const parsedMonth = new Date(year, month - 1, 1);
      return Number.isNaN(parsedMonth.getTime()) ? null : parsedMonth;
    }
  }

  if (/^[A-Za-z]{3,9}[-\s]\d{2}$/.test(value)) {
    const [monthPart, shortYear] = value.split(/[-\s]+/);
    const year = Number.parseInt(shortYear, 10);
    if (monthPart && Number.isFinite(year)) {
      const monthParsed = new Date(`${monthPart} ${2000 + year} 01`);
      return Number.isNaN(monthParsed.getTime()) ? null : monthParsed;
    }
  }

  if (/^[A-Za-z]{3,9}\s+\d{4}$/.test(value)) {
    const monthParsed = new Date(`${value} 01`);
    return Number.isNaN(monthParsed.getTime()) ? null : monthParsed;
  }

  if (/^[A-Za-z]{3,9}-\d{4}$/.test(value)) {
    const monthParsed = new Date(`${value.replace('-', ' ')} 01`);
    return Number.isNaN(monthParsed.getTime()) ? null : monthParsed;
  }

  const parsed = parseDate(value);
  if (parsed) return parsed;

  return null;
};

export const withinDateRange = (dateValue: string | undefined | null, dateRange: OverviewFiltersShape['dateRange']) => {
  if (!dateRange.start && !dateRange.end) {
    return true;
  }

  const parsed = parseOverviewDate(dateValue);
  if (!parsed) return false;

  if (dateRange.start) {
    const start = parseOverviewDate(dateRange.start);
    if (start && parsed < start) {
      return false;
    }
  }

  if (dateRange.end) {
    const end = parseOverviewDate(dateRange.end);
    if (end) {
      end.setHours(23, 59, 59, 999);
      if (parsed > end) {
        return false;
      }
    }
  }

  return true;
};

export const filterByOverviewFilters = <T>(
  items: T[],
  filters: OverviewFiltersShape,
  selectors: {
    getDate: (item: T) => string | undefined | null;
    getLocation: (item: T) => string | undefined | null;
  }
) =>
  items.filter((item) => {
    const locationMatch = matchesLocationFilter(selectors.getLocation(item), filters.location);
    const dateMatch = withinDateRange(selectors.getDate(item), filters.dateRange);
    return locationMatch && dateMatch;
  });

export const monthKeyFromDate = (dateValue: string | undefined | null) => {
  const parsed = parseOverviewDate(dateValue);
  if (!parsed) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

export const monthLabelFromKey = (key: string) => {
  if (!key) return 'Unknown';
  const [year, month] = key.split('-');
  const parsed = new Date(Number(year), Number(month) - 1, 1);
  return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const formatOverviewValue = (value: string | number, format: OverviewValueFormat = 'text') => {
  if (format === 'text') return String(value);

  const numericValue = typeof value === 'number' ? value : toNumber(value);

  switch (format) {
    case 'currency':
      return formatCurrency(numericValue);
    case 'number':
      return formatNumber(numericValue);
    case 'percentage':
      return formatPercentage(numericValue);
    case 'days':
      return `${numericValue.toFixed(1)}d`;
    default:
      return String(value);
  }
};

export const aggregateByLabel = <T, A extends Record<string, number>>(
  items: T[],
  labelFn: (item: T) => string,
  initialValue: () => A,
  apply: (accumulator: A, item: T) => void
) => {
  const groups = new Map<string, A>();

  items.forEach((item) => {
    const label = toText(labelFn(item));
    const accumulator = groups.get(label) ?? initialValue();
    apply(accumulator, item);
    groups.set(label, accumulator);
  });

  return Array.from(groups.entries()).map(([label, accumulator]) => ({ label, ...accumulator }));
};

export const takeTopEntries = (entries: OverviewRankingEntry[], count = 5) =>
  [...entries].sort((left, right) => right.value - left.value).slice(0, count);

export const takeBottomEntries = (entries: OverviewRankingEntry[], count = 5) =>
  [...entries].sort((left, right) => left.value - right.value).slice(0, count);

export const guessFormatFamily = (rawValue: string | undefined | null) => {
  const value = String(rawValue ?? '').toLowerCase();

  if (value.includes('cycle')) return 'PowerCycle';
  if (value.includes('barre')) return 'Barre';
  if (value.includes('strength')) return 'Strength';
  if (value.includes('host')) return 'Hosted';
  return 'Other';
};

export const getOverviewLocationLabel = (selectedLocations: string[]) => {
  if (!selectedLocations.length) return 'All Locations';

  const first = normalizeLocationId(selectedLocations[0]);
  if (!first || first === 'all') return 'All Locations';
  return LOCATION_LABELS[first];
};

export const getOverviewLocationLabelById = (locationId: Exclude<OverviewLocationId, 'all'>) => LOCATION_LABELS[locationId];
