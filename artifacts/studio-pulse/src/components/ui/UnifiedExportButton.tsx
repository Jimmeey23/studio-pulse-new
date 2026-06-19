import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, FileSpreadsheet, FileText, FileJson, FileCode2,
  Clipboard, ChevronDown, Check, Loader2, Table2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export type ExportFormat = 'xlsx' | 'pdf' | 'csv' | 'json' | 'html' | 'clipboard';

interface UnifiedExportButtonProps {
  onExport: (format: ExportFormat) => Promise<void> | void;
  isExporting?: boolean;
  className?: string;
  size?: 'sm' | 'default';
}

const FORMAT_OPTIONS: {
  format: ExportFormat;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    format: 'xlsx',
    label: 'Excel Workbook',
    sublabel: 'All tabs & metric cards',
    icon: FileSpreadsheet,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    format: 'csv',
    label: 'CSV Bundle',
    sublabel: 'All tables, comma-separated',
    icon: Table2,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    format: 'pdf',
    label: 'PDF Report',
    sublabel: 'Print-ready landscape',
    icon: FileText,
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  {
    format: 'json',
    label: 'JSON Data',
    sublabel: 'Structured for APIs',
    icon: FileJson,
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    format: 'html',
    label: 'HTML Report',
    sublabel: 'Styled web report',
    icon: FileCode2,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    format: 'clipboard',
    label: 'Copy to Clipboard',
    sublabel: 'Paste into any app',
    icon: Clipboard,
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
];

export const UnifiedExportButton: React.FC<UnifiedExportButtonProps> = ({
  onExport,
  isExporting = false,
  className,
  size = 'default',
}) => {
  const [open, setOpen] = useState(false);
  const [lastExported, setLastExported] = useState<ExportFormat | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async (format: ExportFormat) => {
    setOpen(false);
    try {
      await onExport(format);
      setLastExported(format);
      setTimeout(() => setLastExported(null), 3000);
    } catch (err) {
      toast({
        title: 'Export failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
        duration: 4000,
      });
    }
  };

  const isSmall = size === 'sm';

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => !isExporting && setOpen((v) => !v)}
        disabled={isExporting}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border font-semibold shadow-sm backdrop-blur transition-all duration-150',
          'border-slate-200 bg-white/70 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isSmall
            ? 'h-8 px-3 text-[11px]'
            : 'h-8 px-3 text-[11px]',
          open && 'border-blue-300 bg-blue-50 text-blue-700'
        )}
      >
        {isExporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {isExporting ? 'Exporting…' : 'Export'}
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.18)]"
          >
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Export All Data
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                All tabs, tables & metric cards
              </p>
            </div>
            <div className="p-1.5 space-y-0.5">
              {FORMAT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isDone = lastExported === opt.format;
                return (
                  <button
                    key={opt.format}
                    onClick={() => handleSelect(opt.format)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-100',
                      'hover:bg-slate-50',
                      isDone && 'bg-emerald-50'
                    )}
                  >
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', opt.bg, opt.border)}>
                      {isDone ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Icon className={cn('h-4 w-4', opt.color)} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-[13px] font-semibold leading-tight', isDone ? 'text-emerald-700' : 'text-slate-800')}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {opt.sublabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
