import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, PieChart as PieChartIcon, TrendingUp, Users, Target, CreditCard } from 'lucide-react';
import { LeadsData, LeadsMetricType } from '@/types/leads';
import { formatCurrency, formatNumber } from '@/utils/formatters';
interface LeadInteractiveChartProps {
  data: LeadsData[];
  title: string;
  activeMetric: LeadsMetricType;
}
type ChartType = 'bar' | 'line' | 'area' | 'pie';
export const LeadInteractiveChart: React.FC<LeadInteractiveChartProps> = ({
  data = [],
  title = 'Lead Performance Chart',
  activeMetric
}) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Add early return if no data
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No lead data available</p>
        </CardContent>
      </Card>
    );
  }

  // Process data for charts
  const processedData = React.useMemo(() => {
    const monthlyData = data.reduce((acc, item) => {
      // Add defensive check for createdAt
      if (!item.createdAt) {
        return acc;
      }
      
      const date = new Date(item.createdAt);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return acc;
      }
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          totalLeads: 0,
          trialsCompleted: 0,
          conversions: 0,
          totalLTV: 0,
          leadToTrialRate: 0,
          trialToMemberRate: 0,
          avgLTV: 0
        };
      }
      acc[monthKey].totalLeads++;
      if (item.stage === 'Trial Completed') acc[monthKey].trialsCompleted++;
      if (item.conversionStatus === 'Converted') acc[monthKey].conversions++;
      acc[monthKey].totalLTV += item.ltv || 0;
      return acc;
    }, {} as Record<string, any>);

    // Calculate rates and averages
    return Object.values(monthlyData).map((monthData: any) => ({
      ...monthData,
      leadToTrialRate: monthData.totalLeads > 0 ? monthData.trialsCompleted / monthData.totalLeads * 100 : 0,
      trialToMemberRate: monthData.trialsCompleted > 0 ? monthData.conversions / monthData.trialsCompleted * 100 : 0,
      avgLTV: monthData.totalLeads > 0 ? monthData.totalLTV / monthData.totalLeads : 0
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [data]);

  // Source distribution for pie chart
  const sourceData = React.useMemo(() => {
    const sources = data.reduce((acc, item) => {
      const source = item.source || 'Unknown';
      if (!acc[source]) {
        acc[source] = {
          name: source,
          value: 0,
          conversions: 0
        };
      }
      acc[source].value++;
      if (item.conversionStatus === 'Converted') {
        acc[source].conversions++;
      }
      return acc;
    }, {} as Record<string, any>);
    return Object.values(sources).map((source: any, index) => ({
      ...source,
      conversionRate: source.value > 0 ? source.conversions / source.value * 100 : 0,
      fill: `hsl(${index * 45}, 70%, 60%)`
    }));
  }, [data]);
  const colors = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(346, 87%, 43%)'];
  const getMetricValue = (dataPoint: any) => {
    switch (activeMetric) {
      case 'totalLeads':
        return dataPoint.totalLeads;
      case 'leadToTrialConversion':
        return dataPoint.leadToTrialRate;
      case 'trialToMembershipConversion':
        return dataPoint.trialToMemberRate;
      case 'ltv':
        return dataPoint.avgLTV;
      default:
        return dataPoint.totalLeads;
    }
  };
  const formatValue = (value: number) => {
    if (activeMetric === 'ltv') return formatCurrency(value);
    if (activeMetric.includes('Conversion')) return `${value.toFixed(1)}%`;
    return formatNumber(value);
  };
  const getChartIcon = (type: ChartType) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="w-4 h-4" />;
      case 'line':
        return <LineChartIcon className="w-4 h-4" />;
      case 'area':
        return <AreaChartIcon className="w-4 h-4" />;
      case 'pie':
        return <PieChartIcon className="w-4 h-4" />;
    }
  };
  const renderChart = () => {
    const commonProps = {
      data: chartType === 'pie' ? sourceData : processedData,
      margin: {
        top: 20,
        right: 30,
        left: 20,
        bottom: 60
      }
    };
    switch (chartType) {
      case 'bar':
        return <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="month" tick={{
            fontSize: 12
          }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{
            fontSize: 12
          }} />
            <Tooltip formatter={(value: number) => [formatValue(value), 'Value']} labelStyle={{
            color: '#1f2937'
          }} contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }} />
            <Legend />
            <Bar dataKey={item => getMetricValue(item)} fill={colors[0]} radius={[4, 4, 0, 0]} name={activeMetric.replace(/([A-Z])/g, ' $1').trim()} />
          </BarChart>;
      case 'line':
        return <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="month" tick={{
            fontSize: 12
          }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{
            fontSize: 12
          }} />
            <Tooltip formatter={(value: number) => [formatValue(value), 'Value']} labelStyle={{
            color: '#1f2937'
          }} contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }} />
            <Legend />
            <Line type="monotone" dataKey={item => getMetricValue(item)} stroke={colors[1]} strokeWidth={3} dot={{
            fill: colors[1],
            strokeWidth: 2,
            r: 6
          }} name={activeMetric.replace(/([A-Z])/g, ' $1').trim()} />
          </LineChart>;
      case 'area':
        return <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="month" tick={{
            fontSize: 12
          }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{
            fontSize: 12
          }} />
            <Tooltip formatter={(value: number) => [formatValue(value), 'Value']} labelStyle={{
            color: '#1f2937'
          }} contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }} />
            <Legend />
            <Area type="monotone" dataKey={item => getMetricValue(item)} stroke={colors[2]} fill={`${colors[2]}40`} strokeWidth={2} name={activeMetric.replace(/([A-Z])/g, ' $1').trim()} />
          </AreaChart>;
      case 'pie':
        return <PieChart {...commonProps}>
            <Pie data={sourceData} cx="50%" cy="50%" outerRadius={120} innerRadius={40} paddingAngle={2} dataKey="value" label={({
            name,
            percent
          }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
              {sourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [formatNumber(value), 'Leads']} labelStyle={{
            color: '#1f2937'
          }} contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }} />
            <Legend />
          </PieChart>;
      default:
        return null;
    }
  };
  const chartTypes: {
    type: ChartType;
    label: string;
  }[] = [{
    type: 'bar',
    label: 'Bar Chart'
  }, {
    type: 'line',
    label: 'Line Chart'
  }, {
    type: 'area',
    label: 'Area Chart'
  }, {
    type: 'pie',
    label: 'Source Distribution'
  }];
  return <Card className="bg-white shadow-lg border border-gray-200 col-span-full">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-800">{title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Interactive lead performance visualization</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {formatNumber(data.length)} Total Leads
            </Badge>
            
            <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
              {chartTypes.map(chart => <Button key={chart.type} variant={chartType === chart.type ? "default" : "ghost"} size="sm" onClick={() => setChartType(chart.type)} className={`h-8 gap-2 transition-all ${chartType === chart.type ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {getChartIcon(chart.type)}
                  <span className="hidden sm:inline">{chart.label}</span>
                </Button>)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="h-96 w-full bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {/* Chart Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-br-lg ">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total Leads</span>
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">
              {formatNumber(data.length)}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Trials Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-900 mt-1">
              {formatNumber(data.filter(item => item.stage === 'Trial Completed').length)}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Conversions</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-1">
              {formatNumber(data.filter(item => item.conversionStatus === 'Converted').length)}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Total LTV</span>
            </div>
            <div className="text-2xl font-bold text-orange-900 mt-1">
              {formatCurrency(data.reduce((sum, item) => sum + item.ltv, 0))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};