import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExecutiveFilterSection } from '@/components/dashboard/ExecutiveFilterSection';
import { cn } from '@/lib/utils';
import { ClipboardPaste, LayoutGrid, MapPin, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type WorkbenchBlock = {
  id: string;
  title: string;
  html: string;
  text: string;
  createdAt: number;
};

const STORAGE_KEY = 'p57-dashboard-workbench-blocks-v1';

const LOCATION_TABS = [
  { id: 'all', label: 'All Locations' },
  { id: 'Kwality House, Kemps Corner', label: 'Kwality House' },
  { id: 'Supreme HQ, Bandra', label: 'Supreme HQ' },
  { id: 'Kenkere House, Bengaluru', label: 'Kenkere House' },
];

const readBlocks = (): WorkbenchBlock[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as WorkbenchBlock[];
  } catch {
    return [];
  }
};

const writeBlocks = (blocks: WorkbenchBlock[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
};

const extractClipboardPayload = async () => {
  if (!navigator.clipboard?.read) {
    const text = await navigator.clipboard.readText();
    return { html: '', text };
  }

  const items = await navigator.clipboard.read();
  for (const item of items) {
    const htmlType = item.types.find((type) => type === 'text/html');
    if (htmlType) {
      const blob = await item.getType(htmlType);
      const html = await blob.text();
      const textBlob = item.types.includes('text/plain') ? await item.getType('text/plain') : null;
      const text = textBlob ? await textBlob.text() : html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return { html, text };
    }
  }

  const text = await navigator.clipboard.readText();
  return { html: '', text };
};

const createBlock = async (): Promise<WorkbenchBlock | null> => {
  const payload = await extractClipboardPayload();
  const text = payload.text.trim();
  if (!text && !payload.html.trim()) return null;

  const titleMatch = text.split('\n').find(Boolean)?.trim();
  const title = titleMatch || 'Pasted Element';

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    html: payload.html || `<div>${text.split('\n').map((line) => `<div>${line}</div>`).join('')}</div>`,
    text,
    createdAt: Date.now(),
  };
};

export const DashboardWorkbench: React.FC = () => {
  const { toast } = useToast();
  const [blocks, setBlocks] = React.useState<WorkbenchBlock[]>(() => readBlocks());
  const [activeLocation, setActiveLocation] = React.useState('all');

  React.useEffect(() => {
    writeBlocks(blocks);
  }, [blocks]);

  const handlePaste = async () => {
    try {
      const block = await createBlock();
      if (!block) {
        toast({ title: 'Nothing to paste', description: 'Copy a table, card, chart, or list first.' });
        return;
      }
      setBlocks((current) => [block, ...current]);
      toast({ title: 'Element pasted', description: `${block.title} was added to this dashboard tab.` });
    } catch (error) {
      toast({
        title: 'Paste failed',
        description: error instanceof Error ? error.message : 'Unable to read clipboard',
        variant: 'destructive',
      });
    }
  };

  const clearBlocks = () => {
    setBlocks([]);
    toast({ title: 'Workspace cleared', description: 'All pasted elements were removed.' });
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white/95 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <LayoutGrid className="h-5 w-5 text-slate-700" />
                Dashboard Workbench
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Empty canvas for pasted tables, metric cards, charts, and lists from any other tab.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePaste} className="gap-2">
                <ClipboardPaste className="h-4 w-4" />
                Paste from clipboard
              </Button>
              <Button variant="ghost" onClick={clearBlocks} className="gap-2 text-slate-600">
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {LOCATION_TABS.map((location) => {
              const active = activeLocation === location.id;
              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => setActiveLocation(location.id)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-2xl border px-4 py-4 text-center transition-all',
                    active
                      ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white',
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4" />
                    {location.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <ExecutiveFilterSection availableLocations={[]} showExportButton={false} />

          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6">
            {blocks.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <div className="rounded-full bg-white p-4 shadow-sm">
                  <Plus className="h-6 w-6 text-slate-500" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No elements pasted yet</h3>
                <p className="mt-2 max-w-xl text-sm text-slate-500">
                  Copy any table, metric card, chart, or list from another tab, then paste it here to assemble a custom dashboard layout.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {blocks.map((block) => (
                  <Card key={block.id} className="overflow-hidden border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-100 bg-white">
                      <div>
                        <CardTitle className="text-base font-semibold text-slate-900">{block.title}</CardTitle>
                        <Badge variant="secondary" className="mt-2">
                          Pasted element
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setBlocks((current) => current.filter((item) => item.id !== block.id))}
                      >
                        Remove
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div
                        className="overflow-auto rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-inner"
                        dangerouslySetInnerHTML={{ __html: block.html }}
                      />
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-medium text-slate-500">Copied text</summary>
                        <pre className="mt-2 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
                          {block.text}
                        </pre>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardWorkbench;
