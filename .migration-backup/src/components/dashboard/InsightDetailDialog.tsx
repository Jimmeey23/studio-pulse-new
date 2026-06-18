import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export interface InsightDetailStat {
  label: string;
  value: string;
}

export interface InsightDetailItem {
  label: string;
  value: string;
  hint?: string;
}

export interface InsightDetailSection {
  title: string;
  description?: string;
  items?: InsightDetailItem[];
  bullets?: string[];
}

export interface InsightDetailDialogConfig {
  title: string;
  subtitle: string;
  badge?: string;
  stats?: InsightDetailStat[];
  sections?: InsightDetailSection[];
  footerNote?: string;
}

interface InsightDetailDialogProps extends InsightDetailDialogConfig {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InsightDetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  badge,
  stats = [],
  sections = [],
  footerNote,
}: InsightDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-hidden border-0 bg-white/95 p-0 shadow-2xl backdrop-blur-xl sm:rounded-3xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50/70 to-indigo-50/80 px-6 py-5 sm:px-8">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex flex-wrap items-center gap-3">
              <DialogTitle className="text-2xl font-bold text-slate-900">{title}</DialogTitle>
              {badge ? (
                <Badge className="border border-blue-200 bg-blue-50 text-blue-700">{badge}</Badge>
              ) : null}
            </div>
            <DialogDescription className="max-w-3xl text-sm leading-6 text-slate-600">
              {subtitle}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(88vh-120px)] overflow-y-auto px-6 py-6 sm:px-8">
          {stats.length > 0 ? (
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-xl font-bold text-slate-950">{stat.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-5">
            {sections.map((section) => (
              <div key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">{section.title}</h3>
                {section.description ? (
                  <p className="mt-1 text-sm leading-6 text-slate-600">{section.description}</p>
                ) : null}

                {section.items && section.items.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {section.items.map((item) => (
                      <div
                        key={`${section.title}-${item.label}-${item.value}`}
                        className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{item.label}</p>
                            {item.hint ? <p className="mt-1 text-xs text-slate-500">{item.hint}</p> : null}
                          </div>
                          <p className="text-sm font-semibold text-blue-700 sm:text-right">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="mt-4 space-y-2 pl-5 text-sm leading-6 text-slate-700">
                    {section.bullets.map((bullet) => (
                      <li key={`${section.title}-${bullet}`} className="list-disc">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>

          {footerNote ? (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-800">
              {footerNote}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
