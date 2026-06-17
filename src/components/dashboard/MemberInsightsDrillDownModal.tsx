import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OptimizedTable } from '@/components/ui/OptimizedTable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { Eye, Sparkles, X } from 'lucide-react';

type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'violet';

export interface MemberInsightSummaryItem {
  label: string;
  value: string | number;
  tone?: Tone;
}

export interface MemberInsightColumn {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'number' | 'percentage' | 'text';
}

export interface MemberInsightModalData {
  title: string;
  description?: string;
  badge?: string;
  summary?: MemberInsightSummaryItem[];
  rows: Array<Record<string, unknown>>;
  columns: MemberInsightColumn[];
  emptyMessage?: string;
}

interface MemberInsightsDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MemberInsightModalData | null;
}

const TONE_STYLES: Record<Tone, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
};

const formatValue = (value: unknown, format?: MemberInsightColumn['format']) => {
  if (typeof value === 'number') {
    if (format === 'currency') return formatCurrency(value);
    if (format === 'percentage') return formatPercentage(value);
    if (format === 'number') return formatNumber(value);
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
};

export const MemberInsightsDrillDownModal: React.FC<MemberInsightsDrillDownModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  const tableColumns = data.columns.map((column) => ({
    key: column.key,
    header: column.header,
    align: column.align,
    render: (value: unknown) => formatValue(value, column.format),
  }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl overflow-hidden border-0 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 p-2">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">{data.title}</DialogTitle>
                  {data.description ? (
                    <p className="mt-2 max-w-3xl text-sm text-slate-200">{data.description}</p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {data.badge ? (
                <Badge className="border border-white/20 bg-white/10 text-white hover:bg-white/10">{data.badge}</Badge>
              ) : null}
              <button
                type="button"
                aria-label="Close modal"
                onClick={onClose}
                className="rounded-full border border-white/15 bg-white/10 p-2 text-white transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[84vh]">
          <div className="space-y-6 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-6 py-6">
            {data.summary?.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {data.summary.map((item) => {
                  const tone = item.tone || 'slate';
                  return (
                    <Card key={`${item.label}-${item.value}`} className={`border shadow-sm ${TONE_STYLES[tone]}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                          <Sparkles className="h-3.5 w-3.5" />
                          {item.label}
                        </div>
                        <p className="mt-3 text-2xl font-bold text-slate-950">{String(item.value)}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : null}

            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-200 bg-white/80">
                <CardTitle className="flex items-center justify-between gap-3 text-slate-900">
                  <span>Detailed records</span>
                  <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                    {formatNumber(data.rows.length)} rows
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {data.rows.length > 0 ? (
                  <OptimizedTable
                    data={data.rows}
                    columns={tableColumns}
                    maxHeight="520px"
                    stickyHeader
                    tableId={`member-insight-${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    showCopyButton
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center text-sm text-slate-500">
                    {data.emptyMessage || 'No records available for this selection yet.'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MemberInsightsDrillDownModal;