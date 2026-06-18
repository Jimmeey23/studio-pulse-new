import React from 'react';
import type { DateRange } from 'react-day-picker';
import { CalendarRange, ChevronDown, Filter, RotateCcw } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { cn } from '@/lib/utils';

type StudioId = 'all' | 'kwality' | 'supreme' | 'kenkere' | 'popup';

interface StudioOption {
  id: StudioId;
  name: string;
  area: string;
}

interface StudioPulseFilterSectionProps {
  studio: StudioId;
  onStudioChange: (studio: StudioId) => void;
  studios: StudioOption[];
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onReset: () => void;
}

const toDateRangeValue = (range: { start: string; end: string }): DateRange | undefined => {
  if (!range.start && !range.end) return undefined;

  return {
    from: range.start ? new Date(`${range.start}T00:00:00`) : undefined,
    to: range.end ? new Date(`${range.end}T00:00:00`) : undefined,
  };
};

const toIsoDate = (value?: Date) => {
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const StudioPulseFilterSection: React.FC<StudioPulseFilterSectionProps> = ({
  studio,
  onStudioChange,
  studios,
  dateRange,
  onDateRangeChange,
  onReset,
}) => {
  const selectedStudio = studios.find((item) => item.id === studio) ?? studios[0];

  return (
    <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 hover:bg-slate-50/80">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white shadow-lg">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Detailed Filters</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {selectedStudio.name} · {dateRange.start} to {dateRange.end}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-300"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onReset();
              }}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
          </div>
        </summary>
        <CardHeader className="border-t border-slate-200/80 bg-gradient-to-br from-slate-50/70 to-white px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarRange className="h-4 w-4" />
                Date Range
              </div>
              <DatePickerWithRange
                value={toDateRangeValue(dateRange)}
                onChange={(value) =>
                  onDateRangeChange({
                    start: toIsoDate(value?.from),
                    end: toIsoDate(value?.to ?? value?.from),
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-slate-500">
                Defaults to the previous month and drives every Studio Pulse metric, chart, and table.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-700">Studio Scope</div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {studios.map((item) => {
                  const active = item.id === studio;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onStudioChange(item.id)}
                      className={cn(
                        'rounded-2xl border px-4 py-3 text-left transition-all duration-200',
                        active
                          ? 'border-slate-900 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-lg'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div className="text-sm font-bold">{item.name}</div>
                      <div className={cn('mt-1 text-[11px]', active ? 'text-slate-200' : 'text-slate-400')}>{item.area}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <p className="text-xs text-slate-500">
            This filter block is reusable for other cross-dataset summary pages that need one shared studio and date-range control surface.
          </p>
        </CardContent>
      </details>
    </Card>
  );
};
