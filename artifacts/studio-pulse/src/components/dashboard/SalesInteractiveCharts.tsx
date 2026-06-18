import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const SALES_DARK_PALETTE = [
  '#0f172a',
  '#1e3a8a',
  '#1d4ed8',
  '#475569',
];

// Custom Tooltip with a dark, sales-themed design and correct value formatting
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur-xl">
        <p className="label font-semibold text-white/90 mb-1">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div style={{ width: 10, height: 10, backgroundColor: pld.color, borderRadius: '50%' }} />
            <span className="font-medium text-white/80">{`${pld.name}: `}</span>
            <span className="font-mono font-semibold text-white">
              {['revenue', 'value'].includes(String(pld.name)) ? formatCurrency(pld.value) : formatNumber(pld.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// A custom Bar component to create the 3D effect
const CustomBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  
  // Create a pseudo-3D effect by layering shapes
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} />
      {/* Top face - slightly lighter to emulate light source */}
      <path d={`M${x},${y} L${x + 8},${y - 5} L${x + width + 8},${y - 5} L${x + width},${y} Z`} fill="#ffffff" fillOpacity={0.08} />
      {/* Side face - slightly darker shadow */}
      <path d={`M${x + width},${y} L${x + width + 8},${y - 5} L${x + width + 8},${y + height - 5} L${x + width},${y + height} Z`} fill="#000000" fillOpacity={0.15} />
    </g>
  );
};

interface SalesInteractiveChartsProps {
  data: SalesData[];
}

