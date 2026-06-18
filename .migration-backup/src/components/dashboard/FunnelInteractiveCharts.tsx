
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Users, Target, Calendar, RotateCcw, Download, ZoomIn, Maximize2, Filter, Clock, IndianRupee } from 'lucide-react';
import { LeadsData } from '@/types/leads';
import { formatCurrency } from '@/utils/formatters';
import { isLeadConverted } from '@/utils/leadConversions';
import { cn } from '@/lib/utils';

interface FunnelInteractiveChartsProps {
  data: LeadsData[];
}

export const FunnelInteractiveCharts: React.FC<FunnelInteractiveChartsProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'source' | 'stage' | 'timeline'>('source');
  const [metricType, setMetricType] = useState<'volume' | 'conversion' | 'ltv'>('volume');

  const chartData = useMemo(() => {
    if (!data || !data.length) return [];

    switch (chartType) {
      case 'source': {
        const sourceStats = data.reduce((acc, lead) => {
          const source = lead.source || 'Unknown';
          if (!acc[source]) {
            acc[source] = { name: source, leads: 0, converted: 0, totalLTV: 0 };
          }
          acc[source].leads += 1;
          if (lead.conversionStatus === 'Converted') acc[source].converted += 1;
          acc[source].totalLTV += lead.ltv || 0;
          return acc;
        }, {} as Record<string, any>);

        return Object.values(sourceStats)
          .map((source: any) => ({
            name: source.name,
            volume: source.leads,
            conversion: source.leads > 0 ? (source.converted / source.leads) * 100 : 0,
            ltv: source.leads > 0 ? source.totalLTV / source.leads : 0
          }))
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 10);
      }

      case 'stage': {
        const stageStats = data.reduce((acc, lead) => {
          const stage = lead.stage || 'Unknown';
          if (!acc[stage]) {
            acc[stage] = { name: stage, leads: 0, converted: 0, totalLTV: 0 };
          }
          acc[stage].leads += 1;
          if (isLeadConverted(lead)) acc[stage].converted += 1;
          acc[stage].totalLTV += lead.ltv || 0;
          return acc;
        }, {} as Record<string, any>);

        return Object.values(stageStats)
          .map((stage: any) => ({
            name: stage.name,
            volume: stage.leads,
            conversion: stage.leads > 0 ? (stage.converted / stage.leads) * 100 : 0,
            ltv: stage.leads > 0 ? stage.totalLTV / stage.leads : 0
          }))
          .sort((a, b) => b.volume - a.volume);
      }

      case 'timeline': {
        const monthlyStats = data.reduce((acc, lead) => {
          if (!lead.createdAt) return acc;
          
          const date = new Date(lead.createdAt);
          if (isNaN(date.getTime())) return acc;
          
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!acc[monthKey]) {
            acc[monthKey] = { name: monthKey, leads: 0, converted: 0, totalLTV: 0 };
          }
          acc[monthKey].leads += 1;
          if (lead.conversionStatus === 'Converted') acc[monthKey].converted += 1;
          acc[monthKey].totalLTV += lead.ltv || 0;
          return acc;
        }, {} as Record<string, any>);

        return Object.values(monthlyStats)
          .map((month: any) => ({
            name: month.name,
            volume: month.leads,
            conversion: month.leads > 0 ? (month.converted / month.leads) * 100 : 0,
            ltv: month.leads > 0 ? month.totalLTV / month.leads : 0
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(-12);
      }

      default:
        return [];
    }
  }, [data, chartType]);

  const pieData = useMemo(() => {
    if (!data || !data.length) return [];

    const conversionStats = data.reduce((acc, lead) => {
      const status = lead.conversionStatus || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    
    return Object.entries(conversionStats)
      .map(([status, count], index) => ({
        name: status,
        value: count,
        percentage: ((count / data.length) * 100).toFixed(1),
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const getMetricValue = (item: any) => {
    switch (metricType) {
      case 'volume': return item.volume;
      case 'conversion': return item.conversion;
      case 'ltv': return item.ltv;
      default: return item.volume;
    }
  };

  const getMetricLabel = () => {
    switch (metricType) {
      case 'volume': return 'Lead Volume';
      case 'conversion': return 'Conversion Rate (%)';
      case 'ltv': return 'Average LTV (₹)';
      default: return 'Lead Volume';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          <p className="text-sm text-slate-600">
            {getMetricLabel()}: {
              metricType === 'ltv' 
                ? formatCurrency(payload[0].value)
                : metricType === 'conversion'
                ? `${payload[0].value.toFixed(1)}%`
                : payload[0].value.toLocaleString('en-IN')
            }
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="font-semibold text-slate-800 mb-2">{data.name}</p>
          <p className="text-sm text-slate-600">
            Count: {data.value.toLocaleString('en-IN')} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || !data.length) {
    return (
      <Card className="w-full bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-12">
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No data available for charts</p>
            <p className="text-sm">Adjust your filters to see analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Main Chart - Left Side */}
      <Card className="w-full bg-white/95 backdrop-blur-sm border-0 shadow-2xl overflow-hidden relative group">
        {/* 3D Card Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 rounded-xl transform translate-x-1 translate-y-1 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/5 to-slate-900/5 rounded-xl transform translate-x-0.5 translate-y-0.5 -z-10" />
        
        <CardHeader className="bg-gradient-to-r from-red-700 via-red-800 to-red-900 text-white border-0 relative overflow-hidden">
          {/* 3D Header Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-white text-lg font-bold">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg border border-white/20">
                  <BarChart3 className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
                {chartType === 'source' ? 'Lead Source Analytics' : chartType === 'stage' ? 'Funnel Stage Analytics' : 'Timeline Trend Analysis'}
              </CardTitle>
              
              {/* Interactive Controls */}
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm">
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Chart Type Selector */}
            <div className="flex gap-2 bg-black/20 rounded-xl p-2 border border-white/10 backdrop-blur-sm">
              <Button
                size="sm"
                variant={chartType === 'source' ? 'default' : 'ghost'}
                onClick={() => setChartType('source')}
                className={`transition-all duration-300 shadow-lg ${
                  chartType === 'source' 
                    ? 'bg-white text-red-900 hover:bg-white/90 shadow-xl border border-white/20' 
                    : 'text-white hover:bg-white/10 border border-white/20'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Source
              </Button>
              <Button
                size="sm"
                variant={chartType === 'stage' ? 'default' : 'ghost'}
                onClick={() => setChartType('stage')}
                className={`transition-all duration-300 shadow-lg ${
                  chartType === 'stage' 
                    ? 'bg-white text-red-900 hover:bg-white/90 shadow-xl border border-white/20' 
                    : 'text-white hover:bg-white/10 border border-white/20'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Stage
              </Button>
              <Button
                size="sm"
                variant={chartType === 'timeline' ? 'default' : 'ghost'}
                onClick={() => setChartType('timeline')}
                className={`transition-all duration-300 shadow-lg ${
                  chartType === 'timeline' 
                    ? 'bg-white text-red-900 hover:bg-white/90 shadow-xl border border-white/20' 
                    : 'text-white hover:bg-white/10 border border-white/20'
                }`}
              >
                <Clock className="w-4 h-4 mr-2" />
                Timeline
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Metric Type Selector */}
        <div className="px-6 pt-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
          <div className="flex flex-wrap gap-2 pb-4">
            <Badge 
              variant={metricType === 'volume' ? 'secondary' : 'outline'}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-105 shadow-sm",
                metricType === 'volume' 
                  ? "bg-red-700 text-white border-red-600 shadow-red-200" 
                  : "bg-white text-slate-600 border-slate-300 hover:bg-red-50 hover:border-red-300"
              )}
              onClick={() => setMetricType('volume')}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Volume
            </Badge>
            <Badge 
              variant={metricType === 'conversion' ? 'secondary' : 'outline'}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-105 shadow-sm",
                metricType === 'conversion' 
                  ? "bg-red-700 text-white border-red-600 shadow-red-200" 
                  : "bg-white text-slate-600 border-slate-300 hover:bg-red-50 hover:border-red-300"
              )}
              onClick={() => setMetricType('conversion')}
            >
              <Target className="w-3 h-3 mr-1" />
              Conversion
            </Badge>
            <Badge 
              variant={metricType === 'ltv' ? 'secondary' : 'outline'}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-105 shadow-sm",
                metricType === 'ltv' 
                  ? "bg-red-700 text-white border-red-600 shadow-red-200" 
                  : "bg-white text-slate-600 border-slate-300 hover:bg-red-50 hover:border-red-300"
              )}
              onClick={() => setMetricType('ltv')}
            >
              <IndianRupee className="w-3 h-3 mr-1" />
              LTV
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-6 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
          {/* 3D Content Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent rounded-full blur-xl" />
          
          <div className="h-80 relative z-10">
            <div className="absolute top-0 right-0 text-xs text-slate-500 font-medium bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm shadow-sm">
              {getMetricLabel()}
            </div>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'timeline' ? (
                <AreaChart data={chartData}>
                  <defs>
                    {/* 3D Gradient Effects */}
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                      <stop offset="50%" stopColor="#ea580c" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b91c1c" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={1}/>
                    </linearGradient>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#dc2626" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569"
                    fontSize={11}
                    fontWeight={600}
                    tickFormatter={(value) => String(value).slice(-5)}
                  />
                  <YAxis stroke="#475569" fontSize={11} fontWeight={600} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey={metricType} 
                    stroke="url(#lineGradient)" 
                    strokeWidth={4}
                    fill="url(#areaGradient)"
                    filter="url(#shadow)"
                    dot={{ fill: '#dc2626', strokeWidth: 3, r: 6, filter: 'url(#shadow)' }}
                    activeDot={{ r: 8, fill: '#b91c1c', stroke: '#ffffff', strokeWidth: 4 }}
                  />
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                  <defs>
                    {/* Enhanced 3D Bar Gradient */}
                    <linearGradient id="barGradient3D" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#b91c1c" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#991b1b" stopOpacity={0.8}/>
                    </linearGradient>
                    <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="#dc2626" floodOpacity="0.4"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569"
                    fontSize={11}
                    fontWeight={600}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#475569" fontSize={11} fontWeight={600} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey={metricType} 
                    fill="url(#barGradient3D)" 
                    radius={[6, 6, 0, 0]}
                    filter="url(#barShadow)"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced 3D Pie Chart - Right Side */}
      <Card className="w-full bg-white/95 backdrop-blur-sm border-0 shadow-2xl overflow-hidden relative group">
        {/* 3D Card Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-red-600/5 rounded-xl transform translate-x-1 translate-y-1 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/5 to-slate-900/5 rounded-xl transform translate-x-0.5 translate-y-0.5 -z-10" />
        
        <CardHeader className="bg-gradient-to-r from-orange-700 via-red-700 to-red-800 text-white border-0 relative overflow-hidden">
          {/* 3D Header Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          <div className="flex items-center justify-between relative z-10">
            <CardTitle className="flex items-center gap-3 text-white text-lg font-bold">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg border border-white/20">
                <PieChartIcon className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
              Conversion Status Distribution
            </CardTitle>
            
            {/* Interactive Controls */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
          {/* 3D Content Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-red-600/10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full blur-xl" />
          
          <div className="h-80 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {/* Enhanced 3D Pie Shadows */}
                  <filter id="pieShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="4" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.3"/>
                  </filter>
                  <filter id="pieInnerShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.2"/>
                  </filter>
                </defs>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  filter="url(#pieShadow)"
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="#ffffff"
                      strokeWidth={3}
                      filter="url(#pieInnerShadow)"
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Enhanced Statistics Summary */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {pieData.find(item => item.name.toLowerCase().includes('converted'))?.value || 0}
                </div>
                <div className="text-xs text-green-600 font-medium">Converted</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200">
                <div className="text-2xl font-bold text-red-700">
                  {pieData.find(item => !item.name.toLowerCase().includes('converted'))?.value || 0}
                </div>
                <div className="text-xs text-red-600 font-medium">Pending</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
