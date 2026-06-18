export type ConsolidatedStudioId = 'all' | 'kwality' | 'supreme' | 'kenkere' | 'popup';

export interface ConsolidatedExportPreset {
  studioId: ConsolidatedStudioId;
  startDate: string;
  endDate: string;
}

export const CONSOLIDATED_EXPORT_STORAGE_KEY = 'p57-consolidated-export-preset-v1';
export const CONSOLIDATED_EXPORT_QUERY_KEY = 'consolidatedExport';

export const CONSOLIDATED_STUDIO_OPTIONS: Array<{
  id: ConsolidatedStudioId;
  label: string;
  locationLabel: string;
  trainerLocationLabel?: string;
  patternsLocationLabel?: string;
}> = [
  { id: 'all', label: 'All Locations', locationLabel: 'All Locations', trainerLocationLabel: 'All Locations', patternsLocationLabel: 'All Locations' },
  { id: 'kwality', label: 'Kwality House', locationLabel: 'Kwality House, Kemps Corner', trainerLocationLabel: 'Kwality House, Kemps Corner', patternsLocationLabel: 'Kwality House, Kemps Corner' },
  { id: 'supreme', label: 'Supreme HQ', locationLabel: 'Supreme HQ, Bandra', trainerLocationLabel: 'Supreme HQ, Bandra', patternsLocationLabel: 'Supreme HQ, Bandra' },
  { id: 'kenkere', label: 'Kenkere House', locationLabel: 'Kenkere House, Bengaluru', trainerLocationLabel: 'Kenkere House', patternsLocationLabel: 'Kenkere House' },
  { id: 'popup', label: 'Pop-up', locationLabel: 'Pop-up', trainerLocationLabel: 'Pop-up', patternsLocationLabel: 'Pop-up' },
];

export const getConsolidatedStudioOption = (studioId: ConsolidatedStudioId) =>
  CONSOLIDATED_STUDIO_OPTIONS.find((option) => option.id === studioId) || CONSOLIDATED_STUDIO_OPTIONS[0];

const isIsoDate = (value?: string | null) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

export const isConsolidatedExportSearchActive = (search: string) => {
  const params = new URLSearchParams(search);
  return params.get(CONSOLIDATED_EXPORT_QUERY_KEY) === '1';
};

export const getConsolidatedExportPresetFromSearch = (search: string): ConsolidatedExportPreset | null => {
  const params = new URLSearchParams(search);
  if (params.get(CONSOLIDATED_EXPORT_QUERY_KEY) !== '1') {
    return null;
  }

  const studioId = (params.get('studio') || 'all') as ConsolidatedStudioId;
  const startDate = params.get('startDate');
  const endDate = params.get('endDate');

  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    return null;
  }

  return {
    studioId,
    startDate,
    endDate,
  };
};

export const saveConsolidatedExportPreset = (preset: ConsolidatedExportPreset) => {
  localStorage.setItem(CONSOLIDATED_EXPORT_STORAGE_KEY, JSON.stringify(preset));
};

export const clearConsolidatedExportPreset = () => {
  localStorage.removeItem(CONSOLIDATED_EXPORT_STORAGE_KEY);
};

export const getStoredConsolidatedExportPreset = (): ConsolidatedExportPreset | null => {
  try {
    const raw = localStorage.getItem(CONSOLIDATED_EXPORT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsolidatedExportPreset;
    if (!isIsoDate(parsed.startDate) || !isIsoDate(parsed.endDate)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const getActiveConsolidatedExportPreset = (search: string): ConsolidatedExportPreset | null => {
  return getConsolidatedExportPresetFromSearch(search) || getStoredConsolidatedExportPreset();
};

export const getPresetMonthLabels = (preset: ConsolidatedExportPreset, separator: 'space' | 'dash' = 'space') => {
  const labels: string[] = [];
  const start = new Date(`${preset.startDate}T00:00:00`);
  const end = new Date(`${preset.endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return labels;
  }

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const finalMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= finalMonth) {
    const monthLabel = cursor.toLocaleDateString('en-US', { month: 'short' });
    labels.push(separator === 'dash' ? `${monthLabel}-${cursor.getFullYear()}` : `${monthLabel} ${cursor.getFullYear()}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return labels;
};

export const getPresetDateRangeFallback = (search: string, fallback: { start: string; end: string }) => {
  const preset = getActiveConsolidatedExportPreset(search);
  if (!preset) return fallback;
  return { start: preset.startDate, end: preset.endDate };
};

export const buildConsolidatedExportRoute = (path: string, preset: ConsolidatedExportPreset, runId: string) => {
  const query = new URLSearchParams({
    [CONSOLIDATED_EXPORT_QUERY_KEY]: '1',
    studio: preset.studioId,
    startDate: preset.startDate,
    endDate: preset.endDate,
    exportRunId: runId,
  });

  return `${path}?${query.toString()}`;
};