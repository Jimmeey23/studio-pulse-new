import { getOfflineDatasetRows, saveOfflineDatasetRows } from '@/lib/offlineDataStore';
import type { DataSourceMode, OfflineDatasetKey } from '@/types/offlineData';

interface DatasetRowsResult {
  rows: any[][];
  source: 'remote' | 'offline-cache';
}

export const loadDatasetRowsForMode = async (
  key: OfflineDatasetKey,
  mode: DataSourceMode,
  remoteLoader: () => Promise<any[][]>,
): Promise<DatasetRowsResult> => {
  const cachedRows = await getOfflineDatasetRows(key);

  if (mode === 'offline') {
    if (cachedRows && cachedRows.length > 0) {
      return { rows: cachedRows, source: 'offline-cache' };
    }
    throw new Error(`Offline dataset not available for ${key}. Upload a CSV/XLSX file or open the app online first.`);
  }

  try {
    const remoteRows = await remoteLoader();
    if (remoteRows && remoteRows.length > 0) {
      await saveOfflineDatasetRows(key, remoteRows, 'remote');
    }
    return { rows: remoteRows, source: 'remote' };
  } catch (error) {
    if (cachedRows && cachedRows.length > 0) {
      return { rows: cachedRows, source: 'offline-cache' };
    }
    throw error;
  }
};
