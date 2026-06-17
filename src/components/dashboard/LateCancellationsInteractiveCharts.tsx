import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LateCancellationsData } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { BarChart3, CalendarRange, Clock3, MapPin, Sparkles } from 'lucide-react';

interface LateCancellationsInteractiveChartsProps {
  data: LateCancellationsData[];
}

const COLORS = ['#dc2626', '#ea580c', '#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#db2777', '#475569'];

export const LateCancellationsInteractiveCharts: React.FC<LateCancellationsInteractiveChartsProps> = ({ data }) => {
  const [activeChart, setActiveChart] = useState<'monthly' | 'lead-time' | 'events' | 'locations'>('monthly');

  const monthlyData = useMemo(() => {
    const groups = data.reduce((acc, item) => {
      if (!item.dateIST) return acc;
      const date = new Date(item.dateIST);
      if (Number.isNaN(date.getTime())) return acc;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          count: 0,
          penalty: 0,
          totalLeadHours: 0,
          leadEntries: 0,
        };
      }

      acc[key].count += 1;
      acc[key].penalty += item.chargedPenaltyAmount || 0;
      if (typeof item.timeBeforeClassHours === 'number') {
        acc[key].totalLeadHours += item.timeBeforeClassHours;
        acc[key].leadEntries += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groups)
      .map((group: any) => ({
        ...group,
        avgLeadHours: group.leadEntries ? Math.round((group.totalLeadHours / group.leadEntries) * 10) / 10 : 0,
      }))
      .sort((a: any, b: any) => a.key.localeCompare(b.key));
  }, [data]);

  const leadTimeData = useMemo(() => {
    const groups = data.reduce((acc, item) => {
      const bucket = item.cancellationWindow || 'Unknown';
      if (!acc[bucket]) {
        acc[bucket] = { name: bucket, count: 0, penalty: 0 };
      }
      acc[bucket].count += 1;
      acc[bucket].penalty += item.chargedPenaltyAmount || 0;
      return acc;
    }, {} as Record<string, { name: string; count: number; penalty: number }>);

    const order = ['<1 hour', '1-3 hours', '3-6 hours', '6-12 hours', '12-24 hours', '24+ hours', 'Unknown'];
    return order.map((name) => groups[name]).filter(Boolean);
  }, [data]);

  const topEvents = useMemo(() => {
    const groups = data.reduce((acc, item) => {
      const key = item.cleanedClass || item.cancelledEvent || 'Unknown Event';
      if (!acc[key]) {
        acc[key] = { name: key, count: 0, penalties: 0 };
      }
      acc[key].count += 1;
      acc[key].penalties += item.chargedPenaltyAmount || 0;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groups).sort((a: any, b: any) => b.count - a.count).slice(0, 8);
  }, [data]);

  const locationData = useMemo(() => {
    const groups = data.reduce((acc, item) => {
      const key = item.location || 'Unknown';
      if (!acc[key]) {
        acc[key] = { name: key, count: 0, penalties: 0 };
      }
      acc[key].count += 1;
      acc[key].penalties += item.chargedPenaltyAmount || 0;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groups).sort((a: any, b: any) => b.count - a.count);
  }, [data]);

  const summaryLabel = useMemo(() => {
    if (!data.length) return 'No cancellation data available';
    const feeTotal = data.reduce((sum, item) => sum + (item.chargedPenaltyAmount || 0), 0);
    return `${formatNumber(data.length)} late cancellations analysed · ${formatCurrency(feeTotal)} in penalties tracked`;
  }, [data]);

  if (!data.length) {
    return (
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <BarChart3 className="h-5 w-5 text-red-600" />
            Late Cancellation Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-slate-500">
          No data available for charts.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <BarChart3 className="h-5 w-5 text-red-600" />
              Late Cancellation Trends
            </CardTitle>
            <p className="mt-2 text-sm text-slate-600">{summaryLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'monthly', label: 'Monthly', icon: CalendarRange },
              { key: 'lead-time', label: 'Lead Time', icon: Clock3 },
              { key: 'events', label: 'Top Events', icon: Sparkles },
              { key: 'locations', label: 'Locations', icon: MapPin },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                size="sm"
                variant={activeChart === key ? 'default' : 'outline'}
                onClick={() => setActiveChart(key as typeof activeChart)}
                className={activeChart === key ? 'bg-red-700 hover:bg-red-800' : ''}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeChart === 'monthly' && (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={monthlyData} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" tickFormatter={formatNumber} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}h`} />
              <Tooltip formatter={(value: number, name: string) => name === 'penalty' ? formatCurrency(value) : formatNumber(Number(value))} />
              <Bar yAxisId="left" dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="avgLeadHours" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'lead-time' && (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={leadTimeData} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip formatter={(value: number, name: string) => name === 'penalty' ? formatCurrency(value) : formatNumber(Number(value))} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {leadTimeData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'events' && (
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie data={topEvents} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {topEvents.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatNumber(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'locations' && (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={locationData} margin={{ top: 10, right: 16, left: 4, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} interval={0} />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip formatter={(value: number) => formatNumber(Number(value))} />
              <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};