export const SalesInteractiveCharts: React.FC<SalesInteractiveChartsProps> = React.memo(({ data }) => {
  const [timeRange, setTimeRange] = useState('6m');
  const [activeChart, setActiveChart] = useState('revenue');
  const [productMetric, setProductMetric] = useState('revenue');

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1m':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data;
    }
    
    return data.filter(item => {
      if (!item.paymentDate) return false;
      const itemDate = new Date(item.paymentDate);
      return itemDate >= startDate && itemDate <= now;
    });
  }, [data, timeRange]);

  // Monthly revenue trend data
  const monthlyRevenueData = useMemo(() => {
    if (!filteredData.length) return [];
    
    const monthlyGroups = filteredData.reduce((acc, item) => {
      if (!item.paymentDate) return acc;
      const date = new Date(item.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: date.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
          revenue: 0,
          transactions: 0,
          customers: new Set()
        };
      }
      
      acc[monthKey].revenue += item.paymentValue || 0;
      acc[monthKey].transactions += 1;
      acc[monthKey].customers.add(item.memberId);
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(monthlyGroups).map((group: any) => ({
      ...group,
      customers: group.customers.size
    })).sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [filteredData]);

  // Top 10 products data
  const topProductsData = useMemo(() => {
    if (!filteredData.length) return [];
    
    const productGroups = filteredData.reduce((acc, item) => {
      const product = item.cleanedProduct || 'Unknown Product';
      
      if (!acc[product]) {
        acc[product] = {
          name: product,
          revenue: 0,
          transactions: 0,
          customers: new Set(),
          units: 0
        };
      }
      
      acc[product].revenue += item.paymentValue || 0;
      acc[product].transactions += 1;
      acc[product].customers.add(item.memberId);
      acc[product].units += 1; // Each sale item is one unit
      
      return acc;
    }, {} as Record<string, any>);
    
    const products = Object.values(productGroups).map((product: any) => ({
      ...product,
      customers: product.customers.size
    }));
    
    // Sort by the selected metric
    let sortedProducts;
    switch (productMetric) {
      case 'transactions':
        sortedProducts = products.sort((a: any, b: any) => b.transactions - a.transactions);
        break;
      case 'customers':
        sortedProducts = products.sort((a: any, b: any) => b.customers - a.customers);
        break;
      case 'units':
        sortedProducts = products.sort((a: any, b: any) => b.units - a.units);
        break;
      default: // revenue
        sortedProducts = products.sort((a: any, b: any) => b.revenue - a.revenue);
    }
    
    return sortedProducts.slice(0, 10);
  }, [filteredData, productMetric]);

  // Category distribution data
  const categoryData = useMemo(() => {
    if (!filteredData.length) return [];
    
    const categoryGroups = filteredData.reduce((acc, item) => {
      const category = item.cleanedCategory || 'Uncategorized';
      
      if (!acc[category]) {
        acc[category] = 0;
      }
      
      acc[category] += item.paymentValue || 0;
      
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryGroups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const handleTimeRangeChange = useCallback((newRange: string) => {
    setTimeRange(newRange);
  }, []);

  const handleChartChange = useCallback((newChart: string) => {
    setActiveChart(newChart);
  }, []);

  const handleProductMetricChange = useCallback((newMetric: string) => {
    setProductMetric(newMetric);
  }, []);

  // Show loading state or empty state if no data
  if (!data || data.length === 0) {
    return (
  <Card className="bg-white/70 backdrop-blur-lg border-gray-200/80 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Interactive Sales Charts
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available for charts</p>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    switch (activeChart) {
      case 'revenue':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SALES_DARK_PALETTE[1]} stopOpacity={0.55}/>
                  <stop offset="95%" stopColor={SALES_DARK_PALETTE[1]} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#334155', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fill: '#334155', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke={SALES_DARK_PALETTE[0]}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                dot={{ stroke: SALES_DARK_PALETTE[0], strokeWidth: 2, r: 4, fill: 'white' }}
                activeDot={{ r: 8, fill: SALES_DARK_PALETTE[0], stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'products':
        return (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={productMetric === 'revenue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleProductMetricChange('revenue')}
              >
                Revenue
              </Button>
              <Button
                variant={productMetric === 'transactions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleProductMetricChange('transactions')}
              >
                Transactions
              </Button>
              <Button
                variant={productMetric === 'customers' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleProductMetricChange('customers')}
              >
                Customers
              </Button>
              <Button
                variant={productMetric === 'units' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleProductMetricChange('units')}
              >
                Units Sold
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProductsData} margin={{ left: 20, right: 30, top: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fill: '#334155', fontSize: 12 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis 
                  tickFormatter={(value) => {
                    if (productMetric === 'revenue') return formatCurrency(value);
                    return formatNumber(value);
                  }} 
                  tick={{ fill: '#334155', fontSize: 12 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(230, 230, 230, 0.4)'}} />
                <Bar dataKey={productMetric} shape={<CustomBar />} fill={SALES_DARK_PALETTE[1]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'categories':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                innerRadius={80}
                paddingAngle={3}
                dataKey="value"
                cornerRadius={8}
              >
                {categoryData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={SALES_DARK_PALETTE[index % SALES_DARK_PALETTE.length]} 
                    stroke={'#ffffff'}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ color: '#334155' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 shadow-sm">
                <BarChart3 className="h-4 w-4 text-slate-700" />
              </div>
              Interactive Sales Charts
            </CardTitle>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-sm font-medium text-slate-600">
              <Calendar className="h-4 w-4" />
              Time Range:
            </span>
            {[
              { key: '1m', label: 'Last Month' },
              { key: '3m', label: 'Last 3 Months' },
              { key: '6m', label: 'Last 6 Months' },
              { key: '1y', label: 'Last Year' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={timeRange === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimeRangeChange(key)}
                className="rounded-full"
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-sm font-medium text-slate-600">
              <TrendingUp className="h-4 w-4" />
              Chart Type:
            </span>
            <Button
              variant={activeChart === 'revenue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChartChange('revenue')}
              className="rounded-full"
            >
              <LineChartIcon className="w-4 h-4" />
              Revenue Trend
            </Button>
            <Button
              variant={activeChart === 'products' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChartChange('products')}
              className="rounded-full"
            >
              <BarChart3 className="w-4 h-4" />
              Top 10 Products
            </Button>
            <Button
              variant={activeChart === 'categories' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChartChange('categories')}
              className="rounded-full"
            >
              <PieChartIcon className="w-4 h-4" />
              Categories
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <motion.div
          key={activeChart + productMetric + timeRange}
          initial={{ opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-[0_12px_36px_rgba(15,23,42,0.06)]"
        >
          {renderChart()}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              Compact 3D surface with one active metric at a time.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              Metric switcher keeps comparisons tight and readable.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              Deep blue palette stays aligned with the sales section.
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
});

SalesInteractiveCharts.displayName = 'SalesInteractiveCharts';
