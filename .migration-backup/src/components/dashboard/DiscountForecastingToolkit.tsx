import React, { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { SalesData } from '@/types/dashboard';
import {
  buildDiscountRecommendations,
  buildMonthlyDiscountTrend,
  forecastDiscountTrend,
  simulateDiscountScenario,
  summarizeDiscountPerformance,
} from '@/utils/discountAnalytics';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { BrainCircuit, Lightbulb, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiscountForecastingToolkitProps {
  currentData: SalesData[];
  historicalData: SalesData[];
}

const PRIORITY_STYLES: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-rose-100 text-rose-700 border-rose-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const ScenarioSlider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) => (
  <div className="space-y-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-8 w-24 text-right"
      />
    </div>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next)} />
  </div>
);

export const DiscountForecastingToolkit: React.FC<DiscountForecastingToolkitProps> = ({
  currentData,
  historicalData,
}) => {
  const currentSummary = useMemo(() => summarizeDiscountPerformance(currentData), [currentData]);
  const monthlyTrend = useMemo(() => buildMonthlyDiscountTrend(historicalData, 8), [historicalData]);
  const forecast = useMemo(() => forecastDiscountTrend(monthlyTrend, 3), [monthlyTrend]);
  const recommendations = useMemo(
    () => buildDiscountRecommendations(currentData, historicalData, forecast),
    [currentData, historicalData, forecast],
  );

  const [coverageRate, setCoverageRate] = useState(45);
  const [targetDiscountRate, setTargetDiscountRate] = useState(Math.max(4, Math.round(currentSummary.discountRate || 8)));
  const [transactionLift, setTransactionLift] = useState(8);
  const [ticketChange, setTicketChange] = useState(2);

  const scenario = useMemo(
    () => simulateDiscountScenario(currentData, { coverageRate, targetDiscountRate, transactionLift, ticketChange }),
    [currentData, coverageRate, targetDiscountRate, transactionLift, ticketChange],
  );

  const forecastChartData = useMemo(() => {
    const actual = monthlyTrend.map((item) => ({
      monthLabel: item.monthLabel,
      actualDiscountRate: item.discountRate,
      actualDiscountAmount: item.discountAmount,
      forecastDiscountRate: null as number | null,
      forecastDiscountAmount: null as number | null,
    }));

    const projected = forecast.map((item) => ({
      monthLabel: item.monthLabel,
      actualDiscountRate: null as number | null,
      actualDiscountAmount: null as number | null,
      forecastDiscountRate: item.discountRate,
      forecastDiscountAmount: item.discountAmount,
    }));

    return [...actual, ...projected];
  }, [forecast, monthlyTrend]);

  const forecastRows = useMemo(
    () => forecast.map((item) => ({
      month: item.monthLabel,
      projectedGrossRevenue: item.grossRevenue,
      projectedDiscountAmount: item.discountAmount,
      projectedNetRevenue: item.netRevenue,
      projectedDiscountRate: item.discountRate,
      projectedTransactions: item.discountedTransactions,
      confidence: item.confidence,
    })),
    [forecast],
  );

  const recommendationRows = useMemo(
    () => recommendations.map((item, index) => ({
      order: index + 1,
      priority: item.priority,
      title: item.title,
      impact: item.impact,
      detail: item.detail,
    })),
    [recommendations],
  );

  const scenarioRows = useMemo(
    () => [
      {
        scenario: 'Baseline current view',
        netRevenue: scenario.baselineNetRevenue,
        grossRevenue: currentSummary.totalGrossRevenue,
        discountAmount: currentSummary.totalDiscountAmount,
        discountRate: currentSummary.discountRate,
      },
      {
        scenario: 'What-if projection',
        netRevenue: scenario.projectedNetRevenue,
        grossRevenue: scenario.projectedGrossRevenue,
        discountAmount: scenario.projectedDiscountAmount,
        discountRate: targetDiscountRate,
      },
    ],
    [currentSummary.totalDiscountAmount, currentSummary.totalGrossRevenue, currentSummary.discountRate, scenario, targetDiscountRate],
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <TrendingUp className="h-5 w-5 text-cyan-300" />
              Discount forecast runway
            </CardTitle>
            <p className="text-sm text-slate-300">
              Historical discount performance from the sales hook, projected forward for the next 3 months.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current discount rate</p>
                <p className="mt-2 text-2xl font-semibold">{formatPercentage(currentSummary.discountRate)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Projected 90-day discount spend</p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(forecast.reduce((sum, item) => sum + item.discountAmount, 0))}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Projected 90-day net revenue</p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(forecast.reduce((sum, item) => sum + item.netRevenue, 0))}
                </p>
              </div>
            </div>

            <div className="h-[340px] rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastChartData}>
                  <CartesianGrid stroke="rgba(148,163,184,0.18)" strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" stroke="#cbd5e1" />
                  <YAxis yAxisId="left" stroke="#cbd5e1" tickFormatter={(value) => `${value}%`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#cbd5e1" tickFormatter={(value) => formatCurrency(Number(value))} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name.toLowerCase().includes('rate')) {
                        return [`${value.toFixed(1)}%`, name.includes('forecast') ? 'Forecast discount rate' : 'Actual discount rate'];
                      }
                      return [formatCurrency(value), name.includes('forecast') ? 'Forecast discount amount' : 'Actual discount amount'];
                    }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(148,163,184,0.25)', color: '#fff' }}
                  />
                  <Legend />
                  <Bar yAxisId="right" dataKey="actualDiscountAmount" name="Actual discount amount" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="forecastDiscountAmount" name="Forecast discount amount" fill="#a78bfa" radius={[8, 8, 0, 0]} />
                  <Line yAxisId="left" type="monotone" dataKey="actualDiscountRate" name="Actual discount rate" stroke="#f8fafc" strokeWidth={3} dot={{ r: 3 }} connectNulls />
                  <Line yAxisId="left" type="monotone" dataKey="forecastDiscountRate" name="Forecast discount rate" stroke="#f59e0b" strokeWidth={3} strokeDasharray="6 6" dot={{ r: 3 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/50 to-cyan-50/40 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Discount recommendations
            </CardTitle>
            <p className="text-sm text-slate-600">
              Recommendations are derived from current discount intensity, month-on-month movement, and forecast direction.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((recommendation) => (
              <div key={recommendation.title} className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{recommendation.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{recommendation.impact}</p>
                  </div>
                  <Badge className={cn('border capitalize', PRIORITY_STYLES[recommendation.priority])} variant="outline">
                    {recommendation.priority}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{recommendation.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-slate-200 bg-white/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Sparkles className="h-5 w-5 text-fuchsia-500" />
              What-if simulator
            </CardTitle>
            <p className="text-sm text-slate-600">
              Model how changing discount intensity on a chosen share of revenue could change gross and net revenue.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <ScenarioSlider label="Campaign coverage %" value={coverageRate} min={5} max={100} step={1} onChange={setCoverageRate} />
            <ScenarioSlider label="Target discount rate %" value={targetDiscountRate} min={0} max={40} step={0.5} onChange={setTargetDiscountRate} />
            <ScenarioSlider label="Expected transaction lift %" value={transactionLift} min={-20} max={50} step={1} onChange={setTransactionLift} />
            <ScenarioSlider label="Average ticket change %" value={ticketChange} min={-15} max={25} step={0.5} onChange={setTicketChange} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Projected net revenue</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(scenario.projectedNetRevenue)}</p>
                <p className={cn('mt-2 text-sm font-medium', scenario.incrementalNetRevenue >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  {scenario.incrementalNetRevenue >= 0 ? '+' : ''}{formatCurrency(scenario.incrementalNetRevenue)} vs baseline
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Break-even transaction lift</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercentage(scenario.breakEvenTransactionLift)}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Minimum lift needed for the impacted {scenario.impactedRevenueShare.toFixed(0)}% revenue slice to offset the new discount rate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <BrainCircuit className="h-5 w-5 text-indigo-600" />
              Forecast and scenario tables
            </CardTitle>
            <p className="text-sm text-slate-600">These tables are export-friendly and stay aligned with the same canonical sales-backed discount model.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ModernDataTable
              data={forecastRows}
              columns={[
                { key: 'month', header: 'Month', align: 'left' },
                { key: 'projectedGrossRevenue', header: 'Projected gross', align: 'right', render: (value) => formatCurrency(value) },
                { key: 'projectedDiscountAmount', header: 'Projected discounts', align: 'right', render: (value) => formatCurrency(value) },
                { key: 'projectedNetRevenue', header: 'Projected net', align: 'right', render: (value) => formatCurrency(value) },
                { key: 'projectedDiscountRate', header: 'Discount rate', align: 'right', render: (value) => formatPercentage(value) },
                { key: 'confidence', header: 'Confidence', align: 'right', render: (value) => formatPercentage(value) },
              ]}
              tableId="discount-forecast-table"
              maxHeight="280px"
              compact
            />

            <ModernDataTable
              data={scenarioRows}
              columns={[
                { key: 'scenario', header: 'Scenario', align: 'left' },
                { key: 'grossRevenue', header: 'Gross revenue', align: 'right', render: (value) => formatCurrency(value) },
                { key: 'discountAmount', header: 'Discount spend', align: 'right', render: (value) => formatCurrency(value) },
                { key: 'netRevenue', header: 'Net revenue', align: 'right', render: (value) => formatCurrency(value) },
                { key: 'discountRate', header: 'Discount rate', align: 'right', render: (value) => formatPercentage(value) },
              ]}
              tableId="discount-what-if-table"
              compact
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white/90 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Action log</CardTitle>
          <p className="text-sm text-slate-600">Recommendation register generated from the same filtered dataset, ready for table export and follow-up.</p>
        </CardHeader>
        <CardContent>
          <ModernDataTable
            data={recommendationRows}
            columns={[
              { key: 'order', header: '#', align: 'center', className: 'w-12' },
              {
                key: 'priority',
                header: 'Priority',
                align: 'center',
                render: (value) => (
                  <Badge className={cn('border capitalize', PRIORITY_STYLES[value])} variant="outline">
                    {value}
                  </Badge>
                ),
              },
              { key: 'title', header: 'Recommendation', align: 'left' },
              { key: 'impact', header: 'Why it matters', align: 'left' },
              { key: 'detail', header: 'Recommended action', align: 'left' },
            ]}
            tableId="discount-recommendations-log"
            maxHeight="320px"
          />
        </CardContent>
      </Card>
    </div>
  );
};
