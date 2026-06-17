import * as XLSX from 'xlsx';
import {
  BUNDLED_OFFLINE_DATASET_FILES,
  OFFLINE_DATASET_KEYS,
  OFFLINE_DATASET_LABELS,
  type OfflineDatasetKey,
  type OfflineDatasetRecord,
  type OfflineDatasetSummary,
} from '@/types/offlineData';

const DB_NAME = 'p57-offline-data';
const STORE_NAME = 'datasets';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const openDatabase = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open offline database'));
  });

  return dbPromise;
};

const withStore = async <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => Promise<T> | T): Promise<T> => {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    Promise.resolve(fn(store))
      .then((result) => {
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error ?? new Error('Offline storage transaction failed'));
        transaction.onabort = () => reject(transaction.error ?? new Error('Offline storage transaction aborted'));
      })
      .catch(reject);
  });
};

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });

export const getOfflineDataset = async (key: OfflineDatasetKey): Promise<OfflineDatasetRecord | null> => {
  return withStore('readonly', async (store) => {
    const result = await requestToPromise(store.get(key));
    return (result as OfflineDatasetRecord | undefined) ?? null;
  });
};

export const getOfflineDatasetRows = async (key: OfflineDatasetKey): Promise<any[][] | null> => {
  const record = await getOfflineDataset(key);
  return record?.rows ?? null;
};

export const saveOfflineDatasetRows = async (
  key: OfflineDatasetKey,
  rows: any[][],
  source: 'remote' | 'upload' | 'bundle',
  fileName?: string,
) => {
  const payload: OfflineDatasetRecord = {
    key,
    rows,
    source,
    fileName,
    updatedAt: new Date().toISOString(),
  };

  return withStore('readwrite', async (store) => {
    await requestToPromise(store.put(payload));
  });
};

export const deleteOfflineDataset = async (key: OfflineDatasetKey) => {
  return withStore('readwrite', async (store) => {
    await requestToPromise(store.delete(key));
  });
};

export const listOfflineDatasets = async (): Promise<OfflineDatasetSummary[]> => {
  const stored = await withStore('readonly', async (store) => {
    const result = await requestToPromise(store.getAll());
    return (result as OfflineDatasetRecord[]) ?? [];
  });

  const byKey = new Map(stored.map((item) => [item.key, item]));

  return OFFLINE_DATASET_KEYS.map((key) => {
    const record = byKey.get(key);
    return {
      key,
      label: OFFLINE_DATASET_LABELS[key],
      available: Boolean(record),
      rowCount: Math.max(0, (record?.rows?.length ?? 0) - 1),
      updatedAt: record?.updatedAt,
      source: record?.source,
      fileName: record?.fileName,
    };
  });
};

export const parseSpreadsheetFileToRows = async (file: File): Promise<any[][]> => {
  const buffer = await file.arrayBuffer();
  return parseSpreadsheetBufferToRows(buffer);
};

export const parseSpreadsheetBufferToRows = (buffer: ArrayBuffer): any[][] => {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded file does not contain any readable sheets');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  }) as any[][];

  if (!rows.length) {
    throw new Error('The uploaded file is empty');
  }

  return rows;
};

export const seedBundledOfflineDatasets = async () => {
  const existingRecords = await Promise.all(
    OFFLINE_DATASET_KEYS.map(async (key) => [key, await getOfflineDataset(key)] as const)
  );

  await Promise.all(
    OFFLINE_DATASET_KEYS.map(async (key) => {
      const existing = existingRecords.find(([recordKey]) => recordKey === key)?.[1] ?? null;
      if (existing?.source === 'upload') {
        return;
      }

      const fileName = BUNDLED_OFFLINE_DATASET_FILES[key];
      const response = await fetch(`/offline-files/${encodeURIComponent(fileName)}`);
      if (!response.ok) {
        throw new Error(`Failed to load bundled offline dataset: ${fileName}`);
      }

      const buffer = await response.arrayBuffer();
      const rows = parseSpreadsheetBufferToRows(buffer);
      await saveOfflineDatasetRows(key, rows, 'bundle', fileName);
    })
  );
};
