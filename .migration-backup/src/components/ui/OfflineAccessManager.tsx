import * as React from 'react';
import { Wifi, WifiOff, Database, Upload, Trash2, HardDriveDownload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDataSource } from '@/contexts/DataSourceContext';
import { OFFLINE_DATASET_KEYS, OFFLINE_DATASET_LABELS, type OfflineDatasetKey } from '@/types/offlineData';

export const OfflineAccessManager: React.FC = () => {
  const { mode, setMode, isOnline, datasets, uploadDatasetFile, clearDataset, refreshDatasets, offlineAccessEnabled } = useDataSource();
  const [isOpen, setIsOpen] = React.useState(false);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  React.useEffect(() => {
    if (isOpen) {
      void refreshDatasets();
    }
  }, [isOpen, refreshDatasets]);

  const datasetMap = React.useMemo(
    () => new Map(datasets.map((dataset) => [dataset.key, dataset])),
    [datasets]
  );

  const handleUpload = async (key: OfflineDatasetKey, file?: File | null) => {
    if (!file) return;
    try {
      setBusyKey(key);
      await uploadDatasetFile(key, file);
    } finally {
      setBusyKey(null);
      const input = fileInputRefs.current[key];
      if (input) input.value = '';
    }
  };

  const handleClear = async (key: OfflineDatasetKey) => {
    try {
      setBusyKey(`clear-${key}`);
      await clearDataset(key);
    } finally {
      setBusyKey(null);
    }
  };

  const availableCount = datasets.filter((dataset) => dataset.available).length;

  if (!offlineAccessEnabled && mode !== 'offline') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[120]">
      {isOpen && (
        <Card className="mb-3 w-[min(92vw,34rem)] border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Offline Access Manager
              </span>
              <div className="flex items-center gap-2">
                <Badge className={isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
                <Badge className={mode === 'offline' ? 'bg-slate-900 text-white' : 'bg-blue-100 text-blue-700'}>
                  {mode === 'offline' ? 'Offline mode' : 'Online mode'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-800">How it works</p>
              <p className="mt-1">
                The dashboard loads live data by default. Offline mode stays available only after it has been explicitly enabled.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Once enabled, offline mode can use bundled, cached, or uploaded datasets so the dashboard still works without re-uploading files every session.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setMode('online')}
                variant={mode === 'online' ? 'default' : 'outline'}
                className="gap-2"
              >
                <Wifi className="h-4 w-4" />
                Use live data
              </Button>
              <Button
                size="sm"
                onClick={() => setMode('offline')}
                variant={mode === 'offline' ? 'default' : 'outline'}
                className="gap-2"
              >
                <WifiOff className="h-4 w-4" />
                Use offline data
              </Button>
              <Badge variant="outline" className="ml-auto">
                {availableCount}/{datasets.length} datasets ready offline
              </Badge>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
              {OFFLINE_DATASET_KEYS.map((key) => {
                const dataset = datasetMap.get(key);
                const busy = busyKey === key || busyKey === `clear-${key}`;
                return (
                  <div key={key} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-slate-900">{OFFLINE_DATASET_LABELS[key]}</div>
                        <div className="text-xs text-slate-500">
                          {dataset?.available
                            ? `${dataset.rowCount.toLocaleString()} rows • ${dataset.source === 'upload' ? dataset.fileName || 'uploaded file' : dataset.source === 'bundle' ? dataset.fileName || 'bundled offline file' : 'cached from live source'}`
                            : 'No offline data stored yet'}
                        </div>
                        {dataset?.updatedAt && (
                          <div className="text-[11px] text-slate-400">
                            Updated {new Date(dataset.updatedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={dataset?.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                          {dataset?.available ? 'Ready' : 'Missing'}
                        </Badge>
                        <input
                          ref={(element) => {
                            fileInputRefs.current[key] = element;
                          }}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          onChange={(event) => void handleUpload(key, event.target.files?.[0])}
                        />
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => fileInputRefs.current[key]?.click()} className="gap-2">
                          <Upload className="h-4 w-4" />
                          Upload
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!dataset?.available || busy}
                          onClick={() => void handleClear(key)}
                          className="gap-2 text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setIsOpen((current) => !current)}
        className="gap-2 rounded-full px-5 shadow-xl"
      >
        <HardDriveDownload className="h-4 w-4" />
        {mode === 'offline' ? 'Offline mode' : 'Offline access'}
      </Button>
    </div>
  );
};
