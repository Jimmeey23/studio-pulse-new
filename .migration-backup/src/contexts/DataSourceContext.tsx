import * as React from 'react';
import {
  deleteOfflineDataset,
  listOfflineDatasets,
  parseSpreadsheetFileToRows,
  saveOfflineDatasetRows,
  seedBundledOfflineDatasets,
} from '@/lib/offlineDataStore';
import type { DataSourceMode, OfflineDatasetKey, OfflineDatasetSummary } from '@/types/offlineData';

interface DataSourceContextValue {
  mode: DataSourceMode;
  setMode: (mode: DataSourceMode) => void;
  offlineAccessEnabled: boolean;
  enableOfflineAccess: () => void;
  isOnline: boolean;
  datasets: OfflineDatasetSummary[];
  refreshDatasets: () => Promise<void>;
  uploadDatasetFile: (key: OfflineDatasetKey, file: File) => Promise<void>;
  clearDataset: (key: OfflineDatasetKey) => Promise<void>;
}

const STORAGE_KEY = 'p57-data-source-mode';
const OFFLINE_ACCESS_KEY = 'p57-offline-access-enabled';

const shouldEnableOfflineAccess = () => {
  if (typeof window === 'undefined') return false;

  const stored = window.localStorage.getItem(OFFLINE_ACCESS_KEY);
  if (stored === 'true') {
    return true;
  }

  const params = new URLSearchParams(window.location.search);
  return ['1', 'true', 'yes'].includes((params.get('offline') || '').toLowerCase());
};

const DataSourceContext = React.createContext<DataSourceContextValue | undefined>(undefined);

export const DataSourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = React.useState<DataSourceMode>(() => {
    if (typeof window === 'undefined') return 'online';

    const offlineAccessEnabled = shouldEnableOfflineAccess();
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (offlineAccessEnabled && (stored === 'online' || stored === 'offline')) {
      return stored;
    }

    return 'online';
  });
  const [offlineAccessEnabled, setOfflineAccessEnabled] = React.useState<boolean>(() => shouldEnableOfflineAccess());
  const [isOnline, setIsOnline] = React.useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [datasets, setDatasets] = React.useState<OfflineDatasetSummary[]>([]);
  const [bundleSeeded, setBundleSeeded] = React.useState(false);

  const refreshDatasets = React.useCallback(async () => {
    const next = await listOfflineDatasets();
    setDatasets(next);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const bootstrapBundledDatasets = async () => {
      try {
        await seedBundledOfflineDatasets();
      } catch (error) {
        console.error('Failed to seed bundled offline datasets:', error);
      } finally {
        if (!cancelled) {
          setBundleSeeded(true);
          await refreshDatasets();
        }
      }
    };

    void bootstrapBundledDatasets();

    return () => {
      cancelled = true;
    };
  }, [refreshDatasets]);

  React.useEffect(() => {
    if (!offlineAccessEnabled && shouldEnableOfflineAccess()) {
      setOfflineAccessEnabled(true);
    }
  }, [offlineAccessEnabled]);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const enableOfflineAccess = React.useCallback(() => {
    setOfflineAccessEnabled(true);
    window.localStorage.setItem(OFFLINE_ACCESS_KEY, 'true');
  }, []);

  const setMode = React.useCallback((nextMode: DataSourceMode) => {
    if (nextMode === 'offline') {
      window.localStorage.setItem(OFFLINE_ACCESS_KEY, 'true');
      setOfflineAccessEnabled(true);
    }
    setModeState(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  }, []);

  const uploadDatasetFile = React.useCallback(async (key: OfflineDatasetKey, file: File) => {
    const rows = await parseSpreadsheetFileToRows(file);
    await saveOfflineDatasetRows(key, rows, 'upload', file.name);
    await refreshDatasets();
  }, [refreshDatasets]);

  const clearDataset = React.useCallback(async (key: OfflineDatasetKey) => {
    await deleteOfflineDataset(key);
    await refreshDatasets();
  }, [refreshDatasets]);

  const value = React.useMemo(() => ({
    mode,
    setMode,
    offlineAccessEnabled,
    enableOfflineAccess,
    isOnline,
    datasets,
    refreshDatasets,
    uploadDatasetFile,
    clearDataset,
  }), [mode, setMode, offlineAccessEnabled, enableOfflineAccess, isOnline, datasets, refreshDatasets, uploadDatasetFile, clearDataset]);

  return <DataSourceContext.Provider value={value}>{children}</DataSourceContext.Provider>;
};

export const useDataSource = () => {
  const context = React.useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  return context;
};
