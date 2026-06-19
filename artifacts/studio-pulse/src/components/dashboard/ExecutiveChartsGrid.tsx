
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, TrendingUp, Users, Target, Activity, DollarSign,
  Zap, LineChart as LineChartIcon, AreaChart as AreaChartIcon, BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, Brush, ReferenceLine, ComposedChart
} from 'recharts';
import { formatCurrency } from '@/utils/formatters';

type ChartType = 'bar' | 'line' | 'area';

interface ExecutiveChartsGridProps {
  data: {
    sales: any[];
    sessions: any[];
    payroll: any[];
    newClients: any[];
    leads: any[];
  };
  showTrends?: boolean;
}

const PALETTE = {
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
  blue: '#3B82F6',
  slate: '#94A3B8',
  indigo: '#6366F1',
};

const ChartTypeToggle: React.FC<{ value: ChartType; onChange: (t: ChartType) => void }> = ({ value, onChange }) => {
  const opts: { type: ChartType; icon: React.ElementType; label: string }[] = [
    { type: 'bar', icon: BarChart2, label: 'Bar' },
    { type: 'line', icon: LineChartIcon, label: 'Line' },
    { type: 'area', icon: AreaChartIcon, label: 'Area' },
  ];
  return (
    <div className="flex rounded-lg border border-white/20 bg-white/10 p-0.5 gap-0.5">
      {opts.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          title={label}
          onClick={() => onChange(type)}
          className={`flex h-6 w-6 items-center justify-center rounded transition-all duration-150 ${
            value === type ? 'bg-white text-slate-800 shadow-sm' : 'text-white/60 hover:text-white'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
};

const CustomTooltipStyle = {
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(15,23,42,0.92)',
  color: '#f8fafc',
  fontSize: 12,
  backdropFilter: 'blur(8px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

function renderDualChart(
  chartType: ChartType,
  data: any[],
  bars: { dataKey: string; name: string; color: string; dashed?: boolean }[]
) {
  const commonProps = {
    data,
    margin: { top: 4, right: 8, bottom: 0, left: 0 },
  };
  const commonAxisProps = {
    tick: { fontSize: 11, fill: '#94a3b8' },
    axisLine: false,
    tickLine: false,
  };
  const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />;

  if (chartType === 'bar') {
    return (
      <BarChart {...commonProps}>
        {commonGrid}
        <XAxis dataKey={bars[0]?.dataKey === 'revenue' ? 'date' : (data[0] && Object.keys(data[0])[0])} {...commonAxisProps} />
        <YAxis {...commonAxisProps} />
        <Tooltip contentStyle={CustomTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Brush dataKey={Object.keys(data[0] || {})[0]} height={18} stroke="#334155" fill="#0f172a" travellerWidth={6} />
        {bars.map(b => (
          <Bar key={b.dataKey} dataKey={b.dataKey} fill={b.color} name={b.name} radius={[4, 4, 0, 0]} maxBarSize={40} />
        ))}
      </BarChart>
    );
  }
  if (chartType === 'line') {
    return (
      <LineChart {...commonProps}>
        {commonGrid}
        <XAxis dataKey={Object.keys(data[0] || {})[0]} {...commonAxisProps} />
        <YAxis {...commonAxisProps} />
        <Tooltip contentStyle={CustomTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Brush dataKey={Object.keys(data[0] || {})[0]} height={18} stroke="#334155" fill="#0f172a" travellerWidth={6} />
        {bars.map(b => (
          <Line
            key={b.dataKey}
            type="monotone"
            dataKey={b.dataKey}
            stroke={b.color}
            strokeWidth={2.5}
            name={b.name}
            dot={{ r: 3, fill: b.color }}
            activeDot={{ r: 5 }}
            strokeDasharray={b.dashed ? '6 3' : undefined}
          />
        ))}
      </LineChart>
    );
  }
  return (
    <ComposedChart {...commonProps}>
      {commonGrid}
      <XAxis dataKey={Object.keys(data[0] || {})[0]} {...commonAxisProps} />
      <YAxis {...commonAxisProps} />
      <Tooltip contentStyle={CustomTooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
      <Brush dataKey={Object.keys(data[0] || {})[0]} height={18} stroke="#334155" fill="#0f172a" travellerWidth={6} />
      {bars.map((b, i) => (
        <Area
          key={b.dataKey}
          type="monotone"
          dataKey={b.dataKey}
          stroke={b.color}
          fill={b.color}
          fillOpacity={i === 0 ? 0.25 : 0.12}
          strokeWidth={2}
          name={b.name}
        />
      ))}
    </ComposedChart>
  );
}

export const ExecutiveChartsGrid: React.FC<ExecutiveChartsGridProps> = ({ data, showTrends = false }) => {
  const [revenueChartType, setRevenueChartType] = useState<ChartType>('area');
  const [conversionChartType, setConversionChartType] = useState<ChartType>('bar');
  const [sessionChartType, setSessionChartType] = useState<ChartType>('bar');
  const [retentionChartType, setRetentionChartType] = useState<ChartType>('area');
  const [trainerChartType, setTrainerChartType] = useState<ChartType>('bar');
  const [productChartType, setProductChartType] = useState<ChartType>('bar');

  const revenueData = useMemo(() => {
    const daily: Record<string, { date: string; revenue: number; transactions: number; netRevenue: number }> = {};
    data.sales.forEach(sale => {
      const d = new Date(sale.paymentDate);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (!daily[key]) daily[key] = { date: key, revenue: 0, transactions: 0, netRevenue: 0 };
      daily[key].revenue += sale.paymentValue || 0;
      daily[key].netRevenue += (sale.paymentValue || 0) - (sale.paymentVAT || 0);
      daily[key].transactions += 1;
    });
    return Object.values(daily).slice(-14);
  }, [data.sales]);

  const conversionData = useMemo(() => {
    const sources: Record<string, { source: string; leads: number; conversions: number; rate: number }> = {};
    data.leads.forEach(lead => {
      const src = lead.source || 'Unknown';
      if (!sources[src]) sources[src] = { source: src, leads: 0, conversions: 0, rate: 0 };
      sources[src].leads += 1;
      if (lead.conversionStatus === 'Converted') sources[src].conversions += 1;
    });
    return Object.values(sources)
      .map(s => ({ ...s, rate: s.leads > 0 ? Math.round((s.conversions / s.leads) * 100) : 0 }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 8);
  }, [data.leads]);

  const sessionTypeData = useMemo(() => {
    const types: Record<string, { name: string; sessions: number; avgFill: number; totalCap: number; totalCheckins: number }> = {};
    data.sessions.forEach(session => {
      const t = session.cleanedClass || 'Unknown';
      if (!types[t]) types[t] = { name: t, sessions: 0, avgFill: 0, totalCap: 0, totalCheckins: 0 };
      types[t].sessions += 1;
      types[t].totalCap += Number(session.capacity) || 0;
      types[t].totalCheckins += Number(session.checkedInCount) || 0;
    });
    return Object.values(types)
      .map(t => ({ ...t, avgFill: t.totalCap > 0 ? Math.round((t.totalCheckins / t.totalCap) * 100) : 0 }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 7);
  }, [data.sessions]);

  const retentionTrendData = useMemo(() => {
    const monthly: Record<string, { month: string; newClients: number; converted: number; retained: number; convRate: number; retRate: number }> = {};
    data.newClients.forEach(c => {
      const d = new Date(c.firstVisitDate);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!monthly[key]) monthly[key] = { month: key, newClients: 0, converted: 0, retained: 0, convRate: 0, retRate: 0 };
      monthly[key].newClients += 1;
      if (c.conversionStatus === 'Converted') monthly[key].converted += 1;
      if (c.retentionStatus === 'Retained') monthly[key].retained += 1;
    });
    return Object.values(monthly)
      .map(m => ({
        ...m,
        convRate: m.newClients > 0 ? Math.round((m.converted / m.newClients) * 100) : 0,
        retRate: m.newClients > 0 ? Math.round((m.retained / m.newClients) * 100) : 0,
      }))
      .slice(-12);
  }, [data.newClients]);

  const trainerData = useMemo(() => {
    return data.payroll
      .sort((a, b) => (b.totalPaid || 0) - (a.totalPaid || 0))
      .slice(0, 7)
      .map(t => ({
        trainer: (t.teacherName || 'Unknown').split(' ')[0],
        revenue: Math.round(t.totalPaid || 0),
        sessions: t.totalSessions || 0,
        classAvg: t.totalCustomers && t.totalSessions ? Math.round(t.totalCustomers / t.totalSessions) : 0,
      }));
  }, [data.payroll]);

  const productData = useMemo(() => {
    const products: Record<string, { name: string; revenue: number; units: number }> = {};
    data.sales.forEach(s => {
      const p = s.cleanedProduct || s.cleanedCategory || 'Other';
      if (!products[p]) products[p] = { name: p, revenue: 0, units: 0 };
      products[p].revenue += (s.paymentValue || 0) - (s.paymentVAT || 0);
      products[p].units += 1;
    });
    return Object.values(products).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
      .map(p => ({ ...p, revenue: Math.round(p.revenue) }));
  }, [data.sales]);

  const summaryStats = useMemo(() => {
    const totalRev = data.sales.reduce((s, d) => s + (d.paymentValue || 0) - (d.paymentVAT || 0), 0);
    const totalSessions = data.sessions.length;
    const totalAttendance = data.sessions.reduce((s, d) => s + (Number(d.checkedInCount) || 0), 0);
    const totalCap = data.sessions.reduce((s, d) => s + (Number(d.capacity) || 0), 0);
    const avgFill = totalCap > 0 ? (totalAttendance / totalCap) * 100 : 0;
    const newClientCount = data.newClients.filter(c => (c.isNew || '').toLowerCase().startsWith('new')).length;
    const convertedCount = data.newClients.filter(c => c.conversionStatus === 'Converted' && (c.isNew || '').toLowerCase().startsWith('new')).length;
    const convRate = newClientCount > 0 ? (convertedCount / newClientCount) * 100 : 0;
    const totalLeads = data.leads.length;
    const convertedLeads = data.leads.filter(l => l.conversionStatus === 'Converted').length;
    const leadConvRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    return {
      totalRev: Math.round(totalRev),
      totalSessions,
      avgFill: Math.round(avgFill),
      newClientCount,
      convRate: Math.round(convRate),
      totalLeads,
      leadConvRate: Math.round(leadConvRate),
      revPerSession: totalSessions > 0 ? Math.round(totalRev / totalSessions) : 0,
    };
  }, [data]);

  const chartHeaderCls = 'flex items-center justify-between gap-3 px-4 py-3 rounded-t-2xl text-white';

  const charts = [
    {
      id: 'revenue',
      title: 'Revenue Trend',
      subtitle: `Last 14 days · ${formatCurrency(summaryStats.totalRev)} total`,
      icon: TrendingUp,
      gradient: 'from-blue-700 via-blue-600 to-indigo-600',
      chartType: revenueChartType,
      setChartType: setRevenueChartType,
      content: (
        <ResponsiveContainer width="100%" height={260}>
          {renderDualChart(revenueChartType, revenueData, [
            { dataKey: 'netRevenue', name: 'Net Revenue', color: PALETTE.blue },
            { dataKey: 'transactions', name: 'Transactions', color: PALETTE.cyan, dashed: true },
          ])}
        </ResponsiveContainer>
      ),
    },
    {
      id: 'conversion',
      title: 'Lead Conversion by Source',
      subtitle: `${summaryStats.totalLeads} leads · ${summaryStats.leadConvRate}% avg rate`,
      icon: Target,
      gradient: 'from-emerald-700 via-emerald-600 to-teal-600',
      chartType: conversionChartType,
      setChartType: setConversionChartType,
      content: (
        <ResponsiveContainer width="100%" height={260}>
          {renderDualChart(conversionChartType, conversionData, [
            { dataKey: 'leads', name: 'Total Leads', color: PALETTE.slate },
            { dataKey: 'conversions', name: 'Conversions', color: PALETTE.emerald },
            { dataKey: 'rate', name: 'Conv Rate %', color: PALETTE.amber },
          ])}
        </ResponsiveContainer>
      ),
    },
    {
      id: 'sessions',
      title: 'Class Type Performance',
      subtitle: `${summaryStats.totalSessions} sessions · ${summaryStats.avgFill}% avg fill`,
      icon: Activity,
      gradient: 'from-purple-700 via-purple-600 to-pink-600',
      chartType: sessionChartType,
      setChartType: setSessionChartType,
      content: (
        <ResponsiveContainer width="100%" height={260}>
          {renderDualChart(sessionChartType, sessionTypeData, [
            { dataKey: 'sessions', name: 'Sessions', color: PALETTE.purple },
            { dataKey: 'avgFill', name: 'Fill Rate %', color: PALETTE.rose },
          ])}
        </ResponsiveContainer>
      ),
    },
    {
      id: 'retention',
      title: 'Conversion & Retention Trend',
      subtitle: `${summaryStats.convRate}% avg conversion · monthly cohort view`,
      icon: Users,
      gradient: 'from-rose-700 via-rose-600 to-orange-600',
      chartType: retentionChartType,
      setChartType: setRetentionChartType,
      content: (
        <ResponsiveContainer width="100%" height={260}>
          {renderDualChart(retentionChartType, retentionTrendData, [
            { dataKey: 'newClients', name: 'New Clients', color: PALETTE.blue },
            { dataKey: 'convRate', name: 'Conv Rate %', color: PALETTE.emerald },
            { dataKey: 'retRate', name: 'Ret Rate %', color: PALETTE.purple },
          ])}
        </ResponsiveContainer>
      ),
    },
    {
      id: 'trainers',
      title: 'Trainer Revenue Ranking',
      subtitle: `Top ${trainerData.length} trainers by revenue`,
      icon: Zap,
      gradient: 'from-amber-600 via-orange-600 to-red-600',
      chartType: trainerChartType,
      setChartType: setTrainerChartType,
      content: (
        <ResponsiveContainer width="100%" height={260}>
          {renderDualChart(trainerChartType, trainerData, [
            { dataKey: 'revenue', name: 'Revenue', color: PALETTE.amber },
            { dataKey: 'classAvg', name: 'Class Avg', color: PALETTE.cyan },
          ])}
        </ResponsiveContainer>
      ),
    },
    {
      id: 'products',
      title: 'Top Products by Revenue',
      subtitle: `${summaryStats.revPerSession > 0 ? `₹${summaryStats.revPerSession}/session · ` : ''}top 8 by net revenue`,
      icon: DollarSign,
      gradient: 'from-cyan-700 via-cyan-600 to-blue-600',
      chartType: productChartType,
      setChartType: setProductChartType,
      content: (
        <ResponsiveContainer width="100%" height={260}>
          {renderDualChart(productChartType, productData, [
            { dataKey: 'revenue', name: 'Net Revenue', color: PALETTE.cyan },
            { dataKey: 'units', name: 'Units Sold', color: PALETTE.indigo },
          ])}
        </ResponsiveContainer>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: formatCurrency(summaryStats.totalRev), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Sessions Run', value: summaryStats.totalSessions.toLocaleString(), icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg Fill Rate', value: `${summaryStats.avgFill}%`, icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Lead Conv Rate', value: `${summaryStats.leadConvRate}%`, icon: Target, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 leading-tight">{stat.value}</p>
              <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {charts.map((chart, idx) => (
          <motion.div
            key={chart.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + idx * 0.06, duration: 0.4 }}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className={`${chartHeaderCls} bg-gradient-to-r ${chart.gradient}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <chart.icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold leading-tight text-white truncate">{chart.title}</p>
                  <p className="text-[11px] text-white/60 leading-tight truncate">{chart.subtitle}</p>
                </div>
              </div>
              <ChartTypeToggle value={chart.chartType} onChange={chart.setChartType} />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={chart.chartType}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 pt-3"
              >
                {chart.content}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
