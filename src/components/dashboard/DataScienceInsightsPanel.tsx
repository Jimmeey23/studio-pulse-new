import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Activity,
  ChevronDown,
  ChevronRight,
  Gauge,
  Sigma,
  TrendingUp,
} from 'lucide-react';

export interface MetricOption<T> {
  key: string;
  label: string;
  accessor: (row: T) => number;
}

interface DataScienceInsightsPanelProps<T> {
  title: string;
  description?: string;
  data: T[];
  metricOptions: MetricOption<T>[];
  dateAccessor?: (row: T) => Date | null;
  initiallyCollapsed?: boolean;
  className?: string;
}

const percentile = (sorted: number[], p: number): number => {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sorted[low];
  const w = idx - low;
  return sorted[low] * (1 - w) + sorted[high] * w;
};

const mean = (arr: number[]): number => {
  if (!arr.length) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
};

const stdDev = (arr: number[], avg: number): number => {
  if (arr.length < 2) return 0;
  const variance = arr.reduce((sum, v) => sum + (v - avg) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
};

const formatSmart = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toFixed(2);
};

export const DataScienceInsightsPanel = <T,>({
  title,
  description,
  data,
  metricOptions,
  dateAccessor,
  initiallyCollapsed = true,
  className,
}: DataScienceInsightsPanelProps<T>) => {
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>(metricOptions[0]?.key || '');
  const [outlierMethod, setOutlierMethod] = useState<'zscore' | 'iqr'>('zscore');
  const [sensitivity, setSensitivity] = useState(2.5);
  const [smoothingWindow, setSmoothingWindow] = useState(2);

  const selectedMetric =
    metricOptions.find(option => option.key === selectedMetricKey) || metricOptions[0];

  const values = useMemo(() => {
    if (!selectedMetric) return [] as number[];
    return data
      .map(row => Number(selectedMetric.accessor(row)))
      .filter(value => Number.isFinite(value));
  }, [data, selectedMetric]);

  const stats = useMemo(() => {
    if (!values.length) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        p90: 0,
        cv: 0,
        q1: 0,
        q3: 0,
        iqr: 0,
        anomalies: 0,
        anomalyRate: 0,
        top20Share: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const avg = mean(values);
    const sigma = stdDev(values, avg);
    const med = percentile(sorted, 0.5);
    const p90 = percentile(sorted, 0.9);
    const q1 = percentile(sorted, 0.25);
    const q3 = percentile(sorted, 0.75);
    const iqr = q3 - q1;

    const anomalies = values.filter(value => {
      if (outlierMethod === 'zscore') {
        if (sigma === 0) return false;
        return Math.abs((value - avg) / sigma) >= sensitivity;
      }
      const lower = q1 - sensitivity * iqr;
      const upper = q3 + sensitivity * iqr;
      return value < lower || value > upper;
    }).length;

    const total = values.reduce((sum, value) => sum + value, 0);
    const topCount = Math.max(1, Math.ceil(values.length * 0.2));
    const topSum = [...values]
      .sort((a, b) => b - a)
      .slice(0, topCount)
      .reduce((sum, value) => sum + value, 0);

    return {
      count: values.length,
      mean: avg,
      median: med,
      stdDev: sigma,
      p90,
      cv: avg !== 0 ? (sigma / avg) * 100 : 0,
      q1,
      q3,
      iqr,
      anomalies,
      anomalyRate: values.length > 0 ? (anomalies / values.length) * 100 : 0,
      top20Share: total !== 0 ? (topSum / total) * 100 : 0,
    };
  }, [values, outlierMethod, sensitivity]);

  const trend = useMemo(() => {
    if (!dateAccessor || !selectedMetric) {
      return { points: 0, slope: 0, monthlyChangePct: 0 };
    }

    const grouped = new Map<string, number>();

    data.forEach(row => {
      const date = dateAccessor(row);
      if (!date || Number.isNaN(date.getTime())) return;
      const value = Number(selectedMetric.accessor(row));
      if (!Number.isFinite(value)) return;

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      grouped.set(monthKey, (grouped.get(monthKey) || 0) + value);
    });

    const points = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);

    if (points.length < 2) {
      return { points: points.length, slope: 0, monthlyChangePct: 0 };
    }

    const smoothed = points.map((_, idx) => {
      const start = Math.max(0, idx - smoothingWindow + 1);
      const windowVals = points.slice(start, idx + 1);
      return mean(windowVals);
    });

    const n = smoothed.length;
    const xMean = (n - 1) / 2;
    const yMean = mean(smoothed);

    let numerator = 0;
    let denominator = 0;

    smoothed.forEach((value, index) => {
      numerator += (index - xMean) * (value - yMean);
      denominator += (index - xMean) ** 2;
    });

    const slope = denominator > 0 ? numerator / denominator : 0;
    const monthlyChangePct = yMean !== 0 ? (slope / yMean) * 100 : 0;

    return {
      points: smoothed.length,
      slope,
      monthlyChangePct,
    };
  }, [data, selectedMetric, dateAccessor, smoothingWindow]);

  const sampleQuality =
    stats.count >= 100 ? 'High' : stats.count >= 30 ? 'Medium' : stats.count > 0 ? 'Low' : 'No data';

  return (
    <Card className={`bg-white border border-slate-200 shadow-sm ${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Sigma className="w-4 h-4 text-slate-700" />
              {title}
            </CardTitle>
            {description ? <p className="text-xs text-slate-600 mt-1">{description}</p> : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(prev => !prev)}
            className="h-8 px-2 text-slate-700"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-xs text-slate-700 space-y-1">
              <span className="font-medium">Metric</span>
              <select
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                value={selectedMetricKey}
                onChange={event => setSelectedMetricKey(event.target.value)}
              >
                {metricOptions.map(option => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-700 space-y-1">
              <span className="font-medium">Outlier Method</span>
              <select
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                value={outlierMethod}
                onChange={event => setOutlierMethod(event.target.value as 'zscore' | 'iqr')}
              >
                <option value="zscore">Z-Score</option>
                <option value="iqr">IQR Fence</option>
              </select>
            </label>

            <label className="text-xs text-slate-700 space-y-1">
              <span className="font-medium">Sensitivity: {sensitivity.toFixed(1)}</span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.1}
                value={sensitivity}
                onChange={event => setSensitivity(Number(event.target.value))}
                className="w-full"
              />
            </label>

            <label className="text-xs text-slate-700 space-y-1">
              <span className="font-medium">Trend Smoothing: {smoothingWindow}m</span>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={smoothingWindow}
                onChange={event => setSmoothingWindow(Number(event.target.value))}
                className="w-full"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/60">
              <div className="text-[11px] text-slate-600">Sample Size</div>
              <div className="text-lg font-semibold text-slate-900">{stats.count}</div>
              <div className="text-[11px] text-slate-500">Quality: {sampleQuality}</div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/60">
              <div className="text-[11px] text-slate-600">Mean / Median</div>
              <div className="text-sm font-semibold text-slate-900">{formatSmart(stats.mean)} / {formatSmart(stats.median)}</div>
              <div className="text-[11px] text-slate-500">P90: {formatSmart(stats.p90)}</div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/60">
              <div className="text-[11px] text-slate-600 flex items-center gap-1">
                <Gauge className="w-3 h-3" /> Dispersion
              </div>
              <div className="text-sm font-semibold text-slate-900">SD {formatSmart(stats.stdDev)}</div>
              <div className="text-[11px] text-slate-500">CV: {stats.cv.toFixed(1)}%</div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/60">
              <div className="text-[11px] text-slate-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Outliers
              </div>
              <div className="text-lg font-semibold text-slate-900">{stats.anomalies}</div>
              <div className="text-[11px] text-slate-500">{stats.anomalyRate.toFixed(1)}% of rows</div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/60">
              <div className="text-[11px] text-slate-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Trend
              </div>
              <div className={`text-sm font-semibold ${trend.monthlyChangePct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {trend.monthlyChangePct >= 0 ? '+' : ''}{trend.monthlyChangePct.toFixed(2)}% / month
              </div>
              <div className="text-[11px] text-slate-500">{trend.points} monthly points</div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/60">
              <div className="text-[11px] text-slate-600 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Concentration
              </div>
              <div className="text-lg font-semibold text-slate-900">{stats.top20Share.toFixed(1)}%</div>
              <div className="text-[11px] text-slate-500">Top 20% share</div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/60">
              <div className="text-[11px] text-slate-600">Q1 / Q3</div>
              <div className="text-sm font-semibold text-slate-900">{formatSmart(stats.q1)} / {formatSmart(stats.q3)}</div>
              <div className="text-[11px] text-slate-500">IQR: {formatSmart(stats.iqr)}</div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/60">
              <div className="text-[11px] text-slate-600">Method Signal</div>
              <div className="text-sm font-semibold text-slate-900">{outlierMethod === 'zscore' ? 'Normality-sensitive' : 'Robust to skew'}</div>
              <div className="text-[11px] text-slate-500">Sensitivity {sensitivity.toFixed(1)}</div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default DataScienceInsightsPanel;
