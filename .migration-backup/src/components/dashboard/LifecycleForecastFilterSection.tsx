import React from 'react';
import { Input } from '@/components/ui/input';
import { Filter, RotateCcw } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface LifecycleForecastFilters {
  dateRange: { start: string; end: string };
  primary: string;
  secondary: string;
  search: string;
}

interface LifecycleForecastFilterSectionProps {
  title: string;
  filters: LifecycleForecastFilters;
  onFiltersChange: (filters: LifecycleForecastFilters) => void;
  onReset: () => void;
  primaryLabel: string;
  primaryOptions: Option[];
  secondaryLabel: string;
  secondaryOptions: Option[];
  searchPlaceholder?: string;
}

const selectClassName =
  'h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

export const LifecycleForecastFilterSection: React.FC<LifecycleForecastFilterSectionProps> = ({
  title,
  filters,
  onFiltersChange,
  onReset,
  primaryLabel,
  primaryOptions,
  secondaryLabel,
  secondaryOptions,
  searchPlaceholder,
}) => {
  const activeCount = [
    filters.primary !== 'all',
    filters.secondary !== 'all',
    Boolean(filters.search.trim()),
    Boolean(filters.dateRange.start),
    Boolean(filters.dateRange.end),
  ].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Filter className="h-4 w-4" />
            Global Filters
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{activeCount} active controls shaping the current view.</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
        >
          <RotateCcw className="h-4 w-4" />
          Reset filters
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Start date</label>
          <Input
            type="date"
            value={filters.dateRange.start}
            onChange={(event) => onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, start: event.target.value } })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">End date</label>
          <Input
            type="date"
            value={filters.dateRange.end}
            onChange={(event) => onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, end: event.target.value } })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{primaryLabel}</label>
          <select
            value={filters.primary}
            onChange={(event) => onFiltersChange({ ...filters, primary: event.target.value })}
            className={selectClassName}
          >
            {primaryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{secondaryLabel}</label>
          <select
            value={filters.secondary}
            onChange={(event) => onFiltersChange({ ...filters, secondary: event.target.value })}
            className={selectClassName}
          >
            {secondaryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Search</label>
          <Input
            value={filters.search}
            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
            placeholder={searchPlaceholder || 'Search by member, email, or note'}
          />
        </div>
      </div>
    </div>
  );
};
